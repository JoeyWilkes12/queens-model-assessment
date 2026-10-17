"""Frontier models place one queen per request: a turn-by-turn harness.

For each board of size N the harness holds one conversation with the model and
sends at most N requests. Every request carries the decision-model state used
for Jev and SubQ (scripts/subq/trajectories.py `state`: rules, coordinates,
region grid, region cell lists, placed queens), with the instruction adapted to
this protocol and a question asking for one action:

  place   add one queen;
  revise  replace the whole placement, moving any queens and adding at most one;
  stop    end with the current placement.

The harness applies each action exactly as written and never tells the model
whether a queen is correct or legal; the next request simply shows the updated
placement. Deviating from the solution does not stop the attempt. The attempt
ends after request N or a stop, and the final placement is graded. Visible
explanations are encouraged and never scored. The offline judge (the board's
unique solution) labels steps after the fact and is never sent.

Routes: GPT-5.6 Sol through the OpenRouter Batch API (OpenAI only), one batch
per round of turns; Claude Opus 4.8, Gemini 3.1 Pro Preview and Grok 4.6 on
demand with the 16 October panel's provider blocks. See
docs/frontier-trajectories-preregistration.md.

    python3 scripts/llm_trajectories/sequential.py prepare --phase pilot|main [--blocks K]
    python3 scripts/llm_trajectories/sequential.py run --phase pilot|main --model claude-opus-4.8
    python3 scripts/llm_trajectories/sequential.py batch-rounds --phase pilot|main --model gpt-5.6-sol
    python3 scripts/llm_trajectories/sequential.py audit --phase pilot|main
    python3 scripts/llm_trajectories/sequential.py project      # block count rule after the pilot
Credentials: none here; requests go through the local broker socket.
"""
import argparse
import collections
import hashlib
import http.client
import json
import pathlib
import random
import shutil
import signal
import sys
import time

HERE = pathlib.Path(__file__).resolve().parent
ROOT = HERE.parents[1]
sys.path.insert(0, str(ROOT / "scripts/openrouter"))
sys.path.insert(0, str(ROOT / "scripts/subq"))
import campaign as C  # noqa: E402
import replay  # noqa: E402
import trajectories as T  # noqa: E402

STUDY = {"pilot": "2026-10-17-frontier-step-trajectories-pilot", "main": "2026-10-17-frontier-step-trajectories"}
OUT_ROOT = ROOT / "output/frontier-trajectories"
CORPUS = ROOT / "public/evidence/subq-panel/corpus.json"
DEV_CORPUS = ROOT / "public/evidence/subq-panel/development-corpus.json"
PANEL_PLAN = ROOT / "public/evidence/frontier-image-panel/plan.json"
PILOT_BOARDS = ["dev-5-01"]
BLOCK_SEED = 20261017
MAX_BLOCKS = 12  # 12 blocks x (5x5, 7x7, 9x9) = the 36 panel boards
MAX_TOKENS, TIMEOUT, SURCHARGE_RESERVE = 12288, 600, 0.01
RESEND_DELAY_SECONDS = 30
PROJECTION_SAFETY = 1.5

MODELS = {
    "gpt-5.6-sol": {"model": "openai/gpt-5.6-sol", "route": "batch", "prices": (2e-6, 1e-5),
                    "batch_provider": {"only": ["openai"], "allow_fallbacks": False}},
    "claude-opus-4.8": {"model": "anthropic/claude-opus-4.8", "route": "on_demand", "prices": (5e-6, 2.5e-5),
                        "provider": {"order": ["anthropic"], "only": ["anthropic"], "ignore": ["anthropic/fast"],
                                     "allow_fallbacks": False, "require_parameters": True,
                                     "max_price": {"prompt": 5, "completion": 25}}},
    "gemini-3.1-pro-preview": {"model": "google/gemini-3.1-pro-preview", "route": "on_demand", "prices": (2e-6, 1.2e-5),
                               "provider": {"order": ["google-ai-studio"], "only": ["google-ai-studio"],
                                            "ignore": ["google-ai-studio/flex", "google-ai-studio/priority"],
                                            "allow_fallbacks": False, "require_parameters": True,
                                            "max_price": {"prompt": 2, "completion": 12}}},
    "grok-4.6": {"model": "x-ai/grok-4.6", "route": "on_demand", "prices": (2.2e-6, 6.6e-6),
                 "provider": {"order": ["amazon-bedrock/us-west-2"], "only": ["amazon-bedrock/us-west-2"],
                              "allow_fallbacks": False, "require_parameters": True,
                              "max_price": {"prompt": 2.2, "completion": 6.6}}},
}

