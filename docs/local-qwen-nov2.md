# Local Qwen update: 2026-11-02

This is an offline audit against the published `2026-11-01-local-coverage` snapshot (captured `2026-11-01T16:16:33.771111+00:00`). It supplements [the November 1 coverage report](local-assessment-coverage.md); the earlier report and frozen snapshot remain unchanged.

The read-only canonical source is the `ollama-bigger-qwen` benchmark checkout, branch `claude/ollama-bigger-qwen`, observed HEAD `590d66611cdbe791dbbc115d926bf2c944d30b30`. Source paths below are relative to that checkout. The time gate was verified at `2026-11-02T18:36:06Z` (11:36 a.m. Mountain Standard Time), after the required November 2, 9 a.m. cutoff. The audit ran, without Ollama requests, inference, service changes or writes to the source checkout.

## Verified changes

There are **57 new primary receipts and five new rescue receipts**. Assessment coverage rises from **407 to 464 primary calls**, **33 to 38 rescue calls**, and **17 to 19 study roots**. Rescue results remain separate from strict one-shot accuracy.

| Condition | Previously recorded | Now recorded / planned | Strict | Format-only | Budget-limited | Incorrect completed |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Qwen 27B sampling r2 | 22 | 24/24 | 17 | 4 | 0 | 3 |
| Qwen 9B sampling r3 | 0 | 24/24 | 16 | 2 | 6 | 0 |
| Qwen 27B sampling r3 | 0 | 24/24 | 22 | 2 | 0 | 0 |
| Qwen 4B fresh1 four-arm | 30 | 37/48 | 13 | 4 | 20 | 0 |

All other study counts are unchanged. The two added 27B r2 calls are `baseline_panel-9-34` (strict) and `caveman_panel-9-34` (completed incorrect). The seven new 4B fresh1 calls all ended at 32,768 tokens with empty final-answer content. Its strict numerator remains 13; the larger denominator represents newly observed unfinished attempts, not revision of earlier answers.

The latest session is `public/evidence/ollama-models/sessions/20261101T230005.json`, local start `2026-11-01T23:00:05`, finish `2026-11-02T08:52:48`. It records 27B r2 and both r3 studies complete, with fresh1 4B ending at `deadline`. Thus the prior report's r3 “planned/unstarted” status has now progressed to completed primary panels; r3 was not superseded.

## Historical evidence integrity

The old snapshot manifest was compared against the corresponding live source paths, including the pilot. **2,556 directly copied files remain byte-identical**. **383 published host-summary objects** still match every corresponding allowlisted source `host.json` window field. The host comparison is a field comparison because snapshots deliberately retain reduced telemetry, not full raw host files.

All previously published plans, prompts, arm texts, skill artifacts, images, primary and rescue requests, responses, metadata, grades and diagnostics are unchanged. Nine source `summary.json` files changed:

- `qwen3.5-27b-q4_K_M-np24576-qwen-sampling-r2` and `qwen3.5-4b-fresh1-4arm-np32768`: new rows, corresponding treatment/size aggregates and updated timestamp.
- `qwen3.5-27b-q4_K_M-np24576`, `qwen3.5-27b-q4_K_M-np24576-qwen-sampling-r1`, `qwen3.5-4b-np32768-loopstop-audit`, `qwen3.5-9b-nvfp4-np24576`, `qwen3.5-9b-nvfp4-np24576-qwen-sampling-r1`, `qwen3.5-9b-nvfp4-np24576-qwen-sampling-r2`, and `qwen3.5-9b-nvfp4-np32768-loopstop-audit`: **updated_utc only**.

No unsupported historical evidence mutation was found. The inventory also hashed 3,854 current primary/rescue directory files, including ancillary files, then reread them: all hashes were stable across the audit interval. This is a read-time stability check, not a claim that all ancillary files were retained in the old publication.

All **57 new primary strict grades** were independently recomputed from final-answer content and frozen board regions with `scripts/llm_panel/grading.py`; every result matches stored `grade.json`. All 57 request/response hashes, requested seeds, model tags and receipt model digests match their metadata and plans. All **five new rescue grades** were recomputed from the saved prefix plus returned continuation, and match stored grades. Publication still runs its full importer verification for the complete snapshot.

### The existing 9B r1 format discrepancy is not a new mutation

The source r1 summary still reports 15 strict, three format-only, five truncations and one incorrect. The website's derived format diagnostic reports four format-only. The differing call is `qwen3.5-9b-nvfp4-np24576-qwen-sampling-r1/receipts/caveman_panel-9-22`: the unchanged response is the bare array `[4,9,7,1,6,3,5,8,2]`.

