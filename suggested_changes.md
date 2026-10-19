# Suggested changes after PR #2 review

Reviewed by Codex (GPT-6), 19 October 2026.

## Contents

- [Scope and disposition](#scope-and-disposition)
- [Zero-success bars](#zero-success-bars)
- [Empty-receipt completeness check](#empty-receipt-completeness-check)
- [Validation](#validation)
- [Review limits](#review-limits)

## Scope and disposition

- PR: [Earlier generations complete, Evals/Cost views, board receipts, cost per request, SubQ cost](https://github.com/JoeyWilkes12/queens-model-assessment/pull/2).
- Branch: `claude/legacy-panel-trajectories`.
- Application commit reviewed: `34998568e31b630ebf87d01e12ae716b88e3b042`.
- Comparison base: `origin/main`, `92657f70aa943c50fd4f0952c0953476e6ee0ed4`.
- [Separate Codex review and inline comments](https://github.com/JoeyWilkes12/queens-model-assessment/pull/2#pullrequestreview-5578468682).

No P0, P1 or P2 correctness issue was confirmed in the reviewed changes or current evidence. Retain Claude's implementation and address the two P3 findings below in a follow-up release. No application code or evidence was changed during this review. This document is the only new tracked file.

The PR was created with Claude's supplied script before this review. Claude's PR description and all 22 original inline comments were preserved. Merging still requires the user's explicit approval of this PR; merging to `main` triggers the existing GitHub Pages deployment workflow.

## Zero-success bars

**P3 — a zero solved count draws a positive success bar.**

Location: [src/Scoreboard.tsx](src/Scoreboard.tsx), `PerfMark`, line 143 at the reviewed commit.

The new Cost view uses `Math.max(2, fraction * 100)` for its secondary success bar. When `fraction` is zero, it still renders a 2% green fill. The text labels remain correct.

Reproduction from the committed data:

1. Select Cost, then Decision models, then 9×9.
2. Jev and SubQ each solved **0/3** on Original 9 boards and **0/64** on New 192-board panel.
3. Each zero count nevertheless yields a 2% fill under the current expression.

Suggested change: omit the fill at zero or preserve zero width; retain any minimum visible width only for positive fractions. For example:

```tsx
style={{ width: `${fraction > 0 ? Math.max(2, fraction * 100) : 0}%` }}
```

Acceptance: zero solved boards produce an empty success track; positive values and numeric labels retain their intended presentation.

## Empty-receipt completeness check

**P3 — the verifier can accept a completely omitted decision-model receipt list.**

Location: [scripts/verify-board-receipts.mjs](scripts/verify-board-receipts.mjs), lines 131–134 at the reviewed commit.

The manifest-ID comparison runs inside `if (system.receipts.length)`. If a system's entire list is missing, that comparison is skipped. The later `panelTotals` comparison covers language models only, so it does not close the gap for Jev or SubQ.

Confirmed with an in-memory mutation; no evidence or source files were changed:

1. For `panel-9-05`, replace Jev's eight receipts with an empty list and zero that system's stored cost/request fields.
2. Subtract the removed cost and request count from the corresponding board and index totals.
3. Run the original verifier through an in-memory JSON loader supplying those altered objects.

Observed result:

```text
Removed 8 Jev receipts only in memory
PASS board receipts: 8419 checks across 36 boards
```

Suggested change: move the `every manifest record listed` comparison outside the nonempty guard so every system is checked, including systems with empty lists. Keep checks that require a first receipt or division by a count inside the guard.

Acceptance: the unmodified evidence still passes; the mutation above fails and names the missing Jev receipts. The checked-in data currently contains the complete lists, so this finding concerns the verifier's protection against future omissions.

## Validation

| Check | Result |
| --- | --- |
| `npm run build` | Passed: TypeScript and Vite production build. Vite reported a nonfatal bundle-size warning. |
| All eight `scripts/verify-*.mjs` scripts | Passed, including the board/trajectory adapters, receipt chains, failure comparisons, greedy trajectories, and both Z3 verifiers. |
| New board-receipt verifier | Passed: **8,438 checks across 36 boards**. |
| Z3 workbench | Passed using `.venv-z3/bin/python`, Z3 4.16, including exported SMT-LIB executions and enumeration checks. |
| `npm run evidence:check-public` | Passed: **0 files with private fields** in the checked public content. |
| `python3 -m unittest scripts/llm_trajectories/test_sequential.py` | Passed with the fake broker; no model requests. |
| `git diff --check origin/main...HEAD` | Passed for the application changes. |

Source and saved-data checks also covered routing, receipt links, queen coordinates and markings, replay adapters, cost grouping, chart denominators, account-block handling, and the cap changes. Gemini 2.5 batch receipt totals reproduce the published settlements: Pro **$1.54506**, Flash **$0.4819289**.

## Review limits

This was a local source and offline-evidence review, with parallel reviewers covering UI, data builders/cost calculations, scoreboard behavior and runner changes. No new model/API evaluation calls were made. The public-field check concerns current published files; it does not remove fields from historical Git objects.

Browser QA was not repeated, and no development server or deployment was started. Claude's browser checks remain the author's reported validation. The current PR checks reported success for both Socket checks; the repository's deployment workflow runs on pushes to `main`, rather than providing a PR build check.
