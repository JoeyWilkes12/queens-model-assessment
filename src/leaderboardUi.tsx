import { useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from 'react'

/** Single-choice controls: one tab stop per group, arrow keys move the choice. */
export function Choice<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: [T, string][]; onChange: (value: T) => void }) {
  const buttons = useRef<(HTMLButtonElement | null)[]>([])
  const move = (index: number) => {
    const next = (index + options.length) % options.length
    onChange(options[next][0])
    buttons.current[next]?.focus()
  }
  return <div className="lb-tabs" role="radiogroup" aria-label={label}>
    {options.map(([key, text], index) => <button key={key} ref={element => { buttons.current[index] = element }} type="button" role="radio" aria-checked={value === key} tabIndex={value === key ? 0 : -1}
      onClick={() => onChange(key)} onKeyDown={event => {
        if (event.key === 'ArrowRight' || event.key === 'ArrowDown') { event.preventDefault(); move(index + 1) }
        else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') { event.preventDefault(); move(index - 1) }
      }}>{text}</button>)}
  </div>
}

/**
 * An "i" button that opens a small panel of secondary detail beside it. The chart keeps only what is
 * needed to read it; definitions, settings and caveats live here. Closes on Escape, on a press
 * outside, on a window resize, or on the button again, and slides sideways to stay inside the viewport.
 */
export function InfoBubble({ label, children, wide = false }: { label: string; children: ReactNode; wide?: boolean }) {
  const [open, setOpen] = useState(false)
  const [shift, setShift] = useState(0)
  const root = useRef<HTMLSpanElement>(null)
  const button = useRef<HTMLButtonElement>(null)
  const panel = useRef<HTMLDivElement>(null)
  const id = useId()

  useEffect(() => {
    if (!open) return
    const onPress = (event: PointerEvent) => { if (!root.current?.contains(event.target as Node)) setOpen(false) }
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') { setOpen(false); button.current?.focus() } }
    // A resize or rotation moves the anchor; close rather than leave the panel hanging off screen.
    const onResize = () => setOpen(false)
    document.addEventListener('pointerdown', onPress)
    document.addEventListener('keydown', onKey)
    window.addEventListener('resize', onResize)
    return () => { document.removeEventListener('pointerdown', onPress); document.removeEventListener('keydown', onKey); window.removeEventListener('resize', onResize) }
  }, [open])

  // Measure the panel where CSS centred it, then nudge it back inside the viewport before paint.
  useLayoutEffect(() => {
    if (!open || !panel.current) { setShift(0); return }
    const box = panel.current.getBoundingClientRect()
    const edge = 8, natural = box.left - shift
    const limit = document.documentElement.clientWidth - edge
    setShift(natural < edge ? edge - natural : natural + box.width > limit ? limit - natural - box.width : 0)
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  return <span className="lb-info" ref={root}>
    <button ref={button} type="button" className="lb-info-button" aria-label={label} aria-expanded={open} aria-controls={open ? id : undefined} onClick={() => setOpen(value => !value)}>
      <svg aria-hidden="true" width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="10" cy="10" r="8.2" /><path d="M10 9v5" /><path d="M10 6.2v.2" strokeLinecap="round" strokeWidth="2" /></svg>
    </button>
    {open && <div ref={panel} id={id} role="group" aria-label={label} className={`lb-info-panel${wide ? ' lb-info-panel--wide' : ''}`} style={{ transform: `translateX(${shift}px)` }}>{children}</div>}
  </span>
}
