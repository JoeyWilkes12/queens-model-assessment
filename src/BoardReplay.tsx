import { useEffect, useId, useMemo, useRef, useState } from 'react'
import './board-replay.css'

/** All coordinates are 1-based; these are supplied evidence, not solver output. */
export type Cell = readonly [number, number]

export type BoardFrame = {
  id: string
  label: string
  queens: Cell[]
  candidateCells?: Cell[]
  highlightRegion?: string
  selectedCell?: Cell
  selectedCellLabel?: string
  note: string
  sourceLabel: string
  receiptLinks?: { label: string; id: string }[]
  invalidCells?: Cell[]
}

export type BoardReplayProps = {
  regions: string[][]
  frames: BoardFrame[]
  title: string
  description?: string
  /** Static receipt comparisons must not suggest a progressive solving trace. */
  allowPlayback?: boolean
}

const PLAYBACK_MILLISECONDS = 1800
const CELL_SIZE = 42
const AXIS_SIZE = 24

const cellKey = ([row, column]: Cell) => `${row},${column}`
const cellText = ([row, column]: Cell) => `r${row}c${column}`
const cellList = (cells: Cell[]) => cells.length ? cells.map(cellText).join(' · ') : 'None'
const inBoard = ([row, column]: Cell, size: number) => Number.isInteger(row) && Number.isInteger(column) && row >= 1 && column >= 1 && row <= size && column <= size

function QueenShape({ className = '' }: { className?: string }) {
  return <g className={className} aria-hidden="true">
    <path d="M8 12 12 19 16 10 20 19 24 12 22 25H10Z" />
    <path d="M10 28H22M9 31H23" />
    <circle cx="8" cy="10" r="2" /><circle cx="16" cy="8" r="2" /><circle cx="24" cy="10" r="2" />
  </g>
}

function useReducedMotion() {
  const [reduced, setReduced] = useState(() => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReduced(preference.matches)
    update()
    preference.addEventListener('change', update)
    return () => preference.removeEventListener('change', update)
  }, [])
  return reduced
}

