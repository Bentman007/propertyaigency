'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'

interface SupplierMessageThreadProps {
  requestId:       string
  supplierId:      string
  buyerId:         string
  currentUserId:   string
  currentUserType: 'buyer' | 'supplier'
  supplierName?:   string
  serviceType?:    string
}

export default function SupplierMessageThread({
  requestId, supplierId, buyerId, currentUserId, currentUserType, supplierName, serviceType
}: SupplierMessageThreadProps) {
  const [messages, setMessages]           = useState<any[]>([])
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [input, setInput]                 = useState('')
  const [sending, setSending]             = useState(false)
  const [loading, setLoading]             = useState(true)
  const [suggestedReply, setSuggestedReply] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => { loadConversation() }, [requestId, supplierId, buyerId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (!conversationId) return
    const channel = supabase
      .channel(`supplier-messages:${conversationId}`)
      .on('postgres_changes', {
        event:  'INSERT',
        schema: 'public',
        table:  'messages',
        filter: `conversation_id=eq.${conversationId}`,
      }, payload => {
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
      .eq('request_id', requestId)
      .eq('supplier_id', supplierId)
      .eq('buyer_id', buyerId)
      .eq('conversation_type', 'supplier')
      .single()

    if (conv) {
      setConversationId(conv.id)
      const res  = await fetch(`/api/messages?conversation_id=${conv.id}&user_id=${currentUserId}`)
      const data = await res.json()
      setMessages(data.messages || [])
    }
    setLoading(false)
  }

  const sendMessage = async (content: string) => {
    if (!content.trim() || sending) return
    setSending(true)
    setSuggestedReply('')

    const res  = await fetch('/api/supplier-messages', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        request_id:   requestId,
        supplier_id:  supplierId,
        buyer_id:     buyerId,
        sender_id:    currentUserId,
        sender_type:  currentUserType,
        content,
        service_type: serviceType,
        supplier_name: supplierName,
      }),
    })
    const data = await res.json()
    if (data.conversation_id && !conversationId) {
      setConversationId(data.conversation_id)
      await loadConversation()
    }
    if (data.suggested_reply) setSuggestedReply(data.suggested_reply)
    setInput('')
    setSending(false)
  }

  const formatTime = (ts: string) =>
    new Date(ts).toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })

  return (
    <div className="flex flex-col bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-700 flex items-center gap-3">
        <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-black font-bold text-xs">AI</div>
        <div>
          <p className="font-semibold text-sm">
            {currentUserType === 'buyer'
              ? `Message ${supplierName || 'Supplier'}`
              : 'Client Message'}
          </p>
          <p className="text-xs text-gray-400 capitalize">{serviceType?.replace(/_/g, ' ')} · Via PropertyAIgency</p>
        </div>
      </div>

      {/* Privacy notice */}
      <div className="px-4 py-2 bg-gray-750 border-b border-gray-700">
        <p className="text-xs text-gray-500">
          🔒 All messages are routed through PropertyAIgency. Contact details are not shared until you accept a quote.
        </p>
      </div>

      {/* Messages */}
      <div className="h-64 overflow-y-auto p-4 space-y-3">
        {loading ? (
          <p className="text-gray-500 text-sm text-center">Loading...</p>
        ) : messages.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 text-sm">No messages yet.</p>
            <p className="text-gray-600 text-xs mt-1">
              {currentUserType === 'buyer'
                ? `Ask ${supplierName || 'the supplier'} a question about their quote.`
                : 'The client will message you here if they have questions.'}
            </p>
          </div>
        ) : messages.map((msg, i) => {
          const isMe = msg.sender_id === currentUserId
          return (
            <div key={i} className={`flex gap-2 ${isMe ? 'justify-end' : 'justify-start'}`}>
              {!isMe && (
                <div className="w-7 h-7 bg-gray-600 rounded-full flex items-center justify-center text-xs flex-shrink-0">
                  {currentUserType === 'buyer' ? '🏢' : '👤'}
                </div>
              )}
              <div className={`rounded-xl px-3 py-2 text-sm max-w-xs ${
                isMe ? 'bg-orange-500 text-black' : 'bg-gray-700 text-gray-200'
              }`}>
                <p>{msg.content}</p>
                <p className={`text-xs mt-1 ${isMe ? 'text-orange-900' : 'text-gray-500'}`}>
                  {formatTime(msg.created_at)}
                </p>
              </div>
            </div>
          )
        })}
        <div ref={messagesEndRef}/>
      </div>

      {/* AI suggested reply */}
      {suggestedReply && (
        <div className="px-4 py-2 border-t border-gray-700 bg-gray-750">
          <p className="text-xs text-gray-500 mb-1">✨ Suggested reply:</p>
          <button onClick={() => { setInput(suggestedReply); setSuggestedReply('') }}
            className="text-sm text-orange-400 hover:text-orange-300 text-left">
            {suggestedReply}
          </button>
        </div>
      )}

      {/* Input */}
      <div className="p-3 border-t border-gray-700 flex gap-2">
        <input value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage(input)}
          placeholder={currentUserType === 'buyer' ? 'Ask a question...' : 'Reply to client...'}
          className="flex-1 bg-gray-700 text-white rounded-lg px-3 py-2 text-sm outline-none border border-gray-600 focus:border-orange-500"/>
        <button onClick={() => sendMessage(input)} disabled={sending || !input.trim()}
          className="bg-orange-500 hover:bg-orange-400 text-black font-bold px-4 py-2 rounded-lg text-sm disabled:opacity-50">
          {sending ? '...' : 'Send'}
        </button>
      </div>
    </div>
  )
}
