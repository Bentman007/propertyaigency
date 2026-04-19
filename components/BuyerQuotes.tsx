'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import SupplierReview from './SupplierReview'

export default function BuyerQuotes({ userId }: { userId: string }) {
  const [requests, setRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [reviewingSupplierId, setReviewingSupplierId] = useState<string | null>(null)

  useEffect(() => {
    fetchRequests()
  }, [userId])

  const fetchRequests = async () => {
    const { data } = await supabase
      .from('move_quote_requests')
      .select('*, supplier_quotes(*, suppliers(business_name, service_type, phone, rating, review_count))')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    setRequests(data || [])
    setLoading(false)
  }

  const acceptQuote = async (quoteId: string, requestId: string) => {
    await supabase.from('supplier_quotes').update({ status: 'accepted' }).eq('id', quoteId)
    await supabase.from('move_quote_requests').update({ status: 'accepted' }).eq('id', requestId)
    fetchRequests()
  }

  const declineQuote = async (quoteId: string) => {
    await supabase.from('supplier_quotes').update({ status: 'declined' }).eq('id', quoteId)
    fetchRequests()
  }

  const serviceIcon: {[key: string]: string} = {
    removal: '🚛', cleaning: '🧹', garden: '🌿', pool: '🏊',
    legal: '⚖️', mortgage: '🏦', surveyor: '📋', handyman: '🔧'
  }

  if (loading) return null
  if (requests.length === 0) return null

  return (
    <div className="mb-8">
      <h2 className="text-xl font-bold mb-4">📦 My Moving Quotes</h2>
      <div className="space-y-4">
        {requests.map(req => (
          <div key={req.id} className="bg-gray-800 border border-gray-700 rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-700 flex justify-between items-center">
              <div>
                <p className="font-bold">
                  {serviceIcon[req.service_type]} {req.service_type.charAt(0).toUpperCase() + req.service_type.slice(1)} Service
                </p>
                {req.from_address && (
                  <p className="text-gray-400 text-xs mt-0.5">{req.from_address} → {req.to_address}</p>
                )}
              </div>
              <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                req.status === 'accepted' ? 'bg-green-900 text-green-300' :
                req.status === 'pending' ? 'bg-yellow-900 text-yellow-300' :
                'bg-gray-700 text-gray-400'
              }`}>{req.status}</span>
            </div>

            {req.supplier_quotes?.length === 0 ? (
              <div className="px-5 py-4 text-gray-500 text-sm">
                ⏳ Waiting for supplier quotes (within 24 hours)...
              </div>
            ) : (
              <div className="divide-y divide-gray-700">
                {req.supplier_quotes?.map((quote: any) => (
                  <div key={quote.id} className="px-5 py-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-semibold">{quote.suppliers?.business_name}</p>
                        <div className="flex items-center gap-1 mt-0.5">
                          <span className="text-yellow-400 text-sm">★</span>
                          <span className="text-sm text-gray-300">{quote.suppliers?.rating || 'New'}</span>
                          <span className="text-gray-500 text-xs">({quote.suppliers?.review_count || 0} reviews)</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-orange-500">R {quote.amount?.toLocaleString()}</p>
                        {quote.valid_until && (
                          <p className="text-gray-500 text-xs">Valid until {new Date(quote.valid_until).toLocaleDateString('en-ZA', { month: 'short', day: 'numeric' })}</p>
                        )}
                      </div>
                    </div>

                    {quote.description && (
                      <p className="text-gray-400 text-sm mb-3">{quote.description}</p>
                    )}

                    {quote.status === 'pending' && req.status !== 'accepted' && (
                      <div className="flex gap-2">
                        <button onClick={() => acceptQuote(quote.id, req.id)}
                          className="flex-1 bg-green-600 hover:bg-green-500 text-white font-bold py-2 rounded-lg text-sm transition">
                          ✅ Accept Quote
                        </button>
                        <button onClick={() => declineQuote(quote.id)}
                          className="flex-1 bg-gray-700 hover:bg-gray-600 text-gray-300 py-2 rounded-lg text-sm transition">
                          Decline
                        </button>
                        {quote.suppliers?.phone && (
                          <a href={`tel:${quote.suppliers.phone}`}
                            className="px-4 bg-blue-700 hover:bg-blue-600 text-white py-2 rounded-lg text-sm transition">
                            📞 Call
                          </a>
                        )}
                      </div>
                    )}

                    {quote.status === 'accepted' && (
                      <div className="space-y-3">
                        <div className="bg-green-900 border border-green-700 rounded-lg p-3 text-sm text-green-300">
                          ✅ Quote accepted! {quote.suppliers?.phone && `Call them on ${quote.suppliers.phone} to confirm details.`}
                        </div>
                        <button onClick={() => setReviewingSupplierId(
                          reviewingSupplierId === quote.suppliers?.id ? null : quote.suppliers?.id
                        )}
                          className="text-orange-500 hover:underline text-sm">
                          {reviewingSupplierId === quote.suppliers?.id ? 'Hide review form' : '⭐ Leave a review'}
                        </button>
                        {reviewingSupplierId === quote.suppliers?.id && (
                          <SupplierReview supplierId={quote.suppliers.id} />
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
