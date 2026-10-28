"""Reproducible, local-only exploratory Queens image panel. See docs/ollama-local-assessment.md."""
from __future__ import annotations

import argparse
import base64
import hashlib
import json
import pathlib
import platform
import re
import sys
import time
import urllib.error
import urllib.request
from datetime import datetime, timezone
from urllib.parse import urlparse

ROOT = pathlib.Path(__file__).resolve().parents[2]
HERE = pathlib.Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
sys.path.insert(0, str(ROOT / "scripts/llm_panel"))
import grading  # noqa: E402
from render import render_png  # noqa: E402
from local_observability import capture_host, record_journal  # noqa: E402

OUT = ROOT / "public/evidence/ollama"
STUDY = "2026-10-28-local-qwen-image-pilot"
MODEL = "qwen3.5:4b"
EXPECTED_DIGEST = "7f3251fa6878a78a606bcb3c074283306e5ad2ea411a7774a9dd98a4bc7f2d13"
BASE_URL = "http://localhost:11434"
TIMEOUT = 600
MAX_TOKENS = 12288
DEFAULT_NUM_CTX = 16384
DEFAULT_KEEP_ALIVE = 0
VTAG = "vtag:32720a64-f618-48bd-9c45-23c30bc9136c"


def utc():
    """Return a timezone-aware timestamp."""
    return datetime.now(timezone.utc).isoformat()


def sha(data):
    """Hash exact bytes to make saved inputs auditable."""
    return hashlib.sha256(data).hexdigest()


def read(path):
    """Read a JSON artifact."""
    return json.loads(pathlib.Path(path).read_text())


def save(path, value):
    """Persist a JSON artifact with predictable formatting."""
    path = pathlib.Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, indent=2, ensure_ascii=False) + "\n")


def local_api(path, body=None, timeout=30):
    """Call the fixed local endpoint; no remote fallback or credentials are used."""
    if urlparse(BASE_URL).hostname not in {"localhost", "127.0.0.1", "::1"}:
        raise ValueError("Only a loopback model endpoint is allowed")
    data = json.dumps(body).encode() if body is not None else None
    request = urllib.request.Request(BASE_URL + path, data=data, headers={"Content-Type": "application/json"})
    try:
        opener = urllib.request.build_opener(urllib.request.ProxyHandler({}))
        with opener.open(request, timeout=timeout) as response:
            return response.status, json.loads(response.read())
    except urllib.error.HTTPError as error:
        raw = error.read()
        try:
            payload = json.loads(raw)
        except ValueError:
            payload = {"error": "non_json_http_error", "response_bytes": len(raw)}
        return error.code, payload


def model_snapshot():
    """Check the installed model identity and retain only nonsecret runtime metadata."""
    status, tags = local_api("/api/tags")
    matches = [m for m in tags.get("models", []) if m.get("name") == MODEL]
    if status != 200 or len(matches) != 1 or matches[0].get("digest") != EXPECTED_DIGEST:
        raise RuntimeError("Installed local model missing or digest changed; freeze a new study")
    status, show = local_api("/api/show", {"model": MODEL})
    if status != 200 or "vision" not in show.get("capabilities", []):
        raise RuntimeError("This image protocol requires verified local vision support")
    _, version = local_api("/api/version")
    return {"model": MODEL, "digest": EXPECTED_DIGEST, "server_version": version.get("version"),
            "details": show.get("details"), "model_info": show.get("model_info"),
            "capabilities": show.get("capabilities"), "thinking": show.get("thinking"),
            "parameters_reported": show.get("parameters"), "machine_architecture": platform.machine(),
            "os": platform.system(), "virtual_tag": VTAG,
            "transport": "Ollama-compatible local HTTP /api/chat", "host": "loopback"}


def validate_runtime(plan, snapshot):
    """Reject resumed inference if any frozen runtime identity or default has drifted."""
    changed = sorted(key for key in set(plan["runtime"]) | set(snapshot)
                     if plan["runtime"].get(key) != snapshot.get(key))
    if changed:
        raise RuntimeError("Frozen local runtime drift in: " + ", ".join(changed) + "; no new inference allowed")


