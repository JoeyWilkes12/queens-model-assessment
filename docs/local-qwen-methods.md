# Local Qwen: results and interpretation

This is the historical October 30 review. The [October 31 update](local-qwen-oct31.md)
adds the selected no-stop audit, including a previously stopped 9B call that
continued to a strict solution, and the new sampling rounds. Interpret statements
below about unavailable audit observations in their original review date.

Read-only review of the receipts available after the 2026-10-29–30 overnight session. Source branch: `claude/ollama-bigger-qwen`, inspected at `563fb4aa`. The session ended at 08:53:03 on October 30, America/Denver. No inference, preparation, selftest, or evidence-writing audit was run for this review.

## Suggested website copy

On this 12-board panel, 9b returned 19 strict answers out of 24 requests under a 32,768-token ceiling with repetition stopping, compared with 18 under the earlier 24,576-token condition. All 24 observed thinking prefixes matched between those two conditions. One previously truncated request continued to a correct answer at 29,118 tokens; the other five were stopped by the client for repetition and none of their forced-answer follow-ups solved the board.

The 4b 32k condition returned 13 strict answers and three correct answers inside code fences. Two calls reached the token ceiling and six were stopped for repetition. Two of eight separate forced-answer follow-ups succeeded. The earlier 4b pilot used a different model-loading policy and does not reproduce this condition's traces.

These are small, fixed-panel results for specific local model builds. The 32k condition changes the token ceiling, context setting, transport, and stopping policy together. It demonstrates observed outcomes under that combined protocol; it does not isolate the effect of repetition stopping or establish exact token or time savings.

## Counts checked against raw receipts

Each complete condition has 12 boards × two prompt arms = 24 primary calls. `Strict` requires the exact JSON schema and a rule-valid placement. `Format only` below means an otherwise correct answer recoverable without choosing among alternative answers: in this snapshot, a single fenced JSON object or a whole bare array. Rescues are additional requests and never enter the primary strict count.

| Model and condition | Primary calls | Strict | Format only | Budget truncations | Client loop stops | Strict rescues / attempts |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 4b pilot, greedy 12,288 | 24 | 6 | 2 | 16 | 0 | 0 / 0 |
| 9b greedy 12,288, partial | 6 | 3 | 0 | 3 | 0 | 1 / 3 |
| 27b greedy 12,288, partial | 2 | 2 | 0 | 0 | 0 | 0 / 0 |
| 9b greedy 24,576 | 24 | 18 | 0 | 6 | 0 | 0 / 6 |
| 27b greedy 24,576 | 24 | 24 | 0 | 0 | 0 | 0 / 0 |
| 9b sampling round 1, 24,576 | 24 | 15 | 4 | 5 | 0 | 2 / 5 |
| 27b sampling round 1, 24,576 | 24 | 21 | 3 | 0 | 0 | 0 / 0 |
| 4b greedy 32,768 + loop stop | 24 | 13 | 3 | 2 | 6 | 2 / 8 |
| 9b greedy 32,768 + loop stop | 24 | 19 | 0 | 0 | 5 | 0 / 5 |

The last night produced 74 primary receipts: all 24 for each 32k study, all 24 for 27b sampling round 1, and the final two calls for 9b sampling round 1. Both of those last two 9b sampled calls truncated and their rescues failed. Earlier descriptions of that study as 22 calls with three truncations and 2/3 rescues are stale. Round 2 for 9b has a frozen plan but no primary receipts; the session deferred it because the next call would cross the deadline. It is pending, not failed.

For 4b 32k, baseline produced 7 strict, 3 format-only, and 2 truncated results; Caveman produced 6 strict and 6 client stops. Rescues succeeded on 1/2 budget truncations and 1/6 client stops. For 9b 32k, baseline produced 11 strict and 1 client stop; Caveman produced 8 strict and 4 client stops. All five rescues failed. These descriptive arm comparisons contain only 12 calls per arm on the same boards.

The source's `metadata.outcome == "format_only"` counts just three of the four 9b sampled format cases. `caveman_panel-9-22` is a correct whole bare array, recorded as `incorrect` by the strict/object-only diagnostic. Report it as a separate format-recoverable result, never silently promote it to strict. The report's general regex extractor can accept arrays embedded in prose; the conservative count here was confirmed by inspecting the actual four outputs. All other format-only cases in this table are single fenced JSON objects.

## What repetition stopping does

