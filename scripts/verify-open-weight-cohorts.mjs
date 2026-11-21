import assert from 'node:assert/strict'
import fs from 'node:fs'
import { conditionKey, groupCohorts, rank } from '../src/openWeightCohorts.ts'

// The open-weight leaderboard may only rank studies whose conditions match exactly.
const index = JSON.parse(fs.readFileSync(new URL('../public/evidence/local-qwen/index.json', import.meta.url)))
const byId = id => { const study = index.studies.find(s => s.id === id); assert.ok(study, `Missing study ${id}`); return study }
const entry = (study, size = 'all') => ({ study, rows: study.rows.filter(r => size === 'all' || r.size === Number(size)) })
const key = (study, size) => { const e = entry(study, size); return conditionKey(e.study, e.rows) }

// One changed condition at a time must split an otherwise identical pair.
const base = byId('qwen3.5-9b-nvfp4-fresh1-4arm-np32768')
const twin = { ...base, id: 'twin', model: 'other:1b', label: 'Other', runtime: { ...base.runtime, digest: 'other' } }
assert.equal(key(twin), key(base), 'Model identity alone must not split a cohort')
assert.equal(key({ ...twin, protocol: Object.fromEntries(Object.entries(twin.protocol).reverse()) }), key(base), 'Key order must not matter')
const swapBoard = (row, index) => index === 0 ? { ...row, board_id: 'panel-5-99' } : row
const variants = {
  'board set label': { ...twin, board_set: 'fresh2' },
  'one board identity': { ...twin, rows: twin.rows.map(swapBoard) },
  'treatment arms': { ...twin, rows: twin.rows.filter(r => r.treatment !== 'neutral') },
  'arm prompt text': { ...twin, arms: { ...twin.arms, caveman: { ...twin.arms.caveman, system_sha256: '0'.repeat(64) } } },
  'streaming': { ...twin, protocol: { ...twin.protocol, transport: 'nonstream' } },
  'modality': { ...twin, protocol: { ...twin.protocol, modality: 'text' } },
  'token budget': { ...twin, budget: 24576 },
  'context window': { ...twin, protocol: { ...twin.protocol, num_ctx: 28672 } },
  'decoding': { ...twin, decoding: 'sampling' },
  'temperature': { ...twin, protocol: { ...twin.protocol, temperature: 1 } },
  'sampling options': { ...twin, protocol: { ...twin.protocol, extra_options: { top_p: 0.95 } } },
  'round': { ...twin, round: 2 },
  'seed': { ...twin, protocol: { ...twin.protocol, seed: 1 } },
  'thinking': { ...twin, protocol: { ...twin.protocol, think: 'high' } },
  'constrained format': { ...twin, protocol: { ...twin.protocol, format: { type: 'object' } } },
  'loop intervention': { ...twin, loop_mode: 'active' },
  'loop detector settings': { ...twin, protocol: { ...twin.protocol, loop_stop: { ...twin.protocol.loop_stop, threshold: 0.5 } } },
  'server version': { ...twin, runtime: { ...twin.runtime, server_version: '0.0.0' } },
}
for (const [name, study] of Object.entries(variants)) {
  assert.notEqual(key(study), key(base), `A different ${name} must not share a cohort`)
  assert.equal(groupCohorts([entry(base), entry(study)]).length, 2, `A different ${name} must form its own cohort`)
}
assert.equal(groupCohorts([entry(base), entry(twin)]).length, 1)

// Differing deadlines may share a rank only if every observed call finished inside both.
const shorter = { ...twin, protocol: { ...twin.protocol, timeout_seconds: 50 } }
assert.equal(groupCohorts([entry(base), entry(shorter)]).length, 2)
const unmeasured = { ...twin, protocol: { ...twin.protocol, timeout_seconds: 3000 }, rows: twin.rows.map(r => ({ ...r, elapsed_seconds: null })) }
assert.equal(groupCohorts([entry(base), entry(unmeasured)]).length, 2)
assert.equal(groupCohorts([entry(base), entry({ ...base, id: 'repeat' })]).length, 2)
assert.equal(groupCohorts([entry({ ...base, arms: undefined }), entry({ ...twin, arms: undefined })]).length, 2)

