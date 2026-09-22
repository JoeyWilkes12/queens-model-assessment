# Queens assessment website quality check

## Table of contents

- [Scope](#scope)
- [Build and dependency checks](#build-and-dependency-checks)
- [Evidence checks](#evidence-checks)
- [Browser checks](#browser-checks)
- [Visual checks](#visual-checks)
- [Independent finish review](#independent-finish-review)
- [Known boundaries](#known-boundaries)

## Scope

This check covers the Vite/React technical book in this directory and the equivalent static build published through GitHub Pages. It does not cover live model calls or unrelated dirty files elsewhere in the Queens repository.

## Build and dependency checks

| Check | Result |
|---|---|
| `npm run build` | Pass; TypeScript and Vite 8.3.0 production build completed |
| `npm audit --json` | Pass; 0 known vulnerabilities |
| Impeccable implementation detector | Pass; empty finding set `[]` |
| `git diff --check` | Pass |

The build regenerates the evidence bundle through `prebuild`; local development does the same through `predev`.

## Evidence checks

| Measure | Result |
|---|---:|
| Studies | 5 |
| Requests | 157 |
| Visible responses | 154 |
| Metadata records | 155 |
| Per-run grades | 150 |
| Full grade sources | 12 |
| Decoded content-addressed input images | 3 |
| Excluded from the default atlas | 6 request-level rejections |
| Assessment outcomes | 71 success, 74 model failure, 8 request/transport failure, 2 not run, 2 ungraded |
| Statuses | 147 success, 7 error, 2 not run, 1 timeout/transport failure |

A recursive generated-tree scan found no credential-like keys, encrypted reasoning fields, absolute user paths, or token patterns. Each decoded image filename was verified against its SHA-256 bytes.

Two consecutive generations produced the same 633-file bundle digest: `3663c54fbfd0602cd52a605fdbe2e819c6dc201f8419901846bca3c1bc408858`.

## Browser checks

Playwright CLI exercised all nine book routes plus a representative evidence detail. Every route returned its expected title and H1 and reported no document-level horizontal overflow at 1440×1000. A fresh session recorded 0 console errors and 0 warnings.

The built `dist/` output was also served with `vite preview` on localhost. A direct hash-route evidence URL loaded its sanitized JSON and content-addressed board image with 0 console errors and 0 warnings.

Functional checks passed for:

- sidebar and mobile drawer navigation;
- local contents navigation without corrupting hash routes;
- evidence search by model and board;
- excluded evidence hidden from the default browse view, discoverable by search, and available through the explicit “Show excluded” control;
- direct excluded-record routes with a visible exclusion flag and request-level reason;
- success, model-failure, request-failure, not-run, and ungraded outcome filtering, including the combined non-success view;
- top-of-receipt error summaries for all seven HTTP error records, with the 520 record distinguished from its completed retry;
- study filtering and progressive disclosure from 30 to 60 records;
- exact evidence deep links, including the 12-option Jev request;
- content-addressed input image rendering;
- request, visible output, deterministic grade, and metadata panels;
- copy/download controls;
- columns-only versus explicit-region candidate views;
- light/dark theme switching;
- modal drawer focus isolation and return.

## Visual checks

Two visual-review rounds covered the executive summary, candidate lens, representative evidence detail, mobile drawer, and both mobile themes. Final local captures:

- `output/playwright/desktop-summary-final.png`
- `output/playwright/desktop-candidate-lens-final.png`
- `output/playwright/desktop-evidence-detail-final.png`
- `output/playwright/mobile-summary-final.png`
- `output/playwright/mobile-summary-dark-final.png`

## Independent finish review

A fresh GPT-5.6 Sol High reviewer inspected the product contract, implementation, QA record, and final desktop/mobile captures without editing the site. Verdict: **PASS**, with no material blockers. The reviewer specifically confirmed the book-like localhost brief, authorized editorial design language, full sanitized evidence treatment, exact Jev-request links, responsive hierarchy, keyboard handling, themes, and evidence readability.

## Known boundaries

- The public build is deployed from committed source in the dedicated `queens-model-assessment` repository.
- Hash routing and relative asset paths use the `/queens-model-assessment/` GitHub Pages base path.
- The atlas is a sanitized evidence publication, not an unfiltered forensic export.
- Large JSON receipts prioritize fidelity and selection over syntax highlighting or virtualized rendering.
