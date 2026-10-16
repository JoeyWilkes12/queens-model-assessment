"""Jev 1.13 on the frozen SubQ new-board panel, through the OpenRouter broker.

Scientific consistency: the board corpus, schedule order, model-visible state,
questions, option order, forced-transition rule, oracle and stopping rule are
exactly those of the SubQ panel (scripts/subq/trajectories.py), which itself
replicates the September Jev trajectory protocol. Only the transport and model
envelope change, back to the historical Jev request: the pinned
`typesafe/jev-1.13` model on OpenRouter's Decisions endpoint with the same
provider block. Every reply must report the build `typesafe/jev-1.13-20260917`
used in September; any other build fails the schema check and stops the run.

    python3 scripts/jev/panel.py prepare  [--pilot]
    python3 scripts/jev/panel.py run      [--pilot] [--limit N]
    python3 scripts/jev/panel.py audit    [--pilot]

Credentials: none here. Requests go to the local broker's Unix socket, which
injects the key. No automatic retries.
"""
import argparse
import collections
import http.client
import json
import pathlib
import socket
import sys
import time

ROOT = pathlib.Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "scripts/subq"))
import replay as R  # noqa: E402
import trajectories as T  # noqa: E402

REQUESTED_MODEL = "typesafe/jev-1.13"
EXPECTED_BUILD = "typesafe/jev-1.13-20260917"
ENDPOINT = "/api/alpha/decisions"
PROVIDER = {"only": ["typesafe"], "order": ["typesafe"], "allow_fallbacks": False,
            "max_price": {"prompt": 0.042, "completion": 0}}
SOCKET = str(pathlib.Path.home() / "Library/Application Support/OpenRouterBroker/openrouter.sock")
STUDIES = {False: ("2026-10-16-jev-new-board-panel", "subq-panel/manifest.json", "output/jev-panel"),
           True: ("2026-10-16-jev-new-board-panel-pilot", "subq-panel/pilot/manifest.json", "output/jev-panel-pilot")}
POLICY = {"spend_ceiling_usd": 0.60, "pilot_spend_ceiling_usd": 0.02, "max_model_calls": 4992,
          "reservation_per_call_usd": 0.001079716,  # the September per-call reservation
          "timeout_seconds": 120}


class Broker(http.client.HTTPConnection):
    def __init__(self, timeout):
        super().__init__("localhost", timeout=timeout)

    def connect(self):
        self.sock = socket.socket(socket.AF_UNIX, socket.SOCK_STREAM)
        self.sock.settimeout(self.timeout)
        self.sock.connect(SOCKET)


def post(body):
    start = time.monotonic()
    connection = Broker(POLICY["timeout_seconds"])
    try:
        connection.request("POST", ENDPOINT, body=R.encoded(body), headers={"Content-Type": "application/json"})
        response = connection.getresponse()
        raw = response.read()
        try:
            parsed = json.loads(raw)
        except json.JSONDecodeError:
            parsed = {"error": {"type": "non_json_body", "bytes": len(raw)}}
        return {"status": response.status, "body": parsed, "elapsed_seconds": time.monotonic() - start}
    finally:
        connection.close()


def jev_request(board, placed, phase, mode, label=None):
    """The SubQ panel request with the historical Jev envelope (model, provider)."""
    frozen = T.request(board, placed, phase, mode, label)
    return {"model": REQUESTED_MODEL, "provider": PROVIDER, "state": frozen["state"], "questions": frozen["questions"]}


def grade(req, body):
    return R.grade(req, body, expected_model=EXPECTED_BUILD)


def cost(meta):
    usage = meta.get("usage") if isinstance(meta, dict) else None
    value = usage.get("cost") if isinstance(usage, dict) else None
    if meta.get("http_status") == 200 and isinstance(value, (int, float)) and value >= 0:
        return float(value)
    return POLICY["reservation_per_call_usd"]  # unknown cost stays reserved


class Guard:
    def __init__(self, output, ceiling):
        self.output, self.ceiling = output, ceiling
        self.calls, self.committed = 0, 0.0
        for meta_path in (output / "runs").glob("*/metadata.json"):
            self.calls += 1
            self.committed += cost(R.read(meta_path))

    def before_call(self):
        if self.calls + 1 > POLICY["max_model_calls"]:
            raise T.GuardStop("max_model_calls", {"calls": self.calls})
        if self.committed + POLICY["reservation_per_call_usd"] > self.ceiling + 1e-12:
            raise T.GuardStop("spend_ceiling", {"committed_usd": self.committed})
        self.calls += 1
        self.committed += POLICY["reservation_per_call_usd"]

    def after_call(self, meta):
        self.committed += cost(meta) - POLICY["reservation_per_call_usd"]
        R.save(self.output / "budget-guard.json", {"calls": self.calls, "committed_usd": self.committed,
                                                  "ceiling_usd": self.ceiling, "updated_utc": R.now()})


