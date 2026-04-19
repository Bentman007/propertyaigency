import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  try {
    const { email } = await request.json()

    // Search auth users by email
    const { data: { users }, error } = await supabase.auth.admin.listUsers()
    if (error) throw error

    const authUser = users.find(u => u.email?.toLowerCase() === email.toLowerCase())
    if (!authUser) return NextResponse.json({ user: null })

    // Get profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authUser.id)
      .single()

    // Get listings
    const { data: listings } = await supabase
      .from('properties')
      .select('id, title, status, created_at')
      .eq('user_id', authUser.id)
      .order('created_at', { ascending: false })

    return NextResponse.json({
      user: {
        id: authUser.id,
        email: authUser.email,
        full_name: profile?.full_name || authUser.user_metadata?.full_name,
        agency_name: profile?.agency_name,
        account_type: authUser.user_metadata?.account_type || 'buyer',
        listing_credits: profile?.listing_credits || 0,
        discount_percent: profile?.discount_percent || 0,
        eaab_number: profile?.eaab_number || null,
        is_suspended: profile?.is_suspended || false,
        created_at: authUser.created_at
      },
      listings: listings || []
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
