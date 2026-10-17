"""Publish the 17 October earlier-generation panel into public evidence.

Requests are published as sent: for a batch that used the Anthropic Messages
shape, the published request is that shape. Image payloads become the evidence
bundle's content-addressed asset reference (public URLs are kept as the URL
that was sent). Responses, metadata, strict grades and format diagnostics are
copied as recorded. Appends only this study to the manifest. Offline.

    python3 scripts/llm_panel/publish_legacy.py
"""
import collections
import json
import pathlib
import sys

HERE = pathlib.Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
sys.path.insert(0, str(HERE.parents[1] / "scripts/analysis"))
from public_scrub import save_public  # noqa: E402
import legacy_panel as L  # noqa: E402
from publish import sanitized, outcome  # noqa: E402

ROOT = L.ROOT
PUBLIC = ROOT / "public/evidence"
STUDY = L.STUDY


def rebuild_index(manifest):
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


def main():
    manifest = L.read(PUBLIC / "manifest.json")
    manifest["records"] = [r for r in manifest["records"] if r["study"] != STUDY]
    manifest["studies"] = [s for s in manifest["studies"] if s != STUDY]
    plan = L.read(L.OUT / "manifest.json")
    shapes = {short: L.read(L.batch_dir(short) / "submission.json").get("shape", "chat")
              for short in L.MODELS if (L.batch_dir(short) / "submission.json").exists()}
    added = 0
    for call in plan["schedule"]:
        directory = L.OUT / "raw" / call["call_id"]
        if not (directory / "metadata.json").exists():
            manifest["records"].append({"id": f"{STUDY}:{call['call_id']}", "study": STUDY, "board": call["board_id"], "size": call["size"],
                                        "model": call["model"], "modelVersion": None, "provider": None, "run": call["call_id"],
                                        "status": "not_run", "kind": "one-shot image placement (earlier generations, 36-board panel)",
                                        "hasResponse": False, "hasMetadata": False, "hasGrade": False, "partialResponse": False,
                                        "assessmentOutcome": "not_run", "files": {}})
            continue
        png, digest = L.board_png(call["board_id"])
        meta = L.read(directory / "metadata.json")
        body = L.read(L.OUT / "requests" / f"{call['call_id']}.json")
        if call["route"] == "batch" and shapes.get(call["short"]) == "messages":
            body = L.messages_shape(body, call["short"])
            for part in body["messages"][0]["content"]:
                if part.get("type") == "image":
                    url = part["source"]["url"]
                    part["source"] = {"type": "url", "url": url, "asset_path": f"assets/{digest}.png", "sha256": digest,
                                      "bytes": len(png), "delivery": "public_url"}
            published = body
        else:
            published = sanitized(body, png)
        dest = PUBLIC / "runs" / STUDY / call["call_id"]
        save_public(dest / "request.json", published)
        for name in ("response.json", "metadata.json", "grade.json", "diagnostic.json"):
            save_public(dest / name, L.read(directory / name))
        strict = L.read(directory / "grade.json")
        manifest["records"].append({"id": f"{STUDY}:{call['call_id']}", "study": STUDY, "board": call["board_id"], "size": call["size"],
                                    "model": call["model"], "modelVersion": meta.get("returned_model"), "provider": meta.get("provider"),
                                    "run": call["call_id"],
                                    "status": "success" if meta.get("http_status") == 200 else "error" if meta.get("http_status") else "timeout_or_transport_failure",
                                    "kind": "one-shot image placement (earlier generations, 36-board panel)",
                                    "hasResponse": meta.get("http_status") == 200, "hasMetadata": True, "hasGrade": True,
                                    "partialResponse": False, "assessmentOutcome": outcome(meta, strict),
                                    "files": {k: f"runs/{STUDY}/{call['call_id']}/{k}.json" for k in ("request", "response", "metadata", "grade")}})
        added += 1
    manifest["studies"].append(STUDY)
    rebuild_index(manifest)
    save_public(PUBLIC / "manifest.json", manifest)
    out = PUBLIC / "legacy-panel"
    save_public(out / "plan.json", plan)
    if (L.OUT / "summary.json").exists():
        save_public(out / "summary.json", L.read(L.OUT / "summary.json"))
    for short in L.MODELS:
        for name in ("submission.json", "settled.json"):
            path = L.batch_dir(short) / name
            if path.exists():
                save_public(out / f"batch-{short}-{name}", L.read(path))
        for path in sorted(L.batch_dir(short).glob("submission-response-attempt*.json")) if L.batch_dir(short).exists() else []:
            save_public(out / f"batch-{short}-{path.name}", L.read(path))
    print(json.dumps({"published": added, "public_records": len(manifest["records"]), "studies": len(manifest["studies"])}))


if __name__ == "__main__":
    main()
