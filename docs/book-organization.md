# Book organization

Proposed and implemented 2 November 2026 in PR #13, after PR #11. The site's navigation, Contents page, breadcrumb and tab titles are all generated from one tree in [`src/bookNav.ts`](../src/bookNav.ts).

## Contents

- [Goals](#goals)
- [Before and after](#before-and-after)
- [Why these parts](#why-these-parts)
- [Sidebar behavior](#sidebar-behavior)
- [Breadcrumb](#breadcrumb)
- [Adding a page](#adding-a-page)
- [Open questions](#open-questions)

## Goals

- Let a reader find any page within two clicks, without a 22-item flat list.
- Group pages by what was tested (puzzle, frontier models, local models, decision models), not by when the work was done.
- Make depth visible: a page that belongs to another page sits under it.
- Show the reader where they are on every page, with a way back up.
- Keep every existing URL working. No route was renamed or removed.

## Before and after

The old rail listed 21 pages in seven groups. Some placements reflected history more than content: "The board" mixed the rules, the solver and the frontier-model results, and "Model generations" mixed hosted and local models.

| Part | Pages (nested pages indented with →) |
| --- | --- |
| Start here | Executive summary · Assessment receipt · **Contents** (new) |
| Part I · The puzzle | Queens rules · How Z3 solves Queens → its 12 sections |
| Part II · Frontier language models | Protocol & results · One queen at a time · Earlier generations |
| Part III · Local open-weight models | Local open-weight assessments → Original 4B pilot (→ Pilot configuration), Caveman comparison |
| Part IV · Decision models | Decision models vs the index (→ OpenAI Decisions plan) · Jev primer → Candidate engineering, Scale & primitives, Jev trajectories · SubQ Snap replay (→ New-board panel) · Greedy rule baseline |
| Part V · Evidence | Evidence atlas · Board receipts |
| Part VI · Methods | Methods & sources · Methods critique |
| About | About this book · **Changelog** (new) |

## Why these parts

- **Start here** is front matter: the answer, the claim's scope and the map.
- **Part I** teaches the puzzle and how a solver proves a board has one answer, before any model is measured.
- **Parts II–IV** follow the three kinds of system that were tested. Each part opens with its protocol or overview page; follow-up studies nest under it.
- **Parts V and VI** are reference material, read on demand: receipts, then definitions and critique.
- **About** is back matter: purpose, provenance, sharing and the changelog. The foundation report SHA moved from the sidebar footer to the Changelog's Foundation section.

## Sidebar behavior

- Parts and parent pages are disclosures. They start collapsed, except along the path to the page being read, which opens automatically so the current page is always visible.
- A disclosure the reader opens stays open while they move around the book. Navigating never collapses anything.
- The page name is a link and the chevron beside it is a separate button, so a parent page can be opened without expanding it.
- In-page sections (How Z3 solves Queens chapters, the OpenAI Decisions plan) are listed as children and deep-link with the existing `#/page/section` routes.
- Phones and short landscape screens (≤1020px wide and ≤500px tall) use the drawer, so content keeps the full width.

## Breadcrumb

The hero trail is generated from the same tree: `Queens assessment / Part / parent page(s) / current page`. Every level above the current page is a link:

- **Queens assessment** opens the Contents page.
- **The part** opens Contents scrolled to that part (`#/contents/<part-id>`).
- **Parent pages** open the parent.
- **The up arrow** goes one level up, like a back button that follows the book's structure rather than browser history.

Routes deeper than the tree are named from their path: an atlas record, a board, `Study <id>` and `Receipt <id>`. A local receipt's trail links back to its study view. On phones, levels between the book and the parent page fold behind an "…" button.

## Adding a page

1. Add the route in `App.tsx` as before.
2. Add one entry to `BOOK_PARTS` in `src/bookNav.ts`, under its part or parent page. Use `anchor: true` for an in-page section.
3. Add a changelog entry in `src/changelog.ts` and run `npm run changelog:verify`.

## Open questions

- **Part landing pages.** Part crumbs currently open the Contents page at that part. Short introductions per part could replace this later.
- **Local study children.** The local open-weight studies (`#/local-qwen/study/<id>`) are data-driven. Listing each study in the sidebar would need the snapshot loaded at startup, so they stay reachable from the chapter and breadcrumb only.
- **Long single pages.** The Executive Summary and Earlier generations pages are long. Splitting them into child pages would fit this structure; it is not part of this change.
