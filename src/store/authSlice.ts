import { createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'

const resetStoredOrders = () => {
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem('kunj-skin-orders')
  }
}

type User = {
  name: string
  email?: string
  mobile: string
  password: string
}

export type AuthState = {
  isLoggedIn: boolean
  mobile: string
  name: string
  role: string
  deliveryAddress: string
  users: User[]
  loginError: boolean
}

export const initialState: AuthState = {
  isLoggedIn: false,
  mobile: '',
  name: '',
  role: '',
  deliveryAddress: '',
  users: [
    { name: 'Admin User', mobile: '9099359409', password: '123456' },
  ],
  loginError: false,
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    register(state, action: PayloadAction<User>) {
      const user = action.payload
      // avoid duplicate mobile registration
      const exists = state?.users?.find((u) => u.mobile === user.mobile)
      if (!exists) state?.users?.push(user)
      state.isLoggedIn = true
      state.mobile = user.mobile
      state.name = user.name
      state.loginError = false
    },
    login(state, action: PayloadAction<{ mobile: string; password: string }>) {
      const { mobile, password } = action.payload
      const user = state.users.find((u) => u.mobile === mobile && u.password === password)
      if (user) {
        state.isLoggedIn = true
        state.mobile = mobile
        state.name = user.name
        state.loginError = false
      } else {
        state.isLoggedIn = false
        state.loginError = true
      }
    },
    logout(state) {
      state.isLoggedIn = false
      state.mobile = ''
      state.name = ''
      state.role = ''
      state.deliveryAddress = ''
      state.loginError = false
      resetStoredOrders()
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem('kunj-skin-token')
        window.localStorage.removeItem('kunj-skin-user')
      }
    },
    setDeliveryAddress(state, action: PayloadAction<string>) {
      state.deliveryAddress = action.payload
    },
    setAuthenticated(state, action: PayloadAction<{ mobile: string; name?: string; role?: string }>) {
      state.isLoggedIn = true
      state.mobile = action.payload.mobile
      if (action.payload.name) state.name = action.payload.name
      if (action.payload.role) state.role = action.payload.role
      state.loginError = false
    },
  },
})

export const { register, login, logout, setDeliveryAddress, setAuthenticated } = authSlice.actions
export default authSlice.reducer
