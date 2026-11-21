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
 * version and transport. Differing time limits are checked against observed calls before ranking.
 */
export function conditionKey(study: LocalStudy, rows: Rows): string {
  const protocol = (study.protocol ?? {}) as Protocol
  return canonical({
    boardSet: study.board_set ?? 'legacy',
    calls: rows.map(row => `${row.treatment}/${row.board_id}`).sort(),
    arms: Object.fromEntries(Object.entries(study.arms ?? {}).map(([arm, prompt]) => [arm, prompt.system_sha256])),
    transport: protocol.transport ?? 'nonstream',
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
    const key = entry.study.protocol && entry.study.arms && entry.study.runtime?.server_version
      ? conditionKey(entry.study, entry.rows) : entry.study.id
    groups.set(key, [...(groups.get(key) ?? []), entry])
  }
  const cohorts: T[][] = []
  for (const group of groups.values()) {
    const byLimit = new Map<number | undefined, T[]>()
    for (const entry of group) {
      const timeout = (entry.study.protocol as Protocol | undefined)?.timeout_seconds
      const limit = typeof timeout === 'number' && timeout > 0 ? timeout : undefined
      byLimit.set(limit, [...(byLimit.get(limit) ?? []), entry])
    }
    const shortest = Math.min(...[...byLimit.keys()].map(limit => limit ?? 0))
    const finishedInTime = group.every(entry => entry.rows.every(row =>
      !row.transport_error && row.elapsed_seconds !== null && row.elapsed_seconds < shortest))
    for (const matched of finishedInTime ? [group] : byLimit.values()) {
      const models = new Set<string>()
      const repeated = new Set<string>()
      for (const { study } of matched) {
        if (models.has(study.model)) repeated.add(study.model)
        models.add(study.model)
      }
      const single = matched.filter(entry => !repeated.has(entry.study.model))
      if (single.length) cohorts.push(single)
      for (const entry of matched) {
        if (repeated.has(entry.study.model)) cohorts.push([entry])
      }
    }
  }
  return cohorts
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
