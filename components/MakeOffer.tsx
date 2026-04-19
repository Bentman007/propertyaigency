'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function MakeOffer({ property }: { property: any }) {
  const [showForm, setShowForm] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    amount: '',
    finance_type: 'bond',
    move_date: '',
    lease_months: '12',
    occupants: '1',
    message: ''
  })

  const isRent = property.price_type === 'rent'

  const handleSubmit = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { window.location.href = `/auth/login?next=/property/${property.id}`; return }

    // Save offer to database
    await supabase.from('property_offers').insert({
      property_id: property.id,
      agent_id: property.user_id,
      searcher_id: user.id,
      offer_amount: parseFloat(form.amount) || null,
      finance_type: isRent ? null : form.finance_type,
      move_date: form.move_date,
      lease_months: isRent ? parseInt(form.lease_months) : null,
      occupants: isRent ? parseInt(form.occupants) : null,
      message: form.message,
      status: 'pending'
    })

    // Notify agent via AIsistant
    await fetch('/api/aisistant', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'lead_brief',
        agent_id: property.user_id,
        property_id: property.id,
        data: {
          date: new Date().toISOString().split('T')[0],
          start_time: '00:00',
          searcher_profile: {
            budget_max: parseFloat(form.amount),
            move_timeline: form.move_date
          },
          lead_temperature: 'hot'
        }
      })
    })

    setSubmitted(true)
    setLoading(false)
  }

  if (submitted) return (
    <div className="space-y-3 mb-3">
      <div className="bg-green-900 border border-green-700 rounded-xl p-4 text-center">
        <p className="text-green-300 font-bold">✅ {isRent ? 'Application' : 'Offer'} Submitted!</p>
        <p className="text-green-400 text-xs mt-1">The agent will be in touch shortly via your dashboard</p>
      </div>

      {/* Moving Services Upsell */}
      <div className="bg-gray-700 rounded-xl p-4 border border-orange-500">
        <div className="flex gap-3">
          <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-black font-bold text-xs flex-shrink-0">AI</div>
          <div>
            <p className="text-sm text-gray-200 leading-relaxed mb-3">
              🎉 <strong>Great move!</strong> While you wait to hear back, would you like help planning your move? 
              For just <strong className="text-orange-500">R200</strong>, our Moving Services team will get you quotes from removal companies, 
              attorneys, cleaners and more — all pre-filled with your details!
            </p>
            <a href="/moving"
              className="inline-block bg-orange-500 hover:bg-orange-400 text-black font-bold px-4 py-2 rounded-lg text-sm transition">
              📦 Get Moving Quotes — R200
            </a>
            <button className="ml-3 text-gray-500 hover:text-gray-300 text-xs">No thanks</button>
          </div>
        </div>
      </div>
    </div>
  )

  if (!showForm) return (
    <button onClick={() => setShowForm(true)}
      className="w-full bg-orange-500 hover:bg-orange-400 text-black font-bold py-3 rounded-xl transition mb-3 text-sm">
      {isRent ? '📋 Express Interest to Rent' : '💰 Make an Offer'}
    </button>
  )

  return (
    <div className="bg-gray-700 rounded-xl p-4 mb-3 space-y-3">
      <div className="flex justify-between items-center">
        <p className="font-bold text-sm">{isRent ? '📋 Rental Application' : '💰 Make an Offer'}</p>
        <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-white text-sm">✕</button>
      </div>

      {isRent ? (
        <>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Desired move-in date</label>
            <input type="date" value={form.move_date}
              onChange={e => setForm(p => ({ ...p, move_date: e.target.value }))}
              min={new Date(Date.now() + 86400000).toISOString().split('T')[0]}
              className="w-full bg-gray-600 text-white rounded-lg px-3 py-2 text-sm outline-none border border-gray-500 focus:border-orange-500"/>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Lease length</label>
              <select value={form.lease_months}
                onChange={e => setForm(p => ({ ...p, lease_months: e.target.value }))}
                className="w-full bg-gray-600 text-white rounded-lg px-3 py-2 text-sm outline-none border border-gray-500 focus:border-orange-500">
                <option value="6">6 months</option>
                <option value="12">12 months</option>
                <option value="24">24 months</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Occupants</label>
              <input type="number" value={form.occupants} min="1" max="10"
                onChange={e => setForm(p => ({ ...p, occupants: e.target.value }))}
                className="w-full bg-gray-600 text-white rounded-lg px-3 py-2 text-sm outline-none border border-gray-500 focus:border-orange-500"/>
            </div>
          </div>
        </>
      ) : (
        <>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Offer amount (R)</label>
            <input type="number" value={form.amount}
              onChange={e => setForm(p => ({ ...p, amount: e.target.value }))}
              placeholder={property.price?.toString()}
              className="w-full bg-gray-600 text-white rounded-lg px-3 py-2 text-sm outline-none border border-gray-500 focus:border-orange-500"/>
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Finance type</label>
            <select value={form.finance_type}
              onChange={e => setForm(p => ({ ...p, finance_type: e.target.value }))}
              className="w-full bg-gray-600 text-white rounded-lg px-3 py-2 text-sm outline-none border border-gray-500 focus:border-orange-500">
              <option value="bond">Bond / Mortgage</option>
              <option value="cash">Cash</option>
              <option value="pending">Finance pending approval</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Desired occupation date</label>
            <input type="date" value={form.move_date}
              onChange={e => setForm(p => ({ ...p, move_date: e.target.value }))}
              className="w-full bg-gray-600 text-white rounded-lg px-3 py-2 text-sm outline-none border border-gray-500 focus:border-orange-500"/>
          </div>
        </>
      )}

      <div>
        <label className="text-xs text-gray-400 mb-1 block">Message to agent (optional)</label>
        <textarea value={form.message}
          onChange={e => setForm(p => ({ ...p, message: e.target.value }))}
          rows={2} placeholder="Any conditions or questions..."
          className="w-full bg-gray-600 text-white rounded-lg px-3 py-2 text-sm outline-none border border-gray-500 focus:border-orange-500"/>
      </div>

      <button onClick={handleSubmit} disabled={loading}
        className="w-full bg-orange-500 hover:bg-orange-400 text-black font-bold py-2.5 rounded-lg text-sm disabled:opacity-50 transition">
        {loading ? 'Submitting...' : isRent ? '📤 Submit Application' : '📤 Submit Offer'}
      </button>
      <p className="text-xs text-gray-500 text-center">The agent will respond via your dashboard</p>
    </div>
  )
}
