# Follow-ups of 17 October 2026: earlier generations, one queen at a time, and the greedy rule

Three follow-ups ran under two preregistrations: [earlier-generation panel](legacy-panel-preregistration.md) and [frontier trajectories](frontier-trajectories-preregistration.md). Every request and response is stored locally, and the published evidence carries every receipt.

## Table of contents

- [Summary](#summary)
- [Earlier generations on the 36-board panel](#earlier-generations-on-the-36-board-panel)
- [One queen per request](#one-queen-per-request)
- [The greedy rule](#the-greedy-rule)
- [Batch API, the account guardrail and cost](#batch-api-the-account-guardrail-and-cost)
- [Published-evidence fix](#published-evidence-fix)
- [Credentials](#credentials)

## Summary

<!-- auto:summary -->
| Test | Boards | Result |
|---|---|---|
| Earlier-generation reasoning models (GPT-5.5, 5.4, 5; Claude Opus 4.7, 4.6), one shot from an image | 36 panel boards each | 105 correct of 108 answered; 72 calls not yet run (budget limits) |
| GPT-4.1 (no reasoning), same | 36 | 1/36 |
| Gemini 2.5 Pro and Flash, same | 36 each | Batch queued on Google Vertex |
| Frontier models, one queen per request, text state, no feedback | 1 development board each | 4 of 4 solved, each in 5 requests |
| Greedy rule, step records | 201 boards | Reproduces 80/192 and 4/9; every step published and independently verified |
<!-- /auto:summary -->

## Earlier generations on the 36-board panel

<!-- auto:legacy -->
| Model | 5×5 | 7×7 | 9×9 | Correct / recorded | Strict JSON | Misses | Not yet run | 1 Oct, 3 boards | Route | Cost |
|---|---:|---:|---:|---:|---:|---|---:|---:|---|---:|
| Claude Opus 4.6 | 4/4 | 4/4 | 4/4 | **12/12** | 0/12 | none | 24 | 3/3 | On demand | $1.48 |
| Claude Opus 4.7 | 9/9 | 9/9 | 8/8 | **26/26** | 26/26 | none | 10 | 3/3 | On demand | $1.92 |
| GPT-5.4 | 9/9 | 9/9 | 8/8 | **26/26** | 26/26 | none | 10 | 3/3 | On demand | $1.16 |
| GPT-5.5 | 11/11 | 11/11 | 10/10 | **32/32** | 32/32 | none | 4 | 3/3 | On demand | $2.46 |
| GPT-5 | 4/4 | 3/4 | 2/4 | **9/12** | 9/12 | 3 truncated | 24 | 3/3 | On demand | $1.13 |
| GPT-4.1 | 1/12 | 0/12 | 0/12 | **1/36** | 1/36 | 35 wrong | 0 | 0/3 | On demand | $0.08 |
| Gemini 2.5 Flash | 0/0 | 0/0 | 0/0 | **0/0** | 0/0 | none | 36 | 1/3 | Batch (Vertex) | $0.00 |
| Gemini 2.5 Pro | 0/0 | 0/0 | 0/0 | **0/0** | 0/0 | none | 36 | 3/3 | Batch (Vertex) | $0.00 |

- **Correct** counts strict JSON plus correct-but-off-format answers; the strict column is the preregistered primary score.
- **1 Oct, 3 boards** is the written-correct count on the three original boards.
- **Not yet run (144 calls)** are requests blocked by an account or key budget limit before reaching any model, or Gemini batch items still queued on Vertex. None of them is counted as a model outcome.
- **Gone.** Claude Sonnet 4, tested on 1 October, has no OpenRouter endpoint any more.
- **Pattern.** The earlier reasoning models were correct on 105 of the 108 boards they answered (93 in strict JSON). Their wrong or missing answers: GPT-5: 3 truncated. Claude Opus 4.6's answers were all correct but wrote text around the JSON. GPT-4.1, which has no reasoning mode, solved 1 of 36.
- **Comparison.** The current frontier models solved 34–36 of the same 36 boards on 16 October. These comparisons are descriptive.
<!-- /auto:legacy -->

## One queen per request

<!-- auto:trajectories -->
**Pilot: development board dev-5-01 (5×5)**

| Model | Boards | Solved | First off-solution request | Revisions | Stops | Requests | Cost |
|---|---:|---:|---|---:|---:|---:|---:|
| GPT-5.6 Sol | 1 | 1 | never | 0 | 0 | 5 | $0.03 |
| Claude Opus 4.8 | 1 | 1 | never | 0 | 0 | 5 | $0.23 |
| Gemini 3.1 Pro Preview | 1 | 1 | never | 0 | 0 | 5 | $0.18 |
| Grok 4.6 | 1 | 1 | never | 0 | 0 | 5 | $0.11 |

- **What the replies show.** GPT-5.6 Sol and Claude Opus 4.8 stated the full solution in their first reply, then placed it one queen per request. Grok 4.6's first reply named three of the five queens and said the rest were forced. Gemini 3.1 Pro Preview derived one queen per reply from the rows, columns, regions and touching rule.
- **Self-checking.** Claude Opus 4.8 also checked its earlier queens at each step ("Both placed queens are correct"), from its own reasoning. The harness gave no feedback.
- **Cost.** For every model the first request cost the most, and later requests cost less.
- **Block count.** The preregistered cost-only rule set the number of panel blocks to **0**. With the earlier-generation panel's unspent budget held back, $1.23 of the campaign cap remained, against a projected $5.03 per block (one 5×5, 7×7 and 9×9 board per model).
  - Panel trajectories can follow under the same frozen protocol when there is budget.
<!-- /auto:trajectories -->

## The greedy rule

- **Documentation.** Until now the rule was documented as one paragraph and a table in the methods critique, a line under the scoreboard and a docstring. No per-step trace was published, and its three implementations had never been cross-checked.
- **Now.** [`docs/greedy-rule.md`](greedy-rule.md) and the book's "Greedy rule baseline" chapter give:
  - the exact rule;
  - its scoring;
  - results by size and by stratum;
  - where it fails;
  - step-by-step replays for all 201 boards.
- **Verification.** A JavaScript verifier recomputes every step from the region grids alone, 3,706 checks in all.
- **Two properties, verified on every board.**
  - **A forced step never leaves the solution.** All 117 failures came at steps with two or more legal cells.
  - **Every failure ends in a dead end** when the rule keeps going, because a complete legal placement is the unique solution.

## Batch API, the account guardrail and cost

- **Batch first.** The Batch API was tried for every earlier-generation model before any on-demand call. In the trajectories only GPT-5.6 Sol used batch; the other three ran on demand, as preregistered.
  - **Accepted.** Gemini 2.5 Pro and Flash (on Google Vertex, their only batch provider) and the GPT-5.6 Sol trajectory rounds.
  - **Rejected.** Every OpenAI and Anthropic earlier-generation batch, with HTTP 400 ("does not have a :batch endpoint"), although the catalog lists a `:batch` variant for each. GPT-4.1 was tried with both the plain and the explicit `:batch` ID, and GPT-5.5, GPT-5.4 and GPT-5 with the plain ID only. Anthropic was tried in both the chat and Messages shapes.
  - **Fallback.** Those six models ran on demand with their 1 October provider blocks, as preregistered.
- **Gone.** Claude Sonnet 4 has no OpenRouter endpoint any more and could not be re-run.
- **Account guardrail.** At 20:49 UTC, the organization's $20 monthly budget limit began rejecting on-demand requests with HTTP 403 before any model call. 110 calls were blocked.
  - **Not model outcomes.** They were reclassified as "not run".
  - **Re-sent.** 38 went through unchanged after the organization limit was raised.
  - **Second block.** At 21:15 UTC the API key's own weekly $20 limit (which resets 19 October, 00:00 UTC) blocked the rest (amendment 6). The remaining 72 calls will be sent unchanged once it allows.
  - **Runner change.** Both runners now stop at the first such response.
- **Batch holds.** OpenRouter holds a submitted batch's worst-case cost in the key's usage counter until it settles: +$2.78 for the two Gemini batches. The ledger counts that hold once.

<!-- auto:cost -->
- **Recorded so far:** $8.23 for earlier-generation calls and $0.54 for the trajectory pilot.
- **Gemini.** The two Gemini batches are billed when they settle. OpenRouter holds $2.78 for them meanwhile.
- **Ceilings.** The campaign cap ($18.75) and the user's credit balance bound all spend.
- **Account limits.** The organization's monthly limit (raised during the run) and the API key's weekly $20 limit stopped the runners. Both returned HTTP 403 before any model call.
<!-- /auto:cost -->

## Published-evidence fix

- **The problem.** The 16 October publishers copied raw responses.
  - 146 published response files therefore carried providers' encrypted reasoning blobs (`reasoning_details`), which the evidence contract excludes.
  - Two Gemini rate-limit error bodies carried the OpenRouter account identifier (`user_id`). It is an account identifier, not a credential; it cannot be used to derive the key.
- **The fix.** All 147 files have been cleaned, and every publisher now writes through `scripts/analysis/public_scrub.py`.
- **The check.** `npm run evidence:check-public` fails if any private field survives.
- **History.** Earlier commits on GitHub still contain the identifier.

## Credentials

- **Broker.** A local broker read the OpenRouter key from the macOS keychain into its own memory and injected it into each request. The key never appeared in code, command arguments, files, logs, receipts or any agent's view.
- **Key endpoint.** Only the numeric `usage`, `limit` and `limit_remaining` fields of `/api/v1/key` were read.
- **Observability.** Nothing in these requests disables the account's observability forwarding.
