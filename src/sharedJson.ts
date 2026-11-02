import { useCallback, useEffect, useState } from 'react'

/**
 * One owner for saved JSON evidence that several components read (the scoreboard, local tariffs).
 *
 * - Concurrent callers share one in-flight request and one validated, parsed result per URL.
 * - The shared request has no consumer-owned AbortController, so one component unmounting never
 *   cancels another's data. Components ignore late results themselves.
 * - A failed or invalid response is evicted at once, so a later call (an explicit retry or a new
 *   mount) fetches again. Failures are never cached and never retried automatically.
 * - Only settled successes stay cached, at most MAX_ENTRIES of them, oldest evicted first. The files
 *   are immutable for a page load, so one load never mixes two versions of a file on one screen.
 *
 * Only same-origin saved artifacts under BASE_URL are loaded; this never calls a model endpoint.
 */
export type Validate<T> = (value: unknown) => value is T
/** A saved file and the one guard every consumer of it shares. */
export type JsonResource<T> = { url: string; validate: Validate<T> }

const MAX_ENTRIES = 16
const cache = new Map<string, Promise<unknown>>()
/** Settled successes, so a consumer mounting after the first load renders at once instead of flashing "Loading…". */
const settled = new Map<string, unknown>()

export function loadSharedJson<T>({ url, validate }: JsonResource<T>): Promise<T> {
  const cached = cache.get(url)
  if (cached) return cached as Promise<T>
  const request = fetch(url)
    .then(response => { if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`); return response.json() as Promise<unknown> })
    .then(value => { if (!validate(value)) throw new Error(`${url}: unexpected shape`); if (cache.get(url) === request) settled.set(url, value); return value })
  cache.set(url, request)
  request.catch(() => { if (cache.get(url) === request) cache.delete(url) })
  while (cache.size > MAX_ENTRIES) { const oldest = cache.keys().next().value as string; cache.delete(oldest); settled.delete(oldest) }
  return request
}

/** Test hook: forget every cached response. */
export function clearSharedJson() { cache.clear(); settled.clear() }

const initial = <T,>(url: string): SharedJson<T> => settled.has(url) ? { status: 'ready', data: settled.get(url) as T } : { status: 'loading' }

export type SharedJson<T> = { status: 'loading' } | { status: 'error'; retry: () => void } | { status: 'ready'; data: T }

/** React view of loadSharedJson. A stale completion (after unmount or a URL change) is ignored. */
export function useSharedJson<T>(resource: JsonResource<T>): SharedJson<T> {
  const { url } = resource
  const [attempt, setAttempt] = useState(0)
  const [state, setState] = useState<{ url: string; result: SharedJson<T> }>(() => ({ url, result: initial<T>(url) }))
  const retry = useCallback(() => setAttempt(value => value + 1), [])
  useEffect(() => {
    let current = true
    setState(previous => previous.url === url && previous.result.status !== 'error' ? previous : { url, result: initial<T>(url) })
    loadSharedJson(resource).then(
      data => { if (current) setState({ url, result: { status: 'ready', data } }) },
      () => { if (current) setState({ url, result: { status: 'error', retry } }) },
    )
    return () => { current = false }
  // Resources are module-level constants; the URL and an explicit retry decide reloads.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, attempt, retry])
  return state.url === url ? state.result : initial<T>(url)
}
