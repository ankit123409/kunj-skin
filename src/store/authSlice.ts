import { createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'

type AuthState = {
  isLoggedIn: boolean
  mobile: string
  otpSent: boolean
  otpCode: string
}

const initialState: AuthState = {
  isLoggedIn: false,
  mobile: '',
  otpSent: false,
  otpCode: '',
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
    },
  },
})

export const { sendOtp, verifyOtp, logout } = authSlice.actions
export default authSlice.reducer