INSTRUCTION = ("Work toward the unique complete solution. Each request allows one action: place one queen, "
               "revise your placement, or stop. The conversation cannot be restarted, and no solution or "
               "correctness feedback is supplied: placed_queens is exactly your current placement.")
EMPTY_REPLY_PLACEHOLDER = "(no visible reply)"


def utc():
    return C.utc()


def sha(data):
    return hashlib.sha256(data).hexdigest()


read, save = C.read, C.save


def out(phase):
    return OUT_ROOT / phase


# ---------------------------------------------------------------- boards and prompts

def board_index():
    boards = {b["id"]: b for b in read(CORPUS)["boards"]}
    boards.update({b["id"]: b for b in read(DEV_CORPUS)["boards"]})
    return boards


def grid_letters(board):
    return [[chr(65 + x) for x in row] for row in board["regions"]]


def oracle(board):
    truth = replay.solutions(tuple(tuple(row) for row in grid_letters(board)))
    assert len(truth) == 1, board["id"]
    return truth[0]  # 1-based column per row; offline judge only, never sent


def question(k, n):
    return {"type": "next_action",
            "instructions": (f"This is request {k} of at most {n}. Choose one action toward the unique complete solution, "
                             "considering every row, column, region and the non-touch rule. First explain why you chose it; "
                             "explanations are encouraged and are not scored. Then end your reply with the action as one "
                             "JSON object in a ```json code block."),
            "actions": {
                "place": {"json": {"action": "place", "row": f"integer 1-{n}", "column": f"integer 1-{n}"},
                          "effect": "Add one queen; the queens already placed stay where they are."},
                "revise": {"json": {"action": "revise", "queens": [{"row": "integer", "column": "integer"}]},
                           "effect": "Replace your whole placement with this list. You may move any placed queens and add at most one new queen, so the list holds at most one more queen than placed_queens."},
                "stop": {"json": {"action": "stop"}, "effect": "End now; your current placement is your final answer."}},
            "ending": f"The attempt ends after request {n} or when you stop. placed_queens at that point is graded as your final answer."}


def user_message(board, placed, k):
    current = T.state(board, placed)
    current["instruction"] = INSTRUCTION
    return json.dumps({"request": {"number": k, "of": board["size"]}, "state": current, "question": question(k, board["size"])},
                      ensure_ascii=False, separators=(",", ":"))


def request_body(short, messages):
    spec = MODELS[short]
    body = {"model": spec["model"], "messages": messages, "max_tokens": MAX_TOKENS,
            "reasoning": {"effort": "high", "exclude": True}}
    if spec["route"] == "on_demand":
        body.update(stream=False, provider=spec["provider"])
    return body


def worst_case(short, body):
    ip, op = MODELS[short]["prices"]
    est_input_tokens = len(json.dumps(body).encode()) / 3  # conservative bytes-per-token for JSON text
    return est_input_tokens * ip + MAX_TOKENS * op + SURCHARGE_RESERVE


# ---------------------------------------------------------------- actions

def response_text(body):
    if not isinstance(body, dict):
        return None
    message = (body.get("choices") or [{}])[0].get("message") or {}
    content = message.get("content")
    return content if isinstance(content, str) else None


def parse_action(text):
    """Last ```json block that decodes to an object with "action"; else the last such bare object. Never executes text."""
    if not isinstance(text, str):
        return None, "no_text"
    decoder = json.JSONDecoder()
    fenced = []
    position = 0
    while True:
        start = text.find("```json", position)
        if start < 0:
            break
        end = text.find("```", start + 7)
        if end < 0:
            break
        try:
            obj = json.loads(text[start + 7:end])
            if isinstance(obj, dict) and "action" in obj:
                fenced.append(obj)
        except ValueError:
            pass
        position = end + 3
    if fenced:
        return fenced[-1], "fenced"
    bare, offset = [], 0
    while offset < len(text):
        start = text.find("{", offset)
        if start < 0:
            break
        try:
            obj, length = decoder.raw_decode(text[start:])
        except ValueError:
            offset = start + 1
            continue
        if isinstance(obj, dict) and "action" in obj:
            bare.append(obj)
        offset = start + length
    return (bare[-1], "bare") if bare else (None, "no_action_object")


def in_range(value, n):
    return type(value) is int and 1 <= value <= n


