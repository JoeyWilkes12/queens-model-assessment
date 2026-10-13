#!/usr/bin/env python3
"""Credential-free, sequential replay of retained native Jev assessments.

Only the request envelope changes. The broker owns authentication, provider
egress and the budget. This worker never reads a credential or imports a model
provider SDK. All grading uses model-visible boards and supplied candidates.
"""
from __future__ import annotations

import argparse
import collections
import datetime
import functools
import hashlib
import http.client
import itertools
import json
import math
import pathlib
import re
import socket
import sys
import time

MODEL = "subq-snap-preview"
HERE = pathlib.Path(__file__).resolve().parent
SITE = HERE.parent.parent
STUDY = "2026-10-13-subq-replay"


def encoded(value):
    return json.dumps(value, ensure_ascii=False, separators=(",", ":")).encode()


def sha(data):
    return hashlib.sha256(data).hexdigest()


def read(path):
    return json.loads(pathlib.Path(path).read_text())


def save(path, value):
    path = pathlib.Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n")


def now():
    return datetime.datetime.now(datetime.timezone.utc).isoformat()


def checks(grid, columns):
    n = len(grid)
    shape = len(columns) == n and all(type(c) is int and 1 <= c <= n for c in columns)
    if not shape:
        return {"shape": False, "one_per_row": False, "one_per_column": False,
                "one_per_region": False, "no_touch": False, "correct": False}
    result = {"shape": True, "one_per_row": True,
              "one_per_column": len(set(columns)) == n,
              "one_per_region": len({grid[r][c - 1] for r, c in enumerate(columns)}) == n,
              "no_touch": all(abs(columns[r] - columns[r + 1]) > 1 for r in range(n - 1))}
    result["correct"] = all(result.values())
    return result


@functools.lru_cache(maxsize=64)
def solutions(grid):
    """Bounded, deterministic backtracking; row/column/region/non-touch only."""
    n = len(grid)
    found = []

    def visit(prefix, used_columns, used_regions):
        if len(prefix) == n:
            found.append(tuple(prefix))
            return
        r = len(prefix)
        for c in range(1, n + 1):
            region = grid[r][c - 1]
            if c in used_columns or region in used_regions or (r and abs(c - prefix[-1]) <= 1):
                continue
            visit(prefix + [c], used_columns | {c}, used_regions | {region})

    visit([], set(), set())
    return tuple(found)


def independent_valid(grid, columns):
    n = len(grid)
    return (len(columns) == n and all(type(c) is int and 1 <= c <= n for c in columns)
            and len(set(columns)) == n
            and len({grid[r][c - 1] for r, c in enumerate(columns)}) == n
            and all(max(abs(r - s), abs(columns[r] - columns[s])) > 1
                    for r, s in itertools.combinations(range(n), 2)))


def vector(description, n):
    """Read only the frozen harness's known vector/coordinate/Q-grid formats."""
    for match in re.finditer(r"\[[^\[\]]*\]", description):
        try:
            value = json.loads(match.group())
        except json.JSONDecodeError:
            continue
        if isinstance(value, list) and len(value) == n and all(type(c) is int for c in value):
            return value
    pairs = re.findall(r"row (\d+), column (\d+)", description, re.I)
    if len(pairs) == n and [int(r) for r, _ in pairs] == list(range(1, n + 1)):
        return [int(c) for _, c in pairs]
    lines = [line.split() for line in description.splitlines()
             if re.fullmatch(r"[Q.\s]+", line) and "Q" in line]
    if len(lines) == n and all(len(line) == n and line.count("Q") == 1 for line in lines):
        return [line.index("Q") + 1 for line in lines]
    return None


def local_valid(grid, placed, cell):
    r, c = cell
    return all(r != s and c != d and grid[r - 1][c - 1] != grid[s - 1][d - 1]
               and max(abs(r - s), abs(c - d)) > 1 for s, d in placed)


