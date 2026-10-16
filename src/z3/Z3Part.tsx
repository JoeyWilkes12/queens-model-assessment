import { useEffect } from 'react'
import './z3.css'
import { Chapter1 } from './Chapter1'
import { Chapter2 } from './Chapter2'
import { Chapter3 } from './Chapter3'
import { Chapter4 } from './Chapter4'
import { Chapter5 } from './Chapter5'
import { Chapter6 } from './Chapter6'
import { Chapter7 } from './Chapter7'
import { Chapter8 } from './Chapter8'
import { Chapter9 } from './Chapter9'
import { Chapter10 } from './Chapter10'
import { Beyond } from './Beyond'
import { Experiment } from './Experiment'
import { board, evidencePath, FILES, useZ3Data, z3VersionShort, type LoadState } from './data'
import type { BookUi } from './ui'

export const CHAPTERS = [
  { id: 'z3-variables', label: '1 · A proposition' },
  { id: 'z3-clauses', label: '2 · Clauses' },
  { id: 'z3-propagation', label: '3 · Propagation' },
  { id: 'z3-search', label: '4 · Search' },
  { id: 'z3-conflict', label: '5 · Conflict graph' },
  { id: 'z3-learning', label: '6 · Learning' },
  { id: 'z3-confinement', label: '7 · Confinement' },
  { id: 'z3-uniqueness', label: '8 · Uniqueness' },
  { id: 'z3-engine', label: '9 · Z3’s route' },
  { id: 'z3-workbench', label: '10 · Workbench' },
  { id: 'z3-experiment', label: 'Open the experiment' },
  { id: 'z3-beyond', label: 'Appendix · Beyond Queens' },
]

export const ATLAS_URL = 'https://joeywilkes12.github.io/constraint-atlas-queens/'

const GLOSSARY: [string, string, string][] = [
  ['Assignment', 'A choice of true or false for every variable.', '1'],
  ['SAT / UNSAT', 'A formula is satisfiable (SAT) if some assignment makes it true, and unsatisfiable (UNSAT) if none does. A satisfying assignment is a witness or model.', '1'],
  ['Literal', 'A variable x or its negation ¬x.', '2'],
  ['Clause', 'A disjunction (OR) of literals; true when at least one literal is true. The empty clause □ is always false.', '2'],
  ['CNF', 'Conjunctive normal form: a conjunction (AND) of clauses.', '2'],
  ['Unit clause', 'A clause with no true literal and exactly one open literal, which must therefore become true.', '3'],
  ['Trail', 'The ordered list of assigned literals, each a decision or an implication with its reason clause.', '4'],
  ['Decision level', 'The number of decisions at or before a literal on the trail. Level 0 needs no decision.', '4'],
  ['UIP', 'Unique implication point: a current-level assignment on every path from that level’s decision to the conflict.', '5'],
  ['Resolution', 'From (A ∨ p) and (B ∨ ¬p) infer (A ∨ B).', '6'],
  ['Theory', 'In SMT, a mathematical domain such as integer arithmetic that judges atoms like x ≤ 0.', '9'],
  ['SMT-LIB', 'The standard text language that SMT solvers, Z3 among them, read: declarations, assertions and commands such as (check-sat).', '10'],
]

function EvidenceStatus({ state, ui }: { state: LoadState; ui: BookUi }) {
  const { Callout } = ui
  if (state.status === 'loading') return <p className="z3-status" role="status">Loading the recorded traces and Z3 receipts…</p>
  if (state.status === 'error') return <Callout tone="stop" title="The recorded evidence for this part is unavailable.">
    <p>The chapters below still contain their text and derivations, but their figures need the committed evidence files and no substitute data is generated.</p>
    <ul>{state.errors.map(error => <li key={error}>{error}</li>)}</ul>
  </Callout>
  const { existence, blocked, receipts } = state.data
  const checks = receipts.boards.reduce((sum, b) => sum + b.runs.reduce((s, r) => s + r.checks.length, 0), 0)
  const binding = state.partitionCheck === 'match' ? 'recomputed in this browser: match'
    : state.partitionCheck === 'mismatch' ? 'recomputed in this browser: MISMATCH'
      : state.partitionCheck === 'pending' ? 'checking…' : 'not recomputed (Web Crypto unavailable here); declared hashes agree'
  return <section className="z3-receipt-strip" aria-label="Evidence used in this part">
    <div><span className="z3-mini-label">Reference runs</span><strong>{existence.events.length} + {blocked.events.length} events</strong><span>reference CDCL kernel on the pairwise CNF · not Z3</span></div>
    <div><span className="z3-mini-label">Z3 receipts</span><strong>{checks} recorded checks</strong><span>Z3 {z3VersionShort(receipts.z3Version)} · 5×5, 7×7, 9×9</span></div>
    <div><span className="z3-mini-label">Board binding</span><strong><code>{board.partitionSha256.slice(0, 12)}…</code></strong><span>partition SHA-256 {binding}</span></div>
    <div><span className="z3-mini-label">Download</span><span className="z3-downloads">
      <a href={evidencePath(FILES.existence)}>existence trace</a> · <a href={evidencePath(FILES.blocked)}>blocked trace</a> · <a href={evidencePath(FILES.receipts)}>Z3 receipts</a> · <a href={evidencePath(FILES.teaching)}>teaching data</a> · <a href={evidencePath('seven-pairwise.cnf')}>DIMACS CNF</a> · <a href={evidencePath('manifest.json')}>manifest</a>
    </span></div>
  </section>
}

