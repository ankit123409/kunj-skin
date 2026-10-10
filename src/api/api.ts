import axios from 'axios'
import { API_BASE } from './endpoints'

const instance = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
})

export type PaymentType = 1 | 2 | 3

export type OrderAddress = {
  name: string
  mobile: string
  addressLine1: string
  addressLine2: string
  city: string
  state: string
  pincode: string
}

export type SavedAddress = OrderAddress & {
  _id?: string
  id?: string
}

export function getAddressId(address: SavedAddress) {
  return String(address._id || address.id || '')
}

function normalizeAddressList(data: unknown): SavedAddress[] {
  if (Array.isArray(data)) return data as SavedAddress[]
  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>
    if (Array.isArray(obj.data)) return obj.data as SavedAddress[]
    if (Array.isArray(obj.addresses)) return obj.addresses as SavedAddress[]
    if (Array.isArray(obj.result)) return obj.result as SavedAddress[]
    if (obj.data && typeof obj.data === 'object') {
      const inner = obj.data as Record<string, unknown>
      if (Array.isArray(inner.addresses)) return inner.addresses as SavedAddress[]
      if (Array.isArray(inner.data)) return inner.data as SavedAddress[]
    }
  }
  return []
}

export type CreateOrderPayload = {
  items: { product: string; quantity: number }[]
  address: OrderAddress
  paymentType: PaymentType
  couponCode?: string
}

export type RazorpayOrderData = {
  key: string
  orderId: string
  amount: number
  currency: string
  paymentType: PaymentType
}

export type CreateOrderResponse = {
  success?: boolean
  message?: string
  data?: {
    _id?: string
    total?: number
    order?: Record<string, unknown> & { _id?: string; total?: number }
    razorpay?: RazorpayOrderData
  }
  order?: Record<string, unknown> & { _id?: string; total?: number }
}

export type VerifyPaymentPayload = {
  razorpay_order_id: string
  razorpay_payment_id: string
  razorpay_signature: string
}

function authHeaders(token?: string) {
  return token ? { Authorization: `Bearer ${token}` } : undefined
}

export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null
  return window.localStorage.getItem('kunj-skin-token')
}

export async function registerApi(payload: { name: string; email: string; mobile: string; password: string }) {
  const res = await instance.post('/auth/register', payload)
  return res.data
}

export async function loginApi(payload: { mobile: string; password: string }) {
  const res = await instance.post('/auth/login', payload)
  return res.data
}

export async function getAddressesApi(token?: string) {
  const res = await instance.get('/addresses', {
    headers: authHeaders(token),
  })
  return {
    raw: res.data as { success?: boolean; message?: string },
    addresses: normalizeAddressList(res.data),
  }
}

export async function createAddressApi(payload: OrderAddress, token?: string) {
  const res = await instance.post('/addresses', payload, {
    headers: authHeaders(token),
  })
  return res.data as { success?: boolean; message?: string; data?: unknown }
}

export async function updateAddressApi(id: string, payload: OrderAddress, token?: string) {
  const res = await instance.put(`/addresses/${id}`, payload, {
    headers: authHeaders(token),
  })
  return res.data as { success?: boolean; message?: string; data?: unknown }
}

export async function deleteAddressApi(id: string, token?: string) {
  const res = await instance.delete(`/addresses/${id}`, {
    headers: authHeaders(token),
  })
  return res.data as { success?: boolean; message?: string }
}

export async function createOrderApi(payload: CreateOrderPayload, token?: string) {
  const res = await instance.post<CreateOrderResponse>('/orders', payload, {
    headers: authHeaders(token),
  })
  return res.data
}

export type CouponPayload = {
  code: string
  productIds?: string[]
  startDate: string
  endDate: string
  discountPercentage: number
  isActive: boolean
  minimumOrderAmount?: number
  maximumDiscountAmount?: number
  usageLimit?: number
  perCustomerLimit?: number
}

export async function getCouponsApi(token?: string) {
  const res = await instance.get('/coupons', {
    headers: authHeaders(token),
  })
  const data = res.data
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.data)) return data.data
  if (Array.isArray(data?.coupons)) return data.coupons
  if (Array.isArray(data?.result)) return data.result
  return []
}

export type CouponValidationPayload = {
  couponCode: string
  items: { product: string; quantity: number }[]
}

export async function validateCouponApi(payload: CouponValidationPayload, token?: string) {
  const res = await instance.post('/coupons/validate', payload, {
    headers: authHeaders(token),
  })
  return res.data as {
    success?: boolean
    message?: string
    data?: {
      discountPercentage?: number
      discountAmount?: number
      finalTotal?: number
      totalAfterDiscount?: number
      discountedTotal?: number
      total?: number
      couponCode?: string
      coupon?: { discountPercentage?: number; code?: string }
    }
  }
}

export async function createCouponApi(payload: CouponPayload, token?: string) {
  const res = await instance.post('/coupons', payload, {
    headers: authHeaders(token),
  })
  return res.data as { success?: boolean; message?: string; data?: unknown }
}

