import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  const { business_name, website, service_type, service_label, areas_served } = await req.json()

  let websiteContent = ''
  if (website) {
    try {
      const url = website.startsWith('http') ? website : `https://${website}`
      const res = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; PropertyAIgency/1.0)' },
        signal: AbortSignal.timeout(8000),
      })
      const html = await res.text()
      websiteContent = html
        .replace(/<script[\s\S]*?<\/script>/gi, '')
        .replace(/<style[\s\S]*?<\/style>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 3000)
    } catch {
      // generate without website content
    }
  }

  const prompt = `You are writing a professional business profile for a South African property services marketplace.

Business name: ${business_name}
Service category: ${service_label || service_type}
Areas served: ${areas_served || 'South Africa'}
${websiteContent ? `Website content (use to personalise the profile):\n${websiteContent}` : ''}

Write a 3-paragraph business profile in plain text (no markdown, no bullet points, no headers).

Paragraph 1: Who they are and what makes them stand out (2-3 sentences).
Paragraph 2: Their specific services and how they help property buyers, sellers and movers (2-3 sentences).
Paragraph 3: Their service area and why clients trust them (1-2 sentences).

Keep it warm, professional and South African in tone. Output only the profile text — nothing else.`

  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 500,
    messages: [{ role: 'user', content: prompt }],
  })

  const profile = (message.content[0] as { type: string; text: string }).text?.trim() || ''
  return NextResponse.json({ profile })
}
