# Z3 mathematics review plan

Goal: rigorously review the published nine-chapter “How Z3 solves Queens” teaching part and experiment against its source, evidence, and original specification. Deliver DATA in DELIVERABLE.md, with exact, line-located corrections and reproducible independent calculations.

Approach and design decisions:
- Read the original design, every listed UI/support file, pipeline, verifier, and evidence schema. Track claims by chapter.
- Check mathematics directly; independently enumerate the finite Queens instance and verify encodings and trace inferences using scratch scripts here.
- Inspect receipts before interpreting engine statistics; distinguish reference CDCL from measured Z3 behavior.
- Use direct web retrieval/search only to check cited sources. No browser automation, credentials, provider APIs, application edits, commits, pushes, or external repository review.
- Run the authorized offline verifier only after inspecting it for write side effects. Suppress Python bytecode writes and redirect any scratch output here.
- Keep all created/modified files in this artifact directory. The repository is read-only for this review.

Checklist:
- [x] Check usage, local memory, repository root/branch/worktree, and applicable instructions.
- [x] Read design and UI/support files; inventory mathematical and numerical claims.
- [x] Inspect pipeline, verifier, evidence, and engine receipts.
- [x] Independently recompute counts, encoding sizes, propagation, and trace details.
- [x] Check cited sources and locators.
- [x] Run appropriate offline validation within the write boundary.
- [x] Complete findings, self-review, deliverable, and handoff.

Acceptance criteria:
- Every displayed definition/theorem/proof/check answer and material number is reviewed, with coverage recorded.
- Findings distinguish errors, misleading claims, minor issues, and nits; each has file:line, current quote, explanation, and paste-ready replacement.
- Independent results and limitations are explicit; scripts and results are saved here.
- DELIVERABLE.md is repeated in the final response, with usage, changed files, validation, open issues, and absolute artifact/worktree paths.
- Usage is checked at checkpoints and before final; stop cleanly if known remaining usage crosses the user's thresholds.
