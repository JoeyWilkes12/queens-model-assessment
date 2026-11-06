import { lazy, type ComponentType } from 'react'

// Every page except the executive summary (the default route) loads when its route opens, so the first visit
// downloads only what it shows. Each loader is shared by its lazy component and by preloadRoute, which the
// sidebar and the contents call on hover, focus or touch so a click usually finds the code ready.
// Browsers keep a failed module import for the life of the page, so a chapter that fails to load offers a reload.
// To add a chapter: give it its own module, add a loader and a lazy component here, and map its route below.
export function loader<M>(load: () => Promise<M>) {
  let pending: Promise<M> | undefined
  return () => (pending ??= load())
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
  cavemanStudies: loader(() => import('./CavemanStudies')),
  subq: loader(() => import('./SubQAssessment')),
  legacyPanel: loader(() => import('./LegacyPanel')),
  receiptChain: loader(() => import('./ReceiptChainNavigation')),
  receiptPage: loader(() => import('./AssessmentReceiptPage')),
  rules: loader(() => import('./QueensRules')),
  protocol: loader(() => import('./ProtocolResults')),
  jevPrimer: loader(() => import('./JevPrimer')),
  candidates: loader(() => import('./CandidateEngineering')),
  scale: loader(() => import('./ScalePrimitives')),
  earlier: loader(() => import('./EarlierGenerations')),
  trajectories: loader(() => import('./JevTrajectories')),
  atlas: loader(() => import('./EvidenceAtlas')),
  sources: loader(() => import('./MethodsSources')),
  about: loader(() => import('./AboutPage')),
  contents: loader(() => import('./ContentsPage')),
  changelog: loader(() => import('./ChangelogPage')),
}

export const named = <M, K extends keyof M>(load: () => Promise<M>, key: K) =>
  lazy(() => load().then(module => ({ default: module[key] as ComponentType<any> })))

export const Z3Part = lazy(chapters.z3)
export const LocalQwen = lazy(chapters.localQwen)
export const BoardReceipts = named(chapters.boardReceipts, 'BoardReceipts')
export const DecisionModels = named(chapters.decisionModels, 'DecisionModels')
export const FrontierTrajectories = named(chapters.frontier, 'FrontierTrajectories')
export const GreedyRule = named(chapters.greedy, 'GreedyRule')
export const MethodsCritique = named(chapters.critique, 'MethodsCritique')
export const OllamaAssessment = named(chapters.pilot, 'OllamaAssessment')
export const OllamaComparison = named(chapters.caveman, 'OllamaComparison')
export const CavemanStudies = lazy(chapters.cavemanStudies)
export const SubQAssessment = named(chapters.subq, 'SubQAssessment')
export const LegacyPanel = named(chapters.legacyPanel, 'LegacyPanel')
export const ReceiptChainNavigation = named(chapters.receiptChain, 'ReceiptChainNavigation')
export const AssessmentReceiptPage = named(chapters.receiptPage, 'AssessmentReceiptPage')
export const QueensRules = named(chapters.rules, 'QueensRules')
export const ProtocolResults = named(chapters.protocol, 'ProtocolResults')
export const JevPrimer = named(chapters.jevPrimer, 'JevPrimer')
export const CandidateEngineering = named(chapters.candidates, 'CandidateEngineering')
export const ScalePrimitives = named(chapters.scale, 'ScalePrimitives')
export const EarlierGenerations = named(chapters.earlier, 'EarlierGenerations')
export const JevTrajectories = named(chapters.trajectories, 'JevTrajectories')
export const EvidenceExplorer = named(chapters.atlas, 'EvidenceExplorer')
export const MethodsSources = named(chapters.sources, 'MethodsSources')
export const AboutPage = named(chapters.about, 'AboutPage')
export const ContentsPage = named(chapters.contents, 'ContentsPage')
export const ChangelogPage = named(chapters.changelog, 'ChangelogPage')

/** The code each route needs, keyed by its first path segment. The summary is in the entry and needs none. */
const ROUTE_CHAPTERS: Record<string, (() => Promise<unknown>)[]> = {
  'assessment-receipt': [chapters.receiptPage],
  'queens-rules': [chapters.rules],
  'how-z3-solves-queens': [chapters.z3],
  'protocol-results': [chapters.protocol],
  'jev-primer': [chapters.jevPrimer],
  'candidate-engineering': [chapters.candidates],
  'scale-primitives': [chapters.scale],
  'earlier-generations': [chapters.earlier, chapters.legacyPanel],
  'jev-trajectories': [chapters.trajectories],
  'local-open-models': [chapters.pilot],
  'local-qwen': [chapters.localQwen],
  'caveman-summary': [chapters.cavemanStudies],
  'subq-assessment': [chapters.subq],
  'decision-models': [chapters.decisionModels],
  'openai-decisions-plan': [chapters.decisionModels],
  'greedy-rule': [chapters.greedy],
  'frontier-trajectories': [chapters.frontier],
  'methods-critique': [chapters.critique],
  'evidence-atlas': [chapters.atlas],
  'board-receipts': [chapters.boardReceipts],
  'methods-sources': [chapters.sources],
  about: [chapters.about],
  contents: [chapters.contents],
  changelog: [chapters.changelog],
}

/** Start loading a route's chapter code ahead of a click. Failures are ignored here; the route reports them. */
export function preloadRoute(path: string) {
  const first = path.split('/')[0]
  ROUTE_CHAPTERS[first]?.forEach(load => load().catch(() => undefined))
  // Receipts and configuration under the 4B pilot, and the pilot's Caveman summary, are drawn by OllamaComparison.
  if ((first === 'local-open-models' && path !== first) || path === 'caveman-summary/pilot') chapters.caveman().catch(() => undefined)
}
