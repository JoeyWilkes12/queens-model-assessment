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

### Playback and receipt-chain follow-up

SubQ now uses the same interactive board-state viewer as Jev for all ninety saved attempts. Partition/trace validation, missing-data fallbacks, invalid-attempt links, and provider-specific frame receipt URLs prevent a missing or mismatched game from being silently substituted. Receipt detail navigation is generated from exact step references across both studies: 180 attempts and 719 calls, including explicit forced-decision gaps and disabled end-of-attempt navigation.

`npm run receipts:verify` independently checks all 1,674 frames (939 Jev and 735 SubQ), every previous/next link, source hashes, saved coordinates, receipt choices, and evaluator outcomes. All 1,230 unrelated atlas records reject chain membership; 1,531 public evidence files remain unchanged. The existing trajectory and board-view verification also passes. This follow-up makes no inference calls and changes no assessment result or budget.

Browser checks exercise the user's exact SubQ receipt through its three-request chain, previous/next boundaries, linked attempt playback, manual stepping and scrubbing, timed play/pause, a failed terminal state and a solved terminal state. Reduced motion disables autoplay while retaining manual stepping. The Jev chain remains correct, unknown SubQ attempts show an explicit unavailable state, and standalone replays have no chain. Desktop and 390×844 screenshots were inspected; phone-size layout has no document overflow. Private Tailscale HTTP access was tested from this Mac, not an actual phone browser.

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

## Local Ollama pilot — 28 October 2026

The completed local study contains 24 receipts: 12 baseline and 12 paired Caveman calls, last completed at 18:47:34 UTC. All returned HTTP 200; 16 ended at the chosen 12,288-token budget with `finish_reason=length` and no final-answer content. These outcomes are presented separately from invalid completed placements and transport errors. The site labels the experiment exploratory, n=4 boards per size and one run per condition, and states the 853 versus 1,984 input-token, treatment-order, prefix-cache and host-pressure confounds.

Validation for this addition:

- `npm run ollama:test`: 24 offline tests cover deterministic grading, format extraction, accounting, runtime drift, evidence tampering, numeric host collection, journal privacy, special-file and busy-lock rejection, and persistent timeout barriers across both treatments.
- `npm run ollama:verify`: all 24 receipts and the full frozen-input, hash, grade and summary audit pass. All 166 protected historical evidence files, including the original plan and summary, retain their pre-review byte hashes. The runtime audit has a separate offline completion addendum.
- `npm run evidence:check-public` and `npm run build` verify the publication boundary and static build. The existing large-chunk build warning is not a new failure.
- Final desktop 1440×1000 and mobile 390×844 captures are in ignored `output/playwright/ollama-review/`. The mobile document width is 390px, matching the viewport; shared tables retain native scrolling. The rendered page exposes all 24 completions, the 16 budget limits, n=4 and the input-token confound.
- Independent local Codex review: ship after resolving persistent timeout continuation and blocking journal-path edge cases. The user explicitly waived cross-family review for this PR. No external reviewer received implementation content.

Future studies require a distinct identity/output directory, default to 16k context and unload-after-response, and can capture numeric host conditions or opt into the Grafana journal. Those changes were tested with mocks and temporary files, not fresh inference. The reported historical memory/swap observations are retrospective aggregate evidence, not fabricated per-call telemetry. No new Ollama requests, live journal writes, model unloads, server configuration changes or monitoring-service changes were made during completion review. A separate workflow owns the endpoint until at least 29 October 2026 at 09:00 MDT.

The persistent port4598 preview stays available for PR review. Its stop/start lifecycle and preservation of the other Serve ports were verified earlier; localhost and the actual private HTTP tailnet URL were tested from this Mac, including development WebSockets. No actual phone-browser test is claimed. Hosted Langfuse delivery remains unverified; coding-agent hooks and project/worktree virtual tags are distinct from standalone Ollama receipts.


## Caveman receipt chains and summary — 28 October 2026

