import { useEffect, useRef, useState } from 'react'
import { assetUrl, Icon } from './bookUi'

export const boardConfigs = {
  five: {
    label: '5 × 5 target · easy',
    regions: [
      ['A', 'A', 'B', 'B', 'C'],
      ['A', 'B', 'B', 'D', 'D'],
      ['A', 'E', 'B', 'D', 'D'],
      ['A', 'E', 'D', 'D', 'D'],
      ['E', 'E', 'D', 'D', 'D'],
    ],
    solution: [5, 3, 1, 4, 2],
  },
  seven: {
    label: '7 × 7 target · medium',
    regions: [
      ['A', 'B', 'B', 'B', 'B', 'C', 'C'],
      ['A', 'A', 'A', 'C', 'C', 'C', 'C'],
      ['A', 'D', 'D', 'C', 'C', 'C', 'C'],
      ['D', 'D', 'D', 'C', 'C', 'C', 'C'],
      ['D', 'D', 'D', 'E', 'E', 'C', 'F'],
      ['D', 'D', 'D', 'D', 'C', 'C', 'F'],
      ['D', 'D', 'D', 'D', 'G', 'G', 'F'],
    ],
    solution: [3, 1, 6, 2, 4, 7, 5],
  },
  nine: {
    label: '9 × 9 target · hard',
    regions: [
      ['A', 'B', 'B', 'B', 'B', 'C', 'C', 'C', 'C'],
      ['A', 'B', 'B', 'B', 'B', 'B', 'C', 'C', 'C'],
      ['A', 'B', 'B', 'D', 'A', 'B', 'C', 'C', 'C'],
      ['A', 'A', 'A', 'A', 'A', 'A', 'E', 'A', 'A'],
      ['F', 'A', 'A', 'A', 'G', 'A', 'A', 'A', 'H'],
      ['A', 'A', 'A', 'A', 'G', 'G', 'A', 'H', 'H'],
      ['A', 'G', 'G', 'G', 'G', 'G', 'G', 'G', 'H'],
      ['A', 'G', 'G', 'G', 'G', 'G', 'G', 'I', 'I'],
      ['A', 'G', 'G', 'G', 'G', 'G', 'G', 'I', 'I'],
    ],
    solution: [6, 2, 4, 7, 1, 3, 9, 5, 8],
  },
} as const

export function BoardDiagram({ size = 'five', compact = false }: { size?: keyof typeof boardConfigs; compact?: boolean }) {
  const board = boardConfigs[size]
  return (
    <figure className={`board-figure ${compact ? 'board-figure--compact' : ''}`}>
      <div className="board-heading">
        <span>{board.label}</span>
        <span className="board-rule">one queen / region</span>
      </div>
      <div className={`board-grid board-grid--${size}`} role="grid" aria-label={`${board.label}; region letters and verified queen locations`}>
        {board.regions.flatMap((row, rowIndex) => row.map((region, colIndex) => {
          const queen = board.solution[rowIndex] === colIndex + 1
          return <div role="gridcell" className={`board-cell region-${region} ${queen ? 'has-queen' : ''}`} key={`${rowIndex}-${colIndex}`} aria-label={`row ${rowIndex + 1}, column ${colIndex + 1}, region ${region}${queen ? ', queen' : ''}`}>
            <span className="region-letter">{region}</span>{queen && <span className="queen-mark" aria-hidden="true">Q</span>}
          </div>
        }))}
      </div>
      <figcaption>{size === 'five' ? 'Verified solution: columns by row [5, 3, 1, 4, 2].' : `Verified solution: columns by row [${board.solution.join(', ')}].`}</figcaption>
    </figure>
  )
}

