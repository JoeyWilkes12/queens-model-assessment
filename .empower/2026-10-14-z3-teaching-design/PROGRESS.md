# Progress

## 2026-10-14 — Initial checkpoint
- Ran `~/.claude/skills/empower/scripts/codex-usage.sh`: `[empower] usage: unknown (no rate_limits in session log)`.
- Read `~/.codex/memory.md`; verified cwd, Git root, status, and worktree registration. Repository: queens-model-assessment; branch `claude/decision-models-refresh`; HEAD `5da41c6`. Existing unrelated changes preserved.
- Checked ancestor AGENTS.md paths (none present at those paths). Read the supplied instructions and Impeccable skill for planning-only interface design.
- Next: inspect named source files and read skill planning reference. No browser or app automation is needed.

## 2026-10-14 23:10 MDT — Source inspection checkpoint
- Usage: `[empower] usage (as of Wed 23:10): 5h window 12% used / 88% left, resets Thu Oct 15 03:37 | weekly 28% used / 72% left, resets Mon Oct 19 23:07`.
- Read Atlas README, specification, template, model-data, app.js, model.js, CSS; inspected assessment App.tsx boardConfigs/BoardDiagram/QueensRules, DESIGN.md, and BoardReplay.tsx.
- Found: different Atlas/book 7×7 instances; trace strings capped at 28; Next updates text only; no reason clauses, propagation trail, learning, or conflict graph; upfront draft/active/witness/evidence bookkeeping burdens a novice.
- Read production queens_solver.py. Named notebook-derived `.py` is Google Drive warning HTML; original KEEP.ipynb has the same Bool/Sum(If)/directed-neighbour encoding.
- System python lacks z3; existing Queens `.local/venv/bin/python` provides Z3 4.16.0.0 and the requested diagnostic tactics. No dependency installation or external writes needed.
- Web-verified initial Z3 docs, Sinz paper, NOT abstract-DPLL paper, Chaff, MiniSat, commander encoding, CDCL handbook, and DRAT sources. Next: measure exact encoding and build curriculum with verified source locators.

## 2026-10-14 23:15 MDT — Measurement and executable-math checkpoint
- Usage: `[empower] usage (as of Wed 23:15): 5h window 22% used / 78% left, resets Thu Oct 15 03:37 | weekly 30% used / 70% left, resets Mon Oct 19 23:07`.
- Wrote INSTRUMENTATION.md with a runnable Python script. Ran separate processes for three boards × default/fd/pb; all 27 first/incremental-blocked/fresh-blocked checks returned expected SAT/UNSAT. Stored raw JSON in MEASUREMENTS.md.
- Captured verbose=10 for seven/default in Z3_VERBOSE.md; observed actual lia2card, pb2bv, bit-blast, SAT sequence and subsequent SMT search. Diagnostic OnClause/clause_proof run and tactics retained in Z3_DIAGNOSTICS.md; it changes the first-check route, confirming instrumentation caveat.
- Wrote and ran REFERENCE_CDCL.md prototype; recorded 270 SAT-run events and 185 uniqueness-run events in REFERENCE_TRACE.md. Original deduplicated CNF has 513 clauses; learned 8 then 6 clauses. Checked every propagation reason/conflict/resolution step and independently verified all 14 learned clauses with Z3.
- Independently enumerated permutations for all three boards: one solution each. Validated Hall example under ¬q31; six C cells in rows 1–2 excluded, although UP alone adds none. Results in VALIDATION.md.
- A validation harness list/scalar Solver.add call failed after the successful trace/enumeration checks; corrected its call and reran the Hall checks successfully. No measurement script change required.
- Read parent PRODUCT.md. Next: compose the nine-chapter deliverable, source map, exact ledes and component contracts; then bounded review.
