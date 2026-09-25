import { useEffect, useState } from 'react'

export function navigate(to: string) {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '')
  const normalized = to.startsWith('/') ? to : `/${to}`
  const target = `${base}${normalized}`

  if (window.location.pathname !== target) {
    window.history.pushState(null, '', target)
    window.dispatchEvent(new PopStateEvent('popstate'))
  }
}

export function usePath() {
  const [path, setPath] = useState<string>(window.location.pathname)
  useEffect(() => {
    const onPop = () => setPath(window.location.pathname)
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])
  return path
}
