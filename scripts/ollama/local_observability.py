"""Read-only numeric host snapshots and opt-in Grafana benchmark journal records.

No function contacts Ollama, reads prompts/logs, or chooses a real journal path.
"""
from __future__ import annotations

import fcntl
import json
import math
import os
import pathlib
import re
import stat
import subprocess
import time

USAGE_FIELDS = ("total_duration", "load_duration", "prompt_eval_count",
                "prompt_eval_duration", "eval_count", "eval_duration")
MAX_JOURNAL_BYTES = 64 * 1024 * 1024
MODEL_LABEL = re.compile(r"[A-Za-z0-9][A-Za-z0-9._:+\-]{0,79}\Z")
RUN_LABELS = {"baseline": "queens-baseline", "caveman": "queens-caveman"}
HOST_FIELDS = ("physical_memory_bytes", "pressure_level", "swap_total_bytes",
               "swap_used_bytes", "swap_free_bytes", "vm_page_size_bytes",
               "free_memory_bytes", "inactive_memory_bytes", "purgeable_memory_bytes",
               "wired_memory_bytes", "compressor_memory_bytes")


def _command(arguments):
    """Read one fixed local command, discarding stderr and all failure text."""
    try:
        result = subprocess.run(arguments, stdin=subprocess.DEVNULL, stdout=subprocess.PIPE,
                                stderr=subprocess.DEVNULL, text=True, timeout=2, check=False,
                                env={"PATH": "/usr/bin:/usr/sbin:/bin:/sbin", "LC_ALL": "C"})
        return result.stdout if result.returncode == 0 else None
    except (OSError, subprocess.TimeoutExpired, UnicodeError):
        return None


def _integer(text):
    """Parse a bounded unsigned scalar without retaining the original text."""
    if not isinstance(text, str) or not re.fullmatch(r"\s*\d+\s*", text):
        return None
    try:
        value = int(text)
    except ValueError:
        return None
    return value if 0 <= value < 2 ** 63 else None


def capture_host():
    """Capture system-wide numeric conditions; unknown metrics stay null, never zero."""
    result = dict.fromkeys(HOST_FIELDS)
    result["captured_at"] = time.time()
    result["physical_memory_bytes"] = _integer(_command(["/usr/sbin/sysctl", "-n", "hw.memsize"]))
    result["pressure_level"] = _integer(_command(["/usr/sbin/sysctl", "-n", "kern.memorystatus_vm_pressure_level"]))
    swap = _command(["/usr/sbin/sysctl", "-n", "vm.swapusage"])
    if isinstance(swap, str):
        for source, target in (("total", "swap_total_bytes"), ("used", "swap_used_bytes"), ("free", "swap_free_bytes")):
            match = re.search(r"\b" + source + r"\s*=\s*(\d+(?:\.\d+)?)\s*([KMGT]?)\b", swap)
            if match:
                value = float(match[1]) * 1024 ** " KMGT".index(match[2] or " ")
                if math.isfinite(value) and 0 <= value < 2 ** 63:
                    result[target] = int(value)
    vm = _command(["/usr/bin/vm_stat"])
    if isinstance(vm, str):
        page = re.search(r"page size of\s+(\d+)\s+bytes", vm)
        page_size = _integer(page[1]) if page else None
        if page_size:
            result["vm_page_size_bytes"] = page_size
            for label, field in (("Pages free", "free_memory_bytes"), ("Pages inactive", "inactive_memory_bytes"),
                                 ("Pages purgeable", "purgeable_memory_bytes"), ("Pages wired down", "wired_memory_bytes"),
                                 ("Pages occupied by compressor", "compressor_memory_bytes")):
                match = re.search(r"^" + re.escape(label) + r":\s*(\d+)\.\s*$", vm, re.MULTILINE)
                count = _integer(match[1]) if match else None
                if count is not None and count * page_size < 2 ** 63:
                    result[field] = count * page_size
    result["unavailable_fields"] = [field for field in HOST_FIELDS if result[field] is None]
    return result


def _number(value):
    """Accept finite nonnegative JSON numbers within the collector's bounds."""
    return (not isinstance(value, bool) and isinstance(value, (int, float))
            and 0 <= value < 1e12 and math.isfinite(value))


def _count(value):
    """Accept a nonnegative native usage integer, excluding booleans."""
    return type(value) is int and 0 <= value < 2 ** 63


