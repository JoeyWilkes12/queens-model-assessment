"""Frontier reasoning models, one shot from a board image, on new panel boards.

Replicates the September one-shot protocol (evaluations/2026-09-17-one-shot):
identical prompt template (sha256 b7ef8260…), byte-identical renderer, one
request per model and board, max_tokens 12288, reasoning effort high with
reasoning excluded, no tools, no retries, strict JSON grade plus the post-hoc
format diagnostic. Boards are a stratified subset of the 192-board SubQ/Jev
panel, so every board here also has decision-model results.

Routes (see docs/frontier-image-panel-preregistration.md):
  * GPT-5.6 Sol and Claude Opus 4.8: OpenRouter Batch API, pinned to the
    original provider (OpenAI, Anthropic), image by public URL (batch accepts
    URLs only). Same image bytes; latency is not measured.
  * Gemini 3.1 Pro Preview (Google AI Studio) and Grok 4.6 (Amazon Bedrock
    us-west-2): on demand, the original provider blocks, inline image, the
    original 600 s timeout.

    python3 scripts/llm_panel/one_shot_panel.py select|render|freeze|run|batch-submit|batch-poll|grade|audit
Credentials: none here; requests go through the local broker socket.
"""
import argparse
import base64
import collections
import hashlib
import http.client
import json
import pathlib
import random
import signal
import socket
import sys
import time
from datetime import datetime, timezone

ROOT = pathlib.Path(__file__).resolve().parents[2]
HERE = pathlib.Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import grading  # noqa: E402

STUDY = "2026-10-16-frontier-image-panel"
OUT = ROOT / "output/llm-panel"
CORPUS = ROOT / "public/evidence/subq-panel/corpus.json"
SOCKET = str(pathlib.Path.home() / "Library/Application Support/OpenRouterBroker/openrouter.sock")
PROMPT_SHA256 = "b7ef8260e400f8e474056bb7249b1c135e3c74a64f174c84c69d87fc8c78bac4"
MAX_TOKENS, INPUT_TOKEN_RESERVE, SURCHARGE_RESERVE, TIMEOUT = 12288, 12000, 0.01, 600
SEED = 20261016
PER_STRATUM = 3  # 4 strata x 3 = 12 boards per size, 36 in total
CAMPAIGN_CAP_USD = 9.50          # all new OpenRouter spend in this campaign, Jev included
KEY_USAGE_BASELINE_USD = 4.603064242  # key usage before the campaign (read 2026-10-16)
IMAGE_URL_BASE = "https://raw.githubusercontent.com/JoeyWilkes12/queens-model-assessment/evidence/frontier-image-panel/images/"

MODELS = {
    "gpt-5.6-sol": {"model": "openai/gpt-5.6-sol", "route": "batch", "prices": (2e-6, 1e-5),
                    "batch_provider": {"only": ["openai"], "allow_fallbacks": False}},
    "claude-opus-4.8": {"model": "anthropic/claude-opus-4.8", "route": "batch", "prices": (2.5e-6, 1.25e-5),
                        "batch_provider": {"only": ["anthropic"], "allow_fallbacks": False}},
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


def utc():
    return datetime.now(timezone.utc).isoformat()


def sha(data):
    return hashlib.sha256(data).hexdigest()


def read(path):
    return json.loads(pathlib.Path(path).read_text())


def save(path, obj):
    path = pathlib.Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(obj, indent=2) + "\n")


class Broker(http.client.HTTPConnection):
    def __init__(self, timeout):
        super().__init__("localhost", timeout=timeout)

    def connect(self):
        self.sock = socket.socket(socket.AF_UNIX, socket.SOCK_STREAM)
        self.sock.settimeout(self.timeout)
        self.sock.connect(SOCKET)


def broker(method, path, body=None, timeout=60):
    connection = Broker(timeout)
    try:
        data = json.dumps(body).encode() if body is not None else None
        connection.request(method, path, body=data, headers={"Content-Type": "application/json"} if data else {})
        response = connection.getresponse()
        raw = response.read()
        try:
            return response.status, json.loads(raw)
        except json.JSONDecodeError:
            return response.status, {"error": {"type": "non_json_body", "bytes": len(raw)}}
    finally:
        connection.close()


def campaign_spend():
    """New spend since the campaign baseline, from the key's usage counter (numbers only)."""
    status, body = broker("GET", "/api/v1/key")
    usage = (body.get("data") or {}).get("usage") if status == 200 else None
    if not isinstance(usage, (int, float)):
        raise SystemExit("Could not read key usage; refusing to spend")
    return usage - KEY_USAGE_BASELINE_USD


