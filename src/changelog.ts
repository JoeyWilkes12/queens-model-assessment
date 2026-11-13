/**
 * Publication history, newest first. Rebuilt on 2 November 2026 from the first-parent history of `main`
 * (every pull-request merge and every direct commit) and maintained by hand from then on.
 * `npm run changelog:verify` fails when a first-parent commit on `main` is not covered: a pull-request
 * merge is covered by its `pr` number, any other commit by a hash prefix listed in `commits`.
 */
export type ChangeKind = 'evidence' | 'chapter' | 'interface' | 'method' | 'fix' | 'dependency'

export type ChangeEntry = {
  date: string
  title: string
  kinds: ChangeKind[]
  /** Pull request that delivered the change, when there was one. */
  pr?: number
  /** Short hashes of direct commits on main, or of notable commits inside a pull request. */
  commits?: string[]
  changes: string[]
}

export const REPOSITORY_URL = 'https://github.com/JoeyWilkes12/queens-model-assessment'

/** Provenance of the original book foundation, previously shown in the sidebar footer and on the About page. */
export const FOUNDATION = {
  reportSha: '1e103a40…e452d67',
  sourceRevision: 'dc5b1f77357bcb62580f3e4f5ccf480765586b75',
  note: 'Both identify the private source report and the original book foundation that this repository was imported from. Neither commit is in this repository: the report hash is shown truncated as it was published, and the source revision belongs to the private working repository. Every change after the import is listed below.',
}

