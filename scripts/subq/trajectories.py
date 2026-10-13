#!/usr/bin/env python3
"""Actual adaptive SubQ color-then-cell construction, matching the Jev protocol.

The complete solver is an offline judge only. It never supplies options or
feedback. Local menus remove immediate row/column/region/touch conflicts only.
"""
import argparse
import collections
import http.client
import itertools
import json
import pathlib
import time

import replay

STUDY = "2026-10-13-subq-trajectories"
RULES = ["Exactly one queen per row, column, and color region.",
         "Queens cannot touch, including diagonally adjacent cells.",
         "Long diagonals are allowed; this is regional Queens, not chess N-Queens.",
         "Exactly one full solution exists. Coordinates are 1-based."]


def cells(board, label):
    return [(r + 1, c + 1) for r, row in enumerate(board["regions"])
            for c, region in enumerate(row) if chr(65 + region) == label]


def violations(board, placed, cell):
    r, c = cell
    region = board["regions"][r - 1][c - 1]
    reasons = []
    if any(r == s for s, d in placed):
        reasons.append("row_reused")
    if any(c == d for s, d in placed):
        reasons.append("column_reused")
    if any(region == board["regions"][s - 1][d - 1] for s, d in placed):
        reasons.append("region_reused")
    if any(max(abs(r - s), abs(c - d)) <= 1 for s, d in placed):
        reasons.append("queens_touch")
    return reasons


def state(board, placed):
    return {"board_id": board["id"], "size": board["size"], "rules": RULES,
            "coordinates": "Rows top to bottom; columns left to right; both start at 1.",
            "region_grid_rows": [[chr(65 + x) for x in row] for row in board["regions"]],
            "regions": {chr(65 + i): [{"row": r, "column": c} for r, c in cells(board, chr(65 + i))]
                        for i in range(board["size"])},
            "placed_queens": [{"row": r, "column": c, "region": chr(65 + board["regions"][r - 1][c - 1])}
                              for r, c in placed],
            "instruction": "Keep placed queens fixed. Select a next decision consistent with the unique complete solution. No backtracking or solution feedback is supplied."}


def region_question(board, placed):
    occupied = {board["regions"][r - 1][c - 1] for r, c in placed}
    return {"type": "choice", "instructions": "Which unoccupied color region should receive the next queen? Choose a region you can place correctly toward the unique complete solution. Any region order may be valid; then a separate request will ask for its cell.",
            "criteria": {chr(65 + i): "Place the next queen in region " + chr(65 + i) + "."
                         for i in range(board["size"]) if i not in occupied}}


def cell_question(board, placed, label, mode):
    candidates = cells(board, label)
    if mode == "local":
        candidates = [cell for cell in candidates if not violations(board, placed, cell)]
    return {"type": "choice", "instructions": f"Which cell in region {label} contains its queen in the unique full solution? Keep all placed queens fixed and consider all rows, columns, regions, and non-touch rules. Select a cell; do not merely prefer a locally legal cell if it makes completion impossible.",
            "criteria": {f"r{r}c{c}": f"Place queen at row {r}, column {c}, region {label}."
                         for r, c in candidates}}


def request(board, placed, phase, mode, label=None):
    current = state(board, placed)
    question = region_question(board, placed) if phase == "region" else cell_question(board, placed, label, mode)
    if phase == "cell":
        current["selected_region"] = label
    return {"model": replay.MODEL, "state": current, "questions": {phase: question}}


