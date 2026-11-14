import { useEffect, useMemo, useState } from 'react'
import type { BookUi } from './ollamaEvidence'
import { MiniMarkdown } from './miniMarkdown'
import './writing-arena.css'

type Task = { id: string; title: string; route: string; kind: string; words: number; source: string }
type Model = { id: string; name: string; lab: string; settings: { think: boolean | string; num_predict: number; num_ctx: number; temperature: number } | null }
type Entry = { task: string; model: string; outcome: string; words: number; output_tokens: number | null; thinking_chars: number; elapsed_seconds: number; quantization: string | null; output: string }
type Index = { schema_version: number; captured_utc: string; prompt_template: string; models: Model[]; tasks: Task[]; entries: Entry[] }
/** A writer is the current page or one model's rewrite of it. */
type Writer = { key: string; name: string; lab: string; path: string | null; entry: Entry | null; alias: string }

const base = `${import.meta.env.BASE_URL}evidence/writing-arena/`
const safePath = (path: string) => /^[a-zA-Z0-9_./-]+$/.test(path) && !path.startsWith('/') && !path.split('/').includes('..')
const PICKS = 'queens-writing-arena-picks'
const OUTCOME: Record<string, string> = { truncated: 'Cut off at the token budget', empty: 'Returned no page', error: 'The request failed', model_mismatch: 'Wrong model answered' }

function isIndex(value: unknown): value is Index {
  const data = value as Index
  return !!data && data.schema_version === 1 && Array.isArray(data.tasks) && data.tasks.length > 0 && Array.isArray(data.models) && Array.isArray(data.entries)
    && data.tasks.every(task => /^[a-z0-9-]+$/.test(task.id) && safePath(task.source)) && data.entries.every(entry => safePath(entry.output))
}

/** A stable shuffle per page, so "Writer C" is the same writer on every visit but differs between pages. */
function shuffled<T>(items: T[], seed: string): T[] {
  let state = [...seed].reduce((hash, char) => (hash * 31 + char.charCodeAt(0)) >>> 0, 7)
  const next = () => (state = (state * 1664525 + 1013904223) >>> 0) / 2 ** 32
  const out = [...items]
  for (let i = out.length - 1; i > 0; i--) { const j = Math.floor(next() * (i + 1));[out[i], out[j]] = [out[j], out[i]] }
  return out
}

/** How many panes fit side by side: one on phones, two on laptops, three on wide screens. */
function usePaneCount() {
  const count = () => typeof window === 'undefined' ? 2 : window.innerWidth >= 1700 ? 3 : window.innerWidth >= 1000 ? 2 : 1
  const [panes, setPanes] = useState(count)
  useEffect(() => {
    const update = () => setPanes(count())
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])
  return panes
}

/** Fetch one Markdown file once and keep it for the session. */
const cache = new Map<string, Promise<string>>()
function useText(path: string | null) {
  const [state, setState] = useState<{ path: string | null; text: string | null; failed: boolean }>({ path, text: null, failed: false })
  useEffect(() => {
    if (!path) { setState({ path, text: null, failed: false }); return }
    let live = true
    if (!cache.has(path)) cache.set(path, fetch(base + path).then(response => { if (!response.ok) throw new Error(path); return response.text() }))
    cache.get(path)!.then(text => { if (live) setState({ path, text, failed: false }) }).catch(() => { cache.delete(path); if (live) setState({ path, text: null, failed: true }) })
    return () => { live = false }
  }, [path])
  return state.path === path ? state : { path, text: null, failed: false }
}

