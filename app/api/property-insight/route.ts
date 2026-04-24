export const maxDuration = 10
export const dynamic = 'force-dynamic'

import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  try {
    const data = await request.json()
    const isAgent = data.viewer_type === 'agent'

    const agentPrompt = `You are a South African real estate performance analyst. Analyse this listing and give ONE specific, actionable insight in 2-3 sentences. Be direct and helpful. Focus on the most important thing the agent should know or do.

Property: ${data.title}
Location: ${data.suburb}, ${data.city}
Price: R${data.price?.toLocaleString()} ${data.price_type === 'rent' ? 'per month' : ''}
Days listed: ${data.days_listed}
Total views: ${data.views}
Unique visitors: ${data.unique_viewers}
Return visitors: ${data.return_viewers}
Average time on listing: ${data.avg_time_seconds} seconds
Enquiries received: ${data.enquiries}
Heat score: ${data.heat_score}/100

Give a specific insight about performance and one clear recommendation. Plain text only, no markdown.`

    const buyerPrompt = `You are a friendly South African property advisor helping a buyer who has saved this property. Give them a short, helpful 2-3 sentence insight from a BUYER's perspective. Be warm and practical.

Property: ${data.title}
Location: ${data.suburb}, ${data.city}
Price: R${data.price?.toLocaleString()} ${data.price_type === 'rent' ? 'per month' : ''}
Bedrooms: ${data.bedrooms}
Bathrooms: ${data.bathrooms}
Features: ${[data.has_pool && 'Pool', data.has_solar && 'Solar', data.has_gated_community && 'Gated community', data.has_24hr_security && '24hr security'].filter(Boolean).join(', ') || 'Standard'}
Days on market: ${data.days_listed || 'Recently listed'}

Write 2-3 sentences covering one of these angles (pick the most relevant):
- Is this good value for the area?
- How long has it been on the market and what does that mean for negotiation?
- What makes this property stand out for someone with their requirements?
- Any practical tips for viewing or making an offer?

Speak directly to the buyer as "you". Plain text only, no markdown, no agent jargon.`

    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 200,
      messages: [{ role: 'user', content: isAgent ? agentPrompt : buyerPrompt }]
    })

    const insight = message.content[0].type === 'text' ? message.content[0].text : ''
    return NextResponse.json({ insight })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
