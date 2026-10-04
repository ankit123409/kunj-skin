import { useEffect, useState } from 'react'
import './OrderDetail.css'
import fallbackImage from '../assets/p1.png'
import { useAppSelector } from '../hooks'
import { navigate } from '../router'
import { getOrderByIdApi } from '../api/api'
import CustomerReviews from './CustomerReviews'
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
}

type OrderRecord = {
  id?: string
  _id?: string
  status?: string
  createdAt?: string
  total?: number
  totalAmount?: number
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

export default function OrderDetail({ id }: { id: string }) {
  const localOrder = useAppSelector((state) =>
    state.orders.items.find((entry) => entry.id === id || entry._id === id)
  ) as OrderRecord | undefined
  const isAdmin = isAdminRole(useAppSelector((state) => state.auth.role))
  const [order, setOrder] = useState<OrderRecord | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const token = typeof window !== 'undefined' ? window.localStorage.getItem('kunj-skin-token') : null

    // const normalizeOrder = (payload: any): OrderRecord | null => {
    //   if (!payload) return null

    //   const rawItems = Array.isArray(payload.items) ? payload.items : []

    //   return {
    //     id: payload._id || payload.id || id,
    //     status: payload.status || 'Placed',
    //     createdAt: payload.createdAt || payload.created_at || new Date().toISOString(),
    //     total: Number(payload.total ?? payload.amount ?? 0),
    //     items: rawItems.map((item: any, index: number) => {
    //       const product = item.product || item || {}
    //       const title = product.title || product.name || item.name || `Product ${index + 1}`
    //       const price = Number(item.price ?? product.price ?? 0)
    //       const quantity = Number(item.quantity ?? 1)

    //       return {
    //         id: item._id || item.id || product._id || `${payload._id || payload.id || id}-${index}`,
    //         title,
    //         price,
    //         quantity,
    //         image: product.image || item.image || item.img || product.img,
    //         img: product.img || item.img,
    //         size: product.size || item.size || '30ml',
    //       }
    //     }),
    //     address: payload.address || {
    //       name: payload.name,
    //       mobile: payload.mobile,
    //       addressLine1: payload.addressLine1,
    //       addressLine2: payload.addressLine2,
    //       city: payload.city,
    //       state: payload.state,
    //       pincode: payload.pincode,
    //     },
    //   }
    // }

    const loadOrder = async () => {
      try {
        setLoading(true)
        setError('')

        if (token) {
           const response = await getOrderByIdApi(id, token)
            console.log("payload111",response);
            setOrder(response.data as OrderRecord)
            return
        }
      } catch (err: any) {
        const message = err?.response?.data?.message || err?.response?.data?.error || 'Unable to load order.'
        setError(message)
      } finally {
        setLoading(false)
      }

      // if (!localOrder) {
      //   setOrder(null)
      //   return
      // }

      // setOrder({
      //   id: localOrder.id,
      //   status: localOrder.status,
      //   createdAt: localOrder.createdAt,
      //   total: Number(localOrder.total ?? 0),
      //   items: localOrder.items.map((item) => ({
      //     id: item.id,
      //     title: item.title,
      //     price: Number(item.price ?? 0),
      //     quantity: Number(item.quantity ?? 1),
      //     image: item.image || item.img,
      //     img: item.img,
      //     size: item.size || '30ml',
      //   })),
      //   address: {
      //     name: '',
      //     mobile: '',
      //     addressLine1: '',
      //     city: '',
      //     state: '',
      //     pincode: '',
      //   },
      // })
    }

    loadOrder()
  }, [id, localOrder])

  const orderData = order || localOrder

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
console.log("orderData?.items ",orderData?.items );

  const items = orderData?.items ?? []
  // const subtotal = useMemo(
  //   () => items.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 1), 0),
  //   [items]
  // )
  const itemCount = items.reduce((sum, item) => sum + Number(item.quantity || 1), 0)
  // const shipping = subtotal > 799 ? 0 : 49
  const total = orderData?.totalAmount ?? orderData?.total ?? 0
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
                    orderId={orderData?._id || orderData?.id || id}
                    status={orderData?.status || 'pending'}
                    onUpdated={(nextStatus) => {
                      setOrder((current) => ({
                        ...(current || orderData || { items: [] }),
                        items: current?.items || orderData?.items || [],
                        status: nextStatus,
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
                    <span>{itemCount} items</span>
                    <strong>₹{total}</strong>
                  </div>
                  <div className="order-summary-row">
                    <span>Discount</span>
                    <strong>₹0</strong>
                  </div>
                  <div className="order-summary-total">
                    <span>Total</span>
                    <strong>₹{total}</strong>
                  </div>
                </div>
              </div>
            </div>

            <CustomerReviews variant="input" />
            {error && <div className="field-error order-error">{error}</div>}
          </>
        )}
      </div>
    </main>
  )
}
