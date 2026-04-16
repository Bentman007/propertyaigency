'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [agencyName, setAgencyName] = useState('')
  const [accountType, setAccountType] = useState<'agent' | 'buyer'>('buyer')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: { data: { full_name: name, agency_name: agencyName, account_type: accountType } }
    })
    if (error) {
      setMessage(error.message)
    } else if (data.user) {
      // Create profile
      await supabase.from('profiles').upsert({
        id: data.user.id,
        full_name: name,
        agency_name: agencyName || null
      })
      setMessage('Success! Check your email to confirm your account.')
    }
    setLoading(false)
  }

  return (
    <main className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
      <div className="bg-gray-800 rounded-2xl p-8 w-full max-w-md border border-gray-700">
        <div className="text-center mb-8">
          <a href="/" className="text-3xl font-bold text-white">
            Property<span className="text-orange-500">AI</span>gency
          </a>
          <p className="text-gray-400 mt-2">Create your free account</p>
        </div>

        {/* Account type selector */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <button type="button" onClick={() => setAccountType('buyer')}
            className={`py-3 rounded-xl font-semibold text-sm transition ${
              accountType === 'buyer' ? 'bg-orange-500 text-black' : 'bg-gray-700 text-gray-300'
            }`}>
            🔍 I'm Looking
          </button>
          <button type="button" onClick={() => setAccountType('agent')}
            className={`py-3 rounded-xl font-semibold text-sm transition ${
              accountType === 'agent' ? 'bg-orange-500 text-black' : 'bg-gray-700 text-gray-300'
            }`}>
            🏠 I'm an Agent
          </button>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="text-gray-300 text-sm mb-1 block">Full Name</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)}
              className="w-full bg-gray-700 text-white rounded-lg px-4 py-3 outline-none border border-gray-600 focus:border-orange-500"
              placeholder="Andrew Sharp" required />
          </div>

          {accountType === 'agent' && (
            <div>
              <label className="text-gray-300 text-sm mb-1 block">Agency Name <span className="text-gray-500">(optional)</span></label>
              <input type="text" value={agencyName} onChange={e => setAgencyName(e.target.value)}
                className="w-full bg-gray-700 text-white rounded-lg px-4 py-3 outline-none border border-gray-600 focus:border-orange-500"
                placeholder="Pam Golding, RE/MAX, Private etc." />
            </div>
          )}

          <div>
            <label className="text-gray-300 text-sm mb-1 block">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              className="w-full bg-gray-700 text-white rounded-lg px-4 py-3 outline-none border border-gray-600 focus:border-orange-500"
              placeholder="you@example.com" required />
          </div>
          <div>
            <label className="text-gray-300 text-sm mb-1 block">Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              className="w-full bg-gray-700 text-white rounded-lg px-4 py-3 outline-none border border-gray-600 focus:border-orange-500"
              placeholder="••••••••" required />
          </div>
          {message && (
            <p className={`text-sm ${message.includes('Success') ? 'text-green-400' : 'text-red-400'}`}>
              {message}
            </p>
          )}
          <button type="submit" disabled={loading}
            className="w-full bg-orange-500 text-black font-bold py-3 rounded-lg hover:bg-orange-400 transition-colors disabled:opacity-50">
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>
        <p className="text-center text-gray-400 mt-6 text-sm">
          Already have an account?{' '}
          <a href="/auth/login" className="text-orange-500 hover:underline">Sign in here</a>
        </p>
      </div>
    </main>
  )
}
