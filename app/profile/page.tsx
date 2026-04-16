'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [form, setForm] = useState({
    full_name: '',
    agency_name: '',
    phone: '',
    whatsapp: '',
    bio: ''
  })

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) { window.location.href = '/auth/login'; return }
      setUser(data.user)
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single()
      if (profile) {
        setForm({
          full_name: profile.full_name || data.user.user_metadata?.full_name || '',
          agency_name: profile.agency_name || '',
          phone: profile.phone || '',
          whatsapp: profile.whatsapp || '',
          bio: profile.bio || ''
        })
      }
      setLoading(false)
    })
  }, [])

  const handleSave = async () => {
    setSaving(true)
    const { error } = await supabase.from('profiles').upsert({
      id: user.id,
      ...form,
      updated_at: new Date().toISOString()
    })
    if (error) setMessage('Error: ' + error.message)
    else setMessage('✅ Profile updated!')
    setSaving(false)
    setTimeout(() => setMessage(''), 3000)
  }

  const update = (field: string, value: string) => setForm(p => ({ ...p, [field]: value }))

  if (loading) return (
    <main className="min-h-screen bg-gray-900 flex items-center justify-center">
      <p className="text-orange-500 animate-pulse">Loading profile...</p>
    </main>
  )

  return (
    <main className="min-h-screen bg-gray-900 text-white">
      <nav className="bg-gray-800 border-b border-gray-700 px-6 py-4 flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold">
          Property<span className="text-orange-500">AI</span>gency
        </Link>
        <Link href="/dashboard" className="text-gray-400 hover:text-white text-sm">← Back to Dashboard</Link>
      </nav>

      <div className="max-w-2xl mx-auto px-6 py-10 space-y-6">
        <h1 className="text-2xl font-bold">👤 My Profile</h1>

        {message && (
          <div className={`p-4 rounded-xl ${message.includes('Error') ? 'bg-red-900 text-red-300' : 'bg-green-900 text-green-300'}`}>
            {message}
          </div>
        )}

        <div className="bg-gray-800 rounded-2xl border border-gray-700 p-6 space-y-4">
          <h2 className="text-lg font-bold text-orange-500">Personal Details</h2>
          <div>
            <label className="text-gray-400 text-sm mb-1 block">Full Name</label>
            <input value={form.full_name} onChange={e => update('full_name', e.target.value)}
              className="w-full bg-gray-700 text-white rounded-lg px-4 py-3 outline-none border border-gray-600 focus:border-orange-500"
              placeholder="Your full name"/>
          </div>
          <div>
            <label className="text-gray-400 text-sm mb-1 block">Phone</label>
            <input value={form.phone} onChange={e => update('phone', e.target.value)}
              className="w-full bg-gray-700 text-white rounded-lg px-4 py-3 outline-none border border-gray-600 focus:border-orange-500"
              placeholder="+27 82 123 4567"/>
          </div>
        </div>

        <div className="bg-gray-800 rounded-2xl border border-gray-700 p-6 space-y-4">
          <h2 className="text-lg font-bold text-orange-500">Agency Details</h2>
          <div>
            <label className="text-gray-400 text-sm mb-1 block">Agency Name</label>
            <input value={form.agency_name} onChange={e => update('agency_name', e.target.value)}
              className="w-full bg-gray-700 text-white rounded-lg px-4 py-3 outline-none border border-gray-600 focus:border-orange-500"
              placeholder="Pam Golding, RE/MAX, Private Seller etc."/>
          </div>
          <div>
            <label className="text-gray-400 text-sm mb-1 block">Bio / About</label>
            <textarea value={form.bio} onChange={e => update('bio', e.target.value)}
              rows={3}
              className="w-full bg-gray-700 text-white rounded-lg px-4 py-3 outline-none border border-gray-600 focus:border-orange-500"
              placeholder="Tell buyers a bit about yourself..."/>
          </div>
        </div>

        <button onClick={handleSave} disabled={saving}
          className="w-full bg-orange-500 hover:bg-orange-400 text-black font-bold py-4 rounded-xl text-lg disabled:opacity-50 transition">
          {saving ? 'Saving...' : '💾 Save Profile'}
        </button>
      </div>
    </main>
  )
}