export const CHANGELOG: ChangeEntry[] = [
  {
    date: '2026-11-12',
    title: 'Fresh2 replication results and unfinished Qwen coverage',
    kinds: ['evidence', 'chapter', 'method'],
    pr: 30,
    changes: [
      'Updated #/local-qwen and its study/receipt routes with the November 12 snapshot: 30 conditions, 973 assessment/audit receipts and 38 separate rescues.',
      'Reported the two predictions that could be checked against the analysis fixed before the night. On Fresh2, GPT-OSS at medium effort had fewer cut-offs (9 against 23) and more strict answers (31/48 against 25/48) than at high effort; the pooled accuracy difference is not significant (p = 0.073). Gemma again scored lower with Caveman than at baseline (2/12 against 5/12); pooled over both board sets that deficit is significant (p = 0.016, 24 boards).',
      'Kept Qwen 4B Fresh2 unfinished at 42/48 recorded and Qwen 9B Fresh2 text unstarted. Shared-index comparisons also receive the new data; the original 4B pilot and hosted-comparison local rows retain their historical scope.',
    ],
  },
  {
    date: '2026-11-11',
    title: 'Final nights of local open-weight assessments',
    kinds: ['evidence', 'chapter', 'method'],
    pr: 28,
    changes: [
      'Updated #/local-qwen and its study/receipt routes to 27 conditions, 835 assessment/audit receipts and 38 separate rescues. GPT-OSS Fresh2 text grids are complete at 25/48 strict.',
      'Added separate Fresh1 GPT-OSS medium-effort 32k and high-effort 65k conditions, each 29/48 strict, with board/arm denominators, changed traces and one recorded transport failure with unknown usage.',
      'The leaderboard open-weight views and the shared #/caveman-summary comparison now include the completed panels. Effort settings remain distinct; #/caveman-summary/pilot and hosted-comparison local rows retain their 4B pilot scope.',
    ],
  },
  {
    date: '2026-11-06',
    title: 'Caveman comparison across local studies',
    kinds: ['chapter', 'method'],
    pr: 16,
    changes: [
      'Expanded #/caveman-summary to show matched strict outcomes, format recovery and saved hosted-cost scenarios across separate local study conditions.',
      'Preserved the original 4B pilot at #/caveman-summary/pilot and linked the expanded local assessment chapter.',
    ],
  },
  {
    date: '2026-11-06',
    title: 'Incomplete open-weight coverage in the Queens leaderboard',
    kinds: ['chapter', 'interface'],
    pr: 20,
    changes: [
      'Added a separate progress view for incomplete studies, with recorded outcomes and unrecorded calls shown against each frozen plan.',
      'Shows the unfinished GPT-OSS 20B Fresh2 text-grid panel separately from the superseded original-budget runs. Completed Qwen 27B Fresh1 images appear in completed coverage.',
    ],
  },
  {
    date: '2026-11-06',
    title: 'Completed open-weight assessments in the Queens leaderboard',
    kinds: ['chapter', 'interface'],
    pr: 19,
    changes: [
      'Added a completed open-weight view to the Executive Summary leaderboard with model, board-panel and board-size filters.',
      'The November 6 catalog includes completed Qwen 9B Fresh2 and Qwen 27B Fresh1 image studies. Selected rerun audits remain separate.',
    ],
  },
  {
    date: '2026-11-06',
    title: 'November 5–6 local assessments and the Fresh2 panel',
    kinds: ['evidence', 'chapter', 'method'],
    pr: 18,
    changes: [
      'Completed the Qwen 9B text-grid panel at 26/48 strict and the image panel with a request-level JSON schema at 19/24 strict.',
      'Completed Qwen 27B Fresh1 images at 43/48 strict and Qwen 9B Fresh2 images at 43/48 strict. GPT-OSS 20B Fresh2 text grids have 18/48 recorded.',
      'Added matched input and decoding comparisons and a request-latency table. The November 6 snapshot adds 73 receipts since November 5, bringing coverage to 25 conditions, 709 assessment and audit receipts and 38 separate rescues.',
    ],
  },
  {
    date: '2026-11-05',
    title: 'Reviewable evidence updates and changelog guidance',
    kinds: ['method'],
    pr: 12,
    changes: [
      'Documented how to split evidence and site changes into reviewable PRs and keep the changelog current.',
    ],
  },
  {
    date: '2026-11-03',
    title: 'First text-grid assessments and completed Qwen 4B image panel',
    kinds: ['evidence', 'chapter'],
    pr: 17,
    changes: [
      'Completed the Qwen 4B fresh image panel with 16 strict answers in 48 calls.',
      'Added GPT-OSS 20B on text grids with 23/48 strict and the first eight Qwen 9B text-grid calls, all strict, with 40 calls pending.',
      'Added text-grid receipt links and updated local coverage to 21 conditions and 531 assessment and audit receipts, plus 38 separate rescues.',
    ],
  },
  {
    date: '2026-11-02',
    title: 'Book organization, breadcrumb navigation and this changelog',
    kinds: ['interface'],
    pr: 13,
    changes: [
      'Regrouped the book into front matter, six numbered parts and an About section, with a new Contents page.',
      'The sidebar now nests pages under collapsible parts and parent pages. Everything starts collapsed except the path to the page you are reading.',
      'The page breadcrumb is now links: each level, and an up arrow, leads back to the parent page, the part or the Contents page.',
      'The leaderboard’s Solved vs cost view is available on phones. In portrait it suggests rotating to landscape and offers a scrollable view instead. The scatter plot zooms and pans with buttons, pinch, Ctrl or ⌘ + scroll and drag.',
      'Added this changelog, rebuilt from the repository history. The foundation report SHA moved here from the sidebar footer.',
      'Removed the redundant “Public / read-only” label from the page header.',
    ],
  },
  {
    date: '2026-11-02',
    title: 'November 2 Qwen sampling rounds and costs',
    kinds: ['evidence', 'chapter'],
    pr: 11,
    commits: ['62de176f'],
    changes: [
      'Published the third sampling rounds for Qwen 9B and 27B; fresh1 Qwen 4B remains partial at 13 strict of 37 recorded, with 48 planned.',
      'The snapshot now holds 19 conditions and 464 assessment receipts, plus 38 separate rescues.',
      'Added updated hosted-cost scenarios for the November 2 results.',
    ],
  },
  {
    date: '2026-11-01',
    title: 'Complete local open-weight assessment coverage',
    kinds: ['evidence', 'chapter'],
    pr: 10,
    commits: ['29488b47'],
    changes: [
      'Brought every local open-weight assessment into the book: Gemma 4 E4B, LLaVA-Llama3 and Qwen.',
      'Added fresh-board four-arm studies with planned and recorded denominators kept apart, so unrun requests are not counted as model failures.',
      'Documented coverage and scientific limits.',
    ],
  },
  {
    date: '2026-10-31',
    title: 'Vite 8.3.5',
    kinds: ['dependency'],
    pr: 6,
    commits: ['65b06fd3'],
    changes: ['Bumped the Vite build tool from 8.3.0 to 8.3.5.'],
  },
  {
    date: '2026-10-31',
    title: 'Qwen experiments, loop-stop audits and hosted cost scenarios',
    kinds: ['evidence', 'chapter', 'method'],
    pr: 8,
    commits: ['e34d257a', 'd299ca69', '7a227747'],
    changes: [
      'Showed Caveman token tradeoffs with illustrative hosted costs.',
      'Expanded the local Qwen studies with budget and sampling conditions and loop-stop methods.',
      'Imported round-two Qwen results and selected loop-stop audits.',
    ],
  },
  {
    date: '2026-10-31',
    title: 'Executive Summary led by a leaderboard',
    kinds: ['interface', 'chapter'],
    pr: 9,
    commits: ['b4d0e923', 'dc870e37'],
    changes: [
      'Rewrote the Executive Summary as short answers with the evidence one click away.',
      'Opened it with the Queens leaderboard: every system on the same boards, with boards solved, cost, and solved vs cost views.',
    ],
  },
  {
    date: '2026-10-28',
    title: 'Local Qwen with paired Caveman prompts',
    kinds: ['evidence', 'chapter'],
    pr: 7,
    commits: ['22866ee0', '15a6cbfe'],
    changes: [
      'Assessed a local Qwen model with paired baseline and Caveman prompts.',
      'Linked the paired receipts and summarized the pilot on its own page.',
    ],
  },
  {
    date: '2026-10-19',
    title: 'Simpler Executive Summary results and spend',
    kinds: ['interface'],
    pr: 5,
    commits: ['abd078a1'],
    changes: ['Simplified the results and spend sections of the Executive Summary.'],
  },
  {
    date: '2026-10-19',
    title: 'Executive Summary defaults',
    kinds: ['interface'],
    pr: 4,
    commits: ['b8dac190'],
    changes: ['The Executive Summary now opens on the larger panels, with matching sort orders.'],
  },
  {
    date: '2026-10-19',
    title: 'Review follow-ups',
    kinds: ['fix'],
    pr: 3,
    commits: ['803a8a51'],
    changes: [
      'A zero solved count no longer draws a sliver of success bar.',
      'The board-receipt verifier now catches a system whose receipt list is missing entirely.',
    ],
  },
  {
    date: '2026-10-19',
    title: 'Earlier generations complete, board receipts and cost per request',
    kinds: ['evidence', 'chapter', 'interface'],
    pr: 2,
    commits: ['fe9b2046', 'e0c317d6', 'd726a513', 'a824c68e', '56062e68', '34998568', '2f3d5394'],
    changes: [
      'Completed the earlier-generation panel (288 of 288 requests), including the settled Gemini 2.5 batches.',
      'Added Cost and Evals views to the scoreboard.',
      'Added Board receipts: one page per panel board with every written answer, replays and cost.',
      'Showed cost per request and SubQ cost; recorded the Codex review and its suggested follow-ups.',
    ],
  },
  {
    date: '2026-10-18',
    title: 'October 17 follow-ups and cost per evaluation',
    kinds: ['evidence', 'chapter', 'fix'],
    commits: ['b8d8b216', 'b8383d31', '92657f70'],
    changes: [
      'Published the 17 October follow-ups: a partial, labelled earlier-generation panel, the one-queen-per-request pilot and the greedy rule chapter.',
      'Showed OpenRouter cost per evaluation, board and model throughout the book.',
      'Fixed cost review findings: graded-attempt cost per board, unknown cost for upstream errors, honest not-run labels.',
    ],
  },
  {
    date: '2026-10-17',
    title: 'Greedy rule, one queen at a time and budget-stop handling',
    kinds: ['chapter', 'method', 'fix'],
    commits: ['650946fc', '5dc5332d', '5cd0b194', '935cf759', 'ae8e3e97', '4113d53d', 'fcdb6463', '6898a136'],
    changes: [
      'Added the greedy rule chapter and the one-queen-per-request chapter.',
      'Stopped both runners at the OpenRouter budget limit and reclassified the 110 blocked calls as not run (amendment 4).',
      'Rendered trajectory receipts in the evidence atlas; scrubbed private provider fields from published evidence.',
      'Applied review fixes to batch costs, trajectory end states and labels.',
    ],
  },
  {
    date: '2026-10-16',
    title: 'Release: SubQ and Jev new-board panels, How Z3 solves Queens, frontier image panel',
    kinds: ['evidence', 'chapter', 'method'],
    commits: ['0e1c4c64', '41b1317c', 'bc514459', '56b32113', '4f3cf708', 'dd2a8dec', 'a97acada', '39c422af', 'b247ed6a', '6b2d8ad0', '032e776b', '6ef41e03'],
    changes: [
      'Published the SubQ and Jev 1.13 new-board panels with receipts, analysis and a report.',
      'Added the How Z3 solves Queens part, reviewed for mathematical accuracy, and folded the standalone Constraint Atlas into it.',
      'Published the frontier image panel and its re-runs.',
      'Drafted pre-registrations for the earlier-generation panel and the one-queen trajectory harness.',
    ],
  },
  {
    date: '2026-10-15',
    title: 'Decision Index on phones, Evals scoreboard and new-board panel corpus',
    kinds: ['interface', 'method'],
    commits: ['72e9cc97', '3ff70d42', '04f7506f', '8f926ed9'],
    changes: [
      'Made the Decision Index charts readable on phones.',
      'Documented the new routes, the methods critique and the Artificial Analysis snapshot.',
      'Merged the certified board generator and the frozen stratified SubQ panel corpus.',
      'Added the Evals scoreboard to the Executive Summary.',
    ],
  },
  {
    date: '2026-10-14',
    title: 'Executive Summary rewrite, Decision Index and methods critique',
    kinds: ['chapter', 'method'],
    commits: ['5fdfb5b5', '4b879b0c'],
    changes: [
      'Rewrote the Executive Summary, fitted replays to phones and added the Decision Index comparison.',
      'Added the methods critique with greedy and chance baselines.',
    ],
  },
  {
    date: '2026-10-13',
    title: 'SubQ Snap on the retained Jev tasks',
    kinds: ['evidence', 'chapter'],
    commits: ['0fa62bfd', 'd295f63c', '5da41c6c'],
    changes: [
      'Assessed SubQ Snap on the retained Jev tasks with isolated execution and public receipts.',
      'Included the provider security reference and a sourced OpenAI test plan.',
      'Added SubQ trajectory playback and linked receipt navigation.',
    ],
  },
  {
    date: '2026-10-01',
    title: 'Jev trajectories, earlier generations and receipt boards',
    kinds: ['evidence', 'chapter', 'interface'],
    commits: ['26bc2bff', '9db56d69', 'e94c2cf5', '5e754042', 'acfed6fd', '32b6f225', 'dd4d60ff'],
    changes: [
      'Published the Jev trajectory and repeatability follow-up (90 attempts on nine boards).',
      'Published the earlier-generation assessment and the representation diagnostics, with every response receipt.',
      'Added frozen table headers, static board views on receipts, recorded Jev playback, and model answers beside verified solutions.',
    ],
  },
  {
    date: '2026-09-21',
    title: 'First publication',
    kinds: ['chapter', 'interface'],
    commits: ['754fb130', 'f0f0a143', '8d64caca', 'f6db6ff7', 'f0b837d0'],
    changes: [
      'Imported the assessment book foundation: the Executive Summary, Queens rules, protocol and results, the Jev chapters, the evidence atlas, methods and About.',
      'Published the book on GitHub Pages and added fullscreen receipts with outcome context.',
      'Added model author and exact-version filters to the evidence atlas.',
    ],
  },
]
