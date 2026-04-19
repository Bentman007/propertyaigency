import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { rateLimit } from '@/lib/rateLimit'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  // Rate limit: 30 messages per minute per IP
  const ip = request.headers.get('x-forwarded-for') || 'unknown'
  if (!rateLimit(`property-chat:${ip}`, 30, 60000)) {
    return NextResponse.json({ error: 'Too many requests. Please wait a moment.' }, { status: 429 })
  }

  try {
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const body = await request.json()
    const { messages, property, user_id, session_id } = body

    if (!messages || !property) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const systemPrompt = `You are an AI Property Concierge for ${property.title} in ${property.suburb}, ${property.city}. 
You are knowledgeable, warm and helpful. Answer questions about this property and the area.
Keep responses concise and conversational.

Property details:
- Price: R${property.price?.toLocaleString()} ${property.price_type === 'rent' ? 'per month' : ''}
- Bedrooms: ${property.bedrooms}
- Bathrooms: ${property.bathrooms}
- Description: ${property.description || 'A wonderful property'}

For bond calculations use 11.75% annual interest rate over 20 years.

Include at end of every message:
<lead>{"score": 20, "temperature": "cold", "reason": "Initial contact"}</lead>`

    const response = await anthropic.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 500,
      system: systemPrompt,
      messages: messages
    })

    const content = response.content[0].type === 'text' ? response.content[0].text : ''
    
    let cleanContent = content
    let leadData = { score: 20, temperature: 'cold', reason: '' }

    const leadMatch = content.match(/<lead>([\s\S]*?)<\/lead>/)
    if (leadMatch) {
      // Rate limit: 30 messages per minute per IP
  const ip = request.headers.get('x-forwarded-for') || 'unknown'
  if (!rateLimit(`property-chat:${ip}`, 30, 60000)) {
    return NextResponse.json({ error: 'Too many requests. Please wait a moment.' }, { status: 429 })
  }

  try { leadData = JSON.parse(leadMatch[1]) } catch (e) {}
      cleanContent = cleanContent.replace(/<lead>[\s\S]*?<\/lead>/, '').trim()
    }

    // Save conversation async (don't await - don't block response)
    if (session_id && property.id) {
      supabase.from('property_conversations').upsert({
        property_id: property.id,
        user_id: user_id || null,
        session_id,
        messages,
        lead_score: leadData.score,
        lead_temperature: leadData.temperature,
        updated_at: new Date().toISOString()
      }, { onConflict: 'session_id' }).then(() => {}) as any
    }

    return NextResponse.json({
      message: cleanContent,
      show_booking: false,
      slots: [],
      lead: leadData
    })

  } catch (error: any) {
    console.error('Property chat error:', error.message)
    return NextResponse.json({ 
      error: error.message || 'Unknown error'
    }, { status: 500 })
  }
}
