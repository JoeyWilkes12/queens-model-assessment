import { CDCLPlayer } from './CDCLPlayer'
import { CheckYourself, ClauseRef, EngineTag, Figure, Lede, Lit, ReadSource, Statement, Term, Unavailable } from './format'
import type { ChapterProps } from './ui'

export function Chapter4({ ui, data }: ChapterProps) {
  const { Section } = ui
  const trace = data?.existence
  const clauseOf = (id: number) => trace!.clauses[id]
  const events = trace?.events ?? []
  const firstConflict = events.find(e => e.kind === 'conflict')
  const lastBackjump = [...events].reverse().find(e => e.kind === 'backjump')
  const decide19 = events[19], prop33 = events[33]
  return <Section id="z3-search" label="Chapter 4" title="Search is a sequence of justified states">
    <Lede>When propagation stops, the solver may choose an undecided literal. The choice starts a decision level; every consequence records the clause that forced it.</Lede>
    <p>The <Term id="trail">trail</Term> is the ordered list of literals assigned so far. Each entry is either a <em>decision</em>, chosen freely, or an <em>implication</em> annotated with the clause that forced it. The <Term id="level">decision level</Term> of an entry is the number of decisions at or before it; level 0 holds what follows with no decision at all.</p>
    {trace && firstConflict && lastBackjump ? <Figure label="Figure 4.1 · Recorded run" title="The reference run, event by event" tag={<EngineTag kind="reference" note={`existence query · ${events.length} events`} />} className="z3-figure--player">
      <CDCLPlayer ui={ui} events={events} clauseOf={clauseOf} originalCount={trace.originalClauseCount} eventTableCaption="Every event of the existence run" bookmarks={[
        { seq: 0, label: 'Event 0 · first decision' },
        { seq: firstConflict.seq, label: `Event ${firstConflict.seq} · region B empty` },
        { seq: 66, label: 'Event 66 · two-level conflict' },
        { seq: 126, label: 'Event 126 · region F empty' },
        { seq: lastBackjump.seq, label: `Event ${lastBackjump.seq} · last backjump` },
      ]} gate={{ seq: lastBackjump.seq, message: <>The remaining {events.length - 1 - lastBackjump.seq} events extend this trail to a complete satisfying assignment, which is the puzzle’s solution. Chapter 8 shows it; you can reveal it here instead.</>, revealLabel: `Show the last ${events.length - 1 - lastBackjump.seq} events (reveals the solution)` }} />
      <p className="z3-fineprint">This is the book’s reference kernel solving the explicit pairwise CNF, not Z3’s internal trail. Z3 does not publish a per-event trail; Chapter 9 shows what its recorded statistics do say. You may step backwards or inspect reasons, but a recorded decision cannot be changed in place: the experiment at the end forks a new run instead.</p>
    </Figure> : <Unavailable what="The recorded run" />}
    <h3>The derivation</h3>
    <Statement kind="Definition" label="4.1">
      <p>A solver state is a pair (M, F) where M is the trail and F the clause set. Write ℓ<sup>d</sup> for a decision. The reference kernel uses these transitions, after Nieuwenhuis, Oliveras and Tinelli:</p>
      <ul className="z3-rules">
        <li><strong>UnitPropagate</strong>: M ‖ F ⇒ M ℓ ‖ F if a clause C ∨ ℓ ∈ F has M ⊨ ¬C and ℓ is undefined in M.</li>
        <li><strong>Decide</strong>: M ‖ F ⇒ M ℓ<sup>d</sup> ‖ F if ℓ is undefined in M (the kernel decides only when nothing is unit).</li>
        <li><strong>Learn</strong>: M ‖ F ⇒ M ‖ F ∧ C if F ⊨ C.</li>
        <li><strong>Backjump</strong>: M ℓ<sup>d</sup> N ‖ F ⇒ M ℓ′ ‖ F if some clause of F is false under M ℓ<sup>d</sup> N, and F ⊨ C′ ∨ ℓ′ where M ⊨ ¬C′ and ℓ′ is undefined in M.</li>
        <li><strong>Fail</strong>: M ‖ F ⇒ UNSAT if a clause is false under M and M contains no decision.</li>
      </ul>
    </Statement>
    <p>Classical DPLL backtracks chronologically to the most recent decision whose other branch has not yet been tried; if none remains, it reports UNSAT. CDCL instead adds a learned clause (Chapter 6) and jumps back to the level where that clause becomes unit, possibly skipping many decisions. The run is SAT when the trail is total and every clause is satisfied. A consistent but incomplete trail is not yet a solution: in Figure 4.1, cells often become false long before their row has a queen.</p>
    {trace && firstConflict && <p>The first decision is <Lit lit={1} />. Row 1’s pairs then falsify r1c2–r1c5, which is all of region B, so at event {firstConflict.seq} region B’s at-least-one clause <ClauseRef id={firstConflict.conflictClauseId as number} lits={clauseOf(firstConflict.conflictClauseId as number).lits} /> is false. Event 66 is the first conflict with two decisions on the trail.</p>}
    <CheckYourself question="Both a decision and an implication can assign true. How do you tell them apart on the trail?">
      {trace && decide19 && prop33 ? <p>By whether a reason is recorded. Event {decide19.seq} decides <Lit lit={decide19.literal as number} /> = true: no clause forced it, and a later backjump may undo it. Event {prop33.seq} sets <Lit lit={prop33.literal as number} /> = true because <ClauseRef id={prop33.reasonClauseId as number} lits={clauseOf(prop33.reasonClauseId as number).lits} sources={clauseOf(prop33.reasonClauseId as number).sources} /> had every other literal false. Given the earlier trail, that value is a consequence of F, not a choice.</p>
        : <p>By whether a reason clause is recorded: decisions have none; implications name the clause that forced them.</p>}
    </CheckYourself>
    <ReadSource items={[
      { id: 'P7', locator: '§§2.3–2.5', why: 'the abstract DPLL and CDCL transition systems used in Definition 4.1.' },
      { id: 'P8', locator: '§4.3', why: 'the organisation of a CDCL solver: decisions, propagation, conflict analysis, backjumping.' },
      { id: 'P9', locator: 'whole paper (implementation reading)', why: 'how MiniSat implements the same loop efficiently.' },
    ]} />
  </Section>
}
