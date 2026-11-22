# Testing AI Models on the Queens Puzzle

The Queens puzzle is a logic puzzle, not an ordinary N-queens puzzle. It involves every row, column, connected region, and touching pair participating in the same global constraint system.

## Rules and Placement

* One queen per row and one per column.
* One queen per region, and matching letters identify the same connected region.
* No touching queens, and the Chebyshev distance must exceed one.
* Longer diagonals are allowed.

## 5×5 Target Board

The verified solution is columns by row [5, 3, 1, 4, 2]. Region C is a singleton in the upper-right cell.

## Visual Receipts

The figures below show the target and verified solutions for the 5×5, 7×7, and 9×9 boards.

Figure caption: Verified solution for 5×5 target board
Figure caption: Verified solution for 7×7 target board
Figure caption: Verified solution for 9×9 target board
Figure caption: Jev's selected placement versus the unique legal solution
Figure caption: A solved 5×5 board used as worked-example context

The table below shows the canonical target boards for each board size.

Table: Canonical Target Boards

| BOARD SIZE | PERMUTATIONS CHECKED | SEARCH NODES | UNIQUE SOLUTIONS |
| --- | --- | --- | --- |
| 5×5 | 120 | 38 | 1 |
| 7×7 | 5,040 | 197 | 1 |
| 9×9 | 362,880 | 1,172 | 1 |

The size, solver search work, image handling, response length, routing, and provider timing are not interchangeable measurements.