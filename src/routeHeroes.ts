/**
 * Hero text for lazily loaded chapters. The loading shell in App.tsx and the chapter itself render the same
 * hero, so the hero keeps its height while the chapter's code and data arrive. This module is tiny and has
 * no imports, so the shell does not pull in the chapter.
 */
export type HeroText = { trail: string; title: string; deck: string; action?: { label: string; scrollTo: string } }

export const LOCAL_QWEN_HERO: HeroText = {
  trail: 'Model generations / local open-weight assessments',
  title: 'Local open-weight assessments',
  deck: 'Inspect Qwen, GPT-OSS, Gemma and LLaVA studies by board set, input modality, prompt arm, decoding and token budget. Every number leads back to saved evidence.',
}

export const Z3_HERO: HeroText = {
  trail: 'The board / how Z3 solves Queens',
  title: 'How Z3 solves Queens',
  deck: 'Ten short chapters on the mathematics a solver uses on the book’s 7×7 board: propositions, clauses, propagation, conflict-driven learning, a matching theorem, a proof of uniqueness, and a workbench for changing the rules. Figures distinguish recorded runs, checked encodings and labelled illustrations; the workbench computes in this page and says so.',
  action: { label: 'Read the explanation', scrollTo: 'z3-variables' },
}

export const ATLAS_HERO: HeroText = {
  trail: 'Receipts / atlas',
  title: 'Evidence atlas',
  deck: 'Search the sanitized request, visible output, deterministic grade, and metadata behind the assessment. Every record is a bounded receipt, not a private raw dump.',
}
