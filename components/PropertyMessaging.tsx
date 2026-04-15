'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import MessageThread from './MessageThread'

export default function PropertyMessaging({ property }: { property: any }) {
  const [user, setUser] = useState<any>(null)
  const [showMessages, setShowMessages] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
  }, [])

  if (!user) return (
    <a href={`/auth/login?next=/property/${property.id}`}
      className="w-full bg-gray-700 text-white font-bold py-3 rounded-lg hover:bg-gray-600 transition-colors mb-3 block text-center">
      💬 Message Agent
    </a>
  )

  // Don't show message button if this is the agent's own listing
  if (user.id === property.user_id) return null

  return (
    <div className="mt-3">
      {!showMessages ? (
        <button
          onClick={() => setShowMessages(true)}
          className="w-full bg-gray-700 text-white font-bold py-3 rounded-lg hover:bg-gray-600 transition-colors">
          💬 Message Agent
        </button>
      ) : (
        <div className="h-96">
          <MessageThread
            propertyId={property.id}
            agentId={property.user_id}
            buyerId={user.id}
            currentUserId={user.id}
            currentUserType="buyer"
            propertyTitle={property.title}
          />
        </div>
      )}
    </div>
  )
}
