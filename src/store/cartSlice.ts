import { createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'

export type Product = {
  id: string
  title: string
  price: number
  size?: string
  img?: string
  desc?: string
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
      const existing = state.items.find((i) => i.id === payload.id)
      if (existing) existing.quantity += 1
      else state.items.push({ ...payload, quantity: 1 })
    },
    removeFromCart(state, action: PayloadAction<string>) {
      const id = action.payload
      state.items = state.items.filter((i) => i.id !== id)
    },
    decrement(state, action: PayloadAction<string>) {
      const id = action.payload
      const item = state.items.find((i) => i.id === id)
      if (!item) return
      if (item.quantity > 1) item.quantity -= 1
      else state.items = state.items.filter((i) => i.id !== id)
    },
    clearCart(state) {
      state.items = []
    },
  },
})

export const { addToCart, removeFromCart, decrement, clearCart } = cartSlice.actions
export default cartSlice.reducer
