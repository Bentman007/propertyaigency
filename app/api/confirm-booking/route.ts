import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  try {
    const { booking_id, agent_id, action } = await request.json()

    const { data: booking } = await supabase
      .from('viewing_bookings')
      .select('*, properties(title, address, suburb, city)')
      .eq('id', booking_id)
      .single()

    if (!booking) throw new Error('Booking not found')

    if (action === 'confirm') {
      await supabase
        .from('viewing_bookings')
        .update({ 
          status: 'confirmed',
          confirmed_at: new Date().toISOString(),
          confirmed_by: agent_id
        })
        .eq('id', booking_id)

      const dateFormatted = new Date(booking.date).toLocaleDateString('en-ZA', { 
        weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
      })
      const address = booking.property_address || `${booking.properties?.address}, ${booking.properties?.suburb}`

      // Notify buyer
      await fetch(`${request.nextUrl.origin}/api/push`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: booking.searcher_id,
          title: '✅ Viewing Confirmed!',
          body: `${booking.properties?.title} — ${dateFormatted} at ${booking.start_time}. Address: ${address}`,
          url: '/saved'
        })
      })

      // Notify agent confirmation
      await fetch(`${request.nextUrl.origin}/api/push`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: agent_id,
          title: '✅ Viewing Confirmed',
          body: `You confirmed the viewing for ${booking.properties?.title} on ${dateFormatted} at ${booking.start_time}`,
          url: '/dashboard'
        })
      })

    } else if (action === 'decline') {
      await supabase
        .from('viewing_bookings')
        .update({ status: 'cancelled' })
        .eq('id', booking_id)

      // Notify buyer
      await fetch(`${request.nextUrl.origin}/api/push`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: booking.searcher_id,
          title: '📅 Viewing Request Update',
          body: `The agent couldn't make that time for ${booking.properties?.title}. Please request a new time.`,
          url: '/saved'
        })
      })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
