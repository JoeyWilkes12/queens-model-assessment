import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from 'react'
import { BoardReplay } from './BoardReplay'
import { deriveReceiptBoard } from './receiptBoardData'
import { deriveTrajectoryFrames, linkedTrajectoryForReceipt } from './trajectoryBoardData'

type Route = {
  path: string
  title: string
  section: string
  description: string
}

type AssessmentOutcome = 'success' | 'model_failure' | 'request_failure' | 'not_run' | 'ungraded'

type ErrorContext = {
  category: string
  title: string
  interpretation: string
  followUp: string
  sourceUrl?: string
  sourceLabel?: string
}

type EvidenceRecord = {
  id: string
  title: string
  stage: string
  kind: string
  status?: string
  summary: string
  request?: unknown
  output?: unknown
  metadata?: unknown
  files?: { request?: string; response?: string; metadata?: string; grade?: string | null }
  board?: string | null
  model?: string | null
  modelVersion?: string | null
  provider?: string | null
  run?: string | null
  excluded?: boolean
  exclusionReason?: string | null
  assessmentOutcome?: AssessmentOutcome
  errorContext?: ErrorContext | null
}

type InlineAsset = {
  asset_path: string
  media_type?: string
  sha256?: string
  bytes?: number
}

type ManifestRecord = {
  id: string
  study?: string
  board?: string | null
  size?: number
  model?: string | null
  modelVersion?: string | null
  provider?: string | null
  run?: string | null
  status?: string
  kind?: string
  hasResponse?: boolean
  hasMetadata?: boolean
  hasGrade?: boolean
  partialResponse?: boolean
  files?: { request?: string; response?: string; metadata?: string; grade?: string | null }
  failure?: unknown
  excluded?: boolean
  exclusionReason?: string | null
  assessmentOutcome?: AssessmentOutcome
  errorContext?: ErrorContext | null
}

const routes: Route[] = [
  { path: 'executive-summary', title: 'Executive summary', section: 'Read first', description: 'Outcome, boundaries, and the short version.' },
  { path: 'assessment-receipt', title: 'Assessment receipt', section: 'Read first', description: 'What was tested, when, and how to read the ledger.' },
  { path: 'queens-rules', title: 'Queens rules', section: 'The board', description: 'Regional constraints, boards, and verified solutions.' },
  { path: 'protocol-results', title: 'Protocol & results', section: 'The board', description: 'Frozen inputs, entrants, outcomes, and route failures.' },
  { path: 'earlier-generations', title: 'Earlier generations', section: 'Model generations', description: 'A sparse cross-generation replay of the original image prompts.' },
  { path: 'jev-primer', title: 'Jev primer', section: 'The Jev question', description: 'Typed decisions, text state, and what was actually measured.' },
  { path: 'candidate-engineering', title: 'Candidate engineering', section: 'The Jev question', description: 'Why explicit region lists changed the decision.' },
  { path: 'scale-primitives', title: 'Scale & primitives', section: 'The Jev question', description: 'Larger menus, Noul, Score, and held-out boards.' },
  { path: 'jev-trajectories', title: 'Jev trajectories', section: 'The Jev question', description: 'Empty-board placement, restarts, repeatability, and batching.' },
  { path: 'evidence-atlas', title: 'Evidence atlas', section: 'Receipts', description: 'Search sanitized requests, outputs, and metadata.' },
  { path: 'methods-sources', title: 'Methods & sources', section: 'Receipts', description: 'Definitions, limits, and primary links.' },
  { path: 'about', title: 'About this book', section: 'About', description: 'Purpose, provenance, source, and a shareable QR code.' },
]

