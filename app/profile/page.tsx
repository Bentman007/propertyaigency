'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [accountType, setAccountType] = useState('buyer')
  const [newEmail, setNewEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [securityMessage, setSecurityMessage] = useState('')
  const [savingSecurity, setSavingSecurity] = useState(false)

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
      setAccountType(data.user.user_metadata?.account_type || 'buyer')
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

  const handleEmailChange = async () => {
    if (!newEmail.trim()) return
    setSavingSecurity(true)
    const { error } = await supabase.auth.updateUser({ email: newEmail })
    if (error) setSecurityMessage('Error: ' + error.message)
    else setSecurityMessage('✅ Confirmation email sent to ' + newEmail + '. Check your inbox!')
    setSavingSecurity(false)
    setNewEmail('')
    setTimeout(() => setSecurityMessage(''), 5000)
  }

  const handlePasswordChange = async () => {
    if (!newPassword || !confirmPassword) return
    if (newPassword !== confirmPassword) {
      setSecurityMessage('Error: Passwords do not match')
      return
    }
    if (newPassword.length < 8) {
      setSecurityMessage('Error: Password must be at least 8 characters')
      return
    }
    setSavingSecurity(true)
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) setSecurityMessage('Error: ' + error.message)
    else setSecurityMessage('✅ Password updated successfully!')
    setSavingSecurity(false)
    setNewPassword('')
    setConfirmPassword('')
    setTimeout(() => setSecurityMessage(''), 5000)
  }

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
    <main className="min-h-screen bg-stone-50 flex items-center justify-center">
      <p className="text-orange-500 animate-pulse">Loading profile...</p>
    </main>
  )

  return (
    <main className="min-h-screen bg-stone-50 text-stone-900">
      <nav className="bg-white border-b border-stone-300 px-6 py-4 flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold">
          Property<span className="text-orange-500">AI</span>gency
        </Link>
        <Link href="/dashboard" className="text-stone-500 hover:text-stone-900 text-sm">← Back to Dashboard</Link>
      </nav>

      <div className="max-w-2xl mx-auto px-6 py-10 space-y-6">
        <h1 className="text-2xl font-bold">👤 My Profile</h1>

        {message && (
          <div className={`p-4 rounded-xl ${message.includes('Error') ? 'bg-red-900 text-red-300' : 'bg-green-900 text-green-300'}`}>
            {message}
          </div>
        )}

        <div className="bg-white rounded-2xl border border-stone-300 p-6 space-y-4">
          <h2 className="text-lg font-bold text-orange-500">Personal Details</h2>
          <div>
            <label className="text-stone-500 text-sm mb-1 block">Full Name</label>
            <input value={form.full_name} onChange={e => update('full_name', e.target.value)}
              className="w-full bg-stone-100 text-stone-800 rounded-lg px-4 py-3 outline-none border border-stone-300 focus:border-orange-500"
              placeholder="Your full name"/>
          </div>
          <div>
            <label className="text-stone-500 text-sm mb-1 block">Phone</label>
            <input value={form.phone} onChange={e => update('phone', e.target.value)}
              className="w-full bg-stone-100 text-stone-800 rounded-lg px-4 py-3 outline-none border border-stone-300 focus:border-orange-500"
              placeholder="+27 82 123 4567"/>
          </div>
        </div>

        {accountType === 'agent' && (
        <div className="bg-white rounded-2xl border border-stone-300 p-6 space-y-4">
          <h2 className="text-lg font-bold text-orange-500">Agency Details</h2>
          <div>
            <label className="text-stone-500 text-sm mb-1 block">Agency Name</label>
            <input value={form.agency_name} onChange={e => update('agency_name', e.target.value)}
              className="w-full bg-stone-100 text-stone-800 rounded-lg px-4 py-3 outline-none border border-stone-300 focus:border-orange-500"
              placeholder="Pam Golding, RE/MAX, Private Seller etc."/>
          </div>
          <div>
            <label className="text-stone-500 text-sm mb-1 block">Bio / About</label>
            <textarea value={form.bio} onChange={e => update('bio', e.target.value)}
              rows={3}
              className="w-full bg-stone-100 text-stone-800 rounded-lg px-4 py-3 outline-none border border-stone-300 focus:border-orange-500"
              placeholder="Tell buyers a bit about yourself..."/>
          </div>
        </div>
        )}

        <button onClick={handleSave} disabled={saving}
          className="w-full bg-orange-500 hover:bg-orange-400 text-black font-bold py-4 rounded-xl text-lg disabled:opacity-50 transition">
          {saving ? 'Saving...' : '💾 Save Profile'}
        </button>

        {/* Security Settings */}
        <div className="bg-white rounded-2xl border border-stone-300 p-6 space-y-4">
          <h2 className="text-lg font-bold text-orange-500">🔐 Security Settings</h2>
          
          {securityMessage && (
            <div className={`p-3 rounded-xl text-sm ${securityMessage.includes('Error') ? 'bg-red-900 text-red-300' : 'bg-green-900 text-green-300'}`}>
              {securityMessage}
            </div>
          )}

          {/* Current email display */}
          <div>
            <label className="text-stone-500 text-sm mb-1 block">Current Email</label>
            <div className="w-full bg-stone-100 text-stone-500 rounded-lg px-4 py-3 border border-stone-300">
              {user?.email}
            </div>
          </div>

          {/* Change email */}
          <div>
            <label className="text-stone-500 text-sm mb-1 block">New Email Address</label>
            <div className="flex gap-3">
              <input value={newEmail} onChange={e => setNewEmail(e.target.value)}
                className="flex-1 bg-stone-100 text-stone-800 rounded-lg px-4 py-3 outline-none border border-stone-300 focus:border-orange-500"
                placeholder="new@email.com" type="email"/>
              <button onClick={handleEmailChange} disabled={savingSecurity || !newEmail.trim()}
                className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-5 py-3 rounded-lg disabled:opacity-50 transition text-sm">
                Update
              </button>
            </div>
            <p className="text-stone-400 text-xs mt-1">A confirmation link will be sent to your new email address</p>
          </div>

          {/* Change password */}
          <div>
            <label className="text-stone-500 text-sm mb-1 block">New Password</label>
            <input value={newPassword} onChange={e => setNewPassword(e.target.value)}
              className="w-full bg-stone-100 text-stone-800 rounded-lg px-4 py-3 outline-none border border-stone-300 focus:border-orange-500 mb-3"
              placeholder="Minimum 8 characters" type="password"/>
            <label className="text-stone-500 text-sm mb-1 block">Confirm New Password</label>
            <div className="flex gap-3">
              <input value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                className="flex-1 bg-stone-100 text-stone-800 rounded-lg px-4 py-3 outline-none border border-stone-300 focus:border-orange-500"
                placeholder="Repeat new password" type="password"/>
              <button onClick={handlePasswordChange} disabled={savingSecurity || !newPassword || !confirmPassword}
                className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-5 py-3 rounded-lg disabled:opacity-50 transition text-sm">
                Update
              </button>
            </div>
          </div>

          {/* Transfer credits note for agents */}
          {accountType === 'agent' && (
            <div className="bg-stone-100 rounded-xl p-4 border border-stone-300">
              <p className="text-stone-700 text-sm font-bold mb-1">🔄 Transferring Credits to a New Agent?</p>
              <p className="text-stone-500 text-sm">If you need to transfer your listing credits to a new team member, contact us at <span className="text-orange-500">admin@propertyaigency.co.za</span> and we will assist you promptly.</p>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
