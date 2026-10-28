# Assessment observability

## Contents

- [Project identity](#project-identity)
- [Coding-agent tracing](#coding-agent-tracing)
- [Benchmark evidence](#benchmark-evidence)

## Project identity

The existing local registry assigns Queens Model Assessment the immutable ID `vtag:32720a64-f618-48bd-9c45-23c30bc9136c`, with portfolio `queens` and repository `queens-model-assessment`. On 28 October 2026, the attached Ollama assessment worktree was explicitly bound to that same ID. Resolution was checked at the physical worktree root and its `src` child. These machine-local bindings are managed by the virtual-project-tags registry; this document does not install a registry or hook on another machine.

## Coding-agent tracing

The machine's Codex tracing plugin and trusted Stop hook were enabled when inspected on 28 October 2026. The installed Codex and Claude wrappers include virtual-tag resolution. No tracing credentials were opened and no credential-loading production verifier was run. Configuration is confirmed; successful hosted delivery for this chat is **not independently verified**.

Attribution follows the session workspace, and the first matching tag may be pinned for that session. This chat began in the specifications workspace; editing or attaching this assessment worktree does not retroactively change earlier attribution. Start a fresh chat in the bound assessment folder for a new session that adopts its identity. Existing traces are not rewritten. Spawned agents may have different hook coverage; do not infer complete subagent usage or cost coverage from the presence of a parent trace.

Filter Langfuse by `tags:"vtag:32720a64-f618-48bd-9c45-23c30bc9136c"` for newly attributed project sessions. Reported coding-agent dollar values are API-equivalent estimates, not subscription charges or remaining plan allowance.

## Benchmark evidence

The static website makes no live model calls and contains no Langfuse credentials. Coding-agent Stop hooks do not automatically instrument independent Ollama benchmark requests. The local assessment publishes reproducible request/response, timing, token, model-identity and deterministic-grade receipts in [the Ollama evidence bundle](../public/evidence/ollama/summary.json). Treat this as the authoritative benchmark record. Hosted Langfuse delivery of those benchmark requests is not claimed.

If runtime export is added, use the current [Langfuse instrumentation documentation](https://langfuse.com/docs/observability/get-started) and [trace best practices](https://langfuse.com/docs/observability/best-practices): one generation per actual model call, meaningful input/output, model version, token counts, treatment/board metadata, deterministic scores, and the immutable project tag. Keep credentials outside the public site and audit actual trace readback before claiming delivery.

## Review boundary

For this PR the user explicitly waived the usual cross-family code-review rule and requested local Codex review only. An attempted Claude CLI review was rejected before execution by automatic approval review because private implementation egress was not approved. No repository content was sent by that attempted call. The implementation and screenshots were reviewed independently by a fresh Codex agent.
