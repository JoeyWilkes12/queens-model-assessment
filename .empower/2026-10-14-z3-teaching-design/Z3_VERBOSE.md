# Z3 seven/default verbose=10

## stderr
```text
(simplifier :num-exprs 461 :num-asts 872 :time 0.00 :before-memory 17.32 :after-memory 17.32)
(simplifier :num-exprs 461 :num-asts 872 :time 0.00 :before-memory 18.00 :after-memory 18.00)
(propagate-values :num-exprs 461 :num-asts 872 :time 0.00 :before-memory 18.00 :after-memory 18.00)
(ctx-simplify :num-steps 3880)
(ctx-simplify :num-exprs 461 :num-asts 872 :time 0.00 :before-memory 18.00 :after-memory 18.09)
(simplifier :num-exprs 461 :num-asts 872 :time 0.00 :before-memory 18.09 :after-memory 18.09)
(solve-eqs :num-exprs 461 :num-asts 872 :time 0.00 :before-memory 18.09 :after-memory 18.09)
(lia2card :num-exprs 284 :num-asts 900 :time 0.00 :before-memory 18.09 :after-memory 18.09)
(elim-uncnstr :num-exprs 284 :num-asts 900 :time 0.00 :before-memory 18.09 :after-memory 18.09)
(simplifier :num-exprs 284 :num-asts 900 :time 0.00 :before-memory 18.09 :after-memory 18.09)
(ilp-model-finder-tactic start)
(ilp-model-finder-tactic done)
(pb-tactic start)
(pb2bv :num-exprs 1512 :num-asts 1678 :time 0.00 :before-memory 18.09 :after-memory 18.19)
(simplifier :num-exprs 1784 :num-asts 1716 :time 0.00 :before-memory 18.19 :after-memory 18.19)
(propagate-values :num-exprs 1186 :num-asts 1832 :time 0.00 :before-memory 18.19 :after-memory 18.19)
(solve-eqs :num-exprs 1155 :num-asts 1832 :time 0.00 :before-memory 18.19 :after-memory 18.19)
(:solve-eqs-elim-vars 27
 :solve-eqs-steps     27)
(max-bv-sharing :num-exprs 1155 :num-asts 1832 :time 0.00 :before-memory 18.19 :after-memory 18.19)
(bit-blast :num-exprs 1155 :num-asts 1832 :time 0.00 :before-memory 18.19 :after-memory 18.19)
(aig :num-exprs 816 :num-asts 2084 :time 0.00 :before-memory 18.19 :after-memory 18.32)
(ast-table :prev-capacity 532480 :capacity 532480 :size 1771)
(sat-status
  :inconsistent    false
  :vars            210
  :elim-vars       0
  :lits            1713
  :assigned        0
  :binary-clauses  567
  :ternary-clauses 157
  :clauses         27
  :del-clause      0
  :avg-clause-size 2.28
  :memory          18.37)
(sat.solver)
(sat.stats   :conflicts  :restarts       :learned/bin    :gc          :time)
(sat.stats          :decisions :clauses/bin     :units       :memory       )
(sat.stats      0      0    0   751/567     0/0   0       0    18.37   0.00)
 (sat-cleaner :elim-literals 0 :elim-clauses 0 :cost 579 :time 0.00)
(sat.stats      6     11    0   749/565     0/0 209       0    18.37   0.00)
(pb-tactic done)
(smt.simplify-begin :num-exprs 509)
(smt.propagate-values :num-exprs 510)
(smt.nnf-cnf :num-exprs 509)
(smt.reduce-asserted :num-exprs 509)
(smt.maximizing-bv-sharing :num-exprs 509)
(smt.reduce-asserted :num-exprs 509)
(smt.flatten-clauses :num-exprs 509)
(smt.simplifier-done :num-exprs 509)
(smt.searching)
(smt.stats :restarts     :decisions :clauses/bin/units      :simplify   :memory)
(smt.stats        :conflicts    :propagations       :lemmas      :deletions   )
(smt.stats    0      0      0      0   327/305/21       0/0     0    0   18.54)
(simplifier :num-exprs 509 :num-asts 1398 :time 0.00 :before-memory 19.44 :after-memory 19.44)
(simplifier :num-exprs 509 :num-asts 1398 :time 0.00 :before-memory 20.12 :after-memory 20.12)
(propagate-values :num-exprs 509 :num-asts 1398 :time 0.00 :before-memory 20.12 :after-memory 20.12)
(ctx-simplify :num-steps 4106)
(ctx-simplify :num-exprs 509 :num-asts 1398 :time 0.00 :before-memory 20.12 :after-memory 20.22)
(simplifier :num-exprs 509 :num-asts 1398 :time 0.00 :before-memory 20.22 :after-memory 20.22)
(solve-eqs :num-exprs 509 :num-asts 1398 :time 0.00 :before-memory 20.22 :after-memory 20.22)
(lia2card :num-exprs 332 :num-asts 1426 :time 0.00 :before-memory 20.22 :after-memory 20.22)
(elim-uncnstr :num-exprs 332 :num-asts 1426 :time 0.00 :before-memory 20.22 :after-memory 20.22)
(simplifier :num-exprs 332 :num-asts 1426 :time 0.00 :before-memory 20.22 :after-memory 20.22)
(ilp-model-finder-tactic start)
(ilp-model-finder-tactic done)
(pb-tactic start)
(pb2bv :num-exprs 1560 :num-asts 2196 :time 0.00 :before-memory 20.22 :after-memory 20.22)
(simplifier :num-exprs 1832 :num-asts 2247 :time 0.00 :before-memory 20.22 :after-memory 20.22)
(propagate-values :num-exprs 1230 :num-asts 2343 :time 0.00 :before-memory 20.22 :after-memory 20.22)
(solve-eqs :num-exprs 1199 :num-asts 2343 :time 0.00 :before-memory 20.22 :after-memory 20.22)
(:solve-eqs-elim-vars 27
 :solve-eqs-steps     27)
(max-bv-sharing :num-exprs 1199 :num-asts 2343 :time 0.00 :before-memory 20.22 :after-memory 20.22)
(bit-blast :num-exprs 1199 :num-asts 2343 :time 0.00 :before-memory 20.22 :after-memory 20.22)
(aig :num-exprs 837 :num-asts 2599 :time 0.00 :before-memory 20.22 :after-memory 20.22)
(ast-table :prev-capacity 532480 :capacity 532480 :size 2284)
(sat-status
  :inconsistent    false
  :vars            213
  :elim-vars       0
  :lits            1753
  :assigned        0
  :binary-clauses  575
  :ternary-clauses 159
  :clauses         27
  :del-clause      0
  :avg-clause-size 2.30
  :memory          20.36)
(sat.solver)
(sat.stats   :conflicts  :restarts       :learned/bin    :gc          :time)
(sat.stats          :decisions :clauses/bin     :units       :memory       )
(sat.stats      0      0    0   761/575     0/0   0       0    20.36   0.00)
 (sat-cleaner :elim-literals 0 :elim-clauses 0 :cost 603 :time 0.00)
(sat.stats      7     10    0   759/573     0/0 176       0    20.36   0.00)
(pb-tactic done)

```