def worst_case(short):
    ip, op = MODELS[short]["prices"]
    return INPUT_TOKEN_RESERVE * ip + MAX_TOKENS * op + SURCHARGE_RESERVE


# ---------------------------------------------------------------- selection

def select(args):
    plan_path = OUT / "selection.json"
    if plan_path.exists():
        raise SystemExit("Selection already frozen")
    corpus = read(CORPUS)
    rng = random.Random(SEED)
    chosen = []
    for size in (5, 7, 9):
        for status in ("singleton", "no_singleton"):
            for tier in ("lower_search", "higher_search"):
                pool = sorted(b["id"] for b in corpus["boards"] if b["size"] == size
                              and b["stratum"]["singleton_status"] == status and b["stratum"]["tier"] == tier)
                chosen += sorted(rng.sample(pool, PER_STRATUM))
    save(plan_path, {"study": STUDY, "seed": SEED, "per_stratum": PER_STRATUM, "corpus": str(CORPUS.relative_to(ROOT)),
                     "corpus_sha256": sha(CORPUS.read_bytes()), "boards": chosen, "selected_utc": utc()})
    print(json.dumps({"selected": len(chosen)}))


def boards():
    corpus = {b["id"]: b for b in read(CORPUS)["boards"]}
    return [corpus[i] for i in read(OUT / "selection.json")["boards"]]


def grading_board(b):
    return {"id": b["id"], "size": b["size"], "regions": b["regions"]}


def render(args):
    from render import render_png
    for b in boards():
        path = OUT / "images" / f"{b['id']}.png"
        path.parent.mkdir(parents=True, exist_ok=True)
        render_png(b["size"], b["regions"], path)
    print(json.dumps({"rendered": len(boards())}))


# ---------------------------------------------------------------- freeze

def freeze(args):
    if (OUT / "manifest.json").exists():
        raise SystemExit("Already frozen; do not overwrite")
    template = (HERE / "prompt.txt").read_text()
    assert sha((HERE / "prompt.txt").read_bytes()) == PROMPT_SHA256
    rng = random.Random(SEED)
    sized = sorted(boards(), key=lambda b: (b["size"], b["id"]))
    by_size = {s: [b for b in sized if b["size"] == s] for s in (5, 7, 9)}
    order = [b for trio in zip(by_size[5], by_size[7], by_size[9]) for b in trio]  # sizes interleaved
    schedule, seq = [], 0
    for b in order:
        png = (OUT / "images" / f"{b['id']}.png").read_bytes()
        assert png[:8] == b"\x89PNG\r\n\x1a\n" and len(png) < 250000
        prompt = template.replace("{{BOARD_ID}}", b["id"]).replace("{{SIZE}}", str(b["size"]))
        models = list(MODELS)
        rng.shuffle(models)
        for short in models:
            seq += 1
            spec = MODELS[short]
            call_id = f"{seq:03d}_{b['id']}_{short}"
            if spec["route"] == "on_demand":
                image = {"url": "data:image/png;base64," + base64.b64encode(png).decode()}
            else:
                image = {"url": IMAGE_URL_BASE + f"{b['id']}.png"}
            messages = [{"role": "user", "content": [{"type": "text", "text": prompt}, {"type": "image_url", "image_url": image}]}]
            body = {"model": spec["model"], "messages": messages, "max_tokens": MAX_TOKENS,
                    "reasoning": {"effort": "high", "exclude": True}}
            if spec["route"] == "on_demand":
                body.update(stream=False, provider=spec["provider"])
            save(OUT / "requests" / f"{call_id}.json", body)
            schedule.append({"call_id": call_id, "board_id": b["id"], "size": b["size"], "model": spec["model"], "short": short,
                             "route": spec["route"], "image_sha256": sha(png), "prompt_sha256": sha(prompt.encode()),
                             "request_sha256": sha((OUT / "requests" / f"{call_id}.json").read_bytes()),
                             "worst_case_usd": worst_case(short)})
    save(OUT / "manifest.json", {"study": STUDY, "frozen_utc": utc(), "prompt_template_sha256": PROMPT_SHA256,
                                 "max_tokens": MAX_TOKENS, "timeout_seconds": TIMEOUT, "reasoning_effort": "high",
                                 "campaign_cap_usd": CAMPAIGN_CAP_USD, "key_usage_baseline_usd": KEY_USAGE_BASELINE_USD,
                                 "models": MODELS, "image_url_base": IMAGE_URL_BASE, "selection": read(OUT / "selection.json"),
                                 "schedule": schedule})
    print(json.dumps({"frozen": len(schedule), "worst_case_total_usd": round(sum(c["worst_case_usd"] for c in schedule), 3)}))


