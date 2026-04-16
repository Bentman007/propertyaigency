export const maxDuration = 30
export const dynamic = 'force-dynamic'

import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(request: NextRequest) {
  try {
    const { bedrooms, bathrooms, garages, size_sqm, property_type, price_type, suburb, city, province, features } = await request.json()

    const prompt = `You are a professional South African property copywriter. Write a compelling property listing for:

Property details:
- Type: ${property_type} ${price_type === 'rent' ? 'to rent' : 'for sale'}
- Location: ${suburb}, ${city}, ${province}
- Bedrooms: ${bedrooms}
- Bathrooms: ${bathrooms}
- Garages: ${garages}
- Size: ${size_sqm}m²
- Features: ${features.join(', ')}

Write:
1. A catchy title (max 10 words)
2. A compelling description (3-4 sentences, highlighting the best features and location)

Format your response as JSON:
{
  "title": "...",
  "description": "..."
}

Make it sound premium, use South African context, mention the area's appeal. Do not use asterisks or markdown.`

    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 400,
      messages: [{ role: 'user', content: prompt }]
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : '{}'
    const cleaned = text.replace(/```json|```/g, '').trim()
    const data = JSON.parse(cleaned)
    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
