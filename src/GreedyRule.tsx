import { useEffect, useMemo, useState, type ComponentType, type ReactNode } from 'react'
import { BoardReplay, type BoardFrame, type Cell, type FrameTone } from './BoardReplay'
import './greedy-rule.css'

type BookUi = {
  PageHero: ComponentType<{ title: string; deck: string; trail: string; action?: { label: string; path?: string; scrollTo?: string } }>
  LocalToc: ComponentType<{ items: { id: string; label: string }[] }>
  Section: ComponentType<{ id?: string; title: string; label?: string; children: ReactNode }>
  Callout: ComponentType<{ tone?: 'note' | 'evidence' | 'caution' | 'stop'; title: string; children: ReactNode }>
  DataTable: ComponentType<{ caption: string; headers: string[]; rows: (string | ReactNode)[][] }>
}

type Step = {
  step: number
  region: string
  menu_sizes: Record<string, number>
  tied_regions: string[]
  candidates: [number, number][]
  cell: [number, number] | null
  forced?: boolean
  on_unique_solution: boolean | null
  empty_menu: boolean
  after_scored_stop?: boolean
}
type Source = 'original-nine' | 'panel-192'
type GreedyBoard = {
  board_id: string
  size: number
  source: Source
  regions: string[][]
  steps: Step[]
  scored_solved: boolean
  scored_correct_prefix: number
  scored_stop: { step: number | null; reason: 'solved' | 'off_solution' | 'empty_menu' }
  continued_queens: number
  continued_full: boolean
}
type ModeCounts = { raw: [number, number]; local: [number, number] }
type DecisionSet = { boards: { id: string; size: number }[]; models: { name: string; per_board: Record<string, ModeCounts> }[]; baselines: { greedy: Record<string, boolean>; random_expected_any: Record<string, number> } }
type Stratum = { singleton_status: 'singleton' | 'no_singleton'; tier: 'lower_search' | 'higher_search' }
type Loaded = { boards: GreedyBoard[]; decision: { original: DecisionSet; panel: DecisionSet }; strata: Map<string, Stratum> }
type Group = 'original' | 'panel-5' | 'panel-7' | 'panel-9'

const evidenceUrl = (path: string) => `${import.meta.env.BASE_URL}evidence/${path}`
const TRAJECTORIES = 'greedy/trajectories.json'
const SOURCE = 'public/evidence/greedy/trajectories.json · rule: scripts/subq/boards.py greedy (frozen), traced by scripts/analysis/greedy_trajectories.py'
const sizes = [5, 7, 9]
const groups: { key: Group; label: string }[] = [
  { key: 'original', label: 'Original nine boards' },
  { key: 'panel-5', label: 'New panel · 5×5' },
  { key: 'panel-7', label: 'New panel · 7×7' },
  { key: 'panel-9', label: 'New panel · 9×9' },
]
const strata: [Stratum['singleton_status'], Stratum['tier'], string][] = [
  ['singleton', 'lower_search', 'Singleton · lower search'],
  ['singleton', 'higher_search', 'Singleton · higher search'],
  ['no_singleton', 'lower_search', 'No singleton · lower search'],
  ['no_singleton', 'higher_search', 'No singleton · higher search'],
]
/** These states are a fixed rule's, not a model's or a harness's. */
const toneLabels: Partial<Record<FrameTone, string>> = { choice: 'Choice: first in reading order', forced: 'Forced: one legal cell', pass: 'On the unique solution', fail: 'Stopped', unknown: 'Not scored' }

