/**
 * Integration scenarios for useSharedJson (src/sharedJson.ts) with the real React 18 renderer in a browser.
 * fetch is scripted per URL, so each scenario controls when, and whether, a file arrives.
 * Run through scripts/test-shared-json-hook.cjs (npm run test:shared-json-hook).
 */
import { StrictMode, useState } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { clearSharedJson, useSharedJson, type JsonResource } from '../../src/sharedJson'

type Payload = { ok: 1; label: string }
type Pending = { resolve: (status: number, body?: unknown) => void }
const calls: string[] = []
const pending = new Map<string, Pending[]>()
window.fetch = ((input: RequestInfo | URL) => new Promise<Response>(resolve => {
  const url = String(input)
  calls.push(url)
  const queue = pending.get(url) ?? []
  queue.push({ resolve: (status, body) => resolve(new Response(JSON.stringify(body ?? {}), { status })) })
  pending.set(url, queue)
})) as typeof fetch
const reply = (url: string, status: number, body?: unknown) => {
  const next = pending.get(url)?.shift()
  if (!next) throw new Error(`no pending request for ${url}`)
  next.resolve(status, body)
}
const resource = (url: string): JsonResource<Payload> => ({ url, validate: (value): value is Payload => (value as Payload)?.ok === 1 })
const resources = new Map<string, JsonResource<Payload>>()
const res = (url: string) => { if (!resources.has(url)) resources.set(url, resource(url)); return resources.get(url)! }

const seen = new WeakMap<object, number>()
let objectIds = 0
/** One reader: shows its state, the identity of the object it received, and a retry button on error. */
function Reader({ id, url }: { id: string; url: string }) {
  const state = useSharedJson(res(url))
  if (state.status === 'ready' && !seen.has(state.data)) seen.set(state.data, ++objectIds)
  return <p data-reader={id}>{state.status === 'ready' ? `ready ${state.data.label} #${seen.get(state.data)}` : state.status}
    {state.status === 'error' && <button data-retry={id} onClick={state.retry}>retry</button>}</p>
}

const settle = () => new Promise(resolve => setTimeout(resolve, 30))
const text = (id: string) => document.querySelector(`[data-reader="${id}"]`)?.firstChild?.textContent ?? '(unmounted)'
const count = (url: string) => calls.filter(call => call === url).length
type Result = { name: string; pass: boolean; detail: string }
const results: Result[] = []
const check = (name: string, pass: boolean, detail: string) => results.push({ name, pass, detail })

async function scenario(name: string, run: (root: Root, host: HTMLElement) => Promise<void>) {
  clearSharedJson(); calls.length = 0; pending.clear()
  const host = document.createElement('div'); document.body.append(host)
  const root = createRoot(host)
  try { await run(root, host) } catch (error) { check(name, false, String(error)) }
  root.unmount(); host.remove()
}

async function main() {
  await scenario('StrictMode: two readers share one fetch and one parsed object', async root => {
    root.render(<StrictMode><Reader id="a" url="/a.json" /><Reader id="b" url="/a.json" /></StrictMode>)
    await settle()
    reply('/a.json', 200, { ok: 1, label: 'A' }); await settle()
    check('StrictMode: two readers share one fetch and one parsed object', count('/a.json') === 1 && text('a') === text('b') && text('a').startsWith('ready A'), `fetches=${count('/a.json')} a="${text('a')}" b="${text('b')}"`)
  })

  await scenario('Unmounting one reader does not cancel its peer', async root => {
    function Pair() { const [both, setBoth] = useState(true); (window as unknown as { drop: () => void }).drop = () => setBoth(false); return <>{both && <Reader id="x" url="/b.json" />}<Reader id="y" url="/b.json" /></> }
    root.render(<StrictMode><Pair /></StrictMode>)
    await settle()
    ;(window as unknown as { drop: () => void }).drop(); await settle()
    reply('/b.json', 200, { ok: 1, label: 'B' }); await settle()
    check('Unmounting one reader does not cancel its peer', text('x') === '(unmounted)' && text('y').startsWith('ready B') && count('/b.json') === 1, `x="${text('x')}" y="${text('y')}" fetches=${count('/b.json')}`)
  })

  await scenario('URL change: a late reply for the old URL never shows', async root => {
    function Switcher() { const [url, setUrl] = useState('/c.json'); (window as unknown as { to: (u: string) => void }).to = setUrl; return <Reader id="s" url={url} /> }
    root.render(<StrictMode><Switcher /></StrictMode>)
    await settle()
    ;(window as unknown as { to: (u: string) => void }).to('/d.json'); await settle()
    reply('/d.json', 200, { ok: 1, label: 'D' }); await settle()
    reply('/c.json', 200, { ok: 1, label: 'C' }); await settle()
    check('URL change: a late reply for the old URL never shows', text('s').startsWith('ready D'), `s="${text('s')}"`)
  })

  await scenario('One reader retrying recovers every mounted peer', async root => {
    root.render(<StrictMode><Reader id="p" url="/e.json" /><Reader id="q" url="/e.json" /></StrictMode>)
    await settle()
    reply('/e.json', 503); await settle()
    const failed = text('p') === 'error' && text('q') === 'error'
    document.querySelector<HTMLButtonElement>('[data-retry="p"]')?.click(); await settle()
    const refetched = count('/e.json') === 2
    reply('/e.json', 200, { ok: 1, label: 'E' }); await settle()
    check('One reader retrying recovers every mounted peer', failed && refetched && text('p').startsWith('ready E') && text('q').startsWith('ready E'), `failedFirst=${failed} fetches=${count('/e.json')} p="${text('p')}" q="${text('q')}"`)
  })

  await scenario('An invalid payload is an error, not data, and is not cached', async root => {
    root.render(<Reader id="v" url="/f.json" />)
    await settle()
    reply('/f.json', 200, { ok: 0 }); await settle()
    const invalid = text('v') === 'error'
    document.querySelector<HTMLButtonElement>('[data-retry="v"]')?.click(); await settle()
    reply('/f.json', 200, { ok: 1, label: 'F' }); await settle()
    check('An invalid payload is an error, not data, and is not cached', invalid && text('v').startsWith('ready F') && count('/f.json') === 2, `invalidShownAsError=${invalid} v="${text('v')}" fetches=${count('/f.json')}`)
  })

  ;(window as unknown as { __results: Result[] }).__results = results
}
main()
