'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import MessageThread from './MessageThread'

export default function ConversationsList({ agentId }: { agentId: string }) {
  const [conversations, setConversations] = useState<any[]>([])
  const [selected, setSelected] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchConversations()
    // Refresh every 30 seconds
    const interval = setInterval(fetchConversations, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchConversations = async () => {
    const response = await fetch(`/api/messages?user_id=${agentId}`)
    const data = await response.json()
    setConversations(data.conversations || [])
    setLoading(false)
  }

  return (
    <div className="bg-white rounded-2xl border border-stone-300 overflow-hidden">
      <div className="px-4 py-3 border-b border-stone-300 flex items-center justify-between">
        <h3 className="font-bold">💬 Messages</h3>
        {conversations.reduce((a, c) => a + (c.agent_unread || 0), 0) > 0 && (
          <span className="bg-orange-500 text-black text-xs font-bold px-2 py-0.5 rounded-full">
            {conversations.reduce((a, c) => a + (c.agent_unread || 0), 0)} new
          </span>
        )}
      </div>

      {selected ? (
        <div className="h-96">
          <div className="px-3 py-2 border-b border-stone-300">
            <button onClick={() => setSelected(null)} className="text-orange-500 text-sm hover:underline">
              ← Back to conversations
            </button>
          </div>
          <div className="h-80">
            <MessageThread
              propertyId={selected.property_id}
              agentId={agentId}
              buyerId={selected.buyer_id}
              currentUserId={agentId}
              currentUserType="agent"
              propertyTitle={selected.properties?.title}
            />
          </div>
        </div>
      ) : (
        <div className="divide-y divide-gray-700">
          {loading ? (
            <p className="text-stone-400 text-sm p-4">Loading...</p>
          ) : conversations.length === 0 ? (
            <div className="p-6 text-center">
              <p className="text-3xl mb-2">💬</p>
              <p className="text-stone-500 text-sm">No conversations yet</p>
              <p className="text-stone-400 text-xs mt-1">Messages from buyers will appear here</p>
            </div>
          ) : (
            conversations.map(conv => (
              <div
                key={conv.id}
                onClick={() => setSelected(conv)}
                className="flex items-center gap-3 p-4 hover:bg-stone-100 cursor-pointer transition"
              >
                <div className="w-10 h-10 bg-stone-200 rounded-full flex items-center justify-center text-xl flex-shrink-0">
                  {conv.properties?.photos?.[0] ? (
                    <img src={conv.properties.photos[0]} className="w-full h-full object-cover rounded-full" alt=""/>
                  ) : '🏠'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{conv.properties?.title}</p>
                  <p className="text-stone-500 text-xs truncate">{conv.last_message}</p>
                  <p className="text-stone-400 text-xs">
                    {new Date(conv.last_message_at).toLocaleDateString('en-ZA')}
                  </p>
                </div>
                {conv.agent_unread > 0 && (
                  <span className="bg-orange-500 text-black text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0">
                    {conv.agent_unread}
                  </span>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
