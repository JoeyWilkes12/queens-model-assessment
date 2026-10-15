# Evidence notes — checkpoint 1

Scope: source audit, not browser/rendered review. Data validate-data skill applied; user-specified Markdown/audit-only and no-provider-call scope supersedes app-building and parallel-model defaults. No delegation or external requests.

Repository: verified Git worktree /Users/joeywilkes/Desktop/scripts/queens-model-assessment/.worktrees/decision-models-refresh, branch claude/decision-models-refresh, HEAD 5da41c6. No applicable ancestor AGENTS.md files found by explicit ancestor checks. Read ~/.codex/memory.md and device-memory.md.

Read: trajectory protocol/report/research, all trajectories.py and replay.py and README, SubQ report and JSON top-level/families/protocols/budget summary, AA snapshot selected models and calibration bins; App ExecutiveSummary, CandidateEngineering, ScalePrimitives, MethodsSources and SubQAssessment relevant published prose. Earlier generation and diagnostic protocol/report main results and limits. Original comprehensive REPORT skim, primitives ASSESSMENT, scale ASSESSMENT skim; trajectory original REPORT byte-identical to public copy. Some long combined tool outputs truncated: use targeted reads for any exact citation before publication.

Consequential observations:
- Jev 10/90, one board (sequence-5-1 in raw/local); SubQ 10/90, two boards (sequence-5-2 and sequence-5-3 local only). All board/mode solve indicators are all-or-none across five attempts. No larger-board solves. Board denominator nine, three per size; modes paired, not independent boards.
- Jev 18 board/mode groups: modal trace agreement .4–1; exact probes 8/17 Choice-varying and 17/17 vector-varying, 9–10 distinct probability vectors per group. SubQ all 18 groups one trace, 44 repeated payload groups stable. Repeatability does not prove independence or lack of caching.
- Singleton transitions counted separately. Jev solved local sequence-5-1 with no non-forced CELL decisions: 4 region calls + 6 forced transitions. Strong confound for planning headline.
- trajectories.py hardcodes boards from historical corpus (79–92), schedule five repeats + raw/local (108–122), 90 in prepare/audit (113,255–256). New corpus requires explicit corpus loading, connectedness + symmetry validation, configurable modes/repeats/seed, dynamic totals. Ordering canonical A-Z/row-major at 55–68. stop 207–214, oracle judge only.
- Frozen SubQ requests are 754 scheduled, 739 sent, 736 HTTP200, 15 compatibility skips; not 754 successes. Split 18 logical tasks,36 calls,11 primary successes; different context. summary completed_unique_source_requests counts any record (replay.py:453), including failed/skipped, not successful coverage.
- Budget summary: estimated_known_usd .08695505, unresolved_reserve_usd .0589824, cap 4.5, reserve .0196608; billing_confirmed false. Headroom after reserves 4.35406255. One snapshot, do not sum.
- AA weights .125 omniscience accuracy + .125 nonhallucination + .25 HLE + .25 When2Call + .25 WildGuard F1. Snapshot retrieved_utc is 2026-10-15T05:01Z (=Oct14 23:01 MDT), date label local consistent. Need per-dataset calibration; pooled bins mix tasks and WildGuard has 2444 judged outputs despite 835 test examples. Do not infer independent n from bins. Jev HLE high confidence bin .9547 vs accuracy .11765. Underconfidence exists in WildGuard. No LLM calibration bins; SubQ absent. Distinguish vendor 61.7/57.9 claims from AA v1.0.

Next: run reproducible offline calculations for board CP intervals/power, survival/cell oracle labels, random/greedy policy, probability calibration and AA bin summaries, then draft critique.
