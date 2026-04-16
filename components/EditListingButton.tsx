'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function EditListingButton({ propertyId, agentId }: { propertyId: string, agentId: string }) {
  const [isOwner, setIsOwner] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user?.id === agentId) setIsOwner(true)
    })
  }, [agentId])

  if (!isOwner) return null

  return (
    <Link href={`/list/edit/${propertyId}`}
      className="bg-orange-500 hover:bg-orange-400 text-black font-bold px-4 py-2 rounded-lg text-sm transition">
      ✏️ Edit Listing
    </Link>
  )
}