## stdout
```json
{
  "z3": "Z3 4.16.0.0",
  "board": "seven",
  "mode": "default",
  "parameters": {
    "timeout": 30000,
    "verbose": 10,
    "clause_proof": false
  },
  "app_sha256": "6a310f59948e3fb576e66f39545309f169f90ce686444876cd78f736c8000954",
  "partition_sha256": "ca7a1dc2fc501e21e49cf21d5714789d983e36062df72d2ba466e3f6d7b17424",
  "regions": [
    [
      "A",
      "B",
      "B",
      "B",
      "B",
      "C",
      "C"
    ],
    [
      "A",
      "A",
      "A",
      "C",
      "C",
      "C",
      "C"
    ],
    [
      "A",
      "D",
      "D",
      "C",
      "C",
      "C",
      "C"
    ],
    [
      "D",
      "D",
      "D",
      "C",
      "C",
      "C",
      "C"
    ],
    [
      "D",
      "D",
      "D",
      "E",
      "E",
      "C",
      "F"
    ],
    [
      "D",
      "D",
      "D",
      "D",
      "C",
      "C",
      "F"
    ],
    [
      "D",
      "D",
      "D",
      "D",
      "G",
      "G",
      "F"
    ]
  ],
  "assertions": 333,
  "formula_sha256": "6f909e80d869c3a812f3e98b4e1567967d0e47aafcd25fe00a77c32a21be385a",
  "first": {
    "result": "sat",
    "elapsed_s": 0.004757458998938091,
    "statistics": {
      "solve-eqs-steps": 27,
      "solve-eqs-elim-vars": 27,
      "sat mk clause 2ary": 567,
      "sat mk clause nary": 184,
      "sat mk var": 210,
      "sat conflicts": 6,
      "sat decisions": 11,
      "sat propagations 2ary": 277,
      "sat propagations nary": 151,
      "sat units": 160,
      "sat backjumps": 6,
      "num allocs": 422723,
      "rlimit count": 29946,
      "max memory": 26.49,
      "memory": 18.25,
      "time": 0.004
    },
    "reason_unknown": null
  },
  "model_columns": [
    3,
    1,
    6,
    2,
    4,
    7,
    5
  ],
  "matches_saved_solution": true,
  "blocker": "Or(cell_0_0 != False,\n   cell_0_1 != False,\n   cell_0_2 != True,\n   cell_0_3 != False,\n   cell_0_4 != False,\n   cell_0_5 != False,\n   cell_0_6 != False,\n   cell_1_0 != True,\n   cell_1_1 != False,\n   cell_1_2 != False,\n   cell_1_3 != False,\n   cell_1_4 != False,\n   cell_1_5 != False,\n   cell_1_6 != False,\n   cell_2_0 != False,\n   cell_2_1 != False,\n   cell_2_2 != False,\n   cell_2_3 != False,\n   cell_2_4 != False,\n   cell_2_5 != True,\n   cell_2_6 != False,\n   cell_3_0 != False,\n   cell_3_1 != True,\n   cell_3_2 != False,\n   cell_3_3 != False,\n   cell_3_4 != False,\n   cell_3_5 != False,\n   cell_3_6 != False,\n   cell_4_0 != False,\n   cell_4_1 != False,\n   cell_4_2 != False,\n   cell_4_3 != True,\n   cell_4_4 != False,\n   cell_4_5 != False,\n   cell_4_6 != False,\n   cell_5_0 != False,\n   cell_5_1 != False,\n   cell_5_2 != False,\n   cell_5_3 != False,\n   cell_5_4 != False,\n   cell_5_5 != False,\n   cell_5_6 != True,\n   cell_6_0 != False,\n   cell_6_1 != False,\n   cell_6_2 != False,\n   cell_6_3 != False,\n   cell_6_4 != True,\n   cell_6_5 != False,\n   cell_6_6 != False)",
  "incremental_blocked": {
    "result": "unsat",
    "elapsed_s": 0.007173833000706509,
    "statistics": {
      "conflicts": 96,
      "decisions": 266,
      "propagations": 2245,
      "binary propagations": 2002,
      "added eqs": 3409,
      "mk clause": 678,
      "mk clause binary": 378,
      "del clause": 653,
      "minimized lits": 56,
      "num checks": 1,
      "mk bool var": 2214,
      "arith eq adapter": 1434,
      "arith-lower": 1508,
      "arith-upper": 800,
      "arith-fixed-eqs": 1,
      "arith-conflicts": 39,
      "arith-bound-propagations-lp": 156,
      "arith-diseq": 582,
      "arith-make-feasible": 480,
      "arith-max-columns": 74,
      "arith-max-rows": 21,
      "num allocs": 722103,
      "rlimit count": 60660,
      "max memory": 26.49,
      "memory": 18.93,
      "time": 0.007
    },
    "reason_unknown": null
  },
  "callback_events_first": null,
  "callback_events_incremental": null,
  "fresh_blocked": {
    "result": "unsat",
    "elapsed_s": 0.004544957999314647,
    "statistics": {
      "solve-eqs-steps": 27,
      "solve-eqs-elim-vars": 27,
      "sat mk clause 2ary": 575,
      "sat mk clause nary": 186,
      "sat mk var": 213,
      "sat conflicts": 7,
      "sat decisions": 10,
      "sat propagations 2ary": 258,
      "sat propagations nary": 143,
      "sat units": 162,
      "sat backjumps": 6,
      "num allocs": 1864617,
      "rlimit count": 91065,
      "max memory": 28.48,
      "memory": 20.21,
      "time": 0.004
    },
    "reason_unknown": null
  },
  "clause_events": null
}

```
