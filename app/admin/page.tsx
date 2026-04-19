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

  const suspendUser = async (suspend: boolean) => {
    if (!foundUser) return
    const response = await fetch('/api/admin-user-action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: foundUser.id,
        action: suspend ? 'suspend' : 'unsuspend',
        note: adminNote
      })
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

    const { data: profiles } = await supabase
      .from('profiles')
      .select('*')
      .ilike('id', '%')

    // Search by email in auth - we'll search profiles and cross reference
    const { data: allProfiles } = await supabase
      .from('profiles')
      .select('*')

    // Get properties for this search
    const { data: properties } = await supabase
      .from('properties')
      .select('id, title, status, created_at')
      .order('created_at', { ascending: false })

    // Find user by matching email pattern in metadata
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
      body: JSON.stringify({ 
        user_id: foundUser.id, 
        action: 'add_credit',
        amount: parseInt(creditAmount),
        note: adminNote
      })
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
      body: JSON.stringify({
        user_id: foundUser.id,
        action: 'add_discount',
        amount: parseInt(discountAmount),
        note: adminNote
      })
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
        {/* User Management */}
        <h2 className="text-lg font-bold text-orange-500 mb-3 mt-8">👤 User Management</h2>
        <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6 mb-8">
          <p className="text-gray-400 text-sm mb-4">Search for any user to view their account, apply credits or discounts</p>
          
          <div className="flex gap-3 mb-4">
            <input value={searchEmail} onChange={e => setSearchEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && searchUser()}
              placeholder="Search by email address..."
              className="flex-1 bg-gray-700 text-white rounded-xl px-4 py-3 outline-none border border-gray-600 focus:border-orange-500 text-sm"/>
            <button onClick={searchUser} disabled={searchingUser}
              className="bg-orange-500 hover:bg-orange-400 text-black font-bold px-6 py-3 rounded-xl disabled:opacity-50 transition text-sm">
              {searchingUser ? 'Searching...' : 'Search'}
            </button>
          </div>

          {actionMessage && (
            <div className={`p-3 rounded-lg text-sm mb-4 ${actionMessage.includes('✅') ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'}`}>
              {actionMessage}
            </div>
          )}

          {foundUser && (
            <div className="space-y-4">
              {/* User details */}
              <div className="bg-gray-700 rounded-xl p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="font-bold">{foundUser.full_name || 'No name'}</p>
                    <p className="text-gray-400 text-sm">{foundUser.email}</p>
                    <p className="text-gray-400 text-sm capitalize">Account type: {foundUser.account_type || 'buyer'}</p>
                    {foundUser.agency_name && <p className="text-orange-500 text-sm">{foundUser.agency_name}</p>}
                    {foundUser.eaab_number && (
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-gray-400 text-sm">EAAB: <span className="text-white font-mono">{foundUser.eaab_number}</span></p>
                        <a href="https://www.eaab.org.za/registers" target="_blank" rel="noopener noreferrer"
                          className="text-orange-500 text-xs hover:underline">Verify →</a>
                      </div>
                    )}
                    {foundUser.is_suspended && (
                      <p className="text-red-400 text-sm font-bold mt-1">🔴 Account Suspended</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Member since</p>
                    <p className="text-sm">{new Date(foundUser.created_at).toLocaleDateString('en-ZA', { month: 'long', year: 'numeric' })}</p>
                    {foundUser.listing_credits > 0 && (
                      <p className="text-green-400 text-sm mt-1">🎁 {foundUser.listing_credits} credits</p>
                    )}
                    {foundUser.discount_percent > 0 && (
                      <p className="text-yellow-400 text-sm">💰 {foundUser.discount_percent}% discount</p>
                    )}
                  </div>
                </div>

                {/* Listings */}
                {userListings.length > 0 && (
                  <div>
                    <p className="text-xs text-gray-400 mb-2 font-semibold uppercase tracking-wide">Their Listings ({userListings.length})</p>
                    <div className="space-y-1">
                      {userListings.slice(0, 5).map((l: any) => (
                        <div key={l.id} className="flex justify-between items-center text-sm">
                          <span className="text-gray-300">{l.title}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            l.status === 'active' ? 'bg-green-900 text-green-300' :
                            l.status === 'draft' ? 'bg-gray-600 text-gray-300' :
                            'bg-red-900 text-red-300'
                          }`}>{l.status}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Add credits */}
                <div className="bg-gray-700 rounded-xl p-4">
                  <p className="font-semibold text-sm mb-2">🎁 Add Free Listing Credits</p>
                  <p className="text-gray-400 text-xs mb-3">Give them extra listing slots as compensation</p>
                  <div className="flex gap-2">
                    <input type="number" value={creditAmount} onChange={e => setCreditAmount(e.target.value)}
                      placeholder="No. of listings"
                      className="flex-1 bg-gray-600 text-white rounded-lg px-3 py-2 text-sm outline-none border border-gray-500 focus:border-orange-500"/>
                    <button onClick={applyCredit} disabled={!creditAmount}
                      className="bg-green-600 hover:bg-green-500 text-white font-bold px-4 py-2 rounded-lg text-sm disabled:opacity-50">
                      Apply
                    </button>
                  </div>
                </div>

                {/* Apply discount */}
                <div className="bg-gray-700 rounded-xl p-4">
                  <p className="font-semibold text-sm mb-2">💰 Apply Discount</p>
                  <p className="text-gray-400 text-xs mb-3">Discount on their next invoice (%)</p>
                  <div className="flex gap-2">
                    <input type="number" value={discountAmount} onChange={e => setDiscountAmount(e.target.value)}
                      placeholder="% discount (e.g. 50)"
                      min="1" max="100"
                      className="flex-1 bg-gray-600 text-white rounded-lg px-3 py-2 text-sm outline-none border border-gray-500 focus:border-orange-500"/>
                    <button onClick={applyDiscount} disabled={!discountAmount}
                      className="bg-yellow-600 hover:bg-yellow-500 text-white font-bold px-4 py-2 rounded-lg text-sm disabled:opacity-50">
                      Apply
                    </button>
                  </div>
                </div>
              </div>

              {/* Suspend / Unsuspend */}
              <div className="bg-gray-700 rounded-xl p-4">
                <p className="font-semibold text-sm mb-2">{foundUser.is_suspended ? '✅ Reinstate Account' : '🔴 Suspend Account'}</p>
                <p className="text-gray-400 text-xs mb-3">
                  {foundUser.is_suspended 
                    ? 'Reinstating will allow them to list properties again' 
                    : 'Suspending will hide all their listings and block new ones'}
                </p>
                <button onClick={() => suspendUser(!foundUser.is_suspended)}
                  className={`w-full font-bold py-2 rounded-lg text-sm transition ${
                    foundUser.is_suspended 
                      ? 'bg-green-600 hover:bg-green-500 text-white' 
                      : 'bg-red-600 hover:bg-red-500 text-white'
                  }`}>
                  {foundUser.is_suspended ? '✅ Reinstate Account' : '🔴 Suspend Account'}
                </button>
              </div>

              {/* Note */}
              <div>
                <label className="text-gray-400 text-xs mb-1 block">Internal note (optional)</label>
                <input value={adminNote} onChange={e => setAdminNote(e.target.value)}
                  placeholder="e.g. Compensated for 3 days downtime..."
                  className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 text-sm outline-none border border-gray-600 focus:border-orange-500"/>
              </div>
            </div>
          )}
        </div>

        {/* AI Team */}
        <h2 className="text-lg font-bold text-orange-500 mb-3 mt-8">🤖 Your AI Team</h2>
        <div className="bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden mb-8">
          {/* AI selector */}
          <div className="grid grid-cols-3 md:grid-cols-6 border-b border-gray-700">
            {[
              { id: 'marketing', label: '🎯 Marketing AI', desc: 'Social media, campaigns, growth' },
              { id: 'sales', label: '📞 Sales AI', desc: 'Agent acquisition, outreach' },
              { id: 'support', label: '💬 Support AI', desc: 'Handle queries, troubleshoot' },
              { id: 'finance', label: '💰 Finance AI', desc: 'Costs, revenue, CFO insights' },
              { id: 'developer', label: '💻 Developer AI', desc: 'Tech issues, plain English' },
              { id: 'security', label: '🔐 Security AI', desc: 'Threats, hacking, protection' },
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
                  {activeAI === 'marketing' ? '🎯' : activeAI === 'sales' ? '📞' : activeAI === 'finance' ? '💰' : activeAI === 'developer' ? '💻' : activeAI === 'security' ? '🔐' : '💬'}
                </p>
                <p className="text-gray-400 text-sm font-semibold">
                  {activeAI === 'marketing' ? 'Marketing AI ready' : activeAI === 'sales' ? 'Sales AI ready' : activeAI === 'finance' ? 'Finance AI ready' : activeAI === 'developer' ? 'Developer AI ready' : activeAI === 'security' ? 'Security AI ready' : 'Support AI ready'}
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
            {activeAI === 'developer' && [
              'Explain how the AI search works',
              'What would it take to add a new feature?',
              'How do I read my Vercel error logs?',
            ].map(prompt => (
              <button key={prompt} onClick={() => setAiInput(prompt)}
                className="text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 px-3 py-1.5 rounded-full whitespace-nowrap transition">
                {prompt}
              </button>
            ))}
            {activeAI === 'security' && [
              'How secure is the platform right now?',
              'What should I do if we get hacked?',
              'How do I report a data breach under POPIA?',
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
