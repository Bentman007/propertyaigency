'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

const SERVICES = [
  { value: 'bond_originator',       label: '🏦 Bond Originator',             desc: 'Find the best home loan rate'                },
  { value: 'conveyancing_attorney', label: '⚖️ Conveyancing Attorney',        desc: 'Property transfer and bond registration'     },
  { value: 'property_valuer',       label: '📊 Property Valuer',             desc: 'Formal valuation for sale or finance'         },
  { value: 'insurance_broker',      label: '🛡️ Insurance Broker',            desc: 'Home, contents and bond protection'           },
  { value: 'solar_installer',       label: '☀️ Solar Installer',             desc: 'Solar panels and battery backup'              },
  { value: 'architect',             label: '📐 Architect',                   desc: 'Plans, extensions and new builds'             },
  { value: 'str_manager',           label: '🏖️ Short-Term Rental Manager',   desc: 'Airbnb and holiday rental management'         },
  { value: 'property_management',   label: '🏢 Property Management',         desc: 'Full rental management services'              },
  { value: 'home_inspector',        label: '🔍 Home Inspector',              desc: 'Pre-purchase building inspection'             },
  { value: 'photographer',          label: '📸 Photographer',                desc: 'Professional listing photos'                  },
  { value: 'videographer',          label: '🎬 Videographer',                desc: 'Property walk-through videos'                 },
  { value: 'virtual_tour',          label: '🏠 3D Virtual Tour',             desc: 'Matterport and 3D walkthroughs'               },
  { value: 'home_stager',           label: '🛋️ Home Stager',                desc: 'Stage your home to sell faster'               },
  { value: 'interior_designer',     label: '🎨 Interior Designer',           desc: 'Interior design and decoration'               },
  { value: 'removal',               label: '🚛 Removal Company',             desc: 'Furniture and household moves'                },
  { value: 'storage',               label: '📦 Storage Facility',            desc: 'Short and long-term storage'                  },
  { value: 'painter',               label: '🖌️ Painter',                    desc: 'Interior and exterior painting'               },
  { value: 'builder',               label: '🏗️ Builder',                    desc: 'Renovations and construction'                 },
  { value: 'plumber',               label: '🔧 Plumber',                     desc: 'Plumbing repairs and installations'           },
  { value: 'electrician',           label: '⚡ Electrician',                 desc: 'Electrical work and compliance certs'         },
  { value: 'handyman',              label: '🛠️ Handyman',                    desc: 'General repairs and odd jobs'                 },
  { value: 'landscaper',            label: '🌿 Landscaper',                  desc: 'Garden design and maintenance'                },
  { value: 'pool_service',          label: '🏊 Pool Service',                desc: 'Pool cleaning and maintenance'                },
  { value: 'cleaning',              label: '🧹 Cleaning Company',            desc: 'Exit cleans and new-home cleans'              },
  { value: 'security',              label: '🔒 Security Company',            desc: 'Alarms, CCTV and guarding'                    },
]

// Extract suburb from full address
// "14 Oak Ave, Bryanston, Sandton, 2191" → "Bryanston, Sandton"
function toSuburb(address: string): string {
  if (!address) return ''
  const parts = address.split(',').map(p => p.trim()).filter(Boolean)
  if (parts.length >= 3) return parts.slice(1, 3).join(', ')
  if (parts.length === 2) return parts[1]
  return parts[0]
}

