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
  { value: 'photography', label: '📸 Property Photographer', desc: 'Professional photos and video tours' },
  { value: 'virtual_tour', label: '🏠 3D Virtual Tour', desc: 'Matterport and 3D property walkthroughs' },
  { value: 'staging', label: '🛋 Home Staging', desc: 'Stage your home to sell faster' },
]

export default function MovingServicesPage() {
  const [user, setUser] = useState<any>(null)
  const [hasAccess, setHasAccess] = useState(false)
  const [checkingAccess, setCheckingAccess] = useState(true)
  const [selectedServices, setSelectedServices] = useState<string[]>([])
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [form, setForm] = useState({ from_address: '', to_address: '', move_date: '' })

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) { setCheckingAccess(false); return }
      setUser(data.user)

      const { data: profile } = await supabase
        .from('profiles')
        .select('has_moving_access')
        .eq('id', data.user.id)
        .single()

      setHasAccess(profile?.has_moving_access || false)

      // Pre-populate to_address from latest confirmed booking
      const { data: booking } = await supabase
        .from('viewing_bookings')
        .select('property_address')
        .eq('searcher_id', data.user.id)
        .eq('status', 'confirmed')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (booking?.property_address) {
        setForm(p => ({ ...p, to_address: booking.property_address }))
      }

      setCheckingAccess(false)
    })
  }, [])

  useEffect(() => {
    if (step === 2) {
      setTimeout(() => {
        const loadAutocomplete = () => {
          const fromInput = document.getElementById('from-address') as HTMLInputElement
          const toInput = document.getElementById('to-address') as HTMLInputElement
          if (!fromInput || !toInput || !(window as any).google) return

          const fromAC = new (window as any).google.maps.places.Autocomplete(fromInput, {
            componentRestrictions: { country: 'za' },
            fields: ['formatted_address']
          })
          fromAC.addListener('place_changed', () => {
            const place = fromAC.getPlace()
            setForm(p => ({ ...p, from_address: place.formatted_address || fromInput.value }))
          })

          const toAC = new (window as any).google.maps.places.Autocomplete(toInput, {
            componentRestrictions: { country: 'za' },
            fields: ['formatted_address']
          })
          toAC.addListener('place_changed', () => {
            const place = toAC.getPlace()
            setForm(p => ({ ...p, to_address: place.formatted_address || toInput.value }))
          })
        }

        if ((window as any).google) {
          loadAutocomplete()
        } else {
          const existing = document.querySelector('script[src*="maps.googleapis"]')
          if (!existing) {
            const script = document.createElement('script')
            script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_PLACES_KEY}&libraries=places`
            script.async = true
            script.onload = loadAutocomplete
            document.head.appendChild(script)
          } else {
            existing.addEventListener('load', loadAutocomplete)
          }
        }
      }, 300)
    }
  }, [step])

  const toggleService = (value: string) => {
    setSelectedServices(prev =>
      prev.includes(value) ? prev.filter(s => s !== value) : [...prev, value]
    )
  }

  const handleUpgrade = async () => {
    if (!user) return
    await supabase.from('profiles').update({ has_moving_access: true }).eq('id', user.id)
    setHasAccess(true)
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
    // Notify matching suppliers
    for (const service of selectedServices) {
      await fetch('/api/notify-suppliers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service_type: service,
          from_address: form.from_address,
          to_address: form.to_address
        })
      })
    }

    setSubmitted(true)
    setLoading(false)
  }

  if (checkingAccess) return (
    <main className="min-h-screen bg-gray-900 flex items-center justify-center">
      <p className="text-orange-500 animate-pulse">Loading...</p>
    </main>
  )

  if (!user) return (
    <main className="min-h-screen bg-gray-900 text-white flex items-center justify-center px-6">
      <div className="text-center">
        <p className="text-4xl mb-4">🔐</p>
        <h2 className="text-xl font-bold mb-2">Sign in to access Moving Services</h2>
        <Link href="/auth/login?next=/moving" className="inline-block bg-orange-500 text-black font-bold px-8 py-3 rounded-xl hover:bg-orange-400 mt-4">
          Sign In
        </Link>
      </div>
    </main>
  )

  if (!hasAccess) return (
    <main className="min-h-screen bg-gray-900 text-white">
      <nav className="bg-gray-950 border-b border-gray-800 px-6 py-4 flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold">Property<span className="text-orange-500">AI</span>gency</Link>
        <Link href="/my-properties" className="text-gray-400 hover:text-white text-sm">← My Dashboard</Link>
      </nav>
      <div className="max-w-xl mx-auto px-6 py-12">
        <div className="text-center mb-8">
          <p className="text-5xl mb-4">📦</p>
          <h1 className="text-2xl font-bold mb-2">Moving Services</h1>
          <p className="text-gray-400">Upgrade your account to get quotes from verified suppliers — all within 24 hours</p>
        </div>

        <div className="bg-gray-800 border border-orange-500 rounded-2xl p-8 mb-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <p className="text-xl font-bold">Moving Services Package</p>
              <p className="text-gray-400 text-sm">One-time upgrade</p>
            </div>
            <div className="text-right">
              <p className="text-4xl font-bold text-orange-500">R200</p>
              <p className="text-gray-400 text-xs">once-off</p>
            </div>
          </div>

          <ul className="space-y-3 mb-6">
            {[
              '🚛 Up to 3 removal company quotes',
              '🧹 Cleaning service quotes',
              '🌿 Garden & pool service in new area',
              '⚖️ Conveyancing attorney referral',
              '🏦 Bond originator introduction',
              '📋 Property surveyor referral',
              '⭐ All suppliers verified and reviewed',
              '✅ Quotes within 24 hours guaranteed',
            ].map(item => (
              <li key={item} className="flex items-center gap-3 text-sm">
                <span className="text-green-400">✓</span>
                <span className="text-gray-300">{item}</span>
              </li>
            ))}
          </ul>

          <button onClick={handleUpgrade}
            className="w-full bg-orange-500 hover:bg-orange-400 text-black font-bold py-4 rounded-xl text-lg transition">
            🚀 Upgrade Now — R200
          </button>
          <p className="text-xs text-gray-500 text-center mt-3">
            During beta — access granted instantly. Payment coming soon.
          </p>
        </div>
      </div>
    </main>
  )

  if (submitted) return (
    <main className="min-h-screen bg-gray-900 text-white flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <p className="text-6xl mb-6">🎉</p>
        <h1 className="text-3xl font-bold mb-3">Requests Sent!</h1>
        <p className="text-gray-400 mb-6">We have sent your quote requests to verified suppliers in your area. You will receive quotes within 24 hours.</p>
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
          <p className="text-gray-400">Get quotes from verified suppliers — all in one place.</p>
        </div>

        {step === 1 && (
          <div>
            <h2 className="text-xl font-bold mb-4">What do you need help with?</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
              {SERVICES.map(service => (
                <button key={service.value} onClick={() => toggleService(service.value)}
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
            <button onClick={() => setStep(2)} disabled={selectedServices.length === 0}
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
                id="from-address"
                placeholder="Start typing your current address..."/>
            </div>

            <div>
              <label className="text-gray-400 text-sm mb-1 block">Moving to</label>
              <input value={form.to_address} onChange={e => setForm(p => ({ ...p, to_address: e.target.value }))}
                className="w-full bg-gray-700 text-white rounded-lg px-4 py-3 outline-none border border-gray-600 focus:border-orange-500"
                id="to-address"
                placeholder="Start typing your new address..."/>
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
