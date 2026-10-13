# SubQ Snap assessment: retained Jev tasks and new construction paths

Assessment date: **2026-10-13**. Requested and returned SubQ ID: `subq-snap-preview`. Historical Jev build: `typesafe/jev-1.13-20260917`, requested through its versioned family route. The report uses saved programmatic receipts and deterministic Queens checks; no model judge scored the results.

## Table of contents

- [Executive finding](#executive-finding)
- [Coverage and exclusions](#coverage-and-exclusions)
- [Priority source-matched comparisons](#priority-source-matched-comparisons)
- [Actual adaptive construction](#actual-adaptive-construction)
- [The 16-question compatibility boundary](#the-16-question-compatibility-boundary)
- [Cost and timing](#cost-and-timing)
- [Provider nuances and interpretation](#provider-nuances-and-interpretation)
- [Containment and verification](#containment-and-verification)
- [Receipts and next experiment](#receipts-and-next-experiment)

## Executive finding

SubQ's result is selective and representation-sensitive. It consistently selected correct complete candidates in the two prioritized annotated 5×5 conditions, but failed every textual Q-grid replay. On the prioritized 9×9 vector sets, it reproduced the same successful source variant as Jev and failed the other two. These are candidate-recognition assessments, with supplied complete alternatives.

In the separate adaptive experiment, SubQ completed **10/90 fresh trajectories on 2/9 boards**. All ten solves used immediate-conflict filtering on `sequence-5-2` and `sequence-5-3`; raw menus solved 0/45. Jev had also completed 10/90 trajectories, but on `sequence-5-1` alone, with five raw and five local solves. The identical overall total conceals different board coverage and dependence on filtering. Neither model solved a 7×7 or 9×9 board in this nine-board construction corpus.

This does not establish a general model ranking. The tested boards are a small synthetic sample, some regions are singletons, and repeated attempts share inputs, serving period and provider infrastructure.

## Coverage and exclusions

The exact-replay plan contains 754 scheduled calls from 730 retained historical requests, including 24 additional priority repeats. It excludes six Jev pre-inference endpoint/routing/policy mistakes: three chat-endpoint probes, two allowlist/guardrail rejections, and one broker rejection of a dated build input. The valid historical HTTP 520 construction attempt and its separately authorized same-payload retry remain distinct source records. No new wrong-endpoint inference probes were added.

Current saved exact-replay coverage: **739 upstream attempts**, 736 HTTP 200 replies, 15 explicit local compatibility skips, and 0 remaining scheduled entries. Three original oversized batches returned HTTP 422; these are interface failures, not incorrect Queens answers. Check the [live saved summary](subq-summary.json) for the exact completed state.

Model-visible state, instructions, criteria, labels and ordering are unchanged in the exact replay. Only the model/provider envelope changes. Frozen sequential states containing Jev's prior choices remain conditional replay decisions; they do not represent a SubQ path or a new whole-board solve. Region-preference questions have no unique correct region and remain ungraded for puzzle correctness. Whole-board placements, local feasibility, globally extendable moves, grid reading and typed validity judgments retain separate task identities.

## Priority source-matched comparisons

Each row covers **three distinct historical variants**. Historical variants can change candidate sets, correct-answer position or option order. SubQ repeated each exact variant three times; its three replies agreed within every prioritized variant. The variant denominator is the meaningful comparison with Jev; the nine-replay count additionally describes the observed repeats.

| Prioritized condition | Jev correct source variants | SubQ variants correct in all three repeats | SubQ correct exact replays |
| --- | ---: | ---: | ---: |
| 5×5 coordinate/region annotations | 1 / 3 | 3 / 3 | 9 / 9 |
| 5×5 textual Q/empty-cell boards | 1 / 3 | 0 / 3 | 0 / 9 |
| 5×5 annotation order controls | 1 / 3 | 3 / 3 | 9 / 9 |
| 9×9 row-column vectors, 12 candidates | 1 / 3 | 1 / 3 | 3 / 9 |

The annotated and textual-board treatments use complete candidate sets; code has already supplied the alternatives and, in the annotated condition, looked up region membership. They do not measure unaided search. Count-rich and flat-region controls help separate constraint recognition from grid/coordinate lookup. Local-move controls only require immediate pairwise legality; they must not be pooled with global completion.

The [source-matched audit](subq-comparison-audit.json) lists each historical request, its original Jev grade, the three SubQ call IDs and selected labels. It recomputes the historical grade with the same independent rule validator used for SubQ.

## Actual adaptive construction

This track reproduces the original nine boards, exact question/state templates and 90 attempts: five fresh empty-board restarts for each board in each of `raw` and `local`. The region answer determines the subsequent cell request; accepted cells determine the next state. Later SubQ states can differ from Jev. The runner executes sequentially in board groups to favor depth-first progress; Jev used repetition blocks with four independent work streams. This execution-order difference is disclosed.

Raw cell menus contain every cell in the chosen region. Local menus remove immediate row, column, region and touching conflicts only. The offline unique-solution oracle grades and stops the first globally unextendable prefix; it never supplies menus, solution labels, feedback or a preferred region. No backtracking is provided. A singleton region or cell menu causes a forced transition with no inference.

| Board | Mode | Jev completed / attempts | SubQ completed / attempts |
| --- | --- | ---: | ---: |
| sequence-5-1 | local | 5 / 5 | 0 / 5 |
| sequence-5-1 | raw | 5 / 5 | 0 / 5 |
| sequence-5-2 | local | 0 / 5 | 5 / 5 |
| sequence-5-2 | raw | 0 / 5 | 0 / 5 |
| sequence-5-3 | local | 0 / 5 | 5 / 5 |
| sequence-5-3 | raw | 0 / 5 | 0 / 5 |
| sequence-7-1 | local | 0 / 5 | 0 / 5 |
| sequence-7-1 | raw | 0 / 5 | 0 / 5 |
| sequence-7-2 | local | 0 / 5 | 0 / 5 |
| sequence-7-2 | raw | 0 / 5 | 0 / 5 |
| sequence-7-3 | local | 0 / 5 | 0 / 5 |
| sequence-7-3 | raw | 0 / 5 | 0 / 5 |
| sequence-9-1 | local | 0 / 5 | 0 / 5 |
| sequence-9-1 | raw | 0 / 5 | 0 / 5 |
| sequence-9-2 | local | 0 / 5 | 0 / 5 |
| sequence-9-2 | raw | 0 / 5 | 0 / 5 |
| sequence-9-3 | local | 0 / 5 | 0 / 5 |
| sequence-9-3 | raw | 0 / 5 | 0 / 5 |

SubQ used 325 paid API calls and 105 forced decisions. Its terminal outcomes were ten solves, seventy globally unextendable prefixes and ten immediate local-rule violations. `accepted_queens` includes a locally legal failing cell; `correct_queens_before_failure` excludes that global error. These fields are deliberately distinct.

An independent [path audit](subq-trajectory-audit.json) re-derived every prefix, menu, forced transition, selected cell, stop reason, completed board and receipt hash. It independently enumerated all board solutions and found exactly one on each board. Of the 325 actual calls, 220 match a retained Jev state/question payload and 105 follow new dynamic states. Recreated templates matched 394 original Jev trajectory calls before execution.

All 44 distinct SubQ model-visible payloads were submitted more than once during these trajectories. No Choice or reported probability-vector variation was observed within those repeated groups, and each of the 18 board/mode groups repeated one ordered trace across its five attempts. This establishes repeatability only for the observed calls. It does not establish global determinism, independent inference, an absence of caching, or calibrated probabilities.

## The 16-question compatibility boundary

Three exact held-out batches each containing 25 questions returned HTTP 422. A bounded diagnostic then identified a maximum of 16 questions per request. The public [Decisions documentation](https://docs.subq.ai/endpoints/decisions-api/) described one or more named questions but did not state that batch-count limit when reviewed. The interface observations and errors remain receipts.

To avoid repeating a known unsupported batch shape, the remaining 15 oversized exact requests were recorded as local compatibility skips without dispatch or spend. A separate adaptation divides all 18 original 25-question tasks into contiguous **16 + 9** question groups. Each board state and each question's text, criteria and option order are preserved. The batch context changes and duplicates state across two calls, so this is not exact request-body replication.

The adapted track completed **18 of 18 logical tasks** through 36 separate part requests. 11 completed logical tasks passed their primary candidate-choice condition. The accompanying per-question grades retain the separate Noul and Score outcomes; this primary count does not mean every candidate judgment was correct.

All questions are independent judgments; none consumes another question's answer. Nevertheless, removing other questions can change the model's context and behavior. The merged 25-answer object is explicitly an offline aggregation of two provider receipts, not a response the provider returned in one call. A logical task is scored only after both parts succeed. See the [split summary and logical tasks](subq-split-summary.json).

## Cost and timing

The shared local ledger's latest saved snapshot estimates **$0.08695505** from returned input-token counts, with **$0.05898240** conservatively reserved for unmetered failures. The accounted amount is **$0.14593745**, below the local $4.50 ceiling and the user's $5 allowance. These are token-price estimates and unresolved reserves, not independently confirmed provider billing or an account-balance query. The shared ledger must not be added across study snapshots; later snapshots already include earlier calls.

The published price is $0.05 per million input tokens and no output-token charge. Each unresolved dispatch reserves the full 393,216-token context cost, $0.0196608. Error attempts are not assumed to be free. The ledger reserves before dispatch and survives process restarts. [Model IDs and pricing](https://docs.subq.ai/using-the-api/models/)

Per-call elapsed time and summed API time are retained separately from preparation, audit and website work. A trajectory that stops early can be faster because it failed; time to terminal outcome is not time to successful solution. Sequential SubQ execution and historical Jev concurrency also limit latency comparisons.

## Provider nuances and interpretation

SubQ Snap scores a predefined answer space through its dedicated Decisions route, `POST /v1/systemone`. Typed output does not guarantee that independently selected row choices satisfy global Queens constraints. The 5×5, 7×7 and 9×9 original batched row-construction requests all failed the complete-board rules. Matrix/prose construction on the six held-out boards also produced no valid solution. Region annotation can therefore improve recognition without establishing general combinatorial search.

Subquadratic's [launch article](https://subq.ai/introducing-subq-snap) describes sparse attention and a decision head and reports vendor benchmark gains against Jev. Those results are vendor claims, not this study's findings. Its long-context setup and benchmarks differ from this small Queens corpus. The public Snap API supports a 384K context and optional images; this replay remains text-only. A screenshot condition would be a separately labeled perception-plus-solving experiment.

Jev's historical native question surface also supported Choice, Noul and Score through [OpenRouter Decisions](https://openrouter.ai/docs/api/api-reference/alphadecisions/submit-a-decisions-request) and [TypeSafe's API](https://docs.typesafe.ai/api). Provider naming, route, probability reporting, batching limits and reported model-version granularity differ. SubQ's returned preview alias is not an immutable dated build identifier, so this experiment records the tested alias and date without claiming permanent model pinning.

## Containment and verification

The execution worker has no network interface and no credential mount. It can read approved scripts/Queens fixtures, write its dedicated receipts and call a narrowly scoped Unix-socket broker. The trusted broker owns the in-memory credential, fixed provider host/path, payload limits and budget. Neither program follows model-provided instructions, invokes tools from responses or evaluates returned content as code. No model judge is involved. Ordinary official documentation pages were treated as reference data; `llms.txt` was not fetched.

These are hardened Docker Engine containers, not the separate Docker Sandboxes `sbx` product. The broker's destination allowlist is enforced by trusted application code, not a machine-wide firewall. A compromised broker would retain its outbound network authority; host Codex itself is outside the worker sandbox. The [provider/containment reference](subq-provider.md) and saved isolation receipts document the tested boundary and its limits.

Offline tests cover invalid model/body/choice/distribution/confidence handling, local versus global legality, long-diagonal regional-Queens rules, fixture semantic hashes, split-question preservation, offline aggregation parity, trajectory stopping and budget/credential protections. Provider evidence is saved before grading. No automatic infrastructure retries or answer repairs occur.

## Receipts and next experiment

- [Exact replay summary](subq-summary.json), [frozen protocol](subq-protocol.json) and [historical-response regression audit](subq-reference-audit.json).
- [Adaptive summary and all ordered traces](subq-trajectories-summary.json), [adaptive protocol](subq-trajectories-protocol.json) and [independent path audit](subq-trajectory-audit.json).
- [Split-batch summary](subq-split-summary.json), [source-matched priority comparison](subq-comparison-audit.json), and [shared budget ledger](subq-budget.json).
- [Book chapter](https://joeywilkes12.github.io/queens-model-assessment/#/subq-assessment) and [searchable evidence atlas](https://joeywilkes12.github.io/queens-model-assessment/#/evidence-atlas). These routes describe the proposed PR content until publication is independently verified.
- [OpenAI Decisions test plan](openai-decisions-plan.md): confirm real access, model/route/schema and price before inference; preserve matched decision semantics; separate interface diagnostics, candidate recognition, frozen states and actual adaptive construction. No OpenAI Decisions inference is claimed here.
