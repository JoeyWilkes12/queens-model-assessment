# Local Z3 measurements

Z3 4.16.0.0; one separate process per board/mode; unchanged default seeds; timeout 30 seconds. Instrumentation code SHA-256: `857a8d340c5004fdb3862f5e8f3677542500ed4ad3d83816716a2f3ecdc82435`. Values are run-specific.

```json
[
  {
    "z3": "Z3 4.16.0.0",
    "board": "five",
    "mode": "default",
    "parameters": {
      "timeout": 30000,
      "verbose": 0,
      "clause_proof": false
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
      "elapsed_s": 0.0026716669963207096,
      "statistics": {
        "solve-eqs-steps": 4,
        "solve-eqs-elim-vars": 4,
        "sat mk clause 2ary": 149,
        "sat mk clause nary": 41,
        "sat mk var": 55,
        "sat del clause": 1,
        "sat conflicts": 1,
        "sat decisions": 5,
        "sat propagations 2ary": 66,
        "sat propagations nary": 27,
        "sat backjumps": 1,
        "sat elim literals": 1,
        "num allocs": 203446,
        "rlimit count": 12285,
        "max memory": 26.27,
        "memory": 18.05,
        "time": 0.002
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
      "elapsed_s": 0.0011362920049577951,
      "statistics": {
        "conflicts": 14,
        "decisions": 18,
        "propagations": 201,
        "binary propagations": 194,
        "added eqs": 360,
        "mk clause": 118,
        "mk clause binary": 174,
        "del clause": 117,
        "minimized lits": 18,
        "num checks": 1,
        "mk bool var": 332,
        "arith eq adapter": 117,
        "arith-lower": 106,
        "arith-upper": 86,
        "arith-conflicts": 5,
        "arith-bound-propagations-lp": 10,
        "arith-diseq": 31,
        "arith-make-feasible": 37,
        "arith-max-columns": 39,
        "arith-max-rows": 14,
        "arith-fixed-eqs": 31,
        "num allocs": 270121,
        "rlimit count": 17964,
        "max memory": 26.27,
        "memory": 18.34,
        "time": 0.001
      },
      "reason_unknown": null
    },
    "callback_events_first": null,
    "callback_events_incremental": null,
    "fresh_blocked": {
      "result": "unsat",
      "elapsed_s": 0.0016765420004958287,
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
        "num allocs": 716203,
        "rlimit count": 30529,
        "max memory": 27.84,
        "memory": 19.62,
        "time": 0.001
      },
      "reason_unknown": null
    },
    "clause_events": null
  },
  {
    "z3": "Z3 4.16.0.0",
    "board": "five",
    "mode": "fd",
    "parameters": {
      "timeout": 30000,
      "verbose": 0,
      "clause_proof": false
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
      "elapsed_s": 0.0037002909957664087,
      "statistics": {
        "sat mk clause 2ary": 131,
        "sat mk clause nary": 300,
        "sat mk var": 101,
        "sat del clause": 24,
        "sat conflicts": 2,
        "sat decisions": 10,
        "sat propagations 2ary": 66,
        "sat propagations nary": 89,
        "sat units": 6,
        "sat backjumps": 2,
        "sat elim clauses": 12,
        "sat elim literals": 12,
        "num allocs": 46170,
        "rlimit count": 12267,
        "max memory": 17.07,
        "memory": 17.07,
        "time": 0.003
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
      "elapsed_s": 6.0375001339707524e-05,
      "statistics": {
        "sat mk clause 2ary": 133,
        "sat mk clause nary": 301,
        "sat mk var": 101,
        "sat del clause": 24,
        "sat conflicts": 6,
        "sat decisions": 14,
        "sat propagations 2ary": 177,
        "sat propagations nary": 250,
        "sat units": 11,
        "sat backjumps": 5,
        "sat elim clauses": 12,
        "sat elim literals": 12,
        "num allocs": 62630,
        "rlimit count": 12614,
        "max memory": 17.17,
        "memory": 17.17
      },
      "reason_unknown": null
    },
    "callback_events_first": null,
    "callback_events_incremental": null,
    "fresh_blocked": {
      "result": "unsat",
      "elapsed_s": 0.0007899589982116595,
      "statistics": {
        "sat mk clause 2ary": 132,
        "sat mk clause nary": 302,
        "sat mk var": 101,
        "sat del clause": 24,
        "sat conflicts": 8,
        "sat decisions": 11,
        "sat propagations 2ary": 158,
        "sat propagations nary": 205,
        "sat minimized lits": 5,
        "sat units": 30,
        "sat backjumps": 7,
        "sat elim clauses": 12,
        "sat elim literals": 13,
        "num allocs": 117967,
        "rlimit count": 24820,
        "max memory": 17.46,
        "memory": 17.46
      },
      "reason_unknown": null
    },
    "clause_events": null
  },
  {
    "z3": "Z3 4.16.0.0",
    "board": "five",
    "mode": "pb",
    "parameters": {
      "timeout": 30000,
      "verbose": 0,
      "clause_proof": false
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
    "formula_sha256": "c512ea630521e8a0df1f8b6205bcc272ac08437964b1cdbf5b1e4bab7b547222",
    "first": {
      "result": "sat",
      "elapsed_s": 0.00035200000274926424,
      "statistics": {
        "pb-compile-card": 14,
        "pb-aux-variables": 14,
        "pb-aux-clauses": 120,
        "sat mk clause 2ary": 271,
        "sat mk clause nary": 23,
        "sat mk var": 69,
        "sat del clause": 11,
        "sat conflicts": 4,
        "sat decisions": 5,
        "sat propagations 2ary": 59,
        "sat propagations nary": 15,
        "sat units": 47,
        "sat backjumps": 4,
        "sat elim clauses": 5,
        "sat elim literals": 23,
        "num allocs": 20693,
        "rlimit count": 3098,
        "max memory": 16.99,
        "memory": 16.99
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
      "elapsed_s": 4.374999844003469e-05,
      "statistics": {
        "pb-compile-card": 14,
        "pb-aux-variables": 14,
        "pb-aux-clauses": 120,
        "sat mk clause 2ary": 271,
        "sat mk clause nary": 23,
        "sat mk var": 69,
        "sat del clause": 11,
        "sat conflicts": 4,
        "sat decisions": 5,
        "sat propagations 2ary": 59,
        "sat propagations nary": 15,
        "sat units": 68,
        "sat backjumps": 4,
        "sat elim clauses": 5,
        "sat elim literals": 23,
        "num allocs": 20693,
        "rlimit count": 3215,
        "max memory": 16.99,
        "memory": 16.99
      },
      "reason_unknown": null
    },
    "callback_events_first": null,
    "callback_events_incremental": null,
    "fresh_blocked": {
      "result": "unsat",
      "elapsed_s": 0.00022187500144355,
      "statistics": {
        "pb-compile-card": 14,
        "pb-aux-variables": 14,
        "pb-aux-clauses": 120,
        "sat mk clause 2ary": 271,
        "sat mk clause nary": 24,
        "sat mk var": 69,
        "sat del clause": 11,
        "sat conflicts": 5,
        "sat decisions": 4,
        "sat propagations 2ary": 57,
        "sat propagations nary": 16,
        "sat units": 47,
        "sat backjumps": 4,
        "sat elim clauses": 5,
        "sat elim literals": 30,
        "num allocs": 50100,
        "rlimit count": 6371,
        "max memory": 17.24,
        "memory": 17.24
      },
      "reason_unknown": null
    },
    "clause_events": null
  },
  {
    "z3": "Z3 4.16.0.0",
    "board": "seven",
    "mode": "default",
    "parameters": {
      "timeout": 30000,
      "verbose": 0,
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
      "elapsed_s": 0.0036635409996961243,
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
        "num allocs": 422220,
        "rlimit count": 29946,
        "max memory": 26.49,
        "memory": 18.25,
        "time": 0.003
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
      "elapsed_s": 0.005278374999761581,
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
        "num allocs": 720756,
        "rlimit count": 60660,
        "max memory": 26.49,
        "memory": 18.93,
        "time": 0.005
      },
      "reason_unknown": null
    },
    "callback_events_first": null,
    "callback_events_incremental": null,
    "fresh_blocked": {
      "result": "unsat",
      "elapsed_s": 0.002923041000030935,
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
        "num allocs": 1860386,
        "rlimit count": 91065,
        "max memory": 28.48,
        "memory": 20.21,
        "time": 0.002
      },
      "reason_unknown": null
    },
    "clause_events": null
  },
  {
    "z3": "Z3 4.16.0.0",
    "board": "seven",
    "mode": "fd",
    "parameters": {
      "timeout": 30000,
      "verbose": 0,
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
      "elapsed_s": 0.00171208299434511,
      "statistics": {
        "sat mk clause 2ary": 293,
        "sat mk clause nary": 940,
        "sat mk var": 284,
        "sat del clause": 36,
        "sat conflicts": 15,
        "sat decisions": 35,
        "sat propagations 2ary": 245,
        "sat propagations nary": 591,
        "sat minimized lits": 3,
        "sat subs resolution dyn": 2,
        "sat units": 2,
        "sat backjumps": 15,
        "sat elim clauses": 18,
        "sat elim literals": 19,
        "num allocs": 151126,
        "rlimit count": 22622,
        "max memory": 17.36,
        "memory": 17.36,
        "time": 0.001
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
      "elapsed_s": 0.0001344580014119856,
      "statistics": {
        "sat mk clause 2ary": 298,
        "sat mk clause nary": 950,
        "sat mk var": 284,
        "sat del clause": 36,
        "sat conflicts": 35,
        "sat decisions": 68,
        "sat propagations 2ary": 543,
        "sat propagations nary": 1432,
        "sat minimized lits": 67,
        "sat subs resolution dyn": 11,
        "sat units": 124,
        "sat backjumps": 34,
        "sat elim clauses": 18,
        "sat elim literals": 19,
        "num allocs": 151126,
        "rlimit count": 23926,
        "max memory": 17.36,
        "memory": 17.36
      },
      "reason_unknown": null
    },
    "callback_events_first": null,
    "callback_events_incremental": null,
    "fresh_blocked": {
      "result": "unsat",
      "elapsed_s": 0.0013411250038188882,
      "statistics": {
        "sat mk clause 2ary": 302,
        "sat mk clause nary": 949,
        "sat mk var": 284,
        "sat del clause": 36,
        "sat conflicts": 34,
        "sat decisions": 58,
        "sat propagations 2ary": 575,
        "sat propagations nary": 1481,
        "sat minimized lits": 46,
        "sat subs resolution dyn": 11,
        "sat units": 2,
        "sat backjumps": 33,
        "sat elim clauses": 18,
        "sat elim literals": 20,
        "num allocs": 288686,
        "rlimit count": 47259,
        "max memory": 17.75,
        "memory": 17.75,
        "time": 0.001
      },
      "reason_unknown": null
    },
    "clause_events": null
  },
  {
    "z3": "Z3 4.16.0.0",
    "board": "seven",
    "mode": "pb",
    "parameters": {
      "timeout": 30000,
      "verbose": 0,
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
    "formula_sha256": "49c895cdd7be69f9b3c129aa1caeb0b6c5efceef973977d8eb3956e16c67375f",
    "first": {
      "result": "sat",
      "elapsed_s": 0.0010432080016471446,
      "statistics": {
        "pb-compile-card": 21,
        "pb-aux-variables": 21,
        "pb-aux-clauses": 240,
        "sat mk clause 2ary": 359,
        "sat mk clause nary": 58,
        "sat mk var": 105,
        "sat conflicts": 10,
        "sat decisions": 20,
        "sat propagations 2ary": 199,
        "sat propagations nary": 64,
        "sat minimized lits": 2,
        "sat subs resolution dyn": 3,
        "sat units": 50,
        "sat backjumps": 10,
        "sat elim literals": 7,
        "num allocs": 55956,
        "rlimit count": 15005,
        "max memory": 17.09,
        "memory": 17.09
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
      "elapsed_s": 6.629199924645945e-05,
      "statistics": {
        "pb-compile-card": 21,
        "pb-aux-variables": 21,
        "pb-aux-clauses": 240,
        "sat mk clause 2ary": 361,
        "sat mk clause nary": 59,
        "sat mk var": 105,
        "sat conflicts": 14,
        "sat decisions": 23,
        "sat propagations 2ary": 290,
        "sat propagations nary": 93,
        "sat minimized lits": 8,
        "sat subs resolution dyn": 3,
        "sat units": 50,
        "sat backjumps": 13,
        "sat elim literals": 7,
        "num allocs": 83388,
        "rlimit count": 15342,
        "max memory": 17.18,
        "memory": 17.18
      },
      "reason_unknown": null
    },
    "callback_events_first": null,
    "callback_events_incremental": null,
    "fresh_blocked": {
      "result": "unsat",
      "elapsed_s": 0.0008372500014957041,
      "statistics": {
        "pb-compile-card": 21,
        "pb-aux-variables": 21,
        "pb-aux-clauses": 240,
        "sat mk clause 2ary": 359,
        "sat mk clause nary": 59,
        "sat mk var": 105,
        "sat conflicts": 13,
        "sat decisions": 20,
        "sat propagations 2ary": 235,
        "sat propagations nary": 78,
        "sat minimized lits": 2,
        "sat subs resolution dyn": 3,
        "sat units": 95,
        "sat backjumps": 12,
        "sat elim literals": 8,
        "num allocs": 172733,
        "rlimit count": 30535,
        "max memory": 17.48,
        "memory": 17.48
      },
      "reason_unknown": null
    },
    "clause_events": null
  },
  {
    "z3": "Z3 4.16.0.0",
    "board": "nine",
    "mode": "default",
    "parameters": {
      "timeout": 30000,
      "verbose": 0,
      "clause_proof": false
    },
    "app_sha256": "6a310f59948e3fb576e66f39545309f169f90ce686444876cd78f736c8000954",
    "partition_sha256": "ebd0dbfe1b9e98e61fe4fb68201a1f25b587ba9603b1a0cbca31a6d8d471f98c",
    "regions": [
      [
        "A",
        "B",
        "B",
        "B",
        "B",
        "C",
        "C",
        "C",
        "C"
      ],
      [
        "A",
        "B",
        "B",
        "B",
        "B",
        "B",
        "C",
        "C",
        "C"
      ],
      [
        "A",
        "B",
        "B",
        "D",
        "A",
        "B",
        "C",
        "C",
        "C"
      ],
      [
        "A",
        "A",
        "A",
        "A",
        "A",
        "A",
        "E",
        "A",
        "A"
      ],
      [
        "F",
        "A",
        "A",
        "A",
        "G",
        "A",
        "A",
        "A",
        "H"
      ],
      [
        "A",
        "A",
        "A",
        "A",
        "G",
        "G",
        "A",
        "H",
        "H"
      ],
      [
        "A",
        "G",
        "G",
        "G",
        "G",
        "G",
        "G",
        "G",
        "H"
      ],
      [
        "A",
        "G",
        "G",
        "G",
        "G",
        "G",
        "G",
        "I",
        "I"
      ],
      [
        "A",
        "G",
        "G",
        "G",
        "G",
        "G",
        "G",
        "I",
        "I"
      ]
    ],
    "assertions": 571,
    "formula_sha256": "7580ca34636dec5d8069c89f06005fce4d8babbdee09bcb698fc366a54bac10f",
    "first": {
      "result": "sat",
      "elapsed_s": 0.0027794999987236224,
      "statistics": {
        "solve-eqs-steps": 25,
        "solve-eqs-elim-vars": 25,
        "num allocs": 479055,
        "rlimit count": 44607,
        "max memory": 18.32,
        "memory": 18.32,
        "time": 0.002
      },
      "reason_unknown": null
    },
    "model_columns": [
      6,
      2,
      4,
      7,
      1,
      3,
      9,
      5,
      8
    ],
    "matches_saved_solution": true,
    "blocker": "Or(cell_0_0 != False,\n   cell_0_1 != False,\n   cell_0_2 != False,\n   cell_0_3 != False,\n   cell_0_4 != False,\n   cell_0_5 != True,\n   cell_0_6 != False,\n   cell_0_7 != False,\n   cell_0_8 != False,\n   cell_1_0 != False,\n   cell_1_1 != True,\n   cell_1_2 != False,\n   cell_1_3 != False,\n   cell_1_4 != False,\n   cell_1_5 != False,\n   cell_1_6 != False,\n   cell_1_7 != False,\n   cell_1_8 != False,\n   cell_2_0 != False,\n   cell_2_1 != False,\n   cell_2_2 != False,\n   cell_2_3 != True,\n   cell_2_4 != False,\n   cell_2_5 != False,\n   cell_2_6 != False,\n   cell_2_7 != False,\n   cell_2_8 != False,\n   cell_3_0 != False,\n   cell_3_1 != False,\n   cell_3_2 != False,\n   cell_3_3 != False,\n   cell_3_4 != False,\n   cell_3_5 != False,\n   cell_3_6 != True,\n   cell_3_7 != False,\n   cell_3_8 != False,\n   cell_4_0 != True,\n   cell_4_1 != False,\n   cell_4_2 != False,\n   cell_4_3 != False,\n   cell_4_4 != False,\n   cell_4_5 != False,\n   cell_4_6 != False,\n   cell_4_7 != False,\n   cell_4_8 != False,\n   cell_5_0 != False,\n   cell_5_1 != False,\n   cell_5_2 != True,\n   cell_5_3 != False,\n   cell_5_4 != False,\n   cell_5_5 != False,\n   cell_5_6 != False,\n   cell_5_7 != False,\n   cell_5_8 != False,\n   cell_6_0 != False,\n   cell_6_1 != False,\n   cell_6_2 != False,\n   cell_6_3 != False,\n   cell_6_4 != False,\n   cell_6_5 != False,\n   cell_6_6 != False,\n   cell_6_7 != False,\n   cell_6_8 != True,\n   cell_7_0 != False,\n   cell_7_1 != False,\n   cell_7_2 != False,\n   cell_7_3 != False,\n   cell_7_4 != True,\n   cell_7_5 != False,\n   cell_7_6 != False,\n   cell_7_7 != False,\n   cell_7_8 != False,\n   cell_8_0 != False,\n   cell_8_1 != False,\n   cell_8_2 != False,\n   cell_8_3 != False,\n   cell_8_4 != False,\n   cell_8_5 != False,\n   cell_8_6 != False,\n   cell_8_7 != True,\n   cell_8_8 != False)",
    "incremental_blocked": {
      "result": "unsat",
      "elapsed_s": 0.006381625003996305,
      "statistics": {
        "conflicts": 113,
        "decisions": 382,
        "propagations": 2785,
        "binary propagations": 2502,
        "restarts": 1,
        "added eqs": 3710,
        "mk clause": 842,
        "mk clause binary": 756,
        "del clause": 736,
        "minimized lits": 48,
        "num checks": 1,
        "mk bool var": 2574,
        "arith eq adapter": 1608,
        "arith-lower": 2013,
        "arith-upper": 925,
        "arith-fixed-eqs": 7,
        "arith-conflicts": 46,
        "arith-bound-propagations-lp": 400,
        "arith-diseq": 806,
        "arith-make-feasible": 721,
        "arith-max-columns": 84,
        "arith-max-rows": 23,
        "num allocs": 956070,
        "rlimit count": 85322,
        "max memory": 19.1,
        "memory": 19.1,
        "time": 0.006
      },
      "reason_unknown": null
    },
    "callback_events_first": null,
    "callback_events_incremental": null,
    "fresh_blocked": {
      "result": "unsat",
      "elapsed_s": 0.002396999996562954,
      "statistics": {
        "solve-eqs-steps": 25,
        "solve-eqs-elim-vars": 25,
        "num allocs": 1893792,
        "rlimit count": 127214,
        "max memory": 20.39,
        "memory": 20.39,
        "time": 0.002
      },
      "reason_unknown": null
    },
    "clause_events": null
  },
  {
    "z3": "Z3 4.16.0.0",
    "board": "nine",
    "mode": "fd",
    "parameters": {
      "timeout": 30000,
      "verbose": 0,
      "clause_proof": false
    },
    "app_sha256": "6a310f59948e3fb576e66f39545309f169f90ce686444876cd78f736c8000954",
    "partition_sha256": "ebd0dbfe1b9e98e61fe4fb68201a1f25b587ba9603b1a0cbca31a6d8d471f98c",
    "regions": [
      [
        "A",
        "B",
        "B",
        "B",
        "B",
        "C",
        "C",
        "C",
        "C"
      ],
      [
        "A",
        "B",
        "B",
        "B",
        "B",
        "B",
        "C",
        "C",
        "C"
      ],
      [
        "A",
        "B",
        "B",
        "D",
        "A",
        "B",
        "C",
        "C",
        "C"
      ],
      [
        "A",
        "A",
        "A",
        "A",
        "A",
        "A",
        "E",
        "A",
        "A"
      ],
      [
        "F",
        "A",
        "A",
        "A",
        "G",
        "A",
        "A",
        "A",
        "H"
      ],
      [
        "A",
        "A",
        "A",
        "A",
        "G",
        "G",
        "A",
        "H",
        "H"
      ],
      [
        "A",
        "G",
        "G",
        "G",
        "G",
        "G",
        "G",
        "G",
        "H"
      ],
      [
        "A",
        "G",
        "G",
        "G",
        "G",
        "G",
        "G",
        "I",
        "I"
      ],
      [
        "A",
        "G",
        "G",
        "G",
        "G",
        "G",
        "G",
        "I",
        "I"
      ]
    ],
    "assertions": 571,
    "formula_sha256": "7580ca34636dec5d8069c89f06005fce4d8babbdee09bcb698fc366a54bac10f",
    "first": {
      "result": "sat",
      "elapsed_s": 0.0036408750020200387,
      "statistics": {
        "sat mk clause 2ary": 304,
        "sat mk clause nary": 1168,
        "sat mk var": 382,
        "sat conflicts": 6,
        "sat decisions": 17,
        "sat propagations 2ary": 162,
        "sat propagations nary": 488,
        "sat minimized lits": 1,
        "sat units": 29,
        "sat backjumps": 6,
        "num allocs": 469156,
        "rlimit count": 39666,
        "max memory": 17.69,
        "memory": 17.69,
        "time": 0.003
      },
      "reason_unknown": null
    },
    "model_columns": [
      6,
      2,
      4,
      7,
      1,
      3,
      9,
      5,
      8
    ],
    "matches_saved_solution": true,
    "blocker": "Or(cell_0_0 != False,\n   cell_0_1 != False,\n   cell_0_2 != False,\n   cell_0_3 != False,\n   cell_0_4 != False,\n   cell_0_5 != True,\n   cell_0_6 != False,\n   cell_0_7 != False,\n   cell_0_8 != False,\n   cell_1_0 != False,\n   cell_1_1 != True,\n   cell_1_2 != False,\n   cell_1_3 != False,\n   cell_1_4 != False,\n   cell_1_5 != False,\n   cell_1_6 != False,\n   cell_1_7 != False,\n   cell_1_8 != False,\n   cell_2_0 != False,\n   cell_2_1 != False,\n   cell_2_2 != False,\n   cell_2_3 != True,\n   cell_2_4 != False,\n   cell_2_5 != False,\n   cell_2_6 != False,\n   cell_2_7 != False,\n   cell_2_8 != False,\n   cell_3_0 != False,\n   cell_3_1 != False,\n   cell_3_2 != False,\n   cell_3_3 != False,\n   cell_3_4 != False,\n   cell_3_5 != False,\n   cell_3_6 != True,\n   cell_3_7 != False,\n   cell_3_8 != False,\n   cell_4_0 != True,\n   cell_4_1 != False,\n   cell_4_2 != False,\n   cell_4_3 != False,\n   cell_4_4 != False,\n   cell_4_5 != False,\n   cell_4_6 != False,\n   cell_4_7 != False,\n   cell_4_8 != False,\n   cell_5_0 != False,\n   cell_5_1 != False,\n   cell_5_2 != True,\n   cell_5_3 != False,\n   cell_5_4 != False,\n   cell_5_5 != False,\n   cell_5_6 != False,\n   cell_5_7 != False,\n   cell_5_8 != False,\n   cell_6_0 != False,\n   cell_6_1 != False,\n   cell_6_2 != False,\n   cell_6_3 != False,\n   cell_6_4 != False,\n   cell_6_5 != False,\n   cell_6_6 != False,\n   cell_6_7 != False,\n   cell_6_8 != True,\n   cell_7_0 != False,\n   cell_7_1 != False,\n   cell_7_2 != False,\n   cell_7_3 != False,\n   cell_7_4 != True,\n   cell_7_5 != False,\n   cell_7_6 != False,\n   cell_7_7 != False,\n   cell_7_8 != False,\n   cell_8_0 != False,\n   cell_8_1 != False,\n   cell_8_2 != False,\n   cell_8_3 != False,\n   cell_8_4 != False,\n   cell_8_5 != False,\n   cell_8_6 != False,\n   cell_8_7 != True,\n   cell_8_8 != False)",
    "incremental_blocked": {
      "result": "unsat",
      "elapsed_s": 0.0002459170063957572,
      "statistics": {
        "sat mk clause 2ary": 344,
        "sat mk clause nary": 1184,
        "sat mk var": 382,
        "sat del clause": 80,
        "sat conflicts": 33,
        "sat decisions": 94,
        "sat propagations 2ary": 842,
        "sat propagations nary": 2742,
        "sat minimized lits": 50,
        "sat subs resolution dyn": 9,
        "sat units": 139,
        "sat backjumps": 32,
        "sat elim clauses": 44,
        "sat elim literals": 40,
        "num allocs": 469156,
        "rlimit count": 43023,
        "max memory": 17.69,
        "memory": 17.69
      },
      "reason_unknown": null
    },
    "callback_events_first": null,
    "callback_events_incremental": null,
    "fresh_blocked": {
      "result": "unsat",
      "elapsed_s": 0.0023912909964565188,
      "statistics": {
        "sat mk clause 2ary": 346,
        "sat mk clause nary": 1193,
        "sat mk var": 382,
        "sat del clause": 80,
        "sat conflicts": 43,
        "sat decisions": 71,
        "sat propagations 2ary": 983,
        "sat propagations nary": 2399,
        "sat minimized lits": 60,
        "sat subs resolution dyn": 7,
        "sat units": 88,
        "sat backjumps": 42,
        "sat elim clauses": 44,
        "sat elim literals": 41,
        "num allocs": 959030,
        "rlimit count": 84751,
        "max memory": 18.35,
        "memory": 18.35,
        "time": 0.002
      },
      "reason_unknown": null
    },
    "clause_events": null
  },
  {
    "z3": "Z3 4.16.0.0",
    "board": "nine",
    "mode": "pb",
    "parameters": {
      "timeout": 30000,
      "verbose": 0,
      "clause_proof": false
    },
    "app_sha256": "6a310f59948e3fb576e66f39545309f169f90ce686444876cd78f736c8000954",
    "partition_sha256": "ebd0dbfe1b9e98e61fe4fb68201a1f25b587ba9603b1a0cbca31a6d8d471f98c",
    "regions": [
      [
        "A",
        "B",
        "B",
        "B",
        "B",
        "C",
        "C",
        "C",
        "C"
      ],
      [
        "A",
        "B",
        "B",
        "B",
        "B",
        "B",
        "C",
        "C",
        "C"
      ],
      [
        "A",
        "B",
        "B",
        "D",
        "A",
        "B",
        "C",
        "C",
        "C"
      ],
      [
        "A",
        "A",
        "A",
        "A",
        "A",
        "A",
        "E",
        "A",
        "A"
      ],
      [
        "F",
        "A",
        "A",
        "A",
        "G",
        "A",
        "A",
        "A",
        "H"
      ],
      [
        "A",
        "A",
        "A",
        "A",
        "G",
        "G",
        "A",
        "H",
        "H"
      ],
      [
        "A",
        "G",
        "G",
        "G",
        "G",
        "G",
        "G",
        "G",
        "H"
      ],
      [
        "A",
        "G",
        "G",
        "G",
        "G",
        "G",
        "G",
        "I",
        "I"
      ],
      [
        "A",
        "G",
        "G",
        "G",
        "G",
        "G",
        "G",
        "I",
        "I"
      ]
    ],
    "assertions": 571,
    "formula_sha256": "b0b67db24010525e786338b08373cb9588f6070bb362353cb7433db53e37b0ff",
    "first": {
      "result": "sat",
      "elapsed_s": 0.001145999995060265,
      "statistics": {
        "pb-compile-card": 24,
        "pb-aux-variables": 24,
        "pb-aux-clauses": 429,
        "sat mk clause 2ary": 160,
        "sat mk clause nary": 37,
        "sat mk var": 131,
        "sat decisions": 1,
        "sat propagations 2ary": 36,
        "sat propagations nary": 12,
        "sat units": 82,
        "num allocs": 97723,
        "rlimit count": 17573,
        "max memory": 17.2,
        "memory": 17.2,
        "time": 0.001
      },
      "reason_unknown": null
    },
    "model_columns": [
      6,
      2,
      4,
      7,
      1,
      3,
      9,
      5,
      8
    ],
    "matches_saved_solution": true,
    "blocker": "Or(cell_0_0 != False,\n   cell_0_1 != False,\n   cell_0_2 != False,\n   cell_0_3 != False,\n   cell_0_4 != False,\n   cell_0_5 != True,\n   cell_0_6 != False,\n   cell_0_7 != False,\n   cell_0_8 != False,\n   cell_1_0 != False,\n   cell_1_1 != True,\n   cell_1_2 != False,\n   cell_1_3 != False,\n   cell_1_4 != False,\n   cell_1_5 != False,\n   cell_1_6 != False,\n   cell_1_7 != False,\n   cell_1_8 != False,\n   cell_2_0 != False,\n   cell_2_1 != False,\n   cell_2_2 != False,\n   cell_2_3 != True,\n   cell_2_4 != False,\n   cell_2_5 != False,\n   cell_2_6 != False,\n   cell_2_7 != False,\n   cell_2_8 != False,\n   cell_3_0 != False,\n   cell_3_1 != False,\n   cell_3_2 != False,\n   cell_3_3 != False,\n   cell_3_4 != False,\n   cell_3_5 != False,\n   cell_3_6 != True,\n   cell_3_7 != False,\n   cell_3_8 != False,\n   cell_4_0 != True,\n   cell_4_1 != False,\n   cell_4_2 != False,\n   cell_4_3 != False,\n   cell_4_4 != False,\n   cell_4_5 != False,\n   cell_4_6 != False,\n   cell_4_7 != False,\n   cell_4_8 != False,\n   cell_5_0 != False,\n   cell_5_1 != False,\n   cell_5_2 != True,\n   cell_5_3 != False,\n   cell_5_4 != False,\n   cell_5_5 != False,\n   cell_5_6 != False,\n   cell_5_7 != False,\n   cell_5_8 != False,\n   cell_6_0 != False,\n   cell_6_1 != False,\n   cell_6_2 != False,\n   cell_6_3 != False,\n   cell_6_4 != False,\n   cell_6_5 != False,\n   cell_6_6 != False,\n   cell_6_7 != False,\n   cell_6_8 != True,\n   cell_7_0 != False,\n   cell_7_1 != False,\n   cell_7_2 != False,\n   cell_7_3 != False,\n   cell_7_4 != True,\n   cell_7_5 != False,\n   cell_7_6 != False,\n   cell_7_7 != False,\n   cell_7_8 != False,\n   cell_8_0 != False,\n   cell_8_1 != False,\n   cell_8_2 != False,\n   cell_8_3 != False,\n   cell_8_4 != False,\n   cell_8_5 != False,\n   cell_8_6 != False,\n   cell_8_7 != True,\n   cell_8_8 != False)",
    "incremental_blocked": {
      "result": "unsat",
      "elapsed_s": 6.158299947855994e-05,
      "statistics": {
        "pb-compile-card": 24,
        "pb-aux-variables": 24,
        "pb-aux-clauses": 429,
        "sat mk clause 2ary": 160,
        "sat mk clause nary": 37,
        "sat mk var": 131,
        "sat decisions": 1,
        "sat propagations 2ary": 36,
        "sat propagations nary": 12,
        "sat units": 130,
        "num allocs": 141155,
        "rlimit count": 17922,
        "max memory": 17.3,
        "memory": 17.3
      },
      "reason_unknown": null
    },
    "callback_events_first": null,
    "callback_events_incremental": null,
    "fresh_blocked": {
      "result": "unsat",
      "elapsed_s": 0.0010193330017500557,
      "statistics": {
        "pb-compile-card": 24,
        "pb-aux-variables": 24,
        "pb-aux-clauses": 429,
        "sat mk clause 2ary": 160,
        "sat mk clause nary": 38,
        "sat mk var": 131,
        "sat propagations 2ary": 33,
        "sat propagations nary": 13,
        "sat units": 82,
        "num allocs": 326009,
        "rlimit count": 35685,
        "max memory": 17.68,
        "memory": 17.68,
        "time": 0.001
      },
      "reason_unknown": null
    },
    "clause_events": null
  }
]
```
