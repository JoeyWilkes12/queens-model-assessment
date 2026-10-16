import { useState } from 'react'
import { ConstraintBoard, type CellMark } from './ConstraintBoard'
import { board, type TeachingData } from './data'
import { CheckYourself, EngineTag, Figure, Formula, Lede, Proof, ReadSource, Statement, Unavailable } from './format'
import type { ChapterProps } from './ui'

/** Small augmenting-path matching from regions in K to rows, for display only. */
function matching(K: string[], rows: Record<string, number[]>) {
  const owner = new Map<number, string>()
  const tryRegion = (k: string, seen: Set<number>): boolean => {
    for (const r of rows[k]) {
      if (seen.has(r)) continue
      seen.add(r)
      const current = owner.get(r)
      if (current === undefined || tryRegion(current, seen)) { owner.set(r, k); return true }
    }
    return false
  }
  K.forEach(k => tryRegion(k, new Set()))
  return new Map([...owner].map(([r, k]) => [k, r]))
}

function Bipartite({ regions, rows, K, N, matched }: { regions: string[]; rows: Record<string, number[]>; K: Set<string>; N: Set<number>; matched: Map<string, number> }) {
  const left = 64, right = 236, top = 22, gap = 34
  const y = (i: number) => top + i * gap
  return <svg className="z3-bipartite" viewBox={`0 0 300 ${top * 2 + gap * 6}`} role="img" aria-label="Bipartite graph from regions to rows. The table below lists every edge.">
    <text x={left} y={12} textAnchor="middle" className="z3-bip-head">regions</text>
    <text x={right} y={12} textAnchor="middle" className="z3-bip-head">rows</text>
    {regions.map((k, i) => rows[k].map(r => <line key={`${k}${r}`} x1={left + 14} y1={y(i) + 4} x2={right - 14} y2={y(r - 1) + 4} className={`z3-bip-edge${K.has(k) ? ' is-on' : ''}${matched.get(k) === r ? ' is-matched' : ''}`} />))}
    {regions.map((k, i) => <g key={k} className={`z3-bip-node${K.has(k) ? ' is-on' : ''}`} transform={`translate(${left} ${y(i) + 4})`}><rect x={-13} y={-13} width={26} height={26} /><text y={5} textAnchor="middle">{k}</text></g>)}
    {Array.from({ length: 7 }, (_, i) => <g key={i} className={`z3-bip-node z3-bip-row${N.has(i + 1) ? ' is-on' : ''}`} transform={`translate(${right} ${y(i) + 4})`}><circle r={13} /><text y={5} textAnchor="middle">{i + 1}</text></g>)}
  </svg>
}

