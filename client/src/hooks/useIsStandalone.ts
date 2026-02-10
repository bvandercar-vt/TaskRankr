import { useEffect, useState } from 'react'

export function useIsStandalone() {
  const [isStandalone, setIsStandalone] = useState(() => {
    if (typeof window === 'undefined') return false
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as any).standalone === true ||
      document.referrer.includes('android-app://')
    )
  })

  useEffect(() => {
    const mql = window.matchMedia('(display-mode: standalone)')
    const handler = (e: MediaQueryListEvent) => setIsStandalone(e.matches)
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [])

  return isStandalone
}
