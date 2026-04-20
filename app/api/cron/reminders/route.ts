import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import webpush from 'web-push'

webpush.setVapidDetails(
  'mailto:admin@propertyaigency.co.za',
  process.env.VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  // Verify this is called by Vercel cron
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  try {
    const now = new Date()
    const windowEnd = new Date(now.getTime() + 60 * 60 * 1000) // next 1 hour

    // Find reminders due in the next hour that haven't been sent
    const { data: reminders } = await supabase
      .from('booking_reminders')
      .select(`
        *,
        viewing_bookings (
          id,
          date,
          start_time,
          property_address,
          agent_id,
          searcher_id,
          properties (title, suburb, city)
        )
      `)
      .eq('sent', false)
      .lte('remind_at', windowEnd.toISOString())
      .gte('remind_at', now.toISOString())

    if (!reminders || reminders.length === 0) {
      return NextResponse.json({ message: 'No reminders due', count: 0 })
    }

    let sent = 0

    for (const reminder of reminders) {
      const booking = reminder.viewing_bookings
      if (!booking) continue

      const property = booking.properties
      const dateStr = new Date(booking.date).toLocaleDateString('en-ZA', {
        weekday: 'long', month: 'long', day: 'numeric'
      })
      const timeStr = booking.start_time?.slice(0, 5)
      const address = booking.property_address || `${property?.suburb}, ${property?.city}`

      const isNightBefore = reminder.reminder_type === 'night_before'
      const title = isNightBefore
        ? '🏠 Viewing Tomorrow!'
        : '🏠 Viewing Today!'
      const body = `${property?.title} — ${dateStr} at ${timeStr}. Address: ${address}`

      // Get user push subscriptions
      const { data: subscriptions } = await supabase
        .from('push_subscriptions')
        .select('subscription')
        .eq('user_id', reminder.user_id)

      if (subscriptions && subscriptions.length > 0) {
        const payload = JSON.stringify({ title, body, url: '/saved' })
        await Promise.allSettled(
          subscriptions.map(({ subscription }) =>
            webpush.sendNotification(subscription, payload).catch(() => {})
          )
        )
      }

      // Also send reminder to agent
      const agentUserId = booking.agent_id
      if (agentUserId) {
        const { data: agentSubs } = await supabase
          .from('push_subscriptions')
          .select('subscription')
          .eq('user_id', agentUserId)

        if (agentSubs && agentSubs.length > 0) {
          const agentPayload = JSON.stringify({
            title: isNightBefore ? '📅 Viewing Tomorrow!' : '📅 Viewing Today!',
            body: `${property?.title} — ${dateStr} at ${timeStr}`,
            url: '/dashboard'
          })
          await Promise.allSettled(
            agentSubs.map(({ subscription }) =>
              webpush.sendNotification(subscription, agentPayload).catch(() => {})
            )
          )
        }
      }

      // Mark reminder as sent
      await supabase
        .from('booking_reminders')
        .update({ sent: true, sent_at: new Date().toISOString() })
        .eq('id', reminder.id)

      sent++
    }

    return NextResponse.json({ success: true, sent })
  } catch (error: any) {
    console.error('Reminders cron error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
