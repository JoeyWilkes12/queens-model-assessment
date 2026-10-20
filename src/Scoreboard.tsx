import { useEffect, useRef, useState, type ReactNode } from 'react'
import './scoreboard.css'

type Outcome = 'strict' | 'format_only' | 'wrong' | 'no_answer' | 'truncated'
/** Non-graded API spend behind a chart entry: re-runs, probes, diagnostics; by board size, plus requests tied to no board. */
type OtherSpend = { by_size: Record<string, number>; unsized: number; requests: number; unknown: number; studies: string[] }
type LlmModel = { id: string; name: string; author: string; logo: string; cohort: 'frontier' | 'earlier'; study: string; boards: Record<string, { issued: number; outcome: Outcome; receipt: string; cost_usd?: number | null }>; notes: string[]; rerun?: { size: string; outcome: Outcome; date: string; receipt: string }; other_spend?: OtherSpend | null }
type LlmPanel = { status: string; study?: string; earlier_study?: string | null; retired?: { name: string; reason: string }[]; reruns?: { model: string; size: number; board_id: string; outcome: Outcome; reason: string; receipt: string }[]; boards: { id: string; size: number }[]; models: { id: string; name: string; author: string; logo: string; route: string; cohort?: 'frontier' | 'earlier'; study?: string; boards: Record<string, Outcome | 'not_run'>; costs?: Record<string, number | null>; other_spend?: OtherSpend | null }[] }
type ModeCounts = { raw: [number, number]; local: [number, number] }
type DecisionModel = { name: string; author: string; logo: string; study: string; per_board: Record<string, ModeCounts>; calls: number; attempts_per_board_mode: number; costs?: Record<string, number | null> | null; other_spend?: OtherSpend | null; cost_note?: string | null }
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
  llm: { boards: number[]; models: LlmModel[]; not_run: { name: string; author: string; logo: string; reason: string }[]; panel?: LlmPanel }
  decision: { original: DecisionSet; panel: DecisionSet }
  costs?: { total_usd: number; unknown_receipts: number }
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
  /** API cost per graded board in the shared comparison; null for baselines or unavailable costs. */
  cost: Cost | null
  /** Every recorded request on the selected sizes, including boards outside the shared comparison. */
  spend: Spend | null
  /** Boards solved and boards graded (for the random baseline, the expected number solved). */
  solved: number
  graded: number
  completed: number
  planned: number
  costNote?: string
}

type Cost = { total: number; perBoard: number | null; boards: number; unknown: number }
type Spend = { graded: number; other: number; unknown: number }
type SortKey = 'performance' | 'cost' | 'perBoard'

/** undefined = no receipt for that board, null = cost unknown (timeout), number = USD. */
function summarizeCost(values: (number | null | undefined)[]): Cost {
  const known = values.filter((value): value is number => typeof value === 'number')
  const total = known.reduce((sum, value) => sum + value, 0)
  return { total, perBoard: known.length ? total / known.length : null, boards: known.length, unknown: values.filter(value => value === null).length }
}

const usd = (value: number) => value >= 1 ? `$${value.toFixed(2)}` : value >= 0.01 ? `$${value.toFixed(3)}` : `$${value.toFixed(4)}`
const costText = (cost: Cost | null, note?: string) => {
  if (!cost) return note ?? 'No API cost'
  if (cost.perBoard === null) return cost.unknown ? `cost unknown (${cost.unknown} with no generation ID)` : 'no receipts yet'
  return `${usd(cost.perBoard)} per board · ${usd(cost.total)} for ${cost.boards} ${cost.boards === 1 ? 'board' : 'boards'}${cost.unknown ? ` · ${cost.unknown} more with unknown cost (no generation ID)` : ''}`
}

const spendTotal = (row: Row) => row.spend ? row.spend.graded + row.spend.other : null

/** Sorting only changes row order; baselines and pending rows stay after the compared models. */
function sortRows(rows: Row[], key: SortKey): Row[] {
  const models = rows.filter(row => row.kind === 'model')
  const rest = rows.filter(row => row.kind !== 'model')
  if (key === 'performance') return [...models.sort((a, b) => b.solved - a.solved || b.solid - a.solid || a.name.localeCompare(b.name)), ...rest]
  const value = (row: Row) => (key === 'cost' ? spendTotal(row) : row.cost?.perBoard) ?? -1
  return [...models.sort((a, b) => value(b) - value(a) || a.name.localeCompare(b.name)), ...rest]
}

