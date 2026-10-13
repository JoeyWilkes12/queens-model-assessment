#!/usr/bin/env python3
"""Explicit question-batch adaptation for the observed 16-question limit.

Each original independent question retains its text, criteria and option order.
The batch context changes, so these are separately labeled adapted assessments.
"""
import argparse
import collections
import json
import pathlib

import replay

STUDY = "2026-10-13-subq-split-replay"


def prepare(args):
    inputs = pathlib.Path(args.input)
    output = pathlib.Path(args.output)
    source = replay.read(inputs / "manifest.json")
    schedule = []
    logical = []
    seen = set()
    for entry in source["schedule"]:
        fixture = replay.read(inputs / entry["fixture"])
        parent = fixture["request"]
        if len(parent["questions"]) <= 16 or entry["source_id"] in seen:
            continue
        seen.add(entry["source_id"])
        items = list(parent["questions"].items())
        chunks = [items[i:i + 16] for i in range(0, len(items), 16)]
        logical_id = entry["source_id"]
        parent_name = entry["call_id"] + ".json"
        replay.save(output / "parents" / parent_name, fixture)
        part_ids = []
        for index, chunk in enumerate(chunks, 1):
            part_request = {"model": replay.MODEL, "state": parent["state"], "questions": dict(chunk)}
            call_id = "%03d_%s_part%d" % (len(schedule) + 1, entry["call_id"].split("_", 1)[1].rsplit("_repeat", 1)[0], index)
            part_ids.append(call_id)
            name = call_id + ".json"
            adapted = {k: v for k, v in fixture.items() if k not in ("request", "reference_grade", "source_semantics_sha256")}
            adapted.update(request=part_request, reference_grade=None,
                           source_semantics_sha256=replay.sha(replay.encoded({"state": part_request["state"], "questions": part_request["questions"]})),
                           parent_source_semantics_sha256=fixture["source_semantics_sha256"], parent_call_id=entry["call_id"],
                           logical_id=logical_id, adaptation={"kind": "question_batch_split", "part": index, "parts": len(chunks),
                           "question_count": len(chunk), "parent_question_count": len(items), "observed_provider_max_questions": 16})
            assert part_request["state"] == parent["state"]
            assert list(part_request["questions"].items()) == chunk
            replay.save(output / "fixtures" / name, adapted)
            schedule.append({**entry, "call_id": call_id, "family": "split_" + entry["family"],
                             "fixture": "fixtures/" + name, "part": index, "total_parts": len(chunks),
                             "parent_call_id": entry["call_id"], "logical_id": logical_id})
        logical.append({"logical_id": logical_id, "source_id": entry["source_id"], "parent_call_id": entry["call_id"],
                        "board": entry["board"], "size": entry["size"], "family": "split_" + entry["family"],
                        "parent_fixture": "parents/" + parent_name, "parts": part_ids,
                        "parent_question_count": len(items), "part_question_counts": [len(chunk) for chunk in chunks]})
    plan = {"schema_version": 1, "study": STUDY, "model": replay.MODEL, "created_utc": replay.now(),
            "scheduled_calls": len(schedule), "unique_source_requests": len(logical), "planned_logical_tasks": len(logical),
            "schedule": schedule, "logical_tasks": logical,
            "design": "Observed provider limit adaptation; each 25-question original is split into contiguous groups of 16 and 9.",
            "caveats": ["This is a separately labeled grouped-batch condition, not exact request-body replication.",
                        "Board state and every question's instructions, criteria, labels and option order are unchanged. Only the per-request question group changes.",
                        "These historical questions are independent judgments; questions do not consume one another's answers. Batching context can still affect results.",
                        "Merged answers are an offline aggregation of separate successful provider receipts. No model returned the merged object in a single call.",
                        "Logical-task validity is graded only after every part succeeds. Incomplete parts remain visible and are not silently repaired or retried.",
                        "The initial original requests rejected with HTTP 422 and later local compatibility skips remain in the exact-replay study; they are not Queens model failures."]}
    replay.save(output / "manifest.json", plan)
    print(json.dumps({"prepared": str(output), "logical_tasks": len(logical), "part_calls": len(schedule)}), flush=True)


