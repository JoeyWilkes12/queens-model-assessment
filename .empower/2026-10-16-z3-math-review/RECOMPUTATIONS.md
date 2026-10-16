# Independent recomputations

No project generator/kernel is imported. All assertions below passed if the script exits 0.

## Counts and bindings

- 5×5: 120 permutations; 14 non-touching; 7 region-valid permutations; sole solution [5, 3, 1, 4, 2]; 144 directed neighbour assertions + 15 equations = 159.
- 7×7: 5,040 permutations; 646 non-touching; 24 region-valid permutations; sole solution [3, 1, 6, 2, 4, 7, 5]; 312 directed neighbour assertions + 21 equations = 333.
- 9×9: 362,880 permutations; 47,622 non-touching; 8 region-valid permutations; sole solution [6, 2, 4, 7, 1, 3, 9, 5, 8]; 544 directed neighbour assertions + 27 equations = 571.
- 2^49 = 562,949,953,421,312; 7^7 = 823,543; 7! = 5,040.
- CNF generated = 664, distinct = 513, repeats = 151. Family generated/new: {'row': (154, 154), 'column': (154, 154), 'region': (284, 171), 'touching': (72, 34)}.

## Encodings

| m | Pairwise clauses/aux/literals | Sinz clauses/aux/literals | Commander clauses/aux/literals |
|---:|---:|---:|---:|
| 1 | 1/0/1 | 1/0/1 | 1/0/1 |
| 2 | 2/0/4 | 3/1/6 | 2/0/4 |
| 3 | 4/0/9 | 6/2/13 | 4/0/9 |
| 4 | 7/0/16 | 9/3/20 | 11/2/24 |
| 5 | 11/0/25 | 12/4/27 | 13/2/29 |
| 6 | 16/0/36 | 15/5/34 | 16/2/36 |
| 7 | 22/0/49 | 18/6/41 | 20/3/45 |
| 8 | 29/0/64 | 21/7/48 | 22/3/50 |
| 9 | 37/0/81 | 24/8/55 | 25/3/57 |
| 16 | 121/0/256 | 45/15/104 | 53/8/120 |
| 17 | 137/0/289 | 48/16/111 | 55/8/125 |

- Exhaustive checks of all input assignments for all three encodings, m=1…9: 3,066; auxiliary encodings alone: 2,044.
- All 21 groups pairwise: 592 clauses, 0 auxiliaries (before cross-group deduplication).
- All 21 groups sequential: 378 clauses, 126 auxiliaries (before cross-group deduplication).
- All 21 groups commander: 420 clauses, 62 auxiliaries (before cross-group deduplication).
- Region sizes: A=5, B=4, C=17, D=16, E=2, F=3, G=2.

## Propagation and traces

- Recomputed all 49 propagation runs exactly: 34 conflict, 15 fixed point. Reverse clause order gives the same outcome; nonconflicting closures agree.
- From ¬q31 (literal -15), UP adds zero literals.
- From q12, q31 becomes true at step 15.
- existence: 270 events, 74 independently checked resolution steps, 8 learned clauses independently RUP-checked; terminal SAT.
- blocked: 185 events, 73 independently checked resolution steps, 6 learned clauses independently RUP-checked; terminal UNSAT.
- Events 66 and 126: [{'seq': 66, 'kind': 'conflict', 'level': 2, 'conflictClauseId': 110}, {'seq': 126, 'kind': 'conflict', 'level': 1, 'conflictClauseId': 477}].
- Clauses 295–297, 477, 517: {295: [-14, -35], 296: [-14, -42], 297: [-14, -49], 477: [35, 42, 49], 517: [-14]}.
- Event 127 resolution: [{'parentClauseId': 297, 'pivot': 49, 'result': [-14, 35, 42]}, {'parentClauseId': 296, 'pivot': 42, 'result': [-14, 35]}, {'parentClauseId': 295, 'pivot': 35, 'result': [-14]}].

## Hall abstraction

- Mask none: 1,152 selections of one cell per region in distinct rows; 30 cells used by some selection; all 127 nonempty region subsets checked.
- Mask notq31: 960 selections of one cell per region in distinct rows; 25 cells used by some selection; all 127 nonempty region subsets checked.
- Under ¬q31, K={A,B}, N(K)={1,2}, exclusions [[1, 6], [1, 7], [2, 4], [2, 5], [2, 6], [2, 7]].
- Counterexample cells [[2, 1], [1, 2], [3, 4], [4, 1], [5, 4], [6, 7], [7, 5]]; repeated columns with multiplicity {1: 2, 4: 2}.

