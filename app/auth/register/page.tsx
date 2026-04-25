'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

type Intent = 'looking' | 'listing' | null
type ListingType = 'private' | 'agent' | null

export default function RegisterPage() {
  const [intent, setIntent]           = useState<Intent>(null)
  const [listingType, setListingType] = useState<ListingType>(null)
  const [email, setEmail]             = useState('')
  const [password, setPassword]       = useState('')
  const [name, setName]               = useState('')
  const [agencyName, setAgencyName]   = useState('')
  const [eaabNumber, setEaabNumber]   = useState('')
  const [loading, setLoading]         = useState(false)
  const [message, setMessage]         = useState('')
  const [freeTrialActive, setFreeTrialActive] = useState(true)

  const accountType = intent === 'looking' ? 'buyer' : listingType === 'agent' ? 'agent' : 'private_seller'

  useEffect(() => {
    supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'free_trial_active')
      .single()
      .then(({ data }) => {
        setFreeTrialActive(data?.value === 'true')
      })
  }, [])

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name:    name,
          agency_name:  agencyName || null,
          account_type: accountType,
          eaab_number:  eaabNumber || null,
        },
      },
    })

    if (error) {
      setMessage(error.message)
    } else if (data.user) {
      await supabase.from('profiles').upsert({
        id:           data.user.id,
        full_name:    name,
        agency_name:  agencyName || null,
        account_type: accountType,
        eaab_number:  eaabNumber || null,
      })

      if (accountType === 'agent') {
        await fetch('/api/push', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: 'a947747b-d98c-4d77-8647-c4dd930d3fe7',
            title:   '🎉 New Agent Registered!',
            body:    `${agencyName || name} signed up. EAAB: ${eaabNumber || 'NOT PROVIDED'}.`,
            url:     '/admin',
          }),
        })
      }
      setMessage('Success! Check your email to confirm your account.')
    }
    setLoading(false)
  }

  return (
    <main className="min-h-screen bg-[#f5f0eb] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-5xl">

        <div className="text-center mb-10">
          <Link href="/" className="text-3xl font-bold text-stone-900">
            Property<span className="text-orange-500">AI</span>gency
          </Link>
          <p className="text-stone-500 mt-2">Create your free account</p>
        </div>

        {/* ── Success ── */}
        {message ? (
          <div className="max-w-md mx-auto bg-green-900 border border-green-700 rounded-2xl p-8 text-center">
            <p className="text-4xl mb-4">🎉</p>
            <h2 className="text-xl font-bold text-green-300 mb-2">You are registered!</h2>
            <p className="text-green-400 text-sm mb-6">{message}</p>
            <Link href="/auth/login" className="inline-block bg-orange-500 text-black font-bold px-8 py-3 rounded-xl hover:bg-orange-400">
              Sign In →
            </Link>
          </div>

        ) : !intent ? (
          /* ── Step 1: Intent ── */
          <div>
            <h2 className="text-2xl font-bold text-center text-stone-900 mb-8">What brings you to PropertyAIgency?</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

              {/* Looking */}
              <button onClick={() => setIntent('looking')}
                className="group text-left p-7 rounded-2xl border-2 border-blue-700 bg-blue-950 hover:bg-blue-900 hover:border-blue-500 transition">
                <p className="text-4xl mb-4">🔍</p>
                <p className="text-xl font-bold text-stone-900 mb-2">I am Looking for a Property</p>
                <p className="text-blue-300 text-sm leading-relaxed">Buying or renting — let our AI Concierge find your perfect match from thousands of listings.</p>
                <div className="mt-5 flex items-center gap-2 text-blue-400 font-semibold text-sm group-hover:text-stone-900 transition">
                  Get started free <span>→</span>
                </div>
              </button>

              {/* Listing */}
              <button onClick={() => setIntent('listing')}
                className="group text-left p-7 rounded-2xl border-2 border-orange-700 bg-orange-950 hover:bg-orange-900 hover:border-orange-500 transition">
                <p className="text-4xl mb-4">🏡</p>
                <p className="text-xl font-bold text-stone-900 mb-2">I Want to List a Property</p>
                <p className="text-orange-300 text-sm leading-relaxed">Selling or renting out — AI-powered listings with real buyer leads. Private sellers and agents welcome.</p>
                <div className="mt-5 flex items-center gap-2 text-orange-400 font-semibold text-sm group-hover:text-stone-900 transition">
                  {freeTrialActive ? 'Get started free →' : 'View pricing →'}
                </div>
              </button>

              {/* Supplier */}
              <Link href="/supplier/register"
                className="group text-left p-7 rounded-2xl border-2 border-green-700 bg-green-950 hover:bg-green-900 hover:border-green-500 transition">
                <p className="text-4xl mb-4">🏢</p>
                <p className="text-xl font-bold text-stone-900 mb-2">I am a Service Provider</p>
                <p className="text-green-300 text-sm leading-relaxed">Bond originators, attorneys, removal companies, solar installers and more — connect directly with buyers who need your services.</p>
                <div className="mt-5 flex items-center gap-2 text-green-400 font-semibold text-sm group-hover:text-stone-900 transition">
                  2 month free trial <span>→</span>
                </div>
              </Link>

            </div>
            <p className="text-center text-stone-400 text-sm mt-8">
              Already have an account?{' '}
              <Link href="/auth/login" className="text-orange-500 hover:underline">Sign in</Link>
            </p>
          </div>

        ) : intent === 'listing' && !listingType ? (
          /* ── Step 2: Listing type ── */
          <div className="max-w-2xl mx-auto">
            <button onClick={() => setIntent(null)} className="text-stone-500 hover:text-stone-900 text-sm mb-6 flex items-center gap-2">← Back</button>
            <h2 className="text-2xl font-bold text-center text-stone-900 mb-8">Are you a private seller or an estate agent?</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

              <button onClick={() => setListingType('private')}
                className="group text-left p-7 rounded-2xl border-2 border-orange-700 bg-orange-950 hover:bg-orange-900 hover:border-orange-400 transition">
                <p className="text-4xl mb-4">🏠</p>
                <p className="text-xl font-bold text-stone-900 mb-2">Private Seller or Landlord</p>
                <p className="text-orange-300 text-sm leading-relaxed mb-4">I am selling or renting my own property.</p>
                <div className="inline-block bg-orange-800 text-orange-200 text-xs font-bold px-3 py-1.5 rounded-full">
                  From R199 per listing · 2 months
                </div>
              </button>

              <button onClick={() => setListingType('agent')}
                className="group text-left p-7 rounded-2xl border-2 border-yellow-700 bg-yellow-950 hover:bg-yellow-900 hover:border-yellow-400 transition">
                <p className="text-4xl mb-4">🏢</p>
                <p className="text-xl font-bold text-stone-900 mb-2">Estate Agent or Agency</p>
                <p className="text-yellow-300 text-sm leading-relaxed mb-4">I manage multiple listings professionally.</p>
                {freeTrialActive ? (
                  <div className="inline-block bg-green-800 text-green-200 text-xs font-bold px-3 py-1.5 rounded-full">
                    🎉 Free for 2 months · then from R800/month
                  </div>
                ) : (
                  <div className="inline-block bg-yellow-800 text-yellow-200 text-xs font-bold px-3 py-1.5 rounded-full">
                    From R800/month · no lock-in
                  </div>
                )}
              </button>

            </div>
            <p className="text-center text-stone-400 text-sm mt-8">
              Already have an account?{' '}
              <Link href="/auth/login" className="text-orange-500 hover:underline">Sign in</Link>
            </p>
          </div>

        ) : (
          /* ── Step 3: Registration form ── */
          <div className="max-w-md mx-auto bg-white border border-stone-300 rounded-2xl p-8">
            <button onClick={() => intent === 'looking' ? setIntent(null) : setListingType(null)}
              className="text-stone-500 hover:text-stone-900 text-sm mb-6 flex items-center gap-2">← Back</button>

            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold mb-6 ${
              accountType === 'buyer'         ? 'bg-blue-900 text-blue-300' :
              accountType === 'agent'         ? 'bg-yellow-900 text-yellow-300' :
                                                'bg-orange-900 text-orange-300'
            }`}>
              {accountType === 'buyer'        ? '🔍 Property Seeker' :
               accountType === 'agent'        ? '🏢 Estate Agent' :
                                                '🏠 Private Seller / Landlord'}
            </div>

            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="text-stone-500 text-sm mb-1 block">Full Name</label>
                <input value={name} onChange={e => setName(e.target.value)} required
                  className="w-full bg-stone-100 text-stone-900 rounded-xl px-4 py-3 outline-none border border-stone-300 focus:border-orange-500"
                  placeholder="Your full name"/>
              </div>

              {accountType === 'agent' && (
                <>
                  <div>
                    <label className="text-stone-500 text-sm mb-1 block">Agency Name</label>
                    <input value={agencyName} onChange={e => setAgencyName(e.target.value)} required
                      className="w-full bg-stone-100 text-stone-900 rounded-xl px-4 py-3 outline-none border border-stone-300 focus:border-orange-500"
                      placeholder="e.g. Pam Golding, RE/MAX, or your own agency"/>
                  </div>
                  <div>
                    <label className="text-stone-500 text-sm mb-1 block">EAAB Registration Number</label>
                    <input value={eaabNumber} onChange={e => setEaabNumber(e.target.value)} required
                      className="w-full bg-stone-100 text-stone-900 rounded-xl px-4 py-3 outline-none border border-stone-300 focus:border-orange-500"
                      placeholder="e.g. 123456"/>
                    <p className="text-stone-400 text-xs mt-1">Your Estate Agency Affairs Board registration number</p>
                  </div>
                </>
              )}

              <div>
                <label className="text-stone-500 text-sm mb-1 block">Email Address</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                  className="w-full bg-stone-100 text-stone-900 rounded-xl px-4 py-3 outline-none border border-stone-300 focus:border-orange-500"
                  placeholder="your@email.com"/>
              </div>

              <div>
                <label className="text-stone-500 text-sm mb-1 block">Password</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6}
                  className="w-full bg-stone-100 text-stone-900 rounded-xl px-4 py-3 outline-none border border-stone-300 focus:border-orange-500"
                  placeholder="Minimum 6 characters"/>
              </div>

              {message && <p className="text-red-400 text-sm">{message}</p>}

              <button type="submit" disabled={loading}
                className="w-full bg-orange-500 hover:bg-orange-400 text-black font-bold py-3 rounded-xl disabled:opacity-50 transition mt-2">
                {loading ? 'Creating account...' : 'Create Free Account →'}
              </button>

              <p className="text-xs text-stone-400 text-center">
                {accountType === 'agent' && freeTrialActive  ? '🎉 Free for 2 months — no credit card required' :
                 accountType === 'agent' && !freeTrialActive ? 'No lock-in · cancel any time' :
                 accountType === 'private_seller'            ? 'List your first property from R199 — 2 month listing' :
                                                               'Completely free — no hidden charges ever'}
              </p>
            </form>

            <p className="text-center text-stone-400 text-sm mt-4">
              Already have an account?{' '}
              <Link href="/auth/login" className="text-orange-500 hover:underline">Sign in</Link>
            </p>
          </div>
        )}
      </div>
    </main>
  )
}
