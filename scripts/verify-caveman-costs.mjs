/** Verify the pure cost projection against saved receipts without inference or network access. */
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { aggregateUsage, breakEvenRatio, costComparison, parseRate } from '../src/cavemanCost.ts'

/** Assert approximate equality without hiding a nonfinite result. */
function near(actual, expected, tolerance = 1e-12) {
  assert.equal(typeof actual, 'number')
  assert.ok(Number.isFinite(actual) && Math.abs(actual - expected) <= tolerance, `${actual} != ${expected}`)
}

const summary = JSON.parse(await readFile(new URL('../public/evidence/ollama/summary.json', import.meta.url), 'utf8'))
const rows = summary.rows
assert.equal(rows.length, 24)
const baselineRows = rows.filter(row => row.treatment === 'baseline')
const cavemanRows = rows.filter(row => row.treatment === 'caveman')
const baseline = aggregateUsage(baselineRows), caveman = aggregateUsage(cavemanRows)
assert.deepEqual(baseline, { samples: 12, input: 10236, output: 141515, strict: 1, valid: 3, capped: 9 })
assert.deepEqual(caveman, { samples: 12, input: 23808, output: 132800, strict: 5, valid: 5, capped: 7 })
assert.equal(caveman.input - baseline.input, 13572)
assert.equal(caveman.output - baseline.output, -8715)
assert.equal(caveman.input + caveman.output - baseline.input - baseline.output, 4857)
near(breakEvenRatio(baseline, caveman), 13572 / 8715)

const expectedSizes = [
  { size: 5, baseline: { samples: 4, input: 3412, output: 43888, strict: 1, valid: 2, capped: 2 }, caveman: { samples: 4, input: 7936, output: 35947, strict: 3, valid: 3, capped: 1 }, ratio: 4524 / 7941 },
  { size: 7, baseline: { samples: 4, input: 3412, output: 48475, strict: 0, valid: 1, capped: 3 }, caveman: { samples: 4, input: 7936, output: 47701, strict: 2, valid: 2, capped: 2 }, ratio: 4524 / 774 },
  { size: 9, baseline: { samples: 4, input: 3412, output: 49152, strict: 0, valid: 0, capped: 4 }, caveman: { samples: 4, input: 7936, output: 49152, strict: 0, valid: 0, capped: 4 }, ratio: null },
]
for (const expected of expectedSizes) {
  const b = aggregateUsage(baselineRows.filter(row => row.size === expected.size))
  const c = aggregateUsage(cavemanRows.filter(row => row.size === expected.size))
  assert.deepEqual(b, expected.baseline)
  assert.deepEqual(c, expected.caveman)
  if (expected.ratio === null) assert.equal(breakEvenRatio(b, c), null)
  else near(breakEvenRatio(b, c), expected.ratio)
}

// Equal token rates increase total cost; higher output weighting can reverse the sign.
const equal = costComparison(baseline, caveman, { input: 1, output: 1 })
near(equal.baseline.total, 0.151751)
near(equal.caveman.total, 0.156608)
near(equal.inputDelta, 0.013572)
near(equal.outputDelta, -0.008715)
near(equal.delta, 0.004857)
near(equal.percent, 3.2006378870649934)
const double = costComparison(baseline, caveman, { input: 1, output: 2 })
near(double.delta, -0.003858)
assert.ok(equal.delta > 0 && double.delta < 0)
const threshold = costComparison(baseline, caveman, { input: 1, output: breakEvenRatio(baseline, caveman) })
near(threshold.delta, 0)
const nine = expectedSizes[2]
near(costComparison(nine.baseline, nine.caveman, { input: 0.17, output: 0.25 }).delta, 4524 * 0.17 / 1_000_000)
assert.equal(costComparison(baseline, caveman, { input: 0, output: 0 }).percent, null)
assert.equal(costComparison({ ...baseline, input: 0, output: 0 }, caveman, { input: 1, output: 1 }).percent, null)

