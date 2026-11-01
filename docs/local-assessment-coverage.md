# Local assessment coverage audit

Audit date: 2026-11-01. This report is an offline inventory and scientific review; it makes no inference requests and changes no live runner, study, service or frozen evidence.

## Evidence boundary

The canonical read-only source is the `ollama-bigger-qwen` benchmark checkout, branch `claude/ollama-bigger-qwen`, observed HEAD `590d66611cdbe791dbbc115d926bf2c944d30b30`. Paths beginning `source:` below resolve against that checkout. The website comparison baseline is `public/evidence/local-qwen/snapshots/2026-10-31-overnight/catalog.json`, selected by the index at the start of this audit: captured `2026-10-31T15:56:27.919659+00:00`, source commit `428c3ebe57ff0ca88682f4413ca42b32a5928b23`, source dirty flag true. This is a dated coverage baseline, not a claim that later publication work has not added these studies.

The inventory found **17 assessment plan/summary roots, 407 primary receipts and 33 separate rescue receipts**. Strict grading was independently recomputed from every primary response and its frozen board using `scripts/llm_panel/grading.py`: **407/407 agree with stored grade.json**, with no inference or evidence writes. This check establishes strict-grade consistency, not complete request/hash/provenance verification. The publication importer must perform that fuller chain verification.

The old website snapshot has **11 study entries and 225 primary receipts**. Its missing coverage is **six study roots / 182 primary receipts**: 174 fresh1 calls plus eight original-budget calls. Existing published studies have no additional primary receipts at this audit point. Rescue receipts are separate outcomes, never added to primary solve denominators. Counts below count metadata-complete receipts; no started-only receipt was found in these study roots.

## Every assessment root

All entries except the pilot are under `source:public/evidence/ollama-models/`. The pilot is `source:public/evidence/ollama/`. “Planned” uses audit_calls for targeted audits, not the 24-row inherited summary scaffold. Counts are descriptive inventory, not a pooled accuracy score.

| Source root | Recorded / planned | Strict | Status / old website coverage |
| --- | ---: | ---: | --- |
| `ollama/` (4B pilot) | 24/24 | 6 | Complete; present |
| `qwen3.5-9b-nvfp4` | 6/24 | 3 | Original 12,288-token condition stopped early; absent |
| `qwen3.5-27b-q4_K_M` | 2/24 | 2 | Original 12,288-token condition stopped early; absent |
| `qwen3.5-9b-nvfp4-np24576` | 24/24 | 18 | Complete; present |
| `qwen3.5-27b-q4_K_M-np24576` | 24/24 | 24 | Complete; present |
| `qwen3.5-9b-nvfp4-np24576-qwen-sampling-r1` | 24/24 | 15 | Complete; present |
| `qwen3.5-27b-q4_K_M-np24576-qwen-sampling-r1` | 24/24 | 21 | Complete; present |
| `qwen3.5-9b-nvfp4-np24576-qwen-sampling-r2` | 24/24 | 18 | Complete; present |
| `qwen3.5-27b-q4_K_M-np24576-qwen-sampling-r2` | 22/24 | 16 | Partial; present at same count |
| `qwen3.5-4b-np32768-loopstop` | 24/24 | 13 | Complete, censored; present |
| `qwen3.5-9b-nvfp4-np32768-loopstop` | 24/24 | 19 | Complete, censored; present |
| `qwen3.5-4b-np32768-loopstop-audit` | 6/6 | 0 | Targeted audit complete; present |
| `qwen3.5-9b-nvfp4-np32768-loopstop-audit` | 5/5 | 1 | Targeted audit complete; present |
| `gemma4-e4b-fresh1-4arm-np32768` | 48/48 | 10 | Complete; absent |
| `llava-llama3-8b-fresh1-4arm-np4096` | 48/48 | 0 | Complete; absent |
| `qwen3.5-9b-nvfp4-fresh1-4arm-np32768` | 48/48 | 38 | Complete; absent |
| `qwen3.5-4b-fresh1-4arm-np32768` | 30/48 | 13 | Partial; absent |

The frozen assessment plans schedule 467 eligible primary calls in total. Sixty are unrecorded: 40 in the abandoned original-budget conditions, two in 27B sampling r2, and 18 in fresh1 4B. “Abandoned” here means the original-budget conditions were replaced in the running study sequence by separately frozen 24,576-token conditions, not that their receipts or planned denominators should disappear.

