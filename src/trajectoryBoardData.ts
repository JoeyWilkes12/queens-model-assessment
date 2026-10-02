import type { BoardFrame } from './BoardReplay'

type Cell = readonly [number, number]

export type RecordedTrajectoryStep = {
  step: number
  region: string
  cell?: readonly number[]
  region_call?: string | null
  cell_call?: string | null
  region_forced?: boolean
  cell_forced?: boolean
  candidate_count: number
  local_violations?: readonly string[]
  on_unique_solution?: boolean
}

export type RecordedTrajectory = {
  trajectory_id: string
  board_id: string
  size: number
  mode: string
  success: boolean
  stop_reason: string
  steps: readonly RecordedTrajectoryStep[]
}

const studyId = '2026-09-30-jev-trajectories'

// Public trajectory-study.json linkage snapshot. Codes mean step + phase (r/c).
// An allowlist prevents fabricated/forced call names from acquiring a playback
// link. verify-trajectory-views.mjs checks every entry against the full corpus.
const recordedCallCodes = [
  'sequence-5-1_local_a1:1r,2r,3r,4r',
  'sequence-5-1_local_a2:1r,2r,3r,4r',
  'sequence-5-1_local_a3:1r,2r,3r,4r',
  'sequence-5-1_local_a4:1r,2r,3r,4r',
  'sequence-5-1_local_a5:1r,2r,3r,4r',
  'sequence-5-1_raw_a1:1r,2r,3r,3c,4r,4c,5c',
  'sequence-5-1_raw_a2:1r,2r,3r,3c,4r,4c,5c',
  'sequence-5-1_raw_a3:1r,2r,3r,3c,4r,4c,5c',
  'sequence-5-1_raw_a4:1r,2r,3r,3c,4r,4c,5c',
  'sequence-5-1_raw_a5:1r,2r,3r,3c,4r,4c,5c',
  'sequence-5-2_local_a1:1r,2r,2c',
  'sequence-5-2_local_a2:1r,2r,2c',
  'sequence-5-2_local_a3:1r,2r,2c',
  'sequence-5-2_local_a4:1r,2r,2c',
  'sequence-5-2_local_a5:1r,2r,2c',
  'sequence-5-2_raw_a1:1r,2r,2c',
  'sequence-5-2_raw_a2:1r,2r,2c',
  'sequence-5-2_raw_a3:1r,2r,2c',
  'sequence-5-2_raw_a4:1r,2r,2c',
  'sequence-5-2_raw_a5:1r,2r,2c',
  'sequence-5-3_local_a1:1r,2r,3r,3c',
  'sequence-5-3_local_a2:1r,2r,2c',
  'sequence-5-3_local_a3:1r,2r,3r,3c',
  'sequence-5-3_local_a4:1r,2r,2c',
  'sequence-5-3_local_a5:1r,2r,3r,3c',
  'sequence-5-3_raw_a1:1r,2r,2c',
  'sequence-5-3_raw_a2:1r,2r,2c,3r,3c',
  'sequence-5-3_raw_a3:1r,2r,2c',
  'sequence-5-3_raw_a4:1r,2r,2c,3r,3c',
  'sequence-5-3_raw_a5:1r,2r,2c',
  'sequence-7-1_local_a1:1r,2r,3r,3c,4r,5r,6r,6c',
  'sequence-7-1_local_a2:1r,2r,3r,3c,4r,5r,6r,6c',
  'sequence-7-1_local_a3:1r,2r,3r,3c,4r,5r,6r,6c',
  'sequence-7-1_local_a4:1r,2r,3r,3c,4r,5r,6r,6c',
  'sequence-7-1_local_a5:1r,2r,3r,3c,4r,5r,6r,6c',
  'sequence-7-1_raw_a1:1r,2r,3r,3c,4r,4c,5r,5c',
  'sequence-7-1_raw_a2:1r,2r,3r,3c,4r,4c,5r,5c',
  'sequence-7-1_raw_a3:1r,2r,3r,3c,4r,4c,5r,5c',
  'sequence-7-1_raw_a4:1r,2r,3r,3c,4r,4c,5r,5c',
  'sequence-7-1_raw_a5:1r,2r,3r,3c,4r,4c,5r,5c',
  'sequence-7-2_local_a1:1r,2r,2c',
  'sequence-7-2_local_a2:1r,2r,2c',
  'sequence-7-2_local_a3:1r,2r,2c',
  'sequence-7-2_local_a4:1r,2r,2c',
  'sequence-7-2_local_a5:1r,2r,2c',
  'sequence-7-2_raw_a1:1r,2r,2c',
  'sequence-7-2_raw_a2:1r,2r,2c',
  'sequence-7-2_raw_a3:1r,2r,2c',
  'sequence-7-2_raw_a4:1r,2r,2c',
  'sequence-7-2_raw_a5:1r,2r,2c',
  'sequence-7-3_local_a1:1r,1c',
  'sequence-7-3_local_a2:1r,1c',
  'sequence-7-3_local_a3:1r,1c',
  'sequence-7-3_local_a4:1r,1c',
  'sequence-7-3_local_a5:1r,1c,2r,2c',
  'sequence-7-3_raw_a1:1r,1c',
  'sequence-7-3_raw_a2:1r,1c',
  'sequence-7-3_raw_a3:1r,1c',
  'sequence-7-3_raw_a4:1r,1c',
  'sequence-7-3_raw_a5:1r,1c',
  'sequence-9-1_local_a1:1r,2r,3r,3c',
  'sequence-9-1_local_a2:1r,2r,3r,3c',
  'sequence-9-1_local_a3:1r,2r,3r,3c',
  'sequence-9-1_local_a4:1r,2r,3r,3c',
  'sequence-9-1_local_a5:1r,2r,3r,3c',
  'sequence-9-1_raw_a1:1r,2r,3r,3c',
  'sequence-9-1_raw_a2:1r,2r,3r,3c',
  'sequence-9-1_raw_a3:1r,2r,3r,3c',
  'sequence-9-1_raw_a4:1r,2r,3r,3c',
  'sequence-9-1_raw_a5:1r,2r,3r,3c',
  'sequence-9-2_local_a1:1r,2r,2c',
  'sequence-9-2_local_a2:1r,2r,2c',
  'sequence-9-2_local_a3:1r,2r,2c',
  'sequence-9-2_local_a4:1r,2r,3r,4r,5r,6r,6c',
  'sequence-9-2_local_a5:1r,2r,3r,4r,5r,6r,6c',
  'sequence-9-2_raw_a1:1r,2r,2c,3r,4r,5r,5c',
  'sequence-9-2_raw_a2:1r,2r,3r,4r,4c',
  'sequence-9-2_raw_a3:1r,2r,2c',
  'sequence-9-2_raw_a4:1r,2r,3r,4r,4c',
  'sequence-9-2_raw_a5:1r,2r,2c',
  'sequence-9-3_local_a1:1r,2r,3r,3c,4r,4c',
  'sequence-9-3_local_a2:1r,2r,3r,3c,4r,4c',
  'sequence-9-3_local_a3:1r,2r,3r,3c',
  'sequence-9-3_local_a4:1r,2r,3r,3c,4r,4c',
  'sequence-9-3_local_a5:1r,2r,3r,3c,4r,4c',
  'sequence-9-3_raw_a1:1r,2r,3r,3c,4r,4c',
  'sequence-9-3_raw_a2:1r,2r,3r,3c',
  'sequence-9-3_raw_a3:1r,2r,3r,3c,4r,4c',
  'sequence-9-3_raw_a4:1r,2r,3r,3c,4r,4c',
  'sequence-9-3_raw_a5:1r,2r,3r,3c',
] as const

