import { Fragment } from 'react'
import { useSavedOllamaStudy, type ResultRow, type Treatment } from './ollamaEvidence'

const ARMS: [Treatment, string][] = [['baseline', 'Plain'], ['caveman', 'Caveman']]
const SOLVED = ['strict', 'format_only']

/** The queen mark from the board receipts, filled to read as "solved". */
function Crown() {
  return <svg className="pair-crown" viewBox="6 6 20 27" aria-hidden="true">
    <path d="M8 12 12 19 16 10 20 19 24 12 22 25H10Z" /><path d="M10 28H22M9 31H23" />
  </svg>
}

/** The local pilot board by board, for both prompts, graded as the leaderboard grades it: a right answer in the
    wrong format still counts, drawn striped. Draws nothing it cannot match to a saved row. */
export function PairStrip() {
  const saved = useSavedOllamaStudy()
  if (saved.status === 'loading') return <p role="status">Loading the local results…</p>
  if (saved.status === 'error') return <p role="status">The local results could not load, so none are shown.</p>
  const rows = saved.summary.rows.filter(row => row.state === 'recorded')
  const find = (board: string, arm: Treatment): ResultRow | undefined => rows.find(row => row.board_id === board && row.treatment === arm)
  const sizes = [...new Set(rows.map(row => row.size))].sort((a, b) => a - b)
  const groups = sizes.map(size => ({ size, boards: [...new Set(rows.filter(row => row.size === size).map(row => row.board_id))] }))
  const boards = groups.flatMap(group => group.boards)
  if (!boards.length || boards.some(board => ARMS.some(([arm]) => !find(board, arm)))) return <p role="status">Some local results are missing, so the strip is hidden.</p>
  const solved = (board: string, arm: Treatment) => SOLVED.includes(find(board, arm)?.outcome ?? '')
  const count = (arm: Treatment) => boards.filter(board => solved(board, arm)).length
  const both = boards.filter(board => solved(board, 'baseline') && solved(board, 'caveman')).length
  const onlyCaveman = boards.filter(board => !solved(board, 'baseline') && solved(board, 'caveman')).length
  const onlyPlain = boards.filter(board => solved(board, 'baseline') && !solved(board, 'caveman')).length
  const label = `The same ${boards.length} boards with each prompt: plain solved ${count('baseline')}, Caveman ${count('caveman')}. Both solved ${both}, only Caveman ${onlyCaveman}, only plain ${onlyPlain}, neither ${boards.length - both - onlyCaveman - onlyPlain}.`
  return <figure className="pair-strip">
    <div className="pair-strip-groups" role="img" aria-label={label}>
      {groups.map(group => <div className="pair-group" key={group.size} style={{ gridTemplateColumns: `auto repeat(${group.boards.length}, 26px)` }}>
        <span className="pair-group-title">{group.size}×{group.size}</span>
        {ARMS.map(([arm, name]) => <Fragment key={arm}>
          <span className="pair-row-label">{name}</span>
          {group.boards.map(board => {
            const outcome = find(board, arm)?.outcome
            return <span key={board} className={`pair-cell${outcome === 'strict' ? ' is-solved' : outcome === 'format_only' ? ' is-loose' : ''}`}>{SOLVED.includes(outcome ?? '') && <Crown />}</span>
          })}
        </Fragment>)}
      </div>)}
    </div>
    <figcaption>The same {boards.length} boards with each prompt. A crown marks a solved board; striped, right but in the wrong format.</figcaption>
  </figure>
}