export default function MovingServicesPage() {
  const [user, setUser]                   = useState<any>(null)
  const [profile, setProfile]             = useState<any>(null)
  const [hasAccess, setHasAccess]         = useState(false)
  const [checkingAccess, setCheckingAccess] = useState(true)
  const [selectedServices, setSelectedServices] = useState<string[]>([])
  const [step, setStep]                   = useState(1)
  const [loading, setLoading]             = useState(false)
  const [submitted, setSubmitted]         = useState(false)
  const [form, setForm] = useState({
    from_address: '', to_address: '', move_date: '',
    first_name: '', last_name: '',
  })

  const [availableSuppliers, setAvailableSuppliers] = useState<any[]>([])
  const [selectedSuppliers, setSelectedSuppliers]   = useState<string[]>([])
  const [loadingSuppliers, setLoadingSuppliers]     = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) { setCheckingAccess(false); return }
      setUser(data.user)

      const { data: prof } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single()
      setProfile(prof)
      setHasAccess(prof?.has_moving_access || false)

      // Auto-populate name
      const fullName = prof?.full_name || data.user.user_metadata?.full_name || ''
      const [first, ...rest] = fullName.split(' ')
      setForm(p => ({
        ...p,
        first_name: first || '',
        last_name:  rest.join(' ') || '',
      }))

      // Auto-populate to_address from latest confirmed booking
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

  const loadSuppliers = async (serviceType: string) => {
    setLoadingSuppliers(true)
    const { data } = await supabase
      .from('suppliers')
      .select('id, business_name, logo_url, rating, review_count, areas_served, ai_profile, total_leads_received')
      .eq('service_type', serviceType)
      .eq('status', 'active')
      .eq('is_active', true)
      .eq('is_paused', false)
      .limit(5)
    setAvailableSuppliers(data || [])
    setLoadingSuppliers(false)
  }

  const goToSupplierStep = async () => {
    setStep(3)
    setSelectedSuppliers([])
    await loadSuppliers(selectedServices[0])
  }

  const toggleSupplier = (id: string) => {
    setSelectedSuppliers(prev =>
      prev.includes(id)
        ? prev.filter(s => s !== id)
        : prev.length >= 3 ? prev : [...prev, id]
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
      const { data: req } = await supabase.from('move_quote_requests').insert({
        user_id:          user.id,
        service_type:     service,
        // Suburb only shown to suppliers
        from_address:     toSuburb(form.from_address),
        to_address:       toSuburb(form.to_address),
        // Full address stored securely — shared only after quote accepted
        from_address_full: form.from_address,
        to_address_full:   form.to_address,
        move_date:        form.move_date || null,
        status:           'pending',
        details: {
          first_name: form.first_name,
          last_name:  form.last_name,
        },
      }).select().single()

      if (req) {
        await fetch('/api/notify-suppliers', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            request_id:         req.id,
            service_type:       service,
            selected_suppliers: selectedSuppliers,
            from_address:       toSuburb(form.from_address),
            to_address:         toSuburb(form.to_address),
            client_first_name:  form.first_name,
          }),
        })
      }
    }

    setSubmitted(true)
    setLoading(false)
  }

  useEffect(() => {
    if (step === 2) {
      setTimeout(() => {
        const load = () => {
          const fromEl = document.getElementById('from-address') as HTMLInputElement
          const toEl   = document.getElementById('to-address')   as HTMLInputElement
          if (!fromEl || !toEl || !(window as any).google) return
          const ac = (el: HTMLInputElement, field: string) => {
            const instance = new (window as any).google.maps.places.Autocomplete(el, {
              componentRestrictions: { country: 'za' }, fields: ['formatted_address'],
            })
            instance.addListener('place_changed', () => {
              const p = instance.getPlace()
              setForm(prev => ({ ...prev, [field]: p.formatted_address || el.value }))
            })
          }
          ac(fromEl, 'from_address')
          ac(toEl,   'to_address')
        }
        if ((window as any).google) { load() } else {
          const s = document.createElement('script')
          s.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_PLACES_KEY}&libraries=places`
          s.async = true; s.onload = load
          document.head.appendChild(s)
        }
      }, 300)
    }
  }, [step])

  if (checkingAccess) return (
    <main className="min-h-screen bg-[#f5f0eb] flex items-center justify-center">
      <p className="text-orange-500 animate-pulse">Loading...</p>
    </main>
  )

  if (!user) return (
    <main className="min-h-screen bg-[#f5f0eb] text-stone-900">
      <nav className="bg-[#4a4238] px-6 py-4 flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold text-white">Property<span className="text-orange-400">AI</span>gency</Link>
        <Link href="/" className="text-stone-300 hover:text-white text-sm">← Back to Home</Link>
      </nav>
      <div className="flex items-center justify-center min-h-[80vh] px-6">
        <div className="text-center">
          <p className="text-4xl mb-4">🔐</p>
          <h2 className="text-xl font-bold mb-2">Sign in to access Moving Services</h2>
          <p className="text-stone-500 text-sm mb-6">You need an account to request quotes from our verified suppliers.</p>
          <div className="flex gap-3 justify-center">
            <Link href="/auth/login?next=/moving" className="inline-block bg-orange-500 text-black font-bold px-8 py-3 rounded-xl hover:bg-orange-400">Sign In</Link>
            <Link href="/auth/register" className="inline-block bg-stone-100 text-stone-900 font-bold px-8 py-3 rounded-xl hover:bg-stone-200">Register Free</Link>
          </div>
        </div>
      </div>
    </main>
  )

  if (!hasAccess) return (
    <main className="min-h-screen bg-[#f5f0eb] text-stone-900">
      <nav className="bg-[#4a4238] px-6 py-4 flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold text-white">Property<span className="text-orange-400">AI</span>gency</Link>
        <Link href="/my-properties" className="text-stone-300 hover:text-white text-sm">← My Dashboard</Link>
      </nav>
      <div className="max-w-xl mx-auto px-6 py-12">
        <div className="text-center mb-8">
          <p className="text-5xl mb-4">📦</p>
          <h1 className="text-2xl font-bold mb-2">Moving Services</h1>
          <p className="text-stone-500">Get quotes from verified suppliers — all within 24 hours</p>
        </div>
        <div className="bg-white border border-orange-500 rounded-2xl p-8 mb-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <p className="text-xl font-bold">Moving Services Package</p>
              <p className="text-stone-500 text-sm">One-time upgrade</p>
            </div>
            <div className="text-right">
              <p className="text-4xl font-bold text-orange-500">R200</p>
              <p className="text-stone-500 text-xs">once-off</p>
            </div>
          </div>
          <ul className="space-y-3 mb-6">
            {['Choose up to 3 suppliers per service','All suppliers verified and reviewed','Quotes within 24 hours guaranteed','Accept, decline or find alternatives','No obligation to accept any quote'].map(item => (
              <li key={item} className="flex items-center gap-3 text-sm">
                <span className="text-green-400">✓</span>
                <span className="text-stone-700">{item}</span>
              </li>
            ))}
          </ul>
          <button onClick={handleUpgrade} className="w-full bg-orange-500 hover:bg-orange-400 text-black font-bold py-4 rounded-xl text-lg transition">
            Upgrade Now — R200
          </button>
          <p className="text-xs text-stone-400 text-center mt-3">During beta — access granted instantly. Payment coming soon.</p>
        </div>
      </div>
    </main>
  )

  if (submitted) return (
    <main className="min-h-screen bg-[#f5f0eb] text-stone-900 flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <p className="text-6xl mb-6">🎉</p>
        <h1 className="text-3xl font-bold mb-3">Requests Sent!</h1>
        <p className="text-stone-500 mb-6">Your selected suppliers have been notified and will respond within 24 hours.</p>
        <div className="bg-white border border-stone-300 rounded-xl p-4 mb-6 text-left">
          <p className="text-sm font-semibold mb-2">Services requested:</p>
          {selectedServices.map(s => (
            <p key={s} className="text-stone-500 text-sm">✓ {SERVICES.find(sv => sv.value === s)?.label}</p>
          ))}
        </div>
        <Link href="/my-properties" className="inline-block bg-orange-500 text-black font-bold px-8 py-3 rounded-xl hover:bg-orange-400">
          View My Quotes →
        </Link>
      </div>
    </main>
  )

  return (
    <main className="min-h-screen bg-[#f5f0eb] text-stone-900">
      <nav className="bg-[#4a4238] px-6 py-4 flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold text-white">Property<span className="text-orange-400">AI</span>gency</Link>
        <Link href="/my-properties" className="text-stone-300 hover:text-white text-sm">← My Dashboard</Link>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-12">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold mb-2">Moving Services</h1>
          <p className="text-stone-500">Get quotes from verified suppliers — all in one place.</p>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-2 mb-8 justify-center">
          {['Services','Details','Choose Suppliers'].map((label, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                step > i + 1 ? 'bg-green-500 text-white' :
                step === i + 1 ? 'bg-orange-500 text-black' :
                'bg-stone-100 text-stone-500'
              }`}>{step > i + 1 ? '✓' : i + 1}</div>
              <span className={`text-xs hidden sm:block ${step === i + 1 ? 'text-stone-900' : 'text-stone-400'}`}>{label}</span>
              {i < 2 && <div className="w-6 h-px bg-stone-100"/>}
            </div>
          ))}
        </div>

        {/* Step 1 — pick services */}
        {step === 1 && (
          <div>
            <h2 className="text-xl font-bold mb-4">What do you need help with?</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
              {SERVICES.map(service => (
                <button key={service.value}
                  onClick={() => setSelectedServices(prev =>
                    prev.includes(service.value) ? prev.filter(s => s !== service.value) : [...prev, service.value]
                  )}
                  className={`text-left p-4 rounded-xl border transition ${
                    selectedServices.includes(service.value)
                      ? 'border-orange-500 bg-orange-950'
                      : 'border-stone-300 hover:border-orange-500 bg-white'
                  }`}>
                  <p className="font-semibold">{service.label}</p>
                  <p className="text-stone-500 text-sm">{service.desc}</p>
                  {selectedServices.includes(service.value) && <p className="text-orange-400 text-xs mt-1">✓ Selected</p>}
                </button>
              ))}
            </div>
            <button onClick={() => setStep(2)} disabled={selectedServices.length === 0}
              className="w-full bg-orange-500 hover:bg-orange-400 text-black font-bold py-4 rounded-xl disabled:opacity-50 transition">
              Continue with {selectedServices.length} service{selectedServices.length !== 1 ? 's' : ''} →
            </button>
          </div>
        )}

        {/* Step 2 — details (auto-populated) */}
        {step === 2 && (
          <div className="bg-white border border-stone-300 rounded-2xl p-8 space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <button onClick={() => setStep(1)} className="text-stone-500 hover:text-stone-900">←</button>
              <h2 className="text-xl font-bold">Your Details</h2>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-stone-500 text-sm mb-1 block">First Name</label>
                <input value={form.first_name} onChange={e => setForm(p => ({ ...p, first_name: e.target.value }))}
                  className="w-full bg-stone-100 text-stone-800 rounded-lg px-4 py-3 outline-none border border-stone-300 focus:border-orange-500"
                  placeholder="Amy"/>
              </div>
              <div>
                <label className="text-stone-500 text-sm mb-1 block">Last Name</label>
                <input value={form.last_name} onChange={e => setForm(p => ({ ...p, last_name: e.target.value }))}
                  className="w-full bg-stone-100 text-stone-800 rounded-lg px-4 py-3 outline-none border border-stone-300 focus:border-orange-500"
                  placeholder="Smith"/>
              </div>
            </div>

            <div>
              <label className="text-stone-500 text-sm mb-1 block">Moving from</label>
              <input id="from-address" value={form.from_address}
                onChange={e => setForm(p => ({ ...p, from_address: e.target.value }))}
                className="w-full bg-stone-100 text-stone-800 rounded-lg px-4 py-3 outline-none border border-stone-300 focus:border-orange-500"
                placeholder="Current address..."/>
            </div>
            <div>
              <label className="text-stone-500 text-sm mb-1 block">Moving to</label>
              <input id="to-address" value={form.to_address}
                onChange={e => setForm(p => ({ ...p, to_address: e.target.value }))}
                className="w-full bg-stone-100 text-stone-800 rounded-lg px-4 py-3 outline-none border border-stone-300 focus:border-orange-500"
                placeholder="New address..."/>
            </div>
            <div>
              <label className="text-stone-500 text-sm mb-1 block">Date needed (optional)</label>
              <input type="date" value={form.move_date}
                onChange={e => setForm(p => ({ ...p, move_date: e.target.value }))}
                min={new Date(Date.now() + 86400000).toISOString().split('T')[0]}
                className="w-full bg-stone-100 text-stone-800 rounded-lg px-4 py-3 outline-none border border-stone-300 focus:border-orange-500"/>
            </div>

            <div className="bg-stone-100 rounded-xl p-3 text-xs text-stone-500">
              🔒 For your security, suppliers only see your suburb until you accept a quote. Your full address is shared only after you approve.
            </div>

            <button onClick={goToSupplierStep} disabled={!form.from_address || !form.to_address}
              className="w-full bg-orange-500 hover:bg-orange-400 text-black font-bold py-4 rounded-xl disabled:opacity-50 transition">
              See Available Suppliers →
            </button>
          </div>
        )}

        {/* Step 3 — pick suppliers */}
        {step === 3 && (
          <div>
            <div className="flex items-center gap-3 mb-6">
              <button onClick={() => setStep(2)} className="text-stone-500 hover:text-stone-900">←</button>
              <div>
                <h2 className="text-xl font-bold">Choose Your Suppliers</h2>
                <p className="text-stone-500 text-sm">Select up to 3 for: {SERVICES.find(s => s.value === selectedServices[0])?.label}</p>
              </div>
            </div>

            {loadingSuppliers ? (
              <div className="text-center py-12">
                <p className="text-orange-500 animate-pulse">Finding suppliers in your area...</p>
              </div>
            ) : availableSuppliers.length === 0 ? (
              <div className="bg-white border border-stone-300 rounded-2xl p-8 text-center mb-6">
                <p className="text-3xl mb-3">📭</p>
                <p className="font-semibold mb-1">No suppliers available yet in your area</p>
                <p className="text-stone-500 text-sm">We are growing our supplier network. We will notify you when suppliers join.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 mb-6">
                {availableSuppliers.map(sup => {
                  const isNew = sup.trial_expires_at && new Date(sup.trial_expires_at) > new Date()
                  return (
                    <button key={sup.id} onClick={() => toggleSupplier(sup.id)}
                      className={`text-left p-5 rounded-2xl border transition ${
                        selectedSuppliers.includes(sup.id)
                          ? 'border-orange-500 bg-orange-950'
                          : 'border-stone-300 hover:border-orange-400 bg-white'
                      }`}>
                      <div className="flex items-start gap-4">
                        {sup.logo_url
                          ? <img src={sup.logo_url} alt="" className="w-12 h-12 rounded-xl object-contain bg-stone-100 flex-shrink-0"/>
                          : <div className="w-12 h-12 rounded-xl bg-stone-100 flex items-center justify-center text-xl flex-shrink-0">🏢</div>
                        }
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-bold">{sup.business_name}</p>
                            {isNew && (
                              <span className="text-xs bg-orange-500 text-black font-bold px-2 py-0.5 rounded-full">New</span>
                            )}
                            {selectedSuppliers.includes(sup.id) && (
                              <span className="text-orange-400 text-sm font-bold ml-auto">✓ Selected</span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                            {sup.rating > 0 && (
                              <span className="text-sm text-stone-700">★ {sup.rating}/5 ({sup.review_count} reviews)</span>
                            )}
                            <span className="text-xs text-stone-400">Trusted by {sup.total_leads_received || 0} PropertyAIgency clients</span>
                          </div>
                          {sup.areas_served?.length > 0 && (
                            <p className="text-stone-400 text-xs mt-1">{sup.areas_served.slice(0,3).join(', ')}</p>
                          )}
                          {sup.ai_profile && (
                            <p className="text-stone-500 text-sm mt-2 line-clamp-2">{sup.ai_profile}</p>
                          )}
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}

            {selectedSuppliers.length > 0 && (
              <div className="bg-white border border-stone-300 rounded-xl px-4 py-3 mb-4 text-sm text-stone-700">
                {selectedSuppliers.length} of 3 suppliers selected
                {selectedSuppliers.length === 3 && <span className="text-orange-400 ml-2">Maximum reached</span>}
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={loading || (availableSuppliers.length > 0 && selectedSuppliers.length === 0)}
              className="w-full bg-orange-500 hover:bg-orange-400 text-black font-bold py-4 rounded-xl disabled:opacity-50 transition">
              {loading ? 'Sending requests...' : 'Send Quote Requests →'}
            </button>
            <p className="text-xs text-stone-400 text-center mt-3">Suppliers respond within 24 hours. No obligation to accept.</p>
          </div>
        )}
      </div>
    </main>
  )
}
