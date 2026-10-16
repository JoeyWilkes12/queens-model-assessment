# New-board panels: Jev 1.13 and four frontier models (16 October 2026)

Two preregistered follow-ups ran under [this preregistration](PREREGISTRATION.md), extending the earlier tests to new boards. They complement the [SubQ Snap panel](../subq-panel/REPORT.md) of 15 October. Every request and response is stored locally, and the published evidence carries every receipt.

## Table of contents

- [Summary](#summary)
- [Jev 1.13 on the 192-board panel](#jev-113-on-the-192-board-panel)
- [Frontier models on 36 panel boards](#frontier-models-on-36-panel-boards)
- [Re-runs and failures](#re-runs-and-failures)
- [Batch API, routes and cost](#batch-api-routes-and-cost)
- [Credentials](#credentials)
- [What this changes](#what-this-changes)

## Summary

| Test | Boards | Result |
|---|---|---|
| Jev 1.13, menu-guided construction (raw + filtered) | 192 | 21 boards solved (14 at 5×5, 7 at 7×7, 0 at 9×9) |
| SubQ Snap, same boards and protocol (15 Oct) | 192 | 19 boards solved (16, 3, 0) |
| Greedy rule, no model | 192 | 80 boards solved (42, 24, 14) |
| GPT-5.6 Sol, one shot from an image | 36 | 36/36 correct, all strict JSON |
| Claude Opus 4.8, same | 36 | 36/36 correct, 28 strict JSON |
| Grok 4.6 (Bedrock), same | 36 | 34/36 correct; 2 9×9 answers ran out of tokens |
| Gemini 3.1 Pro Preview, same | 36 | 34/36 correct (preregistered); 2 HTTP 429 failures, re-run: 1 correct, 1 wrong; 35/36 with re-runs |
| Grok 4.6, September 7×7 request re-sent unchanged | 1 | Solved, strict JSON (the September attempt timed out) |

## Jev 1.13 on the 192-board panel

- **What was run.** The SubQ panel's 192 boards, seeded schedule, model-visible state, questions, menus and stopping rule, unchanged. Only the request envelope changed, back to September's: `typesafe/jev-1.13` on OpenRouter's Decisions route with the September provider block.
- **Version check.** All 1,669 replies (plus 7 in the pilot) reported build `typesafe/jev-1.13-20260917`, the build used in September. `jev-latest` was never used.
- **Cost:** $0.117.

**Primary endpoint** (paired filtered vs raw menu, exact McNemar, Holm across sizes):

| Size | Filtered solved | Raw solved | Filtered only / raw only | Holm p |
|---|---:|---:|---:|---:|
| 5×5 | 13/64 | 7/64 | 7 / 1 | 0.21 |
| 7×7 | 5/64 | 2/64 | 5 / 2 | 0.91 |
| 9×9 | 0/64 | 0/64 | 0 / 0 | 1.0 |

Unlike SubQ (Holm p = 0.035 at 5×5), Jev shows no significant filtering effect. It also solved two 7×7 boards from the raw menu, which SubQ never did.

**Jev vs SubQ on identical boards** (solved by either menu):

| Size | Jev | SubQ | Both | Jev only | SubQ only |
|---|---:|---:|---:|---:|---:|
| 5×5 | 14 | 16 | 6 | 8 | 10 |
| 7×7 | 7 | 3 | 1 | 6 | 2 |
| 9×9 | 0 | 0 | 0 | 0 | 0 |

The two models mostly solve different boards. The paired counts give no evidence that either is better overall (exact paired p ≈ 0.81 at 5×5 and 0.29 at 7×7). Both remain far below the greedy rule.

**Secondary endpoints** (non-forced cell decisions):

| Size × menu | Picked an extendable cell | Random, same menus | Mean stated probability |
|---|---:|---:|---:|
| 5×5 filtered | 32.0% | 40.6% | 51.3% |
| 5×5 raw | 44.7% | 29.7% | 49.1% |
| 7×7 filtered | 39.2% | 38.4% | 46.9% |
| 7×7 raw | 52.7% | 27.7% | 42.9% |
| 9×9 filtered | 42.9% | 35.5% | 42.2% |
| 9×9 raw | 45.3% | 28.2% | 39.2% |

Jev beats chance on raw menus but not on filtered ones, the pattern seen in September. Overall it picked an extendable cell 43.8% of the time against 32.6% for random choice; SubQ managed 30.5% against 23.4%. Jev's mean correct placements at 9×9 (1.7–2.0) also exceed SubQ's (1.0–1.1).

## Frontier models on 36 panel boards

- **Boards.** 12 boards per size, 3 from each difficulty stratum of the 192-board panel, so each also has Jev and SubQ results.
- **Images.** The September renderer, copied verbatim; it reproduces the three original board images byte for byte.
- **Prompt and request.** The September prompt template (sha256 `b7ef8260…`). One request per model and board; reasoning effort high; `max_tokens` 12288; no tools, repair turns or retries.

| Model | Correct | Strict JSON | 95% interval (correct) | 5×5 / 7×7 / 9×9 | Median seconds | Cost |
|---|---:|---:|---:|---:|---:|---:|
| GPT-5.6 Sol | 36/36 | 36/36 | 90.3–100% | 12 / 12 / 12 | batch (not measured) | $0.55 |
| Claude Opus 4.8 | 36/36 | 28/36 | 90.3–100% | 12 / 12 / 12 | 34.4 | $3.32 |
| Grok 4.6 | 34/36 | 34/36 | 81.3–99.3% | 12 / 12 / 10 | 57.4 | $1.53 |
| Gemini 3.1 Pro Preview | 34/36 | 29/36 | 81.3–99.3% | 12 / 11 / 11 | 57.0 | $3.48 |

- **Off-format answers.** Opus's eight correct-but-off-format answers cluster at 9×9 (5 of 12); it wrote explanatory text around the JSON.
- **Truncated answers.** Both Grok misses are 9×9 answers that spent the whole 12,288-token budget without a final answer. That is the same limit as in September, so they count as unsolved.
- **Ceiling.** Every model is near ceiling on these synthetic, letter-labelled images. That confirms the September result with a real sample, and it means this test can no longer distinguish the strongest models.

## Re-runs and failures

- **Gemini 3.1 Pro Preview.** Two requests (`panel-7-46`, `panel-9-34`) failed with HTTP 429 from the provider within a second, before any model answer. As preregistered, they count as unsolved. Each was re-sent once, unchanged, as a labelled re-run: the 7×7 came back correct but off-format, the 9×9 wrong (a rule violation).
- **Grok 4.6, September 7×7.** The original request, byte for byte and checked against its frozen SHA-256, was re-sent on 16 October. It returned a correct strict-JSON answer in 38 s; in September it timed out at 600 s. The September chart keeps the recorded timeout; the re-run is shown beside it.

## Batch API, routes and cost

- **Batch availability.** OpenRouter's Batch API (launched 22 September 2026) was checked before any request. It halves typical prices, completes within 24 hours, accepts images by public URL only, and does not cover the Decisions API.
- **GPT-5.6 Sol** ran as a batch pinned to OpenAI, at the September price. The batch completed in minutes. The image went by a public URL to a byte-identical PNG on a dedicated branch.
- **Claude Opus 4.8.** The batch submission was rejected three times with HTTP 400 ("no :batch endpoint") before validation. Opus therefore ran on demand with the September Anthropic provider block (amendment 1).
- **Gemini and Grok** ran on demand, as in September, because a batch would have meant a different provider (Gemini) or had no endpoint (Grok).
- **Cost.** About $9.26 of new OpenRouter spend in total, all models and re-runs included, under the $9.50 campaign cap and the account's $11.11 balance.

## Credentials

A local broker read the OpenRouter key once from the macOS keychain (`com.joeywilkes.openrouter.inference`) into its own memory and injected it into each request. The key never appeared in code, command arguments, files, logs, receipts, or any agent's view. Published requests replace inline image data with a content hash. Nothing in the requests disables the account's observability forwarding.

## What this changes

- **Decision models.** With matched coverage, Jev and SubQ are statistically indistinguishable, solve mostly different boards, and both fall well short of a greedy heuristic. Neither completed any of 64 new 9×9 boards.
- **Frontier models.** All four reasoning models solve nearly every new board from an image. The gap between construction from scratch (frontier models) and menu-guided selection (decision models) is now measured on shared boards, though under different interfaces.
- **Next.** Harder, real-world inputs: unlabelled colors, real LinkedIn screenshots, or larger boards. A shared interface would also allow a fair cross-family comparison.
