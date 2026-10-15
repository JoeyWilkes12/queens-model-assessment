[empower] usage (as of Wed 23:20): 5h window 30% used / 70% left, resets Thu Oct 15 03:37 | weekly 31% used / 69% left, resets Mon Oct 19 23:07

Completed the [critique](DELIVERABLE.md), required planning/handoff files, frozen source excerpts, and reproducible calculation artifacts. Validation passed: nine independently certified boards, 18 random baselines, 18 split grades, 241 cell labels, uncertainty/power calculations, and an independently reproduced greedy baseline.

No provider calls, project-source edits, commits, pushes, or merges were made by this run. The book changed concurrently; wording quotations refer to the preserved review snapshot. The principal open limitations are the small board distribution, correlated observations, mutable provider versions, and incomplete AA calibration coverage.

Artifact directory: `/Users/joeywilkes/Desktop/scripts/queens-model-assessment/.worktrees/decision-models-refresh/.empower/2026-10-14-scientific-critique`

The complete deliverable follows.

# Scientific critique: Queens decision models and the limits of selection

**Assessment of the reviewed snapshot: needs revision before broad capability claims are published.** The receipts support selective candidate recognition and selective first-path construction. They do not support a general solver-versus-selector taxonomy, equal model ability from 10/90 versus 10/90, or a validated difficulty curve. A newly computed, deterministic greedy baseline completes four of the nine trajectory boards, including larger boards neither model completed. This materially changes the comparison.

All project paths below are relative to `/Users/joeywilkes/Desktop/scripts/queens-model-assessment/.worktrees/decision-models-refresh`. `E` means `public/evidence/`. `O` means the read-only original evaluation directory `/Users/joeywilkes/Desktop/Macbook Air/Scripts & Code/all specifications (monorepo)/Games/Queens/screenshot-solver/evaluations/`. New calculations are reproducible in this artifact directory’s `calculations.py` and `calculation-results.json`; no new inference was performed. Source inspection does not establish the deployed website’s rendered behavior. Published-wording citations are frozen in SOURCE-SNAPSHOT.md because the source changed concurrently during review.

## 1. Construct validity

| Study | Construct actually measured | Interpretation to avoid |
|---|---|---|
| September image pilot | Delivered full-placement correctness and strict output compliance, conditional on three clean, letter-labelled synthetic images and one request per model/board | General Queens accuracy, a model ranking, or performance on real LinkedIn screenshots |
| Jev representation search and scale | Selecting among complete placements, usually with rows, columns and non-touch already guaranteed; explicit lists remove coordinate-to-region lookup | Discovering a solution, independently verifying every rule, or scaling search to 255 alternatives |
| Six-board primitives | Simultaneous row construction, candidate ranking, binary validity and ordinal coverage under distinct encodings | Treating these as interchangeable “reasoning accuracy” |
| Jev/SubQ fresh trajectories | A state-dependent policy selecting region then cell, with immediate commitment and oracle termination | Unrestricted planning, self-detection of contradictions, backtracking or learning across restarts |
| SubQ frozen replay | Decisions conditional on states produced by Jev, including Jev’s earlier placements | A SubQ-generated path, recovery, or hundreds of independently solved puzzles |
| Earlier generations/diagnostics | Delivered answers under a capped service configuration; failure-selected representation comparisons | A generation threshold or isolation of perception as the cause of failure |

Sources: `O/2026-09-19-comprehensive/REPORT.md:7–13,99–127`; `O/2026-09-19-jev-scale/ASSESSMENT.md:25–36,65–75`; `O/2026-09-19-jev-primitives/PROTOCOL.md:20–52`; `E/trajectory-PROTOCOL.md:22–34`; `E/subq-REPORT.md:27–31`; `E/diagnostic-completion-PROTOCOL.md:19–64`.

“The solver is not the selector” is defensible as an **engineering distinction between assigned tasks**: code supplies a candidate space, while a model ranks it. It is overdrawn as a distinction between model classes. A decision head can be embedded in search, and a generative model’s correct placement does not reveal whether its internal process was search. The reviewed hero’s “rarely built one a move at a time” should be attached to the nine tested boards and first-path protocol, rather than read as a population capability claim (`src/App.tsx:449,458`). Keep the thesis, but attach it to the workflow and tested corpus.