It fails the strict object schema. Wrapping that sole array with the known board identity for a diagnostic check satisfies all four placement rules. The website deliberately recognizes this unambiguous bare-array format failure; the source's original object-extraction diagnostic did not. Keep strict at 15, preserve original artifacts, and label the website's count as a derived diagnostic. Do not rewrite the raw receipt or present the difference as a changed model answer.

## Results by arm and size

Cells show **strict / recorded**. The two sampling r3 panels and completed r2 panel have four planned boards per cell. Fresh1 4B also plans four per cell but remains incomplete.

| Condition | Arm | 5×5 | 7×7 | 9×9 | Total |
| --- | --- | ---: | ---: | ---: | ---: |
| 27B r2 | baseline | 3/4 | 3/4 | 2/4 | 8/12 |
| 27B r2 | caveman | 4/4 | 2/4 | 3/4 | 9/12 |
| 9B r3 | baseline | 4/4 | 4/4 | 1/4 | 9/12 |
| 9B r3 | caveman | 4/4 | 1/4 | 2/4 | 7/12 |
| 27B r3 | baseline | 3/4 | 3/4 | 4/4 | 10/12 |
| 27B r3 | caveman | 4/4 | 4/4 | 4/4 | 12/12 |
| 4B fresh1, partial | baseline | 2/3 | 1/3 | 1/3 | 4/9 |
| 4B fresh1, partial | schema | 2/3 | 0/3 | 0/3 | 2/9 |
| 4B fresh1, partial | neutral | 1/3 | 1/3 | 1/3 | 3/9 |
| 4B fresh1, partial | caveman | 2/4 | 1/3 | 1/3 | 4/10 |

Non-strict outcomes by size clarify these fractions:

- **27B r2 baseline:** format-only 1, 1, 2 at sizes 5, 7, 9. Caveman has two completed incorrect 7×7 and one incorrect 9×9 response.
- **9B r3 baseline:** one format-only and two truncations at 9×9. Caveman has one format-only and two truncations at 7×7, plus two truncations at 9×9.
- **27B r3 baseline:** one format-only at 5×5 and one at 7×7. All 12 Caveman calls are strict. All 24 calls yield rule-valid answers after the format diagnostic, but the strict headline remains **22/24**.
- **4B fresh1 baseline:** format-only 1/0/0 and truncations 0/2/2 across sizes 5/7/9. Schema truncations are 1/3/3. Neutral format-only counts are 2/1/0 and truncations 0/1/2. Caveman truncations are 2/2/2. None of the 11 unrecorded calls belongs in the observed failure denominator.

All four r3 format-only responses contain a single valid answer object inside a Markdown JSON code fence: 9B `baseline_panel-9-22` and `caveman_panel-7-01`; 27B `baseline_panel-5-21` and `baseline_panel-7-01`. Each was independently recognized as rule-valid after extraction, while strict parsing rejects the fence. This supports a narrow formatting observation, not a claim that constrained decoding would leave reasoning unchanged.

## Budget limits, rescues and loop detection

All six 9B r3 budget-limited calls report exactly **24,576 output tokens** and `done_reason: length`. Five have empty final-answer content and receive rescues. `baseline_panel-9-08` instead has 2,249 characters of unfinished final-answer content. The runner's `rescue_candidates()` excludes calls cut off while writing an answer, and the session log explicitly records `rescue_skipped` for this reason. Therefore **five rescues for six caps is expected**, not a missing sixth receipt or a completed answer. Repeated skip log entries are eligibility checks, not repeated model requests.

The five rescues use a separate greedy 256-token continuation with the source thinking and an answer prefix. Results are:

| Rescue call | Size | Strict rescue result |
| --- | ---: | --- |
| baseline_panel-9-34 | 9 | Incorrect |
| caveman_panel-7-04 | 7 | Correct |
| caveman_panel-7-50 | 7 | Correct |
| caveman_panel-9-08 | 9 | Incorrect |
| caveman_panel-9-34 | 9 | Incorrect |

That is **2/5 rescues**, with baseline 0/1 and Caveman 2/4. These are weaker follow-up outcomes, not additions to 9B r3's 16/24 one-shot strict result. 27B r3 has no caps and no rescues; fresh1 plans explicitly prohibit rescues.