The Qwen 4B fresh1 source supports **13/30**, not 13/33: 30 metadata receipts match the 30 recorded summary rows exactly. Its last completed receipt is `2026-11-01T15:54:16.389643+00:00`. Preserve this capture boundary; refresh with a new snapshot if further receipts arrive.

Rescue inventory: original 9B 3; 9B 24k greedy 6; 9B sampling r1 5; 9B sampling r2 6; 4B active-loop-stop 8; 9B active-loop-stop 5. These sum to 33; no fresh1 study has rescues. Eight original-budget primary calls and their three rescues merit historical coverage even though they are not completed capability panels.

## Fresh1 arm × size matrix

Each cell is strict correct / recorded. Every cell plans four boards. Thus Qwen 4B denominators below are incomplete and not directly comparable to the complete models' fractions.

| Model | Arm | 5×5 | 7×7 | 9×9 | Total |
| --- | --- | ---: | ---: | ---: | ---: |
| Gemma 4 E4B | baseline | 3/4 | 1/4 | 0/4 | 4/12 |
| Gemma 4 E4B | schema | 3/4 | 1/4 | 0/4 | 4/12 |
| Gemma 4 E4B | neutral | 2/4 | 0/4 | 0/4 | 2/12 |
| Gemma 4 E4B | caveman | 0/4 | 0/4 | 0/4 | 0/12 |
| LLaVA-Llama3 8B | baseline | 0/4 | 0/4 | 0/4 | 0/12 |
| LLaVA-Llama3 8B | schema | 0/4 | 0/4 | 0/4 | 0/12 |
| LLaVA-Llama3 8B | neutral | 0/4 | 0/4 | 0/4 | 0/12 |
| LLaVA-Llama3 8B | caveman | 0/4 | 0/4 | 0/4 | 0/12 |
| Qwen 9B | baseline | 4/4 | 4/4 | 1/4 | 9/12 |
| Qwen 9B | schema | 4/4 | 3/4 | 3/4 | 10/12 |
| Qwen 9B | neutral | 4/4 | 3/4 | 2/4 | 9/12 |
| Qwen 9B | caveman | 4/4 | 3/4 | 3/4 | 10/12 |
| Qwen 4B, partial | baseline | 2/3 | 1/2 | 1/2 | 4/7 |
| Qwen 4B, partial | schema | 2/3 | 0/2 | 0/2 | 2/7 |
| Qwen 4B, partial | neutral | 1/3 | 1/3 | 1/2 | 3/8 |
| Qwen 4B, partial | caveman | 2/3 | 1/3 | 1/2 | 4/8 |

Gemma's remaining 38 calls are completed rule-invalid placements, with no truncation or format-only solves. LLaVA has 48 incorrect calls: 40 schema-valid rule violations, four schema failures and four invalid-JSON failures. Its recorded outputs are only 23–40 tokens, all far below the 4,096 cap. Qwen 9B has 38 strict solves and ten truncations. Qwen 4B has 13 strict, four format-only and 13 truncations among 30 recorded calls; the other 18 are unrecorded, not failed attempts.

Surprising receipts were inspected directly, in addition to the exhaustive strict regrade:

- Gemma `receipts/caveman_panel-5-28/response.json` returns `[2,4,2,5,3]`: duplicate column 2; the stored column-rule failure is correct. All 12 Caveman failures are completed rule violations, not missing answers.
- LLaVA `receipts/baseline_panel-5-28/response.json` returns `[1,2,3,4]` for a size-five board: the schema failure is correct. Its 40 rule-invalid schema-valid answers violate both region uniqueness and non-touching constraints; zero strict is not simply a JSON-parser artifact.
- Qwen 9B fresh1 `receipts/schema_panel-9-30/response.json` returns `[4,6,9,2,5,1,8,3,7]`, satisfying all four rules at 10,071 output tokens.
- Qwen 9B loop-stop audit `receipts/caveman_panel-7-50/response.json` returns `[4,7,5,3,1,6,2]`, satisfying all rules at 29,094 tokens. Its source call was actively stopped; the audit has matching-prefix and answered-after-stop evidence. Active stopping changed a measured outcome.

## Scientific completeness and limits

**Fresh relative to the local pilot, not secret held-out data.** `source:public/evidence/ollama-models/fresh1-boards.json` was frozen at `2026-10-31T21:30:31.477347+00:00`. Selection is the lexicographically first board per size × singleton × search-tier stratum in the existing frontier-image-panel, excluding the twelve pilot boards. The twelve selected IDs are `panel-5-28`, `panel-7-06`, `panel-9-30`, `panel-5-32`, `panel-7-02`, `panel-9-33`, `panel-5-11`, `panel-7-34`, `panel-9-24`, `panel-5-43`, `panel-7-61`, `panel-9-45`. These already belong to the public hosted frontier panel. The artifact's phrase “before any model saw these boards” cannot establish global nonexposure; describe local fresh1 selection and its timestamp precisely. Selection is deterministic and stratified, not randomized.