// Places: ties share a place and the next place skips (1, 1, 3, 4).
const places = rank([{ s: 3 }, { s: 5 }, { s: 5 }, { s: 1 }], (a, b) => b.s - a.s)
assert.deepEqual(places.map(p => [p.entry.s, p.place, p.tied]), [[5, 1, true], [5, 1, true], [3, 3, false], [1, 4, false]])

// Shipped snapshot: every cohort shares exactly the same calls, and known mismatches stay apart.
const assessments = index.studies.filter(s => s.kind !== 'audit' && s.status === 'complete' && s.recorded === s.planned && s.rows.every(r => r.state === 'recorded'))
for (const size of ['all', ...new Set(assessments.flatMap(s => s.rows.map(r => String(r.size))))]) {
  const cohorts = groupCohorts(assessments.map(s => entry(s, size)).filter(e => e.rows.length))
  for (const cohort of cohorts) {
    const calls = cohort.map(e => e.rows.map(r => `${r.treatment}/${r.board_id}`).sort().join())
    assert.equal(new Set(calls).size, 1, `Cohort at size ${size} mixes different calls`)
  }
}
const cohortOf = id => groupCohorts(assessments.map(s => entry(s))).find(c => c.some(e => e.study.id === id)).map(e => e.study.id).sort()
const apart = [
  ['gpt-oss-20b-fresh1-text-4arm-np32768', 'qwen3.5-9b-nvfp4-fresh1-text-4arm-np32768'], // thinking effort vs on
  ['qwen3.5-9b-nvfp4-fresh1-json-2arm-np32768', 'qwen3.5-9b-nvfp4-fresh1-4arm-np32768'], // schema-constrained, two arms
  ['qwen3.5-9b-nvfp4-fresh2-4arm-np32768', 'qwen3.5-9b-nvfp4-fresh1-4arm-np32768'], // board panel
  ['qwen3.5-27b-q4_K_M-fresh1-4arm-np24576', 'qwen3.5-9b-nvfp4-fresh1-4arm-np32768'], // token budget
  ['llava-llama3-8b-fresh1-4arm-np4096', 'gemma4-e4b-fresh1-4arm-np32768'], // budget and thinking
  ['qwen3.5-27b-q4_K_M-np24576', 'qwen3.5-27b-q4_K_M-np24576-qwen-sampling-r1'], // greedy vs sampling
  ['qwen3.5-9b-nvfp4-np24576-qwen-sampling-r1', 'qwen3.5-9b-nvfp4-np24576-qwen-sampling-r2'], // round
  ['qwen3.5-4b-np32768-loopstop', 'qwen3.5-4b-fresh1-4arm-np32768'], // loop intervention and panel
  ['qwen3.5-4b-pilot', 'qwen3.5-9b-nvfp4-np24576'], // budget
]
for (const [a, b] of apart) assert.ok(!cohortOf(a).includes(b), `${a} must not be ranked with ${b}`)
// Matches expected in the November 6 snapshot; a failure here means a recorded setting differs.
const together = [
  ['gemma4-e4b-fresh1-4arm-np32768', 'qwen3.5-4b-fresh1-4arm-np32768', 'qwen3.5-9b-nvfp4-fresh1-4arm-np32768'],
  ['qwen3.5-27b-q4_K_M-np24576', 'qwen3.5-9b-nvfp4-np24576'],
  ...[1].map(r => [`qwen3.5-27b-q4_K_M-np24576-qwen-sampling-r${r}`, `qwen3.5-9b-nvfp4-np24576-qwen-sampling-r${r}`]),
  ['qwen3.5-4b-np32768-loopstop', 'qwen3.5-9b-nvfp4-np32768-loopstop'],
]
for (const ids of together) assert.ok(ids.every(id => cohortOf(ids[0]).includes(id)), `Expected one cohort: ${ids.join(', ')}`)
console.log(`Verified open-weight cohorts: ${Object.keys(variants).length} single-condition splits, tied places, ${apart.length} kept-apart pairs and ${together.length} matched cohorts.`)
