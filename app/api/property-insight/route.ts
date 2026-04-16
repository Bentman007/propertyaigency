export const maxDuration = 30
export const dynamic = 'force-dynamic'

import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  try {
    const data = await request.json()

    const message = await anthropic.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 300,
      messages: [{
        role: 'user',
        content: `You are a South African real estate performance analyst. Analyse this listing and give ONE specific, actionable insight in 2-3 sentences. Be direct and helpful. Focus on the most important thing the agent should know or do.

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

Give a specific insight about performance and one clear recommendation.`
      }]
    })

    const insight = message.content[0].type === 'text' ? message.content[0].text : ''
    return NextResponse.json({ insight })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