def apply_action(board, placed, action):
    """Return (effect, new placement, detail). Invalid actions leave the placement unchanged."""
    n = board["size"]
    if not isinstance(action, dict):
        return "invalid_action", placed, {"why": "no parsable action"}
    kind = action.get("action")
    if kind == "stop":
        return "stopped", placed, {}
    if kind == "place":
        row, column = action.get("row"), action.get("column")
        if not (in_range(row, n) and in_range(column, n)):
            return "invalid_action", placed, {"why": "row/column missing or out of range"}
        if (row, column) in placed:
            return "occupied_cell", placed, {"cell": [row, column]}
        return "placed", placed + [(row, column)], {"cell": [row, column], "violations": T.violations(board, placed, (row, column))}
    if kind == "revise":
        queens = action.get("queens")
        if not isinstance(queens, list) or not all(isinstance(q, dict) and in_range(q.get("row"), n) and in_range(q.get("column"), n) for q in queens):
            return "invalid_action", placed, {"why": "queens list malformed or out of range"}
        cells = [(q["row"], q["column"]) for q in queens]
        if len(set(cells)) != len(cells):
            return "invalid_action", placed, {"why": "duplicate cell in revision"}
        if len(cells) > len(placed) + 1:
            return "revise_too_many", placed, {"why": f"{len(cells)} queens; at most {len(placed) + 1} allowed"}
        return "revised", cells, {"moved_out": [list(c) for c in placed if c not in cells], "added": [list(c) for c in cells if c not in placed]}
    return "invalid_action", placed, {"why": f"unknown action {kind!r}"}


def conflicts(board, placed):
    """Pairs of placed queens that break a rule (row, column, region or touch)."""
    found = []
    for i, a in enumerate(placed):
        for b in placed[i + 1:]:
            reasons = T.violations(board, [b], a)
            if reasons:
                found.append({"queens": [list(a), list(b)], "reasons": reasons})
    return found


def labels(board, placed, solution):
    on = [list(c) for c in placed if solution[c[0] - 1] == c[1]]
    return {"correct_queens": len(on), "off_solution": [list(c) for c in placed if solution[c[0] - 1] != c[1]],
            "conflicts": conflicts(board, placed)}


# ---------------------------------------------------------------- trajectory state

def tid_for(short, board_id):
    return f"{board_id}_{short}"


def tdir(phase, short, board_id):
    return out(phase) / "trajectories" / tid_for(short, board_id)


def load_state(phase, short, board):
    """Rebuild the conversation and placement from recorded turns; resumable and deterministic."""
    directory = tdir(phase, short, board["id"])
    messages, placed, turns, ended = [], [], [], None
    solution = oracle(board)
    for k in range(1, board["size"] + 1):
        turn_dir = directory / f"turn-{k:02d}"
        meta_path = turn_dir / "metadata.json"
        if not meta_path.exists():
            if (turn_dir / "batch-attempt1.json").exists():
                return messages, placed, turns, "awaiting_resend"  # batch item failed once; re-sent next round
            if (turn_dir / "started.json").exists():
                return messages, placed, turns, "incomplete_turn"
            break
        meta = read(meta_path)
        request = read(turn_dir / "request.json")
        messages = request["messages"]
        if meta["final_status"] != 200:
            turns.append(meta)
            return messages, placed, turns, "request_failure"
        reply = meta["visible_text"] if meta["visible_text"] else EMPTY_REPLY_PLACEHOLDER
        messages = messages + [{"role": "assistant", "content": reply}]
        effect, placed_after, detail = apply_action(board, placed, meta["action"])
        assert effect == meta["effect"], (directory, k)
        placed = placed_after
        turns.append(meta)
        if effect == "stopped":
            ended = "stopped"
            break
    else:
        ended = "max_requests"
    if ended is None and len(turns) == board["size"]:
        ended = "max_requests"
    return messages, placed, turns, ended


def next_request(phase, short, board):
    messages, placed, turns, ended = load_state(phase, short, board)
    if ended:
        return None, ended
    k = len(turns) + 1
    messages = messages + [{"role": "user", "content": user_message(board, placed, k)}]
    return {"k": k, "body": request_body(short, messages), "placed": placed}, None


def attempt_cost(short, response, route):
    """Reported usage.cost; batch items carry none, so tokens x batch price (this reproduces batch totals)."""
    usage = (response.get("usage") or {}) if isinstance(response, dict) else {}
    if isinstance(usage.get("cost"), (int, float)):
        return usage["cost"]
    if route == "batch" and isinstance(usage.get("prompt_tokens"), int) and isinstance(usage.get("completion_tokens"), int):
        ip, op = MODELS[short]["prices"]
        return round(usage["prompt_tokens"] * ip + usage["completion_tokens"] * op, 9)
    return None


