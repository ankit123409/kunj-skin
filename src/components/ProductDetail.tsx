import './ProductDetail.css'
import { useEffect, useMemo, useState } from 'react'
import sectionOneDataList from '../data/sectionone.json'
import userGuideList from '../data/userguilde.json'
import fallbackImage from '../assets/p1.png'
import facewash1 from '../assets/sectionOne/userguilde/facewash1.png'
import facewash2 from '../assets/sectionOne/userguilde/facewash2.png'
import facewash3 from '../assets/sectionOne/userguilde/facewash3.png'
import facewash4 from '../assets/sectionOne/userguilde/facewash4.png'
import faceserum1 from '../assets/sectionOne/userguilde/faceserum1.png'
import faceserum2 from '../assets/sectionOne/userguilde/faceserum2.png'
import faceserum3 from '../assets/sectionOne/userguilde/faceserum3.png'
import faceserum4 from '../assets/sectionOne/userguilde/faceserum4.png'
import salikunjBanner from '../assets/sectionOne/userguilde/salikunj.png'
import glowkunjBanner from '../assets/sectionOne/userguilde/glowkunj.png'
import vitakunjBanner from '../assets/sectionOne/userguilde/vitakunj.png'
import type { Product } from '../store/cartSlice'
import { useAppDispatch, useAppSelector } from '../hooks'
import { addToCart, decrement } from '../store/cartSlice'
import { toggleFavorite } from '../store/favoritesSlice'
import { openCart } from '../store/uiSlice'
import { navigate } from '../router'
import { getProductFaqsApi, getProductReviewsApi, type ProductFaq, type ProductReview } from '../api/api'

const staticReviews = [
  {
    id: 'review-1',
    name: 'Verified customer',
    rating: 5,
    title: 'Gentle and effective',
    review: 'This facewash leaves my skin feeling fresh and clean without over-drying. It works well for my daily routine.',
  },
  {
    id: 'review-2',
    name: 'Verified customer',
    rating: 5,
    title: 'Perfect for oily skin',
    review: 'A great fit for oily and combination skin. It removes buildup and leaves a clean, comfortable finish.',
  },
  {
    id: 'review-3',
    name: 'Verified customer',
    rating: 4,
    title: 'Simple and soothing',
    review: 'The texture is gentle and non-stripping. It feels easy to use every morning and night.',
  },
]

const fallbackFaqs = [
  {
    question: 'Is this suitable for acne-prone skin?',
    answer: 'Yes. The formula is designed for acne-prone and oily skin with salicylic acid, niacinamide, and a calm, non-comedogenic base.',
  },
  {
    question: 'How often should I use this facewash?',
    answer: 'Use it twice daily, morning and night, with a pea-sized amount and lukewarm water for best results.',
  },
  {
    question: 'Can I use it with other skincare products?',
    answer: 'Yes, it pairs well with a simple skincare routine. Follow with a moisturizer and sunscreen during the day.',
  },
  {
    question: 'Does it help with blackheads and oil control?',
    answer: 'It helps remove excess oil and keep the skin feeling fresh and balanced, which can support a clearer-looking complexion.',
  },
]

