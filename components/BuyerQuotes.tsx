'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import SupplierReview from './SupplierReview'
import SupplierMessageThread from './SupplierMessageThread'

export default function BuyerQuotes({ userId }: { userId: string }) {
  const [requests, setRequests]   = useState<any[]>([])
  const [loading, setLoading]     = useState(true)
  const [reviewingSupplierId, setReviewingSupplierId] = useState<string | null>(null)
  const [findingAlternatives, setFindingAlternatives] = useState<string | null>(null)
  const [messagingQuote, setMessagingQuote] = useState<string | null>(null)
  const [alternatives, setAlternatives] = useState<{ [reqId: string]: any[] }>({})

  useEffect(() => { fetchRequests() }, [userId])

  const fetchRequests = async () => {
    const { data } = await supabase
      .from('move_quote_requests')
      .select('*, supplier_quotes(*, suppliers(id, business_name, logo_url, service_type, phone, rating, review_count, ai_profile, areas_served, total_leads_received))')
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

  const findAlternatives = async (req: any) => {
    setFindingAlternatives(req.id)
    const existingSupplierIds = req.supplier_quotes?.map((q: any) => q.suppliers?.id).filter(Boolean) || []
    const { data } = await supabase
      .from('suppliers')
      .select('id, business_name, logo_url, rating, review_count, ai_profile, areas_served, total_leads_received, phone')
      .eq('service_type', req.service_type)
      .eq('is_active', true)
      .eq('is_paused', false)
      .not('id', 'in', `(${existingSupplierIds.join(',')})`)
      .limit(3)
    setAlternatives(prev => ({ ...prev, [req.id]: data || [] }))
    setFindingAlternatives(null)
  }

  const requestAlternativeQuote = async (req: any, supplierId: string) => {
    await fetch('/api/notify-suppliers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        request_id:         req.id,
        service_type:       req.service_type,
        selected_suppliers: [supplierId],
        from_address:       req.from_address,
        to_address:         req.to_address,
      }),
    })
    setAlternatives(prev => ({ ...prev, [req.id]: (prev[req.id] || []).filter(s => s.id !== supplierId) }))
    fetchRequests()
  }

  const serviceIcon: { [key: string]: string } = {
    removal: '🚛', cleaning: '🧹', landscaper: '🌿', pool_service: '🏊',
    conveyancing_attorney: '⚖️', bond_originator: '🏦', home_inspector: '🔍',
    handyman: '🛠️', photographer: '📸', virtual_tour: '🏠', home_stager: '🛋️',
    solar_installer: '☀️', architect: '📐', str_manager: '🏖️',
    property_management: '🏢', insurance_broker: '🛡️', property_valuer: '📊',
    videographer: '🎬', interior_designer: '🎨', storage: '📦',
    painter: '🖌️', builder: '🏗️', plumber: '🔧', electrician: '⚡', security: '🔒',
  }

  if (loading || requests.length === 0) return null

  return (
    <div className="mb-8">
      <h2 className="text-xl font-bold mb-4">My Service Quotes</h2>
      <div className="space-y-4">
        {requests.map(req => {
          const allDeclined = req.supplier_quotes?.length > 0 &&
            req.supplier_quotes.every((q: any) => q.status === 'declined')
          const hasAccepted = req.supplier_quotes?.some((q: any) => q.status === 'accepted')

          return (
            <div key={req.id} className="bg-white border border-stone-300 rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-stone-300 flex justify-between items-center">
                <div>
                  <p className="font-bold">
                    {serviceIcon[req.service_type] || '📦'} {req.service_type.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())}
                  </p>
                  {req.from_address && (
                    <p className="text-stone-500 text-xs mt-0.5">{req.from_address} → {req.to_address}</p>
                  )}
                </div>
                <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                  req.status === 'accepted' ? 'bg-green-900 text-green-300' :
                  req.status === 'pending'  ? 'bg-yellow-900 text-yellow-300' :
                  'bg-stone-100 text-stone-500'
                }`}>{req.status}</span>
              </div>

              {req.supplier_quotes?.length === 0 ? (
                <div className="px-5 py-4 text-stone-400 text-sm">
                  Waiting for supplier quotes (within 24 hours)...
                </div>
              ) : (
                <div className="divide-y divide-gray-700">
                  {req.supplier_quotes?.map((quote: any) => (
                    <div key={quote.id} className="px-5 py-4">
                      <div className="flex items-start gap-3 mb-2">
                        {quote.suppliers?.logo_url
                          ? <img src={quote.suppliers.logo_url} alt="" className="w-10 h-10 rounded-lg object-contain bg-stone-100 flex-shrink-0"/>
                          : <div className="w-10 h-10 rounded-lg bg-stone-100 flex items-center justify-center text-lg flex-shrink-0">🏢</div>
                        }
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-semibold">{quote.suppliers?.business_name}</p>
                              <div className="flex items-center gap-1 mt-0.5">
                                {quote.suppliers?.rating > 0 && (
                                  <span className="text-sm text-stone-700">★ {quote.suppliers.rating}/5 ({quote.suppliers.review_count} reviews)</span>
                                )}
                              </div>
                              <p className="text-stone-400 text-xs mt-0.5">Trusted by {quote.suppliers?.total_leads_received || 0} PropertyAIgency clients</p>
                            </div>
                            <div className="text-right">
                              <p className="text-2xl font-bold text-orange-500">R{quote.amount?.toLocaleString()}</p>
                              {quote.valid_until && (
                                <p className="text-stone-400 text-xs">Valid until {new Date(quote.valid_until).toLocaleDateString('en-ZA', { month: 'short', day: 'numeric' })}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {quote.description && <p className="text-stone-500 text-sm mb-3">{quote.description}</p>}

                      {quote.status === 'pending' && !hasAccepted && (
                        <div className="flex gap-2">
                          <button onClick={() => acceptQuote(quote.id, req.id)}
                            className="flex-1 bg-green-600 hover:bg-green-500 text-white font-bold py-2 rounded-lg text-sm transition">
                            Accept Quote
                          </button>
                          <button onClick={() => declineQuote(quote.id)}
                            className="flex-1 bg-stone-100 hover:bg-stone-200 text-stone-700 py-2 rounded-lg text-sm transition">
                            Decline
                          </button>
                        </div>
                      )}

                      {quote.status === 'declined' && (
                        <p className="text-stone-400 text-xs">Declined</p>
                      )}

                      {quote.status === 'pending' && (
                        <button onClick={() => setMessagingQuote(messagingQuote === quote.id ? null : quote.id)}
                          className="mt-2 text-orange-400 hover:text-orange-300 text-xs">
                          {messagingQuote === quote.id ? 'Hide messages' : '💬 Ask a question about this quote'}
                        </button>
                      )}
                      {messagingQuote === quote.id && (
                        <div className="mt-3">
                          <SupplierMessageThread
                            requestId={req.id}
                            supplierId={quote.suppliers?.id}
                            buyerId={userId}
                            currentUserId={userId}
                            currentUserType="buyer"
                            supplierName={quote.suppliers?.business_name}
                            serviceType={req.service_type}
                          />
                        </div>
                      )}

                      {quote.status === 'accepted' && (
                        <div className="space-y-3">
                          <div className="bg-green-900 border border-green-700 rounded-lg p-3 text-sm text-green-300">
                            Quote accepted! PropertyAIgency will connect you with {quote.suppliers?.business_name} shortly.
                          </div>
                          <button onClick={() => setReviewingSupplierId(
                            reviewingSupplierId === quote.suppliers?.id ? null : quote.suppliers?.id
                          )} className="text-orange-500 hover:underline text-sm">
                            {reviewingSupplierId === quote.suppliers?.id ? 'Hide review' : 'Leave a review'}
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

              {/* Find alternatives */}
              {allDeclined && !hasAccepted && (
                <div className="px-5 py-4 border-t border-stone-300 bg-stone-50">
                  {alternatives[req.id]?.length > 0 ? (
                    <div>
                      <p className="font-semibold text-sm mb-3">Alternative suppliers in your area:</p>
                      <div className="space-y-3">
                        {alternatives[req.id].map((sup: any) => (
                          <div key={sup.id} className="flex items-center justify-between gap-3 bg-stone-100 rounded-xl p-3">
                            <div className="flex items-center gap-3">
                              {sup.logo_url
                                ? <img src={sup.logo_url} alt="" className="w-9 h-9 rounded-lg object-contain bg-stone-200"/>
                                : <div className="w-9 h-9 rounded-lg bg-stone-200 flex items-center justify-center text-lg">🏢</div>
                              }
                              <div>
                                <p className="font-semibold text-sm">{sup.business_name}</p>
                                {sup.rating > 0 && <p className="text-xs text-stone-500">★ {sup.rating}/5</p>}
                              </div>
                            </div>
                            <button onClick={() => requestAlternativeQuote(req, sup.id)}
                              className="bg-orange-500 hover:bg-orange-400 text-black font-bold px-3 py-1.5 rounded-lg text-xs transition">
                              Request Quote
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center">
                      <p className="text-stone-500 text-sm mb-3">All quotes declined. Shall we find alternative suppliers?</p>
                      <button onClick={() => findAlternatives(req)}
                        disabled={findingAlternatives === req.id}
                        className="bg-orange-500 hover:bg-orange-400 text-black font-bold px-6 py-2 rounded-xl text-sm disabled:opacity-50 transition">
                        {findingAlternatives === req.id ? 'Searching...' : 'Find Alternative Suppliers'}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
