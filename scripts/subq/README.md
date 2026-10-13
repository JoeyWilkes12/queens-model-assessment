# SubQ assessment runner

Operational guide updated **2026-10-13**. The runner issues sequential SubQ Snap decisions and grades Queens with deterministic local code. It uses no model judge and executes no provider-returned code. Read the [provider and containment reference](../../docs/subq-provider.md) before changing its trust boundaries.

## Table of contents

- [Components and prerequisites](#components-and-prerequisites)
- [Prepare and test offline](#prepare-and-test-offline)
- [Run a small live pilot](#run-a-small-live-pilot)
- [Continue the campaign](#continue-the-campaign)
- [Inspect and audit receipts](#inspect-and-audit-receipts)
- [Budget, failures, and resumption](#budget-failures-and-resumption)
- [Containment and cleanup](#containment-and-cleanup)

## Components and prerequisites

| File | Purpose |
| --- | --- |
| [broker.py](broker.py) | Holds the credential, fixes provider host/path, filters responses, reserves spending before dispatch |
| [sandbox.py](sandbox.py) | Starts the hardened broker and worker; supplies the key through standard input |
| [isolation.py](isolation.py) | Tests the worker's actual runtime permissions and network isolation before inference |
| [replay.py](replay.py) | Prepares exact historical requests, grades decisions, audits hashes, and resumes completed work |
| [trajectories.py](trajectories.py) | Recreates the historical adaptive color-then-cell protocol on nine boards |
| `split_replay.py` | Separately labeled adaptation for historical requests exceeding the observed 16-question limit |
| `test_*.py` | Offline regression checks with dummy credentials and synthetic/oracle responses |

Run commands from the repository root. Python 3 and a working Docker Engine are required. The launcher pins its Python image by digest and uses no provider SDK or downloaded runtime packages. The separate Docker Sandboxes `sbx` product is not used. [Docker Engine security](https://docs.docker.com/engine/security/), [Docker Sandboxes](https://docs.docker.com/ai/sandboxes/)

The key file is a local JSON object with a `SubQ API KEY` field, not shell dotenv syntax. The loader accepts the supplied trailing-comma form, checks the key format without printing it, and never sources the file. `.env` must remain Git-ignored. Do not view it, put its contents in command arguments or environment variables, copy it into the worker, or include it in receipts.

## Prepare and test offline

These commands use retained public evidence and make no provider calls. Preparation freezes the source task identity and semantic hash; it fails if expected board assumptions or historical grades do not reconcile. Do not regenerate a campaign's input while that campaign is running.

```sh
python3 scripts/subq/replay.py prepare --full
python3 scripts/subq/trajectories.py prepare
python3 scripts/subq/split_replay.py prepare
PYTHONDONTWRITEBYTECODE=1 python3 -m unittest discover -s scripts/subq -p 'test_*.py' -v
```

`prepare --full` includes all eligible retained native Jev requests, including valid-request failures. The priority portion repeats selected mixed-success historical requests; the rest of the schedule extends coverage. Caller errors and nonexistent APIs remain excluded according to the source manifest. The trajectory preparation certifies each original board with two independent validators and verifies recreated state/question templates against retained Jev calls.

Input lives in `scripts/subq/input/`: `manifest.json`, `fixtures/*.json`, `reference-audit.json`, and `trajectory-input.json`. Input and reference grades are available to the local grader; only the request's `state` and `questions`, plus the SubQ model envelope, go to the provider.

## Run a small live pilot

The following command starts Docker containers and can spend SubQ credits. `--limit 1` means at most one **new** exact request, with previously completed receipts skipped.

```sh
python3 scripts/subq/sandbox.py --mode replay --limit 1
```

In this worktree layout, the default credential location resolves to the parent repository's ignored `.env`. For another checkout layout, pass a file path explicitly; the path argument contains no secret:

```sh
python3 scripts/subq/sandbox.py --mode replay --limit 1 --key-file /absolute/path/to/ignored/.env
```

The launcher performs an isolation preflight, checks the available model list, and then makes inference calls. Progress is line-oriented JSON: `isolation_preflight`, `models_receipt`, `request_start`, `request_complete`, audit summaries, and explicit stops. Review a preserved response/grade and spending snapshot before widening.

## Continue the campaign

All modes share the same persistent broker spending ledger. Exact replay, adapted split requests, and fresh adaptive trajectories have separate output directories and denominators.

```sh
python3 scripts/subq/sandbox.py --mode replay --limit 100
python3 scripts/subq/sandbox.py --mode trajectories --limit 1
python3 scripts/subq/sandbox.py --mode split --limit 1
```

The commands are examples of separate sequential phases, not instructions to start them concurrently. `--limit` counts new requests in replay mode and new trajectories in trajectory mode; one trajectory can issue multiple model calls. Begin split mode only after its script and frozen adaptation plan are present.

The provider returned HTTP 422 for an exact historical 25-question request and disclosed a maximum of 16 questions. The exact replay now marks further oversized requests `not_run` locally instead of resending them. Split mode changes grouping into independent requests with at most 16 questions each, preserving each question and state. Keep its results labeled adapted; a merged answer map is not evidence of a successful original one-call 25-question request.

Adaptive trajectories start from an empty board, ask for a color region and then its cell, and stop on a local rule violation or an unextendable prefix. Raw and locally filtered menus remain distinct. Singleton menus are forced harness transitions and make no inference call. The complete solver grades and stops attempts; it never supplies a candidate or sends solution feedback upstream. Later states follow SubQ's own choices, so this protocol is not a replay of Jev's exact later states.

## Inspect and audit receipts

| Local output | Contents |
| --- | --- |
| `output/subq/` | Exact replay manifest, model discovery, runtime isolation, per-call receipts, aggregate summary |
| `output/subq-trajectories/` | Fresh trajectory attempts, steps/stop reasons, per-call receipts, summary |
| `output/subq-split/` | Separately adapted split-request evidence |
| `output/subq-ledger/budget.json` | Shared persistent known-cost estimates and unresolved full-call reserves |
| `output/subq-ledger/broker-start.log` | Sanitized broker startup/error log |

Auditing existing evidence makes no provider calls and requires no key:

```sh
python3 scripts/subq/replay.py audit --output output/subq
python3 scripts/subq/trajectories.py audit --output output/subq-trajectories
```

Each dispatched replay call records request/source identity, start time, filtered response, broker receipt, deterministic grade, and completion metadata. Audit recomputes semantic/receipt hashes and grades before rebuilding summaries. Runtime preflight evidence is in each mode's `isolation.json`.

**Receipt exclusions:** the broker withholds arbitrary provider strings, unknown labels, extra fields, and full error text. It passes documented approved labels and bounded numerical fields, with fixed diagnostics for errors. Response hashes identify the retained filtered JSON, not raw HTTP response bytes. Reviewers cannot recover excluded free-text diagnostics from these receipts. See [filtered-receipt policy](../../docs/subq-provider.md#filtered-receipts-and-exclusions).

## Budget, failures, and resumption

The broker's local ceiling is **$4.50**, below the user's $5 budget. Before every inference request it atomically persists a reservation of **$0.0196608**, the published cost of a full 393,216-token context. A valid HTTP 200 usage count reconciles that reserve to the estimated token cost. A provider error, malformed/missing usage, timeout, or uncertain transport keeps its full reserve across process restarts. Model-list discovery is not an inference request.

The estimate uses the published [Snap input price](https://docs.subq.ai/using-the-api/models/). It is not a provider-confirmed balance or billing total. Do not reset/delete the ledger to continue a campaign or treat unknown-cost failures as zero dollars. The reservation survives a process restart; atomic replacement is not a claim of power-loss durability or protection from a trusted host user editing the ledger.

Provider/transport/schema failures stop the runner with receipts preserved. There is no automatic retry. Completed terminal records are skipped on later runs; exact requests with `started.json` but no completion metadata require review before resubmission. Adaptive attempts marked `in_progress` or `request_failure` also block automatic continuation. This avoids silently repeating an uncertain paid call.

A request failure, compatibility skip, schema failure, wrong decision, valid full placement, and completed adaptive solve are different outcomes. Keep availability, per-question correctness, candidate recognition, and full-board success denominators separate. A frozen trajectory-state decision is not a fresh full solve.

## Containment and cleanup

The execution worker has `--network none` and only a read-only Unix-socket channel to the custom SubQ broker. It receives approved runner/input mounts and a dedicated writable output directory. Both main containers run nonroot, with a read-only root filesystem, all capabilities dropped, no-new-privileges, and CPU/memory/process limits. No Docker socket, host home, or credential file is mounted into the worker.

The broker has normal outbound networking and is trusted code. Its fixed HTTPS host/path and redirect refusal are application controls, not a firewall restricting a compromised broker. The provider receives its own credential in the authorization header; it never receives the local file or unrelated account credentials. No OpenAI call is needed for this deterministic campaign.

The launcher normally stops/removes its broker and worker when the phase ends, while preserving the IPC volume, local ledger, and evidence. If it finds an existing `queens-subq-broker`, it stops rather than claiming or replacing it. Inspect the named containers before manual cleanup:

```sh
docker ps -a --filter name=queens-subq
```

Stop an identified interrupted campaign's broker explicitly when needed; do not remove other projects' containers, reset Docker globally, or delete the persistent budget/evidence directories. The host Codex chat itself is not contained by these worker restrictions.
