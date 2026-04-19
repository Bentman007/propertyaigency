'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

const SERVICES = [
  { value: 'removal', label: '🚛 Removal Company', desc: 'Get quotes from trusted movers' },
  { value: 'cleaning', label: '🧹 Cleaning Service', desc: 'Exit clean or new home clean' },
  { value: 'garden', label: '🌿 Garden Service', desc: 'Get your new garden sorted' },
  { value: 'pool', label: '🏊 Pool Service', desc: 'Pool cleaning and maintenance' },
  { value: 'legal', label: '⚖️ Conveyancing Attorney', desc: 'Property transfer and bond registration' },
  { value: 'mortgage', label: '🏦 Bond Originator', desc: 'Find the best home loan rate' },
  { value: 'surveyor', label: '📋 Property Surveyor', desc: 'Building and compliance inspection' },
  { value: 'handyman', label: '🔧 Handyman / Contractor', desc: 'Repairs and small renovations' },
]

export default function MovingServicesPage() {
  const [user, setUser] = useState<any>(null)
  const [selectedServices, setSelectedServices] = useState<string[]>([])
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [form, setForm] = useState({
    from_address: '', to_address: '', move_date: ''
  })

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
  }, [])

  const toggleService = (value: string) => {
    setSelectedServices(prev =>
      prev.includes(value) ? prev.filter(s => s !== value) : [...prev, value]
    )
  }

  const handleSubmit = async () => {
    if (!user) { window.location.href = '/auth/login?next=/moving'; return }
    setLoading(true)

    for (const service of selectedServices) {
      await supabase.from('move_quote_requests').insert({
        user_id: user.id,
        service_type: service,
        from_address: form.from_address,
        to_address: form.to_address,
        move_date: form.move_date || null,
        status: 'pending'
      })
    }

    setSubmitted(true)
    setLoading(false)
  }

  if (submitted) return (
    <main className="min-h-screen bg-gray-900 text-white flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <p className="text-6xl mb-6">🎉</p>
        <h1 className="text-3xl font-bold mb-3">Requests Sent!</h1>
        <p className="text-gray-400 mb-6">We've sent your quote requests to verified suppliers in your area. You'll receive quotes within 24 hours.</p>
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 mb-6 text-left">
          <p className="text-sm font-semibold mb-2">Services requested:</p>
          {selectedServices.map(s => (
            <p key={s} className="text-gray-400 text-sm">✓ {SERVICES.find(sv => sv.value === s)?.label}</p>
          ))}
        </div>
        <Link href="/my-properties" className="inline-block bg-orange-500 text-black font-bold px-8 py-3 rounded-xl hover:bg-orange-400">
          Back to My Dashboard
        </Link>
      </div>
    </main>
  )

  return (
    <main className="min-h-screen bg-gray-900 text-white">
      <nav className="bg-gray-950 border-b border-gray-800 px-6 py-4 flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold">Property<span className="text-orange-500">AI</span>gency</Link>
        <Link href="/my-properties" className="text-gray-400 hover:text-white text-sm">← My Dashboard</Link>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-12">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold mb-2">📦 Moving Services</h1>
          <p className="text-gray-400">Get quotes from verified suppliers — all in one place. We do the legwork, you choose the best offer.</p>
        </div>

        {step === 1 && (
          <div>
            <h2 className="text-xl font-bold mb-4">What do you need help with?</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
              {SERVICES.map(service => (
                <button key={service.value}
                  onClick={() => toggleService(service.value)}
                  className={`text-left p-4 rounded-xl border transition ${
                    selectedServices.includes(service.value)
                      ? 'border-orange-500 bg-orange-950'
                      : 'border-gray-700 hover:border-orange-500 bg-gray-800'
                  }`}>
                  <p className="font-semibold">{service.label}</p>
                  <p className="text-gray-400 text-sm">{service.desc}</p>
                  {selectedServices.includes(service.value) && (
                    <p className="text-orange-400 text-xs mt-1">✓ Selected</p>
                  )}
                </button>
              ))}
            </div>
            <button onClick={() => setStep(2)}
              disabled={selectedServices.length === 0}
              className="w-full bg-orange-500 hover:bg-orange-400 text-black font-bold py-4 rounded-xl disabled:opacity-50 transition">
              Continue with {selectedServices.length} service{selectedServices.length !== 1 ? 's' : ''} →
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="bg-gray-800 border border-gray-700 rounded-2xl p-8 space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <button onClick={() => setStep(1)} className="text-gray-400 hover:text-white">←</button>
              <h2 className="text-xl font-bold">Move Details</h2>
            </div>

            <div>
              <label className="text-gray-400 text-sm mb-1 block">Moving from</label>
              <input value={form.from_address} onChange={e => setForm(p => ({ ...p, from_address: e.target.value }))}
                className="w-full bg-gray-700 text-white rounded-lg px-4 py-3 outline-none border border-gray-600 focus:border-orange-500"
                placeholder="Current address or suburb"/>
            </div>

            <div>
              <label className="text-gray-400 text-sm mb-1 block">Moving to</label>
              <input value={form.to_address} onChange={e => setForm(p => ({ ...p, to_address: e.target.value }))}
                className="w-full bg-gray-700 text-white rounded-lg px-4 py-3 outline-none border border-gray-600 focus:border-orange-500"
                placeholder="New address or suburb"/>
            </div>

            <div>
              <label className="text-gray-400 text-sm mb-1 block">Move date (optional)</label>
              <input type="date" value={form.move_date} onChange={e => setForm(p => ({ ...p, move_date: e.target.value }))}
                min={new Date(Date.now() + 86400000).toISOString().split('T')[0]}
                className="w-full bg-gray-700 text-white rounded-lg px-4 py-3 outline-none border border-gray-600 focus:border-orange-500"/>
            </div>

            <div className="bg-gray-700 rounded-lg p-3">
              <p className="text-sm font-semibold mb-1">Requesting quotes for:</p>
              {selectedServices.map(s => (
                <p key={s} className="text-gray-300 text-sm">✓ {SERVICES.find(sv => sv.value === s)?.label}</p>
              ))}
            </div>

            <button onClick={handleSubmit} disabled={loading || !form.from_address}
              className="w-full bg-orange-500 hover:bg-orange-400 text-black font-bold py-4 rounded-xl disabled:opacity-50 transition">
              {loading ? 'Sending requests...' : '📤 Send Quote Requests'}
            </button>
            <p className="text-xs text-gray-500 text-center">Suppliers will respond within 24 hours. No obligation to accept any quote.</p>
          </div>
        )}
      </div>
    </main>
  )
}
