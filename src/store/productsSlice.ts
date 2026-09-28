import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { getProducts } from '../api/api'
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

export const fetchProducts = createAsyncThunk('products/fetch', async () => {
  const res = await getProducts()
  // Expect server to return array of products
  return res
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
