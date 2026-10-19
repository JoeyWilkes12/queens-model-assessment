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

- **Campaign cap.** $18.75 of new OpenRouter spend for this study and the frontier trajectories together. This study has a $10.50 sub-cap.
- **Spend so far** is the larger of two numbers: the key's usage counter minus a baseline recorded before any request, and the costs recorded locally for every settled call or batch. The local record covers the counter's lag of a few minutes.
- **Batch costs.** Batch items report tokens but no per-item cost. A batch's reported total is recorded when it settles, and each item's cost is its tokens × the batch price, with cached input at the cached rate (a tenth of the input price). That reproduces the settled batch totals exactly.
- **Commitments.** Each reserve is registered under a file lock before the request is sent, so parallel processes see each other's commitments. A call whose cost is unknown, such as a client timeout, is recorded at its worst case.
- **Batch guard.** Before each submission, spend so far plus unsettled reserves plus a reserve of 1.5 × (1 October mean cost × 0.5) per request must fit both caps. A batch that does not fit waits until earlier batches settle.
- **On-demand guard.** Before each call, the call's worst case (12,000 input tokens and 12,288 output tokens at its prices, plus $0.01) must fit.
- **Expected cost.** About $8.85 at batch prices, from the 1 October mean cost per request.
- **No retries.** HTTP errors, failed batch items and timeouts count as no answer. A malformed HTTP-200 reply counts as wrong, or as truncated if the token budget ran out.
- **Unknown submissions.** If a batch submission's outcome is unknown (a dropped connection or a 5xx), its reserve stays. Nothing is resubmitted until the batch is found in the account's batch list or confirmed absent. Only an explicit 4xx rejection releases the reserve.

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

Amendments 1–3 were made on 17 October, after the batch submissions and before any on-demand call; no model output had been seen. Amendments 4–8 were made during the on-demand runs, after outputs had been recorded. None of them changes a request, the grading or any recorded outcome.

**Amendment 1: routes.**
- **Accepted.** Both Gemini 2.5 batches (Google Vertex only).
- **Rejected.** Every OpenAI and Anthropic batch, with HTTP 400 ("does not have a :batch endpoint"), although the catalog lists a `:batch` variant for each. That is the same failure as the 16 October Opus 4.8 batch.
  - GPT-4.1 was tried with both the plain and the explicit `:batch` model ID; GPT-5.5, GPT-5.4 and GPT-5 with the plain ID only.
  - Anthropic was tried in both the chat-completions and Messages shapes.
- **Fallback.** Nothing was accepted or billed. As preregistered, GPT-5.5, GPT-5.4, GPT-5, GPT-4.1, Opus 4.7 and Opus 4.6 run on demand with their 1 October provider blocks, an inline image and the 600 s timeout, exactly as on 1 October.

**Amendment 2: budget split.**
- On demand costs twice the batch price, so the expected cost of this study rises from about $8.85 to about $15.6.
- The sub-cap rises from $10.50 to $15.75 so that all 36 boards per model fit.
- The $18.75 campaign cap is unchanged. The frontier trajectories receive what remains, through their cost-only block rule.

**Amendment 3: accounting.**
- OpenRouter holds a submitted batch's worst-case cost in the key's usage counter at submit: +$2.78 for the two Gemini batches, before any processing.
- The campaign guard therefore no longer adds the local batch reserve on top of that hold.
- The sub-cap still counts the reserve until the batch settles.

**Amendment 4: account budget block.** At 20:49 UTC on 17 October, OpenRouter began rejecting requests with HTTP 403: "Budget limit exceeded (monthly limit) … of $20.00 used". That is an organization guardrail on monthly spend, separate from the key limit and the credit balance.
- **Scope.** 110 on-demand calls were rejected before reaching any model: GPT-5.5 16, GPT-5.4 19, GPT-5 28, Opus 4.7 19 and Opus 4.6 28.
- **Classification.** They are not model outcomes. They are reclassified as "not run (blocked)", with their receipts kept in `output/legacy-panel/raw-blocked-403/`. The rule applies to every blocked call regardless of model or board.
- **Next.** They will be sent unchanged once the limit allows.
- **Runner change.** Both runners now stop at the first such response.

**Amendment 5: sub-cap.**
- The sub-cap rose from $15.75 to $17.25.
- **Why.** The sub-cap counts the open Gemini batches at their 1.5× reserve ($3.06), well above their expected cost (about $2). The last calls of the panel would have been stopped although the campaign cap had room.
- **Unchanged.** The $18.75 campaign cap, and the user's credit balance ($11.51 when the runs resumed), still bound the total.
- **Trajectories.** The frontier trajectories could not afford a panel block in either case.

**Amendment 6: API key budget block.** After the workspace limit was raised, the API key's own weekly limit of $20.00 (which resets 19 October, 00:00 UTC) began rejecting requests at 21:15 UTC with HTTP 403: "API key budget limit exceeded (weekly limit)".
- **Handling.** Each runner stopped at its first such response, as amendment 4 now requires. No blocked call is recorded as a model outcome.
- **Remaining.** 72 calls: 67 never sent, plus the 5 rejected at 21:15 UTC. They will be sent unchanged once the key's limit allows.

**Amendment 7: resumption on 19 October.**
- **Gemini batches.** Both settled on 19 October, inside the Vertex window, with all 36 items each: $1.55 for Gemini 2.5 Pro and $0.48 for Flash, $2.03 in all. OpenRouter released the rest of its $2.78 hold.
- **Key limit.** The key allowed requests again on 19 October. The remaining calls were sent unchanged from 19:19 UTC.
- **Credit stop.** This key cannot read the credit balance; OpenRouter allows that only to management keys. The runners therefore also stop at HTTP 402 (insufficient credits), handled exactly like the budget blocks in amendment 4: never a model outcome, the call stays not run.
- **Chunked runs.** The session runs background jobs for at most two hours, and a job stopped mid-request would leave a call with no recorded outcome. The runner was therefore paused between calls, by an unsettled hold in the ledger that fails its next cap check, and resumed in chunks of 35 calls. No request, setting or outcome changed.
- **Outcome.** 65 of the 72 calls were sent and recorded. The runner then stopped at the $17.25 sub-cap, before any request: the next call's worst case ($0.38) exceeded the $0.35 left. The last 7 calls followed under amendment 8.

**Amendment 8: the last 7 calls.** At 21:16 UTC on 19 October the user reported $2.53 of OpenRouter credit left and asked for the last 7 calls to be sent.
- **Caps.** The campaign cap rose from $18.75 to $19.85: recorded spend ($17.44) plus the reported credit, less a $0.10 margin. The sub-cap rose to the same figure. As before, a call starts only if its worst case fits under both, so no call could overdraw the reported balance.
- **Unchanged.** The requests, settings and grading. The trajectory block count was fixed at 0 after the pilot and is not recomputed.
- **Outcome.** All 7 were sent unchanged and recorded, for $0.81. All 288 scheduled calls now have a recorded answer.
