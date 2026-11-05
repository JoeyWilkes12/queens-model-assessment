import { Component, Suspense, useEffect, useRef, useState, type ReactNode } from 'react'
// The entry stylesheet keeps the order it had when every page was imported here: replay and failure-comparison
// styles, then the summary's, then the book's, so the cascade is unchanged. The failure comparison itself loads
// with the atlas; only its stylesheet (1.8 kB gzip) stays in the entry.
import './board-replay.css'
import './failure-comparison.css'
import { ExecutiveSummary } from './ExecutiveSummary'
import { Sidebar } from './Sidebar'
import './book-nav.css'
import { entryFor } from './bookNav'
import { useHashPath, Icon, PageHero, bookUi } from './bookUi'
import {
  AboutPage, AssessmentReceiptPage, BoardReceipts, CandidateEngineering, ChangelogPage, ContentsPage, DecisionModels,
  EarlierGenerations, EvidenceExplorer, FrontierTrajectories, GreedyRule, JevPrimer, JevTrajectories, LocalQwen,
  MethodsCritique, MethodsSources, OllamaAssessment, OllamaComparison, ProtocolResults, QueensRules, ScalePrimitives,
  SubQAssessment, Z3Part,
} from './chapters'
import { LoadingBlocks } from './LoadingBlocks'
import { installPrintShortcut } from './printPreparation'
import { ATLAS_HERO, LOCAL_QWEN_HERO, Z3_HERO, type HeroText } from './routeHeroes'

/** A lazy chapter's placeholder hero, from the book's contents (the chapter replaces it with its own). */
function loadingHero(path: string): HeroText {
  const entry = entryFor(path)
  return { trail: '', title: entry?.page.title ?? 'Queens assessment', deck: entry?.page.description ?? 'Loading this page.' }
}

/** If a chapter's code fails to load (offline, or a deploy replaced the files), say so and offer a reload instead of a blank page. */
class ChapterBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  render() {
    if (!this.state.failed) return this.props.children
    return <div className="not-found" role="alert"><span className="section-label">Unavailable</span><h1>This chapter could not load.</h1><p>The connection may have dropped, or the book was updated while this page was open. Reloading fetches the current version; other chapters keep working.</p><div className="next-actions"><button className="button button-mint" onClick={() => window.location.reload()}>Reload the book <Icon name="arrow" /></button></div></div>
  }
}

/** Lazy chapter placeholder: the chapter's own hero and a full-height body, so the page does not jump when it loads. */
function LoadingPage({ hero, label }: { hero: HeroText; label: string }) {
  return <><PageHero {...hero} /><main className="reading-column loading-shell" id="main-content" aria-busy="true"><p role="status">{label}</p><LoadingBlocks /></main></>
}

function NotFound() {
  const [, navigate] = useHashPath()
  return <div className="not-found"><span className="section-label">404 / unfiled page</span><h1>This page is not in the book.</h1><p>Use the chapter rail to return to a documented part of the assessment.</p><button className="button button-mint" onClick={() => navigate('executive-summary')}>Return to summary <Icon name="arrow" /></button></div>
}

const LOCAL_QWEN_RECEIPT_HERO: HeroText = { trail: 'Local open-weight assessments / saved receipt', title: 'Saved receipt', deck: 'Loading the saved study snapshot for this receipt.' }

/**
 * The page for a route. Only the summary is in the entry; every other page is lazy (src/chapters.ts) and shows the
 * shared loading shell, or its own hero where the chapter's hero is known in advance (src/routeHeroes.ts).
 */
