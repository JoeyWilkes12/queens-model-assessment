import { useEffect, useRef, useState, type ComponentType, type ReactNode } from 'react'
import { BoardReplay } from './BoardReplay'
import { deriveTrajectoryFrames, type RecordedTrajectory, type RecordedTrajectoryStep } from './trajectoryBoardData'
import { SubQPanel } from './SubQPanel'

type BookUi = {
  PageHero: ComponentType<{ title: string; deck: string; trail: string; action?: { label: string; path: string } }>
  LocalToc: ComponentType<{ items: { id: string; label: string }[] }>
  Section: ComponentType<{ id?: string; title: string; children: ReactNode }>
  Callout: ComponentType<{ tone?: 'note' | 'evidence' | 'caution' | 'stop'; title: string; children: ReactNode }>
  DataTable: ComponentType<{ caption: string; headers: string[]; rows: (string | ReactNode)[][] }>
}

type SubQFamily = {
  family: string
  attempts: number
  responses_200: number
  graded_primary: number
  primary_correct: number
  elapsed_seconds: number
  input_tokens: number
  compatibility_skipped?: number
}

type SubQRecord = {
  call_id: string
  source_id: string
  family: string
  repeat: number
  board?: string | null
  size?: number | null
  http_status?: number | null
  elapsed_seconds?: number | null
  returned_model?: string | null
  grade?: { schema_valid?: boolean; primary_correct?: boolean | null; outcome?: string }
}

type SubQSummary = {
  study: string
  model: string
  updated_utc: string
  requests: number
  planned_requests?: number
  unique_source_requests?: number
  remaining_requests?: number
  unattempted_requests?: number
  outcomes: Record<string, number>
  families: SubQFamily[]
  budget: Record<string, unknown>
  campaign_budget?: Record<string, unknown>
  records: SubQRecord[]
}

type SavedState<T> = { status: 'loading' } | { status: 'error' } | { status: 'ready'; data: T }

type TrajectoryStep = { step: number; region?: string; cell?: number[]; candidate_count?: number; region_call?: string | null; cell_call?: string | null; region_forced?: boolean; cell_forced?: boolean; local_violations?: string[]; on_unique_solution?: boolean }
type AdaptiveTrajectory = { trajectory_id: string; board_id: string; size: number; mode: string; replicate: number; steps: TrajectoryStep[]; success: boolean; stop_reason: string; correct_queens_before_failure: number; http_calls: number; forced_decisions: number; api_elapsed_seconds: number }
type TrajectorySummary = {
  study: string; model: string; updated_utc?: string; planned_trajectories: number; attempted_trajectories: number; remaining_trajectories: number; solved: number; boards_solved: number; model_calls: number; forced_decisions: number
  stop_reasons: Record<string, number>
  families: { board_id: string; mode: string; size: number; attempts: number; solved: number; stop_reasons: Record<string, number>; model_calls: number; forced_decisions: number }[]
  trajectories: AdaptiveTrajectory[]
  caveats?: string[]
}

type HistoricalTrajectoryStudy = {
  audit: { trajectory_attempts: number; successful_trajectories: number; per_board: { board_id: string; mode: string; attempts: number; solved: number }[] }
  trajectories: { trajectory_id: string; board_id: string; mode: string; success: boolean }[]
}

type TrajectoryProtocol = {
  study: string
  boards: { id: string; size: number; regions: number[][] }[]
}

type SplitSummary = {
  study: string; model?: string; requests: number; planned_requests: number; planned_logical_tasks: number; completed_logical_tasks: number; remaining_logical_tasks: number
  families: { family: string; logical_tasks: number; complete_logical_tasks: number; primary_correct: number }[]
  logical_tasks: { logical_id: string; parent_call_id: string; source_id: string; board?: string; size?: number; parts: string[]; completed_parts: number; total_parts: number; complete: boolean; grade?: { primary_correct?: boolean | null; outcome?: string } }[]
  records: { call_id: string; http_status?: number | null }[]
  caveats?: string[]
}

const assetUrl = (path: string) => `${import.meta.env.BASE_URL}${path}`
const sourceLinks = {
  launch: 'https://subq.ai/introducing-subq-snap',
  decisions: 'https://docs.subq.ai/endpoints/decisions-api/',
  retention: 'https://docs.subq.ai/using-the-api/data-retention/',
  openai: 'https://developers.openai.com/api/docs/guides/decisions',
  openaiReference: 'https://developers.openai.com/api/reference/resources/decisions/methods/create',
}

function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function count(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0
}

function isSummary(value: unknown): value is SubQSummary {
  if (!isObject(value) || typeof value.study !== 'string' || typeof value.model !== 'string'
    || typeof value.updated_utc !== 'string' || !count(value.requests)
    || !isObject(value.outcomes) || !Object.values(value.outcomes).every(count)
    || !isObject(value.budget) || !Array.isArray(value.families) || !Array.isArray(value.records)) return false
  return value.families.every(family => isObject(family) && typeof family.family === 'string'
    && ['attempts', 'responses_200', 'graded_primary', 'primary_correct'].every(key => count(family[key])))
    && value.records.every(record => isObject(record) && typeof record.call_id === 'string'
      && typeof record.source_id === 'string' && typeof record.family === 'string')
}

