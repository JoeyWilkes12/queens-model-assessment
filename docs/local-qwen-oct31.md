# Local Qwen: October 30–31 evidence review

Read-only review dated 2026-10-31. Source: the `claude/ollama-bigger-qwen` worktree, observed at commit `428c3ebe`; artifact paths below are relative to that source repository. No inference, selftest, detector replay command, service change, or evidence mutation was performed. The raw final answers were independently parsed and checked against the frozen board regions, including exact schema, integer columns, distinct columns and regions, and adjacent-row non-touching. Original grades remain unchanged.

The main finding is that a 9b call stopped for repetition subsequently solved its board within the existing 32,768-token audit budget. Sampling round 2 provides no consistent Caveman accuracy advantage: 9b has fewer strict solves under Caveman, while partial 27b Caveman results improve strict formatting but include two wrong solutions.

## What actually finished

`public/evidence/ollama-models/sessions/20261030T230006.json` records the session from October 30 at 23:00:06 to October 31 at 08:54:24, America/Denver. Both selected loop-stop audits and 9b sampling round 2 completed. 27b round 2 stopped at the deadline with 22/24 receipts. The final checkpoint in `sessions/launchd.log` says the next request would not finish before 09:00; it does not describe a failed inference. Docker preparation and restoration both returned 0. The log includes a brief 27b memory wait at 07:54:45, followed by a request at 07:55:23.

Round 2 uses temperature 1.0, top_p 0.95, top_k 20, min_p 0, presence_penalty 1.5, seed 20261030, num_predict 24,576, num_ctx 28,672, and no loop-stop. The table counts only observed first requests. “Format-only” means a correct answer after removing its single enclosing JSON fence; it is mutually exclusive with strict. “Incorrect” means a completed answer that violates puzzle rules. Caps have empty final answers and `done_reason: length`.

| Separate round-2 study | Arm | Observed / planned | Strict | Format-only | Incorrect | Caps | Rescue solved / tried | Missing |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 9b nvfp4 | Baseline | 12 / 12 | 10 | 0 | 0 | 2 | 0 / 2 | 0 |
| 9b nvfp4 | Caveman | 12 / 12 | 8 | 0 | 0 | 4 | 1 / 4 | 0 |
| 27b q4_K_M | Baseline | 11 / 12 | 7 | 4 | 0 | 0 | 0 / 0 | 1 |
| 27b q4_K_M | Caveman | 11 / 12 | 9 | 0 | 2 | 0 | 0 / 0 | 1 |

Sources: `public/evidence/ollama-models/qwen3.5-9b-nvfp4-np24576-qwen-sampling-r2/` and `qwen3.5-27b-q4_K_M-np24576-qwen-sampling-r2/`, each `plan.json`, `receipts/*/{request,response,metadata,grade}.json`, and existing `rescue/*/` artifacts. All 46 independent strict classifications agree with stored grades. Rescue checks reconstructed the supplied assistant prefix plus raw continuation; the one correct rescue is 9b Caveman `panel-9-05` and remains separate from strict.

27b is missing `baseline_panel-9-34` and `caveman_panel-9-34`. Its four baseline format-only answers are `panel-5-18`, `panel-7-04`, `panel-9-08`, and `panel-9-22`. The two Caveman incorrect answers, `panel-7-01` and `panel-7-50`, have distinct, non-touching columns but repeat regions. Thus baseline is rule-correct on all 11 observed boards after conservative format normalization; Caveman is rule-correct on 9/11. The apparent strict-score reversal is not evidence of improved reasoning.

9b caps are baseline `panel-9-08`, `panel-9-34`, and Caveman `panel-7-50`, `panel-9-05`, `panel-9-08`, `panel-9-34`. Correctness should remain separate from incompletion, and partial 27b results should retain their observed denominator.

## Selected loop-stop audit

These are outcome-selected reruns of the exact five 9b and six 4b calls stopped in the earlier 32k studies. They are not a new representative performance sample and cannot estimate an independent false-positive rate. Keep both original `loop_stopped` outcomes and later audit outcomes intact; do not pool them or amend the original study's strict count.

| Separate audit | Arm | Selected / observed | Strict | Format-only | Incorrect | 32,768-token caps | Audit rescues |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 4b | Baseline | 0 / 0 | 0 | 0 | 0 | 0 | 0 |
| 4b | Caveman | 6 / 6 | 0 | 0 | 0 | 6 | 0 |
| 9b | Baseline | 1 / 1 | 0 | 0 | 0 | 1 | 0 |
| 9b | Caveman | 4 / 4 | 1 | 0 | 0 | 3 | 0 |

Sources: the two `qwen3.5-*-np32768-loopstop-audit/` folders, their `audit_of` source folders, and their frozen `audit_calls` lists. No selected audit call is missing. The ten capped audit finals are empty; “still no answer at 32,768” does not establish permanent non-recovery.

The exception is 9b `caveman_panel-7-50`: the raw final is exactly `{"board_id":"panel-7-50","columns_by_row":[4,7,5,3,1,6,2]}`. It passes the full strict schema and all four board checks, finishing at **29,094 output tokens**. Its observed rerun duration is 750.66 seconds. The original client stop was at detector offset 31,000 characters, with 31,009 thinking characters actually stored and no final answer. This is direct matched-prefix evidence that this selected trace recovered after the stop.

Independent comparisons checked each entire original thinking string against the start of its audit thinking, rather than trusting `metadata.audit.identical_up_to_stop` or comparing only the detector offset. All eleven match, including streamed chunk overshoot:

