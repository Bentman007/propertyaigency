import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { business_name, service_type, website, email, areas_served } = await req.json()

  // Email notifications coming soon once business email is configured
  console.log('New supplier application:', { business_name, service_type, website, email, areas_served })

  return NextResponse.json({ sent: true })
}