The apparent planning result particularly needs decomposition. On Jev’s successful `sequence-5-1` local paths, **all five cell placements were forced**; its four paid decisions selected regions. Raw successes required seven non-forced decisions. SubQ’s successful local paths required six calls and four forced transitions. Thus completion belongs to the combined policy and harness. Region ordering can be useful, but it is not five independent demonstrations of difficult cell inference (`E/trajectory-study.json:trajectories[trajectory_id=sequence-5-1_local_a1].steps`, `audit.per_board`; `E/subq-trajectories-summary.json:families`).

The API does not itself prohibit an external controller from revising placements. **This protocol prohibits backtracking**, explicitly fixing accepted queens (`scripts/subq/trajectories.py:44–76,207–219`). Simultaneous row answers also do not consume one another’s outputs. These are meaningful interface constraints, not evidence of an intrinsic inability to reason recursively.

Modality remains confounded with task and representation. The image entrants generated complete placements; the decision arms consumed exact text partitions and bounded choices. Even the later image-versus-matrix diagnostic changes wording, tokenization and serialization. Fresh image controls matter: Sonnet 4’s earlier 9×9 failure became 2/2 mathematical successes without changing to text (`E/diagnostic-completion-REPORT.md:15–28`). The book should credit this control rather than attribute rescue to perception removal.

## 2. Sampling, uncertainty and power

The trajectory generalization denominator is **nine boards, three per size**. There are 18 paired board/mode conditions and 90 attempts per model, not 90 independently sampled puzzles. Calls are nested within adaptive paths; later calls exist only after earlier success. Jev’s modal ordered-trace agreement averages 66.7% across the 18 conditions, ranges 40–100%, and is 100% in four conditions. SubQ repeats exactly one trace in every condition; its 44 repeatedly submitted payload groups showed no observed Choice/vector variation. Neither agreement nor variability proves independent inference (`E/trajectory-study.json:audit.per_board,repeatability`; `E/subq-REPORT.md:79`; calculations: `trace_agreement`).

For binary solve outcomes, every board/mode has either 0/5 or 5/5. A design-effect illustration, `n_eff = Bm / [1 + (m−1)ρ]`, gives 18 condition units rather than 90 attempts when within-condition correlation is one; dependence between modes reduces the independent board count further. This is an illustration of cluster sampling, not an estimated universal ICC. Use paired board outcomes, board-level means, and board-cluster uncertainty; preserve repeats for service variability.

| Board-level outcome | Observed proportion | Two-sided 95% Clopper–Pearson interval |
|---|---:|---:|
| Jev: any solve within its scheduled ten attempts/board | 1/9 = 11.1% | 0.28–48.25% |
| SubQ: same scheduled allowance | 2/9 = 22.2% | 2.81–60.01% |
| Either model, separately, at either larger size | 0/3 | 0–70.76% |
| Each model, pooling the six larger boards | 0/6 | 0–45.93% |
| Jev explicit-region Choice, six held-out boards | 6/6 | 54.07–100% |

These are **illustrative superpopulation intervals** assuming independently sampled boards from a defined distribution; the curated generator corpus does not establish that assumption. The endpoint is success within the specified attempt/mode allowance, not single-trajectory probability. Pooling sizes changes the target population. An IID 10/90 interval, 5.46–19.49%, is numerically computable but inappropriate for board generalization (Clopper–Pearson inversion; `calculation-results.json:intervals`).

The tie establishes equal **observed total completion only**. Jev solves `sequence-5-1` in both modes; SubQ solves `sequence-5-2` and `sequence-5-3` locally. Collapsing to any-board success yields two SubQ-only and one Jev-only success: exact paired McNemar \(p=1\). This is very low information, not evidence of equivalence. An equivalence claim needs a prespecified margin and a sufficiently narrow paired difference interval. Do not combine their outcomes into “zero successes in twelve larger boards”: both saw the same six (`E/subq-REPORT.md:54–79`; McNemar’s discordant-pair principle).

**Power calculation.** For 20% versus 50% independent per-board solve rates, two-sided alpha .05, the usual normal approximation gives

\[
n=\frac{[1.96\sqrt{2(.35)(.65)}+z_{power}\sqrt{(.2)(.8)+(.5)(.5)}]^2}{(.3)^2}.
\]

This gives 39 boards/arm at 80% and 52 at 90%. Exact two-sided Fisher enumeration gives only 73.2% power at 39, 80.2% at **44**, and 90.6% at **58**. These counts apply **per size** if making size-specific comparisons; they do not cover multiple-testing adjustment.

