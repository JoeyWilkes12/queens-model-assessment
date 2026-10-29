"""Derive offline receipt pairs without altering the frozen study or raw calls.

JSON hashes use the receipts' convention: Python json.dumps(value,
sort_keys=True), encoded as UTF-8. Plan and system hashes cover exact file bytes.
"""
from __future__ import annotations

import argparse
import base64
import binascii
from collections import Counter
import hashlib
import json
from pathlib import Path
import re


DEFAULT_EVIDENCE_DIR = Path(__file__).resolve().parents[2] / "public/evidence/ollama"
ARMS = ("baseline", "caveman")
RECEIPT_FILES = ("request.json", "response.json", "metadata.json", "grade.json", "diagnostic.json", "started.json")


def canonical_json(value):
    """Encode JSON identically to the historical receipt hash calculation."""
    return json.dumps(value, sort_keys=True).encode("utf-8")


def sha256(value):
    """Return the SHA-256 hex digest for exact bytes."""
    return hashlib.sha256(value).hexdigest()


def read_json(path):
    """Read a required JSON artifact, retaining a useful failure location."""
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (OSError, ValueError) as error:
        raise ValueError(f"Missing or invalid JSON artifact: {path.name}") from error


def require(condition, message):
    """Reject incomplete evidence instead of publishing an unsupported pairing."""
    if not condition:
        raise ValueError(message)


def same_json(left, right):
    """Compare JSON exactly, including boolean versus numeric distinctions."""
    return canonical_json(left) == canonical_json(right)


def expected_configuration(plan):
    """Rebuild requested controls from the frozen plan, retaining legacy defaults."""
    protocol = plan["protocol"]
    require(protocol["modality"] == "image" and protocol["one_shot"] is True
            and protocol["tools"] is False and protocol["retries"] == 0
            and protocol["structured_output_enforcement"] is False,
            "Frozen protocol is not the supported one-shot image comparison")
    return {
        "model": plan["runtime"]["model"],
        "stream": False,
        "think": protocol["think"],
        "options": {key: protocol[key] for key in ("num_predict", "temperature", "seed", "num_ctx")},
        # The original pilot omitted this field in its plan, but saved it in every request.
        "keep_alive": protocol.get("keep_alive", "10m"),
    }


