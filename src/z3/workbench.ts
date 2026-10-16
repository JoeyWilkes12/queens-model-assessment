/**
 * Chapter 10's workbench: a small exact model counter, the pairwise CNF and
 * two SMT-LIB exports for any choice of rule families and fixed cells.
 *
 * This is not Z3. It is plain TypeScript with no imports, so the build-time
 * checks (scripts/verify-z3-workbench.mjs) can compile it on its own and
 * compare it with an independent enumeration and with Z3.
 *
 * Cells are 1-based: the cell in row r, column c is variable (r - 1) n + c,
 * as in data.ts.
 */

export type RuleKey = 'rows' | 'columns' | 'regions' | 'touching'
export type Rules = Record<RuleKey, boolean>
export const RULE_KEYS: readonly RuleKey[] = ['rows', 'columns', 'regions', 'touching']
export const ALL_RULES: Rules = { rows: true, columns: true, regions: true, touching: true }

/** Fixed cells: variable -> forced value (true = queen, false = empty). */
export type Assumptions = ReadonlyMap<number, boolean>

/** The counter enumerates every model up to this many, then stops. */
export const COUNT_CAP = 100_000
/** Safety bound on search nodes; the build checks it is never reached. */
export const NODE_LIMIT = 5_000_000

export type Group = { family: 'rows' | 'columns' | 'regions'; id: string; cells: number[] }

const variable = (r: number, c: number, n: number) => (r - 1) * n + c
const cellOf = (v: number, n: number): [number, number] => [Math.floor((v - 1) / n) + 1, ((v - 1) % n) + 1]
export const cellWords = (v: number, n: number) => { const [r, c] = cellOf(v, n); return `r${r}c${c}` }

export const regionLabels = (regions: string[][]) => [...new Set(regions.flat())].sort()

/** Exactly-one groups of the active partition families: rows, then columns, then regions in label order. */
export function groupsFor(regions: string[][], rules: Rules): Group[] {
  const n = regions.length
  const out: Group[] = []
  const span = Array.from({ length: n }, (_, i) => i + 1)
  if (rules.rows) for (const r of span) out.push({ family: 'rows', id: String(r), cells: span.map(c => variable(r, c, n)) })
  if (rules.columns) for (const c of span) out.push({ family: 'columns', id: String(c), cells: span.map(r => variable(r, c, n)) })
  if (rules.regions) for (const k of regionLabels(regions)) {
    out.push({ family: 'regions', id: k, cells: span.flatMap(r => span.filter(c => regions[r - 1][c - 1] === k).map(c => variable(r, c, n))) })
  }
  return out
}

/** Every unordered pair of touching cells (Chebyshev distance 1), in row-major order of the first cell. */
export function touchingPairs(n: number): [number, number][] {
  const pairs: [number, number][] = []
  for (let r = 1; r <= n; r++) for (let c = 1; c <= n; c++) {
    for (const [dr, dc] of [[0, 1], [1, -1], [1, 0], [1, 1]]) {
      const r2 = r + dr, c2 = c + dc
      if (r2 <= n && c2 >= 1 && c2 <= n) pairs.push([variable(r, c, n), variable(r2, c2, n)])
    }
  }
  return pairs
}

/** The 8 directed neighbour offsets in the order the repository solver asserts them. */
const DIRECTED = [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [-1, 1], [1, -1], [1, 1]] as const

export type CountResult = {
  status: 'sat' | 'unsat' | 'unknown'
  /** Exact number of models when `exact`, otherwise a lower bound. */
  count: number
  exact: boolean
  /** True when the count reached COUNT_CAP and enumeration stopped. */
  capped: boolean
  /** Cells set true in the first model found, ascending. */
  witness: number[] | null
  nodes: number
}

/**
 * Counts the assignments of the n² cell variables that satisfy the active
 * rules and the fixed cells, up to `cap`.
 *
 * Search: unit propagation over exactly-one groups and touching pairs, then
 * branch on the open group with the fewest open cells (one branch per cell
 * made true; the branches are disjoint and exhaustive). With no open group
 * left, branch on the first open cell, true then false. Every leaf with all
 * cells assigned is one model, so each model is counted exactly once.
 */
