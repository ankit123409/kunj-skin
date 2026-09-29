import { createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'
import type { Product } from './cartSlice'

type CartLine = Product & { quantity: number }

type OrderItem = {
  id?: string
  _id?: string
  total?: number
  totalAmount?: number
  createdAt: string
  status: 'Placed' | 'Packed' | 'Shipped' | 'Delivered' | string
  items: CartLine[]
  address?: {
    name?: string
    mobile?: string
    addressLine1?: string
    addressLine2?: string
    city?: string
    state?: string
    pincode?: string
  }
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
