"""Launch isolated deterministic replay; never reveal or copy credential to disk.

Run `python3 scripts/subq/sandbox.py --limit 1` for pilot, then increase the
limit. Requires explicit human authorization for API spending and Docker use.
The credential file is JSON, not a shell dotenv; it is never sourced.

`--ledger-dir` selects the broker's persistent spending ledger (default:
this checkout's output/subq-ledger, the previous behaviour). The new-board
panel modes (`panel`, `panel-pilot`) require an explicit `--ledger-dir`
that already contains budget.json, so they always continue the shared
campaign ledger and never start a fresh one. Panel workers mount only their
own prepared plan directory, never the private solutions directory.
"""
import argparse
import json
import os
from pathlib import Path
import re
import subprocess
import time

ROOT = Path(__file__).resolve().parents[2]
IMAGE = "python@sha256:a6e34c598f2467ed0e9a8d349809fcd8b5c603269512df273a0bb1784edc11b1"
BROKER = "queens-subq-broker"
VOLUME = "queens-subq-ipc"


def docker(*args, **kwargs):
    return subprocess.run(["docker", *args], check=True, **kwargs)


PANEL_MODES = ("panel", "panel-pilot")


def parse(argv=None):
    p = argparse.ArgumentParser()
    p.add_argument("--limit", type=int, default=1)
    p.add_argument("--mode", choices=("replay", "trajectories", "split", *PANEL_MODES), default="replay")
    p.add_argument("--key-file", type=Path,
                   default=ROOT.parents[1] / ".env")
    p.add_argument("--ledger-dir", type=Path, default=None,
                   help="Broker ledger directory (default output/subq-ledger here); required and must already hold budget.json for panel modes")
    return p.parse_args(argv)


def resolve(args):
    """Validate arguments and choose paths; no side effects (testable offline)."""
    if not 1 <= args.limit <= 2000:
        raise SystemExit("Invalid limit")
    out = ROOT / ("output/subq" if args.mode == "replay" else "output/subq-" + args.mode)
    ledger = (args.ledger_dir or ROOT / "output/subq-ledger").resolve()
    inputs = ROOT / "scripts/subq/input"
    module = "replay.py" if args.mode == "replay" else "split_replay.py" if args.mode == "split" else "trajectories.py"
    input_path = "/input/trajectory-input.json" if args.mode == "trajectories" else "/input/split" if args.mode == "split" else "/input"
    if args.mode in PANEL_MODES:
        if args.ledger_dir is None:
            raise SystemExit("Panel modes require --ledger-dir pointing at the existing shared campaign ledger")
        if not (ledger / "budget.json").is_file():
            raise SystemExit("Panel modes never start a fresh ledger; budget.json not found in --ledger-dir")
        inputs = inputs / ("panel" if args.mode == "panel" else "panel-pilot")
        if not (inputs / "panel-input.json").is_file():
            raise SystemExit("Prepare the panel plan first (trajectories.py prepare --corpus ...)")
        input_path = "/input/panel-input.json"
    return {"out": out, "ledger": ledger, "inputs": inputs, "module": module, "input_path": input_path}


def main():
    args = parse()
    paths = resolve(args)
    out, ledger = paths["out"], paths["ledger"]
    out.mkdir(parents=True, exist_ok=True)
    ledger.mkdir(parents=True, exist_ok=True)
    docker("volume", "create", VOLUME, stdout=subprocess.DEVNULL)
    existing = subprocess.run(["docker", "inspect", BROKER], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    if existing.returncode == 0:
        raise SystemExit("Existing broker found; inspect/stop it explicitly before restarting")
    # Key bytes never enter tool output, argv, environment, worker or public files.
    try:
        raw = args.key_file.read_text()
        try:
            credential = json.loads(raw)
        except json.JSONDecodeError:
            credential = json.loads(re.sub(r",\s*([}\]])", r"\1", raw))
        key = credential["SubQ API KEY"]
        if not isinstance(key, str) or len(key) != 40 or not key.isascii() or any(c.isspace() for c in key):
            raise ValueError()
    except Exception:
        raise SystemExit("Credential could not be parsed/validated; no contents logged") from None
    common = ["--read-only", "--cap-drop=ALL", "--security-opt=no-new-privileges",
              "--user", f"{os.getuid()}:{os.getgid()}", "--pids-limit=64", "--memory=256m", "--cpus=1",
              "--tmpfs", "/tmp:rw,noexec,nosuid,size=16m"]
    command = ["docker", "run", "--rm", "-i", "--name", BROKER, *common,
               "--mount", f"type=volume,src={VOLUME},dst=/ipc",
               "--mount", f"type=bind,src={ledger},dst=/ledger",
               "--mount", f"type=bind,src={ROOT / 'scripts/subq/broker.py'},dst=/broker.py,readonly",
               IMAGE, "python", "-u", "-B", "/broker.py"]
    # Initialize native volume ownership without mounting any host files/secrets.
    docker("run", "--rm", "--network=none", "--cap-drop=ALL", "--cap-add=CHOWN",
           "--security-opt=no-new-privileges", "--mount", f"type=volume,src={VOLUME},dst=/ipc",
           IMAGE, "chown", f"{os.getuid()}:{os.getgid()}", "/ipc")
    log = (ledger / "broker-start.log").open("ab")
    broker_process = subprocess.Popen(command, stdin=subprocess.PIPE, stdout=log, stderr=log)
    broker_process.stdin.write((key + "\n").encode())
    broker_process.stdin.close()
    del key, raw, credential
    try:
        for _ in range(30):
            if broker_process.poll() is not None:
                raise SystemExit("Broker startup failed; inspect sanitized startup log")
            ready = subprocess.run(["docker", "exec", BROKER, "python", "-c",
                                    "import os;raise SystemExit(0 if os.path.exists('/ipc/subq.sock') else 1)"],
                                   stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            if ready.returncode == 0:
                break
            time.sleep(0.2)
        else:
            raise SystemExit("Broker socket readiness timed out")
        worker = ["run", "--rm", "--name", "queens-subq-worker", *common, "--network=none",
                  "--mount", f"type=volume,src={VOLUME},dst=/ipc,readonly",
                  "--mount", f"type=bind,src={ROOT / 'scripts/subq/replay.py'},dst=/replay.py,readonly",
                  "--mount", f"type=bind,src={paths['inputs']},dst=/input,readonly",
                  "--mount", f"type=bind,src={out},dst=/output"]
        docker(*worker, "--mount", f"type=bind,src={ROOT / 'scripts/subq/isolation.py'},dst=/isolation.py,readonly",
               IMAGE, "python", "-u", "-B", "/isolation.py")
        module, input_path = paths["module"], paths["input_path"]
        if args.mode != "replay":
            worker += ["--mount", f"type=bind,src={ROOT / 'scripts/subq' / module},dst=/{module},readonly"]
        worker += [IMAGE, "python", "-u", "-B", f"/{module}", "run", "--input", input_path,
                   "--output", "/output", "--limit", str(args.limit), "--broker-socket", "/ipc/subq.sock"]
        result = subprocess.run(["docker", *worker])
        raise SystemExit(result.returncode)
    finally:
        subprocess.run(["docker", "stop", "--time", "3", BROKER], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        broker_process.wait(timeout=15)
        log.close()


if __name__ == "__main__":
    main()
