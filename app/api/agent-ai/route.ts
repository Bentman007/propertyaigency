export const dynamic = 'force-dynamic'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  const { agent_id, message, property_id, property_title, context } = await req.json()

  // Get property details if property_id provided
  let propertyInfo = ''
  if (property_id) {
    const { data: prop } = await supabase.from('properties').select('*').eq('id', property_id).single()
    if (prop) propertyInfo = `Property: ${prop.title} | ${prop.suburb}, ${prop.city} | R${prop.price?.toLocaleString()} | ${prop.bedrooms}bed ${prop.bathrooms}bath | Status: ${prop.status} | Views: ${prop.total_views || 0}`
  }

  // Get recent bookings for this property
  let bookingInfo = ''
  if (property_id) {
    const { data: bookings } = await supabase.from('viewing_bookings').select('*').eq('property_id', property_id).order('created_at', { ascending: false }).limit(3)
    if (bookings?.length) bookingInfo = `Recent bookings: ${bookings.map(b => `${b.status} on ${new Date(b.booking_date).toLocaleDateString('en-ZA')}`).join(', ')}`
  }

  const res = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 300,
    messages: [{
      role: 'user',
      content: `You are the PropertyAIgency AIsistant helping a South African estate agent. Be concise, practical and helpful. Plain text only, no markdown.

${propertyInfo ? `Property context: ${propertyInfo}` : ''}
${bookingInfo ? `Booking context: ${bookingInfo}` : ''}
${context ? `Recent conversation:\n${context}` : ''}

Agent asks: ${message}

Reply in 1-3 sentences. Be direct and helpful.`
    }]
  })

  const reply = res.content[0].type === 'text' ? res.content[0].text : ''

  // Save AI reply to aisistant_messages
  await supabase.from('aisistant_messages').insert({
    agent_id,
    property_id: property_id || null,
    message_type: 'ai_reply',
    title: 'AIsistant',
    content: reply,
    is_read: true,
    metadata: { property_title }
  })

  return NextResponse.json({ reply })
}
