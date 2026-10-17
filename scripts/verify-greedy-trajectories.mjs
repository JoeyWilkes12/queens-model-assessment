#!/usr/bin/env node
/**
 * Offline check of public/evidence/greedy/trajectories.json. No network and no
 * writes. Nothing is imported from the Python generator: the rule and the
 * solver below are written again from the board regions alone.
 *
 * 1. Each record's regions match its source board (trajectory-study.json for
 *    the nine original boards, subq-panel/corpus.json for the 192 panel boards).
 * 2. Each board has exactly one solution (row-by-row search); panel solutions
 *    match the corpus's solution_sha256 commitment.
 * 3. Every step (menus, tie, candidates, cell, forced, on-solution, continued)
 *    and every scored result equals an independent run of the rule, and the
 *    frozen result stored in each panel board's corpus profile.
 * 4. Totals match the file's totals and scoreboard.json's greedy baselines,
 *    board by board, for the original nine and the 192-board panel, and the
 *    counts quoted in the chapter hero and docs/greedy-rule.md.
 * 5. A forced step never leaves the solution while all earlier queens are
 *    correct; every failure dead-ends if the rule keeps going.
 * 6. public/evidence/greedy/README.md is a copy of docs/greedy-rule.md.
 */
import { isDeepStrictEqual } from 'node:util'
import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'

const root = new URL('../', import.meta.url)
const read = path => readFile(new URL(path, root), 'utf8')
const json = async path => JSON.parse(await read(path))

const data = await json('public/evidence/greedy/trajectories.json')
const scoreboard = await json('public/evidence/scoreboard.json')
const corpus = await json('public/evidence/subq-panel/corpus.json')
const study = await json('public/evidence/trajectory-study.json')

const failures = []
let checks = 0
const check = (label, ok, detail = '') => { checks++; if (!ok) failures.push(`${label}${detail ? `: ${detail}` : ''}`) }
const same = (label, actual, expected) => check(label, isDeepStrictEqual(actual, expected), `got ${JSON.stringify(actual)}, expected ${JSON.stringify(expected)}`)

const letters = grid => grid.map(row => row.map(region => String.fromCharCode(65 + region)))
const touching = (a, b) => Math.max(Math.abs(a[0] - b[0]), Math.abs(a[1] - b[1])) <= 1

/** All solutions, row by row, stopping once a second one is found. Columns 0-based. */
function solutions(regions) {
  const n = regions.length, found = [], columns = []
  const usedColumns = new Set(), usedRegions = new Set()
  const place = row => {
    if (found.length > 1) return
    if (row === n) { found.push([...columns]); return }
    for (let column = 0; column < n; column++) {
      const region = regions[row][column]
      if (usedColumns.has(column) || usedRegions.has(region)) continue
      if (row > 0 && Math.abs(columns[row - 1] - column) <= 1) continue
      columns.push(column); usedColumns.add(column); usedRegions.add(region)
      place(row + 1)
      columns.pop(); usedColumns.delete(column); usedRegions.delete(region)
    }
  }
  place(0)
  return found
}