**Counterbalancing is deterministic.** Fresh1 plans order arms baseline/schema/neutral/caveman for even board index and reverse them for odd index. This is the implemented ABBA-style order rule, not random assignment. Each board has one observation per arm/model; four boards per size do not support broad population or family-level capability claims. The incomplete 4B run overrepresents the earlier strata and has unequal arm denominators.

**Neutral is approximately, not exactly, length-matched.** Recorded total input tokens are:

| Model | Baseline | Schema | Neutral | Caveman | Neutral shortfall |
| --- | ---: | ---: | ---: | ---: | ---: |
| Qwen 4B / 9B | 853 | 911 | 1,914 | 1,984 | 70 |
| Gemma 4 E4B | 550 | 606 | 1,587 | 1,660 | 73 |
| LLaVA-Llama3 | 844 | 902 | 1,896 | 1,942 | 46 |

The neutral system file has 5,007 characters / 885 words versus Caveman's 4,431 / 707, illustrating why character or word counts cannot establish token equality across families. Neutral also adds a substantive harbor-town passage; semantic distraction is an additional treatment feature. Schema changes instruction content and length. These four arms improve description but do not fully isolate a pure terse-style effect. Claims of Caveman causing a benefit/harm require a more tightly controlled design and replication.

**Models differ beyond parameter count.** Fresh1 pins Ollama 0.40.10, greedy temperature zero, seed 20261028, fresh loads (`keep_alive: 0`), shared image boards, no tools/retries/rescues, and shadow-only loop detection. Gemma and Qwen request boolean thinking; LLaVA has no thinking mode and a 4,096-token budget / 8,192 context, versus 32,768 / 36,864 for the others. Gemma is tagged E4B but runtime reports 8.1B parameters. Quantization, architecture, vision encoder, tokenizer and backend differ; describe measured model configurations, not controlled parameter-size or family effects. Requested controls alone do not prove every server behavior.

**Historical conditions must stay separate.** The 4B pilot used a warm 10-minute keep-alive cache, all baseline calls before Caveman, and a 12,288-token cap. Its replay diverged from a cold-load run. Later greedy studies, sampled seeds, budget changes, active loop-stop, targeted audits, rescues, modality changes and format-constrained decoding answer distinct questions. Do not pool them or treat the audit as an independent random panel. Active-loop-stop strict bounds are baseline 7–7/12 and Caveman 6–12/12 for 4B; baseline 11–12/12 and Caveman 8–12/12 for 9B, with censored counts shown explicitly. The complete targeted audit proves one escape among eleven stopped calls, not a held-out detector validation. Fresh1 shadow flags appear in seven 4B and four 9B receipts; none actively terminated a call. Of the four fresh1 9B shadow flags, Caveman on `panel-9-24` still finished strictly correct at 26,779 output tokens; the other three capped. All seven flagged 4B calls capped. This is a second observed premature-trigger example on a new local panel, without an active cancellation or rerun transport change. It remains a small descriptive panel, not a population false-positive rate.

**Provenance remains incomplete at the Git layer.** Fresh1 receipts preserve runner/panel/lock/detector hashes, but the latest session and inspected fresh1 receipt report null runner git_commit and git_branch despite scripts_uncommitted=false. That boolean is not proof of a clean attributable source revision. Preserve the hashes and nulls; do not backfill a guessed commit. Source HEAD is a capture-time checkout fact, distinct from receipt-time provenance.

## What is pending, and whether r3 was superseded

The latest source session, `public/evidence/ollama-models/sessions/20261031T230005.json`, runs from local `2026-10-31T23:00:05` to `2026-11-01T08:55:38`. It records 27B sampling r2 `memory_gate`, the first three fresh1 studies complete, and 4B fresh1 `deadline`. Its args retain `explore_rounds: 3`. The two missing r2 calls are baseline/Caveman on `panel-9-34`.

