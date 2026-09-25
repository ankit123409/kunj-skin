import './FavoritesPage.css'
import fallbackImage from '../assets/p1.png'
import { products } from '../data/products'
import { useAppDispatch, useAppSelector } from '../hooks'
import { addToCart } from '../store/cartSlice'
import { openCart } from '../store/uiSlice'
import { navigate } from '../router'

export default function FavoritesPage() {
  const dispatch = useAppDispatch()
  const favoriteIds = useAppSelector((state) => state.favorites.items)
  const likedProducts = products.filter((product) => favoriteIds.includes(product.id))

  if (likedProducts.length === 0) {
    return (
      <div className="favorites-page empty-state">
        <div className="favorites-empty-card">
          <div className="favorites-empty-icon">♡</div>
          <h2>No liked products yet</h2>
          <p>Save your favorite skincare essentials and they’ll appear here.</p>
          <button className="favorites-empty-button" onClick={() => navigate('/')}>
            Explore Products
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="favorites-page">
      <div className="favorites-header">
        <div>
          <span className="favorites-kicker">Your picks</span>
          <h1>Liked Products</h1>
        </div>
        <button className="favorites-back" onClick={() => navigate('/')}>
          Continue Shopping
        </button>
      </div>

      <div className="favorites-grid">
        {likedProducts.map((product) => (
          <article key={product.id} className="favorites-card">
            <div className="favorites-media" onClick={() => navigate(`/product/${product.id}`)}>
              <img src={product.img || fallbackImage} alt={product.title} />
              <span className="favorites-tag">kunj & skin</span>
            </div>

            <div className="favorites-content">
              <div className="favorites-category">SKINCARE</div>
              <h3 onClick={() => navigate(`/product/${product.id}`)}>{product.title}</h3>

              <div className="favorites-meta">
                <span>★ 4.8</span>
                <span>•</span>
                <span>{product.size}</span>
              </div>

              <div className="favorites-price-row">
                <strong>₹{product.price}</strong>
                <span>₹{Math.round(product.price * 1.25)}</span>
              </div>

              <div className="favorites-actions">
                <button
                  className="favorites-primary"
                  onClick={() => {
                    dispatch(addToCart(product))
                    dispatch(openCart())
                  }}
                >
                  Add to Cart
                </button>
                <button
                  className="favorites-secondary"
                  onClick={() => navigate(`/product/${product.id}`)}
                >
                  Details
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}
