# A one-line rule solves more boards than either decision model.

On the 192 new boards, a fixed rule with no model and no search solves 80. Jev 1.13 solved 21 and SubQ Snap 19, each with one raw and one filtered attempt per board.

## The rule

The scoreboard's greedy baseline is four steps, applied until every color has a queen or one color has nowhere to go.

List each unplaced color's legal cells. A cell is legal if it shares no row, column or color with a placed queen and does not touch one, diagonals included.

Take the color with the fewest legal cells. Ties go to the earlier letter.

Place its first legal cell in reading order. Top row first, left to right.

Never backtrack. A placed queen is never moved or removed.

This is the "fail-first" or minimum-remaining-values heuristic from constraint search (Haralick and Elliott, 1980, "Increasing tree search efficiency for constraint satisfaction problems", Artificial Intelligence 14(3)), used here with no search at all: one pass, no lookahead, no undo.

Step S1 is the same conflict filter that builds the decision models' filtered menu. The rule also uses the count of legal cells per color. The decision models are not given that count, but they could compute it from the state they receive.

Example. Board 5-2, step 3: legal cells left are A 2 · C 2 · D 3. A and C tie at 2; the earlier letter, A, goes first. A's legal cells are r2c1 and r3c1; reading order takes r2c1. That cell is off the solution, so the scored run stops with 2 correct queens.

## Scoring

Every board has exactly one solution. The scorer uses it only to check each new queen, and stops at the first queen off that solution. It never chooses a color or a cell. A board counts as solved only if all its queens are placed without leaving the solution.

A forced step cannot fail. While every queen on the board is on the solution, each unplaced color's own solution cell is still legal. So a color with one legal cell has exactly that cell left, and no color runs out. On these 201 boards, 563 of 818 scored steps were forced, and none left the solution. All 117 failures came at steps with two or more legal cells (94 with 2, 19 with 3, 4 with 4), where reading order picked a wrong one.

Every failure ends in a dead end. The records keep applying the rule after the scored stop, without the solution. On all 117 failing boards, it reaches a color with no legal cell before every color has a queen. It has to: a complete legal placement is a solution, the board has only one, and the run has already left it.

## Results

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

The rule makes one deterministic pass per board. A model counts a board as solved if any attempt solved it: ten per board on the original nine (five raw, five filtered), two on the panel (one each). Model and random columns come from scoreboard.json; the random value is an exact expectation, not a run. The rule's results match the scoreboard's greedy baseline on every board.

### By board type

A singleton board has at least one one-cell color, so its first queen is forced. The search tier splits each size and singleton group at the development pool's median search effort for a row-by-row solver proving the solution unique (log₂ of nodes, averaged over the board's eight rotations and reflections). The rule solves 60 of 96 singleton boards and 20 of 96 without one.

Table: GREEDY RULE ON THE 192-BOARD PANEL, BY STRATUM

| STRATUM | 5×5 | 7×7 | 9×9 | ALL SIZES |
| --- | --- | --- | --- | --- |
| Singleton · lower search | 14/16 | 12/16 | 8/16 | 34/48 |
| Singleton · higher search | 13/16 | 9/16 | 4/16 | 26/48 |
| No singleton · lower search | 9/16 | 2/16 | 2/16 | 13/48 |
| No singleton · higher search | 6/16 | 1/16 | 0/16 | 7/48 |

### Where the rule fails

47 of 112 failing panel boards fail at step 1: the most constrained color already has two or more legal cells, and the first in reading order is wrong.

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

## Replays

Pick a board, or start with a featured one. The highlighted color is the one the rule takes; dashed circles mark its legal cells.

### The rule completes board 9-2; every step is forced

Two states per step: every unplaced color's legal-cell count, then the placement. Steps after the first off-solution queen continue the same rule and are not scored.

Figure caption: 9×9 board, 1-based coordinates. Viewer colors distinguish region labels; they are not a new model input.

Playback advances saved states every 1.8 seconds for illustration. It does not represent API latency, model thinking speed or an unrecorded search path.

#### Empty board

9×9 board with 9 colors and no queens. Each step counts every unplaced color's legal cells, then places one queen.

Same board, decision models: Jev 1.13 solved 0 of 10 attempts (raw 0/5, filtered 0/5); SubQ Snap solved 0 of 10 attempts (raw 0/5, filtered 0/5).

Computed offline by the frozen rule from the board's region grid, not recorded from a model. No request was sent.

## Implementation and checks

- scripts/subq/boards.py greedy: the frozen rule (methods critique, section 3). Its result for each panel board is stored in the board corpus and feeds the panel's greedy baseline.
- scripts/analysis/build_scoreboard.py greedy: an independent implementation. It fills the scoreboard's greedy baseline for the original nine boards.
- scripts/analysis/methods_critique_calculations.py: the first count, on the nine original boards, for the methods critique.
- scripts/analysis/greedy_trajectories.py writes the step records used on this page. It checks every scored result against the first two implementations on all 201 boards and fails on any mismatch.
- scripts/verify-greedy-trajectories.mjs (npm run greedy:verify) recomputes every step in JavaScript from the region grids alone. It finds each board's solution by search, then checks the totals against the scoreboard and both facts under Scoring.