**Sampling r3 has not been superseded in the inspected design.** Neither model has an r3 plan/summary root. `source:scripts/ollama/overnight.py` completes round k for both models before starting k+1; the incomplete 27B r2 therefore blocks r3. The committed launchd plist still specifies `--explore-rounds 3`, and `docs/ollama-next-studies.md` explicitly says finish r2 then r3. Fresh1 is an additional queue, not evidence of formal cancellation. Report r3 as planned/unstarted; do not invent missing results or claim completion. The old night-by-night estimates in that document are proposals, not the observed schedule.

`source:scripts/ollama/queue.json` has four further unstarted conditions without frozen study roots: gpt-oss 20B text four-arm (48 calls, high reasoning), Qwen 9B text four-arm (48), Qwen 9B constrained-JSON baseline/Caveman (24), and Qwen 27B fresh1 image four-arm (48, 24,576-token cap). Those 168 queued calls plus 48 contemplated r3 calls are not part of the 467 already-frozen eligible calls. No fresh2 board-set artifact was found. Do not label a queued configuration a frozen completed assessment.

## Probes and operational records are not assessment panels

All eight `source:public/evidence/ollama-models/selftests/*-probe-*/probe.json` roots were inventoried separately: Gemma E4B, Llama3.2-Vision11B, LLaVA7B, LLaVA-Llama3 8B, three Qwen9B setting probes, and gpt-oss20B. They contain 16 short probe calls total; Llama3.2-Vision records zero calls and three failed load attempts. Probe `ok` means operational support, not puzzle success. Only the longer constrained-format Qwen probe and one gpt-oss probe report strict successes. These use pilot board `panel-5-18` and varying short budgets; they must not inflate model assessment denominators.

`parallel-probe/result-qwen3.5-4b-p2.json` and its server log test runtime concurrency, not Queens capability. Other selftests replay receipts or test detector/runner behavior. Sessions, loop-audit.json, host samples and logs document operation and censorship. Publish concise coverage/status links where useful, but keep these categories outside assessment accuracy tables. Llama3.2-Vision's load failure is runtime incompatibility, not a zero-solving score; gpt-oss and LLaVA7B probe results are not completed local model assessments.

## Recommended stacked follow-ups and acceptance criteria

1. **Publish the complete current inventory.** Include all six missing roots, show four-arm navigation and per-size recorded/planned denominators, distinguish earlier partial original-budget studies from the fresh1 panels, and preserve all historic snapshots. Acceptance: snapshot/import verification covers all 407 primary receipts and 33 rescues; stricter publication checks reconcile source hashes, exact request controls, frozen boards, grades, counts and safe public provenance. Do not silently turn 13/30 into 13/48 or 13/33.
2. **Finish authorized frozen conditions before new efficacy claims.** Refresh 4B only after the remaining 18 receipts exist; finish the two 27B r2 calls through the approved nightly owner when its gates allow. Preserve r3's current unstarted status unless the owner explicitly revises the queue. Acceptance: immutable per-study plans, paired completion or clearly documented missingness, no merging partial arms or changing frozen settings.
3. **Run and report modality/format controls separately.** Complete the queued text reference with gpt-oss before comparing image and text performance. Treat constrained JSON as a separate treatment that may affect reasoning as well as syntax; verify requests actually include the frozen schema. Acceptance: same board IDs, prompt representation pinned, matched relevant controls, format-only versus strict outcomes, no cross-modality leaderboard pooling.
4. **Freeze a replication design before examining new outcomes.** Use a new board set disjoint from both pilot and fresh1; state whether it also excludes all public hosted panels. Predeclare outcomes and analysis, arm order or randomization, sample size rationale, seed schedule for sampling, and model-specific token-matched neutral instructions with recorded realized lengths. Acceptance: frozen selection and hashes precede relevant local model exposure, assignment described truthfully, paired board-level uncertainty reported, no unsupported secret-heldout claim.
5. **Validate loop stopping without changing outcomes.** Retain shadow mode, predeclare detector thresholds and false-positive/escape criteria on independent traces, then audit all shadow triggers plus an outcome-independent comparison sample. Acceptance: per-arm trigger rates, observed escapes, saved-token estimates separated from capability, no active-stop rollout based only on the already-inspected eleven-call audit.
6. **Repair source-run provenance in a separate runner change.** Preserve existing receipt nulls; have future sessions record a verified source commit or explicit failure/unknown state alongside the exact executable hashes. Acceptance: offline tests for unavailable Git metadata and an attributable new session; no edits to historical receipts or operational service changes as part of this website report.

The evidence supports a more complete descriptive local assessment now. Strong claims about generalized solving, prompt causality, model families or validated loop-stop safety remain beyond these small, reused-board studies.
