import { lazy, Suspense, useEffect, useId, useMemo, useRef, useState, type ReactNode } from 'react'
import { BoardReplay } from './BoardReplay'
import { deriveReceiptBoard } from './receiptBoardData'
import { deriveTrajectoryFrames } from './trajectoryBoardData'
import { ReceiptChainNavigation } from './ReceiptChainNavigation'
import { FailureComparison } from './FailureComparison'
import { deriveFailureComparison } from './failureComparisonData'
import { SubQAssessment } from './SubQAssessment'
import { OllamaAssessment } from './OllamaAssessment'
import { OllamaComparison } from './OllamaComparison'
import { DecisionModels } from './DecisionModels'
import { GreedyRule } from './GreedyRule'
import { FrontierTrajectories } from './FrontierTrajectories'
import { LegacyPanel } from './LegacyPanel'
import { CostLedger } from './CostLedger'
import { MethodsCritique } from './MethodsCritique'
import { FeaturedReplays } from './FeaturedReplays'
import { PairStrip } from './PairStrip'
import { Leaderboard } from './Leaderboard'
import { Scoreboard } from './Scoreboard'
import { BoardReceipts } from './BoardReceipts'
import { ReceiptCostStrip, receiptCostText, useReceiptCosts } from './ReceiptCost'

// The Z3 part is large and self-contained; load it only when its route opens.
const Z3Part = lazy(() => import('./z3/Z3Part'))
const LocalQwen = lazy(() => import('./LocalQwen'))

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
  { path: 'how-z3-solves-queens', title: 'How Z3 solves Queens', section: 'The board', description: 'Propositions, clauses, propagation, learning, a proof of uniqueness, and a rule workbench.' },
  { path: 'protocol-results', title: 'Protocol & results', section: 'The board', description: 'Frozen inputs, entrants, outcomes, and route failures.' },
  { path: 'frontier-trajectories', title: 'One queen at a time', section: 'The board', description: 'Frontier models place one queen per request and explain each move.' },
  { path: 'earlier-generations', title: 'Earlier generations', section: 'Model generations', description: 'A sparse cross-generation replay of the original image prompts.' },
  { path: 'local-qwen', title: 'Local open-weight assessments', section: 'Model generations', description: 'Gemma, LLaVA and Qwen studies, four prompt arms, coverage and hosted cost scenarios.' },
  { path: 'local-open-models', title: 'Original 4B pilot', section: 'Model generations', description: 'Saved Ollama requests, deterministic grades, and the conditional Caveman comparison.' },
  { path: 'caveman-summary', title: 'Caveman comparison', section: 'Model generations', description: 'Paired local Qwen receipts, observed correctness and usage, and experimental limits.' },
  { path: 'jev-primer', title: 'Jev primer', section: 'The Jev question', description: 'Typed decisions, text state, and what was actually measured.' },
  { path: 'candidate-engineering', title: 'Candidate engineering', section: 'The Jev question', description: 'Why explicit region lists changed the decision.' },
  { path: 'scale-primitives', title: 'Scale & primitives', section: 'The Jev question', description: 'Larger menus, Noul, Score, and held-out boards.' },
  { path: 'jev-trajectories', title: 'Jev trajectories', section: 'The Jev question', description: 'Empty-board placement, restarts, repeatability, and batching.' },
  { path: 'decision-models', title: 'Decision models vs the index', section: 'Decision models', description: 'Jev, SubQ and OpenAI Decisions against the Artificial Analysis Decision Index.' },
  { path: 'greedy-rule', title: 'Greedy rule baseline', section: 'Decision models', description: 'The no-model rule behind the 80/192 baseline, step by step.' },
  { path: 'subq-assessment', title: 'SubQ Snap replay', section: 'Decision models', description: 'Historical Jev tasks, deterministic results, and every SubQ receipt.' },
  { path: 'evidence-atlas', title: 'Evidence atlas', section: 'Receipts', description: 'Search sanitized requests, outputs, and metadata.' },
  { path: 'board-receipts', title: 'Board receipts', section: 'Receipts', description: 'One page per panel board: who solved it, every written answer, replays and cost.' },
  { path: 'methods-sources', title: 'Methods & sources', section: 'Receipts', description: 'Definitions, limits, and primary links.' },
  { path: 'methods-critique', title: 'Methods critique', section: 'Receipts', description: 'What the design can and cannot support, and the next experiments.' },
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
        <div><span className="receipt-label">Edition</span><strong>1 Nov 2026</strong><span>dated studies retained</span></div>
        <div><span className="receipt-label">Interaction</span><strong>Read-only</strong><span>local evidence only</span></div>
        <div><span className="receipt-label">Outcome</span><strong>Task-specific grades</strong><span>inspect each denominator</span></div>
      </div>
    </section>
  )
}

function LocalToc({ items }: { items: { id: string; label: string }[] }) {
  const jump = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  return <nav className="local-toc" aria-label="On this page"><span className="toc-label">On this page</span>{items.map(item => <button type="button" key={item.id} onClick={() => jump(item.id)}>{item.label}</button>)}</nav>
}

