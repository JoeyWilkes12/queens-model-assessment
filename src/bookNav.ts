/**
 * The book's table of contents: one tree drives the sidebar, the Contents page, the hero breadcrumb
 * and the browser tab title. Parts group pages; a page may nest further pages (its own hash routes)
 * or in-page sections (`anchor`, deep links that scroll within the parent page).
 */
export type NavPage = {
  path: string
  title: string
  description: string
  /** An in-page section of its parent rather than a page of its own; the breadcrumb stops at the parent. */
  anchor?: boolean
  children?: NavPage[]
}

export type NavPart = {
  id: string
  /** Short ordinal shown above the part title, e.g. "Part II". Front and back matter have none. */
  label?: string
  title: string
  description: string
  pages: NavPage[]
}

export const BOOK_PARTS: NavPart[] = [
  {
    id: 'start',
    title: 'Start here',
    description: 'The short version, the scope of the claim and a map of the book.',
    pages: [
      { path: 'executive-summary', title: 'Executive summary', description: 'The leaderboard, short answers and where to look next.' },
      { path: 'assessment-receipt', title: 'Assessment receipt', description: 'What was tested, when, what it cost and how to read the ledger.' },
      { path: 'about-models', title: 'About the models', description: 'Where each assessed model comes from, its size, licence and the exact build or route we ran.' },
      { path: 'contents', title: 'Contents', description: 'Every part, chapter and section of the book on one page.' },
    ],
  },
  {
    id: 'puzzle',
    label: 'Part I',
    title: 'The puzzle',
    description: 'Regional Queens rules and how a constraint solver proves a board has one answer.',
    pages: [
      { path: 'queens-rules', title: 'Queens rules', description: 'Regional constraints, the three original boards and their verified solutions.' },
      {
        path: 'how-z3-solves-queens', title: 'How Z3 solves Queens', description: 'Propositions, clauses, propagation, learning, a proof of uniqueness and a rule workbench.',
        children: [
          { path: 'how-z3-solves-queens/z3-variables', title: '1 · A proposition', description: 'One Boolean variable per cell.', anchor: true },
          { path: 'how-z3-solves-queens/z3-clauses', title: '2 · Clauses', description: 'The rules written as clauses.', anchor: true },
          { path: 'how-z3-solves-queens/z3-propagation', title: '3 · Propagation', description: 'Unit propagation on the board.', anchor: true },
          { path: 'how-z3-solves-queens/z3-search', title: '4 · Search', description: 'Decisions and the trail.', anchor: true },
          { path: 'how-z3-solves-queens/z3-conflict', title: '5 · Conflict graph', description: 'Where a contradiction comes from.', anchor: true },
          { path: 'how-z3-solves-queens/z3-learning', title: '6 · Learning', description: 'Learned clauses and backjumping.', anchor: true },
          { path: 'how-z3-solves-queens/z3-confinement', title: '7 · Confinement', description: 'A matching theorem for regions.', anchor: true },
          { path: 'how-z3-solves-queens/z3-uniqueness', title: '8 · Uniqueness', description: 'Proving there is exactly one answer.', anchor: true },
          { path: 'how-z3-solves-queens/z3-engine', title: '9 · Z3’s route', description: 'What the real solver recorded.', anchor: true },
          { path: 'how-z3-solves-queens/z3-workbench', title: '10 · Workbench', description: 'Change the rules and count the answers.', anchor: true },
          { path: 'how-z3-solves-queens/z3-experiment', title: 'Open the experiment', description: 'The kernel experiment and its receipts.', anchor: true },
          { path: 'how-z3-solves-queens/z3-beyond', title: 'Appendix · Beyond Queens', description: 'Where the same encoding applies.', anchor: true },
        ],
      },
    ],
  },
  {
    id: 'frontier',
    label: 'Part II',
    title: 'Frontier language models',
    description: 'Hosted models answering from a picture of the board, then one queen at a time.',
    pages: [
      { path: 'protocol-results', title: 'Protocol & results', description: 'Frozen inputs, entrants, outcomes and route failures.' },
      { path: 'frontier-trajectories', title: 'One queen at a time', description: 'Frontier models place one queen per request and explain each move.' },
      { path: 'earlier-generations', title: 'Earlier generations', description: 'The same boards replayed across earlier model generations.' },
    ],
  },
  {
    id: 'local',
    label: 'Part III',
    title: 'Local open-weight models',
    description: 'Small models run on our own computer: Gemma, LLaVA and Qwen.',
    pages: [
      {
        path: 'local-qwen', title: 'Local open-weight assessments', description: 'Studies by board set, prompt arm, decoding and token budget, with hosted cost scenarios.',
        children: [
          {
            path: 'local-open-models', title: 'Original 4B pilot', description: 'Saved Ollama requests, deterministic grades and the conditional Caveman comparison.',
            children: [
              { path: 'local-open-models/configuration', title: 'Pilot configuration', description: 'The frozen runner, model digest and request settings.' },
            ],
          },
          { path: 'caveman-summary', title: 'Caveman comparison', description: 'Matched outcomes, token use and estimated cost across local studies, with the original 4B pilot.' },
        ],
      },
    ],
  },
  {
    id: 'decision',
    label: 'Part IV',
    title: 'Decision models',
    description: 'Models that pick one typed option per call: Jev, SubQ Snap and a no-model baseline.',
    pages: [
      {
        path: 'decision-models', title: 'Decision models vs the index', description: 'Jev, SubQ and OpenAI Decisions against the Artificial Analysis Decision Index.',
        children: [
          { path: 'openai-decisions-plan', title: 'OpenAI Decisions plan', description: 'A staged plan for a future experiment; no results claimed.', anchor: true },
        ],
      },
      {
        path: 'jev-primer', title: 'Jev primer', description: 'Typed decisions, text state and what was actually measured.',
        children: [
          { path: 'candidate-engineering', title: 'Candidate engineering', description: 'Why explicit region lists changed the decision.' },
          { path: 'scale-primitives', title: 'Scale & primitives', description: 'Larger menus, Noul, Score and held-out boards.' },
          { path: 'jev-trajectories', title: 'Jev trajectories', description: 'Empty-board placement, restarts, repeatability and batching.' },
        ],
      },
      {
        path: 'subq-assessment', title: 'SubQ Snap replay', description: 'Historical Jev tasks, deterministic results and every SubQ receipt.',
        children: [
          { path: 'subq-assessment/panel', title: 'New-board panel', description: 'SubQ on the 192 frozen new boards.' },
        ],
      },
      { path: 'greedy-rule', title: 'Greedy rule baseline', description: 'The no-model rule behind the 80/192 baseline, step by step.' },
    ],
  },
  {
    id: 'evidence',
    label: 'Part V',
    title: 'Evidence',
    description: 'Every saved request, answer, grade and cost, by record and by board.',
    pages: [
      { path: 'evidence-atlas', title: 'Evidence atlas', description: 'Search sanitized requests, outputs and metadata.' },
      { path: 'board-receipts', title: 'Board receipts', description: 'One page per panel board: who solved it, every written answer, replays and cost.' },
    ],
  },
  {
    id: 'methods',
    label: 'Part VI',
    title: 'Methods',
    description: 'Definitions, limits, sources and a critique of the design.',
    pages: [
      { path: 'methods-sources', title: 'Methods & sources', description: 'Definitions, limits and primary links.' },
      { path: 'methods-critique', title: 'Methods critique', description: 'What the design can and cannot support, and the next experiments.' },
    ],
  },
  {
    id: 'about',
    title: 'About',
    description: 'Purpose, provenance and the history of this publication.',
    pages: [
      { path: 'about', title: 'About this book', description: 'Purpose, source and a shareable QR code.' },
      { path: 'changelog', title: 'Changelog', description: 'Every published change, rebuilt from the repository history.' },
    ],
  },
]

