/**
 * Behavior of the shared JSON loader (src/sharedJson.ts) with a scripted fetch: no network, no browser.
 * Run: node --experimental-strip-types scripts/test-shared-json.mjs
 */
import assert from 'node:assert/strict'
import { clearSharedJson, loadSharedJson } from '../src/sharedJson.ts'

const calls = []
let script = []
globalThis.fetch = url => {
  calls.push(url)
  const next = script.shift() ?? { ok: true, body: { ok: 1 } }
  return new Promise(resolve => setTimeout(() => resolve({ ok: next.ok, status: next.ok ? 200 : 503, json: async () => next.body }), 5))
}
const isOk = value => !!value && typeof value === 'object' && value.ok === 1
const resource = url => ({ url, validate: isOk })
const reset = () => { calls.length = 0; script = []; clearSharedJson() }

// Concurrent consumers share one request and the same parsed object.
reset()
const [a, b] = await Promise.all([loadSharedJson(resource('/a.json')), loadSharedJson(resource('/a.json'))])
assert.equal(calls.length, 1, 'one fetch for two concurrent consumers')
assert.equal(a, b, 'both consumers receive the same parsed result')
await loadSharedJson(resource('/a.json'))
assert.equal(calls.length, 1, 'a settled success is reused')

// A failure is not cached: the next request (an explicit retry) fetches again and can succeed.
reset()
script = [{ ok: false }]
await assert.rejects(loadSharedJson(resource('/b.json')))
assert.deepEqual(await loadSharedJson(resource('/b.json')), { ok: 1 })
assert.equal(calls.length, 2, 'retry after failure fetches once more, with no automatic retries')

// A response that fails validation is rejected and evicted, never published as data.
reset()
script = [{ ok: true, body: { ok: 0 } }]
await assert.rejects(loadSharedJson(resource('/c.json')), /unexpected shape/)
assert.deepEqual(await loadSharedJson(resource('/c.json')), { ok: 1 })
assert.equal(calls.length, 2)

// Concurrent consumers of a failing request both see the failure; neither keeps a rejected promise.
reset()
script = [{ ok: false }]
const results = await Promise.allSettled([loadSharedJson(resource('/d.json')), loadSharedJson(resource('/d.json'))])
assert.deepEqual(results.map(r => r.status), ['rejected', 'rejected'])
assert.equal(calls.length, 1)
await loadSharedJson(resource('/d.json'))
assert.equal(calls.length, 2)

// The cache is bounded: the oldest entry is evicted and refetched on next use.
reset()
for (let index = 0; index < 17; index++) await loadSharedJson(resource(`/many-${index}.json`))
assert.equal(calls.length, 17)
await loadSharedJson(resource('/many-16.json'))
assert.equal(calls.length, 17, 'recent entries stay cached')
await loadSharedJson(resource('/many-0.json'))
assert.equal(calls.length, 18, 'the oldest entry was evicted')

console.log('PASS shared JSON loader: sharing, failure eviction, validation, concurrent failure, bounded cache')