# ---------------------------------------------------------------- receipts

def record(call, body, status, elapsed, extra):
    directory = OUT / "raw" / call["call_id"]
    save(directory / "response.json", body)
    text = None
    if status == 200 and isinstance(body, dict):
        text = ((body.get("choices") or [{}])[0].get("message") or {}).get("content")
    board = grading_board(next(b for b in boards() if b["id"] == call["board_id"]))
    strict = grading.grade(board, text) if isinstance(text, str) else {"format_valid": False, "correct": False, "checks": {}, "failure": "no_answer"}
    diagnostic = grading.diagnose(board, text)
    usage = body.get("usage") if isinstance(body, dict) else None
    meta = {"call_id": call["call_id"], "board_id": call["board_id"], "size": call["size"], "model": call["model"], "route": call["route"],
            "completed_utc": utc(), "http_status": status, "elapsed_seconds": elapsed,
            "returned_model": body.get("model") if isinstance(body, dict) else None,
            "provider": body.get("provider") if isinstance(body, dict) else None,
            "generation_id": body.get("id") if isinstance(body, dict) else None,
            "finish_reason": ((body.get("choices") or [{}])[0].get("finish_reason") if isinstance(body, dict) else None),
            "usage": usage, "cost_usd": (usage or {}).get("cost") if isinstance(usage, dict) else None,
            "response_sha256": sha(json.dumps(body, sort_keys=True).encode()), **extra}
    save(directory / "grade.json", strict)
    save(directory / "diagnostic.json", diagnostic)
    save(directory / "metadata.json", meta)
    print(json.dumps({"event": "recorded", "call_id": call["call_id"], "status": status, "strict_correct": strict.get("correct"),
                      "written_correct": diagnostic.get("rule_valid_after_extraction"), "cost": meta["cost_usd"]}), flush=True)


# ---------------------------------------------------------------- on demand

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
        spent = campaign_spend() + pending_batch_reserve()
        if spent + call["worst_case_usd"] > CAMPAIGN_CAP_USD:
            print(json.dumps({"event": "cap_stop", "spent_usd": round(spent, 4), "next_worst_case_usd": call["worst_case_usd"]}))
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
            status, response = broker("POST", "/api/v1/chat/completions", body, timeout=TIMEOUT + 30)
            extra = {}
        except (TimeoutError, OSError, http.client.HTTPException) as error:
            status, response = None, {"error": {"type": type(error).__name__}}
            extra = {"halt_reason": "uncertain_network_or_response_failure_no_retry", "exception_type": type(error).__name__}
        finally:
            signal.alarm(0)
        record(call, response, status, time.monotonic() - start, extra)
        done += 1


# ---------------------------------------------------------------- batch

def batch_dir(short):
    return OUT / "batches" / short


def pending_batch_reserve():
    """Provisional reserve for submitted, unsettled batches (historical-mean x1.5 per request)."""
    total = 0.0
    for short in ("gpt-5.6-sol", "claude-opus-4.8"):
        sub = batch_dir(short) / "submission.json"
        if sub.exists() and not (batch_dir(short) / "settled.json").exists():
            total += read(sub)["provisional_reserve_usd"]
    return total


HISTORICAL_MEAN_COST = {"gpt-5.6-sol": 0.011363, "claude-opus-4.8": 0.081435 / 2}  # September means; Opus at batch price


