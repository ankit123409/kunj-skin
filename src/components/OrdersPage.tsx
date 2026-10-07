import { useEffect, useMemo, useState, type FormEvent } from 'react'
import './OrdersPage.css'
import fallbackImage from '../assets/p1.png'
import { useAppSelector } from '../hooks'
import { getAdminOrdersApi, getMyOrdersApi } from '../api/api'
import { navigate } from '../router'
import OrderStatusSelect from './OrderStatusSelect'
import { isAdminRole, normalizeOrderStatus, ORDER_STATUSES, statusHint, statusLabel, statusTone } from '../utils/orderStatus'

type OrderProduct = {
  id?: string
  _id?: string
  title: string
  price: number
  quantity: number
  image?: string
  img?: string
  size?: string
}

type OrderRow = {
  id?: string
  _id?: string
  totalAmount?: number
  total?: number
  createdAt: string
  status: string
  customerName?: string
  customerMobile?: string
  items: OrderProduct[]
}

type ApiRecord = Record<string, unknown>

function asRecord(value: unknown): ApiRecord | null {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as ApiRecord) : null
}

function extractOrderList(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload
  const root = asRecord(payload)
  if (!root) return []
  if (Array.isArray(root.data)) return root.data
  if (Array.isArray(root.orders)) return root.orders
  if (Array.isArray(root.result)) return root.result
  const nested = asRecord(root.data)
  if (nested) {
    if (Array.isArray(nested.data)) return nested.data
    if (Array.isArray(nested.orders)) return nested.orders
  }
  return []
}

function normalizeItem(raw: unknown, index: number): OrderProduct {
  const item = asRecord(raw) ?? {}
  const product = asRecord(item.product) ?? {}
  const title = String(product.title || product.name || item.title || item.name || `Product ${index + 1}`)
  const price = Number(item.price ?? product.price ?? 0)
  const quantity = Number(item.quantity ?? 1)
  const image = String(product.image || item.image || product.img || item.img || '')
  const size = String(product.size || item.size || '')

  return {
    id: String(item._id || item.id || product._id || product.id || `item-${index}`),
    _id: String(item._id || product._id || ''),
    title,
    price,
    quantity,
    image: image || undefined,
    img: String(product.img || item.img || '') || undefined,
    size: size || undefined,
  }
}