export type NavEntry = { page: NavPage; part: NavPart; ancestors: NavPage[] }

const entries: NavEntry[] = []
const walk = (pages: NavPage[], part: NavPart, ancestors: NavPage[]) => {
  for (const page of pages) {
    entries.push({ page, part, ancestors })
    if (page.children) walk(page.children, part, [...ancestors, page])
  }
}
BOOK_PARTS.forEach(part => walk(part.pages, part, []))

/** Every page and section in reading order. */
export const NAV_ENTRIES: readonly NavEntry[] = entries

/** Pages with their own content (in-page sections excluded), in reading order. */
export const BOOK_PAGES = entries.filter(entry => !entry.page.anchor)

/** The deepest entry whose path is the given hash path or one of its prefixes. */
export function entryFor(path: string): NavEntry | undefined {
  let best: NavEntry | undefined
  for (const entry of entries) {
    const own = entry.page.path
    if ((path === own || path.startsWith(`${own}/`)) && (!best || own.length > best.page.path.length)) best = entry
  }
  return best
}

export type Crumb = { label: string; href?: string; current?: boolean }

const decode = (segment: string) => { try { return decodeURIComponent(segment) } catch { return segment } }
const capital = (word: string) => word.charAt(0).toUpperCase() + word.slice(1)

/**
 * Breadcrumb for a hash path: book, part, parent pages, then the current page. Every level above the
 * current one is a link. Routes deeper than the tree (a record, a board, a study, a receipt) are named
 * from their own path segments and link back to the page that lists them.
 */
export function crumbsFor(path: string, fallbackLabel?: string): Crumb[] {
  const root: Crumb = { label: 'Queens assessment', href: '#/contents' }
  const found = entryFor(path)
  if (!found) return [root, { label: fallbackLabel || 'Page', current: true }]
  // An in-page section belongs to its parent page; the trail stops there.
  const parent = found.page.anchor ? entries.find(candidate => candidate.page === found.ancestors[found.ancestors.length - 1]) : undefined
  const entry = parent ?? found
  const crumbs: Crumb[] = [root, { label: entry.part.title, href: `#/contents/${entry.part.id}` }]
  for (const ancestor of entry.ancestors) crumbs.push({ label: ancestor.title, href: `#/${ancestor.path}` })
  const rest = parent || found.page.path === path ? [] : path.slice(found.page.path.length + 1).split('/').filter(Boolean).map(decode)
  if (!rest.length) return [...crumbs, { label: entry.page.title, current: true }]
  crumbs.push({ label: entry.page.title, href: `#/${entry.page.path}` })
  if (rest[0] === 'receipt' && rest.length === 3) {
    // local-qwen/receipt/<study>/<call>: the study view sits between the chapter and the receipt.
    crumbs.push({ label: `Study ${rest[1]}`, href: `#/${entry.page.path}/study/${encodeURIComponent(rest[1])}` })
    crumbs.push({ label: `Receipt ${rest[2]}`, current: true })
  } else if ((rest[0] === 'receipt' || rest[0] === 'study') && rest.length === 2) {
    crumbs.push({ label: `${capital(rest[0])} ${rest[1]}`, current: true })
  } else crumbs.push({ label: rest.join(' / '), current: true })
  return crumbs
}

/** Paths that should open each disclosure so the given path is visible in the sidebar. */
export function expandedFor(path: string): string[] {
  const entry = entryFor(path)
  if (!entry) return []
  return [`part:${entry.part.id}`, ...entry.ancestors.map(page => page.path), ...(entry.page.children ? [entry.page.path] : [])]
}
