import { useEffect, useState, type ComponentType, type ReactNode } from 'react'

export type BookUi = {
  PageHero: ComponentType<{ title: string; deck: string; trail: string }>
  LocalToc: ComponentType<{ items: { id: string; label: string }[] }>
  Section: ComponentType<{ id?: string; title: string; children: ReactNode }>
  Callout: ComponentType<{ tone?: 'note' | 'evidence' | 'caution' | 'stop'; title: string; children: ReactNode }>
  DataTable: ComponentType<{ caption: string; headers: string[]; rows: (string | ReactNode)[][] }>
}

export type Treatment = 'baseline' | 'caveman'
export type ResultRow = {
  call_id: string; board_id: string; size: number; treatment: Treatment
  state: 'recorded' | 'not_run' | 'started_unrecorded'; outcome: string
  strict_correct: boolean; rule_valid_after_extraction: boolean
  elapsed_seconds: number | null; input_tokens: number | null; output_tokens: number | null
  finish_reason: string | null; http_status: number | null; receipt: string | null; image: string
}
type Group = {
  treatment: Treatment; size: number; scheduled: number; recorded: number; http_completed: number
  strict_correct: number; rule_valid_after_extraction: number; format_only: number
  transport_errors: number; truncated: number; not_run: number; unrecorded?: number
}
export type Summary = {
  study: string; updated_utc: string
  protocol: {
    modality: string; one_shot: boolean; tools: boolean; retries: number; think: boolean
    num_predict: number; timeout_seconds: number; temperature: number; seed: number; num_ctx: number
    structured_output_enforcement: boolean; reasoning_control_note: string
  }
  runtime: {
    model: string; digest: string; server_version: string; transport: string
    os: string; machine_architecture: string
    details: { family: string; parameter_size: string; quantization_level: string; runner: string; format: string }
  }
  rows: ResultRow[]; by_treatment_size: Group[]
  gate: { baseline_success: boolean; caveman_status: string }
  costs: { provider_fee_usd: number; local_total_cost_usd: number | null; note: string }
  limitations: string[]
}
export type Skill = {
  repository: string; commit: string; skill_path: string; artifact_sha256: string; system_sha256: string
  application: string; review: { mode: string; report: string }
}
type SavedState = { status: 'loading' } | { status: 'error' } | { status: 'ready'; summary: Summary; skill: Skill | null }

export const evidenceUrl = (path: string) => `${import.meta.env.BASE_URL}evidence/ollama/${path}`
export const treatmentName = (value: Treatment) => value === 'baseline' ? 'Qwen baseline' : 'Qwen + Caveman'
export const outcomeNames: Record<string, string> = {
  strict: 'Strict JSON + correct', format_only: 'Correct after extraction', incorrect: 'Incorrect placement',
  no_final_answer: 'No final answer', transport_error: 'Request failed', truncated: 'Budget-limited (token cap)', not_run: 'Not run', unrecorded: 'Started; result unrecorded',
}

