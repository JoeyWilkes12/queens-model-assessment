"""Import immutable, offline Local Qwen snapshots; never calls an inference service.

Only the documented evidence allowlist is copied. A live source is read twice and
must remain byte-identical throughout capture. Use a new snapshot ID for new data.
"""
from __future__ import annotations

import argparse
import base64
import hashlib
import importlib.util
import json
import math
import os
from pathlib import Path
import re
import shutil
import subprocess
import tempfile
from datetime import datetime, timezone

ROOT = Path(__file__).resolve().parents[2]
DEFAULT_OUT = ROOT / "public/evidence/local-qwen"
ARMS = ("baseline", "caveman")
TOP_FILES = ("plan.json", "summary.json", "prompt-template.txt", "caveman-system.txt",
             "skill.json", "arm-schema.txt", "arm-neutral.txt", "caveman-review.json", "caveman-LICENSE", "caveman-LICENSE-MIT", "caveman-NOTICE")
CALL_FILES = ("request.json", "response.json", "metadata.json", "grade.json", "diagnostic.json")
STUDY_NAME = re.compile(r"qwen3[.]5-(?:9b-nvfp4|27b-q4_K_M)-np24576(?:-qwen-sampling-r[1-9][0-9]*)?$|qwen3[.]5-(?:4b|9b-nvfp4)-np32768-loopstop(?:-audit)?$")
FRESH_NAMES = {"gemma4-e4b-fresh1-4arm-np32768", "llava-llama3-8b-fresh1-4arm-np4096", "qwen3.5-4b-fresh1-4arm-np32768", "qwen3.5-9b-nvfp4-fresh1-4arm-np32768"}
PRIMARY_NAMES = {"qwen3.5-9b-nvfp4", "qwen3.5-27b-q4_K_M"}
HOST_KEYS = ("samples", "max_pressure_level", "swap_used_gib_start", "swap_used_gib_max", "swap_used_gib_end",
             "min_free_plus_inactive_gib", "max_compressor_gib", "max_model_size_gib", "max_model_vram_gib")
SPEC = importlib.util.spec_from_file_location("local_qwen_grader", ROOT / "scripts/llm_panel/grading.py")
grading = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(grading)


def require(condition, message):
    """Reject a snapshot whose evidence does not support its displayed claims."""
    if not condition:
        raise ValueError(message)


def sha(value):
    """Hash exact file bytes."""
    return hashlib.sha256(value).hexdigest()


def canonical(value):
    """Use the historical receipt convention, including its default separators."""
    return json.dumps(value, sort_keys=True).encode("utf-8")


def read(path):
    """Read a required JSON artifact without executing any supplied content."""
    return json.loads(Path(path).read_text(encoding="utf-8"))


