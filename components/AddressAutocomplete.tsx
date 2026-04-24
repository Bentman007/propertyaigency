'use client'

import { useEffect, useRef, useState } from 'react'

interface AddressResult {
  address: string
  suburb: string
  city: string
  province: string
  lat?: number
  lng?: number
}

export default function AddressAutocomplete({ onSelect }: { onSelect: (result: AddressResult) => void }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if ((window as any).google) { setLoaded(true); return }

    // Only add script if not already present
    const existing = document.querySelector('script[src*="maps.googleapis.com"]')
    if (existing) {
      existing.addEventListener('load', () => setLoaded(true))
      return
    }

    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_PLACES_KEY}&libraries=places`
    script.async = true
    script.onload = () => setLoaded(true)
    document.head.appendChild(script)
  }, [])

  useEffect(() => {
    if (!loaded || !inputRef.current) return
    const autocomplete = new (window as any).google.maps.places.Autocomplete(inputRef.current, {
      componentRestrictions: { country: 'za' },
      fields: ['address_components', 'formatted_address', 'geometry']
    })

    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace()
      if (!place.address_components) return
      let suburb = '', city = '', province = '', streetNumber = '', streetName = ''
      for (const component of place.address_components) {
        const types = component.types
        if (types.includes('street_number')) streetNumber = component.long_name
        if (types.includes('route')) streetName = component.long_name
        if (types.includes('sublocality') || types.includes('neighborhood')) suburb = component.long_name
        if (types.includes('locality')) city = component.long_name
        if (types.includes('administrative_area_level_1')) province = component.long_name
      }
      onSelect({
        address: `${streetNumber} ${streetName}`.trim() || place.formatted_address,
        suburb,
        city,
        province,
        lat: place.geometry?.location?.lat(),
        lng: place.geometry?.location?.lng(),
      })
    })
  }, [loaded, onSelect])

  return (
    <input
      ref={inputRef}
      type="text"
      className="w-full bg-amber-50 text-stone-800 rounded-lg px-4 py-3 outline-none border border-stone-300 focus:border-orange-500"
      placeholder="Start typing your property address..."
    />
  )
}
