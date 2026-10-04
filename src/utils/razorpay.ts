export type RazorpaySuccessResponse = {
  razorpay_payment_id: string
  razorpay_order_id: string
  razorpay_signature: string
}

export type OpenRazorpayOptions = {
  key: string
  amount: number
  currency: string
  orderId: string
  name: string
  description: string
  prefill: {
    name: string
    email: string
    contact: string
    vpa?: string
  }
  method?: 'card' | 'upi'
  /** Prefer UPI Collect (UPI ID entry). Still works in test mode. */
  upiFlow?: 'collect' | 'intent'
  onSuccess: (response: RazorpaySuccessResponse) => void | Promise<void>
  onDismiss?: () => void
  onError?: (message: string) => void
}

type RazorpayInstance = {
  open: () => void
  on: (event: string, handler: (response: { error?: { description?: string } }) => void) => void
}

type RazorpayConstructor = new (options: Record<string, unknown>) => RazorpayInstance

declare global {
  interface Window {
    Razorpay?: RazorpayConstructor
  }
}

let scriptPromise: Promise<void> | null = null

export function loadRazorpayScript(): Promise<void> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Razorpay can only run in the browser'))
  }

  if (window.Razorpay) return Promise.resolve()

  if (scriptPromise) return scriptPromise

  scriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-razorpay="checkout"]')
    if (existing) {
      existing.addEventListener('load', () => resolve())
      existing.addEventListener('error', () => reject(new Error('Failed to load Razorpay')))
      if (window.Razorpay) resolve()
      return
    }

    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.async = true
    script.dataset.razorpay = 'checkout'
    script.onload = () => resolve()
    script.onerror = () => {
      scriptPromise = null
      reject(new Error('Failed to load Razorpay checkout'))
    }
    document.body.appendChild(script)
  })

  return scriptPromise
}

function normalizeContact(contact: string) {
  const digits = contact.replace(/\D/g, '')
  if (digits.length === 10) return `+91${digits}`
  if (digits.length === 12 && digits.startsWith('91')) return `+${digits}`
  return contact
}

export async function openRazorpayCheckout(options: OpenRazorpayOptions): Promise<void> {
  await loadRazorpayScript()

  if (!window.Razorpay) {
    throw new Error('Razorpay SDK is unavailable')
  }

  const amount = Number(options.amount)
  if (!options.key || !options.orderId || !Number.isFinite(amount) || amount <= 0) {
    throw new Error('Invalid Razorpay checkout details from server')
  }

  const prefill: Record<string, string> = {
    name: options.prefill.name,
    email: options.prefill.email,
    contact: normalizeContact(options.prefill.contact),
  }

  if (options.method) {
    prefill.method = options.method
  }

  if (options.prefill.vpa) {
    prefill.vpa = options.prefill.vpa
  }

  const checkoutOptions: Record<string, unknown> = {
    key: options.key,
    amount,
    currency: options.currency || 'INR',
    name: options.name,
    description: options.description,
    order_id: options.orderId,
    prefill,
    theme: { color: '#4169E1' },
    retry: { enabled: true, max_count: 3 },
    modal: {
      ondismiss: () => {
        options.onDismiss?.()
      },
    },
    handler: (response: RazorpaySuccessResponse) => {
      void options.onSuccess(response)
    },
  }

  // Soft method preference
  if (options.method) {
    checkoutOptions.method = options.method
  }

  // Force UPI ID (collect) flow when requested
  if (options.method === 'upi' && options.upiFlow === 'collect') {
    checkoutOptions.upi = {
      flow: 'collect',
      ...(options.prefill.vpa ? { vpa: options.prefill.vpa } : {}),
    }
  }

  const rzp = new window.Razorpay(checkoutOptions)

  rzp.on('payment.failed', (response) => {
    const message = response?.error?.description || 'Payment failed. Please try again.'
    options.onError?.(message)
  })

  rzp.open()
}
