#!/usr/bin/env python3
"""Build the summary leaderboard: public/evidence/leaderboard.json.

Every system that attempted the 36 image-panel boards, read from the published board receipts, plus the
local Qwen pilot, which ran the same images on 12 of those boards (ollama/summary.json). For each system
and board it keeps the outcome, whether the board counts as solved, and the API cost and request count on
that board, so the page can count boards solved and cost to run for any board size, or for the 12-board
local subset, without loading 36 board files. Each system also keeps its price route (batch or on demand),
and the decision models and the rule keep their result on the full 192-board panel the 36 boards came from.
Nothing is re-graded here. Offline, standard library only:

    python3 -I scripts/analysis/build_leaderboard.py
"""
import json
import pathlib

E = pathlib.Path(__file__).resolve().parents[2] / "public" / "evidence"
OUT = E / "leaderboard.json"
LOCAL_SOLVED = ("strict", "format_only")
# How each family met the board: one image and one reply, two menu-guided runs, or no model at all.
METHOD = {"frontier": ("image", 1), "earlier": ("image", 1), "decision": ("menus", 2), "baseline": ("rule", 0)}
LOCAL = [("baseline", "qwen3.5-4b", "Qwen3.5 4B, local"), ("caveman", "qwen3.5-4b-caveman", "Qwen3.5 4B + Caveman, local")]
PANEL_192 = {"typesafe/jev-1.13": "jev-panel/summary.json", "subq-snap-preview": "subq-panel/summary.json"}


def load(path):
    return json.loads((E / path).read_text())


def main():
    index = load("board-receipts/index.json")["boards"]
    boards = [{"id": board["id"], "size": board["size"]} for board in index]
    systems = {}
    for board in boards:
        receipt = load(f"board-receipts/{board['id']}.json")
        for entry in receipt["systems"]:
            method, attempts = METHOD[entry["family"]]
            system = systems.setdefault(entry["key"], {
                "key": entry["key"], "name": entry["name"], "author": entry["author"], "logo": entry["logo"],
                "family": entry["family"], "method": method, "attempts_per_board": attempts,
                "provider": entry["provider"], "route": entry.get("route"), "study": entry.get("study"), "boards": {},
            })
            if system["route"] != entry.get("route"):
                raise SystemExit(f"{entry['key']}: route changes between boards")
            cost = entry.get("cost") or {}
            system["boards"][board["id"]] = {
                "outcome": entry["outcome"], "solved": bool(entry["solved"]),
                "usd": cost.get("total_usd", 0) if entry["family"] != "baseline" else None,
                "requests": cost.get("requests", 0), "unknown": cost.get("unknown", 0),
            }

    greedy = load("greedy/trajectories.json")["totals"]["panel-192"]
    panel_boards = sum(part["boards"] for part in greedy.values())
    for key, path in PANEL_192.items():
        systems[key]["panel_192"] = {"solved": load(path)["boards_solved"], "boards": panel_boards}
    systems["greedy"]["panel_192"] = {"solved": sum(part["solved"] for part in greedy.values()), "boards": panel_boards}

    ollama = load("ollama/summary.json")
    ids = {board["id"] for board in boards}
    local_boards = sorted({row["board_id"] for row in ollama["rows"]}, key=[board["id"] for board in boards].index)
    if not set(local_boards) <= ids:
        raise SystemExit(f"local boards outside the image panel: {sorted(set(local_boards) - ids)}")
    for treatment, key, name in LOCAL:
        rows = [row for row in ollama["rows"] if row["treatment"] == treatment and row["state"] == "recorded"]
        if sorted(row["board_id"] for row in rows) != sorted(local_boards):
            raise SystemExit(f"{treatment}: expected one recorded row per local board")
        systems[key] = {
            "key": key, "name": name, "author": "Qwen", "logo": None, "family": "local", "method": "image",
            "attempts_per_board": 1, "provider": "Ollama", "route": None, "study": ollama["study"],
            "boards": {row["board_id"]: {"outcome": row["outcome"], "solved": row["outcome"] in LOCAL_SOLVED,
                                         "usd": None, "requests": 1, "unknown": 0} for row in rows},
        }

    out = {
        "builder": "scripts/analysis/build_leaderboard.py",
        "sources": ["board-receipts/", "ollama/summary.json"],
        "boards": boards,
        "local_boards": local_boards,
        "systems": list(systems.values()),
    }
    OUT.write_text(json.dumps(out, separators=(",", ":")) + "\n")
    print(f"wrote {OUT.relative_to(E.parents[1])}: {len(out['systems'])} systems, {len(boards)} boards, {len(local_boards)} local")


if __name__ == "__main__":
    main()