/** A read-only view of saved states. It never fills missing cells or searches. */
export function BoardReplay({ regions, frames, title, description, allowPlayback = true }: BoardReplayProps) {
  const id = useId()
  const rootRef = useRef<HTMLElement>(null)
  const reducedMotion = useReducedMotion()
  const signature = JSON.stringify([regions, frames])
  const [position, setPosition] = useState({ signature, index: 0, playing: false })
  const sameData = position.signature === signature
  const index = sameData ? Math.min(position.index, Math.max(0, frames.length - 1)) : 0
  const playing = sameData && position.playing && allowPlayback && !reducedMotion
  const frame = frames[index]
  const size = regions.length
  const validBoard = size > 0 && regions.every(row => row.length === size && row.every(region => typeof region === 'string' && region.length > 0))
  const regionNames = useMemo(() => [...new Set(regions.flat())], [regions])
  const regionIndex = new Map(regionNames.map((name, value) => [name, value % 9]))
  // A shared alias scheme prevents collisions with an original short label.
  const useAliases = regionNames.some(name => !/^[A-Za-z0-9]{1,2}$/.test(name))
  const regionLabels = new Map(regionNames.map((name, value) => [name, useAliases ? String(value + 1) : name]))
  const queens = frame?.queens || []
  const regionOccupancy = new Map(regionNames.map(name => [name, 0]))
  queens.forEach(cell => {
    if (!inBoard(cell, size) || !validBoard) return
    const region = regions[cell[0] - 1][cell[1] - 1]
    regionOccupancy.set(region, (regionOccupancy.get(region) || 0) + 1)
  })
  const candidates = frame?.candidateCells || []
  const invalid = new Set((frame?.invalidCells || []).map(cellKey))
  const candidateKeys = new Set(candidates.map(cellKey))
  const queenCounts = new Map<string, number>()
  queens.forEach(cell => queenCounts.set(cellKey(cell), (queenCounts.get(cellKey(cell)) || 0) + 1))
  const selectedKey = frame?.selectedCell ? cellKey(frame.selectedCell) : null
  const outside = [...queens, ...candidates, ...(frame?.invalidCells || []), ...(frame?.selectedCell ? [frame.selectedCell] : [])].filter(cell => !inBoard(cell, size))
  const unplottable = [...new Map(outside.map(cell => [cellKey(cell), cell])).values()]

  useEffect(() => {
    setPosition({ signature, index: 0, playing: false })
  }, [signature])

  useEffect(() => {
    if (reducedMotion) setPosition(previous => ({ ...previous, playing: false }))
  }, [reducedMotion])

  useEffect(() => {
    const pause = () => setPosition(previous => previous.playing ? { ...previous, playing: false } : previous)
    const onVisibility = () => { if (document.hidden) pause() }
    document.addEventListener('visibilitychange', onVisibility)
    // A hidden/offscreen viewer never continues an illustrative sequence.
    const observer = typeof IntersectionObserver !== 'undefined' ? new IntersectionObserver(entries => {
      if (entries.some(entry => !entry.isIntersecting)) pause()
    }) : null
    if (rootRef.current) observer?.observe(rootRef.current)
    return () => { document.removeEventListener('visibilitychange', onVisibility); observer?.disconnect() }
  }, [])

  useEffect(() => {
    if (!playing || !validBoard || frames.length < 2) return
    if (index >= frames.length - 1 || document.hidden) {
      setPosition(previous => ({ ...previous, playing: false }))
      return
    }
    const timer = window.setTimeout(() => {
      setPosition(previous => previous.signature === signature ? {
        ...previous,
        index: Math.min(previous.index + 1, frames.length - 1),
        playing: previous.index + 1 < frames.length - 1,
      } : previous)
    }, PLAYBACK_MILLISECONDS)
    return () => window.clearTimeout(timer)
  }, [playing, index, signature, frames.length, validBoard])

  const goTo = (next: number) => setPosition({ signature, index: Math.max(0, Math.min(next, frames.length - 1)), playing: false })
  const togglePlayback = () => {
    if (!allowPlayback || reducedMotion || document.hidden || frames.length < 2) return
    setPosition({ signature, index: index === frames.length - 1 ? 0 : index, playing: !playing })
  }
  const boardExtent = AXIS_SIZE + size * CELL_SIZE + 2

  return <section className="board-replay" ref={rootRef} aria-labelledby={`${id}-heading`}>
    <header className="board-replay-heading">
      <h3 id={`${id}-heading`}>{title}</h3>
      {description && <p>{description}</p>}
    </header>
    {!validBoard ? <p className="board-replay-unavailable" role="status">This record does not contain a complete square region map. No board has been inferred.</p>
      : !frame ? <p className="board-replay-unavailable" role="status">No saved board states are available for this record.</p>
      : <>
        <div className="board-replay-content">
          <figure className="board-replay-figure">
            <div className="board-replay-board-scroll" tabIndex={0} role="region" aria-label="Queens board; scroll horizontally if needed" aria-describedby={`${id}-board-caption`}>
            <svg className="board-replay-board" style={{ minWidth: boardExtent }} viewBox={`0 0 ${boardExtent} ${boardExtent}`} role="img" aria-labelledby={`${id}-board-title ${id}-board-description`}>
              <title id={`${id}-board-title`}>{size} by {size} regional Queens board: {frame.label}</title>
              <desc id={`${id}-board-description`}>Row and column numbers start at one. Region labels identify the supplied partition{useAliases ? '; numbered aliases are explained in the region occupancy legend' : ''}. {queens.length} supplied queen markers; {candidates.length} supplied candidate cells. The written state below preserves every coordinate.</desc>
              {regions.map((_, row) => <g key={`axis-${row}`} className="board-replay-axis">
                <text x={AXIS_SIZE + row * CELL_SIZE + CELL_SIZE / 2} y={14} textAnchor="middle">{row + 1}</text>
                <text x={11} y={AXIS_SIZE + row * CELL_SIZE + CELL_SIZE / 2 + 4} textAnchor="middle">{row + 1}</text>
              </g>)}
              {regions.flatMap((row, rowIndex) => row.map((region, columnIndex) => {
                const key = `${rowIndex + 1},${columnIndex + 1}`
                const queenCount = queenCounts.get(key) || 0
                const isCandidate = candidateKeys.has(key)
                const isSelected = selectedKey === key
                const isInvalid = invalid.has(key)
                const highlighted = frame.highlightRegion === region
                return <g key={key} transform={`translate(${AXIS_SIZE + columnIndex * CELL_SIZE} ${AXIS_SIZE + rowIndex * CELL_SIZE})`}>
                  <title>{`Row ${rowIndex + 1}, column ${columnIndex + 1}, region ${region}${queenCount ? `; ${queenCount} queen marker${queenCount === 1 ? '' : 's'}` : ''}${isCandidate ? '; candidate' : ''}${isSelected ? '; selected' : ''}${isInvalid ? '; flagged invalid by source' : ''}`}</title>
                  <rect width={CELL_SIZE} height={CELL_SIZE} className={`board-replay-cell board-replay-region-${regionIndex.get(region)}${highlighted ? ' is-highlighted' : ''}`} />
                  <text x={4} y={12} className="board-replay-region-letter">{regionLabels.get(region)}</text>
                  {isCandidate && <circle cx={21} cy={28} r={10} className="board-replay-candidate" />}
                  {queenCount > 0 && <g transform="translate(9 15) scale(.75)"><QueenShape className="board-replay-queen" /></g>}
                  {queenCount > 1 && <text x={39} y={12} className="board-replay-duplicate" textAnchor="end">×{queenCount < 10 ? queenCount : '+'}</text>}
                  {isSelected && <rect x={3} y={3} width={36} height={36} className="board-replay-selected" />}
                  {isInvalid && <g className="board-replay-invalid"><path d="M31 30 39 38M39 30 31 38" /><rect x={1.5} y={1.5} width={39} height={39} /></g>}
                </g>
              }))}
              <rect x={AXIS_SIZE} y={AXIS_SIZE} width={size * CELL_SIZE} height={size * CELL_SIZE} className="board-replay-edge" />
            </svg>
            </div>
            <figcaption id={`${id}-board-caption`}>{size}×{size} · 1-based coordinates. Scroll the board horizontally if needed to keep labels readable. Viewer colors distinguish region labels; they are not a new model input.</figcaption>
            <div className="board-replay-occupancy">
              <h4>Queens per region</h4>
              <p>Evaluator-derived counts of the supplied markers, not a correctness grade. Empty regions can be expected in partial states.{useAliases ? ' Numbered board aliases map to the full supplied labels below.' : ''}</p>
              <ul aria-label="Region occupancy">{regionNames.map(region => {
                const count = regionOccupancy.get(region) || 0
                return <li key={region}>
                  <span className={`board-replay-region-swatch board-replay-region-${regionIndex.get(region)}`} aria-hidden="true" />
                  <span className="board-replay-region-name">{useAliases ? `${regionLabels.get(region)} = ${region}` : region}</span>
                  <strong>{count}<span className="board-replay-count-description">{count === 0 ? ' · empty' : count > 1 ? ' · repeated' : ''}</span></strong>
                </li>
              })}</ul>
              {queens.some(cell => !inBoard(cell, size)) && <p>Out-of-board queen coordinates are not assigned to a region.</p>}
            </div>
          </figure>
          <div className="board-replay-state">
            <div className="board-replay-current" aria-live="polite" aria-atomic="true">
              <span className="board-replay-frame-number">State {index + 1} of {frames.length}</span>
              <h4>{frame.label}</h4>
              <p>{frame.note}</p>
            </div>
            <dl className="board-replay-facts">
              <div><dt>Evidence source</dt><dd>{frame.sourceLabel}</dd></div>
              {frame.highlightRegion && <div><dt>Highlighted region</dt><dd>{frame.highlightRegion}</dd></div>}
              {frame.selectedCell && <div><dt>{frame.selectedCellLabel || 'Selected cell'}</dt><dd>{cellText(frame.selectedCell)}</dd></div>}
            </dl>
            {!!frame.receiptLinks?.length && <nav className="board-replay-receipts" aria-label="Receipts for this board state">{frame.receiptLinks.map(link => <a href={`#/evidence-atlas/${link.id}`} key={`${link.id}-${link.label}`}>{link.label}</a>)}</nav>}
            <ul className="board-replay-key" aria-label="Board marker legend">
              <li><svg viewBox="0 0 32 36" width="22" height="24" aria-hidden="true"><QueenShape className="board-replay-queen" /></svg>Queen placement</li>
              {!!candidates.length && <li><span className="board-replay-key-candidate" />Candidate cell</li>}
              {frame.selectedCell && <li><span className="board-replay-key-selected" />{frame.selectedCellLabel || 'Selected cell'}</li>}
              {!!frame.invalidCells?.length && <li><span className="board-replay-key-invalid" />Flagged by saved evaluation</li>}
            </ul>
            {!!unplottable.length && <p className="board-replay-warning">Coordinates outside this board are preserved in the written state, not plotted: {cellList(unplottable)}.</p>}
          </div>
        </div>
        {frames.length > 1 && <div className="board-replay-controls">
          <div className="board-replay-buttons">
            <button type="button" onClick={() => goTo(index - 1)} disabled={index === 0}>Previous state</button>
            {allowPlayback && <button type="button" className="board-replay-play" onClick={togglePlayback} disabled={reducedMotion} aria-pressed={playing} aria-describedby={`${id}-cadence`}>{playing ? 'Pause' : index === frames.length - 1 ? 'Replay states' : 'Play states'}</button>}
            <button type="button" onClick={() => goTo(index + 1)} disabled={index === frames.length - 1}>Next state</button>
          </div>
          <label className="board-replay-scrubber" htmlFor={`${id}-scrubber`}><span>Saved state</span><input id={`${id}-scrubber`} type="range" min={0} max={frames.length - 1} step={1} value={index} onChange={event => goTo(Number(event.target.value))} aria-valuetext={`State ${index + 1} of ${frames.length}: ${frame.label}`} /><output htmlFor={`${id}-scrubber`}>{index + 1}/{frames.length}</output></label>
          <p className="board-replay-cadence" id={`${id}-cadence`}>{!allowPlayback ? 'Static comparison of recorded input and visible output. Use Previous, Next or the slider; no intermediate solving order is inferred.' : reducedMotion ? 'Reduced motion is enabled. Use Previous, Next or the slider to inspect each state.' : 'Playback advances saved states every 1.8 seconds for illustration. It does not represent API latency, model thinking speed or an unrecorded search path.'}</p>
        </div>}
        <details className="board-replay-written">
          <summary>Written equivalent of this state</summary>
          <dl>
            <div><dt>Queen coordinates</dt><dd>{cellList(queens)}</dd></div>
            <div><dt>Candidate coordinates</dt><dd>{cellList(candidates)}</dd></div>
            <div><dt>Flagged coordinates</dt><dd>{cellList(frame.invalidCells || [])}</dd></div>
            {frame.selectedCell && <div><dt>{frame.selectedCellLabel || 'Selected cell'}</dt><dd>{cellText(frame.selectedCell)}</dd></div>}
          </dl>
          <p>Supplied region matrix, row by row:</p>
          <pre>{regions.map(row => row.join(' ')).join('\n')}</pre>
          <p>No missing placement or intermediate decision is generated by this viewer.</p>
        </details>
      </>}
  </section>
}

export default BoardReplay