def call(output, guard, call_id, req, context):
    directory = output / "runs" / call_id
    if directory.exists():
        raise RuntimeError("Existing call receipt; no automatic re-execution: " + call_id)
    guard.before_call()
    R.save(directory / "request.json", req)
    R.save(directory / "started.json", {"started_utc": R.now(), "request_sha256": R.sha(R.encoded(req))})
    print(json.dumps({"event": "request_start", "call_id": call_id, **context}), flush=True)
    start = time.monotonic()
    try:
        reply = post(req)
    except (OSError, http.client.HTTPException) as error:
        reply = {"status": 0, "body": {"error": {"type": type(error).__name__}}, "elapsed_seconds": time.monotonic() - start}
    R.save(directory / "response.json", reply["body"])
    checked = grade(req, reply["body"]) if reply["status"] == 200 else {"schema_valid": None, "primary_correct": None, "outcome": "request_failure"}
    body = reply["body"] if isinstance(reply["body"], dict) else {}
    meta = {"call_id": call_id, **context, "endpoint": ENDPOINT, "requested_model": REQUESTED_MODEL,
            "completed_utc": R.now(), "http_status": reply["status"], "elapsed_seconds": reply["elapsed_seconds"],
            "request_sha256": R.sha(R.encoded(req)), "response_sha256": R.sha(R.encoded(reply["body"])),
            "returned_model": body.get("model"), "provider": body.get("provider"), "generation_id": body.get("id"),
            "usage": body.get("usage")}
    R.save(directory / "grade.json", checked)
    R.save(directory / "metadata.json", meta)
    guard.after_call(meta)
    print(json.dumps({"event": "request_complete", "call_id": call_id, "status": reply["status"], "outcome": checked["outcome"],
                      "returned_model": meta["returned_model"], "committed_usd": round(guard.committed, 6)}), flush=True)
    if reply["status"] != 200 or not checked["schema_valid"]:
        raise RuntimeError("Request or schema failure; receipt preserved; no automatic retry")
    return body, meta


def attempt(output, guard, board, entry):
    """Line-for-line the SubQ panel attempt loop, with the Jev request and call."""
    tid = entry["trajectory_id"]
    result = {**entry, "requested_model": REQUESTED_MODEL, "started_utc": R.now(), "steps": [], "success": False,
              "http_calls": 0, "forced_decisions": 0, "api_elapsed_seconds": 0}
    path = output / "trajectories" / (tid + ".json")
    R.save(path, {**result, "stop_reason": "in_progress"})
    grid = T.state(board, [])["region_grid_rows"]
    truth = R.solutions(tuple(tuple(row) for row in grid))
    assert len(truth) == 1
    oracle = truth[0]
    if "solution_sha256" in board and T.solution_digest(oracle) != board["solution_sha256"]:
        raise RuntimeError("Solution commitment mismatch; no request sent: " + board["id"])
    placed, began, fatal = [], time.monotonic(), False
    try:
        for depth in range(1, board["size"] + 1):
            step = {"step": depth}
            result["steps"].append(step)
            rq = jev_request(board, placed, "region", entry["mode"])
            options = rq["questions"]["region"]["criteria"]
            if len(options) == 1:
                label = next(iter(options))
                step.update(region_call=None, region_forced=True)
                result["forced_decisions"] += 1
            else:
                cid = tid + f"_p{depth:02d}_region"
                step.update(region_call=cid, region_forced=False)
                result["http_calls"] += 1
                body, meta = call(output, guard, cid, rq, {**entry, "phase": "region", "step": depth, "family": "trajectory"})
                result["api_elapsed_seconds"] += meta["elapsed_seconds"]
                label = body["answers"]["region"]["choice"]
            step["region"] = label
            cq = jev_request(board, placed, "cell", entry["mode"], label)
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
                body, meta = call(output, guard, cid, cq, {**entry, "phase": "cell", "step": depth, "family": "trajectory"})
                result["api_elapsed_seconds"] += meta["elapsed_seconds"]
                selected = body["answers"]["cell"]["choice"]
                step["top_probability"] = body["answers"]["cell"]["probabilities"][selected]
            r, c = selected[1:].split("c")
            cell = (int(r), int(c))
            step.update(cell=list(cell), local_violations=T.violations(board, placed, cell), on_unique_solution=oracle[cell[0] - 1] == cell[1])
            if step["local_violations"]:
                result["stop_reason"] = "local_rule_violation"
                break
            placed.append(cell)
            if not step["on_unique_solution"]:
                result["stop_reason"] = "globally_unextendable_prefix"
                break
            R.save(path, {**result, "stop_reason": "in_progress", "placement_prefix": [list(c) for c in placed]})
        else:
            columns = [next(c for r, c in placed if r == row) for row in range(1, board["size"] + 1)]
            result["success"] = R.checks(grid, columns)["correct"] and R.independent_valid(grid, columns)
            result["stop_reason"] = "solved" if result["success"] else "invalid_complete"
            result["checks"] = R.checks(grid, columns)
    except T.GuardStop as stop:
        result.update(stop_reason="censored_guard", guard_reason=stop.reason, guard_detail=stop.detail)
        fatal = True
    except (RuntimeError, OSError, ValueError, KeyError) as error:
        result.update(stop_reason="request_failure", error=str(error))
        fatal = True
    result.update(accepted_queens=len(placed), placement_prefix=[list(c) for c in placed],
                  correct_queens_before_failure=sum(s.get("on_unique_solution") is True for s in result["steps"]),
                  elapsed_seconds=time.monotonic() - began, ended_utc=R.now())
    R.save(path, result)
    print(json.dumps({"event": "trajectory_complete", "trajectory_id": tid, "stop_reason": result["stop_reason"],
                      "correct_prefix": result["correct_queens_before_failure"], "calls": result["http_calls"]}), flush=True)
    return fatal


