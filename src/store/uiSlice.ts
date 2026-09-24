import { createSlice } from '@reduxjs/toolkit'

type UIState = {
  cartOpen: boolean
  profileOpen: boolean
}

const initialState: UIState = {
  cartOpen: false,
  profileOpen: false,
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
  },
})

export const { openCart, closeCart, toggleCart, openProfile, closeProfile, toggleProfile } = uiSlice.actions
export default uiSlice.reducer
