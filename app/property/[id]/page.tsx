import { supabase } from '@/lib/supabase'
import PhotoGallery from '@/components/PhotoGallery'
import PropertyChat from '@/components/PropertyChat'
import BookViewing from '@/components/BookViewing'
import ViewTracker from '@/components/ViewTracker'
import EditListingButton from '@/components/EditListingButton'
import InterestButtons from '@/components/InterestButtons'

const featureGroups = [
  { label: 'Outdoor & Entertainment', features: [['has_braai','Braai Area / Built-in Braai'],['has_patio','Entertainers Patio'],['has_pool','Swimming Pool'],['has_jacuzzi','Jacuzzi / Splash Pool'],['has_tennis_court','Tennis Court'],['has_putting_green','Putting Green'],['has_outdoor_shower','Outdoor Shower']] },
  { label: 'Security', features: [['has_24hr_security','24-Hour Security'],['has_gated_community','Gated Community'],['has_electric_fence','Electric Fence'],['has_alarm','Alarm System'],['has_cctv','CCTV Cameras'],['has_guardhouse','Guard House'],['has_intercom','Intercom / Video Doorbell'],['has_beams','Beams']] },
  { label: 'Interior', features: [['has_pyjama_lounge','Pyjama Lounge'],['has_bar','Bar / Wet Bar'],['has_gym','Home Gym'],['has_study','Study / Home Office'],['has_wine_cellar','Wine Cellar'],['has_cinema','Cinema Room'],['has_scullery','Scullery'],['has_pantry','Pantry'],['has_underfloor_heating','Underfloor Heating'],['has_aircon','Air Conditioning'],['has_skylight','Skylight']] },
  { label: 'Staff & Accommodation', features: [['has_staff_quarters','Staff Quarters'],['has_flatlet','Flatlet / Granny Flat'],['has_bachelor_pad','Bachelor Pad']] },
  { label: 'Utilities & Green Energy', features: [['has_solar','Solar Power'],['has_borehole','Borehole'],['has_water_tanks','Water Tanks'],['has_generator','Backup Generator'],['has_gas','Gas Kitchen'],['has_fibre','Fibre Internet']] },
  { label: 'Parking & Storage', features: [['has_single_garage','Single Garage'],['has_double_garage','Double Garage'],['has_triple_garage','Triple Garage'],['has_carport','Carport'],['has_visitors_parking','Visitors Parking'],['has_boat_storage','Boat Storage']] },
  { label: 'Community & Lifestyle', features: [['has_clubhouse','Clubhouse'],['has_communal_pool','Communal Pool'],['is_golf_estate','Golf Estate'],['has_equestrian','Equestrian'],['has_walking_trails','Walking Trails'],['has_pet_friendly','Pet Friendly']] },
]

