#!/usr/bin/env node
/**
 * Checks Chapter 10's workbench (src/z3/workbench.ts) and the Chapter 2
 * sidebar counts. No network and no writes. Needs a Z3-capable Python:
 * $Z3_PYTHON if set, else python3 (as scripts/z3/run-python.mjs); fails loudly
 * if z3 cannot be imported.
 *
 * 1. The in-browser counter against an independent row-by-row enumeration
 *    (a transfer-matrix count, a different algorithm) for all 16 rule
 *    combinations on the intact board and 400 seeded cases with fixed cells.
 * 2. The intact pairwise CNF is byte-identical to seven-pairwise.cnf.
 * 3. Both SMT-LIB exports run through Z3 and give the counter's SAT/UNSAT for
 *    every rule combination and for fixed-cell cases; Z3 model counts match
 *    the counter where they are small; the intact production export is the
 *    recorded production formula (same SHA-256 after renaming cells).
 * 4. The alternative-model counts of the Chapter 2 sidebar.
 */
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import ts from 'typescript'

const root = new URL('../', import.meta.url)
const read = path => readFile(new URL(path, root), 'utf8')
const json = async path => JSON.parse(await read(path))
const source = await read('src/z3/workbench.ts')
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText
const wb = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`)

let count = 0
const check = async (label, fn) => { await fn(); count++; console.log(`PASS ${label}`) }

const board = await json('src/z3/board-seven.json')
const receipts = await json('public/evidence/z3/z3-receipts.json')
const regions = board.regions
const n = regions.length
const labels = [...new Set(regions.flat())].sort()
const seven = receipts.boards.find(b => b.id === 'seven').runs.find(r => r.mode === 'default')
const meta = { boardLabel: board.label, partitionSha256: board.partitionSha256 }
const combos = Array.from({ length: 16 }, (_, i) => ({ rows: !(i & 8), columns: !(i & 4), regions: !(i & 2), touching: !(i & 1) }))
const v = (r, c) => (r - 1) * n + c

/**
 * Independent exact count: process rows top to bottom; a row contributes any
 * subset of its cells. State = (columns used, regions used, previous row).
 */
function enumerate(rules, fixed) {
  const full = (1 << n) - 1
  let states = new Map([['0,0,0', 1]])
  for (let r = 1; r <= n; r++) {
    const must = [...fixed].filter(([x, val]) => val && Math.floor((x - 1) / n) + 1 === r).reduce((m, [x]) => m | (1 << ((x - 1) % n)), 0)
    const never = [...fixed].filter(([x, val]) => !val && Math.floor((x - 1) / n) + 1 === r).reduce((m, [x]) => m | (1 << ((x - 1) % n)), 0)
    const next = new Map()
    for (const [key, weight] of states) {
      const [cm, rm, pm] = key.split(',').map(Number)
      for (let s = 0; s <= full; s++) {
        if ((s & must) !== must || (s & never)) continue
        const bits = [...Array(n).keys()].filter(c => s >> c & 1)
        if (rules.rows && bits.length !== 1) continue
        if (rules.columns && (s & cm)) continue
        if (rules.touching && ((s & (s << 1)) || (s & (pm | (pm << 1) | (pm >> 1)) & full))) continue
        let reg = 0, clash = false
        for (const c of bits) { const b = 1 << labels.indexOf(regions[r - 1][c]); if (reg & b) clash = true; reg |= b }
        if (rules.regions && (clash || (reg & rm))) continue
        const k = `${rules.columns ? cm | s : 0},${rules.regions ? rm | reg : 0},${rules.touching ? s : 0}`
        next.set(k, (next.get(k) || 0) + weight)
      }
    }
    states = next
  }
  let total = 0
  for (const [key, weight] of states) {
    const [cm, rm] = key.split(',').map(Number)
    if ((!rules.columns || cm === full) && (!rules.regions || rm === (1 << labels.length) - 1)) total += weight
  }
  return total
}

/** Independent legality check of a set of queen cells. */
function legal(rules, fixed, queens) {
  const set = new Set(queens)
  for (const [x, val] of fixed) if (set.has(x) !== val) return false
  const at = queens.map(x => [Math.floor((x - 1) / n) + 1, ((x - 1) % n) + 1])
  const once = key => { const seen = at.map(key); return new Set(seen).size === seen.length }
  if (rules.rows && !(once(([r]) => r) && new Set(at.map(([r]) => r)).size === n)) return false
  if (rules.columns && !(once(([, c]) => c) && new Set(at.map(([, c]) => c)).size === n)) return false
  if (rules.regions && !(once(([r, c]) => regions[r - 1][c - 1]) && new Set(at.map(([r, c]) => regions[r - 1][c - 1])).size === labels.length)) return false
  if (rules.touching) for (let i = 0; i < at.length; i++) for (let j = i + 1; j < at.length; j++) {
    if (Math.max(Math.abs(at[i][0] - at[j][0]), Math.abs(at[i][1] - at[j][1])) === 1) return false
  }
  return true
}

function agrees(rules, fixed, label) {
  const result = wb.countModels(regions, rules, fixed)
  const expected = enumerate(rules, fixed)
  assert.notEqual(result.status, 'unknown', `${label}: node limit reached`)
  assert.equal(result.status, expected > 0 ? 'sat' : 'unsat', `${label}: status`)
  if (result.exact) assert.equal(result.count, expected, `${label}: count`)
  else { assert.ok(result.capped && result.count === wb.COUNT_CAP, `${label}: inexact only at the cap`); assert.ok(expected >= wb.COUNT_CAP, `${label}: capped below the cap`) }
  if (result.status === 'sat') assert.ok(legal(rules, fixed, result.witness), `${label}: witness obeys the active rules and fixed cells`)
  return { result, expected }
}

const table = []
await check('all 16 rule combinations, intact board: counter SAT/UNSAT and counts match an independent row-by-row enumeration', () => {
  for (const rules of combos) {
    const { result, expected } = agrees(rules, new Map(), wb.ruleWords(rules))
    table.push({ rules: wb.ruleWords(rules), counter: result.exact ? result.count : `>= ${result.count}`, enumeration: expected })
  }
})
console.table(table)

await check('intact board: exactly one placement, columns [3,1,6,2,4,7,5], the recorded Z3 model', () => {
  const result = wb.countModels(regions, wb.ALL_RULES)
  assert.equal(result.count, 1)
  assert.ok(result.exact)
  assert.deepEqual(wb.columnsByRow(result.witness, n), [3, 1, 6, 2, 4, 7, 5])
  assert.deepEqual(wb.columnsByRow(result.witness, n), seven.modelColumns)
})

await check('Check yourself: dropping any single rule leaves more than one placement (rows 215, columns 129, regions 646, touching 24)', () => {
  const drops = Object.fromEntries(wb.RULE_KEYS.map(key => [key, wb.countModels(regions, { ...wb.ALL_RULES, [key]: false }).count]))
  assert.deepEqual(drops, { rows: 215, columns: 129, regions: 646, touching: 24 })
})

// Seeded cases with fixed cells (deterministic LCG).
let seed = 20261016
const random = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648
const randomCases = Array.from({ length: 400 }, (_, i) => {
  const rules = combos[Math.floor(random() * 16)]
  const fixed = new Map()
  const k = Math.floor(random() * 6)
  while (fixed.size < k) fixed.set(1 + Math.floor(random() * n * n), random() < 0.45)
  return { id: `random-${i}`, rules, fixed }
})
await check('400 seeded cases with 0-5 fixed cells: counter agrees with the enumeration; witnesses respect fixed cells', () => {
  let sat = 0, unsat = 0, capped = 0
  for (const c of randomCases) {
    const { result } = agrees(c.rules, c.fixed, c.id)
    if (result.status === 'sat') sat++; else unsat++
    if (result.capped) capped++
  }
  assert.ok(sat > 50 && unsat > 50, `cases cover both outcomes (sat ${sat}, unsat ${unsat})`)
  console.log(`      ${sat} SAT, ${unsat} UNSAT, ${capped} capped at ${wb.COUNT_CAP.toLocaleString('en-US')}`)
})

await check('direct-conflict reasons only appear for UNSAT inputs', () => {
  for (const c of randomCases) {
    if (wb.directConflicts(regions, c.rules, c.fixed).length) assert.equal(wb.countModels(regions, c.rules, c.fixed).status, 'unsat', c.id)
  }
})

await check('intact pairwise CNF is byte-identical to public/evidence/z3/seven-pairwise.cnf (513 clauses)', async () => {
  const cnf = wb.pairwiseCnf(regions, wb.ALL_RULES)
  assert.equal(wb.dimacs(cnf), await read('public/evidence/z3/seven-pairwise.cnf'))
  const teaching = await json('public/evidence/z3/teaching-data.json')
  const fresh = Object.fromEntries(teaching.generatedVsDistinct.byFamily.map(f => [f.family === 'row' ? 'rows' : f.family === 'column' ? 'columns' : f.family === 'region' ? 'regions' : 'touching', f.new]))
  const { fixed, ...distinct } = cnf.distinct
  assert.deepEqual(distinct, fresh)
  assert.equal(fixed, 0)
  assert.equal(cnf.variables, 49)
})

await check('CNF and production sizes follow the toggles: one unit clause and one assertion per fixed cell', () => {
  for (const rules of combos) {
    const groups = (rules.rows ? n : 0) + (rules.columns ? n : 0) + (rules.regions ? labels.length : 0)
    const counts = wb.productionCounts(regions, rules)
    assert.equal(counts.equations, groups)
    assert.equal(counts.implications, rules.touching ? 312 : 0)
    const fixed = new Map([[v(1, 3), true], [v(2, 2), false]])
    assert.equal(wb.productionCounts(regions, rules, fixed).assertions, counts.assertions + 2)
    assert.equal(wb.pairwiseCnf(regions, rules, fixed).distinct.fixed, 2)
  }
  assert.equal(wb.productionCounts(regions, wb.ALL_RULES).assertions, seven.assertions)
})

await check('exports are ASCII and end with check-sat / get-model', () => {
  for (const form of ['production', 'pairwise']) for (const rules of combos) {
    const text = wb.smtLib(form, regions, rules, new Map([[v(1, 3), true]]), meta)
    assert.ok(/^[\x09\x0a\x20-\x7e]*$/.test(text), `${form} export for ${wb.ruleWords(rules)} is not printable ASCII`)
    assert.ok(text.endsWith('(check-sat)\n(get-model)\n'))
  }
})

// ---------------------------------------------------------------- Z3
const named = [
  ['intact + r1c3 fixed queen', wb.ALL_RULES, [[v(1, 3), true]]],
  ['intact + r1c1 fixed queen', wb.ALL_RULES, [[v(1, 1), true]]],
  ['intact + r1c3 fixed empty', wb.ALL_RULES, [[v(1, 3), false]]],
  ['no touching + r1c3 fixed empty', { ...wb.ALL_RULES, touching: false }, [[v(1, 3), false]]],
  ['no regions + r4c4 fixed queen', { ...wb.ALL_RULES, regions: false }, [[v(4, 4), true]]],
  ['no rows + r2c2 and r2c4 fixed queens', { ...wb.ALL_RULES, rows: false }, [[v(2, 2), true], [v(2, 4), true]]],
  ['touching only + r1c1 and r1c2 fixed queens', { rows: false, columns: false, regions: false, touching: true }, [[v(1, 1), true], [v(1, 2), true]]],
  ['rows only + row 5 fixed empty', { rows: true, columns: false, regions: false, touching: false }, [1, 2, 3, 4, 5, 6, 7].map(c => [v(5, c), false])],
]
const z3Cases = [
  ...combos.map(rules => ({ id: `rules: ${wb.ruleWords(rules)}`, rules, fixed: new Map() })),
  ...named.map(([id, rules, fixed]) => ({ id, rules, fixed: new Map(fixed) })),
  ...randomCases.slice(0, 24),
].map(c => {
  const result = wb.countModels(regions, c.rules, c.fixed)
  return {
    ...c, result,
    request: {
      id: c.id,
      production: wb.smtLib('production', regions, c.rules, c.fixed, meta),
      pairwise: wb.smtLib('pairwise', regions, c.rules, c.fixed, meta),
      enumerateUpTo: result.exact && result.count <= 700 ? 701 : 0,
    },
  }
})

const python = process.env.Z3_PYTHON || 'python3'
if (process.env.Z3_PYTHON && !existsSync(python)) { console.error(`FAIL Z3_PYTHON does not exist: ${python}`); process.exit(1) }
const request = { n, cases: z3Cases.map(c => c.request), intactProduction: wb.smtLib('production', regions, wb.ALL_RULES, new Map(), meta), regions }
const env = { ...process.env, PYTHONDONTWRITEBYTECODE: '1' }
const run = spawnSync(python, [fileURLToPath(new URL('scripts/z3/check_workbench.py', root))], { input: JSON.stringify(request), env, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })
if (run.status !== 0) {
  console.error(`FAIL Z3 checks could not run with ${python}. Set Z3_PYTHON to an interpreter with z3-solver 4.16 installed.\n${run.stderr}`)
  process.exit(1)
}
const z3 = JSON.parse(run.stdout)
console.log(`Using ${python} (${z3.z3})`)
const byId = new Map(z3.cases.map(c => [c.id, c]))

await check(`both SMT-LIB exports run in Z3 and give the counter's SAT/UNSAT: ${z3Cases.length} cases (16 rule combinations, ${named.length} fixed-cell cases, 24 seeded)`, () => {
  for (const c of z3Cases) {
    const got = byId.get(c.id)
    for (const form of ['production', 'pairwise']) {
      assert.equal(got[form].result, c.result.status, `${c.id}: ${form} export`)
      // The only error Z3 may print is the one (get-model) gives after unsat.
      assert.deepEqual(got[form].errors.map(e => e.replace(/line \d+ column \d+: /, '')), c.result.status === 'unsat' ? ['(error "model is not available")'] : [], `${c.id}: ${form} errors`)
    }
  }
  const statuses = new Set(z3Cases.map(c => c.result.status))
  assert.ok(statuses.has('sat') && statuses.has('unsat'))
})