def board_grid(state):
    if "region_grid_rows" in state:
        return state["region_grid_rows"]
    if "board_description" in state:
        rows = re.findall(r"Row (\d+), from left to right, contains regions ([A-Z, ]+)\.", state["board_description"])
        assert [int(r) for r, _ in rows] == list(range(1, state["size"] + 1))
        grid = [[letter.strip() for letter in letters.split(",")] for _, letters in rows]
        assert all(len(row) == state["size"] for row in grid)
        return grid
    return None


def expected_question(request, key, question):
    """Return the criterion's deterministic truth, never a model-produced label."""
    state = request["state"]
    grid = board_grid(state)
    if not grid:
        return {"kind": "ungraded", "reason": "Shared-state batch or unsupported historical probe."}
    n = len(grid)
    truth = solutions(tuple(tuple(row) for row in grid))
    assert len(truth) == 1, "Expected one certified complete board solution"
    instructions = question["instructions"]
    criteria = question["criteria"]
    if question["type"] == "choice":
        match = re.fullmatch(r"cell_(\d+)_(\d+)", key)
        if match:
            r, c = map(int, match.groups())
            return {"kind": "grid_reading", "acceptable": [grid[r - 1][c - 1]]}
        match = re.fullmatch(r"row_(\d+)", key)
        if match:
            return {"kind": "row_construction", "acceptable": [str(truth[0][int(match[1]) - 1])]}
        parsed = {label: vector(text, n) for label, text in criteria.items()}
        if any(v is not None for v in parsed.values()):
            acceptable = [label for label, cols in parsed.items() if cols is not None and independent_valid(grid, cols)]
            if not acceptable and "none" in criteria:
                acceptable = ["none"]
            assert acceptable, "Frozen candidate set unexpectedly lacks a valid answer"
            return {"kind": "complete_recognition", "acceptable": acceptable, "candidates": parsed}
        given = state.get("given_correct_queen")
        if given:
            placed = [(given["row"], given["column"])]
            candidates = {}
            for label, text in criteria.items():
                match = re.search(r"row (\d+), column (\d+)", text, re.I)
                assert match, "Unrecognized partial-cell format"
                candidates[label] = tuple(map(int, match.groups()))
            is_local = "Only immediate pairwise legality" in instructions
            acceptable = [label for label, (r, c) in candidates.items()
                          if local_valid(grid, placed, (r, c)) and (is_local or truth[0][r - 1] == c)]
            return {"kind": "local_move" if is_local else "global_move", "acceptable": acceptable,
                    "cells": candidates, "given": placed[0]}
        if key == "region" or "unoccupied color region" in instructions:
            return {"kind": "region_preference", "acceptable": None}
        # Exact first-cell trajectory probes / historical frozen cell decisions.
        cells = {}
        for label, text in criteria.items():
            match = re.search(r"row (\d+), column (\d+)", text, re.I)
            if not match:
                match = re.fullmatch(r"r(\d+)c(\d+)", label)
            if match:
                cells[label] = tuple(map(int, match.groups()))
        if len(cells) == len(criteria):
            return {"kind": "frozen_trajectory_cell", "acceptable": [label for label, (r, c) in cells.items()
                    if truth[0][r - 1] == c], "cells": cells}
        return {"kind": "ungraded", "reason": "Unrecognized historical choice format"}
    match = re.fullmatch(r"(batch|sequential|recognition)_(columns|regions|no_touch|all_rules)", key)
    if match:
        name, condition = match.groups()
        cols = state["candidate_columns_by_row"][name]
        result = checks(grid, cols)
        field = {"columns": "one_per_column", "regions": "one_per_region", "no_touch": "no_touch", "all_rules": "correct"}[condition]
        return {"kind": "rule_judgment", "truth": result[field]}
    cols = vector(instructions, n)
    if cols is not None:
        missing = n - len({grid[r][c - 1] for r, c in enumerate(cols)})
        return {"kind": "candidate_validity" if question["type"] == "noul" else "coverage_score",
                "truth": missing == 0, "score_level": 2 if missing == 0 else 1 if missing == 1 else 0,
                "missing_regions": missing}
    return {"kind": "ungraded", "reason": "Unrecognized historical typed question"}


