import type { LocalStudy } from './localQwenEvidence'

type Rows = LocalStudy['rows']
type Protocol = NonNullable<LocalStudy['protocol']> & Record<string, unknown>

/** JSON with object keys sorted, so equal settings always serialize the same way. */
const canonical = (value: unknown) => JSON.stringify(value ?? null, (_key, v: unknown) =>
  v && typeof v === 'object' && !Array.isArray(v) ? Object.fromEntries(Object.entries(v).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0)) : v ?? null)

/**
 * Every condition that must match before two studies' counts may share a ranking: the exact calls
 * (board identities × prompt arms, after any size filter), the arm prompts, input, token budget and
 * context, decoding (temperature, seed, sampling options, round), thinking, answer-format constraint,
 * the loop detector and whether it may stop calls, call order and model unloading, and the server
 * version. Per-model timeouts, response streaming and free-text notes are deliberately left out.
 */
export function conditionKey(study: LocalStudy, rows: Rows): string {
  const protocol = (study.protocol ?? {}) as Protocol
  return canonical({
    boardSet: study.board_set ?? 'legacy',
    calls: rows.map(row => `${row.treatment}/${row.board_id}`).sort(),
    arms: Object.fromEntries(Object.entries(study.arms ?? {}).map(([arm, prompt]) => [arm, prompt.system_sha256])),
    modality: protocol.modality ?? 'image',
    budget: study.budget, numPredict: protocol.num_predict, numCtx: protocol.num_ctx,
    decoding: study.decoding, round: study.round, temperature: protocol.temperature, seed: protocol.seed, sampling: protocol.extra_options,
    think: protocol.think,
    format: protocol.format, enforced: protocol.structured_output_enforcement,
    loopMode: study.loop_mode ?? (study.decoding === 'greedy+ls' ? 'active' : 'off'), loopStop: protocol.loop_stop,
    oneShot: protocol.one_shot, tools: protocol.tools, retries: protocol.retries, keepAlive: protocol.keep_alive, order: protocol.order,
    server: study.runtime?.server_version,
  })
}

/** Group studies whose conditions match exactly; a study with no match forms its own cohort. */
export function groupCohorts<T extends { study: LocalStudy; rows: Rows }>(entries: T[]): T[][] {
  const groups = new Map<string, T[]>()
  for (const entry of entries) {
    const key = conditionKey(entry.study, entry.rows)
    groups.set(key, [...(groups.get(key) ?? []), entry])
  }
  return [...groups.values()]
}

/** Competition places (1, 2, 2, 4) within one cohort. `compare` orders best first and returns 0 for a tie. */
export function rank<T>(entries: T[], compare: (a: T, b: T) => number): { entry: T; place: number; tied: boolean }[] {
  const sorted = [...entries].sort(compare)
  return sorted.map(entry => ({
    entry,
    place: 1 + sorted.filter(other => compare(other, entry) < 0).length,
    tied: sorted.some(other => other !== entry && compare(other, entry) === 0),
  }))
}
