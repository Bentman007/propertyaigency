import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { email, business_name } = await req.json()
  console.log('Supplier rejected:', { email, business_name })
  return NextResponse.json({ sent: true })
}
