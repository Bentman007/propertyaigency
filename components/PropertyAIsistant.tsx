'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import VoiceInput from '@/components/VoiceInput'

interface Message {
  id: string
  message_type: string
  title: string
  content: string
  is_read: boolean
  created_at: string
  property_id?: string
  metadata?: any
}

interface Thread {
  property_id: string | null
  property_title: string
  messages: Message[]
  unread: number
  last_at: string
}

export default function PropertyAIsistant({ agentId }: { agentId: string }) {
  const [threads, setThreads] = useState<Thread[]>([])
  const [activeThread, setActiveThread] = useState<Thread | null>(null)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => { fetchMessages() }, [])
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [activeThread])

  const fetchMessages = async () => {
    const res = await fetch(`/api/aisistant?agent_id=${agentId}`)
    const data = await res.json()
    const msgs: Message[] = data.messages || []

    // Group by property_id into threads
    const threadMap: { [key: string]: Thread } = {}
    msgs.forEach(msg => {
      const key = msg.property_id || 'general'
      if (!threadMap[key]) {
        threadMap[key] = {
          property_id: msg.property_id || null,
          property_title: msg.metadata?.property_title || (key === 'general' ? 'General' : 'Property'),
          messages: [],
          unread: 0,
          last_at: msg.created_at
        }
      }
      threadMap[key].messages.push(msg)
      if (!msg.is_read) threadMap[key].unread++
      if (msg.created_at > threadMap[key].last_at) threadMap[key].last_at = msg.created_at
    })

    const sorted = Object.values(threadMap).sort((a, b) => b.last_at.localeCompare(a.last_at))
    setThreads(sorted)
    setLoading(false)
  }

  const openThread = async (thread: Thread) => {
    setActiveThread(thread)
    // Mark all as read
    const unreadIds = thread.messages.filter(m => !m.is_read).map(m => m.id)
    if (unreadIds.length > 0) {
      await supabase.from('aisistant_messages').update({ is_read: true }).in('id', unreadIds)
      setThreads(prev => prev.map(t => t.property_id === thread.property_id ? { ...t, unread: 0 } : t))
    }
  }

  const sendMessage = async () => {
    if (!input.trim() || sending || !activeThread) return
    setSending(true)

    // Add user message to thread
    const userMsg: Message = {
      id: Date.now().toString(),
      message_type: 'agent_reply',
      title: 'You',
      content: input,
      is_read: true,
      created_at: new Date().toISOString(),
      property_id: activeThread.property_id || undefined
    }
    setActiveThread(prev => prev ? { ...prev, messages: [...prev.messages, userMsg] } : prev)
    const userInput = input
    setInput('')

    // Get AI response
    const res = await fetch('/api/agent-ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        agent_id: agentId,
        message: userInput,
        property_id: activeThread.property_id,
        property_title: activeThread.property_title,
        context: activeThread.messages.slice(-5).map(m => `${m.title}: ${m.content}`).join('\n')
      })
    })
    const data = await res.json()

    const aiMsg: Message = {
      id: (Date.now() + 1).toString(),
      message_type: 'ai_reply',
      title: 'AIsistant',
      content: data.reply || 'Sorry, I could not process that.',
      is_read: true,
      created_at: new Date().toISOString(),
      property_id: activeThread.property_id || undefined
    }
    setActiveThread(prev => prev ? { ...prev, messages: [...prev.messages, aiMsg] } : prev)
    setSending(false)
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
  }

  const formatTime = (ts: string) => new Date(ts).toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })
  const formatDate = (ts: string) => new Date(ts).toLocaleDateString('en-ZA', { weekday: 'short', day: 'numeric', month: 'short' })

  if (loading) return <div className="text-center text-stone-400 py-8">Loading AIsistant...</div>

  // Thread list view
  if (!activeThread) return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-stone-800">🤖 Property AIsistant</h3>
        <span className="text-xs text-stone-400">{threads.reduce((a, t) => a + t.unread, 0)} unread</span>
      </div>
      {threads.length === 0 ? (
        <div className="text-center py-8 text-stone-400 text-sm">No messages yet — your AIsistant will brief you before each viewing</div>
      ) : (
        <div className="space-y-2 overflow-y-auto max-h-80">
          {threads.map((thread, i) => (
            <button key={i} onClick={() => openThread(thread)}
              className="w-full text-left bg-stone-50 hover:bg-stone-100 border border-stone-200 rounded-xl p-3 transition">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  <span className="text-sm">🏠</span>
                  <span className="font-semibold text-stone-800 text-sm truncate max-w-[160px]">{thread.property_title}</span>
                  {thread.unread > 0 && (
                    <span className="bg-orange-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">{thread.unread}</span>
                  )}
                </div>
                <span className="text-stone-400 text-xs flex-shrink-0">{formatDate(thread.last_at)}</span>
              </div>
              <p className="text-stone-500 text-xs mt-1 truncate">
                {thread.messages[thread.messages.length - 1]?.content?.slice(0, 80)}...
              </p>
            </button>
          ))}
        </div>
      )}
    </div>
  )

  // Thread conversation view
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 mb-3">
        <button onClick={() => setActiveThread(null)} className="text-stone-400 hover:text-stone-700 text-sm">← Back</button>
        <h3 className="font-bold text-stone-800 truncate">🏠 {activeThread.property_title}</h3>
      </div>
      <div className="flex-1 overflow-y-auto space-y-3 mb-3 max-h-64">
        {activeThread.messages.map((msg, i) => {
          const isAgent = msg.message_type === 'agent_reply'
          return (
            <div key={i} className={`flex ${isAgent ? 'justify-end' : 'justify-start'}`}>
              <div className={`rounded-xl px-3 py-2 max-w-xs text-sm ${isAgent ? 'bg-orange-500 text-white' : 'bg-stone-100 text-stone-800'}`}>
                {!isAgent && <p className="text-xs font-bold text-orange-500 mb-1">{msg.title}</p>}
                <p className="leading-relaxed">{msg.content}</p>
                <p className={`text-xs mt-1 ${isAgent ? 'text-orange-200' : 'text-stone-400'}`}>{formatTime(msg.created_at)}</p>
              </div>
            </div>
          )
        })}
        {sending && (
          <div className="flex justify-start">
            <div className="bg-stone-100 rounded-xl px-3 py-2 text-sm text-stone-400">AIsistant is typing...</div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="flex gap-2">
        <input value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && sendMessage()}
          placeholder="Ask about this property..."
          className="flex-1 bg-stone-100 text-stone-800 rounded-lg px-3 py-2 text-sm outline-none border border-stone-200 focus:border-orange-500" />
        <VoiceInput onTranscript={text => setInput(text)} disabled={sending} />
        <button onClick={sendMessage} disabled={sending || !input.trim()}
          className="bg-orange-500 hover:bg-orange-400 text-white font-bold px-3 py-2 rounded-lg text-sm disabled:opacity-50">
          Send
        </button>
      </div>
    </div>
  )
}
