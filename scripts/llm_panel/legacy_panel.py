"""Earlier-generation models, one shot from a board image, on the 36 panel boards.

Extends the 1 October earlier-generations replay (3 original boards per model)
to the same 36 boards as the 16 October frontier image panel. Every request
reuses that panel's prompt (sha256 b7ef8260… template) and byte-identical PNG
for its board, and each model's 1 October envelope: max_tokens 12288, reasoning
effort high with reasoning excluded where the model supports reasoning (GPT-4.1
has none), no tools, no retries. See docs/legacy-panel-preregistration.md.

Routes: OpenRouter Batch API first, as the user asked, even where that means a
different provider (Gemini 2.5: Google Vertex instead of Google AI Studio).
Batch carries the image by public URL. If a batch submission is rejected before
validation, the model falls back to on demand with its 1 October provider block
and an inline image (recorded as an amendment, never silently).

    python3 scripts/llm_panel/legacy_panel.py freeze
    python3 scripts/llm_panel/legacy_panel.py batch-submit --model gpt-5.5 [--shape messages]
    python3 scripts/llm_panel/legacy_panel.py batch-poll
    python3 scripts/llm_panel/legacy_panel.py fallback --model claude-opus-4.7   # amendment + on-demand requests
    python3 scripts/llm_panel/legacy_panel.py run --model claude-opus-4.7        # on demand
    python3 scripts/llm_panel/legacy_panel.py audit
Credentials: none here; requests go through the local broker socket.
"""
import argparse
import base64
import collections
import hashlib
import http.client
import json
import pathlib
import signal
import sys
import time

HERE = pathlib.Path(__file__).resolve().parent
ROOT = HERE.parents[1]
sys.path.insert(0, str(HERE))
sys.path.insert(0, str(ROOT / "scripts/openrouter"))
import campaign as C  # noqa: E402
import grading  # noqa: E402

STUDY = "2026-10-17-earlier-generations-panel"
OUT = ROOT / "output/legacy-panel"
PLAN = ROOT / "public/evidence/frontier-image-panel/plan.json"
CORPUS = ROOT / "public/evidence/subq-panel/corpus.json"
ASSETS = ROOT / "public/evidence/assets"
PROMPT = HERE / "prompt.txt"
PROMPT_SHA256 = "b7ef8260e400f8e474056bb7249b1c135e3c74a64f174c84c69d87fc8c78bac4"
IMAGE_URL_BASE = "https://raw.githubusercontent.com/JoeyWilkes12/queens-model-assessment/evidence/frontier-image-panel/images/"
MAX_TOKENS, INPUT_TOKEN_RESERVE, SURCHARGE_RESERVE, TIMEOUT = 12288, 12000, 0.01, 600
HIGH = {"effort": "high", "exclude": True}

