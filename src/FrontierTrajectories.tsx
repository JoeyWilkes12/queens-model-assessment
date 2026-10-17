import { useEffect, useMemo, useState, type ComponentType, type ReactNode } from 'react'
import { BoardReplay, type BoardFrame, type Cell, type FrameTone } from './BoardReplay'
import './frontier-trajectories.css'

type BookUi = {
  PageHero: ComponentType<{ title: string; deck: string; trail: string; action?: { label: string; path?: string; scrollTo?: string } }>
  LocalToc: ComponentType<{ items: { id: string; label: string }[] }>
  Section: ComponentType<{ id?: string; title: string; label?: string; children: ReactNode }>
  Callout: ComponentType<{ tone?: 'note' | 'evidence' | 'caution' | 'stop'; title: string; children: ReactNode }>
  DataTable: ComponentType<{ caption: string; headers: string[]; rows: (string | ReactNode)[][] }>
}

type Labels = { correct_queens: number; off_solution: [number, number][]; conflicts: { queens: [number, number][]; reasons: string[] }[] }
type Turn = {
  turn: number
  call_id: string
  effect: 'placed' | 'revised' | 'stopped' | 'invalid_action' | 'occupied_cell' | 'revise_too_many' | 'request_failure'
  action: { action?: string; row?: number; column?: number; queens?: { row: number; column: number }[] } | null
  parse_mode: string
  detail: { cell?: [number, number]; violations?: string[]; moved_out?: [number, number][]; added?: [number, number][]; why?: string }
  placed_after: [number, number][]
  labels_after: Labels
  text: string | null
  finish_reason: string | null
  http_attempts: (number | null)[]
  cost_usd: number | null
  completion_tokens?: number | null
  reasoning_tokens?: number | null
  returned_model?: string | null
}
type Trajectory = {
  trajectory_id: string
  model: string
  short: string
  board_id: string
  size: number
  end_reason: string
  requests: number
  solved: boolean
  final_correct_queens: number
  first_off_solution_turn: number | null
  effects: Record<string, number>
  cost_usd: number
  turns: Turn[]
}
type Comparison = { one_shot: Record<string, string>; jev_solved: boolean | null; subq_solved: boolean | null; greedy_solved: boolean | null }
type Phase = { study: string; phase: 'pilot' | 'main'; boards: { id: string; size: number; regions: string[][] }[]; trajectories: Trajectory[]; comparisons: Record<string, Comparison> }

const evidenceUrl = (path: string) => `${import.meta.env.BASE_URL}evidence/${path}`
const MODEL_NAMES: Record<string, string> = { 'gpt-5.6-sol': 'GPT-5.6 Sol', 'claude-opus-4.8': 'Claude Opus 4.8', 'gemini-3.1-pro-preview': 'Gemini 3.1 Pro Preview', 'grok-4.6': 'Grok 4.6' }
const MODEL_ORDER = ['gpt-5.6-sol', 'claude-opus-4.8', 'gemini-3.1-pro-preview', 'grok-4.6']
const ONE_SHOT: Record<string, string> = { strict: 'solved', format_only: 'solved, off-format', wrong: 'wrong', truncated: 'ran out of tokens', no_answer: 'no answer' }
const FINISHED = ['max_requests', 'stopped', 'request_failure']
const END: Record<string, string> = { max_requests: 'used every request', stopped: 'stopped early', request_failure: 'request failed', censored_budget: 'not run (budget)', not_run: 'not run', incomplete_turn: 'incomplete' }
/** These states are a model's own actions in a conversation with no feedback. */
const toneLabels: Partial<Record<FrameTone, string>> = { pass: 'All queens on the solution', fail: 'Off the solution', choice: 'Revision', unknown: 'No change' }

