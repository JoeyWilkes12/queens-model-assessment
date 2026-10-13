# Queens assessment website quality check

## Table of contents

- [Scope](#scope)
- [October 13 SubQ verification](#october-13-subq-verification)
- [October 1 verification](#october-1-verification)
- [Build and dependency checks](#build-and-dependency-checks)
- [Evidence checks](#evidence-checks)
- [Browser checks](#browser-checks)
- [Visual checks](#visual-checks)
- [Independent finish review](#independent-finish-review)
- [Known boundaries](#known-boundaries)

## Scope

This check covers the Vite/React technical book in this directory and the equivalent static build published through GitHub Pages. It does not cover live model calls or unrelated dirty files elsewhere in the Queens repository.

The October 13 section records the SubQ verification. Earlier sections retain historical QA snapshots.

## October 13 SubQ verification

The completed campaign retains 739 exact replay API attempts (736 HTTP 200 and three integration rejections), fifteen local compatibility skips, 36 adapted part calls covering eighteen logical tasks, and ninety fresh adaptive attempts using 325 API calls. The public atlas now contains 1,949 records across eleven studies. Every manifest file reference resolves locally. The independent path audit reconstructs all ninety attempts and verifies every menu, forced transition, chosen cell, stopping reason, and receipt hash.

Nineteen offline harness tests, the existing board-view and trajectory-view checks, and the failure-comparison checks pass. The failure-comparison test preserves its original historical cohort assertion while reporting added SubQ coverage separately. TypeScript and the Vite production build pass. The compatible source-map-js patch removes the vulnerability reported by npm; the final audit reports zero known vulnerabilities.

Desktop (1440×1000) and emulated phone (390×844) screenshots were visually inspected in a project-only Playwright session. The SubQ chapter loads its real replay, trajectory, and adapted summaries without substituted scores; a SubQ atlas receipt displays its saved board and exact Choice. No document overflow or PDF links were observed. Localhost and private HTTP Tailscale URLs return HTTP 200 from this Mac. These checks are not an actual phone-browser test or a GitHub Pages deployment test. The local preview remains available for review.

Runtime containment checks pass: nonroot worker, no external active network interface or route, blocked direct internet and metadata-IP connections, read-only inputs/socket directory/root, no host home or Docker socket, dropped capabilities, and no-new-privileges. The trusted broker has normal outbound networking and enforces a fixed SubQ HTTPS destination in code. This uses Docker Engine containment, not the separate Docker Sandboxes sbx product or a firewall on the broker.

The API key was loaded programmatically into broker stdin without exposing its value or fragments to model context, command arguments, environment variables, receipts, or logs. `.env` is ignored and untracked. Provider response filtering excludes arbitrary strings; retained response hashes cover filtered JSON. No llms.txt, provider SDK, response code execution, model judge, or OpenAI inference was used.

The final shared ledger estimates $0.08695505 in token charges and conservatively reserves $0.05898240 for unmetered failures, totaling $0.14593745 accounted against the $5 authorization. This is not a provider-confirmed bill. Per-study snapshots include prior phases and must not be summed.

See the [full report](public/evidence/subq-REPORT.md), [path audit](public/evidence/subq-trajectory-audit.json), [campaign ledger](public/evidence/subq-budget.json), and [containment reference](docs/subq-provider.md).

## October 1 verification

The revised source passes TypeScript and Vite production builds. The generated bundle contains seven studies, 798 frozen requests, 777 responses, 778 metadata records, 772 per-run grades, 14 grade sources, and three content-addressed PNGs. Twenty not-run records remain explicitly unexecuted, including 18 October candidates. Existing historical evidence is retained.

All twelve routes loaded with their expected title and H1 at 1440×1000, no document-level horizontal overflow, and no outstanding loading text. The fresh local QA browser recorded zero console errors and zero warnings. The October chapter displayed 27 original attempts, 13 strict passes, 21 mathematically valid written answers, and separate image/text billing. A chapter receipt link opened a failed GPT-4.1 response with its original 768×768 image, prompt, output, grade, and metadata. The Gemini text-matrix receipt loaded all four record panels without an image. The chapter and diagnostic receipt had no document overflow at 390×844.

Root visually inspected the desktop chapter, mobile chapter, and desktop diagnostic receipt. Captures live under the task-owned `output/playwright/` directory. A misleading generic receipt sentence was corrected: a failed assessment contract does not necessarily mean a mathematically wrong answer. October first-failure labels now distinguish strict formatting from extracted rule failures.

The offline experiment auditor, prepared by GPT-6 Luna Xhigh and repaired/reviewed by GPT-6.1 Sol Xhigh, independently verifies original input hashes, uniqueness, grading, schedule, route controls and billing. Its current audit passes for 47 scheduled / 29 attempted requests. The final public-bundle scan and publication readback are recorded in the October study's audit artifacts; do not infer remote browser testing from these local checks.

## Build and dependency checks

| Check | Result |
|---|---|
| `npm run build` | Pass; TypeScript and Vite 8.3.0 production build completed |
| `npm audit --json` | Pass; 0 known vulnerabilities |
| Impeccable implementation detector | Pass; empty finding set `[]` |
| `git diff --check` | Pass |

The build recorded above regenerated the then-current evidence bundle through `prebuild`; local development did the same through `predev`. This historical result does not establish that the current source builds successfully.

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

A recursive scan of that historical generated tree found no credential-like keys, encrypted reasoning fields, absolute user paths, or token patterns. Each decoded image filename was verified against its SHA-256 bytes. Re-run the scan against the current bundle, especially the new summary, report, schedule amendment, and review-note exports, before publication.

Two consecutive generations produced the same 633-file bundle digest: `3663c54fbfd0602cd52a605fdbe2e819c6dc201f8419901846bca3c1bc408858`.

## Browser checks

Playwright CLI exercised all nine routes in that earlier edition plus a representative evidence detail. Every route returned its expected title and H1 and reported no document-level horizontal overflow at 1440×1000. A fresh session recorded 0 console errors and 0 warnings. The current route set and the October evidence detail were not covered by this historical check.

The built `dist/` output was also served with `vite preview` on localhost. A direct hash-route evidence URL loaded its sanitized JSON and content-addressed board image with 0 console errors and 0 warnings.

Functional checks passed for:

- sidebar and mobile drawer navigation;
- local contents navigation without corrupting hash routes;
- evidence search by model and board;
- excluded evidence hidden from the default browse view, discoverable by search, and available through the explicit “Show excluded” control;
- direct excluded-record routes with a visible exclusion flag and request-level reason;
- success, model-failure, request-failure, not-run, and ungraded outcome filtering, including the combined non-success view;
- model-author/provider and exact-model-version filtering, including combined filters with study and assessment outcome;
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
