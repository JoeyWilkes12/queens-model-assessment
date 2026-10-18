"""OpenRouter cost per receipt, board, model and evaluation, from published evidence only.

Only spend billed through OpenRouter is counted. Each receipt's cost has one basis:

  reported   usage.cost returned by OpenRouter (metadata or response);
  derived    a batch item, which reports tokens but no per-item cost: tokens x the
             model's batch price, cached input at a tenth of the input price. This
             reproduces the billed batch total exactly ($0.54661 for GPT-5.6 Sol, 16 Oct);
  unbilled   an HTTP error before any generation (OpenRouter bills nothing);
  unknown    a client timeout with no generation ID; never guessed, never counted as $0;
  not_run    a scheduled or blocked request that was never answered.

SubQ Snap uses its own preview API, not OpenRouter, so its receipts are excluded.
Agent-led OpenRouter use outside these studies (for example coding agents) is not
in the evidence bundle and is not counted.
"""
import collections
import json
import pathlib

E = pathlib.Path(__file__).resolve().parents[2] / "public/evidence"
CACHED_FACTOR = 0.1
BATCH_PRICES = {("2026-10-16-frontier-image-panel", "openai/gpt-5.6-sol"): (2e-6, 1e-5)}
NOT_OPENROUTER = {"SubQ"}


def _read(rel):
    path = E / rel
    return json.loads(path.read_text()) if path.exists() else None


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
    if record.get("status") == "timeout_or_transport_failure":
        return None, "unknown"
    if record.get("status") == "error":
        return 0.0, "unbilled"
    return None, "unknown"


def model_key(model):
    """One key per model: a dated Jev 1.13 build ID (typesafe/jev-1.13-20260917) is the same model as typesafe/jev-1.13."""
    return "typesafe/jev-1.13" if model.startswith("typesafe/jev-1.13") else model


def cost_index():
    """(study, board, model) -> {"usd": known total, "receipts": n, "basis": Counter}."""
    index = collections.defaultdict(lambda: {"usd": 0.0, "receipts": 0, "basis": collections.Counter()})
    for record in json.loads((E / "manifest.json").read_text())["records"]:
        usd, basis = receipt_cost(record)
        if basis in ("not_openrouter", "not_run"):
            continue
        cell = index[(record["study"], record["board"], model_key(record["model"]))]
        cell["receipts"] += 1
        cell["basis"][basis] += 1
        if usd is not None:
            cell["usd"] += usd
    return index


def board_costs(index, study, model):
    """board -> usd (None if any receipt's cost is unknown)."""
    out = {}
    for (s, board, m), cell in index.items():
        if s == study and m == model:
            out[board] = None if cell["basis"]["unknown"] else round(cell["usd"], 6)
    return out


def evaluations(index, solved_lookup):
    """One row per evaluation (study) and model. solved_lookup(study, model) -> (solved, boards) or None."""
    grouped = collections.defaultdict(lambda: {"usd": 0.0, "receipts": 0, "boards": set(), "basis": collections.Counter()})
    for (study, board, model), cell in index.items():
        row = grouped[(study, model)]
        row["usd"] += cell["usd"]
        row["receipts"] += cell["receipts"]
        if board:  # some receipts (e.g. batch probes) belong to a study but to no single board
            row["boards"].add(board)
        row["basis"].update(cell["basis"])
    rows = []
    for (study, model), row in sorted(grouped.items()):
        boards = len(row["boards"])
        solved = solved_lookup(study, model)
        rows.append({"study": study, "model": model, "boards": boards, "receipts": row["receipts"],
                     "cost_usd": round(row["usd"], 6), "cost_per_board_usd": round(row["usd"] / boards, 6) if boards else None,
                     "boards_solved": solved[0] if solved else None, "boards_graded": solved[1] if solved else None,
                     "cost_per_solved_board_usd": round(row["usd"] / solved[0], 6) if solved and solved[0] else None,
                     "basis": dict(row["basis"])})
    return rows