const cellText = ([row, column]: readonly number[]) => `r${row}c${column}`
const money = (value: number) => value < 0.01 ? `$${value.toFixed(4)}` : `$${value.toFixed(2)}`
const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? '' : 's'}`

/** The visible reply without its final ```json action block. */
function prose(text: string | null) {
  if (!text) return ''
  const fence = text.lastIndexOf('```json')
  return (fence >= 0 ? text.slice(0, fence) : text).trim()
}

function excerpt(text: string, limit = 520) {
  const flat = text.split('\n').filter(line => !/^\s*#/.test(line)).join(' ').replace(/[*`]/g, '').replace(/\s+/g, ' ').trim()
  return flat.length > limit ? `${flat.slice(0, limit).replace(/\s\S*$/, '')} …` : flat
}

function describe(turn: Turn) {
  const a = turn.action
  switch (turn.effect) {
    case 'placed': return `places a queen at ${cellText(turn.detail.cell ?? [a?.row ?? 0, a?.column ?? 0])}${turn.detail.violations?.length ? ` (breaks a rule: ${turn.detail.violations.join(', ').replace(/_/g, ' ')})` : ''}`
    case 'revised': return `revises its placement${turn.detail.moved_out?.length ? `, removing ${turn.detail.moved_out.map(cellText).join(', ')}` : ''}${turn.detail.added?.length ? `, adding ${turn.detail.added.map(cellText).join(', ')}` : ''}`
    case 'stopped': return 'stops'
    case 'occupied_cell': return 'names a cell that already has a queen; nothing changes'
    case 'revise_too_many': return 'sends a revision with too many new queens; nothing changes'
    case 'request_failure': return 'gets no answer: the request failed'
    default: return 'sends no valid action; nothing changes'
  }
}

function framesFor(trajectory: Trajectory, studySource: string): BoardFrame[] {
  const n = trajectory.size
  const frames: BoardFrame[] = [{ id: 'start', label: 'Empty board', queens: [], tone: 'start', sourceLabel: studySource,
    note: `${n}×${n} board, ${n} colors. The model may send ${n} requests: each places one queen, revises the placement or stops. It never learns whether a queen is right.` }]
  let previous: Cell[] = []
  for (const turn of trajectory.turns) {
    const queens = turn.placed_after.map(([r, c]) => [r, c] as const)
    const off = turn.labels_after.off_solution.map(([r, c]) => [r, c] as const)
    const said = excerpt(prose(turn.text))
    const tone: FrameTone = turn.effect === 'request_failure' ? 'unknown'
      : off.length || turn.labels_after.conflicts.length ? 'fail' : turn.effect === 'revised' ? 'choice' : queens.length === previous.length ? 'unknown' : 'pass'
    frames.push({
      id: `turn-${turn.turn}`, label: `Request ${turn.turn} of ${n}: ${describe(turn)}`, queens,
      selectedCell: turn.effect === 'placed' && turn.detail.cell ? [turn.detail.cell[0], turn.detail.cell[1]] : undefined, selectedCellLabel: 'New queen',
      invalidCells: off.length ? off : undefined, tone, sourceLabel: studySource,
      receiptLinks: [{ label: `Request ${turn.turn} receipt`, id: `${studySource}:${turn.call_id}` }],
      note: `${turn.labels_after.correct_queens} of ${queens.length} queens on the unique solution${off.length ? ` (off: ${off.map(cellText).join(', ')})` : ''}. ${said ? `The model wrote: “${said}”` : 'No visible explanation.'}`,
    })
    previous = queens
  }
  const last = trajectory.turns[trajectory.turns.length - 1]
  frames.push(trajectory.solved
    ? { id: 'end', label: 'Final placement: solved', queens: previous, tone: 'solved', sourceLabel: studySource, note: `The final placement is the board's unique solution, after ${plural(trajectory.requests, 'request')}.` }
    : !FINISHED.includes(trajectory.end_reason) ? { id: 'end', label: 'Unfinished: the run stopped here', queens: previous, tone: 'unknown', sourceLabel: studySource, note: `Recorded so far: ${plural(trajectory.turns.length, 'request')}. The trajectory resumes from the next request; nothing is graded until it ends.` }
    : { id: 'end', label: `Final placement: not solved (${END[trajectory.end_reason] ?? trajectory.end_reason})`, queens: previous, tone: 'fail', sourceLabel: studySource,
      invalidCells: last?.labels_after.off_solution.length ? last.labels_after.off_solution.map(([r, c]) => [r, c] as const) : undefined,
      note: `${trajectory.final_correct_queens} of ${n} queens on the unique solution at the end.${trajectory.first_off_solution_turn ? ` The first queen off the solution came at request ${trajectory.first_off_solution_turn}.` : ''}` })
  return frames
}

function usePhases() {
  const [state, setState] = useState<{ status: 'loading' | 'error' } | { status: 'ready'; phases: Phase[] }>({ status: 'loading' })
  useEffect(() => {
    const controller = new AbortController()
    const get = (path: string) => fetch(evidenceUrl(path), { signal: controller.signal }).then(response => response.ok ? response.json() : null)
    get('frontier-trajectories/index.json')
      .then((index: { phases?: string[] } | null) => Promise.all(['main', 'pilot'].filter(name => index?.phases?.includes(name)).map(name => get(`frontier-trajectories/${name}.json`))))
      .then(values => {
        const phases = values.filter((value): value is Phase => !!value && Array.isArray(value.trajectories))
        setState(phases.length ? { status: 'ready', phases } : { status: 'error' })
      })
      .catch(() => { if (!controller.signal.aborted) setState({ status: 'error' }) })
    return () => controller.abort()
  }, [])
  return state
}

function Summary({ phases, ui }: { phases: Phase[]; ui: BookUi }) {
  const { DataTable } = ui
  return <>{phases.map(phase => {
    const sizes = [...new Set(phase.boards.map(board => board.size))].sort()
    const rows = MODEL_ORDER.filter(short => phase.trajectories.some(t => t.short === short)).map(short => {
      const mine = phase.trajectories.filter(t => t.short === short)
      const run = mine.filter(t => FINISHED.includes(t.end_reason))
      const pending = mine.length - run.length
      const firsts = run.map(t => t.first_off_solution_turn).filter((v): v is number => v !== null)
      const revisions = run.reduce((sum, t) => sum + (t.effects.revised ?? 0), 0)
      const stops = run.filter(t => t.end_reason === 'stopped').length
      return [MODEL_NAMES[short] ?? short,
        ...sizes.map(size => { const s = run.filter(t => t.size === size); const open = mine.filter(t => t.size === size).length - s.length; return `${s.filter(t => t.solved).length}/${s.length}${open ? ` (${open} unfinished)` : ''}` }),
        firsts.length ? `${firsts.length} (request ${Math.min(...firsts)}–${Math.max(...firsts)})` : 'none',
        String(revisions), String(stops), `${money(mine.reduce((sum, t) => sum + t.cost_usd, 0))}${pending ? ' so far' : ''}`]
    })
    return <DataTable key={phase.phase} caption={phase.phase === 'pilot' ? 'Pilot: one development board per model (not pooled with the panel)' : `Panel boards: ${phase.boards.length} boards per model`}
      headers={['Model', ...sizes.map(size => `${size}×${size} solved`), 'Left the solution', 'Revisions', 'Stopped early', 'Cost']} rows={rows} />
  })}</>
}

function Pairs({ phase, ui }: { phase: Phase; ui: BookUi }) {
  const { DataTable } = ui
  if (phase.phase !== 'main' || !Object.keys(phase.comparisons).length) return null
  const yes = (value: boolean | null) => value === null ? '—' : value ? 'solved' : 'not solved'
  const rows = phase.boards.flatMap(board => MODEL_ORDER.map(short => {
    const t = phase.trajectories.find(item => item.board_id === board.id && item.short === short)
    if (!t) return null
    const c = phase.comparisons[board.id]
    return [`${board.id} · ${MODEL_NAMES[short]}`, t.turns.length ? (t.solved ? 'solved' : `not solved (${t.final_correct_queens}/${t.size})`) : END[t.end_reason] ?? t.end_reason, ONE_SHOT[c?.one_shot?.[short]] ?? '—',
      yes(c?.jev_solved ?? null), yes(c?.subq_solved ?? null), yes(c?.greedy_solved ?? null)]
  }).filter((row): row is string[] => !!row))
  return <DataTable caption="Same boards, other tests" headers={['Board · model', 'One queen per request', 'One shot from the image (16 Oct)', 'Jev 1.13', 'SubQ Snap', 'Greedy rule']} rows={rows} />
}

function Replays({ phases }: { phases: Phase[] }) {
  const [phaseKey, setPhaseKey] = useState(phases[0].phase)
  const phase = phases.find(p => p.phase === phaseKey) ?? phases[0]
  const [boardId, setBoardId] = useState(phase.boards[0]?.id ?? '')
  const board = phase.boards.find(b => b.id === boardId) ?? phase.boards[0]
  const available = MODEL_ORDER.filter(short => phase.trajectories.some(t => t.short === short && t.board_id === board?.id && t.turns.length))
  const [short, setShort] = useState(available[0] ?? MODEL_ORDER[0])
  const model = available.includes(short) ? short : available[0]
  const trajectory = phase.trajectories.find(t => t.short === model && t.board_id === board?.id)
  const frames = useMemo(() => trajectory ? framesFor(trajectory, phase.study) : [], [trajectory, phase.study])
  if (!board) return <p role="status">No saved trajectories are available.</p>

  return <div className="ft-replays">
    <div className="ft-controls">
      {phases.length > 1 && <div className="ft-field"><label htmlFor="ft-phase">Study</label>
        <select id="ft-phase" value={phase.phase} onChange={event => { const next = phases.find(p => p.phase === event.target.value) ?? phases[0]; setPhaseKey(next.phase); setBoardId(next.boards[0]?.id ?? '') }}>
          {phases.map(p => <option key={p.phase} value={p.phase}>{p.phase === 'pilot' ? 'Pilot (development board)' : 'Panel boards'}</option>)}
        </select></div>}
      <div className="ft-field ft-field--board"><label htmlFor="ft-board">Board</label>
        <select id="ft-board" value={board.id} onChange={event => setBoardId(event.target.value)}>
          {phase.boards.map(b => <option key={b.id} value={b.id}>{b.id} · {b.size}×{b.size}</option>)}
        </select></div>
      <div className="ft-models" role="group" aria-label="Model">
        {MODEL_ORDER.map(item => <button key={item} type="button" aria-pressed={item === model} disabled={!available.includes(item)} onClick={() => setShort(item)}>{MODEL_NAMES[item]}</button>)}
      </div>
    </div>
    {trajectory && trajectory.turns.length ? <>
      <BoardReplay key={trajectory.trajectory_id} regions={board.regions} frames={frames} toneLabels={toneLabels}
        eyebrow={`${MODEL_NAMES[trajectory.short]} · ${board.id} · one queen per request`}
        title={trajectory.solved ? `Solved in ${plural(trajectory.requests, 'request')}` : !FINISHED.includes(trajectory.end_reason) ? `Unfinished after ${plural(trajectory.requests, 'request')}` : `Not solved: ${trajectory.final_correct_queens} of ${trajectory.size} queens right at the end`}
        description="One state per request. Red marks queens off the board's unique solution, which the model never sees." />
      <details className="ft-transcript">
        <summary>Every reply in full ({plural(trajectory.turns.length, 'request')}, {money(trajectory.cost_usd)})</summary>
        <ol>{trajectory.turns.map(turn => <li key={turn.call_id}>
          <p className="ft-turn-head"><strong>Request {turn.turn}</strong>: {describe(turn)}. <span>{turn.completion_tokens ? `${turn.completion_tokens.toLocaleString()} output tokens${turn.reasoning_tokens ? `, ${turn.reasoning_tokens.toLocaleString()} of them hidden reasoning` : ''} · ` : ''}{turn.cost_usd !== null ? money(turn.cost_usd) : 'cost not reported'} · <a href={`#/evidence-atlas/${phase.study}:${turn.call_id}`}>receipt</a></span></p>
          <div className="ft-reply">{prose(turn.text) || '(no visible reply)'}</div>
        </li>)}</ol>
      </details>
    </> : <p role="status">This model has no recorded turns on this board.</p>}
  </div>
}

export function FrontierTrajectories({ ui }: { ui: BookUi }) {
  const { PageHero, LocalToc, Section, Callout } = ui
  const state = usePhases()
  const phases = state.status === 'ready' ? state.phases : null
  const status = state.status === 'error' ? <p role="status">The saved trajectory evidence could not be loaded. No replay is substituted.</p>
    : state.status === 'loading' ? <p role="status">Loading the saved trajectories…</p> : null

  return <>
    <PageHero trail="The board / one queen at a time" title="One queen per request, no feedback." deck="Each frontier model got the decision models' text state and up to N requests on an N×N board. It placed, moved or stopped as it chose and explained each move. Nothing told it whether a queen was right." action={{ label: 'Watch a model play', scrollTo: 'ft-replays' }} />
    <div className="reading-layout">
      <LocalToc items={[{ id: 'ft-protocol', label: 'Protocol' }, { id: 'ft-results', label: 'Results' }, { id: 'ft-replays', label: 'Replays' }, { id: 'ft-limits', label: 'Limits' }]} />
      <main className="reading-column" id="main-content">
        <Section id="ft-protocol" title="What the model saw and could do" label="One queen at a time">
          <p className="lead">One conversation per model and board, at most N requests. The model cannot restart; it may stop early or revise.</p>
          <div className="rule-list">
            <div><span>IN</span><p><strong>The decision models' state.</strong> Rules, coordinates, the color grid, every color's cells and the queens placed so far, as text: the same state Jev and SubQ receive. No image.</p></div>
            <div><span>OUT</span><p><strong>One action per request.</strong> Place one queen; revise the whole placement (moving any queens, adding at most one); or stop. An explanation first is encouraged and never scored.</p></div>
            <div><span>NO</span><p><strong>No feedback, no early stop.</strong> The next request shows the updated placement and nothing else. Leaving the solution does not end the attempt.</p></div>
          </div>
          <p>The final placement is graded against the board's unique solution, which is never sent. GPT-5.6 Sol ran through the Batch API, one batch per round of requests; the other three ran on demand with the 16 October provider settings. <a href={evidenceUrl(`frontier-trajectories/${phases?.some(p => p.phase === 'main') ? 'main' : 'pilot'}-plan.json`)} download>Frozen plan</a> · preregistration in <code>docs/frontier-trajectories-preregistration.md</code>.</p>
        </Section>
        <Section id="ft-results" title="Results">
          {status ?? (phases && <><Summary phases={phases} ui={ui} />{phases.filter(p => p.phase === 'main').map(p => <Pairs key={p.phase} phase={p} ui={ui} />)}</>)}
        </Section>
        <Section id="ft-replays" title="Replays">
          <p>Choose a board and a model. Each state is the placement after one request, with an excerpt of what the model wrote; the full replies are below the board.</p>
          {status ?? (phases && <Replays phases={phases} />)}
        </Section>
        <Section id="ft-limits" title="Limits">
          <Callout tone="caution" title="A small, descriptive sample.">Few boards per model, chosen by a cost-only rule fixed before the panel runs. The text state removes image perception, so these results are not comparable with the one-shot image test as a measure of the same skill. Explanations are the model's own visible text; hidden reasoning is excluded and is not carried between requests.</Callout>
        </Section>
      </main>
    </div>
  </>
}
