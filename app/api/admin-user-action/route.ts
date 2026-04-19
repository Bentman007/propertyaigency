import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  try {
    const { user_id, action, amount, note } = await request.json()

    if (action === 'add_credit') {
      const { data: profile } = await supabase
        .from('profiles')
        .select('listing_credits')
        .eq('id', user_id)
        .single()

      const currentCredits = profile?.listing_credits || 0
      await supabase.from('profiles')
        .update({ listing_credits: currentCredits + amount })
        .eq('id', user_id)

      return NextResponse.json({ 
        message: `✅ Added ${amount} free listing credits. They now have ${currentCredits + amount} credits.` 
      })
    }

    if (action === 'add_discount') {
      await supabase.from('profiles')
        .update({ discount_percent: amount })
        .eq('id', user_id)

      return NextResponse.json({ 
        message: `✅ Applied ${amount}% discount to their next invoice.` 
      })
    }

    if (action === 'suspend') {
      await supabase.from('profiles').update({ 
        is_suspended: true,
        suspension_reason: note || 'Suspended by admin'
      }).eq('id', user_id)

      // Hide all their listings
      await supabase.from('properties')
        .update({ status: 'draft' })
        .eq('user_id', user_id)
        .eq('status', 'active')

      return NextResponse.json({ 
        message: '🔴 Account suspended and listings hidden.' 
      })
    }

    if (action === 'unsuspend') {
      await supabase.from('profiles').update({ 
        is_suspended: false,
        suspension_reason: null
      }).eq('id', user_id)

      return NextResponse.json({ 
        message: '✅ Account reinstated. They can now list properties again.' 
      })
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
