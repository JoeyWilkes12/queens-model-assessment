import { useEffect, useMemo, useState } from 'react'
import { BoardReplay } from './BoardReplay'
import { deriveTrajectoryFrames, type RecordedTrajectory } from './trajectoryBoardData'

type SavedTrajectory = RecordedTrajectory & { correct_queens_before_failure: number; http_calls: number; forced_decisions: number }
type Board = { id: string; size: number; regions: number[][] }
type Loaded = { jev: { trajectories: SavedTrajectory[]; boards: Board[] }; subq: { trajectories: SavedTrajectory[] }; subqBoards: Board[] }

/**
 * Curated, fixed attempt IDs. Each is a genuine saved trajectory; the selection
 * shows a success, the other model on the same board, and the deepest failure.
 */
const showcase = [
  { key: 'subq-solve', tab: 'SubQ solves 5×5', model: 'subq', id: 'sequence-5-2_local_a1', title: 'SubQ Snap completes board 5-2', takeaway: 'All five filtered attempts on this board succeeded. The same board with the unfiltered menu failed 5/5 after one queen.' },
  { key: 'jev-same', tab: 'Jev, same board', model: 'jev', id: 'sequence-5-2_local_a1', title: 'Jev on the same board stops after one queen', takeaway: 'Same board, same filtered menu, same protocol. Jev chose a cell that obeys the local rules but cannot be extended to the unique solution.' },
  { key: 'jev-solve', tab: 'Jev solves another', model: 'jev', id: 'sequence-5-1_raw_a1', title: 'Jev completes board 5-1', takeaway: 'Jev solved this board in all ten attempts. This unfiltered attempt needed seven model decisions; with the filtered menu every cell was forced, so only the color order was Jev’s. SubQ stopped after one queen on this board every time.' },
  { key: 'nine', tab: 'Best 9×9 attempt', model: 'jev', id: 'sequence-9-2_local_a4', title: 'The deepest 9×9 attempt still dead-ends', takeaway: 'Five correct queens, then a legal cell off the only solution. Neither model solved a 9×9 here or on the 192-board panel. The greedy no-model rule completes this board.' },
] as const

const evidenceUrl = (file: string) => `${import.meta.env.BASE_URL}evidence/${file}`

async function loadJson(file: string, signal: AbortSignal) {
  const response = await fetch(evidenceUrl(file), { signal })
  if (!response.ok) throw new Error(`${file} unavailable`)
  return response.json()
}

export function FeaturedReplays() {
  const [data, setData] = useState<Loaded | null>(null)
  const [error, setError] = useState(false)
  const [active, setActive] = useState<(typeof showcase)[number]['key']>('subq-solve')

  useEffect(() => {
    const controller = new AbortController()
    Promise.all([
      loadJson('trajectory-study.json', controller.signal),
      loadJson('subq-trajectories-summary.json', controller.signal),
      loadJson('subq-trajectories-protocol.json', controller.signal),
    ]).then(([jev, subq, protocol]) => setData({ jev, subq, subqBoards: protocol.boards }))
      .catch(() => { if (!controller.signal.aborted) setError(true) })
    return () => controller.abort()
  }, [])

  const item = showcase.find(entry => entry.key === active) ?? showcase[0]
  const view = useMemo(() => {
    if (!data) return null
    const trajectories = item.model === 'jev' ? data.jev.trajectories : data.subq.trajectories
    const boards = item.model === 'jev' ? data.jev.boards : data.subqBoards
    const trace = trajectories.find(entry => entry.trajectory_id === item.id)
    const board = trace && boards.find(entry => entry.id === trace.board_id && entry.size === trace.size)
    if (!trace || !board) return null
    const regions = board.regions.map(row => row.map(region => String.fromCharCode(65 + region)))
    try {
      return { trace, regions, frames: deriveTrajectoryFrames(trace, regions, item.model === 'jev' ? '2026-09-30-jev-trajectories' : '2026-10-13-subq-trajectories') }
    } catch {
      return null
    }
  }, [data, item])

  const modelName = item.model === 'jev' ? 'Jev 1.13' : 'SubQ Snap'
  const chapter = item.model === 'jev' ? `#/jev-trajectories/${item.id}` : `#/subq-assessment/${item.id}`

  return <div className="featured-replays">
    <div className="featured-tabs" role="tablist" aria-label="Featured recorded attempts">
      {showcase.map(entry => <button key={entry.key} type="button" role="tab" id={`featured-tab-${entry.key}`} aria-selected={entry.key === active} aria-controls="featured-panel" className={entry.key === active ? 'is-active' : ''} onClick={() => setActive(entry.key)}>{entry.tab}</button>)}
    </div>
    <div id="featured-panel" role="tabpanel" aria-labelledby={`featured-tab-${item.key}`}>
      {error && <p role="status">The saved trajectory evidence could not be loaded. No replay is substituted.</p>}
      {!error && !data && <p role="status">Loading saved attempts…</p>}
      {data && !view && <p role="status">This saved attempt is unavailable; no trace is reconstructed.</p>}
      {view && <>
        <BoardReplay key={item.key} compact regions={view.regions} frames={view.frames} eyebrow={`${modelName} · board ${view.trace.board_id.replace('sequence-', '')} · ${view.trace.mode === 'local' ? 'conflict-filtered menu' : 'raw menu'}`} title={item.title} />
        <p className="featured-takeaway">{item.takeaway} <a href={chapter}>Open this attempt with its receipts</a>{item.key === 'nine' && <> or <a href="#/greedy-rule">watch the greedy rule solve it</a></>}.</p>
      </>}
    </div>
  </div>
}
