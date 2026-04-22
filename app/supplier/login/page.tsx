'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function SupplierLoginPage() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)
  const [message, setMessage]   = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setMessage(error.message)
      setLoading(false)
      return
    }

    // Verify they are actually a supplier
    const { data: { user } } = await supabase.auth.getUser()
    if (user?.user_metadata?.account_type !== 'supplier') {
      await supabase.auth.signOut()
      setMessage('No supplier account found for this email. Please register as a service provider.')
      setLoading(false)
      return
    }

    window.location.href = '/supplier/dashboard'
    setLoading(false)
  }

  return (
    <main className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
      <div className="w-full max-w-md">

        <div className="text-center mb-8">
          <Link href="/" className="text-3xl font-bold text-white">
            Property<span className="text-orange-500">AI</span>gency
          </Link>
          <p className="text-gray-400 mt-2">Service Provider Login</p>
        </div>

        <div className="bg-gray-800 rounded-2xl p-8 border border-gray-700">

          {message && (
            <div className="mb-4 p-3 bg-red-900 border border-red-700 text-red-300 rounded-lg text-sm">
              {message}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-gray-300 text-sm mb-1 block">Email</label>
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@business.co.za"
                className="w-full bg-gray-700 text-white rounded-lg px-4 py-3 outline-none border border-gray-600 focus:border-orange-500"/>
            </div>
            <div>
              <label className="text-gray-300 text-sm mb-1 block">Password</label>
              <input type="password" required value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-gray-700 text-white rounded-lg px-4 py-3 outline-none border border-gray-600 focus:border-orange-500"/>
              <div className="text-right mt-1">
                <Link href="/auth/forgot-password" className="text-orange-500 hover:underline text-sm">
                  Forgot password?
                </Link>
              </div>
            </div>
            <button type="submit" disabled={loading}
              className="w-full bg-orange-500 hover:bg-orange-400 text-black font-bold py-3 rounded-lg transition disabled:opacity-50">
              {loading ? 'Signing in...' : 'Sign In to Dashboard'}
            </button>
          </form>

          <div className="border-t border-gray-700 mt-6 pt-6 text-center space-y-2">
            <p className="text-gray-400 text-sm">
              Not registered yet?{' '}
              <Link href="/supplier/register" className="text-orange-500 hover:underline">Join as a service provider</Link>
            </p>
            <p className="text-gray-600 text-xs">
              Looking for a property?{' '}
              <Link href="/auth/login" className="text-gray-500 hover:underline">Buyer / Agent login</Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}
