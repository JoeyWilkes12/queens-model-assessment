"""Shared OpenRouter campaign ledger for the 17 October follow-ups.

Both the earlier-generation panel (scripts/llm_panel/legacy_panel.py) and the
frontier one-queen-at-a-time trajectories (scripts/llm_trajectories/sequential.py)
spend from one campaign. Spend so far is the larger of two numbers:

  * the key's usage counter minus a baseline recorded once, before any request;
  * the costs recorded locally for every settled call or batch.

The key counter lags by minutes, and batch items carry no per-item cost, so the
local record covers spend the counter has not shown yet. A call whose cost is
unknown (for example a client timeout) is recorded at its worst case.

Before a call or batch is sent, its worst case (or reserve) is registered under a
file lock, so parallel processes see each other's commitments. When it settles,
the reserve is replaced by the cost. Only the numeric fields `usage`, `limit` and
`limit_remaining` are read from /api/v1/key; no other field of that response is
stored, printed or logged.

Requests go through the local broker socket, which holds the key in its own
memory. Nothing here reads, stores or prints a credential.

    python3 scripts/openrouter/campaign.py baseline   # once, before any request
    python3 scripts/openrouter/campaign.py status
"""
import argparse
import contextlib
import fcntl
import http.client
import json
import pathlib
import socket
from datetime import datetime, timezone

ROOT = pathlib.Path(__file__).resolve().parents[2]
OUT = ROOT / "output/campaign-2026-10-17"
SOCKET = str(pathlib.Path.home() / "Library/Application Support/OpenRouterBroker/openrouter.sock")
CAMPAIGN = "2026-10-17-openrouter-follow-ups"
# The user added $18 on 16 October; about $1.85 of the earlier $11.11 remained.
# The cap keeps a margin for the usage counter's reporting lag (observed $0.5-1).
CAMPAIGN_CAP_USD = 18.75
# Amendment (17 Oct, before any on-demand call): every OpenAI and Anthropic batch was rejected, so six
# models run on demand at twice the batch price; the sub-cap rose from $10.50 so all 36 boards fit.
# Amendment 5 (17 Oct): raised again so the panel completes inside the unchanged campaign cap; no trajectory
# panel block fit the remaining cap either way (about $1.5 left against a projected $5.1 per block).
LEGACY_SUBCAP_USD = 17.25
LEGACY_MANIFEST = ROOT / "output/legacy-panel/manifest.json"


def utc():
    return datetime.now(timezone.utc).isoformat()


def read(path):
    return json.loads(pathlib.Path(path).read_text())


def save(path, obj):
    path = pathlib.Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_name(path.name + ".tmp")
    tmp.write_text(json.dumps(obj, indent=2, ensure_ascii=False) + "\n")
    tmp.replace(path)


class _Broker(http.client.HTTPConnection):
    def __init__(self, timeout):
        super().__init__("localhost", timeout=timeout)

    def connect(self):
        self.sock = socket.socket(socket.AF_UNIX, socket.SOCK_STREAM)
        self.sock.settimeout(self.timeout)
        self.sock.connect(SOCKET)


def broker(method, path, body=None, timeout=60):
    """One request through the broker; returns (status, parsed JSON body)."""
    connection = _Broker(timeout)
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


def governance_block(status, body):
    """True for an OpenRouter account block before any model call: a budget guardrail (HTTP 403
    'Budget limit exceeded', organization or key) or too few credits (HTTP 402). Runs stop at once
    and never record it as a model outcome."""
    error = body.get("error") if isinstance(body, dict) else None
    message = error.get("message", "") if isinstance(error, dict) else ""
    return status == 402 or (status == 403 and "budget limit" in message.lower())


def key_numbers():
    """Only the numeric spend fields of /api/v1/key; everything else is discarded unread."""
    status, body = broker("GET", "/api/v1/key")
    data = (body.get("data") or {}) if status == 200 and isinstance(body, dict) else {}
    numbers = {k: data.get(k) for k in ("usage", "limit", "limit_remaining")}
    if not isinstance(numbers["usage"], (int, float)):
        raise SystemExit(f"Could not read key usage (HTTP {status}); refusing to spend")
    return numbers


def baseline():
    path = OUT / "baseline.json"
    if path.exists():
        return read(path)
    raise SystemExit("No campaign baseline; run `campaign.py baseline` before any request")


@contextlib.contextmanager
def lock():
    OUT.mkdir(parents=True, exist_ok=True)
    with open(OUT / "ledger.lock", "w") as handle:
        fcntl.flock(handle, fcntl.LOCK_EX)
        try:
            yield
        finally:
            fcntl.flock(handle, fcntl.LOCK_UN)


def _items(kind, prefix=""):
    directory = OUT / kind
    return [read(p) for p in sorted(directory.glob(f"{prefix}*.json"))] if directory.exists() else []


def recorded_costs(prefix=""):
    return sum(item["usd"] for item in _items("costs", prefix))


