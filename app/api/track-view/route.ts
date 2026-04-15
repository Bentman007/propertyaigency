import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { property_id, session_id, time_spent, user_id } = await request.json()

    const { data: existing } = await supabase
      .from('property_views')
      .select('id')
      .eq('property_id', property_id)
      .eq('viewer_session', session_id)
      .single()

    if (existing) {
      await supabase
        .from('property_views')
        .update({ time_spent_seconds: time_spent, updated_at: new Date().toISOString() })
        .eq('id', existing.id)
    } else {
      await supabase
        .from('property_views')
        .insert({ property_id, viewer_session: session_id, viewer_user_id: user_id || null, time_spent_seconds: time_spent })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
