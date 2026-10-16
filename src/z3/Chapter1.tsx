import { useMemo, useState } from 'react'
import { ConstraintBoard, QueenGlyph } from './ConstraintBoard'
import { board, formatCount, varOf, type TeachingData } from './data'
import { CheckYourself, Figure, Formula, Lede, Proof, ReadSource, Statement, Term, Unavailable } from './format'
import { range, type ChapterProps } from './ui'

const n = board.size
const regionLabels = [...new Set(board.regions.flat())].sort()
const regionCells = (k: string) => range(1, n).flatMap(r => range(1, n).filter(c => board.regions[r - 1][c - 1] === k).map(c => [r, c] as [number, number]))

function Sum({ label, cells, value }: { label: string; cells: [number, number][]; value: (r: number, c: number) => boolean }) {
  const total = cells.reduce((sum, [r, c]) => sum + (value(r, c) ? 1 : 0), 0)
  const ok = total === 1
  const expanded = cells.length <= 7
  const spoken = `${label}: the indicators sum to ${total}; ${ok ? 'equal to 1, satisfied' : 'not equal to 1, violated'}`
  return <div className={`z3-sum${ok ? ' is-ok' : ' is-bad'}`}>
    <span className="z3-sum-label">{label}</span>
    <Formula spoken={spoken}>
      {expanded
        ? <>{cells.map(([r, c], i) => <span key={`${r}${c}`}>{i > 0 && ' + '}[q<sub>{r}{c}</sub>]</span>)} = {cells.map(([r, c]) => value(r, c) ? 1 : 0).join('+')}</>
        : <>Σ over {cells.length} cells [q<sub>v</sub>]</>}
      {' = '}<strong>{total}</strong> {ok ? '= 1' : '≠ 1'}
    </Formula>
    <span className="z3-sum-verdict">{ok ? '✓ satisfied' : `✗ ${total} = 1 is false`}</span>
  </div>
}

function Funnel({ funnel }: { funnel: TeachingData['funnel'] }) {
  const max = Math.log10(Number(funnel.stages[0].count))
  return <figure className="z3-funnel">
    <ol>
      {funnel.stages.map(stage => {
        const count = Number(stage.count)
        const width = count <= 1 ? 1.5 : Math.max(1.5, (Math.log10(count) / max) * 100)
        return <li key={stage.id}>
          <div className="z3-funnel-bar" style={{ width: `${width}%` }} aria-hidden="true" />
          <div className="z3-funnel-text">
            <span className="z3-funnel-label">{stage.label}</span>
            <strong className="z3-funnel-count">{formatCount(stage.count)}</strong>
            <span className="z3-funnel-formula">{stage.formula === 'enumerated' ? 'counted by enumeration' : stage.formula.replace('^', ' to the power ')}</span>
          </div>
        </li>
      })}
    </ol>
    <figcaption>Bar length is logarithmic. Each line is a subset of the line above it. These count sets of assignments; they are not predictions of how many decisions a solver makes.</figcaption>
  </figure>
}

