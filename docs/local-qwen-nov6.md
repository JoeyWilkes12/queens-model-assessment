# Local open-weight update: November 6, 2026

The November 5–6 saved session adds **73 primary calls** to PR 18's `2026-11-05-overnight` snapshot: 48 Qwen 9B fresh2 image calls, the final seven Qwen 27B fresh1 image calls, and 18 gpt-oss 20B fresh2 text calls. The attachment's 73 study/call identities, outcomes and output-token counts match the receipts exactly. Previously completed studies listed in its status table were completion checks, not additional reruns.

Coverage is now **25 study roots, 709 primary receipts and 38 separate rescue receipts**. There are 20 completed assessment conditions (672 primary calls), three partial assessments (26 calls), and two targeted loop-stop audits (11 calls). The two completed historical active-loop-stop conditions remain censored experiments; completed recording does not make their results equivalent to uncensored conditions. No rescue was added by this session.

Sources: [new snapshot catalog](../public/evidence/local-qwen/snapshots/2026-11-06-overnight/catalog.json), [PR 18 snapshot catalog](../public/evidence/local-qwen/snapshots/2026-11-05-overnight/catalog.json), and the respective frozen plans linked below. The audit reads the canonical owner's saved evidence without contacting Ollama or changing source evidence or services.

## Attachment and session reconciliation

Saved session `20261105T224923.json` starts **November 5 at 22:49:23 MST** and ends **November 6 at 08:58:28 MST**. It spans 10 hours 9 minutes 5 seconds; do not relabel it as a 23:00 start. Its new calls comprise **59 strict solves and 14 budget-limited responses**. The attachment's rounded minutes are display approximations; analysis uses receipt elapsed seconds.

| Study | Prior recorded | New calls | New strict | New caps | Final recorded / planned |
| --- | ---: | ---: | ---: | ---: | ---: |
| Qwen 9B fresh2, image | 0 | 48 | 43 | 5 | 48/48 |
| Qwen 27B fresh1, image | 41 | 7 | 6 | 1 | 48/48 |
| gpt-oss 20B fresh2, text | 0 | 18 | 10 | 8 | 18/48 |

The 27B continuation adds schema/neutral/Caveman on `panel-7-61` and all four arms on `panel-9-45`. Only `neutral_panel-9-45` truncates; the six other added calls are strict. Its four format-only answers were already present in PR 18. The gpt-oss run ends at the session deadline with 30 unrecorded calls; these are not failed attempts.

All **73 new strict grades** were independently recomputed from frozen board regions and final-answer text and agree with saved grades. Request and response hashes were independently checked for all 73. Against PR 18, **3,834 published source files remain byte-identical**, and **612 published host summaries** match the allowlisted fields in the corresponding source telemetry windows. Eleven summary files changed: 27B fresh1 adds the seven new rows and aggregates, while ten historical summaries change only `updated_utc`. No published historical plan, prompt, arm artifact, image or receipt changed.

## Completed conditions: exact arm and size results

Each size cell below contains four recorded boards. **Strict / recorded** is the primary metric; format-only and capped counts remain separate.

| Condition | Arm | 5×5 strict | 7×7 strict | 9×9 strict | Total strict | Format-only | Caps |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Qwen 9B fresh2 image | baseline | 4/4 | 4/4 | 3/4 | 11/12 | 0 | 1 |
| Qwen 9B fresh2 image | schema | 4/4 | 4/4 | 4/4 | 12/12 | 0 | 0 |
| Qwen 9B fresh2 image | neutral | 4/4 | 4/4 | 3/4 | 11/12 | 0 | 1 |
| Qwen 9B fresh2 image | caveman | 4/4 | 4/4 | 1/4 | 9/12 | 0 | 3 |
| Qwen 27B fresh1 image | baseline | 2/4 | 4/4 | 3/4 | 9/12 | 3 | 0 |
| Qwen 27B fresh1 image | schema | 4/4 | 4/4 | 4/4 | 12/12 | 0 | 0 |
| Qwen 27B fresh1 image | neutral | 3/4 | 4/4 | 3/4 | 10/12 | 1 | 1 |
| Qwen 27B fresh1 image | caveman | 4/4 | 4/4 | 4/4 | 12/12 | 0 | 0 |

