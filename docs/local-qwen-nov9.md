# Local open-weight update: final nights through November 9, 2026

The final saved nights add **126 primary outcome records** to the November 6 snapshot: the remaining 30 gpt-oss 20B fresh2 text calls, 48 fresh1 medium-effort text calls and 48 fresh1 high-effort calls at a 65,536-token allowance. No Qwen, Gemma, LLaVA or rescue result changed. Coverage is now **27 study roots, 835 primary/audit receipts and 38 separate rescues**: 23 fully recorded assessment conditions (816 calls), two historical partial conditions (eight calls) and two selected loop-stop audits (11 calls). The 875 eligible planned calls include 40 historical unrecorded original-budget calls; every current queued panel has a recorded outcome for every planned attempt.

These are separate exploratory configurations, not a pooled accuracy estimate. A completed panel means recorded attempts, including caps, incorrect answers and one transport failure. Each four-arm panel has twelve boards, four per size, and one call per arm and board. Reused board identities do not become independent samples because a prompt arm or setting changes.

Sources: [final catalog](../public/evidence/local-qwen/snapshots/2026-11-09-overnight/catalog.json), [file manifest and hashes](../public/evidence/local-qwen/snapshots/2026-11-09-overnight/manifest.json), [retained November 6 catalog](../public/evidence/local-qwen/snapshots/2026-11-06-overnight/catalog.json) and [November 6 report](local-qwen-nov6.md). All evidence was imported offline from the benchmark owner's read-only checkout; no inference or service action was part of this update.

## Night and interruption reconciliation

Session timestamps are local America/Denver. Session `results` entries saying “complete” can be checks of existing evidence, not new calls.

| Session | Local start → finish | New primary outcome records | Interpretation |
| --- | --- | ---: | --- |
| 20261106T230000 | Nov6 23:00:00 → Nov7 08:36:01 | 89: fresh2 30, medium48, high65k11 | Fresh2 and medium finish; high65k reports deadline |
| 20261107T225602 | Nov7 22:56:02 → Nov8 08:04:48 | 36 high65k | Not idle: receipts prove continued work despite no queue-study result in results map |
| 20261108T230006 | Nov8 23:00:06 → 23:27:04 | 1 high65k | Archives one started-only attempt and records its replacement; condition complete |
| 20261109T230000 | Nov9 23:00:00 → 23:00:27 | 0 | Idle completion checks, queue waiting empty |
| 20261110T230005 | Nov10 23:00:05 → 23:00:32 | 0 | Idle completion checks, queue waiting empty |

The larger-budget study's source `abandoned/baseline_panel-9-45_20261108T230026/abandoned.json` records reason `started without a recorded result (interrupted session)` and moved_utc `2026-11-09T06:00:26.470163+00:00`. Its started-only request has no scored outcome. The final baseline receipt replaces that incomplete attempt. It is **not an extra failed puzzle trial**, and it is not added to the 48 recorded-outcome denominator. Operational logs and abandoned directories remain in the source outside the public import allowlist; no primary receipt was deleted or rewritten. Recorded request-time sums omit the abandoned work and cannot establish full job compute or wall time.

A different call, [neutral on panel-9-45](../public/evidence/local-qwen/snapshots/2026-11-09-overnight/studies/gpt-oss-20b-fresh1-text-4arm-np65536/receipts/neutral_panel-9-45/response.json), **does have a recorded failure**: `stream_error`, `prediction aborted, token repeat limit reached`. Its [metadata](../public/evidence/local-qwen/snapshots/2026-11-09-overnight/studies/gpt-oss-20b-fresh1-text-4arm-np65536/receipts/neutral_panel-9-45/metadata.json) retains null HTTP status, model-return identity, finish reason and input/output totals, with 1,488.26 measured seconds. It is included once as a non-strict transport failure; no model answer, token-cap grade, zero cost or replacement usage is invented.

## Complete gpt-oss results by arm and size

Each size cell is **strict / recorded**, with four planned and recorded attempts per cell. All requests use text region matrices, greedy temperature zero, seed 20261028, ABBA-style alternating arm order, cold unloads and a shadow-only detector. Strict, incorrect, caps and transport failure remain separate outcomes; no new format-only answer occurred in these panels.

### Fresh2 — high effort, 32,768 output / 36,864 context

[Plan](../public/evidence/local-qwen/snapshots/2026-11-09-overnight/studies/gpt-oss-20b-fresh2-text-4arm-np32768/plan.json) · [Summary](../public/evidence/local-qwen/snapshots/2026-11-09-overnight/studies/gpt-oss-20b-fresh2-text-4arm-np32768/summary.json).

