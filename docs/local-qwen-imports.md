# Updating local open-weight assessments

The `#/local-qwen` chapter reads `public/evidence/local-qwen/index.json`.
It never contacts Ollama or polls the overnight runner. The index identifies an
immutable dated snapshot and embeds derived display rows; raw artifacts load
when a receipt is inspected. The original 4B routes remain available.

## Import a later night

Run in this website checkout, using the authoritative benchmark checkout as a
read-only source. This command does not start, resume or validate a live model:

```bash
python3 -B scripts/ollama/import_studies.py \
  --source-root /path/to/ollama-bigger-qwen \
  --snapshot-id YYYY-MM-DD-overnight
npm run ollama:test
npm run ollama:verify
npm run evidence:check-public
npm run build
```

Choose a new unique snapshot ID. Existing snapshots cannot be overwritten.
The importer refuses a source whose allowlisted inventory or bytes change during
capture; retry after the source is stable. Prepared studies remain pending, not
failures. Partial studies retain planned rows and separate recorded denominators.
Comparative arm costs and break-even ratios are withheld until both recorded
arms cover the same boards. Sampling rounds never pool with greedy runs.

Supported discovery covers the 4B pilot, 9B/27B 24,576-token studies and numbered
sampling rounds, and separately identified 4B/9B 32,768-token loop-stop studies.
Schema 3 also includes the original, partial 9B and 27B 12,288-token studies and
four explicitly reviewed fresh1 image conditions: Gemma 4 E4B, LLaVA-Llama3,
Qwen 4B and Qwen 9B. Those studies retain all four frozen arms (`baseline`,
`schema`, `neutral`, `caveman`), the board-set identity and shadow-detector mode.
Per-board links connect every arm through the same frozen configuration; only
baseline/Caveman pairs acquire that two-arm pair verification. A schema-reminder
prompt is not constrained JSON. Neutral control inputs are not token matched to
Caveman. Unknown frozen study names cause import failure, rather than silently
missing future assessment types. New models, text inputs or constrained output
require a reviewed importer extension before their results can be published.

Schema 2 additionally imports their separately frozen `-loopstop-audit` reruns.
Only `audit_calls` enter the derived audit population; unselected `not_run` slots
remain in the original copied summary but are excluded, not pending, in the UI.
The importer verifies the selected set against the original loop-stopped set,
retains source linkage, and independently compares the entire observed thinking
prefix. Audit results never overwrite original grades or fill canceled usage.
All retained schema-1, schema-2 and schema-3 snapshots are verified in place, without
rewriting historical catalogs.

The importer checks frozen prompts/images/settings, request and response hashes,
model identity, strict/extraction grades, and rescue source linkage. A separately
derived conservative formatting diagnostic never changes the original grade.
Canceled streams preserve null token counts. Only numeric host summaries are
derived; machine logs, sessions, locks and raw host reports are excluded. Plans,
requests, responses and grades are copied byte for byte. Public scrubbing checks
the copies without rewriting them.

## Prices and interpretation

`public/evidence/local-qwen-pricing.json` is a separate dated public OpenRouter
catalog extract. New receipts do not silently refresh tariffs. Preserve raw
USD/token strings, normalized USD/million values, capture time, catalog hash,
provider assumptions and the absence of an exact 4B listing when reviewing prices.
The catalog itself is not retained; its digest cannot reconstruct its contents.

The scenario prices each study's reported local usage. Hosted providers may use
different quantization, tokenization, runtime and image accounting. Generated
thinking counts once as output. Rescues include the full replay input.
Unsuccessful and capped attempts remain in spend denominators. Missing usage
produces an unknown total. Cost per strict success divides all selected recorded
attempt spend by strict successes; zero successes leave it undefined. Combined
rescue outcomes stay distinct from one-shot success. Pending calls are not billed
or forecast. Local power and hardware cost remain unmeasured.

See [results and stopping-policy interpretation](local-qwen-methods.md) and
[financial estimates](local-qwen-costs.md). Repeated use of the same 12 boards
does not increase the number of independent board samples.

The November 1 coverage inventory includes every current frozen assessment plan;
operational probes, selftests and sessions are excluded from accuracy denominators.
The separate queue contains unstarted text, constrained-JSON and 27B fresh-board
conditions. They are described as queued work, without invented plans or receipts.
See [coverage and completion requirements](local-assessment-coverage.md).
