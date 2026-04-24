'use client'

import { useState } from 'react'

export default function PhotoGallery({ photos, title }: { photos: string[], title: string }) {
  const [current, setCurrent] = useState(0)
  const [showAll, setShowAll] = useState(false)

  if (!photos || photos.length === 0) return (
    <div className="bg-white rounded-2xl h-80 flex items-center justify-center text-8xl mb-8 border border-stone-300">
      🏡
    </div>
  )

  return (
    <div className="mb-8">
      {/* Main photo with arrows */}
      <div className="relative rounded-2xl h-96 overflow-hidden bg-white border border-stone-300">
        <img 
          src={photos[current]} 
          alt={`${title} ${current + 1}`} 
          className="w-full h-full object-cover"
        />
        
        {/* Photo counter */}
        <div className="absolute top-4 right-4 bg-black bg-opacity-60 text-stone-900 text-sm px-3 py-1 rounded-full">
          {current + 1} / {photos.length}
        </div>

        {/* Left arrow */}
        {current > 0 && (
          <button
            onClick={() => setCurrent(current - 1)}
            className="absolute left-3 top-1/2 -translate-y-1/2 bg-black bg-opacity-60 hover:bg-opacity-80 text-stone-900 w-10 h-10 rounded-full flex items-center justify-center text-xl transition"
          >
            ‹
          </button>
        )}

        {/* Right arrow */}
        {current < photos.length - 1 && (
          <button
            onClick={() => setCurrent(current + 1)}
            className="absolute right-3 top-1/2 -translate-y-1/2 bg-black bg-opacity-60 hover:bg-opacity-80 text-stone-900 w-10 h-10 rounded-full flex items-center justify-center text-xl transition"
          >
            ›
          </button>
        )}

        {/* View all button */}
        {photos.length > 1 && (
          <button
            onClick={() => setShowAll(true)}
            className="absolute bottom-4 right-4 bg-white text-black text-sm font-semibold px-3 py-1.5 rounded-lg hover:bg-gray-100 transition"
          >
            📷 All {photos.length} photos
          </button>
        )}
      </div>

      {/* Thumbnail strip */}
      {photos.length > 1 && (
        <div className="flex gap-2 mt-2 overflow-x-auto pb-1">
          {photos.map((photo, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`flex-shrink-0 w-20 h-16 rounded-lg overflow-hidden border-2 transition ${
                current === i ? 'border-orange-500' : 'border-stone-300 hover:border-gray-500'
              }`}
            >
              <img src={photo} alt={`${title} ${i + 1}`} className="w-full h-full object-cover"/>
            </button>
          ))}
        </div>
      )}

      {/* Full screen gallery modal */}
      {showAll && (
        <div className="fixed inset-0 bg-black bg-opacity-95 z-50 flex flex-col">
          <div className="flex justify-between items-center px-6 py-4">
            <span className="text-stone-900 font-semibold">{title} — {current + 1} of {photos.length}</span>
            <button onClick={() => setShowAll(false)} className="text-stone-900 hover:text-orange-500 text-2xl">✕</button>
          </div>
          
          <div className="flex-1 flex items-center justify-center relative px-16">
            <img src={photos[current]} alt={title} className="max-h-full max-w-full object-contain rounded-lg"/>
            
            {current > 0 && (
              <button onClick={() => setCurrent(current - 1)}
                className="absolute left-4 bg-white bg-opacity-20 hover:bg-opacity-40 text-stone-900 w-12 h-12 rounded-full flex items-center justify-center text-2xl">
                ‹
              </button>
            )}
            {current < photos.length - 1 && (
              <button onClick={() => setCurrent(current + 1)}
                className="absolute right-4 bg-white bg-opacity-20 hover:bg-opacity-40 text-stone-900 w-12 h-12 rounded-full flex items-center justify-center text-2xl">
                ›
              </button>
            )}
          </div>

          <div className="flex gap-2 justify-center p-4 overflow-x-auto">
            {photos.map((photo, i) => (
              <button key={i} onClick={() => setCurrent(i)}
                className={`flex-shrink-0 w-16 h-12 rounded overflow-hidden border-2 ${current === i ? 'border-orange-500' : 'border-transparent'}`}>
                <img src={photo} alt="" className="w-full h-full object-cover"/>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
