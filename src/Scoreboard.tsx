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
  /** Evals view: API cost per graded board shown; null when not a model or never billed. */
  cost: Cost | null
  /** Cost view: API spend on every request the model has run on the boards shown; null when nothing was billed. */
  spend: Spend | null
  /** Boards solved and boards graded (for the random baseline, the expected number solved). */
  solved: number
  graded: number
  costNote?: string
}

type Cost = { total: number; perBoard: number | null; boards: number; unknown: number }
type Spend = { graded: number; other: number; unknown: number }
type SortKey = 'performance' | 'cost'
/** Cost: AI cost management and observability, every request run. Evals: like-for-like samples only. */
type View = 'cost' | 'evals'

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

/** Sort model rows by boards solved or by cost, keeping baselines and pending rows after them.
    Cost means total spend in the cost view, cost per graded board in the evals view. */
function sortRows(rows: Row[], key: SortKey, view: View): Row[] {
  const models = rows.filter(row => row.kind === 'model')
  const rest = rows.filter(row => row.kind !== 'model')
  if (key === 'performance') return [...models.sort((a, b) => b.solved - a.solved || b.solid - a.solid || a.name.localeCompare(b.name)), ...rest]
  const value = (row: Row) => (view === 'cost' ? spendTotal(row) : row.cost?.perBoard) ?? -1
  return [...models.sort((a, b) => value(b) - value(a) || a.name.localeCompare(b.name)), ...rest]
}

/** Evals view: the boards every model shown has a graded result for, then the same number at each size
    (the first in board order), so each bar counts the same samples. */
function commonBoards<B extends { id: string; size: number }>(boards: B[], graded: ((id: string) => boolean)[]): B[] {
  const common = boards.filter(board => graded.every(test => test(board.id)))
  const sizes = [...new Set(boards.map(board => board.size))]
  const perSize = Math.min(...sizes.map(size => common.filter(board => board.size === size).length))
  return sizes.flatMap(size => common.filter(board => board.size === size).slice(0, perSize))
}

/** Cost view: graded spend on the boards shown plus re-runs, probes and diagnostics on those sizes; board-less requests only under All boards. */
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

/** Artificial Analysis-style columns on wide containers; labelled rows on phones. */
function CostMark({ row, max }: { row: Row; max: number }) {
  const per = row.cost?.perBoard ?? null
  return <span className="sb-cost" aria-hidden="true">
    <span className="sb-cost-track">{per !== null && <span className="sb-cost-fill" style={{ width: `${Math.max(2, per / max * 100)}%` }} />}</span>
    <span className="sb-cost-label">{per !== null ? <><span className="sb-nowrap">{usd(per)}<span className="sb-cost-unit">/board</span></span>{row.cost?.unknown ? <span className="sb-cost-unit sb-cost-extra"> +{row.cost.unknown} unknown</span> : null}</>
      : row.kind === 'baseline' ? 'no API cost' : row.kind === 'pending' ? 'not yet run'
        : row.costNote ? 'not OpenRouter' : row.cost?.unknown ? 'cost unknown' : 'not run yet'}</span>
  </span>
}

/** Cost view's secondary measure: boards solved over boards run, on its own 0–100% scale. */
function PerfMark({ row }: { row: Row }) {
  const fraction = row.graded ? row.solved / row.graded : null
  const text = row.kind === 'pending' ? 'not yet tested' : fraction === null ? 'no boards run'
    : row.key === 'random' ? `≈${row.solved.toFixed(1)}/${row.graded} expected` : `${row.solved}/${row.graded} solved`
  return <span className="sb-cost sb-perf" aria-hidden="true">
    <span className="sb-cost-track">{fraction !== null && fraction > 0 && <span className="sb-perf-fill" style={{ width: `${Math.max(2, fraction * 100)}%` }} />}</span>
    <span className="sb-cost-label"><span className="sb-nowrap">{text}</span></span>
  </span>
}

/** What the cost view's track says when a row has no API spend to draw. */
const noSpendText = (row: Row) => row.kind === 'baseline' ? 'No API calls' : row.kind === 'pending' ? 'Not yet tested' : row.costNote ? 'Not billed through OpenRouter' : 'Not run yet'