def freeze(study_id=None):
    """Freeze board selection and protocol before inspecting any model answers."""
    path = OUT / "plan.json"
    if path.exists():
        raise SystemExit("Plan already frozen; refusing to overwrite")
    if (not isinstance(study_id, str) or not re.fullmatch(r"[A-Za-z0-9][A-Za-z0-9_.\-]{0,95}", study_id)
            or study_id == STUDY):
        raise SystemExit("New input settings require a distinct --study-id and --output-dir")
    corpus_path = ROOT / "public/evidence/subq-panel/corpus.json"
    corpus = read(corpus_path)
    frontier = read(ROOT / "public/evidence/frontier-image-panel/plan.json")
    historical_ids = set(frontier["selection"]["boards"])
    strata = [(s, t) for s in ("singleton", "no_singleton") for t in ("lower_search", "higher_search")]
    selected = []
    for singleton, tier in strata:
        for size in (5, 7, 9):
            pool = sorted([b for b in corpus["boards"] if b["id"] in historical_ids and b["size"] == size
                           and b["stratum"] == {"singleton_status": singleton, "tier": tier}], key=lambda b: b["id"])
            b = pool[0]
            board = {k: b[k] for k in ("id", "size", "regions", "stratum", "board_sha256")}
            image = OUT / "images" / f"{b['id']}.png"
            image.parent.mkdir(parents=True, exist_ok=True)
            render_png(b["size"], b["regions"], image)
            selected.append({**board, "image": f"images/{b['id']}.png", "image_sha256": sha(image.read_bytes())})
    template = (ROOT / "scripts/llm_panel/prompt.txt").read_bytes()
    if sha(template) != "b7ef8260e400f8e474056bb7249b1c135e3c74a64f174c84c69d87fc8c78bac4":
        raise RuntimeError("Historical prompt changed")
    (OUT / "prompt-template.txt").write_bytes(template)
    plan = {"schema_version": 1, "study": study_id, "frozen_utc": utc(), "design": "exploratory pilot, not a confirmatory model ranking",
            "selection_rule": "Within the frozen frontier-image-panel subset, lexicographically first board in each size × singleton status × search tier; one per cell, 12 total. Ordered by stratum then size.",
            "corpus": "public/evidence/subq-panel/corpus.json", "corpus_sha256": sha(corpus_path.read_bytes()),
            "runtime": model_snapshot(), "prompt_template_sha256": sha(template), "boards": selected,
            "protocol": {"modality": "image", "one_shot": True, "tools": False, "retries": 0, "think": True,
                         "num_predict": MAX_TOKENS, "timeout_seconds": TIMEOUT, "temperature": 0, "seed": 20261028,
                         "num_ctx": DEFAULT_NUM_CTX, "keep_alive": DEFAULT_KEEP_ALIVE,
                         "structured_output_enforcement": False,
                         "reasoning_control_note": "Qwen supports boolean thinking, not the historical providers' high reasoning-effort setting. Requested controls are not proof the compatible server honored each option."},
            "conditional_treatment": {"name": "caveman", "gate": "At least one baseline strict or uniquely extracted rule-valid solution at size 5, 7 or 9; complete skill review before application.",
                                      "paired_boards": "Same 12 frozen boards, one fresh request per board, same generation settings; system instruction contains reviewed skill body only. No persisted model history."}}
    save(path, plan)
    summarize()
    print(json.dumps({"frozen": len(selected), "boards": [b["id"] for b in selected]}), flush=True)


def request_body(plan, board, treatment):
    """Build the exact one-shot request, without ground truth or evaluator feedback."""
    template = (OUT / "prompt-template.txt").read_bytes()
    if sha(template) != plan["prompt_template_sha256"]:
        raise RuntimeError("Frozen prompt hash mismatch")
    png = (OUT / board["image"]).read_bytes()
    if sha(png) != board["image_sha256"]:
        raise RuntimeError("Frozen image hash mismatch")
    prompt = template.decode().replace("{{BOARD_ID}}", board["id"]).replace("{{SIZE}}", str(board["size"]))
    messages = []
    if treatment == "caveman":
        skill = read(OUT / "skill.json")
        body = (OUT / "caveman-system.txt").read_bytes()
        if sha(body) != skill["system_sha256"]:
            raise RuntimeError("Reviewed skill body hash mismatch")
        messages.append({"role": "system", "content": body.decode()})
    messages.append({"role": "user", "content": prompt, "images": [base64.b64encode(png).decode()]})
    protocol = plan["protocol"]
    return {"model": MODEL, "messages": messages, "stream": False, "think": protocol["think"],
            "options": {k: protocol[k] for k in ("num_predict", "temperature", "seed", "num_ctx")},
            "keep_alive": protocol.get("keep_alive", "10m")}


