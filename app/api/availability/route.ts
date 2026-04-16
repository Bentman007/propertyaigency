import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  try {
    const { searchParams } = new URL(request.url)
    const agent_id = searchParams.get('agent_id')
    const property_id = searchParams.get('property_id')
    const days_ahead = parseInt(searchParams.get('days_ahead') || '14')

    if (!agent_id) return NextResponse.json({ error: 'Missing agent_id' }, { status: 400 })

    // Get agent's weekly template
    const { data: template } = await supabase
      .from('agent_weekly_template')
      .select('*')
      .eq('agent_id', agent_id)
      .single()

    if (!template) return NextResponse.json({ slots: [], message: 'Agent has not set availability yet' })

    // Get blocked dates
    const today = new Date()
    const endDate = new Date()
    endDate.setDate(today.getDate() + days_ahead)

    const { data: blockedDates } = await supabase
      .from('agent_blocked_dates')
      .select('blocked_date')
      .eq('agent_id', agent_id)
      .gte('blocked_date', today.toISOString().split('T')[0])
      .lte('blocked_date', endDate.toISOString().split('T')[0])

    const blockedSet = new Set(blockedDates?.map(b => b.blocked_date) || [])

    // Get existing bookings
    const { data: existingBookings } = await supabase
      .from('viewing_bookings')
      .select('date, start_time, end_time, property_id')
      .eq('agent_id', agent_id)
      .gte('date', today.toISOString().split('T')[0])
      .lte('date', endDate.toISOString().split('T')[0])
      .neq('status', 'cancelled')

    // Get property location for travel time calculation
    let propertySuburb = ''
    let propertyCity = ''
    if (property_id) {
      const { data: prop } = await supabase
        .from('properties')
        .select('suburb, city, address')
        .eq('id', property_id)
        .single()
      propertySuburb = prop?.suburb || ''
      propertyCity = prop?.city || ''
    }

    // Get locations of booked properties for travel buffer
    const bookedPropertyIds = existingBookings?.map(b => b.property_id).filter(Boolean) || []
    let bookedPropertyLocations: any[] = []
    if (bookedPropertyIds.length > 0) {
      const { data: bookedProps } = await supabase
        .from('properties')
        .select('id, suburb, city')
        .in('id', bookedPropertyIds)
      bookedPropertyLocations = bookedProps || []
    }

    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    const viewingDuration = template.viewing_duration_minutes || 30
    const travelBuffer = template.travel_buffer_minutes || 20
    const totalSlotMinutes = viewingDuration + travelBuffer

    const availableSlots: any[] = []

    // Generate slots for each day
    for (let d = 1; d <= days_ahead; d++) {
      const date = new Date()
      date.setDate(today.getDate() + d)
      const dateStr = date.toISOString().split('T')[0]
      const dayName = dayNames[date.getDay()]

      // Skip blocked dates
      if (blockedSet.has(dateStr)) continue

      // Get template for this day
      const dayStart = template[`${dayName}_start`]
      const dayEnd = template[`${dayName}_end`]

      // Skip if agent not available this day
      if (!dayStart || !dayEnd) continue

      // Get bookings for this day
      const dayBookings = existingBookings?.filter(b => b.date === dateStr) || []

      // Generate time slots
      const [startH, startM] = dayStart.split(':').map(Number)
      const [endH, endM] = dayEnd.split(':').map(Number)
      const startMinutes = startH * 60 + startM
      const endMinutes = endH * 60 + endM

      let currentMinutes = startMinutes

      while (currentMinutes + totalSlotMinutes <= endMinutes) {
        const slotStart = `${String(Math.floor(currentMinutes / 60)).padStart(2, '0')}:${String(currentMinutes % 60).padStart(2, '0')}`
        const slotEndMinutes = currentMinutes + viewingDuration
        const slotEnd = `${String(Math.floor(slotEndMinutes / 60)).padStart(2, '0')}:${String(slotEndMinutes % 60).padStart(2, '0')}`

        // Check if slot conflicts with existing bookings (including travel buffer)
        const slotStartMins = currentMinutes
        const slotEndWithBuffer = currentMinutes + totalSlotMinutes

        const hasConflict = dayBookings.some(booking => {
          const [bH, bM] = booking.start_time.split(':').map(Number)
          const bookingStart = bH * 60 + bM
          const bookingEnd = bookingStart + totalSlotMinutes

          // Check same area - if same suburb, reduce travel buffer
          const bookedProp = bookedPropertyLocations.find(p => p.id === booking.property_id)
          const sameArea = bookedProp?.suburb === propertySuburb || bookedProp?.city === propertyCity
          const effectiveBuffer = sameArea ? 10 : travelBuffer
          const effectiveEnd = bookingStart + viewingDuration + effectiveBuffer

          return !(slotEndWithBuffer <= bookingStart || slotStartMins >= effectiveEnd)
        })

        if (!hasConflict) {
          availableSlots.push({
            date: dateStr,
            start_time: slotStart,
            end_time: slotEnd,
            day_name: dayName,
            viewing_duration: viewingDuration
          })
        }

        currentMinutes += totalSlotMinutes
      }
    }

    return NextResponse.json({ 
      slots: availableSlots.slice(0, 8), // Return next 8 available slots
      template: template ? {
        ...template,
        monday_start: template.monday_start?.substring(0, 5),
        monday_end: template.monday_end?.substring(0, 5),
        tuesday_start: template.tuesday_start?.substring(0, 5),
        tuesday_end: template.tuesday_end?.substring(0, 5),
        wednesday_start: template.wednesday_start?.substring(0, 5),
        wednesday_end: template.wednesday_end?.substring(0, 5),
        thursday_start: template.thursday_start?.substring(0, 5),
        thursday_end: template.thursday_end?.substring(0, 5),
        friday_start: template.friday_start?.substring(0, 5),
        friday_end: template.friday_end?.substring(0, 5),
        saturday_start: template.saturday_start?.substring(0, 5),
        saturday_end: template.saturday_end?.substring(0, 5),
        sunday_start: template.sunday_start?.substring(0, 5),
        sunday_end: template.sunday_end?.substring(0, 5),
      } : null,
      property_location: { suburb: propertySuburb, city: propertyCity }
    })

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  try {
    const { agent_id, template, blocked_date, remove_blocked_date } = await request.json()

    if (template) {
      await supabase
        .from('agent_weekly_template')
        .upsert({ agent_id, ...template, updated_at: new Date().toISOString() })
      return NextResponse.json({ success: true })
    }

    if (blocked_date) {
      await supabase
        .from('agent_blocked_dates')
        .insert({ agent_id, blocked_date })
      return NextResponse.json({ success: true })
    }

    if (remove_blocked_date) {
      await supabase
        .from('agent_blocked_dates')
        .delete()
        .eq('agent_id', agent_id)
        .eq('blocked_date', remove_blocked_date)
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Missing params' }, { status: 400 })

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
