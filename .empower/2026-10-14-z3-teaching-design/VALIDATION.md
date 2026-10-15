# Design validation results

- Reference first and uniqueness runs: every propagation reason replayed at enqueue boundary; every conflict falsified; every resolution pivot/resolvent recomputed.
- All 14 learned clauses independently entailed by the appropriate base CNF using Z3; blocked reference run reaches the empty clause at decision level zero.
- Independent permutation enumeration confirmed exactly one solution for each book board: five [5,3,1,4,2]; seven [3,1,6,2,4,7,5]; nine [6,2,4,7,1,3,9,5,8].
- Hall example under ¬q31: all six C cells in rows 1–2 impossible; six separate Z3 UNSAT checks passed. Pairwise input CNF has no unit clauses, so UP from ¬q31 alone adds no literals.
- Nine Z3 board/mode configurations, each with first SAT, incremental blocked UNSAT, fresh blocked UNSAT: 27 checks passed; saved placements matched.
- Validation harness initially passed a list plus a scalar to Solver.add; corrected by splitting them into separate calls. This did not affect the measurement or trace scripts.
