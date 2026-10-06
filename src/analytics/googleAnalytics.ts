import { useEffect } from 'react'

export const GA_MEASUREMENT_ID = 'G-YBLWG0GNXQ'

export type AnalyticsItem = {
  item_id: string
  item_name: string
  price?: number
  quantity?: number
  item_category?: string
  item_variant?: string
}

export type PurchaseParams = {
  transaction_id: string
  value: number
  currency?: string
  items?: AnalyticsItem[]
}

type Gtag = (...args: unknown[]) => void

declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: Gtag
  }
}

let initialized = false
let lastPageKey = ''
let previousLocation = ''

function canUseDom() {
  return typeof window !== 'undefined' && typeof document !== 'undefined'
}

function gtag(...args: unknown[]) {
  if (!canUseDom()) return
  window.dataLayer = window.dataLayer || []
  window.dataLayer.push(args)
}

/** Load gtag.js and configure GA4 once. Automatic page_view is disabled so the router can send it. */
export function initGoogleAnalytics() {
  if (!canUseDom() || initialized || !GA_MEASUREMENT_ID) return
  initialized = true

  window.dataLayer = window.dataLayer || []
  window.gtag = gtag
  gtag('js', new Date())
  gtag('config', GA_MEASUREMENT_ID, {
    send_page_view: false,
    cookie_domain: 'auto',
  })

  if (document.querySelector(`script[src*="gtag/js?id=${GA_MEASUREMENT_ID}"]`)) return

  const script = document.createElement('script')
  script.async = true
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`
  document.head.appendChild(script)
}

export function trackPageView() {
  if (!canUseDom()) return
  initGoogleAnalytics()

  const pagePath = `${window.location.pathname}${window.location.search}`
  const pageLocation = window.location.href
  const pageKey = `${pagePath}|${document.title}`
  if (pageKey === lastPageKey) return
  lastPageKey = pageKey

  const pageReferrer = previousLocation || document.referrer
  previousLocation = pageLocation

  gtag('event', 'page_view', {
    page_path: pagePath,
    page_title: document.title,
    page_location: pageLocation,
    page_referrer: pageReferrer,
  })
}

/** Sends a custom GA4 event. Safe to call from any component. */
export function trackEvent(eventName: string, parameters: Record<string, unknown> = {}) {
  if (!canUseDom()) return
  initGoogleAnalytics()
  gtag('event', eventName, parameters)
}

export function trackFormSubmission(formName: string, parameters: Record<string, unknown> = {}) {
  trackEvent('form_submission', { form_name: formName, ...parameters })
}

export function trackLogin(method = 'mobile') {
  trackEvent('login', { method })
}

export function trackSignUp(method = 'mobile') {
  trackEvent('sign_up', { method })
}

export function trackViewItem(item: AnalyticsItem, currency = 'INR') {
  trackEvent('view_item', {
    currency,
    value: item.price,
    items: [item],
  })
}

export function trackAddToCart(item: AnalyticsItem, currency = 'INR') {
  trackEvent('add_to_cart', {
    currency,
    value: (item.price ?? 0) * (item.quantity ?? 1),
    items: [item],
  })
}

export function trackBeginCheckout(value: number, items: AnalyticsItem[], currency = 'INR') {
  trackEvent('begin_checkout', {
    currency,
    value,
    items,
  })
}

export function trackPurchase({ transaction_id, value, currency = 'INR', items = [] }: PurchaseParams) {
  trackEvent('purchase', {
    transaction_id,
    value,
    currency,
    items,
  })
}

/** Track the current URL whenever the in-app path changes. Same path is sent only once. */
export function usePageViews(path: string) {
  useEffect(() => {
    trackPageView()
  }, [path])
}