def prepare(args):
    source = pathlib.Path(args.evidence)
    historical = replay.read(source / "trajectory-study.json")
    boards = historical["boards"]
    certificates = []
    for board in boards:
        grid = tuple(tuple(chr(65 + x) for x in row) for row in board["regions"])
        truth = replay.solutions(grid)
        assert len(truth) == 1
        # Independent exhaustive permutation enumeration certifies the same truth.
        independent = [tuple(p) for p in itertools.permutations(range(1, len(grid) + 1)) if replay.independent_valid(grid, p)]
        assert tuple(independent) == truth
        certificates.append({"board_id": board["id"], "size": board["size"], "unique_solutions": 1,
                             "board_sha256": replay.sha(replay.encoded(board)), "independent_validators_agree": True})
    # Verify the recreated template against every retained historical trajectory call.
    checked = 0
    manifest = replay.read(source / "manifest.json")
    by_id = {board["id"]: board for board in boards}
    for item in manifest["records"]:
        if item["study"] != "2026-09-30-jev-trajectories" or not item["run"].startswith("sequence-"):
            continue
        old = replay.read(source / item["files"]["request"])
        s = old["state"]
        placed = [(cell["row"], cell["column"]) for cell in s["placed_queens"]]
        phase = next(iter(old["questions"]))
        mode = "local" if "_local_" in item["run"] else "raw"
        recreated = request(by_id[s["board_id"]], placed, phase, mode, s.get("selected_region"))
        assert recreated["state"] == old["state"] and recreated["questions"] == old["questions"], item["id"]
        checked += 1
    # Consecutive depth-first board groups prioritize the previously solved board.
    schedule = [{"trajectory_id": f'{board["id"]}_{mode}_a{rep}', "board_id": board["id"],
                 "size": board["size"], "mode": mode, "replicate": rep}
                for board in boards for rep in range(1, 6) for mode in ("raw", "local")]
    plan = {"study": STUDY, "model": replay.MODEL, "created_utc": replay.now(), "boards": boards,
            "schedule": schedule, "scheduled_trajectories": 90, "certificates": certificates,
            "exact_historical_template_matches": checked,
            "protocol": "Nine original boards; raw/local cell menus; five fresh empty-board attempts per board and mode. Stop on the first local violation or globally unextendable prefix. No feedback or backtracking.",
            "caveats": ["Dynamic accepted placements follow SubQ choices, so later states may differ from Jev. Templates, boards, option ordering, rules and stopping criteria match exactly.",
                        "Singleton menus use a forced harness transition and no inference. Forced decisions and model calls are counted separately.",
                        "Local mode filters immediate row, column, region and touching conflicts only. The full solver never filters candidates or supplies answers.",
                        "All repeated attempts start empty; no prior failure or solution is included. Repetitions do not establish statistical independence.",
                        "The runner is sequential and groups attempts by board for depth-first execution; Jev used four concurrent independent work streams and repetition blocks.",
                        "The nine boards are a small synthetic sample. Some have singleton regions; size is not a human difficulty rating.",
                        "Budget and provider failures stop the campaign and are reported separately from puzzle failures."]}
    replay.save(args.output, plan)
    print(json.dumps({"prepared": str(args.output), "boards": len(boards), "trajectories": 90, "template_matches": checked}), flush=True)


def call(args, output, call_id, req, context):
    directory = output / "runs" / call_id
    if directory.exists():
        raise RuntimeError("Existing call receipt; no automatic re-execution: " + call_id)
    replay.save(directory / "request.json", req)
    replay.save(directory / "started.json", {"started_utc": replay.now(), "request_sha256": replay.sha(replay.encoded(req))})
    print(json.dumps({"event": "request_start", "call_id": call_id, **context}), flush=True)
    start = time.monotonic()
    try:
        reply = replay.broker(args.broker_socket, "POST", "/v1/systemone", req)
    except (OSError, http.client.HTTPException, json.JSONDecodeError) as error:
        reply = {"status": 0, "body": {"error": {"type": type(error).__name__, "message": str(error)}},
                 "elapsed_seconds": time.monotonic() - start, "budget": None}
    replay.save(directory / "response.json", reply["body"])
    replay.save(directory / "broker-receipt.json", reply)
    checked = replay.grade(req, reply["body"]) if reply["status"] == 200 else {"schema_valid": None, "primary_correct": None, "outcome": "request_failure"}
    meta = {"call_id": call_id, **context, "completed_utc": replay.now(), "http_status": reply["status"],
            "elapsed_seconds": reply["elapsed_seconds"], "request_sha256": replay.sha(replay.encoded(req)),
            "response_sha256": replay.sha(replay.encoded(reply["body"])), "budget": reply.get("budget"),
            "returned_model": reply["body"].get("model") if isinstance(reply["body"], dict) else None,
            "usage": reply["body"].get("usage") if isinstance(reply["body"], dict) else None}
    replay.save(directory / "grade.json", checked)
    replay.save(directory / "metadata.json", meta)
    print(json.dumps({"event": "request_complete", "call_id": call_id, "status": reply["status"], "outcome": checked["outcome"], "budget": meta["budget"]}), flush=True)
    if reply["status"] != 200 or not checked["schema_valid"]:
        raise RuntimeError("Request or schema failure; receipt preserved; no automatic retry")
    return reply["body"], meta


