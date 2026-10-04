import { useState } from 'react'
import './OrderStatusSelect.css'
import { getAuthToken, updateOrderStatusApi } from '../api/api'
import { ORDER_STATUSES, normalizeOrderStatus } from '../utils/orderStatus'

function getApiErrorMessage(err: unknown, fallback: string) {
  const axiosErr = err as { message?: string; response?: { data?: { message?: string; error?: string } } }
  return axiosErr?.response?.data?.message || axiosErr?.response?.data?.error || axiosErr?.message || fallback
}

type Props = {
  orderId: string
  status: string
  compact?: boolean
  onUpdated: (status: string) => void
}

export default function OrderStatusSelect({ orderId, status, compact, onUpdated }: Props) {
  const current = normalizeOrderStatus(status)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleChange = async (nextStatus: string) => {
    if (!orderId || nextStatus === current) return

    const token = getAuthToken()
    if (!token) {
      setError('Please login again as admin')
      return
    }

    setSaving(true)
    setError('')

    try {
      const response = await updateOrderStatusApi(orderId, nextStatus, token)
      if (response?.success === false) {
        throw new Error(response?.message || 'Unable to update status')
      }
      onUpdated(nextStatus)
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Unable to update status'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className={compact ? 'order-status-select-wrap compact' : 'order-status-select-wrap'}
      onClick={(event) => event.stopPropagation()}
      onKeyDown={(event) => event.stopPropagation()}
    >
      <label htmlFor={`order-status-${orderId}`}>Update status</label>
      <select
        id={`order-status-${orderId}`}
        className="order-status-select"
        value={current}
        disabled={saving}
        onChange={(event) => void handleChange(event.target.value)}
      >
        {ORDER_STATUSES.map((option) => (
          <option key={option} value={option}>
            {option.charAt(0).toUpperCase() + option.slice(1)}
          </option>
        ))}
      </select>
      {saving && <p className="order-status-select-note">Updating...</p>}
      {error && <p className="order-status-select-error">{error}</p>}
    </div>
  )
}
