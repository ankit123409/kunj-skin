// export const API_BASE = 'http://localhost:8001/api'
export const API_BASE = 'https://kunj-skin-backend.vercel.app/api'



export const AUTH = {
  REGISTER: `${API_BASE}/auth/register`,
  LOGIN: `${API_BASE}/auth/login`,
}
export const PRODUCTS = {
  LIST: `${API_BASE}/products`,
}
export const ORDERS = {
  MY: `${API_BASE}/orders/my`,
  CREATE: `${API_BASE}/orders`,
}
