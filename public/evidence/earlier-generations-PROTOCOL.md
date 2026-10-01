# Earlier Queens model generations — frozen protocol

## Contents

- [Design](#design)
- [Breadth and stopping](#breadth-and-stopping)
- [Judging](#judging)
- [Budget and routing](#budget-and-routing)
- [Diagnostic variations](#diagnostic-variations)
- [Publication](#publication)

## Design

The user authorized an additional **$2 maximum** on October 1, 2026. This is a new incremental stage; earlier studies have their own retained ledgers. Root Codex GPT-6 is the sole inference caller. Local GPT-6 Luna Xhigh reviewers inspect preparation and publication. Their support work uses Codex, not this OpenRouter budget.

Copy `messages` from the GPT-5.6 Sol requests in [the original pilot](https://joeywilkes12.github.io/queens-model-assessment/#/protocol-results). Preserve exact text, content order, embedded PNG bytes, and board IDs. Compare canonical message and decoded image hashes with the original manifest before every send. The 5×5, 7×7 and 9×9 boards retain their independently established unique solutions. No answer key or solver code is transmitted.

Use one fresh request per model and board, no tools, feedback or retry. Keep the original 12,288 total completion-token cap, non-streaming API configuration, default sampling settings, and High reasoning request where supported. Models without reasoning support omit that parameter and are labeled accordingly. Legacy models may map High to a token budget rather than a native effort category. Equal labels do not imply equal internal computation. A returned model version is recorded; route aliases cannot guarantee immutable weights.

## Breadth and stopping

Freeze this candidate ladder before paid inference:

| Round | GPT | Claude | Gemini |
|---|---|---|---|
| 1 | GPT-5.5 | Opus 4.7 | 2.5 Pro |
| 2 | GPT-5.4 | Opus 4.6 | 2.5 Flash |
| 3 | GPT-5.2 | Opus 4.5 | 2.5 Flash Lite |
| 4 | GPT-5.1 | Sonnet 4.5 | — |
| 5 | GPT-5 | Sonnet 4 | — |
| 6 | GPT-4.1 | — | — |
| 7 | GPT-4o, November 20 2024 | — | — |

Within a round, test each board in increasing size, rotating **GPT → Claude → Gemini** before another board. Before each board block reserve the full worst-case cost of all its eligible families. Refund each reservation only to the reported actual cost after that call. If the next complete block cannot fit, stop that block before any of its calls. Do not lower token limits to fit a block after seeing results. Hold $0.15 for diagnostics while the original-input ladder runs.

A family stops descending after its first round with a mathematically invalid delivered placement, or no usable answer within the token/time cap. Complete all three boards for eligible families in that round when the block reserves fit, then remove the failing family from subsequent rounds. Formatting-only failure with one correct extracted JSON object does not stop its mathematical ladder. Finish breadth across other active families before diagnostic variations or effort experiments. No effort sweep is planned in this budget.

This is a sparse ladder, not every release. Date intervals and product tiers differ across families. GPT-5.3 is a Codex specialization rather than a direct general-purpose rung. Older Gemini Pro routes and Claude 3 routes are absent from the current catalog. Flash/Lite and Opus/Sonnet transitions change product tier as well as release age; they cannot isolate generation effects. Claude Sonnet 4 has only Bedrock routes at discovery, a further provider difference. These are practical service comparisons, not a matched release-date experiment.

## Judging

Reuse the original strict JSON/schema/rule checker. Publish that primary outcome unchanged. Also preregister here the pilot's separate deterministic extraction of exactly one schema-shaped JSON object from visible final text. Never select among multiple answers, repair coordinates, execute generated code, use hidden reasoning as the answer, or use an LLM judge.

Report strict validity, extracted mathematical validity, rule failures, missing outputs, HTTP errors, finish reason, response time, token counts including reported reasoning, model/provider returned, cost, and message/image hashes. One sample per cell estimates neither stable accuracy nor a statistical failure threshold. “First observed failure” means the first sampled configuration in this ladder; success need not decline monotonically with age.

## Budget and routing

Use the installed local credential broker. Leave account, workspace, key, guardrail, privacy and broker governance unchanged. Discover capabilities, prices, and routes before inference. Pin the same standard provider family as the original pilot where available, without Flex/Priority or provider/model fallback; list any explicit necessary provider difference.

Per-call reserve = 12,000 input tokens × price + 12,288 output tokens × price + $0.01. Input/image tokens and hidden reasoning are billed. Per-token price ceilings supplement, and do not replace, local total-budget enforcement. Preserve the full reserve for any request without reliable usage cost. On uncertain timeout, never retry automatically. Capture response bytes incrementally at the client, use a 600-second absolute deadline, and separate delivery failure from a wrong answer. Stop on authentication, governance rejection or budget assumptions exceeded; investigate without changing governance.

## Diagnostic variations

Only after completing breadth, reuse or faithfully adapt local Jev material on a board that failed: a full region matrix or region-cell lists with the same original rules and output schema, preferably two representations on the same failed model/board if the remaining reserve permits. These are fresh, separate one-shot conditions, without failure feedback. A text representation removes image perception and changes input tokens. It does not change the original-image score. Give exact Jev provenance and disclose adaptations.

Candidate menus, known-correct givens, constraint summaries computed by an engine, solved worked examples, and trajectories are different tasks or additional information. They are not substitutes for unrestricted one-shot construction and will not be presented as equivalent. Diagnostic selection is conditional on observed failure and is exploratory. Do not use it to revise the original cohort.

## Publication

Publish every attempted response and failure, exact prompts and image provenance, model settings, grades and costs in the existing [Queens model assessment](https://joeywilkes12.github.io/queens-model-assessment/), alongside a report. Keep local raw wire bodies unchanged. Public evidence omits credentials and encrypted provider reasoning as in the existing evidence contract; publish the visible final response and disclose any sanitization. No unpublished correct-answer key is needed for judging or publication.

Primary interface references: [OpenRouter models API](https://openrouter.ai/api/v1/models), [image input](https://openrouter.ai/docs/guides/overview/multimodal/image-understanding), [provider selection](https://openrouter.ai/docs/guides/routing/provider-selection), [reasoning tokens](https://openrouter.ai/docs/guides/best-practices/reasoning-tokens). Saved discovery receipts establish availability and prices for this run.
