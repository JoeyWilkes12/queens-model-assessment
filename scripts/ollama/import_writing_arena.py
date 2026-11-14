#!/usr/bin/env python3
"""Copy the writing-arena rewrites from the benchmark checkout into the site, read-only at the source.

The arena runner (scripts/ollama/writing_arena.py in the benchmark checkout) asks each local model to
rewrite the same book pages once. This importer never contacts Ollama. It copies the frozen sources,
the prompt and each recorded rewrite, verifies their hashes against the runner's metadata, and writes
`public/evidence/writing-arena/index.json` for the `#/writing-arena` page.

Usage:
  python3 -B scripts/ollama/import_writing_arena.py --source-root /path/to/ollama-bigger-qwen
  python3 -B scripts/ollama/import_writing_arena.py --verify
"""
import argparse
import hashlib
import json
import pathlib
import re
from datetime import datetime, timezone

ROOT = pathlib.Path(__file__).resolve().parents[2]
OUT = ROOT / "public/evidence/writing-arena"
# Reader-facing names; the Ollama tag stays in the index for traceability.
MODELS = [
    ("qwen3.5:27b-q4_K_M", "Qwen3.5 27B", "Alibaba"),
    ("qwen3.5:9b-nvfp4", "Qwen3.5 9B", "Alibaba"),
    ("qwen3.5:4b", "Qwen3.5 4B", "Alibaba"),
    ("gpt-oss:20b", "gpt-oss 20B", "OpenAI"),
    ("gemma4:e4b", "Gemma 4 E4B", "Google DeepMind"),
    ("llava-llama3:8b", "LLaVA-Llama3 8B", "XTuner"),
]
SAFE = re.compile(r"^[a-zA-Z0-9_.-]+$")


def sha(data):
    return hashlib.sha256(data).hexdigest()


def slug(model):
    return model.replace(":", "-")


def build(source_root):
    """Copy sources, prompt and recorded rewrites; return the index."""
    arena = source_root / "scripts/ollama/writing-arena"
    recorded = source_root / "public/evidence/writing-arena"
    plan = json.loads((arena / "tasks.json").read_text())
    template = (arena / "prompt-template.md").read_bytes()
    if sha(template) != plan["prompt_template_sha256"]:
        raise SystemExit("Prompt template does not match the frozen task list")
    (OUT / "sources").mkdir(parents=True, exist_ok=True)
    (OUT / "prompt-template.md").write_bytes(template)
    tasks, entries, settings = [], [], {}
    for task in plan["tasks"]:
        if not SAFE.match(task["id"]):
            raise SystemExit(f"Unsafe task id {task['id']!r}")
        body = (arena / "sources" / task["source"]).read_bytes()
        if sha(body) != task["source_sha256"]:
            raise SystemExit(f"Source for {task['id']} does not match its frozen hash")
        (OUT / "sources" / f"{task['id']}.md").write_bytes(body)
        tasks.append({"id": task["id"], "title": task["title"], "route": task["route"], "kind": task["kind"],
                      "words": len(body.decode().split()), "source": f"sources/{task['id']}.md", "source_sha256": task["source_sha256"]})
        for model, _, _ in MODELS:
            directory = recorded / task["id"] / slug(model)
            if not (directory / "metadata.json").exists():
                continue
            meta = json.loads((directory / "metadata.json").read_text())
            if meta["task"] != task["id"] or meta["model"] != model:
                raise SystemExit(f"Metadata identity mismatch in {directory}")
            if meta["source_sha256"] != task["source_sha256"] or meta["prompt_template_sha256"] != plan["prompt_template_sha256"]:
                raise SystemExit(f"{directory} was produced from a different source or prompt")
            for name in ("request.json", "response.json"):
                if sha((directory / name).read_bytes()) != meta[f"{name.split('.')[0]}_sha256"]:
                    raise SystemExit(f"{directory / name} does not match its recorded hash")
            response = json.loads((directory / "response.json").read_text())
            text = (response.get("message") or {}).get("content") or ""
            if text != (directory / "output.md").read_text():
                raise SystemExit(f"{directory}/output.md differs from the recorded response")
            target = OUT / "outputs" / task["id"] / f"{slug(model)}.md"
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_text(text)
            settings[model] = meta["settings"]
            entries.append({"task": task["id"], "model": model, "outcome": meta["outcome"], "words": meta["output_words"],
                            "input_tokens": meta["input_tokens"], "output_tokens": meta["output_tokens"],
                            "thinking_chars": meta["thinking_chars"], "elapsed_seconds": round(meta["elapsed_seconds"], 1),
                            "finished_utc": meta["finished_utc"], "digest": (meta["runtime"].get("digest") or "")[:12],
                            "quantization": (meta["runtime"].get("details") or {}).get("quantization_level"),
                            "output": f"outputs/{task['id']}/{slug(model)}.md", "output_sha256": sha(text.encode()),
                            "response_sha256": meta["response_sha256"]})
    return {"schema_version": 1, "captured_utc": datetime.now(timezone.utc).isoformat(timespec="seconds"),
            "prompt_template": "prompt-template.md", "prompt_template_sha256": plan["prompt_template_sha256"],
            "note": plan.get("note"), "models": [{"id": m, "name": n, "lab": lab, "settings": settings.get(m)} for m, n, lab in MODELS],
            "tasks": tasks, "entries": entries}


def verify():
    """Check that every published file matches the index."""
    index = json.loads((OUT / "index.json").read_text())
    if sha((OUT / index["prompt_template"]).read_bytes()) != index["prompt_template_sha256"]:
        raise SystemExit("Published prompt template does not match the index")
    for task in index["tasks"]:
        if sha((OUT / task["source"]).read_bytes()) != task["source_sha256"]:
            raise SystemExit(f"Published source {task['id']} does not match the index")
    for entry in index["entries"]:
        if sha((OUT / entry["output"]).read_bytes()) != entry["output_sha256"]:
            raise SystemExit(f"Published rewrite {entry['output']} does not match the index")
    print(json.dumps({"tasks": len(index["tasks"]), "models": len(index["models"]), "rewrites": len(index["entries"]),
                      "pending": len(index["tasks"]) * len(index["models"]) - len(index["entries"]), "offline": True}))


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--source-root", type=pathlib.Path)
    parser.add_argument("--verify", action="store_true")
    args = parser.parse_args()
    if args.source_root:
        index = build(args.source_root.resolve())
        (OUT / "index.json").write_text(json.dumps(index, indent=2, ensure_ascii=False) + "\n")
    verify()


if __name__ == "__main__":
    main()
