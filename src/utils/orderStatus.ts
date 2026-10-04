export const ORDER_STATUSES = [
  'pending',
  'confirmed',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
] as const

export type OrderStatus = (typeof ORDER_STATUSES)[number]

const STATUS_HINTS: Record<OrderStatus, string> = {
  pending: 'Your order has been placed',
  confirmed: 'Your order has been confirmed',
  processing: 'Your order is being processed',
  shipped: 'Your item is on the way',
  delivered: 'Your item has been delivered',
  cancelled: 'This order was cancelled',
}

export function normalizeOrderStatus(status: string): OrderStatus {
  const value = status.trim().toLowerCase()
  if (value.includes('deliver')) return 'delivered'
  if (value.includes('cancel')) return 'cancelled'
  if (value.includes('ship')) return 'shipped'
  if (value.includes('process')) return 'processing'
  if (value.includes('confirm')) return 'confirmed'
  if (ORDER_STATUSES.includes(value as OrderStatus)) return value as OrderStatus
  return 'pending'
}

export function formatStatusDate(dateValue?: string) {
  if (!dateValue) return ''
  const date = new Date(dateValue)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function statusLabel(status: string, createdAt?: string) {
  const normalized = normalizeOrderStatus(status)
  const title = normalized.charAt(0).toUpperCase() + normalized.slice(1)
  const dateText = formatStatusDate(createdAt)
  return dateText ? `${title} on ${dateText}` : title
}

export function statusHint(status: string) {
  return STATUS_HINTS[normalizeOrderStatus(status)]
}

export function statusTone(status: string) {
  return normalizeOrderStatus(status)
}

export function isAdminRole(role?: string | null) {
  return String(role || '').trim().toLowerCase() === 'admin'
}
