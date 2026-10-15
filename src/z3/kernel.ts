/**
 * Pure logic for "How Z3 solves Queens": trace types, replay, a TypeScript
 * port of the reference CDCL kernel (scripts/z3/reference_cdcl.py) for
 * reader-forked runs, and an independent trace validator.
 *
 * None of this is Z3. The canonical traces are precomputed and validated at
 * build time; this module only replays them, or creates clearly new runs.
 * No React and no runtime imports, so scripts/verify-z3-teaching.mjs can load it.
 */

export type EventKind = 'decide' | 'propagate' | 'conflict' | 'learn' | 'backjump' | 'sat' | 'unsat'

export type ResolutionStep = { parentClauseId: number; pivot: number; result: number[] }

export type TraceEvent = {
  seq: number
  kind: EventKind
  level: number
  literal?: number
  reasonClauseId?: number
  conflictClauseId?: number
  learnedClauseId?: number
  resolution?: ResolutionStep[]
  targetLevel?: number
  removed?: number[]
}

export type TraceClause = { id: number; lits: number[]; sources: string[] }

export type Trace = {
  schemaVersion: 1
  caption: string
  notZ3Trace: true
  boardId: string
  partitionSha256: string
  engine: { name: 'reference-cdcl'; version: string; codeSha256: string }
  encoding: 'pairwise'
  cnfSha256: string
  originalClauseCount: number
  policy: Record<string, string | boolean>
  variables: { id: number; cell?: [number, number]; definition?: string }[]
  query: 'existence' | 'blocked'
  clauses: TraceClause[]
  initialClauseIds: number[]
  events: TraceEvent[]
  result: 'sat' | 'unsat' | 'unknown'
  model?: number[]
  modelColumns?: number[]
  blockerId?: number
  blockerForm?: string
  inheritedLemmaIds?: number[]
}

export type Assignment = { lit: number; level: number; reason: number | null; seq: number }
export type TraceState = { seq: number; level: number; trail: Assignment[] }

const byLiteral = (a: number, b: number) => Math.abs(a) - Math.abs(b) || (a < 0 ? 1 : 0) - (b < 0 ? 1 : 0)

/** Same literal order as the Python kernel: by variable, positive before negative. */
export function sortClause(lits: Iterable<number>): number[] {
  return [...new Set(lits)].sort(byLiteral)
}

/** State after each event; index equals seq. Pure replay of recorded data. */
export function replay(events: TraceEvent[]): TraceState[] {
  const states: TraceState[] = []
  let trail: Assignment[] = []
  let level = 0
  for (const event of events) {
    if (event.kind === 'decide' || event.kind === 'propagate') {
      level = event.level
      trail = [...trail, { lit: event.literal as number, level: event.level, reason: event.kind === 'decide' ? null : event.reasonClauseId as number, seq: event.seq }]
    } else if (event.kind === 'backjump') {
      level = event.targetLevel as number
      trail = trail.filter(entry => entry.level <= level)
    } else {
      level = event.level
    }
    states.push({ seq: event.seq, level, trail })
  }
  return states
}

export type KernelRun = { events: TraceEvent[]; clauses: number[][]; learnedIds: number[]; model: number[] | null; truncated: boolean }

/**
 * Port of reference_cdcl.run_cdcl: full clause scans in id order, propagation
 * to a fixed point before each decision, preferred variables first, then the
 * lowest unassigned variable (always true), first-UIP learning, asserting
 * backjumps. No watches, activity, restarts or deletion.
 */
