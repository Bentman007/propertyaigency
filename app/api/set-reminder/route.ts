import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  try {
    const { booking_id, user_id, reminder_type } = await request.json()
    // reminder_type: 'night_before' or 'morning_of'

    const { data: booking } = await supabase
      .from('viewing_bookings')
      .select('date, start_time')
      .eq('id', booking_id)
      .single()

    if (!booking) throw new Error('Booking not found')

    const bookingDate = new Date(`${booking.date}T${booking.start_time}`)
    let remindAt: Date

    if (reminder_type === 'night_before') {
      remindAt = new Date(bookingDate)
      remindAt.setDate(remindAt.getDate() - 1)
      remindAt.setHours(20, 0, 0, 0) // 8pm night before
    } else {
      remindAt = new Date(bookingDate)
      remindAt.setHours(8, 0, 0, 0) // 8am morning of
    }

    await supabase.from('booking_reminders').insert({
      booking_id,
      user_id,
      reminder_type,
      remind_at: remindAt.toISOString()
    })

    // Update booking with reminder preference
    await supabase.from('viewing_bookings')
      .update({ buyer_reminder: reminder_type })
      .eq('id', booking_id)

    return NextResponse.json({ success: true, remind_at: remindAt.toISOString() })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
