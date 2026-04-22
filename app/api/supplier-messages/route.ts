import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase  = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  const { request_id, supplier_id, buyer_id, sender_id, sender_type, content, service_type, supplier_name } = await req.json()

  // Get or create conversation
  let { data: conv } = await supabase
    .from('conversations')
    .select('*')
    .eq('request_id', request_id)
    .eq('supplier_id', supplier_id)
    .eq('buyer_id', buyer_id)
    .eq('conversation_type', 'supplier')
    .single()

  if (!conv) {
    const { data: newConv } = await supabase
      .from('conversations')
      .insert({
        supplier_id,
        buyer_id,
        request_id,
        conversation_type: 'supplier',
      })
      .select()
      .single()
    conv = newConv
  }

  // Save message
  await supabase.from('messages').insert({
    conversation_id: conv.id,
    sender_id,
    recipient_id:    sender_type === 'buyer' ? supplier_id : buyer_id,
    sender_type,
    content,
  })

  // Update conversation unread counts
  await supabase.from('conversations').update({
    last_message:    content,
    last_message_at: new Date().toISOString(),
    agent_unread:    sender_type === 'buyer' ? (conv.agent_unread || 0) + 1 : 0,
    buyer_unread:    sender_type === 'supplier' ? (conv.buyer_unread || 0) + 1 : 0,
  }).eq('id', conv.id)

  // Generate AI suggested reply
  const aiRes = await anthropic.messages.create({
    model:      'claude-haiku-4-5',
    max_tokens: 150,
    messages: [{
      role:    'user',
      content: `You are an AI assistant on a South African property services platform. 
A ${sender_type} sent this message about a ${service_type?.replace(/_/g, ' ')} service: "${content}"
Write a short, helpful suggested reply for the ${sender_type === 'buyer' ? 'supplier' : 'buyer'} to send back.
Keep it to 1-2 sentences, professional and warm. Plain text only, no markdown.`,
    }],
  })
  const suggestedReply = (aiRes.content[0] as { type: string; text: string }).text?.trim() || ''

  // Push notification to recipient
  const recipientId = sender_type === 'buyer' ? supplier_id : buyer_id
  await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/push`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user_id: recipientId,
      title:   `💬 New message about your ${service_type?.replace(/_/g, ' ')} quote`,
      body:    content.substring(0, 100),
      url:     sender_type === 'buyer' ? '/supplier/dashboard' : '/my-properties',
    }),
  }).catch(() => {})

  return NextResponse.json({ success: true, conversation_id: conv.id, suggested_reply: suggestedReply })
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const supplierId = searchParams.get('supplier_id')
  const buyerId    = searchParams.get('buyer_id')

  if (supplierId && buyerId) {
    const { data } = await supabase
      .from('conversations')
      .select('*, messages(*)')
      .eq('supplier_id', supplierId)
      .eq('buyer_id', buyerId)
      .eq('conversation_type', 'supplier')
      .order('last_message_at', { ascending: false })
    return NextResponse.json({ conversations: data || [] })
  }

  return NextResponse.json({ error: 'Missing params' }, { status: 400 })
}
