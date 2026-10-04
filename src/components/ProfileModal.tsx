import { useEffect, useState } from 'react'
import './ProfileModal.css'
import { useAppDispatch, useAppSelector } from '../hooks'
import { closeProfile, finishCheckout } from '../store/uiSlice'
import { logout, register as registerUser, setDeliveryAddress, setAuthenticated } from '../store/authSlice'
import {
  registerApi,
  loginApi,
  getAddressesApi,
  createAddressApi,
  updateAddressApi,
  deleteAddressApi,
  createOrderApi,
  verifyPaymentApi,
  getAuthToken,
  getAddressId,
  type PaymentType,
  type RazorpayOrderData,
  type CreateOrderResponse,
  type OrderAddress,
  type SavedAddress,
} from '../api/api'
import { clearCart } from '../store/cartSlice'
import { placeOrder } from '../store/ordersSlice'
import { navigate } from '../router'
import { openRazorpayCheckout } from '../utils/razorpay'
import { notifyOrderWhatsApp } from '../utils/whatsapp'
import { isAdminRole } from '../utils/orderStatus'

const PAYMENT_TYPE_MAP = {
  cod: 1,
  card: 2,
  upi: 3,
} as const

type PaymentMethod = keyof typeof PAYMENT_TYPE_MAP
type AddressView = 'list' | 'form' | 'payment'

const emptyAddressForm = (phone = '') => ({
  fullName: '',
  phone,
  addressLine1: '',
  addressLine2: '',
  city: '',
  state: '',
  pincode: '',
  saveAs: 'Home',
  agree: true,
})

function getApiErrorMessage(err: unknown, fallback: string) {
  const axiosErr = err as { message?: string; response?: { data?: { message?: string; error?: string } } }
  return axiosErr?.response?.data?.message || axiosErr?.response?.data?.error || axiosErr?.message || fallback
}

function extractOrderFromResponse(response: CreateOrderResponse) {
  if (response?.data?.order) return response.data.order
  if (response?.data?._id) return response.data
  return response?.order
}

function extractRazorpayFromResponse(response: CreateOrderResponse): RazorpayOrderData | null {
  return response?.data?.razorpay ?? null
}