# 1 October envelopes (public/evidence/runs/2026-10-01-earlier-generations/*/request.json),
# their batch providers, and the 1 October mean reported cost per original-image request.
MODELS = {
    "gpt-5.5": {"model": "openai/gpt-5.5", "reasoning": HIGH, "batch_provider": "openai", "batch_prices": (2.5e-6, 1.5e-5),
                "prices": (5e-6, 3e-5), "mean_cost": 0.064803,
                "provider": {"order": ["openai"], "only": ["openai"], "ignore": ["openai/flex", "openai/fast"], "allow_fallbacks": False, "require_parameters": True, "max_price": {"prompt": 5, "completion": 30}}},
    "gpt-5.4": {"model": "openai/gpt-5.4", "reasoning": HIGH, "batch_provider": "openai", "batch_prices": (1.25e-6, 7.5e-6),
                "prices": (2.5e-6, 1.5e-5), "mean_cost": 0.043662,
                "provider": {"order": ["openai"], "only": ["openai"], "ignore": ["openai/flex", "openai/fast"], "allow_fallbacks": False, "require_parameters": True, "max_price": {"prompt": 2.5, "completion": 15}}},
    "gpt-5": {"model": "openai/gpt-5", "reasoning": HIGH, "batch_provider": "openai", "batch_prices": (6.25e-7, 5e-6),
              "prices": (1.25e-6, 1e-5), "mean_cost": 0.104879,
              "provider": {"order": ["openai/default"], "only": ["openai/default"], "ignore": [], "allow_fallbacks": False, "require_parameters": True, "max_price": {"prompt": 1.25, "completion": 10}}},
    "gpt-4.1": {"model": "openai/gpt-4.1", "reasoning": None, "batch_provider": "openai", "batch_prices": (1e-6, 4e-6),
                "prices": (2e-6, 8e-6), "mean_cost": 0.002292,
                "provider": {"order": ["openai"], "only": ["openai"], "ignore": [], "allow_fallbacks": False, "require_parameters": True, "max_price": {"prompt": 2, "completion": 8}}},
    "claude-opus-4.7": {"model": "anthropic/claude-opus-4.7", "reasoning": HIGH, "batch_provider": "anthropic", "batch_prices": (2.5e-6, 1.25e-5),
                        "prices": (5e-6, 2.5e-5), "mean_cost": 0.05756,
                        "provider": {"order": ["anthropic"], "only": ["anthropic"], "ignore": [], "allow_fallbacks": False, "require_parameters": True, "max_price": {"prompt": 5, "completion": 25}}},
    "claude-opus-4.6": {"model": "anthropic/claude-opus-4.6", "reasoning": HIGH, "batch_provider": "anthropic", "batch_prices": (2.5e-6, 1.25e-5),
                        "prices": (5e-6, 2.5e-5), "mean_cost": 0.105048,
                        "provider": {"order": ["anthropic"], "only": ["anthropic"], "ignore": [], "allow_fallbacks": False, "require_parameters": True, "max_price": {"prompt": 5, "completion": 25}}},
    "gemini-2.5-pro": {"model": "google/gemini-2.5-pro", "reasoning": HIGH, "batch_provider": "google-vertex/global", "batch_prices": (6.25e-7, 5e-6),
                       "prices": (1.25e-6, 1e-5), "mean_cost": 0.084383,
                       "provider": {"order": ["google-ai-studio"], "only": ["google-ai-studio"], "ignore": ["google-ai-studio/flex", "google-ai-studio/priority"], "allow_fallbacks": False, "require_parameters": True, "max_price": {"prompt": 1.25, "completion": 10}}},
    "gemini-2.5-flash": {"model": "google/gemini-2.5-flash", "reasoning": HIGH, "batch_provider": "google-vertex/global", "batch_prices": (1.5e-7, 1.25e-6),
                         "prices": (3e-7, 2.5e-6), "mean_cost": 0.028828,
                         "provider": {"order": ["google-ai-studio"], "only": ["google-ai-studio"], "ignore": ["google-ai-studio/flex", "google-ai-studio/priority"], "allow_fallbacks": False, "require_parameters": True, "max_price": {"prompt": 0.3, "completion": 2.5}}},
}
# Tested on 1 October but no longer routable: OpenRouter lists no endpoint for it (checked 17 October).
RETIRED = {"claude-sonnet-4": "anthropic/claude-sonnet-4"}
BATCH_RESERVE_FACTOR = 1.5  # x (1 October mean cost x 0.5 batch discount) per request, as in the 16 October panel


def utc():
    return C.utc()


def sha(data):
    return hashlib.sha256(data).hexdigest()


read, save = C.read, C.save


def boards():
    corpus = {b["id"]: b for b in read(CORPUS)["boards"]}
    return [corpus[i] for i in read(PLAN)["selection"]["boards"]]


def board_png(board_id):
    plan = read(PLAN)
    digest = next(c["image_sha256"] for c in plan["schedule"] if c["board_id"] == board_id)
    png = (ASSETS / f"{digest}.png").read_bytes()
    assert sha(png) == digest
    return png, digest


def grading_board(b):
    return {"id": b["id"], "size": b["size"], "regions": b["regions"]}


def prompt_for(b):
    template = PROMPT.read_text()
    assert sha(PROMPT.read_bytes()) == PROMPT_SHA256
    return template.replace("{{BOARD_ID}}", b["id"]).replace("{{SIZE}}", str(b["size"]))


def chat_messages(b, image_url):
    return [{"role": "user", "content": [{"type": "text", "text": prompt_for(b)}, {"type": "image_url", "image_url": {"url": image_url}}]}]


