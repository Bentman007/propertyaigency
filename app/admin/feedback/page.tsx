'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function FeedbackPage() {
  const [feedback, setFeedback] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'positive' | 'neutral' | 'negative'>('all')
  const [userFilter, setUserFilter] = useState<'all' | 'buyer' | 'agent'>('all')

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user || data.user.email !== 'sharp61@hotmail.com') {
        window.location.href = '/'
        return
      }
      const { data: fb } = await supabase
        .from('feedback')
        .select('*')
        .order('created_at', { ascending: false })
      setFeedback(fb || [])
      setLoading(false)
    })
  }, [])

  const filtered = feedback.filter(f => {
    const sentimentMatch = filter === 'all' || f.sentiment === filter
    const userMatch = userFilter === 'all' || f.user_type === userFilter
    return sentimentMatch && userMatch
  })

  const posPercent = feedback.length > 0
    ? Math.round((feedback.filter(f => f.sentiment === 'positive').length / feedback.length) * 100)
    : 0

  if (loading) return (
    <main className="min-h-screen bg-gray-900 flex items-center justify-center">
      <p className="text-orange-500 animate-pulse">Loading feedback...</p>
    </main>
  )

  return (
    <main className="min-h-screen bg-gray-900 text-white">
      <nav className="bg-gray-950 border-b border-gray-800 px-6 py-4 flex justify-between items-center">
        <Link href="/admin" className="text-2xl font-bold">Property<span className="text-orange-500">AI</span>gency</Link>
        <Link href="/admin" className="text-gray-400 hover:text-white text-sm">← Back to Admin</Link>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-1">💬 User Feedback</h1>
          <p className="text-gray-400">What your users are saying about PropertyAIgency</p>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gray-800 rounded-xl p-4 border border-gray-700 text-center">
            <p className="text-3xl font-bold text-orange-500">{feedback.length}</p>
            <p className="text-gray-400 text-sm mt-1">Total Responses</p>
          </div>
          <div className="bg-green-900 rounded-xl p-4 border border-green-700 text-center">
            <p className="text-3xl font-bold text-green-400">{posPercent}%</p>
            <p className="text-gray-300 text-sm mt-1">Positive Rating</p>
          </div>
          <div className="bg-gray-800 rounded-xl p-4 border border-gray-700 text-center">
            <p className="text-3xl font-bold text-blue-400">{feedback.filter(f => f.user_type === 'agent').length}</p>
            <p className="text-gray-400 text-sm mt-1">From Agents</p>
          </div>
          <div className="bg-gray-800 rounded-xl p-4 border border-gray-700 text-center">
            <p className="text-3xl font-bold text-purple-400">{feedback.filter(f => f.user_type === 'buyer').length}</p>
            <p className="text-gray-400 text-sm mt-1">From Buyers</p>
          </div>
        </div>

        {/* Marketing headline */}
        {feedback.length >= 10 && (
          <div className="bg-gradient-to-r from-green-900 to-gray-800 border border-green-700 rounded-2xl p-6 mb-8">
            <p className="text-lg font-bold text-green-400 mb-1">📣 Ready for Marketing</p>
            <p className="text-gray-300 text-sm mb-3">You have enough data to use in marketing materials:</p>
            <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
              <p className="text-white font-bold text-lg">⭐ {posPercent}% of PropertyAIgency users rate their experience positively</p>
              <p className="text-gray-400 text-xs mt-1">Based on {feedback.length} verified user responses — {new Date().toLocaleDateString('en-ZA', { month: 'long', year: 'numeric' })}</p>
            </div>
            <p className="text-gray-500 text-xs mt-3">Ask your Marketing AI to create content using this data</p>
          </div>
        )}

        {/* Filters */}
        <div className="flex gap-3 mb-6 flex-wrap">
          <div className="flex gap-2">
            {(['all', 'positive', 'neutral', 'negative'] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition ${
                  filter === f ? 'bg-orange-500 text-black' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
                {f !== 'all' && ` (${feedback.filter(fb => fb.sentiment === f).length})`}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            {(['all', 'buyer', 'agent'] as const).map(u => (
              <button key={u} onClick={() => setUserFilter(u)}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition ${
                  userFilter === u ? 'bg-gray-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}>
                {u.charAt(0).toUpperCase() + u.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Feedback list */}
        <div className="space-y-4">
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-gray-400">No feedback matching this filter</div>
          ) : (
            filtered.map((f: any) => (
              <div key={f.id} className="bg-gray-800 rounded-2xl p-5 border border-gray-700">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex gap-2">
                    <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                      f.sentiment === 'positive' ? 'bg-green-900 text-green-300' :
                      f.sentiment === 'negative' ? 'bg-red-900 text-red-300' :
                      'bg-gray-600 text-gray-300'
                    }`}>{f.sentiment || 'neutral'}</span>
                    <span className="text-xs font-bold px-3 py-1 rounded-full bg-gray-700 text-gray-300">
                      {f.user_type}
                    </span>
                  </div>
                  <span className="text-gray-500 text-xs">
                    {new Date(f.created_at).toLocaleDateString('en-ZA', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>
                <p className="text-gray-200">{f.feedback}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  )
}
