#!/usr/bin/env python3
"""Build one summary receipt per board of the 36-board image panel: public/evidence/board-receipts/.

For each board: the region grid, its unique solution, the model-visible image, and every system
that attempted it. That is the four frontier and eight earlier-generation language models (one shot
from the image), Jev 1.13 and SubQ Snap (one raw and one conflict-filtered attempt each, one decision
per call), and the greedy rule. Each system's entry carries its outcome, its written placement where
one can be read, its API cost on this board (cost per request included) and links to every receipt.

The solution is not stored in the corpus. It is recomputed here from the region grid by exhaustive
search, checked to be unique, and checked against the corpus's published solution_sha256 before it
is written. Offline, standard library only:

    python3 -I scripts/analysis/build_board_receipts.py
"""
import hashlib
import json
import pathlib
import sys

HERE = pathlib.Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import build_scoreboard as B  # noqa: E402
import openrouter_costs as OC  # noqa: E402

E = B.E
OUT = E / "board-receipts"
FRONTIER, EARLIER = "2026-10-16-frontier-image-panel", "2026-10-17-earlier-generations-panel"
JEV, SUBQ = "2026-10-16-jev-new-board-panel", "2026-10-15-subq-new-board-panel"
SOLVED = ("strict", "format_only")


def load(path):
    return json.loads((E / path).read_text())


def letters(regions):
    return [[chr(65 + value) for value in row] for row in regions]


def solve(regions):
    """Every solution, as 1-based columns by row (rows, columns, regions once each; no touching)."""
    n, found = len(regions), []

    def place(row, cols, used_cols, used_regions):
        if row == n:
            found.append(list(cols))
            return
        for col in range(n):
            region = regions[row][col]
            if col in used_cols or region in used_regions or (row and abs(cols[-1] - 1 - col) <= 1):
                continue
            place(row + 1, cols + [col + 1], used_cols | {col}, used_regions | {region})

    place(0, [], frozenset(), frozenset())
    return found


def answer(content):
    """(columns, source) from a written answer: the whole reply as the JSON schema object, else exactly one
    schema object embedded in the text; (None, None) when no single placement can be read."""
    if not isinstance(content, str):
        return None, None
    try:
        whole = json.loads(content)
        if isinstance(whole, dict) and isinstance(whole.get("columns_by_row"), list):
            return whole["columns_by_row"], "json"
    except ValueError:
        pass
    decoder, found = json.JSONDecoder(), []
    for start, char in enumerate(content):
        if char != "{":
            continue
        try:
            value, _ = decoder.raw_decode(content, start)
        except ValueError:
            continue
        if isinstance(value, dict) and isinstance(value.get("columns_by_row"), list):
            found.append(value["columns_by_row"])
    distinct = {json.dumps(item) for item in found}
    return (found[0], "extracted") if len(distinct) == 1 else (None, None)


def check(cols, regions, solution):
    """Per-queen marks for a written placement: on the solution or not, and any rule it breaks."""
    n = len(regions)
    if not (isinstance(cols, list) and len(cols) == n and all(isinstance(c, int) and 1 <= c <= n for c in cols)):
        return None
    queens = [(row + 1, col) for row, col in enumerate(cols)]
    conflicts = set()
    for i, (r1, c1) in enumerate(queens):
        for r2, c2 in queens[i + 1:]:
            same_col = c1 == c2
            same_region = regions[r1 - 1][c1 - 1] == regions[r2 - 1][c2 - 1]
            touching = abs(r1 - r2) <= 1 and abs(c1 - c2) <= 1
            if same_col or same_region or touching:
                conflicts |= {(r1, c1), (r2, c2)}
    return [{"cell": [r, c], "on_solution": solution[r - 1] == c, "conflict": (r, c) in conflicts} for r, c in queens]


def receipts_for(study, model, board, costs, records_by_key):
    out = []
    for record in records_by_key.get((study, OC.model_key(model), board), []):
        usd, basis = costs.get(record["id"], (None, "not_run"))
        out.append({"id": record["id"], "run": record["run"], "usd": usd, "basis": basis})
    return out


