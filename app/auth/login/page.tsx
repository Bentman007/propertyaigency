'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setMessage(error.message)
    } else {
      const params = new URLSearchParams(window.location.search)
      const next = params.get('next')
      const { data: { user } } = await supabase.auth.getUser()
      const email = user?.email || ''
      const accountType = user?.user_metadata?.account_type || 'buyer'
      // Admin always goes to admin — overrides any next param
      if (email === 'sharp61@hotmail.com') {
        window.location.href = '/admin'
      } else if (next) {
        window.location.href = next
      } else if (accountType === 'agent') {
        window.location.href = '/dashboard'
      } else if (accountType === 'private_seller') {
        window.location.href = '/my-listings'
      } else {
        window.location.href = '/my-properties'
      }
    }
    setLoading(false)
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-amber-100 to-amber-50 flex items-center justify-center px-4 relative">
      <Link href="/" className="absolute top-4 left-6 text-stone-300 hover:text-white text-sm">← Back to Home</Link>
      <div className="bg-white rounded-2xl p-8 w-full max-w-md border border-stone-300">
        <div className="text-center mb-8">
          <Link href="/" className="text-3xl font-bold text-stone-900">
            Property<span className="text-orange-500">AI</span>gency
          </Link>
          <p className="text-stone-500 mt-2">Sign in to your account</p>
        </div>

        {message && (
          <div className="mb-4 p-3 bg-red-900 border border-red-700 text-red-300 rounded-lg text-sm">
            {message}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-stone-700 text-sm mb-1 block">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full bg-amber-50 text-stone-800 rounded-lg px-4 py-3 outline-none border border-stone-300 focus:border-orange-500"
            />
          </div>
          <div>
            <label className="text-stone-700 text-sm mb-1 block">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-amber-50 text-stone-800 rounded-lg px-4 py-3 outline-none border border-stone-300 focus:border-orange-500"
            />
            <div className="text-right mt-1">
              <Link href="/auth/forgot-password" className="text-orange-500 hover:underline text-sm">
                Forgot password?
              </Link>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-500 hover:bg-orange-400 text-black font-bold py-3 rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-stone-500 mt-6 text-sm">
          Don't have an account?{' '}
          <Link href="/auth/register" className="text-orange-500 hover:underline">Register here</Link>
        </p>
      </div>
    </main>
  )
}
