# Testing AI Models on Logic Puzzles: Queens

This page compares the performance of AI models on a logic puzzle called Queens. The results are presented in tables and shown visually in figures.

## 255-Option Edge

The table below shows the performance of the AI models on different levels of options. The column labeled "Options" shows the number of options available to the AI models. The column labeled "COLUMNS ONLY" shows the number of options that can be selected by the AI models using only columns. The column labeled "EXPLICIT REGIONS" shows the number of options that can be selected by the AI models using explicit regions. The column labeled "MEAN P(TRUE), REGIONS" shows the mean probability of selecting the correct answer using explicit regions.

| BOARD | OPTIONS | COLUMNS ONLY | EXPLICIT REGIONS | MEAN P(TRUE), REGIONS |
| --- | --- | --- | --- | --- |
| 7×7 | 12 | 0/3 | 3/3 | 0.960 |
| 7×7 | 50 | 0/3 | 3/3 | 0.877 |
| 7×7 | 100 | 0/3 | 3/3 | 0.837 |
| 7×7 | 255 | 0/3 | 3/3 | 0.730 |
| 9×9 | 12 | 1/3 | 3/3 | 0.900 |
| 9×9 | 50 | 0/3 | 3/3 | 0.790 |
| 9×9 | 100 | 0/3 | 3/3 | 0.730 |
| 9×9 | 255 | 0/3 | 3/3 | 0.667 |

The table shows that all 24 tested explicit-region menus succeeded, including six at the 255-option limit. Larger menus, new boards, and harder search remain untested by this comparison. Also, the mean probability of selecting the correct answer declined as options increased, and one 9×9/255 response assigned the true option only 0.50.

## Six New Boards with Five Tasks Each

Two boards each at 5×5, 7×7, and 9×9 were accepted from separate fixed seeds after connected regions, unique solutions, and nonduplication checks. These are six board-level units, not 30 independent puzzles or 534 independent decisions.

## Noul and Score are Not Interchangeable

The table below shows the performance of the AI models under different conditions. The column labeled "CONDITION" shows the conditions under which the AI models were tested. The column labeled "RESULT" shows the outcome of the test. The column labeled "WHAT IT MEANS" provides a brief explanation of the result.

| CONDITION | RESULT | WHAT IT MEANS |
| --- | --- | --- |
| Explicit regions · answer present · Noul | 6 TP, 5 FP | The AI models ranked the correct answer as the highest, but the threshold acceptance was unsafe. |
| Explicit regions · answer present · Score | 32/72 modal level | The ordinal precision remained below a majority reference. |
| All-invalid · Choice none | 6/6 rejects | The AI models rejected all six all-invalid sets, indicating a small same-family sample rather than a general rejection rate. |
| All-invalid · Noul < .5 | 4/6 rejects | The AI models missed two sets using independent thresholds. |
| All-invalid · Score complete < .5 | 3/6 rejects | The AI models missed three sets using scalar thresholds. |

The table shows that the AI models' absolute values and the winning option of the Choice model answer different questions. The exact validator should be kept in the loop during testing.