def spend(receipts):
    known = [r["usd"] for r in receipts if r["usd"] is not None]
    unknown = sum(r["basis"] == "unknown" for r in receipts)
    billed = [r for r in receipts if r["basis"] != "not_run"]
    total = round(sum(known), 9)
    return {"total_usd": total, "requests": len(billed), "unknown": unknown,
            "per_request_usd": round(total / len(billed), 9) if billed and not unknown else None}


def llm_entries(board, regions, solution, costs, records_by_key, frontier, legacy):
    entries = []
    reruns = {(r["model"], r["board_id"]): r for r in frontier.get("reruns", [])}
    for study, summary, cohort in ((FRONTIER, frontier, "frontier"), (EARLIER, legacy, "earlier")):
        for row in (r for r in summary["rows"] if r["board_id"] == board):
            recorded = row.get("state", "recorded") == "recorded"
            receipts = receipts_for(study, row["model"], board, costs, records_by_key)
            graded_id = f"{study}:{row['call_id']}"
            for receipt in receipts:
                receipt["role"] = "graded" if receipt["id"] == graded_id else "re-run"
                if receipt["role"] == "re-run" and (row["model"], board) in reruns:
                    receipt["outcome"] = reruns[(row["model"], board)]["outcome"]
            placement, source = (None, None)
            if recorded:
                response = json.loads((E / f"runs/{study}/{row['call_id']}/response.json").read_text())
                choices = response.get("choices") or []
                content = choices[0].get("message", {}).get("content") if len(choices) == 1 else None
                placement, source = answer(content)
            marks = check(placement, regions, solution) if placement is not None else None
            entries.append({
                "key": row["model"], "name": B.DISPLAY.get(row["model"], row["model"]), **B.author(row["model"]),
                "family": cohort, "provider": "OpenRouter", "study": study, "route": row.get("route"),
                "outcome": row["outcome"] if recorded else "not_run", "solved": recorded and row["outcome"] in SOLVED,
                "placement": placement if marks else None, "placement_source": source if marks else None, "queens": marks,
                "receipt": graded_id if recorded else None, "receipts": receipts, "cost": spend(receipts),
            })
    return entries


def decision_entries(board, costs, records_by_key):
    entries = []
    for study, folder, model, name, provider in ((JEV, "jev-panel", "typesafe/jev-1.13", "Jev 1.13", "OpenRouter"),
                                                 (SUBQ, "subq-panel", B.SUBQ_MODEL, "SubQ Snap (preview)", "SubQ")):
        attempts = {}
        for mode in ("raw", "local"):
            path = E / f"{folder}/trajectories/{board}_{mode}_a1.json"
            attempts[mode] = json.loads(path.read_text())
        receipts = receipts_for(study, model, board, costs, records_by_key)
        for receipt in receipts:
            receipt["role"] = "raw" if "_raw_" in receipt["run"] else "filtered" if "_local_" in receipt["run"] else "other"
        raw, local = attempts["raw"]["success"], attempts["local"]["success"]
        entries.append({
            "key": model, "name": name, **B.author("typesafe/jev" if model.startswith("typesafe/") else "subquadratic/snap"),
            "family": "decision", "provider": provider, "study": study,
            "outcome": "solved_raw" if raw else "solved_filtered" if local else "unsolved", "solved": raw or local,
            "attempts": [{"mode": mode, "success": a["success"], "stop_reason": a["stop_reason"], "steps": a["steps"],
                          "trajectory_id": a["trajectory_id"], "board_id": a["board_id"], "size": a["size"],
                          "http_calls": a.get("http_calls"), "forced_decisions": a.get("forced_decisions"),
                          "correct_queens_before_failure": a.get("correct_queens_before_failure")}
                         for mode, a in attempts.items()],
            "receipts": receipts, "cost": spend(receipts),
        })
    return entries


