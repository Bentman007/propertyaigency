'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function InterestButtons({ propertyId, agentId }: { propertyId: string, agentId: string }) {
  const [user, setUser] = useState<any>(null)
  const [status, setStatus] = useState<'none' | 'interested' | 'very_interested' | 'rejected'>('none')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user || data.user.id === agentId) return
      setUser(data.user)

      const { data: savedProp } = await supabase
        .from('saved_properties')
        .select('interest_level')
        .eq('user_id', data.user.id)
        .eq('property_id', propertyId)
        .single()

      if (savedProp) setStatus(savedProp.interest_level || 'interested')

      const { data: rejected } = await supabase
        .from('rejected_properties')
        .select('id')
        .eq('user_id', data.user.id)
        .eq('property_id', propertyId)
        .single()

      if (rejected) setStatus('rejected')
    })
  }, [])

  const handleInterest = async (level: 'interested' | 'very_interested') => {
    if (!user) { window.location.href = `/auth/login?next=/property/${propertyId}`; return }
    setLoading(true)

    await supabase.from('saved_properties').upsert({
      user_id: user.id,
      property_id: propertyId,
      interest_level: level,
      saved_at: new Date().toISOString()
    }, { onConflict: 'user_id,property_id' })

    await supabase.from('rejected_properties')
      .delete()
      .eq('user_id', user.id)
      .eq('property_id', propertyId)

    if (level === 'very_interested') {
      await fetch('/api/aisistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'hot_lead',
          agent_id: agentId,
          property_id: propertyId,
          data: { view_count: 3 }
        })
      })
    }

    setStatus(level)
    setLoading(false)
  }

  const handleNotInterested = async () => {
    if (!user) { window.location.href = `/auth/login?next=/property/${propertyId}`; return }
    setLoading(true)

    await supabase.from('rejected_properties').upsert({
      user_id: user.id,
      property_id: propertyId
    }, { onConflict: 'user_id,property_id' })

    await supabase.from('saved_properties')
      .delete()
      .eq('user_id', user.id)
      .eq('property_id', propertyId)

    setStatus('rejected')
    setLoading(false)
  }

  if (!user || user.id === agentId) return null

  if (status === 'rejected') return (
    <div className="text-center py-2 mb-3">
      <p className="text-gray-500 text-xs mb-1">You marked this as not interested</p>
      <button onClick={() => {
        setStatus('none')
        supabase.from('rejected_properties').delete().eq('user_id', user.id).eq('property_id', propertyId)
      }} className="text-orange-500 hover:underline text-xs">Undo</button>
    </div>
  )

  return (
    <div className="space-y-2 mb-3">
      <button onClick={() => handleInterest('very_interested')} disabled={loading}
        className={`w-full py-2.5 rounded-xl text-sm font-bold transition ${
          status === 'very_interested' ? 'bg-red-500 text-white' : 'bg-gray-700 hover:bg-red-500 hover:text-white text-gray-300'
        }`}>
        {status === 'very_interested' ? '🔥 Very Interested!' : '🔥 Very Interested'}
      </button>

      <button onClick={() => handleInterest('interested')} disabled={loading}
        className={`w-full py-2.5 rounded-xl text-sm font-bold transition ${
          status === 'interested' ? 'bg-yellow-500 text-black' : 'bg-gray-700 hover:bg-yellow-500 hover:text-black text-gray-300'
        }`}>
        {status === 'interested' ? '💛 Saved — Still Looking' : '💛 Still Looking But Like It'}
      </button>

      <button onClick={handleNotInterested} disabled={loading}
        className="w-full py-2 rounded-xl text-xs text-gray-500 hover:text-red-400 transition">
        👎 Not Interested — Don't Show Again
      </button>
    </div>
  )
}
