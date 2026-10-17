"""Scrub provider data that the evidence contract keeps out of public/evidence.

Mirrors PRIVATE_KEY and sanitize() in scripts/generate-evidence.mjs: any key named
like reasoning_details, encrypted_reasoning, api_key, authorization, tokens,
secrets, passwords, credentials or user_id is dropped at every depth. Anthropic
Messages `thinking` / `redacted_thinking` content blocks (reasoning text plus a
signature) are dropped too. Local raw receipts under output/ are never changed;
a published copy's metadata `response_sha256` still refers to the raw local body.

    python3 scripts/analysis/public_scrub.py check   # fail if anything survives
    python3 scripts/analysis/public_scrub.py clean   # scrub public/evidence in place
"""
import json
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parents[2]
PUBLIC = ROOT / "public/evidence"
PRIVATE_KEY = re.compile(r"^(?:reasoning_details|encrypted_reasoning|api[_-]?key|authorization|proxy[_-]?authorization|access[_-]?token"
                         r"|refresh[_-]?token|client[_-]?secret|password|credential(?:s)?|user[_-]?id)$", re.I)
THINKING_BLOCKS = ("thinking", "redacted_thinking")


def scrub(value):
    if isinstance(value, list):
        return [scrub(v) for v in value if not (isinstance(v, dict) and v.get("type") in THINKING_BLOCKS)]
    if isinstance(value, dict):
        return {k: scrub(v) for k, v in value.items() if not PRIVATE_KEY.match(k)}
    return value


def problems(value, where=""):
    found = []
    if isinstance(value, list):
        for i, v in enumerate(value):
            if isinstance(v, dict) and v.get("type") in THINKING_BLOCKS:
                found.append(f"{where}[{i}] ({v['type']} block)")
            found += problems(v, f"{where}[{i}]")
    elif isinstance(value, dict):
        for k, v in value.items():
            if PRIVATE_KEY.match(k):
                found.append(f"{where}.{k}")
            found += problems(v, f"{where}.{k}")
    return found


def save_public(path, value):
    """Scrub, check and write one public JSON document."""
    clean = scrub(value)
    left = problems(clean)
    if left:
        raise SystemExit(f"sensitive key survived at {path}: {left[:3]}")
    path = pathlib.Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(clean, ensure_ascii=False, indent=2) + "\n")


def main():
    mode = sys.argv[1] if len(sys.argv) > 1 else "check"
    dirty = []
    for path in sorted(PUBLIC.rglob("*.json")):
        text = path.read_text()
        if not any(word in text for word in ("reasoning_details", "encrypted_reasoning", "user_id", "userId", "api_key", "apiKey",
                                             "authorization", "Authorization", "token", "secret", "password", "credential", "thinking")):
            continue
        value = json.loads(text)
        found = problems(value)
        if found:
            dirty.append((path, found))
            if mode == "clean":
                path.write_text(json.dumps(scrub(value), ensure_ascii=False, indent=2) + "\n")
    for path, found in dirty[:20]:
        print(f"{path.relative_to(ROOT)}: {len(found)} ({found[0]})")
    print(json.dumps({"mode": mode, "files_with_private_fields": len(dirty)}))
    if dirty and mode == "check":
        raise SystemExit(1)


if __name__ == "__main__":
    main()
