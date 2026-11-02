# November 2 local Qwen financial scenarios

Snapshot `2026-11-02-overnight`: 19 separate conditions, 464 recorded calls. B = baseline; C = Caveman. All money is USD. Pricing is the unchanged October 30 artifact, not a fresh quote. Exact 9B scenario rates are $0.17 input / $0.25 output per million; 27B $0.26 / $2.60. The absent exact 4B tariff is represented only by the explicitly optional Qwen3.5 Flash proxy ($0.065 / $0.26). Gemma and LLaVA have no asserted tariff and their costs remain unknown.

These calculations reprice local token counts; they do not predict hosted bills. All recorded one-shot attempts count, including failures and truncations, with generated thinking included once. Pending calls incur no estimated charge. Unknown recorded usage remains unknown, including canceled loop streams. No cache discount, image surcharge, request fee, electricity or hardware cost is invented. A zero strict-success denominator has no cost-per-success value. Correct solutions in the wrong format remain separate from strict successes.

| Condition | B/C calls | B/C input tokens | B/C output tokens | B/C strict | B/C format-only | B/C full one-shot spend | C − B spend | B/C $ per strict solve |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| `qwen3.5-4b-pilot` | 12/12 | 10236/23808 | 141515/132800 | 1/5 | 2/0 | $0.03745924/$0.03607552 | $-0.00138372 | $0.03745924/$0.00721510 |
| `gemma4-e4b-fresh1-4arm-np32768` | 12/12 | 6600/19920 | 147364/69352 | 4/0 | 0/0 | unknown/unknown | unknown | unknown/unknown |
| `llava-llama3-8b-fresh1-4arm-np4096` | 12/12 | 10128/23304 | 346/342 | 0/0 | 0/0 | unknown/unknown | unknown | unknown/unknown |
| `qwen3.5-27b-q4_K_M` | 1/1 | 853/1984 | 5915/4602 | 1/1 | 0/0 | $0.01560078/$0.01248104 | $-0.00311974 | $0.01560078/$0.01248104 |
| `qwen3.5-27b-q4_K_M-np24576` | 12/12 | 10236/23808 | 115628/96546 | 12/12 | 0/0 | $0.30329416/$0.25720968 | $-0.04608448 | $0.02527451/$0.02143414 |
| `qwen3.5-27b-q4_K_M-np24576-qwen-sampling-r1` | 12/12 | 10236/23808 | 120814/99902 | 9/12 | 3/0 | $0.31677776/$0.26593528 | $-0.05084248 | $0.03519753/$0.02216127 |
| `qwen3.5-27b-q4_K_M-np24576-qwen-sampling-r2` | 12/12 | 10236/23808 | 132997/119929 | 8/9 | 4/0 | $0.34845356/$0.31800548 | $-0.03044808 | $0.04355669/$0.03533394 |
| `qwen3.5-27b-q4_K_M-np24576-qwen-sampling-r3` | 12/12 | 10236/23808 | 123190/95594 | 10/12 | 2/0 | $0.32295536/$0.25473448 | $-0.06822088 | $0.03229554/$0.02122787 |
| `qwen3.5-4b-fresh1-4arm-np32768` | 9/10 | 7677/19840 | 208989/241512 | 4/4 | 1/0 | $0.05483614/$0.06408272 | withheld (unmatched) | $0.01370904/$0.01602068 |
| `qwen3.5-4b-np32768-loopstop` | 12/12 | 10236/unknown | 240761/unknown | 7/6 | 3/0 | $0.06326320/unknown | unknown | $0.00903760/unknown |
| `qwen3.5-4b-np32768-loopstop-audit` | 0/6 | unknown/11904 | unknown/196608 | 0/0 | 0/0 | unknown/$0.05189184 | withheld (unmatched) | unknown/unknown |
| `qwen3.5-9b-nvfp4` | 3/3 | 2559/5952 | 29091/30335 | 2/1 | 0/0 | $0.00770778/$0.00859559 | $0.00088781 | $0.00385389/$0.00859559 |
| `qwen3.5-9b-nvfp4-fresh1-4arm-np32768` | 12/12 | 10236/23808 | 210412/174627 | 9/10 | 0/0 | $0.05434312/$0.04770411 | $-0.00663901 | $0.00603812/$0.00477041 |
| `qwen3.5-9b-nvfp4-np24576` | 12/12 | 10236/23808 | 168414/170728 | 10/8 | 0/0 | $0.04384362/$0.04672936 | $0.00288574 | $0.00438436/$0.00584117 |
| `qwen3.5-9b-nvfp4-np24576-qwen-sampling-r1` | 12/12 | 10236/23808 | 205675/171369 | 7/8 | 2/2 | $0.05315887/$0.04688961 | $-0.00626926 | $0.00759412/$0.00586120 |
| `qwen3.5-9b-nvfp4-np24576-qwen-sampling-r2` | 12/12 | 10236/23808 | 211838/191712 | 10/8 | 0/0 | $0.05469962/$0.05197536 | $-0.00272426 | $0.00546996/$0.00649692 |
| `qwen3.5-9b-nvfp4-np24576-qwen-sampling-r3` | 12/12 | 10236/23808 | 191680/196740 | 9/7 | 1/1 | $0.04966012/$0.05323236 | $0.00357224 | $0.00551779/$0.00760462 |
| `qwen3.5-9b-nvfp4-np32768-loopstop` | 12/12 | unknown/unknown | unknown/unknown | 11/8 | 0/0 | unknown/unknown | unknown | unknown/unknown |
| `qwen3.5-9b-nvfp4-np32768-loopstop-audit` | 1/4 | 853/7936 | 32768/127398 | 0/1 | 0/0 | $0.00833701/$0.03319862 | withheld (unmatched) | unknown/$0.03319862 |