function ConfinementLab({ data, ui }: { data: TeachingData['confinement']; ui: ChapterProps['ui'] }) {
  const { DataTable } = ui
  const [hypothesis, setHypothesis] = useState(true)
  const [K, setK] = useState<Set<string>>(() => new Set(['A', 'B']))
  const [ran, setRan] = useState(false)
  const mask = hypothesis ? data.masks.notq31 : data.masks.none
  const key = [...K].sort().join()
  const subset = mask.subsets.find(s => s.regions.join() === key)
  const N = new Set(subset?.rows ?? [])
  const excluded = new Set((subset?.status === 'tight' ? subset.excluded : []).map(([r, c]) => `${r},${c}`))
  const matched = subset ? matching([...K].sort(), mask.regionRows) : new Map<string, number>()
  const toggle = (k: string) => { const next = new Set(K); if (next.has(k)) next.delete(k); else next.add(k); setK(next) }
  const [hr, hc] = data.hypothesisCell
  const mark = (r: number, c: number): CellMark | undefined => {
    if (hypothesis && r === hr && c === hc) return { value: false, badge: 'H', note: 'hypothesis: assumed empty' }
    if (excluded.has(`${r},${c}`)) return { value: false, fresh: true, note: 'excluded by the Hall argument' }
    return undefined
  }
  const tight = mask.subsets.filter(s => s.status === 'tight' && s.excluded.length)
  const status = !subset ? 'Choose at least one region.'
    : subset.status === 'deficient' ? `|K| = ${subset.regions.length} but |N(K)| = ${subset.rows.length}: too few rows. No completion exists under this mask.`
      : subset.status === 'tight' ? `|K| = ${subset.regions.length} = |N(K)|: tight. Rows ${subset.rows.join(', ')} are reserved for ${subset.regions.join(', ')}, so ${subset.excluded.length} other candidate${subset.excluded.length === 1 ? '' : 's'} in those rows ${subset.excluded.length === 1 ? 'is' : 'are'} impossible.`
        : `|K| = ${subset.regions.length} < |N(K)| = ${subset.rows.length}: slack. Hall’s condition holds here and this K excludes nothing.`
  return <Figure label="Figure 7.1 · Manipulation" title="Regions reserve rows" tag={<p className="z3-engine-tag z3-engine-tag--illustration"><span className="z3-engine-mark" aria-hidden="true">HALL</span><span>Precomputed for both masks · exclusions checked by enumeration and with Z3 at build time</span></p>}>
    <div className="z3-controls">
      <label className="z3-toggle"><input type="checkbox" checked={hypothesis} onChange={event => { setHypothesis(event.target.checked); setRan(false) }} /> Temporary hypothesis ¬q<sub>31</sub> (r3c1 empty)</label>
      <fieldset className="z3-chips"><legend>Regions in K</legend>
        {data.regions.map(k => <label key={k} className={K.has(k) ? 'is-on' : ''}><input type="checkbox" checked={K.has(k)} onChange={() => toggle(k)} />{k}</label>)}
      </fieldset>
    </div>
    <div className="z3-figure-body">
      <div className="z3-stage">
        <ConstraintBoard regions={board.regions} label={`Board with regions ${[...K].join(', ')} outlined and rows ${[...N].join(', ')} bracketed.`} outlineRegions={[...K]} bracketRows={[...N]} mark={mark} />
        <p className={`z3-inference${subset?.status === 'tight' ? ' is-ok' : subset?.status === 'deficient' ? ' is-bad' : ''}`} aria-live="polite">{status}</p>
      </div>
      <div className="z3-explain">
        <Bipartite regions={data.regions} rows={mask.regionRows} K={K} N={N} matched={subset?.status !== 'deficient' ? matched : new Map()} />
        <p className="z3-fineprint">Edges join a region to every row where it still has a candidate cell. Thick edges show one matching of K into N(K).</p>
        <div className="z3-up-check">
          <button type="button" className="z3-button" onClick={() => setRan(true)} disabled={!hypothesis}>Run unit propagation from ¬q<sub>31</sub></button>
          {ran && hypothesis && <p role="status"><EngineTag kind="reference" note="precomputed" />Unit propagation adds {data.unitPropagationFromHypothesis.newLiterals} literals. The pairwise CNF has no unit clause, and making r3c1 false leaves every unsatisfied clause with at least two open literals. The Hall argument sees what propagation cannot.</p>}
        </div>
      </div>
    </div>
    <details className="z3-disclosure">
      <summary>Written equivalent: edges and every tight subset under this mask</summary>
      <DataTable caption={`Region-to-row edges ${hypothesis ? 'with ¬q31' : 'with no hypothesis'}`} headers={['Region', 'Rows with a candidate', 'Cells']} rows={data.regions.map(k => [k, mask.regionRows[k].join(', '), String(data.regionCells[k].filter(([r, c]) => !(hypothesis && r === hr && c === hc)).length)])} />
      <DataTable caption="Tight subsets K that exclude at least one cell" headers={['K', 'N(K)', 'Excluded cells']} rows={tight.map(s => [`{${s.regions.join(', ')}}`, s.rows.join(', '), s.excluded.map(([r, c]) => `r${r}c${c}`).join(' ')])} />
    </details>
  </Figure>
}

