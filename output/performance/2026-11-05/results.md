# Matched re-measurement and review response (PR #14)

November 5, 2026. This follows the [November 2 results](../2026-11-02/implementation/results.md) and responds to an independent review of PR #14 (GPT 6.1 Sol Ultra, posted by Joey). It is a local lab comparison of two production builds on one host. It is not a public-site or field measurement.

## Contents

- [Review findings and responses](#review-findings-and-responses)
- [Conditions](#conditions)
- [Matched results](#matched-results)
- [Why another host saw different timings](#why-another-host-saw-different-timings)
- [What the evidence supports](#what-the-evidence-supports)
- [Files and reproduction](#files-and-reproduction)

## Review findings and responses

| Review item | Response |
|---|---|
| **1. Printing regressed.** Printing the summary before scrolling showed "Loading saved attempts…", because a browser does not wait for fetches started from `beforeprint`. | Fixed. **Ctrl/⌘+P** runs a print preparer while the replays are pending: it loads the evidence, renders it, then opens the dialog (`src/printPreparation.ts`, capped at 8 s). **Menu print** cannot be delayed, so the pending panel prints a defined text fallback: each curated attempt's title, takeaway and link. The ineffective `beforeprint` trigger is removed. `npm run test:print` checks menu print without scrolling, Ctrl+P before load and Ctrl+P after load against the built site, with the replay JSON delayed by one second, using the PDF's text. The review's reproduction now prints "SubQ Snap completes board 5-2" again. The November 2 claim about printing is corrected in place. |
| **2. Benchmarks should be enforceable and reproducible.** | Added `ab-lab.cjs`:<ul><li>Invalid samples make the run exit 1; they are kept in the raw output and excluded from medians.</li><li>It records build SHAs, Chromium, Playwright, Node and CPU, the endpoint and the cache policy.</li><li>It warms the server with one unrecorded load per build and route, and alternates A/B order every round.</li><li>It measures normal caching and CDP cache-disabled separately.</li></ul>The divergent timing was traced (`trace-summary.cjs`, below) rather than attributed. The November 2 samples and harness are unchanged as a dated record. |
| **3. The layout metric is a sum, not CLS.** | Both are now reported: the captured sum of non-input shifts, and session-window CLS (the largest burst of shifts less than 1 s apart, at most 5 s long). They are equal in every November 2 sample and every November 5 sample, so the zero-shift result stands. The November 2 tables now say "captured sum". Neither is a field Core Web Vitals value. |
| **4. The hook lifecycle is untested.** | Added `npm run test:shared-json-hook`. It bundles a page with the project's Vite and React 18 and runs five scenarios in Chromium with a scripted `fetch`:<ul><li>StrictMode readers share one fetch and one parsed object.</li><li>Unmounting a reader leaves its peer's load intact.</li><li>After a URL change, a late reply for the old URL never shows.</li><li>One reader's retry recovers every mounted peer.</li><li>An invalid payload is an error and is refetched.</li></ul>Removing the peer notification makes the retry scenario fail. |

## Conditions

- **Builds:**
  - Before: `aa9c3fd6`, the PR #13 head. Its application code is identical to `main` at `96be88d3`, which added only `AGENTS.md`, `CLAUDE.md` and a changelog entry.
  - After: `94f35f85`, which includes the print fix.
- **Host:** Intel Xeon @ 2.30 GHz, 4 vCPUs, Node v22.23.4, Chromium 153.0.8010.12, Playwright 1.63.0.
- **Server:** `../2026-11-02/implementation/gzip-static-server.cjs`, a local gzip (level 6) static server sending `max-age=600`.
- **Profiles:** the same as November 2.
  - Desktop: 1440×1000, 1× CPU.
  - Mobile: 390×844 touch, 4× CPU, 1.6 Mbps down, 0.75 Mbps up, 150 ms latency.
- **Samples:** 72, all valid: 3 rounds × 2 builds × 3 routes × 2 profiles × 2 cache modes. Medians are shown with min–max ranges. Raw data: [`ab-results.json`](ab-results.json).

## Matched results

### Mobile, slow 4G (median, min–max of 3)

| Route | Cache | Primary ready, before → after | LCP, before → after | Layout shift (sum = session CLS), before → after | Transfer, before → after |
|---|---|---|---|---|---|
| Summary | normal | 2.03 s (2.03–2.10) → **1.60 s** (1.54–1.62) | 1.62 → 1.40 s | 0 → 0 | 287 → **178 kB** |
| Summary | disabled | 2.00 s (1.96–2.12) → **1.57 s** (1.57–1.59) | 1.57 → 1.34 s | 0 → 0 | 305 → **178 kB** |
| Local assessments | normal | 2.72 s (2.65–2.74) → **2.44 s** (2.33–2.45) | 2.45 → **1.25 s** | **0.268 → 0** | 279 → **223 kB** |
| Local assessments | disabled | 2.77 s (2.65–2.79) → **2.42 s** (2.38–2.50) | 2.49 → **1.26 s** | **0.268 → 0** | 280 → **223 kB** |
| Atlas | normal | 3.96 s (3.95–4.06) → **3.70 s** (3.68–3.70) | 1.57 → 1.31 s | 0.013 → 0.013 | 572 → **515 kB** |
| Atlas | disabled | 3.97 s (3.96–3.99) → **3.71 s** (3.66–3.84) | 1.57 → 1.30 s | 0.013 → 0.013 | 572 → **515 kB** |

### Desktop, no throttling

Primary readiness is 120–280 ms in both builds. The differences (for example, summary 147 → 143 ms with normal caching, 165 → 119 ms with the cache disabled) are within sample noise. The desktop results that hold are the smaller transfers, the same as mobile, and the local chapter's layout shift, 0.089 → 0 in both cache modes.

### Bundle

The production entry JS is 182.3 kB gzip (694 kB raw) in the before build and 127.7 kB gzip (409 kB raw) in the after build. The after build includes the print preparation and the shared-loader wiring for the replay files.

## Why another host saw different timings

The review measured 3–5× longer absolute times than this host, and its readiness medians moved in both directions. To see where time goes, `trace-summary.cjs` traced the summary's critical path under mobile emulation with normal caching, three alternated rounds per build, at the standard 4× CPU slowdown and at 12× as a proxy for a slower or busier CPU.

| CPU | Build | Entry JS loaded | `leaderboard.json` loaded | Leaderboard ready | Main thread busy until ready | Requests before ready |
|---|---|---|---|---|---|---|
| 4× | before | 1.36 s | 1.94 s | 2.04 s (1.99–2.09) | 526 ms | 6 |
| 4× | after | 1.07 s | 1.43 s | **1.56 s** (1.55–1.58) | 494 ms | 4 |
| 12× | before | 1.40 s | 2.61 s | 3.07 s (2.82–3.22) | 1,739 ms | 16 |
| 12× | after | 1.11 s | 1.85 s | **2.94 s** (2.78–2.98) | 2,075 ms | 4 |

- **At 4×,** the after build is ahead at every milestone. A smaller entry bundle means the leaderboard data is requested and received about 0.5 s sooner.
- **At 12×,** the after build still receives the leaderboard data about 0.75 s sooner. But main-thread work after that point takes most of the lead, and the ready ranges overlap.
- **Not the cause:** making shared-JSON renders a low-priority transition did not change this (2.40–2.65 s against 2.48–2.64 s), so the below-the-fold scoreboard is not the cause, and that change was not kept. The remaining work is not isolated.

So on a CPU-bound host, the summary's readiness gain can shrink to noise. This matches the review's observation, and it is why no general latency claim is made below.

## What the evidence supports

- **Supported on two hosts:**
  - Entry JS is about 30% smaller (gzip).
  - Initial transfer is 38–42% smaller on the summary, 20–21% on the local chapter and 10% on the atlas.
  - The local chapter's loading layout shift falls from 0.27 to 0 on mobile and from 0.089 to 0 on desktop, in both cache modes.
  - Duplicate shared-JSON requests are gone.
- **Supported on this host only:** faster primary readiness on all three mobile routes, with non-overlapping ranges in both cache modes, and an earlier local-chapter heading paint (LCP 2.45 → 1.25 s).
- **Not claimed:** field Core Web Vitals, INP, or a hosting-latency effect. Nor a speedup on CPU-bound devices, where the trace shows the summary's gain shrinking to noise.

## Files and reproduction

- [`ab-lab.cjs`](ab-lab.cjs) and [`ab-results.json`](ab-results.json): matched A/B lab and raw samples, including run metadata.
- [`trace-summary.cjs`](trace-summary.cjs) and [`trace-summary.json`](trace-summary.json): critical-path trace and milestones.
- `npm run test:print` checks printing; `npm run test:shared-json-hook` runs the hook lifecycle scenarios. Both need Playwright with Chromium and are not run in CI.

```sh
npm ci && npm run build
node output/performance/2026-11-02/implementation/gzip-static-server.cjs "$PWD/dist" 4310 &
# build the base commit into another directory and serve it on 4301, then:
node output/performance/2026-11-05/ab-lab.cjs 3 before=4301@<base-sha> after=4310@<head-sha>
node output/performance/2026-11-05/trace-summary.cjs 3 before=4301 after=4310
```