function formatPrice(price: number, type: string) {
  const formatted = new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR', maximumFractionDigits: 0 }).format(price)
  return type === 'rent' ? `${formatted}/mo` : formatted
}

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

      {/* Nav */}
      <nav className="bg-gray-950 border-b border-gray-800 px-4 md:px-6 py-4 flex justify-between items-center">
        <a href="/" className="text-xl md:text-2xl font-bold">Property<span className="text-orange-500">AI</span>gency</a>
        <div className="flex items-center gap-2 md:gap-3">
          <a href="/dashboard" className="text-gray-400 hover:text-white text-sm hidden md:block">← Dashboard</a>
          <EditListingButton propertyId={p.id} agentId={p.user_id} />
        </div>
      </nav>

      {/* Status banners */}
      {p.status === 'sold' && (
        <div className="bg-red-900 border-b border-red-700 px-4 py-3 text-center">
          <p className="text-red-300 font-semibold text-sm">🔴 This property has been sold/rented and is no longer available</p>
        </div>
      )}
      {p.status === 'under_offer' && (
        <div className="bg-yellow-900 border-b border-yellow-700 px-4 py-3 text-center">
          <p className="text-yellow-300 font-semibold text-sm">🟡 This property is currently under offer</p>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 md:px-6 py-4 md:py-6">

        {/* Title & Address - ABOVE photos */}
        <div className="mb-4">
          <div className="flex flex-wrap gap-2 mb-2">
            <span className="bg-orange-500 text-black text-xs font-bold px-3 py-1 rounded-full">
              {p.price_type === 'rent' ? 'To Rent' : 'For Sale'}
            </span>
            <span className="bg-gray-700 text-gray-300 text-xs px-3 py-1 rounded-full capitalize">{p.property_type}</span>
            {p.featured && <span className="bg-yellow-500 text-black text-xs font-bold px-3 py-1 rounded-full">⭐ Featured</span>}
          </div>
          <h1 className="text-2xl md:text-4xl font-bold mb-1">{p.title}</h1>
          <p className="text-gray-400 text-sm md:text-base">📍 {p.address && `${p.address}, `}{p.suburb}, {p.city}, {p.province}</p>
        </div>

        {/* Photo Gallery */}
        <PhotoGallery photos={p.photos || []} title={p.title} />

        {/* Main content - stacks on mobile, side by side on desktop */}
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left/Main column */}
          <div className="lg:col-span-2 space-y-5">

            {/* Key stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {p.bedrooms && (
                <div className="bg-gray-800 border border-gray-700 rounded-xl p-3 md:p-4 text-center">
                  <div className="text-xl md:text-2xl mb-1">🛏</div>
                  <div className="text-lg md:text-xl font-bold">{p.bedrooms}</div>
                  <div className="text-gray-400 text-xs">Bedrooms</div>
                </div>
              )}
              {p.bathrooms && (
                <div className="bg-gray-800 border border-gray-700 rounded-xl p-3 md:p-4 text-center">
                  <div className="text-xl md:text-2xl mb-1">🚿</div>
                  <div className="text-lg md:text-xl font-bold">{p.bathrooms}</div>
                  <div className="text-gray-400 text-xs">Bathrooms</div>
                </div>
              )}
              {p.garages > 0 && (
                <div className="bg-gray-800 border border-gray-700 rounded-xl p-3 md:p-4 text-center">
                  <div className="text-xl md:text-2xl mb-1">🚗</div>
                  <div className="text-lg md:text-xl font-bold">{p.garages}</div>
                  <div className="text-gray-400 text-xs">Garages</div>
                </div>
              )}
              {p.size_sqm && (
                <div className="bg-gray-800 border border-gray-700 rounded-xl p-3 md:p-4 text-center">
                  <div className="text-xl md:text-2xl mb-1">📐</div>
                  <div className="text-lg md:text-xl font-bold">{p.size_sqm}</div>
                  <div className="text-gray-400 text-xs">m²</div>
                </div>
              )}
            </div>

            {/* Description */}
            {p.description && (
              <div className="bg-gray-800 border border-gray-700 rounded-xl p-5">
                <h2 className="text-lg font-bold mb-3 text-orange-500">About This Property</h2>
                <p className="text-gray-300 leading-relaxed text-sm md:text-base">{p.description}</p>
              </div>
            )}

            {/* Video */}
            {p.video_url && (
              <div className="bg-gray-800 border border-gray-700 rounded-xl p-5">
                <h2 className="text-lg font-bold mb-3 text-orange-500">🎥 Property Video</h2>
                <div className="relative w-full" style={{paddingBottom: '56.25%'}}>
                  <iframe
                    src={p.video_url.includes('youtube.com/watch') 
                      ? p.video_url.replace('watch?v=', 'embed/')
                      : p.video_url.includes('youtu.be')
                      ? p.video_url.replace('youtu.be/', 'www.youtube.com/embed/')
                      : p.video_url.includes('vimeo.com')
                      ? p.video_url.replace('vimeo.com/', 'player.vimeo.com/video/')
                      : p.video_url}
                    className="absolute inset-0 w-full h-full rounded-lg"
                    allowFullScreen
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  />
                </div>
              </div>
            )}

            {/* Virtual Tour */}
            {p.virtual_tour_url && (
              <div className="bg-gray-800 border border-gray-700 rounded-xl p-5">
                <h2 className="text-lg font-bold mb-3 text-orange-500">🏠 Virtual Tour</h2>
                <div className="relative w-full" style={{paddingBottom: '56.25%'}}>
                  <iframe
                    src={p.virtual_tour_url}
                    className="absolute inset-0 w-full h-full rounded-lg"
                    allowFullScreen
                  />
                </div>
              </div>
            )}

            {/* Features */}
            {activeFeatures.length > 0 && (
              <div className="bg-gray-800 border border-gray-700 rounded-xl p-5">
                <h2 className="text-lg font-bold mb-4 text-orange-500">Property Features</h2>
                <div className="space-y-4">
                  {activeFeatures.map(group => (
                    <div key={group.label}>
                      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">{group.label}</h3>
                      <div className="flex flex-wrap gap-2">
                        {group.items.map(([, label]) => (
                          <span key={label} className="bg-gray-700 text-gray-300 text-xs md:text-sm px-3 py-1 rounded-full flex items-center gap-1">
                            <span className="text-green-400">✓</span> {label}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* AI Concierge Chat - full width on mobile, in left column on desktop */}
            <div className="lg:hidden">
              <PropertyChat property={p} />
            </div>

          </div>

          {/* Right sidebar - price, booking, chat */}
          <div className="space-y-4">

            {/* Price card - sticky on desktop */}
            <div className="bg-gray-800 border border-orange-500 rounded-xl p-5 lg:sticky lg:top-6">
              <div className="text-2xl md:text-3xl font-bold text-orange-500 mb-1">
                {formatPrice(p.price, p.price_type)}
              </div>
              {p.size_sqm && p.price_type === 'sale' && (
                <div className="text-gray-400 text-sm mb-3">R {Math.round(p.price / p.size_sqm).toLocaleString()} per m²</div>
              )}
              <div className="bg-green-900 border border-green-700 rounded-lg p-3 mb-4">
                <div className="text-green-400 font-bold text-sm">✓ Good Price</div>
                <div className="text-green-300 text-xs mt-1">Priced competitively for this area</div>
              </div>

              <BookViewing property={p} />
              <InterestButtons propertyId={p.id} agentId={p.user_id} />

              <div className="mt-4 pt-4 border-t border-gray-700">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                  AI Verified Listing
                </div>
              </div>
            </div>

            {/* Chat - hidden on mobile (shown above), visible on desktop */}
            <div className="hidden lg:block">
              <PropertyChat property={p} />
            </div>

          </div>
        </div>
      </div>
    </main>
  )
}
