# Queens uses regions, unlike ordinary N-Queens.

Every row, column, connected region, and adjacent cell follows the same global constraint system.

## Four rules govern every queen placement

Each row contains exactly one queen. Each column holds a unique position. One queen occupies each region. Letters mark these connected regions. Queens cannot touch. Chebyshev distance (maximum coordinate difference) must exceed one. Longer diagonals are allowed. Local legality creates global risk. A valid cell now might use the only region or column needed later.

## A verified solution for the 5×5 board

Figure caption: Verified solution: columns by row [5, 3, 1, 4, 2].

The solution places queens at column indices [5, 3, 1, 4, 2] per row. Occupied regions are C, B, A, D, and E. Region C is a single cell in the upper-right corner.

## Visual evidence from the report

Figure caption: 5×5 target and verified solution
Figure caption: 7×7 target and verified solution
Figure caption: 9×9 target and verified solution
Figure caption: Jev selected placement versus the unique legal solution
Figure caption: A solved 5×5 board used only as worked-example context

## Board sizes do not equal difficulty levels

Table: CANONICAL TARGET BOARDS

| BOARD | PERMUTATIONS CHECKED | SEARCH NODES | UNIQUE SOLUTIONS |
| --- | --- | --- | --- |
| 5×5 · easy | 120 | 38 | 1 |
| 7×7 · medium | 5,040 | 197 | 1 |
| 9×9 · hard | 362,880 | 1,172 | 1 |

Labels are provisional descriptions of these generated boards. Size, solver search work, image handling, response length, routing, and provider timing are not interchangeable measurements.