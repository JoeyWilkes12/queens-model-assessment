# If resuming

State: inspection, Z3 measurement and reference-CDCL math validation complete. Read PLAN.md, DECISIONS.md, PROGRESS.md and VALIDATION.md. Last recorded usage has 78% five-hour and 70% weekly left.

Next exact step: write DELIVERABLE.md (4,000–7,000 words), nine chapters using book seven board. Include exact ledes, measured pipeline, primary-source map and component/schema contracts. INSTRUMENTATION.md and REFERENCE_CDCL.md already contain runnable scripts; MEASUREMENTS.md/Z3_VERBOSE.md/Z3_DIAGNOSTICS.md/REFERENCE_TRACE.md preserve actual output.

Gotchas: strict writes only in this directory; no commits/pushes/merges; no browser automation without relevant approval. Repository root is two levels above cwd, branch `claude/decision-models-refresh`, HEAD `5da41c6`; existing changes must remain untouched. Every citation needs web verification. Distinguish Z3 measurements from illustrative CDCL traces.

Critical discoveries: notebook-derived .py is HTML, original .ipynb was read instead. Atlas's 7×7 differs from book's 7×7. Z3 source pipeline is version/configuration dependent; obtain empirical stats before claiming a SAT-only or arithmetic route. Candidate honest design: actual Z3 statistics plus a precomputed reference-CDCL run, clearly identified, with independently checked reason clauses/resolution.

Concrete curriculum anchors: seven solution [3,1,6,2,4,7,5]. Reference conflict event 126 has F clause [35,42,49] (r5c7,r6c7,r7c7) false under q27; resolution event127 pivots49,42,35 via clauses297,296,295 to learn [-14]=¬q27; backjump root event128. q27 was propagated, so it is a non-decision UIP. First conflict event15 learns ¬q11. Event66 has a two-level trail for stack demonstration. Hall hypothesis ¬q31 confines regions A,B to rows1,2; all six C cells there become false, while bare pairwise UP does nothing.