def attempt(args, output, board, entry):
    tid = entry["trajectory_id"]
    result = {**entry, "requested_model": replay.MODEL, "started_utc": replay.now(), "steps": [], "success": False,
              "http_calls": 0, "forced_decisions": 0, "api_elapsed_seconds": 0}
    path = output / "trajectories" / (tid + ".json")
    replay.save(path, {**result, "stop_reason": "in_progress"})
    grid = state(board, [])["region_grid_rows"]
    truth = replay.solutions(tuple(tuple(row) for row in grid))
    assert len(truth) == 1
    oracle = truth[0]  # offline judge only; never in a request or published key file
    placed = []
    began = time.monotonic()
    fatal = False
    try:
        for depth in range(1, board["size"] + 1):
            step = {"step": depth}
            result["steps"].append(step)
            rq = request(board, placed, "region", entry["mode"])
            options = rq["questions"]["region"]["criteria"]
            if len(options) == 1:
                label = next(iter(options))
                step.update(region_call=None, region_forced=True)
                result["forced_decisions"] += 1
            else:
                cid = tid + f"_p{depth:02d}_region"
                step.update(region_call=cid, region_forced=False)
                result["http_calls"] += 1
                body, meta = call(args, output, cid, rq, {**entry, "phase": "region", "step": depth, "family": "trajectory"})
                result["api_elapsed_seconds"] += meta["elapsed_seconds"]
                label = body["answers"]["region"]["choice"]
            step["region"] = label
            cq = request(board, placed, "cell", entry["mode"], label)
            options = cq["questions"]["cell"]["criteria"]
            step["candidate_count"] = len(options)
            if not options:
                result["stop_reason"] = "no_locally_legal_cell"
                break
            if len(options) == 1:
                selected = next(iter(options))
                step.update(cell_call=None, cell_forced=True)
                result["forced_decisions"] += 1
            else:
                cid = tid + f"_p{depth:02d}_cell"
                step.update(cell_call=cid, cell_forced=False)
                result["http_calls"] += 1
                body, meta = call(args, output, cid, cq, {**entry, "phase": "cell", "step": depth, "family": "trajectory"})
                result["api_elapsed_seconds"] += meta["elapsed_seconds"]
                selected = body["answers"]["cell"]["choice"]
                step["top_probability"] = body["answers"]["cell"]["probabilities"][selected]
            r, c = selected[1:].split("c")
            cell = (int(r), int(c))
            step.update(cell=list(cell), local_violations=violations(board, placed, cell), on_unique_solution=oracle[cell[0] - 1] == cell[1])
            if step["local_violations"]:
                result["stop_reason"] = "local_rule_violation"
                break
            placed.append(cell)
            if not step["on_unique_solution"]:
                result["stop_reason"] = "globally_unextendable_prefix"
                break
            replay.save(path, {**result, "stop_reason": "in_progress", "placement_prefix": [list(cell) for cell in placed]})
        else:
            columns = [next(c for r, c in placed if r == row) for row in range(1, board["size"] + 1)]
            result["success"] = replay.checks(grid, columns)["correct"] and replay.independent_valid(grid, columns)
            result["stop_reason"] = "solved" if result["success"] else "invalid_complete"
            result["checks"] = replay.checks(grid, columns)
    except (RuntimeError, OSError, ValueError, KeyError) as error:
        result["stop_reason"] = "request_failure"
        result["error"] = str(error)
        fatal = True
    result.update(accepted_queens=len(placed), placement_prefix=[list(cell) for cell in placed],
                  correct_queens_before_failure=sum(step.get("on_unique_solution") is True for step in result["steps"]),
                  elapsed_seconds=time.monotonic() - began, ended_utc=replay.now())
    replay.save(path, result)
    print(json.dumps({"event": "trajectory_complete", "trajectory_id": tid, "stop_reason": result["stop_reason"],
                      "correct_prefix": result["correct_queens_before_failure"], "calls": result["http_calls"]}), flush=True)
    return fatal