export function ReportFigures() {
  const figures = [
    ['queens-5-easy-pair.png', '5×5 target and verified solution'],
    ['queens-7-medium-pair.png', '7×7 target and verified solution'],
    ['queens-9-hard-pair.png', '9×9 target and verified solution'],
    ['jev-invalid-vs-correct-5.png', 'Jev selected placement versus the unique legal solution'],
    ['fewshot-5-pair.png', 'A solved 5×5 board used only as worked-example context'],
  ]
  const dialogRef = useRef<HTMLDialogElement>(null)
  const triggerRef = useRef<HTMLButtonElement | null>(null)
  const [selectedFigure, setSelectedFigure] = useState<string[] | null>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!selectedFigure || !dialog || dialog.open) return
    dialog.showModal()
    window.requestAnimationFrame(() => dialog.querySelector<HTMLButtonElement>('.figure-lightbox-close')?.focus())
  }, [selectedFigure])

  const openFigure = (figure: string[], trigger: HTMLButtonElement) => {
    triggerRef.current = trigger
    setSelectedFigure(figure)
  }

  const closeFigure = () => dialogRef.current?.close()

  const handleDialogClose = () => {
    setSelectedFigure(null)
    triggerRef.current?.focus()
  }

  return <>
    <div className="figure-grid" aria-label="Report illustrations">
      {figures.map(([src, caption]) => <figure key={src}>
        <button className="figure-preview" type="button" onClick={(event) => openFigure([src, caption], event.currentTarget)} aria-label={`View ${caption} full screen`}>
          <img src={assetUrl(`assets/${src}`)} alt={caption} loading="lazy" width="2200" height="1230" />
          <span className="figure-expand-label"><Icon name="expand" /> Full screen</span>
        </button>
        <figcaption>{caption}</figcaption>
      </figure>)}
    </div>
    <dialog ref={dialogRef} className="figure-lightbox" aria-labelledby="figure-lightbox-caption" onClose={handleDialogClose} onClick={(event) => { if (event.target === event.currentTarget) closeFigure() }}>
      {selectedFigure && <div className="figure-lightbox-shell">
        <div className="figure-lightbox-toolbar">
          <span>Visual receipt</span>
          <button className="figure-lightbox-close" type="button" onClick={closeFigure}><Icon name="close" /> Close</button>
        </div>
        <figure>
          <div className="figure-lightbox-visual"><img src={assetUrl(`assets/${selectedFigure[0]}`)} alt={selectedFigure[1]} width="2200" height="1230" /></div>
          <figcaption id="figure-lightbox-caption">{selectedFigure[1]}</figcaption>
        </figure>
      </div>}
    </dialog>
  </>
}

export function AssessmentReceipt() {
  return (
    <section className="receipt" aria-labelledby="receipt-heading">
      <div className="receipt-lead"><span className="receipt-mark">✓</span><div><span className="receipt-label">Assessment receipt</span><h2 id="receipt-heading">A bounded claim with an inspectable trail.</h2></div></div>
      <div className="receipt-grid">
        <div><span className="receipt-label">Source class</span><strong>Independent finding</strong><span>saved experiment records</span></div>
        <div><span className="receipt-label">Edition</span><strong>2 Nov 2026</strong><span>dated studies retained</span></div>
        <div><span className="receipt-label">Interaction</span><strong>Read-only</strong><span>local evidence only</span></div>
        <div><span className="receipt-label">Outcome</span><strong>Task-specific grades</strong><span>inspect each denominator</span></div>
      </div>
    </section>
  )
}

export function JevCandidateLens() {
  const [mode, setMode] = useState<'columns' | 'regions'>('columns')
  const rows = [
    { id: '01', columns: '[3, 1, 5, 2, 4]', regions: 'B · A · D · E · D', note: 'repeats D' },
    { id: '02', columns: '[5, 3, 1, 4, 2]', regions: 'C · B · A · D · E', note: 'complete set' },
    { id: '03', columns: '[1, 3, 5, 2, 4]', regions: 'A · B · D · E · D', note: 'repeats D' },
  ]
  return <div className="lens" aria-labelledby="lens-heading"><div className="lens-heading"><div><span className="section-label">Interactive rule lens</span><h3 id="lens-heading">Same candidates. Different question.</h3></div><div className="segmented" role="tablist" aria-label="Candidate representation"><button className={mode === 'columns' ? 'active' : ''} role="tab" aria-selected={mode === 'columns'} onClick={() => setMode('columns')}>Columns only</button><button className={mode === 'regions' ? 'active' : ''} role="tab" aria-selected={mode === 'regions'} onClick={() => setMode('regions')}>Explicit regions</button></div></div><p className="lens-description">{mode === 'columns' ? 'The model must infer that columns map to region membership, then notice the duplicated letter.' : 'The mapping has been made visible. The remaining question is narrow: which list contains each letter A–E exactly once?'}</p><p className="lens-provenance">Three-option excerpt from the saved 12-option <code>refine_region_sequence_r1</code> request.</p><div className="candidate-list">{rows.map(row => <div className={`candidate-row ${mode === 'regions' && row.id === '02' ? 'candidate-row--winner' : ''}`} key={row.id}><span className="candidate-id">{row.id}</span><code>{row.columns}</code><span className="candidate-arrow">→</span><span className={`candidate-regions ${mode === 'columns' ? 'muted' : ''}`}>{mode === 'regions' ? row.regions : 'region lookup withheld'}</span><span className="candidate-note">{mode === 'regions' ? row.note : 'map from board first'}</span></div>)}</div><div className="lens-footer"><strong>{mode === 'columns' ? '0/3' : '3/3'}</strong><span>aggregate correct selections in the separate 5×5 columns-only / explicit-region study</span><a href="#/evidence-atlas/2026-09-18-jev-5x5-variations:refine_region_sequence_r1">Read the exact request <Icon name="arrow" /></a></div></div>
}