def paths(pilot):
    study, source, output = STUDIES[pilot]
    return study, ROOT / "public/evidence" / source, ROOT / output


def prepare(args):
    study, source, output = paths(args.pilot)
    if (output / "manifest.json").exists():
        raise SystemExit("Plan already frozen for " + study + "; refusing to overwrite")
    frozen = R.read(source)
    T.verify_commitments(frozen)
    plan = {**frozen, "study": study, "model": REQUESTED_MODEL, "expected_build": EXPECTED_BUILD, "endpoint": ENDPOINT,
            "provider": PROVIDER, "created_utc": R.now(), "source_plan": {"study": frozen["study"], "created_utc": frozen["created_utc"]},
            "budget_policy": {**POLICY, "ceiling_usd": POLICY["pilot_spend_ceiling_usd" if args.pilot else "spend_ceiling_usd"]},
            "caveats": frozen.get("caveats", []) + [
                "Same boards, schedule order, state, questions and stopping rule as the SubQ panel; only the transport and model envelope differ.",
                "Jev runs on OpenRouter's Decisions route, pinned to typesafe/jev-1.13 with the September provider block; the reply must report build typesafe/jev-1.13-20260917."]}
    R.save(output / "manifest.json", plan)
    print(json.dumps({"event": "prepared", "study": study, "scheduled_trajectories": len(plan["schedule"])}))


def run(args):
    study, _, output = paths(args.pilot)
    plan = R.read(output / "manifest.json")
    T.verify_commitments(plan)
    boards = {b["id"]: b for b in plan["boards"]}
    guard = Guard(output, plan["budget_policy"]["ceiling_usd"])
    done = 0
    for entry in plan["schedule"]:
        path = output / "trajectories" / (entry["trajectory_id"] + ".json")
        if path.exists():
            previous = R.read(path)
            if previous.get("stop_reason") in T.BLOCKING_STOPS:
                raise SystemExit(f"Blocked: {entry['trajectory_id']} is {previous['stop_reason']}; review before continuing")
            continue
        if args.limit is not None and done >= args.limit:
            break
        if attempt(output, guard, boards[entry["board_id"]], entry):
            raise SystemExit("Stopped after a failure or guard stop; receipts preserved")
        done += 1
    audit(args)


def audit(args):
    study, _, output = paths(args.pilot)
    plan = R.read(output / "manifest.json")
    attempts = [R.read(p) for p in sorted((output / "trajectories").glob("*.json"))]
    calls = []
    for meta_path in sorted((output / "runs").glob("*/metadata.json")):
        meta = R.read(meta_path)
        req, body = R.read(meta_path.parent / "request.json"), R.read(meta_path.parent / "response.json")
        assert R.sha(R.encoded(req)) == meta["request_sha256"] and R.sha(R.encoded(body)) == meta["response_sha256"]
        checked = grade(req, body) if meta["http_status"] == 200 else {"schema_valid": None, "primary_correct": None, "outcome": "request_failure"}
        assert checked == R.read(meta_path.parent / "grade.json"), meta_path.parent.name
        calls.append({**meta, "grade": checked})
    planned = len(plan["schedule"])
    summary = {"study": study, "model": REQUESTED_MODEL, "expected_build": EXPECTED_BUILD, "updated_utc": R.now(),
               "planned_trajectories": planned, "attempted_trajectories": len(attempts), "remaining_trajectories": planned - len(attempts),
               "solved": sum(t["success"] for t in attempts), "boards_solved": len({t["board_id"] for t in attempts if t["success"]}),
               "model_calls": len(calls), "forced_decisions": sum(t["forced_decisions"] for t in attempts),
               "stop_reasons": dict(collections.Counter(t["stop_reason"] for t in attempts)),
               "returned_models": dict(collections.Counter(c.get("returned_model") for c in calls)),
               "providers": dict(collections.Counter(c.get("provider") for c in calls)),
               "cost_usd_reported": round(sum(cost(c) for c in calls), 9),
               "trajectories": attempts, "records": calls, "caveats": plan["caveats"]}
    R.save(output / "summary.json", summary)
    print(json.dumps({"event": "audit", "attempts": len(attempts), "solved": summary["solved"], "model_calls": len(calls),
                      "returned_models": summary["returned_models"], "cost_usd_reported": summary["cost_usd_reported"]}), flush=True)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("mode", choices=["prepare", "run", "audit"])
    parser.add_argument("--pilot", action="store_true")
    parser.add_argument("--limit", type=int)
    args = parser.parse_args()
    {"prepare": prepare, "run": run, "audit": audit}[args.mode](args)


if __name__ == "__main__":
    main()
