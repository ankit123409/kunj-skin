import { useState } from 'react'
import './OrderStatusSelect.css'
import { getAuthToken, updateOrderStatusApi } from '../api/api'
import { ORDER_STATUSES, normalizeOrderStatus } from '../utils/orderStatus'
import { navigate } from '../router'

function getApiErrorMessage(err: unknown, fallback: string) {
  const axiosErr = err as { message?: string; response?: { data?: { message?: string; error?: string } } }
  return axiosErr?.response?.data?.message || axiosErr?.response?.data?.error || axiosErr?.message || fallback
}

const shippingMethodStorageKey = 'kunj-skin-order-shipping-methods'

function getPersistedShippingMethod(orderId: string) {
  if (typeof window === 'undefined') return ''
  try {
    const raw = window.sessionStorage.getItem(shippingMethodStorageKey)
    if (!raw) return ''
    const parsed = JSON.parse(raw) as Record<string, string>
    return parsed[orderId] || ''
  } catch {
    return ''
  }
}

function setPersistedShippingMethod(orderId: string, shippingMethod: 'shiprocket' | 'own') {
  if (typeof window === 'undefined') return
  try {
    const raw = window.sessionStorage.getItem(shippingMethodStorageKey)
    const parsed: Record<string, string> = raw ? JSON.parse(raw) as Record<string, string> : {}
    parsed[orderId] = shippingMethod
    window.sessionStorage.setItem(shippingMethodStorageKey, JSON.stringify(parsed))
  } catch {
    // ignore storage exceptions
  }
}

type Props = {
  orderId: string
  status: string
  compact?: boolean
  onUpdated: (status: string, shippingMethod?: 'shiprocket' | 'own') => void
}

export default function OrderStatusSelect({ orderId, status, compact, onUpdated }: Props) {
  const current = normalizeOrderStatus(status)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [selectedShippingMethod, setSelectedShippingMethod] = useState<'shiprocket' | 'own' | ''>('')
  const [confirmSaving, setConfirmSaving] = useState(false)
  const [confirmError, setConfirmError] = useState('')

  const finalizeConfirmedStatus = async (shippingMethod: 'shiprocket' | 'own') => {
    const token = getAuthToken()
    if (!token) {
      setConfirmError('Please login again as admin')
      return
    }

    setConfirmSaving(true)
    setConfirmError('')

    try {
      const response = await updateOrderStatusApi(orderId, 'confirmed', token)
      if (response?.success === false) {
        throw new Error(response?.message || 'Unable to confirm order')
      }

      setPersistedShippingMethod(orderId, shippingMethod)
      onUpdated('confirmed', shippingMethod)
      setShowConfirmModal(false)
      setSelectedShippingMethod('')

      if (shippingMethod === 'shiprocket') {
        window.setTimeout(() => {
          navigate(`/order/${orderId}`)
        }, 120)
      } else {
        window.setTimeout(() => {
          navigate(`/order/${orderId}`)
        }, 120)
      }
    } catch (err: unknown) {
      setConfirmError(getApiErrorMessage(err, 'Unable to confirm the order'))
    } finally {
      setConfirmSaving(false)
    }
  }

  const handleChange = async (nextStatus: string) => {
    if (!orderId || nextStatus === current) return

    if (normalizeOrderStatus(nextStatus) === 'confirmed') {
      const saved = getPersistedShippingMethod(orderId)
      setSelectedShippingMethod(saved === 'shiprocket' || saved === 'own' ? saved : '')
      setConfirmError('')
      setShowConfirmModal(true)
      return
    }

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
    <>
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
          disabled={saving || confirmSaving}
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

      {showConfirmModal && (
        <div className="shipping-confirm-modal-backdrop" onClick={() => setShowConfirmModal(false)}>
          <div className="shipping-confirm-modal" onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true">
            <div className="shipping-confirm-header">
              <h3>Confirm Order</h3>
            </div>

            <p className="shipping-confirm-message">Are you sure you want to confirm this order?</p>

            <div className="shipping-method-list">
              <label className={`shipping-method-option ${selectedShippingMethod === 'shiprocket' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name={`shipping-method-${orderId}`}
                  checked={selectedShippingMethod === 'shiprocket'}
                  onChange={() => setSelectedShippingMethod('shiprocket')}
                />
                <span>
                  <strong>Shiprocket</strong>
                  <small>Create and manage shipment using Shiprocket APIs.</small>
                </span>
              </label>

              <label className={`shipping-method-option ${selectedShippingMethod === 'own' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name={`shipping-method-${orderId}`}
                  checked={selectedShippingMethod === 'own'}
                  onChange={() => setSelectedShippingMethod('own')}
                />
                <span>
                  <strong>Ship by Own</strong>
                  <small>Manage shipping independently without Shiprocket.</small>
                </span>
              </label>
            </div>

            {confirmError && <p className="shipping-confirm-error">{confirmError}</p>}

            <div className="shipping-confirm-actions">
              <button type="button" className="shipping-cancel-button" onClick={() => setShowConfirmModal(false)} disabled={confirmSaving}>
                Cancel
              </button>
              <button
                type="button"
                className="shipping-confirm-button"
                disabled={!selectedShippingMethod || confirmSaving}
                onClick={() => {
                  if (selectedShippingMethod === 'shiprocket' || selectedShippingMethod === 'own') {
                    void finalizeConfirmedStatus(selectedShippingMethod)
                  }
                }}
              >
                {confirmSaving ? 'Confirming...' : 'Confirm Order'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
