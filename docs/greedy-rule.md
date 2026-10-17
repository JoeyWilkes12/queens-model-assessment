# The greedy rule baseline

The scoreboard's "Greedy rule (no model)" is a fixed four-step rule with no model and no search. It solves 80 of the 192 new panel boards and 4 of the 9 original trajectory boards. Jev 1.13 solved 21 and SubQ Snap 19 of the 192, each with one raw and one filtered attempt per board. Every step of the rule on every board is published in [`public/evidence/greedy/trajectories.json`](../public/evidence/greedy/trajectories.json) and replayed in the book's [Greedy rule baseline](https://joeywilkes12.github.io/queens-model-assessment/#/greedy-rule) chapter.

## Table of contents

- [The rule](#the-rule)
- [Scoring](#scoring)
- [Two properties of the rule](#two-properties-of-the-rule)
- [Results](#results)
- [Where it fails](#where-it-fails)
- [Implementations and checks](#implementations-and-checks)
- [Limits](#limits)

## The rule

1. **List each unplaced color's legal cells.** A cell is legal if it shares no row, column or color with a placed queen and does not touch one, diagonals included.
2. **Take the color with the fewest legal cells.** Ties go to the earlier letter.
3. **Place its first legal cell in reading order:** top row first, left to right.
4. **Never backtrack.** A placed queen is never moved or removed.

This is the "fail-first", or minimum-remaining-values, heuristic from constraint search (Haralick and Elliott, 1980, "Increasing tree search efficiency for constraint satisfaction problems", *Artificial Intelligence* 14(3)). Here it runs with no search: one pass, no lookahead, no undo.

**What it knows compared with the decision models.**
- Step 1 is the same conflict filter that builds the decision models' filtered ("local") menu.
- The rule also uses the number of legal cells per color.
- The decision models are not given that count, but they could compute it from the state they receive (the region grid, every region's cells and the placed queens).

## Scoring

- Each board has exactly one solution.
- The scorer uses it only to check each new queen, and stops at the first queen off that solution. It never chooses a color or a cell.
- A board is solved only if every color receives a queen without leaving the solution.
- The step records also continue past that stop with the same rule and no oracle, so a replay can show where the rule would have ended. Those steps are marked `after_scored_stop` and are never scored.

## Two properties of the rule

**A forced step cannot fail.**
- While every placed queen is on the solution, each unplaced color's own solution cell is still legal. A color with one legal cell therefore has exactly that cell left, and no color can run out.
- On the 201 boards, 563 of the 818 scored steps were forced, and none left the solution.
- All 117 failures came at steps with two or more legal cells, where reading order picked a wrong one: 94 at steps with 2 legal cells, 19 with 3 and 4 with 4.

**Every failure ends in a dead end.**
- On all 117 failing boards, continuing the rule reaches a color with no legal cell before every color has a queen.
- It must: a complete legal placement is a solution, each board has only one, and the run has already left it.

## Results

| Boards | 5×5 | 7×7 | 9×9 | All |
|---|---:|---:|---:|---:|
| Original nine trajectory boards | 2/3 | 1/3 | 1/3 | **4/9** |
| New 192-board panel | 42/64 | 24/64 | 14/64 | **80/192** |

The original-nine solves are `sequence-5-1`, `5-3`, `7-1` and `9-2`. The rule fails on `sequence-5-2` at step 3, the board SubQ solved in all five filtered attempts.

**By stratum, on the panel** (16 boards per cell):

| Stratum | 5×5 | 7×7 | 9×9 | All |
|---|---:|---:|---:|---:|
| Singleton · lower search | 14/16 | 12/16 | 8/16 | 34/48 |
| Singleton · higher search | 13/16 | 9/16 | 4/16 | 26/48 |
| No singleton · lower search | 9/16 | 2/16 | 2/16 | 13/48 |
| No singleton · higher search | 6/16 | 1/16 | 0/16 | 7/48 |

- **Singleton.** A singleton board has at least one one-cell color, so its first queen is forced. The rule solves 60 of the 96 singleton boards and 20 of the 96 without one.
- **Search tier.** The tier splits each size and singleton group at the development pool's median search effort for a row-by-row solver proving the solution unique. Effort is log₂ of the solver's nodes, averaged over the board's eight rotations and reflections.

## Where it fails

First off-solution step on the 112 failing panel boards:

| Step | 5×5 | 7×7 | 9×9 |
|---|---:|---:|---:|
| 1 | 14 | 17 | 16 |
| 2 | 7 | 11 | 9 |
| 3 | 1 | 2 | 7 |
| 4 | — | 6 | 5 |
| 5 | — | 4 | 4 |
| 6 | — | — | 6 |
| 7 | — | — | 3 |
| Failing boards | 22 | 40 | 50 |

47 of the 112 fail at step 1. On those boards even the most constrained color has two or more legal cells on the empty board, and the first in reading order is wrong.

## Implementations and checks

- **`scripts/subq/boards.py` `greedy`** is the frozen rule (methods critique, section 3). Its result for each panel board is stored in the board corpus, and that is the panel's greedy baseline.
- **`scripts/analysis/build_scoreboard.py` `greedy`** is an independent implementation. It fills the scoreboard's baseline for the original nine boards.
- **`scripts/analysis/methods_critique_calculations.py`** made the first count, on the original nine, for the methods critique.
- **`scripts/analysis/greedy_trajectories.py`** writes the step records. It checks every scored result against the first two implementations on all 201 boards and fails on any mismatch.
- **`scripts/verify-greedy-trajectories.mjs`** (`npm run greedy:verify`) recomputes every step in JavaScript from the region grids alone. It finds each board's solution by search, then checks the totals against `scoreboard.json` and both properties above.

To reproduce:

```
python3 scripts/analysis/greedy_trajectories.py
npm run greedy:verify
```

## Limits

- **Not tuned.** The rule is a descriptive baseline, not a tuned policy.
- **Fixed tie-breaks.** Ties go to the earlier letter, then reading order. A different tie-break would solve a different set of boards.
- **Not a ceiling.** It shows what the conflict filter plus one count can do. A search that backtracks solves every board.
- **Different inputs.** The decision models choose from menus they are given. The rule computes its own counts from the same state.
