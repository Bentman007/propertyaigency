'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function PushNotifications() {
  const [supported, setSupported] = useState(false)
  const [subscribed, setSubscribed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    setSupported('serviceWorker' in navigator && 'PushManager' in window)
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user)
      if (data.user) checkSubscription(data.user.id)
    })
  }, [])

  const checkSubscription = async (userId: string) => {
    if (!('serviceWorker' in navigator)) return
    const reg = await navigator.serviceWorker.ready
    const sub = await reg.pushManager.getSubscription()
    setSubscribed(!!sub)
  }

  const subscribe = async () => {
    if (!user) return
    setLoading(true)
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!)
      })

      await fetch('/api/push', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id, subscription: sub.toJSON() })
      })

      setSubscribed(true)
    } catch (err) {
      console.error('Push subscription failed:', err)
    }
    setLoading(false)
  }

  const unsubscribe = async () => {
    setLoading(true)
    const reg = await navigator.serviceWorker.ready
    const sub = await reg.pushManager.getSubscription()
    if (sub) await sub.unsubscribe()
    setSubscribed(false)
    setLoading(false)
  }

  if (!supported || !user) return null

  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${
      subscribed ? 'bg-green-900 border-green-700' : 'bg-gray-700 border-gray-600'
    }`}>
      <span className="text-xl">{subscribed ? '🔔' : '🔕'}</span>
      <div className="flex-1">
        <p className="text-sm font-semibold">
          {subscribed ? 'Notifications enabled' : 'Enable notifications'}
        </p>
        <p className="text-xs text-gray-400">
          {subscribed 
            ? 'You\'ll be notified of viewings and messages' 
            : 'Get instant alerts for bookings and messages'}
        </p>
      </div>
      <button
        onClick={subscribed ? unsubscribe : subscribe}
        disabled={loading}
        className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition disabled:opacity-50 ${
          subscribed 
            ? 'bg-green-700 hover:bg-green-600 text-white' 
            : 'bg-orange-500 hover:bg-orange-400 text-black'
        }`}
      >
        {loading ? '...' : subscribed ? 'Disable' : 'Enable'}
      </button>
    </div>
  )
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}
