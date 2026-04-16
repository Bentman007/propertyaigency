'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import AvailabilityManager from '@/components/AvailabilityManager'
import ConversationsList from '@/components/ConversationsList'
import PushNotifications from '@/components/PushNotifications'
import ViewingBookings from '@/components/ViewingBookings'

interface PropertyWithStats {
  id: string
  title: string
  address: string
  suburb: string
  city: string
  price: number
  price_type: string
  photos: string[]
  created_at: string
  views: number
  unique_viewers: number
  return_viewers: number
  avg_time_seconds: number
  enquiries: number
  heat_score: number
  status: string
}

export default function DashboardPage() {
  const [properties, setProperties] = useState<PropertyWithStats[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [aiInsights, setAiInsights] = useState<{[key: string]: string}>({})
  const [loadingInsight, setLoadingInsight] = useState<string | null>(null)

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser()
      if (!data.user) {
        window.location.href = '/auth/login?next=/dashboard'
        return
      }
      setUser(data.user)
      fetchProperties(data.user.id)
      // Fetch profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single()
      if (profileData) {
        setProfile(profileData)
      } else {
        // Use auth metadata as fallback
        setProfile({
          full_name: data.user.user_metadata?.full_name || data.user.email?.split('@')[0],
          agency_name: data.user.user_metadata?.agency_name || null
        })
      }
    }
    getUser()
  }, [])

  const fetchProperties = async (userId: string) => {
    const { data: props } = await supabase
      .from('properties')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (!props) { setLoading(false); return }

    const { data: views } = await supabase
      .from('property_views')
      .select('property_id, viewer_session, time_spent_seconds')
      .in('property_id', props.map(p => p.id))

    const { data: enquiries } = await supabase
      .from('property_enquiries')
      .select('property_id')
      .in('property_id', props.map(p => p.id))

    const withStats = props.map(p => {
      const pViews = views?.filter(v => v.property_id === p.id) || []
      const sessions = [...new Set(pViews.map(v => v.viewer_session))]
      const returnViewers = sessions.filter(s => 
        pViews.filter(v => v.viewer_session === s).length > 1
      ).length
      const avgTime = pViews.length > 0 
        ? Math.round(pViews.reduce((a, v) => a + v.time_spent_seconds, 0) / pViews.length)
        : 0
      const pEnquiries = enquiries?.filter(e => e.property_id === p.id).length || 0
      
      // Heat score: weighted combination of views, time, return visits, enquiries
      const heatScore = Math.min(100, Math.round(
        (pViews.length * 2) + 
        (returnViewers * 10) + 
        (avgTime / 3) + 
        (pEnquiries * 15)
      ))

      return {
        ...p,
        views: pViews.length,
        unique_viewers: sessions.length,
        return_viewers: returnViewers,
        avg_time_seconds: avgTime,
        enquiries: pEnquiries,
        heat_score: heatScore
      }
    })

    setProperties(withStats)
    setLoading(false)
  }

  const updateStatus = async (propertyId: string, status: string) => {
    await supabase.from('properties').update({ status }).eq('id', propertyId)
    setProperties(prev => prev.map(p => p.id === propertyId ? { ...p, status } : p))
  }

  const getAiInsight = async (property: PropertyWithStats) => {
    setLoadingInsight(property.id)
    try {
      const response = await fetch('/api/property-insight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: property.title,
          price: property.price,
          price_type: property.price_type,
          suburb: property.suburb,
          city: property.city,
          views: property.views,
          unique_viewers: property.unique_viewers,
          return_viewers: property.return_viewers,
          avg_time_seconds: property.avg_time_seconds,
          enquiries: property.enquiries,
          heat_score: property.heat_score,
          days_listed: Math.round((Date.now() - new Date(property.created_at).getTime()) / (1000 * 60 * 60 * 24))
        })
      })
      const data = await response.json()
      setAiInsights(prev => ({ ...prev, [property.id]: data.insight }))
    } catch (e) {
      setAiInsights(prev => ({ ...prev, [property.id]: 'Could not load insight.' }))
    }
    setLoadingInsight(null)
  }

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`
    return `${Math.round(seconds / 60)}m ${seconds % 60}s`
  }

  const getHeatColor = (score: number) => {
    if (score >= 70) return 'text-green-400 bg-green-900'
    if (score >= 40) return 'text-yellow-400 bg-yellow-900'
    return 'text-red-400 bg-red-900'
  }

  const getHeatLabel = (score: number) => {
    if (score >= 70) return '🔥 Hot'
    if (score >= 40) return '⚡ Active'
    return '❄️ Cold'
  }

  if (loading) return (
    <main className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="text-orange-500 text-xl">Loading your dashboard...</div>
    </main>
  )

  return (
    <main className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <nav className="bg-gray-800 border-b border-gray-700 px-6 py-4 flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold">
          Property<span className="text-orange-500">AI</span>gency
        </Link>
        <div className="flex gap-4 items-center">
          <Link href="/list" className="bg-orange-500 text-black px-4 py-2 rounded-lg font-semibold hover:bg-orange-400 text-sm">
            + New Listing
          </Link>
          <Link href="/profile" className="text-gray-400 hover:text-white text-sm">
            👤 Profile
          </Link>
          <button 
            onClick={() => supabase.auth.signOut().then(() => window.location.href = '/')}
            className="text-gray-400 hover:text-white text-sm"
          >
            Sign Out
          </button>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="mb-6">
          <PushNotifications />
        </div>
        <div className="mb-8 flex justify-between items-start">
          <div>
            <p className="text-gray-400 text-sm mb-1">Welcome back 👋</p>
            <h1 className="text-3xl font-bold">
              {profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'My Dashboard'}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              {profile?.agency_name && (
                <span className="text-orange-500 text-sm font-semibold">{profile.agency_name}</span>
              )}
              {profile?.agency_name && <span className="text-gray-600">·</span>}
              <span className="text-gray-400 text-sm">{user?.email}</span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-gray-500 text-xs">Last updated</p>
            <p className="text-gray-300 text-sm">{new Date().toLocaleDateString('en-ZA', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
          </div>
        </div>

        {/* Summary Stats */}
        {properties.length > 0 && (
          <div className="grid grid-cols-4 gap-4 mb-8">
            <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
              <p className="text-gray-400 text-sm">Total Listings</p>
              <p className="text-3xl font-bold text-white mt-1">{properties.length}</p>
            </div>
            <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
              <p className="text-gray-400 text-sm">Total Views</p>
              <p className="text-3xl font-bold text-orange-500 mt-1">{properties.reduce((a, p) => a + p.views, 0)}</p>
            </div>
            <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
              <p className="text-gray-400 text-sm">Total Enquiries</p>
              <p className="text-3xl font-bold text-green-400 mt-1">{properties.reduce((a, p) => a + p.enquiries, 0)}</p>
            </div>
            <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
              <p className="text-gray-400 text-sm">Hot Listings</p>
              <p className="text-3xl font-bold text-yellow-400 mt-1">{properties.filter(p => p.heat_score >= 70).length}</p>
            </div>
          </div>
        )}

        {/* Listings */}
        {properties.length === 0 ? (
          <div className="text-center py-24">
            <p className="text-6xl mb-4">🏠</p>
            <h2 className="text-2xl font-bold mb-2">No listings yet</h2>
            <p className="text-gray-400 mb-6">Create your first property listing to get started</p>
            <Link href="/list" className="bg-orange-500 text-black px-8 py-3 rounded-lg font-bold hover:bg-orange-400">
              List My Property
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {properties.map(property => (
              <div key={property.id} className="bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden">
                <div className="flex">
                  {/* Photo */}
                  <div className="w-48 h-48 bg-gray-700 flex-shrink-0">
                    {property.photos?.[0] ? (
                      <img src={property.photos[0]} alt={property.title} className="w-full h-full object-cover"/>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-4xl">🏠</div>
                    )}
                  </div>

                  {/* Main content */}
                  <div className="flex-1 p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <div className="flex items-center gap-3 mb-1 flex-wrap">
                          <h2 className="text-xl font-bold">{property.title}</h2>
                          <span className={`text-xs px-2 py-1 rounded-full font-bold ${getHeatColor(property.heat_score)}`}>
                            {getHeatLabel(property.heat_score)} {property.heat_score}
                          </span>
                        </div>
                        <p className="text-gray-400 text-sm">📍 {property.address}, {property.suburb}, {property.city}</p>
                        <p className="text-orange-500 font-bold mt-1">
                          R {property.price?.toLocaleString()} {property.price_type === 'rent' ? '/mo' : ''}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Link href={`/property/${property.id}`} 
                          className="text-sm bg-gray-700 hover:bg-gray-600 px-3 py-1.5 rounded-lg">
                          View Listing
                        </Link>
                        <Link href={`/list/edit/${property.id}`}
                          className="text-sm bg-orange-500 hover:bg-orange-400 text-black px-3 py-1.5 rounded-lg font-semibold">
                          Edit
                        </Link>
                        {property.status === 'active' && (
                          <button onClick={() => updateStatus(property.id, 'under_offer')}
                            className="text-sm bg-yellow-600 hover:bg-yellow-500 text-white px-3 py-1.5 rounded-lg">
                            🟡 Under Offer
                          </button>
                        )}
                        {(property.status === 'active' || property.status === 'under_offer') && (
                          <button onClick={() => updateStatus(property.id, 'sold')}
                            className="text-sm bg-red-700 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg">
                            🔴 Mark Sold/Rented
                          </button>
                        )}
                        {property.status !== 'active' && (
                          <button onClick={() => updateStatus(property.id, 'active')}
                            className="text-sm bg-green-700 hover:bg-green-600 text-white px-3 py-1.5 rounded-lg">
                            🟢 Re-activate
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-5 gap-3">
                      <div className="bg-gray-700 rounded-lg p-3 text-center">
                        <p className="text-2xl font-bold text-white">{property.views}</p>
                        <p className="text-gray-400 text-xs mt-1">Total Views</p>
                      </div>
                      <div className="bg-gray-700 rounded-lg p-3 text-center">
                        <p className="text-2xl font-bold text-blue-400">{property.unique_viewers}</p>
                        <p className="text-gray-400 text-xs mt-1">Unique Visitors</p>
                      </div>
                      <div className="bg-gray-700 rounded-lg p-3 text-center">
                        <p className="text-2xl font-bold text-purple-400">{property.return_viewers}</p>
                        <p className="text-gray-400 text-xs mt-1">Return Visitors</p>
                      </div>
                      <div className="bg-gray-700 rounded-lg p-3 text-center">
                        <p className="text-2xl font-bold text-yellow-400">{formatTime(property.avg_time_seconds)}</p>
                        <p className="text-gray-400 text-xs mt-1">Avg Time</p>
                      </div>
                      <div className="bg-gray-700 rounded-lg p-3 text-center">
                        <p className="text-2xl font-bold text-green-400">{property.enquiries}</p>
                        <p className="text-gray-400 text-xs mt-1">Enquiries</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* AI Insight Panel */}
                <div className="border-t border-gray-700 px-6 py-4">
                  {aiInsights[property.id] ? (
                    <div className="flex gap-3">
                      <span className="text-2xl">🤖</span>
                      <p className="text-gray-300 text-sm leading-relaxed">{aiInsights[property.id]}</p>
                    </div>
                  ) : (
                    <button
                      onClick={() => getAiInsight(property)}
                      disabled={loadingInsight === property.id}
                      className="flex items-center gap-2 text-sm text-orange-500 hover:text-orange-400 font-semibold disabled:opacity-50"
                    >
                      {loadingInsight === property.id ? (
                        <><span className="animate-spin">⟳</span> Analysing your listing...</>
                      ) : (
                        <><span>🤖</span> Get AI Performance Insight</>
                      )}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {user && (
        <div className="max-w-6xl mx-auto px-6 pb-8 grid grid-cols-2 gap-6 mt-6">
          <AvailabilityManager agentId={user.id} />
          <ConversationsList agentId={user.id} />
          <ViewingBookings agentId={user.id} />
        </div>
      )}
    </main>
  )
}