const receiptAttempts = new Map<string, string>()
for (const entry of recordedCallCodes) {
  const [attempt, codes] = entry.split(':')
  for (const code of codes.split(',')) {
    const phase = code.endsWith('r') ? 'region' : 'cell'
    const step = code.slice(0, -1).padStart(2, '0')
    receiptAttempts.set(`${studyId}:${attempt}_p${step}_${phase}`, attempt)
  }
}

/** Resolve only the 394 genuinely linked public receipts; no network or guesses. */
export function linkedTrajectoryForReceipt(receiptId: string): string | null {
  return receiptAttempts.get(receiptId) ?? null
}

function copyCells(cells: readonly Cell[]): Cell[] {
  return cells.map(([row, column]) => [row, column] as const)
}

function links(step: RecordedTrajectoryStep): { label: string; id: string }[] {
  return [
    ...(step.region_call ? [{ label: 'Region Choice receipt', id: `${studyId}:${step.region_call}` }] : []),
    ...(step.cell_call ? [{ label: 'Cell Choice receipt', id: `${studyId}:${step.cell_call}` }] : []),
  ]
}

function source(call: string | null | undefined, forced: boolean | undefined): string {
  if (call) return 'Recorded model API Choice'
  if (forced) return 'Recorded harness-forced decision · no model request'
  return 'Decision source not recorded'
}