Sources: [9B fresh2 plan](../public/evidence/local-qwen/snapshots/2026-11-06-overnight/studies/qwen3.5-9b-nvfp4-fresh2-4arm-np32768/plan.json), [9B summary](../public/evidence/local-qwen/snapshots/2026-11-06-overnight/studies/qwen3.5-9b-nvfp4-fresh2-4arm-np32768/summary.json), [27B fresh1 plan](../public/evidence/local-qwen/snapshots/2026-11-06-overnight/studies/qwen3.5-27b-q4_K_M-fresh1-4arm-np24576/plan.json), [27B summary](../public/evidence/local-qwen/snapshots/2026-11-06-overnight/studies/qwen3.5-27b-q4_K_M-fresh1-4arm-np24576/summary.json).

Qwen 9B fresh2 is **43/48 strict**, with all five caps at size nine: baseline and neutral on `panel-9-58`; Caveman on `panel-9-32`, `panel-9-53` and `panel-9-51`. Every cap reaches 32,768 output tokens. There are no completed incorrect or format-only answers.

Qwen 27B fresh1 is **43/48 strict**, four format-only and one cap at 24,576 tokens. The baseline format-only counts are two at size five and one at size nine; neutral has one at size five. Thus 47/48 have rule-valid placements under the format diagnostic, but the strict headline remains 43/48. Its baseline, schema and Caveman arms all produce 12/12 rule-valid answers; the strict differences among them are formatting differences on this panel.

These two models' identical aggregate strict fraction **does not establish equal capability**: they ran different board sets, output budgets, quantizations and backends. Nor does schema's 12/12 in each condition prove a general schema-reminder benefit. Each is a separate exploratory condition with twelve boards and one call per arm/board.

## Partial gpt-oss condition

The [gpt-oss fresh2 plan](../public/evidence/local-qwen/snapshots/2026-11-06-overnight/studies/gpt-oss-20b-fresh2-text-4arm-np32768/plan.json) schedules 48 text-board calls at high reasoning effort. Only 18 have recorded outcomes. Every size/arm cell plans four boards, so the denominators below explicitly show the incomplete sample.

| Arm | 5×5 strict | 7×7 strict | 9×9 strict | Total strict / recorded | Caps |
| --- | ---: | ---: | ---: | ---: | ---: |
| baseline | 2/2 | 1/2 | 1/1 | 4/5 | 1 |
| schema | 1/2 | 0/2 | 0/1 | 1/5 | 4 |
| neutral | 2/2 | 1/1 | 0/1 | 3/4 | 1 |
| caveman | 1/2 | 1/1 | 0/1 | 2/4 | 2 |

There are no format-only or completed incorrect answers. Caps are baseline 7×7; schema one 5×5, two 7×7 and one 9×9; neutral 9×9; Caveman 5×5 and 9×9. All eight reach 32,768 output tokens. The sample contains the first four board blocks in full and two arms on the fifth board, so it overrepresents earlier strata. Comparing aggregate arm percentages now mixes different recorded board sets. Do not rank this partial condition with completed studies or present 10/18 as an estimate for the full panel.

## Usage and saved-rate cost scenarios

The [saved October 30 pricing artifact](../public/evidence/local-qwen-pricing.json) provides Qwen 9B input/output rates of **$0.17/$0.25 per million tokens**, and Qwen 27B rates of **$0.26/$2.60**. They are historical scenario inputs, not refreshed quotes or actual hosted bills. Cost is `(input tokens × input rate + output tokens × output rate) / 1,000,000`; reasoning tokens and capped output are counted once in output. Actual local provider fees are zero; electricity and hardware costs remain unmeasured. Hosted cache/image fees and route effects are not modeled.

