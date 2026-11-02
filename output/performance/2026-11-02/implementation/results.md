# Implementation results: stages 1–3 of the performance plan

Measured November 2, 2026, against [Codex's plan](../../../../docs/static-site-performance-improvements-plan.md) and its [browser assessment](../browser-assessment.md). This is a local lab comparison of two production builds. It is not a public-site or field measurement.

## Contents

- [Conditions](#conditions)
- [Before and after](#before-and-after)
- [What changed](#what-changed)
- [Interpretation](#interpretation)
- [Not done in this change](#not-done-in-this-change)
- [Validation](#validation)
- [Reproduce](#reproduce)

## Conditions

- **Builds.** *Before* is the head of PR #13 (book organization, `aa9c3fd6`), which this branch stacks on. Its entry JS is 182 kB gzip, against 174 kB on `main`, because PR #13 added the navigation tree and changelog. *After* is this branch.
- **Server.** [`gzip-static-server.cjs`](gzip-static-server.cjs) serves `dist/` under `/queens-model-assessment/` with gzip level 6 and `max-age=600`, like GitHub Pages. GitHub's CDN latency and TLS are not reproduced.
- **Harness.** [`local-lab.cjs`](local-lab.cjs) is Codex's [lab template](../../../playwright/public-performance/lab-template.cjs) pointed at localhost. It uses the same routes, the same readiness criteria and the same two profiles:
  - Desktop: 1440×1000, 1× CPU, no network throttling.
  - Mobile: 390×844 touch emulation, 4× CPU slowdown, 1.6 Mbps down, 0.75 Mbps up and 150 ms latency.

  Atlas readiness means the manifest-derived "N included by default" count exceeds 1,000, instead of the dated 5,422.
- **Samples.** Three samples per route and profile, each in a new browser context with the cache disabled (the forced-cache-off upper bound). Medians are shown below. Raw samples: [before](samples-before.json), [after](samples-after.json). Chromium is the version bundled with Playwright in the Cloud container. The two builds were measured back to back.
- **Transfer.** "Transfer" is the CDP `encodedDataLength` sum for same-origin requests: gzip bodies plus response headers.

## Before and after

### Slow-4G mobile profile (medians, three samples)

| Route | Measure | Before | After | Change |
|---|---|---:|---:|---:|
| Executive summary | Primary data ready | 2.30 s (2.18–2.39) | 1.86 s (1.75–1.94) | −19% |
| | LCP | 1.75 s | 1.55 s | −11% |
| | Transfer | 305 kB, 17 requests | 176 kB, 11 requests | −42% |
| | JSON before scrolling | 94 kB (7 files) | 23 kB (2 files) | −75% |
| Local open-weight assessments | Layout shift (CLS) | **0.268** | **0** | fixed |
| | LCP | 2.62 s | 1.29 s | −51% |
| | Primary data ready | 2.99 s (2.85–3.15) | 2.64 s (2.60–2.83) | −12% |
| | Transfer | 280 kB | 222 kB | −21% |
| Evidence atlas | Full catalog ready | 4.37 s (4.28–4.41) | 4.07 s (3.95–4.14) | −7% |
| | LCP | 1.72 s | 1.38 s | −19% |
| | Transfer | 572 kB | 513 kB | −10% |

### Desktop profile, no throttling

| Route | CLS before → after | Data ready before → after | Transfer before → after |
|---|---|---|---|
| Executive summary | 0.0099 → 0.0099 | 272 → 219 ms | 305 → 176 kB |
| Local open-weight assessments | **0.089 → 0** | 247 → 235 ms | 280 → 222 kB |
| Evidence atlas | 0.0005 → 0.0005 | 368 → 352 ms | 572 → 513 kB |

Desktop timings were already fast, and these differences are within sample noise. The desktop layout-shift fix and the smaller transfers are the real desktop changes.

### Bundles (production build)

| Asset | Before | After |
|---|---:|---:|
| Entry JS (every route) | 182.3 kB gzip / 694 kB raw | **126.6 kB gzip / 406 kB raw** (−31% / −42%) |
| JS on the local chapter route | 199 kB transferred | 143 kB transferred |
| Duplicate JSON requests (cache disabled) | `scoreboard.json` ×2 on home, `local-qwen-pricing.json` ×2 on local | none |

Codex's goal was a 20% reduction from the 174 kB entry. The entry is now 126.6 kB, 27% below `main`'s 174 kB even though it carries PR #13's additions.

## What changed

1. **Stable loading (stage 1).**
   - **Cause:** every layout shift on the local chapter was the site footer. Short loading states left it high on screen, then the chapter pushed it away twice.
   - **Full-height body:** the page body is now at least one viewport tall.
   - **Matching hero:** the lazy chapters' module-loading and data-loading states render the chapter's own hero. The hero text lives in a tiny shared module, `src/routeHeroes.ts`.
   - **Placeholders:** static, decorative placeholder bars (`aria-hidden`) sit under an `aria-busy` main landmark. There is no shimmer or animation.
2. **One owner for shared JSON (stage 2).** `src/sharedJson.ts` serves each saved file once per page:
   - Concurrent readers share one validated result, and unmounting one never cancels another.
   - A failed or invalid response is evicted rather than cached.
   - Error states offer **Try again**, and a successful retry updates every reader of that file.
   - The cache holds at most 16 files.
   - Migrated: the scoreboard and cost ledger (`scoreboard.json`), both local cost views (`local-qwen-pricing.json`), and the receipt-cost strip. The strip previously kept a failed load for the whole session.
   - Behavior tests: `npm run test:shared-json`.
3. **Load code and optional evidence when needed (stage 3).**
   - **Lazy chapters:** ten chapters and the receipt-chain table (149 kB raw) now load with their route.
   - **Preloading:** sidebar and Contents links start loading a chapter on hover, focus or touch.
   - **Failed chunks:** a chapter whose code fails to load shows a "Reload the book" boundary, and other chapters keep working. Chromium keeps a failed module import for the page's lifetime, so an in-page retry cannot work; a reload does.
   - **Deferred evidence:** the summary's featured replays (0.94 MB raw of trajectories) and the pair strip in a closed disclosure fetch their data only when they come within reach of the viewport, or when the page prints. Their content stays mounted, so anchors, disclosures and find-in-page behave as before, and the replay panel keeps its measured height while it waits.

## Interpretation

- **Did performance improve?** Yes. On the mobile profile, every route is faster to its primary content, transfers less, and has no new layout shift. The before and after sample ranges do not overlap on any mobile route.
- **Largest wins:**
  - The local chapter no longer jumps (CLS 0.27 → 0).
  - Its heading paints 1.3 s sooner, because the shell shows the real hero before the chapter's code arrives.
  - The summary transfers 42% less before the reader scrolls.
- **The atlas improved least.** Its full catalog is still gated by the 337 kB gzip, 9.3 MB raw `manifest.json`. Only stage 5 changes that.
- **Interaction cost:** the first visit to a lazily loaded chapter adds one small request (2–17 kB gzip). Preloading on hover, focus or touch hides that for most sidebar navigation. A direct link to such a chapter shows the loading shell briefly, and measured CLS stayed at 0 on those routes.
- **Normal-cache caveat:** Codex found that an ordinary empty-cache visit already coalesced the duplicate JSON requests. The duplicate savings above are the forced-cache-off upper bound; the code-splitting and deferral savings apply either way.

## Not done in this change

Stages 4 and 5 (additive presentation data for local studies and a compact atlas index) are left for a separate PR. They add generated evidence files that need parity verification, which should be reviewable apart from these UI changes. Measurements to start from:

- **Atlas manifest:** 337 kB gzip, 9.34 MB raw.
  - `records`: 5.40 MB raw, 159 kB gzip, 5,417 rows. Inside it, `files` (per-record artifact paths) takes 49% of the serialized record bytes and `source` 15%.
  - `index`: 2.58 MB raw, 164 kB gzip, a precomputed index that the atlas list does not read.
  - A list index without per-record paths and the unused `index` map looks likely to meet the plan's 175 kB gzip target. This is an estimate, not a measurement.
- **Local `index.json`:** 57 kB gzip, unchanged here.

## Validation

- **Passed:** `npm run build`, `npm run ollama:test`, `npm run ollama:verify`, `npm run boards:verify`, `npm run evidence:check-public`, `npm run receipts:verify`, `npm run changelog:verify`, `npm run test:shared-json`, and every other `scripts/verify-*.mjs`.
- **Environment limitation:** `verify-z3-workbench.mjs` stops at its Z3 step on this branch and on its base, because Python's `z3-solver` 4.16 is not installed in the container. The workbench code is unchanged.
- **Browser checks** on the local production build, with no unexpected console errors:
  - Direct loads of all 16 lazy or deep routes render their own chapter.
  - Back and Forward across lazy and eager routes work.
  - A trajectory receipt still shows its receipt-chain navigation, identical to the before build.
  - A blocked chapter chunk shows the reload boundary; another chapter still opens; reload recovers.
  - A 503 on `scoreboard.json` shows both error states; one retry restores both.
  - The deferred evidence fetches nothing before scrolling, the pair strip loads when its disclosure opens, and the replay loads on scroll.
  - Local tariffs and the study-cost table load.

## Reproduce

```sh
npm ci && npm run build
node output/performance/2026-11-02/implementation/gzip-static-server.cjs "$PWD/dist" 4303 &
node output/performance/2026-11-02/implementation/local-lab.cjs 4303 after 3
```

The harness writes `lab-<label>.json` beside itself. Build the base commit into another directory and serve it on another port for the before run.
