# SubQ Snap new-board panel: results

Run on **15 October 2026** under the frozen [preregistration](subq-panel-preregistration.md), with one pre-data amendment (independent re-certification and a label-alignment covariate). No other deviation occurred. Receipts for every call are published in the evidence bundle under study `2026-10-15-subq-new-board-panel`.

## Table of contents

- [What was run](#what-was-run)
- [Primary endpoint](#primary-endpoint)
- [Boards solved and baselines](#boards-solved-and-baselines)
- [Secondary endpoints](#secondary-endpoints)
- [Covariate from amendment 1](#covariate-from-amendment-1)
- [Interpretation](#interpretation)
- [Cost, failures and provenance](#cost-failures-and-provenance)

## What was run

- **Boards:** 192 new boards, 64 per size (5×5, 7×7, 9×9). Each was certified by two independent solvers, plus a third brute-force check by the orchestrator, and stratified by singleton regions × search difficulty, with half from each of two generators.
- **Protocol:** identical to the historical trajectory study. Choose a color, then a cell; stop at the first local violation or unextendable prefix; no feedback or backtracking; single-option menus forced without a call.
- **Attempts:** one raw-menu and one conflict-filtered attempt per board, 384 trajectories in a seeded, interleaved order.
- **Model:** `subq-snap-preview`, called directly through the contained runner. Every call returned that model identifier.
- **Pilot:** two trajectories on separate development boards, reviewed before the panel; reported separately.

## Primary endpoint

Paired board-level success, filtered vs raw menu, within each size. Exact two-sided McNemar test, Holm-adjusted across the three sizes.

| Size | Both solved | Raw only | Filtered only | Neither | Exact p | Holm p |
|---|---:|---:|---:|---:|---:|---:|
| 5×5 | 5 | 1 | 10 | 48 | 0.012 | **0.035** |
| 7×7 | 0 | 0 | 3 | 61 | 0.25 | 0.50 |
| 9×9 | 0 | 0 | 0 | 64 | 1.0 | 1.0 |

At 5×5, the conflict filter improved SubQ's first-path success by 14 percentage points (filtered 15/64 vs raw 6/64). That is significant after Holm adjustment. At 7×7 the direction matches, but three discordant boards cannot establish an effect. At 9×9 neither mode solved any board. As the preregistration warned, the larger sizes are precision results: absence of significance there is not evidence of no effect.

## Boards solved and baselines

A board counts as solved if either attempt solved it.

| Size | SubQ Snap | Greedy rule (no model) | Random choice, expected |
|---|---:|---:|---:|
| 5×5 | 16/64 | 42/64 | 6.0 |
| 7×7 | 3/64 | 24/64 | 0.9 |
| 9×9 | 0/64 | 14/64 | 0.1 |
| All | **19/192** | **80/192** | **≈7** |

Board solve rates with 95% Clopper–Pearson intervals, per mode:

| Size × menu | Solved | 95% interval |
|---|---:|---:|
| 5×5 filtered | 15/64 (23%) | 14%–36% |
| 5×5 raw | 6/64 (9%) | 4%–19% |
| 7×7 filtered | 3/64 (5%) | 1%–13% |
| 7×7 raw | 0/64 | 0%–6% |
| 9×9 filtered | 0/64 | 0%–6% |
| 9×9 raw | 0/64 | 0%–6% |

SubQ clearly beats random choice under the same protocol. It is far below the greedy most-constrained-color rule, which solves four times as many boards and is the only policy here that solves any 9×9.

## Secondary endpoints

| Size × menu | Mean correct placements | Non-forced cell calls | Picked an extendable cell | Random, same menus | Mean stated probability | ECE |
|---|---:|---:|---:|---:|---:|---:|
| 5×5 filtered | 1.64 | 71 | 31.0% | 32.7% | 43.9% | 0.147 |
| 5×5 raw | 1.34 | 102 | 43.1% | 22.9% | 42.0% | 0.094 |
| 7×7 filtered | 1.42 | 88 | 30.7% | 26.2% | 37.2% | 0.087 |
| 7×7 raw | 0.86 | 82 | 22.0% | 18.4% | 32.3% | 0.139 |
| 9×9 filtered | 1.14 | 85 | 24.7% | 23.1% | 32.5% | 0.122 |
| 9×9 raw | 1.03 | 90 | 28.9% | 18.9% | 32.2% | 0.085 |

Across all 518 non-forced cell decisions, SubQ chose an extendable cell 30.5% of the time, against 23.4% for a uniform pick from the same menus. The edge appears mainly on raw menus, where random choice often lands on an illegal cell. On filtered menus it is close to chance. Stated confidence exceeds accuracy in every cell except one.

## Covariate from amendment 1

Region letters follow first appearance, so some solutions align with letter order. Fully aligned boards were not solved more often: at 5×5, 3/24 aligned trajectories solved against 18/104 for unaligned ones; at 7×7, 0/8 against 3/120. There is no sign that SubQ exploited letter order.

## Interpretation

- The original nine boards suggested SubQ completes some 5×5 boards with filtering and none larger. The panel confirms this with intervals. It adds a significant filtering effect at 5×5, and three 7×7 solves the small sample could not reveal.
- The greedy baseline is the most important comparison. A one-line constraint heuristic outperforms SubQ at every size. SubQ's sequential choices therefore do not yet reflect the most-constrained-first reasoning that classic constraint solvers use.
- Jev 1.13 has not been run on this panel: the OpenRouter key is unavailable on this device. Until it is, this panel is not a model comparison.

## Cost, failures and provenance

- **Calls:** 1,330 model calls for the panel and 7 for the pilot. There were no provider failures, censored trajectories or retries.
- **Spend:** the shared ledger's estimated known spend rose from $0.087 to $0.166, plus an unchanged $0.059 unresolved reserve from earlier campaigns. Provider billing is unconfirmed.
- **Evidence:** receipts are in `public/evidence/runs/2026-10-15-subq-new-board-panel/`, with summaries, trajectories and the analysis (including per-option oracle labels) in `public/evidence/subq-panel/`.
- **Reproduction:**
  - corpus: `scripts/subq/boards.py`
  - plan and run: `scripts/subq/trajectories.py`
  - analysis: `python3 scripts/subq/trajectories.py analyze --output output/subq-panel --corpus public/evidence/subq-panel/corpus.json --report <path>`
