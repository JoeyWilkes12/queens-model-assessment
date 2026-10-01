# Queens representation diagnostics — bounded completion protocol

## Contents

- [Question and completion criterion](#question-and-completion-criterion)
- [Frozen cohort and treatments](#frozen-cohort-and-treatments)
- [One-shot versus multiple attempts](#one-shot-versus-multiple-attempts)
- [Controls and schedule](#controls-and-schedule)
- [Judging and interpretation](#judging-and-interpretation)
- [Budget and safety](#budget-and-safety)
- [Evidence and publication](#evidence-and-publication)

## Question and completion criterion

On October 1, 2026 the user authorized an **additional $5 maximum** and clarified that “complete” means a scientifically sound evaluation plan, not an exhaustive inventory of models. This stage completes a controlled representation diagnostic for every mathematically unsuccessful model/board pair observed in the [preceding study](earlier-generations-REPORT.md). It does not fill the unused model ladder, sweep reasoning effort, or claim a general model failure threshold.

Completion means all **36 preregistered fresh requests** have an auditable terminal outcome, deterministic grades, reconciled charges, independent validation, and published receipts and assessment. An unresolved transport or governance problem prevents an unqualified completion claim. Models' wrong answers and cap-limited outputs are valid experimental outcomes, not grounds for substituting a trial.

## Frozen cohort and treatments

Selection uses the preceding study's delivered mathematical outcome, not strict formatting alone. Freeze these six failed model/board pairs before new inference:

| Family | Exact model | Board | Previously observed failure |
|---|---|---|---|
| GPT | `openai/gpt-4.1` | 5×5 | Rule-invalid placement |
| GPT | `openai/gpt-4.1` | 7×7 | Rule-invalid placement |
| GPT | `openai/gpt-4.1` | 9×9 | Rule-invalid placement |
| Claude | `anthropic/claude-sonnet-4` | 9×9 | Rule-invalid placement |
| Gemini | `google/gemini-2.5-flash` | 5×5 | No usable final JSON within completion cap |
| Gemini | `google/gemini-2.5-flash` | 7×7 | No usable final JSON within completion cap |

For every pair run **three representations × two independent fresh requests**:

1. Original image: exact original pilot messages and PNG bytes, including rules and written JSON contract.
2. Region matrix: complete unsolved board partition as `region_grid_rows`, faithfully adapted from the locally saved Jev construction material.
3. Region cell lists: the identical partition as a JSON object mapping each region to all its one-based `[row,column]` member cells.

All boards have independently established unique solutions. Validate the matrix and cell-list partitions against the original boards, including region membership, complete coverage, orientation, and region-label equivalence. No candidate menus, solver code, computed constraints, correct givens, worked solutions, answer keys, or prior model outputs enter any request. Save source paths and hashes locally; publish safe provenance.

The preceding study's two text diagnostics remain exploratory historical observations. They do **not** substitute for new repetitions or enter this matched 36-trial denominator. A failed-cell-selected cohort is not representative of all boards or models.

## One-shot versus multiple attempts

Each trial is **O1**: one request in a fresh conversation, one visible final response, no tools, retry, feedback, correction, or agent execution. Two fresh repetitions estimate limited repeatability of a one-shot configuration; they are **not** a two-attempt solving session. There is no best-of-two success metric. Publish both outcomes independently as 0/2, 1/2, or 2/2 per configuration.

The broader specification's multiple-attempt conditions (fixed attempt allowance, cumulative cost/time, and explicitly controlled feedback) remain a separate future arm. They are not run or inferred in this diagnostic stage.

## Controls and schedule

Root Codex GPT-6 is the sole paid caller. GPT-6 Luna Xhigh supports preparation and site implementation; GPT-6.1 Sol Xhigh independently reviews design and grading. Local support is not charged to this OpenRouter inference ledger.

Preserve the failed trial's exact model, pinned provider, no-fallback routing, standard service route, `max_tokens:12288`, `stream:false`, and default sampling settings. Retain High reasoning with exclusion where supported; omit unsupported reasoning for GPT-4.1. Claude remains on **Amazon Bedrock**, as in the failed trial. Equal High labels do not imply equal internal compute; Gemini/Claude gateway mappings may use token budgets. Record returned model/provider, usage and finish reason.

Freeze all request bodies, the schedule, protocol hash, prior cohort/grade hashes and live discovery receipts before the first paid send. Within each repetition use a deterministic provider-breadth pair order: GPT 5×5 → Claude 9×9 → Gemini 5×5 → GPT 7×7 → Gemini 7×7 → GPT 9×9. Assign all six permutations of the three representations once each across the six pairs in repetition 1; reverse each pair's representation sequence in repetition 2. Execute the first representation position across all pairs before position 2, then position 3. Thus representations, not merely providers, are counterbalanced across the selected cohort. Retain the exact sequence in the manifest. Do not adapt order, prompt, output allowance or cohort in response to new results. No effort sweep is included.

These are service-level comparisons. Fresh image controls reduce the time/repeatability confound in historical-versus-text comparisons. Counterbalancing mitigates but does not eliminate temporal effects. Text replaces perception with an exact partition and changes wording, tokens and serialization; a text advantage does not prove that image perception alone caused a prior failure. Routes cannot guarantee immutable underlying weights or sampling seeds. Leave provider caching behavior at its existing default; retain reported cache usage. Repetition may benefit from caching, so cost/latency observations include service and caching effects rather than isolated model computation.

## Judging and interpretation

Reuse the strict JSON/schema/rules grader and separately the deterministic extractor of **exactly one** schema-shaped JSON object from visible final text. Report both; never repair coordinates, choose among alternatives, execute generated code, grade hidden reasoning or use an LLM judge.

Queens rules: one queen per row, column and region; no queens touching, including diagonally; non-adjacent long diagonals are allowed. A malformed or missing final answer and an invalid placement are distinct failures. Retain rule-specific failures, refusal/error/cap states, full visible responses, output/reasoning tokens, cost and wall-clock request-to-complete-response latency. This non-streaming experiment does not measure time-to-first-token.

An independent verifier reconstructs input partitions and request controls, checks unique solutions and every grade, and reconciles ledger totals and completeness. Report conditional descriptive counts and per-trial time/cost; do not make population-accuracy, statistical-significance, monotonic generation, or isolated perception-causality claims from two samples per cell. Family aggregates have different board mixtures and are not fair model rankings. Within-pair comparisons are the intended unit.

## Budget and safety

The new stage has its own **$5 cap**. Do not pool the preceding $0.17573475 remainder or modify its frozen $2 protocol. Discover current capabilities, rates and endpoint availability through the installed credential broker; stop if the frozen route/settings cannot be preserved. No OpenRouter governance, account/key policy, credentials, or workspace settings changes are authorized.

Per-call conservative reservation = 12,000 input tokens × prompt rate + 12,288 total completion tokens × completion rate + $0.01. Require the full 36-call planned reserve to fit $5 before freezing. Freeze per-token price ceilings as well. October 1 live discovery confirmed the prior rates and a **$4.295232 total reserve**: GPT $2.381472 for 18 requests, Claude $1.381920 for 6, Gemini $0.531840 for 12. This is a ceiling allocation, not a predicted bill. Actual billed `usage.cost` releases unused reserve. Keep full reservations for unknown charges and halt on uncertainty or reserve assumptions exceeded.

Use persistent start markers, incremental client capture of unchanged response bytes and a 600-second absolute deadline. No automatic retry after timeout, errors, uncertain delivery or wrong answers. Root checks ledger and frozen hashes before every call; the complete design cannot exceed the cap by relying on later low-cost outcomes.

## Evidence and publication

Retain exact local raw wire responses and all frozen requests, including failed trials. Public evidence preserves visible response content and safely sanitizes credentials, identifying private paths and encrypted provider reasoning under the existing evidence contract. Publish all attempted trials, grades, settings, source/hash lineage, cost/time and omissions in the existing [Queens model assessment](https://joeywilkes12.github.io/queens-model-assessment/#/earlier-generations), keeping original-image, historical exploratory, and new matched diagnostics separate.

After validation, create model-attributed signed commits, push the existing Pages repository without force, await successful deployment, and verify public files against the audited local bundle. Preserve unrelated solver/app edits and existing publishing configuration.

Primary interface references: [OpenRouter models API](https://openrouter.ai/api/v1/models), [provider selection](https://openrouter.ai/docs/guides/routing/provider-selection), [image input](https://openrouter.ai/docs/guides/overview/multimodal/image-understanding), and [reasoning tokens](https://openrouter.ai/docs/guides/best-practices/reasoning-tokens). The saved live receipts, not unsourced price recollection, control this stage.