function isTrajectorySummary(value: unknown): value is TrajectorySummary {
  if (!isObject(value) || typeof value.study !== 'string' || typeof value.model !== 'string'
    || !['planned_trajectories', 'attempted_trajectories', 'remaining_trajectories', 'solved', 'boards_solved', 'model_calls', 'forced_decisions'].every(key => count(value[key]))
    || !Array.isArray(value.families) || !Array.isArray(value.trajectories) || !isObject(value.stop_reasons)) return false
  return value.families.every(family => isObject(family) && typeof family.board_id === 'string' && typeof family.mode === 'string'
    && count(family.attempts) && count(family.solved) && isObject(family.stop_reasons))
    && value.trajectories.every(attempt => isObject(attempt) && typeof attempt.trajectory_id === 'string'
      && typeof attempt.board_id === 'string' && typeof attempt.stop_reason === 'string' && Array.isArray(attempt.steps))
}

function isSplitSummary(value: unknown): value is SplitSummary {
  return isObject(value) && typeof value.study === 'string'
    && ['requests', 'planned_requests', 'planned_logical_tasks', 'completed_logical_tasks', 'remaining_logical_tasks'].every(key => count(value[key]))
    && Array.isArray(value.families) && value.families.every(family => isObject(family) && typeof family.family === 'string'
      && ['logical_tasks', 'complete_logical_tasks', 'primary_correct'].every(key => count(family[key])))
    && Array.isArray(value.logical_tasks) && value.logical_tasks.every(task => isObject(task) && typeof task.source_id === 'string'
      && typeof task.parent_call_id === 'string' && Array.isArray(task.parts) && task.parts.every(part => typeof part === 'string'))
    && Array.isArray(value.records)
}

function isHistoricalTrajectoryStudy(value: unknown): value is HistoricalTrajectoryStudy {
  return isObject(value) && isObject(value.audit) && count(value.audit.trajectory_attempts)
    && count(value.audit.successful_trajectories) && Array.isArray(value.audit.per_board)
    && value.audit.per_board.every(family => isObject(family) && typeof family.board_id === 'string'
      && typeof family.mode === 'string' && count(family.attempts) && count(family.solved))
    && Array.isArray(value.trajectories) && value.trajectories.every(attempt => isObject(attempt)
      && typeof attempt.trajectory_id === 'string' && typeof attempt.board_id === 'string' && typeof attempt.success === 'boolean')
}

function isTrajectoryProtocol(value: unknown): value is TrajectoryProtocol {
  if (!isObject(value) || value.study !== '2026-10-13-subq-trajectories' || !Array.isArray(value.boards)) return false
  const ids = new Set<string>()
  return value.boards.every(board => {
    if (!isObject(board) || typeof board.id !== 'string' || ids.has(board.id)
      || !count(board.size) || board.size < 1 || board.size > 26
      || !Array.isArray(board.regions) || board.regions.length !== board.size) return false
    const size = board.size
    const valid = board.regions.every(row => Array.isArray(row) && row.length === size
      && row.every(region => count(region) && region < size))
    if (!valid || new Set(board.regions.flat()).size !== size) return false
    ids.add(board.id)
    return true
  })
}

function hasRecordedPlaybackSteps(attempt: AdaptiveTrajectory): attempt is AdaptiveTrajectory & RecordedTrajectory {
  return Number.isInteger(attempt.size) && attempt.size > 0 && typeof attempt.success === 'boolean'
    && attempt.steps.every((step): step is TrajectoryStep & RecordedTrajectoryStep =>
      count(step.step) && step.step > 0 && typeof step.region === 'string' && step.region.length > 0
      && count(step.candidate_count))
}

function useSavedSummary<T>(filename: string, validate: (value: unknown) => value is T) {
  const [state, setState] = useState<SavedState<T>>({ status: 'loading' })
  const [revision, setRevision] = useState(0)
  useEffect(() => {
    const controller = new AbortController()
    setState({ status: 'loading' })
    fetch(assetUrl(`evidence/${filename}`), { signal: controller.signal })
      .then(response => {
        if (!response.ok) throw new Error('summary unavailable')
        return response.json() as Promise<unknown>
      })
      .then(payload => {
        if (!validate(payload)) throw new Error('summary schema mismatch')
        if (!controller.signal.aborted) setState({ status: 'ready', data: payload })
      })
      .catch(() => { if (!controller.signal.aborted) setState({ status: 'error' }) })
    return () => controller.abort()
  }, [revision, filename, validate])
  return { state, retry: () => setRevision(value => value + 1) }
}

function useSubQSummary() {
  return useSavedSummary('subq-summary.json', isSummary)
}

function SummaryUnavailable({ state, retry, label = 'SubQ replay summary' }: { state: { status: 'loading' | 'error' | 'ready' }; retry: () => void; label?: string }) {
  if (state.status === 'loading') return <p role="status">Loading the saved {label}…</p>
  if (state.status === 'error') return <div role="status"><p>The {label} could not be loaded. No scores are substituted. Reload the saved evidence to try again.</p><button className="button button-outline button-small" onClick={retry}>Reload saved evidence</button></div>
  return null
}

function familyLabel(value: string) {
  return value.replace(/[_-]+/g, ' ')
}

function outcomeLabel(record: SubQRecord) {
  if (record.grade?.outcome) return familyLabel(record.grade.outcome)
  if (record.http_status !== 200) return 'Request failure'
  if (record.grade?.schema_valid === false) return 'Schema failure'
  if (record.grade?.primary_correct === true) return 'Scoped answer correct'
  if (record.grade?.primary_correct === false) return 'Scoped answer incorrect'
  return 'Ungraded'
}

function receiptPath(summary: SubQSummary, record: SubQRecord) {
  return `#/evidence-atlas/${summary.study}:${record.call_id}`
}

