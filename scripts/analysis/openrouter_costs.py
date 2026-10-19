"""OpenRouter cost per receipt, board, model and evaluation, from published evidence only.

Only spend billed through OpenRouter is counted. Each receipt's cost has one basis:

  reported   usage.cost returned by OpenRouter (metadata or response);
  derived    a batch item, which reports tokens but no per-item cost: tokens x the
             model's batch price, cached input at a tenth of the input price. This
             reproduces the billed batch total exactly ($0.54661 for GPT-5.6 Sol, 16 Oct);
  unbilled   an HTTP 4xx rejection before any generation (routing, validation, 429);
  unknown    no generation ID or usage: a client timeout or an upstream 5xx. Never
             guessed and never counted as $0;
  not_run    a scheduled or blocked request that was never answered (excluded).

A receipt is *scored* when it is the attempt the chart grades for its board. Re-runs,
version probes and order controls, text-only diagnostics and requests tied to no board
count toward an evaluation's total spend but not toward its per-board cost, so the
per-board figure is the cost of the graded attempts only. The chart and the ledger use
the same per-board definition: the scored cost of the boards whose cost is known,
divided by their number.

SubQ Snap uses its own preview API, not OpenRouter, so its receipts are excluded.
Agent-led OpenRouter use outside these studies is not in the evidence and is not counted.
"""
import collections
import functools
import json
import pathlib

E = pathlib.Path(__file__).resolve().parents[2] / "public/evidence"
CACHED_FACTOR = 0.1
BATCH_PRICES = {("2026-10-16-frontier-image-panel", "openai/gpt-5.6-sol"): (2e-6, 1e-5)}
NOT_OPENROUTER = {"SubQ"}
# Jev's 30 September study scores only the trajectory calls; probes and order controls test the route.
SCORED_RUN_PREFIX = {"2026-09-30-jev-trajectories": "sequence-"}


def _read(rel):
    path = E / rel
    return json.loads(path.read_text()) if path.exists() else None


def model_key(model):
    """One key per model: a dated Jev 1.13 build ID (typesafe/jev-1.13-20260917) is the same model as typesafe/jev-1.13."""
    return "typesafe/jev-1.13" if model.startswith("typesafe/jev-1.13") else model


def evaluation_key(record):
    """Text-only diagnostics on 1 October are their own evaluation, separate from the image condition."""
    return record["study"] + ":text-diagnostics" if record["run"].startswith("diag_") else record["study"]


def scored(record):
    rerun_inside_panel = "_rerun-" in record["id"] and not record["study"].endswith("-rerun")  # a dedicated re-run study scores its re-run
    if rerun_inside_panel or record["run"].startswith("diag_") or not record.get("board"):
        return False
    prefix = SCORED_RUN_PREFIX.get(record["study"])
    return record["run"].startswith(prefix) if prefix else True


def receipt_cost(record):
    """(usd or None, basis) for one manifest record."""
    if record.get("provider") in NOT_OPENROUTER:
        return None, "not_openrouter"
    if record.get("status") == "not_run" or not record.get("files"):
        return None, "not_run"
    files = record["files"]
    meta = _read(files["metadata"]) if files.get("metadata") else None
    response = _read(files["response"]) if files.get("response") else None
    for source in (meta, response):
        if isinstance(source, dict):
            usage = source.get("usage") if isinstance(source.get("usage"), dict) else {}
            if isinstance(usage.get("cost"), (int, float)):
                return float(usage["cost"]), "reported"
    if isinstance(meta, dict) and isinstance(meta.get("cost_usd"), (int, float)):
        return float(meta["cost_usd"]), "derived" if "batch" in str(meta.get("cost_source", "")) else "reported"
    prices = BATCH_PRICES.get((record["study"], record["model"]))
    usage = response.get("usage") if isinstance(response, dict) and isinstance(response.get("usage"), dict) else {}
    if prices and isinstance(usage.get("prompt_tokens"), int) and isinstance(usage.get("completion_tokens"), int):
        cached = (usage.get("prompt_tokens_details") or {}).get("cached_tokens") or 0
        ip, op = prices
        return round((usage["prompt_tokens"] - cached) * ip + cached * CACHED_FACTOR * ip + usage["completion_tokens"] * op, 9), "derived"
    status = meta.get("http_status") if isinstance(meta, dict) else None
    if record.get("status") == "error" and isinstance(status, int) and 400 <= status < 500:
        return 0.0, "unbilled"
    return None, "unknown"


