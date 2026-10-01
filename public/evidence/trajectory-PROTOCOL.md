# Jev empty-board trajectories and repeatability

Frozen before inference. This supplements the [earlier assessment](../2026-09-19-comprehensive/REPORT.md); it does not replace its results.

## Contents

- [Questions](#questions)
- [Corpus and conditions](#corpus-and-conditions)
- [Failure and restart](#failure-and-restart)
- [Repeatability controls](#repeatability-controls)
- [Version and cost](#version-and-cost)
- [Evidence and publication](#evidence-and-publication)

## Questions

Can Jev construct a unique Queens solution from an empty board using a color decision followed by a cell decision? Does repeating the same task change choices, distributions, or the complete ordered trace? Does code filtering immediate conflicts improve completion? Does sharing a request across independent questions change the decisions?

The earlier study executed one five-request fixed-row trajectory on the original 5×5 board. Its final answer was invalid. It never selected colors, restarted after failure, or repeated that trajectory.

## Corpus and conditions

Nine new synthetic boards: three each of 5×5, 7×7, and 9×9. Freeze generation seeds and certify exactly one solution using two different search orders. Exclude prior board symmetries, including renamed region labels. This is a small sample from the existing generator family: its 9×9 construction deliberately leaves two seeded regions as singletons. Size is not a human difficulty rating.

Two modes, each with five attempts on every board: 90 scheduled trajectories. Every attempt begins empty, even after a prior success. Model-visible state includes the letter matrix, explicit region cell lists, rules, and accepted placements. Region menus include unoccupied regions only. Cell menus include either every cell of the selected region (`raw`) or cells passing row/column/non-touch checks (`local`). No full-board candidates, globally viable move labels, hidden solution, or prior attempt results enter prompts. Both modes receive region membership scaffolding; `raw` is not fully unaided.

A singleton menu is recorded as a forced harness transition without inference. Forced transitions count separately from model decisions. There is no harness sampling of returned distributions: execute the returned Choice.

## Failure and restart

Record every local rule violated by a proposed cell. If locally legal, compare it against the sealed unique solution to decide whether the prefix remains extendable. Stop immediately on a local violation or globally unextendable prefix, save the trace, and start the next scheduled attempt empty. The oracle only grades/stops; it does not supply candidate filtering or tell the model which earlier move failed.

This measures construction on the first path, without backtracking. It does not test whether Jev can detect its own dead end or learn from feedback. On a uniquely solvable board, any off-solution cell makes the prefix unextendable. A color choice alone has no unique correct answer: any unoccupied color is permissible on a viable prefix.

Report solved, local-rule violation, globally unextendable prefix, no legal menu, malformed answer, infrastructure failure, and budget censoring separately. Attempt and cell success rates must not use successful HTTP responses as their denominator. Depth-specific rates are conditional on reaching that depth.

## Repeatability controls

Ten separate HTTP repeats of each empty-board color question and fixed-region-A cell question on each board. Serialize exact request bodies identically; do not add run IDs, nonces, fresh UID fields, feedback, or previous responses. Store both semantic distribution and wire-body hashes. Fresh stateless calls do not prove independent inference or eliminate upstream caching. Compare modal choice agreement, distinct distributions, probability ranges, and pairwise total variation. Repeated final solutions alone cannot show determinism because every board has one solution.

Five identical requests each batch the nine independent empty-board color questions against shared state. This is a separate treatment: shared unrelated boards can affect answers. Never batch a color decision with a cell decision that depends on its answer. Reverse cell-option insertion order in a separate three-repeat condition; preserve semantic option keys. Main trajectories run in external repetition blocks with four independent trajectories in parallel; dependent turns inside a trajectory remain sequential.

## Version and cost

Discover models, provider endpoints, prices, and supported parameters immediately before calls. Main requested ID is `typesafe/jev-1.13`; require the historical returned build `typesafe/jev-1.13-20260917`, TypeSafe only, and no provider/model fallbacks. One explicit dated-ID route probe establishes whether the returned build itself is accepted as an input ID. A newer version in live discovery is a separate cohort, not an automatic substitution. Never send inference to the latest alias.

Historical accounted spend including unreconciled reserves is $1.014599966; $1.985400034 remains under the original $3 budget. This stage reserves at most $0.50. A thread-safe ledger reserves conservative input cost before each call. Four concurrent requests may be in flight. Stop on unexpected provider/build, schema failure, API error, or reserve breach; do not automatically retry infrastructure errors. Save unmetered reserves rather than assume failed requests are free.

## Evidence and publication

Save corpus, sealed oracle, manifest, exact model-visible requests, raw responses, metadata, per-attempt ordered traces, reproducible audit, research links, and this question inventory locally. Publish sanitized requests/responses and deterministic outcomes in the existing assessment website, with a dedicated trajectory chapter. Keep private oracle files outside the public bundle; expose proposed placements only as model outputs.