def audit(args):
    output = pathlib.Path(args.output)
    plan = replay.read(output / "manifest.json")
    attempts = [replay.read(path) for path in sorted((output / "trajectories").glob("*.json"))]
    calls = []
    for path in sorted((output / "runs").glob("*/metadata.json")):
        meta = replay.read(path)
        req = replay.read(path.parent / "request.json")
        body = replay.read(path.parent / "response.json")
        assert replay.sha(replay.encoded(req)) == meta["request_sha256"]
        assert replay.sha(replay.encoded(body)) == meta["response_sha256"]
        checked = replay.grade(req, body) if meta["http_status"] == 200 else {"schema_valid": None, "primary_correct": None, "outcome": "request_failure"}
        assert checked == replay.read(path.parent / "grade.json")
        calls.append({**meta, "grade": checked})
    groups = collections.defaultdict(list)
    for result in attempts:
        groups[(result["board_id"], result["mode"])].append(result)
    families = [{"board_id": key[0], "mode": key[1], "size": group[0]["size"], "attempts": len(group),
                 "solved": sum(r["success"] for r in group), "stop_reasons": dict(collections.Counter(r["stop_reason"] for r in group)),
                 "model_calls": sum(r["http_calls"] for r in group), "forced_decisions": sum(r["forced_decisions"] for r in group)}
                for key, group in groups.items()]
    summary = {"study": STUDY, "model": replay.MODEL, "updated_utc": replay.now(), "planned_trajectories": 90,
               "attempted_trajectories": len(attempts), "remaining_trajectories": 90 - len(attempts),
               "solved": sum(r["success"] for r in attempts), "boards_solved": len({r["board_id"] for r in attempts if r["success"]}),
               "model_calls": len(calls), "forced_decisions": sum(r["forced_decisions"] for r in attempts),
               "stop_reasons": dict(collections.Counter(r["stop_reason"] for r in attempts)),
               "families": families, "trajectories": attempts, "records": calls, "caveats": plan["caveats"],
               "budget": max(calls, key=lambda r: r["completed_utc"]).get("budget") if calls else None}
    replay.save(output / "summary.json", summary)
    print(json.dumps({"event": "audit", "attempts": len(attempts), "solved": summary["solved"], "model_calls": len(calls), "budget": summary["budget"]}), flush=True)


def run(args):
    plan = replay.read(args.input)
    output = pathlib.Path(args.output)
    replay.save(output / "manifest.json", plan)
    discovery = replay.broker(args.broker_socket, "GET", "/v1/models")
    replay.save(output / "models.json", discovery)
    body = discovery.get("body")
    models = body.get("data") if isinstance(body, dict) else None
    if discovery.get("status") != 200 or not isinstance(models, list) or replay.MODEL not in [m.get("id") for m in models if isinstance(m, dict)]:
        raise RuntimeError("Approved provider model not discovered")
    by_id = {board["id"]: board for board in plan["boards"]}
    completed = 0
    for entry in plan["schedule"]:
        prior = output / "trajectories" / (entry["trajectory_id"] + ".json")
        if prior.exists():
            reason = replay.read(prior)["stop_reason"]
            if reason in ("in_progress", "request_failure"):
                raise RuntimeError("Unresolved prior attempt requires review; no automatic retry: " + entry["trajectory_id"])
            continue
        if completed >= args.limit:
            break
        fatal = attempt(args, output, by_id[entry["board_id"]], entry)
        completed += 1
        audit(args)
        if fatal:
            break
    audit(args)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    commands = parser.add_subparsers(dest="command", required=True)
    prep = commands.add_parser("prepare")
    prep.add_argument("--evidence", default=str(replay.SITE / "public/evidence"))
    prep.add_argument("--output", default=str(replay.HERE / "input/trajectory-input.json"))
    execute = commands.add_parser("run")
    execute.add_argument("--input", default="/input/trajectory-input.json")
    execute.add_argument("--output", default="/output")
    execute.add_argument("--broker-socket", default="/ipc/subq.sock")
    execute.add_argument("--limit", type=int, default=1, help="Maximum NEW trajectories; completed terminal puzzle outcomes are skipped")
    check = commands.add_parser("audit")
    check.add_argument("--output", default="/output")
    args = parser.parse_args()
    {"prepare": prepare, "run": run, "audit": audit}[args.command](args)


if __name__ == "__main__":
    main()
