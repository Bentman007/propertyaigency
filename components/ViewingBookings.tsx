'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function ViewingBookings({ agentId }: { agentId: string }) {
  const [bookings, setBookings] = useState<any[]>([])
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

  const getTempColor = (temp: string) => {
    if (temp === 'hot') return 'text-red-400 bg-red-900'
    if (temp === 'warm') return 'text-yellow-400 bg-yellow-900'
    return 'text-blue-400 bg-blue-900'
  }

  const getStatusColor = (status: string) => {
    if (status === 'confirmed') return 'text-green-400 bg-green-900'
    if (status === 'cancelled') return 'text-red-400 bg-red-900'
    return 'text-yellow-400 bg-yellow-900'
  }

  const pending = bookings.filter(b => b.status === 'pending')
  const confirmed = bookings.filter(b => b.status === 'confirmed')
  const past = bookings.filter(b => b.status === 'cancelled')

  return (
    <div className="bg-white rounded-2xl border border-stone-300 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold">🏠 Viewing Bookings</h3>
        <div className="flex gap-2">
          {pending.length > 0 && (
            <span className="bg-yellow-500 text-black text-xs font-bold px-2 py-0.5 rounded-full">
              {pending.length} pending
            </span>
          )}
          <span className="text-sm text-stone-500">Live</span>
        </div>
      </div>

      {bookings.length === 0 ? (
        <p className="text-stone-400 text-sm">No viewings yet. Make sure your availability is set!</p>
      ) : (
        <div className="space-y-4">
          {/* Pending bookings first */}
          {pending.length > 0 && (
            <div>
              <p className="text-xs text-yellow-400 font-semibold mb-2 uppercase tracking-wide">⏳ Awaiting Confirmation</p>
              {pending.map(booking => (
                <BookingCard 
                  key={booking.id} 
                  booking={booking} 
                  onAction={handleAction}
                  processing={processing}
                  getTempColor={getTempColor}
                  getStatusColor={getStatusColor}
                  showActions={true}
                />
              ))}
            </div>
          )}

          {/* Confirmed bookings */}
          {confirmed.length > 0 && (
            <div>
              <p className="text-xs text-green-400 font-semibold mb-2 uppercase tracking-wide">✅ Confirmed</p>
              {confirmed.map(booking => (
                <BookingCard 
                  key={booking.id} 
                  booking={booking}
                  onAction={handleAction}
                  processing={processing}
                  getTempColor={getTempColor}
                  getStatusColor={getStatusColor}
                  showActions={false}
                />
              ))}
            </div>
          )}

          {/* Cancelled */}
          {past.length > 0 && (
            <div>
              <p className="text-xs text-stone-400 font-semibold mb-2 uppercase tracking-wide">❌ Cancelled</p>
              {past.map(booking => (
                <BookingCard 
                  key={booking.id} 
                  booking={booking}
                  onAction={handleAction}
                  processing={processing}
                  getTempColor={getTempColor}
                  getStatusColor={getStatusColor}
                  showActions={false}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function BookingCard({ booking, onAction, processing, getTempColor, getStatusColor, showActions }: any) {
  return (
    <div className="bg-amber-50 rounded-xl p-4 mb-2">
      <div className="flex justify-between items-start mb-2">
        <div>
          <p className="font-semibold text-sm">{booking.properties?.title}</p>
          <p className="text-stone-500 text-xs">{booking.property_address || `${booking.properties?.address}, ${booking.properties?.suburb}`}</p>
          <p className="text-stone-900 font-bold mt-1">
            {new Date(booking.date).toLocaleDateString('en-ZA', { weekday: 'long', month: 'long', day: 'numeric' })} at {booking.start_time}
          </p>
        </div>
        <div className="flex flex-col gap-1 items-end">
          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${getStatusColor(booking.status)}`}>
            {booking.status}
          </span>
          {booking.lead_temperature && (
            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${getTempColor(booking.lead_temperature)}`}>
              {booking.lead_temperature === 'hot' ? '🔥 Hot' : booking.lead_temperature === 'warm' ? '⚡ Warm' : '❄️ Cold'}
            </span>
          )}
        </div>
      </div>

      {booking.searcher_profile && Object.keys(booking.searcher_profile).length > 0 && (
        <div className="mt-2 p-2 bg-stone-200 rounded-lg mb-3">
          <p className="text-xs text-stone-700 font-semibold mb-1">🤖 AI Buyer Profile:</p>
          {booking.searcher_profile.budget_max && (
            <p className="text-xs text-stone-700">💰 Budget: R{booking.searcher_profile.budget_max?.toLocaleString()}</p>
          )}
          {booking.searcher_profile.move_timeline && (
            <p className="text-xs text-stone-700">📅 Timeline: {booking.searcher_profile.move_timeline}</p>
          )}
          {booking.searcher_profile.has_kids && <p className="text-xs text-stone-700">👨‍👩‍👧 Has children</p>}
          {booking.searcher_profile.has_pets && <p className="text-xs text-stone-700">🐾 Has pets</p>}
        </div>
      )}

      {showActions && (
        <div className="flex gap-2">
          <button
            onClick={() => onAction(booking.id, 'confirm')}
            disabled={processing === booking.id}
            className="flex-1 bg-green-600 hover:bg-green-500 text-white font-bold py-2 rounded-lg text-sm disabled:opacity-50 transition"
          >
            {processing === booking.id ? '...' : '✅ Confirm Viewing'}
          </button>
          <button
            onClick={() => onAction(booking.id, 'decline')}
            disabled={processing === booking.id}
            className="flex-1 bg-red-800 hover:bg-red-700 text-stone-900 font-bold py-2 rounded-lg text-sm disabled:opacity-50 transition"
          >
            ❌ Decline
          </button>
        </div>
      )}
    </div>
  )
}
