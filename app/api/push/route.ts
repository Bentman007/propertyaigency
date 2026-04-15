import webpush from 'web-push'
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

webpush.setVapidDetails(
  'mailto:admin@propertyaigency.co.za',
  process.env.VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)

export async function POST(request: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  try {
    const { user_id, title, body, url } = await request.json()

    // Get user's push subscriptions
    const { data: subscriptions } = await supabase
      .from('push_subscriptions')
      .select('subscription')
      .eq('user_id', user_id)

    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json({ message: 'No subscriptions found' })
    }

    const payload = JSON.stringify({ title, body, url })

    const results = await Promise.allSettled(
      subscriptions.map(async ({ subscription }) => {
        try {
          await webpush.sendNotification(subscription, payload)
        } catch (err: any) {
          // Remove invalid subscriptions
          if (err.statusCode === 410) {
            await supabase
              .from('push_subscriptions')
              .delete()
              .eq('user_id', user_id)
              .eq('subscription', subscription)
          }
        }
      })
    )

    return NextResponse.json({ success: true, sent: results.length })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  try {
    const { user_id, subscription } = await request.json()

    await supabase.from('push_subscriptions').upsert({
      user_id,
      subscription,
      updated_at: new Date().toISOString()
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