def number(value):
    return type(value) in (int, float) and math.isfinite(value)


def schema_failure(reason):
    return {"schema_valid": False, "schema_errors": [reason], "primary_correct": None,
            "outcome": "schema_failure", "question_count": 0,
            "graded_question_count": 0, "correct_questions": 0, "questions": {}}


def distribution_valid(probs, labels):
    return (isinstance(probs, dict) and set(probs) == set(labels)
            and all(number(p) and 0 <= p <= 1 for p in probs.values())
            and abs(sum(probs.values()) - 1) <= .020000001)


def grade(request, response, expected_model=MODEL):
    questions = request["questions"]
    if not isinstance(response, dict):
        return schema_failure("Response body is not a JSON object")
    if response.get("model") != expected_model:
        return schema_failure("Unexpected returned model identifier")
    answers = response.get("answers")
    if not isinstance(answers, dict) or set(answers) != set(questions):
        return schema_failure("Answer keys differ from frozen question keys")
    rows = {}
    schema_errors = []
    for key, question in questions.items():
        answer = answers[key]
        expected = expected_question(request, key, question)
        row = {"kind": expected["kind"], "correct": None}
        rows[key] = row
        if not isinstance(answer, dict) or answer.get("type") != question["type"]:
            schema_errors.append(key + ": type mismatch")
            continue
        typ = question["type"]
        if typ in ("choice", "score") and (not number(answer.get("confidence")) or not 0 <= answer["confidence"] <= 1):
            schema_errors.append(key + ": invalid confidence")
            continue
        if typ == "choice":
            selected = answer.get("choice")
            probs = answer.get("probabilities")
            if not isinstance(selected, str) or selected not in question["criteria"] or not distribution_valid(probs, question["criteria"]):
                schema_errors.append(key + ": invalid choice/distribution")
                continue
            row.update(selected=selected, probability_sum=sum(probs.values()), confidence=answer.get("confidence"),
                       selected_below_reported_max=probs[selected] < max(probs.values()))
            acceptable = expected.get("acceptable")
            if acceptable is not None:
                row.update(correct=selected in acceptable, acceptable_count=len(acceptable),
                           correct_probability_mass=sum(probs[label] for label in acceptable))
            if expected.get("candidates", {}).get(selected) is not None:
                cols = expected["candidates"][selected]
                result = checks(board_grid(request["state"]), cols)
                assert result["correct"] == independent_valid(board_grid(request["state"]), cols)
                row.update(columns_by_row=cols, checks=result)
            if selected in expected.get("cells", {}):
                r, c = expected["cells"][selected]
                row["cell"] = {"row": r, "column": c}
                if "given" in expected:
                    row["locally_legal"] = local_valid(board_grid(request["state"]), [expected["given"]], (r, c))
        elif typ == "noul":
            p = answer.get("noul")
            if not number(p) or not 0 <= p <= 1:
                schema_errors.append(key + ": invalid noul")
                continue
            if "truth" in expected:
                truth = expected["truth"]
                row.update(truth=truth, noul=p, correct=(p >= .5) == truth, brier=(p - int(truth)) ** 2)
        elif typ == "score":
            value = answer.get("score")
            probs = answer.get("probabilities")
            if (not number(value) or not 0 <= value <= len(question["criteria"]) - 1
                    or not distribution_valid(probs, [str(i) for i in range(len(question["criteria"]))])
                    or answer.get("legend") != {str(i): label for i, label in enumerate(question["criteria"])}):
                schema_errors.append(key + ": invalid score/distribution")
                continue
            if "score_level" in expected:
                level = expected["score_level"]
                modal = [int(k) for k, p in probs.items() if p == max(probs.values())]
                row.update(score=value, true_level=level, absolute_error=abs(value - level),
                           modal_levels=modal, correct=level in modal, valid_probability=probs.get("2"))
    graded = [row["correct"] for row in rows.values() if row["correct"] is not None]
    primary = rows.get("pick", rows.get("choose"))
    primary_correct = primary["correct"] if primary else (all(graded) if graded else None)
    result = {"schema_valid": not schema_errors, "schema_errors": schema_errors,
              "primary_correct": primary_correct, "question_count": len(questions),
              "graded_question_count": len(graded), "correct_questions": sum(graded), "questions": rows}
    grid = board_grid(request["state"])
    row_keys = ["row_" + str(r) for r in range(1, len(grid or []) + 1)]
    if grid and set(questions) == set(row_keys):
        try:
            columns = [int(answers[key]["choice"]) for key in row_keys]
            result["columns_by_row"] = columns
            result["checks"] = checks(grid, columns)
            assert result["checks"]["correct"] == independent_valid(grid, columns)
            result["primary_correct"] = result["checks"]["correct"]
        except (KeyError, TypeError, ValueError):
            pass
    result["outcome"] = "schema_failure" if schema_errors else "ungraded" if result["primary_correct"] is None else "success" if result["primary_correct"] else "model_failure"
    return result


