"""Trusted credential/budget broker. Untrusted worker has only a Unix socket.

No URL/proxy/redirect supplied by the worker is ever followed. This module has
no package dependencies. Secrets arrive once over stdin, never CLI/env/mounts.
"""
import hashlib
import http.client
import json
import math
import os
from pathlib import Path
import re
import socketserver
import ssl
import sys
import time
from http.server import BaseHTTPRequestHandler

MODEL = "subq-snap-preview"
HOST = "api.subq.ai"
MAX_INPUT_TOKENS = 393216
RESERVATION = MAX_INPUT_TOKENS * 0.05 / 1_000_000
CAP_USD = 4.50
MAX_BODY = 1_000_000  # This text replay does not need the larger image limit.
MAX_RESPONSE = 8_000_000
LEDGER = Path("/ledger/budget.json")
SOCKET = "/ipc/subq.sock"


def validate(body):
    if not isinstance(body, dict) or set(body) != {"model", "state", "questions"}:
        raise ValueError("Only model, state, questions are permitted in text replay")
    if body["model"] != MODEL or not isinstance(body["state"], (str, dict, list)):
        raise ValueError("Unsupported model or state")
    questions = body["questions"]
    if not isinstance(questions, dict) or not 1 <= len(questions) <= 255:
        raise ValueError("Invalid question map")
    for name, q in questions.items():
        if not isinstance(name, str) or not 1 <= len(name) <= 100 or not isinstance(q, dict):
            raise ValueError("Invalid question name/object")
        if set(q) - {"type", "instructions", "criteria"}:
            raise ValueError("Unsupported question field")
        if not isinstance(q.get("instructions"), str):
            raise ValueError("Instructions must be text")
        kind, criteria = q.get("type"), q.get("criteria")
        if kind == "choice":
            if not isinstance(criteria, dict) or not 2 <= len(criteria) <= 255:
                raise ValueError("Choice requires 2–255 options")
        elif kind == "score":
            if not isinstance(criteria, list) or not 2 <= len(criteria) <= 10:
                raise ValueError("Score requires 2–10 ordered levels")
        elif kind == "noul":
            if criteria is not None and (not isinstance(criteria, dict) or set(criteria) - {"true", "false"}):
                raise ValueError("Invalid noul criteria")
        else:
            raise ValueError("Unsupported question type")


def redact(value, secret):
    """Redact decoded JSON strings/keys too, including escaped credential echoes."""
    if isinstance(value, str):
        return value.replace(secret, "[REDACTED]")
    if isinstance(value, list):
        return [redact(item, secret) for item in value]
    if isinstance(value, dict):
        return {redact(k, secret): redact(v, secret) for k, v in value.items()}
    return value


def safe_number(value, low, high):
    return value if type(value) in (int, float) and math.isfinite(value) and low <= value <= high else None


