'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function BookingsCalendar({ agentId }: { agentId: string }) {
  const [bookings, setBookings] = useState<any[]>([])
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDay, setSelectedDay] = useState<string | null>(null)
  const [processing, setProcessing] = useState<string | null>(null)

  useEffect(() => {
    fetchBookings()
    const interval = setInterval(fetchBookings, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchBookings = async () => {
    const { data } = await supabase
      .from('viewing_bookings')
      .select('*, properties(title, address, suburb, city, photos)')
      .eq('agent_id', agentId)
      .order('date', { ascending: true })
    setBookings(data || [])
  }

  const handleAction = async (bookingId: string, action: 'confirm' | 'decline') => {
    setProcessing(bookingId)
    await fetch('/api/confirm-booking', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ booking_id: bookingId, agent_id: agentId, action })
    })
    await fetchBookings()
    setProcessing(null)
  }

  // Calendar helpers
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    return { firstDay, daysInMonth }
  }

  const getBookingsForDay = (dateStr: string) => {
    return bookings.filter(b => b.date === dateStr)
  }

  const formatDateStr = (year: number, month: number, day: number) => {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  }

  const { firstDay, daysInMonth } = getDaysInMonth(currentMonth)
  const year = currentMonth.getFullYear()
  const month = currentMonth.getMonth()

  const monthName = currentMonth.toLocaleDateString('en-ZA', { month: 'long', year: 'numeric' })
  const today = new Date().toISOString().split('T')[0]

  const selectedBookings = selectedDay ? getBookingsForDay(selectedDay) : []

  const getStatusColor = (status: string) => {
    if (status === 'confirmed') return 'bg-green-600'
    if (status === 'cancelled') return 'bg-red-600'
    return 'bg-yellow-500'
  }

  const pendingCount = bookings.filter(b => b.status === 'pending').length

  return (
    <div className="bg-gray-800 rounded-2xl border border-gray-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold">🏠 Viewing Bookings</h3>
        <div className="flex items-center gap-2">
          {pendingCount > 0 && (
            <span className="bg-yellow-500 text-black text-xs font-bold px-2 py-0.5 rounded-full">
              {pendingCount} pending
            </span>
          )}
          <span className="text-xs text-gray-400">Live</span>
        </div>
      </div>

      {/* Calendar navigation */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => setCurrentMonth(new Date(year, month - 1))}
          className="text-gray-400 hover:text-white px-2 py-1 rounded">‹</button>
        <p className="font-semibold">{monthName}</p>
        <button onClick={() => setCurrentMonth(new Date(year, month + 1))}
          className="text-gray-400 hover:text-white px-2 py-1 rounded">›</button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 mb-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
          <div key={d} className="text-center text-xs text-gray-500 py-1">{d}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1 mb-4">
        {/* Empty cells for first day */}
        {Array.from({ length: firstDay }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}

        {/* Day cells */}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1
          const dateStr = formatDateStr(year, month, day)
          const dayBookings = getBookingsForDay(dateStr)
          const isToday = dateStr === today
          const isSelected = dateStr === selectedDay
          const hasPending = dayBookings.some(b => b.status === 'pending')
          const hasConfirmed = dayBookings.some(b => b.status === 'confirmed')

          return (
            <button key={day}
              onClick={() => setSelectedDay(dateStr === selectedDay ? null : dateStr)}
              className={`relative rounded-lg p-1 min-h-10 text-center transition ${
                isSelected ? 'bg-orange-500 text-black' :
                isToday ? 'bg-gray-600 text-white' :
                dayBookings.length > 0 ? 'bg-gray-700 hover:bg-gray-600 text-white' :
                'hover:bg-gray-700 text-gray-400'
              }`}>
              <span className="text-sm font-medium">{day}</span>
              {dayBookings.length > 0 && (
                <div className="flex justify-center gap-0.5 mt-0.5">
                  {hasPending && <div className="w-1.5 h-1.5 rounded-full bg-yellow-400"/>}
                  {hasConfirmed && <div className="w-1.5 h-1.5 rounded-full bg-green-400"/>}
                </div>
              )}
            </button>
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex gap-4 mb-4 text-xs text-gray-400">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-400 inline-block"/>Pending</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-400 inline-block"/>Confirmed</span>
      </div>

      {/* Selected day bookings */}
      {selectedDay && (
        <div className="border-t border-gray-700 pt-4">
          <p className="font-semibold mb-3">
            {new Date(selectedDay + 'T12:00:00').toLocaleDateString('en-ZA', { weekday: 'long', month: 'long', day: 'numeric' })}
            <span className="text-gray-400 text-sm ml-2">({selectedBookings.length} booking{selectedBookings.length !== 1 ? 's' : ''})</span>
          </p>

          {selectedBookings.length === 0 ? (
            <p className="text-gray-500 text-sm">No bookings on this day</p>
          ) : (
            <div className="space-y-3">
              {selectedBookings.map(booking => (
                <div key={booking.id} className="bg-gray-700 rounded-xl p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-semibold text-sm">{booking.properties?.title}</p>
                      <p className="text-gray-400 text-xs">{booking.property_address || `${booking.properties?.suburb}, ${booking.properties?.city}`}</p>
                      <p className="text-orange-500 font-bold text-sm mt-1">⏰ {booking.start_time}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full text-white font-semibold ${getStatusColor(booking.status)}`}>
                      {booking.status}
                    </span>
                  </div>

                  {booking.searcher_profile && Object.keys(booking.searcher_profile).length > 0 && (
                    <div className="bg-gray-600 rounded-lg p-2 mb-3">
                      <p className="text-xs text-gray-300 font-semibold mb-1">🤖 Buyer Profile:</p>
                      <div className="flex flex-wrap gap-2">
                        {booking.searcher_profile.budget_max && (
                          <span className="text-xs bg-gray-500 text-gray-200 px-2 py-0.5 rounded">💰 R{booking.searcher_profile.budget_max?.toLocaleString()}/mo</span>
                        )}
                        {booking.searcher_profile.move_timeline && (
                          <span className="text-xs bg-gray-500 text-gray-200 px-2 py-0.5 rounded">📅 {booking.searcher_profile.move_timeline}</span>
                        )}
                        {booking.searcher_profile.has_kids && (
                          <span className="text-xs bg-gray-500 text-gray-200 px-2 py-0.5 rounded">👨‍👩‍👧 Kids</span>
                        )}
                        {booking.searcher_profile.has_pets && (
                          <span className="text-xs bg-gray-500 text-gray-200 px-2 py-0.5 rounded">🐾 Pets</span>
                        )}
                        {booking.lead_temperature && (
                          <span className={`text-xs px-2 py-0.5 rounded font-semibold ${
                            booking.lead_temperature === 'hot' ? 'bg-red-900 text-red-300' :
                            booking.lead_temperature === 'warm' ? 'bg-yellow-900 text-yellow-300' :
                            'bg-blue-900 text-blue-300'
                          }`}>
                            {booking.lead_temperature === 'hot' ? '🔥 Hot' : booking.lead_temperature === 'warm' ? '⚡ Warm' : '❄️ Cold'}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {booking.status === 'pending' && (
                    <div className="flex gap-2">
                      <button onClick={() => handleAction(booking.id, 'confirm')}
                        disabled={processing === booking.id}
                        className="flex-1 bg-green-600 hover:bg-green-500 text-white font-bold py-2 rounded-lg text-sm disabled:opacity-50">
                        {processing === booking.id ? '...' : '✅ Confirm'}
                      </button>
                      <button onClick={() => handleAction(booking.id, 'decline')}
                        disabled={processing === booking.id}
                        className="flex-1 bg-red-800 hover:bg-red-700 text-white font-bold py-2 rounded-lg text-sm disabled:opacity-50">
                        ❌ Decline
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* No bookings at all */}
      {bookings.length === 0 && (
        <p className="text-gray-500 text-sm text-center py-4">No viewings booked yet</p>
      )}
    </div>
  )
}
