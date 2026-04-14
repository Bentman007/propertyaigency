import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    return NextResponse.json({ 
      error: `Missing env vars - URL: ${url ? 'SET' : 'MISSING'}, KEY: ${key ? 'SET' : 'MISSING'}` 
    }, { status: 500 })
  }

  try {
    const supabase = createClient(url, key)

    const formData = await request.formData()
    const file = formData.get('file') as File
    const filename = formData.get('filename') as string

    if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 })

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const { error } = await supabase.storage
      .from('Property Images')
      .upload(filename, buffer, {
        contentType: file.type,
        upsert: true
      })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const { data } = supabase.storage.from('Property Images').getPublicUrl(filename)
    return NextResponse.json({ url: data.publicUrl })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
