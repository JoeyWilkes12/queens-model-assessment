import { useMemo, useRef, useState } from 'react'
import { ConstraintBoard, type CellMark } from './ConstraintBoard'
import { board, describeSources, varOf } from './data'
import { CheckYourself, Clause, ClauseRef, EngineTag, Figure, Formula, Lede, Lit, Proof, ReadSource, Statement, Unavailable } from './format'
import { replay, type Trace } from './kernel'
import { Transport, usePlayer } from './Transport'
import type { ChapterProps } from './ui'

function ResolutionFigure({ trace }: { trace: Trace }) {
  const rootRef = useRef<HTMLElement | null>(null)
  const learns = trace.events.filter(e => e.kind === 'learn')
  const [learnSeq, setLearnSeq] = useState(127)
  const learn = learns.find(e => e.seq === learnSeq) ?? learns[0]
  const steps = learn.resolution ?? []
  const states = useMemo(() => replay(trace.events), [trace])
  const S = steps.length
  const player = usePlayer({ max: S + 2, rootRef, resetKey: learnSeq })
  const k = player.index
  const [restart, setRestart] = useState(false)
  const clauseOf = (id: number) => trace.clauses[id]
  const conflictId = learn.conflictClauseId as number
  const accs = [clauseOf(conflictId).lits, ...steps.map(s => s.result)]
  const backjump = trace.events[learn.seq + 1]
  const asserted = trace.events[learn.seq + 2]
  const stateSeq = k <= S ? learn.seq - 1 : k === S + 1 ? backjump.seq : asserted.seq
  const state = states[stateSeq]
  const current = k <= S ? new Set(accs[k].map(Math.abs)) : new Set<number>()
  const byVar = new Map(state.trail.map(a => [Math.abs(a.lit), a]))
  const learnedId = learn.learnedClauseId as number

  const mark = (r: number, c: number): CellMark | undefined => {
    const v = varOf(r, c)
    const a = byVar.get(v)
    const m: CellMark = {}
    if (a) { m.value = a.lit > 0; if (a.reason === null) { m.decision = true; m.badge = `D${a.level}` } else if (a.reason >= trace.originalClauseCount) { m.learned = true; m.badge = 'L' } }
    if (current.has(v)) m.highlight = true
    if (k === S + 2 && Math.abs(asserted.literal as number) === v) m.fresh = true
    return Object.keys(m).length ? m : undefined
  }
  const levelCounts = (seq: number) => { const s = states[seq]; return Array.from({ length: s.level + 1 }, (_, l) => s.trail.filter(a => a.level === l).length) }
  const before = levelCounts(learn.seq - 1), after = levelCounts(k === S + 2 ? asserted.seq : backjump.seq)
  const sentence = k === 0 ? <>Start with the conflict clause <ClauseRef id={conflictId} lits={accs[0]} sources={clauseOf(conflictId).sources} />. Every literal is false.</>
    : k <= S ? <>Resolve on <Lit lit={steps[k - 1].pivot} /> with its reason #{steps[k - 1].parentClauseId}: the result is <Clause lits={steps[k - 1].result} />{k === S ? <>, the learned clause #{learnedId}.</> : '.'}</>
      : k === S + 1 ? <>Backjump to level {backjump.targetLevel}. {backjump.removed?.length} assignments are removed; the learned clause is now unit.</>
        : <>Event {asserted.seq}: <Lit lit={asserted.literal as number} /> is forced by the learned clause #{learnedId}.</>
  const spoken = k === 0 ? `Start with conflict clause ${conflictId}.` : k <= S ? `Step ${k} of ${S}: resolve with clause ${steps[k - 1].parentClauseId} on variable ${steps[k - 1].pivot}; ${steps[k - 1].result.length} literals remain.` : k === S + 1 ? `Backjump to level ${backjump.targetLevel}.` : `The learned clause forces its literal at level ${asserted.level}.`

  return <Figure label="Figure 6.1 · Recorded learning" title={`Resolution at event ${learn.seq}`} tag={<EngineTag kind="reference" note={`existence run · events ${learn.seq}–${asserted.seq}`} />} className="z3-figure--player">
    <div className="z3-controls">
      <label className="z3-select">Learned clause <select value={learnSeq} onChange={event => setLearnSeq(Number(event.target.value))}>{learns.map(e => <option key={e.seq} value={e.seq}>#{e.learnedClauseId} at event {e.seq} · {e.resolution?.length} steps{e.seq === 127 ? ' (this chapter)' : ''}</option>)}</select></label>
    </div>
    <div ref={rootRef as React.RefObject<HTMLDivElement>} className="z3-figure-body">
      <div className="z3-stage">
        <ConstraintBoard regions={board.regions} label={`Board at event ${stateSeq}. Outlined cells are the variables of the current resolvent.`} mark={mark} />
        <p className="z3-inference" aria-hidden="true">{sentence}</p>
        <p className="sr-only" aria-live="polite" aria-atomic="true">{spoken}</p>
        <div className="z3-transport-dock">
          <Transport index={k} max={S + 2} onChange={player.setIndex} playing={player.playing} onToggle={player.toggle} reducedMotion={player.reduced} label="Resolution step" valueText={spoken} counter={k <= S ? `${k}/${S}` : k === S + 1 ? 'jump' : 'unit'} />
        </div>
      </div>
      <div className="z3-explain">
        <ol className="z3-resolution">
          <li className={k === 0 ? 'is-current' : ''}><span className="z3-resolution-tag">conflict</span><ClauseRef id={conflictId} lits={accs[0]} sources={clauseOf(conflictId).sources} /></li>
          {steps.map((s, i) => i < k && <li key={i} className={i === k - 1 ? 'is-current' : ''}>
            <span className="z3-resolution-tag">step {i + 1} · pivot <Lit lit={s.pivot} /></span>
            <div className="z3-resolution-row">
              <span><Clause lits={accs[i]} struck={s.pivot} /></span>
              <span className="z3-resolution-with">with #{s.parentClauseId} <Clause lits={clauseOf(s.parentClauseId).lits} struck={s.pivot} /> <span className="z3-clause-source">· {describeSources(clauseOf(s.parentClauseId).sources)}</span></span>
              <span className="z3-resolution-result">⇒ <Clause lits={s.result} /></span>
            </div>
          </li>)}
        </ol>
        <div className="z3-levelbars" aria-label="Assignments per decision level">
          <div><span className="z3-mini-label">Before learning (event {learn.seq - 1})</span>{before.map((count, level) => <span key={level} className="z3-levelbar"><span>Level {level}</span><strong>{count}</strong></span>)}</div>
          {k > S && <div><span className="z3-mini-label">After the backjump{k === S + 2 ? ' and the forced literal' : ''}</span>{after.map((count, level) => <span key={level} className="z3-levelbar"><span>Level {level}</span><strong>{count}</strong></span>)}</div>}
        </div>
        <label className="z3-toggle"><input type="checkbox" checked={restart} onChange={event => setRestart(event.target.checked)} /> Show a schematic restart</label>
        {restart && <div className="z3-schematic">
          <EngineTag kind="illustration" note="the reference kernel never restarts" />
          <p>A restart would clear every assignment above level 0 at this point and keep all learned clauses. Here that keeps {before[0]} level-0 assignment{before[0] === 1 ? '' : 's'} and the {trace.events.filter(e => e.kind === 'learn' && e.seq < learn.seq).length} clauses learned before event {learn.seq}, and discards {before.slice(1).reduce((a, b) => a + b, 0)} assignments. The mathematics is unchanged: learned clauses are consequences of F, so nothing true is forgotten. Real solvers restart to escape unlucky early decisions.</p>
        </div>}
      </div>
    </div>
  </Figure>
}

export function Chapter6({ ui, data }: ChapterProps) {
  const { Section } = ui
  const trace = data?.existence
  return <Section id="z3-learning" label="Chapter 6" title="Learning is a proof, not a guess">
    <Lede>The solver turns the conflict into a new theorem about the board. Resolution removes intermediate literals while preserving logical consequence.</Lede>
    <Statement kind="Rule" label="6.1 · resolution">
      <p>From clauses (A ∨ p) and (B ∨ ¬p) infer (A ∨ B). The variable p is the <em>pivot</em>; A ∨ B is the <em>resolvent</em>.</p>
      <Formula spoken="A or p, and B or not p, entail A or B.">(A ∨ p), (B ∨ ¬p) ⊢ (A ∨ B)</Formula>
    </Statement>
    <p>Resolution is the whole of conflict analysis” | This overgeneralizes the reference kernel’s derivation to conflict analysis in full SAT/SMT solvers, which also selects explanations/cuts and may minimize clauses; theory explanations require theory reasoning. | “In this reference kernel, the learned clause is derived by resolution: each step removes a complementary pivot pair. Full solvers also choose explanations and stopping points, and may minimize the resulting clause.</p>
    {trace ? <ResolutionFigure trace={trace} /> : <Unavailable what="The resolution stepper" />}
    <h3>The derivation</h3>
    <Statement kind="Lemma" label="6.2 · soundness">
      <p>Every assignment that satisfies both (A ∨ p) and (B ∨ ¬p) satisfies (A ∨ B).</p>
    </Statement>
    <Proof>Take such an assignment. If p is true, then ¬p is false, so B ∨ ¬p forces B to be true. If p is false, A ∨ p forces A to be true. Either way A ∨ B is true.</Proof>
    <p>By induction on the steps, a clause L reached by resolution from clauses of F satisfies F ⊨ L. Then F and F ∧ L have exactly the same models: any model of F already satisfies L, and any model of F ∧ L is a model of F.</p>
    <p>For the event-126 conflict, start with f ∨ g ∨ h = (q<sub>57</sub> ∨ q<sub>67</sub> ∨ q<sub>77</sub>), clause #477. Resolve with (¬u ∨ ¬h), #297, on q<sub>77</sub>, to get (q<sub>57</sub> ∨ q<sub>67</sub> ∨ ¬q<sub>27</sub>). Resolve with (¬u ∨ ¬g), #296, on q<sub>67</sub>, to get (q<sub>57</sub> ∨ ¬q<sub>27</sub>). Resolve with (¬u ∨ ¬f), #295, on q<sub>57</sub>, to get (¬q<sub>27</sub>). These are the recorded pivots 49, 42, 35 (the variable ids of q<sub>77</sub>, q<sub>67</sub>, q<sub>57</sub>) and reasons 297, 296, 295. The learned clause is #517 in the zero-based clause registry.</p>
    <Statement kind="Rule" label="6.3 · backjump">
      <p>A first-UIP clause has exactly one literal from the current level. Jump back to the largest decision level among its other literals, or to level 0 if there are none. At that level every other literal is still false, so the clause is unit and asserts its remaining literal.</p>
    </Statement>
    <p>Here ¬q<sub>27</sub> is a unit theorem with no other literals, so the run jumps to level 0 and propagates it: r2c7 receives a cross marked L, because a learned clause forced it. This removes one cell for the rest of the run, whatever is decided later.</p>
    <CheckYourself question="Prove that adding the learned clause cannot remove a legal solution.">
      <p>Each resolution step is sound (Lemma 6.2), so by induction F ⊨ L. A legal placement P gives an assignment α<sub>P</sub> that satisfies F (Proposition 1.2), hence it satisfies L, hence it satisfies F ∧ L. So F ∧ L has exactly the models of F: the clause removes only assignments that were already impossible.</p>
    </CheckYourself>
    <ReadSource items={[
      { id: 'P8', locator: '§§4.4.2–4.4.4', why: 'conflict analysis by resolution, clause learning and non-chronological backtracking.' },
      { id: 'P6', locator: '§3', why: 'VSIDS: why real solvers branch on variables from recent conflicts (the reference kernel does not).' },
      { id: 'P8', locator: '§§4.5.2–4.5.4', why: 'modern search policies: decision heuristics, restarts and clause deletion.' },
    ]} />
  </Section>
}
