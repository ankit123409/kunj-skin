import { createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'

export type Product = {
  title: string
  price: number
  size?: string
  image?: string
  img?: string
  description?: string
  createdAt?: string
  updatedAt?: string
  _id?: string
}

type CartItem = Product & { quantity: number }

type CartState = {
  items: CartItem[]
}

const initialState: CartState = {
  items: [],
}

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addToCart(state, action: PayloadAction<Product>) {
      const payload = action.payload
      
      const existing = state.items.find((i) => i._id === payload._id)
      
      if (existing) existing.quantity += 1
      else state.items.push({ ...payload, quantity: 1 })
    },
    removeFromCart(state, action: PayloadAction<string>) {
      const _id = action.payload
      state.items = state.items.filter((i) => i._id !== _id)
    },
    decrement(state, action: PayloadAction<string>) {
      const _id = action.payload
      const item = state.items.find((i) => i._id === _id)
      if (!item) return
      if (item.quantity > 1) item.quantity -= 1
      else state.items = state.items.filter((i) => i._id !== _id)
    },
    clearCart(state) {
      state.items = []
    },
  },
})

export const { addToCart, removeFromCart, decrement, clearCart } = cartSlice.actions
export default cartSlice.reducer