export function runCdcl(initial: number[][], numVars: number, preferences: number[] = [], maxEvents = 20000): KernelRun {
  const clauses = initial.map(clause => [...clause])
  const index = new Map(clauses.map((clause, id) => [clause.join(','), id]))
  const value = new Map<number, boolean>()
  const level = new Map<number, number>()
  const reason = new Map<number, number | null>()
  const trail: number[] = []
  const events: TraceEvent[] = []
  const learnedIds: number[] = []
  const prefs = preferences.filter(v => Number.isInteger(v) && v >= 1 && v <= numVars)
  let dl = 0
  const emit = (event: Omit<TraceEvent, 'seq' | 'level'>) => { events.push({ seq: events.length, level: dl, ...event } as TraceEvent) }
  const valueOf = (lit: number): boolean | null => {
    const v = value.get(Math.abs(lit))
    return v === undefined ? null : v === lit > 0
  }
  const enqueue = (lit: number, why: number | null) => {
    const v = Math.abs(lit)
    value.set(v, lit > 0); level.set(v, dl); reason.set(v, why); trail.push(lit)
    if (why === null) emit({ kind: 'decide', literal: lit })
    else emit({ kind: 'propagate', literal: lit, reasonClauseId: why })
  }
  const propagate = (): number | null => {
    for (;;) {
      let changed = false
      for (let cid = 0; cid < clauses.length; cid++) {
        const clause = clauses[cid]
        if (clause.some(l => valueOf(l) === true)) continue
        const open = clause.filter(l => valueOf(l) === null)
        if (open.length === 0) return cid
        if (open.length === 1) { enqueue(open[0], cid); changed = true }
      }
      if (!changed) return null
    }
  }
  for (;;) {
    if (events.length > maxEvents) return { events, clauses, learnedIds, model: null, truncated: true }
    const conflict = propagate()
    if (conflict !== null) {
      emit({ kind: 'conflict', conflictClauseId: conflict })
      let acc = new Set(clauses[conflict])
      const steps: ResolutionStep[] = []
      const currentCount = () => [...acc].filter(l => level.get(Math.abs(l)) === dl).length
      while (currentCount() > (dl ? 1 : 0)) {
        let lit = 0
        for (let i = trail.length - 1; i >= 0; i--) {
          if (acc.has(-trail[i]) && level.get(Math.abs(trail[i])) === dl) { lit = trail[i]; break }
        }
        const rid = reason.get(Math.abs(lit))
        if (rid === null || rid === undefined) throw new Error('resolution reached a decision')
        const next = new Set([...acc].filter(l => l !== -lit))
        clauses[rid].forEach(l => { if (l !== lit) next.add(l) })
        acc = next
        steps.push({ parentClauseId: rid, pivot: Math.abs(lit), result: sortClause(acc) })
      }
      const learned = sortClause(acc)
      if (index.has(learned.join(','))) throw new Error('learned clause already present')
      const cid = clauses.length
      clauses.push(learned); index.set(learned.join(','), cid); learnedIds.push(cid)
      emit({ kind: 'learn', conflictClauseId: conflict, learnedClauseId: cid, resolution: steps })
      if (dl === 0) { emit({ kind: 'unsat' }); return { events, clauses, learnedIds, model: null, truncated: false } }
      const current = learned.find(l => level.get(Math.abs(l)) === dl) as number
      const others = learned.filter(l => l !== current).map(l => level.get(Math.abs(l)) as number)
      const back = others.length ? Math.max(...others) : 0
      const removed = trail.filter(l => (level.get(Math.abs(l)) as number) > back)
      removed.forEach(l => { const v = Math.abs(l); value.delete(v); level.delete(v); reason.delete(v) })
      const kept = trail.filter(l => value.has(Math.abs(l)))
      trail.length = 0; trail.push(...kept)
      dl = back
      emit({ kind: 'backjump', targetLevel: back, removed })
    } else {
      if (value.size === numVars) {
        emit({ kind: 'sat' })
        const model = Array.from({ length: numVars }, (_, i) => (value.get(i + 1) ? i + 1 : -(i + 1)))
        return { events, clauses, learnedIds, model, truncated: false }
      }
      dl += 1
      let choice = prefs.find(p => !value.has(p))
      if (choice === undefined) { choice = 1; while (value.has(choice)) choice++ }
      enqueue(choice, null)
    }
  }
}

/**
 * Independent replay check of a trace (recorded or new). Returns a list of
 * failures; an empty list means every check passed. Mirrors validate_trace in
 * scripts/z3/build_teaching_data.py.
 */