def audit(args):
    output = pathlib.Path(args.output)
    plan = replay.read(output / "manifest.json")
    # Audit each real request/response using the same deterministic checker.
    parts_summary = replay.audit(args)
    by_id = {record["call_id"]: record for record in parts_summary["records"]}
    logical = []
    for item in plan["logical_tasks"]:
        completed = [by_id[cid] for cid in item["parts"] if cid in by_id]
        valid = len(completed) == len(item["parts"]) and all(row["http_status"] == 200 and row["grade"]["schema_valid"] for row in completed)
        row = {**item, "completed_parts": len(completed), "total_parts": len(item["parts"]), "complete": valid, "grade": None}
        if valid:
            parent = replay.read(output / "parents" / pathlib.Path(item["parent_fixture"]).name)
            req = parent["request"]
            merged = {"model": replay.MODEL, "answers": {}, "usage": {"input_tokens": 0, "output_tokens": 0}}
            for part in completed:
                body = replay.read(output / "runs" / part["call_id"] / "response.json")
                assert not set(merged["answers"]) & set(body["answers"])
                merged["answers"].update(body["answers"])
                merged["usage"]["input_tokens"] += body["usage"]["input_tokens"]
            assert set(merged["answers"]) == set(req["questions"])
            checked = replay.grade(req, merged)
            assert checked["schema_valid"]
            row["grade"] = checked
            logical_dir = output / "logical" / item["parent_call_id"]
            replay.save(logical_dir / "request.json", req)
            replay.save(logical_dir / "merged-response.json", merged)
            replay.save(logical_dir / "grade.json", checked)
            replay.save(logical_dir / "aggregation.json", {"kind": "offline_question_batch_aggregation", "provider_single_response": False,
                        "parts": item["parts"], "source_id": item["source_id"],
                        "parent_source_semantics_sha256": parent["source_semantics_sha256"]})
        logical.append(row)
    groups = collections.defaultdict(list)
    for row in logical:
        groups[row["family"]].append(row)
    summary = {**parts_summary, "study": STUDY, "planned_logical_tasks": len(logical),
               "completed_logical_tasks": sum(row["complete"] for row in logical),
               "remaining_logical_tasks": sum(not row["complete"] for row in logical),
               "logical_primary_correct": sum(row["grade"]["primary_correct"] is True for row in logical if row["complete"]),
               "families": [{"family": family, "logical_tasks": len(rows), "complete_logical_tasks": sum(row["complete"] for row in rows),
                             "primary_correct": sum(row["grade"]["primary_correct"] is True for row in rows if row["complete"])}
                            for family, rows in groups.items()], "logical_tasks": logical}
    replay.save(output / "summary.json", summary)
    print(json.dumps({"split_part_requests": summary["requests"], "complete_logical_tasks": summary["completed_logical_tasks"],
                      "logical_primary_correct": summary["logical_primary_correct"], "budget": summary["budget"]}), flush=True)


def run(args):
    inputs = pathlib.Path(args.input)
    output = pathlib.Path(args.output)
    plan = replay.read(inputs / "manifest.json")
    for item in plan["logical_tasks"]:
        replay.save(output / item["parent_fixture"], replay.read(inputs / item["parent_fixture"]))
    replay.run(args)
    audit(args)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    commands = parser.add_subparsers(dest="command", required=True)
    prep = commands.add_parser("prepare")
    prep.add_argument("--input", default=str(replay.HERE / "input"))
    prep.add_argument("--output", default=str(replay.HERE / "input/split"))
    execute = commands.add_parser("run")
    execute.add_argument("--input", default="/input/split")
    execute.add_argument("--output", default="/output")
    execute.add_argument("--broker-socket", default="/ipc/subq.sock")
    execute.add_argument("--limit", type=int, default=1, help="Maximum NEW part requests")
    execute.add_argument("--max-questions", type=int, default=16)
    check = commands.add_parser("audit")
    check.add_argument("--output", default="/output")
    args = parser.parse_args()
    replay.STUDY = STUDY
    {"prepare": prepare, "run": run, "audit": audit}[args.command](args)


if __name__ == "__main__":
    main()
