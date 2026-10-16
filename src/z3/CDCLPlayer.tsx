import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { ConstraintBoard, type CellMark } from './ConstraintBoard'
import { board, cellName, describeSources, litWords } from './data'
import { Clause, ClauseRef, Lit } from './format'
import { replay, type Assignment, type TraceEvent } from './kernel'
import { Transport, usePlayer } from './Transport'
import type { BookUi } from './ui'

export type ClauseLookup = (id: number) => { lits: number[]; sources: string[] }

export type CDCLPlayerProps = {
  events: TraceEvent[]
  clauseOf: ClauseLookup
  originalCount: number
  ui: BookUi
  bookmarks?: { seq: number; label: string }[]
  gate?: { seq: number; message: ReactNode; revealLabel: string }
  initialSeq?: number
  onSeqChange?: (seq: number) => void
  eventTableCaption: string
  runLabel?: string
}

function describe(event: TraceEvent | undefined, clauseOf: ClauseLookup, originalCount: number, removedCount = 0): { node: ReactNode; words: string } {
  if (!event) return { node: <>Start: the trail is empty and no clause is unit, so the first step must be a decision.</>, words: 'Start: empty trail.' }
  const e = event
  switch (e.kind) {
    case 'decide':
      return { node: <>Event {e.seq} · decide <Lit lit={e.literal as number} /> = true. Level {e.level} opens. A decision has no reason clause: it is a choice.</>, words: `Event ${e.seq}: decide ${cellName(e.literal as number)} true; level ${e.level} opens.` }
    case 'propagate': {
      const c = clauseOf(e.reasonClauseId as number)
      const learned = (e.reasonClauseId as number) >= originalCount
      return { node: <>Event {e.seq} · <Lit lit={e.literal as number} /> {(e.literal as number) > 0 ? 'is true' : 'is false'}, forced by {learned ? 'the learned clause ' : ''}<ClauseRef id={e.reasonClauseId as number} lits={c.lits} sources={c.sources} />.</>, words: `Event ${e.seq}: ${litWords(e.literal as number)}, forced by clause ${e.reasonClauseId}, ${describeSources(c.sources)}.` }
    }
    case 'conflict': {
      const c = clauseOf(e.conflictClauseId as number)
      return { node: <>Event {e.seq} · conflict: <ClauseRef id={e.conflictClauseId as number} lits={c.lits} sources={c.sources} /> has every literal false.</>, words: `Event ${e.seq}: conflict in clause ${e.conflictClauseId}, ${describeSources(c.sources)}.` }
    }
    case 'learn': {
      const c = clauseOf(e.learnedClauseId as number)
      return { node: <>Event {e.seq} · learn #{e.learnedClauseId}: <Clause lits={c.lits} /> after {e.resolution?.length ?? 0} resolution step{e.resolution?.length === 1 ? '' : 's'} from the conflict clause.</>, words: `Event ${e.seq}: learn clause ${e.learnedClauseId} with ${c.lits.length} literals.` }
    }
    case 'backjump':
      return { node: <>Event {e.seq} · backjump to level {e.targetLevel}: {removedCount} assignment{removedCount === 1 ? '' : 's'} above that level are removed. The learned clause is now unit.</>, words: `Event ${e.seq}: backjump to level ${e.targetLevel}; ${removedCount} assignments removed.` }
    case 'sat':
      return { node: <>Event {e.seq} · every variable is assigned and every clause is satisfied: SAT.</>, words: `Event ${e.seq}: satisfiable.` }
    case 'unsat':
      return { node: <>Event {e.seq} · the empty clause □ was learned at level 0: UNSAT.</>, words: `Event ${e.seq}: unsatisfiable.` }
  }
}

export function CDCLPlayer({ events, clauseOf, originalCount, ui, bookmarks = [], gate, initialSeq = -1, onSeqChange, eventTableCaption, runLabel = 'Trace event' }: CDCLPlayerProps) {
  const { DataTable } = ui
  const rootRef = useRef<HTMLDivElement | null>(null)
  const states = useMemo(() => replay(events), [events])
  const [revealed, setRevealed] = useState(false)
  const last = events.length - 1
  const max = gate && !revealed ? gate.seq : last
  const player = usePlayer({ min: -1, max, rootRef, resetKey: events, initial: initialSeq, intervalMs: 900 })
  const seq = player.index
  const [inspect, setInspect] = useState<number | null>(null)
  const [tableOpen, setTableOpen] = useState(false)
  useEffect(() => { onSeqChange?.(seq); setInspect(null) }, [seq]) // eslint-disable-line react-hooks/exhaustive-deps

  const state = seq >= 0 ? states[seq] : { seq: -1, level: 0, trail: [] as Assignment[] }
  const event = seq >= 0 ? events[seq] : undefined
  const previousTrail = seq > 0 ? states[seq - 1].trail : []
  const removed = event?.kind === 'backjump' ? event.removed ?? [] : []
  const text = describe(event, clauseOf, originalCount, removed.length)
  const byVar = new Map(state.trail.map(a => [Math.abs(a.lit), a]))
  const conflictVars = event?.kind === 'conflict' ? new Set(clauseOf(event.conflictClauseId as number).lits.map(Math.abs)) : new Set<number>()
  const learnedVars = event?.kind === 'learn' ? new Set(clauseOf(event.learnedClauseId as number).lits.map(Math.abs)) : new Set<number>()
  const removedVars = new Set(removed.map(Math.abs))
  const fresh = event && (event.kind === 'decide' || event.kind === 'propagate') ? Math.abs(event.literal as number) : null
  const selected = inspect !== null ? byVar.get(inspect) : fresh !== null ? byVar.get(fresh) : undefined

  const mark = (r: number, c: number): CellMark | undefined => {
    const v = (r - 1) * board.size + c
    const a = byVar.get(v)
    const m: CellMark = {}
    if (a) {
      m.value = a.lit > 0
      if (a.reason === null) { m.decision = true; m.badge = `D${a.level}` }
      else if (a.reason >= originalCount) { m.learned = true; m.badge = 'L' }
    }
    if (v === fresh) m.fresh = true
    if (conflictVars.has(v)) m.conflict = true
    if (learnedVars.has(v)) m.highlight = true
    if (removedVars.has(v)) { m.highlight = true; m.note = 'just removed by the backjump' }
    if (selected && Math.abs(selected.lit) === v && v !== fresh) m.path = true
    return Object.keys(m).length ? m : undefined
  }

  const levels = Array.from({ length: state.level + 1 }, (_, level) => state.trail.filter(a => a.level === level))
  const counter = seq < 0 ? 'start' : `${seq}/${last}`
  const valueText = seq < 0 ? 'Start, empty trail' : text.words

  return <div className="z3-player" ref={rootRef}>
    {!!bookmarks.length && <nav className="z3-bookmarks" aria-label="Bookmarks in this run">
      {bookmarks.map(b => <button type="button" key={b.seq} onClick={() => player.setIndex(b.seq)} disabled={b.seq > max} aria-current={seq === b.seq ? 'step' : undefined}>{b.label}</button>)}
    </nav>}
    <div className="z3-figure-body">
      <div className="z3-stage">
        <ConstraintBoard regions={board.regions} label={`Board at ${seq < 0 ? 'the start' : `event ${seq}`}: queens are true, crosses are false, D marks decisions with their level, L marks literals forced by learned clauses.`} mark={mark} />
        <p className="z3-inference" aria-hidden="true">{text.node}</p>
        <p className="sr-only" aria-live="polite" aria-atomic="true">{text.words}</p>
        <div className="z3-transport-dock">
          <Transport index={seq} min={-1} max={max} onChange={player.setIndex} playing={player.playing} onToggle={player.toggle} reducedMotion={player.reduced} label={runLabel} valueText={valueText} counter={counter} />
        </div>
        {gate && !revealed && seq === gate.seq && <div className="z3-gate" role="note">
          <p>{gate.message}</p>
          <button type="button" className="z3-button" onClick={() => setRevealed(true)}>{gate.revealLabel}</button>
        </div>}
      </div>
      <div className="z3-explain">
        <p className="z3-mini-label">Trail by decision level · {state.trail.length} of {board.size * board.size} variables assigned</p>
        <ol className="z3-levels">
          {levels.map((entries, level) => <li key={level} className={`z3-level${level === state.level ? ' is-current' : ''}`}>
            <span className="z3-level-tag">Level {level}</span>
            {entries.length ? <ol className="z3-level-trail">
              {entries.map(a => <li key={a.lit}><button type="button" className={`z3-chip${a.reason === null ? ' is-decision' : ''}${a.reason !== null && a.reason >= originalCount ? ' is-learned' : ''}${selected?.lit === a.lit ? ' is-selected' : ''}${!previousTrail.some(p => p.lit === a.lit) && seq >= 0 ? ' is-new' : ''}`} onClick={() => setInspect(Math.abs(a.lit))} aria-label={`${litWords(a.lit)}, ${a.reason === null ? 'decision' : `reason clause ${a.reason}`}, event ${a.seq}`}>
                {a.reason === null && <span className="z3-chip-d" aria-hidden="true">D</span>}<Lit lit={a.lit} />
              </button></li>)}
            </ol> : <span className="z3-level-empty">no assignments{level === 0 ? ' (no unit clauses yet)' : ''}</span>}
          </li>)}
        </ol>
        <div className="z3-inspector" aria-live="off">
          {selected ? <p><Lit lit={selected.lit} /> = {selected.lit > 0 ? 'true' : 'false'} at level {selected.level}, event {selected.seq}. {selected.reason === null ? <>It is a <strong>decision</strong>: no clause forced it, so a backjump can undo it.</> : <>Reason <ClauseRef id={selected.reason} lits={clauseOf(selected.reason).lits} sources={clauseOf(selected.reason).sources} />{selected.reason >= originalCount ? ' (a learned clause)' : ''}.</>}</p>
            : <p>Select a literal on the trail to see why it is there.</p>}
        </div>
        <details className="z3-disclosure" onToggle={event => setTableOpen((event.target as HTMLDetailsElement).open)}>
          <summary>Written equivalent: all {events.length} events{gate && !revealed ? ` (the last ${last - gate.seq} stay hidden until you reveal them)` : ''}</summary>
          {tableOpen && <DataTable caption={eventTableCaption} headers={['Event', 'Kind', 'Level', 'Literal', 'Clause and detail']} rows={events.filter(e => e.seq <= max).map(e => [
            String(e.seq), e.kind, String(e.level),
            e.literal !== undefined ? <Lit lit={e.literal} /> : '—',
            e.kind === 'propagate' ? <ClauseRef id={e.reasonClauseId as number} lits={clauseOf(e.reasonClauseId as number).lits} sources={clauseOf(e.reasonClauseId as number).sources} />
              : e.kind === 'conflict' ? <ClauseRef id={e.conflictClauseId as number} lits={clauseOf(e.conflictClauseId as number).lits} />
                : e.kind === 'learn' ? <>#{e.learnedClauseId} <Clause lits={clauseOf(e.learnedClauseId as number).lits} /> via {e.resolution?.map(s => `#${s.parentClauseId}`).join(', ')}</>
                  : e.kind === 'backjump' ? `to level ${e.targetLevel}; ${e.removed?.length} removed`
                    : e.kind === 'decide' ? 'decision' : e.kind.toUpperCase(),
          ])} />}
        </details>
      </div>
    </div>
  </div>
}
