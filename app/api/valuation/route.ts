export const maxDuration = 10
export const dynamic = 'force-dynamic'

import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { bedrooms, bathrooms, garages, size_sqm, property_type, suburb, city, province } = body

    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 400,
      messages: [{
        role: 'user',
        content: `You are a South African property valuation expert. Provide a realistic valuation for a ${bedrooms} bedroom ${property_type} in ${suburb}, ${city}, ${province} with ${bathrooms} bathrooms, ${garages} garages and ${size_sqm}m². Respond ONLY with this JSON, no other text: {"sale_min":1200000,"sale_max":1600000,"rent_min":8500,"rent_max":11000,"reason":"One sentence about this area.","trend":"stable"}`
      }]
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : '{}'
    const cleaned = text.replace(/```json|```/g, '').trim()
    const data = JSON.parse(cleaned)
    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
