"""Publish the one-queen-per-request frontier trajectories into public evidence.

Every turn becomes one manifest record with its request (the full conversation
sent), the final response, metadata and a grade file (parsed action, applied
effect, step labels). A compact file per phase feeds the book's replays, with
paired results on the same boards: the model's 16 October one-shot outcome,
Jev and SubQ (either menu) and the greedy rule. All public JSON goes through
public_scrub (no reasoning_details, user_id or other private fields). Offline.

    python3 scripts/llm_trajectories/publish.py
"""
import collections
import json
import pathlib
import sys

HERE = pathlib.Path(__file__).resolve().parent
ROOT = HERE.parents[1]
sys.path.insert(0, str(HERE))
sys.path.insert(0, str(ROOT / "scripts/analysis"))
sys.path.insert(0, str(ROOT / "scripts/llm_panel"))
import sequential as S  # noqa: E402
from public_scrub import save_public  # noqa: E402
from publish_legacy import rebuild_index  # noqa: E402

PUBLIC = ROOT / "public/evidence"
OUT = PUBLIC / "frontier-trajectories"
KIND = "one-queen-per-request trajectory turn (frontier)"


def turn_outcome(meta):
    if meta["final_status"] != 200:
        return "request_failure"
    labels = meta["labels_after"]
    return "success" if not labels["off_solution"] and not labels["conflicts"] else "model_failure"


def comparisons(board_ids):
    """Paired results on the same boards from already-published evidence."""
    one_shot = collections.defaultdict(dict)
    for row in S.read(PUBLIC / "frontier-image-panel/summary.json")["rows"]:
        if row["board_id"] in board_ids:
            one_shot[row["board_id"]][row["short"]] = row.get("outcome", row.get("state"))
    def solved(path):
        out = collections.defaultdict(bool)
        for t in S.read(PUBLIC / path)["trajectories"]:
            out[t["board_id"]] |= t["stop_reason"] == "solved"
        return out
    jev, subq = solved("jev-panel/trajectories-summary.json"), solved("subq-panel/trajectories-summary.json")
    greedy = {b["board_id"]: b["scored_solved"] for b in S.read(PUBLIC / "greedy/trajectories.json")["boards"]}
    return {b: {"one_shot": one_shot.get(b, {}), "jev_solved": jev.get(b), "subq_solved": subq.get(b), "greedy_solved": greedy.get(b)}
            for b in board_ids}


def main():
    manifest = S.read(PUBLIC / "manifest.json")
    studies = list(S.STUDY.values())
    manifest["records"] = [r for r in manifest["records"] if r["study"] not in studies]
    manifest["studies"] = [s for s in manifest["studies"] if s not in studies]
    published = {}
    for phase, study in S.STUDY.items():
        if not (S.out(phase) / "plan.json").exists():
            continue
        plan = S.read(S.out(phase) / "plan.json")
        boards = S.plan_boards(phase)
        rows = []
        for board in boards:
            for short in S.MODELS:
                summary = S.trajectory_summary(phase, short, board)
                directory = S.tdir(phase, short, board["id"])
                turns = []
                for k in range(1, board["size"] + 1):
                    turn_dir = directory / f"turn-{k:02d}"
                    if not (turn_dir / "metadata.json").exists():
                        break
                    meta = S.read(turn_dir / "metadata.json")
                    dest = PUBLIC / "runs" / study / meta["call_id"]
                    save_public(dest / "request.json", S.read(turn_dir / "request.json"))
                    attempts = sorted(turn_dir.glob("response-attempt*.json"))
                    save_public(dest / "response.json", S.read(attempts[-1]))
                    for path in attempts[:-1]:
                        save_public(dest / path.name, S.read(path))
                    save_public(dest / "metadata.json", {k2: v for k2, v in meta.items() if k2 not in ("visible_text",)})
                    grade = {k2: meta[k2] for k2 in ("turn", "action", "parse_mode", "effect", "detail", "placed_before", "placed_after", "labels_after")}
                    save_public(dest / "grade.json", grade)
                    manifest["records"].append({
                        "id": f"{study}:{meta['call_id']}", "study": study, "board": board["id"], "size": board["size"], "model": meta["model"],
                        "modelVersion": meta.get("returned_model"), "provider": meta.get("provider"), "run": meta["call_id"],
                        "status": "success" if meta["final_status"] == 200 else "error" if meta["final_status"] else "timeout_or_transport_failure",
                        "kind": KIND, "hasResponse": meta["final_status"] == 200, "hasMetadata": True, "hasGrade": True,
                        "partialResponse": False, "assessmentOutcome": turn_outcome(meta),
                        "files": {f: f"runs/{study}/{meta['call_id']}/{f}.json" for f in ("request", "response", "metadata", "grade")},
                        "source": {"family": "frontier-trajectory", "trajectory": summary["trajectory_id"], "turn": k}})
                    usage = meta.get("usage") or {}
                    turns.append({"turn": k, "call_id": meta["call_id"], "effect": meta["effect"], "action": meta["action"],
                                  "parse_mode": meta["parse_mode"], "detail": meta["detail"], "placed_after": meta["placed_after"],
                                  "labels_after": meta["labels_after"], "text": meta["visible_text"], "finish_reason": meta.get("finish_reason"),
                                  "http_attempts": [a["http_status"] for a in meta["attempts"]], "cost_usd": meta.get("cost_usd"),
                                  "completion_tokens": usage.get("completion_tokens"),
                                  "reasoning_tokens": (usage.get("completion_tokens_details") or {}).get("reasoning_tokens"),
                                  "returned_model": meta.get("returned_model"), "provider": meta.get("provider")})
                rows.append({**summary, "turns": turns})
        if (S.out(phase) / "summary.json").exists():
            save_public(OUT / f"{phase}-summary.json", S.read(S.out(phase) / "summary.json"))
        save_public(OUT / f"{phase}-plan.json", plan)
        data = {"study": study, "phase": phase, "models": {s: {"model": m["model"], "route": m["route"]} for s, m in S.MODELS.items()},
                "boards": [{"id": b["id"], "size": b["size"], "regions": S.grid_letters(b)} for b in boards],
                "trajectories": rows, "comparisons": comparisons([b["id"] for b in boards]) if phase == "main" else {},
                "instruction": S.INSTRUCTION, "question_example": S.question(1, 5)}
        save_public(OUT / f"{phase}.json", data)
        manifest["studies"].append(study)
        published[phase] = {"trajectories": len(rows), "turns": sum(len(r["turns"]) for r in rows)}
    save_public(OUT / "index.json", {"phases": sorted(published)})
    if (S.OUT_ROOT / "projection.json").exists():
        save_public(OUT / "projection.json", S.read(S.OUT_ROOT / "projection.json"))
    rebuild_index(manifest)
    save_public(PUBLIC / "manifest.json", manifest)
    print(json.dumps({"published": published, "public_records": len(manifest["records"])}))


if __name__ == "__main__":
    main()
