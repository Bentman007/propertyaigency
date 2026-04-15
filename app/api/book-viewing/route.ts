import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  try {
    const { property_id, agent_id, searcher_id, slot, session_id } = await request.json()

    // Get searcher profile for agent brief
    const { data: profile } = await supabase
      .from('searcher_profiles')
      .select('*')
      .eq('user_id', searcher_id)
      .single()

    // Get conversation lead score
    const { data: conversation } = await supabase
      .from('property_conversations')
      .select('lead_score, lead_temperature')
      .eq('session_id', session_id)
      .single()

    // Create booking
    const { error } = await supabase
      .from('viewing_bookings')
      .insert({
        property_id,
        agent_id,
        searcher_id,
        availability_id: slot.id,
        date: slot.date,
        start_time: slot.start_time,
        status: 'confirmed',
        searcher_profile: profile || {},
        lead_score: conversation?.lead_score || 0,
        lead_temperature: conversation?.lead_temperature || 'cold'
      })

    if (error) throw error

    // Mark slot as booked
    await supabase
      .from('agent_availability')
      .update({ is_booked: true })
      .eq('id', slot.id)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