def public_response(body, request=None, models=False):
    """Only public labels and bounded numbers can leave the credential boundary.

    Normal documented answers are preserved. Arbitrary provider strings and
    extra fields are withheld so even re-encoded credential echoes cannot
    enter worker receipts. This intentionally is a filtered API receipt.
    """
    if not isinstance(body, dict):
        return {"receipt_filter": "unsupported provider body withheld"}
    if models:
        data = body.get("data")
        return {"object": "list", "data": [{"id": MODEL} for item in data
                if isinstance(item, dict) and item.get("id") == MODEL]} if isinstance(data, list) else {"data": []}
    if not request or not isinstance(body.get("answers"), dict):
        result = {"receipt_filter": "provider error/body withheld; consult HTTP status"}
        detail = body.get("detail")
        if isinstance(detail, dict):
            kind = detail.get("error_type")
            if kind in ("validation_error", "authentication_error", "insufficient_credits", "permission_error", "rate_limit_error", "server_error"):
                result["error_type"] = kind
            message = detail.get("message")
            if isinstance(message, str):
                # Diagnostic vocabulary is fixed locally, never arbitrary provider text.
                terms = ["questions", "criteria", "instructions", "choice", "noul", "score", "none", "null",
                         "reserved", "option", "name", "unique", "duplicate", "maximum", "minimum", "limit",
                         "invalid", "required", "unsupported", "model", "context", "token", "empty"]
                result["diagnostic_terms"] = [term for term in terms if term in message.lower()]
                if message.lower().startswith("questions"):
                    match = re.search(r"(?:more than|at most|maximum(?: of)?|limit)\s*[:=]?\s*(\d{1,3})", message, re.I)
                    if match and 1 <= int(match[1]) <= 255:
                        result["recognized_question_limit"] = int(match[1])
        return result
    if set(body["answers"]) != set(request["questions"]):
        return {"receipt_filter": "provider answer key mismatch; unexpected labels withheld"}
    result = {"model": MODEL if body.get("model") == MODEL else "[unexpected model]", "answers": {}}
    for name, q in request["questions"].items():
        answer = body["answers"].get(name)
        if not isinstance(answer, dict):
            continue
        typ = q["type"]
        out = {"type": typ if answer.get("type") == typ else "[unexpected type]"}
        if typ == "noul":
            out["noul"] = safe_number(answer.get("noul"), 0, 1)
        else:
            criteria = q["criteria"]
            labels = list(criteria) if typ == "choice" else [str(i) for i in range(len(criteria))]
            probabilities = answer.get("probabilities")
            if isinstance(probabilities, dict):
                out["probabilities"] = {label: safe_number(probabilities[label], 0, 1)
                                        for label in labels if label in probabilities}
                if set(probabilities) != set(labels):
                    out["probabilities"] = None
            out["confidence"] = safe_number(answer.get("confidence"), 0, 1)
            if typ == "choice":
                choice = answer.get("choice")
                out["choice"] = choice if isinstance(choice, str) and choice in criteria else "[unexpected choice]"
            else:
                out["score"] = safe_number(answer.get("score"), 0, len(criteria) - 1)
                legend = answer.get("legend")
                if isinstance(legend, dict):
                    out["legend"] = {str(i): text for i, text in enumerate(criteria) if legend.get(str(i)) == text}
        result["answers"][name] = out
    usage = body.get("usage")
    if isinstance(usage, dict):
        result["usage"] = {"input_tokens": safe_number(usage.get("input_tokens"), 0, MAX_INPUT_TOKENS),
                           "output_tokens": safe_number(usage.get("output_tokens"), 0, 0)}
    return result


class Ledger:
    def __init__(self, path=LEDGER):
        self.path = path
        self.data = json.loads(path.read_text()) if path.exists() else {
            "cap_usd": CAP_USD, "reservation_per_call_usd": RESERVATION,
            "price_input_per_million_usd": 0.05, "entries": [],
        }
        if self.data["cap_usd"] != CAP_USD:
            raise ValueError("Ledger cap mismatch")

    def snapshot(self):
        entries = self.data["entries"]
        return {"cap_usd": CAP_USD, "estimated_known_usd": sum(e.get("estimated_usd", 0) for e in entries),
                "unresolved_reserve_usd": sum(e["reserved_usd"] for e in entries if "estimated_usd" not in e),
                "calls_reserved": len(entries), "billing_confirmed": False}

    def save(self):
        tmp = self.path.with_suffix(".tmp")
        tmp.write_text(json.dumps({**self.data, "summary": self.snapshot()}, indent=2) + "\n")
        tmp.replace(self.path)

    def reserve(self, digest):
        snap = self.snapshot()
        if snap["estimated_known_usd"] + snap["unresolved_reserve_usd"] + RESERVATION > CAP_USD:
            raise ValueError("Budget cap reached; unresolved calls stay reserved")
        entry = {"sequence": len(self.data["entries"]) + 1, "request_sha256": digest,
                 "reserved_usd": RESERVATION, "status": "reserved", "started_unix": time.time()}
        self.data["entries"].append(entry)
        self.save()  # Reserve before sending, including on crash or timeout.
        return entry

    def settle(self, entry, status, body):
        entry["status"] = status
        usage = body.get("usage", {}) if isinstance(body, dict) else {}
        if not isinstance(usage, dict):
            usage = {}
        tokens = usage.get("input_tokens")
        if status == 200 and type(tokens) is int and 0 <= tokens <= MAX_INPUT_TOKENS:
            entry["input_tokens"] = tokens
            entry["estimated_usd"] = tokens * 0.05 / 1_000_000
        self.save()


