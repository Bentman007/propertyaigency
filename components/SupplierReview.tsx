'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function SupplierReview({ supplierId }: { supplierId: string }) {
  const [user, setUser] = useState<any>(null)
  const [reviews, setReviews] = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)
  const [rating, setRating] = useState(0)
  const [review, setReview] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [hoveredStar, setHoveredStar] = useState(0)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
    fetchReviews()
  }, [supplierId])

  const fetchReviews = async () => {
    const { data } = await supabase
      .from('supplier_reviews')
      .select('*, profiles(full_name)')
      .eq('supplier_id', supplierId)
      .order('created_at', { ascending: false })
    setReviews(data || [])
  }

  const submitReview = async () => {
    if (!user || !rating) return
    setSubmitting(true)

    await supabase.from('supplier_reviews').insert({
      supplier_id: supplierId,
      user_id: user.id,
      rating,
      review
    })

    // Update supplier average rating
    const { data: allReviews } = await supabase
      .from('supplier_reviews')
      .select('rating')
      .eq('supplier_id', supplierId)

    if (allReviews) {
      const avg = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length
      await supabase.from('suppliers').update({
        rating: Math.round(avg * 10) / 10,
        review_count: allReviews.length
      }).eq('id', supplierId)
    }

    setSubmitted(true)
    setShowForm(false)
    fetchReviews()
    setSubmitting(false)
  }

  const avgRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0

  const renderStars = (count: number, size = 'text-lg') => {
    return Array.from({ length: 5 }).map((_, i) => (
      <span key={i} className={`${size} ${i < count ? 'text-yellow-400' : 'text-stone-400'}`}>★</span>
    ))
  }

  return (
    <div className="bg-white border border-stone-300 rounded-2xl p-6">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="font-bold text-lg">⭐ Reviews</h3>
          {reviews.length > 0 && (
            <div className="flex items-center gap-2 mt-1">
              <div className="flex">{renderStars(Math.round(avgRating))}</div>
              <span className="text-yellow-400 font-bold">{avgRating.toFixed(1)}</span>
              <span className="text-stone-500 text-sm">({reviews.length} review{reviews.length !== 1 ? 's' : ''})</span>
            </div>
          )}
        </div>
        {user && !submitted && !showForm && (
          <button onClick={() => setShowForm(true)}
            className="bg-orange-500 hover:bg-orange-400 text-black font-bold px-4 py-2 rounded-lg text-sm">
            Write a Review
          </button>
        )}
      </div>

      {/* Review form */}
      {showForm && (
        <div className="bg-stone-100 rounded-xl p-4 mb-4">
          <p className="font-semibold text-sm mb-3">Your Rating</p>
          <div className="flex gap-1 mb-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <button key={i}
                onMouseEnter={() => setHoveredStar(i + 1)}
                onMouseLeave={() => setHoveredStar(0)}
                onClick={() => setRating(i + 1)}
                className={`text-3xl transition ${i < (hoveredStar || rating) ? 'text-yellow-400' : 'text-stone-400'}`}>
                ★
              </button>
            ))}
          </div>
          <textarea value={review} onChange={e => setReview(e.target.value)}
            rows={3} placeholder="Share your experience with this supplier..."
            className="w-full bg-stone-200 text-stone-900 rounded-lg px-3 py-2 text-sm outline-none border border-gray-500 focus:border-orange-500 mb-3"/>
          <div className="flex gap-2">
            <button onClick={submitReview} disabled={submitting || !rating}
              className="flex-1 bg-orange-500 hover:bg-orange-400 text-black font-bold py-2 rounded-lg text-sm disabled:opacity-50">
              {submitting ? 'Submitting...' : '✓ Submit Review'}
            </button>
            <button onClick={() => setShowForm(false)}
              className="px-4 bg-stone-200 hover:bg-gray-500 text-stone-900 py-2 rounded-lg text-sm">
              Cancel
            </button>
          </div>
        </div>
      )}

      {submitted && (
        <div className="bg-green-900 border border-green-700 rounded-lg p-3 mb-4 text-sm text-green-300">
          ✅ Thank you for your review!
        </div>
      )}

      {/* Reviews list */}
      {reviews.length === 0 ? (
        <p className="text-stone-400 text-sm text-center py-4">No reviews yet — be the first!</p>
      ) : (
        <div className="space-y-3">
          {reviews.map(r => (
            <div key={r.id} className="border-t border-stone-300 pt-3">
              <div className="flex justify-between items-start mb-1">
                <div>
                  <p className="font-semibold text-sm">{r.profiles?.full_name || 'Anonymous'}</p>
                  <div className="flex">{renderStars(r.rating, 'text-sm')}</div>
                </div>
                <span className="text-stone-400 text-xs">
                  {new Date(r.created_at).toLocaleDateString('en-ZA', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              </div>
              {r.review && <p className="text-stone-700 text-sm mt-1">{r.review}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