def batch_worst_case(short):
    ip, op = MODELS[short]["batch_prices"]
    return INPUT_TOKEN_RESERVE * ip + MAX_TOKENS * op + SURCHARGE_RESERVE


def on_demand_worst_case(short):
    ip, op = MODELS[short]["prices"]
    return INPUT_TOKEN_RESERVE * ip + MAX_TOKENS * op + SURCHARGE_RESERVE


# ---------------------------------------------------------------- freeze

def freeze(args):
    if (OUT / "manifest.json").exists():
        raise SystemExit("Already frozen; do not overwrite")
    plan = read(PLAN)
    # Same interleaved board order as the frontier panel schedule (sizes alternate by board).
    order = list(dict.fromkeys(c["board_id"] for c in plan["schedule"]))
    by_id = {b["id"]: b for b in boards()}
    frontier_requests = ROOT.parent / "openrouter-panel/output/llm-panel/requests"
    schedule = []
    for seq, board_id in enumerate(order, 1):
        b = by_id[board_id]
        png, digest = board_png(board_id)
        messages = chat_messages(b, IMAGE_URL_BASE + f"{board_id}.png")
        # The frontier panel's GPT-5.6 Sol batch request for this board carries the same messages.
        gpt = next(c for c in plan["schedule"] if c["board_id"] == board_id and c["short"] == "gpt-5.6-sol")
        local = frontier_requests / f"{gpt['call_id']}.json"
        if local.exists():
            assert read(local)["messages"] == messages, "messages differ from the 16 October panel"
        for short, spec in MODELS.items():
            call_id = f"{seq:03d}_{board_id}_{short}"
            body = {"messages": messages, "max_tokens": MAX_TOKENS}
            if spec["reasoning"]:
                body["reasoning"] = spec["reasoning"]
            save(OUT / "requests" / f"{call_id}.json", body)
            schedule.append({"call_id": call_id, "board_id": board_id, "size": b["size"], "model": spec["model"], "short": short,
                             "route": "batch", "image_sha256": digest, "prompt_sha256": sha(prompt_for(b).encode()),
                             "messages_sha256": sha(json.dumps(messages, sort_keys=True).encode()),
                             "request_sha256": sha((OUT / "requests" / f"{call_id}.json").read_bytes()),
                             "batch_worst_case_usd": batch_worst_case(short)})
    save(OUT / "manifest.json", {"study": STUDY, "frozen_utc": utc(), "prompt_template_sha256": PROMPT_SHA256,
                                 "max_tokens": MAX_TOKENS, "timeout_seconds": TIMEOUT, "models": MODELS, "retired": RETIRED,
                                 "image_url_base": IMAGE_URL_BASE, "boards": order, "board_plan": str(PLAN.relative_to(ROOT)),
                                 "batch_reserve_factor": BATCH_RESERVE_FACTOR, "schedule": schedule, "amendments": []})
    print(json.dumps({"frozen": len(schedule), "models": len(MODELS), "boards": len(order)}))


# ---------------------------------------------------------------- receipts

def record(call, body, status, elapsed, extra, directory=None):
    directory = directory or OUT / "raw" / call["call_id"]
    save(directory / "response.json", body)
    text = None
    if status == 200 and isinstance(body, dict):
        if "choices" in body:
            text = ((body.get("choices") or [{}])[0].get("message") or {}).get("content")
        elif isinstance(body.get("content"), list):  # Anthropic Messages shape
            parts = [p.get("text") for p in body["content"] if p.get("type") == "text" and isinstance(p.get("text"), str)]
            text = "".join(parts) if parts else None
    board = grading_board(next(b for b in boards() if b["id"] == call["board_id"]))
    strict = grading.grade(board, text) if isinstance(text, str) else {"format_valid": False, "correct": False, "checks": {}, "failure": "no_answer"}
    diagnostic = grading.diagnose(board, text)
    usage = body.get("usage") if isinstance(body, dict) else None
    finish = None
    if isinstance(body, dict):
        finish = (body.get("choices") or [{}])[0].get("finish_reason") if "choices" in body else body.get("stop_reason")
    meta = {"call_id": call["call_id"], "board_id": call["board_id"], "size": call["size"], "model": call["model"], "route": call["route"],
            "completed_utc": utc(), "http_status": status, "elapsed_seconds": elapsed,
            "returned_model": body.get("model") if isinstance(body, dict) else None,
            "provider": body.get("provider") if isinstance(body, dict) else None,
            "generation_id": body.get("id") if isinstance(body, dict) else None,
            "finish_reason": finish, "usage": usage, **item_cost(call, usage, extra),
            "response_sha256": sha(json.dumps(body, sort_keys=True).encode()), **extra}
    save(directory / "grade.json", strict)
    save(directory / "diagnostic.json", diagnostic)
    save(directory / "metadata.json", meta)
    print(json.dumps({"event": "recorded", "call_id": call["call_id"], "status": status, "strict_correct": strict.get("correct"),
                      "written_correct": diagnostic.get("rule_valid_after_extraction"), "cost": meta["cost_usd"]}), flush=True)