The dedicated `#/caveman-summary` chapter reports the observed 4b-only pilot: strict 1/12 versus 5/12, diagnostic valid 3/12 versus 5/12, and capped 9/12 versus 7/12. It shows paired transitions, the baseline-only valid `panel-7-01` counterexample, and the higher combined token total with Caveman (156,608 versus 151,751). The n=4-per-size, single-run, longer-input, fixed-order, cache and host-condition limits remain explicit; no causal or general saving claim is made.

All 24 readable receipt routes link reciprocally by board to the other condition and to a shared configuration page. The deterministic `comparisons.json` index checks exact user messages/image bytes, model identities/digests, full requested controls, reviewed system text and canonical request/response hashes against frozen evidence. All 166 original protected files retain their original byte hashes.

- `npm run ollama:test`: 37 offline tests pass, including 13 comparison mutation tests.
- `npm run ollama:verify`: all 24 receipts and 12 pair bindings pass without inference or writes.
- Public evidence scrub, TypeScript/static build and whitespace checks pass.
- Desktop 1440×1000 and mobile 390×844 inspection covers the summary and receipt chain. All 24 receipt routes resolve with correct current/counterpart links; switching from an extracted answer to a capped response removes the previous answer. Unknown receipt and missing-index states have explicit recovery links. Light/dark rendering and native table regions are retained. Captures are in ignored `output/playwright/ollama-review/caveman-*.png`.
- The standalone receipt/configuration pages were given the book's reading margins after the first visual pass; final captures verify the correction.
- Independent local Codex review of code, saved evidence and five screenshots: **Ship**, no material findings. The existing private HTTP preview serves the new summary and all twelve pair bindings; its HMR WebSocket was observed through the tailnet origin. These tests ran on the Mac, not a phone.

No requests to Ollama, model unloads, monitoring/journal writes or inference-service configuration changes were made. The existing launchd preview remains available for PR review.


## Caveman cost tradeoff and visuals — 28 October 2026

The follow-up uses the original 24 saved 4b receipts: +13,572 input tokens, −8,715 generated tokens, and +4,857 combined tokens. The uncached aggregate break-even output/input price ratio is 1.5573×. A dated, allowlisted OpenRouter API snapshot provides three illustrative Qwen tariffs; no exact hosted 4b listing was found. The site explicitly distinguishes repriced local counts from actual hosted performance or invoices, discloses the API/model-page quote difference, and keeps the local $0 provider fee separate from unmeasured power/hardware costs. Full-catalog nonretention is documented.

- Outcome bars preserve strict, extraction-only and capped outcomes on a four-request scale. Token bars share a zero-based count scale. Charge-contribution bars share a signed scale and aligned zero reference; geometry checks measured zero-pixel offsets for all three rows. Text, signed values and SVG arrows duplicate color cues.
- `npm run ollama:test`: all 37 offline tests pass. `npm run ollama:verify` checks all 24 original receipts, 12 pairs and the new pure cost verification. Cost checks include per-size reversals, thinking counted once, zero rates and rejection of missing/nonfinite/negative usage or tariffs. Public evidence scrub and the production build pass; the existing large-bundle advisory remains.
- Browser controls reproduce 9B-reference +0.35%, 27B-reference −5.16%, Flash-reference −3.69%, equal-rate +3.20%, and double-output-rate −1.32% totals. All refer to fixed recorded 4b usage. Nine-by-nine retains the no-output-reduction warning. Free rates retain an undefined baseline percentage; invalid rates and a missing pricing snapshot have explicit unavailable states. Observed outcome charts remain visible when pricing is absent.
- Desktop 1440×1000 and mobile 390×844 captures cover outcomes, tokens and the cost explorer in light/dark themes. Body widths match 390px and 320px viewports. Final captures use instant scrolling with asserted geometry to avoid smooth-scroll screenshot races; corrected files are retained in ignored `output/playwright/ollama-review/cost-*-final.png`.
- Independent local Codex review checked source, all raw receipt token counts, offline math/build and seven corrected final screenshots: **Ship**, no material findings. Parent-agent interaction and private HTTP tailnet checks passed from the Mac; no phone-browser test is claimed.

