export type OrderWhatsAppPayload = {
  orderId: string
  customerName: string
  customerPhone: string
  totalAmount: number
}

/** Fire-and-forget. Never blocks checkout if WhatsApp fails. */
export function notifyOrderWhatsApp(payload: OrderWhatsAppPayload) {
  void fetch('/api/notify-order', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }).catch((err) => {
    console.error('WhatsApp order notify failed', err)
  })
}
