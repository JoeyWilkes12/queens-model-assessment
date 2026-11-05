import { lazy, type ComponentType } from 'react'

// Chapters other than the summary, atlas and the chapters written in this file load when their route opens,
// so the first visit downloads only what it shows. Each loader is shared by its lazy component and by
// preloadRoute, which the sidebar calls on hover, focus or touch so a click usually finds the code ready.
// Browsers keep a failed module import for the life of the page, so a chapter that fails to load offers a reload.
export function loader<M>(load: () => Promise<M>) {
  let pending: Promise<M> | undefined
  return () => pending ??= load()
}

export const chapters = {
  z3: loader(() => import('./z3/Z3Part')),
  localQwen: loader(() => import('./LocalQwen')),
  boardReceipts: loader(() => import('./BoardReceipts')),
  decisionModels: loader(() => import('./DecisionModels')),
  frontier: loader(() => import('./FrontierTrajectories')),
  greedy: loader(() => import('./GreedyRule')),
  critique: loader(() => import('./MethodsCritique')),
  pilot: loader(() => import('./OllamaAssessment')),
  caveman: loader(() => import('./OllamaComparison')),
  subq: loader(() => import('./SubQAssessment')),
  legacyPanel: loader(() => import('./LegacyPanel')),
  receiptChain: loader(() => import('./ReceiptChainNavigation')),
}

export const named = <M, K extends keyof M>(load: () => Promise<M>, key: K) => lazy(() => load().then(module => ({ default: module[key] as ComponentType<any> })))

export const Z3Part = lazy(chapters.z3)

export const LocalQwen = lazy(chapters.localQwen)

export const BoardReceipts = named(chapters.boardReceipts, 'BoardReceipts')

export const DecisionModels = named(chapters.decisionModels, 'DecisionModels')

export const FrontierTrajectories = named(chapters.frontier, 'FrontierTrajectories')

export const GreedyRule = named(chapters.greedy, 'GreedyRule')

export const MethodsCritique = named(chapters.critique, 'MethodsCritique')

export const OllamaAssessment = named(chapters.pilot, 'OllamaAssessment')

export const OllamaComparison = named(chapters.caveman, 'OllamaComparison')

export const SubQAssessment = named(chapters.subq, 'SubQAssessment')

export const LegacyPanel = named(chapters.legacyPanel, 'LegacyPanel')

export const ReceiptChainNavigation = named(chapters.receiptChain, 'ReceiptChainNavigation')

export const ROUTE_CHAPTERS: Record<string, () => Promise<unknown>> = {
  'how-z3-solves-queens': chapters.z3, 'local-qwen': chapters.localQwen, 'board-receipts': chapters.boardReceipts,
  'decision-models': chapters.decisionModels, 'openai-decisions-plan': chapters.decisionModels, 'frontier-trajectories': chapters.frontier,
  'greedy-rule': chapters.greedy, 'methods-critique': chapters.critique, 'local-open-models': chapters.pilot,
  'caveman-summary': chapters.caveman, 'subq-assessment': chapters.subq, 'earlier-generations': chapters.legacyPanel,
}

/** Start loading a route's chapter code ahead of a click. Failures are ignored here; the route reports them. */
export function preloadRoute(path: string) {
  const first = path.split('/')[0]
  ROUTE_CHAPTERS[first]?.().catch(() => undefined)
  if (first === 'local-open-models' && path !== first) chapters.caveman().catch(() => undefined)
}