Prefer the same new boards for both policies/models. With marginal rates .2/.5, discordance `q = P(A ≠ B)` can range .3–.7. Exact McNemar power requires 25/46/64 shared boards for 80% at `q=.3/.5/.7`, and 29/59/83 for 90%. Thus **64 new boards per size** is a defensible 80% planning target across the feasible discordance range, before multiplicity and missingness. These calculations assume independent identically distributed board pairs; a quota-stratified design needs a heterogeneity sensitivity calculation before confirmatory use. Five repeats on three boards cannot substitute for this (`calculations.py:paired_power,fisher_power`; exact conditional binomial tests).

The random-menu baseline must follow the whole protocol. I independently reproduced all 18 saved dynamic-programming probabilities. Across five attempts per condition, random selection’s expected solves are **0.0246 raw + 1.5457 local = 1.5703/90**. On `sequence-5-1`, raw chance is .298%, local chance 13.724%; filtering changes the reference by about 46-fold. Expectation is linear and does not require independent repeats; a tail probability does. Do not raise a chance probability to five to claim model significance (`E/trajectory-study.json:audit.per_board[].uniform_random_full_solve_probability`; calculations: `baselines`).

At an observed viable cell state with `K` options and one correct option, report oracle-correct mass lift `p_true / (1/K) = K × p_true`, or its log, alongside realized accuracy versus `1/K`. This is a model-distribution/random likelihood ratio for that answer, **not** a p-value or the probability of the executed argmax path. Counterfactual policies visit different states: evaluate random and greedy policies end to end, not by averaging chance only over model-visited states.

Finally, representation search has a garden-of-forking-paths problem: the 39-call study’s successful reformulation followed exploratory changes. The book already acknowledges this (`src/App.tsx:510`). Six later held-out boards validate that frozen workflow within one generator family, not every explored prompt. Treat menu sizes, primitives, encodings, modes and subgroup findings as exploratory unless prespecified; use one primary endpoint and Holm adjustment for a confirmatory family, with unadjusted descriptive estimates clearly labelled.

## 3. Board distribution and difficulty

Symmetry exclusion, connectedness and unique-solution certification are substantial strengths. They prevent trivial duplicate boards and ambiguous answer keys. They do not produce distributional diversity or human difficulty. All trajectory boards reuse a generator family, and 9×9 deliberately preserves two singleton seed regions (`E/trajectory-PROTOCOL.md:22`; `scripts/subq/trajectories.py:79–92`). Eight of nine trajectory boards contain at least one singleton, derived from `E/trajectory-study.json:manifest.generation[].region_sizes`.

“Unique” describes solution count, not inference complexity. Recorded MRV node counts span 13–31 at 5×5, 77–294 at 7×7 and 764–1512 at 9×9. These depend on search order and count uniqueness certification work, not necessarily effort to find the first solution. A region can force a queen immediately while uniqueness elsewhere requires enumeration (`E/trajectory-study.json:manifest.generation`); the original 9×9 has three singletons despite the “hard” label (`O/2026-09-19-comprehensive/REPORT.md:97–107`).

Use a **difficulty profile**, not a dimension label: singleton count; region-size imbalance; forced-cell propagation rounds under a published rule set; fraction solved without branching; maximum deduction-rule tier; branch depth; and log(1+nodes) for separately instrumented first-solution and uniqueness searches. Record both canonical and symmetry-randomized search orders. “Human deduction steps” requires an explicit human-relevant rule inventory and validation against human solving times/error rates; solver nodes alone cannot stand in for it.

Sample by size × singleton status × prespecified difficulty tier, with at least two generator mechanisms. Freeze acceptance rules and rejection counts before inference. Reserve a separately reported corpus of frozen real-puzzle boards, with provenance and exact partition checks, to assess LinkedIn transfer; do not assume synthetic clean images represent its distribution. If a desired stratum cannot be generated, report that coverage gap rather than replace it after model outcomes are known (stratified sampling and external-validity principles; `O/2026-09-19-jev-primitives/PROTOCOL.md:14–18`).

## 4. Protocol confounds

**Order:** regions are inserted alphabetically and cells row-major (`scripts/subq/trajectories.py:55–68`). Answer position, label semantics and structural cell features are therefore entangled. Jev’s reversed-order probes changed choices, but three reversed calls versus ten canonical calls at different times cannot identify a causal position effect. Freeze labels/content, randomly interleave balanced permutations, and separately test label renaming (`E/trajectory-REPORT.md:109–113`).

