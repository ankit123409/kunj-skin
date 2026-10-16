import { useEffect, useState } from 'react'
import './OrderDetail.css'
import fallbackImage from '../assets/p1.png'
import { useAppSelector } from '../hooks'
import { navigate } from '../router'
import {
  assignCourierApi,
  cancelShipmentApi,
  createShipmentApi,
  generateShippingLabelApi,
  getAvailableCouriersApi,
  getOrderByIdApi,
  getOrderTrackingApi,
  schedulePickupApi,
  type CourierOption,
} from '../api/api'
import ProductReviewSection from './ProductReviewSection'
import OrderStatusSelect from './OrderStatusSelect'
import { isAdminRole, statusHint, statusLabel } from '../utils/orderStatus'

type OrderProduct = {
  id?: string
  _id?: string
  title: string
  price: number
  quantity: number
  image?: string
  img?: string
  size?: string
  product?: string | { _id?: string; id?: string; title?: string; name?: string }
  product_id?: string
  productId?: string
}

function reviewTargets(items: OrderProduct[]) {
  const seen = new Set<string>()
  const targets: { productId: string; title: string }[] = []

  items.forEach((item) => {
    const product = item.product
    let productId = ''
    let title = item.title

    if (typeof product === 'string') {
      productId = product
    } else if (product && typeof product === 'object') {
      productId = String(product._id || product.id || '')
      title = product.title || product.name || item.title
    } else {
      productId = String(item.product_id || item.productId || '')
    }

    if (!productId || seen.has(productId)) return
    seen.add(productId)
    targets.push({ productId, title })
  })

  return targets
}

type ShippingRecord = {
  shippingMethod?: string
  shippingStatus?: string
  paymentMethod?: string
  paymentStatus?: string
  shiprocketOrderId?: string
  shipmentId?: string
  courierName?: string
  awb?: string
  shippingCharge?: number | string
  estimatedDelivery?: string
  pickupStatus?: string
  trackingUrl?: string
  labelUrl?: string
  trackingHistory?: Array<{
    status?: string
    date?: string
    description?: string
    createdAt?: string
    timestamp?: string
  }>
}

type OrderRecord = {
  id?: string
  _id?: string
  status?: string
  createdAt?: string
  total?: number
  subtotal?: number
  shippingAmount?: number
  taxAmount?: number
  discountAmount?: number
  discountPercentage?: number
  couponCode?: string
  couponId?: string
  totalAmount?: number
  shippingMethod?: string
  shipping_method?: string
  shippingStatus?: string
  shipmentStatus?: string
  paymentMethod?: string
  paymentStatus?: string
  shiprocketOrderId?: string
  shipmentId?: string
  courierName?: string
  awb?: string
  trackingUrl?: string
  estimatedDelivery?: string
  pickupStatus?: string
  labelUrl?: string
  items: OrderProduct[]
  address?: {
    name?: string
    mobile?: string
    addressLine1?: string
    addressLine2?: string
    city?: string
    state?: string
    pincode?: string
  }
}

function normalizeShippingRecord(order: OrderRecord | null): ShippingRecord {
  if (!order) return {}

  const shippingMethod = String(order.shippingMethod ?? order.shipping_method ?? '').trim().toLowerCase()
  const shippingStatus = String(order.shippingStatus ?? order.shipmentStatus ?? '').trim()

  return {
    shippingMethod: shippingMethod || 'not_selected',
    shippingStatus: shippingStatus || 'not_created',
    paymentMethod: String(order.paymentMethod ?? '').trim() || 'unknown',
    paymentStatus: String(order.paymentStatus ?? '').trim() || 'pending',
    shiprocketOrderId: String(order.shiprocketOrderId ?? '').trim() || '',
    shipmentId: String(order.shipmentId ?? '').trim() || '',
    courierName: String(order.courierName ?? '').trim() || '',
    awb: String(order.awb ?? '').trim() || '',
    shippingCharge: order.shippingAmount ?? 0,
    estimatedDelivery: String(order.estimatedDelivery ?? '').trim() || '',
    pickupStatus: String(order.pickupStatus ?? '').trim() || 'not_scheduled',
    trackingUrl: String(order.trackingUrl ?? '').trim() || '',
    labelUrl: String(order.labelUrl ?? '').trim() || '',
  }
}

