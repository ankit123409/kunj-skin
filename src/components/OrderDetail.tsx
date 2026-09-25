import './OrderDetail.css'
import { useAppSelector } from '../hooks'
import { navigate } from '../router'

export default function OrderDetail({ id }: { id: string }) {
  const order = useAppSelector((state) =>
    state.orders.items.find((entry) => entry.id === id)
  )

  if (!order) {
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

  const subtotal = order.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  )
  const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0)
  const shipping = subtotal > 799 ? 0 : 49
  const total = order.total ?? subtotal + shipping

  return (
    <main className="order-detail-page">
      <div className="detail-container">
        <button className="back-button" onClick={() => navigate('/')}>
          <span>←</span>
          Back to Products
        </button>

        <div className="detail-grid order-detail-grid">
          <div className="detail-image-section">
            <div className="detail-image-card order-hero-card">
              <span className="detail-discount">{order.status}</span>

              <div className="order-hero-content">
                <div className="order-kicker">Order Details</div>
                <h1>{order.id}</h1>
                <p>
                  Placed on {new Date(order.createdAt).toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                  })}
                </p>
                <div className="order-summary-stat">
                  <span>{itemCount} items</span>
                  <strong>₹{total}</strong>
                </div>
              </div>
            </div>
          </div>

          <div className="detail-info">
            <div className="detail-category">Order Summary</div>
            <div className="detail-badge">PREPARING</div>

            <h2 className="detail-title">Your order is on the way</h2>

            <p className="detail-description">
              Thanks for shopping with kunj & skin. Your skincare essentials are being prepared for delivery.
            </p>

            <div className="order-items-panel">
              {order.items.map((item) => (
                <div key={`${order.id}-${item.id}`} className="order-product-row">
                  <img
                    src={item.img || '/assets/p1.png'}
                    alt={item.title}
                    className="order-product-image"
                  />

                  <div className="order-product-meta">
                    <strong>{item.title}</strong>
                    <span>{item.size || '30ml'}</span>
                    <small>Qty: {item.quantity}</small>
                  </div>

                  <div className="order-price-box">₹{item.price * item.quantity}</div>
                </div>
              ))}
            </div>

            <div className="order-summary-box">
              <div className="order-summary-row">
                <span>Subtotal</span>
                <strong>₹{subtotal}</strong>
              </div>
              <div className="order-summary-row">
                <span>Shipping</span>
                <strong>{shipping === 0 ? 'Free' : `₹${shipping}`}</strong>
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
      </div>
    </main>
  )
}
