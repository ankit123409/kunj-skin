import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { calculateDiscount, getProducts } from '../api/api'
import type { Product } from './cartSlice'

export type ProductsState = {
  items: Product[]
  loading: boolean
  error: string | null
}

const initialState: ProductsState = {
  items: [],
  loading: false,
  error: null,
}

const normalizeProduct = (product: Record<string, unknown>): Product => {
  const actualMrp = Number(product.actualMrp ?? product.mrp ?? product.price ?? 0)
  const sellingPrice = Number(product.sellingPrice ?? product.price ?? actualMrp ?? 0)
  const discount = Number(
    product.discount ??
      (actualMrp > 0 && sellingPrice > 0 ? calculateDiscount(actualMrp, sellingPrice) : 0),
  )

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
        .filter(Boolean)
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

  const images = [
    ...normalizeImageList(product.images),
    ...normalizeImageList(product.image),
    ...normalizeImageList(product.img),
  ].filter((url, index, array) => url && array.indexOf(url) === index)

  const mainImage = images[0] || String(product.image || product.img || '') || ''

  return {
    ...(product as Product),
    _id: String(product._id || product.id || ''),
    title: String(product.title || 'Product'),
    price: sellingPrice,
    actualMrp: actualMrp || sellingPrice,
    sellingPrice,
    discount,
    image: mainImage || undefined,
    img: mainImage || undefined,
    images,
  }
}

export const fetchProducts = createAsyncThunk('products/fetch', async () => {
  const res = await getProducts()
  return Array.isArray(res) ? res.map((product) => normalizeProduct(product as Record<string, unknown>)) : []
})

const productsSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchProducts.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.items = Array.isArray(action.payload) ? action.payload : []
        state.loading = false
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message ?? 'Failed to load products'
      })
  },
})

export default productsSlice.reducer
