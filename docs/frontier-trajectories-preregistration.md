# Frontier models, one queen per request: preregistration

Frozen on **17 October 2026**, before any request. The September and 16 October tests asked each frontier model for a whole solution in one reply. This study asks for one queen at a time, in a single conversation, so each step can be replayed and compared with Jev, SubQ Snap and the greedy rule on the same boards.

## Table of contents

- [Questions](#questions)
- [Protocol](#protocol)
- [What the model sees](#what-the-model-sees)
- [Actions and how they are applied](#actions-and-how-they-are-applied)
- [Models and routes](#models-and-routes)
- [Boards, pilot and sample size](#boards-pilot-and-sample-size)
- [Failures and budget](#failures-and-budget)
- [Endpoints](#endpoints)
- [Credentials and storage](#credentials-and-storage)
- [Amendments](#amendments)

## Questions

1. Given the same text state as the decision models and one queen per request, how often does each frontier model finish with the unique solution?
2. Where do trajectories first leave the solution, and do models repair the error with a revision?
3. How do these step-by-step paths compare with the same model's one-shot answer on the same board, and with Jev, SubQ and the greedy rule?

## Protocol

- **One conversation per model and board.** Request k carries every earlier request and visible reply. Hidden reasoning is excluded and is not carried between turns.
- **At most N requests** on an N×N board. Each request permits one action. The model cannot restart the conversation, may stop early, and may revise its placement.
- **No feedback.** The harness applies each action exactly as written. The next request shows the updated placement and nothing else: no correctness, legality or solution hint.
- **No early termination.** Leaving the solution, or breaking a rule, does not end the attempt. It ends after request N, at a stop, or at a request failure.
- **Grading.** The placement at the end is the final answer. It is correct when it equals the unique solution. Explanations are encouraged and never scored.
- **Offline judge only.** Each board's unique solution labels steps afterwards and is never sent.

## What the model sees

Each request is one JSON document with three parts:

- **`state`** is the decision-model state from `scripts/subq/trajectories.py`: rules, coordinates, the region grid, every region's cells and the placed queens. Only its instruction is adapted: work toward the unique solution, one action per request, no restart, no feedback.
- **`request`** gives the request number and the maximum.
- **`question`** describes the three actions and their JSON forms. It asks for a short explanation first, then the action as one JSON object in a fenced `json` block.

The state is text, as for the decision models. No image is sent, so image perception plays no part.

## Actions and how they are applied

| Action | Effect |
|---|---|
| `place` (row, column) | Adds one queen. A rule-breaking queen is still added and its violations recorded; the model can see it in the next state. An occupied cell is a no-op. |
| `revise` (list of queens) | Replaces the whole placement. Any queens may move, but at most one new queen may be added, so the list holds at most one more queen than before. A longer list is a no-op (`revise_too_many`). |
| `stop` | Ends the attempt with the current placement. |
| Anything else | No-op (`invalid_action`); the request is still used. |

**Parsing.** The harness reads the last fenced `json` block that decodes to an object with an `action` key. If there is none, it takes the last such bare object. Model text is never executed. An empty visible reply is carried in the history as `(no visible reply)`, disclosed as harness text.

## Models and routes

| Model | Route | Why |
|---|---|---|
| GPT-5.6 Sol | **Batch API, OpenAI only**: one batch per round of turns | Same provider as the 16 October panel; half the price |
| Claude Opus 4.8 | On demand, Anthropic (16 October block) | Its batch submission was rejected on 16 October |
| Gemini 3.1 Pro Preview | On demand, Google AI Studio (16 October block) | Its only batch provider is Vertex, which can take up to 96 h per round; up to 9 sequential rounds would not finish |
| Grok 4.6 | On demand, Amazon Bedrock us-west-2 (16 October block) | No batch endpoint |

All four use `max_tokens` 12288 and reasoning effort high with reasoning excluded, as in the one-shot tests. On-demand calls have a 600 s client deadline.

## Boards, pilot and sample size

- **Pilot (already preregistered here).** One development board, `dev-5-01`, for all four models: one trajectory each. It tests the harness and measures cost. It is reported separately and never pooled.
- **Panel boards.** The 36 boards of the 16 October panel, arranged as 12 seeded blocks (seed 20261017). Each block holds one 5×5, one 7×7 and one 9×9 board. Within each size, every run of four blocks covers all four strata.
- **Block count K.** Fixed after the pilot by a cost-only rule. K is the largest number up to 12 whose projected cost fits the room left under the campaign cap, after the earlier-generation panel's reserves. The projected cost per board is 1.5 × the pilot 5×5 cost × (N/5)². Results never influence K. Runs of four blocks are preferred, so K is rounded down to a multiple of 4 when K ≥ 4.
- **Order.** GPT runs its K boards in batch rounds. The other three models run their boards in block order, in parallel.

## Failures and budget

- **Request failures.** A turn whose request fails before any model answer (HTTP error, timeout, or a failed batch item) is re-sent once, unchanged, after 30 s (or in the next round). A second failure ends the trajectory as `request_failure`, counted as unsolved and shown separately.
- **Guard.** Before every on-demand call, spend so far plus unsettled reserves plus the call's worst case must fit the $18.75 campaign cap shared with the earlier-generation panel. The earlier-generation panel's unspent sub-cap is held back for it until all of its calls are recorded.
  - The worst case is the request size in tokens (bytes ÷ 3) at the input price, plus 12,288 output tokens and $0.01.
  - It is registered under a file lock before sending.
  - It is replaced by the reported cost afterwards, or kept in full when the cost is unknown (a timeout).
- **Spend so far** is the larger of the key's usage counter delta and the locally recorded costs, as in the earlier-generation preregistration.
- **Batch rounds.**
  - Each round reserves, per request, the lower of the worst case and 3 × the model's mean turn cost so far.
  - Batch items carry no per-item cost, so a turn's cost is its tokens × the batch price.
  - The round's reported total is recorded when it settles.
  - A round whose submission outcome is unknown is never resubmitted; it is first reconciled against the account's batch list.
  - Settling a round twice records nothing twice.
- **Censoring.** If a call does not fit, nothing is sent. That model's remaining trajectories are not started and are reported as `censored_budget`, never as failures.
  - A run resumes a censored model only when explicitly asked, for example after earlier reserves settle below their estimates.
  - If a re-send is censored after a failed first attempt, the turn keeps the first attempt's receipt, and the trajectory is reported as censored.

## Endpoints

Descriptive only; these trajectory samples are small.

- **Primary.** Boards solved per model and size (final placement equals the unique solution), with Clopper–Pearson intervals.
- **Path measures.**
  - Turn of the first off-solution placement.
  - Correct queens in the final placement.
  - Revision use, and whether a revision removed an off-solution queen.
  - Stops, no-ops and request failures.
  - Rule-breaking placements.
- **Paired comparisons on the same boards.**
  - The same model's 16 October one-shot result.
  - Jev and SubQ (either menu) on the 192-board panel.
  - The greedy rule.
- **Cost and tokens** per trajectory and per model.

## Credentials and storage

- **Broker.** All requests go through the local broker. It holds the key in memory, and the key never appears in code, arguments, files, logs or receipts.
- **Local storage.** Every request (with full conversation history) and every response is stored locally under `output/frontier-trajectories/`.
- **Published evidence** carries each request, the visible reply, the parsed action, the applied effect and the step labels.
- **Observability.** Nothing in these requests disables the account's observability forwarding.

## Amendments

**Amendment 1 (17 October, during the pilot): account budget block.**
- At 20:49 UTC, OpenRouter's organization monthly budget limit ($20.00) began rejecting requests with HTTP 403, before any model call.
- **Pilot state.** The three on-demand pilot trajectories had already finished. GPT-5.6 Sol's batch rounds stop at the first rejected round, and its trajectory resumes from the same turn once the limit allows.
- **Runner change.** Such responses are never recorded as a turn or as a request failure, and the runner stops at once.
- **Harness hash.** The frozen plan records the hash change; prompts, actions, parsing, grading and routes are unchanged.
