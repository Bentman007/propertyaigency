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
    const { messages, property, user_id, session_id } = await request.json()

    // Get existing searcher profile
    let profile: any = {}
    if (user_id) {
      const { data } = await supabase
        .from('searcher_profiles')
        .select('*')
        .eq('user_id', user_id)
        .single()
      profile = data || {}
    }

    // Get agent availability
    const { data: slots } = await supabase
      .from('agent_availability')
      .select('*')
      .eq('agent_id', property.user_id)
      .eq('is_booked', false)
      .gte('date', new Date().toISOString().split('T')[0])
      .order('date', { ascending: true })
      .limit(5)

    const systemPrompt = `You are an AI Property Concierge for a specific property listing. You are knowledgeable, warm and helpful.

PROPERTY DETAILS:
${JSON.stringify({
  title: property.title,
  address: property.address,
  suburb: property.suburb,
  city: property.city,
  province: property.province,
  price: property.price,
  price_type: property.price_type,
  bedrooms: property.bedrooms,
  bathrooms: property.bathrooms,
  garages: property.garages,
  size_sqm: property.size_sqm,
  property_type: property.property_type,
  description: property.description,
  has_pool: property.has_pool,
  has_solar: property.has_solar,
  has_garden: property.has_garden,
  has_braai: property.has_braai,
  has_gated_community: property.has_gated_community,
  has_24hr_security: property.has_24hr_security,
  has_pet_friendly: property.has_pet_friendly,
  is_golf_estate: property.is_golf_estate,
  has_gym: property.has_gym,
  has_aircon: property.has_aircon
})}

WHAT YOU KNOW ABOUT THIS SEARCHER SO FAR:
${JSON.stringify(profile)}

AVAILABLE VIEWING SLOTS:
${JSON.stringify(slots || [])}

YOUR ROLE:
1. Answer ALL questions about this property knowledgeably
2. For area questions - use your knowledge of ${property.suburb}, ${property.city}
3. Calculate bond repayments when asked (use prime rate of 11.75% in South Africa)
4. Calculate transfer costs, bond registration costs when asked
5. Naturally build a picture of who this person is through conversation
6. When they show strong interest, naturally offer a viewing
7. NEVER ask more than one question at a time
8. Keep responses concise and warm

BOND CALCULATOR (if asked):
- Bond amount = purchase price - deposit
- Monthly repayment ≈ (bond amount × monthly rate) / (1 - (1 + monthly rate)^-240)
- Monthly rate = annual rate / 12
- Use 11.75% annual rate as default

WHEN TO OFFER VIEWING:
- They've asked 3+ questions showing genuine interest
- They mention timeline, budget, or current situation
- They ask about transfer dates or occupation
- Include at end: <show_booking>true</show_booking>

PROFILE UPDATES - include when you learn something:
<profile>
{"budget_max": 15000, "move_timeline": "end of May", "has_kids": true}
</profile>

LEAD SCORING - include in every response:
<lead>
{"score": 75, "temperature": "warm", "reason": "Asking detailed questions, has timeline"}
</lead>

Temperatures: hot (80-100, ready to move, specific needs), warm (50-79, actively looking), cold (0-49, browsing)`

    const response = await anthropic.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 800,
      system: systemPrompt,
      messages: messages
    })

    const content = response.content[0].type === 'text' ? response.content[0].text : ''
    let cleanContent = content
    let showBooking = false
    let leadData = { score: 0, temperature: 'cold', reason: '' }
    let profileUpdate = {}

    // Extract show_booking
    if (content.includes('<show_booking>true</show_booking>')) {
      showBooking = true
      cleanContent = cleanContent.replace(/<show_booking>[\s\S]*?<\/show_booking>/, '').trim()
    }

    // Extract profile
    const profileMatch = content.match(/<profile>([\s\S]*?)<\/profile>/)
    if (profileMatch) {
      try {
        profileUpdate = JSON.parse(profileMatch[1])
        if (user_id && Object.keys(profileUpdate).length > 0) {
          await supabase.from('searcher_profiles').upsert({
            user_id,
            ...profile,
            ...profileUpdate,
            updated_at: new Date().toISOString()
          })
        }
      } catch (e) {}
      cleanContent = cleanContent.replace(/<profile>[\s\S]*?<\/profile>/, '').trim()
    }

    // Extract lead
    const leadMatch = content.match(/<lead>([\s\S]*?)<\/lead>/)
    if (leadMatch) {
      try { leadData = JSON.parse(leadMatch[1]) } catch (e) {}
      cleanContent = cleanContent.replace(/<lead>[\s\S]*?<\/lead>/, '').trim()
    }

    // Save conversation
    await supabase.from('property_conversations').upsert({
      property_id: property.id,
      user_id: user_id || null,
      session_id,
      messages,
      lead_score: leadData.score,
      lead_temperature: leadData.temperature,
      profile_updates: profileUpdate,
      updated_at: new Date().toISOString()
    }, { onConflict: 'session_id' })

    return NextResponse.json({
      message: cleanContent,
      show_booking: showBooking,
      slots: slots || [],
      lead: leadData
    })

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
