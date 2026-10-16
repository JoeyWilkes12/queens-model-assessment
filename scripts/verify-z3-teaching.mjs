#!/usr/bin/env node
/**
 * Offline checks for "How Z3 solves Queens" against the committed evidence in
 * public/evidence/z3/. No network, no writes, no Z3: the Z3-dependent checks
 * live in scripts/z3/build_teaching_data.py --verify.
 *
 * Checks the board binding, manifest hashes, both reference traces with the
 * browser's TypeScript validator, that the browser's kernel port reproduces
 * both recorded runs event for event, the replay used by the UI, and the
 * precomputed propagation runs and Hall exclusions.
 */
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import ts from 'typescript'

const root = new URL('../', import.meta.url)
const read = path => readFile(new URL(path, root), 'utf8')
const json = async path => JSON.parse(await read(path))
const sha = text => createHash('sha256').update(text).digest('hex')
const source = await read('src/z3/kernel.ts')
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText
const kernel = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`)

let count = 0
const check = async (label, fn) => { await fn(); count++; console.log(`PASS ${label}`) }

const board = await json('src/z3/board-seven.json')
const existence = await json('public/evidence/z3/reference-trace-existence.json')
const blocked = await json('public/evidence/z3/reference-trace-blocked.json')
const teaching = await json('public/evidence/z3/teaching-data.json')
const receipts = await json('public/evidence/z3/z3-receipts.json')
const manifest = await json('public/evidence/z3/manifest.json')
const app = await read('src/App.tsx')

// Python json.dumps default separators, as documented in board-seven.json.
const pythonJson = regions => '[' + regions.map(row => '[' + row.map(cell => JSON.stringify(cell)).join(', ') + ']').join(', ') + ']'

await check('board-seven.json matches boardConfigs.seven in src/App.tsx', () => {
  const block = app.split('  seven: {')[1].split('  },')[0]
  const regions = JSON.parse(block.match(/regions: (\[[\s\S]*?\n {4}\])/)[1].replace(/'/g, '"').replace(/,\s*\]/g, ']'))
  assert.deepEqual(regions, board.regions)
  assert.equal(sha(pythonJson(board.regions)), board.partitionSha256)
})

await check('every artifact binds the same partition and CNF', () => {
  for (const item of [existence, blocked, teaching]) assert.equal(item.partitionSha256, board.partitionSha256)
  assert.equal(existence.cnfSha256, blocked.cnfSha256)
  assert.equal(teaching.cnfSha256, existence.cnfSha256)
  assert.equal(manifest.partitionSha256, board.partitionSha256)
  assert.equal(receipts.boards.find(b => b.id === 'seven').partitionSha256, board.partitionSha256)
})

await check('manifest hashes match the committed files', async () => {
  for (const entry of manifest.files) {
    const bytes = await readFile(new URL(`public/evidence/z3/${entry.path}`, root))
    assert.equal(sha(bytes), entry.sha256, entry.path)
  }
})

await check('DIMACS file hashes to cnfSha256 and lists the 513 original clauses', async () => {
  const cnf = await read('public/evidence/z3/seven-pairwise.cnf')
  assert.equal(sha(cnf), existence.cnfSha256)
  const lines = cnf.trim().split('\n')
  assert.equal(lines[0], 'p cnf 49 513')
  lines.slice(1).forEach((line, id) => assert.equal(line, `${existence.clauses[id].lits.join(' ')} 0`))
})

const lists = trace => trace.clauses.map(clause => clause.lits)
for (const [name, trace] of [['existence', existence], ['blocked', blocked]]) {
  await check(`${name} trace: captions and engine identify the reference kernel, not Z3`, () => {
    assert.equal(trace.caption, 'Reference CDCL execution · pairwise encoding')
    assert.equal(trace.notZ3Trace, true)
    assert.equal(trace.engine.name, 'reference-cdcl')
  })
  await check(`${name} trace: browser validator replays ${trace.events.length} events with no failure`, () => {
    assert.deepEqual(kernel.validateEvents(lists(trace), trace.initialClauseIds, trace.events, trace.variables.length), [])
  })
  await check(`${name} trace: browser kernel port reproduces every recorded event`, () => {
    const initial = trace.initialClauseIds.map(id => trace.clauses[id].lits)
    const run = kernel.runCdcl(initial, trace.variables.length)
    assert.deepEqual(run.events, trace.events)
    assert.deepEqual(run.clauses, lists(trace))
  })
}

await check('validator rejects tampered traces (reason, resolvent, backjump)', () => {
  const clone = value => JSON.parse(JSON.stringify(value))
  const tamper = [
    events => { events[5].reasonClauseId = 0 },
    events => { events[127].resolution[1].result = [35] },
    events => { events[128].targetLevel = 1 },
    events => { events[15].conflictClauseId = 0 },
  ]
  for (const edit of tamper) {
    const events = clone(existence.events)
    edit(events)
    assert.ok(kernel.validateEvents(lists(existence), existence.initialClauseIds, events, 49).length > 0)
  }
})

await check('replay: event 126 empties region F under the propagated q27', () => {
  const states = kernel.replay(existence.events)
  const state = states[126]
  const lits = new Set(state.trail.map(entry => entry.lit))
  assert.equal(existence.events[126].kind, 'conflict')
  assert.equal(existence.events[126].conflictClauseId, 477)
  assert.deepEqual(existence.clauses[477].lits, [35, 42, 49])
  for (const lit of [14, -35, -42, -49]) assert.ok(lits.has(lit))
  assert.equal(state.trail.find(entry => entry.lit === 14).reason, 22)
  assert.equal(states[128].level, 0)
  assert.deepEqual(states[129].trail.at(-1), { lit: -14, level: 0, reason: 517, seq: 129 })
  assert.deepEqual(existence.events[127].resolution.map(step => [step.pivot, step.parentClauseId]), [[49, 297], [42, 296], [35, 295]])
  assert.equal(states[66].level, 2)
  const sat = states.at(-1).trail.map(entry => entry.lit).sort((a, b) => Math.abs(a) - Math.abs(b))
  assert.deepEqual(sat, existence.model)
})

await check('blocked trace ends at the empty clause with the full-cell blocker', () => {
  const blocker = blocked.clauses[blocked.blockerId]
  assert.deepEqual(blocker.sources, ['blocker'])
  assert.deepEqual(blocker.lits.map(Math.abs), Array.from({ length: 49 }, (_, i) => i + 1))
  assert.equal(blocked.events.at(-1).kind, 'unsat')
  assert.deepEqual(blocked.clauses[blocked.events.at(-2).learnedClauseId].lits, [])
})

await check('49 precomputed propagation runs replay as unit steps', () => {
  const clauses = lists(existence).slice(0, existence.originalClauseCount)
  assert.equal(teaching.propagation.runs.length, 49)
  for (const run of teaching.propagation.runs) {
    const value = new Map([[run.decision, true]])
    const valueOf = lit => value.has(Math.abs(lit)) ? value.get(Math.abs(lit)) === lit > 0 : null
    for (const step of run.steps) {
      const lits = clauses[step.reasonClauseId]
      assert.ok(lits.includes(step.literal) && valueOf(step.literal) === null)
      assert.ok(lits.every(l => l === step.literal || valueOf(l) === false), `run ${run.decision} reason ${step.reasonClauseId} unit`)
      value.set(Math.abs(step.literal), step.literal > 0)
    }
    if (run.status === 'conflict') assert.ok(clauses[run.conflictClauseId].every(l => valueOf(l) === false))
    else assert.ok(clauses.every(lits => lits.some(l => valueOf(l) === true) || lits.filter(l => valueOf(l) === null).length >= 2))
    assert.equal(run.unassignedAfter, 49 - value.size)
  }
})

await check('Hall data: ¬q31 confines A and B to rows 1–2 and excludes six C cells', () => {
  const { highlight, masks, regionCells } = teaching.confinement
  const subset = masks.notq31.subsets.find(s => s.regions.join() === 'A,B')
  assert.deepEqual(subset.rows, [1, 2])
  assert.equal(subset.status, 'tight')
  assert.deepEqual(subset.excluded, highlight.excluded)
  for (const [r, c] of subset.excluded) assert.equal(board.regions[r - 1][c - 1], 'C')
  for (const [mask, data] of Object.entries(masks)) {
    for (const s of data.subsets) {
      const rows = [...new Set(s.regions.flatMap(k => data.regionRows[k]))].sort((a, b) => a - b)
      assert.deepEqual(s.rows, rows, `${mask} ${s.regions}`)
      const status = rows.length < s.regions.length ? 'deficient' : rows.length === s.regions.length ? 'tight' : 'slack'
      assert.equal(s.status, status)
    }
  }
  assert.equal(Object.values(regionCells).flat().length, 49)
})

await check('Z3 receipts: Recorded Z3 execution, Z3 4.16.0, 27 checks with legal models', () => {
  assert.equal(receipts.caption, 'Recorded Z3 execution')
  assert.match(receipts.z3Version, /^Z3 4\.16\.0/)
  const checks = receipts.boards.flatMap(b => b.runs.flatMap(r => r.checks))
  assert.equal(checks.length, 27)
  for (const b of receipts.boards) for (const r of b.runs) {
    const cols = r.modelColumns
    assert.equal(new Set(cols).size, b.size)
    assert.equal(new Set(cols.map((c, row) => b.regions[row][c - 1])).size, b.size)
    cols.slice(1).forEach((c, i) => assert.ok(Math.abs(c - cols[i]) > 1))
    assert.deepEqual(r.checks.map(c => c.result), ['sat', 'unsat', 'unsat'])
  }
  const seven = receipts.boards.find(b => b.id === 'seven').runs.find(r => r.mode === 'default')
  assert.equal(seven.checks[0].engine.id, 'sat-core')
  assert.equal(seven.checks[1].engine.id, 'smt-core-arithmetic')
  assert.equal(seven.checks[2].engine.id, 'sat-core')
})

console.log(JSON.stringify({ tests: count, externalCalls: 0 }, null, 2))