def prepare(args):
    source = pathlib.Path(args.evidence)
    manifest = read(source / "manifest.json")
    valid = {row["id"]: row for row in manifest["records"]
             if "jev" in row.get("model", "") and not row.get("excluded")}
    priority = []
    def add(study, call, family, repeats=1):
        identifier = study + ":" + call
        assert identifier in valid, "Missing eligible historical request: " + identifier
        for repeat in range(1, repeats + 1):
            priority.append((identifier, family, repeat))
    variations = "2026-09-18-jev-5x5-variations"
    scale = "2026-09-19-jev-scale"
    for family in ["complete_annotated", "complete_boards", "refine_annotated_order"]:
        for rep in range(1, 4):
            add(variations, family + "_r" + str(rep), "mixed_" + family, 3)
    for rep in range(1, 4):
        add(scale, "9_vectors_k12_r" + str(rep), "mixed_9_vectors_k12", 3)
    for family in ["complete_features", "complete_vectors", "partial_local", "partial_global", "refine_region_sequence", "refine_region_sentence"]:
        for rep in range(1, 4):
            add(variations, family + "_r" + str(rep), "control_" + family)
    for family in ["7_vectors_k12", "7_regions_k12", "9_regions_k12"]:
        for rep in range(1, 4):
            add(scale, family + "_r" + str(rep), "control_" + family)
    for identifier, row in valid.items():
        if row["study"] == "2026-09-18-jev-deep-dive":
            add(row["study"], row["run"], "deep_dive_" + row["run"])
    for identifier, row in valid.items():
        if row["study"] == "2026-09-19-jev-primitives":
            add(row["study"], row["run"], "heldout_" + row["run"].split("_", 1)[-1])
    if args.full:
        used = {q[0] for q in priority}
        for identifier, row in valid.items():
            if identifier not in used:
                add(row["study"], row["run"], "remaining_" + row["study"])
    output = pathlib.Path(args.output)
    fixtures = {}
    schedule = []
    reference_audit = []
    for index, (identifier, family, rep) in enumerate(priority, 1):
        row = valid[identifier]
        if identifier not in fixtures:
            original_path = source / row["files"]["request"]
            original_bytes = original_path.read_bytes()
            original = json.loads(original_bytes)
            assert set(original) >= {"state", "questions"} and "messages" not in original
            adapted = {"model": MODEL, "state": original["state"], "questions": original["questions"]}
            fixture_name = row["study"] + "__" + row["run"] + ".json"
            fixture = {"source_id": identifier, "source_files": row["files"], "source_outcome": row["assessmentOutcome"],
                       "source_request_file_sha256": sha(original_bytes),
                       "source_semantics_sha256": sha(encoded({"state": original["state"], "questions": original["questions"]})),
                       "request": adapted, "reference_grade": read(source / row["files"]["grade"]) if row["files"]["grade"] else None}
            for key, question in adapted["questions"].items():
                expected_question(adapted, key, question)  # fail before inference on unknown board assumptions
            if row["files"]["response"] and row["status"] == "success":
                reference = grade(adapted, read(source / row["files"]["response"]), expected_model=row["modelVersion"])
                known = fixture["reference_grade"] or {}
                known_primary = next((known[k] for k in ["task_correct", "choice_correct", "correct"] if type(known.get(k)) is bool), None)
                if isinstance(known.get("engine"), dict):
                    known_primary = known["engine"].get("correct", known_primary)
                # Historical sequential row receipts store the whole trajectory grade;
                # only their row-level deterministic score is comparable here.
                if row["run"].startswith("03_sequential"):
                    known_primary = None
                if known_primary is not None:
                    assert reference["primary_correct"] == known_primary, (identifier, reference["primary_correct"], known_primary)
                assert reference["schema_valid"], (identifier, reference["schema_errors"])
                reference_audit.append({"source_id": identifier, "schema_valid": True,
                                        "recomputed_primary_correct": reference["primary_correct"], "historical_primary_correct": known_primary})
            save(output / "fixtures" / fixture_name, fixture)
            fixtures[identifier] = fixture_name
        schedule.append({"call_id": "%03d_%s_repeat%d" % (index, row["run"], rep), "source_id": identifier,
                         "family": family, "repeat": rep, "board": row["board"], "size": row["size"],
                         "fixture": "fixtures/" + fixtures[identifier]})
    result = {"schema_version": 1, "study": STUDY, "model": MODEL, "created_utc": now(),
              "design": "Depth-first, sequential, exact-state/questions replay; provider/model envelope adapted only.",
              "scope": "full historical replay" if args.full else "priority mixed cohorts, controls, deep dive and heldout",
              "caveats": ["Three historical variants in a family can change candidates or option order. Each exact variant is repeated three times in mixed cohorts.",
                          "Frozen sequential Jev states are conditional decisions, not a new SubQ trajectory or successful full solve.",
                          "Historical HTTP 520 and its explicit retry are distinct historical attempts sharing an identical payload. SubQ does not automatically retry failures.",
                          "Choice counts, typed-question accuracy, full-placement validity and API availability have separate denominators.",
                          "Only model-visible state/questions go upstream. Reference grades and computed truth never accompany inference."],
              "eligible_historical_requests": len(valid), "scheduled_calls": len(schedule), "unique_source_requests": len(fixtures),
              "excluded": [{"source_id": row["id"], "reason": row["exclusionReason"]} for row in manifest["records"]
                           if "jev" in row.get("model", "") and row.get("excluded")], "schedule": schedule}
    save(output / "manifest.json", result)
    save(output / "reference-audit.json", {"passed": True, "audited_source_responses": len(reference_audit), "records": reference_audit})
    print(json.dumps({"prepared": str(output), "scheduled": len(schedule), "unique_source_requests": len(fixtures), "audited_source_responses": len(reference_audit)}), flush=True)