function routePage(active: string, parts: string[]): ReactNode {
  const [, second, third, fourth] = parts
  const own = (hero: HeroText, label: string, page: ReactNode) => <Suspense fallback={<LoadingPage hero={hero} label={label} />}>{page}</Suspense>
  switch (active) {
    case 'executive-summary': return <ExecutiveSummary />
    case 'assessment-receipt': return <AssessmentReceiptPage />
    case 'queens-rules': return <QueensRules />
    case 'how-z3-solves-queens': return own(Z3_HERO, 'Loading How Z3 solves Queens…', <Z3Part ui={bookUi} section={second} />)
    case 'protocol-results': return <ProtocolResults />
    case 'jev-primer': return <JevPrimer />
    case 'candidate-engineering': return <CandidateEngineering />
    case 'scale-primitives': return <ScalePrimitives />
    case 'earlier-generations': return <EarlierGenerations />
    case 'jev-trajectories': return <JevTrajectories selectedId={second} />
    case 'local-open-models':
      if (second === 'receipt') return <OllamaComparison ui={bookUi} view="receipt" callId={third} />
      if (second === 'configuration') return <OllamaComparison ui={bookUi} view="configuration" />
      return <OllamaAssessment ui={bookUi} />
    case 'local-qwen': return own(second === 'receipt' ? LOCAL_QWEN_RECEIPT_HERO : LOCAL_QWEN_HERO, 'Loading local open-weight assessments…',
      <LocalQwen ui={bookUi} studyId={second === 'receipt' || second === 'study' ? third : undefined} callId={second === 'receipt' ? fourth : undefined} />)
    case 'caveman-summary': return <OllamaComparison ui={bookUi} view="summary" />
    case 'subq-assessment': return <SubQAssessment ui={bookUi} selectedId={second} />
    case 'decision-models': return <DecisionModels ui={bookUi} />
    case 'greedy-rule': return <GreedyRule ui={bookUi} />
    case 'frontier-trajectories': return <FrontierTrajectories ui={bookUi} />
    case 'openai-decisions-plan': return <DecisionModels ui={bookUi} focusSection="openai-plan" />
    case 'methods-critique': return <MethodsCritique ui={bookUi} />
    case 'evidence-atlas': return second ? <EvidenceExplorer selectedId={second} /> : own(ATLAS_HERO, 'Loading the evidence atlas…', <EvidenceExplorer />)
    case 'board-receipts': return <BoardReceipts ui={bookUi} boardId={second} />
    case 'methods-sources': return <MethodsSources />
    case 'about': return <AboutPage />
    case 'contents': return <ContentsPage partId={second} />
    case 'changelog': return <ChangelogPage />
    default: return <NotFound />
  }
}

function App() {
  const [path, navigate] = useHashPath()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const menuButtonRef = useRef<HTMLButtonElement>(null)
  const drawerWasOpen = useRef(false)
  const [theme, setTheme] = useState<'light' | 'dark'>(() => (localStorage.getItem('queens-theme') as 'light' | 'dark') || 'light')
  const parts = path.split('/').filter(Boolean)
  const active = parts[0] || 'executive-summary'
  useEffect(() => { installPrintShortcut() }, [])
  useEffect(() => { document.documentElement.dataset.theme = theme; localStorage.setItem('queens-theme', theme) }, [theme])
  useEffect(() => { document.title = `${entryFor(path)?.page.title || 'Queens assessment'} · Queens book` }, [path])
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior }) }, [path])
  useEffect(() => {
    if (drawerOpen) document.querySelector<HTMLButtonElement>('.sidebar-close')?.focus()
    else if (drawerWasOpen.current) menuButtonRef.current?.focus()
    drawerWasOpen.current = drawerOpen
  }, [drawerOpen])
  const page = routePage(active, parts)
  return <div className="app-shell"><Sidebar path={path} open={drawerOpen} onClose={() => setDrawerOpen(false)} /><div className="page-frame" {...(drawerOpen ? { inert: '' } : {})}><header className="mobile-topbar"><button ref={menuButtonRef} className="icon-button" onClick={() => setDrawerOpen(true)} aria-label="Open navigation"><Icon name="menu" /></button><button className="mobile-wordmark" onClick={() => navigate('executive-summary')}>Queens <span>/ assessment</span></button><ThemeToggle theme={theme} setTheme={setTheme} /></header><div className="page-tools"><ThemeToggle theme={theme} setTheme={setTheme} /></div><div className="page-body"><ChapterBoundary key={path}><Suspense fallback={<LoadingPage hero={loadingHero(path)} label="Loading this chapter…" />}>{page}</Suspense></ChapterBoundary></div><footer className="site-footer"><span>Queens assessment · expanded illustrated edition</span><span><a href="#/contents">contents</a> · <a href="#/about">about this book</a> · <a href="#/changelog">changelog</a> · <a href="#/methods-sources">methods and sources</a></span></footer></div></div>
}

function ThemeToggle({ theme, setTheme }: { theme: 'light' | 'dark'; setTheme: (theme: 'light' | 'dark') => void }) {
  return <button className="theme-toggle" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}><Icon name={theme === 'light' ? 'moon' : 'sun'} /><span>{theme === 'light' ? 'Dark' : 'Light'}</span></button>
}

export default App
