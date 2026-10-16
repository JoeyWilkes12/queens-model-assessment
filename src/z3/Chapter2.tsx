import { useState } from 'react'
import { ConstraintBoard } from './ConstraintBoard'
import { board, groupLabel, type EncodingName, type TeachingData } from './data'
import { CheckYourself, Clause, Figure, Formula, Lede, ReadSource, Statement, Term, Unavailable } from './format'
import { range, type ChapterProps } from './ui'
import { alternativeModels } from './workbench'

const ENCODINGS: { id: EncodingName; label: string }[] = [
  { id: 'pairwise', label: 'Pairwise' },
  { id: 'sequential', label: 'Sequential (Sinz)' },
  { id: 'commander', label: 'Commander' },
]

const GAP = 62, CELL = 46, LEFT = 24
const cx = (i: number) => LEFT + (i - 1) * GAP + CELL / 2

function EncodingDrawing({ encoding, enc, row, selected }: { encoding: EncodingName; enc: TeachingData['encodings']['row'][EncodingName]; row: number; selected: Set<number> | null }) {
  const width = LEFT * 2 + 6 * GAP + CELL
  const cellsY = encoding === 'pairwise' ? 132 : 70
  const auxY = cellsY + CELL + 64
  const height = encoding === 'pairwise' ? cellsY + CELL + 46 : encoding === 'sequential' ? auxY + 44 : auxY + 96
  const on = (v: number) => !selected || selected.has(v)
  const edgeOn = (a: number, b: number) => !!selected && selected.has(a) && selected.has(b)
  const auxX = (id: number): number => {
    if (encoding === 'sequential') return cx(id - 7) + GAP / 2
    const aux = enc.aux.find(a => a.id === id)
    if (aux?.members?.length) {
      const xs: number[] = aux.members.map(m => (m <= 7 ? cx(m) : auxX(m)))
      return xs.reduce((a, b) => a + b, 0) / xs.length
    }
    return cx(4)
  }
  const auxLevelY = (id: number) => {
    const aux = enc.aux.find(a => a.id === id)
    return aux?.members?.some(m => m > 7) ? auxY + 64 : auxY
  }
  const edges: { a: number; b: number; d: string; kind: 'pair' | 'imp' | 'chain' | 'block' }[] = []
  if (encoding === 'pairwise') {
    for (let i = 1; i <= 7; i++) for (let j = i + 1; j <= 7; j++) {
      const h = 14 + (j - i) * 17
      edges.push({ a: i, b: j, kind: 'pair', d: `M${cx(i)} ${cellsY} C ${cx(i)} ${cellsY - h}, ${cx(j)} ${cellsY - h}, ${cx(j)} ${cellsY}` })
    }
  } else if (encoding === 'sequential') {
    for (let i = 1; i <= 6; i++) edges.push({ a: i, b: 7 + i, kind: 'imp', d: `M${cx(i)} ${cellsY + CELL} L ${auxX(7 + i)} ${auxY - 14}` })
    for (let i = 2; i <= 6; i++) edges.push({ a: 7 + i - 1, b: 7 + i, kind: 'chain', d: `M${auxX(7 + i - 1) + 14} ${auxY} L ${auxX(7 + i) - 14} ${auxY}` })
    for (let i = 2; i <= 7; i++) edges.push({ a: 7 + i - 1, b: i, kind: 'block', d: `M${auxX(7 + i - 1)} ${auxY - 14} L ${cx(i)} ${cellsY + CELL}` })
  } else {
    for (const aux of enc.aux) {
      const members = aux.members || []
      for (const m of members) {
        const mx = m <= 7 ? cx(m) : auxX(m)
        const my = m <= 7 ? cellsY + CELL : auxLevelY(m) + 14
        edges.push({ a: m, b: aux.id, kind: 'imp', d: `M${mx} ${my} L ${auxX(aux.id)} ${auxLevelY(aux.id) - 14}` })
      }
      if (members.every(m => m <= 7)) for (let p = 0; p < members.length; p++) for (let q = p + 1; q < members.length; q++) {
        const i = members[p], j = members[q], h = 14 + (j - i) * 17
        edges.push({ a: i, b: j, kind: 'pair', d: `M${cx(i)} ${cellsY} C ${cx(i)} ${cellsY - h}, ${cx(j)} ${cellsY - h}, ${cx(j)} ${cellsY}` })
      }
    }
    const top = enc.aux.filter(a => a.members?.every(m => m <= 7)).map(a => a.id)
    for (let p = 0; p < top.length; p++) for (let q = p + 1; q < top.length; q++) {
      const x1 = auxX(top[p]), x2 = auxX(top[q]), y = auxY + 14
      edges.push({ a: top[p], b: top[q], kind: 'pair', d: `M${x1} ${y} C ${x1} ${y + 30 + (q - p) * 12}, ${x2} ${y + 30 + (q - p) * 12}, ${x2} ${y}` })
    }
  }
  const auxName = (id: number) => enc.aux.find(a => a.id === id)?.name ?? ''
  return <svg className="z3-encoding-svg" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`${encoding} encoding of exactly one for row ${row}: ${enc.clauses.length} clauses over 7 cell variables and ${enc.aux.length} auxiliary variables. The clause list below is the written equivalent.`}>
    <defs>
      <marker id={`z3-arrow-${encoding}`} viewBox="0 0 10 10" refX="9" refY="5" markerUnits="userSpaceOnUse" markerWidth="9" markerHeight="9" orient="auto-start-reverse"><path d="M0 0 10 5 0 10Z" className="z3-enc-arrowhead" /></marker>
    </defs>
    {edges.map((edge, k) => <path key={k} d={edge.d} className={`z3-enc-edge z3-enc-edge--${edge.kind}${edgeOn(edge.a, edge.b) ? ' is-on' : selected ? ' is-off' : ''}`} markerEnd={edge.kind === 'imp' || edge.kind === 'chain' ? `url(#z3-arrow-${encoding})` : undefined} />)}
    {range(1, 7).map(i => <g key={i} className={`z3-enc-cell${on(i) ? '' : ' is-off'}${selected?.has(i) ? ' is-on' : ''}`} transform={`translate(${cx(i) - CELL / 2} ${cellsY})`}>
      <rect width={CELL} height={CELL} />
      <text x={CELL / 2} y={CELL / 2 + 6} textAnchor="middle">q<tspan baselineShift="sub" fontSize="12">{row}{i}</tspan></text>
    </g>)}
    {enc.aux.map(aux => <g key={aux.id} className={`z3-enc-aux${on(aux.id) ? '' : ' is-off'}${selected?.has(aux.id) ? ' is-on' : ''}`} transform={`translate(${auxX(aux.id)} ${auxLevelY(aux.id)})`}>
      <circle r="15" />
      <text y="5" textAnchor="middle">{auxName(aux.id).replace(/\d+/, '')}<tspan baselineShift="sub" fontSize="10">{auxName(aux.id).replace(/\D+/, '')}</tspan></text>
    </g>)}
    <text x={LEFT} y={height - 10} className="z3-enc-note">{encoding === 'pairwise' ? 'arcs: “not both” pairs · the ALO clause spans all seven cells' : encoding === 'sequential' ? 'solid arrows: implications · dashed: s blocks the next cell · circles are auxiliary, not cells' : 'arrows: member → commander · arcs: “not both” · circles are auxiliary, not cells'}</text>
  </svg>
}

