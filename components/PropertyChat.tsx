'use client'
import { useState } from 'react'

interface Message {
  role: 'user' | 'ai'
  text: string
}

export default function PropertyChat({ property }: { property: any }) {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    { role: 'ai', text: `Hi! I'm the AI assistant for ${property.title}. Ask me anything about this property, the area, pricing, or the buying process!` }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  const send = async () => {
    if (!input.trim() || loading) return
    const userMsg = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', text: userMsg }])
    setLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg, property })
      })
      const data = await res.json()
      setMessages(prev => [...prev, { role: 'ai', text: data.reply }])
    } catch {
      setMessages(prev => [...prev, { role: 'ai', text: 'Sorry, something went wrong. Please try again.' }])
    }
    setLoading(false)
  }

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="w-full border border-gray-600 text-gray-300 font-bold py-3 rounded-lg hover:border-orange-500 hover:text-orange-500 transition-colors text-sm"
      >
        🤖 {open ? 'Close AI Chat' : 'Ask AI About This Property'}
      </button>

      {open && (
        <div className="mt-3 bg-gray-900 border border-gray-700 rounded-xl overflow-hidden">
          <div className="bg-gray-800 px-4 py-3 border-b border-gray-700 flex items-center gap-2">
            <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></span>
            <span className="text-sm font-bold text-white">AI Property Assistant</span>
            <span className="text-xs text-gray-400 ml-auto">Replies instantly</span>
          </div>

          <div className="h-64 overflow-y-auto p-4 space-y-3">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-xs rounded-xl px-4 py-2 text-sm ${
                  msg.role === 'user'
                    ? 'bg-orange-500 text-black font-medium'
                    : 'bg-gray-700 text-gray-200'
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-700 rounded-xl px-4 py-2 text-sm text-gray-400">
                  AI is typing...
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-gray-700 p-3 flex gap-2">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && send()}
              className="flex-1 bg-gray-800 text-white rounded-lg px-3 py-2 text-sm outline-none border border-gray-600 focus:border-orange-500"
              placeholder="Ask anything about this property..."
            />
            <button
              onClick={send}
              disabled={loading}
              className="bg-orange-500 text-black px-4 py-2 rounded-lg font-bold text-sm hover:bg-orange-400 disabled:opacity-50"
            >
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
