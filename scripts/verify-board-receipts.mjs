#!/usr/bin/env node
/**
 * Offline check of public/evidence/board-receipts/. No network and no writes, and nothing is imported
 * from the Python builder: the solver, the answer reader, the grader and the cost sums are written
 * again here from the published evidence.
 *
 * 1. The index lists the 36 image-panel boards (plan.json), 9x9 first, each with a board file.
 * 2. Each board's regions match the corpus; its solution is the unique one (row-by-row search) and
 *    matches the corpus's solution_sha256.
 * 3. Every language-model entry matches its summary row (outcome, receipt), and its written placement,
 *    re-read from response.json and re-graded here, agrees with the outcome: solved => the solution,
 *    wrong => not the solution; per-queen marks equal an independent grading.
 * 4. Jev and SubQ entries match their trajectory files (success per mode); the greedy entry matches
 *    greedy/trajectories.json.
 * 5. Every receipt cost equals costs/receipts.json; each system's total, request count and the board's
 *    total and per-provider split equal the sums of its receipts; SubQ costs equal input tokens x $0.05/M.
 * 6. No request is missing: each system lists exactly the requests the cost index counts for that model on
 *    that board, and exactly the manifest records of that study, model and board; the language models'
 *    totals across the 36 boards equal their panel evaluations' totals in scoreboard.json.
 */
import { isDeepStrictEqual } from 'node:util'
import { createHash } from 'node:crypto'
import { readFile, access } from 'node:fs/promises'

const root = new URL('../', import.meta.url)
const json = async path => JSON.parse(await readFile(new URL(path, root), 'utf8'))
const exists = path => access(new URL(path, root)).then(() => true, () => false)

const failures = []
let checks = 0
const check = (label, ok, detail = '') => { checks++; if (!ok) failures.push(`${label}${detail ? `: ${detail}` : ''}`) }
const same = (label, actual, expected) => check(label, isDeepStrictEqual(actual, expected), `got ${JSON.stringify(actual)}, expected ${JSON.stringify(expected)}`)
const near = (label, actual, expected, tolerance = 1e-8) => check(label, Math.abs(actual - expected) < tolerance, `got ${actual}, expected ${expected}`)

const plan = await json('public/evidence/frontier-image-panel/plan.json')
const corpus = await json('public/evidence/subq-panel/corpus.json')
const frontier = await json('public/evidence/frontier-image-panel/summary.json')
const legacy = await json('public/evidence/legacy-panel/summary.json')
const greedy = await json('public/evidence/greedy/trajectories.json')
const costs = (await json('public/evidence/costs/receipts.json')).receipts
const index = await json('public/evidence/board-receipts/index.json')
const manifest = await json('public/evidence/manifest.json')
const scoreboard = await json('public/evidence/scoreboard.json')
const modelKey = model => model.startsWith('typesafe/jev-1.13') ? 'typesafe/jev-1.13' : model
const answered = new Map()
for (const record of manifest.records) {
  if (record.status === 'not_run' || !record.files || !Object.keys(record.files).length || !record.board) continue
  const key = `${record.study}|${modelKey(record.model)}|${record.board}`
  answered.set(key, [...(answered.get(key) ?? []), record.id])
}
const panelTotals = {}

const boardsById = new Map(corpus.boards.map(board => [board.id, board]))
const letters = grid => grid.map(row => row.map(region => String.fromCharCode(65 + region)))
const touching = (a, b) => Math.max(Math.abs(a[0] - b[0]), Math.abs(a[1] - b[1])) <= 1
const costOf = id => { const at = id.indexOf(':'); return costs[id.slice(0, at)]?.[id.slice(at + 1)] }

function solve(regions) {
  const n = regions.length, found = []
  const walk = (row, cols, usedCols, usedRegions) => {
    if (found.length > 1) return
    if (row === n) { found.push(cols.map(c => c + 1)); return }
    for (let col = 0; col < n; col++) {
      const region = regions[row][col]
      if (usedCols.has(col) || usedRegions.has(region) || (row && Math.abs(cols[row - 1] - col) <= 1)) continue
      walk(row + 1, [...cols, col], new Set([...usedCols, col]), new Set([...usedRegions, region]))
    }
  }
  walk(0, [], new Set(), new Set())
  return found
}

