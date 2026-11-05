# Queens model assessment

Read and follow [AGENTS.md](AGENTS.md) for this checkout's project rules, alongside
global instructions and explicit human approvals.

For future evidence-heavy website updates, use the reviewable PR-stack workflow:
small compatibility prerequisites when needed, then evidence/content PRs, then
a final PR for frontend/main display files and active evidence-index activation.
Base each child on its immediate parent so its diff excludes the earlier bulk
content. Link the stack and review order, validate each layer and the full stack,
and preserve immutable evidence and a usable intermediate site. Ordinary small
changes can remain one focused PR. Do not merge, deploy or force-push without
the applicable explicit approval.

Whenever asked to update the website, also update `#/changelog` by adding a dated
entry in `src/changelog.ts` to the same PR. Describe the visible change, link the
PR number once assigned, and run `npm run changelog:verify`. Check the entry in the
preview. Each website PR in a stack adds its own entry and inherits its parents'
entries.

State chapter coverage explicitly: `#/caveman-summary` retains the original 4B
pilot, while newer multi-model assessments and costs live at `#/local-qwen`.