Each completed condition below uses all twelve matched board pairs for its baseline/Caveman comparison. “Cost/strict” divides the whole arm's scenario cost, including failures and caps, by its strict solves.

| Condition | Arm | Input tokens | Output tokens | Scenario USD | USD / strict |
| --- | --- | ---: | ---: | ---: | ---: |
| 9B fresh2 image | baseline | 10,236 | 180,366 | 0.04683162 | 0.00425742 |
| 9B fresh2 image | schema | 10,932 | 209,674 | 0.05427694 | 0.00452308 |
| 9B fresh2 image | neutral | 22,968 | 181,517 | 0.04928381 | 0.00448035 |
| 9B fresh2 image | caveman | 23,808 | 187,503 | 0.05092311 | 0.00565812 |
| 27B fresh1 image | baseline | 10,236 | 130,101 | 0.34092396 | 0.03788044 |
| 27B fresh1 image | schema | 10,932 | 144,470 | 0.37846432 | 0.03153869 |
| 27B fresh1 image | neutral | 22,968 | 132,099 | 0.34942908 | 0.03494291 |
| 27B fresh1 image | caveman | 23,808 | 105,203 | 0.27971788 | 0.02330982 |

For **9B fresh2**, Caveman has **3.96% more output tokens** and **8.74% more scenario cost** than baseline, with **9 versus 11 strict solves**. For **27B fresh1**, it has **19.14% fewer output tokens** and **17.95% less scenario cost**, with **12 versus nine strict solves**; baseline's three extra non-strict answers are format-only. These are descriptive paired outcomes, not pooled evidence that Caveman universally helps or hurts.

There is **no saved gpt-oss tariff** in this artifact. Its partial usage is reported without an invented price:

| gpt-oss fresh2 arm | Recorded | Input tokens | Output tokens |
| --- | ---: | ---: | ---: |
| baseline | 5 | 2,131 | 65,049 |
| schema | 5 | 2,441 | 134,404 |
| neutral | 4 | 5,882 | 67,917 |
| caveman | 4 | 6,074 | 73,142 |

Do not compare these unequal-denominator usage totals as arm savings. Gemma and LLaVA likewise have no asserted tariff; their prior completed results remain unchanged at **10/48** and **0/48** strict. The new session contains no Gemma or LLaVA assessment calls.

## Timing and detector observations

“Request time” below sums or takes the median of each receipt's `elapsed_seconds`. It includes the measured local request interval and is not pure decode time. “Decode throughput” is **sum(output_tokens) / sum(eval_duration_ns / 1e9)**, a token-weighted aggregate of reported generation time. It excludes model-loading, prompt processing and between-call overhead; tokenizers and runtimes differ across models. Summed request time is not a continuous session span and must not include idle time between nights.

| Condition / observed sample | Sum of request seconds | Median request seconds | Aggregate decode tokens/s |
| --- | ---: | ---: | ---: |
| Qwen 9B fresh2, all 48 | 19,730.43 | 326.09 | 38.81 |
| Qwen 27B fresh1, all 48 across two nights | 41,496.75 | 814.83 | 12.53 |
| gpt-oss fresh2, 18 recorded | 7,287.77 | 458.65 | 46.85 |

Every new condition uses streaming with the detector in **shadow mode**, so no call was stopped by a detector trigger. Qwen 9B fresh2 has three triggers, all on the three capped Caveman 9×9 calls. Qwen 27B fresh1 has none.

The partial gpt-oss condition has **six shadow triggers**, including **two strict successes**: `baseline_panel-9-32` and `neutral_panel-7-46`. The four other triggers are capped schema `panel-5-42`, neutral `panel-9-32`, and Caveman `panel-5-59` and `panel-9-32`. A trigger therefore cannot be equated with an inevitable failure or a safely removable loop. These traces provide additional evidence for retaining shadow mode; they are not an independent preregistered detector-validation study.

