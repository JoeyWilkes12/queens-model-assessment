# Jev provides structured decisions, not free-form answers.

Jev 1.13 accepts a structured state or text input and returns typed, structured decisions. It does not process images from the report, nor does it write a standard explanatory chat response.

## The interface dictates the task constraints.

The experiment utilized OpenRouter's Decisions route, which requires a canonical text region grid. The initial image prompt failed with an HTTP 400 error. This failure was an interface mismatch, not an error in the puzzle answer itself.

## Pre-candidate testing results are presented in the table below.

The table shows the outcomes of various probes run before the main candidate testing began.

Figure caption: Table NATIVE JEV PROBES shows the results of initial testing on the Queens logic puzzle.

| TEST | COMPLETE ANSWER | ELAPSED | CONFIRMED USD |
| :--- | :--- | :--- | :--- |
| 5×5 simultaneous row choices | Invalid | 0.435s | $0.000056742 |
| 7×7 simultaneous row choices | Invalid | 0.249s | $0.000088452 |
| 9×9 simultaneous row choices | Invalid | 0.349s | $0.000129276 |
| 5×5 sequential rows | Invalid | 1.189s total | $0.000158802 |
| 120-permutation recognition | Invalid | 0.245s | $0.000235746 |

Jev correctly read 9 out of 9 sampled grid cells. However, it only agreed with the checker on 8 out of 12 self-constraint questions. Because these questions were unbalanced, this result does not establish reliable self-verification.

## Confidence scores are not proof of correctness.

Questions in a batch are evaluated separately, even though they all see the same state. Confidence is defined as the concentration of a returned distribution. It is not proof that the candidate successfully satisfies the board constraints.