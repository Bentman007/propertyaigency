'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function BookViewing({ property }: { property: any }) {
  const [user, setUser] = useState<any>(null)
  const [slots, setSlots] = useState<any[]>([])
  const [showSlots, setShowSlots] = useState(false)
  const [booked, setBooked] = useState(false)
  const [booking, setBooking] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [noSlots, setNoSlots] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
  }, [])

  const fetchSlots = async () => {
    setLoading(true)
    const response = await fetch(
      `/api/availability?agent_id=${property.user_id}&property_id=${property.id}&days_ahead=14`
    )
    const data = await response.json()
    setSlots(data.slots || [])
    setNoSlots(!data.slots || data.slots.length === 0)
    setLoading(false)
  }

  const confirmBooking = async (slot: any) => {
    if (!user) {
      window.location.href = `/auth/login?next=/property/${property.id}`
      return
    }
    setBooking(true)
    const response = await fetch('/api/book-viewing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        property_id: property.id,
        agent_id: property.user_id,
        searcher_id: user.id,
        slot,
        session_id: Math.random().toString(36).substring(2)
      })
    })
    if (response.ok) {
      setBooked(true)
      setSelectedSlot(slot)
      setShowSlots(false)
    }
    setBooking(false)
  }

  if (user && user.id === property.user_id) return null

  if (booked) return (
    <div className="w-full bg-green-900 border border-green-700 text-green-300 font-bold py-3 rounded-lg mb-3 text-center text-sm">
      ✅ Viewing booked — {new Date(selectedSlot?.date).toLocaleDateString('en-ZA', { weekday: 'long', month: 'long', day: 'numeric' })} at {selectedSlot?.start_time}
    </div>
  )

  if (showSlots) return (
    <div className="mb-3 bg-gray-750 rounded-xl">
      <div className="flex justify-between items-center mb-3">
        <p className="text-sm font-semibold text-white">📅 Available viewing times:</p>
        <button onClick={() => setShowSlots(false)} className="text-gray-500 hover:text-white text-sm">✕</button>
      </div>
      {loading ? (
        <div className="text-center py-4 text-gray-400 text-sm">Finding available slots...</div>
      ) : noSlots ? (
        <div className="bg-gray-700 rounded-lg p-3 text-sm text-gray-400 text-center">
          No available slots in the next 2 weeks. Message the agent to arrange a viewing.
        </div>
      ) : (
        <div className="space-y-2">
          {slots.map((slot, i) => (
            <button key={i} onClick={() => confirmBooking(slot)}
              disabled={booking}
              className="w-full text-left px-4 py-3 bg-gray-700 hover:bg-orange-500 hover:text-black rounded-lg text-sm transition disabled:opacity-50 group">
              <div className="flex justify-between items-center">
                <span className="font-semibold">
                  {new Date(slot.date).toLocaleDateString('en-ZA', { weekday: 'long', month: 'long', day: 'numeric' })}
                </span>
                <span className="text-gray-400 group-hover:text-black">
                  {slot.start_time} ({slot.viewing_duration} min)
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )

  return (
    <button
      onClick={() => {
        if (!user) {
          window.location.href = `/auth/login?next=/property/${property.id}`
          return
        }
        setShowSlots(true)
        fetchSlots()
      }}
      className="w-full bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 rounded-lg transition-colors mb-3"
    >
      📅 Book a Viewing
    </button>
  )
}
