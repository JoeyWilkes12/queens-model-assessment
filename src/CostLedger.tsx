import { useEffect, useState, type ComponentType, type ReactNode } from 'react'

type Ui = {
  Callout: ComponentType<{ tone?: 'note' | 'evidence' | 'caution' | 'stop'; title: string; children: ReactNode }>
  DataTable: ComponentType<{ caption: string; headers: string[]; rows: (string | ReactNode)[][] }>
}
type Evaluation = {
  study: string; label: string; model: string; model_name: string; boards: number; receipts: number
  cost_usd: number; cost_per_board_usd: number | null; boards_solved: number | null; boards_graded: number | null
  cost_per_solved_board_usd: number | null; basis: Record<string, number>
}
type Costs = { scope: string; total_usd: number; unknown_receipts: number; evaluations: Evaluation[] }

const url = (path: string) => `${import.meta.env.BASE_URL}evidence/${path}`
const usd = (value: number | null) => value === null ? '—' : value >= 1 ? `$${value.toFixed(2)}` : value >= 0.01 ? `$${value.toFixed(3)}` : `$${value.toFixed(4)}`
const basisText = (basis: Record<string, number>) => Object.entries(basis).map(([key, count]) => `${count} ${key}`).join(', ')
/** The two 36-board one-shot panels are the like-for-like cost and performance comparison. */
const PANELS = ['2026-10-16-frontier-image-panel', '2026-10-17-earlier-generations-panel']

/** OpenRouter cost per evaluation, board and model, from scoreboard.json (built from the receipts). */
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
  if (compact) {
    const rows = costs.evaluations.filter(row => PANELS.includes(row.study))
      .sort((a, b) => (b.boards_solved ?? 0) / Math.max(1, b.boards_graded ?? 1) - (a.boards_solved ?? 0) / Math.max(1, a.boards_graded ?? 1) || (a.cost_per_board_usd ?? 0) - (b.cost_per_board_usd ?? 0))
    return <DataTable caption="Cost and performance on the 36-board image panel (OpenRouter cost from receipts)" headers={['Model', 'Boards solved', 'Cost per board', 'Cost per solved board', 'Total', 'Evaluation']}
      rows={rows.map(row => [row.model_name, solved(row), usd(row.cost_per_board_usd), usd(row.cost_per_solved_board_usd), usd(row.cost_usd), row.study.startsWith('2026-10-16') ? 'Frontier, 16 Oct' : 'Earlier generation, 17 Oct'])} />
  }
  const studies = [...new Set(costs.evaluations.map(row => row.study))].sort()
  return <>
    <p>Every figure below is summed from the published receipts, per evaluation and model: total OpenRouter cost, cost per board, and cost per board solved where the evaluation grades whole boards. Across all {studies.length} evaluations, the receipts record <strong>{usd(costs.total_usd)}</strong> of OpenRouter spend.</p>
    <DataTable caption="OpenRouter cost by evaluation and model" headers={['Evaluation', 'Model', 'Boards', 'Requests', 'Cost', 'Per board', 'Boards solved', 'Per solved board', 'Cost basis']}
      rows={costs.evaluations.slice().sort((a, b) => a.study.localeCompare(b.study) || a.model_name.localeCompare(b.model_name)).map(row => [row.label, row.model_name, String(row.boards), String(row.receipts), usd(row.cost_usd), usd(row.cost_per_board_usd), solved(row), usd(row.cost_per_solved_board_usd), basisText(row.basis)])} />
    <Callout tone="caution" title="What the cost covers.">{costs.scope}
      <ul>
        <li><strong>Reported:</strong> <code>usage.cost</code> returned by OpenRouter with the response.</li>
        <li><strong>Derived:</strong> batch items report tokens but no per-item cost. Their cost is tokens × the batch price, with cached input at a tenth of the input price. That reproduces the billed batch total exactly.</li>
        <li><strong>Unbilled:</strong> an HTTP error before any generation, billed $0.</li>
        <li><strong>Unknown:</strong> {costs.unknown_receipts === 1 ? 'one client timeout' : `${costs.unknown_receipts} client timeouts`} with no generation ID, not counted.</li>
        <li><strong>Not included:</strong> requests not yet run or blocked by a budget limit.</li>
      </ul>
      <a href={url('scoreboard.json')} download>Cost data (JSON)</a></Callout>
  </>
}
