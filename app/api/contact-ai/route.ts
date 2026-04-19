import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { rateLimit } from '@/lib/rateLimit'

export const maxDuration = 15
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const body = await request.json()

  // Handle escalation
  if (body.escalate) {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    // Store escalation for admin to see
    try {
      await supabase.from('contact_escalations').insert({
        name: body.name,
        email: body.email,
        conversation: JSON.stringify(body.conversation)
      })
    } catch (_) {} // Fail silently if table doesn't exist yet
    
    return NextResponse.json({ success: true })
  }

  // Rate limit: 10 messages per minute per IP
  const ip = request.headers.get('x-forwarded-for') || 'unknown'
  if (!rateLimit(`contact-ai:${ip}`, 10, 60000)) {
    return NextResponse.json({ message: 'Too many requests. Please wait a moment.', escalate: false }, { status: 429 })
  }

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  const systemPrompt = `You are the friendly assistant for PropertyAIgency — South Africa's AI-powered property platform.

ABOUT PROPERTYAIGENCY:
- AI-powered property search and listing platform
- AI Concierge helps buyers find properties through conversation
- Property AIsistant helps agents manage leads and bookings
- Instant viewing bookings with smart diary management
- Currently in beta — free for early adopters
- Based in South Africa, focused on the SA property market

PRICING (planned):
- Private sellers: R300/month to list
- Estate agents: R1,800/month (40% cheaper than Property24)
- Featured listings: R500/month extra
- Currently FREE during beta period

HOW TO LIST:
- Register as an agent at www.propertyaigency.co.za/auth/register
- Click "+ New Listing" on your dashboard
- Follow the 8-step listing process
- Set your viewing availability
- AI handles all buyer enquiries automatically

KEY FEATURES:
- AI Concierge for buyers (conversational search)
- Property AIsistant inbox for agents
- Automated viewing bookings
- Lead scoring and buyer profiling
- Push notifications for bookings and messages

ESCALATION RULES:
- If someone mentions a large agency (20+ agents), national contract, or partnership → set escalate: true
- If someone is angry or has a complex complaint → set escalate: true  
- If someone asks about custom pricing → set escalate: true
- Otherwise handle it yourself

Always respond in JSON format:
{
  "message": "your response here",
  "escalate": false
}`

  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 400,
    system: systemPrompt,
    messages: [
      ...body.history.map((m: any) => ({ role: m.role, content: m.content })),
      { role: 'user', content: body.message }
    ]
  })

  try {
    const text = response.content[0].type === 'text' ? response.content[0].text : '{}'
    const parsed = JSON.parse(text.replace(/```json|```/g, '').trim())
    return NextResponse.json(parsed)
  } catch {
    const text = response.content[0].type === 'text' ? response.content[0].text : ''
    return NextResponse.json({ message: text, escalate: false })
  }
}
