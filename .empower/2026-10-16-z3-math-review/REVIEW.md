# Self-review and validation

Status: complete. Verdict and 17 grouped findings are in DELIVERABLE.md (5 error, 4 misleading, 8 minor). The application is unchanged; proposed corrections remain open.

Boundary checked: artifact directory is inside the registered `openrouter-panel` worktree. No application file has been modified. No credentials, .env files, keychains, or provider APIs accessed.

## Coverage and disposition

| Content | Review performed | Result |
|---|---|---|
| Chapter 1 definitions, four constraint families, placement bijection/proof, counts and check answer | Logical equivalence in both directions; independently enumerate all 7! permutations and all 5!/9! for other boards; evaluate Chebyshev condition on all queen pairs | Model/counts/check answer correct; proof has false/true typo. |
| Chapter 2 literals/CNF, pairwise/Sinz/commander definitions and projection theorem, counts and auxiliary answer | Direct extension argument for Sinz/commander; independent SAT extension for all input assignments m=1…9; count every table row including m=16/17; compare witnesses | Correct. Supplied verifier additionally proves projections at m=16/17 with Z3. Sinz prefix interpretation is exact under EO; AMO-only witness is intentionally not. |
| Chapter 3 unit rule, closure theorem/proof, order independence, watches, all player/written captions, inset and answer | Formal domain/proof review; counterexample to claimed monotone unit status; 49 UP runs in normal/reverse order; check all terminal states have undecided cells; inspect signed literal rendering | Closure theorem correct after explicit domain and proof repair; captions invert negative literals; watch invariant overbroad; question omits unassigned hypothesis. Inset 1+9 count and q31 step 15 correct. |
| Chapter 4 state rules, trail levels, classical DPLL contrast and check answer | Compare kernel/replay and abstract transitions; inspect events 0/15/19/33/66/126/128/129 | Correct in stated fixed-variable setting; classical backtracking sentence needs unexhausted-branch qualifier. |
| Chapter 5 graph/UIP/cut theorem, path answer, dynamic cuts | Independently reconstruct all 8 ancestor cones, every edge, all dominators/UIPs, first UIP, all cuts and witness paths | Data/theorem mechanism correct; make positive-level/saturation hypotheses and complementary-assignment reason explicit. Remove ungrounded standalone strength comparison between two incomparable clauses. |
| Chapter 6 resolution rule/soundness proof, learned-model preservation, asserting backjump and restart example | Recompute 147 resolutions, all reasons and jumps across both traces; check learned clauses by RUP; inspect schematic restart counts from trail | Correct mathematics and counts. Qualify resolution-only claim to reference derivation rather than full solver conflict analysis. |
| Chapter 7 Hall theorem, matching lemma, confinement proposition/proof and limits, every selectable subset, counterexample | Independently enumerate region-to-row cell choices; check all 254 nonempty-subset records, exact exclusions, multiplicities, zero-UP premise; theorem checked directly | Correct and nonvacuous (960 relaxed completions under hypothesis); one caption needs “unsatisfied clause”. Matching necessary/sufficient distinction is sound. |
| Chapter 8 blocker definition, uniqueness iff proof, short blocker, refutation DAG, RUP/DRAT/core discussion, auxiliary answer | Check full blocker on original variables, cardinality proof for short blocker; inspect all 14 RUP clauses in preceding databases; traverse proof DAG; primary DRAT source | Correct. Two projection failure directions apply in general (not a claim of nondeterministic auxiliary extension for these particular full EO encodings). Correct P2 cores locator. |
| Chapter 9 Tseitin clauses/projection, DPLL(T), simplex and integrality remarks, all arithmetic inset states, engine summaries | Check conjunction equivalence truth table mentally, existential extension argument; all 8 theory states with local Z3; inspect all 27 raw statistic sets and saved routes; reconstruct 36 input/blocker hashes | Correct main engine claims and arithmetic; Tseitin signature/projection wording ambiguous; 46 stale per-stage metric badges and diagnostic-line multipliers misleading; add P14 arithmetic section. |
| Experiment, glossary, source/caption helpers, board renderer | Read all code; execute 98 one-preference runs with/without blocker through in-memory TypeScript kernel; inspect runtime label construction | All sampled runs terminate correctly and validate. Signed-value captions need fixes; no browser/device QA. Hero overstates that all figures replay recorded evidence. |
| Evidence/pipeline/manifest and original specification | Read complete generator, kernel, measurement code and verifier; deterministic rebuild; manifest/source/input hashes; compare original teaching contract | Exact board/CNF binding and provenance distinctions retained. No DRAT or Z3 internal trail falsely claimed. |

## Commands and results

- `Z3_PYTHON=... PYTHONDONTWRITEBYTECODE=1 npm_config_cache=<artifact>/npm-cache npm_config_update_notifier=false npm run z3:verify`: passed 22 Python groups and 16 Node checks; offline-verifier.log.
- `PYTHONDONTWRITEBYTECODE=1 <authorized-python> recompute.py`: passed; RECOMPUTATIONS.md.
- `PYTHONDONTWRITEBYTECODE=1 <authorized-python> check_graphs_and_claims.py`: passed; GRAPH-AND-CLAIM-CHECKS.md.
- `node check_display.mjs`: 46 stale badges reproduced; 98 experimental runs passed; DISPLAY-CHECKS.md.
- `PYTHONDONTWRITEBYTECODE=1 <authorized-python> check_receipts.py`: passed; RECEIPT-CHECKS.md. Initial scratch attempts without the first solver check/fresh context failed to reproduce stateful hashes; corrected scratch methodology to mirror process/context boundaries. This was not an evidence defect.
- `node check_replacements.mjs`: 22 substitutions uniquely matched in 11 source files and resulting TSX parsed, entirely in memory; REPLACEMENT-CHECKS.md. No full typecheck/build or UI run claimed. Self-review caught a sentence-boundary issue in the initial Tseitin replacement and corrected it in the deliverable and verifier.
- INPUT-SNAPSHOT.md records every named input plus supporting files and evidence with SHA-256 and byte counts at reviewed HEAD.
- CITATIONS.md records direct primary-source checks and limits. No principal attribution error found; 2 source locators need additions.

## Boundary and residual risks

All authored files, scratch outputs, logs, and npm cache are within the requested artifact directory. No application file was written, no Git mutation performed, and no credentials/.env/keychain/provider API accessed. No browser or native-app access occurred. Web retrieval was confined to cited public sources.

Historical receipt counters/timings cannot be authenticated from aggregate files alone; source and hash consistency is verified. Nine first queries were solved only to reproduce stateful input serialization. No benchmark claim, complete Z3 historical trail, DRAT verification, deployed-site comparison, full visual/accessibility audit, or exhaustive multi-preference test is made.

Unrelated untracked `scripts/jev`, `scripts/llm_panel`, and `scripts/openrouter` directories appeared during the run and were committed by another process as `e986e674973ac860c2bb1aa8b1d80eab12ad4fc2`. They were not opened or modified; do not attribute or clean them as review output. The registered worktree/branch remain the original ones. A scoped diff from starting HEAD `dd2a8dec229e39a2129db4e28175f387a8cc3d6c` found no changes to any reviewed input; all 33 snapshot hashes still match. Final tracked diff is empty; only this artifact directory is untracked. This review made no commit.

The repository's existing validators check mathematical data strongly but do not detect these prose and display-template defects. All findings remain proposals for an implementer, as required by the DATA-only boundary.
