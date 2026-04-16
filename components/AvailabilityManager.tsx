'use client'

import { useState, useEffect } from 'react'

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
const DAY_LABELS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

const defaultTemplate = {
  monday_start: '09:00', monday_end: '17:00',
  tuesday_start: '09:00', tuesday_end: '17:00',
  wednesday_start: '09:00', wednesday_end: '17:00',
  thursday_start: '09:00', thursday_end: '17:00',
  friday_start: '09:00', friday_end: '17:00',
  saturday_start: '09:00', saturday_end: '13:00',
  sunday_start: '', sunday_end: '',
  viewing_duration_minutes: 30,
  travel_buffer_minutes: 20
}

export default function AvailabilityManager({ agentId }: { agentId: string }) {
  const [template, setTemplate] = useState<any>(defaultTemplate)
  const [blockedDates, setBlockedDates] = useState<any[]>([])
  const [newBlockedDate, setNewBlockedDate] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTemplate()
    fetchBlockedDates()
  }, [])

  const fetchTemplate = async () => {
    const response = await fetch(`/api/availability?agent_id=${agentId}&days_ahead=1`)
    const data = await response.json()
    if (data.template) setTemplate(data.template)
    setLoading(false)
  }

  const fetchBlockedDates = async () => {
    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    const today = new Date().toISOString().split('T')[0]
    const { data } = await supabase
      .from('agent_blocked_dates')
      .select('*')
      .eq('agent_id', agentId)
      .gte('blocked_date', today)
      .order('blocked_date', { ascending: true })
    setBlockedDates(data || [])
  }

  const saveTemplate = async () => {
    setSaving(true)
    console.log('Saving template:', JSON.stringify(template))
    await fetch('/api/availability', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agent_id: agentId, template })
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const [newBlockedStart, setNewBlockedStart] = useState('')
  const [newBlockedEnd, setNewBlockedEnd] = useState('')
  const [blockType, setBlockType] = useState<'all_day' | 'time_range'>('all_day')

  const addBlockedDate = async () => {
    if (!newBlockedDate) return
    await fetch('/api/availability', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        agent_id: agentId, 
        blocked_date: newBlockedDate,
        start_time: blockType === 'time_range' ? newBlockedStart : null,
        end_time: blockType === 'time_range' ? newBlockedEnd : null,
        reason: blockType === 'time_range' ? `Blocked ${newBlockedStart}-${newBlockedEnd}` : 'All day'
      })
    })
    setNewBlockedDate('')
    setNewBlockedStart('')
    setNewBlockedEnd('')
    fetchBlockedDates()
  }

  const removeBlockedDate = async (date: string) => {
    await fetch('/api/availability', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agent_id: agentId, remove_blocked_date: date })
    })
    fetchBlockedDates()
  }

  const toggleDay = (day: string) => {
    const isEnabled = template[`${day}_start`]
    setTemplate((prev: any) => ({
      ...prev,
      [`${day}_start`]: isEnabled ? '' : '09:00',
      [`${day}_end`]: isEnabled ? '' : '17:00'
    }))
  }

  if (loading) return <div className="bg-gray-800 rounded-2xl border border-gray-700 p-6"><p className="text-gray-500 text-sm">Loading availability...</p></div>

  return (
    <div className="bg-gray-800 rounded-2xl border border-gray-700 p-6 space-y-6">
      <div>
        <h3 className="text-lg font-bold mb-1">📅 My Viewing Availability</h3>
        <p className="text-gray-400 text-xs">Set your weekly schedule once — the AI will manage bookings around your diary automatically</p>
      </div>

      {/* Weekly Template */}
      <div>
        <p className="text-sm font-semibold text-gray-300 mb-3">Weekly Schedule</p>
        <div className="space-y-2">
          {DAYS.map((day, i) => {
            const isEnabled = !!template[`${day}_start`]
            return (
              <div key={day} className="flex items-center gap-3">
                <button
                  onClick={() => toggleDay(day)}
                  className={`w-24 text-xs font-semibold py-1.5 rounded-lg transition ${
                    isEnabled ? 'bg-orange-500 text-black' : 'bg-gray-700 text-gray-500'
                  }`}
                >
                  {DAY_LABELS[i]}
                </button>
                {isEnabled ? (
                  <div className="flex items-center gap-2">
                    <input type="time" value={template[`${day}_start`] || ''}
                      onChange={e => setTemplate((p: any) => ({ ...p, [`${day}_start`]: e.target.value }))}
                      className="bg-gray-700 text-white rounded-lg px-2 py-1 text-sm outline-none border border-gray-600 focus:border-orange-500"/>
                    <span className="text-gray-500 text-sm">to</span>
                    <input type="time" value={template[`${day}_end`] || ''}
                      onChange={e => setTemplate((p: any) => ({ ...p, [`${day}_end`]: e.target.value }))}
                      className="bg-gray-700 text-white rounded-lg px-2 py-1 text-sm outline-none border border-gray-600 focus:border-orange-500"/>
                  </div>
                ) : (
                  <span className="text-gray-600 text-sm">Not available</span>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Viewing Settings */}
      <div>
        <p className="text-sm font-semibold text-gray-300 mb-3">🤖 AI Diary Settings</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Viewing duration</label>
            <select value={template.viewing_duration_minutes}
              onChange={e => setTemplate((p: any) => ({ ...p, viewing_duration_minutes: parseInt(e.target.value) }))}
              className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 text-sm outline-none border border-gray-600 focus:border-orange-500">
              <option value={30}>30 minutes</option>
              <option value={45}>45 minutes</option>
              <option value={60}>1 hour</option>
              <option value={90}>1.5 hours</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Travel buffer between viewings</label>
            <select value={template.travel_buffer_minutes}
              onChange={e => setTemplate((p: any) => ({ ...p, travel_buffer_minutes: parseInt(e.target.value) }))}
              className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 text-sm outline-none border border-gray-600 focus:border-orange-500">
              <option value={15}>15 minutes</option>
              <option value={20}>20 minutes</option>
              <option value={30}>30 minutes</option>
              <option value={45}>45 minutes</option>
              <option value={60}>1 hour</option>
            </select>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          🤖 The AI will automatically prevent double-bookings and allow enough travel time between properties
        </p>
      </div>

      {/* Save button */}
      <button onClick={saveTemplate} disabled={saving}
        className={`w-full py-2.5 rounded-lg font-semibold text-sm transition ${
          saved ? 'bg-green-600 text-white' : 'bg-orange-500 hover:bg-orange-400 text-black'
        } disabled:opacity-50`}>
        {saving ? 'Saving...' : saved ? '✓ Saved!' : 'Save Schedule'}
      </button>

      {/* Blocked Dates */}
      <div>
        <p className="text-sm font-semibold text-gray-300 mb-3">🚫 Block Out Dates</p>
        <div className="flex gap-2 mb-3">
          <input type="date" value={newBlockedDate}
            onChange={e => setNewBlockedDate(e.target.value)}
            min={new Date().toISOString().split('T')[0]}
            className="flex-1 bg-gray-700 text-white rounded-lg px-3 py-2 text-sm outline-none border border-gray-600 focus:border-orange-500"/>
          <button onClick={addBlockedDate} disabled={!newBlockedDate}
            className="bg-red-700 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-50">
            Block
          </button>
        </div>
        {blockedDates.length > 0 && (
          <div className="space-y-1">
            {blockedDates.map(b => (
              <div key={b.id} className="flex items-center justify-between bg-red-900 border border-red-700 rounded-lg px-3 py-2">
                <span className="text-red-300 text-sm">🚫 {new Date(b.blocked_date).toLocaleDateString('en-ZA', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
                <button onClick={() => removeBlockedDate(b.blocked_date)} className="text-red-500 hover:text-red-300 text-sm">✕</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