def item_cost(call, usage, extra):
    """Reported cost; for batch items (no per-item cost) tokens x batch price, which reproduces batch totals."""
    usage = usage if isinstance(usage, dict) else {}
    if isinstance(usage.get("cost"), (int, float)):
        return {"cost_usd": usage["cost"], "cost_source": "usage.cost"}
    if "batch_id" in extra:
        prompt = usage.get("prompt_tokens", usage.get("input_tokens"))
        completion = usage.get("completion_tokens", usage.get("output_tokens"))
        if isinstance(prompt, int) and isinstance(completion, int):
            ip, op = MODELS[call["short"]]["batch_prices"]
            return {"cost_usd": round(prompt * ip + completion * op, 9), "cost_source": "tokens x batch price (batch items report no per-item cost)"}
    return {"cost_usd": None, "cost_source": "not reported"}


# ---------------------------------------------------------------- batch

def batch_dir(short):
    return OUT / "batches" / short


def messages_shape(body, short):
    """Anthropic Messages body with the same content; reasoning.effort -> output_config.effort (OpenRouter's documented mapping)."""
    text = body["messages"][0]["content"][0]["text"]
    url = body["messages"][0]["content"][1]["image_url"]["url"]
    out = {"max_tokens": body["max_tokens"],
           "messages": [{"role": "user", "content": [{"type": "text", "text": text}, {"type": "image", "source": {"type": "url", "url": url}}]}]}
    if MODELS[short]["reasoning"]:
        out["thinking"] = {"type": "adaptive"}
        out["output_config"] = {"effort": "high"}
    return out


def batch_submit(args):
    short = args.model
    manifest = read(OUT / "manifest.json")
    if (batch_dir(short) / "submission.json").exists():
        raise SystemExit("Batch already submitted for " + short)
    if (batch_dir(short) / "submitting.json").exists():
        raise SystemExit("An earlier submission's outcome is unknown; reconcile it (--batch-id) before resubmitting")
    calls = [c for c in manifest["schedule"] if c["short"] == short and c["route"] == "batch"]
    if not calls:
        raise SystemExit("No batch-route calls for " + short)
    reserve = len(calls) * MODELS[short]["mean_cost"] * 0.5 * BATCH_RESERVE_FACTOR
    name = f"legacy-batch-{short}"
    ok, state = C.reserve(name, reserve, {"study": STUDY, "requests": len(calls)}, legacy=True)
    if not ok:
        raise SystemExit("Cap would be exceeded: " + json.dumps(state))
    requests = []
    for call in calls:
        path = OUT / "requests" / f"{call['call_id']}.json"
        assert sha(path.read_bytes()) == call["request_sha256"]
        body = read(path)
        requests.append({"custom_id": call["call_id"], "body": messages_shape(body, short) if args.shape == "messages" else body})
    endpoint = "/v1/messages" if args.shape == "messages" else "/v1/chat/completions"
    payload = {"endpoint": endpoint, "model": MODELS[short]["model"] + (":batch" if args.batch_suffix else ""),
               "provider": {"only": [MODELS[short]["batch_provider"]], "allow_fallbacks": False},
               "completion_window": "24h", "requests": requests}  # requests serialized last, as the API requires
    attempt = len(list(batch_dir(short).glob("submission-response-attempt*.json"))) + 1 if batch_dir(short).exists() else 1
    save(batch_dir(short) / f"payload-attempt{attempt}.json", payload)
    save(batch_dir(short) / "submitting.json", {"utc": utc(), "attempt": attempt, "shape": args.shape, "model": payload["model"]})
    try:
        status, body = C.broker("POST", "/api/v1/batches", payload, timeout=180)
    except (OSError, http.client.HTTPException) as error:
        # The server may have accepted it: keep the reserve and the marker until reconciled.
        raise SystemExit(f"Submission outcome unknown ({type(error).__name__}); reconcile with --batch-id or the batch list")
    save(batch_dir(short) / f"submission-response-attempt{attempt}.json", {"http_status": status, "body": body})
    batch_id = (body.get("id") or (body.get("data") or {}).get("id")) if isinstance(body, dict) else None
    if status not in (200, 201, 202) or not batch_id:
        print(json.dumps({"event": "batch_rejected", "model": short, "status": status, "attempt": attempt,
                          "error": (body.get("error") if isinstance(body, dict) else None)}))
        if status is not None and 400 <= status < 500:
            C.release(name, f"HTTP {status} rejection at submit")  # certainly not accepted
            (batch_dir(short) / "submitting.json").unlink()
        raise SystemExit(1)
    attach(short, batch_id, args.shape, endpoint, len(requests), reserve, attempt, status)


