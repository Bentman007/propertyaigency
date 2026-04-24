'use client'
import React, { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

interface Message { role: 'user' | 'assistant'; content: string }
interface Property {
  id: string; title: string; address: string; suburb: string; city: string
  price: number; price_type: string; bedrooms: number; bathrooms: number
  photos: string[]; match_score: number; match_reason: string
  has_pool: boolean; has_solar: boolean; has_gated_community: boolean
}

export default function SearchPage() {
  const [mobileTab, setMobileTab] = useState<'chat'|'results'>('chat')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([{
    role: 'assistant',
    content: "Hi! I'm your PropertyAIgency Concierge. Tell me what you're looking for and I'll find your perfect match. 🏡"
  }])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [properties, setProperties] = useState<Property[]>([])
  const [rejectingIds, setRejectingIds] = useState<string[]>([])
  const [suggestedPrompts, setSuggestedPrompts] = useState<string[]>([
    'Show me what is available', '3 bedrooms', 'I want to rent', 'I want to buy', 'Pool and garden', 'Under R15,000/mo'
  ])
  const [savedIds, setSavedIds] = useState<string[]>([])
  const [rejectedIds, setRejectedIds] = useState<string[]>([])
  const [user, setUser] = useState<any>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const allActionedShown = useRef(false)

  // Fix #4: read ?tab=results from URL on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('tab') === 'results') setMobileTab('results')
  }, [])

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user)
      if (data.user) {
        fetchUserPreferences(data.user.id)
        const saved = localStorage.getItem(`chat_${data.user.id}`)
        if (saved) {
          try {
            const parsed = JSON.parse(saved)
            if (parsed.length > 1) setMessages(parsed)
          } catch(e) {}
        }
      }
    })
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Fix #3: auto-switch to chat and show message when all properties actioned
  useEffect(() => {
    if (properties.length === 0) return
    const allActioned = properties.every(p => savedIds.includes(p.id) || rejectedIds.includes(p.id))
    if (allActioned && !allActionedShown.current) {
      allActionedShown.current = true
      setTimeout(() => {
        setMobileTab('chat')
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: "You've been through all the matches! Want me to find more options? I can widen the search area, adjust the budget, or remove a requirement to show you more properties."
        }])
        setSuggestedPrompts(['Show me what is available', 'Widen the search area', 'Adjust my budget', 'Remove a requirement'])
      }, 800)
    }
  }, [savedIds, rejectedIds, properties])

  const fetchUserPreferences = async (userId: string) => {
    const { data: saved } = await supabase.from('saved_properties').select('property_id').eq('user_id', userId)
    const { data: rejected } = await supabase.from('rejected_properties').select('property_id').eq('user_id', userId)
    setSavedIds(saved?.map((s: any) => s.property_id) || [])
    setRejectedIds(rejected?.map((r: any) => r.property_id) || [])
    const { data: profile } = await supabase.from('searcher_profiles').select('*').eq('user_id', userId).single()
    if (profile && (profile.locations?.length > 0 || profile.budget_max)) {
      const parts: string[] = []
      if (profile.bedrooms_min) parts.push(`${profile.bedrooms_min} bedroom`)
      if (profile.locations?.length > 0) parts.push(`in ${profile.locations[0]}`)
      if (profile.budget_max) parts.push(`around R${Number(profile.budget_max).toLocaleString()}`)
      if (parts.length > 0) {
        setMessages([{ role: 'assistant', content: `Welcome back! Are you still looking for a ${parts.join(' ')}? I can pick up where we left off, or we can start a fresh search. 🏡` }])
      }
    }
  }

  const sendMessage = async (directMessage?: string) => {
    const messageText = directMessage || input
    if (!messageText.trim() || loading) return
    const newMessages: Message[] = [...messages, { role: 'user', content: messageText }]
    setMessages(newMessages)
    setInput('')
    setLoading(true)
    try {
      const response = await fetch('/api/ai-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages, user_id: user?.id })
      })
      const data = await response.json()
      const cleanMsg = (data.message || '')
        .replace(/<lead>[\s\S]*?<\/lead>/g, '')
        .replace(/<properties>[\s\S]*?<\/properties>/g, '')
        .replace(/<profile>[\s\S]*?<\/profile>/g, '')
        .replace(/<prompts>[\s\S]*?<\/prompts>/g, '')
        .replace(/<feedback>[\s\S]*?<\/feedback>/g, '')
        .replace(/<lead>/g, '').replace(/<\/lead>/g, '')
        .replace(/<properties>/g, '').replace(/<\/properties>/g, '')
        .trim()
      setMessages(prev => [...prev, { role: 'assistant', content: cleanMsg }])
      // Fix #5: always keep "Show me what is available" first
      if (data.suggested_prompts?.length > 0) {
        const rest = (data.suggested_prompts as string[]).filter((p: string) => p !== 'Show me what is available')
        setSuggestedPrompts(['Show me what is available', ...rest])
      }
      if (data.properties?.length > 0) {
        allActionedShown.current = false
        // Fix #1: add new properties but never remove; rejectedIds filter handles hiding
        setProperties(prev => {
          const existingIds = prev.map(p => p.id)
          const newProps = data.properties.filter((p: Property) => !existingIds.includes(p.id))
          return [...newProps, ...prev]
        })
        setMobileTab('results')
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

  // Fix #1 + #2: keep properties in state, use rejectedIds to filter; animate out with rejectingIds
  const handleReject = (propertyId: string) => {
    if (!user) { window.location.href = '/auth/login?next=/search'; return }
    setRejectingIds(prev => [...prev, propertyId])
    setTimeout(() => {
      setRejectedIds(prev => [...prev, propertyId])
      setRejectingIds(prev => prev.filter(id => id !== propertyId))
      fetch('/api/reject-property', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id, property_id: propertyId })
      })
    }, 350)
  }

  const formatPrice = (price: number, type: string) => {
    const formatted = `R${price?.toLocaleString()}`
    return type === 'rent' ? `${formatted}/mo` : formatted
  }

  const visibleCount = properties.filter(p => !rejectedIds.includes(p.id) && !rejectingIds.includes(p.id)).length

  return (
    <main className="h-screen flex flex-col bg-[#f5f0eb] text-stone-900 overflow-hidden">

      {/* Fix #7 + #8: taupe nav, hamburger on mobile */}
      <nav className="bg-[#4a4238] px-4 py-3 flex justify-between items-center flex-shrink-0">
        <Link href="/" className="text-xl font-bold text-white">Property<span className="text-orange-400">AI</span>gency</Link>
        <div className="hidden md:flex gap-3 items-center">
          {user && <Link href="/dashboard" className="text-stone-300 hover:text-orange-300 text-sm">My Dashboard</Link>}
          <Link href="/saved" className="bg-orange-500 text-white px-3 py-1.5 rounded-lg font-semibold hover:bg-orange-400 text-sm">
            Saved ({savedIds.length})
          </Link>
        </div>
        <button className="md:hidden text-white text-xl leading-none px-1" onClick={() => setMobileMenuOpen(o => !o)} aria-label="Menu">
          {mobileMenuOpen ? '✕' : '☰'}
        </button>
      </nav>
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#3d3530] px-4 py-3 space-y-2 flex-shrink-0">
          {user && <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)} className="block text-stone-200 text-sm py-1.5">My Dashboard</Link>}
          <Link href="/saved" onClick={() => setMobileMenuOpen(false)} className="block text-orange-400 font-semibold text-sm py-1.5">
            Saved ({savedIds.length})
          </Link>
        </div>
      )}

      {/* Mobile tabs */}
      <div className="md:hidden flex border-b border-stone-200 flex-shrink-0 bg-white">
        <button onClick={() => setMobileTab('chat')}
          className={`flex-1 py-3 text-sm font-semibold transition ${mobileTab === 'chat' ? 'text-orange-500 border-b-2 border-orange-500' : 'text-stone-500'}`}>
          💬 AI Chat
        </button>
        <button onClick={() => setMobileTab('results')}
          className={`flex-1 py-3 text-sm font-semibold transition ${mobileTab === 'results' ? 'text-orange-500 border-b-2 border-orange-500' : visibleCount > 0 ? 'text-orange-400' : 'text-stone-500'}`}>
          🏠 Properties {visibleCount > 0 && <span className="bg-orange-500 text-white text-xs rounded-full px-1.5 ml-1">{visibleCount}</span>}
        </button>
      </div>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">

        {/* Chat Panel */}
        <div className={`flex flex-col w-full md:w-96 md:max-w-sm border-r border-stone-200 ${mobileTab === 'chat' ? 'flex' : 'hidden md:flex'}`}>
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#f5f0eb]">
            {messages.map((message, i) => (
              <div key={i} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {message.role === 'assistant' && (
                  <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold text-sm mr-2 flex-shrink-0 mt-1">AI</div>
                )}
                <div className={`max-w-xs rounded-2xl px-4 py-3 text-sm leading-relaxed ${message.role === 'user' ? 'bg-[#4a4238] text-white rounded-br-sm' : 'bg-white text-stone-900 rounded-bl-sm shadow-sm'}`}>
                  {message.content.split('\n').map((line, j) => (
                    <span key={j}>{line}{j < message.content.split('\n').length - 1 && <br/>}</span>
                  ))}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold text-sm mr-2 flex-shrink-0">AI</div>
                <div className="bg-white rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce" style={{animationDelay:'0ms'}}/>
                    <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce" style={{animationDelay:'150ms'}}/>
                    <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce" style={{animationDelay:'300ms'}}/>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef}/>
          </div>
          <div className="flex-shrink-0 border-t border-stone-200 p-3 bg-white">
            <div className="flex gap-2 mb-2" style={{overflowX:'auto'}}>
              {suggestedPrompts.map((p, i) => (
                <button key={i} onClick={() => sendMessage(p)}
                  className="whitespace-nowrap text-xs bg-[#f5f0eb] hover:bg-[#ede7e0] text-stone-800 border border-stone-300 rounded-full px-3 py-1.5 transition flex-shrink-0">
                  {p}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <input type="text" value={input} onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendMessage()}
                placeholder="Tell me what you're looking for..."
                className="flex-1 bg-[#f5f0eb] text-stone-900 rounded-xl px-4 py-2.5 outline-none border border-stone-300 focus:border-orange-500 text-sm"/>
              <button onClick={() => sendMessage()} disabled={loading || !input.trim()}
                className="bg-orange-500 hover:bg-orange-400 text-white font-bold px-4 py-2.5 rounded-xl disabled:opacity-50 transition text-sm">
                Send
              </button>
            </div>
            <p className="text-stone-400 text-xs mt-1.5 text-center">Your AI Concierge is here to help 24/7</p>
          </div>
        </div>

        {/* Properties Panel */}
        <div className={`flex-1 overflow-y-auto p-4 md:p-6 ${mobileTab === 'results' ? 'block' : 'hidden md:block'}`}>
          {properties.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="text-6xl mb-4">🏡</div>
              <h3 className="text-xl font-bold text-stone-700 mb-2">Your matches will appear here</h3>
              <p className="text-stone-500 text-sm max-w-xs">Chat with your AI Concierge and tell it what you're looking for. It will find the perfect properties for you.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <h3 className="text-lg font-bold text-stone-700 col-span-full">
                🏡 Properties Found ({visibleCount})
              </h3>
              {/* Fix #1: filter by rejectedIds only; rejectingIds drives animation */}
              {properties.filter(p => !rejectedIds.includes(p.id)).map(property => (
                <div key={property.id}
                  className={`bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm transition-all duration-300 ${rejectingIds.includes(property.id) ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
                  <div className="h-1 bg-stone-100">
                    <div className={`h-full ${property.match_score >= 90 ? 'bg-green-500' : property.match_score >= 75 ? 'bg-yellow-500' : 'bg-orange-500'}`}
                      style={{width:`${property.match_score}%`}}/>
                  </div>
                  <div className="h-40 bg-stone-100 relative">
                    {property.photos?.[0]
                      ? <img src={property.photos[0]} alt={property.title} className="w-full h-full object-cover"/>
                      : <div className="w-full h-full flex items-center justify-center text-4xl">🏠</div>
                    }
                    <div className={`absolute top-3 right-3 px-2 py-1 rounded-full text-xs font-bold ${property.match_score >= 90 ? 'bg-green-500' : property.match_score >= 75 ? 'bg-yellow-500' : 'bg-orange-500'} text-white`}>
                      {property.match_score}% Match
                    </div>
                  </div>
                  <div className="p-4">
                    <h4 className="font-bold text-stone-900">{property.title}</h4>
                    <p className="text-stone-500 text-sm">📍 {property.suburb}, {property.city}</p>
                    <p className="text-orange-500 font-bold text-lg mt-1">{formatPrice(property.price, property.price_type)}</p>
                    <div className="flex gap-3 text-stone-500 text-xs mt-2">
                      <span>🛏 {property.bedrooms} beds</span>
                      <span>🚿 {property.bathrooms} baths</span>
                      {property.has_pool && <span>🏊 Pool</span>}
                      {property.has_solar && <span>☀️ Solar</span>}
                      {property.has_gated_community && <span>🔒 Gated</span>}
                    </div>
                    <div className="mt-3 p-2 bg-[#f5f0eb] rounded-lg">
                      <p className="text-xs text-stone-700">🤖 {property.match_reason}</p>
                    </div>
                    <div className="flex gap-2 mt-3">
                      {/* Fix #2: instant fade on tap via rejectingIds state */}
                      <button
                        onClick={() => handleReject(property.id)}
                        disabled={rejectingIds.includes(property.id)}
                        className="flex-1 py-2 rounded-lg border border-stone-300 text-stone-500 hover:border-red-400 hover:text-red-400 text-sm transition disabled:opacity-50">
                        ✕ Not for me
                      </button>
                      <Link href={`/property/${property.id}`}
                        className="flex-1 py-2 rounded-lg border border-stone-300 text-stone-700 hover:border-stone-400 text-sm transition text-center">
                        👁 View
                      </Link>
                      <button onClick={() => handleSave(property.id)} disabled={savedIds.includes(property.id)}
                        className={`flex-1 py-2 rounded-lg text-sm font-semibold transition ${savedIds.includes(property.id) ? 'bg-green-600 text-white' : 'bg-orange-500 hover:bg-orange-400 text-white'}`}>
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