def classify(status, response, strict, diagnostic):
    """Separate transport failures, truncations, format-only solves and rule failures."""
    if status != 200:
        return "transport_error"
    if response.get("done_reason") in {"length", "max_tokens", "num_predict"}:
        return "truncated"
    if strict.get("correct"):
        return "strict"
    if diagnostic.get("rule_valid_after_extraction"):
        return "format_only"
    if not (response.get("message") or {}).get("content"):
        return "no_final_answer"
    return "incorrect"


def record_result(plan, board, treatment, response, status, elapsed, request, started):
    """Save exact public model output and deterministic grades, then refresh the summary."""
    call_id = f"{treatment}_{board['id']}"
    directory = OUT / "receipts" / call_id
    text = (response.get("message") or {}).get("content") if isinstance(response, dict) else None
    strict = grading.grade(board, text)
    diagnostic = grading.diagnose(board, text)
    save(directory / "response.json", response)
    save(directory / "grade.json", strict)
    save(directory / "diagnostic.json", diagnostic)
    meta = {"call_id": call_id, "board_id": board["id"], "size": board["size"], "treatment": treatment,
            "model": MODEL, "model_digest": EXPECTED_DIGEST, "started_utc": started, "completed_utc": utc(),
            "http_status": status, "elapsed_seconds": elapsed, "returned_model": response.get("model"),
            "finish_reason": response.get("done_reason"), "done": response.get("done"),
            "input_tokens": response.get("prompt_eval_count"), "output_tokens": response.get("eval_count"),
            "total_duration_ns": response.get("total_duration"), "load_duration_ns": response.get("load_duration"),
            "prompt_eval_duration_ns": response.get("prompt_eval_duration"), "eval_duration_ns": response.get("eval_duration"),
            "request_sha256": sha(json.dumps(request, sort_keys=True).encode()),
            "response_sha256": sha(json.dumps(response, sort_keys=True).encode()), "image_sha256": board["image_sha256"],
            "json_hash_encoding": "Python json.dumps(value, sort_keys=True), UTF-8",
            "response_origin": "server" if status is not None else "client_exception",
            "strict_correct": status == 200 and strict["correct"], "rule_valid_after_extraction": status == 200 and diagnostic["rule_valid_after_extraction"],
            "outcome": classify(status, response, strict, diagnostic), "provider_fee_usd": 0,
            "local_total_cost_usd": None, "virtual_tag": VTAG}
    save(directory / "metadata.json", meta)
    summarize()
    print(json.dumps({"event": "recorded", **{k: meta[k] for k in ("call_id", "http_status", "outcome", "elapsed_seconds", "output_tokens")}}), flush=True)


