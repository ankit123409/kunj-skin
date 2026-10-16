import axios from 'axios'
import { API_BASE, PRODUCTS, SHIPPING } from './endpoints'

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
  perCustomerLimit?: number,
  productId?: string[]
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

export type CouponValidationData = {
  discountPercentage?: number
  discountAmount?: number
  eligibleSubtotal?: number
  subtotal?: number
  finalTotal?: number
  totalAmount?: number
  totalAfterDiscount?: number
  discountedTotal?: number
  total?: number
  couponCode?: string
  coupon?: { discountPercentage?: number; code?: string }
  discount?: number
  code?: string
}

export type CouponValidationResponse = {
  success?: boolean
  message?: string
  data?: CouponValidationData
} & Partial<CouponValidationData>

export async function validateCouponApi(payload: CouponValidationPayload, token?: string) {
  const res = await instance.post('/coupons/validate', payload, {
    headers: authHeaders(token),
  })
  return res.data as CouponValidationResponse
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

export type CourierOption = {
  courierId?: number | string
  id?: number | string
  courierName?: string
  name?: string
  freightCharge?: number | string
  charge?: number | string
  shippingCharge?: number | string
  deliveryDays?: number | string
  estimatedDeliveryDays?: number | string
  estimatedDeliveryDate?: string
  estimatedDelivery?: string
  etd?: string
  trackingUrl?: string
  codAvailable?: boolean
}

export async function getShippingOrdersApi(params?: Record<string, string | number | undefined>, token?: string) {
  const res = await instance.get(SHIPPING.ORDERS, {
    params,
    headers: authHeaders(token),
  })
  return res.data
}

export async function getAvailableCouriersApi(orderId: string, token?: string) {
  const res = await instance.get(SHIPPING.COURIERS(orderId), {
    headers: authHeaders(token),
  })
  return (res.data as { data?: CourierOption[]; couriers?: CourierOption[]; result?: CourierOption[]; availableCouriers?: CourierOption[] } )?.data
    ?? (res.data as { data?: CourierOption[]; couriers?: CourierOption[]; result?: CourierOption[]; availableCouriers?: CourierOption[] })?.couriers
    ?? (res.data as { data?: CourierOption[]; couriers?: CourierOption[]; result?: CourierOption[]; availableCouriers?: CourierOption[] })?.result
    ?? (res.data as { data?: CourierOption[]; couriers?: CourierOption[]; result?: CourierOption[]; availableCouriers?: CourierOption[] })?.availableCouriers
    ?? []
}

export async function createShipmentApi(orderId: string, token?: string) {
  const res = await instance.post(SHIPPING.CREATE(orderId), {}, {
    headers: authHeaders(token),
  })
  return res.data as { success?: boolean; message?: string; data?: unknown }
}

export async function assignCourierApi(orderId: string, courierId: string | number, token?: string) {
  const res = await instance.post(SHIPPING.ASSIGN_COURIER(orderId), { courierId }, {
    headers: authHeaders(token),
  })
  return res.data as { success?: boolean; message?: string; data?: unknown }
}

export async function schedulePickupApi(orderId: string, token?: string) {
  const res = await instance.post(SHIPPING.SCHEDULE_PICKUP(orderId), {}, {
    headers: authHeaders(token),
  })
  return res.data as { success?: boolean; message?: string; data?: unknown }
}

export async function generateShippingLabelApi(orderId: string, token?: string) {
  const res = await instance.post(SHIPPING.GENERATE_LABEL(orderId), {}, {
    headers: authHeaders(token),
  })
  return res.data as { success?: boolean; message?: string; data?: unknown }
}

export async function cancelShipmentApi(orderId: string, token?: string) {
  const res = await instance.post(SHIPPING.CANCEL(orderId), {}, {
    headers: authHeaders(token),
  })
  return res.data as { success?: boolean; message?: string; data?: unknown }
}

export async function getOrderTrackingApi(orderId: string, token?: string) {
  const res = await instance.get(SHIPPING.TRACK(orderId), {
    headers: authHeaders(token),
  })
  return res.data as { success?: boolean; message?: string; data?: unknown; tracking?: unknown[]; history?: unknown[] }
}

export type ProductFaq = {
  _id?: string
  id?: string
  question?: string
  answer?: string
  faq?: string
  response?: string
  productId?: string
}

export function normalizeFaqList(data: unknown): ProductFaq[] {
  if (Array.isArray(data)) return data as ProductFaq[]

  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>
    if (Array.isArray(obj.data)) return obj.data as ProductFaq[]
    if (Array.isArray(obj.faqs)) return obj.faqs as ProductFaq[]
    if (Array.isArray(obj.result)) return obj.result as ProductFaq[]
    if (obj.data && typeof obj.data === 'object') {
      const inner = obj.data as Record<string, unknown>
      if (Array.isArray(inner.faqs)) return inner.faqs as ProductFaq[]
      if (Array.isArray(inner.data)) return inner.data as ProductFaq[]
    }
  }

  return []
}

export async function getProductFaqsApi(productId: string) {
  const res = await instance.get(PRODUCTS.FAQS(productId))
  return normalizeFaqList(res.data)
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
  images?: string[]
  video?: string
  title?: string
  size?: string
  actualMrp?: number
  sellingPrice?: number
  discount?: number
  description?: string
  price?: number
  offers?: Array<{
    minQuantity: number
    discountType: 'percentage' | 'fixed'
    discountValue: number
    title: string
    isActive?: boolean
  }>
  quantityOffersEnabled?: boolean
  activeProduct?: boolean
  featuredProduct?: boolean
  allowCashOnDelivery?: boolean
}

function normalizeProductPayload(payload: ProductPayload): ProductPayload {
  const image = payload.image?.trim() || ''
  const images = Array.isArray(payload.images) ? payload.images.filter(Boolean).map((item) => String(item).trim()).filter(Boolean) : []
  const normalizedImages = Array.from(new Set([...(images.length ? images : image ? [image] : []), ...(image ? [image] : [])]))

  return {
    ...payload,
    image: image || normalizedImages[0] || '',
    images: normalizedImages,
    price: Number(payload.price ?? payload.sellingPrice ?? payload.actualMrp ?? 0),
    actualMrp: Number(payload.actualMrp ?? payload.price ?? payload.sellingPrice ?? 0),
    sellingPrice: Number(payload.sellingPrice ?? payload.price ?? payload.actualMrp ?? 0),
    discount: Number(payload.discount ?? 0),
    quantityOffersEnabled: Boolean(payload.quantityOffersEnabled),
    offers: Array.isArray(payload.offers) ? payload.offers.map((offer) => ({
      ...offer,
      minQuantity: Number(offer.minQuantity || 1),
      discountValue: Number(offer.discountValue || 0),
      isActive: offer.isActive ?? true,
    })) : [],
  }
}

export async function createProductApi(payload: ProductPayload, token?: string) {
  const res = await instance.post(PRODUCTS.CREATE, normalizeProductPayload(payload), {
    headers: {
      ...authHeaders(token),
      Accept: 'application/json',
    },
  })
  return res.data as { success?: boolean; message?: string; data?: unknown }
}

export async function updateProductApi(id: string, payload: ProductPayload, token?: string) {
  const res = await instance.put(PRODUCTS.UPDATE(id), normalizeProductPayload(payload), {
    headers: {
      ...authHeaders(token),
      Accept: 'application/json',
    },
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
  title?: string
  name?: string
  user?: { name?: string }
  customer?: { name?: string }
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
