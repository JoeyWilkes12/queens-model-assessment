import snapshot from './trajectoryReceiptChains.json'

export type ChainCall = { id: string; step: number; phase: 'region' | 'cell' }
export type ReceiptChain = {
  studyId: string
  trajectoryId: string
  modelLabel: string
  playbackPath: string
  stopReason: string
  current: ChainCall
  previous: ChainCall | null
  next: ChainCall | null
  index: number
  total: number
  forcedBeforeNext: number
}

const chains = new Map<string, ReceiptChain>()
for (const attempt of snapshot.chains) {
  const call = (value: typeof attempt.calls[number]): ChainCall => ({ id: value.id, step: value.step, phase: value.phase as ChainCall['phase'] })
  for (const [index, value] of attempt.calls.entries()) {
    chains.set(value.id, {
      studyId: attempt.studyId, trajectoryId: attempt.trajectoryId, modelLabel: attempt.modelLabel,
      playbackPath: attempt.playbackPath, stopReason: attempt.stopReason,
      current: call(value), previous: index ? call(attempt.calls[index - 1]) : null,
      next: index + 1 < attempt.calls.length ? call(attempt.calls[index + 1]) : null,
      index, total: attempt.calls.length, forcedBeforeNext: value.forcedBeforeNext,
    })
  }
}

/** Only calls explicitly recorded in one saved attempt have chain navigation. */
export function receiptChainForId(id: string): ReceiptChain | null {
  const chain = chains.get(id)
  if (!chain) return null
  // Callers cannot mutate the shared lookup while inspecting a receipt.
  return { ...chain, current: { ...chain.current }, previous: chain.previous ? { ...chain.previous } : null,
    next: chain.next ? { ...chain.next } : null }
}
