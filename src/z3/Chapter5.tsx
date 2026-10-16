import { useMemo, useState } from 'react'
import { ConstraintBoard, type CellMark } from './ConstraintBoard'
import { board, cellOf, varOf, type ImplicationGraphData } from './data'
import { CheckYourself, Clause, ClauseRef, EngineTag, Figure, Lede, Lit, ReadSource, Statement, Term, Unavailable } from './format'
import { replay, type Trace } from './kernel'
import type { ChapterProps } from './ui'

const W = 70, H = 34, GX = 12, GY = 58, PAD = 16
const CONFLICT = 0

function nodeText(lit: number) {
  if (lit === CONFLICT) return { base: '⊥', sub: '' }
  const [r, c] = cellOf(lit)
  return { base: `${lit < 0 ? '¬' : ''}q`, sub: `${r}${c}` }
}

function GraphView({ graph, shown, selected, pathSet, conflictSide, onSelect }: { graph: ImplicationGraphData; shown: Set<number>; selected: number | null; pathSet: Set<number>; conflictSide: Set<number>; onSelect: (lit: number) => void }) {
  const byLit = new Map(graph.nodes.map(n => [n.literal, n]))
  const edges = graph.edges.filter(e => shown.has(e.from) && shown.has(e.to))
  const rank = new Map<number, number>()
  const rankOf = (x: number): number => {
    if (rank.has(x)) return rank.get(x) as number
    const preds = edges.filter(e => e.to === x).map(e => e.from)
    const value = preds.length ? 1 + Math.max(...preds.map(rankOf)) : 0
    rank.set(x, value)
    return value
  }
  ;[...shown].forEach(rankOf)
  const rows: number[][] = []
  ;[...shown].forEach(x => { const r = rank.get(x) as number; (rows[r] ||= []).push(x) })
  rows.forEach(row => row.sort((a, b) => (a === CONFLICT ? 1e9 : byLit.get(a)!.trailPosition) - (b === CONFLICT ? 1e9 : byLit.get(b)!.trailPosition)))
  const widest = Math.max(...rows.map(r => r.length))
  const width = PAD * 2 + widest * W + (widest - 1) * GX
  const height = PAD * 2 + rows.length * H + (rows.length - 1) * GY
  const pos = new Map<number, [number, number]>()
  rows.forEach((row, r) => {
    const rowWidth = row.length * W + (row.length - 1) * GX
    row.forEach((x, i) => pos.set(x, [(width - rowWidth) / 2 + i * (W + GX), PAD + r * (H + GY)]))
  })
  return <svg className="z3-graph-svg" viewBox={`0 0 ${width} ${height}`} style={{ minWidth: widest > 4 ? `${width}px` : undefined }} role="img" aria-label="Implication graph. The ordered list below is the written equivalent.">
    <defs><marker id="z3-graph-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0 10 5 0 10Z" className="z3-enc-arrowhead" /></marker></defs>
    {edges.map((e, k) => {
      const [x1, y1] = pos.get(e.from)!, [x2, y2] = pos.get(e.to)!
      const onPath = pathSet.has(e.from) && pathSet.has(e.to)
      return <path key={k} d={`M${x1 + W / 2} ${y1 + H} C ${x1 + W / 2} ${y1 + H + GY / 2}, ${x2 + W / 2} ${y2 - GY / 2}, ${x2 + W / 2} ${y2 - 2}`} className={`z3-graph-edge${onPath ? ' is-path' : ''}${conflictSide.has(e.to) && !conflictSide.has(e.from) ? ' is-cut' : ''}`} markerEnd="url(#z3-graph-arrow)" />
    })}
    {[...shown].map(x => {
      const [px, py] = pos.get(x)!
      const node = byLit.get(x)
      const t = nodeText(x)
      const classes = ['z3-graph-node', x === CONFLICT && 'is-conflict', node?.reasonClauseId === null && 'is-decision', node && node.level < graph.level && 'is-lower', graph.uips.includes(x) && 'is-uip', selected === x && 'is-selected', pathSet.has(x) && 'is-path', conflictSide.has(x) && 'is-conflict-side'].filter(Boolean).join(' ')
      return <g key={x} className={classes} transform={`translate(${px} ${py})`} onClick={() => x !== CONFLICT && onSelect(x)}>
        <rect width={W} height={H} />
        <text x={W / 2} y={H / 2 + 5} textAnchor="middle">{t.base}<tspan baselineShift="sub" fontSize="10">{t.sub}</tspan></text>
        {node && <text x={W - 4} y={11} textAnchor="end" className="z3-graph-level">{node.reasonClauseId === null ? `D${node.level}` : `L${node.level}`}</text>}
        {x === graph.firstUip && <text x={4} y={11} className="z3-graph-uip">UIP</text>}
      </g>
    })}
  </svg>
}