function ClauseEncodingLab({ teaching }: { teaching: TeachingData }) {
  const [row, setRow] = useState(1)
  const [encoding, setEncoding] = useState<EncodingName>('pairwise')
  const [clauseIndex, setClauseIndex] = useState<number | null>(null)
  const enc = teaching.encodings.row[encoding]
  const names = (lit: number) => {
    const v = Math.abs(lit)
    return v <= 7 ? `q${row}${v}` : enc.aux.find(a => a.id === v)?.name
  }
  const selected = clauseIndex === null ? null : new Set(enc.clauses[clauseIndex].lits.map(Math.abs))
  const counts = teaching.encodings.sizes.find(s => s.m === 7)![encoding]
  const choose = (next: EncodingName) => { setEncoding(next); setClauseIndex(null) }
  return <Figure label="Figure 2.1 · Manipulation" title="One row, three exact-one encodings" tag={<p className="z3-engine-tag z3-engine-tag--illustration"><span className="z3-engine-mark" aria-hidden="true">CNF</span><span>Generated clauses · checked exhaustively and with Z3 at build time</span></p>}>
    <div className="z3-controls">
      <div className="z3-segmented" role="radiogroup" aria-label="Encoding">
        {ENCODINGS.map(item => <button type="button" role="radio" aria-checked={encoding === item.id} key={item.id} onClick={() => choose(item.id)}>{item.label}</button>)}
      </div>
      <label className="z3-select">Row <select value={row} onChange={event => { setRow(Number(event.target.value)); setClauseIndex(null) }}>{range(1, 7).map(r => <option key={r} value={r}>Row {r}</option>)}</select></label>
    </div>
    <div className="z3-counters" aria-label="Encoding size">
      <div><span>Board variables</span><strong>7</strong></div>
      <div><span>Auxiliary</span><strong>{counts.aux}</strong></div>
      <div><span>Clauses</span><strong>{counts.clauses}</strong></div>
      <div><span>Literal occurrences</span><strong>{counts.literalOccurrences}</strong></div>
    </div>
    <div className="z3-encoding-stage">
      <EncodingDrawing encoding={encoding} enc={enc} row={row} selected={selected} />
    </div>
    <div className="z3-figure-body">
      <div className="z3-stage z3-stage--small">
        <p className="z3-mini-label">Locator: row {row} on the board{selected ? '; selected clause cells outlined' : ''}</p>
        <ConstraintBoard compact regions={board.regions} label={`Locator board. Row ${row} is bracketed.`} bracketRows={[row]} mark={(r, c) => r === row && selected?.has(c) ? { highlight: true } : r === row ? undefined : { dim: true }} />
        <p className="z3-hint">Auxiliary variables never appear on the board.</p>
      </div>
      <div className="z3-explain">
        <p className="z3-mini-label">{enc.clauses.length} clauses · select one to locate its variables</p>
        <ol className="z3-clause-list">
          {enc.clauses.map((clause, k) => <li key={k}><button type="button" aria-pressed={clauseIndex === k} onClick={() => setClauseIndex(clauseIndex === k ? null : k)}>
            <Clause lits={clause.lits} names={names} parens={false} /><span className="z3-clause-role">{clause.role.replace(/x(\d)/g, (_, i) => `q${row}${i}`)}</span>
          </button></li>)}
        </ol>
      </div>
    </div>
  </Figure>
}

