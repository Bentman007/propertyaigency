'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

type Intent = 'looking' | 'listing' | null
type ListingType = 'private' | 'agent' | null

export default function RegisterPage() {
  const [intent, setIntent] = useState<Intent>(null)
  const [listingType, setListingType] = useState<ListingType>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [agencyName, setAgencyName] = useState('')
  const [eaabNumber, setEaabNumber] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const accountType = intent === 'looking' ? 'buyer' : listingType === 'agent' ? 'agent' : 'private_seller'

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
          agency_name: agencyName || null,
          account_type: accountType,
          eaab_number: eaabNumber || null
        }
      }
    })

    if (error) {
      setMessage(error.message)
    } else if (data.user) {
      await supabase.from('profiles').upsert({
        id: data.user.id,
        full_name: name,
        agency_name: agencyName || null,
        account_type: accountType,
        eaab_number: eaabNumber || null
      })

      // Notify admin of new agent signup
      if (accountType === 'agent') {
        await fetch('/api/push', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: 'a947747b-d98c-4d77-8647-c4dd930d3fe7',
            title: '🎉 New Agent Registered!',
            body: `${agencyName || name} signed up. EAAB: ${eaabNumber || 'NOT PROVIDED'}. Verify at eaab.org.za`,
            url: '/admin'
          })
        })
      }

      setMessage('Success! Check your email to confirm your account.')
    }
    setLoading(false)
  }

  return (
    <main className="min-h-screen bg-gray-900 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="text-3xl font-bold text-white">
            Property<span className="text-orange-500">AI</span>gency
          </Link>
          <p className="text-gray-400 mt-2">Create your free account</p>
        </div>

        {message ? (
          <div className="bg-green-900 border border-green-700 rounded-2xl p-8 text-center">
            <p className="text-4xl mb-4">🎉</p>
            <h2 className="text-xl font-bold text-green-300 mb-2">You're registered!</h2>
            <p className="text-green-400 text-sm mb-6">{message}</p>
            <Link href="/auth/login" className="inline-block bg-orange-500 text-black font-bold px-8 py-3 rounded-xl hover:bg-orange-400">
              Sign In →
            </Link>
          </div>
        ) : !intent ? (
          /* Step 1 - Intent */
          <div className="bg-gray-800 border border-gray-700 rounded-2xl p-8">
            <h2 className="text-xl font-bold text-center mb-6">What brings you to PropertyAIgency?</h2>
            <div className="space-y-3">
              <button onClick={() => setIntent('looking')}
                className="w-full text-left p-5 rounded-xl border border-gray-700 hover:border-orange-500 bg-gray-700 hover:bg-gray-600 transition">
                <p className="text-2xl mb-2">🔍</p>
                <p className="font-bold">I'm Looking for a Property</p>
                <p className="text-gray-400 text-sm mt-1">Buying or renting — let AI find your perfect match</p>
              </button>
              <button onClick={() => setIntent('listing')}
                className="w-full text-left p-5 rounded-xl border border-gray-700 hover:border-orange-500 bg-gray-700 hover:bg-gray-600 transition">
                <p className="text-2xl mb-2">🏡</p>
                <p className="font-bold">I Want to List a Property</p>
                <p className="text-gray-400 text-sm mt-1">Selling or renting out — private or as an agent</p>
              </button>
            </div>
            <p className="text-center text-gray-500 text-sm mt-6">
              Already have an account?{' '}
              <Link href="/auth/login" className="text-orange-500 hover:underline">Sign in</Link>
            </p>
          </div>
        ) : intent === 'listing' && !listingType ? (
          /* Step 2 - Listing type */
          <div className="bg-gray-800 border border-gray-700 rounded-2xl p-8">
            <button onClick={() => setIntent(null)} className="text-gray-400 hover:text-white text-sm mb-6 flex items-center gap-2">
              ← Back
            </button>
            <h2 className="text-xl font-bold text-center mb-6">Are you a private seller or an estate agent?</h2>
            <div className="space-y-3">
              <button onClick={() => setListingType('private')}
                className="w-full text-left p-5 rounded-xl border border-gray-700 hover:border-orange-500 bg-gray-700 hover:bg-gray-600 transition">
                <p className="text-2xl mb-2">🏠</p>
                <p className="font-bold">Private Seller or Landlord</p>
                <p className="text-gray-400 text-sm mt-1">I'm selling or renting my own property</p>
                <p className="text-orange-500 text-xs mt-2">From R199 per listing · 2 months</p>
              </button>
              <button onClick={() => setListingType('agent')}
                className="w-full text-left p-5 rounded-xl border border-gray-700 hover:border-orange-500 bg-gray-700 hover:bg-gray-600 transition">
                <p className="text-2xl mb-2">🏢</p>
                <p className="font-bold">Estate Agent or Agency</p>
                <p className="text-gray-400 text-sm mt-1">I manage multiple listings professionally</p>
                <p className="text-orange-500 text-xs mt-2">Free for 2 months · then from R800/month</p>
              </button>
            </div>
            <p className="text-center text-gray-500 text-sm mt-6">
              Already have an account?{' '}
              <Link href="/auth/login" className="text-orange-500 hover:underline">Sign in</Link>
            </p>
          </div>
        ) : (
          /* Step 3 - Registration form */
          <div className="bg-gray-800 border border-gray-700 rounded-2xl p-8">
            <button onClick={() => intent === 'looking' ? setIntent(null) : setListingType(null)}
              className="text-gray-400 hover:text-white text-sm mb-6 flex items-center gap-2">
              ← Back
            </button>

            {/* Account type badge */}
            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold mb-6 ${
              accountType === 'buyer' ? 'bg-blue-900 text-blue-300' :
              accountType === 'agent' ? 'bg-orange-900 text-orange-300' :
              'bg-green-900 text-green-300'
            }`}>
              {accountType === 'buyer' ? '🔍 Property Seeker' :
               accountType === 'agent' ? '🏢 Estate Agent' :
               '🏠 Private Seller/Landlord'}
            </div>

            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="text-gray-400 text-sm mb-1 block">Full Name</label>
                <input value={name} onChange={e => setName(e.target.value)} required
                  className="w-full bg-gray-700 text-white rounded-xl px-4 py-3 outline-none border border-gray-600 focus:border-orange-500"
                  placeholder="Your full name"/>
              </div>

              {accountType === 'agent' && (
                <>
                  <div>
                    <label className="text-gray-400 text-sm mb-1 block">Agency Name</label>
                    <input value={agencyName} onChange={e => setAgencyName(e.target.value)} required
                      className="w-full bg-gray-700 text-white rounded-xl px-4 py-3 outline-none border border-gray-600 focus:border-orange-500"
                      placeholder="e.g. Pam Golding, RE/MAX, or your own agency"/>
                  </div>
                  <div>
                    <label className="text-gray-400 text-sm mb-1 block">EAAB Registration Number</label>
                    <input value={eaabNumber} onChange={e => setEaabNumber(e.target.value)} required
                      className="w-full bg-gray-700 text-white rounded-xl px-4 py-3 outline-none border border-gray-600 focus:border-orange-500"
                      placeholder="e.g. 123456"/>
                    <p className="text-gray-500 text-xs mt-1">Your Estate Agency Affairs Board registration number</p>
                  </div>
                </>
              )}

              <div>
                <label className="text-gray-400 text-sm mb-1 block">Email Address</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                  className="w-full bg-gray-700 text-white rounded-xl px-4 py-3 outline-none border border-gray-600 focus:border-orange-500"
                  placeholder="your@email.com"/>
              </div>

              <div>
                <label className="text-gray-400 text-sm mb-1 block">Password</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
                  minLength={6}
                  className="w-full bg-gray-700 text-white rounded-xl px-4 py-3 outline-none border border-gray-600 focus:border-orange-500"
                  placeholder="Minimum 6 characters"/>
              </div>

              <button type="submit" disabled={loading}
                className="w-full bg-orange-500 hover:bg-orange-400 text-black font-bold py-3 rounded-xl disabled:opacity-50 transition mt-2">
                {loading ? 'Creating account...' : 'Create Free Account →'}
              </button>

              {accountType === 'agent' && (
                <p className="text-xs text-gray-500 text-center">
                  🎉 Free for 2 months — no credit card required
                </p>
              )}
              {accountType === 'private_seller' && (
                <p className="text-xs text-gray-500 text-center">
                  List your first property from R199 — 2 month listing
                </p>
              )}
              {accountType === 'buyer' && (
                <p className="text-xs text-gray-500 text-center">
                  Completely free — no hidden charges ever
                </p>
              )}
            </form>

            <p className="text-center text-gray-500 text-sm mt-4">
              Already have an account?{' '}
              <Link href="/auth/login" className="text-orange-500 hover:underline">Sign in</Link>
            </p>
          </div>
        )}
      </div>
    </main>
  )
}