def reserves(prefix="", include_key_held=False):
    """Unsettled reserves (in-flight calls, submitted batches). OpenRouter holds a submitted batch's
    worst case in the key's usage counter until it settles (observed 17 Oct: +$2.78 at submit), so for
    the campaign guard those reserves are already counted by spent() and are skipped here."""
    return sum(item["reserve_usd"] for item in _items("reserves", prefix)
               if not item.get("settled") and (include_key_held or not item.get("key_held")))


def spent():
    """New spend: the larger of the key counter delta and the locally recorded costs."""
    return max(key_numbers()["usage"] - baseline()["usage_usd"], recorded_costs())


def legacy_complete():
    if not LEGACY_MANIFEST.exists():
        return False
    schedule = read(LEGACY_MANIFEST)["schedule"]
    return all((LEGACY_MANIFEST.parent / "raw" / c["call_id"] / "metadata.json").exists() for c in schedule)


def legacy_committed():
    return recorded_costs("legacy-") + reserves("legacy-", include_key_held=True)


def legacy_outstanding():
    """Budget held back for the earlier-generation panel until all of its calls are recorded."""
    return 0.0 if legacy_complete() else max(0.0, LEGACY_SUBCAP_USD - legacy_committed())


def state(next_usd=0.0, cap_usd=CAMPAIGN_CAP_USD):
    so_far, held = spent(), reserves()
    return {"spent_usd": round(so_far, 6), "reserves_usd": round(held, 6), "next_usd": round(next_usd, 6),
            "cap_usd": cap_usd, "ok": so_far + held + next_usd <= cap_usd}


def reserve(name, amount_usd, detail, legacy=False, hold_for_legacy=False):
    """Atomically check the cap(s) and register a reserve. Returns (ok, state)."""
    with lock():
        current = state(amount_usd)
        if legacy:
            current["legacy_committed_usd"] = round(legacy_committed(), 6)
            current["legacy_subcap_usd"] = LEGACY_SUBCAP_USD
            current["ok"] = current["ok"] and legacy_committed() + amount_usd <= LEGACY_SUBCAP_USD
        if hold_for_legacy:
            held = legacy_outstanding()
            current["legacy_outstanding_usd"] = round(held, 6)
            current["ok"] = current["ok"] and current["spent_usd"] + current["reserves_usd"] + held + amount_usd <= CAMPAIGN_CAP_USD
        if current["ok"]:
            save(OUT / "reserves" / f"{name}.json", {"name": name, "reserve_usd": amount_usd, "detail": detail,
                                                     "registered_utc": utc(), "settled": False})
        return current["ok"], current


def settle(name, cost_usd, source):
    """Replace a reserve by its cost. cost_usd None means unknown: the reserve itself is recorded as spent."""
    with lock():
        path = OUT / "reserves" / f"{name}.json"
        item = read(path) if path.exists() else {"name": name, "reserve_usd": 0.0}
        usd = item["reserve_usd"] if cost_usd is None else float(cost_usd)
        save(OUT / "costs" / f"{name}.json", {"name": name, "usd": usd, "source": source if cost_usd is not None else f"{source}; cost unknown, worst case recorded",
                                              "recorded_utc": utc()})
        if path.exists():
            item.update(settled=True, settled_utc=utc())
            save(path, item)


def mark_key_held(name, batch_id):
    """A submitted batch: the key counter now carries OpenRouter's own hold for it."""
    with lock():
        path = OUT / "reserves" / f"{name}.json"
        item = read(path)
        item.update(key_held=True, batch_id=batch_id)
        save(path, item)


def release(name, why):
    """Drop a reserve for a request that was certainly never accepted (an explicit 4xx rejection)."""
    with lock():
        path = OUT / "reserves" / f"{name}.json"
        if path.exists():
            item = read(path)
            item.update(settled=True, settled_utc=utc(), released=why)
            save(path, item)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("mode", choices=["baseline", "status"])
    args = parser.parse_args()
    if args.mode == "baseline":
        path = OUT / "baseline.json"
        if path.exists():
            raise SystemExit("Baseline already recorded")
        numbers = key_numbers()
        save(path, {"campaign": CAMPAIGN, "recorded_utc": utc(), "usage_usd": numbers["usage"],
                    "limit_usd": numbers["limit"], "limit_remaining_usd": numbers["limit_remaining"],
                    "campaign_cap_usd": CAMPAIGN_CAP_USD, "legacy_subcap_usd": LEGACY_SUBCAP_USD})
        print(json.dumps({"baseline_recorded": True, "limit_remaining_usd": numbers["limit_remaining"]}))
    else:
        numbers = key_numbers()
        print(json.dumps({"key_delta_usd": round(numbers["usage"] - baseline()["usage_usd"], 6),
                          "recorded_costs_usd": round(recorded_costs(), 6), "reserves_usd": round(reserves(), 6),
                          "key_held_batch_reserves_usd": round(reserves(include_key_held=True) - reserves(), 6),
                          "legacy_committed_usd": round(legacy_committed(), 6), "legacy_complete": legacy_complete(),
                          "limit_remaining_usd": numbers["limit_remaining"], "cap_usd": CAMPAIGN_CAP_USD}))


if __name__ == "__main__":
    main()