**Serving and version:** Jev’s exact-body probes show 9–10 distinct probability vectors per group, not that the harness samples those vectors. All successful calls reported the same dated build, but the immutable-ID input probe was locally rejected. SubQ uses a preview alias and direct routing; Jev used TypeSafe through OpenRouter. Provider, date, concurrency and execution order differ. Report a comparison of services under recorded conditions; architecture-specific explanations are untested (`E/trajectory-REPORT.md:88–125`; `E/subq-REPORT.md:50,79,105`).

**Batching:** a question-map batch is not a reasoning conversation. The 16+9 SubQ adaptation preserves each focal question but changes co-present questions and repeats shared state. Its 18 logical tasks and 36 calls cannot enter the exact-replay denominator; 11/18 primary successes do not mean every Noul/Score judgment passed (`E/subq-REPORT.md:81–89`; `E/subq-split-summary.json:families,logical_tasks`). Compare 1/8/16-question groupings on matched states before declaring batching behavior equivalent.

**Prompts:** identical wording is appropriate for the frozen-interface estimand, but it does not estimate each model’s best attainable performance. A tuned comparison needs equal development-board and tuning budgets, then locked prompts and untouched test boards. Conversely, post-hoc model-specific prompts cannot replace the historical exact-replay score (`E/subq-protocol.json:design,caveats`; selection-bias principle).

**Sampling controls:** absence of documented temperature/seed controls is a reproducibility limit, not a license to insert chat parameters or assume temperature zero. Execute returned Choice, recording disagreement with reported argmax; Jev had 13/633 such typed answers, each .01 below the maximum. Neither rounding nor model-internal stochasticity is established as the cause (`E/trajectory-REPORT.md:119–125,150–156`).

**Stopping:** first unextendable prefix is harsh but principled for a commitment policy: on unique-solution boards the first off-solution placement mathematically prevents completion. The oracle does not improve successful placement choices because it supplies no feedback or menu labels. It does create an externally measured failure boundary and shorten failing trajectories. Consequently, latency is time to terminal outcome, not solve time, and recovery remains untested (`scripts/subq/trajectories.py:207–227`; `E/trajectory-REPORT.md:148,166`).

## 5. Measurement beyond solved/failed

Plot empirical prefix survival `S(k) = P(at least k correct queens)`, with board-cluster uncertainty, separately by size/mode. Plot non-forced decision survival alongside all-placement survival so singleton propagation cannot masquerade as model accuracy. Use restricted mean prefix length, local-violation rate, first global-error depth, and calls/cost per solve under a declared attempt allowance. Do not divide solved-only latency by all attempts.

| Size | Jev mean correct queens, raw / local | SubQ mean correct queens, raw / local |
|---|---:|---:|
| 5×5 | 2.47 / 2.53 | 1.33 / 3.67 |
| 7×7 | 1.67 / 2.07 | .67 / 1.33 |
| 9×9 | 2.33 / 2.47 | 1.00 / 1.00 |

Each entry uses 15 correlated attempts across three boards. These are descriptive, policy-dependent means, not evidence of population superiority (`E/trajectory-study.json:trajectories`; `E/subq-trajectories-summary.json:trajectories`; calculations: `Jev_survival,SubQ_survival`). `accepted_queens` includes a locally legal failing queen; use `correct_queens_before_failure` (`E/subq-REPORT.md:75`).

Oracle-label **every offered cell**, not only the chosen cell: local legality; completion possible after adding it; solution membership; menu size; true-option probability; and forced status. “On THE solution” equals “on SOME solution” only for certified unique boards with a viable prefix. For multi-solution boards or off-solution starting states, enumerate completions conditional on the prefix. Region choice has no unique correct class; evaluate downstream success or decision value, not arbitrary region-label accuracy (`E/trajectory-PROTOCOL.md:30–38`).

I computed supplementary calibration from all non-forced cell calls in the fresh trajectories:

| Model | Calls / distinct state-question payloads | Chosen-cell accuracy | Mean chosen-option probability | ECE, ten equal-width bins | Multiclass Brier |
|---|---:|---:|---:|---:|---:|
| Jev | 121 / 36 | 33.9% | 48.3% | .170 | .721 |
| SubQ | 120 / 21 | 33.3% | 44.9% | .170 | .730 |

