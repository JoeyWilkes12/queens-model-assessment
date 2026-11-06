# November 3 local assessment

The November 3 snapshot records 531 primary calls across 21 separate conditions, up 67 from November 2. The additions complete Qwen 4B image (11 new calls, 48/48 total), add GPT-OSS 20B text (48/48), and start Qwen 9B text (8/48). All three use the fresh1 board set. Each condition keeps its own prompt modality, runtime, and sampling settings.

| Condition | Arm | Recorded | Input tokens | Output tokens | Strict | Format-only | Truncated | Incorrect | One-shot USD |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|
| Qwen 4B image | Baseline | 12/12 | 10,236 | 288,892 | 4 | 3 | 5 | 0 | $0.07577726 |
| | Schema | 12/12 | 10,932 | 336,091 | 3 | 0 | 9 | 0 | $0.08809424 |
| | Neutral | 12/12 | 22,968 | 276,054 | 4 | 3 | 5 | 0 | $0.07326696 |
| | Caveman | 12/12 | 23,808 | 293,729 | 5 | 0 | 7 | 0 | $0.07791706 |
| GPT-OSS 20B text | Baseline | 12/12 | 5,260 | 263,898 | 6 | 0 | 6 | 0 | Unknown |
| | Schema | 12/12 | 6,004 | 300,201 | 5 | 0 | 7 | 0 | Unknown |
| | Neutral | 12/12 | 17,812 | 248,506 | 6 | 0 | 6 | 0 | Unknown |
| | Caveman | 12/12 | 18,388 | 214,813 | 6 | 0 | 5 | 1 | Unknown |
| Qwen 9B text | Baseline | 2/12 | 712 | 44,494 | 2 | 0 | 0 | 0 | $0.01124454 |
| | Schema | 2/12 | 828 | 35,607 | 2 | 0 | 0 | 0 | $0.00904251 |
| | Neutral | 2/12 | 2,834 | 19,417 | 2 | 0 | 0 | 0 | $0.00533603 |
| | Caveman | 2/12 | 2,974 | 20,355 | 2 | 0 | 0 | 0 | $0.00559433 |

The completed 4B image arms now have 12 matched board pairs. Caveman adds 13,572 input and 4,837 output tokens versus baseline, raising estimated one-shot spend by $0.00213980 (2.82%). Strict solves rise from four to five, while format-only solves drop from three to zero. The count of correct solutions across those two categories falls from seven to five. At the proxy rates, spend per strict solve falls from $0.01894432 to $0.01558341.

GPT-OSS 20B text has 12 matched pairs. Caveman uses 13,128 more input tokens and 49,085 fewer output tokens than baseline, with six strict solves in each arm. One Caveman answer is incorrect and five are truncated, compared with six truncations in baseline. The pricing artifact supplies no GPT-OSS tariff, so the report gives usage without a dollar estimate.

Qwen 9B text has two recorded boards in each arm, panel-5-28 and panel-7-06. Caveman uses 2,262 more input tokens and 24,139 fewer output tokens than baseline on those same boards. The scenario cost falls by $0.00565021 (50.25%) with both arms solving both boards in strict format. The remaining 40 calls are pending. This comparison covers only the two observed pairs and the text prompt.

The table prices all recorded one-shot attempts, including failures and truncations. These conditions have no recorded rescues. The October 30 rates are $0.17 input and $0.25 output per million tokens for 9B. The optional 4B scenario uses the Qwen3.5 Flash proxy of $0.065 input and $0.26 output per million because the catalog had no exact 4B entry. These figures apply hosted text rates to local usage. [Pricing artifact](../public/evidence/local-qwen-pricing.json)

Raw summaries and normalized usage are linked from the [November 3 catalog](../public/evidence/local-qwen/snapshots/2026-11-03-overnight/catalog.json). The earlier unmatched 4B snapshot remains available in the [November 2 readout](local-qwen-nov2-costs.md).
