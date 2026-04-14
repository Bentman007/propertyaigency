'use client'
import PhotoUpload from '@/components/PhotoUpload'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'

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
  const [photos, setPhotos] = useState<string[]>([])
  const [aiLoading, setAiLoading] = useState(false)
  const [valuation, setValuation] = useState<any>(null)
  const [valuationLoading, setValuationLoading] = useState(false)

  const getValuation = async () => {
    if (!form.suburb || !form.city || !form.bedrooms) return
    setValuationLoading(true)
    try {
      const res = await fetch('/api/valuation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bedrooms: form.bedrooms,
          bathrooms: form.bathrooms,
          garages: form.garages,
          size_sqm: form.size_sqm,
          property_type: form.property_type,
          suburb: form.suburb,
          city: form.city,
          province: form.province
        })
      })
      const data = await res.json()
      setValuation(data)
    } catch (e) {
      console.error(e)
    }
    setValuationLoading(false)
  }

  const generateWithAI = async () => {
    setAiLoading(true)
    const activeFeatures = Object.entries(form)
      .filter(([key, val]) => key.startsWith('has_') || key === 'pet_friendly' || key === 'is_golf_estate')
      .filter(([, val]) => val === true)
      .map(([key]) => key.replace('has_', '').replace('_', ' '))
    try {
      const res = await fetch('/api/generate-listing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bedrooms: form.bedrooms,
          bathrooms: form.bathrooms,
          garages: form.garages,
          size_sqm: form.size_sqm,
          property_type: form.property_type,
          price_type: form.price_type,
          suburb: form.suburb,
          city: form.city,
          province: form.province,
          features: activeFeatures
        })
      })
      const data = await res.json()
      if (data.title) update('title', data.title)
      if (data.description) update('description', data.description)
    } catch (e) {
      console.error(e)
    }
    setAiLoading(false)
  }
  const [message, setMessage] = useState('')
  const [form, setForm] = useState({
    title: '', description: '', price: '', price_type: 'sale',
    bedrooms: '', bathrooms: '', garages: '', size_sqm: '',
    property_type: 'house', address: '', suburb: '', city: '', province: '',
    ...defaultFeatures
  })

  const update = (field: string, value: any) => setForm(prev => ({ ...prev, [field]: value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setMessage('Please sign in first'); setLoading(false); return }
    const { error } = await supabase.from('properties').insert({
      photos,
      ...form,
      price: parseFloat(form.price),
      bedrooms: parseInt(form.bedrooms),
      bathrooms: parseInt(form.bathrooms),
      garages: parseInt(form.garages) || 0,
      size_sqm: parseFloat(form.size_sqm) || null,
      user_id: user.id
    })
    if (error) setMessage(error.message)
    else setMessage('Property listed successfully!')
    setLoading(false)
  }

  return (
    <main className="min-h-screen bg-gray-900 text-white">
      <nav className="bg-gray-950 border-b border-gray-800 px-6 py-4 flex justify-between items-center">
        <a href="/" className="text-2xl font-bold">Property<span className="text-orange-500">AI</span>gency</a>
        <a href="/" className="text-gray-400 hover:text-white">Back to listings</a>
      </nav>
      <div className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-4xl font-bold mb-2">List Your Property</h1>
        <p className="text-gray-400 mb-8">Fill in your property details below</p>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h2 className="text-lg font-bold mb-4 text-orange-500">Basic Details</h2>
            <div className="space-y-4">
              <div className="flex justify-end mb-4">
                <button type="button" onClick={generateWithAI} disabled={aiLoading || !form.suburb || !form.city}
                  className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold px-4 py-2 rounded-lg text-sm transition-colors">
                  {aiLoading ? '✨ Writing...' : '✨ Generate Title & Description with AI'}
                </button>
              </div>
              {!form.suburb && <p className="text-yellow-500 text-xs mb-3">💡 Fill in your location first, then click Generate with AI</p>}
              <div>
                <label className="text-gray-300 text-sm mb-1 block">Property Title</label>
                <input value={form.title} onChange={e => update('title', e.target.value)} className="w-full bg-gray-700 text-white rounded-lg px-4 py-3 outline-none border border-gray-600 focus:border-orange-500" placeholder="Click Generate with AI above..." />
              </div>
              <div>
                <label className="text-gray-300 text-sm mb-1 block">Description</label>
                <textarea value={form.description} onChange={e => update('description', e.target.value)} className="w-full bg-gray-700 text-white rounded-lg px-4 py-3 outline-none border border-gray-600 focus:border-orange-500 h-32" placeholder="Describe your property..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-gray-300 text-sm mb-1 block">Listing Type</label>
                  <select value={form.price_type} onChange={e => update('price_type', e.target.value)} className="w-full bg-gray-700 text-white rounded-lg px-4 py-3 outline-none border border-gray-600 focus:border-orange-500">
                    <option value="sale">For Sale</option>
                    <option value="rent">To Rent</option>
                  </select>
                </div>
                <div>
                  <label className="text-gray-300 text-sm mb-1 block">Property Type</label>
                  <select value={form.property_type} onChange={e => update('property_type', e.target.value)} className="w-full bg-gray-700 text-white rounded-lg px-4 py-3 outline-none border border-gray-600 focus:border-orange-500">
                    <option value="house">House</option>
                    <option value="apartment">Apartment</option>
                    <option value="townhouse">Townhouse</option>
                    <option value="estate">Estate</option>
                    <option value="farm">Farm</option>
                    <option value="commercial">Commercial</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-gray-300 text-sm mb-1 block">Price (R)</label>
                <div className="flex gap-2">
                  <input value={form.price} onChange={e => update('price', e.target.value)} type="number" className="flex-1 bg-gray-700 text-white rounded-lg px-4 py-3 outline-none border border-gray-600 focus:border-orange-500" placeholder="2500000" required />
                  <button type="button" onClick={getValuation} disabled={valuationLoading || !form.suburb || !form.bedrooms}
                    className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold px-4 py-3 rounded-lg text-sm transition-colors whitespace-nowrap">
                    {valuationLoading ? '...' : '🤖 Get AI Value'}
                  </button>
                </div>
              </div>

              {valuation && (
                <div className="bg-gray-900 border border-blue-500 rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-blue-400 font-bold text-sm">🤖 AI Valuation Estimate</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${valuation.trend === 'rising' ? 'bg-green-900 text-green-400' : valuation.trend === 'declining' ? 'bg-red-900 text-red-400' : 'bg-yellow-900 text-yellow-400'}`}>
                      {valuation.trend === 'rising' ? '📈 Rising market' : valuation.trend === 'declining' ? '📉 Declining market' : '➡️ Stable market'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gray-800 rounded-lg p-3">
                      <div className="text-gray-400 text-xs mb-1">Estimated Sale Value</div>
                      <div className="text-white font-bold">R {valuation.sale_min?.toLocaleString()} – R {valuation.sale_max?.toLocaleString()}</div>
                    </div>
                    <div className="bg-gray-800 rounded-lg p-3">
                      <div className="text-gray-400 text-xs mb-1">Estimated Monthly Rent</div>
                      <div className="text-white font-bold">R {valuation.rent_min?.toLocaleString()} – R {valuation.rent_max?.toLocaleString()}</div>
                    </div>
                  </div>
                  <p className="text-gray-400 text-xs">{valuation.reason}</p>
                  <button type="button" onClick={() => update('price', valuation.sale_min)}
                    className="text-xs text-blue-400 hover:text-blue-300 underline">
                    Use minimum estimate as asking price
                  </button>
                </div>
              )}
            </div>
          </div>
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h2 className="text-lg font-bold mb-4 text-orange-500">Property Size</h2>
            <div className="grid grid-cols-2 gap-4">
              {([['bedrooms','Bedrooms','3'],['bathrooms','Bathrooms','2'],['garages','Garages','2'],['size_sqm','Size m2','250']] as [string,string,string][]).map(([field,label,ph])=>(
                <div key={field}>
                  <label className="text-gray-300 text-sm mb-1 block">{label}</label>
                  <input value={(form as any)[field]} onChange={e => update(field, e.target.value)} type="number" className="w-full bg-gray-700 text-white rounded-lg px-4 py-3 outline-none border border-gray-600 focus:border-orange-500" placeholder={ph} />
                </div>
              ))}
            </div>
          </div>
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h2 className="text-lg font-bold mb-4 text-orange-500">Location</h2>
            <div className="space-y-4">
              <div>
                <label className="text-gray-300 text-sm mb-1 block">Street Address</label>
                <input value={form.address} onChange={e => update('address', e.target.value)} className="w-full bg-gray-700 text-white rounded-lg px-4 py-3 outline-none border border-gray-600 focus:border-orange-500" placeholder="12 Main Street" />
              </div>
              <div className="grid grid-cols-3 gap-4">
                {([['suburb','Suburb','Sandton'],['city','City','Johannesburg'],['province','Province','Gauteng']] as [string,string,string][]).map(([field,label,ph])=>(
                  <div key={field}>
                    <label className="text-gray-300 text-sm mb-1 block">{label}</label>
                    <input value={(form as any)[field]} onChange={e => update(field, e.target.value)} className="w-full bg-gray-700 text-white rounded-lg px-4 py-3 outline-none border border-gray-600 focus:border-orange-500" placeholder={ph} />
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h2 className="text-lg font-bold mb-4 text-orange-500">Property Features</h2>
            <div className="space-y-6">
              {featureGroups.map(group => (
                <div key={group.label}>
                  <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3 border-b border-gray-700 pb-2">{group.label}</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {group.features.map(([field, label]) => (
                      <label key={field} className="flex items-center gap-3 bg-gray-700 rounded-lg px-4 py-3 cursor-pointer hover:bg-gray-600 transition-colors">
                        <input type="checkbox" checked={(form as any)[field]} onChange={e => update(field, e.target.checked)} className="w-4 h-4 accent-orange-500" />
                        <span className="text-gray-300 text-sm">{label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
          {message && <div className={`p-4 rounded-lg text-center font-medium ${message.includes('success') ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'}`}>{message}</div>}
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h2 className="text-lg font-bold mb-4 text-orange-500">Property Photos</h2>
            <PhotoUpload propertyId={Date.now().toString()} onUpload={setPhotos} />
            {photos.length < 3 && (
              <p className="text-yellow-500 text-sm mt-2">⚠ Please upload at least 3 photos before submitting</p>
            )}
          </div>

          <button type="submit" disabled={loading || photos.length < 3} className="w-full bg-orange-500 text-black font-bold py-4 rounded-xl text-lg hover:bg-orange-400 transition-colors disabled:opacity-50">
            {loading ? 'Submitting...' : 'List My Property'}
          </button>
        </form>
      </div>
    </main>
  )
}