function EvalBars({ rows, unit, view }: { rows: Row[]; unit: string; view: View }) {
  const [ref, width] = useWidth<HTMLDivElement>(700)
  const vertical = width >= 560 && rows.length <= 9
  const max = view === 'cost' ? Math.max(0.000001, ...rows.map(row => spendTotal(row) ?? 0)) : Math.max(1, ...rows.map(row => row.denominator))
  const costMax = Math.max(0.000001, ...rows.map(row => row.cost?.perBoard ?? 0))
  // The wide row grid follows the chart's own width, so the secondary column never squeezes the main track.
  return <div ref={ref} className={`sb-bars ${vertical ? 'sb-bars--columns' : 'sb-bars--rows'}${!vertical && width >= 640 ? ' sb-bars--wide' : ''}`} role="list" aria-label={unit}>
    {rows.map(row => {
      const total = spendTotal(row)
      const [first, second] = view === 'cost' ? [row.spend?.graded ?? 0, row.spend?.other ?? 0] : [row.solid, row.hatched]
      const firstPct = first / max * 100
      const secondPct = second / max * 100
      const fills = view === 'cost' ? ['sb-fill--spend', 'sb-fill--spend-other'] : ['sb-fill--solid', 'sb-fill--hatched']
      const empty = view === 'cost' ? (total === null ? noSpendText(row) : null) : row.kind === 'pending' ? 'Not yet tested' : null
      const value = view === 'cost' ? (total === null ? (row.kind === 'baseline' ? '$0' : '—') : `${row.spend?.unknown ? '≥ ' : ''}${usd(total)}`) : row.label
      const costLine = row.kind === 'model' ? ` Cost: ${costText(row.cost, row.costNote)}.` : ''
      const spendLine = row.spend ? ` API spend ${usd(row.spend.graded + row.spend.other)}: ${usd(row.spend.graded)} on graded requests${row.spend.other ? `, ${usd(row.spend.other)} on re-runs, probes and diagnostics` : ''}${row.spend.unknown ? `; ${row.spend.unknown} more with unknown cost` : ''}.` : ` ${noSpendText(row)}.`
      const summary = view === 'cost' ? `${spendLine} ${row.label} boards solved. ${row.detail}` : ` ${row.label}. ${row.detail}${costLine}`
      const track = <span className="sb-track" aria-hidden="true">
        {empty ? <span className="sb-pending-text">{empty}</span> : <>
          <span className={`sb-fill ${fills[0]}`} style={vertical ? { height: `${firstPct}%` } : { width: `${firstPct}%` }} />
          <span className={`sb-fill ${fills[1]}`} style={vertical ? { height: `${secondPct}%` } : { width: `${secondPct}%` }} />
        </>}
      </span>
      const secondary = view === 'cost' ? <PerfMark row={row} /> : <CostMark row={row} max={costMax} />
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

function Legend({ items }: { items: { kind: 'solid' | 'hatched' | 'baseline' | 'pending' | 'cost' | 'spend' | 'spend-other' | 'perf'; label: string }[] }) {
  return <div className="sb-legend">{items.map(item => <span key={item.label}><span className={`sb-swatch sb-swatch--${item.kind}`} aria-hidden="true" />{item.label}</span>)}</div>
}

function SortControl({ value, onChange, label, view }: { value: SortKey; onChange: (key: SortKey) => void; label: string; view: View }) {
  return <div className="sb-segment" role="group" aria-label={label}>
    <button type="button" aria-pressed={value === 'cost'} onClick={() => onChange('cost')}>{view === 'cost' ? 'Total spend, highest first' : 'Cost per board, highest first'}</button>
    <button type="button" aria-pressed={value === 'performance'} onClick={() => onChange('performance')}>Sort: boards solved</button>
  </div>
}

const SIZES = ['5', '7', '9']
const sizesFor = (tab: TabKey) => tab === 'all' ? SIZES : [tab]
const panelRecorded = (outcome: Outcome | 'not_run' | undefined) => (outcome ?? 'not_run') !== 'not_run'

/** The original three boards (one per size). Evals: sizes every model shown answered; cost: each model's own. */
function llmRows(data: ScoreboardData['llm'], tab: TabKey, includeEarlier: boolean, view: View): Row[] {
  const models = data.models.filter(model => includeEarlier || model.cohort === 'frontier')
  const common = commonBoards(SIZES.map(size => ({ id: size, size: Number(size) })), models.map(model => (size: string) => !!model.boards[size])).map(board => board.id)
  return models.map(model => {
    const sizes = sizesFor(tab).filter(size => view === 'cost' ? !!model.boards[size] : common.includes(size))
    const outcomes = sizes.map(size => model.boards[size]?.outcome)
    const strict = outcomes.filter(value => value === 'strict').length
    const formatOnly = outcomes.filter(value => value === 'format_only').length
    const noAnswer = outcomes.filter(value => value === 'no_answer').length
    const issued = sizes.length
    const parts = [`${strict} strict JSON`, formatOnly ? `${formatOnly} correct but off-format` : '', noAnswer ? `${noAnswer} timed out with no answer` : ''].filter(Boolean)
    const costs = sizes.map(size => model.boards[size].cost_usd)
    return { key: model.id, name: model.name, author: model.author, logo: model.logo, solid: strict, hatched: formatOnly, denominator: issued, label: `${strict + formatOnly}/${issued}`, kind: 'model' as const,
      detail: `${parts.join(' · ')}. ${model.cohort === 'frontier' ? '17 Sep study' : '1 Oct earlier-generations replay'}.`,
      cost: summarizeCost(costs), spend: spendOf(costs, model.other_spend, sizesFor(tab), tab === 'all'), solved: strict + formatOnly, graded: issued }
  }).sort((a, b) => (b.solid + b.hatched) - (a.solid + a.hatched) || b.solid - a.solid || a.name.localeCompare(b.name))
}

/** Panel models shown, and the evals view's common board set (models with no answers yet are left out of it). */
function panelScope(panel: LlmPanel, includeEarlier: boolean) {
  const models = panel.models.filter(model => includeEarlier || model.cohort !== 'earlier')
  const answered = models.filter(model => panel.boards.some(board => panelRecorded(model.boards[board.id])))
  const common = commonBoards(panel.boards, answered.map(model => (id: string) => panelRecorded(model.boards[id])))
  return { models, answered, common, unanswered: models.filter(model => !answered.includes(model)) }
}

function llmPanelRows(panel: LlmPanel, tab: TabKey, includeEarlier: boolean, view: View): Row[] {
  const scope = panelScope(panel, includeEarlier)
  const pool = view === 'evals' ? scope.common : panel.boards
  const ids = pool.filter(board => tab === 'all' || String(board.size) === tab).map(board => board.id)
  return (view === 'evals' ? scope.answered : scope.models).map(model => {
    const outcomes = ids.map(id => model.boards[id] ?? 'not_run')
    const strict = outcomes.filter(value => value === 'strict').length
    const formatOnly = outcomes.filter(value => value === 'format_only').length
    const noAnswer = outcomes.filter(value => value === 'no_answer').length
    const truncated = outcomes.filter(value => value === 'truncated').length
    const notRun = outcomes.filter(value => value === 'not_run').length
    const issued = ids.length - notRun
    const parts = [`${strict} strict JSON`, formatOnly ? `${formatOnly} correct but off-format` : '', truncated ? `${truncated} ran out of tokens` : '', noAnswer ? `${noAnswer} request failed before an answer` : '', notRun ? `${notRun} not yet run` : ''].filter(Boolean)
    const costs = ids.filter(id => panelRecorded(model.boards[id])).map(id => model.costs?.[id])
    return { key: model.id, name: model.name, author: model.author, logo: model.logo, solid: strict, hatched: formatOnly, denominator: ids.length,
      label: `${strict + formatOnly}/${issued}`, kind: 'model' as const, detail: `${parts.join(' · ')}. ${model.route === 'batch' ? 'Batch API' : 'On demand'}, ${model.cohort === 'earlier' ? '17–19 Oct earlier-generation panel' : '16 Oct panel'}.`,
      cost: summarizeCost(costs), spend: spendOf(costs, model.other_spend, sizesFor(tab), tab === 'all'), solved: strict + formatOnly, graded: issued }
  }).sort((a, b) => (b.solid + b.hatched) - (a.solid + a.hatched) || b.solid - a.solid || a.name.localeCompare(b.name))
}

/** Evals view: boards every decision model has results for, balanced by size; cost view: every board in the set. */
function decisionBoards(set: DecisionSet, tab: TabKey, view: View) {
  const pool = view === 'evals' ? commonBoards(set.boards, set.models.map(model => (id: string) => !!model.per_board[id])) : set.boards
  return pool.filter(board => tab === 'all' || String(board.size) === tab)
}

function decisionRows(set: DecisionSet, tab: TabKey, view: View): Row[] {
  const ids = decisionBoards(set, tab, view).map(board => board.id)
  const rows: Row[] = set.models.map(model => {
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
    return { key: model.name, name: model.name, author: model.author, logo: model.logo, solid: raw, hatched: localOnly, denominator: ids.length, label: `${raw + localOnly}/${mine.length}`, kind: 'model' as const,
      detail: `${raw} solved from the raw menu, ${localOnly} only with the conflict filter; ${solvedAttempts}/${attempts} attempts solved.`,
      cost: costs ? summarizeCost(costs) : null, spend: costs ? spendOf(costs, model.other_spend, sizesFor(tab), tab === 'all') : null,
      solved: raw + localOnly, graded: mine.length, costNote: model.cost_note ?? undefined }
  })
  // A model not yet tested has no samples, so the evals view leaves it out; the cost view lists it.
  if (view === 'cost') for (const pending of set.pending) rows.push({ key: pending.name, name: pending.name, author: pending.author, logo: pending.logo, solid: 0, hatched: 0, denominator: ids.length, label: '—', kind: 'pending', detail: pending.reason, cost: null, spend: null, solved: 0, graded: 0 })
  const greedy = ids.filter(id => set.baselines.greedy[id]).length
  rows.push({ key: 'greedy', name: 'Greedy rule (no model)', solid: 0, hatched: greedy, denominator: ids.length, label: `${greedy}/${ids.length}`, kind: 'baseline', detail: 'Fewest-legal-cells color first, first legal cell, never backtracks. Uses the conflict filter.', cost: null, spend: null, solved: greedy, graded: ids.length })
  const random = ids.reduce((sum, id) => sum + (set.baselines.random_expected_any[id] ?? 0), 0)
  rows.push({ key: 'random', name: 'Random menu choice', solid: 0, hatched: random, denominator: ids.length, label: `≈${random < 10 ? random.toFixed(1) : Math.round(random)}`, kind: 'baseline', detail: 'Expected boards solved at least once by uniform random choices under the same protocol and attempt allowance.', cost: null, spend: null, solved: random, graded: ids.length })
  return rows
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
  const [view, setView] = useState<View>('cost')

  const selectView = (next: View) => {
    if (next === view) return
    setView(next)
    const defaultSort = next === 'cost' ? 'cost' : 'performance'
    setLlmSort(defaultSort)
    setDecisionSort(defaultSort)
  }

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
  const llm = sortRows(llmSet === 'panel' && panel ? llmPanelRows(panel, llmTab, includeEarlier, view) : llmRows(data.llm, llmTab, includeEarlier, view), llmSort, view)
  const panelEarlier = panel?.models.filter(model => model.cohort === 'earlier') ?? []
  const scope = panel ? panelScope(panel, includeEarlier) : null
  const inTab = (board: { size: number }, tab: TabKey) => tab === 'all' || String(board.size) === tab
  const llmPanelBoards = panel ? panel.boards.filter(board => inTab(board, llmTab)).length : 0
  const commonPanelBoards = scope ? scope.common.filter(board => inTab(board, llmTab)).length : 0
  const runCounts = scope && panel ? scope.models.map(model => panel.boards.filter(board => inTab(board, llmTab) && panelRecorded(model.boards[board.id])).length) : []
  const llmEmpty = view === 'evals' && llm.length > 0 && llm.every(row => row.graded === 0)
  const reruns = data.llm.models.filter(model => model.rerun)
  const frontierCount = data.llm.models.filter(model => model.cohort === 'frontier').length
  const set = data.decision[boardSet]
  const panelReady = data.decision.panel.models.length > 0
  const decision = sortRows(decisionRows(set, decisionTab, view), decisionSort, view)
  const decisionBoardCount = decisionBoards(set, decisionTab, view).length
  const timeouts = data.llm.models.flatMap(model => model.notes.filter(note => note.includes('timed out')).map(note => `${model.name}, ${note}`))

  return <div className="scoreboard">
    <div className="sb-view">
      <div className="sb-segment sb-segment--view" role="group" aria-label="Scoreboard view">
        <button type="button" aria-pressed={view === 'cost'} onClick={() => selectView('cost')}>Cost</button>
        <button type="button" aria-pressed={view === 'evals'} onClick={() => selectView('evals')}>Evals</button>
      </div>
      <p className="sb-view-note">{view === 'cost'
        ? 'AI cost management and observability: API spend (OpenRouter; SubQ for SubQ Snap) on every request each model made for the evaluation shown, including any boards the other models have not run, re-runs and diagnostics. Other studies are itemised in the assessment receipt.'
        : 'Like-for-like evaluation: only the boards every model shown has answered, with the same number at each size.'}</p>
    </div>
    <figure className="sb-chart" aria-labelledby="sb-llm-title">
      <figcaption>
        <span className="sb-kicker">Construction from a blank image</span>
        <strong id="sb-llm-title">{view === 'cost' ? 'Reasoning language models: OpenRouter spend' : 'Reasoning language models: boards solved'}</strong>
        <span>{llmSet === 'panel' ? `Each model received the same ${llmPanelBoards} new boards` : `Each model received the same ${llmTab === 'all' ? 'three boards' : 'board'}`} as one image, with one request and no retries, and had to write the complete placement.</span>
      </figcaption>
      <div className="sb-controls">
        <Tabs value={llmTab} onChange={setLlmTab} label="Board size, language models" />
        <div className="sb-segment" role="group" aria-label="Board set, language models">
          <button type="button" aria-pressed={llmSet === 'panel'} onClick={() => setLlmSet('panel')} disabled={!panelReadyLlm}>New 36-board panel</button>
          <button type="button" aria-pressed={llmSet === 'original'} onClick={() => setLlmSet('original')}>Original 3 boards</button>
        </div>
        <SortControl value={llmSort} onChange={setLlmSort} label="Sort order, language models" view={view} />
        {(llmSet === 'original' || panelEarlier.length > 0) && <label className="sb-toggle"><input type="checkbox" checked={includeEarlier} onChange={event => setIncludeEarlier(event.target.checked)} /> Include earlier generations</label>}
      </div>
      <Legend items={view === 'cost'
        ? [{ kind: 'spend', label: 'Graded requests' }, { kind: 'spend-other', label: 'Re-runs and diagnostics' }, { kind: 'perf', label: 'Boards solved of boards run (own scale)' }]
        : [{ kind: 'solid', label: 'Correct, strict JSON' }, { kind: 'hatched', label: 'Correct placement, broke the JSON-only format' }, { kind: 'cost', label: 'OpenRouter cost per board (own scale)' }]} />
      {llmEmpty ? <p className="sb-note" role="status">No board has yet been answered by every model shown at every size. Switch to the cost view, or leave out the earlier generations.</p>
        : <EvalBars rows={llm} unit={view === 'cost' ? 'OpenRouter spend per model, US dollars' : 'Boards with a correct full placement'} view={view} />}
      <details className="sb-coverage">
        <summary>{view === 'cost'
          ? `Spend coverage: ${llm.length} models, every request run${llmSet === 'panel' && runCounts.length ? ` (${Math.min(...runCounts) === Math.max(...runCounts) ? Math.max(...runCounts) : `${Math.min(...runCounts)}–${Math.max(...runCounts)}`} of ${llmPanelBoards} boards per model)` : ''}`
          : `Test coverage: ${llmSet === 'panel' ? `${scope?.answered.length ?? 0} models × ${commonPanelBoards} boards` : `${includeEarlier ? data.llm.models.length : frontierCount} models × ${llmTab === 'all' ? 3 : 1} ${llmTab === 'all' ? 'boards' : 'board'}`}, identical for every model shown`}</summary>
        {llmSet === 'panel' ? <ul>
          {view === 'evals' && scope && scope.common.length < panel!.boards.length && <li><strong>Common boards only:</strong> the {scope.common.length} boards ({scope.common.length / 3} per size) that every model shown has answered, the first in panel order at each size.{scope.unanswered.length > 0 && <> Not shown, with no answers yet: {scope.unanswered.map(model => model.name).join(', ')}.</>}</li>}
          <li>36 new boards (12 per size, 3 from each difficulty stratum of the 192-board panel), so every board also has Jev and SubQ results. Images rendered with the September renderer, byte-identical in style; September prompt and settings unchanged.</li>
          <li>GPT-5.6 Sol ran through OpenRouter's Batch API at the September price, with the image by public URL. Claude Opus 4.8, Gemini 3.1 Pro Preview and Grok 4.6 ran on demand with the September provider blocks and inline images. One request per model and board, no retries.</li>
          {view === 'cost' && (scope?.models ?? []).some(model => Object.values(model.boards).includes('not_run')) && <li><strong>Still running:</strong> bars show the boards recorded so far; the denominator in each label counts only completed requests.</li>}
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
        <strong id="sb-decision-title">{view === 'cost' ? 'Decision models: API spend' : 'Decision models: boards solved from an empty board'}</strong>
        <span>The harness offered a menu of colors, then of cells; the model chose one option per call, with no backtracking.</span>
      </figcaption>
      <div className="sb-controls">
        <Tabs value={decisionTab} onChange={setDecisionTab} label="Board size, decision models" />
        <div className="sb-segment" role="group" aria-label="Board set">
          <button type="button" aria-pressed={boardSet === 'panel'} onClick={() => setBoardSet('panel')}>New 192-board panel</button>
          <button type="button" aria-pressed={boardSet === 'original'} onClick={() => setBoardSet('original')}>Original 9 boards</button>
        </div>
        <SortControl value={decisionSort} onChange={setDecisionSort} label="Sort order, decision models" view={view} />
      </div>
      <Legend items={view === 'cost'
        ? [{ kind: 'spend', label: 'Scored trajectory calls' }, { kind: 'spend-other', label: 'Route probes and order controls' }, { kind: 'perf', label: 'Boards solved (own scale)' }]
        : [{ kind: 'solid', label: 'Solved from the raw menu' }, { kind: 'hatched', label: 'Solved only with the conflict filter' }, { kind: 'baseline', label: 'No-model baseline' }, ...(set.pending.length ? [{ kind: 'pending' as const, label: 'Not yet tested' }] : []), { kind: 'cost', label: 'API cost per board (own scale)' }]} />
      {boardSet === 'panel' && !panelReady ? <p className="sb-note" role="status">The new-board panel is still running. Results appear here when its receipts are complete.</p>
        : <EvalBars rows={decision} unit={view === 'cost' ? 'API spend per model, US dollars' : 'Boards solved from an empty board'} view={view} />}
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
<li><strong>Cost:</strong> each model's API spend per board on its scored trajectory calls. Jev ran through OpenRouter. On the original nine boards it also spent $0.016 on route probes and order controls: hatched in the cost view, and left out of the per-board cost in the evals view. SubQ Snap is billed by SubQ: its input tokens at the published $0.05 per million, with output free. On 19 October the SubQ account showed $0.17 for the 2,434 answered SubQ requests made for this book, which the receipts reproduce ($0.1663); three rejected requests (HTTP 422) were not billed. The baselines make no API calls.</li>
          <li>Baselines use the same boards: the greedy rule is deterministic (<a href="#/greedy-rule">rule, results and step-by-step replays</a>); the random value is an exact expectation, not a run.</li>
          <li><a href="#/methods-critique">Methods critique</a> · <a href="#/subq-assessment">SubQ chapter</a> · <a href="#/jev-trajectories">Jev trajectories</a></li>
        </ul>
      </details>
    </figure>
  </div>
}
