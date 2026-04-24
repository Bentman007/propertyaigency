export const maxDuration = 10
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
    // Support both messages array and legacy message+history format
    const messages = body.messages || [
      ...( body.history || []),
      { role: 'user', content: body.message || '' }
    ]

    // Extract basic filters from conversation to pre-filter before sending to AI
    const allMessages = body.messages || []
    const conversationText = allMessages.map((m: any) => m.content).join(' ').toLowerCase()

    // Build smart pre-filter
    let query = supabase.from('properties').select('*').eq('status', 'active')

    // Price filter
    const budgetMatch = conversationText.match(/r\s*(\d[\d\s,]*)\s*(k|000|million|m)?/i)
    if (budgetMatch) {
      let budget = parseInt(budgetMatch[1].replace(/[\s,]/g, ''))
      if (budgetMatch[2]?.toLowerCase() === 'k') budget *= 1000
      if (budgetMatch[2]?.toLowerCase().includes('m') || budgetMatch[2]?.toLowerCase().includes('million')) budget *= 1000000
      if (budget > 0) query = query.lte('price', budget * 1.3) // 30% tolerance
    }

    // Bedrooms filter
    const bedroomMatch = conversationText.match(/(\d+)\s*bed/i)
    if (bedroomMatch) {
      const beds = parseInt(bedroomMatch[1])
      if (beds > 0) query = query.gte('bedrooms', beds - 1).lte('bedrooms', beds + 1)
    }

    // Location filter
    const locations = ['sandton', 'johannesburg', 'cape town', 'durban', 'pretoria', 'centurion',
      'midrand', 'fourways', 'randburg', 'roodepoort', 'soweto', 'benoni', 'boksburg',
      'germiston', 'kempton', 'umhlanga', 'ballito', 'stellenbosch', 'paarl', 'george',
      'port elizabeth', 'gqeberha', 'bloemfontein', 'east london', 'polokwane', 'nelspruit']
    const foundLocations = locations.filter(loc => conversationText.includes(loc))
    if (foundLocations.length > 0) {
      query = query.or(foundLocations.map(loc => `suburb.ilike.%${loc}%,city.ilike.%${loc}%`).join(','))
    }

    // Limit results sent to AI — max 50 pre-filtered properties
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

    const buyerName = existingProfile?.full_name?.split(' ')[0] || body.buyer_name || ''
    const nameGreeting = buyerName ? `The buyer's name is ${buyerName} — use it naturally once when greeting or when it feels warm, not every message.` : ''

    const systemPrompt = `You are the PropertyAIgency Concierge. You are direct, warm and efficient. Your only job is to find the perfect property as fast as possible.

PERSONALITY RULES — CRITICAL:
- Keep responses SHORT. 1-3 sentences maximum unless showing properties.
- Never describe areas — the buyer knows where they want to live.
- Never use filler phrases like "Great choice!", "Absolutely!", "Of course!", "Sure thing!" — just respond.
- Use the buyer's name once naturally, not in every message.
- Ask ONE question at a time. Never ask two things at once.
- When you have results, lead with the number: "I found 4 matches." Then show them.
- When you need more info, ask the single most important missing piece.
- Plain conversational text. No essays. No bullet points unless listing properties.
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
Use this number in your response as described in RESULT COUNT HANDLING above.

QUALIFICATION FLOW:
- Need at least 2 of these before showing results: location, budget, bedrooms
- If vague: ask the single most important missing piece
- Order to ask: bedrooms → budget → area → must-haves (one at a time)
- Once you have enough: search and show results immediately
- After results: "Any catch your eye, or shall I tweak the search?"

SEARCH RULES:
- Always show WHY each property matches in one short phrase
- PRICE FLEXIBILITY (hidden from buyer — use intelligently):
  If a buyer's budget is within 10% below asking price AND the property has negotiable=true, motivated_seller=true, priced_to_go=true or close_offer_considered=true → include this property and say something like "This one is slightly above your budget but worth a look — there may be room to negotiate."
  Never reveal the seller's flexibility directly. Just recommend the viewing.

RESULT COUNT HANDLING — this is important:
- If 0 matches: "I couldn't find an exact match with those criteria. Should we widen the search? We could look at a slightly higher budget, nearby areas, or drop to 2 bedrooms?"
- If 1-5 matches: Show all of them immediately — "Great news, I found [X] properties that tick all your boxes!"
- If 6-20 matches: Show top 3, say "I found [X] properties matching your criteria — here are the top 3. Want to see more or shall we narrow it down further?"
- If 21-50 matches: Do NOT show properties yet. Say something like: "I have [X] matches for you already — that's a great sign! Before I show you, shall we narrow it down a little to find your perfect match? For example, do you need outdoor space like a pool or braai area? Or a maids room? A big garden?" 
- If 50+ matches: DEFINITELY qualify further first. Say: "Wow, [X] properties match your search — you have plenty of choice! Let's find your perfect one rather than overwhelming you. Quick question — is a garden or outdoor entertaining area important to you?"

COST EFFICIENCY — only include <properties> tags when you have 5 or fewer results to show. For larger result sets, have the conversation first to narrow down.

NEVER ask about: relationship status, age of children, employment details, personal circumstances
9. If the user asks to set an alert or be notified of new properties: tell them "✅ You're all set! Based on our conversation I've already built your search profile. You'll automatically get a push notification the moment a matching property is listed." Never pretend to do something you haven't done.
10. If no properties match exactly, say something like: "I don't have an exact match for you right now — but I've found some close options I can send to your dashboard. I'll also automatically alert you the moment something matching your criteria gets listed. Please make sure your notifications are on so you don't miss out! 🔔" Then include the closest properties in the <properties> tag.

PRESENTING PROPERTIES - include at end of message:
<properties>
[{"id": "id", "match_score": 95, "match_reason": "Matches all requirements"}]
</properties>

PROFILE UPDATES - include at end of message when you learn something new about the buyer:
<profile>
{"budget_min": 10000, "budget_max": 15000, "move_timeline": "end of May", "has_kids": true, "locations": ["Benoni", "Boksburg"], "must_haves": ["pet friendly", "garden"], "deal_breakers": ["no garden"], "nice_to_have": ["pool", "solar"], "worth_more": ["bar area", "man cave", "extra garage"], "budget_flexible": true}
</profile>

Profile field guide:
- must_haves: absolute requirements, will not consider without
- deal_breakers: will immediately reject if present
- nice_to_have: would love but not essential
- worth_more: features they would stretch their budget for
- budget_flexible: true if they indicate willingness to pay more for the right features

Listen carefully for budget flexibility cues like "I would pay more for...", "worth stretching for...", "if it had X I would consider higher price"

SUGGESTED PROMPTS - include at end of every message. These must be contextually relevant:
- If asking about bedrooms → ["2 bedrooms", "3 bedrooms", "4 bedrooms", "4+ bedrooms"]
- If asking about budget → ["Under R10,000/mo", "R10,000-R20,000/mo", "R20,000-R35,000/mo", "R35,000+/mo"] (adjust for sale if relevant)
- If asking about area → suggest 3-4 popular SA areas based on context
- If asking about must-haves → ["Pool & braai area", "Big garden", "Maids quarters", "Pet friendly", "No preference"]
- If too many results → ["Add pool requirement", "Smaller area only", "Stricter budget", "Show me anyway"]
- If too few results → ["Widen to nearby areas", "Increase budget slightly", "Consider 1 less bedroom", "Show me what you have"]
- If showing results → ["Show more options", "Narrow search further", "Book a viewing", "Save these results"]
<prompts>
["Option 1", "Option 2", "Option 3", "Option 4"]
</prompts>

FEEDBACK COLLECTION - After the user has sent 10+ messages in total across all conversations, naturally weave in a feedback request once. Do it warmly and conversationally, not as a survey. Something like: "By the way — you've been using PropertyAIgency for a while now and I'd love to pass some thoughts to our team. Is there anything you wish worked differently, or any features you'd love to see? Even small things really help us improve!" Only ask ONCE — if they've already given feedback, never ask again. When they give feedback, include at end of message:
<feedback>{"text": "their exact feedback here", "sentiment": "positive/neutral/negative"}</feedback>

NEGATIVE FEEDBACK — when a buyer rejects/skips properties:
After a buyer rejects 3+ properties, ask ONE question: "Just so I can find you better matches — what was it about those properties that didn't work for you?"
Use their answer to update their profile deal_breakers and must_haves.
When new properties come in that have the same issue, warn them: "I found 2 new matches — they have smaller pools like the ones you didn't like before, want to see them anyway?"
When briefing agents (in lead profile), include rejection reasons: "This buyer rejected similar properties due to [reason] — highlight [feature] at the viewing."

PROACTIVE FOLLOW-UP — when buyer has seen all matches:
If the buyer has been shown all available properties and none are saved or booked, say:
"I've shown you everything that matches your search right now. I'll notify you the moment something new comes in. While we wait — is there anything about your search I should adjust? Sometimes widening the area or budget slightly opens up a lot more options."
Then ask ONE clarifying question to potentially widen the search.

LEAD SCORING - include at end of every message:
<lead>
{"score": 65, "temperature": "warm", "reason": "Has specific timeline and budget"}
</lead>

Lead score guide:
- 80-100 = Hot (specific timeline, knows budget, ready to move)
- 50-79 = Warm (actively looking, has general requirements)  
- 0-49 = Cold (just browsing, no urgency)`

    // Check cache first
    const lastUserMessage = messages[messages.length - 1]?.content || ''
    const cacheKey = `${lastUserMessage.toLowerCase().trim().slice(0, 100)}`
    const cached = searchCache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return NextResponse.json(cached.result)
    }

    // Retry logic for rate limits
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
        break // Success — exit retry loop
      } catch (err: any) {
        attempts++
        if (err?.status === 429 && attempts < 3) {
          await new Promise(r => setTimeout(r, 1000 * attempts)) // Wait 1s, 2s, 3s
          continue
        }
        throw err // Give up after 3 attempts
      }
    }

    const content = response.content[0].type === 'text' ? response.content[0].text : ''
    
    let matchedProperties = []
    let profileUpdate = {}
    let leadData = { score: 0, temperature: 'cold', reason: '' }
    let cleanContent = content

    // Extract properties
    const propertiesMatch = content.match(/<properties>([\s\S]*?)<\/properties>/)
    if (propertiesMatch) {
      // Rate limit: 20 searches per minute per IP
  const ip = request.headers.get('x-forwarded-for') || 'unknown'
  if (!rateLimit(`ai-search:${ip}`, 20, 60000)) {
    return NextResponse.json({ error: 'Too many requests. Please wait a moment.' }, { status: 429 })
  }

  try {
        const propertyIds = JSON.parse(propertiesMatch[1])
        matchedProperties = propertyIds.map((match: any) => {
          const prop = availableProperties.find(p => p.id === match.id)
          return prop ? { ...prop, match_score: match.match_score, match_reason: match.match_reason } : null
        }).filter(Boolean)
      } catch (e) {}
      cleanContent = cleanContent.replace(/<properties>[\s\S]*?<\/properties>/, '').trim()
    }

    // Extract profile updates
    const profileMatch = content.match(/<profile>([\s\S]*?)<\/profile>/)
    if (profileMatch) {
      // Rate limit: 20 searches per minute per IP
  const ip = request.headers.get('x-forwarded-for') || 'unknown'
  if (!rateLimit(`ai-search:${ip}`, 20, 60000)) {
    return NextResponse.json({ error: 'Too many requests. Please wait a moment.' }, { status: 429 })
  }

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
      cleanContent = cleanContent.replace(/<profile>[\s\S]*?<\/profile>/, '').trim()
    }

    // Extract suggested prompts
    let suggestedPrompts: string[] = []
    const promptsMatch = content.match(/<prompts>([\s\S]*?)<\/prompts>/)
    if (promptsMatch) {
      try { suggestedPrompts = JSON.parse(promptsMatch[1]) } catch (e) {}
      cleanContent = cleanContent.replace(/<prompts>[\s\S]*?<\/prompts>/, '').trim()
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
        // Notify admin
        await supabase.from('aisistant_messages').insert({
          agent_id: 'a947747b-d98c-4d77-8647-c4dd930d3fe7',
          message_type: 'feedback',
          title: '💬 New Buyer Feedback',
          content: `**Sentiment:** ${feedbackData.sentiment}

**Feedback:**
${feedbackData.text}`,
          is_read: false
        })
        cleanContent = cleanContent.replace(/<feedback>[\s\S]*?<\/feedback>/, '').trim()
      } catch(e) {}
    }

    // Extract lead score
    const leadMatch = content.match(/<lead>([\s\S]*?)<\/lead>/)
    if (leadMatch) {
      // Rate limit: 20 searches per minute per IP
  const ip = request.headers.get('x-forwarded-for') || 'unknown'
  if (!rateLimit(`ai-search:${ip}`, 20, 60000)) {
    return NextResponse.json({ error: 'Too many requests. Please wait a moment.' }, { status: 429 })
  }

  try {
        leadData = JSON.parse(leadMatch[1])
      } catch (e) {}
      cleanContent = cleanContent.replace(/<lead>[\s\S]*?<\/lead>/, '').trim()
    }

    const result = { 
      message: cleanContent,
      properties: matchedProperties,
      lead: leadData,
      suggested_prompts: suggestedPrompts,
      property_count: matchedProperties.length
    }
    
    // Cache this result
    searchCache.set(cacheKey, { result, timestamp: Date.now() })

    // If no matches found and user has enough criteria — search competitor sites
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
