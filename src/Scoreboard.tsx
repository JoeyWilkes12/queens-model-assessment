import { useEffect, useRef, useState, type ReactNode } from 'react'
import './scoreboard.css'

type Outcome = 'strict' | 'format_only' | 'wrong' | 'no_answer'
type LlmModel = { id: string; name: string; author: string; logo: string; cohort: 'frontier' | 'earlier'; study: string; boards: Record<string, { issued: number; outcome: Outcome; receipt: string }>; notes: string[] }
type ModeCounts = { raw: [number, number]; local: [number, number] }
type DecisionModel = { name: string; author: string; logo: string; study: string; per_board: Record<string, ModeCounts>; calls: number; attempts_per_board_mode: number }
type DecisionSet = {
  label: string
  status?: string
  boards: { id: string; size: number }[]
  models: DecisionModel[]
  baselines: { greedy: Record<string, boolean>; random_expected_any: Record<string, number> }
  pending: { name: string; author: string; logo: string; reason: string }[]
}
type ScoreboardData = {
  generated_utc: string
  llm: { boards: number[]; models: LlmModel[]; not_run: { name: string; author: string; logo: string; reason: string }[] }
  decision: { original: DecisionSet; panel: DecisionSet }
}

type Row = {
  key: string
  name: string
  author?: string
  logo?: string
  solid: number
  hatched: number
  denominator: number
  label: string
  kind: 'model' | 'baseline' | 'pending'
  detail: string
}

const evidenceUrl = (path: string) => `${import.meta.env.BASE_URL}${path}`
const tabs = [{ key: 'all', label: 'All boards' }, { key: '5', label: '5×5' }, { key: '7', label: '7×7' }, { key: '9', label: '9×9' }] as const
type TabKey = (typeof tabs)[number]['key']

function useWidth<T extends HTMLElement>(fallback: number) {
  const ref = useRef<T>(null)
  const [width, setWidth] = useState(fallback)
  useEffect(() => {
    const element = ref.current
    if (!element) return
    const measure = () => setWidth(element.getBoundingClientRect().width)
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(element)
    return () => observer.disconnect()
  }, [])
  return [ref, width] as const
}

function LogoTile({ logo, author }: { logo?: string; author?: string }) {
  if (!logo) return <span className="sb-logo sb-logo--none" aria-hidden="true">∅</span>
  return <span className="sb-logo"><img src={evidenceUrl(logo)} alt={author ? `${author} logo` : ''} width={20} height={20} loading="lazy" /></span>
}

function Tabs({ value, onChange, label }: { value: TabKey; onChange: (key: TabKey) => void; label: string }) {
  return <div className="sb-tabs" role="tablist" aria-label={label}>
    {tabs.map(tab => <button key={tab.key} type="button" role="tab" aria-selected={value === tab.key} className={value === tab.key ? 'is-active' : ''} onClick={() => onChange(tab.key)}>{tab.label}</button>)}
  </div>
}

