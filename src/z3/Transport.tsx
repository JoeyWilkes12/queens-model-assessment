import { useCallback, useEffect, useId, useRef, useState, type RefObject } from 'react'

export function useReducedMotion() {
  const [reduced, setReduced] = useState(() => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReduced(query.matches)
    update()
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])
  return reduced
}

/**
 * Manual stepping with opt-in playback. Playback never starts by itself,
 * is disabled under reduced motion, and pauses when the page is hidden or the
 * figure leaves the viewport.
 */
export function usePlayer({ min = 0, max, rootRef, resetKey, intervalMs = 1100, initial }: { min?: number; max: number; rootRef: RefObject<HTMLElement | null>; resetKey?: unknown; intervalMs?: number; initial?: number }) {
  const reduced = useReducedMotion()
  const [index, setIndexState] = useState(initial ?? min)
  const [playing, setPlaying] = useState(false)
  const clamp = useCallback((value: number) => Math.max(min, Math.min(max, value)), [min, max])

  useEffect(() => { setIndexState(initial ?? min); setPlaying(false) }, [resetKey]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (reduced) setPlaying(false) }, [reduced])
  useEffect(() => {
    const pause = () => setPlaying(false)
    const onVisibility = () => { if (document.hidden) pause() }
    document.addEventListener('visibilitychange', onVisibility)
    const observer = typeof IntersectionObserver !== 'undefined' ? new IntersectionObserver(entries => { if (entries.some(entry => !entry.isIntersecting)) pause() }) : null
    if (rootRef.current) observer?.observe(rootRef.current)
    return () => { document.removeEventListener('visibilitychange', onVisibility); observer?.disconnect() }
  }, [rootRef])
  useEffect(() => {
    if (!playing) return
    if (index >= max) { setPlaying(false); return }
    const timer = window.setTimeout(() => setIndexState(previous => clamp(previous + 1)), intervalMs)
    return () => window.clearTimeout(timer)
  }, [playing, index, max, intervalMs, clamp])

  const setIndex = (value: number) => { setPlaying(false); setIndexState(clamp(value)) }
  const toggle = () => {
    if (reduced || document.hidden) return
    if (!playing && index >= max) setIndexState(min)
    setPlaying(!playing)
  }
  return { index: clamp(index), setIndex, playing: playing && !reduced, toggle, reduced }
}

function Icon({ name }: { name: 'previous' | 'next' | 'play' | 'pause' | 'replay' }) {
  const shapes = {
    previous: <><path d="M5 4v12" /><path d="m15 4-8 6 8 6Z" fill="currentColor" /></>,
    next: <><path d="M15 4v12" /><path d="m5 4 8 6-8 6Z" fill="currentColor" /></>,
    play: <path d="m6 3.5 10 6.5-10 6.5Z" fill="currentColor" />,
    pause: <><rect x="5" y="4" width="3.5" height="12" fill="currentColor" stroke="none" /><rect x="11.5" y="4" width="3.5" height="12" fill="currentColor" stroke="none" /></>,
    replay: <><path d="M4 10a6 6 0 1 0 2-4.5" /><path d="M4 3v4h4" /></>,
  }
  return <svg aria-hidden="true" width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round">{shapes[name]}</svg>
}

export type TransportProps = {
  index: number
  min?: number
  max: number
  onChange: (index: number) => void
  playing?: boolean
  onToggle?: () => void
  reducedMotion?: boolean
  label: string
  valueText: string
  counter: string
  allowPlayback?: boolean
}

/** Compact transport: previous / play-pause / next / scrubber / counter. Sticky on phones. */
export function Transport({ index, min = 0, max, onChange, playing = false, onToggle, reducedMotion = false, label, valueText, counter, allowPlayback = true }: TransportProps) {
  const id = useId()
  const atEnd = index >= max
  return <div className="z3-transport" role="group" aria-label={`${label} controls`}>
    <button type="button" className="z3-transport-icon" onClick={() => onChange(index - 1)} disabled={index <= min} aria-label={`Previous ${label.toLowerCase()}`}><Icon name="previous" /></button>
    {allowPlayback && <button type="button" className="z3-transport-play" onClick={onToggle} disabled={reducedMotion || max <= min} aria-pressed={playing} aria-label={playing ? 'Pause' : atEnd ? 'Replay from the start' : 'Play'} title={reducedMotion ? 'Playback is off because reduced motion is requested' : undefined}><Icon name={playing ? 'pause' : atEnd ? 'replay' : 'play'} /></button>}
    <button type="button" className="z3-transport-icon" onClick={() => onChange(index + 1)} disabled={atEnd} aria-label={`Next ${label.toLowerCase()}`}><Icon name="next" /></button>
    <label className="z3-transport-scrubber" htmlFor={`${id}-range`}><span className="sr-only">{label}</span>
      <input id={`${id}-range`} type="range" min={min} max={max} step={1} value={index} onChange={event => onChange(Number(event.target.value))} aria-valuetext={valueText} />
    </label>
    <output className="z3-transport-counter" htmlFor={`${id}-range`}>{counter}</output>
  </div>
}

export function useFigureRef() {
  return useRef<HTMLElement | null>(null)
}
