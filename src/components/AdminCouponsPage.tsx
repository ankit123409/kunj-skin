import { useEffect, useMemo, useState } from 'react'
import './AdminCouponsPage.css'
import { useAppDispatch, useAppSelector } from '../hooks'
import { createCouponApi, deleteCouponApi, getAuthToken, getCouponsApi, updateCouponApi, type CouponPayload } from '../api/api'
import { fetchProducts } from '../store/productsSlice'
import { isAdminRole } from '../utils/orderStatus'
import { navigate } from '../router'
import type { Product } from '../store/cartSlice'

const emptyForm = (): CouponPayload => ({
  code: '',
  productId: undefined,
  productIds: [],
  startDate: new Date().toISOString().slice(0, 10),
  endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString().slice(0, 10),
  discountPercentage: 10,
  isActive: true,
  minimumOrderAmount: 500,
  maximumDiscountAmount: 200,
  usageLimit: 100,
  perCustomerLimit: 1,
})

type CouponItem = {
  _id?: string
  id?: string
  code?: string
  productId?: string | null
  productIds?: string[]
  startDate?: string
  endDate?: string
  discountPercentage?: number
  isActive?: boolean
  minimumOrderAmount?: number
  maximumDiscountAmount?: number
  usageLimit?: number
  perCustomerLimit?: number
}

function getApiErrorMessage(err: unknown, fallback: string) {
  const axiosErr = err as { message?: string; response?: { data?: { message?: string; error?: string } } }
  return axiosErr?.response?.data?.message || axiosErr?.response?.data?.error || axiosErr?.message || fallback
}

function getCouponId(coupon: CouponItem) {
  return String(coupon._id || coupon.id || '')
}

