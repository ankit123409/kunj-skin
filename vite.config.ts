import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv, type Plugin } from 'vite'
import os from 'node:os'
import path from 'node:path'
import type { IncomingMessage, ServerResponse } from 'node:http'

type OrderNotifyBody = {
  orderId?: string
  customerName?: string
  customerPhone?: string
  totalAmount?: number
}

function toWhatsAppNumber(raw: string) {
  const digits = String(raw || '').replace(/\D/g, '')
  if (digits.length === 10) return `91${digits}`
  if (digits.length === 12 && digits.startsWith('91')) return digits
  if (digits.length === 11 && digits.startsWith('0')) return `91${digits.slice(1)}`
  return digits
}

async function readJsonBody(req: IncomingMessage): Promise<OrderNotifyBody> {
  const chunks: Buffer[] = []
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
  }
  const raw = Buffer.concat(chunks).toString('utf8')
  return raw ? (JSON.parse(raw) as OrderNotifyBody) : {}
}

function formatOrderDate(date = new Date()) {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

async function sendWhatsAppTemplate(params: {
  apiVersion: string
  phoneNumberId: string
  accessToken: string
  templateName: string
  templateLang: string
  to: string
  bodyParams: string[]
}) {
  const url = `https://graph.facebook.com/${params.apiVersion}/${params.phoneNumberId}/messages`
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${params.accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: params.to,
      type: 'template',
      template: {
        name: params.templateName,
        language: { code: params.templateLang },
        components: [
          {
            type: 'body',
            parameters: params.bodyParams.map((text) => ({ type: 'text', text })),
          },
        ],
      },
    }),
  })

  const data = (await response.json().catch(() => ({}))) as Record<string, unknown>
  if (!response.ok) {
    throw new Error(JSON.stringify(data))
  }
  return data
}

function whatsappNotifyPlugin(env: Record<string, string>): Plugin {
  const handle = async (req: IncomingMessage, res: ServerResponse) => {
    if (req.method === 'OPTIONS') {
      res.statusCode = 204
      res.end()
      return
    }

    if (req.method !== 'POST') {
      res.statusCode = 405
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({ ok: false, error: 'Method not allowed' }))
      return
    }

    const phoneNumberId = env.WHATSAPP_PHONE_NUMBER_ID
    const accessToken = env.WHATSAPP_ACCESS_TOKEN
    const adminPhone = toWhatsAppNumber(env.WHATSAPP_ADMIN_PHONE || '919099359409')
    const apiVersion = env.WHATSAPP_API_VERSION || 'v25.0'
    const customerTemplate = env.WHATSAPP_TEMPLATE_NAME || 'jaspers_market_order_confirmation_v1'
    const adminTemplate = env.WHATSAPP_ADMIN_TEMPLATE_NAME || customerTemplate
    const templateLang = env.WHATSAPP_TEMPLATE_LANG || 'en_US'

    if (!phoneNumberId || !accessToken) {
      res.statusCode = 500
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({ ok: false, error: 'WhatsApp env vars missing' }))
      return
    }

    try {
      const payload = await readJsonBody(req)
      const customerPhone = toWhatsAppNumber(payload.customerPhone || '')
      const orderId = String(payload.orderId || '')
      const customerName = payload.customerName || 'Customer'
      const totalAmount = Number(payload.totalAmount || 0)
      const orderDate = formatOrderDate()

      if (!customerPhone) {
        res.statusCode = 400
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify({ ok: false, error: 'customerPhone is required' }))
        return
      }

      const send = (to: string, templateName: string, bodyParams: string[]) =>
        sendWhatsAppTemplate({
          apiVersion,
          phoneNumberId,
          accessToken,
          templateName,
          templateLang,
          to,
          bodyParams,
        })

      const results = await Promise.allSettled([
        send(customerPhone, customerTemplate, [customerName, orderId, orderDate]),
        send(adminPhone, adminTemplate, [
          customerName,
          orderId,
          `₹${totalAmount} · ${customerPhone}`,
        ]),
      ])

      res.statusCode = 200
      res.setHeader('Content-Type', 'application/json')
      res.end(
        JSON.stringify({
          ok: results.every((item) => item.status === 'fulfilled'),
          customer: { to: customerPhone, status: results[0].status },
          admin: { to: adminPhone, status: results[1].status },
          errors: results
            .filter((item): item is PromiseRejectedResult => item.status === 'rejected')
            .map((item) => String(item.reason)),
        }),
      )
    } catch (error) {
      res.statusCode = 500
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({ ok: false, error: error instanceof Error ? error.message : 'Notify failed' }))
    }
  }

  return {
    name: 'whatsapp-order-notify',
    configureServer(server) {
      server.middlewares.use('/api/notify-order', (req, res) => {
        void handle(req, res)
      })
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react(), whatsappNotifyPlugin(env)],
    cacheDir: path.join(os.tmpdir(), 'kunj-skin-vite-cache'),
    build: {
      sourcemap: false,
    },
  }
})
