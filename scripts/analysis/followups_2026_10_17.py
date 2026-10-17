"""Numbers for docs/followups-2026-10-17-report.md, from published evidence only. Offline.

    python3 scripts/analysis/followups_2026_10_17.py
"""
import collections
import json
import pathlib

E = pathlib.Path(__file__).resolve().parents[2] / "public/evidence"
OK = ("strict", "format_only")


def load(path):
    return json.loads((E / path).read_text())


def main():
    legacy = load("legacy-panel/summary.json")
    frontier = load("frontier-image-panel/summary.json")
    out = {"legacy": {}, "frontier": {}, "hardest_boards": {}, "trajectories": {}}
    for source, key in ((legacy, "legacy"), (frontier, "frontier")):
        by = collections.defaultdict(list)
        for row in source["rows"]:
            by[row["model"]].append(row)
        for model, rows in by.items():
            recorded = [r for r in rows if r["state"] == "recorded"]
            out[key][model] = {"recorded": len(recorded), "not_run": len(rows) - len(recorded),
                               "correct": sum(r.get("outcome") in OK for r in recorded),
                               "strict": sum(r.get("outcome") == "strict" for r in recorded),
                               "by_size": {s: f"{sum(r.get('outcome') in OK for r in recorded if r['size'] == s)}/{sum(r['size'] == s for r in recorded)}" for s in (5, 7, 9)},
                               "outcomes": dict(collections.Counter(r.get("outcome") for r in recorded)),
                               "cost_usd": round(sum(r.get("cost_usd") or 0 for r in recorded), 4)}
    # Boards that the most earlier-generation models missed
    misses = collections.Counter(r["board_id"] for r in legacy["rows"] if r["state"] == "recorded" and r.get("outcome") not in OK and "gpt-4.1" not in r["model"])
    out["hardest_boards"] = dict(misses.most_common(8))
    for phase in ("pilot", "main"):
        path = E / f"frontier-trajectories/{phase}.json"
        if path.exists():
            data = json.loads(path.read_text())
            out["trajectories"][phase] = [{k: t[k] for k in ("short", "board_id", "end_reason", "requests", "solved", "final_correct_queens", "first_off_solution_turn", "effects", "cost_usd")}
                                          for t in data["trajectories"]]
    print(json.dumps(out, indent=1))


if __name__ == "__main__":
    main()