All 166 protected historical evidence files remain byte-identical. No Ollama requests, model changes, monitoring/journal writes or inference-service changes were made; tonight's separate assessment workflow remains untouched. The persistent preview stays available for review.

## Local Qwen expansion — 2026-10-30

- Expanded PR 8's original 4B cost visuals with a lazy-loaded Local Qwen chapter,
  immutable evidence imports, paired receipt routes, output-length charts,
  study-specific hosted-price scenarios, rescue accounting and loop-stop methods.
- Snapshot `2026-10-30-overnight`: eight cohorts, 168 recorded primary calls,
  1,273 hashed artifacts; prepared 9B sampling round 2 remains pending. All
  original `public/evidence/ollama/` files match the prior committed pilot.
- All 51 Python tests pass, including 14 importer mutation tests. Original
  24-receipt/12-pair audit, new snapshot verification, pure finance checks and
  independent per-study integration sums pass. Public scrub reports zero private
  fields. TypeScript and production build pass; the existing main-bundle size
  advisory remains. The new chapter is a separate lazy-loaded chunk.
- Browser QA covers all eight study selections, 24-row ledgers, size filtering,
  tariff/custom/free/invalid prices, full-input rescue accounting, unknown canceled
  stream costs, prepared studies, reciprocal and cross-study receipt routes,
  study backlinks, missing receipts, missing pricing/index states and unmatched
  partial-arm suppression. No JavaScript errors or inference requests observed.
- Desktop 1440px and mobile 390px/320px have no document overflow. Independent
  local Codex review inspected all seven desktop/mobile/light/dark captures and
  returned Ship. It caught a future partial-arm comparison issue; matching unique
  recorded-board sets now gate deltas, headlines and break-even ratios, with
  regression tests and a browser fixture confirming the correction.
- Existing local preview and private HTTP mapping were reused. Local and private
  preview were tested from this Mac, with the Vite WebSocket observed. No physical
  phone-browser test is claimed. Review captures stay in ignored output files.
- Eleven client-canceled streams lack final usage. Their affected total costs
  remain unknown. The detector was calibrated on prior traces; no independent
  false-positive rate or isolated stopping-policy savings claim is made. Shared
  policy within Caveman arms, co-interventions across budgets, post-treatment
  selection and missing call-time Git revision metadata are explicitly described.
- No model requests, benchmark changes, service changes, merge or production
  deployment were performed by this work.

## October 31 evidence refresh

- Captured a new immutable `2026-10-31-overnight` snapshot: 11 separately labeled
  conditions, 214 assessment requests plus 11 outcome-selected audit reruns,
  1,708 hashed artifacts. 9B sampling round 2 is complete; 27B round 2 is 22/24
  with both panel-9-34 arms pending. Earlier snapshot, pilot and tariffs unchanged.
- Extended schema 2 to retain selected audit populations and reciprocal source
  links. Audits contain six and five selected calls, not 24 implied failures or
  pending requests. All eleven full observed thinking prefixes match; one no-stop
  9B rerun returns strict correctness at 29,094 tokens. Original grades and null
  canceled-stream usage stay intact. Audits receive separate workload estimates
  and no baseline/Caveman treatment contrast.
- All 57 Python tests pass, including 20 importer tests. Current and retained
  snapshot checks, independent financial sums, privacy scrub, TypeScript/build and
  diff checks pass. The main-bundle size advisory is unchanged.
- Browser checks pass for all eleven selections, partial recorded scope, distinct
  audit populations/costs, unsupported size exclusion, invalid prices, rescue
  costs, audit/source/backlink navigation and 320/390px layout. No page errors or
  inference requests observed. Private HTTP preview and WebSocket were tested
  from this Mac; no phone-browser test is claimed.
- Added a dated independent scientific review and proposed assessments. Proposals
  are not new schedules or inference: finish frozen sampling, evaluate fresh
  boards, separate formatting/length effects, validate a frozen shadow detector,
  and measure bounded fresh-seed retry costs. The 27B host context limit remains
  binding. No benchmark or service settings were changed.
