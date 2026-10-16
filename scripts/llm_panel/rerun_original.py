"""Re-run one September one-shot request byte for byte (dated re-run, reported separately).

    python3 scripts/llm_panel/rerun_original.py <original request.json> <expected sha256> <board json>
Same 600 s timeout and no retry; receipts in output/llm-panel-rerun/<call id>/.
"""
import hashlib, json, pathlib, signal, sys, time
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import grading
from one_shot_panel import broker, save, utc, campaign_spend, CAMPAIGN_CAP_USD, TIMEOUT

request_path, expected, board_path = map(pathlib.Path, sys.argv[1:4])
raw = request_path.read_bytes()
assert hashlib.sha256(raw).hexdigest() == str(expected), "request bytes differ from the frozen September request"
board = json.loads(board_path.read_text())
body = json.loads(raw)
out = pathlib.Path(__file__).resolve().parents[2] / "output/llm-panel-rerun" / (request_path.stem + "_rerun-2026-10-16")
if (out / "started.json").exists():
    raise SystemExit("Already started; no automatic retry")
if campaign_spend() + 12000 * 2.2e-6 + 12288 * 6.6e-6 + 0.01 > CAMPAIGN_CAP_USD:
    raise SystemExit("Campaign cap would be exceeded")
save(out / "request.json", body)
save(out / "started.json", {"started_utc": utc(), "request_sha256": str(expected), "original_request": request_path.name})
start = time.monotonic()
signal.signal(signal.SIGALRM, lambda *a: (_ for _ in ()).throw(TimeoutError("client timeout")))
signal.alarm(TIMEOUT)
try:
    status, response = broker("POST", "/api/v1/chat/completions", body, timeout=TIMEOUT + 30)
except (TimeoutError, OSError) as error:
    status, response = None, {"error": {"type": type(error).__name__}}
finally:
    signal.alarm(0)
elapsed = time.monotonic() - start
save(out / "response.json", response)
text = ((response.get("choices") or [{}])[0].get("message") or {}).get("content") if status == 200 else None
strict = grading.grade(board, text) if isinstance(text, str) else {"format_valid": False, "correct": False, "checks": {}, "failure": "no_answer"}
diag = grading.diagnose(board, text)
usage = response.get("usage") if isinstance(response, dict) else None
meta = {"completed_utc": utc(), "http_status": status, "elapsed_seconds": elapsed, "returned_model": response.get("model"),
        "provider": response.get("provider"), "generation_id": response.get("id"), "usage": usage,
        "cost_usd": (usage or {}).get("cost") if isinstance(usage, dict) else None}
save(out / "grade.json", strict); save(out / "diagnostic.json", diag); save(out / "metadata.json", meta)
print(json.dumps({"status": status, "elapsed_seconds": round(elapsed, 1), "strict_correct": strict.get("correct"),
                  "written_correct": diag.get("rule_valid_after_extraction"), "cost": meta["cost_usd"], "provider": meta["provider"]}))