All contrasts require identical unique recorded board sets. The selected audit arms have no treatment contrast. The fresh 4B study has 37/48 recorded calls (B 9, schema 9, neutral 9, C 10); its B/C cost and outcome differences are withheld because the recorded boards are unmatched. Four-arm controls are excluded from every B/C comparison. Its schema input/output totals are 8,199/250,119, with 2 strict and 0 format-only; neutral totals are 17,226/194,324, with 3 strict and 3 format-only. These controls are not pooled into either treatment.

Round 3: 9B uses 13,572 more input tokens and 5,060 more output tokens in C, adding $0.00357224; strict solves fall 9→7 and format-only remains 1→1. 27B C uses 13,572 more input tokens but 27,596 fewer output tokens, saving $0.06822088; strict rises 10→12 while format-only falls 2→0. These are separate stochastic rounds, not pooled replications.

The now-complete 27B round 2 uses 13,572 more input and 13,068 fewer output tokens in C, saving $0.03044808; strict is 8→9, with format-only 4→0. The former October 31 partial 11-pair readout remains historical. No causal claim follows from lower spend or strict-format counts alone.

Rescues are additional replay requests, billed on their full reported input and output. Combined successes count each original row once and are a weaker follow-up outcome, never one-shot strict. All conditions omitted below have no recorded rescue extras.

| Condition / arm | Rescue calls | Full rescue extra | One-shot + rescue spend | Combined successes | $ per combined success |
|---|---:|---:|---:|---:|---:|
| `qwen3.5-4b-np32768-loopstop` B | 2 | $0.00438529 | $0.06764849 | 8 | $0.00845606 |
| `qwen3.5-4b-np32768-loopstop` C | 6 | $0.00841379 | unknown | 7 | unknown |
| `qwen3.5-9b-nvfp4` B | 1 | $0.00224527 | $0.00995305 | 3 | $0.00331768 |
| `qwen3.5-9b-nvfp4` C | 2 | $0.00487408 | $0.01346967 | 1 | $0.01346967 |
| `qwen3.5-9b-nvfp4-np24576` B | 2 | $0.00866846 | $0.05251208 | 10 | $0.00525121 |
| `qwen3.5-9b-nvfp4-np24576` C | 4 | $0.01810700 | $0.06483636 | 8 | $0.00810454 |
| `qwen3.5-9b-nvfp4-np24576-qwen-sampling-r1` B | 3 | $0.01300369 | $0.06616256 | 8 | $0.00827032 |
| `qwen3.5-9b-nvfp4-np24576-qwen-sampling-r1` C | 2 | $0.00905300 | $0.05594261 | 9 | $0.00621585 |
| `qwen3.5-9b-nvfp4-np24576-qwen-sampling-r2` B | 2 | $0.00867046 | $0.06337008 | 10 | $0.00633701 |
| `qwen3.5-9b-nvfp4-np24576-qwen-sampling-r2` C | 4 | $0.01810833 | $0.07008369 | 9 | $0.00778708 |
| `qwen3.5-9b-nvfp4-np24576-qwen-sampling-r3` B | 1 | $0.00433623 | $0.05399635 | 9 | $0.00599959 |
| `qwen3.5-9b-nvfp4-np24576-qwen-sampling-r3` C | 4 | $0.01810583 | $0.07133819 | 9 | $0.00792647 |
| `qwen3.5-9b-nvfp4-np32768-loopstop` B | 1 | $0.00345397 | unknown | 11 | unknown |
| `qwen3.5-9b-nvfp4-np32768-loopstop` C | 4 | $0.01455744 | unknown | 8 | unknown |

Canceled-stream usage in the original loop-stop arms is not repaired by the audit reruns. Even where rescue usage is known, combined spend stays unknown if one-shot usage is missing. The selected audit calls are priced separately; unselected audit slots are excluded, not pending attempts.

Reproduction: `node --experimental-strip-types scripts/verify-local-qwen-costs.mjs`. The verifier checks current integration arithmetic, raw summary usage for new rounds and completed/partial cohorts, and fixed October 31 / November 1 catalogs for historical fixtures. Source: the retained [November 2 catalog](../public/evidence/local-qwen/snapshots/2026-11-02-overnight/catalog.json), linked per-condition summaries, and unchanged [pricing artifact](../public/evidence/local-qwen-pricing.json). Historical reports are preserved. No inference, service changes or price fetch were performed.