export default function OrderDetail({ id }: { id: string }) {
  const localOrder = useAppSelector((state) =>
    state.orders.items.find((entry) => entry.id === id || entry._id === id)
  ) as OrderRecord | undefined
  const isAdmin = isAdminRole(useAppSelector((state) => state.auth.role))
  const [order, setOrder] = useState<OrderRecord | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [shippingStatus, setShippingStatus] = useState<ShippingRecord>({})
  const [couriers, setCouriers] = useState<CourierOption[]>([])
  const [selectedCourierId, setSelectedCourierId] = useState<string>('')
  const [shippingBusy, setShippingBusy] = useState(false)
  const [shippingMessage, setShippingMessage] = useState('')
  const [shippingError, setShippingError] = useState('')
  const [trackingHistory, setTrackingHistory] = useState<Array<{ status?: string; date?: string; description?: string; createdAt?: string; timestamp?: string }>>([])

  useEffect(() => {
    const token = typeof window !== 'undefined' ? window.localStorage.getItem('kunj-skin-token') : null

    const loadOrder = async () => {
      try {
        setLoading(true)
        setError('')

        if (token) {
          const response = await getOrderByIdApi(id, token)
          const payload = (response && typeof response === 'object' && 'data' in response ? response.data : response) as OrderRecord | null
          setOrder(payload)
          setShippingStatus(normalizeShippingRecord(payload))
          return
        }
      } catch (err: unknown) {
        const message = err && typeof err === 'object' && 'response' in err
          ? ((err as { response?: { data?: { message?: string; error?: string } } }).response?.data?.message || (err as { response?: { data?: { error?: string } } }).response?.data?.error || 'Unable to load order.')
          : 'Unable to load order.'
        setError(message)
      } finally {
        setLoading(false)
      }
    }

    void loadOrder()
  }, [id])

  useEffect(() => {
    const mergedOrder = order || localOrder || null
    setShippingStatus(normalizeShippingRecord(mergedOrder))
  }, [order, localOrder])

  const orderData = order || localOrder
  const orderId = String(orderData?._id || orderData?.id || id)
  const persistedShippingMethod = (() => {
    if (typeof window === 'undefined') return ''
    try {
      const raw = window.sessionStorage.getItem('kunj-skin-order-shipping-methods')
      if (!raw) return ''
      const parsed = JSON.parse(raw) as Record<string, string>
      return String(parsed[orderId] || '').trim().toLowerCase()
    } catch {
      return ''
    }
  })()

  const shippingMethod = String(shippingStatus.shippingMethod || orderData?.shippingMethod || orderData?.shipping_method || persistedShippingMethod || '').trim().toLowerCase()
  const showShippingManagement = isAdmin && (
    shippingMethod === 'shiprocket' ||
    shippingMethod === 'own' ||
    orderData?.status === 'confirmed' ||
    Boolean(shippingStatus.shipmentId) ||
    Boolean(orderData?.shipmentId) ||
    Boolean(shippingStatus.shippingStatus && shippingStatus.shippingStatus !== 'not_created' && shippingStatus.shippingStatus !== 'not_selected') ||
    Boolean(orderData?.shippingStatus && orderData?.shippingStatus !== 'not_created' && orderData?.shippingStatus !== 'not_selected')
  )
  const shipmentCreated = Boolean(
    shippingStatus.shipmentId || orderData?.shipmentId || (shippingStatus.shippingStatus && shippingStatus.shippingStatus !== 'not_created' && shippingStatus.shippingStatus !== 'not_selected') || (orderData?.shippingStatus && orderData.shippingStatus !== 'not_created' && orderData.shippingStatus !== 'not_selected')
  )

  const handleCheckCouriers = async () => {
    const token = typeof window !== 'undefined' ? window.localStorage.getItem('kunj-skin-token') : null
    if (!token) {
      setShippingError('Please login again to manage shipping.')
      return
    }

    try {
      setShippingBusy(true)
      setShippingError('')
      const result = await getAvailableCouriersApi(orderId, token)
      const nextCouriers = Array.isArray(result) ? result : []
      setCouriers(nextCouriers)
      if (!nextCouriers.length) {
        setShippingMessage('No couriers are available for this order right now.')
      } else {
        setShippingMessage('Available couriers loaded successfully.')
      }
    } catch (err: unknown) {
      const message = err && typeof err === 'object' && 'response' in err
        ? ((err as { response?: { data?: { message?: string; error?: string } } }).response?.data?.message || (err as { response?: { data?: { error?: string } } }).response?.data?.error || 'Unable to fetch courier list.')
        : 'Unable to fetch courier list.'
      setShippingError(message)
    } finally {
      setShippingBusy(false)
    }
  }

  const handleCreateShipment = async () => {
    const token = typeof window !== 'undefined' ? window.localStorage.getItem('kunj-skin-token') : null
    if (!token) {
      setShippingError('Please login again to create shipment.')
      return
    }

    try {
      setShippingBusy(true)
      setShippingError('')
      const response = await createShipmentApi(orderId, token)
      const payload = response && typeof response === 'object' && 'data' in response ? response.data : response
      const nextShipmentId = typeof payload === 'object' && payload ? (payload as { shipmentId?: string; id?: string; _id?: string }).shipmentId || (payload as { shipmentId?: string; id?: string; _id?: string }).id || (payload as { shipmentId?: string; id?: string; _id?: string })._id : ''
      setShippingStatus((current) => ({
        ...current,
        shipmentId: nextShipmentId || current.shipmentId || 'created',
        shippingStatus: 'created',
      }))
      setShippingMessage('Shipment created successfully.')
    } catch (err: unknown) {
      const message = err && typeof err === 'object' && 'response' in err
        ? ((err as { response?: { data?: { message?: string; error?: string } } }).response?.data?.message || (err as { response?: { data?: { error?: string } } }).response?.data?.error || 'Unable to create shipment.')
        : 'Unable to create shipment.'
      setShippingError(message)
    } finally {
      setShippingBusy(false)
    }
  }

  const handleAssignCourier = async () => {
    const token = typeof window !== 'undefined' ? window.localStorage.getItem('kunj-skin-token') : null
    if (!token) {
      setShippingError('Please login again to assign courier.')
      return
    }

    if (!selectedCourierId) {
      setShippingError('Select a courier before assigning.')
      return
    }

    try {
      setShippingBusy(true)
      setShippingError('')
      const courier = couriers.find((item) => String(item.courierId ?? item.id) === String(selectedCourierId))
      await assignCourierApi(orderId, selectedCourierId, token)
      setShippingStatus((current) => ({
        ...current,
        courierName: String(courier?.courierName || courier?.name || current.courierName || ''),
        shippingStatus: 'courier_assigned',
      }))
      setShippingMessage('Courier assigned and AWB generated.')
    } catch (err: unknown) {
      const message = err && typeof err === 'object' && 'response' in err
        ? ((err as { response?: { data?: { message?: string; error?: string } } }).response?.data?.message || (err as { response?: { data?: { error?: string } } }).response?.data?.error || 'Unable to assign courier.')
        : 'Unable to assign courier.'
      setShippingError(message)
    } finally {
      setShippingBusy(false)
    }
  }

  const handleSchedulePickup = async () => {
    const token = typeof window !== 'undefined' ? window.localStorage.getItem('kunj-skin-token') : null
    if (!token) {
      setShippingError('Please login again to schedule pickup.')
      return
    }

    try {
      setShippingBusy(true)
      setShippingError('')
      await schedulePickupApi(orderId, token)
      setShippingStatus((current) => ({ ...current, pickupStatus: 'scheduled' }))
      setShippingMessage('Pickup scheduled successfully.')
    } catch (err: unknown) {
      const message = err && typeof err === 'object' && 'response' in err
        ? ((err as { response?: { data?: { message?: string; error?: string } } }).response?.data?.message || (err as { response?: { data?: { error?: string } } }).response?.data?.error || 'Unable to schedule pickup.')
        : 'Unable to schedule pickup.'
      setShippingError(message)
    } finally {
      setShippingBusy(false)
    }
  }

  const handleGenerateLabel = async () => {
    const token = typeof window !== 'undefined' ? window.localStorage.getItem('kunj-skin-token') : null
    if (!token) {
      setShippingError('Please login again to generate label.')
      return
    }

    try {
      setShippingBusy(true)
      setShippingError('')
      await generateShippingLabelApi(orderId, token)
      setShippingMessage('Shipping label generated successfully.')
    } catch (err: unknown) {
      const message = err && typeof err === 'object' && 'response' in err
        ? ((err as { response?: { data?: { message?: string; error?: string } } }).response?.data?.message || (err as { response?: { data?: { error?: string } } }).response?.data?.error || 'Unable to generate label.')
        : 'Unable to generate label.'
      setShippingError(message)
    } finally {
      setShippingBusy(false)
    }
  }

  const handleTrackShipment = async () => {
    const token = typeof window !== 'undefined' ? window.localStorage.getItem('kunj-skin-token') : null
    if (!token) {
      setShippingError('Please login again to track shipment.')
      return
    }

    try {
      setShippingBusy(true)
      setShippingError('')
      const response = await getOrderTrackingApi(orderId, token)
      const history = Array.isArray((response as { history?: typeof trackingHistory }).history)
        ? (response as { history?: typeof trackingHistory }).history ?? []
        : Array.isArray((response as { tracking?: typeof trackingHistory }).tracking)
          ? (response as { tracking?: typeof trackingHistory }).tracking ?? []
          : []
      setTrackingHistory(history)
      setShippingStatus((current) => ({
        ...current,
        trackingUrl: String((response as { trackingUrl?: string })?.trackingUrl ?? current.trackingUrl ?? '').trim() || ''
      }))
      setShippingMessage('Tracking information refreshed.')
    } catch (err: unknown) {
      const message = err && typeof err === 'object' && 'response' in err
        ? ((err as { response?: { data?: { message?: string; error?: string } } }).response?.data?.message || (err as { response?: { data?: { error?: string } } }).response?.data?.error || 'Unable to load tracking.')
        : 'Unable to load tracking.'
      setShippingError(message)
    } finally {
      setShippingBusy(false)
    }
  }

  const handleCancelShipment = async () => {
    const token = typeof window !== 'undefined' ? window.localStorage.getItem('kunj-skin-token') : null
    if (!token) {
      setShippingError('Please login again to cancel shipment.')
      return
    }

    const confirmCancel = typeof window !== 'undefined' ? window.confirm('Are you sure you want to cancel this shipment?') : true
    if (!confirmCancel) return

    try {
      setShippingBusy(true)
      setShippingError('')
      await cancelShipmentApi(orderId, token)
      setShippingStatus((current) => ({ ...current, shippingStatus: 'cancelled' }))
      setShippingMessage('Shipment cancelled successfully.')
    } catch (err: unknown) {
      const message = err && typeof err === 'object' && 'response' in err
        ? ((err as { response?: { data?: { message?: string; error?: string } } }).response?.data?.message || (err as { response?: { data?: { error?: string } } }).response?.data?.error || 'Unable to cancel shipment.')
        : 'Unable to cancel shipment.'
      setShippingError(message)
    } finally {
      setShippingBusy(false)
    }
  }

  if (!orderData && !loading) {
    return (
      <main className="order-detail-page">
        <div className="detail-container">
          <button className="back-button" onClick={() => navigate('/')}>
            <span>←</span>
            Back to Products
          </button>

          <div className="order-not-found">
            <h2>Order not found</h2>
            <button onClick={() => navigate('/')}>Go home</button>
          </div>
        </div>
      </main>
    )
  }

  const items = orderData?.items ?? []
  const itemCount = items.reduce((sum, item) => sum + Number(item.quantity || 1), 0)
  const subtotalValue = Number(orderData?.subtotal ?? items.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 1), 0))
  const discountAmount = Number(orderData?.discountAmount ?? 0)
  const shippingAmount = Number(orderData?.shippingAmount ?? 0)
  const taxAmount = Number(orderData?.taxAmount ?? 0)
  const total = orderData?.totalAmount ?? orderData?.total ?? Math.max(subtotalValue - discountAmount + shippingAmount + taxAmount, 0)
  const discountPercentage = Number(orderData?.discountPercentage ?? 0)
  const couponCode = orderData?.couponCode || 'NO COUPON'
  const address = orderData?.address ?? {}

  return (
    <main className="order-detail-page">
      <div className="detail-container">
        <button className="back-button" onClick={() => navigate('/')}>
          <span>←</span>
          Back to Products
        </button>

        {loading ? (
          <div className="order-loader">Loading order details...</div>
        ) : (
          <>
            <div className="detail-grid order-detail-grid order-detail-single">
              <div className="detail-info detail-info--full">
                <div className="detail-header-row">
                  <div className="detail-category">Order Summary</div>
                  <div className="detail-badge">{statusLabel(orderData?.status || 'pending', orderData?.createdAt)}</div>
                </div>

                {isAdmin && (
                  <OrderStatusSelect
                    orderId={orderId}
                    status={orderData?.status || 'pending'}
                    onUpdated={(nextStatus, nextShippingMethod) => {
                      setOrder((current) => ({
                        ...(current || orderData || { items: [] }),
                        items: current?.items || orderData?.items || [],
                        status: nextStatus,
                        shippingMethod: nextShippingMethod || current?.shippingMethod || orderData?.shippingMethod || '',
                      }))
                    }}
                  />
                )}

                <div className="order-top-meta">
                  <div className="order-id-wrap">
                    <div className="order-id-label">Order ID</div>
                    <div className="order-id-value">{orderData?.id || id}</div>
                  </div>
                  <div className="order-date-wrap">
                    <div className="order-id-label">Placed on</div>
                    <div className="order-date-value">
                      {new Date(orderData?.createdAt || Date.now()).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                      })}
                    </div>
                  </div>
                </div>

                <h2 className="detail-title">{statusLabel(orderData?.status || 'pending', orderData?.createdAt)}</h2>

                <p className="detail-description">
                  {statusHint(orderData?.status || 'pending')}
                </p>

                <div className="order-address-card">
                  <h3>Delivery Address</h3>
                  <div className="order-address-line">{address.name || 'Customer Name'}</div>
                  <div className="order-address-line">{address.mobile || 'Mobile unavailable'}</div>
                  <div className="order-address-line">{address.addressLine1 || 'Address line 1'}</div>
                  {address.addressLine2 ? <div className="order-address-line">{address.addressLine2}</div> : null}
                  <div className="order-address-line">
                    {address.city || 'City'}, {address.state || 'State'} - {address.pincode || '000000'}
                  </div>
                </div>

                <div className="order-items-panel">
                  {items.map((item) => (
                    <div key={`${orderData?._id || orderData?.id || id}-${item._id || item.id || item.title}`} className="order-product-row">
                      <img
                        src={item.image || item.img || fallbackImage}
                        alt={item.title}
                        className="order-product-image"
                      />

                      <div className="order-product-meta">
                        <strong>{item.title}</strong>
                        <span>{item.size || '30ml'}</span>
                        <small>Qty: {item.quantity}</small>
                      </div>

                      <div className="order-price-box">₹{Number(item.price || 0) * Number(item.quantity || 1)}</div>
                    </div>
                  ))}
                </div>

                <div className="order-summary-box">
                  <div className="order-summary-row">
                    <span>Coupon</span>
                    <strong>{couponCode}</strong>
                  </div>
                  <div className="order-summary-row">
                    <span>{itemCount} items</span>
                    <strong>₹{subtotalValue}</strong>
                  </div>
                  {discountAmount > 0 ? (
                    <div className="order-summary-row">
                      <span>Discount {discountPercentage ? `(${discountPercentage}%)` : ''}</span>
                      <strong>-₹{discountAmount}</strong>
                    </div>
                  ) : null}
                  {shippingAmount > 0 ? (
                    <div className="order-summary-row">
                      <span>Shipping</span>
                      <strong>₹{shippingAmount}</strong>
                    </div>
                  ) : null}
                  {taxAmount > 0 ? (
                    <div className="order-summary-row">
                      <span>Tax</span>
                      <strong>₹{taxAmount}</strong>
                    </div>
                  ) : null}
                  <div className="order-summary-total">
                    <span>Total</span>
                    <strong>₹{total}</strong>
                  </div>
                </div>
              </div>
            </div>

            {showShippingManagement && (
              <section className="shipping-management-panel">
                <div className="shipping-panel-header">
                  <div>
                    <p className="shipping-panel-kicker">Shipment</p>
                    <h3>{shippingMethod === 'shiprocket' ? 'Shiprocket Order' : 'Shipping Management'}</h3>
                  </div>
                  <span className="shipping-status-pill">{shippingStatus.shippingStatus || 'pending'}</span>
                </div>

                <div className="shipping-meta-grid">
                  <div><span>Order ID</span><strong>{orderId}</strong></div>
                  <div><span>Shipping Method</span><strong>{shippingStatus.shippingMethod || 'Shiprocket'}</strong></div>
                  <div><span>Payment Method</span><strong>{shippingStatus.paymentMethod || 'Unknown'}</strong></div>
                  <div><span>Payment Status</span><strong>{shippingStatus.paymentStatus || 'Pending'}</strong></div>
                  <div><span>Shipment Status</span><strong>{shippingStatus.shippingStatus || 'Not created'}</strong></div>
                  <div><span>Shipment ID</span><strong>{shippingStatus.shipmentId || '—'}</strong></div>
                  <div><span>Courier Name</span><strong>{shippingStatus.courierName || '—'}</strong></div>
                  <div><span>AWB</span><strong>{shippingStatus.awb || '—'}</strong></div>
                  <div><span>Shipping Charge</span><strong>{shippingStatus.shippingCharge ? `₹${shippingStatus.shippingCharge}` : '—'}</strong></div>
                  <div><span>Estimated Delivery</span><strong>{shippingStatus.estimatedDelivery || '—'}</strong></div>
                  <div><span>Pickup Status</span><strong>{shippingStatus.pickupStatus || 'Not scheduled'}</strong></div>
                  <div><span>Tracking URL</span><strong>{shippingStatus.trackingUrl ? 'Available' : '—'}</strong></div>
                </div>

                {!shipmentCreated ? (
                  <div className="shipping-actions-row">
                    <button type="button" className="secondary-button" onClick={() => void handleCheckCouriers()} disabled={shippingBusy}>
                      {shippingBusy ? 'Loading...' : 'Check Available Couriers'}
                    </button>
                    <button type="button" className="primary-button" onClick={() => void handleCreateShipment()} disabled={shippingBusy}>
                      {shippingBusy ? 'Creating...' : 'Create Shipment'}
                    </button>
                  </div>
                ) : (
                  <div className="shipping-actions-row">
                    <button type="button" className="secondary-button" onClick={() => void handleCheckCouriers()} disabled={shippingBusy}>
                      Check Available Couriers
                    </button>
                    <button type="button" className="primary-button" onClick={() => void handleAssignCourier()} disabled={shippingBusy || !selectedCourierId}>
                      Assign Courier / Generate AWB
                    </button>
                    <button type="button" className="secondary-button" onClick={() => void handleSchedulePickup()} disabled={shippingBusy}>
                      Schedule Pickup
                    </button>
                    <button type="button" className="secondary-button" onClick={() => void handleGenerateLabel()} disabled={shippingBusy}>
                      Generate Label
                    </button>
                    <button type="button" className="secondary-button" onClick={() => void handleTrackShipment()} disabled={shippingBusy}>
                      Track Shipment
                    </button>
                    <button type="button" className="danger-button" onClick={() => void handleCancelShipment()} disabled={shippingBusy}>
                      Cancel Shipment
                    </button>
                  </div>
                )}

                {couriers.length > 0 && (
                  <div className="courier-list">
                    {couriers.map((courier) => {
                      const courierId = String(courier.courierId ?? courier.id ?? '')
                      const selected = selectedCourierId === courierId
                      const courierCharge = courier.freightCharge ?? courier.charge ?? courier.shippingCharge ?? 0
                      const courierDelivery = courier.estimatedDeliveryDate || courier.estimatedDelivery || courier.deliveryDays || courier.estimatedDeliveryDays || courier.etd || 'Delivery estimate available'
                      const courierName = courier.courierName || courier.name || 'Courier'

                      return (
                        <button
                          type="button"
                          key={courierId || `${courierName}-${courierCharge}`}
                          className={`courier-option ${selected ? 'selected' : ''}`}
                          onClick={() => setSelectedCourierId(courierId)}
                        >
                          <div>
                            <strong>{courierName}</strong>
                            <small>
                              {courier.codAvailable === false ? 'COD unavailable' : `Charge: ₹${Number(courierCharge || 0)}`} 
                            </small>
                          </div>
                          <span>{courierDelivery}</span>
                        </button>
                      )
                    })}
                  </div>
                )}

                {trackingHistory.length > 0 && (
                  <div className="tracking-history-box">
                    <h4>Tracking History</h4>
                    {trackingHistory.map((entry, index) => (
                      <div key={`${entry.status || 'status'}-${index}`} className="tracking-entry">
                        <span>{entry.date || entry.createdAt || entry.timestamp || 'Recent'}</span>
                        <strong>{entry.status || 'Updated'}</strong>
                        <p>{entry.description || 'Shipment status updated.'}</p>
                      </div>
                    ))}
                  </div>
                )}

                {(shippingMessage || shippingError) && (
                  <div className={`shipping-feedback ${shippingError ? 'error' : 'success'}`}>
                    {shippingError || shippingMessage}
                  </div>
                )}
              </section>
            )}

            {reviewTargets(items).map((target) => (
              <ProductReviewSection
                key={target.productId}
                productId={target.productId}
                productTitle={target.title}
                isAdmin={isAdmin}
              />
            ))}
            {error && <div className="field-error order-error">{error}</div>}
          </>
        )}
      </div>
    </main>
  )
}