const groupOf = (board: GreedyBoard): Group => board.source === 'original-nine' ? 'original' : `panel-${board.size}` as Group
const shortId = (id: string) => id.replace('sequence-', '')
const cellText = ([row, column]: Cell) => `r${row}c${column}`
const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? '' : 's'}`
const and = (items: string[]) => items.length < 2 ? items.join('') : `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`
const legalLeft = (step: Step) => `Legal cells left: ${Object.entries(step.menu_sizes).map(([region, count]) => `${region} ${count}`).join(' · ')}.`
const tieText = (step: Step) => step.tied_regions.length > 1 ? ` ${and(step.tied_regions)} tie at ${step.menu_sizes[step.region]}; the earlier letter, ${step.region}, goes first.` : ''
const choiceSteps = (board: GreedyBoard) => board.steps.filter(step => step.forced === false && !step.after_scored_stop).length
const failedLabel = (board: GreedyBoard) => board.scored_solved ? 'solved' : `failed at step ${board.scored_stop.step}`
const findModel = (set: DecisionSet, name: string) => set.models.find(model => model.name.startsWith(name))
const solvedBy = (set: DecisionSet, name: string, id: string) => { const cell = findModel(set, name)?.per_board[id]; return !!cell && (cell.raw[0] > 0 || cell.local[0] > 0) }

/** Start, then two states per step (count legal cells, place), then the end state. */
function greedyFrames(board: GreedyBoard): BoardFrame[] {
  const n = board.size
  const stop = board.scored_stop.step
  const queens: Cell[] = []
  let offSolution: Cell | undefined
  const scored = `Scored result: ${plural(board.scored_correct_prefix, 'correct queen')}, stopped at step ${stop}.`
  const frames: BoardFrame[] = [{ id: 'start', label: 'Empty board', queens: [], note: `${n}×${n} board with ${n} colors and no queens. Each step counts every unplaced color's legal cells, then places one queen.`, sourceLabel: SOURCE, tone: 'start' }]
  for (const step of board.steps) {
    const flagged = offSolution ? [offSolution] : undefined
    if (step.empty_menu || !step.cell) {
      frames.push({ id: 'dead-end', label: `Dead end: color ${step.region} has no legal cell`, queens: [...queens], highlightRegion: step.region, invalidCells: flagged, note: `${legalLeft(step)} ${step.region} has no legal cell and the rule never backtracks, so the run ends with ${queens.length} of ${n} queens. ${scored}`, sourceLabel: SOURCE, tone: 'fail' })
      return frames
    }
    const cell = step.cell
    const continued = !!step.after_scored_stop
    const suffix = continued ? ' · continued without the oracle (not scored)' : ''
    const pick = step.forced ? `${step.region} has one legal cell, ${cellText(cell)}, so the step is forced.` : `${step.region} has ${step.candidates.length} legal cells; reading order takes the first, ${cellText(cell)}.`
    frames.push({ id: `count-${step.step}`, label: `Step ${step.step}: count legal cells${suffix}`, queens: [...queens], highlightRegion: step.region, candidateCells: step.candidates, invalidCells: flagged, note: `${legalLeft(step)}${tieText(step)} ${pick}`, sourceLabel: SOURCE, tone: continued ? 'unknown' : step.forced ? 'forced' : 'choice' })
    queens.push(cell)
    const leaves = !continued && step.on_unique_solution === false
    if (leaves) offSolution = cell
    const note = continued ? `Placed by the same rule. Not scored: the scored run stopped at step ${stop}.`
      : leaves ? `${cellText(cell)} leaves the unique solution; the scored baseline stops here, with ${plural(board.scored_correct_prefix, 'correct queen')}. The replay keeps applying the rule without the oracle.`
        : `${cellText(cell)} is on the board's unique solution. ${queens.length} of ${n} queens placed.`
    frames.push({ id: `place-${step.step}`, label: `Step ${step.step}: place ${step.region} at ${cellText(cell)}${suffix}`, queens: [...queens], selectedCell: cell, selectedCellLabel: 'Placed cell', invalidCells: offSolution ? [offSolution] : undefined, note, sourceLabel: SOURCE, tone: continued ? 'unknown' : leaves ? 'fail' : 'pass' })
  }
  frames.push(board.scored_solved
    ? { id: 'solved', label: 'Solved', queens: [...queens], note: `All ${n} colors have a queen, and every queen is on the board's unique solution.`, sourceLabel: SOURCE, tone: 'solved' }
    : { id: 'end', label: 'Run ends', queens: [...queens], invalidCells: offSolution ? [offSolution] : undefined, note: scored, sourceLabel: SOURCE, tone: 'unknown' })
  return frames
}

function useEvidence() {
  const [state, setState] = useState<{ status: 'loading' } | { status: 'error' } | { status: 'ready'; data: Loaded }>({ status: 'loading' })
  useEffect(() => {
    const controller = new AbortController()
    const get = (path: string) => fetch(evidenceUrl(path), { signal: controller.signal }).then(response => { if (!response.ok) throw new Error(path); return response.json() })
    Promise.all([get(TRAJECTORIES), get('scoreboard.json'), get('subq-panel/corpus.json')])
      .then(([greedy, scoreboard, corpus]) => {
        if (!Array.isArray(greedy.boards)) throw new Error('schema')
        setState({ status: 'ready', data: { boards: greedy.boards, decision: scoreboard.decision, strata: new Map(corpus.boards.map((board: { id: string; stratum: Stratum }) => [board.id, board.stratum])) } })
      })
      .catch(() => { if (!controller.signal.aborted) setState({ status: 'error' }) })
    return () => controller.abort()
  }, [])
  return state
}

