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

## Chapter coverage in update descriptions

State which reader-facing routes were updated and which retain historical
scope. The original `#/caveman-summary` page covers the 4B pilot; expanded model,
sampling and cost comparisons live at `#/local-qwen`. Do not imply that changing
one route updates the other. If a future change expands a chapter's scope, make
that change and its evidence dependencies explicit in the frontend PR.
