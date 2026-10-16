import { ArithmeticInset, dcp, EngineFigure, ReceiptSummaryTable } from './EngineReceipt'
import { CheckYourself, Formula, Lede, ReadSource, Statement, Term, Unavailable } from './format'
import type { ChapterProps } from './ui'

const PINNED = [
  { label: 'default tactic', path: 'src/tactic/portfolio/default_tactic.cpp', why: 'selects a logic-specific strategy' },
  { label: 'QF_LIA tactic', path: 'src/tactic/smtlogics/qflia_tactic.cpp', why: 'cardinality and pseudo-Boolean reductions and SAT alternatives' },
  { label: 'combined solver', path: 'src/solver/combined_solver.cpp', why: 'distinguishes non-incremental and incremental use' },
  { label: 'SAT search', path: 'src/sat/sat_solver.cpp', why: 'watches, first-UIP analysis, restarts, chronological backtracking options' },
  { label: 'SAT configuration', path: 'src/sat/sat_config.cpp', why: 'branching, phase and restart policies' },
]

export function Chapter9({ ui, data }: ChapterProps) {
  const { Section, Callout } = ui
  const receipts = data?.receipts
  const seven = receipts?.boards.find(b => b.id === 'seven')?.runs.find(r => r.mode === 'default')
  const nine = receipts?.boards.find(b => b.id === 'nine')?.runs.find(r => r.mode === 'default')
  const f = (q: 'first' | 'incremental-blocked' | 'fresh-blocked') => { const c = seven?.checks.find(x => x.query === q); const m = c ? dcp(c) : null; return m ? `D${m.d}/C${m.c}/P${m.p}` : '…' }
  return <Section id="z3-engine" label="Chapter 9" title="Which route did this Z3 run take?">
    <Lede>The mathematical model does not determine one fixed implementation path. Z3 can compile finite counting constraints into Boolean search or retain arithmetic reasoning, and its recorded statistics tell us which work was visible.</Lede>
    <p>The repository solver states the puzzle the way Chapter 1 does, not as the CNF of Chapter 2. Each cell is a Boolean; each row, column and region asserts Sum(If(q, 1, 0)) == 1, an equation over integer-valued terms controlled by Booleans; and each touching pair is asserted in both directions as Implies(q<sub>u</sub>, Not(q<sub>v</sub>)). For an n × n board that is 4n(n − 1) + 4(n − 1)² implications plus 3n equations: 333 assertions at 7 × 7. Z3 then chooses how to solve them.</p>
    <Callout tone="caution" title="A receipt describes one check, not Z3 in general.">Every number below comes from one recorded process on one machine with Z3 4.16.0 and the stated configuration. Counters are aggregates. They do not contain a trail, and missing counters are shown as missing, not as zero.</Callout>
    {receipts ? <>
      <EngineFigure receipts={receipts} ui={ui} />
      <ReceiptSummaryTable receipts={receipts} ui={ui} />
    </> : <Unavailable what="The Z3 receipts" />}
    {seven && nine && <ul className="z3-findings">
      <li><strong>First check, 5×5 and 7×7: SAT core after preprocessing.</strong> The route simplifies, turns the integer sums into cardinality constraints (lia2card), compiles them to Boolean structure (pb2bv), bit-blasts, and runs the SAT core. At 7×7 it reports {f('first')}.</li>
      <li><strong>First check, 9×9: settled during preprocessing.</strong> After pb2bv, value propagation and equation solving leave no residual formula, and no search counters are reported.</li>
      <li><strong>Same solver plus the blocking clause: SMT core with arithmetic.</strong> The incremental check searches with arithmetic counters (bound propagation, feasibility checks): {f('incremental-blocked')} at 7×7.</li>
      <li><strong>Fresh solver with the blocking clause: the tactic route again,</strong> {f('fresh-blocked')} at 7×7. A uniqueness experiment must say which of the two it measured.</li>
    </ul>}
    <h3>The derivation</h3>
    <Statement kind="Definition" label="9.1 · definitional CNF">
      <p>Tseitin’s construction names each subformula with a fresh variable and adds clauses that make the name equivalent to it. For a conjunction:</p>
      <Formula spoken="t if and only if a and b becomes: not t or a; not t or b; t or not a or not b.">t ↔ (a ∧ b) &nbsp;⇝&nbsp; (¬t ∨ a) ∧ (¬t ∨ b) ∧ (t ∨ ¬a ∨ ¬b)</Formula>
    </Statement>
    <Statement kind="Proposition" label="9.2">
      <p>With the root name asserted, F(x) holds exactly when ∃y T(F)(x, y), where y are the new names. The translation is equisatisfiable after extending the variables, not equivalent over the old ones, which is the same projection idea as Theorem 2.4.” | The sentence obscures the exact old-variable equivalence just displayed: F(x) is equivalent to ∃y T(F)(x,y). T(F) with free auxiliaries is a different formula over an extended signature. | “The extended formula T(F)(x, y) is equisatisfiable with F(x), and projecting its models onto x gives exactly the models of F: F(x) is equivalent to ∃y T(F)(x, y). This is the same projection idea as Theorem 2.4. Tseitin conversion handles Boolean structure; compiling a count into clauses is a separate choice.</p>
    </Statement>
    <p>In DPLL(T), some propositional atoms stand for arithmetic predicates and a <Term id="theory">theory</Term> solver judges them. Boolean search proposes truth values; the theory either agrees or explains the inconsistency with a clause that joins the Boolean clause set. Linear feasibility over the rationals can be decided with simplex-style tableau operations. Integers need more, such as cuts and branching, because rational feasibility does not imply an integer solution. Calling the whole process “simplex solving Queens” would erase the Boolean search and the finite reductions above.</p>
    <ArithmeticInset />
    <details className="z3-disclosure">
      <summary>Pinned Z3 4.16.0 source files behind these routes</summary>
      <ul className="z3-pinned">{PINNED.map(p => <li key={p.path}><a href={`https://raw.githubusercontent.com/Z3Prover/z3/z3-4.16.0/${p.path}`} target="_blank" rel="noreferrer">{p.label}</a> <code>{p.path}</code> — {p.why}.</li>)}
        <li><a href="https://microsoft.github.io/z3guide/docs/strategies/summary/" target="_blank" rel="noreferrer">Official tactic summary</a> — what each named tactic does. Applying a tactic yourself is not evidence that the default solver used that exact composition.</li>
        <li><a href="https://microsoft.github.io/z3guide/programming/Proof%20Logs/" target="_blank" rel="noreferrer">Official proof-log guide</a> — clause-level logging, which changes the observed route and is therefore not used for these receipts.</li>
      </ul>
      <p className="z3-fineprint">These files show which strategies are available. They do not guarantee the route of every version and configuration; the receipts above record what one run did.</p>
    </details>
    <CheckYourself question="Why is a SAT-core counter evidence about that run but not a promise about a later incremental call?">
      <p>A counter belongs to one check of one solver object. In the 7×7 production receipts the first check compiled the sums and searched in the SAT core ({f('first')}). Adding the blocker to the same solver made Z3’s combined solver use its incremental SMT core instead, with arithmetic counters ({f('incremental-blocked')}). A fresh solver given the same blocker took the tactic route again ({f('fresh-blocked')}). The route depends on version, configuration and how the solver is reused, so each receipt only describes its own check.</p>
    </CheckYourself>
    <ReadSource items={[
      { id: 'P2', locator: '§§3.2, 6', why: 'Z3’s architecture, tactics and arithmetic solvers.' },
      { id: 'P14', locator: '§§3.3, 4.3, 9.2.3', why: 'arithmetic in the SMT core and how Z3 compiles constraints.' },
      { id: 'P5', locator: '§1', why: 'definitional names for subformulas (Definition 9.1).' },
    ]} />
  </Section>
}