| Arm | 5×5 | 7×7 | 9×9 | Total strict | Caps | Completed incorrect | Transport errors |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| baseline | 2/4 | 2/4 | 2/4 | 6/12 | 6 | 0 | 0 |
| schema | 3/4 | 1/4 | 1/4 | 5/12 | 7 | 0 | 0 |
| neutral | 3/4 | 3/4 | 1/4 | 7/12 | 5 | 0 | 0 |
| caveman | 3/4 | 2/4 | 2/4 | 7/12 | 5 | 0 | 0 |

### Fresh1 — medium effort, 32,768 output / 36,864 context

[Plan](../public/evidence/local-qwen/snapshots/2026-11-09-overnight/studies/gpt-oss-20b-fresh1-text-think-medium-4arm-np32768/plan.json) · [Summary](../public/evidence/local-qwen/snapshots/2026-11-09-overnight/studies/gpt-oss-20b-fresh1-text-think-medium-4arm-np32768/summary.json).

| Arm | 5×5 | 7×7 | 9×9 | Total strict | Caps | Completed incorrect | Transport errors |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| baseline | 4/4 | 3/4 | 0/4 | 7/12 | 4 | 1 | 0 |
| schema | 4/4 | 2/4 | 2/4 | 8/12 | 3 | 1 | 0 |
| neutral | 4/4 | 3/4 | 1/4 | 8/12 | 2 | 2 | 0 |
| caveman | 2/4 | 3/4 | 1/4 | 6/12 | 1 | 5 | 0 |

### Fresh1 — high effort, 65,536 output / 69,632 context

[Plan](../public/evidence/local-qwen/snapshots/2026-11-09-overnight/studies/gpt-oss-20b-fresh1-text-4arm-np65536/plan.json) · [Summary](../public/evidence/local-qwen/snapshots/2026-11-09-overnight/studies/gpt-oss-20b-fresh1-text-4arm-np65536/summary.json).

| Arm | 5×5 | 7×7 | 9×9 | Total strict | Caps | Completed incorrect | Transport errors |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| baseline | 4/4 | 3/4 | 1/4 | 8/12 | 4 | 0 | 0 |
| schema | 3/4 | 3/4 | 1/4 | 7/12 | 5 | 0 | 0 |
| neutral | 4/4 | 2/4 | 1/4 | 7/12 | 4 | 0 | 1 |
| caveman | 4/4 | 2/4 | 1/4 | 7/12 | 3 | 2 | 0 |

## What effort and budget comparisons show

Fresh1 high effort at 32k recorded **23/48 strict, 24/48 caps and 1/48 completed incorrect**. Medium effort at the same requested cap recorded **29/48 strict, 10/48 caps and 9/48 completed incorrect**. High effort at 65k recorded **29/48 strict, 16/48 caps, 2/48 completed incorrect and 1/48 transport failure**. Each condition reuses the same twelve boards and four arms; the net difference of six strict outcomes is descriptive, not six new independent boards solved.

At 32k, changing high to medium gains twelve strict outcomes and loses six prior strict outcomes. Doubling high-effort output/context gains ten strict outcomes and loses four. These studies were queued after observing the original high-effort results; later host/runner chronology differs. The medium condition changes the requested effort; the 65k condition changes both output allowance and context size. Neither establishes that lower effort or more output generally improves puzzle solving, or that Caveman reliably helps. Fresh1 Caveman strict counts are 6/12 at high32k, 6/12 at medium32k and 7/12 at high65k.

The source queue expected previously finished greedy high32k calls to reproduce at 65k. **They did not:** none of the 24 previously completed response messages are byte-identical, and none of the 47 available response pairs has an identical common thinking prefix. Requests match except for `num_predict` and `num_ctx`, with the same model digest, prompt payload, thinking effort, temperature and seed. Four previously strict calls become capped. Of the 24 prior capped calls, nine become strict, twelve cap again, two finish incorrectly and one fails transport. One more strict gain comes from the prior completed incorrect call. This is empirical variation across configurations and nights, not a verified continuation of the earlier thinking trace. Context size is a plausible contributor to changed computation; its isolated causal effect is unconfirmed.

[Original high32k plan](../public/evidence/local-qwen/snapshots/2026-11-09-overnight/studies/gpt-oss-20b-fresh1-text-4arm-np32768/plan.json) and the raw responses in the three linked study roots support board-by-board inspection. The importer independently regrades every retained attempt; conservative formatting recovery never replaces strict results.

## Fresh2 replication and unchanged Qwen panels

GPT-OSS high32k fresh2 finishes at **25/48 strict and 23/48 caps**. Its baseline/schema/neutral/Caveman strict counts are **6/12, 5/12, 7/12 and 7/12**; fresh1 is **6/12, 5/12, 6/12 and 6/12**. Report each set separately. Different board composition and four boards per size limit interpretation; this does not establish a population prompt ranking.