def record_turn(phase, short, board, k, body, attempts, extra):
    """attempts: list of (status, response, elapsed) for the original send and an optional re-send."""
    turn_dir = tdir(phase, short, board["id"]) / f"turn-{k:02d}"
    status, response, elapsed = attempts[-1]
    for i, (s, r, e) in enumerate(attempts, 1):
        save(turn_dir / f"response-attempt{i}.json", r)
    text = response_text(response) if status == 200 else None
    action, parse_mode = parse_action(text) if status == 200 else (None, "no_response")
    _, placed, _, _ = load_state(phase, short, board)
    effect, placed_after, detail = apply_action(board, placed, action) if status == 200 else ("request_failure", placed, {})
    solution = oracle(board)
    usage = response.get("usage") if isinstance(response, dict) else None
    costs = [attempt_cost(short, r, extra.get("route")) for _, r, _ in attempts]
    meta = {"trajectory_id": tid_for(short, board["id"]), "board_id": board["id"], "size": board["size"], "model": MODELS[short]["model"],
            "short": short, "turn": k, "call_id": f"{tid_for(short, board['id'])}_t{k:02d}", "completed_utc": utc(),
            "final_status": status, "attempts": [{"http_status": s, "elapsed_seconds": e,
                                                  "cost_usd": c, "error": (r.get("error") if isinstance(r, dict) else None)}
                                                 for (s, r, e), c in zip(attempts, costs)],
            "returned_model": response.get("model") if isinstance(response, dict) else None,
            "provider": response.get("provider") if isinstance(response, dict) else None,
            "generation_id": response.get("id") if isinstance(response, dict) else None,
            "finish_reason": ((response.get("choices") or [{}])[0].get("finish_reason") if isinstance(response, dict) else None),
            "usage": usage, "cost_usd": sum(c or 0 for c in costs),
            "cost_source": "tokens x batch price (batch items report no per-item cost)" if extra.get("route") == "batch" else "usage.cost",
            "visible_text": text, "action": action, "parse_mode": parse_mode, "effect": effect, "detail": detail,
            "placed_before": [list(c) for c in placed], "placed_after": [list(c) for c in placed_after],
            "labels_after": labels(board, placed_after, solution), **extra}
    save(turn_dir / "metadata.json", meta)
    print(json.dumps({"event": "turn", "trajectory": meta["trajectory_id"], "turn": k, "status": status, "effect": effect,
                      "queens": len(placed_after), "correct": meta["labels_after"]["correct_queens"], "cost": meta["cost_usd"]}), flush=True)
    return meta


# ---------------------------------------------------------------- plan

STRATA = [("singleton", "lower_search"), ("singleton", "higher_search"), ("no_singleton", "lower_search"), ("no_singleton", "higher_search")]


def block_order():
    """Blocks of one 5x5, one 7x7 and one 9x9 panel board. Within each size, every run of four
    consecutive blocks covers all four strata (singleton status x search tier), so any K that is a
    multiple of 4 is stratum-balanced. Seeded; independent of any result."""
    ids = read(PANEL_PLAN)["selection"]["boards"]
    corpus = {b["id"]: b for b in read(CORPUS)["boards"]}
    rng = random.Random(BLOCK_SEED)
    columns = {}
    for size in (5, 7, 9):
        pools = {st: sorted(i for i in ids if corpus[i]["size"] == size
                            and (corpus[i]["stratum"]["singleton_status"], corpus[i]["stratum"]["tier"]) == st) for st in STRATA}
        for st in STRATA:
            rng.shuffle(pools[st])
        order = []
        for round_index in range(3):
            strata = list(STRATA)
            rng.shuffle(strata)
            order += [pools[st][round_index] for st in strata]
        columns[size] = order
    return [[columns[5][i], columns[7][i], columns[9][i]] for i in range(MAX_BLOCKS)]


def prepare(args):
    path = out(args.phase) / "plan.json"
    if path.exists():
        raise SystemExit("Plan already frozen")
    if args.phase == "pilot":
        boards = PILOT_BOARDS
        blocks = None
    else:
        if not args.blocks or not 1 <= args.blocks <= MAX_BLOCKS:
            raise SystemExit("--blocks K (from `project`) is required for the main phase")
        blocks = block_order()[:args.blocks]
        boards = [b for block in blocks for b in block]
    index = board_index()
    commitments = {b: {"size": index[b]["size"], "board_sha256": index[b].get("board_sha256"), "solution_sha256": index[b].get("solution_sha256")}
                   for b in boards}
    save(path, {"study": STUDY[args.phase], "phase": args.phase, "frozen_utc": utc(), "models": MODELS, "boards": boards,
                "blocks": blocks, "all_blocks_in_order": block_order(), "block_seed": BLOCK_SEED, "max_tokens": MAX_TOKENS,
                "timeout_seconds": TIMEOUT, "reasoning": {"effort": "high", "exclude": True}, "instruction": INSTRUCTION,
                "question_template": question("k", "N"), "commitments": commitments,
                "first_request_example_sha256": sha(user_message(index[boards[0]], [], 1).encode()),
                "harness_sha256": sha(pathlib.Path(__file__).read_bytes())})
    print(json.dumps({"frozen": args.phase, "boards": len(boards), "models": len(MODELS)}))