function SummaryOverview({ data }: { data: SubQSummary }) {
  const responses = data.records.filter(record => record.http_status === 200).length
  return <><p className="lead"><strong>{data.requests} saved API attempts</strong> produced <strong>{responses} HTTP 200 responses</strong>. These are requests across different tasks, not a count of independently solved puzzles.</p><p>Requested model: <code>{data.model}</code>. Snapshot updated: <time dateTime={data.updated_utc}>{data.updated_utc}</time>. Full condition results and unsuccessful requests remain attached below.</p></>
}

const mixedCohorts = [
  { family: 'mixed_complete_annotated', title: 'Coordinates with region labels' },
  { family: 'mixed_complete_boards', title: 'Complete candidate board descriptions' },
  { family: 'mixed_refine_annotated_order', title: 'Reordered annotated descriptions' },
  { family: 'mixed_9_vectors_k12', title: '9×9 column vectors · 12 options' },
]

function MixedCohortResults({ data, ui }: { data: SubQSummary; ui: BookUi }) {
  const { DataTable } = ui
  const cohorts = mixedCohorts.flatMap(cohort => {
    const result = data.families.find(family => family.family === cohort.family)
    return result ? [{ ...cohort, result }] : []
  })
  if (!cohorts.length) return null
  return <><DataTable caption="Priority conditions where historical Jev results were mixed" headers={['Condition', 'Historical Jev', 'SubQ primary correct', 'Historical source receipts']} rows={cohorts.map(cohort => [
    cohort.title,
    '1 / 3 source variants',
    `${cohort.result.primary_correct} / ${cohort.result.graded_primary} graded replays`,
    <>{Array.from(new Set(data.records.filter(record => record.family === cohort.family).map(record => record.source_id))).map((id, index) => <span key={id}>{index > 0 ? ' · ' : ''}<a href={`#/evidence-atlas/${id}`}>Variant {index + 1}</a></span>)}</>,
  ])} /><p className="table-note">Each family contains three historical request variants. SubQ repeats each exact variant three times. Candidate composition or order can differ between variants; nine correlated replay requests are not nine independent boards. Jev's historical 1/3 and SubQ's replay denominator therefore describe different repetition schedules.</p></>
}

function trajectoryOverview(data: TrajectorySummary) {
  return <p className="lead">Fresh empty-board construction completed <strong>{data.solved} / {data.attempted_trajectories} attempted trajectories</strong> on <strong>{data.boards_solved} of nine boards</strong>. The schedule contains {data.planned_trajectories} trajectories; {data.remaining_trajectories} remain unattempted in this snapshot.</p>
}

function stopReasons(reasons: Record<string, number>) {
  return Object.entries(reasons).map(([reason, total]) => `${familyLabel(reason)}: ${total}`).join('; ') || 'None recorded'
}

function SubQTrajectoryPlayback({ attempt, protocol, selectedId }: {
  attempt: AdaptiveTrajectory
  protocol: ReturnType<typeof useSavedSummary<TrajectoryProtocol>>
  selectedId?: string
}) {
  const root = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (selectedId !== attempt.trajectory_id || protocol.state.status === 'loading') return
    const frame = window.requestAnimationFrame(() => {
      root.current?.scrollIntoView({ block: 'start' })
      root.current?.focus({ preventScroll: true })
    })
    return () => window.cancelAnimationFrame(frame)
  }, [selectedId, attempt.trajectory_id, protocol.state.status])

  const board = protocol.state.status === 'ready'
    ? protocol.state.data.boards.find(item => item.id === attempt.board_id && item.size === attempt.size)
    : undefined
  const regions = board?.regions.map(row => row.map(region => String.fromCharCode(65 + region))) ?? []
  let frames: ReturnType<typeof deriveTrajectoryFrames> = []
  let invalidTrace = false
  if (board) {
    try {
      if (!hasRecordedPlaybackSteps(attempt)) throw new Error('Incomplete recorded steps')
      frames = deriveTrajectoryFrames(attempt, regions, '2026-10-13-subq-trajectories')
    } catch {
      invalidTrace = true
    }
  }
  return <div id="subq-trajectory-playback" ref={root} tabIndex={-1} role="region" aria-label={`Recorded SubQ playback for ${attempt.trajectory_id}`}>
    <SummaryUnavailable state={protocol.state} retry={protocol.retry} label="SubQ saved board partitions" />
    {protocol.state.status === 'ready' && (!board
      ? <p role="status">This attempt has no saved board partition matching its board ID and size. Playback is unavailable; no missing board is inferred. The recorded steps remain below.</p>
      : invalidTrace
        ? <p role="status">The saved board and step data do not agree or are incomplete. Playback is unavailable; no missing placement is inferred. Inspect the recorded steps and receipts below.</p>
        : <BoardReplay key={attempt.trajectory_id} regions={regions} frames={frames} title="Recorded SubQ attempt, one decision at a time" description="Play, pause, step or scrub through the saved color choices, cell proposals and evaluator outcomes. Receipt links belong to this SubQ attempt. Forced decisions have no API receipt. This is an interactive replay of recorded states, not a video of internal model reasoning." />)}
  </div>
}

