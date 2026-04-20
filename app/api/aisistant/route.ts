import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  try {
    const { type, agent_id, property_id, data } = await request.json()

    const { data: property } = await supabase
      .from('properties')
      .select('title, address, suburb, city, price, price_type')
      .eq('id', property_id)
      .single()

    let title = ''
    let content = ''

    if (type === 'booking_update') {
      title = `📅 New Viewing Request — ${property?.title}`
      content = `A viewing has been requested for **${property?.title}** (${property?.suburb}, ${property?.city}) on **${data.date} at ${data.start_time}**. Please confirm or decline this booking in your calendar.`
    }

    else if (type === 'lead_brief') {
      const profile = data.searcher_profile || {}
      const temp = data.lead_temperature || 'cold'
      const tempEmoji = temp === 'hot' ? '🔥' : temp === 'warm' ? '⚡' : '❄️'

      // Generate AI brief
      const response = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 200,
        messages: [{
          role: 'user',
          content: `Write a brief 2-sentence agent briefing about this buyer for the property "${property?.title}". Be specific and useful.
          
Lead temperature: ${temp}
Budget: ${profile.budget_max ? 'R' + profile.budget_max?.toLocaleString() : 'unknown'}
Move timeline: ${profile.move_timeline || 'unknown'}
Has kids: ${profile.has_kids ? 'yes' : 'no'}
Has pets: ${profile.has_pets ? 'yes' : 'no'}
Must haves: ${profile.must_haves?.join(', ') || 'none specified'}
Viewing booked: ${data.date} at ${data.start_time}`
        }]
      })

      const brief = response.content[0].type === 'text' ? response.content[0].text : ''
      title = `${tempEmoji} Lead Brief — ${property?.title}`
      content = `**Viewing confirmed** for ${data.date} at ${data.start_time}.\n\n${brief}`
    }

    else if (type === 'listing_insight') {
      title = `🤖 Property AIsistant — ${property?.title}`
      content = data.insight
    }

    else if (type === 'recommend_property') {
      // Agent wants to recommend one of their listings to a buyer
      const { data: property } = await supabase
        .from('properties')
        .select('id, title, suburb, city, price, price_type')
        .eq('id', data.property_id)
        .eq('user_id', agent_id)
        .single()

      if (property && data.buyer_id) {
        await fetch(`${request.nextUrl.origin}/api/agent-recommend`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            agent_id,
            buyer_id: data.buyer_id,
            property_id: data.property_id
          })
        })
        title = `✅ Recommendation Sent`
        content = `Your listing **${property.title}** has been recommended to the buyer. They will receive a notification and see it in their Concierge chat!`
      } else {
        title = `❌ Recommendation Failed`
        content = `Could not send recommendation. Make sure the property is active and belongs to you.`
      }
    }

    else if (type === 'hot_lead') {
      title = `🔥 Hot Lead Alert — ${property?.title}`
      content = `Someone has viewed **${property?.title}** ${data.view_count} times this week. This buyer is showing strong interest — they may be ready to make a decision. Consider reviewing your price or reaching out.`
    }

    // Save message
    await supabase.from('aisistant_messages').insert({
      agent_id,
      property_id,
      message_type: type,
      title,
      content
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  try {
    const { searchParams } = new URL(request.url)
    const agent_id = searchParams.get('agent_id')

    const { data: messages } = await supabase
      .from('aisistant_messages')
      .select('*, properties(title, photos)')
      .eq('agent_id', agent_id)
      .order('created_at', { ascending: false })
      .limit(20)

    // Mark all as read
    await supabase
      .from('aisistant_messages')
      .update({ is_read: true })
      .eq('agent_id', agent_id)
      .eq('is_read', false)

    return NextResponse.json({ messages })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