This supports **overconfidence on these visited cell decisions**, not universal miscalibration. Forced decisions and region preferences are excluded. Jev raw/local accuracy is 43.7%/20.0%, versus mean probability 45.5%/52.3%; SubQ is 18.2%/46.2%, versus 41.1%/48.1%. Equal weighting of exact payloads changes Jev to 28.4% accuracy versus 46.9% mean probability and SubQ to 33.3% versus 44.2%. Repeated states, adaptive visitation and differing menus prevent a fair model-level Brier ranking (`cell-probability-labels.json`; calculations: `cell_calibration`).

Use multiclass Brier and log loss for complete vectors, selected-option reliability/ECE for decision confidence, and binary Brier for Noul. The API’s separate `confidence` field is not automatically the selected-option probability. Jev vectors sum to .99–1.00 here: supplementary normalized multiclass Brier .720952 differs negligibly from unnormalized .720915. Preserve original probabilities, declare normalization, and never repair choices. ECE depends on binning and sample mix; add board-level intervals rather than report three decimals as certainty (proper scoring-rule and calibration principles; `scripts/subq/replay.py:213–284`).

Saved Noul probabilities give a more nuanced result. On 72 explicit-region answer-present candidate judgments, Jev has six positives, five false positives and Brier .05295, better than always-false .08333, while mean P(valid)=.219 versus prevalence .083. Columns-only Brier is .24513, worse than .08333. SubQ’s adapted split counterpart gives Brier .00964, six true positives and one false positive. Its vector condition has **zero true positives** at .5 despite Brier .07772: imbalance rewards rejecting nearly everything. Absolute acceptance, ranking and probability quality must remain separate (`E/manifest.json:records[study=2026-09-19-jev-primitives]`; `E/subq-split-summary.json:logical_tasks[].grade`; calculations: `Jev_noul,SubQ_split_noul`).

## 6. Artificial Analysis: agreement and limits

The archived snapshot contains 26 entries, including 11 decision models. Jev leads that subgroup at 57.504 and has its highest HLE score, 20.858%; this is relative leadership with low absolute accuracy. GPT-6 Luna Decisions scores 48.486, below Luna non-reasoning at 49.592 and High at 59.085. These are different evaluated interfaces/configurations, not an ablation proving that a decision head causes the gap. **SubQ is absent**; its vendor-reported 61.7 versus Jev 57.9 is not a score on this archived v1.0 leaderboard (`E/external/aa-decision-index-2026-10-14.json:models,notes`; `E/subq-provider.md:55`).

The qualitative agreement is useful: Jev’s When2Call accuracy 80.660% and WildGuard average F1 93.614% coexist with weaker HLE and Queens construction. Efficient classification/routing and prepared-candidate recognition need not transfer to sequential constraint satisfaction. Queens contributes a missing stressor: errors compound across commitments. Illustratively, independent .9 correctness across nine necessary decisions gives .9⁹=.387; independence and constant accuracy are explanatory assumptions, not fitted descriptions of these traces.

AA’s bins sharpen the calibration comparison. Jev HLE mean confidence is .6104 versus .2086 accuracy; reconstructed binned ECE is **.4019**. Its highest bin has 85 answers, mean confidence .9547 and accuracy .1176. But WildGuard bins show **underconfidence**: .9209 mean confidence versus .9685 accuracy, ECE .0476. The pooled Jev ECE .1174 masks this reversal. Do not write “decision models are overconfident” without the dataset qualification. Queens cell overconfidence agrees directionally with HLE, not with every AA task (`E/external/aa-decision-index-2026-10-14.json:models[slug=typesafe_jev-1-13].calibrationBins,byDataset`; calculations: `AA`).

AA deserves scrutiny too:

