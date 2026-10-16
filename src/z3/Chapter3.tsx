import { useMemo, useRef, useState, type ReactNode } from 'react'
import { ConstraintBoard, type CellMark } from './ConstraintBoard'
import { board, cellName, describeSources, litWords, varOf, type PropagationRun, type TeachingData } from './data'
import { CheckYourself, Clause, ClauseRef, EngineTag, Figure, Lede, Lit, Proof, ReadSource, Statement, Term, Unavailable } from './format'
import type { Trace } from './kernel'
import { Transport, usePlayer } from './Transport'
import type { ChapterProps } from './ui'

type ClauseInfo = { lits: number[]; sources: string[] }

/** Two-watched-literal bookkeeping for one clause, replayed over the run's assignments. */
function watchReplay(lits: number[], assigned: number[]) {
  const value = new Map<number, boolean>()
  const val = (l: number) => value.has(Math.abs(l)) ? value.get(Math.abs(l)) === l > 0 : null
  let watches: [number, number] = [0, Math.min(1, lits.length - 1)]
  let note = `Watches start on the first two literals, ${cellName(lits[0])} and ${cellName(lits[Math.min(1, lits.length - 1)])}.`
  for (const lit of assigned) {
    value.set(Math.abs(lit), lit > 0)
    const position = lits.findIndex(l => Math.abs(l) === Math.abs(lit))
    if (position < 0) continue
    if (lits.some(l => val(l) === true)) { note = 'A literal is true, so the clause is satisfied; the watches can stay where they are.'; continue }
    const w = watches.indexOf(position)
    if (w < 0) { note = `${cellName(lit)} became false, but it is not watched, so this clause is not even visited.`; continue }
    const replacement = lits.findIndex((l, i) => !watches.includes(i) && val(l) !== false)
    if (replacement >= 0) {
      note = `The watched literal on ${cellName(lit)} became false; the watch moves to ${cellName(lits[replacement])}, which is not false.`
      watches = (w === 0 ? [replacement, watches[1]] : [watches[0], replacement]) as [number, number]
    } else {
      const other = lits[watches[1 - w]]
      note = val(other) === null ? `No replacement exists, so the other watch, ${cellName(other)}, is the unit literal and must be made true.` : 'No replacement exists and the other watch is false: conflict.'
    }
  }
  return { watches, note, val }
}