| Model | Call | Detector offset | Entire stored prefix matched |
| --- | --- | ---: | ---: |
| 4b | caveman_panel-5-19 | 46,500 | 46,500 |
| 4b | caveman_panel-7-01 | 63,500 | 63,505 |
| 4b | caveman_panel-7-50 | 28,000 | 28,004 |
| 4b | caveman_panel-9-05 | 35,000 | 35,002 |
| 4b | caveman_panel-9-08 | 43,500 | 43,500 |
| 4b | caveman_panel-9-34 | 45,500 | 45,500 |
| 9b | baseline_panel-9-05 | 41,500 | 41,503 |
| 9b | caveman_panel-7-50 | 31,000 | 31,009 |
| 9b | caveman_panel-9-05 | 45,500 | 45,501 |
| 9b | caveman_panel-9-22 | 38,500 | 38,500 |
| 9b | caveman_panel-9-34 | 53,000 | 53,001 |

For all eleven pairs, complete stored request objects differ only in `stream: true` versus `false`: messages, image payloads, model, keep_alive, think and generation options match. This is strong trajectory evidence, but code provenance is not identical. Every original stopped receipt records runner SHA-256 `d1678c181b4d9707d3224ef643427fe0f6edd55f8b17d7df8dcda7e5c39765df` and panel `788e1aa12df02460f2bb2f07b1ba9026f557cdc85941c6734d0dab110c9a1956`; every audit receipt records runner `fefee4d9e835a584af32a0cea85ca0fc7ff759e9f9494c0811e8f59d3ede3d63`, panel `3087469ff82e442d184ad819174f1f567b4383f685051c81c2f2dc5b33f26e7e`, and runtime-lock `a4a5cbd736e62c6198900c117845fbb524e202e976a1bde41e4a95cb96dc157b` (absent from original metadata). Audit receipt commit/branch fields are null, so the current checkout commit must not be substituted as receipt provenance. Frozen-plan hashes describe plan creation, not these executed receipts.

The audits consumed 196,608 reported output tokens and 3,609.72 seconds for 4b, and 160,166 tokens and 4,172.59 seconds for 9b. These are full fresh-rerun usage totals. Original client-stopped responses have no terminal `eval_count`; character offsets are not token counts. Differences between old and new elapsed times are not isolated causal savings: transport, runner code, host conditions and execution dates differ, and the audit regenerates the prefix. Provider fee zero is not zero local operating cost; receipt local-total-cost values remain unknown.

## Historical context and interpretation

The primary 24,576-token greedy study ran on the October 28–29 night: stored metadata records 9b baseline 10/12 and Caveman 8/12 strict, with two and four caps, while 27b was 12/12 strict in each arm. Those are separate historical conditions, not added to round 2. Matching aggregate 9b counts do not mean matching sampled trajectories or prove sampling has no effect.

9b round 1 spanned October 29 morning and that evening; 27b round 1 ran October 30 morning. Their earlier report lines therefore are not new October 30–31 inference merely because the latest session checked them as complete. The 4b warm-cache pilot and fresh-load 32k condition are also different experiments. The October 29 crash at excessive 27b context remains a binding safety lesson, not a reason to repeat that setting.

The same twelve selected boards, fixed baseline-before-Caveman order, and one sample per board/arm/round limit generalization. Caveman combines style, a long system instruction and format behavior. Strict solve rate, format-normalized correctness, caps and elapsed cost answer different questions; a single headline score cannot separate these effects.

## Prioritized future assessments — proposals, not started here

1. **Finish the existing frozen sequence first.** Let the existing nightly owner finish both 27b round-2 `panel-9-34` calls, then round 3 for both models under its existing order and safety gates. The saved session requests three exploration rounds; no round-3 study folder existed at review. This records configured intent and remaining work, not a claim that a job is currently running or guaranteed to run tonight. Preserve round-specific results and seeds.
2. **Freeze a genuinely new board panel before evaluating it.** Stratify by size, singleton status and search difficulty, retain held-out boards for confirmation, and predeclare primary strict correctness, secondary conservative format correctness, caps, wrong completed answers and paired per-board comparisons. Repeat seeds under the same runtime; report uncertainty and paired disagreements without treating repeated measurements of one board as independent boards. Counterbalance arm order to reduce time/host-order confounding. Use round 3 and the new panel to test hypotheses generated here rather than tune and test on the same traces.
3. **Separate format adherence from the Caveman treatment.** Compare baseline, an explicit output-format instruction, a plain-system control matched to the Caveman system instruction's token length, and the full Caveman instruction. Keep board, seed, output budget, schema requirement and runtime matched; record prompt token counts. If structured-output enforcement is tested, freeze it as another condition applied consistently to arms. Predeclare both strict and format-normalized outcomes so fewer fences cannot masquerade as better puzzle solving.
4. **Validate stopping on safe 9b traces with matched transport and code.** Prefer a shadow detector on streamed calls allowed to finish through the same approved runner. Freeze its thresholds before a held-out panel, log firing offsets without stopping, then compare a separately frozen stop-on condition under the same stream mode, budget, fresh-load policy and code hashes. Measure lost correct answers within budget, caps, request time, host telemetry and known terminal token usage. Include both arms and unselected traces; the current selected audit supplies a counterexample, not a general false-positive estimate. Any new detector requires the owner's normal provenance/selftest process before use.

Every proposed run remains subject to the existing single-request ownership, shared locks, admission and resource guards. Keep 27b exclusively under the unattended nightly owner and **never above num_ctx 28,672**; larger budgets on 9b still require memory-safe admission and monitoring. No services, schedules, frozen plans or runner settings were changed by this review.
