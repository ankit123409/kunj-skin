import React from 'react'
import './ProductCard.css'
import type { Product } from '../store/cartSlice'
import { useAppDispatch, useAppSelector } from '../hooks'
import { addToCart, removeFromCart } from '../store/cartSlice'
import { openCart } from '../store/uiSlice'
import { navigate } from '../router'

import myImage from '../assets/p1.png'

export default function ProductCard({ product }: { product: Product }) {
  const dispatch = useAppDispatch()

  const inCart = useAppSelector((state) =>
    state.cart.items.some((item) => item.id === product.id)
  )

  const mrp = Math.round(product.price * 1.25)
  const discount = Math.round(((mrp - product.price) / mrp) * 100)

  return (
    <article className="product-card">

      {/* PRODUCT IMAGE */}
      <div
        className="product-media"
        onClick={() => navigate(`/product/${product.id}`)}
      >
        {/* Discount */}
        {/* <span className="discount-badge">
          {discount}% OFF
        </span> */}

        {/* Wishlist */}
        <button
          className="wishlist"
          aria-label="Add to wishlist"
          onClick={(e) => e.stopPropagation()}
        >
          ♡
        </button>

        {/* Product image */}
        <div className="product-image-wrap">
          <img
            src={myImage}
            alt={product.title}
            className="product-image"
          />
        </div>

        {/* Bottom image label */}
        <div className="image-tag">
          Kunj Skin
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
          onClick={() => navigate(`/product/${product.id}`)}
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
          Advanced skincare formula for healthy, radiant skin
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

          <button
            className={`add-button ${inCart ? 'added' : ''}`}
            onClick={() => {
              if (!inCart) {
                dispatch(addToCart(product))
                dispatch(openCart())
              }
            }}
          >
            {inCart ? '✓ ADDED TO CART' : 'ADD TO CART'}
          </button>

          {inCart && (
            <button
              className="remove-button"
              onClick={() => dispatch(removeFromCart(product.id))}
            >
              REMOVE
            </button>
          )}

        </div>

      </div>
    </article>
  )
}