function Facts({ data, ui }: { data: Loaded; ui: BookUi }) {
  const { Callout } = ui
  const boards = data.boards
  const scored = boards.flatMap(board => board.steps.filter(step => step.cell && !step.after_scored_stop))
  const forced = scored.filter(step => step.forced)
  const failing = boards.filter(board => !board.scored_solved)
  const failingSteps = failing.map(board => board.steps[(board.scored_stop.step ?? 0) - 1])
  const byMenu = new Map<number, number>()
  failingSteps.forEach(step => { if (step) byMenu.set(step.candidates.length, (byMenu.get(step.candidates.length) || 0) + 1) })
  const forcedHolds = forced.every(step => step.on_unique_solution) && failingSteps.every(step => step && step.candidates.length >= 2) && boards.every(board => board.scored_stop.reason !== 'empty_menu')
  const deadEndHolds = failing.every(board => !board.continued_full && board.steps[board.steps.length - 1]?.empty_menu)
  return <>
    {forcedHolds ? <p><strong>A forced step cannot fail.</strong> While every queen on the board is on the solution, each unplaced color's own solution cell is still legal. So a color with one legal cell has exactly that cell left, and no color runs out. On these {boards.length} boards, {forced.length} of {scored.length} scored steps were forced, and none left the solution. All {failing.length} failures came at steps with two or more legal cells ({[...byMenu].sort((a, b) => a[0] - b[0]).map(([cells, count]) => `${count} with ${cells}`).join(', ')}), where reading order picked a wrong one.</p>
      : <Callout tone="caution" title="The forced-step check failed on the loaded evidence.">At least one forced step left the solution, a failure came at a step with one legal cell, or a scored run ended on an empty menu. The claim is not made here.</Callout>}
    {deadEndHolds ? <p><strong>Every failure ends in a dead end.</strong> The records keep applying the rule after the scored stop, without the solution. On all {failing.length} failing boards, it reaches a color with no legal cell before every color has a queen. It has to: a complete legal placement is a solution, the board has only one, and the run has already left it.</p>
      : <Callout tone="caution" title="The dead-end check failed on the loaded evidence.">At least one failing board completes, or its continuation does not end on an empty menu. The claim is not made here.</Callout>}
  </>
}

