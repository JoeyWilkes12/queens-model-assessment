# Local open-weight Queens assessment

## Contents

- [Question and scope](#question-and-scope)
- [Frozen design](#frozen-design)
- [Runtime and controls](#runtime-and-controls)
- [Conditional Caveman comparison](#conditional-caveman-comparison)
- [Completed results](#completed-results)
- [Receipts and grading](#receipts-and-grading)
- [Host conditions and future runs](#host-conditions-and-future-runs)
- [Reproduction](#reproduction)
- [Interpretation limits](#interpretation-limits)
- [Sources](#sources)

## Question and scope

Can the installed `qwen3.5:4b` solve regional Queens boards without tools? This exploratory local pilot extends the assessment with an open-weight model; it does not add its denominator to historical hosted-model panels. The [frozen plan](../public/evidence/ollama/plan.json) was written before the first model response. The [derived summary](../public/evidence/ollama/summary.json) is the authoritative result table.

## Frozen design

Twelve existing boards are selected from the frozen October 16 frontier image panel: one board per size (5, 7 and 9) × singleton status (present/absent) × search tier (lower/higher). Within each stratum, selection uses the lexicographically first existing board ID. It does not use prior model outcomes. The order is stratum then size, interleaving 5, 7 and 9.

Each board receives one fresh one-shot request per treatment, with no tools, hints, feedback, retries or shared chat history. The exact historical [prompt template](../public/evidence/ollama/prompt-template.txt) and image renderer are reused; generated image hashes match the saved historical image hashes for all twelve boards. No answer key, solver output, corpus metadata or grading result is supplied to the model.

Primary outcome is strict JSON and all four regional Queens rules. The existing [deterministic grader](../scripts/llm_panel/grading.py) separately checks a uniquely extracted JSON object as a post-hoc format diagnostic. That diagnostic is not added to strict accuracy. These rules allow long diagonals and prohibit only touching queens in adjacent rows, unlike ordinary chess N-queens.

## Runtime and controls

The loopback endpoint reports Ollama-compatible server version `0.40.10`, model name `qwen3.5:4b`, digest `7f3251fa6878a78a606bcb3c074283306e5ad2ea411a7774a9dd98a4bc7f2d13`, a 4.5B parameter model, NVFP4 quantization and an MLX runner. This is the installed endpoint's reported identity, not a separate verification of downloaded weights or upstream publisher identity. The installed model is the only model used; no models are pulled and no paid inference service is invoked.

The completed requests used local `/api/chat`, `think=true`, `num_predict=12288`, `num_ctx=32768`, `keep_alive="10m"`, `temperature=0`, seed `20261028`, and a configured 600-second socket/network timeout. This timeout is not proof of backend cancellation or a hard total deadline. The final-answer field is graded independently of the returned thinking field. No schema-constrained decoding or `format=json` is imposed. Resumed invocations validate the full frozen runtime snapshot, including server version, runner, architecture, model metadata, capabilities, thinking controls and reported defaults. Each hardened invocation saves its actual start snapshot under `public/evidence/ollama/invocations/`; any drift rejects new inference. The initial baseline process began before this hardening and checked model digest only. The [runtime audit](../public/evidence/ollama/runtime-audit.json) preserves a mid-run snapshot and an offline completion review; no post-run API snapshot was collected, and continuous runtime identity is not claimed.

The 12,288-token output allowance was inherited from the [historical frontier image protocol](frontier-image-panel-preregistration.md), whose runner defines the same `MAX_TOKENS` value. It is a chosen evaluation budget, not this model's maximum capability or a throttle threshold. The local boolean thinking control still differs from the historical hosted-model effort settings.

The client deliberately used one blocking request at a time. All 24 receipt intervals are non-overlapping. The local server startup log records `OLLAMA_NUM_PARALLEL=1`; that historical setting is not a continuous attestation of other clients. No retries or observed timeouts occurred. All requests returned HTTP 200, and the longest elapsed time was 213.20 seconds. Future code stops after an uncertain client-side transport exception rather than assuming generation was cancelled and proceeding to another request.

The pinned request records what was requested; compatible servers may interpret sampling controls differently. `/api/show` supports boolean thinking rather than the historical hosted providers' high-effort setting.

Wall-clock time includes local queueing, loading and generation. Reported token counts and durations are preserved, but are not a controlled speed benchmark. Provider fees are zero; electricity, hardware amortization and total local operating costs are unmeasured. Zero provider fees do not mean zero total cost.

## Conditional Caveman comparison

The Caveman arm is enabled only after at least one baseline board at size 5 or larger is strictly correct or uniquely extracted and rule-valid, and after the exact skill has completed the required security review. A failed baseline gate leaves the skill arm unrun; that is not evidence that Caveman failed.

When enabled, the comparison uses the same twelve boards, settings and grader, once each. The reviewed `SKILL.md` body is inserted as a system instruction in a fresh chat. This is a prompt-level application of the skill, with no global plugin installation, hooks, script execution, tool access or persistence. The exact artifact commit, artifact hash, applied system-message hash and review reference are recorded in `public/evidence/ollama/skill.json`; the exact applied text is saved as `caveman-system.txt`.

All baseline calls precede the skill calls. This is exploratory **n=4 boards per size**, with one run per board/condition. It cannot establish a reliable causal benefit, token-saving rate or general capability claim. Every baseline request reported **853 input tokens**, versus **1,984** with Caveman: 1,131 additional input tokens per request. Prompt length, run order, accumulated prefix cache and changing host memory conditions are confounds. A shorter generated answer does not establish a net token saving.

## Completed results

The detached panel process continued after the agent session reached its usage limit. The final receipt completed at **2026-10-28 18:47:34 UTC (12:47:34 MDT)**; the summary was saved at 18:47:34.729445 UTC. All 24 receipts are present and pass the complete offline verifier.

| Condition / size | Strict correct | Valid after extraction, including strict | Budget-limited |
| --- | ---: | ---: | ---: |
| Baseline 5×5 | 1/4 | 2/4 | 2 |
| Baseline 7×7 | 0/4 | 1/4 | 3 |
| Baseline 9×9 | 0/4 | 0/4 | 4 |
| Caveman 5×5 | 3/4 | 3/4 | 1 |
| Caveman 7×7 | 2/4 | 2/4 | 2 |
| Caveman 9×9 | 0/4 | 0/4 | 4 |

All **16 budget-limited** responses have `finish_reason="length"`, exactly 12,288 reported generated tokens, and no final-answer content. They are unfinished attempts within this budget, not invalid completed placements or throttling responses. The other eight responses stopped normally and contained valid placements. These descriptive differences do not establish that Caveman caused better solving.

## Receipts and grading

The website's `#/caveman-summary` page reports the paired results, including the baseline-only valid `panel-7-01` counterexample, total usage and elapsed time, and the exploratory limits. `#/local-open-models/receipt/<call_id>` exposes each call with reciprocal baseline/Caveman navigation and original artifacts; `#/local-open-models/configuration` is the common model-configuration destination.

`comparisons.json` is a derived index, not a new experiment or a change to the frozen plan. It binds all twelve board pairs to matching model tags and weight digests, exact user messages and image bytes, and the same requested generation controls. The Caveman request adds exactly the reviewed system message. Full request hashes therefore differ. Configuration and user-message hashes use the historical receipt convention, SHA-256 of UTF-8 `json.dumps(value, sort_keys=True)`; plan, system and image hashes cover exact file bytes. The configuration hash includes every top-level request field except `messages`.

Regenerate only the derived index with `python3 scripts/ollama/comparisons.py`. `npm run ollama:verify` now verifies the original 24 receipts and checks that this pair index matches their raw evidence without writing files or contacting Ollama. Mutation tests reject mismatched controls, user/system messages, model identities, image bytes, missing calls, stale indexes and tampered hashes. The historical plan, summary and all original receipt files remain unchanged.

Each recorded call has a directory under `public/evidence/ollama/receipts/` containing:

- `request.json`: exact model request, including prompt and base64 input image;
- `response.json`: returned local-model response data, including any separate thinking field; local transport exceptions instead have an explicit synthetic error record;
- `metadata.json`: runtime, identity, request/response/image hashes, status, finish reason, timing and reported token counts;
- `grade.json`: strict format and rule validation;
- `diagnostic.json`: uniquely extracted object checks, separate from strict accuracy;
- `started.json`: request start marker that prevents accidental automatic retry after an uncertain interruption.

Scheduled calls, recorded calls, HTTP completions, strict solves, format-only solves, truncations, transport errors and unattempted calls remain distinct. The summary preserves all four scheduled boards in each size/treatment cell. The website reports correctness among recorded calls and displays recorded/planned counts alongside it; started-but-unrecorded calls are excluded from that correctness denominator and remain visible separately. A transport error is not a claim that the model attempted and failed to solve the puzzle. Request and response hashes use sorted-key Python JSON serialization encoded as UTF-8; image hashes use the exact PNG bytes. A returned model-name mismatch blocks grading and stops the run. Started but interrupted calls are preserved and require manual disposition before any repeat.

## Host conditions and future runs

The user reported that held MLX memory grew from approximately **4.15 to 11.9 GiB**, macOS pressure reached **Warning**, and swap grew from about **5 to 18.5 GiB** across this batch. The separate workflow's local operating-practices note corroborates rounded figures and attributes growth to retained prefix cache. The runtime audit labels these as aggregate, retrospectively supplied host observations. The original receipts have no per-call host snapshots; none have been fabricated or backfilled.

For newly frozen studies, use **`num_ctx=16384` and `keep_alive=0`** by default. The longer observed input plus output allowance is 1,984 + 12,288 = 14,272 tokens, leaving headroom within 16,384. Unloading after each call bounds retained-cache residency; it also changes loading/cache conditions and latency. It does not prove the first request was cold. The historical 32k/10m requests and frozen plan remain unchanged. New settings require a new study ID/output directory, and must not be mixed into this cohort. See the [Ollama keep-alive API](https://docs.ollama.com/api/chat) and [context configuration](https://docs.ollama.com/faq#how-can-i-specify-the-context-window-size).

Future receipts capture numeric host memory and pressure before and after each call; unavailable values remain explicit. The optional `--journal PATH` adapter records only bounded model/run labels, timestamps, status, generation parameters and allowlisted numeric usage. It contains no prompt, output, credentials, private paths or per-request label. Journal errors must not erase receipts or trigger inference retries. Existing historical calls are not silently replayed into a live dashboard journal.

The persistent Grafana benchmark journal contained no matching 4b records for this panel's interval when checked read-only during completion review. Journal integration is opt-in and is tested only with temporary files. It does not reconfigure collectors, dashboards or services.

Respect the active workflow's endpoint ownership: one request and one model at a time, and no unloading a model another workflow owns. For this handoff, no requests to port 11434, including metadata or unload requests, are authorized before **29 October 2026 at 09:00 MDT**. Offline tests and receipt verification do not contact Ollama. No server environment, Docker service or GPU memory setting was changed.

## Reproduction

The completed study can be audited entirely offline:

```sh
npm run ollama:test
npm run ollama:verify
```

The verifier independently checks frozen prompt/options/roles/system text/image bytes, model identities, receipt hashes, regraded answers, summary rows, per-size denominators and conditional gate. `ollama:verify` includes `--require-complete`, which rejects a partial publication. Tests use temporary journals and mocked host/API functions. Neither command contacts Ollama or writes to the live Grafana journal.

For a separately authorized future study, after the endpoint is free and the embargo has expired, `freeze` requires both a distinct `--study-id` and a separate `--output-dir`. It refuses to overwrite the historical plan. For example, the following commands would contact the model service and must not be run during the current embargo:

```sh
python3 scripts/ollama/panel.py freeze \
  --study-id local-qwen-16k-unload-pilot --output-dir output/local-qwen-16k-unload-pilot
python3 scripts/ollama/panel.py run --treatment baseline \
  --output-dir output/local-qwen-16k-unload-pilot \
  --journal "$HOME/Library/Application Support/local-previews/grafana-local-hardware/data/benchmark.jsonl"
```

The journal argument is optional. Future host snapshots are written as `host.json` in the selected study's receipt directories; optional journal append status is saved separately as `journal.json`. The fixed dashboard run labels are `queens-baseline` and `queens-caveman`; output paths and board IDs are never metric labels. Append failure leaves the model receipt intact and never retries inference. Special-file paths and busy journal locks fail without blocking generation progress. Malformed or missing native usage produces a journal measurement-error event without invented zeroes; this is separate from puzzle correctness and the preserved HTTP receipt.

On an uncertain client transport exception, the runner saves available evidence and stops before another request. That refusal persists across later invocations and treatment switches: saved client failures (`http_status=null`) and started-only markers in either arm are checked before any metadata query, host collection, or journal operation. There is no automatic acknowledgement or retry bypass. An operator must investigate the backend and explicitly decide a later study's disposition; immutable failed receipts must not be edited to bypass the guard. A fully completed study returns before any service or telemetry operation and does not backfill the journal.

The future Caveman arm still requires baseline success and the separately reviewed, pinned `skill.json` and hash-matching `caveman-system.txt`; do not manufacture an approval record. `summarize` rebuilds a derived table and does not itself verify it. The original summary timestamp and all original receipts are preserved by this completion review.

## Interpretation limits

The boards and identified solutions are already public in the assessment. Prior exposure or contamination cannot be excluded; this is not a secret held-out capability test.

Four boards per size are sufficient to show individual successes or failures, not a population accuracy estimate with useful precision. The sample overlaps historical boards and is not newly held-out. The installed local backend, quantization, boolean thinking, generation controls and hardware differ from historical providers. Comparisons are descriptive and remain outside the existing confirmatory scoreboards.

## Sources

- [Ollama chat API](https://docs.ollama.com/api/chat): request format, completion metadata and generation controls.
- [Ollama thinking](https://docs.ollama.com/capabilities/thinking): model-specific control discovery and separate thinking/final-answer fields.
- [Historical frontier image preregistration](frontier-image-panel-preregistration.md): earlier image protocol and source panel.
- [Caveman source](https://github.com/juliusbrussee/caveman): candidate conditional prompt treatment; use only the reviewed pinned artifact.
