# Ranking held; absolute judgment wobbled.

Across two reused boards and 24 menu variants, explicit-region selection was correct 24/24; the candidate lists overlap, so these are not 24 independent puzzles. The primitive study shows why selection, validity, and ordinal coverage are different claims.

## The 255-option edge

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

All 24 tested explicit-region menus succeeded, including six at the 255-option limit. Larger menus, new boards and harder search remain untested by this comparison. Also, mean probability on the correct answer declined as options increased, and one 9×9/255 response assigned the true option only 0.50.

## Six new boards, five tasks each

Two boards each at 5×5, 7×7, and 9×9 were accepted from separate fixed seeds after connected regions, unique solutions, and nonduplication checks. These are six board-level units, not 30 independent puzzles or 534 independent decisions.

## Noul and Score are not interchangeable

Table: HELD-OUT PRIMITIVE CHECKS

| CONDITION | RESULT | WHAT IT MEANS |
| --- | --- | --- |
| Explicit regions · answer present · Noul | 6 TP, 5 FP | True candidate ranked highest, but threshold acceptance was unsafe. |
| Explicit regions · answer present · Score | 32/72 modal level | Ordinal precision stayed below a majority reference. |
| All-invalid · Choice none | 6/6 rejects | Choice chose “none” on all six all-invalid sets; a small same-family sample, not a general rejection rate. |
| All-invalid · Noul < .5 | 4/6 rejects | Independent thresholds missed two sets. |
| All-invalid · Score complete < .5 | 3/6 rejects | Scalar threshold missed three sets. |

Choice's winning option and Noul/Score's absolute values answer different questions. Keep the exact validator in the loop.
