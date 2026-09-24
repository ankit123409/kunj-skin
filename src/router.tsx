import { useEffect, useState } from 'react'

export function navigate(to: string) {
  if (window.location.pathname !== to) {
    window.history.pushState(null, '', to)
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
