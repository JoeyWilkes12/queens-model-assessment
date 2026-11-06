# November 5 local open-weight assessment audit

The November 5 snapshot adds 105 recorded requests to the November 3 catalog. Coverage rises from 21 to 23 frozen conditions and from 531 to 636 original and selected-audit receipts. The count of separate rescues remains 38.

| Mountain time session | New recorded calls | Outcomes |
|---|---:|---|
| Nov 3 23:00 to Nov 4 08:47 | 62 | Qwen 9B text finished its last 40 calls (18 strict, 22 caps). The first 22 constrained image calls produced 19 strict answers and three caps. |
| Nov 4 23:00 to Nov 5 08:32 | 43 | The last two constrained image calls reached the cap. Qwen 27B fresh images produced 37 strict answers and four correct answers in the wrong format. |

The supplied Gemma and LLaVA scores describe earlier Fresh1 image runs. Their receipts and the Qwen 9B image reference are already published. The supplied Qwen 4B count of 13/33 was an interim readout. Its completed 16/48 strict result and six additional format-only answers were published in the November 3 snapshot.

## Correctness and timing

Each panel uses twelve frozen board identities, four per size. There is one call per board and arm. The 48-call panels use four arms and the constrained JSON panel uses baseline and Caveman only. The board set is public and was used in prior hosted assessments.

| Fresh1 condition | Recorded / planned | Strict | Correct, wrong format | Cap | Other incorrect | Median elapsed | Sum of elapsed | Decode tokens/s |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| Gemma 4 E4B image | 48/48 | 10 | 0 | 0 | 38 | 98.1 s | 1.31 h | 108.80 |
| LLaVA-Llama3 image | 48/48 | 0 | 0 | 0 | 48 | 4.1 s | 0.054 h | 48.00 |
| Qwen 4B image | 48/48 | 16 | 6 | 26 | 0 | 592.4 s | 5.93 h | 56.25 |
| Qwen 9B image | 48/48 | 38 | 0 | 10 | 0 | 323.9 s | 5.67 h | 40.16 |
| GPT-OSS 20B text | 48/48 | 23 | 0 | 24 | 1 | 598.3 s | 5.81 h | 49.25 |
| Qwen 9B text | 48/48 | 26 | 0 | 22 | 0 | 728.9 s | 8.33 h | 39.79 |
| Qwen 9B image + JSON schema | 24/24 | 19 | 0 | 5 | 0 | 283.0 s | 2.68 h | 40.21 |
| Qwen 27B image | 41/48 | 37 | 4 | 0 | 0 | 747.5 s | 8.95 h | 12.63 |

Elapsed metrics use the recorded request duration, including prefill and decoding, for every observed result. The sum excludes time between requests and can span multiple nights. Decode throughput is the sum of generated tokens divided by the sum of server evaluation seconds. It includes thinking tokens where recorded. These measures explain the approximate 110 and 41 tokens/s in the earlier summary. The measured LLaVA median is about four seconds. Its brief answers and zero strict solves make low latency a poor measure of useful performance here. Model, quantization, runner, thinking, prompt and output allowances differ. The table describes these specific configurations on this host.

## What changed on the same boards

| Qwen 9B setup | Baseline strict by size (5/7/9) | Caveman strict by size (5/7/9) | Strict / recorded for the two matched arms | Caps |
|---|---|---|---:|---:|
| Plain image | 4 / 4 / 1 | 4 / 3 / 3 | 19/24 | 5 |
| Image + JSON schema | 4 / 4 / 1 | 4 / 3 / 3 | 19/24 | 5 |
| Text grid | 4 / 2 / 1 | 2 / 3 / 1 | 13/24 | 11 |

Each size has four requests per arm. With the request-level schema, all 24 saved requests match the plain-image controls after removing the schema field. All 24 thinking strings match exactly. Twenty final response strings match exactly. Every strict outcome and cap matches at the board/arm level. The schema constrains answer structure, while the grader independently checks the board ID and puzzle rules. The inherited plan flag says structured enforcement is false. The verified request payload explicitly supplies the schema through the format field. This observed replay provides no evidence of a solve-rate gain from that schema on these boards.

The text grid gives the same region layout in a different prompt and representation. Relative to plain image, one of the 24 paired calls gained a strict answer and seven lost one. Across all four arms text scores 26/48 versus image 38/48. Text also recorded more caps and longer median latency. This is descriptive evidence for this prompt, model and budget. The runs were on different nights and repeated one fixed public panel.

The 27B fresh image run is still partial. Its baseline has 8/11 strict plus three format-only, schema 10/10 strict, neutral 9/10 strict plus one format-only, and Caveman 10/10 strict. Across the ten recorded baseline/Caveman pairs, baseline is 7/10 strict and Caveman 10/10 strict. Both solve all ten after format recovery. Baseline alone recorded panel-7-61, and none of the arms recorded panel-9-45. Pending outcomes remain unknown. The runtime and 24,576-token allowance differ from the 9B image reference. Shadow loop detection observed generation without canceling requests.

## Hosted cost scenarios

The estimates apply the saved October 30 OpenRouter rates to all recorded local usage, including capped generations. Qwen 9B uses $0.17 input and $0.25 output per million tokens. These are workload estimates from local counts. The local provider fee is $0 and power and hardware costs are unmeasured.

| Qwen 9B matched arms | Baseline USD | Caveman USD | Caveman spend change | Baseline / Caveman strict |
|---|---:|---:|---:|---:|
| Plain image | $0.05434312 | $0.04770411 | −12.22% | 9 / 10 |
| Image + JSON schema | $0.05434637 | $0.04770161 | −12.23% | 9 / 10 |
| Text grid | $0.08390383 | $0.06989632 | −16.69% | 7 / 6 |

The two-board November 3 text estimate showed a 50.25% spend reduction. The complete panel shows a smaller reduction and one fewer strict solve with Caveman. The 27B full-arm contrast remains withheld because the recorded baseline and Caveman board sets differ. Per-arm figures remain available in the explorer.

The [active index](../public/evidence/local-qwen/index.json) links every receipt and configuration. The [November 5 catalog](../public/evidence/local-qwen/snapshots/2026-11-05-overnight/catalog.json) freezes this readout. Earlier snapshots and the [November 3 audit](local-qwen-nov3.md) retain their original denominators. The [saved pricing artifact](../public/evidence/local-qwen-pricing.json) supplies the reference tariffs.
