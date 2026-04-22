import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  const { user_id, property_title, property_address } = await req.json()

  if (!user_id) return NextResponse.json({ ok: false })

  // Get buyer profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user_id)
    .single()

  const firstName = profile?.full_name?.split(' ')[0] || 'there'

  // Generate a warm congratulations message with marketplace nudge
  const message = await anthropic.messages.create({
    model:      'claude-haiku-4-5',
    max_tokens: 300,
    messages: [{
      role: 'user',
      content: `Write a warm, concise congratulations message for a property buyer whose offer on "${property_title}" in ${property_address} has just been accepted. Address them as ${firstName}.

The message should:
1. Congratulate them warmly (1-2 sentences)
2. Acknowledge this is an exciting but busy time
3. Let them know we have unlocked Moving Services for them — they can now get quotes from verified local suppliers including removal companies, bond originators, conveyancing attorneys, solar installers, painters, garden services and more
4. Invite them to tap the button below to explore

Write in plain text only — no markdown, no bullet points, no asterisks. Keep it under 80 words. End with: "Tap below to explore our supplier marketplace and get quotes from trusted professionals in your area."

Do not include any prompts tags or JSON. Just the message text.`
    }]
  })

  const nudgeText = (message.content[0] as { type: string; text: string }).text?.trim() || 
    `Congratulations ${firstName}! Your offer on ${property_title} has been accepted — how exciting! This is a big moment, and we want to make your move as smooth as possible. We have unlocked Moving Services for you, giving you access to verified local suppliers for everything you need. Tap below to explore our supplier marketplace and get quotes from trusted professionals in your area.`

  // Save this as a concierge message in aisistant_messages
  await supabase.from('aisistant_messages').insert({
    user_id,
    role:       'assistant',
    content:    nudgeText,
    message_type: 'marketplace_nudge',
    metadata: {
      property_title,
      property_address,
      cta_label: 'Explore Moving Services',
      cta_url:   '/moving',
    },
    created_at: new Date().toISOString(),
  })

  return NextResponse.json({ ok: true, message: nudgeText })
}
