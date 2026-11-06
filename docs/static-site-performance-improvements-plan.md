# Static site performance improvements — Claude Cloud handoff

Prepared November 2, 2026. Repository: `JoeyWilkes12/queens-model-assessment`.
Working branch: `codex/static-site-performance-improvements`.
Base: merged `main`, commit `6387576a7c192464b1a4740ffdb6a0fdc7747241`.

## Status (updated November 2, 2026)

Stages 1–3 are implemented on this branch, which is stacked on PR #13 (book organization). Measured results, conditions, validation and the evidence for stages 4–5 are in [implementation results](../output/performance/2026-11-02/implementation/results.md). Stages 4 (local-study presentation data) and 5 (compact atlas index) remain open for a separate, reviewable PR. After an independent review on November 5, the print fallback, a stricter matched A/B harness, a critical-path trace and hook lifecycle tests were added; see the [November 5 results](../output/performance/2026-11-05/results.md).

## Assignment and completion boundary

Improve the existing static React/Vite book, in this order: stable loading
layouts, shared data fetches, then route/data splitting. Work in Claude Cloud
using this branch. Full network egress is available for dependencies and public
documentation; reproducing the original public-site benchmark is optional.
Use the committed findings as the starting evidence and validate the behavior
you change on a local build. Do not spend the first stage repeating the entire
investigation. The handoff commit contains documentation and measurement
artifacts only; no implementation has begun.

Done means the prioritized changes are implemented, useful regression checks
and applicable existing checks pass, the measured changes and limitations are
documented, and reviewable PRs are ready for Joey. Stop before merge or
production deployment. If the data split would require modifying frozen
receipts, weakening an audit, or changing a scientific claim, present an
alternative and ask before proceeding with that scope. Do not run new model
assessments, invoke inference providers, or change benchmark scheduling.

This initiative keeps GitHub Pages. A Vercel migration, production analytics,
paid services, and server-backed search are separate decisions. Network access
does not imply authorization to send repository content to a new external
review service or to alter external accounts. Follow repository instructions
and any review permissions available in your Cloud session.

## Read first and use as the baseline

1. [Browser assessment](../output/performance/2026-11-02/browser-assessment.md).
2. [Initial HTTP/source and hosting assessment](../output/performance/2026-11-02/assessment.md).
3. [Eighteen valid browser samples](../output/playwright/public-performance/results.json).
4. [Normal-cache fresh-visit checks](../output/playwright/public-performance/cache-normal-check.json).
5. [Measurement summary](../output/performance/2026-11-02/browser-summary.json).
6. The screenshots and optional lab template in
   `output/playwright/public-performance/`.

These selected output files were deliberately committed despite the normal
`output/` ignore rule. They are historical evidence, not runtime assets: do not
copy them into `public/` or ship them in the website build. Some references in
the original reports describe additional local-only captures. The selected
bundle includes the final results and both reports; discarded raw trial logs
and every HTTP response body are not required for implementation.

