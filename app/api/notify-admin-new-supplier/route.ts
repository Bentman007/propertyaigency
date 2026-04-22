import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { business_name, service_type, website, email, areas_served, website_duplicate } = await req.json()

  // Log to console until business email is live
  console.log('New supplier application:', {
    business_name, service_type, website, email, areas_served,
    website_duplicate: website_duplicate ? 'YES - POSSIBLE FRANCHISE' : 'no',
  })

  // Push notification to admin with duplicate flag
  await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/push`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user_id: 'a947747b-d98c-4d77-8647-c4dd930d3fe7',
      title:   website_duplicate
        ? '⚠️ New supplier — possible franchise duplicate'
        : '🏢 New supplier application',
      body:    `${business_name} · ${service_type} · ${areas_served}${website_duplicate ? ' · SAME WEBSITE AS EXISTING SUPPLIER' : ''}`,
      url:     '/admin/suppliers',
    }),
  }).catch(() => {})

  return NextResponse.json({ sent: true })
}
