'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

const BUNDLES = [
  { key: 'starter', name: 'Starter', credits: 10, price: 850, perListing: 85, popular: false },
  { key: 'growth', name: 'Growth', credits: 30, price: 2100, perListing: 70, popular: false },
  { key: 'pro', name: 'Pro', credits: 50, price: 2750, perListing: 55, popular: true },
  { key: 'agency', name: 'Agency', credits: 100, price: 4500, perListing: 45, popular: false },
]

export default function UpgradePage() {
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<string>('pro')

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) { window.location.href = '/auth/login?next=/upgrade'; return }
      const { data: p } = await supabase.from('profiles').select('*').eq('id', data.user.id).single()
      setProfile(p)
      setLoading(false)
    })
  }, [])

  if (loading) return (
    <main className="min-h-screen bg-stone-50 flex items-center justify-center">
      <p className="text-orange-500 animate-pulse">Loading...</p>
    </main>
  )

  const selectedBundle = BUNDLES.find(b => b.key === selected)!

  return (
    <main className="min-h-screen bg-amber-50 text-stone-900">
      <nav className="bg-stone-700 border-b border-stone-600 px-6 py-4 flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold">Property<span className="text-orange-500">AI</span>gency</Link>
        <Link href="/dashboard" className="text-stone-300 hover:text-white text-sm">← Back to Dashboard</Link>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold mb-2">Top Up Your Listing Credits</h1>
          <p className="text-stone-500">Each credit = one listing, live for 2 months. Use 1 credit to relist.</p>
          {profile?.bundle_credits > 0 && (
            <div className="mt-4 inline-block bg-white border border-orange-500 rounded-xl px-6 py-3">
              <p className="text-orange-500 font-bold">You currently have {profile.bundle_credits} credits remaining</p>
            </div>
          )}
          {profile?.is_trial && (
            <div className="mt-4 inline-block bg-yellow-900 border border-yellow-500 rounded-xl px-6 py-3">
              <p className="text-yellow-400 font-bold">⏰ Free trial — choose a bundle before it ends</p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {BUNDLES.map(bundle => (
            <button key={bundle.key} onClick={() => setSelected(bundle.key)}
              className={`relative rounded-2xl p-5 border-2 text-left transition ${
                selected === bundle.key ? 'border-orange-500 bg-white' : 'border-stone-300 bg-white hover:border-gray-500'
              }`}>
              {bundle.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-orange-500 text-black text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap">
                  BEST VALUE
                </div>
              )}
              <p className="font-bold text-lg mb-1">{bundle.name}</p>
              <p className="text-orange-500 font-bold text-2xl">R{bundle.price.toLocaleString()}</p>
              <p className="text-stone-500 text-xs mt-1">{bundle.credits} credits</p>
              <p className="text-green-400 text-xs">R{bundle.perListing}/listing</p>
            </button>
          ))}
        </div>

        <div className="bg-white border border-stone-300 rounded-2xl p-6 mb-6">
          <h2 className="font-bold text-lg mb-4">Order Summary</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-stone-500">{selectedBundle.name} Bundle</span>
              <span className="font-bold">R{selectedBundle.price.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-500">Listing credits</span>
              <span className="text-green-400 font-bold">{selectedBundle.credits} credits</span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-500">Cost per listing</span>
              <span className="text-green-400 font-bold">R{selectedBundle.perListing}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-500">Listing duration</span>
              <span>2 months each</span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-500">Lock-in contract</span>
              <span className="text-green-400">None ✅</span>
            </div>
            <div className="border-t border-stone-300 pt-3 flex justify-between text-lg font-bold">
              <span>Total</span>
              <span className="text-orange-500">R{selectedBundle.price.toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div className="text-center">
          <div className="bg-white border border-yellow-600 rounded-2xl p-6 mb-4">
            <p className="text-yellow-400 font-bold text-lg mb-2">💳 Online Payment Coming Soon</p>
            <p className="text-stone-500 text-sm mb-4">We are setting up our payment system. In the meantime, contact us to activate your bundle manually.</p>
            <Link href="/contact"
              className="inline-block bg-orange-500 hover:bg-orange-400 text-black font-bold py-3 px-8 rounded-xl transition">
              Contact Us to Activate — R{selectedBundle.price.toLocaleString()}
            </Link>
          </div>
          <p className="text-stone-400 text-xs">Once PayFast is live, payment will be instant and credits added automatically.</p>
        </div>
      </div>
    </main>
  )
}