/** The rule, continued past the scored stop until a menu is empty or n queens stand. 1-based output. */
function trace(regions, solution) {
  const n = regions.length
  const names = [...new Set(regions.flat())].sort()
  const placed = [], steps = []
  let stop = null
  for (let depth = 1; depth <= n; depth++) {
    const occupied = new Set(placed.map(([r, c]) => regions[r][c]))
    const menus = new Map()
    for (const name of names) if (!occupied.has(name)) menus.set(name, [])
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
      const menu = menus.get(regions[r][c])
      if (menu && placed.every(([s, d]) => r !== s && c !== d && regions[r][c] !== regions[s][d] && !touching([r, c], [s, d]))) menu.push([r, c])
    }
    let region = null
    for (const [name, cells] of menus) if (region === null || cells.length < menus.get(region).length) region = name
    const fewest = menus.get(region).length
    const base = { step: depth, region, menu_sizes: Object.fromEntries([...menus].map(([name, cells]) => [name, cells.length])), tied_regions: [...menus].filter(([, cells]) => cells.length === fewest).map(([name]) => name) }
    if (!fewest) {
      steps.push({ ...base, candidates: [], cell: null, on_unique_solution: null, empty_menu: true })
      stop = stop || { step: depth, reason: 'empty_menu' }
      break
    }
    const cell = menus.get(region)[0]
    const on = solution[cell[0]] === cell[1]
    steps.push({ ...base, candidates: menus.get(region).map(([r, c]) => [r + 1, c + 1]), cell: [cell[0] + 1, cell[1] + 1], forced: fewest === 1, on_unique_solution: on, empty_menu: false, after_scored_stop: stop !== null })
    if (!on && stop === null) stop = { step: depth, reason: 'off_solution' }
    placed.push(cell)
  }
  return {
    steps,
    scored_solved: stop === null,
    scored_correct_prefix: stop ? stop.step - 1 : n,
    scored_stop: stop || { step: null, reason: 'solved' },
    continued_queens: steps.filter(step => step.cell).length,
    continued_full: placed.length === n && steps.every(step => step.cell),
  }
}

// 1. Sources and coverage.
const sources = new Map([
  ...study.boards.map(board => [board.id, { source: 'original-nine', size: board.size, regions: letters(board.regions) }]),
  ...corpus.boards.map(board => [board.id, { source: 'panel-192', size: board.size, regions: letters(board.regions), solutionSha: board.solution_sha256, profile: board.profile.greedy }]),
])
same('record count', data.boards.length, sources.size)
same('unique board ids', new Set(data.boards.map(board => board.board_id)).size, data.boards.length)

let steps = 0
for (const record of data.boards) {
  const id = record.board_id
  const source = sources.get(id)
  if (!source) { check(`${id} source board`, false, 'not in trajectory-study.json or corpus.json'); continue }
  same(`${id} source`, record.source, source.source)
  same(`${id} size`, record.size, source.size)
  same(`${id} regions`, record.regions, source.regions)

  // 2. Unique solution, independently found.
  const found = solutions(source.regions)
  same(`${id} solution count`, found.length, 1)
  if (found.length !== 1) continue
  const solution = found[0]
  if (source.solutionSha) same(`${id} solution_sha256`, createHash('sha256').update(JSON.stringify(solution.map(c => c + 1))).digest('hex'), source.solutionSha)

  // 3. Every step and scored result.
  const expected = trace(source.regions, solution)
  same(`${id} step count`, record.steps.length, expected.steps.length)
  expected.steps.forEach((step, index) => same(`${id} step ${step.step}`, record.steps[index], step))
  steps += expected.steps.length
  for (const key of ['scored_solved', 'scored_correct_prefix', 'scored_stop', 'continued_queens', 'continued_full']) same(`${id} ${key}`, record[key], expected[key])
  // The corpus profile holds the frozen boards.py result for each panel board.
  if (source.profile) same(`${id} corpus profile.greedy`, source.profile, { solved: expected.scored_solved, correct_prefix: expected.scored_correct_prefix, stop_reason: expected.scored_stop.reason })
}

