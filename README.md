# Queens assessment book

This is the static-compatible Vite + React + TypeScript companion to the expanded Queens model assessment. It turns the report into a responsive technical book and exposes a sanitized evidence atlas at `/evidence/manifest.json`.

Published site: [Queens model assessment](https://joeywilkes12.github.io/queens-model-assessment/)

## Table of contents

- [Routes](#routes)
- [Evidence boundary](#evidence-boundary)
- [Local handoff](#local-handoff)
- [Design and quality records](#design-and-quality-records)

## Routes

The app uses hash routing so a static host can serve every page without rewrite rules:

- `#/executive-summary`
- `#/assessment-receipt`
- `#/queens-rules`
- `#/how-z3-solves-queens` (How Z3 solves Queens; see below for its section links)
- `#/protocol-results`
- `#/earlier-generations`
- `#/jev-primer`
- `#/candidate-engineering`
- `#/scale-primitives`
- `#/jev-trajectories`
- `#/decision-models` (Decision models vs the Artificial Analysis Decision Index; `#/openai-decisions-plan` opens its OpenAI section)
- `#/subq-assessment`
- `#/evidence-atlas`
- `#/methods-sources`
- `#/methods-critique`
- `#/about`

The evidence atlas also supports `#/evidence-atlas/<record-id>` detail routes.
How Z3 solves Queens deep-links each section as `#/how-z3-solves-queens/<section-id>`: chapters 1–9 (`z3-variables`, `z3-clauses`, `z3-propagation`, `z3-search`, `z3-conflict`, `z3-learning`, `z3-confinement`, `z3-uniqueness`, `z3-engine`), Chapter 10's rule workbench (`z3-workbench`), the kernel experiment (`z3-experiment`) and the closing Beyond Queens appendix (`z3-beyond`). The standalone [Constraint Atlas site](https://joeywilkes12.github.io/constraint-atlas-queens/) is kept as a backup; its content now lives in this part (Chapter 10, the Chapter 2 sidebar on other models, the appendix and its citations). Re-check the part's evidence, the workbench counter and its SMT-LIB exports with `Z3_PYTHON=<python with z3-solver 4.16> npm run z3:verify`.
Recorded adaptive SubQ attempts support `#/subq-assessment/<trajectory-id>` deep links.

Both Jev and SubQ have interactive saved-state playback with Play/Pause, previous/next states, and a scrubber. Each frame distinguishes model choices, forced harness decisions, and evaluator outcomes, with links to the actual API receipts. This is an explanatory replay, with an illustrative cadence, rather than measured model timing.

The 719 genuine trajectory receipts have **Previous Receipt**, **Next Receipt**, and **Play full attempt** controls. Their order comes from the recorded steps of one game attempt. Forced transitions have no fabricated receipts, and the last request never advances into another repetition. Frozen-state replays and standalone probes do not acquire guessed chains.

After changing public trajectory sources, regenerate and verify the navigation snapshot:

```sh
npm run receipts:generate
npm run receipts:verify
```

## Evidence boundary

Only sanitized records placed in `public/evidence/manifest.json` are rendered. Private answer keys, credentials, encrypted reasoning, and raw repository paths must not be copied into that manifest. The generated bundle includes exact prompt text, model-visible responses, deterministic grades, request metadata, and decoded content-addressed copies of the three input board images.

The October 13 SubQ chapter and executive-summary update read the saved [SubQ summary](public/evidence/subq-summary.json), with exact request links into the same evidence atlas. HTTP completion, deterministic correctness, unattempted requests, and estimated cost are distinct. Frozen historical move states are not new adaptive trajectories. The [provider and containment reference](docs/subq-provider.md) is also [available in the public evidence bundle](public/evidence/subq-provider.md).

Fresh empty-board construction reads the separate [adaptive trajectory summary](public/evidence/subq-trajectories-summary.json). The [split-batch summary](public/evidence/subq-split-summary.json) reports an adapted sixteen-plus-nine question treatment separately from the original twenty-five-question requests, including their retained HTTP 422 and not-run outcomes. None of these denominators are added together as puzzle accuracy.

The [OpenAI Decisions plan](docs/openai-decisions-plan.md), also [published with the evidence](public/evidence/openai-decisions-plan.md), describes a future experiment. No OpenAI result, verified account access, or inference spend is claimed. The incomplete historical PDF has been removed; the current book and its receipts are the publication.

The [methods critique](docs/methods-critique.md) reviews construct validity, sample size and power, baselines, confounds and next experiments. Reproduce its statistics offline with `python3 -I scripts/analysis/methods_critique_calculations.py`.

The Decision models page reads a [data snapshot of the Artificial Analysis Decision Index](public/evidence/external/aa-decision-index-2026-10-14.json), extracted from the public leaderboard page on 14 October 2026. Charts are redrawn from that data. Full third-party page captures are kept locally under `research/` (git-ignored) for provenance and are not redistributed.

## Local handoff

```bash
npm install
npm run dev
```

Use `npm run evidence:generate` to explicitly refresh the historical evidence bundle when its source studies are available. Development and build do not regenerate it automatically. Preserve the published SubQ records when refreshing that historical bundle. The October 1 earlier-generations chapter is backed by a generated summary, report, frozen protocol, adaptive schedule amendment, review notes, and the same request, response, metadata, grade, and image receipts used by the evidence atlas. The separately published GitHub Pages repository builds the same site source at its repository root.

## Design and quality records

- [Product contract](PRODUCT.md)
- [Design system](DESIGN.md)
- [Evidence bundle contract](evidence/README.md)
- [Quality check](QUALITY_CHECK.md)
