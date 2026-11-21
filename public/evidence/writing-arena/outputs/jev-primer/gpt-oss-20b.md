# Jev receives a decision, not a blank canvas

Jev 1.13 takes plain text or a structured state as input.  
It returns typed decisions.  
It does not read image reports or produce a normal chat answer.

## Interface change alters the task

The experiment was saved with OpenRouter’s Decisions route and a canonical text region grid.  
The original image prompt failed with HTTP 400 because that image family requires a separate Decisions API.  
This mismatch is an interface problem, not a wrong puzzle answer.

## Before candidate engineering

### NATIVE JEV PROBES

| TEST | COMPLETE ANSWER | ELAPSED | CONFIRMED USD |
| --- | --- | --- | --- |
| 5×5 simultaneous row choices | Invalid | 0.435s | $0.000056742 |
| 7×7 simultaneous row choices | Invalid | 0.249s | $0.000088452 |
| 9×9 simultaneous row choices | Invalid | 0.349s | $0.000129276 |
| 5×5 sequential rows | Invalid | 1.189s total | $0.000158802 |
| 120-permutation recognition | Invalid | 0.245s | $0.000235746 |

Jev read all 9 sampled grid cells correctly but agreed with the checker on only 8 of 12 self‑constraint questions.  
Because the questions were unbalanced, this result does not prove reliable self‑verification.

## Don’t turn a scalar into a certificate

Questions in a batch see the same state but are evaluated separately.  
Confidence equals the concentration of a returned distribution.  
It is not proof that a candidate satisfies the board.