function TrajectoryResults({ ui, selectedId }: { ui: BookUi; selectedId?: string }) {
  const { state, retry } = useSavedSummary('subq-trajectories-summary.json', isTrajectorySummary)
  const historical = useSavedSummary('trajectory-study.json', isHistoricalTrajectoryStudy)
  const protocol = useSavedSummary('subq-trajectories-protocol.json', isTrajectoryProtocol)
  const { DataTable, Callout } = ui
  const [selection, setSelection] = useState(selectedId || '')
  useEffect(() => { if (selectedId) setSelection(selectedId) }, [selectedId])
  if (state.status !== 'ready') return <SummaryUnavailable state={state} retry={retry} label="SubQ adaptive trajectory summary" />
  const data = state.data
  const selected = selection ? data.trajectories.find(attempt => attempt.trajectory_id === selection) : data.trajectories[0]
  const jev = historical.state.status === 'ready' ? historical.state.data : undefined
  const jevBoardsSolved = jev ? new Set(jev.trajectories.filter(attempt => attempt.success).map(attempt => attempt.board_id)).size : undefined
  const callLink = (id?: string | null, forced?: boolean) => id ? <a href={`#/evidence-atlas/${data.study}:${id}`}>Receipt</a> : forced === true ? 'Forced by harness' : 'No recorded API call'
  return <>
    {trajectoryOverview(data)}
    <p>These are actual fresh attempts, distinct from replaying Jev's frozen intermediate states. Each begins empty, follows SubQ's own color and cell choices, and stops at the first local conflict or globally unextendable prefix. There is no feedback or backtracking.</p>
    <SummaryUnavailable state={historical.state} retry={historical.retry} label="historical Jev trajectory summary" />
    <DataTable caption="Fresh trajectory comparison on the same nine boards" headers={['Study', 'Complete trajectories', 'Boards solved', 'Condition']} rows={[
      [<a href="#/jev-trajectories">Historical Jev</a>, jev ? `${jev.audit.successful_trajectories} / ${jev.audit.trajectory_attempts}` : 'Source not loaded', jevBoardsSolved === undefined ? 'Source not loaded' : `${jevBoardsSolved} / 9`, 'Five raw and five local attempts per board'],
      ['SubQ Snap', `${data.solved} / ${data.attempted_trajectories} attempted`, `${data.boards_solved} / 9`, `${data.remaining_trajectories} of ${data.planned_trajectories} scheduled attempts unattempted`],
    ]} />
    {jev && <p>{jev.audit.successful_trajectories === data.solved && jev.audit.trajectory_attempts === data.attempted_trajectories ? 'Both services completed the same number of attempts. Jev completed one distinct board in both modes; SubQ completed two different boards, only with local filtering. Nine paired boards cannot establish equivalent ability. ' : ''}The board-level comparison below is more informative than a single pooled rate. These nine boards and correlated repetitions do not establish an overall model ranking. <a href={assetUrl('evidence/trajectory-study.json')} download>Inspect the historical Jev source.</a></p>}
    <p>SubQ used {data.model_calls} model calls and {data.forced_decisions} forced decisions. A singleton menu is a harness transition with no inference. The local mode filters immediate conflicts only; the complete solver grades and stops, without supplying options or answers.</p>
    <DataTable caption="Paired adaptive trajectories by board and mode" headers={['Board', 'Mode', 'Jev solved / attempted', 'SubQ solved / attempted', 'SubQ stop reasons', 'SubQ model calls', 'SubQ forced']} rows={data.families.map(family => {
      const baseline = jev?.audit.per_board.find(item => item.board_id === family.board_id && item.mode === family.mode)
      const jevAttempt = jev?.trajectories.find(item => item.board_id === family.board_id && item.mode === family.mode)
      const subqAttempt = data.trajectories.find(item => item.board_id === family.board_id && item.mode === family.mode)
      return [family.board_id, family.mode, baseline && jevAttempt ? <a href={`#/jev-trajectories/${jevAttempt.trajectory_id}`}>{baseline.solved} / {baseline.attempts}</a> : 'Source not loaded', subqAttempt ? <a href={`#/subq-assessment/${subqAttempt.trajectory_id}`}>{family.solved} / {family.attempts}</a> : `${family.solved} / ${family.attempts}`, stopReasons(family.stop_reasons), String(family.model_calls), String(family.forced_decisions)]
    })} />
    <Callout tone="caution" title="Matching protocol does not make repetitions independent.">The boards, rules, option ordering, raw/local menus, and first-failure criteria match the Jev study. Later states follow each model's choices. SubQ runs sequentially in board groups; Jev used concurrent streams and repetition blocks. A solved path and an early stopped failure have different elapsed-time meanings.</Callout>
    <h3>Follow each color decision and cell decision</h3>
    <label className="filter-label" htmlFor="subq-trajectory-select">Recorded SubQ trajectory</label>
    <select id="subq-trajectory-select" className="trajectory-select" value={selected?.trajectory_id || ''} onChange={event => setSelection(event.target.value)}>{!selected && <option value="">Choose a recorded attempt</option>}{data.trajectories.map(attempt => <option key={attempt.trajectory_id} value={attempt.trajectory_id}>{attempt.trajectory_id} · {familyLabel(attempt.stop_reason)}</option>)}</select>
    {selected ? <>
      <p><strong>{familyLabel(selected.stop_reason)}</strong> · {selected.correct_queens_before_failure} correct placements before termination · {selected.http_calls} API requests · {selected.forced_decisions} forced decisions · {selected.api_elapsed_seconds.toFixed(3)} summed API seconds. <a href={`#/subq-assessment/${selected.trajectory_id}`}>Link to this attempt</a></p>
      <SubQTrajectoryPlayback key={selected.trajectory_id} attempt={selected} protocol={protocol} selectedId={selectedId} />
      <DataTable caption={`Recorded steps · ${selected.trajectory_id}`} headers={['Step', 'Region', 'Region decision', 'Cell', 'Cell decision', 'Menu size', 'Evaluator outcome']} rows={selected.steps.map(step => [String(step.step), step.region || 'Not returned', callLink(step.region_call, step.region_forced), step.cell ? `r${step.cell[0]}c${step.cell[1]}` : 'No placement', callLink(step.cell_call, step.cell_forced), step.candidate_count === undefined ? 'Not recorded' : String(step.candidate_count), step.local_violations?.length ? step.local_violations.join(', ') : step.on_unique_solution === true ? 'On unique solution' : step.on_unique_solution === false ? 'Globally unextendable' : 'No recorded evaluator result'])} />
      <p className="table-note">Evaluator outcomes are post-response annotations. They were not feedback supplied to SubQ. Region choices alone have no uniquely correct order.</p>
    </> : <p role="status">{selection ? 'This attempt is not in the saved SubQ evidence. Choose a recorded attempt above; no missing trace will be reconstructed.' : 'No recorded adaptive attempts are present.'}</p>}
    <DataTable caption="Every recorded SubQ adaptive attempt" headers={['Attempt', 'Board', 'Mode', 'Outcome', 'API calls', 'Forced']} rows={data.trajectories.map(attempt => [<a href={`#/subq-assessment/${attempt.trajectory_id}`}>{attempt.trajectory_id}</a>, attempt.board_id, attempt.mode, familyLabel(attempt.stop_reason), String(attempt.http_calls), String(attempt.forced_decisions)])} />
    <p><a href={assetUrl('evidence/subq-trajectories-summary.json')} download>Download all adaptive traces and their separate ledger snapshot</a></p>
  </>
}

