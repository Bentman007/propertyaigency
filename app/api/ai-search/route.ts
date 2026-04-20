export const maxDuration = 10
export const dynamic = 'force-dynamic'

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

    const { data: properties } = await supabase
      .from('properties')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false })

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

    const systemPrompt = `You are PropertyAI Concierge, a warm South African property search assistant. Be brief and show results fast.

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
  is_golf_estate: p.is_golf_estate
})))}

EXISTING PROFILE FOR THIS USER:
${JSON.stringify(existingProfile)}

INSTRUCTIONS:
1. Be warm and concise - get to property results FAST
2. If they mention location + rent/buy → search immediately, show results, ask budget AFTER
3. Only ask ONE follow-up question maximum before showing results
4. NEVER ask about: age of children, relationship status, personal circumstances
5. Good questions ONLY: budget range, number of bedrooms (if not mentioned)
6. Show properties after MAX 2 exchanges - people want to see results quickly
7. Maximum 3 properties per response
8. After showing properties, THEN refine based on their reaction
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

SUGGESTED PROMPTS - include at end of every message, 3-4 short tap-able responses the user might want to say next, based on the conversation:
<prompts>
["Option 1", "Option 2", "Option 3"]
</prompts>

LEAD SCORING - include at end of every message:
<lead>
{"score": 65, "temperature": "warm", "reason": "Has specific timeline and budget"}
</lead>

Lead score guide:
- 80-100 = Hot (specific timeline, knows budget, ready to move)
- 50-79 = Warm (actively looking, has general requirements)  
- 0-49 = Cold (just browsing, no urgency)`

    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 400,
      system: systemPrompt,
      messages: messages
    })

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

    return NextResponse.json({ 
      message: cleanContent,
      properties: matchedProperties,
      lead: leadData,
      suggested_prompts: suggestedPrompts,
      property_count: matchedProperties.length
    })

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
