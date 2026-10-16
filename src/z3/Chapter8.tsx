import { useMemo, useState, type ReactNode } from 'react'
import { CDCLPlayer } from './CDCLPlayer'
import { ConstraintBoard, QueenGlyph } from './ConstraintBoard'
import { board, evidencePath, FILES, varOf, type Z3Data } from './data'
import { CheckYourself, Clause, ClauseRef, EngineTag, Figure, Formula, Lede, Lit, Proof, ReadSource, Statement, Unavailable } from './format'
import type { Trace, TraceEvent } from './kernel'
import { range, type BookUi, type ChapterProps } from './ui'
import { CheckSummary } from './EngineReceipt'

type Derivation = { trace: Trace; event: TraceEvent; run: 'existence' | 'blocked' }

function useDerivations(data: Z3Data) {
  return useMemo(() => {
    const map = new Map<number, Derivation>()
    for (const [trace, run] of [[data.existence, 'existence'], [data.blocked, 'blocked']] as const) {
      for (const event of trace.events) if (event.kind === 'learn') map.set(event.learnedClauseId as number, { trace, event, run })
    }
    return map
  }, [data])
}

/** Children render only once opened, so the shared proof DAG is never expanded eagerly. */
function LazyDetails({ summary, children }: { summary: ReactNode; children: ReactNode }) {
  const [open, setOpen] = useState(false)
  return <details className="z3-proof-node" onToggle={event => setOpen((event.target as HTMLDetailsElement).open)}><summary>{summary}</summary>{open && children}</details>
}

function ProofNode({ id, derivations, clauses, depth }: { id: number; derivations: Map<number, Derivation>; clauses: Trace['clauses']; depth: number }) {
  const d = derivations.get(id)
  if (!d) return null
  const steps = d.event.resolution ?? []
  const conflict = d.event.conflictClauseId as number
  const parent = (pid: number, label: ReactNode) => {
    const c = clauses[pid]
    return derivations.has(pid)
      ? <LazyDetails summary={<>{label} <ClauseRef id={pid} lits={c.lits} /> · learned at {derivations.get(pid)!.run} event {derivations.get(pid)!.event.seq}</>}><ProofNode id={pid} derivations={derivations} clauses={clauses} depth={depth + 1} /></LazyDetails>
      : <p className="z3-proof-leaf">{label} <ClauseRef id={pid} lits={c.lits} sources={c.sources} /> <span className="z3-leaf-tag">{c.sources[0] === 'blocker' ? 'blocker' : 'input clause'}</span></p>
  }
  return <ol className="z3-proof-steps">
    <li>{parent(conflict, 'Start from')}</li>
    {steps.map((s, i) => <li key={i}>{parent(s.parentClauseId, <>Resolve on <Lit lit={s.pivot} /> with</>)}<p className="z3-proof-result">⇒ <Clause lits={s.result} /></p></li>)}
  </ol>
}

function leaves(id: number, derivations: Map<number, Derivation>, clauses: Trace['clauses'], seen = new Set<number>(), out = { inputs: new Set<number>(), learned: new Set<number>(), blocker: false }) {
  if (seen.has(id)) return out
  seen.add(id)
  const d = derivations.get(id)
  if (!d) { if (clauses[id].sources[0] === 'blocker') out.blocker = true; else out.inputs.add(id); return out }
  out.learned.add(id)
  ;[d.event.conflictClauseId as number, ...(d.event.resolution ?? []).map(s => s.parentClauseId)].forEach(p => leaves(p, derivations, clauses, seen, out))
  return out
}

