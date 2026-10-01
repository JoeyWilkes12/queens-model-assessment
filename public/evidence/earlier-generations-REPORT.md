# Earlier Queens generations — October 1, 2026

Status: **complete**. 21/27 original-image requests delivered a mathematically valid written placement; 13/27 passed strict JSON. Costs reported by OpenRouter total **$1.824265**: $1.800785 for original images plus $0.023480 for text diagnostics. Accounted costs including any unresolved reserves total **$1.824265** of the incremental $2 budget. Target solution coordinates are omitted from this report; response files contain answers.

## Contents

- [Observed model results](#observed-model-results)
- [First observed failures](#first-observed-failures)
- [Text representation diagnostics](#text-representation-diagnostics)
- [Assessment](#assessment)
- [Interpretation and limits](#interpretation-and-limits)
- [Evidence and publication](#evidence-and-publication)

## Observed model results

Each completed original-input request used the exact prompt and image bytes from the GPT-5.6 Sol / Opus 4.8 / Grok Bedrock / Gemini 3.1 Pro pilot. Root was the sole paid caller. The first two rounds rotated GPT → Claude → Gemini within each board block. A [budget-driven schedule amendment](earlier-generations-SCHEDULE_AMENDMENT.md), frozen before its calls, then prioritized older anchors across all families and an adaptive GPT bridge. Calls were sequential; effort levels were not swept. “Ladder rung” below is the original candidate index, not the amended chronological phase; saved metadata records actual order.

| Ladder rung | Model | 5×5 strict / math | 7×7 strict / math | 9×9 strict / math | Median seconds | Known USD |
|---:|---|---|---|---|---:|---:|
| 1 | `openai/gpt-5.5` | Pass / Pass | Pass / Pass | Pass / Pass | 23.39 | $0.194410 |
| 1 | `anthropic/claude-opus-4.7` | Pass / Pass | Pass / Pass | Pass / Pass | 26.54 | $0.172680 |
| 1 | `google/gemini-2.5-pro` | Fail / Pass | Fail / Pass | Pass / Pass | 60.78 | $0.253149 |
| 2 | `openai/gpt-5.4` | Pass / Pass | Pass / Pass | Pass / Pass | 56.57 | $0.130985 |
| 2 | `anthropic/claude-opus-4.6` | Fail / Pass | Fail / Pass | Fail / Pass | 66.35 | $0.315145 |
| 2 | `google/gemini-2.5-flash` | Fail / Fail | Fail / Fail | Fail / Pass | 50.74 | $0.086485 |
| 5 | `openai/gpt-5` | Pass / Pass | Pass / Pass | Pass / Pass | 169.08 | $0.314638 |
| 5 | `anthropic/claude-sonnet-4` | Fail / Pass | Fail / Pass | Fail / Fail | 55.78 | $0.326418 |
| 6 | `openai/gpt-4.1` | Fail / Fail | Fail / Fail | Fail / Fail | 2.45 | $0.006876 |

Strict means exactly the specified JSON object plus every Queens rule. Math means the same rule checker applied to exactly one schema-shaped object extracted from visible final output. This secondary extraction measure was preregistered for this new stage; it was post hoc in the historical pilot. It cannot select among several candidate answers. A malformed/no-answer response is a delivered-answer failure, not proof of a specific mathematical misconception.

The original 12,288 total completion-token ceiling was preserved. Completion tokens include reasoning; default sampling was left unchanged. Model/provider returned, finish reason and all available token counts are retained per call. Median seconds include routing, queueing, generation and transfer.

## First observed failures

- GPT: `openai/gpt-4.1` on `queens-5-easy`; strict failure `rule_violation`; extracted-answer failure `rule_violation`, 1 candidate objects, checks `{'one_per_row': True, 'one_per_column': True, 'one_per_region': False, 'no_touch': False}`; finish `stop`.
- GPT: `openai/gpt-4.1` on `queens-7-medium`; strict failure `rule_violation`; extracted-answer failure `rule_violation`, 1 candidate objects, checks `{'one_per_row': True, 'one_per_column': True, 'one_per_region': False, 'no_touch': True}`; finish `stop`.
- GPT: `openai/gpt-4.1` on `queens-9-hard`; strict failure `rule_violation`; extracted-answer failure `rule_violation`, 1 candidate objects, checks `{'one_per_row': True, 'one_per_column': True, 'one_per_region': False, 'no_touch': False}`; finish `stop`.
- Claude: `anthropic/claude-sonnet-4` on `queens-9-hard`; strict failure `invalid_json_or_missing_final`; extracted-answer failure `rule_violation`, 1 candidate objects, checks `{'one_per_row': True, 'one_per_column': True, 'one_per_region': False, 'no_touch': True}`; finish `stop`.
- Gemini: `google/gemini-2.5-flash` on `queens-5-easy`; strict failure `invalid_json_or_missing_final`; extracted-answer failure `no_single_final_object`, 0 candidate objects, checks `{}`; finish `length`.
- Gemini: `google/gemini-2.5-flash` on `queens-7-medium`; strict failure `invalid_json_or_missing_final`; extracted-answer failure `no_single_final_object`, 0 candidate objects, checks `{}`; finish `length`.
- Evidence: [`r2_queens-5-easy_gemini-2.5-flash`](runs/2026-10-01-earlier-generations/r2_queens-5-easy_gemini-2.5-flash/response.json); extracted rule checks `{}`, candidate objects `0`; completion tokens `12264`; finish `length`.
- Evidence: [`r2_queens-7-medium_gemini-2.5-flash`](runs/2026-10-01-earlier-generations/r2_queens-7-medium_gemini-2.5-flash/response.json); extracted rule checks `{}`, candidate objects `0`; completion tokens `12272`; finish `length`.
- Evidence: [`r5_queens-9-hard_claude-sonnet-4`](runs/2026-10-01-earlier-generations/r5_queens-9-hard_claude-sonnet-4/response.json); extracted rule checks `{'one_per_row': True, 'one_per_column': True, 'one_per_region': False, 'no_touch': True}`, candidate objects `1`; completion tokens `8520`; finish `stop`.
- Evidence: [`r6_queens-5-easy_gpt-4.1`](runs/2026-10-01-earlier-generations/r6_queens-5-easy_gpt-4.1/response.json); extracted rule checks `{'one_per_row': True, 'one_per_column': True, 'one_per_region': False, 'no_touch': False}`, candidate objects `1`; completion tokens `26`; finish `stop`.
- Evidence: [`r6_queens-7-medium_gpt-4.1`](runs/2026-10-01-earlier-generations/r6_queens-7-medium_gpt-4.1/response.json); extracted rule checks `{'one_per_row': True, 'one_per_column': True, 'one_per_region': False, 'no_touch': True}`, candidate objects `1`; completion tokens `29`; finish `stop`.
- Evidence: [`r6_queens-9-hard_gpt-4.1`](runs/2026-10-01-earlier-generations/r6_queens-9-hard_gpt-4.1/response.json); extracted rule checks `{'one_per_row': True, 'one_per_column': True, 'one_per_region': False, 'no_touch': False}`, candidate objects `1`; completion tokens `33`; finish `stop`.

A family stops descending after its first sampled failing cohort. The amendment permits a newer GPT bridge after the older anchor to narrow a sampled bracket. This does not prove that all earlier models fail or all later models solve. Format-only failures with one correct placement do not stop the mathematical ladder.

## Text representation diagnostics

The diagnostic manifest freezes the same failed model/board in a fresh request with either a complete region matrix or region-cell lists. They adapt clean Jev construction input data to the original written-answer task. No candidates, solved target cells, correctness feedback, tools or previous outputs are supplied. The change removes image perception and alters prompt length; it is a separate conditional experiment.

| Model | Board | Representation | Strict | Math | Seconds | USD |
|---|---|---|---|---|---:|---:|
| `openai/gpt-4.1` | queens-5-easy | text_only_region_grid_rows | Fail | Fail | 1.46 | $0.000856 |
| `google/gemini-2.5-flash` | queens-5-easy | text_only_region_grid_rows | Fail | Pass | 38.53 | $0.022624 |

Only the matrix representation was funded, for GPT-4.1 and Gemini 2.5 Flash on their smallest failed board. Claude Sonnet 4’s failed 9×9 diagnostic required a conservative $0.230320 reserve, exceeding the $0.199215 remaining when diagnostics were frozen. The [diagnostic manifest](earlier-generations-diagnostic-manifest.json) records this omission; no Claude diagnostic was silently substituted.


## Assessment

- **GPT:** GPT-5.5, GPT-5.4 and the GPT-5 bridge solved all three images with strict JSON. GPT-4.1 returned parseable JSON quickly and cheaply but failed the region rule on all three boards and the touching rule on two. Thus the sampled bracket is GPT-5 success versus GPT-4.1 failure—not an exact boundary through untested intermediate releases.
- **Claude:** Opus 4.7 and 4.6 produced mathematically valid answers for every board, but Opus 4.6 broke strict formatting on all three. Sonnet 4 solved 5×5 and 7×7 but failed region coverage on 9×9. This is confounded by the Opus-to-Sonnet product-tier change and Sonnet’s pinned Bedrock route, not purely model age.
- **Gemini:** 2.5 Pro solved all three after extraction. 2.5 Flash exhausted the completion cap on 5×5 and 7×7, leaving visible prose but no single final schema-shaped answer; it solved 9×9 after extraction. This non-monotonic pattern is a delivered-answer/compute-cap failure, not evidence that larger boards were intrinsically easier or that Flash cannot solve the smaller boards.
- **Speed and cost:** GPT-4.1’s roughly two-second latency did not buy correctness. Among the sampled GPT models that solved all three, GPT-5 took a 169.08-second median and $0.314638 total versus GPT-5.5’s 23.39 seconds/$0.194410 and GPT-5.4’s 56.57 seconds/$0.130985. These single-call service timings are descriptive, not stable throughput estimates.
- **Representation:** The GPT-4.1 5×5 matrix answer still failed region coverage; removing image perception did not rescue this one sample. Gemini 2.5 Flash’s matrix answer was mathematically valid but still broke strict JSON. This is compatible with representation or token-allocation sensitivity, but prompt length, tokenization and stochastic variation also changed; it does not identify a causal mechanism or revise its original image score.

All 29 attempted requests returned HTTP 200 with reported usage costs; no charges remain unresolved in this stage. The confirmed total is $1.824265 and $0.175735 is unspent. No retries or effort sweeps were performed.

## Interpretation and limits

- GPT: first sampled failure at openai/gpt-4.1, candidate rung 6, on queens-5-easy, queens-7-medium, queens-9-hard.
- Claude: first sampled failure at anthropic/claude-sonnet-4, candidate rung 5, on queens-9-hard.
- Gemini: first sampled failure at google/gemini-2.5-flash, candidate rung 2, on queens-5-easy, queens-7-medium.
- Separate text representation diagnostics: 1/2 mathematically correct; these are fresh one-shot conditions.

- One sample per model/board; first observed failures are not statistically established thresholds.
- Three original synthetic boards; size and search difficulty are confounded and region labels/singletons aid perception.
- High labels and tokenization do not equalize internal reasoning; unsupported controls are omitted.
- Gemini Pro to Flash/Lite and Claude Opus to Sonnet transitions change product tier; release dates are not matched.
- Historical frontier results were collected earlier; service drift, queueing and routing contribute to latency.
- Adaptive family stopping and cost reservations leave some frozen candidate requests unexecuted.
- Text diagnostics are selected after failure and alter input representation; their successes do not change image scores.

The corpus uses regional Queens: exactly one queen per row, column and connected region, with no adjacent touching (including diagonal touching). Long diagonals are allowed. Local exhaustive enumeration checks the uniqueness of each board independently; the judge uses explicit rule validation rather than a model opinion.

## Evidence and publication

- [Frozen protocol](earlier-generations-PROTOCOL.md), [candidate manifest](earlier-generations-manifest.json), [schedule amendment](earlier-generations-SCHEDULE_AMENDMENT.md), and [review notes on mapped reasoning](earlier-generations-REVIEW_NOTES.md).
- [Grades and billing](earlier-generations-grades.json), [site summary](earlier-generations-summary.json), and [offline audit](earlier-generations-audit.json).
- `requests/`: every frozen candidate request, including those left unexecuted. Unexecuted requests are not successes or failures.
- `raw/`: every actual inference response or failure metadata, unchanged locally; this includes unsuccessful outputs.
- [Original blank boards](https://joeywilkes12.github.io/queens-model-assessment/#/protocol-results) and [historical frontier results](https://joeywilkes12.github.io/queens-model-assessment/#/protocol-results).
- [Public assessment chapter](https://joeywilkes12.github.io/queens-model-assessment/#/earlier-generations). The evidence atlas publishes visible final content, prompts, image provenance, timing, usage and grades for all attempted requests. Credential fields and signed/encrypted reasoning payloads are omitted under the existing evidence contract.
- [OpenRouter model catalog](https://openrouter.ai/api/v1/models), [provider routing](https://openrouter.ai/docs/guides/routing/provider-selection), and [reasoning tokens](https://openrouter.ai/docs/guides/best-practices/reasoning-tokens). The saved snapshots provide run-specific availability/prices.

Preparation/review: GPT-6 Luna Xhigh support agents; final offline-auditor repair and validation: GPT-6.1 Sol Xhigh fallback; authoritative selection, paid calls, grading integration and publication: root Codex GPT-6. Account/broker governance and workspace settings were not changed.