/** Artificial Analysis-style columns on wide containers; labelled rows on phones. */
function EvalBars({ rows, unit }: { rows: Row[]; unit: string }) {
  const [ref, width] = useWidth<HTMLDivElement>(700)
  const vertical = width >= 560 && rows.length <= 9
  const max = Math.max(1, ...rows.map(row => row.denominator))
  return <div ref={ref} className={`sb-bars ${vertical ? 'sb-bars--columns' : 'sb-bars--rows'}`} role="list" aria-label={unit}>
    {rows.map(row => {
      const solidPct = row.solid / max * 100
      const hatchedPct = row.hatched / max * 100
      return <div key={row.key} role="listitem" className={`sb-item sb-item--${row.kind}`} title={row.detail} aria-label={`${row.name}: ${row.label}. ${row.detail}`}>
        {vertical ? <>
          <span className="sb-value">{row.label}</span>
          <span className="sb-track" aria-hidden="true">
            {row.kind === 'pending' ? <span className="sb-pending-text">Not yet tested</span> : <>
              <span className="sb-fill sb-fill--solid" style={{ height: `${solidPct}%` }} />
              <span className="sb-fill sb-fill--hatched" style={{ height: `${hatchedPct}%` }} />
            </>}
          </span>
          <LogoTile logo={row.logo} author={row.author} />
          <span className="sb-name">{row.name}</span>
        </> : <>
          <span className="sb-row-label"><LogoTile logo={row.logo} author={row.author} /><span className="sb-name">{row.name}</span></span>
          <span className="sb-track" aria-hidden="true">
            {row.kind === 'pending' ? <span className="sb-pending-text">Not yet tested</span> : <>
              <span className="sb-fill sb-fill--solid" style={{ width: `${solidPct}%` }} />
              <span className="sb-fill sb-fill--hatched" style={{ width: `${hatchedPct}%` }} />
            </>}
          </span>
          <span className="sb-value">{row.label}</span>
        </>}
      </div>
    })}
  </div>
}

function Legend({ items }: { items: { kind: 'solid' | 'hatched' | 'baseline' | 'pending'; label: string }[] }) {
  return <div className="sb-legend">{items.map(item => <span key={item.label}><span className={`sb-swatch sb-swatch--${item.kind}`} aria-hidden="true" />{item.label}</span>)}</div>
}

function llmRows(data: ScoreboardData['llm'], tab: TabKey, includeEarlier: boolean): Row[] {
  const sizes = tab === 'all' ? ['5', '7', '9'] : [tab]
  return data.models.filter(model => includeEarlier || model.cohort === 'frontier').map(model => {
    const outcomes = sizes.map(size => model.boards[size]?.outcome)
    const strict = outcomes.filter(value => value === 'strict').length
    const formatOnly = outcomes.filter(value => value === 'format_only').length
    const noAnswer = outcomes.filter(value => value === 'no_answer').length
    const issued = sizes.filter(size => model.boards[size]).length
    const parts = [`${strict} strict JSON`, formatOnly ? `${formatOnly} correct but off-format` : '', noAnswer ? `${noAnswer} timed out with no answer` : ''].filter(Boolean)
    return { key: model.id, name: model.name, author: model.author, logo: model.logo, solid: strict, hatched: formatOnly, denominator: issued, label: `${strict + formatOnly}/${issued}`, kind: 'model' as const,
      detail: `${parts.join(' · ')}. ${model.cohort === 'frontier' ? '17 Sep study' : '1 Oct earlier-generations replay'}.` }
  }).sort((a, b) => (b.solid + b.hatched) - (a.solid + a.hatched) || b.solid - a.solid || a.name.localeCompare(b.name))
}

function decisionRows(set: DecisionSet, tab: TabKey): Row[] {
  const boards = set.boards.filter(board => tab === 'all' || String(board.size) === tab)
  const ids = boards.map(board => board.id)
  const rows: Row[] = set.models.map(model => {
    let raw = 0, localOnly = 0
    for (const id of ids) {
      const cell = model.per_board[id]
      if (!cell) continue
      if (cell.raw[0] > 0) raw += 1
      else if (cell.local[0] > 0) localOnly += 1
    }
    const attempts = ids.reduce((sum, id) => sum + (model.per_board[id]?.raw[1] ?? 0) + (model.per_board[id]?.local[1] ?? 0), 0)
    const solvedAttempts = ids.reduce((sum, id) => sum + (model.per_board[id]?.raw[0] ?? 0) + (model.per_board[id]?.local[0] ?? 0), 0)
    return { key: model.name, name: model.name, author: model.author, logo: model.logo, solid: raw, hatched: localOnly, denominator: ids.length, label: `${raw + localOnly}/${ids.length}`, kind: 'model' as const,
      detail: `${raw} solved from the raw menu, ${localOnly} only with the conflict filter; ${solvedAttempts}/${attempts} attempts solved.` }
  })
  for (const pending of set.pending) rows.push({ key: pending.name, name: pending.name, author: pending.author, logo: pending.logo, solid: 0, hatched: 0, denominator: ids.length, label: '—', kind: 'pending', detail: pending.reason })
  const greedy = ids.filter(id => set.baselines.greedy[id]).length
  rows.push({ key: 'greedy', name: 'Greedy rule (no model)', solid: 0, hatched: greedy, denominator: ids.length, label: `${greedy}/${ids.length}`, kind: 'baseline', detail: 'Fewest-legal-cells color first, first legal cell, never backtracks. Uses the conflict filter.' })
  const random = ids.reduce((sum, id) => sum + (set.baselines.random_expected_any[id] ?? 0), 0)
  rows.push({ key: 'random', name: 'Random menu choice', solid: 0, hatched: random, denominator: ids.length, label: `≈${random < 10 ? random.toFixed(1) : Math.round(random)}`, kind: 'baseline', detail: 'Expected boards solved at least once by uniform random choices under the same protocol and attempt allowance.' })
  return rows
}