def run(treatment, limit=None, journal=None):
    """Execute sequential calls; uncertain socket failures stop rather than queue more work."""
    plan = read(OUT / "plan.json")
    for arm in ("baseline", "caveman"):
        for board in plan["boards"]:
            directory = OUT / "receipts" / f"{arm}_{board['id']}"
            if (directory / "metadata.json").exists():
                if read(directory / "metadata.json").get("http_status") is None:
                    raise SystemExit("Unresolved client failure in study; no metadata query or new inference permitted. Preserve the failed receipt; manual disposition support is not implemented.")
            elif (directory / "started.json").exists():
                raise SystemExit("Uncertain earlier request; no metadata query or automatic retry: " + board["id"])
    pending = []
    for board in plan["boards"]:
        directory = OUT / "receipts" / f"{treatment}_{board['id']}"
        if (directory / "metadata.json").exists():
            continue
        if (directory / "started.json").exists():
            raise SystemExit("Uncertain earlier request; no metadata query or automatic retry: " + board["id"])
        pending.append(board)
    if not pending or (limit is not None and limit <= 0):
        print(json.dumps({"event": "no_pending_calls", "treatment": treatment}), flush=True)
        return
    if treatment == "caveman":
        if not (OUT / "skill.json").exists() or not read(OUT / "summary.json")["gate"]["baseline_success"]:
            raise SystemExit("Caveman requires baseline success and approved pinned skill")
    snapshot = model_snapshot()
    invocation_time = utc()
    invocation_path = OUT / "invocations" / (treatment + "_" + invocation_time.replace(":", "-") + ".json")
    save(invocation_path, {"started_utc": invocation_time, "treatment": treatment, "runtime": snapshot,
                           "runtime_matches_frozen": snapshot == plan["runtime"],
                           "runner_source_sha256": sha(pathlib.Path(__file__).read_bytes()),
                           "note": "Invocation-start snapshot; not continuous runtime attestation."})
    validate_runtime(plan, snapshot)
    count = 0
    for board in pending:
        directory = OUT / "receipts" / f"{treatment}_{board['id']}"
        if (directory / "metadata.json").exists():
            continue
        if (directory / "started.json").exists():
            raise SystemExit("Uncertain earlier request; no automatic retry: " + board["id"])
        if limit is not None and count >= limit:
            break
        request = request_body(plan, board, treatment)
        save(directory / "request.json", request)
        started = utc()
        save(directory / "started.json", {"started_utc": started})
        summarize()
        print(json.dumps({"event": "started", "call_id": f"{treatment}_{board['id']}"}), flush=True)
        host = {"schema_version": 1, "before": capture_host(), "after": None}
        save(directory / "host.json", host)
        started_at = time.time()
        before = time.monotonic()
        try:
            status, response = local_api("/api/chat", request, timeout=TIMEOUT)
        except (OSError, TimeoutError, ValueError) as error:
            status, response = None, {"error": {"type": type(error).__name__, "message": "local request failed; no automatic retry"}}
        elapsed = time.monotonic() - before
        ended_at = max(started_at, time.time())
        host["after"] = capture_host()
        save(directory / "host.json", host)
        if status == 200 and response.get("model") != MODEL:
            save(directory / "response.json", response)
            raise SystemExit("Returned model identity mismatch; response preserved, grading blocked")
        record_result(plan, board, treatment, response, status, elapsed, request, started)
        if journal is not None:
            journal_status = record_journal(journal, request, response, status, treatment,
                                            started_at, ended_at, elapsed)
            try:
                save(directory / "journal.json", journal_status)
            except OSError:
                print(json.dumps({"event": "journal_status_unavailable"}), flush=True)
        if status is None:
            raise SystemExit("Uncertain client failure saved; socket timeout does not cancel backend work. Inspect the backend before any new inference; no next call or retry submitted.")
        count += 1


def summarize():
    """Derive denominators from scheduled calls, keeping unattempted/error outcomes visible."""
    plan = read(OUT / "plan.json")
    treatments = ["baseline"] + (["caveman"] if (OUT / "skill.json").exists() else [])
    rows = []
    for treatment in treatments:
        for board in plan["boards"]:
            call_id = f"{treatment}_{board['id']}"
            directory = OUT / "receipts" / call_id
            meta = read(directory / "metadata.json") if (directory / "metadata.json").exists() else {}
            state = "recorded" if meta else ("started_unrecorded" if (directory / "started.json").exists() else "not_run")
            rows.append({"call_id": call_id, "board_id": board["id"], "size": board["size"], "treatment": treatment,
                         "stratum": board["stratum"], "state": state,
                         "outcome": meta.get("outcome", "unrecorded" if state == "started_unrecorded" else "not_run"), "strict_correct": meta.get("strict_correct", False),
                         "rule_valid_after_extraction": meta.get("rule_valid_after_extraction", False),
                         "elapsed_seconds": meta.get("elapsed_seconds"), "input_tokens": meta.get("input_tokens"),
                         "output_tokens": meta.get("output_tokens"), "finish_reason": meta.get("finish_reason"),
                         "http_status": meta.get("http_status"), "receipt": f"receipts/{call_id}/metadata.json" if meta else None,
                         "image": board["image"]})
    aggregates = []
    for treatment in treatments:
        for size in (5, 7, 9):
            group = [r for r in rows if r["treatment"] == treatment and r["size"] == size]
            aggregates.append({"treatment": treatment, "size": size, "scheduled": len(group),
                               "recorded": sum(r["state"] == "recorded" for r in group),
                               "http_completed": sum(r["http_status"] == 200 for r in group),
                               "strict_correct": sum(r["strict_correct"] for r in group),
                               "rule_valid_after_extraction": sum(r["rule_valid_after_extraction"] for r in group),
                               "format_only": sum(r["outcome"] == "format_only" for r in group),
                               "transport_errors": sum(r["outcome"] == "transport_error" for r in group),
                               "truncated": sum(r["outcome"] == "truncated" for r in group),
                               "not_run": sum(r["state"] == "not_run" for r in group),
                               "unrecorded": sum(r["state"] == "started_unrecorded" for r in group),
                               "elapsed_seconds": sum(r["elapsed_seconds"] or 0 for r in group),
                               "input_tokens_reported": sum(r["input_tokens"] or 0 for r in group),
                               "output_tokens_reported": sum(r["output_tokens"] or 0 for r in group)})
    baseline_success = any(r["treatment"] == "baseline" and (r["strict_correct"] or r["rule_valid_after_extraction"]) for r in rows)
    save(OUT / "summary.json", {"schema_version": 1, "study": plan["study"], "updated_utc": utc(), "protocol": plan["protocol"],
                                "runtime": plan["runtime"], "rows": rows, "by_treatment_size": aggregates,
                                "gate": {"baseline_success": baseline_success, "caveman_status": "enabled_after_review" if len(treatments) > 1 else "pending_baseline_or_review"},
                                "costs": {"provider_fee_usd": 0, "local_total_cost_usd": None, "note": "No paid inference API. Electricity, hardware amortization and local runtime costs are unmeasured."},
                                "limitations": ["Exploratory 12-board sample: four boards per size, one per existing stratum. One run per condition; no precision or causal benefit claim.",
                                                "Qwen boolean thinking and local server controls differ from the historical high-effort hosted protocols. Compare as a separate local pilot.",
                                                "Reported token counts and elapsed time are runtime measurements, not provider billing or a controlled speed benchmark.",
                                                "Requested generation options may be interpreted differently by an Ollama-compatible MLX runner; this study records the request and returned metadata."]})


