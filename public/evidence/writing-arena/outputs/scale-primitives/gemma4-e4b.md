# Testing AI Models on the Queens Puzzle

Across two reused boards and 24 menu variants, the AI model succeeded in explicit-region selection 24 out of 24 times. This means the model correctly selected the region containing the answer. However, the candidate lists overlap, meaning these 24 trials are not independent puzzles. This primitive study shows that the claims of selection, validity, and ordinal coverage are different concepts.

## The 255-Option Limit

The tables below present data from the JEV SCALE STUDY, which tests the model across different numbers of available options.

Figure caption: The JEV SCALE STUDY table shows the mean probability of the AI selecting the correct region across various board and option counts.

| BOARD | OPTIONS | COLUMNS ONLY | EXPLICIT REGIONS | MEAN P(TRUE), REGIONS |
| :--- | :--- | :--- | :--- | :--- |
| 7×7 | 12 | 0/3 | 3/3 | 0.960 |
| 7×7 | 50 | 0/3 | 3/3 | 0.877 |
| 7×7 | 100 | 0/3 | 3/3 | 0.837 |
| 7×7 | 255 | 0/3 | 3/3 | 0.730 |
| 9×9 | 12 | 1/3 | 3/3 | 0.900 |
| 9×9 | 50 | 0/3 | 3/3 | 0.790 |
| 9×9 | 100 | 0/3 | 3/3 | 0.730 |
| 9×9 | 255 | 0/3 | 3/3 | 0.667 |

All 24 tested explicit-region menus succeeded, which includes six tests run at the maximum 255 options. Larger menus, new boards, and harder searches have not yet been tested in this comparison. We observed that the mean probability of the correct answer decreased as the number of options increased. For one 9×9/255 test, the AI assigned the true option a probability of only 0.50.

## Six Boards and Five Tasks

We accepted two boards each at 5×5, 7×7, and 9×9. These boards were selected from separate fixed seeds. The selection process required that the boards had connected regions, unique solutions, and no duplication. These six board-level units are not 30 independent puzzles or 534 independent decisions.

## Noul and Score Are Not Interchangeable

The metrics Noul and Score measure different things. Noul refers to the AI's absolute value output, while Score relates to the winning option chosen. The following table presents the HELD-OUT PRIMITIVE CHECKS.

Figure caption: The HELD-OUT PRIMITIVE CHECKS table compares the results of using Noul and Score for validation when the answer was present or invalid.

| CONDITION | RESULT | WHAT IT MEANS |
| :--- | :--- | :--- |
| Explicit regions · answer present · Noul | 6 TP, 5 FP | The true candidate was ranked highest, but the threshold acceptance was unsafe. |
| Explicit regions · answer present · Score | 32/72 modal level | The ordinal precision (ranking) stayed below a majority reference. |
| All-invalid · Choice none | 6/6 rejects | The AI chose “none” on all six sets where no answer was valid. This is a small sample, not a general rejection rate. |
| All-invalid · Noul < .5 | 4/6 rejects | The independent Noul threshold missed two sets. |
| All-invalid · Score complete < .5 | 3/6 rejects | The scalar Score threshold missed three sets. |

The AI's winning option (Score) and the absolute values (Noul) answer different questions. Therefore, we must keep the exact validator in the testing loop.