/**
 * Display adapter, not a solver. Only the public ordered steps determine states.
 * Candidate menus, hidden solution coordinates and speculative search are never
 * reconstructed. Saved evaluator annotations are explicitly distinguished from
 * model Choices; their outcome was not feedback supplied to Jev.
 */
export function deriveTrajectoryFrames(
  trace: RecordedTrajectory,
  regions: readonly (readonly (string | number)[])[],
): BoardFrame[] {
  const n = trace.size
  if (!Number.isInteger(n) || n < 1 || regions.length !== n || regions.some(row => row.length !== n)) {
    throw new Error('Trajectory board must be a square matrix matching the recorded size.')
  }
  const labels = regions.map(row => row.map(region => {
    if (typeof region === 'number') {
      if (!Number.isInteger(region) || region < 0 || region > 25) throw new Error('Invalid numeric region label.')
      return String.fromCharCode(65 + region)
    }
    if (!region.trim()) throw new Error('Invalid empty region label.')
    return region
  }))
  const frames: BoardFrame[] = [{
    id: `${trace.trajectory_id}:empty`,
    label: 'Recorded starting state · empty board',
    queens: [],
    note: `Attempt ${trace.trajectory_id} started with zero queens. Playback is an explanatory sequence, not model thinking or measured wall-clock timing.`,
    sourceLabel: 'Recorded harness starting state',
  }]
  let accepted: Cell[] = []

  for (const [index, step] of trace.steps.entries()) {
    const key = `${trace.trajectory_id}:step-${step.step}`
    const receipts = links(step)
    const regionSource = source(step.region_call, step.region_forced)
    frames.push({
      id: `${key}:region`,
      label: `Step ${step.step} · region ${step.region}`,
      queens: copyCells(accepted),
      highlightRegion: step.region,
      note: `The recorded decision selected region ${step.region}; no queen is placed by a region Choice. The recorded cell menu contained ${step.candidate_count} option${step.candidate_count === 1 ? '' : 's'}. Menu cells are not guessed from the trace.`,
      sourceLabel: regionSource,
      receiptLinks: step.region_call ? [{ label: 'Region Choice receipt', id: `${studyId}:${step.region_call}` }] : [],
    })

    if (!step.cell) {
      frames.push({
        id: `${key}:unavailable`,
        label: 'No recorded cell placement · attempt stopped',
        queens: copyCells(accepted),
        highlightRegion: step.region,
        note: `Recorded terminal outcome: ${trace.stop_reason.replace(/_/g, ' ')}. No cell is invented for this incomplete step.`,
        sourceLabel: 'Recorded harness terminal state',
        receiptLinks: receipts,
      })
      break
    }

    const [row, column] = step.cell
    if (step.cell.length !== 2 || !Number.isInteger(row) || !Number.isInteger(column) || row < 1 || row > n || column < 1 || column > n) {
      throw new Error(`Invalid recorded cell at ${key}.`)
    }
    if (labels[row - 1][column - 1] !== step.region) {
      throw new Error(`Recorded cell does not belong to selected region at ${key}.`)
    }
    const cell: Cell = [row, column]
    const cellSource = source(step.cell_call, step.cell_forced)
    frames.push({
      id: `${key}:proposal`,
      label: `Step ${step.step} · proposed r${row}c${column}`,
      queens: copyCells(accepted),
      highlightRegion: step.region,
      selectedCell: cell,
      selectedCellLabel: step.cell_forced ? 'Harness-forced cell' : 'Returned cell Choice',
      note: `${cellSource}. This proposed cell is shown separately from prior accepted placements; it has not yet passed the recorded evaluator transition.`,
      sourceLabel: cellSource,
      receiptLinks: step.cell_call ? [{ label: 'Cell Choice receipt', id: `${studyId}:${step.cell_call}` }] : receipts,
    })

    // Missing validation is unknown, never silently green or accepted.
    if (!Array.isArray(step.local_violations)) {
      frames.push({
        id: `${key}:outcome`,
        label: 'Evaluator outcome unavailable · playback stopped',
        queens: copyCells(accepted),
        selectedCell: cell,
        selectedCellLabel: 'Proposal with unknown evaluation',
        note: 'This step has no recorded local validation. The display does not infer acceptance or invent a continuation.',
        sourceLabel: 'Missing recorded evaluator evidence',
        receiptLinks: receipts,
      })
      break
    }

    const localFailure = step.local_violations.length > 0
    const globalFailure = !localFailure && step.on_unique_solution === false
    if (!localFailure) accepted = [...accepted, cell]
    const last = index === trace.steps.length - 1
    const solved = last && trace.success && trace.stop_reason === 'solved'
    const outcome = localFailure ? 'Local rule violation · attempt stopped'
      : globalFailure ? 'Globally unextendable prefix · attempt stopped'
      : solved ? 'Completed solution · recorded evaluator pass'
      : step.on_unique_solution === true ? 'Placement accepted · recorded evaluator pass'
      : 'Locally accepted · global evaluator outcome unavailable'
    const note = localFailure
      ? `The saved evaluator rejected this proposal for ${step.local_violations.join(', ')}. It is not added to accepted queens.`
      : globalFailure
        ? 'The cell obeyed immediate rules and was retained in the recorded local prefix, but the saved oracle marked the prefix globally unextendable and stopped the attempt. No hidden solution cell is displayed.'
        : solved
          ? 'The saved evaluator certified the complete recorded placement. This is a terminal state, not a new model answer.'
          : step.on_unique_solution === true
            ? 'The recorded harness retained the cell; the saved oracle marked this placement on the unique solution. This evaluator annotation was not supplied to Jev as feedback.'
            : 'The recorded local check has no violations; no global pass is asserted because its saved oracle annotation is missing.'
    frames.push({
      id: `${key}:outcome`,
      label: `Step ${step.step} · ${outcome}`,
      queens: copyCells(accepted),
      highlightRegion: step.region,
      selectedCell: cell,
      selectedCellLabel: localFailure ? 'Rejected proposal' : globalFailure ? 'Locally retained; global dead end' : 'Recorded retained placement',
      invalidCells: localFailure || globalFailure ? [cell] : [],
      note,
      sourceLabel: 'Recorded harness transition + evaluator-only annotation',
      receiptLinks: receipts,
    })
    if (localFailure || globalFailure || solved) break
  }
  return frames
}

/** Exact recorded membership only; similar board IDs or timestamps never link attempts. */
export function findReceiptTrajectories<T extends RecordedTrajectory>(
  receiptId: string,
  traces: readonly T[],
): T[] {
  const prefix = `${studyId}:`
  if (!receiptId.startsWith(prefix)) return []
  const call = receiptId.slice(prefix.length)
  return traces.filter(trace => trace.steps.some(step => step.region_call === call || step.cell_call === call))
}
