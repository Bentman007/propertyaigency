'use client'

import { useEffect } from 'react'

export default function ViewTracker({ propertyId }: { propertyId: string }) {
  useEffect(() => {
    // Generate or get session ID
    let sessionId = sessionStorage.getItem('session_id')
    if (!sessionId) {
      sessionId = Math.random().toString(36).substring(2) + Date.now().toString(36)
      sessionStorage.setItem('session_id', sessionId)
    }

    const startTime = Date.now()

    // Track initial view after 3 seconds (confirms real visit)
    const initialTimer = setTimeout(() => {
      fetch('/api/track-view', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          property_id: propertyId,
          session_id: sessionId,
          time_spent: 3
        })
      })
    }, 3000)

    // Update time spent when user leaves
    const handleUnload = () => {
      const timeSpent = Math.round((Date.now() - startTime) / 1000)
      navigator.sendBeacon('/api/track-view', JSON.stringify({
        property_id: propertyId,
        session_id: sessionId,
        time_spent: timeSpent
      }))
    }

    // Update every 30 seconds while they're on the page
    const interval = setInterval(() => {
      const timeSpent = Math.round((Date.now() - startTime) / 1000)
      fetch('/api/track-view', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          property_id: propertyId,
          session_id: sessionId,
          time_spent: timeSpent
        })
      })
    }, 30000)

    window.addEventListener('beforeunload', handleUnload)

    return () => {
      clearTimeout(initialTimer)
      clearInterval(interval)
      window.removeEventListener('beforeunload', handleUnload)
    }
  }, [propertyId])

  return null
}
