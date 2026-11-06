/**
 * Printing with evidence that loads on demand. A browser does not wait for anything `beforeprint` starts, so a
 * component whose data is still deferred registers a preparer here. Ctrl/⌘+P then runs every pending preparer,
 * waits (at most PREPARE_LIMIT_MS) for them to finish and render, and only then opens the print dialog. Printing
 * from the browser's menu cannot be intercepted: each such component also renders a print-only fallback.
 */
const PREPARE_LIMIT_MS = 8000
const preparers = new Set<() => Promise<unknown>>()

export function registerPrintPreparer(prepare: () => Promise<unknown>) {
  preparers.add(prepare)
  return () => { preparers.delete(prepare) }
}

/** True while some on-page evidence still needs loading before it can print; exposed for the print check. */
export function hasPendingPrintPreparers() { return preparers.size > 0 }

let installed = false
export function installPrintShortcut() {
  if (installed || typeof window === 'undefined') return
  installed = true
  window.addEventListener('keydown', event => {
    if (!(event.ctrlKey || event.metaKey) || event.altKey || event.shiftKey || event.key.toLowerCase() !== 'p' || !preparers.size) return
    event.preventDefault()
    const pending = Promise.allSettled([...preparers].map(prepare => prepare()))
    const limit = new Promise(resolve => window.setTimeout(resolve, PREPARE_LIMIT_MS))
    // Two frames after the data settles, React has committed the loaded view.
    Promise.race([pending, limit])
      .then(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))))
      .then(() => window.print())
  })
}
