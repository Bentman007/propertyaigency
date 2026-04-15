import PropertyChat from '@/components/PropertyChat'
import ViewTracker from '@/components/ViewTracker'
import { supabase } from '@/lib/supabase'

function formatPrice(price: number, type: string) {
  const formatted = new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR', maximumFractionDigits: 0 }).format(price)
  return type === 'rent' ? `${formatted}/mo` : formatted
}

const featureGroups = [
  { label: 'Outdoor & Entertainment', features: [['has_braai','Braai Area'],['has_patio','Entertainers Patio'],['has_pool','Swimming Pool'],['has_jacuzzi','Jacuzzi'],['has_tennis_court','Tennis Court'],['has_putting_green','Putting Green'],['has_outdoor_shower','Outdoor Shower']] },
  { label: 'Security', features: [['has_24hr_security','24-Hour Security'],['has_gated_community','Gated Community'],['has_electric_fence','Electric Fence'],['has_alarm','Alarm System'],['has_cctv','CCTV'],['has_guardhouse','Guard House'],['has_intercom','Intercom'],['has_beams','Beams']] },
  { label: 'Interior', features: [['has_pyjama_lounge','Pyjama Lounge'],['has_bar','Bar / Wet Bar'],['has_gym','Home Gym'],['has_study','Study'],['has_wine_cellar','Wine Cellar'],['has_cinema','Cinema Room'],['has_scullery','Scullery'],['has_pantry','Pantry'],['has_underfloor_heating','Underfloor Heating'],['has_aircon','Air Conditioning'],['has_skylight','Skylight']] },
  { label: 'Staff & Accommodation', features: [['has_staff_quarters','Staff Quarters'],['has_flatlet','Flatlet / Granny Flat'],['has_bachelor_pad','Bachelor Pad']] },
  { label: 'Utilities', features: [['has_solar','Solar Power'],['has_borehole','Borehole'],['has_water_tanks','Water Tanks'],['has_generator','Backup Generator'],['has_gas','Gas Kitchen'],['has_fibre','Fibre Internet']] },
  { label: 'Parking', features: [['has_single_garage','Single Garage'],['has_double_garage','Double Garage'],['has_triple_garage','Triple Garage'],['has_carport','Carport'],['has_visitors_parking','Visitors Parking'],['has_boat_storage','Boat Storage']] },
  { label: 'Community', features: [['has_clubhouse','Clubhouse'],['has_communal_pool','Communal Pool'],['is_golf_estate','Golf Estate'],['has_equestrian','Equestrian'],['has_walking_trails','Walking Trails'],['pet_friendly','Pet Friendly']] },
]