function Results({ data, ui }: { data: Loaded; ui: BookUi }) {
  const { DataTable } = ui
  const fraction = (boards: GreedyBoard[]) => `${boards.filter(board => board.scored_solved).length}/${boards.length}`
  const resultRows = (source: Source, set: DecisionSet) => [...sizes.map(size => [`${size}×${size}`, data.boards.filter(board => board.source === source && board.size === size)] as const), ['All sizes', data.boards.filter(board => board.source === source)] as const]
    .map(([label, boards]) => {
      const ids = boards.map(board => board.board_id)
      const random = ids.reduce((sum, id) => sum + (set.baselines.random_expected_any[id] ?? 0), 0)
      const model = (name: string) => findModel(set, name) ? `${ids.filter(id => solvedBy(set, name, id)).length}/${ids.length}` : '—'
      return [label, label === 'All sizes' ? <strong>{fraction(boards)}</strong> : fraction(boards), model('Jev'), model('SubQ'), `≈${random.toFixed(1)}`]
    })
  const headers = ['Size', 'Greedy rule', 'Jev 1.13', 'SubQ Snap', 'Random choice, expected']
  const panel = data.boards.filter(board => board.source === 'panel-192')
  const inStratum = (boards: GreedyBoard[], singleton: string, tier: string) => boards.filter(board => data.strata.get(board.board_id)?.singleton_status === singleton && data.strata.get(board.board_id)?.tier === tier)
  const singletonSolved = panel.filter(board => board.scored_solved && data.strata.get(board.board_id)?.singleton_status === 'singleton').length
  const noSingletonSolved = panel.filter(board => board.scored_solved && data.strata.get(board.board_id)?.singleton_status === 'no_singleton').length
  const half = panel.length / 2
  const failing = panel.filter(board => !board.scored_solved)
  const deepest = Math.max(0, ...failing.map(board => board.scored_stop.step ?? 0))
  const atStep = (size: number, step: number) => failing.filter(board => board.size === size && board.scored_stop.step === step).length
  const scoreboardAgrees = data.boards.every(board => data.decision[board.source === 'original-nine' ? 'original' : 'panel'].baselines.greedy[board.board_id] === board.scored_solved)
  return <>
    <DataTable caption="Boards solved, original nine boards" headers={headers} rows={resultRows('original-nine', data.decision.original)} />
    <DataTable caption="Boards solved, new 192-board panel" headers={headers} rows={resultRows('panel-192', data.decision.panel)} />
    <p className="table-note">The rule makes one deterministic pass per board. A model counts a board as solved if any attempt solved it: ten per board on the original nine (five raw, five filtered), two on the panel (one each). Model and random columns come from <a href={evidenceUrl('scoreboard.json')} download>scoreboard.json</a>; the random value is an exact expectation, not a run.{scoreboardAgrees ? ' The rule\'s results match the scoreboard\'s greedy baseline on every board.' : ' The rule\'s results here differ from the scoreboard\'s greedy baseline on at least one board.'}</p>
    <h3>By board type</h3>
    <p>A singleton board has at least one one-cell color, so its first queen is forced. The search tier splits each size and singleton group at the development pool's median search effort for a row-by-row solver proving the solution unique (log₂ of nodes, averaged over the board's eight rotations and reflections). The rule solves {singletonSolved} of {half} singleton boards and {noSingletonSolved} of {half} without one.</p>
    <DataTable caption="Greedy rule on the 192-board panel, by stratum" headers={['Stratum', '5×5', '7×7', '9×9', 'All sizes']} rows={strata.map(([singleton, tier, label]) => [label, ...sizes.map(size => fraction(inStratum(panel.filter(board => board.size === size), singleton, tier))), fraction(inStratum(panel, singleton, tier))])} />
    <h3>Where the rule fails</h3>
    <p>{atStep(5, 1) + atStep(7, 1) + atStep(9, 1)} of {failing.length} failing panel boards fail at step 1: the most constrained color already has two or more legal cells, and the first in reading order is wrong.</p>
    <DataTable caption="First off-solution step, failing panel boards" headers={['Step', '5×5', '7×7', '9×9']} rows={[
      ...Array.from({ length: deepest }, (_, index) => [`Step ${index + 1}`, ...sizes.map(size => index + 1 > size ? '—' : String(atStep(size, index + 1)))]),
      ['Failing boards', ...sizes.map(size => <strong>{failing.filter(board => board.size === size).length}</strong>)],
    ]} />
  </>
}

