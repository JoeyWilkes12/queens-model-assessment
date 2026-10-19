import { useId } from 'react'

export type MiniQueen = { cell: readonly [number, number]; onSolution?: boolean; conflict?: boolean }

const CELL = 24

/** A static regional board for small multiples: region fills in the replay viewer's colors, queens,
    and two marks a reader must not miss: a ring on a queen that is off the unique solution, and an X
    on a queen that breaks a rule. */
export function MiniBoard({ regions, queens = [], label, size = 'small' }: { regions: string[][]; queens?: MiniQueen[]; label: string; size?: 'small' | 'large' | 'thumb' }) {
  const id = useId()
  const n = regions.length
  const order = [...new Set(regions.flat())]
  const index = new Map(order.map((name, value) => [name, value % 9]))
  const byCell = new Map(queens.map(queen => [`${queen.cell[0]},${queen.cell[1]}`, queen]))
  const off = queens.filter(queen => queen.onSolution === false).length
  const conflicts = queens.filter(queen => queen.conflict).length
  const extent = n * CELL
  return <svg className={`mini-board mini-board--${size}`} viewBox={`0 0 ${extent} ${extent}`} role="img" aria-labelledby={`${id}-t ${id}-d`}>
    <title id={`${id}-t`}>{label}</title>
    <desc id={`${id}-d`}>{n} by {n} board. {queens.length ? `${queens.length} queens: ${queens.map(q => `r${q.cell[0]}c${q.cell[1]}`).join(', ')}. ${off} off the unique solution; ${conflicts} breaking a rule.` : 'No queens shown.'}</desc>
    {regions.flatMap((row, r) => row.map((region, c) => {
      const queen = byCell.get(`${r + 1},${c + 1}`)
      return <g key={`${r}-${c}`} transform={`translate(${c * CELL} ${r * CELL})`}>
        <rect width={CELL} height={CELL} className={`board-replay-cell board-replay-region-${index.get(region)}`} />
        {size !== 'thumb' && <text x={2.5} y={8.5} className="mini-board-letter">{region}</text>}
        {queen && <g transform="translate(4 4) scale(.5)" className={`mini-board-queen${queen.onSolution === false ? ' is-off' : ''}`}>
          <path d="M8 12 12 19 16 10 20 19 24 12 22 25H10Z" /><path d="M10 28H22M9 31H23" />
          <circle cx="8" cy="10" r="2" /><circle cx="16" cy="8" r="2" /><circle cx="24" cy="10" r="2" />
        </g>}
        {queen?.onSolution === false && <circle cx={CELL / 2} cy={CELL / 2} r={10.5} className="mini-board-off" />}
        {queen?.conflict && <path d="M16 16 22 22M22 16 16 22" className="mini-board-conflict" />}
      </g>
    }))}
    <rect width={extent} height={extent} className="board-replay-edge" />
  </svg>
}
