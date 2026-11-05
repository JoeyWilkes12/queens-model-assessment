import { Component, Suspense, useEffect, useRef, useState, type ReactNode } from 'react'
import { AboutPage } from './AboutPage'
import { AssessmentReceiptPage } from './AssessmentReceiptPage'
import { CandidateEngineering } from './CandidateEngineering'
import { ChangelogPage } from './ChangelogPage'
import { ContentsPage } from './ContentsPage'
import { EarlierGenerations } from './EarlierGenerations'
import { EvidenceExplorer } from './EvidenceAtlas'
import { ExecutiveSummary } from './ExecutiveSummary'
import { JevPrimer } from './JevPrimer'
import { JevTrajectories } from './JevTrajectories'
import { LoadingBlocks } from './LoadingBlocks'
import { MethodsSources } from './MethodsSources'
import { ProtocolResults } from './ProtocolResults'
import { QueensRules } from './QueensRules'
import { ScalePrimitives } from './ScalePrimitives'
import { Sidebar } from './Sidebar'
// After the page imports, so the book's stylesheet keeps its place after the figures' styles.
import './book-nav.css'
import { entryFor } from './bookNav'
import { useHashPath, Icon, PageHero, bookUi } from './bookUi'
import { Z3Part, LocalQwen, BoardReceipts, DecisionModels, FrontierTrajectories, GreedyRule, MethodsCritique, OllamaAssessment, OllamaComparison, SubQAssessment } from './chapters'
import { installPrintShortcut } from './printPreparation'
import { LOCAL_QWEN_HERO, Z3_HERO, type HeroText } from './routeHeroes'

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

function App() {
  const [path, navigate] = useHashPath()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const menuButtonRef = useRef<HTMLButtonElement>(null)
  const drawerWasOpen = useRef(false)
  const [theme, setTheme] = useState<'light' | 'dark'>(() => (localStorage.getItem('queens-theme') as 'light' | 'dark') || 'light')
  const parts = path.split('/').filter(Boolean)
  const active = parts[0] || 'executive-summary'
  const selectedId = active === 'evidence-atlas' && parts[1] ? parts[1] : undefined
  useEffect(() => { installPrintShortcut() }, [])
  useEffect(() => { document.documentElement.dataset.theme = theme; localStorage.setItem('queens-theme', theme) }, [theme])
  useEffect(() => { document.title = `${entryFor(path)?.page.title || 'Queens assessment'} · Queens book` }, [path])
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior }) }, [path])
  useEffect(() => {
    if (drawerOpen) document.querySelector<HTMLButtonElement>('.sidebar-close')?.focus()
    else if (drawerWasOpen.current) menuButtonRef.current?.focus()
    drawerWasOpen.current = drawerOpen
  }, [drawerOpen])
  const page = active === 'executive-summary' ? <ExecutiveSummary />
    : active === 'assessment-receipt' ? <AssessmentReceiptPage />
      : active === 'queens-rules' ? <QueensRules />
        : active === 'how-z3-solves-queens' ? <Suspense fallback={<LoadingPage hero={Z3_HERO} label="Loading How Z3 solves Queens…" />}><Z3Part ui={bookUi} section={parts[1]} /></Suspense>
        : active === 'protocol-results' ? <ProtocolResults />
          : active === 'jev-primer' ? <JevPrimer />
            : active === 'candidate-engineering' ? <CandidateEngineering />
            : active === 'scale-primitives' ? <ScalePrimitives />
              : active === 'earlier-generations' ? <EarlierGenerations />
                : active === 'jev-trajectories' ? <JevTrajectories selectedId={parts[1]} />
                : active === 'local-open-models' ? parts[1] === 'receipt' ? <OllamaComparison ui={bookUi} view="receipt" callId={parts[2]} /> : parts[1] === 'configuration' ? <OllamaComparison ui={bookUi} view="configuration" /> : <OllamaAssessment ui={bookUi} />
                : active === 'local-qwen' ? <Suspense fallback={<LoadingPage hero={parts[1] === 'receipt' ? { trail: 'Local open-weight assessments / saved receipt', title: 'Saved receipt', deck: 'Loading the saved study snapshot for this receipt.' } : LOCAL_QWEN_HERO} label="Loading local open-weight assessments…" />}><LocalQwen ui={bookUi} studyId={parts[1] === 'receipt' || parts[1] === 'study' ? parts[2] : undefined} callId={parts[1] === 'receipt' ? parts[3] : undefined} /></Suspense>
                : active === 'caveman-summary' ? <OllamaComparison ui={bookUi} view="summary" />
                : active === 'subq-assessment' ? <SubQAssessment ui={bookUi} selectedId={parts[1]} />
                : active === 'decision-models' ? <DecisionModels ui={bookUi} />
                : active === 'greedy-rule' ? <GreedyRule ui={bookUi} />
                : active === 'frontier-trajectories' ? <FrontierTrajectories ui={bookUi} />
                : active === 'openai-decisions-plan' ? <DecisionModels ui={bookUi} focusSection="openai-plan" />
                : active === 'methods-critique' ? <MethodsCritique ui={bookUi} />
                : active === 'evidence-atlas' ? <EvidenceExplorer selectedId={selectedId} />
                : active === 'board-receipts' ? <BoardReceipts ui={bookUi} boardId={parts[1]} />
                  : active === 'methods-sources' ? <MethodsSources />
                    : active === 'about' ? <AboutPage />
                    : active === 'contents' ? <ContentsPage partId={parts[1]} />
                    : active === 'changelog' ? <ChangelogPage /> : <NotFound />
  return <div className="app-shell"><Sidebar path={path} open={drawerOpen} onClose={() => setDrawerOpen(false)} /><div className="page-frame" {...(drawerOpen ? { inert: '' } : {})}><header className="mobile-topbar"><button ref={menuButtonRef} className="icon-button" onClick={() => setDrawerOpen(true)} aria-label="Open navigation"><Icon name="menu" /></button><button className="mobile-wordmark" onClick={() => navigate('executive-summary')}>Queens <span>/ assessment</span></button><ThemeToggle theme={theme} setTheme={setTheme} /></header><div className="page-tools"><ThemeToggle theme={theme} setTheme={setTheme} /></div><div className="page-body"><ChapterBoundary key={path}><Suspense fallback={<LoadingPage hero={loadingHero(path)} label="Loading this chapter…" />}>{page}</Suspense></ChapterBoundary></div><footer className="site-footer"><span>Queens assessment · expanded illustrated edition</span><span><a href="#/contents">contents</a> · <a href="#/about">about this book</a> · <a href="#/changelog">changelog</a> · <a href="#/methods-sources">methods and sources</a></span></footer></div></div>
}

function ThemeToggle({ theme, setTheme }: { theme: 'light' | 'dark'; setTheme: (theme: 'light' | 'dark') => void }) {
  return <button className="theme-toggle" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}><Icon name={theme === 'light' ? 'moon' : 'sun'} /><span>{theme === 'light' ? 'Dark' : 'Light'}</span></button>
}

export default App