function ImplicationGraphFigure({ trace, graphs }: { trace: Trace; graphs: ImplicationGraphData[] }) {
  const [conflictSeq, setConflictSeq] = useState(126)
  const graph = graphs.find(g => g.conflictSeq === conflictSeq) ?? graphs[0]
  const [expanded, setExpanded] = useState(false)
  const [selected, setSelected] = useState<number>(graph.firstUip)
  const states = useMemo(() => replay(trace.events), [trace])
  const state = states[graph.conflictSeq]
  const clauseOf = (id: number) => trace.clauses[id]
  const byLit = new Map(graph.nodes.map(n => [n.literal, n]))
  const succ = (x: number) => graph.edges.filter(e => e.from === x).map(e => e.to)
  const descendants = (x: number) => { const out = new Set<number>(); const stack = [x]; while (stack.length) { for (const y of succ(stack.pop() as number)) if (!out.has(y) && (y === CONFLICT || byLit.get(y)!.level === graph.level)) { out.add(y); stack.push(y) } } return out }
  const collapsed = new Set([graph.firstUip, ...descendants(graph.firstUip)])
  const shown = expanded ? new Set([...graph.nodes.map(n => n.literal), CONFLICT]) : collapsed
  const isUip = graph.uips.includes(selected)
  const path = !isUip ? graph.witnessPaths[String(selected)] ?? [] : []
  const pathSet = new Set(path)
  const conflictSide = isUip ? descendants(selected) : new Set<number>()
  const cut = isUip ? graph.cutClauses[String(selected)] : null
  const learnEvent = trace.events[graph.conflictSeq + 1]
  const choose = (seq: number) => { const g = graphs.find(x => x.conflictSeq === seq)!; setConflictSeq(seq); setSelected(g.firstUip); setExpanded(false) }
  const candidates = graph.nodes.filter(n => n.level === graph.level && (expanded || collapsed.has(n.literal) || n.reasonClauseId === null))
  const trailVars = new Map(state.trail.map(a => [Math.abs(a.lit), a]))

  const mark = (r: number, c: number): CellMark | undefined => {
    const v = varOf(r, c)
    const a = trailVars.get(v)
    const m: CellMark = {}
    if (a) { m.value = a.lit > 0; if (a.reason === null) { m.decision = true; m.badge = `D${a.level}` } else if (a.reason >= trace.originalClauseCount) { m.learned = true; m.badge = 'L' } }
    if (clauseOf(graph.conflictClauseId).lits.some(l => Math.abs(l) === v)) m.conflict = true
    if (Math.abs(selected) === v) m.fresh = true
    if ([...pathSet].some(l => l !== CONFLICT && Math.abs(l) === v)) m.path = true
    if (!m.value && m.value !== false && !m.conflict) return undefined
    return m
  }

  return <Figure label="Figure 5.1 · Recorded conflict" title={`The conflict at event ${graph.conflictSeq}`} tag={<EngineTag kind="reference" note={`existence run · event ${graph.conflictSeq}`} />}>
    <div className="z3-controls">
      <label className="z3-select">Conflict <select value={conflictSeq} onChange={event => choose(Number(event.target.value))}>{graphs.map(g => <option key={g.conflictSeq} value={g.conflictSeq}>Event {g.conflictSeq} · level {g.level}{g.conflictSeq === 126 ? ' (this chapter)' : ''}</option>)}</select></label>
      <button type="button" className="z3-button" aria-expanded={expanded} onClick={() => setExpanded(!expanded)}>{expanded ? 'Collapse to the conflict’s last steps' : `Expand the full history (${graph.nodes.length} assignments)`}</button>
    </div>
    <div className={`z3-graph-scroll${expanded ? ' is-expanded' : ''}`} tabIndex={expanded ? 0 : undefined} role={expanded ? 'region' : undefined} aria-label={expanded ? 'Full implication graph; scroll sideways if needed' : undefined}>
      <GraphView graph={graph} shown={shown} selected={selected} pathSet={pathSet} conflictSide={conflictSide} onSelect={setSelected} />
    </div>
    {!expanded && <p className="z3-fineprint">Showing the first UIP and what follows it. Its own history, back to the decision <Lit lit={graph.decision} />, is collapsed.</p>}
    <div className="z3-figure-body">
      <div className="z3-stage z3-stage--small">
        <ConstraintBoard regions={board.regions} interactive selectedCell={cellOf(selected)} onSelect={(r, c) => { const v = varOf(r, c); const node = graph.nodes.find(n => Math.abs(n.literal) === v && n.level === graph.level); if (node) setSelected(node.literal) }} label={`Board at event ${graph.conflictSeq}. Activate a cell on the current level to test it as a cut point.`} mark={mark} />
      </div>
      <div className="z3-explain">
        <fieldset className="z3-cut">
          <legend>Test a cut point</legend>
          <div className="z3-cut-options">{candidates.map(n => <label key={n.literal} className={n.literal === selected ? 'is-on' : ''}><input type="radio" name={`cut-${graph.conflictSeq}`} checked={n.literal === selected} onChange={() => setSelected(n.literal)} /><Lit lit={n.literal} />{n.reasonClauseId === null ? ' (decision)' : ''}</label>)}</div>
        </fieldset>
        <div className={`z3-cut-result${isUip ? ' is-ok' : ' is-bad'}`} aria-live="polite">
          {isUip ? <p><Lit lit={selected} /> is a UIP: every path from the decision <Lit lit={graph.decision} /> to ⊥ passes through it. Cutting just after it gives the clause <Clause lits={cut ?? []} />{selected === graph.firstUip ? <>, exactly the learned clause #{learnEvent.learnedClauseId}. It is the first UIP: the one nearest the conflict.</> : <>. That clause is also entailed, but the first UIP, <Lit lit={graph.firstUip} />, is nearer the conflict.</>}</p>
            : <p><Lit lit={selected} /> is not a UIP. This path from the decision to ⊥ avoids it: {path.map((x, i) => <span key={i}>{i > 0 && ' → '}{x === CONFLICT ? '⊥' : <Lit lit={x} />}</span>)}.</p>}
        </div>
        <details className="z3-disclosure">
          <summary>Written equivalent: all {graph.nodes.length} assignments and their reasons</summary>
          <ol className="z3-steps">
            {graph.nodes.map(n => {
              const preds = graph.edges.filter(e => e.to === n.literal).map(e => e.from)
              return <li key={n.literal}><Lit lit={n.literal} /> · level {n.level} · event {n.seq} · {n.reasonClauseId === null ? 'decision' : <>reason <ClauseRef id={n.reasonClauseId} lits={clauseOf(n.reasonClauseId).lits} sources={clauseOf(n.reasonClauseId).sources} />; from {preds.map((p, i) => <span key={p}>{i > 0 && ', '}<Lit lit={p} /></span>)}</>}{graph.uips.includes(n.literal) ? ' · UIP' : ''}</li>
            })}
            <li>⊥ · conflict clause <ClauseRef id={graph.conflictClauseId} lits={clauseOf(graph.conflictClauseId).lits} sources={clauseOf(graph.conflictClauseId).sources} />; from {clauseOf(graph.conflictClauseId).lits.map((l, i) => <span key={l}>{i > 0 && ', '}<Lit lit={-l} /></span>)}</li>
          </ol>
        </details>
      </div>
    </div>
  </Figure>
}

export function Chapter5({ ui, data }: ChapterProps) {
  const { Section } = ui
  const trace = data?.existence
  const g = data?.teaching.implicationGraphs.find(x => x.conflictSeq === 126)
  return <Section id="z3-conflict" label="Chapter 5" title="A conflict has a graph">
    <Lede>A contradiction has a history. Following the clauses that forced its literals reveals a small set of assignments responsible for the failure.</Lede>
    <p>At event 126 of the recorded run the trail has one decision, <Lit lit={2} />. Write u = q<sub>27</sub>, f = q<sub>57</sub>, g = q<sub>67</sub>, h = q<sub>77</sub>. Propagation made u true because the rest of row 2 was already false. Column 7’s pairs then made f, g and h false. Those three cells are all of region F, so region F’s at-least-one clause (f ∨ g ∨ h) is false.</p>
    {trace && data ? <ImplicationGraphFigure trace={trace} graphs={data.teaching.implicationGraphs} /> : <Unavailable what="The implication graph" />}
    <h3>The derivation</h3>
    <Statement kind="Definition" label="5.1 · implication graph">
      <p>The nodes are the trail’s assignments plus a conflict node ⊥. For each implied literal ℓ with reason C, draw an edge to ℓ from the assignment ¬m for every other literal m of C (those assignments made C unit). Draw edges from the assignments that falsify the conflict clause to ⊥.</p>
    </Statement>
    <Statement kind="Definition" label="5.2 · UIP">
      <p>Let d be the decision of the current level. A <Term id="uip">unique implication point (UIP)</Term> is a current-level node that lies on every path from d to ⊥. The decision itself is always one. The <em>first UIP</em> is the one nearest ⊥.</p>
    </Statement>
    <Statement kind="Theorem" label="5.3">
      <p>Start from the conflict clause and repeatedly resolve it with the reason of its current-level literal that was assigned last, until exactly one current-level literal remains. The result is the clause read off the cut just after the first UIP: ¬(first UIP) together with the negations of the lower-level assignments that cross the cut. (This is before any optional minimization.)</p>
    </Statement>
    {g && <p>Here the current level’s UIPs are {g.uips.map((u, i) => <span key={u}>{i > 0 && ' and '}<Lit lit={u} /></span>)}. The first UIP is u = <Lit lit={g.firstUip} />, a propagated literal, not the decision. Cutting after it gives ¬u = ¬q<sub>27</sub>: whatever else is true, a queen on r2c7 empties region F. Cutting after the decision instead gives <Clause lits={g.cutClauses[String(g.decision)] ?? []} />, which is also valid but says less. The build checks that every UIP’s cut clause is entailed by F.</p>}
    <CheckYourself question="Why is choosing an arbitrary recent cell insufficient to identify a UIP?">
      <p>Being a UIP is about paths, not timing. ¬q<sub>77</sub> is the last assignment before the conflict, yet the path q<sub>12</sub> → ¬q<sub>23</sub> → q<sub>27</sub> → ¬q<sub>67</sub> → ⊥ avoids it, so ¬q<sub>77</sub> does not explain the conflict alone. In graph terms a UIP dominates ⊥ from the decision. Select ¬q<sub>77</sub> in the cut test above to see that path.</p>
    </CheckYourself>
    <ReadSource items={[
      { id: 'P8', locator: '§4.4.3', why: 'implication graphs, UIPs and first-UIP clause learning (redrawn here with Queens literals).' },
      { id: 'P10', locator: '§3', why: 'the original conflict-analysis procedure with implication graphs and UIPs in GRASP.' },
    ]} />
  </Section>
}

