# November 1 local assessment cost scenarios

Snapshot `2026-11-01-local-coverage`, captured 2026-11-01T16:16:33.771111+00:00: 17 conditions, 407 original/audit receipts and 33 separately linked rescues. Original means the first attempt in its own frozen condition; selected audits are not added to their source scores.

Prices remain the dated October 30 OpenRouter artifact, unchanged for a controlled price comparison. 9B: $0.17 input / $0.25 output per million; 27B: $0.26 / $2.60. Qwen 4B uses an explicitly optional Flash proxy at $0.065 / $0.26; it has no asserted exact hosted tariff. Gemma and LLaVA have **no default tariff assigned**. They require explicit custom or proxy rates in the website. Absence of a saved tariff is not evidence they are unavailable from every host.

These scenarios reprice the reported local token counts; no inference was purchased. Quantization, tokenizer, image accounting, cache fees and hosted outputs can differ. Local provider fees were $0, with electricity and hardware costs unmeasured. Generated thinking is counted once in output.

## Fresh1: all four arms

| Model / tariff | Arm | Recorded / planned | Input / generated tokens | One-shot USD | Strict | USD / strict |
|---|---|---:|---:|---:|---:|---:|
| gemma4:e4b / no tariff assigned | baseline | 12/12 | 6600 / 147364 | unknown | 4 | unknown |
| gemma4:e4b / no tariff assigned | schema | 12/12 | 7272 / 139349 | unknown | 4 | unknown |
| gemma4:e4b / no tariff assigned | neutral | 12/12 | 19044 / 151620 | unknown | 2 | unknown |
| gemma4:e4b / no tariff assigned | caveman | 12/12 | 19920 / 69352 | unknown | 0 | undefined |
| llava-llama3:8b / no tariff assigned | baseline | 12/12 | 10128 / 346 | unknown | 0 | undefined |
| llava-llama3:8b / no tariff assigned | schema | 12/12 | 10824 / 392 | unknown | 0 | undefined |
| llava-llama3:8b / no tariff assigned | neutral | 12/12 | 22752 / 348 | unknown | 0 | undefined |
| llava-llama3:8b / no tariff assigned | caveman | 12/12 | 23304 / 342 | unknown | 0 | undefined |
| qwen3.5:4b / 4b proxy | baseline | 7/12 | 5971 / 143453 | $0.037686 | 4 | $0.009421 |
| qwen3.5:4b / 4b proxy | schema | 7/12 | 6377 / 184583 | $0.048406 | 2 | $0.024203 |
| qwen3.5:4b / 4b proxy | neutral | 8/12 | 15312 / 161556 | $0.043000 | 3 | $0.014333 |
| qwen3.5:4b / 4b proxy | caveman | 8/12 | 15872 / 175976 | $0.046785 | 4 | $0.011696 |
| qwen3.5:9b-nvfp4 / 9b | baseline | 12/12 | 10236 / 210412 | $0.054343 | 9 | $0.006038 |
| qwen3.5:9b-nvfp4 / 9b | schema | 12/12 | 10932 / 208496 | $0.053982 | 10 | $0.005398 |
| qwen3.5:9b-nvfp4 / 9b | neutral | 12/12 | 22968 / 219049 | $0.058667 | 9 | $0.006519 |
| qwen3.5:9b-nvfp4 / 9b | caveman | 12/12 | 23808 / 174627 | $0.047704 | 10 | $0.004770 |

**Qwen 9B fresh1:** baseline generated 210,412 tokens versus Caveman’s 174,627, a 17.01% reduction. Caveman added 13,572 input tokens. At the dated 9B tariff, one-shot spend changes from $0.05434312 to $0.04770411, **−12.22%**, while strict answers change from 9/12 to 10/12. Cost per strict answer is **−21.00%**. These descriptive results include the full cost of capped requests and do not establish causation. Output/input prices must exceed 13,572 / 35,785 = **0.3793×** for the observed output savings to offset added input.

**Gemma:** Caveman generated 52.94% fewer output tokens, but strict correctness fell from baseline 4/12 to 0/12. A lower token bill would not be a solving improvement; cost per strict Caveman solution is undefined at any rate. No default Gemma bill is inferred.

**LLaVA:** baseline 346 versus Caveman 342 output tokens saves only four tokens while adding 13,176 input tokens across the twelve paired requests. All four arms scored 0/12 strict. This is not evidence of useful solving or cost per solved board.

**Qwen 4B:** only 30/48 calls exist: baseline/schema have seven recorded each, neutral/Caveman eight each. The website exposes individual known workload costs but withholds baseline/Caveman deltas and break-even claims for this unmatched recorded scope. It does not price the eighteen unrun calls as zero or project a completed study.

Neutral control prompts also differ in measured input length: Qwen neutral 1,914 vs Caveman 1,984 tokens; Gemma 1,587 vs 1,660; LLaVA 1,896 vs 1,942. This is an approximate prompt-overhead control, not an exact token-length ablation.

## Earlier conditions and selected audits

Every previously published scenario remains reproducible in the [October 31 readout](local-qwen-costs.md). This import also exposes original-budget 9B (six calls, three matched boards) and 27B (two calls, one matched board). Their selected partial scopes can be priced, but cannot support a complete 24-request score or a general savings conclusion. The 27B sampling-r2 subset remains 22/24 calls on eleven matched boards.

For all studies: `USD = (reported input × input USD/M + reported generated × output USD/M) / 1,000,000`. All recorded attempts, including wrong answers and token caps, enter spend. Cost per strict success divides that total by strict successes; zero successes are undefined. Format-only correct answers are separate. Rescue costs include full replay input and count unique combined successes once. The eleven actively canceled streams have missing usage, so affected totals remain unknown. Complete audit reruns do not fill those missing counts.

## Follow-up acceptance

Update the frozen snapshot after Qwen 4B’s remaining eighteen calls and the two 27B round-2 calls finish. Retain all failed attempt costs. Publish text/modality and constrained-JSON conditions separately after their frozen plans and receipts exist. Do not turn an exact model-family tariff into a claim of identical hosted weights or performance. Future price refreshes need a new dated artifact; changing only usage keeps this price reference fixed.

Sources: [saved pricing evidence](../public/evidence/local-qwen-pricing.json), [OpenRouter catalog](https://openrouter.ai/api/v1/models), [model pricing documentation](https://openrouter.ai/docs/guides/overview/models), [reasoning billing](https://openrouter.ai/docs/guides/best-practices/reasoning-tokens). The full historical catalog response was not retained; its hash alone cannot reconstruct it. Arithmetic is checked by `npm run local-qwen:verify`.