The inspected code checks exact stripped-line repetition in thinking text. At offsets 12,000, 12,500, and so on, it examines the preceding 6,000 characters, retaining lines at least 21 characters long. With at least ten eligible lines, the metric is the fraction also found before that window. Three consecutive scores of at least 0.7 trigger a client stop while no non-whitespace answer text has appeared. This is a lexical heuristic, not a proof of an inescapable reasoning cycle. Window boundaries can split lines, and semantically repetitive paraphrases need not match.

The original prompt stays unchanged until the primary call ends. Nevertheless, stopping based on generated text actively censors the continuation. The resulting observation is **no answer before intervention**, not evidence that the model would have produced no answer by 32,768 tokens. A follow-up then replays the thinking, adds an early-stop instruction and a JSON answer prefix, and allows 256 greedy output tokens. This changes the interaction protocol and incurs additional input processing and wall time.

A successful rescue establishes a successful assisted continuation; it does not, by itself, prove the complete answer already existed before interruption. A failed rescue does not prove it was absent. Notably, 4b `caveman_panel-5-19` was loop-stopped and rescued correctly. Repetition and recoverable useful work can coexist.

## Calibration and validation limits

The saved `loop-audit.json` contains 102 calibration traces: 24 pilot calls, 6 original-budget 9b calls, 2 original-budget 27b calls, 48 main-study calls, and the first 22 sampled 9b calls. Replaying only the inspected pure detector definitions reproduced every saved row's check count, metric, and trigger offset.

Five of 28 truncated traces triggered. None of 74 completed traces triggered: 68 strict, five recorded format-only, and one recorded incorrect. The threshold was selected after examining these traces, including a completed trace that repeated substantially but eventually solved. This is an in-sample calibration result, not an independently estimated false-positive rate. The other 23 truncations need not be detector false negatives: truncation is not a ground-truth label for looping.

All 48 new 32k receipts agree with offline replay of their retained thinking: six 4b and five 9b triggers. The five 9b triggers reproduce the calibration examples on the same boards. The new 4b calls test applicability to a changed condition, but interruption hides their uninterrupted outcomes. Neither the out-of-sample false-positive rate nor the false-negative rate for harmful looping can be established from these receipts. A detector can miss semantic repetition or stop a trace that would eventually recover.

## Matched 9b comparison

All 24 corresponding requests have identical message payloads, including images. Their changes are `stream: false → true`, `num_predict: 24576 → 32768`, and `num_ctx: 28672 → 36864`, with the new client stopping policy. All 24 retained thinking prefixes match character for character over their common length. The 18 earlier completed message outputs match in full; their server-reported output-token counts also match.

| Earlier truncated 9b call | 32k result | Trigger offset, thinking characters | 32k server-reported output tokens | Earlier / later observed seconds |
| --- | --- | ---: | ---: | ---: |
| `baseline_panel-9-05` | Client stop | 41,500 | Missing | 647.75 / 480.78 |
| `baseline_panel-9-34` | Strict | — | 29,118 | 646.14 / 744.36 |
| `caveman_panel-7-50` | Client stop | 31,000 | Missing | 655.15 / 319.23 |
| `caveman_panel-9-05` | Client stop | 45,500 | Missing | 653.92 / 550.24 |
| `caveman_panel-9-22` | Client stop | 38,500 | Missing | 655.29 / 465.06 |
| `caveman_panel-9-34` | Client stop | 53,000 | Missing | 653.26 / 614.88 |

All six earlier calls report 24,576 output tokens. Trigger offsets are character positions, not token positions; the last received stream chunk can extend beyond the trigger offset. These specific matches support prefix reproducibility for these receipts, not a universal property of greedy generation across machines, model loads, or runtime configurations.

Only 1/24 corresponding 4b pilot/32k thinking prefixes matches. The saved full selftest also documents a fresh-load 4b replay diverging at character 1,123 and finishing at 7,811 rather than 5,403 tokens. The pilot used `keep_alive: 10m`; the new condition uses fresh loads. Consequently, `s<=12k` in the new 4b study counts new-condition answers within that budget and is not a reconstruction of the pilot's results.

## Timing, tokens, and provenance

Every client-stopped receipt has `done: false`, no terminal `eval_count`, and `output_tokens: null`. The eleven missing counts are not zero. `stream_chunks` measures received chunks, not verified tokens, and character ratios or elapsed-time estimates cannot replace exact usage. Completed calls retain server-reported counts, but the canceled calls lack the same accounting. The retained server-log slices inspected for cancellation do not restore an exact token count.

