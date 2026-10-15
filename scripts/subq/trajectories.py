#!/usr/bin/env python3
"""Actual adaptive SubQ color-then-cell construction, matching the Jev protocol.

The complete solver is an offline judge only. It never supplies options or
feedback. Local menus remove immediate row/column/region/touch conflicts only.

`prepare` defaults to the nine historical boards and the frozen historical
schedule. `prepare --corpus PATH` prepares a new-board panel (default study
2026-10-15-subq-new-board-panel): one attempt per board and mode, interleaved
seeded order, and a frozen spend/request guard enforced before every call.
`analyze` is offline: it labels every offered option of a finished output
directory and computes board-level metrics and baselines. The worker path
(`run`) imports only this file and replay.py; boards.py is imported lazily by
the host-side `prepare` and `analyze` commands.
"""
import argparse
import collections
import http.client
import itertools
import json
import math
import pathlib
import random
import time

import replay

STUDY = "2026-10-13-subq-trajectories"
PANEL_STUDY = "2026-10-15-subq-new-board-panel"
PILOT_STUDY = "2026-10-15-subq-new-board-panel-pilot"
SCHEDULE_SEED = 2026101502
# Mirrors broker.py (asserted in tests); the worker does not mount broker.py.
PRICE_PER_INPUT_TOKEN_USD = 0.05 / 1_000_000
MAX_INPUT_TOKENS = 393216
RESERVATION_USD = MAX_INPUT_TOKENS * 0.05 / 1_000_000
SHARED_LEDGER_CAP_USD = 4.50
PESSIMISTIC_TOKENS_PER_CALL = 5000
PANEL_SPEND_CEILING_USD = 1.45
PILOT_SPEND_CEILING_USD = 0.05
BLOCKING_STOPS = ("in_progress", "request_failure", "censored_guard")
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