/** The boards every active model has a graded result for, then the same number at each size
    (the first in board order), so each bar counts the same samples. */
function commonBoards<B extends { id: string; size: number }>(boards: B[], graded: ((id: string) => boolean)[]): B[] {
  if (!graded.length || !boards.length) return []
  const common = boards.filter(board => graded.every(test => test(board.id)))
  const sizes = [...new Set(boards.map(board => board.size))]
  const perSize = Math.min(...sizes.map(size => common.filter(board => board.size === size).length))
  return sizes.flatMap(size => common.filter(board => board.size === size).slice(0, perSize))
}

/** All scored requests on the selected sizes plus re-runs, probes and diagnostics; board-less requests only under All boards. */
function spendOf(costs: (number | null | undefined)[], other: OtherSpend | null | undefined, sizes: string[], all: boolean): Spend | null {
  const graded = summarizeCost(costs)
  const extra = other ? sizes.reduce((sum, size) => sum + (other.by_size[size] ?? 0), 0) + (all ? other.unsized : 0) : 0
  const unknown = graded.unknown + (all && other ? other.unknown : 0)
  return graded.boards || unknown || extra ? { graded: graded.total, other: extra, unknown } : null
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

/** Distinguish zero API use, unrun models and unavailable billing. */
const noSpendText = (row: Row) => row.kind === 'baseline' ? 'No API calls' : row.kind === 'pending' ? 'Not yet tested' : row.costNote ? 'Not billed through OpenRouter' : 'Spend unavailable'

/** Total spend has its own scale; per-board cost uses only the graded comparison requests. */
function SpendMark({ row, max }: { row: Row; max: number }) {
  const total = spendTotal(row)
  const per = row.cost?.perBoard ?? null
  return <span className="sb-cost" aria-hidden="true">
    <span className="sb-cost-track">
      {row.spend && <>
        <span className="sb-cost-fill sb-fill--spend" style={{ width: `${row.spend.graded / max * 100}%` }} />
        <span className="sb-cost-fill sb-fill--spend-other" style={{ width: `${row.spend.other / max * 100}%` }} />
      </>}
    </span>
    <span className="sb-cost-label">
      <span className="sb-nowrap">{total === null ? row.kind === 'baseline' ? '$0 total' : noSpendText(row) : `${row.spend?.unknown ? '≥ ' : ''}${usd(total)} total`}</span>
      <span className="sb-cost-per-board">{per !== null ? `${usd(per)}/graded board` : row.kind === 'baseline' ? 'No API calls' : row.cost?.unknown ? 'Graded cost unknown' : 'No graded cost yet'}{row.cost?.unknown && per !== null ? ` · ${row.cost.unknown} unknown` : ''}</span>
      {!!row.spend?.unknown && <span className="sb-cost-per-board">{row.spend.unknown} {row.spend.unknown === 1 ? 'request' : 'requests'} with unknown cost</span>}
    </span>
  </span>
}

/** Outcome bars and API spend remain visible together; sorting never changes either metric. */
function EvalBars({ rows, unit }: { rows: Row[]; unit: string }) {
  const [ref, width] = useWidth<HTMLDivElement>(700)
  const vertical = width >= 560 && rows.length <= 9
  const max = Math.max(1, ...rows.map(row => row.denominator))
  const spendMax = Math.max(0.000001, ...rows.map(row => spendTotal(row) ?? 0))
  // The wide row grid follows the chart's own width, so the secondary column never squeezes the main track.
  return <div ref={ref} className={`sb-bars ${vertical ? 'sb-bars--columns' : 'sb-bars--rows'}${!vertical && width >= 640 ? ' sb-bars--wide' : ''}`} role="list" aria-label={unit}>
    {rows.map(row => {
      const firstPct = row.solid / max * 100
      const secondPct = row.hatched / max * 100
      const empty = row.kind === 'pending' ? 'Not yet tested' : !row.graded ? 'No comparable results yet' : null
      const costLine = row.kind === 'model' ? ` Cost: ${costText(row.cost, row.costNote)}.` : ''
      const spendLine = row.spend ? ` API spend ${usd(row.spend.graded + row.spend.other)}: ${usd(row.spend.graded)} on graded requests${row.spend.other ? `, ${usd(row.spend.other)} on re-runs, probes and diagnostics` : ''}${row.spend.unknown ? `; ${row.spend.unknown} more with unknown cost` : ''}.` : ` ${noSpendText(row)}.`
      const progress = row.kind !== 'baseline' && row.completed < row.planned ? ` ${row.completed}/${row.planned} boards recorded.` : ''
      const summary = ` ${row.graded ? `${row.label} boards solved.` : empty + '.'} ${row.detail}${costLine}${spendLine}${progress}`
      const track = <span className="sb-track" aria-hidden="true">
        {empty ? <span className="sb-pending-text">{empty}</span> : <>
          <span className="sb-fill sb-fill--solid" style={vertical ? { height: `${firstPct}%` } : { width: `${firstPct}%` }} />
          <span className="sb-fill sb-fill--hatched" style={vertical ? { height: `${secondPct}%` } : { width: `${secondPct}%` }} />
        </>}
      </span>
      const value = <><span>{row.label}</span>{row.kind !== 'baseline' && row.completed < row.planned && <small className="sb-progress">{row.completed}/{row.planned} recorded</small>}</>
      const secondary = <SpendMark row={row} max={spendMax} />
      return <div key={row.key} role="listitem" className={`sb-item sb-item--${row.kind}${empty && row.kind !== 'pending' ? ' sb-item--empty' : ''}`} title={summary.trim()} aria-label={`${row.name}:${summary}`}>
        {vertical ? <>
          <span className="sb-value">{value}</span>
          {track}
          <LogoTile logo={row.logo} author={row.author} />
          <span className="sb-name">{row.name}</span>
          {secondary}
        </> : <>
          <span className="sb-row-label"><LogoTile logo={row.logo} author={row.author} /><span className="sb-name">{row.name}</span></span>
          {track}
          <span className="sb-value">{value}</span>
          {secondary}
        </>}
      </div>
    })}
  </div>
}

function Legend({ items }: { items: { kind: 'solid' | 'hatched' | 'baseline' | 'pending' | 'spend' | 'spend-other'; label: string }[] }) {
  return <div className="sb-legend">{items.map(item => <span key={item.label}><span className={`sb-swatch sb-swatch--${item.kind}`} aria-hidden="true" />{item.label}</span>)}</div>
}

function SortControl({ value, onChange, label }: { value: SortKey; onChange: (key: SortKey) => void; label: string }) {
  return <label className="sb-sort"><span>Sort by</span><select aria-label={label} value={value} onChange={event => onChange(event.target.value as SortKey)}>
    <option value="cost">Total spend, highest first</option>
    <option value="performance">Boards solved</option>
    <option value="perBoard">Cost per graded board, highest first</option>
  </select></label>
}

const SIZES = ['5', '7', '9']
const sizesFor = (tab: TabKey) => tab === 'all' ? SIZES : [tab]
const panelRecorded = (outcome: Outcome | 'not_run' | undefined) => (outcome ?? 'not_run') !== 'not_run'

/** Original-board results share a balanced sample; spend always includes each model's own requests. */
function llmRows(data: ScoreboardData['llm'], tab: TabKey, includeEarlier: boolean): Row[] {
  const models = data.models.filter(model => includeEarlier || model.cohort === 'frontier')
  const answered = models.filter(model => SIZES.some(size => !!model.boards[size]))
  const common = commonBoards(SIZES.map(size => ({ id: size, size: Number(size) })), answered.map(model => (size: string) => !!model.boards[size])).map(board => board.id)
  return models.map(model => {
    const own = sizesFor(tab).filter(size => !!model.boards[size])
    const sizes = common.filter(size => sizesFor(tab).includes(size) && !!model.boards[size])
    const outcomes = sizes.map(size => model.boards[size]?.outcome)
    const strict = outcomes.filter(value => value === 'strict').length
    const formatOnly = outcomes.filter(value => value === 'format_only').length
    const noAnswer = outcomes.filter(value => value === 'no_answer').length
    const issued = sizes.length
    const parts = issued ? [`${strict} strict JSON`, formatOnly ? `${formatOnly} correct but off-format` : '', noAnswer ? `${noAnswer} timed out with no answer` : ''].filter(Boolean) : ['No comparable results yet']
    const costs = sizes.map(size => model.boards[size].cost_usd)
    return { key: model.id, name: model.name, author: model.author, logo: model.logo, solid: strict, hatched: formatOnly, denominator: issued, label: issued ? `${strict + formatOnly}/${issued}` : '—', kind: own.length ? 'model' as const : 'pending' as const,
      detail: `${parts.join(' · ')}. ${model.cohort === 'frontier' ? '17 Sep study' : '1 Oct earlier-generations replay'}.`,
      cost: summarizeCost(costs), spend: spendOf(own.map(size => model.boards[size].cost_usd), model.other_spend, sizesFor(tab), tab === 'all'), solved: strict + formatOnly, graded: issued, completed: own.length, planned: sizesFor(tab).length }
  }).sort((a, b) => (b.solid + b.hatched) - (a.solid + a.hatched) || b.solid - a.solid || a.name.localeCompare(b.name))
}

/** Pending models stay visible, but do not prevent active models from sharing a comparison sample. */
function panelScope(panel: LlmPanel, includeEarlier: boolean) {
  const models = panel.models.filter(model => includeEarlier || model.cohort !== 'earlier')
  const answered = models.filter(model => panel.boards.some(board => panelRecorded(model.boards[board.id])))
  const common = commonBoards(panel.boards, answered.map(model => (id: string) => panelRecorded(model.boards[id])))
  return { models, answered, common, unanswered: models.filter(model => !answered.includes(model)) }
}

function llmPanelRows(panel: LlmPanel, tab: TabKey, includeEarlier: boolean): Row[] {
  const scope = panelScope(panel, includeEarlier)
  const selected = panel.boards.filter(board => tab === 'all' || String(board.size) === tab).map(board => board.id)
  const common = scope.common.filter(board => tab === 'all' || String(board.size) === tab).map(board => board.id)
  return scope.models.map(model => {
    const own = selected.filter(id => panelRecorded(model.boards[id]))
    const ids = common.filter(id => panelRecorded(model.boards[id]))
    const outcomes = ids.map(id => model.boards[id] ?? 'not_run')
    const strict = outcomes.filter(value => value === 'strict').length
    const formatOnly = outcomes.filter(value => value === 'format_only').length
    const noAnswer = outcomes.filter(value => value === 'no_answer').length
    const truncated = outcomes.filter(value => value === 'truncated').length
    const issued = ids.length
    const parts = issued ? [`${strict} strict JSON`, formatOnly ? `${formatOnly} correct but off-format` : '', truncated ? `${truncated} ran out of tokens` : '', noAnswer ? `${noAnswer} request failed before an answer` : ''].filter(Boolean) : ['No comparable results yet']
    const costs = ids.map(id => model.costs?.[id])
    return { key: model.id, name: model.name, author: model.author, logo: model.logo, solid: strict, hatched: formatOnly, denominator: ids.length,
      label: issued ? `${strict + formatOnly}/${issued}` : '—', kind: own.length ? 'model' as const : 'pending' as const, detail: `${parts.join(' · ')}. ${model.route === 'batch' ? 'Batch API' : 'On demand'}, ${model.cohort === 'earlier' ? '17–19 Oct earlier-generation panel' : '16 Oct panel'}.`,
      cost: summarizeCost(costs), spend: spendOf(own.map(id => model.costs?.[id]), model.other_spend, sizesFor(tab), tab === 'all'), solved: strict + formatOnly, graded: issued, completed: own.length, planned: selected.length }
  }).sort((a, b) => (b.solid + b.hatched) - (a.solid + a.hatched) || b.solid - a.solid || a.name.localeCompare(b.name))
}

/** Decision outcomes and baselines use the same balanced sample from models with recorded results. */
function decisionBoards(set: DecisionSet, tab: TabKey) {
  const answered = set.models.filter(model => set.boards.some(board => !!model.per_board[board.id]))
  const pool = commonBoards(set.boards, answered.map(model => (id: string) => !!model.per_board[id]))
  return pool.filter(board => tab === 'all' || String(board.size) === tab)
}

function decisionRows(set: DecisionSet, tab: TabKey): Row[] {
  const ids = decisionBoards(set, tab).map(board => board.id)
  const selected = set.boards.filter(board => tab === 'all' || String(board.size) === tab).map(board => board.id)
  const rows: Row[] = set.models.map(model => {
    const own = selected.filter(id => model.per_board[id])
    const mine = ids.filter(id => model.per_board[id])
    let raw = 0, localOnly = 0
    for (const id of mine) {
      const cell = model.per_board[id]
      if (cell.raw[0] > 0) raw += 1
      else if (cell.local[0] > 0) localOnly += 1
    }
    const attempts = mine.reduce((sum, id) => sum + model.per_board[id].raw[1] + model.per_board[id].local[1], 0)
    const solvedAttempts = mine.reduce((sum, id) => sum + model.per_board[id].raw[0] + model.per_board[id].local[0], 0)
    const costs = model.costs ? mine.map(id => model.costs?.[id]) : null
    return { key: model.name, name: model.name, author: model.author, logo: model.logo, solid: raw, hatched: localOnly, denominator: mine.length, label: mine.length ? `${raw + localOnly}/${mine.length}` : '—', kind: own.length ? 'model' as const : 'pending' as const,
      detail: mine.length ? `${raw} solved from the raw menu, ${localOnly} only with the conflict filter; ${solvedAttempts}/${attempts} attempts solved.` : 'No comparable results yet.',
      cost: costs ? summarizeCost(costs) : null, spend: model.costs ? spendOf(own.map(id => model.costs?.[id]), model.other_spend, sizesFor(tab), tab === 'all') : null,
      solved: raw + localOnly, graded: mine.length, completed: own.length, planned: selected.length, costNote: model.cost_note ?? undefined }
  })
  for (const pending of set.pending) rows.push({ key: pending.name, name: pending.name, author: pending.author, logo: pending.logo, solid: 0, hatched: 0, denominator: 0, label: '—', kind: 'pending', detail: pending.reason, cost: null, spend: null, solved: 0, graded: 0, completed: 0, planned: selected.length })
  const greedy = ids.filter(id => set.baselines.greedy[id]).length
  rows.push({ key: 'greedy', name: 'Greedy rule (no model)', solid: 0, hatched: greedy, denominator: ids.length, label: ids.length ? `${greedy}/${ids.length}` : '—', kind: 'baseline', detail: 'Fewest-legal-cells color first, first legal cell, never backtracks. Uses the conflict filter.', cost: null, spend: null, solved: greedy, graded: ids.length, completed: ids.length, planned: ids.length })
  const random = ids.reduce((sum, id) => sum + (set.baselines.random_expected_any[id] ?? 0), 0)
  rows.push({ key: 'random', name: 'Random menu choice', solid: 0, hatched: random, denominator: ids.length, label: ids.length ? `≈${random < 10 ? random.toFixed(1) : Math.round(random)}` : '—', kind: 'baseline', detail: 'Expected boards solved at least once by uniform random choices under the same protocol and attempt allowance.', cost: null, spend: null, solved: random, graded: ids.length, completed: ids.length, planned: ids.length })
  return rows
}

function CoverageNote({ rows }: { rows: Row[] }) {
  const models = rows.filter(row => row.kind !== 'baseline')
  const active = models.filter(row => row.completed > 0)
  const pending = models.filter(row => !row.completed)
  const shared = Math.max(0, ...active.map(row => row.graded))
  const planned = Math.max(0, ...models.map(row => row.planned))
  if (models.length && !pending.length && shared === planned) return null
  return <p className="sb-note" role="status">
    {shared ? `Results and graded cost compare ${active.length} tested models on ${shared} shared boards, balanced by size.` : 'No comparable results yet: there is no shared, balanced board sample at the selected sizes.'}
    {' '}Total spend still includes every request recorded on the selected sizes, including boards outside that comparison.
    {pending.length > 0 && <> No results recorded at these sizes: {pending.map(row => row.name).join(', ')}.</>}
  </p>
}

export function Scoreboard({ children }: { children?: ReactNode }) {
  const [data, setData] = useState<ScoreboardData | null>(null)
  const [error, setError] = useState(false)
  const [llmTab, setLlmTab] = useState<TabKey>('all')
  const [decisionTab, setDecisionTab] = useState<TabKey>('all')
  const [includeEarlier, setIncludeEarlier] = useState(false)
  const [requestedLlmSet, setLlmSet] = useState<'original' | 'panel'>('panel')
  const [boardSet, setBoardSet] = useState<'original' | 'panel'>('panel')
  const [llmSort, setLlmSort] = useState<SortKey>('cost')
  const [decisionSort, setDecisionSort] = useState<SortKey>('cost')
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

  const panel = data.llm.panel
  const panelReadyLlm = !!panel && panel.models.length > 0
  const llmSet = requestedLlmSet === 'panel' && panelReadyLlm ? 'panel' : 'original'
  const llm = sortRows(llmSet === 'panel' && panel ? llmPanelRows(panel, llmTab, includeEarlier) : llmRows(data.llm, llmTab, includeEarlier), llmSort)
  const panelEarlier = panel?.models.filter(model => model.cohort === 'earlier') ?? []
  const inTab = (board: { size: number }, tab: TabKey) => tab === 'all' || String(board.size) === tab
  const llmPanelBoards = panel ? panel.boards.filter(board => inTab(board, llmTab)).length : 0
  const commonLlmBoards = Math.max(0, ...llm.map(row => row.graded))
  const runCounts = llm.map(row => row.completed)
  const answeredLlm = llm.filter(row => row.completed > 0).length
  const reruns = data.llm.models.filter(model => model.rerun)
  const set = data.decision[boardSet]
  const decision = sortRows(decisionRows(set, decisionTab), decisionSort)
  const decisionBoardCount = decisionBoards(set, decisionTab).length
  const timeouts = data.llm.models.flatMap(model => model.notes.filter(note => note.includes('timed out')).map(note => `${model.name}, ${note}`))

  return <div className="scoreboard">
    <details className="sb-help">
      <summary>How to read these charts</summary>
      <p>The main bars count boards solved on the same shared sample, with the same number at each size. Solid and hatched sections distinguish the two kinds of success in each legend. The smaller blue bars show total API spend on their own dollar scale: scored requests plus re-runs, route probes and diagnostics. Sorting changes the order of models, not the measures shown.</p>
      <p>Total spend covers every recorded request on the selected board sizes, even when a board is outside the shared comparison. Cost per graded board uses the comparison requests with known costs and excludes extra requests; any unknown costs are stated alongside it. Under All boards, total spend also includes requests tied to no board. A missing result is never counted as a failure. OpenRouter bills the language models and Jev; SubQ bills SubQ Snap. <a href="#/assessment-receipt">Cost by evaluation</a>.</p>
    </details>
    <figure className="sb-chart" aria-labelledby="sb-llm-title">
      <figcaption>
        <span className="sb-kicker">Construction from a blank image</span>
        <strong id="sb-llm-title">Reasoning language models: results and spend</strong>
        <span>{llmSet === 'panel' ? `${llmPanelBoards} new boards` : `${llmTab === 'all' ? 'Three original boards' : 'One original board'}`}, one image and one scored request per model and board, with no retries. Each answer had to give the complete placement.</span>
      </figcaption>
      <div className="sb-controls">
        <Tabs value={llmTab} onChange={setLlmTab} label="Board size, language models" />
        <div className="sb-segment" role="group" aria-label="Board set, language models">
          <button type="button" aria-pressed={llmSet === 'panel'} onClick={() => setLlmSet('panel')} disabled={!panelReadyLlm}>New 36-board panel</button>
          <button type="button" aria-pressed={llmSet === 'original'} onClick={() => setLlmSet('original')}>Original 3 boards</button>
        </div>
        <SortControl value={llmSort} onChange={setLlmSort} label="Sort order, language models" />
        {(llmSet === 'original' || panelEarlier.length > 0) && <label className="sb-toggle"><input type="checkbox" checked={includeEarlier} onChange={event => setIncludeEarlier(event.target.checked)} /> Include earlier generations</label>}
      </div>
      <Legend items={[{ kind: 'solid', label: 'Correct, strict JSON' }, { kind: 'hatched', label: 'Correct placement, off-format' }, { kind: 'spend', label: 'Spend: scored requests' }, { kind: 'spend-other', label: 'Spend: re-runs and diagnostics' }]} />
      <CoverageNote rows={llm} />
      <EvalBars rows={llm} unit="Boards with a correct full placement, total API spend and cost per graded board" />
      <details className="sb-coverage">
        <summary>Test coverage: {answeredLlm} models × {commonLlmBoards} shared {commonLlmBoards === 1 ? 'board' : 'boards'} · spend includes every request recorded</summary>
        {llmSet === 'panel' ? <ul>
          {commonLlmBoards < llmPanelBoards && <li><strong>Common boards only:</strong> results use the first shared boards in panel order, balanced across sizes. Each total includes that model's spend on every board it has run at the selected sizes.</li>}
          <li>36 new boards (12 per size, 3 from each difficulty stratum of the 192-board panel), so every board also has Jev and SubQ results. Images rendered with the September renderer, byte-identical in style; September prompt and settings unchanged.</li>
          <li>GPT-5.6 Sol ran through OpenRouter's Batch API at the September price, with the image by public URL. Claude Opus 4.8, Gemini 3.1 Pro Preview and Grok 4.6 ran on demand with the September provider blocks and inline images. One request per model and board, no retries.</li>
          {runCounts.some(count => count < llmPanelBoards) && <li><strong>Still running:</strong> {Math.min(...runCounts)}–{Math.max(...runCounts)} of {llmPanelBoards} boards recorded per model at the selected sizes. Result labels use only the shared comparison; pending models stay visible.</li>}
          <li>Two Grok 4.6 9×9 answers ran out of the 12,288-token budget without a final answer, the same limit as in September; they count as unsolved.</li>
          {(panel?.reruns ?? []).length > 0 && <li><strong>Request failures and re-runs:</strong> {panel?.reruns?.map(r => `${r.model}'s ${r.size}×${r.size} request (${r.board_id}) failed with HTTP 429 before any answer`).join('; ')}. The chart keeps the preregistered result (unsolved). Re-sent once, unchanged, on 16 Oct: {panel?.reruns?.map((r, i) => <span key={r.receipt}>{i ? '; ' : ''}<a href={`#/evidence-atlas/${r.receipt}`}>{r.board_id}</a> {r.outcome === 'format_only' ? 'correct, off-format' : r.outcome === 'strict' ? 'correct' : r.outcome.replace('_', ' ')}</span>)}.</li>}
          {includeEarlier && panelEarlier.length > 0 && <li><strong>Earlier generations ({panelEarlier.length} models, 17–19 Oct):</strong> the same 36 boards, images and prompt, with each model's 1 October settings. Gemini 2.5 Pro and Flash ran through the Batch API on Google Vertex. OpenRouter rejected every OpenAI and Anthropic batch ("no :batch endpoint"), so those six ran on demand with their 1 October provider blocks, as preregistered.{(panel?.retired ?? []).length > 0 && <> Not shown: {panel?.retired?.map(model => model.name).join(', ')}, which OpenRouter no longer serves.</>}</li>}
<li><strong>Cost:</strong> OpenRouter spend on each graded request, from the receipts (<code>usage.cost</code>). GPT-5.6 Sol's 16 October batch items carry no per-item cost, so theirs is tokens × the batch price, which reproduces the billed batch total exactly. Requests rejected before generation (HTTP 4xx, such as Gemini's two 429s) cost $0. Gemini's two dated re-runs ($0.23) are listed in the cost ledger, not in its per-board cost. Agent-led OpenRouter use outside these studies is not included. <a href="#/assessment-receipt">Cost by evaluation</a>.</li>
          <li><a href="#/decision-models">Decision models</a> · <a href="#/earlier-generations">Earlier generations</a> · <a href={evidenceUrl('evidence/frontier-image-panel/summary.json')} download>Panel results (JSON)</a>{panel?.earlier_study && <> · <a href={evidenceUrl('evidence/legacy-panel/summary.json')} download>Earlier-generation results (JSON)</a></>}</li>
        </ul> : <ul>
          <li>One request per model and board, the same image and prompt, no tools, no repair turns, no retries.</li>
          {timeouts.map(note => <li key={note}><strong>Timed out:</strong> {note} It is counted as unsolved here, as recorded.</li>)}
          {reruns.map(model => <li key={model.id}><strong>Re-run on {model.rerun?.date}:</strong> {model.name}'s {model.rerun?.size}×{model.rerun?.size} request was sent again byte for byte: {model.rerun?.outcome === 'strict' ? 'solved, strict JSON' : model.rerun?.outcome.replace('_', ' ')}. <a href={`#/evidence-atlas/${model.rerun?.receipt}`}>Re-run receipt</a>.</li>)}
          {includeEarlier && <li><strong>Scheduled but not run ({data.llm.not_run.length}):</strong> {data.llm.not_run.map(model => model.name).join(', ')}. The adaptive replay stopped those families early; they had no tests and are not shown.</li>}
          {includeEarlier && <li>The six unrun earlier-generation models have not been scheduled again.</li>}
<li><strong>Cost:</strong> OpenRouter spend on each graded request, from the receipts (<code>usage.cost</code>). Grok 4.6's 7×7 request timed out with no generation ID, so its cost is unknown and not counted. Agent-led OpenRouter use outside these studies is not included. <a href="#/assessment-receipt">Cost by evaluation</a>.</li>
          <li><a href="#/protocol-results">Protocol and results</a> · <a href="#/earlier-generations">Earlier generations</a> · <a href={evidenceUrl('evidence/scoreboard.json')} download>Scoreboard data (JSON)</a></li>
        </ul>}
      </details>
    </figure>

    {children}

    <figure className="sb-chart" aria-labelledby="sb-decision-title">
      <figcaption>
        <span className="sb-kicker">Construction one decision at a time</span>
        <strong id="sb-decision-title">Decision models: results and spend</strong>
        <span>The harness offered a menu of colors, then of cells; the model chose one option per call, with no backtracking.</span>
      </figcaption>
      <div className="sb-controls">
        <Tabs value={decisionTab} onChange={setDecisionTab} label="Board size, decision models" />
        <div className="sb-segment" role="group" aria-label="Board set">
          <button type="button" aria-pressed={boardSet === 'panel'} onClick={() => setBoardSet('panel')}>New 192-board panel</button>
          <button type="button" aria-pressed={boardSet === 'original'} onClick={() => setBoardSet('original')}>Original 9 boards</button>
        </div>
        <SortControl value={decisionSort} onChange={setDecisionSort} label="Sort order, decision models" />
      </div>
      <Legend items={[{ kind: 'solid', label: 'Solved from the raw menu' }, { kind: 'hatched', label: 'Solved only with the conflict filter' }, { kind: 'baseline', label: 'No-model baseline' }, ...(set.pending.length ? [{ kind: 'pending' as const, label: 'Not yet tested' }] : []), { kind: 'spend', label: 'Spend: scored trajectory calls' }, { kind: 'spend-other', label: 'Spend: route probes and controls' }]} />
      <CoverageNote rows={decision} />
      <EvalBars rows={decision} unit="Boards solved from an empty board, total API spend and cost per graded board" />
      <details className="sb-coverage">
        <summary>Test coverage: {decisionBoardCount} {decisionBoardCount === 1 ? 'board' : 'boards'}, {set.models[0]?.attempts_per_board_mode ?? '—'} raw + {set.models[0]?.attempts_per_board_mode ?? '—'} filtered {set.models[0]?.attempts_per_board_mode === 1 ? 'attempt' : 'attempts'} per board</summary>
        <ul>
          {boardSet === 'original' ? <>
            <li>Jev 1.13 and SubQ Snap received the same nine boards, protocol and menus: five raw and five filtered attempts per board, 90 attempts each. A board counts as solved if any attempt solved it.</li>
            <li>Model calls: {set.models.map(model => `${model.name} ${model.calls}`).join(', ')}. Single-option menus were forced by the harness and made no call.</li>
          </> : <>
            <li>192 new, independently certified boards (64 per size, stratified by singleton regions and search difficulty), with one raw and one filtered attempt each, preregistered before any call. Jev 1.13 (16 Oct, build jev-1.13-20260917, same build as September) and SubQ Snap (15 Oct) received identical boards, schedule, prompts and stopping rule.</li>
            {set.models.map(model => <li key={model.name}>{model.name}: {model.calls} model calls.</li>)}
            {set.pending.map(model => <li key={model.name}><strong>{model.name} not yet tested:</strong> {model.reason} Until then this panel is not a like-for-like comparison.</li>)}
          </>}
<li><strong>Cost:</strong> each model's API spend per board on its scored trajectory calls. Jev ran through OpenRouter. On the original nine boards it also spent $0.016 on route probes and order controls: hatched in the total-spend bar and excluded from cost per graded board. SubQ Snap is billed by SubQ: its input tokens at the published $0.05 per million, with output free. On 19 October the SubQ account showed $0.17 for the 2,434 answered SubQ requests made for this book, which the receipts reproduce ($0.1663); three rejected requests (HTTP 422) were not billed. The baselines make no API calls.</li>
          <li>Baselines use the same boards: the greedy rule is deterministic (<a href="#/greedy-rule">rule, results and step-by-step replays</a>); the random value is an exact expectation, not a run.</li>
          <li><a href="#/methods-critique">Methods critique</a> · <a href="#/subq-assessment">SubQ chapter</a> · <a href="#/jev-trajectories">Jev trajectories</a></li>
        </ul>
      </details>
    </figure>
  </div>
}
