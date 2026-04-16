import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    supabase_url: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'MISSING',
    service_role: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'MISSING',
    anon_key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET' : 'MISSING',
    anthropic: process.env.ANTHROPIC_API_KEY ? 'SET' : 'MISSING',
  })
}
