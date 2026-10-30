import { useEffect, useState } from 'react'
import type { CostRow } from './localQwenMath'

export type LocalRow = CostRow & {
  call_id: string; board_id: string; size: number; receipt: string | null; image: string
  peer_call_id: string | null; pair_verified: boolean; finish_reason: string | null
  rescue: (NonNullable<CostRow['rescue']> & { receipt: string; outcome: string }) | null
  host: Record<string, number | null> | null; loop_stop: Record<string, unknown> | null
}
export type LocalStudy = {
  id: string; label: string; model: string; budget: number; decoding: 'greedy' | 'sampling' | 'greedy+ls'
  round: number; status: 'complete' | 'partial'; planned: number; recorded: number
  root: string; plan: string; summary: string; rows: LocalRow[]
  runtime: { digest: string; server_version: string; details: { runner: string; quantization_level: string } }
}
export type LocalIndex = { schema_version: number; snapshot_id: string; captured_utc: string; source_commit: string; source_dirty: boolean; manifest: string; studies: LocalStudy[] }
export type Pricing = { schema_version: number; checked_utc: string; catalog_url: string; catalog_sha256: string; models: { id: string; usd_per_million: { input: number; output: number } }[] }
type State = { status: 'loading' | 'error' } | { status: 'ready'; data: LocalIndex }

/** Resolve only saved public artifacts; paths never point at the inference service. */
export function localArtifact(path: string): string {
  if (!/^[a-zA-Z0-9_./-]+$/.test(path) || path.startsWith('/') || path.split('/').includes('..')) throw new Error('Invalid saved artifact path')
  return `${import.meta.env.BASE_URL}evidence/local-qwen/${path}`
}

/** Validate the display contract independently of the stricter offline receipt audit. */
export function isLocalIndex(value: unknown): value is LocalIndex {
  if (!value || typeof value !== 'object') return false
  const data = value as LocalIndex
  const count = (v: unknown) => typeof v === 'number' && Number.isSafeInteger(v) && v >= 0
  const optional = (v: unknown) => v === null || count(v)
  const path = (v: unknown) => typeof v === 'string' && /^[a-zA-Z0-9_./-]+$/.test(v) && !v.startsWith('/') && !v.split('/').includes('..')
  return data.schema_version === 1 && typeof data.snapshot_id === 'string' && typeof data.captured_utc === 'string'
    && Number.isFinite(Date.parse(data.captured_utc)) && path(data.manifest) && typeof data.source_commit === 'string'
    && Array.isArray(data.studies) && data.studies.length > 0 && new Set(data.studies.map(s => s.id)).size === data.studies.length
    && data.studies.every(s => s && /^[a-zA-Z0-9_.-]+$/.test(s.id) && typeof s.label === 'string' && typeof s.model === 'string'
      && ['greedy', 'sampling', 'greedy+ls'].includes(s.decoding) && ['complete', 'partial'].includes(s.status)
      && count(s.budget) && s.budget > 0 && count(s.planned) && count(s.recorded) && s.recorded <= s.planned
      && path(s.root) && path(s.plan) && path(s.summary) && !!s.runtime && typeof s.runtime.digest === 'string'
      && Array.isArray(s.rows) && s.rows.length === s.planned && new Set(s.rows.map(r => r.call_id)).size === s.rows.length
      && s.rows.every(r => r && /^[a-zA-Z0-9_-]+$/.test(r.call_id) && typeof r.board_id === 'string' && count(r.size)
        && ['baseline', 'caveman'].includes(r.treatment) && typeof r.state === 'string' && optional(r.input_tokens) && optional(r.output_tokens)
        && (r.elapsed_seconds === null || (typeof r.elapsed_seconds === 'number' && Number.isFinite(r.elapsed_seconds) && r.elapsed_seconds >= 0))
        && ['strict_correct', 'format_only_correct', 'truncated', 'loop_stopped', 'pair_verified'].every(k => typeof r[k as keyof LocalRow] === 'boolean')
        && (r.receipt === null || path(r.receipt)) && path(r.image)
        && (r.rescue === null || (path(r.rescue.receipt) && optional(r.rescue.input_tokens) && optional(r.rescue.output_tokens) && typeof r.rescue.strict_correct === 'boolean'))))
}

/** Fetch one immutable snapshot index with explicit loading/error states and cancellation. */
export function useLocalStudies(): State {
  const [state, setState] = useState<State>({ status: 'loading' })
  useEffect(() => {
    const controller = new AbortController()
    fetch(localArtifact('index.json'), { signal: controller.signal }).then(r => { if (!r.ok) throw new Error('Unavailable snapshot'); return r.json() })
      .then(data => { if (!isLocalIndex(data)) throw new Error('Invalid snapshot'); if (!controller.signal.aborted) setState({ status: 'ready', data }) })
      .catch(() => { if (!controller.signal.aborted) setState({ status: 'error' }) })
    return () => controller.abort()
  }, [])
  return state
}

/** Keep study identity in every receipt URL because call IDs recur across cohorts. */
export const localReceiptUrl = (study: LocalStudy, row: LocalRow) => `#/local-qwen/receipt/${study.id}/${row.call_id}`
export const armName = (arm: string) => arm === 'baseline' ? 'Baseline' : '+ Caveman'
export const rowOutcome = (r: LocalRow) => r.state !== 'recorded' ? 'Pending / not recorded' : r.strict_correct ? 'Strict correct' : r.format_only_correct ? 'Correct, wrong format' : r.loop_stopped ? 'Client loop-stop' : r.truncated ? 'Token cap reached' : 'Completed incorrect / other'