def plan_boards(phase):
    plan = read(out(phase) / "plan.json")
    assert plan["harness_sha256"] == sha(pathlib.Path(__file__).read_bytes()), "harness changed after the plan was frozen"
    index = board_index()
    return [index[b] for b in plan["boards"]]


# ---------------------------------------------------------------- on demand

class Censored(Exception):
    pass


def send_on_demand(short, call_id, body, turn_dir, attempt):
    """Reserve the worst case under the ledger lock, send once, save the reply at once, settle the cost."""
    name = f"traj-inflight-{call_id}"
    ok, state = C.reserve(name, worst_case(short, body), {"call_id": call_id}, hold_for_legacy=True)
    if not ok:
        raise Censored(json.dumps(state))
    if attempt == 1:
        save(turn_dir / "started.json", {"started_utc": utc(), "request_sha256": sha((turn_dir / "request.json").read_bytes())})
    start = time.monotonic()

    def deadline(signum, frame):
        raise TimeoutError("client timeout")
    signal.signal(signal.SIGALRM, deadline)
    signal.alarm(TIMEOUT)
    try:
        status, response = C.broker("POST", "/api/v1/chat/completions", body, timeout=TIMEOUT + 30)
    except (TimeoutError, OSError, http.client.HTTPException) as error:
        status, response = None, {"error": {"type": type(error).__name__}}
    finally:
        signal.alarm(0)
    elapsed = time.monotonic() - start
    save(turn_dir / f"response-attempt{attempt}.json", response)
    save(turn_dir / f"attempt{attempt}.json", {"http_status": status, "elapsed_seconds": elapsed, "utc": utc()})
    cost = attempt_cost(short, response, "on_demand")
    # An HTTP error body costs nothing; a timeout or transport failure may still bill upstream, so its worst case is kept.
    C.settle(name, cost if cost is not None else (0.0 if status is not None else None), f"on-demand {call_id}")
    return status, response, elapsed


def run(args):
    short = args.model
    assert MODELS[short]["route"] == "on_demand"
    for board in plan_boards(args.phase):
        marker = tdir(args.phase, short, board["id"]) / "censored.json"
        if marker.exists():
            if not args.resume_censored:
                raise SystemExit(f"{tid_for(short, board['id'])} was censored by the budget guard; rerun with --resume-censored to continue")
            marker.rename(marker.with_name(f"censored-resumed-{utc().replace(':', '')}.json"))
        while True:
            nxt, ended = next_request(args.phase, short, board)
            if ended == "incomplete_turn":
                raise SystemExit(f"Incomplete turn in {tid_for(short, board['id'])}; inspect before resuming")
            if ended:
                break
            k, body = nxt["k"], nxt["body"]
            turn_dir = tdir(args.phase, short, board["id"]) / f"turn-{k:02d}"
            call_id = f"{tid_for(short, board['id'])}_t{k:02d}"
            save(turn_dir / "request.json", body)
            try:
                attempts = [send_on_demand(short, call_id, body, turn_dir, 1)]
            except Censored as stop:  # nothing was sent for this turn
                save(marker, {"utc": utc(), "turn": k, "guard": json.loads(str(stop))})
                print(json.dumps({"event": "censored_budget", "trajectory": tid_for(short, board["id"]), "turn": k}), flush=True)
                return
            extra = {"route": "on_demand"}
            if attempts[-1][0] != 200:
                # One identical re-send after a delay, then the attempt ends (preregistered).
                save(turn_dir / "resend", {"utc": utc(), "first_status": attempts[-1][0]})
                time.sleep(RESEND_DELAY_SECONDS)
                try:
                    attempts.append(send_on_demand(short, call_id + "_resend", body, turn_dir, 2))
                except Censored as stop:
                    extra["resend_censored"] = json.loads(str(stop))
            record_turn(args.phase, short, board, k, body, attempts, extra)
            if "resend_censored" in extra:
                save(marker, {"utc": utc(), "turn": k, "guard": extra["resend_censored"], "after_failed_first_attempt": True})
                return


# ---------------------------------------------------------------- batch rounds (GPT-5.6 Sol)