function orderDateKey(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

function normalizeOrder(raw: unknown, index: number): OrderRow {
  const order = asRecord(raw) ?? {}
  const items = Array.isArray(order.items) ? order.items.map((item, itemIndex) => normalizeItem(item, itemIndex)) : []
  const user = asRecord(order.user) ?? asRecord(order.customer)
  const address = asRecord(order.address)

  return {
    id: String(order._id || order.id || `order-${index}`),
    _id: String(order._id || ''),
    totalAmount: Number(order.totalAmount ?? order.total ?? order.amount ?? 0),
    total: Number(order.total ?? order.totalAmount ?? 0),
    createdAt: String(order.createdAt || order.created_at || new Date().toISOString()),
    status: String(order.status || 'pending'),
    customerName: String(user?.name || address?.name || ''),
    customerMobile: String(user?.mobile || address?.mobile || ''),
    items,
  }
}

export default function OrdersPage() {
  const localOrders = useAppSelector((state) => state.orders.items)
  const role = useAppSelector((state) => state.auth.role)
  const isAdmin = isAdminRole(role)
  const [orders, setOrders] = useState<OrderRow[]>([])
  const [loading, setLoading] = useState(false)
  const [query, setQuery] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [productFilter, setProductFilter] = useState('all')

  useEffect(() => {
    const token = typeof window !== 'undefined' ? window.localStorage.getItem('kunj-skin-token') : null
    const fallback = localOrders.map((order, index) => normalizeOrder(order, index))

    if (!token) {
      setOrders(fallback)
      return
    }

    let isMounted = true
    setLoading(true)

    const fetchOrders = isAdmin ? getAdminOrdersApi(token) : getMyOrdersApi(token)

    fetchOrders
      .then((response) => {
        if (!isMounted) return
        const mapped = extractOrderList(response).map((order, index) => normalizeOrder(order, index))
        setOrders(isAdmin ? mapped : mapped.length > 0 ? mapped : fallback)
      })
      .catch(() => {
        if (!isMounted) return
        setOrders(isAdmin ? [] : fallback)
      })
      .finally(() => {
        if (isMounted) setLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [localOrders, isAdmin])

  const productOptions = useMemo(() => {
    const titles = new Set<string>()
    orders.forEach((order) => {
      order.items.forEach((item) => {
        if (item.title) titles.add(item.title)
      })
    })
    return Array.from(titles).sort((a, b) => a.localeCompare(b))
  }, [orders])

  const filtersActive = statusFilter !== 'all' || Boolean(fromDate) || Boolean(toDate) || productFilter !== 'all'

  const visibleOrders = useMemo(() => {
    const term = search.trim().toLowerCase()
    return orders.filter((order) => {
      if (isAdmin && statusFilter !== 'all' && normalizeOrderStatus(order.status) !== statusFilter) return false

      if (isAdmin && (fromDate || toDate)) {
        const placed = orderDateKey(order.createdAt)
        if (!placed) return false
        if (fromDate && placed < fromDate) return false
        if (toDate && placed > toDate) return false
      }

      if (isAdmin && productFilter !== 'all') {
        const matchesProduct = order.items.some((item) => item.title === productFilter)
        if (!matchesProduct) return false
      }

      if (!term) return true
      const id = String(order._id || order.id || '').toLowerCase()
      const status = order.status.toLowerCase()
      const titles = order.items.map((item) => item.title.toLowerCase()).join(' ')
      const customer = `${order.customerName || ''} ${order.customerMobile || ''}`.toLowerCase()
      return id.includes(term) || status.includes(term) || titles.includes(term) || customer.includes(term)
    })
  }, [orders, search, isAdmin, statusFilter, fromDate, toDate, productFilter])

  const handleSearch = (event: FormEvent) => {
    event.preventDefault()
    setSearch(query)
  }

  return (
    <main className="orders-page">
      <div className="orders-page-container">
        <form className="orders-search" onSubmit={handleSearch}>
          <input
            type="search"
            value={query}
            placeholder={isAdmin ? 'Search all orders here' : 'Search your orders here'}
            onChange={(e) => setQuery(e.target.value)}
            aria-label={isAdmin ? 'Search all orders here' : 'Search your orders here'}
          />
          <button type="submit">
            <svg className="search-icon" viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" strokeWidth="2" />
              <path d="M16.5 16.5L21 21" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            Search Orders
          </button>
        </form>

        {isAdmin && (
          <div className="orders-filters">
            <label>
              Status
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                <option value="all">All statuses</option>
                {ORDER_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </option>
                ))}
              </select>
            </label>
            <label>
              From
              <input type="date" value={fromDate} max={toDate || undefined} onChange={(event) => setFromDate(event.target.value)} />
            </label>
            <label>
              To
              <input type="date" value={toDate} min={fromDate || undefined} onChange={(event) => setToDate(event.target.value)} />
            </label>
            <label>
              Product
              <select value={productFilter} onChange={(event) => setProductFilter(event.target.value)}>
                <option value="all">All products</option>
                {productOptions.map((title) => (
                  <option key={title} value={title}>
                    {title}
                  </option>
                ))}
              </select>
            </label>
            {filtersActive && (
              <button
                type="button"
                className="orders-filter-clear"
                onClick={() => {
                  setStatusFilter('all')
                  setFromDate('')
                  setToDate('')
                  setProductFilter('all')
                }}
              >
                Clear
              </button>
            )}
          </div>
        )}

        {loading && orders.length === 0 ? (
          <div className="orders-empty">
            <div className="empty-icon">📦</div>
            <h2>Loading orders...</h2>
          </div>
        ) : visibleOrders.length === 0 ? (
          <div className="orders-empty">
            <div className="empty-icon">📦</div>
            <h2>{orders.length === 0 ? 'No orders yet' : 'No matching orders'}</h2>
            <p>
              {orders.length === 0
                ? isAdmin
                  ? 'Customer orders will appear here.'
                  : 'Your placed orders will appear here.'
                : isAdmin
                  ? 'Try a different status, date, product, or search.'
                  : 'Try a different product name or order ID.'}
            </p>
          </div>
        ) : (
          <div className="orders-list">
            {visibleOrders.map((order, index) => {
              const firstItem = order.items[0]
              const extraCount = Math.max(order.items.length - 1, 0)
              const itemCount = order.items.reduce((sum, item) => sum + Number(item.quantity || 1), 0)
              const orderId = order._id || order.id || `order-${index}`
              const total = order.totalAmount ?? order.total ?? 0
              const tone = statusTone(order.status)
              const delivered = tone === 'delivered'

              return (
                <div
                  key={orderId}
                  className="order-row"
                  role="button"
                  tabIndex={0}
                  onClick={() => navigate(`/order/${orderId}`)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') navigate(`/order/${orderId}`)
                  }}
                >
                  <div className="order-thumb-wrap">
                    <img
                      src={firstItem?.image || firstItem?.img || fallbackImage}
                      alt={firstItem?.title || 'Order item'}
                    />
                    {extraCount > 0 && (
                      <span className="more-items-badge">{extraCount} More Items</span>
                    )}
                  </div>

                  <div className="order-info">
                    <div className="order-info-top">
                      <h3>{firstItem?.title || 'Order item'}</h3>
                      <div className="order-price">₹{total}</div>
                    </div>
                    <p>
                      {order.items.length > 1
                        ? `${itemCount} ${delivered ? 'Delivered' : 'Items'}`
                        : firstItem?.size
                          ? `Size: ${firstItem.size}`
                          : `Qty: ${firstItem?.quantity || 1}`}
                    </p>
                    {isAdmin && (order.customerName || order.customerMobile) ? (
                      <p className="order-customer">
                        {order.customerName || 'Customer'}
                        {order.customerMobile ? ` · ${order.customerMobile}` : ''}
                      </p>
                    ) : null}
                  </div>

                  <div className={`order-status-block ${tone}`}>
                    <div className="status-title">
                      <span className="status-dot" />
                      {statusLabel(order.status, order.createdAt)}
                    </div>
                    <p>{statusHint(order.status)}</p>
                    {isAdmin && (
                      <OrderStatusSelect
                        compact
                        orderId={orderId}
                        status={order.status}
                        onUpdated={(nextStatus) => {
                          setOrders((current) =>
                            current.map((item) =>
                              (item._id || item.id) === orderId ? { ...item, status: nextStatus } : item,
                            ),
                          )
                        }}
                      />
                    )}
                    {!isAdmin && delivered && (
                      <span
                        className="rate-link"
                        onClick={(event) => {
                          event.stopPropagation()
                          navigate(`/order/${orderId}`)
                        }}
                      >
                        ★ Rate & Review Product
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}
