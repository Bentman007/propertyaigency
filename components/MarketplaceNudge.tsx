'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function MarketplaceNudge({ userId }: { userId: string }) {
  const [nudge, setNudge] = useState<any>(null)

  useEffect(() => {
    if (!userId) return
    supabase
      .from('aisistant_messages')
      .select('*')
      .eq('user_id', userId)
      .eq('message_type', 'marketplace_nudge')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
      .then(({ data }) => {
        if (data) setNudge(data)
      })
  }, [userId])

  const dismiss = async () => {
    if (!nudge) return
    await supabase
      .from('aisistant_messages')
      .update({ message_type: 'marketplace_nudge_read' })
      .eq('id', nudge.id)
    setNudge(null)
  }

  if (!nudge) return null

  return (
    <div className="bg-gradient-to-r from-green-900 to-gray-800 border border-green-600 rounded-2xl p-6 mb-8 relative">
      <button onClick={dismiss}
        className="absolute top-3 right-3 text-stone-400 hover:text-stone-900 text-xs">
        ✕ Dismiss
      </button>
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center text-black font-bold text-sm flex-shrink-0">AI</div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-green-400 mb-2">PropertyAIgency Concierge</p>
          <p className="text-stone-800 text-sm leading-relaxed mb-4">{nudge.content}</p>
          <Link href="/moving"
            className="inline-block bg-orange-500 hover:bg-orange-400 text-black font-bold px-6 py-2.5 rounded-xl text-sm transition">
            Explore Moving Services →
          </Link>
        </div>
      </div>
    </div>
  )
}
