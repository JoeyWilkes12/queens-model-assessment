"""Publish only reviewed benchmark artifacts; never copy credential/log trees."""
import collections
import json
from pathlib import Path
import shutil

ROOT = Path(__file__).resolve().parents[2]
PUBLIC = ROOT / "public/evidence"


def read(path):
    return json.loads(path.read_text())


def save(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n")


def main():
    manifest = read(PUBLIC / "manifest.json")
    ledger_path = ROOT / "output/subq-ledger/budget.json"
    campaign_budget = read(ledger_path).get("summary") if ledger_path.exists() else None
    manifest["records"] = [r for r in manifest["records"] if "subq" not in r["study"]]
    manifest["studies"] = [s for s in manifest["studies"] if "subq" not in s]
    for suffix, name in [("", "subq"), ("-trajectories", "subq-trajectories"), ("-split", "subq-split")]:
        output = ROOT / ("output/subq" + suffix)
        if not (output / "summary.json").exists():
            continue
        summary = read(output / "summary.json")
        summary["campaign_budget"] = campaign_budget
        study = summary["study"]
        manifest["studies"].append(study)
        save(PUBLIC / (name + "-summary.json"), summary)
        if (output / "manifest.json").exists():
            save(PUBLIC / (name + "-protocol.json"), read(output / "manifest.json"))
        for extra in ("models.json", "isolation.json"):
            if (output / extra).exists():
                save(PUBLIC / (name + "-" + extra), read(output / extra))
        for meta_path in sorted((output / "runs").glob("*/metadata.json")):
            meta = read(meta_path)
            grade = read(meta_path.parent / "grade.json")
            run = meta_path.parent.name
            dest = PUBLIC / "runs" / study / run
            dest.mkdir(parents=True, exist_ok=True)
            for filename in ("request.json", "response.json", "metadata.json", "grade.json", "source.json", "started.json", "broker-receipt.json"):
                if (meta_path.parent / filename).exists():
                    shutil.copyfile(meta_path.parent / filename, dest / filename)
            outcome = grade["outcome"]
            outcome = "model_failure" if outcome == "schema_failure" else outcome
            status = meta.get("http_status")
            upstream = status is not None
            prefix = f"runs/{study}/{run}"
            record = {"id": f"{study}:{run}", "study": study,
                      "board": meta.get("board", meta.get("board_id")), "size": meta.get("size"),
                      "model": "subq-snap-preview", "modelVersion": meta.get("returned_model"), "provider": "SubQ",
                      "run": run, "status": "success" if status == 200 else "error" if upstream else "not_run",
                      "kind": "adaptive trajectory decision" if "trajectories" in study else "adapted independent-question batch" if "split" in study else "frozen state replay",
                      "hasResponse": status == 200, "hasMetadata": True, "hasGrade": True,
                      "partialResponse": False, "assessmentOutcome": outcome,
                      "files": {k: f"{prefix}/{k}.json" for k in ("request", "response", "metadata", "grade")},
                      "source": {"jevReceipt": meta.get("source_id"), "family": meta.get("family")},
                      "failure": None if status == 200 else {"http_status": status, "scope": "provider validation or compatibility; not a Queens correctness grade"}}
            if status == 422:
                record.update(excluded=True, exclusionReason="SubQ rejected a 25-question native Jev request; live validation revealed a 16-question limit. Retained for integration evidence, excluded from model-quality scores.",
                              errorContext={"category": "Provider validation", "title": "SubQ accepts at most 16 questions per request",
                                            "interpretation": "The retained Jev request contained 25 independent questions. This response supplied no Queens decision.",
                                            "followUp": "Read the separately labeled split-batch replay; it preserves each question but changes request grouping.",
                                            "sourceUrl": "https://docs.subq.ai/endpoints/decisions-api/", "sourceLabel": "SubQ Decisions contract"})
            manifest["records"].append(record)
        if (output / "trajectories").exists():
            target = PUBLIC / "subq-trajectories"
            target.mkdir(exist_ok=True)
            for path in (output / "trajectories").glob("*.json"):
                shutil.copyfile(path, target / path.name)
        if (output / "logical").exists():
            for path in (output / "logical").glob("*/*.json"):
                dest = PUBLIC / name / "logical" / path.parent.name / path.name
                dest.parent.mkdir(parents=True, exist_ok=True)
                shutil.copyfile(path, dest)
    indexes = {key: collections.defaultdict(list) for key in manifest["index"]}
    for record in manifest["records"]:
        for key, values in indexes.items():
            value = record.get(key)
            if value is not None:
                values[str(value).lower() if isinstance(value, bool) else str(value)].append(record["id"])
    # Preserve historical grade-summary indexes (they have no request rows).
    for key, old in manifest["index"].items():
        for value, ids in old.items():
            indexes[key][value].extend(i for i in ids if i.startswith("grade:") and i not in indexes[key][value])
    manifest["index"] = indexes
    records = manifest["records"]
    counts = manifest["counts"]
    counts.update(studies=len(manifest["studies"]), requests=len(records),
                  responses=sum(r.get("hasResponse", False) for r in records),
                  metadata=sum(r.get("hasMetadata", False) for r in records),
                  grades=sum(r.get("hasGrade", False) for r in records),
                  excluded=sum(r.get("excluded", False) for r in records),
                  assessmentOutcomes=dict(collections.Counter(r["assessmentOutcome"] for r in records)),
                  statuses=dict(collections.Counter(r["status"] for r in records)))
    save(PUBLIC / "manifest.json", manifest)
    ledger = ROOT / "output/subq-ledger/budget.json"
    if ledger.exists():
        save(PUBLIC / "subq-budget.json", read(ledger))
    source_audit = ROOT / "scripts/subq/input/reference-audit.json"
    if source_audit.exists():
        save(PUBLIC / "subq-reference-audit.json", read(source_audit))
    print(json.dumps({"public_records": len(records), "studies": len(manifest["studies"])}))


if __name__ == "__main__":
    main()
