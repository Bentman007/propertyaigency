'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'

interface MessageThreadProps {
  propertyId: string
  agentId: string
  buyerId: string
  currentUserId: string
  currentUserType: 'agent' | 'buyer'
  propertyTitle?: string
}

export default function MessageThread({ 
  propertyId, agentId, buyerId, currentUserId, currentUserType, propertyTitle 
}: MessageThreadProps) {
  const [messages, setMessages] = useState<any[]>([])
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [suggestedReply, setSuggestedReply] = useState('')
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadConversation()
  }, [propertyId, agentId, buyerId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (!conversationId) return
    
    // Real-time subscription
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`
      }, (payload) => {
        setMessages(prev => [...prev, payload.new])
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [conversationId])

  const loadConversation = async () => {
    setLoading(true)
    const { data: conv } = await supabase
      .from('conversations')
      .select('id')
      .eq('property_id', propertyId)
      .eq('agent_id', agentId)
      .eq('buyer_id', buyerId)
      .single()

    if (conv) {
      setConversationId(conv.id)
      const response = await fetch(`/api/messages?conversation_id=${conv.id}&user_id=${currentUserId}`)
      const data = await response.json()
      setMessages(data.messages || [])
    }
    setLoading(false)
  }

  const sendMessage = async (content: string) => {
    if (!content.trim() || sending) return
    setSending(true)
    setSuggestedReply('')

    const response = await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        property_id: propertyId,
        agent_id: agentId,
        buyer_id: buyerId,
        sender_id: currentUserId,
        sender_type: currentUserType,
        content
      })
    })

    const data = await response.json()
    if (data.conversation_id && !conversationId) {
      setConversationId(data.conversation_id)
      await loadConversation()
    }
    if (data.suggested_reply) setSuggestedReply(data.suggested_reply)
    setInput('')
    setSending(false)
  }

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-ZA', { 
      hour: '2-digit', minute: '2-digit' 
    })
  }

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString('en-ZA', { 
      weekday: 'short', month: 'short', day: 'numeric' 
    })
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl border border-stone-300 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-stone-300 flex items-center gap-3">
        <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-black font-bold text-sm">
          {currentUserType === 'agent' ? '👤' : '🏠'}
        </div>
        <div>
          <p className="font-semibold text-sm">{propertyTitle || 'Property Conversation'}</p>
          <p className="text-xs text-green-400">● Secure Platform Messaging</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading ? (
          <div className="text-center text-stone-400 text-sm py-8">Loading messages...</div>
        ) : messages.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-4xl mb-2">💬</p>
            <p className="text-stone-500 text-sm">No messages yet</p>
            <p className="text-stone-400 text-xs mt-1">Start the conversation below</p>
          </div>
        ) : (
          messages.map((msg, i) => {
            const isMe = msg.sender_id === currentUserId
            const isAI = msg.sender_type === 'ai'
            const showDate = i === 0 || formatDate(messages[i-1].created_at) !== formatDate(msg.created_at)
            
            return (
              <div key={msg.id}>
                {showDate && (
                  <div className="text-center my-2">
                    <span className="text-xs text-stone-400 bg-stone-100 px-3 py-1 rounded-full">
                      {formatDate(msg.created_at)}
                    </span>
                  </div>
                )}
                <div className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                  {!isMe && (
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs mr-2 flex-shrink-0 mt-1 bg-stone-200">
                      {isAI ? '🤖' : currentUserType === 'agent' ? '👤' : '🏠'}
                    </div>
                  )}
                  <div className={`max-w-xs ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                    {!isMe && (
                      <span className="text-xs text-stone-400 mb-1 ml-1">
                        {isAI ? 'AI Concierge' : currentUserType === 'agent' ? 'Buyer' : 'Agent'}
                      </span>
                    )}
                    <div className={`rounded-2xl px-3 py-2 text-sm ${
                      isMe 
                        ? 'bg-orange-500 text-black rounded-br-sm' 
                        : isAI
                        ? 'bg-purple-900 text-purple-100 rounded-bl-sm border border-purple-700'
                        : 'bg-stone-100 text-stone-900 rounded-bl-sm'
                    }`}>
                      {msg.content}
                    </div>
                    <span className="text-xs text-stone-400 mt-1 mx-1">
                      {formatTime(msg.created_at)}
                      {isMe && <span className="ml-1">{msg.is_read ? '✓✓' : '✓'}</span>}
                    </span>
                  </div>
                </div>
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* AI Suggested Reply */}
      {suggestedReply && (
        <div className="px-4 py-2 bg-purple-900 border-t border-purple-700">
          <p className="text-xs text-purple-300 mb-1">🤖 AI suggested reply:</p>
          <div className="flex gap-2 items-center">
            <p className="text-sm text-purple-100 flex-1">{suggestedReply}</p>
            <button
              onClick={() => { setInput(suggestedReply); setSuggestedReply('') }}
              className="text-xs bg-purple-700 hover:bg-purple-600 px-2 py-1 rounded text-stone-900 flex-shrink-0"
            >
              Use
            </button>
            <button
              onClick={() => setSuggestedReply('')}
              className="text-xs text-purple-400 hover:text-purple-200"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Input */}
      <div className="px-4 py-3 border-t border-stone-300">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage(input)}
            placeholder="Type a message..."
            className="flex-1 bg-stone-100 text-stone-900 rounded-xl px-3 py-2 outline-none border border-stone-300 focus:border-orange-500 text-sm"
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={sending || !input.trim()}
            className="bg-orange-500 hover:bg-orange-400 text-black font-bold px-4 py-2 rounded-xl disabled:opacity-50 text-sm"
          >
            {sending ? '...' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  )
}
