export const maxDuration = 15
export const dynamic = 'force-dynamic'

// Simple cache for common searches — resets on deployment
const searchCache = new Map<string, {result: any, timestamp: number}>()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { rateLimit } from '@/lib/rateLimit'

export async function POST(request: NextRequest) {
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Rate limit: 20 searches per minute per IP
  const ip = request.headers.get('x-forwarded-for') || 'unknown'
  if (!rateLimit(`ai-search:${ip}`, 20, 60000)) {
    return NextResponse.json({ error: 'Too many requests. Please wait a moment.' }, { status: 429 })
  }

  try {
    const body = await request.json()
    const user_id = body.user_id
    const messages = body.messages || [
      ...(body.history || []),
      { role: 'user', content: body.message || '' }
    ]

    const allMessages = body.messages || []
    const conversationText = allMessages.map((m: any) => m.content).join(' ').toLowerCase()

    // Build smart pre-filter
    let query = supabase.from('properties').select('*').eq('status', 'active')

    const budgetMatch = conversationText.match(/r\s*(\d[\d\s,]*)\s*(k|000|million|m)?/i)
    if (budgetMatch) {
      let budget = parseInt(budgetMatch[1].replace(/[\s,]/g, ''))
      if (budgetMatch[2]?.toLowerCase() === 'k') budget *= 1000
      if (budgetMatch[2]?.toLowerCase().includes('m') || budgetMatch[2]?.toLowerCase().includes('million')) budget *= 1000000
      if (budget > 0) query = query.lte('price', budget * 1.3)
    }

    const bedroomMatch = conversationText.match(/(\d+)\s*bed/i)
    if (bedroomMatch) {
      const beds = parseInt(bedroomMatch[1])
      if (beds > 0) query = query.gte('bedrooms', beds - 1).lte('bedrooms', beds + 1)
    }

    const locations = ['sandton', 'johannesburg', 'cape town', 'durban', 'pretoria', 'centurion',
      'midrand', 'fourways', 'randburg', 'roodepoort', 'soweto', 'benoni', 'boksburg',
      'germiston', 'kempton', 'umhlanga', 'ballito', 'stellenbosch', 'paarl', 'george',
      'port elizabeth', 'gqeberha', 'bloemfontein', 'east london', 'polokwane', 'nelspruit']
    const foundLocations = locations.filter(loc => conversationText.includes(loc))
    if (foundLocations.length > 0) {
      query = query.or(foundLocations.map(loc => `suburb.ilike.%${loc}%,city.ilike.%${loc}%`).join(','))
    }

    query = query.order('created_at', { ascending: false }).limit(50)
    const { data: properties } = await query

    let rejectedIds: string[] = []
    let existingProfile: any = {}
    if (user_id) {
      const { data: rejected } = await supabase
        .from('rejected_properties')
        .select('property_id')
        .eq('user_id', user_id)
      rejectedIds = rejected?.map(r => r.property_id) || []

      const { data: profile } = await supabase
        .from('searcher_profiles')
        .select('*')
        .eq('user_id', user_id)
        .single()
      existingProfile = profile || {}
    }

    const availableProperties = properties?.filter(p => !rejectedIds.includes(p.id)) || []

    // Compute relaxation counts when results are few — gives the AI exact numbers to cite
    let relaxationHints = ''
    if (availableProperties.length < 10) {
      try {
        const rejectedClause = rejectedIds.length > 0 ? rejectedIds.join(',') : null
        const relaxQueries: Promise<{type: string, count: number}>[] = []

        const applyBase = (q: any) => {
          if (rejectedClause) q = q.not('id', 'in', `(${rejectedClause})`)
          return q
        }

        // Without location filter
        if (foundLocations.length > 0) {
          let q = applyBase(supabase.from('properties').select('id', { count: 'exact', head: true }).eq('status', 'active'))
          if (bedroomMatch) { const b = parseInt(bedroomMatch[1]); q = q.gte('bedrooms', b - 1).lte('bedrooms', b + 1) }
          if (budgetMatch) {
            let bud = parseInt(budgetMatch[1].replace(/[\s,]/g, ''))
            if (budgetMatch[2]?.toLowerCase() === 'k') bud *= 1000
            if (budgetMatch[2]?.toLowerCase().includes('m')) bud *= 1000000
            if (bud > 0) q = q.lte('price', bud * 1.3)
          }
          relaxQueries.push(q.then((r: any) => ({ type: 'location', count: r.count || 0 })))
        }

        // Without bedroom filter
        if (bedroomMatch) {
          let q = applyBase(supabase.from('properties').select('id', { count: 'exact', head: true }).eq('status', 'active'))
          if (foundLocations.length > 0) q = q.or(foundLocations.map(loc => `suburb.ilike.%${loc}%,city.ilike.%${loc}%`).join(','))
          if (budgetMatch) {
            let bud = parseInt(budgetMatch[1].replace(/[\s,]/g, ''))
            if (budgetMatch[2]?.toLowerCase() === 'k') bud *= 1000
            if (budgetMatch[2]?.toLowerCase().includes('m')) bud *= 1000000
            if (bud > 0) q = q.lte('price', bud * 1.3)
          }
          relaxQueries.push(q.then((r: any) => ({ type: 'bedrooms', count: r.count || 0 })))
        }

        // With budget +30%
        if (budgetMatch) {
          let bud = parseInt(budgetMatch[1].replace(/[\s,]/g, ''))
          if (budgetMatch[2]?.toLowerCase() === 'k') bud *= 1000
          if (budgetMatch[2]?.toLowerCase().includes('m')) bud *= 1000000
          if (bud > 0) {
            let q = applyBase(supabase.from('properties').select('id', { count: 'exact', head: true }).eq('status', 'active').lte('price', bud * 1.6))
            if (foundLocations.length > 0) q = q.or(foundLocations.map(loc => `suburb.ilike.%${loc}%,city.ilike.%${loc}%`).join(','))
            if (bedroomMatch) { const b = parseInt(bedroomMatch[1]); q = q.gte('bedrooms', b - 1).lte('bedrooms', b + 1) }
            relaxQueries.push(q.then((r: any) => ({ type: 'budget', count: r.count || 0 })))
          }
        }

        const results = await Promise.all(relaxQueries)
        const hints: string[] = []
        for (const r of results) {
          const extra = r.count - availableProperties.length
          if (extra > 0) {
            if (r.type === 'location') hints.push(`Removing location filter (${foundLocations[0]}) → ${extra} more properties`)
            if (r.type === 'bedrooms') hints.push(`Removing bedroom restriction → ${extra} more properties`)
            if (r.type === 'budget') hints.push(`Increasing budget by 30% → ${extra} more properties`)
          }
        }
        if (hints.length > 0) {
          relaxationHints = `\nSEARCH RELAXATION DATA — use ONLY these exact numbers when suggesting widening. Never invent counts.\n${hints.join('\n')}\nExample: "If we drop the bedroom restriction I can show you X more" — fill X from the data above.`
        }
      } catch (_) { /* best-effort */ }
    }

    const buyerName = existingProfile?.full_name?.split(' ')[0] || body.buyer_name || ''
    const nameGreeting = buyerName ? `The buyer's name is ${buyerName} — use it naturally once when greeting or when it feels warm, not every message.` : ''

    const systemPrompt = `You are the PropertyAIgency Concierge. You are direct, warm and efficient. Your only job is to find the perfect property as fast as possible.

PERSONALITY RULES — CRITICAL:
- Keep responses SHORT. 1-3 sentences maximum unless showing properties.
- Never describe areas — the buyer knows where they want to live.
- Never use filler phrases like "Great choice!", "Absolutely!", "Of course!", "Sure thing!" — just respond.
- Use the buyer's name once naturally, not in every message.
- Ask ONE question at a time. Never ask two things at once.
- When you have results, write ONE short sentence then include the <properties> tag. Do NOT repeat the count in text when you include <properties> — the UI shows a separate card with the count and a "Yes, show me!" button.
- When you need more info, ask the single most important missing piece.
- CRITICAL: Plain conversational text ONLY. NO markdown. No **bold**, no *italic*, no bullet points with -, no numbered lists. Just plain sentences.
- Never list properties in text — they appear as cards automatically via the properties tag.
${nameGreeting}

AVAILABLE PROPERTIES:
${JSON.stringify(availableProperties.map(p => ({
  id: p.id,
  title: p.title,
  suburb: p.suburb,
  city: p.city,
  price: p.price,
  price_type: p.price_type,
  bedrooms: p.bedrooms,
  bathrooms: p.bathrooms,
  property_type: p.property_type,
  has_pool: p.has_pool,
  has_solar: p.has_solar,
  has_gated_community: p.has_gated_community,
  has_24hr_security: p.has_24hr_security,
  has_pet_friendly: p.has_pet_friendly,
  is_golf_estate: p.is_golf_estate,
  negotiable: p.negotiable,
  motivated_seller: p.motivated_seller,
  priced_to_go: p.priced_to_go,
  close_offer_considered: p.close_offer_considered,
  custom_features: p.custom_features,
  available_from: p.available_from,
  lease_term: p.lease_term,
  pets_allowed: p.pets_allowed
})))}

EXISTING PROFILE FOR THIS USER (use naturally — never say "I have your profile" or mention data storage — just recall preferences like a friend would):
${JSON.stringify(existingProfile)}

IMPORTANT: If you know their preferences from before, reference them naturally. Say "Are you still looking for a 3-bed in Sandton?" NOT "I can see from your profile that...". Never mention profiles, data or tracking.

CURRENT SEARCH RESULTS COUNT: ${availableProperties.length} properties match the current filters.
${relaxationHints}

QUALIFICATION FLOW:
- If user says "show me what's available", "just show me what's available", "show me listings", "what do you have", "what is available" or similar → show ALL available properties immediately, no questions first
- Need at least 2 of these before showing results: location, budget, bedrooms
- If vague but there are properties available: show them anyway with a note "Here's what we have — tell me more about what you're looking for and I can narrow it down"
- If too many results (20+): show top 5 and say "I have X more — tell me your budget or area to narrow down"
- After showing results: "Any catch your eye? I can filter by budget, area or features — just ask"
- When results are few: cite specific relaxation numbers from SEARCH RELAXATION DATA if available. Never invent numbers.

SEARCH RULES:
- Always show WHY each property matches in one short phrase
- PRICE FLEXIBILITY (hidden from buyer):
  If a buyer's budget is within 10% below asking price AND the property has negotiable=true, motivated_seller=true, priced_to_go=true or close_offer_considered=true → include this property and say "This one is slightly above your budget but worth a look — there may be room to negotiate." Never reveal seller flexibility directly.

RESULT COUNT HANDLING:
- 0 matches: Show the closest properties anyway — never return nothing. "I don't have an exact match right now, but here are some similar options:"
- 1-5 matches: Show all immediately. One short sentence, then <properties> tag.
- 6-20 matches: Show top 3. One sentence. Suggest narrowing.
- 21-50 matches: Do NOT show properties. Ask ONE qualifying question.
- 50+ matches: Qualify first with ONE question.

COST EFFICIENCY — only include <properties> tags when you have 5 or fewer results to show.

ALL MATCHES REVIEWED — When the user says they've reviewed/saved/passed on all their matches:
1. Acknowledge briefly: "You've been through all your matches!"
2. Immediately cite the most impactful relaxation from SEARCH RELAXATION DATA using the exact number: e.g. "If we drop the pool requirement I can show you 12 more." If no SEARCH RELAXATION DATA: ask "What was missing most — price, size, location or a feature?"
3. Suggest the ONE relaxation with the most extra properties.
4. Ask ONE question: "What was the main reason you passed on most of them?" — use the answer to sharpen future searches.

NEVER ask about: relationship status, age of children, employment details, personal circumstances.
If user asks to set an alert: "You're all set! I've already built your search profile. You'll automatically get a push notification the moment a matching property is listed."
If no exact match: include the closest properties in <properties> and say "I don't have an exact match right now — but I've found some close options. I'll alert you the moment something better comes in."

PRESENTING PROPERTIES - include at end of message:
<properties>
[{"id": "id", "match_score": 95, "match_reason": "Matches all requirements"}]
</properties>

PROFILE UPDATES - include at end of message when you learn something new:
<profile>
{"budget_min": 10000, "budget_max": 15000, "move_timeline": "end of May", "has_kids": true, "locations": ["Benoni", "Boksburg"], "must_haves": ["pet friendly", "garden"], "deal_breakers": ["no garden"], "nice_to_have": ["pool", "solar"], "worth_more": ["bar area", "man cave", "extra garage"], "budget_flexible": true}
</profile>

Profile field guide:
- must_haves: absolute requirements
- deal_breakers: will immediately reject if present
- nice_to_have: would love but not essential
- worth_more: features they'd stretch budget for
- budget_flexible: true if willing to pay more for the right property

SUGGESTED PROMPTS — include at end of every message. Must be contextually relevant:
- If asking about bedrooms → ["2 bedrooms", "3 bedrooms", "4 bedrooms", "4+ bedrooms"]
- If asking about budget → ["Under R10,000/mo", "R10,000-R20,000/mo", "R20,000-R35,000/mo", "R35,000+/mo"]
- If asking about area → suggest 3-4 popular SA areas based on context
- If asking about must-haves → ["Pool & braai area", "Big garden", "Maids quarters", "Pet friendly", "No preference"]
- If too many results → ["Add pool requirement", "Smaller area only", "Stricter budget", "Show me anyway"]
- If too few results → use exact wording from SEARCH RELAXATION DATA, e.g. ["Drop pool req (+12 more)", "Widen past Sandton (+8 more)", "Increase budget (+5 more)"]
- If showing results → ["Show more options", "Narrow search further", "Book a viewing", "Save these results"]
- After all matches reviewed → use specific relaxations from SEARCH RELAXATION DATA as chip labels, plus "Just show me what's available"
<prompts>
["Option 1", "Option 2", "Option 3", "Option 4"]
</prompts>

FEEDBACK COLLECTION - After the user has sent 10+ messages, naturally weave in a feedback request ONCE. Something like: "By the way — you've been using PropertyAIgency for a while and I'd love to pass some thoughts to our team. Is there anything you wish worked differently?" When they give feedback:
<feedback>{"text": "their exact feedback here", "sentiment": "positive/neutral/negative"}</feedback>

NEGATIVE FEEDBACK — when a buyer rejects 3+ properties, ask ONE question: "Just so I can find better matches — what was it about those properties that didn't work for you?"

LEAD SCORING - include at end of every message:
<lead>
{"score": 65, "temperature": "warm", "reason": "Has specific timeline and budget"}
</lead>

Lead score guide:
- 80-100 = Hot (specific timeline, knows budget, ready to move)
- 50-79 = Warm (actively looking, has general requirements)
- 0-49 = Cold (just browsing, no urgency)`

    const lastUserMessage = messages[messages.length - 1]?.content || ''
    const cacheKey = `${lastUserMessage.toLowerCase().trim().slice(0, 100)}`
    const cached = searchCache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return NextResponse.json(cached.result)
    }

    let response: any = null
    let attempts = 0
    while (attempts < 3) {
      try {
        response = await anthropic.messages.create({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 400,
          system: systemPrompt,
          messages: messages
        })
        break
      } catch (err: any) {
        attempts++
        if (err?.status === 429 && attempts < 3) {
          await new Promise(r => setTimeout(r, 1000 * attempts))
          continue
        }
        throw err
      }
    }

    const content = response.content[0].type === 'text' ? response.content[0].text : ''

    let matchedProperties: any[] = []
    let profileUpdate = {}
    let leadData = { score: 0, temperature: 'cold', reason: '' }
    let cleanContent = content
      .replace(/<profile>[\s\S]*?<\/profile>/g, '')
      .replace(/<lead>[\s\S]*?<\/lead>/g, '')
      .replace(/<properties>[\s\S]*?<\/properties>/g, '')
      .replace(/<prompts>[\s\S]*?<\/prompts>/g, '')
      .replace(/<feedback>[\s\S]*?<\/feedback>/g, '')
      .trim()

    // Extract properties
    const propertiesMatch = content.match(/<properties>([\s\S]*?)<\/properties>/)
    if (propertiesMatch) {
      try {
        const propertyIds = JSON.parse(propertiesMatch[1])
        matchedProperties = propertyIds.map((match: any) => {
          const prop = availableProperties.find(p => p.id === match.id)
          return prop ? { ...prop, match_score: match.match_score, match_reason: match.match_reason } : null
        }).filter(Boolean)
      } catch (e) {}
    }

    // Extract profile updates
    const profileMatch = content.match(/<profile>([\s\S]*?)<\/profile>/)
    if (profileMatch) {
      try {
        profileUpdate = JSON.parse(profileMatch[1])
        if (user_id && Object.keys(profileUpdate).length > 0) {
          await supabase.from('searcher_profiles').upsert({
            user_id,
            ...existingProfile,
            ...profileUpdate,
            updated_at: new Date().toISOString()
          })
        }
      } catch (e) {}
    }

    // Extract suggested prompts
    let suggestedPrompts: string[] = []
    const promptsMatch = content.match(/<prompts>([\s\S]*?)<\/prompts>/)
    if (promptsMatch) {
      try { suggestedPrompts = JSON.parse(promptsMatch[1]) } catch (e) {}
    }

    // Extract and save feedback
    const feedbackMatch = content.match(/<feedback>([\s\S]*?)<\/feedback>/)
    if (feedbackMatch && user_id) {
      try {
        const feedbackData = JSON.parse(feedbackMatch[1])
        await supabase.from('feedback').insert({
          user_id,
          user_type: 'buyer',
          feedback: feedbackData.text,
          sentiment: feedbackData.sentiment
        })
        await supabase.from('aisistant_messages').insert({
          agent_id: 'a947747b-d98c-4d77-8647-c4dd930d3fe7',
          message_type: 'feedback',
          title: '💬 New Buyer Feedback',
          content: `Sentiment: ${feedbackData.sentiment}\n\nFeedback:\n${feedbackData.text}`,
          is_read: false
        })
      } catch(e) {}
    }

    // Extract lead score
    const leadMatch = content.match(/<lead>([\s\S]*?)<\/lead>/)
    if (leadMatch) {
      try { leadData = JSON.parse(leadMatch[1]) } catch (e) {}
    }

    // Final strip of any remaining tags and markdown
    cleanContent = cleanContent
      .replace(/<profile>[\s\S]*?<\/profile>/g, '')
      .replace(/<lead>[\s\S]*?<\/lead>/g, '')
      .replace(/<properties>[\s\S]*?<\/properties>/g, '')
      .replace(/<prompts>[\s\S]*?<\/prompts>/g, '')
      .replace(/<feedback>[\s\S]*?<\/feedback>/g, '')
      .replace(/<profile>/g, '').replace(/<\/profile>/g, '')
      .replace(/<lead>/g, '').replace(/<\/lead>/g, '')
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/^[\s]*[-*]\s/gm, '')
      .replace(/^\d+\.\s/gm, '')
      .trim()

    const result = {
      message: cleanContent,
      properties: matchedProperties,
      lead: leadData,
      suggested_prompts: suggestedPrompts,
      property_count: matchedProperties.length
    }

    searchCache.set(cacheKey, { result, timestamp: Date.now() })

    // Fire competitor search if no matches and profile has location
    if (matchedProperties.length === 0 && user_id && existingProfile?.locations?.length > 0) {
      fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/competitor-search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id,
          location: existingProfile.locations?.[0] || '',
          bedrooms: existingProfile.bedrooms_min || existingProfile.bedrooms_max || '',
          budget: existingProfile.budget_max || existingProfile.budget_min || '',
          price_type: existingProfile.price_type || 'sale',
          must_haves: existingProfile.must_haves || []
        })
      }).catch(() => {})
    }

    return NextResponse.json(result)

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
