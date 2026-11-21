# Jev 1.13 outputs typed decisions from text or state

Jev 1.13 accepts text or structured state, which is organized puzzle data. It returns typed decisions, which are specific choices. The model does not see the report's images or write an ordinary explanatory chat answer.

## Interface mismatches caused errors, not logic failures

That is an interface mismatch, not a wrong puzzle answer. The saved experiment used OpenRouter's Decisions route with a canonical text region grid. A canonical text region grid is standard text board format. The original image prompt received HTTP 400 because this family requires its separate Decisions API.

## Initial tests show verification limits

The result does not establish reliable self-verification. Jev read 9/9 sampled grid cells correctly but agreed with the checker on only 8/12 self-constraint questions. Self-constraint questions check rule adherence. The questions were unbalanced.

Table: NATIVE JEV PROBES
| TEST | COMPLETE ANSWER | ELAPSED | CONFIRMED USD |
| --- | --- | --- | --- |
| 5×5 simultaneous row choices | Invalid | 0.435s | $0.000056742 |
| 7×7 simultaneous row choices | Invalid | 0.249s | $0.000088452 |
| 9×9 simultaneous row choices | Invalid | 0.349s | $0.000129276 |
| 5×5 sequential rows | Invalid | 1.189s total | $0.000158802 |
| 120-permutation recognition | Invalid | 0.245s | $0.000235746 |

## Confidence scores do not prove correctness

Confidence is not proof that a candidate satisfies the board. Questions in a batch see the same state but are evaluated separately. A batch groups requests together. Confidence is concentration of a returned distribution. A candidate is a proposed solution.