def batch_rounds(args):
    short = args.model
    assert MODELS[short]["route"] == "batch"
    boards = plan_boards(args.phase)
    rounds_dir = out(args.phase) / "batch-rounds" / short
    if (rounds_dir / "censored.json").exists():
        if not args.resume_censored:
            raise SystemExit("Batch rounds were censored by the budget guard; rerun with --resume-censored to continue")
        (rounds_dir / "censored.json").rename(rounds_dir / f"censored-resumed-{utc().replace(':', '')}.json")
    for rdir in sorted(rounds_dir.glob("round-*")) if rounds_dir.exists() else []:
        if (rdir / "submitting.json").exists() and not (rdir / "submission.json").exists():
            raise SystemExit(f"{rdir.name}: submission outcome unknown; reconcile with --batch-id before continuing")
    round_no = len(list(rounds_dir.glob("round-*"))) if rounds_dir.exists() else 0
    # A submitted but unsettled round is resumed, never resubmitted.
    while True:
        open_round = rounds_dir / f"round-{round_no:02d}" if round_no else None
        if open_round and (open_round / "submission.json").exists() and not (open_round / "settled.json").exists():
            settle_round(args.phase, short, open_round, boards)
            continue
        pending = []
        for board in boards:
            nxt, ended = next_request(args.phase, short, board)
            if ended == "incomplete_turn":
                raise SystemExit(f"Turn started outside a settled round in {tid_for(short, board['id'])}; inspect before resuming")
            if ended == "awaiting_resend":
                pending.append((board, None))
            elif not ended:
                pending.append((board, nxt))
        if not pending:
            print(json.dumps({"event": "batch_rounds_complete", "model": short, "rounds": round_no}), flush=True)
            return
        requests, members = [], []
        for board, nxt in pending:
            if nxt is None:
                # Turn submitted earlier whose batch item failed: re-send once with the identical body.
                k = len(load_state(args.phase, short, board)[2]) + 1
                body = read(tdir(args.phase, short, board["id"]) / f"turn-{k:02d}" / "request.json")
            else:
                k, body = nxt["k"], nxt["body"]
                save(tdir(args.phase, short, board["id"]) / f"turn-{k:02d}" / "request.json", body)  # started.json only after submission
            item = dict(body)
            item.pop("model")
            custom_id = f"{tid_for(short, board['id'])}_t{k:02d}" + ("_resend" if nxt is None else "")
            requests.append({"custom_id": custom_id, "body": item})
            members.append({"custom_id": custom_id, "board_id": board["id"], "turn": k, "resend": nxt is None})
        name = f"traj-batch-{short}-{args.phase}-r{round_no + 1:02d}"
        reserve = batch_round_reserve(short, requests)
        ok, state = C.reserve(name, reserve, {"members": len(members)}, hold_for_legacy=True)
        if not ok:
            save(rounds_dir / "censored.json", {"utc": utc(), "guard": state, "members": members})
            print(json.dumps({"event": "censored_budget", "model": short, "round": round_no + 1, **state}), flush=True)
            return
        round_no += 1
        rdir = rounds_dir / f"round-{round_no:02d}"
        payload = {"endpoint": "/v1/chat/completions", "model": MODELS[short]["model"], "provider": MODELS[short]["batch_provider"],
                   "completion_window": "24h", "requests": requests}
        save(rdir / "payload.json", payload)
        save(rdir / "members.json", members)
        save(rdir / "submitting.json", {"utc": utc(), "reserve": name})
        try:
            status, body = C.broker("POST", "/api/v1/batches", payload, timeout=180)
        except (OSError, http.client.HTTPException) as error:
            raise SystemExit(f"Round {round_no}: submission outcome unknown ({type(error).__name__}); reconcile before continuing")
        save(rdir / "submission-response.json", {"http_status": status, "body": body})
        batch_id = (body.get("id") or (body.get("data") or {}).get("id")) if isinstance(body, dict) else None
        if status not in (200, 201, 202) or not batch_id:
            if status is not None and 400 <= status < 500:  # certainly not accepted
                C.release(name, f"HTTP {status} rejection at submit")
                save(rounds_dir / f"rejected-round-{round_no:02d}.json", {"http_status": status, "body": body, "utc": utc()})
                shutil.rmtree(rdir)
            raise SystemExit(f"Round {round_no} submission failed: HTTP {status}")
        attach_round(args.phase, short, rdir, round_no, batch_id, members, reserve)
        settle_round(args.phase, short, rdir, boards)