- Weights are policy choices: .125 knowledge accuracy, .125 non-hallucination, .25 HLE, .25 When2Call, .25 WildGuard F1. They mix different measures and error costs; neither equal dataset weighting nor a composite point has a natural deployment utility (`index_weights`).
- No reported CIs, repeats or seeds appear in snapshot notes. One reported pass cannot estimate repeat-to-repeat variation. With 513 HLE questions and Jev accuracy .209, an IID standard-error illustration is 1.79 percentage points; a 95% normal interval is approximately ±3.52 points. Sub-one-point index gaps should not be treated as established ranks. Proper paired item bootstrap must preserve metric definitions and covariance; repeats additionally assess serving variation (`notes`, HLE bins; binomial variance principle).
- Private knowledge questions limit independent item-level auditing; the supplied design lists 500 such questions (`BRIEF.md:27`). Calibration coverage is incomplete: Jev knowledge bins contain only 385 answers, while WildGuard bins contain 2444 outputs rather than 835 benchmark examples. Neither infer missingness mechanisms nor treat all bin counts as independent questions. Luna HLE bins cover 506 rather than 513. Raw outcomes/refusals and task decomposition are needed (`byDataset.*.calibrationBins`; `BRIEF.md:27`).
- LLM calibration bins are empty; the snapshot cannot establish comparative LLM calibration. Queens cannot supply AA’s breadth, and AA’s listed single-decision tasks cannot establish Queens-style sequential completion (`notes`; construct-validity principle).

## 7. Prioritized experiments

Only SubQ Snap is callable now. These are **proposals, not executed calls**. Price scenarios use $0.05/M input tokens, free output; the shared ledger has $.08695505 estimated usage plus $.05898240 unresolved reserves, leaving **$4.35406255** beneath the $4.50 local cap. A $.0196608 dispatch reservation is reconciled after metered success; do not multiply that reserve by all scheduled successful calls as predicted expenditure, or reset the ledger (`E/subq-budget.json:summary,reservation_per_call_usd`).

| Priority / availability | Experiment and hypothesis | Design, N and power rationale | Requests / estimated inference cost | What changes in the book |
|---|---|---|---|---|
| 1 · offline now | Oracle audit: apparent progress partly reflects forced propagation | Label every menu and recompute survival for all 180 existing trajectories; census, no power claim | 0 / $0 | Separates local legality, extendability, forced cells and model work |
| 2 · offline now | Policy baseline: simple constraint heuristics explain some apparent planning | Exact random DP plus frozen greedy MRV/row-major policy on all nine boards, then every new board | 0 / $0 | Already reproduced random expectation 1.57/90; greedy solves **4/9**, versus Jev 1/9 and SubQ 2/9 |
| 3 · offline now | Calibration depends on modality of judgment and menu | Existing Choice/Noul vectors, stratified by board/mode/task; equal-board and equal-payload sensitivity; census | 0 / $0 | Adds reliability evidence without treating ranking as verification |
| 4 · SubQ-only now | Filtering improves first-path success on unseen boards | **64 NEW boards/size**, one raw and one local trajectory each: 192 boards, 384 attempts. Stratify singleton/difficulty/generator; paired .2 versus .5 target, 80% at q=.7 before multiplicity | ≤4992 calls; about 1387 if historical early-stop volume transfers. ~$0.14 at 2000 tokens/call for 1387; ~$0.50 at 4992; $1.25 at 4992×5000 tokens | Replaces three-board size anecdotes with distribution-defined estimates |
| 5 · SubQ-only now | Answer position changes correct selection | One prespecified multi-option state on each of 64 distinct new boards; early/late correct-option positions plus two balanced permutations; paired primary contrast has same .30-gap planning power | 256 calls / ~$0.026 at 2000 tokens each | Quantifies order sensitivity; prevents attributing it to representation |
| 6 · SubQ-only now | Batch context changes a focal judgment | 64 distinct board states, identical focal question in 1/8/16-question requests; randomize order. Primary 1-vs-16 contrast; .30-gap power as above; middle size exploratory | 192 calls / ~$0.038 at 4000 tokens each | Tests whether the split adaptation preserves behavior |
| 7 · SubQ-only, later priority | Feedback/backtracking improves bounded-session completion | Separate 24 new boards/size, two paired arms with equal call allowance, maximum 20 calls/arm; feasibility study, **not powered** for modest gaps | ≤2880 calls / ≤~$0.288 at 2000 tokens each | Tests recovery, currently absent; labels added oracle feedback explicitly |
| 8 · needs Jev/LLM later | Model differences persist on a common held-out distribution | Freeze SubQ’s new panel for later Jev replay/paths; 64 boards/size supplies paired planning target if versions remain comparable. LLM full-generation arm separately labelled | Jev ≤4992 calls for same two modes; LLM 192 calls per generation condition; prices require rediscovery | Enables model comparisons while retaining task/modality boundaries |

