'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function ViewingBookings({ agentId }: { agentId: string }) {
  const [bookings, setBookings] = useState<any[]>([])

  useEffect(() => {
    fetchBookings()
    // Live updates every 30 seconds
    const interval = setInterval(fetchBookings, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchBookings = async () => {
    const { data } = await supabase
      .from('viewing_bookings')
      .select('*')
      .eq('agent_id', agentId)
      .order('date', { ascending: true })
    setBookings(data || [])
  }

  const getTempColor = (temp: string) => {
    if (temp === 'hot') return 'text-red-400 bg-red-900'
    if (temp === 'warm') return 'text-yellow-400 bg-yellow-900'
    return 'text-blue-400 bg-blue-900'
  }

  const getTempLabel = (temp: string) => {
    if (temp === 'hot') return '🔥 Hot Lead'
    if (temp === 'warm') return '⚡ Warm Lead'
    return '❄️ Cold Lead'
  }

  return (
    <div className="bg-gray-800 rounded-2xl border border-gray-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold">🏠 Viewing Bookings</h3>
        <span className="text-sm text-gray-400">Updates live</span>
      </div>

      {bookings.length === 0 ? (
        <p className="text-gray-500 text-sm">No viewings booked yet. Make sure your availability is set!</p>
      ) : (
        <div className="space-y-3">
          {bookings.map(booking => (
            <div key={booking.id} className="bg-gray-700 rounded-xl p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="font-semibold">{booking.date} at {booking.start_time}</p>
                  <p className="text-gray-400 text-sm">Status: {booking.status}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full font-semibold ${getTempColor(booking.lead_temperature)}`}>
                  {getTempLabel(booking.lead_temperature)}
                </span>
              </div>
              
              {booking.searcher_profile && Object.keys(booking.searcher_profile).length > 0 && (
                <div className="mt-2 p-2 bg-gray-600 rounded-lg">
                  <p className="text-xs text-gray-300 font-semibold mb-1">🤖 AI Buyer Profile:</p>
                  {booking.searcher_profile.budget_max && (
                    <p className="text-xs text-gray-300">💰 Budget: R{booking.searcher_profile.budget_max?.toLocaleString()}</p>
                  )}
                  {booking.searcher_profile.move_timeline && (
                    <p className="text-xs text-gray-300">📅 Timeline: {booking.searcher_profile.move_timeline}</p>
                  )}
                  {booking.searcher_profile.has_kids && (
                    <p className="text-xs text-gray-300">👨‍👩‍👧 Has children</p>
                  )}
                  {booking.searcher_profile.has_pets && (
                    <p className="text-xs text-gray-300">🐾 Has pets</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
