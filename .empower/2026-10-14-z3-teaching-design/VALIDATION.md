# Design validation results

- Reference first and uniqueness runs: every propagation reason replayed at enqueue boundary; every conflict falsified; every resolution pivot/resolvent recomputed.
- All 14 learned clauses independently entailed by the appropriate base CNF using Z3; blocked reference run reaches the empty clause at decision level zero.
- Independent permutation enumeration confirmed exactly one solution for each book board: five [5,3,1,4,2]; seven [3,1,6,2,4,7,5]; nine [6,2,4,7,1,3,9,5,8].
- Hall example under ¬q31: all six C cells in rows 1–2 impossible; six separate Z3 UNSAT checks passed. Pairwise input CNF has no unit clauses, so UP from ¬q31 alone adds no literals.
- Nine Z3 board/mode configurations, each with first SAT, incremental blocked UNSAT, fresh blocked UNSAT: 27 checks passed; saved placements matched.
- Validation harness initially passed a list plus a scalar to Solver.add; corrected by splitting them into separate calls. This did not affect the measurement or trace scripts.

- Exhaustively checked both sequential and specified commander encodings for every assignment at group sizes 1–9 (2,044 assignment/encoding checks): existential extension exists iff exactly one input true. Seven-row counts 22/18/20 verified; raw board CNF count 664 verified; region sizes [5, 4, 17, 16, 2, 3, 2].

```json
[
  {
    "n": 1,
    "pairwise": 1,
    "sequential": 1,
    "commander": 1,
    "commander_aux": 0
  },
  {
    "n": 2,
    "pairwise": 2,
    "sequential": 3,
    "commander": 2,
    "commander_aux": 0
  },
  {
    "n": 3,
    "pairwise": 4,
    "sequential": 6,
    "commander": 4,
    "commander_aux": 0
  },
  {
    "n": 4,
    "pairwise": 7,
    "sequential": 9,
    "commander": 11,
    "commander_aux": 2
  },
  {
    "n": 5,
    "pairwise": 11,
    "sequential": 12,
    "commander": 13,
    "commander_aux": 2
  },
  {
    "n": 6,
    "pairwise": 16,
    "sequential": 15,
    "commander": 16,
    "commander_aux": 2
  },
  {
    "n": 7,
    "pairwise": 22,
    "sequential": 18,
    "commander": 20,
    "commander_aux": 3
  },
  {
    "n": 8,
    "pairwise": 29,
    "sequential": 21,
    "commander": 22,
    "commander_aux": 3
  },
  {
    "n": 9,
    "pairwise": 37,
    "sequential": 24,
    "commander": 25,
    "commander_aux": 3
  }
]
```
