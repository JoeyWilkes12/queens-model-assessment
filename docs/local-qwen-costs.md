# Local Qwen cost scenarios

Current evidence: `2026-10-31-overnight` (225 recorded calls). Pricing reused unchanged from the October 30 artifact for a controlled price comparison; this is not a price refresh. Pricing checked: 2026-10-30T15:07:15.442210+00:00. B = baseline; C = Caveman. All money is USD.

Local usage is repriced at hosted text list tariffs for comparison; these are scenarios, not hosted bill forecasts. Quantization, runner and tokenizer differ. No inference was purchased for this calculation. Exact 9B tariff: $0.17 input / $0.25 output per million tokens. Exact 27B tariff: $0.26 / $2.60. No exact hosted 4B catalog entry exists: 4B rows below explicitly use the optional Qwen3.5 Flash proxy ($0.065 / $0.26), not an asserted 4B price.

| Study | Recorded scope | Tariff | B base | C base | C − B | Strict B → C | $/strict B/C | Rescue extra B/C |
|---|---|---|---:|---:|---:|---:|---:|---:|
| `qwen3.5-4b-pilot` | 12 matched board pairs | 4B proxy | $0.037459 | $0.036076 | −$0.001384 | 1 → 5 | $0.037459/$0.007215 | $0.000000/$0.000000 |
| `qwen3.5-27b-q4_K_M-np24576` | 12 matched board pairs | 27B | $0.303294 | $0.257210 | −$0.046084 | 12 → 12 | $0.025275/$0.021434 | $0.000000/$0.000000 |
| `qwen3.5-27b-q4_K_M-np24576-qwen-sampling-r1` | 12 matched board pairs | 27B | $0.316778 | $0.265935 | −$0.050842 | 9 → 12 | $0.035198/$0.022161 | $0.000000/$0.000000 |
| `qwen3.5-27b-q4_K_M-np24576-qwen-sampling-r2` | 11 matched board pairs (partial) | 27B | $0.296232 | $0.258743 | −$0.037489 | 7 → 9 | $0.042319/$0.028749 | $0.000000/$0.000000 |
| `qwen3.5-4b-np32768-loopstop` | 12 matched board pairs | 4B proxy | $0.063263 | unknown | unknown | 7 → 6 | $0.009038/unknown | $0.004385/$0.008414 |
| `qwen3.5-4b-np32768-loopstop-audit` | selected 6 audit calls | 4B proxy | unknown | $0.051892 | not comparable | 0 → 0 | unknown/unknown | $0.000000/$0.000000 |
| `qwen3.5-9b-nvfp4-np24576` | 12 matched board pairs | 9B | $0.043844 | $0.046729 | $0.002886 | 10 → 8 | $0.004384/$0.005841 | $0.008668/$0.018107 |
| `qwen3.5-9b-nvfp4-np24576-qwen-sampling-r1` | 12 matched board pairs | 9B | $0.053159 | $0.046890 | −$0.006269 | 7 → 8 | $0.007594/$0.005861 | $0.013004/$0.009053 |
| `qwen3.5-9b-nvfp4-np24576-qwen-sampling-r2` | 12 matched board pairs | 9B | $0.054700 | $0.051975 | −$0.002724 | 10 → 8 | $0.005470/$0.006497 | $0.008670/$0.018108 |
| `qwen3.5-9b-nvfp4-np32768-loopstop` | 12 matched board pairs | 9B | unknown | unknown | unknown | 11 → 8 | unknown/unknown | $0.003454/$0.014557 |
| `qwen3.5-9b-nvfp4-np32768-loopstop-audit` | selected 5 audit calls | 9B | $0.008337 | $0.033199 | not comparable | 0 → 1 | unknown/$0.033199 | $0.000000/$0.000000 |

The 27B sampling-r2 row covers 22 recorded calls on 11 matched boards, with two calls still pending; its amounts describe that recorded subset, not a projected 24-call total. The 9B sampling-r2 row is complete at 24 calls. Each study remains separate. The selected audits rerun only the original loop-stopped calls with loop stopping disabled: six Caveman 4B calls and five 9B calls (one baseline, four Caveman). Their unequal, selected arms support no baseline/Caveman cost-effect comparison. Their per-arm costs price only these eligible reruns; the raw 24-slot summaries remain preserved. Audit spend does not repair or replace missing usage in the original streams.

All 11 canceled loop streams lack exact usage. Their affected arm totals and total study spend remain unknown; no provisional token estimate is used. Known partial usage may be displayed separately and must never be presented as total spend. Pending calls do not add charges or block the recorded subset; an empty recorded subset is unknown, not free.

Methods: one-shot spend includes every recorded attempt, including truncated outputs and failures. Output counts include generated thinking once; visible text is not an output-token substitute. Cost per strict solve divides all one-shot spend by strict solves, with no value at zero solves. Format-only passes are excluded. Rescue extras price the complete replay input plus rescue output, with no assumed cache discount; combined success counts each original row once. A missing rescue count makes enabled combined spend unknown. No cache, image-specific surcharge, request fee, electricity or hardware cost is inferred. Full catalog bytes were not retained; the digest identifies the transient fetched response but cannot reconstruct it.

Sources: [public model catalog](https://openrouter.ai/api/v1/models), [model API documentation](https://openrouter.ai/docs/guides/overview/models), [reasoning billing](https://openrouter.ai/docs/guides/best-practices/reasoning-tokens). Catalog defaults and provider-specific routes/overrides can differ from these dated list-rate scenarios.

Round-2 interpretation: 9B Caveman lowers total one-shot scenario spend but returns 8 strict solves versus 10 baseline; cost per strict solve therefore rises. The partial 27B comparison contains 7 baseline strict plus 4 format-only solutions versus 9 Caveman strict plus 2 completed incorrect answers. A lower total bill or higher strict-format count alone does not demonstrate better puzzle reasoning.
