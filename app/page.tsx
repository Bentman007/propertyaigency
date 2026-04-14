import { supabase } from '@/lib/supabase'

function formatPrice(price: number, type: string) {
  const formatted = new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR', maximumFractionDigits: 0 }).format(price)
  return type === 'rent' ? `${formatted}/mo` : formatted
}

export default async function Home() {
  const { data: properties } = await supabase
    .from('properties')
    .select('*')
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(6)

  return (
    <main className="min-h-screen bg-gray-900 text-white">
      <nav className="bg-gray-950 border-b border-gray-800 px-6 py-4 flex justify-between items-center">
        <div className="text-2xl font-bold">Property<span className="text-orange-500">AI</span>gency</div>
        <div className="flex gap-4 text-sm items-center">
          <a href="#" className="text-gray-300 hover:text-orange-500">Buy</a>
          <a href="#" className="text-gray-300 hover:text-orange-500">Rent</a>
          <a href="/list" className="text-gray-300 hover:text-orange-500">List Property</a>
          <a href="/auth/login" className="text-gray-300 hover:text-orange-500">Sign In</a>
          <a href="/auth/register" className="bg-orange-500 text-black px-4 py-2 rounded-lg font-bold hover:bg-orange-400">Register</a>
        </div>
      </nav>

      <section className="text-center py-24 px-6 bg-gray-950">
        <div className="inline-flex items-center gap-2 bg-gray-800 border border-gray-700 rounded-full px-4 py-2 text-sm text-gray-400 mb-6">
          <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></span>
          South Africa's AI-Powered Property Platform
        </div>
        <h1 className="text-6xl font-bold mb-4">Find Your Perfect <span className="text-orange-500">Property</span></h1>
        <p className="text-gray-400 text-xl mb-8 max-w-2xl mx-auto">AI-powered valuations, instant answers, smart photo analysis — 45% cheaper than the competition</p>
        <div className="bg-gray-800 border border-gray-700 rounded-2xl p-3 max-w-2xl mx-auto flex gap-2">
          <button className="bg-orange-500 text-black px-5 py-2 rounded-lg font-bold">Buy</button>
          <button className="text-gray-400 px-5 py-2 rounded-lg hover:text-white">Rent</button>
          <input className="flex-1 bg-transparent text-white outline-none px-4" placeholder="Search suburb, city or area..."/>
          <button className="bg-orange-500 text-black px-5 py-2 rounded-lg font-bold">Search</button>
        </div>
        <div className="flex justify-center gap-8 mt-8 text-sm text-gray-500">
          <span>✓ AI Verified Listings</span>
          <span>✓ Instant AI Answers</span>
          <span>✓ Smart Valuations</span>
          <span>✓ 45% Cheaper</span>
        </div>
      </section>

      <section className="px-6 py-16 max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold">Featured Properties</h2>
            <p className="text-gray-400 mt-1">{properties?.length || 0} active listings</p>
          </div>
          <a href="/list" className="bg-orange-500 text-black px-6 py-3 rounded-lg font-bold hover:bg-orange-400 transition-colors">
            + List Your Property
          </a>
        </div>

        {properties && properties.length > 0 ? (
          <div className="grid grid-cols-3 gap-6">
            {properties.map((p) => (
              <div key={p.id} className="bg-gray-800 rounded-xl border border-gray-700 hover:border-orange-500 transition-all cursor-pointer group">
                <div className="h-48 bg-gray-700 rounded-t-xl flex items-center justify-center text-5xl relative overflow-hidden">
                  🏡
                  <div className="absolute top-3 left-3">
                    <span className="bg-orange-500 text-black text-xs font-bold px-2 py-1 rounded">
                      {p.price_type === 'rent' ? 'To Rent' : 'For Sale'}
                    </span>
                  </div>
                  {p.featured && (
                    <div className="absolute top-3 right-3">
                      <span className="bg-yellow-500 text-black text-xs font-bold px-2 py-1 rounded">Featured</span>
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="text-lg font-bold text-white group-hover:text-orange-500 transition-colors">{p.title}</h3>
                  <p className="text-gray-400 text-sm mt-1">📍 {p.suburb}, {p.city}</p>
                  <p className="text-orange-500 text-xl font-bold mt-2">{formatPrice(p.price, p.price_type)}</p>
                  {p.description && (
                    <p className="text-gray-500 text-xs mt-2 line-clamp-2">{p.description}</p>
                  )}
                  <div className="flex gap-4 text-gray-400 text-sm mt-3 pt-3 border-t border-gray-700">
                    {p.bedrooms && <span>🛏 {p.bedrooms} beds</span>}
                    {p.bathrooms && <span>🚿 {p.bathrooms} baths</span>}
                    {p.size_sqm && <span>📐 {p.size_sqm}m²</span>}
                    <span className="ml-auto text-green-400 text-xs font-bold">✓ AI Verified</span>
                  </div>
                  <div className="flex gap-2 mt-3 flex-wrap">
                    {p.has_pool && <span className="text-xs bg-gray-700 px-2 py-1 rounded text-gray-300">Pool</span>}
                    {p.has_solar && <span className="text-xs bg-gray-700 px-2 py-1 rounded text-gray-300">Solar</span>}
                    {p.has_security && <span className="text-xs bg-gray-700 px-2 py-1 rounded text-gray-300">Security</span>}
                    {p.has_garden && <span className="text-xs bg-gray-700 px-2 py-1 rounded text-gray-300">Garden</span>}
                    {p.has_fibre && <span className="text-xs bg-gray-700 px-2 py-1 rounded text-gray-300">Fibre</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 text-gray-500">
            <div className="text-6xl mb-4">🏠</div>
            <p className="text-xl">No listings yet</p>
            <a href="/list" className="mt-4 inline-block bg-orange-500 text-black px-6 py-3 rounded-lg font-bold">Be the first to list!</a>
          </div>
        )}
      </section>

      <section className="bg-gray-950 border-t border-gray-800 px-6 py-16">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Powered by AI. Built for South Africa.</h2>
          <div className="grid grid-cols-3 gap-6">
            {[
              ['✍️', 'AI Advert Writer', 'Instantly generates professional property descriptions from your details'],
              ['💰', 'Smart Valuation', 'AI analyses comparable sales to give accurate price ranges in seconds'],
              ['💬', '24/7 Instant Answers', 'Buyers get immediate AI responses to any property question, day or night'],
              ['📸', 'Photo Advisor', 'AI reviews your photos and suggests improvements before publishing'],
              ['🗺️', 'Area Intelligence', 'Auto-generates area profiles with schools, restaurants, and crime stats'],
              ['📊', 'Price Rating', 'Each listing rated: Great Deal, Good Price, Overpriced — helping buyers decide'],
            ].map(([icon, title, desc]) => (
              <div key={title} className="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-orange-500 transition-all">
                <div className="text-3xl mb-3">{icon}</div>
                <h3 className="font-bold text-white mb-2">{title}</h3>
                <p className="text-gray-400 text-sm">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="bg-gray-950 border-t border-gray-800 px-6 py-8">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="text-xl font-bold">Property<span className="text-orange-500">AI</span>gency</div>
          <p className="text-gray-500 text-sm">© 2025 PropertyAIgency (Pty) Ltd · South Africa · All provinces served</p>
          <div className="flex gap-4 text-sm text-gray-500">
            <a href="#" className="hover:text-orange-500">Privacy</a>
            <a href="#" className="hover:text-orange-500">Terms</a>
            <a href="#" className="hover:text-orange-500">Contact</a>
          </div>
        </div>
      </footer>
    </main>
  )
}
