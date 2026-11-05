# Performance lab

Tools for checking that a website change keeps the performance budget in [AGENTS.md](../../AGENTS.md#performance-budget-for-website-changes). Dated results live under `output/performance/<date>/`; the harnesses there are kept unchanged as records, and these are the maintained copies.

- **`npm run budget:check`** (no browser) reads `dist/` after `npm run build` and fails if the entry JavaScript exceeds 135 kB gzip, or if a route chapter is part of it. CI runs it.
- **`ab-lab.cjs`** compares two production builds in Chromium (Playwright) on the summary, the local chapter and the atlas:
  - Profiles: desktop (1× CPU, no throttling) and mobile (390×844 touch, 4× CPU, 1.6 Mbps, 150 ms).
  - Cache modes: normal and disabled. A/B order alternates each round, after a warm-up load.
  - Each sample records primary readiness, LCP, layout shift (captured sum and session-window CLS), transfer, long tasks, and Total Blocking Time (TBT): each long task's time past 50 ms, from first contentful paint to readiness and to the end of the capture.
  - Invalid samples make it exit 1; they stay in the output and are excluded from medians.
- **`gzip-static-server.cjs`** serves a `dist/` directory under `/queens-model-assessment/` with gzip level 6 and `max-age=600`, like GitHub Pages without its CDN.

## Compare two commits

```sh
git worktree add /tmp/qma-base <base-sha> && (cd /tmp/qma-base && npm ci && npm run build)
npm ci && npm run build
node scripts/perf/gzip-static-server.cjs /tmp/qma-base/dist 4301 &
node scripts/perf/gzip-static-server.cjs "$PWD/dist" 4310 &
node scripts/perf/ab-lab.cjs 3 before=4301@<base-sha> after=4310@<head-sha> --out output/performance/<date>/ab-results.json
```

Three rounds take about ten minutes. These are lab numbers from one host, not field Core Web Vitals; report medians with their ranges, and say which host ran them.
