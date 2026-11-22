# Rankings remained stable; absolute judgments varied.

This basic study used two reused boards and 24 menu variants. The explicit-region selection method was correct in all 24 cases (24/24). However, the candidate lists overlap. These are not 24 independent puzzles. The results show selection, validity, and ordinal coverage are different claims.

## Success persisted with up to 255 options

Table: JEV SCALE STUDY

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

All 24 tested explicit-region menus succeeded, including six at the 255-option limit. Larger menus, new boards, and harder searches remain untested by this comparison. The mean probability on the correct answer declined as options increased. One response for a 9×9 board with 255 options assigned the true option only 0.50.

## Six new boards generated with five tasks each

We accepted two boards each at 5×5, 7×7, and 9×9 from separate fixed seeds. They passed checks for connected regions, unique solutions, and nonduplication. These are six board-level units. They are not 30 independent puzzles or 534 independent decisions.

## Noul and Score measure different things

Table: HELD-OUT PRIMITIVE CHECKS

| CONDITION | RESULT | WHAT IT MEANS |
| --- | --- | --- |
| Explicit regions · answer present · Noul | 6 TP, 5 FP | True candidate ranked highest, but threshold acceptance was unsafe. |
| Explicit regions · answer present · Score | 32/72 modal level | Ordinal precision stayed below a majority reference. |
| All-invalid · Choice none | 6/6 rejects | Choice chose “none” on all six all-invalid sets; a small same-family sample, not a general rejection rate. |
| All-invalid · Noul < .5 | 4/6 rejects | Independent thresholds missed two sets. |
| All-invalid · Score complete < .5 | 3/6 rejects | Scalar threshold missed three sets. |

Choice's winning option and the absolute values of the Noul or Score metrics answer different questions. Keep the exact validator in the loop.