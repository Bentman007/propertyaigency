'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

const LEAD_PRICES: Record<string, number> = {
  bond_originator: 250, conveyancing_attorney: 250, property_valuer: 250, insurance_broker: 250,
  solar_installer: 200, architect: 200, str_manager: 200, property_management: 200, home_inspector: 200,
  photographer: 150, videographer: 150, virtual_tour: 150, home_stager: 150, interior_designer: 150,
  removal: 150, storage: 150,
  painter: 100, builder: 100, plumber: 100, electrician: 100, handyman: 100,
  landscaper: 100, pool_service: 100, cleaning: 100, security: 100,
}

const CATEGORIES = [
  {
    label: 'Finance & Legal',
    icon: '⚖️',
    desc: 'Financial and legal services for property buyers and sellers',
    services: [
      { value: 'bond_originator',       label: 'Bond Originator',           desc: 'Home loan applications & pre-approvals'    },
      { value: 'conveyancing_attorney', label: 'Conveyancing Attorney',      desc: 'Property transfers and bond registrations' },
      { value: 'property_valuer',       label: 'Property Valuer',           desc: 'Formal valuations for sale or finance'     },
      { value: 'insurance_broker',      label: 'Insurance Broker',          desc: 'Home, contents & bond protection'          },
    ],
  },
  {
    label: 'Property Services',
    icon: '🏠',
    desc: 'Specialist services for property owners and investors',
    services: [
      { value: 'solar_installer',     label: 'Solar Installer',               desc: 'Solar panels and battery backup systems' },
      { value: 'architect',           label: 'Architect',                     desc: 'Plans, extensions and new builds'        },
      { value: 'str_manager',         label: 'Short-Term Rental Manager',     desc: 'Airbnb & holiday rental management'      },
      { value: 'property_management', label: 'Property Management Company',   desc: 'Full rental management services'         },
      { value: 'home_inspector',      label: 'Home Inspector',                desc: 'Pre-purchase building inspections'       },
    ],
  },
  {
    label: 'Photography & Presentation',
    icon: '📸',
    desc: 'Make properties look their best for buyers',
    services: [
      { value: 'photographer',      label: 'Property Photographer',       desc: 'Professional listing photos'         },
      { value: 'videographer',      label: 'Videographer',                desc: 'Property walk-through videos'        },
      { value: 'virtual_tour',      label: '3D Virtual Tour Specialist',  desc: 'Matterport and 3D walkthroughs'      },
      { value: 'home_stager',       label: 'Home Stager',                 desc: 'Stage your home to sell faster'      },
      { value: 'interior_designer', label: 'Interior Designer',           desc: 'Interior design and decoration'      },
    ],
  },
  {
    label: 'Moving & Storage',
    icon: '🚛',
    desc: 'Help buyers and sellers with their move',
    services: [
      { value: 'removal', label: 'Removal Company',  desc: 'Furniture and household moves'          },
      { value: 'storage', label: 'Storage Facility', desc: 'Short and long-term storage solutions'  },
    ],
  },
  {
    label: 'Home & Garden',
    icon: '🌿',
    desc: 'Maintenance, improvements and outdoor services',
    services: [
      { value: 'painter',     label: 'Painter',           desc: 'Interior and exterior painting'         },
      { value: 'builder',     label: 'Builder',           desc: 'Renovations and construction'           },
      { value: 'plumber',     label: 'Plumber',           desc: 'Plumbing repairs and installations'     },
      { value: 'electrician', label: 'Electrician',       desc: 'Electrical work and compliance certs'   },
      { value: 'handyman',    label: 'Handyman',          desc: 'General repairs and odd jobs'           },
      { value: 'landscaper',  label: 'Landscaper',        desc: 'Garden design and maintenance'          },
      { value: 'pool_service',label: 'Pool Service',      desc: 'Pool cleaning and maintenance'          },
      { value: 'cleaning',    label: 'Cleaning Company',  desc: 'Exit cleans and new-home cleans'        },
      { value: 'security',    label: 'Security Company',  desc: 'Alarms, CCTV and guarding services'     },
    ],
  },
]

