import { useMemo, useState } from 'react'
import './ProfileModal.css'
import { useAppDispatch, useAppSelector } from '../hooks'
import { closeProfile } from '../store/uiSlice'
import { logout, sendOtp, verifyOtp } from '../store/authSlice'

export default function ProfileModal() {
  const dispatch = useAppDispatch()
  const isOpen = useAppSelector((s) => s.ui.profileOpen)
  const isLoggedIn = useAppSelector((s) => s.auth.isLoggedIn)
  const mobile = useAppSelector((s) => s.auth.mobile)
  const otpSent = useAppSelector((s) => s.auth.otpSent)
  const otpCode = useAppSelector((s) => s.auth.otpCode)
  const orders = useAppSelector((s) => s.orders.items)

  const [phone, setPhone] = useState(mobile)
  const [otp, setOtp] = useState('')
  const [error, setError] = useState('')
  const [tab, setTab] = useState<'orders' | 'account'>('orders')

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

  return (
    <div className="profile-modal-backdrop" onClick={() => dispatch(closeProfile())}>
      <div className="profile-modal" onClick={(e) => e.stopPropagation()}>
        <div className="profile-header">
          <div>
            <div className="profile-kicker">Account</div>
            <h3>{isLoggedIn ? 'My Profile' : 'Login to continue'}</h3>
          </div>
          <button className="profile-close" type="button" onClick={() => dispatch(closeProfile())}>✕</button>
        </div>

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
                    <div key={order.id} className="order-card">
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
                    </div>
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