def attach(short, batch_id, shape, endpoint, requests, reserve, attempt, status):
    C.mark_key_held(f"legacy-batch-{short}", batch_id)
    save(batch_dir(short) / "submission.json", {"batch_id": batch_id, "submitted_utc": utc(), "http_status": status, "shape": shape,
                                                "endpoint": endpoint, "provider_only": MODELS[short]["batch_provider"],
                                                "requests": requests, "provisional_reserve_usd": reserve, "attempt": attempt})
    marker = batch_dir(short) / "submitting.json"
    if marker.exists():
        marker.unlink()
    print(json.dumps({"event": "batch_submitted", "model": short, "batch_id": batch_id, "requests": requests, "status": status}))


def reconcile(args):
    """Attach a batch whose submission outcome was unknown (found in the account's batch list)."""
    short = args.model
    marker = read(batch_dir(short) / "submitting.json")
    if not args.batch_id:
        status, body = C.broker("GET", "/api/v1/batches", timeout=120)
        items = (body.get("data") if isinstance(body, dict) else None) or []
        print(json.dumps([{k: i.get(k) for k in ("id", "model", "status", "created_at", "request_counts")} for i in items][:20], indent=1))
        return
    reserve = read(C.OUT / "reserves" / f"legacy-batch-{short}.json")["reserve_usd"]
    attach(short, args.batch_id, marker["shape"], "/v1/messages" if marker["shape"] == "messages" else "/v1/chat/completions",
           sum(c["short"] == short for c in read(OUT / "manifest.json")["schedule"]), reserve, marker["attempt"], None)


def batch_poll(args):
    manifest = read(OUT / "manifest.json")
    for short in MODELS:
        sub_path = batch_dir(short) / "submission.json"
        if not sub_path.exists() or (batch_dir(short) / "settled.json").exists():
            continue
        sub = read(sub_path)
        status, body = C.broker("GET", f"/api/v1/batches/{sub['batch_id']}", timeout=180)
        data = body.get("data", body) if isinstance(body, dict) else {}
        state = data.get("status")
        print(json.dumps({"event": "batch_status", "model": short, "status": state, "request_counts": data.get("request_counts"),
                          "provider": data.get("provider")}), flush=True)
        if state not in ("completed", "failed", "expired", "cancelled"):
            continue
        save(batch_dir(short) / "final.json", body)
        by_id = {c["call_id"]: c for c in manifest["schedule"] if c["short"] == short}
        for item in data.get("results") or []:
            call = by_id.get(item.get("custom_id"))
            if not call or (OUT / "raw" / call["call_id"] / "metadata.json").exists():
                continue
            response = item.get("response") or {}
            record(call, response.get("body") if response else {"error": item.get("error")},
                   response.get("status_code") if response else None, None,
                   {"batch_id": sub["batch_id"], "batch_request_id": response.get("request_id"), "batch_error": item.get("error"),
                    "batch_shape": sub.get("shape", "chat")})
        for call in by_id.values():  # submitted but absent from the results: no answer
            if not (OUT / "raw" / call["call_id"] / "metadata.json").exists():
                record(call, {"error": {"type": "missing_from_batch_results", "batch_status": state}}, None, None,
                       {"batch_id": sub["batch_id"], "batch_shape": sub.get("shape", "chat")})
        usage = data.get("usage") or {}
        save(batch_dir(short) / "settled.json", {"settled_utc": utc(), "status": state, "usage": usage,
                                                 "error": data.get("error"), "provider": data.get("provider")})
        C.settle(f"legacy-batch-{short}", usage.get("cost") if isinstance(usage.get("cost"), (int, float)) else None,
                 f"batch {sub['batch_id']} usage.cost")


