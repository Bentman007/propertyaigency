'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

const ADMIN_EMAIL = 'sharp61@hotmail.com'

export default function AdminPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<any>({})
  const [searchEmail, setSearchEmail] = useState('')
  const [foundUser, setFoundUser] = useState<any>(null)
  const [userListings, setUserListings] = useState<any[]>([])
  const [creditAmount, setCreditAmount] = useState('')
  const [discountAmount, setDiscountAmount] = useState('')
  const [adminNote, setAdminNote] = useState('')
  const [actionMessage, setActionMessage] = useState('')
  const [searchingUser, setSearchingUser] = useState(false)
  const [activeAI, setActiveAI] = useState<'marketing' | 'sales' | 'support' | 'finance' | 'developer' | 'security'>('marketing')
  const [aiInput, setAiInput] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiHistory, setAiHistory] = useState<{role: string, content: string, created_at?: string}[]>([])
  const [feedback, setFeedback] = useState<any[]>([])

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

  const loadChatHistory = async (userId: string, aiType: string) => {
    const { data } = await supabase
      .from('ai_chat_history')
      .select('role, content, created_at')
      .eq('user_id', userId)
      .eq('chat_type', 'admin_' + aiType)
      .order('created_at', { ascending: true })
      .limit(50)
    if (data && data.length > 0) {
      setAiHistory(data.map(m => ({ role: m.role, content: m.content, created_at: m.created_at })))
    }
  }

  const fetchStats = async () => {
    const today = new Date().toISOString().split('T')[0]
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    const { data: allProps } = await supabase.from('properties').select('id, status, created_at, title, price, price_type, suburb, city')
    const { data: profiles } = await supabase.from('profiles').select('id, full_name, agency_name, account_type, created_at')
    const { data: bookings } = await supabase.from('viewing_bookings').select('id, status, created_at')
    const { data: feedbackData } = await supabase.from('feedback').select('*').order('created_at', { ascending: false }).limit(20)
    setFeedback(feedbackData || [])

    const todayProps = allProps?.filter(p => p.created_at?.startsWith(today)).length || 0
    const weekProps = allProps?.filter(p => p.created_at >= weekAgo).length || 0
    const activeProps = allProps?.filter(p => p.status === 'active').length || 0
    const underOffer = allProps?.filter(p => p.status === 'under_offer').length || 0
    const sold = allProps?.filter(p => p.status === 'sold').length || 0

    const agents = profiles?.filter(p => p.account_type === 'agent').length || 0
    const buyers = profiles?.filter(p => p.account_type === 'buyer').length || 0
    const todaySignups = profiles?.filter(p => p.created_at?.startsWith(today)).length || 0
    const loginsWeek = profiles?.filter(p => p.created_at >= weekAgo).length || 0
    const loginsMonth = profiles?.filter(p => p.created_at >= monthAgo).length || 0

    const bookingsToday = bookings?.filter(b => b.created_at?.startsWith(today)).length || 0
    const weekBookings = bookings?.filter(b => b.created_at >= weekAgo).length || 0
    const bookingsMonth = bookings?.filter(b => b.created_at >= monthAgo).length || 0

    setStats({
      todayProps, weekProps, activeProps, underOffer, sold,
      agents, buyers, todaySignups, totalUsers: profiles?.length || 0,
      loginsToday: todaySignups, loginsWeek, loginsMonth,
      bookingsToday, weekBookings, bookingsMonth
    })
  }

  const suspendUser = async (suspend: boolean) => {
    if (!foundUser) return
    const response = await fetch('/api/admin-user-action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: foundUser.id, action: suspend ? 'suspend' : 'unsuspend', note: adminNote })
    })
    const data = await response.json()
    setActionMessage(data.message || (suspend ? '✅ Account suspended' : '✅ Account reinstated'))
    setFoundUser((prev: any) => ({ ...prev, is_suspended: suspend }))
  }

  const searchUser = async () => {
    if (!searchEmail.trim()) return
    setSearchingUser(true)
    setFoundUser(null)
    setUserListings([])
    setActionMessage('')
    const response = await fetch('/api/admin-user-search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: searchEmail })
    })
    const data = await response.json()
    if (data.user) {
      setFoundUser(data.user)
      setUserListings(data.listings || [])
    } else {
      setActionMessage('No user found with that email')
    }
    setSearchingUser(false)
  }

  const applyCredit = async () => {
    if (!foundUser || !creditAmount) return
    const response = await fetch('/api/admin-user-action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: foundUser.id, action: 'add_credit', amount: parseInt(creditAmount), note: adminNote })
    })
    const data = await response.json()
    setActionMessage(data.message || '✅ Credit applied!')
    setCreditAmount('')
  }

  const applyDiscount = async () => {
    if (!foundUser || !discountAmount) return
    const response = await fetch('/api/admin-user-action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: foundUser.id, action: 'add_discount', amount: parseInt(discountAmount), note: adminNote })
    })
    const data = await response.json()
    setActionMessage(data.message || '✅ Discount applied!')
    setDiscountAmount('')
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
      body: JSON.stringify({ ai_type: activeAI, context: aiInput, history: newHistory })
    })
    const data = await response.json()
    const aiReply = data.message || 'Sorry, something went wrong.'
    setAiHistory([...newHistory, { role: 'assistant', content: aiReply, created_at: new Date().toISOString() }])
    // Save both messages to database
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase.from('ai_chat_history').insert([
        { user_id: user.id, chat_type: 'admin_' + activeAI, role: 'user', content: newHistory[newHistory.length-1].content },
        { user_id: user.id, chat_type: 'admin_' + activeAI, role: 'assistant', content: aiReply }
      ])
    }
    setAiLoading(false)
  }

  if (loading) return (
    <main className="min-h-screen bg-stone-50 flex items-center justify-center">
      <p className="text-orange-500 animate-pulse text-xl">Loading Control Centre...</p>
    </main>
  )

  return (
    <main className="min-h-screen bg-amber-50 text-stone-900">
      <nav className="bg-stone-700 border-b border-stone-600 px-6 py-4 flex justify-between items-center">
        <div>
          <a href="/" className="text-2xl font-bold">Property<span className="text-orange-500">AI</span>gency</a>
          <span className="ml-3 bg-orange-500 text-black text-xs font-bold px-2 py-0.5 rounded">ADMIN</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="text-stone-300 hover:text-white text-sm">Agent Dashboard</Link>
          <button onClick={() => supabase.auth.signOut().then(() => window.location.href = '/')}
            className="text-stone-300 hover:text-white text-sm">Sign Out</button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">🎛️ Control Centre</h1>
          <p className="text-stone-500 mt-1">Platform overview — {new Date().toLocaleDateString('en-ZA', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</p>
        </div>

        {/* Traffic */}
        <h2 className="text-lg font-bold text-orange-500 mb-3">📊 Traffic</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Logins Today', value: stats.loginsToday, color: 'text-orange-400' },
            { label: 'Logins This Week', value: stats.loginsWeek, color: 'text-orange-400' },
            { label: 'Logins This Month', value: stats.loginsMonth, color: 'text-orange-400' },
            { label: 'Total Users', value: stats.totalUsers, color: 'text-orange-400' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-xl p-4 border border-stone-300">
              <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-stone-500 text-sm mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Listings */}
        <h2 className="text-lg font-bold text-orange-500 mb-3">🏠 Listings</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          {[
            { label: 'New Today', value: stats.todayProps, color: 'text-blue-400' },
            { label: 'New This Week', value: stats.weekProps, color: 'text-blue-400' },
            { label: 'Active', value: stats.activeProps, color: 'text-green-400' },
            { label: 'Under Offer', value: stats.underOffer, color: 'text-yellow-400' },
            { label: 'Sold/Rented', value: stats.sold, color: 'text-red-400' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-xl p-4 border border-stone-300">
              <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-stone-500 text-sm mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Users */}
        <h2 className="text-lg font-bold text-orange-500 mb-3">👤 Users</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Users', value: stats.totalUsers, color: 'text-purple-400' },
            { label: 'Agents', value: stats.agents, color: 'text-purple-400' },
            { label: 'Buyers/Renters', value: stats.buyers, color: 'text-purple-400' },
            { label: 'New Today', value: stats.todaySignups, color: 'text-purple-400' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-xl p-4 border border-stone-300">
              <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-stone-500 text-sm mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Viewings */}
        <h2 className="text-lg font-bold text-orange-500 mb-3">📅 Viewings</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Today', value: stats.bookingsToday, color: 'text-green-400' },
            { label: 'This Week', value: stats.weekBookings, color: 'text-green-400' },
            { label: 'This Month', value: stats.bookingsMonth, color: 'text-green-400' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-xl p-4 border border-stone-300">
              <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-stone-500 text-sm mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* User Management */}
        <h2 className="text-lg font-bold text-orange-500 mb-3">🔍 User Management</h2>
        <div className="bg-white rounded-2xl border border-stone-300 p-6 mb-8">
          <div className="flex gap-3 mb-6">
            <input value={searchEmail} onChange={e => setSearchEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && searchUser()}
              placeholder="Search by email address..."
              className="flex-1 bg-stone-100 text-stone-900 rounded-xl px-4 py-3 outline-none border border-stone-300 focus:border-orange-500 text-sm"/>
            <button onClick={searchUser} disabled={searchingUser}
              className="bg-orange-500 hover:bg-orange-400 text-black font-bold px-6 py-3 rounded-xl disabled:opacity-50 transition text-sm">
              {searchingUser ? 'Searching...' : 'Search'}
            </button>
          </div>

          {actionMessage && (
            <div className="bg-amber-50 rounded-xl p-3 mb-4 text-sm text-center">{actionMessage}</div>
          )}

          {foundUser && (
            <div className="space-y-4">
              <div className="bg-amber-50 rounded-xl p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-bold text-lg">{foundUser.full_name || 'Unknown'}</p>
                    <p className="text-stone-500 text-sm">{foundUser.email}</p>
                    <p className="text-stone-500 text-sm capitalize">Account type: {foundUser.account_type || 'buyer'}</p>
                    <p className="text-stone-500 text-sm">Listing credits: {foundUser.listing_credits || 0}</p>
                  </div>
                  <span className={`text-xs px-3 py-1 rounded-full font-bold ${foundUser.is_suspended ? 'bg-red-900 text-red-300' : 'bg-green-900 text-green-300'}`}>
                    {foundUser.is_suspended ? 'Suspended' : 'Active'}
                  </span>
                </div>

                {userListings.length > 0 && (
                  <div className="mt-4">
                    <p className="text-xs text-stone-500 mb-2 font-semibold uppercase tracking-wide">Their Listings ({userListings.length})</p>
                    <div className="space-y-1">
                      {userListings.slice(0, 5).map((l: any) => (
                        <div key={l.id} className="flex justify-between items-center text-sm">
                          <span className="text-stone-700">{l.title}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${l.status === 'active' ? 'bg-green-900 text-green-300' : l.status === 'draft' ? 'bg-stone-200 text-stone-700' : 'bg-red-900 text-red-300'}`}>{l.status}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-amber-50 rounded-xl p-4">
                  <p className="font-semibold text-sm mb-2">🎁 Add Free Listing Credits</p>
                  <div className="flex gap-2">
                    <input type="number" value={creditAmount} onChange={e => setCreditAmount(e.target.value)}
                      placeholder="No. of listings"
                      className="flex-1 bg-stone-200 text-stone-900 rounded-lg px-3 py-2 text-sm outline-none border border-gray-500"/>
                    <button onClick={applyCredit} disabled={!creditAmount}
                      className="bg-green-600 hover:bg-green-500 text-white font-bold px-4 py-2 rounded-lg text-sm disabled:opacity-50">Apply</button>
                  </div>
                </div>

                <div className="bg-amber-50 rounded-xl p-4">
                  <p className="font-semibold text-sm mb-2">💰 Apply Discount (%)</p>
                  <div className="flex gap-2">
                    <input type="number" value={discountAmount} onChange={e => setDiscountAmount(e.target.value)}
                      placeholder="% discount (e.g. 50)" min="1" max="100"
                      className="flex-1 bg-stone-200 text-stone-900 rounded-lg px-3 py-2 text-sm outline-none border border-gray-500"/>
                    <button onClick={applyDiscount} disabled={!discountAmount}
                      className="bg-yellow-600 hover:bg-yellow-500 text-stone-900 font-bold px-4 py-2 rounded-lg text-sm disabled:opacity-50">Apply</button>
                  </div>
                </div>
              </div>

              <div className="bg-amber-50 rounded-xl p-4">
                <p className="font-semibold text-sm mb-2">{foundUser.is_suspended ? '✅ Reinstate Account' : '🔴 Suspend Account'}</p>
                <button onClick={() => suspendUser(!foundUser.is_suspended)}
                  className={`w-full font-bold py-2 rounded-lg text-sm transition ${foundUser.is_suspended ? 'bg-green-600 hover:bg-green-500 text-white' : 'bg-red-600 hover:bg-red-500 text-white'}`}>
                  {foundUser.is_suspended ? '✅ Reinstate Account' : '🔴 Suspend Account'}
                </button>
              </div>

              <div>
                <label className="text-stone-500 text-xs mb-1 block">Internal note (optional)</label>
                <input value={adminNote} onChange={e => setAdminNote(e.target.value)}
                  placeholder="e.g. Compensated for 3 days downtime..."
                  className="w-full bg-amber-50 text-stone-800 rounded-lg px-3 py-2 text-sm outline-none border border-stone-300 focus:border-orange-500"/>
              </div>
            </div>
          )}
        </div>

        {/* User Feedback Summary */}
        <h2 className="text-lg font-bold text-orange-500 mb-3">💬 User Feedback</h2>
        <div className="bg-white rounded-2xl border border-stone-300 p-6 mb-8">
          {feedback.length === 0 ? (
            <p className="text-stone-500 text-center py-4">No feedback yet — it will appear once users have been on the platform for a while</p>
          ) : (
            <div>
              {/* Summary stats */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                {[
                  { label: 'Positive', count: feedback.filter((f:any) => f.sentiment === 'positive').length, color: 'text-green-400', bg: 'bg-green-900' },
                  { label: 'Neutral', count: feedback.filter((f:any) => f.sentiment === 'neutral' || !f.sentiment).length, color: 'text-yellow-400', bg: 'bg-yellow-900' },
                  { label: 'Negative', count: feedback.filter((f:any) => f.sentiment === 'negative').length, color: 'text-red-400', bg: 'bg-red-900' },
                ].map(s => (
                  <div key={s.label} className={`${s.bg} rounded-xl p-4 text-center`}>
                    <p className={`text-3xl font-bold ${s.color}`}>{s.count}</p>
                    <p className="text-stone-700 text-sm mt-1">{s.label}</p>
                    <p className={`text-xs ${s.color} font-bold mt-1`}>
                      {feedback.length > 0 ? Math.round((s.count / feedback.length) * 100) : 0}%
                    </p>
                  </div>
                ))}
              </div>
              {/* Positive % headline */}
              <div className="bg-amber-50 rounded-xl p-4 mb-4 text-center">
                <p className="text-2xl font-bold text-green-400">
                  ⭐ {feedback.length > 0 ? Math.round((feedback.filter((f:any) => f.sentiment === 'positive').length / feedback.length) * 100) : 0}% Positive Rating
                </p>
                <p className="text-stone-500 text-sm mt-1">from {feedback.length} user responses</p>
              </div>
              {/* Latest 3 feedback items */}
              <div className="space-y-3 mb-4">
                {feedback.slice(0, 3).map((f: any) => (
                  <div key={f.id} className="bg-amber-50 rounded-xl p-3 flex gap-3 items-start">
                    <span className={`text-xs font-bold px-2 py-1 rounded-full flex-shrink-0 ${
                      f.sentiment === 'positive' ? 'bg-green-900 text-green-300' :
                      f.sentiment === 'negative' ? 'bg-red-900 text-red-300' :
                      'bg-stone-200 text-stone-700'
                    }`}>{f.sentiment || 'neutral'}</span>
                    <p className="text-stone-800 text-sm flex-1" style={{display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden'}}>{f.feedback}</p>
                    <span className="text-stone-400 text-xs flex-shrink-0">{f.user_type}</span>
                  </div>
                ))}
              </div>
              <a href="/admin/suppliers" className="block w-full bg-orange-600 hover:bg-orange-500 text-white font-bold py-2.5 rounded-xl text-center text-sm transition mb-2">Supplier Management</a>
              <a href="/admin/feedback" className="block w-full bg-stone-100 hover:bg-stone-200 text-stone-900 font-bold py-2.5 rounded-xl text-center text-sm transition">
                View All Feedback →
              </a>
            </div>
          )}
        </div>

        {/* AI Team */}
        <h2 className="text-lg font-bold text-orange-500 mb-3 mt-8">🤖 Your AI Team</h2>
        <div className="bg-white rounded-2xl border border-stone-300 overflow-hidden mb-8">
          <div className="grid grid-cols-3 md:grid-cols-6 border-b border-stone-300">
            {[
              { id: 'marketing', label: '🎯 Marketing AI', desc: 'Social media, campaigns, growth' },
              { id: 'sales', label: '📞 Sales AI', desc: 'Agent acquisition, outreach' },
              { id: 'support', label: '💬 Support AI', desc: 'Handle queries, troubleshoot' },
              { id: 'finance', label: '💰 Finance AI', desc: 'Costs, revenue, CFO insights' },
              { id: 'developer', label: '💻 Developer AI', desc: 'Tech issues, plain English' },
              { id: 'security', label: '🔐 Security AI', desc: 'Threats, hacking, protection' },
            ].map(ai => (
              <button key={ai.id} onClick={() => { setActiveAI(ai.id as any); setAiHistory([]) }}
                className={`p-4 text-left transition ${activeAI === ai.id ? 'bg-stone-100 border-b-2 border-orange-500' : 'hover:bg-stone-50'}`}>
                <p className="font-semibold text-sm">{ai.label}</p>
                <p className="text-stone-500 text-xs mt-0.5">{ai.desc}</p>
              </button>
            ))}
          </div>

          <div className="h-96 overflow-y-auto p-4 space-y-3 flex flex-col-reverse">
            {aiLoading && (
              <div className="flex gap-3">
                <div className="w-7 h-7 bg-orange-500 rounded-full flex items-center justify-center text-black font-bold text-xs">AI</div>
                <div className="bg-amber-50 rounded-xl px-4 py-2.5 text-sm text-stone-500 animate-pulse">Thinking...</div>
              </div>
            )}
            {[...aiHistory].reverse().map((msg, i) => (
              <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'assistant' && (
                  <div className="w-7 h-7 bg-orange-500 rounded-full flex items-center justify-center text-black font-bold text-xs flex-shrink-0">AI</div>
                )}
                <div className={`max-w-2xl rounded-xl px-4 py-2.5 text-sm whitespace-pre-wrap ${msg.role === 'user' ? 'bg-orange-500 text-black' : 'bg-amber-50 text-stone-800'}`}>
                  {msg.content}
                </div>
              </div>
            ))}
            {aiHistory.length === 0 && (
              <div className="text-center py-8">
                <p className="text-3xl mb-2">{activeAI === 'marketing' ? '🎯' : activeAI === 'sales' ? '📞' : activeAI === 'finance' ? '💰' : activeAI === 'developer' ? '💻' : activeAI === 'security' ? '🔐' : '💬'}</p>
                <p className="text-stone-500 text-sm font-semibold">{activeAI.charAt(0).toUpperCase() + activeAI.slice(1)} AI ready</p>
                <p className="text-stone-400 text-xs mt-1">Ask me anything about {activeAI}</p>
              </div>
            )}
          </div>

          <div className="px-4 py-2 border-t border-stone-300 flex gap-2 overflow-x-auto">
            {activeAI === 'marketing' && ['Write a LinkedIn post about our AI Concierge', 'Draft an email to estate agents in Johannesburg', 'Suggest 3 growth strategies for this month'].map(p => (
              <button key={p} onClick={() => setAiInput(p)} className="text-xs bg-stone-100 hover:bg-stone-200 text-stone-700 px-3 py-1.5 rounded-full whitespace-nowrap transition">{p}</button>
            ))}
            {activeAI === 'sales' && ['Draft outreach email to Pam Golding', 'Handle objection: We already use Property24', 'Create a pitch for a small agency'].map(p => (
              <button key={p} onClick={() => setAiInput(p)} className="text-xs bg-stone-100 hover:bg-stone-200 text-stone-700 px-3 py-1.5 rounded-full whitespace-nowrap transition">{p}</button>
            ))}
            {activeAI === 'finance' && ['What are my current monthly costs?', 'When will I break even with 50 agents?', 'How can I reduce my Anthropic costs?'].map(p => (
              <button key={p} onClick={() => setAiInput(p)} className="text-xs bg-stone-100 hover:bg-stone-200 text-stone-700 px-3 py-1.5 rounded-full whitespace-nowrap transition">{p}</button>
            ))}
            {activeAI === 'developer' && ['Explain how the AI search works', 'What would it take to add a new feature?', 'How do I read my Vercel error logs?'].map(p => (
              <button key={p} onClick={() => setAiInput(p)} className="text-xs bg-stone-100 hover:bg-stone-200 text-stone-700 px-3 py-1.5 rounded-full whitespace-nowrap transition">{p}</button>
            ))}
            {activeAI === 'security' && ['How secure is the platform right now?', 'What should I do if we get hacked?', 'How do I report a data breach under POPIA?'].map(p => (
              <button key={p} onClick={() => setAiInput(p)} className="text-xs bg-stone-100 hover:bg-stone-200 text-stone-700 px-3 py-1.5 rounded-full whitespace-nowrap transition">{p}</button>
            ))}
            {activeAI === 'support' && ['Agent cannot edit their listing', 'Buyer not receiving notifications', 'How to handle a refund request'].map(p => (
              <button key={p} onClick={() => setAiInput(p)} className="text-xs bg-stone-100 hover:bg-stone-200 text-stone-700 px-3 py-1.5 rounded-full whitespace-nowrap transition">{p}</button>
            ))}
          </div>

          <div className="p-4 border-t border-stone-300 flex gap-3">
            <input value={aiInput} onChange={e => setAiInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && askAI()}
              placeholder={`Ask your ${activeAI.charAt(0).toUpperCase() + activeAI.slice(1)} AI...`}
              className="flex-1 bg-stone-100 text-stone-900 rounded-xl px-4 py-3 outline-none border border-stone-300 focus:border-orange-500 text-sm"/>
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
