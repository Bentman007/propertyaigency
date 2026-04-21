'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

const LEAD_TIERS: Record<string, { price: number; label: string; colour: string }> = {
  high:     { price: 250, label: 'High Value',  colour: 'text-yellow-400' },
  mid:      { price: 200, label: 'Mid Value',   colour: 'text-blue-400'   },
  standard: { price: 150, label: 'Standard',    colour: 'text-green-400'  },
  trade:    { price: 100, label: 'Trade',        colour: 'text-gray-300'   },
}

const SERVICE_TYPES = [
  { value: 'bond_originator',       label: '🏦 Bond Originator',             desc: 'Home loan applications & pre-approvals',    tier: 'high'     },
  { value: 'conveyancing_attorney', label: '⚖️ Conveyancing Attorney',        desc: 'Property transfers and bond registrations', tier: 'high'     },
  { value: 'property_valuer',       label: '📊 Property Valuer',             desc: 'Formal valuations for sale or finance',      tier: 'high'     },
  { value: 'insurance_broker',      label: '🛡️ Insurance Broker',            desc: 'Home, contents & bond protection',           tier: 'high'     },
  { value: 'solar_installer',       label: '☀️ Solar Installer',             desc: 'Solar panels and battery backup systems',    tier: 'mid'      },
  { value: 'architect',             label: '📐 Architect',                   desc: 'Plans, extensions and new builds',           tier: 'mid'      },
  { value: 'str_manager',           label: '🏖️ Short-Term Rental Manager',   desc: 'Airbnb & holiday rental management',         tier: 'mid'      },
  { value: 'property_management',   label: '🏢 Property Management Company', desc: 'Full rental management services',            tier: 'mid'      },
  { value: 'home_inspector',        label: '🔍 Home Inspector',              desc: 'Pre-purchase building inspections',          tier: 'mid'      },
  { value: 'photographer',          label: '📸 Property Photographer',       desc: 'Professional listing photos',                tier: 'standard' },
  { value: 'videographer',          label: '🎬 Videographer',                desc: 'Property walk-through videos',               tier: 'standard' },
  { value: 'virtual_tour',          label: '🏠 3D Virtual Tour Specialist',  desc: 'Matterport and 3D walkthroughs',             tier: 'standard' },
  { value: 'home_stager',           label: '🛋️ Home Stager',                desc: 'Stage your home to sell faster',             tier: 'standard' },
  { value: 'interior_designer',     label: '🎨 Interior Designer',           desc: 'Interior design and decoration',             tier: 'standard' },
  { value: 'removal',               label: '🚛 Removal Company',             desc: 'Furniture and household moves',              tier: 'standard' },
  { value: 'storage',               label: '📦 Storage Facility',            desc: 'Short and long-term storage solutions',      tier: 'standard' },
  { value: 'painter',               label: '🖌️ Painter',                    desc: 'Interior and exterior painting',             tier: 'trade'    },
  { value: 'builder',               label: '🏗️ Builder / Contractor',        desc: 'Renovations and construction',               tier: 'trade'    },
  { value: 'plumber',               label: '🔧 Plumber',                     desc: 'Plumbing repairs and installations',         tier: 'trade'    },
  { value: 'electrician',           label: '⚡ Electrician',                 desc: 'Electrical work and compliance certs',       tier: 'trade'    },
  { value: 'handyman',              label: '🛠️ Handyman',                    desc: 'General repairs and odd jobs',               tier: 'trade'    },
  { value: 'landscaper',            label: '🌿 Landscaper / Garden Service', desc: 'Garden design and maintenance',              tier: 'trade'    },
  { value: 'pool_service',          label: '🏊 Pool Service',                desc: 'Pool cleaning and maintenance',              tier: 'trade'    },
  { value: 'cleaning',              label: '🧹 Cleaning Company',            desc: 'Exit cleans and new-home cleans',            tier: 'trade'    },
  { value: 'security',              label: '🔒 Security Company',            desc: 'Alarms, CCTV and guarding services',         tier: 'trade'    },
]

const TIER_BULLETS: Record<string, string[]> = {
  high:     ['R250 per qualified lead', 'Buyers are pre-screened by our AI', 'Leads are exclusive to you in your area', 'Set your weekly lead cap — pause any time'],
  mid:      ['R200 per qualified lead', 'Buyers are pre-screened by our AI', 'Leads are exclusive to you in your area', 'Set your weekly lead cap — pause any time'],
  standard: ['R150 per qualified lead', 'Buyers are pre-screened by our AI', 'Leads are exclusive to you in your area', 'Set your weekly lead cap — pause any time'],
  trade:    ['R100 per qualified lead', 'Buyers are pre-screened by our AI', 'Leads are exclusive to you in your area', 'Set your weekly lead cap — pause any time'],
}

