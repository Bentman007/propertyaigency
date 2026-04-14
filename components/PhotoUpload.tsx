'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function PhotoUpload({ propertyId, onUpload }: { propertyId: string, onUpload: (urls: string[]) => void }) {
  const [uploading, setUploading] = useState(false)
  const [uploaded, setUploaded] = useState<string[]>([])
  const [error, setError] = useState('')

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return
    setUploading(true)
    setError('')
    const urls: string[] = []

    for (const file of Array.from(files)) {
      if (file.size > 5 * 1024 * 1024) {
        setError(`${file.name} is too large. Max 5MB per photo.`)
        continue
      }
      const ext = file.name.split('.').pop()
      const path = `${propertyId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('Property Images')
        .upload(path, file)

      if (uploadError) {
        setError(uploadError.message)
      } else {
        const { data } = supabase.storage.from('Property Images').getPublicUrl(path)
        urls.push(data.publicUrl)
      }
    }

    const newUploaded = [...uploaded, ...urls]
    setUploaded(newUploaded)
    onUpload(newUploaded)
    setUploading(false)
  }

  return (
    <div>
      <div className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${uploading ? 'border-orange-500 bg-orange-500/5' : 'border-gray-600 hover:border-orange-500'}`}>
        <div className="text-4xl mb-3">📸</div>
        <p className="text-gray-300 font-medium mb-1">
          {uploading ? 'Uploading...' : 'Upload Property Photos'}
        </p>
        <p className="text-gray-500 text-sm mb-4">Max 5MB per photo · JPG, PNG, WebP · Multiple allowed</p>
        <label className="bg-orange-500 text-black font-bold px-6 py-2 rounded-lg cursor-pointer hover:bg-orange-400 transition-colors">
          {uploading ? 'Uploading...' : 'Choose Photos'}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            onChange={handleUpload}
            disabled={uploading}
            className="hidden"
          />
        </label>
      </div>

      {error && <p className="text-red-400 text-sm mt-2">{error}</p>}

      {uploaded.length > 0 && (
        <div className="mt-4">
          <p className="text-green-400 text-sm font-medium mb-2">✓ {uploaded.length} photo{uploaded.length > 1 ? 's' : ''} uploaded</p>
          <div className="grid grid-cols-4 gap-2">
            {uploaded.map((url, i) => (
              <div key={i} className="relative aspect-square rounded-lg overflow-hidden bg-gray-700">
                <img src={url} alt={`Property photo ${i + 1}`} className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
