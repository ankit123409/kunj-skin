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

const emptyForm = (): ProductPayload => ({
  image: '',
  images: [],
  video: '',
  title: '',
  size: '',
  actualMrp: 0,
  sellingPrice: 0,
  discount: 0,
  description: '',
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

  const [form, setForm] = useState<ProductPayload>(emptyForm())
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

    setEditingId(getProductId(product))
    setForm({
      image: product.image || product.img || '',
      images: product.images?.length ? product.images : product.image || product.img ? [product.image || product.img || ''] : [],
      video: product.video || '',
      title: product.title || '',
      size: product.size || '',
      actualMrp,
      sellingPrice,
      discount,
      description: product.description || '',
    })
    previewUrls.forEach((url) => {
      if (url.startsWith('blob:')) URL.revokeObjectURL(url)
    })
    setSelectedFiles([])
    setPreviewUrls(product.images?.length ? product.images : product.image || product.img ? [product.image || product.img || ''] : [])
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

    previewUrls.forEach((url) => {
      if (url.startsWith('blob:')) URL.revokeObjectURL(url)
    })

    const newPreviewUrls = validFiles.map((file) => URL.createObjectURL(file))
    setSelectedFiles(validFiles)
    setPreviewUrls(newPreviewUrls)
    setError('')
  }

  const removeSelectedImage = (index: number) => {
    const nextSelectedFiles = selectedFiles.filter((_, i) => i !== index)
    const nextPreviewUrls = previewUrls.filter((_, i) => i !== index)

    if (previewUrls[index]?.startsWith('blob:')) URL.revokeObjectURL(previewUrls[index])

    setSelectedFiles(nextSelectedFiles)
    setPreviewUrls(nextPreviewUrls)
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

  const handleSave = async () => {
    if (!form.title.trim() || !form.size.trim() || !form.description.trim() || !form.sellingPrice) {
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

    setSaving(true)
    setError('')
    setMessage('')
    let step: 'cloudinary' | 'product' = 'product'

    try {
      let uploadedImageUrls: string[] = form.images?.filter(Boolean) ?? []

      if (selectedFiles.length > 0) {
        step = 'cloudinary'
        setUploadStep('cloudinary')
        uploadedImageUrls = await Promise.all(selectedFiles.map((file) => uploadImageToCloudinary(file)))
      }

      if (uploadedImageUrls.length === 0) {
        throw new Error('Image upload did not return a URL')
      }

      const payload: ProductPayload = {
        images: uploadedImageUrls,
        video: form.video.trim(),
        title: form.title.trim(),
        size: form.size.trim(),
        actualMrp: Number(form.actualMrp || 0),
        sellingPrice: Number(form.sellingPrice || 0),
        discount: Number(form.discount || calculateDiscount(form.actualMrp, form.sellingPrice)),
        description: form.description.trim(),
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
              <h2>{editingId ? 'Update product' : 'Add product'}</h2>
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

            <label htmlFor="product-image">Product images *</label>
            <input
              id="product-image"
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              disabled={saving}
              onChange={handleImageSelect}
            />
            <p className="admin-file-hint">
              {selectedFiles.length > 0
                ? `${selectedFiles.length} file${selectedFiles.length > 1 ? 's' : ''} selected`
                : editingId
                  ? 'Choose one or more new images to replace the current image set, or keep the existing ones.'
                  : 'Select one or more images from your computer or phone.'}
            </p>

            {previewUrls.length > 0 ? (
              <div className="admin-form-preview-grid">
                {previewUrls.map((url, index) => (
                  <div key={`${url}-${index}`} className="admin-form-preview-item">
                    <button
                      type="button"
                      className="admin-preview-remove"
                      aria-label={`Remove image ${index + 1}`}
                      onClick={() => removeSelectedImage(index)}
                    >
                      ×
                    </button>
                    <img className="admin-form-preview" src={url} alt={`Product preview ${index + 1}`} />
                  </div>
                ))}
              </div>
            ) : null}

            <label>Video URL</label>
            <input
              type="url"
              value={form.video}
              placeholder="https://example.com/product.mp4"
              onChange={(e) => setForm({ ...form, video: e.target.value })}
            />

            <label>Title *</label>
            <input
              type="text"
              value={form.title}
              placeholder="Face Cream"
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />

            <label>Size *</label>
            <input
              type="text"
              value={form.size}
              placeholder="50ml"
              onChange={(e) => setForm({ ...form, size: e.target.value })}
            />

            <label>Actual MRP *</label>
            <input
              type="number"
              min="0"
              value={form.actualMrp || ''}
              placeholder="1299"
              onChange={(e) => handleFormNumberChange('actualMrp', e.target.value)}
            />

            <label>Selling Price *</label>
            <input
              type="number"
              min="0"
              value={form.sellingPrice || ''}
              placeholder="999"
              onChange={(e) => handleFormNumberChange('sellingPrice', e.target.value)}
            />

            <label>Discount</label>
            <input
              type="number"
              min="0"
              max="100"
              value={form.discount || ''}
              readOnly
              placeholder="23"
            />

            <label>Description *</label>
            <textarea
              value={form.description}
              placeholder="Daily moisturizer"
              rows={4}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />

            <button type="button" className="admin-primary-btn" onClick={handleSave} disabled={saving}>
              {saving
                ? uploadStep === 'cloudinary'
                  ? 'Uploading image...'
                  : editingId
                    ? 'Updating product...'
                    : 'Creating product...'
                : editingId
                  ? 'Update product'
                  : 'Save product'}
            </button>
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
