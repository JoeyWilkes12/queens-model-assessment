# SubQ Snap new-board panel: preregistration

Frozen **15 October 2026**, before any SubQ request for this study. This document fills every item of the [methods critique section 9 checklist](methods-critique.md#9-preregistration-checklist) for experiment 4 of [section 8](methods-critique.md#8-should-we-run-more-experiments): *filtering improves first-path success on unseen boards*. It is a plan, not a result. No board in this panel has been shown to any model.

## Table of contents

- [1. Question and estimand](#1-question-and-estimand)
- [2. Frozen board corpus](#2-frozen-board-corpus)
- [3. Development set and pilot](#3-development-set-and-pilot)
- [4. Model, service and alias drift](#4-model-service-and-alias-drift)
- [5. Protocol: prompts, option order, forced transitions, stopping](#5-protocol-prompts-option-order-forced-transitions-stopping)
- [6. Endpoints and analysis](#6-endpoints-and-analysis)
- [7. Alpha, multiplicity, power and confirmatory status](#7-alpha-multiplicity-power-and-confirmatory-status)
- [8. Failures, censoring, retries and early stopping](#8-failures-censoring-retries-and-early-stopping)
- [9. Requests, cost, exposure and the ledger](#9-requests-cost-exposure-and-the-ledger)
- [10. Exact command sequence](#10-exact-command-sequence)
- [11. Checklist coverage](#11-checklist-coverage)
- [12. Amendments](#12-amendments)

## 1. Question and estimand

**Question.** On new, certified boards, does SubQ Snap complete a regional Queens board more often when each cell menu is filtered to immediately legal cells ("local") than when it lists every cell of the chosen region ("raw")?

**Estimand.** For each size *s* ∈ {5, 7, 9}, the difference P(local solves) − P(raw solves) for one first-path attempt per board and menu mode. It is estimated over the frozen stratified corpus below, under the historical color-then-cell interface. The unit of analysis is the **board**, and the comparison is paired within board.

**What it measures.** The total effect of filtering on the model–harness system. Filtering also raises the success probability of a policy that picks uniformly at random. For example, the corpus's mean random-policy completion at 5×5 is 9.2% local against 0.27% raw. Secondary endpoints compare each mode with its own random and greedy baselines, so the model's contribution is not confused with the filter's.

**Population.** The panel draws equally from 12 design strata, not from the natural output distribution of either generator, and not from LinkedIn puzzles. Panel-level rates describe this design. No population estimate is claimed.

## 2. Frozen board corpus

| File | Role | sha256 |
|---|---|---|
| [`public/evidence/subq-panel/corpus.json`](../public/evidence/subq-panel/corpus.json) | 192 test boards | `468a6a36d941c8143fdd9d39c1ea23d6a8c2da03a240c4743fcefda3fc6e7216` |
| [`public/evidence/subq-panel/development-corpus.json`](../public/evidence/subq-panel/development-corpus.json) | 144 development boards | `e226a73f5c0128b228caff381ed626c2d7803d8cf6a4555908d2d191cdfc680a` |
| [`public/evidence/subq-panel/acceptance-log.json`](../public/evidence/subq-panel/acceptance-log.json) | Outcome of every candidate | `9d4e700144fd08bdfd10bf22e174f3b23fda2e5cb414e9a609dcb7afb5c6f7ed` |

Produced by `python3 scripts/subq/boards.py build-panel` (generator version `boards.py/1`, standard library only, deterministic). Ground-truth solutions are written only to the ignored `scripts/subq/input/panel-private/solutions.json`. Each public board carries `solution_sha256`, the sha256 of its compact JSON column vector. The board determines its unique solution, so this hash is an integrity commitment, not secrecy.

### Generators and seeds

- **Solution-first growth** (`solution_first_growth`): sample a non-touching permutation by randomized backtracking and seed one region per queen. Grow regions by randomized weighted frontier growth with log-normal region weights. Then repair to uniqueness: while a second solution exists, move one of its queen cells into an adjacent region. The donor stays connected with at least 2 cells, planted queens never move, and at most 60 moves are allowed.
- **Partition-first Voronoi** (`partition_first_voronoi`): choose *n* random seed cells, assign the rest by weighted Manhattan distance plus noise, then release and re-grow disconnected fragments. No solution is planted and there is no repair. A board is kept only if it is uniquely solvable (pure rejection).
- Each candidate's RNG also draws `locked_singletons` (0 with probability 1/2, otherwise 1 with probability 0.6, else 2) and `weight_sigma` ∈ [0.2, 1.5]. These parameters only bias shapes; the stratum is always computed from the finished board.
- Regions are relabelled by first appearance in row-major order, the historical convention. Without this step, solution-first labels would follow the solution's rows and leak it into model-visible letters.
- **Seeds:** development master seed `2026101401`, panel master seed `2026101501`, schedule seed `2026101502`. Candidate seed = first 8 bytes, big-endian, of `sha256("queens-subq-panel/boards.py/1/<master>/<generator>/<size>/<index>")`. Every candidate is individually reproducible.
- **Budgets:** candidates per size and generator: 60,000 (5×5), 150,000 (7×7), 400,000 (9×9). The same again was allowed for top-up. None was needed.

### Certification and exclusions

- Every region is orthogonally connected.
- Two independent solvers must each report exactly one solution, and the same one: (i) row-by-row column backtracking; (ii) bitmask region DFS with minimum remaining values. At prepare time, `replay.solutions`, the historical grader, checks the solution a third time, along with the solution commitment and the board hash.
- **Symmetry:** canonical form = the minimum, over the 8 rotations and reflections, of the grid relabelled by first appearance. A candidate is rejected if its canonical form equals one of the nine historical boards, a development board or an earlier accepted board.

### Strata (rule fixed before the development pool and panel were generated)

- **Singleton status:** has ≥ 1 single-cell region vs none.
- **Difficulty tier:** the tier metric is the mean, over the 8 dihedral orientations, of log2(row-solver uniqueness-proof nodes). A node is one tentative placement that passes the column, region and previous-row touch checks, with rows top to bottom and columns left to right. Averaging over orientations makes the tier independent of how the board is drawn. `lower_search` means the metric is ≤ the median of the development pool for the same size and singleton status; `higher_search` means it is above that median.
- **Cutoffs (log2 nodes):** 5×5 singleton 4.569, none 4.968; 7×7 singleton 7.275, none 7.813; 9×9 singleton 9.666, none 10.753.
- **Quotas:** 64 boards per size, 16 per stratum, 8 per generator per stratum. Phase 1 fills each generator's own quota. Phase 2 (top-up) would let the other generator fill a stratum that one generator could not fill within budget; it is recorded as `top_up`. Any gap that remains is recorded as a shortfall and never substituted from another stratum.
- **Why not "propagation-solved" as the tier:** with only the singleton rule and elimination, a board with no singleton region never starts propagating. That would leave one stratum structurally empty.

### Result: no shortfall

| Size | Singleton, lower | Singleton, higher | None, lower | None, higher | Greedy solves | Propagation solves |
|---|---:|---:|---:|---:|---:|---:|
| 5×5 | 16 (8+8) | 16 (8+8) | 16 (8+8) | 16 (8+8) | 42/64 | 22/64 |
| 7×7 | 16 (8+8) | 16 (8+8) | 16 (8+8) | 16 (8+8) | 24/64 | 11/64 |
| 9×9 | 16 (8+8) | 16 (8+8) | 16 (8+8) | 16 (8+8) | 14/64 | 5/64 |

In each stratum cell, "(8+8)" means 8 solution-first and 8 partition-first boards; no top-up was used. Mean uniform-random completion probability, local / raw: 5×5 9.2% / 0.27%; 7×7 1.4% / 0.006%; 9×9 0.23% / 0.0001%. Per-board profiles in the corpus include region sizes, Gini and max/min ratio, propagation counts and rounds, search nodes for both solvers (first solution and uniqueness proof), greedy outcome, and exact random-policy probabilities.

### Acceptance and rejection counts

| Corpus | Candidates | Accepted | Quota full | No solution | Multiple solutions | Repair exhausted | Enclosed cell |
|---|---:|---:|---:|---:|---:|---:|---:|
| Development | 48,273 | 144 | 405 | 41,148 | 5,967 | 597 | 12 |
| Test panel | 68,784 | 192 | 727 | 58,773 | 8,271 | 804 | 17 |

No candidate was rejected as a symmetry duplicate, a solver disagreement or a disconnected region. Partition-first at 9×9 needed 59,561 candidates to fill its 32 test slots (the development pool needed 42,578 for 24). Its no-singleton strata were the slowest to fill. The acceptance log stores one reason code per candidate.

**Exploration disclosure.** Generator shapes, the uniqueness repair and the tier rule were chosen after exploratory runs with master seeds 1 and 2. Those runs belong to no corpus. The development pool and the panel were then generated in one deterministic build. The tier cutoffs come only from the development pool. Under the panel rule, the nine historical boards fall into: singleton/lower 3, singleton/higher 5, none/higher 1. They are excluded from the panel by symmetry check.

## 3. Development set and pilot

- **Development boards** (144: 12 per generator × singleton status × size) set the tier cutoffs and supply the pilot. They are never part of a confirmatory analysis and are deduplicated against the panel and historical boards.
- **Pilot:** two trajectories on development boards, one per mode. They are `dev-9-01` raw (solution-first, no singleton, higher tier) and `dev-9-02` local (partition-first, singleton, lower tier). Study id `2026-10-15-subq-new-board-panel-pilot`, output `output/subq-panel-pilot`. 9×9 boards exercise the largest requests. The pilot checks operations only: isolation, broker, ledger continuity, guard accounting, receipts, audit and analysis. Its outcomes are not tested for any hypothesis.
- **No tuning.** The prompts are the frozen historical templates (section 5), and no tuning is planned. If the pilot reveals a harness defect, it is fixed and re-piloted on `dev-9-03` raw and `dev-9-04` local. This is recorded as an amendment before the first test-panel call.

## 4. Model, service and alias drift

- **Model:** `subq-snap-preview`, the only model the broker allows. Requests go through `POST https://api.subq.ai/v1/systemone` via the containment broker (see [provider reference](subq-provider.md)).
- **Discovery and returned model:** each session first checks `GET /v1/models`; the run stops if the alias is absent. Every response must report `model == "subq-snap-preview"`, or the grader marks a schema failure and the run stops.
- **Alias drift policy:** the provider exposes no version beyond the preview alias. Receipts record UTC dates. The target window is 15–22 October 2026. If the panel is not finished by 22 October, the remaining trajectories still run, and the analysis also reports pairs completed by then. If Subquadratic announces a Snap model change during the run, or responses change format, the run stops. Pairs completed before the change form the primary analysis; later pairs are reported as a separate cohort. Both modes of a board run back to back, so no pair straddles a long gap.
- Requests are sequential (one in flight), with no concurrency.

## 5. Protocol: prompts, option order, forced transitions, stopping

- **Prompts:** the unchanged historical templates in [`trajectories.py`](../scripts/subq/trajectories.py): `RULES`, `state()`, `region_question()`, `cell_question()` and `request()`. They are identical to commit `4b879b0`. Preparing the historical corpus re-verifies them against all 394 retained Jev trajectory calls. Request bodies contain only `model`, `state` and `questions`.
- **Model-visible content:** the board id (neutral: `panel-<size>-<NN>`, numbered in a seeded shuffled order), size, rules, coordinate note, region letter grid, region cell lists, placed queens, instruction, and the selected region for cell questions. Stratum, generator, profile, seeds, solution and solution hash are never sent. Tests check every panel board's requests.
- **Option order:** fixed and canonical, as in the historical study: open regions alphabetically, cells row-major. Order is not randomized in this panel. The position confound is known and is the subject of separate experiment 5.
- **Menus:** raw lists every cell of the chosen region. Local removes cells that conflict with a placed queen by row, column, region or touch, and nothing else. The full solver never filters options.
- **Forced transitions:** when exactly one region is open, or a cell menu has one entry, the harness takes it without a model call and counts it as a forced decision.
- **Executing choices:** the returned `choice` is executed even if another option has a higher probability.
- **Stopping:** an attempt stops at the first locally illegal placement (`local_rule_violation`), the first legal but off-solution placement (`globally_unextendable_prefix`), an empty local menu (`no_locally_legal_cell`), or completion. There is no feedback, backtracking or solution information upstream.
- **Repeats:** exactly one attempt per board and mode (384 trajectories).
- **Schedule:** seed `2026101502`. Boards are shuffled within each size and dealt in 64 blocks; each block holds one board of each size in a shuffled size order. Both modes of a board are adjacent. In each size, 32 boards run raw first and 32 local first. `prepare` freezes the schedule into the plan, and `run` refuses an output directory holding a different plan.

## 6. Endpoints and analysis

All analysis is offline, after the run, with `trajectories.py analyze` (no API dispatch). That command reproduces the methods-critique SubQ figures exactly from the historical receipts.

**Primary endpoint.** Within each size, paired board-level success, local vs raw. The test is the exact two-sided McNemar test (binomial test on discordant pairs, *b* = raw-only, *c* = local-only). The report gives *b*, *c*, both, neither, the difference (*c* − *b*)/*N* and the Clopper–Pearson 95% interval for *c*/(*b* + *c*). Complete pairs only (section 8).

**Secondary endpoints** (descriptive; not multiplicity-adjusted):

1. Board solve rate per size × mode, with a Clopper–Pearson 95% interval.
2. Prefix survival *S(k)* = P(≥ *k* correct placements), per size × mode, for all placements and separately counting only non-forced cell decisions.
3. Non-forced cell accuracy (chosen cell extendable) against uniform chance at the same menus (mean of extendable options ÷ menu size), per size × mode.
4. Baselines: greedy solves on the same boards, and expected random-policy solves (Σ of exact completion probabilities) per size × mode.
5. Calibration on non-forced cell calls. Probabilities are normalized by their sum (the grader already requires the sum within 0.02 of 1). Ten equal-width bins with the last closed; bin-weighted ECE; multiclass Brier with extendable options as positives.

**Exploratory:** stratum and generator breakdowns, region-choice patterns, pooled-size contrasts, and decision-level rates weighted by payload or board. These are labelled exploratory wherever reported.

## 7. Alpha, multiplicity, power and confirmatory status

- **Confirmatory family:** the primary endpoint at 5×5, 7×7 and 9×9. Two-sided α = 0.05, familywise, by Holm across the three sizes. No size is dropped or added after the run.
- **Effect size for planning:** 30 percentage points (for example 20% vs 50%), as in the methods critique.
- **Power** of the exact McNemar test at *N* = 64 pairs, where *q* is the discordant fraction:

| Difference | q | Power at α = .05 | Power at α = .0167 (Holm's first step) |
|---|---:|---:|---:|
| 0.30 | 0.3 | 1.00 | 1.00 |
| 0.30 | 0.5 | 0.93 | 0.85 |
| 0.30 | 0.7 | 0.80 | 0.66 |
| 0.20 | 0.3 | 0.83 | 0.67 |
| 0.15 | 0.3 | 0.53 | 0.34 |

- **Honest expectation:** historically SubQ solved 0 of 60 attempts at 7×7 and 9×9 (15 per size and mode). If that holds, there will be few discordant pairs at those sizes, and the test cannot detect a modest effect. Those sizes stay in the confirmatory family, and their estimates and intervals are reported as precision-oriented results. A non-significant result there is not evidence of no effect.

## 8. Failures, censoring, retries and early stopping

- **Evaluable outcomes** (in the denominator): `solved`, `local_rule_violation`, `globally_unextendable_prefix`, `no_locally_legal_cell`, `invalid_complete`. These are puzzle outcomes.
- **Non-evaluable outcomes** (excluded from all endpoints, counted in the denominators):
  - `request_failure`: transport, HTTP or schema failure, or an unexpected returned model.
  - `censored_guard`: a frozen limit would have been exceeded, so nothing was sent.
  - `in_progress`: the process crashed mid-attempt.
  - Unstarted trajectories after a stop.
- **Refusals:** a refusal or unparseable answer is a schema failure (`request_failure`), not a wrong move.
- **No automatic retries.** Any failure stops the run with its receipts preserved. An unresolved attempt blocks continuation until the orchestrator reviews it and records `trajectories.py acknowledge --note`. That makes the attempt terminal: it is never re-run, stays excluded, and its reservation stays counted. Only then may the schedule continue.
- **Pairs:** a pair with any non-evaluable member is excluded from the primary test (complete-case). As a sensitivity bound, the report also recomputes the primary test counting every excluded pair first as raw-only and then as local-only.
- **No interim analysis** and no efficacy or futility stopping. The run ends only when the schedule completes, a guard stops it, a provider failure needs review, or the orchestrator decides to stop. A partial panel is reported as the frozen schedule prefix, with its denominators.

## 9. Requests, cost, exposure and the ledger

**Price:** $0.05 per million input tokens, free output. The broker reserves $0.0196608 (a full 393,216-token context) before each call. It settles to the observed usage on HTTP 200 with valid usage; otherwise the full reserve stays.

**Shared ledger at freeze:** `../subq-assessment/output/subq-ledger/budget.json`, cap $4.50. It holds 1,100 reserved calls, $0.08695505 estimated, and $0.0589824 unresolved, for $0.1459 committed and $4.354 headroom. Both the pilot and the panel must run against this ledger via `--ledger-dir`. Panel modes refuse to start a fresh ledger.

**Estimates** (`trajectories.py estimate`, from the frozen plans):

| Scenario | Panel calls | Panel cost | Pilot calls | Pilot cost |
|---|---:|---:|---:|---:|
| Historical SubQ calls per trajectory × 1,100 tokens (central) | 1,387 | $0.076 | 6 | $0.0003 |
| Same calls × observed tokens by size (739 / 1,115 / 1,630) | 1,387 | $0.077 | 6 | $0.0005 |
| Uniform random policy (exact expected calls) × 1,100 tokens | 1,054 | $0.058 | 5.3 | $0.0003 |
| Every trajectory full length (2*n* − 1 calls) × 1,100 tokens | 4,992 | $0.275 | 34 | $0.0019 |
| Full length × observed tokens by size | 4,992 | $0.313 | 34 | $0.0028 |
| Full length × 5,000 tokens (pessimistic) | 4,992 | $1.248 | 34 | $0.0085 |

The pessimistic 5,000 tokens is a conservative bound. The largest possible panel request is 5,868 bytes. Historically, tokens never exceeded 0.49 per request byte, and a linear fit predicts about 3,040 tokens at that size. For comparison, the estimator recovers the historical SubQ trajectory study exactly (325 calls, $0.0179905).

**Hard limits** (frozen in each plan's `budget_policy`, enforced by the worker before every dispatch):

| Limit | Pilot | Panel |
|---|---:|---:|
| Maximum model calls | 34 | 4,992 |
| Spend ceiling on this output's committed cost | $0.05 | $1.45 |
| Maximum request bytes | 5,101 | 5,868 |
| Shared-ledger cap (estimated + unresolved + next reserve) | $4.50 | $4.50 |

- **Committed cost** = the sum over the output's call receipts of the observed cost, or the full reserve where cost is unknown. This mirrors the broker ledger.
- **Per-call rule:** the call is refused unless calls + 1 ≤ max, committed + reserve ≤ ceiling, ledger + reserve ≤ $4.50, and request bytes are within the bound.
- **Per-trajectory admission rule:** a trajectory of size *n* starts only if it fits in the worst case, with (2*n* − 1) calls and (2*n* − 2) pessimistic calls plus one full reserve.
- **Combined bound:** pilot plus panel cannot exceed **$1.50** of estimated spend. The shared ledger therefore cannot pass $0.146 + $1.50 = $1.646, well under its $4.50 cap. The broker independently refuses any reservation beyond $4.50.
- **Maximum input exposure:** at most 4,992 + 34 requests of ≤ 5,868 bytes each (about 29.5 MB). The ceiling caps billed input at 30 million tokens. Requests carry only public synthetic boards, rules and fixed instructions.

## 10. Exact command sequence

All commands run from the worktree root. Steps 0–1 and 4 are offline. Steps 2–3 start Docker and spend SubQ credit; they require the orchestrator's explicit approval. The key file is read only by `sandbox.py`'s loader and is never printed.

```sh
cd <repository root>   # the panel ran from a dedicated worktree
LEDGER=<shared campaign ledger directory>   # the existing output/subq-ledger, never a fresh one

# 0. Offline checks: frozen corpus hash, full offline test suite (inputs for the
#    older tests are regenerated from public evidence first).
shasum -a 256 public/evidence/subq-panel/corpus.json   # expect 468a6a36...7216
python3 scripts/subq/replay.py prepare --full
python3 scripts/subq/trajectories.py prepare
python3 scripts/subq/split_replay.py prepare
PYTHONDONTWRITEBYTECODE=1 python3 -m unittest discover -s scripts/subq -p 'test_*.py'

# 1. Freeze the two plans (offline) and review the estimate.
python3 scripts/subq/trajectories.py prepare \
  --corpus public/evidence/subq-panel/development-corpus.json \
  --study 2026-10-15-subq-new-board-panel-pilot \
  --select dev-9-01:raw,dev-9-02:local \
  --output scripts/subq/input/panel-pilot/panel-input.json
python3 scripts/subq/trajectories.py prepare --corpus public/evidence/subq-panel/corpus.json
python3 scripts/subq/trajectories.py estimate --input scripts/subq/input/panel/panel-input.json

# 2. Pilot: two development-board trajectories, one per mode (LIVE).
python3 scripts/subq/sandbox.py --mode panel-pilot --limit 2 --ledger-dir "$LEDGER"
python3 scripts/subq/trajectories.py audit --output output/subq-panel-pilot
python3 scripts/subq/trajectories.py analyze --output output/subq-panel-pilot \
  --report output/subq-panel-analysis/pilot.json
#    Review: output/subq-panel-pilot/isolation.json, trajectories/, budget-guard.json,
#    summary.json and "$LEDGER/budget.json" summary before continuing.

# 3. Full panel (LIVE). The first call reviews 24 trajectories (12 boards); the second finishes.
python3 scripts/subq/sandbox.py --mode panel --limit 24 --ledger-dir "$LEDGER"
python3 scripts/subq/trajectories.py audit --output output/subq-panel
python3 scripts/subq/sandbox.py --mode panel --limit 384 --ledger-dir "$LEDGER"
#    After any stop: inspect the receipts. Only after review, and if continuing:
#    python3 scripts/subq/trajectories.py acknowledge --output output/subq-panel \
#      --trajectory <id> --note "<what happened>"
#    then rerun the same sandbox command (completed trajectories are skipped).

# 4. Offline audit and analysis.
python3 scripts/subq/trajectories.py audit --output output/subq-panel
python3 scripts/subq/trajectories.py analyze --output output/subq-panel \
  --corpus public/evidence/subq-panel/corpus.json \
  --report output/subq-panel-analysis/panel.json
```

Do not re-run step 1 after step 2 or 3 has started. A new `created_utc` makes a different plan, and `run` refuses to mix plans in one output directory.

## 11. Checklist coverage

| Methods critique section 9 item | Where frozen |
|---|---|
| Board corpus, generator seeds, strata and weights, symmetry exclusions, acceptance and rejection counts | Section 2; corpus, development corpus and acceptance log with sha256 |
| Model alias, date, alias-drift policy | Section 4 |
| Exact prompts, option-order randomization, forced-transition rules | Section 5 (historical templates; fixed order, not randomized; forced transitions make no call) |
| Primary endpoint, effect size, α, confirmatory or precision-oriented | Sections 6–7 |
| Multiplicity family with a matching power calculation | Section 7 (Holm across three sizes; power at α = .05 and .0167) |
| Early stopping, refusal, infrastructure-failure and budget-censoring denominators; no automatic retries | Section 8 |
| Probability normalization and calibration binning | Section 6, secondary endpoint 5 |
| Maximum requests, maximum input exposure, retained ledger cap | Section 9 |
| Development set assigned before any tuning, separate from test boards | Section 3 |

## 12. Amendments

Any change after this freeze — to the corpus, plans, templates, limits, endpoints or analysis — is recorded below with a date and reason, before the affected calls. A change made after test-panel calls have started makes the study non-confirmatory for the affected sizes.

**Amendment 1 (2026-10-15, before any panel or pilot call).** The orchestrator's independent review re-certified all 192 test boards: each has connected regions and a unique solution under a separate brute-force permutation solver. It also checked that no solution data reaches the frozen plan or the model-visible state. One descriptive covariate is added. Region letters are assigned in order of first appearance, so a board's solution can align with letter order: the queen in row *i* may sit in the *i*-th lettered region. The panel's mean aligned fraction is 0.49, 0.47 and 0.35 at 5×5, 7×7 and 9×9, against 0.50 for the nine historical boards. Twelve 5×5 and four 7×7 boards align in every row. The analysis will report the aligned fraction per board, and an exploratory solve rate split by full alignment, so that any shortcut a model takes on letter order stays visible. Endpoints, limits and plans are unchanged.

**Editorial note (2026-10-15, after the run).** Two local absolute paths in section 10 were replaced with placeholders for publication. No design, limit, endpoint or analysis changed. Results: [SubQ panel report](REPORT.md).
