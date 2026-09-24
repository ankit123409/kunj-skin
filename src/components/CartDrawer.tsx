import { useEffect, useRef } from 'react'
import './CartDrawer.css'
import { useAppDispatch, useAppSelector } from '../hooks'
import { decrement, removeFromCart, addToCart, clearCart } from '../store/cartSlice'
import { closeCart, openCart, openProfile } from '../store/uiSlice'
import { placeOrder } from '../store/ordersSlice'

export default function CartDrawer(){
  const dispatch = useAppDispatch()
  const open = useAppSelector(s => s.ui.cartOpen)
  const items = useAppSelector(s => s.cart.items)
  const isLoggedIn = useAppSelector(s => s.auth.isLoggedIn)
  const pushedRef = useRef(false)
  const overlayRef = useRef<HTMLDivElement | null>(null)
  const drawerRef = useRef<HTMLElement | null>(null)
  const prevActiveRef = useRef<HTMLElement | null>(null)

  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0)

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

        <div className="promo-strip">
          <span className="promo-badge">🎁</span>
          <span>Yay! You got 2 free gifts + FLAT 20% OFF!</span>
        </div>

        <div className="cart-body">
          <ul className="cart-items">
            {items.map(item => (
              <li key={item.id} className="cart-product">
                <div className="cart-product-image-wrap">
                  <img src={item.img || '/assets/p1.png'} alt={item.title} />
                </div>

                <div className="cart-product-info">
                  <div className="cart-title">{item.title}</div>
                  <div className="cart-meta">{item.size || '30ml'}</div>

                  <div className="cart-price-row">
                    <div className="cart-price">₹{item.price * item.quantity}</div>
                    <div className="cart-old-price">₹{Math.round(item.price * 1.2)}</div>
                  </div>

                  <div className="cart-save">Flat 20% off</div>
                </div>

                <div className="cart-product-actions">
                  <div className="cart-qty">
                    <button type="button" onClick={() => dispatch(decrement(item.id))}>−</button>
                    <span>{item.quantity}</span>
                    <button type="button" onClick={() => dispatch(addToCart(item))}>+</button>
                  </div>
                  <button className="cart-trash" type="button" onClick={() => dispatch(removeFromCart(item.id))}>🗑</button>
                </div>
              </li>
            ))}
          </ul>

          <div className="freebie-box">
            <div className="free-left">
              <img src="/assets/p1.png" alt="freebie" />
            </div>
            <div className="free-right">
              <div className="free-title">Personalised Diet plan</div>
              <div className="free-sub">FREE <span className="free-old">₹1,000</span></div>
            </div>
            <div className="free-qty">QTY: 1</div>
          </div>
        </div>

        <footer className="cart-footer">
          <div className="footer-left">
            <div className="total-label">Total</div>
            <div className="total">₹{total}</div>
          </div>
          <div className="footer-right">
            <div className="shipping">Free Shipping</div>
            <button
              className="checkout"
              onClick={() => {
                if (!isLoggedIn) {
                  dispatch(closeCart())
                  dispatch(openProfile())
                  return
                }

                if (items.length === 0) return

                const order = {
                  id: `ORD-${Date.now()}`,
                  total,
                  createdAt: new Date().toISOString(),
                  status: 'Placed' as const,
                  items: items.map((item) => ({ ...item })),
                }

                dispatch(placeOrder(order))
                dispatch(clearCart())
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