## Engine receipts

- five/default/first: sat, D5/C1/P93; sat-core; cumulative flag=False; quiet/loud search counters match=True.
- five/default/incremental-blocked: unsat, D18/C14/P201; smt-core-arithmetic; cumulative flag=False; quiet/loud search counters match=True.
- five/default/fresh-blocked: unsat, D9/C6/P124; sat-core; cumulative flag=False; quiet/loud search counters match=True.
- five/fd/first: sat, D10/C2/P155; sat-core; cumulative flag=False; quiet/loud search counters match=True.
- five/fd/incremental-blocked: unsat, D14/C6/P427; sat-core; cumulative flag=True; quiet/loud search counters match=True.
- five/fd/fresh-blocked: unsat, D11/C8/P363; sat-core; cumulative flag=False; quiet/loud search counters match=True.
- five/pb/first: sat, D5/C4/P74; sat-core; cumulative flag=False; quiet/loud search counters match=True.
- five/pb/incremental-blocked: unsat, D5/C4/P74; no-new-search; cumulative flag=True; quiet/loud search counters match=True.
- five/pb/fresh-blocked: unsat, D4/C5/P73; sat-core; cumulative flag=False; quiet/loud search counters match=True.
- seven/default/first: sat, D11/C6/P428; sat-core; cumulative flag=False; quiet/loud search counters match=True.
- seven/default/incremental-blocked: unsat, D266/C96/P2245; smt-core-arithmetic; cumulative flag=False; quiet/loud search counters match=True.
- seven/default/fresh-blocked: unsat, D10/C7/P401; sat-core; cumulative flag=False; quiet/loud search counters match=True.
- seven/fd/first: sat, D35/C15/P836; sat-core; cumulative flag=False; quiet/loud search counters match=True.
- seven/fd/incremental-blocked: unsat, D68/C35/P1975; sat-core; cumulative flag=True; quiet/loud search counters match=True.
- seven/fd/fresh-blocked: unsat, D58/C34/P2056; sat-core; cumulative flag=False; quiet/loud search counters match=True.
- seven/pb/first: sat, D20/C10/P263; sat-core; cumulative flag=False; quiet/loud search counters match=True.
- seven/pb/incremental-blocked: unsat, D23/C14/P383; sat-core; cumulative flag=True; quiet/loud search counters match=True.
- seven/pb/fresh-blocked: unsat, D20/C13/P313; sat-core; cumulative flag=False; quiet/loud search counters match=True.
- nine/default/first: sat, DNone/CNone/PNone; preprocessing-only; cumulative flag=False; quiet/loud search counters match=True.
  - Last route lines: ['(propagate-values :num-exprs 691 :num-asts 2332 :time 0.00 :before-memory 18.23 :after-memory 18.23)', '(solve-eqs :num-exprs 0 :num-asts 2154 :time 0.00 :before-memory 18.23 :after-memory 18.33)', '(:solve-eqs-elim-vars 131', ' :solve-eqs-steps     131)', '(pb-tactic done)']
- nine/default/incremental-blocked: unsat, D382/C113/P2785; smt-core-arithmetic; cumulative flag=False; quiet/loud search counters match=True.
- nine/default/fresh-blocked: unsat, DNone/CNone/PNone; preprocessing-only; cumulative flag=False; quiet/loud search counters match=True.
- nine/fd/first: sat, D17/C6/P650; sat-core; cumulative flag=False; quiet/loud search counters match=True.
- nine/fd/incremental-blocked: unsat, D94/C33/P3584; sat-core; cumulative flag=True; quiet/loud search counters match=True.
- nine/fd/fresh-blocked: unsat, D71/C43/P3382; sat-core; cumulative flag=False; quiet/loud search counters match=True.
- nine/pb/first: sat, D1/CNone/P48; sat-core; cumulative flag=False; quiet/loud search counters match=True.
- nine/pb/incremental-blocked: unsat, D1/CNone/P48; no-new-search; cumulative flag=True; quiet/loud search counters match=True.
- nine/pb/fresh-blocked: unsat, DNone/CNone/P46; sat-core; cumulative flag=False; quiet/loud search counters match=True.

All independent assertions passed.