The production measurement followed successful Pages run
[41504698152](https://github.com/JoeyWilkes12/queens-model-assessment/actions/runs/41504698152).
This is a dated baseline, not a claim about every future deployment.

| Route | Normal first-visit compressed bodies | Cache-disabled slow-4G primary data ready | Loading layout-shift score on mobile |
|---|---:|---:|---:|
| Executive summary (`#/executive-summary`, also root) | 281,698 bytes | 1.77 s | 0.000 |
| Local open-weight assessments (`#/local-qwen`) | 274,196 bytes | 2.46 s | 0.235 |
| Evidence atlas (`#/evidence-atlas`) | 574,495 bytes | 3.63 s | 0.013 |

Timing medians use three valid cache-disabled samples per route/profile. Mobile
was Chromium emulation, 390×844, 1.6 Mbps down, 0.75 Mbps up, configured 150 ms
latency and 4× CPU slowdown relative to an M4 Pro. These are lab observations,
not physical-phone results or field percentiles. DNS/TLS/CDN/process caches may
be warm. Primary-data readiness is custom and route-specific. LCP on the atlas
was only 1.44 s because its heading appeared before the complete catalog.

Important interpretations:

- The site archive is about 198 MB across 40,022 build files. Entry loads are
  hundreds of kilobytes, not the whole archive.
- The common JS bundle is 174,257 gzip bytes / 666,630 decoded bytes.
- Local `index.json` is 60,439 gzip / 829,580 decoded bytes. It embeds rows for
  all studies, even when the user inspects one study.
- Atlas `manifest.json` is 347,252 gzip / 9,344,266 decoded bytes; the complete
  route expands to about 10.5 MB. No claim that JSON parsing dominated latency
  has been established.
- Forced-cache-off testing fetched `scoreboard.json` twice and
  `local-qwen-pricing.json` twice. Normal empty-context visits coalesced/reused
  the second transfer. Shared fetches improve ownership, parsing and lifecycle;
  do not claim the full duplicate-body saving for ordinary first visits.
- The local page's visible footer moved from approximately y=206 to y=524 and
  then offscreen during loading. This is the first UX defect to fix.

## Source map to confirm in Cloud

| Concern | Current starting points | Relevant behavior |
|---|---|---|
| Shell, route loading, shared UI | `src/App.tsx`, `src/styles.css` | LocalQwen and Z3 lazy-load; many other chapters are eager imports; LocalQwen's Suspense fallback is a short paragraph |
| Local evidence loading | `src/localQwenEvidence.ts` | `useLocalStudies`, `isLocalIndex`, schema 1–3, one all-study index |
| Local chapter | `src/LocalQwen.tsx`, `src/local-qwen.css` | Overview also needs cross-study summaries; selected results, costs and receipt list currently derive from full rows |
| Duplicate pricing | `src/LocalQwen.tsx` | `usePricing` runs independently in `StudyCosts` and `Finance` |
| Duplicate scoreboard | `src/Scoreboard.tsx`, `src/CostLedger.tsx` | Separate effects fetch the same saved scoreboard |
| Existing small shared loader | `src/ReceiptCost.tsx` | Module-scoped promises; inspect rejection and retry semantics before reusing the pattern |
| Eager hidden work | `Disclosure` in `src/App.tsx`, `src/FeaturedReplays.tsx` | Closed native details still mount children; below-fold replays fetch three JSON documents at mount |
| Atlas list and detail | `src/App.tsx` | Full manifest drives filters, counts, search and ID resolution; initial fallback rows can appear before it loads |
| Frozen evidence contracts | `scripts/ollama/import_studies.py`, `public/evidence/local-qwen/` | Hashes and canonical catalogs are verified; do not change their established contents for UI performance |
| General evidence generator | `scripts/generate-evidence.mjs` | Uses external evaluation-directory inputs; Cloud must not depend on those local paths |
| Delivery and validation | `.github/workflows/deploy-pages.yml`, `.github/workflows/validate-local-assessment.yml`, `package.json`, `vite.config.ts` | Static build, Node 22 CI, Pages subpath `/queens-model-assessment/` |

Read the actual code before editing; this is a map, not an instruction to use
specific line numbers or keep an unsuitable abstraction.

## Stage 1 — Stabilize loading and transitions

Keep the header, chapter hero, navigation and main landmark structurally
consistent between the lazy-module fallback, JSON-loading state and loaded
chapter. Design one coherent loading shell rather than a sequence of short
paragraphs with very different heights. Prefer a shared, lightweight shell
available without importing the full chapter. Avoid a circular dependency
between App's UI helpers and lazy chapter modules.

Reserve meaningful geometry for the hero and initial results area; use a
flex/min-height page shell so the footer cannot flash high in the viewport.
Size the shell for actual responsive content rather than a single desktop
pixel height. Cover both module loading and data loading. Below-fold sections
need sensible placeholders when deferred. Do not create large permanent blank
areas or hide loaded content just to improve a metric.

Preserve keyboard focus, the skip link, `main-content`, existing section
anchors and readable error states. Use `role="status"`/`aria-busy` where useful
without repeated announcements; decorative skeleton shapes should be hidden
from assistive technology. Respect reduced motion and avoid mandatory shimmer.
Test mobile, desktop, slow responses and a failed fetch. Navigation away while
loading must not leave a stale chapter in the new route.

Acceptance: under a comparable slow-data/mobile local test, the complete
initial loading sequence has a layout-shift score below 0.1, preferably below
0.05, with no visible footer flash. Report the actual test conditions and do
not present a local lab score as a field Core Web Vitals result.

## Stage 2 — Give shared JSON a single owner

Introduce a small typed loader/cache or lift data ownership to a suitable
shared parent. Start with pricing and scoreboard; migrate additional loaders
only when there is a clear benefit. A query-library dependency is not required.
Normalize saved-artifact URLs with `import.meta.env.BASE_URL`; never turn them
into localhost inference requests.

Define and test these semantics:

- Concurrent consumers share one in-flight fetch and parsed result per key.
- Unmounting one consumer does not abort another consumer's request. Do not
  attach a consumer-owned AbortController to a globally shared promise without
  an ownership strategy.
- Failed requests are not cached forever as a rejected promise or successful
  empty result. Provide explicit user retry or a documented eviction policy;
  avoid automatic retry storms.
- Ignore stale completions on route/study changes. React StrictMode's effect
  setup/cleanup must not break consumers or multiply fetches unexpectedly.
- Validate relevant payloads before publishing them to the UI; distinguish
  unavailable data from zero tokens, zero cost or zero correct answers.
- Bound cache lifetime/size. Key immutable derived data by snapshot/version;
  treat mutable pointers and pricing provenance explicitly. A page reload may
  refresh data, but do not mix two snapshots in one screen.

Preserve editable financial rates and their scope. Shared fetched tariffs are
reference data; they must not overwrite user edits in another view or imply
that hosted provider fees were paid for local inference.

Acceptance: two simultaneous consumers get the same validated result from one
fetch/parse; one unmount cannot cancel its peer; failure/retry works; route
changes do not display stale results. Compare normal-cache and forced-cache-off
network counts separately. Tests should exercise these behaviors rather than
merely mirror the cache implementation.

## Stage 3 — Defer optional UI and split chapter code

After stable loading and shared fetching, split significant route-specific
modules out of the entry graph. Prioritize chapters not needed by the root,
local chapter or atlas. Consider extracting Atlas and its detail view, and
moving shared UI/types into a neutral module so route extraction does not
pull App and every chapter back into each chunk. Use the production bundle
graph to choose boundaries; avoid a chunk per tiny component or dozens of
extra requests on the critical path.

Gate expensive disclosure children on first open where useful. Preserve native
`details` keyboard semantics, useful default content and reopening state. Do
not silently break anchor navigation, browser find expectations, print output
or links into a closed section; document the selected tradeoff or keep those
sections mounted. For below-fold replays, consider near-viewport loading with
an accessible explicit-load fallback and reserved panel geometry. The first
meaningful chart should remain promptly available.

Acceptance: opening the root does not eagerly load unrelated chapter modules;
hidden heavy data waits for the documented intent/visibility trigger; route
refresh, hash navigation, browser Back/Forward, anchors, disclosures and replay
controls work. A 20% reduction from the 174 kB gzip common entry JS is a useful
initial goal, not permission to damage usability to meet a byte number.

## Stage 4 — Split local study data using additive derived artifacts

Do not rewrite `public/evidence/local-qwen/index.json`, frozen catalogs,
manifests or receipts merely to shrink the presentation payload. The current
offline verifier expects the active catalog to match its canonical derivation.
Create a versioned presentation layer derived deterministically from saved,
already-public evidence instead. Existing canonical URLs remain authoritative.

Suggested shape (adapt names after inspecting contracts):

- A small entry pointer identifies one immutable presentation version and its
  source snapshot/hash.
- An overview contains study identities/configurations, recorded/planned counts,
  all mutually exclusive outcomes, per-arm/per-size totals needed by overview
  and sampling tables, audit lineage, provenance, and sufficient cost totals.
- Per-study files contain the detailed rows required for selected charts,
  receipt lists, pairing links and selected-study cost controls.
- Individual request/response/image artifacts remain on demand at their
  existing paths. Receipt deep links can resolve their study directly instead
  of loading every study first.

Do not assume that overview rows are dispensable: FreshCoverage, sampling
tables, study-wide costs and selected loop audits currently use them. Enumerate
their data needs first. Precompute sufficient statistics using existing grading
and cost definitions; do not approximate or create a second interpretation of
missing tokens, rescuing, pairing or planned denominators. Editable rates can
use exact token totals only when the included cohort/missingness rules match.

Initial route load should fetch overview plus the default/requested study, not
all studies. Fetch another study on selection; show a stable section loading
state and preserve the prior selection only if clearly labeled. Key requests
by snapshot and study; rapid switches must not install old results. Unknown
study/call IDs should yield a useful unavailable state, not a substituted
receipt. Preserve direct links, peer chains, filters, study defaults and cost
scopes.

Write a standalone derivation step that works from a fresh Cloud clone using
committed public data only. It should be deterministic, idempotent and fail on
invalid references or schema mismatch. Use immutable versioned paths; publish
the small mutable pointer together with compatible UI. Future nightly imports
should regenerate the presentation data without manual editing, so document
and integrate that step into the appropriate workflow. Do not run the existing
external-source importer/generator destructively in Cloud.

Acceptance: exact parity with canonical evidence for all study summaries,
selected rows and financial totals, including partial studies and audit-only
cohorts. Historical artifacts remain byte-identical. Aim for overview plus one
study to transfer at most 25 kB gzip of local-study JSON, versus the current
60.4 kB all-study JSON; measure and explain if preserving necessary fields
requires more. This target excludes JS, CSS and separately loaded pricing.

## Stage 5 — Slim atlas discovery without weakening search or evidence

Generate an additive compact search/list index from the committed public
manifest. Retain every field that current search, filters, visible summaries,
outcome labels, counts, exclusion controls and ID links actually require.
Measure what contributes most to the 9.34 MB decoded manifest before choosing
the representation. Keep full details and raw files available on demand.

For detail routes, use an ID-to-detail map, deterministic safe mapping or
bounded shards so lookup does not need the full manifest. Preserve punctuation
and escaping in IDs, path safety, grade-source records and receipt-chain links.
Do not derive a new meaning of model failure versus transport failure or remove
excluded records from direct access. Search must still cover the entire index,
not just the first 30 rendered records. Do not call fallback rows a fully loaded
catalog; distinguish loading, partial fallback, error and successful empty
search. Add an explicit full-index-ready signal if useful for testing.

Keep the canonical full manifest as an audit/download artifact. Generate the
compact index from it without needing the author's private evaluation folders.
If a slimmer single index suffices, prefer it over a complex worker or
partitioned-search system. Consider a worker or chunked search only if profiling
shows blocking work after the payload improvement. Pagination alone does not
reduce the current full-manifest download.

Acceptance: parity of record IDs, included/excluded counts, filters, search
matches, visible summaries and representative detail links, including excluded
and grade-only records. Baseline: 5,432 total, 5,422 included, 10 excluded;
derive current expected counts when the underlying snapshot changes. Aim for
an initial compact atlas index below 175 kB gzip and 3 MB decoded, and report
the actual result. These are engineering targets, not a reason to omit content.

## Scientific and financial invariants

Retain strict correct versus correct-but-misformatted outcomes, token caps,
client loop-stops, shadow observations, incorrect completions and pending calls.
Preserve planned versus recorded denominators and distinguish primary attempts
from rescues and selected audits. Do not pool repeated boards into independent
puzzles or infer a causal Caveman advantage from these exploratory samples.
Model size, decoding, budget, board set, prompt arm, round and stop policy stay
visible and separate. Preserve cost estimates' tariff date/provenance, exact
input/output-token accounting, missing-usage handling, baseline comparison,
rescue-inclusive options and the fact that actual local provider fees are $0.

The original `#/caveman-summary` and `#/local-open-models` cover the 4B pilot;
expanded studies are on `#/local-qwen`. Do not imply this optimization expands
historical chapter scope. Include route coverage in the PR description.

## Validation and evidence to return

Use Node 22 as CI does, install locked dependencies with `npm ci`, and run:

```sh
npm run build
npm run ollama:test
npm run ollama:verify
npm run boards:verify
npm run evidence:check-public
```

These Ollama-named tests/verification commands operate on saved evidence; do not
start Ollama or issue inference. Run additional route, receipt, trajectory and
table-header checks appropriate to the components changed after inspecting
their invocation requirements. Some legacy generators require external source
directories: do not fabricate them or regenerate frozen evidence to make a
Cloud-only check pass. Record environmental limitations explicitly.

Add focused checks for shared-request lifecycle, derived-data parity,
deterministic generation, snapshot consistency, deep-link resolution and
malformed/missing data. Cover at least one partial study, one loop audit,
multiple arms, missing usage, and rescue costs. Assert unchanged frozen hashes
or a scoped before/after inventory. Do not commit a giant rebuild of unrelated
evidence.

Use browser checks on a local production build for desktop and mobile:

- Direct-load root, local overview, a selected study, local receipt plus paired
  peer, atlas list and detail, and one excluded record.
- Slow/stalled/failed JSON and lazy JS; recovery; rapid study/route switching;
  Back/Forward; keyboard and section links.
- Open/reopen disclosures, load replays, change rates and sizes, search/filter
  the complete atlas, load more rows, download/view saved receipt artifacts.
- Inspect horizontal overflow, focus, landmarks, status announcements and
  reduced-motion behavior. Record console errors and failed requests.

For before/after loading evidence, use comparable settings and at least three
samples if claiming timing improvements. A small targeted local comparison is
enough; a complete rerun of the public-site investigation is not a prerequisite.
Keep normal-cache empty contexts separate from forced-cache-off tests. Count
actual transferred bytes (cache hits may have nonzero `encodedBodySize` but zero
`transferSize`). Local servers may differ from Pages in compression and caching:
report raw sizes and offline gzip sizes separately, never label uncompressed
localhost transfer as production gzip. Separate LCP from complete-index/data
readiness; do not hardcode 5,422 as the only future valid catalog. The optional
historical lab template uses that dated count and must be adapted before reuse.

Return a before/after table for common JS, route data gzip/decoded size, relevant
request counts, mobile loading shift and data readiness when measured. Include
conditions, repetitions and any deferred goals. Do not claim field percentiles,
INP improvements or hosting latency wins without evidence. Broader public-site
testing is optional and must respect the permissions of the Cloud session.

## Suggested review sequence and delivery

Keep this branch as the handoff base. Prefer small reviewable commits; split
into stacked PRs only when dependencies and review size warrant it:

1. Loading shell and shared resource lifecycle, with focused UI/network checks.
2. Route/optional-content splitting, with navigation and accessibility checks.
3. Additive presentation generators/contracts and inactive derived data, with
   exact parity and frozen-hash verification.
4. Local/atlas frontend activation using those contracts, with end-to-end
   validation, measured results and documentation.

For a stack, first PR targets `main`, later PRs target their immediate parent;
identify base/head, review order, parent/child links and the final activation PR.
Keep each layer valid if merged in order. Evidence/content should be separately
reviewable from activation when the generated diff is large. These guidelines
apply to new derived presentation files, not to rewriting historical receipts.
After a parent is squash-merged, verify the remaining diff rather than assuming
retargeting removes its changes. Do not force-push without approval.

Conclude with PR links, changed routes, measured outcomes, validation results,
remaining tradeoffs and a concise reviewer checklist. Commit and push to the
initiative branch or clearly named child branches; ask Joey to review. Stop
before merging, enabling auto-merge or changing the production host. If merely
opening a Cloud preview, identify it as a preview and do not imply Pages has
changed. The Mac's existing localhost/Tailscale service is outside the Cloud
task; do not try to reconfigure it remotely.

## Copyable instruction for Claude Cloud

> Continue `codex/static-site-performance-improvements` in
> `JoeyWilkes12/queens-model-assessment`. Read
> `docs/static-site-performance-improvements-plan.md` and the committed browser
> assessment it links. Implement the prioritized loading-layout, shared-fetch,
> route/data-splitting improvements, preserving frozen evidence, direct links,
> scientific denominators and financial calculations. You have network egress;
> use the existing measurements rather than requiring a full reproduction.
> Validate changed behavior with a local build and applicable offline audits,
> document before/after results, and deliver reviewable PRs. Stop before merge,
> production deploy, new inference, or changes to benchmark jobs. Ask if a
> necessary change would alter the scientific evidence or interpretation.