function CountTables({ teaching, ui }: { teaching: TeachingData; ui: ChapterProps['ui'] }) {
  const { DataTable } = ui
  const cell = (c: { clauses: number; aux: number }) => c.aux ? `${c.clauses} (${c.aux} aux)` : `${c.clauses}`
  const rows = teaching.encodings.groups.filter(g => !g.name.startsWith('row:') && !g.name.startsWith('column:'))
  const g = teaching.generatedVsDistinct
  return <>
    <DataTable caption="Clauses for each exactly-one group on the 7×7 board (touching clauses excluded)" headers={['Group', 'Cells', 'Pairwise', 'Sequential', 'Commander']} rows={[
      ['Each row (7 groups)', '7', cell(teaching.encodings.groups[0].pairwise), cell(teaching.encodings.groups[0].sequential), cell(teaching.encodings.groups[0].commander)],
      ['Each column (7 groups)', '7', cell(teaching.encodings.groups[7].pairwise), cell(teaching.encodings.groups[7].sequential), cell(teaching.encodings.groups[7].commander)],
      ...rows.map(r => [groupLabel(r.name).replace(/^region/, 'Region'), String(r.size), cell(r.pairwise), cell(r.sequential), cell(r.commander)]),
      ['All 21 groups', '147', cell(teaching.encodings.boardTotals.pairwise), cell(teaching.encodings.boardTotals.sequential), cell(teaching.encodings.boardTotals.commander)],
    ]} />
    <DataTable caption="The full pairwise board CNF: generated versus distinct clauses" headers={['Family', 'Generated', 'Distinct (new)', 'Repeats of an earlier clause']} rows={[
      ...g.byFamily.map(f => [f.family === 'touching' ? 'Touching (diagonal pairs)' : `${f.family[0].toUpperCase()}${f.family.slice(1)} exactly-one`, String(f.generated), String(f.new), String(f.generated - f.new)]),
      ['Total', String(g.generated), String(g.distinct), String(g.duplicates)],
    ]} />
  </>
}

const alt = alternativeModels(board.regions)

