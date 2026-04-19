'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

const SERVICE_TYPES = [
  { value: 'removal', label: '🚛 Removal Company', desc: 'Furniture and household moves' },
  { value: 'cleaning', label: '🧹 Cleaning Service', desc: 'Exit cleans, new home cleans' },
  { value: 'garden', label: '🌿 Garden Service', desc: 'Landscaping and maintenance' },
  { value: 'pool', label: '🏊 Pool Service', desc: 'Pool cleaning and maintenance' },
  { value: 'legal', label: '⚖️ Conveyancing Attorney', desc: 'Property transfers and bonds' },
  { value: 'mortgage', label: '🏦 Bond Originator', desc: 'Home loan applications' },
  { value: 'surveyor', label: '📋 Property Surveyor', desc: 'Building inspections' },
  { value: 'handyman', label: '🔧 Handyman / Contractor', desc: 'Repairs and renovations' },
]

export default function SupplierRegister() {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [form, setForm] = useState({
    email: '', password: '', business_name: '', service_type: '',
    description: '', phone: '', website: '', areas_served: ''
  })

  const update = (field: string, value: string) => setForm(p => ({ ...p, [field]: value }))

  const handleRegister = async () => {
    setLoading(true)
    
    const { data, error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: { data: { full_name: form.business_name, account_type: 'supplier' } }
    })

    if (error) { setMessage(error.message); setLoading(false); return }

    if (data.user) {
      await supabase.from('suppliers').insert({
        user_id: data.user.id,
        business_name: form.business_name,
        service_type: form.service_type,
        description: form.description,
        phone: form.phone,
        website: form.website,
        areas_served: form.areas_served.split(',').map(a => a.trim()).filter(Boolean),
        email: form.email
      })
      setMessage('✅ Registration successful! Check your email to confirm your account.')
      setStep(3)
    }
    setLoading(false)
  }

  return (
    <main className="min-h-screen bg-gray-900 text-white">
      <nav className="bg-gray-950 border-b border-gray-800 px-6 py-4 flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold">Property<span className="text-orange-500">AI</span>gency</Link>
        <Link href="/auth/login" className="text-gray-400 hover:text-white text-sm">Already registered? Sign in</Link>
      </nav>

      <div className="max-w-xl mx-auto px-6 py-12">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Join as a Service Provider</h1>
          <p className="text-gray-400">Get leads from people moving home — right when they need you</p>
        </div>

        {step === 3 ? (
          <div className="bg-green-900 border border-green-700 rounded-2xl p-8 text-center">
            <p className="text-4xl mb-4">🎉</p>
            <h2 className="text-xl font-bold text-green-300 mb-2">You're registered!</h2>
            <p className="text-green-400 text-sm mb-4">Check your email to confirm your account, then log in to your supplier dashboard.</p>
            <Link href="/auth/login" className="inline-block bg-orange-500 text-black font-bold px-8 py-3 rounded-xl hover:bg-orange-400">
              Sign In to Dashboard
            </Link>
          </div>
        ) : step === 1 ? (
          <div className="bg-gray-800 border border-gray-700 rounded-2xl p-8 space-y-4">
            <h2 className="text-lg font-bold text-orange-500 mb-4">Step 1 — What service do you offer?</h2>
            <div className="grid grid-cols-1 gap-3">
              {SERVICE_TYPES.map(service => (
                <button key={service.value}
                  onClick={() => { update('service_type', service.value); setStep(2) }}
                  className={`text-left p-4 rounded-xl border transition ${
                    form.service_type === service.value
                      ? 'border-orange-500 bg-orange-950'
                      : 'border-gray-700 hover:border-orange-500 bg-gray-700'
                  }`}>
                  <p className="font-semibold">{service.label}</p>
                  <p className="text-gray-400 text-sm">{service.desc}</p>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-gray-800 border border-gray-700 rounded-2xl p-8 space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <button onClick={() => setStep(1)} className="text-gray-400 hover:text-white">←</button>
              <h2 className="text-lg font-bold text-orange-500">Step 2 — Business Details</h2>
            </div>

            <div>
              <label className="text-gray-400 text-sm mb-1 block">Business Name</label>
              <input value={form.business_name} onChange={e => update('business_name', e.target.value)}
                className="w-full bg-gray-700 text-white rounded-lg px-4 py-3 outline-none border border-gray-600 focus:border-orange-500"
                placeholder="e.g. Speedy Movers JHB"/>
            </div>

            <div>
              <label className="text-gray-400 text-sm mb-1 block">Description</label>
              <textarea value={form.description} onChange={e => update('description', e.target.value)}
                rows={3}
                className="w-full bg-gray-700 text-white rounded-lg px-4 py-3 outline-none border border-gray-600 focus:border-orange-500"
                placeholder="Tell customers about your service..."/>
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

            <button onClick={handleRegister} disabled={loading || !form.email || !form.password || !form.business_name}
              className="w-full bg-orange-500 hover:bg-orange-400 text-black font-bold py-3 rounded-xl disabled:opacity-50 transition">
              {loading ? 'Registering...' : '🚀 Register My Business'}
            </button>

            <p className="text-xs text-gray-500 text-center">
              First 30 days free. Then R500/month + commission on accepted quotes.
            </p>
          </div>
        )}
      </div>
    </main>
  )
}