export function Scoreboard({ children }: { children?: ReactNode }) {
  const [data, setData] = useState<ScoreboardData | null>(null)
  const [error, setError] = useState(false)
  const [llmTab, setLlmTab] = useState<TabKey>('all')
  const [decisionTab, setDecisionTab] = useState<TabKey>('all')
  const [includeEarlier, setIncludeEarlier] = useState(false)
  const [boardSet, setBoardSet] = useState<'original' | 'panel'>('original')

  useEffect(() => {
    const controller = new AbortController()
    fetch(evidenceUrl('evidence/scoreboard.json'), { signal: controller.signal })
      .then(response => { if (!response.ok) throw new Error('unavailable'); return response.json() as Promise<ScoreboardData> })
      .then(setData)
      .catch(() => { if (!controller.signal.aborted) setError(true) })
    return () => controller.abort()
  }, [])

  if (error) return <p role="status">The saved scoreboard could not be loaded. No scores are substituted.</p>
  if (!data) return <p role="status">Loading the saved scoreboard…</p>

  const llm = llmRows(data.llm, llmTab, includeEarlier)
  const frontierCount = data.llm.models.filter(model => model.cohort === 'frontier').length
  const set = data.decision[boardSet]
  const panelReady = data.decision.panel.models.length > 0
  const decision = decisionRows(set, decisionTab)
  const decisionBoards = set.boards.filter(board => decisionTab === 'all' || String(board.size) === decisionTab).length
  const timeouts = data.llm.models.flatMap(model => model.notes.filter(note => note.includes('timed out')).map(note => `${model.name}, ${note}`))

  return <div className="scoreboard">
    <figure className="sb-chart" aria-labelledby="sb-llm-title">
      <figcaption>
        <span className="sb-kicker">Construction from a blank image</span>
        <strong id="sb-llm-title">Reasoning language models: boards solved</strong>
        <span>Each model received the same {llmTab === 'all' ? 'three boards' : 'board'} as one image, with one request and no retries, and had to write the complete placement.</span>
      </figcaption>
      <div className="sb-controls">
        <Tabs value={llmTab} onChange={setLlmTab} label="Board size, language models" />
        <label className="sb-toggle"><input type="checkbox" checked={includeEarlier} onChange={event => setIncludeEarlier(event.target.checked)} /> Include earlier generations</label>
      </div>
      <Legend items={[{ kind: 'solid', label: 'Correct, strict JSON' }, { kind: 'hatched', label: 'Correct placement, broke the JSON-only format' }]} />
      <EvalBars rows={llm} unit="Boards with a correct full placement" />
      <details className="sb-coverage">
        <summary>Test coverage: {includeEarlier ? data.llm.models.length : frontierCount} models × {llmTab === 'all' ? 3 : 1} {llmTab === 'all' ? 'boards' : 'board'}, identical for every model shown</summary>
        <ul>
          <li>One request per model and board, the same image and prompt, no tools, no repair turns, no retries.</li>
          {timeouts.map(note => <li key={note}><strong>Needs a re-run:</strong> {note} It is counted as unsolved here.</li>)}
          {includeEarlier && <li><strong>Scheduled but not run ({data.llm.not_run.length}):</strong> {data.llm.not_run.map(model => model.name).join(', ')}. The adaptive replay stopped those families early; they had no tests and are not shown.</li>}
          <li>Re-runs, and the unrun models, need the OpenRouter key, which is not available on this device yet. They will be reported as new dated runs, not merged silently.</li>
          <li><a href="#/protocol-results">Protocol and results</a> · <a href="#/earlier-generations">Earlier generations</a> · <a href={evidenceUrl('evidence/scoreboard.json')} download>Scoreboard data (JSON)</a></li>
        </ul>
      </details>
    </figure>

    {children}

    <figure className="sb-chart" aria-labelledby="sb-decision-title">
      <figcaption>
        <span className="sb-kicker">Construction one decision at a time</span>
        <strong id="sb-decision-title">Decision models: boards solved from an empty board</strong>
        <span>The harness offered a menu of colors, then of cells; the model chose one option per call, with no backtracking.</span>
      </figcaption>
      <div className="sb-controls">
        <Tabs value={decisionTab} onChange={setDecisionTab} label="Board size, decision models" />
        <div className="sb-segment" role="group" aria-label="Board set">
          <button type="button" aria-pressed={boardSet === 'original'} onClick={() => setBoardSet('original')}>Original 9 boards</button>
          <button type="button" aria-pressed={boardSet === 'panel'} onClick={() => setBoardSet('panel')}>New 192-board panel</button>
        </div>
      </div>
      <Legend items={[{ kind: 'solid', label: 'Solved from the raw menu' }, { kind: 'hatched', label: 'Solved only with the conflict filter' }, { kind: 'baseline', label: 'No-model baseline' }, { kind: 'pending', label: 'Not yet tested' }]} />
      {boardSet === 'panel' && !panelReady ? <p className="sb-note" role="status">The new-board panel is still running. Results appear here when its receipts are complete.</p>
        : <EvalBars rows={decision} unit="Boards solved from an empty board" />}
      <details className="sb-coverage">
        <summary>Test coverage: {decisionBoards} {decisionBoards === 1 ? 'board' : 'boards'}, {set.models[0]?.attempts_per_board_mode ?? '—'} raw + {set.models[0]?.attempts_per_board_mode ?? '—'} filtered {set.models[0]?.attempts_per_board_mode === 1 ? 'attempt' : 'attempts'} per board</summary>
        <ul>
          {boardSet === 'original' ? <>
            <li>Jev 1.13 and SubQ Snap received the same nine boards, protocol and menus: five raw and five filtered attempts per board, 90 attempts each. A board counts as solved if any attempt solved it.</li>
            <li>Model calls: {set.models.map(model => `${model.name} ${model.calls}`).join(', ')}. Single-option menus were forced by the harness and made no call.</li>
          </> : <>
            <li>192 new, independently certified boards (64 per size, stratified by singleton regions and search difficulty), with one raw and one filtered attempt each, preregistered before any call.</li>
            {set.models.map(model => <li key={model.name}>{model.name}: {model.calls} model calls.</li>)}
            {set.pending.map(model => <li key={model.name}><strong>{model.name} not yet tested:</strong> {model.reason} Until then this panel is not a like-for-like comparison.</li>)}
          </>}
          <li>Baselines use the same boards: the greedy rule is deterministic; the random value is an exact expectation, not a run.</li>
          <li><a href="#/methods-critique">Methods critique</a> · <a href="#/subq-assessment">SubQ chapter</a> · <a href="#/jev-trajectories">Jev trajectories</a></li>
        </ul>
      </details>
    </figure>
  </div>
}