Qwen 27B fresh1 image remains **43/48 strict, four format-only and one cap**. Qwen 9B fresh2 image remains **43/48 strict and five caps**. Both were already fully recorded in November 6; their frozen plans, prompt/arm artifacts, images and primary receipts remain byte-identical. Later summary timestamps can change during completion checks. No additional Qwen calls or rescues were added in these final nights. Their equality in aggregate strict fraction is not equal-capability evidence: boards, budget, runtime and quantization differ. No fresh2 Qwen text condition exists at this capture, so fresh2 gpt-oss text cannot supply a matched-modality comparison with fresh2 Qwen images.

## Usage, timing and detector observations

No saved gpt-oss tariff exists in the October 30 pricing artifact. Usage below is **not a hosted bill**. Each total includes failures/caps where terminal usage exists; a subtotal with missing usage is never reported as a full condition total. Local provider fees are zero; electricity and hardware costs are unmeasured. Earlier Qwen hosted-rate scenarios remain unchanged in the [November 6 report](local-qwen-nov6.md).

| Condition | Recorded / planned | Input tokens (usage coverage) | Output tokens (usage coverage) | Recorded request hours | Median request seconds | Shadow flags / recorded | Strict escapes / flags |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| gpt-oss-20b-fresh1-text-4arm-np32768 | 48/48 | 47,464 (48/48) | 1,027,418 (48/48) | 5.811 | 598.33 | 10/48 | 1/10 |
| gpt-oss-20b-fresh2-text-4arm-np32768 | 48/48 | 47,464 (48/48) | 1,054,710 (48/48) | 6.272 | 569.72 | 16/48 | 5/16 |
| gpt-oss-20b-fresh1-text-think-medium-4arm-np32768 | 48/48 | 47,464 (48/48) | 679,139 (48/48) | 4.068 | 175.79 | 5/48 | 1/5 |
| gpt-oss-20b-fresh1-text-4arm-np65536 | 48/48 | 45,919 (47/48) | 1,518,427 (47/48) | 10.445 | 442.41 | 12/48 | 2/12 |

Request hours sum `metadata.elapsed_seconds`, including the recorded transport failure, excluding admission/placement/idle gaps and abandoned work. They are neither pure decode time nor continuous session duration. The high65k usage subtotal covers 47/48 calls; its neutral-arm total and whole-study cost are unknown even if a custom rate is entered.

The complete fresh2 gpt-oss panel has **16/48 shadow flags**, including **5/16 flagged traces that finish strictly correct**. Medium fresh1 has **5/48 flags, 1/5 strict escapes**; high65k **12/48 flags, 2/12 strict escapes**. These are descriptive counts on reused panels, not independently preregistered detector error rates. No detector actively stopped these calls. A repetition trigger is not proof a trace cannot solve the puzzle.

## Provenance and scientific limits

All frozen plans record Ollama 0.40.10. gpt-oss uses the same MXFP4 model digest and llama.cpp runtime across these conditions. Final-night receipts identify runner hash `97114c58b735a4bbc84a13ae6b78bb9351c2d657e65b3705c4be593e8ddf9d47` through the runner-version map as commit `e89d4a9dd6958c660e4efb905fc32fe17864e56b`. Older receipt null Git fields remain unchanged; later checkout HEAD is capture provenance, not a backfill for receipt-time identity.

Fresh1 and fresh2 were frozen before their corresponding local runs but after earlier local panels. They are disjoint local board sets drawn from the previously public 36-board hosted frontier panel, not globally unseen test data. Selection is deterministic by stratum. Forward/reverse arm ordering is counterbalancing, not randomized treatment assignment. Neutral prompts are approximately length-controlled but add substantive unrelated prose; thinking controls, model architectures and budgets differ across families. Greedy/sampled rounds, text/images, board sets, rescues and outcome-selected audits stay separate. No generalized causal Caveman, family, effort or budget claim follows from these small exploratory panels.

Inherited PR #16 already expanded `#/caveman-summary` to a cross-study comparison reading the shared snapshot; activation therefore also refreshes its data. Its original 4B pilot remains at `#/caveman-summary/pilot`. Updated `#/local-qwen`, its study/receipt routes and the leaderboard's completed/incomplete open-weight views include these final nights. The hosted-comparison leaderboard's old local pilot rows retain their original scope. No layout or control redesign is part of this update. PR: **TBD**.

Validation: importer hash/control/grade verification for every retained snapshot; offline unit tests; public-data scrub; frontend display contract and dated cost fixtures; board assets and build checks. Exact final command results are recorded in the worktree review artifacts.