const boardConfigs = {
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

function assetUrl(path: string) {
  return `${import.meta.env.BASE_URL}${path.replace(/^\/+/, '')}`
}

function collectInlineAssets(value: unknown, found = new Map<string, InlineAsset>()): InlineAsset[] {
  if (Array.isArray(value)) {
    value.forEach(item => collectInlineAssets(item, found))
  } else if (value && typeof value === 'object') {
    const candidate = value as Record<string, unknown>
    if (typeof candidate.asset_path === 'string') {
      found.set(candidate.asset_path, {
        asset_path: candidate.asset_path,
        media_type: typeof candidate.media_type === 'string' ? candidate.media_type : undefined,
        sha256: typeof candidate.sha256 === 'string' ? candidate.sha256 : undefined,
        bytes: typeof candidate.bytes === 'number' ? candidate.bytes : undefined,
      })
    }
    Object.values(candidate).forEach(item => collectInlineAssets(item, found))
  }
  return Array.from(found.values())
}

function displayStatus(status?: string) {
  return (status || 'review').replace(/_/g, ' ')
}

function displayRequestStatus(status?: string) {
  if (status === 'success') return 'request success'
  if (status === 'error') return 'request error'
  return displayStatus(status)
}

function outcomeLabel(outcome?: AssessmentOutcome) {
  if (outcome === 'success') return 'Success'
  if (outcome === 'model_failure') return 'Model assessment failure'
  if (outcome === 'request_failure') return 'Request / transport failure'
  if (outcome === 'not_run') return 'Not run'
  return 'Ungraded'
}

const fallbackEvidence: EvidenceRecord[] = [
  {
    id: '01-queens-5-easy-sol',
    title: 'Sol · 5×5 strict pass',
    stage: 'One-shot pilot',
    kind: 'model result',
    status: 'pass',
    summary: 'A strict JSON response with a mathematically valid placement.',
    request: { model: 'openai/gpt-5.6-sol', board: 'queens-5-easy', image: '[sanitized image reference]', output_contract: 'JSON only' },
    output: { columns_by_row: [5, 3, 1, 4, 2], grade: 'pass', elapsed_seconds: 13.347243 },
    metadata: { provider: 'OpenAI', input_tokens: 956, completion_tokens: 701, confirmed_cost_usd: '0.008922000', source: 'grades.json' },
  },
  {
    id: '04-queens-7-opus-format',
    title: 'Opus · 7×7 format-only diagnostic',
    stage: 'One-shot pilot',
    kind: 'model result',
    status: 'diagnostic',
    summary: 'The placement was mathematically correct; extra prose broke the frozen JSON-only contract.',
    request: { model: 'anthropic/claude-opus-4.8', board: 'queens-7-medium', image: '[sanitized image reference]', output_contract: 'JSON only' },
    output: { mathematical_grade: 'pass', strict_json_grade: 'fail', diagnostic: 'format only' },
    metadata: { provider: 'Anthropic', elapsed_seconds: 48.23, source: 'format_diagnostics.json' },
  },
  {
    id: 'jev-recognition-5-flat-regions',
    title: 'Jev · explicit regions, 5×5',
    stage: 'Candidate engineering',
    kind: 'recognition trial',
    status: 'pass',
    summary: 'A flat occupied-region list made the remaining distinctness question explicit: 6/6.',
    request: { primitive: 'Choice', alternatives: 12, representation: 'occupied regions by row', instruction: 'Select the candidate whose regions contain A through E exactly once.' },
    output: { correct_selections: '6/6', median_api_seconds: 0.3006, selected_region_sequence: ['C', 'B', 'A', 'D', 'E'] },
    metadata: { board: 'queens-5-easy', cost_usd: '0.002274384 across 39 variation requests', source: 'jev-5x5-variations/audit.json' },
  },
  {
    id: 'jev-scale-9-255',
    title: 'Jev · 9×9, 255 candidates',
    stage: 'Scale study',
    kind: 'scale result',
    status: 'pass',
    summary: 'Explicit-region Choice selected the true candidate in all three paired trials; probability softened with menu size.',
    request: { board: '9×9', options: 255, variants: ['columns-only', 'explicit regions'], primitive: 'Choice' },
    output: { columns_only: '0/3', explicit_regions: '3/3', mean_probability_true_regions: 0.667, max_input_tokens: 22289 },
    metadata: { caveat: 'Distractor mix, order, and input length were not perfectly isolated.', source: 'jev-scale/ASSESSMENT.md' },
  },
  {
    id: 'jev-primitives-all-invalid',
    title: 'Jev · rejecting an all-invalid set',
    stage: 'Held-out boards',
    kind: 'primitive result',
    status: 'mixed',
    summary: 'Choice rejected every all-invalid set 6/6; Noul and Score thresholds were less reliable.',
    request: { condition: 'no valid answer', candidates: 12, primitives: ['Choice', 'Noul', 'Score'] },
    output: { choice_none: '6/6', every_noul_below_0_5: '4/6', every_score_complete_below_0_5: '3/6' },
    metadata: { boards: 6, attempts: 30, transport_errors: 1, source: 'jev-primitives/audit.json' },
  },
]

function normalizeManifestRecord(record: ManifestRecord): EvidenceRecord {
  const titleParts = [record.model || record.kind || 'Evidence', record.board || record.run].filter(Boolean)
  const state = record.status || 'review'
  const outcome = record.assessmentOutcome || 'ungraded'
  const detail = record.excluded
    ? 'Excluded from the default atlas because the request was rejected before inference; preserved for audit and search.'
    : record.kind === 'grade-source'
    ? 'Complete study-level evaluator ledger retained as a sanitized grade source.'
    : outcome === 'request_failure'
      ? 'The request did not produce a model answer; inspect the error interpretation and transport receipt.'
      : outcome === 'model_failure'
        ? 'The request completed, but did not pass the saved assessment contract. Inspect the grade to distinguish format failures from rule violations.'
        : outcome === 'success'
          ? 'The request completed and the saved deterministic grade marks the scoped answer correct.'
          : record.hasResponse
            ? `${record.hasGrade ? 'Response and grade' : 'Response'} retained; inspect the saved request, output, and metadata.`
            : 'Planned record with no captured response; the absence is retained.'
  return {
    id: record.id,
    title: titleParts.join(' · '),
    stage: record.study || 'Evidence record',
    kind: record.kind || 'evaluation run',
    status: state,
    summary: detail,
    files: record.files,
    board: record.board,
    model: record.model,
    modelVersion: record.modelVersion,
    provider: record.provider,
    run: record.run,
    excluded: record.excluded,
    exclusionReason: record.exclusionReason,
    assessmentOutcome: outcome,
    errorContext: record.errorContext,
    metadata: { board: record.board, model: record.model, modelVersion: record.modelVersion, provider: record.provider, run: record.run, size: record.size, status: record.status, assessmentOutcome: outcome, excluded: record.excluded, exclusionReason: record.exclusionReason, hasResponse: record.hasResponse, hasMetadata: record.hasMetadata, hasGrade: record.hasGrade, partialResponse: record.partialResponse, failure: record.failure },
  }
}

function useHashPath() {
  const read = () => window.location.hash.replace(/^#\/?/, '').replace(/\/$/, '') || 'executive-summary'
  const [path, setPath] = useState(read)
  useEffect(() => {
    const onChange = () => setPath(read())
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])
  return [path, (next: string) => { window.location.hash = `/${next}` }] as const
}

function Icon({ name, size = 18 }: { name: 'arrow' | 'book' | 'close' | 'menu' | 'moon' | 'sun' | 'copy' | 'download' | 'search' | 'external' | 'expand'; size?: number }) {
  const paths: Record<string, ReactNode> = {
    arrow: <><path d="M4 9h11" /><path d="m11 4 5 5-5 5" /></>,
    book: <><path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H19v17H6.5A2.5 2.5 0 0 0 4 21.5v-17Z" /><path d="M4 19V4.5" /><path d="M7.5 6H16" /><path d="M7.5 9H16" /></>,
    close: <><path d="m5 5 10 10" /><path d="m15 5-10 10" /></>,
    menu: <><path d="M3 5h14" /><path d="M3 10h14" /><path d="M3 15h14" /></>,
    moon: <path d="M15.5 12.5A6.5 6.5 0 0 1 8 5.2 6.5 6.5 0 1 0 15.5 12.5Z" />,
    sun: <><circle cx="10" cy="10" r="3" /><path d="M10 2v2M10 16v2M2 10h2m12 0h2M4.3 4.3l1.4 1.4m8.6 8.6 1.4 1.4m0-11.4-1.4 1.4m-8.6 8.6-1.4 1.4" /></>,
    copy: <><rect x="5" y="5" width="10" height="10" rx="1" /><path d="M8 2h7a2 2 0 0 1 2 2v7" /></>,
    download: <><path d="M10 2v10" /><path d="m6 8 4 4 4-4" /><path d="M3 15v2h14v-2" /></>,
    search: <><circle cx="8.5" cy="8.5" r="5.5" /><path d="m13 13 4 4" /></>,
    external: <><path d="M10 4h6v6" /><path d="m16 4-7 7" /><path d="M14 13v3H4V6h3" /></>,
    expand: <><path d="M8 3H3v5" /><path d="m3 3 5 5" /><path d="M12 17h5v-5" /><path d="m17 17-5-5" /></>,
  }
  return <svg aria-hidden="true" className="icon" width={size} height={size} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="square" strokeLinejoin="miter">{paths[name]}</svg>
}

function BoardDiagram({ size = 'five', compact = false }: { size?: keyof typeof boardConfigs; compact?: boolean }) {
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

function ReportFigures() {
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

function AssessmentReceipt() {
  return (
    <section className="receipt" aria-labelledby="receipt-heading">
      <div className="receipt-lead"><span className="receipt-mark">✓</span><div><span className="receipt-label">Assessment receipt</span><h2 id="receipt-heading">A bounded claim with an inspectable trail.</h2></div></div>
      <div className="receipt-grid">
        <div><span className="receipt-label">Source class</span><strong>Independent finding</strong><span>saved experiment records</span></div>
        <div><span className="receipt-label">Verified</span><strong>19 Sep 2026</strong><span>expanded edition</span></div>
        <div><span className="receipt-label">Interaction</span><strong>Read-only</strong><span>local evidence only</span></div>
        <div><span className="receipt-label">Outcome</span><strong>Candidate recognition</strong><span>not autonomous solving</span></div>
      </div>
    </section>
  )
}

function LocalToc({ items }: { items: { id: string; label: string }[] }) {
  const jump = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  return <nav className="local-toc" aria-label="On this page"><span className="toc-label">On this page</span>{items.map(item => <button type="button" key={item.id} onClick={() => jump(item.id)}>{item.label}</button>)}</nav>
}

function PageHero({ title, deck, trail, action, children }: { title: string; deck: string; trail: string; action?: { label: string; path: string }; children?: ReactNode }) {
  const [, navigate] = useHashPath()
  return <header className="page-hero"><div className="hero-trail">Queens assessment <span>/</span> {trail}</div><h1>{title}</h1><p className="hero-deck">{deck}</p>{action && <button className="button button-mint" onClick={() => navigate(action.path)}>{action.label}<Icon name="arrow" /></button>}{children}</header>
}

function Section({ id, title, children, label, className = '' }: { id?: string; title: string; children: ReactNode; label?: string; className?: string }) {
  return <section id={id} className={`reading-section ${className}`}>{label && <span className="section-label">{label}</span>}<h2>{title}</h2>{children}</section>
}

function Callout({ tone = 'note', title, children }: { tone?: 'note' | 'evidence' | 'caution' | 'stop'; title: string; children: ReactNode }) {
  return <aside className={`callout callout--${tone}`}><span className="callout-tag">{tone === 'evidence' ? 'Evidence' : tone === 'caution' ? 'Caution' : tone === 'stop' ? 'Boundary' : 'Note'}</span><h3>{title}</h3><div>{children}</div></aside>
}

function DataTable({ caption, headers, rows }: { caption: string; headers: string[]; rows: (string | ReactNode)[][] }) {
  const hintId = useId()
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const scroller = scrollRef.current
    const heading = scroller?.querySelector('thead')
    if (!scroller || !heading) return
    // Keep keyboard-focused links below the frozen header, including after
    // viewport changes, wrapped labels, zoom, or font loading.
    const measure = () => scroller.style.setProperty('--table-header-height', `${heading.getBoundingClientRect().height}px`)
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(heading)
    return () => observer.disconnect()
  }, [])

  return <div className="data-table">
    <p className="table-scroll-hint" id={hintId}>Scroll when needed to compare rows and columns. Column headers stay visible.</p>
    <div ref={scrollRef} className="table-wrap" tabIndex={0} role="region" aria-label={caption} aria-describedby={hintId}>
      <table><caption>{caption}</caption><thead><tr>{headers.map(header => <th scope="col" key={header}>{header}</th>)}</tr></thead><tbody>{rows.map((row, index) => <tr key={index}>{row.map((cell, cellIndex) => cellIndex === 0 ? <th scope="row" key={cellIndex}>{cell}</th> : <td key={cellIndex}>{cell}</td>)}</tr>)}</tbody></table>
    </div>
  </div>
}

function ExecutiveSummary() {
  return <>
    <PageHero trail="Read first" title="The solver is not the selector." deck="The expanded Queens assessment finds a sharp boundary: multimodal reasoning models constructed valid written solutions from blank boards, while Jev became reliable only when code made the remaining decision explicit and narrow." action={{ label: 'Open the evidence atlas', path: 'evidence-atlas' }} />
    <AssessmentReceipt />
    <div className="reading-layout">
      <LocalToc items={[{ id: 'finding', label: 'The finding' }, { id: 'board-proof', label: 'Board proof' }, { id: 'comparison', label: 'Comparison' }, { id: 'limits', label: 'Limits' }]} />
      <main className="reading-column" id="main-content">
        <Section id="finding" title="A useful distinction, with a small denominator" label="Executive summary">
          <Callout tone="evidence" title="September 30 follow-up: Jev completed one new 5×5 board.">A color-then-cell workflow completed one of nine new boards in every attempt, with and without immediate-conflict filtering. The other eight boards remained unsolved. <a href="#/jev-trajectories">Read all 90 trajectories and the exact-request repeatability tests.</a> The original construction results below remain the September 19 baseline.</Callout>
          <Callout tone="note" title="October 1 comparison: earlier model generations, same three board images.">The historical cohort reuses the original image prompts and separates strict JSON-plus-rules success from a deterministic written-answer extraction diagnostic. <a href="#/earlier-generations">Compare each model and board, inspect the first observed failures, and open every request receipt.</a></Callout>
          <p className="lead">On six held-out boards, Jev's matrix and prose construction scored <strong>0/6</strong>. When a local generator supplied complete candidates and exposed each candidate's occupied region letters, Choice, Noul ranking, and Score ranking selected the true candidate <strong>6/6</strong>.</p>
          <p>That is assisted recognition, not unaided whole-puzzle planning. The exact validator remains the authority. The report intentionally preserves both the success and the scaffolding that made it possible.</p>
          <div className="finding-strip"><div><strong>11 / 11</strong><span>captured reasoning-model answers valid</span></div><div><strong>24 / 24</strong><span>larger-board explicit-region selections</span></div><div><strong>0 / 6</strong><span>new-board native constructions</span></div></div>
        </Section>
        <Section id="board-proof" title="The condition that keeps getting lost" label="A board, not a metaphor">
          <div className="split-figure"><BoardDiagram /><div className="figure-copy"><p>Regional Queens adds a fourth condition to the familiar row, column, and non-touching checks: every colored region must contain exactly one queen.</p><p>Jev's first 5×5 recognition choice had clean rows, unique columns, and no touching queens. It repeated region D and left singleton region C empty. One missed global condition made the whole placement invalid.</p><a className="text-link" href="#/candidate-engineering">See the candidate lens <Icon name="arrow" /></a></div></div>
        </Section>
        <Section id="comparison" title="What the comparison supports">
          <DataTable caption="Capability ledger" headers={['Capability', 'Observed evidence']} rows={[
            ['Blank-image construction', 'All eleven returned reasoning-model answers were valid; one Grok trial timed out.'],
            ['Text construction', 'Jev matrix and prose each scored 0/6 on six new boards.'],
            ['Prepared candidate recognition', 'Explicit region lists scored 6/6 on six held-out boards.'],
            ['Absolute verification', 'Noul and Score produced false positives despite correct top ranking.'],
            ['Deterministic correctness', 'The local validator remains authoritative.'],
          ]} />
        </Section>
        <Section id="limits" title="Read the caveats as part of the result">
          <Callout tone="caution" title="This is not a general intelligence ranking.">Three original boards and six held-out boards all come from a synthetic family. Candidate lists overlap, representation and instruction specificity changed together, and model/provider timing differs. No population-level accuracy or stable price ranking follows.</Callout>
          <div className="next-actions"><a href="#/queens-rules">Learn the board rules <Icon name="arrow" /></a><a href="#/methods-sources">Read methods and sources <Icon name="arrow" /></a><a href={assetUrl('queens-model-assessment-2026-09-19-expanded.pdf')} download>Download expanded PDF <Icon name="download" /></a></div>
        </Section>
      </main>
    </div>
  </>
}

function AssessmentReceiptPage() {
  return <><PageHero trail="Read first / receipt" title="Assessment receipt" deck="The report's trust strip, expanded into a readable ledger: what was in scope, what was measured, and which edges remain unresolved." /><AssessmentReceipt /><div className="reading-layout"><LocalToc items={[{ id: 'scope', label: 'Scope' }, { id: 'ledger', label: 'Ledger' }, { id: 'boundaries', label: 'Boundaries' }]} /><main className="reading-column" id="main-content"><Section id="scope" title="Scope before score"><p>The original language-model condition was one request, one fresh context, and one scored answer opportunity per model per board. It was not an agentic sandbox. Jev was evaluated separately through typed Decisions calls with text state.</p><div className="scope-grid"><div><span>Included</span><strong>Seven retained model and Jev studies</strong><p>Requests, visible responses, grades, usage, timing, and preserved transport failures, including the October 1 generation replay.</p></div><div><span>Excluded</span><strong>Private and irreproducible payloads</strong><p>No credentials, encrypted reasoning, hidden answer keys, or unrelated repository files.</p></div></div></Section><Section id="ledger" title="September 19 historical ledger"><DataTable caption="Inference cost accounting" headers={['Component', 'Confirmed USD', 'Unresolved allowance']} rows={[['Original reasoning-model pilot', '$0.667009200', '$0.225228800'], ['First Jev deep dive', '$0.000792540', '$0.041268820'], ['Jev 39-call variations', '$0.002274384', '$0.000000000'], ['Jev larger-board scale', '$0.020552112', '$0.040000000'], ['Jev new-board primitives', '$0.004976664', '$0.012497446'], ['Total', '$0.695604900', '$0.318995066']]} /><p className="table-note">Conservative accounted total: <strong>$1.014599966</strong>. Remaining under the $3 allowance: <strong>$1.985400034</strong>. Allowances are reservations, not measured charges.</p></Section><p><a href="#/jev-trajectories">September 30 follow-up: view the updated all-study cost ledger.</a> <a href="#/earlier-generations">The October 1 replay reports its own incremental budget and cost ledger.</a></p><Section id="boundaries" title="The receipt is not a certificate"><Callout tone="stop" title="A trust receipt makes provenance visible; it does not certify a model.">Source class, date, interaction mode, and outcome are reminders to inspect the evidence. They do not imply security, broad quality, or production readiness.</Callout></Section></main></div></>
}

function QueensRules() {
  return <><PageHero trail="The board" title="Queens is regional, not ordinary N-queens." deck="Every row, every column, every connected region, and every touching pair participates in the same global constraint system." /><div className="reading-layout"><LocalToc items={[{ id: 'four-rules', label: 'Four rules' }, { id: 'five-board', label: '5×5 board' }, { id: 'figures', label: 'Report figures' }, { id: 'scale', label: 'Board scale' }]} /><main className="reading-column" id="main-content"><Section id="four-rules" title="Four rules, one placement"><div className="rule-list"><div><span>R1</span><p><strong>One queen per row.</strong> Every row receives exactly one selected cell.</p></div><div><span>R2</span><p><strong>One queen per column.</strong> Column positions must be unique.</p></div><div><span>R3</span><p><strong>One queen per region.</strong> Matching letters identify the same connected region.</p></div><div><span>R4</span><p><strong>No touching queens.</strong> Chebyshev distance must exceed one; longer diagonals are allowed.</p></div></div><p className="lead">The global burden is the interaction: a locally legal cell can consume the only useful region or column needed later.</p></Section><Section id="five-board" title="A verified 5×5 target"><div className="split-figure"><BoardDiagram size="five" /><div className="figure-copy"><p>The solution is columns by row <code>[5, 3, 1, 4, 2]</code>; its occupied regions are C, B, A, D, E. Region C is a singleton in the upper-right cell.</p><Callout tone="evidence" title="Why the red outline mattered in the report.">The illustrative comparison shows a near-miss that passes rows, columns, and spacing but repeats D. The deterministic checker, not visual plausibility, decides correctness.</Callout></div></div></Section><Section id="figures" title="The report's visual receipts"><ReportFigures /></Section><Section id="scale" title="Three boards, not a difficulty curve"><DataTable caption="Canonical target boards" headers={['Board', 'Permutations checked', 'Search nodes', 'Unique solutions']} rows={[['5×5 · easy', '120', '38', '1'], ['7×7 · medium', '5,040', '197', '1'], ['9×9 · hard', '362,880', '1,172', '1']]} /><p>Labels are provisional descriptions of these generated boards. Size, solver search work, image handling, response length, routing, and provider timing are not interchangeable measurements.</p></Section></main></div></>
}

function ProtocolResults() {
  return <><PageHero trail="The board / protocol" title="Freeze the input before interpreting the output." deck="The cleanest result in the report is the protocol boundary: identical board bytes, one request, no tools, and a separate diagnostic for formatting." /><div className="reading-layout"><LocalToc items={[{ id: 'conditions', label: 'Conditions' }, { id: 'results', label: 'Results' }, { id: 'routes', label: 'Routes' }]} /><main className="reading-column" id="main-content"><Section id="conditions" title="What each entrant actually received"><DataTable caption="Evaluation conditions" headers={['Condition', 'Input', 'Model work', 'External help']} rows={[['Four reasoning models', 'Same image and rules per board', 'Generate complete written placement', 'None; no repair turns'], ['Jev native row choices', 'Canonical text region grid', 'Select one column per row', 'Fixed typed options'], ['Jev candidate recognition', 'Text board plus complete placements', 'Choose one option', 'Candidate construction by code'], ['Repository solver', 'Exact region map', 'Solve explicit Boolean constraints', 'Local Z3; not a timed entrant']]} /><p>Images were clean 768×768 synthetic PNGs with region letters. They were not live-game screenshots or unlabelled color fields.</p></Section><Section id="results" title="Reasoning-model results"><DataTable caption="Three boards per reasoning model" headers={['Model', 'Strict + correct', 'Written correct', 'Median seconds']} rows={[['GPT-5.6 Sol', '3/3', '3/3', '13.70'], ['Claude Opus 4.8', '2/3', '3/3', '39.13'], ['Grok 4.6 via Bedrock', '2/3', '2/3', '91.96'], ['Gemini 3.1 Pro Preview', '2/3', '3/3', '71.97']]} /><p>“Format only” means a unique visible solution passed the post-hoc mathematical check while breaking the original JSON-only contract. “No answer” is not an invalid queen placement.</p></Section><Section id="routes" title="Routes, costs, and operational failures"><Callout tone="caution" title="Do not conflate developer, provider, and gateway.">Every external request used OpenRouter through the local credential broker. Grok's approved route was Amazon Bedrock US West 2. One 7×7 Grok request timed out at 600.964 seconds without a recoverable generation ID; it was not retried.</Callout><div className="next-actions"><a href="#/assessment-receipt">Inspect the cost receipt <Icon name="arrow" /></a><a href="#/evidence-atlas">Open saved records <Icon name="arrow" /></a></div></Section></main></div></>
}

function JevPrimer() {
  return <><PageHero trail="The Jev question" title="Jev receives a decision, not a blank canvas." deck="Jev 1.13 accepts text or structured state and returns typed decisions. It does not see the report's images or write an ordinary explanatory chat answer." /><div className="reading-layout"><LocalToc items={[{ id: 'interface', label: 'Interface' }, { id: 'before', label: 'Before engineering' }, { id: 'primitives', label: 'Primitives' }]} /><main className="reading-column" id="main-content"><Section id="interface" title="The interface changes the task"><p>The saved experiment used OpenRouter's Decisions route with a canonical text region grid. The original image prompt received HTTP 400 because this family requires its separate Decisions API. That is an interface mismatch, not a wrong puzzle answer.</p><div className="primitive-ribbon"><div><strong>Choice</strong><span>Which supplied option?</span></div><div><strong>Noul</strong><span>Is this statement true?</span></div><div><strong>Score</strong><span>Where on ordered levels?</span></div></div></Section><Section id="before" title="Before candidate engineering"><DataTable caption="Native Jev probes" headers={['Test', 'Complete answer', 'Elapsed', 'Confirmed USD']} rows={[['5×5 simultaneous row choices', 'Invalid', '0.435s', '$0.000056742'], ['7×7 simultaneous row choices', 'Invalid', '0.249s', '$0.000088452'], ['9×9 simultaneous row choices', 'Invalid', '0.349s', '$0.000129276'], ['5×5 sequential rows', 'Invalid', '1.189s total', '$0.000158802'], ['120-permutation recognition', 'Invalid', '0.245s', '$0.000235746']]} /><p>Jev read 9/9 sampled grid cells correctly but agreed with the checker on only 8/12 self-constraint questions. The questions were unbalanced, so the result does not establish reliable self-verification.</p></Section><Section id="primitives" title="Do not turn a scalar into a certificate"><Callout tone="evidence" title="Choice is relative; Noul is absolute; Score is ordinal.">Choice can force a winner when none is correct unless a rejection option is present. Noul's probability of yes needs a threshold and a balanced prevalence. Score's expected level is a probability-weighted index within the authored rubric, not a probability of validity.</Callout><p>Questions in a batch see the same state but are evaluated separately. Confidence is concentration of a returned distribution, not proof that a candidate satisfies the board.</p></Section></main></div></>
}

function JevCandidateLens() {
  const [mode, setMode] = useState<'columns' | 'regions'>('columns')
  const rows = [
    { id: '01', columns: '[3, 1, 5, 2, 4]', regions: 'B · A · D · E · D', note: 'repeats D' },
    { id: '02', columns: '[5, 3, 1, 4, 2]', regions: 'C · B · A · D · E', note: 'complete set' },
    { id: '03', columns: '[1, 3, 5, 2, 4]', regions: 'A · B · D · E · D', note: 'repeats D' },
  ]
  return <div className="lens" aria-labelledby="lens-heading"><div className="lens-heading"><div><span className="section-label">Interactive rule lens</span><h3 id="lens-heading">Same candidates. Different question.</h3></div><div className="segmented" role="tablist" aria-label="Candidate representation"><button className={mode === 'columns' ? 'active' : ''} role="tab" aria-selected={mode === 'columns'} onClick={() => setMode('columns')}>Columns only</button><button className={mode === 'regions' ? 'active' : ''} role="tab" aria-selected={mode === 'regions'} onClick={() => setMode('regions')}>Explicit regions</button></div></div><p className="lens-description">{mode === 'columns' ? 'The model must infer that columns map to region membership, then notice the duplicated letter.' : 'The mapping has been made visible. The remaining question is narrow: which list contains each letter A–E exactly once?'}</p><p className="lens-provenance">Three-option excerpt from the saved 12-option <code>refine_region_sequence_r1</code> request.</p><div className="candidate-list">{rows.map(row => <div className={`candidate-row ${mode === 'regions' && row.id === '02' ? 'candidate-row--winner' : ''}`} key={row.id}><span className="candidate-id">{row.id}</span><code>{row.columns}</code><span className="candidate-arrow">→</span><span className={`candidate-regions ${mode === 'columns' ? 'muted' : ''}`}>{mode === 'regions' ? row.regions : 'region lookup withheld'}</span><span className="candidate-note">{mode === 'regions' ? row.note : 'map from board first'}</span></div>)}</div><div className="lens-footer"><strong>{mode === 'columns' ? '0/3' : '3/3'}</strong><span>aggregate correct selections in the separate 5×5 columns-only / explicit-region study</span><a href="#/evidence-atlas/2026-09-18-jev-5x5-variations:refine_region_sequence_r1">Read the exact request <Icon name="arrow" /></a></div></div>
}

function CandidateEngineering() {
  return <><PageHero trail="The Jev question / candidate engineering" title="Make the missing condition legible." deck="The successful adaptation did not ask Jev to search the board. Code generated complete candidates, filtered most constraints, and exposed the one global property still worth choosing." action={{ label: 'Inspect the scale study', path: 'scale-primitives' }} /><div className="reading-layout"><LocalToc items={[{ id: 'lens', label: 'Rule lens' }, { id: 'variations', label: 'Variations' }, { id: 'interpretation', label: 'Interpretation' }]} /><main className="reading-column" id="main-content"><Section id="lens" title="The candidate lens"><JevCandidateLens /></Section><Section id="variations" title="Not every representation improved"><DataTable caption="5×5 candidate-variation results" headers={['Input variation', 'Correct', 'Median API seconds']} rows={[['Column vectors with mixed distractors', '0/3', '0.311'], ['Individual coordinates + region labels', '1/3', '0.324'], ['Precomputed counts + touching pairs', '3/3', '0.314'], ['Flat occupied-region list', '3/3', '0.333'], ['Same list in one sentence', '3/3', '0.233'], ['Reordered descriptions', '1/3', '0.248']]} /><p>All 39 requests returned interpretable Choice answers. The final successful reformulation was exploratory evidence, not a preregistered independent validation.</p></Section><Section id="interpretation" title="What can and cannot be credited"><Callout tone="caution" title="Representation and instruction specificity changed together.">The data support the combined interface: explicit regions plus a precise distinctness instruction. Formatting alone cannot be credited for the improvement, and the model must not receive credit for the local generator's search and validation.</Callout><p>The practical pattern is proposal then proof: a Jev-assisted application may choose a candidate, but the exact checker should gate acceptance.</p></Section></main></div></>
}

function ScalePrimitives() {
  return <><PageHero trail="The Jev question / scale" title="Ranking held; absolute judgment wobbled." deck="Larger candidate menus extended the explicit-region success to 24/24 paired trials. The deeper primitive study shows why selection, validity, and ordinal coverage are different claims." /><div className="reading-layout"><LocalToc items={[{ id: 'scale-table', label: 'Scale table' }, { id: 'new-boards', label: 'Held-out boards' }, { id: 'noul-score', label: 'Noul + Score' }]} /><main className="reading-column" id="main-content"><Section id="scale-table" title="The 255-option edge"><DataTable caption="Jev scale study" headers={['Board', 'Options', 'Columns only', 'Explicit regions', 'Mean P(true), regions']} rows={[['7×7', '12', '0/3', '3/3', '0.960'], ['7×7', '50', '0/3', '3/3', '0.877'], ['7×7', '100', '0/3', '3/3', '0.837'], ['7×7', '255', '0/3', '3/3', '0.730'], ['9×9', '12', '1/3', '3/3', '0.900'], ['9×9', '50', '0/3', '3/3', '0.790'], ['9×9', '100', '0/3', '3/3', '0.730'], ['9×9', '255', '0/3', '3/3', '0.667']]} /><p><strong>No explicit-region selection failure was found before the Choice interface limit.</strong> However, mean probability on the correct answer declined as options increased, and one 9×9/255 response assigned the true option only 0.50.</p></Section><Section id="new-boards" title="Six new boards, five tasks each"><p>Two boards each at 5×5, 7×7, and 9×9 were accepted from separate fixed seeds after connected regions, unique solutions, and nonduplication checks. These are six board-level units, not 30 independent puzzles or 534 independent decisions.</p><div className="finding-strip finding-strip--quiet"><div><strong>0/6</strong><span>matrix construction</span></div><div><strong>0/6</strong><span>prose construction</span></div><div><strong>6/6</strong><span>explicit-region Choice</span></div></div><Callout tone="caution" title="Distribution diversity is not established.">The new boards share a generator family. The 9×9 construction intentionally restricts two seed regions from growing. Size must not be equated with validated difficulty.</Callout></Section><Section id="noul-score" title="Noul and Score are not interchangeable"><DataTable caption="Held-out primitive checks" headers={['Condition', 'Result', 'What it means']} rows={[['Explicit regions · answer present · Noul', '6 TP, 5 FP', 'True candidate ranked highest, but threshold acceptance was unsafe.'], ['Explicit regions · answer present · Score', '32/72 modal level', 'Ordinal precision stayed below a majority reference.'], ['All-invalid · Choice none', '6/6 rejects', 'Joint rejection was reliable in this set.'], ['All-invalid · Noul < .5', '4/6 rejects', 'Independent thresholds missed two sets.'], ['All-invalid · Score complete < .5', '3/6 rejects', 'Scalar threshold missed three sets.']]}/><p>Choice's winning option and Noul/Score's absolute values answer different questions. Keep the exact validator in the loop.</p></Section></main></div></>
}

function jsonText(value: unknown) {
  return JSON.stringify(value ?? {}, null, 2)
}

function OutcomeTag({ outcome }: { outcome?: AssessmentOutcome }) {
  if (!outcome || outcome === 'ungraded') return null
  return <span className={`outcome-tag outcome-${outcome}`}>{outcomeLabel(outcome)}</span>
}

function ErrorContextCallout({ record }: { record: EvidenceRecord }) {
  if (!record.errorContext) return null
  const context = record.errorContext
  return <aside className="error-context" aria-labelledby="error-context-heading"><div className="error-context-heading"><span>{context.category}</span><h2 id="error-context-heading">{context.title}</h2></div><div className="error-context-body"><div><strong>How to interpret it</strong><p>{context.interpretation}</p></div><div><strong>What happened next</strong><p>{context.followUp}</p></div>{record.excluded && <div><strong>Atlas visibility</strong><p>Excluded from default browsing, but retained in search, direct links, and the public evidence bundle.</p></div>}{context.sourceUrl && <a href={context.sourceUrl} target="_blank" rel="noreferrer">{context.sourceLabel || 'Error reference'} <Icon name="external" /></a>}</div></aside>
}

function EvidenceExplorer({ selectedId }: { selectedId?: string }) {
  const [records, setRecords] = useState<EvidenceRecord[]>(fallbackEvidence)
  const [query, setQuery] = useState('')
  const [stage, setStage] = useState('All studies')
  const [provider, setProvider] = useState('all')
  const [modelVersion, setModelVersion] = useState('all')
  const [outcome, setOutcome] = useState('all')
  const [showExcluded, setShowExcluded] = useState(false)
  const [visibleCount, setVisibleCount] = useState(30)
  const [, navigate] = useHashPath()
  useEffect(() => {
    let active = true
    fetch(assetUrl('evidence/manifest.json')).then(response => response.ok ? response.json() : Promise.reject(new Error('manifest unavailable'))).then(payload => {
      const incoming = Array.isArray(payload) ? payload : [...(payload.records || []), ...(payload.gradeRecords || [])]
      const normalized = Array.isArray(incoming) ? incoming.map(normalizeManifestRecord) : []
      if (active && normalized.length) setRecords(normalized)
    }).catch(() => undefined)
    return () => { active = false }
  }, [])
  const stages = ['All studies', ...Array.from(new Set(records.map(record => record.stage)))]
  const providers = useMemo(() => Array.from(new Set(records.map(record => record.provider).filter((value): value is string => Boolean(value)))).sort((a, b) => a.localeCompare(b)), [records])
  const modelVersions = useMemo(() => Array.from(new Set(records.map(record => record.modelVersion).filter((value): value is string => Boolean(value)))).sort((a, b) => a.localeCompare(b)), [records])
  const providerCounts = useMemo(() => Object.fromEntries(providers.map(value => [value, records.filter(record => record.provider === value).length])), [providers, records])
  const modelVersionCounts = useMemo(() => Object.fromEntries(modelVersions.map(value => [value, records.filter(record => record.modelVersion === value).length])), [modelVersions, records])
  const excludedCount = records.filter(record => record.excluded).length
  const outcomeCounts = useMemo(() => ({
    success: records.filter(record => record.assessmentOutcome === 'success').length,
    model_failure: records.filter(record => record.assessmentOutcome === 'model_failure').length,
    request_failure: records.filter(record => record.assessmentOutcome === 'request_failure').length,
    not_run: records.filter(record => record.assessmentOutcome === 'not_run').length,
    ungraded: records.filter(record => record.assessmentOutcome === 'ungraded').length,
  }), [records])
  const filtered = useMemo(() => records.filter(record => {
    const normalizedQuery = query.trim().toLowerCase()
    const assessment = record.assessmentOutcome || 'ungraded'
    const matchesOutcome = outcome === 'all'
      || (outcome === 'non_success' && ['model_failure', 'request_failure', 'not_run'].includes(assessment))
      || assessment === outcome
    const matchesProvider = provider === 'all' || record.provider === provider
    const matchesModelVersion = modelVersion === 'all' || record.modelVersion === modelVersion
    const haystack = `${record.id} ${record.title} ${record.stage} ${record.kind} ${record.summary} ${record.model || ''} ${record.modelVersion || ''} ${record.provider || ''} ${record.board || ''} ${record.run || ''} ${outcomeLabel(assessment)} ${record.excluded ? 'excluded' : 'included'} ${record.exclusionReason || ''} ${record.errorContext?.category || ''} ${record.errorContext?.interpretation || ''}`.toLowerCase()
    const visibleByDefault = !record.excluded || showExcluded || normalizedQuery.length > 0 || outcome !== 'all'
    return visibleByDefault && matchesOutcome && matchesProvider && matchesModelVersion && (stage === 'All studies' || record.stage === stage) && haystack.includes(normalizedQuery)
  }), [modelVersion, outcome, provider, records, query, showExcluded, stage])
  useEffect(() => { setVisibleCount(30) }, [modelVersion, outcome, provider, query, showExcluded, stage])
  const visible = filtered.slice(0, visibleCount)
  const selected = selectedId ? records.find(record => record.id === selectedId) : undefined
  if (selected) return <EvidenceDetail key={selected.id} record={selected} onBack={() => navigate('evidence-atlas')} />
  return <><PageHero trail="Receipts / atlas" title="Evidence atlas" deck="Search the sanitized request, visible output, deterministic grade, and metadata behind the assessment. Every record is a bounded receipt, not a private raw dump." /><main className="atlas" id="main-content"><div className="atlas-controls"><label className="search-field atlas-control-search"><span className="sr-only">Search evidence</span><Icon name="search" /><input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Search run, model author, version, board, or excluded" /></label><label className="select-field atlas-control-study"><span className="sr-only">Filter study</span><select value={stage} onChange={event => setStage(event.target.value)}>{stages.map(item => <option key={item}>{item}</option>)}</select></label><label className="select-field atlas-control-outcome"><span className="sr-only">Filter assessment outcome</span><select value={outcome} onChange={event => setOutcome(event.target.value)}><option value="all">All outcomes</option><option value="non_success">Non-success evidence</option><option value="success">Success ({outcomeCounts.success})</option><option value="model_failure">Model failures ({outcomeCounts.model_failure})</option><option value="request_failure">Request failures ({outcomeCounts.request_failure})</option><option value="not_run">Not run ({outcomeCounts.not_run})</option><option value="ungraded">Ungraded / ledgers ({outcomeCounts.ungraded})</option></select></label><label className="select-field atlas-control-provider"><span className="sr-only">Filter model provider or author</span><select value={provider} onChange={event => setProvider(event.target.value)}><option value="all">All model authors</option>{providers.map(item => <option value={item} key={item}>{item} ({providerCounts[item]})</option>)}</select></label><label className="select-field atlas-control-model"><span className="sr-only">Filter exact model version</span><select value={modelVersion} onChange={event => setModelVersion(event.target.value)}><option value="all">All model versions</option>{modelVersions.map(item => <option value={item} key={item}>{item} ({modelVersionCounts[item]})</option>)}</select></label><label className="excluded-field atlas-control-excluded"><input type="checkbox" checked={showExcluded} onChange={event => setShowExcluded(event.target.checked)} /><span>Show excluded <strong>{excludedCount}</strong></span></label></div><p className="atlas-count" aria-live="polite">Showing <strong>{visible.length}</strong> of {filtered.length} matching records · {records.length - excludedCount} included by default · {excludedCount} excluded</p><div className="evidence-list">{visible.map(record => <button className={`evidence-row${record.excluded ? ' evidence-row--excluded' : ''}`} key={record.id} onClick={() => navigate(`evidence-atlas/${record.id}`)}><span className={`status-dot outcome-dot-${record.assessmentOutcome || 'ungraded'}`} aria-hidden="true" /><span className="evidence-main"><span className="evidence-title">{record.title}<OutcomeTag outcome={record.assessmentOutcome} />{record.excluded && <span className="evidence-flag">Excluded</span>}<Icon name="arrow" /></span><span>{record.summary}</span></span><span className="evidence-meta"><strong>{record.stage}</strong><span>{record.kind} · {displayRequestStatus(record.status)}</span></span></button>)}</div>{visible.length < filtered.length && <div className="atlas-pagination"><button className="button button-outline" type="button" onClick={() => setVisibleCount(count => count + 30)}>Load 30 more</button><button className="back-link" type="button" onClick={() => setVisibleCount(filtered.length)}>Show all {filtered.length}</button></div>}{!filtered.length && <div className="empty-state"><strong>No records match.</strong><span>Try a shorter query, broaden the model author or version, or show excluded evidence.</span></div>}<Callout tone="evidence" title="How outcome tags work">Success and model assessment failure require a completed request plus a saved deterministic grade. Request and transport failures produced no model answer. Excluded records remain searchable and directly addressable, but do not appear in the default browse view.</Callout></main></>
}

function EvidenceDetail({ record, onBack }: { record: EvidenceRecord; onBack: () => void }) {
  const [copied, setCopied] = useState(false)
  const [loaded, setLoaded] = useState<{ request: unknown; output: unknown; metadata: unknown; grade: unknown }>({ request: record.request, output: record.output, metadata: record.metadata, grade: null })
  const [loading, setLoading] = useState(Boolean(record.files))
  useEffect(() => {
    if (!record.files) { setLoading(false); return }
    let active = true
    const load = async () => {
      const read = async (path?: string) => {
        if (!path) return null
        const response = await fetch(assetUrl(`evidence/${path}`))
        if (!response.ok) return { unavailable: true, path }
        return response.json()
      }
      try {
        const [request, output, metadata, grade] = await Promise.all([read(record.files?.request), read(record.files?.response), read(record.files?.metadata), read(record.files?.grade || undefined)])
        if (active) setLoaded({ request, output, metadata, grade })
      } catch {
        if (active) setLoaded({ request: { unavailable: true }, output: { unavailable: true }, metadata: record.metadata, grade: { unavailable: true } })
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => { active = false }
  }, [record])
  const payload = jsonText(loaded)
  const copy = async () => { try { await navigator.clipboard.writeText(payload); setCopied(true); window.setTimeout(() => setCopied(false), 1800) } catch { setCopied(false) } }
  const download = () => { const url = URL.createObjectURL(new Blob([payload], { type: 'application/json' })); const anchor = document.createElement('a'); anchor.href = url; anchor.download = `${record.id.replace(/[^A-Za-z0-9._-]+/g, '_')}.json`; anchor.click(); URL.revokeObjectURL(url) }
  const inlineAssets = collectInlineAssets(loaded.request)
  const boardView = useMemo(() => deriveReceiptBoard(loaded.request, loaded.output, loaded.grade), [loaded.request, loaded.output, loaded.grade])
  const linkedTrajectory = linkedTrajectoryForReceipt(record.id)
  return <>
    <PageHero trail={`Receipts / atlas / ${record.id}`} title={record.title} deck={record.summary}>
      <div className="detail-flags"><OutcomeTag outcome={record.assessmentOutcome} /><span className={`status-pill status-${record.status || 'review'}`}>{displayRequestStatus(record.status)}</span>{record.excluded && <span className="status-pill evidence-flag">Excluded</span>}</div>
    </PageHero>
    <main className="evidence-detail" id="main-content">
      <button className="back-link" onClick={onBack}>← Back to atlas</button>
      <ErrorContextCallout record={record} />
      {record.excluded && !record.errorContext && <Callout tone="caution" title="Excluded from the default atlas"><p>{record.exclusionReason || 'This record documents a request-level failure rather than a model response.'}</p><p>It remains searchable, directly addressable, and available for audit.</p></Callout>}
      <div className="detail-toolbar"><span><strong>{record.stage}</strong> · {record.kind}</span><div><button className="button button-small" onClick={copy} disabled={loading}><Icon name="copy" />{loading ? 'Loading…' : copied ? 'Copied' : 'Copy JSON'}</button><button className="button button-small button-outline" onClick={download} disabled={loading}><Icon name="download" />Download</button></div></div>
      {!loading && boardView && <BoardReplay key={record.id} regions={boardView.regions} frames={boardView.frames} title="Board reconstructed from this receipt" description={boardView.description} allowPlayback={false} />}
      {!loading && !boardView && inlineAssets.length === 0 && record.kind !== 'grade-source' && <p className="board-view-unavailable">No complete, unambiguous board partition was found in this receipt. The raw input and output below remain authoritative; no board or missing state has been guessed.</p>}
      {linkedTrajectory && <p className="receipt-replay-link"><a className="text-link" href={`#/jev-trajectories/${encodeURIComponent(linkedTrajectory)}`}>Play this receipt’s linked Jev attempt <Icon name="arrow" /></a><br /><span>Playback follows recorded decisions across requests, including harness-forced choices and evaluator stops.</span></p>}
      {inlineAssets.length > 0 && <section className="input-assets" aria-labelledby="input-assets-heading"><div className="input-assets-heading"><span className="section-label">Exact input attachment</span><h2 id="input-assets-heading">Model-visible board image</h2><p>The base64 transport field was decoded into a content-addressed local asset; the request JSON retains its hash, media type, and byte count.</p></div><div className="input-assets-grid">{inlineAssets.map(asset => <figure key={asset.asset_path}><img src={assetUrl(`evidence/${asset.asset_path}`)} alt={`Board image attached to ${record.run || record.id}`} /><figcaption><code>{asset.sha256 ? `sha256:${asset.sha256}` : asset.asset_path}</code><span>{asset.media_type || 'image'}{asset.bytes ? ` · ${asset.bytes.toLocaleString()} bytes` : ''}</span></figcaption></figure>)}</div></section>}
      <div className="json-panels"><JsonPanel title="Sanitized request" value={loaded.request} /><JsonPanel title="Visible output" value={loaded.output} /><JsonPanel title="Deterministic grade" value={loaded.grade} /><JsonPanel title="Metadata" value={loaded.metadata} /></div>
      <Callout tone="evidence" title="Record handling">This detail is loaded from the public evidence manifest and its linked sanitized files. Exact prompt text and visible provider output are preserved; private credentials and encrypted reasoning are intentionally excluded. Any board view is an evaluator-side reconstruction, not an additional model input or a revised grade.</Callout>
    </main>
  </>
}

function JsonPanel({ title, value }: { title: string; value: unknown }) {
  return <section className="json-panel"><div className="json-panel-header"><h2>{title}</h2><span>sanitized</span></div><pre>{jsonText(value)}</pre></section>
}

type EarlierBoardResult = {
  board_id: string
  strict_correct: boolean | null
  written_correct: boolean | null
  failure: string | null
  finish_reason: string | null
  seconds: number | null
  cost_usd: number | null
  call_id: string
}

type EarlierModelResult = {
  model: string
  family: string
  round: number
  condition: string
  attempted: number
  strict_correct: number
  written_correct: number
  median_seconds: number | null
  cost_usd: number | null
  boards: EarlierBoardResult[]
}

type EarlierGenerationsSummary = {
  study: string
  updated_utc: string
  status: 'complete' | 'running'
  attempted: number
  original_attempted: number
  strict_correct: number
  written_correct: number
  known_cost_usd: number
  original_cost_usd: number
  diagnostic_cost_usd: number
  accounted_usd: number
  budget_usd: number
  remaining_usd: number
  models: EarlierModelResult[]
  first_failures: { family: string; model: string; round: number; board_id: string; failure: string | null; finish_reason: string | null; written_failure: string; written_checks: Record<string, boolean>; candidate_count: number }[]
  diagnostic_results: { model: string; board_id: string; condition: string; strict_correct: boolean | null; written_correct: boolean | null; seconds: number | null; cost_usd: number | null; call_id: string }[]
  limits: string[]
  conclusions: string[]
}

type CompletionReplicate = {
  replicate: number
  call_id: string
  attempted: boolean
  correct: boolean | null
  written_correct: boolean | null
  failure: string | null
  extraction_failure: string | null
  finish_reason: string | null
  seconds: number | null
  cost_usd: number | null
}

type CompletionPair = {
  matched_pair_id: string
  family: string
  model: string
  board_id: string
  historical_source_call_id: string
  source_failure_category: string
  source_failure_basis: Record<string, unknown>
  conditions: { condition: string; label: string; attempted_calls: number; strict_correct_count: number; written_correct_count: number; replicates: CompletionReplicate[] }[]
}

type DiagnosticCompletionSummary = {
  study: string
  generated_utc: string
  design: string
  attempt_policy: string
  planned_calls: number
  attempted_calls: number
  strict_correct_count: number
  written_correct_count: number
  budget: { cap_usd: number; worst_case_frozen_reserve_usd: number; known_cost_usd: number | null; accounted_usd: number | null; remaining_usd: number | null }
  conditions: { condition: string; label: string; planned_calls: number; attempted_calls: number; strict_correct_count: number; written_correct_count: number; known_cost_usd: number; by_replicate: { replicate: number; planned_calls: number; attempted_calls: number; strict_correct_count: number; written_correct_count: number; known_cost_usd: number }[] }[]
  pairs: CompletionPair[]
  historical_diagnostics_note: string
}

function earlierPassLabel(value: boolean | null | undefined) {
  return value === true ? 'Pass' : value === false ? 'Fail' : 'Not scored'
}

function earlierSeconds(value: number | null | undefined) {
  return typeof value === 'number' && Number.isFinite(value) ? `${value.toFixed(1)} s` : '—'
}

function earlierUsd(value: number | null | undefined) {
  return typeof value === 'number' && Number.isFinite(value) ? `$${value.toFixed(9)}` : '—'
}

function earlierReceipt(callId: string | null | undefined) {
  return callId
    ? <a href={`#/evidence-atlas/2026-10-01-earlier-generations:${callId}`}>Open receipt</a>
    : 'No request recorded'
}

function completionReceipt(callId: string) {
  return <a href={`#/evidence-atlas/2026-10-01-diagnostic-completion:${callId}`}>Open receipt</a>
}

function completionMedianSeconds(pairs: CompletionPair[], condition: string) {
  const times = pairs.flatMap(pair => pair.conditions.find(item => item.condition === condition)?.replicates ?? [])
    .map(rep => rep.seconds).filter((value): value is number => typeof value === 'number').sort((a, b) => a - b)
  if (!times.length) return null
  const middle = Math.floor(times.length / 2)
  return times.length % 2 ? times[middle] : (times[middle - 1] + times[middle]) / 2
}

function completionFindings(data: DiagnosticCompletionSummary) {
  return data.pairs.map(pair => {
    const count = (condition: string) => pair.conditions.find(cell => cell.condition === condition)?.written_correct_count ?? 0
    const image = count('original_image')
    const capped = pair.conditions.flatMap(cell => cell.replicates).filter(rep => rep.finish_reason === 'length').length
    const results = `${pair.model} · ${pair.board_id}: image ${image}/2, matrix ${count('text_only_region_grid_rows')}/2, cell lists ${count('text_only_region_cells')}/2 mathematically valid.`
    return `${results} ${image === 2
      ? 'The earlier image failure did not reproduce in either fresh image control.'
      : image === 1 ? 'The fresh image controls disagreed; the observed failure is not a stable boundary.'
        : capped === 6 ? 'All six responses hit the completion cap; this does not isolate a rule-solving misconception.'
        : count('text_only_region_grid_rows') === 0 && count('text_only_region_cells') === 0 ? 'Neither text encoding rescued these one-shot trials; this is not a universal inability claim.'
        : 'Both fresh image controls failed; text differences remain representation-sensitive observations, not a vision-only diagnosis.'}`
  })
}

function EarlierGenerations() {
  const [data, setData] = useState<EarlierGenerationsSummary | null>(null)
  const [error, setError] = useState(false)
  const [completion, setCompletion] = useState<DiagnosticCompletionSummary | null>(null)
  const [completionError, setCompletionError] = useState(false)
  useEffect(() => {
    let active = true
    fetch(assetUrl('evidence/earlier-generations-summary.json')).then(response => {
      if (!response.ok) throw new Error('Summary unavailable')
      return response.json()
    }).then(value => { if (active) setData(value as EarlierGenerationsSummary) }).catch(() => {
      if (active) setError(true)
    })
    return () => { active = false }
  }, [])
  useEffect(() => {
    let active = true
    fetch(assetUrl('evidence/diagnostic-completion-summary.json')).then(response => {
      if (!response.ok) throw new Error('Diagnostic summary unavailable')
      return response.json()
    }).then(value => { if (active) setCompletion(value as DiagnosticCompletionSummary) }).catch(() => {
      if (active) setCompletionError(true)
    })
    return () => { active = false }
  }, [])

  const originalAttempted = data?.models.reduce((total, model) => total + model.attempted, 0) ?? 0
  const originalStrictCorrect = data?.models.reduce((total, model) => total + model.strict_correct, 0) ?? 0
  const originalWrittenCorrect = data?.models.reduce((total, model) => total + model.written_correct, 0) ?? 0
  const modelRows = data?.models.map(model => [
    `Candidate rung ${model.round} · ${model.family}`,
    model.model,
    `${model.strict_correct}/${model.attempted}`,
    `${model.written_correct}/${model.attempted}`,
    earlierSeconds(model.median_seconds),
    earlierUsd(model.cost_usd),
  ]) ?? []
  const boardRows = data?.models.flatMap(model => model.boards.map(board => [
    model.model,
    `Candidate rung ${model.round}`,
    board.board_id,
    earlierPassLabel(board.strict_correct),
    earlierPassLabel(board.written_correct),
    earlierSeconds(board.seconds),
    earlierUsd(board.cost_usd),
    board.failure || board.finish_reason || '—',
    earlierReceipt(board.call_id),
  ])) ?? []
  const firstFailureRows = data?.first_failures.map(failure => {
    const board = data.models.find(model => model.model === failure.model && model.round === failure.round)
      ?.boards.find(result => result.board_id === failure.board_id)
    return [
      failure.family,
      failure.model,
      `Candidate rung ${failure.round}`,
      failure.board_id,
      `Strict: ${failure.failure || '—'}; written: ${failure.written_failure}; objects: ${failure.candidate_count}; ${Object.entries(failure.written_checks).filter(([, passed]) => !passed).map(([rule]) => rule).join(', ') || failure.finish_reason || '—'}`,
      earlierReceipt(board?.call_id),
    ]
  }) ?? []
  const diagnosticRows = data?.diagnostic_results.map(result => [
    result.model,
    result.board_id,
    result.condition,
    earlierPassLabel(result.strict_correct),
    earlierPassLabel(result.written_correct),
    earlierSeconds(result.seconds),
    earlierUsd(result.cost_usd),
    earlierReceipt(result.call_id),
  ]) ?? []

  return <><PageHero trail="Model generations / October 1 cohort" title="The same board, across earlier model generations." deck="A sparse, adaptively reprioritized comparison replays the original image prompts and separates strict JSON-plus-rules success from a deterministic written-answer diagnostic." action={{ label: 'Open the request receipts', path: 'evidence-atlas' }} />
    <div className="reading-layout"><LocalToc items={[{ id: 'earlier-method', label: 'Scoring boundary' }, { id: 'earlier-models', label: 'By model' }, { id: 'earlier-receipts', label: 'Every board receipt' }, { id: 'earlier-failures', label: 'First observed failures' }, { id: 'earlier-diagnostics', label: 'Historical diagnostics' }, { id: 'diagnostic-completion', label: 'Matched completion study' }, { id: 'earlier-limits', label: 'Cost & limits' }]} />
      <main className="reading-column" id="main-content">
        {!data && <p role="status">{error ? 'The saved cohort summary is not available. You can still inspect this study’s saved requests and responses in the evidence atlas.' : 'Loading the saved cohort summary…'}</p>}
        {data && <>
          {data.status === 'running' && <Callout tone="caution" title="This cohort is still in progress.">The counts below are a live saved summary, not a final result. Do not interpret unfinished requests or phases as the generation ladder’s stopping point.</Callout>}
          <Section id="earlier-method" title="Same images, separate scores, adaptive sparse schedule">
            <p className="lead">Strict success requires the original JSON-only contract and every Queens rule. The separate written-answer diagnostic extracts exactly one schema-shaped JSON object from visible text, then applies the same deterministic checker; it does not repair placements or replace the strict score.</p>
            <p>The original frozen candidate ladder was reprioritized after round 1 to spend the limited budget on older cross-family anchors before deeper within-family probes. The “candidate rung” shown below preserves each model’s position in that original ladder; it is <strong>not execution chronology</strong>. Consult the schedule amendment for the actual adaptive sequence. Skipped intermediate releases are unobserved—not passes or failures—so this study cannot establish a contiguous generation threshold.</p>
            <DataTable caption="Original-image cohort summary" headers={['Measure', 'Observed value']} rows={[
              ['Original-image requests attempted', String(data.original_attempted)],
              ['Strict JSON and all rules', `${originalStrictCorrect}/${originalAttempted}`],
              ['Mathematically valid written answer after extraction', `${originalWrittenCorrect}/${originalAttempted}`],
              ['Original-image usage cost', earlierUsd(data.original_cost_usd)],
              ['Text-diagnostic usage cost', earlierUsd(data.diagnostic_cost_usd)],
              ['Combined confirmed usage', earlierUsd(data.known_cost_usd)],
              ['Accounted within the incremental budget', `${earlierUsd(data.accounted_usd)} of ${earlierUsd(data.budget_usd)}`],
              ['Budget remaining', earlierUsd(data.remaining_usd)],
            ]} />
            <p>One sample per model/board cell does not estimate stable accuracy. Model versions are the versions reported by OpenRouter; a family slug or alias does not guarantee immutable weights.</p>
          </Section>
          <Section id="earlier-models" title="Results by model and frozen candidate rung">
            <DataTable caption="Original image prompts · deterministic grades" headers={['Original candidate rung', 'Requested model', 'Strict correct', 'Written valid', 'Median API time', 'Reported cost']} rows={modelRows} />
            <p>“Strict correct” and “written valid” use the same attempted-request denominator shown for each model rung. It can be fewer than three when the budget-gated phase did not reach every board. The written-answer measure was preregistered for this October stage; it was post hoc in the historical frontier pilot. Strict formatting failures remain failures in the primary cohort.</p>
          </Section>
          <Section id="earlier-receipts" title="Every board-level response and request receipt">
            <p>Each receipt opens the exact saved request, visible final response or transport error, deterministic grade, and usage/timing metadata. The attached image is decoded to a SHA-256-addressed asset so its submitted pixels remain inspectable without embedding base64 in the public JSON.</p>
            <DataTable caption="Board-level records · original image condition" headers={['Requested model', 'Candidate rung', 'Board', 'Strict', 'Written', 'API time', 'Cost', 'Failure / finish', 'Evidence']} rows={boardRows} />
          </Section>
          <Section id="earlier-failures" title="First sampled failures are not a contiguous threshold">
            <p>Family stopping decisions and the limited budget leave generations untested. An observed failure is only a location in this adaptive sample; it does not show that all older versions fail, all newer ones pass, or that a boundary lies between adjacent releases.</p>
            {firstFailureRows.length
              ? <DataTable caption="Observed family stopping points · original candidate rungs" headers={['Family', 'Model', 'Candidate rung', 'Board', 'Observed failure', 'Evidence']} rows={firstFailureRows} />
              : <p>No family stopping observation is recorded in the current summary.</p>}
          </Section>
      <Section id="earlier-diagnostics" title="Representation diagnostics are a separate condition">
            <p>These text-input probes were selected only after an original-image failure. They remove image perception and change the representation, so they cannot be combined with or used to revise the original-image score.</p>
            <p>The two probes funded in this original $2 phase used complete region matrices on 5×5: GPT-4.1 still failed region coverage; Gemini 2.5 Flash returned a valid placement but not strict JSON. Claude’s failed 9×9 matrix probe was omitted at that time because its conservative $0.230320 reserve exceeded the $0.199215 then remaining. That historical budget omission is now superseded by a separate, additional-$5 controlled completion stage, which includes Claude Sonnet 4 on 9×9 with two fresh requests per representation. The original two probes remain exploratory and are excluded from that new matched denominator; no outcomes or costs are pooled. No correctness feedback or candidate answers entered those original requests.</p>
            {diagnosticRows.length
              ? <DataTable caption="Exploratory diagnostic calls" headers={['Model', 'Board', 'Text condition', 'Strict', 'Written', 'API time', 'Cost', 'Evidence']} rows={diagnosticRows} />
              : <p>No diagnostic results are recorded in the current summary.</p>}
          </Section>
          <Section id="diagnostic-completion" title="Matched diagnostic completion: six failed pairs, three representations">
            {!completion && <p role="status">{completionError ? 'The separate diagnostic-completion summary is not available yet. Its frozen requests and any saved responses remain inspectable in the evidence atlas.' : 'Loading the saved diagnostic-completion summary…'}</p>}
            {completion && <>
              {completion.attempted_calls < completion.planned_calls && <Callout tone="caution" title="This separate $5 stage is still in progress.">The table reflects saved attempts only; unattempted schedule entries are not failures. This stage has its own authorization and ledger, separate from the earlier $2 cohort.</Callout>}
              <p className="lead">The follow-up repeats each of six previously mathematical-failure model/board pairs in the original image condition, a full region matrix, and region cell lists, with two independent fresh one-shot requests per condition. There is no feedback, answer key, retry, or best-of-two score.</p>
              <p>The prior two text probes above are retained as historical exploratory data, not inserted into these matched results. Strict success requires the original JSON-only schema and every Queens rule; written success extracts exactly one schema-shaped object from visible final text and applies the same deterministic checker, without repairs or choosing among answers.</p>
              {completion.attempted_calls === completion.planned_calls && <>
                <h3>What the fresh controls showed</h3>
                <ul>{completionFindings(completion).map(finding => <li key={finding}>{finding}</li>)}</ul>
              </>}
              <DataTable caption="New-stage outcomes by representation" headers={['Representation', 'Attempted / planned', 'Strict correct', 'Written valid', 'Median request time', 'Known usage cost']} rows={completion.conditions.map(condition => [
                condition.label,
                `${condition.attempted_calls} / ${condition.planned_calls}`,
                `${condition.strict_correct_count} / ${condition.attempted_calls}`,
                `${condition.written_correct_count} / ${condition.attempted_calls}`,
                earlierSeconds(completionMedianSeconds(completion.pairs, condition.condition)),
                earlierUsd(condition.known_cost_usd),
              ])} />
              <p>Each pair-condition has two independently reported replicates, not a two-attempt session. Two observations per cell are a limited repeatability check, not a stable accuracy estimate or significance test. Text conditions change modality, wording, token count, and serialization together, so they do not isolate visual perception as a cause.</p>
              <p>The saved timestamps show a 146.89-minute pause between trials 9 and 10. That orchestration gap is excluded from request latency; this was not an uninterrupted session. Service/time drift remains possible despite the unchanged frozen inputs and counterbalanced order.</p>
              <DataTable caption="Every matched pair, replicate, and response receipt" headers={['Pair / earlier failure', 'Representation', 'Replicate 1', 'Replicate 2', 'Evidence receipts']} rows={completion.pairs.flatMap(pair => pair.conditions.map(condition => {
                const reps = [0, 1].map(index => condition.replicates[index])
                const describe = (rep: CompletionReplicate | undefined) => !rep || !rep.attempted
                  ? 'Not attempted'
                  : `Strict ${earlierPassLabel(rep.correct)} · written ${earlierPassLabel(rep.written_correct)} · ${earlierSeconds(rep.seconds)} · ${earlierUsd(rep.cost_usd)}`
                const receipts = reps.filter((rep): rep is CompletionReplicate => Boolean(rep)).map(rep => <span key={rep.call_id}>{completionReceipt(rep.call_id)}</span>)
                return [`${pair.family} · ${pair.model} · ${pair.board_id}\nPrior: ${pair.source_failure_category}`, condition.label, describe(reps[0]), describe(reps[1]), receipts.length ? <>{receipts[0]}{receipts[1] && <> · {receipts[1]}</>}</> : 'No frozen requests']
              }))} />
              <DataTable caption="Separate diagnostic-completion ledger" headers={['Measure', 'Observed value']} rows={[
                ['Scheduled requests', String(completion.planned_calls)],
                ['Attempted requests', String(completion.attempted_calls)],
                ['Strict successes', `${completion.strict_correct_count}/${completion.attempted_calls}`],
                ['Written-answer successes', `${completion.written_correct_count}/${completion.attempted_calls}`],
                ['Known usage cost', earlierUsd(completion.budget.known_cost_usd)],
                ['Accounted against this stage’s cap', `${earlierUsd(completion.budget.accounted_usd)} / ${earlierUsd(completion.budget.cap_usd)}`],
                ['Remaining in this stage', earlierUsd(completion.budget.remaining_usd)],
                ['Summary updated', completion.generated_utc],
              ]} />
              <div className="next-actions"><a href={assetUrl('evidence/diagnostic-completion-REPORT.md')} download>Download the report</a><a href={assetUrl('evidence/diagnostic-completion-PROTOCOL.md')} download>Frozen protocol</a><a href={assetUrl('evidence/diagnostic-completion-manifest.json')} download>Frozen schedule</a><a href={assetUrl('evidence/diagnostic-completion-grades.json')} download>Grades and ledger</a><a href={assetUrl('evidence/diagnostic-completion-audit.json')} download>Independent audit</a><a href="#/evidence-atlas">Browse all trial receipts</a></div>
            </>}
          </Section>
          <Section id="earlier-limits" title="Budget, boundaries, and downloadable record">
            <DataTable caption="Incremental study ledger" headers={['Measure', 'Observed value']} rows={[
              ['Requests attempted', String(data.attempted)],
              ['Original-image attempts', String(data.original_attempted)],
              ['Confirmed usage cost', earlierUsd(data.known_cost_usd)],
              ['Conservative accounted cost', earlierUsd(data.accounted_usd)],
              ['Authorized maximum', earlierUsd(data.budget_usd)],
              ['Remaining allowance', earlierUsd(data.remaining_usd)],
              ['Summary updated', data.updated_utc],
            ]} />
            <ul>{data.conclusions.map((conclusion, index) => <li key={`conclusion-${index}`}>{conclusion}</li>)}</ul>
            <Callout tone="caution" title="A practical service comparison, not an isolated generation effect.">
              <ul>{data.limits.map((limit, index) => <li key={`limit-${index}`}>{limit}</li>)}</ul>
            </Callout>
            <div className="next-actions"><a href={assetUrl('evidence/earlier-generations-REPORT.md')} download>Download the report</a><a href={assetUrl('evidence/earlier-generations-PROTOCOL.md')} download>Frozen protocol</a><a href={assetUrl('evidence/earlier-generations-SCHEDULE_AMENDMENT.md')} download>Adaptive schedule amendment</a><a href={assetUrl('evidence/earlier-generations-REVIEW_NOTES.md')} download>Review and interpretation notes</a><a href="#/evidence-atlas">Search all request receipts</a></div>
          </Section>
        </>}
      </main></div></>
}

function MethodsSources() {
  return <><PageHero trail="Receipts / methods" title="Methods & sources" deck="Definitions keep the narrative honest. This page names the measurement boundaries, the limits, and the primary public references used for interpretation." /><div className="reading-layout"><LocalToc items={[{ id: 'definitions', label: 'Definitions' }, { id: 'limits', label: 'Limits' }, { id: 'models', label: 'Model listings' }, { id: 'sources', label: 'Rules & Jev docs' }]} /><main className="reading-column" id="main-content"><Section id="definitions" title="Measurement boundaries"><div className="definition-list"><div><strong>Correct solution</strong><p>An in-range queen in every row, unique columns, exactly one hit per region, and no touching pair.</p></div><div><strong>Strict pass</strong><p>The original output also satisfies the exact JSON-only schema. Post-hoc extraction is a separate diagnostic.</p></div><div><strong>Elapsed API time</strong><p>Monotonic client time through full response receipt; not isolated model compute or preparation time.</p></div><div><strong>Confirmed USD</strong><p>Returned <code>usage.cost</code>. Missing charges are not zero; allowance is reservation, not billed amount.</p></div></div></Section><Section id="limits" title="Limits that materially affect interpretation"><Callout tone="caution" title="The denominator is intentionally visible.">The October generation replay reuses the three original board images; later Jev studies use small, study-specific cohorts, including six held-out construction boards and nine trajectory boards. These do not establish broad distribution coverage. Clean images, region letters, singleton regions, preview model versions, unequal provider conditions, and generator-family reuse all constrain the inference.</Callout><p>The same board appears in several conditions and candidate lists overlap. Analyze at board level; do not manufacture tiny p-values by multiplying correlated decisions.</p></Section><Section id="models" title="OpenRouter model listings"><ul className="source-list"><li><a href="https://openrouter.ai/openai/gpt-5.6-sol" target="_blank" rel="noreferrer">GPT-5.6 Sol <Icon name="external" /></a><span>OpenAI model listing used for the one-shot pilot.</span></li><li><a href="https://openrouter.ai/anthropic/claude-opus-4.8" target="_blank" rel="noreferrer">Claude Opus 4.8 <Icon name="external" /></a><span>Anthropic model listing used for the one-shot pilot.</span></li><li><a href="https://openrouter.ai/x-ai/grok-4.6" target="_blank" rel="noreferrer">Grok 4.6 <Icon name="external" /></a><span>Model listing; saved runs used the approved Amazon Bedrock US West 2 route.</span></li><li><a href="https://openrouter.ai/google/gemini-3.1-pro-preview" target="_blank" rel="noreferrer">Gemini 3.1 Pro Preview <Icon name="external" /></a><span>Google preview-model listing used for the one-shot pilot.</span></li><li><a href="https://openrouter.ai/typesafe/jev-1.13" target="_blank" rel="noreferrer">Jev 1.13 <Icon name="external" /></a><span>Versioned listing resolved by the experiment.</span></li><li><a href="https://openrouter.ai/~typesafe/jev-latest" target="_blank" rel="noreferrer">Jev Latest alias <Icon name="external" /></a><span>Moving alias supplied for the deep dive; do not equate it with a frozen build.</span></li></ul></Section><Section id="sources" title="Queens rules, play link, and Jev documentation"><ul className="source-list"><li><a href="https://www.linkedin.com/help/linkedin/answer/a6269510" target="_blank" rel="noreferrer">LinkedIn Queens help <Icon name="external" /></a><span>Authoritative regional one-queen and no-touch rule reference.</span></li><li><a href="https://www.linkedin.com/games/queens/" target="_blank" rel="noreferrer">Play LinkedIn Queens <Icon name="external" /></a><span>Live daily game; not a frozen copy of these benchmark boards.</span></li><li><a href="https://docs.typesafe.ai/models" target="_blank" rel="noreferrer">TypeSafe models and aliases <Icon name="external" /></a><span>Text modality, version names, and context notes.</span></li><li><a href="https://docs.typesafe.ai/concepts/system-one" target="_blank" rel="noreferrer">System One <Icon name="external" /></a><span>Typed decisions over structured state.</span></li><li><a href="https://docs.typesafe.ai/primitives/choice" target="_blank" rel="noreferrer">Choice primitive <Icon name="external" /></a><span>Fixed candidate selection and rejection-option design.</span></li><li><a href="https://docs.typesafe.ai/primitives/noul" target="_blank" rel="noreferrer">Noul primitive <Icon name="external" /></a><span>Probability of an affirmative binary judgment.</span></li><li><a href="https://docs.typesafe.ai/primitives/score" target="_blank" rel="noreferrer">Score primitive <Icon name="external" /></a><span>Ordered descriptive levels and expected index.</span></li><li><a href="https://docs.typesafe.ai/model-jaggedness/jev-1.13" target="_blank" rel="noreferrer">Jev 1.13 known limitations <Icon name="external" /></a><span>Vendor cautions about counting, indirection, precision, and cross-primitive consistency.</span></li></ul></Section></main></div></>
}

type TraceStep = { step: number; region: string; cell?: number[]; region_call?: string | null; cell_call?: string | null; region_forced?: boolean; cell_forced?: boolean; candidate_count: number; local_violations?: string[]; on_unique_solution?: boolean }
type Trajectory = { trajectory_id: string; board_id: string; size: number; mode: string; replicate: number; success: boolean; stop_reason: string; correct_queens_before_failure: number; api_elapsed_seconds: number; http_calls: number; forced_decisions: number; steps: TraceStep[] }
type TrajectoryStudy = {
  audit: { calls: number; successful_calls: number; typed_decisions: number; confirmed_usd: string; combined_accounted_usd: string; remaining_usd: string;
    per_board: { board_id: string; size: number; mode: string; attempts: number; solved: number; distinct_traces: number; median_correct_queens_before_failure: number; median_seconds: number }[];
    repeatability: { board_id: string; phase: string; calls: number; choice_counts: Record<string, number>; modal_agreement: number; distinct_probability_vectors: number; max_option_probability_range: number }[];
    controls: { board_id: string; single_region_counts: Record<string, number>; batched_region_counts: Record<string, number>; canonical_cell_counts: Record<string, number>; reversed_cell_counts: Record<string, number> }[];
    choice_probability_disagreements: unknown[] };
  trajectories: Trajectory[];
  boards: { id: string; size: number; regions: number[][] }[];
}

function JevTrajectories({ selectedId }: { selectedId?: string }) {
  const [data, setData] = useState<TrajectoryStudy | null>(null)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState(selectedId || 'sequence-5-1_raw_a1')
  useEffect(() => { if (selectedId) setSelected(selectedId) }, [selectedId])
  useEffect(() => {
    let active = true
    fetch(assetUrl('evidence/trajectory-study.json')).then(response => {
      if (!response.ok) throw new Error(`Evidence HTTP ${response.status}`)
      return response.json()
    }).then(value => { if (active) setData(value) }).catch(reason => { if (active) setError(String(reason)) })
    return () => { active = false }
  }, [])
  const countText = (counts: Record<string, number>) => Object.entries(counts).map(([label, count]) => `${label}: ${count}`).join(' · ') || 'Forced cell; no probe'
  const trace = data?.trajectories.find(item => item.trajectory_id === selected)
  const traceBoard = data?.boards.find(item => item.id === trace?.board_id)
  const replayRegions = useMemo(() => traceBoard?.regions.map(row => row.map(region => String.fromCharCode(65 + region))) ?? [], [traceBoard])
  const replayFrames = useMemo(() => trace && traceBoard ? deriveTrajectoryFrames(trace, replayRegions) : [], [trace, traceBoard, replayRegions])
  const receiptLink = (id: string | null | undefined, forced?: boolean) => id ? <a href={`#/evidence-atlas/2026-09-30-jev-trajectories:${id}`}>Receipt</a> : forced === true ? 'Forced by code' : 'No recorded API receipt'
  return <><PageHero trail="The Jev question / September 30 follow-up" title="Jev solved one board; repeated requests still changed its decisions." deck="Ninety attempts on nine new boards tested color selection followed by cell placement. Every attempt started empty and stopped on its first failed placement, then the next attempt started fresh." />
    <div className="reading-layout"><LocalToc items={[{ id: 'trajectory-results', label: 'Full attempts' }, { id: 'trajectory-trace', label: 'Inspect a trace' }, { id: 'repeatability', label: 'Identical requests' }, { id: 'batching', label: 'Batch & order' }, { id: 'trajectory-methods', label: 'Methods & sources' }]} />
      <main className="reading-column" id="main-content">
        {!data && <p role="status">{error || 'Loading the saved trajectory evidence…'}</p>}
        {data && <><Section id="trajectory-results" title="Completion was concentrated in one 5×5 board" label="90 attempts · 9 distinct boards">
          <p className="lead">Each condition solved <strong>5/15</strong> attempts at 5×5, and <strong>0/15</strong> at both 7×7 and 9×9. All ten successes belong to <code>sequence-5-1</code>. That is one completed board out of nine, with five repetitions in each condition.</p>
          <p>Both conditions provide color membership and explicit cell menus. “Raw” offers all cells in the chosen color. “Local” removes row, column, and touching conflicts using code. Single-option decisions are forced by the harness and incur no model call.</p>
          <DataTable caption="Complete attempts, grouped by board and assistance" headers={['Board', 'Menu', 'Solved', 'Distinct traces', 'Median correct prefix', 'Median seconds']} rows={data.audit.per_board.map(row => [row.board_id, row.mode, `${row.solved}/${row.attempts}`, String(row.distinct_traces), String(row.median_correct_queens_before_failure), row.median_seconds.toFixed(3)])} />
          <Callout tone="caution" title="Local legality did not ensure a solution.">Eleven raw attempts failed an immediate rule. Filtering prevented those immediate conflicts, but all 40 unsolved local attempts still selected a cell outside the unique solution. The sealed oracle stopped those globally unextendable prefixes; it never filtered candidate menus or told Jev the answer.</Callout>
        </Section>
        <Section id="trajectory-trace" title="Follow each color decision and cell decision">
          <label htmlFor="trajectory-select">Saved attempt</label>{' '}<select id="trajectory-select" value={selected} onChange={event => setSelected(event.target.value)}>{data.trajectories.map(item => <option value={item.trajectory_id} key={item.trajectory_id}>{item.trajectory_id} · {item.stop_reason}</option>)}</select>
          {!trace && <p role="status">This attempt is not in the saved evidence. Choose a recorded attempt above; no missing trace will be reconstructed.</p>}
          {trace && <><p><strong>{trace.stop_reason.replace(/_/g, ' ')}</strong> · {trace.correct_queens_before_failure} correct placements before termination · {trace.http_calls} API requests · {trace.forced_decisions} forced decisions · {trace.api_elapsed_seconds.toFixed(3)} summed API seconds.</p>
            {traceBoard && replayFrames.length > 0 && <BoardReplay key={trace.trajectory_id} regions={replayRegions} frames={replayFrames} title="Recorded attempt, one decision at a time" description="This replay reconstructs saved input states and recorded decisions. It distinguishes model choices, forced harness decisions and evaluator outcomes; it does not reveal an internal reasoning trace or invent intermediate search." />}
            <p><a className="text-link" href={`#/jev-trajectories/${encodeURIComponent(trace.trajectory_id)}`}>Link to this recorded attempt <Icon name="external" /></a></p>
            <DataTable caption="Ordered attempt trace" headers={['Step', 'Color', 'Color decision', 'Cell', 'Cell decision', 'Menu size', 'Engine result']} rows={trace.steps.map(step => [String(step.step), step.region, receiptLink(step.region_call, step.region_forced), step.cell ? `r${step.cell[0]}c${step.cell[1]}` : '—', receiptLink(step.cell_call, step.cell_forced), String(step.candidate_count), step.local_violations?.length ? step.local_violations.join(', ') : step.on_unique_solution === true ? 'On unique solution' : step.on_unique_solution === false ? 'Globally unextendable' : 'No recorded evaluator verdict'])} />
            {traceBoard && <details><summary>Show this blank board as a letter matrix</summary><pre>{traceBoard.regions.map(row => row.map(region => String.fromCharCode(65 + region)).join(' ')).join('\n')}</pre></details>}</>}
        </Section>
        <Section id="repeatability" title="The same request did not always produce the same Choice">
          <p>Ten byte-identical HTTP requests were made for each of 17 frozen questions. Choices varied in <strong>8/17</strong> groups; reported probability distributions varied in <strong>17/17</strong>. Modal agreement ranged from 50% to 100%. No trial identifiers, nonces, or fresh UID fields entered the input.</p>
          <DataTable caption="Exact-request repeatability; agreement is not correctness" headers={['Board', 'Question', 'Choices across 10 requests', 'Modal agreement', 'Distinct distributions', 'Largest probability range']} rows={data.audit.repeatability.map(row => [row.board_id, row.phase, countText(row.choice_counts), `${Math.round(row.modal_agreement * 100)}%`, String(row.distinct_probability_vectors), row.max_option_probability_range.toFixed(2)])} />
          <p>The observed OpenRouter route is empirically variable. This does not locate the cause inside the model or serving stack. Fresh requests also do not prove statistically independent samples. A color choice measures preference; every unoccupied color is valid before its cell is selected.</p>
          <Callout tone="note" title="The returned Choice and reported probabilities occasionally disagreed.">In {data.audit.choice_probability_disagreements.length} of {data.audit.typed_decisions} typed answers, another option had a reported probability 0.01 above the selected Choice. We executed the returned Choice verbatim. Raw responses and the initial validator pause/recovery remain recorded; the cause is unresolved.</Callout>
        </Section>
        <Section id="batching" title="Independent questions can share a request; dependent moves cannot">
          <p>Five requests each batched nine independent first-color questions. All completed, producing 45 decision items. This reduces HTTP calls; the shared board context also changes the input. On <code>sequence-7-3</code>, the singleton question favored G in 6/10 calls, whereas the batch favored B in 4/5. The sample does not separate batching effects from ordinary response variation.</p>
          <DataTable caption="Batch and option-order controls are separate treatments" headers={['Board', 'Color alone', 'Color in batch', 'Cell A canonical order', 'Cell A reversed order']} rows={data.audit.controls.map(row => [row.board_id, countText(row.single_region_counts), countText(row.batched_region_counts), countText(row.canonical_cell_counts), countText(row.reversed_cell_counts)])} />
          <p>Reversing cell-option order changed the favored response on several boards. For <code>sequence-5-3</code>, canonical order returned r4c1 ten times; reversed order returned two other cells across three calls. Do not treat option order as an inert formatting choice. A cell question that depends on a chosen color requires a later request; Jev’s questions do not consume each other’s answers.</p>
        </Section>
        <Section id="trajectory-methods" title="Version controls, cost, and inspectable evidence">
          <p>All {data.audit.successful_calls} successful requests used <code>typesafe/jev-1.13</code> and returned <code>typesafe/jev-1.13-20260917</code> from TypeSafe. Every response was checked against that build. No newer Jev version was found in discovery. The dated build string was rejected by the local broker before upstream inference; its direct OpenRouter acceptance remains untested.</p>
          <p>Current Decisions schemas expose no temperature, seed, or top-p control. Choice is documented as the highest-probability option, rather than a sampled token. Our measured variation still matters operationally, even though its internal cause is not established.</p>
          <DataTable caption="Updated experiment ledger" headers={['Measure', 'Observed value']} rows={[["New HTTP attempts", String(data.audit.calls)], ['Successful HTTP requests', String(data.audit.successful_calls)], ['Typed decisions', String(data.audit.typed_decisions)], ['New confirmed USD', `$${data.audit.confirmed_usd}`], ['All studies accounted USD', `$${data.audit.combined_accounted_usd}`], ['Remaining original $3 allowance', `$${data.audit.remaining_usd}`]]} />
          <p>Nine boards come from one synthetic generator family, with singleton regions. The first solved board used three forced decisions per raw attempt and six per local attempt. Complete-solve time is distinct from the shorter time to a stopped failure. This is a no-backtracking experiment, not a test of self-correction after feedback.</p>
          <div className="next-actions"><a href={assetUrl('evidence/trajectory-REPORT.md')} download>Download full report</a><a href={assetUrl('evidence/trajectory-PROTOCOL.md')} download>Frozen protocol</a><a href={assetUrl('evidence/trajectory-RESEARCH.md')} download>Research and sources</a><a href="#/evidence-atlas">Inspect inputs and raw outputs</a></div>
          <ul className="source-list"><li><a href="https://openrouter.ai/docs/api/api-reference/alphadecisions/submit-a-decisions-request" target="_blank" rel="noreferrer">OpenRouter Decisions API</a><span>Typed request schema and routing fields.</span></li><li><a href="https://docs.typesafe.ai/models" target="_blank" rel="noreferrer">TypeSafe models and limits</a><span>Versioning, text input, and parallel questions.</span></li><li><a href="https://docs.typesafe.ai/cookbooks/consistency_choice_cookbook" target="_blank" rel="noreferrer">TypeSafe self-consistency experiment</a><span>Reported variation; its fresh-UID setup differs from these exact-body tests.</span></li><li><a href="https://docs.typesafe.ai/api" target="_blank" rel="noreferrer">TypeSafe API reference</a><span>Choice, distributions, and no sampling controls.</span></li></ul>
        </Section></>}
      </main></div></>
}

function AboutPage() {
  const liveUrl = 'https://joeywilkes12.github.io/queens-model-assessment/'
  const sourceUrl = 'https://github.com/JoeyWilkes12/queens-model-assessment'
  return <><PageHero trail="About / project" title="A public field guide with its receipts attached." deck="This technical book translates a bounded Queens model assessment into a readable narrative without separating the findings from the evidence used to support them." action={{ label: 'Browse the evidence', path: 'evidence-atlas' }} /><div className="reading-layout"><LocalToc items={[{ id: 'purpose', label: 'Purpose' }, { id: 'provenance', label: 'Provenance' }, { id: 'share', label: 'Share this book' }]} /><main className="reading-column" id="main-content"><Section id="purpose" title="Why this book exists"><p className="lead">Evaluation reports are easiest to trust when the conclusion, method, failure cases, and source records remain close together.</p><p>The book teaches the regional Queens constraints, explains what each model was actually asked to do, and keeps the narrow Jev candidate-selection result distinct from autonomous puzzle solving. The evidence atlas exposes sanitized requests, visible responses, deterministic grades, timing, usage, and transport failures for inspection.</p><Callout tone="caution" title="Read the denominator, not just the headline.">The assessed boards are deliberately visible and limited. This is a documented experiment, not a population-level model ranking.</Callout></Section><Section id="provenance" title="Build provenance"><div className="about-ledger"><div><span>Foundation source revision</span><code>dc5b1f77357bcb62580f3e4f5ccf480765586b75</code></div><div><span>Published repository</span><a href={sourceUrl} target="_blank" rel="noreferrer">JoeyWilkes12/queens-model-assessment <Icon name="external" /></a></div><div><span>Delivery</span><strong>Static Vite build on GitHub Pages</strong></div><div><span>Data boundary</span><strong>Sanitized, read-only evidence bundle</strong></div></div><p>This SHA identifies the original book foundation, not the current expanded edition. The September 30 trajectory and October 1 earlier-generations chapters were added in later commits; the repository history is the provenance record for this current publication. The About page, Pages configuration, and QR assets are publication-layer additions and do not alter the assessment results.</p></Section><Section id="share" title="Open the book on another device"><div className="qr-share"><div className="qr-frame"><img src={assetUrl('assets/queens-model-assessment-qr.svg')} alt={`QR code for ${liveUrl}`} /></div><div className="qr-copy"><span className="section-label">Permanent public URL</span><a className="qr-url" href={liveUrl}>{liveUrl}</a><p>Scan the code or use the URL to open this exact public edition. The high-error-correction QR uses a full quiet zone and a dark-on-light treatment for reliable display and print.</p><div className="next-actions"><a href={assetUrl('assets/queens-model-assessment-qr.svg')} download>Download SVG <Icon name="download" /></a><a href={assetUrl('assets/queens-model-assessment-qr.png')} download>Download PNG <Icon name="download" /></a></div></div></div></Section></main></div></>
}

function NotFound() {
  const [, navigate] = useHashPath()
  return <div className="not-found"><span className="section-label">404 / unfiled page</span><h1>This page is not in the book.</h1><p>Use the chapter rail to return to a documented part of the assessment.</p><button className="button button-mint" onClick={() => navigate('executive-summary')}>Return to summary <Icon name="arrow" /></button></div>
}

function Sidebar({ active, open, onClose }: { active: string; open: boolean; onClose: () => void }) {
  const [, navigate] = useHashPath()
  const groups = Array.from(new Set(routes.map(route => route.section)))
  return <><div className={`sidebar-scrim ${open ? 'is-open' : ''}`} onClick={onClose} aria-hidden="true" /><aside className={`book-sidebar ${open ? 'is-open' : ''}`} aria-label="Assessment chapters" role={open ? 'dialog' : undefined} aria-modal={open || undefined}><div className="bookmark"><div className="bookmark-icon"><Icon name="book" size={21} /></div><div><strong>Queens</strong><span>assessment book</span></div><button className="sidebar-close" onClick={onClose} aria-label="Close navigation"><Icon name="close" /></button></div><div className="edition-chip"><span>EXPANDED EDITION</span><strong>01 OCT FOLLOW-UP</strong></div><nav className="chapter-nav">{groups.map(group => <div className="chapter-group" key={group}><span className="chapter-label">{group}</span>{routes.filter(route => route.section === group).map(route => <button key={route.path} className={active === route.path ? 'active' : ''} onClick={() => { navigate(route.path); onClose() }} aria-current={active === route.path ? 'page' : undefined}><span>{route.title}</span>{active === route.path && <span className="nav-dot" aria-hidden="true" />}</button>)}</div>)}</nav><div className="sidebar-footer"><span>FOUNDATION REPORT SHA</span><code>1e103a40…e452d67</code><span>5 figures · 13 retained sections</span></div></aside></>
}

function App() {
  const [path, navigate] = useHashPath()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const menuButtonRef = useRef<HTMLButtonElement>(null)
  const drawerWasOpen = useRef(false)
  const [theme, setTheme] = useState<'light' | 'dark'>(() => (localStorage.getItem('queens-theme') as 'light' | 'dark') || 'light')
  const parts = path.split('/').filter(Boolean)
  const active = parts[0] || 'executive-summary'
  const selectedId = active === 'evidence-atlas' && parts[1] ? parts[1] : undefined
  useEffect(() => { document.documentElement.dataset.theme = theme; localStorage.setItem('queens-theme', theme) }, [theme])
  useEffect(() => { document.title = `${routes.find(route => route.path === active)?.title || 'Queens assessment'} · Queens book` }, [active])
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior }) }, [path])
  useEffect(() => {
    if (drawerOpen) document.querySelector<HTMLButtonElement>('.sidebar-close')?.focus()
    else if (drawerWasOpen.current) menuButtonRef.current?.focus()
    drawerWasOpen.current = drawerOpen
  }, [drawerOpen])
  const page = active === 'executive-summary' ? <ExecutiveSummary />
    : active === 'assessment-receipt' ? <AssessmentReceiptPage />
      : active === 'queens-rules' ? <QueensRules />
        : active === 'protocol-results' ? <ProtocolResults />
          : active === 'jev-primer' ? <JevPrimer />
            : active === 'candidate-engineering' ? <CandidateEngineering />
            : active === 'scale-primitives' ? <ScalePrimitives />
              : active === 'earlier-generations' ? <EarlierGenerations />
                : active === 'jev-trajectories' ? <JevTrajectories selectedId={parts[1]} />
                : active === 'evidence-atlas' ? <EvidenceExplorer selectedId={selectedId} />
                  : active === 'methods-sources' ? <MethodsSources />
                    : active === 'about' ? <AboutPage /> : <NotFound />
  return <div className="app-shell"><Sidebar active={active} open={drawerOpen} onClose={() => setDrawerOpen(false)} /><div className="page-frame" {...(drawerOpen ? { inert: '' } : {})}><header className="mobile-topbar"><button ref={menuButtonRef} className="icon-button" onClick={() => setDrawerOpen(true)} aria-label="Open navigation"><Icon name="menu" /></button><button className="mobile-wordmark" onClick={() => navigate('executive-summary')}>Queens <span>/ assessment</span></button><ThemeToggle theme={theme} setTheme={setTheme} /></header><div className="page-tools"><span>PUBLIC / READ-ONLY</span><ThemeToggle theme={theme} setTheme={setTheme} /></div>{page}<footer className="site-footer"><span>Queens assessment · expanded illustrated edition</span><span><a href="#/about">about this book</a> · <a href="#/methods-sources">methods and sources</a></span></footer></div></div>
}

function ThemeToggle({ theme, setTheme }: { theme: 'light' | 'dark'; setTheme: (theme: 'light' | 'dark') => void }) {
  return <button className="theme-toggle" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}><Icon name={theme === 'light' ? 'moon' : 'sun'} /><span>{theme === 'light' ? 'Dark' : 'Light'}</span></button>
}

export default App
