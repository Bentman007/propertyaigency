'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

interface SavedProperty {
  id: string
  title: string
  address: string
  suburb: string
  city: string
  price: number
  price_type: string
  bedrooms: number
  bathrooms: number
  photos: string[]
  has_pool: boolean
  has_solar: boolean
  has_gated_community: boolean
  has_24hr_security: boolean
  saved_at: string
  total_views: number
  price_trend: string
}

export default function SavedPage() {
  const [properties, setProperties] = useState<SavedProperty[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [aiSummaries, setAiSummaries] = useState<{[key: string]: string}>({})
  const [loadingSummary, setLoadingSummary] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { window.location.href = '/auth/login?next=/saved'; return }
      setUser(data.user)
      fetchSavedProperties(data.user.id)
    })
  }, [])

  const fetchSavedProperties = async (userId: string) => {
    const { data: saved } = await supabase
      .from('saved_properties')
      .select('property_id, saved_at')
      .eq('user_id', userId)
      .order('saved_at', { ascending: false })

    if (!saved || saved.length === 0) { setLoading(false); return }

    const { data: props } = await supabase
      .from('properties')
      .select('*')
      .in('id', saved.map(s => s.property_id))
      .in('status', ['active', 'under_offer'])

    const { data: views } = await supabase
      .from('property_views')
      .select('property_id')
      .in('property_id', saved.map(s => s.property_id))

    const withStats = props?.map(p => {
      const savedRecord = saved.find(s => s.property_id === p.id)
      const viewCount = views?.filter(v => v.property_id === p.id).length || 0
      return {
        ...p,
        saved_at: savedRecord?.saved_at,
        total_views: viewCount
      }
    }) || []

    // Sort by most recently saved first
    withStats.sort((a, b) => new Date(b.saved_at).getTime() - new Date(a.saved_at).getTime())

    // Sort by most recently saved first
    withStats.sort((a, b) => new Date(b.saved_at).getTime() - new Date(a.saved_at).getTime())

    setProperties(withStats)
    setLoading(false)
  }

  const handleUnsave = async (propertyId: string) => {
    if (!user) return
    await supabase
      .from('saved_properties')
      .delete()
      .eq('user_id', user.id)
      .eq('property_id', propertyId)
    setProperties(prev => prev.filter(p => p.id !== propertyId))
  }

  const getAiSummary = async (property: SavedProperty, viewerType: string = 'buyer') => {
    setLoadingSummary(property.id)
    try {
      const response = await fetch('/api/property-insight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          viewer_type: viewerType,
          title: property.title,
          price: property.price,
          price_type: property.price_type,
          suburb: property.suburb,
          city: property.city,
          views: property.total_views,
          unique_viewers: property.total_views,
          return_viewers: 0,
          avg_time_seconds: 0,
          enquiries: 0,
          heat_score: Math.min(100, property.total_views * 10),
          days_listed: Math.round((Date.now() - new Date(property.saved_at).getTime()) / (1000 * 60 * 60 * 24))
        })
      })
      const data = await response.json()
      setAiSummaries(prev => ({ ...prev, [property.id]: data.insight }))
    } catch (e) {}
    setLoadingSummary(null)
  }

  const formatPrice = (price: number, type: string) => `R ${price?.toLocaleString()}${type === 'rent' ? '/mo' : ''}`
  
  const getViewsLabel = (views: number) => {
    if (views >= 20) return { label: `🔥 ${views} people viewing`, color: 'text-red-400' }
    if (views >= 10) return { label: `⚡ ${views} people viewing`, color: 'text-yellow-400' }
    if (views >= 3) return { label: `👀 ${views} people viewing`, color: 'text-blue-400' }
    return { label: `${views} views so far`, color: 'text-stone-500' }
  }

  if (loading) return (
    <main className="min-h-screen bg-stone-50 flex items-center justify-center">
      <div className="text-orange-500 text-xl">Loading your saved properties...</div>
    </main>
  )

  return (
    <main className="min-h-screen bg-stone-50 text-stone-900">
      <nav className="bg-white border-b border-stone-300 px-6 py-4 flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold">
          Property<span className="text-orange-500">AI</span>gency
        </Link>
        <div className="flex gap-4 items-center">
          <Link href="/search" className="text-stone-700 hover:text-orange-500 text-sm">🔍 AI Search</Link>
          <Link href="/dashboard" className="text-stone-700 hover:text-orange-500 text-sm">My Dashboard</Link>
          <button
            onClick={() => supabase.auth.signOut().then(() => window.location.href = '/')}
            className="text-stone-500 hover:text-stone-900 text-sm"
          >
            Sign Out
          </button>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Saved Properties</h1>
            <p className="text-stone-500 mt-1">Properties you love — with live market insights</p>
          </div>
          <Link href="/search" className="bg-orange-500 text-black px-4 py-2 rounded-lg font-semibold hover:bg-orange-400 text-sm">
            + Find More
          </Link>
        </div>

        {properties.length === 0 ? (
          <div className="text-center py-24">
            <p className="text-6xl mb-4">💾</p>
            <h2 className="text-2xl font-bold mb-2">No saved properties yet</h2>
            <p className="text-stone-500 mb-6">Use AI Search to find properties and save the ones you love</p>
            <Link href="/search" className="bg-orange-500 text-black px-8 py-3 rounded-lg font-bold hover:bg-orange-400">
              Start AI Search
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {properties.map(property => {
              const viewsInfo = getViewsLabel(property.total_views)
              return (
                <div key={property.id} className="bg-white rounded-2xl border border-stone-300 overflow-hidden">
                  <div className="flex">
                    {/* Photo */}
                    <div className="w-48 h-48 bg-stone-100 flex-shrink-0">
                      {property.photos?.[0] ? (
                        <img src={property.photos[0]} alt={property.title} className="w-full h-full object-cover"/>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-4xl">🏠</div>
                      )}
                    </div>

                    <div className="flex-1 p-5">
                      <div className="flex justify-between items-start">
                        <div>
                          <h2 className="text-xl font-bold">{property.title}</h2>
                          <p className="text-stone-500 text-sm">📍 {property.suburb}, {property.city}</p>
                          <p className="text-orange-500 font-bold text-xl mt-1">{formatPrice(property.price, property.price_type)}</p>
                        </div>
                        <div className="text-right">
                          <p className={`text-sm font-semibold ${viewsInfo.color}`}>{viewsInfo.label}</p>
                          <p className="text-stone-400 text-xs mt-1">
                            Saved {new Date(property.saved_at).toLocaleDateString('en-ZA')}
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-3 text-stone-500 text-xs mt-3">
                        <span>🛏 {property.bedrooms} beds</span>
                        <span>🚿 {property.bathrooms} baths</span>
                        {property.has_pool && <span>🏊 Pool</span>}
                        {property.has_solar && <span>☀️ Solar</span>}
                        {property.has_gated_community && <span>🔒 Gated</span>}
                        {property.has_24hr_security && <span>🛡 24hr Security</span>}
                      </div>

                      <div className="flex gap-2 mt-4">
                        <Link href={`/property/${property.id}`}
                          className="px-4 py-2 bg-orange-500 hover:bg-orange-400 text-black rounded-lg text-sm font-semibold">
                          View Property
                        </Link>
                        <button
                          onClick={() => getAiSummary(property, 'buyer')}
                          disabled={loadingSummary === property.id}
                          className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg text-sm disabled:opacity-50"
                        >
                          {loadingSummary === property.id ? '⟳ Analysing...' : '🤖 AI Insight'}
                        </button>
                        <button
                          onClick={() => handleUnsave(property.id)}
                          className="px-4 py-2 border border-stone-300 hover:border-red-500 hover:text-red-400 text-stone-500 rounded-lg text-sm"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>

                  {aiSummaries[property.id] && (
                    <div className="border-t border-stone-300 px-5 py-4 flex gap-3">
                      <span className="text-2xl">🤖</span>
                      <p className="text-stone-700 text-sm leading-relaxed">{aiSummaries[property.id]}</p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}
