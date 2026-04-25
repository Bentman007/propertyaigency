'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

export default function MyListingsPage() {
  const [user, setUser] = useState<any>(null)
  const [properties, setProperties] = useState<any[]>([])
  const [enquiries, setEnquiries] = useState<any[]>([])
  const [bookings, setBookings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [availability, setAvailability] = useState<any>({})
  const [savingAvailability, setSavingAvailability] = useState(false)
  const [availabilitySaved, setAvailabilitySaved] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)
  const [deleteReason, setDeleteReason] = useState('')
  const [customReason, setCustomReason] = useState('')

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) { window.location.href = '/auth/login'; return }
      const accountType = data.user.user_metadata?.account_type
      if (accountType === 'agent') { window.location.href = '/dashboard'; return }
      if (accountType === 'buyer') { window.location.href = '/my-properties'; return }
      setUser(data.user)

      // Fetch their listings
      const { data: props } = await supabase
        .from('properties')
        .select('*')
        .eq('user_id', data.user.id)
        .order('created_at', { ascending: false })
      setProperties(props || [])

      // Fetch bookings
      const propIds = (props || []).map((p: any) => p.id)
      if (propIds.length > 0) {
        const { data: bookingData } = await supabase
          .from('viewing_bookings')
          .select('*')
          .in('property_id', propIds)
          .order('booking_date', { ascending: true })
        setBookings(bookingData || [])
      }

      // Fetch availability
      const { data: avail } = await supabase
        .from('agent_weekly_template')
        .select('*')
        .eq('agent_id', data.user.id)
      
      if (avail && avail.length > 0) {
        const availMap: any = {}
        avail.forEach((a: any) => { availMap[a.day_of_week] = { start: a.start_time, end: a.end_time, available: true } })
        setAvailability(availMap)
      }

      setLoading(false)
    })
  }, [])

  const toggleDay = (day: string) => {
    setAvailability((prev: any) => {
      if (prev[day]) {
        const updated = { ...prev }
        delete updated[day]
        return updated
      }
      return { ...prev, [day]: { start: '09:00', end: '17:00', available: true } }
    })
  }

  const updateTime = (day: string, field: string, value: string) => {
    setAvailability((prev: any) => ({ ...prev, [day]: { ...prev[day], [field]: value } }))
  }

  const saveAvailability = async () => {
    if (!user) return
    setSavingAvailability(true)

    await supabase.from('agent_weekly_template').delete().eq('agent_id', user.id)

    for (const [day, times] of Object.entries(availability) as any) {
      await supabase.from('agent_weekly_template').insert({
        agent_id: user.id,
        day_of_week: day,
        start_time: times.start,
        end_time: times.end
      })
    }

    setAvailabilitySaved(true)
    setSavingAvailability(false)
    setTimeout(() => setAvailabilitySaved(false), 3000)
  }

  const updateStatus = async (propertyId: string, status: string) => {
    await supabase.from('properties').update({ status }).eq('id', propertyId)
    setProperties(prev => prev.map(p => p.id === propertyId ? { ...p, status } : p))

    if (status === 'sold') {
      await fetch('/api/notify-saved-buyers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ property_id: propertyId, reason: 'sold or rented' })
      })
    }
  }

  const confirmBooking = async (bookingId: string, action: 'confirmed' | 'declined') => {
    await fetch('/api/confirm-booking', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ booking_id: bookingId, action })
    })
    setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: action } : b))
  }

  const initiateDelete = (propertyId: string) => {
    setPendingDeleteId(propertyId)
    setShowDeleteModal(true)
    setDeleteReason('')
    setCustomReason('')
  }

  const confirmDelete = async () => {
    if (!pendingDeleteId) return
    setDeletingId(pendingDeleteId)

    await fetch('/api/notify-saved-buyers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        property_id: pendingDeleteId,
        reason: deleteReason === 'Other reason' ? customReason : deleteReason
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

  const formatPrice = (price: number, type: string) =>
    `R ${price?.toLocaleString()}${type === 'rent' ? '/mo' : ''}`

  if (loading) return (
    <main className="min-h-screen bg-[#f5f0eb] flex items-center justify-center">
      <p className="text-orange-500 animate-pulse">Loading your dashboard...</p>
    </main>
  )

  const pendingBookings = bookings.filter(b => b.status === 'pending')
  const confirmedBookings = bookings.filter(b => b.status === 'confirmed')

  return (
    <main className="min-h-screen bg-[#f5f0eb] text-stone-900">
      <nav className="bg-[#4a4238] px-4 md:px-6 py-4 flex justify-between items-center">
        <Link href="/" className="text-xl md:text-2xl font-bold text-white">
          Property<span className="text-orange-400">AI</span>gency
        </Link>
        <div className="flex items-center gap-3">
          <Link href="/list" className="bg-orange-500 text-black px-4 py-2 rounded-lg font-semibold hover:bg-orange-400 text-sm">
            + Add Listing
          </Link>
          <button onClick={() => supabase.auth.signOut().then(() => window.location.href = '/')}
            className="text-stone-300 hover:text-white text-sm">Sign Out</button>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 md:px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <p className="text-stone-500 text-sm mb-1">Welcome back 👋</p>
          <h1 className="text-2xl md:text-3xl font-bold">My Property Dashboard</h1>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          <div className="bg-white border border-stone-300 rounded-xl p-4 text-center">
            <p className="text-3xl font-bold text-orange-500">{properties.length}</p>
            <p className="text-stone-500 text-sm mt-1">My Listings</p>
          </div>
          <div className="bg-white border border-stone-300 rounded-xl p-4 text-center">
            <p className="text-3xl font-bold text-yellow-400">{pendingBookings.length}</p>
            <p className="text-stone-500 text-sm mt-1">Pending Viewings</p>
          </div>
          <div className="bg-white border border-stone-300 rounded-xl p-4 text-center">
            <p className="text-3xl font-bold text-green-400">{confirmedBookings.length}</p>
            <p className="text-stone-500 text-sm mt-1">Confirmed Viewings</p>
          </div>
        </div>

        {/* Pending bookings to confirm */}
        {pendingBookings.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold mb-4">📅 Viewing Requests</h2>
            <div className="space-y-3">
              {pendingBookings.map(booking => (
                <div key={booking.id} className="bg-white border border-yellow-500 rounded-xl p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="font-bold">{booking.property_address || 'Your property'}</p>
                      <p className="text-stone-500 text-sm">
                        📅 {new Date(booking.booking_date).toLocaleDateString('en-ZA', { weekday: 'long', month: 'long', day: 'numeric' })}
                        {' '} at {booking.booking_time?.slice(0, 5)}
                      </p>
                    </div>
                    <span className="bg-yellow-900 text-yellow-300 text-xs px-2 py-1 rounded-full font-semibold">Pending</span>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => confirmBooking(booking.id, 'confirmed')}
                      className="flex-1 bg-green-600 hover:bg-green-500 text-white font-bold py-2 rounded-lg text-sm transition">
                      ✅ Confirm
                    </button>
                    <button onClick={() => confirmBooking(booking.id, 'declined')}
                      className="flex-1 bg-stone-100 hover:bg-red-700 text-stone-700 hover:text-stone-900 py-2 rounded-lg text-sm transition">
                      Decline
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* My Listings */}
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4">🏠 My Listings</h2>
          {properties.length === 0 ? (
            <div className="bg-white border border-stone-300 rounded-2xl p-10 text-center">
              <p className="text-4xl mb-4">🏡</p>
              <p className="text-stone-500 mb-4">You haven't listed any properties yet</p>
              <Link href="/list" className="inline-block bg-orange-500 text-black font-bold px-8 py-3 rounded-xl hover:bg-orange-400">
                List Your Property →
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {properties.map(property => (
                <div key={property.id} className="bg-white border border-stone-300 rounded-2xl overflow-hidden">
                  <div className="flex gap-4 p-4">
                    <div className="w-24 h-24 bg-stone-100 rounded-xl flex-shrink-0 overflow-hidden">
                      {property.photos?.[0] ? (
                        <img src={property.photos[0]} alt={property.title} className="w-full h-full object-cover"/>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-2xl">🏠</div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start gap-2">
                        <h3 className="font-bold text-sm truncate">{property.title}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold flex-shrink-0 ${
                          property.status === 'active' ? 'bg-green-900 text-green-300' :
                          property.status === 'sold' ? 'bg-red-900 text-red-300' :
                          property.status === 'draft' ? 'bg-stone-200 text-stone-700' :
                          'bg-yellow-900 text-yellow-300'
                        }`}>{property.status}</span>
                      </div>
                      <p className="text-stone-500 text-xs mt-0.5">📍 {property.suburb}, {property.city}</p>
                      <p className="text-orange-500 font-bold mt-1">{formatPrice(property.price, property.price_type)}</p>
                      <p className="text-stone-400 text-xs">🛏 {property.bedrooms} beds · 🚿 {property.bathrooms} baths</p>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="px-4 pb-4 flex flex-wrap gap-2">
                    <Link href={`/property/${property.id}`}
                      className="text-sm bg-stone-100 hover:bg-stone-200 text-stone-700 px-3 py-1.5 rounded-lg transition">
                      👁 View
                    </Link>
                    <Link href={`/list/edit/${property.id}`}
                      className="text-sm bg-stone-100 hover:bg-stone-200 text-stone-700 px-3 py-1.5 rounded-lg transition">
                      ✏️ Edit
                    </Link>
                    {property.status === 'active' && (
                      <button onClick={() => updateStatus(property.id, 'sold')}
                        className="text-sm bg-stone-100 hover:bg-red-800 text-stone-700 px-3 py-1.5 rounded-lg transition">
                        ✅ Mark Sold/Rented
                      </button>
                    )}
                    {property.status === 'draft' && (
                      <button onClick={() => updateStatus(property.id, 'active')}
                        className="text-sm bg-green-600 hover:bg-green-500 text-white font-bold px-3 py-1.5 rounded-lg animate-pulse">
                        ✅ Publish
                      </button>
                    )}
                    <button onClick={() => initiateDelete(property.id)}
                      disabled={deletingId === property.id}
                      className="text-sm bg-stone-100 hover:bg-red-700 text-stone-500 hover:text-stone-900 px-3 py-1.5 rounded-lg transition">
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Confirmed Viewings */}
        {confirmedBookings.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold mb-4">✅ Confirmed Viewings</h2>
            <div className="space-y-3">
              {confirmedBookings.map(booking => (
                <div key={booking.id} className="bg-white border border-green-700 rounded-xl p-4">
                  <p className="font-bold text-sm">{booking.property_address || 'Your property'}</p>
                  <p className="text-stone-500 text-sm">
                    📅 {new Date(booking.booking_date).toLocaleDateString('en-ZA', { weekday: 'long', month: 'long', day: 'numeric' })}
                    {' '} at {booking.booking_time?.slice(0, 5)}
                  </p>
                  <span className="text-green-400 text-xs font-semibold">✓ Confirmed</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Availability */}
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-2">📅 My Viewing Availability</h2>
          <p className="text-stone-500 text-sm mb-4">Set the days and times buyers can book viewings of your property</p>
          <div className="bg-white border border-stone-300 rounded-2xl p-6">
            <div className="space-y-3 mb-6">
              {DAYS.map(day => (
                <div key={day} className="flex items-center gap-3">
                  <button onClick={() => toggleDay(day)}
                    className={`w-28 text-sm font-semibold py-2 rounded-lg transition flex-shrink-0 ${
                      availability[day] ? 'bg-orange-500 text-black' : 'bg-stone-100 text-stone-500'
                    }`}>
                    {day.slice(0, 3)}
                  </button>
                  {availability[day] ? (
                    <div className="flex items-center gap-2 flex-1">
                      <input type="time" value={availability[day].start}
                        onChange={e => updateTime(day, 'start', e.target.value)}
                        className="bg-stone-100 text-stone-800 rounded-lg px-3 py-2 text-sm outline-none border border-stone-300 focus:border-orange-500"/>
                      <span className="text-stone-500 text-sm">to</span>
                      <input type="time" value={availability[day].end}
                        onChange={e => updateTime(day, 'end', e.target.value)}
                        className="bg-stone-100 text-stone-800 rounded-lg px-3 py-2 text-sm outline-none border border-stone-300 focus:border-orange-500"/>
                    </div>
                  ) : (
                    <span className="text-stone-400 text-sm">Unavailable</span>
                  )}
                </div>
              ))}
            </div>

            {availabilitySaved && (
              <div className="bg-green-900 border border-green-700 rounded-lg p-3 text-green-300 text-sm mb-3">
                ✅ Availability saved! Buyers can now book viewings on your selected days.
              </div>
            )}

            <button onClick={saveAvailability} disabled={savingAvailability}
              className="w-full bg-orange-500 hover:bg-orange-400 text-black font-bold py-3 rounded-xl disabled:opacity-50 transition">
              {savingAvailability ? 'Saving...' : '💾 Save Availability'}
            </button>
          </div>
        </div>
      </div>

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 px-4">
          <div className="bg-white border border-stone-300 rounded-2xl p-6 max-w-md w-full" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-2">🗑️ Remove Listing</h3>
            <p className="text-stone-500 text-sm mb-4">Please let us know why you are removing this listing</p>
            <div className="space-y-2 mb-4">
              {[
                'Property has been sold/rented',
                'Taking it off the market',
                'Listed by mistake',
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
              <textarea value={customReason} onChange={e => setCustomReason(e.target.value)}
                placeholder="Please tell us more..."
                rows={2}
                className="w-full bg-stone-100 text-stone-800 rounded-lg px-3 py-2 text-sm outline-none border border-stone-300 focus:border-orange-500 mb-4"/>
            )}
            <div className="flex gap-3">
              <button onClick={() => { setShowDeleteModal(false); setPendingDeleteId(null) }}
                className="flex-1 bg-stone-100 hover:bg-stone-200 text-stone-900 font-bold py-2.5 rounded-lg transition">
                Cancel
              </button>
              <button onClick={confirmDelete}
                disabled={!deleteReason || (deleteReason === 'Other reason' && !customReason)}
                className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold py-2.5 rounded-lg disabled:opacity-50 transition">
                Remove Listing
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
