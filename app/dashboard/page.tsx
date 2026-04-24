'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import AvailabilityManager from '@/components/AvailabilityManager'
import PropertyAIsistant from '@/components/PropertyAIsistant'
import PushNotifications from '@/components/PushNotifications'
import BookingsCalendar from '@/components/BookingsCalendar'

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
  featured: boolean
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
      // Redirect buyers to their dashboard
      const accountType = data.user.user_metadata?.account_type || 'buyer'
      if (accountType !== 'agent') {
        window.location.href = '/my-properties'
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

  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleteReason, setDeleteReason] = useState('')
  const [customReason, setCustomReason] = useState('')
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)

  const initiateDelete = (propertyId: string) => {
    setPendingDeleteId(propertyId)
    setShowDeleteModal(true)
    setDeleteReason('')
    setCustomReason('')
  }

  const confirmDelete = async () => {
    if (!pendingDeleteId) return
    setDeletingId(pendingDeleteId)

    // Save deletion reason to admin
    await supabase.from('aisistant_messages').insert({
      agent_id: 'a947747b-d98c-4d77-8647-c4dd930d3fe7',
      property_id: pendingDeleteId,
      message_type: 'listing_insight',
      title: '🗑️ Listing Deleted',
      content: `Agent deleted listing. Reason: ${deleteReason === 'Other reason' ? customReason || 'Other' : deleteReason || 'No reason provided'}`,
      is_read: false
    })

    // Notify saved buyers before deleting
    await fetch('/api/notify-saved-buyers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        property_id: pendingDeleteId,
        reason: deleteReason
      })
    })

    await supabase.from('properties').delete().eq('id', pendingDeleteId)
    setProperties(prev => prev.filter(p => p.id !== pendingDeleteId))
    setShowDeleteModal(false)
    setPendingDeleteId(null)
    setDeletingId(null)
    setDeleteReason('')
    setCustomReason('')
  }

  const toggleFeatured = async (propertyId: string, currentFeatured: boolean) => {
    await supabase.from('properties').update({ featured: !currentFeatured }).eq('id', propertyId)
    setProperties(prev => prev.map(p => p.id === propertyId ? { ...p, featured: !currentFeatured } : p))
  }

  const updateStatus = async (propertyId: string, status: string) => {
    await supabase.from('properties').update({ status }).eq('id', propertyId)
    setProperties(prev => prev.map(p => p.id === propertyId ? { ...p, status } : p))

    if (status === 'sold') {
      const property = properties.find(p => p.id === propertyId)

      // Notify all saved buyers
      const { data: saved } = await supabase
        .from('saved_properties')
        .select('user_id')
        .eq('property_id', propertyId)

      if (saved && saved.length > 0) {
        for (const s of saved) {
          await fetch('/api/push', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              user_id: s.user_id,
              title: '🏠 Property Update',
              body: `"${property?.title}" has been sold/rented. Shall we find you something similar?`,
              url: '/search'
            })
          })
        }
      }

      // Find the buyer with a confirmed viewing — nudge them to the marketplace
      const { data: bookings } = await supabase
        .from('viewing_bookings')
        .select('searcher_id')
        .eq('property_id', propertyId)
        .eq('status', 'confirmed')
        .order('created_at', { ascending: false })
        .limit(1)

      if (bookings && bookings.length > 0) {
        const buyerId = bookings[0].searcher_id

        // Unlock moving services for this buyer
        await supabase
          .from('profiles')
          .update({ has_moving_access: true })
          .eq('id', buyerId)

        // Congratulations push notification
        await fetch('/api/push', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: buyerId,
            title: '🎉 Congratulations on your new home!',
            body: 'Your offer has been accepted! We have unlocked Moving Services for you — get quotes from trusted suppliers in your area.',
            url: '/moving'
          })
        })

        // Drop a message into their AI Concierge
        await fetch('/api/marketplace-nudge', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: buyerId,
            property_title: property?.title,
            property_address: `${property?.suburb}, ${property?.city}`,
          })
        })
      }
    }
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

  const getStatusBadgeColor = (status: string) => {
    if (status === 'active') return 'bg-green-500'
    if (status === 'under_offer') return 'bg-yellow-500'
    if (status === 'sold') return 'bg-red-500'
    if (status === 'draft') return 'bg-gray-500'
    return 'bg-gray-500'
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
    <main className="min-h-screen bg-stone-50 flex items-center justify-center">
      <div className="text-orange-500 text-xl">Loading your dashboard...</div>
    </main>
  )

  return (
    <main className="min-h-screen bg-gradient-to-b from-stone-100 to-stone-50 text-stone-900">
      {/* Header */}
      <nav className="bg-white border-b border-stone-300 px-4 md:px-6 py-4 flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold">
          Property<span className="text-orange-500">AI</span>gency
        </Link>
        <div className="flex gap-4 items-center">
          <Link href="/list" className="bg-orange-500 text-black px-4 py-2 rounded-lg font-semibold hover:bg-orange-400 text-sm">
            + New Listing
          </Link>
          <Link href="/bulk-upload" className="bg-stone-100 text-stone-900 px-4 py-2 rounded-lg font-semibold hover:bg-stone-200 text-sm">
            📦 Bulk Upload
          </Link>
          <Link href="/profile" className="text-stone-500 hover:text-stone-900 text-sm">
            👤 Profile
          </Link>
          <button 
            onClick={() => supabase.auth.signOut().then(() => window.location.href = '/')}
            className="text-stone-500 hover:text-stone-900 text-sm"
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
            <p className="text-stone-500 text-sm mb-1">Welcome back 👋</p>
            <h1 className="text-3xl font-bold">
              {profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'My Dashboard'}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              {profile?.agency_name && (
                <span className="text-orange-500 text-sm font-semibold">{profile.agency_name}</span>
              )}
              {profile?.agency_name && <span className="text-stone-400">·</span>}
              <span className="text-stone-500 text-sm">{user?.email}</span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-stone-400 text-xs">Last updated</p>
            <p className="text-stone-700 text-sm">{new Date().toLocaleDateString('en-ZA', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
          </div>
        </div>

        {/* Summary Stats */}
      {user && (
        <div className="max-w-6xl mx-auto px-6 mt-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <BookingsCalendar agentId={user.id} />
            <PropertyAIsistant agentId={user.id} />
          </div>
        </div>
      )}

        {properties.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
            <div className="bg-white rounded-xl p-4 border border-stone-300">
              <p className="text-stone-500 text-sm">Total Listings</p>
              <p className="text-3xl font-bold text-stone-900 mt-1">{properties.length}</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-stone-300">
              <p className="text-stone-500 text-sm">Total Views</p>
              <p className="text-3xl font-bold text-orange-500 mt-1">{properties.reduce((a, p) => a + p.views, 0)}</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-stone-300">
              <p className="text-stone-500 text-sm">Total Enquiries</p>
              <p className="text-3xl font-bold text-green-400 mt-1">{properties.reduce((a, p) => a + p.enquiries, 0)}</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-stone-300">
              <p className="text-stone-500 text-sm">Hot Listings</p>
              <p className="text-3xl font-bold text-yellow-400 mt-1">{properties.filter(p => p.heat_score >= 70).length}</p>
            </div>
          </div>
        )}

        {/* Listings */}
        {properties.length === 0 ? (
          <div className="text-center py-24">
            <p className="text-6xl mb-4">🏠</p>
            <h2 className="text-2xl font-bold mb-2">No listings yet</h2>
            <p className="text-stone-500 mb-6">Create your first property listing to get started</p>
            <Link href="/list" className="bg-orange-500 text-black px-8 py-3 rounded-lg font-bold hover:bg-orange-400">
              List My Property
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {properties.map(property => (
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
                        <p className="text-stone-500 text-sm">📍 {property.address}, {property.suburb}, {property.city}</p>
                        <p className="text-orange-500 font-bold mt-1">
                          R {property.price?.toLocaleString()} {property.price_type === 'rent' ? '/mo' : ''}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Link href={`/property/${property.id}`} 
                          className="text-sm bg-stone-100 hover:bg-stone-200 px-3 py-1.5 rounded-lg">
                          View Listing
                        </Link>
                        <Link href={`/list/edit/${property.id}`}
                          className="text-sm bg-orange-500 hover:bg-orange-400 text-black px-3 py-1.5 rounded-lg font-semibold">
                          Edit
                        </Link>
                        {property.status === 'draft' && (
                          <button onClick={() => updateStatus(property.id, 'active')}
                            className="text-sm bg-green-600 hover:bg-green-500 text-white px-3 py-1.5 rounded-lg font-bold animate-pulse">
                            ✅ Approve & Go Live
                          </button>
                        )}
                        {property.status === 'active' && (
                          <button onClick={() => updateStatus(property.id, 'under_offer')}
                            className="text-sm bg-yellow-600 hover:bg-yellow-500 text-stone-900 px-3 py-1.5 rounded-lg">
                            🟡 Under Offer
                          </button>
                        )}
                        {(property.status === 'active' || property.status === 'under_offer') && (
                          <button onClick={() => updateStatus(property.id, 'sold')}
                            className="text-sm bg-red-700 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg">
                            🔴 Mark Sold/Rented
                          </button>
                        )}
                        <button onClick={() => toggleFeatured(property.id, property.featured)}
                          className={`text-sm px-3 py-1.5 rounded-lg transition ${
                            property.featured 
                              ? 'bg-yellow-500 text-black hover:bg-yellow-400' 
                              : 'bg-stone-100 hover:bg-yellow-500 hover:text-black text-stone-700'
                          }`}>
                          {property.featured ? '⭐ Featured' : '☆ Mark Featured'}
                        </button>
                        <button onClick={() => initiateDelete(property.id)}
                          disabled={deletingId === property.id}
                          className="text-sm bg-stone-100 hover:bg-red-700 text-stone-500 hover:text-stone-900 px-3 py-1.5 rounded-lg transition">
                          🗑️ Delete
                        </button>
                        {property.status !== 'active' && (
                          <button onClick={() => updateStatus(property.id, 'active')}
                            className="text-sm bg-green-700 hover:bg-green-600 text-white px-3 py-1.5 rounded-lg">
                            🟢 Re-activate
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-3 md:grid-cols-5 gap-2 md:gap-3">
                      <div className="bg-stone-100 rounded-lg p-3 text-center">
                        <p className="text-2xl font-bold text-stone-900">{property.views}</p>
                        <p className="text-stone-500 text-xs mt-1">Total Views</p>
                      </div>
                      <div className="bg-stone-100 rounded-lg p-3 text-center">
                        <p className="text-2xl font-bold text-blue-400">{property.unique_viewers}</p>
                        <p className="text-stone-500 text-xs mt-1">Unique Visitors</p>
                      </div>
                      <div className="bg-stone-100 rounded-lg p-3 text-center">
                        <p className="text-2xl font-bold text-purple-400">{property.return_viewers}</p>
                        <p className="text-stone-500 text-xs mt-1">Return Visitors</p>
                      </div>
                      <div className="bg-stone-100 rounded-lg p-3 text-center">
                        <p className="text-2xl font-bold text-yellow-400">{formatTime(property.avg_time_seconds)}</p>
                        <p className="text-stone-500 text-xs mt-1">Avg Time</p>
                      </div>
                      <div className="bg-stone-100 rounded-lg p-3 text-center">
                        <p className="text-2xl font-bold text-green-400">{property.enquiries}</p>
                        <p className="text-stone-500 text-xs mt-1">Enquiries</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* AI Insight Panel */}
                <div className="border-t border-stone-300 px-6 py-4">
                  {aiInsights[property.id] ? (
                    <div className="flex gap-3">
                      <span className="text-2xl">🤖</span>
                      <p className="text-stone-700 text-sm leading-relaxed">{aiInsights[property.id]}</p>
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
        <div className="max-w-6xl mx-auto px-6 pb-8 mt-6">
          <AvailabilityManager agentId={user.id} />
        </div>
      )}
      {/* Delete confirmation modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 px-4">
          <div className="bg-white border border-stone-300 rounded-2xl p-6 max-w-md w-full" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-2">🗑️ Delete Listing</h3>
            <p className="text-stone-500 text-sm mb-4">This will permanently remove the listing. Please let us know why you are deleting it.</p>
            
            <div className="space-y-2 mb-4">
              {[
                'Property has been sold/rented privately',
                'Taking the property off the market',
                'Switching to a different platform',
                'Listing was created by mistake',
                'Other reason'
              ].map(reason => (
                <button key={reason} onClick={() => setDeleteReason(reason)}
                  className={`w-full text-left px-4 py-2.5 rounded-lg text-sm transition ${
                    deleteReason === reason ? 'bg-orange-500 text-black font-semibold' : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                  }`}>
                  {reason}
                </button>
              ))}
            </div>

            {deleteReason === 'Other reason' && (
              <textarea
                value={customReason}
                onChange={e => setCustomReason(e.target.value)}
                placeholder="Please tell us more..."
                rows={2}
                className="w-full bg-stone-100 text-stone-800 rounded-lg px-3 py-2 text-sm outline-none border border-stone-300 focus:border-orange-500 mb-4"/>
            )}

            <div className="flex gap-3">
              <button onClick={() => { setShowDeleteModal(false); setPendingDeleteId(null) }}
                className="flex-1 bg-stone-100 hover:bg-stone-200 text-stone-900 font-bold py-2.5 rounded-lg transition">
                Cancel
              </button>
              <button onClick={confirmDelete} disabled={!deleteReason}
                className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold py-2.5 rounded-lg disabled:opacity-50 transition">
                Delete Listing
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