function SplitResults({ ui, replay }: { ui: BookUi; replay?: SubQSummary }) {
  const { state, retry } = useSavedSummary('subq-split-summary.json', isSplitSummary)
  const { Callout, DataTable } = ui
  const originalErrors = replay?.records.filter(record => record.http_status === 422) || []
  const originalNotRun = replay?.records.filter(record => record.http_status == null && record.grade?.outcome === 'not_run') || []
  return <>
    <p>The exact replay encountered an observed limit of sixteen questions per request. The affected original tasks contain twenty-five independent questions. A subsequent adapter sends contiguous groups of sixteen and nine, preserving each question and shared state while changing batching.</p>
    {replay && <p>Original integration receipts: <strong>{originalErrors.length} HTTP 422 responses</strong>; <strong>{originalNotRun.length} oversized originals marked not run</strong>. These are interface outcomes, excluded from model-quality scores. {originalErrors.map((record, index) => <span key={record.call_id}>{index ? ' · ' : ''}<a href={receiptPath(replay, record)}>422 receipt {index + 1}</a></span>)}</p>}
    <Callout tone="caution" title="Split batches are an adapted condition.">The provider did not return one twenty-five-question response. A merged receipt is an offline aggregation of two independent request responses. Separate HTTP part calls, completed logical tasks, and primary correctness; do not add these counts to exact-replay accuracy.</Callout>
    <SummaryUnavailable state={state} retry={retry} label="SubQ split-batch summary" />
    {state.status === 'ready' && <>
      <p className="lead"><strong>{state.data.requests} split-part API attempts</strong> completed <strong>{state.data.completed_logical_tasks} / {state.data.planned_logical_tasks} scheduled logical tasks</strong>. {state.data.remaining_logical_tasks} logical tasks remain incomplete.</p>
      <DataTable caption="Adapted split-batch results" headers={['Family', 'Scheduled logical tasks', 'Complete logical tasks', 'Primary correct']} rows={state.data.families.map(family => [familyLabel(family.family), String(family.logical_tasks), String(family.complete_logical_tasks), `${family.primary_correct} / ${family.complete_logical_tasks}`])} />
      <DataTable caption="Split tasks and exact part receipts" headers={['Historical source', 'Original SubQ receipt', 'Parts complete', 'Offline aggregated grade', 'Part receipts']} rows={state.data.logical_tasks.map(task => [
        <a href={`#/evidence-atlas/${task.source_id}`}>{task.source_id}</a>,
        replay ? <a href={`#/evidence-atlas/${replay.study}:${task.parent_call_id}`}>{task.parent_call_id}</a> : task.parent_call_id,
        `${task.completed_parts} / ${task.total_parts}`,
        <>{!task.complete ? 'Incomplete' : task.grade?.primary_correct === true ? 'Scoped answer correct' : task.grade?.primary_correct === false ? 'Scoped answer incorrect' : 'Ungraded'}{task.complete && <> · <a href={assetUrl(`evidence/subq-split/logical/${task.parent_call_id}/aggregation.json`)}>Aggregation receipt</a></>}</>,
        <>{task.parts.map((id, index) => <span key={id}>{index ? ' · ' : ''}<a href={`#/evidence-atlas/${state.data.study}:${id}`}>Part {index + 1}</a></span>)}</>,
      ])} />
      <p><a href={assetUrl('evidence/subq-split-summary.json')} download>Download the adapted split-batch summary and ledger snapshot</a></p>
    </>}
  </>
}

export function SubQExecutiveSummary({ ui }: { ui: BookUi }) {
  const { state, retry } = useSubQSummary()
  const adaptive = useSavedSummary('subq-trajectories-summary.json', isTrajectorySummary)
  const { Callout } = ui
  return <><Callout tone="note" title="October 12: SubQ Snap replays the Jev decision tasks.">
    {state.status === 'ready' ? <SummaryOverview data={state.data} /> : <SummaryUnavailable state={state} retry={retry} />}
    <p>The replay preserves historical text states and uses deterministic grading. Individual candidate or move selections do not establish a new whole-board solve. <a href="#/subq-assessment">Read the SubQ chapter and every receipt.</a></p>
  </Callout><Callout tone="evidence" title="Fresh empty-board construction is measured separately.">
    {adaptive.state.status === 'ready' ? trajectoryOverview(adaptive.state.data) : <SummaryUnavailable state={adaptive.state} retry={adaptive.retry} label="SubQ adaptive trajectory summary" />}
    <p>The original Jev study completed 10 of 90 trajectories on one of nine boards. Compare raw/local modes and forced decisions in <a href="#/subq-assessment">the SubQ chapter</a>. <a href="#/openai-decisions-plan">OpenAI Decisions remains a future test plan.</a></p>
  </Callout></>
}