function Pane({ writer, writers, blind, onChoose, picked, onPick, sourceWords, selectable }: {
  writer: Writer; writers: Writer[]; blind: boolean; onChoose: (key: string) => void; picked: boolean; onPick: () => void; sourceWords: number; selectable: boolean
}) {
  const { text, failed } = useText(writer.path)
  const label = (item: Writer) => blind ? item.alias : item.name
  const entry = writer.entry
  const words = entry ? entry.words : writer.key === 'current' ? sourceWords : null
  return <article className="wa-pane" aria-label={label(writer)}>
    <header className="wa-pane-head">
      {selectable
        ? <label className="wa-pane-pick"><span className="sr-only">Writer in this pane</span>
          <select value={writer.key} onChange={event => onChoose(event.target.value)}>{writers.map(item => <option key={item.key} value={item.key}>{label(item)}</option>)}</select></label>
        : <strong className="wa-pane-title">{label(writer)}</strong>}
      {!blind && writer.lab && <span className="wa-pane-lab">{writer.lab}</span>}
      <button type="button" className="wa-prefer" aria-pressed={picked} onClick={onPick} disabled={!writer.path}>{picked ? 'Your pick' : 'Prefer this'}</button>
    </header>
    <div className="wa-prose">
      {!writer.path ? <p className="wa-empty">Not run yet. The nightly job writes one page per model; this one is still waiting.</p>
        : failed ? <p className="wa-empty">This text could not be loaded. Reload the page to try again.</p>
          : text === null ? <p className="wa-empty" role="status">Loading…</p>
            : text.trim() ? <MiniMarkdown text={text} /> : <p className="wa-empty">{OUTCOME[entry?.outcome ?? ''] ?? 'Returned no page'}.</p>}
    </div>
    <footer className="wa-pane-foot">
      {words !== null && <span>{words.toLocaleString('en-US')} words{writer.key !== 'current' && sourceWords ? ` · ${Math.round(words / sourceWords * 100)}% of the original` : ''}</span>}
      {entry && entry.outcome !== 'ok' && <span className="wa-flag">{OUTCOME[entry.outcome] ?? entry.outcome}</span>}
      {!blind && entry && <span>{Math.round(entry.elapsed_seconds)} s{entry.output_tokens !== null ? ` · ${entry.output_tokens.toLocaleString('en-US')} tokens generated` : ''}{entry.thinking_chars ? ', thinking included' : ''}</span>}
    </footer>
  </article>
}

