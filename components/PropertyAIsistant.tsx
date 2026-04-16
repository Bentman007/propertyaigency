'use client'

import { useState, useEffect } from 'react'

interface AIsistantMessage {
  id: string
  message_type: string
  title: string
  content: string
  is_read: boolean
  created_at: string
  properties?: { title: string, photos: string[] }
}

export default function PropertyAIsistant({ agentId }: { agentId: string }) {
  const [messages, setMessages] = useState<AIsistantMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    fetchMessages()
    // Refresh every 60 seconds
    const interval = setInterval(fetchMessages, 60000)
    return () => clearInterval(interval)
  }, [])

  const fetchMessages = async () => {
    const response = await fetch(`/api/aisistant?agent_id=${agentId}`)
    const data = await response.json()
    const msgs = data.messages || []
    setMessages(msgs)
    setUnreadCount(msgs.filter((m: AIsistantMessage) => !m.is_read).length)
    setLoading(false)
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'lead_brief': return '🔥'
      case 'booking_update': return '📅'
      case 'listing_insight': return '🤖'
      case 'hot_lead': return '👀'
      default: return '💬'
    }
  }

  const getTypeBg = (type: string) => {
    switch (type) {
      case 'lead_brief': return 'border-l-orange-500'
      case 'booking_update': return 'border-l-blue-500'
      case 'listing_insight': return 'border-l-purple-500'
      case 'hot_lead': return 'border-l-red-500'
      default: return 'border-l-gray-500'
    }
  }

  const formatContent = (content: string) => {
    return content.split('**').map((part, i) => 
      i % 2 === 1 ? <strong key={i}>{part}</strong> : part
    )
  }

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)
    if (mins < 60) return `${mins}m ago`
    if (hours < 24) return `${hours}h ago`
    return `${days}d ago`
  }

  return (
    <div className="bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-black font-bold text-xs">PA</div>
          <div>
            <p className="font-bold text-sm">Property <span className="text-orange-500">AI</span>sistant</p>
            <p className="text-xs text-green-400">● Your Personal Assistant</p>
          </div>
        </div>
        {unreadCount > 0 && (
          <span className="bg-orange-500 text-black text-xs font-bold px-2 py-0.5 rounded-full">
            {unreadCount} new
          </span>
        )}
      </div>

      {/* Messages */}
      <div className="divide-y divide-gray-700 max-h-96 overflow-y-auto">
        {loading ? (
          <div className="p-6 text-center text-gray-500 text-sm">Loading messages...</div>
        ) : messages.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-3xl mb-2">🤖</p>
            <p className="text-gray-400 text-sm font-semibold">Your Property AIsistant is ready</p>
            <p className="text-gray-500 text-xs mt-1">Messages about your listings will appear here</p>
          </div>
        ) : (
          messages.map(msg => (
            <div key={msg.id} className={`p-4 border-l-4 ${getTypeBg(msg.message_type)} ${!msg.is_read ? 'bg-gray-750' : ''}`}>
              <div className="flex justify-between items-start mb-1">
                <p className="font-semibold text-sm flex items-center gap-1">
                  <span>{getTypeIcon(msg.message_type)}</span>
                  <span>{msg.title}</span>
                </p>
                <span className="text-gray-500 text-xs flex-shrink-0 ml-2">{timeAgo(msg.created_at)}</span>
              </div>
              <p className="text-gray-300 text-sm leading-relaxed">
                {formatContent(msg.content)}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
