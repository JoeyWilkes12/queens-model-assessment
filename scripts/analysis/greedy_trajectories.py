"""Step-by-step records of the greedy rule (no model) on every assessed board.

The rule is frozen in scripts/subq/boards.py `greedy` (methods critique section 3):
  1. For every unplaced color region, list its immediately legal cells: no shared
     row, column or region with a placed queen, and not touching one, diagonals
     included (the same filter as the decision models' conflict-filtered menu).
  2. Take the region with the fewest legal cells; ties go to the earlier letter.
  3. Place that region's first legal cell in reading order (row by row, left to right).
  4. Never backtrack.
The scored baseline stops at the first queen off the board's unique solution, or at
an empty menu. These records also continue past that point with the same rule
(no oracle) until a menu is empty or N queens stand, so a replay can show where
the rule would dead-end. Scoring always uses the stop.

Offline and deterministic. Cross-checks every scored result against boards.py
`greedy` and the scoreboard's independent implementation, and fails on any mismatch.

    python3 scripts/analysis/greedy_trajectories.py
"""
import json
import pathlib
import sys

ROOT = pathlib.Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "scripts/subq"))
sys.path.insert(0, str(ROOT / "scripts/analysis"))
import boards as B  # noqa: E402
import build_scoreboard as SB  # noqa: E402

EVIDENCE = ROOT / "public/evidence"
OUT = EVIDENCE / "greedy/trajectories.json"
RULE = ("Take the unplaced color with the fewest legal cells (ties: earlier letter), place its first legal cell "
        "in reading order, never backtrack. Legal = no shared row, column or color with a placed queen and not touching one.")


def letter(g):
    return chr(65 + g)


def trace(grid, solution):
    """grid: region ids (0-based); solution: 1-based column per row. Returns the full no-oracle path."""
    n = len(grid)
    placed, steps = [], []
    scored_stop = None
    for depth in range(1, n + 1):
        options = B.menus(grid, placed)
        region = min(options, key=lambda g: (len(options[g]), g))
        menu_sizes = {letter(g): len(cells) for g, cells in sorted(options.items())}
        tied = sorted(letter(g) for g in options if len(options[g]) == len(options[region]))
        if not options[region]:
            steps.append({"step": depth, "region": letter(region), "menu_sizes": menu_sizes, "tied_regions": tied,
                          "candidates": [], "cell": None, "forced": False, "on_unique_solution": None, "empty_menu": True,
                          "after_scored_stop": scored_stop is not None})
            scored_stop = scored_stop or {"step": depth, "reason": "empty_menu"}
            break
        cell = options[region][0]
        on = solution[cell[0]] == cell[1] + 1
        steps.append({"step": depth, "region": letter(region), "menu_sizes": menu_sizes, "tied_regions": tied,
                      "candidates": [[r + 1, c + 1] for r, c in options[region]], "cell": [cell[0] + 1, cell[1] + 1],
                      "forced": len(options[region]) == 1, "on_unique_solution": on, "empty_menu": False,
                      "after_scored_stop": scored_stop is not None})
        if not on and scored_stop is None:
            scored_stop = {"step": depth, "reason": "off_solution"}
        placed.append(cell)
    scored_prefix = (scored_stop["step"] - 1) if scored_stop else n
    return {"steps": steps, "scored_solved": scored_stop is None, "scored_correct_prefix": scored_prefix,
            "scored_stop": scored_stop or {"step": None, "reason": "solved"},
            "continued_queens": sum(1 for s in steps if s["cell"]), "continued_full": len(placed) == n and all(s["cell"] for s in steps)}


def board_record(board, source):
    grid = board["regions"]
    letters = tuple(tuple(letter(x) for x in row) for row in grid)
    sols = SB.solutions(grid)
    assert len(sols) == 1, board["id"]
    solution = [c + 1 for c in sols[0]]
    result = trace(grid, solution)
    frozen = B.greedy(grid, [c for c in solution])
    assert frozen["solved"] == result["scored_solved"] and frozen["correct_prefix"] == result["scored_correct_prefix"], board["id"]
    assert SB.greedy(grid) == result["scored_solved"], board["id"]
    return {"board_id": board["id"], "size": board["size"], "source": source, "regions": [list(row) for row in letters], **result}


def main():
    records = []
    original = json.loads((EVIDENCE / "trajectory-study.json").read_text())
    for board in original["boards"]:
        records.append(board_record({"id": board["id"], "size": board["size"], "regions": board["regions"]}, "original-nine"))
    corpus = json.loads((EVIDENCE / "subq-panel/corpus.json").read_text())
    for board in corpus["boards"]:
        records.append(board_record(board, "panel-192"))
    by = lambda src, size=None: [r for r in records if r["source"] == src and (size is None or r["size"] == size)]
    totals = {src: {str(size): {"boards": len(by(src, size)), "solved": sum(r["scored_solved"] for r in by(src, size))}
                    for size in (5, 7, 9)} for src in ("original-nine", "panel-192")}
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps({"rule": RULE, "implementation": "scripts/subq/boards.py greedy (frozen); cross-checked against scripts/analysis/build_scoreboard.py greedy",
                               "scoring": "Scored result stops at the first off-solution queen or an empty menu. Steps marked after_scored_stop continue the same rule without the oracle and are never scored.",
                               "totals": totals, "boards": records}, separators=(",", ":")) + "\n")
    print(json.dumps(totals))


if __name__ == "__main__":
    main()
