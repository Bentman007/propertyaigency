'use client'
import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import PhotoUpload from '@/components/PhotoUpload'
import AddressAutocomplete from '@/components/AddressAutocomplete'

const featureGroups = [
  { label: 'Outdoor & Entertainment', features: [['has_braai','Braai Area / Built-in Braai'],['has_patio','Entertainers Patio'],['has_pool','Swimming Pool'],['has_jacuzzi','Jacuzzi / Splash Pool'],['has_tennis_court','Tennis Court'],['has_putting_green','Putting Green'],['has_outdoor_shower','Outdoor Shower']] },
  { label: 'Security', features: [['has_24hr_security','24-Hour Security'],['has_gated_community','Gated Community'],['has_electric_fence','Electric Fence'],['has_alarm','Alarm System'],['has_cctv','CCTV Cameras'],['has_guardhouse','Guard House'],['has_intercom','Intercom / Video Doorbell'],['has_beams','Beams']] },
  { label: 'Interior Features', features: [['has_pyjama_lounge','Pyjama Lounge'],['has_bar','Bar / Wet Bar'],['has_gym','Home Gym'],['has_study','Study / Home Office'],['has_wine_cellar','Wine Cellar'],['has_cinema','Cinema Room'],['has_scullery','Scullery'],['has_pantry','Pantry'],['has_underfloor_heating','Underfloor Heating'],['has_aircon','Air Conditioning'],['has_skylight','Skylight']] },
  { label: 'Staff & Accommodation', features: [['has_staff_quarters','Staff / Domestic Quarters'],['has_flatlet','Flatlet / Granny Flat'],['has_bachelor_pad','Bachelor Pad']] },
  { label: 'Utilities & Green Energy', features: [['has_solar','Solar Power'],['has_borehole','Borehole'],['has_water_tanks','Water Tanks / JoJo Tanks'],['has_generator','Backup Generator'],['has_gas','Gas Kitchen'],['has_fibre','Fibre Internet']] },
  { label: 'Parking & Storage', features: [['has_single_garage','Single Garage'],['has_double_garage','Double Garage'],['has_triple_garage','Triple Garage'],['has_carport','Carport'],['has_visitors_parking','Visitors Parking'],['has_boat_storage','Boat Storage']] },
  { label: 'Community & Lifestyle', features: [['has_clubhouse','Clubhouse'],['has_communal_pool','Communal Pool'],['is_golf_estate','Golf Estate'],['has_equestrian','Equestrian / Horse Facilities'],['has_walking_trails','Walking Trails'],['pet_friendly','Pet Friendly']] },
]

const allKeys = featureGroups.flatMap(g => g.features.map(([k]) => k))
const defaultFeatures = Object.fromEntries(allKeys.map(k => [k, false]))