// One real receipt proves reported generated tokens are used once, including its thinking budget.
const cappedRow = baselineRows.find(row => row.finish_reason === 'length')
const cappedResponse = JSON.parse(await readFile(new URL(`../public/evidence/ollama/receipts/${cappedRow.call_id}/response.json`, import.meta.url), 'utf8'))
assert.equal(cappedResponse.eval_count, 12288)
assert.equal(cappedResponse.message.content, '')
assert.equal(aggregateUsage([cappedRow]).output, cappedResponse.eval_count)
assert.equal(aggregateUsage([]), null)
for (const state of ['not_run', 'started_unrecorded']) assert.equal(aggregateUsage([{ ...cappedRow, state }]), null)
for (const value of [null, undefined, NaN, Infinity, -1, 1.5, '12288', Number.MAX_SAFE_INTEGER + 1]) {
  assert.equal(aggregateUsage([{ ...cappedRow, input_tokens: value }]), null)
  assert.equal(aggregateUsage([{ ...cappedRow, output_tokens: value }]), null)
}
assert.equal(aggregateUsage([{ ...cappedRow, input_tokens: Number.MAX_SAFE_INTEGER }, cappedRow]), null)
for (const value of [NaN, Infinity, -1, undefined, '0.1']) {
  assert.equal(costComparison(baseline, caveman, { input: value, output: 1 }), null)
  assert.equal(costComparison(baseline, caveman, { input: 1, output: value }), null)
}
assert.equal(costComparison(baseline, caveman, { input: Number.MAX_VALUE, output: 1 }), null)
assert.equal(costComparison({ ...baseline, input: -1 }, caveman, { input: 1, output: 1 }), null)
assert.equal(breakEvenRatio(baseline, baseline), null)
assert.equal(breakEvenRatio(caveman, baseline), null)
assert.equal(breakEvenRatio({ ...baseline, input: NaN }, caveman), null)
for (const value of ['', ' ', '-1', '-0', 'NaN', 'Infinity', '1e999', '0x10', '1,000', '1.2.3', '1usd', '+1']) assert.equal(parseRate(value), null, value)
for (const [value, expected] of [['0', 0], ['0.17', 0.17], ['.25', 0.25], ['1.', 1], [' 2.6 ', 2.6], ['1e-2', 0.01]]) assert.equal(parseRate(value), expected)

// Pricing is a dated reference snapshot; every amount must agree with the raw per-token quote.
const pricing = JSON.parse(await readFile(new URL('../public/evidence/ollama/pricing-reference.json', import.meta.url), 'utf8'))
assert.equal(pricing.schema_version, 1)
assert.equal(pricing.measured_model, summary.runtime.model)
assert.equal(pricing.exact_model_available, false)
assert.equal(pricing.source.url, 'https://openrouter.ai/api/v1/models')
assert.equal(pricing.source.pricing_unit, 'USD per token')
assert.ok(Number.isFinite(Date.parse(pricing.checked_utc)))
assert.ok(Array.isArray(pricing.references) && pricing.references.length > 0)
const ids = new Set()
for (const reference of pricing.references) {
  assert.equal(ids.has(reference.id), false)
  ids.add(reference.id)
  assert.ok(reference.id.startsWith('qwen/'))
  assert.equal(reference.source_url, pricing.source.url)
  assert.ok(new URL(reference.model_url).hostname === 'openrouter.ai')
  const input = parseRate(reference.raw_pricing.prompt), output = parseRate(reference.raw_pricing.completion)
  assert.notEqual(input, null)
  assert.notEqual(output, null)
  near(input * 1_000_000, reference.input_usd_per_million)
  near(output * 1_000_000, reference.output_usd_per_million)
  const projection = costComparison(baseline, caveman, { input: reference.input_usd_per_million, output: reference.output_usd_per_million })
  assert.notEqual(projection, null)
  near(projection.delta, (13572 * reference.input_usd_per_million - 8715 * reference.output_usd_per_million) / 1_000_000)
}
console.log(`Verified pure Caveman cost math, 24 saved receipts, three board-size groups, and ${pricing.references.length} dated reference tariffs (offline).`)