export default function ProfileModal() {
  const dispatch = useAppDispatch()
  const isOpen = useAppSelector((s) => s.ui.profileOpen)
  const isLoggedIn = useAppSelector((s) => s.auth.isLoggedIn)
  const mobile = useAppSelector((s) => s.auth.mobile)
  const role = useAppSelector((s) => s.auth.role)
  const loginError = useAppSelector((s) => s.auth.loginError)
  const cartItems = useAppSelector((s) => s.cart.items)
  const checkoutFlow = useAppSelector((s) => s.ui.checkoutFlow)

  const [authMode, setAuthMode] = useState<'register' | 'login'>('register')
  const [regName, setRegName] = useState('')
  const [regMobile, setRegMobile] = useState('')
  const [regPassword, setRegPassword] = useState('')
  const [loginMobile, setLoginMobile] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [error, setError] = useState('')
  const [authSuccess, setAuthSuccess] = useState(false)
  const [authMessage, setAuthMessage] = useState('')
  const [showSuccess, setShowSuccess] = useState(false)
  const [orderMessage, setOrderMessage] = useState('Order created successfully')
  const [checkoutForm, setCheckoutForm] = useState(emptyAddressForm(mobile || ''))
  const [tab, setTab] = useState<'orders' | 'account' | 'checkout' | 'products'>('account')

  const [addressView, setAddressView] = useState<AddressView>('list')
  const [addresses, setAddresses] = useState<SavedAddress[]>([])
  const [selectedAddressId, setSelectedAddressId] = useState('')
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null)
  const [loadingAddresses, setLoadingAddresses] = useState(false)
  const [deletingAddressId, setDeletingAddressId] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cod')
  const [upiId, setUpiId] = useState('')
  const [placingOrder, setPlacingOrder] = useState(false)
  const [savingAddress, setSavingAddress] = useState(false)

  useEffect(() => {
    setCheckoutForm((prev) => ({ ...prev, phone: mobile || prev.phone }))
  }, [mobile])

  useEffect(() => {
    if (checkoutFlow && isLoggedIn) {
      setTab('checkout')
    }
  }, [checkoutFlow, isLoggedIn])

  useEffect(() => {
    if (!isOpen || (checkoutFlow && isLoggedIn)) return
    setTab('account')
  }, [isOpen, checkoutFlow, isLoggedIn])

  useEffect(() => {
    if (!isOpen) return
    setAddressView('list')
    setEditingAddressId(null)
    setError('')
    setPaymentMethod('cod')
    setUpiId('')
    setPlacingOrder(false)
  }, [isOpen])

  const loadAddresses = async () => {
    const token = getAuthToken()
    if (!token) {
      setError('Please login again to load addresses')
      return
    }

    setLoadingAddresses(true)
    try {
      const response = await getAddressesApi(token)
      const list = response.addresses
      setAddresses(list)
      setError('')
      setAddresses(list)
      setSelectedAddressId((current) => {
        if (current && list.some((item) => getAddressId(item) === current)) return current
        return list[0] ? getAddressId(list[0]) : ''
      })
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Unable to load addresses'))
    } finally {
      setLoadingAddresses(false)
    }
  }

  useEffect(() => {
    if (!isOpen || !isLoggedIn) return
    void loadAddresses()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, isLoggedIn])

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
    registerApi({ name, mobile: mobileVal, password })
      .then((res) => {
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

        dispatch(registerUser({ name, mobile: mobileVal, password }))
        dispatch(setAuthenticated({ mobile: mobileVal, name: user?.name || name, role: user?.role }))

        setAuthMessage(msg)
        setAuthSuccess(true)
        setError('')

        window.setTimeout(() => {
          setAuthSuccess(false)
          dispatch(closeProfile())
        }, 1200)
      })
      .catch((err) => {
        setError(err?.response?.data?.message || 'Registration failed')
      })
  }

  const handleLogin = () => {
    const mobileVal = loginMobile.replace(/\D/g, '')
    const password = loginPassword

    if (!/^\d{10}$/.test(mobileVal) || !password) {
      setError('Enter mobile and password')
      return
    }

    setError('')
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

        dispatch(setAuthenticated({ mobile: mobileVal, name: user?.name, role: user?.role }))

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
  }

  const handleLogout = () => {
    dispatch(logout())
    setTab('account')
    setError('')
    setAddressView('list')
    setAddresses([])
    setSelectedAddressId('')
  }

  const resetPayment = () => {
    setAddressView('list')
    setPaymentMethod('cod')
    setUpiId('')
    setPlacingOrder(false)
  }

  const handleClose = () => {
    setShowSuccess(false)
    resetPayment()
    dispatch(closeProfile())
    dispatch(finishCheckout())
  }

  const fillFormFromAddress = (address: SavedAddress) => {
    setCheckoutForm({
      fullName: address.name || '',
      phone: address.mobile || mobile || '',
      addressLine1: address.addressLine1 || '',
      addressLine2: address.addressLine2 || '',
      city: address.city || '',
      state: address.state || '',
      pincode: address.pincode || '',
      saveAs: 'Home',
      agree: true,
    })
  }

  const openAddAddress = () => {
    setEditingAddressId(null)
    setCheckoutForm(emptyAddressForm(mobile || ''))
    setError('')
    setAddressView('form')
  }

  const openEditAddress = (address: SavedAddress) => {
    const id = getAddressId(address)
    if (!id) {
      setError('This address cannot be updated')
      return
    }
    setEditingAddressId(id)
    fillFormFromAddress(address)
    setError('')
    setAddressView('form')
  }

  const selectedAddress = addresses.find((item) => getAddressId(item) === selectedAddressId) || null

  const buildAddressPayload = (source?: SavedAddress | null): OrderAddress => {
    if (source) {
      return {
        name: source.name?.trim() || '',
        mobile: source.mobile?.trim() || '',
        addressLine1: source.addressLine1?.trim() || '',
        addressLine2: source.addressLine2?.trim() || '',
        city: source.city?.trim() || '',
        state: source.state?.trim() || '',
        pincode: source.pincode?.trim() || '',
      }
    }
    return {
      name: checkoutForm.fullName.trim(),
      mobile: checkoutForm.phone.trim(),
      addressLine1: checkoutForm.addressLine1.trim(),
      addressLine2: checkoutForm.addressLine2.trim(),
      city: checkoutForm.city.trim(),
      state: checkoutForm.state.trim(),
      pincode: checkoutForm.pincode.trim(),
    }
  }

  const validateAddress = () => {
    const { pincode, addressLine1, fullName, city, state, phone } = checkoutForm

    if (!fullName.trim() || !phone.trim() || !addressLine1.trim() || !city.trim() || !state.trim() || !pincode.trim()) {
      setError('Fill in all required delivery details')
      return false
    }
    if (!/^\d{10}$/.test(phone.trim())) {
      setError('Enter a valid 10-digit phone number')
      return false
    }
    if (!/^\d{6}$/.test(pincode.trim())) {
      setError('Enter a valid 6-digit pincode')
      return false
    }
    return true
  }

  const handleSaveAddress = async () => {
    if (!validateAddress()) return

    const token = getAuthToken()
    if (!token) {
      setError('Please login again to save your address')
      return
    }

    setError('')
    setSavingAddress(true)

    try {
      const payload = buildAddressPayload()
      const response = editingAddressId
        ? await updateAddressApi(editingAddressId, payload, token)
        : await createAddressApi(payload, token)

      if (response?.success === false) {
        throw new Error(response?.message || 'Unable to save address')
      }

      await loadAddresses()
      if (editingAddressId) setSelectedAddressId(editingAddressId)
      setEditingAddressId(null)
      setAddressView('list')
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Unable to save address'))
    } finally {
      setSavingAddress(false)
    }
  }

  const handleDeleteAddress = async (address: SavedAddress) => {
    const id = getAddressId(address)
    if (!id) {
      setError('This address cannot be deleted')
      return
    }

    const token = getAuthToken()
    if (!token) {
      setError('Please login again to delete this address')
      return
    }

    setError('')
    setDeletingAddressId(id)

    try {
      const response = await deleteAddressApi(id, token)
      if (response?.success === false) {
        throw new Error(response?.message || 'Unable to delete address')
      }
      if (selectedAddressId === id) setSelectedAddressId('')
      await loadAddresses()
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Unable to delete address'))
    } finally {
      setDeletingAddressId('')
    }
  }

  const handleContinueWithAddress = () => {
    if (!selectedAddress) {
      setError('Select an address to continue')
      return
    }
    fillFormFromAddress(selectedAddress)
    setError('')
    setAddressView('payment')
  }

  const buildOrderItems = () => {
    return cartItems
      .map((item) => {
        const productId =
          (item as typeof item & { _id?: string; id?: string })._id ??
          (item as typeof item & { _id?: string; id?: string }).id
        return productId ? { product: productId, quantity: item.quantity } : null
      })
      .filter(Boolean) as { product: string; quantity: number }[]
  }

  const completeCheckoutSuccess = (
    serverMessage: string,
    serverOrder?: { _id?: string; total?: number },
  ) => {
    const total =
      Number(serverOrder?.total) ||
      cartItems.reduce((sum, item) => sum + Number(item.price || 0) * item.quantity, 0)

    const order = {
      id: serverOrder?._id || `ORD-${Date.now()}`,
      total,
      createdAt: new Date().toISOString(),
      status: 'Placed' as const,
      items: cartItems.map((item) => ({ ...item })),
    }

    const addressText = [
      checkoutForm.fullName.trim(),
      checkoutForm.addressLine1.trim(),
      checkoutForm.city.trim(),
      checkoutForm.state.trim(),
      checkoutForm.pincode.trim(),
      `Phone: ${checkoutForm.phone.trim()}`,
    ].join(', ')

    setOrderMessage(serverMessage)
    dispatch(setDeliveryAddress(addressText))
    dispatch(placeOrder(order))
    notifyOrderWhatsApp({
      orderId: order.id,
      customerName: checkoutForm.fullName.trim(),
      customerPhone: checkoutForm.phone.trim(),
      totalAmount: total,
    })
    dispatch(clearCart())
    resetPayment()
    setShowSuccess(true)
    setTab('orders')
    setError('')
    dispatch(finishCheckout())
  }

  const openRazorpayForOrder = async (
    razorpay: RazorpayOrderData,
    method: 'card' | 'upi',
    token: string,
  ) => {
    await openRazorpayCheckout({
      key: razorpay.key,
      amount: razorpay.amount,
      currency: razorpay.currency || 'INR',
      orderId: razorpay.orderId,
      name: 'Kunj Skin',
      description: method === 'upi' ? 'Pay with UPI ID' : 'Pay with Card',
      method,
      prefill: {
        name: checkoutForm.fullName.trim(),
        email: '',
        contact: checkoutForm.phone.trim(),
        ...(method === 'upi' && upiId.trim()
          ? { vpa: upiId.trim().toLowerCase() }
          : {}),
      },
      upiFlow: method === 'upi' ? 'collect' : undefined,
      onDismiss: () => {
        setPlacingOrder(false)
        setError('Payment cancelled. Your order is pending — complete payment to confirm.')
      },
      onError: (message) => {
        setPlacingOrder(false)
        setError(message)
      },
      onSuccess: async (response) => {
        try {
          setPlacingOrder(true)
          const verifyRes = await verifyPaymentApi(
            {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            },
            token,
          )

          if (verifyRes?.success === false) {
            throw new Error(verifyRes?.message || 'Payment verification failed')
          }

          completeCheckoutSuccess(verifyRes?.message || 'Order placed successfully')
        } catch (err: unknown) {
          setError(getApiErrorMessage(err, 'Payment verification failed. Please contact support.'))
          setPlacingOrder(false)
        }
      },
    })
  }

  // Create order once. COD finishes immediately; Card/UPI open Razorpay then verify.
  const handlePlaceOrder = async () => {
    const orderAddress = buildAddressPayload(selectedAddress)

    if (!orderAddress.name || !orderAddress.mobile || !orderAddress.addressLine1 || !orderAddress.city || !orderAddress.state || !orderAddress.pincode) {
      setError('Select a valid delivery address')
      return
    }

    if (cartItems.length === 0) {
      setError('Your cart is empty')
      return
    }

    const validItems = buildOrderItems()
    if (validItems.length === 0) {
      setError('Unable to place order: product details are missing from your cart.')
      return
    }

    const token = getAuthToken()
    if (!token) {
      setError('Please login again to place your order')
      return
    }

    const paymentType: PaymentType = PAYMENT_TYPE_MAP[paymentMethod]

    if (paymentMethod === 'upi') {
      const vpa = upiId.trim().toLowerCase()
      if (!/^[a-zA-Z0-9.\-_]{2,}@[a-zA-Z]{2,}$/.test(vpa)) {
        setError('Enter a valid UPI ID (e.g. name@oksbi or success@razorpay)')
        return
      }
    }

    setError('')
    setPlacingOrder(true)

    try {
      const response = await createOrderApi(
        {
          items: validItems,
          paymentType,
          address: orderAddress,
        },
        token,
      )

      if (response?.success === false) {
        throw new Error(response?.message || 'Order creation failed')
      }

      // paymentType 1 = Cash → order already placed
      if (paymentType === 1) {
        completeCheckoutSuccess(
          response?.message || 'Order placed successfully',
          extractOrderFromResponse(response),
        )
        return
      }

      // paymentType 2/3 → open Razorpay from create-order response, then verify
      const razorpay = extractRazorpayFromResponse(response)
      if (!razorpay?.key || !razorpay?.orderId || !razorpay?.amount) {
        throw new Error('Payment details missing from server. Please try again.')
      }

      await openRazorpayForOrder(razorpay, paymentMethod === 'upi' ? 'upi' : 'card', token)
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Unable to place order'))
      setPlacingOrder(false)
    }
  }

  return (
    <div className="profile-modal-backdrop" onClick={handleClose}>
      <div className={`profile-modal ${checkoutFlow ? 'checkout-mode' : ''}`} onClick={(e) => e.stopPropagation()}>
        {showSuccess && (
          <div className="order-success-popup">
            <div className="success-icon">✓</div>
            <span>{orderMessage}</span>
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
            <h3>
              {addressView === 'payment'
                ? 'Payment'
                : addressView === 'form'
                  ? editingAddressId
                    ? 'Update address'
                    : 'Add new address'
                  : 'Delivery address'}
            </h3>
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
            {addressView !== 'payment' && (
              <div className="checkout-offer-banner">Unlock Extra 5% OFF on Prepaid Orders</div>
            )}

            {addressView === 'list' && (
              <div className="address-book">
                {loadingAddresses ? (
                  <p className="address-status">Loading addresses...</p>
                ) : addresses.length === 0 ? (
                  <p className="address-status">No saved addresses yet.</p>
                ) : (
                  <div className="address-list">
                    {addresses.map((address, index) => {
                      const id = getAddressId(address)
                      const selected = id === selectedAddressId
                      return (
                        <div
                          key={id || `${address.pincode}-${index}`}
                          className={selected ? 'address-card selected' : 'address-card'}
                          onClick={() => id && setSelectedAddressId(id)}
                          onKeyDown={(e) => {
                            if (id && (e.key === 'Enter' || e.key === ' ')) setSelectedAddressId(id)
                          }}
                          role="button"
                          tabIndex={0}
                        >
                          <div className="address-card-body">
                            <strong>{address.name || 'Name'}</strong>
                            <span>{address.mobile || 'Phone number'}</span>
                            <p>
                              {address.addressLine1 || 'Address line 1'}
                              {address.addressLine2 ? `, ${address.addressLine2}` : ''}
                            </p>
                            <p>
                              {address.city || 'City'}, {address.state || 'State'} - {address.pincode || '000000'}
                            </p>
                          </div>
                          <div className="address-card-actions">
                            <button type="button" onClick={(e) => { e.stopPropagation(); openEditAddress(address) }}>
                              Update
                            </button>
                            <button
                              type="button"
                              className="danger"
                              disabled={deletingAddressId === id}
                              onClick={(e) => {
                                e.stopPropagation()
                                void handleDeleteAddress(address)
                              }}
                            >
                              {deletingAddressId === id ? 'Deleting...' : 'Delete'}
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}

                <button className="ghost-button add-address-btn" type="button" onClick={openAddAddress}>
                  + Add new address
                </button>
                <button
                  className="primary-button"
                  type="button"
                  onClick={handleContinueWithAddress}
                  disabled={addresses.length === 0 || loadingAddresses}
                >
                  Continue
                </button>
              </div>
            )}

            {addressView === 'form' && (
              <>
                <button
                  type="button"
                  className="ghost-button edit-address-link"
                  onClick={() => {
                    setAddressView('list')
                    setEditingAddressId(null)
                    setError('')
                  }}
                >
                  ← Back to addresses
                </button>

                <label className="field-heading">Name <span>*</span></label>
                <input
                  type="text"
                  value={checkoutForm.fullName}
                  placeholder="Full name"
                  onChange={(e) => setCheckoutForm({ ...checkoutForm, fullName: e.target.value })}
                />

                <label className="field-heading">Phone number <span>*</span></label>
                <div className="phone-input-wrap">
                  <span className="flag">🇮🇳</span>
                  <input
                    type="tel"
                    value={checkoutForm.phone}
                    maxLength={10}
                    placeholder="10-digit mobile"
                    onChange={(e) => setCheckoutForm({ ...checkoutForm, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                  />
                </div>

                <label className="field-heading">Address line 1 <span>*</span></label>
                <input
                  type="text"
                  value={checkoutForm.addressLine1}
                  placeholder="House no., street, area"
                  onChange={(e) => setCheckoutForm({ ...checkoutForm, addressLine1: e.target.value })}
                />

                <label className="field-heading">Address line 2</label>
                <input
                  type="text"
                  value={checkoutForm.addressLine2}
                  placeholder="Landmark (optional)"
                  onChange={(e) => setCheckoutForm({ ...checkoutForm, addressLine2: e.target.value })}
                />

                <label className="field-heading">City <span>*</span></label>
                <input
                  type="text"
                  value={checkoutForm.city}
                  placeholder="City"
                  onChange={(e) => setCheckoutForm({ ...checkoutForm, city: e.target.value })}
                />

                <label className="field-heading">State <span>*</span></label>
                <input
                  type="text"
                  value={checkoutForm.state}
                  placeholder="State"
                  onChange={(e) => setCheckoutForm({ ...checkoutForm, state: e.target.value })}
                />

                <label className="field-heading">Pincode <span>*</span></label>
                <input
                  type="text"
                  value={checkoutForm.pincode}
                  maxLength={6}
                  placeholder="6-digit pincode"
                  onChange={(e) => setCheckoutForm({ ...checkoutForm, pincode: e.target.value.replace(/\D/g, '') })}
                />

                <button className="primary-button" type="button" onClick={handleSaveAddress} disabled={savingAddress}>
                  {savingAddress
                    ? editingAddressId
                      ? 'Updating address...'
                      : 'Saving address...'
                    : editingAddressId
                      ? 'Update address'
                      : 'Save address'}
                </button>
              </>
            )}

            {addressView === 'payment' && (
              <div className="payment-section">
                {selectedAddress && (
                  <div className="selected-address-summary">
                    <strong>{selectedAddress.name}</strong>
                    <span>
                      {selectedAddress.addressLine1}
                      {selectedAddress.addressLine2 ? `, ${selectedAddress.addressLine2}` : ''}, {selectedAddress.city}, {selectedAddress.state} - {selectedAddress.pincode}
                    </span>
                  </div>
                )}
                <button
                  type="button"
                  className="ghost-button edit-address-link"
                  onClick={() => setAddressView('list')}
                  disabled={placingOrder}
                >
                  ✎ Change address
                </button>

                <label className="field-heading">Choose payment method <span>*</span></label>

                <div className="payment-options">
                  {[
                    { value: 'cod', label: 'Cash', hint: 'Pay on delivery' },
                    { value: 'card', label: 'Card', hint: 'Via Razorpay' },
                    { value: 'upi', label: 'UPI ID', hint: 'Enter UPI ID' },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      className={paymentMethod === opt.value ? 'payment-option active' : 'payment-option'}
                      onClick={() => {
                        setPaymentMethod(opt.value as PaymentMethod)
                        setError('')
                      }}
                      disabled={placingOrder}
                    >
                      <strong>{opt.label}</strong>
                      <span>{opt.hint}</span>
                    </button>
                  ))}
                </div>

                {paymentMethod === 'cod' && (
                  <p className="payment-note">You will pay in cash when your order is delivered.</p>
                )}
                {paymentMethod === 'card' && (
                  <p className="payment-note">Secure card payment opens in Razorpay after you continue.</p>
                )}
                {paymentMethod === 'upi' && (
                  <>
                    <label className="field-heading">UPI ID / VPA <span>*</span></label>
                    <input
                      type="text"
                      value={upiId}
                      placeholder="name@oksbi"
                      autoComplete="off"
                      disabled={placingOrder}
                      onChange={(e) => setUpiId(e.target.value.replace(/\s/g, ''))}
                    />
                    <p className="payment-note">
                      Enter your UPI ID. Test mode: use <code>success@razorpay</code>
                    </p>
                  </>
                )}

                <button
                  className="primary-button"
                  type="button"
                  onClick={handlePlaceOrder}
                  disabled={placingOrder}
                >
                  {placingOrder
                    ? paymentMethod === 'cod'
                      ? 'Placing order...'
                      : 'Opening Razorpay...'
                    : paymentMethod === 'cod'
                      ? 'Place order'
                      : paymentMethod === 'upi'
                        ? 'Pay with UPI ID'
                        : 'Pay & place order'}
                </button>
              </div>
            )}

            {error && <div className="field-error">{error}</div>}
          </div>
        ) : (
          <>
            <div className="profile-tabs">
              <button
                type="button"
                className={tab === 'account' ? 'active-tab' : ''}
                onClick={() => setTab('account')}
              >
                Account
              </button>
              <button
                type="button"
                onClick={() => {
                  dispatch(closeProfile())
                  dispatch(finishCheckout())
                  navigate('/orders')
                }}
              >
                My Orders
              </button>
              {isAdminRole(role) && (
                <button
                  type="button"
                  onClick={() => {
                    dispatch(closeProfile())
                    dispatch(finishCheckout())
                    navigate('/admin/products')
                  }}
                >
                  Products
                </button>
              )}
            </div>

            {tab === 'account' && (
              <div className="account-panel">
                <div className="info-row">
                  <span>Mobile</span>
                  <strong>+91 {mobile}</strong>
                </div>
                {role ? (
                  <div className="info-row">
                    <span>Role</span>
                    <strong>{role}</strong>
                  </div>
                ) : null}
                <div className="info-row">
                  <span>Member since</span>
                  <strong>Today</strong>
                </div>

                <h4 className="address-book-title">Saved addresses</h4>

                {addressView === 'form' ? (
                  <div className="checkout-panel account-address-form">
                    <button
                      type="button"
                      className="ghost-button edit-address-link"
                      onClick={() => {
                        setAddressView('list')
                        setEditingAddressId(null)
                        setError('')
                      }}
                    >
                      ← Back to addresses
                    </button>

                    <label className="field-heading">Name <span>*</span></label>
                    <input
                      type="text"
                      value={checkoutForm.fullName}
                      placeholder="Full name"
                      onChange={(e) => setCheckoutForm({ ...checkoutForm, fullName: e.target.value })}
                    />

                    <label className="field-heading">Phone number <span>*</span></label>
                    <div className="phone-input-wrap">
                      <span className="flag">🇮🇳</span>
                      <input
                        type="tel"
                        value={checkoutForm.phone}
                        maxLength={10}
                        placeholder="10-digit mobile"
                        onChange={(e) => setCheckoutForm({ ...checkoutForm, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                      />
                    </div>

                    <label className="field-heading">Address line 1 <span>*</span></label>
                    <input
                      type="text"
                      value={checkoutForm.addressLine1}
                      placeholder="House no., street, area"
                      onChange={(e) => setCheckoutForm({ ...checkoutForm, addressLine1: e.target.value })}
                    />

                    <label className="field-heading">Address line 2</label>
                    <input
                      type="text"
                      value={checkoutForm.addressLine2}
                      placeholder="Landmark (optional)"
                      onChange={(e) => setCheckoutForm({ ...checkoutForm, addressLine2: e.target.value })}
                    />

                    <label className="field-heading">City <span>*</span></label>
                    <input
                      type="text"
                      value={checkoutForm.city}
                      placeholder="City"
                      onChange={(e) => setCheckoutForm({ ...checkoutForm, city: e.target.value })}
                    />

                    <label className="field-heading">State <span>*</span></label>
                    <input
                      type="text"
                      value={checkoutForm.state}
                      placeholder="State"
                      onChange={(e) => setCheckoutForm({ ...checkoutForm, state: e.target.value })}
                    />

                    <label className="field-heading">Pincode <span>*</span></label>
                    <input
                      type="text"
                      value={checkoutForm.pincode}
                      maxLength={6}
                      placeholder="6-digit pincode"
                      onChange={(e) => setCheckoutForm({ ...checkoutForm, pincode: e.target.value.replace(/\D/g, '') })}
                    />

                    <button className="primary-button" type="button" onClick={handleSaveAddress} disabled={savingAddress}>
                      {savingAddress
                        ? editingAddressId
                          ? 'Updating address...'
                          : 'Saving address...'
                        : editingAddressId
                          ? 'Update address'
                          : 'Save address'}
                    </button>
                    {error && <div className="field-error">{error}</div>}
                  </div>
                ) : (
                  <div className="address-book">
                    {loadingAddresses ? (
                      <p className="address-status">Loading addresses...</p>
                    ) : addresses.length === 0 ? (
                      <p className="address-status">No saved addresses yet.</p>
                    ) : (
                      <div className="address-list">
                        {addresses.map((address, index) => {
                          const id = getAddressId(address)
                          return (
                            <div key={id || `${address.pincode}-${index}`} className="address-card">
                              <div className="address-card-body">
                                <strong>{address.name || 'Name'}</strong>
                                <span>{address.mobile || 'Phone number'}</span>
                                <p>
                                  {address.addressLine1 || 'Address line 1'}
                                  {address.addressLine2 ? `, ${address.addressLine2}` : ''}
                                </p>
                                <p>
                                  {address.city || 'City'}, {address.state || 'State'} - {address.pincode || '000000'}
                                </p>
                              </div>
                              <div className="address-card-actions">
                                <button type="button" onClick={() => openEditAddress(address)}>Update</button>
                                <button
                                  type="button"
                                  className="danger"
                                  disabled={deletingAddressId === id}
                                  onClick={() => void handleDeleteAddress(address)}
                                >
                                  {deletingAddressId === id ? 'Deleting...' : 'Delete'}
                                </button>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                    <button className="ghost-button add-address-btn" type="button" onClick={openAddAddress}>
                      + Add new address
                    </button>
                    {error && <div className="field-error">{error}</div>}
                  </div>
                )}
              </div>
            )}

            <button type="button" className="profile-logout" onClick={handleLogout}>
              Logout
            </button>
          </>
        )}
      </div>
    </div>
  )
}