class UnixHTTPConnection(http.client.HTTPConnection):
    def __init__(self, socket_path):
        super().__init__("localhost", timeout=180)
        self.socket_path = socket_path

    def connect(self):
        self.sock = socket.socket(socket.AF_UNIX, socket.SOCK_STREAM)
        self.sock.settimeout(self.timeout)
        self.sock.connect(self.socket_path)


def broker(socket_path, method, endpoint, body=None):
    data = encoded(body) if body is not None else None
    connection = UnixHTTPConnection(socket_path)
    try:
        connection.request(method, endpoint, body=data,
                           headers={"Content-Type": "application/json"} if data else {})
        response = connection.getresponse()
        return json.loads(response.read())
    finally:
        connection.close()


def audit(args):
    output = pathlib.Path(args.output)
    records = []
    for metadata in sorted((output / "runs").glob("*/metadata.json")):
        directory = metadata.parent
        meta = read(metadata)
        request = read(directory / "request.json")
        assert sha(encoded(request)) == meta["request_sha256"]
        response = read(directory / "response.json")
        assert sha(encoded(response)) == meta["response_sha256"]
        checked = grade(request, response) if meta["http_status"] == 200 else {"schema_valid": None, "primary_correct": None, "outcome": "not_run" if meta["http_status"] is None else "request_failure"}
        assert checked == read(directory / "grade.json"), directory.name
        records.append({**meta, "grade": checked})
    grouped = collections.defaultdict(list)
    for row in records:
        grouped[row["family"]].append(row)
    summaries = []
    for family, rows in grouped.items():
        graded = [q for q in rows if q["grade"]["primary_correct"] is not None]
        summaries.append({"family": family, "attempts": sum(q["http_status"] is not None for q in rows),
                          "compatibility_skipped": sum(q["http_status"] is None for q in rows), "responses_200": sum(q["http_status"] == 200 for q in rows),
                          "graded_primary": len(graded), "primary_correct": sum(q["grade"]["primary_correct"] for q in graded),
                          "outcomes": dict(collections.Counter(q["grade"]["outcome"] for q in rows)),
                          "elapsed_seconds": sum(q["elapsed_seconds"] for q in rows),
                          "input_tokens": sum((q.get("usage") or {}).get("input_tokens", 0) for q in rows)})
    manifest = read(output / "manifest.json") if (output / "manifest.json").exists() else {}
    planned = manifest.get("scheduled_calls", len(records))
    upstream = sum(row["http_status"] is not None for row in records)
    summary = {"study": STUDY, "model": MODEL, "updated_utc": now(), "requests": upstream,
               "upstream_attempted": upstream, "compatibility_skipped": len(records) - upstream,
               "planned_requests": planned, "attempted_requests": upstream,
               "completed_requests": sum(row["http_status"] == 200 for row in records),
               "remaining_requests": planned - len(records), "unattempted_requests": planned - upstream,
               "unique_source_requests": manifest.get("unique_source_requests"),
               "completed_unique_source_requests": len({row["source_id"] for row in records}),
               "caveats": manifest.get("caveats", []),
               "returned_models": sorted({row["returned_model"] for row in records if row.get("returned_model")}),
               "outcomes": dict(collections.Counter(q["grade"]["outcome"] for q in records)),
               "families": summaries, "budget": next((r["budget"] for r in reversed(records) if r.get("budget") is not None), None),
               "records": records}
    save(output / "summary.json", summary)
    print(json.dumps({"audited": len(records), "outcomes": summary["outcomes"], "budget": summary["budget"]}), flush=True)
    return summary