export default async function PropertyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { data: p } = await supabase
    .from('properties')
    .select('*')
    .eq('id', id)
    .single()

  if (!p) return (
    <main className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
      <div className="text-center">
        <div className="text-6xl mb-4">🏠</div>
        <h1 className="text-2xl font-bold mb-2">Property not found</h1>
        <a href="/" className="text-orange-500 hover:underline">Back to listings</a>
      </div>
    </main>
  )

  const activeFeatures = featureGroups.map(group => ({
    label: group.label,
    items: group.features.filter(([key]) => p[key])
  })).filter(group => group.items.length > 0)

  return (
    <main className="min-h-screen bg-gray-900 text-white">
      <ViewTracker propertyId={p.id} />
      <nav className="bg-gray-950 border-b border-gray-800 px-6 py-4 flex justify-between items-center">
        <a href="/" className="text-2xl font-bold">Property<span className="text-orange-500">AI</span>gency</a>
        <a href="/dashboard" className="text-gray-400 hover:text-white text-sm">← Back to Dashboard</a>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-10">

        {p.photos && p.photos.length > 0 ? (
          <div className="mb-8">
            <div className="rounded-2xl h-80 overflow-hidden bg-gray-800 border border-gray-700">
              <img src={p.photos[0]} alt={p.title} className="w-full h-full object-cover" />
            </div>
            {p.photos.length > 1 && (
              <div className="grid grid-cols-4 gap-2 mt-2">
                {p.photos.slice(1, 5).map((photo: string, i: number) => (
                  <div key={i} className="h-24 rounded-xl overflow-hidden bg-gray-800 border border-gray-700">
                    <img src={photo} alt={`${p.title} ${i + 2}`} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="bg-gray-800 rounded-2xl h-80 flex items-center justify-center text-8xl mb-8 border border-gray-700">
            🏡
          </div>
        )}

        <div className="grid grid-cols-3 gap-8">
          <div className="col-span-2 space-y-6">

            <div>
              <div className="flex gap-2 mb-3">
                <span className="bg-orange-500 text-black text-xs font-bold px-3 py-1 rounded-full">
                  {p.price_type === 'rent' ? 'To Rent' : 'For Sale'}
                </span>
                <span className="bg-gray-700 text-gray-300 text-xs px-3 py-1 rounded-full capitalize">{p.property_type}</span>
                {p.featured && <span className="bg-yellow-500 text-black text-xs font-bold px-3 py-1 rounded-full">Featured</span>}
              </div>
              <h1 className="text-4xl font-bold mb-2">{p.title}</h1>
              <p className="text-gray-400">📍 {p.address && `${p.address}, `}{p.suburb}, {p.city}, {p.province}</p>
            </div>

            <div className="grid grid-cols-4 gap-4">
              {p.bedrooms && (
                <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 text-center">
                  <div className="text-2xl mb-1">🛏</div>
                  <div className="text-xl font-bold">{p.bedrooms}</div>
                  <div className="text-gray-400 text-xs">Bedrooms</div>
                </div>
              )}
              {p.bathrooms && (
                <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 text-center">
                  <div className="text-2xl mb-1">🚿</div>
                  <div className="text-xl font-bold">{p.bathrooms}</div>
                  <div className="text-gray-400 text-xs">Bathrooms</div>
                </div>
              )}
              {p.garages > 0 && (
                <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 text-center">
                  <div className="text-2xl mb-1">🚗</div>
                  <div className="text-xl font-bold">{p.garages}</div>
                  <div className="text-gray-400 text-xs">Garages</div>
                </div>
              )}
              {p.size_sqm && (
                <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 text-center">
                  <div className="text-2xl mb-1">📐</div>
                  <div className="text-xl font-bold">{p.size_sqm}</div>
                  <div className="text-gray-400 text-xs">m²</div>
                </div>
              )}
            </div>

            {p.description && (
              <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
                <h2 className="text-lg font-bold mb-3 text-orange-500">About This Property</h2>
                <p className="text-gray-300 leading-relaxed">{p.description}</p>
              </div>
            )}

            {activeFeatures.length > 0 && (
              <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
                <h2 className="text-lg font-bold mb-4 text-orange-500">Property Features</h2>
                <div className="space-y-4">
                  {activeFeatures.map(group => (
                    <div key={group.label}>
                      <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">{group.label}</h3>
                      <div className="flex flex-wrap gap-2">
                        {group.items.map(([, label]) => (
                          <span key={label} className="bg-gray-700 text-gray-300 text-sm px-3 py-1 rounded-full flex items-center gap-1">
                            <span className="text-green-400">✓</span> {label}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

          <div className="space-y-4">
            <div className="bg-gray-800 border border-orange-500 rounded-xl p-6 sticky top-6">
              <div className="text-3xl font-bold text-orange-500 mb-1">{formatPrice(p.price, p.price_type)}</div>
              {p.size_sqm && p.price_type === 'sale' && (
                <div className="text-gray-400 text-sm mb-4">R {Math.round(p.price / p.size_sqm).toLocaleString()} per m²</div>
              )}
              <div className="bg-green-900 border border-green-700 rounded-lg p-3 mb-4">
                <div className="text-green-400 font-bold text-sm">✓ Good Price</div>
                <div className="text-green-300 text-xs mt-1">Priced competitively for this area</div>
              </div>
              <button className="w-full bg-orange-500 text-black font-bold py-3 rounded-lg hover:bg-orange-400 transition-colors mb-3">
                📞 Enquire Now
              </button>
              <button className="w-full bg-gray-700 text-white font-bold py-3 rounded-lg hover:bg-gray-600 transition-colors mb-3">
                📅 Book Viewing
              </button>
              <PropertyChat property={p} />
              <div className="mt-4 pt-4 border-t border-gray-700">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                  AI Verified Listing
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
