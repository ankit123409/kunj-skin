import { useEffect, useMemo, useState } from 'react'
import './AdminProductsPage.css'
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
    <main className="admin-products-page">
      <div className="admin-products-container">
        <div className="admin-products-header">
          <div>
            <p className="admin-kicker">Admin</p>
            <h1>Coupon Manage</h1>
          </div>
          <button type="button" className="admin-primary-btn" onClick={openAdd}>
            + Add coupon
          </button>
        </div>

        {showForm && (
          <section className="admin-product-form">
            <div className="admin-form-head">
              <h2>{editingId ? 'Update coupon' : 'Add coupon'}</h2>
              <button
                type="button"
                className="admin-ghost-btn"
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

            <label>Coupon code *</label>
            <input
              className="admin-product-form-control"
              type="text"
              value={form.code}
              placeholder="SAVE20"
              onChange={(e) => setForm({ ...form, code: e.target.value })}
            />

            <label>Products</label>
            <div className="coupon-product-dropdown-wrap">
              <button
                type="button"
                className={`coupon-product-dropdown ${productDropdownOpen ? 'open' : ''}`}
                onClick={() => setProductDropdownOpen((open) => !open)}
              >
                <span>
                  {selectedProducts.length > 0
                    ? `${selectedProducts.length} selected`
                    : 'All products'}
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

            {selectedProducts.length > 0 && (
              <div className="coupon-selected-products">
                {selectedProducts.map((productId) => {
                  const product = products.find((item: Product) => String(item._id || item.id || '') === productId)
                  const label = product?.title || 'Selected product'

                  return (
                    <button
                      type="button"
                      key={productId}
                      className="coupon-selected-pill"
                      onClick={() => toggleProductSelection(productId, true)}
                      title="Remove product"
                    >
                      {label}
                      <span aria-hidden="true">×</span>
                    </button>
                  )
                })}
              </div>
            )}

            <small className="admin-file-hint">Click to select, click a selected chip to remove, or hold Ctrl/Command to keep the dropdown open while choosing multiple products.</small>

            <label>Start date *</label>
            <input
              className="admin-product-form-control"
              type="date"
              value={form.startDate}
              onChange={(e) => setForm({ ...form, startDate: e.target.value })}
            />

            <label>End date *</label>
            <input
              className="admin-product-form-control"
              type="date"
              value={form.endDate}
              onChange={(e) => setForm({ ...form, endDate: e.target.value })}
            />

            <label>Discount % *</label>
            <input
              className="admin-product-form-control"
              type="number"
              min="0"
              max="100"
              value={form.discountPercentage}
              onChange={(e) => setForm({ ...form, discountPercentage: Number(e.target.value || 0) })}
            />

            <label>Min order amount</label>
            <input
              className="admin-product-form-control"
              type="number"
              min="0"
              value={form.minimumOrderAmount}
              onChange={(e) => setForm({ ...form, minimumOrderAmount: Number(e.target.value || 0) })}
            />

            <label>Max discount amount</label>
            <input
              className="admin-product-form-control"
              type="number"
              min="0"
              value={form.maximumDiscountAmount}
              onChange={(e) => setForm({ ...form, maximumDiscountAmount: Number(e.target.value || 0) })}
            />

            <label>Usage limit</label>
            <input
              className="admin-product-form-control"
              type="number"
              min="0"
              value={form.usageLimit}
              onChange={(e) => setForm({ ...form, usageLimit: Number(e.target.value || 0) })}
            />

            <label>Per customer limit</label>
            <input
              className="admin-product-form-control"
              type="number"
              min="1"
              value={form.perCustomerLimit}
              onChange={(e) => setForm({ ...form, perCustomerLimit: Number(e.target.value || 1) })}
            />

            <label className="admin-toggle-row">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
              />
              Active
            </label>

            <button type="button" className="admin-primary-btn" onClick={handleSave} disabled={saving}>
              {saving ? (editingId ? 'Updating coupon...' : 'Creating coupon...') : (editingId ? 'Update coupon' : 'Create coupon')}
            </button>
          </section>
        )}

        {error && <div className="admin-error">{error}</div>}
        {message && <div className="admin-success">{message}</div>}

        {loadingProducts && coupons.length === 0 ? (
          <p className="admin-products-note">Loading products...</p>
        ) : loadingCoupons ? (
          <p className="admin-products-note">Loading coupons...</p>
        ) : coupons.length === 0 ? (
          <p className="admin-products-note">No coupons yet. Add your first coupon.</p>
        ) : (
          <div className="admin-product-list">
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
                <article key={id || coupon.code} className="admin-product-card coupon-card">
                  <div className="admin-product-meta">
                    <h3>{coupon.code || 'Coupon'}</h3>
                    <p>{coupon.isActive ? 'Active' : 'Inactive'}</p>
                    <strong>{coupon.discountPercentage || 0}% off</strong>
                    <span className="coupon-product-label">{productTitle}</span>
                  </div>
                  <div className="admin-product-actions">
                    <button type="button" onClick={() => openEdit(coupon)}>Update</button>
                    <button
                      type="button"
                      className="danger"
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

        <button type="button" className="admin-ghost-btn back-home" onClick={() => navigate('/')}>
          ← Back to shop
        </button>
      </div>
    </main>
  )
}