export default function ListProperty() {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [photos, setPhotos] = useState<string[]>([])
  const [aiLoading, setAiLoading] = useState(false)
  const [valuationLoading, setValuationLoading] = useState(false)
  const [valuation, setValuation] = useState<any>(null)
  const [form, setForm] = useState({
    title: '', description: '', price: '', price_type: 'sale',
    bedrooms: '', bathrooms: '', garages: '', size_sqm: '',
    property_type: 'house', address: '', suburb: '', city: '', province: '',
    latitude: '', longitude: '',
    ...defaultFeatures
  })

  const update = (field: string, value: any) => setForm(prev => ({ ...prev, [field]: value }))

  const handleAddressSelect = useCallback((result: any) => {
    setForm(prev => ({
      ...prev,
      address: result.address,
      suburb: result.suburb,
      city: result.city,
      province: result.province,
      latitude: result.lat || '',
      longitude: result.lng || ''
    }))
  }, [])

  const getActiveFeatures = () =>
    Object.entries(form)
      .filter(([key, val]) => (key.startsWith('has_') || key === 'pet_friendly' || key === 'is_golf_estate') && Boolean(val))
      .map(([key]) => key.replace('has_', '').replace(/_/g, ' '))

  const generateWithAI = async () => {
    if (!form.suburb || !form.city) return
    setAiLoading(true)
    try {
      const res = await fetch('/api/generate-listing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bedrooms: form.bedrooms, bathrooms: form.bathrooms,
          garages: form.garages, size_sqm: form.size_sqm,
          property_type: form.property_type, price_type: form.price_type,
          suburb: form.suburb, city: form.city, province: form.province,
          features: getActiveFeatures()
        })
      })
      const data = await res.json()
      if (data.title) update('title', data.title)
      if (data.description) update('description', data.description)
    } catch (e) { console.error(e) }
    setAiLoading(false)
  }

  const getValuation = async () => {
    if (!form.suburb || !form.city || !form.bedrooms) return
    setValuationLoading(true)
    try {
      const res = await fetch('/api/valuation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bedrooms: form.bedrooms, bathrooms: form.bathrooms,
          garages: form.garages, size_sqm: form.size_sqm,
          property_type: form.property_type,
          suburb: form.suburb, city: form.city, province: form.province
        })
      })
      const data = await res.json()
      setValuation(data)
    } catch (e) { console.error(e) }
    setValuationLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setMessage('Please sign in first'); setLoading(false); return }
    const { error } = await supabase.from('properties').insert({
      ...form,
      price: parseFloat(form.price),
      bedrooms: parseInt(form.bedrooms),
      bathrooms: parseInt(form.bathrooms),
      garages: parseInt(form.garages) || 0,
      size_sqm: parseFloat(form.size_sqm) || null,
      latitude: parseFloat(form.latitude as string) || null,
      longitude: parseFloat(form.longitude as string) || null,
      user_id: user.id,
      photos
    })
    if (error) setMessage(error.message)
    else { setMessage('Property listed successfully!'); window.scrollTo(0,0) }
    setLoading(false)
  }

  const stepComplete = {
    address: !!(form.address && form.suburb && form.city),
    details: !!(form.bedrooms && form.bathrooms && form.price_type && form.property_type),
    price: !!form.price,
    ai: !!(form.title && form.description),
    photos: photos.length >= 3
  }

  return (
    <main className="min-h-screen bg-gray-900 text-white">
      <nav className="bg-gray-950 border-b border-gray-800 px-6 py-4 flex justify-between items-center">
        <a href="/" className="text-2xl font-bold">Property<span className="text-orange-500">AI</span>gency</a>
        <a href="/" className="text-gray-400 hover:text-white text-sm">← Back to listings</a>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-4xl font-bold mb-2">List Your Property</h1>
        <p className="text-gray-400 mb-8">Complete each step below — AI will help write your advert automatically</p>

        <div className="flex gap-2 mb-8 flex-wrap">
          {[
            ['1', 'Address', stepComplete.address],
            ['2', 'Property Details', stepComplete.details],
            ['3', 'Features', true],
            ['4', 'AI Advert', stepComplete.ai],
            ['5', 'Price & Valuation', stepComplete.price],
            ['6', 'Photos', stepComplete.photos],
          ].map(([num, label, done]) => (
            <div key={num as string} className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border ${done ? 'bg-green-900 border-green-700 text-green-400' : 'bg-gray-800 border-gray-700 text-gray-400'}`}>
              <span>{done ? '✓' : num}</span> {label as string}
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">

          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h2 className="text-lg font-bold mb-1 text-orange-500">Step 1 — Property Address</h2>
            <p className="text-gray-400 text-sm mb-4">Start typing your address and select from the suggestions</p>
            <AddressAutocomplete onSelect={handleAddressSelect} />
            {form.suburb && (
              <div className="grid grid-cols-3 gap-3 mt-3">
                <div className="bg-gray-700 rounded-lg px-3 py-2">
                  <div className="text-xs text-gray-400">Suburb</div>
                  <div className="text-white text-sm font-medium">{form.suburb}</div>
                </div>
                <div className="bg-gray-700 rounded-lg px-3 py-2">
                  <div className="text-xs text-gray-400">City</div>
                  <div className="text-white text-sm font-medium">{form.city}</div>
                </div>
                <div className="bg-gray-700 rounded-lg px-3 py-2">
                  <div className="text-xs text-gray-400">Province</div>
                  <div className="text-white text-sm font-medium">{form.province}</div>
                </div>
              </div>
            )}
          </div>

          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h2 className="text-lg font-bold mb-1 text-orange-500">Step 2 — Property Details</h2>
            <p className="text-gray-400 text-sm mb-4">Tell us about the property size and type</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-gray-300 text-sm mb-1 block">Listing Type</label>
                <select value={form.price_type} onChange={e => update('price_type', e.target.value)}
                  className="w-full bg-gray-700 text-white rounded-lg px-4 py-3 outline-none border border-gray-600 focus:border-orange-500">
                  <option value="sale">For Sale</option>
                  <option value="rent">To Rent</option>
                </select>
              </div>
              <div>
                <label className="text-gray-300 text-sm mb-1 block">Property Type</label>
                <select value={form.property_type} onChange={e => update('property_type', e.target.value)}
                  className="w-full bg-gray-700 text-white rounded-lg px-4 py-3 outline-none border border-gray-600 focus:border-orange-500">
                  <option value="house">House</option>
                  <option value="apartment">Apartment</option>
                  <option value="townhouse">Townhouse</option>
                  <option value="estate">Estate</option>
                  <option value="farm">Farm</option>
                  <option value="commercial">Commercial</option>
                </select>
              </div>
              {[['bedrooms','Bedrooms','3'],['bathrooms','Bathrooms','2'],['garages','Garages','2'],['size_sqm','Size (m²)','250']].map(([field,label,ph]) => (
                <div key={field}>
                  <label className="text-gray-300 text-sm mb-1 block">{label}</label>
                  <input value={(form as any)[field]} onChange={e => update(field, e.target.value)}
                    type="number" className="w-full bg-gray-700 text-white rounded-lg px-4 py-3 outline-none border border-gray-600 focus:border-orange-500"
                    placeholder={ph} required />
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h2 className="text-lg font-bold mb-1 text-orange-500">Step 3 — Property Features</h2>
            <p className="text-gray-400 text-sm mb-4">Tick all features — these help buyers find your property and improve your AI-generated advert</p>
            <div className="space-y-5">
              {featureGroups.map(group => (
                <div key={group.label}>
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 border-b border-gray-700 pb-1">{group.label}</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {group.features.map(([field, label]) => (
                      <label key={field} className="flex items-center gap-3 bg-gray-700 rounded-lg px-3 py-2.5 cursor-pointer hover:bg-gray-600 transition-colors">
                        <input type="checkbox" checked={(form as any)[field]}
                          onChange={e => update(field, e.target.checked)}
                          className="w-4 h-4 accent-orange-500" />
                        <span className="text-gray-300 text-sm">{label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h2 className="text-lg font-bold mb-1 text-orange-500">Step 4 — AI Writes Your Advert</h2>
            <p className="text-gray-400 text-sm mb-4">Click the button and AI will write a professional title and description based on your property details</p>
            <button type="button" onClick={generateWithAI}
              disabled={aiLoading || !form.suburb || !form.bedrooms}
              className="w-full bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold py-3 rounded-lg transition-colors mb-4 flex items-center justify-center gap-2">
              {aiLoading ? '✨ Writing your advert...' : '✨ Generate Professional Advert with AI'}
            </button>
            {!form.suburb && <p className="text-yellow-500 text-xs mb-3">⚠ Complete Steps 1 & 2 first</p>}
            <div className="space-y-3">
              <div>
                <label className="text-gray-300 text-sm mb-1 block">Property Title</label>
                <input value={form.title} onChange={e => update('title', e.target.value)}
                  className="w-full bg-gray-700 text-white rounded-lg px-4 py-3 outline-none border border-gray-600 focus:border-orange-500"
                  placeholder="AI will generate this — or type your own" required />
              </div>
              <div>
                <label className="text-gray-300 text-sm mb-1 block">Description</label>
                <textarea value={form.description} onChange={e => update('description', e.target.value)}
                  className="w-full bg-gray-700 text-white rounded-lg px-4 py-3 outline-none border border-gray-600 focus:border-orange-500 h-32"
                  placeholder="AI will generate this — or write your own" />
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h2 className="text-lg font-bold mb-1 text-orange-500">Step 5 — Asking Price</h2>
            <p className="text-gray-400 text-sm mb-4">Enter your price or use AI to get a market estimate first</p>
            <div className="flex gap-2 mb-3">
              <input value={form.price} onChange={e => update('price', e.target.value)}
                type="number" className="flex-1 bg-gray-700 text-white rounded-lg px-4 py-3 outline-none border border-gray-600 focus:border-orange-500"
                placeholder={form.price_type === 'rent' ? 'Monthly rent e.g. 15000' : 'Asking price e.g. 2500000'} required />
              <button type="button" onClick={getValuation}
                disabled={valuationLoading || !form.suburb || !form.bedrooms}
                className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold px-4 py-3 rounded-lg text-sm transition-colors whitespace-nowrap">
                {valuationLoading ? 'Estimating...' : '🤖 Get AI Estimate'}
              </button>
            </div>
            {!form.suburb && <p className="text-yellow-500 text-xs">Complete Step 1 and 2 first to get an AI estimate</p>}
            {valuation && (
              <div className="bg-gray-900 border border-blue-500 rounded-xl p-4 mt-3">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-blue-400 font-bold text-sm">🤖 AI Market Estimate</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${valuation.trend === 'rising' ? 'bg-green-900 text-green-400' : valuation.trend === 'declining' ? 'bg-red-900 text-red-400' : 'bg-yellow-900 text-yellow-400'}`}>
                    {valuation.trend === 'rising' ? '📈 Rising' : valuation.trend === 'declining' ? '📉 Declining' : '➡️ Stable'} market
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div className="bg-gray-800 rounded-lg p-3">
                    <div className="text-gray-400 text-xs mb-1">Sale Value Estimate</div>
                    <div className="text-white font-bold text-sm">R {valuation.sale_min?.toLocaleString()} – R {valuation.sale_max?.toLocaleString()}</div>
                  </div>
                  <div className="bg-gray-800 rounded-lg p-3">
                    <div className="text-gray-400 text-xs mb-1">Rental Estimate</div>
                    <div className="text-white font-bold text-sm">R {valuation.rent_min?.toLocaleString()} – R {valuation.rent_max?.toLocaleString()}/mo</div>
                  </div>
                </div>
                <p className="text-gray-400 text-xs mb-3">{valuation.reason}</p>
                <div className="flex gap-2">
                  <button type="button" onClick={() => update('price', valuation.sale_min)}
                    className="text-xs bg-gray-700 hover:bg-gray-600 text-white px-3 py-1.5 rounded-lg transition-colors">
                    Use min sale price
                  </button>
                  <button type="button" onClick={() => update('price', valuation.rent_min)}
                    className="text-xs bg-gray-700 hover:bg-gray-600 text-white px-3 py-1.5 rounded-lg transition-colors">
                    Use min rental
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h2 className="text-lg font-bold mb-1 text-orange-500">Step 6 — Property Photos</h2>
            <p className="text-gray-400 text-sm mb-4">Upload at least 3 photos — listings with more photos get significantly more enquiries</p>
            <PhotoUpload propertyId={Date.now().toString()} onUpload={setPhotos} />
            {photos.length > 0 && photos.length < 3 && (
              <p className="text-yellow-500 text-sm mt-2">⚠ Please upload at least 3 photos</p>
            )}
          </div>

          {message && (
            <div className={`p-4 rounded-lg text-center font-medium ${message.includes('success') ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'}`}>
              {message}
            </div>
          )}

          <button type="submit" disabled={loading || photos.length < 3 || !form.title}
            className="w-full bg-orange-500 text-black font-bold py-4 rounded-xl text-lg hover:bg-orange-400 transition-colors disabled:opacity-50">
            {loading ? 'Submitting...' : '🏠 Publish My Listing'}
          </button>
          {(photos.length < 3 || !form.title) && (
            <p className="text-center text-gray-500 text-sm">
              {!form.title ? 'Generate or write a title first' : 'Upload at least 3 photos to publish'}
            </p>
          )}
        </form>
      </div>
    </main>
  )
}
