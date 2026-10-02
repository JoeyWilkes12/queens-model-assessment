import { useId } from 'react'
import type { FailureComparisonData } from './failureComparisonData'
import './failure-comparison.css'

type Cell = FailureComparisonData['solutionQueens'][number]

const CELL_SIZE = 42
const AXIS_SIZE = 24
const cellKey = ([row, column]: Cell) => `${row},${column}`
const cellText = ([row, column]: Cell) => `r${row}c${column}`
const cellList = (cells: readonly Cell[]) => cells.length ? cells.map(cellText).join(' · ') : 'None'
const inBoard = ([row, column]: Cell, size: number) => Number.isInteger(row) && Number.isInteger(column) && row >= 1 && column >= 1 && row <= size && column <= size

/** The same authored crown used by the saved-state board viewer. */
function Crown({ mismatch = false }: { mismatch?: boolean }) {
  return <g className={`failure-comparison-crown${mismatch ? ' is-mismatch' : ''}`} aria-hidden="true">
    <path d="M8 12 12 19 16 10 20 19 24 12 22 25H10Z" />
    <path d="M10 28H22M9 31H23" />
    <circle cx="8" cy="10" r="2" /><circle cx="16" cy="8" r="2" /><circle cx="24" cy="10" r="2" />
  </g>
}

function partitionBoundaryPath(regions: string[][]) {
  const segments: string[] = []
  regions.forEach((row, rowIndex) => row.forEach((region, columnIndex) => {
    const x = AXIS_SIZE + columnIndex * CELL_SIZE
    const y = AXIS_SIZE + rowIndex * CELL_SIZE
    if (columnIndex > 0 && region !== row[columnIndex - 1]) segments.push(`M${x} ${y}v${CELL_SIZE}`)
    if (rowIndex > 0 && region !== regions[rowIndex - 1][columnIndex]) segments.push(`M${x} ${y}h${CELL_SIZE}`)
  }))
  return segments.join(' ')
}

type ComparisonBoardProps = {
  id: string
  title: string
  regions: string[][]
  queens: readonly Cell[]
  regionNames: string[]
  labels: Map<string, string>
  mismatchCells?: readonly Cell[]
  conflictCells?: readonly Cell[]
}

function ComparisonBoard({ id, title, regions, queens, regionNames, labels, mismatchCells = [], conflictCells = [] }: ComparisonBoardProps) {
  const size = regions.length
  const extent = AXIS_SIZE + size * CELL_SIZE + 2
  const regionIndex = new Map(regionNames.map((region, index) => [region, index % 9]))
  const mismatches = new Set(mismatchCells.map(cellKey))
  const conflicts = new Set(conflictCells.map(cellKey))
  const queenCounts = new Map<string, number>()
  queens.forEach(cell => queenCounts.set(cellKey(cell), (queenCounts.get(cellKey(cell)) || 0) + 1))

  return <svg className="failure-comparison-board" width={extent} height={extent} style={{ minWidth: extent }} viewBox={`0 0 ${extent} ${extent}`} role="img" aria-labelledby={`${id}-title ${id}-description`}>
    <title id={`${id}-title`}>{size} by {size} Queens board: {title}</title>
    <desc id={`${id}-description`}>Rows and columns use one-based coordinates. Letter or numbered labels identify regions; thick lines separate different regions. {queens.length} queen markers are supplied. An outlined ring around a crown marks a difference from the unique reference. An inset cell outline with an X marks a recomputed local-rule conflict. Written coordinates, conflicts and the complete region partition follow the boards.</desc>
    {regions.map((_, index) => <g className="failure-comparison-axis" key={`axis-${index}`}>
      <text x={AXIS_SIZE + index * CELL_SIZE + CELL_SIZE / 2} y={14} textAnchor="middle">{index + 1}</text>
      <text x={11} y={AXIS_SIZE + index * CELL_SIZE + CELL_SIZE / 2 + 4} textAnchor="middle">{index + 1}</text>
    </g>)}
    {regions.flatMap((row, rowIndex) => row.map((region, columnIndex) => <g key={`cell-${rowIndex}-${columnIndex}`} transform={`translate(${AXIS_SIZE + columnIndex * CELL_SIZE} ${AXIS_SIZE + rowIndex * CELL_SIZE})`}>
      <rect width={CELL_SIZE} height={CELL_SIZE} className={`failure-comparison-cell failure-comparison-region-${regionIndex.get(region)}`} />
      <text x={4} y={12} className="failure-comparison-region-label">{labels.get(region)}</text>
    </g>))}
    <path d={partitionBoundaryPath(regions)} className="failure-comparison-region-boundary" />
    {regions.flatMap((row, rowIndex) => row.map((region, columnIndex) => {
      const key = `${rowIndex + 1},${columnIndex + 1}`
      const count = queenCounts.get(key) || 0
      const mismatch = mismatches.has(key)
      const conflict = conflicts.has(key)
      return <g key={`marker-${key}`} transform={`translate(${AXIS_SIZE + columnIndex * CELL_SIZE} ${AXIS_SIZE + rowIndex * CELL_SIZE})`}>
        <title>{`Row ${rowIndex + 1}, column ${columnIndex + 1}, region ${region}${count ? `; ${count} queen marker${count === 1 ? '' : 's'}` : ''}${mismatch ? '; differs from the evaluator reference' : ''}${conflict ? '; recomputed local-rule conflict' : ''}`}</title>
        {count > 0 && <>
          {mismatch && <circle cx={21} cy={26} r={13.5} className="failure-comparison-mismatch-ring" />}
          <g transform="translate(7.4 8) scale(.85)"><Crown mismatch={mismatch} /></g>
        </>}
        {count > 1 && <text x={38} y={39} textAnchor="end" className="failure-comparison-duplicate">×{count}</text>}
        {conflict && <g className="failure-comparison-conflict-mark" aria-hidden="true">
          <rect x={2.5} y={2.5} width={37} height={37} />
          <path d="M32 5 38 11M38 5 32 11" />
        </g>}
      </g>
    }))}
    <rect x={AXIS_SIZE} y={AXIS_SIZE} width={size * CELL_SIZE} height={size * CELL_SIZE} className="failure-comparison-edge" />
  </svg>
}

