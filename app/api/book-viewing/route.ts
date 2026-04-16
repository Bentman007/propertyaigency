import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  try {
    const { property_id, agent_id, searcher_id, slot, session_id } = await request.json()

    const { data: profile } = await supabase
      .from('searcher_profiles')
      .select('*')
      .eq('user_id', searcher_id)
      .single()

    const { data: conversation } = await supabase
      .from('property_conversations')
      .select('lead_score, lead_temperature')
      .eq('session_id', session_id)
      .single()

    const { data: property } = await supabase
      .from('properties')
      .select('title, address, suburb, city')
      .eq('id', property_id)
      .single()

    const fullAddress = `${property?.address}, ${property?.suburb}, ${property?.city}`

    const { data: booking, error } = await supabase
      .from('viewing_bookings')
      .insert({
        property_id,
        agent_id,
        searcher_id,
        date: slot.date,
        start_time: slot.start_time,
        status: 'pending',
        searcher_profile: profile || {},
        lead_score: conversation?.lead_score || 0,
        lead_temperature: conversation?.lead_temperature || 'cold',
        property_address: fullAddress
      })
      .select()
      .single()

    if (error) throw error

    // Mark slot as booked
    if (slot.id) {
      await supabase
        .from('agent_availability')
        .update({ is_booked: true })
        .eq('id', slot.id)
    }

    // Send push notification to agent
    await fetch(`${request.nextUrl.origin}/api/push`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: agent_id,
        title: '📅 New Viewing Request!',
        body: `${property?.title} — ${new Date(slot.date).toLocaleDateString('en-ZA', { weekday: 'long', month: 'long', day: 'numeric' })} at ${slot.start_time}. Please confirm!`,
        url: '/dashboard'
      })
    })

    return NextResponse.json({ success: true, booking_id: booking?.id })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