export const productComparisons = {
  salikunj: {
    productId: '6abc060bdf5ce49e998b7b21',
    title: 'Salikunj vs Basic Cleanser',
    columns: ['Salikunj Facewash', 'Basic Cleanser'],
    features: [
      { name: 'Formulated for acne-prone skin', values: [true, false] },
      { name: 'With Salicylic Acid & Niacinamide', values: [true, false] },
      { name: 'Helps control excess oil', values: [true, false] },
      { name: 'Gentle daily use', values: [true, true] },
      { name: 'Non-comedogenic', values: [true, false] },
    ],
  },
  glowkunj: {
    productId: '6abc072ddf5ce49e998b7b25',
    title: 'GlowKunj vs Basic Serum',
    columns: ['GlowKunj Face Serum', 'Basic Serum'],
    features: [
      { name: 'Contains Glutathione', values: [true, false] },
      { name: 'Contains Hyaluronic Acid 2%', values: [true, false] },
      { name: 'Retinol for improving the appearance of fine lines', values: [true, false] },
      { name: 'Vitamin C 10% + Niacinamide 10%', values: [true, false] },
      { name: 'Supports skin hydration', values: [true, true] },
    ],
  },
  vitakunj: {
    productId: '6abc07ebdf5ce49e998b7b2a',
    title: 'Vitakunj vs Basic Serum',
    columns: ['Vitakunj Face Serum', 'Basic Serum'],
    features: [
      { name: 'Helps improve uneven skin tone', values: [true, false] },
      { name: 'Vitamin C 20% + Alpha Arbutin 2%', values: [true, false] },
      { name: 'Contains Hyaluronic Acid 1%', values: [true, false] },
      { name: 'Supports skin hydration', values: [true, true] },
      { name: 'Supports brighter-looking skin', values: [true, false] },
    ],
  },
} as const

const sectionOneData = sectionOneDataList[0]

function ProductBadge({ children }: { children: React.ReactNode }) {
  return <span className="product-badge">{children}</span>
}

function Breadcrumb() {
  return (
    <nav className="breadcrumb" aria-label="Breadcrumb">
      <button type="button" onClick={() => navigate('/')}>Home</button>
      <span>›</span>
      <button type="button">Skincare</button>
      <span>›</span>
      <button type="button">Facewash</button>
      <span>›</span>
      <span className="current">Salikunj Facewash</span>
    </nav>
  )
}