function RegionCounts({ regions, regionNames, labels, queens }: { regions: string[][]; regionNames: string[]; labels: Map<string, string>; queens: readonly Cell[] | null }) {
  if (queens === null) return <span>Not available without a recoverable placement.</span>
  const counts = new Map(regionNames.map(region => [region, 0]))
  queens.forEach(cell => {
    if (!inBoard(cell, regions.length)) return
    const region = regions[cell[0] - 1][cell[1] - 1]
    counts.set(region, (counts.get(region) || 0) + 1)
  })
  return <span className="failure-comparison-region-counts">{regionNames.map(region => <span key={region}>{labels.get(region)}: <strong>{counts.get(region)}</strong></span>)}</span>
}

/** Read-only evaluator annotations. This view never repairs or completes an answer. */
export function FailureComparison({ data }: { data: FailureComparisonData }) {
  const id = useId()
  const size = data.regions.length
  const validBoard = size > 0 && data.regions.every(row => row.length === size && row.every(region => typeof region === 'string' && region.length > 0))
  const extent = AXIS_SIZE + size * CELL_SIZE + 2
  const regionNames = [...new Set(data.regions.flat())]
  const useAliases = regionNames.some(region => !/^[A-Za-z0-9]{1,2}$/.test(region))
  const labels = new Map(regionNames.map((region, index) => [region, useAliases ? String(index + 1) : region]))
  const outside = [...(data.modelQueens || []), ...data.solutionQueens, ...data.mismatchedCells, ...data.conflictCells].filter(cell => !inBoard(cell, size))
  const unplottable = [...new Map(outside.map(cell => [cellKey(cell), cell])).values()]
  const panes = [
    { key: 'model', heading: 'Recorded model response', label: data.modelLabel, queens: data.modelQueens },
    { key: 'reference', heading: 'Evaluator reference: unique legal solution', label: 'Identified reference, not a model attempt', queens: data.solutionQueens },
  ]

  return <section className="failure-comparison" aria-labelledby={`${id}-heading`}>
    <header className="failure-comparison-heading">
      <h2 id={`${id}-heading`}>Model response versus unique solution</h2>
      <p className="failure-comparison-disclosure">Evaluator-side reference and highlights, added after evaluation; not a repaired model response or an additional attempt. The right-hand placement is identified here as the reference, not as the recorded answer. These are recomputed annotations, not saved cell-level grade flags.</p>
    </header>

    {!validBoard && <p className="failure-comparison-warning">A complete square region map is not available for this record. No board has been inferred; supplied coordinates remain written below.</p>}

    <div className="failure-comparison-panes">
      {panes.map(pane => <figure className="failure-comparison-pane" key={pane.key} aria-labelledby={`${id}-${pane.key}-heading`}>
        <figcaption className="failure-comparison-pane-heading">
          <h3 id={`${id}-${pane.key}-heading`}>{pane.heading}</h3>
          <p>{pane.label}</p>
        </figcaption>
        {validBoard && <div className="failure-comparison-board-scroll" tabIndex={0} role="region" aria-label={`${pane.heading}; scroll horizontally if needed`} aria-describedby={`${id}-scroll-guidance`}>
          {pane.queens === null ? <div className="failure-comparison-no-placement" style={{ minHeight: extent }}>
            <strong>No recoverable placement</strong>
            <p>No model queens are drawn. The evaluator reference is not substituted for the response.</p>
          </div> : <ComparisonBoard id={`${id}-${pane.key}-board`} title={pane.heading} regions={data.regions} queens={pane.queens} regionNames={regionNames} labels={labels} mismatchCells={pane.key === 'model' ? data.mismatchedCells : []} conflictCells={pane.key === 'model' ? data.conflictCells : []} />}
        </div>}
        <dl className="failure-comparison-pane-facts">
          <div><dt>Queen coordinates</dt><dd>{pane.queens === null ? 'No recoverable placement' : cellList(pane.queens)}</dd></div>
          <div><dt>Placement status</dt><dd>{pane.key === 'reference' ? 'Complete evaluator reference' : pane.queens === null ? 'No placement to compare' : data.complete ? `Complete recorded placement · ${pane.queens.length} queens` : `Partial recorded placement · ${pane.queens.length} queens; no missing queens filled in`}</dd></div>
          {validBoard && <div><dt>Queens per region</dt><dd><RegionCounts regions={data.regions} regionNames={regionNames} labels={labels} queens={pane.queens} /></dd></div>}
        </dl>
      </figure>)}
    </div>

    <p className="failure-comparison-scroll-guidance" id={`${id}-scroll-guidance`}>{validBoard ? `${size}×${size} · ` : ''}Coordinates start at 1. Shown boards share the same cell scale. Scroll within either board when needed; labels do not shrink to fit.</p>

    <ul className="failure-comparison-legend" aria-label="Comparison marker legend">
      <li><svg viewBox="0 0 32 36" width="24" height="27" aria-hidden="true"><Crown /></svg><span><strong>Crown:</strong> a supplied queen placement.</span></li>
      <li><svg viewBox="0 0 42 42" width="30" height="30" aria-hidden="true"><circle cx="21" cy="23" r="16" className="failure-comparison-mismatch-ring" /><g transform="translate(7.4 5) scale(.85)"><Crown mismatch /></g></svg><span><strong>Red ring and crown:</strong> a recorded queen differs from the unique reference.</span></li>
      <li><svg viewBox="0 0 30 30" width="27" height="27" aria-hidden="true"><g className="failure-comparison-conflict-key"><rect x="2" y="2" width="26" height="26" /><path d="M10 10 20 20M20 10 10 20" /></g></svg><span><strong>Red cell outline and X:</strong> an occupied cell participates in a recomputed local-rule conflict.</span></li>
      <li><svg viewBox="0 0 30 30" width="27" height="27" aria-hidden="true"><path d="M3 15H27" className="failure-comparison-boundary-key" /></svg><span><strong>Thick boundary:</strong> adjacent cells belong to different labelled regions.</span></li>
    </ul>

    <div className="failure-comparison-annotations">
      <div className="failure-comparison-differences">
        <h3>Reference comparison</h3>
        {data.modelQueens === null ? <p>No recoverable placement to compare with the reference.</p> : <>
          <p>{data.matchingCells} recorded queen{data.matchingCells === 1 ? '' : 's'} match{data.matchingCells === 1 ? 'es' : ''} the unique reference.</p>
          <p><strong>Different recorded cells:</strong> {cellList(data.mismatchedCells)}</p>
        </>}
        <p>A reference mismatch is not necessarily a direct local-rule violation. Format compliance is separate from the geometry; a format-only failure receives no invented red marks.</p>
      </div>
      <div className="failure-comparison-local-rules">
        <h3>Recomputed local-rule conflicts</h3>
        {data.conflicts.length ? <ul>{data.conflicts.map((conflict, index) => <li key={`${index}-${conflict.label}`}><span>{conflict.label}</span><span className="failure-comparison-conflict-coordinates">{conflict.cells.length ? cellList(conflict.cells) : 'No occupied cell to mark.'}</span></li>)}</ul> : <p>{data.modelQueens === null ? 'No recoverable placement; no cell-level conflicts are inferred.' : 'No local-rule conflict is marked in the recovered coordinates.'}</p>}
        {data.modelQueens !== null && !data.complete && <p>Empty rows or regions in this partial placement are not treated as failures. Only supplied queens are compared and checked.</p>}
      </div>
    </div>

    {!!unplottable.length && <p className="failure-comparison-warning">Coordinates outside the bound board are preserved in the written record, not plotted: {cellList(unplottable)}.</p>}

    <div className="failure-comparison-note"><h3>Evaluator note</h3><p>{data.note}</p></div>
    <details className="failure-comparison-written">
      <summary>Written board partition and provenance</summary>
      <p>The supplied region map is written row by row below; columns run left to right starting at 1. Matching labels identify the same region; no new partition is generated by this view.{useAliases ? ' Numbered aliases on both boards map to the supplied names listed below.' : ''}</p>
      {useAliases && <ul className="failure-comparison-aliases">{regionNames.map(region => <li key={region}><strong>{labels.get(region)}</strong> = {region}</li>)}</ul>}
      <div className="failure-comparison-partition-scroll" role="region" tabIndex={0} aria-label="Written region matrix; scroll horizontally if needed"><pre>{data.regions.length ? data.regions.map((row, index) => `r${index + 1}: ${row.join(' ')}`).join('\n') : 'No region matrix available.'}</pre></div>
      <dl className="failure-comparison-provenance">
        <div><dt>Recorded response source</dt><dd><code>{data.modelSource}</code></dd></div>
        <div><dt>Board binding source</dt><dd><code>{data.bindingSource}</code></dd></div>
        <div><dt>Evaluator reference source</dt><dd><code>{data.referenceSource}</code></dd></div>
      </dl>
    </details>
  </section>
}

export default FailureComparison