# ---------------------------------------------------------------- on-demand fallback

def fallback(args):
    """Amendment: move one model's unrun calls to on demand (1 October provider block, inline image)."""
    short = args.model
    manifest = read(OUT / "manifest.json")
    if (batch_dir(short) / "submission.json").exists() and not (batch_dir(short) / "settled.json").exists():
        raise SystemExit("A batch for this model is still open")
    if (batch_dir(short) / "submitting.json").exists():
        raise SystemExit("A submission outcome is unknown; reconcile it first")
    if not args.reason:
        raise SystemExit("--reason is required; it is recorded in the amendment")
    spec = MODELS[short]
    moved = 0
    for call in manifest["schedule"]:
        if call["short"] != short or (OUT / "raw" / call["call_id"] / "metadata.json").exists():
            continue
        path = OUT / "requests" / f"{call['call_id']}.json"
        body = read(path)
        png, digest = board_png(call["board_id"])
        assert digest == call["image_sha256"]
        body["messages"][0]["content"][1]["image_url"] = {"url": "data:image/png;base64," + base64.b64encode(png).decode()}
        body = {"model": spec["model"], **body, "stream": False, "provider": spec["provider"]}
        save(path, body)
        call.update(route="on_demand", request_sha256=sha(path.read_bytes()), worst_case_usd=on_demand_worst_case(short))
        moved += 1
    manifest["amendments"].append({"id": len(manifest["amendments"]) + 1, "utc": utc(), "model": spec["model"], "moved_calls": moved,
                                   "change": f"{spec['model']} moved from Batch to on demand with its 1 October provider block and inline image. Reason: {args.reason}"})
    save(OUT / "manifest.json", manifest)
    print(json.dumps({"amended": moved, "model": short}))


def run(args):
    manifest = read(OUT / "manifest.json")
    calls = [c for c in manifest["schedule"] if c["route"] == "on_demand" and (not args.model or c["short"] == args.model)]
    done = 0
    for call in calls:
        directory = OUT / "raw" / call["call_id"]
        if (directory / "metadata.json").exists():
            continue
        if (directory / "started.json").exists():
            raise SystemExit("Incomplete call exists; no automatic retry: " + call["call_id"])
        if args.limit is not None and done >= args.limit:
            break
        name = f"legacy-call-{call['call_id']}"
        ok, state = C.reserve(name, call["worst_case_usd"], {"call_id": call["call_id"]}, legacy=True)
        if not ok:
            print(json.dumps({"event": "cap_stop", **state}))
            break
        request_path = OUT / "requests" / f"{call['call_id']}.json"
        assert sha(request_path.read_bytes()) == call["request_sha256"]
        body = read(request_path)
        save(directory / "started.json", {"started_utc": utc(), "request_sha256": call["request_sha256"]})
        start = time.monotonic()

        def deadline(signum, frame):
            raise TimeoutError("client timeout")
        signal.signal(signal.SIGALRM, deadline)
        signal.alarm(TIMEOUT)
        try:
            status, response = C.broker("POST", "/api/v1/chat/completions", body, timeout=TIMEOUT + 30)
            extra = {}
        except (TimeoutError, OSError, http.client.HTTPException) as error:
            status, response = None, {"error": {"type": type(error).__name__}}
            extra = {"halt_reason": "uncertain_network_or_response_failure_no_retry", "exception_type": type(error).__name__}
        finally:
            signal.alarm(0)
        record(call, response, status, time.monotonic() - start, extra)
        cost = ((response.get("usage") or {}).get("cost") if isinstance(response, dict) else None)
        # A reply without a reported cost: an HTTP error body costs nothing; a timeout's cost is unknown (worst case kept).
        C.settle(name, cost if isinstance(cost, (int, float)) else (0.0 if status is not None else None), f"on-demand {call['call_id']}")
        done += 1