export function countModels(regions: string[][], rules: Rules, assumptions: Assumptions = new Map(), cap = COUNT_CAP): CountResult {
  const n = regions.length, V = n * n
  const groups = groupsFor(regions, rules)
  const cellGroups: number[][] = Array.from({ length: V + 1 }, () => [])
  groups.forEach((g, i) => g.cells.forEach(v => cellGroups[v].push(i)))
  const neighbours: number[][] = Array.from({ length: V + 1 }, () => [])
  if (rules.touching) for (const [a, b] of touchingPairs(n)) { neighbours[a].push(b); neighbours[b].push(a) }

  const value = new Int8Array(V + 1)
  const trueIn = new Int32Array(groups.length)
  const openIn = Int32Array.from(groups, g => g.cells.length)
  const trail: number[] = []
  const queue: number[] = []
  let nodes = 0, count = 0, stopped = false
  let witness: number[] | null = null

  const set = (v: number, val: 1 | -1) => {
    if (value[v] !== 0) return value[v] === val
    value[v] = val
    trail.push(v)
    for (const g of cellGroups[v]) { openIn[g]--; if (val === 1) trueIn[g]++ }
    queue.push(v)
    return true
  }
  const propagate = () => {
    while (queue.length) {
      const v = queue.pop() as number
      if (value[v] === 1) {
        for (const g of cellGroups[v]) for (const u of groups[g].cells) if (u !== v && !set(u, -1)) { queue.length = 0; return false }
        for (const u of neighbours[v]) if (!set(u, -1)) { queue.length = 0; return false }
      } else {
        for (const g of cellGroups[v]) {
          if (trueIn[g] > 0) continue
          if (openIn[g] === 0) { queue.length = 0; return false }
          if (openIn[g] === 1 && !set(groups[g].cells.find(u => value[u] === 0) as number, 1)) { queue.length = 0; return false }
        }
      }
    }
    return true
  }
  const undo = (length: number) => {
    while (trail.length > length) {
      const v = trail.pop() as number
      const was = value[v]
      value[v] = 0
      for (const g of cellGroups[v]) { openIn[g]++; if (was === 1) trueIn[g]-- }
    }
  }
  const tryValue = (v: number, val: 1 | -1) => {
    const mark = trail.length
    if (set(v, val) && propagate()) search()
    else queue.length = 0
    undo(mark)
  }
  const search = (): void => {
    if (count >= cap || stopped) return
    if (++nodes > NODE_LIMIT) { stopped = true; return }
    let best = -1
    for (let g = 0; g < groups.length; g++) if (trueIn[g] === 0 && (best < 0 || openIn[g] < openIn[best])) best = g
    if (best >= 0) {
      for (const u of groups[best].cells.filter(c => value[c] === 0)) {
        tryValue(u, 1)
        if (count >= cap || stopped) return
      }
      return
    }
    let v = 1
    while (v <= V && value[v] !== 0) v++
    if (v > V) {
      count++
      if (!witness) witness = Array.from({ length: V }, (_, i) => i + 1).filter(u => value[u] === 1)
      return
    }
    tryValue(v, 1)
    if (count >= cap || stopped) return
    tryValue(v, -1)
  }

  let consistent = true
  for (const [v, val] of [...assumptions].sort((a, b) => a[0] - b[0])) {
    if (v < 1 || v > V || !set(v, val ? 1 : -1)) { consistent = false; break }
  }
  if (consistent && propagate()) search()
  const exact = !stopped && count < cap
  return { status: count > 0 ? 'sat' : stopped ? 'unknown' : 'unsat', count, exact, capped: count >= cap, witness, nodes }
}

