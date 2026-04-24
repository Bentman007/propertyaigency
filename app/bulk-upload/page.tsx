'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function BulkUploadPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<any[]>([])
  const [step, setStep] = useState(1)
  const [csvData, setCsvData] = useState<any[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { window.location.href = '/auth/login'; return }
      const accountType = data.user.user_metadata?.account_type
      if (accountType !== 'agent') { window.location.href = '/dashboard'; return }
      setUser(data.user)
    })
  }, [])

  const handleCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string
        const lines = text.split('\n').filter(l => l.trim())
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/\s+/g, '_'))
        
        const data = lines.slice(1).map(line => {
          const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''))
          const obj: any = {}
          headers.forEach((h, i) => { obj[h] = values[i] || '' })
          return obj
        }).filter(row => row.title || row.address)

        setCsvData(data)
        setStep(2)
        setError('')
      } catch (e) {
        setError('Error reading CSV file. Please check the format.')
      }
    }
    reader.readAsText(file)
  }

  const handleUpload = async () => {
    if (!user || csvData.length === 0) return
    setLoading(true)
    const uploadResults = []

    // Check current listing count vs plan limit
    const { count } = await supabase
      .from('properties')
      .select('id', { count: 'exact' })
      .eq('user_id', user.id)
      .eq('status', 'active')

    const planLimits: {[key: string]: number} = {
      starter: 10, growth: 30, pro: 50, agency: 100
    }
    const userPlan = user.user_metadata?.plan || 'starter'
    const limit = planLimits[userPlan] || 10
    const currentCount = count || 0
    const availableSlots = Math.max(0, limit - currentCount)

    if (availableSlots === 0) {
      setError(`You have reached your ${limit} listing limit on your current plan. Please upgrade to add more listings.`)
      setLoading(false)
      return
    }

    if (csvData.length > availableSlots) {
      setError(`You can only upload ${availableSlots} more properties on your current plan (${currentCount}/${limit} used). Only the first ${availableSlots} will be uploaded. Consider upgrading your plan.`)
    }

    const dataToUpload = csvData.slice(0, availableSlots)

    for (const row of dataToUpload) {
      try {
        const { data, error } = await supabase.from('properties').insert({
          user_id: user.id,
          title: row.title || `${row.property_type || 'Property'} in ${row.suburb || row.city}`,
          description: row.description || '',
          price: parseFloat(row.price) || 0,
          price_type: row.price_type?.toLowerCase() === 'rent' ? 'rent' : 'sale',
          bedrooms: parseInt(row.bedrooms) || 0,
          bathrooms: parseInt(row.bathrooms) || 0,
          garages: parseInt(row.garages) || 0,
          size_sqm: parseFloat(row.size_sqm) || null,
          property_type: row.property_type?.toLowerCase() || 'house',
          address: row.address || '',
          suburb: row.suburb || '',
          city: row.city || '',
          province: row.province || '',
          status: 'draft',
          photos: []
        }).select()

        // Generate AI description if none provided
        if (data?.[0]?.id && !row.description) {
          try {
            const aiRes = await fetch('/api/generate-listing', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                title: row.title,
                bedrooms: row.bedrooms,
                bathrooms: row.bathrooms,
                suburb: row.suburb,
                city: row.city,
                price: row.price,
                price_type: row.price_type,
                property_type: row.property_type
              })
            })
            const aiData = await aiRes.json()
            if (aiData.description) {
              await supabase.from('properties')
                .update({ description: aiData.description })
                .eq('id', data[0].id)
            }
          } catch (e) {}
        }

        if (error) {
          uploadResults.push({ title: row.title, status: 'error', message: error.message })
        } else {
          uploadResults.push({ title: row.title, status: 'success', id: data?.[0]?.id })
        }
      } catch (e: any) {
        uploadResults.push({ title: row.title, status: 'error', message: e.message })
      }
    }

    setResults(uploadResults)
    setStep(3)
    setLoading(false)
  }

  const downloadTemplate = () => {
    const headers = 'title,description,price,price_type,bedrooms,bathrooms,garages,size_sqm,property_type,address,suburb,city,province'
    const example = '"Beautiful Family Home","Spacious 4 bed home with pool",2500000,sale,4,3,2,250,house,"12 Main Road","Sandton","Johannesburg","Gauteng"'
    const csv = `${headers}\n${example}`
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'propertyaigency-bulk-template.csv'
    a.click()
  }

  const successCount = results.filter(r => r.status === 'success').length
  const errorCount = results.filter(r => r.status === 'error').length

  return (
    <main className="min-h-screen bg-amber-50 text-stone-900">
      <nav className="bg-white border-b border-stone-300 px-6 py-4 flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold">Property<span className="text-orange-500">AI</span>gency</Link>
        <Link href="/dashboard" className="text-stone-300 hover:text-white text-sm">← Back to Dashboard</Link>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">📦 Bulk Listing Upload</h1>
          <p className="text-stone-500">Upload multiple properties at once using a CSV file</p>
        </div>

        {/* Steps indicator */}
        <div className="flex items-center gap-3 mb-8">
          {[1, 2, 3].map(s => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                step >= s ? 'bg-orange-500 text-black' : 'bg-stone-100 text-stone-500'
              }`}>{s}</div>
              <span className="text-sm text-stone-500">
                {s === 1 ? 'Upload CSV' : s === 2 ? 'Preview' : 'Done'}
              </span>
              {s < 3 && <div className={`w-12 h-0.5 ${step > s ? 'bg-orange-500' : 'bg-stone-100'}`}/>}
            </div>
          ))}
        </div>

        {/* Step 1 - Upload */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="bg-white border border-stone-300 rounded-2xl p-8 text-center">
              <p className="text-4xl mb-4">📄</p>
              <h2 className="text-xl font-bold mb-2">Upload your CSV file</h2>
              <p className="text-stone-500 text-sm mb-6">Your CSV must have headers matching our template</p>
              
              <label className="cursor-pointer inline-block bg-orange-500 hover:bg-orange-400 text-black font-bold px-8 py-3 rounded-xl transition mb-4">
                Choose CSV File
                <input type="file" accept=".csv" onChange={handleCSV} className="hidden"/>
              </label>

              {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
            </div>

            <div className="bg-white border border-stone-300 rounded-2xl p-6">
              <h3 className="font-bold mb-3">📋 Required CSV Format</h3>
              <div className="bg-stone-100 rounded-lg p-3 text-xs font-mono text-stone-700 overflow-x-auto mb-4">
                title, description, price, price_type, bedrooms, bathrooms, garages, size_sqm, property_type, address, suburb, city, province
              </div>
              <div className="text-sm text-stone-500 space-y-1 mb-4">
                <p>• <strong className="text-stone-900">price_type:</strong> "sale" or "rent"</p>
                <p>• <strong className="text-stone-900">property_type:</strong> house, apartment, townhouse, farm, etc</p>
                <p>• <strong className="text-stone-900">price:</strong> numbers only, no R symbol</p>
              </div>
              <button onClick={downloadTemplate}
                className="bg-stone-100 hover:bg-stone-200 text-stone-900 px-4 py-2 rounded-lg text-sm transition">
                ⬇️ Download Template
              </button>
            </div>
          </div>
        )}

        {/* Step 2 - Preview */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="bg-green-900 border border-green-700 rounded-xl p-4">
              <p className="text-green-300 font-semibold">✅ {csvData.length} properties ready to upload</p>
            </div>

            <div className="bg-white border border-stone-300 rounded-2xl overflow-hidden">
              <div className="px-5 py-3 border-b border-stone-300">
                <p className="font-semibold text-sm">Preview</p>
              </div>
              <div className="divide-y divide-gray-700 max-h-80 overflow-y-auto">
                {csvData.map((row, i) => (
                  <div key={i} className="px-5 py-3 flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-sm">{row.title || 'Untitled'}</p>
                      <p className="text-stone-500 text-xs">{row.suburb}, {row.city} · {row.bedrooms} beds · R{parseInt(row.price).toLocaleString()}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                      row.price_type === 'rent' ? 'bg-blue-900 text-blue-300' : 'bg-orange-900 text-orange-300'
                    }`}>
                      {row.price_type === 'rent' ? 'To Rent' : 'For Sale'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => { setStep(1); setCsvData([]) }}
                className="flex-1 bg-stone-100 hover:bg-stone-200 text-stone-900 font-bold py-3 rounded-xl transition">
                ← Start Over
              </button>
              <button onClick={handleUpload} disabled={loading}
                className="flex-2 flex-grow bg-orange-500 hover:bg-orange-400 text-black font-bold py-3 rounded-xl disabled:opacity-50 transition">
                {loading ? `Uploading... (${results.length}/${csvData.length})` : `🚀 Upload ${csvData.length} Properties`}
              </button>
            </div>
          </div>
        )}

        {/* Step 3 - Results */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-green-900 border border-green-700 rounded-xl p-4 text-center">
                <p className="text-3xl font-bold text-green-300">{successCount}</p>
                <p className="text-green-400 text-sm">Successfully uploaded</p>
              </div>
              <div className={`border rounded-xl p-4 text-center ${errorCount > 0 ? 'bg-red-900 border-red-700' : 'bg-white border-stone-300'}`}>
                <p className={`text-3xl font-bold ${errorCount > 0 ? 'text-red-300' : 'text-stone-500'}`}>{errorCount}</p>
                <p className={`text-sm ${errorCount > 0 ? 'text-red-400' : 'text-stone-400'}`}>Failed</p>
              </div>
            </div>

            {errorCount > 0 && (
              <div className="bg-white border border-stone-300 rounded-2xl overflow-hidden">
                <div className="px-5 py-3 border-b border-stone-300">
                  <p className="font-semibold text-sm text-red-400">Failed uploads</p>
                </div>
                {results.filter(r => r.status === 'error').map((r, i) => (
                  <div key={i} className="px-5 py-3 border-b border-stone-300">
                    <p className="text-sm font-semibold">{r.title}</p>
                    <p className="text-red-400 text-xs">{r.message}</p>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-3">
              <Link href="/dashboard"
                className="flex-1 bg-orange-500 hover:bg-orange-400 text-black font-bold py-3 rounded-xl text-center transition">
                View My Listings →
              </Link>
              <button onClick={() => { setStep(1); setCsvData([]); setResults([]) }}
                className="flex-1 bg-stone-100 hover:bg-stone-200 text-stone-900 font-bold py-3 rounded-xl transition">
                Upload More
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
