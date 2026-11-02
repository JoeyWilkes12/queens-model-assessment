import type { JsonResource } from './sharedJson'

/** Saved evidence files read by more than one component; each has exactly one guard shared by all its readers. */
const isRecord = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value)

/** scoreboard.json: the scoreboard reads `llm`, the cost ledger reads `costs`. Both must be present. */
export const SCOREBOARD_FILE: JsonResource<{ llm: Record<string, unknown>; costs: { evaluations: unknown[] } & Record<string, unknown> }> = {
  url: `${import.meta.env.BASE_URL}evidence/scoreboard.json`,
  validate: (value): value is { llm: Record<string, unknown>; costs: { evaluations: unknown[] } & Record<string, unknown> } =>
    isRecord(value) && isRecord(value.llm) && isRecord(value.costs) && Array.isArray(value.costs.evaluations),
}
