# Testing AI Models on a Logic Puzzle Called Queens

Jev 1.13 accepts text or structured state and returns typed decisions. It does not see the report's images or write an ordinary explanatory chat answer.

## The Interface Changes the Task

The saved experiment used OpenRouter's Decisions route with a canonical text region grid. The original image prompt received HTTP 400 because this family requires its separate Decisions API. That is an interface mismatch, not a wrong puzzle answer.

## Before Candidate Engineering

Table: NATIVE JEV PROBES

| TEST | COMPLETE ANSWER | ELAPSED | CONFIRMED USD |
| --- | --- | --- | --- |
| 5×5 simultaneous row choices | Invalid | 0.435s | $0.000056742 |
| 7×7 simultaneous row choices | Invalid | 0.249s | $0.000088452 |
| 9×9 simultaneous row choices | Invalid | 0.349s | $0.000129276 |
| 5×5 sequential rows | Invalid | 1.189s total | $0.000158802 |
| 120-permutation recognition | Invalid | 0.245s | $0.000235746 |

Jev read 9/9 sampled grid cells correctly but agreed with the checker on only 8/12 self-constraint questions. The questions were unbalanced, so the result does not establish reliable self-verification.

## Do not Turn a Scalar into a Certificate

Questions in a batch see the same state but are evaluated separately. Confidence is concentration of a returned distribution, not proof that a candidate satisfies the board.