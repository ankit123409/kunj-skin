import { useEffect, useMemo, useState } from 'react'
import './ProfileModal.css'
import { useAppDispatch, useAppSelector } from '../hooks'
import { closeProfile, finishCheckout } from '../store/uiSlice'
import { logout, register as registerUser, setDeliveryAddress, setAuthenticated } from '../store/authSlice'
import { registerApi, loginApi } from '../api/api'
import { clearCart } from '../store/cartSlice'
import { placeOrder } from '../store/ordersSlice'
import { navigate } from '../router'

export default function ProfileModal() {
  const dispatch = useAppDispatch()
  const isOpen = useAppSelector((s) => s.ui.profileOpen)
  const isLoggedIn = useAppSelector((s) => s.auth.isLoggedIn)
  const mobile = useAppSelector((s) => s.auth.mobile)
  const loginError = useAppSelector((s) => s.auth.loginError)
  const orders = useAppSelector((s) => s.orders.items)
  const cartItems = useAppSelector((s) => s.cart.items)
  const checkoutFlow = useAppSelector((s) => s.ui.checkoutFlow)

  const [phone, setPhone] = useState(mobile)
  const [authMode, setAuthMode] = useState<'register' | 'login'>('register')
  const [regName, setRegName] = useState('')
  const [regMobile, setRegMobile] = useState('')
  const [regPassword, setRegPassword] = useState('')
  const [loginMobile, setLoginMobile] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [authSuccess, setAuthSuccess] = useState(false)
  const [authMessage, setAuthMessage] = useState('')
  const [showSuccess, setShowSuccess] = useState(false)
  const [checkoutForm, setCheckoutForm] = useState({
    pincode: '',
    address: '',
    phone: mobile || '',
    fullName: '',
    email: '',
    saveAs: 'Home',
    agree: true,
  })
  const [tab, setTab] = useState<'orders' | 'account' | 'checkout'>('orders')

  useEffect(() => {
    setCheckoutForm((prev) => ({ ...prev, phone: mobile || prev.phone }))
  }, [mobile])

  useEffect(() => {
    if (checkoutFlow && isLoggedIn) {
      setTab('checkout')
    }
  }, [checkoutFlow, isLoggedIn])

  useEffect(() => {
    if (!showSuccess) return

    const timeout = window.setTimeout(() => {
      setShowSuccess(false)
      setTab('orders')
      dispatch(closeProfile())
      navigate('/orders')
    }, 1600)

    return () => window.clearTimeout(timeout)
  }, [showSuccess, dispatch])

  const orderSummary = useMemo(
    () =>
      orders.map((order) => ({
        ...order,
        count: order.items.reduce((sum, item) => sum + item.quantity, 0),
      })),
    [orders]
  )

  if (!isOpen) return null

  const handleRegister = () => {
    const name = regName.trim()
    const mobileVal = regMobile.replace(/\D/g, '')
    const password = regPassword

    if (!name || !/^\d{10}$/.test(mobileVal) || password.length < 4) {
      setError('Enter valid name, 10-digit mobile and password (min 4 chars)')
      return
    }

    setError('')
    setLoading(true)
    registerApi({ name, mobile: mobileVal, password })
      .then((res) => {
        console.log("rseses",res);
        
        // server response expected: { success: true, message, token, user }
        const msg = res?.message || 'Registration successful'
        const token = res?.token
        const user = res?.user

        if (token && typeof window !== 'undefined') {
          window.localStorage.setItem('kunj-skin-token', token)
        }
        if (user && typeof window !== 'undefined') {
          window.localStorage.setItem('kunj-skin-user', JSON.stringify(user))
        }

        // update local store and UI
        dispatch(registerUser({ name, mobile: mobileVal, password }))
        dispatch(setAuthenticated({ mobile: mobileVal }))

        // show toast then close modal
        setAuthMessage(msg)
        setAuthSuccess(true)
        setError('')

        window.setTimeout(() => {
          setAuthSuccess(false)
          dispatch(closeProfile())
        }, 1200)
      })
      .catch((err) => {
        console.log("errrr",err);
        
        setError(err?.response?.data?.message || 'Registration failed')
      })
      .finally(() => setLoading(false))
  }

  const handleLogin = () => {
    const mobileVal = loginMobile.replace(/\D/g, '')
    const password = loginPassword

    if (!/^\d{10}$/.test(mobileVal) || !password) {
      setError('Enter mobile and password')
      return
    }

    setError('')
    setLoading(true)
    loginApi({ mobile: mobileVal, password })
      .then((res) => {
        const msg = res?.message || 'Login successful'
        const token = res?.token
        const user = res?.user

        if (token && typeof window !== 'undefined') {
          window.localStorage.setItem('kunj-skin-token', token)
        }
        if (user && typeof window !== 'undefined') {
          window.localStorage.setItem('kunj-skin-user', JSON.stringify(user))
        }

        dispatch(setAuthenticated({ mobile: mobileVal }))

        setAuthMessage(msg)
        setAuthSuccess(true)

        window.setTimeout(() => {
          setAuthSuccess(false)
          dispatch(closeProfile())
        }, 1200)
      })
      .catch((err) => {
        setError(err?.response?.data?.message || 'Login failed')
      })
      .finally(() => setLoading(false))
  }

  const handleLogout = () => {
    dispatch(logout())
    setTab('orders')
    setError('')
  }

  const handleClose = () => {
    setShowSuccess(false)
    dispatch(closeProfile())
    dispatch(finishCheckout())
  }

  const handlePlaceOrder = () => {
    const trimmedAddress = checkoutForm.address.trim()
    const trimmedPincode = checkoutForm.pincode.trim()
    const trimmedName = checkoutForm.fullName.trim()
    const trimmedEmail = checkoutForm.email.trim()
    const trimmedPhone = checkoutForm.phone.trim()

    if (!trimmedPincode || !trimmedAddress || !trimmedName || !trimmedEmail || !trimmedPhone) {
      setError('Fill in all required delivery details')
      return
    }

    if (!checkoutForm.agree) {
      setError('Please accept the delivery OTP terms')
      return
    }

    if (cartItems.length === 0) return

    const total = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
    const order = {
      id: `ORD-${Date.now()}`,
      total,
      createdAt: new Date().toISOString(),
      status: 'Placed' as const,
      items: cartItems.map((item) => ({ ...item })),
    }

    const addressText = [
      trimmedAddress,
      `${trimmedPincode}`,
      `Phone: ${trimmedPhone}`,
      `Name: ${trimmedName}`,
      `Email: ${trimmedEmail}`,
    ].join(', ')

    dispatch(setDeliveryAddress(addressText))
    dispatch(placeOrder(order))
    dispatch(clearCart())
    setShowSuccess(true)
    setTab('orders')
    setError('')
    dispatch(finishCheckout())
  }

  return (
    <div className="profile-modal-backdrop" onClick={handleClose}>
      <div className={`profile-modal ${checkoutFlow ? 'checkout-mode' : ''}`} onClick={(e) => e.stopPropagation()}>
        {showSuccess && (
          <div className="order-success-popup">
            <div className="success-icon">✓</div>
            <span>Order success</span>
          </div>
        )}

        {authSuccess && (
          <div className="order-success-popup">
            <div className="success-icon">✓</div>
            <span>{authMessage || 'Success'}</span>
          </div>
        )}

        {checkoutFlow && isLoggedIn ? (
          <div className="profile-header checkout-header">
            <h3>Add new address</h3>
            <button className="profile-close" type="button" onClick={handleClose}>✕</button>
          </div>
        ) : (
          <div className="profile-header">
            <div>
              <div className="profile-kicker">Account</div>
              <h3>{isLoggedIn ? 'My Profile' : 'Login to continue'}</h3>
            </div>
            <button className="profile-close" type="button" onClick={handleClose}>✕</button>
          </div>
        )}

        {!isLoggedIn ? (
          <div className="login-panel">
            <div className="auth-toggle">
              <button type="button" className={authMode === 'register' ? 'active' : ''} onClick={() => setAuthMode('register')}>Register</button>
              <button type="button" className={authMode === 'login' ? 'active' : ''} onClick={() => setAuthMode('login')}>Login</button>
            </div>

            {authMode === 'register' ? (
              <>
                <label className="field-label">Name</label>
                <input type="text" value={regName} placeholder="Full name" onChange={(e) => setRegName(e.target.value)} />

                <label className="field-label">Mobile</label>
                <input type="tel" value={regMobile} maxLength={10} placeholder="10-digit mobile" onChange={(e) => setRegMobile(e.target.value)} />

                <label className="field-label">Password</label>
                <input type="password" value={regPassword} placeholder="Password" onChange={(e) => setRegPassword(e.target.value)} />

                <button className="primary-button" type="button" onClick={handleRegister}>Register</button>
              </>
            ) : (
              <>
                <label className="field-label">Mobile</label>
                <input type="tel" value={loginMobile} maxLength={10} placeholder="10-digit mobile" onChange={(e) => setLoginMobile(e.target.value)} />

                <label className="field-label">Password</label>
                <input type="password" value={loginPassword} placeholder="Password" onChange={(e) => setLoginPassword(e.target.value)} />

                <button className="primary-button" type="button" onClick={handleLogin}>Login</button>
              </>
            )}

            {(error || loginError) && <div className="field-error">{error || (loginError ? 'Invalid credentials' : '')}</div>}
          </div>
        ) : checkoutFlow ? (
          <div className="checkout-panel">
            <div className="checkout-offer-banner">Unlock Extra 5% OFF on Prepaid Orders</div>

            <label className="field-heading">Pincode <span>*</span></label>
            <input
              type="text"
              value={checkoutForm.pincode}
              maxLength={6}
              onChange={(e) => setCheckoutForm({ ...checkoutForm, pincode: e.target.value.replace(/\D/g, '') })}
            />

            <label className="field-heading">Address <span>*</span></label>
            <input
              type="text"
              value={checkoutForm.address}
              onChange={(e) => setCheckoutForm({ ...checkoutForm, address: e.target.value })}
            />

            <label className="field-heading">Phone number <span>*</span></label>
            <div className="phone-input-wrap">
              <span className="flag">🇮🇳</span>
              <input
                type="tel"
                value={checkoutForm.phone}
                maxLength={10}
                onChange={(e) => setCheckoutForm({ ...checkoutForm, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
              />
            </div>

            <label className="field-heading">Full Name <span>*</span></label>
            <input
              type="text"
              value={checkoutForm.fullName}
              onChange={(e) => setCheckoutForm({ ...checkoutForm, fullName: e.target.value })}
            />

            <label className="field-heading">Email <span>*</span></label>
            <input
              type="email"
              value={checkoutForm.email}
              onChange={(e) => setCheckoutForm({ ...checkoutForm, email: e.target.value })}
            />

            <div className="save-as-wrap">
              <span>Save as</span>
              <div className="save-as-options">
                {['Home', 'Friends', 'Work', 'Other'].map((option) => (
                  <button
                    key={option}
                    type="button"
                    className={checkoutForm.saveAs === option ? 'save-option active' : 'save-option'}
                    onClick={() => setCheckoutForm({ ...checkoutForm, saveAs: option })}
                  >
                    {option === 'Home' && '🏠'}
                    {option === 'Friends' && '👥'}
                    {option === 'Work' && '💼'}
                    {option === 'Other' && '📍'}
                    {option}
                  </button>
                ))}
              </div>
            </div>

            <label className="terms-row">
              <input
                type="checkbox"
                checked={checkoutForm.agree}
                onChange={(e) => setCheckoutForm({ ...checkoutForm, agree: e.target.checked })}
              />
              <span>
                This address will be secured with OTP on Shopify checkouts. View Terms and conditions and Privacy Policy
              </span>
            </label>

            <button className="primary-button" type="button" onClick={handlePlaceOrder}>
              Save and continue
            </button>

            {error && <div className="field-error">{error}</div>}
          </div>
        ) : (
          <>
            <div className="profile-tabs">
              <button
                type="button"
                className={tab === 'orders' ? 'active-tab' : ''}
                onClick={() => setTab('orders')}
              >
                My Orders
              </button>
              <button
                type="button"
                className={tab === 'account' ? 'active-tab' : ''}
                onClick={() => setTab('account')}
              >
                Account
              </button>
              <button type="button" className="ghost-button" onClick={handleLogout}>
                Logout
              </button>
            </div>

            {tab === 'orders' ? (
              <div className="orders-panel">
                {orderSummary.length === 0 ? (
                  <div className="empty-order">
                    <div className="empty-icon">📦</div>
                    <h4>No orders yet</h4>
                    <p>Your placed orders will appear here.</p>
                  </div>
                ) : (
                  orderSummary.map((order) => (
                    <button
                      key={order.id}
                      type="button"
                      className="order-card"
                      onClick={() => {
                        dispatch(closeProfile())
                        dispatch(finishCheckout())
                        navigate(`/order/${order.id}`)
                      }}
                    >
                      <div className="order-head">
                        <strong>{order.id}</strong>
                        <span className="order-status">{order.status}</span>
                      </div>

                      <div className="order-meta">
                        <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                        <span>{order.count} items</span>
                      </div>

                      <div className="order-items-list">
                        {order.items.map((item) => (
                          <div key={`${order.id}-${item.id}`} className="mini-item">
                            <span>{item.title}</span>
                            <strong>₹{item.price * item.quantity}</strong>
                          </div>
                        ))}
                      </div>

                      <div className="order-total">Order total: ₹{order.total}</div>
                    </button>
                  ))
                )}
              </div>
            ) : (
              <div className="account-panel">
                <div className="info-row">
                  <span>Mobile</span>
                  <strong>+91 {mobile}</strong>
                </div>
                <div className="info-row">
                  <span>Member since</span>
                  <strong>Today</strong>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
