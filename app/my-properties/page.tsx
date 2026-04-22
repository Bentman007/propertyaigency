'use client'
import BuyerQuotes from '@/components/BuyerQuotes'
import MarketplaceNudge from '@/components/MarketplaceNudge'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function MyPropertiesPage() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [savedProperties, setSavedProperties] = useState<any[]>([])
  const [bookings, setBookings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) { window.location.href = '/auth/login'; return }
      setUser(data.user)
      
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single()
      setProfile(profileData)

      await Promise.all([
        fetchSavedProperties(data.user.id),
        fetchBookings(data.user.id)
      ])
      setLoading(false)
    })
  }, [])

  const fetchSavedProperties = async (userId: string) => {
    const { data: saved } = await supabase
      .from('saved_properties')
      .select('property_id, saved_at')
      .eq('user_id', userId)
      .order('saved_at', { ascending: false })

    if (!saved || saved.length === 0) return

    const { data: props } = await supabase
      .from('properties')
      .select('*')
      .in('id', saved.map(s => s.property_id))

    const { data: views } = await supabase
      .from('property_views')
      .select('property_id')
      .in('property_id', saved.map(s => s.property_id))

    const withStats = props?.map(p => ({
      ...p,
      saved_at: saved.find(s => s.property_id === p.id)?.saved_at,
      total_views: views?.filter(v => v.property_id === p.id).length || 0
    })) || []

    setSavedProperties(withStats)
  }

  const fetchBookings = async (userId: string) => {
    const { data } = await supabase
      .from('viewing_bookings')
      .select('*, properties(title, address, suburb, city, photos)')
      .eq('searcher_id', userId)
      .order('date', { ascending: true })
    setBookings(data || [])
  }

  const unsave = async (propertyId: string) => {
    await supabase.from('saved_properties').delete()
      .eq('user_id', user.id).eq('property_id', propertyId)
    setSavedProperties(prev => prev.filter(p => p.id !== propertyId))
  }

  const formatPrice = (price: number, type: string) =>
    `R ${price?.toLocaleString()}${type === 'rent' ? '/mo' : ''}`

  const getViewsLabel = (views: number) => {
    if (views >= 20) return { label: `🔥 ${views} people viewing`, color: 'text-red-400' }
    if (views >= 10) return { label: `⚡ ${views} people viewing`, color: 'text-yellow-400' }
    if (views >= 3) return { label: `👀 ${views} people viewing`, color: 'text-blue-400' }
    return { label: `${views} views`, color: 'text-gray-400' }
  }

  const getStatusColor = (status: string) => {
    if (status === 'confirmed') return 'bg-green-900 text-green-300'
    if (status === 'cancelled') return 'bg-red-900 text-red-300'
    return 'bg-yellow-900 text-yellow-300'
  }

  if (loading) return (
    <main className="min-h-screen bg-gray-900 flex items-center justify-center">
      <p className="text-orange-500 animate-pulse text-xl">Loading your dashboard...</p>
    </main>
  )

  return (
    <main className="min-h-screen bg-gray-900 text-white">
      <nav className="bg-gray-800 border-b border-gray-700 px-4 md:px-6 py-4 flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold">
          Property<span className="text-orange-500">AI</span>gency
        </Link>
        <div className="flex gap-4 items-center">
          <Link href="/search" className="bg-orange-500 text-black px-4 py-2 rounded-lg font-semibold hover:bg-orange-400 text-sm">
            🔍 AI Property Search
          </Link>
          <Link href="/profile" className="text-gray-400 hover:text-white text-sm">👤 Profile</Link>
          <button onClick={() => supabase.auth.signOut().then(() => window.location.href = '/')}
            className="text-gray-400 hover:text-white text-sm">Sign Out</button>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8 flex justify-between items-start">
          <div>
            <p className="text-gray-400 text-sm mb-1">Welcome back 👋</p>
            <h1 className="text-3xl font-bold">
              {profile?.full_name || user?.user_metadata?.full_name || 'My Dashboard'}
            </h1>
            <p className="text-gray-400 mt-1 text-sm">{user?.email}</p>
          </div>
          <div className="text-right">
            <p className="text-gray-500 text-xs">Today</p>
            <p className="text-gray-300 text-sm">{new Date().toLocaleDateString('en-ZA', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
          </div>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <a href="/saved" className="bg-gray-800 rounded-xl p-4 border border-gray-700 text-center hover:border-orange-500 transition cursor-pointer block">
            <p className="text-3xl font-bold text-orange-500">{savedProperties.length}</p>
            <p className="text-gray-400 text-sm mt-1">Saved Properties</p>
            <p className="text-orange-500 text-xs mt-1">View all →</p>
          </a>
          <div onClick={() => document.getElementById('viewings')?.scrollIntoView({behavior: 'smooth'})}
            className="bg-gray-800 rounded-xl p-4 border border-gray-700 text-center hover:border-green-500 transition cursor-pointer">
            <p className="text-3xl font-bold text-green-400">{bookings.filter(b => b.status === 'confirmed').length}</p>
            <p className="text-gray-400 text-sm mt-1">Confirmed Viewings</p>
            <p className="text-green-500 text-xs mt-1">View →</p>
          </div>
          <div onClick={() => document.getElementById('viewings')?.scrollIntoView({behavior: 'smooth'})}
            className="bg-gray-800 rounded-xl p-4 border border-gray-700 text-center hover:border-yellow-500 transition cursor-pointer">
            <p className="text-3xl font-bold text-yellow-400">{bookings.filter(b => b.status === 'pending').length}</p>
            <p className="text-gray-400 text-sm mt-1">Pending Viewings</p>
            <p className="text-yellow-500 text-xs mt-1">View →</p>
          </div>
        </div>

        {/* Marketplace nudge */}
        {user && <MarketplaceNudge userId={user.id} />}

        {/* AI Search CTA */}
        <div className="bg-gradient-to-r from-orange-900 to-gray-800 rounded-2xl p-6 border border-orange-700 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold mb-1">🤖 Find Your Perfect Property</h2>
              <p className="text-gray-300 text-sm">Chat with our AI Concierge — just describe what you want</p>
            </div>
            <Link href="/search" className="bg-orange-500 hover:bg-orange-400 text-black font-bold px-6 py-3 rounded-xl transition flex-shrink-0">
              Start AI Search →
            </Link>
          </div>
        </div>

        {/* Upcoming viewings */}
        {bookings.length > 0 && (
          <div className="mb-8" id="viewings">
            <h2 className="text-xl font-bold mb-4">📅 My Viewings</h2>
            <div className="space-y-3">
              {bookings.map(booking => (
                <div key={booking.id} className="bg-gray-800 rounded-xl border border-gray-700 p-4 flex gap-4 items-center">
                  <div className="w-16 h-16 bg-gray-700 rounded-lg flex-shrink-0 overflow-hidden">
                    {booking.properties?.photos?.[0] ? (
                      <img src={booking.properties.photos[0]} alt="" className="w-full h-full object-cover"/>
                    ) : <div className="w-full h-full flex items-center justify-center text-2xl">🏠</div>}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold">{booking.properties?.title}</p>
                    <p className="text-gray-400 text-sm">📍 {booking.properties?.suburb}, {booking.properties?.city}</p>
                    <p className="text-orange-500 text-sm font-semibold mt-1">
                      {new Date(booking.date).toLocaleDateString('en-ZA', { weekday: 'long', month: 'long', day: 'numeric' })} at {booking.start_time}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className={`text-xs px-2 py-1 rounded-full font-semibold ${getStatusColor(booking.status)}`}>
                      {booking.status}
                    </span>
                    <Link href={`/property/${booking.property_id}`}
                      className="text-xs text-orange-500 hover:underline">View property →</Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Moving Quotes */}
        {user && <BuyerQuotes userId={user.id} />}

        {/* Moving Services CTA */}
        <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold mb-1">📦 Need Help Moving?</h2>
              <p className="text-gray-300 text-sm">Get quotes from verified removal companies, cleaners, attorneys and more</p>
            </div>
            <a href="/moving" className="bg-gray-700 hover:bg-gray-600 text-white font-bold px-5 py-2.5 rounded-xl transition flex-shrink-0 text-sm">
              Get Quotes →
            </a>
          </div>
        </div>

        {/* Saved properties */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">❤️ Saved Properties</h2>
            <Link href="/saved" className="text-orange-500 hover:underline text-sm">View all →</Link>
          </div>
          {savedProperties.length === 0 ? (
            <div className="bg-gray-800 rounded-2xl border border-gray-700 p-12 text-center">
              <p className="text-4xl mb-3">🏡</p>
              <p className="text-gray-300 font-semibold mb-1">No saved properties yet</p>
              <p className="text-gray-500 text-sm mb-4">Use AI Search to find properties and save the ones you love</p>
              <Link href="/search" className="bg-orange-500 text-black px-6 py-2 rounded-lg font-bold hover:bg-orange-400">
                Start Searching
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {savedProperties.slice(0, 4).map(property => {
                const viewsInfo = getViewsLabel(property.total_views)
                return (
                  <div key={property.id} className="bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden">
                    <div className="h-36 bg-gray-700">
                      {property.photos?.[0] ? (
                        <img src={property.photos[0]} alt={property.title} className="w-full h-full object-cover"/>
                      ) : <div className="w-full h-full flex items-center justify-center text-4xl">🏠</div>}
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold text-sm">{property.title}</h3>
                      <p className="text-gray-400 text-xs">📍 {property.suburb}, {property.city}</p>
                      <p className="text-orange-500 font-bold mt-1">{formatPrice(property.price, property.price_type)}</p>
                      <p className={`text-xs mt-1 ${viewsInfo.color}`}>{viewsInfo.label}</p>
                      <div className="flex gap-2 mt-3">
                        <Link href={`/property/${property.id}`}
                          className="flex-1 bg-orange-500 hover:bg-orange-400 text-black text-xs font-bold py-1.5 rounded-lg text-center">
                          View
                        </Link>
                        <button onClick={() => unsave(property.id)}
                          className="flex-1 border border-gray-600 hover:border-red-500 hover:text-red-400 text-gray-400 text-xs py-1.5 rounded-lg">
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
