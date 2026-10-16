export const API_BASE = 'https://kunj-skin-backend.vercel.app/api'
// export const API_BASE = 'http://localhost:8001/api'

export const AUTH = {
  REGISTER: `${API_BASE}/auth/register`,
  LOGIN: `${API_BASE}/auth/login`,
}
export const PRODUCTS = {
  LIST: `${API_BASE}/products`,
  CREATE: `${API_BASE}/products`,
  UPDATE: (id: string) => `${API_BASE}/products/${id}`,
  DELETE: (id: string) => `${API_BASE}/products/${id}`,
  FAQS: (productId: string) => `${API_BASE}/products/${productId}/faqs`,
}
export const ORDERS = {
  MY: `${API_BASE}/orders/my`,
  ADMIN_ALL: `${API_BASE}/orders/admin/all`,
  CREATE: `${API_BASE}/orders`,
  STATUS: (id: string) => `${API_BASE}/orders/${id}/status`,
  ADMIN_STATUS: `${API_BASE}/orders/admin/status`,
}
export const PAYMENTS = {
  VERIFY: `${API_BASE}/payment/verify`,
}
export const SHIPPING = {
  ORDERS: `${API_BASE}/admin/shipping/orders`,
  COURIERS: (orderId: string) => `${API_BASE}/admin/shipping/couriers/${orderId}`,
  CREATE: (orderId: string) => `${API_BASE}/admin/shipping/create/${orderId}`,
  ASSIGN_COURIER: (orderId: string) => `${API_BASE}/admin/shipping/assign-courier/${orderId}`,
  SCHEDULE_PICKUP: (orderId: string) => `${API_BASE}/admin/shipping/schedule-pickup/${orderId}`,
  GENERATE_LABEL: (orderId: string) => `${API_BASE}/admin/shipping/generate-label/${orderId}`,
  CANCEL: (orderId: string) => `${API_BASE}/admin/shipping/cancel/${orderId}`,
  TRACK: (orderId: string) => `${API_BASE}/orders/${orderId}/tracking`,
}
export const ADDRESSES = {
  LIST: `${API_BASE}/addresses`,
  CREATE: `${API_BASE}/addresses`,
  UPDATE: (id: string) => `${API_BASE}/addresses/${id}`,
  DELETE: (id: string) => `${API_BASE}/addresses/${id}`,
}
export const COUPONS = {
  LIST: `${API_BASE}/coupons`,
  CREATE: `${API_BASE}/coupons`,
  UPDATE: (id: string) => `${API_BASE}/coupons/${id}`,
  DELETE: (id: string) => `${API_BASE}/coupons/${id}`,
}

export const REVIEWS = {
  CREATE: `${API_BASE}/reviews`,
  BY_PRODUCT: (productId: string) => `${API_BASE}/reviews/product/${productId}`,
  DELETE: (id: string) => `${API_BASE}/reviews/${id}`,
}
