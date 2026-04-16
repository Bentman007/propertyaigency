'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useParams, useRouter } from 'next/navigation'

export default function EditListing() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [photos, setPhotos] = useState<string[]>([])
  const [form, setForm] = useState<any>({
    title: '', description: '', price: '', price_type: 'sale',
    bedrooms: '', bathrooms: '', garages: '', size_sqm: '',
    property_type: 'house', address: '', suburb: '', city: '', province: ''
  })

  useEffect(() => {
    loadProperty()
  }, [id])

  const loadProperty = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) {
      setMessage('Property not found')
      setLoading(false)
      return
    }

    setForm({
      title: data.title || '',
      description: data.description || '',
      price: data.price?.toString() || '',
      price_type: data.price_type || 'sale',
      bedrooms: data.bedrooms?.toString() || '',
      bathrooms: data.bathrooms?.toString() || '',
      garages: data.garages?.toString() || '',
      size_sqm: data.size_sqm?.toString() || '',
      property_type: data.property_type || 'house',
      address: data.address || '',
      suburb: data.suburb || '',
      city: data.city || '',
      province: data.province || '',
    })
    setPhotos(data.photos || [])
    setLoading(false)
  }

  const handleSave = async () => {
    setSaving(true)
    const { error } = await supabase
      .from('properties')
      .update({
        ...form,
        price: parseFloat(form.price),
        bedrooms: parseInt(form.bedrooms),
        bathrooms: parseInt(form.bathrooms),
        garages: parseInt(form.garages) || 0,
        size_sqm: parseFloat(form.size_sqm) || null,
        photos
      })
      .eq('id', id)

    if (error) {
      setMessage('Error: ' + error.message)
    } else {
      setMessage('✅ Listing updated successfully!')
      setTimeout(() => router.push('/dashboard'), 1500)
    }
    setSaving(false)
  }

  const update = (field: string, value: any) => setForm((p: any) => ({ ...p, [field]: value }))

  if (loading) return (
    <main className="min-h-screen bg-gray-900 flex items-center justify-center">
      <p className="text-orange-500 animate-pulse text-xl">Loading your listing...</p>
    </main>
  )

  return (
    <main className="min-h-screen bg-gray-900 text-white">
      <nav className="bg-gray-800 border-b border-gray-700 px-6 py-4 flex justify-between items-center">
        <a href="/" className="text-2xl font-bold">Property<span className="text-orange-500">AI</span>gency</a>
        <a href="/dashboard" className="text-gray-400 hover:text-white text-sm">← Back to Dashboard</a>
      </nav>

      <div className="max-w-2xl mx-auto px-6 py-10 space-y-6">
        <h1 className="text-2xl font-bold">✏️ Edit Listing</h1>

        {message && (
          <div className={`p-4 rounded-xl ${message.includes('Error') ? 'bg-red-900 text-red-300' : 'bg-green-900 text-green-300'}`}>
            {message}
          </div>
        )}

        {/* Title */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 space-y-4">
          <h2 className="text-lg font-bold text-orange-500">Property Title</h2>
          <input value={form.title} onChange={e => update('title', e.target.value)}
            className="w-full bg-gray-700 text-white rounded-lg px-4 py-3 outline-none border border-gray-600 focus:border-orange-500"
            placeholder="Property title"/>
        </div>

        {/* Description */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 space-y-4">
          <h2 className="text-lg font-bold text-orange-500">Description</h2>
          <textarea value={form.description} onChange={e => update('description', e.target.value)}
            rows={6}
            className="w-full bg-gray-700 text-white rounded-lg px-4 py-3 outline-none border border-gray-600 focus:border-orange-500"
            placeholder="Property description"/>
        </div>

        {/* Price */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 space-y-4">
          <h2 className="text-lg font-bold text-orange-500">Price</h2>
          <div className="flex gap-3">
            <input value={form.price} onChange={e => update('price', e.target.value)}
              className="flex-1 bg-gray-700 text-white rounded-lg px-4 py-3 outline-none border border-gray-600 focus:border-orange-500"
              placeholder="Price" type="number"/>
            <select value={form.price_type} onChange={e => update('price_type', e.target.value)}
              className="bg-gray-700 text-white rounded-lg px-4 py-3 outline-none border border-gray-600 focus:border-orange-500">
              <option value="sale">For Sale</option>
              <option value="rent">To Rent</option>
            </select>
          </div>
        </div>

        {/* Details */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 space-y-4">
          <h2 className="text-lg font-bold text-orange-500">Property Details</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-gray-400 text-sm mb-1 block">Bedrooms</label>
              <input value={form.bedrooms} onChange={e => update('bedrooms', e.target.value)}
                className="w-full bg-gray-700 text-white rounded-lg px-4 py-3 outline-none border border-gray-600 focus:border-orange-500"
                type="number" placeholder="Bedrooms"/>
            </div>
            <div>
              <label className="text-gray-400 text-sm mb-1 block">Bathrooms</label>
              <input value={form.bathrooms} onChange={e => update('bathrooms', e.target.value)}
                className="w-full bg-gray-700 text-white rounded-lg px-4 py-3 outline-none border border-gray-600 focus:border-orange-500"
                type="number" placeholder="Bathrooms"/>
            </div>
            <div>
              <label className="text-gray-400 text-sm mb-1 block">Garages</label>
              <input value={form.garages} onChange={e => update('garages', e.target.value)}
                className="w-full bg-gray-700 text-white rounded-lg px-4 py-3 outline-none border border-gray-600 focus:border-orange-500"
                type="number" placeholder="Garages"/>
            </div>
            <div>
              <label className="text-gray-400 text-sm mb-1 block">Size (m²)</label>
              <input value={form.size_sqm} onChange={e => update('size_sqm', e.target.value)}
                className="w-full bg-gray-700 text-white rounded-lg px-4 py-3 outline-none border border-gray-600 focus:border-orange-500"
                type="number" placeholder="Size in m²"/>
            </div>
          </div>
        </div>

        {/* Save button */}
        <button onClick={handleSave} disabled={saving}
          className="w-full bg-orange-500 hover:bg-orange-400 text-black font-bold py-4 rounded-xl text-lg disabled:opacity-50 transition">
          {saving ? 'Saving...' : '✏️ Save Changes'}
        </button>

        <button onClick={() => router.push('/dashboard')}
          className="w-full bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-xl transition">
          Cancel
        </button>
      </div>
    </main>
  )
}