/** Reasons a reader can see without search: fixed queens that clash, or a group with every cell fixed empty. */
export function directConflicts(regions: string[][], rules: Rules, assumptions: Assumptions): string[] {
  const n = regions.length
  const reasons: string[] = []
  const queens = [...assumptions].filter(([, val]) => val).map(([v]) => v).sort((a, b) => a - b)
  for (let i = 0; i < queens.length; i++) for (let j = i + 1; j < queens.length; j++) {
    const [r1, c1] = cellOf(queens[i], n), [r2, c2] = cellOf(queens[j], n)
    const pair = `${cellWords(queens[i], n)} and ${cellWords(queens[j], n)}`
    if (rules.rows && r1 === r2) reasons.push(`${pair} are both fixed queens in row ${r1}.`)
    else if (rules.columns && c1 === c2) reasons.push(`${pair} are both fixed queens in column ${c1}.`)
    else if (rules.regions && regions[r1 - 1][c1 - 1] === regions[r2 - 1][c2 - 1]) reasons.push(`${pair} are both fixed queens in region ${regions[r1 - 1][c1 - 1]}.`)
    else if (rules.touching && Math.max(Math.abs(r1 - r2), Math.abs(c1 - c2)) === 1) reasons.push(`${pair} are fixed queens that touch.`)
  }
  for (const g of groupsFor(regions, rules)) {
    if (g.cells.every(v => assumptions.get(v) === false)) reasons.push(`Every cell of ${g.family === 'regions' ? 'region' : g.family === 'rows' ? 'row' : 'column'} ${g.id} is fixed empty.`)
  }
  return reasons
}

export type CnfFamily = 'rows' | 'columns' | 'regions' | 'touching' | 'fixed'
export const CNF_FAMILIES: readonly CnfFamily[] = ['rows', 'columns', 'regions', 'touching', 'fixed']
export type Cnf = {
  variables: number
  clauses: number[][]
  family: CnfFamily[]
  /** Distinct clauses first generated by each family. */
  distinct: Record<CnfFamily, number>
  literalOccurrences: number
}

/**
 * Pairwise CNF of the active rules: per group one at-least-one clause and one
 * at-most-one clause per pair; one clause per unordered touching pair; one
 * unit clause per fixed cell. A repeat of an earlier clause is dropped, so
 * with every rule on and nothing fixed this is Chapter 2's 513-clause CNF.
 */
export function pairwiseCnf(regions: string[][], rules: Rules, assumptions: Assumptions = new Map()): Cnf {
  const n = regions.length
  const seen = new Set<string>()
  const clauses: number[][] = []
  const family: CnfFamily[] = []
  const distinct: Record<CnfFamily, number> = { rows: 0, columns: 0, regions: 0, touching: 0, fixed: 0 }
  const add = (lits: number[], from: CnfFamily) => {
    const clause = [...new Set(lits)].sort((a, b) => Math.abs(a) - Math.abs(b) || a - b)
    const key = clause.join(' ')
    if (seen.has(key)) return
    seen.add(key)
    clauses.push(clause)
    family.push(from)
    distinct[from]++
  }
  for (const g of groupsFor(regions, rules)) {
    add(g.cells, g.family)
    for (let i = 0; i < g.cells.length; i++) for (let j = i + 1; j < g.cells.length; j++) add([-g.cells[i], -g.cells[j]], g.family)
  }
  if (rules.touching) for (const [a, b] of touchingPairs(n)) add([-a, -b], 'touching')
  for (const [v, val] of [...assumptions].sort((a, b) => a[0] - b[0])) add([val ? v : -v], 'fixed')
  return { variables: n * n, clauses, family, distinct, literalOccurrences: clauses.reduce((s, c) => s + c.length, 0) }
}

/** DIMACS text of a CNF, in the same layout as public/evidence/z3/seven-pairwise.cnf. */
export const dimacs = (cnf: Cnf) => `p cnf ${cnf.variables} ${cnf.clauses.length}\n${cnf.clauses.map(c => `${c.join(' ')} 0\n`).join('')}`

export type ProductionCounts = { equations: number; implications: number; fixed: number; assertions: number }
export function productionCounts(regions: string[][], rules: Rules, assumptions: Assumptions = new Map()): ProductionCounts {
  const n = regions.length
  const equations = groupsFor(regions, rules).length
  const implications = rules.touching ? 2 * touchingPairs(n).length : 0
  return { equations, implications, fixed: assumptions.size, assertions: equations + implications + assumptions.size }
}

export type ExportForm = 'production' | 'pairwise'
export type ExportMeta = { boardLabel: string; partitionSha256: string }