export function Chapter7({ ui, data }: ChapterProps) {
  const { Section } = ui
  const c = data?.teaching.confinement
  const counter = c?.matchingCounterexample
  return <Section id="z3-confinement" label="Chapter 7" title="Confinement is a matching theorem">
    <Lede>Several regions can reserve several rows before any queen position is known. Counting the available rows gives a deduction that local unit propagation may miss.</Lede>
    <p>Suppose, as a temporary hypothesis, that r3c1 is empty. Region A is then r1c1, r2c1, r2c2 and r2c3, all in rows 1 and 2. Region B lies entirely in row 1. Two regions need two different rows, and only rows 1 and 2 are available to them, so both rows are used up. Every other candidate in rows 1 and 2 is impossible: the six region-C cells r1c6, r1c7 and r2c4–r2c7.</p>
    {c ? <ConfinementLab data={c} ui={ui} /> : <Unavailable what="The confinement lab" />}
    <h3>The derivation</h3>
    <Statement kind="Definition" label="7.1">
      <p>Fix a candidate mask: the cells not yet excluded. The bipartite graph G has the regions on one side, the rows on the other, and an edge (R, r) when some candidate cell of R lies in row r. For a set K of regions, N(K) is the set of rows adjacent to K.</p>
    </Statement>
    <Statement kind="Lemma" label="7.2">
      <p>A legal completion inside the mask induces a matching that covers every region: send each region to the row of its queen. The rows are distinct because each row holds one queen.</p>
    </Statement>
    <Statement kind="Theorem" label="7.3 · Hall, 1935">
      <p>A bipartite graph has a matching covering the region side if and only if |N(K)| ≥ |K| for every set K of regions.</p>
    </Statement>
    <Statement kind="Proposition" label="7.4">
      <p>If |N(K)| &lt; |K| for some K, no completion exists. If |N(K)| = |K|, every candidate in a row of N(K) that belongs to a region outside K is impossible.</p>
    </Statement>
    <Proof>The first claim follows from Lemma 7.2 and Theorem 7.3. For the second, the |K| queens of the regions in K lie in distinct rows of N(K), and there are only |K| such rows, so they occupy all of them. Each row holds exactly one queen, so no queen of another region can sit in those rows.</Proof>
    <Formula spoken="Under not q 3 1: K equals A, B; N of K equals rows 1 and 2; the size of K equals the size of N of K equals 2.">¬q<sub>31</sub> ⇒ K = {"{"}A, B{"}"}, N(K) = {"{"}1, 2{"}"}, |K| = |N(K)| = 2</Formula>
    <p>Hall’s criterion is exact for this row–region abstraction, not for the whole puzzle: it ignores columns and touching. A dedicated matching propagator could make this deduction at once. Unit propagation on the pairwise CNF makes none of it, and CDCL may rediscover equivalent facts through decisions and learning. Indeed, with no hypothesis K = {"{"}B{"}"} is already tight, because region B lies inside row 1, so r1c1, r1c6 and r1c7 are impossible. The reference run learned exactly ¬q<sub>11</sub> at its first conflict. This book does not claim that Z3’s default route runs Hall filtering.</p>
    {c && <p className="z3-fineprint">Build-time checks: for each of the six cells v, Z3 proves F ∧ ¬q<sub>31</sub> ∧ q<sub>v</sub> UNSAT, and enumerating all {c.masks.notq31.matchingCount.toLocaleString('en-US')} ways to pick one candidate per region in distinct rows under ¬q<sub>31</sub> confirms that none uses them.</p>}
    <CheckYourself question="Explain why a perfect region-to-row matching need not satisfy the column restrictions.">
      <p>The bipartite graph forgets columns. One cell per region, one per row, can still repeat a column.{counter ? <> For example {counter.cells.map(([r, cc], i) => <span key={i}>{i > 0 && ', '}r{r}c{cc} ({counter.regions[i]})</span>)} uses every region and every row once, but columns {counter.repeatedColumns.join(' and ')} appear twice.</> : null} Hall’s theorem guarantees a matching, not a legal board; the matching is a necessary condition only.</p>
    </CheckYourself>
    <ReadSource items={[
      { id: 'P11', locator: 'the theorem on systems of distinct representatives', why: 'Hall’s marriage theorem. The Queens specialization and the propagation counterexample are checked in this book’s build.' },
    ]} />
  </Section>
}
