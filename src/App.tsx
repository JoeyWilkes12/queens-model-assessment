import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'

type Route = {
  path: string
  title: string
  section: string
  description: string
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
  run?: string | null
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
  run?: string | null
  status?: string
  kind?: string
  hasResponse?: boolean
  hasMetadata?: boolean
  hasGrade?: boolean
  partialResponse?: boolean
  files?: { request?: string; response?: string; metadata?: string; grade?: string | null }
  failure?: unknown
}

const routes: Route[] = [
  { path: 'executive-summary', title: 'Executive summary', section: 'Read first', description: 'Outcome, boundaries, and the short version.' },
  { path: 'assessment-receipt', title: 'Assessment receipt', section: 'Read first', description: 'What was tested, when, and how to read the ledger.' },
  { path: 'queens-rules', title: 'Queens rules', section: 'The board', description: 'Regional constraints, boards, and verified solutions.' },
  { path: 'protocol-results', title: 'Protocol & results', section: 'The board', description: 'Frozen inputs, entrants, outcomes, and route failures.' },
  { path: 'jev-primer', title: 'Jev primer', section: 'The Jev question', description: 'Typed decisions, text state, and what was actually measured.' },
  { path: 'candidate-engineering', title: 'Candidate engineering', section: 'The Jev question', description: 'Why explicit region lists changed the decision.' },
  { path: 'scale-primitives', title: 'Scale & primitives', section: 'The Jev question', description: 'Larger menus, Noul, Score, and held-out boards.' },
  { path: 'evidence-atlas', title: 'Evidence atlas', section: 'Receipts', description: 'Search sanitized requests, outputs, and metadata.' },
  { path: 'methods-sources', title: 'Methods & sources', section: 'Receipts', description: 'Definitions, limits, and primary links.' },
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
  const detail = record.kind === 'grade-source'
    ? 'Complete study-level evaluator ledger retained as a sanitized grade source.'
    : record.failure
      ? 'A preserved transport or provider failure is available in the sanitized receipt.'
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
    run: record.run,
    metadata: { board: record.board, model: record.model, run: record.run, size: record.size, status: record.status, hasResponse: record.hasResponse, hasMetadata: record.hasMetadata, hasGrade: record.hasGrade, partialResponse: record.partialResponse, failure: record.failure },
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

function Icon({ name, size = 18 }: { name: 'arrow' | 'book' | 'close' | 'menu' | 'moon' | 'sun' | 'copy' | 'download' | 'search' | 'external'; size?: number }) {
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
  return <div className="figure-grid" aria-label="Report illustrations">{figures.map(([src, caption]) => <figure key={src}><img src={assetUrl(`assets/${src}`)} alt={caption} loading="lazy" /><figcaption>{caption}</figcaption></figure>)}</div>
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
  return <div className="table-wrap" tabIndex={0} role="region" aria-label={caption}><table><caption>{caption}</caption><thead><tr>{headers.map(header => <th scope="col" key={header}>{header}</th>)}</tr></thead><tbody>{rows.map((row, index) => <tr key={index}>{row.map((cell, cellIndex) => cellIndex === 0 ? <th scope="row" key={cellIndex}>{cell}</th> : <td key={cellIndex}>{cell}</td>)}</tr>)}</tbody></table></div>
}

function ExecutiveSummary() {
  return <>
    <PageHero trail="Read first" title="The solver is not the selector." deck="The expanded Queens assessment finds a sharp boundary: multimodal reasoning models constructed valid written solutions from blank boards, while Jev became reliable only when code made the remaining decision explicit and narrow." action={{ label: 'Open the evidence atlas', path: 'evidence-atlas' }} />
    <AssessmentReceipt />
    <div className="reading-layout">
      <LocalToc items={[{ id: 'finding', label: 'The finding' }, { id: 'board-proof', label: 'Board proof' }, { id: 'comparison', label: 'Comparison' }, { id: 'limits', label: 'Limits' }]} />
      <main className="reading-column" id="main-content">
        <Section id="finding" title="A useful distinction, with a small denominator" label="Executive summary">
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
  return <><PageHero trail="Read first / receipt" title="Assessment receipt" deck="The report's trust strip, expanded into a readable ledger: what was in scope, what was measured, and which edges remain unresolved." /><AssessmentReceipt /><div className="reading-layout"><LocalToc items={[{ id: 'scope', label: 'Scope' }, { id: 'ledger', label: 'Ledger' }, { id: 'boundaries', label: 'Boundaries' }]} /><main className="reading-column" id="main-content"><Section id="scope" title="Scope before score"><p>The original language-model condition was one request, one fresh context, and one scored answer opportunity per model per board. It was not an agentic sandbox. Jev was evaluated separately through typed Decisions calls with text state.</p><div className="scope-grid"><div><span>Included</span><strong>Five models and four Jev stages</strong><p>Requests, visible responses, grades, usage, timing, and preserved transport failures.</p></div><div><span>Excluded</span><strong>Private and irreproducible payloads</strong><p>No credentials, encrypted reasoning, hidden answer keys, or unrelated repository files.</p></div></div></Section><Section id="ledger" title="The conservative ledger"><DataTable caption="Inference cost accounting" headers={['Component', 'Confirmed USD', 'Unresolved allowance']} rows={[['Original reasoning-model pilot', '$0.667009200', '$0.225228800'], ['First Jev deep dive', '$0.000792540', '$0.041268820'], ['Jev 39-call variations', '$0.002274384', '$0.000000000'], ['Jev larger-board scale', '$0.020552112', '$0.040000000'], ['Jev new-board primitives', '$0.004976664', '$0.012497446'], ['Total', '$0.695604900', '$0.318995066']]} /><p className="table-note">Conservative accounted total: <strong>$1.014599966</strong>. Remaining under the $3 allowance: <strong>$1.985400034</strong>. Allowances are reservations, not measured charges.</p></Section><Section id="boundaries" title="The receipt is not a certificate"><Callout tone="stop" title="A trust receipt makes provenance visible; it does not certify a model.">Source class, date, interaction mode, and outcome are reminders to inspect the evidence. They do not imply security, broad quality, or production readiness.</Callout></Section></main></div></>
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

function EvidenceExplorer({ selectedId }: { selectedId?: string }) {
  const [records, setRecords] = useState<EvidenceRecord[]>(fallbackEvidence)
  const [query, setQuery] = useState('')
  const [stage, setStage] = useState('All studies')
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
  const filtered = useMemo(() => records.filter(record => {
    const haystack = `${record.id} ${record.title} ${record.stage} ${record.kind} ${record.summary} ${record.model || ''} ${record.board || ''} ${record.run || ''}`.toLowerCase()
    return (stage === 'All studies' || record.stage === stage) && haystack.includes(query.toLowerCase())
  }), [records, query, stage])
  useEffect(() => { setVisibleCount(30) }, [query, stage])
  const visible = filtered.slice(0, visibleCount)
  const selected = selectedId ? records.find(record => record.id === selectedId) : undefined
  if (selected) return <EvidenceDetail record={selected} onBack={() => navigate('evidence-atlas')} />
  return <><PageHero trail="Receipts / atlas" title="Evidence atlas" deck="Search the sanitized request, visible output, deterministic grade, and metadata behind the assessment. Every record is a bounded receipt, not a private raw dump." /><main className="atlas" id="main-content"><div className="atlas-controls"><label className="search-field"><span className="sr-only">Search evidence</span><Icon name="search" /><input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Search run, model, board, or study" /></label><label className="select-field"><span className="sr-only">Filter study</span><select value={stage} onChange={event => setStage(event.target.value)}>{stages.map(item => <option key={item}>{item}</option>)}</select></label></div><p className="atlas-count">Showing <strong>{visible.length}</strong> of {filtered.length} matching records · {records.length} total</p><div className="evidence-list">{visible.map(record => <button className="evidence-row" key={record.id} onClick={() => navigate(`evidence-atlas/${record.id}`)}><span className={`status-dot status-${record.status || 'review'}`} aria-hidden="true" /><span className="evidence-main"><span className="evidence-title">{record.title}<Icon name="arrow" /></span><span>{record.summary}</span></span><span className="evidence-meta"><strong>{record.stage}</strong><span>{record.kind} · {displayStatus(record.status)}</span></span></button>)}</div>{visible.length < filtered.length && <div className="atlas-pagination"><button className="button button-outline" type="button" onClick={() => setVisibleCount(count => count + 30)}>Load 30 more</button><button className="back-link" type="button" onClick={() => setVisibleCount(filtered.length)}>Show all {filtered.length}</button></div>}{!filtered.length && <div className="empty-state"><strong>No records match.</strong><span>Try a shorter query or return to all studies.</span></div>}<Callout tone="evidence" title="Sanitization boundary">The atlas intentionally omits private answer keys, credentials, encrypted reasoning payloads, and unrelated repository files. A missing raw field is a safety decision, not a broken receipt.</Callout></main></>
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
  return <><PageHero trail={`Receipts / atlas / ${record.id}`} title={record.title} deck={record.summary}><span className={`detail-status status-pill status-${record.status || 'review'}`}>{displayStatus(record.status)}</span></PageHero><main className="evidence-detail" id="main-content"><button className="back-link" onClick={onBack}>← Back to atlas</button><div className="detail-toolbar"><span><strong>{record.stage}</strong> · {record.kind}</span><div><button className="button button-small" onClick={copy} disabled={loading}><Icon name="copy" />{loading ? 'Loading…' : copied ? 'Copied' : 'Copy JSON'}</button><button className="button button-small button-outline" onClick={download} disabled={loading}><Icon name="download" />Download</button></div></div>{inlineAssets.length > 0 && <section className="input-assets" aria-labelledby="input-assets-heading"><div className="input-assets-heading"><span className="section-label">Exact input attachment</span><h2 id="input-assets-heading">Model-visible board image</h2><p>The base64 transport field was decoded into a content-addressed local asset; the request JSON retains its hash, media type, and byte count.</p></div><div className="input-assets-grid">{inlineAssets.map(asset => <figure key={asset.asset_path}><img src={assetUrl(`evidence/${asset.asset_path}`)} alt={`Board image attached to ${record.run || record.id}`} /><figcaption><code>{asset.sha256 ? `sha256:${asset.sha256}` : asset.asset_path}</code><span>{asset.media_type || 'image'}{asset.bytes ? ` · ${asset.bytes.toLocaleString()} bytes` : ''}</span></figcaption></figure>)}</div></section>}<div className="json-panels"><JsonPanel title="Sanitized request" value={loaded.request} /><JsonPanel title="Visible output" value={loaded.output} /><JsonPanel title="Deterministic grade" value={loaded.grade} /><JsonPanel title="Metadata" value={loaded.metadata} /></div><Callout tone="evidence" title="Record handling">This detail is loaded from the public evidence manifest and its linked sanitized files. Exact prompt text and visible provider output are preserved; private credentials and encrypted reasoning are intentionally excluded.</Callout></main></>
}

function JsonPanel({ title, value }: { title: string; value: unknown }) {
  return <section className="json-panel"><div className="json-panel-header"><h2>{title}</h2><span>sanitized</span></div><pre>{jsonText(value)}</pre></section>
}

function MethodsSources() {
  return <><PageHero trail="Receipts / methods" title="Methods & sources" deck="Definitions keep the narrative honest. This page names the measurement boundaries, the limits, and the primary public references used for interpretation." /><div className="reading-layout"><LocalToc items={[{ id: 'definitions', label: 'Definitions' }, { id: 'limits', label: 'Limits' }, { id: 'models', label: 'Model listings' }, { id: 'sources', label: 'Rules & Jev docs' }]} /><main className="reading-column" id="main-content"><Section id="definitions" title="Measurement boundaries"><div className="definition-list"><div><strong>Correct solution</strong><p>An in-range queen in every row, unique columns, exactly one hit per region, and no touching pair.</p></div><div><strong>Strict pass</strong><p>The original output also satisfies the exact JSON-only schema. Post-hoc extraction is a separate diagnostic.</p></div><div><strong>Elapsed API time</strong><p>Monotonic client time through full response receipt; not isolated model compute or preparation time.</p></div><div><strong>Confirmed USD</strong><p>Returned <code>usage.cost</code>. Missing charges are not zero; allowance is reservation, not billed amount.</p></div></div></Section><Section id="limits" title="Limits that materially affect interpretation"><Callout tone="caution" title="The denominator is intentionally visible.">Three original scored boards and six later boards do not establish broad distribution coverage. Clean images, region letters, singleton regions, preview model versions, unequal provider conditions, and generator-family reuse all constrain the inference.</Callout><p>The same board appears in several conditions and candidate lists overlap. Analyze at board level; do not manufacture tiny p-values by multiplying correlated decisions.</p></Section><Section id="models" title="OpenRouter model listings"><ul className="source-list"><li><a href="https://openrouter.ai/openai/gpt-5.6-sol" target="_blank" rel="noreferrer">GPT-5.6 Sol <Icon name="external" /></a><span>OpenAI model listing used for the one-shot pilot.</span></li><li><a href="https://openrouter.ai/anthropic/claude-opus-4.8" target="_blank" rel="noreferrer">Claude Opus 4.8 <Icon name="external" /></a><span>Anthropic model listing used for the one-shot pilot.</span></li><li><a href="https://openrouter.ai/x-ai/grok-4.6" target="_blank" rel="noreferrer">Grok 4.6 <Icon name="external" /></a><span>Model listing; saved runs used the approved Amazon Bedrock US West 2 route.</span></li><li><a href="https://openrouter.ai/google/gemini-3.1-pro-preview" target="_blank" rel="noreferrer">Gemini 3.1 Pro Preview <Icon name="external" /></a><span>Google preview-model listing used for the one-shot pilot.</span></li><li><a href="https://openrouter.ai/typesafe/jev-1.13" target="_blank" rel="noreferrer">Jev 1.13 <Icon name="external" /></a><span>Versioned listing resolved by the experiment.</span></li><li><a href="https://openrouter.ai/~typesafe/jev-latest" target="_blank" rel="noreferrer">Jev Latest alias <Icon name="external" /></a><span>Moving alias supplied for the deep dive; do not equate it with a frozen build.</span></li></ul></Section><Section id="sources" title="Queens rules, play link, and Jev documentation"><ul className="source-list"><li><a href="https://www.linkedin.com/help/linkedin/answer/a6269510" target="_blank" rel="noreferrer">LinkedIn Queens help <Icon name="external" /></a><span>Authoritative regional one-queen and no-touch rule reference.</span></li><li><a href="https://www.linkedin.com/games/queens/" target="_blank" rel="noreferrer">Play LinkedIn Queens <Icon name="external" /></a><span>Live daily game; not a frozen copy of these benchmark boards.</span></li><li><a href="https://docs.typesafe.ai/models" target="_blank" rel="noreferrer">TypeSafe models and aliases <Icon name="external" /></a><span>Text modality, version names, and context notes.</span></li><li><a href="https://docs.typesafe.ai/concepts/system-one" target="_blank" rel="noreferrer">System One <Icon name="external" /></a><span>Typed decisions over structured state.</span></li><li><a href="https://docs.typesafe.ai/primitives/choice" target="_blank" rel="noreferrer">Choice primitive <Icon name="external" /></a><span>Fixed candidate selection and rejection-option design.</span></li><li><a href="https://docs.typesafe.ai/primitives/noul" target="_blank" rel="noreferrer">Noul primitive <Icon name="external" /></a><span>Probability of an affirmative binary judgment.</span></li><li><a href="https://docs.typesafe.ai/primitives/score" target="_blank" rel="noreferrer">Score primitive <Icon name="external" /></a><span>Ordered descriptive levels and expected index.</span></li><li><a href="https://docs.typesafe.ai/model-jaggedness/jev-1.13" target="_blank" rel="noreferrer">Jev 1.13 known limitations <Icon name="external" /></a><span>Vendor cautions about counting, indirection, precision, and cross-primitive consistency.</span></li></ul></Section></main></div></>
}

function NotFound() {
  const [, navigate] = useHashPath()
  return <div className="not-found"><span className="section-label">404 / unfiled page</span><h1>This page is not in the book.</h1><p>Use the chapter rail to return to a documented part of the assessment.</p><button className="button button-mint" onClick={() => navigate('executive-summary')}>Return to summary <Icon name="arrow" /></button></div>
}

function Sidebar({ active, open, onClose }: { active: string; open: boolean; onClose: () => void }) {
  const [, navigate] = useHashPath()
  const groups = Array.from(new Set(routes.map(route => route.section)))
  return <><div className={`sidebar-scrim ${open ? 'is-open' : ''}`} onClick={onClose} aria-hidden="true" /><aside className={`book-sidebar ${open ? 'is-open' : ''}`} aria-label="Assessment chapters" role={open ? 'dialog' : undefined} aria-modal={open || undefined}><div className="bookmark"><div className="bookmark-icon"><Icon name="book" size={21} /></div><div><strong>Queens</strong><span>assessment book</span></div><button className="sidebar-close" onClick={onClose} aria-label="Close navigation"><Icon name="close" /></button></div><div className="edition-chip"><span>EXPANDED EDITION</span><strong>19 SEP 2026</strong></div><nav className="chapter-nav">{groups.map(group => <div className="chapter-group" key={group}><span className="chapter-label">{group}</span>{routes.filter(route => route.section === group).map(route => <button key={route.path} className={active === route.path ? 'active' : ''} onClick={() => { navigate(route.path); onClose() }} aria-current={active === route.path ? 'page' : undefined}><span>{route.title}</span>{active === route.path && <span className="nav-dot" aria-hidden="true" />}</button>)}</div>)}</nav><div className="sidebar-footer"><span>REPORT SHA</span><code>1e103a40…e452d67</code><span>5 figures · 13 retained sections</span></div></aside></>
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
                : active === 'evidence-atlas' ? <EvidenceExplorer selectedId={selectedId} />
                  : active === 'methods-sources' ? <MethodsSources /> : <NotFound />
  return <div className="app-shell"><Sidebar active={active} open={drawerOpen} onClose={() => setDrawerOpen(false)} /><div className="page-frame" {...(drawerOpen ? { inert: '' } : {})}><header className="mobile-topbar"><button ref={menuButtonRef} className="icon-button" onClick={() => setDrawerOpen(true)} aria-label="Open navigation"><Icon name="menu" /></button><button className="mobile-wordmark" onClick={() => navigate('executive-summary')}>Queens <span>/ assessment</span></button><ThemeToggle theme={theme} setTheme={setTheme} /></header><div className="page-tools"><span>LOCAL / READ-ONLY</span><ThemeToggle theme={theme} setTheme={setTheme} /></div>{page}<footer className="site-footer"><span>Queens assessment · expanded illustrated edition</span><span>Source: saved local experiment records · <a href="#/methods-sources">methods and sources</a></span></footer></div></div>
}

function ThemeToggle({ theme, setTheme }: { theme: 'light' | 'dark'; setTheme: (theme: 'light' | 'dark') => void }) {
  return <button className="theme-toggle" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}><Icon name={theme === 'light' ? 'moon' : 'sun'} /><span>{theme === 'light' ? 'Dark' : 'Light'}</span></button>
}

export default App