function VariableLab({ funnel }: { funnel?: TeachingData['funnel'] }) {
  const [queens, setQueens] = useState<Set<number>>(() => new Set())
  const [selected, setSelected] = useState<[number, number]>([1, 3])
  const [announcement, setAnnouncement] = useState('')
  const value = (r: number, c: number) => queens.has(varOf(r, c))
  const [sr, sc] = selected
  const region = board.regions[sr - 1][sc - 1]

  const evaluation = useMemo(() => {
    const has = (r: number, c: number) => queens.has(varOf(r, c))
    const rows = range(1, n).filter(r => range(1, n).filter(c => has(r, c)).length === 1).length
    const columns = range(1, n).filter(c => range(1, n).filter(r => has(r, c)).length === 1).length
    const regions = regionLabels.filter(k => regionCells(k).filter(([r, c]) => has(r, c)).length === 1).length
    const placed = [...queens].map(v => [Math.floor((v - 1) / n) + 1, ((v - 1) % n) + 1])
    let touching = 0
    placed.forEach(([r1, c1], i) => placed.slice(i + 1).forEach(([r2, c2]) => { if (Math.max(Math.abs(r1 - r2), Math.abs(c1 - c2)) === 1) touching++ }))
    return { rows, columns, regions, touching, satisfied: rows === n && columns === n && regions === n && touching === 0 }
  }, [queens])

  const toggle = (r: number, c: number) => {
    const v = varOf(r, c)
    const next = new Set(queens)
    if (next.has(v)) next.delete(v); else next.add(v)
    setQueens(next)
    setSelected([r, c])
    const rowSum = range(1, n).filter(col => next.has(varOf(r, col))).length
    setAnnouncement(`q${r}${c} set ${next.has(v) ? 'true' : 'false'}. Row ${r} sum is ${rowSum}${rowSum === 1 ? ', satisfied' : ', not 1'}.`)
  }
  const on = value(sr, sc)

  return <Figure label="Figure 1.1 · Manipulation" title="Squares become variables" tag={<p className="z3-engine-tag z3-engine-tag--illustration"><span className="z3-engine-mark" aria-hidden="true">YOU</span><span>Your assignment · evaluated in this browser · no solver involved</span></p>}>
    <div className="z3-figure-body">
      <div className="z3-stage">
        <ConstraintBoard regions={board.regions} label="7 by 7 board. Activate a cell to toggle a queen and inspect its variable." interactive selectedCell={selected} onSelect={toggle} mark={(r, c) => value(r, c) ? { value: true } : undefined} />
        <div className="z3-board-actions">
          <button type="button" className="z3-button" onClick={() => { setQueens(new Set()); setAnnouncement('Board cleared. Every variable is false.') }}>Clear the board</button>
          <span className="z3-hint">Try r1c3, then r1c5.</span>
        </div>
      </div>
      <div className="z3-explain">
        <div className="z3-truth-tile" aria-label={`Selected cell r${sr}c${sc} is variable q${sr}${sc}, currently ${on ? 'true' : 'false'}`}>
          <span className="z3-truth-cell">r{sr}c{sc} · region {region}</span>
          <span className="z3-truth-arrow" aria-hidden="true">↔</span>
          <span className="z3-truth-var"><span aria-hidden="true">q<sub>{sr}{sc}</sub></span></span>
          <span className={`z3-truth-value${on ? ' is-true' : ''}`}>{on ? <><QueenGlyph /> true</> : 'false'}</span>
          <span className="z3-truth-indicator">[q<sub>{sr}{sc}</sub>] = {on ? 1 : 0}</span>
        </div>
        <Sum label={`Row ${sr}`} cells={range(1, n).map(c => [sr, c] as [number, number])} value={value} />
        <Sum label={`Column ${sc}`} cells={range(1, n).map(r => [r, sc] as [number, number])} value={value} />
        <Sum label={`Region ${region}`} cells={regionCells(region)} value={value} />
        <p className="z3-scoreline">
          <span>Rows {evaluation.rows}/7</span><span>Columns {evaluation.columns}/7</span><span>Regions {evaluation.regions}/7</span><span>Touching pairs {evaluation.touching}</span>
        </p>
        <p className={`z3-verdict${evaluation.satisfied ? ' is-ok' : ''}`}>{evaluation.satisfied
          ? <>F is true under this assignment. It is a witness, so F is satisfiable.</>
          : <>F is false under this assignment: at least one equation or touching clause fails.</>}</p>
        <p className="sr-only" aria-live="polite">{announcement}</p>
      </div>
    </div>
    <div className="z3-figure-foot">
      <h4>Three sets, one inside the next</h4>
      {funnel ? <Funnel funnel={funnel} /> : <Unavailable what="The set funnel" />}
    </div>
  </Figure>
}

