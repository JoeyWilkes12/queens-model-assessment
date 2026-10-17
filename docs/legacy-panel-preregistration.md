# Earlier-generation models on the 36-board panel: preregistration

Frozen on **17 October 2026**, before any request. This extends the [1 October earlier-generations replay](../public/evidence/earlier-generations-PROTOCOL.md), which gave each model one request on each of the three original boards, to the 36 boards of the [16 October frontier image panel](frontier-image-panel-preregistration.md).

## Table of contents

- [Question](#question)
- [Models](#models)
- [Boards, prompt and request](#boards-prompt-and-request)
- [Routes: batch first](#routes-batch-first)
- [Budget and stopping](#budget-and-stopping)
- [Endpoints](#endpoints)
- [Credentials and storage](#credentials-and-storage)
- [Amendments](#amendments)

## Question

With 36 boards instead of 3, how often does each earlier-generation model produce a correct full placement in one shot from a board image, by size? How does that compare with the current frontier models on the same boards?

## Models

Every model with a recorded answer on 1 October that OpenRouter still serves:

| Family | Models |
|---|---|
| GPT | GPT-5.5, GPT-5.4, GPT-5, GPT-4.1 (no reasoning control) |
| Claude | Opus 4.7, Opus 4.6 |
| Gemini | 2.5 Pro, 2.5 Flash |

- **Not runnable.** Claude Sonnet 4 was tested on 1 October but now has no OpenRouter endpoint (catalog checked 17 October). It is reported as retired, not as a failure.
- **Not added.** The six ladder models frozen but never run on 1 October (GPT-5.2, GPT-5.1, GPT-4o, Opus 4.5, Sonnet 4.5, Gemini 2.5 Flash Lite) are outside this extension.
- **Deadline.** OpenRouter lists 20 October 2026 as the expiry date of both Gemini 2.5 models, so they are submitted first.

## Boards, prompt and request

- **Boards.** The 36 panel boards (12 per size, 3 from each singleton × search-tier stratum), in the panel's interleaved order. Every board also has frontier, Jev, SubQ and greedy-rule results.
- **Images and prompt.** The panel's byte-identical PNGs and the September prompt template (sha256 `b7ef8260…`). Each request's messages equal the 16 October GPT-5.6 Sol batch request for that board; the freeze step asserts this.
- **Envelope.** Each model's 1 October settings: `max_tokens` 12288, reasoning effort high with reasoning excluded (GPT-4.1 has no reasoning parameter), default sampling, no tools, no repair turns, no retries.
- **Grading.** The unchanged strict JSON grader, plus the post-hoc single-object extraction as a separate diagnostic.

## Routes: batch first

As requested, the Batch API is used wherever a model has a `:batch` endpoint, even when that means a different provider. Batch prices are half the on-demand prices.

| Model | 1 October route | This study |
|---|---|---|
| GPT-5.5, GPT-5.4, GPT-4.1 | OpenAI, on demand | Batch, OpenAI only |
| GPT-5 | OpenAI (`openai/default`), on demand | Batch, OpenAI only |
| Opus 4.7, Opus 4.6 | Anthropic, on demand | Batch, Anthropic only |
| Gemini 2.5 Pro, 2.5 Flash | Google AI Studio, on demand | **Batch, Google Vertex only** (the only batch provider) |

- **Disclosed differences.** Batch requests carry the image as a public URL to a byte-identical PNG on the dedicated evidence branch, rather than inline. Batch replies carry no comparable latency. Gemini 2.5 runs on a different provider than on 1 October.
- **Anthropic fallback order.** The 16 October Opus 4.8 batch was rejected ("no :batch endpoint"). If the chat-completions batch is rejected again before validation, the same content is submitted in the Anthropic Messages shape. Reasoning effort high maps to `output_config.effort: "high"`, OpenRouter's documented equivalent. If that is rejected too, the model runs on demand with its 1 October provider block and an inline image.
- **Any rejected batch** falls back to on demand the same way, recorded as an amendment before any of that model's on-demand calls.

## Budget and stopping

- **Campaign cap.** $18.75 of new OpenRouter spend for this study and the frontier trajectories together, read from the key's usage counter against a baseline recorded before any request. This study has a $10.50 sub-cap.
- **Batch guard.** Before each submission, spend so far plus unsettled reserves plus a reserve of 1.5 × (1 October mean cost × 0.5) per request must fit both caps. A batch that does not fit waits until earlier batches settle.
- **On-demand guard.** Before each call, the call's worst case (12,000 input tokens and 12,288 output tokens at its prices, plus $0.01) must fit.
- **Expected cost.** About $8.85 at batch prices, from the 1 October mean cost per request.
- **No retries.** HTTP errors, failed batch items, timeouts and malformed replies count as no answer.

## Endpoints

- Per model and size: strict correct placements and written-correct placements, each out of 12, with Clopper–Pearson 95% intervals.
- No-answer, truncation and wrong counts; cost; returned model version and provider.
- Comparisons between models and with the frontier panel are descriptive, not tested.
- One request per model and board estimates a rate on these boards. It does not identify a release threshold.

## Credentials and storage

- Requests go through the local broker. It reads the OpenRouter key from the macOS keychain into its own memory and injects it; the key never appears in code, arguments, files, logs or receipts. Only the numeric `usage`, `limit` and `limit_remaining` fields of `/api/v1/key` are read.
- Every request and response is stored locally under `output/legacy-panel/`. Published copies replace image payloads with a content hash.
- Nothing in these requests disables the account's observability forwarding.

## Amendments

None yet.
