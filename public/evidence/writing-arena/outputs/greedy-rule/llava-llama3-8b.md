# A one-line rule solves more boards than either decision model.

The rule solves 80 of 192 new boards. Jev 1.13 solved 21 and SubQ Snap 19, each with one raw and one filtered attempt per board.

The rule uses the count of legal cells per color. The decision models are not given that count, but they could compute it from the state they receive.

The rule makes one deterministic pass per board. A model counts a board as solved if any attempt solved it: ten per board on the original nine (five raw, five filtered), two on the panel (one each).

47 of 112 failing panel boards fail at step 1: the most constrained color already has two or more legal cells, and the first in reading order is wrong.

The rule completes board 9×2; every step is forced. The rule computes each step offline by the frozen rule from the board's region grid, not recorded from a model. No request was sent.

The rule's results match the scoreboard's greedy baseline on every board. The rule passes 80 of 192 new boards, and Jev 1.13 passes 21 and SubQ Snap passes 19 with one raw and one filtered attempt per board. The rule's results match the greedy baseline on every board.