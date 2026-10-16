"""Publish the reviewed Jev 1.13 new-board panel (and its pilot) into public evidence.

Unlike publish.py, this appends only the panel studies to the existing public
manifest; it never removes or rebuilds the earlier SubQ records. It copies the
same receipt files publish.py does and never copies logs, keys or private
solutions. Offline; standard library only.

    python3 scripts/jev/publish_panel.py --source <worktree with output/jev-panel>
"""
import argparse
import collections
import json
from pathlib import Path
import shutil

ROOT = Path(__file__).resolve().parents[2]
PUBLIC = ROOT / "public/evidence"
RECEIPT_FILES = ("request.json", "response.json", "metadata.json", "grade.json", "started.json", "broker-receipt.json")
STUDIES = {"jev-panel": "2026-10-16-jev-new-board-panel", "jev-panel-pilot": "2026-10-16-jev-new-board-panel-pilot"}


def read(path):
    return json.loads(Path(path).read_text())


def save(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n")


def compact(trajectory):
    keep = ("trajectory_id", "board_id", "size", "mode", "replicate", "success", "stop_reason", "correct_queens_before_failure",
            "accepted_queens", "placement_prefix", "http_calls", "forced_decisions", "api_elapsed_seconds", "started_utc", "ended_utc", "steps")
    return {key: trajectory[key] for key in keep if key in trajectory}


def publish_output(output, study, manifest, campaign_budget):
    summary = read(output / "summary.json")
    summary["campaign_budget"] = campaign_budget
    folder = "jev-panel" if study.endswith("panel") else "jev-panel/pilot"
    save(PUBLIC / folder / "summary.json", summary)
    for extra in ("models.json", "isolation.json", "budget-guard.json", "manifest.json"):
        if (output / extra).exists():
            save(PUBLIC / folder / extra, read(output / extra))
    trajectories = []
    for path in sorted((output / "trajectories").glob("*.json")):
        trajectory = read(path)
        trajectories.append(compact(trajectory))
        save(PUBLIC / folder / "trajectories" / path.name, trajectory)
    save(PUBLIC / folder / "trajectories-summary.json", {"study": study, "status": "complete", "model_calls": summary.get("model_calls"),
                                                         "attempted_trajectories": len(trajectories), "trajectories": trajectories})
    added = 0
    for meta_path in sorted((output / "runs").glob("*/metadata.json")):
        meta = read(meta_path)
        grade = read(meta_path.parent / "grade.json")
        run = meta_path.parent.name
        dest = PUBLIC / "runs" / study / run
        dest.mkdir(parents=True, exist_ok=True)
        for filename in RECEIPT_FILES:
            if (meta_path.parent / filename).exists():
                shutil.copyfile(meta_path.parent / filename, dest / filename)
        status = meta.get("http_status")
        outcome = grade.get("outcome", "ungraded")
        outcome = "model_failure" if outcome == "schema_failure" else outcome
        prefix = f"runs/{study}/{run}"
        manifest["records"].append({
            "id": f"{study}:{run}", "study": study, "board": meta.get("board", meta.get("board_id")), "size": meta.get("size"),
            "model": "typesafe/jev-1.13", "modelVersion": meta.get("returned_model"), "provider": "TypeSafe via OpenRouter", "run": run,
            "status": "success" if status == 200 else "error" if status is not None else "not_run",
            "kind": "adaptive trajectory decision (new-board panel, Jev)", "hasResponse": status == 200, "hasMetadata": True, "hasGrade": True,
            "partialResponse": False, "assessmentOutcome": outcome,
            "files": {k: f"{prefix}/{k}.json" for k in ("request", "response", "metadata", "grade")},
            "source": {"family": meta.get("family"), "trajectory": meta.get("trajectory_id")},
            "failure": None if status == 200 else {"http_status": status, "scope": "provider or transport; not a Queens correctness grade"}})
        added += 1
    return added, len(trajectories)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--source", type=Path, required=True, help="worktree root containing output/jev-panel")
    args = parser.parse_args()
    manifest = read(PUBLIC / "manifest.json")
    ledger = {"summary": None}  # Jev spend is per-call usage.cost; no shared SubQ ledger
    panel_studies = set(STUDIES.values())
    manifest["records"] = [r for r in manifest["records"] if r["study"] not in panel_studies]
    manifest["studies"] = [s for s in manifest["studies"] if s not in panel_studies]
    report = {}
    for name, study in STUDIES.items():
        output = args.source / "output" / name
        if (output / "summary.json").exists():
            report[study] = publish_output(output, study, manifest, ledger.get("summary"))
            manifest["studies"].append(study)
    analysis = args.source / "output/jev-panel-analysis/panel.json"
    if analysis.exists():
        full = read(analysis)
        save(PUBLIC / "jev-panel/analysis-labels.json", {"study": full["study"], "labels": full.pop("labels")})
        save(PUBLIC / "jev-panel/analysis.json", full)
    indexes = {key: collections.defaultdict(list) for key in manifest["index"]}
    for record in manifest["records"]:
        for key, values in indexes.items():
            value = record.get(key)
            if value is not None:
                values[str(value).lower() if isinstance(value, bool) else str(value)].append(record["id"])
    for key, old in manifest["index"].items():
        for value, ids in old.items():
            indexes[key][value].extend(i for i in ids if i.startswith("grade:") and i not in indexes[key][value])
    manifest["index"] = indexes
    records = manifest["records"]
    manifest["counts"].update(studies=len(manifest["studies"]), requests=len(records),
                              responses=sum(r.get("hasResponse", False) for r in records),
                              metadata=sum(r.get("hasMetadata", False) for r in records),
                              grades=sum(r.get("hasGrade", False) for r in records),
                              excluded=sum(r.get("excluded", False) for r in records),
                              assessmentOutcomes=dict(collections.Counter(r["assessmentOutcome"] for r in records)),
                              statuses=dict(collections.Counter(r["status"] for r in records)))
    save(PUBLIC / "manifest.json", manifest)
    print(json.dumps({"published": report, "public_records": len(records), "studies": len(manifest["studies"])}))


if __name__ == "__main__":
    main()