def main():
    plan, corpus = load("frontier-image-panel/plan.json"), load("subq-panel/corpus.json")
    frontier, legacy = load("frontier-image-panel/summary.json"), load("legacy-panel/summary.json")
    greedy = {b["board_id"]: b for b in load("greedy/trajectories.json")["boards"]}
    images = {row["board_id"]: row["image_sha256"] for row in plan["schedule"]}
    boards = {b["id"]: b for b in corpus["boards"]}
    costs = OC.receipt_costs()
    records_by_key = {}
    for record in OC.records():
        records_by_key.setdefault((record["study"], OC.model_key(record["model"]), record.get("board")), []).append(record)

    order = sorted(plan["selection"]["boards"], key=lambda board: (-boards[board]["size"], plan["selection"]["boards"].index(board)))
    OUT.mkdir(parents=True, exist_ok=True)
    index = []
    for board_id in order:
        board = boards[board_id]
        solutions = solve(board["regions"])
        assert len(solutions) == 1, (board_id, len(solutions))
        solution = solutions[0]
        digest = hashlib.sha256(json.dumps(solution, separators=(",", ":")).encode()).hexdigest()
        assert digest == board["solution_sha256"], board_id
        regions = letters(board["regions"])
        systems = llm_entries(board_id, board["regions"], solution, costs, records_by_key, frontier, legacy)
        for system in systems:  # the grader and the written placement must agree
            if system["solved"]:
                assert system["placement"] == solution, (board_id, system["name"], system["placement"])
            elif system["outcome"] == "wrong":
                assert system["placement"] != solution, (board_id, system["name"])
        systems += decision_entries(board_id, costs, records_by_key)
        g = greedy[board_id]
        systems.append({"key": "greedy", "name": "Greedy rule (no model)", "author": None, "logo": None, "family": "baseline",
                        "provider": None, "outcome": "solved" if g["scored_solved"] else "unsolved", "solved": g["scored_solved"],
                        "greedy": {k: g[k] for k in ("steps", "scored_solved", "scored_correct_prefix", "scored_stop", "continued_queens", "continued_full")},
                        "receipts": [], "cost": {"total_usd": 0.0, "requests": 0, "unknown": 0, "per_request_usd": None}})
        by_provider = {}
        for system in systems:
            if system["provider"]:
                by_provider[system["provider"]] = round(by_provider.get(system["provider"], 0.0) + system["cost"]["total_usd"], 9)
        out = {
            "builder": "scripts/analysis/build_board_receipts.py",
            "board": {"id": board_id, "size": board["size"], "stratum": board["stratum"], "regions": regions,
                      "solution": solution, "solution_check": "recomputed by exhaustive search: unique, and its SHA-256 matches the corpus's solution_sha256",
                      "solution_sha256": board["solution_sha256"], "image": f"assets/{images[board_id]}.png",
                      "profile": {k: board["profile"][k] for k in ("singleton_regions", "propagation_forced_placements", "row_solver_nodes_uniqueness")}},
            "systems": systems,
            "cost": {"total_usd": round(sum(by_provider.values()), 9), "by_provider": by_provider,
                     "requests": sum(s["cost"]["requests"] for s in systems), "unknown": sum(s["cost"]["unknown"] for s in systems)},
        }
        (OUT / f"{board_id}.json").write_text(json.dumps(out, separators=(",", ":")) + "\n")
        index.append({"id": board_id, "size": board["size"], "stratum": board["stratum"], "regions": regions,
                      "solved": sum(s["solved"] for s in systems), "systems": len(systems),
                      "solved_by": [s["name"] for s in systems if s["solved"]],
                      "cost_usd": out["cost"]["total_usd"], "requests": out["cost"]["requests"], "unknown": out["cost"]["unknown"]})
    (OUT / "index.json").write_text(json.dumps({"builder": "scripts/analysis/build_board_receipts.py", "boards": index}, indent=1) + "\n")
    for size in (9, 7, 5):
        mine = [b for b in index if b["size"] == size]
        print(f"{size}x{size}: {len(mine)} boards, systems solving per board {[b['solved'] for b in mine]}, cost ${sum(b['cost_usd'] for b in mine):.2f}")


if __name__ == "__main__":
    main()