def attach_round(phase, short, rdir, round_no, batch_id, members, reserve):
    for member in members:
        turn_dir = tdir(phase, short, member["board_id"]) / f"turn-{member['turn']:02d}"
        if member["resend"]:
            save(turn_dir / "resend", {"utc": utc(), "round": round_no})
        else:
            save(turn_dir / "started.json", {"started_utc": utc(), "round": round_no, "batch_id": batch_id,
                                             "request_sha256": sha((turn_dir / "request.json").read_bytes())})
    save(rdir / "submission.json", {"batch_id": batch_id, "submitted_utc": utc(), "requests": len(members), "reserve_usd": reserve})
    if (rdir / "submitting.json").exists():
        (rdir / "submitting.json").unlink()
    print(json.dumps({"event": "round_submitted", "round": round_no, "requests": len(members), "batch_id": batch_id}), flush=True)


def reconcile_round(args):
    """Attach a round whose submission outcome was unknown, once its batch id is found in the account's batch list."""
    rounds_dir = out(args.phase) / "batch-rounds" / args.model
    rdir = next(r for r in sorted(rounds_dir.glob("round-*")) if (r / "submitting.json").exists() and not (r / "submission.json").exists())
    if not args.batch_id:
        status, body = C.broker("GET", "/api/v1/batches", timeout=120)
        items = (body.get("data") if isinstance(body, dict) else None) or []
        print(json.dumps([{k: i.get(k) for k in ("id", "model", "status", "created_at", "request_counts")} for i in items][:20], indent=1))
        return
    name = read(rdir / "submitting.json")["reserve"]
    attach_round(args.phase, args.model, rdir, int(rdir.name.split("-")[1]), args.batch_id, read(rdir / "members.json"),
                 read(C.OUT / "reserves" / f"{name}.json")["reserve_usd"])


def batch_round_reserve(short, requests):
    """Per request: the worst case, or 3x the mean cost of earlier turns of this model if lower."""
    costs = [read(p).get("cost_usd") for p in OUT_ROOT.glob(f"*/trajectories/*_{short}/turn-*/metadata.json")]
    costs = [c for c in costs if isinstance(c, (int, float)) and c > 0]
    mean = sum(costs) / len(costs) if costs else None
    return sum(min(worst_case(short, r["body"]), 3 * mean) if mean else worst_case(short, r["body"]) for r in requests)


def settle_round(phase, short, rdir, boards):
    sub = read(rdir / "submission.json")
    members = {m["custom_id"]: m for m in read(rdir / "members.json")}
    by_id = {b["id"]: b for b in boards}
    while True:
        status, body = C.broker("GET", f"/api/v1/batches/{sub['batch_id']}", timeout=180)
        data = body.get("data", body) if isinstance(body, dict) else {}
        state = data.get("status")
        if state in ("completed", "failed", "expired", "cancelled"):
            break
        print(json.dumps({"event": "round_wait", "round": rdir.name, "status": state, "counts": data.get("request_counts")}), flush=True)
        time.sleep(60)
    save(rdir / "final.json", body)
    results = {item.get("custom_id"): item for item in data.get("results") or []}
    for custom_id, member in members.items():
        board = by_id[member["board_id"]]
        k = member["turn"]
        turn_dir = tdir(phase, short, board["id"]) / f"turn-{k:02d}"
        prior = turn_dir / "batch-attempt1.json"
        if (turn_dir / "metadata.json").exists() or (not member["resend"] and prior.exists() and read(prior)["round"] == rdir.name):
            continue  # already settled by an interrupted earlier pass over this round
        request = read(turn_dir / "request.json")
        item = results.get(custom_id) or {}
        response = item.get("response") or {}
        status_code = response.get("status_code") if response else None
        reply = response.get("body") if response else {"error": item.get("error") or {"type": "missing_result", "batch_status": state}}
        if member["resend"]:
            first = read(prior)
            attempts = [(first["status"], first["response"], None), (status_code, reply, None)]
            record_turn(phase, short, board, k, request, attempts, {"route": "batch", "rounds": [first["round"], rdir.name]})
        elif status_code == 200:
            record_turn(phase, short, board, k, request, [(status_code, reply, None)], {"route": "batch", "rounds": [rdir.name]})
        else:
            save(prior, {"status": status_code, "response": reply, "round": rdir.name})
            print(json.dumps({"event": "batch_item_failed", "custom_id": custom_id, "status": status_code}), flush=True)
    usage = data.get("usage") or {}
    save(rdir / "settled.json", {"settled_utc": utc(), "status": state, "usage": usage})
    C.settle(f"traj-batch-{short}-{phase}-{rdir.name.replace('round-', 'r')}",
             usage.get("cost") if isinstance(usage.get("cost"), (int, float)) else None, f"batch {sub['batch_id']} usage.cost")