def batch_submit(args):
    short = args.model
    assert MODELS[short]["route"] == "batch"
    if (batch_dir(short) / "submission.json").exists():
        raise SystemExit("Batch already submitted for " + short)
    manifest = read(OUT / "manifest.json")
    calls = [c for c in manifest["schedule"] if c["short"] == short]
    reserve = len(calls) * HISTORICAL_MEAN_COST[short] * 1.5
    spent = campaign_spend() + pending_batch_reserve()
    if spent + reserve > CAMPAIGN_CAP_USD:
        raise SystemExit(f"Cap would be exceeded: spent {spent:.3f} + reserve {reserve:.3f}")
    requests = []
    for call in calls:
        request_path = OUT / "requests" / f"{call['call_id']}.json"
        assert sha(request_path.read_bytes()) == call["request_sha256"]
        body = read(request_path)
        body.pop("model")
        requests.append({"custom_id": call["call_id"], "body": body})
    payload = {"endpoint": "/v1/chat/completions", "model": MODELS[short]["model"], "provider": MODELS[short]["batch_provider"],
               "completion_window": "24h", "requests": requests}  # requests serialized last, as the API requires
    save(batch_dir(short) / "payload.json", payload)
    status, body = broker("POST", "/api/v1/batches", payload, timeout=120)
    save(batch_dir(short) / "submission-response.json", body)
    if status not in (200, 201, 202) or not isinstance(body, dict) or not (body.get("id") or (body.get("data") or {}).get("id")):
        raise SystemExit(f"Batch submission failed: HTTP {status}; response saved")
    batch_id = body.get("id") or body["data"]["id"]
    save(batch_dir(short) / "submission.json", {"batch_id": batch_id, "submitted_utc": utc(), "http_status": status,
                                                "requests": len(requests), "provisional_reserve_usd": reserve})
    print(json.dumps({"event": "batch_submitted", "model": short, "batch_id": batch_id, "requests": len(requests), "status": status}))


def batch_poll(args):
    manifest = read(OUT / "manifest.json")
    for short in ("gpt-5.6-sol", "claude-opus-4.8"):
        sub_path = batch_dir(short) / "submission.json"
        if not sub_path.exists() or (batch_dir(short) / "settled.json").exists():
            continue
        sub = read(sub_path)
        status, body = broker("GET", f"/api/v1/batches/{sub['batch_id']}", timeout=120)
        data = body.get("data", body) if isinstance(body, dict) else {}
        state = data.get("status")
        print(json.dumps({"event": "batch_status", "model": short, "status": state, "request_counts": data.get("request_counts")}))
        if state not in ("completed", "failed", "expired", "cancelled"):
            continue
        save(batch_dir(short) / "final.json", body)
        by_id = {c["call_id"]: c for c in manifest["schedule"] if c["short"] == short}
        for item in data.get("results") or []:
            call = by_id.get(item.get("custom_id"))
            if not call:
                continue
            response = item.get("response") or {}
            record(call, response.get("body") if response else {"error": item.get("error")},
                   response.get("status_code") if response else None, None,
                   {"batch_id": sub["batch_id"], "batch_request_id": response.get("request_id"), "batch_error": item.get("error")})
        save(batch_dir(short) / "settled.json", {"settled_utc": utc(), "status": state, "usage": data.get("usage")})


# ---------------------------------------------------------------- audit

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
        outcome = ("strict" if strict.get("correct") and strict.get("format_valid") else
                   "format_only" if diag.get("rule_valid_after_extraction") else
                   "no_answer" if meta["http_status"] != 200 else "wrong")
        rows.append({**call, "state": "recorded", "outcome": outcome, "cost_usd": meta.get("cost_usd"),
                     "elapsed_seconds": meta.get("elapsed_seconds"), "returned_model": meta.get("returned_model"),
                     "provider": meta.get("provider"), "finish_reason": meta.get("finish_reason")})
    table = collections.defaultdict(lambda: collections.Counter())
    for r in rows:
        table[(r["short"], r["size"])][r.get("outcome", r["state"])] += 1
    summary = {"study": STUDY, "updated_utc": utc(), "rows": rows,
               "by_model_size": [{"model": k[0], "size": k[1], **v} for k, v in sorted(table.items())],
               "cost_usd_reported": round(sum(r.get("cost_usd") or 0 for r in rows), 6),
               "campaign_spend_usd_from_key": round(campaign_spend(), 6)}
    save(OUT / "summary.json", summary)
    for item in summary["by_model_size"]:
        print(json.dumps(item))
    print(json.dumps({"cost_usd_reported": summary["cost_usd_reported"], "campaign_spend_usd_from_key": summary["campaign_spend_usd_from_key"]}))


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("mode", choices=["select", "render", "freeze", "run", "batch-submit", "batch-poll", "audit"])
    parser.add_argument("--model", choices=list(MODELS))
    parser.add_argument("--limit", type=int)
    args = parser.parse_args()
    {"select": select, "render": render, "freeze": freeze, "run": run, "batch-submit": batch_submit,
     "batch-poll": batch_poll, "audit": audit}[args.mode](args)


if __name__ == "__main__":
    main()