def valid_usage(usage):
    """Validate only the native numeric usage allowlist without inventing missing zeroes."""
    if not isinstance(usage, dict) or set(usage) - set(USAGE_FIELDS) - {"prompt_eval_cached_count"}:
        return False
    if not all(_count(usage.get(key)) for key in USAGE_FIELDS):
        return False
    cached = usage.get("prompt_eval_cached_count")
    return ("prompt_eval_cached_count" not in usage or
            (_count(cached) and cached <= usage["prompt_eval_count"]))


def journal_event(request, response, status, treatment, started_at, ended_at, wall_seconds):
    """Project a native call onto bounded labels and numeric fields, never model text."""
    model = request.get("model")
    if not isinstance(model, str) or not MODEL_LABEL.fullmatch(model) or treatment not in RUN_LABELS:
        raise ValueError("invalid_journal_label")
    usage = {key: response[key] for key in (*USAGE_FIELDS, "prompt_eval_cached_count") if key in response}
    success = (status == 200 and response.get("done") is True and "error" not in response
               and response.get("model") == model and valid_usage(usage))
    event = {"schema_version": 1, "started_at": started_at, "ended_at": ended_at,
             "wall_seconds": wall_seconds, "model": model, "run": RUN_LABELS[treatment],
             "status": "success" if success else "error"}
    if success:
        event["usage"] = usage
    options = request.get("options", {})
    event["parameters"] = {key: options[key] for key in ("num_predict", "num_ctx", "temperature", "seed") if key in options}
    validate_event(event)
    return event


def validate_event(event):
    """Reject private/freeform fields and invalid numbers before any journal write."""
    required = {"schema_version", "started_at", "ended_at", "wall_seconds", "model", "run", "status", "parameters"}
    if (not isinstance(event, dict) or set(event) - required - {"usage"} or not required <= set(event)
            or type(event["schema_version"]) is not int or event["schema_version"] != 1):
        raise ValueError("invalid_journal_schema")
    if (not isinstance(event["model"], str) or not MODEL_LABEL.fullmatch(event["model"])
            or event["run"] not in RUN_LABELS.values() or event["status"] not in ("success", "error")):
        raise ValueError("invalid_journal_label")
    if (not all(_number(event[key]) for key in ("started_at", "ended_at", "wall_seconds"))
            or event["ended_at"] < event["started_at"]):
        raise ValueError("invalid_journal_time")
    parameters = event["parameters"]
    if not isinstance(parameters, dict) or set(parameters) - {"num_predict", "num_ctx", "temperature", "seed"}:
        raise ValueError("invalid_journal_parameters")
    if any(not _number(value) for value in parameters.values()):
        raise ValueError("invalid_journal_parameters")
    if event["status"] == "success" and not valid_usage(event.get("usage")):
        raise ValueError("invalid_journal_usage")
    if event["status"] == "error" and "usage" in event:
        raise ValueError("invalid_journal_usage")


def append_event(path, event):
    """Append one bounded schema1 record under an exclusive lock with mode0600."""
    validate_event(event)
    payload = (json.dumps(event, separators=(",", ":"), allow_nan=False) + "\n").encode()
    flags = (os.O_WRONLY | os.O_APPEND | os.O_CREAT | os.O_NONBLOCK
             | getattr(os, "O_NOFOLLOW", 0) | getattr(os, "O_CLOEXEC", 0))
    descriptor = os.open(pathlib.Path(path), flags, 0o600)
    try:
        current = os.fstat(descriptor)
        if not stat.S_ISREG(current.st_mode) or current.st_uid != os.getuid():
            raise OSError("journal_must_be_owned_regular_file")
        fcntl.flock(descriptor, fcntl.LOCK_EX | fcntl.LOCK_NB)
        current = os.fstat(descriptor)
        if current.st_size + len(payload) > MAX_JOURNAL_BYTES:
            raise OSError("journal_size_limit")
        os.fchmod(descriptor, 0o600)
        while payload:
            written = os.write(descriptor, payload)
            if written <= 0:
                raise OSError("journal_write_failed")
            payload = payload[written:]
        os.fsync(descriptor)
    finally:
        os.close(descriptor)


def record_journal(path, request, response, status, treatment, started_at, ended_at, wall_seconds):
    """Keep optional journal failures separate from already persisted model receipts."""
    try:
        event = journal_event(request, response, status, treatment, started_at, ended_at, wall_seconds)
        append_event(path, event)
        return {"enabled": True, "recorded": True, "status": "recorded"}
    except (ValueError, TypeError, OverflowError):
        return {"enabled": True, "recorded": False, "status": "invalid_numeric_record"}
    except OSError:
        return {"enabled": True, "recorded": False, "status": "journal_write_failed"}
