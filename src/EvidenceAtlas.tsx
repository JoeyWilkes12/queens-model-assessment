import { Suspense, useEffect, useMemo, useState } from 'react'
import { BoardReplay } from './BoardReplay'
import { FailureComparison } from './FailureComparison'
import { ReceiptCostStrip, receiptCostText, useReceiptCosts } from './ReceiptCost'
import { assetUrl, useHashPath, Icon, PageHero, Callout } from './bookUi'
import { ATLAS_HERO } from './routeHeroes'
import { ReceiptChainNavigation } from './chapters'
import { deriveFailureComparison } from './failureComparisonData'
import { deriveReceiptBoard } from './receiptBoardData'

export type AssessmentOutcome = 'success' | 'model_failure' | 'request_failure' | 'not_run' | 'ungraded'

export type ErrorContext = {
  category: string
  title: string
  interpretation: string
  followUp: string
  sourceUrl?: string
  sourceLabel?: string
}

export type EvidenceRecord = {
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

export type InlineAsset = {
  asset_path: string
  media_type?: string
  sha256?: string
  bytes?: number
}

export type ManifestRecord = {
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

export function collectInlineAssets(value: unknown, found = new Map<string, InlineAsset>()): InlineAsset[] {
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

export function displayStatus(status?: string) {
  return (status || 'review').replace(/_/g, ' ')
}

export function displayRequestStatus(status?: string) {
  if (status === 'success') return 'request success'
  if (status === 'error') return 'request error'
  return displayStatus(status)
}

export function outcomeLabel(outcome?: AssessmentOutcome) {
  if (outcome === 'success') return 'Success'
  if (outcome === 'model_failure') return 'Model assessment failure'
  if (outcome === 'request_failure') return 'Request / transport failure'
  if (outcome === 'not_run') return 'Not run'
  return 'Ungraded'
}

export const fallbackEvidence: EvidenceRecord[] = [
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

export function normalizeManifestRecord(record: ManifestRecord): EvidenceRecord {
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

export function jsonText(value: unknown) {
  return JSON.stringify(value ?? {}, null, 2)
}

export function OutcomeTag({ outcome }: { outcome?: AssessmentOutcome }) {
  if (!outcome || outcome === 'ungraded') return null
  return <span className={`outcome-tag outcome-${outcome}`}>{outcomeLabel(outcome)}</span>
}

export function ErrorContextCallout({ record }: { record: EvidenceRecord }) {
  if (!record.errorContext) return null
  const context = record.errorContext
  return <aside className="error-context" aria-labelledby="error-context-heading"><div className="error-context-heading"><span>{context.category}</span><h2 id="error-context-heading">{context.title}</h2></div><div className="error-context-body"><div><strong>How to interpret it</strong><p>{context.interpretation}</p></div><div><strong>What happened next</strong><p>{context.followUp}</p></div>{record.excluded && <div><strong>Atlas visibility</strong><p>Excluded from default browsing, but retained in search, direct links, and the public evidence bundle.</p></div>}{context.sourceUrl && <a href={context.sourceUrl} target="_blank" rel="noreferrer">{context.sourceLabel || 'Error reference'} <Icon name="external" /></a>}</div></aside>
}

export function EvidenceExplorer({ selectedId }: { selectedId?: string }) {
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
  return <><PageHero {...ATLAS_HERO} /><main className="atlas" id="main-content"><div className="atlas-controls"><label className="search-field atlas-control-search"><span className="sr-only">Search evidence</span><Icon name="search" /><input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Search run, model author, version, board, or excluded" /></label><label className="select-field atlas-control-study"><span className="sr-only">Filter study</span><select value={stage} onChange={event => setStage(event.target.value)}>{stages.map(item => <option key={item}>{item}</option>)}</select></label><label className="select-field atlas-control-outcome"><span className="sr-only">Filter assessment outcome</span><select value={outcome} onChange={event => setOutcome(event.target.value)}><option value="all">All outcomes</option><option value="non_success">Non-success evidence</option><option value="success">Success ({outcomeCounts.success})</option><option value="model_failure">Model failures ({outcomeCounts.model_failure})</option><option value="request_failure">Request failures ({outcomeCounts.request_failure})</option><option value="not_run">Not run ({outcomeCounts.not_run})</option><option value="ungraded">Ungraded / ledgers ({outcomeCounts.ungraded})</option></select></label><label className="select-field atlas-control-provider"><span className="sr-only">Filter model provider or author</span><select value={provider} onChange={event => setProvider(event.target.value)}><option value="all">All model authors</option>{providers.map(item => <option value={item} key={item}>{item} ({providerCounts[item]})</option>)}</select></label><label className="select-field atlas-control-model"><span className="sr-only">Filter exact model version</span><select value={modelVersion} onChange={event => setModelVersion(event.target.value)}><option value="all">All model versions</option>{modelVersions.map(item => <option value={item} key={item}>{item} ({modelVersionCounts[item]})</option>)}</select></label><label className="excluded-field atlas-control-excluded"><input type="checkbox" checked={showExcluded} onChange={event => setShowExcluded(event.target.checked)} /><span>Show excluded <strong>{excludedCount}</strong></span></label></div><p className="atlas-count" aria-live="polite">Showing <strong>{visible.length}</strong> of {filtered.length} matching records · {records.length - excludedCount} included by default · {excludedCount} excluded</p><div className="evidence-list">{visible.map(record => <button className={`evidence-row${record.excluded ? ' evidence-row--excluded' : ''}`} key={record.id} onClick={() => navigate(`evidence-atlas/${record.id}`)}><span className={`status-dot outcome-dot-${record.assessmentOutcome || 'ungraded'}`} aria-hidden="true" /><span className="evidence-main"><span className="evidence-title">{record.title}<OutcomeTag outcome={record.assessmentOutcome} />{record.excluded && <span className="evidence-flag">Excluded</span>}<Icon name="arrow" /></span><span>{record.summary}</span></span><span className="evidence-meta"><strong>{record.stage}</strong><span>{record.kind} · {displayRequestStatus(record.status)}</span>{receiptCostText(costOf(record.id)) && <span className="evidence-cost">Cost {receiptCostText(costOf(record.id))}</span>}</span></button>)}</div>{visible.length < filtered.length && <div className="atlas-pagination"><button className="button button-outline" type="button" onClick={() => setVisibleCount(count => count + 30)}>Load 30 more</button><button className="back-link" type="button" onClick={() => setVisibleCount(filtered.length)}>Show all {filtered.length}</button></div>}{!filtered.length && <div className="empty-state"><strong>No records match.</strong><span>Try a shorter query, broaden the model author or version, or show excluded evidence.</span></div>}<Callout tone="evidence" title="How outcome tags work">Success and model assessment failure require a completed request plus a saved deterministic grade. Request and transport failures produced no model answer. Excluded records remain searchable and directly addressable, but do not appear in the default browse view.</Callout></main></>
}

export function EvidenceDetail({ record, onBack }: { record: EvidenceRecord; onBack: () => void }) {
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
      <Suspense fallback={null}><ReceiptChainNavigation receiptId={record.id} /></Suspense>
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

export function JsonPanel({ title, value }: { title: string; value: unknown }) {
  return <section className="json-panel"><div className="json-panel-header"><h2>{title}</h2><span>sanitized</span></div><pre>{jsonText(value)}</pre></section>
}
