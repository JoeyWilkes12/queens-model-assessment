"""Publish the frontier image panel and the dated Grok re-run into public evidence.

Requests are published in the evidence bundle's existing form: the image (inline
data URL or public URL) is replaced by a content-addressed asset reference, and
the PNG is copied to public/evidence/assets/<sha256>.png. Responses, metadata,
strict grades and format diagnostics are copied as recorded. Appends only these
studies to the manifest; earlier records are untouched. Offline.

    python3 scripts/llm_panel/publish.py
"""
import base64
import collections
import hashlib
import json
import pathlib
import shutil

ROOT = pathlib.Path(__file__).resolve().parents[2]
PUBLIC = ROOT / "public/evidence"
PANEL = ROOT / "output/llm-panel"
RERUN = ROOT / "output/llm-panel-rerun"
STUDY = "2026-10-16-frontier-image-panel"
RERUN_STUDY = "2026-10-16-one-shot-rerun"


def read(path):
    return json.loads(pathlib.Path(path).read_text())


def save(path, value):
    path = pathlib.Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n")


def sanitized(request, png_bytes):
    """Replace the image payload with the evidence bundle's asset reference."""
    out = json.loads(json.dumps(request))
    digest = hashlib.sha256(png_bytes).hexdigest()
    for part in out["messages"][0]["content"]:
        if part.get("type") == "image_url":
            url = part["image_url"]["url"]
            delivery = "inline_data_url" if url.startswith("data:") else "public_url"
            part["image_url"] = {"asset_ref": f"request-inline-image://sha256/{digest}" if delivery == "inline_data_url" else url,
                                 "asset_path": f"assets/{digest}.png", "media_type": "image/png", "sha256": digest,
                                 "bytes": len(png_bytes), "delivery": delivery}
    (PUBLIC / "assets").mkdir(parents=True, exist_ok=True)
    target = PUBLIC / "assets" / f"{digest}.png"
    if not target.exists():
        target.write_bytes(png_bytes)
    return out


def outcome(meta, strict):
    if meta.get("http_status") != 200:
        return "request_failure"
    return "success" if strict.get("correct") and strict.get("format_valid") else "model_failure"


def record(study, call_id, board_id, size, model, meta, strict, kind):
    prefix = f"runs/{study}/{call_id}"
    return {"id": f"{study}:{call_id}", "study": study, "board": board_id, "size": size, "model": model,
            "modelVersion": meta.get("returned_model"), "provider": meta.get("provider"), "run": call_id,
            "status": "success" if meta.get("http_status") == 200 else "error" if meta.get("http_status") else "timeout_or_transport_failure",
            "kind": kind, "hasResponse": meta.get("http_status") == 200, "hasMetadata": True, "hasGrade": True,
            "partialResponse": False, "assessmentOutcome": outcome(meta, strict),
            "files": {k: f"{prefix}/{k}.json" for k in ("request", "response", "metadata", "grade")}}


def main():
    manifest = read(PUBLIC / "manifest.json")
    manifest["records"] = [r for r in manifest["records"] if r["study"] not in (STUDY, RERUN_STUDY)]
    manifest["studies"] = [s for s in manifest["studies"] if s not in (STUDY, RERUN_STUDY)]
    plan = read(PANEL / "manifest.json")
    added = 0
    for call in plan["schedule"]:
        directory = PANEL / "raw" / call["call_id"]
        if not (directory / "metadata.json").exists():
            continue
        png = (PANEL / "images" / f"{call['board_id']}.png").read_bytes()
        assert hashlib.sha256(png).hexdigest() == call["image_sha256"]
        dest = PUBLIC / "runs" / STUDY / call["call_id"]
        save(dest / "request.json", sanitized(read(PANEL / "requests" / f"{call['call_id']}.json"), png))
        for name in ("response.json", "metadata.json", "grade.json", "diagnostic.json"):
            shutil.copyfile(directory / name, dest / name)
        manifest["records"].append(record(STUDY, call["call_id"], call["board_id"], call["size"], call["model"],
                                          read(directory / "metadata.json"), read(directory / "grade.json"),
                                          "one-shot image placement (new-board panel)"))
        added += 1
    for directory in sorted((PANEL / "reruns").glob("*")) if (PANEL / "reruns").exists() else []:
        call = next(c for c in plan["schedule"] if c["call_id"] == directory.name)
        png = (PANEL / "images" / f"{call['board_id']}.png").read_bytes()
        run_id = directory.name + "_rerun-2026-10-16"
        dest = PUBLIC / "runs" / STUDY / run_id
        save(dest / "request.json", sanitized(read(PANEL / "requests" / f"{call['call_id']}.json"), png))
        for name in ("response.json", "metadata.json", "grade.json", "diagnostic.json", "started.json"):
            shutil.copyfile(directory / name, dest / name)
        manifest["records"].append(record(STUDY, run_id, call["board_id"], call["size"], call["model"],
                                          read(directory / "metadata.json"), read(directory / "grade.json"),
                                          "dated re-run of a panel request that failed before any model answer (HTTP 429)"))
        added += 1
    manifest["studies"].append(STUDY)
    for directory in sorted(RERUN.glob("*")) if RERUN.exists() else []:
        if not (directory / "metadata.json").exists():
            continue
        request = read(directory / "request.json")
        url = request["messages"][0]["content"][1]["image_url"]["url"]
        png = base64.b64decode(url.split(",", 1)[1])
        dest = PUBLIC / "runs" / RERUN_STUDY / directory.name
        save(dest / "request.json", sanitized(request, png))
        for name in ("response.json", "metadata.json", "grade.json", "diagnostic.json"):
            shutil.copyfile(directory / name, dest / name)
        manifest["records"].append(record(RERUN_STUDY, directory.name, "queens-7-medium", 7, request["model"],
                                          read(directory / "metadata.json"), read(directory / "grade.json"),
                                          "dated re-run of a September one-shot request"))
        added += 1
        if RERUN_STUDY not in manifest["studies"]:
            manifest["studies"].append(RERUN_STUDY)
    public_plan = {k: v for k, v in plan.items() if k != "schedule"}
    public_plan["schedule"] = [{k: v for k, v in c.items()} for c in plan["schedule"]]
    save(PUBLIC / "frontier-image-panel/plan.json", public_plan)
    if (PANEL / "summary.json").exists():
        save(PUBLIC / "frontier-image-panel/summary.json", read(PANEL / "summary.json"))
    for name in ("submission.json", "settled.json"):
        path = PANEL / "batches/gpt-5.6-sol" / name
        if path.exists():
            save(PUBLIC / "frontier-image-panel" / ("batch-gpt-5.6-sol-" + name), read(path))
    indexes = {key: collections.defaultdict(list) for key in manifest["index"]}
    for item in manifest["records"]:
        for key, values in indexes.items():
            value = item.get(key)
            if value is not None:
                values[str(value).lower() if isinstance(value, bool) else str(value)].append(item["id"])
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
    print(json.dumps({"published": added, "public_records": len(records), "studies": len(manifest["studies"])}))


if __name__ == "__main__":
    main()
