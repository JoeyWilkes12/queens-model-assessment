# If resuming

State: COMPLETE scientific critique, 4,763 words, in DELIVERABLE.md; full self-review in REVIEW.md. All requested sections, calculations appendix, prioritized experiments and10 exact wording fixes present. No new inference and no project-source changes.

Next exact step for Claude/orchestrator: read DELIVERABLE.md, then inspect SOURCE-SNAPSHOT.md and wording-quotes.json before applying wording changes to the actively edited book. Prioritize missing baseline (greedy4/9), nineboard denominator/tie, forced propagation, and calibration. New experiments are proposals only; do not assume this critique authorizes calls.

Reproduce locally from this directory: python3 -I calculations.py > calculation-output.txt; python3 -I validate_artifacts.py. Standard library only, no network. calculation-results.json, cell-probability-labels.json and validation-results.json hold reviewed data. source-hashes.json covers23 files; snapshot frozen2026-10-14T23:17:48-06:00. Validation passed23:18:33 without source drift. Source edits by other work continued during this audit; no claim that those edits belong to this run.

Main quantified findings: Jev1/9vsSubQ2/9 distinctboards, both10/90 attempts; CP95 intervals0.28–48.25%vs2.81–60.01%; pairedMcNemar p1. GreedyMRV/row-major4/9 including7×7and9×9; random expectation1.5703/90. Jev local solvedpaths allcellsforced. NonforcedChoice cells41/121vsmeanp.4829 and40/120vs.4490. JevAAHLE ECE.4019, WildGuard underconfidence. Newpanel64boards/size×2modes gives192boards384trajectories,<=4992calls, with multiplicity/heterogeneity caveats.

Gotchas: strict writes inside this artifact directory only; never modify repository files, commit/push/merge or call model providers in this run. Do not run harness prepare/run/audit defaults. Final usage check:72%5h/70%weekly left. [empower] usage (as of Wed 23:18): 5h window 28% used / 72% left, resets Thu Oct 15 03:37 | weekly 30% used / 70% left, resets Mon Oct 19 23:07 Final must repeat full DELIVERABLE.md and start exact usage line.

Repository/worktree: /Users/joeywilkes/Desktop/scripts/queens-model-assessment/.worktrees/decision-models-refresh; branch claude/decision-models-refresh; HEAD5fdfb5b57d7bdac6a4b25b21c9f019ce19e12f18; no upstream tracking branch shown by git branch -vv. HEAD advanced concurrently; this run did not commit. Artifact directory: /Users/joeywilkes/Desktop/scripts/queens-model-assessment/.worktrees/decision-models-refresh/.empower/2026-10-14-scientific-critique.

Final update 2026-10-14T23:20:24.267440-06:00: current source now differs in App.tsx and SubQAssessment.tsx, including adoption of suggested wording/baseline. Ten quotes describe frozen SOURCE-SNAPSHOT.md, not latest source. Statistical/harness inputs unchanged. Final HEAD 5fdfb5b57d7bdac6a4b25b21c9f019ce19e12f18. Usage: [empower] usage (as of Wed 23:20): 5h window 30% used / 70% left, resets Thu Oct 15 03:37 | weekly 31% used / 69% left, resets Mon Oct 19 23:07

Final appendix code parses; deliverable words 4771. [empower] usage (as of Wed 23:20): 5h window 30% used / 70% left, resets Thu Oct 15 03:37 | weekly 31% used / 69% left, resets Mon Oct 19 23:07
