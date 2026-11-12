# Scientific review of the local open-weight assessments

Reviewed 11 November 2026, against the complete overnight source through 9 November (inactive snapshot `2026-11-09-overnight`: 27 study roots, 835 recorded of 875 planned calls, 38 separate rescues).

**Reviewer:** Claude (orchestrating model), from evidence gathered offline by GPT-6.1 Sol and from paired statistics I recomputed myself from the snapshot catalog. The fact packet with file-level citations is in [the evidence appendix](scientific-review-2026-11-11-evidence.md). No model was run for this review.

**Scope:** the local Ollama studies (Qwen3.5 4B, 9B and 27B, Gemma 4 E4B, LLaVA-Llama3 8B, gpt-oss 20B) and how the site compares them with each other and with the hosted panels. The hosted and decision-model studies were reviewed earlier in [the methods critique](methods-critique.md) and are not re-reviewed here.

## Contents

- [Verdict](#verdict)
- [What is credible](#what-is-credible)
- [Irregularities that weaken claims](#irregularities-that-weaken-claims)
- [What the numbers can distinguish](#what-the-numbers-can-distinguish)
- [Consistency between agents and documents](#consistency-between-agents-and-documents)
- [Which claims survive](#which-claims-survive)
- [Analysis fixed in advance for the studies queued on 11 November](#analysis-fixed-in-advance-for-the-studies-queued-on-11-november)
- [Recommendations](#recommendations)

## Verdict

The record keeping is strong and the inference is weak. Every count on the site can be traced to a hashed receipt and regraded offline, and failures are kept rather than tidied away. That makes the work **credible as a description of what each configuration did on twelve boards**.

It does not support comparative or causal claims. No local study was preregistered, most follow-up studies were designed after looking at earlier results, each cell is one greedy run on four boards, and the models differ in several settings at once. Read every local result as exploratory. In particular:

- No Caveman-versus-baseline difference in any of the 23 completed studies is distinguishable from no difference, and the direction changes between models and board sets.
- The table of open-weight scores is not a ranking of model capability.
- The gpt-oss budget comparison (32,768 against 65,536 tokens) is not the same run given more room. It is two different runs.

## What is credible

1. **Frozen plans precede the calls.** In every study root the plan, with board, prompt and runtime hashes, was written before the first recorded call. A new setting always became a new study folder; no frozen plan was edited.
2. **Independent regrading.** The importer, written by a different agent from the runner, rechecks request and response hashes, the requested controls, the model digest, the strict grade and the format diagnostic for all 835 receipts. All verify. Earlier snapshots still verify in place.
3. **Failures stay in the record.** Token-budget cut-offs, the two superseded partial studies (40 unrecorded calls), one transport error with unknown usage, one abandoned start, and the 38 rescues are all kept and kept separate. Nothing is imputed as a failure and nothing is rescued into a strict score.
4. **A wrong assumption was left visible.** The loop-stop was assumed to stop only hopeless calls. The audit found one stopped call that went on to solve its board. The original results were not rewritten; later studies switched to a shadow detector that records but never stops.
5. **Within a study, arms are matched.** Same boards, same model build, same generation settings; only the system prompt (or the requested JSON schema) changes. Arm order alternates by board.
6. **Board-set replication exists for two conditions.** Qwen 9B image and gpt-oss text (high effort, 32,768) each ran on both fresh sets.

## Irregularities that weaken claims

Ordered by how much they limit what can be concluded.

### High

**1. No preregistration, and designs chosen after seeing results.** The hosted panels have dated preregistration documents. The local studies have none. Budgets were raised from 12,288 to 24,576 to 32,768 after cut-offs were observed. The loop-stop threshold was tuned on the stored traces it was then credited with classifying. The gpt-oss medium-effort and 65,536-token studies were queued because the 32,768 run had 24 cut-offs and shorter Caveman traces. Each step is reasonable engineering. Together they mean no local contrast is a confirmatory test, and with models × arms × sizes × budgets × seeds × stopping policies × grading rules there are many contrasts to choose from and no correction for choosing.

**2. Twelve boards, four per size, one run per cell.** A four-arm study is 48 calls but only 12 boards, and arms reuse boards, so the calls are not 48 independent trials. The sampling rounds reuse the same twelve pilot boards, so three rounds add seeds, not boards. A 95% interval on 9 of 12 runs from 0.47 to 0.91. See [the next section](#what-the-numbers-can-distinguish).

**3. Cross-model rows differ in several factors at once.** Qwen 27B ran at 24,576 output tokens and 28,672 context for safety; the other thinking image models at 32,768 and 36,864; LLaVA-Llama3 at 4,096 and 8,192 with no thinking. Three runtime and quantisation combinations are in play (MLX nvfp4, llama.cpp Q4_K_M, llama.cpp MXFP4). gpt-oss saw text, the others mostly images, and "thinking" is a boolean for some models and an effort level for another. A score ordering across these rows cannot be attributed to model size, family, modality or budget.

**4. The determinism assumption failed where it was relied on.** The queue note for the 65,536-token gpt-oss study predicted that calls which finished at 32,768 "should reproduce". None did: 0 of 24 finished answers are identical and no call shares even a common thinking prefix, although all 48 request pairs differ only in `num_predict` and `num_ctx`. Outcomes moved in both directions: 10 calls gained a strict answer and 4 lost one, including calls that had answered in under 15,000 tokens and then ran to the 65,536 cap. So the net change of +6 strict (23 to 29 of 48) cannot be read as "more budget finishes more boards"; run-to-run variation of this size is unmeasured. Determinism was verified only for Qwen 9B on MLX (24,576 to 32,768: 18 of 18 finished answers identical). The 4B pilot also failed to reproduce, for a different reason (warm cache). The general statement "greedy is deterministic" in the lessons document is too broad.

**5. "Fresh" boards are not unseen boards.** Fresh1 and fresh2 are disjoint from the pilot set and from each other, and each was frozen before any *local* model ran on it. But all 36 boards come from the hosted frontier panel already published in this book, fresh1 was chosen after the pilot results and fresh2 after the fresh1 results (by a deterministic rule, which helps). The queue note's phrase "before any model saw it" overstates this. They are replication sets, not held-out sets.

### Medium

**6. Loop-stop results are censored, and unevenly.** In the two active loop-stop studies, 10 of 11 stops fell in the Caveman arm. A stopped call is not a failed call, so those strict counts are lower bounds, biased against Caveman. The audit that reran the 11 stopped calls is outcome-selected and cannot give a false-positive rate. The detector's "no false positives" record was in-sample. In shadow mode it has since flagged calls that went on to answer correctly (5 of 16 flags in gpt-oss fresh2).

**7. Caveman is a bundle, and the control is loose.** The Caveman system prompt is 707 words. The neutral control is 885 words of unrelated prose: close in tokens (1,914 against 1,984 input tokens for Qwen) but not matched, and its content is itself a treatment. The comparison shows what this prompt did, not what terse style does.

**8. A cut-off is a budget outcome, not an inability.** Counting it as not solved is right for a fixed-budget score. It is wrong as evidence the model cannot solve the board, and budgets differ by model (point 3).

**9. Studies span nights and runner versions.** Qwen 27B fresh1, Qwen 9B text and Qwen 9B JSON each contain receipts from two runner hashes. The memory-admission rule changed on 3 November. One 65,536-token call ended in a client stream error ("token repeat limit reached") with no usage; it sits in the denominator as not solved, so that study has 47 actual answers. One interrupted start was archived and replaced. Session result labels are unreliable on their own: the 7 November session lists no result for a study that recorded 36 calls that night.

**10. Provenance is partly reconstructed.** Of 835 receipts, 102 carry no runner block and 491 have a null git commit, because the launchd job could not read the repository. 242 are attributed through a hash-to-commit table, most of it backfilled on 4 November. The hashes match, which identifies the script, but it is not a contemporaneous record of a clean checkout.

**11. A "passed" selftest includes a check that fails by design.** The loop-audit check has failed in every full selftest since the audit's escape and is marked not required. A reader who sees "full selftest passed" should know that.

### Low

- Request seconds exclude admission waits, loads, idle gaps and the abandoned attempt, so they are not job cost.
- The local cost figures price local token counts at hosted Qwen tariffs saved on 30 October. Electricity and hardware are unmeasured, the 4B rate is a proxy, and there is no tariff for gpt-oss, Gemma or LLaVA.
- Whether heat or memory pressure changed any answer is unconfirmed; the data cannot separate it.

## What the numbers can distinguish

Strict answers out of 12 boards, baseline against Caveman, with the boards where exactly one arm succeeded. The last column is an exact two-sided sign test on those discordant boards. I computed these from the snapshot catalog; they are descriptive, since nothing was preregistered.

| Study | Baseline | Caveman | Baseline only | Caveman only | Exact p |
| --- | --- | --- | --- | --- | --- |
| Qwen 4B pilot (12,288) | 1 | 5 | 0 | 4 | 0.12 |
| Qwen 4B fresh1 | 4 | 5 | 2 | 3 | 1.00 |
| Qwen 9B fresh1 image | 9 | 10 | 1 | 2 | 1.00 |
| Qwen 9B fresh2 image | 11 | 9 | 3 | 1 | 0.62 |
| Qwen 9B fresh1 text | 7 | 6 | 3 | 2 | 1.00 |
| Qwen 9B loop-stop (censored) | 11 | 8 | 3 | 0 | 0.25 |
| Qwen 27B fresh1 image | 9 | 12 | 0 | 3 | 0.25 |
| Qwen 27B sampling r1 / r2 / r3 | 9 / 8 / 10 | 12 / 9 / 12 | 0 / 3 / 0 | 3 / 4 / 2 | 0.25 / 1.00 / 0.50 |
| Gemma 4 E4B fresh1 | 4 | 0 | 4 | 0 | 0.12 |
| gpt-oss fresh1 text (high, 32,768) | 6 | 6 | 3 | 3 | 1.00 |
| gpt-oss fresh2 text (high, 32,768) | 6 | 7 | 3 | 4 | 1.00 |

- The smallest p-value is 0.12. With twelve boards, even a 4–0 split cannot reach 0.05, and these are the most favourable of many available contrasts.
- Direction is not stable: Caveman is ahead for Qwen 27B and the 4B pilot, behind for Gemma and for Qwen 9B on fresh2, and level for gpt-oss. Qwen 9B itself flips between fresh1 (9 against 10) and fresh2 (11 against 9).
- The two most suggestive patterns are Qwen 27B (Caveman never behind on any board in four of five studies, largely through fewer format slips) and Gemma (Caveman 0 of 12). Both are worth a replication. Neither is established.
- gpt-oss effort: medium solved 29 of 48 against 23 at high, with 12 calls solved only at medium and 6 only at high (exact p about 0.24), and 10 cut-offs against 24. Suggestive, chosen after the fact, one board set.

For scale: separating a 50% from a 75% solve rate with 80% power in a paired design needs on the order of 50 to 60 boards per arm. The studies have 12.

## Consistency between agents and documents

Three agents touched this evidence: Claude wrote and operated the runner, Codex wrote the importer and the site pages, and Sol performed this audit. That separation is a real strength: the grades on the site were recomputed by code that did not produce them. The numeric audit of the 6 November report found no wrong historical number.

Inconsistencies found:

- **Stale statements on the live page.** The local chapter still describes gpt-oss fresh2 as 18 of 48 recorded, says new receipts have null commit fields (242 now map to a commit), and its budget chart's top bin is labelled as ending at 32,768 although answers now exceed it.
- **Runner documents claim more than the evidence shows** on determinism (point 4) and board exposure (point 5).
- **Two idle nights.** The queue emptied on 8 November and the job ran with nothing to do on 9 and 10 November. Not a validity problem, but the session records read "complete" for every study on those nights, which looks like activity.
- **Scoring rule differs between views.** The shared-boards leaderboard counts a right answer in the wrong format as solved for the 4B pilot rows; the open-weight views rank by strict answers and show wrong-format answers as a separate segment. Both are labelled, but a reader comparing the two views is comparing different rules, different budgets (hosted runs used 12,288 tokens) and 36 boards against 12.

## Which claims survive

| Claim | Status |
| --- | --- |
| Each configuration's counts on its twelve boards | Supported and reproducible from receipts |
| Qwen 9B and 27B solve most 5×5 and 7×7 boards from an image at these budgets | Supported as description; 9×9 is 4 boards per arm |
| LLaVA-Llama3 8B solved none; Gemma 4 E4B solved few | Supported as description of these builds and budgets |
| Cut-offs, not wrong answers, are the main failure for gpt-oss at high effort | Supported (24 of 48 at 32,768; 1 wrong answer) |
| The loop detector is safe to use as a stop | Not supported; one audited escape, several shadow escapes |
| Caveman helps, hurts, or saves cost in general | Not supported in either direction |
| A larger model, or text input, or JSON output is better | Not identified; factors are confounded |
| More budget finishes more gpt-oss boards | Not identified; the two runs diverged from the first token |
| Fresh-set results generalise to unseen boards | Not tested; boards are public and few |
| Local models compare to hosted models at a given cost | Not supported; different budgets, rules and price basis |

## Analysis fixed in advance for the studies queued on 11 November

Four fresh2 studies were added to the queue on 11 November at 20:47 local time, before any of their calls ran (runner checkout commit `92d01052`). To make at least these confirmatory, the analysis is fixed here, in a commit that predates the 23:00 start.

Primary outcome for all four: strict answers out of 12 boards per arm, with discordant boards reported. Cut-offs and transport errors count as not solved and are reported separately. No result will be described as an effect unless stated below.

1. **gpt-oss 20B, fresh2, text, medium effort** (against the existing fresh2 high-effort study). Prediction from fresh1: medium has fewer cut-offs and at least as many strict answers. Replicated if, over 48 paired calls, medium has fewer cut-offs **and** strict(medium) ≥ strict(high). An effort effect on accuracy is claimed only if the discordant calls pooled over fresh1 and fresh2 (96 pairs) give exact two-sided p < 0.05.
2. **Gemma 4 E4B, fresh2, image.** Prediction from fresh1: Caveman scores below baseline. Direction replicated if Caveman < baseline on fresh2. A Caveman deficit for this model is claimed only if discordant boards pooled over fresh1 and fresh2 (24 boards) give exact two-sided p < 0.05.
3. **Qwen 4B, fresh2, image.** No directional prediction (fresh1: 4 against 5). Reported descriptively; it tests whether 4B's low fresh1 score (16 of 48) repeats within ±6 of 48.
4. **Qwen 9B, fresh2, text.** Prediction from fresh1: text scores below image for the same model and boards (26 against 38 of 48). Replicated if text < image on fresh2 across all four arms combined.

Limits that remain: fresh2 is a public twelve-board set, each cell is still one greedy run, and four predictions are being tested, so one success by chance is plausible.

## Recommendations

1. **Label the whole local chapter exploratory** in one sentence at the top, and remove ordering language from cross-model tables. The redesigned leaderboard already groups rows by board panel and says they are not a controlled ranking.
2. **Fix the three stale statements** when the new snapshot is activated (in progress in the display pull request).
3. **Correct two sentences in the runner documents:** greedy reproducibility was shown for Qwen 9B on MLX only, and fresh sets are disjoint replication sets drawn from the public panel.
4. **Measure run-to-run variation before any more budget or effort contrasts.** Repeat one finished gpt-oss study with identical settings. If answers change, single-run differences of six calls mean little; if they do not, the context-size sensitivity is the finding.
5. **Add boards, not arms.** A third and fourth disjoint set, chosen by the existing rule and frozen with a written analysis like the one above, is worth more than another prompt variant. Sixty boards per contrast is the scale at which a moderate effect becomes visible.
6. **Keep the loop detector in shadow mode** and stop describing its flags as loops.
7. **Record the commit at call time.** The hash table works, but a contemporaneous commit in each receipt would remove the backfill caveat for future studies.
