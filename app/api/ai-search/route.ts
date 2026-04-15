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

    // Get all properties from database
    const { data: properties } = await supabase
      .from('properties')
      .select('*')
      .order('created_at', { ascending: false })

    // Get rejected properties for this user
    let rejectedIds: string[] = []
    if (user_id) {
      const { data: rejected } = await supabase
        .from('rejected_properties')
        .select('property_id')
        .eq('user_id', user_id)
      rejectedIds = rejected?.map(r => r.property_id) || []
    }

    const availableProperties = properties?.filter(p => !rejectedIds.includes(p.id)) || []

    const systemPrompt = `You are PropertyAI Concierge, a friendly and expert South African property search assistant. Your job is to help people find their perfect property through natural conversation.

You have access to these available properties in the database:
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
  garages: p.garages,
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

INSTRUCTIONS:
1. Have a warm, friendly conversation to understand what the person wants
2. Ask smart follow-up questions ONE AT A TIME - never bombard them with multiple questions
3. Good questions to ask: budget range, flexibility on budget, location flexibility, must-have features, nice-to-have features, timeline for moving, reason for moving (helps understand priorities)
4. Once you have enough information (after 2-4 exchanges), search the properties and present matches
5. When presenting properties, be enthusiastic but honest
6. If someone seems unsure, help them clarify their priorities
7. If no properties match perfectly, present the closest matches and explain what's different
8. Always respond in a conversational, warm tone - like a knowledgeable friend helping them find a home

PRESENTING PROPERTIES:
When you have enough info to search, respond with a JSON block at the END of your message in this exact format:
<properties>
[{"id": "property-id-here", "match_score": 95, "match_reason": "Matches all your requirements - 3 beds, pool, solar, secure estate within budget"}]
</properties>

Only include properties that genuinely match. Maximum 3 properties per response.
Match score: 95-100 = perfect match, 80-94 = great match, 60-79 = good match with some compromises.

If you need more information before searching, do NOT include the properties block yet.
South African context: prices in Rands, areas like Johannesburg, Cape Town, Durban, Pretoria, Benoni, Sandton etc.`

    const response = await anthropic.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 1000,
      system: systemPrompt,
      messages: messages
    })

    const content = response.content[0].type === 'text' ? response.content[0].text : ''
    
    // Extract property matches if present
    const propertiesMatch = content.match(/<properties>([\s\S]*?)<\/properties>/)
    let matchedProperties = []
    let cleanContent = content

    if (propertiesMatch) {
      try {
        const propertyIds = JSON.parse(propertiesMatch[1])
        matchedProperties = propertyIds.map((match: any) => {
          const prop = availableProperties.find(p => p.id === match.id)
          return prop ? { ...prop, match_score: match.match_score, match_reason: match.match_reason } : null
        }).filter(Boolean)
        cleanContent = content.replace(/<properties>[\s\S]*?<\/properties>/, '').trim()
      } catch (e) {}
    }

    return NextResponse.json({ 
      message: cleanContent,
      properties: matchedProperties
    })

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
