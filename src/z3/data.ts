import { useEffect, useState } from 'react'
import boardJson from './board-seven.json'
import type { Trace } from './kernel'

export type BoardSpec = {
  id: string
  label: string
  size: number
  coordinateBase: 1
  regions: string[][]
  partitionSha256: string
  partitionHashInput: string
}

export const board = boardJson as BoardSpec
export const N = board.size

export type EncodingName = 'pairwise' | 'sequential' | 'commander'
export type EncodingClause = { lits: number[]; role: string }
export type EncodingAux = { id: number; name: string; meaning: string; members?: number[] }
export type EncodingCounts = { clauses: number; aux: number; literalOccurrences: number; variables: number }

export type PropagationRun = {
  cell: [number, number]
  decision: number
  steps: { literal: number; reasonClauseId: number }[]
  status: 'fixed-point' | 'conflict'
  conflictClauseId: number | null
  unassignedAfter: number
}

export type HallSubset = { regions: string[]; rows: number[]; status: 'deficient' | 'tight' | 'slack'; excluded: [number, number][] }
export type HallMask = { removedCells: [number, number][]; regionRows: Record<string, number[]>; matchingCount: number; subsets: HallSubset[]; cellsUsedByAMatching: number }

export type GraphNode = { literal: number; level: number; seq: number; trailPosition: number; reasonClauseId: number | null; rank: number }
export type ImplicationGraphData = {
  conflictSeq: number
  level: number
  conflictClauseId: number
  decision: number
  nodes: GraphNode[]
  conflictRank: number
  edges: { from: number; to: number; clauseId: number }[]
  uips: number[]
  firstUip: number
  witnessPaths: Record<string, number[]>
  cutClauses: Record<string, number[]>
}

export type TeachingData = {
  schemaVersion: 1
  boardId: string
  partitionSha256: string
  cnfSha256: string
  captions: { reference: string; z3: string }
  funnel: { stages: { id: string; label: string; count: string; formula: string; constraint: string }[]; regionalPermutations: number }
  encodings: {
    row: Record<EncodingName, { aux: EncodingAux[]; clauses: EncodingClause[] }>
    sizes: ({ m: number } & Record<EncodingName, EncodingCounts>)[]
    groups: ({ name: string; size: number } & Record<EncodingName, EncodingCounts>)[]
    boardTotals: Record<EncodingName, { clauses: number; aux: number }>
    validation: { exhaustiveSizes: number[]; exhaustiveAssignmentChecks: number; z3ProjectionSizes: number[]; method: string }
    auxWitness: { amoOnlyAllFalse: { x: boolean[]; s: boolean[] }; exactlyOneX3: { x: boolean[]; s: boolean[] } }
  }
  generatedVsDistinct: {
    generated: number
    distinct: number
    duplicates: number
    byFamily: { family: string; generated: number; new: number; ALO: number; AMO: number; touching: number }[]
    duplicatePairs: { duplicate: string; firstGeneratedBy: string; count: number }[]
  }
  propagation: {
    caption: string
    order: string
    runs: PropagationRun[]
    inset5: { boardId: string; regions: string[][]; partitionSha256: string; clauses: Record<string, { lits: number[]; sources: string[] }>; steps: { literal: number; reasonClauseId: number }[]; status: string }
  }
  confinement: {
    hypothesis: number
    hypothesisCell: [number, number]
    regions: string[]
    regionCells: Record<string, [number, number][]>
    masks: Record<'none' | 'notq31', HallMask>
    highlight: { mask: string; regions: string[]; rows: number[]; excluded: [number, number][] }
    unitPropagationFromHypothesis: { status: string; newLiterals: number }
    z3Checks: { cell: [number, number]; formula: string; result: string }[]
    firstLearnedLinks: { learnedLiteral: number; hallSubset: string[]; note: string }
    matchingCounterexample: { cells: [number, number][]; regions: string[]; repeatedColumns: number[] }
  }
  implicationGraphs: ImplicationGraphData[]
}

export type RouteStage = { name: string; phase: string; count: number }
export type Z3Check = {
  query: 'first' | 'incremental-blocked' | 'fresh-blocked'
  label: string
  result: string
  elapsedSeconds: number
  statistics: Record<string, number>
  reasonUnknown: string | null
  engine: { id: string; label: string; basis: string[] }
  route: { source: string; stages: RouteStage[]; lines: string[] }
  verboseRunCountersMatch: boolean
  comparedCounters: string[]
  countersCumulativeWithFirst: boolean
}
export type Z3Run = {
  mode: 'default' | 'fd' | 'pb'
  configuration: string
  syntax: string
  production: boolean
  parameters: Record<string, string | number>
  assertions: number
  formulaSha256: string
  blockedFormulaSha256: string
  freshBlockedFormulaSha256: string
  blocker: { form: string; literalCount: number; sha256: string }
  modelColumns: number[]
  checks: Z3Check[]
}
export type Z3Receipts = {
  schemaVersion: 1
  kind: 'z3-receipts'
  caption: string
  z3Version: string
  pythonVersion: string
  platform: string
  generatedAt: string
  measureScriptSha256: string
  notes: string[]
  boards: { id: 'five' | 'seven' | 'nine'; size: number; regions: string[][]; partitionSha256: string; runs: Z3Run[] }[]
}

