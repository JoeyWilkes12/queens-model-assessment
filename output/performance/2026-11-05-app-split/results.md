# App split and performance budget (PR #21)

November 5, 2026. Results for the changes that implement [the response to "The AI cost of JavaScript frameworks"](../../../docs/ai-cost-of-frameworks-response.md). They come from a local lab comparison of two production builds on one host. They are not public-site or field measurements.

## Contents

- [Summary](#summary)
- [Conditions](#conditions)
- [Matched results](#matched-results)
- [A regression found and fixed](#a-regression-found-and-fixed)
- [Rendering is unchanged](#rendering-is-unchanged)
- [Code size per edit](#code-size-per-edit)
- [Preact spike (evaluated, not adopted)](#preact-spike-evaluated-not-adopted)
- [Prerendering (deferred)](#prerendering-deferred)
- [Files and reproduction](#files-and-reproduction)

## Summary

- **Entry JavaScript:** 127.2 → **93.6 kB gzip** (−26%), measured at zlib level 6 by `npm run budget:check`. Every page except the summary now loads with its route.
- **Mobile, slow 4G:** every measured route reaches its primary content sooner, and paints its largest element sooner.
  - The before and after ranges do not overlap in either cache mode.
  - Layout shift is unchanged.
  - Total Blocking Time is unchanged within noise.
- **Desktop:** timings are within noise, as before. Transfers are smaller.
- **Rendering:** the final build matches #14 pixel for pixel on every compared route, desktop and mobile, except About and Changelog, which show this PR's changelog entry.
- **Agent edits:** a page is now a file of 2–30 kB instead of the 140 kB `App.tsx`.

## Conditions

- **Builds:**
  - Before: `c9549b81`, the head of PR #14, which this PR stacks on.
  - After: `91390644`, this PR with the regression fix described below. The only later commits change documentation and results files.
- **Host:** Intel Xeon @ 2.30 GHz, 4 vCPUs, Node v22.23.4, Chromium 153.0.8010.12, Playwright 1.63.0.
- **Harness:** [`scripts/perf/ab-lab.cjs`](../../../scripts/perf/ab-lab.cjs), the maintained copy of the [November 5 harness](../2026-11-05/ab-lab.cjs), with long tasks and Total Blocking Time added. The routes, readiness criteria and profiles are the same:
  - Desktop: 1440×1000, 1× CPU.
  - Mobile: 390×844 touch, 4× CPU, 1.6 Mbps down, 0.75 Mbps up, 150 ms latency.
- **Server:** [`scripts/perf/gzip-static-server.cjs`](../../../scripts/perf/gzip-static-server.cjs): gzip level 6, `max-age=600`.
- **Samples:** 72 of 72 valid (3 rounds × 2 builds × 3 routes × 2 profiles × 2 cache modes). A/B order alternates every round. Each cell shows the median, with the min–max range in parentheses.
- **TBT:** the sum of each long task's time past 50 ms, from first contentful paint to the end of the capture, under the 4× CPU slowdown. Script evaluation before first paint is not counted, as in Lighthouse.

## Matched results

### Mobile, slow 4G

| Route | Cache | Primary ready, before → after | LCP, before → after | TBT, before → after | Layout shift | Transfer |
|---|---|---|---|---|---|---|
| Summary | normal | 1.53 s (1.51–1.58) → **1.33 s** (1.32–1.37) | 1.31 → **1.11 s** | 10 → 3 ms | 0 → 0 | 178 → **145 kB** |
| Summary | disabled | 1.50 s (1.50–1.57) → **1.33 s** (1.32–1.35) | 1.32 → **1.11 s** | 1 → 1 ms | 0 → 0 | 178 → **145 kB** |
| Local assessments | normal | 2.36 s (2.33–2.36) → **2.22 s** (2.16–2.23) | 1.27 → **1.08 s** | 95 → 96 ms | 0 → 0 | 223 → **191 kB** |
| Local assessments | disabled | 2.36 s (2.33–2.41) → **2.21 s** (2.18–2.26) | 1.26 → **1.08 s** | 97 → 115 ms | 0 → 0 | 223 → **191 kB** |
| Atlas | normal | 3.67 s (3.65–3.74) → **3.40 s** (3.36–3.48) | 1.26 → **1.12 s** | 230 → 193 ms | 0.013 → 0.013 | 515 → **501 kB** |
| Atlas | disabled | 3.69 s (3.67–3.69) → **3.44 s** (3.40–3.50) | 1.26 → **1.11 s** | 248 → 245 ms | 0.013 → 0.013 | 515 → **501 kB** |

- The TBT ranges overlap on every route, for example 87–155 ms against 94–112 ms on the local chapter. Long-task counts are the same: two on the summary, three on the local chapter and the atlas.
- Main-thread blocking after first paint is therefore unchanged. The gains come from downloading less before first paint.
- The summary's largest task (about 170–240 ms) is the entry script's evaluation, before first paint. It is somewhat shorter after: 170–198 ms against 176–239 ms.

### Desktop, no throttling

Readiness is 129–230 ms in both builds, and the differences are within sample noise. Transfers fall the same way as on mobile. Layout shift is unchanged: 0.0099 on the summary and 0.0005 on the atlas, both already present in #14.

## A regression found and fixed

The first matched run, against `c91bcd59` ([`ab-summary-run1-c91bcd59.txt`](ab-summary-run1-c91bcd59.txt) and [raw](ab-results-run1-c91bcd59.json)), found two atlas regressions. Both came from requesting the atlas catalog from an inline script in `index.html`:

1. **Mobile LCP 1.28 → 1.55 s.** On slow 4G the 337 kB catalog started with the page and shared bandwidth with the entry code, which delayed the first paint.
2. **Desktop layout shift 0.0005 → 0.0143.** The catalog now arrived before the receipt costs, so the atlas rows rendered first and grew a cost line afterwards. The race already existed; the early catalog exposed it.

Fixed in `91390644`:

- The catalog and the receipt costs are now requested when `App.tsx` runs, after the entry code has loaded. They download alongside the atlas code instead of after it. Each is still fetched once, because the atlas's own requests reuse the preloaded responses.
- The atlas swaps in the catalog only once the costs are known or have failed, so a row never grows after it appears.

The second run, above, shows neither regression. The atlas's readiness gain is smaller than in the first run (3.71 → 3.22 s there), which is the cost of not competing with the entry code.

## Rendering is unchanged

[`scripts/compare-builds.cjs`](../../../scripts/compare-builds.cjs) loads routes from two builds in Chromium. It starts from the 26 book pages, adds every in-book link found on them, and compares each route's rendered DOM (with asset hashes and React ids normalized) and a viewport screenshot.

| Build compared with #14 | Desktop routes | Mobile routes | Differences |
|---|---|---|---|
| Verbatim move (`a09161a3`) | 400 | — | none (see note) |
| Lazy pages, formatted (`0a252f9e`) | 300 | 80 | atlas count line only (see note) |
| Final (`91390644`) | 26 book pages and home | 26 book pages and home | About and Changelog only, from this PR's new changelog entry |

- **Note on the verbatim move:** the first run flagged the print fallback's absolute URL, which contains the server's port, and one replay page that paints late. Both also differ between two loads of the same build. The tool now normalizes the URL and retakes differing screenshots twice.
- **Note on the formatted build:** the formatter split " matching records · " into two text nodes. That gave identical DOM but 168 pixels of different anti-aliasing. One string child restored the original (`c91bcd59`).
- **Stylesheet:** the entry stylesheet is byte-identical to #14's. `App.tsx` imports the replay and failure-comparison styles in their old position.

## Code size per edit

What an agent (or a person) reads to change one page. Tokens are estimated at about four characters per token, not measured.

| To edit | Before: `App.tsx` | After |
|---|---|---|
| About | 140.5 kB, ~35k tokens | `AboutPage.tsx` 5.3 kB, ~1.3k |
| Methods and sources | same | `MethodsSources.tsx` 7.7 kB, ~1.9k |
| Evidence atlas | same | `EvidenceAtlas.tsx` 29 kB, ~7k |
| Executive summary | same | `ExecutiveSummary.tsx` 22 kB, ~5.5k |
| Add a route | same | `chapters.ts` 5.6 kB and `App.tsx` 10.5 kB |

- **Length:** `App.tsx` is now 280 lines (was 1,374).
- **Long lines:** the longest line in the moved modules is 535 characters, a prose string (was 5,309).
- **Formatter:** the moved modules were formatted once with Prettier 3.6. No formatter was added to the project; AGENTS.md asks for readable lines.

## Preact spike (evaluated, not adopted)

A throwaway build of `0a252f9e` aliased `react` and `react-dom` to `preact/compat` 10.29.8 (August 2026). It was not committed.

- **Entry JavaScript:** 93.3 → **55.7 kB gzip** (−40%).
- **Rendering:** on the first screen of the 26 book pages at desktop size, 25 matched React's pixel for pixel. The atlas differed by the same text-node issue described above. No console errors.
- **DOM:** the serialized DOM differs in attribute order everywhere, which is harmless, so the check relied on screenshots.
- **Not tested:** interactions (the leaderboard zoom, disclosures, replays, the atlas filters), printing, StrictMode behavior, and phones.
- **Recommendation:** keep React. The budget is not binding at 93.6 kB against 135 kB, and React keeps the benefit of familiar tooling. Revisit Preact if the budget becomes binding. It would need a full interaction and print check, and a decision about running two runtimes' worth of edge cases.

## Prerendering (deferred)

Not attempted, as the response document recommends. It would need path routes in place of hash routes, and the gain is in first paint, which this split already improved.

## Files and reproduction

- [`ab-results.json`](ab-results.json) and [`ab-summary.txt`](ab-summary.txt): the final matched run, raw samples and medians.
- [`ab-results-run1-c91bcd59.json`](ab-results-run1-c91bcd59.json) and [`ab-summary-run1-c91bcd59.txt`](ab-summary-run1-c91bcd59.txt): the first run, which found the regression.
- `npm run budget:check` after `npm run build`: entry size and the lazy-chapter rule.

To reproduce, see [`scripts/perf/README.md`](../../../scripts/perf/README.md).

```sh
node scripts/perf/ab-lab.cjs 3 before=4301@c9549b81 after=4314@91390644 --out ab-results.json
node --experimental-strip-types scripts/compare-builds.cjs 4301 4314 --max 300
```
