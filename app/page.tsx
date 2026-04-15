'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function Home() {
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
  }, [])

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

      <section className="text-center py-24 px-6 bg-gradient-to-b from-gray-950 to-gray-900">
        <h1 className="text-6xl font-bold mb-4">Find Your Perfect <span className="text-orange-500">Property</span></h1>
        <p className="text-gray-400 text-xl mb-8">South Africa's smartest AI-powered property platform</p>
        <div className="bg-gray-800 rounded-2xl p-4 max-w-2xl mx-auto flex gap-2">
          <Link href="/buy" className="bg-orange-500 text-black px-6 py-2 rounded-lg font-bold">Buy</Link>
          <Link href="/rent" className="text-gray-300 px-6 py-2 rounded-lg">Rent</Link>
          <input className="flex-1 bg-transparent text-white outline-none px-4" placeholder="Search area, suburb or city..."/>
          <Link href="/buy" className="bg-orange-500 text-black px-6 py-2 rounded-lg font-bold">Search</Link>
        </div>
      </section>

      <section className="px-6 py-16 max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold mb-8">Featured Properties</h2>
        <div className="grid grid-cols-3 gap-6">
          {[
            {title:"Modern Villa",location:"Sandton, Johannesburg",price:"R 4,200,000",beds:4,baths:3,type:"For Sale"},
            {title:"Sea Point Apartment",location:"Sea Point, Cape Town",price:"R 18,500/mo",beds:2,baths:2,type:"To Rent"},
            {title:"Family Home",location:"Umhlanga, Durban",price:"R 2,850,000",beds:3,baths:2,type:"For Sale"},
            {title:"Luxury Penthouse",location:"Waterfront, Cape Town",price:"R 8,900,000",beds:3,baths:3,type:"For Sale"},
            {title:"Garden Cottage",location:"Stellenbosch, WC",price:"R 12,000/mo",beds:1,baths:1,type:"To Rent"},
            {title:"Estate Home",location:"Fourways, Johannesburg",price:"R 3,450,000",beds:4,baths:3,type:"For Sale"},
          ].map((p,i)=>(
            <div key={i} className="bg-gray-800 rounded-2xl overflow-hidden border border-gray-700 hover:border-orange-500 transition-colors">
              <div className="h-48 bg-gray-700 flex items-center justify-center text-4xl">🏠</div>
              <div className="p-4">
                <span className={`text-xs px-2 py-1 rounded font-bold ${p.type === 'To Rent' ? 'bg-blue-500' : 'bg-orange-500'} text-black`}>{p.type}</span>
                <h3 className="text-lg font-bold mt-2">{p.title}</h3>
                <p className="text-gray-400 text-sm">📍 {p.location}</p>
                <p className="text-orange-500 font-bold text-xl mt-2">{p.price}</p>
                <p className="text-gray-400 text-sm mt-1">🛏 {p.beds} beds · 🚿 {p.baths} baths · AI Verified ✓</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="text-center py-16 px-6 bg-gray-800">
        <h2 className="text-3xl font-bold mb-4">Ready to list your property?</h2>
        <p className="text-gray-400 mb-6">Use AI to write your advert, get a valuation and reach thousands of buyers</p>
        <Link href="/list" className="bg-orange-500 text-black px-8 py-3 rounded-lg font-bold hover:bg-orange-400">List My Property</Link>
      </section>

      <footer className="text-center py-8 text-gray-500 text-sm">
        <p>© 2025 PropertyAIgency · <Link href="/auth/login" className="text-orange-500 hover:underline">Sign In</Link> · <Link href="/auth/register" className="text-orange-500 hover:underline">Register</Link></p>
      </footer>
    </main>
  )
}