export function validateEvents(clauseList: number[][], initialIds: number[], events: TraceEvent[], numVars: number): string[] {
  const failures: string[] = []
  const fail = (message: string) => { failures.push(message) }
  const available = new Set(initialIds)
  const assign = new Map<number, { value: boolean; level: number; reason: number | null }>()
  let trail: number[] = []
  let level = 0
  const snapshots = new Map<number, number[]>()
  let conflictId: number | null = null
  let last: { id: number; acc: Set<number>; uip: number | null } | null = null
  let expect: [number, number] | null = null
  const valueOf = (lit: number) => { const a = assign.get(Math.abs(lit)); return a === undefined ? null : a.value === lit > 0 }
  const fixedPoint = () => [...available].every(cid => {
    const lits = clauseList[cid]
    return lits.some(l => valueOf(l) === true) || lits.filter(l => valueOf(l) === null).length >= 2
  })
  for (let i = 0; i < events.length && failures.length < 20; i++) {
    const e = events[i]
    if (e.seq !== i) fail(`event ${i}: seq ${e.seq}`)
    if (expect) {
      if (!(e.kind === 'propagate' && e.literal === expect[0] && e.reasonClauseId === expect[1])) fail(`event ${i}: expected the learned clause to assert ${expect[0]}`)
      expect = null
    }
    if (e.kind === 'decide') {
      const lit = e.literal as number
      if (!fixedPoint()) fail(`event ${i}: decision before propagation saturated`)
      if (assign.has(Math.abs(lit))) fail(`event ${i}: decided variable already assigned`)
      snapshots.set(level + 1, [...trail])
      level += 1
      if (e.level !== level) fail(`event ${i}: level`)
      assign.set(Math.abs(lit), { value: lit > 0, level, reason: null }); trail.push(lit)
    } else if (e.kind === 'propagate') {
      const lit = e.literal as number, cid = e.reasonClauseId as number
      const lits = clauseList[cid]
      if (!available.has(cid) || !lits) { fail(`event ${i}: reason ${cid} unavailable`); continue }
      if (!lits.includes(lit) || assign.has(Math.abs(lit))) fail(`event ${i}: implied literal not open in its reason`)
      if (!lits.every(m => m === lit || valueOf(m) === false)) fail(`event ${i}: reason ${cid} is not unit at enqueue`)
      assign.set(Math.abs(lit), { value: lit > 0, level, reason: cid }); trail.push(lit)
    } else if (e.kind === 'conflict') {
      const cid = e.conflictClauseId as number
      if (!available.has(cid) || !clauseList[cid].every(l => valueOf(l) === false)) fail(`event ${i}: conflict clause ${cid} is not false`)
      conflictId = cid
    } else if (e.kind === 'learn') {
      if (conflictId === null || e.conflictClauseId !== conflictId) { fail(`event ${i}: learn without its conflict`); continue }
      let acc = new Set(clauseList[conflictId])
      for (const [k, step] of (e.resolution || []).entries()) {
        let latest = 0
        for (let t = trail.length - 1; t >= 0; t--) if (acc.has(-trail[t]) && assign.get(Math.abs(trail[t]))?.level === level) { latest = trail[t]; break }
        if (Math.abs(latest) !== step.pivot) fail(`event ${i} step ${k}: pivot is not the latest current-level literal`)
        if (assign.get(Math.abs(latest))?.reason !== step.parentClauseId) fail(`event ${i} step ${k}: parent is not the pivot's reason`)
        const next = new Set([...acc].filter(l => l !== -latest))
        clauseList[step.parentClauseId].forEach(l => { if (l !== latest) next.add(l) })
        acc = next
        if ([...acc].some(x => acc.has(-x))) fail(`event ${i} step ${k}: tautological resolvent`)
        const recorded = new Set(step.result)
        if (recorded.size !== acc.size || [...acc].some(l => !recorded.has(l))) fail(`event ${i} step ${k}: resolvent differs`)
      }
      const lid = e.learnedClauseId as number
      const learned = new Set(clauseList[lid] || [])
      if (available.has(lid) || learned.size !== acc.size || [...acc].some(l => !learned.has(l))) fail(`event ${i}: learned clause differs from the final resolvent`)
      const current = [...acc].filter(l => assign.get(Math.abs(l))?.level === level)
      if (current.length !== (level ? 1 : 0)) fail(`event ${i}: learned clause is not first-UIP asserting`)
      available.add(lid)
      last = { id: lid, acc, uip: current[0] ?? null }
    } else if (e.kind === 'backjump') {
      if (!last) { fail(`event ${i}: backjump without learning`); continue }
      const others = [...last.acc].filter(l => l !== last!.uip).map(l => assign.get(Math.abs(l))?.level ?? 0)
      const target = others.length ? Math.max(...others) : 0
      if (e.targetLevel !== target) fail(`event ${i}: backjump target ${e.targetLevel} ≠ ${target}`)
      const removed = trail.filter(l => (assign.get(Math.abs(l))?.level ?? 0) > target)
      if (JSON.stringify(removed) !== JSON.stringify(e.removed)) fail(`event ${i}: removed literals differ`)
      removed.forEach(l => assign.delete(Math.abs(l)))
      trail = trail.filter(l => assign.has(Math.abs(l)))
      if (JSON.stringify(trail) !== JSON.stringify(snapshots.get(target + 1))) fail(`event ${i}: trail not restored to level ${target}`)
      level = target
      expect = [last.uip as number, last.id]
    } else if (e.kind === 'sat') {
      if (assign.size !== numVars) fail('sat: assignment is not total')
      if (![...available].every(cid => clauseList[cid].some(l => valueOf(l) === true))) fail('sat: a clause is unsatisfied')
    } else if (e.kind === 'unsat') {
      const prev = events[i - 1]
      if (!(prev?.kind === 'learn' && clauseList[prev.learnedClauseId as number]?.length === 0 && level === 0)) fail('unsat: not preceded by the empty clause at level 0')
    }
  }
  const lastKind = events[events.length - 1]?.kind
  if (lastKind !== 'sat' && lastKind !== 'unsat') fail('trace does not end in a verdict')
  return failures
}