/** Side-by-side reading of the same page rewritten by each local model, with names hidden until revealed. */
export default function WritingArena({ ui, taskId }: { ui: BookUi; taskId?: string }) {
  const { PageHero } = ui
  const [index, setIndex] = useState<Index | null>(null)
  const [error, setError] = useState(false)
  const [blind, setBlind] = useState(true)
  const [chosen, setChosen] = useState<string[]>([])
  const [picks, setPicks] = useState<Record<string, string>>(() => { try { return JSON.parse(localStorage.getItem(PICKS) || '{}') } catch { return {} } })
  const paneCount = usePaneCount()

  useEffect(() => {
    const controller = new AbortController()
    fetch(base + 'index.json', { signal: controller.signal }).then(response => { if (!response.ok) throw new Error('index'); return response.json() })
      .then(value => { if (!isIndex(value)) throw new Error('shape'); setIndex(value) }).catch(() => { if (!controller.signal.aborted) setError(true) })
    return () => controller.abort()
  }, [])

  const task = index?.tasks.find(item => item.id === taskId) ?? index?.tasks[0] ?? null
  const writers = useMemo<Writer[]>(() => {
    if (!index || !task) return []
    const list: Omit<Writer, 'alias'>[] = [
      { key: 'current', name: 'Current page', lab: 'as published', path: task.source, entry: null },
      ...index.models.map(model => { const entry = index.entries.find(item => item.task === task.id && item.model === model.id) ?? null; return { key: model.id, name: model.name, lab: model.lab, path: entry?.output ?? null, entry } }),
    ]
    // Writers with a page come first, in an order that depends only on the page, so aliases never leak identity.
    const order = shuffled(list.filter(item => item.path), task.id)
    return [...order, ...list.filter(item => !item.path)].map((item, position) => ({ ...item, alias: `Writer ${String.fromCharCode(65 + position)}` }))
  }, [index, task])

  // Reset the panes when the page changes; keep them when only the pane count changes.
  useEffect(() => { setChosen([]) }, [task?.id])
  useEffect(() => { try { localStorage.setItem(PICKS, JSON.stringify(picks)) } catch { /* Private windows: picks last for this visit only. */ } }, [picks])

  if (error) return <><PageHero trail="Local open-weight models / writing arena" title="Writing arena" deck="The rewrites could not be loaded." /><main className="wa" id="main-content"><p role="status">Reload the page, or <a href={base + 'index.json'}>open the index</a> directly.</p></main></>
  if (!index || !task) return <><PageHero trail="Local open-weight models / writing arena" title="Writing arena" deck="Loading the rewrites…" /><main className="wa" id="main-content"><p role="status">Loading…</p></main></>

  const ready = writers.filter(writer => writer.path)
  const shown = Array.from({ length: Math.min(paneCount, Math.max(1, ready.length)) }, (_, slot) => {
    const key = chosen[slot]
    return writers.find(writer => writer.key === key) ?? ready[slot % ready.length]
  })
  const choose = (slot: number, key: string) => setChosen(current => { const next = shown.map(writer => writer.key); next[slot] = key; return current.length === next.length && current.every((value, i) => value === next[i]) ? current : next })
  const single = paneCount === 1
  const position = ready.findIndex(writer => writer.key === shown[0].key)
  const step = (delta: number) => choose(0, ready[(position + delta + ready.length) % ready.length].key)
  const label = (writer: Writer) => blind ? writer.alias : writer.name
  const pick = (key: string) => setPicks(current => { const next = { ...current }; if (next[task.id] === key) delete next[task.id]; else next[task.id] = key; return next })
  const done = index.entries.length, planned = index.tasks.length * index.models.length
  const tally = index.tasks.map(item => ({ item, key: picks[item.id] })).filter(row => row.key)

  return <>
    <PageHero trail="Local open-weight models / writing arena" title="The same page, rewritten by each local model." deck="Six open-weight models running on our own computer each rewrote five pages of this book once, from one fixed instruction. Read them next to the published page and decide which you would keep." />
    <main className="wa" id="main-content">
      <div className="wa-controls">
        <div className="wa-tabs" role="tablist" aria-label="Page to compare">
          {index.tasks.map(item => <a key={item.id} role="tab" aria-selected={item.id === task.id} href={`#/writing-arena/${item.id}`}>{item.title}</a>)}
        </div>
        <label className="wa-blind"><input type="checkbox" checked={!blind} onChange={event => setBlind(!event.target.checked)} /> Show who wrote each one</label>
      </div>
      <p className="wa-about">{task.kind}. {task.words.toLocaleString('en-US')} words as published. <a href={`#/${task.route}`}>Open the live page</a> · <a href={base + index.prompt_template}>the instruction every model received</a>. {done < planned && `${done} of ${planned} rewrites are recorded so far; the rest run on later nights.`}</p>

      {single && <nav className="wa-pager" aria-label="Writers">
        <button type="button" onClick={() => step(-1)} aria-label="Previous writer">‹ Prev</button>
        <div className="wa-pager-tabs" role="tablist" aria-label="Writer">
          {ready.map(writer => <button key={writer.key} type="button" role="tab" aria-selected={writer.key === shown[0].key} onClick={() => choose(0, writer.key)}>{label(writer).replace('Writer ', '')}{picks[task.id] === writer.key ? ' ★' : ''}</button>)}
        </div>
        <button type="button" onClick={() => step(1)} aria-label="Next writer">Next ›</button>
      </nav>}
      {single && <p className="wa-count" role="status">{label(shown[0])} · {position + 1} of {ready.length}</p>}

      <div className="wa-panes" style={{ gridTemplateColumns: `repeat(${shown.length}, minmax(0, 1fr))` }}>
        {shown.map((writer, slot) => <Pane key={slot} writer={writer} writers={writers} blind={blind} selectable={!single} sourceWords={task.words}
          onChoose={key => choose(slot, key)} picked={picks[task.id] === writer.key} onPick={() => pick(writer.key)} />)}
      </div>

      <section className="wa-notes" aria-labelledby="wa-notes-title">
        <h2 id="wa-notes-title">How to read this</h2>
        <p>Names are hidden by default and the writers are shuffled differently on each page, the published page among them. “Prefer this” records your pick for a page in this browser only. Tick “Show who wrote each one” to see the model behind each writer, how long it took and how many tokens it generated.</p>
        <p>Every model received the same instruction and the page as readers see it. Each ran once, with no retry and no editing: a rewrite that was cut off, came back empty or changed the facts is shown as it is. This is a reading exercise, not a scored benchmark, and one sample per model says little about how it writes in general.</p>
        {tally.length > 0 && <>
          <h3>Your picks</h3>
          <ul className="wa-tally">{tally.map(({ item, key }) => {
            const name = key === 'current' ? 'Current page' : index.models.find(model => model.id === key)?.name ?? key
            return <li key={item.id}><a href={`#/writing-arena/${item.id}`}>{item.title}</a>: {blind ? 'picked (reveal names to see who)' : name}</li>
          })}</ul>
          <button type="button" className="wa-clear" onClick={() => setPicks({})}>Clear my picks</button>
        </>}
        {!blind && <details className="wa-settings"><summary>Models and settings</summary>
          <ul>{index.models.map(model => <li key={model.id}><strong>{model.name}</strong> ({model.lab}) · <code>{model.id}</code>{model.settings ? ` · thinking ${model.settings.think === true ? 'on' : model.settings.think === false ? 'off' : model.settings.think} · up to ${model.settings.num_predict.toLocaleString('en-US')} tokens · temperature ${model.settings.temperature}` : ' · not run yet'}</li>)}</ul>
          <p>Snapshot captured {index.captured_utc.slice(0, 10)} UTC.</p>
        </details>}
      </section>
    </main>
  </>
}