/** Sidebar: the integer-per-row and conflict-graph models (adapted from the Constraint Atlas encodings section). */
function OtherModels() {
  const { integer: i, graph: g } = alt
  return <details className="z3-disclosure z3-sidebar">
    <summary>Sidebar · Other ways to model the board</summary>
    <div className="z3-sidebar-body">
      <p>A Boolean per cell is one choice of variables. Two others are common. On this board each has exactly one solution, the same placement as the Boolean grid (Chapter 8 reveals it).</p>
      <h4>Integer per row</h4>
      <Formula spoken="q r is in 1 to 7 for each row r; all different q 1 through q 7; for each region R, the sum over rows r of the indicator that cell r, q r lies in R equals 1; and for r from 1 to 6, the absolute value of q r minus q r plus 1 is not 1.">
        q<sub>r</sub> ∈ {"{"}1, …, 7{"}"};  AllDifferent(q<sub>1</sub>, …, q<sub>7</sub>);  Σ<sub>r</sub> [(r, q<sub>r</sub>) ∈ R] = 1 for each region R;  |q<sub>r</sub> − q<sub>r+1</sub>| ≠ 1
      </Formula>
      <dl className="z3-facts">
        <div><dt>Variables</dt><dd>{i.variables} integers with domain {"{"}1, …, {i.domain}{"}"}; the row rule holds by construction.</dd></div>
        <div><dt>Constraints</dt><dd>{i.constraints}: 1 AllDifferent ({i.allDifferentPairs} disequalities if expanded, so {i.constraintsExpanded} in all), {i.regionCounts} region counts using {i.membershipTests} membership tests, and {i.touching} touching disequalities. Same-row touches are impossible, and |Δ| = 0 is already excluded by AllDifferent.</dd></div>
        <div><dt>Natural when</dt><dd>each item must take exactly one value from a domain (one column per row, one slot per exam); irregular regions then become lookups instead of sums.</dd></div>
      </dl>
      <h4>Conflict graph</h4>
      <Formula spoken="G has the 49 cells as vertices, with an edge between two cells that share a row or a column or touch. A placement is an independent set S with 7 elements that meets every region R exactly once.">
        G = (V, E), uv ∈ E ⟺ u, v share a row or column or touch;  placement = independent S ⊆ V, |S| = 7, |S ∩ R| = 1 for every region R
      </Formula>
      <dl className="z3-facts">
        <div><dt>Variables</dt><dd>{g.vertices} vertices, one per cell (a Boolean each when written as clauses).</dd></div>
        <div><dt>Constraints</dt><dd>{g.queenEdges} edges ({g.rowEdges} row pairs, {g.columnEdges} column pairs, {g.touchingEdges} diagonal touches), the size condition |S| = 7, and {g.regions} region conditions. Joining same-region cells too adds {g.regionOnlyEdges} edges; then every independent set of size 7 is a solution, and the {g.allEdges} edges are exactly the clauses of the form (¬q<sub>u</sub> ∨ ¬q<sub>v</sub>) in the pairwise CNF above.</dd></div>
        <div><dt>Natural when</dt><dd>the problem is mostly pairwise incompatibility, as in frequency assignment or register allocation. A clique holds at most one chosen vertex, which is an at-most-one constraint, so graph tools apply directly.</dd></div>
      </dl>
      <p className="z3-fineprint">Counts computed in this page from the board; the build checks them independently and solves the integer model by enumeration and with Z3.</p>
    </div>
  </details>
}

