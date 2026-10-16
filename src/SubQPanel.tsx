import { useEffect, useMemo, useState, type ComponentType, type ReactNode } from 'react'
import { BoardReplay } from './BoardReplay'
import { deriveTrajectoryFrames, type RecordedTrajectory } from './trajectoryBoardData'

type Ui = {
  Callout: ComponentType<{ tone?: 'note' | 'evidence' | 'caution' | 'stop'; title: string; children: ReactNode }>
  DataTable: ComponentType<{ caption: string; headers: string[]; rows: (string | ReactNode)[][] }>
}
type SizeMode = { size: number; mode: string; boards: number; solved_trajectories: number; board_solve_rate_replicate1_cp95: [number, number]; mean_correct_placements: number; nonforced_cell_calls: number; nonforced_cell_accuracy: number | null; nonforced_uniform_chance: number | null; nonforced_mean_selected_probability: number | null; model_calls: number; forced_decisions: number }
type Paired = { both_solved: number; raw_only: number; local_only: number; neither: number; exact_mcnemar_p: number; holm_adjusted_p: number }
type Analysis = { by_size_mode: SizeMode[]; paired_raw_vs_local: Record<string, Paired>; baselines: Record<string, { size: number; greedy: { solved: boolean }; uniform_random_completion: { raw: number; local: number } }> }
type Trajectory = RecordedTrajectory & { correct_queens_before_failure: number; http_calls: number; forced_decisions: number }
type Corpus = { boards: { id: string; size: number; regions: number[][] }[] }

const STUDY = '2026-10-15-subq-new-board-panel'
const url = (path: string) => `${import.meta.env.BASE_URL}evidence/${path}`
const pct = (value: number) => `${Math.round(value * 100)}%`
const p = (value: number) => value < 0.001 ? '< 0.001' : value.toFixed(3)