# ---------------------------------------------------------------- audit and projection

def trajectory_summary(phase, short, board):
    messages, placed, turns, ended = load_state(phase, short, board)
    directory = tdir(phase, short, board["id"])
    if not ended and ((directory / "censored.json").exists() or (out(phase) / "batch-rounds" / short / "censored.json").exists()):
        ended = "censored_budget"
    if any("resend_censored" in t for t in turns):
        ended = "censored_budget"
    solution = oracle(board)
    final_columns = None
    solved = False
    if len(placed) == board["size"] and len({r for r, _ in placed}) == board["size"]:
        final_columns = [next(c for r, c in placed if r == row) for row in range(1, board["size"] + 1)]
        grid = grid_letters(board)
        solved = replay.checks(grid, final_columns)["correct"] and replay.independent_valid(grid, final_columns)
    first_deviation = next((t["turn"] for t in turns if t.get("effect") != "request_failure" and t["labels_after"]["off_solution"]), None)
    return {"trajectory_id": tid_for(short, board["id"]), "model": MODELS[short]["model"], "short": short,
            "board_id": board["id"], "size": board["size"], "end_reason": ended or "not_run", "requests": len(turns),
            "solved": bool(solved), "final_queens": [list(c) for c in placed],
            "final_correct_queens": sum(solution[r - 1] == c for r, c in placed),
            "first_off_solution_turn": first_deviation,
            "effects": dict(collections.Counter(t["effect"] for t in turns)),
            "cost_usd": round(sum(t.get("cost_usd") or 0 for t in turns), 6)}


def audit(args):
    rows = [trajectory_summary(args.phase, short, board) for board in plan_boards(args.phase) for short in MODELS]
    summary = {"study": STUDY[args.phase], "updated_utc": utc(), "trajectories": rows,
               "cost_usd_reported": round(sum(r["cost_usd"] for r in rows), 6),
               "by_model": {short: {"solved": sum(r["solved"] for r in rows if r["short"] == short),
                                    "trajectories": sum(r["short"] == short for r in rows),
                                    "cost_usd": round(sum(r["cost_usd"] for r in rows if r["short"] == short), 6)} for short in MODELS}}
    save(out(args.phase) / "summary.json", summary)
    for row in rows:
        print(json.dumps({k: row[k] for k in ("trajectory_id", "end_reason", "requests", "solved", "final_correct_queens", "first_off_solution_turn", "effects", "cost_usd")}))
    print(json.dumps({"cost_usd_reported": summary["cost_usd_reported"], "by_model": summary["by_model"]}))


def project(args):
    """Preregistered block-count rule: the largest K <= 12 whose projected cost fits the remaining campaign cap."""
    pilot = read(out("pilot") / "summary.json")
    per_model_5 = {r["short"]: r["cost_usd"] for r in pilot["trajectories"]}
    block = sum(PROJECTION_SAFETY * per_model_5[s] * (size / 5) ** 2 for s in MODELS for size in (5, 7, 9))
    state = C.state()
    held = C.legacy_outstanding()
    room = state["cap_usd"] - state["spent_usd"] - state["reserves_usd"] - held
    k = max(0, min(MAX_BLOCKS, int(room // block))) if block > 0 else MAX_BLOCKS
    if k >= 4:
        k -= k % 4  # runs of four blocks are stratum-balanced within each size
    result = {"utc": utc(), "pilot_cost_per_model_5x5": per_model_5, "projected_block_usd": round(block, 4), "room_usd": round(room, 4),
              "held_for_legacy_panel_usd": round(held, 4), "ledger": state,
              "blocks": k, "rule": "K = min(12, floor(room / projected block)), rounded down to a multiple of 4 when K >= 4; projected board cost = 1.5 x pilot 5x5 cost x (N/5)^2"}
    save(OUT_ROOT / "projection.json", result)
    print(json.dumps(result))


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("mode", choices=["prepare", "run", "batch-rounds", "reconcile-round", "audit", "project"])
    parser.add_argument("--phase", choices=["pilot", "main"], default="pilot")
    parser.add_argument("--model", choices=list(MODELS))
    parser.add_argument("--blocks", type=int)
    parser.add_argument("--batch-id")
    parser.add_argument("--resume-censored", action="store_true")
    args = parser.parse_args()
    {"prepare": prepare, "run": run, "batch-rounds": batch_rounds, "reconcile-round": reconcile_round, "audit": audit,
     "project": project}[args.mode](args)


if __name__ == "__main__":
    main()
