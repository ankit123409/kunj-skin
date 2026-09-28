import axios from 'axios'
import { AUTH } from './endpoints'

const instance = axios.create({
  baseURL: AUTH.REGISTER.replace('/auth/register', ''),
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 5000,
})

export async function registerApi(payload: { name: string; mobile: string; password: string }) {
  const res = await instance.post('/auth/register', payload)
  return res.data
}

export async function loginApi(payload: { mobile: string; password: string }) {
  const res = await instance.post('/auth/login', payload)
  return res.data
}

export async function createOrderApi(payload: { items: { product: string; quantity: number }[]; address: { name: string; mobile: string; addressLine1: string; addressLine2: string; city: string; state: string; pincode: string } }, token?: string) {
  const res = await instance.post('/orders', payload, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  })

  return res.data
}

export async function getMyOrdersApi(token?: string) {
  const res = await instance.get('/orders/my', {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  })

  return res.data
}

export async function getOrderByIdApi(id: string, token?: string) {
  const res = await instance.get(`/orders/${id}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  })

  return res.data
}

export async function getProducts() {
  const res = await instance.get('/products')
  const data = res.data

  // Normalize common API shapes to an array of products
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.data)) return data.data
  if (Array.isArray(data?.products)) return data.products
  if (Array.isArray(data?.result)) return data.result

  // fallback: if server returned a single object, wrap it
  if (data && typeof data === 'object') return [data]

  return []
}
