import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import './AdminProductsPage.css'
import fallbackImage from '../assets/p1.png'
import { useAppDispatch, useAppSelector } from '../hooks'
import {
  calculateDiscount,
  createProductApi,
  deleteProductApi,
  getAuthToken,
  updateProductApi,
  type ProductPayload,
} from '../api/api'
import { fetchProducts } from '../store/productsSlice'
import { isAdminRole } from '../utils/orderStatus'
import { uploadImageToCloudinary } from '../utils/cloudinary'
import { navigate } from '../router'
import type { Product } from '../store/cartSlice'

type QuantityOffer = {
  id: string
  minQuantity: number
  discountType: 'percentage' | 'fixed'
  discountValue: number
  title: string
  isActive: boolean
}

type ProductFormState = Omit<ProductPayload, 'offers'> & {
  quantityOffersEnabled: boolean
  activeProduct: boolean
  featuredProduct: boolean
  allowCashOnDelivery: boolean
  offers: QuantityOffer[]
}

const makeOfferId = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`

const uniqueImageUrls = (urls: Array<string | undefined | null>) =>
  [...new Set(urls.filter((url): url is string => Boolean(url && typeof url === 'string' && url.trim())))]

const createOffer = (minQuantity = 2, discountType: 'percentage' | 'fixed' = 'percentage', discountValue = 5): QuantityOffer => ({
  id: makeOfferId(),
  minQuantity,
  discountType,
  discountValue,
  title: `Buy ${minQuantity} and get ${discountValue}${discountType === 'percentage' ? '% off' : '₹ off'}`,
  isActive: true,
})

const emptyForm = (): ProductFormState => ({
  image: '',
  images: [],
  video: '',
  title: '',
  size: '',
  actualMrp: 0,
  sellingPrice: 0,
  discount: 0,
  description: '',
  quantityOffersEnabled: false,
  activeProduct: true,
  featuredProduct: false,
  allowCashOnDelivery: true,
  offers: [],
})

function getApiErrorMessage(err: unknown, fallback: string) {
  const axiosErr = err as { message?: string; response?: { data?: { message?: string; error?: string } } }
  return axiosErr?.response?.data?.message || axiosErr?.response?.data?.error || axiosErr?.message || fallback
}

function getProductId(product: Product) {
  return String(product._id || product.id || '')
}

export default function AdminProductsPage() {
  const dispatch = useAppDispatch()
  const role = useAppSelector((s) => s.auth.role)
  const products = useAppSelector((s) => s.products.items)
  const loading = useAppSelector((s) => s.products.loading)
  const isAdmin = isAdminRole(role)

  const [form, setForm] = useState<ProductFormState>(emptyForm())
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [uploadStep, setUploadStep] = useState<'idle' | 'cloudinary' | 'product'>('idle')
  const [deletingId, setDeletingId] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [previewUrls, setPreviewUrls] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    void dispatch(fetchProducts())
  }, [dispatch])

  useEffect(() => {
    return () => {
      previewUrls.forEach((url) => {
        if (url.startsWith('blob:')) URL.revokeObjectURL(url)
      })
    }
  }, [previewUrls])

  const resetImagePicker = () => {
    previewUrls.forEach((url) => {
      if (url.startsWith('blob:')) URL.revokeObjectURL(url)
    })
    setSelectedFiles([])
    setPreviewUrls([])
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const setOfferField = (offerId: string, field: keyof QuantityOffer, value: string | number | boolean) => {
    setForm((current) => ({
      ...current,
      offers: current.offers.map((offer) => {
        if (offer.id !== offerId) return offer

        const nextOffer = { ...offer, [field]: value }

        if (field === 'minQuantity' || field === 'discountValue' || field === 'discountType') {
          nextOffer.title = `Buy ${Number(nextOffer.minQuantity || 1)} and get ${Number(nextOffer.discountValue || 0)}${nextOffer.discountType === 'percentage' ? '% off' : '₹ off'}`
        }

        return nextOffer
      }),
    }))
  }

  const addOffer = () => {
    const nextMinQuantity = form.offers.length ? Math.max(...form.offers.map((offer) => Number(offer.minQuantity || 1))) + 1 : 2
    setForm((current) => ({
      ...current,
      offers: [...current.offers, createOffer(nextMinQuantity, 'percentage', 5)],
    }))
  }

  const removeOffer = (id: string) => {
    setForm((current) => ({
      ...current,
      offers: current.offers.filter((offer) => offer.id !== id),
    }))
  }

  if (!isAdmin) {
    return (
      <main className="admin-products-page">
        <div className="admin-products-container">
          <h1>Product Manage</h1>
          <p className="admin-products-note">Only admin users can manage products.</p>
        </div>
      </main>
    )
  }

  const openAdd = () => {
    setEditingId(null)
    setForm(emptyForm())
    resetImagePicker()
    setShowForm(true)
    setError('')
    setMessage('')
  }

  const openEdit = (product: Product) => {
    const actualMrp = Number(product.actualMrp ?? product.price ?? 0)
    const sellingPrice = Number(product.sellingPrice ?? product.price ?? actualMrp ?? 0)
    const discount = Number(product.discount ?? calculateDiscount(actualMrp, sellingPrice))

    const existingImages = uniqueImageUrls([
      ...(Array.isArray(product.images) ? product.images : []),
      product.image || product.img || '',
    ])

    setEditingId(getProductId(product))
    setForm({
      image: existingImages[0] || product.image || product.img || '',
      images: existingImages,
      video: product.video || '',
      title: product.title || '',
      size: product.size || '',
      actualMrp,
      sellingPrice,
      discount,
      description: product.description || '',
      quantityOffersEnabled: false,
      activeProduct: true,
      featuredProduct: false,
      allowCashOnDelivery: true,
      offers: [createOffer(2, 'percentage', 5), createOffer(3, 'percentage', 10)],
    })
    previewUrls.forEach((url) => {
      if (url.startsWith('blob:')) URL.revokeObjectURL(url)
    })
    setSelectedFiles([])
    setPreviewUrls(existingImages)
    if (fileInputRef.current) fileInputRef.current.value = ''
    setShowForm(true)
    setError('')
    setMessage('')
  }

  const handleImageSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    if (!files.length) return

    const validFiles = files.filter((file) => file.type.startsWith('image/'))
    if (validFiles.length !== files.length) {
      setError('Please select only image files')
      return
    }

    const totalAllowed = 5
    const existingNonBlobCount = previewUrls.filter((url) => !url.startsWith('blob:')).length
    const currentBlobCount = selectedFiles.length
    const remainingSlots = totalAllowed - existingNonBlobCount - currentBlobCount

    if (remainingSlots <= 0 && validFiles.length > 0) {
      setError('You can upload up to 5 images only')
      if (event.target) event.target.value = ''
      return
    }

    const filesToAdd = validFiles.slice(0, Math.max(0, remainingSlots))
    if (filesToAdd.length !== validFiles.length) {
      setError('You can upload up to 5 images only')
    }

    previewUrls.forEach((url) => {
      if (url.startsWith('blob:')) URL.revokeObjectURL(url)
    })

    const newPreviewUrls = filesToAdd.map((file) => URL.createObjectURL(file))
    const mergedUrls = uniqueImageUrls([...previewUrls.filter((url) => !url.startsWith('blob:')), ...newPreviewUrls]).slice(0, totalAllowed)

    setSelectedFiles(filesToAdd)
    setPreviewUrls(mergedUrls)
    setForm((current) => ({
      ...current,
      image: mergedUrls[0] || current.image || '',
      images: mergedUrls,
    }))
    setError('')
  }

  const removeSelectedImage = (index: number) => {
    const nextSelectedFiles = selectedFiles.filter((_, i) => i !== index)
    const nextPreviewUrls = previewUrls.filter((_, i) => i !== index)

    if (previewUrls[index]?.startsWith('blob:')) URL.revokeObjectURL(previewUrls[index])

    setSelectedFiles(nextSelectedFiles)
    setPreviewUrls(nextPreviewUrls)
    setForm((current) => ({
      ...current,
      image: nextPreviewUrls[0] || current.image || '',
      images: nextPreviewUrls,
    }))
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleFormNumberChange = (field: 'actualMrp' | 'sellingPrice', value: string) => {
    const numericValue = Number(value || 0)
    setForm((current) => {
      const nextActualMrp = field === 'actualMrp' ? numericValue : Number(current.actualMrp || 0)
      const nextSellingPrice = field === 'sellingPrice' ? numericValue : Number(current.sellingPrice || 0)

      return {
        ...current,
        [field]: numericValue,
        discount: calculateDiscount(nextActualMrp, nextSellingPrice),
      }
    })
  }

  const handleDiscountChange = (value: string) => {
    const numericValue = Number(value || 0)
    const cappedValue = Math.min(100, Math.max(0, numericValue))

    setForm((current) => {
      const nextActualMrp = Number(current.actualMrp || 0)
      const nextSellingPrice = nextActualMrp > 0 ? Number((nextActualMrp * (1 - cappedValue / 100)).toFixed(2)) : Number(current.sellingPrice || 0)

      return {
        ...current,
        discount: cappedValue,
        sellingPrice: nextSellingPrice,
      }
    })
  }

  const handleSave = async () => {
    if (!form.title?.trim() || !form.size?.trim() || !form.description?.trim() || !form.sellingPrice) {
      setError('Fill in title, size, selling price and description')
      return
    }

    if (!form.actualMrp || form.actualMrp < form.sellingPrice) {
      setError('Actual MRP should be greater than or equal to the selling price')
      return
    }

    if (!editingId && !selectedFiles.length) {
      setError('Please select at least one product image')
      return
    }

    if (editingId && !selectedFiles.length && !form?.image?.trim() && (!form.images || form.images.length === 0)) {
      setError('Please select at least one product image')
      return
    }

    const token = getAuthToken()
    if (!token) {
      setError('Please login again as admin')
      return
    }

    const normalizedOffers = form.offers
      .filter((offer) => Number(offer.minQuantity) > 0)
      .map((offer) => ({
        minQuantity: Number(offer.minQuantity),
        discountType: offer.discountType,
        discountValue: Number(offer.discountValue),
        title: offer.title || `Buy ${offer.minQuantity} and get ${offer.discountValue}${offer.discountType === 'percentage' ? '% off' : '₹ off'}`,
        isActive: offer.isActive,
      }))
      .sort((a, b) => a.minQuantity - b.minQuantity)

    setSaving(true)
    setError('')
    setMessage('')
    let step: 'cloudinary' | 'product' = 'product'

    try {
      let uploadedImageUrls: string[] = uniqueImageUrls([...(form.images ?? []), form.image || ''])

      if (selectedFiles.length > 0) {
        step = 'cloudinary'
        setUploadStep('cloudinary')
        uploadedImageUrls = uniqueImageUrls([
          ...uploadedImageUrls,
          ...(await Promise.all(selectedFiles.map((file) => uploadImageToCloudinary(file)))),
        ])
      }

      if (uploadedImageUrls.length === 0) {
        throw new Error('Image upload did not return a URL')
      }

      const primaryImage = uploadedImageUrls[0] || form.image?.trim() || ''
      const payload: ProductPayload = {
        image: primaryImage,
        images: uploadedImageUrls,
        video: form.video?.trim() || '',
        title: form.title.trim(),
        size: form.size.trim(),
        actualMrp: Number(form.actualMrp || 0),
        sellingPrice: Number(form.sellingPrice || 0),
        discount: Number(form.discount || calculateDiscount(form.actualMrp, form.sellingPrice)),
        description: form.description.trim(),
        quantityOffersEnabled: form.quantityOffersEnabled,
        offers: form.quantityOffersEnabled ? normalizedOffers : [],
        activeProduct: form.activeProduct,
        featuredProduct: form.featuredProduct,
        allowCashOnDelivery: form.allowCashOnDelivery,
      }

      step = 'product'
      setUploadStep('product')
      const response = editingId
        ? await updateProductApi(editingId, payload, token)
        : await createProductApi(payload, token)

      if (response?.success === false) {
        throw new Error(response?.message || 'Unable to save product')
      }

      await dispatch(fetchProducts())
      setMessage(editingId ? 'Product updated successfully' : 'Product created successfully')
      setEditingId(null)
      setForm(emptyForm())
      resetImagePicker()
      setShowForm(false)
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, step === 'cloudinary' ? 'Cloudinary image upload failed' : 'Unable to save product'))
    } finally {
      setUploadStep('idle')
      setSaving(false)
    }
  }

  const handleDelete = async (product: Product) => {
    const id = getProductId(product)
    if (!id) {
      setError('This product cannot be deleted')
      return
    }

    const token = getAuthToken()
    if (!token) {
      setError('Please login again as admin')
      return
    }

    setDeletingId(id)
    setError('')
    setMessage('')

    try {
      const response = await deleteProductApi(id, token)
      if (response?.success === false) {
        throw new Error(response?.message || 'Unable to delete product')
      }
      await dispatch(fetchProducts())
      if (editingId === id) {
        setEditingId(null)
        setForm(emptyForm())
        resetImagePicker()
        setShowForm(false)
      }
      setMessage('Product deleted')
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Unable to delete product'))
    } finally {
      setDeletingId('')
    }
  }

  const imageCountLabel = `${Math.max(previewUrls.length, selectedFiles.length, form.images?.length || 0)}/5 images`
  const imageSlots = Array.from({ length: 5 }, (_, index) => previewUrls[index] || null)

  return (
    <main className="admin-products-page">
      <div className="admin-products-container">
        <div className="admin-products-header">
          <div>
            <p className="admin-kicker">Admin</p>
            <h1>Product Manage</h1>
          </div>
          <button type="button" className="admin-primary-btn" onClick={openAdd}>
            + Add product
          </button>
        </div>

        {showForm && (
          <section className="admin-product-form">
            <div className="admin-form-head">
              <div>
                <span className="admin-form-breadcrumb">Admin <span>›</span> Products <span>›</span> <strong>{editingId ? 'Edit Product' : 'Add Product'}</strong></span>
              </div>
              <button
                type="button"
                className="admin-ghost-btn"
                disabled={saving}
                onClick={() => {
                  setShowForm(false)
                  setEditingId(null)
                  resetImagePicker()
                  setError('')
                }}
              >
                Cancel
              </button>
            </div>

            <div className="admin-form-grid">
              <div className="admin-form-column">
                <div className="admin-panel">
                  <div className="admin-panel-header">
                    <span className="panel-icon">◫</span>
                    <h3>Product Images</h3>
                    <span className="panel-badge">{imageCountLabel}</span>
                  </div>

                  <div className="admin-upload-box">
                    <button type="button" className="admin-upload-trigger" onClick={() => fileInputRef.current?.click()}>
                      <span>⇪</span>
                      <span>Upload Images</span>
                    </button>
                    <div className="admin-upload-hint">Upload up to 5 images</div>
                    <input
                      id="product-image"
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      disabled={saving}
                      onChange={handleImageSelect}
                    />
                  </div>

                  <div className="admin-upload-note">{selectedFiles.length > 0 ? `${selectedFiles.length} file${selectedFiles.length > 1 ? 's' : ''} selected` : 'Select one or more images from your computer or phone.'}</div>

                  {previewUrls.length > 0 ? (
                    <div className="admin-form-preview-grid">
                      {imageSlots.map((url, index) => (
                        <div key={url ? `${url}-${index}` : `empty-slot-${index}`} className={`admin-form-preview-item ${!url ? 'is-empty' : ''}`}>
                          {url ? (
                            <>
                              <button
                                type="button"
                                className="admin-preview-remove"
                                aria-label={`Remove image ${index + 1}`}
                                onClick={() => removeSelectedImage(index)}
                              >
                                ×
                              </button>
                              <img className="admin-form-preview" src={url} alt={`Product preview ${index + 1}`} />
                            </>
                          ) : (
                            <div className="admin-form-preview-placeholder">
                              <span>+</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>

                <div className="admin-panel">
                  <div className="admin-panel-header">
                    <span className="panel-icon">◧</span>
                    <h3>Basic Information</h3>
                  </div>

                  <div className="admin-field-grid">
                    <div className="admin-field admin-field-half">
                      <label>Product Title *</label>
                      <input
                        type="text"
                        value={form.title}
                        placeholder="Salikunj Facewash"
                        onChange={(e) => setForm({ ...form, title: e.target.value })}
                      />
                    </div>

                    <div className="admin-field admin-field-half">
                      <label>Size *</label>
                      <input
                        type="text"
                        value={form.size}
                        placeholder="70ml"
                        onChange={(e) => setForm({ ...form, size: e.target.value })}
                      />
                    </div>

                    <div className="admin-field admin-field-full">
                      <label>Short Description</label>
                      <input
                        type="text"
                        value={form.description}
                        placeholder="Effective face wash for oily skin"
                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                      />
                    </div>

                    <div className="admin-field admin-field-full">
                      <label>Full Description *</label>
                      <textarea
                        value={form.description}
                        placeholder="A gentle yet effective facewash with Salicylic Acid, Niacinamide and Tea Tree Extract that helps clean pores, control excess oil and prevent acne breakouts."
                        rows={5}
                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <div className="admin-panel">
                  <div className="admin-panel-header">
                    <span className="panel-icon">₹</span>
                    <h3>Pricing</h3>
                  </div>

                  <div className="admin-pricing-grid">
                    <div className="admin-field">
                      <label>Actual MRP (₹) *</label>
                      <input
                        type="number"
                        min="0"
                        value={form.actualMrp || ''}
                        placeholder="249"
                        onChange={(e) => handleFormNumberChange('actualMrp', e.target.value)}
                      />
                    </div>

                    <div className="admin-field">
                      <label>Selling Price (₹) *</label>
                      <input
                        type="number"
                        min="0"
                        value={form.sellingPrice || ''}
                        placeholder="199"
                        onChange={(e) => handleFormNumberChange('sellingPrice', e.target.value)}
                      />
                    </div>

                    <div className="admin-field">
                      <label>Discount (%)</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={form.discount || ''}
                        placeholder="20"
                        onChange={(e) => handleDiscountChange(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="admin-form-column">
                <div className="admin-panel">
                  <div className="admin-panel-header">
                    <span className="panel-icon">▶</span>
                    <h3>Product Video (Optional)</h3>
                  </div>

                  <div className="admin-field admin-field-full">
                    <label>Video URL</label>
                    <input
                      type="url"
                      value={form.video}
                      placeholder="https://example.com/product.mp4"
                      onChange={(e) => setForm({ ...form, video: e.target.value })}
                    />
                    <small>Add a product video (YouTube, Vimeo or direct link)</small>
                  </div>
                </div>

                <div className="admin-panel">
                  <div className="admin-panel-header quantity-header">
                    <div className="left-title">
                      <span className="panel-icon">✦</span>
                      <h3>Quantity Based Offers</h3>
                    </div>
                    <button
                      type="button"
                      className={`toggle-switch ${form.quantityOffersEnabled ? 'on' : ''}`}
                      aria-label="Toggle quantity offers"
                      onClick={() => setForm((current) => ({ ...current, quantityOffersEnabled: !current.quantityOffersEnabled }))}
                    >
                      <span className="toggle-slider" />
                    </button>
                  </div>

                  {form.quantityOffersEnabled && (
                    <>
                      <div className="admin-offer-info">Set discount tiers for different quantities. Customers will get the best applicable offer automatically.</div>

                      <div className="admin-offer-list">
                        {form.offers.length === 0 ? (
                          <div className="admin-empty-offer">No offers added yet.</div>
                        ) : (
                          form.offers.map((offer) => (
                            <div key={offer.id} className="admin-offer-row">
                              <div className="admin-offer-row-top">
                                <span className="admin-offer-label">Offer {form.offers.indexOf(offer) + 1}</span>
                                <button type="button" className="admin-offer-delete" onClick={() => removeOffer(offer.id)} aria-label="Delete offer">
                                  🗑
                                </button>
                              </div>

                              <div className="admin-offer-grid">
                                <div className="admin-field">
                                  <label>Min. Quantity</label>
                                  <input
                                    type="number"
                                    min="1"
                                    value={offer.minQuantity}
                                    onChange={(e) => setOfferField(offer.id, 'minQuantity', Number(e.target.value || 1))}
                                  />
                                </div>

                                <div className="admin-field">
                                  <label>Discount Type</label>
                                  <select
                                    value={offer.discountType}
                                    onChange={(e) => setOfferField(offer.id, 'discountType', e.target.value as 'percentage' | 'fixed')}
                                  >
                                    <option value="percentage">Percentage (%)</option>
                                    <option value="fixed">Fixed Amount (₹)</option>
                                  </select>
                                </div>

                                <div className="admin-field">
                                  <label>Discount Value</label>
                                  <input
                                    type="number"
                                    min="0"
                                    value={offer.discountValue}
                                    onChange={(e) => setOfferField(offer.id, 'discountValue', Number(e.target.value || 0))}
                                  />
                                </div>

                                <div className="admin-field admin-field-full">
                                  <label>Offer Title</label>
                                  <input
                                    type="text"
                                    value={offer.title}
                                    onChange={(e) => setOfferField(offer.id, 'title', e.target.value)}
                                  />
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>

                      <button type="button" className="admin-secondary-btn" onClick={addOffer}>
                        + Add Another Offer
                      </button>
                    </>
                  )}
                </div>

                <div className="admin-panel">
                  <div className="admin-panel-header">
                    <span className="panel-icon">⚙</span>
                    <h3>Other Settings</h3>
                  </div>

                  <div className="admin-settings-list">
                    <div className="admin-setting-row">
                      <div>
                        <strong>Active Product</strong>
                        <small>Product will be visible on your website</small>
                      </div>
                      <button
                        type="button"
                        className={`toggle-switch ${form.activeProduct ? 'on' : ''}`}
                        aria-label="Toggle active product"
                        onClick={() => setForm((current) => ({ ...current, activeProduct: !current.activeProduct }))}
                      >
                        <span className="toggle-slider" />
                      </button>
                    </div>

                    <div className="admin-setting-row">
                      <div>
                        <strong>Featured Product</strong>
                        <small>Show on homepage or featured section</small>
                      </div>
                      <button
                        type="button"
                        className={`toggle-switch ${form.featuredProduct ? 'on' : ''}`}
                        aria-label="Toggle featured product"
                        onClick={() => setForm((current) => ({ ...current, featuredProduct: !current.featuredProduct }))}
                      >
                        <span className="toggle-slider" />
                      </button>
                    </div>

                    <div className="admin-setting-row">
                      <div>
                        <strong>Allow Cash On Delivery</strong>
                        <small>Allow COD on delivery for this product</small>
                      </div>
                      <button
                        type="button"
                        className={`toggle-switch ${form.allowCashOnDelivery ? 'on' : ''}`}
                        aria-label="Toggle cash on delivery"
                        onClick={() => setForm((current) => ({ ...current, allowCashOnDelivery: !current.allowCashOnDelivery }))}
                      >
                        <span className="toggle-slider" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="admin-form-actions">
              <button type="button" className="admin-ghost-btn" disabled={saving} onClick={() => { setShowForm(false); setEditingId(null); resetImagePicker(); setError('') }}>
                Cancel
              </button>
              <button type="button" className="admin-primary-btn large" onClick={handleSave} disabled={saving}>
                {saving
                  ? uploadStep === 'cloudinary'
                    ? 'Uploading image...'
                    : editingId
                      ? 'Updating product...'
                      : 'Creating product...'
                  : editingId
                    ? 'Save Product'
                    : 'Save Product'}
              </button>
            </div>
          </section>
        )}

        {error && <div className="admin-error">{error}</div>}
        {message && <div className="admin-success">{message}</div>}

        {loading && products.length === 0 ? (
          <p className="admin-products-note">Loading products...</p>
        ) : products.length === 0 ? (
          <p className="admin-products-note">No products yet. Add your first product.</p>
        ) : (
          <div className="admin-product-list">
            {products.map((product) => {
              const id = getProductId(product)
              return (
                <article key={id || product.title} className="admin-product-card">
                  <img src={product.image || product.img || fallbackImage} alt={product.title} />
                  <div className="admin-product-meta">
                    <h3>{product.title}</h3>
                    <p>{product.size || 'Size not set'}</p>
                    <strong>₹{product.price}</strong>
                  </div>
                  <div className="admin-product-actions">
                    <button type="button" onClick={() => openEdit(product)}>Update</button>
                    <button
                      type="button"
                      className="danger"
                      disabled={deletingId === id}
                      onClick={() => void handleDelete(product)}
                    >
                      {deletingId === id ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </article>
              )
            })}
          </div>
        )}

        <button type="button" className="admin-ghost-btn back-home" onClick={() => navigate('/')}>
          ← Back to shop
        </button>
      </div>
    </main>
  )
}
