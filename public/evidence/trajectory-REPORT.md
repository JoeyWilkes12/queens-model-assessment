# Jev can complete one tested 5×5 board, but restarts did not solve the other eight

Follow-up to the [expanded illustrated Queens assessment](../2026-09-19-comprehensive/REPORT.md). Inference completed on September 30, 2026, Mountain time / October 1 UTC. This chapter adds evidence; the previous report and its PDF remain historical artifacts.

## Contents

- [Findings](#findings)
- [What we had already tested](#what-we-had-already-tested)
- [Color then cell, starting empty](#color-then-cell-starting-empty)
- [Results by board size](#results-by-board-size)
- [What the successful board required](#what-the-successful-board-required)
- [Failure, restart, and independence](#failure-restart-and-independence)
- [Exact-request repeatability](#exact-request-repeatability)
- [Option order and batching](#option-order-and-batching)
- [Version pinning and API controls](#version-pinning-and-api-controls)
- [Cost and speed](#cost-and-speed)
- [Validation pause and recovery](#validation-pause-and-recovery)
- [Assessment and unresolved questions](#assessment-and-unresolved-questions)
- [Evidence and reproduction](#evidence-and-reproduction)

## Findings

- Jev completed **one of nine new boards**, a 5×5, in every attempt. It did so with both all-region-cell menus and menus filtered for immediate conflicts. Each condition scored 5/45 complete attempts overall, all successes on that same board. Neither 7×7 nor 9×9 completed.
- Restarts did not convert the other eight boards into successes. Immediate-conflict filtering prevented local violations but left global planning failures: a cell can obey the current local rules and still make completion impossible.
- Ten byte-identical requests for each of 17 frozen questions showed **Choice variation in 8/17 groups** and **probability variation in 17/17**. The unchanged reported build was therefore empirically variable through this route. We cannot assign the cause specifically to model internals.
- Four concurrent trajectories and nine independent questions batched into one request worked. Shared context and reversed option order changed some response patterns, so neither should be treated as a harmless substitute for singleton prompts.
- New confirmed inference cost was **$0.043400532**. Including a retained allowance for the locally blocked route probe, all-study accounted spend is **$1.059080592**, leaving **$1.940919408** under the original $3 cap.

## What we had already tested

We did previously test a partial version of this idea: one five-request sequence on the original 5×5 board. Each request chose a column for a fixed row and received previous choices. The final placement was invalid. It never selected a color first or restarted after a detected failure. See the [old implementation](../2026-09-18-jev-deep-dive/decisions_eval.py) and [assessment](../2026-09-18-jev-deep-dive/ASSESSMENT.md).

Later studies tested complete row constructions, prepared complete candidates, single moves from supplied correct placements, and candidate Choice/Noul/Score judgments. None was a complete color-then-cell restart campaign. This follow-up fills that gap.

## Color then cell, starting empty

The [frozen protocol](PROTOCOL.md) uses nine new synthetic boards: three each of 5×5, 7×7, and 9×9. Every region is connected and each board has exactly one solution, certified by row-order and minimum-remaining-values search. Boards were generated before model inference, with frozen seeds, and excluded symmetry equivalents of the prior corpus. They come from the same generator family; singleton regions and the generator's deliberate 9×9 singleton seeding remain material limitations.

For each board, five attempts ran in each of two conditions. Every attempt started with zero queens. A color Choice selected an unoccupied region. A subsequent cell Choice selected a cell in that region. Accepted placements became the next request's state. The model received a letter matrix plus explicit region membership, rules, and accepted placements. It did not receive the hidden solution, global viability labels, prior failed attempts, or validator feedback.

In the **raw** condition, the cell menu contained all cells in that region. Region membership and unused-region menus are already supplied by code. In the **local** condition, code also removed cells that reuse an occupied row or column, or touch an existing queen. Neither mode globally filtered candidates. A one-option menu became a forced transition without a paid model request. These forced placements are counted separately.

The deterministic engine checked a selected cell first for local conflicts and then for membership in the unique solution. A wrong but locally legal placement makes the prefix globally unextendable. The attempt stops there; the next scheduled attempt starts empty. There is no backtracking, answer repair, or learning from failure messages.

## Results by board size

| Size | Distinct boards | Raw solved attempts | Local-filtered solved attempts | Boards completed in either mode |
|---|---:|---:|---:|---:|
| 5×5 | 3 | 5/15 | 5/15 | 1/3 |
| 7×7 | 3 | 0/15 | 0/15 | 0/3 |
| 9×9 | 3 | 0/15 | 0/15 | 0/3 |
| Total | 9 | 5/45 | 5/45 | 1/9 |

| Board | Raw / local solves | Median correct prefix, raw / local | Distinct ordered traces, raw / local |
|---|---:|---:|---:|
| sequence-5-1 | 5/5 · 5/5 | 5 · 5 | 2 · 4 |
| sequence-5-2 | 0/5 · 0/5 | 1 · 1 | 3 · 2 |
| sequence-5-3 | 0/5 · 0/5 | 1 · 2 | 3 · 2 |
| sequence-7-1 | 0/5 · 0/5 | 4 · 5 | 1 · 1 |
| sequence-7-2 | 0/5 · 0/5 | 1 · 1 | 1 · 1 |
| sequence-7-3 | 0/5 · 0/5 | 0 · 0 | 2 · 3 |
| sequence-9-1 | 0/5 · 0/5 | 2 · 2 | 2 · 2 |
| sequence-9-2 | 0/5 · 0/5 | 3 · 1 | 3 · 3 |
| sequence-9-3 | 0/5 · 0/5 | 3 · 3 | 2 · 2 |

All 90 scheduled trajectories have final puzzle outcomes. There were 10 solves, 11 immediate local-rule failures, and 69 globally unextendable prefixes. Raw had 5 solves, 11 local violations, and 29 global dead ends. Local had 5 solves and 40 global dead ends. No final campaign attempt was censored by network errors or the budget. The initial harness pause is preserved separately below.

The correct-prefix measure excludes the failing cell. The saved `accepted_queens` field can include a locally legal failing cell, so it is not interchangeable with correct-prefix length. See the derived [trajectory results](trajectory_results.json) and [audit](audit.json).

## What the successful board required

`sequence-5-1` has two singleton regions. In each raw success, seven model calls made seven non-forced decisions; three additional decisions were forced by singleton menus or the final remaining color. In each local success, four model calls were sufficient and six decisions were forced by code. Jev still had meaningful choices to make, and all ten final placements passed the completed-board validator.

The same valid final board does not imply the same decision sequence: raw successes used two different ordered traces; local successes used four. Five attempts on one board do not create five independent demonstrations of general board coverage.

An offline uniform-random comparator chooses uniformly among unoccupied regions and then uniformly among its available cells. Its exact full-solve probability on this board is about **0.298%** with raw menus and **13.724%** with local menus. The baseline is computed by dynamic programming over correct prefixes; no paid model or Monte Carlo selection is involved. It illustrates how filtering changes chance performance. It is not Jev's policy and does not justify an independence-based significance claim about five repeated successes.

## Failure, restart, and independence

Every repetition resubmitted fresh stateless state without prior answers or failure history. Repeating after a failure therefore tests another construction attempt; it does not provide the model new evidence about the puzzle. A strongly preferred wrong cell can simply recur. That happened consistently on several boards.

All four independent work streams respected dependencies within a trajectory: cell choice followed color choice, and the next move followed the accepted cell. Concurrency is an execution property, not proof that replies are statistically independent. Same-board attempts share puzzle structure, model, provider, and serving period. Analyze distinct boards as the diversity denominator and keep repetitions clustered by board and condition.

The engine's early global stopping gives an exact first-wrong-placement boundary on a unique-solution board. It does not test Jev's ability to discover the contradiction itself, explain it, backtrack, or recover with feedback. These are different capabilities. We did not label an oracle-detected global dead end as an immediate local-rule violation.

## Exact-request repeatability

There were 170 separate HTTP calls: ten repeats each for nine first-color questions and eight fixed-region-A cell questions. Region A was a singleton on one board, so that cell had no inference probe. Serialized request-body hashes match within each ten-repeat group. Inputs contain no nonce, fresh UID, attempt index, or prior response.

| Frozen question | Returned Choice counts | Modal agreement |
|---|---|---:|
| sequence-5-1, region | B:9, D:1 | 90% |
| sequence-5-1, cell A | r3c3:6, r1c3:3, r1c1:1 | 60% |
| sequence-7-1, region | B:7, F:3 | 70% |
| sequence-7-1, cell A | r1c3:5, r3c3:4, r2c2:1 | 50% |
| sequence-7-2, cell A | r1c2:5, r1c1:5 | 50% |
| sequence-7-3, region | G:6, B:4 | 60% |
| sequence-7-3, cell A | r1c3:8, r4c3:1, r4c4:1 | 80% |
| sequence-9-1, cell A | r3c1:7, r1c1:3 | 70% |

These are the eight Choice-varying groups. The other nine returned one label throughout; nevertheless, their distributions varied. Across all 17 groups, there were nine or ten distinct reported probability vectors each. The largest single-option range within a group reached 0.17. Full counts, probability ranges, and pairwise total variation are in the audit, rather than rounded away in the narrative.

This establishes empirical non-repeatability through the measured route with the same reported build. It does not tell us whether variation is intrinsic to Jev, caused by serving infrastructure, or produced elsewhere in the inference pipeline. Live metadata says implicit caching is unsupported, but that does not establish every possible cache layer's behavior. Variable responses cannot be explained by a single stable cached reply; stable replies alone do not prove independent inference.

A color selection has no uniquely correct label on an extendable prefix. Its agreement is a preference measure. Cell correctness is separate. Jev's empty-board region-A judgment also differs from the same region reached after useful placements: the correct complete trajectory cannot be inferred just from standalone cell agreement.

## Option order and batching

Five requests each carried nine independent first-color questions and returned 45 decisions. Every question targeted one named board in shared state. All calls succeeded. A cell query dependent on a color decision was not batched with that decision: questions do not consume each other's answers.

The shared-state batch changes context. On `sequence-7-3`, singleton calls returned G six times and B four times; batch calls returned B four times and G once. This is a changed observed preference, not proof that batching caused it: there are only five batch repeats, and ordinary response variability is already present.

Twenty-four additional calls reversed cell-option insertion order: three per non-singleton region-A question, preserving all option labels and descriptions. Several response patterns changed. Canonical `sequence-5-3` returned r4c1 ten times, whereas reversed order returned r1c1 twice and r3c4 once. Canonical `sequence-9-3` returned r4c3 ten times, whereas reversed order returned r1c3 twice and r3c2 once. Option order should be frozen or deliberately counterbalanced in future tests. These controls are exploratory, with different repetition counts and sampling times; they are not causal effect estimates.

Parallel individual requests and question batching solve different orchestration problems. The former can preserve each input, while the latter can save HTTP overhead by sharing state. Neither removes dependencies between moves or turns the model into a recursive solver. The [research record](RESEARCH.md#parallelism-and-batching) distinguishes question-map batching from OpenRouter's asynchronous Batch API.

## Version pinning and API controls

All 593 successful requests requested **`typesafe/jev-1.13`**, disabled fallbacks, forced TypeSafe, and returned **`typesafe/jev-1.13-20260917`**. A runtime check would stop on a changed returned build. Discovery found no newer Jev version. No paid request used `~typesafe/jev-latest`.

A probe supplying the dated returned-build string was rejected by the local broker before upstream inference. The unchanged family-version route succeeded. Thus we verified practical pinning and detection of reported build drift, but did not prove the dated string is accepted as an immutable request ID by OpenRouter. We did not widen account or broker policy. The direct TypeSafe API documents `jev-1.13.0` through `/v1/systemone`; its direct route was not called. Those API naming differences are documented rather than silently mixed into this cohort. See [live discovery](discovery.json) and [model documentation](https://docs.typesafe.ai/models).

Jev does **not expose a documented temperature, seed, or top-p parameter** in the current Decisions schema or live supported-parameter metadata. Generic chat parameters do not establish Decisions support. Choice is documented as the highest-probability option, not a sample from its distribution. We did not inject unsupported controls or sample candidates ourselves. See the [OpenRouter request schema](https://openrouter.ai/docs/api/api-reference/alphadecisions/submit-a-decisions-request) and [TypeSafe API reference](https://docs.typesafe.ai/api).

TypeSafe's [self-consistency cookbook](https://docs.typesafe.ai/cookbooks/consistency_choice_cookbook) also shows variation, but adds a fresh UID to every state. Its own caveat acknowledges that irrelevant-field sensitivity and identical-request variation cannot be disentangled there. Our exact-byte control answers the latter question for this route; the two studies should not be described as identical designs.

## Cost and speed

| Ledger component | USD |
|---|---:|
| Historical all-study accounted amount | 1.014599966 |
| New confirmed usage cost | 0.043400532 |
| New unmetered route-probe allowance | 0.001080094 |
| New accounted amount | 0.044480626 |
| All studies accounted | 1.059080592 |
| Remaining original allowance | 1.940919408 |

There were 594 submitted HTTP attempts: 593 successful requests and one local pre-inference rejection. Successful calls returned 633 typed decisions. Those totals include trajectories, repeatability probes, and controls; they do not describe 633 independent puzzles.

The price remained $0.042 per million input tokens and zero output-token charge. The thread-safe runner reserved cost before sending and bounded this stage to $0.50 inside the original $3 total. Unknown costs retain a conservative reservation rather than being treated as zero. The new local broker rejection is retained in that accounting even though no upstream usage was observed.

| Size | Raw median summed API seconds to terminal outcome | Local median summed API seconds to terminal outcome |
|---|---:|---:|
| 5×5 | 0.843 | 0.681 |
| 7×7 | 0.669 | 0.727 |
| 9×9 | 0.973 | 0.999 |

These are times to either solve **or stop at the first failure**. Faster failure is not faster solving. Summed per-request client elapsed time counts original network calls even when responses were replayed during recovery. It excludes human review pauses, generation, oracle preparation, and website/report work. The four-request concurrency level and current provider performance limit direct comparisons with the old single-shot model timings.

## Validation pause and recovery

The first campaign paused when a response selected A with reported probability 0.26 while another option was shown at 0.27. My initial validator incorrectly made exact agreement between returned Choice and reported argmax a hard requirement. The API returned a structurally valid decision, so that assertion blocked a usable response.

I corrected the harness to execute the returned Choice faithfully and record probability-rank discrepancies as evidence. Original raw outputs, metadata, and the initial censored traces remain unchanged. The recovery required exact payload equality before replaying saved successful responses locally. It did not resubmit those requests or repair their answers. The remaining planned requests then completed. See [recovery.json](recovery.json) and [initial traces](initial_censored_trajectories).

Across all successful responses, 13 of 633 typed answers show a selected option 0.01 below the reported maximum. The distributions use coarse displayed values, but the cause of the discrepancy is unverified; rounding alone should not be asserted as the explanation. Do not silently replace returned Choice with your own argmax or treat the anomaly as a puzzle failure. It is an API-contract observation worth tracking separately.

## Assessment and unresolved questions

This follow-up changes the earlier blanket construction picture: with a color-then-cell workflow and explicit region-cell menus, Jev can assemble at least one tested unique solution from an empty board. The ability is selective. The other eight boards remained unsolved, including two boards of the same 5×5 size. Immediate-conflict filtering helped enforce local rules and sometimes extended correct prefixes, but it did not increase the number of completed boards.

Repeated restart is therefore useful for measuring robustness, but is not a substitute for constraint search. Same inputs can produce different decisions, while several strong wrong preferences remain stable. Both variability and stable errors matter. No temperature knob was available to force consistency, and higher agreement would not imply correctness.

The most consequential unresolved comparison is recovery with explicit feedback or backtracking: does Jev identify which earlier choice to revise, or only select when code has already exposed the remaining exact alternatives? Another useful comparison is more diverse board generation, including boards without singleton regions. That would show whether the lone solved board depends heavily on forced transitions. A direct TypeSafe route comparison and a genuinely new version remain access/availability-dependent, rather than hidden substitutions in this study.

These are future questions, not extra inference secretly added after seeing results. The current findings are limited to nine synthetic boards and one unchanged reported Jev build. No population accuracy, causal batching effect, calibrated Queens probability, or general intelligence ranking follows.

## Evidence and reproduction

- [Frozen protocol and questions](PROTOCOL.md), [research and primary links](RESEARCH.md), [manifest](manifest.json), and [live discovery](discovery.json).
- [Board inputs](boards), [exact requests](requests), [raw responses and metadata](raw), [ordered attempts](trajectories), and [derived attempt results](trajectory_results.json).
- [Call grades](grades/call_grades.json), [audit](audit.json), [harness](trajectory_eval.py), and [offline tests](test_trajectories.py). Private oracle files stay under `private/` and are excluded from the website.
- [Website trajectory chapter](https://joeywilkes12.github.io/queens-model-assessment/#/jev-trajectories) and [evidence atlas](https://joeywilkes12.github.io/queens-model-assessment/#/evidence-atlas). Publication status is recorded separately in the quality check; these are intended stable routes.

Offline reproduction, without another paid request:

```bash
python3 -m unittest discover -s evaluations/2026-09-30-jev-trajectories -p 'test_*.py'
python3 evaluations/2026-09-30-jev-trajectories/trajectory_eval.py audit
```

The audit regenerates derivatives from the preserved corpus, requests, outputs, and metadata; it does not call OpenRouter. Inference commands refuse unreviewed duplicate submissions. Reporting practice keeps observations, interpretations, and unresolved mechanisms distinct, and uses the exact engine rather than an LLM judge for puzzle correctness.
