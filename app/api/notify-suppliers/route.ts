import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  const {
    request_id,
    service_type,
    selected_suppliers,
    from_address,
    to_address,
    client_first_name,
  } = await req.json()

  let query = supabase
    .from('suppliers')
    .select('id, user_id, business_name, weekly_lead_limit, total_leads_received')
    .eq('service_type', service_type)
    .eq('status', 'active')
    .eq('is_active', true)
    .eq('is_paused', false)

  if (selected_suppliers?.length > 0) {
    query = query.in('id', selected_suppliers)
  }

  const { data: suppliers } = await query
  if (!suppliers || suppliers.length === 0) return NextResponse.json({ notified: 0 })

  const serviceLabel = service_type.replace(/_/g, ' ')
  const clientName   = client_first_name || 'A client'
  const location     = to_address || from_address || 'your area'

  for (const supplier of suppliers) {
    await supabase
      .from('suppliers')
      .update({ total_leads_received: (supplier.total_leads_received || 0) + 1 })
      .eq('id', supplier.id)

    await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/push`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: supplier.user_id,
        title:   `New ${serviceLabel} lead!`,
        body:    `${clientName} needs a ${serviceLabel} near ${location}. Log in to send a quote.`,
        url:     '/supplier/dashboard',
      }),
    }).catch(() => {})
  }

  return NextResponse.json({ notified: suppliers.length })
}