/** SMT-LIB comments are kept to printable ASCII for portability. */
const ascii = (text: string) => text.replace(/×/g, 'x').replace(/[·–—]/g, '-').replace(/[^\x20-\x7e]/g, '?')

const symbol = (v: number, n: number) => { const [r, c] = cellOf(v, n); return `q_${r}_${c}` }
const literal = (lit: number, n: number) => lit > 0 ? symbol(lit, n) : `(not ${symbol(-lit, n)})`

export const ruleWords = (rules: Rules) => {
  const on = RULE_KEYS.filter(k => rules[k])
  return on.length ? on.join(', ') : 'none'
}
const fixedWords = (assumptions: Assumptions, n: number) => assumptions.size
  ? [...assumptions].sort((a, b) => a[0] - b[0]).map(([v, val]) => `${cellWords(v, n)}=${val ? 1 : 0}`).join(' ')
  : 'none'

/** A file name that records the form, the active rules and the number of fixed cells. */
export function exportFileName(form: ExportForm, rules: Rules, assumptions: Assumptions, n: number) {
  const on = RULE_KEYS.filter(k => rules[k])
  const ruleSlug = on.length === RULE_KEYS.length ? 'all-rules' : on.length ? on.join('-') : 'no-rules'
  return `queens-${n}x${n}-${form}-${ruleSlug}${assumptions.size ? `-${assumptions.size}-fixed` : ''}.smt2`
}

/**
 * SMT-LIB 2 text of the active formula. ASCII only. 'production' repeats the
 * repository solver's assertions (Sum(If(q, 1, 0)) == 1 per group and
 * Implies(q_u, Not(q_v)) per directed touching pair) with cells renamed q_r_c;
 * 'pairwise' is the CNF above as one assert per clause.
 */
export function smtLib(form: ExportForm, regions: string[][], rules: Rules, assumptions: Assumptions, meta: ExportMeta): string {
  const n = regions.length
  const all = Array.from({ length: n * n }, (_, i) => i + 1)
  const fixed = [...assumptions].sort((a, b) => a[0] - b[0])
  const lines = [
    '; How Z3 solves Queens - Chapter 10 workbench export',
    `; Board: ${ascii(meta.boardLabel)}; partition SHA-256 ${ascii(meta.partitionSha256)}`,
    `; q_r_c is the cell in row r, column c (1-based). Active rules: ${ruleWords(rules)}. Fixed cells: ${fixedWords(assumptions, n)}.`,
  ]
  if (form === 'production') {
    const counts = productionCounts(regions, rules, assumptions)
    lines.push(
      '; Form: production encoding, the repository solver\'s assertions with its cell_{r-1}_{c-1}',
      ';   renamed q_r_c: (= (+ (ite q 1 0) ...) 1) for each active row, column and region, and',
      ';   (=> q_u (not q_v)) for each ordered pair of touching cells.',
      `; Assertions: ${counts.equations} equations + ${counts.implications} implications + ${counts.fixed} fixed = ${counts.assertions}.`,
      '; Z3 needs no set-logic line; a solver that requires one can use (set-logic QF_LIA).',
    )
  } else {
    const cnf = pairwiseCnf(regions, rules, assumptions)
    lines.push(
      '; Form: pairwise CNF, no auxiliary variables: per active group one at-least-one clause',
      ';   and one at-most-one clause per pair, one clause per touching pair, one unit clause',
      ';   per fixed cell; repeats of an earlier clause are dropped.',
      `; Clauses: ${cnf.clauses.length} over ${cnf.variables} variables. With every rule on and nothing fixed this is`,
      ';   the 513-clause CNF of Chapter 2 (seven-pairwise.cnf).',
      '; Z3 needs no set-logic line; a solver that requires one can use (set-logic QF_UF).',
    )
  }
  lines.push('; Exported by an in-browser counter that is not Z3; run this file with Z3 to check it.')
  lines.push('; After unsat, (get-model) reports an error because there is no model.')
  lines.push('(set-option :produce-models true)')
  for (const v of all) lines.push(`(declare-const ${symbol(v, n)} Bool)`)
  if (form === 'production') {
    let family = ''
    for (const g of groupsFor(regions, rules)) {
      if (g.family !== family) { family = g.family; lines.push(`; ${family}`) }
      const terms = g.cells.map(v => `(ite ${symbol(v, n)} 1 0)`)
      lines.push(`(assert (= ${terms.length === 1 ? terms[0] : `(+ ${terms.join(' ')})`} 1))`)
    }
    if (rules.touching) {
      lines.push('; touching cells, both directions')
      for (let r = 1; r <= n; r++) for (let c = 1; c <= n; c++) for (const [dr, dc] of DIRECTED) {
        const r2 = r + dr, c2 = c + dc
        if (r2 >= 1 && r2 <= n && c2 >= 1 && c2 <= n) lines.push(`(assert (=> ${symbol(variable(r, c, n), n)} (not ${symbol(variable(r2, c2, n), n)})))`)
      }
    }
    if (fixed.length) {
      lines.push('; fixed cells')
      for (const [v, val] of fixed) lines.push(`(assert ${val ? symbol(v, n) : `(not ${symbol(v, n)})`})`)
    }
  } else {
    const cnf = pairwiseCnf(regions, rules, assumptions)
    let family = ''
    cnf.clauses.forEach((clause, i) => {
      if (cnf.family[i] !== family) { family = cnf.family[i]; lines.push(`; ${family}: ${cnf.distinct[cnf.family[i]]} clauses`) }
      lines.push(`(assert ${clause.length === 1 ? literal(clause[0], n) : `(or ${clause.map(l => literal(l, n)).join(' ')})`})`)
    })
  }
  lines.push('(check-sat)', '(get-model)')
  return lines.join('\n') + '\n'
}

