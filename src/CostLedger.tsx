import { useEffect, useState, type ComponentType, type ReactNode } from 'react'
import { money } from './BoardReceipts'

type Ui = {
  Callout: ComponentType<{ tone?: 'note' | 'evidence' | 'caution' | 'stop'; title: string; children: ReactNode }>
  DataTable: ComponentType<{ caption: string; headers: string[]; rows: (string | ReactNode)[][] }>
}
type Evaluation = {
  study: string; label: string; model: string; model_name: string; provider: 'OpenRouter' | 'SubQ'; boards: number; receipts: number
  cost_usd: number; cost_per_request_usd: number | null; scored_cost_usd: number; cost_per_board_usd: number | null; unknown_boards: number; unscored_receipts: number; unscored_usd: number
  boards_solved: number | null; boards_graded: number | null; cost_per_solved_board_usd: number | null; basis: Record<string, number>
}
type SubqAccount = { as_of: string; billed_usd: number; requests: number; input_tokens: number; receipts_usd: number }
type Costs = { scope: string; per_board: string; total_usd: number; by_provider: Record<string, number>; subq_account: SubqAccount; unknown_receipts: number; evaluations: Evaluation[] }

const url = (path: string) => `${import.meta.env.BASE_URL}evidence/${path}`
const usd = (value: number | null) => value === null ? '—' : money(value)
const BASIS_NAMES: Record<string, string> = { subq_rate: 'SubQ rate' }
const basisText = (basis: Record<string, number>) => Object.entries(basis).map(([key, count]) => `${count} ${BASIS_NAMES[key] ?? key}`).join(', ')
/** The two 36-board one-shot panels are the like-for-like cost and performance comparison. */
const PANELS = ['2026-10-16-frontier-image-panel', '2026-10-17-earlier-generations-panel']

/** API cost per evaluation, board, request and model, from scoreboard.json (built from the receipts). */
export function CostLedger({ ui, compact = false }: { ui: Ui; compact?: boolean }) {
  const { Callout, DataTable } = ui
  const [costs, setCosts] = useState<Costs | null>(null)
  const [error, setError] = useState(false)
  useEffect(() => {
    const controller = new AbortController()
    fetch(url('scoreboard.json'), { signal: controller.signal })
      .then(response => { if (!response.ok) throw new Error('scoreboard'); return response.json() })
      .then(data => { if (!data.costs) throw new Error('costs'); setCosts(data.costs) })
      .catch(() => { if (!controller.signal.aborted) setError(true) })
    return () => controller.abort()
  }, [])
  if (error) return <p role="status">The saved cost ledger could not be loaded. No costs are substituted.</p>
  if (!costs) return <p role="status">Loading the cost ledger…</p>

  const solved = (row: Evaluation) => row.boards_solved === null ? '—' : `${row.boards_solved}/${row.boards_graded}`
  // An unknown cost makes the total and per-solved figures lower bounds; say so instead of printing them as exact.
  const atLeast = (row: Evaluation, value: number | null) => value === null ? '—' : row.unknown_boards || row.basis.unknown ? `≥ ${usd(value)}` : usd(value)
  const other = (row: Evaluation) => row.unscored_receipts ? `${usd(row.unscored_usd)} (${row.unscored_receipts})` : '—'
  if (compact) {
    const rows = costs.evaluations.filter(row => PANELS.includes(row.study))
      .sort((a, b) => (b.boards_solved ?? 0) / Math.max(1, b.boards_graded ?? 1) - (a.boards_solved ?? 0) / Math.max(1, a.boards_graded ?? 1) || (a.cost_per_board_usd ?? 0) - (b.cost_per_board_usd ?? 0))
    return <DataTable caption="Cost and performance on the 36-board image panel (OpenRouter cost of the graded requests, one per board)" headers={['Model', 'Boards solved', 'Cost per board', 'Cost per solved board', 'Total', 'Evaluation']}
      rows={rows.map(row => [row.model_name, solved(row), usd(row.cost_per_board_usd), atLeast(row, row.cost_per_solved_board_usd), atLeast(row, row.scored_cost_usd), row.study.startsWith('2026-10-16') ? 'Frontier, 16 Oct' : 'Earlier generation, 17–19 Oct'])} />
  }
  const studies = [...new Set(costs.evaluations.map(row => row.study))].sort()
  return <>
    <p>Every figure below is summed from the published receipts, per evaluation and model: total API cost, cost per request, cost per board, and cost per board solved where the evaluation grades whole boards. Across all {studies.length} evaluations, the receipts record <strong>{usd(costs.total_usd)}</strong> of API spend: {Object.entries(costs.by_provider).map(([name, value]) => `${name} ${usd(value)}`).join(', ')}. Each <a href="#/board-receipts">board receipt</a> breaks one board's cost down by system and request.</p>
    <DataTable caption="API cost by evaluation and model" headers={['Evaluation', 'Model', 'Billed by', 'Boards', 'Requests', 'Total cost', 'Per request', 'Per board (graded)', 'Boards solved', 'Per solved board', 'Other spend (requests)', 'Cost basis']}
      rows={costs.evaluations.slice().sort((a, b) => a.study.localeCompare(b.study) || a.model_name.localeCompare(b.model_name)).map(row => [row.label, row.model_name, row.provider, String(row.boards), String(row.receipts), atLeast(row, row.cost_usd), atLeast(row, row.cost_per_request_usd), usd(row.cost_per_board_usd), solved(row), atLeast(row, row.cost_per_solved_board_usd), other(row), basisText(row.basis)])} />
    <Callout tone="caution" title="What the cost covers.">{costs.scope} {costs.per_board} “Other spend” is that remainder: re-runs, route probes and order controls, text-only diagnostics and requests tied to no board.
      <ul>
        <li><strong>Reported:</strong> <code>usage.cost</code> returned by OpenRouter with the response.</li>
        <li><strong>Derived:</strong> batch items report tokens but no per-item cost. Their cost is tokens × the batch price, with cached input at a tenth of the input price. That reproduces the billed batch total exactly.</li>
        <li><strong>Unbilled:</strong> an HTTP 4xx rejection before any generation, billed $0.</li>
        <li><strong>SubQ rate:</strong> SubQ Snap requests report input tokens but no cost; their cost is the tokens × SubQ's published $0.05 per million (output is free). On {costs.subq_account.as_of} the SubQ account showed ${costs.subq_account.billed_usd.toFixed(2)} for the {costs.subq_account.requests.toLocaleString()} answered SubQ requests made for this book ({costs.subq_account.input_tokens.toLocaleString()} input tokens), and the receipts reproduce it: ${costs.subq_account.receipts_usd.toFixed(4)}, which rounds to the same. Three more SubQ requests were rejected (HTTP 422) and not billed.</li>
        <li><strong>Unknown:</strong> {costs.unknown_receipts} {costs.unknown_receipts === 1 ? 'request' : 'requests'} with no generation ID or usage (a client timeout or an upstream 5xx), not counted. Totals that include one are marked ≥.</li>
        <li><strong>Not included:</strong> requests not yet run or blocked by a budget limit.</li>
      </ul>
      <a href={url('scoreboard.json')} download>Cost data (JSON)</a></Callout>
  </>
}
