'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

const ADMIN_EMAIL = 'sharp61@hotmail.com'

export default function AdminPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<any>({})
  const [activeAI, setActiveAI] = useState<'marketing' | 'sales' | 'support'>('marketing')
  const [aiInput, setAiInput] = useState('')
  const [aiResponse, setAiResponse] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiHistory, setAiHistory] = useState<{role: string, content: string}[]>([])

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user || data.user.email !== ADMIN_EMAIL) {
        window.location.href = '/'
        return
      }
      setUser(data.user)
      await fetchStats()
      setLoading(false)
    })
  }, [])

  const fetchStats = async () => {
    const today = new Date().toISOString().split('T')[0]
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    // All properties
    const { data: allProps } = await supabase.from('properties').select('id, status, created_at, title, price, price_type, suburb, city, views')
    
    // Users
    const { data: profiles } = await supabase.from('profiles').select('id, full_name, agency_name, account_type, created_at')

    // Views
    const { data: allViews } = await supabase.from('property_views').select('id, viewed_at, property_id')

    // Bookings
    const { data: bookings } = await supabase.from('viewing_bookings').select('id, status, created_at, date')

    // Search sessions
    const { data: searches } = await supabase.from('search_sessions').select('id, created_at')

    const todayViews = allViews?.filter(v => v.viewed_at?.startsWith(today)).length || 0
    const weekViews = allViews?.filter(v => v.viewed_at >= weekAgo).length || 0
    const monthViews = allViews?.filter(v => v.viewed_at >= monthAgo).length || 0

    const todayProps = allProps?.filter(p => p.created_at?.startsWith(today)).length || 0
    const weekProps = allProps?.filter(p => p.created_at >= weekAgo).length || 0

    const activeProps = allProps?.filter(p => p.status === 'active').length || 0
    const underOffer = allProps?.filter(p => p.status === 'under_offer').length || 0
    const sold = allProps?.filter(p => p.status === 'sold').length || 0

    const agents = profiles?.filter(p => p.account_type === 'agent').length || 0
    const buyers = profiles?.filter(p => p.account_type === 'buyer').length || 0
    const todaySignups = profiles?.filter(p => p.created_at?.startsWith(today)).length || 0

    const pendingBookings = bookings?.filter(b => b.status === 'pending').length || 0
    const confirmedBookings = bookings?.filter(b => b.status === 'confirmed').length || 0
    const weekBookings = bookings?.filter(b => b.created_at >= weekAgo).length || 0

    // Most viewed properties
    const propViewCounts = allProps?.map(p => ({
      ...p,
      view_count: allViews?.filter(v => v.property_id === p.id).length || 0
    })).sort((a, b) => b.view_count - a.view_count).slice(0, 5) || []

    setStats({
      allProps, todayProps, weekProps, activeProps, underOffer, sold,
      agents, buyers, todaySignups, totalUsers: profiles?.length || 0,
      todayViews, weekViews, monthViews, totalViews: allViews?.length || 0,
      pendingBookings, confirmedBookings, weekBookings, totalBookings: bookings?.length || 0,
      totalSearches: searches?.length || 0,
      propViewCounts
    })
  }

  const askAI = async () => {
    if (!aiInput.trim()) return
    setAiLoading(true)
    const newHistory = [...aiHistory, { role: 'user', content: aiInput }]
    setAiHistory(newHistory)
    setAiInput('')
    
    const response = await fetch('/api/admin-ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ai_type: activeAI, context: aiInput })
    })
    const data = await response.json()
    setAiHistory([...newHistory, { role: 'assistant', content: data.message || 'Sorry, something went wrong.' }])
    setAiLoading(false)
  }

  if (loading) return (
    <main className="min-h-screen bg-gray-900 flex items-center justify-center">
      <p className="text-orange-500 animate-pulse text-xl">Loading Control Centre...</p>
    </main>
  )

  return (
    <main className="min-h-screen bg-gray-900 text-white">
      <nav className="bg-gray-950 border-b border-gray-800 px-6 py-4 flex justify-between items-center">
        <div>
          <a href="/" className="text-2xl font-bold">Property<span className="text-orange-500">AI</span>gency</a>
          <span className="ml-3 bg-orange-500 text-black text-xs font-bold px-2 py-0.5 rounded">ADMIN</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="text-gray-400 hover:text-white text-sm">Agent Dashboard</Link>
          <button onClick={() => supabase.auth.signOut().then(() => window.location.href = '/')}
            className="text-gray-400 hover:text-white text-sm">Sign Out</button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">🎛️ Control Centre</h1>
          <p className="text-gray-400 mt-1">Platform overview — {new Date().toLocaleDateString('en-ZA', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</p>
        </div>

        {/* Traffic Stats */}
        <h2 className="text-lg font-bold text-orange-500 mb-3">📊 Traffic</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Views Today', value: stats.todayViews, color: 'text-orange-400' },
            { label: 'Views This Week', value: stats.weekViews, color: 'text-orange-400' },
            { label: 'Views This Month', value: stats.monthViews, color: 'text-orange-400' },
            { label: 'Total Views', value: stats.totalViews, color: 'text-orange-400' },
          ].map(s => (
            <div key={s.label} className="bg-gray-800 rounded-xl p-4 border border-gray-700">
              <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-gray-400 text-sm mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Listings Stats */}
        <h2 className="text-lg font-bold text-orange-500 mb-3">🏠 Listings</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          {[
            { label: 'New Today', value: stats.todayProps, color: 'text-blue-400' },
            { label: 'New This Week', value: stats.weekProps, color: 'text-blue-400' },
            { label: 'Active', value: stats.activeProps, color: 'text-green-400' },
            { label: 'Under Offer', value: stats.underOffer, color: 'text-yellow-400' },
            { label: 'Sold/Rented', value: stats.sold, color: 'text-red-400' },
          ].map(s => (
            <div key={s.label} className="bg-gray-800 rounded-xl p-4 border border-gray-700">
              <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-gray-400 text-sm mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Users Stats */}
        <h2 className="text-lg font-bold text-orange-500 mb-3">👤 Users</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Users', value: stats.totalUsers, color: 'text-purple-400' },
            { label: 'Agents', value: stats.agents, color: 'text-purple-400' },
            { label: 'Buyers/Renters', value: stats.buyers, color: 'text-purple-400' },
            { label: 'New Today', value: stats.todaySignups, color: 'text-purple-400' },
          ].map(s => (
            <div key={s.label} className="bg-gray-800 rounded-xl p-4 border border-gray-700">
              <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-gray-400 text-sm mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Bookings Stats */}
        <h2 className="text-lg font-bold text-orange-500 mb-3">📅 Viewings</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Bookings', value: stats.totalBookings, color: 'text-green-400' },
            { label: 'This Week', value: stats.weekBookings, color: 'text-green-400' },
            { label: 'Pending', value: stats.pendingBookings, color: 'text-yellow-400' },
            { label: 'Confirmed', value: stats.confirmedBookings, color: 'text-green-400' },
          ].map(s => (
            <div key={s.label} className="bg-gray-800 rounded-xl p-4 border border-gray-700">
              <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-gray-400 text-sm mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Most viewed properties */}
        <h2 className="text-lg font-bold text-orange-500 mb-3">🔥 Most Viewed Properties</h2>
        <div className="bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden mb-8">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left px-4 py-3 text-gray-400 text-sm">Property</th>
                <th className="text-left px-4 py-3 text-gray-400 text-sm">Location</th>
                <th className="text-left px-4 py-3 text-gray-400 text-sm">Price</th>
                <th className="text-left px-4 py-3 text-gray-400 text-sm">Status</th>
                <th className="text-right px-4 py-3 text-gray-400 text-sm">Views</th>
              </tr>
            </thead>
            <tbody>
              {stats.propViewCounts?.map((p: any) => (
                <tr key={p.id} className="border-b border-gray-700 hover:bg-gray-750">
                  <td className="px-4 py-3">
                    <Link href={`/property/${p.id}`} className="text-orange-500 hover:underline text-sm font-semibold">
                      {p.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-sm">{p.suburb}, {p.city}</td>
                  <td className="px-4 py-3 text-sm">R {p.price?.toLocaleString()}{p.price_type === 'rent' ? '/mo' : ''}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                      p.status === 'active' ? 'bg-green-900 text-green-300' :
                      p.status === 'under_offer' ? 'bg-yellow-900 text-yellow-300' :
                      'bg-red-900 text-red-300'
                    }`}>{p.status}</span>
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-orange-400">{p.view_count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* All Listings */}
        <h2 className="text-lg font-bold text-orange-500 mb-3">📋 All Listings</h2>
        <div className="bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left px-4 py-3 text-gray-400 text-sm">Property</th>
                <th className="text-left px-4 py-3 text-gray-400 text-sm">Location</th>
                <th className="text-left px-4 py-3 text-gray-400 text-sm">Price</th>
                <th className="text-left px-4 py-3 text-gray-400 text-sm">Status</th>
                <th className="text-left px-4 py-3 text-gray-400 text-sm">Listed</th>
              </tr>
            </thead>
            <tbody>
              {stats.allProps?.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                .map((p: any) => (
                <tr key={p.id} className="border-b border-gray-700 hover:bg-gray-750">
                  <td className="px-4 py-3">
                    <Link href={`/property/${p.id}`} className="text-orange-500 hover:underline text-sm font-semibold">
                      {p.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-sm">{p.suburb}, {p.city}</td>
                  <td className="px-4 py-3 text-sm">R {p.price?.toLocaleString()}{p.price_type === 'rent' ? '/mo' : ''}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                      p.status === 'active' ? 'bg-green-900 text-green-300' :
                      p.status === 'under_offer' ? 'bg-yellow-900 text-yellow-300' :
                      'bg-red-900 text-red-300'
                    }`}>{p.status}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-sm">
                    {new Date(p.created_at).toLocaleDateString('en-ZA', { month: 'short', day: 'numeric' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* AI Team */}
        <h2 className="text-lg font-bold text-orange-500 mb-3 mt-8">🤖 Your AI Team</h2>
        <div className="bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden mb-8">
          {/* AI selector */}
          <div className="grid grid-cols-4 border-b border-gray-700">
            {[
              { id: 'marketing', label: '🎯 Marketing AI', desc: 'Social media, campaigns, growth' },
              { id: 'sales', label: '📞 Sales AI', desc: 'Agent acquisition, outreach' },
              { id: 'support', label: '💬 Support AI', desc: 'Handle queries, troubleshoot' },
              { id: 'finance', label: '💰 Finance AI', desc: 'Costs, revenue, CFO insights' },
            ].map(ai => (
              <button key={ai.id} onClick={() => { setActiveAI(ai.id as any); setAiHistory([]) }}
                className={`p-4 text-left transition ${activeAI === ai.id ? 'bg-gray-700 border-b-2 border-orange-500' : 'hover:bg-gray-750'}`}>
                <p className="font-semibold text-sm">{ai.label}</p>
                <p className="text-gray-400 text-xs mt-0.5">{ai.desc}</p>
              </button>
            ))}
          </div>

          {/* Chat area */}
          <div className="h-80 overflow-y-auto p-4 space-y-3">
            {aiHistory.length === 0 && (
              <div className="text-center py-8">
                <p className="text-3xl mb-2">
                  {activeAI === 'marketing' ? '🎯' : activeAI === 'sales' ? '📞' : activeAI === 'finance' ? '💰' : '💬'}
                </p>
                <p className="text-gray-400 text-sm font-semibold">
                  {activeAI === 'marketing' ? 'Marketing AI ready' : activeAI === 'sales' ? 'Sales AI ready' : activeAI === 'finance' ? 'Finance AI ready' : 'Support AI ready'}
                </p>
                <p className="text-gray-500 text-xs mt-1">
                  {activeAI === 'marketing' ? 'Ask me to write a social post, email campaign, or growth strategy' :
                   activeAI === 'sales' ? 'Ask me to draft an outreach email or handle an objection' :
                   'Ask me how to handle a support query or create an FAQ'}
                </p>
              </div>
            )}
            {aiHistory.map((msg, i) => (
              <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'assistant' && (
                  <div className="w-7 h-7 bg-orange-500 rounded-full flex items-center justify-center text-black font-bold text-xs flex-shrink-0">AI</div>
                )}
                <div className={`max-w-2xl rounded-xl px-4 py-2.5 text-sm whitespace-pre-wrap ${
                  msg.role === 'user' ? 'bg-orange-500 text-black' : 'bg-gray-700 text-gray-200'
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}
            {aiLoading && (
              <div className="flex gap-3">
                <div className="w-7 h-7 bg-orange-500 rounded-full flex items-center justify-center text-black font-bold text-xs">AI</div>
                <div className="bg-gray-700 rounded-xl px-4 py-2.5 text-sm text-gray-400 animate-pulse">Thinking...</div>
              </div>
            )}
          </div>

          {/* Quick prompts */}
          <div className="px-4 py-2 border-t border-gray-700 flex gap-2 overflow-x-auto">
            {activeAI === 'marketing' && [
              'Write a LinkedIn post about our AI Concierge',
              'Draft an email to estate agents in Johannesburg',
              'Suggest 3 growth strategies for this month',
            ].map(prompt => (
              <button key={prompt} onClick={() => setAiInput(prompt)}
                className="text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 px-3 py-1.5 rounded-full whitespace-nowrap transition">
                {prompt}
              </button>
            ))}
            {activeAI === 'sales' && [
              'Draft outreach email to Pam Golding',
              'Handle objection: We already use Property24',
              'Create a pitch for a small agency',
            ].map(prompt => (
              <button key={prompt} onClick={() => setAiInput(prompt)}
                className="text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 px-3 py-1.5 rounded-full whitespace-nowrap transition">
                {prompt}
              </button>
            ))}
            {activeAI === 'finance' && [
              'What are my current monthly costs?',
              'When will I break even with 50 agents?',
              'How can I reduce my Anthropic costs?',
            ].map(prompt => (
              <button key={prompt} onClick={() => setAiInput(prompt)}
                className="text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 px-3 py-1.5 rounded-full whitespace-nowrap transition">
                {prompt}
              </button>
            ))}
            {activeAI === 'support' && [
              'Agent cannot edit their listing',
              'Buyer not receiving notifications',
              'How to handle a refund request',
            ].map(prompt => (
              <button key={prompt} onClick={() => setAiInput(prompt)}
                className="text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 px-3 py-1.5 rounded-full whitespace-nowrap transition">
                {prompt}
              </button>
            ))}
          </div>

          {/* Input */}
          <div className="p-4 border-t border-gray-700 flex gap-3">
            <input
              value={aiInput}
              onChange={e => setAiInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && askAI()}
              placeholder={
                activeAI === 'marketing' ? 'Ask your Marketing AI...' :
                activeAI === 'sales' ? 'Ask your Sales AI...' :
                'Ask your Support AI...'
              }
              className="flex-1 bg-gray-700 text-white rounded-xl px-4 py-3 outline-none border border-gray-600 focus:border-orange-500 text-sm"
            />
            <button onClick={askAI} disabled={aiLoading || !aiInput.trim()}
              className="bg-orange-500 hover:bg-orange-400 text-black font-bold px-5 py-3 rounded-xl disabled:opacity-50 transition">
              Send
            </button>
          </div>
        </div>

      </div>
    </main>
  )
}
