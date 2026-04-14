import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
})

export async function POST(request: NextRequest) {
  try {
    const { message, property } = await request.json()

    const systemPrompt = `You are a helpful AI property assistant for PropertyAIgency, South Africa's premier AI-powered property platform.

You are answering questions about this specific property:
- Title: ${property.title}
- Location: ${property.suburb}, ${property.city}, ${property.province}
- Price: R ${property.price} ${property.price_type === 'rent' ? 'per month' : ''}
- Type: ${property.price_type === 'rent' ? 'To Rent' : 'For Sale'}
- Bedrooms: ${property.bedrooms}
- Bathrooms: ${property.bathrooms}
- Size: ${property.size_sqm}m²
- Description: ${property.description}

Be helpful, friendly and concise. Answer questions about the property, the area, pricing, and the buying/renting process in South Africa. Keep responses under 150 words.`

    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 300,
      system: systemPrompt,
      messages: [{ role: 'user', content: message }]
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''
    return NextResponse.json({ reply: text })
  } catch (error: any) {
    console.error('AI chat error:', error)
    return NextResponse.json({ reply: `Error: ${error.message}` }, { status: 500 })
  }
}
