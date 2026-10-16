"""Dated re-run of panel requests that failed before reaching the model (e.g. HTTP 429).

The preregistered result keeps the original failure; this re-sends the identical
frozen request once and records it separately under output/llm-panel/reruns/.
    python3 scripts/llm_panel/rerun_failures.py <call_id> [...]
"""
import json, pathlib, signal, sys, time
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import one_shot_panel as P

manifest = P.read(P.OUT / "manifest.json")
calls = {c["call_id"]: c for c in manifest["schedule"]}
for call_id in sys.argv[1:]:
    call = calls[call_id]
    original = P.read(P.OUT / "raw" / call_id / "metadata.json")
    assert original["http_status"] not in (200,), "only requests that failed before a model answer are re-run"
    out = P.OUT / "reruns" / call_id
    if (out / "started.json").exists():
        raise SystemExit("Re-run already started for " + call_id)
    if P.campaign_spend() + call["worst_case_usd"] > P.CAMPAIGN_CAP_USD:
        raise SystemExit("Campaign cap would be exceeded")
    path = P.OUT / "requests" / f"{call_id}.json"
    assert P.sha(path.read_bytes()) == call["request_sha256"]
    body = P.read(path)
    P.save(out / "started.json", {"started_utc": P.utc(), "request_sha256": call["request_sha256"], "reason": f"original HTTP {original['http_status']} before any model answer"})
    start = time.monotonic()
    signal.signal(signal.SIGALRM, lambda *a: (_ for _ in ()).throw(TimeoutError("client timeout")))
    signal.alarm(P.TIMEOUT)
    try:
        status, response = P.broker("POST", "/api/v1/chat/completions", body, timeout=P.TIMEOUT + 30)
    except (TimeoutError, OSError) as error:
        status, response = None, {"error": {"type": type(error).__name__}}
    finally:
        signal.alarm(0)
    elapsed = time.monotonic() - start
    P.save(out / "response.json", response)
    board = P.grading_board(next(b for b in P.boards() if b["id"] == call["board_id"]))
    text = ((response.get("choices") or [{}])[0].get("message") or {}).get("content") if status == 200 else None
    strict = P.grading.grade(board, text) if isinstance(text, str) else {"format_valid": False, "correct": False, "checks": {}, "failure": "no_answer"}
    diag = P.grading.diagnose(board, text)
    usage = response.get("usage") if isinstance(response, dict) else None
    meta = {"call_id": call_id, "rerun_of": call_id, "board_id": call["board_id"], "size": call["size"], "model": call["model"],
            "completed_utc": P.utc(), "http_status": status, "elapsed_seconds": elapsed, "returned_model": response.get("model"),
            "provider": response.get("provider"), "finish_reason": ((response.get("choices") or [{}])[0].get("finish_reason")),
            "usage": usage, "cost_usd": (usage or {}).get("cost") if isinstance(usage, dict) else None}
    P.save(out / "grade.json", strict); P.save(out / "diagnostic.json", diag); P.save(out / "metadata.json", meta)
    print(json.dumps({"rerun": call_id, "status": status, "strict_correct": strict.get("correct"), "written_correct": diag.get("rule_valid_after_extraction"), "cost": meta["cost_usd"]}))