export function Chapter2({ ui, data }: ChapterProps) {
  const { Section } = ui
  const t = data?.teaching
  const w = t?.encodings.auxWitness
  return <Section id="z3-clauses" label="Chapter 2" title="Exactly one, written as clauses">
    <Lede>Exactly one combines two claims: at least one square is occupied, and no pair is occupied together. Different clause encodings express the same choices while giving the solver different auxiliary structure.</Lede>
    <p>A <Term id="literal">literal</Term> is a variable x or its negation ¬x. A <Term id="clause">clause</Term> is a disjunction of literals, such as (¬q<sub>13</sub> ∨ ¬q<sub>14</sub>); it is true when at least one of its literals is true. The <em>empty clause</em> □ has no literals and is always false. A formula in <Term id="cnf">conjunctive normal form (CNF)</Term> is a conjunction of clauses: every clause must hold.</p>
    {t ? <ClauseEncodingLab teaching={t} /> : <Unavailable what="The encoding lab" />}
    <h3>The derivation</h3>
    <Statement kind="Definition" label="2.1 · pairwise">
      <p>For cells x<sub>1</sub>, …, x<sub>m</sub>: one at-least-one (ALO) clause and one at-most-one (AMO) clause per pair.</p>
      <Formula spoken="x 1 or through x m, and for all i less than j, not x i or not x j. One plus m choose 2 clauses, no auxiliary variables.">(x<sub>1</sub> ∨ … ∨ x<sub>m</sub>) ∧ ⋀<sub>i&lt;j</sub> (¬x<sub>i</sub> ∨ ¬x<sub>j</sub>) — 1 + C(m, 2) clauses, no auxiliaries.</Formula>
    </Statement>
    <Statement kind="Definition" label="2.2 · sequential (Sinz)">
      <p>Add auxiliaries s<sub>1</sub>, …, s<sub>m−1</sub>. The AMO part is (¬x<sub>1</sub> ∨ s<sub>1</sub>), (¬x<sub>m</sub> ∨ ¬s<sub>m−1</sub>) and, for 2 ≤ i ≤ m − 1, the three clauses (¬x<sub>i</sub> ∨ s<sub>i</sub>), (¬s<sub>i−1</sub> ∨ s<sub>i</sub>), (¬x<sub>i</sub> ∨ ¬s<sub>i−1</sub>). That is 3m − 4 clauses for m ≥ 2; one ALO clause makes 3m − 3. For m = 1 use the unit clause (x<sub>1</sub>).</p>
    </Statement>
    <Statement kind="Definition" label="2.3 · commander">
      <p>For m ≤ 3 use pairwise. Otherwise split the cells into g = ⌈m/3⌉ consecutive groups G<sub>j</sub> of at most three (a singleton group is kept). Give each group a commander c<sub>j</sub> with pairwise AMO inside the group, (¬x ∨ c<sub>j</sub>) for each member x, and (¬c<sub>j</sub> ∨ ⋁G<sub>j</sub>). Then require exactly one commander, recursively. With group sizes t<sub>j</sub>:</p>
      <Formula spoken="E of m equals m plus g plus the sum over j of t j choose 2, plus E of g. A of m equals g plus A of g.">E(m) = m + g + Σ<sub>j</sub> C(t<sub>j</sub>, 2) + E(g),  A(m) = g + A(g).</Formula>
    </Statement>
    <Statement kind="Theorem" label="2.4">
      <p>For each encoding E(x, y) with auxiliaries y: an assignment to x extends to a model of E exactly when one x<sub>i</sub> is true. In symbols, ∃y E(x, y) ⟺ Σ<sub>i</sub> [x<sub>i</sub>] = 1.</p>
    </Statement>
    <p>The build checks Theorem 2.4 twice. It tries every assignment for 1 ≤ m ≤ 9 ({t ? t.encodings.validation.exhaustiveAssignmentChecks.toLocaleString('en-US') : '2,044'} cases for the two encodings with auxiliaries). It also asks Z3 that E ∧ ¬(exactly one) is UNSAT and that each single-queen input extends, for every group size on this board. For a seven-cell row the counts are 22 clauses with no auxiliaries, 18 with 6, and 20 with 3. Fewer clauses do not prove faster solving.</p>
    <p>This book’s reference CNF uses pairwise exactly-one for all 21 groups, plus one clause (¬q<sub>u</sub> ∨ ¬q<sub>v</sub>) for each diagonally touching pair; orthogonal neighbours are already excluded by the row and column pairs. Generation produces {t ? t.generatedVsDistinct.generated : 664} clauses and {t ? t.generatedVsDistinct.distinct : 513} distinct ones: for example, region B lies inside row 1, so all six of its pairs repeat row 1’s. Every repeat keeps its source label.</p>
    {t && <CountTables teaching={t} ui={ui} />}
    <OtherModels />
    <CheckYourself question="Why can an auxiliary variable be true without adding a queen?">
      <p>An auxiliary is not a square. In the sequential encoding s<sub>i</sub> says “some cell among the first i is occupied”, not “cell i is occupied”. With only q<sub>13</sub> true in the row, the clauses force s<sub>3</sub>, s<sub>4</sub>, s<sub>5</sub> and s<sub>6</sub> to be true{w ? <> (recorded: s = [{w.exactlyOneX3.s.map(v => v ? 1 : 0).join(', ')}])</> : null} while there is still exactly one queen. In the at-most-one part alone, even with every cell false, s<sub>5</sub> = s<sub>6</sub> = true is allowed{w ? <> (recorded witness: s = [{w.amoOnlyAllFalse.s.map(v => v ? 1 : 0).join(', ')}])</> : null}. Only the projection onto the cell variables has to mean “exactly one”.</p>
    </CheckYourself>
    <ReadSource items={[
      { id: 'P3', locator: 'Definition 1, §2, Fig. 1, Theorem 1', why: 'the sequential counter and why only its projection matters.' },
      { id: 'P4', locator: '§§2–2.2, Figs. 1–4', why: 'the commander hierarchy for selecting one of n objects.' },
      { id: 'P5', locator: '§1, printed p. 467', why: 'auxiliary names for subformulas: the idea behind every encoding with extra variables.' },
      { id: 'P21', locator: 'whole short paper', why: 'drawing a problem as a constraint graph, as in the sidebar, and what its structure shows.' },
    ]} />
  </Section>
}