export default function SupplierRegister() {
  const [step, setStep]               = useState<1|2|3|4|5>(1)
  const [loading, setLoading]         = useState(false)
  const [message, setMessage]         = useState('')
  const [selectedService, setSelectedService] = useState<typeof SERVICE_TYPES[0] | null>(null)
  const [logoFile, setLogoFile]       = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string>('')
  const [aiProfile, setAiProfile]     = useState('')
  const [aiLoading, setAiLoading]     = useState(false)
  const [form, setForm] = useState({
    email: '', password: '', business_name: '', description: '',
    phone: '', website: '', areas_served: '', weekly_lead_limit: '5',
  })

  const update = (field: string, value: string) => setForm(p => ({ ...p, [field]: value }))

  const selectService = (svc: typeof SERVICE_TYPES[0]) => {
    setSelectedService(svc)
    setStep(2)
  }

  const generateAIProfile = async () => {
    setAiLoading(true)
    setStep(4)
    try {
      const res = await fetch('/api/supplier-ai-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          business_name: form.business_name,
          website:       form.website,
          service_type:  selectedService?.value,
          service_label: selectedService?.label,
          areas_served:  form.areas_served,
        }),
      })
      const data = await res.json()
      setAiProfile(data.profile || '')
    } catch {
      setAiProfile(`${form.business_name} is a professional ${selectedService?.label} business serving ${form.areas_served || 'local areas'}.`)
    }
    setAiLoading(false)
  }

  const handleRegister = async () => {
    if (!selectedService) return
    setLoading(true)
    setMessage('')

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
      const { error: uploadErr } = await supabase.storage
        .from('supplier-logos')
        .upload(path, logoFile, { upsert: true })
      if (!uploadErr) {
        const { data: urlData } = supabase.storage.from('supplier-logos').getPublicUrl(path)
        logoUrl = urlData.publicUrl
      }
    }

    const tier = LEAD_TIERS[selectedService.tier]

    await supabase.from('suppliers').insert({
      user_id:           userId,
      business_name:     form.business_name,
      service_type:      selectedService.value,
      description:       form.description,
      phone:             form.phone,
      website:           form.website,
      areas_served:      form.areas_served.split(',').map(a => a.trim()).filter(Boolean),
      email:             form.email,
      logo_url:          logoUrl,
      lead_price:        tier.price,
      lead_tier:         selectedService.tier,
      weekly_lead_limit: parseInt(form.weekly_lead_limit) || 5,
      ai_profile:        aiProfile || form.description,
      is_active:         true,
      is_paused:         false,
    })

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
    <main className="min-h-screen bg-gray-900 text-white">
      <nav className="bg-gray-950 border-b border-gray-800 px-6 py-4 flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold">Property<span className="text-orange-500">AI</span>gency</Link>
        <Link href="/supplier/login" className="text-gray-400 hover:text-white text-sm">Already registered? Sign in</Link>
      </nav>

      <div className="max-w-xl mx-auto px-6 py-12">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Join as a Service Provider</h1>
          <p className="text-gray-400">Get leads from people buying, selling and moving home</p>
        </div>

        {step === 1 && (
          <div className="bg-gray-800 border border-gray-700 rounded-2xl p-8">
            <h2 className="text-lg font-bold text-orange-500 mb-6">Step 1 — What service do you offer?</h2>
            {(['high','mid','standard','trade'] as const).map(tier => {
              const t    = LEAD_TIERS[tier]
              const svcs = SERVICE_TYPES.filter(s => s.tier === tier)
              return (
                <div key={tier} className="mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`text-xs font-bold uppercase tracking-wider ${t.colour}`}>{t.label}</span>
                    <span className="text-gray-600 text-xs">· R{t.price}/lead</span>
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    {svcs.map(svc => (
                      <button key={svc.value} onClick={() => selectService(svc)}
                        className="text-left p-4 rounded-xl border border-gray-700 hover:border-orange-500 bg-gray-700 transition">
                        <p className="font-semibold text-sm">{svc.label}</p>
                        <p className="text-gray-400 text-xs mt-0.5">{svc.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {step === 2 && selectedService && (() => {
          const tier = LEAD_TIERS[selectedService.tier]
          return (
            <div className="bg-gray-800 border border-gray-700 rounded-2xl p-8">
              <button onClick={() => setStep(1)} className="text-gray-400 hover:text-white text-sm mb-6 block">← Back</button>
              <div className="text-center mb-8">
                <p className="text-4xl mb-2">{selectedService.label.split(' ')[0]}</p>
                <h2 className="text-xl font-bold">{selectedService.label.replace(/^[^ ]+ /, '')}</h2>
                <p className="text-gray-400 text-sm mt-1">{selectedService.desc}</p>
              </div>
              <div className="bg-gray-700 border border-orange-500 rounded-2xl p-6 mb-6 text-center">
                <p className="text-gray-400 text-sm mb-1">Your lead price</p>
                <p className={`text-5xl font-black mb-1 ${tier.colour}`}>R{tier.price}</p>
                <p className="text-gray-400 text-sm">per qualified lead</p>
                <div className="border-t border-gray-600 mt-4 pt-4 space-y-2 text-left">
                  {TIER_BULLETS[selectedService.tier].map((b, i) => (
                    <p key={i} className="text-sm text-gray-300 flex items-start gap-2">
                      <span className="text-orange-500 mt-0.5">✓</span>{b}
                    </p>
                  ))}
                </div>
              </div>
              <div className="bg-gray-700 rounded-xl p-4 mb-6 text-sm text-gray-300">
                <p className="font-semibold text-white mb-1">How billing works</p>
                <p>You only pay for leads you receive. We invoice you on the 1st of each month with 7-day payment terms. Pause or stop any time — no lock-in.</p>
              </div>
              <button onClick={() => setStep(3)}
                className="w-full bg-orange-500 hover:bg-orange-400 text-black font-bold py-3 rounded-xl transition">
                Continue — Register My Business →
              </button>
            </div>
          )
        })()}

        {step === 3 && (
          <div className="bg-gray-800 border border-gray-700 rounded-2xl p-8 space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <button onClick={() => setStep(2)} className="text-gray-400 hover:text-white text-sm">← Back</button>
              <h2 className="text-lg font-bold text-orange-500">Step 3 — Business Details</h2>
            </div>
            <div>
              <label className="text-gray-400 text-sm mb-2 block">Business Logo (optional)</label>
              <div className="flex items-center gap-4">
                {logoPreview
                  ? <img src={logoPreview} alt="logo" className="w-16 h-16 rounded-xl object-contain bg-gray-700 border border-gray-600"/>
                  : <div className="w-16 h-16 rounded-xl bg-gray-700 border border-gray-600 flex items-center justify-center text-2xl">🏢</div>
                }
                <label className="cursor-pointer bg-gray-700 hover:bg-gray-600 border border-gray-600 text-sm text-gray-300 px-4 py-2 rounded-lg transition">
                  {logoPreview ? 'Change logo' : 'Upload logo'}
                  <input type="file" accept="image/*" onChange={handleLogo} className="hidden"/>
                </label>
              </div>
            </div>
            <div>
              <label className="text-gray-400 text-sm mb-1 block">Business Name</label>
              <input value={form.business_name} onChange={e => update('business_name', e.target.value)}
                className="w-full bg-gray-700 text-white rounded-lg px-4 py-3 outline-none border border-gray-600 focus:border-orange-500"
                placeholder="e.g. Speedy Movers JHB"/>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-gray-400 text-sm mb-1 block">Phone</label>
                <input value={form.phone} onChange={e => update('phone', e.target.value)}
                  className="w-full bg-gray-700 text-white rounded-lg px-4 py-3 outline-none border border-gray-600 focus:border-orange-500"
                  placeholder="+27 82 123 4567"/>
              </div>
              <div>
                <label className="text-gray-400 text-sm mb-1 block">Website (optional)</label>
                <input value={form.website} onChange={e => update('website', e.target.value)}
                  className="w-full bg-gray-700 text-white rounded-lg px-4 py-3 outline-none border border-gray-600 focus:border-orange-500"
                  placeholder="www.yourbusiness.co.za"/>
              </div>
            </div>
            <div>
              <label className="text-gray-400 text-sm mb-1 block">Areas Served (comma separated)</label>
              <input value={form.areas_served} onChange={e => update('areas_served', e.target.value)}
                className="w-full bg-gray-700 text-white rounded-lg px-4 py-3 outline-none border border-gray-600 focus:border-orange-500"
                placeholder="Johannesburg, Sandton, Randburg, Midrand"/>
            </div>
            <div>
              <label className="text-gray-400 text-sm mb-1 block">Weekly Lead Limit <span className="text-orange-500">(minimum 5)</span></label>
              <div className="flex items-center gap-3">
                <input type="number" min="5" max="100" value={form.weekly_lead_limit}
                  onChange={e => update('weekly_lead_limit', e.target.value)}
                  className="w-28 bg-gray-700 text-white rounded-lg px-4 py-3 outline-none border border-gray-600 focus:border-orange-500"/>
                <p className="text-gray-400 text-sm">leads per week max. Change any time.</p>
              </div>
            </div>
            <div>
              <label className="text-gray-400 text-sm mb-1 block">Email</label>
              <input type="email" value={form.email} onChange={e => update('email', e.target.value)}
                className="w-full bg-gray-700 text-white rounded-lg px-4 py-3 outline-none border border-gray-600 focus:border-orange-500"
                placeholder="you@business.co.za"/>
            </div>
            <div>
              <label className="text-gray-400 text-sm mb-1 block">Password</label>
              <input type="password" value={form.password} onChange={e => update('password', e.target.value)}
                className="w-full bg-gray-700 text-white rounded-lg px-4 py-3 outline-none border border-gray-600 focus:border-orange-500"
                placeholder="••••••••"/>
            </div>
            {message && <p className="text-red-400 text-sm">{message}</p>}
            <button onClick={generateAIProfile}
              disabled={!form.business_name || !form.email || !form.password}
              className="w-full bg-orange-500 hover:bg-orange-400 text-black font-bold py-3 rounded-xl disabled:opacity-50 transition">
              ✨ Generate My Profile with AI →
            </button>
            <p className="text-xs text-gray-500 text-center">Our AI will write your business profile. You can edit it before going live.</p>
          </div>
        )}

        {step === 4 && (
          <div className="bg-gray-800 border border-gray-700 rounded-2xl p-8 space-y-5">
            <h2 className="text-lg font-bold text-orange-500">Step 4 — Your AI-Generated Profile</h2>
            {aiLoading ? (
              <div className="text-center py-12">
                <p className="text-orange-500 animate-pulse text-lg">✨ Writing your profile...</p>
                <p className="text-gray-500 text-sm mt-2">Analysing your business{form.website ? ' and website' : ''}...</p>
              </div>
            ) : (
              <>
                <p className="text-gray-400 text-sm">Edit your profile below then go live.</p>
                <textarea value={aiProfile} onChange={e => setAiProfile(e.target.value)} rows={8}
                  className="w-full bg-gray-700 text-white rounded-lg px-4 py-3 outline-none border border-gray-600 focus:border-orange-500 text-sm leading-relaxed"/>
                <div className="bg-gray-700 rounded-xl p-4 text-sm">
                  <p className="font-semibold mb-2">Preview</p>
                  <div className="flex items-center gap-3 mb-2">
                    {logoPreview && <img src={logoPreview} alt="" className="w-10 h-10 rounded-lg object-contain bg-gray-600"/>}
                    <div>
                      <p className="font-bold">{form.business_name}</p>
                      <p className="text-gray-400 text-xs">{selectedService?.label.replace(/^[^ ]+ /, '')} · {form.areas_served || 'Areas not set'}</p>
                    </div>
                  </div>
                  <p className="text-gray-300 text-xs leading-relaxed line-clamp-3">{aiProfile}</p>
                </div>
                {message && <p className="text-red-400 text-sm">{message}</p>}
                <button onClick={handleRegister} disabled={loading || !aiProfile}
                  className="w-full bg-orange-500 hover:bg-orange-400 text-black font-bold py-3 rounded-xl disabled:opacity-50 transition">
                  {loading ? 'Going live...' : '🚀 Go Live'}
                </button>
                <button onClick={generateAIProfile} className="w-full text-gray-400 hover:text-white text-sm py-2">
                  ↺ Regenerate profile
                </button>
              </>
            )}
          </div>
        )}

        {step === 5 && (
          <div className="bg-green-900 border border-green-700 rounded-2xl p-8 text-center">
            <p className="text-5xl mb-4">🎉</p>
            <h2 className="text-2xl font-bold text-green-300 mb-2">You are live!</h2>
            <p className="text-green-400 text-sm mb-6">Leads will appear in your dashboard as buyers in your area request your service.</p>
            <Link href="/supplier/login" className="inline-block bg-orange-500 text-black font-bold px-8 py-3 rounded-xl hover:bg-orange-400 transition">
              Go to My Dashboard →
            </Link>
          </div>
        )}
      </div>
    </main>
  )
}