def build_manifest(evidence_dir):
    """Validate all 24 saved calls and deterministically derive their shared links."""
    root = Path(evidence_dir)
    plan_path = root / "plan.json"
    plan = read_json(plan_path)
    boards = plan["boards"]
    require(len(boards) == 12 and Counter(board["size"] for board in boards) == {5: 4, 7: 4, 9: 4},
            "Comparison requires the complete twelve-board pilot")
    board_ids = [board["id"] for board in boards]
    require(len(set(board_ids)) == 12 and all(re.fullmatch(r"[A-Za-z0-9_-]+", key) for key in board_ids),
            "Duplicate or invalid frozen board IDs")
    runtime = plan["runtime"]
    require(isinstance(runtime["model"], str) and runtime["model"]
            and re.fullmatch(r"[0-9a-f]{64}", runtime["digest"]), "Invalid frozen model identity")
    expected = expected_configuration(plan)
    configuration_hash = sha256(canonical_json(expected))
    template_bytes = (root / "prompt-template.txt").read_bytes()
    require(sha256(template_bytes) == plan["prompt_template_sha256"], "Frozen prompt template hash mismatch")
    template = template_bytes.decode("utf-8")
    system_bytes = (root / "caveman-system.txt").read_bytes()
    system_hash = sha256(system_bytes)
    require(system_hash == read_json(root / "skill.json")["system_sha256"], "Reviewed Caveman system hash mismatch")
    system = system_bytes.decode("utf-8")
    expected_calls = {f"{arm}_{board_id}" for board_id in board_ids for arm in ARMS}
    receipts_dir = root / "receipts"
    actual_calls = {path.name for path in receipts_dir.iterdir() if path.is_dir()}
    require(actual_calls == expected_calls, "Incomplete or extra receipt directories: expected exactly 24 calls")
    pairs = []
    for board in boards:
        board_id = board["id"]
        require(board["image"] == f"images/{board_id}.png", f"Unexpected image path: {board_id}")
        image_bytes = (root / board["image"]).read_bytes()
        require(sha256(image_bytes) == board["image_sha256"], f"Frozen image hash mismatch: {board_id}")
        user_message = {
            "role": "user",
            "content": template.replace("{{BOARD_ID}}", board_id).replace("{{SIZE}}", str(board["size"])),
            "images": [base64.b64encode(image_bytes).decode("ascii")],
        }
        pair = {
            "board_id": board_id,
            "size": board["size"],
            "image": board["image"],
            "image_sha256": board["image_sha256"],
            "user_message_sha256": sha256(canonical_json(user_message)),
            "configuration_sha256": configuration_hash,
            "checks": {
                "same_user_message": True,
                "same_requested_configuration": True,
                "same_model_digest": True,
                "caveman_system_only_difference": True,
            },
        }
        for arm in ARMS:
            call_id = f"{arm}_{board_id}"
            directory = receipts_dir / call_id
            require(all((directory / name).is_file() for name in RECEIPT_FILES), f"Incomplete receipt: {call_id}")
            request = read_json(directory / "request.json")
            response = read_json(directory / "response.json")
            metadata = read_json(directory / "metadata.json")
            configuration = {key: value for key, value in request.items() if key != "messages"}
            require(same_json(configuration, expected), f"Requested configuration differs from frozen plan: {call_id}")
            messages = [user_message] if arm == "baseline" else [{"role": "system", "content": system}, user_message]
            require(same_json(request.get("messages"), messages), f"User/system messages differ from frozen inputs: {call_id}")
            try:
                decoded = base64.b64decode(request["messages"][-1]["images"][0], validate=True)
            except (ValueError, binascii.Error) as error:
                raise ValueError(f"Invalid request image encoding: {call_id}") from error
            require(sha256(decoded) == board["image_sha256"], f"Request image hash mismatch: {call_id}")
            for key, value in {"call_id": call_id, "board_id": board_id, "size": board["size"], "treatment": arm,
                               "model": runtime["model"], "model_digest": runtime["digest"],
                               "returned_model": runtime["model"], "image_sha256": board["image_sha256"]}.items():
                require(same_json(metadata.get(key), value), f"Receipt identity mismatch ({key}): {call_id}")
            require(response.get("model") == runtime["model"] and response.get("done") is True
                    and metadata.get("done") is True and metadata.get("http_status") == 200,
                    f"Receipt is not a completed response from the frozen model: {call_id}")
            request_hash = sha256(canonical_json(request))
            response_hash = sha256(canonical_json(response))
            require(metadata.get("request_sha256") == request_hash, f"Request hash mismatch: {call_id}")
            require(metadata.get("response_sha256") == response_hash, f"Response hash mismatch: {call_id}")
            pair[arm] = {"call_id": call_id, "request_sha256": request_hash, "response_sha256": response_hash}
        pairs.append(pair)
    return {
        "schema_version": 1,
        "study": plan["study"],
        "model": {"tag": runtime["model"], "digest": runtime["digest"]},
        "configuration": expected,
        "configuration_sha256": configuration_hash,
        "plan_sha256": sha256(plan_path.read_bytes()),
        "system_sha256": system_hash,
        "pairs": pairs,
    }


def main(argv=None):
    """Generate the derived manifest, or verify it without any writes or inference."""
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--evidence-dir", type=Path, default=DEFAULT_EVIDENCE_DIR)
    parser.add_argument("--verify", action="store_true", help="Compare the saved manifest without writing files")
    args = parser.parse_args(argv)
    try:
        manifest = build_manifest(args.evidence_dir)
        destination = args.evidence_dir / "comparisons.json"
        if args.verify:
            require(same_json(read_json(destination), manifest), "Comparison manifest is stale or has been modified")
        else:
            destination.write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    except (KeyError, OSError, ValueError, TypeError) as error:
        parser.exit(1, f"Comparison validation failed: {error}\n")
    print(f"{'Verified' if args.verify else 'Generated'} {len(manifest['pairs'])} receipt pairs from 24 saved calls (offline).")


if __name__ == "__main__":
    main()