## Board selection, protocol and interpretation limits

Fresh2 was frozen at **2026-11-03T18:20:17.322540+00:00**. Its deterministic rule takes the lexicographically first remaining board in each size × singleton-status × search-tier cell of the existing frontier image panel, excluding pilot and fresh1. The selected IDs, in plan order, are `panel-5-42`, `panel-7-46`, `panel-9-32`, `panel-5-59`, `panel-7-38`, `panel-9-53`, `panel-5-63`, `panel-7-59`, `panel-9-58`, `panel-5-44`, `panel-7-62`, `panel-9-51`.

Independent set checks find **zero overlap with the twelve pilot boards**, **zero overlap with the twelve fresh1 boards**, and **12/12 overlap with the prior hosted frontier panel**. The set is new to these local panels, not a secret or globally unseen held-out set. The phrase “before any model saw these boards” in source design notes is broader than the provenance supports. Selection is stratified and deterministic, not randomized.

Qwen 9B fresh2 and gpt-oss fresh2 preserve their respective fresh1 model/runtime snapshots, prompt-template hashes and exact four arm artifacts. Qwen uses image boards and boolean thinking; gpt-oss uses a text region matrix and high reasoning effort. Both request temperature zero, seed 20261028, 32,768 output tokens, 36,864 context, fresh unloads (`keep_alive: 0`), and no tools, retries or rescues. Qwen 27B's separate frozen condition uses the lower 24,576-output/28,672-context safety cap. All are pinned to Ollama 0.40.10.

Arm order alternates forward and reverse by board index. This deterministic counterbalancing is not randomized treatment assignment. Neutral versus Caveman is also not an exact token-length match: on Qwen image requests, neutral has 1,914 input tokens and Caveman 1,984. Neutral adds substantive background text, which can affect the task independently of length. Each arm has only four boards per size when complete.

The session identifies runner commit `e89d4a9dd6958c660e4efb905fc32fe17864e56b` through `runner-versions.json`, with runner hash `97114c58b735a4bbc84a13ae6b78bb9351c2d657e65b3705c4be593e8ddf9d47`. Older 27B receipts in the same frozen study retain their earlier runner provenance; do not overwrite it. Runtime identity equality does not erase chronological host or runner differences.

Compare fresh1 and fresh2 as separately reported replication panels. For example, Qwen 9B baseline/Caveman strict counts change from **9/12 versus 10/12 on fresh1** to **11/12 versus 9/12 on fresh2**. Different board composition and small samples limit interpretation; this reversal does not justify a causal pooled prompt ranking. Similarly, gpt-oss fresh2 text cannot serve as a matched-modality comparison with Qwen fresh2 image. No Qwen fresh2 text assessment has been frozen in the inspected evidence.

## Pending scope and publication

The 25 frozen roots schedule **779 eligible primary calls**, including only explicitly targeted calls in the two audits. **709 are recorded**. Of 70 unrecorded calls, **30 belong to the active gpt-oss fresh2 condition** and **40 to the historical original-budget 9B/27B conditions**. The latter were replaced in the study sequence by separate larger-budget conditions; this audit does not recommend resuming them automatically.

The current queue also lists **two unstarted, unfrozen gpt-oss fresh1 text conditions**, each with four arms and 48 planned calls: medium reasoning at 32,768 output tokens, and high reasoning at 65,536 output tokens. Those **96 future calls** are outside the 779 already-frozen eligible calls. Queue entries are intentions, not recorded assessments or proof that runtime admission checks will pass.

Publish completed 27B fresh1 and 9B fresh2 in the completed-condition view with their exact protocol labels. Keep gpt-oss fresh2 in the partial-study view with recorded/planned counts and per-size missingness. Keep targeted audits, historical censored conditions and rescues distinct. The next evidence refresh should capture actual new receipts under a new immutable snapshot; never fill pending cells with assumed failures or merge conditions to create a larger accuracy denominator.
