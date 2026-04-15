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

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
    fetchSlots()
  }, [])

  const fetchSlots = async () => {
    const { data } = await supabase
      .from('agent_availability')
      .select('*')
      .eq('agent_id', property.user_id)
      .eq('is_booked', false)
      .gte('date', new Date().toISOString().split('T')[0])
      .order('date', { ascending: true })
      .limit(6)
    setSlots(data || [])
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

  // Don't show if this is the agent's own listing
  if (user && user.id === property.user_id) return null

  if (booked) return (
    <div className="w-full bg-green-900 border border-green-700 text-green-300 font-bold py-3 rounded-lg mb-3 text-center text-sm">
      ✅ Viewing booked for {selectedSlot?.date} at {selectedSlot?.start_time}
    </div>
  )

  if (showSlots) return (
    <div className="mb-3">
      <div className="flex justify-between items-center mb-2">
        <p className="text-sm font-semibold text-white">📅 Select a viewing time:</p>
        <button onClick={() => setShowSlots(false)} className="text-gray-500 hover:text-white text-sm">✕</button>
      </div>
      {slots.length === 0 ? (
        <div className="bg-gray-700 rounded-lg p-3 text-sm text-gray-400 text-center">
          No available slots at the moment. Message the agent to arrange a viewing.
        </div>
      ) : (
        <div className="space-y-2">
          {slots.map((slot, i) => (
            <button key={i} onClick={() => confirmBooking(slot)}
              disabled={booking}
              className="w-full text-left px-4 py-2.5 bg-gray-700 hover:bg-orange-500 hover:text-black rounded-lg text-sm transition disabled:opacity-50 flex justify-between items-center">
              <span>📅 {new Date(slot.date).toLocaleDateString('en-ZA', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
              <span className="text-gray-400 hover:text-black">{slot.start_time} — {slot.end_time}</span>
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
      }}
      className="w-full bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 rounded-lg transition-colors mb-3"
    >
      📅 Book a Viewing
    </button>
  )
}
