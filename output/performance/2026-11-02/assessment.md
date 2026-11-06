# GitHub Pages payload assessment — November 2, 2026

**Follow-up:** the user subsequently approved public-browser testing. See [measured cold-browser results](browser-assessment.md), which supersede the browser-unmeasured/pending-approval portions of this initial HTTP assessment.

PR 11's [Pages deployment](https://github.com/JoeyWilkes12/queens-model-assessment/actions/runs/41504698152) succeeded at 18:53:52Z (11:53:52 a.m. MST), commit `6387576a7c192464b1a4740ffdb6a0fdc7747241`. All public HTTP measurements followed completion. The live evidence index is `2026-11-02-overnight`, with 19 conditions. The seven local-chapter core assets downloaded from production are SHA-256-identical to the matching local production build.

## Method and limits

Direct public HTTP/2 GETs with negotiated compression, fresh curl processes, no browser disk cache. CDN and OS DNS caches can be warm. Bytes measure compressed response bodies; TCP/TLS framing and headers are additional. Route dependency sets come from inspected React code, not an observed browser waterfall. Browsers can coalesce duplicate fetches or defer lazy images. Public-site browser automation has not been performed while explicit approval is pending under global AGENTS.md. No site settings or source changes were made.

## New-visitor payloads

| Scope | Compressed body bytes | Decoded / parsed implications |
|---|---:|---|
| Executive summary, source dependency graph including all six small logos | 281,698 | Below-fold replays and closed-disclosure data fetch on mount |
| Local open-weight chapter core | 274,196 | 1,659,352 bytes after decompression, including HTML |
| Evidence atlas core | 574,495 | Manifest alone expands to 9,344,266 bytes |
| Entire matching production build | Not downloaded on page opening | 197,962,928 logical bytes / 40,022 files |

The local chapter includes: common JS 174,257 bytes transferred / 666,630 decoded; common CSS 18,850 / 97,735; lazy chapter JS 17,609 / 58,788; lazy CSS 694 / 1,608; all-study index 60,439 / 829,580; pricing JSON 972 / 2,397; favicon 288 / 464; HTML 1,087 / 2,150. Raw receipts and old snapshots are fetched on demand. Individual receipt pages add their specific response and image; raw request downloads remain separate user actions.

The atlas manifest transfers as 347,252 gzip bytes despite its 9.34 MB decoded size. Its JSON parsing, object allocation and filtering deserve separate browser/CPU measurement. The 198 MB logical archive is not the initial page payload. Filesystem allocated size is larger because many files are small and is irrelevant to network transfer.

## Latency

Initial HTML TTFB: 145.9 ms. Five later fresh-process samples: 167.7, 89.5, 72.5, 69.2 and 75.4 ms; median 75.4 ms. Common JS completed in 219.3 ms; the all-study index in 186.4 ms during asset sampling. Timings are from this Mac and connection, not global latency guarantees. Parallel request elapsed times must not be summed and called a measured page load.

| Transfer-only theoretical floor | 10 Mbps | 1.6 Mbps |
|---|---:|---:|
| Local chapter, 274,196 bytes | 0.22 s | 1.37 s |
| Executive summary, 281,698 bytes | 0.23 s | 1.41 s |
| Atlas, 574,495 bytes | 0.46 s | 2.87 s |

DNS/TLS, sequential dependency round trips, JS execution, JSON parsing and rendering are additional. No public browser LCP/FCP/INP or complete-page-ready timing has been measured. A readable page around a second on a good connection and several seconds on slower mobile is a planning estimate, not an observed browser result; the atlas can have extra CPU cost.

## Vercel implications

GitHub already serves these files via CDN, HTTP/2 and gzip. Observed `Cache-Control` is `max-age=600`; explicitly requesting br and gzip still returned gzip.

Potential benefits on Vercel:

- Automatic branch/PR previews and commit-specific URLs.
- Manual promotion and instant rollback, with plan-dependent rollback history.
- Custom immutable cache policy for fingerprinted bundles and frozen snapshots; shorter revalidation for the changing index.
- Brotli and optional real-user Speed Insights.
- APIs or server-backed queries later, if the static app needs them.

Offline Brotli quality-6 compression of the seven identical local-chapter assets totals 219,683 bytes versus 273,109 measured gzip bytes, about 20% less before HTML. This is a compression experiment, not a Vercel deployment measurement or guaranteed platform result. Both hosts still require the same application JS execution and JSON/DOM work unless the app changes.

Vercel Hobby is free for eligible non-commercial personal projects; the current published allowance is 100 GB data transfer and one million CDN requests. Pro starts at a $20/month platform fee including one deploying seat. Retained deployment output also contributes to deployment storage; a hosting provider's deployment retention should not be the sole evidence archive.

The 40k-file / 198 MB source tree exceeds a naive Vercel CLI upload's documented 15,000-source-file cap and Hobby 100 MB source-upload allowance. Those are CLI upload restrictions, not a 15k limit on generated build output. Evaluate migration through a Git-connected build. GitHub Pages currently allows a 1 GB published site and has a soft 100 GB/month bandwidth limit.

Recommendation: optimize the shared eager JS and split the all-study index into small overview data plus per-study details before expecting a hosting move to solve CPU/render costs. Gate below-fold replay and closed-disclosure fetches on intent where useful. Keep raw receipts on demand. Choose Vercel primarily for preview/release workflow, cache controls, Brotli and future backend needs; benchmark an authorized equivalent preview before asserting a latency win.

## Official references

- [GitHub Pages limits](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits)
- [Vercel compression](https://vercel.com/docs/how-vercel-cdn-works/compression)
- [Vercel preview environments](https://vercel.com/docs/deployments/environments)
- [Vercel instant rollback](https://vercel.com/docs/instant-rollback)
- [Vercel cache headers](https://vercel.com/docs/caching/cache-control-headers)
- [Vercel upload/platform limits](https://vercel.com/docs/limits)
- [Vercel deployment storage](https://vercel.com/docs/deployment-storage)
- [Vercel Hobby](https://vercel.com/docs/plans/hobby)
- [Vercel Pro](https://vercel.com/docs/plans/pro-plan)

Raw HTTP/compression JSON and headers are saved beside this report. Guessed probe URLs returning 404 are excluded from route totals and are not claimed as broken application requests.
