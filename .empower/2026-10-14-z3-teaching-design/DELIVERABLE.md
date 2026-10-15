# How Z3 solves regional Queens — teaching and implementation specification

Recommendation: add a nine-chapter **“How Z3 solves Queens”** part to the assessment book. Teach one mathematical mechanism at a time on its existing 7×7 board. Pair actual Z3 measurements with a complete, executable reference-CDCL trace whose engine is identified accurately.

Audience: mathematical undergraduates who know proofs and graphs but have never used SAT. The desired outcome is that a reader can encode the puzzle, execute a propagation step, explain a learned clause, prove uniqueness using UNSAT, and interpret what a particular Z3 run actually did.

## 1. Diagnosis of the current Atlas

This diagnosis follows the requested source files, including the generated `dist/pages/index.html`; it is a code/content review, not a claimed browser usability study.

- **The organizing question is wrong for this audience.** README and specification address quantitative professionals inspecting modeling contracts. The hero introduces “variables, partitions, conflicts, a solver contract, and evidence” before showing one mathematical inference. An undergraduate can understand each word yet have no reason to manipulate anything.
- **The first workspace requires too many simultaneous distinctions.** The template introduces supplied baseline, derived analysis, illustrative search, selected cell, draft assumptions, active assumptions, witness, enabled rule families, and run number. `app.js` maintains corresponding parallel state. Understanding the interface becomes a prerequisite for learning the mathematics.
- **The controls lack a teaching sequence.** Four independent rule switches change the problem before the reader understands the intact problem. There is no prediction prompt, worked inference, or progressively revealed vocabulary. Disabling a rule is useful later as an experiment, not as the opening lesson.
- **The trace is disconnected from the board.** Back/Next call `renderTrace()`, not `renderBoard()`. The board displays the completed witness while the log advances through earlier search. A reader sees a queen appear in prose without seeing the corresponding partial assignment, exclusions, or reversal.
- **The log is not a CDCL explanation.** `model.js` recursively chooses an uncovered partition, skips incompatible cells, and retracts selections. It records at most 28 ordinary try/retract messages, plus terminal messages. There are no literal reasons, decision levels, unit-clause queue, implication graph, learned clauses, or nonchronological backjumps. Its target comparison uses partition size, not the number of surviving candidates. This is a bounded backtracker with a truncated log.
- **The visible formula and executing engine teach different things.** `smtSource()` exports pairwise CNF under `QF_FD`; production Python asserts integer-valued indicator sums to an unrestricted `Solver()`. They express the same puzzle, but the exported representation does not establish the production preprocessing route.
- **Evidence language overwhelms the explanation it protects.** Three evidence panels precede the board; the trace warning appears repeatedly; a long paragraph reconciles 312 directed implications, 156 pairs, 84 redundancies and 72 diagonals. These distinctions are valuable in a technical receipt, after “why does choosing this cell exclude that one?”
- **The “How Z3 fits” material arrives late and stays abstract.** A single pipeline paragraph follows encodings and four transfer domains. It names learning without demonstrating one learned clause. The research ledger supplies destinations, not reading assignments tied to specific diagrams.
- **Responsive stacking preserves content, not the learning relationship.** CSS stacks board, controls, trace and source below 820px. The reader must scroll between the state and its explanation. Rule formulas disappear at that breakpoint. Source inspection suggests these risks; actual mobile rendering remains untested here.
- **The two 7×7 boards are different instances.** Atlas baseline columns are `[4,7,2,6,3,1,5]`; the book uses `[3,1,6,2,4,7,5]` and a different partition. Reusing an Atlas trace against the book board would be mathematically incorrect.

Preserve the Atlas’s keyboard navigation, explicit rule contract, source export, and careful result provenance. Replace its opening workbench with a guided reading path; put unrestricted experiments after the lessons.

## 2. What Z3 actually does on this encoding

### Mathematical input versus operational route

The production `queens_solver.py` creates Boolean cells and asserts `Sum(If(b,1,0)) == 1` for every row, column and region. Each `If` is an **integer-valued term controlled by a Boolean**, not an independent integer decision variable. The sums are cardinality constraints semantically, but their initial syntax is arithmetic; this differs from explicitly constructing `PbEq` or `AtMost` expressions.

It also asserts both directed implications for every touching pair. For an n×n board there are `4n(n−1)+4(n−1)²` such assertions. They contribute 144, 312 and 544 assertions at sizes 5, 7 and 9; adding 3n equalities gives 159, 333 and 571. With row/column exactly-one constraints intact, orthogonal exclusions are redundant. The remaining local diagonal pairs number `2(n−1)²`. Long diagonals are legal.

The file named `queens_z3_solvers_v1_keep.py` currently contains a Google Drive warning HTML page. I read the original local KEEP notebook instead: its solve function matches this encoding. Do not execute that `.py` as recovered notebook source.

**Observed locally, Z3 4.16.0.0:** the book’s 7×7 first check runs simplification, value propagation, contextual simplification, equation solving, `lia2card`, elimination, `pb2bv`, further simplification/equation solving, bit-blasting, AIG processing and the SAT core. This is recorded in [Z3_VERBOSE.md](Z3_VERBOSE.md). Bit-blasting is therefore part of this observed route, although its appearance does not mean every input sum became a literal ripple-carry adder. Cardinality compilation can introduce specialized Boolean structure and simplify it before search.

