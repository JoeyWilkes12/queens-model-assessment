# A one-line rule solves more boards than either decision model.

On the 192 new boards, a fixed rule solves 80. This fixed rule has no search or decision model. Jev 1.13 solved 21 boards. SubQ Snap solved 19 boards. Each model used one raw attempt and one filtered attempt per board.

## The rule operates using a greedy baseline

The greedy baseline is a four-step process. This process runs until every color has a queen or one color has no legal moves.

First, list all legal cells for each unplaced color. A legal cell is a location that does not share a row, column, or color with a placed queen. It must also not touch any placed queen, including diagonals.

Second, select the color with the fewest legal cells. Ties are broken by the earlier letter.

Third, place its first legal cell. This cell is chosen based on reading order (top row first, then left to right).

Fourth, never backtrack. A placed queen is never moved or removed.

This is the "fail-first" or minimum-remaining-values heuristic. This heuristic comes from constraint search (Haralick and Elliott, 1980, "Increasing tree search efficiency for constraint satisfaction problems", Artificial Intelligence 14(3)). Here, it is used without any search: it is a single pass, with no lookahead, and no undo.

Step S1 is the same conflict filter used by the decision models to build their filtered menu. The rule also uses the count of legal cells per color. The decision models do not receive this count, but they can calculate it from the state they receive.

Example. On Board 5-2, at step 3, the legal cells remaining are A 2, C 2, and D 3. A and C tie with two legal cells; the earlier letter, A, is chosen. A's legal cells are r2c1 and r3c1. Reading order selects r2c1. This cell is off the solution, so the scored run stops with 2 correct queens.

## Scoring determines when a board is solved

Every board has exactly one solution. The scorer uses this solution only to check each newly placed queen. It stops at the first queen that is not part of the solution. The scorer never chooses a color or a cell. A board is considered solved only if all its queens are placed without leaving the solution.

A forced step cannot fail. While all queens on the board are part of the solution, every unplaced color still has at least one legal cell that is part of the solution. Thus, a color with only one legal cell has exactly that cell remaining, and no color runs out of options. On these 201 boards, 563 of 818 scored steps were forced, and none left the solution. All 117 failures occurred at steps with two or more legal cells (94 with 2, 19 with 3, 4 with 4). These failures happened because reading order selected a wrong cell.

Every failure leads to a dead end. The records keep applying the rule after the scored stop, without the solution. On all 117 failing boards, the rule reaches a color with no legal cell before every color has a queen. This means that a complete legal placement is a solution, the board has only one, and the run has already deviated from it.

## Results show the rule's efficiency

Table: BOARDS SOLVED, ORIGINAL NINE BOARDS

| SIZE | GREEDY RULE | JEV 1.13 | SUBQ SNAP | RANDOM CHOICE, EXPECTED |
| --- | --- | --- | --- | --- |
| 5×5 | 2/3 | 1/3 | 2/3 | ≈1.1 |
| 7×7 | 1/3 | 0/3 | 0/3 | ≈0.2 |
| 9×9 | 1/3 | 0/3 | 0/3 | ≈0.0 |
| All sizes | 4/9 | 1/9 | 2/9 | ≈1.3 |

Table: BOARDS SOLVED, NEW 192-BOARD PANEL

| SIZE | GREEDY RULE | JEV 1.13 | SUBQ SNAP | RANDOM CHOICE, EXPECTED |
| --- | --- | --- | --- | --- |
| 5×5 | 42/64 | 14/64 | 16/64 | ≈6.0 |
| 7×7 | 24/64 | 7/64 | 3/64 | ≈0.9 |
| 9×9 | 14/64 | 0/64 | 0/64 | ≈0.1 |
| All sizes | 80/192 | 21/192 | 19/192 | ≈7.1 |

The rule makes one deterministic pass per board. A model counts a board as solved if any attempt solved it: ten per board on the original nine (five raw, five filtered), and two on the panel (one each). The Model and Random columns are derived from scoreboard.json. The random value is an exact expectation, not a single run. The rule's results match the scoreboard's greedy baseline on every board.

### By board type

A singleton board has at least one color with only one legal cell, meaning its first queen is forced. The search tier splits each size and singleton group based on the development pool's median search effort. This effort is measured by the log₂ of nodes, averaged over the board's eight rotations and reflections. The rule solves 60 of 96 singleton boards and 20 of 96 non-singleton boards.

Table: GREEDY RULE ON THE 192-BOARD PANEL, BY STRATUM

| STRATUM | 5×5 | 7×7 | 9×9 | ALL SIZES |
| --- | --- | --- | --- | --- |
| Singleton · lower search | 14/16 | 12/16 | 8/16 | 34/48 |
| Singleton · higher search | 13/16 | 9/16 | 4/16 | 26/48 |
| No singleton · lower search | 9/16 | 2/16 | 2/16 | 13/48 |
| No singleton · higher search | 6/16 | 1/16 | 0/16 | 7/48 |

### Where the rule fails

47 of the 112 failing panel boards fail at Step 1. This happens when the most constrained color already has two or more legal cells, and the color chosen by reading order is incorrect.

Table: FIRST OFF-SOLUTION STEP, FAILING PANEL BOARDS

| STEP | 5×5 | 7×7 | 9×9 |
| --- | --- | --- | --- |
| Step 1 | 14 | 17 | 16 |
| Step 2 | 7 | 11 | 9 |
| Step 3 | 1 | 2 | 7 |
| Step 4 | 0 | 6 | 5 |
| Step 5 | 0 | 4 | 4 |
| Step 6 | — | 0 | 6 |
| Step 7 | — | 0 | 3 |
| Failing boards | 22 | 40 | 50 |

## Replays illustrate the process

Pick a board, or start with a featured one. The highlighted color is the one the rule selects. Dashed circles mark its legal cells.

Figure caption: 9×9 board, 1-based coordinates. Viewer colors distinguish region labels; they are not a new model input.

Playback advances saved states every 1.8 seconds for illustration. This speed does not represent API latency, model thinking speed, or an unrecorded search path.

### The rule completes board 9-2; every step is forced

Two states are shown per step: the count of legal cells for every unplaced color, and then the placement. Steps after the first off-solution queen continue the same rule and are not scored.

#### Empty board

A 9×9 board has 9 colors and no queens. Each step counts the legal cells for every unplaced color, then places one queen.

The same board, when run by the decision models: Jev 1.13 solved 0 of 10 attempts (raw 0/5, filtered 0/5). SubQ Snap solved 0 of 10 attempts (raw 0/5, filtered 0/5).

This was computed offline by the frozen rule from the board's region grid, not recorded from a model. No request was sent.

## Implementation and checks

- `scripts/subq/boards.py greedy`: this is the frozen rule (methods critique, section 3). Its result for each panel board is stored in the board corpus and feeds the panel's greedy baseline.
- `scripts/analysis/build_scoreboard.py greedy`: this is an independent implementation. It fills the scoreboard's greedy baseline for the original nine boards.
- `scripts/analysis/methods_critique_calculations.py`: this is the first count, on the nine original boards, for the methods critique.
- `scripts/analysis/greedy_trajectories.py`: this writes the step records used on this page. It checks every scored result against the first two implementations on all 201 boards and fails if there is any mismatch.
- `scripts/verify-greedy-trajectories.mjs` (npm run greedy:verify): this recomputes every step in JavaScript from the region grids alone. It finds each board's solution by search, then checks the totals against the scoreboard and both facts under Scoring.