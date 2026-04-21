'use client'
import React from 'react'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface Property {
  id: string
  title: string
  address: string
  suburb: string
  city: string
  price: number
  price_type: string
  bedrooms: number
  bathrooms: number
  photos: string[]
  match_score: number
  match_reason: string
  has_pool: boolean
  has_solar: boolean
  is_golf_estate: boolean
  has_gated_community: boolean
}

export default function SearchPage() {
  const [mobileTab, setMobileTab] = React.useState<'chat' | 'results'>('chat')
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hi! I'm your PropertyAI Concierge 👋 I'm here to help you find your perfect property in South Africa.\n\nJust tell me what you're looking for in your own words — where you want to live, what type of property, how many bedrooms, any must-have features. The more you tell me, the better I can help!\n\nWhat kind of property are you dreaming of? 🏡"
    }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [properties, setProperties] = useState<Property[]>([])
  const [suggestedPrompts, setSuggestedPrompts] = useState<string[]>([
    '3 bedrooms',
    'I want to rent',
    'I want to buy',
    'Pet friendly',
    'Pool and garden',
    'Under R15,000/mo'
  ])
  const [savedIds, setSavedIds] = useState<string[]>([])
  const [rejectedIds, setRejectedIds] = useState<string[]>([])
  const [user, setUser] = useState<any>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user)
      if (data.user) {
        fetchUserPreferences(data.user.id)
      }
    })
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const fetchUserPreferences = async (userId: string) => {
    const { data: saved } = await supabase.from('saved_properties').select('property_id').eq('user_id', userId)
    const { data: rejected } = await supabase.from('rejected_properties').select('property_id').eq('user_id', userId)
    setSavedIds(saved?.map(s => s.property_id) || [])
    setRejectedIds(rejected?.map(r => r.property_id) || [])
  }

  const sendMessage = async () => {
    if (!input.trim() || loading) return

    const newMessages: Message[] = [...messages, { role: 'user', content: input }]
    setMessages(newMessages)
    setInput('')
    setLoading(true)

    try {
      const response = await fetch('/api/ai-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
          user_id: user?.id
        })
      })

      const data = await response.json()
      setMessages(prev => [...prev, { role: 'assistant', content: data.message }])
      if (data.suggested_prompts?.length > 0) setSuggestedPrompts(data.suggested_prompts)
      if (data.properties?.length > 0) {
        setProperties(prev => {
          const existingIds = prev.map(p => p.id)
          const newProps = data.properties.filter((p: Property) => !existingIds.includes(p.id))
          return [...newProps, ...prev]
        })
      }
    } catch (e) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, something went wrong. Please try again.' }])
    }

    setLoading(false)
  }

  const handleSave = async (propertyId: string) => {
    if (!user) { window.location.href = '/auth/login?next=/search'; return }
    await fetch('/api/save-property', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: user.id, property_id: propertyId })
    })
    setSavedIds(prev => [...prev, propertyId])
  }

  const handleReject = async (propertyId: string) => {
    if (!user) { window.location.href = '/auth/login?next=/search'; return }
    await fetch('/api/reject-property', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: user.id, property_id: propertyId })
    })
    setRejectedIds(prev => [...prev, propertyId])
    setProperties(prev => prev.filter(p => p.id !== propertyId))
    setMessages(prev => [...prev, {
      role: 'assistant',
      content: "Got it — I've removed that one and won't show it to you again. Would you like me to search for more options, or shall we adjust your criteria?"
    }])
  }

  const formatPrice = (price: number, type: string) => {
    return `R ${price?.toLocaleString()}${type === 'rent' ? '/mo' : ''}`
  }

  return (
    <main className="min-h-screen bg-gray-900 text-white flex flex-col">
      {/* Nav */}
      <nav className="bg-gray-800 border-b border-gray-700 px-4 md:px-6 py-4 flex justify-between items-center flex-shrink-0">
        <Link href="/" className="text-2xl font-bold">
          Property<span className="text-orange-500">AI</span>gency
        </Link>
        <div className="flex gap-4 items-center">
          {user && (
            <Link href="/dashboard" className="text-gray-300 hover:text-orange-500 text-sm">
              My Dashboard
            </Link>
          )}
          {user ? (
            <Link href="/saved" className="bg-orange-500 text-black px-4 py-2 rounded-lg font-semibold hover:bg-orange-400 text-sm">
              Saved Properties ({savedIds.length})
            </Link>
          ) : (
            <Link href="/auth/login?next=/search" className="bg-orange-500 text-black px-4 py-2 rounded-lg font-semibold hover:bg-orange-400 text-sm">
              Sign In to Save
            </Link>
          )}
        </div>
      </nav>

      {/* Mobile tab switcher */}
      <div className="md:hidden flex border-b border-gray-700 flex-shrink-0">
        <button onClick={() => setMobileTab('chat')}
          className={`flex-1 py-3 text-sm font-semibold transition ${mobileTab === 'chat' ? 'text-orange-500 border-b-2 border-orange-500' : 'text-gray-400'}`}>
          💬 AI Chat
        </button>
        <button onClick={() => setMobileTab('results')}
          className={`flex-1 py-3 text-sm font-semibold transition ${mobileTab === 'results' ? 'text-orange-500 border-b-2 border-orange-500' : 'text-gray-400'}`}>
          🏠 Properties
        </button>
      </div>
      <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
        {/* Chat Panel */}
        <div className={`flex-col w-full md:w-96 md:max-w-sm border-b md:border-b-0 md:border-r border-gray-700 md:flex ${mobileTab === "chat" ? "flex" : "hidden md:flex"}`} style={{height: "calc(100vh - 60px)", minHeight: "500px"}}>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.map((message, i) => (
              <div key={i} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {message.role === 'assistant' && (
                  <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-black font-bold text-sm mr-3 flex-shrink-0 mt-1">
                    AI
                  </div>
                )}
                <div className={`max-w-sm rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  message.role === 'user' 
                    ? 'bg-orange-500 text-black rounded-br-sm' 
                    : 'bg-gray-800 text-gray-100 rounded-bl-sm'
                }`}>
                  {message.content.split('\n').map((line, j) => (
                    <span key={j}>{line}{j < message.content.split('\n').length - 1 && <br/>}</span>
                  ))}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-black font-bold text-sm mr-3 flex-shrink-0">
                  AI
                </div>
                <div className="bg-gray-800 rounded-2xl rounded-bl-sm px-4 py-3">
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

          {/* Input */}
          <div className="p-4 border-t border-gray-700 flex-shrink-0">
            <div className="flex gap-2 mb-3 pb-2" style={{overflowX: "auto", flexWrap: "nowrap"}}>
              {suggestedPrompts.map((p, i) => (
                <button key={i} onClick={() => { setInput(p) }}
                  className="whitespace-nowrap text-xs bg-gray-700 hover:bg-gray-600 text-gray-200 border border-gray-600 rounded-full px-4 py-2 transition flex-shrink-0 font-medium">
                  {p}
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Tell me what you're looking for..."
                className="flex-1 bg-gray-800 text-white rounded-xl px-4 py-3 outline-none border border-gray-600 focus:border-orange-500 text-sm"
              />
              <button
                onClick={sendMessage}
                disabled={loading || !input.trim()}
                className="bg-orange-500 hover:bg-orange-400 text-black font-bold px-5 py-3 rounded-xl disabled:opacity-50 transition"
              >
                Send
              </button>
            </div>
            <p className="text-gray-500 text-xs mt-2 text-center">
              Press Enter to send · Your AI Concierge is here to help 24/7
            </p>
          </div>
        </div>

        {/* Properties Panel */}
        <div className={`flex-1 overflow-y-auto p-4 md:p-6 ${mobileTab === "results" ? "block" : "hidden md:block"}`}>
          {properties.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="text-6xl mb-4">🏡</div>
              <h3 className="text-xl font-bold text-gray-300 mb-2">Your matches will appear here</h3>
              <p className="text-gray-500 text-sm max-w-xs">
                Chat with your AI Concierge and tell it what you're looking for. It will find the perfect properties for you.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <h3 className="text-lg font-bold text-gray-300">
                🏡 Properties Found ({properties.filter(p => !rejectedIds.includes(p.id)).length})
              </h3>
              {properties.filter(p => !rejectedIds.includes(p.id)).map(property => (
                <div key={property.id} className="bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden">
                  {/* Match score bar */}
                  <div className="h-1 bg-gray-700">
                    <div 
                      className={`h-full ${property.match_score >= 90 ? 'bg-green-500' : property.match_score >= 75 ? 'bg-yellow-500' : 'bg-orange-500'}`}
                      style={{width: `${property.match_score}%`}}
                    />
                  </div>

                  {/* Photo */}
                  <div className="h-40 bg-gray-700 relative">
                    {property.photos?.[0] ? (
                      <img src={property.photos[0]} alt={property.title} className="w-full h-full object-cover"/>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-4xl">🏠</div>
                    )}
                    <div className={`absolute top-3 right-3 px-2 py-1 rounded-full text-xs font-bold ${
                      property.match_score >= 90 ? 'bg-green-500 text-black' : 
                      property.match_score >= 75 ? 'bg-yellow-500 text-black' : 
                      'bg-orange-500 text-black'
                    }`}>
                      {property.match_score}% Match
                    </div>
                  </div>

                  <div className="p-4">
                    <h4 className="font-bold text-white">{property.title}</h4>
                    <p className="text-gray-400 text-sm">📍 {property.suburb}, {property.city}</p>
                    <p className="text-orange-500 font-bold text-lg mt-1">{formatPrice(property.price, property.price_type)}</p>
                    
                    <div className="flex gap-3 text-gray-400 text-xs mt-2">
                      <span>🛏 {property.bedrooms} beds</span>
                      <span>🚿 {property.bathrooms} baths</span>
                      {property.has_pool && <span>🏊 Pool</span>}
                      {property.has_solar && <span>☀️ Solar</span>}
                      {property.has_gated_community && <span>🔒 Gated</span>}
                    </div>

                    {/* Match reason */}
                    <div className="mt-3 p-2 bg-gray-700 rounded-lg">
                      <p className="text-xs text-gray-300">🤖 {property.match_reason}</p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => handleReject(property.id)}
                        className="flex-1 py-2 rounded-lg border border-gray-600 text-gray-400 hover:border-red-500 hover:text-red-400 text-sm transition"
                      >
                        ✕ Not for me
                      </button>
                      <Link
                        href={`/property/${property.id}`}
                        className="flex-1 py-2 rounded-lg border border-gray-600 text-gray-300 hover:border-gray-400 text-sm transition text-center"
                      >
                        👁 View
                      </Link>
                      <button
                        onClick={() => handleSave(property.id)}
                        disabled={savedIds.includes(property.id)}
                        className={`flex-1 py-2 rounded-lg text-sm font-semibold transition ${
                          savedIds.includes(property.id)
                            ? 'bg-green-700 text-green-300 cursor-default'
                            : 'bg-orange-500 hover:bg-orange-400 text-black'
                        }`}
                      >
                        {savedIds.includes(property.id) ? '✓ Saved' : '♡ Save'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