The pinned implementation explains this route: the [default tactic](https://raw.githubusercontent.com/Z3Prover/z3/z3-4.16.0/src/tactic/portfolio/default_tactic.cpp) selects a logic-specific strategy, and the [QF_LIA tactic](https://raw.githubusercontent.com/Z3Prover/z3/z3-4.16.0/src/tactic/smtlogics/qflia_tactic.cpp) contains cardinality/PB reductions and SAT alternatives. These are available strategies, not a guarantee for every version and configuration.

**The second check is materially different.** After obtaining a model and adding a blocking clause to the same default solver, the observed check uses SMT search with arithmetic counters, including arithmetic feasibility and bound propagation. A fresh solver containing the blocker from the outset takes the tactic route again. Z3’s [combined solver](https://raw.githubusercontent.com/Z3Prover/z3/z3-4.16.0/src/solver/combined_solver.cpp) distinguishes nonincremental and incremental use. A uniqueness experiment must report which was measured.

The following are actual receipts from separate processes, with a 30-second timeout and unchanged default seeds. D/C/P mean decisions/conflicts/propagations; SAT P sums binary and n-ary propagation counters, while SMT P uses its reported total, without adding the binary subset twice.

| Book board | First default check | Same solver + blocker | Fresh default solver + blocker |
|---|---|---|---|
| 5×5 | SAT; D5/C1/P93 | UNSAT; D18/C14/P201 | UNSAT; D9/C6/P124 |
| 7×7 | SAT; D11/C6/P428 | UNSAT; D266/C96/P2245 | UNSAT; D10/C7/P401 |
| 9×9 | SAT; search counters absent | UNSAT; D382/C113/P2785; one restart | UNSAT; search counters absent |

Absent counters mean unavailable in that receipt, not measured zeros. The 9×9 first/fresh verbose route was not captured; its simplification counters support preprocessing activity but do not independently identify every internal step. These three boards are not a solver difficulty benchmark. Raw results and hashes are in [MEASUREMENTS.md](MEASUREMENTS.md).

### What the search machinery means

Both SAT and SMT paths use conflict-driven Boolean search. Clauses propagate literals; decisions extend the assignment; conflicts produce explanations; resolution-based conflict analysis produces learned clauses and can trigger backjumps. Z3 also supports chronological backtracking policies. Its propositional implementation includes watched literals, activity-based branching with VSIDS and other supported policies, cached phases, restart policies, and first-UIP analysis. These are mechanisms and configurable policies, not a claim that every short run exercises all of them. Inspect the pinned [SAT search implementation](https://raw.githubusercontent.com/Z3Prover/z3/z3-4.16.0/src/sat/sat_solver.cpp) and [configuration](https://raw.githubusercontent.com/Z3Prover/z3/z3-4.16.0/src/sat/sat_config.cpp).

Two watches avoid rescanning every clause after every assignment; binary clauses often use specialized representations. Activity prioritizes variables implicated in recent conflicts. Phase saving/caching reuses remembered truth values. Restarts discard part of the trail while retaining useful clauses; they do not restart the mathematical problem from ignorance. First-UIP learning is a standard conflict-analysis strategy, with possible further minimization and theory explanations in a full solver.

When arithmetic survives preprocessing, a CDCL(T) core exchanges assignments and explanations with arithmetic reasoning. Rational linear feasibility can use simplex-style tableau operations; integer arithmetic requires additional integrality reasoning such as cuts and branching. Calling the entire process “simplex solving Queens” erases Boolean search and the finite reductions. The relevant architecture and arithmetic distinctions appear in [Programming Z3, §§3.2, 6.1–6.2](https://z3prover.github.io/papers/programmingz3.html).

### Reproducible measurement and honest tracing

[INSTRUMENTATION.md](INSTRUMENTATION.md) contains the complete runnable Python script. It extracts `five`, `seven`, `nine` from `App.tsx`, preserves directed-neighbour assertions, hashes inputs/formulas, validates placements, records every statistics key, and runs first SAT, incremental blocked and fresh blocked queries. Execute one board/mode per process:

```sh
PYTHONDONTWRITEBYTECODE=1 /Users/joeywilkes/Desktop/scripts/Queens/.local/venv/bin/python measure_queens.py --app /Users/joeywilkes/Desktop/scripts/queens-model-assessment/.worktrees/decision-models-refresh/src/App.tsx --board seven --mode default --verbose 10
```

Repeat for all three boards and modes: `default` is the production syntax with `Solver()`; `fd` keeps that syntax but uses `SolverFor('QF_FD')`; `pb` uses `PbEq` with `QF_FD`. All nine configurations were run successfully. Add `--inspect-tactics` for explicitly labelled diagnostic applications of `simplify`, `lia2card`, `lia2pb`, `pb2bv`, and `card2bv`; applying a tactic yourself is not evidence that the default solver used that exact composition. See the [official tactic descriptions](https://microsoft.github.io/z3guide/docs/strategies/summary/).

The essential uniqueness/statistics kernel is:

```python
result = s.check()
before = {k: s.statistics().get_key_value(k) for k in s.statistics().keys()}
if result == sat:
    m = s.model()
    values = [is_true(m.eval(b, model_completion=True)) for b in cells]
    block = Or([b != BoolVal(v) for b, v in zip(cells, values)])
    s.add(block)
    second = s.check()
    after = {k: s.statistics().get_key_value(k) for k in s.statistics().keys()}
```

Preserve raw dictionaries. Do not subtract counters across changed engines or treat `mk clause` as a learned-clause counter. `--clauses` enables `clause_proof` and an `OnClause` callback, preserving clause/proof/dependency events; our diagnostic produced assumption, Tseitin, SMT, RUP and deletion events. Count classified RUP inferences only as RUP inferences, not all 1-UIP clauses. Enabling it changed the observed first-check path. The [official proof-log guide](https://microsoft.github.io/z3guide/programming/Proof%20Logs/) explains the event distinctions.

`statistics()` supplies aggregate observations, `verbose=10` supplies implementation diagnostics, and neither supplies a complete historical trail with every reason and backtrack. Post-check `trail()`/`trail_levels()` are snapshots. Debug trace tags and proof logging are version/build dependent; discover supported parameters and retain stderr rather than promising an undocumented switch. For an exact Z3 trail, instrument the pinned C++ assignment/reason/conflict/backjump sites and retain preprocessing mappings. That is a separate engineering project.

For the initial release, replay the actual reference-CDCL run in [REFERENCE_CDCL.md](REFERENCE_CDCL.md) and [REFERENCE_TRACE.md](REFERENCE_TRACE.md). It solves an equivalent, explicit pairwise CNF with first-UIP learning. This is more honest and comprehensible than synthesizing a supposed Z3 chronology from counters. Its permanent caption is **“Reference CDCL execution · pairwise encoding”**; the neighbouring measurement view says **“Recorded Z3 execution · version and configuration”**.

## 3. Nine-chapter curriculum

Use the book’s 7×7 partition throughout, coordinates `r1c1` through `r7c7`, and solution columns `[3,1,6,2,4,7,5]`. Keep solutions hidden until the relevant lesson. Each chapter has a short lede, one main visual, one manipulation, one written derivation, and a question whose answer can be checked locally. “Next inference” advances computation; scrolling only reveals explanations.

### Chapter 1 — A board is a proposition

**Exact lede:** “Every square asks a yes-or-no question: does it contain a queen? The puzzle becomes one proposition whose satisfying assignments are exactly the legal boards.”

**Objective:** construct the variables and distinguish an assignment from a satisfying assignment.

**Mathematics:** let V=[7]×[7], with regions forming a partition of V into seven nonempty sets. For each cell introduce qᵣ꜀∈{false,true}; its indicator is [qᵣ꜀]∈{0,1}. Require indicator sum 1 on every row, column and region, and ¬qᵤ∨¬qᵥ for touching neighbours. Prove equivalence by translating a legal placement into its incidence assignment and reversing the construction.

There are 2⁴⁹ unconstrained assignments. Exactly one per row leaves 7⁷ placements; adding column uniqueness leaves 7!=5040 permutations, before region and local-diagonal restrictions. These count different sets; they are not predicted numbers of solver decisions.

**Visual:** show the empty regional board with letters and one selected square. Tapping `r1c3` connects that cell to a `q₁₃` truth tile. A three-stage set diagram shows all assignments → row selections → permutations, with exact counts. The reader places two queens in one row, sees the corresponding equality evaluate to 2=1, then repairs it. No SAT jargon appears until the displayed formula has a witness.

**Check:** explain why 49 Boolean variables do not mean 49 queens. Sources: P1, P2 and optional P12 below.

### Chapter 2 — Exactly one, written as clauses

**Exact lede:** “Exactly one combines two claims: at least one square is occupied, and no pair is occupied together. Different clause encodings express the same choices while giving the solver different auxiliary structure.”

**Objective:** write CNF and compare precisely specified encodings.

**Mathematics:** a literal is x or ¬x; a clause is their disjunction; CNF is a conjunction of clauses. For m cells, exactly-one is `(x₁∨…∨xₘ) ∧ ∧ᵢ<ⱼ(¬xᵢ∨¬xⱼ)`: `1+binom(m,2)` clauses, no auxiliaries.

Sinz’s at-most-one chain uses m−1 auxiliaries sᵢ. Include `(¬x₁∨s₁)`, `(¬xₘ∨¬sₘ₋₁)`, and, for 2≤i≤m−1, `(¬xᵢ∨sᵢ)`, `(¬sᵢ₋₁∨sᵢ)`, `(¬xᵢ∨¬sᵢ₋₁)`. This is 3m−4 AMO clauses for m≥2; add one ALO clause for 3m−3. Handle m=1 with its single unit clause. The s variables need only support a valid extension; the one-directional chain does not define every s as an exact prefix OR.

Specify the commander variant rather than quoting an encoding-independent count. Split into groups Gⱼ of at most three, retain singleton groups, assert pairwise AMO inside each, `x→cⱼ` for each member, `cⱼ→∨Gⱼ`, and recursively exactly-one on commanders. For m≤3 use pairwise. Otherwise, with g=⌈m/3⌉ and sizes tⱼ,

`E(m)=m+g+Σⱼ binom(tⱼ,2)+E(g)`, `A(m)=g+A(g)`.

For a seven-cell row, pairwise uses 22 clauses/0 auxiliaries, sequential 18/6, this commander variant 20/3. Smaller formula size does not prove faster solving.

**Visual:** detach row 1 into seven cells while leaving a locator on the board. Switching encoding redraws pairwise exclusion arcs, a prefix chain, or a 3/3/1 commander tree. Counters distinguish original variables, auxiliary variables, clauses and literal occurrences. Clicking a clause highlights exactly its board cells; auxiliary nodes remain outside the board. Also expose “generated clauses” versus “after deduplication”: the full seven-board reference CNF generates 664 clauses and retains 513 distinct clauses.

**Check:** why can an auxiliary variable be true without adding a queen? Sources: P3, P4, P5.

### Chapter 3 — Propagation reaches a fixed point

**Exact lede:** “Some consequences require no guess. Once all but one literal in a clause are false, the remaining literal must be true.”

**Objective:** execute unit propagation and understand both its soundness and its limits.

**Mathematics:** represent a partial assignment as a consistent set of signed literals. If a clause has no true literal and exactly one unassigned literal ℓ, add ℓ; if every literal is false, report conflict. On literal sets with a conflict top element ⊤, repeated rule application defines an extensive, monotone, idempotent closure U_F. Finiteness ensures termination. Before conflict, the forced closure does not depend on queue order; the first recorded reasons or conflict can differ. This closure is weaker than deriving every logical consequence.

For efficient implementation, watch two literals in a nonunit clause. When one becomes false, seek a nonfalse replacement; if none exists, the other watch either satisfies the clause, is forced, or is also false and exposes conflict. Watches implement the same inference rule; they are not a second mathematical constraint.

**Visual:** the reader chooses q₁₃ as a displayed temporary decision. Queue binary row/column/region/touching reasons. Each Next greys out one newly false cell with an ×, preserves its region letter, and names the clause beneath the board. Never grey out all globally impossible cells by an unseen solve. A separate clause ribbon shrinks as literals become false; two movable watch brackets teach the optimization. After the queue empties, show “Propagation paused; undecided cells remain.”

An optional labelled 5×5 inset shows singleton region C forcing r1c5 at level zero. It must not silently replace the main board.

**Check:** identify the unit literal in a five-literal clause with four false entries. Sources: P6 §2, P7 §2, P8 §4.5.1.

### Chapter 4 — Search is a sequence of justified states

**Exact lede:** “When propagation stops, the solver may choose an undecided literal. The choice starts a decision level; every consequence records the clause that forced it.”

**Objective:** read an execution trail without imagining a solver placing queens row by row.

**Mathematics:** use states `(M,F)`, with ordered trail M containing marked decisions and reason-annotated propagations. Decide appends an unassigned literal; UnitPropagate appends a unit consequence. Classical DPLL may backtrack to an unexhausted branch after conflict; CDCL additionally learns an entailed clause and backjumps to where it becomes asserting. An empty residual clause is conflict; a total satisfying assignment is SAT. A consistent incomplete trail is not yet a solution.

**Visual:** replay actual reference events, with levels as stacked bands, chronological order within bands, and decision markers distinct from reason links. Cells can become false before any queen appears in their row. Begin with q₁₁: row exclusions falsify every cell in region B, producing the first conflict. Offer a bookmark at event 66 to expose a genuine two-level trail. A reader may inspect a reason or undo a replay frame; they cannot alter a prerecorded decision while retaining the old continuation.

A “Try your choice” sandbox forks the state and reruns the reference kernel, creating a new labelled run. It does not pretend to continue the saved Z3 run.

**Check:** distinguish a decision from an implication even when both assign true. Sources: P7 §§2.3–2.5, P8 §4.3; P9 is implementation reading.

### Chapter 5 — A conflict has a graph

**Exact lede:** “A contradiction has a history. Following the clauses that forced its literals reveals a small set of assignments responsible for the failure.”

**Objective:** identify an implication graph and its first unique implication point.

**Mathematics:** nodes are trail assignments, with edges from the falsifying antecedent assignments of a reason clause to its implied literal. A false clause points to conflict ⊥. At the current decision level, a UIP is an assignment node on every path from that level’s decision to conflict; the first UIP is the one nearest the conflict. Resolving current-level reasons in reverse trail order until one current-level literal remains produces the first-UIP clause before optional minimization.

**Visual:** bookmark actual reference event 126. Its propagated u=q₂₇ excludes f=q₅₇, g=q₆₇, h=q₇₇ through column clauses. All three cells constitute region F, whose ALO clause is now false. Draw u branching to ¬f, ¬g, ¬h and then ⊥; retain the incoming history of u behind an Expand control. Here u is a propagated UIP, not the decision itself. A movable cut can be tested: highlight any decision-to-conflict path that avoids the selected cut node. The valid cut isolates u from the contradiction and proposes ¬u.

Keep graph and board selection synchronized. Show only the conflict’s ancestor cone initially, with a written adjacency list containing all nodes and reason IDs. The complete trace remains downloadable.

**Check:** why is choosing an arbitrary recent cell insufficient to identify a UIP? Sources: P8 §4.4.3, P10 §3.

### Chapter 6 — Learning is a proof, not a guess

**Exact lede:** “The solver turns the conflict into a new theorem about the board. Resolution removes intermediate literals while preserving logical consequence.”

**Objective:** verify the learned clause and understand backjumping.

**Mathematics:** from `(A∨p)` and `(B∨¬p)` derive `A∨B`. Soundness follows by cases on p: every assignment satisfying both parents satisfies their resolvent. Therefore a resolution-derived clause L satisfies F⊨L and F and F∧L have exactly the same models.

For the actual F conflict, start with `f∨g∨h`. Resolve with `¬u∨¬h` to obtain `f∨g∨¬u`, then with `¬u∨¬g` to obtain `f∨¬u`, then with `¬u∨¬f` to obtain `¬u`. These are recorded pivots 49, 42, 35 and input reason IDs 297, 296, 295. The learned clause is ID 517 in the zero-based prototype registry.

For a general asserting clause, backjump to the largest level among its literals other than its single current-level literal, or zero if there are none. The retained assignment makes that clause unit. In this example ¬q₂₇ is a unit theorem, so the run returns to level zero and propagates it.

**Visual:** three resolution rows display parent clauses, a crossed-out complementary pivot, and the exact resolvent. Next animates one elimination and updates the graph cut. Then the level stack collapses to zero; r2c7 receives an × with a “learned” reason. An optional schematic restart button clears nonroot assignments but keeps learned clauses. Label this schematic demonstration separately: the reference kernel does not implement restarts or activity heuristics.

**Check:** prove that adding the learned clause cannot remove a legal solution. Sources: P8 §§4.4.2–4.4.4; P6 §3 for activity, P8 §§4.5.2–4.5.4 for modern search policies.

### Chapter 7 — Confinement is a matching theorem

**Exact lede:** “Several regions can reserve several rows before any queen position is known. Counting the available rows gives a deduction that local unit propagation may miss.”

**Objective:** translate a human confinement argument into Hall’s theorem and distinguish inference strengths.

**Mathematics:** build a bipartite graph from regions to rows, adding an edge when the current candidate mask contains a cell of that region in that row. Any completion induces a matching covering the regions. Hall’s theorem says such a matching exists exactly when every region subset K has |N(K)|≥|K|. This criterion is sufficient for the row-region matching abstraction, not for the full Queens puzzle with columns and touching constraints.

If |N(K)|<|K|, completion is impossible. If |N(K)|=|K|, every row in N(K) is used by a region in K, so candidates of other regions in those rows are impossible. Proof: |K| queens require distinct rows, exhausting |K| available rows.

**Visual:** show a clearly labelled temporary hypothesis ¬q₃₁. On the actual seven-board, regions A and B are then confined to rows 1 and 2. Outline those regions and bracket the two rows; animate two region tokens matching to two row slots. Cross out the six C cells there: r1c6–7 and r2c4–7. The board and bipartite graph update together. Removing the hypothesis removes this particular argument’s stated premise.

The paired “Run unit propagation” control starts from exactly that hypothesis using the pairwise CNF. It adds no further literals: there are no initial unit clauses, and setting this one cell false creates none. A matching propagator could derive the confinement immediately; CDCL may discover equivalent information through decisions and learning. Do not claim the production encoding automatically runs Hall filtering.

**Check:** explain why a perfect region-to-row matching need not satisfy column restrictions. Source: P11; the Queens specialization and counterexample to UP strength are independently checked here.

### Chapter 8 — A unique solution is an UNSAT theorem

**Exact lede:** “Finding one solution proves existence. To prove uniqueness, ask whether any different placement can satisfy the same rules.”

**Objective:** formulate the blocking query and distinguish a verdict, core and certificate.

**Mathematics:** for a complete Boolean model M, define `B_M=∨ᵥ(qᵥ≠M(qᵥ))`. It is false exactly on M. Thus M is the unique cell assignment satisfying F iff F(M) and F∧B_M is UNSAT. Block original board variables, not arbitrary auxiliary assignments. Because every legal board contains exactly n queens, `∨_{v∈Q(M)}¬qᵥ` is also a sufficient blocker under this model; display the general full-cell version first.

For the seven-board the shorter form is `¬q₁₃∨¬q₂₁∨¬q₃₆∨¬q₄₂∨¬q₅₄∨¬q₆₇∨¬q₇₅`. UNSAT certifies uniqueness relative to the encoded rules and partition. UNKNOWN does not. A core identifies an inconsistent subset; it is not by itself a derivation or necessarily minimal.

**Visual:** show the found placement, then an explicit “At least one of these choices must change” clause. Each literal points to its queen. Replay the reference blocked execution into a proof DAG whose leaves are original clauses plus the blocker, whose internal nodes are recorded resolutions, and whose root is the empty clause □. Collapse subproofs by default without omitting them from the data. A second panel reports the actual Z3 blocked result with engine/configuration and links to its receipt.

Explain certificate checking with a small RUP example: negate a proposed learned clause and use unit propagation to reach conflict. DRAT generalizes admissible additions using RAT and allows deletions; it preserves satisfiability rather than requiring every RAT addition to be an ordinary implicate. A DRAT checker validates a CNF proof log, not a bare Z3 statistics file. Z3 proof mode needs a separate configured run; do not label its native proof object “DRAT” without conversion and successful checking.

**Check:** why does blocking only auxiliary values fail to prove board uniqueness? Sources: P2 §5.1, P13 §§2–3 and Fig.1, P14 §6.2.

### Chapter 9 — Which route did this Z3 run take?

**Exact lede:** “The mathematical model does not determine one fixed implementation path. Z3 can compile finite counting constraints into Boolean search or retain arithmetic reasoning, and its recorded statistics tell us which work was visible.”

**Objective:** connect the preceding mathematics to the production syntax without inventing a universal pipeline.

**Mathematics:** definitional CNF introduces auxiliary names for subformulas. For example `t↔(a∧b)` contributes `(¬t∨a)∧(¬t∨b)∧(t∨¬a∨¬b)`. With the root asserted, F(x) iff ∃y.T(F)(x,y); equisatisfiability after extending variables is the relevant claim. Tseitin conversion handles Boolean structure; cardinality compilation is an additional choice.

In DPLL(T), propositional atoms may stand for arithmetic predicates. For the optional demonstration `a↔x≤0`, `b↔x≥1`, the Boolean assignment a=b=true is consistent propositionally but inconsistent over integers or reals; arithmetic contributes the valid clause ¬a∨¬b. Simplex checks rational feasibility; integrality needs further reasoning when rational feasibility alone is insufficient.

**Visual:** a pipeline diagram is driven by the saved verbose receipt, not decorative arrows. Select first check, incremental uniqueness, or fresh blocked run to highlight observed stages and expose exact counters. Compare production `Sum(If)` with explicit PB/QF_FD in an advanced disclosure. Auxiliary nodes from compilation stay in a separate lane with mappings to original cells where known. Unknown mappings say “internal variable,” without assigning them invented board semantics.

The arithmetic inset draws a number line with x≤0 and x≥1 and returns the theory-conflict clause to the Boolean graph. It is labelled a transfer example, not an assertion that this exact conflict occurred in the Queens run.

**Check:** explain why a SAT-core counter is evidence about that run but not a promise about a later incremental call. Sources: P1, P2 §§3.2 and 6, P5 §1, P14 §§4.3, 9.2.3, plus pinned source links above.

## 4. Verified paper map

All entries below were checked on the web on 14 October 2026. Section numbers refer to the linked versions; the current HTML tutorials can differ from printed editions. Draw new diagrams of the stated concepts, credit adaptations, and do not copy a paper’s figure wholesale.

| ID / status | Verified work and locator | Use |
|---|---|---|
| **P1 · verified** | Leonardo de Moura and Nikolaj Bjørner, **Z3: An Efficient SMT Solver**, TACAS 2008, LNCS 4963, 337–340. [Microsoft publication record](https://www.microsoft.com/en-us/research/?p=825739); DOI `10.1007/978-3-540-78800-3_24`. Architecture paper, whole short paper. | Chapters 1, 9; historical architecture, not current parameter defaults. |
| **P2 · verified** | Nikolaj Bjørner, Leonardo de Moura, Lev Nachmanson, Christoph M. Wintersteiger, **Programming Z3**, 2019, *Engineering Trustworthy Software Systems*, LNCS 11430, 148–201, DOI `10.1007/978-3-030-17601-3_4`. [Publisher metadata](https://link.springer.com/chapter/10.1007/978-3-030-17601-3_4); [author HTML](https://z3prover.github.io/papers/programmingz3.html): §§2, 3.2, 4.6.1–2, 5.1, 6.1.1, 6.2.3. | Chapters 1, 8, 9; syntax, arithmetic, measurements, blocking, cores. |
| **P3 · verified** | Carsten Sinz, **Towards an Optimal CNF Encoding of Boolean Cardinality Constraints**, CP 2005, LNCS 3709, 827–831, DOI `10.1007/11564751_73`. [Author PDF](https://www.carstensinz.de/papers/CP-2005.pdf), Definition 1, §2, Fig.1, Theorem 1. | Chapter 2; projection semantics and sequential counter. |
| **P4 · verified** | Will Klieber and Gihwon Kwon, **Efficient CNF Encoding for Selecting 1 from N Objects**, International Workshop on Constraints in Formal Verification, 2007. [Author-hosted manuscript](https://www.cs.cmu.edu/~wklieber/papers/2007_efficient-cnf-encoding-for-selecting-1.pdf), §§2–2.2, Figs.1–4. Year/venue corroborated by P15’s bibliography, printed p.846. | Chapter 2; commander hierarchy. |
| **P5 · verified** | G. S. Tseitin, 1968 original in *Zapiski Nauchnykh Seminarov LOMI* 8, 234–259; [original publication record](https://www.mathnet.ru/eng/znsl2268). **On the Complexity of Derivation in Propositional Calculus**, [English reprint](https://yurichev.com/mirrors/SAT/Tseitin/Tseitin1968_en.pdf), §1, especially printed p.467. | Chapters 2, 9. Keep original year distinct from translated/reprinted pagination. |
| **P6 · verified** | Matthew W. Moskewicz, Conor F. Madigan, Ying Zhao, Lintao Zhang, Sharad Malik, **Chaff: Engineering an Efficient SAT Solver**, DAC 2001, 530–535. [Princeton PDF](https://www.princeton.edu/~chaff/publication/DAC2001v56.pdf), §2 Boolean constraint propagation and §3 VSIDS. | Chapters 3, 6; watches and activity. |
| **P7 · verified** | Robert Nieuwenhuis, Albert Oliveras, Cesare Tinelli, **Solving SAT and SAT Modulo Theories: From an Abstract Davis–Putnam–Logemann–Loveland Procedure to DPLL(T)**, JACM 53(6), 937–977, 2006, DOI `10.1145/1217856.1217859`. [Author manuscript](https://homepage.divms.uiowa.edu/~tinelli/papers/NieOT-JACM-06.pdf), §§2.3–2.5, §3. | Chapters 3–4, 9; transition-system foundation and theory extension. |
| **P8 · verified** | João Marques-Silva, Inês Lynce, Sharad Malik, **Conflict-Driven Clause Learning SAT Solvers**, *Handbook of Satisfiability*, IOS Press, 2009, Chapter 4, 131–153, DOI `10.3233/978-1-58603-929-5-131`. [Chapter PDF](https://www3.cs.stonybrook.edu/~cram/cse505/Fall20/Resources/cdcl.pdf), §§4.3–4.5; Fig.4.2, Table4.1, Fig.4.3. | Chapters 3–6; redraw implication/cut/resolution examples using Queens literals. |
| **P9 · verified** | Niklas Eén and Niklas Sörensson, **An Extensible SAT-solver**, SAT 2003 proceedings, LNCS 2919, 502–518, published 2004, DOI `10.1007/978-3-540-24605-3_37`. [Publisher](https://link.springer.com/chapter/10.1007/978-3-540-24605-3_37). | Chapter 4 implementation appendix; whole paper. Do not conflate conference and publication years. |
| **P10 · verified** | João P. Marques-Silva and Karem A. Sakallah, **GRASP: A Search Algorithm for Propositional Satisfiability**, *IEEE Transactions on Computers* 48(5), 506–521, 1999, DOI `10.1109/12.769433`. [Paper PDF](https://web.stanford.edu/class/cs357/SS99.pdf), §3 conflict analysis. | Chapter 5; historical conflict graphs/UIPs, not a claim that GRASP and current Z3 use identical policies. |
| **P11 · verified** | P. Hall, **On Representatives of Subsets**, *Journal of the London Mathematical Society* s1-10(1), 26–30, 1935, DOI `10.1112/jlms/s1-10.37.26`. [Publisher record](https://londmathsoc.onlinelibrary.wiley.com/doi/abs/10.1112/jlms/s1-10.37.26). | Chapter 7; theorem attribution. The displayed Queens proof is supplied explicitly, without an unverified figure number. |
| **P12 · verified** | Donald E. Knuth, *The Art of Computer Programming*, Volume 4, Fascicle 6, **Satisfiability**, Addison-Wesley, 2015; §7.2.2.2. [Author contents/publication page](https://www-cs-faculty.stanford.edu/~knuth/taocp.html). | Optional Chapters 1–4 reading. No unverified Queens exercise number is assigned. |
| **P13 · verified** | Nathan Wetzler, Marijn J. H. Heule, Warren A. Hunt Jr., **DRAT-trim: Efficient Checking and Trimming Using Expressive Clausal Proofs**, SAT 2014, LNCS 8561, 422–429. [Author PDF](https://www.cs.cmu.edu/~mheule/publications/drat-trim.pdf), §§2–3, Fig.1; [project bibliographic record](https://www.cs.utexas.edu/~marijn/drat-trim/). | Chapter 8; RUP/RAT distinction, proof log and empty clause. |
| **P14 · verified** | Bjørner, Clemens Eisenhofer, Arie Gurfinkel, Nuno P. Lopes, de Moura, Nachmanson, Wintersteiger, **Z3 Internals (Draft)**, undated evolving author draft. [HTML](https://z3prover.github.io/papers/z3internals.html), §§2.1, 3.1, 3.3, 4.3, 6.2, 9.2.3. | Chapters 8–9; compilation, arithmetic, certificates. Cite access date, not a fabricated fixed publication year. |
| **P15 · verified** | Ian P. Gent, Christopher Jefferson, Peter Nightingale, **Complexity of n-Queens Completion**, *JAIR* 59, 815–848, 2017, DOI `10.1613/jair.5512`. [Author manuscript](https://eprints.whiterose.ac.uk/id/eprint/141513/1/n_queens_jair.pdf), §5.1, printed p.838. | Optional encoding sidebar: actual SAT use of commander constraints in classical Queens. Full diagonals differ from regional Queens; its complexity theorem is not transferred to this variant. |
| **P16 · verified** | Niklas Eén and Niklas Sörensson, **Translating Pseudo-Boolean Constraints into SAT**, *Journal on Satisfiability, Boolean Modeling and Computation* 2, 2006, DOI `10.3233/SAT190014`. [Publisher article](https://journals.sagepub.com/doi/10.3233/SAT190014). | Chapter 9 further reading on MiniSat+ and alternative PB translations; whole paper. |

The historical Davis–Putnam reference is Martin Davis and Hilary Putnam, **A Computing Procedure for Quantification Theory**, JACM 7(3), 201–215, 1960, [paper](https://web.stanford.edu/class/cs357/DP60.pdf). The later DPLL paper is Martin Davis, George Logemann and Donald Loveland, **A Machine Program for Theorem-Proving**, CACM 5, 394–397, 1962; its identity is verified in P2’s publisher bibliography. These are optional history, not substitutes for P7’s teachable modern state system.

## 5. Information architecture and implementation contract

### Place it inside the book

Choose **(b)**, a new book part, with route `#/how-z3-solves-queens` immediately after Queens rules. The existing reading column, local contents, navigation, typography, themes, region letters and board styles already support technical reading. Readers can move from the puzzle to the solver mathematics without learning a second interface. Rebuilding the standalone Atlas would duplicate the design system, board registry and provenance plumbing while retaining an unrelated audience/transfer structure.

Use nine deep-linkable section IDs `z3-variables` through `z3-engine`; adapt the book’s existing in-page navigation without overwriting its route hash. Offer “Read the explanation” as the default and “Open the experiment” at the end. Keep source receipts in collapsible details beside the claim they support. One engine caption per visual is enough; a glossary defines SAT, UNSAT, clause, trail and theory at first use.

The book’s current `BoardDiagram` always renders its saved solution; it cannot be reused unchanged for an empty or partial trail. Extract a shared board renderer accepting explicit states, while preserving the assessment chapter’s current output. Reuse BoardReplay’s manual transport, reduced-motion and visibility-pause conventions, but not its “Model choice”/“Forced by harness” meanings. A solver trail needs distinct decision/propagation terminology.

### Components and data

| Component | Required props / responsibility |
|---|---|
| `Z3TeachingPart` | `board`, `chapters`, `receipts`, `referenceTrace`; owns section and scenario state. |
| `ConstraintBoard` | `regions`, `assignments`, `selectedCell`, `highlightCells`, `onSelect`, `interactive`; unassigned/true/false rendered distinctly. |
| `ClauseEncodingLab` | `cells`, `encoding`, `onEncodingChange`; deterministic clauses, auxiliary mapping, before/after-dedup counters. |
| `PropagationPlayer` | `cnf`, `initialLiterals`, `events`, `cursor`, `onStep`; shows queue, reason, board and closure status. |
| `CDCLPlayer` | `trace`, `cursor`, `bookmark`, `onSeek`; synchronized board, level stack and reason selection. |
| `ImplicationGraph` | `nodes`, `edges`, `conflictId`, `cut`, `selectedNode`; SVG plus equivalent ordered text. |
| `ResolutionProof` | `parents`, `pivots`, `resolvents`, `cursor`; never invents intermediate clauses. |
| `ConfinementLab` | `board`, `premises`, `regionSubset`, `candidateMask`; matching, Hall counts, explained exclusions. |
| `UniquenessPanel` | `model`, `blocker`, `blockedReceipt`, `proof`; identifies original-variable projection. |
| `EngineReceipt` | `version`, `configuration`, `inputHash`, `queryKind`, `statistics`, `artifacts`; raw counter names and explicit unavailable values. |

Store a shared immutable `BoardSpec={id,size,regions:string[][],coordinateBase:1,partitionSha256}`. Never use a saved solution as the state of a trace. All cell variable IDs use `id=(row−1)*size+column`; signed integers encode literals, and auxiliary IDs exceed size². Preserve input clause families and all duplicate source references when deduplicating.

The publishable trace contract is:

```ts
type Trace = {
  schemaVersion: 1; boardId: string; partitionSha256: string;
  engine: { name: 'reference-cdcl'; version: string; codeSha256: string };
  encoding: 'pairwise'; cnfSha256: string;
  variables: { id: number; cell?: [number, number]; definition?: string }[];
  clauses: { id: number; lits: number[]; sources: string[] }[];
  initialClauseIds: number[];
  events: Event[];
  query: 'existence' | 'blocked'; blockerId?: number;
  result: 'sat' | 'unsat' | 'unknown';
};
type Event = {
  seq: number;
  kind: 'decide'|'propagate'|'conflict'|'learn'|'backjump'|'sat'|'unsat';
  level: number; literal?: number; reasonClauseId?: number;
  conflictClauseId?: number; learnedClauseId?: number;
  resolution?: { parentClauseId: number; pivot: number; result: number[] }[];
  targetLevel?: number; removed?: number[];
};
```

For learn events, `conflictClauseId` starts the resolution accumulator; each listed parent/pivot produces `result`, ending at `learnedClauseId`. For the blocked trace, initial clauses include first-run lemmas only if their derivations accompany the bundle. Maintain snapshot checkpoints every 32 events for fast seeking; snapshots are derived caches, not authoritative alternative histories. The prototype currently embeds complete trails; a build adapter can emit this compact schema.

Precompute and validate the canonical replay at build time; a browser worker may run the same small reference kernel for forks. Initially use the supplied full-scan kernel with deterministic first-unassigned/positive decisions, saturation before decisions, first-UIP resolution and asserting backjump. Its lack of watches, activity, restarts and deletion affects speed and search order, not the validity of its CDCL deductions. Teach optimized policies as separately labelled mechanisms. A future C++-instrumented Z3 trace must use another engine discriminator and carry expression/preprocessing mappings, not masquerade as this schema’s reference engine.

### Mobile, accessibility and acceptance

At 320–430px, use one reading column and a 5×5 or 7×7 board fitted to available width. The seven-board cells can be about 36px at 320px; provide separate 44px Previous/Next-cell inspector controls rather than promising 44px targets for every cell. For 9×9 advanced views, retain a named horizontal scroll area or an explicit enlarged view. Never shrink literal text into unreadability.

On desktop, board and explanation may sit side by side; on phones, show board, one-sentence current inference, transport, then expandable trail/graph. Keep only the active figure sticky, disable sticky layouts on short viewports, and avoid nested vertical scroll traps. Graphs collapse to the selected ancestor cone with an accessible text list; retain the complete graph as an optional scrollable view.

Use native buttons, visible focus, arrow-key board navigation, region letters, queen/×/unassigned symbols, and written coordinates. Announce one completed inference with `aria-live="polite"`, not every animation tick. Supply a plain written proof and full event table; never require dragging a cut or distinguishing colors. Reduced-motion mode uses instant state changes and manual stepping. Autoplay is opt-in, pausable, and stops when hidden. Scroll must not move keyboard focus or silently commit decisions. All equations need readable text/MathML equivalents.

Release acceptance requires: exact partition/hash binding; validated row/column/region/touching models; reason clauses unit at enqueue time; every displayed conflict false; every resolvent checked; learned clauses entailed; correctly restored state after backjump; blocker on original variables; blocked proof ending at □; unavailable statistics displayed accurately; keyboard-only completion; 320/390/430px and 200% zoom checks; and a useful static reading/print version.

This design’s mathematical validation already covers 27 Z3 queries, independent uniqueness enumeration on all three boards, 14 reference learned clauses, complete reason/resolution replay, and six Hall exclusions. UI implementation, browser/device verification, a checked DRAT artifact, and a full internal Z3 historical trace remain future implementation work. They must not be implied by the current research deliverable.
