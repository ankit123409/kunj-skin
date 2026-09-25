import { useEffect, useState } from 'react'

export function navigate(to: string) {
  const rawBase = (import.meta.env && (import.meta.env.BASE_URL as string)) || ''
  const base = (typeof rawBase === 'string' ? rawBase : '').replace(/\/$/, '')
  const normalized = to.startsWith('/') ? to : `/${to}`
  const target = `${base}${normalized}`

  const current = window.location.pathname
  if (current !== target) {
    window.history.pushState(null, '', target)
    window.dispatchEvent(new PopStateEvent('popstate'))
  }
}

export function usePath() {
  const rawBase = (import.meta.env && (import.meta.env.BASE_URL as string)) || ''
  const base = (typeof rawBase === 'string' ? rawBase : '').replace(/\/$/, '')

  const getRelative = () => {
    const pathname = window.location.pathname
    if (base && pathname.startsWith(base)) {
      const rel = pathname.slice(base.length) || '/'
      return rel
    }
    return pathname
  }

  const [path, setPath] = useState<string>(getRelative())
  useEffect(() => {
    const onPop = () => setPath(getRelative())
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])
  return path
}
