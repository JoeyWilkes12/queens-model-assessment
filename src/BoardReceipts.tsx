import { useEffect, useMemo, useState, type ComponentType, type ReactNode } from 'react'
import { BoardReplay, type BoardFrame, type Cell, type FrameTone } from './BoardReplay'
import { greedyFrames, type GreedyBoard } from './GreedyRule'
import { MiniBoard } from './MiniBoard'
import { deriveTrajectoryFrames, type RecordedTrajectory } from './trajectoryBoardData'
import './board-receipts.css'
import './scoreboard.css'

type Ui = {
  PageHero: ComponentType<{ title: string; deck: string; trail: string; action?: { label: string; path?: string; scrollTo?: string } }>
  LocalToc: ComponentType<{ items: { id: string; label: string }[] }>
  Section: ComponentType<{ id?: string; title: string; label?: string; children: ReactNode }>
  Callout: ComponentType<{ tone?: 'note' | 'evidence' | 'caution' | 'stop'; title: string; children: ReactNode }>
  DataTable: ComponentType<{ caption: string; headers: string[]; rows: (string | ReactNode)[][] }>
}
type Stratum = { singleton_status: 'singleton' | 'no_singleton'; tier: 'lower_search' | 'higher_search' }
type Queen = { cell: [number, number]; on_solution: boolean; conflict: boolean }
type Receipt = { id: string; run: string; usd: number | null; basis: string; role: string; outcome?: string }
type Spend = { total_usd: number; requests: number; unknown: number; per_request_usd: number | null }
type Attempt = RecordedTrajectory & { http_calls?: number; forced_decisions?: number; correct_queens_before_failure?: number }
type Family = 'frontier' | 'earlier' | 'decision' | 'baseline'
type System = {
  key: string; name: string; author: string | null; logo: string | null; family: Family; provider: 'OpenRouter' | 'SubQ' | null
  study?: string; route?: string; outcome: string; solved: boolean
  placement?: number[] | null; placement_source?: 'json' | 'extracted' | null; queens?: Queen[] | null; receipt?: string | null
  receipts: Receipt[]; cost: Spend; attempts?: Attempt[]
  greedy?: Pick<GreedyBoard, 'steps' | 'scored_solved' | 'scored_correct_prefix' | 'scored_stop' | 'continued_queens' | 'continued_full'>
}
type BoardReceipt = {
  board: { id: string; size: number; stratum: Stratum; regions: string[][]; solution: number[]; solution_check: string; image: string; profile: { singleton_regions: number; propagation_forced_placements: number; row_solver_nodes_uniqueness: number } }
  systems: System[]
  cost: { total_usd: number; by_provider: Record<string, number>; requests: number; unknown: number }
}
type IndexEntry = { id: string; size: number; stratum: Stratum; regions: string[][]; solved: number; systems: number; solved_by: string[]; cost_usd: number; requests: number; unknown: number }

const evidence = (path: string) => `${import.meta.env.BASE_URL}evidence/${path}`
const FAMILY: Record<Family, string> = { frontier: 'Frontier, 16 Oct', earlier: 'Earlier generation, 17 Oct', decision: 'Decision model', baseline: 'No model' }
const FAMILY_ORDER: Family[] = ['frontier', 'earlier', 'decision', 'baseline']
const OUTCOME: Record<string, string> = {
  strict: 'Solved · strict JSON', format_only: 'Solved · off-format', wrong: 'Wrong placement', truncated: 'Ran out of tokens',
  no_answer: 'Request failed, no answer', not_run: 'Not run', solved_raw: 'Solved · raw menu', solved_filtered: 'Solved · filter only',
  unsolved: 'Not solved', solved: 'Solved',
}
const fillOf = (system: System) => system.family === 'baseline' ? (system.solved ? 'baseline' : null)
  : ['strict', 'solved_raw'].includes(system.outcome) ? 'solid' : ['format_only', 'solved_filtered'].includes(system.outcome) ? 'hatched' : null