def build_schedule(boards, modes=("raw", "local"), repeats=5, order="historical", seed=None, select=None):
    """Trajectory schedule.

    historical: board-major, then replicate, then mode (the frozen 90-entry
    order). interleaved: boards shuffled within size by `seed`, then dealt in
    rounds with one board per size and a shuffled size order per round; both
    modes of a board stay adjacent (so a stop never splits a pair), and within
    each size exactly half the boards (rounded down) run modes[0] first.
    Replicates, if more than one, repeat the whole sequence. select: explicit
    [(board_id, mode), ...] in the given order, one replicate (pilot use).
    """
    by_id = {board["id"]: board for board in boards}
    if select:
        return [{"trajectory_id": f"{board_id}_{mode}_a1", "board_id": board_id, "size": by_id[board_id]["size"],
                 "mode": mode, "replicate": 1, "sequence": i} for i, (board_id, mode) in enumerate(select, 1)]
    if order == "historical":
        return [{"trajectory_id": f'{board["id"]}_{mode}_a{rep}', "board_id": board["id"],
                 "size": board["size"], "mode": mode, "replicate": rep}
                for board in boards for rep in range(1, repeats + 1) for mode in modes]
    if order != "interleaved":
        raise ValueError("Unknown schedule order: " + str(order))
    rng = random.Random(seed)
    pools, first = {}, {}
    for size in sorted({board["size"] for board in boards}):
        group = [board["id"] for board in boards if board["size"] == size]
        rng.shuffle(group)
        flags = [True] * (len(group) // 2) + [False] * (len(group) - len(group) // 2)
        rng.shuffle(flags)
        first.update(zip(group, flags))
        pools[size] = collections.deque(group)
    sequence = []
    block = 0
    while any(pools.values()):
        block += 1
        sizes = [size for size in sorted(pools) if pools[size]]
        rng.shuffle(sizes)
        sequence.extend((block, pools[size].popleft()) for size in sizes)
    schedule = []
    for rep in range(1, repeats + 1):
        for block, board_id in sequence:
            ordered = list(modes) if first[board_id] else list(reversed(modes))
            for position, mode in enumerate(ordered, 1):
                schedule.append({"trajectory_id": f"{board_id}_{mode}_a{rep}", "board_id": board_id,
                                 "size": by_id[board_id]["size"], "mode": mode, "replicate": rep,
                                 "sequence": len(schedule) + 1, "block": block, "mode_position": position})
    return schedule


def max_request_bytes(boards, modes):
    """Upper bound on any request body this protocol can build for these boards:
    a state listing n placed queens (positions are a byte-size proxy only)
    plus the largest question (all regions, or the largest raw region menu)."""
    bound = 0
    for board in boards:
        n = board["size"]
        placed = [(r + 1, c + 1) for r, c in zip(range(n), range(n))]  # n entries; content-size proxy only
        largest = max((chr(65 + i) for i in range(n)), key=lambda label: len(cells(board, label)))
        region = {"model": replay.MODEL, "state": state(board, placed), "questions": {"region": {
            "type": "choice", "instructions": region_question(board, [])["instructions"],
            "criteria": region_question(board, [])["criteria"]}}}
        cell = {"model": replay.MODEL, "state": {**state(board, placed), "selected_region": largest},
                "questions": {"cell": cell_question(board, [], largest, "raw")}}
        bound = max(bound, len(replay.encoded(region)), len(replay.encoded(cell)))
    return bound


def solution_digest(columns):
    """Same bytes as boards.solution_sha256 for an integer column list."""
    return replay.sha(replay.encoded(list(columns)))


def prepare(args):
    corpus = getattr(args, "corpus", None) or "historical"
    if corpus != "historical":
        return prepare_panel(args)
    modes = tuple(getattr(args, "modes", None) or ("raw", "local"))
    repeats = getattr(args, "repeats", None) or 5
    order = getattr(args, "order", None) or "historical"
    study = getattr(args, "study", None) or STUDY
    if (modes, repeats, order) != (("raw", "local"), 5, "historical") and study == STUDY:
        raise SystemExit("The historical study design is frozen; pass a new --study for a changed design")
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
    schedule = build_schedule(boards, modes, repeats, order, getattr(args, "schedule_seed", None))
    plan = {"study": study, "model": replay.MODEL, "created_utc": replay.now(), "boards": boards,
            "schedule": schedule, "scheduled_trajectories": len(schedule), "certificates": certificates,
            "exact_historical_template_matches": checked,
            "protocol": "Nine original boards; raw/local cell menus; five fresh empty-board attempts per board and mode. Stop on the first local violation or globally unextendable prefix. No feedback or backtracking."
            if study == STUDY else f"Nine original boards; modes {'/'.join(modes)}; {repeats} fresh empty-board attempt(s) per board and mode; {order} order. Stop on the first local violation or globally unextendable prefix. No feedback or backtracking.",
            "caveats": ["Dynamic accepted placements follow SubQ choices, so later states may differ from Jev. Templates, boards, option ordering, rules and stopping criteria match exactly.",
                        "Singleton menus use a forced harness transition and no inference. Forced decisions and model calls are counted separately.",
                        "Local mode filters immediate row, column, region and touching conflicts only. The full solver never filters candidates or supplies answers.",
                        "All repeated attempts start empty; no prior failure or solution is included. Repetitions do not establish statistical independence.",
                        "The runner is sequential and groups attempts by board for depth-first execution; Jev used four concurrent independent work streams and repetition blocks.",
                        "The nine boards are a small synthetic sample. Some have singleton regions; size is not a human difficulty rating.",
                        "Budget and provider failures stop the campaign and are reported separately from puzzle failures."]}
    replay.save(args.output, plan)
    print(json.dumps({"prepared": str(args.output), "boards": len(boards), "trajectories": len(schedule), "template_matches": checked}), flush=True)


def certify_corpus_board(board, historical_keys, seen):
    """Re-certify a new board with three solvers before any request is built."""
    import boards as generator  # host-side only; never needed by the worker
    grid = generator.as_grid(board["regions"])
    assert generator.well_formed(grid) and len(grid) == board["size"], board["id"]
    assert generator.all_regions_connected(grid), board["id"] + ": disconnected region"
    certificate = generator.certify(grid)
    assert certificate["unique"] and certificate["solvers_agree"], board["id"] + ": not uniquely solvable"
    letters = tuple(tuple(chr(65 + x) for x in row) for row in grid)
    assert replay.solutions(letters) == (certificate["solution"],), board["id"] + ": replay solver disagrees"
    assert solution_digest(certificate["solution"]) == board["solution_sha256"], board["id"] + ": solution commitment mismatch"
    key = generator.canonical(grid)
    assert key not in historical_keys, board["id"] + ": symmetry duplicate of a historical board"
    assert key not in seen, board["id"] + ": symmetry duplicate within corpus"
    seen.add(key)
    record = {"id": board["id"], "size": board["size"], "regions": board["regions"]}
    assert replay.sha(replay.encoded(record)) == board["board_sha256"], board["id"] + ": board hash mismatch"
    return {"board_id": board["id"], "size": board["size"], "unique_solutions": 1, "board_sha256": board["board_sha256"],
            "canonical_sha256": generator.canonical_sha256(grid), "connected_regions": True,
            "row_solver_mrv_solver_and_replay_solver_agree": True, "not_symmetry_duplicate_of_historical": True}


def prepare_panel(args):
    """Freeze a new-board plan from a corpus file. Solutions never enter the plan."""
    import boards as generator
    corpus_path = pathlib.Path(args.corpus)
    corpus_bytes = corpus_path.read_bytes()
    corpus = json.loads(corpus_bytes)
    role = corpus.get("corpus")
    study = getattr(args, "study", None) or PANEL_STUDY
    select = [tuple(item.split(":")) for item in args.select.split(",")] if getattr(args, "select", None) else None
    if role == "test" and (select or study != PANEL_STUDY):
        raise SystemExit("The test panel runs only as the full frozen study; pilot on the development corpus")
    if role == "development" and study == PANEL_STUDY:
        raise SystemExit("Development boards cannot be scheduled under the test-panel study id")
    if role not in ("test", "development"):
        raise SystemExit("Unknown corpus role")
    modes = tuple(getattr(args, "modes", None) or ("raw", "local"))
    assert set(modes) <= {"raw", "local"} and len(set(modes)) == len(modes)
    repeats = getattr(args, "repeats", None) or 1
    order = getattr(args, "order", None) or "interleaved"
    seed = getattr(args, "schedule_seed", None) or SCHEDULE_SEED
    source = pathlib.Path(args.evidence)
    historical_keys = {generator.canonical(generator.as_grid(b["regions"]))
                       for b in replay.read(source / "trajectory-study.json")["boards"]}
    seen = set()
    certificates = [certify_corpus_board(board, historical_keys, seen) for board in corpus["boards"]]
    boards = [{"id": b["id"], "size": b["size"], "regions": b["regions"], "solution_sha256": b["solution_sha256"]}
              for b in corpus["boards"]]
    if select:
        known = {b["id"] for b in boards}
        assert all(board_id in known and mode in modes for board_id, mode in select), "Unknown pilot selection"
        chosen = {board_id for board_id, _ in select}
        boards = [b for b in boards if b["id"] in chosen]
        certificates = [c for c in certificates if c["board_id"] in chosen]
    schedule = build_schedule(boards, modes, repeats, order, seed, select)
    max_calls = sum(2 * entry["size"] - 1 for entry in schedule)
    ceiling = getattr(args, "spend_ceiling", None) or (PILOT_SPEND_CEILING_USD if role == "development" else PANEL_SPEND_CEILING_USD)
    policy = {"panel_spend_ceiling_usd": ceiling, "max_model_calls": getattr(args, "max_model_calls", None) or max_calls,
              "reservation_per_call_usd": RESERVATION_USD, "price_per_input_token_usd": PRICE_PER_INPUT_TOKEN_USD,
              "max_input_tokens_per_call": MAX_INPUT_TOKENS, "pessimistic_tokens_per_call": PESSIMISTIC_TOKENS_PER_CALL,
              "shared_ledger_cap_usd": SHARED_LEDGER_CAP_USD, "max_request_bytes": max_request_bytes(boards, modes),
              "accounting": "Committed = sum over this output's call receipts of input_tokens x price for HTTP 200 with integer usage, else the full per-call reservation (unknown cost). Mirrors the broker ledger.",
              "per_call_rule": "Before each call: calls + 1 <= max_model_calls; committed + reservation <= panel ceiling; shared ledger estimated + unresolved + reservation <= shared cap; request bytes <= max_request_bytes. Otherwise stop without dispatch (censored_guard).",
              "trajectory_admission_rule": "Before each new trajectory of size n: calls + (2n - 1) <= max_model_calls; committed + (2n - 2) x pessimistic call cost + reservation <= panel ceiling; shared ledger + (2n - 2) x pessimistic call cost + reservation <= shared cap. Otherwise stop before the trajectory starts."}
    plan = {"study": study, "model": replay.MODEL, "created_utc": replay.now(),
            "corpus": {"role": role, "file": corpus_path.name, "sha256": replay.sha(corpus_bytes),
                       "generator_version": corpus.get("generator_version"), "boards": len(corpus["boards"])},
            "boards": boards, "schedule": schedule, "scheduled_trajectories": len(schedule),
            "design": {"modes": list(modes), "repeats": repeats, "order": "select" if select else order,
                       "schedule_seed": None if select else seed, "selection": [list(x) for x in select] if select else None},
            "certificates": certificates, "exact_historical_template_matches": None,
            "template_check": "Not applicable to new boards. The request templates are the same functions verified against every retained historical Jev trajectory call when the historical corpus is prepared.",
            "budget_policy": policy,
            "protocol": f"{len(boards)} new certified boards; modes {'/'.join(modes)}; {repeats} fresh empty-board attempt(s) per board and mode; {'explicit pilot selection' if select else 'seeded interleaved order'}. Stop on the first local violation or globally unextendable prefix. No feedback or backtracking.",
            "caveats": ["Same request templates, rules, option ordering and stopping criteria as the historical trajectory study.",
                        "Singleton menus use a forced harness transition and no inference. Forced decisions and model calls are counted separately.",
                        "Local mode filters immediate row, column, region and touching conflicts only. The full solver never filters candidates or supplies answers.",
                        "Ground-truth solutions are not in this plan; the worker recomputes the unique solution offline and checks it against each board's sha256 commitment before any request.",
                        "Board ids are neutral; stratum, generator and difficulty profile are not in this plan or any request.",
                        "Budget guard, provider and schema failures stop the campaign and are reported separately from puzzle failures; no automatic retries."]}
    replay.save(args.output, plan)
    print(json.dumps({"prepared": str(args.output), "study": study, "boards": len(boards), "trajectories": len(schedule),
                      "max_model_calls": policy["max_model_calls"], "max_request_bytes": policy["max_request_bytes"],
                      "corpus_sha256": plan["corpus"]["sha256"]}), flush=True)


class GuardStop(Exception):
    """A frozen spend/request limit would be exceeded; nothing was dispatched."""

    def __init__(self, reason, detail):
        super().__init__(reason)
        self.reason = reason
        self.detail = detail


def receipt_cost(meta):
    """Ledger-equivalent cost of one receipt: usage if settled, else full reserve."""
    usage = meta.get("usage") if isinstance(meta, dict) else None
    tokens = usage.get("input_tokens") if isinstance(usage, dict) else None
    if meta.get("http_status") == 200 and type(tokens) is int and 0 <= tokens <= MAX_INPUT_TOKENS:
        return tokens * PRICE_PER_INPUT_TOKEN_USD
    return RESERVATION_USD


def tally(output):
    """Calls and committed spend from this output's receipts (source of truth)."""
    calls, committed = 0, 0.0
    runs = pathlib.Path(output) / "runs"
    for directory in sorted(runs.glob("*")) if runs.exists() else []:
        if not directory.is_dir():
            continue
        calls += 1  # any call directory counts, even if it crashed before started.json
        meta = directory / "metadata.json"
        committed += receipt_cost(replay.read(meta)) if meta.exists() else RESERVATION_USD
    return calls, committed


class SpendGuard:
    """Hard per-call and per-trajectory limits for a panel plan's budget_policy."""

    def __init__(self, policy, output, ledger):
        self.policy = policy
        self.output = pathlib.Path(output)
        self.calls, self.committed = tally(output)
        self.ledger = ledger if isinstance(ledger, dict) else None

    def ledger_total(self):
        if not self.ledger or not all(type(self.ledger.get(k)) in (int, float) for k in ("estimated_known_usd", "unresolved_reserve_usd")):
            raise GuardStop("shared_ledger_unknown", "No valid shared-ledger snapshot from the broker")
        return self.ledger["estimated_known_usd"] + self.ledger["unresolved_reserve_usd"]

    def snapshot(self):
        return {"calls": self.calls, "committed_usd": self.committed, "ledger": self.ledger,
                "panel_spend_ceiling_usd": self.policy["panel_spend_ceiling_usd"],
                "max_model_calls": self.policy["max_model_calls"], "updated_utc": replay.now()}

    def save(self):
        replay.save(self.output / "budget-guard.json", self.snapshot())

    def admit_trajectory(self, size):
        p = self.policy
        worst = 2 * size - 1
        reserve = (worst - 1) * p["pessimistic_tokens_per_call"] * p["price_per_input_token_usd"] + p["reservation_per_call_usd"]
        if self.calls + worst > p["max_model_calls"]:
            raise GuardStop("max_model_calls", {"calls": self.calls, "worst_case_trajectory_calls": worst})
        if self.committed + reserve > p["panel_spend_ceiling_usd"] + 1e-12:
            raise GuardStop("panel_spend_ceiling", {"committed_usd": self.committed, "trajectory_reserve_usd": reserve})
        if self.ledger_total() + reserve > p["shared_ledger_cap_usd"] + 1e-12:
            raise GuardStop("shared_ledger_cap", {"ledger_usd": self.ledger_total(), "trajectory_reserve_usd": reserve})

    def before_call(self, req):
        p = self.policy
        size = len(replay.encoded(req))
        if size > p["max_request_bytes"]:
            raise GuardStop("max_request_bytes", {"bytes": size})
        if self.calls + 1 > p["max_model_calls"]:
            raise GuardStop("max_model_calls", {"calls": self.calls})
        if self.committed + p["reservation_per_call_usd"] > p["panel_spend_ceiling_usd"] + 1e-12:
            raise GuardStop("panel_spend_ceiling", {"committed_usd": self.committed})
        if self.ledger_total() + p["reservation_per_call_usd"] > p["shared_ledger_cap_usd"] + 1e-12:
            raise GuardStop("shared_ledger_cap", {"ledger_usd": self.ledger_total()})
        self.calls += 1
        self.committed += p["reservation_per_call_usd"]  # reserved until settled
        self.save()

    def after_call(self, reply, meta):
        self.committed += receipt_cost(meta) - self.policy["reservation_per_call_usd"]
        budget = reply.get("budget") if isinstance(reply, dict) else None
        if isinstance(budget, dict):
            self.ledger = budget
        self.save()


def call(args, output, call_id, req, context):
    directory = output / "runs" / call_id
    if directory.exists():
        raise RuntimeError("Existing call receipt; no automatic re-execution: " + call_id)
    guard = getattr(args, "guard", None)
    if guard is not None:
        guard.before_call(req)  # raises GuardStop before anything is written or sent
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
    if guard is not None:
        guard.after_call(reply, meta)
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
    if "solution_sha256" in board and solution_digest(oracle) != board["solution_sha256"]:
        raise RuntimeError("Solution commitment mismatch; no request sent: " + board["id"])
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
    except GuardStop as stop:
        result["stop_reason"] = "censored_guard"
        result["guard_reason"] = stop.reason
        result["guard_detail"] = stop.detail
        fatal = True
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
    planned = len(plan["schedule"])
    summary = {"study": plan.get("study", STUDY), "model": replay.MODEL, "updated_utc": replay.now(), "planned_trajectories": planned,
               "attempted_trajectories": len(attempts), "remaining_trajectories": planned - len(attempts),
               "solved": sum(r["success"] for r in attempts), "boards_solved": len({r["board_id"] for r in attempts if r["success"]}),
               "model_calls": len(calls), "forced_decisions": sum(r["forced_decisions"] for r in attempts),
               "stop_reasons": dict(collections.Counter(r["stop_reason"] for r in attempts)),
               "families": families, "trajectories": attempts, "records": calls, "caveats": plan["caveats"],
               "budget": max(calls, key=lambda r: r["completed_utc"]).get("budget") if calls else None}
    if "budget_policy" in plan:
        calls_reserved, committed = tally(output)
        summary["guard"] = {"policy": plan["budget_policy"], "call_directories": calls_reserved,
                            "committed_usd_from_receipts": committed,
                            "censored_trajectories": sum(r["stop_reason"] == "censored_guard" for r in attempts),
                            "request_failures": sum(r["stop_reason"] == "request_failure" for r in attempts),
                            "unstarted_trajectories": planned - len(attempts)}
    replay.save(output / "summary.json", summary)
    print(json.dumps({"event": "audit", "attempts": len(attempts), "solved": summary["solved"], "model_calls": len(calls), "budget": summary["budget"]}), flush=True)


def verify_commitments(plan):
    """Panel plans: recompute every board's solution offline and match its commitment."""
    for board in plan["boards"]:
        if "solution_sha256" not in board:
            continue
        truth = replay.solutions(tuple(tuple(chr(65 + x) for x in row) for row in board["regions"]))
        if len(truth) != 1 or solution_digest(truth[0]) != board["solution_sha256"]:
            raise RuntimeError("Board certification/commitment failed before any request: " + board["id"])


def run(args):
    plan = replay.read(args.input)
    output = pathlib.Path(args.output)
    prior_manifest = output / "manifest.json"
    if prior_manifest.exists() and replay.sha(replay.encoded(replay.read(prior_manifest))) != replay.sha(replay.encoded(plan)) and "budget_policy" in plan:
        raise RuntimeError("Output directory holds a different frozen plan; refusing to mix studies")
    verify_commitments(plan)
    replay.save(output / "manifest.json", plan)
    guard = None
    if "budget_policy" in plan:
        health = replay.broker(args.broker_socket, "GET", "/health")
        guard = SpendGuard(plan["budget_policy"], output, health.get("budget") if isinstance(health, dict) else None)
        try:
            guard.ledger_total()  # no valid shared-ledger snapshot: stop before discovery
        except GuardStop as stop:
            raise RuntimeError("Shared ledger snapshot unavailable; nothing dispatched: " + stop.reason) from None
        guard.save()
        args.guard = guard
        print(json.dumps({"event": "guard_start", **guard.snapshot()}), flush=True)
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
            if reason in BLOCKING_STOPS:
                raise RuntimeError("Unresolved prior attempt requires review; no automatic retry: " + entry["trajectory_id"])
            continue
        if completed >= args.limit:
            break
        if guard is not None:
            try:
                guard.admit_trajectory(entry["size"])
            except GuardStop as stop:
                print(json.dumps({"event": "stopped", "reason": "guard_admission", "guard_reason": stop.reason,
                                  "detail": stop.detail, "next_trajectory": entry["trajectory_id"]}), flush=True)
                break
        fatal = attempt(args, output, by_id[entry["board_id"]], entry)
        completed += 1
        audit(args)
        if fatal:
            break
    audit(args)


# ---------------------------------------------------------------- offline analysis

def exact_mcnemar(b, c):
    """Two-sided exact McNemar p-value (binomial test on discordant pairs)."""
    n = b + c
    if n == 0:
        return 1.0
    return min(1.0, 2 * sum(math.comb(n, i) for i in range(min(b, c) + 1)) / 2 ** n)


def holm(pvalues):
    """Holm step-down adjusted p-values for a dict of raw p-values."""
    ordered = sorted(pvalues.items(), key=lambda kv: (kv[1], str(kv[0])))
    adjusted, running = {}, 0.0
    for i, (key, p) in enumerate(ordered):
        running = max(running, min(1.0, (len(ordered) - i) * p))
        adjusted[key] = running
    return adjusted


def calibration(rows, bins=10):
    """Selected-option calibration on normalized probabilities, equal-width bins."""
    rows = [r for r in rows if r.get("selected_probability") is not None]
    if not rows:
        return None
    table = []
    for b in range(bins):
        group = [r for r in rows if min(bins - 1, int(r["selected_probability"] * bins)) == b]
        if group:
            table.append({"bin": b, "n": len(group), "mean_p": sum(r["selected_probability"] for r in group) / len(group),
                          "accuracy": sum(r["chosen_extendable"] for r in group) / len(group)})
    return {"n": len(rows), "ece": sum(t["n"] * abs(t["mean_p"] - t["accuracy"]) for t in table) / len(rows),
            "multiclass_brier": sum(r["brier"] for r in rows) / len(rows), "bins": table}


def survival(values, size):
    return [sum(v >= k for v in values) / len(values) for k in range(size + 1)] if values else None


def board_cluster_survival(rows, key, size):
    """Mean over boards of the within-board fraction reaching k (equal board weight)."""
    by_board = collections.defaultdict(list)
    for row in rows:
        by_board[row["board_id"]].append(row[key])
    curves = [survival(values, size) for values in by_board.values()]
    return [sum(curve[k] for curve in curves) / len(curves) for k in range(size + 1)] if curves else None


def output_loader(output):
    output = pathlib.Path(output)

    def load(call_id):
        directory = output / "runs" / call_id
        if not (directory / "metadata.json").exists():
            return None
        return {"request": replay.read(directory / "request.json"), "response": replay.read(directory / "response.json"),
                "metadata": replay.read(directory / "metadata.json")}
    return load


def analysis(plan, attempts, load_call, strata=None):
    """Label every offered region/cell of every recorded step; no API dispatch.

    Cell labels: locally legal (no row/column/region/touch conflict with the
    accepted prefix), extendable (the prefix plus this cell extends to a full
    solution, by exhaustive search), on the unique solution, forced (menu of
    one, no call), menu size, chosen, and the model's normalized probability
    when a call was made. Probabilities are normalized by their sum (the
    grader already requires the sum within 0.02 of 1).
    """
    import boards as generator
    boards_by_id = {board["id"]: board for board in plan["boards"]}
    grids, truths = {}, {}
    for board_id, board in boards_by_id.items():
        grids[board_id] = generator.as_grid(board["regions"])
        certificate = generator.certify(grids[board_id])
        assert certificate["unique"], board_id
        truths[board_id] = certificate["solution"]
    errors, cells_out, regions_out, decisions, trajectories = [], [], [], [], []

    def check(condition, message):
        if not condition:
            errors.append(message)

    for t in sorted(attempts, key=lambda row: row["trajectory_id"]):
        tid, board_id, mode = t["trajectory_id"], t["board_id"], t["mode"]
        grid, solution = grids[board_id], truths[board_id]
        n = len(grid)
        region_cells = generator.region_cells(grid)
        placed = []
        correct_nonforced = 0
        base = {"trajectory_id": tid, "board_id": board_id, "size": n, "mode": mode, "replicate": t.get("replicate", 1)}
        for step in t["steps"]:
            if "region" not in step:
                break
            local = generator.menus(grid, placed)
            offered = sorted(local)
            region_forced = len(offered) == 1
            check(step.get("region_forced") == region_forced, f"{tid} step {step['step']}: region_forced mismatch")
            region_probs = None
            if step.get("region_call"):
                record = load_call(step["region_call"])
                check(record is not None, f"{tid}: missing receipt {step['region_call']}")
                if record:
                    labels = list(record["request"]["questions"]["region"]["criteria"])
                    check(labels == [chr(65 + g) for g in offered], f"{tid}: region menu differs from reconstruction")
                    answer = (record["response"].get("answers") or {}).get("region") or {}
                    check(answer.get("choice") == step["region"], f"{tid}: region choice differs from receipt")
                    region_probs = answer.get("probabilities")
            total = sum(region_probs.values()) if region_probs else None
            for g in offered:
                label = chr(65 + g)
                regions_out.append({**base, "step": step["step"], "region": label, "raw_menu_size": len(region_cells[g]),
                                    "local_menu_size": len(local[g]), "forced": region_forced, "chosen": label == step["region"],
                                    "probability": region_probs[label] / total if region_probs and total else None})
            if "cell" not in step:
                break
            g = ord(step["region"]) - 65
            menu = region_cells[g] if mode == "raw" else local[g]
            forced = len(menu) == 1
            check(len(menu) == step.get("candidate_count"), f"{tid} step {step['step']}: candidate_count mismatch")
            check(step.get("cell_forced") == forced, f"{tid} step {step['step']}: cell_forced mismatch")
            probs = None
            if step.get("cell_call"):
                record = load_call(step["cell_call"])
                check(record is not None, f"{tid}: missing receipt {step['cell_call']}")
                if record:
                    labels = list(record["request"]["questions"]["cell"]["criteria"])
                    check(labels == [f"r{r + 1}c{c + 1}" for r, c in menu], f"{tid}: cell menu differs from reconstruction")
                    answer = (record["response"].get("answers") or {}).get("cell") or {}
                    check(answer.get("choice") == f"r{step['cell'][0]}c{step['cell'][1]}", f"{tid}: cell choice differs from receipt")
                    probs = answer.get("probabilities")
            total = sum(probs.values()) if probs else None
            chosen = (step["cell"][0] - 1, step["cell"][1] - 1)
            good = []
            for cell in menu:
                label = f"r{cell[0] + 1}c{cell[1] + 1}"
                is_legal = generator.legal(grid, placed, cell)
                is_extendable = is_legal and generator.extendable(grid, placed + [cell])
                if is_extendable:
                    good.append(label)
                cells_out.append({**base, "step": step["step"], "region": step["region"], "cell": label, "menu_size": len(menu),
                                  "forced": forced, "chosen": cell == chosen, "locally_legal": is_legal,
                                  "extendable": is_extendable, "on_solution": solution[cell[0]] == cell[1] + 1,
                                  "probability": probs[label] / total if probs and total else None})
            chosen_label = f"r{chosen[0] + 1}c{chosen[1] + 1}"
            is_legal = generator.legal(grid, placed, chosen)
            on_solution = solution[chosen[0]] == chosen[1] + 1
            check(bool(step.get("local_violations")) == (not is_legal), f"{tid} step {step['step']}: legality mismatch")
            check(step.get("on_unique_solution") == on_solution, f"{tid} step {step['step']}: on_solution mismatch")
            decision = {**base, "step": step["step"], "region": step["region"], "cell": chosen_label, "menu_size": len(menu),
                        "forced": forced, "call_id": step.get("cell_call"), "chosen_locally_legal": is_legal,
                        "chosen_on_solution": on_solution, "chosen_extendable": chosen_label in good,
                        "extendable_options": len(good), "uniform_chance": len(good) / len(menu),
                        "selected_probability": probs[chosen_label] / total if probs and total else None,
                        "true_option_probability": sum(probs[l] for l in good) / total if probs and total else None,
                        "brier": sum((p / total - (l in good)) ** 2 for l, p in probs.items()) if probs and total else None}
            decisions.append(decision)
            if not forced and decision["chosen_extendable"]:
                correct_nonforced += 1
            if not is_legal or not on_solution:
                break
            placed.append(chosen)
        correct = sum(step.get("on_unique_solution") is True for step in t["steps"])
        check(correct == t.get("correct_queens_before_failure", correct), f"{tid}: correct prefix mismatch")
        trajectories.append({**base, "success": t["success"], "stop_reason": t["stop_reason"],
                             "evaluable": t["stop_reason"] not in BLOCKING_STOPS,
                             "correct_placements": correct, "correct_nonforced_cell_decisions": correct_nonforced,
                             "model_calls": t.get("http_calls"), "forced_decisions": t.get("forced_decisions"),
                             "stratum": (strata or {}).get(board_id)})
    baselines = {}
    for board_id in sorted({t["board_id"] for t in trajectories} | set(boards_by_id)):
        grid, solution = grids[board_id], truths[board_id]
        baselines[board_id] = {"size": len(grid), "greedy": generator.greedy(grid, solution),
                               "uniform_random_completion": {m: generator.random_policy_probability(grid, solution, m) for m in ("raw", "local")}}
    groups = []
    for size, mode in sorted({(t["size"], t["mode"]) for t in trajectories}):
        rows = [t for t in trajectories if (t["size"], t["mode"]) == (size, mode) and t["evaluable"]]
        first = [t for t in rows if t["replicate"] == 1]
        boards_in = sorted({t["board_id"] for t in rows})
        nonforced = [d for d in decisions if (d["size"], d["mode"]) == (size, mode) and not d["forced"] and d["call_id"]
                     and next(t for t in trajectories if t["trajectory_id"] == d["trajectory_id"])["evaluable"]]
        groups.append({
            "size": size, "mode": mode, "evaluable_trajectories": len(rows), "boards": len(boards_in),
            "solved_trajectories": sum(t["success"] for t in rows),
            "trajectory_solve_rate": sum(t["success"] for t in rows) / len(rows) if rows else None,
            "board_solve_rate_replicate1": sum(t["success"] for t in first) / len(first) if first else None,
            "boards_solved_any_replicate": sum(any(t["success"] for t in rows if t["board_id"] == b) for b in boards_in),
            "mean_correct_placements": sum(t["correct_placements"] for t in rows) / len(rows) if rows else None,
            "prefix_survival": survival([t["correct_placements"] for t in rows], size),
            "prefix_survival_board_weighted": board_cluster_survival(rows, "correct_placements", size),
            "nonforced_survival": survival([t["correct_nonforced_cell_decisions"] for t in rows], size),
            "stop_reasons": dict(collections.Counter(t["stop_reason"] for t in rows)),
            "model_calls": sum(t["model_calls"] or 0 for t in rows), "forced_decisions": sum(t["forced_decisions"] or 0 for t in rows),
            "nonforced_cell_calls": len(nonforced),
            "nonforced_cell_accuracy": sum(d["chosen_extendable"] for d in nonforced) / len(nonforced) if nonforced else None,
            "nonforced_uniform_chance": sum(d["uniform_chance"] for d in nonforced) / len(nonforced) if nonforced else None,
            "nonforced_mean_selected_probability": (sum(d["selected_probability"] for d in nonforced if d["selected_probability"] is not None)
                                                    / max(1, sum(d["selected_probability"] is not None for d in nonforced))) if nonforced else None,
            "nonforced_calibration": calibration(nonforced),
            "greedy_boards_solved": sum(baselines[b]["greedy"]["solved"] for b in boards_in),
            "random_expected_solved_trajectories": sum(baselines[t["board_id"]]["uniform_random_completion"][mode] for t in rows),
            "random_mean_completion_probability": sum(baselines[b]["uniform_random_completion"][mode] for b in boards_in) / len(boards_in) if boards_in else None,
        })
    paired, pvalues = {}, {}
    for size in sorted({t["size"] for t in trajectories}):
        outcome = {}
        for t in trajectories:
            if t["size"] == size and t["replicate"] == 1:
                outcome.setdefault(t["board_id"], {})[t["mode"]] = t["success"] if t["evaluable"] else None
        complete = {b: o for b, o in outcome.items() if o.get("raw") is not None and o.get("local") is not None}
        b = sum(o["raw"] and not o["local"] for o in complete.values())
        c = sum(o["local"] and not o["raw"] for o in complete.values())
        paired[str(size)] = {"complete_pairs": len(complete), "incomplete_or_censored_pairs": len(outcome) - len(complete),
                             "both_solved": sum(o["raw"] and o["local"] for o in complete.values()), "raw_only": b, "local_only": c,
                             "neither": sum(not o["raw"] and not o["local"] for o in complete.values()),
                             "exact_mcnemar_p": exact_mcnemar(b, c),
                             "difference_local_minus_raw": (c - b) / len(complete) if complete else None}
        if complete:
            pvalues[str(size)] = paired[str(size)]["exact_mcnemar_p"]
    for size, adjusted in holm(pvalues).items():
        paired[size]["holm_adjusted_p"] = adjusted
    strata_rows = []
    if strata:
        keys = sorted({(t["size"], t["mode"], t["stratum"]) for t in trajectories if t["stratum"]})
        for size, mode, key in keys:
            rows = [t for t in trajectories if (t["size"], t["mode"], t["stratum"]) == (size, mode, key) and t["evaluable"]]
            strata_rows.append({"size": size, "mode": mode, "stratum": key, "evaluable_trajectories": len(rows),
                                "solved": sum(t["success"] for t in rows),
                                "greedy_solved_boards": sum(baselines[b]["greedy"]["solved"] for b in {t["board_id"] for t in rows})})
    scheduled = len(plan.get("schedule", []))
    return {"study": plan.get("study"), "analyzed_utc": replay.now(), "consistency_errors": errors,
            "denominators": {"scheduled_trajectories": scheduled, "recorded_trajectories": len(trajectories),
                             "evaluable_trajectories": sum(t["evaluable"] for t in trajectories),
                             "excluded_by_stop_reason": dict(collections.Counter(t["stop_reason"] for t in trajectories if not t["evaluable"])),
                             "unstarted_trajectories": scheduled - len(trajectories)},
            "definitions": {"primary_endpoint": "Paired board-level success, replicate 1, raw vs local within size; exact two-sided McNemar on discordant pairs; Holm across sizes.",
                            "nonforced_cell_accuracy": "Share of model-called (menu > 1) cell decisions whose chosen cell is extendable; chance = mean of extendable options / menu size.",
                            "calibration": "Selected-option probability normalized by the response's probability sum; ten equal-width bins, last bin closed; ECE weighted by bin count; multiclass Brier over the menu with extendable options as positives.",
                            "evaluable": "Trajectories not stopped by request_failure, censored_guard or in_progress. Puzzle failures (local_rule_violation, globally_unextendable_prefix, no_locally_legal_cell) are evaluable failures."},
            "by_size_mode": groups, "paired_raw_vs_local": paired, "strata": strata_rows, "baselines": baselines,
            "trajectories": trajectories, "labels": {"cells": cells_out, "regions": regions_out, "cell_decisions": decisions}}


def analyze(args):
    output = pathlib.Path(args.output)
    plan = replay.read(output / "manifest.json")
    attempts = [replay.read(path) for path in sorted((output / "trajectories").glob("*.json"))]
    strata = None
    if getattr(args, "corpus", None):
        corpus = replay.read(args.corpus)
        strata = {b["id"]: f'{b["stratum"]["singleton_status"]}/{b["stratum"]["tier"]}' for b in corpus["boards"]}
    report = analysis(plan, attempts, output_loader(output), strata)
    report["source_output"] = str(output)
    replay.save(args.report, report)
    print(json.dumps({"event": "analysis", "report": str(args.report), "trajectories": report["denominators"],
                      "paired": report["paired_raw_vs_local"], "consistency_errors": len(report["consistency_errors"])}), flush=True)
    if report["consistency_errors"]:
        raise SystemExit("Receipts and trajectory records disagree; see consistency_errors")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    commands = parser.add_subparsers(dest="command", required=True)
    prep = commands.add_parser("prepare")
    prep.add_argument("--evidence", default=str(replay.SITE / "public/evidence"))
    prep.add_argument("--output", default=None, help="Default: input/trajectory-input.json (historical) or input/panel/panel-input.json")
    prep.add_argument("--corpus", default="historical", help="'historical' (nine original boards) or a corpus JSON from boards.py")
    prep.add_argument("--study", default=None)
    prep.add_argument("--modes", type=lambda text: tuple(text.split(",")), default=None)
    prep.add_argument("--repeats", type=int, default=None, help="Attempts per board and mode (historical 5, panel 1)")
    prep.add_argument("--order", choices=("historical", "interleaved"), default=None)
    prep.add_argument("--schedule-seed", type=int, default=None)
    prep.add_argument("--select", default=None, help="Pilot only: comma-separated board_id:mode pairs from a development corpus")
    prep.add_argument("--spend-ceiling", type=float, default=None, help="Panel plans: USD ceiling on this output's committed spend")
    prep.add_argument("--max-model-calls", type=int, default=None)
    execute = commands.add_parser("run")
    execute.add_argument("--input", default="/input/trajectory-input.json")
    execute.add_argument("--output", default="/output")
    execute.add_argument("--broker-socket", default="/ipc/subq.sock")
    execute.add_argument("--limit", type=int, default=1, help="Maximum NEW trajectories; completed terminal puzzle outcomes are skipped")
    check = commands.add_parser("audit")
    check.add_argument("--output", default="/output")
    study = commands.add_parser("analyze", help="Offline oracle labels, baselines and board-level metrics; no API dispatch")
    study.add_argument("--output", required=True, help="Finished or partial output directory (read only)")
    study.add_argument("--report", required=True, help="Explicit path for the analysis JSON")
    study.add_argument("--corpus", default=None, help="Optional corpus JSON to attach strata")
    args = parser.parse_args()
    if args.command == "prepare" and args.output is None:
        args.output = str(replay.HERE / ("input/trajectory-input.json" if args.corpus == "historical" else "input/panel/panel-input.json"))
    if args.command == "analyze":
        report, source = pathlib.Path(args.report).resolve(), pathlib.Path(args.output).resolve()
        if source == report or source in report.parents:
            raise SystemExit("Write the report outside the analyzed output directory (it may be read-only evidence)")
    {"prepare": prepare, "run": run, "audit": audit, "analyze": analyze}[args.command](args)


if __name__ == "__main__":
    main()
