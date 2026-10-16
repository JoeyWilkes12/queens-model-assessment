## Working rules: durable artifacts and usage (mandatory)
Your run may be cut off without warning by a usage limit. Leave a trail so a Claude model can review or resume your work.
Artifact directory: /Users/joeywilkes/Desktop/scripts/queens-model-assessment/.worktrees/openrouter-panel/.empower/2026-10-16-z3-math-review  (create it if missing; write Markdown; keep files current as you go, not only at the end)
- PLAN.md — before starting: goal, approach, design decisions with reasons, task checklist, acceptance criteria. Update the checklist as you go.
- PROGRESS.md — append a timestamped entry after each meaningful step: what you read/checked, commands run and results, what's next. Include the usage line (below) in each entry.
- DECISIONS.md — any judgement call or deviation from the brief, with the alternative you rejected and why.
- REVIEW.md — your self-review/validation: what you checked, how, findings and their resolution, open risks.
- HANDOFF.md — keep a short "if you're resuming" note current: state, next exact step, gotchas. Rewrite it at every checkpoint.
Usage: run `~/.claude/skills/empower/scripts/codex-usage.sh` at the start, at each checkpoint, and before your final message. Put its line in PROGRESS.md and at the top of your final message. If the 5h window has < 10% left or the weekly < 5% left, stop at the next clean checkpoint: update HANDOFF.md and finish with a summary instead of starting new work.
Commit only if the brief allows it; never push or merge.
Final message: usage line, summary, files changed, validation results, open issues, and the artifact directory path.

## Write boundary (strict)
Create/modify files ONLY inside the artifact directory above. Do not modify any other file, do not commit, do not push. Do not access any credential, keychain item, .env file or provider API. Web search is enabled for checking citations only. Deliverable = DATA: write /Users/joeywilkes/Desktop/scripts/queens-model-assessment/.worktrees/openrouter-panel/.empower/2026-10-16-z3-math-review/DELIVERABLE.md and repeat it in your final message.

## Role
You are a mathematician and SAT/SMT expert doing a rigorous correctness review of a published, interactive teaching part: "How Z3 solves Queens" (nine chapters plus an experiment), aimed at mathematics undergraduates. You designed its specification earlier (your design: /Users/joeywilkes/Desktop/scripts/queens-model-assessment/.worktrees/openrouter-panel/../decision-models-refresh/.empower/2026-10-14-z3-teaching-design/DELIVERABLE.md). Now review what was actually built, for mathematical and factual correctness, against the code and the data.

## What to read (repository root = /Users/joeywilkes/Desktop/scripts/queens-model-assessment/.worktrees/openrouter-panel)
- UI: src/z3/Z3Part.tsx, Chapter1.tsx … Chapter9.tsx, Experiment.tsx, CDCLPlayer.tsx, EngineReceipt.tsx, ConstraintBoard.tsx, kernel.ts, data.ts, format.tsx. All definitions, theorems, proofs, "Check yourself" answers, captions and source citations live in these files.
- Data and pipeline: scripts/z3/build_teaching_data.py, scripts/z3/reference_cdcl.py, scripts/z3/measure_z3.py, scripts/verify-z3-teaching.mjs, public/evidence/z3/*.json (reference traces, teaching data, Z3 receipts, manifest), src/z3/board-seven.json.
- You may run the offline verifiers: `Z3_PYTHON=/Users/joeywilkes/Desktop/scripts/Queens/.local/venv/bin/python npm run z3:verify` (from /Users/joeywilkes/Desktop/scripts/queens-model-assessment/.worktrees/openrouter-panel), and small read-only Python checks with that interpreter. Write any scratch scripts only inside the artifact directory.

## Review questions
1. Every displayed definition, theorem and proof: is it stated correctly, with the right hypotheses (e.g., unit-propagation closure properties and order-independence claim, the first-UIP definition and cut, resolution soundness, asserting clause and backjump level, Hall's theorem and the row/region confinement deduction and its limits, the blocking-clause uniqueness criterion and the short n-literal blocker, Tseitin equisatisfiability, DPLL(T) and simplex/integrality remarks, the DRAT/RUP description)?
2. Every number on the page (counts like 2^49, 7^7, 5040, 646 permutations remaining after the local diagonal constraints?, 664→513 clauses, pairwise/Sinz/commander clause and auxiliary counts per group size, 34 of 49 single-cell decisions reaching conflict by propagation alone, event numbers 66/126, clause IDs 295–297/517, Z3 statistics): is it correct and consistent with the data? Recompute independently where feasible.
3. Engine claims: are the statements about which Z3 engine ran (SAT core after lia2card/pb2bv/bit-blasting vs SMT core with arithmetic for the incremental blocked check; the 9×9 first check finishing in preprocessing with no search) accurately supported by the recorded receipts and phrased with the right uncertainty?
4. Pedagogy accuracy: any misleading simplification, ambiguous notation, or mislabelled figure (e.g., "Reference CDCL execution" vs "Recorded Z3 execution")?
5. Citations: are section/figure locators and attributions right (spot-check with web search)?

## Deliverable format
- Verdict (1 paragraph).
- Findings table: severity (error / misleading / minor / nit), file:line, quoted current text, problem, exact proposed replacement text (ready to paste).
- Independent recomputations: what you recomputed and the result (include scripts in the artifact dir).
- Anything you could not verify.
Be precise; do not propose stylistic rewrites unless they fix a correctness or clarity problem.
