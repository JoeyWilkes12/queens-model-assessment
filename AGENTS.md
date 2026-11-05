# Queens model assessment

These project instructions supplement global instructions and explicit human
approvals.

## Reviewable PR stacks for evidence-heavy updates

For future updates with large receipt, image or generated-content diffs, default
to stacked PRs that separate evidence/content from the frontend. Keep ordinary
small changes in a single focused PR.

Use this order, omitting stages that are unnecessary:

1. **Compatibility prerequisites:** small importer, schema or validator changes
   needed to validate the new evidence. Keep existing snapshots and the active
   display compatible. Include a display-contract prerequisite here if the new
   data cannot pass checks without it.
2. **Evidence and content:** immutable receipts, images, plans, summaries,
   manifests, inactive snapshot catalogs, analysis reports and their scoped
   verification. Split this into more than one PR when that improves review.
3. **Frontend and activation, last:** components, navigation, chapter summaries,
   visualizations and the active evidence-index switch. In particular, keep
   activation of `public/evidence/local-qwen/index.json` with the final display
   PR, rather than exposing a new snapshot before its presentation is ready.

The first PR targets `main`; each subsequent PR targets its immediate parent
branch. This makes each Files changed view show only that layer. The final
frontend PR must not repeat the thousands of evidence files from its parents.

Each PR description must identify its base/head branches, parent and child PR
links when available, review order, changed path groups, evidence counts and
hash/manifest location, and validation performed for that layer. Link the final
frontend PR prominently so a reader can find the presentation changes quickly.

Every layer must pass applicable checks and leave `main` usable if merged on its
own in order. Generate an inactive snapshot candidate for the evidence layer;
preserve the current active index. Verify new-catalog fixtures against that
catalog, while current-index checks continue to describe the active snapshot.
Do not introduce intermediate broken references, unsupported schemas or
assertions that require an unmerged child PR. Validate the full stack before
requesting review of the final presentation.

After a parent merges, verify the remaining diff and update the child's base or
restack it as permitted. Account for squash merges; do not assume retargeting
alone removes parent changes. Follow existing permissions for branch rewrites,
and do not force-push without explicit authorization. Merging or deploying still
requires the user's specific approval.

Preserve historical evidence and scientific denominators. Do not delete,
truncate or rewrite receipts to make a diff smaller. Do not change benchmark
jobs or issue inference requests as part of arranging a publication stack.

## Changelog for website updates

Whenever asked to update the website, update the reader-facing changelog at
`#/changelog` in the same change. Add a dated entry to `src/changelog.ts`
summarizing the routes, features, or evidence readers will see. Link the PR
number once assigned. In a stack, each website PR records its own changes and
inherits earlier entries from its base. Run `npm run changelog:verify` and
confirm the new entry appears in the corresponding preview. The verifier checks
main-branch history, so a pass alone does not confirm the current PR has an entry.

## Chapter coverage in update descriptions

State which reader-facing routes were updated and which retain historical
scope. The original `#/caveman-summary` page covers the 4B pilot; expanded model,
sampling and cost comparisons live at `#/local-qwen`. Do not imply that changing
one route updates the other. If a future change expands a chapter's scope, make
that change and its evidence dependencies explicit in the frontend PR.

## Performance budget for website changes

Keep what PR #14 gained. For any change under `src/`:

- **Entry JavaScript stays at or below 135 kB gzip.** `npm run budget:check`
  (after `npm run build`) enforces it in CI and fails if a route chapter
  joins the entry. Raising the budget needs a stated reason and before/after
  measurements in the PR.
- **Loading causes no layout shift** on `#/executive-summary`, `#/local-qwen`
  and `#/evidence-atlas`. A lazy page's loading state uses `LoadingPage` with
  the page's own hero, so the layout does not jump.
- **Below-the-fold evidence stays deferred** (`useNearViewport`, a closed
  disclosure, or a route), and printing keeps working (`npm run test:print`).
- **A new chapter gets its own module** and is registered in `src/chapters.ts`
  to load with its route. Shared page parts live in `src/bookUi.tsx`. Keep
  lines readable (about 160 characters at most) rather than packing a page
  into one line.

For timing claims, use the matched lab in `scripts/perf/` (see its README);
it reports readiness, LCP, layout shift and Total Blocking Time. For a
refactor that should not change what readers see, compare the two builds
with `scripts/compare-builds.cjs`.
