import { useEffect, useMemo, useState } from 'react'
import './ProfileModal.css'
import { useAppDispatch, useAppSelector } from '../hooks'
import { closeProfile, finishCheckout } from '../store/uiSlice'
import { logout, sendOtp, setDeliveryAddress, verifyOtp } from '../store/authSlice'
import { clearCart } from '../store/cartSlice'
import { placeOrder } from '../store/ordersSlice'
import { navigate } from '../router'

export default function ProfileModal() {
  const dispatch = useAppDispatch()
  const isOpen = useAppSelector((s) => s.ui.profileOpen)
  const isLoggedIn = useAppSelector((s) => s.auth.isLoggedIn)
  const mobile = useAppSelector((s) => s.auth.mobile)
  const otpSent = useAppSelector((s) => s.auth.otpSent)
  const otpCode = useAppSelector((s) => s.auth.otpCode)
  const orders = useAppSelector((s) => s.orders.items)
  const cartItems = useAppSelector((s) => s.cart.items)
  const checkoutFlow = useAppSelector((s) => s.ui.checkoutFlow)
  const deliveryAddress = useAppSelector((s) => s.auth.deliveryAddress)

  const [phone, setPhone] = useState(mobile)
  const [otp, setOtp] = useState('')
  const [error, setError] = useState('')
  const [showSuccess, setShowSuccess] = useState(false)
  const [address, setAddress] = useState(deliveryAddress)
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
    setAddress(deliveryAddress)
  }, [deliveryAddress])

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
    }, 1800)

    return () => window.clearTimeout(timeout)
  }, [showSuccess])

  const orderSummary = useMemo(
    () =>
      orders.map((order) => ({
        ...order,
        count: order.items.reduce((sum, item) => sum + item.quantity, 0),
      })),
    [orders]
  )

  if (!isOpen) return null

  const handleSendOtp = () => {
    const cleanPhone = phone.replace(/\D/g, '')
    if (!/^\d{10}$/.test(cleanPhone)) {
      setError('Enter a valid 10-digit mobile number')
      return
    }

    setError('')
    dispatch(sendOtp(cleanPhone))
  }

  const handleVerifyOtp = () => {
    if (!otp.trim()) {
      setError('Enter the OTP')
      return
    }

    dispatch(verifyOtp(otp.trim()))
    setError('')
  }

  const handleLogout = () => {
    dispatch(logout())
    setTab('orders')
    setOtp('')
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
            <label className="field-label">Mobile number</label>
            <input
              type="tel"
              value={phone}
              maxLength={10}
              placeholder="Enter 10-digit number"
              onChange={(e) => setPhone(e.target.value)}
            />

            <button className="primary-button" type="button" onClick={handleSendOtp}>
              Send OTP
            </button>

            {otpSent && (
              <>
                <div className="otp-box">
                  <span>Demo OTP:</span>
                  <strong>{otpCode}</strong>
                </div>

                <label className="field-label">Enter OTP</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={otp}
                  maxLength={6}
                  placeholder="Enter 6-digit OTP"
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                />

                <button className="primary-button" type="button" onClick={handleVerifyOtp}>
                  Verify & Continue
                </button>
              </>
            )}

            {error && <div className="field-error">{error}</div>}
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
