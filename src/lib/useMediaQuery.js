import { useState, useEffect } from 'react'

// Hook שמחזיר אם המשתמש במסך קטן (טלפון) או רחב (מחשב)
export function useMediaQuery(query) {
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia(query).matches
  })
  
  useEffect(() => {
    const media = window.matchMedia(query)
    const listener = (e) => setMatches(e.matches)
    media.addEventListener('change', listener)
    return () => media.removeEventListener('change', listener)
  }, [query])
  
  return matches
}

// קיצורי דרך נוחים לרוחבי מסך נפוצים
export function useIsMobile() {
  return useMediaQuery('(max-width: 768px)')
}

export function useIsTablet() {
  return useMediaQuery('(max-width: 1024px)')
}