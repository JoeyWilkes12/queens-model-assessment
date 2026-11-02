import { useEffect, useState } from 'react'

/**
 * True once the element comes within `margin` of the viewport, or the page is about to print. It stays true
 * after that. Use it to defer fetching optional below-the-fold evidence until a reader is about to see it. An
 * element inside a closed <details> has no layout box, so this also waits until the disclosure is opened.
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
    window.addEventListener('beforeprint', reveal)
    return () => { observer.disconnect(); window.removeEventListener('beforeprint', reveal) }
  }, [element, near, margin])
  return [setElement, near]
}
