# Receipt input and arithmetic inset checks

- 36 hashes reconstructed: first, same-solver blocked, fresh blocked, and full-cell blocker for all nine board/configuration combinations.
- Manifest generator source hash matches scripts/z3/build_teaching_data.py.
- Manifest kernel source hash matches scripts/z3/reference_cdcl.py.
- Manifest measure source hash matches scripts/z3/measure_z3.py.
- Manifest board source hash matches src/z3/board-seven.json.
- Every manifest file byte count and hash matches.

## Arithmetic inset (all eight states)

| Domain | a | b | Feasible set | Correct theory lemma when empty |
|---|---|---|---|---|
| reals | False | False | (0,1) | — |
| reals | False | True | x ≥ 1 | — |
| reals | True | False | x ≤ 0 | — |
| reals | True | True | ∅ | ¬a ∨ ¬b |
| integers | False | False | ∅ | a ∨ b |
| integers | False | True | x ≥ 1 | — |
| integers | True | False | x ≤ 0 | — |
| integers | True | True | ∅ | ¬a ∨ ¬b |

All receipt input hashes and arithmetic inset assertions passed. Nine first queries were solved to reproduce stateful serialization; historical search counters/timings were not compared or replaced.