export async function updateCouponApi(id: string, payload: CouponPayload, token?: string) {
  const res = await instance.put(`/coupons/${id}`, payload, {
    headers: authHeaders(token),
  })
  return res.data as { success?: boolean; message?: string; data?: unknown }
}

export async function deleteCouponApi(id: string, token?: string) {
  const res = await instance.delete(`/coupons/${id}`, {
    headers: authHeaders(token),
  })
  return res.data as { success?: boolean; message?: string }
}

export async function verifyPaymentApi(payload: VerifyPaymentPayload, token?: string) {
  const res = await instance.post('/payment/verify', payload, {
    headers: authHeaders(token),
  })
  return res.data as { success?: boolean; message?: string; data?: unknown }
}

export async function getMyOrdersApi(token?: string) {
  const res = await instance.get('/orders/my', {
    headers: authHeaders(token),
  })
  return res.data
}

export async function getAdminOrdersApi(token?: string) {
  const res = await instance.get('/orders/admin/all', {
    headers: authHeaders(token),
  })
  return res.data
}

export async function getOrderByIdApi(id: string, token?: string) {
  const res = await instance.get(`/orders/${id}`, {
    headers: authHeaders(token),
  })
  return res.data
}

export async function updateOrderStatusApi(id: string, status: string, token?: string) {
  const res = await instance.patch(`/orders/${id}/status`, { status }, {
    headers: authHeaders(token),
  })
  return res.data as { success?: boolean; message?: string; data?: unknown }
}

export async function bulkUpdateAdminOrderStatusApi(orderIds: string[], status: string, token?: string) {
  const res = await instance.patch('/orders/admin/status', { orderIds, status }, {
    headers: authHeaders(token),
  })
  return res.data as { success?: boolean; message?: string; data?: unknown }
}

export async function getProducts() {
  const res = await instance.get('/products')
  const data = res.data

  if (Array.isArray(data)) return data
  if (Array.isArray(data?.data)) return data.data
  if (Array.isArray(data?.products)) return data.products
  if (Array.isArray(data?.result)) return data.result
  if (data && typeof data === 'object') return [data]

  return []
}

export function calculateDiscount(actualMrp: number, sellingPrice: number) {
  const safeActualMrp = Number(actualMrp) || 0
  const safeSellingPrice = Number(sellingPrice) || 0

  if (!safeActualMrp || safeSellingPrice <= 0) return 0
  if (safeSellingPrice >= safeActualMrp) return 0

  return Math.round(((safeActualMrp - safeSellingPrice) / safeActualMrp) * 100)
}

export type ProductPayload = {
  image?: string
  images: string[]
  video: string
  title: string
  size: string
  actualMrp: number
  sellingPrice: number
  discount: number
  description: string
  price?: number
}

export async function createProductApi(payload: ProductPayload, token?: string) {
  const res = await instance.post('/products', payload, {
    headers: authHeaders(token),
  })
  return res.data as { success?: boolean; message?: string; data?: unknown }
}

export async function updateProductApi(id: string, payload: ProductPayload, token?: string) {
  const res = await instance.put(`/products/${id}`, payload, {
    headers: authHeaders(token),
  })
  return res.data as { success?: boolean; message?: string; data?: unknown }
}

export async function deleteProductApi(id: string, token?: string) {
  const res = await instance.delete(`/products/${id}`, {
    headers: authHeaders(token),
  })
  return res.data as { success?: boolean; message?: string }
}

export type ProductReview = {
  _id?: string
  id?: string
  user_id?: string
  product_id?: string
  review?: string
  rating?: number
  createdAt?: string
  user?: { name?: string }
}

export type CreateReviewPayload = {
  product_id: string
  review: string
  rating: number
}

export function getReviewId(review: ProductReview) {
  return String(review._id || review.id || '')
}

function normalizeReviewList(data: unknown): ProductReview[] {
  if (Array.isArray(data)) return data as ProductReview[]
  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>
    if (Array.isArray(obj.data)) return obj.data as ProductReview[]
    if (Array.isArray(obj.reviews)) return obj.reviews as ProductReview[]
    if (Array.isArray(obj.result)) return obj.result as ProductReview[]
    if (obj.data && typeof obj.data === 'object') {
      const inner = obj.data as Record<string, unknown>
      if (Array.isArray(inner.reviews)) return inner.reviews as ProductReview[]
      if (Array.isArray(inner.data)) return inner.data as ProductReview[]
    }
  }
  return []
}

export async function getProductReviewsApi(productId: string) {
  const res = await instance.get(`/reviews/product/${productId}`)
  return normalizeReviewList(res.data)
}

export async function createReviewApi(payload: CreateReviewPayload, token?: string) {
  const res = await instance.post('/reviews', payload, {
    headers: authHeaders(token),
  })
  return res.data as { success?: boolean; message?: string; data?: unknown }
}

export async function deleteReviewApi(id: string, token?: string) {
  const res = await instance.delete(`/reviews/${id}`, {
    headers: authHeaders(token),
  })
  return res.data as { success?: boolean; message?: string }
}