await check('Z3 model enumeration with blocking clauses reproduces every counter count up to 700', () => {
  const counted = z3Cases.filter(c => c.request.enumerateUpTo)
  assert.ok(counted.length >= 10)
  for (const c of counted) {
    const got = byId.get(c.id)
    assert.equal(got.productionCount, c.result.count, `${c.id}: production count`)
    assert.equal(got.pairwiseCount, c.result.count, `${c.id}: pairwise count`)
  }
  console.log(`      ${counted.length} cases, counts ${[...new Set(counted.map(c => c.result.count))].sort((a, b) => a - b).join(', ')}`)
})

await check('intact production export: Z3 SAT with columns [3,1,6,2,4,7,5], 333 assertions, and the recorded production formula hash', () => {
  assert.equal(z3.intact.check, 'sat')
  assert.deepEqual(z3.intact.columns, [3, 1, 6, 2, 4, 7, 5].map(c => [c]))
  assert.equal(z3.intact.assertions, seven.assertions)
  assert.equal(z3.intact.renamedFormulaSha256, seven.formulaSha256)
})

await check('Chapter 2 sidebar counts: integer per row and conflict graph', async () => {
  const alt = wb.alternativeModels(regions)
  assert.deepEqual(alt.integer, { variables: 7, domain: 7, allDifferentPairs: 21, regionCounts: 7, membershipTests: regions.reduce((s, row) => s + new Set(row).size, 0), touching: 6, constraints: 14, constraintsExpanded: 34 })
  assert.equal(alt.graph.queenEdges, 2 * n * (n * (n - 1) / 2) + 2 * (n - 1) ** 2)
  const binary = (await read('public/evidence/z3/seven-pairwise.cnf')).trim().split('\n').slice(1).map(line => line.split(' ').slice(0, -1).map(Number)).filter(lits => lits.length === 2 && lits.every(l => l < 0))
  assert.equal(alt.graph.allEdges, binary.length)
  assert.equal(alt.graph.rowEdges + alt.graph.columnEdges + alt.graph.touchingEdges, alt.graph.queenEdges)
  // Integer per row, by enumeration of all 7^7 assignments.
  const found = []
  const q = Array(n).fill(1)
  for (let i = 0; i < n ** n; i++) {
    let x = i
    for (let r = 0; r < n; r++) { q[r] = (x % n) + 1; x = Math.floor(x / n) }
    if (new Set(q).size !== n) continue
    if (q.slice(1).some((c, r) => Math.abs(c - q[r]) === 1)) continue
    if (new Set(q.map((c, r) => regions[r][c - 1])).size !== labels.length) continue
    found.push([...q])
  }
  assert.deepEqual(found, [[3, 1, 6, 2, 4, 7, 5]])
  // Integer per row, with Z3.
  assert.deepEqual(z3.integerModel, { first: 'sat', columns: [3, 1, 6, 2, 4, 7, 5], blocked: 'unsat', assertions: 7 + 1 + labels.length + 2 * (n - 1) + 1 })
})

console.log(JSON.stringify({ tests: count, externalCalls: 0, cap: wb.COUNT_CAP }, null, 2))
