import { useEffect, useRef, useState } from 'react'
import './CartDrawer.css'
import fallbackImage from '../assets/p1.png'
import { useAppDispatch, useAppSelector } from '../hooks'
import { validateCouponApi } from '../api/api'
import { decrement, removeFromCart, addToCart } from '../store/cartSlice'
import { closeCart, openCart, openProfile, startCheckout } from '../store/uiSlice'

const APPLIED_COUPON_STORAGE_KEY = 'kunj-skin-applied-coupon'

export default function CartDrawer(){
  const dispatch = useAppDispatch()
  const open = useAppSelector(s => s.ui.cartOpen)
  const items = useAppSelector(s => s.cart.items)
  const pushedRef = useRef(false)
  const overlayRef = useRef<HTMLDivElement | null>(null)
  const drawerRef = useRef<HTMLElement | null>(null)
  const prevActiveRef = useRef<HTMLElement | null>(null)
  const [couponCode, setCouponCode] = useState('')
  const [couponError, setCouponError] = useState('')
  const [couponSuccess, setCouponSuccess] = useState('')
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discountPercentage: number; discountAmount: number; finalTotal: number; subtotal: number } | null>(null)
  const [validatingCoupon, setValidatingCoupon] = useState(false)

  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const savedCoupon = window.localStorage.getItem(APPLIED_COUPON_STORAGE_KEY)
    if (!savedCoupon) return

    try {
      const parsed = JSON.parse(savedCoupon) as { code?: string }
      if (parsed?.code) {
        setCouponCode(parsed.code)
        setAppliedCoupon((prev) => prev ?? {
          code: parsed.code,
          discountPercentage: 0,
          discountAmount: 0,
          finalTotal: subtotal,
          subtotal,
        })
      }
    } catch {
      window.localStorage.removeItem(APPLIED_COUPON_STORAGE_KEY)
    }
  }, [subtotal])

  const total = appliedCoupon ? appliedCoupon.finalTotal : subtotal

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (appliedCoupon?.code) {
      window.localStorage.setItem(APPLIED_COUPON_STORAGE_KEY, JSON.stringify({ code: appliedCoupon.code }))
      return
    }
    window.localStorage.removeItem(APPLIED_COUPON_STORAGE_KEY)
  }, [appliedCoupon])

  const handleApplyCoupon = async () => {
    if (!items.length) {
      setCouponError('Add a product before applying a coupon.')
      return
    }

    const normalizedCode = couponCode.trim()
    if (!normalizedCode) {
      setCouponError('Enter coupon code.')
      return
    }

    const token = typeof window !== 'undefined' ? window.localStorage.getItem('kunj-skin-token') : null

    setValidatingCoupon(true)
    setCouponError('')
    setCouponSuccess('')

    try {
      const payload = {
        couponCode: normalizedCode.toUpperCase(),
        items: items.map((item) => ({
          product: String(item._id || item.id || ''),
          quantity: item.quantity,
        })),
      }

      const response = await validateCouponApi(payload, token || undefined)
      const data = response?.data ?? response
      const detail = data && typeof data === 'object' ? data : {}
      const discountPercentage = Number(detail.discountPercentage ?? detail.coupon?.discountPercentage ?? 0)
      const discountAmount = Number(detail.discountAmount ?? detail.discount ?? 0)
      const validatedSubtotal = Number(detail.eligibleSubtotal ?? detail.subtotal ?? subtotal)
      const finalTotal = Number(detail.totalAmount ?? detail.finalTotal ?? detail.totalAfterDiscount ?? detail.discountedTotal ?? detail.total ?? Math.max(validatedSubtotal - discountAmount, 0))

      if (!response?.success && response?.message) {
        setCouponError(response.message)
        setAppliedCoupon(null)
        return
      }

      const validDiscountAmount = Number.isFinite(discountAmount) && discountAmount > 0 ? discountAmount : Math.max(validatedSubtotal - finalTotal, 0)
      const validFinalTotal = Number.isFinite(finalTotal) && finalTotal > 0 ? finalTotal : Math.max(validatedSubtotal - validDiscountAmount, 0)

      if (!discountPercentage && !validDiscountAmount && !validFinalTotal) {
        setCouponError(response?.message || 'Coupon is not valid for these items.')
        setAppliedCoupon(null)
        return
      }

      const nextCoupon = {
        code: normalizedCode.toUpperCase(),
        discountPercentage,
        discountAmount: validDiscountAmount,
        finalTotal: validFinalTotal,
        subtotal: validatedSubtotal,
      }

      setAppliedCoupon(nextCoupon)
      setCouponSuccess('Coupon applied successfully.')
      setCouponCode(nextCoupon.code)
    } catch (error: unknown) {
      const message = error && typeof error === 'object' && 'response' in error
        ? (error as { response?: { data?: { message?: string; error?: string } } }).response?.data?.message
        || (error as { response?: { data?: { error?: string } } }).response?.data?.error
        : 'Unable to apply coupon.'
      setAppliedCoupon(null)
      setCouponError(message || 'Unable to apply coupon.')
    } finally {
      setValidatingCoupon(false)
    }
  }

  // handle history state so back button closes the drawer
  useEffect(() => {
    function onPop() {
      const hasParam = new URLSearchParams(window.location.search).get('cart') === '1'
      if (!hasParam && open) {
        dispatch(closeCart())
      } else if (hasParam && !open) {
        dispatch(openCart())
      }
    }

    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [open, dispatch])

  // when open changes, push history state and manage focus
  useEffect(() => {
    if (open) {
      // push state with cart param so back button removes it
      if (!pushedRef.current) {
        const url = new URL(window.location.href)
        url.searchParams.set('cart', '1')
        window.history.pushState({}, '', url.toString())
        pushedRef.current = true
      }

      // save active element and focus drawer
      prevActiveRef.current = document.activeElement as HTMLElement | null
      setTimeout(() => {
        // focus first focusable
        const focusable = drawerRef.current?.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
        if (focusable && focusable.length) focusable[0].focus()
      }, 0)

      // trap tab key
      const onKey = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          // close via history.back to remove param
          if (pushedRef.current) window.history.back()
          else dispatch(closeCart())
        }

        if (e.key === 'Tab') {
          const focusable = drawerRef.current?.querySelectorAll<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          )
          if (!focusable || focusable.length === 0) return
          const first = focusable[0]
          const last = focusable[focusable.length - 1]
          if (e.shiftKey && document.activeElement === first) {
            e.preventDefault()
            last.focus()
          } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault()
            first.focus()
          }
        }
      }

      document.addEventListener('keydown', onKey)
      return () => document.removeEventListener('keydown', onKey)
    } else {
      // when closed, if we had pushed a state, go back to remove url param
      if (pushedRef.current) {
        // use replaceState to avoid navigating away if last entry still has cart param
        const url = new URL(window.location.href)
        if (url.searchParams.get('cart') === '1') {
          // go back in history to remove the pushed state; this triggers popstate which will close
          window.history.back()
        }
        pushedRef.current = false
      }

      // restore focus
      if (prevActiveRef.current) prevActiveRef.current.focus()
    }
  }, [open, dispatch])

  // lock body scroll while drawer is open
  useEffect(() => {
    if (open) {
      document.body.classList.add('no-scroll')
    } else {
      document.body.classList.remove('no-scroll')
    }
    return () => document.body.classList.remove('no-scroll')
  }, [open])

  if (!open) return null

  return (
    <div className={"cart-overlay visible"} ref={overlayRef} onClick={() => {
      if (pushedRef.current) window.history.back()
      else dispatch(closeCart())
    }}>
      <aside className={"cart-drawer open"} ref={drawerRef} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="cart-topbar">
          <div className="topbar-left">
            <div className="shopping-title">Your Cart ({items.length})</div>
          </div>
          <button className="close" onClick={() => { if (pushedRef.current) window.history.back(); else dispatch(closeCart()) }}>✕</button>
        </div>

        {/* <div className="promo-strip">
          <span className="promo-badge">🎁</span>
          <span>Yay! You got 2 free gifts + FLAT 20% OFF!</span>
        </div> */}

        <div className="cart-body">
          <ul className="cart-items">
            {items.map(item => (
              <li key={item._id} className="cart-product">
                <div className="cart-product-image-wrap">
                  <img src={item.image || item.img || fallbackImage} alt={item.title} />
                </div>

                <div className="cart-product-info">
                  <div className="cart-title">{item.title}</div>
                  <div className="cart-meta">{item.size || '30ml'}</div>

                  <div className="cart-price-row">
                    <div className="cart-price">₹{item.price * item.quantity}</div>
                    <div className="cart-old-price">₹{Math.round(item.price * 1.2)}</div>
                  </div>

                  {/* <div className="cart-save">Flat 20% off</div> */}
                </div>

                <div className="cart-product-actions">
                  <div className="cart-qty">
                    <button type="button" onClick={() => dispatch(decrement(item._id ?? item.id ?? ''))}>−</button>
                    <span>{item.quantity}</span>
                    <button type="button" onClick={() => dispatch(addToCart(item))}>+</button>
                  </div>
                  <button className="cart-trash" type="button" onClick={() => dispatch(removeFromCart(item._id ?? item.id ?? ''))}>🗑</button>
                </div>
              </li>
            ))}
          </ul>

          <div className="coupon-box">
            {!appliedCoupon ? (
              <div className="coupon-row">
                <input
                  type="text"
                  value={couponCode}
                  onChange={(event) => setCouponCode(event.target.value)}
                  placeholder="Enter coupon code"
                  aria-label="Coupon code"
                />
                <button type="button" onClick={() => void handleApplyCoupon()} disabled={validatingCoupon}>
                  {validatingCoupon ? 'Applying...' : 'Apply'}
                </button>
              </div>
            ) : (
              <div className="coupon-applied-box">
                <span className="coupon-code-tag">{appliedCoupon.code}</span>
                <button type="button" className="coupon-remove-button" onClick={() => {
                  setAppliedCoupon(null)
                  setCouponCode('')
                  setCouponSuccess('')
                  setCouponError('')
                  if (typeof window !== 'undefined') {
                    window.localStorage.removeItem(APPLIED_COUPON_STORAGE_KEY)
                  }
                }}>
                  Remove
                </button>
              </div>
            )}
            {couponError && <div className="coupon-message error">{couponError}</div>}
            {couponSuccess && <div className="coupon-message success">{couponSuccess}</div>}
          </div>

          {/* <div className="freebie-box">
            <div className="free-left">
              <img src={fallbackImage} alt="freebie" />
            </div>
            <div className="free-right">
              <div className="free-title">Personalised Diet plan</div>
              <div className="free-sub">FREE <span className="free-old">₹1,000</span></div>
            </div>
            <div className="free-qty">QTY: 1</div>
          </div> */}
        </div>

        <footer className="cart-footer">
          {appliedCoupon && (
            <div className="coupon-pricing-block">
              <div className="coupon-price-row">
                <span className="grand-price">₹{appliedCoupon.finalTotal.toFixed(2)}</span>
                <span className="grand-old-price">₹{appliedCoupon.subtotal.toFixed(2)}</span>
                <span className="coupon-offer-badge">Save {appliedCoupon.discountPercentage}%</span>
              </div>
              <div className="coupon-discount-line">
                <span>Discount</span>
                <strong>₹{appliedCoupon.discountAmount.toFixed(2)}</strong>
              </div>
            </div>
          )}

          <div className="footer-left">
            <div className="total-label">Total</div>
            <div className="total">₹{total.toFixed(2)}</div>
          </div>
          <div className="footer-right">
            <div className="shipping">Free Shipping</div>
            <button
              className="checkout"
              onClick={() => {
                if (items.length === 0) return

                dispatch(startCheckout())
                dispatch(closeCart())
                dispatch(openProfile())
              }}
            >
              Checkout Now
            </button>
          </div>
        </footer>
      </aside>
    </div>
  )
}
