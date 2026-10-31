# Queens assessment book design system

## Table of contents

- [Design intent](#design-intent)
- [Source of truth](#source-of-truth)
- [Information architecture](#information-architecture)
- [Visual language](#visual-language)
- [Core components](#core-components)
- [Table behavior](#table-behavior)
- [Receipt boards and recorded playback](#receipt-boards-and-recorded-playback)
- [Responsive behavior](#responsive-behavior)
- [Accessibility](#accessibility)
- [Evidence semantics](#evidence-semantics)
- [Deliberate constraints](#deliberate-constraints)

## Design intent

The site is an evidence-first technical book for AI engineers. It leads with the assessment finding, teaches regional Queens, separates generative solving from typed decision selection, and then lets a reader trace every claim into sanitized source receipts. It should feel like a field guide and laboratory notebook rather than a marketing dashboard.

## Source of truth

The visual authority is the authorized [AI Agent Skills Resource Library design system](</Users/joeywilkes/Desktop/Scripts & Code/AI Agent Skills/agent-skills-resource-library/DESIGN.md>). The implementation adapts its guide-reading model, trust receipt, square geometry, and evidence language to the [expanded Queens report](../REPORT.md).

## Information architecture

The persistent book rail groups twelve routes into six chapters:

1. Read first: executive summary and assessment receipt.
2. The board: Queens rules and protocol/results.
3. Model generations: the October 1 earlier-generation replay using the original board images.
4. The Jev question: primer, candidate engineering, scale/primitives, and trajectories.
5. Receipts: searchable evidence atlas and methods/sources.
6. About: purpose, provenance, and sharing.

Hash routing keeps every page compatible with a later static host. The evidence atlas adds one deep-linkable subpage per request or full grade source.

## Visual language

- Navy `#071b33` is the cover, rail, and inverse reading surface.
- Warm paper `#f6f1e8` and raised paper `#fffdf8` make long reading sessions feel editorial.
- Mint `#aee7ce` and deep mint `#1c795e` mark verified or evidence-oriented states.
- Coral `#ff6954` marks focus, active navigation, and consequential failures.
- Gold `#e8b44f` marks caution and unresolved review states.
- Georgia/Times carries editorial headings; Inter/system sans carries body copy; system monospace carries prompts, hashes, timings, and JSON.
- Spacing follows a 4px-derived rhythm. Borders are square and structural; gradients, glass effects, and generic rounded-card grids are intentionally absent.

## Core components

- **Book rail:** global route hierarchy, edition/date, active chapter, and report hash.
- **Page hero:** chapter trail, strong thesis, and at most one primary action.
- **Assessment receipt:** source class, verification date, interaction mode, and bounded outcome.
- **Local contents rail:** in-page navigation that scrolls without corrupting hash routing.
- **Board diagram:** visible region letters, color redundancy, row/column-aware cell labels, and queen markers.
- **Candidate lens:** toggles between columns-only and explicit-region representations using exact saved candidates.
- **Evidence atlas:** searchable, study-, provider-, exact-model-version-, and outcome-filtered request and grade-source index with distinct request and assessment states.
- **Evidence receipt:** content-addressed input attachment, exact sanitized request, visible output, deterministic grade, metadata, copy, and download.
- **Callouts and tables:** explicit evidence, caution, and boundary treatments. Every table uses the shared `DataTable` component and the frozen-header behavior below.

## Table behavior

- Preserve native table, caption, column-header and row-header semantics. Do not clone headers or turn rows into mobile cards.
- Short tables take their natural height. Tall tables scroll inside a named, keyboard-focusable region capped at the smaller of 36rem or 65% of the dynamic viewport height; the `vh` fallback covers older browsers. This leaves room for mobile navigation and the surrounding reading context.
- Column headers stick to the top of the table's own scroll region. Their opaque, theme-aware raised-paper surface and stacking layer keep scrolling rows from showing through. Separate borders preserve the header rule while it moves.
- Horizontal and vertical scrolling remain native, with columns and headers moving together horizontally. Visible guidance explains the scroll behavior; the same guidance describes the accessible region.
- Measure wrapped header height with `ResizeObserver` and use it as scroll padding so keyboard-focused receipt links can be brought below the frozen header after viewport, font or zoom changes.
- The mobile navigation remains above the table. No first-column pinning, data hiding, sampling or evidence truncation is introduced.
- Printing removes the scroll height limit and sticky positioning so every row remains available.

## Receipt boards and recorded playback

These are narrow additions to the existing field-guide identity, not a replacement visual world. Static receipt views reconstruct only complete, unambiguous public input partitions and exact recoverable placements. Unknown inputs retain raw evidence. Recorded Jev playback links actual request boundaries, distinguishes model choices from harness-forced decisions, and stops at the recorded evaluator outcome. It is not an animation of hidden reasoning or invented intermediate steps; reduced-motion users retain manual frame navigation without playback.

Eligible saved assessment failures use two static, equal-scale subplots: recorded model response and evaluator-identified unique legal solution. Boards expand to fill their panes but never shrink below their native cell scale. They sit side by side above 600px of comparison-container width, stack below it, and keep larger boards horizontally scrollable inside their panels. The section uses an `h2`; pane, annotation and note titles use `h3`.

Red crowns and rings mark differences from the unique reference; red cell outlines and X marks identify recomputed direct rule conflicts. Neither implies the other. Matching queens remain navy/gold; written coordinates, legends and region counts provide non-color equivalents. Partial answers stay partial, format-only failures acquire no invented geometric errors, and unavailable answers show an explicit no-placement panel rather than substitute the reference.

Identified evaluator references are a separate versioned registry derived and independently verified from public partitions after evaluation. They are not imported private answer files, returned model answers, repaired responses or changed grades. Some candidate menus may already have included a correct layout as an unidentified option. Publicly identified solutions make these boards unsuitable as secret future benchmarks. Each eligible receipt exposes its written partition, binding/reference provenance, and unchanged raw evidence for inspection.

## Solver teaching part

`#/how-z3-solves-queens` (source in `src/z3/`, lazy-loaded) teaches the mathematics a solver uses on the book's 7×7 board. Its conventions extend, not replace, the field-guide identity:

- Every figure carries one engine caption. **Reference CDCL execution · pairwise encoding** marks the book's own checked kernel; **Recorded Z3 execution · Z3 4.16.0 · configuration** marks real Z3 receipts; **In-browser exact counter · computed in this page · not Z3** (CNT, outlined mark) marks Chapter 10's workbench; new browser runs and illustrations say so. The reference trail is never presented as Z3's.
- Figures replay committed evidence from `public/evidence/z3/` (generated and validated by `npm run z3:generate`, re-checked by `npm run z3:verify`). A missing file produces an explicit unavailable state, never substitute data.
- The shared board renderer draws explicit states only: unassigned, queen (true), × (false), with region letters, heavy region boundaries, and D/L badges for decisions and learned reasons. It never reads a saved solution.
- On phones, player transports pin to the bottom while their figure is on screen (not on short viewports); playback is opt-in, pauses when hidden or offscreen, and is disabled under reduced motion. Every figure has a written equivalent.
- Chapter 10, **Workbench: change the rules** (`z3-workbench`), folds in the standalone Constraint Atlas (kept online as a backup, unchanged). The text explains each rule before the switches appear; the switches sit directly above the board and the results directly beside or below it. Fixed cells are framed with `=1`/`=0` badges, witness queens are unframed, and one polite live region announces each change with its result. The count is exact below 100,000 and otherwise reads “at least 100,000”. Both SMT-LIB exports (production `Sum(If)`/`Implies` and pairwise CNF) follow the switches and fixed cells; the copy/download status names the exact text it describes. `npm run z3:verify` runs `scripts/verify-z3-workbench.mjs`, which checks the counter against an independent enumeration and both exports with Z3.
- The board column of the workbench stays at least 328px wide beside the results, and at 320–360px the board runs edge to edge, so its cells stay 44px. The Chapter 2 sidebar (“Other ways to model the board”) is a collapsed disclosure; the Beyond Queens appendix (`z3-beyond`) closes the part with one mapping table and no performance claims.

## Responsive behavior

- At and above 1180px, the global book rail and local contents rail can remain visible together.
- Below 1180px, local contents move into document flow.
- Below 780px, the global rail becomes a modal drawer, the page becomes a single reading column, and the drawer removes the page from focus while open.
- Below 460px, candidate rows, JSON type, receipts, and tables compress without hiding evidence. Tables retain horizontal scrolling rather than collapsing meaning.

The site was visually checked at 1440×1000 and 390×844. Final QA captures are retained locally under `output/playwright/`.

## Accessibility

- Interactive targets are at least 44px where practical, with a 3px coral focus ring.
- Native buttons, links, tabs, headings, tables, figures, and grid cells preserve semantics.
- Region letters and written placements duplicate color meaning.
- Closed mobile navigation is not focusable; focus enters the close control and returns to the menu opener.
- `prefers-reduced-motion` removes smooth scrolling and transition duration.
- JSON and table content remain selectable, horizontally scrollable, and available at 320px width.
- Light and dark themes retain the same semantic hierarchy.

## Evidence semantics

Model-visible input, provider-visible output, evaluator-derived grade, and transport metadata are separate panels. Success, error, timeout, missing/not-run, and mixed/review states always have visible text; color is secondary. Missing data remains missing rather than being converted to a zero or inferred response.

An `excluded` flag is a visibility annotation, not deletion or a replacement status. Excluded request-level failures remain in the manifest, search, direct routes, and receipts with a visible reason. The atlas omits them only from the initial browse view; an explicit control and any active search can reveal them.

Every request record also has an assessment outcome. `success` means a completed request whose saved primary grade passed; `model_failure` means a completed request whose primary grade failed; `request_failure` means no model answer was available to grade; `not_run` and `ungraded` remain explicit. The atlas uses text tags and an outcome filter, never color alone. Error receipts begin with a compact interpretation block above the raw panels, including what failed, what the error does and does not mean, and what happened next.

The public bundle excludes credentials, private answer keys, encrypted reasoning, and unrelated repository files. Inline image data is decoded to a SHA-256-addressed asset while its hash, media type, and byte count remain in the request.

## Deliberate constraints

The Local Qwen chapter (`#/local-qwen`) extends this same reading layout. Study
identity appears in receipt routes because call names recur across experiments.
The overview matrix and aligned outcome/completion bars retain planned and
recorded denominators; model size, token budget, decoding and stopping policy are
separate cohorts. Mint marks strict success, gold marks formatting recovery,
outlined neutral marks token caps, and outlined gold marks a client stop. Text
labels and counts carry every meaning without color. Hosted-cost bars share a
zero-based USD scale; signed arrows and values distinguish increases and savings.
Missing canceled-stream usage has no fabricated zero-cost bar. Controls expose
the selected study, size scope, tariff, editable USD/million rates and explicit
rescue inclusion. Native tables retain the book's scrolling behavior. Partial
studies with unmatched recorded boards do not receive a comparative cost claim.

- The repository solver is explanatory context, not a timed competitor.
- Jev candidate recognition is never presented as autonomous puzzle construction.
- The three original boards and six held-out boards do not support a general intelligence ranking. The October replay reuses the original three images and adds neither new boards nor independent distribution coverage.
- The website is a read-only static GitHub Pages publication. Analytics, live model calls, and external runtime data fetching remain deferred.
