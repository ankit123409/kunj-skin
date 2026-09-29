import { useEffect, useState } from 'react'
import './OrdersPage.css'
import { useAppSelector } from '../hooks'
import { getMyOrdersApi } from '../api/api'
import { navigate } from '../router'

type OrderRow = {
  id?: string
  _id?: string
  totalAmount?: number
  total?: number
  createdAt: string
  status: string
  items: Array<{
    id?: string
    _id?: string
    title: string
    price: number
    quantity: number
  }>
}

export default function OrdersPage() {
  const localOrders = useAppSelector((state) => state.orders.items)
  const [orders, setOrders] = useState<OrderRow[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const token = typeof window !== 'undefined' ? window.localStorage.getItem('kunj-skin-token') : null

    if (!token) {
      setOrders(localOrders.map((order) => ({
        id: order.id,
        totalAmount: order.total,
        createdAt: order.createdAt,
        status: order.status,
        items: order.items.map((item) => ({
          id: item.id ?? item._id,
          title: item.title,
          price: item.price,
          quantity: item.quantity,
        })),
      })))
      return
    }

    // let isMounted = true
    setLoading(true)

    getMyOrdersApi(token)
      .then((response) => {
        console.log("resesqqq",response);
        setOrders(response.data)
        
        // if (!isMounted) return

        // const rawOrders = Array.isArray(response)
        //   ? response
        //   : Array.isArray(response?.orders)
        //     ? response.orders
        //     : Array.isArray(response?.data)
        //       ? response.data
        //       : Array.isArray(response?.result)
        //         ? response.result
        //         : []

        // const mapped = rawOrders.map((order: any) => {
        //   const orderItems = Array.isArray(order.items) ? order.items : []

        //   return {
        //     id: order._id || order.id || `ORD-${Date.now()}-${Math.random()}`,
        //     total: Number(order.total ?? order.amount ?? 0),
        //     createdAt: order.createdAt || order.created_at || new Date().toISOString(),
        //     status: order.status || 'Placed',
        //     items: orderItems.map((item: any, index: number) => {
        //       const product = item.product || {}
        //       const productName = product.title || product.name || `Product ${index + 1}`
        //       const unitPrice = Number(item.price ?? product.price ?? 0)

        //       return {
        //         id: item._id || item.id || `${order._id || order.id || 'order'}-${index}`,
        //         title: productName,
        //         price: unitPrice,
        //         quantity: Number(item.quantity ?? 1),
        //       }
        //     }),
        //   }
        })

      //   setOrders(mapped)
      // })
      // .catch(() => {
      //   if (!isMounted) return
      //   setOrders(localOrders.map((order) => ({
      //     id: order.id,
      //     total: order.total,
      //     createdAt: order.createdAt,
      //     status: order.status,
      //     items: order.items.map((item) => ({
      //       id: item.id,
      //       title: item.title,
      //       price: item.price,
      //       quantity: item.quantity,
      //     })),
      //   })))
      // })
      // .finally(() => {
      //   if (isMounted) setLoading(false)
      // })

    return () => {
      // isMounted = false
    }
  }, [localOrders])

  const renderOrders = orders.length > 0 ? orders : localOrders.map((order) => ({
    id: order.id,
    _id: order._id,
    totalAmount: order.totalAmount ?? order.total ?? 0,
    createdAt: order.createdAt,
    status: order.status,
    items: order.items.map((item) => ({
      id: item._id ?? item.id,
      _id: item._id,
      title: item.title,
      price: item.price,
      quantity: item.quantity,
    })),
  }))

  return (
    <main className="orders-page">
      <div className="orders-page-container">
        <button className="back-button" onClick={() => navigate('/')}>
          <span>←</span>
          Back to Products
        </button>

        <div className="orders-header-row">
          <h1>My Orders</h1>
        </div>

        {loading && orders.length === 0 ? (
          <div className="orders-empty">
            <div className="empty-icon">📦</div>
            <h2>Loading orders...</h2>
          </div>
        ) : renderOrders.length === 0 ? (
          <div className="orders-empty">
            <div className="empty-icon">📦</div>
            <h2>No orders yet</h2>
            <p>Your placed orders will appear here.</p>
          </div>
        ) : (
          <div className="orders-list">
            {orders?.map((order, index) => (
              <button
                key={order._id || order.id || `order-${index}`}
                type="button"
                className="order-summary-card"
                onClick={() => navigate(`/order/${order._id || order.id}`)}
              >
               
                <div className="order-summary-top">
                  <strong>{order._id || order.id}</strong>
                  <span className="order-status-tag">{order.status}</span>
                </div>

                <div className="order-summary-meta">
                  <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                  <span>{order.items.reduce((sum, item) => sum + item.quantity, 0)} items</span>
                </div>

                <div className="order-summary-items">
                  {order.items.map((item) => (
                    <div key={`${order._id || order.id || 'order'}-${item.id || item._id || item.title}`} className="mini-item-row">
                      <span>{item.title}</span>
                      <strong>₹{item.price * item.quantity}</strong>
                    </div>
                  ))}
                </div>

                <div className="order-summary-total">Order total: ₹{order.totalAmount ?? order.total ?? 0}</div>
              </button>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