For example, 4b 32k has 315,703 reported output tokens across 18 of 24 primary calls; 9b 32k has 220,804 across 19 of 24. These are incomplete subtotals, unsuitable as full-condition totals or exact token-savings measures. Rescue output adds 128 and 86 tokens respectively, while its long replayed input also costs compute. Primary elapsed time totals 7,479.94 seconds for 4b and 7,884.31 for 9b; rescues add 285.41 and 261.39 seconds. These request durations exclude other session work such as admission waits and explicit model placement.

Even the 18 identical completed 9b outputs took 4,917.05 seconds in the earlier condition and 4,709.76 in the later one, a 4.2% observed reduction without any loop cancellation. Host load, day, model order, memory state, transport, and instrumentation may affect timing. Earlier/later elapsed differences in the table are observations, not an isolated estimate of detector savings. No 32k streamed condition without active stopping supplies the missing counterfactual. Claims of guaranteed 4–8 minutes saved per loop, or that more tokens never help a greedy loop, exceed this evidence.

Frozen runtime metadata records Ollama 0.40.10 and matching model identities; runtime validation normalizes parameter-line order after reinstall. That supports matching recorded software identity, not identical operating conditions. The 32k studies also run newer runner code, resource guards, streaming, and provenance capture. The full selftest checks one completed 9b replay and one live trigger; its 4b reproducibility failure is explicitly non-required, so its overall `PASS` does not mean every reproduction check passed.

The inspected runner hash is `d1678c181b4d9707d3224ef643427fe0f6edd55f8b17d7df8dcda7e5c39765df`, matching the latest session and selftest. New overnight receipts nevertheless contain null `runner.git_commit` and `runner.git_branch`. Code hashes remain useful evidence; `scripts_uncommitted: false` is not proof of a clean checkout because the provenance function does not check Git command return codes. Report the missing revision fields explicitly rather than filling them with the later checkout's HEAD.

## Recommended follow-up design

Within a loop-stop study, the same frozen detector is applied to both Caveman
arms. In that contrast it is a shared policy, not an unmeasured variable uniquely
assigned to one arm. The result nevertheless measures the skill under that
policy: changes in repetition can mediate differential interruption. Across
24k/no-stop and 32k/stop studies it is a co-intervention alongside the budget and
transport changes, so the isolated stopping effect is not identified. Restricting
analysis to non-stopped calls would select on a post-treatment outcome. Keep all
planned attempts in the primary denominator and treat uninterrupted outcomes of
stopped calls as unobserved, not established failures.

Freeze the detector before evaluating new boards and multiple independent runs. Keep model build, loading policy, context size, output budget, transport, and host admission policy fixed; randomize or counterbalance arm and condition order. Separate 24k versus 32k budget comparisons from 32k stopping-policy comparisons. Include a streamed 32k shadow-detector condition that records trigger positions but permits safe continuation, alongside active stopping. Measure how often triggered traces recover and how many unsuccessful traces evade detection using predefined labels.

Predefine primary one-shot success, conservative format recovery, client stops, budget truncations, and rescue success. Report complete-protocol latency and compute, including rescue input processing, and retain verified token accounting or label it missing. Treat paired board observations as paired, and distinguish panel description from generalization. No proposed run was launched by this review.

## Evidence locations

- `public/evidence/ollama/receipts/` and `public/evidence/ollama-models/<study>/receipts/`: raw request, response, metadata, grade, host, and server-log artifacts.
- `public/evidence/ollama-models/<study>/rescue/`: distinct rescue requests and outcomes.
- `public/evidence/ollama-models/sessions/20261029T230005.json` and `sessions/launchd.log`: latest session boundaries, scheduling, and printed report.
- `public/evidence/ollama-models/loop-audit.json` and `selftests/20261029T201454-full/results.json`: historical calibration and reproduction checks.
- `scripts/ollama/overnight.py`: `loop_metric`, `LoopScan`, `stream_chat`, `annotate`, `rescue`, `lenient_correct`, and provenance behavior; `scripts/llm_panel/grading.py`: independent regrading of primary response text.
- `docs/ollama-loop-stop.md`, `docs/ollama-study-conditions.md`, `docs/ollama-lessons.md`, and `docs/ollama-local-best-practices.md`: source protocol descriptions, including claims qualified above.