export default function AdminCouponsPage() {
  const dispatch = useAppDispatch()
  const role = useAppSelector((s) => s.auth.role)
  const products = useAppSelector((s) => s.products.items)
  const loadingProducts = useAppSelector((s) => s.products.loading)
  const isAdmin = isAdminRole(role)

  const [form, setForm] = useState<CouponPayload>(emptyForm())
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [coupons, setCoupons] = useState<CouponItem[]>([])
  const [loadingCoupons, setLoadingCoupons] = useState(false)
  const [deletingId, setDeletingId] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [productDropdownOpen, setProductDropdownOpen] = useState(false)

  useEffect(() => {
    void dispatch(fetchProducts())
  }, [dispatch])

  const productMap = useMemo(() => {
    return new Map((products || []).map((product: Product) => [String(product._id || product.id || ''), product.title || 'Product']))
  }, [products])

  const loadCoupons = async () => {
    const token = getAuthToken()
    if (!token) {
      setError('Please login again as admin')
      return
    }

    setLoadingCoupons(true)
    try {
      const data = await getCouponsApi(token)
      setCoupons(Array.isArray(data) ? data as CouponItem[] : [])
      setError('')
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Unable to load coupons'))
    } finally {
      setLoadingCoupons(false)
    }
  }

  useEffect(() => {
    if (!isAdmin) return
    void loadCoupons()
  }, [isAdmin])

  if (!isAdmin) {
    return (
      <main className="admin-products-page">
        <div className="admin-products-container">
          <h1>Coupon Manage</h1>
          <p className="admin-products-note">Only admin users can manage coupons.</p>
        </div>
      </main>
    )
  }

  const openAdd = () => {
    setEditingId(null)
    setForm(emptyForm())
    setShowForm(true)
    setError('')
    setMessage('')
  }

  const openEdit = (coupon: CouponItem) => {
    const id = getCouponId(coupon)
    const selectedProductIds = Array.isArray(coupon.productIds)
      ? coupon.productIds.filter(Boolean)
      : coupon.productId
        ? [coupon.productId]
        : []

    setEditingId(id)
    setForm({
      code: coupon.code || '',
      productIds: selectedProductIds,
      startDate: coupon.startDate || new Date().toISOString().slice(0, 10),
      endDate: coupon.endDate || new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString().slice(0, 10),
      discountPercentage: Number(coupon.discountPercentage || 0),
      isActive: Boolean(coupon.isActive ?? true),
      minimumOrderAmount: Number(coupon.minimumOrderAmount || 0),
      maximumDiscountAmount: Number(coupon.maximumDiscountAmount || 0),
      usageLimit: Number(coupon.usageLimit || 0),
      perCustomerLimit: Number(coupon.perCustomerLimit || 1),
    })
    setShowForm(true)
    setError('')
    setMessage('')
  }

  const handleSave = async () => {
    if (!form.code.trim()) {
      setError('Coupon code is required')
      return
    }

    const token = getAuthToken()
    if (!token) {
      setError('Please login again as admin')
      return
    }

    setSaving(true)
    setError('')
    setMessage('')

    try {
      const selectedProductIds = (form.productIds || []).filter(Boolean)
      const payload: CouponPayload = {
        code: form.code.trim().toUpperCase(),
        productIds: selectedProductIds,
        startDate: form.startDate,
        endDate: form.endDate,
        discountPercentage: Number(form.discountPercentage || 0),
        isActive: Boolean(form.isActive),
        minimumOrderAmount: Number(form.minimumOrderAmount || 0),
        maximumDiscountAmount: Number(form.maximumDiscountAmount || 0),
        usageLimit: Number(form.usageLimit || 0),
        perCustomerLimit: Number(form.perCustomerLimit || 1),
      }

      if (editingId) {
        await updateCouponApi(editingId, payload, token)
      } else {
        await createCouponApi(payload, token)
      }

      setEditingId(null)
      setForm(emptyForm())
      setShowForm(false)
      setMessage(editingId ? 'Coupon updated successfully' : 'Coupon created successfully')
      await loadCoupons()
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Unable to save coupon'))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (coupon: CouponItem) => {
    const id = getCouponId(coupon)
    if (!id) return

    const token = getAuthToken()
    if (!token) {
      setError('Please login again as admin')
      return
    }

    setDeletingId(id)
    setError('')
    setMessage('')

    try {
      await deleteCouponApi(id, token)
      setCoupons((current) => current.filter((item) => getCouponId(item) !== id))
      setMessage('Coupon deleted successfully')
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Unable to delete coupon'))
    } finally {
      setDeletingId('')
    }
  }

  const toggleProductSelection = (productId: string, keepOpen = false) => {
    const selected = form.productIds || []
    const next = selected.includes(productId)
      ? selected.filter((id) => id !== productId)
      : [...selected, productId]

    setForm({ ...form, productIds: next })
    if (!keepOpen) setProductDropdownOpen(false)
  }

  const selectedProducts = (form.productIds || []).filter(Boolean)

  return (
    <main className="coupon-admin-page">
      <div className="coupon-admin-container">
        <div className="coupon-admin-header">
          <div>
            <p className="coupon-admin-kicker">Admin</p>
            <h1>Coupon Manage</h1>
          </div>
          <button type="button" className="coupon-admin-primary-btn" onClick={openAdd}>
            + Add coupon
          </button>
        </div>

        {showForm && (
          <section className="coupon-form-card">
            <div className="coupon-form-header">
              <div>
                <h2>Create a coupon</h2>
                <p>Set the discount, limits and validity for your coupon code.</p>
              </div>
              <button
                type="button"
                className="coupon-admin-cancel-btn"
                disabled={saving}
                onClick={() => {
                  setShowForm(false)
                  setEditingId(null)
                  setForm(emptyForm())
                  setError('')
                }}
              >
                Cancel
              </button>
            </div>

            <div className="coupon-form-grid">
              <div className="coupon-field">
                <label htmlFor="coupon-code">Coupon code <span>*</span></label>
                <input
                  id="coupon-code"
                  type="text"
                  value={form.code}
                  placeholder="SAVE20"
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                />
              </div>

              <div className="coupon-field">
                <label>Apply to products</label>
                <div className="coupon-product-dropdown-wrap">
                  <button
                    type="button"
                    className={`coupon-product-dropdown ${productDropdownOpen ? 'open' : ''}`}
                    onClick={() => setProductDropdownOpen((open) => !open)}
                  >
                    <span>
                      {selectedProducts.length > 0 ? `${selectedProducts.length} selected` : 'All products'}
                    </span>
                    <span className="coupon-dropdown-caret">▾</span>
                  </button>

                  {productDropdownOpen && (
                    <div className="coupon-product-dropdown-menu">
                      <button
                        type="button"
                        className={`coupon-product-option ${selectedProducts.length === 0 ? 'selected' : ''}`}
                        onClick={() => {
                          setForm({ ...form, productIds: [] })
                          setProductDropdownOpen(false)
                        }}
                      >
                        <span>All products</span>
                      </button>

                      {products.map((product: Product) => {
                        const id = String(product._id || product.id || '')
                        const isSelected = selectedProducts.includes(id)

                        return (
                          <button
                            type="button"
                            key={id}
                            className={`coupon-product-option ${isSelected ? 'selected' : ''}`}
                            onClick={(event) => {
                              const keepOpen = event.metaKey || event.ctrlKey
                              toggleProductSelection(id, keepOpen)
                            }}
                          >
                            <span>{product.title}</span>
                            {isSelected && <span className="coupon-option-check">✓</span>}
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>

              <div className="coupon-field">
                <label htmlFor="coupon-start-date">Start date <span>*</span></label>
                <div className="coupon-date-input-wrap">
                  <input
                    id="coupon-start-date"
                    type="date"
                    value={form.startDate}
                    onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                  />
                </div>
              </div>

              <div className="coupon-field">
                <label htmlFor="coupon-end-date">End date <span>*</span></label>
                <div className="coupon-date-input-wrap">
                  <input
                    id="coupon-end-date"
                    type="date"
                    value={form.endDate}
                    onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                  />
                </div>
              </div>

              <div className="coupon-field">
                <label htmlFor="coupon-discount">Discount (%) <span>*</span></label>
                <input
                  id="coupon-discount"
                  type="number"
                  min="0"
                  max="100"
                  value={form.discountPercentage}
                  onChange={(e) => setForm({ ...form, discountPercentage: Number(e.target.value || 0) })}
                />
              </div>

              <div className="coupon-field">
                <label htmlFor="coupon-min-order">Minimum order amount <span>*</span></label>
                <input
                  id="coupon-min-order"
                  type="number"
                  min="0"
                  value={form.minimumOrderAmount}
                  onChange={(e) => setForm({ ...form, minimumOrderAmount: Number(e.target.value || 0) })}
                />
              </div>

              <div className="coupon-field">
                <label htmlFor="coupon-max-discount">Maximum discount amount <span>*</span></label>
                <input
                  id="coupon-max-discount"
                  type="number"
                  min="0"
                  value={form.maximumDiscountAmount}
                  onChange={(e) => setForm({ ...form, maximumDiscountAmount: Number(e.target.value || 0) })}
                />
              </div>

              <div className="coupon-field">
                <label htmlFor="coupon-usage-limit">Total usage limit</label>
                <input
                  id="coupon-usage-limit"
                  type="number"
                  min="0"
                  value={form.usageLimit}
                  onChange={(e) => setForm({ ...form, usageLimit: Number(e.target.value || 0) })}
                />
              </div>

              <div className="coupon-field">
                <label htmlFor="coupon-per-customer-limit">Per-customer limit</label>
                <input
                  id="coupon-per-customer-limit"
                  type="number"
                  min="1"
                  value={form.perCustomerLimit}
                  onChange={(e) => setForm({ ...form, perCustomerLimit: Number(e.target.value || 1) })}
                />
              </div>
            </div>

            <div className="coupon-form-footer">
              <div className="coupon-toggle-row">
                <label className="coupon-toggle">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  />
                  <span className="coupon-toggle-slider" />
                </label>
                <span>Coupon is active and can be used by customers.</span>
              </div>

              <button type="button" className="coupon-admin-submit-btn" onClick={handleSave} disabled={saving}>
                {saving ? (editingId ? 'Updating coupon...' : 'Creating coupon...') : (editingId ? 'Update coupon' : 'Create coupon')}
              </button>
            </div>
          </section>
        )}

        {error && <div className="admin-error">{error}</div>}
        {message && <div className="admin-success">{message}</div>}

        {loadingProducts && coupons.length === 0 ? (
          <div className="coupon-empty-state">
            <div className="coupon-empty-icon">✦</div>
            <p>Loading products...</p>
          </div>
        ) : loadingCoupons ? (
          <div className="coupon-empty-state">
            <div className="coupon-empty-icon">✦</div>
            <p>Loading coupons...</p>
          </div>
        ) : coupons.length === 0 ? (
          <div className="coupon-empty-state">
            <div className="coupon-empty-icon">◌</div>
            <h3>No coupons yet</h3>
            <p>Create your first coupon to start offering discounts.</p>
          </div>
        ) : (
          <div className="coupon-list">
            {coupons.map((coupon) => {
              const id = getCouponId(coupon)
              const productIds = Array.isArray(coupon.productIds) && coupon.productIds.length > 0
                ? coupon.productIds
                : coupon.productId
                  ? [coupon.productId]
                  : []
              const productTitle = productIds.length > 1
                ? `${productIds.length} products`
                : productIds.length === 1
                  ? productMap.get(productIds[0]) || 'Selected product'
                  : 'All products'

              return (
                <article key={id || coupon.code} className="coupon-list-row">
                  <div className="coupon-main-info">
                    <div className="coupon-icon-wrap" aria-hidden="true">
                      <span className="coupon-icon">🎟</span>
                    </div>

                    <div className="coupon-text-block">
                      <div className="coupon-header-line">
                        <span className="coupon-code">{coupon.code || 'Coupon'}</span>
                        <span className={`coupon-status ${coupon.isActive ? 'active' : 'inactive'}`}>
                          <span className="status-dot" />
                          {coupon.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>

                      <div className="coupon-meta-row">
                        <div className="coupon-chip discount">
                          <span className="meta-icon">◌</span>
                          <div className="coupon-label-stack">
                            <span>{coupon.discountPercentage || 0}% off</span>
                            <small>Discount</small>
                          </div>
                        </div>

                        <div className="coupon-chip product">
                          <span className="meta-icon">▣</span>
                          <div className="coupon-label-stack">
                            <span>{productTitle === 'All products' ? 'All products' : 'Selected product'}</span>
                            <small>Products</small>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="coupon-actions">
                    <button type="button" className="coupon-update-btn" onClick={() => openEdit(coupon)}>
                      Update
                    </button>
                    <button
                      type="button"
                      className="coupon-delete-btn"
                      disabled={deletingId === id}
                      onClick={() => void handleDelete(coupon)}
                    >
                      {deletingId === id ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </article>
              )
            })}
          </div>
        )}

        <button type="button" className="coupon-admin-back-home" onClick={() => navigate('/')}>
          ← Back to shop
        </button>
      </div>
    </main>
  )
}
