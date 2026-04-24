'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface PropertyChatProps {
  property: any
}

export default function PropertyChat({ property }: PropertyChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: `Hi! I know this property well — ask me anything about ${property.title}, the area, bond calculations or transfer costs. What would you like to know? 🏡`
    }
  ])
  const [input, setInput] = useState('')
  const [suggestedPrompts, setSuggestedPrompts] = useState<string[]>([
    'Is this still available?',
    'What are schools nearby?',
    'What is the area like?',
    'Calculate my bond',
    'Transfer costs?',
    'Book a viewing'
  ])
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [showBooking, setShowBooking] = useState(false)
  const [availableSlots, setAvailableSlots] = useState<any[]>([])
  const [bookingConfirmed, setBookingConfirmed] = useState(false)
  const [leadTemp, setLeadTemp] = useState('cold')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const sessionId = useRef(Math.random().toString(36).substring(2))

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      setUser(data.user)
      if (!data.user) return
      
      // Check buyer's history with this property
      const [saved, bookings, offers] = await Promise.all([
        supabase.from('saved_properties').select('id').eq('user_id', data.user.id).eq('property_id', property.id).single(),
        supabase.from('viewing_bookings').select('*').eq('searcher_id', data.user.id).eq('property_id', property.id).order('created_at', { ascending: false }).limit(1),
        supabase.from('offers').select('*').eq('buyer_id', data.user.id).eq('property_id', property.id).order('created_at', { ascending: false }).limit(1)
      ])

      const name = data.user.user_metadata?.full_name?.split(' ')[0] || ''
      const greeting = name ? `Hi ${name}! ` : 'Welcome back! '

      if (offers.data?.length) {
        const offer = offers.data[0]
        setMessages([{ role: 'assistant', content: `${greeting}Your offer of R${Number(offer.amount).toLocaleString()} on ${property.title} is ${offer.status}. Would you like an update or want to discuss next steps?` }])
      } else if (bookings.data?.length) {
        const booking = bookings.data[0]
        const dateStr = new Date(booking.booking_date).toLocaleDateString('en-ZA', { weekday: 'long', day: 'numeric', month: 'long' })
        if (booking.status === 'confirmed') {
          setMessages([{ role: 'assistant', content: `${greeting}You have a viewing booked for ${property.title} on ${dateStr}. How can I help you prepare? Want bond or transfer cost info?` }])
        } else {
          setMessages([{ role: 'assistant', content: `${greeting}How did the viewing go on ${dateStr} for ${property.title}? Ready to make an offer, or shall I find similar properties?` }])
        }
      } else if (saved.data) {
        setMessages([{ role: 'assistant', content: `${greeting}You saved ${property.title} — still interested? I can book a viewing, calculate your bond, or tell you more about the area.` }])
      }
    })
  }, [])

  useEffect(() => {
    if (messages.length > 0) {
      const container = messagesEndRef.current?.parentElement
      if (container) container.scrollTop = container.scrollHeight
    }
  }, [messages])

  const sendMessage = async (directMessage?: string) => {
    const text = directMessage ?? input
    if (!text.trim() || loading) return

    const newMessages: Message[] = [...messages, { role: 'user', content: text }]
    setMessages(newMessages)
    setInput('')
    setLoading(true)

    try {
      const response = await fetch('/api/property-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map((m: Message) => ({ role: m.role, content: m.content })),
          property,
          user_id: user?.id,
          session_id: sessionId.current
        })
      })

      const data = await response.json()
      setMessages(prev => [...prev, { role: 'assistant', content: data.message }])
      if (data.suggested_prompts?.length > 0) setSuggestedPrompts(data.suggested_prompts)
      
      if (data.lead?.temperature) setLeadTemp(data.lead.temperature)
      if (data.show_booking) {
        setAvailableSlots(data.slots || [])
        setShowBooking(true)
      }
    } catch (e) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, something went wrong. Please try again.' }])
    }

    setLoading(false)
  }

  const bookViewing = async (slot: any) => {
    if (!user) { window.location.href = `/auth/login?next=/property/${property.id}`; return }
    
    const response = await fetch('/api/book-viewing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        property_id: property.id,
        agent_id: property.user_id,
        searcher_id: user.id,
        slot,
        session_id: sessionId.current
      })
    })

    if (response.ok) {
      setBookingConfirmed(true)
      setShowBooking(false)
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `✅ Your viewing is booked for **${slot.date} at ${slot.start_time}**!\n\nThe agent has been notified and will confirm shortly. Is there anything else you'd like to know about the property before your visit?`
      }])
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-stone-300 overflow-hidden">
      <div className="px-4 py-3 border-b border-stone-300 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-black font-bold text-sm">AI</div>
          <div>
            <p className="font-semibold text-sm">AI Property Concierge</p>
            <p className="text-xs text-green-400">● Online 24/7</p>
          </div>
        </div>
        {leadTemp === 'hot' && <span className="text-xs bg-red-900 text-red-300 px-2 py-1 rounded-full">🔥 Hot Lead</span>}
        {leadTemp === 'warm' && <span className="text-xs bg-yellow-900 text-yellow-300 px-2 py-1 rounded-full">⚡ Warm Lead</span>}
      </div>

      {/* Messages */}
      <div className="h-80 overflow-y-auto p-4 space-y-3">
        {messages.map((message, i) => (
          <div key={i} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {message.role === 'assistant' && (
              <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center text-black font-bold text-xs mr-2 flex-shrink-0 mt-1">AI</div>
            )}
            <div className={`max-w-xs rounded-2xl px-3 py-2 text-sm leading-relaxed ${
              message.role === 'user'
                ? 'bg-orange-500 text-black rounded-br-sm'
                : 'bg-stone-100 text-stone-900 rounded-bl-sm'
            }`}>
              {message.content.split('\n').map((line, j) => (
                <span key={j}>{line.replace(/\*\*(.*?)\*\*/g, '$1')}{j < message.content.split('\n').length - 1 && <br/>}</span>
              ))}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center text-black font-bold text-xs mr-2">AI</div>
            <div className="bg-stone-100 rounded-2xl rounded-bl-sm px-3 py-2">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce" style={{animationDelay: '0ms'}}/>
                <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce" style={{animationDelay: '150ms'}}/>
                <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce" style={{animationDelay: '300ms'}}/>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Booking slots */}
      {showBooking && availableSlots.length > 0 && (
        <div className="px-4 py-3 border-t border-stone-300 bg-stone-50">
          <p className="text-sm font-semibold mb-2">📅 Available viewing slots:</p>
          <div className="space-y-2">
            {availableSlots.map((slot, i) => (
              <button key={i} onClick={() => bookViewing(slot)}
                className="w-full text-left px-3 py-2 bg-stone-100 hover:bg-orange-500 hover:text-black rounded-lg text-sm transition">
                {slot.date} at {slot.start_time}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="px-4 py-3 border-t border-stone-300">
        <div className="flex gap-2 mb-2" style={{overflowX: 'auto'}}>
          {suggestedPrompts.map((p, i) => (
            <button key={i} onClick={() => sendMessage(p)}
              className="whitespace-nowrap text-xs bg-stone-100 hover:bg-stone-200 text-stone-800 border border-stone-300 rounded-full px-3 py-1.5 transition flex-shrink-0">
              {p}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Ask anything about this property..."
            className="flex-1 bg-stone-100 text-stone-800 rounded-lg px-3 py-2 outline-none border border-stone-300 focus:border-orange-500 text-sm"
          />
          <button onClick={() => sendMessage()} disabled={loading || !input.trim()}
            className="bg-orange-500 hover:bg-orange-400 text-black font-bold px-4 py-2 rounded-lg disabled:opacity-50 text-sm">
            Send
          </button>
        </div>
        {!user && (
          <p className="text-xs text-stone-400 mt-1 text-center">
            <a href={`/auth/login?next=/property/${property.id}`} className="text-orange-500 hover:underline">Sign in</a> to book a viewing
          </p>
        )}
      </div>
    </div>
  )
}
