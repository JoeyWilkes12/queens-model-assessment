"""Fill the result sections of docs/followups-2026-10-17-report.md from published evidence. Offline.

Each generated block sits between <!-- auto:NAME --> and <!-- /auto:NAME --> markers, so the
script can be rerun after more receipts are published; nothing else in the report changes.

    python3 scripts/analysis/followups_2026_10_17.py
"""
import collections
import json
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parents[2]
E = ROOT / "public/evidence"
REPORT = ROOT / "docs/followups-2026-10-17-report.md"
OK = ("strict", "format_only")
NAMES = {"openai/gpt-5.5": "GPT-5.5", "openai/gpt-5.4": "GPT-5.4", "openai/gpt-5": "GPT-5", "openai/gpt-4.1": "GPT-4.1",
         "anthropic/claude-opus-4.7": "Claude Opus 4.7", "anthropic/claude-opus-4.6": "Claude Opus 4.6",
         "google/gemini-2.5-pro": "Gemini 2.5 Pro", "google/gemini-2.5-flash": "Gemini 2.5 Flash",
         "gpt-5.6-sol": "GPT-5.6 Sol", "claude-opus-4.8": "Claude Opus 4.8", "gemini-3.1-pro-preview": "Gemini 3.1 Pro Preview", "grok-4.6": "Grok 4.6"}


def load(path):
    p = E / path
    return json.loads(p.read_text()) if p.exists() else None


def legacy_rows():
    legacy, october = load("legacy-panel/summary.json"), load("earlier-generations-summary.json")
    oct_written = {m["model"]: f"{m['written_correct']}/{m['attempted']}" for m in october["models"] if m["condition"] == "original_image"}
    by = collections.defaultdict(list)
    for row in legacy["rows"]:
        by[row["model"]].append(row)
    out = []
    for model, rows in by.items():
        rec = [r for r in rows if r["state"] == "recorded"]
        misses = collections.Counter(r["outcome"] for r in rec if r["outcome"] not in OK)
        route = rows[0]["route"]
        out.append({"model": model, "recorded": len(rec), "pending": len(rows) - len(rec), "route": route,
                    "correct": sum(r["outcome"] in OK for r in rec), "strict": sum(r["outcome"] == "strict" for r in rec),
                    "by_size": [f"{sum(r['outcome'] in OK for r in rec if r['size'] == s)}/{sum(r['size'] == s for r in rec)}" for s in (5, 7, 9)],
                    "misses": ", ".join(f"{n} {k.replace('_', ' ')}" for k, n in misses.items()) or "none",
                    "october": oct_written.get(model, "—"), "cost": sum(r.get("cost_usd") or 0 for r in rec)})
    return sorted(out, key=lambda r: (-r["correct"] / max(1, r["recorded"]), r["model"])), legacy


def pattern(rows):
    answered = [r for r in rows if r["model"] != "openai/gpt-4.1" and not r["model"].startswith("google/") and r["recorded"]]
    gemini = [r for r in rows if r["model"].startswith("google/") and r["recorded"]]
    correct, recorded = sum(r["correct"] for r in answered), sum(r["recorded"] for r in answered)
    strict = sum(r["strict"] for r in answered)
    misses = "; ".join(f"{NAMES.get(r['model'], r['model'])}: {r['misses']}" for r in answered if r["misses"] != "none") or "none"
    gpt41 = next((r for r in rows if r["model"] == "openai/gpt-4.1"), None)
    return (f"- **Pattern.** The earlier reasoning models were correct on {correct} of the {recorded} boards they answered ({strict} in strict JSON). "
            f"Their wrong or missing answers: {misses}. Claude Opus 4.6's answers were all correct but wrote text around the JSON."
            + (f" GPT-4.1, which has no reasoning mode, solved {gpt41['correct']} of {gpt41['recorded']}." if gpt41 else "")
            + (" Through the Batch API, " + " and ".join(f"{NAMES[r['model']]} solved {r['correct']} of {r['recorded']} ({r['strict']} in strict JSON)" for r in sorted(gemini, key=lambda r: r["model"], reverse=True)) + "." if gemini else ""))