export function SubQPanel({ ui }: { ui: Ui }) {
  const { Callout, DataTable } = ui
  const [state, setState] = useState<{ analysis: Analysis; corpus: Corpus; trajectories: Trajectory[] } | null>(null)
  const [error, setError] = useState(false)
  const [selected, setSelected] = useState('')

  useEffect(() => {
    const controller = new AbortController()
    const get = (path: string) => fetch(url(path), { signal: controller.signal }).then(response => { if (!response.ok) throw new Error(path); return response.json() })
    Promise.all([get('subq-panel/analysis.json'), get('subq-panel/corpus.json'), get('subq-panel/trajectories-summary.json')])
      .then(([analysis, corpus, summary]) => setState({ analysis, corpus, trajectories: summary.trajectories }))
      .catch(() => { if (!controller.signal.aborted) setError(true) })
    return () => controller.abort()
  }, [])

  const showcase = useMemo(() => {
    if (!state) return []
    const solved = state.trajectories.filter(t => t.stop_reason === 'solved').sort((a, b) => b.size - a.size || a.trajectory_id.localeCompare(b.trajectory_id))
    const deepest9 = state.trajectories.filter(t => t.size === 9).sort((a, b) => b.correct_queens_before_failure - a.correct_queens_before_failure)[0]
    return [...solved, ...(deepest9 ? [deepest9] : [])]
  }, [state])
  const current = state ? state.trajectories.find(t => t.trajectory_id === (selected || showcase[0]?.trajectory_id)) : undefined
  const replay = useMemo(() => {
    if (!state || !current) return null
    const board = state.corpus.boards.find(b => b.id === current.board_id && b.size === current.size)
    if (!board) return null
    const regions = board.regions.map(row => row.map(region => String.fromCharCode(65 + region)))
    try { return { regions, frames: deriveTrajectoryFrames(current, regions, STUDY) } } catch { return null }
  }, [state, current])

  if (error) return <p role="status">The saved panel evidence could not be loaded. No results are substituted.</p>
  if (!state) return <p role="status">Loading the saved new-board panel…</p>
  const { analysis } = state
  const sizes = [5, 7, 9]
  const boardsSolved = (size: number) => {
    const ids = new Set(state.trajectories.filter(t => t.size === size && t.stop_reason === 'solved').map(t => t.board_id))
    return ids.size
  }
  const baseline = (size: number) => Object.values(analysis.baselines).filter(b => b.size === size)
  return <>
    <p className="lead">On <strong>192 new boards</strong>, preregistered before any call, SubQ solved <strong>{sizes.reduce((sum, size) => sum + boardsSolved(size), 0)}</strong>. A greedy rule with no model solved <strong>{Object.values(analysis.baselines).filter(b => b.greedy.solved).length}</strong>.</p>
    <p>Each board had one raw-menu and one conflict-filtered attempt under the historical protocol. The boards were certified by three independent solvers and stratified by singleton regions and search difficulty. Jev has not been run on this panel yet: that needs the OpenRouter key.</p>
    <DataTable caption="Boards solved on the new-board panel" headers={['Size', 'SubQ (either menu)', 'Greedy rule', 'Random choice, expected']} rows={sizes.map(size => [`${size}×${size}`, `${boardsSolved(size)}/64`, `${baseline(size).filter(b => b.greedy.solved).length}/64`, `≈${baseline(size).reduce((sum, b) => sum + 1 - (1 - b.uniform_random_completion.raw) * (1 - b.uniform_random_completion.local), 0).toFixed(1)}`])} />
    <DataTable caption="Primary endpoint: filtered vs raw menu on the same boards (exact McNemar, Holm across sizes)" headers={['Size', 'Filtered solved', 'Raw solved', 'Filtered only / raw only', 'Holm p']} rows={sizes.map(size => {
      const pair = analysis.paired_raw_vs_local[String(size)]
      return [`${size}×${size}`, `${pair.both_solved + pair.local_only}/64`, `${pair.both_solved + pair.raw_only}/64`, `${pair.local_only} / ${pair.raw_only}`, p(pair.holm_adjusted_p)]
    })} />
    <DataTable caption="Per size and menu (non-forced cell decisions only)" headers={['Size · menu', '95% interval, solve rate', 'Picked an extendable cell', 'Random, same menus', 'Mean stated probability']} rows={analysis.by_size_mode.map(row => [`${row.size}×${row.size} · ${row.mode === 'local' ? 'filtered' : 'raw'}`, `${pct(row.board_solve_rate_replicate1_cp95[0])}–${pct(row.board_solve_rate_replicate1_cp95[1])}`, row.nonforced_cell_accuracy == null ? '—' : pct(row.nonforced_cell_accuracy), row.nonforced_uniform_chance == null ? '—' : pct(row.nonforced_uniform_chance), row.nonforced_mean_selected_probability == null ? '—' : pct(row.nonforced_mean_selected_probability)])} />
    <Callout tone="evidence" title="The filter helps at 5×5; nothing solves 9×9 except the heuristic.">The conflict filter raised SubQ's 5×5 first-path success from 6/64 to 15/64, significant after Holm adjustment. At 7×7, three filtered solves are too few to establish an effect, and at 9×9 neither menu solved a board. The greedy rule solved 14 of the same 9×9 boards.</Callout>
    {showcase.length > 0 && <>
      <label className="filter-label" htmlFor="subq-panel-select">Replay a panel attempt (all solved attempts, plus the deepest 9×9 failure)</label>
      <select id="subq-panel-select" className="trajectory-select" value={current?.trajectory_id ?? ''} onChange={event => setSelected(event.target.value)}>
        {showcase.map(t => <option key={t.trajectory_id} value={t.trajectory_id}>{t.trajectory_id} · {t.stop_reason.replace(/_/g, ' ')}</option>)}
      </select>
      {current && replay && <BoardReplay key={current.trajectory_id} regions={replay.regions} frames={replay.frames} eyebrow={`SubQ Snap · ${current.board_id} · ${current.mode === 'local' ? 'conflict-filtered menu' : 'raw menu'}`} title={current.stop_reason === 'solved' ? `Solved in ${current.http_calls} model calls and ${current.forced_decisions} forced moves` : `${current.correct_queens_before_failure} correct queens, then a dead end`} description="Recorded states from the new-board panel. Receipt links open the exact SubQ request and response." />}
    </>}
    <div className="next-actions"><a href={url('subq-panel/REPORT.md')} download>Download the panel report</a><a href={url('subq-panel/PREREGISTRATION.md')} download>Preregistration</a><a href={url('subq-panel/analysis.json')} download>Analysis (JSON)</a><a href={url('subq-panel/corpus.json')} download>Board corpus</a></div>
  </>
}