export type Z3Data = { teaching: TeachingData; existence: Trace; blocked: Trace; receipts: Z3Receipts }
export type LoadState =
  | { status: 'loading' }
  | { status: 'error'; errors: string[] }
  | { status: 'ready'; data: Z3Data; partitionCheck: 'match' | 'mismatch' | 'unavailable' | 'pending' }

export const evidencePath = (file: string) => `${import.meta.env.BASE_URL}evidence/z3/${file}`

export const FILES = {
  teaching: 'teaching-data.json',
  existence: 'reference-trace-existence.json',
  blocked: 'reference-trace-blocked.json',
  receipts: 'z3-receipts.json',
} as const

/** Python json.dumps default separators, as documented in board-seven.json. */
export const partitionText = (regions: string[][]) => '[' + regions.map(row => '[' + row.map(cell => JSON.stringify(cell)).join(', ') + ']').join(', ') + ']'

async function sha256Hex(text: string) {
  if (typeof crypto === 'undefined' || !crypto.subtle) return null
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  return [...new Uint8Array(digest)].map(b => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Fetches the four committed evidence files. Any missing file or binding
 * mismatch produces an error state; nothing is synthesized as a fallback.
 */
export function useZ3Data(): LoadState {
  const [state, setState] = useState<LoadState>({ status: 'loading' })
  useEffect(() => {
    let cancelled = false
    const load = async (file: string) => {
      const response = await fetch(evidencePath(file))
      if (!response.ok) throw new Error(`${file}: HTTP ${response.status}`)
      return response.json()
    }
    Promise.allSettled(Object.values(FILES).map(load)).then(async results => {
      if (cancelled) return
      const errors = results.flatMap((result, index) => result.status === 'rejected' ? [`${Object.values(FILES)[index]} could not be loaded (${String(result.reason?.message || result.reason)}).`] : [])
      if (errors.length) { setState({ status: 'error', errors }); return }
      const [teaching, existence, blocked, receipts] = results.map(result => (result as PromiseFulfilledResult<unknown>).value) as [TeachingData, Trace, Trace, Z3Receipts]
      const binding: string[] = []
      for (const [name, item] of [['teaching data', teaching], ['existence trace', existence], ['blocked trace', blocked]] as const) {
        if (item.schemaVersion !== 1) binding.push(`${name}: unsupported schema version.`)
        if (item.partitionSha256 !== board.partitionSha256) binding.push(`${name}: partition hash does not match the book's 7×7 board.`)
      }
      if (existence.cnfSha256 !== blocked.cnfSha256 || teaching.cnfSha256 !== existence.cnfSha256) binding.push('The traces and teaching data do not bind the same CNF.')
      if (existence.engine?.name !== 'reference-cdcl' || !existence.notZ3Trace) binding.push('The existence trace is not labelled as a reference-kernel run.')
      if (receipts.kind !== 'z3-receipts' || !receipts.boards?.some(b => b.id === 'seven' && b.partitionSha256 === board.partitionSha256)) binding.push('Z3 receipts do not include the 7×7 board with the same partition.')
      if (binding.length) { setState({ status: 'error', errors: binding }); return }
      setState({ status: 'ready', data: { teaching, existence, blocked, receipts }, partitionCheck: 'pending' })
      const hash = await sha256Hex(partitionText(board.regions)).catch(() => null)
      if (cancelled) return
      setState(previous => previous.status === 'ready' ? { ...previous, partitionCheck: hash === null ? 'unavailable' : hash === board.partitionSha256 ? 'match' : 'mismatch' } : previous)
    })
    return () => { cancelled = true }
  }, [])
  return state
}

export const varOf = (row: number, column: number, n = N) => (row - 1) * n + column
export const cellOf = (v: number, n = N): [number, number] => [Math.floor((Math.abs(v) - 1) / n) + 1, ((Math.abs(v) - 1) % n) + 1]
export const regionOf = (v: number) => { const [r, c] = cellOf(v); return board.regions[r - 1][c - 1] }
export const cellName = (v: number, n = N) => { const [r, c] = cellOf(v, n); return `r${r}c${c}` }

/** Words for screen readers and aria-live text, e.g. "r2c7 true". */
export const litWords = (lit: number, n = N) => `${cellName(lit, n)} ${lit > 0 ? 'true' : 'false'}`

export const groupLabel = (name: string) => {
  const [family, id] = name.split(':')
  return family === 'region' ? `region ${id}` : `${family} ${id}`
}

/** Human description of one clause source tag. */
export function describeSource(source: string) {
  if (source === 'blocker') return 'blocking clause'
  const fresh = source.match(/^learned@new-run:(.+)$/)
  if (fresh) return `learned in this new run at event ${fresh[1]}`
  const learned = source.match(/^learned@(existence|blocked):(\d+)$/)
  if (learned) return `learned at ${learned[1]}-run event ${learned[2]}`
  const touch = source.match(/^touching:(r\d+c\d+)-(r\d+c\d+)$/)
  if (touch) return `touching ${touch[1]}–${touch[2]}`
  const [family, id, kind] = source.split(':')
  const unit = family === 'region' ? `region ${id}` : `${family} ${id}`
  return `${unit} · ${kind === 'ALO' ? 'at least one' : 'at most one'}`
}

export const describeSources = (sources: string[]) => sources.map(describeSource).join('; ')

export const formatCount = (count: string | number) => String(count).replace(/\B(?=(\d{3})+(?!\d))/g, ',')

export const z3VersionShort = (version: string) => version.match(/(\d+\.\d+\.\d+)/)?.[1] ?? version
