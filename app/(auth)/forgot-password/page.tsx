'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })

    if (error) {
      setError(error.message)
    } else {
      setSubmitted(true)
    }
    setLoading(false)
  }

  if (submitted) {
    return (
      <main className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
        <div className="bg-gray-800 rounded-2xl p-8 w-full max-w-md border border-gray-700 text-center">
          <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Check your email</h2>
          <p className="text-gray-400 mb-6">
            We sent a reset link to <span className="text-orange-500">{email}</span>
          </p>
          <a href="/auth/login" className="text-orange-500 hover:underline text-sm">
            Back to login
          </a>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
      <div className="bg-gray-800 rounded-2xl p-8 w-full max-w-md border border-gray-700">
        <div className="text-center mb-8">
          <a href="/" className="text-3xl font-bold text-white">
            Property<span className="text-orange-500">AI</span>gency
          </a>
          <p className="text-gray-400 mt-2">Reset your password</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-900 border border-red-700 text-red-300 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-gray-300 text-sm mb-1 block">Email address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full bg-gray-700 text-white rounded-lg px-4 py-3 outline-none border border-gray-600 focus:border-orange-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-500 hover:bg-orange-400 text-black font-bold py-3 rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? 'Sending...' : 'Send reset link'}
          </button>
        </form>

        <p className="text-center text-gray-400 mt-6 text-sm">
          Remember your password?{' '}
          <a href="/auth/login" className="text-orange-500 hover:underline">Back to login</a>
        </p>
      </div>
    </main>
  )
}
