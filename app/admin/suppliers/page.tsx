'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

const ADMIN_ID = 'a947747b-d98c-4d77-8647-c4dd930d3fe7'

export default function AdminSuppliers() {
  const [suppliers, setSuppliers] = useState<any[]>([])
  const [loading, setLoading]     = useState(true)
  const [filter, setFilter]       = useState<'pending_review'|'active'|'rejected'>('pending_review')
  const [acting, setActing]       = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState<{ [id: string]: string }>({})

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user?.id !== ADMIN_ID) window.location.href = '/'
    })
  }, [])

  useEffect(() => { fetchSuppliers() }, [filter])

  const fetchSuppliers = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('suppliers')
      .select('*')
      .eq('status', filter)
      .order('created_at', { ascending: false })
    setSuppliers(data || [])
    setLoading(false)
  }

  const approve = async (supplier: any) => {
    setActing(supplier.id)
    await supabase.from('suppliers').update({
      status:    'active',
      is_active: true,
    }).eq('id', supplier.id)
    await fetch('/api/notify-supplier-approved', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email:         supplier.email,
        business_name: supplier.business_name,
        trial_expires: supplier.trial_expires_at,
      }),
    }).catch(() => {})
    setSuppliers(prev => prev.filter(s => s.id !== supplier.id))
    setActing(null)
  }

  const reject = async (supplier: any) => {
    setActing(supplier.id)
    await supabase.from('suppliers').update({
      status:           'rejected',
      is_active:        false,
      rejection_reason: rejectReason[supplier.id] || 'Does not meet our listing requirements.',
    }).eq('id', supplier.id)
    await fetch('/api/notify-supplier-rejected', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email:         supplier.email,
        business_name: supplier.business_name,
        reason:        rejectReason[supplier.id] || 'Does not meet our listing requirements.',
      }),
    }).catch(() => {})
    setSuppliers(prev => prev.filter(s => s.id !== supplier.id))
    setActing(null)
  }

  const tierColour: Record<string, string> = {
    high: 'text-yellow-400', mid: 'text-blue-400',
    standard: 'text-green-400', trade: 'text-gray-300',
  }

  return (
    <main className="min-h-screen bg-gray-900 text-white">
      <nav className="bg-gray-800 border-b border-gray-700 px-6 py-4 flex justify-between items-center">
        <Link href="/admin" className="text-2xl font-bold">
          Property<span className="text-orange-500">AI</span>gency <span className="text-gray-500 text-sm font-normal ml-2">Admin</span>
        </Link>
        <Link href="/admin" className="text-gray-400 hover:text-white text-sm">← Admin Home</Link>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold">Supplier Management</h1>
          <p className="text-gray-400 text-sm mt-1">Review, approve and manage service providers</p>
        </div>

        <div className="flex gap-2 mb-6">
          {(['pending_review','active','rejected'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${
                filter === f ? 'bg-orange-500 text-black' : 'bg-gray-800 text-gray-400 hover:text-white border border-gray-700'
              }`}>
              {f === 'pending_review' ? 'Pending Review' : f === 'active' ? 'Active' : 'Rejected'}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="text-orange-500 animate-pulse">Loading...</p>
        ) : suppliers.length === 0 ? (
          <div className="bg-gray-800 border border-gray-700 rounded-2xl p-12 text-center">
            <p className="text-3xl mb-3">{filter === 'pending_review' ? '✅' : filter === 'active' ? '🏢' : '❌'}</p>
            <p className="text-gray-400">
              {filter === 'pending_review' ? 'No suppliers pending review' :
               filter === 'active' ? 'No active suppliers yet' : 'No rejected suppliers'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {suppliers.map(sup => (
              <div key={sup.id} className="bg-gray-800 border border-gray-700 rounded-2xl overflow-hidden">

                <div className="px-6 py-4 border-b border-gray-700 flex items-start justify-between gap-4">
                  <div className="flex items-center gap-4">
                    {sup.logo_url
                      ? <img src={sup.logo_url} alt="" className="w-14 h-14 rounded-xl object-contain bg-gray-700 flex-shrink-0"/>
                      : <div className="w-14 h-14 rounded-xl bg-gray-700 flex items-center justify-center text-2xl flex-shrink-0">🏢</div>
                    }
                    <div>
                      <p className="text-lg font-bold">{sup.business_name}</p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className={`text-xs font-semibold uppercase ${tierColour[sup.lead_tier] || 'text-gray-400'}`}>
                          {sup.lead_tier} · R{sup.lead_price}/lead
                        </span>
                        <span className="text-gray-600">·</span>
                        <span className="text-gray-400 text-xs capitalize">{sup.service_type?.replace(/_/g, ' ')}</span>
                      </div>
                      <p className="text-gray-500 text-xs mt-1">{sup.areas_served?.join(', ')}</p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-gray-500 text-xs">
                      Applied {new Date(sup.created_at).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                    {sup.trial_expires_at && (
                      <p className="text-orange-400 text-xs mt-1">
                        Trial until {new Date(sup.trial_expires_at).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' })}
                      </p>
                    )}
                  </div>
                </div>

                <div className="px-6 py-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div>
                      <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">Contact</p>
                      <p className="text-sm">{sup.email}</p>
                      {sup.phone && <p className="text-sm text-gray-400">{sup.phone}</p>}
                    </div>
                    {sup.website && (
                      <div>
                        <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">Website</p>
                        <a href={sup.website.startsWith('http') ? sup.website : `https://${sup.website}`}
                          target="_blank" rel="noopener noreferrer"
                          className="text-orange-400 hover:text-orange-300 text-sm underline">
                          {sup.website}
                        </a>
                      </div>
                    )}
                    <div>
                      <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">Weekly Lead Limit</p>
                      <p className="text-sm">{sup.weekly_lead_limit} leads/week</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">AI Profile</p>
                    <p className="text-sm text-gray-300 leading-relaxed line-clamp-4">{sup.ai_profile || sup.description || 'No profile written'}</p>
                  </div>
                </div>

                {filter === 'pending_review' && (
                  <div className="px-6 py-4 border-t border-gray-700 space-y-3">
                    <div className="flex gap-3">
                      <button onClick={() => approve(sup)} disabled={acting === sup.id}
                        className="flex-1 bg-green-600 hover:bg-green-500 text-white font-bold py-2.5 rounded-xl text-sm disabled:opacity-50 transition">
                        {acting === sup.id ? 'Processing...' : '✅ Approve & Go Live'}
                      </button>
                      <button onClick={() => reject(sup)} disabled={acting === sup.id}
                        className="flex-1 bg-red-900 hover:bg-red-800 text-red-300 font-bold py-2.5 rounded-xl text-sm disabled:opacity-50 transition">
                        ❌ Reject
                      </button>
                    </div>
                    <input
                      value={rejectReason[sup.id] || ''}
                      onChange={e => setRejectReason(prev => ({ ...prev, [sup.id]: e.target.value }))}
                      placeholder="Rejection reason (optional — sent to supplier)"
                      className="w-full bg-gray-700 text-white rounded-lg px-4 py-2.5 text-sm outline-none border border-gray-600 focus:border-red-500"/>
                  </div>
                )}

                {filter === 'rejected' && sup.rejection_reason && (
                  <div className="px-6 py-3 border-t border-gray-700 bg-red-950">
                    <p className="text-red-400 text-xs">Reason: {sup.rejection_reason}</p>
                  </div>
                )}

                {filter === 'active' && (
                  <div className="px-6 py-3 border-t border-gray-700 flex items-center justify-between text-sm">
                    <div className="flex items-center gap-4 text-gray-400">
                      <span>Leads: <span className="text-white font-bold">{sup.total_leads_received || 0}</span></span>
                      <span>Rating: <span className="text-white font-bold">{sup.rating || '—'}</span></span>
                      {sup.is_paused && <span className="text-yellow-400">⏸ Paused</span>}
                    </div>
                    <button onClick={() => reject(sup)} disabled={acting === sup.id}
                      className="text-red-400 hover:text-red-300 text-xs disabled:opacity-50">
                      Deactivate
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
