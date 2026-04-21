'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function SupplierDashboard() {
  const [user, setUser]         = useState<any>(null)
  const [supplier, setSupplier] = useState<any>(null)
  const [requests, setRequests] = useState<any[]>([])
  const [quotes, setQuotes]     = useState<any[]>([])
  const [loading, setLoading]   = useState(true)
  const [pausing, setPausing]   = useState(false)
  const [monthLeads, setMonthLeads]     = useState(0)
  const [invoiceTotal, setInvoiceTotal] = useState(0)
  const [aiMessages, setAiMessages] = useState<{ role: string; content: string }[]>([])
  const [aiInput, setAiInput]       = useState('')
  const [aiLoading, setAiLoading]   = useState(false)
  const [quoteAmounts, setQuoteAmounts] = useState<{ [k: string]: string }>({})

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) { window.location.href = '/supplier/login'; return }
      setUser(data.user)

      const { data: sup } = await supabase
        .from('suppliers')
        .select('*')
        .eq('user_id', data.user.id)
        .single()

      if (!sup) { window.location.href = '/supplier/register'; return }
      setSupplier(sup)

      const { data: reqs } = await supabase
        .from('move_quote_requests')
        .select('*')
        .eq('service_type', sup.service_type)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
      setRequests(reqs || [])

      const { data: myQuotes } = await supabase
        .from('supplier_quotes')
        .select('*, move_quote_requests(*)')
        .eq('supplier_id', sup.id)
        .order('created_at', { ascending: false })
      setQuotes(myQuotes || [])

      const startOfMonth = new Date()
      startOfMonth.setDate(1)
      startOfMonth.setHours(0, 0, 0, 0)

      const { data: monthlyLeads } = await supabase
        .from('supplier_quotes')
        .select('id, created_at')
        .eq('supplier_id', sup.id)
        .gte('created_at', startOfMonth.toISOString())

      setMonthLeads(monthlyLeads?.length || 0)
      setInvoiceTotal((monthlyLeads?.length || 0) * (sup.lead_price || 0))
      setLoading(false)
    })
  }, [])

  const togglePause = async () => {
    if (!supplier) return
    setPausing(true)
    const newPaused = !supplier.is_paused
    await supabase.from('suppliers').update({
      is_paused: newPaused,
      paused_at: newPaused ? new Date().toISOString() : null,
    }).eq('id', supplier.id)
    setSupplier((prev: any) => ({ ...prev, is_paused: newPaused }))
    setPausing(false)
  }

  const submitQuote = async (requestId: string) => {
    if (!quoteAmounts[requestId]) return
    await supabase.from('supplier_quotes').insert({
      request_id:  requestId,
      supplier_id: supplier.id,
      amount:      parseFloat(quoteAmounts[requestId]),
      valid_until: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    })
    await supabase.from('move_quote_requests').update({ status: 'quoted' }).eq('id', requestId)

    const { data: req } = await supabase
      .from('move_quote_requests')
      .select('user_id, service_type')
      .eq('id', requestId)
      .single()

    if (req?.user_id) {
      await fetch('/api/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: req.user_id,
          title: 'New Quote Received!',
          body: `${supplier?.business_name} sent you a quote. View it now!`,
          url: '/my-properties',
        }),
      })
    }

    setRequests(prev => prev.filter(r => r.id !== requestId))
    setQuoteAmounts(prev => { const p = { ...prev }; delete p[requestId]; return p })
    setMonthLeads(prev => prev + 1)
    setInvoiceTotal(prev => prev + (supplier?.lead_price || 0))
  }

  const askAI = async () => {
    if (!aiInput.trim()) return
    setAiLoading(true)
    const newHistory = [...aiMessages, { role: 'user', content: aiInput }]
    setAiMessages(newHistory)
    setAiInput('')
    const res  = await fetch('/api/supplier-ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ supplier_id: supplier?.id, message: aiInput, history: aiMessages }),
    })
    const data = await res.json()
    setAiMessages([...newHistory, { role: 'assistant', content: data.message }])
    setAiLoading(false)
  }

  if (loading) return (
    <main className="min-h-screen bg-gray-900 flex items-center justify-center">
      <p className="text-orange-500 animate-pulse">Loading your dashboard...</p>
    </main>
  )

  const accepted = quotes.filter(q => q.status === 'accepted').length

  return (
    <main className="min-h-screen bg-gray-900 text-white">
      <nav className="bg-gray-800 border-b border-gray-700 px-6 py-4 flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold">Property<span className="text-orange-500">AI</span>gency</Link>
        <div className="flex items-center gap-4">
          {supplier?.logo_url && (
            <img src={supplier.logo_url} alt="logo" className="w-8 h-8 rounded-lg object-contain bg-gray-700"/>
          )}
          <span className="text-gray-400 text-sm">{supplier?.business_name}</span>
          <button onClick={() => supabase.auth.signOut().then(() => window.location.href = '/')}
            className="text-gray-400 hover:text-white text-sm">Sign Out</button>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-8">

        <div className="flex items-start justify-between mb-8">
          <div>
            <p className="text-gray-400 text-sm mb-1">Welcome back</p>
            <h1 className="text-3xl font-bold">{supplier?.business_name}</h1>
            <p className="text-gray-400 text-sm capitalize mt-1">
              {supplier?.service_type?.replace(/_/g, ' ')} · {supplier?.areas_served?.join(', ')}
            </p>
          </div>
          <button onClick={togglePause} disabled={pausing}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition ${
              supplier?.is_paused
                ? 'bg-green-600 hover:bg-green-500 text-white'
                : 'bg-gray-700 hover:bg-yellow-600 text-gray-200'
            }`}>
            {pausing ? '...' : supplier?.is_paused ? '▶ Resume Leads' : '⏸ Pause Leads'}
          </button>
        </div>

        {supplier?.is_paused && (
          <div className="bg-yellow-900 border border-yellow-700 rounded-xl px-5 py-3 mb-6 text-yellow-300 text-sm">
            Your listing is paused. You are not receiving new leads. Resume to start receiving leads again.
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-5">
            <p className="text-3xl font-bold text-orange-500">{monthLeads}</p>
            <p className="text-gray-400 text-sm mt-1">Leads this month</p>
          </div>
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-5">
            <p className="text-3xl font-bold text-green-400">R{invoiceTotal.toLocaleString()}</p>
            <p className="text-gray-400 text-sm mt-1">Invoice building this month</p>
            <p className="text-gray-500 text-xs mt-0.5">Due 1st of next month</p>
          </div>
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-5">
            <p className="text-3xl font-bold text-yellow-400">{supplier?.rating || '—'}{supplier?.rating ? '/5' : ''}</p>
            <p className="text-gray-400 text-sm mt-1">Rating ({supplier?.review_count || 0} reviews)</p>
          </div>
        </div>

        <div className="bg-gray-800 border border-gray-700 rounded-xl px-5 py-3 mb-8 flex items-center justify-between text-sm">
          <span className="text-gray-400">Lead price: <span className="text-white font-bold">R{supplier?.lead_price || 0} per lead</span></span>
          <span className="text-gray-400">Weekly limit: <span className="text-white font-bold">{supplier?.weekly_lead_limit || 5} leads/week</span></span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          <div className="bg-gray-800 border border-gray-700 rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-700 flex items-center gap-3">
              <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-black font-bold text-xs">AI</div>
              <div>
                <p className="font-bold text-sm">Lead <span className="text-orange-500">AI</span>sistant</p>
                <p className="text-xs text-green-400">Your business assistant</p>
              </div>
            </div>
            <div className="h-64 overflow-y-auto p-4 space-y-3">
              {aiMessages.length === 0 && (
                <div className="flex gap-3">
                  <div className="w-7 h-7 bg-orange-500 rounded-full flex items-center justify-center text-black font-bold text-xs flex-shrink-0">AI</div>
                  <div className="bg-gray-700 rounded-xl px-3 py-2 text-sm text-gray-200">
                    Hi! I am your Lead AIsistant. You have {requests.length} new leads waiting and R{invoiceTotal.toLocaleString()} building on your invoice this month. How can I help?
                  </div>
                </div>
              )}
              {aiMessages.map((msg, i) => (
                <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role === 'assistant' && (
                    <div className="w-7 h-7 bg-orange-500 rounded-full flex items-center justify-center text-black font-bold text-xs flex-shrink-0">AI</div>
                  )}
                  <div className={`rounded-xl px-3 py-2 text-sm max-w-xs ${msg.role === 'user' ? 'bg-orange-500 text-black' : 'bg-gray-700 text-gray-200'}`}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {aiLoading && (
                <div className="flex gap-2">
                  <div className="w-7 h-7 bg-orange-500 rounded-full flex items-center justify-center text-black font-bold text-xs flex-shrink-0">AI</div>
                  <div className="bg-gray-700 rounded-xl px-3 py-2 text-sm text-gray-400 animate-pulse">Thinking...</div>
                </div>
              )}
            </div>
            <div className="p-3 border-t border-gray-700 flex gap-2">
              <input value={aiInput} onChange={e => setAiInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && askAI()}
                placeholder="Ask your Lead AIsistant..."
                className="flex-1 bg-gray-700 text-white rounded-lg px-3 py-2 text-sm outline-none border border-gray-600 focus:border-orange-500"/>
              <button onClick={askAI} disabled={aiLoading || !aiInput.trim()}
                className="bg-orange-500 hover:bg-orange-400 text-black font-bold px-4 py-2 rounded-lg text-sm disabled:opacity-50">
                Send
              </button>
            </div>
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-700 flex justify-between items-center">
              <p className="font-bold">New Lead Requests</p>
              {requests.length > 0 && (
                <span className="bg-orange-500 text-black text-xs font-bold px-2 py-0.5 rounded-full">{requests.length}</span>
              )}
            </div>
            <div className="divide-y divide-gray-700 max-h-96 overflow-y-auto">
              {requests.length === 0 ? (
                <div className="p-6 text-center text-gray-500 text-sm">
                  <p className="text-2xl mb-2">📭</p>
                  <p>No new leads yet</p>
                  <p className="text-xs mt-1">Leads appear here when buyers in your area request your service</p>
                </div>
              ) : requests.map(req => (
                <div key={req.id} className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-semibold text-sm capitalize">{req.service_type?.replace(/_/g, ' ')} Request</p>
                      {req.from_address && <p className="text-gray-400 text-xs">From: {req.from_address}</p>}
                      {req.to_address   && <p className="text-gray-400 text-xs">To: {req.to_address}</p>}
                      {req.move_date    && (
                        <p className="text-orange-400 text-xs font-semibold">
                          {new Date(req.move_date).toLocaleDateString('en-ZA', { month: 'long', day: 'numeric' })}
                        </p>
                      )}
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(req.created_at).toLocaleDateString('en-ZA', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  <div className="flex gap-2 mt-2">
                    <input type="number" placeholder="Quote amount (R)"
                      value={quoteAmounts[req.id] || ''}
                      onChange={e => setQuoteAmounts(prev => ({ ...prev, [req.id]: e.target.value }))}
                      className="flex-1 bg-gray-700 text-white rounded-lg px-3 py-1.5 text-sm outline-none border border-gray-600 focus:border-orange-500"/>
                    <button onClick={() => submitQuote(req.id)} disabled={!quoteAmounts[req.id]}
                      className="bg-green-600 hover:bg-green-500 text-white font-bold px-3 py-1.5 rounded-lg text-sm disabled:opacity-50">
                      Quote
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {quotes.length > 0 && (
          <div className="mt-6 bg-gray-800 border border-gray-700 rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-700">
              <p className="font-bold">My Quotes</p>
            </div>
            <div className="divide-y divide-gray-700">
              {quotes.slice(0, 10).map(q => (
                <div key={q.id} className="px-5 py-3 flex justify-between items-center">
                  <div>
                    <p className="text-sm font-semibold capitalize">{q.move_quote_requests?.service_type?.replace(/_/g, ' ')}</p>
                    <p className="text-xs text-gray-400">{new Date(q.created_at).toLocaleDateString('en-ZA')}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-orange-400">R{q.amount?.toLocaleString()}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                      q.status === 'accepted' ? 'bg-green-800 text-green-300' :
                      q.status === 'rejected' ? 'bg-red-900 text-red-400' :
                      'bg-gray-700 text-gray-400'
                    }`}>{q.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
