# Self-review and validation

## Scope and outcome

DELIVERABLE.md is complete (about 6,050 words), with all five requested sections, nine chapters, nine exact ledes, explicit mathematical statements, board-specific interactions, a 16-entry verified paper map plus historical references, components, JSON/TypeScript trace schema, mobile/accessibility requirements and acceptance criteria.

## Checked

- Read all requested Atlas source files and inspected built dist/pages/index.html. Diagnosed source behavior without claiming a browser usability test.
- Read production queens_solver.py and original KEEP.ipynb. Named notebook-derived .py is HTML; documented rather than executed it.
- Bound all main lessons to the book's seven-board. Atlas board identity and baseline explicitly differ.
- Actual solver: Z3 4.16.0.0 from existing Queens environment. Ran nine separate board/configuration processes and 27 queries. All first checks SAT; both blocked styles UNSAT; placements matched saved fixtures.
- Kept raw statistics and hashes in MEASUREMENTS.md; seven/default verbose output in Z3_VERBOSE.md. Distinguished default tactic/SAT first checks from incremental SMT/arithmetic checks. Absent counters are not zeros.
- Preserved OnClause/clause_proof diagnostic in Z3_DIAGNOSTICS.md. It alters the route. All callback events/created clauses are not equivalent to 1-UIP learning counts.
- Generated an actual reference-CDCL run, identified separately from Z3. Checked every enqueue reason/conflict and resolution pivot/resolvent, and all 14 learned clauses independently with Z3. SAT-run 270 events, blocked-run 185 events; root empty clause reached.
- Independently enumerated permutations for 5/7/9 boards; unique placements confirmed.
- Exhaustively checked Sinz-chain and specified commander encodings for all assignments at sizes 1–9 (2,044 assignment/encoding cases). Exactly-one projection correct. Seven-variable counts: 22/18/20 clauses; full-board raw 664, deduplicated 513.
- Verified Hall exclusion under displayed premise ¬q31: six C cells in rows1–2 impossible, while pairwise UP derives none. Matching theorem limited to abstraction.
- Verified scholarly metadata/locators through primary papers, official author/tutorial pages or publisher records. Klieber/Kwon year/venue corroborated by Gent et al.'s bibliography. No invented exercise/figure numbers or fixed year for evolving Z3 Internals. MiniSat conference 2003 distinguished from publication 2004; Tseitin original date distinguished from reprint pagination.
- Reviewed current Z3 source for first-UIP and backjump/chronological policies. Added reverse-trail-order condition for first-UIP resolution.
- Checked nine chapters/ledes, required visuals, 4,000–7,000-word constraint, and local link targets.
- No browser automation, previews, dependency installation, application edits, commits, pushes, merges or external model review. All written files are in this artifact directory.

## Resolved findings

- Invalid notebook-derived .py: used original notebook.
- Default/incremental ambiguity: measured both, retained fresh-blocked control.
- Backtracker explanation: replaced with checked reference CDCL and exact engine caption.
- Clause counts: specified variants and deduplication conventions.
- One validation-harness list/scalar Solver.add call failed after other checks passed; split calls and reran Hall validation. Measurement and trace generation scripts succeeded.

## Open implementation work and limits

- No UI built or browser/mobile-tested; responsive details are an implementation contract.
- No full Z3 historical assignment/reason/backtrack trace captured. Reference execution is not Z3.
- No DRAT certificate generated/checked. Reference blocked proof checked by reason/resolution replay plus independent Z3 entailment, not DRAT-trim.
- Counts are run/configuration specific, not performance guarantees. Nine-board first/fresh verbose pipeline not captured.
- Source tree is shared with ongoing orchestrator work; hashes preserve what was read, and other task edits must not be attributed to this run.
