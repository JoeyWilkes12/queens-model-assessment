# Public browser performance follow-up — November 2, 2026

User explicitly approved read-only browser testing of the public GitHub Pages site. The latest Pages deployment remained successful at merge commit `6387576a7c192464b1a4740ffdb6a0fdc7747241`. The application source, hosting settings and benchmark job were unchanged.

## Method

Chromium 156.0.8078.74; three valid samples per route/profile; a new isolated browser context for each navigation; browser cache disabled; service workers blocked; no login. Desktop: 1440×1000, this Mac’s normal connection, CPU 1×. Mobile: Chromium Android/touch emulation at 390×844, 1.6 Mbps download, 0.75 Mbps upload, 150 ms configured latency, CPU 4× slowdown relative to this Mac. This is a lab simulation, not a physical phone or geographically distributed field test. DNS/TLS/CDN/process caches can be warm.

LCP is the last observed largest visible content paint during initial navigation. Primary data readiness is measured after two animation frames following a qualifying DOM update: populated leaderboard on the homepage; study results plus prices on the local chapter; complete manifest-derived atlas count (5,422 included plus ten excluded), not its initial fallback rows. These are per-view readiness criteria, not a standardized whole-page metric. The atlas initially renders fallback records: two early readiness-only samples used an inadequate selector and were replaced; their raw output remains available. Final results contain three valid samples per case.

No clicks or scrolling preceded timing collection. Each sample settled through network idle plus one second; screenshots followed collection. No uncaught page errors, failed navigations, disk-cache or service-worker responses were observed across the 18 valid cache-disabled samples. INP and search responsiveness were not measured.

## Median results

| Page | Cold-cache compressed bodies | Desktop LCP | Desktop primary data ready | Slow-4G LCP | Slow-4G primary data ready | Mobile loading layout-shift score |
|---|---:|---:|---:|---:|---:|---:|
| home | 300.5 kB | 0.21 s | 0.30 s | 1.49 s | 1.77 s | 0.000 |
| local-qwen | 275.2 kB | 0.27 s | 0.32 s | 2.25 s | 2.46 s | 0.235 |
| atlas | 574.5 kB | 0.20 s | 0.27 s | 1.44 s | 3.63 s | 0.013 |

Largest visible content is the page heading in these samples. In particular, the atlas heading appears around 1.44 seconds on simulated slow 4G while its full catalog becomes ready around 3.63 seconds. Heading paint is not evidence that all data is loaded.

## Payload reconciliation

With forced cache-off, the homepage fetched scoreboard.json twice and the local chapter fetched local-qwen-pricing.json twice. The atlas’s payload matched the earlier HTTP/source estimate. A separate normal-cache sanity check used two additional fresh contexts with no prior stored site data. Chrome coalesced/reused the second identical request: 0 additional transferred bytes for that request. This confirms the earlier first-visit estimates of 281,698 compressed body bytes for the homepage and 274,196 for the local chapter. Cache-disabled loads were 300,502 and 275,168 bytes respectively. The atlas remained 574,495 bytes. ResourceTiming encodedBodySize can include a cache-reused body, so the normal-cache calculation excludes entries with zero transferSize.

The normal first-visit CDP transfer totals, including browser-reported response overhead, were 285,837 bytes for the homepage and 276,423 for the local chapter. Cache-disabled atlas transfer was about 576 kB. TLS/TCP framing is additional. The whole 198 MB archive is still not downloaded on entry.

## Findings and priorities

1. Initial transfer sizes are small; this is not a hundreds-of-megabytes page load. Desktop rendering was quick in this connection’s samples. These observations do not establish worldwide or real-phone percentiles.
2. The local chapter’s slow-4G loading layout-shift score was consistently about 0.235. The observed moving element was the footer: it first appeared near y=206, moved down near y=524, then moved out of view when the full data layout arrived. Reserve the loading/hero/body geometry and keep the footer below the initial viewport. This is application layout work, not a hosting change.
3. Keep atlas heading-paint and full-catalog-readiness metrics separate. The atlas also expands roughly 574 kB compressed bodies into 10.5 MB including the main scripts and data, so it remains a candidate for a slimmer searchable index and per-receipt loading. This run does not establish JSON CPU work as its dominant bottleneck.
4. Share identical in-flight data fetches for scoreboard and pricing rather than relying on browser coalescing. The normal fresh-visit check shows network reuse already works; forced-cache-off measurements are a useful upper bound.
5. Moving the unchanged app to Vercel would not remove the layout transitions or eager JavaScript. The previous report’s Vercel preview/caching/Brotli benefits remain relevant, but no Vercel deployment was created or benchmarked.

## Evidence

- [Valid samples](../../playwright/public-performance/results.json)
- [Normal fresh-visit sanity check](../../playwright/public-performance/cache-normal-check.json)
- Screenshots and executable lab harness: `output/playwright/public-performance/`.
- [Earlier direct HTTP / hosting report](assessment.md). The earlier approval-pending and browser-unmeasured statements describe that first phase and are superseded by this follow-up.
- [LCP definition](https://web.dev/articles/lcp)
- [CLS definition and good threshold ≤0.1](https://web.dev/articles/cls)

Only analysis outputs were written under ignored output directories. The temporary QA browser is closed at handoff.