# ---------------------------------------------------------------- audit

def classify(meta, strict, diag):
    if strict.get("correct") and strict.get("format_valid"):
        return "strict"
    if diag.get("rule_valid_after_extraction"):
        return "format_only"
    if meta.get("http_status") != 200:
        return "no_answer"
    if meta.get("finish_reason") in ("length", "max_tokens"):
        return "truncated"
    return "wrong"


def by_model(rows):
    """Correct (strict or format-only) and strict counts per model, with Clopper-Pearson 95% intervals."""
    sys.path.insert(0, str(ROOT / "scripts/subq"))
    from trajectories import clopper_pearson
    out = {}
    for short in MODELS:
        mine = [r for r in rows if r["short"] == short and r["state"] == "recorded"]
        correct = sum(r["outcome"] in ("strict", "format_only") for r in mine)
        strict = sum(r["outcome"] == "strict" for r in mine)
        out[short] = {"model": MODELS[short]["model"], "recorded": len(mine), "correct": correct, "strict": strict,
                      "correct_cp95": list(clopper_pearson(correct, len(mine))) if mine else None,
                      "outcomes": dict(collections.Counter(r["outcome"] for r in mine)),
                      "cost_usd": round(sum(r.get("cost_usd") or 0 for r in mine), 6),
                      "route": next((r["route"] for r in mine), None),
                      "providers": sorted({r.get("provider") for r in mine if r.get("provider")})}
    return out


def audit(args):
    manifest = read(OUT / "manifest.json")
    rows = []
    for call in manifest["schedule"]:
        meta_path = OUT / "raw" / call["call_id"] / "metadata.json"
        if not meta_path.exists():
            rows.append({**call, "state": "not_run"})
            continue
        meta = read(meta_path)
        strict = read(meta_path.parent / "grade.json")
        diag = read(meta_path.parent / "diagnostic.json")
        rows.append({**call, "state": "recorded", "outcome": classify(meta, strict, diag), "cost_usd": meta.get("cost_usd"),
                     "elapsed_seconds": meta.get("elapsed_seconds"), "returned_model": meta.get("returned_model"),
                     "provider": meta.get("provider"), "finish_reason": meta.get("finish_reason")})
    table = collections.defaultdict(collections.Counter)
    for r in rows:
        table[(r["short"], r["size"])][r.get("outcome", r["state"])] += 1
    summary = {"study": STUDY, "updated_utc": utc(), "rows": rows, "retired": RETIRED, "amendments": manifest["amendments"],
               "outcome_definitions": {"strict": "correct placement in the exact JSON-only format",
                                       "format_only": "correct placement found by the post-hoc single-object extraction, format broken",
                                       "truncated": "HTTP 200 but the 12,288-token budget ran out with no final answer",
                                       "wrong": "an answer that is not a correct placement",
                                       "no_answer": "the request failed before any model answer (HTTP error or timeout)"},
               "by_model_size": [{"model": k[0], "size": k[1], **v} for k, v in sorted(table.items())],
               "by_model": by_model(rows),
               "cost_usd_reported": round(sum(r.get("cost_usd") or 0 for r in rows), 6)}
    save(OUT / "summary.json", summary)
    for item in summary["by_model_size"]:
        print(json.dumps(item))
    print(json.dumps({"cost_usd_reported": summary["cost_usd_reported"]}))


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("mode", choices=["freeze", "batch-submit", "batch-poll", "reconcile", "fallback", "run", "audit"])
    parser.add_argument("--batch-id")
    parser.add_argument("--batch-suffix", action="store_true", help="name the :batch variant explicitly")
    parser.add_argument("--model", choices=list(MODELS))
    parser.add_argument("--shape", choices=["chat", "messages"], default="chat")
    parser.add_argument("--reason")
    parser.add_argument("--limit", type=int)
    args = parser.parse_args()
    {"freeze": freeze, "batch-submit": batch_submit, "batch-poll": batch_poll, "reconcile": reconcile, "fallback": fallback, "run": run,
     "audit": audit}[args.mode](args)


if __name__ == "__main__":
    main()