Cost scenarios are not guarantees. New difficult boards may survive longer and require larger payloads; provider failures retain full reserves. Enforce both call caps and the remaining ledger cap, preserving censored outcomes. Existing trajectories averaged 1107 input tokens/call and cost $.0179905 for 325 calls, but that is an early-failure sample (`E/subq-trajectories-summary.json:records[].usage`; calculations: `cost`).

**Required harness changes, precisely:**

- New-board panel: replace historical-only loading in `prepare()` at `scripts/subq/trajectories.py:79–92` with an explicit corpus argument; validate connected partitions and symmetry nonduplication against all historical boards, in addition to the existing two solution validators. Accept configurable modes/repeats and a schedule seed at lines 108–122; use one attempt/mode, interleaved board blocks. Replace hardcoded 90 in prepare/audit, lines 113 and 255–256, with schedule length. Keep historical template matching as a dedicated historical-corpus check, not a requirement that every new board have an old request.
- Position experiment: add a separate frozen-state probe subcommand, using `state()`, `cell_question()` and `call()` at lines 44–76 and 127–153. Reorder the `criteria` mapping after construction using stored permutations; preserve semantic labels and descriptions. Include permutation IDs in receipt/schedule IDs, never in model-visible state. Save serialized order and hashes; run zero-choice/one-choice menus as excluded/forced, not paid position trials. Do not adapt permutation choice to responses.
- Batch experiment: use the same probe path, building independent question maps of size 1/8/16 and keeping focal state/text/options fixed. Freeze the filler questions and focal insertion positions; counterbalance positions so batch size and focal position do not coincide. Never batch answer-dependent region/cell turns. Keep a separate summary by focal question, batch size and board; never add these calls to trajectory success.
- Recovery experiment: introduce an explicitly separate policy/stop mode in `attempt()` at lines 156–231. Preserve original first-error depth, add bounded revision history and a validated placement stack, and distinguish model-detected contradiction from oracle-supplied feedback. Cap cumulative calls/time and report session success. Do not append failure feedback to the historical condition.
- Offline oracle/baseline/calibration: add a read-only analysis command beside `audit()` at lines 234–263, with a required explicit output path. Reconstruct labels for every option, preserve probability/Choice discrepancies and forced flags, and export board-cluster metrics. No API dispatch is needed. This critique implements supplementary analyses separately; it does not patch the harness.

**Preregister before any SubQ dispatch:** freeze corpus/seeds/stratum weights and symmetry exclusions; model alias/date and drift policy; exact prompts and order randomization; primary paired contrast and effect size; whether 64/size is confirmatory or precision-oriented; multiplicity family; forced-transition rules; early stopping, refusal/infrastructure/budget-censoring denominators; no automatic retries; probability normalization/binning; analysis and tie rules; maximum requests/input exposure and retained ledger cap. Assign a development set before tuning. If all three size contrasts are confirmatory, alpha adjustment requires a new power calculation; 64/size is not automatically sufficient. Freeze any practical equivalence margin before collecting data.

## 8. Ten concrete wording fixes

These proposed replacements target scope and interpretation; they do not imply that every existing sentence is false. Quotations retain visible wording; JSX tags around text are omitted.

| # | Reviewed wording and location | Proposed replacement |
|---|---|---|
| 1 | “The solver is not the selector.” — `src/App.tsx:449`, hero title | “Selecting a prepared solution is a different task from constructing one.” |
| 2 | “Frontier reasoning models built valid Queens solutions from a blank image. Decision models picked the right answer from a prepared list, but rarely built one a move at a time.” — `src/App.tsx:449`, deck | “On three synthetic images, 11 of 12 scheduled generative-model requests delivered valid placements, nine with strict JSON. Decision models were strongest on prepared menus, but each also completed 10/90 scaffolded construction attempts.” |
| 3 | “Decision models rarely build a board.” — `src/App.tsx:458` | “Both decision models completed some 5×5 boards; neither completed a tested 7×7 or 9×9 board under this first-path protocol.” |
| 4 | “The successful adaptation did not ask Jev to search the board.” — `src/App.tsx:510`, deck opening | “The successful adaptation supplied complete placements and asked Jev to select among them; it did not require discovering a placement.” |
| 5 | “Code generated complete candidates, filtered most constraints, and exposed the one global property still worth choosing.” — `src/App.tsx:510`, deck remainder | “Code guaranteed rows, columns and non-touch, then exposed occupied region letters so selection depended on region distinctness.” |
| 6 | “Larger candidate menus extended the explicit-region success to 24/24 paired trials.” — `src/App.tsx:514`, deck opening | “Across two reused boards and 24 menu variants, explicit-region selection was correct 24/24; candidate lists overlap and these are not 24 independent puzzles.” |
| 7 | “No explicit-region selection failure was found before the Choice interface limit.” — `src/App.tsx:514` | “All 24 tested explicit-region menus succeeded, including six at the 255-option limit; larger menus, new boards and search difficulty remain untested by this scale comparison.” |
| 8 | “Joint rejection was reliable in this set.” — `src/App.tsx:514`, all-invalid Choice row | “Choice selected ‘none’ on all six tested all-invalid sets; this small same-family sample does not establish a general rejection rate.” |
| 9 | “Analyze at board level; do not manufacture tiny p-values by multiplying correlated decisions.” — `src/App.tsx:943` | “Use distinct boards for generalization, paired board-level contrasts for treatments, and board-cluster uncertainty for repeated trajectories; report call-level variability separately.” |
| 10 | “Aggregate completion is equal in this sample; the solved boards and raw/local modes differ.” — `src/SubQAssessment.tsx:306` | “Both services completed 10/90 attempts. Jev completed one distinct board in both modes; SubQ completed two different boards only with local filtering. Nine paired boards cannot establish equivalent ability.” |

