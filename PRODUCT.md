# Product

<!-- impeccable:product-schema 1 -->

## Table of contents

- [Platform](#platform)
- [Stack](#stack)
- [Users](#users)
- [Product purpose](#product-purpose)
- [Positioning](#positioning)
- [Operating context](#operating-context)
- [Capabilities and constraints](#capabilities-and-constraints)
- [Brand commitments](#brand-commitments)
- [Evidence on hand](#evidence-on-hand)
- [Product principles](#product-principles)
- [Accessibility and inclusion](#accessibility--inclusion)

## Platform

web

## Stack

Vite, React, and TypeScript, published with hash routing through the separate static GitHub Pages repository `queens-model-assessment`.

## Users

AI engineers, model-evaluation practitioners, and developers performing a deep technical review of the Queens assessment. Readers may not know the regional Queens rules before arriving.

## Product Purpose

Turn the expanded illustrated assessment into an interactive technical book. The site must make the study understandable at a narrative level while allowing readers to inspect the exact model-visible inputs, visible outputs, timing, usage, cost, checker results, routing failures, and methodological limits behind each conclusion.

Success means a reader can learn the puzzle rules, understand why Jev is a different decision model, trace a reported result to its saved evidence, and compare representations or runs without opening the repository manually.

## Positioning

The site connects an editorial assessment directly to its inspectable local evidence. Its distinctive mechanism is a book-like reading path paired with a searchable request/response atlas and deterministic rule visualizations.

## Operating Context

Readers move between high-level chapters, board diagrams, model comparisons, candidate-selection demonstrations, and exact JSON evidence. The public site remains static and read-only: no model calls, account changes, analytics, or external writes occur through the interface.

## Capabilities and Constraints

- Preserve the report's findings and caveats; do not silently recompute or reinterpret scores.
- Expose model-visible requests, visible responses, metadata, grades, and preserved transport errors from the five assessment stages.
- Distinguish request success from model-assessment success, and contextualize every error before showing raw JSON.
- Exclude private answer keys, credentials, encrypted reasoning payloads, generated PDF page rasters, and unrelated repository files.
- Use responsive sidebar and chapter navigation, accessible disclosure controls, native table scrolling, keyboard focus, reduced-motion support, and light/dark themes.
- Keep local development and the GitHub Pages build behaviorally equivalent.
- Publish only the sanitized site bundle from committed source in the dedicated Pages repository.

## Brand Commitments

Use the Agent Skills Resource Library design system at `/Users/joeywilkes/Desktop/Scripts & Code/AI Agent Skills/agent-skills-resource-library/DESIGN.md` as visual authority: navy, paper, mint, coral, gold, editorial serif plus compact utility type, square geometry, evidence-first language, and the audited field-guide reading model. Adapt its trust receipt into an assessment receipt and its guide rail into book navigation.

## Evidence on Hand

- Expanded report and QA: `../REPORT.md`, `../QUALITY_CHECK_EXPANDED.md`, and `../evidence/expanded-audit.json`.
- Original multimodal trials: `../../2026-09-17-one-shot/`.
- Jev baseline deep dive: `../../2026-09-18-jev-deep-dive/`.
- Jev 5×5 representation study: `../../2026-09-18-jev-5x5-variations/`.
- Jev larger-board scale study: `../../2026-09-19-jev-scale/`.
- Jev held-out primitive study: `../../2026-09-19-jev-primitives/`.
- Five report illustrations: `../assets/`.
- The PDF remains a stable download for readers who do not need the evidence atlas.

No testimonial or population-level benchmark claim is available and none may be fabricated. The public deployment is [Queens model assessment](https://joeywilkes12.github.io/queens-model-assessment/).

## Product Principles

1. Lead with the evaluated outcome, then expose the method and raw evidence.
2. Keep model-visible material distinct from evaluator-derived annotations and deterministic grades.
3. Make Queens constraints visible, especially the difference between ordinary N-queens and regional non-touching Queens.
4. Preserve failures, timeouts, retries, and missing records as evidence. Curated request-level mistakes may be excluded from the default browse view only when their flag, reason, error interpretation, and direct route remain available.
5. Preserve local provenance so every summarized claim can be traced to a file.

## Accessibility & Inclusion

Assume some readers are unfamiliar with Queens, rely on keyboard navigation, zoom to 200%, or use a 320px-wide viewport. Diagrams require written equivalents; color never carries region or status meaning alone; code and tables remain selectable and horizontally scrollable.
