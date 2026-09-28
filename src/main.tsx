import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import App from './App.tsx'
import { store } from './store/store'
import { fetchProducts } from './store/productsSlice'

// load products once at startup
store.dispatch(fetchProducts() as any)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </StrictMode>,
)