/** The whole reply as {board_id, columns_by_row}, else exactly one such object inside the text. */
function readAnswer(content) {
  if (typeof content !== 'string') return null
  try { const whole = JSON.parse(content); if (whole && Array.isArray(whole.columns_by_row)) return whole.columns_by_row } catch { /* not whole JSON */ }
  const found = new Set()
  for (let start = content.indexOf('{'); start >= 0; start = content.indexOf('{', start + 1)) {
    for (let end = content.indexOf('}', start); end >= 0; end = content.indexOf('}', end + 1)) {
      try { const value = JSON.parse(content.slice(start, end + 1)); if (value && Array.isArray(value.columns_by_row)) found.add(JSON.stringify(value.columns_by_row)); break } catch { /* keep extending */ }
    }
  }
  return found.size === 1 ? JSON.parse([...found][0]) : null
}

function grade(cols, regions, solution) {
  const queens = cols.map((col, row) => [row + 1, col])
  const bad = new Set()
  queens.forEach((a, i) => queens.slice(i + 1).forEach(b => {
    if (a[1] === b[1] || regions[a[0] - 1][a[1] - 1] === regions[b[0] - 1][b[1] - 1] || touching(a, b)) { bad.add(a.join()); bad.add(b.join()) }
  }))
  return queens.map(cell => ({ cell, on_solution: solution[cell[0] - 1] === cell[1], conflict: bad.has(cell.join()) }))
}

const panelIds = plan.selection.boards
same('index lists the 36 panel boards', [...index.boards.map(b => b.id)].sort(), [...panelIds].sort())
same('index is ordered 9x9, then 7x7, then 5x5', index.boards.map(b => b.size), [...index.boards.map(b => b.size)].sort((a, b) => b - a))