const rank = (system: System) => fillOf(system) === 'solid' ? 3 : fillOf(system) ? 2 : system.outcome === 'not_run' ? 0 : 1
const strata = (s: Stratum) => `${s.singleton_status === 'singleton' ? 'Has a single-cell region' : 'No single-cell region'} · ${s.tier === 'lower_search' ? 'lower search' : 'higher search'}`

/** Dollar amounts down to SubQ's fractions of a cent, never rounded to zero. */
export function money(value: number | null | undefined) {
  if (value === null || value === undefined) return '—'
  if (value === 0) return '$0'
  if (value >= 1) return `$${value.toFixed(2)}`
  if (value >= 0.01) return `$${value.toFixed(3)}`
  if (value >= 0.001) return `$${value.toFixed(4)}`
  return `$${value.toPrecision(2)}`
}
const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? '' : 's'}`
const spendText = (cost: Spend) => cost.requests === 0 ? 'No API calls'
  : `${cost.unknown ? '≥ ' : ''}${money(cost.total_usd)} · ${plural(cost.requests, 'request')}${cost.requests > 1 && cost.per_request_usd !== null ? ` · ${money(cost.per_request_usd)} each` : ''}`

function useJson<T>(path: string | null) {
  const [state, setState] = useState<{ path: string | null; data: T | null; error: boolean }>({ path: null, data: null, error: false })
  useEffect(() => {
    if (!path) return
    const controller = new AbortController()
    fetch(evidence(path), { signal: controller.signal })
      .then(response => { if (!response.ok) throw new Error(path); return response.json() as Promise<T> })
      .then(data => setState({ path, data, error: false }))
      .catch(() => { if (!controller.signal.aborted) setState({ path, data: null, error: true }) })
    return () => controller.abort()
  }, [path])
  return state.path === path ? state : { path, data: null, error: false }
}

export function BoardReceipts({ ui, boardId }: { ui: Ui; boardId?: string }) {
  const index = useJson<{ boards: IndexEntry[] }>('board-receipts/index.json')
  if (index.error) return <p role="status">The saved board receipts could not be loaded. No results are substituted.</p>
  if (!index.data) return <p role="status">Loading the saved board receipts…</p>
  const boards = index.data.boards
  if (boardId) {
    const position = boards.findIndex(board => board.id === boardId)
    if (position < 0) return <ui.Callout tone="caution" title="No receipt for this board.">Board receipts cover the 36 boards of the image panel. <a href="#/board-receipts">See all board receipts</a>.</ui.Callout>
    return <BoardPage ui={ui} entry={boards[position]} previous={boards[position - 1]} next={boards[position + 1]} />
  }
  return <BoardIndex ui={ui} boards={boards} />
}

function BoardIndex({ ui, boards }: { ui: Ui; boards: IndexEntry[] }) {
  const { PageHero, LocalToc, Section } = ui
  const sizes = [9, 7, 5]
  const total = boards.reduce((sum, board) => sum + board.cost_usd, 0)
  return <>
    <PageHero trail="Receipts / boards" title="One receipt per board." deck={`The 36 boards that every system attempted: twelve language models from an image, Jev and SubQ Snap one decision at a time, and the greedy rule. Each page shows who solved the board, what each wrote, the replays, and what assessing it cost: ${money(total)} in all.`} />
    <div className="reading-layout">
      <LocalToc items={sizes.map(size => ({ id: `boards-${size}`, label: `${size}×${size} boards` }))} />
      <main className="reading-column" id="main-content">
        {sizes.map(size => {
          const mine = boards.filter(board => board.size === size)
          return <Section key={size} id={`boards-${size}`} title={`${size}×${size} boards`} label={`${mine.length} boards · ${money(mine.reduce((sum, board) => sum + board.cost_usd, 0))}`}>
            <ul className="br-index">
              {mine.map(board => <li key={board.id}>
                <a className="br-card" href={`#/board-receipts/${board.id}`}>
                  <MiniBoard regions={board.regions} label={`${board.id} regions`} size="thumb" />
                  <span className="br-card-text">
                    <strong>{board.id}</strong>
                    <span>{board.solved} of {board.systems} systems solved</span>
                    <span>{board.unknown ? '≥ ' : ''}{money(board.cost_usd)} · {plural(board.requests, 'request')}</span>
                    <span className="br-card-stratum">{strata(board.stratum)}</span>
                  </span>
                </a>
              </li>)}
            </ul>
          </Section>
        })}
      </main>
    </div>
  </>
}

