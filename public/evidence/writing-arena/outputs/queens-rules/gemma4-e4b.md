# Queens is a regional constraint puzzle, not a standard N-queens problem.

The puzzle uses a global constraint system. This system applies to every row, every column, every connected region, and every pair of touching pieces.

## The four rules govern placement

The puzzle requires placing queens on a board. Four rules dictate where these queens can be placed.

1.  **One queen per row:** Every row must have exactly one selected cell containing a queen.
2.  **One queen per column:** Column positions must be unique.
3.  **One queen per region:** Queens must belong to unique regions. Regions are defined by matching letters in the puzzle.
4.  **No touching queens:** Queens cannot be placed next to each other. This means the Chebyshev distance between any two queens must exceed one. Longer diagonals are allowed.

The difficulty arises from global interactions. A cell that is locally legal might be the only useful region or column needed later in the puzzle.

## A verified 5×5 target solution

The verified solution for the 5x5 board is given by the column positions per row: [5, 3, 1, 4, 2]. The occupied regions are identified as C, B, A, D, and E. Region C is a singleton, meaning it exists only in the upper-right cell.

Figure caption: Verified solution: columns by row [5, 3, 1, 4, 2].

## The visual documentation

Figure caption: 5×5 target and verified solution
Figure caption: 7×7 target and verified solution
Figure caption: 9×9 target and verified solution
Figure caption: Jev selected placement versus the unique legal solution
Figure caption: A solved 5×5 board used only as worked-example context

## Three boards were tested, not a difficulty curve

The boards are labeled with provisional descriptions: easy, medium, and hard. These labels do not represent interchangeable measurements. Size, solver search work, image handling, response length, routing, and provider timing are not interchangeable measurements.

Table: CANONICAL TARGET BOARDS

| BOARD | PERMUTATIONS CHECKED | SEARCH NODES | UNIQUE SOLUTIONS |
| :--- | :--- | :--- | :--- |
| 5×5 · easy | 120 | 38 | 1 |
| 7×7 · medium | 5,040 | 197 | 1 |
| 9×9 · hard | 362,880 | 1,172 | 1 |