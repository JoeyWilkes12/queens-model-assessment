# Queens assessment book

This is the static-compatible Vite + React + TypeScript companion to the expanded Queens model assessment. It turns the report into a responsive technical book and exposes a sanitized evidence atlas at `/evidence/manifest.json`.

Published site: [Queens model assessment](https://joeywilkes12.github.io/queens-model-assessment/)

## Table of contents

- [Routes](#routes)
- [Evidence boundary](#evidence-boundary)
- [Local handoff](#local-handoff)
- [Design and quality records](#design-and-quality-records)

## Routes

The app uses hash routing so a static host can serve every page without rewrite rules:

- `#/executive-summary`
- `#/assessment-receipt`
- `#/queens-rules`
- `#/protocol-results`
- `#/earlier-generations`
- `#/jev-primer`
- `#/candidate-engineering`
- `#/scale-primitives`
- `#/jev-trajectories`
- `#/evidence-atlas`
- `#/methods-sources`
- `#/about`

The evidence atlas also supports `#/evidence-atlas/<record-id>` detail routes.

## Evidence boundary

Only sanitized records placed in `public/evidence/manifest.json` are rendered. Private answer keys, credentials, encrypted reasoning, and raw repository paths must not be copied into that manifest. The generated bundle includes exact prompt text, model-visible responses, deterministic grades, request metadata, and decoded content-addressed copies of the three input board images.

## Local handoff

```bash
npm install
npm run dev
```

`predev` and `prebuild` regenerate the public evidence bundle from the seven retained studies. Use `npm run evidence:generate` to refresh it directly. The October 1 earlier-generations chapter is backed by a generated summary, report, frozen protocol, adaptive schedule amendment, review notes, and the same request, response, metadata, grade, and image receipts used by the evidence atlas. The separately published GitHub Pages repository builds the same site source at its repository root.

## Design and quality records

- [Product contract](PRODUCT.md)
- [Design system](DESIGN.md)
- [Evidence bundle contract](evidence/README.md)
- [Quality check](QUALITY_CHECK.md)
