import { configureStore } from '@reduxjs/toolkit'
import cartReducer from './cartSlice'
import uiReducer from './uiSlice'
import favoritesReducer from './favoritesSlice'
import authReducer, { initialState as initialAuthState, type AuthState } from './authSlice'
import ordersReducer, { initialState as initialOrdersState, type OrdersState } from './ordersSlice'
import productsReducer from './productsSlice'

function loadFromStorage<T>(key: string): T | undefined {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : undefined
  } catch {
    return undefined
  }
}

function hydrateAuth(): AuthState {
  const stored = loadFromStorage<AuthState>('kunj-skin-auth') ?? initialAuthState
  let role = stored.role || ''
  let name = stored.name || ''

  try {
    const user = JSON.parse(localStorage.getItem('kunj-skin-user') || '{}') as { role?: string; name?: string }
    if (!role && user.role) role = user.role
    if (!name && user.name) name = user.name
  } catch {
    // keep stored values
  }

  return {
    ...initialAuthState,
    ...stored,
    role,
    name,
  }
}

const reducer = {
  cart: cartReducer,
  ui: uiReducer,
  favorites: favoritesReducer,
  auth: authReducer,
  orders: ordersReducer,
  products: productsReducer,
}

export type RootState = {
  cart: ReturnType<typeof cartReducer>
  ui: ReturnType<typeof uiReducer>
  favorites: ReturnType<typeof favoritesReducer>
  auth: AuthState
  orders: OrdersState
  products: ReturnType<typeof productsReducer>
}

export const store = configureStore({
  reducer,
  preloadedState: {
    auth: hydrateAuth(),
    orders: loadFromStorage<OrdersState>('kunj-skin-orders') ?? initialOrdersState,
  } satisfies Partial<RootState>,
})

store.subscribe(() => {
  localStorage.setItem('kunj-skin-auth', JSON.stringify(store.getState().auth))
  localStorage.setItem('kunj-skin-orders', JSON.stringify(store.getState().orders))
})

export type AppDispatch = typeof store.dispatch
