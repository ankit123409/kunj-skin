import { configureStore } from '@reduxjs/toolkit'
import cartReducer from './cartSlice'
import uiReducer from './uiSlice'
import favoritesReducer from './favoritesSlice'
import authReducer, { initialState as initialAuthState, type AuthState } from './authSlice'
import ordersReducer, { initialState as initialOrdersState, type OrdersState } from './ordersSlice'

function loadFromStorage<T>(key: string): T | undefined {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : undefined
  } catch {
    return undefined
  }
}

export const store = configureStore({
  reducer: {
    cart: cartReducer,
    ui: uiReducer,
    favorites: favoritesReducer,
    auth: authReducer,
    orders: ordersReducer,
  },
  preloadedState: {
    auth: loadFromStorage<AuthState>('kunj-skin-auth') ?? initialAuthState,
    orders: loadFromStorage<OrdersState>('kunj-skin-orders') ?? initialOrdersState,
  },
})

store.subscribe(() => {
  localStorage.setItem('kunj-skin-auth', JSON.stringify(store.getState().auth))
  localStorage.setItem('kunj-skin-orders', JSON.stringify(store.getState().orders))
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
