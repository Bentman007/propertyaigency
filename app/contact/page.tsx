'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function ContactPage() {
  const [messages, setMessages] = useState<{role: string, content: string}[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [escalated, setEscalated] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [showForm, setShowForm] = useState(false)

  const sendMessage = async () => {
    if (!input.trim()) return
    setLoading(true)
    const newMessages = [...messages, { role: 'user', content: input }]
    setMessages(newMessages)
    setInput('')

    const response = await fetch('/api/contact-ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        message: input,
        history: messages
      })
    })
    const data = await response.json()
    setMessages([...newMessages, { role: 'assistant', content: data.message }])
    if (data.escalate) setShowForm(true)
    setLoading(false)
  }

  const submitEscalation = async () => {
    if (!name || !email) return
    setEscalated(true)
    // In production this would send an email to Andrew
    await fetch('/api/contact-ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        escalate: true,
        name, email,
        conversation: messages
      })
    })
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-stone-100 to-stone-50 text-stone-900">
      <nav className="bg-stone-100 border-b border-stone-200 px-6 py-4 flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold">
          Property<span className="text-orange-500">AI</span>gency
        </Link>
        <div className="flex gap-4">
          <Link href="/search" className="text-stone-500 hover:text-stone-900 text-sm">Search</Link>
          <Link href="/auth/login" className="text-stone-500 hover:text-stone-900 text-sm">Sign In</Link>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-12">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">How can we help? 👋</h1>
          <p className="text-stone-500">Chat with our AI assistant — available 24/7. For complex enquiries, we'll connect you with Andrew directly.</p>
        </div>

        {/* Contact options */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { icon: '🏠', title: 'List a Property', desc: 'Learn how to advertise', prompt: 'How do I list a property on PropertyAIgency?' },
            { icon: '💰', title: 'Pricing', desc: 'Plans and costs', prompt: 'What does it cost to advertise on PropertyAIgency?' },
            { icon: '🤝', title: 'Agency Partnership', desc: 'National contracts', prompt: 'I represent a large estate agency and want to discuss a partnership' },
          ].map(option => (
            <button key={option.title} onClick={() => setInput(option.prompt)}
              className="bg-white border border-stone-300 hover:border-orange-500 rounded-xl p-4 text-left transition">
              <div className="text-2xl mb-2">{option.icon}</div>
              <p className="font-semibold text-sm">{option.title}</p>
              <p className="text-stone-500 text-xs mt-1">{option.desc}</p>
            </button>
          ))}
        </div>

        {/* Chat box */}
        <div className="bg-white rounded-2xl border border-stone-300 overflow-hidden">
          {/* Header */}
          <div className="px-5 py-4 border-b border-stone-300 flex items-center gap-3">
            <div className="w-9 h-9 bg-orange-500 rounded-full flex items-center justify-center text-black font-bold text-sm">AI</div>
            <div>
              <p className="font-semibold text-sm">PropertyAIgency Assistant</p>
              <p className="text-xs text-green-400">● Online 24/7</p>
            </div>
          </div>

          {/* Messages */}
          <div className="h-80 overflow-y-auto p-5 space-y-4">
            {messages.length === 0 && (
              <div className="flex gap-3">
                <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-black font-bold text-xs flex-shrink-0">AI</div>
                <div className="bg-stone-100 rounded-xl px-4 py-3 text-sm text-stone-800 max-w-md">
                  Hi! 👋 I'm the PropertyAIgency assistant. I can help with questions about listing properties, pricing, how our platform works, or anything else. What can I help you with?
                </div>
              </div>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'assistant' && (
                  <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-black font-bold text-xs flex-shrink-0">AI</div>
                )}
                <div className={`rounded-xl px-4 py-3 text-sm max-w-md whitespace-pre-wrap ${
                  msg.role === 'user' ? 'bg-orange-500 text-black' : 'bg-stone-100 text-stone-800'
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-black font-bold text-xs flex-shrink-0">AI</div>
                <div className="bg-stone-100 rounded-xl px-4 py-3 text-sm text-stone-500 animate-pulse">Typing...</div>
              </div>
            )}
          </div>

          {/* Escalation form */}
          {showForm && !escalated && (
            <div className="px-5 py-4 bg-orange-950 border-t border-orange-800">
              <p className="text-orange-300 text-sm font-semibold mb-3">📞 Connect with Andrew directly</p>
              <div className="flex gap-3">
                <input value={name} onChange={e => setName(e.target.value)}
                  placeholder="Your name"
                  className="flex-1 bg-white text-stone-900 rounded-lg px-3 py-2 text-sm outline-none border border-stone-300 focus:border-orange-500"/>
                <input value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="Your email"
                  className="flex-1 bg-white text-stone-900 rounded-lg px-3 py-2 text-sm outline-none border border-stone-300 focus:border-orange-500"/>
                <button onClick={submitEscalation}
                  className="bg-orange-500 hover:bg-orange-400 text-black font-bold px-4 py-2 rounded-lg text-sm">
                  Send
                </button>
              </div>
            </div>
          )}

          {escalated && (
            <div className="px-5 py-4 bg-green-950 border-t border-green-800">
              <p className="text-green-300 text-sm">✅ Thanks! Andrew will be in touch within 24 hours.</p>
            </div>
          )}

          {/* Input */}
          {!escalated && (
            <div className="p-4 border-t border-stone-300 flex gap-3">
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendMessage()}
                placeholder="Type your question..."
                className="flex-1 bg-stone-100 text-stone-900 rounded-xl px-4 py-3 outline-none border border-stone-300 focus:border-orange-500 text-sm"
              />
              <button onClick={sendMessage} disabled={loading || !input.trim()}
                className="bg-orange-500 hover:bg-orange-400 text-black font-bold px-5 py-3 rounded-xl disabled:opacity-50 transition">
                Send
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