function OutcomeCost({ systems, sort }: { systems: System[]; sort: 'outcome' | 'cost' }) {
  const max = Math.max(0.000001, ...systems.map(system => system.cost.total_usd))
  const ordered = [...systems].sort((a, b) => sort === 'cost'
    ? b.cost.total_usd - a.cost.total_usd || a.name.localeCompare(b.name)
    : rank(b) - rank(a) || FAMILY_ORDER.indexOf(a.family) - FAMILY_ORDER.indexOf(b.family) || a.cost.total_usd - b.cost.total_usd)
  return <div className="br-chart" role="list" aria-label="Outcome and cost on this board, by system">
    {ordered.map(system => {
      const fill = fillOf(system)
      const outcome = OUTCOME[system.outcome] ?? system.outcome
      const cost = spendText(system.cost)
      return <div key={system.key} role="listitem" className={`br-row br-row--${system.family}`} aria-label={`${system.name}, ${FAMILY[system.family]}: ${outcome}. Cost on this board: ${cost}.`}>
        <span className="br-who">
          {system.logo ? <span className="sb-logo"><img src={`${import.meta.env.BASE_URL}${system.logo}`} alt="" width={20} height={20} loading="lazy" /></span> : <span className="sb-logo sb-logo--none" aria-hidden="true">∅</span>}
          <span><span className="br-name">{system.name}</span><span className="br-family">{FAMILY[system.family]}{system.provider ? ` · ${system.provider}` : ''}</span></span>
        </span>
        <span className="br-outcome" aria-hidden="true">
          <span className={`br-outcome-track${system.outcome === 'not_run' ? ' is-not-run' : ''}`}>{fill && <span className={`sb-fill ${fill === 'baseline' ? 'br-fill--baseline' : `sb-fill--${fill}`}`} />}</span>
          <span className="br-outcome-label">{outcome}</span>
        </span>
        <span className="br-cost" aria-hidden="true">
          <span className="sb-cost-track">{system.cost.total_usd > 0 && <span className="sb-cost-fill" style={{ width: `${Math.max(2, system.cost.total_usd / max * 100)}%` }} />}</span>
          <span className="br-cost-label">{cost}</span>
        </span>
      </div>
    })}
  </div>
}

function answerFrames(data: BoardReceipt): BoardFrame[] {
  const solution: Cell[] = data.board.solution.map((column, row) => [row + 1, column])
  const writers = data.systems.filter(system => system.family === 'frontier' || system.family === 'earlier')
  const source = 'Written answer from the response, graded by the deterministic checker'
  const frames: BoardFrame[] = [{ id: 'empty', label: 'The board, as text and image', queens: [], note: `${writers.length} language models each received this board as one image and wrote a complete placement in one reply. Each state below is one model's answer.`, sourceLabel: 'Board corpus', tone: 'start' }]
  for (const system of writers) {
    const queens = (system.queens ?? []).map(queen => queen.cell as Cell)
    const wrong = (system.queens ?? []).filter(queen => !queen.on_solution || queen.conflict).map(queen => queen.cell as Cell)
    const outcome = OUTCOME[system.outcome] ?? system.outcome
    const note = queens.length
      ? `${outcome}. ${system.solved ? 'Every queen is on the unique solution.' : `${plural(wrong.length, 'queen')} off the solution or breaking a rule.`}${system.placement_source === 'extracted' ? ' The placement was read from the text around the answer.' : ''} Cost: ${spendText(system.cost)}.`
      : `${outcome}: no placement could be read. Cost: ${spendText(system.cost)}.`
    frames.push({ id: system.key, label: `${system.name}: ${outcome}`, queens, invalidCells: wrong.length ? wrong : undefined, note, sourceLabel: source,
      receiptLinks: system.receipt ? [{ label: 'Receipt', id: system.receipt }] : undefined, tone: queens.length ? (system.solved ? 'pass' : 'fail') : 'unknown' })
  }
  frames.push({ id: 'solution', label: 'The unique solution', queens: solution, note: `Recomputed from the region grid by exhaustive search; ${data.board.solution_check}.`, sourceLabel: 'Board corpus', tone: 'solved' })
  return frames
}

