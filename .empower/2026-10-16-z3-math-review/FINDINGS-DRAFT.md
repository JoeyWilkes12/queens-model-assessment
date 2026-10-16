# Provisional findings — verify before finalizing

Superseded by DELIVERABLE.md and REVIEW.md. Keep this file as the audit trail of tentative concerns, not as an additional finding list. Final line numbers and replacements are in DELIVERABLE.md (EngineReceipt metric line 90; Chapter5 strength-comparison line 152).

- ERROR: Chapter1.tsx:132 says a satisfied touching clause has a false literal. Must say true literal.
- ERROR: Chapter3.tsx:76,123,141 and CDCLPlayer.tsx:33,128 display signed negative literal as false (`¬q is false`) while the trail asserts it true. Use positive variable with false or signed literal with true.
- ERROR in proof, theorem likely valid with explicit domain: Chapter3.tsx:165 says adding literals never makes fewer clauses unit. Counterexample F=(a∨b), M={¬a}, M′={¬a,b}. Explain monotonicity via a forced literal remaining forced, already satisfied, or conflict; define consistent partial assignments + conflict top and U(top)=top.
- MISLEADING: Chapter3.tsx:168 invariant that both watched literals are non-false is not maintained for unit/falsified/satisfied clauses. Replace with operational event-driven rule.
- CHECK: Chapter2.tsx:175 describes one-way Sinz state as exact prefix OR. For EO it is exact, AMO alone not (their own next example demonstrates). Need delimit scope.
- CHECK: Chapter5 theorem: first UIP assumes conflict above level 0 after propagation saturation; root conflict has no current decision/UIP. Other statements refer current level implicitly; assess whether explicit qualification is necessary.
- CHECK: Chapter6.tsx:96 “whole of conflict analysis” too broad for full SMT/Z3; reference kernel is pure resolution, full solvers choose reasons/cuts and minimize etc.
- CHECK: Chapter9.tsx:39 “not equivalent over the old ones” contradicts displayed existential equivalence unless clearly distinguishing extended signature from projection.
- CHECK: engine receipt phases, statistics, and citation locators remain unverified.

Additional confirmed issues:
- ERROR: EngineReceipt.tsx:66–67,89 indexes the first verbose line by stage name and reuses its expression count for later occurrences. At seven/default/first, post-pb2bv simplifier really reports 1784 but UI shows 461; later solve-eqs really 1155 but UI shows 461. At nine/default/first it hides the final zero by showing the first solve-eqs count. Raw receipts are correct.
- MISLEADING: EngineReceipt.tsx:89 renders compressed consecutive diagnostic lines as `×count`, although start/done and stats headers are counted as separate entries, not necessarily tactic invocations. Say `count log entries`.
- ERROR: Chapter7.tsx:75 “every clause with at least two open literals” must restrict to unsatisfied clauses. E.g. [-15,-16] is satisfied by ¬q31 with one open literal.
- MINOR locator correction: Chapter8.tsx:133 P2 cores are §4.4, blockers §5.1; use §§4.4,5.1.
- MINOR locator correction: Chapter9.tsx:56 P14 arithmetic is §3.3, §4.3 covers compilation; add §3.3.
- MINOR: Chapter4.tsx:37 classical DPLL needs “most recent decision whose other branch is untried”, to handle exhausted branches.
- MINOR/MISLEADING: Chapter5.tsx:154 “says less” compares clauses ¬q27 and (q11∨¬q12), which are incomparable outside F; simply identify the additional lower-level literal instead.
- MINOR/MISLEADING: Z3Part.tsx:75 every figure “replays recorded evidence” is false for explicitly labelled illustrations and live assignment widgets; narrow the hero sentence.

Resolved tentative issues:
- Sinz s_i is exactly prefix OR under full EO; their AMO-only witness correctly shows the distinction. Do not call the EO example wrong.
- P7 §§2.3–2.5 are real section headings, in addition to similarly numbered examples/definitions. Locator confirmed.
- All eight graph ancestor cones, edges, UIPs, cuts and avoiding paths independently checked; all agree.
- Blocker is not a propagation reason in either recorded trace. CDCLPlayer’s overly broad “learned clause” classification may matter to experimental runs only; reproduce before reporting it.
- Core engine route claims are supported, including nine/default first’s final solve-eqs :num-exprs 0. No numerical receipt error found.