/** Columns by row when the witness has exactly one queen per row, else null. */
export function columnsByRow(witness: number[] | null, n: number): number[] | null {
  if (!witness || witness.length !== n) return null
  const columns = witness.map(v => cellOf(v, n))
  return columns.every(([r], i) => r === i + 1) ? columns.map(([, c]) => c) : null
}

export type AlternativeModels = {
  integer: { variables: number; domain: number; allDifferentPairs: number; regionCounts: number; membershipTests: number; touching: number; constraints: number; constraintsExpanded: number }
  graph: { vertices: number; rowEdges: number; columnEdges: number; touchingEdges: number; queenEdges: number; regionOnlyEdges: number; allEdges: number; regions: number }
}

/**
 * Sizes of Chapter 2's two alternative models of the same board.
 * Integer per row: q_r in {1..n}, AllDifferent(q), one region count per
 * region (a sum over the rows it meets of [q_r in its columns of row r]),
 * and |q_r - q_{r+1}| != 1. Conflict graph: cells joined when they share a
 * row or column or touch; optionally also when they share a region.
 */
export function alternativeModels(regions: string[][]): AlternativeModels {
  const n = regions.length
  const labels = regionLabels(regions)
  const membershipTests = labels.reduce((sum, k) => sum + regions.filter(row => row.includes(k)).length, 0)
  const pairs = n * (n - 1) / 2
  const integer = {
    variables: n, domain: n, allDifferentPairs: pairs, regionCounts: labels.length, membershipTests, touching: n - 1,
    constraints: 1 + labels.length + (n - 1), constraintsExpanded: pairs + labels.length + (n - 1),
  }
  let rowEdges = 0, columnEdges = 0, touchingEdges = 0, queenEdges = 0, allEdges = 0
  const V = n * n
  for (let a = 1; a <= V; a++) for (let b = a + 1; b <= V; b++) {
    const [r1, c1] = cellOf(a, n), [r2, c2] = cellOf(b, n)
    const row = r1 === r2, column = c1 === c2, touch = Math.max(Math.abs(r1 - r2), Math.abs(c1 - c2)) === 1
    const region = regions[r1 - 1][c1 - 1] === regions[r2 - 1][c2 - 1]
    if (row) rowEdges++
    if (column) columnEdges++
    if (touch && !row && !column) touchingEdges++
    if (row || column || touch) queenEdges++
    if (row || column || touch || region) allEdges++
  }
  return { integer, graph: { vertices: V, rowEdges, columnEdges, touchingEdges, queenEdges, regionOnlyEdges: allEdges - queenEdges, allEdges, regions: labels.length } }
}