export function Chapter1({ ui, data }: ChapterProps) {
  const { Section } = ui
  return <Section id="z3-variables" label="Chapter 1" title="A board is a proposition">
    <Lede>Every square asks a yes-or-no question: does it contain a queen? The puzzle becomes one proposition whose satisfying assignments are exactly the legal boards.</Lede>
    <p>Number rows and columns from 1, and write the cell in row 1, column 3 as r1c3. Each cell gets a Boolean variable: the cell in row <em>r</em>, column <em>c</em> gets q<sub><em>rc</em></sub>. So q<sub>13</sub> asks “is there a queen in r1c3?”</p>
    <VariableLab funnel={data?.teaching.funnel} />
    <h3>The derivation</h3>
    <Statement kind="Definition" label="1.1">
      <p>Let V = [7] × [7] be the 49 cells, and let the regions A, …, G partition V into seven nonempty sets. An <Term id="assignment">assignment</Term> α gives each variable q<sub>v</sub> (v ∈ V) the value true or false. Its indicator [q<sub>v</sub>] is 1 when α(q<sub>v</sub>) is true and 0 otherwise.</p>
    </Statement>
    <p>The puzzle is the conjunction F of four families of constraints. Two cells u ≠ v <em>touch</em> when they are at Chebyshev distance 1, that is, max(|r − r′|, |c − c′|) = 1.</p>
    <Formula spoken="F equals: for every row r, the sum over columns c of the indicator of q r c equals 1; and for every column c, the sum over rows equals 1; and for every region R, the sum over its cells equals 1; and for every touching pair u, v, not q u or not q v.">
      F = ⋀<sub>r</sub> (Σ<sub>c</sub> [q<sub>rc</sub>] = 1) ∧ ⋀<sub>c</sub> (Σ<sub>r</sub> [q<sub>rc</sub>] = 1) ∧ ⋀<sub>R</sub> (Σ<sub>v∈R</sub> [q<sub>v</sub>] = 1) ∧ ⋀<sub>u~v</sub> (¬q<sub>u</sub> ∨ ¬q<sub>v</sub>)
    </Formula>
    <Statement kind="Proposition" label="1.2">
      <p>The map P ↦ α<sub>P</sub>, where α<sub>P</sub>(q<sub>v</sub>) is true exactly when v ∈ P, is a bijection from legal placements P ⊆ V to assignments that make F true.</p>
    </Statement>
    <Proof>If P is legal, every row, column and region contains exactly one cell of P, so every sum equals 1; no two cells of P touch, so each touching clause has a false literal. Conversely, if α makes F true, let P = {"{"}v : α(q<sub>v</sub>) = true{"}"}. The sums give one cell of P per row, column and region, and the touching clauses forbid adjacent pairs, so P is legal. The two constructions are inverse to each other.</Proof>
    <p>A formula is <Term id="sat">satisfiable (SAT)</Term> when some assignment makes it true; that assignment is a <em>witness</em> or <em>model</em>. It is <Term id="unsat">unsatisfiable (UNSAT)</Term> when no assignment does. By Proposition 1.2, solving the puzzle means finding a witness for F, and proving the puzzle has no other answer means proving a related formula UNSAT (Chapter 8).</p>
    <p>The counts in Figure 1.1 are exact. There are 2<sup>49</sup> assignments. Requiring one queen per row leaves 7<sup>7</sup> = 823,543 placements; also one per column leaves the 7! = 5,040 permutations. Of those, 646 have no touching pair, and exactly one also uses every region once. (One queen per region alone, without the touching rule, would leave {data ? data.teaching.funnel.regionalPermutations : '…'} permutations.)</p>
    <CheckYourself question="F has 49 Boolean variables. Why does that not mean 49 queens?">
      <p>A variable is a question about one square, not a queen. An assignment answers all 49 questions at once. The row equations force exactly seven of the answers to be “yes”, one per row. Most of the 2<sup>49</sup> assignments put the wrong number of queens somewhere and make F false.</p>
    </CheckYourself>
    <ReadSource items={[
      { id: 'P1', locator: 'whole short paper', why: 'the Z3 architecture at the time of its first release; not today’s parameter defaults.' },
      { id: 'P2', locator: '§2', why: 'how Z3’s API states Boolean and arithmetic constraints such as Sum(If(q, 1, 0)) == 1.' },
      { id: 'P12', locator: '§7.2.2.2 (optional)', why: 'a careful introduction to satisfiability as a mathematical object.' },
    ]} />
  </Section>
}
