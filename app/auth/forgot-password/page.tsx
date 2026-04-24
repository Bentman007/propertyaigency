'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [message, setMessage] = useState('')

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'https://www.propertyaigency.co.za/auth/reset-password'
    })

    if (error) {
      setMessage(error.message)
    } else {
      setSent(true)
    }
    setLoading(false)
  }

  return (
    <main className="min-h-screen bg-stone-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl p-8 w-full max-w-md border border-stone-300">
        <div className="text-center mb-8">
          <Link href="/" className="text-3xl font-bold text-stone-900">
            Property<span className="text-orange-500">AI</span>gency
          </Link>
          <p className="text-stone-500 mt-2">Reset your password</p>
        </div>

        {sent ? (
          <div className="text-center">
            <p className="text-4xl mb-4">📧</p>
            <h2 className="text-xl font-bold text-green-300 mb-2">Check your email!</h2>
            <p className="text-stone-500 text-sm mb-6">
              We sent a password reset link to <strong className="text-stone-900">{email}</strong>. 
              Click the link in the email to set a new password.
            </p>
            <p className="text-stone-400 text-xs mb-6">Didn't receive it? Check your spam folder.</p>
            <Link href="/auth/login" className="inline-block bg-orange-500 text-black font-bold px-8 py-3 rounded-xl hover:bg-orange-400">
              Back to Sign In
            </Link>
          </div>
        ) : (
          <>
            {message && (
              <div className="mb-4 p-3 bg-red-900 border border-red-700 text-red-300 rounded-lg text-sm">
                {message}
              </div>
            )}
            <form onSubmit={handleReset} className="space-y-4">
              <div>
                <label className="text-stone-700 text-sm mb-1 block">Email Address</label>
                <input type="email" required value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full bg-stone-100 text-stone-800 rounded-lg px-4 py-3 outline-none border border-stone-300 focus:border-orange-500"/>
              </div>
              <button type="submit" disabled={loading}
                className="w-full bg-orange-500 hover:bg-orange-400 text-black font-bold py-3 rounded-xl disabled:opacity-50 transition">
                {loading ? 'Sending...' : '📧 Send Reset Link'}
              </button>
            </form>
            <p className="text-center text-stone-400 text-sm mt-4">
              Remember your password?{' '}
              <Link href="/auth/login" className="text-orange-500 hover:underline">Sign in</Link>
            </p>
          </>
        )}
      </div>
    </main>
  )
}