def save(path, value):
    """Write reproducible public JSON with readable indentation."""
    Path(path).parent.mkdir(parents=True, exist_ok=True)
    Path(path).write_text(json.dumps(value, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def number(value, name, integer=False):
    """Keep absent measurements null and reject negative, boolean or nonfinite values."""
    require(value is None or (type(value) in (int, float) and math.isfinite(value) and value >= 0
                             and (not integer or type(value) is int)), "Invalid measurement: " + name)
    return value


def safe_relative(value):
    """Reject traversals, absolute paths and symlink-derived evidence paths."""
    path = Path(value)
    require(not path.is_absolute() and str(path) == value and all(p not in (".", "..") for p in path.parts),
            "Unsafe evidence path")
    return path


def format_only_correct(board, text):
    """Recognize a unique rule-valid object or bare array without repairing its values.

    Multiple candidate answers, duplicate object keys, a wrong board identity and
    ambiguous arrays are rejected. This diagnostic never replaces the strict grade.
    """
    if not isinstance(text, str) or grading.grade(board, text)["correct"]:
        return False
    decoder = json.JSONDecoder()
    objects = []
    arrays = []
    offset = 0
    while offset < len(text):
        starts = [n for n in (text.find("{", offset), text.find("[", offset)) if n >= 0]
        if not starts:
            break
        start = min(starts)
        try:
            obj, end = decoder.raw_decode(text[start:])
        except ValueError:
            offset = start + 1
            continue
        raw = text[start:start + end]
        if isinstance(obj, dict) and ("board_id" in obj or "columns_by_row" in obj):
            objects.append(raw)
        elif isinstance(obj, list) and len(obj) == board["size"]:
            arrays.append(obj)
        offset = start + end
    if objects:
        return len(objects) == 1 and not arrays and grading.grade(board, objects[0])["correct"]
    if len(arrays) != 1:
        return False
    return grading.grade(board, json.dumps({"board_id": board["id"], "columns_by_row": arrays[0]}))["correct"]


def configuration(plan):
    """Rebuild every supported requested generation control from the frozen plan."""
    protocol = plan["protocol"]
    require(protocol["modality"] == "image" and protocol["one_shot"] is True
            and protocol["tools"] is False and protocol["retries"] == 0
            and protocol["structured_output_enforcement"] is False, "Unsupported study protocol")
    options = {key: protocol[key] for key in ("num_predict", "temperature", "seed", "num_ctx")}
    options.update(protocol.get("extra_options", {}))
    return {"model": plan["runtime"]["model"], "think": protocol["think"],
            "stream": protocol.get("transport") == "stream", "options": options,
            "keep_alive": protocol.get("keep_alive", "10m")}


def validate_call(directory, board, arm, plan, user, system):
    """Regrade a one-shot receipt and validate its immutable request/response chain."""
    require(all((directory / name).is_file() for name in CALL_FILES), "Incomplete receipt: " + directory.name)
    request, response, meta = (read(directory / name) for name in CALL_FILES[:3])
    expected = configuration(plan)
    require(canonical({k: v for k, v in request.items() if k != "messages"}) == canonical(expected),
            "Request configuration differs from frozen plan: " + directory.name)
    messages = [user] if system is None else [{"role": "system", "content": system}, user]
    require(canonical(request.get("messages")) == canonical(messages), "Frozen prompt/image mismatch: " + directory.name)
    for key, expected_value in {"call_id": directory.name, "board_id": board["id"], "size": board["size"],
                                "treatment": arm, "model": plan["runtime"]["model"],
                                "model_digest": plan["runtime"]["digest"], "image_sha256": board["image_sha256"],
                                "returned_model": plan["runtime"]["model"]}.items():
        require(canonical(meta.get(key)) == canonical(expected_value), "Receipt identity mismatch: " + key)
    require(meta.get("http_status") == 200 and response.get("model") == plan["runtime"]["model"],
            "Unsupported failed/foreign response")
    require(meta["request_sha256"] == sha(canonical(request)), "Request hash mismatch")
    require(meta["response_sha256"] == sha(canonical(response)), "Response hash mismatch")
    if plan.get("arms"):
        require(meta.get("loop_stop", {}).get("shadow") is True and meta["loop_stop"].get("enabled") is False,
                "Shadow detector metadata mismatch")
    stopped = meta.get("outcome") == "loop_stopped"
    if stopped:
        require(plan["protocol"].get("loop_stop") and not plan["protocol"]["loop_stop"].get("shadow") and response.get("done") is False
                and response.get("client_stop", {}).get("reason") == "loop_stop"
                and meta.get("loop_stop", {}).get("triggered") is True, "Invalid client loop stop")
    else:
        require(response.get("done") is True and meta.get("done") is True
                and meta.get("finish_reason") == response.get("done_reason"), "Incomplete model response")
    content = (response.get("message") or {}).get("content", "")
    grade = grading.grade(board, content)
    require(canonical(read(directory / "grade.json")) == canonical(grade), "Saved strict grade mismatch")
    diagnostic = grading.diagnose(board, content)
    require(canonical(read(directory / "diagnostic.json")) == canonical(diagnostic), "Saved extraction diagnostic mismatch")
    require(meta["strict_correct"] is grade["correct"], "Metadata strict grade mismatch")
    require(meta["rule_valid_after_extraction"] is diagnostic["rule_valid_after_extraction"], "Metadata diagnostic mismatch")
    for key, response_key in (("input_tokens", "prompt_eval_count"), ("output_tokens", "eval_count")):
        number(meta.get(key), key, True)
        require(meta.get(key) == response.get(response_key), "Usage differs from raw response: " + key)
    number(meta.get("elapsed_seconds"), "elapsed_seconds")
    return {"strict_correct": grade["correct"], "format_only_correct": format_only_correct(board, content),
            "truncated": not stopped and response.get("done_reason") == "length", "loop_stopped": stopped,
            "input_tokens": meta.get("input_tokens"), "output_tokens": meta.get("output_tokens"),
            "elapsed_seconds": meta.get("elapsed_seconds"), "finish_reason": meta.get("finish_reason"),
            "loop_stop": {key: meta["loop_stop"].get(key) for key in
                          ("enabled", "triggered", "checks", "max_metric", "fired_at_thinking_chars", "stream_chunks", * (("shadow", "would_have_stopped") if plan.get("arms") else ()))}
                         if meta.get("loop_stop") else None}


def validate_rescue(directory, source, board, arm, plan):
    """Validate a separate follow-up including the full replay input usage."""
    require(all((directory / name).is_file() for name in CALL_FILES), "Incomplete rescue")
    request, response, meta = (read(directory / name) for name in CALL_FILES[:3])
    source_meta, source_request, source_response = (read(source / name) for name in ("metadata.json", "request.json", "response.json"))
    require(meta.get("source_response_sha256") == source_meta["response_sha256"], "Rescue source hash mismatch")
    require(meta.get("kind") == "forced_answer_rescue" and source_meta["outcome"] in ("truncated", "loop_stopped"),
            "Rescue is not tied to a stopped source")
    for key, value in {"call_id": source.name, "board_id": board["id"], "size": board["size"],
                       "treatment": arm, "model": plan["runtime"]["model"]}.items():
        require(meta.get(key) == value, "Rescue identity mismatch: " + key)
    require(request.get("model") == plan["runtime"]["model"] and response.get("model") == request["model"]
            and meta["http_status"] == 200 and response.get("done") is True, "Invalid rescue response")
    require(request.get("messages", [])[:-1] == source_request["messages"], "Rescue changed source prompt")
    assistant = request["messages"][-1]
    expected_prefix = json.dumps({"board_id": board["id"], "columns_by_row": []}, separators=(",", ":"))[:-2]
    require(assistant.get("role") == "assistant" and assistant.get("content") == meta["answer_prefix"] == expected_prefix,
            "Invalid rescue answer prefix")
    require(assistant.get("thinking") == source_response["message"].get("thinking", "") + meta["early_stop_text"],
            "Rescue changed replayed thinking")
    expected_options = {"num_ctx": plan["protocol"]["num_ctx"], "seed": plan["protocol"]["seed"],
                        "temperature": 0, "num_predict": 256}
    require(canonical(request.get("options")) == canonical(expected_options), "Unexpected rescue controls")
    require(request.get("stream") is False and request.get("think") is True
            and request.get("keep_alive") == 0, "Unexpected rescue transport")
    text = meta["answer_prefix"] + (response.get("message") or {}).get("content", "")
    require(text == meta["answer_text"], "Rescue answer reconstruction mismatch")
    grade = grading.grade(board, text)
    require(canonical(read(directory / "grade.json")) == canonical(grade) and meta["strict_correct"] is grade["correct"],
            "Rescue strict grade mismatch")
    require(canonical(read(directory / "diagnostic.json")) == canonical(grading.diagnose(board, text)),
            "Rescue diagnostic mismatch")
    for key, response_key in (("input_tokens", "prompt_eval_count"), ("output_tokens", "eval_count")):
        number(meta.get(key), key, True)
        require(meta.get(key) == response.get(response_key), "Rescue usage differs from raw response")
    return {"strict_correct": grade["correct"], "input_tokens": meta.get("input_tokens"),
            "output_tokens": meta.get("output_tokens"), "elapsed_seconds": number(meta.get("elapsed_seconds"), "rescue elapsed"),
            "outcome": meta["outcome"]}


def derive_study(directory, relative_root, study_id, extended=False, coverage=False):
    """Build a checked UI contract from saved artifacts, supporting partial studies."""
    plan, summary = read(directory / "plan.json"), read(directory / "summary.json")
    require(summary["study"] == plan["study"] and canonical(summary["protocol"]) == canonical(plan["protocol"])
            and canonical(summary["runtime"]) == canonical(plan["runtime"]), "Summary/plan study mismatch")
    require(re.fullmatch(r"[a-f0-9]{64}", plan["runtime"]["digest"]) is not None, "Invalid model digest")
    boards = {b["id"]: b for b in plan["boards"]}
    require(len(boards) == len(plan["boards"]) and all(re.fullmatch(r"[A-Za-z0-9_-]+", key) for key in boards), "Invalid board identities")
    template = (directory / "prompt-template.txt").read_bytes()
    system = (directory / "caveman-system.txt").read_bytes()
    require(sha(template) == plan["prompt_template_sha256"], "Template hash mismatch")
    require(sha(system) == read(directory / "skill.json")["system_sha256"], "Skill body hash mismatch")
    arms = plan.get("arm_names", list(ARMS))
    systems = {"baseline": None, "caveman": system.decode()}
    if plan.get("arms"):
        require(arms == ["baseline", "schema", "neutral", "caveman"] and set(plan["arms"]) == set(arms), "Unsupported arm design")
        require(study_id in FRESH_NAMES and plan["board_set"]["name"] == "fresh1", "Unsupported fresh condition")
        for arm, info in plan["arms"].items():
            if arm == "baseline":
                require(info == {"system_file": None, "system_sha256": None, "system_chars": 0, "system_words": 0}, "Invalid baseline arm")
                continue
            name = "caveman-system.txt" if arm == "caveman" else "arm-" + arm + ".txt"
            require(info["system_file"] == name, "Unexpected arm system path")
            body = (directory / name).read_bytes()
            require(sha(body) == info["system_sha256"], "Arm system hash mismatch")
            systems[arm] = body.decode()
            require(len(systems[arm]) == info["system_chars"] and len(systems[arm].split()) == info["system_words"], "Arm system size mismatch")
        require(plan["protocol"].get("loop_stop", {}).get("shadow") is True and plan["protocol"].get("rescue") is False, "Fresh study must use shadow and no rescues")
    audit_of = plan.get("audit_of")
    selected = plan.get("audit_calls") if audit_of else None
    if audit_of:
        require(study_id == audit_of + "-audit", "Invalid audit source identity")
        require(isinstance(selected, list) and len(selected) == len(set(selected)) and selected,
                "Invalid audit selection")
    rows = []
    expected_ids = {f"{arm}_{board_id}" for board_id in boards for arm in arms}
    actual_ids = [r["call_id"] for r in summary["rows"]]
    require(len(actual_ids) == len(expected_ids) and set(actual_ids) == expected_ids, "Missing/duplicate planned rows")
    for saved in summary["rows"]:
        if selected is not None and saved["call_id"] not in selected:
            require(saved["state"] == "not_run" and not (directory / "receipts" / saved["call_id"]).exists(),
                    "Excluded audit call is not unrun")
            continue
        board, arm = boards[saved["board_id"]], saved["treatment"]
        require(arm in arms and saved["call_id"] == f"{arm}_{board['id']}" and saved["size"] == board["size"], "Invalid row identity")
        image_name = f"images/{board['id']}.png"
        require(board["image"] == image_name and saved["image"] == image_name, "Unexpected board image")
        image_bytes = (directory / image_name).read_bytes()
        require(sha(image_bytes) == board["image_sha256"], "Frozen image hash mismatch")
        user = {"role": "user", "content": template.decode().replace("{{BOARD_ID}}", board["id"]).replace("{{SIZE}}", str(board["size"])),
                "images": [base64.b64encode(image_bytes).decode("ascii")]}
        row = {"call_id": saved["call_id"], "board_id": board["id"], "size": board["size"], "treatment": arm,
               "state": "recorded" if saved["state"] == "recorded" else "pending",
               "strict_correct": False, "format_only_correct": False, "truncated": False, "loop_stopped": False,
               "input_tokens": None, "output_tokens": None, "elapsed_seconds": None, "finish_reason": None,
               "receipt": None, "image": relative_root + "/" + image_name, "peer_call_id": f"{'caveman' if arm == 'baseline' else 'baseline'}_{board['id']}",
               "pair_verified": False, "rescue": None, "host": None, "loop_stop": None}
        if row["state"] == "recorded":
            receipt = directory / "receipts" / row["call_id"]
            row.update(validate_call(receipt, board, arm, plan, user, systems[arm]))
            for key in ("strict_correct", "input_tokens", "output_tokens", "elapsed_seconds"):
                require(canonical(saved.get(key)) == canonical(row[key]), "Summary/receipt mismatch: " + key)
            require(saved["outcome"] == read(receipt / "metadata.json")["outcome"], "Summary outcome mismatch")
            row["receipt"] = relative_root + "/receipts/" + row["call_id"]
            host_path = receipt / "host-summary.json"
            if host_path.exists():
                row["host"] = read(host_path)
            rescue = directory / "rescue" / row["call_id"]
            if rescue.exists():
                row["rescue"] = {**validate_rescue(rescue, receipt, board, arm, plan),
                                 "receipt": relative_root + "/rescue/" + row["call_id"]}
        else:
            require(not (directory / "receipts" / row["call_id"] / "metadata.json").exists(), "Pending row has a completed receipt")
        if coverage:
            row["peer_call_ids"] = [f"{other}_{board['id']}" for other in arms if other != arm]
            if arm not in ARMS:
                row["peer_call_id"] = None
        if extended:
            row["audit"] = None
        rows.append(row)
    require(selected is None or set(selected) == {row["call_id"] for row in rows}, "Audit selection outside panel")
    row_map = {row["call_id"]: row for row in rows}
    for row in rows:
        if coverage:
            row["peer_call_ids"] = [call_id for call_id in row["peer_call_ids"] if call_id in row_map]
        row["pair_verified"] = row["state"] == "recorded" and row_map.get(row["peer_call_id"], {}).get("state") == "recorded"
    protocol = plan["protocol"]
    sampling = re.search(r"qwen-sampling-r([0-9]+)$", study_id)
    loopstop = bool(protocol.get("loop_stop")) and not (coverage and protocol["loop_stop"].get("shadow"))
    decoding = "loop-audit" if audit_of else "sampling" if sampling else "greedy+ls" if loopstop else "greedy"
    recorded = sum(row["state"] == "recorded" for row in rows)
    model_short = plan["runtime"]["model"].split(":")[-1].split("-")[0].upper()
    label = f"Qwen3.5 {model_short} · {protocol['num_predict']:,} · " + ("loop-stop audit" if audit_of else f"sampling r{sampling.group(1)}" if sampling else "greedy + loop-stop" if loopstop else "greedy")
    if coverage and plan.get("arms"):
        label = f"{plan['runtime']['model']} · fresh1 · four arms · {protocol['num_predict']:,} · greedy · shadow detector"
    runtime = {key: plan["runtime"].get(key) for key in ("model", "digest", "server_version", "details", "os", "machine_architecture")}
    return {**({"arms": plan.get("arms", {arm: {"system_file": "caveman-system.txt" if arm == "caveman" else None, "system_sha256": sha(system) if arm == "caveman" else None, "system_chars": len(system.decode()) if arm == "caveman" else 0, "system_words": len(system.decode().split()) if arm == "caveman" else 0} for arm in ARMS}), "board_set": "fresh1" if plan.get("arms") else "legacy", "loop_mode": "shadow" if protocol.get("loop_stop", {}).get("shadow") else "active" if loopstop else "off"} if coverage else {}), **({"kind": "audit" if audit_of else "assessment", "audit_of": audit_of} if extended else {}), "id": study_id, "label": label, "model": plan["runtime"]["model"], "budget": protocol["num_predict"],
            "decoding": decoding, "round": int(sampling.group(1)) if sampling else 0,
            "status": "complete" if recorded == len(rows) else "partial", "planned": len(rows), "recorded": recorded,
            "root": relative_root, "plan": relative_root + "/plan.json", "summary": relative_root + "/summary.json",
            "runtime": runtime, "protocol": protocol, "rows": rows}


def source_files(directory):
    """Select the explicit artifact allowlist, never logs or live operational state."""
    result = [directory / name for name in TOP_FILES if (directory / name).is_file()]
    plan, summary = read(directory / "plan.json"), read(directory / "summary.json")
    result += [directory / safe_relative(board["image"]) for board in plan["boards"]]
    expected_calls = {row["call_id"] for row in summary["rows"]}
    completed_calls = {path.parent.name for path in (directory / "receipts").glob("*/metadata.json")}
    require(completed_calls <= expected_calls, "Unexpected completed receipt directory")
    for row in summary["rows"]:
        require(row["state"] in ("recorded", "not_run", "started_unrecorded"), "Unsupported source row state")
        if row["state"] != "recorded":
            require(row["call_id"] not in completed_calls, "Pending source row has a completed receipt")
            continue
        require(re.fullmatch(r"[A-Za-z0-9_-]+", row["call_id"]) is not None, "Invalid call ID")
        result += [directory / "receipts" / row["call_id"] / name for name in CALL_FILES]
        host = directory / "receipts" / row["call_id"] / "host.json"
        if host.exists():
            result.append(host)
        rescue = directory / "rescue" / row["call_id"]
        if rescue.exists():
            require(not plan.get("arms"), "Fresh study has an unsupported rescue")
            result += [rescue / name for name in CALL_FILES]
    require(all(path.is_file() and not path.is_symlink() and path.resolve().is_relative_to(directory.resolve()) for path in result), "Missing or symlinked source artifact")
    return result


def provenance(source):
    """Record public Git identity without publishing the local path or status names."""
    def git(*args):
        return subprocess.run(["git", "-C", str(source), *args], check=True, capture_output=True, text=True).stdout.strip()
    return {"source_commit": git("rev-parse", "HEAD"), "source_dirty": bool(git("status", "--porcelain"))}


def derive_catalog(base, manifest):
    """Reconstruct the entire displayed catalog from the immutable saved artifacts."""
    prefix = "snapshots/" + manifest["snapshot_id"]
    studies = [derive_study(base / item["directory"], prefix + "/" + item["directory"], item["id"], manifest["schema_version"] >= 2, manifest["schema_version"] >= 3)
               for item in manifest["study_roots"]]
    if manifest["schema_version"] >= 2:
        validate_audits(base, studies)
    if manifest["schema_version"] >= 3:
        fresh = [read(base / item["directory"] / "plan.json") for item in manifest["study_roots"]
                 if item["id"] in FRESH_NAMES]
        if fresh:
            require(all(plan["boards"] == fresh[0]["boards"] and plan["board_set"] == fresh[0]["board_set"] for plan in fresh),
                    "Fresh studies disagree on frozen boards")
    return {"schema_version": manifest["schema_version"], "snapshot_id": manifest["snapshot_id"], "captured_utc": manifest["captured_utc"],
            "source_commit": manifest["source_commit"], "source_dirty": manifest["source_dirty"],
            "grader_sha256": manifest["grader_sha256"], "manifest": prefix + "/manifest.json",
            "host_note": "Numeric telemetry summarizes the recorded sampling window; a window may include the previously loaded model. It is not a model-only memory measurement.",
            "studies": studies}


def validate_audits(base, studies):
    """Check selected reruns against the separately retained, unchanged source calls."""
    by_id = {study["id"]: study for study in studies}
    for audit in studies:
        if audit["kind"] != "audit":
            continue
        source = by_id.get(audit["audit_of"])
        require(source is not None and source["kind"] == "assessment", "Missing original audit study")
        audit_dir = base / "studies" / audit["id"]
        source_dir = base / "studies" / source["id"]
        plan, original = read(audit_dir / "plan.json"), read(source_dir / "plan.json")
        require(set(plan["audit_calls"]) == {r["call_id"] for r in source["rows"] if r["loop_stopped"]},
                "Audit calls differ from original loop-stopped set")
        require(plan["runtime"] == original["runtime"] and plan["boards"] == original["boards"],
                "Audit changed frozen model or boards")
        for name in ("prompt-template.txt", "caveman-system.txt", "skill.json"):
            require((audit_dir / name).read_bytes() == (source_dir / name).read_bytes(), "Audit changed frozen prompt")
        ignored = {"loop_stop", "transport", "changes_from_pilot"}
        require({k: v for k, v in plan["protocol"].items() if k not in ignored} ==
                {k: v for k, v in original["protocol"].items() if k not in ignored}, "Audit changed frozen controls")
        require(original["protocol"].get("loop_stop") and original["protocol"].get("transport") == "stream"
                and not plan["protocol"].get("loop_stop") and plan["protocol"].get("transport") == "nonstream",
                "Invalid audit transport change")
        for row in audit["rows"]:
            if row["state"] != "recorded":
                continue
            call_id = row["call_id"]
            receipt = audit_dir / "receipts" / call_id
            original_receipt = source_dir / "receipts" / call_id
            response = read(receipt / "response.json")
            original_response = read(original_receipt / "response.json")
            meta = read(receipt / "metadata.json")
            original_meta = read(original_receipt / "metadata.json")
            require(original_meta["response_sha256"] == sha(canonical(original_response)), "Audit original hash mismatch")
            if "source_response_sha256" in meta:
                require(meta["source_response_sha256"] == original_meta["response_sha256"], "Audit source hash mismatch")
            request, original_request = read(receipt / "request.json"), read(original_receipt / "request.json")
            require(original_request.get("stream") is True and request.get("stream") is False and
                    {k: v for k, v in request.items() if k != "stream"} ==
                    {k: v for k, v in original_request.items() if k != "stream"}, "Audit request differs beyond transport")
            thinking = original_response["message"].get("thinking", "")
            require(isinstance(thinking, str) and thinking, "Missing original thinking")
            prefix_match = response["message"].get("thinking", "").startswith(thinking)
            answered = bool(response["message"].get("content", ""))
            facts = meta.get("audit", {})
            require(facts.get("source_receipt") == "public/evidence/ollama-models/" + source["id"] + "/receipts/" + call_id,
                    "Audit source receipt mismatch")
            require(type(facts.get("source_stopped_at_thinking_chars")) is int and
                    facts["source_stopped_at_thinking_chars"] == original_meta["loop_stop"]["fired_at_thinking_chars"]
                    and 0 < facts["source_stopped_at_thinking_chars"] <= len(thinking), "Audit source thinking length mismatch")
            require(facts.get("identical_up_to_stop") is (response["message"].get("thinking", "")[:facts["source_stopped_at_thinking_chars"]] == thinking[:facts["source_stopped_at_thinking_chars"]]) and facts.get("answered_after_stop") is answered,
                    "Audit metadata differs from observed text")
            row["audit"] = {"source_call_id": call_id,
                            "source_receipt": source["root"] + "/receipts/" + call_id,
                            "prefix_match": prefix_match, "answered_after_stop": answered,
                            "source_thinking_chars": len(thinking)}


def verify_snapshot(output=DEFAULT_OUT):
    """Verify the current pointer, all saved hashes and all derived rows offline."""
    output = Path(output)
    catalog = read(output / "index.json")
    snapshot_id = catalog["snapshot_id"]
    require(re.fullmatch(r"[A-Za-z0-9_-]+", snapshot_id), "Unsafe snapshot ID")
    base = output / "snapshots" / snapshot_id
    manifest = read(base / "manifest.json")
    require(manifest["snapshot_id"] == snapshot_id and manifest["schema_version"] in (1, 2, 3), "Manifest identity mismatch")
    require(manifest["grader_sha256"] == sha((ROOT / "scripts/llm_panel/grading.py").read_bytes()), "Derived grader changed; review and import a new snapshot")
    for name, digest in manifest["files"].items():
        path = base / safe_relative(name)
        require(path.is_file() and not path.is_symlink() and sha(path.read_bytes()) == digest, "Snapshot file hash mismatch: " + name)
    actual = {path.relative_to(base).as_posix() for path in base.rglob("*") if path.is_file()}
    require(actual == set(manifest["files"]) | {"manifest.json"}, "Unexpected or missing snapshot files")
    derived = derive_catalog(base, manifest)
    require(canonical(catalog) == canonical(derived) == canonical(read(base / "catalog.json")), "Derived catalog is stale or altered")
    for retained in (output / "snapshots").iterdir():
        if retained.is_dir() and retained != base:
            verify_retained(retained)
    return catalog


def verify_retained(base):
    """Validate historical snapshots with their original contract, without rewriting."""
    manifest = read(base / "manifest.json")
    require(manifest["snapshot_id"] == base.name and manifest["schema_version"] in (1, 2, 3), "Retained identity mismatch")
    require(manifest["grader_sha256"] == sha((ROOT / "scripts/llm_panel/grading.py").read_bytes()), "Retained grader mismatch")
    for name, digest in manifest["files"].items():
        path = base / safe_relative(name)
        require(path.is_file() and not path.is_symlink() and sha(path.read_bytes()) == digest, "Retained snapshot hash mismatch")
    require({p.relative_to(base).as_posix() for p in base.rglob("*") if p.is_file()} ==
            set(manifest["files"]) | {"manifest.json"}, "Retained inventory mismatch")
    require(canonical(derive_catalog(base, manifest)) == canonical(read(base / "catalog.json")), "Retained catalog mismatch")


def discover_sources(source_root):
    """Discover only the supported primary conditions, including future sample rounds."""
    sources = [("qwen3.5-4b-pilot", source_root / "public/evidence/ollama")]
    models = source_root / "public/evidence/ollama-models"
    unknown = [path.name for path in sorted(models.iterdir()) if (path / "plan.json").is_file()
               and not (STUDY_NAME.fullmatch(path.name) or path.name in FRESH_NAMES | PRIMARY_NAMES)]
    require(not unknown, "Unsupported frozen study plans (review explicitly): " + ", ".join(unknown))
    planned = [path for path in sorted(models.iterdir()) if (path / "plan.json").is_file()]
    require(all((path / "summary.json").is_file() for path in planned), "Frozen study plan missing summary; capture cannot silently omit it")
    sources += [(path.name, path) for path in sorted(models.iterdir())
                if (STUDY_NAME.fullmatch(path.name) or path.name in FRESH_NAMES | PRIMARY_NAMES) and (path / "summary.json").exists()]
    return sources


def import_snapshot(source_root, snapshot_id, output=DEFAULT_OUT):
    """Capture a stable allowlisted source, then atomically publish its index pointer."""
    source_root, output = Path(source_root).resolve(), Path(output)
    require(re.fullmatch(r"[A-Za-z0-9_-]+", snapshot_id), "Unsafe snapshot ID")
    target = output / "snapshots" / snapshot_id
    require(not target.exists(), "Snapshot already exists; use a new ID")
    sources = discover_sources(source_root)
    require(len(sources) > 1, "No larger-model studies found")
    output.mkdir(parents=True, exist_ok=True)
    (output / "snapshots").mkdir(exist_ok=True)
    staging = Path(tempfile.mkdtemp(prefix=".capture-", dir=output))
    observed = {}
    inventories = {}
    try:
        manifest = {"schema_version": 3, "snapshot_id": snapshot_id, "captured_utc": datetime.now(timezone.utc).isoformat(),
                    **provenance(source_root), "grader_sha256": sha((ROOT / "scripts/llm_panel/grading.py").read_bytes()),
                    "study_roots": [], "files": {}}
        for study_id, source in sources:
            files = source_files(source)
            inventories[source] = set(files)
            destination = staging / "studies" / study_id
            manifest["study_roots"].append({"id": study_id, "directory": "studies/" + study_id})
            for file in files:
                data = file.read_bytes()
                observed[file] = sha(data)
                relative = file.relative_to(source)
                target_file = destination / relative
                if file.name == "host.json":
                    host = json.loads(data).get("window", {})
                    public_host = {key: number(host.get(key), key) for key in HOST_KEYS}
                    target_file = target_file.with_name("host-summary.json")
                    save(target_file, public_host)
                else:
                    target_file.parent.mkdir(parents=True, exist_ok=True)
                    target_file.write_bytes(data)
                manifest["files"][target_file.relative_to(staging).as_posix()] = sha(target_file.read_bytes())
        catalog = derive_catalog(staging, manifest)
        require(discover_sources(source_root) == sources, "Study inventory changed during capture")
        for source, files in inventories.items():
            require(set(source_files(source)) == files, "Source inventory changed during capture")
        require(all(file.is_file() and sha(file.read_bytes()) == digest for file, digest in observed.items()), "Source changed during capture")
        save(staging / "catalog.json", catalog)
        manifest["files"]["catalog.json"] = sha((staging / "catalog.json").read_bytes())
        save(staging / "manifest.json", manifest)
        staging.rename(target)
        pointer = output / ".index.tmp"
        save(pointer, catalog)
        os.replace(pointer, output / "index.json")
        verify_snapshot(output)
        return catalog
    finally:
        if staging.exists():
            shutil.rmtree(staging)


def main(argv=None):
    """Provide explicit import and offline verification modes."""
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source-root", type=Path)
    parser.add_argument("--snapshot-id")
    parser.add_argument("--output", type=Path, default=DEFAULT_OUT)
    parser.add_argument("--verify", action="store_true")
    args = parser.parse_args(argv)
    try:
        if args.verify:
            require(args.source_root is None and args.snapshot_id is None, "Verify uses only the saved snapshot")
            catalog = verify_snapshot(args.output)
        else:
            require(args.source_root is not None and args.snapshot_id is not None, "Import requires --source-root and --snapshot-id")
            catalog = import_snapshot(args.source_root, args.snapshot_id, args.output)
        print(json.dumps({"snapshot": catalog["snapshot_id"], "studies": len(catalog["studies"]),
                          "recorded": sum(study["recorded"] for study in catalog["studies"]), "offline": True}))
    except (OSError, ValueError, KeyError, TypeError, subprocess.CalledProcessError) as error:
        parser.exit(1, f"Local Qwen snapshot failed: {error}\n")


if __name__ == "__main__":
    main()
