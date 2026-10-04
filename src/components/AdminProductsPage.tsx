import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import './AdminProductsPage.css'
import fallbackImage from '../assets/p1.png'
import { useAppDispatch, useAppSelector } from '../hooks'
import {
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
  video: '',
  title: '',
  size: '',
  price: 0,
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
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    void dispatch(fetchProducts())
  }, [dispatch])

  useEffect(() => {
    return () => {
      if (previewUrl.startsWith('blob:')) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  const resetImagePicker = () => {
    if (previewUrl.startsWith('blob:')) URL.revokeObjectURL(previewUrl)
    setSelectedFile(null)
    setPreviewUrl('')
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
    setEditingId(getProductId(product))
    setForm({
      image: product.image || product.img || '',
      video: product.video || '',
      title: product.title || '',
      size: product.size || '',
      price: Number(product.price || 0),
      description: product.description || '',
    })
    if (previewUrl.startsWith('blob:')) URL.revokeObjectURL(previewUrl)
    setSelectedFile(null)
    setPreviewUrl(product.image || product.img || '')
    if (fileInputRef.current) fileInputRef.current.value = ''
    setShowForm(true)
    setError('')
    setMessage('')
  }

  const handleImageSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file')
      return
    }

    if (previewUrl.startsWith('blob:')) URL.revokeObjectURL(previewUrl)
    setSelectedFile(file)
    setPreviewUrl(URL.createObjectURL(file))
    setError('')
  }

  const handleSave = async () => {
    if (!form.title.trim() || !form.size.trim() || !form.description.trim() || !form.price) {
      setError('Fill in title, size, price and description')
      return
    }

    if (!editingId && !selectedFile) {
      setError('Please select a product image')
      return
    }

    if (editingId && !selectedFile && !form.image.trim()) {
      setError('Please select a product image')
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
      let imageUrl = form.image.trim()

      if (selectedFile) {
        step = 'cloudinary'
        setUploadStep('cloudinary')
        imageUrl = await uploadImageToCloudinary(selectedFile)
      }

      if (!imageUrl) {
        throw new Error('Image upload did not return a URL')
      }

      const payload: ProductPayload = {
        image: imageUrl,
        video: form.video.trim(),
        title: form.title.trim(),
        size: form.size.trim(),
        price: Number(form.price),
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

            <label htmlFor="product-image">Product image *</label>
            <input
              id="product-image"
              ref={fileInputRef}
              type="file"
              accept="image/*"
              disabled={saving}
              onChange={handleImageSelect}
            />
            <p className="admin-file-hint">
              {selectedFile
                ? selectedFile.name
                : editingId
                  ? 'Choose a new image to replace the current one, or keep the existing image.'
                  : 'Select an image from your computer or phone.'}
            </p>

            {previewUrl ? (
              <img className="admin-form-preview" src={previewUrl} alt="Product preview" />
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

            <label>Price *</label>
            <input
              type="number"
              min="0"
              value={form.price || ''}
              placeholder="799"
              onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
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
