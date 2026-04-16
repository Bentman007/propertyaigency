export const maxDuration = 10
export const dynamic = 'force-dynamic'

import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  try {
    const { messages, user_id } = await request.json()

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

    const systemPrompt = `You are PropertyAI Concierge, a warm and expert South African property search assistant. 

AVAILABLE PROPERTIES:
${JSON.stringify(availableProperties.map(p => ({
  id: p.id,
  title: p.title,
  address: p.address,
  suburb: p.suburb,
  city: p.city,
  province: p.province,
  price: p.price,
  price_type: p.price_type,
  bedrooms: p.bedrooms,
  bathrooms: p.bathrooms,
  size_sqm: p.size_sqm,
  property_type: p.property_type,
  has_pool: p.has_pool,
  has_solar: p.has_solar,
  has_garden: p.has_garden,
  has_braai: p.has_braai,
  has_gated_community: p.has_gated_community,
  has_24hr_security: p.has_24hr_security,
  has_pet_friendly: p.has_pet_friendly,
  is_golf_estate: p.is_golf_estate,
  has_gym: p.has_gym,
  has_aircon: p.has_aircon,
  description: p.description?.substring(0, 200),
  photos: p.photos?.slice(0, 1)
})), null, 2)}

EXISTING PROFILE FOR THIS USER:
${JSON.stringify(existingProfile)}

INSTRUCTIONS:
1. Be warm and conversational - like a knowledgeable friend
2. Ask ONE question at a time - never bombard them
3. Naturally weave in qualifying questions through conversation
4. Good topics to naturally explore: timeline to move, current situation, family needs, budget flexibility
5. When you learn something important, include a profile update at the end
6. Once you have enough info (2-4 exchanges), search and present matches
7. Maximum 3 properties per response

PRESENTING PROPERTIES - include at end of message:
<properties>
[{"id": "id", "match_score": 95, "match_reason": "Matches all requirements"}]
</properties>

PROFILE UPDATES - include at end of message when you learn something:
<profile>
{"budget_min": 10000, "budget_max": 15000, "move_timeline": "end of May", "has_kids": true, "locations": ["Benoni", "Boksburg"]}
</profile>

LEAD SCORING - include at end of every message:
<lead>
{"score": 65, "temperature": "warm", "reason": "Has specific timeline and budget"}
</lead>

Lead score guide:
- 80-100 = Hot (specific timeline, knows budget, ready to move)
- 50-79 = Warm (actively looking, has general requirements)  
- 0-49 = Cold (just browsing, no urgency)`

    const response = await anthropic.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 1000,
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

    // Extract lead score
    const leadMatch = content.match(/<lead>([\s\S]*?)<\/lead>/)
    if (leadMatch) {
      try {
        leadData = JSON.parse(leadMatch[1])
      } catch (e) {}
      cleanContent = cleanContent.replace(/<lead>[\s\S]*?<\/lead>/, '').trim()
    }

    return NextResponse.json({ 
      message: cleanContent,
      properties: matchedProperties,
      lead: leadData
    })

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
