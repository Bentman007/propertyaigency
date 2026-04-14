'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirm) {
      setError('Passwords do not match')
      return
    }
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      setError(error.message)
    } else {
      window.location.href = '/auth/login?reset=success'
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
          <p className="text-gray-400 mt-2">Set your new password</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-900 border border-red-700 text-red-300 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-gray-300 text-sm mb-1 block">New password</label>
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-gray-700 text-white rounded-lg px-4 py-3 outline-none border border-gray-600 focus:border-orange-500"
            />
          </div>
          <div>
            <label className="text-gray-300 text-sm mb-1 block">Confirm password</label>
            <input
              type="password"
              required
              minLength={8}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="w-full bg-gray-700 text-white rounded-lg px-4 py-3 outline-none border border-gray-600 focus:border-orange-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-500 hover:bg-orange-400 text-black font-bold py-3 rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? 'Updating...' : 'Update password'}
          </button>
        </form>
      </div>
    </main>
  )
}