function PropagationPlayer({ teaching, clauses }: { teaching: TeachingData; clauses: Trace['clauses'] }) {
  const rootRef = useRef<HTMLElement | null>(null)
  const [cell, setCell] = useState<[number, number]>([1, 3])
  const [showWatches, setShowWatches] = useState(false)
  const run = teaching.propagation.runs.find(r => r.cell[0] === cell[0] && r.cell[1] === cell[1]) as PropagationRun
  const S = run.steps.length
  const player = usePlayer({ max: S + 1, rootRef, resetKey: `${cell}` })
  const k = player.index
  const info = (id: number): ClauseInfo => clauses[id]
  const shown = run.steps.slice(0, Math.min(k, S))
  const assignedValue = new Map<number, boolean>([[run.decision, true], ...shown.map(s => [Math.abs(s.literal), s.literal > 0] as [number, boolean])])
  const conflictCells = k === S + 1 && run.status === 'conflict' ? new Set(info(run.conflictClauseId as number).lits.map(Math.abs)) : new Set<number>()
  const fresh = k >= 1 && k <= S ? Math.abs(run.steps[k - 1].literal) : null

  const alo = useMemo(() => {
    const final = new Map<number, boolean>([[run.decision, true], ...run.steps.map(s => [Math.abs(s.literal), s.literal > 0] as [number, boolean])])
    return clauses.slice(0, 513).filter(c => c.lits.length > 2 && c.lits.every(l => l > 0)).map(c => ({ ...c, falsified: c.lits.filter(l => final.get(l) === false).length, satisfied: c.lits.some(l => final.get(l) === true) }))
      .filter(c => c.falsified >= 2).sort((a, b) => Number(a.satisfied) - Number(b.satisfied) || b.falsified / b.lits.length - a.falsified / a.lits.length || a.id - b.id)
  }, [clauses, run])
  const [watchId, setWatchId] = useState<number | null>(null)
  const watchClause = alo.find(c => c.id === watchId) ?? alo[0]
  const watch = watchClause ? watchReplay(watchClause.lits, [run.decision, ...shown.map(s => s.literal)]) : null

  const mark = (r: number, c: number): CellMark | undefined => {
    const v = varOf(r, c)
    const m: CellMark = {}
    if (v === run.decision) Object.assign(m, { value: true, decision: true, badge: 'D1' })
    else if (assignedValue.has(v)) m.value = assignedValue.get(v)
    if (v === fresh) m.fresh = true
    if (conflictCells.has(v)) m.conflict = true
    if (showWatches && watchClause?.lits.includes(v)) m.highlight = true
    return Object.keys(m).length ? m : undefined
  }

  let sentence: ReactNode, spoken: string
  if (k === 0) {
    sentence = <>Decision: <Lit lit={run.decision} /> = true opens level 1. Nothing is forced yet.</>
    spoken = `Decision: ${cellName(run.decision)} true. Nothing forced yet.`
  } else if (k <= S) {
    const step = run.steps[k - 1], reason = info(step.reasonClauseId)
    sentence = <>Step {k} of {S}: <Lit lit={Math.abs(step.literal)} /> {step.literal > 0 ? 'becomes true' : 'becomes false'}. Every other literal of <ClauseRef id={step.reasonClauseId} lits={reason.lits} sources={reason.sources} /> is false.</>
    spoken = `Step ${k} of ${S}: ${litWords(step.literal)}, by clause ${step.reasonClauseId}, ${describeSources(reason.sources)}.`
  } else if (run.status === 'conflict') {
    const c = info(run.conflictClauseId as number)
    sentence = <>Conflict: <ClauseRef id={run.conflictClauseId as number} lits={c.lits} sources={c.sources} /> has no true or open literal left. The decision <Lit lit={run.decision} /> cannot be part of any solution.</>
    spoken = `Conflict: clause ${run.conflictClauseId}, ${describeSources(c.sources)}, is false. ${cellName(run.decision)} cannot be in a solution.`
  } else {
    sentence = <>Propagation paused; undecided cells remain. {run.unassignedAfter} cells are still open, and no clause is unit.</>
    spoken = `Propagation paused. ${run.unassignedAfter} cells remain open; no clause is unit.`
  }

  return <Figure label="Figure 3.1 · Manipulation" title="Unit propagation from your decision" tag={<EngineTag kind="reference" note="precomputed unit-propagation run" />} className="z3-figure--player">
    <div ref={rootRef as React.RefObject<HTMLDivElement>} className="z3-figure-body">
      <div className="z3-stage">
        <ConstraintBoard regions={board.regions} interactive selectedCell={cell} onSelect={(r, c) => setCell([r, c])} label="Choose the decision cell. The board shows the propagation state at the current step." mark={mark} />
        <p className="z3-inference" aria-hidden="true">{sentence}</p>
        <p className="sr-only" aria-live="polite" aria-atomic="true">{spoken}</p>
        <div className="z3-transport-dock">
          <Transport index={k} max={S + 1} onChange={player.setIndex} playing={player.playing} onToggle={player.toggle} reducedMotion={player.reduced} label="Propagation step" valueText={spoken} counter={k <= S ? `${k}/${S}` : 'end'} />
        </div>
      </div>
      <div className="z3-explain">
        <dl className="z3-facts">
          <div><dt>Decision</dt><dd><Lit lit={run.decision} /> (r{cell[0]}c{cell[1]}) · tap another cell to change it</dd></div>
          <div><dt>Forced literals</dt><dd>{S} by full clause scans in clause order</dd></div>
          <div><dt>Outcome</dt><dd>{run.status === 'conflict' ? `conflict in clause #${run.conflictClauseId}` : `fixed point, ${run.unassignedAfter} cells open`}</dd></div>
        </dl>
        <label className="z3-toggle"><input type="checkbox" checked={showWatches} onChange={event => setShowWatches(event.target.checked)} /> Show two watched literals for one clause</label>
        {showWatches && watchClause && watch && <div className="z3-watch">
          <label className="z3-select">Clause <select value={watchClause.id} onChange={event => setWatchId(Number(event.target.value))}>{alo.map(c => <option key={c.id} value={c.id}>#{c.id} · {describeSources(c.sources)}</option>)}</select></label>
          <ol className="z3-ribbon" aria-label={`Clause ${watchClause.id} literal by literal`}>
            {watchClause.lits.map((l, i) => {
              const v = watch.val(l)
              const watched = watch.watches.includes(i)
              return <li key={l} className={`${v === false ? 'is-false' : v === true ? 'is-true' : ''}${watched ? ' is-watched' : ''}`}>
                {watched && <span className="z3-watch-mark">watch</span>}
                <Lit lit={l} /><span className="z3-ribbon-state">{v === false ? '× false' : v === true ? 'true' : 'open'}</span>
              </li>
            })}
          </ol>
          <p className="z3-watch-note">{watch.note}</p>
          <p className="z3-fineprint">Overlay only. The reference kernel scans every clause; watches are how fast solvers avoid that scan. They implement the same inference rule.</p>
        </div>}
        <details className="z3-disclosure">
          <summary>Written equivalent: every step of this run</summary>
          <ol className="z3-steps">
            <li>Decide <Lit lit={run.decision} /> = true (level 1).</li>
            {run.steps.map((s, i) => <li key={i}><Lit lit={Math.abs(s.literal)} /> {s.literal > 0 ? 'true' : 'false'} — <ClauseRef id={s.reasonClauseId} lits={info(s.reasonClauseId).lits} sources={info(s.reasonClauseId).sources} /></li>)}
            <li>{run.status === 'conflict' ? <>Conflict in <ClauseRef id={run.conflictClauseId as number} lits={info(run.conflictClauseId as number).lits} sources={info(run.conflictClauseId as number).sources} />.</> : <>Fixed point: no clause is unit; {run.unassignedAfter} cells open.</>}</li>
          </ol>
        </details>
      </div>
    </div>
  </Figure>
}

function Inset5({ inset }: { inset: TeachingData['propagation']['inset5'] }) {
  const value = new Map(inset.steps.map(s => [Math.abs(s.literal), s.literal > 0]))
  return <Figure label="Figure 3.2 · Inset, 5×5 board" title="A singleton region forces a queen with no decision" tag={<EngineTag kind="reference" note="5×5 board, level 0" />} className="z3-figure--inset">
    <div className="z3-figure-body">
      <div className="z3-stage z3-stage--small">
        <ConstraintBoard compact regions={inset.regions} label="5 by 5 board after level-0 propagation" mark={(r, c) => { const v = (r - 1) * 5 + c; return value.has(v) ? { value: value.get(v), badge: v === 5 ? 'L0' : undefined } : undefined }} />
      </div>
      <div className="z3-explain">
        <p>On the book’s 5×5 board region C is the single cell r1c5, so its at-least-one clause is the unit clause (q<sub>15</sub>). Propagation at level 0 sets it true before any decision, then excludes {inset.steps.length - 1} more cells.</p>
        <ol className="z3-steps">{inset.steps.map((s, i) => <li key={i}><Lit lit={Math.abs(s.literal)} n={5} /> {s.literal > 0 ? 'true' : 'false'} — #{s.reasonClauseId} <Clause lits={inset.clauses[String(s.reasonClauseId)].lits} n={5} /> · {describeSources(inset.clauses[String(s.reasonClauseId)].sources)}</li>)}</ol>
        <p className="z3-fineprint">This inset uses the 5×5 board. Every other figure uses the 7×7 board.</p>
      </div>
    </div>
  </Figure>
}

export function Chapter3({ ui, data }: ChapterProps) {
  const { Section } = ui
  const t = data?.teaching
  const failed = t ? t.propagation.runs.filter(r => r.status === 'conflict').length : null
  const q12 = t?.propagation.runs.find(r => r.cell[0] === 1 && r.cell[1] === 2)
  const q31Step = q12 ? q12.steps.findIndex(s => s.literal === varOf(3, 1)) + 1 : 0
  return <Section id="z3-propagation" label="Chapter 3" title="Propagation reaches a fixed point">
    <Lede>Some consequences require no guess. Once all but one literal in a clause are false, the remaining literal must be true.</Lede>
    <p>Write a partial assignment as a set M of literals with no complementary pair: ¬q<sub>14</sub> ∈ M means “r1c4 is known to be empty”. A clause is <em>satisfied</em> by M if it contains a literal of M, <em>falsified</em> if M contains the complement of each of its literals, and a <Term id="unit">unit clause</Term> if it is not satisfied and exactly one of its literals is still open.</p>
    {t && data ? <PropagationPlayer teaching={t} clauses={data.existence.clauses} /> : <Unavailable what="The propagation player" />}
    <h3>The derivation</h3>
    <Statement kind="Rule" label="3.1 · unit propagation">
      <p>If a clause C ∈ F is unit under M with open literal ℓ, replace M by M ∪ {"{"}ℓ{"}"} and record C as the <em>reason</em> for ℓ. If some clause of F is falsified, report a conflict.</p>
    </Statement>
    <Statement kind="Theorem" label="3.2">
      <p>Let U<sub>F</sub>(M) be the result of applying Rule 3.1 until no clause is unit, or ⊤ if a conflict appears. Then U<sub>F</sub> terminates and is a closure operator on consistent partial assignments ordered by inclusion, with a greatest conflict element ⊤ and U<sub>F</sub>(⊤) = ⊤: extensive (M ⊆ U<sub>F</sub>(M)), monotone (M ⊆ M′ ⇒ U<sub>F</sub>(M) ⊆ U<sub>F</sub>(M′)) and idempotent. It is sound: F ∧ M ⊨ ℓ for every added ℓ.</p>
    </Statement>
    <Proof>Each propagation assigns a previously unassigned variable, so at most 49 such steps occur. Soundness follows because all other literals of its reason clause are false, so every model extending the current assignment must satisfy the propagated literal. For monotonicity, compare M ⊆ M′. A literal forced under M is either already true under M′, remains unit there, or is false there and makes its reason clause conflicting. Applying this observation inductively shows that a nonconflicting saturated extension contains every literal derived from any smaller starting assignment; a conflicting derivation makes every saturated extension conflicting. In particular, two saturated runs from the same input contain each other, unless both return ⊤. This proves order independence and monotonicity. Extensivity follows because assignments are only added; idempotence follows because a saturated result has no further propagation, and ⊤ remains ⊤. Reasons and the first conflict clause may depend on queue order.</Proof>
    <p>Propagation is weaker than logical consequence. The pairwise CNF has no unit clause, so from the empty assignment nothing at all is forced, yet only seven cells can hold a queen. If you instead decide a cell, the closure often explodes: {failed ?? '…'} of the 49 single-cell decisions end in a conflict by propagation alone. Chapter 7 gives a hypothesis from which propagation derives nothing although six cells are provably impossible.</p>
    <Statement kind="Definition" label="3.3 · two watched literals">
      <p>For each clause with at least two literals, keep two watched positions. When a watched literal becomes false, first check whether the other watch satisfies the clause. Otherwise seek an unwatched nonfalse literal and move the false watch there. If none exists, the other watch is open (propagate it) or false (report conflict). Unit clauses are handled separately. A watched position may therefore hold a false literal in a satisfied, unit or conflicting clause. Assignments that do not falsify a watch need not trigger a visit to that clause.</p>
    </Statement>
    <p>Watches change the cost, not the mathematics: they detect exactly the unit and falsified clauses of Rule 3.1. Turn on the overlay above to see the watches move on one clause while the reference kernel, which scans every clause, records the same steps.</p>
    <Inset5Wrapper inset={t?.propagation.inset5} />
    <CheckYourself question={<>In the five-literal clause (q<sub>11</sub> ∨ q<sub>21</sub> ∨ q<sub>22</sub> ∨ q<sub>23</sub> ∨ q<sub>31</sub>), region A’s at-least-one clause, suppose the first four literals are false and q₃₁ is unassigned. Which literal is unit, and what must happen?</>}>
      <p>q<sub>31</sub> is the only open literal, so the clause is unit and q<sub>31</sub> must be set true, with this clause as its reason. Choose r1c2 in the player above: q<sub>12</sub> excludes q<sub>11</sub> (row), q<sub>22</sub> (column), q<sub>21</sub> and q<sub>23</sub> (touching), and {q31Step ? <>step {q31Step} sets q<sub>31</sub> true</> : <>a later step sets q<sub>31</sub> true</>} for exactly this reason.</p>
    </CheckYourself>
    <ReadSource items={[
      { id: 'P6', locator: '§2', why: 'Boolean constraint propagation with two watched literals, as engineered in Chaff.' },
      { id: 'P7', locator: '§2', why: 'propagation as a transition rule on abstract solver states.' },
      { id: 'P8', locator: '§4.5.1', why: 'lazy data structures for unit propagation in modern CDCL solvers.' },
    ]} />
  </Section>
}

function Inset5Wrapper({ inset }: { inset?: TeachingData['propagation']['inset5'] }) {
  return inset ? <Inset5 inset={inset} /> : null
}

