/** Repricing local runner counts is a scenario, not a prediction of a hosted bill.
 * output_tokens must already include thinking exactly once. Cache/image fees are unknown.
 */
export type CostRow = { state: string; input_tokens: number | null; output_tokens: number | null; strict_correct: boolean; format_only_correct: boolean; truncated: boolean; loop_stopped: boolean; elapsed_seconds: number | null; treatment: 'baseline' | 'schema' | 'neutral' | 'caveman'; rescue: null | { input_tokens: number | null; output_tokens: number | null; strict_correct: boolean; elapsed_seconds: number | null } }
export type Row = CostRow
/** USD per million tokens. */
export type Rates = { input: number; output: number }
/** Permit an arm contrast only on the same unique recorded boards; pending calls never create savings. */
export function isMatchedCohort(rows: ReadonlyArray<CostRow & { board_id: string }>): boolean {
  const base = rows.filter(r => r.state === 'recorded' && r.treatment === 'baseline').map(r => r.board_id)
  const cave = rows.filter(r => r.state === 'recorded' && r.treatment === 'caveman').map(r => r.board_id)
  return base.length > 0 && base.length === cave.length && new Set(base).size === base.length
    && new Set(cave).size === cave.length && base.every(id => cave.includes(id))
}
function finite(value: number): number { if (!Number.isFinite(value) || value < 0) throw new RangeError('Expected finite nonnegative value'); return value }
function token(value: number | null): number | null { if (value !== null && (!Number.isSafeInteger(value) || value < 0)) throw new RangeError('Expected nonnegative safe integer token count or null'); return value }
function add(a: number, b: number): number { const n = a + b; if (!Number.isSafeInteger(n)) throw new RangeError('Token sum overflow'); return n }
function money(a: number, b: number): number { return finite(a + b) }
/** Parse a finite nonnegative USD/M tariff; reject blank and malformed strings. */
export function parseRate(value: string | number): number { if (typeof value !== 'string' && typeof value !== 'number') throw new RangeError('Invalid rate'); if (typeof value === 'string' && !/^\s*(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?\s*$/i.test(value)) throw new RangeError('Invalid rate'); return finite(Number(value)) }
/** Sum exact reported counts, retaining known partial sums while totals stay unknown. */
export function aggregateUsage(rows: ReadonlyArray<{ input_tokens: number | null; output_tokens: number | null }>) {
  let knownInputTokens = 0, knownOutputTokens = 0, missingInputCount = 0, missingOutputCount = 0
  for (const row of rows) { const i = token(row.input_tokens), o = token(row.output_tokens); if (i === null) missingInputCount++; else knownInputTokens = add(knownInputTokens, i); if (o === null) missingOutputCount++; else knownOutputTokens = add(knownOutputTokens, o) }
  const inputTokens = rows.length && !missingInputCount ? knownInputTokens : null
  const outputTokens = rows.length && !missingOutputCount ? knownOutputTokens : null
  return { attemptCount: rows.length, inputTokens, outputTokens, knownInputTokens, knownOutputTokens, missingInputCount, missingOutputCount, complete: inputTokens !== null && outputTokens !== null }
}
function priced(rows: ReadonlyArray<{ input_tokens: number | null; output_tokens: number | null }>, rates: Rates) {
  const usage = aggregateUsage(rows)
  const cost = (n: number | null, rate: number) => n === null ? null : finite(n / 1e6 * rate)
  const inputCostUsd = cost(usage.inputTokens, rates.input), outputCostUsd = cost(usage.outputTokens, rates.output)
  return { usage, inputCostUsd, outputCostUsd, costUsd: inputCostUsd === null || outputCostUsd === null ? null : money(inputCostUsd, outputCostUsd), knownPartialCostUsd: money(cost(usage.knownInputTokens, rates.input)!, cost(usage.knownOutputTokens, rates.output)!) }
}
/** Price recorded one-shot attempts; optionally add rescues and count each successful row once. */
export function estimateCohort(rows: ReadonlyArray<CostRow>, rates: Rates, includeRescues = false) {
  const pendingCount = rows.filter(row => row.state !== 'recorded').length
  rows = rows.filter(row => row.state === 'recorded')
  const checked = { input: parseRate(rates.input), output: parseRate(rates.output) }
  const base = priced(rows, checked), rescueRows = rows.flatMap(row => row.rescue ? [row.rescue] : [])
  const rescues = priced(rescueRows, checked)
  const strictSuccessCount = rows.filter(row => row.strict_correct).length
  const combinedStrictSuccessCount = rows.filter(row => row.strict_correct || (includeRescues && row.rescue?.strict_correct)).length
  const rescueIncrementalCostUsd = includeRescues ? (rescueRows.length ? rescues.costUsd : 0) : 0
  const combinedCostUsd = base.costUsd === null || rescueIncrementalCostUsd === null ? null : money(base.costUsd, rescueIncrementalCostUsd)
  return { ...base, pendingCount, oneShotCostUsd: base.costUsd, strictSuccessCount, costPerStrictSuccessUsd: strictSuccessCount && base.costUsd !== null ? base.costUsd / strictSuccessCount : null, rescueAttemptCount: rescueRows.length, rescueUsage: rescues.usage, rescueIncrementalCostUsd, combinedCostUsd, combinedStrictSuccessCount, costPerCombinedStrictSuccessUsd: combinedStrictSuccessCount && combinedCostUsd !== null ? combinedCostUsd / combinedStrictSuccessCount : null }
}
/** Output/input tariff threshold: extra input divided by saved output. Null without both positive changes. */
export function breakEvenRatio(baselineOutput: number | null, cavemanOutput: number | null, baselineInput: number | null, cavemanInput: number | null): number | null {
  for (const n of [baselineOutput, cavemanOutput, baselineInput, cavemanInput]) token(n)
  if (baselineOutput === null || cavemanOutput === null || baselineInput === null || cavemanInput === null || baselineInput === cavemanInput) return null
  const addedInput = cavemanInput - baselineInput, reducedOutput = baselineOutput - cavemanOutput
  return addedInput > 0 && reducedOutput > 0 ? addedInput / reducedOutput : null
}
/** Compare recorded treatment arms; percentages are unknown when baseline spend is zero. */
export function compareArms(rows: ReadonlyArray<CostRow>, rates: Rates, includeRescues = false) {
  const baseline = estimateCohort(rows.filter(row => row.treatment === 'baseline'), rates, includeRescues), caveman = estimateCohort(rows.filter(row => row.treatment === 'caveman'), rates, includeRescues)
  const b = baseline.combinedCostUsd, c = caveman.combinedCostUsd
  const deltaUsd = b === null || c === null ? null : c - b
  return { baseline, caveman, deltaUsd, percentDelta: deltaUsd === null || b === null || b === 0 ? null : finiteSigned(deltaUsd / b * 100), spendRatio: b === null || c === null || b === 0 ? null : finite(c / b), breakEvenRatio: breakEvenRatio(baseline.usage.outputTokens, caveman.usage.outputTokens, baseline.usage.inputTokens, caveman.usage.inputTokens) }
}
function finiteSigned(n: number): number { if (!Number.isFinite(n)) throw new RangeError('Numeric overflow'); return n }
