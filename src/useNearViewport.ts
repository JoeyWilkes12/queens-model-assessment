import { useEffect, useState } from 'react'

/**
 * True once the element comes within `margin` of the viewport. It stays true
 * after that. Use it to defer fetching optional below-the-fold evidence until a reader is about to see it. An
 * element inside a closed <details> has no layout box, so this also waits until the disclosure is opened.
 * Browsers do not wait for work started from `beforeprint`, so printing is handled by src/printPreparation.ts.
 * Without IntersectionObserver it is true at once, so nothing is ever withheld.
 */
export function useNearViewport<T extends Element>(margin = '600px'): [(element: T | null) => void, boolean] {
  const [element, setElement] = useState<T | null>(null)
  const [near, setNear] = useState(() => typeof IntersectionObserver === 'undefined')
  useEffect(() => {
    if (near || !element) return
    const reveal = () => setNear(true)
    const observer = new IntersectionObserver(entries => { if (entries.some(entry => entry.isIntersecting)) reveal() }, { rootMargin: margin })
    observer.observe(element)
    return () => observer.disconnect()
  }, [element, near, margin])
  return [setElement, near]
}
