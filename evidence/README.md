# Evidence bundle

This directory documents the generated evidence served by the local Queens assessment site. It is produced from the five completed studies listed in `public/evidence/manifest.json`:

## Table of contents

- [Source studies](#source-studies)
- [Regenerate](#regenerate)
- [Included](#included)
- [Excluded and sanitized](#excluded-and-sanitized)

## Source studies

- `2026-09-17-one-shot`
- `2026-09-18-jev-5x5-variations`
- `2026-09-18-jev-deep-dive`
- `2026-09-19-jev-primitives`
- `2026-09-19-jev-scale`

## Regenerate

From the `Games/Queens/screenshot-solver` project root, run:

```sh
node evaluations/2026-09-19-comprehensive/site/scripts/generate-evidence.mjs
```

The generator uses only local files and has no network or package dependency. It recreates `evaluations/2026-09-19-comprehensive/site/public/evidence/`, then writes a searchable `manifest.json`, sanitized grade-source files, and one folder per study/run. Generated JSON intentionally omits a wall-clock build timestamp so an unchanged evidence source produces byte-for-byte stable output.

## Included

- Actual `requests/*.json` files, retaining the complete model-visible prompt text and structured request fields.
- `raw/*/response.json` and `raw/*/metadata.json` when present, including provider errors, timeout metadata, and other explicit transport failures.
- The selected public grade records: one-shot grades, variation/primitives/scale audit records, primitive candidate scores, and deep-dive `grades/*.json` files.
- A manifest record for every request, including requests that were planned but never produced a raw run, runs with no response, and error responses. Missing files remain `null`; the generator never fabricates a response.

Inline request images are represented in the generated request JSON as a content-addressed object such as `request-inline-image://sha256/<digest>`, with a relative `asset_path`, media type, byte length, and SHA-256 hash. The generator decodes each unique image once into `public/evidence/assets/`, so the exact submitted pixels remain viewable without repeating opaque base64 blobs. The original prompt text remains intact.

## Excluded and sanitized

- Every `private/` path, including answer keys and refinement keys.
- `tmp/`, PDF rasters, generated PDFs, and unrelated `output/` artifacts.
- Planning-only `planned_requests/`, bulky discovery/catalog/manifests, billing/account artifacts, scripts, and source reports.
- `started.json`, partial transport scratch files, and other records not needed by the evidence atlas.
- Recursive credential-like keys (`api_key`, authorization/token/secret/password/credential fields, and provider `user_id` values).
- Encrypted or signed model reasoning payloads under `reasoning_details`; visible response content, errors, usage, and timing metadata are retained.

The generated manifest has per-record `study`, `board`, `model`, and `run` fields plus inverted indexes for those dimensions. Paths in the manifest are relative to `public/evidence/`, while `source` paths identify the original repository-relative evidence file.