/** Check the saved summary before presenting any score as evidence. */
function isSummary(value: unknown): value is Summary {
  if (!value || typeof value !== 'object') return false
  const data = value as Partial<Summary>
  return typeof data.study === 'string' && typeof data.updated_utc === 'string'
    && !!data.protocol && [data.protocol.num_predict, data.protocol.num_ctx, data.protocol.timeout_seconds, data.protocol.temperature, data.protocol.seed].every(item => typeof item === 'number' && Number.isFinite(item))
    && typeof data.protocol.think === 'boolean' && typeof data.protocol.reasoning_control_note === 'string'
    && !!data.runtime && typeof data.runtime.model === 'string' && typeof data.runtime.digest === 'string'
    && [data.runtime.server_version, data.runtime.transport, data.runtime.os, data.runtime.machine_architecture].every(item => typeof item === 'string')
    && !!data.runtime.details && [data.runtime.details.runner, data.runtime.details.family, data.runtime.details.parameter_size, data.runtime.details.quantization_level, data.runtime.details.format].every(item => typeof item === 'string')
    && !!data.gate && typeof data.gate.caveman_status === 'string'
    && !!data.costs && typeof data.costs.note === 'string' && typeof data.costs.provider_fee_usd === 'number'
    && (data.costs.local_total_cost_usd === null || typeof data.costs.local_total_cost_usd === 'number')
    && Array.isArray(data.limitations) && data.limitations.every(item => typeof item === 'string')
    && Array.isArray(data.rows) && data.rows.every(row => row && typeof row.call_id === 'string'
      && typeof row.board_id === 'string' && typeof row.size === 'number' && typeof row.image === 'string'
      && (row.treatment === 'baseline' || row.treatment === 'caveman')
      && (row.state === 'recorded' || row.state === 'not_run' || row.state === 'started_unrecorded') && typeof row.outcome === 'string'
      && typeof row.strict_correct === 'boolean' && typeof row.rule_valid_after_extraction === 'boolean'
      && (row.receipt === null || typeof row.receipt === 'string')
      && [row.elapsed_seconds, row.input_tokens, row.output_tokens].every(item => item === null || (typeof item === 'number' && Number.isFinite(item)))
      && (row.http_status === null || (typeof row.http_status === 'number' && Number.isInteger(row.http_status)))
      && (row.finish_reason === null || typeof row.finish_reason === 'string'))
    && Array.isArray(data.by_treatment_size) && data.by_treatment_size.every(group => group
      && (group.treatment === 'baseline' || group.treatment === 'caveman')
      && [group.size, group.scheduled, group.recorded, group.http_completed, group.strict_correct,
        group.rule_valid_after_extraction, group.format_only, group.transport_errors, group.truncated, group.not_run]
        .every(count => typeof count === 'number' && Number.isInteger(count) && count >= 0)
      && (group.unrecorded === undefined || (Number.isInteger(group.unrecorded) && group.unrecorded >= 0)))
}

/** Recognize optional pinned-skill provenance without blocking the baseline results. */
function isSkill(value: unknown): value is Skill {
  if (!value || typeof value !== 'object') return false
  const skill = value as Partial<Skill>
  return skill.repository === 'https://github.com/juliusbrussee/caveman'
    && typeof skill.commit === 'string' && /^[a-f0-9]{40}$/.test(skill.commit)
    && typeof skill.skill_path === 'string' && typeof skill.artifact_sha256 === 'string'
    && typeof skill.system_sha256 === 'string' && typeof skill.application === 'string'
    && !!skill.review && typeof skill.review.mode === 'string' && typeof skill.review.report === 'string'
}

/** Preserve missing timing and usage instead of turning absent measurements into zero. */
export function measurement(value: number | null, unit?: string): string {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 'Not reported'
  return `${unit === 's' ? value.toFixed(2) : value.toLocaleString()}${unit ? ` ${unit}` : ''}`
}

/** Show distinct observed prompt lengths without inferring missing usage. */
export function reportedInputLengths(rows: ResultRow[]): string {
  const lengths = [...new Set(rows.flatMap(row => typeof row.input_tokens === 'number' ? [row.input_tokens] : []))].sort((left, right) => left - right)
  return lengths.length ? lengths.map(value => value.toLocaleString()).join(', ') : 'not reported'
}

/** Load the saved study and optional pinned skill; never contact an inference service. */
export function useSavedOllamaStudy(): SavedState {
  const [saved, setSaved] = useState<SavedState>({ status: 'loading' })
  useEffect(() => {
    const controller = new AbortController()
    const summary = fetch(evidenceUrl('summary.json'), { signal: controller.signal })
      .then(response => { if (!response.ok) throw new Error('Saved summary unavailable'); return response.json() })
      .then(data => { if (!isSummary(data)) throw new Error('Saved summary invalid'); return data })
    summary.then(async data => {
      // The application record is created only when the conditional arm is enabled.
      let pinned: Skill | null = null
      if (data.gate.caveman_status === 'enabled_after_review' || data.rows.some(row => row.treatment === 'caveman')) {
        try {
          const response = await fetch(evidenceUrl('skill.json'), { signal: controller.signal })
          const value: unknown = response.ok ? await response.json() : null
          pinned = isSkill(value) ? value : null
        } catch { /* Baseline results remain readable when optional provenance is unavailable. */ }
      }
      if (!controller.signal.aborted) setSaved({ status: 'ready', summary: data, skill: pinned })
    })
      .catch(() => { if (!controller.signal.aborted) setSaved({ status: 'error' }) })
    return () => controller.abort()
  }, [])
  return saved
}