function PageHero({ title, deck, trail, action, children, className = '' }: { title: string; deck: string; trail: string; action?: { label: string; path?: string; scrollTo?: string }; children?: ReactNode; className?: string }) {
  const [, navigate] = useHashPath()
  const act = () => {
    if (action?.scrollTo) document.getElementById(action.scrollTo)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    else if (action?.path) navigate(action.path)
  }
  return <header className={`page-hero ${className}`.trim()}><div className="hero-trail">Queens assessment <span>/</span> {trail}</div><h1>{title}</h1><p className="hero-deck">{deck}</p>{action && <button className="button button-mint" onClick={act}>{action.label}<Icon name="arrow" /></button>}{children}</header>
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

const bookUi = { PageHero, LocalToc, Section, Callout, DataTable }

function Disclosure({ label, children }: { label: string; children: ReactNode }) {
  return <details className="qa-more"><summary>{label}</summary><div className="qa-more-body">{children}</div></details>
}

/** One reader question: a number, a one-line answer, and the evidence behind a disclosure. */
function Answer({ id, question, stat, statLabel, statSr, answer, more, children }: { id: string; question: string; stat: string; statLabel: string; statSr?: string; answer: ReactNode; more: string; children: ReactNode }) {
  const hidden = statSr ? true : undefined
  return <li className="qa-item" id={id}>
    <h3>{question}</h3>
    <p className="qa-stat"><span className="qa-number" aria-hidden={hidden}>{stat}</span><span className="qa-label" aria-hidden={hidden}>{statLabel}</span>{statSr && <span className="sr-only">{statSr}</span>}</p>
    <p className="qa-answer">{answer}</p>
    <Disclosure label={more}>{children}</Disclosure>
  </li>
}

function Facts({ items }: { items: [string, ReactNode][] }) {
  return <dl className="qa-facts">{items.map(([term, text]) => <div key={term}><dt>{term}</dt><dd>{text}</dd></div>)}</dl>
}

function QaLinks({ links }: { links: [string, string][] }) {
  return <p className="qa-links">{links.map(([label, href]) => <a key={href} href={href}>{label} <Icon name="arrow" size={14} /></a>)}</p>
}

/** The main dated studies, related runs grouped: ISO date, shown date, title, route, headline result. */
const studies: [string, string, string, string, string][] = [
  ['2026-09-17', '17 Sep', 'One-shot picture test, 3 boards', 'protocol-results', '11 of 12'],
  ['2026-09-18', '18–19 Sep', 'Jev picks from lists of up to 255', 'scale-primitives', '24/24 with colors listed'],
  ['2026-09-30', '30 Sep', 'Jev builds boards move by move', 'jev-trajectories', '1 of 9 boards'],
  ['2026-10-01', '1 Oct', 'Earlier models, original 3 boards', 'earlier-generations', '21 of 27'],
  ['2026-10-13', '13 Oct', 'SubQ Snap: replay, then move by move', 'subq-assessment', '2 of 9 boards'],
  ['2026-10-14', '14 Oct', 'Decision Index comparison', 'decision-models', 'Jev 57.5'],
  ['2026-10-15', '15–16 Oct', '192-board decision-model test', 'subq-assessment/panel', 'Jev 21, SubQ 19, rule 80'],
  ['2026-10-16', '16 Oct', '36-board picture test, frontier models', 'board-receipts', '140 of 144'],
  ['2026-10-17', '17 Oct', 'One queen at a time, pilot', 'frontier-trajectories', '4 of 4, one 5×5 board'],
  ['2026-10-17', '17–19 Oct', '36-board picture test, earlier models', 'earlier-generations', '206 of 288, eight models'],
  ['2026-10-28', '28 Oct', 'Small local model and Caveman', 'local-open-models', '3 and 5 of 12'],
  ['2026-10-31', '29–31 Oct', 'Larger local Qwen, sampling and loop-stop audits', 'local-qwen', 'Separate cohorts; round 2 updated'],
  ['2026-11-01', '1 Nov', 'Fresh-board local models, four prompt arms', 'local-qwen', 'Qwen 9B 38/48; Gemma 10/48; LLaVA 0/48'],
]

function ExecutiveSummary() {
  return <>
    <PageHero className="page-hero--board" trail="Read first" title="Frontier reasoning models solve Queens boards from a picture. Decision models rarely finish one." deck="Queens is a logic puzzle: one queen in every row, column and colored region, with no two queens touching. Every system in the chart below tried the same boards." />
    <section className="board-cover" aria-labelledby="leaderboard-title"><Leaderboard ui={bookUi} titleId="leaderboard-title" /></section>
    <p className="qa-caveat" style={{ paddingInline: '28px' }}>The leaderboard retains its dated conditions. <a href="#/local-qwen">Local open-weight assessments</a> report Gemma, LLaVA and Qwen, fresh-board prompt controls, sampling rounds and stopping policies separately.</p>
    <AssessmentReceipt />
    <div className="reading-layout">
      <LocalToc items={[{ id: 'finding', label: 'Short answers' }, { id: 'scoreboard', label: 'Results by task' }, { id: 'watch', label: 'Watch it happen' }, { id: 'limits', label: 'Limits' }, { id: 'next', label: 'Go deeper' }]} />
      <main className="reading-column" id="main-content">
        <Section id="finding" title="Short answers">
          <Disclosure label="What a solved board looks like">
            <div className="split-figure">
              <BoardDiagram size="five" compact />
              <div className="figure-copy"><p>Our code checks every answer against the four rules, and two independent solvers confirmed that each test board has exactly one solution. Z3, a standard solver, never competed; its chapter walks through three reference boards.</p><QaLinks links={[['Queens rules', '#/queens-rules'], ['How Z3 solves Queens', '#/how-z3-solves-queens']]} /></div>
            </div>
          </Disclosure>
          <ul className="qa-list">
            <Answer id="qa-image" question="Can a model solve a board from a picture?" stat="140/144" statLabel="right answers, 4 models × 36 boards" statSr="140 of 144: four frontier models on 36 boards." answer="Yes. Each model saw an empty board and wrote the whole solution in one reply." more="Model by model">
              <Facts items={[
                ['16 Oct · The 36 boards', 'GPT-5.6 Sol and Claude Opus 4.8 solved 36, Grok 4.6 and Gemini 3.1 Pro Preview 34. 127 of the 140 followed the requested answer format exactly; 13 were right but formatted loosely. Grok hit its length limit on two 9×9 boards; two Gemini requests were refused by the provider (HTTP 429) before any answer.'],
                ['17–19 Oct · Older models', 'GPT-5.5, GPT-5.4, GPT-5, Claude Opus 4.7 and Opus 4.6 solved 166 of 180 on the same boards; all 14 misses hit the length limit, 13 of them GPT-5’s. Gemini 2.5 Pro solved 27, Gemini 2.5 Flash 12, GPT-4.1 1.'],
                ['17 Sep · Original 3 boards', '11 of 12. Grok’s 7×7 request timed out after ten minutes; sent again unchanged on 16 Oct, it came back correct.'],
                ['1 Oct · Nine earlier models', '21 of 27 on the original boards. Retrying the 6 misses twice each, as an image, a region grid and cell lists, solved 10 of 36 tries, 4 of 12 from the image.'],
                ['17 Oct · One queen per request', 'All four frontier models solved a 5×5 practice board one queen per request, with no revisions. The full 36-board run was over budget, so it never ran.'],
                ['Cost per solved board', 'GPT-5.6 Sol $0.015 (half-price batch service), Grok 4.6 $0.045, Claude Opus 4.8 $0.092, Gemini 3.1 Pro Preview $0.102.'],
              ]} />
              <p className="qa-caveat">The top models scored near perfect on these computer-made, lettered boards, so this test can’t rank them.</p>
              <QaLinks links={[['Protocol & results', '#/protocol-results'], ['Earlier generations', '#/earlier-generations'], ['One queen at a time', '#/frontier-trajectories'], ['Board receipts', '#/board-receipts']]} />
            </Answer>
            <Answer id="qa-build" question="Can a decision model solve a board move by move?" stat="21 · 19" statLabel="of 192 boards, Jev and SubQ Snap" statSr="Jev solved 21 of 192 boards, SubQ Snap 19." answer="Rarely. Neither solved a 9×9, while a simple rule with no model solved 80 boards, 14 of them 9×9." more="By size, and the first nine boards">
              <Facts items={[
                ['By size, 64 boards each', '5×5, 7×7, 9×9: Jev 14, 7, 0 · SubQ Snap 16, 3, 0 · simple rule 42, 24, 14. Random picks would solve about 7 in all.'],
                ['Overlap', 'Only 7 boards were solved by both models; 33 by either.'],
                ['Removing illegal moves', 'Taking illegal squares off the menu helped SubQ on 5×5 boards (15 vs 6 of 64), a gap unlikely to be chance. Jev’s gain, 13 vs 7, could be chance.'],
                ['Real choices', 'When the menu left a real choice of square, Jev kept the solution in reach 43.8% of the time (a random pick: 32.6%), SubQ 30.5% (random: 23.4%). The edge came from unfiltered menus; with illegal squares removed, both were near chance.'],
                ['30 Sep and 13 Oct · First nine boards', 'Each model finished 10 of 90 attempts: Jev 1 board, SubQ 2. The simple rule solved 4 of 9, including a 7×7 and a 9×9 neither model solved.'],
              ]} />
              <p className="qa-caveat">The simple rule fills the color with the fewest open squares first and never undoes a move. The 192-board test plan was fixed before any run.</p>
              <QaLinks links={[['192-board test', '#/subq-assessment/panel'], ['The simple rule', '#/greedy-rule'], ['SubQ Snap replay', '#/subq-assessment'], ['Jev trajectories', '#/jev-trajectories']]} />
            </Answer>
            <Answer id="qa-jev" question="What is Jev good at?" stat="24/24" statLabel="right picks, colors listed" answer="Picking the one valid board from up to 255 options, once our code has checked the other rules and listed the colored regions each option uses. Given only column numbers, it got 1 of 24." more="Try both kinds of list">
              <JevCandidateLens />
              <Facts items={[
                ['Input', 'Jev answers three kinds of question about a text version of the board: pick an option, yes or no, or a score. It cannot read images; our picture prompt was rejected (HTTP 400).'],
                ['Building', 'Asked to produce a board itself, it failed all 5 early probes (four row-by-row builds, one pick from all 120 column orders) and all 6 fresh boards. On those 6 boards it picked the right finished board 6 of 6 times with colors listed, 0 of 6 with columns only.'],
                ['Confidence', 'Its confidence in the right option fell as lists grew from 12 to 255: 0.96 to 0.73 on a 7×7 board, 0.90 to 0.67 on a 9×9.'],
                ['Yes or no', 'Asked whether each option was valid, it said yes to all 6 valid boards and to 5 of the 66 invalid ones.'],
                ['Repeatability', 'Asking the same question again changed its pick in 8 of 17 cases.'],
                ['14 Oct · Decision Index', 'Jev scores 57.5, the highest of 11 decision models on the Artificial Analysis index. Claude Haiku 5.5 (Low), a general model, scores 60.6.'],
              ]} />
              <p className="qa-caveat">The 24 lists come from two boards, so they are not 24 separate puzzles.</p>
              <QaLinks links={[['Jev primer', '#/jev-primer'], ['Candidate engineering', '#/candidate-engineering'], ['Scale & primitives', '#/scale-primitives'], ['Decision models vs the index', '#/decision-models']]} />
            </Answer>
            <Answer id="qa-local" question="Can models running on our own computer do it?" stat="38/48" statLabel="strict requests, Qwen 9B on fresh1" statSr="Qwen 9B returned 38 strict correct answers on 48 requests across 12 fresh1 boards and four prompt conditions." answer="Yes, with large differences between tested configurations. On the same 12 fresh1 boards across four prompt arms, Qwen 9B returned 38 of 48 strict answers, Gemma 4 E4B 10 of 48 and LLaVA-Llama3 0 of 48. Qwen 4B is partial at 13 of 30 recorded, with 48 planned. On the earlier boards, Qwen 27B greedy returned 24 of 24 at its 24,576-token limit. These are separate studies; repeated prompt arms are not independent puzzles." more="Original 4B pilot, 28 Oct">
              <p>The original 4B pilot below is preserved separately from the later larger-budget and larger-model experiments.</p>
              <PairStrip />
              <Facts items={[
                ['Exact format only', 'Plain prompt 1, Caveman 5: both solved 1 board, only Caveman 4, neither 7.'],
                ['Setup', 'Qwen3.5 4B through Ollama, a free app for running models, with no tools. 12 of the 36 boards, 4 per size, one try per board per prompt.'],
                ['Length limit', '16 of 24 replies hit the 12,288-token limit before answering, including all 8 at 9×9. On panel-7-01 the plain prompt answered and Caveman ran out.'],
                ['Tokens', 'Caveman’s instructions added 1,131 tokens to every request, so the total did not fall: 156,608 with Caveman, 151,751 without.'],
                ['Caveman', 'A free third-party add-on that tells the model to answer in as few words as possible, checked for safety before use. No fee; electricity was not measured.'],
              ]} />
              <p className="qa-caveat">Four boards per size, one run each, plain prompt always first: this cannot show that Caveman caused the gain.</p>
              <QaLinks links={[['Local open-weight assessments', '#/local-qwen'], ['Original 4B pilot', '#/local-open-models'], ['Caveman comparison', '#/caveman-summary']]} />
            </Answer>
            <Answer id="qa-cost" question="What did it cost?" stat="$31.48" statLabel="recorded API spend, all studies" answer="Little. Most went on the two 36-board picture tests, and every request, visible reply and grade is saved." more="Breakdown and records">
              <Facts items={[
                ['By provider', 'OpenRouter $31.31, SubQ $0.17.'],
                ['Largest items', 'The two 36-board picture tests: $17.71 for the older models, $9.10 for the frontier models.'],
                ['Not counted', '2 requests with unknown cost, AI agent use outside the studies, and the local runs, which had no fee.'],
                ['Evidence atlas', '5,417 request records from 19 study stages. The local runs keep their own receipts.'],
                ['Board receipts', '36 boards, each tried by 15 systems. None was solved by all 15; each was solved by 7 to 14.'],
              ]} />
              <QaLinks links={[['Assessment receipt', '#/assessment-receipt'], ['Evidence atlas', '#/evidence-atlas'], ['Board receipts', '#/board-receipts']]} />
            </Answer>
          </ul>
        </Section>
        <Section id="scoreboard" title="Results by task">
          <p>Each task scored on its full set of boards, including all 192 decision-model boards. Compare models within one chart.</p>
          <Scoreboard>
            <details className="sb-explain">
              <summary>Why the two charts differ</summary>
              <p>The language models saw a picture of an empty board and wrote the whole answer in one reply, with one try per board. The decision models read a text grid and picked one option at a time from a menu our code built. Moves with a single option were made for them, and the filtered menu also removed illegal squares. They had 10 tries per board on the first nine boards and 2 on the 192-board test. The closest like-for-like test is <a href="#/frontier-trajectories">One queen at a time</a>, so far only a pilot on one 5×5 practice board: the language models get the same text state, with no menu, and may revise.</p>
            </details>
          </Scoreboard>
          <details className="sb-help sb-ledger">
            <summary>Cost per solved board</summary>
            <p>Both 36-board picture tests, scored requests only. The <a href="#/assessment-receipt">assessment receipt</a> lists every API-billed study; each <a href="#/board-receipts">board receipt</a> shows its answers, replays and cost.</p>
            <CostLedger ui={bookUi} compact />
          </details>
        </Section>
        <Section id="watch" title="Watch it happen">
          <p>Each frame is a saved move, including moves the harness forced, and the checker’s verdict.</p>
          <FeaturedReplays />
          <div className="next-actions"><a href="#/frontier-trajectories">Frontier models, one queen per request <Icon name="arrow" /></a><a href="#/greedy-rule">The simple rule, step by step <Icon name="arrow" /></a></div>
        </Section>
        <Section id="limits" title="What this can’t tell you">
          <ul className="limit-list">
            <li><strong>Which model is best.</strong> Queens is one puzzle, the boards are computer-made with lettered regions, and the top models all scored near perfect.</li>
            <li><strong>Whether decision models plan on their own.</strong> Every success went through code that built, filtered or checked their options.</li>
            <li><strong>Much from the small studies.</strong> Jev solved 1 of its first nine boards; its true rate could be anywhere from under 1% to nearly half.</li>
          </ul>
          <Disclosure label="What would settle it">
            <p>Telling a 20% solve rate from a 50% one takes 25 to 64 shared boards per size. The 192-board test has 64 per size; the picture tests 12; the local runs 4. Still to do:</p>
            <ul className="limit-list">
              <li>Mark every square offered in all 180 recorded attempts as on or off the solution (no cost).</li>
              <li>Check whether Jev’s confidence matches how often it is right (no cost).</li>
              <li>Shuffle the order of options (about $0.03) and change how many questions go in one request (about $0.04).</li>
              <li>Let models see mistakes and undo moves (up to $0.29).</li>
              <li>Run one queen at a time on all 36 boards when budget allows.</li>
            </ul>
            <QaLinks links={[['Methods critique', '#/methods-critique']]} />
          </Disclosure>
        </Section>
        <Section id="next" title="Go deeper">
          <div className="next-actions"><a href="#/queens-rules">Queens rules <Icon name="arrow" /></a><a href="#/how-z3-solves-queens">How Z3 solves Queens, in ten chapters <Icon name="arrow" /></a><a href="#/board-receipts">36 board receipts <Icon name="arrow" /></a><a href="#/evidence-atlas">Search 5,417 saved requests <Icon name="arrow" /></a></div>
          <Disclosure label="Main studies by date, 17 Sep to 1 Nov">
            <ol className="study-timeline">{studies.map(([iso, date, title, path, result]) => <li key={`${iso}-${title}`}><time dateTime={iso}>{date}</time><a href={`#/${path}`}>{title}</a><span className="study-result">{result}</span></li>)}</ol>
          </Disclosure>
        </Section>
      </main>
    </div>
  </>
}

function AssessmentReceiptPage() {
  return <><PageHero trail="Read first / receipt" title="Assessment receipt" deck="The report's trust strip, expanded into a readable ledger: what was in scope, what was measured, and which edges remain unresolved." /><AssessmentReceipt /><div className="reading-layout"><LocalToc items={[{ id: 'scope', label: 'Scope' }, { id: 'ledger', label: 'Ledger' }, { id: 'costs', label: 'Cost by evaluation' }, { id: 'boundaries', label: 'Boundaries' }]} /><main className="reading-column" id="main-content"><Section id="scope" title="Scope before score"><p>The original language-model condition was one request, one fresh context, and one scored answer opportunity per model per board. It was not an agentic sandbox. Jev was evaluated separately through typed Decisions calls with text state.</p><div className="scope-grid"><div><span>Included</span><strong>Historical studies and the SubQ replay</strong><p>Requests, visible responses, grades, usage, timing, and preserved transport failures, including the October 1 generation replay and the October 13 SubQ follow-up.</p></div><div><span>Excluded</span><strong>Private and irreproducible payloads</strong><p>No credentials, encrypted reasoning, hidden answer keys, or unrelated repository files.</p></div></div></Section><Section id="ledger" title="September 19 historical ledger"><DataTable caption="Inference cost accounting" headers={['Component', 'Confirmed USD', 'Unresolved allowance']} rows={[['Original reasoning-model pilot', '$0.667009200', '$0.225228800'], ['First Jev deep dive', '$0.000792540', '$0.041268820'], ['Jev 39-call variations', '$0.002274384', '$0.000000000'], ['Jev larger-board scale', '$0.020552112', '$0.040000000'], ['Jev new-board primitives', '$0.004976664', '$0.012497446'], ['Total', '$0.695604900', '$0.318995066']]} /><p className="table-note">Conservative accounted total: <strong>$1.014599966</strong>. Remaining under the $3 allowance: <strong>$1.985400034</strong>. Allowances are reservations, not measured charges.</p></Section><p><a href="#/jev-trajectories">September 30 follow-up: view the updated all-study cost ledger.</a> <a href="#/earlier-generations">The October 1 replay reports its own incremental budget and cost ledger.</a> <a href="#/subq-assessment">SubQ Snap is billed by SubQ directly: $0.17 for its 2,434 answered requests (as of 19 October), itemised in the cost table below.</a></p><Section id="costs" title="API cost by evaluation, board, request and model"><CostLedger ui={bookUi} /></Section><Section id="boundaries" title="The receipt is not a certificate"><Callout tone="stop" title="A trust receipt makes provenance visible; it does not certify a model.">Source class, date, interaction mode, and outcome are reminders to inspect the evidence. They do not imply security, broad quality, or production readiness.</Callout></Section></main></div></>
}

function QueensRules() {
  return <><PageHero trail="The board" title="Queens is regional, not ordinary N-queens." deck="Every row, every column, every connected region, and every touching pair participates in the same global constraint system." /><div className="reading-layout"><LocalToc items={[{ id: 'four-rules', label: 'Four rules' }, { id: 'five-board', label: '5×5 board' }, { id: 'figures', label: 'Report figures' }, { id: 'scale', label: 'Board scale' }]} /><main className="reading-column" id="main-content"><Section id="four-rules" title="Four rules, one placement"><div className="rule-list"><div><span>R1</span><p><strong>One queen per row.</strong> Every row receives exactly one selected cell.</p></div><div><span>R2</span><p><strong>One queen per column.</strong> Column positions must be unique.</p></div><div><span>R3</span><p><strong>One queen per region.</strong> Matching letters identify the same connected region.</p></div><div><span>R4</span><p><strong>No touching queens.</strong> Chebyshev distance must exceed one; longer diagonals are allowed.</p></div></div><p className="lead">The global burden is the interaction: a locally legal cell can consume the only useful region or column needed later.</p><div className="next-actions"><a href="#/how-z3-solves-queens">How Z3 solves Queens <Icon name="arrow" /></a></div></Section><Section id="five-board" title="A verified 5×5 target"><div className="split-figure"><BoardDiagram size="five" /><div className="figure-copy"><p>The solution is columns by row <code>[5, 3, 1, 4, 2]</code>; its occupied regions are C, B, A, D, E. Region C is a singleton in the upper-right cell.</p><Callout tone="evidence" title="Why the red outline mattered in the report.">The illustrative comparison shows a near-miss that passes rows, columns, and spacing but repeats D. The deterministic checker, not visual plausibility, decides correctness.</Callout></div></div></Section><Section id="figures" title="The report's visual receipts"><ReportFigures /></Section><Section id="scale" title="Three boards, not a difficulty curve"><DataTable caption="Canonical target boards" headers={['Board', 'Permutations checked', 'Search nodes', 'Unique solutions']} rows={[['5×5 · easy', '120', '38', '1'], ['7×7 · medium', '5,040', '197', '1'], ['9×9 · hard', '362,880', '1,172', '1']]} /><p>Labels are provisional descriptions of these generated boards. Size, solver search work, image handling, response length, routing, and provider timing are not interchangeable measurements.</p></Section></main></div></>
}

function ProtocolResults() {
  return <><PageHero trail="The board / protocol" title="Freeze the input before interpreting the output." deck="The cleanest result in the report is the protocol boundary: identical board bytes, one request, no tools, and a separate diagnostic for formatting." /><div className="reading-layout"><LocalToc items={[{ id: 'conditions', label: 'Conditions' }, { id: 'results', label: 'Results' }, { id: 'routes', label: 'Routes' }]} /><main className="reading-column" id="main-content"><Section id="conditions" title="What each entrant actually received"><DataTable caption="Evaluation conditions" headers={['Condition', 'Input', 'Model work', 'External help']} rows={[['Four reasoning models', 'Same image and rules per board', 'Generate complete written placement', 'None; no repair turns'], ['Jev native row choices', 'Canonical text region grid', 'Select one column per row', 'Fixed typed options'], ['Jev candidate recognition', 'Text board plus complete placements', 'Choose one option', 'Candidate construction by code'], ['Repository solver', 'Exact region map', 'Solve explicit Boolean constraints', <>Local Z3; not a timed entrant · <a href="#/how-z3-solves-queens">How Z3 solves Queens</a></>]]} /><p>Images were clean 768×768 synthetic PNGs with region letters. They were not live-game screenshots or unlabelled color fields.</p></Section><Section id="results" title="Reasoning-model results"><DataTable caption="Three boards per reasoning model" headers={['Model', 'Strict + correct', 'Written correct', 'Median seconds', 'OpenRouter cost, 3 boards']} rows={[['GPT-5.6 Sol', '3/3', '3/3', '13.70', '$0.034'], ['Claude Opus 4.8', '2/3', '3/3', '39.13', '$0.244'], ['Grok 4.6 via Bedrock', '2/3', '2/3', '91.96', '$0.076 + 1 timeout (cost unknown)'], ['Gemini 3.1 Pro Preview', '2/3', '3/3', '71.97', '$0.313']]} /><p>“Format only” means a unique visible solution passed the post-hoc mathematical check while breaking the original JSON-only contract. “No answer” is not an invalid queen placement.</p></Section><Section id="routes" title="Routes, costs, and operational failures"><Callout tone="caution" title="Do not conflate developer, provider, and gateway.">The historical one-shot reasoning-model requests used OpenRouter through the local credential broker. The new SubQ replay calls its documented provider endpoint directly. Grok's approved route was Amazon Bedrock US West 2. One 7×7 Grok request timed out at 600.964 seconds without a recoverable generation ID; it was not retried.</Callout><div className="next-actions"><a href="#/assessment-receipt">Inspect the cost receipt <Icon name="arrow" /></a><a href="#/evidence-atlas">Open saved records <Icon name="arrow" /></a></div></Section></main></div></>
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
  return <><PageHero trail="The Jev question / candidate engineering" title="Make the missing condition legible." deck="The successful adaptation supplied complete placements and asked Jev to select among them; it did not require discovering one. Code guaranteed rows, columns and non-touching, then exposed occupied region letters so the choice depended on region distinctness." action={{ label: 'Inspect the scale study', path: 'scale-primitives' }} /><div className="reading-layout"><LocalToc items={[{ id: 'lens', label: 'Rule lens' }, { id: 'variations', label: 'Variations' }, { id: 'interpretation', label: 'Interpretation' }]} /><main className="reading-column" id="main-content"><Section id="lens" title="The candidate lens"><JevCandidateLens /></Section><Section id="variations" title="Not every representation improved"><DataTable caption="5×5 candidate-variation results" headers={['Input variation', 'Correct', 'Median API seconds']} rows={[['Column vectors with mixed distractors', '0/3', '0.311'], ['Individual coordinates + region labels', '1/3', '0.324'], ['Precomputed counts + touching pairs', '3/3', '0.314'], ['Flat occupied-region list', '3/3', '0.333'], ['Same list in one sentence', '3/3', '0.233'], ['Reordered descriptions', '1/3', '0.248']]} /><p>All 39 requests returned interpretable Choice answers. The final successful reformulation was exploratory evidence, not a preregistered independent validation.</p></Section><Section id="interpretation" title="What can and cannot be credited"><Callout tone="caution" title="Representation and instruction specificity changed together.">The data support the combined interface: explicit regions plus a precise distinctness instruction. Formatting alone cannot be credited for the improvement, and the model must not receive credit for the local generator's search and validation.</Callout><p>The practical pattern is proposal then proof: a Jev-assisted application may choose a candidate, but the exact checker should gate acceptance.</p></Section></main></div></>
}

function ScalePrimitives() {
  return <><PageHero trail="The Jev question / scale" title="Ranking held; absolute judgment wobbled." deck="Across two reused boards and 24 menu variants, explicit-region selection was correct 24/24; the candidate lists overlap, so these are not 24 independent puzzles. The primitive study shows why selection, validity, and ordinal coverage are different claims." /><div className="reading-layout"><LocalToc items={[{ id: 'scale-table', label: 'Scale table' }, { id: 'new-boards', label: 'Held-out boards' }, { id: 'noul-score', label: 'Noul + Score' }]} /><main className="reading-column" id="main-content"><Section id="scale-table" title="The 255-option edge"><DataTable caption="Jev scale study" headers={['Board', 'Options', 'Columns only', 'Explicit regions', 'Mean P(true), regions']} rows={[['7×7', '12', '0/3', '3/3', '0.960'], ['7×7', '50', '0/3', '3/3', '0.877'], ['7×7', '100', '0/3', '3/3', '0.837'], ['7×7', '255', '0/3', '3/3', '0.730'], ['9×9', '12', '1/3', '3/3', '0.900'], ['9×9', '50', '0/3', '3/3', '0.790'], ['9×9', '100', '0/3', '3/3', '0.730'], ['9×9', '255', '0/3', '3/3', '0.667']]} /><p><strong>All 24 tested explicit-region menus succeeded, including six at the 255-option limit.</strong> Larger menus, new boards and harder search remain untested by this comparison. Also, mean probability on the correct answer declined as options increased, and one 9×9/255 response assigned the true option only 0.50.</p></Section><Section id="new-boards" title="Six new boards, five tasks each"><p>Two boards each at 5×5, 7×7, and 9×9 were accepted from separate fixed seeds after connected regions, unique solutions, and nonduplication checks. These are six board-level units, not 30 independent puzzles or 534 independent decisions.</p><div className="finding-strip finding-strip--quiet"><div><strong>0/6</strong><span>matrix construction</span></div><div><strong>0/6</strong><span>prose construction</span></div><div><strong>6/6</strong><span>explicit-region Choice</span></div></div><Callout tone="caution" title="Distribution diversity is not established.">The new boards share a generator family. The 9×9 construction intentionally restricts two seed regions from growing. Size must not be equated with validated difficulty.</Callout></Section><Section id="noul-score" title="Noul and Score are not interchangeable"><DataTable caption="Held-out primitive checks" headers={['Condition', 'Result', 'What it means']} rows={[['Explicit regions · answer present · Noul', '6 TP, 5 FP', 'True candidate ranked highest, but threshold acceptance was unsafe.'], ['Explicit regions · answer present · Score', '32/72 modal level', 'Ordinal precision stayed below a majority reference.'], ['All-invalid · Choice none', '6/6 rejects', 'Choice chose “none” on all six all-invalid sets; a small same-family sample, not a general rejection rate.'], ['All-invalid · Noul < .5', '4/6 rejects', 'Independent thresholds missed two sets.'], ['All-invalid · Score complete < .5', '3/6 rejects', 'Scalar threshold missed three sets.']]}/><p>Choice's winning option and Noul/Score's absolute values answer different questions. Keep the exact validator in the loop.</p></Section></main></div></>
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
  const costOf = useReceiptCosts()
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
  return <><PageHero trail="Receipts / atlas" title="Evidence atlas" deck="Search the sanitized request, visible output, deterministic grade, and metadata behind the assessment. Every record is a bounded receipt, not a private raw dump." /><main className="atlas" id="main-content"><div className="atlas-controls"><label className="search-field atlas-control-search"><span className="sr-only">Search evidence</span><Icon name="search" /><input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Search run, model author, version, board, or excluded" /></label><label className="select-field atlas-control-study"><span className="sr-only">Filter study</span><select value={stage} onChange={event => setStage(event.target.value)}>{stages.map(item => <option key={item}>{item}</option>)}</select></label><label className="select-field atlas-control-outcome"><span className="sr-only">Filter assessment outcome</span><select value={outcome} onChange={event => setOutcome(event.target.value)}><option value="all">All outcomes</option><option value="non_success">Non-success evidence</option><option value="success">Success ({outcomeCounts.success})</option><option value="model_failure">Model failures ({outcomeCounts.model_failure})</option><option value="request_failure">Request failures ({outcomeCounts.request_failure})</option><option value="not_run">Not run ({outcomeCounts.not_run})</option><option value="ungraded">Ungraded / ledgers ({outcomeCounts.ungraded})</option></select></label><label className="select-field atlas-control-provider"><span className="sr-only">Filter model provider or author</span><select value={provider} onChange={event => setProvider(event.target.value)}><option value="all">All model authors</option>{providers.map(item => <option value={item} key={item}>{item} ({providerCounts[item]})</option>)}</select></label><label className="select-field atlas-control-model"><span className="sr-only">Filter exact model version</span><select value={modelVersion} onChange={event => setModelVersion(event.target.value)}><option value="all">All model versions</option>{modelVersions.map(item => <option value={item} key={item}>{item} ({modelVersionCounts[item]})</option>)}</select></label><label className="excluded-field atlas-control-excluded"><input type="checkbox" checked={showExcluded} onChange={event => setShowExcluded(event.target.checked)} /><span>Show excluded <strong>{excludedCount}</strong></span></label></div><p className="atlas-count" aria-live="polite">Showing <strong>{visible.length}</strong> of {filtered.length} matching records · {records.length - excludedCount} included by default · {excludedCount} excluded</p><div className="evidence-list">{visible.map(record => <button className={`evidence-row${record.excluded ? ' evidence-row--excluded' : ''}`} key={record.id} onClick={() => navigate(`evidence-atlas/${record.id}`)}><span className={`status-dot outcome-dot-${record.assessmentOutcome || 'ungraded'}`} aria-hidden="true" /><span className="evidence-main"><span className="evidence-title">{record.title}<OutcomeTag outcome={record.assessmentOutcome} />{record.excluded && <span className="evidence-flag">Excluded</span>}<Icon name="arrow" /></span><span>{record.summary}</span></span><span className="evidence-meta"><strong>{record.stage}</strong><span>{record.kind} · {displayRequestStatus(record.status)}</span>{receiptCostText(costOf(record.id)) && <span className="evidence-cost">Cost {receiptCostText(costOf(record.id))}</span>}</span></button>)}</div>{visible.length < filtered.length && <div className="atlas-pagination"><button className="button button-outline" type="button" onClick={() => setVisibleCount(count => count + 30)}>Load 30 more</button><button className="back-link" type="button" onClick={() => setVisibleCount(filtered.length)}>Show all {filtered.length}</button></div>}{!filtered.length && <div className="empty-state"><strong>No records match.</strong><span>Try a shorter query, broaden the model author or version, or show excluded evidence.</span></div>}<Callout tone="evidence" title="How outcome tags work">Success and model assessment failure require a completed request plus a saved deterministic grade. Request and transport failures produced no model answer. Excluded records remain searchable and directly addressable, but do not appear in the default browse view.</Callout></main></>
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
  const failureComparison = useMemo(() => record.assessmentOutcome === 'model_failure' ? deriveFailureComparison(loaded.request, loaded.output, loaded.grade) : null, [record.assessmentOutcome, loaded.request, loaded.output, loaded.grade])
  return <>
    <PageHero trail={`Receipts / atlas / ${record.id}`} title={record.title} deck={record.summary}>
      <div className="detail-flags"><OutcomeTag outcome={record.assessmentOutcome} /><span className={`status-pill status-${record.status || 'review'}`}>{displayRequestStatus(record.status)}</span>{record.excluded && <span className="status-pill evidence-flag">Excluded</span>}</div>
    </PageHero>
    <main className="evidence-detail" id="main-content">
      <button className="back-link" onClick={onBack}>← Back to atlas</button>
      <ReceiptChainNavigation receiptId={record.id} />
      <ReceiptCostStrip id={record.id} board={record.board ?? undefined} />
      <ErrorContextCallout record={record} />
      {record.excluded && !record.errorContext && <Callout tone="caution" title="Excluded from the default atlas"><p>{record.exclusionReason || 'This record documents a request-level failure rather than a model response.'}</p><p>It remains searchable, directly addressable, and available for audit.</p></Callout>}
      <div className="detail-toolbar"><span><strong>{record.stage}</strong> · {record.kind}</span><div><button className="button button-small" onClick={copy} disabled={loading}><Icon name="copy" />{loading ? 'Loading…' : copied ? 'Copied' : 'Copy JSON'}</button><button className="button button-small button-outline" onClick={download} disabled={loading}><Icon name="download" />Download</button></div></div>
      {!loading && failureComparison && <FailureComparison data={failureComparison} />}
      {!loading && !failureComparison && boardView && <BoardReplay key={record.id} regions={boardView.regions} frames={boardView.frames} title="Board reconstructed from this receipt" description={boardView.description} allowPlayback={false} />}
      {!loading && !boardView && inlineAssets.length === 0 && record.kind !== 'grade-source' && <p className="board-view-unavailable">No complete, unambiguous board partition was found in this receipt. The raw input and output below remain authoritative; no board or missing state has been guessed.</p>}
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
    <div className="reading-layout"><LocalToc items={[{ id: 'earlier-panel', label: '36-board panel' }, { id: 'earlier-method', label: 'Scoring boundary' }, { id: 'earlier-models', label: 'By model' }, { id: 'earlier-receipts', label: 'Every board receipt' }, { id: 'earlier-failures', label: 'First observed failures' }, { id: 'earlier-diagnostics', label: 'Historical diagnostics' }, { id: 'diagnostic-completion', label: 'Matched completion study' }, { id: 'earlier-limits', label: 'Cost & limits' }]} />
      <main className="reading-column" id="main-content">
        <Section id="earlier-panel" title="36 boards per model (17–19 October)"><LegacyPanel ui={bookUi} /></Section>
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
  return <><PageHero trail="Receipts / methods" title="Methods & sources" deck="Definitions keep the narrative honest. This page names the measurement boundaries, the limits, and the primary public references used for interpretation." /><div className="reading-layout"><LocalToc items={[{ id: 'definitions', label: 'Definitions' }, { id: 'limits', label: 'Limits' }, { id: 'models', label: 'Model listings' }, { id: 'sources', label: 'Rules & Jev docs' }]} /><main className="reading-column" id="main-content"><Section id="definitions" title="Measurement boundaries"><div className="definition-list"><div><strong>Correct solution</strong><p>An in-range queen in every row, unique columns, exactly one hit per region, and no touching pair.</p></div><div><strong>Strict pass</strong><p>The original output also satisfies the exact JSON-only schema. Post-hoc extraction is a separate diagnostic.</p></div><div><strong>Elapsed API time</strong><p>Monotonic client time through full response receipt; not isolated model compute or preparation time.</p></div><div><strong>Confirmed USD</strong><p>Returned <code>usage.cost</code>. Missing charges are not zero; allowance is reservation, not billed amount.</p></div></div></Section><Section id="limits" title="Limits that materially affect interpretation"><Callout tone="caution" title="The denominator is intentionally visible.">The October generation replay reuses the three original board images; later Jev studies use small, study-specific cohorts, including six held-out construction boards and nine trajectory boards. These do not establish broad distribution coverage. Clean images, region letters, singleton regions, preview model versions, unequal provider conditions, and generator-family reuse all constrain the inference.</Callout><p>The same board appears in several conditions and candidate lists overlap. Use distinct boards for generalization, paired board-level contrasts for treatments, and board-cluster uncertainty for repeated trajectories; report call-level variability separately. <a href="#/methods-critique">Read the full methods critique.</a></p></Section><Section id="models" title="OpenRouter model listings"><ul className="source-list"><li><a href="https://openrouter.ai/openai/gpt-5.6-sol" target="_blank" rel="noreferrer">GPT-5.6 Sol <Icon name="external" /></a><span>OpenAI model listing used for the one-shot pilot.</span></li><li><a href="https://openrouter.ai/anthropic/claude-opus-4.8" target="_blank" rel="noreferrer">Claude Opus 4.8 <Icon name="external" /></a><span>Anthropic model listing used for the one-shot pilot.</span></li><li><a href="https://openrouter.ai/x-ai/grok-4.6" target="_blank" rel="noreferrer">Grok 4.6 <Icon name="external" /></a><span>Model listing; saved runs used the approved Amazon Bedrock US West 2 route.</span></li><li><a href="https://openrouter.ai/google/gemini-3.1-pro-preview" target="_blank" rel="noreferrer">Gemini 3.1 Pro Preview <Icon name="external" /></a><span>Google preview-model listing used for the one-shot pilot.</span></li><li><a href="https://openrouter.ai/typesafe/jev-1.13" target="_blank" rel="noreferrer">Jev 1.13 <Icon name="external" /></a><span>Versioned listing resolved by the experiment.</span></li><li><a href="https://openrouter.ai/~typesafe/jev-latest" target="_blank" rel="noreferrer">Jev Latest alias <Icon name="external" /></a><span>Moving alias supplied for the deep dive; do not equate it with a frozen build.</span></li></ul></Section><Section id="sources" title="Queens rules, play link, and Jev documentation"><ul className="source-list"><li><a href="https://www.linkedin.com/help/linkedin/answer/a6269510" target="_blank" rel="noreferrer">LinkedIn Queens help <Icon name="external" /></a><span>Authoritative regional one-queen and no-touch rule reference.</span></li><li><a href="https://www.linkedin.com/games/queens/" target="_blank" rel="noreferrer">Play LinkedIn Queens <Icon name="external" /></a><span>Live daily game; not a frozen copy of these benchmark boards.</span></li><li><a href="https://docs.typesafe.ai/models" target="_blank" rel="noreferrer">TypeSafe models and aliases <Icon name="external" /></a><span>Text modality, version names, and context notes.</span></li><li><a href="https://docs.typesafe.ai/concepts/system-one" target="_blank" rel="noreferrer">System One <Icon name="external" /></a><span>Typed decisions over structured state.</span></li><li><a href="https://docs.typesafe.ai/primitives/choice" target="_blank" rel="noreferrer">Choice primitive <Icon name="external" /></a><span>Fixed candidate selection and rejection-option design.</span></li><li><a href="https://docs.typesafe.ai/primitives/noul" target="_blank" rel="noreferrer">Noul primitive <Icon name="external" /></a><span>Probability of an affirmative binary judgment.</span></li><li><a href="https://docs.typesafe.ai/primitives/score" target="_blank" rel="noreferrer">Score primitive <Icon name="external" /></a><span>Ordered descriptive levels and expected index.</span></li><li><a href="https://docs.typesafe.ai/model-jaggedness/jev-1.13" target="_blank" rel="noreferrer">Jev 1.13 known limitations <Icon name="external" /></a><span>Vendor cautions about counting, indirection, precision, and cross-primitive consistency.</span></li></ul></Section></main></div></>
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
  return <><PageHero trail="About / project" title="A public field guide with its receipts attached." deck="This technical book translates a bounded Queens model assessment into a readable narrative without separating the findings from the evidence used to support them." action={{ label: 'Browse the evidence', path: 'evidence-atlas' }} /><div className="reading-layout"><LocalToc items={[{ id: 'purpose', label: 'Purpose' }, { id: 'provenance', label: 'Provenance' }, { id: 'share', label: 'Share this book' }]} /><main className="reading-column" id="main-content"><Section id="purpose" title="Why this book exists"><p className="lead">Evaluation reports are easiest to trust when the conclusion, method, failure cases, and source records remain close together.</p><p>The book teaches the regional Queens constraints, explains what each model was actually asked to do, and keeps the narrow Jev candidate-selection result distinct from autonomous puzzle solving. The evidence atlas exposes sanitized requests, visible responses, deterministic grades, timing, usage, and transport failures for inspection.</p><Callout tone="caution" title="Read the denominator, not just the headline.">The assessed boards are deliberately visible and limited. This is a documented experiment, not a population-level model ranking.</Callout></Section><Section id="provenance" title="Build provenance"><div className="about-ledger"><div><span>Foundation source revision</span><code>dc5b1f77357bcb62580f3e4f5ccf480765586b75</code></div><div><span>Published repository</span><a href={sourceUrl} target="_blank" rel="noreferrer">JoeyWilkes12/queens-model-assessment <Icon name="external" /></a></div><div><span>Delivery</span><strong>Static Vite build on GitHub Pages</strong></div><div><span>Data boundary</span><strong>Sanitized, read-only evidence bundle</strong></div></div><p>This SHA identifies the original book foundation, not the current expanded edition. The September 30 trajectory, October 1 earlier-generations, and October 13 SubQ chapters were added in later commits; the repository history is the provenance record for this current publication. The About page, Pages configuration, and QR assets are publication-layer additions and do not alter the assessment results.</p><p className="atlas-provenance">The standalone Constraint Atlas site (<a href="https://joeywilkes12.github.io/constraint-atlas-queens/" target="_blank" rel="noreferrer">https://joeywilkes12.github.io/constraint-atlas-queens/</a>) is kept as a backup; its content now lives in the <a href="#/how-z3-solves-queens">How Z3 solves Queens</a> part: the Chapter 10 workbench, the Chapter 2 sidebar on other ways to model the board, the Beyond Queens appendix and the added research citations.</p></Section><Section id="share" title="Open the book on another device"><div className="qr-share"><div className="qr-frame"><img src={assetUrl('assets/queens-model-assessment-qr.svg')} alt={`QR code for ${liveUrl}`} /></div><div className="qr-copy"><span className="section-label">Permanent public URL</span><a className="qr-url" href={liveUrl}>{liveUrl}</a><p>Scan the code or use the URL to open this exact public edition. The high-error-correction QR uses a full quiet zone and a dark-on-light treatment for reliable display and print.</p><div className="next-actions"><a href={assetUrl('assets/queens-model-assessment-qr.svg')} download>Download SVG <Icon name="download" /></a><a href={assetUrl('assets/queens-model-assessment-qr.png')} download>Download PNG <Icon name="download" /></a></div></div></div></Section></main></div></>
}

function NotFound() {
  const [, navigate] = useHashPath()
  return <div className="not-found"><span className="section-label">404 / unfiled page</span><h1>This page is not in the book.</h1><p>Use the chapter rail to return to a documented part of the assessment.</p><button className="button button-mint" onClick={() => navigate('executive-summary')}>Return to summary <Icon name="arrow" /></button></div>
}

function Sidebar({ active, open, onClose }: { active: string; open: boolean; onClose: () => void }) {
  const [, navigate] = useHashPath()
  const groups = Array.from(new Set(routes.map(route => route.section)))
  return <><div className={`sidebar-scrim ${open ? 'is-open' : ''}`} onClick={onClose} aria-hidden="true" /><aside className={`book-sidebar ${open ? 'is-open' : ''}`} aria-label="Assessment chapters" role={open ? 'dialog' : undefined} aria-modal={open || undefined}><div className="bookmark"><div className="bookmark-icon"><Icon name="book" size={21} /></div><div><strong>Queens</strong><span>assessment book</span></div><button className="sidebar-close" onClick={onClose} aria-label="Close navigation"><Icon name="close" /></button></div><div className="edition-chip"><span>EXPANDED EDITION</span><strong>1 NOV UPDATE</strong></div><nav className="chapter-nav">{groups.map(group => <div className="chapter-group" key={group}><span className="chapter-label">{group}</span>{routes.filter(route => route.section === group).map(route => <button key={route.path} className={active === route.path ? 'active' : ''} onClick={() => { navigate(route.path); onClose() }} aria-current={active === route.path ? 'page' : undefined}><span>{route.title}</span>{active === route.path && <span className="nav-dot" aria-hidden="true" />}</button>)}</div>)}</nav><div className="sidebar-footer"><span>FOUNDATION REPORT SHA</span><code>1e103a40…e452d67</code><span>5 figures · {routes.length} book chapters</span></div></aside></>
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
        : active === 'how-z3-solves-queens' ? <Suspense fallback={<p className="board-view-unavailable" style={{ padding: "40px 28px" }} role="status">Loading How Z3 solves Queens…</p>}><Z3Part ui={bookUi} section={parts[1]} /></Suspense>
        : active === 'protocol-results' ? <ProtocolResults />
          : active === 'jev-primer' ? <JevPrimer />
            : active === 'candidate-engineering' ? <CandidateEngineering />
            : active === 'scale-primitives' ? <ScalePrimitives />
              : active === 'earlier-generations' ? <EarlierGenerations />
                : active === 'jev-trajectories' ? <JevTrajectories selectedId={parts[1]} />
                : active === 'local-open-models' ? parts[1] === 'receipt' ? <OllamaComparison ui={bookUi} view="receipt" callId={parts[2]} /> : parts[1] === 'configuration' ? <OllamaComparison ui={bookUi} view="configuration" /> : <OllamaAssessment ui={bookUi} />
                : active === 'local-qwen' ? <Suspense fallback={<p role="status" className="ollama-standalone">Loading local open-weight assessments…</p>}><LocalQwen ui={bookUi} studyId={parts[1] === 'receipt' || parts[1] === 'study' ? parts[2] : undefined} callId={parts[1] === 'receipt' ? parts[3] : undefined} /></Suspense>
                : active === 'caveman-summary' ? <OllamaComparison ui={bookUi} view="summary" />
                : active === 'subq-assessment' ? <SubQAssessment ui={bookUi} selectedId={parts[1]} />
                : active === 'decision-models' ? <DecisionModels ui={bookUi} />
                : active === 'greedy-rule' ? <GreedyRule ui={bookUi} />
                : active === 'frontier-trajectories' ? <FrontierTrajectories ui={bookUi} />
                : active === 'openai-decisions-plan' ? <DecisionModels ui={bookUi} focusSection="openai-plan" />
                : active === 'methods-critique' ? <MethodsCritique ui={bookUi} />
                : active === 'evidence-atlas' ? <EvidenceExplorer selectedId={selectedId} />
                : active === 'board-receipts' ? <BoardReceipts ui={bookUi} boardId={parts[1]} />
                  : active === 'methods-sources' ? <MethodsSources />
                    : active === 'about' ? <AboutPage /> : <NotFound />
  return <div className="app-shell"><Sidebar active={active} open={drawerOpen} onClose={() => setDrawerOpen(false)} /><div className="page-frame" {...(drawerOpen ? { inert: '' } : {})}><header className="mobile-topbar"><button ref={menuButtonRef} className="icon-button" onClick={() => setDrawerOpen(true)} aria-label="Open navigation"><Icon name="menu" /></button><button className="mobile-wordmark" onClick={() => navigate('executive-summary')}>Queens <span>/ assessment</span></button><ThemeToggle theme={theme} setTheme={setTheme} /></header><div className="page-tools"><span>PUBLIC / READ-ONLY</span><ThemeToggle theme={theme} setTheme={setTheme} /></div>{page}<footer className="site-footer"><span>Queens assessment · expanded illustrated edition</span><span><a href="#/about">about this book</a> · <a href="#/methods-sources">methods and sources</a></span></footer></div></div>
}

function ThemeToggle({ theme, setTheme }: { theme: 'light' | 'dark'; setTheme: (theme: 'light' | 'dark') => void }) {
  return <button className="theme-toggle" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}><Icon name={theme === 'light' ? 'moon' : 'sun'} /><span>{theme === 'light' ? 'Dark' : 'Light'}</span></button>
}

export default App