## Calculation appendix

Run from the artifact directory, without credentials or network:

```sh
python3 -I calculations.py > calculation-output.txt
```

The script uses only Python’s standard library. It enumerates column permutations independently for all nine boards, checks exactly one valid solution, reconstructs menus and chosen-cell truth, reproduces all 18 retained random probabilities, and recomputes the 18 split logical grades. It saves full outputs and 241 non-forced cell probability/label rows. Ground truth is never transmitted.

Core calculations, shown here as condensed equivalent snippets:

```python
# Two-sided CP limits: invert binomial tails using bisection.
P = lambda n,p,k: math.comb(n,k)*p**k*(1-p)**(n-k)
# lower: sum(P(n,p,i) for i in range(k,n+1)) == .025
# upper: sum(P(n,p,i) for i in range(k+1)) == .025

# Paired power for rates .2/.5 and discordance q:
# D ~ Binomial(N,q); conditional B-only count ~ Binomial(D,(q+.3)/(2*q)).
# Sum alternative mass over exact two-sided binomial rejection regions.

# Uniform policy recursion over correct-region subsets S:
# V(S) = mean_r_not_in_S[V(S union {r}) / len(menu(r,S))]
# V(all_regions) = 1; wrong cell branches contribute zero.

# Multiclass Brier and binned ECE:
brier = sum((p[k] - int(k == truth))**2 for k in p)
ece = sum(b['n'] * abs(b['p'] - b['accuracy']) for b in bins) / n
```

Selected outputs:

```text
CP95: 1/9 [.002809,.482497]; 2/9 [.028145,.600094]; 0/3 [0,.707598]
Fisher power n/arm: 39=.732009; 44=.802090; 58=.906036
McNemar N at 80%/90%: q=.3 25/29; q=.5 46/59; q=.7 64/83
Random expected solves/90: 1.5702691227350842
Greedy solved boards: sequence-5-1, sequence-5-3, sequence-7-1, sequence-9-2
Cell accuracy: Jev 41/121; SubQ 40/120
Jev Noul regions-present: 6/72 positives, TP6 FP5, Brier .052947
SubQ split regions-present: 6/72 positives, TP6 FP1, Brier .009642
AA Jev HLE: mean confidence .610429; accuracy .208577; ECE .401852
Remaining ledger headroom: 4.5 - .08695505 - .0589824 = $4.35406255
```

The greedy policy chooses the unoccupied region with the fewest immediately legal cells, breaks region ties alphabetically, and selects the first row-major legal cell, without backtracking. Oracle stopping is used only for evaluation; it cannot alter whether an off-solution prefix eventually solves. Its 4/9 result is a descriptive baseline on the existing small corpus, not a population estimate or a tuned policy comparison.

Repository: `queens-model-assessment`; branch: `claude/decision-models-refresh`; final observed HEAD: `5fdfb5b57d7bdac6a4b25b21c9f019ce19e12f18` from concurrent work; no upstream tracking branch shown.

Worktree: /Users/joeywilkes/Desktop/scripts/queens-model-assessment/.worktrees/decision-models-refresh