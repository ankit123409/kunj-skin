import { createSlice } from '@reduxjs/toolkit'

type UIState = {
  cartOpen: boolean
  profileOpen: boolean
  checkoutFlow: boolean
}

const initialState: UIState = {
  cartOpen: false,
  profileOpen: false,
  checkoutFlow: false,
}

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    openCart(state) {
      state.cartOpen = true
    },
    closeCart(state) {
      state.cartOpen = false
    },
    toggleCart(state) {
      state.cartOpen = !state.cartOpen
    },
    openProfile(state) {
      state.profileOpen = true
    },
    closeProfile(state) {
      state.profileOpen = false
    },
    toggleProfile(state) {
      state.profileOpen = !state.profileOpen
    },
    startCheckout(state) {
      state.checkoutFlow = true
    },
    finishCheckout(state) {
      state.checkoutFlow = false
    },
  },
})

export const {
  openCart,
  closeCart,
  toggleCart,
  openProfile,
  closeProfile,
  toggleProfile,
  startCheckout,
  finishCheckout,
} = uiSlice.actions
export default uiSlice.reducer
