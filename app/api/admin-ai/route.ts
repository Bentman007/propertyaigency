import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export const maxDuration = 30
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  try {
    const { ai_type, context } = await request.json()

    // Fetch platform stats for context
    const { data: properties } = await supabase.from('properties').select('id, title, suburb, city, price, price_type, status, created_at')
    const { data: profiles } = await supabase.from('profiles').select('id, account_type, created_at')
    const { data: bookings } = await supabase.from('viewing_bookings').select('id, status, created_at')
    const { data: views } = await supabase.from('property_views').select('id, viewed_at')

    const today = new Date().toISOString().split('T')[0]
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    const platformStats = {
      totalListings: properties?.length || 0,
      activeListings: properties?.filter(p => p.status === 'active').length || 0,
      newListingsToday: properties?.filter(p => p.created_at?.startsWith(today)).length || 0,
      totalAgents: profiles?.filter(p => p.account_type === 'agent').length || 0,
      totalBuyers: profiles?.filter(p => p.account_type === 'buyer').length || 0,
      newUsersThisWeek: profiles?.filter(p => p.created_at >= weekAgo).length || 0,
      totalViews: views?.length || 0,
      viewsToday: views?.filter(v => v.viewed_at?.startsWith(today)).length || 0,
      viewsThisWeek: views?.filter(v => v.viewed_at >= weekAgo).length || 0,
      totalBookings: bookings?.length || 0,
      confirmedBookings: bookings?.filter(b => b.status === 'confirmed').length || 0,
    }

    let systemPrompt = ''

    if (ai_type === 'marketing') {
      systemPrompt = `You are the Marketing AI for PropertyAIgency — South Africa's AI-powered property platform. 
      
You help the platform owner (Andrew Sharp) with marketing strategy, content, and growth.

PLATFORM STATS:
${JSON.stringify(platformStats, null, 2)}

YOUR CAPABILITIES:
- Write social media posts (LinkedIn, Facebook, Instagram, Twitter/X)
- Create email campaigns for agent outreach
- Suggest SEO improvements
- Draft press releases
- Create ad copy
- Suggest growth strategies
- Identify marketing opportunities from the data

PLATFORM USP:
- AI Concierge for buyers (conversational property search)
- Property AIsistant for agents (smart inbox, lead briefs)
- Instant viewing bookings
- 40% cheaper than Property24
- Currently in beta — free for early adopters

Be specific, actionable and South African in your tone. Reference the actual stats when relevant.`
    }

    else if (ai_type === 'sales') {
      systemPrompt = `You are the Sales AI for PropertyAIgency — helping acquire estate agents and agencies.

PLATFORM STATS:
${JSON.stringify(platformStats, null, 2)}

YOUR CAPABILITIES:
- Draft personalised outreach emails to estate agencies
- Create pitch decks and talking points
- Handle objections ("We already use Property24")
- Suggest which areas/agencies to target
- Create follow-up sequences
- Draft agency partnership proposals

KEY SELLING POINTS:
- 40% cheaper than Property24
- AI does the work — lead qualification, booking, briefing
- Property AIsistant gives agents a smart inbox
- Instant viewing bookings (no back and forth)
- Free for 3 months beta period
- Built specifically for the South African market

Be persuasive but honest. Reference specific benefits that matter to agents.`
    }

    else if (ai_type === 'support') {
      systemPrompt = `You are the Support AI for PropertyAIgency — helping resolve agent and buyer issues.

PLATFORM STATS:
${JSON.stringify(platformStats, null, 2)}

YOUR CAPABILITIES:
- Answer common platform questions
- Troubleshoot listing issues
- Guide agents through features
- Handle complaints professionally
- Escalate complex issues with clear summaries
- Create FAQ responses

COMMON ISSUES:
- How to edit a listing
- How to set viewing availability
- How to confirm bookings
- How the AI search works
- How to add photos

Be helpful, patient and professional. If you can't resolve something, suggest escalating to Andrew.`
    }

    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 600,
      system: systemPrompt,
      messages: [{ role: 'user', content: context }]
    })

    const message = response.content[0].type === 'text' ? response.content[0].text : ''
    return NextResponse.json({ message })

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
