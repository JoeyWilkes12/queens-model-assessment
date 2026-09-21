# Queens assessment book design system

## Table of contents

- [Design intent](#design-intent)
- [Source of truth](#source-of-truth)
- [Information architecture](#information-architecture)
- [Visual language](#visual-language)
- [Core components](#core-components)
- [Responsive behavior](#responsive-behavior)
- [Accessibility](#accessibility)
- [Evidence semantics](#evidence-semantics)
- [Deliberate constraints](#deliberate-constraints)

## Design intent

The site is an evidence-first technical book for AI engineers. It leads with the assessment finding, teaches regional Queens, separates generative solving from typed decision selection, and then lets a reader trace every claim into sanitized source receipts. It should feel like a field guide and laboratory notebook rather than a marketing dashboard.

## Source of truth

The visual authority is the authorized [AI Agent Skills Resource Library design system](</Users/joeywilkes/Desktop/Scripts & Code/AI Agent Skills/agent-skills-resource-library/DESIGN.md>). The implementation adapts its guide-reading model, trust receipt, square geometry, and evidence language to the [expanded Queens report](../REPORT.md).

## Information architecture

The persistent book rail groups nine routes into four chapters:

1. Read first: executive summary and assessment receipt.
2. The board: Queens rules and protocol/results.
3. The Jev question: primer, candidate engineering, and scale/primitives.
4. Receipts: searchable evidence atlas and methods/sources.

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
- **Evidence atlas:** searchable, study-filtered, progressively disclosed request and grade-source index.
- **Evidence receipt:** content-addressed input attachment, exact sanitized request, visible output, deterministic grade, metadata, copy, and download.
- **Callouts and tables:** explicit evidence, caution, and boundary treatments with native horizontal table scrolling.

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

The public bundle excludes credentials, private answer keys, encrypted reasoning, and unrelated repository files. Inline image data is decoded to a SHA-256-addressed asset while its hash, media type, and byte count remain in the request.

## Deliberate constraints

- The repository solver is explanatory context, not a timed competitor.
- Jev candidate recognition is never presented as autonomous puzzle construction.
- The three original boards and six held-out boards do not support a general intelligence ranking.
- The website is localhost-only in this phase. Deployment, analytics, and external data fetching are deferred.

