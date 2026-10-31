#!/usr/bin/env node
/**
 * Offline check of public/evidence/leaderboard.json. No network and no writes, and nothing is imported
 * from the Python builder: every entry is read again from the published evidence.
 *
 * 1. The boards are the 36 board-receipt boards, in index order; the local boards are the 12 boards of
 *    ollama/summary.json, all inside the 36.
 * 2. The systems are exactly the board-receipt systems plus the two local Qwen runs. Each receipt system has
 *    the receipt's name, author, logo, family and route, a method and attempt count that follow from its
 *    family, and on every board the receipt's outcome, solved flag, cost and request count.
 * 3. The two local systems have fixed identities, and every one of their cells matches exactly one recorded
 *    row; strict and format-only answers count as solved, as the language-model panels count them.
 * 4. Jev, SubQ Snap and the greedy rule carry their 192-board panel results from the panel summaries.
 * 5. The counts the page shows: four frontier models solve 140 of 144 on the 36 boards and the five older
 *    reasoning models 166 of 180; Jev, SubQ Snap and the rule solve 3, 4 and 13 of the 36 and 21, 19 and 80
 *    of 192; local Qwen solves 3 and 5 of 12 (1 and 5 in the exact format).
 */
import { isDeepStrictEqual } from 'node:util'
import { readFile } from 'node:fs/promises'

const root = new URL('../', import.meta.url)
const json = async path => JSON.parse(await readFile(new URL(`public/evidence/${path}`, root), 'utf8'))

const failures = []
let checks = 0
const check = (label, ok, detail = '') => { checks++; if (!ok) failures.push(`${label}${detail ? `: ${detail}` : ''}`) }
const same = (label, actual, expected) => check(label, isDeepStrictEqual(actual, expected), `got ${JSON.stringify(actual)}, expected ${JSON.stringify(expected)}`)

const board = await json('leaderboard.json')
const index = (await json('board-receipts/index.json')).boards
const ollama = await json('ollama/summary.json')
const METHOD = { frontier: ['image', 1], earlier: ['image', 1], decision: ['menus', 2], baseline: ['rule', 0], local: ['image', 1] }
const LOCAL = { baseline: { key: 'qwen3.5-4b', name: 'Qwen3.5 4B, local' }, caveman: { key: 'qwen3.5-4b-caveman', name: 'Qwen3.5 4B + Caveman, local' } }

same('boards', board.boards, index.map(entry => ({ id: entry.id, size: entry.size })))
const ids = index.map(entry => entry.id)
const local = [...new Set(ollama.rows.map(row => row.board_id))].sort((a, b) => ids.indexOf(a) - ids.indexOf(b))
same('local boards', board.local_boards, local)
check('local boards inside the panel', local.every(id => ids.includes(id)))

const byKey = new Map(board.systems.map(system => [system.key, system]))
check('system keys are unique', byKey.size === board.systems.length)
for (const system of board.systems) same(`${system.key} method`, [system.method, system.attempts_per_board], METHOD[system.family])

const receiptKeys = new Set()
for (const id of ids) {
  const receipt = await json(`board-receipts/${id}.json`)
  for (const entry of receipt.systems) {
    receiptKeys.add(entry.key)
    const system = byKey.get(entry.key)
    if (!system) { check(`${entry.key} listed`, false); continue }
    same(`${entry.key} identity`, [system.name, system.author, system.logo, system.family, system.route], [entry.name, entry.author, entry.logo, entry.family, entry.route ?? null])
    const usd = entry.family === 'baseline' ? null : entry.cost?.total_usd ?? 0
    same(`${entry.key} on ${id}`, system.boards[id], { outcome: entry.outcome, solved: entry.solved, usd, requests: entry.cost?.requests ?? 0, unknown: entry.cost?.unknown ?? 0 })
  }
}
same('systems are the receipt systems plus the local runs', [...byKey.keys()].sort(), [...receiptKeys, ...Object.values(LOCAL).map(entry => entry.key)].sort())
for (const key of receiptKeys) same(`${key} covers every board`, Object.keys(byKey.get(key)?.boards ?? {}).sort(), [...ids].sort())

for (const [treatment, { key, name }] of Object.entries(LOCAL)) {
  const system = byKey.get(key)
  same(`${key} identity`, [system?.name, system?.author, system?.logo, system?.family, system?.route], [name, 'Qwen', null, 'local', null])
  const rows = ollama.rows.filter(row => row.treatment === treatment && row.state === 'recorded')
  same(`${key} boards`, Object.keys(system?.boards ?? {}).sort(), [...local].sort())
  for (const [id, cell] of Object.entries(system?.boards ?? {})) {
    const matches = rows.filter(row => row.board_id === id)
    check(`${key} on ${id} has one recorded row`, matches.length === 1, `${matches.length} rows`)
    if (matches.length === 1) same(`${key} on ${id}`, cell, { outcome: matches[0].outcome, solved: ['strict', 'format_only'].includes(matches[0].outcome), usd: null, requests: 1, unknown: 0 })
  }
}

const greedy = (await json('greedy/trajectories.json')).totals['panel-192']
const panelBoards = Object.values(greedy).reduce((sum, part) => sum + part.boards, 0)
same('Jev 192-board panel', byKey.get('typesafe/jev-1.13')?.panel_192, { solved: (await json('jev-panel/summary.json')).boards_solved, boards: panelBoards })
same('SubQ Snap 192-board panel', byKey.get('subq-snap-preview')?.panel_192, { solved: (await json('subq-panel/summary.json')).boards_solved, boards: panelBoards })
same('rule 192-board panel', byKey.get('greedy')?.panel_192, { solved: Object.values(greedy).reduce((sum, part) => sum + part.solved, 0), boards: panelBoards })

const cells = name => Object.values(board.systems.find(entry => entry.name === name)?.boards ?? {})
const solved = name => cells(name).filter(cell => cell.solved).length
const sum = names => names.reduce((total, name) => total + solved(name), 0)
same('frontier 140 of 144', sum(['GPT-5.6 Sol', 'Claude Opus 4.8', 'Grok 4.6', 'Gemini 3.1 Pro Preview']), 140)
same('older reasoning models 166 of 180', sum(['GPT-5.5', 'GPT-5.4', 'GPT-5', 'Claude Opus 4.7', 'Claude Opus 4.6']), 166)
same('Jev, SubQ Snap and the rule on 36', ['Jev 1.13', 'SubQ Snap (preview)', 'Greedy rule (no model)'].map(solved), [3, 4, 13])
same('Jev, SubQ Snap and the rule on 192', ['typesafe/jev-1.13', 'subq-snap-preview', 'greedy'].map(key => byKey.get(key)?.panel_192?.solved), [21, 19, 80])
same('local Qwen on 12', [LOCAL.baseline.name, LOCAL.caveman.name].map(solved), [3, 5])
same('local Qwen on 12, exact format', [LOCAL.baseline.name, LOCAL.caveman.name].map(name => cells(name).filter(cell => cell.outcome === 'strict').length), [1, 5])

if (failures.length) {
  console.error(`FAIL leaderboard: ${failures.length} of ${checks} checks\n${failures.slice(0, 20).join('\n')}`)
  process.exit(1)
}
console.log(`PASS leaderboard: ${checks} checks, ${board.systems.length} systems on ${ids.length} boards`)
