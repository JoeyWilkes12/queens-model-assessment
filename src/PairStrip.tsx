import { Fragment } from 'react'
import { useSavedOllamaStudy, type Treatment } from './ollamaEvidence'

const ARMS: [Treatment, string][] = [['baseline', 'Plain'], ['caveman', 'Caveman']]

/** The queen mark from the board receipts, filled to read as "solved". */
function Crown() {
  return <svg className="pair-crown" viewBox="6 6 20 27" aria-hidden="true">
    <path d="M8 12 12 19 16 10 20 19 24 12 22 25H10Z" /><path d="M10 28H22M9 31H23" />
  </svg>
}

/** The local pilot's strict grades, board by board, for both prompts. Draws nothing it cannot match to a saved row. */
export function PairStrip() {
  const saved = useSavedOllamaStudy()
  if (saved.status === 'loading') return <p role="status">Loading the saved local runs…</p>
  if (saved.status === 'error') return <p role="status">The saved local runs could not be loaded. No results are substituted.</p>
  const rows = saved.summary.rows.filter(row => row.state === 'recorded')
  const solved = (board: string, arm: Treatment) => rows.find(row => row.board_id === board && row.treatment === arm)?.strict_correct
  const sizes = [...new Set(rows.map(row => row.size))].sort((a, b) => a - b)
  const groups = sizes.map(size => ({ size, boards: [...new Set(rows.filter(row => row.size === size).map(row => row.board_id))] }))
  const boards = groups.flatMap(group => group.boards)
  if (!boards.length || boards.some(board => ARMS.some(([arm]) => solved(board, arm) === undefined))) return <p role="status">Some saved local runs are missing, so no strip is drawn.</p>
  const count = (arm: Treatment) => boards.filter(board => solved(board, arm)).length
  return <figure className="pair-strip">
    <div className="pair-strip-groups" role="img" aria-label={`Strict grade, board by board: the plain prompt solved ${count('baseline')} of ${boards.length}, Caveman ${count('caveman')} of ${boards.length}.`}>
      {groups.map(group => <div className="pair-group" key={group.size} style={{ gridTemplateColumns: `auto repeat(${group.boards.length}, 26px)` }}>
        <span className="pair-group-title">{group.size}×{group.size}</span>
        {ARMS.map(([arm, label]) => <Fragment key={arm}>
          <span className="pair-row-label">{label}</span>
          {group.boards.map(board => <span key={board} className={`pair-cell${solved(board, arm) ? ' is-solved' : ''}`}>{solved(board, arm) && <Crown />}</span>)}
        </Fragment>)}
      </div>)}
    </div>
    <figcaption>The same {boards.length} boards under both prompts, strict grade. A crown marks a solved board.</figcaption>
  </figure>
}