function UniquenessPanel({ data, ui }: { data: Z3Data; ui: BookUi }) {
  const { blocked, existence, receipts } = data
  const derivations = useDerivations(data)
  const columns = existence.modelColumns ?? []
  const queens = new Set(columns.map((c, r) => varOf(r + 1, c)))
  const blocker = blocked.clauses[blocked.blockerId as number]
  const short = [...queens].sort((a, b) => a - b).map(v => -v)
  const finalLearn = blocked.events[blocked.events.length - 2]
  const rootId = finalLearn.learnedClauseId as number
  const used = leaves(rootId, derivations, blocked.clauses)
  const seven = receipts.boards.find(b => b.id === 'seven')!.runs.find(r => r.mode === 'default')!
  return <>
    <Figure label="Figure 8.1 · The found model" title="One placement, and the clause that forbids it" tag={<EngineTag kind="reference" note="existence run, final event" />}>
      <div className="z3-figure-body">
        <div className="z3-stage z3-stage--small">
          <ConstraintBoard regions={board.regions} label={`The model found by the existence run: columns by row ${columns.join(', ')}.`} mark={(r, c) => queens.has(varOf(r, c)) ? { value: true } : { value: false, dim: true }} />
          <p className="z3-fineprint">Columns by row: [{columns.join(', ')}]. Every recorded Z3 configuration returned the same placement.</p>
        </div>
        <div className="z3-explain">
          <p className="z3-mini-label">B<sub>M</sub>: one literal per cell, true exactly where a board differs from M</p>
          <table className="z3-blocker-grid">
            <caption className="sr-only">The 49 literals of the full blocking clause, arranged by cell</caption>
            <tbody>{range(1, 7).map(r => <tr key={r}>{range(1, 7).map(c => {
              const v = varOf(r, c)
              return <td key={c} className={queens.has(v) ? 'is-queen' : ''}>{queens.has(v) && <QueenGlyph />}<Lit lit={queens.has(v) ? -v : v} /></td>
            })}</tr>)}</tbody>
          </table>
          <p>The full blocker is clause #{blocked.blockerId} of the blocked run, with {blocker.lits.length} literals. Because every model of F has exactly seven queens, the seven-literal clause <Clause lits={short} /> is also enough.</p>
        </div>
      </div>
    </Figure>
    <Figure label="Figure 8.2 · Recorded refutation" title="The blocked run ends at the empty clause" tag={<EngineTag kind="reference" note={`blocked query · ${blocked.events.length} events`} />} className="z3-figure--player">
      <p>The same kernel, given F, the eight clauses it learned in the existence run, and B<sub>M</sub>, ends at event {finalLearn.seq} by learning □ at level 0. Read top-down, the derivation below is a resolution proof of □. Its leaves are {used.inputs.size} input clauses{used.blocker ? ' and the blocker' : ''}; its internal nodes are {used.learned.size} learned clauses. Learned clauses are collapsed; open one to see its own derivation.</p>
      <div className="z3-proof-dag">
        <p className="z3-proof-root"><span className="z3-proof-box" aria-hidden="true">□</span> #{rootId}, learned at blocked event {finalLearn.seq} by {finalLearn.resolution?.length} resolution steps</p>
        <ProofNode id={rootId} derivations={derivations} clauses={blocked.clauses} depth={0} />
      </div>
      <details className="z3-disclosure">
        <summary>Replay the blocked run event by event</summary>
        <CDCLPlayer ui={ui} events={blocked.events} clauseOf={id => blocked.clauses[id]} originalCount={blocked.originalClauseCount} runLabel="Blocked-run event" eventTableCaption="Every event of the blocked run" bookmarks={[{ seq: blocked.events.findIndex(e => e.kind === 'conflict'), label: 'First conflict' }, { seq: finalLearn.seq, label: `Event ${finalLearn.seq} · □` }]} />
        <p className="z3-fineprint">In this run, L marks literals forced by any clause outside the original 513, including the eight inherited lemmas and the blocker.</p>
      </details>
    </Figure>
    <Figure label="Figure 8.3 · Recorded Z3 uniqueness checks" title="Z3’s verdict on F ∧ B" tag={<EngineTag kind="z3" version={receipts.z3Version} configuration={seven.configuration} />}>
      <CheckSummary run={seven} queries={['incremental-blocked', 'fresh-blocked']} />
      <p className="z3-fineprint">Both checks report UNSAT for the same 7×7 formula plus Z3’s full-cell blocker (formula hashes in <a href={evidencePath(FILES.receipts)}>z3-receipts.json</a>). They used different engines; Chapter 9 explains why.</p>
    </Figure>
  </>
}

