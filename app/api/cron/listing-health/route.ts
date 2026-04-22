import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Count total active listings
  const { count } = await supabase
    .from('properties')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active')

  const totalListings = count || 0

  // Get threshold from site_settings
  const { data: thresholdSetting } = await supabase
    .from('site_settings')
    .select('value')
    .eq('key', 'free_trial_listing_threshold')
    .single()

  const threshold = parseInt(thresholdSetting?.value || '2000')

  // Get current free trial status
  const { data: trialSetting } = await supabase
    .from('site_settings')
    .select('value')
    .eq('key', 'free_trial_active')
    .single()

  const currentlyActive = trialSetting?.value === 'true'

  // Flip the switch if threshold reached
  if (totalListings >= threshold && currentlyActive) {
    await supabase
      .from('site_settings')
      .update({ value: 'false', updated_at: new Date().toISOString() })
      .eq('key', 'free_trial_active')

    // Notify admin
    await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/push`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: 'a947747b-d98c-4d77-8647-c4dd930d3fe7',
        title:   '🎉 Free trial switched off!',
        body:    `PropertyAIgency has reached ${totalListings} listings. New agents now pay from R800/month.`,
        url:     '/admin',
      }),
    }).catch(() => {})

    return NextResponse.json({
      ok: true,
      action: 'free_trial_disabled',
      total_listings: totalListings,
      threshold,
    })
  }

  return NextResponse.json({
    ok: true,
    action: 'no_change',
    total_listings: totalListings,
    threshold,
    free_trial_active: currentlyActive,
    listings_until_threshold: Math.max(0, threshold - totalListings),
  })
}
