import './ProductCard.css'
import { useEffect, useMemo, useState } from 'react'
import type { Product } from '../store/cartSlice'
import { useAppDispatch, useAppSelector } from '../hooks'
import { addToCart, decrement } from '../store/cartSlice'
import { toggleFavorite } from '../store/favoritesSlice'
import { openCart } from '../store/uiSlice'
import { navigate } from '../router'

export default function ProductCard({ product }: { product: Product }) {
  const dispatch = useAppDispatch()
  const [activeImageIndex, setActiveImageIndex] = useState(0)

  const galleryImages = useMemo(() => {
    const images = product.images?.length
      ? product.images.filter(Boolean)
      : [product.image || product.img || '/fallback.png']

    return images.length ? images : ['/fallback.png']
  }, [product.images, product.image, product.img])

  useEffect(() => {
    if (galleryImages.length <= 1) return

    const timer = window.setInterval(() => {
      setActiveImageIndex((prev) => (prev + 1) % galleryImages.length)
    }, 2500)

    return () => window.clearInterval(timer)
  }, [galleryImages.length])

  const quantity = useAppSelector(
    (state) => state.cart.items.find((item) => item._id === product._id)?.quantity ?? 0
  )

  const inCart = quantity > 0
  const isFavorite = useAppSelector((state) => state.favorites.items.includes(product._id || product.id || ''))

  const mrp = Math.round(product.price * 1.25)
  const discount = Math.round(((mrp - product.price) / mrp) * 100)

  return (
    <article className="product-card">

      {/* PRODUCT IMAGE */}
      <div
        className="product-media"
        onClick={() => navigate(`/product/${product._id}`)}
      >
        {/* Discount */}
        {/* <span className="discount-badge">
          {discount}% OFF
        </span> */}

        {/* Wishlist */}
        <button
          className={`wishlist ${isFavorite ? 'is-favorite' : ''}`}
          aria-label={isFavorite ? 'Remove from wishlist' : 'Add to wishlist'}
          onClick={(e) => {
            e.stopPropagation()
            dispatch(toggleFavorite(product._id || product.id || ''))
          }}
        >
          {isFavorite ? '♥' : '♡'}
        </button>

        {/* Product image */}
        <div className="product-image-wrap">
          <div className="product-gallery" aria-label={`${product.title} product images`}>
            <img
              src={galleryImages[activeImageIndex] || '/fallback.png'}
              alt={product.title}
              className="product-image"
            />

            {galleryImages.length > 1 && (
              <div className="product-slider-dots" aria-label="Product image navigation">
                {galleryImages.map((_, index) => (
                  <button
                    key={`${product._id}-dot-${index}`}
                    type="button"
                    className={`product-slider-dot ${index === activeImageIndex ? 'active' : ''}`}
                    aria-label={`View image ${index + 1}`}
                    onClick={(e) => {
                      e.stopPropagation()
                      setActiveImageIndex(index)
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* PRODUCT INFORMATION */}
      <div className="product-content">

        {/* Category */}
        <div className="product-category">
          SKINCARE
        </div>

        {/* Title */}
        <h3
          className="product-title"
          onClick={() => navigate(`/product/${product._id}`)}
        >
          {product.title}
        </h3>

        {/* Rating */}
        <div className="product-rating-row">

          <div className="rating-box">
            <span>★</span>
            <strong>4.8</strong>
          </div>

          <span className="review-count">
            (862 Reviews)
          </span>

        </div>

        {/* Short benefit */}
        <p className="product-benefit">
          {
            product?.description
          }
          {/* Advanced skincare formula for healthy, radiant skin */}
        </p>

        {/* Size */}
        <div className="product-size">
          <span>Size</span>
          <strong>{product.size}</strong>
        </div>

        {/* PRICE */}
        <div className="price-section">

          <div className="price-left">

            <span className="selling-price">
              ₹{product.price}
            </span>

            <span className="mrp">
              ₹{mrp}
            </span>

            <span className="saving">
              Save {discount}%
            </span>

          </div>

        </div>

        {/* ACTION */}
        <div className="product-actions">

          {!inCart ? (
            <button
              className="add-button"
              onClick={() => {
                dispatch(addToCart(product))
                dispatch(openCart())
              }}
            >
              ADD TO CART
            </button>
          ) : (
            <div className="quantity-control" aria-label="Quantity selector">
              <button
                className="qty-button"
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  dispatch(decrement(product._id || product.id || ''))
                }}
                aria-label={`Decrease quantity for ${product.title}`}
              >
                −
              </button>

              <span className="qty-value">{quantity}</span>

              <button
                className="qty-button"
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  dispatch(addToCart(product))
                }}
                aria-label={`Increase quantity for ${product.title}`}
              >
                +
              </button>
            </div>
          )}

        </div>

      </div>
    </article>
  )
}