export function SubQAssessment({ ui, selectedId }: { ui: BookUi; selectedId?: string }) {
  const { state, retry } = useSubQSummary()
  const { PageHero, LocalToc, Section, Callout, DataTable } = ui
  const data = state.status === 'ready' ? state.data : undefined
  const returnedModels = data ? Array.from(new Set(data.records.map(record => record.returned_model).filter(Boolean))) : []
  useEffect(() => {
    if (selectedId !== 'panel') return
    const timer = window.setTimeout(() => document.getElementById('subq-panel')?.scrollIntoView({ block: 'start' }), 400)
    return () => window.clearTimeout(timer)
  }, [selectedId])
  return <>
    <PageHero trail="Decision models / SubQ follow-up" title="Replay the decisions. Then start from empty." deck="The frozen Jev-state replay and fresh SubQ construction are separate experiments. Split batches form a third adapted condition. Each retains its own tasks, denominators, failures, and receipts." action={{ label: 'Inspect the evidence atlas', path: 'evidence-atlas' }} />
    <div className="reading-layout">
      <LocalToc items={[{ id: 'subq-results', label: 'Frozen replay' }, { id: 'subq-adaptive', label: 'Fresh construction' }, { id: 'subq-panel', label: 'New-board panel' }, { id: 'subq-split', label: 'Adapted split batches' }, { id: 'subq-protocol', label: 'Comparison boundaries' }, { id: 'subq-provider', label: 'Model and interface' }, { id: 'subq-ledger', label: 'Cost and containment' }, { id: 'subq-receipts', label: 'Every replay request' }, { id: 'subq-sources', label: 'Sources and next test' }]} />
      <main className="reading-column" id="main-content">
        <Section id="subq-results" title="Read each task's denominator">
          <SummaryUnavailable state={state} retry={retry} />
          {data && <><SummaryOverview data={data} />
            <MixedCohortResults data={data} ui={ui} />
            {count(data.planned_requests) && <p>Frozen schedule: <strong>{data.planned_requests} requests</strong>{count(data.unique_source_requests) ? ` drawn from ${data.unique_source_requests} historical source requests` : ''}. {count(data.unattempted_requests ?? data.remaining_requests) ? `${data.unattempted_requests ?? data.remaining_requests} were not sent upstream in this snapshot, including compatibility skips.` : ''}</p>}
            {data.families.length > 0 ? <DataTable caption="SubQ results by historical task family" headers={['Task family', 'API attempts', 'HTTP 200', 'Compatibility skips', 'Primary graded', 'Primary correct']} rows={data.families.map(family => [familyLabel(family.family), String(family.attempts), String(family.responses_200), count(family.compatibility_skipped) ? String(family.compatibility_skipped) : 'Not reported', String(family.graded_primary), `${family.primary_correct} / ${family.graded_primary}`])} /> : <p>No scored task families are present in this snapshot.</p>}
            <DataTable caption="Saved operational outcomes" headers={['Outcome', 'API attempts']} rows={Object.entries(data.outcomes).map(([outcome, attempts]) => [familyLabel(outcome), String(attempts)])} />
            <p className="table-note">“Primary correct” follows each frozen task's deterministic grade. Candidate recognition, row aggregates, and a single move are different units. A successful HTTP request can contain an incorrect model answer.</p>
          </>}
        </Section>
        <Section id="subq-adaptive" title="Fresh paths from the empty board">
          <TrajectoryResults ui={ui} selectedId={selectedId === 'panel' ? undefined : selectedId} />
        </Section>
        <Section id="subq-panel" title="192 new boards, preregistered">
          <SubQPanel ui={ui} />
        </Section>
        <Section id="subq-split" title="When the batch interface changes the experiment">
          <SplitResults ui={ui} replay={data} />
        </Section>
        <Section id="subq-protocol" title="Preserve the request before comparing the model">
          <p>The replay retains the source Jev rules, board state, instructions, criterion descriptions, option labels and ordering. The provider/model envelope changes. Request and source-semantic hashes in the receipts make that adaptation inspectable.</p>
          <p>Selection begins at historically mixed or representation-sensitive conditions, then expands sequentially. Caller mistakes and wrong or nonexistent endpoints are excluded from the model-quality cohort; genuine service and transport failures of valid requests remain visible.</p>
          <Callout tone="caution" title="A frozen state is not a fresh adaptive trajectory.">Replaying a historical color or cell request tests the decision at that recorded state. It does not show that SubQ independently reached the state, completed the original path, or recovered from an earlier error. Prepared full-board candidate selection is likewise assisted recognition.</Callout>
          <p>Every correctness judgment comes from the local checker. Returned choices are preserved verbatim; confidence and probability argmax do not repair an incorrect choice.</p>
        </Section>
        <Section id="subq-provider" title="What Snap changes, and what remains a hypothesis">
          <DataTable caption="Decision interfaces" headers={['Surface', 'Jev historical study', 'SubQ Snap', 'OpenAI future plan']} rows={[
            ['Answer space', 'Choice, Noul, Score', 'choice, noul, score', 'choice, predicate, score'],
            ['Main comparison input', 'Canonical text state', 'Same recorded text state', 'Planned semantic text replay'],
            ['Image arm', 'Not part of the retained Jev decision study', 'Documented; separate extension', 'Documented; separate extension'],
            ['Generated placement', 'Not an ordinary chat answer', 'Different generation interface', 'Responses interface; separate condition'],
          ]} />
          <p>Snap's documented route is <code>/v1/systemone</code> with <code>subq-snap-preview</code>. It accepts structured state and typed questions, with up to four optional images. The public API's context window is 384K tokens. <a href={sourceLinks.decisions} target="_blank" rel="noreferrer">Read the provider's Decisions contract.</a></p>
          {data && <p>Returned model identifiers in this snapshot: {returnedModels.length ? returnedModels.map(model => <code key={model}>{model} </code>) : 'not captured'}. A preview identifier alone does not prove a frozen underlying build.</p>}
          <p>Subquadratic describes sparse attention and a decision head, and publishes benchmark gains over Jev. Its long-context comparison uses one-shot Snap against chunked Jev. Those vendor reports do not establish stronger Queens search or transfer to these small boards. <a href={sourceLinks.launch} target="_blank" rel="noreferrer">Read the Snap launch article.</a></p>
          <Callout tone="note" title="The answer vocabulary is bounded; correctness still needs proof.">Choice is relative to its menu. Noul estimates an affirmative condition. Score summarizes authored ordered levels. None is a certificate that every row, column, region, and non-touching constraint holds.</Callout>
        </Section>
        <Section id="subq-ledger" title="Keep spend and authority bounded">
          <p>The current experiment has a $5 SubQ allowance. Published pricing is $0.05 per million input tokens with free output; measured usage and unresolved reserves belong in the ledger. A local reservation is a safeguard, not a provider-enforced credit limit.</p>
          {data && <><DataTable caption="Shared SubQ campaign budget ledger" headers={['Recorded field', 'Value']} rows={Object.entries(data.campaign_budget ?? data.budget).map(([key, value]) => [familyLabel(key), typeof value === 'object' ? JSON.stringify(value) : String(value)])} /><p>The ledger's estimated known cost is calculated from reported input tokens. Provider billing has not been confirmed. Unresolved reserves remain separate from measured usage. This shared snapshot includes all three tracks; study snapshots must not be added together.</p><p><a href={assetUrl('evidence/subq-budget.json')} download>Download the complete campaign ledger</a></p></>}
          <p>The programmatic evaluator uses approved Queens inputs and a deterministic checker. Provider responses are data, with no authority to execute code, select new network destinations, read host files, or enlarge the budget. The containment reference describes the worker/broker boundary and its limits.</p>
          <p>SubQ documents indefinite default retention; zero retention requires organization configuration. The per-request <code>store: false</code> control is not documented for Decisions. Only approved public benchmark material belongs in these requests. <a href={sourceLinks.retention} target="_blank" rel="noreferrer">Review the retention policy.</a></p>
          <p><a href={assetUrl('evidence/subq-provider.md')} download>Download the provider and containment reference</a></p>
        </Section>
        <Section id="subq-receipts" title="Inspect every saved attempt">
          {data ? data.records.length > 0 ? <DataTable caption="SubQ request receipts, including unsuccessful attempts" headers={['SubQ receipt', 'Historical task', 'Board', 'HTTP', 'Scoped outcome', 'Exact request']} rows={data.records.map(record => [
            <a href={receiptPath(data, record)}>{record.call_id}</a>,
            `${familyLabel(record.family)} · ${record.source_id}`,
            record.board || 'Not specified',
            record.http_status === null || record.http_status === undefined ? 'No status' : String(record.http_status),
            outcomeLabel(record),
            <a href={assetUrl(`evidence/runs/${data.study}/${record.call_id}/request.json`)} download>Request JSON</a>,
          ])} /> : <p>No API attempts are present in this saved snapshot.</p> : <SummaryUnavailable state={state} retry={retry} />}
          <p>Exact response, metadata, source mapping, and deterministic grade are available from each receipt. Source IDs identify the historical Jev task; they do not imply a new independent puzzle.</p>
        </Section>
        <Section id="subq-sources" title="Primary sources and the next comparison">
          <ul className="source-list">
            <li><a href={sourceLinks.launch} target="_blank" rel="noreferrer">Introducing SubQ Snap</a><span>Vendor architecture, benchmark comparisons, and limitations of the comparison.</span></li>
            <li><a href={sourceLinks.decisions} target="_blank" rel="noreferrer">SubQ Decisions API</a><span>Typed request contract and documented image input.</span></li>
            <li><a href="https://docs.typesafe.ai/primitives/choice" target="_blank" rel="noreferrer">TypeSafe Choice</a><span>Historical Jev primitive and bounded candidate selection.</span></li>
            <li><a href={sourceLinks.openai} target="_blank" rel="noreferrer">OpenAI Decisions</a><span>Documented beta for a proposed follow-up; no OpenAI result is claimed.</span></li>
          </ul>
          <div className="next-actions"><a href={assetUrl('evidence/subq-REPORT.md')} download>Download the complete SubQ report</a><a href={assetUrl('evidence/subq-trajectory-audit.json')} download>Inspect the independent path audit</a><a href="#/openai-decisions-plan">Read the staged OpenAI plan</a><a href="#/jev-trajectories">Compare the original Jev trajectories</a><a href="#/evidence-atlas">Browse the evidence atlas</a></div>
        </Section>
      </main>
    </div>
  </>
}

export function OpenAIDecisionsPlan({ ui }: { ui: BookUi }) {
  const { PageHero, LocalToc, Section, Callout, DataTable } = ui
  return <>
    <PageHero trail="Decision models / future experiment" title="Test the same decision before changing the task." deck="A staged plan for OpenAI's documented Decisions API: first reproduce the historical text tasks, then separate image and generation extensions. No OpenAI requests or spend are reported." />
    <div className="reading-layout">
      <LocalToc items={[{ id: 'openai-facts', label: 'Verified facts' }, { id: 'openai-stages', label: 'Staged replay' }, { id: 'openai-hypotheses', label: 'Hypotheses' }, { id: 'openai-extensions', label: 'Separate extensions' }, { id: 'openai-sources', label: 'Full plan and sources' }]} />
      <main className="reading-column" id="main-content">
        <Section id="openai-facts" title="A documented API, an unrun experiment">
          <Callout tone="stop" title="Future plan: access and behavior remain unverified.">Official documentation establishes the API's existence. This assessment has not verified OpenAI account access, issued inference calls, or incurred OpenAI charges. The SubQ $5 allowance does not authorize a separate OpenAI spend.</Callout>
          <DataTable caption="OpenAI Decisions facts checked October 12, 2026" headers={['Field', 'Documented contract']} rows={[
            ['Status and model', 'Public beta · gpt-6-luna'],
            ['Endpoint', 'POST /v1/decisions'],
            ['Request', 'model, input, questions array'],
            ['Questions', 'predicate, choice, score'],
            ['Choice menu', '2–255 unique choices, including any rejection option'],
            ['Input', 'Text and images; no tools, audio, files, or other message roles'],
            ['Published base price', '$0.10 / million input tokens; output and cache charges omitted for Decisions; premiums can apply'],
          ]} />
          <p><a href={sourceLinks.openai} target="_blank" rel="noreferrer">Read the official Decisions guide</a> and <a href={sourceLinks.openaiReference} target="_blank" rel="noreferrer">the current request/response reference</a>. Published terms are not an observed bill or Queens result.</p>
        </Section>
        <Section id="openai-stages" title="Prove one request, then widen the replay">
          <DataTable caption="Proposed depth-first assessment sequence" headers={['Stage', 'Work', 'Advance when']} rows={[
            ['Freeze', 'Pair eligible Jev/SubQ receipts; preserve board, wording, options, order, oracle, and source hashes.', 'Access terms and a separate budget are settled.'],
            ['Connectivity', 'One tiny known-answer Choice, then one historical 5×5 candidate request.', 'Identity, schema, receipts, grading, and usage are verified.'],
            ['Representation', 'Replay columns, coordinates, explicit regions, counts, and reordered descriptions with controlled repeats.', 'The historical semantic mapping is working.'],
            ['Primitives', 'Compare Choice, Predicate/Noul, and Score on answer-present and all-invalid sets.', 'Each denominator and threshold remains explicit.'],
            ['Construction', 'Replay row choices, then fresh raw/local trajectories and exact-body repeatability.', 'The harness preserves sequential dependencies and stopping rules.'],
          ]} />
          <p>Map Jev/SubQ Noul to OpenAI Predicate and record the exact translation. Shared independent questions can be batched; a cell decision depending on a chosen color requires another request. Execute the returned Choice, retain failures, and gate every accepted placement with the deterministic checker.</p>
        </Section>
        <Section id="openai-hypotheses" title="Predictions to test, not findings">
          <ul>
            <li>Explicit occupied-region lists may still outperform implicit board lookups.</li>
            <li>Relative candidate ranking may work when absolute validity thresholds produce false positives.</li>
            <li>Fast individual decisions may still accumulate into invalid full-board paths.</li>
            <li>Option order, repeated exact bodies, and batching may change choices or distributions.</li>
            <li>Images may reduce transcription work while adding perception errors.</li>
          </ul>
          <p>These hypotheses do not establish a provider ranking or reveal proprietary internal reasoning. A small shared board family limits what any observed advantage can support.</p>
        </Section>
        <Section id="openai-extensions" title="Label every change to the task">
          <p>The main arm preserves the historical text decision. An image-only or image-plus-text arm should use identical frozen board PNGs across OpenAI and SubQ, with each provider's documented encoding. It is an extension of the Jev study.</p>
          <p>A complete placement generated through Responses Structured Outputs tests another interface. New feedback, backtracking, long-context padding, and candidate filtering also belong in separate adapted conditions. Candidate selection must not receive credit for the harness's search.</p>
        </Section>
        <Section id="openai-sources" title="Keep the plan reviewable before inference">
          <p>The full plan specifies receipt fields, budget reservations, failure accounting, comparison units, access checks, and the worker/transport boundary. Read it before running the experiment.</p>
          <div className="next-actions"><a href={assetUrl('evidence/openai-decisions-plan.md')} download>Download the complete test plan</a><a href="#/subq-assessment">Return to the SubQ results</a></div>
          <ul className="source-list"><li><a href={sourceLinks.openai} target="_blank" rel="noreferrer">OpenAI Decisions guide</a><span>Beta, model, pricing, and independent versus dependent questions.</span></li><li><a href={sourceLinks.openaiReference} target="_blank" rel="noreferrer">Create a decision reference</a><span>Current typed request and response schema.</span></li><li><a href={sourceLinks.decisions} target="_blank" rel="noreferrer">SubQ Decisions, including images</a><span>Counterpart for a separately labeled multimodal extension.</span></li></ul>
        </Section>
      </main>
    </div>
  </>
}
