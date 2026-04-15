import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  try {
    const { property_id, agent_id, buyer_id, sender_id, sender_type, content } = await request.json()

    // Get or create conversation
    let { data: conversation } = await supabase
      .from('conversations')
      .select('*')
      .eq('property_id', property_id)
      .eq('agent_id', agent_id)
      .eq('buyer_id', buyer_id)
      .single()

    if (!conversation) {
      const { data: newConv } = await supabase
        .from('conversations')
        .insert({ property_id, agent_id, buyer_id })
        .select()
        .single()
      conversation = newConv
    }

    // Save the message
    await supabase.from('messages').insert({
      conversation_id: conversation.id,
      property_id,
      sender_id,
      recipient_id: sender_type === 'agent' ? buyer_id : agent_id,
      sender_type,
      content
    })

    // Update conversation
    await supabase.from('conversations').update({
      last_message: content,
      last_message_at: new Date().toISOString(),
      agent_unread: sender_type === 'buyer' ? (conversation.agent_unread || 0) + 1 : 0,
      buyer_unread: sender_type === 'agent' ? (conversation.buyer_unread || 0) + 1 : 0
    }).eq('id', conversation.id)

    // Generate AI suggested reply
    const { data: property } = await supabase
      .from('properties')
      .select('title, address, suburb, city, price, price_type')
      .eq('id', property_id)
      .single()

    const aiResponse = await anthropic.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 200,
      messages: [{
        role: 'user',
        content: `You are an AI assistant for a South African property platform. 
        
Property: ${property?.title} in ${property?.suburb}, ${property?.city}
Price: R${property?.price?.toLocaleString()} ${property?.price_type === 'rent' ? '/mo' : ''}

A ${sender_type} just sent this message: "${content}"

Generate a SHORT, helpful suggested reply for the ${sender_type === 'agent' ? 'buyer' : 'agent'} to send back. 
Keep it to 1-2 sentences, professional but warm. South African context.
Just write the suggested reply, nothing else.`
      }]
    })

    const suggestedReply = aiResponse.content[0].type === 'text' ? aiResponse.content[0].text : ''

    return NextResponse.json({ 
      success: true, 
      conversation_id: conversation.id,
      suggested_reply: suggestedReply
    })

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
    const conversation_id = searchParams.get('conversation_id')
    const user_id = searchParams.get('user_id')

    if (conversation_id) {
      const { data: messages } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversation_id)
        .order('created_at', { ascending: true })

      // Mark as read
      if (user_id) {
        await supabase.from('messages')
          .update({ is_read: true })
          .eq('conversation_id', conversation_id)
          .eq('recipient_id', user_id)
      }

      return NextResponse.json({ messages })
    }

    if (user_id) {
      const { data: conversations } = await supabase
        .from('conversations')
        .select('*, properties(title, address, suburb, photos)')
        .or(`agent_id.eq.${user_id},buyer_id.eq.${user_id}`)
        .order('last_message_at', { ascending: false })

      return NextResponse.json({ conversations })
    }

    return NextResponse.json({ error: 'Missing params' }, { status: 400 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