class Handler(BaseHTTPRequestHandler):
    server_version = "QueensBroker/1"
    def log_message(self, *_):
        pass  # Never dump headers, bodies, exception representations or credentials.

    def send_json(self, obj, status=200):
        payload = json.dumps(obj, allow_nan=False).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(payload)))
        self.end_headers()
        self.wfile.write(payload)

    def do_GET(self):
        if self.path == "/health":
            return self.send_json({"ready": True, "budget": self.server.ledger.snapshot()})
        if self.path != "/v1/models":
            return self.send_json({"error": "path blocked"}, 403)
        if self.server.models_called:
            return self.send_json(self.server.models_result)
        self.server.models_called = True
        self.server.models_result = self.upstream("GET", "/v1/models", None)
        self.send_json(self.server.models_result)

    def do_POST(self):
        if self.path != "/v1/systemone":
            return self.send_json({"error": "path blocked"}, 403)
        try:
            length = int(self.headers.get("Content-Length", "0"))
            if self.headers.get("Transfer-Encoding") or not 0 < length <= MAX_BODY:
                raise ValueError("Body size/encoding blocked")
            raw = self.rfile.read(length)
            if self.server.secret.encode() in raw:
                raise ValueError("Credential present in worker request")
            body = json.loads(raw, parse_constant=lambda _: (_ for _ in ()).throw(ValueError("Nonfinite JSON")))
            validate(body)
            entry = self.server.ledger.reserve(hashlib.sha256(raw).hexdigest())
        except (ValueError, TypeError):
            return self.send_json({"status": 422, "body": {"error_type": "local_rejection", "message": "request or budget rejected locally; not sent upstream"},
                                   "elapsed_seconds": 0, "budget": self.server.ledger.snapshot()}, 422)
        result = self.upstream("POST", "/v1/systemone", raw)
        self.server.ledger.settle(entry, result["status"], result["body"])
        result["budget"] = self.server.ledger.snapshot()
        self.send_json(result)

    def upstream(self, method, path, raw):
        started = time.monotonic()
        conn = http.client.HTTPSConnection(HOST, 443, timeout=120, context=ssl.create_default_context())
        try:
            conn.request(method, path, body=raw, headers={
                "Authorization": "Bearer " + self.server.secret,
                "Content-Type": "application/json", "User-Agent": "Queens-public-benchmark/1",
            })
            response = conn.getresponse()
            data = response.read(MAX_RESPONSE + 1)
            if len(data) > MAX_RESPONSE:
                raise ValueError("Response too large")
            # Defensive redaction even if upstream unexpectedly echoes authentication.
            data = data.replace(self.server.secret.encode(), b"[REDACTED]")
            body = redact(json.loads(data), self.server.secret)
            status = response.status  # http.client never follows redirects.
            body = public_response(body, json.loads(raw) if raw else None, models=method == "GET" and status == 200)
        except Exception as exc:
            status, body = 599, {"error_type": type(exc).__name__, "message": "transport or response decode failure; charge unresolved"}
        finally:
            conn.close()
        return {"status": status, "body": body, "elapsed_seconds": time.monotonic() - started,
                "receipt_policy": "documented public labels and bounded numeric fields only; arbitrary provider strings withheld"}


def main():
    secret = sys.stdin.readline().rstrip("\r\n")
    if len(secret) != 40 or not secret.isascii() or any(c.isspace() for c in secret):
        raise SystemExit("Credential format check failed; no value logged")
    if os.path.exists(SOCKET):
        os.unlink(SOCKET)
    server = socketserver.UnixStreamServer(SOCKET, Handler)
    os.chmod(SOCKET, 0o666)
    server.secret, server.ledger = secret, Ledger()
    server.models_called, server.models_result = False, None
    print(json.dumps({"ready": True, "fixed_host": HOST, "cap_usd": CAP_USD}), flush=True)
    server.serve_forever()


if __name__ == "__main__":
    main()
