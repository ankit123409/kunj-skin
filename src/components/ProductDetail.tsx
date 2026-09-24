import React from 'react'
import './ProductDetail.css'
import { products } from '../data/products'
import type { Product } from '../store/cartSlice'
import { useAppDispatch, useAppSelector } from '../hooks'
import { addToCart } from '../store/cartSlice'
import { openCart } from '../store/uiSlice'
import { navigate } from '../router'

export default function ProductDetail({ id }: { id: string }) {
  const product: Product | undefined = products.find(
    (p) => p.id === id
  )

  const dispatch = useAppDispatch()

  const inCart = useAppSelector((state) =>
    state.cart.items.some((item) => item.id === product?.id)
  )

  if (!product) {
    return (
      <div className="product-not-found">
        <h2>Product not found</h2>

        <button onClick={() => navigate('/')}>
          Back to Products
        </button>
      </div>
    )
  }

  const mrp = Math.round(product.price * 1.25)

  const discount = Math.round(
    ((mrp - product.price) / mrp) * 100
  )

  return (
    <main className="product-detail-page">

      {/* =====================================================
          BACK
      ===================================================== */}

      <div className="detail-container">

        <button
          className="back-button"
          onClick={() => navigate('/')}
        >
          <span>←</span>
          Back to Products
        </button>


        {/* =====================================================
            PRODUCT
        ===================================================== */}

        <div className="detail-grid">

          {/* =================================================
              IMAGE SECTION
          ================================================= */}

          <div className="detail-image-section">

            <div className="detail-image-card">

              <span className="detail-discount">
                {discount}% OFF
              </span>

              <button
                className="detail-wishlist"
                aria-label="Add to wishlist"
              >
                ♡
              </button>

              <div className="detail-image-wrapper">

                <img
                  src={product.img || '/assets/p1.png'}
                  alt={product.title}
                  className="detail-product-image"
                />

              </div>

              <div className="image-brand">
                Kunj Skin
              </div>

            </div>


            {/* Trust badges */}

            <div className="trust-row">

              <div className="trust-item">
                <span className="trust-icon">🌿</span>
                <div>
                  <strong>Clean Formula</strong>
                  <small>Skin friendly</small>
                </div>
              </div>

              <div className="trust-item">
                <span className="trust-icon">✓</span>
                <div>
                  <strong>Derm Tested</strong>
                  <small>Quality checked</small>
                </div>
              </div>

              <div className="trust-item">
                <span className="trust-icon">♡</span>
                <div>
                  <strong>Cruelty Free</strong>
                  <small>Made with care</small>
                </div>
              </div>

            </div>

          </div>


          {/* =================================================
              PRODUCT INFORMATION
          ================================================= */}

          <div className="detail-info">

            {/* Brand */}

            <div className="detail-category">
              KUNJ SKIN • SKINCARE
            </div>


            {/* Bestseller */}

            <div className="detail-badge">
              BESTSELLER
            </div>


            {/* Title */}

            <h1 className="detail-title">
              {product.title}
            </h1>


            {/* Description */}

            <p className="detail-description">
              Advanced skincare formula designed to help
              maintain healthy, smooth and naturally radiant skin.
            </p>


            {/* Rating */}

            <div className="detail-rating-row">

              <div className="detail-rating">
                <span>★</span>
                <strong>4.8</strong>
              </div>

              <span className="detail-rating-text">
                862+ verified customers
              </span>

            </div>


            <div className="detail-divider" />


            {/* Skin type */}

            <div className="skin-type">

              <span className="skin-label">
                Suitable for
              </span>

              <strong>
                All Skin Types
              </strong>

            </div>


            {/* Size */}

            <div className="size-section">

              <div className="section-label">
                Choose Size
              </div>

              <div className="size-options">

                <button className="size-option active">
                  {product.size || '30ml'}
                </button>

              </div>

            </div>


            {/* Price */}

            <div className="detail-price-section">

              <div className="detail-price">
                ₹{product.price}
              </div>

              <div className="detail-mrp">
                ₹{mrp}
              </div>

              <div className="detail-save">
                SAVE {discount}%
              </div>

            </div>


            {/* =================================================
                OFFERS
            ================================================= */}

            <div className="offers-box">

              <div className="offers-heading">

                <span className="offer-icon">
                  %
                </span>

                <div>
                  <strong>Available Offers</strong>

                  <span>
                    Extra savings on your order
                  </span>
                </div>

              </div>


              <div className="offer-list">

                <div className="offer-card">

                  <div className="offer-top">
                    <strong>FLAT 15% OFF</strong>

                    <span className="offer-code">
                      FLAT15
                    </span>
                  </div>

                  <p>
                    Get 15% off on your order.
                  </p>

                </div>


                <div className="offer-card">

                  <div className="offer-top">
                    <strong>FREE GIFT</strong>

                    <span className="gift-icon">
                      🎁
                    </span>
                  </div>

                  <p>
                    Shop for ₹799 and get a free gift.
                  </p>

                </div>

              </div>


              {/* Pincode */}

              <div className="pincode-box">

                <div className="pincode-input-wrapper">

                  <span>📍</span>

                  <input
                    type="text"
                    placeholder="Enter pincode"
                    maxLength={6}
                  />

                </div>

                <button>
                  CHECK
                </button>

              </div>

            </div>


            {/* =================================================
                BENEFITS
            ================================================= */}

            <div className="benefits-section">

              <h3>
                Why you'll love it
              </h3>

              <div className="benefits-grid">

                <div className="benefit-item">
                  <span>✦</span>
                  <div>
                    <strong>Healthy Glow</strong>
                    <small>Supports radiant looking skin</small>
                  </div>
                </div>

                <div className="benefit-item">
                  <span>💧</span>
                  <div>
                    <strong>Hydration</strong>
                    <small>Helps maintain skin moisture</small>
                  </div>
                </div>

                <div className="benefit-item">
                  <span>🌿</span>
                  <div>
                    <strong>Skin Friendly</strong>
                    <small>Gentle everyday formula</small>
                  </div>
                </div>

                <div className="benefit-item">
                  <span>♡</span>
                  <div>
                    <strong>Daily Care</strong>
                    <small>Suitable for regular use</small>
                  </div>
                </div>

              </div>

            </div>


            {/* =================================================
                ADD TO CART
            ================================================= */}

            <div className="detail-action">

              <button
                className={`add-detail-button ${
                  inCart ? 'added' : ''
                }`}
                onClick={() => {
                  if (!inCart) {
                    dispatch(addToCart(product))
                  }

                  dispatch(openCart())
                }}
              >
                {inCart
                  ? '✓ ADDED TO CART'
                  : 'ADD TO CART'}
              </button>

            </div>

          </div>

        </div>


        {/* =====================================================
            BOTTOM HIGHLIGHTS
        ===================================================== */}

        <div className="bottom-highlights">

          <div>
            <span>🚚</span>
            <div>
              <strong>Fast Delivery</strong>
              <small>Delivered to your doorstep</small>
            </div>
          </div>

          <div>
            <span>🔒</span>
            <div>
              <strong>Secure Payment</strong>
              <small>100% secure checkout</small>
            </div>
          </div>

          <div>
            <span>✓</span>
            <div>
              <strong>Quality Assured</strong>
              <small>Authentic Kunj Skin products</small>
            </div>
          </div>

          <div>
            <span>♡</span>
            <div>
              <strong>Skin First</strong>
              <small>Made for everyday care</small>
            </div>
          </div>

        </div>

      </div>

    </main>
  )
}