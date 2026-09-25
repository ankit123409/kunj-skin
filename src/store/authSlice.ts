import { createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'

const resetStoredOrders = () => {
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem('kunj-skin-orders')
  }
}

export type AuthState = {
  isLoggedIn: boolean
  mobile: string
  otpSent: boolean
  otpCode: string
  deliveryAddress: string
}

export const initialState: AuthState = {
  isLoggedIn: false,
  mobile: '',
  otpSent: false,
  otpCode: '',
  deliveryAddress: '',
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    sendOtp(state, action: PayloadAction<string>) {
      const mobile = action.payload
      state.mobile = mobile
      state.otpSent = true
      state.otpCode = String(mobile.slice(-4)).padStart(6, '0')
    },
    verifyOtp(state, action: PayloadAction<string>) {
      if (action.payload === state.otpCode) {
        state.isLoggedIn = true
      }
    },
    logout(state) {
      state.isLoggedIn = false
      state.mobile = ''
      state.otpSent = false
      state.otpCode = ''
      state.deliveryAddress = ''
      resetStoredOrders()
    },
    setDeliveryAddress(state, action: PayloadAction<string>) {
      state.deliveryAddress = action.payload
    },
  },
})

export const { sendOtp, verifyOtp, logout, setDeliveryAddress } = authSlice.actions
export default authSlice.reducer
