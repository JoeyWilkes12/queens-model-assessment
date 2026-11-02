import type { JsonResource } from './sharedJson'
import { isPricing, type Pricing } from './localQwenPricing'

/** Saved evidence files read by more than one component; each has exactly one guard shared by all its readers. */
const isRecord = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value)

/** scoreboard.json: the scoreboard reads `llm`, the cost ledger reads `costs`. Both must be present. */
export const SCOREBOARD_FILE: JsonResource<{ llm: Record<string, unknown>; costs: { evaluations: unknown[] } & Record<string, unknown> }> = {
  url: `${import.meta.env.BASE_URL}evidence/scoreboard.json`,
  validate: (value): value is { llm: Record<string, unknown>; costs: { evaluations: unknown[] } & Record<string, unknown> } =>
    isRecord(value) && isRecord(value.llm) && isRecord(value.costs) && Array.isArray(value.costs.evaluations),
}

/** local-qwen-pricing.json: saved public tariffs, never a live API or inference request. Read by every local cost view. */
export const LOCAL_PRICING_FILE: JsonResource<Pricing> = { url: `${import.meta.env.BASE_URL}evidence/local-qwen-pricing.json`, validate: isPricing }
