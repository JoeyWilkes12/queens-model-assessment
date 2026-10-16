# Graph and displayed-claim checks

- Event 15: 5 ancestor assignments, 8 reason/conflict edges; UIPs [1]; first UIP 1; all cuts and avoiding paths agree.
- Event 66: 26 ancestor assignments, 43 reason/conflict edges; UIPs [11]; first UIP 11; all cuts and avoiding paths agree.
- Event 87: 16 ancestor assignments, 23 reason/conflict edges; UIPs [12]; first UIP 12; all cuts and avoiding paths agree.
- Event 111: 26 ancestor assignments, 43 reason/conflict edges; UIPs [13]; first UIP 13; all cuts and avoiding paths agree.
- Event 126: 21 ancestor assignments, 40 reason/conflict edges; UIPs [2, 14]; first UIP 14; all cuts and avoiding paths agree.
- Event 157: 18 ancestor assignments, 35 reason/conflict edges; UIPs [2]; first UIP 2; all cuts and avoiding paths agree.
- Event 206: 22 ancestor assignments, 36 reason/conflict edges; UIPs [18]; first UIP 18; all cuts and avoiding paths agree.
- Event 233: 13 ancestor assignments, 17 reason/conflict edges; UIPs [19]; first UIP 19; all cuts and avoiding paths agree.

## Caption and mathematical counterexamples

- Default propagation Figure 3.1, step 1: trail literal -1 means q11=false and ¬q11=true. Current template prints “¬q11 becomes false”.
- existence: 212 negative propagation events receive the inverted visible value in CDCLPlayer; blocker used as reason at events [].
- blocked: 148 negative propagation events receive the inverted visible value in CDCLPlayer; blocker used as reason at events [].
- 5×5 inset: singleton q15 is true, followed by nine negative assignments; the exclusion count is correct.
- Propagation proof counterexample: (a∨b) is unit under {¬a}, satisfied and nonunit under {¬a,b}; unit-clause status is not monotone under extension.
- Chapter 7 counterexample to “every clause has at least two open literals”: [-15, -16] is already satisfied under ¬q31 and has one open literal.
- Sinz s_i is exactly prefix OR under the full EO encoding (7 models), but not under AMO alone. The chapter’s EO example is correct; clarify its scope only if changing its AMO wording.
- The event-126 clauses ¬q27 and (q11∨¬q12) do not imply one another as standalone formulas; “says less” is not a logical-strength comparison.

## Proof DAG counts

- Empty clause #527, learned at blocked event 183: 110 original input leaves plus blocker; 14 learned clause nodes; final resolution chain 14 steps.

All graph and counterexample assertions passed.