The seven added 4B fresh1 calls are baseline `panel-7-34`, `panel-9-24`; schema `panel-7-34`, `panel-9-24`; neutral `panel-9-24`; Caveman `panel-9-24`, `panel-5-43`. Three new calls log a shadow detector trigger: schema `panel-7-34`, Caveman `panel-9-24`, and Caveman `panel-5-43`. The study now has **ten shadow triggers**, up from seven. These calls ran to their budget; no active loop stop changed their outcomes. R3 uses nonstreaming requests without this shadow detector, so absent r3 shadow flags do not establish absence of repetition.

## Frozen controls and interpretation

Both r3 plans preserve the same pilot-board list, images and full runtime snapshot as their respective r2 plans, including Ollama **0.40.10** and model digest. They use seed **20261031**, following r1 **20261029** and r2 **20261030**; the greedy seed remains **20261028**. R3 uses temperature **1.0**, top_p **0.95**, top_k **20**, min_p **0**, presence_penalty **1.5**, boolean thinking, 24,576 output tokens, 28,672 context, keep_alive zero, no tools/retries, and paired baseline-then-Caveman order. It does not use fresh1's four-arm counterbalancing. Its timeout differs by model as already frozen: 1,800 seconds for 9B and 4,176 for 27B.

The 9B r3 plan froze at `2026-11-02T06:58:50.240123+00:00`; 27B at `2026-11-02T09:46:23.452797+00:00`. The existing fresh1 4B plan remains byte-identical, with greedy decoding, seed 20261028, 32,768 output / 36,864 context, four-arm deterministic alternating order, streaming shadow detection and no rescues.

Runner hashes remain `ba31a8f2…` (overnight), `df0584aa…` (panel), `a4a5cbd7…` (runtime lock), and `6fc2dccc…` (loop detector), consistent with the preceding session. Receipt/session Git commit and branch remain null despite scripts_uncommitted=false. Preserve these nulls; capture-time source HEAD is not proof of receipt-time commit provenance.

The sampling rounds now provide three seeds on the same twelve public pilot boards, not 36 independent boards per model/arm. Strict totals vary across seeds: 9B r1/r2/r3 are 15/24, 18/24, 16/24; 27B are 21/24, 17/24, 22/24. These descriptive fluctuations do not establish a causal Caveman effect or generalization to unseen boards. Do not pool sampled and greedy results, active-stop studies, targeted audits, fresh1 studies, or rescue calls into one accuracy statistic. The prior report's small-sample, public-board, deterministic selection, and imperfect neutral-length-control limitations still apply.

## Remaining work and follow-up priorities

The two r3 panels and 27B r2 are now complete. Frozen-plan eligibility totals **515 primary calls**, of which **464 are recorded**. The 51 unrecorded calls consist of 40 in the historical original-budget conditions and **11 fresh1 4B calls**. The original-budget partial conditions remain historical; this inventory does not recommend automatically resuming them.

Fresh1 4B still lacks baseline/schema/neutral on `panel-5-43`, and all four arms on `panel-7-61` and `panel-9-45`. The next frozen-source refresh should preserve these missing cells until actual receipts exist. Existing queue entries for gpt-oss20B text four-arm (48), Qwen9B text four-arm (48), Qwen9B constrained JSON two-arm (24), and Qwen27B fresh1 four-arm (48) remain future conditions without recorded assessment roots: **168 queued calls**, outside the 515 frozen eligible calls.

1. Publish a new immutable snapshot and retain all prior snapshots. Acceptance: 19 studies / 464 primary / 38 rescue receipts, the 57-primary delta reconciled, original raw evidence unchanged, and full importer/regrade checks passing.
2. Let the authorized nightly owner finish the remaining 11 fresh1 4B calls under the existing plan and safety gates. Acceptance: all four arms have 12 recorded calls, or explicit still-partial counts; no compensating reruns selected by outcome.
3. Complete the queued text and constrained-format controls as their own frozen conditions before making modality or schema-enforcement claims. Keep the format-only diagnostic distinct from strict accuracy throughout.
4. Use a separately frozen, disjoint replication set and predeclared seed/order/analysis rules before generalizing the observed seed or arm differences. Keep public-board exposure claims precise; additional seeds on the old panel do not create a held-out test.
5. Continue shadow-only loop detection and evaluate escapes and false positives on independent traces before active stopping. The extra 4B shadow triggers are observational evidence, not validation that stopping is harmless.
6. Repair future Git provenance recording in a separate runner change without backfilling historical receipt metadata. No operational runner change is part of this website audit.