type ReplayOption = { key: string; label: string; regions: string[][]; frames: BoardFrame[]; title: string; eyebrow: string; toneLabels?: Partial<Record<FrameTone, string>> }

function replayOptions(data: BoardReceipt): ReplayOption[] {
  const { regions, id, size } = data.board
  const options: ReplayOption[] = [{ key: 'answers', label: 'Written answers, model by model', regions, frames: answerFrames(data), eyebrow: `${id} · one shot from the image`,
    title: `${data.systems.filter(s => (s.family === 'frontier' || s.family === 'earlier') && s.solved).length} of 12 language models wrote the solution`,
    toneLabels: { pass: 'Correct placement', fail: 'Not the solution', unknown: 'No placement', solved: 'Unique solution', start: 'Board' } }]
  for (const system of data.systems.filter(s => s.family === 'decision')) {
    for (const attempt of system.attempts ?? []) {
      try {
        const menu = attempt.mode === 'local' ? 'filtered menu' : 'raw menu'
        options.push({ key: `${system.key}-${attempt.mode}`, label: `${system.name} · ${menu}`, regions, frames: deriveTrajectoryFrames(attempt, regions, system.study),
          eyebrow: `${system.name} · ${id} · ${menu}`, title: attempt.success ? `Solved in ${plural(attempt.http_calls ?? 0, 'model call')}` : `${plural(attempt.correct_queens_before_failure ?? 0, 'correct queen')}, then ${attempt.stop_reason.replace(/_/g, ' ')}` })
      } catch { /* a trace that cannot be drawn is left out rather than guessed */ }
    }
  }
  const greedy = data.systems.find(system => system.family === 'baseline')?.greedy
  if (greedy) options.push({ key: 'greedy', label: 'Greedy rule (no model)', regions, eyebrow: `Greedy rule · ${id}`, title: greedy.scored_solved ? 'Solved by the rule' : `${plural(greedy.scored_correct_prefix, 'correct queen')}, then off the solution`,
    frames: greedyFrames({ board_id: id, size, source: 'panel-192', regions, ...greedy }),
    toneLabels: { choice: 'Choice: first in reading order', forced: 'Forced: one legal cell', pass: 'On the unique solution', fail: 'Stopped', unknown: 'Not scored' } })
  return options
}

