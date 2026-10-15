# Diagnostic run with clause_proof and tactic snapshots

```text

```

```json
{
  "z3": "Z3 4.16.0.0",
  "board": "five",
  "mode": "default",
  "parameters": {
    "timeout": 30000,
    "verbose": 0,
    "clause_proof": true
  },
  "app_sha256": "6a310f59948e3fb576e66f39545309f169f90ce686444876cd78f736c8000954",
  "partition_sha256": "e4e767a7d4a15b53082b1619c3b5dc02e11b4f60558da5888dbbfe4ebe917b90",
  "regions": [
    [
      "A",
      "A",
      "B",
      "B",
      "C"
    ],
    [
      "A",
      "B",
      "B",
      "D",
      "D"
    ],
    [
      "A",
      "E",
      "B",
      "D",
      "D"
    ],
    [
      "A",
      "E",
      "D",
      "D",
      "D"
    ],
    [
      "E",
      "E",
      "D",
      "D",
      "D"
    ]
  ],
  "assertions": 159,
  "formula_sha256": "4e39c7ebf4578674d13be50d150cd91d54e2e125713268b1a938aabe93f30072",
  "first": {
    "result": "sat",
    "elapsed_s": 0.232763125000929,
    "statistics": {
      "conflicts": 6,
      "decisions": 9,
      "propagations": 149,
      "binary propagations": 145,
      "final checks": 1,
      "added eqs": 255,
      "mk clause": 81,
      "mk clause binary": 160,
      "del clause": 60,
      "minimized lits": 3,
      "num checks": 1,
      "mk bool var": 239,
      "arith eq adapter": 69,
      "arith-lower": 68,
      "arith-upper": 68,
      "arith-conflicts": 5,
      "arith-make-feasible": 25,
      "arith-max-columns": 39,
      "arith-max-rows": 14,
      "arith-fixed-eqs": 14,
      "num allocs": 94406,
      "rlimit count": 5464,
      "max memory": 17.78,
      "memory": 17.78,
      "time": 0.232
    },
    "reason_unknown": null
  },
  "model_columns": [
    5,
    3,
    1,
    4,
    2
  ],
  "matches_saved_solution": true,
  "blocker": "Or(cell_0_0 != False,\n   cell_0_1 != False,\n   cell_0_2 != False,\n   cell_0_3 != False,\n   cell_0_4 != True,\n   cell_1_0 != False,\n   cell_1_1 != False,\n   cell_1_2 != True,\n   cell_1_3 != False,\n   cell_1_4 != False,\n   cell_2_0 != True,\n   cell_2_1 != False,\n   cell_2_2 != False,\n   cell_2_3 != False,\n   cell_2_4 != False,\n   cell_3_0 != False,\n   cell_3_1 != False,\n   cell_3_2 != False,\n   cell_3_3 != True,\n   cell_3_4 != False,\n   cell_4_0 != False,\n   cell_4_1 != True,\n   cell_4_2 != False,\n   cell_4_3 != False,\n   cell_4_4 != False)",
  "incremental_blocked": {
    "result": "unsat",
    "elapsed_s": 0.18167562499729684,
    "statistics": {
      "conflicts": 14,
      "decisions": 21,
      "propagations": 235,
      "binary propagations": 226,
      "final checks": 1,
      "added eqs": 423,
      "mk clause": 136,
      "mk clause binary": 174,
      "del clause": 135,
      "minimized lits": 18,
      "num checks": 2,
      "mk bool var": 353,
      "arith eq adapter": 130,
      "arith-lower": 119,
      "arith-upper": 99,
      "arith-conflicts": 5,
      "arith-bound-propagations-lp": 10,
      "arith-diseq": 31,
      "arith-make-feasible": 41,
      "arith-max-columns": 39,
      "arith-max-rows": 14,
      "arith-fixed-eqs": 37,
      "num allocs": 140028,
      "rlimit count": 6662,
      "max memory": 18.02,
      "memory": 18.02,
      "time": 0.181
    },
    "reason_unknown": null
  },
  "callback_events_first": 716,
  "callback_events_incremental": 470,
  "fresh_blocked": {
    "result": "unsat",
    "elapsed_s": 0.0024774999983492307,
    "statistics": {
      "solve-eqs-steps": 4,
      "solve-eqs-elim-vars": 4,
      "sat mk clause 2ary": 149,
      "sat mk clause nary": 42,
      "sat mk var": 55,
      "sat del clause": 1,
      "sat conflicts": 6,
      "sat decisions": 9,
      "sat propagations 2ary": 99,
      "sat propagations nary": 25,
      "sat units": 8,
      "sat backjumps": 5,
      "sat elim literals": 1,
      "num allocs": 539781,
      "rlimit count": 19227,
      "max memory": 27.43,
      "memory": 19.21,
      "time": 0.002
    },
    "reason_unknown": null
  },
  "clause_events": [
    {
      "proof": "tseitin(Not(cell_0_2), 1 == If(cell_0_2, 1, 0))",
      "dependencies": [],
      "clause": [
        "Not(cell_0_2)",
        "1 == If(cell_0_2, 1, 0)"
      ]
    },
    {
      "proof": "tseitin(Not(cell_0_2), 1 == If(cell_0_2, 1, 0))",
      "dependencies": [],
      "clause": [
        "Not(cell_0_2)",
        "1 == If(cell_0_2, 1, 0)"
      ]
    },
    {
      "proof": "tseitin(cell_0_2, 0 == If(cell_0_2, 1, 0))",
      "dependencies": [],
      "clause": [
        "cell_0_2",
        "0 == If(cell_0_2, 1, 0)"
      ]
    },
    {
      "proof": "tseitin(cell_0_2, 0 == If(cell_0_2, 1, 0))",
      "dependencies": [],
      "clause": [
        "cell_0_2",
        "0 == If(cell_0_2, 1, 0)"
      ]
    },
    {
      "proof": "tseitin(Not(cell_0_0), 1 == If(cell_0_0, 1, 0))",
      "dependencies": [],
      "clause": [
        "Not(cell_0_0)",
        "1 == If(cell_0_0, 1, 0)"
      ]
    },
    {
      "proof": "tseitin(Not(cell_0_0), 1 == If(cell_0_0, 1, 0))",
      "dependencies": [],
      "clause": [
        "Not(cell_0_0)",
        "1 == If(cell_0_0, 1, 0)"
      ]
    },
    {
      "proof": "tseitin(cell_0_0, 0 == If(cell_0_0, 1, 0))",
      "dependencies": [],
      "clause": [
        "cell_0_0",
        "0 == If(cell_0_0, 1, 0)"
      ]
    },
    {
      "proof": "tseitin(cell_0_0, 0 == If(cell_0_0, 1, 0))",
      "dependencies": [],
      "clause": [
        "cell_0_0",
        "0 == If(cell_0_0, 1, 0)"
      ]
    },
    {
      "proof": "tseitin(Not(cell_0_1), 1 == If(cell_0_1, 1, 0))",
      "dependencies": [],
      "clause": [
        "Not(cell_0_1)",
        "1 == If(cell_0_1, 1, 0)"
      ]
    },
    {
      "proof": "tseitin(Not(cell_0_1), 1 == If(cell_0_1, 1, 0))",
      "dependencies": [],
      "clause": [
        "Not(cell_0_1)",
        "1 == If(cell_0_1, 1, 0)"
      ]
    },
    {
      "proof": "tseitin(cell_0_1, 0 == If(cell_0_1, 1, 0))",
      "dependencies": [],
      "clause": [
        "cell_0_1",
        "0 == If(cell_0_1, 1, 0)"
      ]
    },
    {
      "proof": "tseitin(cell_0_1, 0 == If(cell_0_1, 1, 0))",
      "dependencies": [],
      "clause": [
        "cell_0_1",
        "0 == If(cell_0_1, 1, 0)"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(0 ==\n    If(cell_0_0, 1, 0) +\n    If(cell_0_1, 1, 0) +\n    If(cell_0_2, 1, 0))",
        "If(cell_0_0, 1, 0) + If(cell_0_1, 1, 0) + If(cell_0_2, 1, 0) <=\n0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(0 ==\n    If(cell_0_0, 1, 0) +\n    If(cell_0_1, 1, 0) +\n    If(cell_0_2, 1, 0))",
        "If(cell_0_0, 1, 0) + If(cell_0_1, 1, 0) + If(cell_0_2, 1, 0) <=\n0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(0 ==\n    If(cell_0_0, 1, 0) +\n    If(cell_0_1, 1, 0) +\n    If(cell_0_2, 1, 0))",
        "If(cell_0_0, 1, 0) + If(cell_0_1, 1, 0) + If(cell_0_2, 1, 0) >=\n0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(0 ==\n    If(cell_0_0, 1, 0) +\n    If(cell_0_1, 1, 0) +\n    If(cell_0_2, 1, 0))",
        "If(cell_0_0, 1, 0) + If(cell_0_1, 1, 0) + If(cell_0_2, 1, 0) >=\n0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "0 ==\nIf(cell_0_0, 1, 0) + If(cell_0_1, 1, 0) + If(cell_0_2, 1, 0)",
        "Not(If(cell_0_0, 1, 0) +\n    If(cell_0_1, 1, 0) +\n    If(cell_0_2, 1, 0) <=\n    0)",
        "Not(If(cell_0_0, 1, 0) +\n    If(cell_0_1, 1, 0) +\n    If(cell_0_2, 1, 0) >=\n    0)"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "0 ==\nIf(cell_0_0, 1, 0) + If(cell_0_1, 1, 0) + If(cell_0_2, 1, 0)",
        "Not(If(cell_0_0, 1, 0) +\n    If(cell_0_1, 1, 0) +\n    If(cell_0_2, 1, 0) <=\n    0)",
        "Not(If(cell_0_0, 1, 0) +\n    If(cell_0_1, 1, 0) +\n    If(cell_0_2, 1, 0) >=\n    0)"
      ]
    },
    {
      "proof": "assumption",
      "dependencies": [],
      "clause": [
        "If(cell_0_0, 1, 0) + If(cell_0_1, 1, 0) + If(cell_0_2, 1, 0) ==\n0"
      ]
    },
    {
      "proof": "tseitin(Not(cell_1_2), 1 == If(cell_1_2, 1, 0))",
      "dependencies": [],
      "clause": [
        "Not(cell_1_2)",
        "1 == If(cell_1_2, 1, 0)"
      ]
    },
    {
      "proof": "tseitin(Not(cell_1_2), 1 == If(cell_1_2, 1, 0))",
      "dependencies": [],
      "clause": [
        "Not(cell_1_2)",
        "1 == If(cell_1_2, 1, 0)"
      ]
    },
    {
      "proof": "tseitin(cell_1_2, 0 == If(cell_1_2, 1, 0))",
      "dependencies": [],
      "clause": [
        "cell_1_2",
        "0 == If(cell_1_2, 1, 0)"
      ]
    },
    {
      "proof": "tseitin(cell_1_2, 0 == If(cell_1_2, 1, 0))",
      "dependencies": [],
      "clause": [
        "cell_1_2",
        "0 == If(cell_1_2, 1, 0)"
      ]
    },
    {
      "proof": "tseitin(Not(cell_1_0), 1 == If(cell_1_0, 1, 0))",
      "dependencies": [],
      "clause": [
        "Not(cell_1_0)",
        "1 == If(cell_1_0, 1, 0)"
      ]
    },
    {
      "proof": "tseitin(Not(cell_1_0), 1 == If(cell_1_0, 1, 0))",
      "dependencies": [],
      "clause": [
        "Not(cell_1_0)",
        "1 == If(cell_1_0, 1, 0)"
      ]
    },
    {
      "proof": "tseitin(cell_1_0, 0 == If(cell_1_0, 1, 0))",
      "dependencies": [],
      "clause": [
        "cell_1_0",
        "0 == If(cell_1_0, 1, 0)"
      ]
    },
    {
      "proof": "tseitin(cell_1_0, 0 == If(cell_1_0, 1, 0))",
      "dependencies": [],
      "clause": [
        "cell_1_0",
        "0 == If(cell_1_0, 1, 0)"
      ]
    },
    {
      "proof": "tseitin(Not(cell_1_1), 1 == If(cell_1_1, 1, 0))",
      "dependencies": [],
      "clause": [
        "Not(cell_1_1)",
        "1 == If(cell_1_1, 1, 0)"
      ]
    },
    {
      "proof": "tseitin(Not(cell_1_1), 1 == If(cell_1_1, 1, 0))",
      "dependencies": [],
      "clause": [
        "Not(cell_1_1)",
        "1 == If(cell_1_1, 1, 0)"
      ]
    },
    {
      "proof": "tseitin(cell_1_1, 0 == If(cell_1_1, 1, 0))",
      "dependencies": [],
      "clause": [
        "cell_1_1",
        "0 == If(cell_1_1, 1, 0)"
      ]
    },
    {
      "proof": "tseitin(cell_1_1, 0 == If(cell_1_1, 1, 0))",
      "dependencies": [],
      "clause": [
        "cell_1_1",
        "0 == If(cell_1_1, 1, 0)"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(1 ==\n    If(cell_1_0, 1, 0) +\n    If(cell_1_1, 1, 0) +\n    If(cell_1_2, 1, 0))",
        "If(cell_1_0, 1, 0) + If(cell_1_1, 1, 0) + If(cell_1_2, 1, 0) <=\n1"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(1 ==\n    If(cell_1_0, 1, 0) +\n    If(cell_1_1, 1, 0) +\n    If(cell_1_2, 1, 0))",
        "If(cell_1_0, 1, 0) + If(cell_1_1, 1, 0) + If(cell_1_2, 1, 0) <=\n1"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(1 ==\n    If(cell_1_0, 1, 0) +\n    If(cell_1_1, 1, 0) +\n    If(cell_1_2, 1, 0))",
        "If(cell_1_0, 1, 0) + If(cell_1_1, 1, 0) + If(cell_1_2, 1, 0) >=\n1"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(1 ==\n    If(cell_1_0, 1, 0) +\n    If(cell_1_1, 1, 0) +\n    If(cell_1_2, 1, 0))",
        "If(cell_1_0, 1, 0) + If(cell_1_1, 1, 0) + If(cell_1_2, 1, 0) >=\n1"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "1 ==\nIf(cell_1_0, 1, 0) + If(cell_1_1, 1, 0) + If(cell_1_2, 1, 0)",
        "Not(If(cell_1_0, 1, 0) +\n    If(cell_1_1, 1, 0) +\n    If(cell_1_2, 1, 0) <=\n    1)",
        "Not(If(cell_1_0, 1, 0) +\n    If(cell_1_1, 1, 0) +\n    If(cell_1_2, 1, 0) >=\n    1)"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "1 ==\nIf(cell_1_0, 1, 0) + If(cell_1_1, 1, 0) + If(cell_1_2, 1, 0)",
        "Not(If(cell_1_0, 1, 0) +\n    If(cell_1_1, 1, 0) +\n    If(cell_1_2, 1, 0) <=\n    1)",
        "Not(If(cell_1_0, 1, 0) +\n    If(cell_1_1, 1, 0) +\n    If(cell_1_2, 1, 0) >=\n    1)"
      ]
    },
    {
      "proof": "assumption",
      "dependencies": [],
      "clause": [
        "If(cell_1_0, 1, 0) + If(cell_1_1, 1, 0) + If(cell_1_2, 1, 0) ==\n1"
      ]
    },
    {
      "proof": "tseitin(Not(cell_2_4), 1 == If(cell_2_4, 1, 0))",
      "dependencies": [],
      "clause": [
        "Not(cell_2_4)",
        "1 == If(cell_2_4, 1, 0)"
      ]
    },
    {
      "proof": "tseitin(Not(cell_2_4), 1 == If(cell_2_4, 1, 0))",
      "dependencies": [],
      "clause": [
        "Not(cell_2_4)",
        "1 == If(cell_2_4, 1, 0)"
      ]
    },
    {
      "proof": "tseitin(cell_2_4, 0 == If(cell_2_4, 1, 0))",
      "dependencies": [],
      "clause": [
        "cell_2_4",
        "0 == If(cell_2_4, 1, 0)"
      ]
    },
    {
      "proof": "tseitin(cell_2_4, 0 == If(cell_2_4, 1, 0))",
      "dependencies": [],
      "clause": [
        "cell_2_4",
        "0 == If(cell_2_4, 1, 0)"
      ]
    },
    {
      "proof": "tseitin(Not(cell_2_0), 1 == If(cell_2_0, 1, 0))",
      "dependencies": [],
      "clause": [
        "Not(cell_2_0)",
        "1 == If(cell_2_0, 1, 0)"
      ]
    },
    {
      "proof": "tseitin(Not(cell_2_0), 1 == If(cell_2_0, 1, 0))",
      "dependencies": [],
      "clause": [
        "Not(cell_2_0)",
        "1 == If(cell_2_0, 1, 0)"
      ]
    },
    {
      "proof": "tseitin(cell_2_0, 0 == If(cell_2_0, 1, 0))",
      "dependencies": [],
      "clause": [
        "cell_2_0",
        "0 == If(cell_2_0, 1, 0)"
      ]
    },
    {
      "proof": "tseitin(cell_2_0, 0 == If(cell_2_0, 1, 0))",
      "dependencies": [],
      "clause": [
        "cell_2_0",
        "0 == If(cell_2_0, 1, 0)"
      ]
    },
    {
      "proof": "tseitin(Not(cell_2_1), 1 == If(cell_2_1, 1, 0))",
      "dependencies": [],
      "clause": [
        "Not(cell_2_1)",
        "1 == If(cell_2_1, 1, 0)"
      ]
    },
    {
      "proof": "tseitin(Not(cell_2_1), 1 == If(cell_2_1, 1, 0))",
      "dependencies": [],
      "clause": [
        "Not(cell_2_1)",
        "1 == If(cell_2_1, 1, 0)"
      ]
    },
    {
      "proof": "tseitin(cell_2_1, 0 == If(cell_2_1, 1, 0))",
      "dependencies": [],
      "clause": [
        "cell_2_1",
        "0 == If(cell_2_1, 1, 0)"
      ]
    },
    {
      "proof": "tseitin(cell_2_1, 0 == If(cell_2_1, 1, 0))",
      "dependencies": [],
      "clause": [
        "cell_2_1",
        "0 == If(cell_2_1, 1, 0)"
      ]
    },
    {
      "proof": "tseitin(Not(cell_2_2), 1 == If(cell_2_2, 1, 0))",
      "dependencies": [],
      "clause": [
        "Not(cell_2_2)",
        "1 == If(cell_2_2, 1, 0)"
      ]
    },
    {
      "proof": "tseitin(Not(cell_2_2), 1 == If(cell_2_2, 1, 0))",
      "dependencies": [],
      "clause": [
        "Not(cell_2_2)",
        "1 == If(cell_2_2, 1, 0)"
      ]
    },
    {
      "proof": "tseitin(cell_2_2, 0 == If(cell_2_2, 1, 0))",
      "dependencies": [],
      "clause": [
        "cell_2_2",
        "0 == If(cell_2_2, 1, 0)"
      ]
    },
    {
      "proof": "tseitin(cell_2_2, 0 == If(cell_2_2, 1, 0))",
      "dependencies": [],
      "clause": [
        "cell_2_2",
        "0 == If(cell_2_2, 1, 0)"
      ]
    },
    {
      "proof": "tseitin(Not(cell_2_3), 1 == If(cell_2_3, 1, 0))",
      "dependencies": [],
      "clause": [
        "Not(cell_2_3)",
        "1 == If(cell_2_3, 1, 0)"
      ]
    },
    {
      "proof": "tseitin(Not(cell_2_3), 1 == If(cell_2_3, 1, 0))",
      "dependencies": [],
      "clause": [
        "Not(cell_2_3)",
        "1 == If(cell_2_3, 1, 0)"
      ]
    },
    {
      "proof": "tseitin(cell_2_3, 0 == If(cell_2_3, 1, 0))",
      "dependencies": [],
      "clause": [
        "cell_2_3",
        "0 == If(cell_2_3, 1, 0)"
      ]
    },
    {
      "proof": "tseitin(cell_2_3, 0 == If(cell_2_3, 1, 0))",
      "dependencies": [],
      "clause": [
        "cell_2_3",
        "0 == If(cell_2_3, 1, 0)"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(1 ==\n    If(cell_2_0, 1, 0) +\n    If(cell_2_1, 1, 0) +\n    If(cell_2_2, 1, 0) +\n    If(cell_2_3, 1, 0) +\n    If(cell_2_4, 1, 0))",
        "If(cell_2_0, 1, 0) +\nIf(cell_2_1, 1, 0) +\nIf(cell_2_2, 1, 0) +\nIf(cell_2_3, 1, 0) +\nIf(cell_2_4, 1, 0) <=\n1"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(1 ==\n    If(cell_2_0, 1, 0) +\n    If(cell_2_1, 1, 0) +\n    If(cell_2_2, 1, 0) +\n    If(cell_2_3, 1, 0) +\n    If(cell_2_4, 1, 0))",
        "If(cell_2_0, 1, 0) +\nIf(cell_2_1, 1, 0) +\nIf(cell_2_2, 1, 0) +\nIf(cell_2_3, 1, 0) +\nIf(cell_2_4, 1, 0) <=\n1"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(1 ==\n    If(cell_2_0, 1, 0) +\n    If(cell_2_1, 1, 0) +\n    If(cell_2_2, 1, 0) +\n    If(cell_2_3, 1, 0) +\n    If(cell_2_4, 1, 0))",
        "If(cell_2_0, 1, 0) +\nIf(cell_2_1, 1, 0) +\nIf(cell_2_2, 1, 0) +\nIf(cell_2_3, 1, 0) +\nIf(cell_2_4, 1, 0) >=\n1"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(1 ==\n    If(cell_2_0, 1, 0) +\n    If(cell_2_1, 1, 0) +\n    If(cell_2_2, 1, 0) +\n    If(cell_2_3, 1, 0) +\n    If(cell_2_4, 1, 0))",
        "If(cell_2_0, 1, 0) +\nIf(cell_2_1, 1, 0) +\nIf(cell_2_2, 1, 0) +\nIf(cell_2_3, 1, 0) +\nIf(cell_2_4, 1, 0) >=\n1"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "1 ==\nIf(cell_2_0, 1, 0) +\nIf(cell_2_1, 1, 0) +\nIf(cell_2_2, 1, 0) +\nIf(cell_2_3, 1, 0) +\nIf(cell_2_4, 1, 0)",
        "Not(If(cell_2_0, 1, 0) +\n    If(cell_2_1, 1, 0) +\n    If(cell_2_2, 1, 0) +\n    If(cell_2_3, 1, 0) +\n    If(cell_2_4, 1, 0) <=\n    1)",
        "Not(If(cell_2_0, 1, 0) +\n    If(cell_2_1, 1, 0) +\n    If(cell_2_2, 1, 0) +\n    If(cell_2_3, 1, 0) +\n    If(cell_2_4, 1, 0) >=\n    1)"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "1 ==\nIf(cell_2_0, 1, 0) +\nIf(cell_2_1, 1, 0) +\nIf(cell_2_2, 1, 0) +\nIf(cell_2_3, 1, 0) +\nIf(cell_2_4, 1, 0)",
        "Not(If(cell_2_0, 1, 0) +\n    If(cell_2_1, 1, 0) +\n    If(cell_2_2, 1, 0) +\n    If(cell_2_3, 1, 0) +\n    If(cell_2_4, 1, 0) <=\n    1)",
        "Not(If(cell_2_0, 1, 0) +\n    If(cell_2_1, 1, 0) +\n    If(cell_2_2, 1, 0) +\n    If(cell_2_3, 1, 0) +\n    If(cell_2_4, 1, 0) >=\n    1)"
      ]
    },
    {
      "proof": "assumption",
      "dependencies": [],
      "clause": [
        "If(cell_2_0, 1, 0) +\nIf(cell_2_1, 1, 0) +\nIf(cell_2_2, 1, 0) +\nIf(cell_2_3, 1, 0) +\nIf(cell_2_4, 1, 0) ==\n1"
      ]
    },
    {
      "proof": "tseitin(Not(cell_3_4), 1 == If(cell_3_4, 1, 0))",
      "dependencies": [],
      "clause": [
        "Not(cell_3_4)",
        "1 == If(cell_3_4, 1, 0)"
      ]
    },
    {
      "proof": "tseitin(Not(cell_3_4), 1 == If(cell_3_4, 1, 0))",
      "dependencies": [],
      "clause": [
        "Not(cell_3_4)",
        "1 == If(cell_3_4, 1, 0)"
      ]
    },
    {
      "proof": "tseitin(cell_3_4, 0 == If(cell_3_4, 1, 0))",
      "dependencies": [],
      "clause": [
        "cell_3_4",
        "0 == If(cell_3_4, 1, 0)"
      ]
    },
    {
      "proof": "tseitin(cell_3_4, 0 == If(cell_3_4, 1, 0))",
      "dependencies": [],
      "clause": [
        "cell_3_4",
        "0 == If(cell_3_4, 1, 0)"
      ]
    },
    {
      "proof": "tseitin(Not(cell_3_0), 1 == If(cell_3_0, 1, 0))",
      "dependencies": [],
      "clause": [
        "Not(cell_3_0)",
        "1 == If(cell_3_0, 1, 0)"
      ]
    },
    {
      "proof": "tseitin(Not(cell_3_0), 1 == If(cell_3_0, 1, 0))",
      "dependencies": [],
      "clause": [
        "Not(cell_3_0)",
        "1 == If(cell_3_0, 1, 0)"
      ]
    },
    {
      "proof": "tseitin(cell_3_0, 0 == If(cell_3_0, 1, 0))",
      "dependencies": [],
      "clause": [
        "cell_3_0",
        "0 == If(cell_3_0, 1, 0)"
      ]
    },
    {
      "proof": "tseitin(cell_3_0, 0 == If(cell_3_0, 1, 0))",
      "dependencies": [],
      "clause": [
        "cell_3_0",
        "0 == If(cell_3_0, 1, 0)"
      ]
    },
    {
      "proof": "tseitin(Not(cell_3_1), 1 == If(cell_3_1, 1, 0))",
      "dependencies": [],
      "clause": [
        "Not(cell_3_1)",
        "1 == If(cell_3_1, 1, 0)"
      ]
    },
    {
      "proof": "tseitin(Not(cell_3_1), 1 == If(cell_3_1, 1, 0))",
      "dependencies": [],
      "clause": [
        "Not(cell_3_1)",
        "1 == If(cell_3_1, 1, 0)"
      ]
    },
    {
      "proof": "tseitin(cell_3_1, 0 == If(cell_3_1, 1, 0))",
      "dependencies": [],
      "clause": [
        "cell_3_1",
        "0 == If(cell_3_1, 1, 0)"
      ]
    },
    {
      "proof": "tseitin(cell_3_1, 0 == If(cell_3_1, 1, 0))",
      "dependencies": [],
      "clause": [
        "cell_3_1",
        "0 == If(cell_3_1, 1, 0)"
      ]
    },
    {
      "proof": "tseitin(Not(cell_3_2), 1 == If(cell_3_2, 1, 0))",
      "dependencies": [],
      "clause": [
        "Not(cell_3_2)",
        "1 == If(cell_3_2, 1, 0)"
      ]
    },
    {
      "proof": "tseitin(Not(cell_3_2), 1 == If(cell_3_2, 1, 0))",
      "dependencies": [],
      "clause": [
        "Not(cell_3_2)",
        "1 == If(cell_3_2, 1, 0)"
      ]
    },
    {
      "proof": "tseitin(cell_3_2, 0 == If(cell_3_2, 1, 0))",
      "dependencies": [],
      "clause": [
        "cell_3_2",
        "0 == If(cell_3_2, 1, 0)"
      ]
    },
    {
      "proof": "tseitin(cell_3_2, 0 == If(cell_3_2, 1, 0))",
      "dependencies": [],
      "clause": [
        "cell_3_2",
        "0 == If(cell_3_2, 1, 0)"
      ]
    },
    {
      "proof": "tseitin(Not(cell_3_3), 1 == If(cell_3_3, 1, 0))",
      "dependencies": [],
      "clause": [
        "Not(cell_3_3)",
        "1 == If(cell_3_3, 1, 0)"
      ]
    },
    {
      "proof": "tseitin(Not(cell_3_3), 1 == If(cell_3_3, 1, 0))",
      "dependencies": [],
      "clause": [
        "Not(cell_3_3)",
        "1 == If(cell_3_3, 1, 0)"
      ]
    },
    {
      "proof": "tseitin(cell_3_3, 0 == If(cell_3_3, 1, 0))",
      "dependencies": [],
      "clause": [
        "cell_3_3",
        "0 == If(cell_3_3, 1, 0)"
      ]
    },
    {
      "proof": "tseitin(cell_3_3, 0 == If(cell_3_3, 1, 0))",
      "dependencies": [],
      "clause": [
        "cell_3_3",
        "0 == If(cell_3_3, 1, 0)"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(1 ==\n    If(cell_3_0, 1, 0) +\n    If(cell_3_1, 1, 0) +\n    If(cell_3_2, 1, 0) +\n    If(cell_3_3, 1, 0) +\n    If(cell_3_4, 1, 0))",
        "If(cell_3_0, 1, 0) +\nIf(cell_3_1, 1, 0) +\nIf(cell_3_2, 1, 0) +\nIf(cell_3_3, 1, 0) +\nIf(cell_3_4, 1, 0) <=\n1"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(1 ==\n    If(cell_3_0, 1, 0) +\n    If(cell_3_1, 1, 0) +\n    If(cell_3_2, 1, 0) +\n    If(cell_3_3, 1, 0) +\n    If(cell_3_4, 1, 0))",
        "If(cell_3_0, 1, 0) +\nIf(cell_3_1, 1, 0) +\nIf(cell_3_2, 1, 0) +\nIf(cell_3_3, 1, 0) +\nIf(cell_3_4, 1, 0) <=\n1"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(1 ==\n    If(cell_3_0, 1, 0) +\n    If(cell_3_1, 1, 0) +\n    If(cell_3_2, 1, 0) +\n    If(cell_3_3, 1, 0) +\n    If(cell_3_4, 1, 0))",
        "If(cell_3_0, 1, 0) +\nIf(cell_3_1, 1, 0) +\nIf(cell_3_2, 1, 0) +\nIf(cell_3_3, 1, 0) +\nIf(cell_3_4, 1, 0) >=\n1"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(1 ==\n    If(cell_3_0, 1, 0) +\n    If(cell_3_1, 1, 0) +\n    If(cell_3_2, 1, 0) +\n    If(cell_3_3, 1, 0) +\n    If(cell_3_4, 1, 0))",
        "If(cell_3_0, 1, 0) +\nIf(cell_3_1, 1, 0) +\nIf(cell_3_2, 1, 0) +\nIf(cell_3_3, 1, 0) +\nIf(cell_3_4, 1, 0) >=\n1"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "1 ==\nIf(cell_3_0, 1, 0) +\nIf(cell_3_1, 1, 0) +\nIf(cell_3_2, 1, 0) +\nIf(cell_3_3, 1, 0) +\nIf(cell_3_4, 1, 0)",
        "Not(If(cell_3_0, 1, 0) +\n    If(cell_3_1, 1, 0) +\n    If(cell_3_2, 1, 0) +\n    If(cell_3_3, 1, 0) +\n    If(cell_3_4, 1, 0) <=\n    1)",
        "Not(If(cell_3_0, 1, 0) +\n    If(cell_3_1, 1, 0) +\n    If(cell_3_2, 1, 0) +\n    If(cell_3_3, 1, 0) +\n    If(cell_3_4, 1, 0) >=\n    1)"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "1 ==\nIf(cell_3_0, 1, 0) +\nIf(cell_3_1, 1, 0) +\nIf(cell_3_2, 1, 0) +\nIf(cell_3_3, 1, 0) +\nIf(cell_3_4, 1, 0)",
        "Not(If(cell_3_0, 1, 0) +\n    If(cell_3_1, 1, 0) +\n    If(cell_3_2, 1, 0) +\n    If(cell_3_3, 1, 0) +\n    If(cell_3_4, 1, 0) <=\n    1)",
        "Not(If(cell_3_0, 1, 0) +\n    If(cell_3_1, 1, 0) +\n    If(cell_3_2, 1, 0) +\n    If(cell_3_3, 1, 0) +\n    If(cell_3_4, 1, 0) >=\n    1)"
      ]
    },
    {
      "proof": "assumption",
      "dependencies": [],
      "clause": [
        "If(cell_3_0, 1, 0) +\nIf(cell_3_1, 1, 0) +\nIf(cell_3_2, 1, 0) +\nIf(cell_3_3, 1, 0) +\nIf(cell_3_4, 1, 0) ==\n1"
      ]
    },
    {
      "proof": "tseitin(Not(cell_4_4), 1 == If(cell_4_4, 1, 0))",
      "dependencies": [],
      "clause": [
        "Not(cell_4_4)",
        "1 == If(cell_4_4, 1, 0)"
      ]
    },
    {
      "proof": "tseitin(Not(cell_4_4), 1 == If(cell_4_4, 1, 0))",
      "dependencies": [],
      "clause": [
        "Not(cell_4_4)",
        "1 == If(cell_4_4, 1, 0)"
      ]
    },
    {
      "proof": "tseitin(cell_4_4, 0 == If(cell_4_4, 1, 0))",
      "dependencies": [],
      "clause": [
        "cell_4_4",
        "0 == If(cell_4_4, 1, 0)"
      ]
    },
    {
      "proof": "tseitin(cell_4_4, 0 == If(cell_4_4, 1, 0))",
      "dependencies": [],
      "clause": [
        "cell_4_4",
        "0 == If(cell_4_4, 1, 0)"
      ]
    },
    {
      "proof": "tseitin(Not(cell_4_0), 1 == If(cell_4_0, 1, 0))",
      "dependencies": [],
      "clause": [
        "Not(cell_4_0)",
        "1 == If(cell_4_0, 1, 0)"
      ]
    },
    {
      "proof": "tseitin(Not(cell_4_0), 1 == If(cell_4_0, 1, 0))",
      "dependencies": [],
      "clause": [
        "Not(cell_4_0)",
        "1 == If(cell_4_0, 1, 0)"
      ]
    },
    {
      "proof": "tseitin(cell_4_0, 0 == If(cell_4_0, 1, 0))",
      "dependencies": [],
      "clause": [
        "cell_4_0",
        "0 == If(cell_4_0, 1, 0)"
      ]
    },
    {
      "proof": "tseitin(cell_4_0, 0 == If(cell_4_0, 1, 0))",
      "dependencies": [],
      "clause": [
        "cell_4_0",
        "0 == If(cell_4_0, 1, 0)"
      ]
    },
    {
      "proof": "tseitin(Not(cell_4_1), 1 == If(cell_4_1, 1, 0))",
      "dependencies": [],
      "clause": [
        "Not(cell_4_1)",
        "1 == If(cell_4_1, 1, 0)"
      ]
    },
    {
      "proof": "tseitin(Not(cell_4_1), 1 == If(cell_4_1, 1, 0))",
      "dependencies": [],
      "clause": [
        "Not(cell_4_1)",
        "1 == If(cell_4_1, 1, 0)"
      ]
    },
    {
      "proof": "tseitin(cell_4_1, 0 == If(cell_4_1, 1, 0))",
      "dependencies": [],
      "clause": [
        "cell_4_1",
        "0 == If(cell_4_1, 1, 0)"
      ]
    },
    {
      "proof": "tseitin(cell_4_1, 0 == If(cell_4_1, 1, 0))",
      "dependencies": [],
      "clause": [
        "cell_4_1",
        "0 == If(cell_4_1, 1, 0)"
      ]
    },
    {
      "proof": "tseitin(Not(cell_4_2), 1 == If(cell_4_2, 1, 0))",
      "dependencies": [],
      "clause": [
        "Not(cell_4_2)",
        "1 == If(cell_4_2, 1, 0)"
      ]
    },
    {
      "proof": "tseitin(Not(cell_4_2), 1 == If(cell_4_2, 1, 0))",
      "dependencies": [],
      "clause": [
        "Not(cell_4_2)",
        "1 == If(cell_4_2, 1, 0)"
      ]
    },
    {
      "proof": "tseitin(cell_4_2, 0 == If(cell_4_2, 1, 0))",
      "dependencies": [],
      "clause": [
        "cell_4_2",
        "0 == If(cell_4_2, 1, 0)"
      ]
    },
    {
      "proof": "tseitin(cell_4_2, 0 == If(cell_4_2, 1, 0))",
      "dependencies": [],
      "clause": [
        "cell_4_2",
        "0 == If(cell_4_2, 1, 0)"
      ]
    },
    {
      "proof": "tseitin(Not(cell_4_3), 1 == If(cell_4_3, 1, 0))",
      "dependencies": [],
      "clause": [
        "Not(cell_4_3)",
        "1 == If(cell_4_3, 1, 0)"
      ]
    },
    {
      "proof": "tseitin(Not(cell_4_3), 1 == If(cell_4_3, 1, 0))",
      "dependencies": [],
      "clause": [
        "Not(cell_4_3)",
        "1 == If(cell_4_3, 1, 0)"
      ]
    },
    {
      "proof": "tseitin(cell_4_3, 0 == If(cell_4_3, 1, 0))",
      "dependencies": [],
      "clause": [
        "cell_4_3",
        "0 == If(cell_4_3, 1, 0)"
      ]
    },
    {
      "proof": "tseitin(cell_4_3, 0 == If(cell_4_3, 1, 0))",
      "dependencies": [],
      "clause": [
        "cell_4_3",
        "0 == If(cell_4_3, 1, 0)"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(1 ==\n    If(cell_4_0, 1, 0) +\n    If(cell_4_1, 1, 0) +\n    If(cell_4_2, 1, 0) +\n    If(cell_4_3, 1, 0) +\n    If(cell_4_4, 1, 0))",
        "If(cell_4_0, 1, 0) +\nIf(cell_4_1, 1, 0) +\nIf(cell_4_2, 1, 0) +\nIf(cell_4_3, 1, 0) +\nIf(cell_4_4, 1, 0) <=\n1"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(1 ==\n    If(cell_4_0, 1, 0) +\n    If(cell_4_1, 1, 0) +\n    If(cell_4_2, 1, 0) +\n    If(cell_4_3, 1, 0) +\n    If(cell_4_4, 1, 0))",
        "If(cell_4_0, 1, 0) +\nIf(cell_4_1, 1, 0) +\nIf(cell_4_2, 1, 0) +\nIf(cell_4_3, 1, 0) +\nIf(cell_4_4, 1, 0) <=\n1"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(1 ==\n    If(cell_4_0, 1, 0) +\n    If(cell_4_1, 1, 0) +\n    If(cell_4_2, 1, 0) +\n    If(cell_4_3, 1, 0) +\n    If(cell_4_4, 1, 0))",
        "If(cell_4_0, 1, 0) +\nIf(cell_4_1, 1, 0) +\nIf(cell_4_2, 1, 0) +\nIf(cell_4_3, 1, 0) +\nIf(cell_4_4, 1, 0) >=\n1"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(1 ==\n    If(cell_4_0, 1, 0) +\n    If(cell_4_1, 1, 0) +\n    If(cell_4_2, 1, 0) +\n    If(cell_4_3, 1, 0) +\n    If(cell_4_4, 1, 0))",
        "If(cell_4_0, 1, 0) +\nIf(cell_4_1, 1, 0) +\nIf(cell_4_2, 1, 0) +\nIf(cell_4_3, 1, 0) +\nIf(cell_4_4, 1, 0) >=\n1"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "1 ==\nIf(cell_4_0, 1, 0) +\nIf(cell_4_1, 1, 0) +\nIf(cell_4_2, 1, 0) +\nIf(cell_4_3, 1, 0) +\nIf(cell_4_4, 1, 0)",
        "Not(If(cell_4_0, 1, 0) +\n    If(cell_4_1, 1, 0) +\n    If(cell_4_2, 1, 0) +\n    If(cell_4_3, 1, 0) +\n    If(cell_4_4, 1, 0) <=\n    1)",
        "Not(If(cell_4_0, 1, 0) +\n    If(cell_4_1, 1, 0) +\n    If(cell_4_2, 1, 0) +\n    If(cell_4_3, 1, 0) +\n    If(cell_4_4, 1, 0) >=\n    1)"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "1 ==\nIf(cell_4_0, 1, 0) +\nIf(cell_4_1, 1, 0) +\nIf(cell_4_2, 1, 0) +\nIf(cell_4_3, 1, 0) +\nIf(cell_4_4, 1, 0)",
        "Not(If(cell_4_0, 1, 0) +\n    If(cell_4_1, 1, 0) +\n    If(cell_4_2, 1, 0) +\n    If(cell_4_3, 1, 0) +\n    If(cell_4_4, 1, 0) <=\n    1)",
        "Not(If(cell_4_0, 1, 0) +\n    If(cell_4_1, 1, 0) +\n    If(cell_4_2, 1, 0) +\n    If(cell_4_3, 1, 0) +\n    If(cell_4_4, 1, 0) >=\n    1)"
      ]
    },
    {
      "proof": "assumption",
      "dependencies": [],
      "clause": [
        "If(cell_4_0, 1, 0) +\nIf(cell_4_1, 1, 0) +\nIf(cell_4_2, 1, 0) +\nIf(cell_4_3, 1, 0) +\nIf(cell_4_4, 1, 0) ==\n1"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(1 ==\n    If(cell_0_0, 1, 0) +\n    If(cell_1_0, 1, 0) +\n    If(cell_2_0, 1, 0) +\n    If(cell_3_0, 1, 0) +\n    If(cell_4_0, 1, 0))",
        "If(cell_0_0, 1, 0) +\nIf(cell_1_0, 1, 0) +\nIf(cell_2_0, 1, 0) +\nIf(cell_3_0, 1, 0) +\nIf(cell_4_0, 1, 0) <=\n1"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(1 ==\n    If(cell_0_0, 1, 0) +\n    If(cell_1_0, 1, 0) +\n    If(cell_2_0, 1, 0) +\n    If(cell_3_0, 1, 0) +\n    If(cell_4_0, 1, 0))",
        "If(cell_0_0, 1, 0) +\nIf(cell_1_0, 1, 0) +\nIf(cell_2_0, 1, 0) +\nIf(cell_3_0, 1, 0) +\nIf(cell_4_0, 1, 0) <=\n1"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(1 ==\n    If(cell_0_0, 1, 0) +\n    If(cell_1_0, 1, 0) +\n    If(cell_2_0, 1, 0) +\n    If(cell_3_0, 1, 0) +\n    If(cell_4_0, 1, 0))",
        "If(cell_0_0, 1, 0) +\nIf(cell_1_0, 1, 0) +\nIf(cell_2_0, 1, 0) +\nIf(cell_3_0, 1, 0) +\nIf(cell_4_0, 1, 0) >=\n1"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(1 ==\n    If(cell_0_0, 1, 0) +\n    If(cell_1_0, 1, 0) +\n    If(cell_2_0, 1, 0) +\n    If(cell_3_0, 1, 0) +\n    If(cell_4_0, 1, 0))",
        "If(cell_0_0, 1, 0) +\nIf(cell_1_0, 1, 0) +\nIf(cell_2_0, 1, 0) +\nIf(cell_3_0, 1, 0) +\nIf(cell_4_0, 1, 0) >=\n1"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "1 ==\nIf(cell_0_0, 1, 0) +\nIf(cell_1_0, 1, 0) +\nIf(cell_2_0, 1, 0) +\nIf(cell_3_0, 1, 0) +\nIf(cell_4_0, 1, 0)",
        "Not(If(cell_0_0, 1, 0) +\n    If(cell_1_0, 1, 0) +\n    If(cell_2_0, 1, 0) +\n    If(cell_3_0, 1, 0) +\n    If(cell_4_0, 1, 0) <=\n    1)",
        "Not(If(cell_0_0, 1, 0) +\n    If(cell_1_0, 1, 0) +\n    If(cell_2_0, 1, 0) +\n    If(cell_3_0, 1, 0) +\n    If(cell_4_0, 1, 0) >=\n    1)"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "1 ==\nIf(cell_0_0, 1, 0) +\nIf(cell_1_0, 1, 0) +\nIf(cell_2_0, 1, 0) +\nIf(cell_3_0, 1, 0) +\nIf(cell_4_0, 1, 0)",
        "Not(If(cell_0_0, 1, 0) +\n    If(cell_1_0, 1, 0) +\n    If(cell_2_0, 1, 0) +\n    If(cell_3_0, 1, 0) +\n    If(cell_4_0, 1, 0) <=\n    1)",
        "Not(If(cell_0_0, 1, 0) +\n    If(cell_1_0, 1, 0) +\n    If(cell_2_0, 1, 0) +\n    If(cell_3_0, 1, 0) +\n    If(cell_4_0, 1, 0) >=\n    1)"
      ]
    },
    {
      "proof": "assumption",
      "dependencies": [],
      "clause": [
        "If(cell_0_0, 1, 0) +\nIf(cell_1_0, 1, 0) +\nIf(cell_2_0, 1, 0) +\nIf(cell_3_0, 1, 0) +\nIf(cell_4_0, 1, 0) ==\n1"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(1 ==\n    If(cell_0_1, 1, 0) +\n    If(cell_1_1, 1, 0) +\n    If(cell_2_1, 1, 0) +\n    If(cell_3_1, 1, 0) +\n    If(cell_4_1, 1, 0))",
        "If(cell_0_1, 1, 0) +\nIf(cell_1_1, 1, 0) +\nIf(cell_2_1, 1, 0) +\nIf(cell_3_1, 1, 0) +\nIf(cell_4_1, 1, 0) <=\n1"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(1 ==\n    If(cell_0_1, 1, 0) +\n    If(cell_1_1, 1, 0) +\n    If(cell_2_1, 1, 0) +\n    If(cell_3_1, 1, 0) +\n    If(cell_4_1, 1, 0))",
        "If(cell_0_1, 1, 0) +\nIf(cell_1_1, 1, 0) +\nIf(cell_2_1, 1, 0) +\nIf(cell_3_1, 1, 0) +\nIf(cell_4_1, 1, 0) <=\n1"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(1 ==\n    If(cell_0_1, 1, 0) +\n    If(cell_1_1, 1, 0) +\n    If(cell_2_1, 1, 0) +\n    If(cell_3_1, 1, 0) +\n    If(cell_4_1, 1, 0))",
        "If(cell_0_1, 1, 0) +\nIf(cell_1_1, 1, 0) +\nIf(cell_2_1, 1, 0) +\nIf(cell_3_1, 1, 0) +\nIf(cell_4_1, 1, 0) >=\n1"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(1 ==\n    If(cell_0_1, 1, 0) +\n    If(cell_1_1, 1, 0) +\n    If(cell_2_1, 1, 0) +\n    If(cell_3_1, 1, 0) +\n    If(cell_4_1, 1, 0))",
        "If(cell_0_1, 1, 0) +\nIf(cell_1_1, 1, 0) +\nIf(cell_2_1, 1, 0) +\nIf(cell_3_1, 1, 0) +\nIf(cell_4_1, 1, 0) >=\n1"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "1 ==\nIf(cell_0_1, 1, 0) +\nIf(cell_1_1, 1, 0) +\nIf(cell_2_1, 1, 0) +\nIf(cell_3_1, 1, 0) +\nIf(cell_4_1, 1, 0)",
        "Not(If(cell_0_1, 1, 0) +\n    If(cell_1_1, 1, 0) +\n    If(cell_2_1, 1, 0) +\n    If(cell_3_1, 1, 0) +\n    If(cell_4_1, 1, 0) <=\n    1)",
        "Not(If(cell_0_1, 1, 0) +\n    If(cell_1_1, 1, 0) +\n    If(cell_2_1, 1, 0) +\n    If(cell_3_1, 1, 0) +\n    If(cell_4_1, 1, 0) >=\n    1)"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "1 ==\nIf(cell_0_1, 1, 0) +\nIf(cell_1_1, 1, 0) +\nIf(cell_2_1, 1, 0) +\nIf(cell_3_1, 1, 0) +\nIf(cell_4_1, 1, 0)",
        "Not(If(cell_0_1, 1, 0) +\n    If(cell_1_1, 1, 0) +\n    If(cell_2_1, 1, 0) +\n    If(cell_3_1, 1, 0) +\n    If(cell_4_1, 1, 0) <=\n    1)",
        "Not(If(cell_0_1, 1, 0) +\n    If(cell_1_1, 1, 0) +\n    If(cell_2_1, 1, 0) +\n    If(cell_3_1, 1, 0) +\n    If(cell_4_1, 1, 0) >=\n    1)"
      ]
    },
    {
      "proof": "assumption",
      "dependencies": [],
      "clause": [
        "If(cell_0_1, 1, 0) +\nIf(cell_1_1, 1, 0) +\nIf(cell_2_1, 1, 0) +\nIf(cell_3_1, 1, 0) +\nIf(cell_4_1, 1, 0) ==\n1"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(1 ==\n    If(cell_0_2, 1, 0) +\n    If(cell_1_2, 1, 0) +\n    If(cell_2_2, 1, 0) +\n    If(cell_3_2, 1, 0) +\n    If(cell_4_2, 1, 0))",
        "If(cell_0_2, 1, 0) +\nIf(cell_1_2, 1, 0) +\nIf(cell_2_2, 1, 0) +\nIf(cell_3_2, 1, 0) +\nIf(cell_4_2, 1, 0) <=\n1"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(1 ==\n    If(cell_0_2, 1, 0) +\n    If(cell_1_2, 1, 0) +\n    If(cell_2_2, 1, 0) +\n    If(cell_3_2, 1, 0) +\n    If(cell_4_2, 1, 0))",
        "If(cell_0_2, 1, 0) +\nIf(cell_1_2, 1, 0) +\nIf(cell_2_2, 1, 0) +\nIf(cell_3_2, 1, 0) +\nIf(cell_4_2, 1, 0) <=\n1"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(1 ==\n    If(cell_0_2, 1, 0) +\n    If(cell_1_2, 1, 0) +\n    If(cell_2_2, 1, 0) +\n    If(cell_3_2, 1, 0) +\n    If(cell_4_2, 1, 0))",
        "If(cell_0_2, 1, 0) +\nIf(cell_1_2, 1, 0) +\nIf(cell_2_2, 1, 0) +\nIf(cell_3_2, 1, 0) +\nIf(cell_4_2, 1, 0) >=\n1"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(1 ==\n    If(cell_0_2, 1, 0) +\n    If(cell_1_2, 1, 0) +\n    If(cell_2_2, 1, 0) +\n    If(cell_3_2, 1, 0) +\n    If(cell_4_2, 1, 0))",
        "If(cell_0_2, 1, 0) +\nIf(cell_1_2, 1, 0) +\nIf(cell_2_2, 1, 0) +\nIf(cell_3_2, 1, 0) +\nIf(cell_4_2, 1, 0) >=\n1"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "1 ==\nIf(cell_0_2, 1, 0) +\nIf(cell_1_2, 1, 0) +\nIf(cell_2_2, 1, 0) +\nIf(cell_3_2, 1, 0) +\nIf(cell_4_2, 1, 0)",
        "Not(If(cell_0_2, 1, 0) +\n    If(cell_1_2, 1, 0) +\n    If(cell_2_2, 1, 0) +\n    If(cell_3_2, 1, 0) +\n    If(cell_4_2, 1, 0) <=\n    1)",
        "Not(If(cell_0_2, 1, 0) +\n    If(cell_1_2, 1, 0) +\n    If(cell_2_2, 1, 0) +\n    If(cell_3_2, 1, 0) +\n    If(cell_4_2, 1, 0) >=\n    1)"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "1 ==\nIf(cell_0_2, 1, 0) +\nIf(cell_1_2, 1, 0) +\nIf(cell_2_2, 1, 0) +\nIf(cell_3_2, 1, 0) +\nIf(cell_4_2, 1, 0)",
        "Not(If(cell_0_2, 1, 0) +\n    If(cell_1_2, 1, 0) +\n    If(cell_2_2, 1, 0) +\n    If(cell_3_2, 1, 0) +\n    If(cell_4_2, 1, 0) <=\n    1)",
        "Not(If(cell_0_2, 1, 0) +\n    If(cell_1_2, 1, 0) +\n    If(cell_2_2, 1, 0) +\n    If(cell_3_2, 1, 0) +\n    If(cell_4_2, 1, 0) >=\n    1)"
      ]
    },
    {
      "proof": "assumption",
      "dependencies": [],
      "clause": [
        "If(cell_0_2, 1, 0) +\nIf(cell_1_2, 1, 0) +\nIf(cell_2_2, 1, 0) +\nIf(cell_3_2, 1, 0) +\nIf(cell_4_2, 1, 0) ==\n1"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(1 ==\n    If(cell_2_3, 1, 0) +\n    If(cell_3_3, 1, 0) +\n    If(cell_4_3, 1, 0))",
        "If(cell_2_3, 1, 0) + If(cell_3_3, 1, 0) + If(cell_4_3, 1, 0) <=\n1"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(1 ==\n    If(cell_2_3, 1, 0) +\n    If(cell_3_3, 1, 0) +\n    If(cell_4_3, 1, 0))",
        "If(cell_2_3, 1, 0) + If(cell_3_3, 1, 0) + If(cell_4_3, 1, 0) <=\n1"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(1 ==\n    If(cell_2_3, 1, 0) +\n    If(cell_3_3, 1, 0) +\n    If(cell_4_3, 1, 0))",
        "If(cell_2_3, 1, 0) + If(cell_3_3, 1, 0) + If(cell_4_3, 1, 0) >=\n1"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(1 ==\n    If(cell_2_3, 1, 0) +\n    If(cell_3_3, 1, 0) +\n    If(cell_4_3, 1, 0))",
        "If(cell_2_3, 1, 0) + If(cell_3_3, 1, 0) + If(cell_4_3, 1, 0) >=\n1"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "1 ==\nIf(cell_2_3, 1, 0) + If(cell_3_3, 1, 0) + If(cell_4_3, 1, 0)",
        "Not(If(cell_2_3, 1, 0) +\n    If(cell_3_3, 1, 0) +\n    If(cell_4_3, 1, 0) <=\n    1)",
        "Not(If(cell_2_3, 1, 0) +\n    If(cell_3_3, 1, 0) +\n    If(cell_4_3, 1, 0) >=\n    1)"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "1 ==\nIf(cell_2_3, 1, 0) + If(cell_3_3, 1, 0) + If(cell_4_3, 1, 0)",
        "Not(If(cell_2_3, 1, 0) +\n    If(cell_3_3, 1, 0) +\n    If(cell_4_3, 1, 0) <=\n    1)",
        "Not(If(cell_2_3, 1, 0) +\n    If(cell_3_3, 1, 0) +\n    If(cell_4_3, 1, 0) >=\n    1)"
      ]
    },
    {
      "proof": "assumption",
      "dependencies": [],
      "clause": [
        "If(cell_2_3, 1, 0) + If(cell_3_3, 1, 0) + If(cell_4_3, 1, 0) ==\n1"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(0 ==\n    If(cell_2_4, 1, 0) +\n    If(cell_3_4, 1, 0) +\n    If(cell_4_4, 1, 0))",
        "If(cell_2_4, 1, 0) + If(cell_3_4, 1, 0) + If(cell_4_4, 1, 0) <=\n0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(0 ==\n    If(cell_2_4, 1, 0) +\n    If(cell_3_4, 1, 0) +\n    If(cell_4_4, 1, 0))",
        "If(cell_2_4, 1, 0) + If(cell_3_4, 1, 0) + If(cell_4_4, 1, 0) <=\n0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(0 ==\n    If(cell_2_4, 1, 0) +\n    If(cell_3_4, 1, 0) +\n    If(cell_4_4, 1, 0))",
        "If(cell_2_4, 1, 0) + If(cell_3_4, 1, 0) + If(cell_4_4, 1, 0) >=\n0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(0 ==\n    If(cell_2_4, 1, 0) +\n    If(cell_3_4, 1, 0) +\n    If(cell_4_4, 1, 0))",
        "If(cell_2_4, 1, 0) + If(cell_3_4, 1, 0) + If(cell_4_4, 1, 0) >=\n0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "0 ==\nIf(cell_2_4, 1, 0) + If(cell_3_4, 1, 0) + If(cell_4_4, 1, 0)",
        "Not(If(cell_2_4, 1, 0) +\n    If(cell_3_4, 1, 0) +\n    If(cell_4_4, 1, 0) <=\n    0)",
        "Not(If(cell_2_4, 1, 0) +\n    If(cell_3_4, 1, 0) +\n    If(cell_4_4, 1, 0) >=\n    0)"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "0 ==\nIf(cell_2_4, 1, 0) + If(cell_3_4, 1, 0) + If(cell_4_4, 1, 0)",
        "Not(If(cell_2_4, 1, 0) +\n    If(cell_3_4, 1, 0) +\n    If(cell_4_4, 1, 0) <=\n    0)",
        "Not(If(cell_2_4, 1, 0) +\n    If(cell_3_4, 1, 0) +\n    If(cell_4_4, 1, 0) >=\n    0)"
      ]
    },
    {
      "proof": "assumption",
      "dependencies": [],
      "clause": [
        "If(cell_2_4, 1, 0) + If(cell_3_4, 1, 0) + If(cell_4_4, 1, 0) ==\n0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(1 ==\n    If(cell_0_0, 1, 0) +\n    If(cell_0_1, 1, 0) +\n    If(cell_1_0, 1, 0) +\n    If(cell_2_0, 1, 0) +\n    If(cell_3_0, 1, 0))",
        "If(cell_0_0, 1, 0) +\nIf(cell_0_1, 1, 0) +\nIf(cell_1_0, 1, 0) +\nIf(cell_2_0, 1, 0) +\nIf(cell_3_0, 1, 0) <=\n1"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(1 ==\n    If(cell_0_0, 1, 0) +\n    If(cell_0_1, 1, 0) +\n    If(cell_1_0, 1, 0) +\n    If(cell_2_0, 1, 0) +\n    If(cell_3_0, 1, 0))",
        "If(cell_0_0, 1, 0) +\nIf(cell_0_1, 1, 0) +\nIf(cell_1_0, 1, 0) +\nIf(cell_2_0, 1, 0) +\nIf(cell_3_0, 1, 0) <=\n1"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(1 ==\n    If(cell_0_0, 1, 0) +\n    If(cell_0_1, 1, 0) +\n    If(cell_1_0, 1, 0) +\n    If(cell_2_0, 1, 0) +\n    If(cell_3_0, 1, 0))",
        "If(cell_0_0, 1, 0) +\nIf(cell_0_1, 1, 0) +\nIf(cell_1_0, 1, 0) +\nIf(cell_2_0, 1, 0) +\nIf(cell_3_0, 1, 0) >=\n1"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(1 ==\n    If(cell_0_0, 1, 0) +\n    If(cell_0_1, 1, 0) +\n    If(cell_1_0, 1, 0) +\n    If(cell_2_0, 1, 0) +\n    If(cell_3_0, 1, 0))",
        "If(cell_0_0, 1, 0) +\nIf(cell_0_1, 1, 0) +\nIf(cell_1_0, 1, 0) +\nIf(cell_2_0, 1, 0) +\nIf(cell_3_0, 1, 0) >=\n1"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "1 ==\nIf(cell_0_0, 1, 0) +\nIf(cell_0_1, 1, 0) +\nIf(cell_1_0, 1, 0) +\nIf(cell_2_0, 1, 0) +\nIf(cell_3_0, 1, 0)",
        "Not(If(cell_0_0, 1, 0) +\n    If(cell_0_1, 1, 0) +\n    If(cell_1_0, 1, 0) +\n    If(cell_2_0, 1, 0) +\n    If(cell_3_0, 1, 0) <=\n    1)",
        "Not(If(cell_0_0, 1, 0) +\n    If(cell_0_1, 1, 0) +\n    If(cell_1_0, 1, 0) +\n    If(cell_2_0, 1, 0) +\n    If(cell_3_0, 1, 0) >=\n    1)"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "1 ==\nIf(cell_0_0, 1, 0) +\nIf(cell_0_1, 1, 0) +\nIf(cell_1_0, 1, 0) +\nIf(cell_2_0, 1, 0) +\nIf(cell_3_0, 1, 0)",
        "Not(If(cell_0_0, 1, 0) +\n    If(cell_0_1, 1, 0) +\n    If(cell_1_0, 1, 0) +\n    If(cell_2_0, 1, 0) +\n    If(cell_3_0, 1, 0) <=\n    1)",
        "Not(If(cell_0_0, 1, 0) +\n    If(cell_0_1, 1, 0) +\n    If(cell_1_0, 1, 0) +\n    If(cell_2_0, 1, 0) +\n    If(cell_3_0, 1, 0) >=\n    1)"
      ]
    },
    {
      "proof": "assumption",
      "dependencies": [],
      "clause": [
        "If(cell_0_0, 1, 0) +\nIf(cell_0_1, 1, 0) +\nIf(cell_1_0, 1, 0) +\nIf(cell_2_0, 1, 0) +\nIf(cell_3_0, 1, 0) ==\n1"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(1 ==\n    If(cell_0_2, 1, 0) +\n    If(cell_1_1, 1, 0) +\n    If(cell_1_2, 1, 0) +\n    If(cell_2_2, 1, 0))",
        "If(cell_0_2, 1, 0) +\nIf(cell_1_1, 1, 0) +\nIf(cell_1_2, 1, 0) +\nIf(cell_2_2, 1, 0) <=\n1"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(1 ==\n    If(cell_0_2, 1, 0) +\n    If(cell_1_1, 1, 0) +\n    If(cell_1_2, 1, 0) +\n    If(cell_2_2, 1, 0))",
        "If(cell_0_2, 1, 0) +\nIf(cell_1_1, 1, 0) +\nIf(cell_1_2, 1, 0) +\nIf(cell_2_2, 1, 0) <=\n1"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(1 ==\n    If(cell_0_2, 1, 0) +\n    If(cell_1_1, 1, 0) +\n    If(cell_1_2, 1, 0) +\n    If(cell_2_2, 1, 0))",
        "If(cell_0_2, 1, 0) +\nIf(cell_1_1, 1, 0) +\nIf(cell_1_2, 1, 0) +\nIf(cell_2_2, 1, 0) >=\n1"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(1 ==\n    If(cell_0_2, 1, 0) +\n    If(cell_1_1, 1, 0) +\n    If(cell_1_2, 1, 0) +\n    If(cell_2_2, 1, 0))",
        "If(cell_0_2, 1, 0) +\nIf(cell_1_1, 1, 0) +\nIf(cell_1_2, 1, 0) +\nIf(cell_2_2, 1, 0) >=\n1"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "1 ==\nIf(cell_0_2, 1, 0) +\nIf(cell_1_1, 1, 0) +\nIf(cell_1_2, 1, 0) +\nIf(cell_2_2, 1, 0)",
        "Not(If(cell_0_2, 1, 0) +\n    If(cell_1_1, 1, 0) +\n    If(cell_1_2, 1, 0) +\n    If(cell_2_2, 1, 0) <=\n    1)",
        "Not(If(cell_0_2, 1, 0) +\n    If(cell_1_1, 1, 0) +\n    If(cell_1_2, 1, 0) +\n    If(cell_2_2, 1, 0) >=\n    1)"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "1 ==\nIf(cell_0_2, 1, 0) +\nIf(cell_1_1, 1, 0) +\nIf(cell_1_2, 1, 0) +\nIf(cell_2_2, 1, 0)",
        "Not(If(cell_0_2, 1, 0) +\n    If(cell_1_1, 1, 0) +\n    If(cell_1_2, 1, 0) +\n    If(cell_2_2, 1, 0) <=\n    1)",
        "Not(If(cell_0_2, 1, 0) +\n    If(cell_1_1, 1, 0) +\n    If(cell_1_2, 1, 0) +\n    If(cell_2_2, 1, 0) >=\n    1)"
      ]
    },
    {
      "proof": "assumption",
      "dependencies": [],
      "clause": [
        "If(cell_0_2, 1, 0) +\nIf(cell_1_1, 1, 0) +\nIf(cell_1_2, 1, 0) +\nIf(cell_2_2, 1, 0) ==\n1"
      ]
    },
    {
      "proof": "assumption",
      "dependencies": [],
      "clause": [
        "cell_0_4"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(1 ==\n    If(cell_2_3, 1, 0) +\n    If(cell_2_4, 1, 0) +\n    If(cell_3_2, 1, 0) +\n    If(cell_3_3, 1, 0) +\n    If(cell_3_4, 1, 0) +\n    If(cell_4_2, 1, 0) +\n    If(cell_4_3, 1, 0) +\n    If(cell_4_4, 1, 0))",
        "If(cell_2_3, 1, 0) +\nIf(cell_2_4, 1, 0) +\nIf(cell_3_2, 1, 0) +\nIf(cell_3_3, 1, 0) +\nIf(cell_3_4, 1, 0) +\nIf(cell_4_2, 1, 0) +\nIf(cell_4_3, 1, 0) +\nIf(cell_4_4, 1, 0) <=\n1"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(1 ==\n    If(cell_2_3, 1, 0) +\n    If(cell_2_4, 1, 0) +\n    If(cell_3_2, 1, 0) +\n    If(cell_3_3, 1, 0) +\n    If(cell_3_4, 1, 0) +\n    If(cell_4_2, 1, 0) +\n    If(cell_4_3, 1, 0) +\n    If(cell_4_4, 1, 0))",
        "If(cell_2_3, 1, 0) +\nIf(cell_2_4, 1, 0) +\nIf(cell_3_2, 1, 0) +\nIf(cell_3_3, 1, 0) +\nIf(cell_3_4, 1, 0) +\nIf(cell_4_2, 1, 0) +\nIf(cell_4_3, 1, 0) +\nIf(cell_4_4, 1, 0) <=\n1"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(1 ==\n    If(cell_2_3, 1, 0) +\n    If(cell_2_4, 1, 0) +\n    If(cell_3_2, 1, 0) +\n    If(cell_3_3, 1, 0) +\n    If(cell_3_4, 1, 0) +\n    If(cell_4_2, 1, 0) +\n    If(cell_4_3, 1, 0) +\n    If(cell_4_4, 1, 0))",
        "If(cell_2_3, 1, 0) +\nIf(cell_2_4, 1, 0) +\nIf(cell_3_2, 1, 0) +\nIf(cell_3_3, 1, 0) +\nIf(cell_3_4, 1, 0) +\nIf(cell_4_2, 1, 0) +\nIf(cell_4_3, 1, 0) +\nIf(cell_4_4, 1, 0) >=\n1"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(1 ==\n    If(cell_2_3, 1, 0) +\n    If(cell_2_4, 1, 0) +\n    If(cell_3_2, 1, 0) +\n    If(cell_3_3, 1, 0) +\n    If(cell_3_4, 1, 0) +\n    If(cell_4_2, 1, 0) +\n    If(cell_4_3, 1, 0) +\n    If(cell_4_4, 1, 0))",
        "If(cell_2_3, 1, 0) +\nIf(cell_2_4, 1, 0) +\nIf(cell_3_2, 1, 0) +\nIf(cell_3_3, 1, 0) +\nIf(cell_3_4, 1, 0) +\nIf(cell_4_2, 1, 0) +\nIf(cell_4_3, 1, 0) +\nIf(cell_4_4, 1, 0) >=\n1"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "1 ==\nIf(cell_2_3, 1, 0) +\nIf(cell_2_4, 1, 0) +\nIf(cell_3_2, 1, 0) +\nIf(cell_3_3, 1, 0) +\nIf(cell_3_4, 1, 0) +\nIf(cell_4_2, 1, 0) +\nIf(cell_4_3, 1, 0) +\nIf(cell_4_4, 1, 0)",
        "Not(If(cell_2_3, 1, 0) +\n    If(cell_2_4, 1, 0) +\n    If(cell_3_2, 1, 0) +\n    If(cell_3_3, 1, 0) +\n    If(cell_3_4, 1, 0) +\n    If(cell_4_2, 1, 0) +\n    If(cell_4_3, 1, 0) +\n    If(cell_4_4, 1, 0) <=\n    1)",
        "Not(If(cell_2_3, 1, 0) +\n    If(cell_2_4, 1, 0) +\n    If(cell_3_2, 1, 0) +\n    If(cell_3_3, 1, 0) +\n    If(cell_3_4, 1, 0) +\n    If(cell_4_2, 1, 0) +\n    If(cell_4_3, 1, 0) +\n    If(cell_4_4, 1, 0) >=\n    1)"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "1 ==\nIf(cell_2_3, 1, 0) +\nIf(cell_2_4, 1, 0) +\nIf(cell_3_2, 1, 0) +\nIf(cell_3_3, 1, 0) +\nIf(cell_3_4, 1, 0) +\nIf(cell_4_2, 1, 0) +\nIf(cell_4_3, 1, 0) +\nIf(cell_4_4, 1, 0)",
        "Not(If(cell_2_3, 1, 0) +\n    If(cell_2_4, 1, 0) +\n    If(cell_3_2, 1, 0) +\n    If(cell_3_3, 1, 0) +\n    If(cell_3_4, 1, 0) +\n    If(cell_4_2, 1, 0) +\n    If(cell_4_3, 1, 0) +\n    If(cell_4_4, 1, 0) <=\n    1)",
        "Not(If(cell_2_3, 1, 0) +\n    If(cell_2_4, 1, 0) +\n    If(cell_3_2, 1, 0) +\n    If(cell_3_3, 1, 0) +\n    If(cell_3_4, 1, 0) +\n    If(cell_4_2, 1, 0) +\n    If(cell_4_3, 1, 0) +\n    If(cell_4_4, 1, 0) >=\n    1)"
      ]
    },
    {
      "proof": "assumption",
      "dependencies": [],
      "clause": [
        "If(cell_2_3, 1, 0) +\nIf(cell_2_4, 1, 0) +\nIf(cell_3_2, 1, 0) +\nIf(cell_3_3, 1, 0) +\nIf(cell_3_4, 1, 0) +\nIf(cell_4_2, 1, 0) +\nIf(cell_4_3, 1, 0) +\nIf(cell_4_4, 1, 0) ==\n1"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(1 ==\n    If(cell_2_1, 1, 0) +\n    If(cell_3_1, 1, 0) +\n    If(cell_4_0, 1, 0) +\n    If(cell_4_1, 1, 0))",
        "If(cell_2_1, 1, 0) +\nIf(cell_3_1, 1, 0) +\nIf(cell_4_0, 1, 0) +\nIf(cell_4_1, 1, 0) <=\n1"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(1 ==\n    If(cell_2_1, 1, 0) +\n    If(cell_3_1, 1, 0) +\n    If(cell_4_0, 1, 0) +\n    If(cell_4_1, 1, 0))",
        "If(cell_2_1, 1, 0) +\nIf(cell_3_1, 1, 0) +\nIf(cell_4_0, 1, 0) +\nIf(cell_4_1, 1, 0) <=\n1"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(1 ==\n    If(cell_2_1, 1, 0) +\n    If(cell_3_1, 1, 0) +\n    If(cell_4_0, 1, 0) +\n    If(cell_4_1, 1, 0))",
        "If(cell_2_1, 1, 0) +\nIf(cell_3_1, 1, 0) +\nIf(cell_4_0, 1, 0) +\nIf(cell_4_1, 1, 0) >=\n1"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(1 ==\n    If(cell_2_1, 1, 0) +\n    If(cell_3_1, 1, 0) +\n    If(cell_4_0, 1, 0) +\n    If(cell_4_1, 1, 0))",
        "If(cell_2_1, 1, 0) +\nIf(cell_3_1, 1, 0) +\nIf(cell_4_0, 1, 0) +\nIf(cell_4_1, 1, 0) >=\n1"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "1 ==\nIf(cell_2_1, 1, 0) +\nIf(cell_3_1, 1, 0) +\nIf(cell_4_0, 1, 0) +\nIf(cell_4_1, 1, 0)",
        "Not(If(cell_2_1, 1, 0) +\n    If(cell_3_1, 1, 0) +\n    If(cell_4_0, 1, 0) +\n    If(cell_4_1, 1, 0) <=\n    1)",
        "Not(If(cell_2_1, 1, 0) +\n    If(cell_3_1, 1, 0) +\n    If(cell_4_0, 1, 0) +\n    If(cell_4_1, 1, 0) >=\n    1)"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "1 ==\nIf(cell_2_1, 1, 0) +\nIf(cell_3_1, 1, 0) +\nIf(cell_4_0, 1, 0) +\nIf(cell_4_1, 1, 0)",
        "Not(If(cell_2_1, 1, 0) +\n    If(cell_3_1, 1, 0) +\n    If(cell_4_0, 1, 0) +\n    If(cell_4_1, 1, 0) <=\n    1)",
        "Not(If(cell_2_1, 1, 0) +\n    If(cell_3_1, 1, 0) +\n    If(cell_4_0, 1, 0) +\n    If(cell_4_1, 1, 0) >=\n    1)"
      ]
    },
    {
      "proof": "assumption",
      "dependencies": [],
      "clause": [
        "If(cell_2_1, 1, 0) +\nIf(cell_3_1, 1, 0) +\nIf(cell_4_0, 1, 0) +\nIf(cell_4_1, 1, 0) ==\n1"
      ]
    },
    {
      "proof": "assumption",
      "dependencies": [],
      "clause": [
        "Not(cell_0_0)",
        "Not(cell_1_0)"
      ]
    },
    {
      "proof": "assumption",
      "dependencies": [],
      "clause": [
        "Not(cell_0_0)",
        "Not(cell_1_0)"
      ]
    },
    {
      "proof": "assumption",
      "dependencies": [],
      "clause": [
        "Not(cell_0_0)",
        "Not(cell_0_1)"
      ]
    },
    {
      "proof": "assumption",
      "dependencies": [],
      "clause": [
        "Not(cell_0_0)",
        "Not(cell_0_1)"
      ]
    },
    {
      "proof": "assumption",
      "dependencies": [],
      "clause": [
        "Not(cell_0_0)",
        "Not(cell_1_1)"
      ]
    },
    {
      "proof": "assumption",
      "dependencies": [],
      "clause": [
        "Not(cell_0_0)",
        "Not(cell_1_1)"
      ]
    },
    {
      "proof": "assumption",
      "dependencies": [],
      "clause": [
        "Not(cell_0_1)",
        "Not(cell_1_1)"
      ]
    },
    {
      "proof": "assumption",
      "dependencies": [],
      "clause": [
        "Not(cell_0_1)",
        "Not(cell_1_1)"
      ]
    },
    {
      "proof": "assumption",
      "dependencies": [],
      "clause": [
        "Not(cell_0_1)",
        "Not(cell_0_0)"
      ]
    },
    {
      "proof": "assumption",
      "dependencies": [],
      "clause": [
        "Not(cell_0_0)",
        "Not(cell_0_1)"
      ]
    },
    {
      "proof": "assumption",
      "dependencies": [],
      "clause": [
        "Not(cell_0_1)",
        "Not(cell_0_2)"
      ]
    },
    {
      "proof": "assumption",
      "dependencies": [],
      "clause": [
        "Not(cell_0_2)",
        "Not(cell_0_1)"
      ]
    },
    {
      "proof": "assumption",
      "dependencies": [],
      "clause": [
        "Not(cell_0_1)",
        "Not(cell_1_0)"
      ]
    },
    {
      "proof": "assumption",
      "dependencies": [],
      "clause": [
        "Not(cell_0_1)",
        "Not(cell_1_0)"
      ]
    },
    {
      "proof": "assumption",
      "dependencies": [],
      "clause": [
        "Not(cell_0_1)",
        "Not(cell_1_2)"
      ]
    },
    {
      "proof": "assumption",
      "dependencies": [],
      "clause": [
        "Not(cell_0_1)",
        "Not(cell_1_2)"
      ]
    },
    {
      "proof": "assumption",
      "dependencies": [],
      "clause": [
        "Not(cell_0_2)",
        "Not(cell_1_2)"
      ]
    },
    {
      "proof": "assumption",
      "dependencies": [],
      "clause": [
        "Not(cell_0_2)",
        "Not(cell_1_2)"
      ]
    },
    {
      "proof": "assumption",
      "dependencies": [],
      "clause": [
        "Not(cell_0_2)",
        "Not(cell_0_3)"
      ]
    },
    {
      "proof": "assumption",
      "dependencies": [],
      "clause": [
        "Not(cell_0_2)",
        "Not(cell_0_3)"
      ]
    },
    {
      "proof": "assumption",
      "dependencies": [],
      "clause": [
        "Not(cell_0_2)",
        "Not(cell_1_1)"
      ]
    },
    {
      "proof": "assumption",
      "dependencies": [],
      "clause": [
        "Not(cell_0_2)",
        "Not(cell_1_1)"
      ]
    },
    {
      "proof": "assumption",
      "dependencies": [],
      "clause": [
        "Not(cell_0_2)",
        "Not(cell_1_3)"
      ]
    },
    {
      "proof": "assumption",
      "dependencies": [],
      "clause": [
        "Not(cell_0_2)",
        "Not(cell_1_3)"
      ]
    },
    {
      "proof": "assumption",
      "dependencies": [],
      "clause": [
        "Not(cell_0_3)",
        "Not(cell_1_3)"
      ]
    },
    {
      "proof": "assumption",
      "dependencies": [],
      "clause": [
        "Not(cell_0_3)",
        "Not(cell_1_3)"
      ]
    },
    {
      "proof": "assumption",
      "dependencies": [],
      "clause": [
        "Not(cell_0_3)",
        "Not(cell_1_2)"
      ]
    },
    {
      "proof": "assumption",
      "dependencies": [],
      "clause": [
        "Not(cell_1_2)",
        "Not(cell_0_3)"
      ]
    },
    {
      "proof": "assumption",
      "dependencies": [],
      "clause": [
        "Not(cell_0_3)",
        "Not(cell_1_4)"
      ]
    },
    {
      "proof": "assumption",
      "dependencies": [],
      "clause": [
        "Not(cell_0_3)",
        "Not(cell_1_4)"
      ]
    },
    {
      "proof": "assumption",
      "dependencies": [],
      "clause": [
        "Not(cell_0_3)"
      ]
    },
    {
      "proof": "assumption",
      "dependencies": [],
      "clause": [
        "Not(cell_1_0)",
        "Not(cell_0_0)"
      ]
    },
    {
      "proof": "assumption",
      "dependencies": [],
      "clause": [
        "Not(cell_0_0)",
        "Not(cell_1_0)"
      ]
    },
    {
      "proof": "assumption",
      "dependencies": [],
      "clause": [
        "Not(cell_1_0)",
        "Not(cell_2_0)"
      ]
    },
    {
      "proof": "assumption",
      "dependencies": [],
      "clause": [
        "Not(cell_1_0)",
        "Not(cell_2_0)"
      ]
    },
    {
      "proof": "assumption",
      "dependencies": [],
      "clause": [
        "Not(cell_1_0)",
        "Not(cell_1_1)"
      ]
    },
    {
      "proof": "assumption",
      "dependencies": [],
      "clause": [
        "Not(cell_1_0)",
        "Not(cell_1_1)"
      ]
    },
    {
      "proof": "assumption",
      "dependencies": [],
      "clause": [
        "Not(cell_1_0)",
        "Not(cell_0_1)"
      ]
    },
    {
      "proof": "assumption",
      "dependencies": [],
      "clause": [
        "Not(cell_0_1)",
        "Not(cell_1_0)"
      ]
    },
    {
      "proof": "assumption",
      "dependencies": [],
      "clause": [
        "Not(cell_1_0)",
        "Not(cell_2_1)"
      ]
    },
    {
      "proof": "assumption",
      "dependencies": [],
      "clause": [
        "Not(cell_1_0)",
        "Not(cell_2_1)"
      ]
    },
    {
      "proof": "assumption",
      "dependencies": [],
      "clause": [
        "Not(cell_1_1)",
        "Not(cell_2_1)"
      ]
    },
    {
      "proof": "assumption",
      "dependencies": [],
      "clause": [
        "Not(cell_1_1)",
        "Not(cell_2_1)"
      ]
    },
    {
      "proof": "assumption",
      "dependencies": [],
      "clause": [
        "Not(cell_1_1)",
        "Not(cell_1_2)"
      ]
    },
    {
      "proof": "assumption",
      "dependencies": [],
      "clause": [
        "Not(cell_1_2)",
        "Not(cell_1_1)"
      ]
    },
    {
      "proof": "assumption",
      "dependencies": [],
      "clause": [
        "Not(cell_1_1)",
        "Not(cell_0_0)"
      ]
    },
    {
      "proof": "assumption",
      "dependencies": [],
      "clause": [
        "Not(cell_0_0)",
        "Not(cell_1_1)"
      ]
    },
    {
      "proof": "assumption",
      "dependencies": [],
      "clause": [
        "Not(cell_1_1)",
        "Not(cell_0_2)"
      ]
    },
    {
      "proof": "assumption",
      "dependencies": [],
      "clause": [
        "Not(cell_0_2)",
        "Not(cell_1_1)"
      ]
    },
    {
      "proof": "assumption",
      "dependencies": [],
      "clause": [
        "Not(cell_1_1)",
        "Not(cell_2_0)"
      ]
    },
    {
      "proof": "assumption",
      "dependencies": [],
      "clause": [
        "Not(cell_1_1)",
        "Not(cell_2_0)"
      ]
    },
    {
      "proof": "assumption",
      "dependencies": [],
      "clause": [
        "Not(cell_1_1)",
        "Not(cell_2_2)"
      ]
    },
    {
      "proof": "assumption",
      "dependencies": [],
      "clause": [
        "Not(cell_1_1)",
        "Not(cell_2_2)"
      ]
    },
    {
      "proof": "assumption",
      "dependencies": [],
      "clause": [
        "Not(cell_1_2)",
        "Not(cell_2_2)"
      ]
    },
    {
      "proof": "assumption",
      "dependencies": [],
      "clause": [
        "Not(cell_1_2)",
        "Not(cell_2_2)"
      ]
    },
    {
      "proof": "assumption",
      "dependencies": [],
      "clause": [
        "Not(cell_1_2)",
        "Not(cell_1_3)"
      ]
    },
    {
      "proof": "assumption",
      "dependencies": [],
      "clause": [
        "Not(cell_1_2)",
        "Not(cell_1_3)"
      ]
    },
    {
      "proof": "assumption",
      "dependencies": [],
      "clause": [
        "Not(cell_1_2)",
        "Not(cell_0_3)"
      ]
    },
    {
      "proof": "assumption",
      "dependencies": [],
      "clause": [
        "Not(cell_1_2)",
        "Not(cell_2_1)"
      ]
    },
    {
      "proof": "assumption",
      "dependencies": [],
      "clause": [
        "Not(cell_1_2)",
        "Not(cell_2_1)"
      ]
    },
    {
      "proof": "assumption",
      "dependencies": [],
      "clause": [
        "Not(cell_1_2)",
        "Not(cell_2_3)"
      ]
    },
    {
      "proof": "assumption",
      "dependencies": [],
      "clause": [
        "Not(cell_1_2)",
        "Not(cell_2_3)"
      ]
    },
    {
      "proof": "assumption",
      "dependencies": [],
      "clause": [
        "Not(cell_1_3)",
        "Not(cell_2_3)"
      ]
    },
    {
      "proof": "assumption",
      "dependencies": [],
      "clause": [
        "Not(cell_2_3)",
        "Not(cell_1_3)"
      ]
    },
    {
      "proof": "assumption",
      "dependencies": [],
      "clause": [
        "Not(cell_1_3)",
        "Not(cell_1_4)"
      ]
    },
    {
      "proof": "assumption",
      "dependencies": [],
      "clause": [
        "Not(cell_1_3)",
        "Not(cell_1_4)"
      ]
    },
    {
      "proof": "assumption",
      "dependencies": [],
      "clause": [
        "Not(cell_1_3)"
      ]
    },
    {
      "proof": "assumption",
      "dependencies": [],
      "clause": [
        "Not(cell_1_3)",
        "Not(cell_2_2)"
      ]
    },
    {
      "proof": "assumption",
      "dependencies": [],
      "clause": [
        "Not(cell_1_3)",
        "Not(cell_2_4)"
      ]
    },
    {
      "proof": "assumption",
      "dependencies": [],
      "clause": [
        "Not(cell_1_4)"
      ]
    },
    {
      "proof": "assumption",
      "dependencies": [],
      "clause": [
        "Not(cell_1_4)",
        "Not(cell_2_4)"
      ]
    },
    {
      "proof": "assumption",
      "dependencies": [],
      "clause": [
        "Not(cell_1_4)",
        "Not(cell_2_3)"
      ]
    },
    {
      "proof": "assumption",
      "dependencies": [],
      "clause": [
        "Not(cell_2_0)",
        "Not(cell_3_0)"
      ]
    },
    {
      "proof": "assumption",
      "dependencies": [],
      "clause": [
        "Not(cell_2_0)",
        "Not(cell_3_0)"
      ]
    },
    {
      "proof": "assumption",
      "dependencies": [],
      "clause": [
        "Not(cell_2_0)",
        "Not(cell_2_1)"
      ]
    },
    {
      "proof": "assumption",
      "dependencies": [],
      "clause": [
        "Not(cell_2_0)",
        "Not(cell_2_1)"
      ]
    },
    {
      "proof": "assumption",
      "dependencies": [],
      "clause": [
        "Not(cell_2_0)",
        "Not(cell_3_1)"
      ]
    },
    {
      "proof": "assumption",
      "dependencies": [],
      "clause": [
        "Not(cell_2_0)",
        "Not(cell_3_1)"
      ]
    },
    {
      "proof": "assumption",
      "dependencies": [],
      "clause": [
        "Not(cell_2_1)",
        "Not(cell_3_1)"
      ]
    },
    {
      "proof": "assumption",
      "dependencies": [],
      "clause": [
        "Not(cell_2_1)",
        "Not(cell_3_1)"
      ]
    },
    {
      "proof": "assumption",
      "dependencies": [],
      "clause": [
        "Not(cell_2_1)",
        "Not(cell_2_2)"
      ]
    },
    {
      "proof": "assumption",
      "dependencies": [],
      "clause": [
        "Not(cell_2_1)",
        "Not(cell_2_2)"
      ]
    },
    {
      "proof": "assumption",
      "dependencies": [],
      "clause": [
        "Not(cell_2_1)",
        "Not(cell_3_0)"
      ]
    },
    {
      "proof": "assumption",
      "dependencies": [],
      "clause": [
        "Not(cell_2_1)",
        "Not(cell_3_0)"
      ]
    },
    {
      "proof": "assumption",
      "dependencies": [],
      "clause": [
        "Not(cell_2_1)",
        "Not(cell_3_2)"
      ]
    },
    {
      "proof": "assumption",
      "dependencies": [],
      "clause": [
        "Not(cell_2_1)",
        "Not(cell_3_2)"
      ]
    },
    {
      "proof": "assumption",
      "dependencies": [],
      "clause": [
        "Not(cell_2_2)",
        "Not(cell_3_2)"
      ]
    },
    {
      "proof": "assumption",
      "dependencies": [],
      "clause": [
        "Not(cell_2_2)",
        "Not(cell_3_2)"
      ]
    },
    {
      "proof": "assumption",
      "dependencies": [],
      "clause": [
        "Not(cell_2_2)",
        "Not(cell_2_3)"
      ]
    },
    {
      "proof": "assumption",
      "dependencies": [],
      "clause": [
        "Not(cell_2_2)",
        "Not(cell_2_3)"
      ]
    },
    {
      "proof": "assumption",
      "dependencies": [],
      "clause": [
        "Not(cell_2_2)",
        "Not(cell_3_1)"
      ]
    },
    {
      "proof": "assumption",
      "dependencies": [],
      "clause": [
        "Not(cell_2_2)",
        "Not(cell_3_1)"
      ]
    },
    {
      "proof": "assumption",
      "dependencies": [],
      "clause": [
        "Not(cell_2_2)",
        "Not(cell_3_3)"
      ]
    },
    {
      "proof": "assumption",
      "dependencies": [],
      "clause": [
        "Not(cell_2_2)",
        "Not(cell_3_3)"
      ]
    },
    {
      "proof": "assumption",
      "dependencies": [],
      "clause": [
        "Not(cell_2_3)",
        "Not(cell_3_3)"
      ]
    },
    {
      "proof": "assumption",
      "dependencies": [],
      "clause": [
        "Not(cell_2_3)",
        "Not(cell_3_3)"
      ]
    },
    {
      "proof": "assumption",
      "dependencies": [],
      "clause": [
        "Not(cell_2_3)",
        "Not(cell_2_4)"
      ]
    },
    {
      "proof": "assumption",
      "dependencies": [],
      "clause": [
        "Not(cell_2_4)",
        "Not(cell_2_3)"
      ]
    },
    {
      "proof": "assumption",
      "dependencies": [],
      "clause": [
        "Not(cell_2_3)",
        "Not(cell_3_2)"
      ]
    },
    {
      "proof": "assumption",
      "dependencies": [],
      "clause": [
        "Not(cell_2_3)",
        "Not(cell_3_2)"
      ]
    },
    {
      "proof": "assumption",
      "dependencies": [],
      "clause": [
        "Not(cell_2_3)",
        "Not(cell_3_4)"
      ]
    },
    {
      "proof": "assumption",
      "dependencies": [],
      "clause": [
        "Not(cell_2_3)",
        "Not(cell_3_4)"
      ]
    },
    {
      "proof": "assumption",
      "dependencies": [],
      "clause": [
        "Not(cell_2_4)",
        "Not(cell_3_4)"
      ]
    },
    {
      "proof": "assumption",
      "dependencies": [],
      "clause": [
        "Not(cell_2_4)",
        "Not(cell_3_4)"
      ]
    },
    {
      "proof": "assumption",
      "dependencies": [],
      "clause": [
        "Not(cell_2_4)",
        "Not(cell_3_3)"
      ]
    },
    {
      "proof": "assumption",
      "dependencies": [],
      "clause": [
        "Not(cell_2_4)",
        "Not(cell_3_3)"
      ]
    },
    {
      "proof": "assumption",
      "dependencies": [],
      "clause": [
        "Not(cell_3_0)",
        "Not(cell_4_0)"
      ]
    },
    {
      "proof": "assumption",
      "dependencies": [],
      "clause": [
        "Not(cell_3_0)",
        "Not(cell_4_0)"
      ]
    },
    {
      "proof": "assumption",
      "dependencies": [],
      "clause": [
        "Not(cell_3_0)",
        "Not(cell_3_1)"
      ]
    },
    {
      "proof": "assumption",
      "dependencies": [],
      "clause": [
        "Not(cell_3_0)",
        "Not(cell_3_1)"
      ]
    },
    {
      "proof": "assumption",
      "dependencies": [],
      "clause": [
        "Not(cell_3_0)",
        "Not(cell_4_1)"
      ]
    },
    {
      "proof": "assumption",
      "dependencies": [],
      "clause": [
        "Not(cell_3_0)",
        "Not(cell_4_1)"
      ]
    },
    {
      "proof": "assumption",
      "dependencies": [],
      "clause": [
        "Not(cell_3_1)",
        "Not(cell_4_1)"
      ]
    },
    {
      "proof": "assumption",
      "dependencies": [],
      "clause": [
        "Not(cell_3_1)",
        "Not(cell_4_1)"
      ]
    },
    {
      "proof": "assumption",
      "dependencies": [],
      "clause": [
        "Not(cell_3_1)",
        "Not(cell_3_2)"
      ]
    },
    {
      "proof": "assumption",
      "dependencies": [],
      "clause": [
        "Not(cell_3_1)",
        "Not(cell_3_2)"
      ]
    },
    {
      "proof": "assumption",
      "dependencies": [],
      "clause": [
        "Not(cell_3_1)",
        "Not(cell_4_0)"
      ]
    },
    {
      "proof": "assumption",
      "dependencies": [],
      "clause": [
        "Not(cell_3_1)",
        "Not(cell_4_0)"
      ]
    },
    {
      "proof": "assumption",
      "dependencies": [],
      "clause": [
        "Not(cell_3_1)",
        "Not(cell_4_2)"
      ]
    },
    {
      "proof": "assumption",
      "dependencies": [],
      "clause": [
        "Not(cell_3_1)",
        "Not(cell_4_2)"
      ]
    },
    {
      "proof": "assumption",
      "dependencies": [],
      "clause": [
        "Not(cell_3_2)",
        "Not(cell_4_2)"
      ]
    },
    {
      "proof": "assumption",
      "dependencies": [],
      "clause": [
        "Not(cell_3_2)",
        "Not(cell_4_2)"
      ]
    },
    {
      "proof": "assumption",
      "dependencies": [],
      "clause": [
        "Not(cell_3_2)",
        "Not(cell_3_3)"
      ]
    },
    {
      "proof": "assumption",
      "dependencies": [],
      "clause": [
        "Not(cell_3_2)",
        "Not(cell_3_3)"
      ]
    },
    {
      "proof": "assumption",
      "dependencies": [],
      "clause": [
        "Not(cell_3_2)",
        "Not(cell_4_1)"
      ]
    },
    {
      "proof": "assumption",
      "dependencies": [],
      "clause": [
        "Not(cell_3_2)",
        "Not(cell_4_1)"
      ]
    },
    {
      "proof": "assumption",
      "dependencies": [],
      "clause": [
        "Not(cell_3_2)",
        "Not(cell_4_3)"
      ]
    },
    {
      "proof": "assumption",
      "dependencies": [],
      "clause": [
        "Not(cell_3_2)",
        "Not(cell_4_3)"
      ]
    },
    {
      "proof": "assumption",
      "dependencies": [],
      "clause": [
        "Not(cell_3_3)",
        "Not(cell_4_3)"
      ]
    },
    {
      "proof": "assumption",
      "dependencies": [],
      "clause": [
        "Not(cell_3_3)",
        "Not(cell_4_3)"
      ]
    },
    {
      "proof": "assumption",
      "dependencies": [],
      "clause": [
        "Not(cell_3_3)",
        "Not(cell_3_4)"
      ]
    },
    {
      "proof": "assumption",
      "dependencies": [],
      "clause": [
        "Not(cell_3_4)",
        "Not(cell_3_3)"
      ]
    },
    {
      "proof": "assumption",
      "dependencies": [],
      "clause": [
        "Not(cell_3_3)",
        "Not(cell_4_2)"
      ]
    },
    {
      "proof": "assumption",
      "dependencies": [],
      "clause": [
        "Not(cell_3_3)",
        "Not(cell_4_2)"
      ]
    },
    {
      "proof": "assumption",
      "dependencies": [],
      "clause": [
        "Not(cell_3_3)",
        "Not(cell_4_4)"
      ]
    },
    {
      "proof": "assumption",
      "dependencies": [],
      "clause": [
        "Not(cell_3_3)",
        "Not(cell_4_4)"
      ]
    },
    {
      "proof": "assumption",
      "dependencies": [],
      "clause": [
        "Not(cell_3_4)",
        "Not(cell_4_4)"
      ]
    },
    {
      "proof": "assumption",
      "dependencies": [],
      "clause": [
        "Not(cell_3_4)",
        "Not(cell_4_4)"
      ]
    },
    {
      "proof": "assumption",
      "dependencies": [],
      "clause": [
        "Not(cell_3_4)",
        "Not(cell_4_3)"
      ]
    },
    {
      "proof": "assumption",
      "dependencies": [],
      "clause": [
        "Not(cell_3_4)",
        "Not(cell_4_3)"
      ]
    },
    {
      "proof": "assumption",
      "dependencies": [],
      "clause": [
        "Not(cell_4_0)",
        "Not(cell_4_1)"
      ]
    },
    {
      "proof": "assumption",
      "dependencies": [],
      "clause": [
        "Not(cell_4_0)",
        "Not(cell_4_1)"
      ]
    },
    {
      "proof": "assumption",
      "dependencies": [],
      "clause": [
        "Not(cell_4_1)",
        "Not(cell_4_2)"
      ]
    },
    {
      "proof": "assumption",
      "dependencies": [],
      "clause": [
        "Not(cell_4_1)",
        "Not(cell_4_2)"
      ]
    },
    {
      "proof": "assumption",
      "dependencies": [],
      "clause": [
        "Not(cell_4_2)",
        "Not(cell_4_3)"
      ]
    },
    {
      "proof": "assumption",
      "dependencies": [],
      "clause": [
        "Not(cell_4_2)",
        "Not(cell_4_3)"
      ]
    },
    {
      "proof": "assumption",
      "dependencies": [],
      "clause": [
        "Not(cell_4_3)",
        "Not(cell_4_4)"
      ]
    },
    {
      "proof": "assumption",
      "dependencies": [],
      "clause": [
        "Not(cell_4_4)",
        "Not(cell_4_3)"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_2_1, 1, 0) +\nIf(cell_3_1, 1, 0) +\nIf(cell_4_0, 1, 0) +\nIf(cell_4_1, 1, 0) >=\n1",
        "If(cell_2_1, 1, 0) +\nIf(cell_3_1, 1, 0) +\nIf(cell_4_0, 1, 0) +\nIf(cell_4_1, 1, 0) <=\n1"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_2_1, 1, 0) +\nIf(cell_3_1, 1, 0) +\nIf(cell_4_0, 1, 0) +\nIf(cell_4_1, 1, 0) <=\n1",
        "If(cell_2_1, 1, 0) +\nIf(cell_3_1, 1, 0) +\nIf(cell_4_0, 1, 0) +\nIf(cell_4_1, 1, 0) >=\n1"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_2_3, 1, 0) +\nIf(cell_2_4, 1, 0) +\nIf(cell_3_2, 1, 0) +\nIf(cell_3_3, 1, 0) +\nIf(cell_3_4, 1, 0) +\nIf(cell_4_2, 1, 0) +\nIf(cell_4_3, 1, 0) +\nIf(cell_4_4, 1, 0) >=\n1",
        "If(cell_2_3, 1, 0) +\nIf(cell_2_4, 1, 0) +\nIf(cell_3_2, 1, 0) +\nIf(cell_3_3, 1, 0) +\nIf(cell_3_4, 1, 0) +\nIf(cell_4_2, 1, 0) +\nIf(cell_4_3, 1, 0) +\nIf(cell_4_4, 1, 0) <=\n1"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_2_3, 1, 0) +\nIf(cell_2_4, 1, 0) +\nIf(cell_3_2, 1, 0) +\nIf(cell_3_3, 1, 0) +\nIf(cell_3_4, 1, 0) +\nIf(cell_4_2, 1, 0) +\nIf(cell_4_3, 1, 0) +\nIf(cell_4_4, 1, 0) <=\n1",
        "If(cell_2_3, 1, 0) +\nIf(cell_2_4, 1, 0) +\nIf(cell_3_2, 1, 0) +\nIf(cell_3_3, 1, 0) +\nIf(cell_3_4, 1, 0) +\nIf(cell_4_2, 1, 0) +\nIf(cell_4_3, 1, 0) +\nIf(cell_4_4, 1, 0) >=\n1"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_0_2, 1, 0) +\nIf(cell_1_1, 1, 0) +\nIf(cell_1_2, 1, 0) +\nIf(cell_2_2, 1, 0) >=\n1",
        "If(cell_0_2, 1, 0) +\nIf(cell_1_1, 1, 0) +\nIf(cell_1_2, 1, 0) +\nIf(cell_2_2, 1, 0) <=\n1"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_0_2, 1, 0) +\nIf(cell_1_1, 1, 0) +\nIf(cell_1_2, 1, 0) +\nIf(cell_2_2, 1, 0) <=\n1",
        "If(cell_0_2, 1, 0) +\nIf(cell_1_1, 1, 0) +\nIf(cell_1_2, 1, 0) +\nIf(cell_2_2, 1, 0) >=\n1"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_0_0, 1, 0) +\nIf(cell_0_1, 1, 0) +\nIf(cell_1_0, 1, 0) +\nIf(cell_2_0, 1, 0) +\nIf(cell_3_0, 1, 0) >=\n1",
        "If(cell_0_0, 1, 0) +\nIf(cell_0_1, 1, 0) +\nIf(cell_1_0, 1, 0) +\nIf(cell_2_0, 1, 0) +\nIf(cell_3_0, 1, 0) <=\n1"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_0_0, 1, 0) +\nIf(cell_0_1, 1, 0) +\nIf(cell_1_0, 1, 0) +\nIf(cell_2_0, 1, 0) +\nIf(cell_3_0, 1, 0) <=\n1",
        "If(cell_0_0, 1, 0) +\nIf(cell_0_1, 1, 0) +\nIf(cell_1_0, 1, 0) +\nIf(cell_2_0, 1, 0) +\nIf(cell_3_0, 1, 0) >=\n1"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_2_4, 1, 0) + If(cell_3_4, 1, 0) + If(cell_4_4, 1, 0) >=\n0",
        "If(cell_2_4, 1, 0) + If(cell_3_4, 1, 0) + If(cell_4_4, 1, 0) <=\n0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_2_4, 1, 0) + If(cell_3_4, 1, 0) + If(cell_4_4, 1, 0) <=\n0",
        "If(cell_2_4, 1, 0) + If(cell_3_4, 1, 0) + If(cell_4_4, 1, 0) >=\n0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_2_3, 1, 0) + If(cell_3_3, 1, 0) + If(cell_4_3, 1, 0) >=\n1",
        "If(cell_2_3, 1, 0) + If(cell_3_3, 1, 0) + If(cell_4_3, 1, 0) <=\n1"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_2_3, 1, 0) + If(cell_3_3, 1, 0) + If(cell_4_3, 1, 0) <=\n1",
        "If(cell_2_3, 1, 0) + If(cell_3_3, 1, 0) + If(cell_4_3, 1, 0) >=\n1"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_0_2, 1, 0) +\nIf(cell_1_2, 1, 0) +\nIf(cell_2_2, 1, 0) +\nIf(cell_3_2, 1, 0) +\nIf(cell_4_2, 1, 0) >=\n1",
        "If(cell_0_2, 1, 0) +\nIf(cell_1_2, 1, 0) +\nIf(cell_2_2, 1, 0) +\nIf(cell_3_2, 1, 0) +\nIf(cell_4_2, 1, 0) <=\n1"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_0_2, 1, 0) +\nIf(cell_1_2, 1, 0) +\nIf(cell_2_2, 1, 0) +\nIf(cell_3_2, 1, 0) +\nIf(cell_4_2, 1, 0) <=\n1",
        "If(cell_0_2, 1, 0) +\nIf(cell_1_2, 1, 0) +\nIf(cell_2_2, 1, 0) +\nIf(cell_3_2, 1, 0) +\nIf(cell_4_2, 1, 0) >=\n1"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_0_1, 1, 0) +\nIf(cell_1_1, 1, 0) +\nIf(cell_2_1, 1, 0) +\nIf(cell_3_1, 1, 0) +\nIf(cell_4_1, 1, 0) >=\n1",
        "If(cell_0_1, 1, 0) +\nIf(cell_1_1, 1, 0) +\nIf(cell_2_1, 1, 0) +\nIf(cell_3_1, 1, 0) +\nIf(cell_4_1, 1, 0) <=\n1"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_0_1, 1, 0) +\nIf(cell_1_1, 1, 0) +\nIf(cell_2_1, 1, 0) +\nIf(cell_3_1, 1, 0) +\nIf(cell_4_1, 1, 0) <=\n1",
        "If(cell_0_1, 1, 0) +\nIf(cell_1_1, 1, 0) +\nIf(cell_2_1, 1, 0) +\nIf(cell_3_1, 1, 0) +\nIf(cell_4_1, 1, 0) >=\n1"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_0_0, 1, 0) +\nIf(cell_1_0, 1, 0) +\nIf(cell_2_0, 1, 0) +\nIf(cell_3_0, 1, 0) +\nIf(cell_4_0, 1, 0) >=\n1",
        "If(cell_0_0, 1, 0) +\nIf(cell_1_0, 1, 0) +\nIf(cell_2_0, 1, 0) +\nIf(cell_3_0, 1, 0) +\nIf(cell_4_0, 1, 0) <=\n1"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_0_0, 1, 0) +\nIf(cell_1_0, 1, 0) +\nIf(cell_2_0, 1, 0) +\nIf(cell_3_0, 1, 0) +\nIf(cell_4_0, 1, 0) <=\n1",
        "If(cell_0_0, 1, 0) +\nIf(cell_1_0, 1, 0) +\nIf(cell_2_0, 1, 0) +\nIf(cell_3_0, 1, 0) +\nIf(cell_4_0, 1, 0) >=\n1"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_4_0, 1, 0) +\nIf(cell_4_1, 1, 0) +\nIf(cell_4_2, 1, 0) +\nIf(cell_4_3, 1, 0) +\nIf(cell_4_4, 1, 0) >=\n1",
        "If(cell_4_0, 1, 0) +\nIf(cell_4_1, 1, 0) +\nIf(cell_4_2, 1, 0) +\nIf(cell_4_3, 1, 0) +\nIf(cell_4_4, 1, 0) <=\n1"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_4_0, 1, 0) +\nIf(cell_4_1, 1, 0) +\nIf(cell_4_2, 1, 0) +\nIf(cell_4_3, 1, 0) +\nIf(cell_4_4, 1, 0) <=\n1",
        "If(cell_4_0, 1, 0) +\nIf(cell_4_1, 1, 0) +\nIf(cell_4_2, 1, 0) +\nIf(cell_4_3, 1, 0) +\nIf(cell_4_4, 1, 0) >=\n1"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_3_0, 1, 0) +\nIf(cell_3_1, 1, 0) +\nIf(cell_3_2, 1, 0) +\nIf(cell_3_3, 1, 0) +\nIf(cell_3_4, 1, 0) >=\n1",
        "If(cell_3_0, 1, 0) +\nIf(cell_3_1, 1, 0) +\nIf(cell_3_2, 1, 0) +\nIf(cell_3_3, 1, 0) +\nIf(cell_3_4, 1, 0) <=\n1"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_3_0, 1, 0) +\nIf(cell_3_1, 1, 0) +\nIf(cell_3_2, 1, 0) +\nIf(cell_3_3, 1, 0) +\nIf(cell_3_4, 1, 0) <=\n1",
        "If(cell_3_0, 1, 0) +\nIf(cell_3_1, 1, 0) +\nIf(cell_3_2, 1, 0) +\nIf(cell_3_3, 1, 0) +\nIf(cell_3_4, 1, 0) >=\n1"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_2_0, 1, 0) +\nIf(cell_2_1, 1, 0) +\nIf(cell_2_2, 1, 0) +\nIf(cell_2_3, 1, 0) +\nIf(cell_2_4, 1, 0) >=\n1",
        "If(cell_2_0, 1, 0) +\nIf(cell_2_1, 1, 0) +\nIf(cell_2_2, 1, 0) +\nIf(cell_2_3, 1, 0) +\nIf(cell_2_4, 1, 0) <=\n1"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_2_0, 1, 0) +\nIf(cell_2_1, 1, 0) +\nIf(cell_2_2, 1, 0) +\nIf(cell_2_3, 1, 0) +\nIf(cell_2_4, 1, 0) <=\n1",
        "If(cell_2_0, 1, 0) +\nIf(cell_2_1, 1, 0) +\nIf(cell_2_2, 1, 0) +\nIf(cell_2_3, 1, 0) +\nIf(cell_2_4, 1, 0) >=\n1"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_1_0, 1, 0) + If(cell_1_1, 1, 0) + If(cell_1_2, 1, 0) >=\n1",
        "If(cell_1_0, 1, 0) + If(cell_1_1, 1, 0) + If(cell_1_2, 1, 0) <=\n1"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_1_0, 1, 0) + If(cell_1_1, 1, 0) + If(cell_1_2, 1, 0) <=\n1",
        "If(cell_1_0, 1, 0) + If(cell_1_1, 1, 0) + If(cell_1_2, 1, 0) >=\n1"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_0_0, 1, 0) + If(cell_0_1, 1, 0) + If(cell_0_2, 1, 0) >=\n0",
        "If(cell_0_0, 1, 0) + If(cell_0_1, 1, 0) + If(cell_0_2, 1, 0) <=\n0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_0_0, 1, 0) + If(cell_0_1, 1, 0) + If(cell_0_2, 1, 0) <=\n0",
        "If(cell_0_0, 1, 0) + If(cell_0_1, 1, 0) + If(cell_0_2, 1, 0) >=\n0"
      ]
    },
    {
      "proof": "del",
      "dependencies": [],
      "clause": [
        "0 ==\nIf(cell_0_0, 1, 0) + If(cell_0_1, 1, 0) + If(cell_0_2, 1, 0)",
        "Not(If(cell_0_0, 1, 0) +\n    If(cell_0_1, 1, 0) +\n    If(cell_0_2, 1, 0) <=\n    0)",
        "Not(If(cell_0_0, 1, 0) +\n    If(cell_0_1, 1, 0) +\n    If(cell_0_2, 1, 0) >=\n    0)"
      ]
    },
    {
      "proof": "del",
      "dependencies": [],
      "clause": [
        "1 ==\nIf(cell_1_0, 1, 0) + If(cell_1_1, 1, 0) + If(cell_1_2, 1, 0)",
        "Not(If(cell_1_0, 1, 0) +\n    If(cell_1_1, 1, 0) +\n    If(cell_1_2, 1, 0) <=\n    1)",
        "Not(If(cell_1_0, 1, 0) +\n    If(cell_1_1, 1, 0) +\n    If(cell_1_2, 1, 0) >=\n    1)"
      ]
    },
    {
      "proof": "del",
      "dependencies": [],
      "clause": [
        "1 ==\nIf(cell_2_0, 1, 0) +\nIf(cell_2_1, 1, 0) +\nIf(cell_2_2, 1, 0) +\nIf(cell_2_3, 1, 0) +\nIf(cell_2_4, 1, 0)",
        "Not(If(cell_2_0, 1, 0) +\n    If(cell_2_1, 1, 0) +\n    If(cell_2_2, 1, 0) +\n    If(cell_2_3, 1, 0) +\n    If(cell_2_4, 1, 0) <=\n    1)",
        "Not(If(cell_2_0, 1, 0) +\n    If(cell_2_1, 1, 0) +\n    If(cell_2_2, 1, 0) +\n    If(cell_2_3, 1, 0) +\n    If(cell_2_4, 1, 0) >=\n    1)"
      ]
    },
    {
      "proof": "del",
      "dependencies": [],
      "clause": [
        "1 ==\nIf(cell_3_0, 1, 0) +\nIf(cell_3_1, 1, 0) +\nIf(cell_3_2, 1, 0) +\nIf(cell_3_3, 1, 0) +\nIf(cell_3_4, 1, 0)",
        "Not(If(cell_3_0, 1, 0) +\n    If(cell_3_1, 1, 0) +\n    If(cell_3_2, 1, 0) +\n    If(cell_3_3, 1, 0) +\n    If(cell_3_4, 1, 0) <=\n    1)",
        "Not(If(cell_3_0, 1, 0) +\n    If(cell_3_1, 1, 0) +\n    If(cell_3_2, 1, 0) +\n    If(cell_3_3, 1, 0) +\n    If(cell_3_4, 1, 0) >=\n    1)"
      ]
    },
    {
      "proof": "del",
      "dependencies": [],
      "clause": [
        "1 ==\nIf(cell_4_0, 1, 0) +\nIf(cell_4_1, 1, 0) +\nIf(cell_4_2, 1, 0) +\nIf(cell_4_3, 1, 0) +\nIf(cell_4_4, 1, 0)",
        "Not(If(cell_4_0, 1, 0) +\n    If(cell_4_1, 1, 0) +\n    If(cell_4_2, 1, 0) +\n    If(cell_4_3, 1, 0) +\n    If(cell_4_4, 1, 0) <=\n    1)",
        "Not(If(cell_4_0, 1, 0) +\n    If(cell_4_1, 1, 0) +\n    If(cell_4_2, 1, 0) +\n    If(cell_4_3, 1, 0) +\n    If(cell_4_4, 1, 0) >=\n    1)"
      ]
    },
    {
      "proof": "del",
      "dependencies": [],
      "clause": [
        "1 ==\nIf(cell_0_0, 1, 0) +\nIf(cell_1_0, 1, 0) +\nIf(cell_2_0, 1, 0) +\nIf(cell_3_0, 1, 0) +\nIf(cell_4_0, 1, 0)",
        "Not(If(cell_0_0, 1, 0) +\n    If(cell_1_0, 1, 0) +\n    If(cell_2_0, 1, 0) +\n    If(cell_3_0, 1, 0) +\n    If(cell_4_0, 1, 0) <=\n    1)",
        "Not(If(cell_0_0, 1, 0) +\n    If(cell_1_0, 1, 0) +\n    If(cell_2_0, 1, 0) +\n    If(cell_3_0, 1, 0) +\n    If(cell_4_0, 1, 0) >=\n    1)"
      ]
    },
    {
      "proof": "del",
      "dependencies": [],
      "clause": [
        "1 ==\nIf(cell_0_1, 1, 0) +\nIf(cell_1_1, 1, 0) +\nIf(cell_2_1, 1, 0) +\nIf(cell_3_1, 1, 0) +\nIf(cell_4_1, 1, 0)",
        "Not(If(cell_0_1, 1, 0) +\n    If(cell_1_1, 1, 0) +\n    If(cell_2_1, 1, 0) +\n    If(cell_3_1, 1, 0) +\n    If(cell_4_1, 1, 0) <=\n    1)",
        "Not(If(cell_0_1, 1, 0) +\n    If(cell_1_1, 1, 0) +\n    If(cell_2_1, 1, 0) +\n    If(cell_3_1, 1, 0) +\n    If(cell_4_1, 1, 0) >=\n    1)"
      ]
    },
    {
      "proof": "del",
      "dependencies": [],
      "clause": [
        "1 ==\nIf(cell_0_2, 1, 0) +\nIf(cell_1_2, 1, 0) +\nIf(cell_2_2, 1, 0) +\nIf(cell_3_2, 1, 0) +\nIf(cell_4_2, 1, 0)",
        "Not(If(cell_0_2, 1, 0) +\n    If(cell_1_2, 1, 0) +\n    If(cell_2_2, 1, 0) +\n    If(cell_3_2, 1, 0) +\n    If(cell_4_2, 1, 0) <=\n    1)",
        "Not(If(cell_0_2, 1, 0) +\n    If(cell_1_2, 1, 0) +\n    If(cell_2_2, 1, 0) +\n    If(cell_3_2, 1, 0) +\n    If(cell_4_2, 1, 0) >=\n    1)"
      ]
    },
    {
      "proof": "del",
      "dependencies": [],
      "clause": [
        "1 ==\nIf(cell_2_3, 1, 0) + If(cell_3_3, 1, 0) + If(cell_4_3, 1, 0)",
        "Not(If(cell_2_3, 1, 0) +\n    If(cell_3_3, 1, 0) +\n    If(cell_4_3, 1, 0) <=\n    1)",
        "Not(If(cell_2_3, 1, 0) +\n    If(cell_3_3, 1, 0) +\n    If(cell_4_3, 1, 0) >=\n    1)"
      ]
    },
    {
      "proof": "del",
      "dependencies": [],
      "clause": [
        "0 ==\nIf(cell_2_4, 1, 0) + If(cell_3_4, 1, 0) + If(cell_4_4, 1, 0)",
        "Not(If(cell_2_4, 1, 0) +\n    If(cell_3_4, 1, 0) +\n    If(cell_4_4, 1, 0) <=\n    0)",
        "Not(If(cell_2_4, 1, 0) +\n    If(cell_3_4, 1, 0) +\n    If(cell_4_4, 1, 0) >=\n    0)"
      ]
    },
    {
      "proof": "del",
      "dependencies": [],
      "clause": [
        "1 ==\nIf(cell_0_0, 1, 0) +\nIf(cell_0_1, 1, 0) +\nIf(cell_1_0, 1, 0) +\nIf(cell_2_0, 1, 0) +\nIf(cell_3_0, 1, 0)",
        "Not(If(cell_0_0, 1, 0) +\n    If(cell_0_1, 1, 0) +\n    If(cell_1_0, 1, 0) +\n    If(cell_2_0, 1, 0) +\n    If(cell_3_0, 1, 0) <=\n    1)",
        "Not(If(cell_0_0, 1, 0) +\n    If(cell_0_1, 1, 0) +\n    If(cell_1_0, 1, 0) +\n    If(cell_2_0, 1, 0) +\n    If(cell_3_0, 1, 0) >=\n    1)"
      ]
    },
    {
      "proof": "del",
      "dependencies": [],
      "clause": [
        "1 ==\nIf(cell_0_2, 1, 0) +\nIf(cell_1_1, 1, 0) +\nIf(cell_1_2, 1, 0) +\nIf(cell_2_2, 1, 0)",
        "Not(If(cell_0_2, 1, 0) +\n    If(cell_1_1, 1, 0) +\n    If(cell_1_2, 1, 0) +\n    If(cell_2_2, 1, 0) <=\n    1)",
        "Not(If(cell_0_2, 1, 0) +\n    If(cell_1_1, 1, 0) +\n    If(cell_1_2, 1, 0) +\n    If(cell_2_2, 1, 0) >=\n    1)"
      ]
    },
    {
      "proof": "del",
      "dependencies": [],
      "clause": [
        "1 ==\nIf(cell_2_3, 1, 0) +\nIf(cell_2_4, 1, 0) +\nIf(cell_3_2, 1, 0) +\nIf(cell_3_3, 1, 0) +\nIf(cell_3_4, 1, 0) +\nIf(cell_4_2, 1, 0) +\nIf(cell_4_3, 1, 0) +\nIf(cell_4_4, 1, 0)",
        "Not(If(cell_2_3, 1, 0) +\n    If(cell_2_4, 1, 0) +\n    If(cell_3_2, 1, 0) +\n    If(cell_3_3, 1, 0) +\n    If(cell_3_4, 1, 0) +\n    If(cell_4_2, 1, 0) +\n    If(cell_4_3, 1, 0) +\n    If(cell_4_4, 1, 0) <=\n    1)",
        "Not(If(cell_2_3, 1, 0) +\n    If(cell_2_4, 1, 0) +\n    If(cell_3_2, 1, 0) +\n    If(cell_3_3, 1, 0) +\n    If(cell_3_4, 1, 0) +\n    If(cell_4_2, 1, 0) +\n    If(cell_4_3, 1, 0) +\n    If(cell_4_4, 1, 0) >=\n    1)"
      ]
    },
    {
      "proof": "del",
      "dependencies": [],
      "clause": [
        "1 ==\nIf(cell_2_1, 1, 0) +\nIf(cell_3_1, 1, 0) +\nIf(cell_4_0, 1, 0) +\nIf(cell_4_1, 1, 0)",
        "Not(If(cell_2_1, 1, 0) +\n    If(cell_3_1, 1, 0) +\n    If(cell_4_0, 1, 0) +\n    If(cell_4_1, 1, 0) <=\n    1)",
        "Not(If(cell_2_1, 1, 0) +\n    If(cell_3_1, 1, 0) +\n    If(cell_4_0, 1, 0) +\n    If(cell_4_1, 1, 0) >=\n    1)"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_2_0, 1, 0) >= 0",
        "If(cell_2_0, 1, 0) <= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_2_0, 1, 0) <= 0",
        "If(cell_2_0, 1, 0) >= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(0 == If(cell_2_0, 1, 0))",
        "If(cell_2_0, 1, 0) <= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(0 == If(cell_2_0, 1, 0))",
        "If(cell_2_0, 1, 0) >= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "0 == If(cell_2_0, 1, 0)",
        "Not(If(cell_2_0, 1, 0) <= 0)",
        "Not(If(cell_2_0, 1, 0) >= 0)"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_4_3, 1, 0) >= 1",
        "If(cell_4_3, 1, 0) <= 1"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_4_3, 1, 0) <= 1",
        "If(cell_4_3, 1, 0) >= 1"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(1 == If(cell_4_3, 1, 0))",
        "If(cell_4_3, 1, 0) <= 1"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(1 == If(cell_4_3, 1, 0))",
        "If(cell_4_3, 1, 0) >= 1"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "1 == If(cell_4_3, 1, 0)",
        "Not(If(cell_4_3, 1, 0) <= 1)",
        "Not(If(cell_4_3, 1, 0) >= 1)"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_4_4, 1, 0) >= 0",
        "If(cell_4_4, 1, 0) <= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_4_4, 1, 0) <= 0",
        "If(cell_4_4, 1, 0) >= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(0 == If(cell_4_4, 1, 0))",
        "If(cell_4_4, 1, 0) <= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(0 == If(cell_4_4, 1, 0))",
        "If(cell_4_4, 1, 0) >= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "0 == If(cell_4_4, 1, 0)",
        "Not(If(cell_4_4, 1, 0) <= 0)",
        "Not(If(cell_4_4, 1, 0) >= 0)"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_4_2, 1, 0) >= 0",
        "If(cell_4_2, 1, 0) <= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_4_2, 1, 0) <= 0",
        "If(cell_4_2, 1, 0) >= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(0 == If(cell_4_2, 1, 0))",
        "If(cell_4_2, 1, 0) <= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(0 == If(cell_4_2, 1, 0))",
        "If(cell_4_2, 1, 0) >= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "0 == If(cell_4_2, 1, 0)",
        "Not(If(cell_4_2, 1, 0) <= 0)",
        "Not(If(cell_4_2, 1, 0) >= 0)"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_3_4, 1, 0) >= 0",
        "If(cell_3_4, 1, 0) <= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_3_4, 1, 0) <= 0",
        "If(cell_3_4, 1, 0) >= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(0 == If(cell_3_4, 1, 0))",
        "If(cell_3_4, 1, 0) <= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(0 == If(cell_3_4, 1, 0))",
        "If(cell_3_4, 1, 0) >= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "0 == If(cell_3_4, 1, 0)",
        "Not(If(cell_3_4, 1, 0) <= 0)",
        "Not(If(cell_3_4, 1, 0) >= 0)"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_3_3, 1, 0) >= 0",
        "If(cell_3_3, 1, 0) <= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_3_3, 1, 0) <= 0",
        "If(cell_3_3, 1, 0) >= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(0 == If(cell_3_3, 1, 0))",
        "If(cell_3_3, 1, 0) <= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(0 == If(cell_3_3, 1, 0))",
        "If(cell_3_3, 1, 0) >= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "0 == If(cell_3_3, 1, 0)",
        "Not(If(cell_3_3, 1, 0) <= 0)",
        "Not(If(cell_3_3, 1, 0) >= 0)"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_3_2, 1, 0) >= 0",
        "If(cell_3_2, 1, 0) <= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_3_2, 1, 0) <= 0",
        "If(cell_3_2, 1, 0) >= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(0 == If(cell_3_2, 1, 0))",
        "If(cell_3_2, 1, 0) <= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(0 == If(cell_3_2, 1, 0))",
        "If(cell_3_2, 1, 0) >= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "0 == If(cell_3_2, 1, 0)",
        "Not(If(cell_3_2, 1, 0) <= 0)",
        "Not(If(cell_3_2, 1, 0) >= 0)"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_4_1, 1, 0) >= 1",
        "If(cell_4_1, 1, 0) <= 1"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_4_1, 1, 0) <= 1",
        "If(cell_4_1, 1, 0) >= 1"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(1 == If(cell_4_1, 1, 0))",
        "If(cell_4_1, 1, 0) <= 1"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(1 == If(cell_4_1, 1, 0))",
        "If(cell_4_1, 1, 0) >= 1"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "1 == If(cell_4_1, 1, 0)",
        "Not(If(cell_4_1, 1, 0) <= 1)",
        "Not(If(cell_4_1, 1, 0) >= 1)"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_4_0, 1, 0) >= 0",
        "If(cell_4_0, 1, 0) <= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_4_0, 1, 0) <= 0",
        "If(cell_4_0, 1, 0) >= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(0 == If(cell_4_0, 1, 0))",
        "If(cell_4_0, 1, 0) <= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(0 == If(cell_4_0, 1, 0))",
        "If(cell_4_0, 1, 0) >= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "0 == If(cell_4_0, 1, 0)",
        "Not(If(cell_4_0, 1, 0) <= 0)",
        "Not(If(cell_4_0, 1, 0) >= 0)"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_3_1, 1, 0) >= 0",
        "If(cell_3_1, 1, 0) <= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_3_1, 1, 0) <= 0",
        "If(cell_3_1, 1, 0) >= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(0 == If(cell_3_1, 1, 0))",
        "If(cell_3_1, 1, 0) <= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(0 == If(cell_3_1, 1, 0))",
        "If(cell_3_1, 1, 0) >= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "0 == If(cell_3_1, 1, 0)",
        "Not(If(cell_3_1, 1, 0) <= 0)",
        "Not(If(cell_3_1, 1, 0) >= 0)"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_3_0, 1, 0) >= 0",
        "If(cell_3_0, 1, 0) <= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_3_0, 1, 0) <= 0",
        "If(cell_3_0, 1, 0) >= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(0 == If(cell_3_0, 1, 0))",
        "If(cell_3_0, 1, 0) <= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(0 == If(cell_3_0, 1, 0))",
        "If(cell_3_0, 1, 0) >= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "0 == If(cell_3_0, 1, 0)",
        "Not(If(cell_3_0, 1, 0) <= 0)",
        "Not(If(cell_3_0, 1, 0) >= 0)"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(If(cell_0_2, 1, 0) +\n    If(cell_1_2, 1, 0) +\n    If(cell_2_2, 1, 0) +\n    If(cell_3_2, 1, 0) +\n    If(cell_4_2, 1, 0) <=\n    1)",
        "Not(If(cell_0_0, 1, 0) +\n    If(cell_0_1, 1, 0) +\n    If(cell_0_2, 1, 0) >=\n    0)",
        "Not(If(cell_0_1, 1, 0) +\n    If(cell_1_1, 1, 0) +\n    If(cell_2_1, 1, 0) +\n    If(cell_3_1, 1, 0) +\n    If(cell_4_1, 1, 0) <=\n    1)",
        "Not(If(cell_2_0, 1, 0) +\n    If(cell_2_1, 1, 0) +\n    If(cell_2_2, 1, 0) +\n    If(cell_2_3, 1, 0) +\n    If(cell_2_4, 1, 0) >=\n    1)",
        "Not(If(cell_1_0, 1, 0) +\n    If(cell_1_1, 1, 0) +\n    If(cell_1_2, 1, 0) >=\n    1)",
        "Not(If(cell_2_3, 1, 0) +\n    If(cell_2_4, 1, 0) +\n    If(cell_3_2, 1, 0) +\n    If(cell_3_3, 1, 0) +\n    If(cell_3_4, 1, 0) +\n    If(cell_4_2, 1, 0) +\n    If(cell_4_3, 1, 0) +\n    If(cell_4_4, 1, 0) <=\n    1)",
        "Not(If(cell_3_0, 1, 0) +\n    If(cell_3_1, 1, 0) +\n    If(cell_3_2, 1, 0) +\n    If(cell_3_3, 1, 0) +\n    If(cell_3_4, 1, 0) >=\n    1)",
        "Not(If(cell_0_0, 1, 0) +\n    If(cell_1_0, 1, 0) +\n    If(cell_2_0, 1, 0) +\n    If(cell_3_0, 1, 0) +\n    If(cell_4_0, 1, 0) <=\n    1)",
        "Not(If(cell_3_4, 1, 0) <= 0)",
        "Not(If(cell_4_0, 1, 0) +\n    If(cell_4_1, 1, 0) +\n    If(cell_4_2, 1, 0) +\n    If(cell_4_3, 1, 0) +\n    If(cell_4_4, 1, 0) >=\n    1)",
        "Not(If(cell_4_2, 1, 0) >= 0)",
        "Not(If(cell_3_0, 1, 0) <= 0)",
        "Not(If(cell_3_3, 1, 0) <= 0)",
        "Not(If(cell_3_1, 1, 0) <= 0)",
        "False"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(0 == If(cell_3_0, 1, 0))",
        "If(cell_3_0, 1, 0) <= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(0 == If(cell_3_1, 1, 0))",
        "If(cell_3_1, 1, 0) <= 0"
      ]
    },
    {
      "proof": "rup",
      "dependencies": [],
      "clause": [
        "Not(cell_4_1)",
        "Not(If(cell_3_4, 1, 0) <= 0)",
        "Not(If(cell_4_2, 1, 0) >= 0)",
        "Not(If(cell_3_3, 1, 0) <= 0)"
      ]
    },
    {
      "proof": "rup",
      "dependencies": [],
      "clause": [
        "Not(cell_4_1)",
        "Not(If(cell_3_4, 1, 0) <= 0)",
        "Not(If(cell_4_2, 1, 0) >= 0)",
        "Not(If(cell_3_3, 1, 0) <= 0)"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_4_1, 1, 0) >= 0",
        "If(cell_4_1, 1, 0) <= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_4_1, 1, 0) <= 0",
        "If(cell_4_1, 1, 0) >= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(0 == If(cell_4_1, 1, 0))",
        "If(cell_4_1, 1, 0) <= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(0 == If(cell_4_1, 1, 0))",
        "If(cell_4_1, 1, 0) >= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "0 == If(cell_4_1, 1, 0)",
        "Not(If(cell_4_1, 1, 0) <= 0)",
        "Not(If(cell_4_1, 1, 0) >= 0)"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_3_0, 1, 0) >= 1",
        "If(cell_3_0, 1, 0) <= 1"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_3_0, 1, 0) <= 1",
        "If(cell_3_0, 1, 0) >= 1"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(1 == If(cell_3_0, 1, 0))",
        "If(cell_3_0, 1, 0) <= 1"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(1 == If(cell_3_0, 1, 0))",
        "If(cell_3_0, 1, 0) >= 1"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "1 == If(cell_3_0, 1, 0)",
        "Not(If(cell_3_0, 1, 0) <= 1)",
        "Not(If(cell_3_0, 1, 0) >= 1)"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_3_1, 1, 0) >= 0",
        "If(cell_3_1, 1, 0) <= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_3_1, 1, 0) <= 0",
        "If(cell_3_1, 1, 0) >= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(0 == If(cell_3_1, 1, 0))",
        "If(cell_3_1, 1, 0) <= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(0 == If(cell_3_1, 1, 0))",
        "If(cell_3_1, 1, 0) >= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "0 == If(cell_3_1, 1, 0)",
        "Not(If(cell_3_1, 1, 0) <= 0)",
        "Not(If(cell_3_1, 1, 0) >= 0)"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_4_0, 1, 0) >= 0",
        "If(cell_4_0, 1, 0) <= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_4_0, 1, 0) <= 0",
        "If(cell_4_0, 1, 0) >= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(0 == If(cell_4_0, 1, 0))",
        "If(cell_4_0, 1, 0) <= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(0 == If(cell_4_0, 1, 0))",
        "If(cell_4_0, 1, 0) >= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "0 == If(cell_4_0, 1, 0)",
        "Not(If(cell_4_0, 1, 0) <= 0)",
        "Not(If(cell_4_0, 1, 0) >= 0)"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_2_1, 1, 0) >= 0",
        "If(cell_2_1, 1, 0) <= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_2_1, 1, 0) <= 0",
        "If(cell_2_1, 1, 0) >= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(0 == If(cell_2_1, 1, 0))",
        "If(cell_2_1, 1, 0) <= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(0 == If(cell_2_1, 1, 0))",
        "If(cell_2_1, 1, 0) >= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "0 == If(cell_2_1, 1, 0)",
        "Not(If(cell_2_1, 1, 0) <= 0)",
        "Not(If(cell_2_1, 1, 0) >= 0)"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(If(cell_0_0, 1, 0) +\n    If(cell_0_1, 1, 0) +\n    If(cell_1_0, 1, 0) +\n    If(cell_2_0, 1, 0) +\n    If(cell_3_0, 1, 0) <=\n    1)",
        "Not(If(cell_0_0, 1, 0) +\n    If(cell_1_0, 1, 0) +\n    If(cell_2_0, 1, 0) +\n    If(cell_3_0, 1, 0) +\n    If(cell_4_0, 1, 0) >=\n    1)",
        "Not(If(cell_3_4, 1, 0) >= 0)",
        "Not(If(cell_3_0, 1, 0) +\n    If(cell_3_1, 1, 0) +\n    If(cell_3_2, 1, 0) +\n    If(cell_3_3, 1, 0) +\n    If(cell_3_4, 1, 0) <=\n    1)",
        "Not(If(cell_4_4, 1, 0) >= 0)",
        "Not(If(cell_4_0, 1, 0) +\n    If(cell_4_1, 1, 0) +\n    If(cell_4_2, 1, 0) +\n    If(cell_4_3, 1, 0) +\n    If(cell_4_4, 1, 0) <=\n    1)",
        "Not(If(cell_2_1, 1, 0) <= 0)",
        "Not(If(cell_4_3, 1, 0) >= 1)",
        "Not(If(cell_0_2, 1, 0) +\n    If(cell_1_1, 1, 0) +\n    If(cell_1_2, 1, 0) +\n    If(cell_2_2, 1, 0) <=\n    1)",
        "Not(If(cell_3_0, 1, 0) >= 1)",
        "Not(If(cell_3_3, 1, 0) >= 0)",
        "Not(If(cell_0_2, 1, 0) +\n    If(cell_1_2, 1, 0) +\n    If(cell_2_2, 1, 0) +\n    If(cell_3_2, 1, 0) +\n    If(cell_4_2, 1, 0) >=\n    1)",
        "Not(If(cell_0_1, 1, 0) +\n    If(cell_1_1, 1, 0) +\n    If(cell_2_1, 1, 0) +\n    If(cell_3_1, 1, 0) +\n    If(cell_4_1, 1, 0) >=\n    1)",
        "False"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(0 == If(cell_2_1, 1, 0))",
        "If(cell_2_1, 1, 0) <= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(1 == If(cell_3_0, 1, 0))",
        "If(cell_3_0, 1, 0) >= 1"
      ]
    },
    {
      "proof": "rup",
      "dependencies": [],
      "clause": [
        "Not(cell_3_0)",
        "Not(If(cell_3_4, 1, 0) >= 0)",
        "Not(If(cell_4_4, 1, 0) >= 0)",
        "Not(If(cell_4_3, 1, 0) >= 1)",
        "Not(If(cell_3_3, 1, 0) >= 0)"
      ]
    },
    {
      "proof": "rup",
      "dependencies": [],
      "clause": [
        "Not(cell_3_0)",
        "Not(If(cell_3_4, 1, 0) >= 0)",
        "Not(If(cell_4_4, 1, 0) >= 0)",
        "Not(If(cell_4_3, 1, 0) >= 1)",
        "Not(If(cell_3_3, 1, 0) >= 0)"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_3_0, 1, 0) >= 0",
        "If(cell_3_0, 1, 0) <= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_3_0, 1, 0) <= 0",
        "If(cell_3_0, 1, 0) >= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(0 == If(cell_3_0, 1, 0))",
        "If(cell_3_0, 1, 0) <= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(0 == If(cell_3_0, 1, 0))",
        "If(cell_3_0, 1, 0) >= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "0 == If(cell_3_0, 1, 0)",
        "Not(If(cell_3_0, 1, 0) <= 0)",
        "Not(If(cell_3_0, 1, 0) >= 0)"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "1 == If(cell_2_0, 1, 0)",
        "Not(0 == If(cell_2_0, 1, 0))",
        "Not(If(cell_0_0, 1, 0) +\n    If(cell_0_1, 1, 0) +\n    If(cell_0_2, 1, 0) <=\n    0)",
        "Not(If(cell_0_0, 1, 0) +\n    If(cell_0_1, 1, 0) +\n    If(cell_0_2, 1, 0) >=\n    0)",
        "Not(If(cell_1_0, 1, 0) +\n    If(cell_1_1, 1, 0) +\n    If(cell_1_2, 1, 0) <=\n    1)",
        "Not(If(cell_4_2, 1, 0) <= 0)",
        "Not(If(cell_1_0, 1, 0) +\n    If(cell_1_1, 1, 0) +\n    If(cell_1_2, 1, 0) >=\n    1)",
        "Not(If(cell_4_2, 1, 0) >= 0)",
        "Not(If(cell_2_0, 1, 0) +\n    If(cell_2_1, 1, 0) +\n    If(cell_2_2, 1, 0) +\n    If(cell_2_3, 1, 0) +\n    If(cell_2_4, 1, 0) <=\n    1)",
        "Not(If(cell_3_4, 1, 0) <= 0)",
        "Not(If(cell_2_0, 1, 0) +\n    If(cell_2_1, 1, 0) +\n    If(cell_2_2, 1, 0) +\n    If(cell_2_3, 1, 0) +\n    If(cell_2_4, 1, 0) >=\n    1)",
        "Not(If(cell_3_4, 1, 0) >= 0)",
        "Not(If(cell_3_0, 1, 0) +\n    If(cell_3_1, 1, 0) +\n    If(cell_3_2, 1, 0) +\n    If(cell_3_3, 1, 0) +\n    If(cell_3_4, 1, 0) <=\n    1)",
        "Not(If(cell_3_3, 1, 0) <= 0)",
        "Not(If(cell_3_0, 1, 0) +\n    If(cell_3_1, 1, 0) +\n    If(cell_3_2, 1, 0) +\n    If(cell_3_3, 1, 0) +\n    If(cell_3_4, 1, 0) >=\n    1)",
        "Not(If(cell_3_3, 1, 0) >= 0)",
        "Not(If(cell_4_0, 1, 0) +\n    If(cell_4_1, 1, 0) +\n    If(cell_4_2, 1, 0) +\n    If(cell_4_3, 1, 0) +\n    If(cell_4_4, 1, 0) <=\n    1)",
        "Not(If(cell_4_0, 1, 0) +\n    If(cell_4_1, 1, 0) +\n    If(cell_4_2, 1, 0) +\n    If(cell_4_3, 1, 0) +\n    If(cell_4_4, 1, 0) >=\n    1)",
        "Not(If(cell_0_0, 1, 0) +\n    If(cell_1_0, 1, 0) +\n    If(cell_2_0, 1, 0) +\n    If(cell_3_0, 1, 0) +\n    If(cell_4_0, 1, 0) <=\n    1)",
        "Not(If(cell_0_0, 1, 0) +\n    If(cell_1_0, 1, 0) +\n    If(cell_2_0, 1, 0) +\n    If(cell_3_0, 1, 0) +\n    If(cell_4_0, 1, 0) >=\n    1)",
        "Not(If(cell_0_1, 1, 0) +\n    If(cell_1_1, 1, 0) +\n    If(cell_2_1, 1, 0) +\n    If(cell_3_1, 1, 0) +\n    If(cell_4_1, 1, 0) <=\n    1)",
        "Not(If(cell_3_0, 1, 0) <= 0)",
        "Not(If(cell_0_1, 1, 0) +\n    If(cell_1_1, 1, 0) +\n    If(cell_2_1, 1, 0) +\n    If(cell_3_1, 1, 0) +\n    If(cell_4_1, 1, 0) >=\n    1)",
        "Not(If(cell_3_0, 1, 0) >= 0)",
        "Not(If(cell_0_2, 1, 0) +\n    If(cell_1_2, 1, 0) +\n    If(cell_2_2, 1, 0) +\n    If(cell_3_2, 1, 0) +\n    If(cell_4_2, 1, 0) <=\n    1)",
        "Not(If(cell_0_2, 1, 0) +\n    If(cell_1_2, 1, 0) +\n    If(cell_2_2, 1, 0) +\n    If(cell_3_2, 1, 0) +\n    If(cell_4_2, 1, 0) >=\n    1)",
        "Not(If(cell_2_3, 1, 0) +\n    If(cell_2_4, 1, 0) +\n    If(cell_3_2, 1, 0) +\n    If(cell_3_3, 1, 0) +\n    If(cell_3_4, 1, 0) +\n    If(cell_4_2, 1, 0) +\n    If(cell_4_3, 1, 0) +\n    If(cell_4_4, 1, 0) <=\n    1)",
        "Not(If(cell_2_3, 1, 0) +\n    If(cell_2_4, 1, 0) +\n    If(cell_3_2, 1, 0) +\n    If(cell_3_3, 1, 0) +\n    If(cell_3_4, 1, 0) +\n    If(cell_4_2, 1, 0) +\n    If(cell_4_3, 1, 0) +\n    If(cell_4_4, 1, 0) >=\n    1)",
        "Not(0 == If(cell_3_1, 1, 0))"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "1 == If(cell_2_0, 1, 0)",
        "Not(If(cell_2_0, 1, 0) <= 0)",
        "Not(If(cell_3_0, 1, 0) <= 0)",
        "Not(If(cell_2_0, 1, 0) >= 0)",
        "Not(If(cell_3_0, 1, 0) >= 0)",
        "Not(If(cell_0_0, 1, 0) +\n    If(cell_0_1, 1, 0) +\n    If(cell_0_2, 1, 0) <=\n    0)",
        "Not(If(cell_0_0, 1, 0) +\n    If(cell_0_1, 1, 0) +\n    If(cell_0_2, 1, 0) >=\n    0)",
        "Not(If(cell_1_0, 1, 0) +\n    If(cell_1_1, 1, 0) +\n    If(cell_1_2, 1, 0) <=\n    1)",
        "Not(If(cell_1_0, 1, 0) +\n    If(cell_1_1, 1, 0) +\n    If(cell_1_2, 1, 0) >=\n    1)",
        "Not(If(cell_0_0, 1, 0) +\n    If(cell_0_1, 1, 0) +\n    If(cell_1_0, 1, 0) +\n    If(cell_2_0, 1, 0) +\n    If(cell_3_0, 1, 0) <=\n    1)",
        "Not(If(cell_0_0, 1, 0) +\n    If(cell_0_1, 1, 0) +\n    If(cell_1_0, 1, 0) +\n    If(cell_2_0, 1, 0) +\n    If(cell_3_0, 1, 0) >=\n    1)",
        "Not(If(cell_0_2, 1, 0) +\n    If(cell_1_1, 1, 0) +\n    If(cell_1_2, 1, 0) +\n    If(cell_2_2, 1, 0) <=\n    1)",
        "Not(If(cell_0_2, 1, 0) +\n    If(cell_1_1, 1, 0) +\n    If(cell_1_2, 1, 0) +\n    If(cell_2_2, 1, 0) >=\n    1)",
        "Not(0 == If(cell_2_2, 1, 0))"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(0 == If(cell_3_0, 1, 0))",
        "If(cell_3_0, 1, 0) >= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(0 == If(cell_3_0, 1, 0))",
        "If(cell_3_0, 1, 0) <= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(0 == If(cell_3_3, 1, 0))",
        "If(cell_3_3, 1, 0) >= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(0 == If(cell_3_3, 1, 0))",
        "If(cell_3_3, 1, 0) <= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(0 == If(cell_3_4, 1, 0))",
        "If(cell_3_4, 1, 0) >= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(0 == If(cell_3_4, 1, 0))",
        "If(cell_3_4, 1, 0) <= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(0 == If(cell_4_2, 1, 0))",
        "If(cell_4_2, 1, 0) >= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(0 == If(cell_4_2, 1, 0))",
        "If(cell_4_2, 1, 0) <= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(0 == If(cell_4_4, 1, 0))",
        "If(cell_4_4, 1, 0) >= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(1 == If(cell_4_3, 1, 0))",
        "If(cell_4_3, 1, 0) >= 1"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_3_4, 1, 0) >= 0",
        "If(cell_3_4, 1, 0) <= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_3_4, 1, 0) <= 0",
        "If(cell_3_4, 1, 0) >= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_3_3, 1, 0) >= 0",
        "If(cell_3_3, 1, 0) <= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_3_3, 1, 0) <= 0",
        "If(cell_3_3, 1, 0) >= 0"
      ]
    },
    {
      "proof": "rup",
      "dependencies": [],
      "clause": [
        "Not(cell_4_3)",
        "1 == If(cell_2_0, 1, 0)"
      ]
    },
    {
      "proof": "rup",
      "dependencies": [],
      "clause": [
        "Not(cell_4_3)",
        "1 == If(cell_2_0, 1, 0)"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(If(cell_4_3, 1, 0) <= 0)",
        "Not(If(cell_4_3, 1, 0) >= 1)"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(If(cell_4_3, 1, 0) >= 1)",
        "Not(If(cell_4_3, 1, 0) <= 0)"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_4_3, 1, 0) <= 0",
        "If(cell_4_3, 1, 0) >= 1"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_4_3, 1, 0) >= 1",
        "If(cell_4_3, 1, 0) <= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_4_3, 1, 0) >= 0",
        "Not(If(cell_4_3, 1, 0) >= 1)"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(If(cell_4_3, 1, 0) >= 1)",
        "If(cell_4_3, 1, 0) >= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_4_3, 1, 0) >= 0",
        "If(cell_4_3, 1, 0) <= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_4_3, 1, 0) <= 0",
        "If(cell_4_3, 1, 0) >= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(0 == If(cell_4_3, 1, 0))",
        "If(cell_4_3, 1, 0) <= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(0 == If(cell_4_3, 1, 0))",
        "If(cell_4_3, 1, 0) >= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "0 == If(cell_4_3, 1, 0)",
        "Not(If(cell_4_3, 1, 0) <= 0)",
        "Not(If(cell_4_3, 1, 0) >= 0)"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_3_0, 1, 0) >= 0",
        "If(cell_3_0, 1, 0) <= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_3_0, 1, 0) <= 0",
        "If(cell_3_0, 1, 0) >= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(0 == If(cell_3_0, 1, 0))",
        "If(cell_3_0, 1, 0) <= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(0 == If(cell_3_0, 1, 0))",
        "If(cell_3_0, 1, 0) >= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "0 == If(cell_3_0, 1, 0)",
        "Not(If(cell_3_0, 1, 0) <= 0)",
        "Not(If(cell_3_0, 1, 0) >= 0)"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(0 == If(cell_3_3, 1, 0))",
        "If(cell_3_3, 1, 0) <= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(0 == If(cell_3_3, 1, 0))",
        "If(cell_3_3, 1, 0) >= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "0 == If(cell_3_3, 1, 0)",
        "Not(If(cell_3_3, 1, 0) <= 0)",
        "Not(If(cell_3_3, 1, 0) >= 0)"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_3_1, 1, 0) >= 0",
        "If(cell_3_1, 1, 0) <= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_3_1, 1, 0) <= 0",
        "If(cell_3_1, 1, 0) >= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(0 == If(cell_3_1, 1, 0))",
        "If(cell_3_1, 1, 0) <= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(0 == If(cell_3_1, 1, 0))",
        "If(cell_3_1, 1, 0) >= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "0 == If(cell_3_1, 1, 0)",
        "Not(If(cell_3_1, 1, 0) <= 0)",
        "Not(If(cell_3_1, 1, 0) >= 0)"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_2_3, 1, 0) >= 0",
        "If(cell_2_3, 1, 0) <= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_2_3, 1, 0) <= 0",
        "If(cell_2_3, 1, 0) >= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(0 == If(cell_2_3, 1, 0))",
        "If(cell_2_3, 1, 0) <= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(0 == If(cell_2_3, 1, 0))",
        "If(cell_2_3, 1, 0) >= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "0 == If(cell_2_3, 1, 0)",
        "Not(If(cell_2_3, 1, 0) <= 0)",
        "Not(If(cell_2_3, 1, 0) >= 0)"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_3_2, 1, 0) >= 0",
        "If(cell_3_2, 1, 0) <= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_3_2, 1, 0) <= 0",
        "If(cell_3_2, 1, 0) >= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(0 == If(cell_3_2, 1, 0))",
        "If(cell_3_2, 1, 0) <= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(0 == If(cell_3_2, 1, 0))",
        "If(cell_3_2, 1, 0) >= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "0 == If(cell_3_2, 1, 0)",
        "Not(If(cell_3_2, 1, 0) <= 0)",
        "Not(If(cell_3_2, 1, 0) >= 0)"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_2_1, 1, 0) >= 0",
        "If(cell_2_1, 1, 0) <= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_2_1, 1, 0) <= 0",
        "If(cell_2_1, 1, 0) >= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(0 == If(cell_2_1, 1, 0))",
        "If(cell_2_1, 1, 0) <= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(0 == If(cell_2_1, 1, 0))",
        "If(cell_2_1, 1, 0) >= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "0 == If(cell_2_1, 1, 0)",
        "Not(If(cell_2_1, 1, 0) <= 0)",
        "Not(If(cell_2_1, 1, 0) >= 0)"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_1_2, 1, 0) >= 0",
        "If(cell_1_2, 1, 0) <= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_1_2, 1, 0) <= 0",
        "If(cell_1_2, 1, 0) >= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(0 == If(cell_1_2, 1, 0))",
        "If(cell_1_2, 1, 0) <= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(0 == If(cell_1_2, 1, 0))",
        "If(cell_1_2, 1, 0) >= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "0 == If(cell_1_2, 1, 0)",
        "Not(If(cell_1_2, 1, 0) <= 0)",
        "Not(If(cell_1_2, 1, 0) >= 0)"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_1_1, 1, 0) >= 0",
        "If(cell_1_1, 1, 0) <= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_1_1, 1, 0) <= 0",
        "If(cell_1_1, 1, 0) >= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(0 == If(cell_1_1, 1, 0))",
        "If(cell_1_1, 1, 0) <= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(0 == If(cell_1_1, 1, 0))",
        "If(cell_1_1, 1, 0) >= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "0 == If(cell_1_1, 1, 0)",
        "Not(If(cell_1_1, 1, 0) <= 0)",
        "Not(If(cell_1_1, 1, 0) >= 0)"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(If(cell_2_3, 1, 0) <= 0)",
        "Not(If(cell_2_3, 1, 0) +\n    If(cell_3_3, 1, 0) +\n    If(cell_4_3, 1, 0) >=\n    1)",
        "Not(If(cell_4_3, 1, 0) <= 0)",
        "Not(If(cell_3_3, 1, 0) <= 0)",
        "False"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(0 == If(cell_2_3, 1, 0))",
        "If(cell_2_3, 1, 0) <= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(0 == If(cell_3_3, 1, 0))",
        "If(cell_3_3, 1, 0) <= 0"
      ]
    },
    {
      "proof": "rup",
      "dependencies": [],
      "clause": [
        "Not(cell_2_2)",
        "Not(If(cell_4_3, 1, 0) <= 0)"
      ]
    },
    {
      "proof": "rup",
      "dependencies": [],
      "clause": [
        "Not(cell_2_2)",
        "Not(If(cell_4_3, 1, 0) <= 0)"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_2_2, 1, 0) >= 0",
        "If(cell_2_2, 1, 0) <= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_2_2, 1, 0) <= 0",
        "If(cell_2_2, 1, 0) >= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(0 == If(cell_2_2, 1, 0))",
        "If(cell_2_2, 1, 0) <= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(0 == If(cell_2_2, 1, 0))",
        "If(cell_2_2, 1, 0) >= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "0 == If(cell_2_2, 1, 0)",
        "Not(If(cell_2_2, 1, 0) <= 0)",
        "Not(If(cell_2_2, 1, 0) >= 0)"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_4_1, 1, 0) >= 0",
        "If(cell_4_1, 1, 0) <= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_4_1, 1, 0) <= 0",
        "If(cell_4_1, 1, 0) >= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(0 == If(cell_4_1, 1, 0))",
        "If(cell_4_1, 1, 0) <= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(0 == If(cell_4_1, 1, 0))",
        "If(cell_4_1, 1, 0) >= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "0 == If(cell_4_1, 1, 0)",
        "Not(If(cell_4_1, 1, 0) <= 0)",
        "Not(If(cell_4_1, 1, 0) >= 0)"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_3_1, 1, 0) >= 0",
        "If(cell_3_1, 1, 0) <= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_3_1, 1, 0) <= 0",
        "If(cell_3_1, 1, 0) >= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(0 == If(cell_3_1, 1, 0))",
        "If(cell_3_1, 1, 0) <= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(0 == If(cell_3_1, 1, 0))",
        "If(cell_3_1, 1, 0) >= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "0 == If(cell_3_1, 1, 0)",
        "Not(If(cell_3_1, 1, 0) <= 0)",
        "Not(If(cell_3_1, 1, 0) >= 0)"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_4_0, 1, 0) >= 0",
        "If(cell_4_0, 1, 0) <= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_4_0, 1, 0) <= 0",
        "If(cell_4_0, 1, 0) >= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(0 == If(cell_4_0, 1, 0))",
        "If(cell_4_0, 1, 0) <= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(0 == If(cell_4_0, 1, 0))",
        "If(cell_4_0, 1, 0) >= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "0 == If(cell_4_0, 1, 0)",
        "Not(If(cell_4_0, 1, 0) <= 0)",
        "Not(If(cell_4_0, 1, 0) >= 0)"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_2_1, 1, 0) >= 0",
        "If(cell_2_1, 1, 0) <= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_2_1, 1, 0) <= 0",
        "If(cell_2_1, 1, 0) >= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(0 == If(cell_2_1, 1, 0))",
        "If(cell_2_1, 1, 0) <= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(0 == If(cell_2_1, 1, 0))",
        "If(cell_2_1, 1, 0) >= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "0 == If(cell_2_1, 1, 0)",
        "Not(If(cell_2_1, 1, 0) <= 0)",
        "Not(If(cell_2_1, 1, 0) >= 0)"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(If(cell_3_1, 1, 0) <= 0)",
        "Not(If(cell_4_0, 1, 0) <= 0)",
        "Not(If(cell_0_0, 1, 0) +\n    If(cell_0_1, 1, 0) +\n    If(cell_1_0, 1, 0) +\n    If(cell_2_0, 1, 0) +\n    If(cell_3_0, 1, 0) <=\n    1)",
        "Not(If(cell_2_1, 1, 0) <= 0)",
        "Not(If(cell_0_0, 1, 0) +\n    If(cell_0_1, 1, 0) +\n    If(cell_0_2, 1, 0) >=\n    0)",
        "Not(If(cell_4_1, 1, 0) <= 0)",
        "Not(If(cell_2_0, 1, 0) +\n    If(cell_2_1, 1, 0) +\n    If(cell_2_2, 1, 0) +\n    If(cell_2_3, 1, 0) +\n    If(cell_2_4, 1, 0) >=\n    1)",
        "Not(If(cell_1_0, 1, 0) +\n    If(cell_1_1, 1, 0) +\n    If(cell_1_2, 1, 0) >=\n    1)",
        "Not(If(cell_2_3, 1, 0) +\n    If(cell_2_4, 1, 0) +\n    If(cell_3_2, 1, 0) +\n    If(cell_3_3, 1, 0) +\n    If(cell_3_4, 1, 0) +\n    If(cell_4_2, 1, 0) +\n    If(cell_4_3, 1, 0) +\n    If(cell_4_4, 1, 0) <=\n    1)",
        "Not(If(cell_3_0, 1, 0) +\n    If(cell_3_1, 1, 0) +\n    If(cell_3_2, 1, 0) +\n    If(cell_3_3, 1, 0) +\n    If(cell_3_4, 1, 0) >=\n    1)",
        "Not(If(cell_0_2, 1, 0) +\n    If(cell_1_1, 1, 0) +\n    If(cell_1_2, 1, 0) +\n    If(cell_2_2, 1, 0) <=\n    1)",
        "Not(If(cell_4_0, 1, 0) +\n    If(cell_4_1, 1, 0) +\n    If(cell_4_2, 1, 0) +\n    If(cell_4_3, 1, 0) +\n    If(cell_4_4, 1, 0) >=\n    1)",
        "False"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(0 == If(cell_2_1, 1, 0))",
        "If(cell_2_1, 1, 0) <= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(0 == If(cell_4_0, 1, 0))",
        "If(cell_4_0, 1, 0) <= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(0 == If(cell_3_1, 1, 0))",
        "If(cell_3_1, 1, 0) <= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(0 == If(cell_4_1, 1, 0))",
        "If(cell_4_1, 1, 0) <= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_3_4, 1, 0) >= 0",
        "If(cell_3_4, 1, 0) <= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_3_4, 1, 0) <= 0",
        "If(cell_3_4, 1, 0) >= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_3_3, 1, 0) >= 0",
        "If(cell_3_3, 1, 0) <= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_3_3, 1, 0) <= 0",
        "If(cell_3_3, 1, 0) >= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(If(cell_4_3, 1, 0) <= 0)",
        "Not(If(cell_4_3, 1, 0) >= 1)"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(If(cell_4_3, 1, 0) >= 1)",
        "Not(If(cell_4_3, 1, 0) <= 0)"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_4_3, 1, 0) <= 0",
        "If(cell_4_3, 1, 0) >= 1"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_4_3, 1, 0) >= 1",
        "If(cell_4_3, 1, 0) <= 0"
      ]
    },
    {
      "proof": "rup",
      "dependencies": [],
      "clause": [
        "Not(cell_3_0)"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_3_0, 1, 0) >= 0",
        "If(cell_3_0, 1, 0) <= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_3_0, 1, 0) <= 0",
        "If(cell_3_0, 1, 0) >= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(0 == If(cell_3_0, 1, 0))",
        "If(cell_3_0, 1, 0) <= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(0 == If(cell_3_0, 1, 0))",
        "If(cell_3_0, 1, 0) >= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "0 == If(cell_3_0, 1, 0)",
        "Not(If(cell_3_0, 1, 0) <= 0)",
        "Not(If(cell_3_0, 1, 0) >= 0)"
      ]
    },
    {
      "proof": "del",
      "dependencies": [],
      "clause": [
        "Not(If(cell_3_3, 1, 0) >= 0)",
        "Not(cell_3_0)",
        "Not(If(cell_4_4, 1, 0) >= 0)",
        "Not(If(cell_4_3, 1, 0) >= 1)",
        "Not(If(cell_3_4, 1, 0) >= 0)"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_3_1, 1, 0) >= 1",
        "If(cell_3_1, 1, 0) <= 1"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_3_1, 1, 0) <= 1",
        "If(cell_3_1, 1, 0) >= 1"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(1 == If(cell_3_1, 1, 0))",
        "If(cell_3_1, 1, 0) <= 1"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(1 == If(cell_3_1, 1, 0))",
        "If(cell_3_1, 1, 0) >= 1"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "1 == If(cell_3_1, 1, 0)",
        "Not(If(cell_3_1, 1, 0) <= 1)",
        "Not(If(cell_3_1, 1, 0) >= 1)"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_4_2, 1, 0) <= 0",
        "If(cell_4_2, 1, 0) >= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_4_2, 1, 0) >= 0",
        "If(cell_4_2, 1, 0) <= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(0 == If(cell_4_2, 1, 0))",
        "If(cell_4_2, 1, 0) <= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(0 == If(cell_4_2, 1, 0))",
        "If(cell_4_2, 1, 0) >= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "0 == If(cell_4_2, 1, 0)",
        "Not(If(cell_4_2, 1, 0) <= 0)",
        "Not(If(cell_4_2, 1, 0) >= 0)"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_4_0, 1, 0) >= 0",
        "If(cell_4_0, 1, 0) <= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_4_0, 1, 0) <= 0",
        "If(cell_4_0, 1, 0) >= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(0 == If(cell_4_0, 1, 0))",
        "If(cell_4_0, 1, 0) <= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(0 == If(cell_4_0, 1, 0))",
        "If(cell_4_0, 1, 0) >= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "0 == If(cell_4_0, 1, 0)",
        "Not(If(cell_4_0, 1, 0) <= 0)",
        "Not(If(cell_4_0, 1, 0) >= 0)"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_3_2, 1, 0) >= 0",
        "If(cell_3_2, 1, 0) <= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_3_2, 1, 0) <= 0",
        "If(cell_3_2, 1, 0) >= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(0 == If(cell_3_2, 1, 0))",
        "If(cell_3_2, 1, 0) <= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(0 == If(cell_3_2, 1, 0))",
        "If(cell_3_2, 1, 0) >= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "0 == If(cell_3_2, 1, 0)",
        "Not(If(cell_3_2, 1, 0) <= 0)",
        "Not(If(cell_3_2, 1, 0) >= 0)"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_4_1, 1, 0) >= 0",
        "If(cell_4_1, 1, 0) <= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_4_1, 1, 0) <= 0",
        "If(cell_4_1, 1, 0) >= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(0 == If(cell_4_1, 1, 0))",
        "If(cell_4_1, 1, 0) <= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(0 == If(cell_4_1, 1, 0))",
        "If(cell_4_1, 1, 0) >= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "0 == If(cell_4_1, 1, 0)",
        "Not(If(cell_4_1, 1, 0) <= 0)",
        "Not(If(cell_4_1, 1, 0) >= 0)"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_2_2, 1, 0) >= 0",
        "If(cell_2_2, 1, 0) <= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_2_2, 1, 0) <= 0",
        "If(cell_2_2, 1, 0) >= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(0 == If(cell_2_2, 1, 0))",
        "If(cell_2_2, 1, 0) <= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(0 == If(cell_2_2, 1, 0))",
        "If(cell_2_2, 1, 0) >= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "0 == If(cell_2_2, 1, 0)",
        "Not(If(cell_2_2, 1, 0) <= 0)",
        "Not(If(cell_2_2, 1, 0) >= 0)"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_2_1, 1, 0) >= 0",
        "If(cell_2_1, 1, 0) <= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_2_1, 1, 0) <= 0",
        "If(cell_2_1, 1, 0) >= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(0 == If(cell_2_1, 1, 0))",
        "If(cell_2_1, 1, 0) <= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(0 == If(cell_2_1, 1, 0))",
        "If(cell_2_1, 1, 0) >= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "0 == If(cell_2_1, 1, 0)",
        "Not(If(cell_2_1, 1, 0) <= 0)",
        "Not(If(cell_2_1, 1, 0) >= 0)"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_2_0, 1, 0) >= 0",
        "If(cell_2_0, 1, 0) <= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_2_0, 1, 0) <= 0",
        "If(cell_2_0, 1, 0) >= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(0 == If(cell_2_0, 1, 0))",
        "If(cell_2_0, 1, 0) <= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(0 == If(cell_2_0, 1, 0))",
        "If(cell_2_0, 1, 0) >= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "0 == If(cell_2_0, 1, 0)",
        "Not(If(cell_2_0, 1, 0) <= 0)",
        "Not(If(cell_2_0, 1, 0) >= 0)"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_4_3, 1, 0) >= 0",
        "Not(If(cell_4_3, 1, 0) >= 1)"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(If(cell_4_3, 1, 0) >= 1)",
        "If(cell_4_3, 1, 0) >= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_4_3, 1, 0) >= 0",
        "If(cell_4_3, 1, 0) <= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_4_3, 1, 0) <= 0",
        "If(cell_4_3, 1, 0) >= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(0 == If(cell_4_3, 1, 0))",
        "If(cell_4_3, 1, 0) <= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(0 == If(cell_4_3, 1, 0))",
        "If(cell_4_3, 1, 0) >= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "0 == If(cell_4_3, 1, 0)",
        "Not(If(cell_4_3, 1, 0) <= 0)",
        "Not(If(cell_4_3, 1, 0) >= 0)"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(If(cell_0_0, 1, 0) +\n    If(cell_0_1, 1, 0) +\n    If(cell_0_2, 1, 0) <=\n    0)",
        "Not(If(cell_0_0, 1, 0) +\n    If(cell_0_1, 1, 0) +\n    If(cell_1_0, 1, 0) +\n    If(cell_2_0, 1, 0) +\n    If(cell_3_0, 1, 0) >=\n    1)",
        "Not(If(cell_2_0, 1, 0) <= 0)",
        "Not(If(cell_3_0, 1, 0) <= 0)",
        "Not(If(cell_2_2, 1, 0) <= 0)",
        "Not(If(cell_0_2, 1, 0) +\n    If(cell_1_1, 1, 0) +\n    If(cell_1_2, 1, 0) +\n    If(cell_2_2, 1, 0) >=\n    1)",
        "Not(If(cell_1_0, 1, 0) +\n    If(cell_1_1, 1, 0) +\n    If(cell_1_2, 1, 0) <=\n    1)",
        "False"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(0 == If(cell_2_0, 1, 0))",
        "If(cell_2_0, 1, 0) <= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(0 == If(cell_2_2, 1, 0))",
        "If(cell_2_2, 1, 0) <= 0"
      ]
    },
    {
      "proof": "rup",
      "dependencies": [],
      "clause": [
        "Not(cell_3_1)"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_3_1, 1, 0) >= 0",
        "If(cell_3_1, 1, 0) <= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_3_1, 1, 0) <= 0",
        "If(cell_3_1, 1, 0) >= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(0 == If(cell_3_1, 1, 0))",
        "If(cell_3_1, 1, 0) <= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(0 == If(cell_3_1, 1, 0))",
        "If(cell_3_1, 1, 0) >= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "0 == If(cell_3_1, 1, 0)",
        "Not(If(cell_3_1, 1, 0) <= 0)",
        "Not(If(cell_3_1, 1, 0) >= 0)"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_2_2, 1, 0) >= 0",
        "If(cell_2_2, 1, 0) <= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_2_2, 1, 0) <= 0",
        "If(cell_2_2, 1, 0) >= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(0 == If(cell_2_2, 1, 0))",
        "If(cell_2_2, 1, 0) <= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(0 == If(cell_2_2, 1, 0))",
        "If(cell_2_2, 1, 0) >= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "0 == If(cell_2_2, 1, 0)",
        "Not(If(cell_2_2, 1, 0) <= 0)",
        "Not(If(cell_2_2, 1, 0) >= 0)"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_2_1, 1, 0) >= 0",
        "If(cell_2_1, 1, 0) <= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_2_1, 1, 0) <= 0",
        "If(cell_2_1, 1, 0) >= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(0 == If(cell_2_1, 1, 0))",
        "If(cell_2_1, 1, 0) <= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(0 == If(cell_2_1, 1, 0))",
        "If(cell_2_1, 1, 0) >= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "0 == If(cell_2_1, 1, 0)",
        "Not(If(cell_2_1, 1, 0) <= 0)",
        "Not(If(cell_2_1, 1, 0) >= 0)"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_1_1, 1, 0) >= 0",
        "If(cell_1_1, 1, 0) <= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_1_1, 1, 0) <= 0",
        "If(cell_1_1, 1, 0) >= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(0 == If(cell_1_1, 1, 0))",
        "If(cell_1_1, 1, 0) <= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(0 == If(cell_1_1, 1, 0))",
        "If(cell_1_1, 1, 0) >= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "0 == If(cell_1_1, 1, 0)",
        "Not(If(cell_1_1, 1, 0) <= 0)",
        "Not(If(cell_1_1, 1, 0) >= 0)"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_1_0, 1, 0) >= 0",
        "If(cell_1_0, 1, 0) <= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_1_0, 1, 0) <= 0",
        "If(cell_1_0, 1, 0) >= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(0 == If(cell_1_0, 1, 0))",
        "If(cell_1_0, 1, 0) <= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(0 == If(cell_1_0, 1, 0))",
        "If(cell_1_0, 1, 0) >= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "0 == If(cell_1_0, 1, 0)",
        "Not(If(cell_1_0, 1, 0) <= 0)",
        "Not(If(cell_1_0, 1, 0) >= 0)"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_3_3, 1, 0) <= 1",
        "If(cell_3_3, 1, 0) >= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_3_3, 1, 0) >= 0",
        "If(cell_3_3, 1, 0) <= 1"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_3_3, 1, 0) <= 1",
        "Not(If(cell_3_3, 1, 0) <= 0)"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(If(cell_3_3, 1, 0) <= 0)",
        "If(cell_3_3, 1, 0) <= 1"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(If(cell_3_3, 1, 0) >= 1)",
        "If(cell_3_3, 1, 0) >= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_3_3, 1, 0) >= 0",
        "Not(If(cell_3_3, 1, 0) >= 1)"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(If(cell_3_3, 1, 0) >= 1)",
        "Not(If(cell_3_3, 1, 0) <= 0)"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(If(cell_3_3, 1, 0) <= 0)",
        "Not(If(cell_3_3, 1, 0) >= 1)"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_3_3, 1, 0) >= 1",
        "If(cell_3_3, 1, 0) <= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_3_3, 1, 0) <= 0",
        "If(cell_3_3, 1, 0) >= 1"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_3_3, 1, 0) >= 1",
        "If(cell_3_3, 1, 0) <= 1"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_3_3, 1, 0) <= 1",
        "If(cell_3_3, 1, 0) >= 1"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(1 == If(cell_3_3, 1, 0))",
        "If(cell_3_3, 1, 0) <= 1"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(1 == If(cell_3_3, 1, 0))",
        "If(cell_3_3, 1, 0) >= 1"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "1 == If(cell_3_3, 1, 0)",
        "Not(If(cell_3_3, 1, 0) <= 1)",
        "Not(If(cell_3_3, 1, 0) >= 1)"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_4_4, 1, 0) <= 0",
        "If(cell_4_4, 1, 0) >= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_4_4, 1, 0) >= 0",
        "If(cell_4_4, 1, 0) <= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(0 == If(cell_4_4, 1, 0))",
        "If(cell_4_4, 1, 0) <= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(0 == If(cell_4_4, 1, 0))",
        "If(cell_4_4, 1, 0) >= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "0 == If(cell_4_4, 1, 0)",
        "Not(If(cell_4_4, 1, 0) <= 0)",
        "Not(If(cell_4_4, 1, 0) >= 0)"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_4_2, 1, 0) <= 0",
        "If(cell_4_2, 1, 0) >= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_4_2, 1, 0) >= 0",
        "If(cell_4_2, 1, 0) <= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(0 == If(cell_4_2, 1, 0))",
        "If(cell_4_2, 1, 0) <= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(0 == If(cell_4_2, 1, 0))",
        "If(cell_4_2, 1, 0) >= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "0 == If(cell_4_2, 1, 0)",
        "Not(If(cell_4_2, 1, 0) <= 0)",
        "Not(If(cell_4_2, 1, 0) >= 0)"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(0 == If(cell_3_4, 1, 0))",
        "If(cell_3_4, 1, 0) <= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(0 == If(cell_3_4, 1, 0))",
        "If(cell_3_4, 1, 0) >= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "0 == If(cell_3_4, 1, 0)",
        "Not(If(cell_3_4, 1, 0) <= 0)",
        "Not(If(cell_3_4, 1, 0) >= 0)"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_4_3, 1, 0) >= 0",
        "Not(If(cell_4_3, 1, 0) >= 1)"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(If(cell_4_3, 1, 0) >= 1)",
        "If(cell_4_3, 1, 0) >= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_4_3, 1, 0) >= 0",
        "If(cell_4_3, 1, 0) <= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_4_3, 1, 0) <= 0",
        "If(cell_4_3, 1, 0) >= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(0 == If(cell_4_3, 1, 0))",
        "If(cell_4_3, 1, 0) <= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(0 == If(cell_4_3, 1, 0))",
        "If(cell_4_3, 1, 0) >= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "0 == If(cell_4_3, 1, 0)",
        "Not(If(cell_4_3, 1, 0) <= 0)",
        "Not(If(cell_4_3, 1, 0) >= 0)"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_3_2, 1, 0) >= 0",
        "If(cell_3_2, 1, 0) <= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_3_2, 1, 0) <= 0",
        "If(cell_3_2, 1, 0) >= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(0 == If(cell_3_2, 1, 0))",
        "If(cell_3_2, 1, 0) <= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(0 == If(cell_3_2, 1, 0))",
        "If(cell_3_2, 1, 0) >= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "0 == If(cell_3_2, 1, 0)",
        "Not(If(cell_3_2, 1, 0) <= 0)",
        "Not(If(cell_3_2, 1, 0) >= 0)"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_2_4, 1, 0) >= 0",
        "If(cell_2_4, 1, 0) <= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_2_4, 1, 0) <= 0",
        "If(cell_2_4, 1, 0) >= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(0 == If(cell_2_4, 1, 0))",
        "If(cell_2_4, 1, 0) <= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(0 == If(cell_2_4, 1, 0))",
        "If(cell_2_4, 1, 0) >= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "0 == If(cell_2_4, 1, 0)",
        "Not(If(cell_2_4, 1, 0) <= 0)",
        "Not(If(cell_2_4, 1, 0) >= 0)"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_2_3, 1, 0) >= 0",
        "If(cell_2_3, 1, 0) <= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_2_3, 1, 0) <= 0",
        "If(cell_2_3, 1, 0) >= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(0 == If(cell_2_3, 1, 0))",
        "If(cell_2_3, 1, 0) <= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(0 == If(cell_2_3, 1, 0))",
        "If(cell_2_3, 1, 0) >= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "0 == If(cell_2_3, 1, 0)",
        "Not(If(cell_2_3, 1, 0) <= 0)",
        "Not(If(cell_2_3, 1, 0) >= 0)"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_0_1, 1, 0) >= 0",
        "If(cell_0_1, 1, 0) <= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_0_1, 1, 0) <= 0",
        "If(cell_0_1, 1, 0) >= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(0 == If(cell_0_1, 1, 0))",
        "If(cell_0_1, 1, 0) <= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(0 == If(cell_0_1, 1, 0))",
        "If(cell_0_1, 1, 0) >= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "0 == If(cell_0_1, 1, 0)",
        "Not(If(cell_0_1, 1, 0) <= 0)",
        "Not(If(cell_0_1, 1, 0) >= 0)"
      ]
    },
    {
      "proof": "assumption",
      "dependencies": [],
      "clause": [
        "cell_0_0",
        "cell_0_1",
        "cell_0_2",
        "cell_1_0",
        "cell_1_1",
        "cell_2_1",
        "cell_2_2",
        "cell_2_3",
        "cell_2_4",
        "cell_3_0",
        "cell_3_1",
        "cell_3_2",
        "cell_3_4",
        "cell_4_0",
        "cell_4_2",
        "cell_4_3",
        "cell_4_4",
        "Not(cell_1_2)",
        "Not(cell_2_0)",
        "Not(cell_3_3)",
        "Not(cell_4_1)"
      ]
    },
    {
      "proof": "assumption",
      "dependencies": [],
      "clause": [
        "cell_0_2",
        "cell_0_0",
        "cell_0_1",
        "Not(cell_1_2)",
        "cell_1_0",
        "cell_1_1",
        "cell_2_4",
        "Not(cell_2_0)",
        "cell_2_1",
        "cell_2_2",
        "cell_2_3",
        "cell_3_4",
        "cell_3_2",
        "Not(cell_3_3)",
        "cell_4_4",
        "cell_4_0",
        "Not(cell_4_1)",
        "cell_4_2",
        "cell_4_3",
        "cell_3_0",
        "cell_3_1"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_2_2, 1, 0) >= 0",
        "If(cell_2_2, 1, 0) <= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_2_2, 1, 0) <= 0",
        "If(cell_2_2, 1, 0) >= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(0 == If(cell_2_2, 1, 0))",
        "If(cell_2_2, 1, 0) <= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(0 == If(cell_2_2, 1, 0))",
        "If(cell_2_2, 1, 0) >= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "0 == If(cell_2_2, 1, 0)",
        "Not(If(cell_2_2, 1, 0) <= 0)",
        "Not(If(cell_2_2, 1, 0) >= 0)"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_2_1, 1, 0) >= 0",
        "If(cell_2_1, 1, 0) <= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_2_1, 1, 0) <= 0",
        "If(cell_2_1, 1, 0) >= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(0 == If(cell_2_1, 1, 0))",
        "If(cell_2_1, 1, 0) <= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(0 == If(cell_2_1, 1, 0))",
        "If(cell_2_1, 1, 0) >= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "0 == If(cell_2_1, 1, 0)",
        "Not(If(cell_2_1, 1, 0) <= 0)",
        "Not(If(cell_2_1, 1, 0) >= 0)"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_1_1, 1, 0) >= 0",
        "If(cell_1_1, 1, 0) <= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_1_1, 1, 0) <= 0",
        "If(cell_1_1, 1, 0) >= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(0 == If(cell_1_1, 1, 0))",
        "If(cell_1_1, 1, 0) <= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(0 == If(cell_1_1, 1, 0))",
        "If(cell_1_1, 1, 0) >= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "0 == If(cell_1_1, 1, 0)",
        "Not(If(cell_1_1, 1, 0) <= 0)",
        "Not(If(cell_1_1, 1, 0) >= 0)"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_1_0, 1, 0) >= 0",
        "If(cell_1_0, 1, 0) <= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_1_0, 1, 0) <= 0",
        "If(cell_1_0, 1, 0) >= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(0 == If(cell_1_0, 1, 0))",
        "If(cell_1_0, 1, 0) <= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(0 == If(cell_1_0, 1, 0))",
        "If(cell_1_0, 1, 0) >= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "0 == If(cell_1_0, 1, 0)",
        "Not(If(cell_1_0, 1, 0) <= 0)",
        "Not(If(cell_1_0, 1, 0) >= 0)"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_3_3, 1, 0) <= 1",
        "If(cell_3_3, 1, 0) >= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_3_3, 1, 0) >= 0",
        "If(cell_3_3, 1, 0) <= 1"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_3_3, 1, 0) <= 1",
        "Not(If(cell_3_3, 1, 0) <= 0)"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(If(cell_3_3, 1, 0) <= 0)",
        "If(cell_3_3, 1, 0) <= 1"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(If(cell_3_3, 1, 0) >= 1)",
        "If(cell_3_3, 1, 0) >= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_3_3, 1, 0) >= 0",
        "Not(If(cell_3_3, 1, 0) >= 1)"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(If(cell_3_3, 1, 0) >= 1)",
        "Not(If(cell_3_3, 1, 0) <= 0)"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(If(cell_3_3, 1, 0) <= 0)",
        "Not(If(cell_3_3, 1, 0) >= 1)"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_3_3, 1, 0) >= 1",
        "If(cell_3_3, 1, 0) <= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_3_3, 1, 0) <= 0",
        "If(cell_3_3, 1, 0) >= 1"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_3_3, 1, 0) >= 1",
        "If(cell_3_3, 1, 0) <= 1"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_3_3, 1, 0) <= 1",
        "If(cell_3_3, 1, 0) >= 1"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(1 == If(cell_3_3, 1, 0))",
        "If(cell_3_3, 1, 0) <= 1"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(1 == If(cell_3_3, 1, 0))",
        "If(cell_3_3, 1, 0) >= 1"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "1 == If(cell_3_3, 1, 0)",
        "Not(If(cell_3_3, 1, 0) <= 1)",
        "Not(If(cell_3_3, 1, 0) >= 1)"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_4_4, 1, 0) <= 0",
        "If(cell_4_4, 1, 0) >= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_4_4, 1, 0) >= 0",
        "If(cell_4_4, 1, 0) <= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(0 == If(cell_4_4, 1, 0))",
        "If(cell_4_4, 1, 0) <= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(0 == If(cell_4_4, 1, 0))",
        "If(cell_4_4, 1, 0) >= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "0 == If(cell_4_4, 1, 0)",
        "Not(If(cell_4_4, 1, 0) <= 0)",
        "Not(If(cell_4_4, 1, 0) >= 0)"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_4_2, 1, 0) <= 0",
        "If(cell_4_2, 1, 0) >= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_4_2, 1, 0) >= 0",
        "If(cell_4_2, 1, 0) <= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(0 == If(cell_4_2, 1, 0))",
        "If(cell_4_2, 1, 0) <= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(0 == If(cell_4_2, 1, 0))",
        "If(cell_4_2, 1, 0) >= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "0 == If(cell_4_2, 1, 0)",
        "Not(If(cell_4_2, 1, 0) <= 0)",
        "Not(If(cell_4_2, 1, 0) >= 0)"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(0 == If(cell_3_4, 1, 0))",
        "If(cell_3_4, 1, 0) <= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(0 == If(cell_3_4, 1, 0))",
        "If(cell_3_4, 1, 0) >= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "0 == If(cell_3_4, 1, 0)",
        "Not(If(cell_3_4, 1, 0) <= 0)",
        "Not(If(cell_3_4, 1, 0) >= 0)"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_4_3, 1, 0) >= 0",
        "Not(If(cell_4_3, 1, 0) >= 1)"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(If(cell_4_3, 1, 0) >= 1)",
        "If(cell_4_3, 1, 0) >= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_4_3, 1, 0) >= 0",
        "If(cell_4_3, 1, 0) <= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_4_3, 1, 0) <= 0",
        "If(cell_4_3, 1, 0) >= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(0 == If(cell_4_3, 1, 0))",
        "If(cell_4_3, 1, 0) <= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(0 == If(cell_4_3, 1, 0))",
        "If(cell_4_3, 1, 0) >= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "0 == If(cell_4_3, 1, 0)",
        "Not(If(cell_4_3, 1, 0) <= 0)",
        "Not(If(cell_4_3, 1, 0) >= 0)"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_3_2, 1, 0) >= 0",
        "If(cell_3_2, 1, 0) <= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_3_2, 1, 0) <= 0",
        "If(cell_3_2, 1, 0) >= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(0 == If(cell_3_2, 1, 0))",
        "If(cell_3_2, 1, 0) <= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(0 == If(cell_3_2, 1, 0))",
        "If(cell_3_2, 1, 0) >= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "0 == If(cell_3_2, 1, 0)",
        "Not(If(cell_3_2, 1, 0) <= 0)",
        "Not(If(cell_3_2, 1, 0) >= 0)"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_2_4, 1, 0) >= 0",
        "If(cell_2_4, 1, 0) <= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_2_4, 1, 0) <= 0",
        "If(cell_2_4, 1, 0) >= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(0 == If(cell_2_4, 1, 0))",
        "If(cell_2_4, 1, 0) <= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(0 == If(cell_2_4, 1, 0))",
        "If(cell_2_4, 1, 0) >= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "0 == If(cell_2_4, 1, 0)",
        "Not(If(cell_2_4, 1, 0) <= 0)",
        "Not(If(cell_2_4, 1, 0) >= 0)"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_2_3, 1, 0) >= 0",
        "If(cell_2_3, 1, 0) <= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_2_3, 1, 0) <= 0",
        "If(cell_2_3, 1, 0) >= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(0 == If(cell_2_3, 1, 0))",
        "If(cell_2_3, 1, 0) <= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(0 == If(cell_2_3, 1, 0))",
        "If(cell_2_3, 1, 0) >= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "0 == If(cell_2_3, 1, 0)",
        "Not(If(cell_2_3, 1, 0) <= 0)",
        "Not(If(cell_2_3, 1, 0) >= 0)"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_0_1, 1, 0) >= 0",
        "If(cell_0_1, 1, 0) <= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_0_1, 1, 0) <= 0",
        "If(cell_0_1, 1, 0) >= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(0 == If(cell_0_1, 1, 0))",
        "If(cell_0_1, 1, 0) <= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(0 == If(cell_0_1, 1, 0))",
        "If(cell_0_1, 1, 0) >= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "0 == If(cell_0_1, 1, 0)",
        "Not(If(cell_0_1, 1, 0) <= 0)",
        "Not(If(cell_0_1, 1, 0) >= 0)"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "cell_3_0",
        "cell_3_1",
        "False"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "1 == If(cell_3_0, 1, 0)",
        "Not(0 == If(cell_3_0, 1, 0))",
        "Not(If(cell_0_1, 1, 0) >= 0)",
        "Not(If(cell_1_0, 1, 0) <= 0)",
        "Not(If(cell_1_0, 1, 0) >= 0)",
        "Not(If(cell_0_0, 1, 0) +\n    If(cell_0_1, 1, 0) +\n    If(cell_0_2, 1, 0) <=\n    0)",
        "Not(If(cell_0_0, 1, 0) +\n    If(cell_0_1, 1, 0) +\n    If(cell_0_2, 1, 0) >=\n    0)",
        "Not(If(cell_1_0, 1, 0) +\n    If(cell_1_1, 1, 0) +\n    If(cell_1_2, 1, 0) <=\n    1)",
        "Not(If(cell_1_0, 1, 0) +\n    If(cell_1_1, 1, 0) +\n    If(cell_1_2, 1, 0) >=\n    1)",
        "Not(If(cell_0_2, 1, 0) +\n    If(cell_1_1, 1, 0) +\n    If(cell_1_2, 1, 0) +\n    If(cell_2_2, 1, 0) <=\n    1)",
        "Not(If(cell_0_2, 1, 0) +\n    If(cell_1_1, 1, 0) +\n    If(cell_1_2, 1, 0) +\n    If(cell_2_2, 1, 0) >=\n    1)",
        "Not(If(cell_2_2, 1, 0) <= 0)",
        "Not(If(cell_2_2, 1, 0) >= 0)",
        "Not(If(cell_0_1, 1, 0) <= 0)",
        "Not(1 == If(cell_0_0, 1, 0))"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "1 == If(cell_3_0, 1, 0)",
        "Not(0 == If(cell_3_0, 1, 0))",
        "Not(If(cell_0_1, 1, 0) >= 0)",
        "Not(If(cell_0_0, 1, 0) +\n    If(cell_0_1, 1, 0) +\n    If(cell_1_0, 1, 0) +\n    If(cell_2_0, 1, 0) +\n    If(cell_3_0, 1, 0) <=\n    1)",
        "Not(If(cell_0_0, 1, 0) +\n    If(cell_0_1, 1, 0) +\n    If(cell_1_0, 1, 0) +\n    If(cell_2_0, 1, 0) +\n    If(cell_3_0, 1, 0) >=\n    1)",
        "Not(If(cell_0_0, 1, 0) +\n    If(cell_1_0, 1, 0) +\n    If(cell_2_0, 1, 0) +\n    If(cell_3_0, 1, 0) +\n    If(cell_4_0, 1, 0) <=\n    1)",
        "Not(If(cell_0_1, 1, 0) <= 0)",
        "Not(If(cell_0_0, 1, 0) +\n    If(cell_1_0, 1, 0) +\n    If(cell_2_0, 1, 0) +\n    If(cell_3_0, 1, 0) +\n    If(cell_4_0, 1, 0) >=\n    1)",
        "Not(1 == If(cell_4_0, 1, 0))"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "1 == If(cell_3_0, 1, 0)",
        "Not(0 == If(cell_3_0, 1, 0))",
        "Not(If(cell_0_1, 1, 0) >= 0)",
        "Not(If(cell_0_1, 1, 0) <= 0)",
        "Not(If(cell_3_1, 1, 0) >= 0)",
        "Not(If(cell_3_1, 1, 0) <= 0)",
        "Not(If(cell_0_0, 1, 0) +\n    If(cell_0_1, 1, 0) +\n    If(cell_0_2, 1, 0) <=\n    0)",
        "Not(If(cell_0_0, 1, 0) +\n    If(cell_0_1, 1, 0) +\n    If(cell_0_2, 1, 0) >=\n    0)",
        "Not(If(cell_1_0, 1, 0) +\n    If(cell_1_1, 1, 0) +\n    If(cell_1_2, 1, 0) <=\n    1)",
        "Not(If(cell_1_0, 1, 0) +\n    If(cell_1_1, 1, 0) +\n    If(cell_1_2, 1, 0) >=\n    1)",
        "Not(If(cell_2_0, 1, 0) +\n    If(cell_2_1, 1, 0) +\n    If(cell_2_2, 1, 0) +\n    If(cell_2_3, 1, 0) +\n    If(cell_2_4, 1, 0) <=\n    1)",
        "Not(If(cell_2_0, 1, 0) +\n    If(cell_2_1, 1, 0) +\n    If(cell_2_2, 1, 0) +\n    If(cell_2_3, 1, 0) +\n    If(cell_2_4, 1, 0) >=\n    1)",
        "Not(If(cell_3_0, 1, 0) +\n    If(cell_3_1, 1, 0) +\n    If(cell_3_2, 1, 0) +\n    If(cell_3_3, 1, 0) +\n    If(cell_3_4, 1, 0) <=\n    1)",
        "Not(If(cell_0_2, 1, 0) +\n    If(cell_1_1, 1, 0) +\n    If(cell_1_2, 1, 0) +\n    If(cell_2_2, 1, 0) <=\n    1)",
        "Not(If(cell_3_0, 1, 0) +\n    If(cell_3_1, 1, 0) +\n    If(cell_3_2, 1, 0) +\n    If(cell_3_3, 1, 0) +\n    If(cell_3_4, 1, 0) >=\n    1)",
        "Not(If(cell_0_2, 1, 0) +\n    If(cell_1_1, 1, 0) +\n    If(cell_1_2, 1, 0) +\n    If(cell_2_2, 1, 0) >=\n    1)",
        "Not(If(cell_2_3, 1, 0) +\n    If(cell_2_4, 1, 0) +\n    If(cell_3_2, 1, 0) +\n    If(cell_3_3, 1, 0) +\n    If(cell_3_4, 1, 0) +\n    If(cell_4_2, 1, 0) +\n    If(cell_4_3, 1, 0) +\n    If(cell_4_4, 1, 0) <=\n    1)",
        "Not(If(cell_4_0, 1, 0) +\n    If(cell_4_1, 1, 0) +\n    If(cell_4_2, 1, 0) +\n    If(cell_4_3, 1, 0) +\n    If(cell_4_4, 1, 0) <=\n    1)",
        "Not(If(cell_2_3, 1, 0) +\n    If(cell_2_4, 1, 0) +\n    If(cell_3_2, 1, 0) +\n    If(cell_3_3, 1, 0) +\n    If(cell_3_4, 1, 0) +\n    If(cell_4_2, 1, 0) +\n    If(cell_4_3, 1, 0) +\n    If(cell_4_4, 1, 0) >=\n    1)",
        "Not(If(cell_4_0, 1, 0) +\n    If(cell_4_1, 1, 0) +\n    If(cell_4_2, 1, 0) +\n    If(cell_4_3, 1, 0) +\n    If(cell_4_4, 1, 0) >=\n    1)",
        "Not(If(cell_2_1, 1, 0) <= 0)",
        "Not(If(cell_0_0, 1, 0) +\n    If(cell_1_0, 1, 0) +\n    If(cell_2_0, 1, 0) +\n    If(cell_3_0, 1, 0) +\n    If(cell_4_0, 1, 0) <=\n    1)",
        "Not(If(cell_0_0, 1, 0) +\n    If(cell_1_0, 1, 0) +\n    If(cell_2_0, 1, 0) +\n    If(cell_3_0, 1, 0) +\n    If(cell_4_0, 1, 0) >=\n    1)",
        "Not(If(cell_2_1, 1, 0) >= 0)",
        "Not(0 == If(cell_4_1, 1, 0))"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(0 == If(cell_0_1, 1, 0))",
        "If(cell_0_1, 1, 0) >= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(0 == If(cell_0_1, 1, 0))",
        "If(cell_0_1, 1, 0) <= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "0 == If(cell_3_3, 1, 0)",
        "Not(1 == If(cell_3_3, 1, 0))",
        "Not(0 == If(cell_3_0, 1, 0))",
        "Not(If(cell_0_2, 1, 0) +\n    If(cell_1_1, 1, 0) +\n    If(cell_1_2, 1, 0) +\n    If(cell_2_2, 1, 0) <=\n    1)",
        "Not(If(cell_1_0, 1, 0) <= 0)",
        "Not(If(cell_1_0, 1, 0) >= 0)",
        "Not(If(cell_0_2, 1, 0) +\n    If(cell_1_1, 1, 0) +\n    If(cell_1_2, 1, 0) +\n    If(cell_2_2, 1, 0) >=\n    1)",
        "Not(If(cell_2_2, 1, 0) <= 0)",
        "Not(If(cell_2_2, 1, 0) >= 0)",
        "Not(If(cell_1_0, 1, 0) +\n    If(cell_1_1, 1, 0) +\n    If(cell_1_2, 1, 0) <=\n    1)",
        "Not(If(cell_1_0, 1, 0) +\n    If(cell_1_1, 1, 0) +\n    If(cell_1_2, 1, 0) >=\n    1)",
        "Not(1 == If(cell_0_2, 1, 0))"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "0 == If(cell_3_3, 1, 0)",
        "Not(If(cell_0_1, 1, 0) +\n    If(cell_1_1, 1, 0) +\n    If(cell_2_1, 1, 0) +\n    If(cell_3_1, 1, 0) +\n    If(cell_4_1, 1, 0) <=\n    1)",
        "Not(If(cell_0_1, 1, 0) +\n    If(cell_1_1, 1, 0) +\n    If(cell_2_1, 1, 0) +\n    If(cell_3_1, 1, 0) +\n    If(cell_4_1, 1, 0) >=\n    1)",
        "Not(If(cell_1_0, 1, 0) <= 0)",
        "Not(If(cell_1_0, 1, 0) >= 0)",
        "Not(If(cell_0_0, 1, 0) +\n    If(cell_0_1, 1, 0) +\n    If(cell_0_2, 1, 0) <=\n    0)",
        "Not(If(cell_0_0, 1, 0) +\n    If(cell_0_1, 1, 0) +\n    If(cell_0_2, 1, 0) >=\n    0)",
        "Not(If(cell_1_0, 1, 0) +\n    If(cell_1_1, 1, 0) +\n    If(cell_1_2, 1, 0) <=\n    1)",
        "Not(If(cell_1_0, 1, 0) +\n    If(cell_1_1, 1, 0) +\n    If(cell_1_2, 1, 0) >=\n    1)",
        "Not(If(cell_2_0, 1, 0) +\n    If(cell_2_1, 1, 0) +\n    If(cell_2_2, 1, 0) +\n    If(cell_2_3, 1, 0) +\n    If(cell_2_4, 1, 0) <=\n    1)",
        "Not(If(cell_2_0, 1, 0) +\n    If(cell_2_1, 1, 0) +\n    If(cell_2_2, 1, 0) +\n    If(cell_2_3, 1, 0) +\n    If(cell_2_4, 1, 0) >=\n    1)",
        "Not(If(cell_3_0, 1, 0) +\n    If(cell_3_1, 1, 0) +\n    If(cell_3_2, 1, 0) +\n    If(cell_3_3, 1, 0) +\n    If(cell_3_4, 1, 0) <=\n    1)",
        "Not(If(cell_0_2, 1, 0) +\n    If(cell_1_1, 1, 0) +\n    If(cell_1_2, 1, 0) +\n    If(cell_2_2, 1, 0) <=\n    1)",
        "Not(If(cell_3_0, 1, 0) +\n    If(cell_3_1, 1, 0) +\n    If(cell_3_2, 1, 0) +\n    If(cell_3_3, 1, 0) +\n    If(cell_3_4, 1, 0) >=\n    1)",
        "Not(If(cell_0_2, 1, 0) +\n    If(cell_1_1, 1, 0) +\n    If(cell_1_2, 1, 0) +\n    If(cell_2_2, 1, 0) >=\n    1)",
        "Not(If(cell_2_3, 1, 0) +\n    If(cell_2_4, 1, 0) +\n    If(cell_3_2, 1, 0) +\n    If(cell_3_3, 1, 0) +\n    If(cell_3_4, 1, 0) +\n    If(cell_4_2, 1, 0) +\n    If(cell_4_3, 1, 0) +\n    If(cell_4_4, 1, 0) <=\n    1)",
        "Not(If(cell_4_0, 1, 0) +\n    If(cell_4_1, 1, 0) +\n    If(cell_4_2, 1, 0) +\n    If(cell_4_3, 1, 0) +\n    If(cell_4_4, 1, 0) <=\n    1)",
        "Not(If(cell_2_3, 1, 0) +\n    If(cell_2_4, 1, 0) +\n    If(cell_3_2, 1, 0) +\n    If(cell_3_3, 1, 0) +\n    If(cell_3_4, 1, 0) +\n    If(cell_4_2, 1, 0) +\n    If(cell_4_3, 1, 0) +\n    If(cell_4_4, 1, 0) >=\n    1)",
        "Not(If(cell_4_0, 1, 0) +\n    If(cell_4_1, 1, 0) +\n    If(cell_4_2, 1, 0) +\n    If(cell_4_3, 1, 0) +\n    If(cell_4_4, 1, 0) >=\n    1)",
        "Not(If(cell_0_0, 1, 0) +\n    If(cell_1_0, 1, 0) +\n    If(cell_2_0, 1, 0) +\n    If(cell_3_0, 1, 0) +\n    If(cell_4_0, 1, 0) <=\n    1)",
        "Not(If(cell_0_0, 1, 0) +\n    If(cell_1_0, 1, 0) +\n    If(cell_2_0, 1, 0) +\n    If(cell_3_0, 1, 0) +\n    If(cell_4_0, 1, 0) >=\n    1)",
        "Not(0 == If(cell_1_2, 1, 0))"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "0 == If(cell_3_3, 1, 0)",
        "Not(1 == If(cell_3_0, 1, 0))"
      ]
    },
    {
      "proof": "rup",
      "dependencies": [],
      "clause": [
        "0 == If(cell_3_3, 1, 0)",
        "Not(cell_2_0)",
        "cell_2_2"
      ]
    },
    {
      "proof": "rup",
      "dependencies": [],
      "clause": [
        "0 == If(cell_3_3, 1, 0)",
        "Not(cell_2_0)",
        "cell_2_2"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(0 == If(cell_3_3, 1, 0))",
        "If(cell_3_3, 1, 0) <= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(0 == If(cell_3_3, 1, 0))",
        "If(cell_3_3, 1, 0) >= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "0 == If(cell_3_3, 1, 0)",
        "Not(If(cell_3_3, 1, 0) <= 0)",
        "Not(If(cell_3_3, 1, 0) >= 0)"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_4_1, 1, 0) >= 0",
        "If(cell_4_1, 1, 0) <= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_4_1, 1, 0) <= 0",
        "If(cell_4_1, 1, 0) >= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(0 == If(cell_4_1, 1, 0))",
        "If(cell_4_1, 1, 0) <= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(0 == If(cell_4_1, 1, 0))",
        "If(cell_4_1, 1, 0) >= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "0 == If(cell_4_1, 1, 0)",
        "Not(If(cell_4_1, 1, 0) <= 0)",
        "Not(If(cell_4_1, 1, 0) >= 0)"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(0 == If(cell_4_0, 1, 0))",
        "Not(0 == If(cell_3_0, 1, 0))",
        "Not(If(cell_0_0, 1, 0) +\n    If(cell_0_1, 1, 0) +\n    If(cell_0_2, 1, 0) <=\n    0)",
        "Not(If(cell_4_1, 1, 0) <= 0)",
        "Not(If(cell_0_0, 1, 0) +\n    If(cell_0_1, 1, 0) +\n    If(cell_0_2, 1, 0) >=\n    0)",
        "Not(If(cell_4_1, 1, 0) >= 0)",
        "Not(If(cell_1_0, 1, 0) +\n    If(cell_1_1, 1, 0) +\n    If(cell_1_2, 1, 0) <=\n    1)",
        "Not(If(cell_1_0, 1, 0) +\n    If(cell_1_1, 1, 0) +\n    If(cell_1_2, 1, 0) >=\n    1)",
        "Not(If(cell_0_0, 1, 0) +\n    If(cell_0_1, 1, 0) +\n    If(cell_1_0, 1, 0) +\n    If(cell_2_0, 1, 0) +\n    If(cell_3_0, 1, 0) <=\n    1)",
        "Not(If(cell_2_0, 1, 0) +\n    If(cell_2_1, 1, 0) +\n    If(cell_2_2, 1, 0) +\n    If(cell_2_3, 1, 0) +\n    If(cell_2_4, 1, 0) <=\n    1)",
        "Not(If(cell_0_0, 1, 0) +\n    If(cell_0_1, 1, 0) +\n    If(cell_1_0, 1, 0) +\n    If(cell_2_0, 1, 0) +\n    If(cell_3_0, 1, 0) >=\n    1)",
        "Not(If(cell_2_0, 1, 0) +\n    If(cell_2_1, 1, 0) +\n    If(cell_2_2, 1, 0) +\n    If(cell_2_3, 1, 0) +\n    If(cell_2_4, 1, 0) >=\n    1)",
        "Not(If(cell_3_1, 1, 0) <= 0)",
        "Not(If(cell_3_0, 1, 0) +\n    If(cell_3_1, 1, 0) +\n    If(cell_3_2, 1, 0) +\n    If(cell_3_3, 1, 0) +\n    If(cell_3_4, 1, 0) <=\n    1)",
        "Not(If(cell_3_1, 1, 0) >= 0)",
        "Not(If(cell_3_0, 1, 0) +\n    If(cell_3_1, 1, 0) +\n    If(cell_3_2, 1, 0) +\n    If(cell_3_3, 1, 0) +\n    If(cell_3_4, 1, 0) >=\n    1)",
        "Not(If(cell_2_3, 1, 0) +\n    If(cell_2_4, 1, 0) +\n    If(cell_3_2, 1, 0) +\n    If(cell_3_3, 1, 0) +\n    If(cell_3_4, 1, 0) +\n    If(cell_4_2, 1, 0) +\n    If(cell_4_3, 1, 0) +\n    If(cell_4_4, 1, 0) <=\n    1)",
        "Not(If(cell_0_2, 1, 0) +\n    If(cell_1_1, 1, 0) +\n    If(cell_1_2, 1, 0) +\n    If(cell_2_2, 1, 0) >=\n    1)",
        "Not(If(cell_2_3, 1, 0) +\n    If(cell_2_4, 1, 0) +\n    If(cell_3_2, 1, 0) +\n    If(cell_3_3, 1, 0) +\n    If(cell_3_4, 1, 0) +\n    If(cell_4_2, 1, 0) +\n    If(cell_4_3, 1, 0) +\n    If(cell_4_4, 1, 0) >=\n    1)",
        "Not(If(cell_0_2, 1, 0) +\n    If(cell_1_1, 1, 0) +\n    If(cell_1_2, 1, 0) +\n    If(cell_2_2, 1, 0) <=\n    1)",
        "Not(If(cell_2_1, 1, 0) <= 0)",
        "Not(If(cell_4_0, 1, 0) +\n    If(cell_4_1, 1, 0) +\n    If(cell_4_2, 1, 0) +\n    If(cell_4_3, 1, 0) +\n    If(cell_4_4, 1, 0) >=\n    1)",
        "Not(If(cell_2_1, 1, 0) >= 0)",
        "Not(If(cell_4_0, 1, 0) +\n    If(cell_4_1, 1, 0) +\n    If(cell_4_2, 1, 0) +\n    If(cell_4_3, 1, 0) +\n    If(cell_4_4, 1, 0) <=\n    1)",
        "Not(If(cell_0_0, 1, 0) +\n    If(cell_0_1, 1, 0) +\n    If(cell_0_2, 1, 0) <=\n    0)",
        "Not(If(cell_0_0, 1, 0) +\n    If(cell_0_1, 1, 0) +\n    If(cell_0_2, 1, 0) >=\n    0)",
        "Not(If(cell_1_0, 1, 0) +\n    If(cell_1_1, 1, 0) +\n    If(cell_1_2, 1, 0) <=\n    1)",
        "Not(If(cell_1_0, 1, 0) +\n    If(cell_1_1, 1, 0) +\n    If(cell_1_2, 1, 0) >=\n    1)",
        "Not(If(cell_0_0, 1, 0) +\n    If(cell_0_1, 1, 0) +\n    If(cell_1_0, 1, 0) +\n    If(cell_2_0, 1, 0) +\n    If(cell_3_0, 1, 0) <=\n    1)",
        "Not(If(cell_3_0, 1, 0) <= 0)",
        "Not(If(cell_0_0, 1, 0) +\n    If(cell_0_1, 1, 0) +\n    If(cell_1_0, 1, 0) +\n    If(cell_2_0, 1, 0) +\n    If(cell_3_0, 1, 0) >=\n    1)",
        "Not(If(cell_3_0, 1, 0) >= 0)",
        "Not(If(cell_0_2, 1, 0) +\n    If(cell_1_1, 1, 0) +\n    If(cell_1_2, 1, 0) +\n    If(cell_2_2, 1, 0) <=\n    1)",
        "Not(If(cell_0_2, 1, 0) +\n    If(cell_1_1, 1, 0) +\n    If(cell_1_2, 1, 0) +\n    If(cell_2_2, 1, 0) >=\n    1)",
        "Not(If(cell_2_2, 1, 0) <= 0)",
        "Not(If(cell_2_2, 1, 0) >= 0)",
        "0 == If(cell_2_0, 1, 0)"
      ]
    },
    {
      "proof": "rup",
      "dependencies": [],
      "clause": [
        "Not(0 == If(cell_4_0, 1, 0))",
        "0 == If(cell_2_0, 1, 0)",
        "Not(If(cell_4_1, 1, 0) <= 0)",
        "Not(If(cell_4_1, 1, 0) >= 0)",
        "Not(If(cell_2_2, 1, 0) <= 0)",
        "Not(If(cell_2_2, 1, 0) >= 0)"
      ]
    },
    {
      "proof": "rup",
      "dependencies": [],
      "clause": [
        "Not(0 == If(cell_4_0, 1, 0))",
        "0 == If(cell_2_0, 1, 0)",
        "Not(If(cell_4_1, 1, 0) <= 0)",
        "Not(If(cell_4_1, 1, 0) >= 0)",
        "Not(If(cell_2_2, 1, 0) <= 0)",
        "Not(If(cell_2_2, 1, 0) >= 0)"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_2_0, 1, 0) >= 0",
        "If(cell_2_0, 1, 0) <= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_2_0, 1, 0) <= 0",
        "If(cell_2_0, 1, 0) >= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(0 == If(cell_2_0, 1, 0))",
        "If(cell_2_0, 1, 0) <= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(0 == If(cell_2_0, 1, 0))",
        "If(cell_2_0, 1, 0) >= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "0 == If(cell_2_0, 1, 0)",
        "Not(If(cell_2_0, 1, 0) <= 0)",
        "Not(If(cell_2_0, 1, 0) >= 0)"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(If(cell_2_0, 1, 0) <= 0)",
        "Not(If(cell_2_0, 1, 0) >= 0)",
        "0 == If(cell_2_0, 1, 0)"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_4_0, 1, 0) >= 0",
        "If(cell_4_0, 1, 0) <= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_4_0, 1, 0) <= 0",
        "If(cell_4_0, 1, 0) >= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(0 == If(cell_4_0, 1, 0))",
        "If(cell_4_0, 1, 0) <= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(0 == If(cell_4_0, 1, 0))",
        "If(cell_4_0, 1, 0) >= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "0 == If(cell_4_0, 1, 0)",
        "Not(If(cell_4_0, 1, 0) <= 0)",
        "Not(If(cell_4_0, 1, 0) >= 0)"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(If(cell_4_0, 1, 0) <= 0)",
        "Not(If(cell_4_0, 1, 0) >= 0)",
        "0 == If(cell_4_0, 1, 0)"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_2_2, 1, 0) <= 1",
        "If(cell_2_2, 1, 0) >= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_2_2, 1, 0) <= 1",
        "Not(If(cell_2_2, 1, 0) <= 0)"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(If(cell_2_2, 1, 0) >= 1)",
        "If(cell_2_2, 1, 0) >= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(If(cell_2_2, 1, 0) >= 1)",
        "Not(If(cell_2_2, 1, 0) <= 0)"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_2_2, 1, 0) >= 1",
        "If(cell_2_2, 1, 0) <= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_2_2, 1, 0) >= 1",
        "If(cell_2_2, 1, 0) <= 1"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(1 == If(cell_2_2, 1, 0))",
        "If(cell_2_2, 1, 0) <= 1"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(1 == If(cell_2_2, 1, 0))",
        "If(cell_2_2, 1, 0) >= 1"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "1 == If(cell_2_2, 1, 0)",
        "Not(If(cell_2_2, 1, 0) <= 1)",
        "Not(If(cell_2_2, 1, 0) >= 1)"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_3_1, 1, 0) <= 1",
        "If(cell_3_1, 1, 0) >= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_3_1, 1, 0) <= 1",
        "Not(If(cell_3_1, 1, 0) <= 0)"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(If(cell_3_1, 1, 0) >= 1)",
        "If(cell_3_1, 1, 0) >= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(If(cell_3_1, 1, 0) >= 1)",
        "Not(If(cell_3_1, 1, 0) <= 0)"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_3_1, 1, 0) >= 1",
        "If(cell_3_1, 1, 0) <= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_3_1, 1, 0) >= 1",
        "If(cell_3_1, 1, 0) <= 1"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(1 == If(cell_3_1, 1, 0))",
        "If(cell_3_1, 1, 0) <= 1"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(1 == If(cell_3_1, 1, 0))",
        "If(cell_3_1, 1, 0) >= 1"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "1 == If(cell_3_1, 1, 0)",
        "Not(If(cell_3_1, 1, 0) <= 1)",
        "Not(If(cell_3_1, 1, 0) >= 1)"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_3_0, 1, 0) <= 1",
        "If(cell_3_0, 1, 0) >= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_3_0, 1, 0) <= 1",
        "Not(If(cell_3_0, 1, 0) <= 0)"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(If(cell_3_0, 1, 0) >= 1)",
        "If(cell_3_0, 1, 0) >= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(If(cell_3_0, 1, 0) >= 1)",
        "Not(If(cell_3_0, 1, 0) <= 0)"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_3_0, 1, 0) >= 1",
        "If(cell_3_0, 1, 0) <= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_3_0, 1, 0) >= 1",
        "If(cell_3_0, 1, 0) <= 1"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(1 == If(cell_3_0, 1, 0))",
        "If(cell_3_0, 1, 0) <= 1"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(1 == If(cell_3_0, 1, 0))",
        "If(cell_3_0, 1, 0) >= 1"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "1 == If(cell_3_0, 1, 0)",
        "Not(If(cell_3_0, 1, 0) <= 1)",
        "Not(If(cell_3_0, 1, 0) >= 1)"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_0_1, 1, 0) >= 0",
        "If(cell_0_1, 1, 0) <= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_0_1, 1, 0) <= 0",
        "If(cell_0_1, 1, 0) >= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(0 == If(cell_0_1, 1, 0))",
        "If(cell_0_1, 1, 0) <= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(0 == If(cell_0_1, 1, 0))",
        "If(cell_0_1, 1, 0) >= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "0 == If(cell_0_1, 1, 0)",
        "Not(If(cell_0_1, 1, 0) <= 0)",
        "Not(If(cell_0_1, 1, 0) >= 0)"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(If(cell_0_1, 1, 0) <= 0)",
        "Not(If(cell_0_1, 1, 0) >= 0)",
        "0 == If(cell_0_1, 1, 0)"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_4_1, 1, 0) <= 1",
        "If(cell_4_1, 1, 0) >= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_4_1, 1, 0) <= 1",
        "Not(If(cell_4_1, 1, 0) <= 0)"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(If(cell_4_1, 1, 0) >= 1)",
        "If(cell_4_1, 1, 0) >= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(If(cell_4_1, 1, 0) >= 1)",
        "Not(If(cell_4_1, 1, 0) <= 0)"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_4_1, 1, 0) >= 1",
        "If(cell_4_1, 1, 0) <= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_4_1, 1, 0) >= 1",
        "If(cell_4_1, 1, 0) <= 1"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(1 == If(cell_4_1, 1, 0))",
        "If(cell_4_1, 1, 0) <= 1"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(1 == If(cell_4_1, 1, 0))",
        "If(cell_4_1, 1, 0) >= 1"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "1 == If(cell_4_1, 1, 0)",
        "Not(If(cell_4_1, 1, 0) <= 1)",
        "Not(If(cell_4_1, 1, 0) >= 1)"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_3_3, 1, 0) <= 1",
        "If(cell_3_3, 1, 0) >= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_3_3, 1, 0) <= 1",
        "Not(If(cell_3_3, 1, 0) <= 0)"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(If(cell_3_3, 1, 0) >= 1)",
        "If(cell_3_3, 1, 0) >= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(If(cell_3_3, 1, 0) >= 1)",
        "Not(If(cell_3_3, 1, 0) <= 0)"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_3_3, 1, 0) >= 1",
        "If(cell_3_3, 1, 0) <= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_3_3, 1, 0) >= 1",
        "If(cell_3_3, 1, 0) <= 1"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(1 == If(cell_3_3, 1, 0))",
        "If(cell_3_3, 1, 0) <= 1"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(1 == If(cell_3_3, 1, 0))",
        "If(cell_3_3, 1, 0) >= 1"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "1 == If(cell_3_3, 1, 0)",
        "Not(If(cell_3_3, 1, 0) <= 1)",
        "Not(If(cell_3_3, 1, 0) >= 1)"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_1_2, 1, 0) >= 0",
        "If(cell_1_2, 1, 0) <= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_1_2, 1, 0) <= 0",
        "If(cell_1_2, 1, 0) >= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(0 == If(cell_1_2, 1, 0))",
        "If(cell_1_2, 1, 0) <= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(0 == If(cell_1_2, 1, 0))",
        "If(cell_1_2, 1, 0) >= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "0 == If(cell_1_2, 1, 0)",
        "Not(If(cell_1_2, 1, 0) <= 0)",
        "Not(If(cell_1_2, 1, 0) >= 0)"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(If(cell_1_2, 1, 0) <= 0)",
        "Not(If(cell_1_2, 1, 0) >= 0)",
        "0 == If(cell_1_2, 1, 0)"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_0_2, 1, 0) >= 1",
        "If(cell_0_2, 1, 0) <= 1"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_0_2, 1, 0) <= 1",
        "If(cell_0_2, 1, 0) >= 1"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(1 == If(cell_0_2, 1, 0))",
        "If(cell_0_2, 1, 0) <= 1"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(1 == If(cell_0_2, 1, 0))",
        "If(cell_0_2, 1, 0) >= 1"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "1 == If(cell_0_2, 1, 0)",
        "Not(If(cell_0_2, 1, 0) <= 1)",
        "Not(If(cell_0_2, 1, 0) >= 1)"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(If(cell_0_2, 1, 0) <= 1)",
        "Not(If(cell_0_2, 1, 0) >= 1)",
        "1 == If(cell_0_2, 1, 0)"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_1_0, 1, 0) <= 1",
        "If(cell_1_0, 1, 0) >= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_1_0, 1, 0) <= 1",
        "Not(If(cell_1_0, 1, 0) <= 0)"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(If(cell_1_0, 1, 0) >= 1)",
        "If(cell_1_0, 1, 0) >= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(If(cell_1_0, 1, 0) >= 1)",
        "Not(If(cell_1_0, 1, 0) <= 0)"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_1_0, 1, 0) >= 1",
        "If(cell_1_0, 1, 0) <= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_1_0, 1, 0) >= 1",
        "If(cell_1_0, 1, 0) <= 1"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(1 == If(cell_1_0, 1, 0))",
        "If(cell_1_0, 1, 0) <= 1"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(1 == If(cell_1_0, 1, 0))",
        "If(cell_1_0, 1, 0) >= 1"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "1 == If(cell_1_0, 1, 0)",
        "Not(If(cell_1_0, 1, 0) <= 1)",
        "Not(If(cell_1_0, 1, 0) >= 1)"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_1_1, 1, 0) <= 1",
        "If(cell_1_1, 1, 0) >= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_1_1, 1, 0) <= 1",
        "Not(If(cell_1_1, 1, 0) <= 0)"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(If(cell_1_1, 1, 0) >= 1)",
        "If(cell_1_1, 1, 0) >= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(If(cell_1_1, 1, 0) >= 1)",
        "Not(If(cell_1_1, 1, 0) <= 0)"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_1_1, 1, 0) >= 1",
        "If(cell_1_1, 1, 0) <= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_1_1, 1, 0) >= 1",
        "If(cell_1_1, 1, 0) <= 1"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(1 == If(cell_1_1, 1, 0))",
        "If(cell_1_1, 1, 0) <= 1"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(1 == If(cell_1_1, 1, 0))",
        "If(cell_1_1, 1, 0) >= 1"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "1 == If(cell_1_1, 1, 0)",
        "Not(If(cell_1_1, 1, 0) <= 1)",
        "Not(If(cell_1_1, 1, 0) >= 1)"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_2_1, 1, 0) <= 1",
        "If(cell_2_1, 1, 0) >= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_2_1, 1, 0) <= 1",
        "Not(If(cell_2_1, 1, 0) <= 0)"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(If(cell_2_1, 1, 0) >= 1)",
        "If(cell_2_1, 1, 0) >= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(If(cell_2_1, 1, 0) >= 1)",
        "Not(If(cell_2_1, 1, 0) <= 0)"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_2_1, 1, 0) >= 1",
        "If(cell_2_1, 1, 0) <= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_2_1, 1, 0) >= 1",
        "If(cell_2_1, 1, 0) <= 1"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(1 == If(cell_2_1, 1, 0))",
        "If(cell_2_1, 1, 0) <= 1"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(1 == If(cell_2_1, 1, 0))",
        "If(cell_2_1, 1, 0) >= 1"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "1 == If(cell_2_1, 1, 0)",
        "Not(If(cell_2_1, 1, 0) <= 1)",
        "Not(If(cell_2_1, 1, 0) >= 1)"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "0 == If(cell_2_0, 1, 0)",
        "Not(0 == If(cell_3_0, 1, 0))",
        "Not(If(cell_0_0, 1, 0) +\n    If(cell_0_1, 1, 0) +\n    If(cell_0_2, 1, 0) <=\n    0)",
        "Not(If(cell_0_0, 1, 0) +\n    If(cell_0_1, 1, 0) +\n    If(cell_0_2, 1, 0) >=\n    0)",
        "Not(If(cell_1_0, 1, 0) +\n    If(cell_1_1, 1, 0) +\n    If(cell_1_2, 1, 0) <=\n    1)",
        "Not(If(cell_1_0, 1, 0) +\n    If(cell_1_1, 1, 0) +\n    If(cell_1_2, 1, 0) >=\n    1)",
        "Not(If(cell_0_0, 1, 0) +\n    If(cell_0_1, 1, 0) +\n    If(cell_1_0, 1, 0) +\n    If(cell_2_0, 1, 0) +\n    If(cell_3_0, 1, 0) <=\n    1)",
        "Not(If(cell_3_0, 1, 0) <= 0)",
        "Not(If(cell_0_0, 1, 0) +\n    If(cell_0_1, 1, 0) +\n    If(cell_1_0, 1, 0) +\n    If(cell_2_0, 1, 0) +\n    If(cell_3_0, 1, 0) >=\n    1)",
        "Not(If(cell_3_0, 1, 0) >= 0)",
        "Not(If(cell_0_2, 1, 0) +\n    If(cell_1_1, 1, 0) +\n    If(cell_1_2, 1, 0) +\n    If(cell_2_2, 1, 0) <=\n    1)",
        "Not(If(cell_0_2, 1, 0) +\n    If(cell_1_1, 1, 0) +\n    If(cell_1_2, 1, 0) +\n    If(cell_2_2, 1, 0) >=\n    1)",
        "Not(If(cell_2_2, 1, 0) <= 0)",
        "Not(If(cell_2_2, 1, 0) >= 0)",
        "Not(If(cell_0_1, 1, 0) +\n    If(cell_1_1, 1, 0) +\n    If(cell_2_1, 1, 0) +\n    If(cell_3_1, 1, 0) +\n    If(cell_4_1, 1, 0) <=\n    1)",
        "Not(If(cell_0_1, 1, 0) +\n    If(cell_1_1, 1, 0) +\n    If(cell_2_1, 1, 0) +\n    If(cell_3_1, 1, 0) +\n    If(cell_4_1, 1, 0) >=\n    1)",
        "Not(If(cell_1_0, 1, 0) <= 0)",
        "Not(If(cell_1_0, 1, 0) >= 0)",
        "Not(If(cell_0_0, 1, 0) +\n    If(cell_0_1, 1, 0) +\n    If(cell_0_2, 1, 0) <=\n    0)",
        "Not(If(cell_0_0, 1, 0) +\n    If(cell_0_1, 1, 0) +\n    If(cell_0_2, 1, 0) >=\n    0)",
        "Not(If(cell_1_0, 1, 0) +\n    If(cell_1_1, 1, 0) +\n    If(cell_1_2, 1, 0) <=\n    1)",
        "Not(If(cell_1_0, 1, 0) +\n    If(cell_1_1, 1, 0) +\n    If(cell_1_2, 1, 0) >=\n    1)",
        "Not(If(cell_2_0, 1, 0) +\n    If(cell_2_1, 1, 0) +\n    If(cell_2_2, 1, 0) +\n    If(cell_2_3, 1, 0) +\n    If(cell_2_4, 1, 0) <=\n    1)",
        "Not(If(cell_2_0, 1, 0) +\n    If(cell_2_1, 1, 0) +\n    If(cell_2_2, 1, 0) +\n    If(cell_2_3, 1, 0) +\n    If(cell_2_4, 1, 0) >=\n    1)",
        "Not(If(cell_3_0, 1, 0) +\n    If(cell_3_1, 1, 0) +\n    If(cell_3_2, 1, 0) +\n    If(cell_3_3, 1, 0) +\n    If(cell_3_4, 1, 0) <=\n    1)",
        "Not(If(cell_0_2, 1, 0) +\n    If(cell_1_1, 1, 0) +\n    If(cell_1_2, 1, 0) +\n    If(cell_2_2, 1, 0) <=\n    1)",
        "Not(If(cell_3_0, 1, 0) +\n    If(cell_3_1, 1, 0) +\n    If(cell_3_2, 1, 0) +\n    If(cell_3_3, 1, 0) +\n    If(cell_3_4, 1, 0) >=\n    1)",
        "Not(If(cell_0_2, 1, 0) +\n    If(cell_1_1, 1, 0) +\n    If(cell_1_2, 1, 0) +\n    If(cell_2_2, 1, 0) >=\n    1)",
        "Not(If(cell_2_3, 1, 0) +\n    If(cell_2_4, 1, 0) +\n    If(cell_3_2, 1, 0) +\n    If(cell_3_3, 1, 0) +\n    If(cell_3_4, 1, 0) +\n    If(cell_4_2, 1, 0) +\n    If(cell_4_3, 1, 0) +\n    If(cell_4_4, 1, 0) <=\n    1)",
        "Not(If(cell_4_0, 1, 0) +\n    If(cell_4_1, 1, 0) +\n    If(cell_4_2, 1, 0) +\n    If(cell_4_3, 1, 0) +\n    If(cell_4_4, 1, 0) <=\n    1)",
        "Not(If(cell_2_3, 1, 0) +\n    If(cell_2_4, 1, 0) +\n    If(cell_3_2, 1, 0) +\n    If(cell_3_3, 1, 0) +\n    If(cell_3_4, 1, 0) +\n    If(cell_4_2, 1, 0) +\n    If(cell_4_3, 1, 0) +\n    If(cell_4_4, 1, 0) >=\n    1)",
        "Not(If(cell_4_0, 1, 0) +\n    If(cell_4_1, 1, 0) +\n    If(cell_4_2, 1, 0) +\n    If(cell_4_3, 1, 0) +\n    If(cell_4_4, 1, 0) >=\n    1)",
        "Not(If(cell_0_0, 1, 0) +\n    If(cell_1_0, 1, 0) +\n    If(cell_2_0, 1, 0) +\n    If(cell_3_0, 1, 0) +\n    If(cell_4_0, 1, 0) <=\n    1)",
        "Not(If(cell_0_0, 1, 0) +\n    If(cell_1_0, 1, 0) +\n    If(cell_2_0, 1, 0) +\n    If(cell_3_0, 1, 0) +\n    If(cell_4_0, 1, 0) >=\n    1)",
        "Not(0 == If(cell_1_2, 1, 0))"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_4_1, 1, 0) >= 0",
        "If(cell_4_1, 1, 0) <= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_4_1, 1, 0) <= 0",
        "If(cell_4_1, 1, 0) >= 0"
      ]
    },
    {
      "proof": "rup",
      "dependencies": [],
      "clause": [
        "0 == If(cell_0_1, 1, 0)",
        "0 == If(cell_2_0, 1, 0)",
        "Not(If(cell_2_2, 1, 0) <= 0)",
        "Not(If(cell_2_2, 1, 0) >= 0)"
      ]
    },
    {
      "proof": "rup",
      "dependencies": [],
      "clause": [
        "0 == If(cell_0_1, 1, 0)",
        "0 == If(cell_2_0, 1, 0)",
        "Not(If(cell_2_2, 1, 0) <= 0)",
        "Not(If(cell_2_2, 1, 0) >= 0)"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_0_1, 1, 0) >= 0",
        "If(cell_0_1, 1, 0) <= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_0_1, 1, 0) <= 0",
        "If(cell_0_1, 1, 0) >= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(0 == If(cell_0_1, 1, 0))",
        "If(cell_0_1, 1, 0) <= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(0 == If(cell_0_1, 1, 0))",
        "If(cell_0_1, 1, 0) >= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "0 == If(cell_0_1, 1, 0)",
        "Not(If(cell_0_1, 1, 0) <= 0)",
        "Not(If(cell_0_1, 1, 0) >= 0)"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_2_0, 1, 0) >= 0",
        "If(cell_2_0, 1, 0) <= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_2_0, 1, 0) <= 0",
        "If(cell_2_0, 1, 0) >= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(0 == If(cell_2_0, 1, 0))",
        "If(cell_2_0, 1, 0) <= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(0 == If(cell_2_0, 1, 0))",
        "If(cell_2_0, 1, 0) >= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "0 == If(cell_2_0, 1, 0)",
        "Not(If(cell_2_0, 1, 0) <= 0)",
        "Not(If(cell_2_0, 1, 0) >= 0)"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(If(cell_2_0, 1, 0) <= 0)",
        "Not(If(cell_2_0, 1, 0) >= 0)",
        "0 == If(cell_2_0, 1, 0)"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_2_2, 1, 0) <= 1",
        "If(cell_2_2, 1, 0) >= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_2_2, 1, 0) <= 1",
        "Not(If(cell_2_2, 1, 0) <= 0)"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(If(cell_2_2, 1, 0) >= 1)",
        "If(cell_2_2, 1, 0) >= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(If(cell_2_2, 1, 0) >= 1)",
        "Not(If(cell_2_2, 1, 0) <= 0)"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_2_2, 1, 0) >= 1",
        "If(cell_2_2, 1, 0) <= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_2_2, 1, 0) >= 1",
        "If(cell_2_2, 1, 0) <= 1"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(1 == If(cell_2_2, 1, 0))",
        "If(cell_2_2, 1, 0) <= 1"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(1 == If(cell_2_2, 1, 0))",
        "If(cell_2_2, 1, 0) >= 1"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "1 == If(cell_2_2, 1, 0)",
        "Not(If(cell_2_2, 1, 0) <= 1)",
        "Not(If(cell_2_2, 1, 0) >= 1)"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_3_1, 1, 0) <= 1",
        "If(cell_3_1, 1, 0) >= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_3_1, 1, 0) <= 1",
        "Not(If(cell_3_1, 1, 0) <= 0)"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(If(cell_3_1, 1, 0) >= 1)",
        "If(cell_3_1, 1, 0) >= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(If(cell_3_1, 1, 0) >= 1)",
        "Not(If(cell_3_1, 1, 0) <= 0)"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_3_1, 1, 0) >= 1",
        "If(cell_3_1, 1, 0) <= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_3_1, 1, 0) >= 1",
        "If(cell_3_1, 1, 0) <= 1"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(1 == If(cell_3_1, 1, 0))",
        "If(cell_3_1, 1, 0) <= 1"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(1 == If(cell_3_1, 1, 0))",
        "If(cell_3_1, 1, 0) >= 1"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "1 == If(cell_3_1, 1, 0)",
        "Not(If(cell_3_1, 1, 0) <= 1)",
        "Not(If(cell_3_1, 1, 0) >= 1)"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_3_0, 1, 0) <= 1",
        "If(cell_3_0, 1, 0) >= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_3_0, 1, 0) <= 1",
        "Not(If(cell_3_0, 1, 0) <= 0)"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(If(cell_3_0, 1, 0) >= 1)",
        "If(cell_3_0, 1, 0) >= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(If(cell_3_0, 1, 0) >= 1)",
        "Not(If(cell_3_0, 1, 0) <= 0)"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_3_0, 1, 0) >= 1",
        "If(cell_3_0, 1, 0) <= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_3_0, 1, 0) >= 1",
        "If(cell_3_0, 1, 0) <= 1"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(1 == If(cell_3_0, 1, 0))",
        "If(cell_3_0, 1, 0) <= 1"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(1 == If(cell_3_0, 1, 0))",
        "If(cell_3_0, 1, 0) >= 1"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "1 == If(cell_3_0, 1, 0)",
        "Not(If(cell_3_0, 1, 0) <= 1)",
        "Not(If(cell_3_0, 1, 0) >= 1)"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_1_2, 1, 0) >= 0",
        "If(cell_1_2, 1, 0) <= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_1_2, 1, 0) <= 0",
        "If(cell_1_2, 1, 0) >= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(0 == If(cell_1_2, 1, 0))",
        "If(cell_1_2, 1, 0) <= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(0 == If(cell_1_2, 1, 0))",
        "If(cell_1_2, 1, 0) >= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "0 == If(cell_1_2, 1, 0)",
        "Not(If(cell_1_2, 1, 0) <= 0)",
        "Not(If(cell_1_2, 1, 0) >= 0)"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(If(cell_1_2, 1, 0) <= 0)",
        "Not(If(cell_1_2, 1, 0) >= 0)",
        "0 == If(cell_1_2, 1, 0)"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_0_2, 1, 0) >= 1",
        "If(cell_0_2, 1, 0) <= 1"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_0_2, 1, 0) <= 1",
        "If(cell_0_2, 1, 0) >= 1"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(1 == If(cell_0_2, 1, 0))",
        "If(cell_0_2, 1, 0) <= 1"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(1 == If(cell_0_2, 1, 0))",
        "If(cell_0_2, 1, 0) >= 1"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "1 == If(cell_0_2, 1, 0)",
        "Not(If(cell_0_2, 1, 0) <= 1)",
        "Not(If(cell_0_2, 1, 0) >= 1)"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(If(cell_0_2, 1, 0) <= 1)",
        "Not(If(cell_0_2, 1, 0) >= 1)",
        "1 == If(cell_0_2, 1, 0)"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_1_0, 1, 0) <= 1",
        "If(cell_1_0, 1, 0) >= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_1_0, 1, 0) <= 1",
        "Not(If(cell_1_0, 1, 0) <= 0)"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(If(cell_1_0, 1, 0) >= 1)",
        "If(cell_1_0, 1, 0) >= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(If(cell_1_0, 1, 0) >= 1)",
        "Not(If(cell_1_0, 1, 0) <= 0)"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_1_0, 1, 0) >= 1",
        "If(cell_1_0, 1, 0) <= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_1_0, 1, 0) >= 1",
        "If(cell_1_0, 1, 0) <= 1"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(1 == If(cell_1_0, 1, 0))",
        "If(cell_1_0, 1, 0) <= 1"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(1 == If(cell_1_0, 1, 0))",
        "If(cell_1_0, 1, 0) >= 1"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "1 == If(cell_1_0, 1, 0)",
        "Not(If(cell_1_0, 1, 0) <= 1)",
        "Not(If(cell_1_0, 1, 0) >= 1)"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_1_1, 1, 0) <= 1",
        "If(cell_1_1, 1, 0) >= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_1_1, 1, 0) <= 1",
        "Not(If(cell_1_1, 1, 0) <= 0)"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(If(cell_1_1, 1, 0) >= 1)",
        "If(cell_1_1, 1, 0) >= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(If(cell_1_1, 1, 0) >= 1)",
        "Not(If(cell_1_1, 1, 0) <= 0)"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_1_1, 1, 0) >= 1",
        "If(cell_1_1, 1, 0) <= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_1_1, 1, 0) >= 1",
        "If(cell_1_1, 1, 0) <= 1"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(1 == If(cell_1_1, 1, 0))",
        "If(cell_1_1, 1, 0) <= 1"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(1 == If(cell_1_1, 1, 0))",
        "If(cell_1_1, 1, 0) >= 1"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "1 == If(cell_1_1, 1, 0)",
        "Not(If(cell_1_1, 1, 0) <= 1)",
        "Not(If(cell_1_1, 1, 0) >= 1)"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_2_1, 1, 0) <= 1",
        "If(cell_2_1, 1, 0) >= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_2_1, 1, 0) <= 1",
        "Not(If(cell_2_1, 1, 0) <= 0)"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(If(cell_2_1, 1, 0) >= 1)",
        "If(cell_2_1, 1, 0) >= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(If(cell_2_1, 1, 0) >= 1)",
        "Not(If(cell_2_1, 1, 0) <= 0)"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_2_1, 1, 0) >= 1",
        "If(cell_2_1, 1, 0) <= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_2_1, 1, 0) >= 1",
        "If(cell_2_1, 1, 0) <= 1"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(1 == If(cell_2_1, 1, 0))",
        "If(cell_2_1, 1, 0) <= 1"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(1 == If(cell_2_1, 1, 0))",
        "If(cell_2_1, 1, 0) >= 1"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "1 == If(cell_2_1, 1, 0)",
        "Not(If(cell_2_1, 1, 0) <= 1)",
        "Not(If(cell_2_1, 1, 0) >= 1)"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_2_3, 1, 0) >= 0",
        "If(cell_2_3, 1, 0) <= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_2_3, 1, 0) <= 0",
        "If(cell_2_3, 1, 0) >= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(0 == If(cell_2_3, 1, 0))",
        "If(cell_2_3, 1, 0) <= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(0 == If(cell_2_3, 1, 0))",
        "If(cell_2_3, 1, 0) >= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "0 == If(cell_2_3, 1, 0)",
        "Not(If(cell_2_3, 1, 0) <= 0)",
        "Not(If(cell_2_3, 1, 0) >= 0)"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_0_1, 1, 0) <= 1",
        "If(cell_0_1, 1, 0) >= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_0_1, 1, 0) <= 1",
        "Not(If(cell_0_1, 1, 0) <= 0)"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(If(cell_0_1, 1, 0) >= 1)",
        "If(cell_0_1, 1, 0) >= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(If(cell_0_1, 1, 0) >= 1)",
        "Not(If(cell_0_1, 1, 0) <= 0)"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_0_1, 1, 0) >= 1",
        "If(cell_0_1, 1, 0) <= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_0_1, 1, 0) >= 1",
        "If(cell_0_1, 1, 0) <= 1"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(1 == If(cell_0_1, 1, 0))",
        "If(cell_0_1, 1, 0) <= 1"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(1 == If(cell_0_1, 1, 0))",
        "If(cell_0_1, 1, 0) >= 1"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "1 == If(cell_0_1, 1, 0)",
        "Not(If(cell_0_1, 1, 0) <= 1)",
        "Not(If(cell_0_1, 1, 0) >= 1)"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_2_3, 1, 0) <= 1",
        "If(cell_2_3, 1, 0) >= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_2_3, 1, 0) <= 1",
        "Not(If(cell_2_3, 1, 0) <= 0)"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(If(cell_2_3, 1, 0) >= 1)",
        "If(cell_2_3, 1, 0) >= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(If(cell_2_3, 1, 0) >= 1)",
        "Not(If(cell_2_3, 1, 0) <= 0)"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_2_3, 1, 0) >= 1",
        "If(cell_2_3, 1, 0) <= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_2_3, 1, 0) >= 1",
        "If(cell_2_3, 1, 0) <= 1"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(1 == If(cell_2_3, 1, 0))",
        "If(cell_2_3, 1, 0) <= 1"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(1 == If(cell_2_3, 1, 0))",
        "If(cell_2_3, 1, 0) >= 1"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "1 == If(cell_2_3, 1, 0)",
        "Not(If(cell_2_3, 1, 0) <= 1)",
        "Not(If(cell_2_3, 1, 0) >= 1)"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_4_2, 1, 0) <= 0",
        "If(cell_4_2, 1, 0) >= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_4_2, 1, 0) >= 0",
        "If(cell_4_2, 1, 0) <= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(0 == If(cell_4_2, 1, 0))",
        "If(cell_4_2, 1, 0) <= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(0 == If(cell_4_2, 1, 0))",
        "If(cell_4_2, 1, 0) >= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "0 == If(cell_4_2, 1, 0)",
        "Not(If(cell_4_2, 1, 0) <= 0)",
        "Not(If(cell_4_2, 1, 0) >= 0)"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_3_2, 1, 0) >= 0",
        "If(cell_3_2, 1, 0) <= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_3_2, 1, 0) <= 0",
        "If(cell_3_2, 1, 0) >= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(0 == If(cell_3_2, 1, 0))",
        "If(cell_3_2, 1, 0) <= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(0 == If(cell_3_2, 1, 0))",
        "If(cell_3_2, 1, 0) >= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "0 == If(cell_3_2, 1, 0)",
        "Not(If(cell_3_2, 1, 0) <= 0)",
        "Not(If(cell_3_2, 1, 0) >= 0)"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_4_0, 1, 0) >= 1",
        "If(cell_4_0, 1, 0) <= 1"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_4_0, 1, 0) <= 1",
        "If(cell_4_0, 1, 0) >= 1"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(1 == If(cell_4_0, 1, 0))",
        "If(cell_4_0, 1, 0) <= 1"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(1 == If(cell_4_0, 1, 0))",
        "If(cell_4_0, 1, 0) >= 1"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "1 == If(cell_4_0, 1, 0)",
        "Not(If(cell_4_0, 1, 0) <= 1)",
        "Not(If(cell_4_0, 1, 0) >= 1)"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(If(cell_4_0, 1, 0) <= 1)",
        "Not(If(cell_4_0, 1, 0) >= 1)",
        "1 == If(cell_4_0, 1, 0)"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_0_0, 1, 0) >= 1",
        "If(cell_0_0, 1, 0) <= 1"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_0_0, 1, 0) <= 1",
        "If(cell_0_0, 1, 0) >= 1"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(1 == If(cell_0_0, 1, 0))",
        "If(cell_0_0, 1, 0) <= 1"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(1 == If(cell_0_0, 1, 0))",
        "If(cell_0_0, 1, 0) >= 1"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "1 == If(cell_0_0, 1, 0)",
        "Not(If(cell_0_0, 1, 0) <= 1)",
        "Not(If(cell_0_0, 1, 0) >= 1)"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(If(cell_0_0, 1, 0) <= 1)",
        "Not(If(cell_0_0, 1, 0) >= 1)",
        "1 == If(cell_0_0, 1, 0)"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(0 == If(cell_4_1, 1, 0))",
        "If(cell_4_1, 1, 0) <= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(0 == If(cell_4_1, 1, 0))",
        "If(cell_4_1, 1, 0) >= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "0 == If(cell_4_1, 1, 0)",
        "Not(If(cell_4_1, 1, 0) <= 0)",
        "Not(If(cell_4_1, 1, 0) >= 0)"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_4_2, 1, 0) <= 1",
        "If(cell_4_2, 1, 0) >= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_4_2, 1, 0) <= 1",
        "Not(If(cell_4_2, 1, 0) <= 0)"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(If(cell_4_2, 1, 0) >= 1)",
        "If(cell_4_2, 1, 0) >= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(If(cell_4_2, 1, 0) >= 1)",
        "Not(If(cell_4_2, 1, 0) <= 0)"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_4_2, 1, 0) >= 1",
        "If(cell_4_2, 1, 0) <= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_4_2, 1, 0) >= 1",
        "If(cell_4_2, 1, 0) <= 1"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(1 == If(cell_4_2, 1, 0))",
        "If(cell_4_2, 1, 0) <= 1"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(1 == If(cell_4_2, 1, 0))",
        "If(cell_4_2, 1, 0) >= 1"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "1 == If(cell_4_2, 1, 0)",
        "Not(If(cell_4_2, 1, 0) <= 1)",
        "Not(If(cell_4_2, 1, 0) >= 1)"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_3_2, 1, 0) <= 1",
        "If(cell_3_2, 1, 0) >= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_3_2, 1, 0) <= 1",
        "Not(If(cell_3_2, 1, 0) <= 0)"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(If(cell_3_2, 1, 0) >= 1)",
        "If(cell_3_2, 1, 0) >= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(If(cell_3_2, 1, 0) >= 1)",
        "Not(If(cell_3_2, 1, 0) <= 0)"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_3_2, 1, 0) >= 1",
        "If(cell_3_2, 1, 0) <= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_3_2, 1, 0) >= 1",
        "If(cell_3_2, 1, 0) <= 1"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(1 == If(cell_3_2, 1, 0))",
        "If(cell_3_2, 1, 0) <= 1"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(1 == If(cell_3_2, 1, 0))",
        "If(cell_3_2, 1, 0) >= 1"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "1 == If(cell_3_2, 1, 0)",
        "Not(If(cell_3_2, 1, 0) <= 1)",
        "Not(If(cell_3_2, 1, 0) >= 1)"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_2_4, 1, 0) >= 1",
        "If(cell_2_4, 1, 0) <= 1"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_2_4, 1, 0) <= 1",
        "If(cell_2_4, 1, 0) >= 1"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(1 == If(cell_2_4, 1, 0))",
        "If(cell_2_4, 1, 0) <= 1"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(1 == If(cell_2_4, 1, 0))",
        "If(cell_2_4, 1, 0) >= 1"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "1 == If(cell_2_4, 1, 0)",
        "Not(If(cell_2_4, 1, 0) <= 1)",
        "Not(If(cell_2_4, 1, 0) >= 1)"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(If(cell_2_4, 1, 0) <= 1)",
        "Not(If(cell_2_4, 1, 0) >= 1)",
        "1 == If(cell_2_4, 1, 0)"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(0 == If(cell_3_3, 1, 0))",
        "If(cell_3_3, 1, 0) <= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(0 == If(cell_3_3, 1, 0))",
        "If(cell_3_3, 1, 0) >= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "0 == If(cell_3_3, 1, 0)",
        "Not(If(cell_3_3, 1, 0) <= 0)",
        "Not(If(cell_3_3, 1, 0) >= 0)"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_3_3, 1, 0) <= 1",
        "If(cell_3_3, 1, 0) >= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_3_3, 1, 0) <= 1",
        "Not(If(cell_3_3, 1, 0) <= 0)"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(If(cell_3_3, 1, 0) >= 1)",
        "If(cell_3_3, 1, 0) >= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(If(cell_3_3, 1, 0) >= 1)",
        "Not(If(cell_3_3, 1, 0) <= 0)"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_3_3, 1, 0) >= 1",
        "If(cell_3_3, 1, 0) <= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_3_3, 1, 0) >= 1",
        "If(cell_3_3, 1, 0) <= 1"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(1 == If(cell_3_3, 1, 0))",
        "If(cell_3_3, 1, 0) <= 1"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(1 == If(cell_3_3, 1, 0))",
        "If(cell_3_3, 1, 0) >= 1"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "1 == If(cell_3_3, 1, 0)",
        "Not(If(cell_3_3, 1, 0) <= 1)",
        "Not(If(cell_3_3, 1, 0) >= 1)"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "1 == If(cell_3_0, 1, 0)",
        "Not(0 == If(cell_3_0, 1, 0))",
        "Not(If(cell_2_3, 1, 0) <= 0)",
        "Not(If(cell_3_3, 1, 0) <= 0)",
        "Not(If(cell_2_3, 1, 0) >= 0)",
        "Not(If(cell_2_3, 1, 0) +\n    If(cell_3_3, 1, 0) +\n    If(cell_4_3, 1, 0) <=\n    1)",
        "Not(If(cell_2_3, 1, 0) +\n    If(cell_3_3, 1, 0) +\n    If(cell_4_3, 1, 0) >=\n    1)",
        "Not(If(cell_3_3, 1, 0) >= 0)",
        "Not(0 == If(cell_4_3, 1, 0))"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "1 == If(cell_3_0, 1, 0)",
        "Not(If(cell_4_2, 1, 0) >= 0)",
        "Not(If(cell_3_3, 1, 0) <= 0)",
        "Not(If(cell_0_0, 1, 0) +\n    If(cell_0_1, 1, 0) +\n    If(cell_0_2, 1, 0) <=\n    0)",
        "Not(If(cell_0_0, 1, 0) +\n    If(cell_0_1, 1, 0) +\n    If(cell_0_2, 1, 0) >=\n    0)",
        "Not(If(cell_1_0, 1, 0) +\n    If(cell_1_1, 1, 0) +\n    If(cell_1_2, 1, 0) <=\n    1)",
        "Not(If(cell_3_3, 1, 0) >= 0)",
        "Not(If(cell_1_0, 1, 0) +\n    If(cell_1_1, 1, 0) +\n    If(cell_1_2, 1, 0) >=\n    1)",
        "Not(If(cell_2_0, 1, 0) +\n    If(cell_2_1, 1, 0) +\n    If(cell_2_2, 1, 0) +\n    If(cell_2_3, 1, 0) +\n    If(cell_2_4, 1, 0) <=\n    1)",
        "Not(If(cell_3_0, 1, 0) <= 0)",
        "Not(If(cell_2_0, 1, 0) +\n    If(cell_2_1, 1, 0) +\n    If(cell_2_2, 1, 0) +\n    If(cell_2_3, 1, 0) +\n    If(cell_2_4, 1, 0) >=\n    1)",
        "Not(If(cell_3_0, 1, 0) >= 0)",
        "Not(If(cell_3_0, 1, 0) +\n    If(cell_3_1, 1, 0) +\n    If(cell_3_2, 1, 0) +\n    If(cell_3_3, 1, 0) +\n    If(cell_3_4, 1, 0) <=\n    1)",
        "Not(If(cell_3_1, 1, 0) <= 0)",
        "Not(If(cell_3_0, 1, 0) +\n    If(cell_3_1, 1, 0) +\n    If(cell_3_2, 1, 0) +\n    If(cell_3_3, 1, 0) +\n    If(cell_3_4, 1, 0) >=\n    1)",
        "Not(If(cell_3_1, 1, 0) >= 0)",
        "Not(If(cell_4_0, 1, 0) +\n    If(cell_4_1, 1, 0) +\n    If(cell_4_2, 1, 0) +\n    If(cell_4_3, 1, 0) +\n    If(cell_4_4, 1, 0) <=\n    1)",
        "Not(If(cell_4_0, 1, 0) +\n    If(cell_4_1, 1, 0) +\n    If(cell_4_2, 1, 0) +\n    If(cell_4_3, 1, 0) +\n    If(cell_4_4, 1, 0) >=\n    1)",
        "Not(If(cell_0_0, 1, 0) +\n    If(cell_1_0, 1, 0) +\n    If(cell_2_0, 1, 0) +\n    If(cell_3_0, 1, 0) +\n    If(cell_4_0, 1, 0) <=\n    1)",
        "Not(If(cell_0_0, 1, 0) +\n    If(cell_1_0, 1, 0) +\n    If(cell_2_0, 1, 0) +\n    If(cell_3_0, 1, 0) +\n    If(cell_4_0, 1, 0) >=\n    1)",
        "Not(If(cell_4_2, 1, 0) <= 0)",
        "Not(If(cell_0_1, 1, 0) +\n    If(cell_1_1, 1, 0) +\n    If(cell_2_1, 1, 0) +\n    If(cell_3_1, 1, 0) +\n    If(cell_4_1, 1, 0) <=\n    1)",
        "Not(If(cell_0_1, 1, 0) +\n    If(cell_1_1, 1, 0) +\n    If(cell_2_1, 1, 0) +\n    If(cell_3_1, 1, 0) +\n    If(cell_4_1, 1, 0) >=\n    1)",
        "Not(If(cell_0_2, 1, 0) +\n    If(cell_1_2, 1, 0) +\n    If(cell_2_2, 1, 0) +\n    If(cell_3_2, 1, 0) +\n    If(cell_4_2, 1, 0) <=\n    1)",
        "Not(If(cell_0_2, 1, 0) +\n    If(cell_1_2, 1, 0) +\n    If(cell_2_2, 1, 0) +\n    If(cell_3_2, 1, 0) +\n    If(cell_4_2, 1, 0) >=\n    1)",
        "Not(If(cell_2_3, 1, 0) +\n    If(cell_2_4, 1, 0) +\n    If(cell_3_2, 1, 0) +\n    If(cell_3_3, 1, 0) +\n    If(cell_3_4, 1, 0) +\n    If(cell_4_2, 1, 0) +\n    If(cell_4_3, 1, 0) +\n    If(cell_4_4, 1, 0) <=\n    1)",
        "Not(If(cell_2_3, 1, 0) +\n    If(cell_2_4, 1, 0) +\n    If(cell_3_2, 1, 0) +\n    If(cell_3_3, 1, 0) +\n    If(cell_3_4, 1, 0) +\n    If(cell_4_2, 1, 0) +\n    If(cell_4_3, 1, 0) +\n    If(cell_4_4, 1, 0) >=\n    1)",
        "Not(0 == If(cell_3_4, 1, 0))"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(0 == If(cell_3_3, 1, 0))",
        "If(cell_3_3, 1, 0) >= 0"
      ]
    },
    {
      "proof": "rup",
      "dependencies": [],
      "clause": [
        "Not(If(cell_3_3, 1, 0) <= 0)",
        "1 == If(cell_3_0, 1, 0)",
        "Not(If(cell_2_3, 1, 0) <= 0)",
        "Not(If(cell_2_3, 1, 0) >= 0)",
        "Not(If(cell_4_2, 1, 0) >= 0)",
        "Not(If(cell_4_2, 1, 0) <= 0)",
        "Not(0 == If(cell_3_3, 1, 0))"
      ]
    },
    {
      "proof": "rup",
      "dependencies": [],
      "clause": [
        "Not(If(cell_3_3, 1, 0) <= 0)",
        "1 == If(cell_3_0, 1, 0)",
        "Not(If(cell_2_3, 1, 0) <= 0)",
        "Not(If(cell_2_3, 1, 0) >= 0)",
        "Not(If(cell_4_2, 1, 0) >= 0)",
        "Not(If(cell_4_2, 1, 0) <= 0)",
        "Not(0 == If(cell_3_3, 1, 0))"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(0 == If(cell_3_3, 1, 0))",
        "If(cell_3_3, 1, 0) <= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(0 == If(cell_3_3, 1, 0))",
        "If(cell_3_3, 1, 0) >= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "0 == If(cell_3_3, 1, 0)",
        "Not(If(cell_3_3, 1, 0) <= 0)",
        "Not(If(cell_3_3, 1, 0) >= 0)"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(0 == If(cell_3_3, 1, 0))",
        "If(cell_3_3, 1, 0) <= 0",
        "False"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(0 == If(cell_4_2, 1, 0))",
        "If(cell_4_2, 1, 0) >= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(0 == If(cell_4_2, 1, 0))",
        "If(cell_4_2, 1, 0) <= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "1 == If(cell_3_0, 1, 0)",
        "Not(0 == If(cell_3_0, 1, 0))",
        "Not(If(cell_3_1, 1, 0) >= 0)",
        "Not(If(cell_3_1, 1, 0) <= 0)",
        "Not(If(cell_0_0, 1, 0) +\n    If(cell_0_1, 1, 0) +\n    If(cell_0_2, 1, 0) <=\n    0)",
        "Not(If(cell_0_0, 1, 0) +\n    If(cell_0_1, 1, 0) +\n    If(cell_0_2, 1, 0) >=\n    0)",
        "Not(If(cell_1_0, 1, 0) +\n    If(cell_1_1, 1, 0) +\n    If(cell_1_2, 1, 0) <=\n    1)",
        "Not(If(cell_0_1, 1, 0) <= 0)",
        "Not(If(cell_1_0, 1, 0) +\n    If(cell_1_1, 1, 0) +\n    If(cell_1_2, 1, 0) >=\n    1)",
        "Not(If(cell_0_1, 1, 0) >= 0)",
        "Not(If(cell_2_0, 1, 0) +\n    If(cell_2_1, 1, 0) +\n    If(cell_2_2, 1, 0) +\n    If(cell_2_3, 1, 0) +\n    If(cell_2_4, 1, 0) <=\n    1)",
        "Not(If(cell_2_0, 1, 0) +\n    If(cell_2_1, 1, 0) +\n    If(cell_2_2, 1, 0) +\n    If(cell_2_3, 1, 0) +\n    If(cell_2_4, 1, 0) >=\n    1)",
        "Not(If(cell_3_0, 1, 0) +\n    If(cell_3_1, 1, 0) +\n    If(cell_3_2, 1, 0) +\n    If(cell_3_3, 1, 0) +\n    If(cell_3_4, 1, 0) <=\n    1)",
        "Not(If(cell_0_2, 1, 0) +\n    If(cell_1_1, 1, 0) +\n    If(cell_1_2, 1, 0) +\n    If(cell_2_2, 1, 0) <=\n    1)",
        "Not(If(cell_3_0, 1, 0) +\n    If(cell_3_1, 1, 0) +\n    If(cell_3_2, 1, 0) +\n    If(cell_3_3, 1, 0) +\n    If(cell_3_4, 1, 0) >=\n    1)",
        "Not(If(cell_0_2, 1, 0) +\n    If(cell_1_1, 1, 0) +\n    If(cell_1_2, 1, 0) +\n    If(cell_2_2, 1, 0) >=\n    1)",
        "Not(If(cell_2_3, 1, 0) +\n    If(cell_2_4, 1, 0) +\n    If(cell_3_2, 1, 0) +\n    If(cell_3_3, 1, 0) +\n    If(cell_3_4, 1, 0) +\n    If(cell_4_2, 1, 0) +\n    If(cell_4_3, 1, 0) +\n    If(cell_4_4, 1, 0) <=\n    1)",
        "Not(If(cell_4_0, 1, 0) +\n    If(cell_4_1, 1, 0) +\n    If(cell_4_2, 1, 0) +\n    If(cell_4_3, 1, 0) +\n    If(cell_4_4, 1, 0) <=\n    1)",
        "Not(If(cell_2_3, 1, 0) +\n    If(cell_2_4, 1, 0) +\n    If(cell_3_2, 1, 0) +\n    If(cell_3_3, 1, 0) +\n    If(cell_3_4, 1, 0) +\n    If(cell_4_2, 1, 0) +\n    If(cell_4_3, 1, 0) +\n    If(cell_4_4, 1, 0) >=\n    1)",
        "Not(If(cell_4_0, 1, 0) +\n    If(cell_4_1, 1, 0) +\n    If(cell_4_2, 1, 0) +\n    If(cell_4_3, 1, 0) +\n    If(cell_4_4, 1, 0) >=\n    1)",
        "Not(If(cell_2_1, 1, 0) <= 0)",
        "Not(If(cell_0_0, 1, 0) +\n    If(cell_1_0, 1, 0) +\n    If(cell_2_0, 1, 0) +\n    If(cell_3_0, 1, 0) +\n    If(cell_4_0, 1, 0) <=\n    1)",
        "Not(If(cell_0_0, 1, 0) +\n    If(cell_1_0, 1, 0) +\n    If(cell_2_0, 1, 0) +\n    If(cell_3_0, 1, 0) +\n    If(cell_4_0, 1, 0) >=\n    1)",
        "Not(If(cell_2_1, 1, 0) >= 0)",
        "Not(0 == If(cell_4_1, 1, 0))"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(0 == If(cell_2_3, 1, 0))",
        "If(cell_2_3, 1, 0) >= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(0 == If(cell_2_3, 1, 0))",
        "If(cell_2_3, 1, 0) <= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(0 == If(cell_0_1, 1, 0))",
        "If(cell_0_1, 1, 0) >= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(0 == If(cell_0_1, 1, 0))",
        "If(cell_0_1, 1, 0) <= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "0 == If(cell_2_0, 1, 0)",
        "Not(If(cell_0_0, 1, 0) +\n    If(cell_0_1, 1, 0) +\n    If(cell_0_2, 1, 0) <=\n    0)",
        "Not(If(cell_0_0, 1, 0) +\n    If(cell_0_1, 1, 0) +\n    If(cell_0_2, 1, 0) >=\n    0)",
        "Not(If(cell_1_0, 1, 0) +\n    If(cell_1_1, 1, 0) +\n    If(cell_1_2, 1, 0) <=\n    1)",
        "Not(If(cell_1_0, 1, 0) +\n    If(cell_1_1, 1, 0) +\n    If(cell_1_2, 1, 0) >=\n    1)",
        "Not(If(cell_0_0, 1, 0) +\n    If(cell_0_1, 1, 0) +\n    If(cell_1_0, 1, 0) +\n    If(cell_2_0, 1, 0) +\n    If(cell_3_0, 1, 0) <=\n    1)",
        "Not(If(cell_3_0, 1, 0) <= 0)",
        "Not(If(cell_0_0, 1, 0) +\n    If(cell_0_1, 1, 0) +\n    If(cell_1_0, 1, 0) +\n    If(cell_2_0, 1, 0) +\n    If(cell_3_0, 1, 0) >=\n    1)",
        "Not(If(cell_3_0, 1, 0) >= 0)",
        "Not(If(cell_0_2, 1, 0) +\n    If(cell_1_1, 1, 0) +\n    If(cell_1_2, 1, 0) +\n    If(cell_2_2, 1, 0) <=\n    1)",
        "Not(If(cell_0_2, 1, 0) +\n    If(cell_1_1, 1, 0) +\n    If(cell_1_2, 1, 0) +\n    If(cell_2_2, 1, 0) >=\n    1)",
        "Not(If(cell_2_2, 1, 0) <= 0)",
        "Not(If(cell_2_2, 1, 0) >= 0)",
        "Not(If(cell_0_1, 1, 0) +\n    If(cell_1_1, 1, 0) +\n    If(cell_2_1, 1, 0) +\n    If(cell_3_1, 1, 0) +\n    If(cell_4_1, 1, 0) <=\n    1)",
        "Not(If(cell_0_1, 1, 0) +\n    If(cell_1_1, 1, 0) +\n    If(cell_2_1, 1, 0) +\n    If(cell_3_1, 1, 0) +\n    If(cell_4_1, 1, 0) >=\n    1)",
        "Not(If(cell_1_0, 1, 0) <= 0)",
        "Not(If(cell_1_0, 1, 0) >= 0)",
        "Not(If(cell_0_0, 1, 0) +\n    If(cell_0_1, 1, 0) +\n    If(cell_0_2, 1, 0) <=\n    0)",
        "Not(If(cell_0_0, 1, 0) +\n    If(cell_0_1, 1, 0) +\n    If(cell_0_2, 1, 0) >=\n    0)",
        "Not(If(cell_1_0, 1, 0) +\n    If(cell_1_1, 1, 0) +\n    If(cell_1_2, 1, 0) <=\n    1)",
        "Not(If(cell_1_0, 1, 0) +\n    If(cell_1_1, 1, 0) +\n    If(cell_1_2, 1, 0) >=\n    1)",
        "Not(If(cell_2_0, 1, 0) +\n    If(cell_2_1, 1, 0) +\n    If(cell_2_2, 1, 0) +\n    If(cell_2_3, 1, 0) +\n    If(cell_2_4, 1, 0) <=\n    1)",
        "Not(If(cell_2_0, 1, 0) +\n    If(cell_2_1, 1, 0) +\n    If(cell_2_2, 1, 0) +\n    If(cell_2_3, 1, 0) +\n    If(cell_2_4, 1, 0) >=\n    1)",
        "Not(If(cell_3_0, 1, 0) +\n    If(cell_3_1, 1, 0) +\n    If(cell_3_2, 1, 0) +\n    If(cell_3_3, 1, 0) +\n    If(cell_3_4, 1, 0) <=\n    1)",
        "Not(If(cell_0_2, 1, 0) +\n    If(cell_1_1, 1, 0) +\n    If(cell_1_2, 1, 0) +\n    If(cell_2_2, 1, 0) <=\n    1)",
        "Not(If(cell_3_0, 1, 0) +\n    If(cell_3_1, 1, 0) +\n    If(cell_3_2, 1, 0) +\n    If(cell_3_3, 1, 0) +\n    If(cell_3_4, 1, 0) >=\n    1)",
        "Not(If(cell_0_2, 1, 0) +\n    If(cell_1_1, 1, 0) +\n    If(cell_1_2, 1, 0) +\n    If(cell_2_2, 1, 0) >=\n    1)",
        "Not(If(cell_2_3, 1, 0) +\n    If(cell_2_4, 1, 0) +\n    If(cell_3_2, 1, 0) +\n    If(cell_3_3, 1, 0) +\n    If(cell_3_4, 1, 0) +\n    If(cell_4_2, 1, 0) +\n    If(cell_4_3, 1, 0) +\n    If(cell_4_4, 1, 0) <=\n    1)",
        "Not(If(cell_4_0, 1, 0) +\n    If(cell_4_1, 1, 0) +\n    If(cell_4_2, 1, 0) +\n    If(cell_4_3, 1, 0) +\n    If(cell_4_4, 1, 0) <=\n    1)",
        "Not(If(cell_2_3, 1, 0) +\n    If(cell_2_4, 1, 0) +\n    If(cell_3_2, 1, 0) +\n    If(cell_3_3, 1, 0) +\n    If(cell_3_4, 1, 0) +\n    If(cell_4_2, 1, 0) +\n    If(cell_4_3, 1, 0) +\n    If(cell_4_4, 1, 0) >=\n    1)",
        "Not(If(cell_4_0, 1, 0) +\n    If(cell_4_1, 1, 0) +\n    If(cell_4_2, 1, 0) +\n    If(cell_4_3, 1, 0) +\n    If(cell_4_4, 1, 0) >=\n    1)",
        "Not(If(cell_0_0, 1, 0) +\n    If(cell_1_0, 1, 0) +\n    If(cell_2_0, 1, 0) +\n    If(cell_3_0, 1, 0) +\n    If(cell_4_0, 1, 0) <=\n    1)",
        "Not(If(cell_0_0, 1, 0) +\n    If(cell_1_0, 1, 0) +\n    If(cell_2_0, 1, 0) +\n    If(cell_3_0, 1, 0) +\n    If(cell_4_0, 1, 0) >=\n    1)",
        "Not(0 == If(cell_1_2, 1, 0))"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "0 == If(cell_2_0, 1, 0)",
        "Not(1 == If(cell_3_0, 1, 0))"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(0 == If(cell_1_0, 1, 0))",
        "If(cell_1_0, 1, 0) >= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(0 == If(cell_1_0, 1, 0))",
        "If(cell_1_0, 1, 0) <= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(0 == If(cell_2_1, 1, 0))",
        "If(cell_2_1, 1, 0) >= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(0 == If(cell_2_1, 1, 0))",
        "If(cell_2_1, 1, 0) <= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_4_1, 1, 0) >= 0",
        "If(cell_4_1, 1, 0) <= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_4_1, 1, 0) <= 0",
        "If(cell_4_1, 1, 0) >= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_2_3, 1, 0) >= 0",
        "If(cell_2_3, 1, 0) <= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_2_3, 1, 0) <= 0",
        "If(cell_2_3, 1, 0) >= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_4_2, 1, 0) <= 0",
        "If(cell_4_2, 1, 0) >= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_4_2, 1, 0) >= 0",
        "If(cell_4_2, 1, 0) <= 0"
      ]
    },
    {
      "proof": "rup",
      "dependencies": [],
      "clause": [
        "0 == If(cell_2_0, 1, 0)",
        "cell_2_2"
      ]
    },
    {
      "proof": "rup",
      "dependencies": [],
      "clause": [
        "0 == If(cell_2_0, 1, 0)",
        "cell_2_2"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(0 == If(cell_2_0, 1, 0))",
        "Not(If(cell_0_0, 1, 0) +\n    If(cell_0_1, 1, 0) +\n    If(cell_0_2, 1, 0) <=\n    0)",
        "Not(If(cell_0_0, 1, 0) +\n    If(cell_0_1, 1, 0) +\n    If(cell_0_2, 1, 0) >=\n    0)",
        "Not(If(cell_1_0, 1, 0) +\n    If(cell_1_1, 1, 0) +\n    If(cell_1_2, 1, 0) <=\n    1)",
        "Not(If(cell_1_0, 1, 0) +\n    If(cell_1_1, 1, 0) +\n    If(cell_1_2, 1, 0) >=\n    1)",
        "Not(If(cell_0_0, 1, 0) +\n    If(cell_0_1, 1, 0) +\n    If(cell_1_0, 1, 0) +\n    If(cell_2_0, 1, 0) +\n    If(cell_3_0, 1, 0) <=\n    1)",
        "Not(If(cell_3_0, 1, 0) <= 0)",
        "Not(If(cell_0_0, 1, 0) +\n    If(cell_0_1, 1, 0) +\n    If(cell_1_0, 1, 0) +\n    If(cell_2_0, 1, 0) +\n    If(cell_3_0, 1, 0) >=\n    1)",
        "Not(If(cell_3_0, 1, 0) >= 0)",
        "Not(If(cell_0_2, 1, 0) +\n    If(cell_1_1, 1, 0) +\n    If(cell_1_2, 1, 0) +\n    If(cell_2_2, 1, 0) <=\n    1)",
        "Not(If(cell_0_2, 1, 0) +\n    If(cell_1_1, 1, 0) +\n    If(cell_1_2, 1, 0) +\n    If(cell_2_2, 1, 0) >=\n    1)",
        "Not(If(cell_2_2, 1, 0) <= 0)",
        "Not(If(cell_2_2, 1, 0) >= 0)",
        "False"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(0 == If(cell_2_2, 1, 0))",
        "If(cell_2_2, 1, 0) >= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(0 == If(cell_2_2, 1, 0))",
        "If(cell_2_2, 1, 0) <= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_2_2, 1, 0) >= 0",
        "If(cell_2_2, 1, 0) <= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_2_2, 1, 0) <= 0",
        "If(cell_2_2, 1, 0) >= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_4_1, 1, 0) >= 0",
        "If(cell_4_1, 1, 0) <= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_4_1, 1, 0) <= 0",
        "If(cell_4_1, 1, 0) >= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_2_3, 1, 0) >= 0",
        "If(cell_2_3, 1, 0) <= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_2_3, 1, 0) <= 0",
        "If(cell_2_3, 1, 0) >= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_4_2, 1, 0) <= 0",
        "If(cell_4_2, 1, 0) >= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_4_2, 1, 0) >= 0",
        "If(cell_4_2, 1, 0) <= 0"
      ]
    },
    {
      "proof": "rup",
      "dependencies": [],
      "clause": [
        "cell_2_2"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_2_2, 1, 0) <= 1",
        "If(cell_2_2, 1, 0) >= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_2_2, 1, 0) >= 0",
        "If(cell_2_2, 1, 0) <= 1"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_2_2, 1, 0) <= 1",
        "Not(If(cell_2_2, 1, 0) <= 0)"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(If(cell_2_2, 1, 0) <= 0)",
        "If(cell_2_2, 1, 0) <= 1"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(If(cell_2_2, 1, 0) >= 1)",
        "If(cell_2_2, 1, 0) >= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_2_2, 1, 0) >= 0",
        "Not(If(cell_2_2, 1, 0) >= 1)"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(If(cell_2_2, 1, 0) >= 1)",
        "Not(If(cell_2_2, 1, 0) <= 0)"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(If(cell_2_2, 1, 0) <= 0)",
        "Not(If(cell_2_2, 1, 0) >= 1)"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_2_2, 1, 0) >= 1",
        "If(cell_2_2, 1, 0) <= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_2_2, 1, 0) <= 0",
        "If(cell_2_2, 1, 0) >= 1"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_2_2, 1, 0) >= 1",
        "If(cell_2_2, 1, 0) <= 1"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_2_2, 1, 0) <= 1",
        "If(cell_2_2, 1, 0) >= 1"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(1 == If(cell_2_2, 1, 0))",
        "If(cell_2_2, 1, 0) <= 1"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(1 == If(cell_2_2, 1, 0))",
        "If(cell_2_2, 1, 0) >= 1"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "1 == If(cell_2_2, 1, 0)",
        "Not(If(cell_2_2, 1, 0) <= 1)",
        "Not(If(cell_2_2, 1, 0) >= 1)"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(0 == If(cell_3_3, 1, 0))",
        "If(cell_3_3, 1, 0) <= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(0 == If(cell_3_3, 1, 0))",
        "If(cell_3_3, 1, 0) >= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "0 == If(cell_3_3, 1, 0)",
        "Not(If(cell_3_3, 1, 0) <= 0)",
        "Not(If(cell_3_3, 1, 0) >= 0)"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(0 == If(cell_2_3, 1, 0))",
        "If(cell_2_3, 1, 0) <= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(0 == If(cell_2_3, 1, 0))",
        "If(cell_2_3, 1, 0) >= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "0 == If(cell_2_3, 1, 0)",
        "Not(If(cell_2_3, 1, 0) <= 0)",
        "Not(If(cell_2_3, 1, 0) >= 0)"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_3_2, 1, 0) >= 0",
        "If(cell_3_2, 1, 0) <= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_3_2, 1, 0) <= 0",
        "If(cell_3_2, 1, 0) >= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(0 == If(cell_3_2, 1, 0))",
        "If(cell_3_2, 1, 0) <= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(0 == If(cell_3_2, 1, 0))",
        "If(cell_3_2, 1, 0) >= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "0 == If(cell_3_2, 1, 0)",
        "Not(If(cell_3_2, 1, 0) <= 0)",
        "Not(If(cell_3_2, 1, 0) >= 0)"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_2_1, 1, 0) >= 0",
        "If(cell_2_1, 1, 0) <= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_2_1, 1, 0) <= 0",
        "If(cell_2_1, 1, 0) >= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(0 == If(cell_2_1, 1, 0))",
        "If(cell_2_1, 1, 0) <= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(0 == If(cell_2_1, 1, 0))",
        "If(cell_2_1, 1, 0) >= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "0 == If(cell_2_1, 1, 0)",
        "Not(If(cell_2_1, 1, 0) <= 0)",
        "Not(If(cell_2_1, 1, 0) >= 0)"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_1_2, 1, 0) >= 0",
        "If(cell_1_2, 1, 0) <= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_1_2, 1, 0) <= 0",
        "If(cell_1_2, 1, 0) >= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(0 == If(cell_1_2, 1, 0))",
        "If(cell_1_2, 1, 0) <= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(0 == If(cell_1_2, 1, 0))",
        "If(cell_1_2, 1, 0) >= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "0 == If(cell_1_2, 1, 0)",
        "Not(If(cell_1_2, 1, 0) <= 0)",
        "Not(If(cell_1_2, 1, 0) >= 0)"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_1_1, 1, 0) >= 0",
        "If(cell_1_1, 1, 0) <= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "If(cell_1_1, 1, 0) <= 0",
        "If(cell_1_1, 1, 0) >= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(0 == If(cell_1_1, 1, 0))",
        "If(cell_1_1, 1, 0) <= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(0 == If(cell_1_1, 1, 0))",
        "If(cell_1_1, 1, 0) >= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "0 == If(cell_1_1, 1, 0)",
        "Not(If(cell_1_1, 1, 0) <= 0)",
        "Not(If(cell_1_1, 1, 0) >= 0)"
      ]
    },
    {
      "proof": "del",
      "dependencies": [],
      "clause": [
        "cell_3_4",
        "Not(cell_3_3)",
        "cell_0_1",
        "Not(cell_1_2)",
        "cell_1_0",
        "cell_1_1",
        "cell_4_0",
        "Not(cell_2_0)",
        "cell_2_1",
        "cell_2_2",
        "cell_2_3",
        "cell_0_0",
        "cell_3_2",
        "cell_2_4",
        "cell_4_4",
        "cell_0_2",
        "Not(cell_4_1)",
        "cell_4_2",
        "cell_4_3"
      ]
    },
    {
      "proof": "rup",
      "dependencies": [],
      "clause": [
        "Not(If(cell_3_4, 1, 0) <= 0)",
        "Not(cell_4_1)"
      ]
    },
    {
      "proof": "del",
      "dependencies": [],
      "clause": [
        "Not(If(cell_3_4, 1, 0) <= 0)",
        "Not(cell_4_1)",
        "Not(If(cell_3_3, 1, 0) <= 0)",
        "Not(If(cell_4_2, 1, 0) >= 0)"
      ]
    },
    {
      "proof": "del",
      "dependencies": [],
      "clause": [
        "Not(cell_4_3)",
        "1 == If(cell_2_0, 1, 0)"
      ]
    },
    {
      "proof": "del",
      "dependencies": [],
      "clause": [
        "Not(If(cell_4_3, 1, 0) <= 0)",
        "Not(cell_2_2)"
      ]
    },
    {
      "proof": "del",
      "dependencies": [],
      "clause": [
        "0 == If(cell_3_3, 1, 0)",
        "Not(cell_2_0)",
        "cell_2_2"
      ]
    },
    {
      "proof": "rup",
      "dependencies": [],
      "clause": [
        "Not(0 == If(cell_4_0, 1, 0))",
        "Not(If(cell_4_1, 1, 0) <= 0)",
        "Not(If(cell_4_1, 1, 0) >= 0)",
        "Not(If(cell_2_2, 1, 0) <= 0)",
        "0 == If(cell_2_0, 1, 0)"
      ]
    },
    {
      "proof": "del",
      "dependencies": [],
      "clause": [
        "Not(0 == If(cell_4_0, 1, 0))",
        "Not(If(cell_4_1, 1, 0) <= 0)",
        "Not(If(cell_4_1, 1, 0) >= 0)",
        "Not(If(cell_2_2, 1, 0) <= 0)",
        "0 == If(cell_2_0, 1, 0)",
        "Not(If(cell_2_2, 1, 0) >= 0)"
      ]
    },
    {
      "proof": "del",
      "dependencies": [],
      "clause": [
        "Not(0 == If(cell_4_0, 1, 0))",
        "Not(If(cell_4_1, 1, 0) <= 0)",
        "Not(If(cell_4_1, 1, 0) >= 0)",
        "Not(If(cell_2_2, 1, 0) <= 0)",
        "0 == If(cell_2_0, 1, 0)"
      ]
    },
    {
      "proof": "del",
      "dependencies": [],
      "clause": [
        "0 == If(cell_0_1, 1, 0)",
        "Not(If(cell_2_2, 1, 0) <= 0)",
        "Not(If(cell_2_2, 1, 0) >= 0)",
        "0 == If(cell_2_0, 1, 0)"
      ]
    },
    {
      "proof": "del",
      "dependencies": [],
      "clause": [
        "1 == If(cell_3_0, 1, 0)",
        "Not(If(cell_4_2, 1, 0) <= 0)",
        "Not(0 == If(cell_3_3, 1, 0))",
        "Not(If(cell_2_3, 1, 0) >= 0)",
        "Not(If(cell_3_3, 1, 0) <= 0)",
        "Not(If(cell_2_3, 1, 0) <= 0)",
        "Not(If(cell_4_2, 1, 0) >= 0)"
      ]
    },
    {
      "proof": "del",
      "dependencies": [],
      "clause": [
        "0 == If(cell_2_0, 1, 0)",
        "cell_2_2"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(0 == If(cell_4_1, 1, 0))",
        "If(cell_4_1, 1, 0) <= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(0 == If(cell_4_1, 1, 0))",
        "If(cell_4_1, 1, 0) >= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "0 == If(cell_4_1, 1, 0)",
        "Not(If(cell_4_1, 1, 0) <= 0)",
        "Not(If(cell_4_1, 1, 0) >= 0)"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(0 == If(cell_4_2, 1, 0))",
        "If(cell_4_2, 1, 0) <= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(0 == If(cell_4_2, 1, 0))",
        "If(cell_4_2, 1, 0) >= 0"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "0 == If(cell_4_2, 1, 0)",
        "Not(If(cell_4_2, 1, 0) <= 0)",
        "Not(If(cell_4_2, 1, 0) >= 0)"
      ]
    },
    {
      "proof": "smt",
      "dependencies": [],
      "clause": [
        "Not(0 == If(cell_3_4, 1, 0))",
        "Not(If(cell_4_2, 1, 0) >= 0)",
        "Not(If(cell_3_3, 1, 0) <= 0)",
        "Not(If(cell_0_0, 1, 0) +\n    If(cell_0_1, 1, 0) +\n    If(cell_0_2, 1, 0) <=\n    0)",
        "Not(If(cell_0_0, 1, 0) +\n    If(cell_0_1, 1, 0) +\n    If(cell_0_2, 1, 0) >=\n    0)",
        "Not(If(cell_1_0, 1, 0) +\n    If(cell_1_1, 1, 0) +\n    If(cell_1_2, 1, 0) <=\n    1)",
        "Not(If(cell_3_3, 1, 0) >= 0)",
        "Not(If(cell_1_0, 1, 0) +\n    If(cell_1_1, 1, 0) +\n    If(cell_1_2, 1, 0) >=\n    1)",
        "Not(If(cell_2_0, 1, 0) +\n    If(cell_2_1, 1, 0) +\n    If(cell_2_2, 1, 0) +\n    If(cell_2_3, 1, 0) +\n    If(cell_2_4, 1, 0) <=\n    1)",
        "Not(If(cell_3_0, 1, 0) <= 0)",
        "Not(If(cell_2_0, 1, 0) +\n    If(cell_2_1, 1, 0) +\n    If(cell_2_2, 1, 0) +\n    If(cell_2_3, 1, 0) +\n    If(cell_2_4, 1, 0) >=\n    1)",
        "Not(If(cell_3_0, 1, 0) >= 0)",
        "Not(If(cell_3_0, 1, 0) +\n    If(cell_3_1, 1, 0) +\n    If(cell_3_2, 1, 0) +\n    If(cell_3_3, 1, 0) +\n    If(cell_3_4, 1, 0) <=\n    1)",
        "Not(If(cell_3_1, 1, 0) <= 0)",
        "Not(If(cell_3_0, 1, 0) +\n    If(cell_3_1, 1, 0) +\n    If(cell_3_2, 1, 0) +\n    If(cell_3_3, 1, 0) +\n    If(cell_3_4, 1, 0) >=\n    1)",
        "Not(If(cell_3_1, 1, 0) >= 0)",
        "Not(If(cell_4_0, 1, 0) +\n    If(cell_4_1, 1, 0) +\n    If(cell_4_2, 1, 0) +\n    If(cell_4_3, 1, 0) +\n    If(cell_4_4, 1, 0) <=\n    1)",
        "Not(If(cell_4_0, 1, 0) +\n    If(cell_4_1, 1, 0) +\n    If(cell_4_2, 1, 0) +\n    If(cell_4_3, 1, 0) +\n    If(cell_4_4, 1, 0) >=\n    1)",
        "Not(If(cell_0_0, 1, 0) +\n    If(cell_1_0, 1, 0) +\n    If(cell_2_0, 1, 0) +\n    If(cell_3_0, 1, 0) +\n    If(cell_4_0, 1, 0) <=\n    1)",
        "Not(If(cell_0_0, 1, 0) +\n    If(cell_1_0, 1, 0) +\n    If(cell_2_0, 1, 0) +\n    If(cell_3_0, 1, 0) +\n    If(cell_4_0, 1, 0) >=\n    1)",
        "Not(If(cell_0_1, 1, 0) +\n    If(cell_1_1, 1, 0) +\n    If(cell_2_1, 1, 0) +\n    If(cell_3_1, 1, 0) +\n    If(cell_4_1, 1, 0) <=\n    1)",
        "Not(If(cell_0_1, 1, 0) +\n    If(cell_1_1, 1, 0) +\n    If(cell_2_1, 1, 0) +\n    If(cell_3_1, 1, 0) +\n    If(cell_4_1, 1, 0) >=\n    1)",
        "Not(If(cell_4_2, 1, 0) <= 0)",
        "Not(If(cell_0_2, 1, 0) +\n    If(cell_1_2, 1, 0) +\n    If(cell_2_2, 1, 0) +\n    If(cell_3_2, 1, 0) +\n    If(cell_4_2, 1, 0) <=\n    1)",
        "Not(If(cell_0_2, 1, 0) +\n    If(cell_1_2, 1, 0) +\n    If(cell_2_2, 1, 0) +\n    If(cell_3_2, 1, 0) +\n    If(cell_4_2, 1, 0) >=\n    1)",
        "Not(If(cell_2_3, 1, 0) +\n    If(cell_2_4, 1, 0) +\n    If(cell_3_2, 1, 0) +\n    If(cell_3_3, 1, 0) +\n    If(cell_3_4, 1, 0) +\n    If(cell_4_2, 1, 0) +\n    If(cell_4_3, 1, 0) +\n    If(cell_4_4, 1, 0) <=\n    1)",
        "Not(If(cell_2_3, 1, 0) +\n    If(cell_2_4, 1, 0) +\n    If(cell_3_2, 1, 0) +\n    If(cell_3_3, 1, 0) +\n    If(cell_3_4, 1, 0) +\n    If(cell_4_2, 1, 0) +\n    If(cell_4_3, 1, 0) +\n    If(cell_4_4, 1, 0) >=\n    1)",
        "False"
      ]
    },
    {
      "proof": "rup",
      "dependencies": [],
      "clause": [
        "Not(0 == If(cell_3_4, 1, 0))"
      ]
    }
  ],
  "diagnostic_tactics": {
    "simplify": "[[If(cell_0_0, 1, 0) +\n  If(cell_0_1, 1, 0) +\n  If(cell_0_2, 1, 0) +\n  If(cell_0_3, 1, 0) +\n  If(cell_0_4, 1, 0) ==\n  1,\n  If(cell_1_0, 1, 0) +\n  If(cell_1_1, 1, 0) +\n  If(cell_1_2, 1, 0) +\n  If(cell_1_3, 1, 0) +\n  If(cell_1_4, 1, 0) ==\n  1,\n  If(cell_2_0, 1, 0) +\n  If(cell_2_1, 1, 0) +\n  If(cell_2_2, 1, 0) +\n  If(cell_2_3, 1, 0) +\n  If(cell_2_4, 1, 0) ==\n  1,\n  If(cell_3_0, 1, 0) +\n  If(cell_3_1, 1, 0) +\n  If(cell_3_2, 1, 0) +\n  If(cell_3_3, 1, 0) +\n  If(cell_3_4, 1, 0) ==\n  1,\n  If(cell_4_0, 1, 0) +\n  If(cell_4_1, 1, 0) +\n  If(cell_4_2, 1, 0) +\n  If(cell_4_3, 1, 0) +\n  If(cell_4_4, 1, 0) ==\n  1,\n  If(cell_0_0, 1, 0) +\n  If(cell_1_0, 1, 0) +\n  If(cell_2_0, 1, 0) +\n  If(cell_3_0, 1, 0) +\n  If(cell_4_0, 1, 0) ==\n  1,\n  If(cell_0_1, 1, 0) +\n  If(cell_1_1, 1, 0) +\n  If(cell_2_1, 1, 0) +\n  If(cell_3_1, 1, 0) +\n  If(cell_4_1, 1, 0) ==\n  1,\n  If(cell_0_2, 1, 0) +\n  If(cell_1_2, 1, 0) +\n  If(cell_2_2, 1, 0) +\n  If(cell_3_2, 1, 0) +\n  If(cell_4_2, 1, 0) ==\n  1,\n  If(cell_0_3, 1, 0) +\n  If(cell_1_3, 1, 0) +\n  If(cell_2_3, 1, 0) +\n  If(cell_3_3, 1, 0) +\n  If(cell_4_3, 1, 0) ==\n  1,\n  If(cell_0_4, 1, 0) +\n  If(cell_1_4, 1, 0) +\n  If(cell_2_4, 1, 0) +\n  If(cell_3_4, 1, 0) +\n  If(cell_4_4, 1, 0) ==\n  1,\n  If(cell_0_0, 1, 0) +\n  If(cell_0_1, 1, 0) +\n  If(cell_1_0, 1, 0) +\n  If(cell_2_0, 1, 0) +\n  If(cell_3_0, 1, 0) ==\n  1,\n  If(cell_0_2, 1, 0) +\n  If(cell_0_3, 1, 0) +\n  If(cell_1_1, 1, 0) +\n  If(cell_1_2, 1, 0) +\n  If(cell_2_2, 1, 0) ==\n  1,\n  cell_0_4,\n  If(cell_1_3, 1, 0) +\n  If(cell_1_4, 1, 0) +\n  If(cell_2_3, 1, 0) +\n  If(cell_2_4, 1, 0) +\n  If(cell_3_2, 1, 0) +\n  If(cell_3_3, 1, 0) +\n  If(cell_3_4, 1, 0) +\n  If(cell_4_2, 1, 0) +\n  If(cell_4_3, 1, 0) +\n  If(cell_4_4, 1, 0) ==\n  1,\n  If(cell_2_1, 1, 0) +\n  If(cell_3_1, 1, 0) +\n  If(cell_4_0, 1, 0) +\n  If(cell_4_1, 1, 0) ==\n  1,\n  Or(Not(cell_0_0), Not(cell_1_0)),\n  Or(Not(cell_0_0), Not(cell_0_1)),\n  Or(Not(cell_0_0), Not(cell_1_1)),\n  Or(Not(cell_0_1), Not(cell_1_1)),\n  Or(Not(cell_0_1), Not(cell_0_0)),\n  Or(Not(cell_0_1), Not(cell_0_2)),\n  Or(Not(cell_0_1), Not(cell_1_0)),\n  Or(Not(cell_0_1), Not(cell_1_2)),\n  Or(Not(cell_0_2), Not(cell_1_2)),\n  Or(Not(cell_0_2), Not(cell_0_3)),\n  Or(Not(cell_0_2), Not(cell_1_1)),\n  Or(Not(cell_0_2), Not(cell_1_3)),\n  Or(Not(cell_0_3), Not(cell_1_3)),\n  Or(Not(cell_0_3), Not(cell_0_4)),\n  Or(Not(cell_0_3), Not(cell_1_2)),\n  Or(Not(cell_0_3), Not(cell_1_4)),\n  Or(Not(cell_0_4), Not(cell_1_4)),\n  Or(Not(cell_0_4), Not(cell_1_3)),\n  Or(Not(cell_1_0), Not(cell_0_0)),\n  Or(Not(cell_1_0), Not(cell_2_0)),\n  Or(Not(cell_1_0), Not(cell_1_1)),\n  Or(Not(cell_1_0), Not(cell_0_1)),\n  Or(Not(cell_1_0), Not(cell_2_1)),\n  Or(Not(cell_1_1), Not(cell_2_1)),\n  Or(Not(cell_1_1), Not(cell_1_2)),\n  Or(Not(cell_1_1), Not(cell_0_0)),\n  Or(Not(cell_1_1), Not(cell_0_2)),\n  Or(Not(cell_1_1), Not(cell_2_0)),\n  Or(Not(cell_1_1), Not(cell_2_2)),\n  Or(Not(cell_1_2), Not(cell_2_2)),\n  Or(Not(cell_1_2), Not(cell_1_3)),\n  Or(Not(cell_1_2), Not(cell_0_3)),\n  Or(Not(cell_1_2), Not(cell_2_1)),\n  Or(Not(cell_1_2), Not(cell_2_3)),\n  Or(Not(cell_1_3), Not(cell_2_3)),\n  Or(Not(cell_1_3), Not(cell_1_4)),\n  Or(Not(cell_1_3), Not(cell_0_4)),\n  Or(Not(cell_1_3), Not(cell_2_2)),\n  Or(Not(cell_1_3), Not(cell_2_4)),\n  Or(Not(cell_1_4), Not(cell_2_4)),\n  Or(Not(cell_1_4), Not(cell_2_3)),\n  Or(Not(cell_2_0), Not(cell_3_0)),\n  Or(Not(cell_2_0), Not(cell_2_1)),\n  Or(Not(cell_2_0), Not(cell_3_1)),\n  Or(Not(cell_2_1), Not(cell_3_1)),\n  Or(Not(cell_2_1), Not(cell_2_2)),\n  Or(Not(cell_2_1), Not(cell_3_0)),\n  Or(Not(cell_2_1), Not(cell_3_2)),\n  Or(Not(cell_2_2), Not(cell_3_2)),\n  Or(Not(cell_2_2), Not(cell_2_3)),\n  Or(Not(cell_2_2), Not(cell_3_1)),\n  Or(Not(cell_2_2), Not(cell_3_3)),\n  Or(Not(cell_2_3), Not(cell_3_3)),\n  Or(Not(cell_2_3), Not(cell_2_4)),\n  Or(Not(cell_2_3), Not(cell_3_2)),\n  Or(Not(cell_2_3), Not(cell_3_4)),\n  Or(Not(cell_2_4), Not(cell_3_4)),\n  Or(Not(cell_2_4), Not(cell_3_3)),\n  Or(Not(cell_3_0), Not(cell_4_0)),\n  Or(Not(cell_3_0), Not(cell_3_1)),\n  Or(Not(cell_3_0), Not(cell_4_1)),\n  Or(Not(cell_3_1), Not(cell_4_1)),\n  Or(Not(cell_3_1), Not(cell_3_2)),\n  Or(Not(cell_3_1), Not(cell_4_0)),\n  Or(Not(cell_3_1), Not(cell_4_2)),\n  Or(Not(cell_3_2), Not(cell_4_2)),\n  Or(Not(cell_3_2), Not(cell_3_3)),\n  Or(Not(cell_3_2), Not(cell_4_1)),\n  Or(Not(cell_3_2), Not(cell_4_3)),\n  Or(Not(cell_3_3), Not(cell_4_3)),\n  Or(Not(cell_3_3), Not(cell_3_4)),\n  Or(Not(cell_3_3), Not(cell_4_2)),\n  Or(Not(cell_3_3), Not(cell_4_4)),\n  Or(Not(cell_3_4), Not(cell_4_4)),\n  Or(Not(cell_3_4), Not(cell_4_3)),\n  Or(Not(cell_4_0), Not(cell_4_1)),\n  Or(Not(cell_4_1), Not(cell_4_2)),\n  Or(Not(cell_4_2), Not(cell_4_3)),\n  Or(Not(cell_4_3), Not(cell_4_4))]]",
    "simplify+lia2card": "[[PbEq(((cell_0_0, 1),\n        (cell_0_1, 1),\n        (cell_0_2, 1),\n        (cell_0_3, 1),\n        (cell_0_4, 1)),\n       1),\n  PbEq(((cell_1_0, 1),\n        (cell_1_1, 1),\n        (cell_1_2, 1),\n        (cell_1_3, 1),\n        (cell_1_4, 1)),\n       1),\n  PbEq(((cell_2_0, 1),\n        (cell_2_1, 1),\n        (cell_2_2, 1),\n        (cell_2_3, 1),\n        (cell_2_4, 1)),\n       1),\n  PbEq(((cell_3_0, 1),\n        (cell_3_1, 1),\n        (cell_3_2, 1),\n        (cell_3_3, 1),\n        (cell_3_4, 1)),\n       1),\n  PbEq(((cell_4_0, 1),\n        (cell_4_1, 1),\n        (cell_4_2, 1),\n        (cell_4_3, 1),\n        (cell_4_4, 1)),\n       1),\n  PbEq(((cell_0_0, 1),\n        (cell_1_0, 1),\n        (cell_2_0, 1),\n        (cell_3_0, 1),\n        (cell_4_0, 1)),\n       1),\n  PbEq(((cell_0_1, 1),\n        (cell_1_1, 1),\n        (cell_2_1, 1),\n        (cell_3_1, 1),\n        (cell_4_1, 1)),\n       1),\n  PbEq(((cell_0_2, 1),\n        (cell_1_2, 1),\n        (cell_2_2, 1),\n        (cell_3_2, 1),\n        (cell_4_2, 1)),\n       1),\n  PbEq(((cell_0_3, 1),\n        (cell_1_3, 1),\n        (cell_2_3, 1),\n        (cell_3_3, 1),\n        (cell_4_3, 1)),\n       1),\n  PbEq(((cell_0_4, 1),\n        (cell_1_4, 1),\n        (cell_2_4, 1),\n        (cell_3_4, 1),\n        (cell_4_4, 1)),\n       1),\n  PbEq(((cell_0_0, 1),\n        (cell_0_1, 1),\n        (cell_1_0, 1),\n        (cell_2_0, 1),\n        (cell_3_0, 1)),\n       1),\n  PbEq(((cell_0_2, 1),\n        (cell_0_3, 1),\n        (cell_1_1, 1),\n        (cell_1_2, 1),\n        (cell_2_2, 1)),\n       1),\n  cell_0_4,\n  PbEq(((cell_1_3, 1),\n        (cell_1_4, 1),\n        (cell_2_3, 1),\n        (cell_2_4, 1),\n        (cell_3_2, 1),\n        (cell_3_3, 1),\n        (cell_3_4, 1),\n        (cell_4_2, 1),\n        (cell_4_3, 1),\n        (cell_4_4, 1)),\n       1),\n  PbEq(((cell_2_1, 1),\n        (cell_3_1, 1),\n        (cell_4_0, 1),\n        (cell_4_1, 1)),\n       1),\n  Or(Not(cell_0_0), Not(cell_1_0)),\n  Or(Not(cell_0_0), Not(cell_0_1)),\n  Or(Not(cell_0_0), Not(cell_1_1)),\n  Or(Not(cell_0_1), Not(cell_1_1)),\n  Or(Not(cell_0_1), Not(cell_0_0)),\n  Or(Not(cell_0_1), Not(cell_0_2)),\n  Or(Not(cell_0_1), Not(cell_1_0)),\n  Or(Not(cell_0_1), Not(cell_1_2)),\n  Or(Not(cell_0_2), Not(cell_1_2)),\n  Or(Not(cell_0_2), Not(cell_0_3)),\n  Or(Not(cell_0_2), Not(cell_1_1)),\n  Or(Not(cell_0_2), Not(cell_1_3)),\n  Or(Not(cell_0_3), Not(cell_1_3)),\n  Or(Not(cell_0_3), Not(cell_0_4)),\n  Or(Not(cell_0_3), Not(cell_1_2)),\n  Or(Not(cell_0_3), Not(cell_1_4)),\n  Or(Not(cell_0_4), Not(cell_1_4)),\n  Or(Not(cell_0_4), Not(cell_1_3)),\n  Or(Not(cell_1_0), Not(cell_0_0)),\n  Or(Not(cell_1_0), Not(cell_2_0)),\n  Or(Not(cell_1_0), Not(cell_1_1)),\n  Or(Not(cell_1_0), Not(cell_0_1)),\n  Or(Not(cell_1_0), Not(cell_2_1)),\n  Or(Not(cell_1_1), Not(cell_2_1)),\n  Or(Not(cell_1_1), Not(cell_1_2)),\n  Or(Not(cell_1_1), Not(cell_0_0)),\n  Or(Not(cell_1_1), Not(cell_0_2)),\n  Or(Not(cell_1_1), Not(cell_2_0)),\n  Or(Not(cell_1_1), Not(cell_2_2)),\n  Or(Not(cell_1_2), Not(cell_2_2)),\n  Or(Not(cell_1_2), Not(cell_1_3)),\n  Or(Not(cell_1_2), Not(cell_0_3)),\n  Or(Not(cell_1_2), Not(cell_2_1)),\n  Or(Not(cell_1_2), Not(cell_2_3)),\n  Or(Not(cell_1_3), Not(cell_2_3)),\n  Or(Not(cell_1_3), Not(cell_1_4)),\n  Or(Not(cell_1_3), Not(cell_0_4)),\n  Or(Not(cell_1_3), Not(cell_2_2)),\n  Or(Not(cell_1_3), Not(cell_2_4)),\n  Or(Not(cell_1_4), Not(cell_2_4)),\n  Or(Not(cell_1_4), Not(cell_2_3)),\n  Or(Not(cell_2_0), Not(cell_3_0)),\n  Or(Not(cell_2_0), Not(cell_2_1)),\n  Or(Not(cell_2_0), Not(cell_3_1)),\n  Or(Not(cell_2_1), Not(cell_3_1)),\n  Or(Not(cell_2_1), Not(cell_2_2)),\n  Or(Not(cell_2_1), Not(cell_3_0)),\n  Or(Not(cell_2_1), Not(cell_3_2)),\n  Or(Not(cell_2_2), Not(cell_3_2)),\n  Or(Not(cell_2_2), Not(cell_2_3)),\n  Or(Not(cell_2_2), Not(cell_3_1)),\n  Or(Not(cell_2_2), Not(cell_3_3)),\n  Or(Not(cell_2_3), Not(cell_3_3)),\n  Or(Not(cell_2_3), Not(cell_2_4)),\n  Or(Not(cell_2_3), Not(cell_3_2)),\n  Or(Not(cell_2_3), Not(cell_3_4)),\n  Or(Not(cell_2_4), Not(cell_3_4)),\n  Or(Not(cell_2_4), Not(cell_3_3)),\n  Or(Not(cell_3_0), Not(cell_4_0)),\n  Or(Not(cell_3_0), Not(cell_3_1)),\n  Or(Not(cell_3_0), Not(cell_4_1)),\n  Or(Not(cell_3_1), Not(cell_4_1)),\n  Or(Not(cell_3_1), Not(cell_3_2)),\n  Or(Not(cell_3_1), Not(cell_4_0)),\n  Or(Not(cell_3_1), Not(cell_4_2)),\n  Or(Not(cell_3_2), Not(cell_4_2)),\n  Or(Not(cell_3_2), Not(cell_3_3)),\n  Or(Not(cell_3_2), Not(cell_4_1)),\n  Or(Not(cell_3_2), Not(cell_4_3)),\n  Or(Not(cell_3_3), Not(cell_4_3)),\n  Or(Not(cell_3_3), Not(cell_3_4)),\n  Or(Not(cell_3_3), Not(cell_4_2)),\n  Or(Not(cell_3_3), Not(cell_4_4)),\n  Or(Not(cell_3_4), Not(cell_4_4)),\n  Or(Not(cell_3_4), Not(cell_4_3)),\n  Or(Not(cell_4_0), Not(cell_4_1)),\n  Or(Not(cell_4_1), Not(cell_4_2)),\n  Or(Not(cell_4_2), Not(cell_4_3)),\n  Or(Not(cell_4_3), Not(cell_4_4))]]",
    "simplify+lia2pb": "[[If(cell_0_0, 1, 0) +\n  If(cell_0_1, 1, 0) +\n  If(cell_0_2, 1, 0) +\n  If(cell_0_3, 1, 0) +\n  If(cell_0_4, 1, 0) ==\n  1,\n  If(cell_1_0, 1, 0) +\n  If(cell_1_1, 1, 0) +\n  If(cell_1_2, 1, 0) +\n  If(cell_1_3, 1, 0) +\n  If(cell_1_4, 1, 0) ==\n  1,\n  If(cell_2_0, 1, 0) +\n  If(cell_2_1, 1, 0) +\n  If(cell_2_2, 1, 0) +\n  If(cell_2_3, 1, 0) +\n  If(cell_2_4, 1, 0) ==\n  1,\n  If(cell_3_0, 1, 0) +\n  If(cell_3_1, 1, 0) +\n  If(cell_3_2, 1, 0) +\n  If(cell_3_3, 1, 0) +\n  If(cell_3_4, 1, 0) ==\n  1,\n  If(cell_4_0, 1, 0) +\n  If(cell_4_1, 1, 0) +\n  If(cell_4_2, 1, 0) +\n  If(cell_4_3, 1, 0) +\n  If(cell_4_4, 1, 0) ==\n  1,\n  If(cell_0_0, 1, 0) +\n  If(cell_1_0, 1, 0) +\n  If(cell_2_0, 1, 0) +\n  If(cell_3_0, 1, 0) +\n  If(cell_4_0, 1, 0) ==\n  1,\n  If(cell_0_1, 1, 0) +\n  If(cell_1_1, 1, 0) +\n  If(cell_2_1, 1, 0) +\n  If(cell_3_1, 1, 0) +\n  If(cell_4_1, 1, 0) ==\n  1,\n  If(cell_0_2, 1, 0) +\n  If(cell_1_2, 1, 0) +\n  If(cell_2_2, 1, 0) +\n  If(cell_3_2, 1, 0) +\n  If(cell_4_2, 1, 0) ==\n  1,\n  If(cell_0_3, 1, 0) +\n  If(cell_1_3, 1, 0) +\n  If(cell_2_3, 1, 0) +\n  If(cell_3_3, 1, 0) +\n  If(cell_4_3, 1, 0) ==\n  1,\n  If(cell_0_4, 1, 0) +\n  If(cell_1_4, 1, 0) +\n  If(cell_2_4, 1, 0) +\n  If(cell_3_4, 1, 0) +\n  If(cell_4_4, 1, 0) ==\n  1,\n  If(cell_0_0, 1, 0) +\n  If(cell_0_1, 1, 0) +\n  If(cell_1_0, 1, 0) +\n  If(cell_2_0, 1, 0) +\n  If(cell_3_0, 1, 0) ==\n  1,\n  If(cell_0_2, 1, 0) +\n  If(cell_0_3, 1, 0) +\n  If(cell_1_1, 1, 0) +\n  If(cell_1_2, 1, 0) +\n  If(cell_2_2, 1, 0) ==\n  1,\n  cell_0_4,\n  If(cell_1_3, 1, 0) +\n  If(cell_1_4, 1, 0) +\n  If(cell_2_3, 1, 0) +\n  If(cell_2_4, 1, 0) +\n  If(cell_3_2, 1, 0) +\n  If(cell_3_3, 1, 0) +\n  If(cell_3_4, 1, 0) +\n  If(cell_4_2, 1, 0) +\n  If(cell_4_3, 1, 0) +\n  If(cell_4_4, 1, 0) ==\n  1,\n  If(cell_2_1, 1, 0) +\n  If(cell_3_1, 1, 0) +\n  If(cell_4_0, 1, 0) +\n  If(cell_4_1, 1, 0) ==\n  1,\n  Or(Not(cell_0_0), Not(cell_1_0)),\n  Or(Not(cell_0_0), Not(cell_0_1)),\n  Or(Not(cell_0_0), Not(cell_1_1)),\n  Or(Not(cell_0_1), Not(cell_1_1)),\n  Or(Not(cell_0_1), Not(cell_0_0)),\n  Or(Not(cell_0_1), Not(cell_0_2)),\n  Or(Not(cell_0_1), Not(cell_1_0)),\n  Or(Not(cell_0_1), Not(cell_1_2)),\n  Or(Not(cell_0_2), Not(cell_1_2)),\n  Or(Not(cell_0_2), Not(cell_0_3)),\n  Or(Not(cell_0_2), Not(cell_1_1)),\n  Or(Not(cell_0_2), Not(cell_1_3)),\n  Or(Not(cell_0_3), Not(cell_1_3)),\n  Or(Not(cell_0_3), Not(cell_0_4)),\n  Or(Not(cell_0_3), Not(cell_1_2)),\n  Or(Not(cell_0_3), Not(cell_1_4)),\n  Or(Not(cell_0_4), Not(cell_1_4)),\n  Or(Not(cell_0_4), Not(cell_1_3)),\n  Or(Not(cell_1_0), Not(cell_0_0)),\n  Or(Not(cell_1_0), Not(cell_2_0)),\n  Or(Not(cell_1_0), Not(cell_1_1)),\n  Or(Not(cell_1_0), Not(cell_0_1)),\n  Or(Not(cell_1_0), Not(cell_2_1)),\n  Or(Not(cell_1_1), Not(cell_2_1)),\n  Or(Not(cell_1_1), Not(cell_1_2)),\n  Or(Not(cell_1_1), Not(cell_0_0)),\n  Or(Not(cell_1_1), Not(cell_0_2)),\n  Or(Not(cell_1_1), Not(cell_2_0)),\n  Or(Not(cell_1_1), Not(cell_2_2)),\n  Or(Not(cell_1_2), Not(cell_2_2)),\n  Or(Not(cell_1_2), Not(cell_1_3)),\n  Or(Not(cell_1_2), Not(cell_0_3)),\n  Or(Not(cell_1_2), Not(cell_2_1)),\n  Or(Not(cell_1_2), Not(cell_2_3)),\n  Or(Not(cell_1_3), Not(cell_2_3)),\n  Or(Not(cell_1_3), Not(cell_1_4)),\n  Or(Not(cell_1_3), Not(cell_0_4)),\n  Or(Not(cell_1_3), Not(cell_2_2)),\n  Or(Not(cell_1_3), Not(cell_2_4)),\n  Or(Not(cell_1_4), Not(cell_2_4)),\n  Or(Not(cell_1_4), Not(cell_2_3)),\n  Or(Not(cell_2_0), Not(cell_3_0)),\n  Or(Not(cell_2_0), Not(cell_2_1)),\n  Or(Not(cell_2_0), Not(cell_3_1)),\n  Or(Not(cell_2_1), Not(cell_3_1)),\n  Or(Not(cell_2_1), Not(cell_2_2)),\n  Or(Not(cell_2_1), Not(cell_3_0)),\n  Or(Not(cell_2_1), Not(cell_3_2)),\n  Or(Not(cell_2_2), Not(cell_3_2)),\n  Or(Not(cell_2_2), Not(cell_2_3)),\n  Or(Not(cell_2_2), Not(cell_3_1)),\n  Or(Not(cell_2_2), Not(cell_3_3)),\n  Or(Not(cell_2_3), Not(cell_3_3)),\n  Or(Not(cell_2_3), Not(cell_2_4)),\n  Or(Not(cell_2_3), Not(cell_3_2)),\n  Or(Not(cell_2_3), Not(cell_3_4)),\n  Or(Not(cell_2_4), Not(cell_3_4)),\n  Or(Not(cell_2_4), Not(cell_3_3)),\n  Or(Not(cell_3_0), Not(cell_4_0)),\n  Or(Not(cell_3_0), Not(cell_3_1)),\n  Or(Not(cell_3_0), Not(cell_4_1)),\n  Or(Not(cell_3_1), Not(cell_4_1)),\n  Or(Not(cell_3_1), Not(cell_3_2)),\n  Or(Not(cell_3_1), Not(cell_4_0)),\n  Or(Not(cell_3_1), Not(cell_4_2)),\n  Or(Not(cell_3_2), Not(cell_4_2)),\n  Or(Not(cell_3_2), Not(cell_3_3)),\n  Or(Not(cell_3_2), Not(cell_4_1)),\n  Or(Not(cell_3_2), Not(cell_4_3)),\n  Or(Not(cell_3_3), Not(cell_4_3)),\n  Or(Not(cell_3_3), Not(cell_3_4)),\n  Or(Not(cell_3_3), Not(cell_4_2)),\n  Or(Not(cell_3_3), Not(cell_4_4)),\n  Or(Not(cell_3_4), Not(cell_4_4)),\n  Or(Not(cell_3_4), Not(cell_4_3)),\n  Or(Not(cell_4_0), Not(cell_4_1)),\n  Or(Not(cell_4_1), Not(cell_4_2)),\n  Or(Not(cell_4_2), Not(cell_4_3)),\n  Or(Not(cell_4_3), Not(cell_4_4))]]",
    "simplify+lia2pb+pb2bv": {
      "error": "b'goal is in a fragment not supported by pb2bv. Offending expression: (ite cell_0_0 1 0)'"
    },
    "simplify+card2bv": "[[Extract(1,\n          1,\n          ZeroExt(1, If(cell_0_0, 1, 0)) +\n          ZeroExt(1, If(cell_0_1, 1, 0))) ==\n  0,\n  Extract(1,\n          1,\n          ZeroExt(1, If(cell_1_0, 1, 0)) +\n          ZeroExt(1, If(cell_1_1, 1, 0))) ==\n  0,\n  Extract(1,\n          1,\n          ZeroExt(1, If(cell_2_0, 1, 0)) +\n          ZeroExt(1, If(cell_2_1, 1, 0))) ==\n  0,\n  Extract(1,\n          1,\n          ZeroExt(1, If(cell_3_0, 1, 0)) +\n          ZeroExt(1, If(cell_3_1, 1, 0))) ==\n  0,\n  Extract(1,\n          1,\n          ZeroExt(1, If(cell_4_0, 1, 0)) +\n          ZeroExt(1, If(cell_4_1, 1, 0))) ==\n  0,\n  Extract(1,\n          1,\n          ZeroExt(1, If(cell_0_0, 1, 0)) +\n          ZeroExt(1, If(cell_1_0, 1, 0))) ==\n  0,\n  Extract(1,\n          1,\n          ZeroExt(1, If(cell_0_1, 1, 0)) +\n          ZeroExt(1, If(cell_1_1, 1, 0))) ==\n  0,\n  Extract(1,\n          1,\n          ZeroExt(1, If(cell_0_2, 1, 0)) +\n          ZeroExt(1, If(cell_1_2, 1, 0))) ==\n  0,\n  Extract(1,\n          1,\n          ZeroExt(1, If(cell_0_3, 1, 0)) +\n          ZeroExt(1, If(cell_1_3, 1, 0))) ==\n  0,\n  Extract(1,\n          1,\n          ZeroExt(1, If(cell_0_4, 1, 0)) +\n          ZeroExt(1, If(cell_1_4, 1, 0))) ==\n  0,\n  Extract(1,\n          1,\n          ZeroExt(1, If(cell_0_2, 1, 0)) +\n          ZeroExt(1, If(cell_0_3, 1, 0))) ==\n  0,\n  cell_0_4,\n  Extract(1,\n          1,\n          ZeroExt(1, If(cell_1_3, 1, 0)) +\n          ZeroExt(1, If(cell_1_4, 1, 0))) ==\n  0,\n  Extract(1,\n          1,\n          ZeroExt(1, If(cell_2_1, 1, 0)) +\n          ZeroExt(1, If(cell_3_1, 1, 0))) ==\n  0,\n  Or(Not(cell_0_0), Not(cell_1_0)),\n  Or(Not(cell_0_0), Not(cell_0_1)),\n  Or(Not(cell_0_0), Not(cell_1_1)),\n  Or(Not(cell_0_1), Not(cell_1_1)),\n  Or(Not(cell_0_1), Not(cell_0_0)),\n  Or(Not(cell_0_1), Not(cell_0_2)),\n  Or(Not(cell_0_1), Not(cell_1_0)),\n  Or(Not(cell_0_1), Not(cell_1_2)),\n  Or(Not(cell_0_2), Not(cell_1_2)),\n  Or(Not(cell_0_2), Not(cell_0_3)),\n  Or(Not(cell_0_2), Not(cell_1_1)),\n  Or(Not(cell_0_2), Not(cell_1_3)),\n  Or(Not(cell_0_3), Not(cell_1_3)),\n  Or(Not(cell_0_3), Not(cell_0_4)),\n  Or(Not(cell_0_3), Not(cell_1_2)),\n  Or(Not(cell_0_3), Not(cell_1_4)),\n  Or(Not(cell_0_4), Not(cell_1_4)),\n  Or(Not(cell_0_4), Not(cell_1_3)),\n  Or(Not(cell_1_0), Not(cell_0_0)),\n  Or(Not(cell_1_0), Not(cell_2_0)),\n  Or(Not(cell_1_0), Not(cell_1_1)),\n  Or(Not(cell_1_0), Not(cell_0_1)),\n  Or(Not(cell_1_0), Not(cell_2_1)),\n  Or(Not(cell_1_1), Not(cell_2_1)),\n  Or(Not(cell_1_1), Not(cell_1_2)),\n  Or(Not(cell_1_1), Not(cell_0_0)),\n  Or(Not(cell_1_1), Not(cell_0_2)),\n  Or(Not(cell_1_1), Not(cell_2_0)),\n  Or(Not(cell_1_1), Not(cell_2_2)),\n  Or(Not(cell_1_2), Not(cell_2_2)),\n  Or(Not(cell_1_2), Not(cell_1_3)),\n  Or(Not(cell_1_2), Not(cell_0_3)),\n  Or(Not(cell_1_2), Not(cell_2_1)),\n  Or(Not(cell_1_2), Not(cell_2_3)),\n  Or(Not(cell_1_3), Not(cell_2_3)),\n  Or(Not(cell_1_3), Not(cell_1_4)),\n  Or(Not(cell_1_3), Not(cell_0_4)),\n  Or(Not(cell_1_3), Not(cell_2_2)),\n  Or(Not(cell_1_3), Not(cell_2_4)),\n  Or(Not(cell_1_4), Not(cell_2_4)),\n  Or(Not(cell_1_4), Not(cell_2_3)),\n  Or(Not(cell_2_0), Not(cell_3_0)),\n  Or(Not(cell_2_0), Not(cell_2_1)),\n  Or(Not(cell_2_0), Not(cell_3_1)),\n  Or(Not(cell_2_1), Not(cell_3_1)),\n  Or(Not(cell_2_1), Not(cell_2_2)),\n  Or(Not(cell_2_1), Not(cell_3_0)),\n  Or(Not(cell_2_1), Not(cell_3_2)),\n  Or(Not(cell_2_2), Not(cell_3_2)),\n  Or(Not(cell_2_2), Not(cell_2_3)),\n  Or(Not(cell_2_2), Not(cell_3_1)),\n  Or(Not(cell_2_2), Not(cell_3_3)),\n  Or(Not(cell_2_3), Not(cell_3_3)),\n  Or(Not(cell_2_3), Not(cell_2_4)),\n  Or(Not(cell_2_3), Not(cell_3_2)),\n  Or(Not(cell_2_3), Not(cell_3_4)),\n  Or(Not(cell_2_4), Not(cell_3_4)),\n  Or(Not(cell_2_4), Not(cell_3_3)),\n  Or(Not(cell_3_0), Not(cell_4_0)),\n  Or(Not(cell_3_0), Not(cell_3_1)),\n  Or(Not(cell_3_0), Not(cell_4_1)),\n  Or(Not(cell_3_1), Not(cell_4_1)),\n  Or(Not(cell_3_1), Not(cell_3_2)),\n  Or(Not(cell_3_1), Not(cell_4_0)),\n  Or(Not(cell_3_1), Not(cell_4_2)),\n  Or(Not(cell_3_2), Not(cell_4_2)),\n  Or(Not(cell_3_2), Not(cell_3_3)),\n  Or(Not(cell_3_2), Not(cell_4_1)),\n  Or(Not(cell_3_2), Not(cell_4_3)),\n  Or(Not(cell_3_3), Not(cell_4_3)),\n  Or(Not(cell_3_3), Not(cell_3_4)),\n  Or(Not(cell_3_3), Not(cell_4_2)),\n  Or(Not(cell_3_3), Not(cell_4_4)),\n  Or(Not(cell_3_4), Not(cell_4_4)),\n  Or(Not(cell_3_4), Not(cell_4_3)),\n  Or(Not(cell_4_0), Not(cell_4_1)),\n  Or(Not(cell_4_1), Not(cell_4_2)),\n  Or(Not(cell_4_2), Not(cell_4_3)),\n  Or(Not(cell_4_3), Not(cell_4_4)),\n  ULE(Extract(0,\n              0,\n              ZeroExt(1, If(cell_0_0, 1, 0)) +\n              ZeroExt(1, If(cell_0_1, 1, 0))),\n      1),\n  ULE(Extract(0,\n              0,\n              ZeroExt(1, If(cell_0_2, 1, 0)) +\n              ZeroExt(1, If(cell_0_3, 1, 0))),\n      1),\n  Extract(1,\n          1,\n          ZeroExt(1,\n                  Extract(0,\n                          0,\n                          ZeroExt(1, If(cell_0_0, 1, 0)) +\n                          ZeroExt(1, If(cell_0_1, 1, 0)))) +\n          ZeroExt(1,\n                  Extract(0,\n                          0,\n                          ZeroExt(1, If(cell_0_2, 1, 0)) +\n                          ZeroExt(1, If(cell_0_3, 1, 0))))) ==\n  0,\n  ULE(Extract(0,\n              0,\n              ZeroExt(1,\n                      Extract(0,\n                              0,\n                              ZeroExt(1, If(cell_0_0, 1, 0)) +\n                              ZeroExt(1, If(cell_0_1, 1, 0)))) +\n              ZeroExt(1,\n                      Extract(0,\n                              0,\n                              ZeroExt(1, If(cell_0_2, 1, 0)) +\n                              ZeroExt(1, If(cell_0_3, 1, 0))))),\n      1),\n  Extract(1,\n          1,\n          ZeroExt(1,\n                  Extract(0,\n                          0,\n                          ZeroExt(1,\n                                  Extract(0,\n                                        0,\n                                        ZeroExt(1,\n                                        If(cell_0_0, 1, 0)) +\n                                        ZeroExt(1,\n                                        If(cell_0_1, 1, 0)))) +\n                          ZeroExt(1,\n                                  Extract(0,\n                                        0,\n                                        ZeroExt(1,\n                                        If(cell_0_2, 1, 0)) +\n                                        ZeroExt(1,\n                                        If(cell_0_3, 1, 0)))))) +\n..."
  }
}

```
