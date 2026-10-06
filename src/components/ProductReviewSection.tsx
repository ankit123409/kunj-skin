import { useEffect, useMemo, useState } from 'react'
import './ProductReviewSection.css'
import {
  createReviewApi,
  deleteReviewApi,
  getAuthToken,
  getProductReviewsApi,
  getReviewId,
  type ProductReview,
} from '../api/api'
import { trackFormSubmission } from '../analytics/googleAnalytics'
import { useAppDispatch } from '../hooks'
import { openProfile } from '../store/uiSlice'

const RATING_LABELS = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent']

function StarPicker({
  value,
  onChange,
}: {
  value: number
  onChange: (rating: number) => void
}) {
  const [hover, setHover] = useState(0)
  const active = hover || value

  return (
    <div className="rate-stars" onMouseLeave={() => setHover(0)}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          className={`rate-star${star <= active ? ' is-on' : ''}`}
          aria-label={`${star} ${RATING_LABELS[star]}`}
          onMouseEnter={() => setHover(star)}
          onFocus={() => setHover(star)}
          onBlur={() => setHover(0)}
          onClick={() => onChange(star)}
        >
          ★
        </button>
      ))}
      {active > 0 && <span className="rate-label">{RATING_LABELS[active]}</span>}
    </div>
  )
}

function StarReadout({ rating }: { rating: number }) {
  const filled = Math.max(0, Math.min(5, Math.round(rating)))
  return (
    <span className="review-readout" aria-label={`${filled} star rating`}>
      {Array.from({ length: 5 }).map((_, index) => (
        <span key={index} className={index < filled ? 'is-on' : ''}>★</span>
      ))}
    </span>
  )
}

export default function ProductReviewSection({
  productId,
  productTitle,
  isAdmin,
}: {
  productId: string
  productTitle: string
  isAdmin: boolean
}) {
  const dispatch = useAppDispatch()
  const [reviews, setReviews] = useState<ProductReview[]>([])
  const [loading, setLoading] = useState(true)
  const [rating, setRating] = useState(0)
  const [review, setReview] = useState('')
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const loadReviews = async (id: string) => {
    try {
      setLoading(true)
      const list = await getProductReviewsApi(id)
      setReviews(list)
    } catch {
      setReviews([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadReviews(productId)
  }, [productId])

  const average = useMemo(() => {
    if (reviews.length === 0) return 0
    const total = reviews.reduce((sum, item) => sum + Number(item.rating || 0), 0)
    return total / reviews.length
  }, [reviews])

  const handleSubmit = async () => {
    setError('')
    setMessage('')

    const token = getAuthToken()
    if (!token) {
      setError('Please login to add a review.')
      dispatch(openProfile())
      return
    }
    if (rating < 1) {
      setError('Select a star rating.')
      return
    }
    if (!review.trim()) {
      setError('Write a review before submitting.')
      return
    }

    try {
      setSaving(true)
      const response = await createReviewApi(
        { product_id: productId, review: review.trim(), rating },
        token,
      )
      setReview('')
      setRating(0)
      setMessage(response.message || 'Review added.')
      trackFormSubmission('product_review', { product_id: productId, rating })
      await loadReviews(productId)
    } catch (err: unknown) {
      const apiError = err as { response?: { data?: { message?: string; error?: string } } }
      setError(apiError.response?.data?.message || apiError.response?.data?.error || 'Unable to add review.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    const token = getAuthToken()
    if (!token) {
      setError('Please login again as admin.')
      return
    }

    try {
      setDeletingId(id)
      setError('')
      await deleteReviewApi(id, token)
      setReviews((current) => current.filter((item) => getReviewId(item) !== id))
    } catch (err: unknown) {
      const apiError = err as { response?: { data?: { message?: string; error?: string } } }
      setError(apiError.response?.data?.message || apiError.response?.data?.error || 'Unable to delete review.')
    } finally {
      setDeletingId('')
    }
  }

  return (
    <section className="product-review">
      <div className="product-review-card">
        <div className="rate-row">
          <div>
            <h3>Rate this product</h3>
            {productTitle ? <p className="rate-product-name">{productTitle}</p> : null}
            <StarPicker value={rating} onChange={setRating} />
          </div>
          {rating > 0 && <span className="rate-saved">Your rating has been saved</span>}
        </div>

        {reviews.length > 0 && (
          <p className="rate-average">
            <strong>{average.toFixed(1)}</strong>
            <span> / 5 from {reviews.length} review{reviews.length === 1 ? '' : 's'}</span>
          </p>
        )}

        <div className="review-form">
          <h3>Review this product</h3>
          <label className="review-field">
            <span>Description</span>
            <textarea
              value={review}
              onChange={(event) => setReview(event.target.value)}
              placeholder="Description..."
              rows={5}
            />
          </label>

          {error && <p className="review-form-error">{error}</p>}
          {message && <p className="review-form-success">{message}</p>}

          <div className="review-submit-row">
            <button type="button" className="review-submit" onClick={handleSubmit} disabled={saving}>
              {saving ? 'SUBMITTING...' : 'SUBMIT'}
            </button>
          </div>
        </div>
      </div>

      <div className="review-list">
        <h3>Reviews</h3>
        {loading ? (
          <p className="review-list-note">Loading reviews...</p>
        ) : reviews.length === 0 ? (
          <p className="review-list-note">No reviews for this product yet.</p>
        ) : (
          reviews.map((item) => {
            const id = getReviewId(item)
            return (
              <article className="review-list-card" key={id || `${item.user_id}-${item.review}`}>
                <div className="review-list-head">
                  <StarReadout rating={Number(item.rating || 0)} />
                  <strong>{Number(item.rating || 0)}</strong>
                  {isAdmin && id && (
                    <button
                      type="button"
                      className="review-delete"
                      onClick={() => handleDelete(id)}
                      disabled={deletingId === id}
                    >
                      {deletingId === id ? 'Deleting...' : 'Delete'}
                    </button>
                  )}
                </div>
                <p>{item.review}</p>
              </article>
            )
          })
        )}
      </div>
    </section>
  )
}
