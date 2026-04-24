'use client'
import MobileBanner from '@/components/MobileBanner'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function Home() {
  const [user, setUser] = useState<any>(null)
  const [properties, setProperties] = useState<any[]>([])
  const [featuredProperties, setFeaturedProperties] = useState<any[]>([])
  const [locationLabel, setLocationLabel] = useState('Latest Properties')
  const [locating, setLocating] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
    fetchProperties()
    getLocation()
    fetchFeatured()
  }, [])

  const fetchFeatured = async () => {
    const { data } = await supabase
      .from('properties')
      .select('*')
      .eq('status', 'active')
      .eq('featured', true)
      .order('created_at', { ascending: false })
      .limit(3)
    if (data && data.length > 0) setFeaturedProperties(data)
  }

  const fetchProperties = async (suburb?: string, city?: string) => {
    let query = supabase
      .from('properties')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(6)

    if (city) {
      query = supabase
        .from('properties')
        .select('*')
        .eq('status', 'active')
        .ilike('city', `%${city}%`)
        .order('created_at', { ascending: false })
        .limit(6)
    }

    const { data } = await query
    if (data && data.length > 0) {
      setProperties(data)
    } else if (city) {
      // No local results — fall back to all properties
      const { data: allData } = await supabase
        .from('properties')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(6)
      if (allData) setProperties(allData)
      setLocationLabel('Latest Properties')
    }
  }

  const getLocation = () => {
    if (!navigator.geolocation) return
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords
          const response = await fetch(
            `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${process.env.NEXT_PUBLIC_GOOGLE_PLACES_KEY}`
          )
          const data = await response.json()
          const components = data.results?.[0]?.address_components || []
          const city = components.find((c: any) => c.types.includes('locality'))?.long_name
          const suburb = components.find((c: any) => c.types.includes('sublocality'))?.long_name

          if (city) {
            setLocationLabel(`Properties Near You — ${suburb || city}`)
            fetchProperties(suburb, city)
          }
        } catch (e) {
          fetchProperties()
        }
        setLocating(false)
      },
      () => {
        fetchProperties()
        setLocating(false)
      },
      { timeout: 5000 }
    )
  }

  const formatPrice = (price: number, type: string) => 
    `R ${price?.toLocaleString()}${type === 'rent' ? '/mo' : ''}`

  return (
    <main className="min-h-screen bg-amber-50 text-stone-900">
      <nav className="bg-stone-700 border-b border-stone-600 px-4 md:px-6 py-4 flex justify-between items-center">
        <div className="text-xl md:text-2xl font-bold flex-shrink-0">
          Property<span className="text-orange-500">AI</span>gency
        </div>
        {/* Desktop nav */}
        <div className="hidden md:flex gap-4 text-stone-700 text-sm">
          <Link href="/search" className="hover:text-orange-500">🔍 AI Search</Link>
          <Link href="/buy" className="hover:text-orange-500">Buy</Link>
          <Link href="/rent" className="hover:text-orange-500">Rent</Link>
          <Link href="/list" className="hover:text-orange-500">List</Link>
          <Link href="/how-it-works" className="hover:text-orange-500">How It Works</Link>
          <Link href="/pricing" className="hover:text-orange-500">Pricing</Link>
          <Link href="/contact" className="hover:text-orange-500">Contact</Link>
          {user && <Link href="/dashboard" className="hover:text-orange-500">Dashboard</Link>}
        </div>
        {user ? (
          <div className="flex gap-2 items-center">
            <Link href="/dashboard" className="bg-orange-500 text-black px-3 py-2 rounded-lg font-semibold hover:bg-orange-400 text-sm">
              <span className="hidden md:inline">My Dashboard</span>
              <span className="md:hidden">🏠</span>
            </Link>
            <button onClick={() => supabase.auth.signOut().then(() => setUser(null))} className="text-stone-300 hover:text-white text-sm">
              Sign Out
            </button>
          </div>
        ) : (
          <Link href="/auth/login" className="bg-orange-500 text-black px-3 py-2 rounded-lg font-semibold hover:bg-orange-400 text-sm">
            <span className="hidden md:inline">Sign In</span>
            <span className="md:hidden">→</span>
          </Link>
        )}
      </nav>

      {/* Hero */}
      <section className="text-center py-24 px-6 bg-gradient-to-b from-stone-300 to-amber-50">
        <h1 className="text-6xl font-bold mb-4">Find Your Perfect <span className="text-orange-500">Property</span></h1>
        <p className="text-stone-500 text-xl mb-8">South Africa's smartest AI-powered property platform</p>
        <div className="flex flex-col items-center gap-4">
          <Link href="/search" className="bg-orange-500 text-black px-10 py-4 rounded-2xl font-bold text-lg hover:bg-orange-400 transition flex items-center gap-2">
            🤖 Chat with AI Concierge
          </Link>
          <p className="text-stone-400 text-sm">Tell our AI what you want in plain English — it will find your perfect match</p>
          <div className="flex gap-4 mt-2">
            <Link href="/buy" className="text-stone-700 hover:text-orange-500 text-sm border border-stone-300 px-4 py-2 rounded-lg">Browse for Sale</Link>
            <Link href="/rent" className="text-stone-700 hover:text-orange-500 text-sm border border-stone-300 px-4 py-2 rounded-lg">Browse to Rent</Link>
          </div>
        </div>
      </section>

      {/* Featured / Sponsored Listings */}
      {featuredProperties.length > 0 && (
        <section className="px-6 py-8 max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <span className="bg-yellow-500 text-black text-xs font-bold px-3 py-1 rounded-full">⭐ FEATURED</span>
            <h2 className="text-2xl font-bold">Featured Properties</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featuredProperties.map((p, i) => (
              <Link href={`/property/${p.id}`} key={i}
                className="bg-white rounded-2xl overflow-hidden border-2 border-yellow-500 hover:border-yellow-400 transition-colors block relative">
                <div className="absolute top-3 left-3 z-10">
                  <span className="bg-yellow-500 text-black text-xs font-bold px-2 py-1 rounded-full">⭐ Featured</span>
                </div>
                <div className="h-48 bg-stone-100">
                  {p.photos?.[0] ? (
                    <img src={p.photos[0]} alt={p.title} className="w-full h-full object-cover"/>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl">🏠</div>
                  )}
                </div>
                <div className="p-4">
                  <span className={`text-xs px-2 py-1 rounded font-bold ${p.price_type === 'rent' ? 'bg-blue-500' : 'bg-orange-500'} text-black`}>
                    {p.price_type === 'rent' ? 'To Rent' : 'For Sale'}
                  </span>
                  <h3 className="text-lg font-bold mt-2">{p.title}</h3>
                  <p className="text-stone-500 text-sm">📍 {p.suburb}, {p.city}</p>
                  <p className="text-yellow-400 font-bold text-xl mt-2">{formatPrice(p.price, p.price_type)}</p>
                  <p className="text-stone-500 text-sm mt-1">🛏 {p.bedrooms} beds · 🚿 {p.bathrooms} baths · ⭐ Featured</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Latest Properties */}
      <section className="px-4 md:px-6 py-10 md:py-16 max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-3">
            <h2 className="text-3xl font-bold">{locationLabel}</h2>
            {locating && <span className="text-orange-500 text-sm animate-pulse">📍 Finding nearby...</span>}
          </div>
          <Link href="/search" className="text-orange-500 hover:underline text-sm">Find my perfect match →</Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {properties.length > 0 ? properties.map((p, i) => (
            <Link href={`/property/${p.id}`} key={i} className="bg-white rounded-2xl overflow-hidden border border-stone-300 hover:border-orange-500 transition-colors block">
              <div className="h-48 bg-stone-100">
                {p.photos?.[0] ? (
                  <img src={p.photos[0]} alt={p.title} className="w-full h-full object-cover"/>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl">🏠</div>
                )}
              </div>
              <div className="p-4">
                <span className={`text-xs px-2 py-1 rounded font-bold ${p.price_type === 'rent' ? 'bg-blue-500' : 'bg-orange-500'} text-black`}>
                  {p.price_type === 'rent' ? 'To Rent' : 'For Sale'}
                </span>
                <h3 className="text-lg font-bold mt-2">{p.title}</h3>
                <p className="text-stone-500 text-sm">📍 {p.suburb}, {p.city}</p>
                <p className="text-orange-500 font-bold text-xl mt-2">{formatPrice(p.price, p.price_type)}</p>
                <p className="text-stone-500 text-sm mt-1">🛏 {p.bedrooms} beds · 🚿 {p.bathrooms} baths · AI Verified ✓</p>
              </div>
            </Link>
          )) : (
            // Fallback placeholders
            [{title:"Modern Villa",location:"Sandton, Johannesburg",price:"R 4,200,000",beds:4,baths:3,type:"For Sale"},
             {title:"Sea Point Apartment",location:"Sea Point, Cape Town",price:"R 18,500/mo",beds:2,baths:2,type:"To Rent"},
             {title:"Family Home",location:"Umhlanga, Durban",price:"R 2,850,000",beds:3,baths:2,type:"For Sale"}
            ].map((p,i) => (
              <div key={i} className="bg-white rounded-2xl overflow-hidden border border-stone-300">
                <div className="h-48 bg-stone-100 flex items-center justify-center text-4xl">🏠</div>
                <div className="p-4">
                  <span className={`text-xs px-2 py-1 rounded font-bold ${p.type === 'To Rent' ? 'bg-blue-500' : 'bg-orange-500'} text-black`}>{p.type}</span>
                  <h3 className="text-lg font-bold mt-2">{p.title}</h3>
                  <p className="text-stone-500 text-sm">📍 {p.location}</p>
                  <p className="text-orange-500 font-bold text-xl mt-2">{p.price}</p>
                  <p className="text-stone-500 text-sm mt-1">🛏 {p.beds} beds · 🚿 {p.baths} baths · AI Verified ✓</p>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="text-center py-16 px-6 bg-white">
        <h2 className="text-3xl font-bold mb-4">Ready to list your property?</h2>
        <p className="text-stone-500 mb-6">Use AI to write your advert, get a valuation and reach thousands of buyers</p>
        <Link href="/list" className="bg-orange-500 text-black px-8 py-3 rounded-lg font-bold hover:bg-orange-400">
          List My Property
        </Link>
      </section>

      
      <MobileBanner />
      <footer className="border-t border-stone-300 px-6 py-8 bg-stone-100 mt-12 text-center text-stone-400 text-sm">
        <div className="flex justify-center gap-6">
          <a href="/terms" className="hover:text-stone-900">Terms of Service</a>
          <a href="/privacy" className="hover:text-stone-900">Privacy Policy</a>
          <a href="/contact" className="hover:text-stone-900">Contact</a>
        </div>
        <p className="mt-3">© 2026 PropertyAIgency. All rights reserved.</p>
      </footer>
    </main>
  )
}
