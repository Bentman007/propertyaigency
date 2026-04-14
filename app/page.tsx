export default function Home() {
  return (
    <main className="min-h-screen bg-gray-900 text-white">
      <nav className="bg-gray-950 border-b border-gray-800 px-6 py-4 flex justify-between items-center">
        <div className="text-2xl font-bold">
          Property<span className="text-orange-500">AI</span>gency
        </div>
        <div className="flex gap-6 text-gray-300 text-sm">
          <a href="#" className="hover:text-orange-500">Buy</a>
          <a href="#" className="hover:text-orange-500">Rent</a>
          <a href="#" className="hover:text-orange-500">List Property</a>
          <a href="#" className="bg-orange-500 text-black px-4 py-2 rounded-lg font-semibold hover:bg-orange-400">Sign In</a>
        </div>
      </nav>
      <section className="text-center py-24 px-6 bg-gradient-to-b from-gray-950 to-gray-900">
        <h1 className="text-6xl font-bold mb-4">Find Your Perfect <span className="text-orange-500">Property</span></h1>
        <p className="text-gray-400 text-xl mb-8">South Africa's smartest AI-powered property platform</p>
        <div className="bg-gray-800 rounded-2xl p-4 max-w-2xl mx-auto flex gap-2">
          <button className="bg-orange-500 text-black px-6 py-2 rounded-lg font-bold">Buy</button>
          <button className="text-gray-400 px-6 py-2 rounded-lg">Rent</button>
          <input className="flex-1 bg-transparent text-white outline-none px-4" placeholder="Search area, suburb or city..."/>
          <button className="bg-orange-500 text-black px-6 py-2 rounded-lg font-bold">Search</button>
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
            <div key={i} className="bg-gray-800 rounded-xl overflow-hidden border border-gray-700 hover:border-orange-500 transition-all cursor-pointer">
              <div className="h-48 bg-gray-700 flex items-center justify-center text-4xl">🏡</div>
            <div className="p-4">
                <span className="text-xs bg-orange-500 text-black px-2 py-1 rounded font-bold">{p.type}</span>
                <h3 className="text-lg font-bold mt-2">{p.title}</h3>
                <p className="text-gray-400 text-sm">📍 {p.location}</p>
                <p className="text-orange-500 text-xl font-bold mt-2">{p.price}</p>
                <div className="flex gap-4 text-gray-400 text-sm mt-2 border-t border-gray-700 pt-2">
                  <span>🛏 {p.beds} beds</span>
                  <span>🚿 {p.baths} baths</span>
                  <span className="ml-auto text-greenext-xs font-bold">AI Verified ✓</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}
