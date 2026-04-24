'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function ListLayout({ children }: { children: React.ReactNode }) {
  const [checking, setChecking] = useState(true)
  const [authed, setAuthed] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setAuthed(true)
      } else {
        window.location.href = '/auth/login?next=/list'
      }
      setChecking(false)
    })
  }, [])

  if (checking) return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center">
      <div className="text-stone-900 text-center">
        <div className="text-4xl mb-4">🏠</div>
        <p className="text-stone-500">Checking your account...</p>
      </div>
    </div>
  )

  if (!authed) return null
  return <>{children}</>
}