def block_legacy():
    rows, legacy = legacy_rows()
    lines = ["| Model | 5×5 | 7×7 | 9×9 | Correct / recorded | Strict JSON | Misses | Not yet run | 1 Oct, 3 boards | Route | Cost |",
             "|---|---:|---:|---:|---:|---:|---|---:|---:|---|---:|"]
    for r in rows:
        lines.append(f"| {NAMES.get(r['model'], r['model'])} | {' | '.join(r['by_size'])} | **{r['correct']}/{r['recorded']}** | {r['strict']}/{r['recorded']} | {r['misses']} | {r['pending']} | {r['october']} | "
                     f"{'Batch (Vertex)' if r['route'] == 'batch' else 'On demand'} | ${r['cost']:.2f} |")
    pending = sum(r["pending"] for r in rows)
    lines += ["", "- **Correct** counts strict JSON plus correct-but-off-format answers; the strict column is the preregistered primary score.",
              "- **1 Oct, 3 boards** is the written-correct count on the three original boards.",
              (f"- **Not yet run ({pending} calls)** are requests not yet sent or blocked by a budget limit before reaching any model"
               + (", or Gemini batch items still queued on Vertex" if any(r["pending"] for r in rows if r["route"] == "batch") else "")
               + ". None of them is counted as a model outcome."
               if pending else "- **Complete.** Every scheduled call has a recorded answer. Calls once blocked by a budget limit were sent unchanged later; no block is counted as a model outcome."),
              "- **Gone.** Claude Sonnet 4, tested on 1 October, has no OpenRouter endpoint any more.",
              pattern(rows),
              "- **Comparison.** The current frontier models solved 34–36 of the same 36 boards on 16 October. These comparisons are descriptive."]
    return "\n".join(lines)


def block_trajectories():
    projection = load("frontier-trajectories/projection.json")
    lines = []
    for phase in ("pilot", "main"):
        data = load(f"frontier-trajectories/{phase}.json")
        if not data:
            continue
        lines += [f"**{'Pilot: development board dev-5-01 (5×5)' if phase == 'pilot' else 'Panel boards'}**", "",
                  "| Model | Boards | Solved | First off-solution request | Revisions | Stops | Requests | Cost |", "|---|---:|---:|---|---:|---:|---:|---:|"]
        for short in ("gpt-5.6-sol", "claude-opus-4.8", "gemini-3.1-pro-preview", "grok-4.6"):
            mine = [t for t in data["trajectories"] if t["short"] == short]
            if not mine:
                continue
            firsts = [t["first_off_solution_turn"] for t in mine if t["first_off_solution_turn"]]
            lines.append(f"| {NAMES[short]} | {len(mine)} | {sum(t['solved'] for t in mine)} | {', '.join(map(str, firsts)) or 'never'} | "
                         f"{sum(t['effects'].get('revised', 0) for t in mine)} | {sum(t['end_reason'] == 'stopped' for t in mine)} | {sum(t['requests'] for t in mine)} | ${sum(t['cost_usd'] for t in mine):.2f} |")
        lines.append("")
    lines += ["- **What the replies show.** GPT-5.6 Sol and Claude Opus 4.8 stated the full solution in their first reply, then placed it one queen per request. Grok 4.6's first reply named three of the five queens and said the rest were forced. Gemini 3.1 Pro Preview derived one queen per reply from the rows, columns, regions and touching rule.",
              "- **Self-checking.** Claude Opus 4.8 also checked its earlier queens at each step (\"Both placed queens are correct\"), from its own reasoning. The harness gave no feedback.",
              "- **Cost.** For every model the first request cost the most, and later requests cost less."]
    if projection:
        lines += [f"- **Block count.** The preregistered cost-only rule set the number of panel blocks to **{projection['blocks']}**. With the earlier-generation panel's unspent budget held back, ${projection['room_usd']:.2f} of the campaign cap remained, against a projected ${projection['projected_block_usd']:.2f} per block (one 5×5, 7×7 and 9×9 board per model).",
                  "  - Panel trajectories can follow under the same frozen protocol when there is budget."]
    else:
        lines += ["- **Block count.** K is fixed after the pilot by the preregistered cost-only rule, with the earlier-generation panel's unspent budget held back. At current spend it allows no panel block within the $18.75 campaign cap."]
    return "\n".join(lines)


