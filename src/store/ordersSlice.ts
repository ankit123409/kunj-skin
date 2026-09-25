import { createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'
import type { Product } from './cartSlice'

type CartLine = Product & { quantity: number }

type OrderItem = {
  id: string
  total: number
  createdAt: string
  status: 'Placed' | 'Packed' | 'Shipped' | 'Delivered'
  items: CartLine[]
}

export type OrdersState = {
  items: OrderItem[]
}

export const initialState: OrdersState = {
  items: [],
}

const ordersSlice = createSlice({
  name: 'orders',
  initialState,
  reducers: {
    placeOrder(state, action: PayloadAction<OrderItem>) {
      state.items.unshift(action.payload)
    },
    clearOrders(state) {
      state.items = []
    },
  },
})

export const { placeOrder, clearOrders } = ordersSlice.actions
export default ordersSlice.reducer
