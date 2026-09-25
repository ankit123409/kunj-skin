import './OrdersPage.css'
import { useAppSelector } from '../hooks'
import { navigate } from '../router'

export default function OrdersPage() {
  const orders = useAppSelector((state) => state.orders.items)

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

        {orders.length === 0 ? (
          <div className="orders-empty">
            <div className="empty-icon">📦</div>
            <h2>No orders yet</h2>
            <p>Your placed orders will appear here.</p>
          </div>
        ) : (
          <div className="orders-list">
            {orders.map((order) => (
              <button
                key={order.id}
                type="button"
                className="order-summary-card"
                onClick={() => navigate(`/order/${order.id}`)}
              >
                <div className="order-summary-top">
                  <strong>{order.id}</strong>
                  <span className="order-status-tag">{order.status}</span>
                </div>

                <div className="order-summary-meta">
                  <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                  <span>{order.items.reduce((sum, item) => sum + item.quantity, 0)} items</span>
                </div>

                <div className="order-summary-items">
                  {order.items.map((item) => (
                    <div key={`${order.id}-${item.id}`} className="mini-item-row">
                      <span>{item.title}</span>
                      <strong>₹{item.price * item.quantity}</strong>
                    </div>
                  ))}
                </div>

                <div className="order-summary-total">Order total: ₹{order.total}</div>
              </button>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
