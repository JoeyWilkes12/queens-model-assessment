# Frontier image panel and Jev panel: preregistration

Frozen on **16 October 2026**, before any frontier-model request and after a two-trajectory Jev pilot on development boards. It extends two earlier tests to the new-board panel: the September one-shot test of four frontier reasoning models (3 boards each) and Jev 1.13 (the original 9 boards).

## Table of contents

- [Questions](#questions)
- [Jev 1.13 on the 192-board panel](#jev-113-on-the-192-board-panel)
- [Frontier models on 36 panel boards](#frontier-models-on-36-panel-boards)
- [Routes and the batch decision](#routes-and-the-batch-decision)
- [Budget and stopping](#budget-and-stopping)
- [Endpoints](#endpoints)
- [Credentials and logging](#credentials-and-logging)
- [Amendments](#amendments)

## Questions

1. With coverage matched to SubQ Snap, how often does Jev 1.13 complete a new board under the identical menu-guided protocol, and how does that compare with SubQ, the greedy rule and random choice on the same boards?
2. With far more boards than the original three, how often does each frontier model produce a correct full placement in one shot from a board image, by size?

## Jev 1.13 on the 192-board panel

- **Boards and schedule.** The 192 certified boards and the frozen, seeded schedule of the SubQ panel (`public/evidence/subq-panel/manifest.json`): one raw and one conflict-filtered attempt per board, 384 trajectories. The pilot reuses the SubQ pilot's two development boards.
- **Protocol.** Identical model-visible state, questions, option order, forced singleton transitions, oracle and stopping rule (`scripts/subq/trajectories.py`). Only the envelope changes, back to the September Jev request: model `typesafe/jev-1.13` on OpenRouter's `/api/alpha/decisions`, with the September provider block (TypeSafe only, no fallbacks, prompt price cap 0.042).
- **Version policy.** Every reply must report build `typesafe/jev-1.13-20260917`, the build used in September. Any other build fails the schema check and stops the run. `jev-latest` is never used.
- **Pilot result (already run).** 2 trajectories, 7 calls, all returning `typesafe/jev-1.13-20260917`; $0.0006.

## Frontier models on 36 panel boards

- **Boards.** 12 boards per size: 3 drawn at random (seed 20261016) from each of the four strata (singleton × search tier) of the 192-board panel. Every board therefore also has SubQ and Jev results.
- **Images.** Rendered with the September renderer, copied verbatim; it reproduces all three original board images byte for byte.
- **Prompt and request.** The September template, unchanged (sha256 `b7ef8260…`), with only the board ID and N filled in. One request per model and board; `max_tokens` 12288; reasoning effort high with reasoning excluded; no tools, repair turns or retries.
- **Models:** `openai/gpt-5.6-sol`, `anthropic/claude-opus-4.8`, `google/gemini-3.1-pro-preview`, `x-ai/grok-4.6`.
- **Order.** Sizes are interleaved by board, and model order within each board is shuffled with the seed.
- **Re-run.** Grok 4.6's original 7×7 request, which timed out in September, is re-run once under the original request; this is reported separately as a dated re-run.

## Routes and the batch decision

OpenRouter's Batch API (launched 22 September 2026) was checked first. It halves typical per-token prices, finishes within 24 hours, covers chat completions but not the Decisions API, and accepts images by public URL only.

| Model | September route | This study | Why |
|---|---|---|---|
| GPT-5.6 Sol | OpenAI, standard ($2 / $10 per M then) | **Batch**, OpenAI only | The batch price equals the September price; standard is now $4 / $20 |
| Claude Opus 4.8 | Anthropic, standard | **Batch**, Anthropic only | 50% saving, same provider |
| Gemini 3.1 Pro Preview | Google AI Studio, standard | On demand, the original provider block | Batch exists only on Vertex; keeping the provider outweighs the saving |
| Grok 4.6 | Amazon Bedrock us-west-2 | On demand, the original provider block | No batch endpoint |
| Jev 1.13 | TypeSafe, Decisions | On demand, the original provider block | Decisions cannot be batched; trajectories are sequential |

**Disclosed differences.** Batch requests carry the image by URL. That URL is a raw GitHub file on a dedicated public branch with byte-identical PNGs; their SHA-256 hashes are recorded. On-demand requests carry it inline, as in September. Batch replies carry no comparable latency, so latency is compared only for on-demand models.

## Budget and stopping

- **Cap.** A campaign cap of **$9.50** of new OpenRouter spend, Jev included, under the account's $11.11 balance. Spend is read from the key's usage counter, against a baseline of $4.603064 recorded before the campaign.
- **On-demand guard.** Before each call: spend so far + unsettled batch reserve + that call's worst case (12,000 input tokens and 12,288 output tokens at its prices, plus $0.01) must stay within the cap. Otherwise the run stops, and unrun calls are reported as not run.
- **Batch guard.** Before submission: spend so far + 1.5 × the September mean cost per request × number of requests must fit within the cap.
- **No retries.** Timeouts (600 s client alarm, as in September), provider errors and malformed replies are preserved and counted as no answer.

## Endpoints

- **Jev.** These match the SubQ panel preregistration, so the two models are directly comparable:
  - paired raw vs filtered success per size (exact McNemar, Holm across sizes);
  - board solve rates with Clopper–Pearson intervals;
  - prefix survival, and non-forced cell accuracy against chance;
  - calibration.
  
  The Jev-vs-SubQ comparison on identical boards is reported as exact paired counts per size and mode, descriptive only.
- **Frontier.**
  - Per model and size: correct full placements (strict JSON plus correct) and written-correct placements (post-hoc diagnostic), each out of 12, with Clopper–Pearson 95% intervals.
  - No-answer counts, cost and, for on-demand models, latency.
  - Comparisons between models are descriptive, not tested.

## Credentials and logging

- **Broker.** All requests go through a local broker. It reads the OpenRouter key once from the macOS keychain into its own memory and injects it; the key never appears in code, arguments, files, logs or receipts.
- **Local storage.** Every request and response is kept locally under `output/`. Published copies replace inline image data with a content hash.
- **Observability.** Nothing in these requests disables the account's observability forwarding.

## Amendments

**Amendment 1 (2026-10-16, before any Claude Opus 4.8 request).** OpenRouter rejected the Anthropic batch submission three times with HTTP 400 ("does not have a :batch endpoint"), even though the endpoint is listed in the model catalog. Nothing was run or billed. Switching to Anthropic's native `/v1/messages` batch format would change the request format, so Opus instead runs on demand with the September Anthropic provider block, the inline image and the 600 s timeout, exactly as in September. The batch row in the routes table therefore applies only to GPT-5.6 Sol. Opus's expected cost rises by about $1.50 and stays under the campaign cap.
