# Queens assessment book

This is the static-compatible Vite + React + TypeScript companion to the expanded Queens model assessment. It turns the report into a responsive technical book and exposes a sanitized evidence atlas at `/evidence/manifest.json`.

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
- `#/jev-primer`
- `#/candidate-engineering`
- `#/scale-primitives`
- `#/evidence-atlas`
- `#/methods-sources`
- `#/about`

The evidence atlas also supports `#/evidence-atlas/<record-id>` detail routes.

## Evidence boundary

Only sanitized records placed in `public/evidence/manifest.json` are rendered. Private answer keys, credentials, encrypted reasoning, and raw repository paths must not be copied into that manifest. The generated bundle includes exact prompt text, model-visible responses, deterministic grades, request metadata, and decoded content-addressed copies of the three input board images.

## Local development

```bash
npm install
npm run dev
```

The committed public evidence bundle is sufficient for development and deployment. From the parent Queens source checkout, use `npm run evidence:generate` to refresh it from the five retained studies before committing a deliberate data update.

## Public deployment

The site is published through GitHub Actions to [GitHub Pages](https://joeywilkes12.github.io/queens-model-assessment/). Pushes to `main` build the root Vite project and deploy `dist/`; the repository's Pages source must be set to **GitHub Actions**.

The publication layer was prepared from source revision `dc5b1f77357bcb62580f3e4f5ccf480765586b75`. The About route, Pages workflow, and QR assets are deployment additions and do not change the assessment results.

## Design and quality records

- [Product contract](PRODUCT.md)
- [Design system](DESIGN.md)
- [Evidence bundle contract](evidence/README.md)
- [Quality check](QUALITY_CHECK.md)