function Replays({ data }: { data: Loaded }) {
  const boards = data.boards
  const featured = useMemo(() => {
    const nine = boards.find(board => board.board_id === 'sequence-9-2' && board.scored_solved) ?? boards.find(board => board.source === 'original-nine' && board.size === 9 && board.scored_solved)
    const seven = boards.filter(board => board.source === 'panel-192' && board.size === 7 && board.scored_solved).sort((a, b) => choiceSteps(b) - choiceSteps(a) || a.board_id.localeCompare(b.board_id))[0]
    const continued = (board: GreedyBoard) => board.continued_queens - board.scored_correct_prefix
    const deadEnd = boards.filter(board => !board.scored_solved).sort((a, b) => continued(b) - continued(a) || a.size - b.size || a.board_id.localeCompare(b.board_id))[0]
    const fiveTwo = boards.find(board => board.board_id === 'sequence-5-2')
    const subqWins = !!fiveTwo && !fiveTwo.scored_solved && solvedBy(data.decision.original, 'SubQ', fiveTwo.board_id)
    return [
      nine && { id: nine.board_id, label: 'Solved 9×9' },
      seven && { id: seven.board_id, label: 'Solved 7×7' },
      deadEnd && { id: deadEnd.board_id, label: 'Longest dead end' },
      fiveTwo && { id: fiveTwo.board_id, label: subqWins ? 'SubQ solves, rule fails' : 'Board 5-2' },
    ].filter((item): item is { id: string; label: string } => !!item)
  }, [boards, data.decision])
  const [selected, setSelected] = useState(featured[0]?.id ?? boards[0]?.board_id ?? '')
  const board = boards.find(item => item.board_id === selected) ?? boards[0]
  const [group, setGroup] = useState<Group>(board ? groupOf(board) : 'original')
  const options = boards.filter(item => groupOf(item) === group)
  const frames = useMemo(() => board ? greedyFrames(board) : [], [board])
  if (!board) return <p role="status">No boards are in the saved greedy evidence.</p>

  const choose = (id: string) => {
    const next = boards.find(item => item.board_id === id)
    if (!next) return
    setSelected(id)
    setGroup(groupOf(next))
  }
  const stratum = data.strata.get(board.board_id)
  const where = board.source === 'original-nine' ? 'original nine' : `new panel · ${stratum ? `${stratum.singleton_status === 'singleton' ? 'singleton' : 'no singleton'}, ${stratum.tier === 'lower_search' ? 'lower' : 'higher'} search` : `${board.size}×${board.size}`}`
  const deadEnd = board.steps.find(step => step.empty_menu)
  const allForced = board.steps.every(step => step.forced)
  const title = board.scored_solved ? `The rule completes board ${shortId(board.board_id)}${allForced ? '; every step is forced' : ''}`
    : `Off the solution at step ${board.scored_stop.step}${deadEnd ? `; dead end at step ${deadEnd.step}` : ''}`
  const set = data.decision[board.source === 'original-nine' ? 'original' : 'panel']
  const models = ['Jev', 'SubQ'].map(name => {
    const model = findModel(set, name)
    const cell = model?.per_board[board.board_id]
    return model && cell ? `${model.name.replace(' (preview)', '')} solved ${cell.raw[0] + cell.local[0]} of ${cell.raw[1] + cell.local[1]} attempts (raw ${cell.raw[0]}/${cell.raw[1]}, filtered ${cell.local[0]}/${cell.local[1]})` : null
  }).filter(Boolean)

  return <div className="greedy-replays">
    <div className="gr-controls">
      <div className="gr-field">
        <label htmlFor="gr-group">Boards</label>
        <select id="gr-group" value={group} onChange={event => { const next = event.target.value as Group; setGroup(next); const first = boards.find(item => groupOf(item) === next); if (first) setSelected(first.board_id) }}>
          {groups.map(item => <option key={item.key} value={item.key}>{item.label} ({boards.filter(entry => groupOf(entry) === item.key).length})</option>)}
        </select>
      </div>
      <div className="gr-field gr-field--board">
        <label htmlFor="gr-board">Board</label>
        <select id="gr-board" value={board.board_id} onChange={event => choose(event.target.value)}>
          {options.map(item => <option key={item.board_id} value={item.board_id}>{item.board_id} · {failedLabel(item)}</option>)}
        </select>
      </div>
      <div className="gr-featured" role="group" aria-label="Featured boards">
        {featured.map(item => <button key={item.id} type="button" aria-pressed={item.id === board.board_id} onClick={() => choose(item.id)}><span>{item.label}</span><small>{shortId(item.id)}</small></button>)}
      </div>
    </div>
    <BoardReplay key={board.board_id} regions={board.regions} frames={frames} toneLabels={toneLabels}
      eyebrow={`Greedy rule, no model · board ${shortId(board.board_id)} · ${where}`} title={title}
      description="Two states per step: every unplaced color's legal-cell count, then the placement. Steps after the first off-solution queen continue the same rule and are not scored." />
    {models.length > 0 && <p className="gr-models">Same board, decision models: {models.join('; ')}.</p>}
    <p className="table-note">Computed offline by the frozen rule from the board's region grid, not recorded from a model. No request was sent.</p>
  </div>
}