function ProductGallery({ product, galleryImages, activeImageIndex, setActiveImageIndex }: {
  product: Product
  galleryImages: string[]
  activeImageIndex: number
  setActiveImageIndex: (index: number) => void
}) {
  const isFavorite = useAppSelector((state) => state.favorites.items.includes(product._id || product.id || ''))
  const dispatch = useAppDispatch()

  return (
    <div className="detail-image-section">
      <div className="detail-gallery-shell">
        {galleryImages.length > 1 && (
          <div className="detail-thumbnail-column" aria-label="Product image thumbnails">
            {galleryImages.map((image, index) => (
              <button
                key={`${product._id || product.id}-thumb-${index}`}
                type="button"
                className={`detail-thumbnail ${index === activeImageIndex ? 'active' : ''}`}
                onClick={() => setActiveImageIndex(index)}
                aria-label={`View image ${index + 1}`}
              >
                <img src={image} alt={`${product.title} thumbnail ${index + 1}`} loading="lazy" />
              </button>
            ))}
          </div>
        )}

        <div className="detail-image-card">
          <button
            type="button"
            className={`detail-wishlist ${isFavorite ? 'active' : ''}`}
            aria-label={isFavorite ? 'Remove from wishlist' : 'Add to wishlist'}
            onClick={() => dispatch(toggleFavorite(product._id || product.id || ''))}
          >
            {isFavorite ? '♥' : '♡'}
          </button>

          <div className="detail-image-wrapper">
            <div className="detail-image-gallery" aria-label={`${product.title} product images`}>
              <img
                src={galleryImages[activeImageIndex] || fallbackImage}
                alt={product.title}
                className="detail-product-image"
                loading="eager"
              />

              {galleryImages.length > 1 && (
                <div className="detail-slider-dots" aria-label="Product image navigation">
                  {galleryImages.map((_, index) => (
                    <button
                      key={`${product._id}-detail-dot-${index}`}
                      type="button"
                      className={`detail-slider-dot ${index === activeImageIndex ? 'active' : ''}`}
                      aria-label={`View image ${index + 1}`}
                      onClick={() => setActiveImageIndex(index)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="image-brand">kunj skin</div>
        </div>
      </div>

      <div className="trust-row">
        <div className="trust-item">
          <span className="trust-icon">🚚</span>
          <div>
            <strong>Free Delivery</strong>
            <small>On orders above ₹499</small>
          </div>
        </div>
        <div className="trust-item">
          <span className="trust-icon">🔒</span>
          <div>
            <strong>Secure Payment</strong>
            <small>100% safe checkout</small>
          </div>
        </div>
        <div className="trust-item">
          <span className="trust-icon">✓</span>
          <div>
            <strong>Authentic</strong>
            <small>Dermatologist tested </small>
          </div>
        </div>
      </div>
    </div>
  )
}

function FAQSection({ items }: { items: Array<{ question: string; answer: string }> }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  return (
    <section className="detail-section faq-section">
      <div className="section-heading-row">
        <h2>Frequently Asked Questions</h2>
      </div>

      <div className="faq-list">
        {items.map((faq, index) => {
          const isOpen = openIndex === index
          return (
            <div key={`${faq.question}-${index}`} className={`faq-item ${isOpen ? 'open' : ''}`}>
              <button type="button" className="faq-question" onClick={() => setOpenIndex(isOpen ? null : index)} aria-expanded={isOpen}>
                <span>{faq.question}</span>
                <span className="faq-toggle">{isOpen ? '−' : '+'}</span>
              </button>
              {isOpen && <p className="faq-answer">{faq.answer}</p>}
            </div>
          )
        })}
      </div>
    </section>
  )
}

export default function ProductDetail({ id }: { id: string }) {
  const dispatch = useAppDispatch()
  const product: Product | undefined = useAppSelector((s) => s.products.items.find((p) => p._id === id))
  const [activeImageIndex, setActiveImageIndex] = useState(0)
  const [selectedSize, setSelectedSize] = useState('70 ml')
  const [selectedOfferIndex, setSelectedOfferIndex] = useState(-1)
  const [reviews, setReviews] = useState<ProductReview[]>(staticReviews as ProductReview[])
  const [faqs, setFaqs] = useState<Array<{ question: string; answer: string }>>(fallbackFaqs)

  const sizeOptions = useMemo(() => {
    const normalized = product?.size?.trim()
    return normalized ? [normalized] : ['70 ml', '120 ml']
  }, [product?.size])

  const galleryImages = useMemo(() => {
    const normalizeImageList = (value: unknown): string[] => {
      if (Array.isArray(value)) {
        return value
          .flatMap((item) => {
            if (typeof item === 'string') return [item]
            if (item && typeof item === 'object' && 'url' in item && typeof (item as { url?: unknown }).url === 'string') {
              return [(item as { url: string }).url]
            }
            return []
          })
          .map((item) => String(item).trim())
          .filter(Boolean)
      }

      if (typeof value === 'string') {
        return value
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean)
      }

      return []
    }

    const normalizedImages = [
      ...normalizeImageList(product?.images),
      ...normalizeImageList(product?.image),
      ...normalizeImageList(product?.img),
    ].filter((url, index, array) => url && array.indexOf(url) === index)

    if (normalizedImages.length) {
      return normalizedImages
    }

    return [fallbackImage]
  }, [product?.image, product?.img, product?.images])

  useEffect(() => {
    setSelectedSize(product?.size || sizeOptions[0] || '70 ml')
  }, [product?.size, sizeOptions])

  useEffect(() => {
    if (activeImageIndex >= galleryImages.length) {
      setActiveImageIndex(0)
    }
  }, [activeImageIndex, galleryImages.length])

  useEffect(() => {
    if (!product || !product._id) {
      setReviews(staticReviews as ProductReview[])
      setFaqs(fallbackFaqs)
      return
    }

    let mounted = true

    const loadReviews = async () => {
      try {
        const list = await getProductReviewsApi(product._id || product.id || '')
        if (mounted && list.length) {
          setReviews(list)
        } else if (mounted) {
          setReviews(staticReviews as ProductReview[])
        }
      } catch {
        if (mounted) setReviews(staticReviews as ProductReview[])
      }
    }

    const loadFaqs = async () => {
      try {
        const list = await getProductFaqsApi(product._id || product.id || '')
        if (mounted && list.length) {
          const normalized = list
            .map((item: ProductFaq) => ({
              question: String(item.question || item.faq || 'Question'),
              answer: String(item.answer || item.response || 'Answer not available yet.'),
            }))
            .filter((item) => item.question && item.answer)

          setFaqs(normalized)
        } else if (mounted) {
          setFaqs(fallbackFaqs)
        }
      } catch {
        if (mounted) setFaqs(fallbackFaqs)
      }
    }

    void loadReviews()
    void loadFaqs()

    return () => {
      mounted = false
    }
  }, [product])

  const quantity = useAppSelector(
    (state) => state.cart.items.find((item) => item._id === product?._id)?.quantity ?? 0
  )

  const inCart = quantity > 0

  if (!product) {
    return (
      <div className="product-not-found">
        <h2>Product not found</h2>
        <button type="button" onClick={() => navigate('/')}>Back to Products</button>
      </div>
    )
  }

  const actualMrp = Number(product.actualMrp ?? product.sellingPrice ?? product.price ?? 0)
  const sellingPrice = Number(product.sellingPrice ?? product.price ?? actualMrp ?? 0)
  const discount = Number(
    product.discount ??
      (actualMrp > 0 && sellingPrice > 0 && sellingPrice < actualMrp
        ? Math.round(((actualMrp - sellingPrice) / actualMrp) * 100)
        : 20)
  )

  const reviewAverage = reviews.length
    ? reviews.reduce((sum, item) => sum + Number(item.rating || 0), 0) / reviews.length
    : 4.8

  const detailOffers = (product.offers ?? [])
    .filter((offer) => offer && (offer.isActive ?? true))
    .slice(0, 3)
    .map((offer, index) => {
      const quantity = Number(offer.minQuantity ?? index + 2)
      const discountValue = Number(offer.discountValue ?? 0)

      return {
        ...offer,
        quantity,
        title: offer.title || `Buy ${quantity} and get ${discountValue}${offer.discountType === 'fixed' ? '₹' : '%'} off`,
      }
    })

  useEffect(() => {
    if (selectedOfferIndex >= detailOffers.length) {
      setSelectedOfferIndex(-1)
    }
  }, [detailOffers.length, selectedOfferIndex])

  const selectedOffer = selectedOfferIndex >= 0 ? detailOffers[selectedOfferIndex] ?? null : null
  const selectedOfferPrice = (() => {
    if (!selectedOffer) return sellingPrice

    const basePrice = Number(product.sellingPrice ?? product.price ?? sellingPrice ?? 0)
    const discountValue = Number(selectedOffer.discountValue ?? 0)

    if (selectedOffer.discountType === 'fixed') {
      return Math.max(0, basePrice - discountValue)
    }

    return Math.max(0, basePrice * (1 - discountValue / 100))
  })()

  const comparison = (() => {
    const productId = String(product._id || product.id || '').trim()
    const productTitle = String(product.title || '').trim().toLowerCase()

    if (productId) {
      const matched = Object.values(productComparisons).find((item) => item.productId === productId)
      if (matched) return matched
    }

    if (productTitle.includes('salikunj')) return productComparisons.salikunj
    if (productTitle.includes('glowkunj')) return productComparisons.glowkunj
    if (productTitle.includes('vitakunj')) return productComparisons.vitakunj

    return null
  })()

  const activeSectionOneData =
    sectionOneDataList.find((item) => item.productId === String(product._id || product.id || '').trim()) ?? sectionOneData

  const activeUserGuide =
    userGuideList.find((item) => item.productId === String(product._id || product.id || '').trim()) ??
    userGuideList[0]

  const guideImageMap: Record<string, string> = {
    'facewash1.png': facewash1,
    'facewash2.png': facewash2,
    'facewash3.png': facewash3,
    'facewash4.png': facewash4,
    'faceserum1.png': faceserum1,
    'faceserum2.png': faceserum2,
    'faceserum3.png': faceserum3,
    'faceserum4.png': faceserum4,
  }

  const usageSteps = (activeUserGuide?.steps || []).map((step, index) => {
    const imagePath = String(step.image || '').replace('₹', '').trim()
    const fileName = imagePath.split('/').pop() || imagePath

    return {
      title: `Step ${index + 1}`,
      description: step.desc,
      image: guideImageMap[fileName] || imagePath || fallbackImage,
      sequence: index + 1,
    }
  })

  const bannerImageMap: Record<string, string> = {
    'salikunj.png': salikunjBanner,
    'glowkunj.png': glowkunjBanner,
    'vitakunj.png': vitakunjBanner,
  }

  const productBannerImage = (() => {
    const bannerPath = String(activeSectionOneData?.banner?.image || '').replace('₹', '').trim()
    const fileName = bannerPath.split('/').pop() || bannerPath
    return bannerImageMap[fileName] || bannerPath || fallbackImage
  })()

  const handleAddToCart = () => {
    const item = {
      ...product,
      size: selectedSize,
      price: selectedOfferPrice,
      actualMrp,
      sellingPrice: selectedOfferPrice,
      discount: selectedOffer
        ? (selectedOffer.discountType === 'fixed'
            ? Math.round(((actualMrp - selectedOfferPrice) / actualMrp) * 100)
            : Number(selectedOffer.discountValue ?? 0))
        : discount,
      offers: selectedOffer ? [{ ...selectedOffer, quantity: Number(selectedOffer.quantity || selectedOffer.minQuantity || 1) }] : product.offers ?? [],
    }
    dispatch(addToCart(item))
    dispatch(openCart())
  }

  return (
    <main className="product-detail-page">
      <div className="detail-container">
        <Breadcrumb />

        <div className="detail-grid">
          {galleryImages.length > 1 ? (
            <div className="detail-gallery-column">
              <ProductGallery
                product={product}
                galleryImages={galleryImages}
                activeImageIndex={activeImageIndex}
                setActiveImageIndex={setActiveImageIndex}
              />
            </div>
          ) : (
            <div className="detail-image-card single-image-card">
              <button
                type="button"
                className={`detail-wishlist ${useAppSelector((state) => state.favorites.items.includes(product._id || product.id || '')) ? 'active' : ''}`}
                aria-label={useAppSelector((state) => state.favorites.items.includes(product._id || product.id || '')) ? 'Remove from wishlist' : 'Add to wishlist'}
                onClick={() => dispatch(toggleFavorite(product._id || product.id || ''))}
              >
                {useAppSelector((state) => state.favorites.items.includes(product._id || product.id || '')) ? '♥' : '♡'}
              </button>

              <div className="detail-image-wrapper">
                <div className="detail-image-gallery" aria-label={`${product.title} product image`}>
                  <img
                    src={galleryImages[0] || fallbackImage}
                    alt={product.title}
                    className="detail-product-image"
                    loading="eager"
                  />
                </div>
              </div>

              <div className="image-brand">kunj skin</div>
            </div>
          )}

          <div className="detail-info">
            <div className="detail-category">SKINCARE</div>
            <ProductBadge>BESTSELLER</ProductBadge>

            <h1 className="detail-title">{product.title}</h1>
            <p className="detail-description">
              {product.description || 'A gentle yet effective facial cleanser designed to reduce excess oil, support clarity, and leave the skin feeling fresh and balanced.'}
            </p>

            <div className="detail-rating-row">
              <div className="detail-rating" aria-label="Average rating">
                <span>★</span>
                <strong>{reviewAverage.toFixed(1)}</strong>
              </div>
              <span className="detail-rating-text">{reviews.length} verified customer reviews</span>
            </div>

            <div className="detail-divider" />

            <div className="skin-type">
              <span className="skin-label">Suitable for</span>
              <strong>All Skin Types</strong>
            </div>

            <div className="size-section">
              <div className="section-label">Size</div>
              <div className="size-options">
                {sizeOptions.map((size) => (
                  <button
                    key={size}
                    type="button"
                    className={`size-option ${selectedSize === size ? 'active' : ''}`}
                    onClick={() => setSelectedSize(size)}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            <div className="detail-price-section">
              <div className="detail-price">₹{sellingPrice}</div>
              <div className="detail-mrp">₹{actualMrp || Math.round(sellingPrice * 1.25)}</div>
              <div className="detail-save">SAVE {discount}%</div>
            </div>

            <div className="benefits-feed">
              <div className="benefit-item">
                <span>✦</span>
                <div>
                  <strong>Healthy Glow</strong>
                  <small>Supports radiant-looking skin</small>
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
            </div>

            <div className="detail-action">
              {!inCart ? (
                <button type="button" className="add-detail-button" onClick={handleAddToCart}>ADD TO CART</button>
              ) : (
                <div className="detail-quantity-control" aria-label="Quantity selector">
                  <button
                    type="button"
                    className="detail-qty-button"
                    onClick={() => dispatch(decrement(product._id || product.id || ''))}
                    aria-label={`Decrease quantity for ${product.title}`}
                  >
                    −
                  </button>
                  <span className="detail-qty-value">{quantity}</span>
                  <button
                    type="button"
                    className="detail-qty-button"
                    onClick={() => dispatch(addToCart({
                      ...product,
                      size: selectedSize,
                      price: selectedOfferPrice,
                      actualMrp,
                      sellingPrice: selectedOfferPrice,
                      discount: selectedOffer
                        ? (selectedOffer.discountType === 'fixed'
                            ? Math.round(((actualMrp - selectedOfferPrice) / actualMrp) * 100)
                            : Number(selectedOffer.discountValue ?? 0))
                        : discount,
                      offers: selectedOffer ? [{ ...selectedOffer, quantity: Number(selectedOffer.quantity || selectedOffer.minQuantity || 1) }] : product.offers ?? [],
                    }))}
                    aria-label={`Increase quantity for ${product.title}`}
                  >
                    +
                  </button>
                </div>
              )}
            </div>

            {product.quantityOffersEnabled && detailOffers.length > 0 && (
              <div className="detail-offers" aria-label="Quantity based offers">
                {detailOffers.map((offer, index) => (
                  <button
                    type="button"
                    key={`${offer.title ?? 'offer'}-${offer.quantity ?? index}`}
                    className={`detail-offer-card ${selectedOfferIndex === index ? 'selected' : ''}`}
                    onClick={() => setSelectedOfferIndex(index)}
                    aria-label={`Select ${offer.title || `offer ${index + 1}`}`}
                  >
                    <div className="detail-offer-quantity">{offer.quantity}×</div>
                    <div className="detail-offer-label">QUANTITY</div>
                    <div className="detail-offer-title">{offer.title}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <section className="trust-badges-grid" aria-label="Quality trust badges">
          <div className="trust-feature"><span>✓</span><div><strong>Paraben Free</strong><small>Gentle on your skin</small></div></div>
          <div className="trust-feature"><span>✓</span><div><strong>Non-Comedogenic</strong><small>Won’t clog pores</small></div></div>
          <div className="trust-feature"><span>✓</span><div><strong>Dermatologist recommended</strong><small>Formulated for daily use</small></div></div>
          <div className="trust-feature"><span>✓</span><div><strong>CrueIty Free</strong><small>Kind to skin and values</small></div></div>
        </section>

        {/* <section className="detail-section benefits-section">
          <div className="section-heading-row">
            <h2>Product benefits</h2>
          </div>
          <div className="benefits-grid">
            {ingredients.map((item) => (
              <div key={item.title} className="benefit-card">
                <div className="benefit-icon">{item.icon}</div>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </div>
            ))}
          </div>
        </section> */}

        <section className="detail-section ingredient-section">
          <div className="ingredient-grid full-width-banner-grid">
            {activeSectionOneData?.banner && (
              <div className="ingredient-item banner-image-card">
                <div className="banner-visual">
                  <img
                    src={productBannerImage}
                    alt={activeSectionOneData.banner.alt || 'Product banner'}
                    loading="lazy"
                  />
                </div>
              </div>
            )}
          </div>
        </section>

        <section className="detail-section how-to-use-section">
          <div className="section-heading-row">
            <h2>How to use</h2>
          </div>
          <div className="usage-grid">
            {usageSteps.map((step, index) => (
              <div key={`${step.title}-${index}`} className="usage-card">
                <div className="usage-step-number">{index + 1}</div>
                <div className="usage-image-wrap">
                  <img src={step.image} alt={step.title} loading="lazy" />
                </div>
                <p className="usage-step-description">{step.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="detail-section do-dont-section">
          <div className="section-heading-row">
            <h2>Do&apos;s and Don&apos;ts</h2>
          </div>
          <div className="do-dont-grid">
            <div className="info-block do-block">
              <h3>Do&apos;s</h3>
              <ul>
                <li>Use twice daily for best results</li>
                <li>Follow with a moisturizer</li>
                <li>Patch test before regular use</li>
                <li>Keep skin hydrated</li>
              </ul>
            </div>
            <div className="info-block dont-block">
              <h3>Don&apos;ts</h3>
              <ul>
                <li>Don&apos;t over-wash or scrub aggressively</li>
                <li>Avoid mixing with harsh actives</li>
                <li>Don&apos;t leave it on your skin longer than needed</li>
                <li>Skip sunscreen during the day</li>
              </ul>
            </div>
          </div>
        </section>

        {comparison && (
          <section className="detail-section comparison-section">
            <div className="section-heading-row">
              <h2>{comparison.title}</h2>
            </div>
            <div className="comparison-table-wrap">
              <table className="comparison-table">
                <thead>
                  <tr>
                    <th>Features</th>
                    {comparison.columns.map((column) => (
                      <th key={column}>{column}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {comparison.features.map((feature) => (
                    <tr key={feature.name}>
                      <td>{feature.name}</td>
                      {feature.values.map((value, index) => (
                        <td key={`${feature.name}-${comparison.columns[index]}`}>{value ? '✓' : '✕'}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        <section className="detail-section reviews-section">
          <div className="section-heading-row">
            <h2>Customer reviews</h2>
          </div>

          <div className="reviews-layout">
            <div className="reviews-summary-card">
              <div className="summary-score">{reviewAverage.toFixed(1)}</div>
              <div className="summary-stars" aria-label={`${reviewAverage.toFixed(1)} out of 5 stars`}>★★★★★</div>
              <p>{reviews.length} customer reviews</p>
              <div className="rating-bars" aria-label="Review distribution">
                {[5, 4, 3, 2, 1].map((star) => (
                  <div key={star} className="rating-bar-row">
                    <span>{star}★</span>
                    <div className="bar-track">
                      <span style={{ width: `${star === 5 ? 80 : star === 4 ? 15 : 5}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="review-card-grid">
              {reviews.slice(0, 3).map((review) => {
                const reviewName = review.name || review.user?.name || review.customer?.name || 'Verified customer'
                const reviewTitle = review.title || 'Great product'
                const reviewText = review.review || 'Beautiful product and great quality.'

                return (
                  <article key={review.id || reviewName || reviewTitle} className="review-card-item">
                    <div className="review-card-header">
                      <div className="review-avatar">{reviewName.slice(0, 1).toUpperCase()}</div>
                      <div>
                        <strong>{reviewName}</strong>
                        <div className="stars">{'★'.repeat(Number(review.rating || 5))}</div>
                      </div>
                    </div>
                    <h3>{reviewTitle}</h3>
                    <p>{reviewText}</p>
                  </article>
                )
              })}
            </div>
          </div>
        </section>

        <FAQSection items={faqs} />
      </div>

      <div className="mobile-cart-bar" aria-label="Mobile purchase actions">
        <div className="mobile-cart-price">₹{sellingPrice}</div>
        <button type="button" onClick={handleAddToCart}>Add to cart</button>
      </div>
    </main>
  )
}