def block_summary():
    rows, _ = legacy_rows()
    reasoning = [r for r in rows if r["model"] != "openai/gpt-4.1" and not r["model"].startswith("google/")]
    pilot = load("frontier-trajectories/pilot.json")
    solved = sum(t["solved"] for t in pilot["trajectories"]) if pilot else 0
    pending = sum(r["pending"] for r in reasoning)
    gemini = [r for r in rows if r["model"].startswith("google/")]
    gemini_text = ("; ".join(f"{NAMES[r['model']]} {r['correct']}/{r['recorded']}" for r in sorted(gemini, key=lambda r: r["model"], reverse=True))
                   if gemini and all(r["recorded"] for r in gemini) else "Batch queued on Google Vertex")
    return "\n".join([
        "| Test | Boards | Result |", "|---|---|---|",
        f"| Earlier-generation reasoning models (GPT-5.5, 5.4, 5; Claude Opus 4.7, 4.6), one shot from an image | 36 panel boards each | {sum(r['correct'] for r in reasoning)} correct of {sum(r['recorded'] for r in reasoning)} answered"
        + (f"; {pending} calls not yet run (budget limits) |" if pending else " |"),
        f"| GPT-4.1 (no reasoning), same | 36 | {next((r['correct'] for r in rows if r['model'] == 'openai/gpt-4.1'), 0)}/36 |",
        f"| Gemini 2.5 Pro and Flash, same, through the Batch API | 36 each | {gemini_text} |",
        f"| Frontier models, one queen per request, text state, no feedback | 1 development board each | {solved} of {len(pilot['trajectories']) if pilot else 0} solved, each in 5 requests |",
        "| Greedy rule, step records | 201 boards | Reproduces 80/192 and 4/9; every step published and independently verified |"])


def block_cost():
    ledger = ROOT / "output/campaign-2026-10-17"
    costs = [json.loads(p.read_text()) for p in sorted((ledger / "costs").glob("*.json"))] if (ledger / "costs").exists() else []
    legacy = sum(c["usd"] for c in costs if c["name"].startswith("legacy-"))
    traj = sum(c["usd"] for c in costs if c["name"].startswith("traj-"))
    gemini = [c for c in costs if c["name"].startswith("legacy-batch-gemini")]
    return "\n".join([
        f"- **Recorded so far:** ${legacy:.2f} for earlier-generation calls and ${traj:.2f} for the trajectory pilot.",
        (f"- **Gemini.** The two Gemini batches settled on 19 October for ${sum(c['usd'] for c in gemini):.2f}, below the $2.78 OpenRouter held while they were queued."
         if len(gemini) == 2 else "- **Gemini.** The two Gemini batches are billed when they settle. OpenRouter holds $2.78 for them meanwhile."),
        "- **Ceilings.** The campaign cap ($18.75) and the user's credit balance bound all spend.",
        "- **Account limits.** The organization's monthly limit (raised during the run) and the API key's weekly $20 limit stopped the runners. Both returned HTTP 403 before any model call."])


def main():
    text = REPORT.read_text()
    blocks = {"summary": block_summary(), "legacy": block_legacy(), "trajectories": block_trajectories(), "cost": block_cost()}
    for name, body in blocks.items():
        pattern = re.compile(rf"<!-- auto:{name} -->.*?<!-- /auto:{name} -->", re.S)
        replacement = f"<!-- auto:{name} -->\n{body}\n<!-- /auto:{name} -->"
        if not pattern.search(text):
            raise SystemExit(f"marker auto:{name} missing from the report")
        text = pattern.sub(lambda _: replacement, text)
    REPORT.write_text(text)
    print(json.dumps({"updated": list(blocks)}))


if __name__ == "__main__":
    main()
