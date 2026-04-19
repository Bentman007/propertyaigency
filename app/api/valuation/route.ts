export const maxDuration = 10
export const dynamic = 'force-dynamic'

import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { bedrooms, bathrooms, property_type, suburb, city, price_type } = body

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Check how many comparable listings we have
    const { data: comparables } = await supabase
      .from('properties')
      .select('price, bedrooms, suburb, city')
      .eq('status', 'active')
      .eq('price_type', price_type || 'sale')
      .ilike('city', `%${city}%`)

    const MIN_COMPARABLES = 5

    if (!comparables || comparables.length < MIN_COMPARABLES) {
      // Not enough data yet
      return NextResponse.json({
        insufficient_data: true,
        message: `We need more listings in ${city} before we can provide accurate valuations. Check back soon as our database grows!`,
        comparable_count: comparables?.length || 0
      })
    }

    // Filter by bedroom count
    const similar = comparables.filter(p => 
      Math.abs((p.bedrooms || 0) - (bedrooms || 0)) <= 1
    )

    if (similar.length < 3) {
      return NextResponse.json({
        insufficient_data: true,
        message: `We need more ${bedrooms}-bedroom listings in ${city} to provide an accurate valuation.`,
        comparable_count: similar.length
      })
    }

    // Calculate price range from real data
    const prices = similar.map(p => p.price).sort((a, b) => a - b)
    const min = prices[0]
    const max = prices[prices.length - 1]
    const avg = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length)
    const median = prices[Math.floor(prices.length / 2)]

    return NextResponse.json({
      insufficient_data: false,
      min_price: min,
      max_price: max,
      average_price: avg,
      median_price: median,
      comparable_count: similar.length,
      price_type: price_type || 'sale',
      area: `${suburb || city}, ${city}`,
      message: `Based on ${similar.length} similar properties in ${city}`
    })

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
