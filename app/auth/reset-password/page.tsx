'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [message, setMessage] = useState('')

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirm) {
      setMessage('Passwords do not match')
      return
    }
    if (password.length < 6) {
      setMessage('Password must be at least 6 characters')
      return
    }

    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      setMessage(error.message)
    } else {
      setDone(true)
    }
    setLoading(false)
  }

  if (done) return (
    <main className="min-h-screen bg-gradient-to-b from-amber-100 to-amber-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl p-8 w-full max-w-md border border-stone-300 text-center">
        <p className="text-4xl mb-4">🎉</p>
        <h2 className="text-xl font-bold text-green-300 mb-2">Password updated!</h2>
        <p className="text-stone-500 text-sm mb-6">Your password has been changed successfully.</p>
        <Link href="/auth/login" className="inline-block bg-orange-500 text-black font-bold px-8 py-3 rounded-xl hover:bg-orange-400">
          Sign In →
        </Link>
      </div>
    </main>
  )

  return (
    <main className="min-h-screen bg-gradient-to-b from-amber-100 to-amber-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl p-8 w-full max-w-md border border-stone-300">
        <div className="text-center mb-8">
          <Link href="/" className="text-3xl font-bold text-stone-900">
            Property<span className="text-orange-500">AI</span>gency
          </Link>
          <p className="text-stone-500 mt-2">Set your new password</p>
        </div>

        {message && (
          <div className="mb-4 p-3 bg-red-900 border border-red-700 text-red-300 rounded-lg text-sm">
            {message}
          </div>
        )}

        <form onSubmit={handleReset} className="space-y-4">
          <div>
            <label className="text-stone-700 text-sm mb-1 block">New Password</label>
            <input type="password" required value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Minimum 6 characters"
              className="w-full bg-amber-50 text-stone-800 rounded-lg px-4 py-3 outline-none border border-stone-300 focus:border-orange-500"/>
          </div>
          <div>
            <label className="text-stone-700 text-sm mb-1 block">Confirm New Password</label>
            <input type="password" required value={confirm}
              onChange={e => setConfirm(e.target.value)}
              placeholder="Repeat your new password"
              className="w-full bg-amber-50 text-stone-800 rounded-lg px-4 py-3 outline-none border border-stone-300 focus:border-orange-500"/>
          </div>
          <button type="submit" disabled={loading}
            className="w-full bg-orange-500 hover:bg-orange-400 text-black font-bold py-3 rounded-xl disabled:opacity-50 transition">
            {loading ? 'Updating...' : '🔐 Update Password'}
          </button>
        </form>
      </div>
    </main>
  )
}