export function GreedyRule({ ui }: { ui: BookUi }) {
  const { PageHero, LocalToc, Section, Callout } = ui
  const state = useEvidence()
  const data = state.status === 'ready' ? state.data : null
  const status = state.status === 'error' ? <p role="status">The saved greedy-rule evidence could not be loaded. No results are substituted.</p>
    : state.status === 'loading' ? <p role="status">Loading the saved greedy-rule records…</p> : null
  const example = data?.boards.find(board => board.board_id === 'sequence-5-2')
  const exampleStep = example?.steps.find(step => step.tied_regions.length > 1 && step.candidates.length > 1 && !step.after_scored_stop)

  return <>
    <PageHero trail="Decision models / baseline" title="A one-line rule solves more boards than either decision model." deck="On the 192 new boards, a fixed rule with no model and no search solves 80. Jev 1.13 solved 21 and SubQ Snap 19, each with one raw and one filtered attempt per board." action={{ label: 'Watch the rule play', scrollTo: 'gr-replays' }} />
    <div className="reading-layout">
      <LocalToc items={[{ id: 'gr-rule', label: 'The rule' }, { id: 'gr-scoring', label: 'Scoring' }, { id: 'gr-results', label: 'Results' }, { id: 'gr-replays', label: 'Replays' }, { id: 'gr-checks', label: 'Implementation and checks' }]} />
      <main className="reading-column" id="main-content">
        <Section id="gr-rule" title="The rule" label="Greedy rule baseline">
          <p className="lead">The scoreboard's greedy baseline is four steps, applied until every color has a queen or one color has nowhere to go.</p>
          <div className="rule-list">
            <div><span>S1</span><p><strong>List each unplaced color's legal cells.</strong> A cell is legal if it shares no row, column or color with a placed queen and does not touch one, diagonals included.</p></div>
            <div><span>S2</span><p><strong>Take the color with the fewest legal cells.</strong> Ties go to the earlier letter.</p></div>
            <div><span>S3</span><p><strong>Place its first legal cell in reading order.</strong> Top row first, left to right.</p></div>
            <div><span>S4</span><p><strong>Never backtrack.</strong> A placed queen is never moved or removed.</p></div>
          </div>
          <p>This is the "fail-first" or minimum-remaining-values heuristic from constraint search (Haralick and Elliott, 1980, "Increasing tree search efficiency for constraint satisfaction problems", <em>Artificial Intelligence</em> 14(3)), used here with no search at all: one pass, no lookahead, no undo.</p>
          <p>Step S1 is the same conflict filter that builds the decision models' filtered menu. The rule also uses the count of legal cells per color. The decision models are not given that count, but they could compute it from the state they receive.</p>
          {example && exampleStep?.cell && <p><strong>Example.</strong> Board 5-2, step {exampleStep.step}: {legalLeft(exampleStep).replace('Legal cells left: ', 'legal cells left are ')}{tieText(exampleStep)} {exampleStep.region}'s legal cells are {exampleStep.candidates.map(cellText).join(' and ')}; reading order takes {cellText(exampleStep.cell)}.{exampleStep.on_unique_solution === false && ` That cell is off the solution, so the scored run stops with ${plural(example.scored_correct_prefix, 'correct queen')}.`}</p>}
        </Section>

        <Section id="gr-scoring" title="Scoring">
          <p>Every board has exactly one solution. The scorer uses it only to check each new queen, and stops at the first queen off that solution. It never chooses a color or a cell. A board counts as solved only if all its queens are placed without leaving the solution.</p>
          {status ?? (data && <Facts data={data} ui={ui} />)}
        </Section>

        <Section id="gr-results" title="Results">
          {status ?? (data && <Results data={data} ui={ui} />)}
        </Section>

        <Section id="gr-replays" title="Replays">
          <p>Pick a board, or start with a featured one. The highlighted color is the one the rule takes; dashed circles mark its legal cells.</p>
          {status ?? (data && <Replays data={data} />)}
        </Section>

        <Section id="gr-checks" title="Implementation and checks">
          <ul className="limit-list">
            <li><code>scripts/subq/boards.py</code> <code>greedy</code>: the frozen rule (methods critique, section 3). Its result for each panel board is stored in the board corpus and feeds the panel's greedy baseline.</li>
            <li><code>scripts/analysis/build_scoreboard.py</code> <code>greedy</code>: an independent implementation. It fills the scoreboard's greedy baseline for the original nine boards.</li>
            <li><code>scripts/analysis/methods_critique_calculations.py</code>: the first count, on the nine original boards, for the methods critique.</li>
            <li><code>scripts/analysis/greedy_trajectories.py</code> writes the step records used on this page. It checks every scored result against the first two implementations on all 201 boards and fails on any mismatch.</li>
            <li><code>scripts/verify-greedy-trajectories.mjs</code> (<code>npm run greedy:verify</code>) recomputes every step in JavaScript from the region grids alone. It finds each board's solution by search, then checks the totals against the scoreboard and both facts under Scoring.</li>
          </ul>
          <Callout tone="stop" title="A descriptive baseline, not a model.">The rule was not tuned, and its tie-breaks are fixed: earlier letter, then reading order. A different tie-break would solve a different set of boards. It shows what the conflict filter plus one count can do; it is not a ceiling.</Callout>
          <div className="next-actions">
            <a href={evidenceUrl(TRAJECTORIES)} download>Step records (JSON)</a>
            <a href={evidenceUrl('greedy/README.md')} download>Rule reference (docs/greedy-rule.md)</a>
            <a href="#/methods-critique">Methods critique</a>
          </div>
        </Section>
      </main>
    </div>
  </>
}