export default function Z3Part({ ui, section }: { ui: BookUi; section?: string }) {
  const { PageHero, LocalToc, Callout } = ui
  const state = useZ3Data()
  const data = state.status === 'ready' ? state.data : null
  useEffect(() => {
    if (!section || !CHAPTERS.some(c => c.id === section)) return
    const frame = window.requestAnimationFrame(() => document.getElementById(section)?.scrollIntoView({ block: 'start' }))
    return () => window.cancelAnimationFrame(frame)
  }, [section, state.status])
  return <>
    <PageHero trail="The board / how Z3 solves Queens" title="How Z3 solves Queens" deck="Ten short chapters on the mathematics a solver uses on the book’s 7×7 board: propositions, clauses, propagation, conflict-driven learning, a matching theorem, a proof of uniqueness, and a workbench for changing the rules. Figures replay recorded, checked evidence; the workbench computes in this page and says so." action={{ label: 'Read the explanation', scrollTo: 'z3-variables' }} />
    <div className="reading-layout">
      <LocalToc items={CHAPTERS} />
      <main className="reading-column z3-part" id="main-content">
        <EvidenceStatus state={state} ui={ui} />
        <Callout tone="stop" title="Two kinds of evidence, never mixed.">
          <p><strong>Reference CDCL execution · pairwise encoding</strong> marks runs of this book’s small, transparent kernel on an explicit 513-clause CNF. Its trail is complete and every step is checked, but it is not Z3. <strong>Recorded Z3 execution · Z3 4.16.0 · configuration</strong> marks real Z3 runs. Those give aggregate statistics and a verbose route, not a step-by-step trail. Neither is presented as the other.</p>
        </Callout>
        <details className="z3-disclosure z3-glossary">
          <summary>Glossary · {GLOSSARY.length} terms, each defined where it first appears</summary>
          <dl>{GLOSSARY.map(([term, definition, chapter]) => <div key={term}><dt>{term}</dt><dd>{definition} <span className="z3-glossary-ch">Chapter {chapter}</span></dd></div>)}</dl>
        </details>
        <p className="z3-audience">Written for readers comfortable with logic, sets, proofs and graphs who have not met SAT solvers. Coordinates are 1-based: r1c1 is the top-left cell, and its variable is q<sub>11</sub>. The solution stays hidden until Chapter 8.</p>
        <p className="z3-audience z3-provenance">The standalone Constraint Atlas site (<a href={ATLAS_URL}>{ATLAS_URL}</a>) is kept as a backup; its content now lives in this part. It appears as the Chapter 10 workbench, the Chapter 2 sidebar on other ways to model the board, the Beyond Queens appendix and the added research citations.</p>
        <Chapter1 ui={ui} data={data} />
        <Chapter2 ui={ui} data={data} />
        <Chapter3 ui={ui} data={data} />
        <Chapter4 ui={ui} data={data} />
        <Chapter5 ui={ui} data={data} />
        <Chapter6 ui={ui} data={data} />
        <Chapter7 ui={ui} data={data} />
        <Chapter8 ui={ui} data={data} />
        <Chapter9 ui={ui} data={data} />
        <Chapter10 ui={ui} data={data} />
        <Experiment ui={ui} data={data} />
        <Beyond ui={ui} data={data} />
      </main>
    </div>
  </>
}