function BoardPage({ ui, entry, previous, next }: { ui: Ui; entry: IndexEntry; previous?: IndexEntry; next?: IndexEntry }) {
  const { PageHero, LocalToc, Section, DataTable, Callout } = ui
  const state = useJson<BoardReceipt>(`board-receipts/${entry.id}.json`)
  const [sort, setSort] = useState<'outcome' | 'cost'>('outcome')
  const [showSolution, setShowSolution] = useState(false)
  const [replay, setReplay] = useState('answers')
  const options = useMemo(() => state.data ? replayOptions(state.data) : [], [state.data])
  if (state.error) return <p role="status">This board receipt could not be loaded. No results are substituted.</p>
  if (!state.data) return <p role="status">Loading the board receipt…</p>
  const data = state.data
  const { board, systems } = data
  const current = options.find(option => option.key === replay) ?? options[0]
  const solved = systems.filter(system => system.solved).length
  const writers = systems.filter(system => system.family === 'frontier' || system.family === 'earlier')
    .sort((a, b) => FAMILY_ORDER.indexOf(a.family) - FAMILY_ORDER.indexOf(b.family) || Number(b.solved) - Number(a.solved) || a.name.localeCompare(b.name))
  const solutionQueens = board.solution.map((column, row) => ({ cell: [row + 1, column] as const }))
  const providerText = Object.entries(data.cost.by_provider).map(([name, usd]) => `${name} ${money(usd)}`).join(' · ')
  const link = (receipt: Receipt, label: string) => <a key={receipt.id} href={`#/evidence-atlas/${receipt.id}`} title={`${receipt.run}: ${money(receipt.usd)} (${receipt.basis})`}>{label}</a>
  const receiptLinks = (system: System) => {
    if (!system.receipts.length) return '—'
    if (system.family !== 'decision') return <span className="br-links">{system.receipts.map(r => link(r, r.role === 'graded' ? 'graded' : r.role))}</span>
    return <span className="br-links">{(['raw', 'filtered'] as const).map(role => {
      const mine = system.receipts.filter(r => r.role === role)
      return mine.length ? <span key={role}>{role}: {mine.map((r, i) => link(r, String(i + 1)))}</span> : null
    })}</span>
  }
  return <>
    <PageHero trail={`Receipts / boards / ${board.size}×${board.size}`} title={`Board ${board.id}`} deck={`${solved} of ${systems.length} systems solved this ${board.size}×${board.size} board. Assessing it cost ${data.cost.unknown ? 'at least ' : ''}${money(data.cost.total_usd)} over ${plural(data.cost.requests, 'API request')}.`} />
    <div className="reading-layout">
      <LocalToc items={[{ id: 'board', label: 'The board' }, { id: 'outcomes', label: 'Outcome and cost' }, { id: 'answers', label: 'Written answers' }, { id: 'replays', label: 'Replays' }, { id: 'receipts', label: 'Receipts' }]} />
      <main className="reading-column sb-vars" id="main-content">
        <nav className="br-pager" aria-label="Board receipts">
          {previous ? <a href={`#/board-receipts/${previous.id}`}>← {previous.id}</a> : <span />}
          <a href="#/board-receipts">All 36 boards</a>
          {next ? <a href={`#/board-receipts/${next.id}`}>{next.id} →</a> : <span />}
        </nav>
        <Section id="board" title="The board">
          <div className="br-board">
            <figure>
              <MiniBoard regions={board.regions} queens={showSolution ? solutionQueens : []} label={`${board.id}${showSolution ? ' with its unique solution' : ''}`} size="large" />
              <figcaption><label className="sb-toggle"><input type="checkbox" checked={showSolution} onChange={event => setShowSolution(event.target.checked)} /> Show the unique solution</label></figcaption>
            </figure>
            <figure>
              <img src={evidence(board.image)} alt={`The image the language models received for ${board.id}`} width={768} height={768} loading="lazy" />
              <figcaption>The image the language models received</figcaption>
            </figure>
          </div>
          <ul className="br-facts">
            <li><strong>Stratum:</strong> {strata(board.stratum)}; {plural(board.profile.singleton_regions, 'single-cell region')}, {plural(board.profile.propagation_forced_placements, 'queen')} forced by propagation alone.</li>
            <li><strong>Solution:</strong> unique. It is not stored in the corpus; it was {board.solution_check}.</li>
            <li><strong>Cost on this board:</strong> {providerText}, {plural(data.cost.requests, 'request')}.</li>
          </ul>
        </Section>
        <Section id="outcomes" title="Who solved it, and what it cost">
          <div className="sb-controls">
            <div className="sb-segment" role="group" aria-label="Sort order">
              <button type="button" aria-pressed={sort === 'outcome'} onClick={() => setSort('outcome')}>Sort: outcome</button>
              <button type="button" aria-pressed={sort === 'cost'} onClick={() => setSort('cost')}>Cost, highest first</button>
            </div>
          </div>
          <div className="sb-legend">
            <span><span className="sb-swatch sb-swatch--solid" aria-hidden="true" />Solved: strict JSON, or from the raw menu</span>
            <span><span className="sb-swatch sb-swatch--hatched" aria-hidden="true" />Solved: off-format, or only with the conflict filter</span>
            <span><span className="sb-swatch sb-swatch--baseline" aria-hidden="true" />Solved by the no-model rule</span>
            <span><span className="sb-swatch sb-swatch--cost" aria-hidden="true" />API cost on this board (own scale)</span>
          </div>
          <OutcomeCost systems={systems} sort={sort} />
          <p className="table-note">Language models had one request from the image, graded as written. Jev and SubQ each had one raw and one conflict-filtered attempt, one decision per call; single-option menus were forced and cost nothing. Costs are from the receipts: OpenRouter's reported cost, GPT-5.6 Sol's and Gemini 2.5's batch items at the batch price, and SubQ's input tokens at its published $0.05 per million.</p>
        </Section>
        <Section id="answers" title="Written answers">
          <ul className="br-gallery">
            {writers.map(system => <li key={system.key} className={system.solved ? 'is-solved' : ''}>
              {system.queens ? <MiniBoard regions={board.regions} queens={system.queens.map(q => ({ cell: q.cell, onSolution: q.on_solution, conflict: q.conflict }))} label={`${system.name}'s placement on ${board.id}`} />
                : <div className="br-empty" role="img" aria-label={`${system.name}: no placement`}>No placement</div>}
              <span className="br-gallery-name">{system.name}</span>
              <span className="br-gallery-outcome">{OUTCOME[system.outcome] ?? system.outcome}</span>
              <span className="br-gallery-cost">{money(system.cost.total_usd)}{system.receipt && <> · <a href={`#/evidence-atlas/${system.receipt}`}>receipt</a></>}</span>
            </li>)}
          </ul>
          <p className="table-note">A ring marks a queen that is not on the unique solution; an X marks a queen that breaks a rule (shared column or region, or touching). Off-format answers were read from the one placement object in the reply.</p>
        </Section>
        <Section id="replays" title="Replays">
          <label className="filter-label" htmlFor={`br-replay-${board.id}`}>Replay</label>
          <select id={`br-replay-${board.id}`} className="trajectory-select" value={current?.key ?? ''} onChange={event => setReplay(event.target.value)}>
            {options.map(option => <option key={option.key} value={option.key}>{option.label}</option>)}
          </select>
          {current ? <BoardReplay key={`${board.id}-${current.key}`} regions={current.regions} frames={current.frames} eyebrow={current.eyebrow} title={current.title} toneLabels={current.toneLabels}
            description="Recorded states only. Receipt links open the exact request and response." />
            : <Callout tone="caution" title="No replay could be drawn.">The recorded traces for this board could not be drawn.</Callout>}
        </Section>
        <Section id="receipts" title="Receipts and cost">
          <DataTable caption={`Every API request on ${board.id}, by system`} headers={['System', 'Outcome', 'Requests', 'Cost on this board', 'Per request', 'Receipts']}
            rows={[...systems].sort((a, b) => FAMILY_ORDER.indexOf(a.family) - FAMILY_ORDER.indexOf(b.family) || a.name.localeCompare(b.name)).map(system => [
              system.name, OUTCOME[system.outcome] ?? system.outcome, String(system.cost.requests),
              system.cost.requests ? `${system.cost.unknown ? '≥ ' : ''}${money(system.cost.total_usd)}` : '$0', system.cost.per_request_usd !== null ? money(system.cost.per_request_usd) : '—', receiptLinks(system)])} />
          <p className="table-note"><a href={evidence(`board-receipts/${board.id}.json`)} download>Board receipt (JSON)</a> · built by <code>scripts/analysis/build_board_receipts.py</code> from the published receipts.</p>
        </Section>
      </main>
    </div>
  </>
}