export default function SupplierRegister() {
  const [step, setStep]                   = useState<1|2|3|4|5>(1)
  const [loading, setLoading]             = useState(false)
  const [message, setMessage]             = useState('')
  const [selectedServices, setSelectedServices] = useState<string[]>([])
  const [logoFile, setLogoFile]           = useState<File | null>(null)
  const [logoPreview, setLogoPreview]     = useState<string>('')
  const [aiProfile, setAiProfile]         = useState('')
  const [aiLoading, setAiLoading]         = useState(false)
  const [form, setForm] = useState({
    email: '', password: '', business_name: '', description: '',
    phone: '', website: '', areas_served: '', weekly_lead_limit: '5',
  })

  const update = (field: string, value: string) => setForm(p => ({ ...p, [field]: value }))

  const toggleService = (value: string) => {
    setSelectedServices(prev =>
      prev.includes(value) ? prev.filter(s => s !== value) : [...prev, value]
    )
  }

  // Primary service is the first selected (highest lead price)
  const primaryService = selectedServices[0] || ''
  const maxLeadPrice   = Math.max(...selectedServices.map(s => LEAD_PRICES[s] || 0), 0)

  const generateAIProfile = async () => {
    setAiLoading(true)
    setStep(4)
    try {
      const res = await fetch('/api/supplier-ai-profile', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          business_name: form.business_name,
          website:       form.website,
          service_type:  primaryService,
          service_label: selectedServices.map(s =>
            CATEGORIES.flatMap(c => c.services).find(sv => sv.value === s)?.label || s
          ).join(', '),
          areas_served:  form.areas_served,
        }),
      })
      const data = await res.json()
      setAiProfile(data.profile || '')
    } catch {
      setAiProfile(`${form.business_name} is a professional service provider offering ${selectedServices.length} services to property buyers and sellers across ${form.areas_served || 'South Africa'}.`)
    }
    setAiLoading(false)
  }

  const handleRegister = async () => {
    if (selectedServices.length === 0) return
    setLoading(true)
    setMessage('')

    // Check phone uniqueness
    if (form.phone) {
      const { data: existingPhone } = await supabase
        .from('suppliers')
        .select('id')
        .eq('phone', form.phone)
        .neq('status', 'rejected')
        .single()
      if (existingPhone) {
        setMessage('A supplier account already exists with this phone number. If you have an existing account please sign in, or contact us at admin@propertyaigency.co.za')
        setLoading(false)
        return
      }
    }

    // Check for duplicate website (allow but flag)
    let websiteDuplicate = false
    if (form.website) {
      const cleanUrl = form.website.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0].toLowerCase()
      const { data: existingWebsite } = await supabase
        .from('suppliers')
        .select('id, business_name')
        .ilike('website', `%${cleanUrl}%`)
        .neq('status', 'rejected')
        .single()
      if (existingWebsite) {
        websiteDuplicate = true
      }
    }

    const { data, error } = await supabase.auth.signUp({
      email:    form.email,
      password: form.password,
      options:  { data: { full_name: form.business_name, account_type: 'supplier' } },
    })
    if (error) { setMessage(error.message); setLoading(false); return }

    const userId = data.user?.id
    if (!userId) { setMessage('Signup failed. Please try again.'); setLoading(false); return }

    let logoUrl = ''
    if (logoFile) {
      const ext  = logoFile.name.split('.').pop()
      const path = `${userId}/logo.${ext}`
      const { error: upErr } = await supabase.storage
        .from('supplier-logos')
        .upload(path, logoFile, { upsert: true })
      if (!upErr) {
        const { data: urlData } = supabase.storage.from('supplier-logos').getPublicUrl(path)
        logoUrl = urlData.publicUrl
      }
    }

    const trialExpiry = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString()

    await supabase.from('suppliers').insert({
      user_id:            userId,
      business_name:      form.business_name,
      service_type:       primaryService,
      service_types:      selectedServices,
      description:        form.description,
      phone:              form.phone,
      website:            form.website,
      areas_served:       form.areas_served.split(',').map(a => a.trim()).filter(Boolean),
      email:              form.email,
      logo_url:           logoUrl,
      lead_price:         maxLeadPrice,
      lead_tier:          maxLeadPrice >= 250 ? 'high' : maxLeadPrice >= 200 ? 'mid' : maxLeadPrice >= 150 ? 'standard' : 'trade',
      weekly_lead_limit:  parseInt(form.weekly_lead_limit) || 5,
      ai_profile:         aiProfile || form.description,
      status:             'pending_review',
      subscription_status:'trial',
      trial_expires_at:   trialExpiry,
      is_active:          false,
      is_paused:          false,
    })

    await fetch('/api/notify-admin-new-supplier', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        business_name:     form.business_name,
        service_type:      selectedServices.join(', '),
        website:           form.website,
        email:             form.email,
        areas_served:      form.areas_served,
        website_duplicate: websiteDuplicate,
      }),
    }).catch(() => {})

    setStep(5)
    setLoading(false)
  }

  const handleLogo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setLogoFile(file)
    setLogoPreview(URL.createObjectURL(file))
  }

  return (
    <main className="min-h-screen bg-[#f5f0eb] text-stone-900">
      <nav className="bg-[#4a4238] px-6 py-4 flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold text-white">Property<span className="text-orange-400">AI</span>gency</Link>
        <Link href="/supplier/login" className="text-stone-300 hover:text-white text-sm">Already registered? Sign in</Link>
      </nav>

      <div className="max-w-2xl mx-auto px-6 py-12">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Join as a Service Provider</h1>
          <p className="text-stone-500">Connect with buyers, sellers and movers who need your services</p>
        </div>

        {/* ── Step 1: Select services ── */}
        {step === 1 && (
          <div>
            <div className="bg-white border border-stone-300 rounded-2xl p-6 mb-4">
              <h2 className="text-lg font-bold text-orange-500 mb-1">Step 1 — What services do you offer?</h2>
              <p className="text-stone-500 text-sm">Select all that apply — you can offer multiple services</p>
            </div>

            <div className="space-y-4">
              {CATEGORIES.map(cat => (
                <div key={cat.label} className="bg-white border border-stone-300 rounded-2xl overflow-hidden">
                  <div className="px-5 py-3 border-b border-stone-300 flex items-center gap-2">
                    <span className="text-xl">{cat.icon}</span>
                    <div>
                      <p className="font-bold text-sm">{cat.label}</p>
                      <p className="text-stone-400 text-xs">{cat.desc}</p>
                    </div>
                  </div>
                  <div className="p-3 grid grid-cols-1 gap-2">
                    {cat.services.map(svc => (
                      <button key={svc.value} onClick={() => toggleService(svc.value)}
                        className={`text-left px-4 py-3 rounded-xl border transition flex items-center gap-3 ${
                          selectedServices.includes(svc.value)
                            ? 'border-orange-500 bg-orange-950'
                            : 'border-stone-300 hover:border-orange-400 bg-stone-100'
                        }`}>
                        <div className={`w-5 h-5 rounded-md border-2 flex-shrink-0 flex items-center justify-center ${
                          selectedServices.includes(svc.value)
                            ? 'border-orange-500 bg-orange-500'
                            : 'border-gray-500'
                        }`}>
                          {selectedServices.includes(svc.value) && (
                            <span className="text-black text-xs font-bold">✓</span>
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-sm">{svc.label}</p>
                          <p className="text-stone-500 text-xs">{svc.desc}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {selectedServices.length > 0 && (
              <div className="sticky bottom-4 mt-6">
                <button onClick={() => setStep(2)}
                  className="w-full bg-orange-500 hover:bg-orange-400 text-black font-bold py-4 rounded-2xl shadow-lg transition">
                  Continue with {selectedServices.length} service{selectedServices.length !== 1 ? 's' : ''} →
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── Step 2: Pricing for selected services ── */}
        {step === 2 && (
          <div className="bg-white border border-stone-300 rounded-2xl p-8">
            <button onClick={() => setStep(1)} className="text-stone-500 hover:text-stone-900 text-sm mb-6 block">← Back</button>
            <h2 className="text-lg font-bold text-orange-500 mb-6">Your Lead Pricing</h2>

            <div className="space-y-3 mb-6">
              {selectedServices.map(sv => {
                const svcLabel = CATEGORIES.flatMap(c => c.services).find(s => s.value === sv)?.label || sv
                const price    = LEAD_PRICES[sv] || 0
                return (
                  <div key={sv} className="flex items-center justify-between bg-stone-100 rounded-xl px-4 py-3">
                    <p className="text-sm font-semibold">{svcLabel}</p>
                    <span className="text-orange-400 font-bold">R{price}/lead</span>
                  </div>
                )
              })}
            </div>

            <div className="bg-orange-950 border border-orange-700 rounded-xl p-4 mb-6">
              <p className="font-bold text-orange-400 mb-1">2 Month Free Trial</p>
              <p className="text-stone-700 text-sm">Start receiving leads at no cost. After your trial, continue for R2000/year or R199/month. Per-lead fees apply throughout.</p>
            </div>

            <div className="bg-stone-100 rounded-xl p-4 mb-6 text-sm text-stone-700 space-y-2">
              {['You only pay for leads you receive', 'Invoiced on the 1st of each month — 7 day payment terms', 'Pause or stop any time — no lock-in', 'Full address only shared after you quote'].map(b => (
                <p key={b} className="flex items-start gap-2"><span className="text-orange-500 mt-0.5">✓</span>{b}</p>
              ))}
            </div>

            <button onClick={() => setStep(3)}
              className="w-full bg-orange-500 hover:bg-orange-400 text-black font-bold py-3 rounded-xl transition">
              Continue — Register My Business →
            </button>
          </div>
        )}

        {/* ── Step 3: Business details ── */}
        {step === 3 && (
          <div className="bg-white border border-stone-300 rounded-2xl p-8 space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <button onClick={() => setStep(2)} className="text-stone-500 hover:text-stone-900 text-sm">← Back</button>
              <h2 className="text-lg font-bold text-orange-500">Your Business Details</h2>
            </div>

            <div>
              <label className="text-stone-500 text-sm mb-2 block">Business Logo (optional)</label>
              <div className="flex items-center gap-4">
                {logoPreview
                  ? <img src={logoPreview} alt="logo" className="w-16 h-16 rounded-xl object-contain bg-stone-100 border border-stone-300"/>
                  : <div className="w-16 h-16 rounded-xl bg-stone-100 border border-stone-300 flex items-center justify-center text-2xl">🏢</div>
                }
                <label className="cursor-pointer bg-stone-100 hover:bg-stone-200 border border-stone-300 text-sm text-stone-700 px-4 py-2 rounded-lg transition">
                  {logoPreview ? 'Change logo' : 'Upload logo'}
                  <input type="file" accept="image/*" onChange={handleLogo} className="hidden"/>
                </label>
              </div>
            </div>

            <div>
              <label className="text-stone-500 text-sm mb-1 block">Business Name</label>
              <input value={form.business_name} onChange={e => update('business_name', e.target.value)}
                className="w-full bg-stone-100 text-stone-800 rounded-lg px-4 py-3 outline-none border border-stone-300 focus:border-orange-500"
                placeholder="e.g. Sharp Garden Services"/>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-stone-500 text-sm mb-1 block">Phone</label>
                <input value={form.phone} onChange={e => update('phone', e.target.value)}
                  className="w-full bg-stone-100 text-stone-800 rounded-lg px-4 py-3 outline-none border border-stone-300 focus:border-orange-500"
                  placeholder="+27 82 123 4567"/>
              </div>
              <div>
                <label className="text-stone-500 text-sm mb-1 block">Website <span className="text-orange-500">*</span></label>
                <input value={form.website} onChange={e => update('website', e.target.value)}
                  className="w-full bg-stone-100 text-stone-800 rounded-lg px-4 py-3 outline-none border border-stone-300 focus:border-orange-500"
                  placeholder="www.yourbusiness.co.za"/>
              </div>
            </div>

            <div>
              <label className="text-stone-500 text-sm mb-1 block">Areas Served (comma separated)</label>
              <input value={form.areas_served} onChange={e => update('areas_served', e.target.value)}
                className="w-full bg-stone-100 text-stone-800 rounded-lg px-4 py-3 outline-none border border-stone-300 focus:border-orange-500"
                placeholder="Johannesburg, Sandton, Randburg, Midrand"/>
            </div>

            <div>
              <label className="text-stone-500 text-sm mb-1 block">Weekly Lead Limit <span className="text-orange-500">(minimum 5)</span></label>
              <div className="flex items-center gap-3">
                <input type="number" min="5" max="100" value={form.weekly_lead_limit}
                  onChange={e => update('weekly_lead_limit', e.target.value)}
                  className="w-28 bg-stone-100 text-stone-800 rounded-lg px-4 py-3 outline-none border border-stone-300 focus:border-orange-500"/>
                <p className="text-stone-500 text-sm">leads per week max. Change any time.</p>
              </div>
            </div>

            <div>
              <label className="text-stone-500 text-sm mb-1 block">Email</label>
              <input type="email" value={form.email} onChange={e => update('email', e.target.value)}
                className="w-full bg-stone-100 text-stone-800 rounded-lg px-4 py-3 outline-none border border-stone-300 focus:border-orange-500"
                placeholder="you@business.co.za"/>
            </div>

            <div>
              <label className="text-stone-500 text-sm mb-1 block">Password</label>
              <input type="password" value={form.password} onChange={e => update('password', e.target.value)}
                className="w-full bg-stone-100 text-stone-800 rounded-lg px-4 py-3 outline-none border border-stone-300 focus:border-orange-500"
                placeholder="••••••••"/>
            </div>

            {message && <p className="text-red-400 text-sm">{message}</p>}

            <button onClick={generateAIProfile}
              disabled={!form.business_name || !form.email || !form.password || !form.website}
              className="w-full bg-orange-500 hover:bg-orange-400 text-black font-bold py-3 rounded-xl disabled:opacity-50 transition">
              ✨ Generate My Profile with AI →
            </button>
            <p className="text-xs text-stone-400 text-center">Website required — we verify all businesses before approving listings.</p>
          </div>
        )}

        {/* ── Step 4: AI profile ── */}
        {step === 4 && (
          <div className="bg-white border border-stone-300 rounded-2xl p-8 space-y-5">
            <h2 className="text-lg font-bold text-orange-500">Your AI-Generated Profile</h2>
            {aiLoading ? (
              <div className="text-center py-12">
                <p className="text-orange-500 animate-pulse text-lg">✨ Writing your profile...</p>
                <p className="text-stone-400 text-sm mt-2">Analysing your business and website...</p>
              </div>
            ) : (
              <>
                <p className="text-stone-500 text-sm">Edit your profile below then submit for review.</p>
                <textarea value={aiProfile} onChange={e => setAiProfile(e.target.value)} rows={8}
                  className="w-full bg-stone-100 text-stone-800 rounded-lg px-4 py-3 outline-none border border-stone-300 focus:border-orange-500 text-sm leading-relaxed"/>
                <div className="bg-stone-100 rounded-xl p-4 text-sm">
                  <p className="font-semibold mb-2">Preview</p>
                  <div className="flex items-center gap-3 mb-2">
                    {logoPreview && <img src={logoPreview} alt="" className="w-10 h-10 rounded-lg object-contain bg-stone-200"/>}
                    <div>
                      <p className="font-bold">{form.business_name}</p>
                      <p className="text-stone-500 text-xs">{selectedServices.length} service{selectedServices.length !== 1 ? 's' : ''} · {form.areas_served || 'Areas not set'}</p>
                    </div>
                  </div>
                  <p className="text-stone-700 text-xs leading-relaxed line-clamp-3">{aiProfile}</p>
                </div>
                {message && <p className="text-red-400 text-sm">{message}</p>}
                <button onClick={handleRegister} disabled={loading || !aiProfile}
                  className="w-full bg-orange-500 hover:bg-orange-400 text-black font-bold py-3 rounded-xl disabled:opacity-50 transition">
                  {loading ? 'Submitting...' : '🚀 Submit for Review'}
                </button>
                <button onClick={generateAIProfile} className="w-full text-stone-500 hover:text-stone-900 text-sm py-2">
                  ↺ Regenerate profile
                </button>
              </>
            )}
          </div>
        )}

        {/* ── Step 5: Success ── */}
        {step === 5 && (
          <div className="bg-green-900 border border-green-700 rounded-2xl p-8 text-center">
            <p className="text-5xl mb-4">🎉</p>
            <h2 className="text-2xl font-bold text-green-300 mb-2">Application Submitted!</h2>
            <p className="text-green-400 text-sm mb-2">Please check your email and confirm your address.</p>
            <p className="text-green-400 text-sm mb-6">We will review your listing within 24 hours. Your 2-month free trial starts from approval.</p>
            <Link href="/" className="inline-block bg-orange-500 text-black font-bold px-8 py-3 rounded-xl hover:bg-orange-400 transition">
              Back to Home
            </Link>
          </div>
        )}
      </div>
    </main>
  )
}
