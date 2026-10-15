# Methods critique: what the Queens decision-model evidence can and cannot support

Edition of **14 October 2026**. This is an AI-engineering and statistical review of the Queens assessment as published in this book, written after the SubQ Snap follow-up and the release of the Artificial Analysis (AA) Decision Index. It asks whether the process and sample support the book's claims, and whether more experiments are needed.

**How this review was produced.** Claude (the orchestrating agent) drafted the questions and the synthesis. An independent statistical review was commissioned from GPT-6.1 Sol (extra-high reasoning, via the Codex CLI) with read-only access to the evidence. Every number below was recomputed from the published evidence bundle. The headline baselines (greedy policy, chance-level cell accuracy, AA calibration) were verified a second time with independent scripts. No new model inference was performed for this review. The calculations are reproducible offline:

```sh
python3 -I scripts/analysis/methods_critique_calculations.py
```

That script uses only the Python standard library, reads `public/evidence/`, makes no network requests, and writes [calculation-results.json](../public/evidence/methods-critique/calculation-results.json) and [cell-probability-labels.json](../public/evidence/methods-critique/cell-probability-labels.json).

## Table of contents

- [Verdict in eight points](#verdict-in-eight-points)
- [1. Construct validity: what each study measures](#1-construct-validity-what-each-study-measures)
- [2. Sample size, dependence and power](#2-sample-size-dependence-and-power)
- [3. Baselines the book was missing](#3-baselines-the-book-was-missing)
- [4. Board distribution and difficulty](#4-board-distribution-and-difficulty)
- [5. Protocol confounds](#5-protocol-confounds)
- [6. Measurement beyond solved or failed](#6-measurement-beyond-solved-or-failed)
- [7. The Artificial Analysis Decision Index: agreement and limits](#7-the-artificial-analysis-decision-index-agreement-and-limits)
- [8. Should we run more experiments?](#8-should-we-run-more-experiments)
- [9. Preregistration checklist](#9-preregistration-checklist)
- [10. Changes made to the book in this edition](#10-changes-made-to-the-book-in-this-edition)
- [Appendix: selected calculation outputs](#appendix-selected-calculation-outputs)

## Verdict in eight points

1. **The selection result is solid within its scope.** With complete candidates and each candidate's regions spelled out, Jev and SubQ Snap each chose the valid board 24/24 times at 7×7 and 9×9, with menus of up to 255 options. With column vectors alone, both mostly failed. Representation drives this result more than the choice of model does. It is assisted recognition, not search.
2. **The construction result is weaker than "10/90" suggests.** Each model completed 10 of 90 trajectories. Those 90 attempts are 18 board-by-menu conditions with near-deterministic repeats, and every condition is either 0/5 or 5/5. The real denominator is nine boards.
3. **A greedy rule with no model beats both decision models.** It picks the color with the fewest legal cells, places that color's first legal cell, and never backtracks. That completes 4 of the 9 boards, including a 7×7 and a 9×9 that neither model solved. Jev completed 1 board; SubQ completed 2.
4. **On the cell choices that mattered, both models were close to chance.** Excluding forced moves, Jev picked a solution cell 33.9% of the time and SubQ 33.3%. Picking uniformly at random from the same menus would give 30.0% and 28.8%.
5. **Some "planning" was the harness.** On Jev's filtered `sequence-5-1` solves, every cell placement was forced by the menu; Jev chose only the order of colors. Completion belongs to the model and harness together.
6. **The 10/90 tie is not evidence of equal ability.** Jev solved one board; SubQ solved two different boards, and only with filtering. An exact paired test on boards gives p = 1. This sample cannot distinguish the models.
7. **Confidence runs ahead of accuracy on hard decisions.** On non-forced cell choices, average stated probability was 48% (Jev) and 45% (SubQ) against 34% and 33% accuracy. That matches AA's finding on reasoning items (Jev: 61% confidence vs 21% accuracy on HLE-MultiChoice). It is not universal: on WildGuardTest, Jev is slightly underconfident.
8. **More experiments are justified, but they should add boards, not repeats.** The highest-value next step is a new, stratified board panel with one attempt per model and menu, plus offline oracle labelling of every decision already recorded. Section 8 gives the design, the power calculation and the costs.

## 1. Construct validity: what each study measures

| Study | What it actually measures | What it must not be read as |
|---|---|---|
| 17 Sep image pilot (4 reasoning models × 3 boards) | Whether one request produced a correct full placement, plus strict JSON compliance, on three clean synthetic images with region letters | General Queens accuracy, a model ranking, or performance on real LinkedIn screenshots |
| Jev representation and scale studies | Choosing among complete placements in which rows, columns and non-touching are already guaranteed; explicit region lists remove the coordinate-to-region lookup | Discovering a solution, verifying all rules, or scaling search to 255 alternatives |
| Six-board primitives | Row construction, candidate ranking, binary validity (Noul) and ordinal coverage (Score) under different encodings | Interchangeable "reasoning accuracy" |
| Jev and SubQ fresh trajectories | A policy that picks a region, then a cell, commits immediately, and is stopped by an oracle at the first dead end | Unrestricted planning, contradiction detection, backtracking, or learning across restarts |
| SubQ frozen replay | Decisions conditional on states that Jev produced | A SubQ-generated path, or hundreds of independently solved puzzles |
| Earlier generations and diagnostics | Delivered answers under capped service settings; failure-selected representation comparisons | A generation threshold, or proof that perception caused failures |

**"The solver is not the selector"** holds up as an engineering distinction between tasks: code generates and filters a candidate space, and a model ranks it. It is overdrawn as a distinction between model classes. A decision head can sit inside a search loop, and a generative model's correct answer does not show that it searched internally. This edition retitles the summary "Selecting is not solving" and ties the claim to the tested workflow and boards.

**Backtracking was forbidden by the protocol, not by the API.** The trajectory harness fixes accepted queens and stops at the first local violation or unextendable prefix. An external controller could let a decision model revise placements. "Cannot backtrack" therefore describes this experiment, not an intrinsic limit of decision models.

**Modality is confounded with task.** The reasoning models generated complete placements from images; the decision models chose from bounded menus over exact text partitions. The October diagnostic study shows why this matters: a model's earlier 9×9 failure became two mathematical successes on fresh image runs, without switching to text. Perception is not established as the cause of failure.

## 2. Sample size, dependence and power

### The real denominator

The trajectory studies used **nine boards** (three each at 5×5, 7×7 and 9×9), two menu modes (raw and conflict-filtered "local") and five attempts per board and mode. Repeats are highly correlated:

- Jev's modal trace agreement averages 66.7% across the 18 conditions, and is 100% in four.
- SubQ produced exactly one trace per condition. Its repeated payloads showed no observed variation in Choice or probability vector.
- Every board-by-mode condition is either 0/5 or 5/5 solved, for both models.

With within-condition correlation near one, the design effect `n_eff = B·m / [1 + (m − 1)ρ]` collapses 90 attempts to about 18 condition units. Because raw and local outcomes on the same board are also dependent, the independent unit is closer to nine boards. Repeats remain useful for measuring service variability, not for generalization.

### Intervals at the board level

| Board-level outcome | Observed | 95% Clopper–Pearson |
|---|---:|---:|
| Jev solved the board in any of its 10 attempts | 1/9 (11.1%) | 0.3%–48.2% |
| SubQ, same allowance | 2/9 (22.2%) | 2.8%–60.0% |
| Either model, larger boards, pooled per model | 0/6 | 0%–45.9% |
| Jev explicit-region Choice, six held-out boards | 6/6 | 54.1%–100% |

These intervals assume boards were sampled independently from a defined distribution. The curated generator corpus does not guarantee that, so read them as illustrative. The naive call-level interval for 10/90 (5.5%–19.5%) is computable but answers the wrong question.

### The tie

Jev solved `sequence-5-1` in both modes. SubQ solved `sequence-5-2` and `sequence-5-3`, filtered only. On any-board success that is two SubQ-only boards and one Jev-only board; the exact McNemar test gives p = 1. A claim of equivalence would need a prespecified margin and a much narrower paired interval.

### How many boards would distinguish two policies?

To detect a per-board solve rate of 20% versus 50% (two-sided α = 0.05):

| Design | 80% power | 90% power |
|---|---:|---:|
| Two independent groups, normal approximation | 39 boards/arm | 52 boards/arm |
| Two independent groups, exact Fisher | 44 boards/arm | 58 boards/arm |
| Same boards for both, exact McNemar, discordance q = 0.3 | 25 | 29 |
| Same boards, q = 0.5 | 46 | 59 |
| Same boards, q = 0.7 | 64 | 83 |

**64 new boards per size**, shared across policies, is a defensible planning target for 80% power over the feasible range of discordance, before multiplicity adjustment. That is 192 boards for three sizes. Five repeats on three boards per size cannot substitute for this.

### Forking paths

The successful 5×5 representation emerged after exploratory changes. The six held-out boards validate that frozen workflow within one generator family, not every explored prompt. Menu sizes, primitives, encodings, modes and subgroups should be treated as exploratory unless prespecified, with one primary endpoint and Holm adjustment for any confirmatory family.

## 3. Baselines the book was missing

### Random policy

The study already published the probability that a uniformly random policy completes each board under the same protocol. Summed over five attempts per condition, random selection expects **1.57 solves out of 90**: 0.02 from raw menus and 1.55 from local menus. On `sequence-5-1`, the raw chance is 0.30% and the local chance is 13.7%. Filtering alone changes the reference roughly 46-fold, so "local" results must always be compared with the local baseline.

### Greedy policy (new in this edition)

Rule: choose the unplaced region with the fewest immediately legal cells (ties alphabetical), place its first legal cell in row-major order, never backtrack. It uses the same legality filter as the local menu, and involves no model and no solution knowledge.

| Board | Greedy | Jev solved (raw / local) | SubQ solved (raw / local) |
|---|---|---|---|
| sequence-5-1 | **Solved** | 5/5 · 5/5 | 0/5 · 0/5 |
| sequence-5-2 | stops after 2 | 0/5 · 0/5 | 0/5 · **5/5** |
| sequence-5-3 | **Solved** | 0/5 · 0/5 | 0/5 · **5/5** |
| sequence-7-1 | **Solved** | 0/5 · 0/5 | 0/5 · 0/5 |
| sequence-7-2 | stops after 1 | 0/5 · 0/5 | 0/5 · 0/5 |
| sequence-7-3 | stops after 4 | 0/5 · 0/5 | 0/5 · 0/5 |
| sequence-9-1 | stops after 2 | 0/5 · 0/5 | 0/5 · 0/5 |
| sequence-9-2 | **Solved** | 0/5 · 0/5 | 0/5 · 0/5 |
| sequence-9-3 | stops after 2 | 0/5 · 0/5 | 0/5 · 0/5 |

The greedy rule completes **4/9** boards against Jev's 1/9 and SubQ's 2/9. It is a descriptive baseline on a small corpus, not a tuned policy or a population estimate, and it fails on `sequence-5-2`, where SubQ succeeds. Still, any claim that decision models plan must beat the most-constrained-variable heuristic taught in introductory constraint programming. Neither model does here.

### Chance-level cell accuracy (new in this edition)

Region choices have no uniquely correct answer, because every region eventually needs a queen. Cell choices do: at a viable state, exactly one cell in the menu lies on the unique solution.

| Model | Non-forced cell calls | Picked a solution cell | Uniform chance, same menus | Mean stated probability |
|---|---:|---:|---:|---:|
| Jev 1.13 | 121 | 33.9% | 30.0% | 48.3% |
| SubQ Snap | 120 | 33.3% | 28.8% | 44.9% |

By menu mode, Jev scored 43.7% on raw menus (chance 22.3%) but 20.0% on local menus (chance 41.0%). SubQ scored 18.2% raw (chance 21.3%) and 46.2% local (chance 35.2%). Visited states are adaptive and repeated, so these are descriptive rates, not independent trials. Weighting each distinct payload equally gives Jev 28.4% and SubQ 33.3%. The pattern is consistent: on the decisions that determined success, neither model was reliably better than picking at random within the menu.

## 4. Board distribution and difficulty

Unique-solution certification, connectedness checks and symmetry exclusion are genuine strengths: they prevent trivial duplicates and ambiguous answer keys. They do not produce diversity or human difficulty.

- All trajectory boards come from one generator family, and the 9×9 generator deliberately preserves two singleton seed regions. Eight of nine trajectory boards contain at least one singleton region.
- "Unique" describes solution count, not inference difficulty. Recorded search-node counts span 13–31 at 5×5, 77–294 at 7×7 and 764–1,512 at 9×9, but they depend on search order and include uniqueness certification.
- The original "hard" 9×9 image board has three singleton regions.

**Recommendation:** replace size labels with a difficulty profile: singleton count, region-size imbalance, forced-cell propagation rounds, fraction solved without branching, highest deduction-rule tier needed, branch depth, and log search nodes for first-solution and uniqueness searches separately. Sample by size × singleton status × difficulty tier, with at least two generator mechanisms. Freeze acceptance rules and rejection counts before inference. Keep a separate, provenance-checked corpus of real LinkedIn boards for transfer.

## 5. Protocol confounds

| Confound | Why it matters | Fix |
|---|---|---|
| Option order | Regions are listed alphabetically and cells row-major, so answer position, label and geometry are entangled. Jev's reversed-order probes changed choices, but 3 reversed vs 10 canonical calls at different times cannot identify a causal position effect. | Freeze content, interleave balanced permutations, test label renaming separately. |
| Serving and version | Jev ran through OpenRouter with a dated build; SubQ is a preview alias called directly. Provider, date, concurrency and order differ. Jev's identical requests returned 9–10 distinct probability vectors per group. | Report a comparison of services under recorded conditions; record model identifiers; repeat on a schedule. |
| Batching | SubQ's 16-question limit forced a 16 + 9 split for 25-question tasks. That preserves each question but changes co-present questions. | Compare 1/8/16-question groupings on matched states before treating batching as neutral. |
| Prompt tuning | Identical wording suits the frozen-interface estimand but does not estimate each model's best performance. | If tuning, give equal development budgets on separate boards, then lock prompts. |
| Sampling controls | No documented temperature or seed controls. Jev returned a Choice 0.01 below the reported maximum in 13 of 633 typed answers. | Execute the returned Choice and record the disagreement, as the harness does. |
| Forced moves | Singleton menus are harness transitions with no inference, yet they count toward completed placements. | Report non-forced decision survival alongside all placements. |
| Stopping rule | Stopping at the first unextendable prefix is harsh but principled: on a unique-solution board, the first off-solution queen makes completion impossible. It shortens failures and rules out recovery. | Keep it for first-path estimates; test recovery as a separate, labelled condition. |

## 6. Measurement beyond solved or failed

### Prefix depth

| Size | Jev mean correct queens, raw / local | SubQ mean correct queens, raw / local |
|---|---:|---:|
| 5×5 | 2.47 / 2.53 | 1.33 / 3.67 |
| 7×7 | 1.67 / 2.07 | 0.67 / 1.33 |
| 9×9 | 2.33 / 2.47 | 1.00 / 1.00 |

Each cell averages 15 correlated attempts on three boards. Use `correct_queens_before_failure` (the published `accepted_queens` includes a locally legal failing queen). Plot prefix survival `S(k) = P(at least k correct queens)` with board-cluster uncertainty, and a second curve that counts only non-forced decisions.

### Calibration on Queens

Selected-option calibration on non-forced cell calls (ten equal-width bins):

| Model | Accuracy | Mean selected probability | ECE | Multiclass Brier |
|---|---:|---:|---:|---:|
| Jev | 33.9% | 48.3% | 0.170 | 0.721 |
| SubQ | 33.3% | 44.9% | 0.170 | 0.730 |

Both are overconfident on these decisions. Repeated states, adaptive visitation and different menus prevent a fair model-level ranking by Brier score.

### Noul is three different questions

On 72 explicit-region, answer-present candidate judgments, Jev produced six true positives and five false positives at P(yes) ≥ 0.5, with a Brier score of 0.053 (better than always-false at 0.083). With column vectors only, its Brier was 0.245, worse than always-false. SubQ's adapted split counterpart scored 0.0096 with six true positives and one false positive, but its column-vector condition had zero true positives despite a Brier of 0.078: class imbalance rewards rejecting nearly everything. Acceptance at a threshold, ranking and probability quality must be reported separately.

## 7. The Artificial Analysis Decision Index: agreement and limits

The AA snapshot (retrieved 14 October 2026; values copied as published) lists 26 entries, 11 of them decision models. Jev 1.13 leads the decision models at 57.5. GPT-6 Luna (Decisions), OpenAI's Decisions interface, scores 48.5. SubQ Snap is not listed; Subquadratic's launch article reports 61.7 against Jev's 57.9, a vendor-reported figure.

### Where the Queens evidence agrees

- **Selection over a given menu is a strength.** The best decision models match or beat low-effort language models on WildGuardTest (95 vs 93) and When2Call (84 vs 77). On Queens, prepared-candidate recognition was 24/24 for both models.
- **Hard decisions are overconfident.** On HLE-MultiChoice, Jev's stated confidence averages 61.0% against 20.9% accuracy (binned ECE ≈ 0.40). On Queens cell choices, Jev stated 48% against 34% accuracy.
- **Jev leads decision models on reasoning.** It scores 20.9 on HLE-MultiChoice; no other decision model exceeds 15.4. On Queens it reached deeper correct prefixes than SubQ at 7×7 and 9×9. SubQ is not on the index, so this is consistency, not a test.

### Where it disagrees, or cannot see

- **Index proximity is not task proximity.** Claude Haiku 5.5 (Low) leads Jev by three index points. On Queens, frontier reasoning models delivered 11 valid solutions in 12 requests while no decision model completed a board above 5×5. Our language-model cohort differs from AA's comparators, so this is a caution, not a contradiction.
- **Single calls cannot show compounding.** Every AA item is one call. A 9×9 trajectory needs nine correct cell placements in a row; even 90% per-placement accuracy compounds to about 39%.
- **Calibration is task-dependent.** On WildGuardTest, Jev's mean confidence is 92.1% against 96.8% accuracy: slightly underconfident. The pooled "overconfident" summary hides that reversal.
- **The OpenAI Decisions entry behaves like non-reasoning Luna.** 48.5 sits beside GPT-6 Luna without reasoning (49.6) and well below Luna at low effort (55.2). These are different interfaces and configurations, not an ablation, but they predict that OpenAI Decisions will look like the other decision models on Queens.

### Criticism of the index itself

- **Weights are policy choices.** 12.5% knowledge accuracy, 12.5% non-hallucination, 25% each for HLE-MultiChoice, When2Call and WildGuardTest F1. Neither equal weighting nor a composite point maps to a deployment utility.
- **No intervals, repeats or seeds.** A binomial approximation gives about ±3.5 points (95%) on a single model's HLE-MultiChoice score and roughly ±1.7 points on a difference between two index scores. Jev's 3.6-point lead clears that; the five models between 52.3 and 53.9 do not separate. Single-pass scores also omit run-to-run variation, which our exact-request tests show is real for Jev (8 of 17 identical-request groups changed their choice).
- **No chance baseline.** HLE-MultiChoice scores of 9–15 for most decision models are hard to interpret without the guessing rate for those items.
- **Incomplete calibration coverage.** Jev's knowledge bins cover 385 of 500 questions; WildGuardTest bins count 2,444 judgments rather than 835 rows. Language-model calibration is not yet published.
- **Private knowledge items** cannot be audited independently.

Neither benchmark answers the other's question. The index measures breadth over thousands of independent single-step items; Queens measures depth over a handful of boards with dependent decisions.

## 8. Should we run more experiments?

**Yes, with a change of emphasis: more boards, fewer repeats, and better baselines.** Only SubQ Snap can be called from this device today; Jev and the language models need the OpenRouter key. SubQ pricing is $0.05 per million input tokens with free output. The shared campaign ledger shows about $0.087 of estimated usage plus $0.059 of unresolved reservations under the $4.50 local cap, leaving about $4.35.

| Priority | Experiment and hypothesis | Design | Requests and estimated cost | What it changes |
|---|---|---|---|---|
| 1 · offline, now | Oracle audit: apparent progress partly reflects forced moves | Label every offered cell in all 180 recorded trajectories (legal, extendable, on solution, forced, menu size, true-option probability) | 0 · $0 | Separates model work from harness work |
| 2 · offline, now | Simple heuristics explain part of the apparent planning | Exact random policy and frozen greedy policy on every board, old and new | 0 · $0 | Done for the nine boards: greedy 4/9 |
| 3 · offline, now | Calibration depends on task and menu | Stratify existing Choice and Noul probabilities by board, mode and task | 0 · $0 | Reliability evidence without treating ranking as verification |
| 4 · SubQ, now | Filtering improves first-path success on unseen boards | 64 new certified boards per size (192 total), stratified by singleton status and difficulty tier, two generators; one raw and one local trajectory each (384 attempts) | 1,400–5,000 calls · about $0.14–$0.50 at observed payloads; ≤$1.25 at 5,000 tokens per call | Replaces three-board size anecdotes with estimates over a defined distribution |
| 5 · SubQ, now | Answer position changes the selected cell | One frozen multi-option state per new board; correct option early, late, and two balanced permutations | 256 calls · about $0.03 | Quantifies order sensitivity |
| 6 · SubQ, now | Batch context changes a focal judgment | Same focal question in 1-, 8- and 16-question requests on 64 states | 192 calls · about $0.04 | Tests whether the split adaptation is neutral |
| 7 · SubQ, later | Feedback and backtracking improve completion | 24 new boards per size, paired arms with equal call budgets (≤ 20 calls each); a feasibility study, not powered | ≤ 2,880 calls · ≤ $0.29 | Tests recovery, currently absent |
| 8 · needs OpenRouter | Model differences persist on a common held-out panel | Replay the frozen SubQ panel for Jev, and run a labelled full-generation arm for language models | Jev ≤ 5,000 calls; LLMs ~192 calls per condition | Enables like-for-like model comparison |

### Harness changes required for the SubQ experiments

- **New-board panel** (`scripts/subq/trajectories.py`): replace the historical-only board loading in `prepare()` with an explicit corpus argument; validate connectivity, uniqueness with two independent solvers, and symmetry non-duplication against all historical boards; make modes, repeats and schedule seed configurable; replace the hard-coded 90 trajectories with the schedule length; keep historical template matching as a check for the historical corpus only.
- **Position probe:** a separate frozen-state subcommand that reorders the criteria map with stored permutations, keeps semantic labels, and records permutation IDs in receipts but never in model-visible state.
- **Batch probe:** the same path, with fixed focal state and counterbalanced focal position across 1/8/16-question maps. Never batch dependent region and cell turns.
- **Recovery mode:** an explicitly separate stop policy with bounded revision history that distinguishes model-detected contradictions from oracle feedback.
- **Offline analysis command** beside `audit()`, writing oracle labels, baselines and board-cluster metrics to an explicit output path, with no API dispatch.

### Decision for this edition

Experiments 1–3 cost nothing and their core results are already in this review. Experiment 4 is the most informative paid study. It needs a board generator with difficulty profiling, the harness changes above, a frozen preregistration and a running Docker engine for the contained runner. The book reports it as planned, not as a result, until those receipts exist.

## 9. Preregistration checklist

Freeze before any SubQ dispatch:

- Board corpus, generator seeds, strata and weights, symmetry exclusions, acceptance and rejection counts.
- Model alias, date, and a policy for alias drift.
- Exact prompts, option-order randomization, forced-transition rules.
- Primary endpoint (paired board-level success, raw vs local), effect size, α, and whether 64 boards per size is confirmatory or precision-oriented.
- Multiplicity family (Holm across sizes if all three are confirmatory, with a matching power calculation).
- Early stopping, refusal, infrastructure-failure and budget-censoring denominators; no automatic retries.
- Probability normalization and calibration binning.
- Maximum requests, maximum input exposure, and the retained ledger cap.
- A development set, assigned before any tuning, kept separate from test boards.

## 10. Changes made to the book in this edition

- The executive summary is retitled **"Selecting is not solving"** and reduced to three findings, a featured replay and three limits. Construction is described as "rarely" rather than "never", with the 10/90 counts, the greedy baseline and chance-level cell accuracy stated directly.
- The featured Jev success uses the raw-menu attempt, which required seven model decisions, and notes that the filtered version forced every cell.
- The Candidate engineering deck now says the adaptation supplied complete placements and exposed region letters, rather than that Jev did not search.
- The Scale deck states that the 24 explicit-region menus span two reused boards with overlapping candidates. The 255-option result is described as "all 24 tested menus succeeded" rather than "no failure before the limit".
- The all-invalid Choice row describes six sets in one family rather than "reliable" rejection.
- Methods & sources now asks for distinct boards, paired board-level contrasts and board-cluster uncertainty.
- The SubQ chapter states that matching 10/90 counts cannot establish equivalent ability.
- A new Decision models page compares Jev, SubQ and OpenAI Decisions with the AA Decision Index, using a published data snapshot.

## Appendix: selected calculation outputs

```text
CP95: 1/9 [.0028, .4825]; 2/9 [.0281, .6001]; 0/6 [0, .4593]
Fisher power n/arm: 39 = .732; 44 = .802; 58 = .906
McNemar N at 80% / 90%: q=.3 25/29; q=.5 46/59; q=.7 64/83
Random expected solves / 90: 1.5703
Greedy solved boards: sequence-5-1, sequence-5-3, sequence-7-1, sequence-9-2
Non-forced cell accuracy: Jev 41/121 (chance .300); SubQ 40/120 (chance .288)
Jev Noul regions-present: TP 6, FP 5, Brier .0529
SubQ split regions-present: TP 6, FP 1, Brier .0096
AA Jev HLE-MultiChoice: mean confidence .6104, accuracy .2086, binned ECE .4019
AA Jev WildGuardTest: mean confidence .9209, accuracy .9685
Ledger headroom: 4.50 − .0870 − .0590 = $4.354
```

The greedy policy chooses the unplaced region with the fewest immediately legal cells, breaks ties alphabetically, and places the first legal cell in row-major order without backtracking. Oracle stopping is used only to score the outcome.