export function Chapter8({ ui, data }: ChapterProps) {
  const { Section } = ui
  const rup = data?.teaching.propagation.runs.find(r => r.cell[0] === 2 && r.cell[1] === 7)
  return <Section id="z3-uniqueness" label="Chapter 8" title="A unique solution is an UNSAT theorem">
    <Lede>Finding one solution proves existence. To prove uniqueness, ask whether any different placement can satisfy the same rules.</Lede>
    <p>This chapter shows the solution. The existence run of Chapter 4 found it; here it becomes a hypothesis to refute.</p>
    {data ? <UniquenessPanel data={data} ui={ui} /> : <Unavailable what="The uniqueness panel" />}
    <h3>The derivation</h3>
    <Statement kind="Definition" label="8.1">
      <p>For a complete assignment M of the cell variables, the blocking clause is B<sub>M</sub> = ⋁<sub>v</sub> (q<sub>v</sub> ≠ M(q<sub>v</sub>)): it contains ¬q<sub>v</sub> where M has a queen and q<sub>v</sub> where it does not. B<sub>M</sub> is false at M and true at every other assignment.</p>
    </Statement>
    <Statement kind="Theorem" label="8.2">
      <p>M is the unique assignment of the cell variables satisfying F if and only if M satisfies F and F ∧ B<sub>M</sub> is UNSAT.</p>
    </Statement>
    <Proof>If M is the unique model, then a model of F ∧ B<sub>M</sub> would be a model of F different from M, which is impossible. Conversely, if M′ ≠ M satisfied F, it would differ from M at some cell and so satisfy B<sub>M</sub>, making F ∧ B<sub>M</sub> satisfiable.</Proof>
    <p>Every model of F has exactly seven queens, so a model containing all seven queens of M equals M. Hence the shorter clause ⋁<sub>v∈Q(M)</sub> ¬q<sub>v</sub> also works. For this board it is ¬q<sub>13</sub> ∨ ¬q<sub>21</sub> ∨ ¬q<sub>36</sub> ∨ ¬q<sub>42</sub> ∨ ¬q<sub>54</sub> ∨ ¬q<sub>67</sub> ∨ ¬q<sub>75</sub>. Always block the original board variables.</p>
    <p>UNSAT certifies uniqueness relative to the encoded rules and this partition. UNKNOWN (a timeout, say) certifies nothing. An unsat <em>core</em> names an inconsistent subset of the assertions; it is not a derivation and need not be minimal. A <em>certificate</em> is a derivation a separate checker can replay.</p>
    <Statement kind="Example" label="8.3 · reverse unit propagation">
      <p>A clause C has the RUP property for F if unit propagation from the negation of C reaches a conflict. Check the learned clause ¬q<sub>27</sub>: assume q<sub>27</sub>.</p>
      {rup && data ? <ol className="z3-steps">{rup.steps.map((s, i) => <li key={i}><Lit lit={s.literal} /> — <ClauseRef id={s.reasonClauseId} lits={data.existence.clauses[s.reasonClauseId].lits} sources={data.existence.clauses[s.reasonClauseId].sources} /></li>)}<li>Conflict: <ClauseRef id={rup.conflictClauseId as number} lits={data.existence.clauses[rup.conflictClauseId as number].lits} sources={data.existence.clauses[rup.conflictClauseId as number].sources} /> is false.</li></ol> : <p>(Recorded steps unavailable.)</p>}
      <p>So ¬q<sub>27</sub> is RUP for F alone. A checker can confirm each learned clause this way, in order, without trusting the solver.</p>
    </Statement>
    <p>DRAT proofs extend this: they also allow RAT additions, which preserve satisfiability without being ordinary consequences, and they record deletions. A DRAT checker validates a CNF proof log, not a statistics file. Z3 needs a separately configured proof run, and its native proof object should not be called DRAT unless it has been converted and checked. This book did not produce or check a DRAT proof: the reference refutation above is checked by replaying every resolution step and by Z3 entailment checks at build time.</p>
    <Formula spoken="M unique if and only if F of M holds and F and B M is unsatisfiable.">M unique ⟺ F(M) ∧ (F ∧ B<sub>M</sub> ⊨ □)</Formula>
    <CheckYourself question="Why does blocking only auxiliary values fail to prove board uniqueness?">
      <p>Uniqueness is a statement about the cell variables. Blocking an auxiliary pattern fails both ways. The same board may come back with different auxiliary values, so SAT would not mean a second board. And a different board may share the blocked auxiliary values (two placements with queens in the same commander groups have identical commanders), so UNSAT would not rule it out. Z3’s compiled form of this puzzle has more internal variables than cells (Chapter 9), which is why the recorded blockers list the 49 cells.</p>
    </CheckYourself>
    <ReadSource items={[
      { id: 'P2', locator: '§5.1', why: 'enumerating models with blocking clauses, and what cores are.' },
      { id: 'P13', locator: '§§2–3, Fig. 1', why: 'RUP and RAT, proof logs, deletions and the empty clause.' },
      { id: 'P14', locator: '§6.2', why: 'how Z3 represents proofs and certificates.' },
    ]} />
  </Section>
}

