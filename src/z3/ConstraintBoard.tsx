import { useRef, useState, type KeyboardEvent } from 'react'

/** Display state of one cell. Never derived from a saved solution. */
export type CellMark = {
  value?: boolean | null
  decision?: boolean
  badge?: string
  fresh?: boolean
  highlight?: boolean
  conflict?: boolean
  dim?: boolean
  learned?: boolean
  path?: boolean
  note?: string
}

export type ConstraintBoardProps = {
  regions: string[][]
  label: string
  mark?: (row: number, column: number) => CellMark | undefined
  selectedCell?: [number, number] | null
  onSelect?: (row: number, column: number) => void
  interactive?: boolean
  outlineRegions?: string[]
  bracketRows?: number[]
  compact?: boolean
  describeCell?: (row: number, column: number) => string
}

export function QueenGlyph({ className = '' }: { className?: string }) {
  return <svg className={`z3-queen ${className}`} viewBox="0 0 32 34" aria-hidden="true" focusable="false">
    <path d="M8 12 12 19 16 10 20 19 24 12 22 25H10Z" />
    <path d="M10 28H22M9 31H23" fill="none" />
    <circle cx="8" cy="10" r="2" /><circle cx="16" cy="8" r="2" /><circle cx="24" cy="10" r="2" />
  </svg>
}

const stateWords = (mark?: CellMark) => {
  if (!mark) return 'unassigned'
  const value = mark.value === true ? 'queen (true)' : mark.value === false ? 'excluded (false)' : 'unassigned'
  const extra = [mark.decision && 'decision', mark.learned && 'by a learned clause', mark.conflict && 'in the conflict clause', mark.highlight && 'highlighted', mark.path && 'on the highlighted path', mark.note].filter(Boolean)
  return extra.length ? `${value}; ${extra.join('; ')}` : value
}

/**
 * Shared board renderer for explicit states: unassigned, true (queen glyph)
 * and false (×). Region letters always remain visible; color is secondary.
 * Interactive boards use native buttons with roving focus and arrow keys.
 */
export function ConstraintBoard({ regions, label, mark, selectedCell, onSelect, interactive = false, outlineRegions = [], bracketRows = [], compact = false, describeCell }: ConstraintBoardProps) {
  const n = regions.length
  const labels = [...new Set(regions.flat())].sort()
  const regionIndex = new Map(labels.map((name, i) => [name, i % 9]))
  const [focus, setFocus] = useState<[number, number]>(selectedCell ?? [1, 1])
  const gridRef = useRef<HTMLDivElement>(null)
  const outline = new Set(outlineRegions)
  const brackets = new Set(bracketRows)

  const moveFocus = (row: number, column: number) => {
    const r = Math.min(n, Math.max(1, row)), c = Math.min(n, Math.max(1, column))
    setFocus([r, c])
    gridRef.current?.querySelector<HTMLButtonElement>(`[data-cell="${r}-${c}"]`)?.focus()
  }
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!interactive) return
    const [r, c] = focus
    const moves: Record<string, [number, number]> = { ArrowUp: [r - 1, c], ArrowDown: [r + 1, c], ArrowLeft: [r, c - 1], ArrowRight: [r, c + 1], Home: [r, 1], End: [r, n] }
    const target = moves[event.key]
    if (target) { event.preventDefault(); moveFocus(...target) }
  }

  const edge = (r: number, c: number, dr: number, dc: number) => {
    const region = regions[r - 1][c - 1]
    const other = regions[r - 1 + dr]?.[c - 1 + dc]
    return other !== region
  }

  return <div className={`z3-board-wrap${compact ? ' z3-board-wrap--compact' : ''}`}>
    <div ref={gridRef} className="z3-board" role="grid" aria-label={label} style={{ ['--n' as string]: n }} onKeyDown={onKeyDown}>
      <div role="row" className="z3-board-row">
        <span className="z3-axis z3-axis-corner" aria-hidden="true" />
        {regions.map((_, c) => <span role="columnheader" className="z3-axis" key={c}><span className="sr-only">column </span>{c + 1}</span>)}
      </div>
      {regions.map((row, r) => <div role="row" className="z3-board-row" key={r}>
        <span role="rowheader" className={`z3-axis z3-axis-row${brackets.has(r + 1) ? ' is-bracketed' : ''}`}><span className="sr-only">row </span>{r + 1}</span>
        {row.map((region, c) => {
          const R = r + 1, C = c + 1
          const m = mark?.(R, C)
          const selected = selectedCell?.[0] === R && selectedCell?.[1] === C
          const isOutlined = outline.has(region)
          const classes = [
            'z3-cell', `z3-region-${regionIndex.get(region)}`,
            m?.value === true && 'is-true', m?.value === false && 'is-false',
            m?.decision && 'is-decision', m?.fresh && 'is-fresh', m?.highlight && 'is-highlight',
            m?.conflict && 'is-conflict', m?.dim && 'is-dim', m?.path && 'is-path', selected && 'is-selected',
            brackets.has(R) && 'in-bracket',
            edge(R, C, -1, 0) && 'rb-t', edge(R, C, 1, 0) && 'rb-b', edge(R, C, 0, -1) && 'rb-l', edge(R, C, 0, 1) && 'rb-r',
            isOutlined && edge(R, C, -1, 0) && 'ol-top', isOutlined && edge(R, C, 1, 0) && 'ol-bottom',
            isOutlined && edge(R, C, 0, -1) && 'ol-left', isOutlined && edge(R, C, 0, 1) && 'ol-right',
          ].filter(Boolean).join(' ')
          const description = `r${R}c${C}, region ${region}, ${stateWords(m)}${selected ? ', selected' : ''}${describeCell ? `. ${describeCell(R, C)}` : ''}`
          const content = <>
            <span className="z3-cell-letter" aria-hidden="true">{region}</span>
            {m?.value === true && <QueenGlyph />}
            {m?.value === false && <span className="z3-cell-x" aria-hidden="true">×</span>}
            {m?.badge && <span className={`z3-cell-badge${m.learned ? ' is-learned' : ''}`} aria-hidden="true">{m.badge}</span>}
          </>
          return <div role="gridcell" className={classes} key={c} aria-selected={interactive ? selected : undefined}>
            {interactive
              ? <button type="button" data-cell={`${R}-${C}`} tabIndex={focus[0] === R && focus[1] === C ? 0 : -1} aria-label={description} aria-pressed={selected} onFocus={() => setFocus([R, C])} onClick={() => { setFocus([R, C]); onSelect?.(R, C) }}>{content}</button>
              : <span className="z3-cell-static" aria-label={description} role="img">{content}</span>}
          </div>
        })}
      </div>)}
    </div>
  </div>
}
