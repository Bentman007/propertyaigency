'use client'

import { useState, useEffect } from 'react'

export default function MobileBanner() {
  const [show, setShow] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    // Only show on mobile browsers, not in standalone app mode
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
    const wasDismissed = localStorage.getItem('pwa-banner-dismissed')
    const iOS = /iPhone|iPad|iPod/i.test(navigator.userAgent)
    
    setIsIOS(iOS)
    
    if (isMobile && !isStandalone && !wasDismissed) {
      setShow(true)
    }
  }, [])

  const dismiss = () => {
    localStorage.setItem('pwa-banner-dismissed', 'true')
    setShow(false)
    setDismissed(true)
  }

  if (!show || dismissed) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-stone-50 border-t border-orange-500 px-4 py-4 shadow-2xl">
      <div className="flex items-start gap-3 max-w-lg mx-auto">
        <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center text-black font-bold text-lg flex-shrink-0">
          P<span className="text-xs">AI</span>
        </div>
        <div className="flex-1">
          <p className="font-bold text-stone-900 text-sm">Get the PropertyAIgency App</p>
          <p className="text-stone-500 text-xs mt-0.5">
            {isIOS 
              ? 'Tap Share → "Add to Home Screen" for the best experience'
              : 'Tap the menu → "Add to Home Screen" for the best experience'}
          </p>
          <div className="flex gap-2 mt-2">
            {isIOS ? (
              <div className="flex items-center gap-1 text-xs text-orange-400">
                <span>Tap</span>
                <span className="bg-stone-100 px-2 py-0.5 rounded text-stone-900">Share ↑</span>
                <span>then</span>
                <span className="bg-stone-100 px-2 py-0.5 rounded text-stone-900">Add to Home Screen</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-xs text-orange-400">
                <span>Tap</span>
                <span className="bg-stone-100 px-2 py-0.5 rounded text-stone-900">⋮ Menu</span>
                <span>then</span>
                <span className="bg-stone-100 px-2 py-0.5 rounded text-stone-900">Add to Home Screen</span>
              </div>
            )}
          </div>
        </div>
        <button onClick={dismiss} className="text-stone-400 hover:text-stone-900 text-lg leading-none flex-shrink-0">✕</button>
      </div>
    </div>
  )
}
