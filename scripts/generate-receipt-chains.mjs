/** Generate navigation from recorded attempts, never from filename adjacency. */
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFile, writeFile, access } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const evidence = path.join(root, 'public/evidence')
const manifest = JSON.parse(await readFile(path.join(evidence, 'manifest.json'), 'utf8'))
const byId = new Map(manifest.records.map(record => [record.id, record]))
const definitions = [
  { filename: 'trajectory-study.json', studyId: '2026-09-30-jev-trajectories', modelLabel: 'Jev', route: 'jev-trajectories' },
  { filename: 'subq-trajectories-summary.json', studyId: '2026-10-13-subq-trajectories', modelLabel: 'SubQ', route: 'subq-assessment' },
]
const sources = [], chains = [], seen = new Set()
for (const definition of definitions) {
  const bytes = await readFile(path.join(evidence, definition.filename))
  sources.push({ path: `public/evidence/${definition.filename}`, sha256: createHash('sha256').update(bytes).digest('hex') })
  const data = JSON.parse(bytes)
  for (const attempt of data.trajectories) {
    const events = []
    for (const step of attempt.steps) {
      for (const phase of ['region', 'cell']) {
        const call = step[`${phase}_call`]
        const forced = step[`${phase}_forced`] === true
        assert(!(call && forced), 'A forced phase cannot have a model receipt')
        if (!call && !forced) continue
        events.push({ call, forced, step: step.step, phase })
      }
    }
    const calls = []
    for (let i = 0; i < events.length; i++) {
      const event = events[i]
      if (!event.call) continue
      const id = `${definition.studyId}:${event.call}`
      assert(!seen.has(id), `Receipt belongs to multiple attempts: ${id}`)
      seen.add(id)
      const record = byId.get(id)
      assert(record && record.study === definition.studyId, `Missing receipt: ${id}`)
      assert(record.board === attempt.board_id, `Board mismatch: ${id}`)
      for (const key of ['request', 'response', 'metadata', 'grade']) {
        assert(record.files[key], `Missing ${key}: ${id}`)
        await access(path.join(evidence, record.files[key]))
      }
      let forcedBeforeNext = 0
      for (let j = i + 1; j < events.length && !events[j].call; j++) {
        if (events[j].forced) forcedBeforeNext++
      }
      calls.push({ id, step: event.step, phase: event.phase, forcedBeforeNext })
    }
    chains.push({ studyId: definition.studyId, trajectoryId: attempt.trajectory_id,
      modelLabel: definition.modelLabel, playbackPath: `#/${definition.route}/${encodeURIComponent(attempt.trajectory_id)}`,
      stopReason: attempt.stop_reason, calls })
  }
}
const output = { schemaVersion: 1, sources, chains }
await writeFile(path.join(root, 'src/trajectoryReceiptChains.json'), JSON.stringify(output, null, 2) + '\n')
console.log(JSON.stringify({ attempts: chains.length, receipts: seen.size }))
