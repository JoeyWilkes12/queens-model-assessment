import type { ResultRow } from './ollamaEvidence'

export type Usage = { samples: number; input: number; output: number; strict: number; valid: number; capped: number }
export type Rates = { input: number; output: number }
type Cost = { input: number; output: number; total: number }
type Comparison = { baseline: Cost; caveman: Cost; inputDelta: number; outputDelta: number; delta: number; percent: number | null }

/** Require exact, nonnegative token counts rather than coerce absent usage into zero. */
function isTokenCount(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0
}

/** Aggregate completed receipts; generated tokens already include thinking and are counted once. */
export function aggregateUsage(rows: ResultRow[]): Usage | null {
  if (!rows.length || rows.some(row => row.state !== 'recorded' || !isTokenCount(row.input_tokens) || !isTokenCount(row.output_tokens))) return null
  const usage = rows.reduce<Usage>((sum, row) => ({
    samples: sum.samples + 1,
    input: sum.input + row.input_tokens!, output: sum.output + row.output_tokens!,
    strict: sum.strict + Number(row.strict_correct), valid: sum.valid + Number(row.rule_valid_after_extraction),
    capped: sum.capped + Number(row.finish_reason === 'length'),
  }), { samples: 0, input: 0, output: 0, strict: 0, valid: 0, capped: 0 })
  return Object.values(usage).every(isTokenCount) ? usage : null
}

/** Project uncached token charges at USD-per-million rates; this is not a measured hosted bill. */
export function costComparison(baseline: Usage, caveman: Usage, rates: Rates): Comparison | null {
  if (![rates.input, rates.output].every(rate => typeof rate === 'number' && Number.isFinite(rate) && rate >= 0)
    || ![baseline.input, baseline.output, caveman.input, caveman.output].every(isTokenCount)) return null
  const charge = (usage: Usage): Cost => {
    const input = usage.input * rates.input / 1_000_000, output = usage.output * rates.output / 1_000_000
    return { input, output, total: input + output }
  }
  const b = charge(baseline), c = charge(caveman)
  const inputDelta = c.input - b.input, outputDelta = c.output - b.output, delta = c.total - b.total
  const percent = b.total > 0 ? delta / b.total * 100 : null
  if (![...Object.values(b), ...Object.values(c), inputDelta, outputDelta, delta].every(Number.isFinite)
    || (percent !== null && !Number.isFinite(percent))) return null
  return { baseline: b, caveman: c, inputDelta, outputDelta, delta, percent }
}

/** Return the output/input tariff threshold only when extra input buys fewer generated tokens. */
export function breakEvenRatio(baseline: Usage, caveman: Usage): number | null {
  if (![baseline.input, baseline.output, caveman.input, caveman.output].every(isTokenCount)) return null
  const addedInput = caveman.input - baseline.input, reducedOutput = baseline.output - caveman.output
  if (addedInput <= 0 || reducedOutput <= 0) return null
  const ratio = addedInput / reducedOutput
  return Number.isFinite(ratio) ? ratio : null
}

/** Parse a nonnegative decimal tariff, keeping blanks and malformed values distinct from zero. */
export function parseRate(value: string): number | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  if (!/^(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(trimmed)) return null
  const rate = Number(trimmed)
  return Number.isFinite(rate) && rate >= 0 ? rate : null
}
