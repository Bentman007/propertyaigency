import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  try {
    const { property_id } = await request.json()

    const { data: property } = await supabase
      .from('properties')
      .select('*')
      .eq('id', property_id)
      .single()

    if (!property) return NextResponse.json({ error: 'Property not found' }, { status: 404 })

    const { data: profiles } = await supabase
      .from('searcher_profiles')
      .select('*')

    if (!profiles || profiles.length === 0) {
      return NextResponse.json({ message: 'No profiles', notified: 0 })
    }

    let notified = 0

    for (const profile of profiles) {
      let isMatch = true

      const budget = profile.budget_max || profile.max_budget || profile.budget
      if (budget && property.price > budget * 1.1) isMatch = false

      const minBeds = profile.bedrooms || profile.min_bedrooms || profile.bedroom_min
      if (minBeds && property.bedrooms < minBeds) isMatch = false

      const lookingFor = profile.looking_for || profile.price_type || profile.search_type
      if (lookingFor && property.price_type !== lookingFor) isMatch = false

      const areas = profile.preferred_areas || profile.areas || profile.locations
      if (areas && Array.isArray(areas) && areas.length > 0) {
        const areaMatch = areas.some((area: string) =>
          property.suburb?.toLowerCase().includes(area.toLowerCase()) ||
          property.city?.toLowerCase().includes(area.toLowerCase())
        )
        if (!areaMatch) isMatch = false
      }

      if (isMatch && profile.user_id) {
        await fetch(`${request.nextUrl.origin}/api/push`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: profile.user_id,
            title: '🏠 New Property Match!',
            body: `${property.title} in ${property.suburb} — R${property.price?.toLocaleString()}${property.price_type === 'rent' ? '/mo' : ''}. Tap to view!`,
            url: `/property/${property_id}`
          })
        })
        notified++
      }
    }

    return NextResponse.json({ success: true, notified, property: property.title })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