// 4. Totals against the file, the scoreboard and quoted counts.
const sizes = [5, 7, 9]
const solvedIn = (source, size) => data.boards.filter(board => board.source === source && (size === undefined || board.size === size))
for (const source of ['original-nine', 'panel-192']) for (const size of sizes) {
  const boards = solvedIn(source, size)
  same(`totals ${source} ${size}`, data.totals[source][String(size)], { boards: boards.length, solved: boards.filter(board => board.scored_solved).length })
}
const sets = { original: 'original-nine', panel: 'panel-192' }
const anySolved = (model, id) => { const cell = model.per_board[id]; return !!cell && (cell.raw[0] > 0 || cell.local[0] > 0) }
const counted = {}
for (const [key, source] of Object.entries(sets)) {
  const set = scoreboard.decision[key]
  const records = solvedIn(source)
  same(`scoreboard ${key} board ids`, set.boards.map(board => board.id).sort(), records.map(board => board.board_id).sort())
  for (const record of records) same(`scoreboard ${key} greedy ${record.board_id}`, set.baselines.greedy[record.board_id], record.scored_solved)
  const model = name => set.models.find(entry => entry.name.startsWith(name))
  counted[key] = {
    greedy: records.filter(board => board.scored_solved).length,
    scoreboardGreedy: Object.values(set.baselines.greedy).filter(Boolean).length,
    jev: set.boards.filter(board => anySolved(model('Jev'), board.id)).length,
    subq: set.boards.filter(board => anySolved(model('SubQ'), board.id)).length,
  }
}
// Quoted in src/GreedyRule.tsx (hero and replays) and docs/greedy-rule.md.
same('quoted counts, original nine', counted.original, { greedy: 4, scoreboardGreedy: 4, jev: 1, subq: 2 })
same('quoted counts, 192-board panel', counted.panel, { greedy: 80, scoreboardGreedy: 80, jev: 21, subq: 19 })
same('quoted panel by size', sizes.map(size => solvedIn('panel-192', size).filter(board => board.scored_solved).length), [42, 24, 14])
same('quoted original by size', sizes.map(size => solvedIn('original-nine', size).filter(board => board.scored_solved).length), [2, 1, 1])
const fiveTwo = data.boards.find(board => board.board_id === 'sequence-5-2')
same('sequence-5-2: rule fails at step 3 with 2 correct queens', [fiveTwo?.scored_solved, fiveTwo?.scored_stop.step, fiveTwo?.scored_correct_prefix], [false, 3, 2])
same('sequence-5-2: SubQ solved it with the filtered menu', scoreboard.decision.original.models.find(model => model.name.startsWith('SubQ')).per_board['sequence-5-2'].local, [5, 5])

// 5. The two structural facts.
const failing = data.boards.filter(board => !board.scored_solved)
const scored = data.boards.flatMap(board => board.steps.filter(step => step.cell && !step.after_scored_stop))
same('forced scored steps that leave the solution', scored.filter(step => step.forced && !step.on_unique_solution).length, 0)
same('scored runs that end on an empty menu', data.boards.filter(board => board.scored_stop.reason === 'empty_menu').length, 0)
same('failing steps with fewer than two legal cells', failing.filter(board => board.steps[board.scored_stop.step - 1].candidates.length < 2).length, 0)
same('failing boards that complete when continued', failing.filter(board => board.continued_full).length, 0)
same('failing boards whose continuation ends on an empty menu', failing.filter(board => board.steps.at(-1).empty_menu).length, failing.length)
same('solved boards complete', data.boards.filter(board => board.scored_solved && !board.continued_full).length, 0)

// 6. The evidence README is the reference document.
const optional = path => read(path).catch(() => null)
const [readme, reference] = await Promise.all([optional('public/evidence/greedy/README.md'), optional('docs/greedy-rule.md')])
check('docs/greedy-rule.md exists', reference !== null)
check('public/evidence/greedy/README.md is a copy of docs/greedy-rule.md', reference !== null && readme === reference)

const menuSizes = failing.reduce((counts, board) => { const size = board.steps[board.scored_stop.step - 1].candidates.length; counts[size] = (counts[size] || 0) + 1; return counts }, {})
console.log(`${data.boards.length} boards, ${steps} steps (${scored.length} scored, ${scored.filter(step => step.forced).length} forced), ${checks} checks`)
console.log(`solved: original ${counted.original.greedy}/9, panel ${counted.panel.greedy}/192 (Jev ${counted.panel.jev}, SubQ ${counted.panel.subq}); failures ${failing.length}, legal cells at the failing step ${JSON.stringify(menuSizes)}, all dead-end when continued`)
if (failures.length) {
  console.error(`FAIL ${failures.length} mismatch${failures.length === 1 ? '' : 'es'}:`)
  failures.slice(0, 40).forEach(line => console.error(`  ${line}`))
  process.exit(1)
}
console.log('PASS greedy trajectories')
