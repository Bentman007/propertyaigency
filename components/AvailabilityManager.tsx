'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function AvailabilityManager({ agentId }: { agentId: string }) {
  const [slots, setSlots] = useState<any[]>([])
  const [date, setDate] = useState('')
  const [startTime, setStartTime] = useState('09:00')
  const [endTime, setEndTime] = useState('10:00')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchSlots()
  }, [])

  const fetchSlots = async () => {
    const { data } = await supabase
      .from('agent_availability')
      .select('*')
      .eq('agent_id', agentId)
      .gte('date', new Date().toISOString().split('T')[0])
      .order('date', { ascending: true })
    setSlots(data || [])
  }

  const addSlot = async () => {
    if (!date || !startTime || !endTime) return
    setLoading(true)
    await supabase.from('agent_availability').insert({
      agent_id: agentId,
      date,
      start_time: startTime,
      end_time: endTime
    })
    setDate('')
    await fetchSlots()
    setLoading(false)
  }

  const removeSlot = async (id: string) => {
    await supabase.from('agent_availability').delete().eq('id', id)
    setSlots(prev => prev.filter(s => s.id !== id))
  }

  return (
    <div className="bg-gray-800 rounded-2xl border border-gray-700 p-6">
      <h3 className="text-lg font-bold mb-4">📅 My Viewing Availability</h3>
      
      <div className="flex gap-3 mb-4">
        <input type="date" value={date} onChange={e => setDate(e.target.value)}
          min={new Date().toISOString().split('T')[0]}
          className="bg-gray-700 text-white rounded-lg px-3 py-2 text-sm outline-none border border-gray-600 focus:border-orange-500"/>
        <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)}
          className="bg-gray-700 text-white rounded-lg px-3 py-2 text-sm outline-none border border-gray-600 focus:border-orange-500"/>
        <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)}
          className="bg-gray-700 text-white rounded-lg px-3 py-2 text-sm outline-none border border-gray-600 focus:border-orange-500"/>
        <button onClick={addSlot} disabled={loading || !date}
          className="bg-orange-500 hover:bg-orange-400 text-black font-bold px-4 py-2 rounded-lg text-sm disabled:opacity-50">
          + Add Slot
        </button>
      </div>

      <div className="space-y-2">
        {slots.length === 0 ? (
          <p className="text-gray-500 text-sm">No availability set. Add slots so buyers can book viewings.</p>
        ) : (
          slots.map(slot => (
            <div key={slot.id} className={`flex items-center justify-between px-3 py-2 rounded-lg ${slot.is_booked ? 'bg-green-900 border border-green-700' : 'bg-gray-700'}`}>
              <div>
                <span className="text-sm font-medium">{slot.date}</span>
                <span className="text-gray-400 text-sm ml-3">{slot.start_time} — {slot.end_time}</span>
                {slot.is_booked && <span className="ml-2 text-xs text-green-400 font-semibold">BOOKED</span>}
              </div>
              {!slot.is_booked && (
                <button onClick={() => removeSlot(slot.id)} className="text-gray-500 hover:text-red-400 text-sm">✕</button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
