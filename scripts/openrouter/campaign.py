"""Shared OpenRouter campaign ledger for the 17 October follow-ups.

Both the earlier-generation panel (scripts/llm_panel/legacy_panel.py) and the
frontier one-queen-at-a-time trajectories (scripts/llm_trajectories/sequential.py)
spend from one campaign. Spend is read from the key's usage counter against a
baseline recorded once, before any request of the campaign. Only the numeric
fields `usage`, `limit` and `limit_remaining` are ever read from /api/v1/key;
no other field of that response is stored, printed or logged.

Requests go through the local broker socket, which holds the key in its own
memory. Nothing here reads, stores or prints a credential.

    python3 scripts/openrouter/campaign.py baseline   # once, before any request
    python3 scripts/openrouter/campaign.py status
"""
import argparse
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
LEGACY_SUBCAP_USD = 10.50


def utc():
    return datetime.now(timezone.utc).isoformat()


def read(path):
    return json.loads(pathlib.Path(path).read_text())


def save(path, obj):
    path = pathlib.Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(obj, indent=2, ensure_ascii=False) + "\n")


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


def spent():
    """New spend since the campaign baseline, from the key's usage counter."""
    return key_numbers()["usage"] - baseline()["usage_usd"]


def reserves():
    """Unsettled reserves registered by either study (batch submissions, in-flight calls)."""
    total = 0.0
    for path in sorted((OUT / "reserves").glob("*.json")) if (OUT / "reserves").exists() else []:
        item = read(path)
        if not item.get("settled"):
            total += item["reserve_usd"]
    return total


def register_reserve(name, reserve_usd, detail):
    save(OUT / "reserves" / f"{name}.json", {"name": name, "reserve_usd": reserve_usd, "detail": detail,
                                             "registered_utc": utc(), "settled": False})


def settle_reserve(name):
    path = OUT / "reserves" / f"{name}.json"
    if path.exists():
        item = read(path)
        item.update(settled=True, settled_utc=utc())
        save(path, item)


def guard(next_worst_case_usd, cap_usd=CAMPAIGN_CAP_USD):
    """Spend so far + unsettled reserves + the next worst case must stay within the cap."""
    so_far = spent()
    held = reserves()
    ok = so_far + held + next_worst_case_usd <= cap_usd
    return ok, {"spent_usd": round(so_far, 6), "reserves_usd": round(held, 6),
                "next_worst_case_usd": round(next_worst_case_usd, 6), "cap_usd": cap_usd}


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
        print(json.dumps({"spent_usd": round(numbers["usage"] - baseline()["usage_usd"], 6),
                          "reserves_usd": round(reserves(), 6), "limit_remaining_usd": numbers["limit_remaining"],
                          "cap_usd": CAMPAIGN_CAP_USD}))


if __name__ == "__main__":
    main()