def verify(require_complete=False):
    """Audit frozen inputs, grades, receipt metadata and published summary independently."""
    plan = read(OUT / "plan.json")
    summary = read(OUT / "summary.json")
    template = (OUT / "prompt-template.txt").read_bytes()
    assert sha(template) == plan["prompt_template_sha256"], "Frozen prompt hash mismatch"
    assert plan["runtime"]["model"] == MODEL and plan["runtime"]["digest"] == EXPECTED_DIGEST, "Frozen model identity mismatch"
    assert summary["study"] == plan["study"] and summary["protocol"] == plan["protocol"], "Summary protocol mismatch"
    assert summary["runtime"] == plan["runtime"], "Summary runtime mismatch"
    corpus_path = ROOT / plan["corpus"]
    assert sha(corpus_path.read_bytes()) == plan["corpus_sha256"], "Corpus hash mismatch"
    corpus = {b["id"]: b for b in read(corpus_path)["boards"]}
    by_id = {b["id"]: b for b in plan["boards"]}
    assert len(by_id) == len(plan["boards"]) == 12, "Duplicate or missing planned boards"
    for board in plan["boards"]:
        source = corpus[board["id"]]
        assert all(board[key] == source[key] for key in ("size", "regions", "stratum", "board_sha256")), "Planned board differs from frozen corpus"
        assert sha((OUT / board["image"]).read_bytes()) == board["image_sha256"], "Planned image hash mismatch"
    treatments = ["baseline"]
    system_text = None
    if (OUT / "skill.json").exists():
        skill = read(OUT / "skill.json")
        system = (OUT / "caveman-system.txt").read_bytes()
        assert sha(system) == skill["system_sha256"], "Reviewed skill body hash mismatch"
        assert skill["commit"] == "9b68f7ed12b05e7efaff18e65c5a3fc2849fd0a4", "Reviewed skill commit changed"
        assert skill["artifact_sha256"] == "415d43518f2b1a9498c15a445d4657117b129ee5e81b19454ce348439cc6672b", "Reviewed artifact identity changed"
        system_text = system.decode()
        treatments.append("caveman")
    expected_rows = []
    checked = 0
    for treatment in treatments:
        for board in plan["boards"]:
            call_id = f"{treatment}_{board['id']}"
            directory = OUT / "receipts" / call_id
            has_meta = (directory / "metadata.json").exists()
            state = "recorded" if has_meta else ("started_unrecorded" if (directory / "started.json").exists() else "not_run")
            meta = read(directory / "metadata.json") if has_meta else {}
            if has_meta:
                assert meta["call_id"] == call_id and meta["board_id"] == board["id"] and meta["size"] == board["size"], "Receipt board identity mismatch"
                assert meta["model"] == MODEL and meta["model_digest"] == EXPECTED_DIGEST, "Receipt model identity mismatch"
                assert meta["treatment"] == treatment and meta["virtual_tag"] == VTAG, "Receipt attribution mismatch"
                assert isinstance(meta["elapsed_seconds"], (int, float)) and meta["elapsed_seconds"] >= 0, "Invalid elapsed time"
                request, response = read(directory / "request.json"), read(directory / "response.json")
                assert sha(json.dumps(request, sort_keys=True).encode()) == meta["request_sha256"], "Request hash mismatch: " + call_id
                assert sha(json.dumps(response, sort_keys=True).encode()) == meta["response_sha256"], "Response hash mismatch: " + call_id
                assert meta["image_sha256"] == board["image_sha256"], "Receipt image hash mismatch"
                assert set(request) == {"model", "messages", "stream", "think", "options", "keep_alive"}, "Unexpected request fields/tools"
                assert request["model"] == MODEL and request["stream"] is False and request["think"] == plan["protocol"]["think"], "Generation request mismatch"
                assert request["options"] == {k: plan["protocol"][k] for k in ("num_predict", "temperature", "seed", "num_ctx")}, "Generation options mismatch"
                assert request["keep_alive"] == plan["protocol"].get("keep_alive", "10m"), "Keep-alive request mismatch"
                messages = request["messages"]
                assert len(messages) == (2 if treatment == "caveman" else 1), "Unexpected conversation history"
                if treatment == "caveman":
                    assert messages[0] == {"role": "system", "content": system_text}, "Applied system instruction differs from reviewed body"
                user = messages[-1]
                assert set(user) == {"role", "content", "images"} and user["role"] == "user", "Unexpected user message fields"
                expected_prompt = template.decode().replace("{{BOARD_ID}}", board["id"]).replace("{{SIZE}}", str(board["size"]))
                assert user["content"] == expected_prompt, "User prompt differs from frozen template"
                assert len(user["images"]) == 1 and base64.b64decode(user["images"][0], validate=True) == (OUT / board["image"]).read_bytes(), "Submitted image differs from frozen PNG"
                text = (response.get("message") or {}).get("content")
                strict, diagnostic = grading.grade(board, text), grading.diagnose(board, text)
                assert strict == read(directory / "grade.json"), "Strict grade mismatch: " + call_id
                assert diagnostic == read(directory / "diagnostic.json"), "Diagnostic mismatch: " + call_id
                assert meta["strict_correct"] == (meta["http_status"] == 200 and strict["correct"]), "Metadata strict correctness mismatch"
                assert meta["rule_valid_after_extraction"] == (meta["http_status"] == 200 and diagnostic["rule_valid_after_extraction"]), "Metadata extracted correctness mismatch"
                assert meta["returned_model"] == response.get("model"), "Returned model metadata mismatch"
                assert meta["http_status"] != 200 or response.get("model") == MODEL, "Unexpected returned model"
                assert meta["input_tokens"] == response.get("prompt_eval_count") and meta["output_tokens"] == response.get("eval_count"), "Token metadata mismatch"
                assert meta["finish_reason"] == response.get("done_reason"), "Finish reason mismatch"
                expected_outcome = ("transport_error" if meta["http_status"] != 200 else
                                    "truncated" if response.get("done_reason") in {"length", "max_tokens", "num_predict"} else
                                    "strict" if strict["correct"] else
                                    "format_only" if diagnostic["rule_valid_after_extraction"] else
                                    "no_final_answer" if not text else "incorrect")
                assert meta["outcome"] == expected_outcome, "Outcome classification mismatch"
                assert meta["provider_fee_usd"] == 0 and meta["local_total_cost_usd"] is None, "Unsupported cost claim"
                checked += 1
            expected_rows.append({"call_id": call_id, "board_id": board["id"], "size": board["size"], "treatment": treatment,
                                  "stratum": board["stratum"], "state": state,
                                  "outcome": meta.get("outcome", "unrecorded" if state == "started_unrecorded" else "not_run"),
                                  "strict_correct": meta.get("strict_correct", False), "rule_valid_after_extraction": meta.get("rule_valid_after_extraction", False),
                                  "elapsed_seconds": meta.get("elapsed_seconds"), "input_tokens": meta.get("input_tokens"), "output_tokens": meta.get("output_tokens"),
                                  "finish_reason": meta.get("finish_reason"), "http_status": meta.get("http_status"),
                                  "receipt": f"receipts/{call_id}/metadata.json" if meta else None, "image": board["image"]})
    assert summary["rows"] == expected_rows, "Summary rows differ from saved receipts"
    expected_aggregates = []
    for treatment in treatments:
        for size in (5, 7, 9):
            group = [r for r in expected_rows if r["treatment"] == treatment and r["size"] == size]
            expected_aggregates.append({"treatment": treatment, "size": size, "scheduled": len(group),
                                        "recorded": sum(r["state"] == "recorded" for r in group),
                                        "http_completed": sum(r["http_status"] == 200 for r in group),
                                        "strict_correct": sum(r["strict_correct"] for r in group),
                                        "rule_valid_after_extraction": sum(r["rule_valid_after_extraction"] for r in group),
                                        "format_only": sum(r["outcome"] == "format_only" for r in group),
                                        "transport_errors": sum(r["outcome"] == "transport_error" for r in group),
                                        "truncated": sum(r["outcome"] == "truncated" for r in group),
                                        "not_run": sum(r["state"] == "not_run" for r in group),
                                        "unrecorded": sum(r["state"] == "started_unrecorded" for r in group),
                                        "elapsed_seconds": sum(r["elapsed_seconds"] or 0 for r in group),
                                        "input_tokens_reported": sum(r["input_tokens"] or 0 for r in group),
                                        "output_tokens_reported": sum(r["output_tokens"] or 0 for r in group)})
    assert summary["by_treatment_size"] == expected_aggregates, "Summary denominators/totals differ from receipts"
    baseline_success = any(r["treatment"] == "baseline" and r["http_status"] == 200 and (r["strict_correct"] or r["rule_valid_after_extraction"]) for r in expected_rows)
    assert summary["gate"]["baseline_success"] == baseline_success, "Conditional-treatment gate mismatch"
    assert len(treatments) == 1 or baseline_success, "Caveman arm enabled without baseline success"
    assert summary["gate"]["caveman_status"] == ("enabled_after_review" if len(treatments) > 1 else "pending_baseline_or_review"), "Skill status mismatch"
    assert summary["costs"]["provider_fee_usd"] == 0 and summary["costs"]["local_total_cost_usd"] is None, "Unsupported summary cost claim"
    if require_complete:
        assert checked == len(expected_rows) and all(r["state"] == "recorded" for r in expected_rows), "Publication is incomplete"
        assert not baseline_success or (len(treatments) == 2 and checked == 24), "Qualified paired arm is incomplete"
    print(json.dumps({"verified_receipts": checked, "scheduled_calls": len(expected_rows), "require_complete": require_complete}))