@functools.lru_cache(maxsize=None)
def _manifest_records():
    return tuple(json.loads((E / "manifest.json").read_text())["records"])


def records():
    return _manifest_records()


def receipt_costs():
    """manifest id -> (usd or None, basis) for every OpenRouter receipt that was answered or failed."""
    out = {}
    for record in records():
        usd, basis = receipt_cost(record)
        if basis not in ("not_openrouter", "not_run"):
            out[record["id"]] = (usd, basis)
    return out


def board_costs(study, model, costs=None):
    """board -> scored cost (None if any scored receipt on that board has an unknown cost)."""
    costs = costs or receipt_costs()
    cells = collections.defaultdict(list)
    for record in records():
        if record["study"] == study and model_key(record["model"]) == model and record["id"] in costs and scored(record):
            cells[record["board"]].append(costs[record["id"]])
    return {board: (None if any(basis == "unknown" for _, basis in items) else round(sum(usd for usd, _ in items), 6))
            for board, items in cells.items()}


def other_spend(studies, model, graded_ids=None, costs=None):
    """Spend on a chart model's requests that are not its graded attempts, from the given studies:
    re-runs, probes and order controls, diagnostics, board-less calls. graded_ids names the graded
    receipts when the chart grades something other than scored() (the original three boards).
    by_size keys a board's size as a string; requests tied to no board are 'unsized'."""
    costs = costs or receipt_costs()
    out = {"by_size": collections.defaultdict(float), "unsized": 0.0, "requests": 0, "unknown": 0}
    for record in records():
        if record["study"] not in studies or model_key(record["model"]) != model or record["id"] not in costs:
            continue
        if (record["id"] in graded_ids) if graded_ids is not None else scored(record):
            continue
        usd, basis = costs[record["id"]]
        out["requests"] += 1
        out["unknown"] += basis == "unknown"
        if record.get("board") and record.get("size"):
            out["by_size"][str(record["size"])] += usd or 0.0
        else:
            out["unsized"] += usd or 0.0
    return {"by_size": {size: round(usd, 6) for size, usd in sorted(out["by_size"].items())}, "unsized": round(out["unsized"], 6),
            "requests": out["requests"], "unknown": out["unknown"], "studies": list(studies)}


def evaluations(solved_lookup, costs=None):
    """One row per evaluation and model. solved_lookup(evaluation, model) -> (solved, graded) or None."""
    costs = costs or receipt_costs()
    rows = collections.defaultdict(lambda: {"total": 0.0, "receipts": 0, "basis": collections.Counter(),
                                            "cells": collections.defaultdict(list), "other": 0.0, "unscored": 0})
    for record in records():
        if record["id"] not in costs:
            continue
        usd, basis = costs[record["id"]]
        row = rows[(evaluation_key(record), model_key(record["model"]))]
        row["receipts"] += 1
        row["basis"][basis] += 1
        row["total"] += usd or 0.0
        if scored(record):
            row["cells"][record["board"]].append((usd, basis))
        else:
            row["unscored"] += 1
            row["other"] += usd or 0.0
    out = []
    for (evaluation, model), row in sorted(rows.items()):
        known = {b: sum(u for u, _ in items) for b, items in row["cells"].items() if all(basis != "unknown" for _, basis in items)}
        unknown_boards = len(row["cells"]) - len(known)
        scored_usd = sum(known.values())
        solved = solved_lookup(evaluation, model)
        out.append({"study": evaluation, "model": model, "boards": len(row["cells"]), "receipts": row["receipts"],
                    "cost_usd": round(row["total"], 6), "scored_cost_usd": round(scored_usd, 6),
                    "cost_per_board_usd": round(scored_usd / len(known), 6) if known else None,
                    "unknown_boards": unknown_boards, "unscored_receipts": row["unscored"], "unscored_usd": round(row["other"], 6),
                    "boards_solved": solved[0] if solved else None, "boards_graded": solved[1] if solved else None,
                    "cost_per_solved_board_usd": round(scored_usd / solved[0], 6) if solved and solved[0] else None,
                    "basis": dict(row["basis"])})
    return out