for (const entry of index.boards) {
  const id = entry.id
  const path = `public/evidence/board-receipts/${id}.json`
  check(`${id}: board file exists`, await exists(path))
  const data = await json(path)
  const source = boardsById.get(id)
  same(`${id}: regions`, data.board.regions, letters(source.regions))
  const solutions = solve(source.regions)
  same(`${id}: unique solution`, solutions.length, 1)
  same(`${id}: solution`, data.board.solution, solutions[0])
  same(`${id}: solution hash`, createHash('sha256').update(JSON.stringify(solutions[0])).digest('hex'), source.solution_sha256)

  let total = 0, requests = 0
  const byProvider = {}
  for (const system of data.systems) {
    let sum = 0, unknown = 0
    for (const receipt of system.receipts) {
      const entryCost = costOf(receipt.id)
      check(`${id}/${system.name}: receipt ${receipt.id} in the cost index`, !!entryCost)
      if (!entryCost) continue
      same(`${id}/${receipt.id}: cost`, [receipt.usd, receipt.basis], [entryCost[0], entryCost[1]])
      if (receipt.basis === 'unknown') unknown++
      sum += receipt.usd ?? 0
      if (receipt.basis === 'subq_rate') {
        const meta = await json(`public/evidence/runs/${receipt.id.replace(':', '/')}/metadata.json`)
        near(`${id}/${receipt.id}: SubQ tokens x $0.05/M`, receipt.usd, meta.usage.input_tokens * 0.05 / 1e6)
      }
    }
    near(`${id}/${system.name}: total`, system.cost.total_usd, sum)
    same(`${id}/${system.name}: requests and unknown`, [system.cost.requests, system.cost.unknown], [system.receipts.length, unknown])
    same(`${id}/${system.name}: every manifest record listed`, system.receipts.map(r => r.id).sort(), [...(answered.get(`${system.study}|${system.key}|${id}`) ?? [])].sort())
    if (system.receipts.length) {
      same(`${id}/${system.name}: requests counted by the cost index`, system.receipts.map(r => costOf(r.id)?.[3]), system.receipts.map(() => system.receipts.length))
      if (unknown) same(`${id}/${system.name}: no cost per request with an unknown cost`, system.cost.per_request_usd, null)
      else near(`${id}/${system.name}: cost per request`, system.cost.per_request_usd, sum / system.receipts.length, 1e-9)
    }
    if (system.family === 'frontier' || system.family === 'earlier') panelTotals[`${system.study}|${system.key}`] = (panelTotals[`${system.study}|${system.key}`] ?? 0) + sum
    total += sum; requests += system.receipts.length
    if (system.provider) byProvider[system.provider] = (byProvider[system.provider] ?? 0) + sum

    if (system.family === 'frontier' || system.family === 'earlier') {
      const summary = system.family === 'frontier' ? frontier : legacy
      const study = system.family === 'frontier' ? '2026-10-16-frontier-image-panel' : '2026-10-17-earlier-generations-panel'
      const row = summary.rows.find(r => r.board_id === id && r.model === system.key)
      check(`${id}/${system.name}: summary row`, !!row)
      if (!row) continue
      same(`${id}/${system.name}: outcome`, system.outcome, row.state === 'not_run' ? 'not_run' : row.outcome)
      same(`${id}/${system.name}: graded receipt`, system.receipt, `${study}:${row.call_id}`)
      const response = await json(`public/evidence/runs/${study}/${row.call_id}/response.json`)
      const cols = readAnswer(response.choices?.length === 1 ? response.choices[0].message?.content : null)
      const valid = Array.isArray(cols) && cols.length === source.size && cols.every(c => Number.isInteger(c) && c >= 1 && c <= source.size)
      same(`${id}/${system.name}: placement read again`, system.placement ?? null, valid ? cols : null)
      if (valid) same(`${id}/${system.name}: queen marks`, system.queens, grade(cols, letters(source.regions), solutions[0]))
      if (system.solved) same(`${id}/${system.name}: solved means the solution`, cols, solutions[0])
      if (row.outcome === 'wrong' && valid) check(`${id}/${system.name}: wrong is not the solution`, !isDeepStrictEqual(cols, solutions[0]))
      same(`${id}/${system.name}: solved flag`, system.solved, ['strict', 'format_only'].includes(row.outcome) && row.state !== 'not_run')
    } else if (system.family === 'decision') {
      const folder = system.provider === 'SubQ' ? 'subq-panel' : 'jev-panel'
      const raw = await json(`public/evidence/${folder}/trajectories/${id}_raw_a1.json`)
      const local = await json(`public/evidence/${folder}/trajectories/${id}_local_a1.json`)
      same(`${id}/${system.name}: outcome`, system.outcome, raw.success ? 'solved_raw' : local.success ? 'solved_filtered' : 'unsolved')
      same(`${id}/${system.name}: attempts`, system.attempts.map(a => [a.mode, a.success, a.steps.length]), [['raw', raw.success, raw.steps.length], ['local', local.success, local.steps.length]])
    } else {
      const g = greedy.boards.find(b => b.board_id === id)
      same(`${id}/greedy`, [system.solved, system.greedy.steps.length], [g.scored_solved, g.steps.length])
    }
  }
  near(`${id}: board total`, data.cost.total_usd, total)
  same(`${id}: board requests`, data.cost.requests, requests)
  for (const [name, value] of Object.entries(byProvider)) near(`${id}: ${name} total`, data.cost.by_provider[name], value)
  same(`${id}: index entry`, [entry.solved, entry.systems, entry.requests, entry.unknown], [data.systems.filter(s => s.solved).length, data.systems.length, requests, data.systems.reduce((n, s) => n + s.cost.unknown, 0)])
  near(`${id}: index cost`, entry.cost_usd, total)
}

for (const [key, value] of Object.entries(panelTotals)) {
  const [study, model] = key.split('|')
  const row = scoreboard.costs.evaluations.find(r => r.study === study && r.model === model)
  check(`${key}: evaluation row`, !!row)
  if (row) near(`${key}: 36-board total equals the evaluation total (stored to 6 places)`, value, row.cost_usd, 1e-6)
}

if (failures.length) {
  console.error(`FAIL ${failures.length} of ${checks} checks`)
  for (const failure of failures.slice(0, 40)) console.error(`  ${failure}`)
  process.exit(1)
}
console.log(`PASS board receipts: ${checks} checks across ${index.boards.length} boards`)
