# Caveman: token overhead and illustrative hosted cost

This analysis reprices the completed 28 October 2026 `qwen3.5:4b` pilot. It does not run another model, change the frozen plan, or use tonight's separately managed assessments. The local run reports a $0 provider inference fee; electricity and hardware costs were not measured.

## Observed usage

| Scope | Baseline input / generated | Caveman input / generated | Combined-token change |
| --- | ---: | ---: | ---: |
| 5×5, four boards | 3,412 / 43,888 | 7,936 / 35,947 | −3,417 (−7.22%) |
| 7×7, four boards | 3,412 / 48,475 | 7,936 / 47,701 | +3,750 (+7.23%) |
| 9×9, four boards | 3,412 / 49,152 | 7,936 / 49,152 | +4,524 (+8.61%) |
| All twelve boards | 10,236 / 141,515 | 23,808 / 132,800 | +4,857 (+3.20%) |

Caveman added 13,572 input tokens (+132.59%) and reduced generated tokens by 8,715 (−6.16%). Generated tokens include thinking and are counted once. Five paired boards used fewer generated tokens, one used more, and six were unchanged because both conditions reached the generation cap. All four 9×9 pairs fall in that last group.

Strict correctness increased from 1/12 to 5/12; diagnostic validity including uniquely extracted JSON increased from 3/12 to 5/12. This is exploratory n=4 per size, one run per condition, with longer Caveman inputs, fixed baseline-first order, accumulated cache state and changing host conditions. Neither improved solving nor shorter generation can be attributed causally to the skill from this sample.

## Repricing, not a hosted bill

For input and output rates `Pin` and `Pout` in USD per million tokens:

```text
charge = (input × Pin + generated × Pout) / 1,000,000
Caveman − baseline = (13,572 × Pin − 8,715 × Pout) / 1,000,000
```

With positive input pricing, all-board savings require `Pout / Pin > 1.557314974…`. The per-size thresholds are >0.5697× for 5×5 and >5.8450× for 7×7. The 9×9 sample had no generated-token reduction, so it costs more whenever input tokens have a positive price. Aggregate savings do not imply every subgroup saves.

The [OpenRouter Models API](https://openrouter.ai/api/v1/models) was checked at 2026-10-29 03:32:37 UTC (28 October MDT). Its 457-entry catalog did not list Qwen3.5-4B. The saved [allowlisted snapshot](../public/evidence/ollama/pricing-reference.json) retains the reference quotes, exact per-token strings, retrieval time and full-response digest. The complete catalog is not retained; the digest alone cannot independently reconstruct its contents. `models.dev/api.json` returned HTTP 403, so no models.dev rates were used.

| Illustrative tariff applied to the same 4b counts | Input / 1M | Output / 1M | Baseline estimate | Caveman estimate | Change |
| --- | ---: | ---: | ---: | ---: | ---: |
| Qwen3.5-9B | $0.17 | $0.25 | $0.03711887 | $0.03724736 | +0.35% |
| Qwen3.5-27B | $0.26 | $2.60 | $0.37060036 | $0.35147008 | −5.16% |
| Qwen3.5-Flash | $0.065 | $0.26 | $0.03745924 | $0.03607552 | −3.69% |

OpenRouter's [catalog documentation](https://openrouter.ai/docs/guides/overview/models) defines these prices as the top provider's default-condition pricing, in USD per token. At the same check, the public 9B page showed a different provider quote ($0.08/$0.13); the calculator consistently uses the dated API snapshot, not a lowest-price claim. These are reference tariffs, not measured results for 9B, 27B or Flash.

The estimate assumes uncached linear prompt/completion rates and counts all reported generated tokens, including thinking, once as output, consistent with [OpenRouter's reasoning-token billing](https://openrouter.ai/docs/guides/best-practices/reasoning-tokens). Hosted tokenization and image handling may differ. Cache discounts, request/image surcharges, conditional rates, routing changes, credit-purchase fees and taxes are outside the estimate. It is not a forecast of hosted model performance or a calculation of local electricity/hardware cost.

## Website presentation and verification

The existing `#/caveman-summary` chapter now provides:

- Outcome bars on a common four-request scale, with strict, extraction-only and budget-limited categories kept separate.
- Stacked input/generated token bars on one zero-based scale, with signed absolute and percentage changes.
- Editable reference tariffs and a board-size selector, a signed charge-contribution chart, the break-even ratio, and exact per-size estimates.

Signed values, labels and outline arrow icons duplicate the color cues. Mint indicates reduced resource use or strict answers; coral marks increased charges/usage; gold distinguishes input and extraction-only answers. A capped attempt is labeled unfinished rather than an invalid completed solution. Exact score and usage tables remain available in native disclosures. Missing data and invalid prices remain unavailable; zero-priced baselines have no relative percentage.

`npm run caveman:verify` runs the pure cost helper against the saved receipts and pricing snapshot, including subgroup reversals, zero/free rates, missing usage and nonfinite inputs. `npm run ollama:verify` includes this check alongside the original receipt and pair audits. The browser reads only committed local evidence; it does not query pricing services or inference endpoints. New assessments need their own complete paired evidence and must not be pooled into this pilot without a stated protocol and denominator.