def main():
    """Expose freeze, run and deterministic summary commands."""
    global OUT
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("command", choices=("freeze", "run", "summarize", "verify"))
    parser.add_argument("--treatment", choices=("baseline", "caveman"), default="baseline")
    parser.add_argument("--limit", type=int)
    parser.add_argument("--study-id", help="A distinct study label is required for a future freeze")
    parser.add_argument("--output-dir", type=pathlib.Path, help="Explicit separate evidence directory for a new study")
    parser.add_argument("--journal", type=pathlib.Path, help="Opt-in numeric Grafana journal for future run calls only")
    parser.add_argument("--require-complete", action="store_true", help="Verify every planned baseline and qualified paired call is recorded")
    args = parser.parse_args()
    if args.journal is not None and args.command != "run":
        parser.error("--journal is only supported by run; offline commands never access a journal")
    if args.study_id is not None and args.command != "freeze":
        parser.error("--study-id is only supported by freeze")
    if args.command == "freeze" and (args.study_id is None or args.output_dir is None):
        parser.error("freeze requires a distinct --study-id and explicit --output-dir")
    if args.output_dir is not None:
        OUT = args.output_dir.resolve()
    if args.command == "freeze" and OUT == ROOT / "public/evidence/ollama":
        parser.error("future freezes require a separate evidence directory")
    if args.command == "freeze":
        freeze(args.study_id)
    elif args.command == "run":
        run(args.treatment, args.limit, args.journal)
    elif args.command == "verify":
        verify(args.require_complete)
    else:
        summarize()


if __name__ == "__main__":
    main()
