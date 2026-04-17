'use client'
import MobileBanner from '@/components/MobileBanner'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function Home() {
  const [user, setUser] = useState<any>(null)
  const [properties, setProperties] = useState<any[]>([])

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
    fetchProperties()
  }, [])

  const fetchProperties = async () => {
    const { data } = await supabase
      .from('properties')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(6)
    if (data) setProperties(data)
  }

  const formatPrice = (price: number, type: string) => 
    `R ${price?.toLocaleString()}${type === 'rent' ? '/mo' : ''}`

  return (
    <main className="min-h-screen bg-gray-900 text-white">
      <nav className="bg-gray-800 border-b border-gray-700 px-6 py-4 flex justify-between items-center">
        <div className="text-2xl font-bold">
          Property<span className="text-orange-500">AI</span>gency
        </div>
        <div className="flex gap-6 text-gray-300 text-sm">
          <Link href="/search" className="hover:text-orange-500">🔍 AI Search</Link>
          <Link href="/buy" className="hover:text-orange-500">Buy</Link>
          <Link href="/rent" className="hover:text-orange-500">Rent</Link>
          <Link href="/list" className="hover:text-orange-500">List Property</Link>
          {user && <Link href="/dashboard" className="hover:text-orange-500">My Dashboard</Link>}
        </div>
        {user ? (
          <div className="flex gap-3 items-center">
            <Link href="/dashboard" className="bg-orange-500 text-black px-4 py-2 rounded-lg font-semibold hover:bg-orange-400 text-sm">
              My Dashboard
            </Link>
            <button onClick={() => supabase.auth.signOut().then(() => setUser(null))} className="text-gray-400 hover:text-white text-sm">
              Sign Out
            </button>
          </div>
        ) : (
          <Link href="/auth/login" className="bg-orange-500 text-black px-4 py-2 rounded-lg font-semibold hover:bg-orange-400">
            Sign In
          </Link>
        )}
      </nav>

      {/* Hero */}
      <section className="text-center py-24 px-6 bg-gradient-to-b from-gray-950 to-gray-900">
        <h1 className="text-6xl font-bold mb-4">Find Your Perfect <span className="text-orange-500">Property</span></h1>
        <p className="text-gray-400 text-xl mb-8">South Africa's smartest AI-powered property platform</p>
        <div className="flex flex-col items-center gap-4">
          <Link href="/search" className="bg-orange-500 text-black px-10 py-4 rounded-2xl font-bold text-lg hover:bg-orange-400 transition flex items-center gap-2">
            🤖 Chat with AI Concierge
          </Link>
          <p className="text-gray-500 text-sm">Tell our AI what you want in plain English — it will find your perfect match</p>
          <div className="flex gap-4 mt-2">
            <Link href="/buy" className="text-gray-300 hover:text-orange-500 text-sm border border-gray-700 px-4 py-2 rounded-lg">Browse for Sale</Link>
            <Link href="/rent" className="text-gray-300 hover:text-orange-500 text-sm border border-gray-700 px-4 py-2 rounded-lg">Browse to Rent</Link>
          </div>
        </div>
      </section>

      {/* Featured Properties */}
      <section className="px-6 py-16 max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold">Latest Properties</h2>
          <Link href="/search" className="text-orange-500 hover:underline text-sm">Find my perfect match →</Link>
        </div>
        <div className="grid grid-cols-3 gap-6">
          {properties.length > 0 ? properties.map((p, i) => (
            <Link href={`/property/${p.id}`} key={i} className="bg-gray-800 rounded-2xl overflow-hidden border border-gray-700 hover:border-orange-500 transition-colors block">
              <div className="h-48 bg-gray-700">
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
                <p className="text-gray-400 text-sm">📍 {p.suburb}, {p.city}</p>
                <p className="text-orange-500 font-bold text-xl mt-2">{formatPrice(p.price, p.price_type)}</p>
                <p className="text-gray-400 text-sm mt-1">🛏 {p.bedrooms} beds · 🚿 {p.bathrooms} baths · AI Verified ✓</p>
              </div>
            </Link>
          )) : (
            // Fallback placeholders
            [{title:"Modern Villa",location:"Sandton, Johannesburg",price:"R 4,200,000",beds:4,baths:3,type:"For Sale"},
             {title:"Sea Point Apartment",location:"Sea Point, Cape Town",price:"R 18,500/mo",beds:2,baths:2,type:"To Rent"},
             {title:"Family Home",location:"Umhlanga, Durban",price:"R 2,850,000",beds:3,baths:2,type:"For Sale"}
            ].map((p,i) => (
              <div key={i} className="bg-gray-800 rounded-2xl overflow-hidden border border-gray-700">
                <div className="h-48 bg-gray-700 flex items-center justify-center text-4xl">🏠</div>
                <div className="p-4">
                  <span className={`text-xs px-2 py-1 rounded font-bold ${p.type === 'To Rent' ? 'bg-blue-500' : 'bg-orange-500'} text-black`}>{p.type}</span>
                  <h3 className="text-lg font-bold mt-2">{p.title}</h3>
                  <p className="text-gray-400 text-sm">📍 {p.location}</p>
                  <p className="text-orange-500 font-bold text-xl mt-2">{p.price}</p>
                  <p className="text-gray-400 text-sm mt-1">🛏 {p.beds} beds · 🚿 {p.baths} baths · AI Verified ✓</p>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="text-center py-16 px-6 bg-gray-800">
        <h2 className="text-3xl font-bold mb-4">Ready to list your property?</h2>
        <p className="text-gray-400 mb-6">Use AI to write your advert, get a valuation and reach thousands of buyers</p>
        <Link href="/list" className="bg-orange-500 text-black px-8 py-3 rounded-lg font-bold hover:bg-orange-400">
          List My Property
        </Link>
      </section>

      <footer className="text-center py-8 text-gray-500 text-sm">
        <p>© 2025 PropertyAIgency · <Link href="/auth/login" className="text-orange-500 hover:underline">Sign In</Link> · <Link href="/auth/register" className="text-orange-500 hover:underline">Register</Link></p>
      </footer>
      <MobileBanner />
    </main>
  )
}