def run(args):
    inputs = pathlib.Path(args.input)
    output = pathlib.Path(args.output)
    manifest = read(inputs / "manifest.json")
    save(output / "manifest.json", manifest)
    discovery = broker(args.broker_socket, "GET", "/v1/models")
    save(output / "models.json", discovery)
    print(json.dumps({"event": "models_receipt", "status": discovery.get("status"), "budget": discovery.get("budget")}), flush=True)
    if discovery.get("status") != 200:
        raise RuntimeError("Provider model discovery failed; inspect retained models.json")
    model_body = discovery.get("body")
    models = model_body.get("data") if isinstance(model_body, dict) else None
    if not isinstance(models, list) or MODEL not in [row.get("id") for row in models if isinstance(row, dict)]:
        raise RuntimeError("Approved model absent from provider discovery; inspect retained models.json")
    completed = 0
    for entry in manifest["schedule"]:
        directory = output / "runs" / entry["call_id"]
        if (directory / "metadata.json").exists():
            continue
        if (directory / "started.json").exists():
            raise RuntimeError("Unresolved started request requires review before any resubmission: " + entry["call_id"])
        if completed >= args.limit:
            break
        fixture = read(inputs / entry["fixture"])
        request = fixture["request"]
        assert sha(encoded({"state": request["state"], "questions": request["questions"]})) == fixture["source_semantics_sha256"]
        save(directory / "request.json", request)
        save(directory / "source.json", {k: v for k, v in fixture.items() if k != "request"})
        if len(request["questions"]) > args.max_questions:
            body = {"local_compatibility_skip": True, "recognized_question_limit": args.max_questions,
                    "question_count": len(request["questions"]),
                    "reason": "Live provider validation established a question-count limit; original oversized request not dispatched again."}
            checked = {"schema_valid": None, "primary_correct": None, "outcome": "not_run"}
            meta = {**entry, "completed_utc": now(), "http_status": None, "elapsed_seconds": 0,
                    "request_sha256": sha(encoded(request)), "response_sha256": sha(encoded(body)),
                    "source_semantics_sha256": fixture["source_semantics_sha256"], "returned_model": None,
                    "usage": None, "budget": None, "local_compatibility_skip": True}
            save(directory / "response.json", body)
            save(directory / "grade.json", checked)
            save(directory / "metadata.json", meta)
            print(json.dumps({"event": "compatibility_skip", "call_id": entry["call_id"], "questions": len(request["questions"]), "recognized_limit": args.max_questions}), flush=True)
            continue
        save(directory / "started.json", {"started_utc": now(), "request_sha256": sha(encoded(request))})
        print(json.dumps({"event": "request_start", "call_id": entry["call_id"], "family": entry["family"], "questions": len(request["questions"])}), flush=True)
        began = time.monotonic()
        try:
            reply = broker(args.broker_socket, "POST", "/v1/systemone", request)
        except (OSError, http.client.HTTPException, json.JSONDecodeError) as error:
            # It is unknown whether the upstream provider consumed a request.
            # Save this attempted transport and stop without automatic retry.
            reply = {"status": 0, "body": {"error": {"type": type(error).__name__, "message": str(error)}},
                     "elapsed_seconds": time.monotonic() - began, "budget": None}
        status = reply["status"]
        body = reply["body"]
        # Save provider evidence BEFORE grading, including any malformed body.
        save(directory / "response.json", body)
        save(directory / "broker-receipt.json", reply)
        checked = grade(request, body) if status == 200 else {"schema_valid": None, "primary_correct": None, "outcome": "request_failure"}
        meta = {**entry, "completed_utc": now(), "http_status": status, "elapsed_seconds": reply["elapsed_seconds"],
                "request_sha256": sha(encoded(request)), "response_sha256": sha(encoded(body)),
                "source_semantics_sha256": fixture["source_semantics_sha256"], "returned_model": body.get("model") if isinstance(body, dict) else None,
                "usage": body.get("usage") if isinstance(body, dict) else None, "budget": reply.get("budget")}
        save(directory / "grade.json", checked)
        save(directory / "metadata.json", meta)
        completed += 1
        print(json.dumps({"event": "request_complete", "call_id": entry["call_id"], "status": status,
                          "outcome": checked["outcome"], "seconds": reply["elapsed_seconds"], "usage": meta["usage"], "budget": meta["budget"]}), flush=True)
        audit(args)
        if status != 200 or not checked["schema_valid"]:
            print(json.dumps({"event": "stopped", "reason": "Provider/transport/schema failure; no automatic retry", "call_id": entry["call_id"]}), flush=True)
            break
        if meta["returned_model"] != MODEL:
            print(json.dumps({"event": "stopped", "reason": "Unexpected returned model; review receipt", "returned_model": meta["returned_model"]}), flush=True)
            break
    audit(args)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    commands = parser.add_subparsers(dest="command", required=True)
    prep = commands.add_parser("prepare")
    prep.add_argument("--evidence", default=str(SITE / "public/evidence"))
    prep.add_argument("--output", default=str(HERE / "input"))
    prep.add_argument("--full", action="store_true")
    execute = commands.add_parser("run")
    execute.add_argument("--input", default="/input")
    execute.add_argument("--output", default="/output")
    execute.add_argument("--broker-socket", default="/ipc/subq.sock")
    execute.add_argument("--limit", type=int, default=1, help="Maximum NEW calls; existing completed receipts are skipped")
    execute.add_argument("--max-questions", type=int, default=16, help="Observed provider limit; oversized exact requests are retained as local compatibility skips")
    check = commands.add_parser("audit")
    check.add_argument("--output", default="/output")
    args = parser.parse_args()
    {"prepare": prepare, "run": run, "audit": audit}[args.command](args)


if __name__ == "__main__":
    main()
