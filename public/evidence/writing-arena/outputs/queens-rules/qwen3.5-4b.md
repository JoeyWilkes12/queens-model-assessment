# Queens is regional, not ordinary N-queens.

Every row, every column, every connected region, and every touching pair participates in the same global constraint system.

## Four rules, one placement

One queen per row. Every row receives exactly one selected cell.

One queen per column. Column positions must be unique.

One queen per region. Matching letters identify the same connected region.

No touching queens. Chebyshev distance must exceed one; longer diagonals are allowed.

The global burden is the interaction: a locally legal cell can consume the only useful region or column needed later.

## A verified 5×5 target

Figure caption: Verified solution: columns by row [5, 3, 1, 4, 2].

The solution is columns by row [5, 3, 1, 4, 2]; its occupied regions are C, B, A, D, E. Region C is a singleton in the upper-right cell.

## The report's visual receipts

Figure caption: 5×5 target and verified solution

Figure caption: 7×7 target and verified solution

Figure caption: 9×9 target and verified solution

Figure caption: Jev selected placement versus the unique legal solution

Figure caption: A solved 5×5 board used only as worked-example context

## Three boards, not a difficulty curve

Table: CANONICAL TARGET BOARDS

| BOARD | PERMUTATIONS CHECKED | SEARCH NODES | UNIQUE SOLUTIONS |
| --- | --- | --- | --- |
| 5×5 · easy | 120 | 38 | 1 |
| 7×7 · medium | 5,040 | 197 | 1 |
| 9×9 · hard | 362,880 | 1,172 | 1 |

Labels are provisional descriptions of these generated boards. Size, solver search work, image handling, response length, routing, and provider timing are not interchangeable measurements.