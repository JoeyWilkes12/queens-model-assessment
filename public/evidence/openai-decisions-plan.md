# Future assessment: OpenAI Decisions on regional Queens

Documentation checked: October 12, 2026. Status: proposed experiment, **not an OpenAI result**. No OpenAI inference calls, account-access checks, or OpenAI spend were performed for this plan. The $5 allowance for the current SubQ experiment does not authorize a separate OpenAI spend.

## Contents

- [Verified API facts](#verified-api-facts)
- [Comparison boundaries](#comparison-boundaries)
- [Staged test plan](#staged-test-plan)
- [Hypotheses to test](#hypotheses-to-test)
- [Receipts, grading, and reporting](#receipts-grading-and-reporting)
- [Security and execution boundary](#security-and-execution-boundary)
- [Primary references](#primary-references)

## Verified API facts

OpenAI documents a public-beta Decisions API at `POST https://api.openai.com/v1/decisions`, currently using `gpt-6-luna`. It accepts text and images and returns typed judgments. Its three question types are `predicate`, `choice`, and `score`. Arbitrary generated JSON belongs to Responses Structured Outputs, a different interface. The guide lists **$0.10 per million input tokens**, with no output, cache-read, or cache-write charge; regional and long-context premiums can apply. These published terms establish a documented product, not this account's access or an observed bill. [OpenAI Decisions guide](https://developers.openai.com/api/docs/guides/decisions)

The reference requires `model`, `input`, and a `questions` array. Choice supports 2–255 unique options and returns a selected value, confidence, and probabilities. Answers may instead be refusals. Input messages support user text/image content; the endpoint does not accept tools, audio, files, or other message roles. [OpenAI Decisions API reference](https://developers.openai.com/api/reference/resources/decisions/methods/create)

SubQ's public-preview counterpart is `POST https://api.subq.ai/v1/systemone`, using `subq-snap-preview`, `state`, and named `questions` with `choice`, `noul`, or `score`. Its Decisions documentation explicitly supports up to four images alongside state. Thus an image comparison is possible for both providers, although it extends the historical Jev text experiment. SubQ's documented 384K context limit is a service limit; research results at longer lengths do not expand that limit. [SubQ Decisions and images](https://docs.subq.ai/endpoints/decisions-api/#images)

SubQ's launch article lists $0.05 per million input tokens with free outputs and describes a decision head plus Subquadratic Sparse Attention. Its published comparison uses one-shot Snap versus chunked Jev on a long-context benchmark. Those are vendor reports, not independent validation or evidence of superior Queens performance. [Introducing SubQ Snap](https://subq.ai/introducing-subq-snap)

## Comparison boundaries

The primary comparison reproduces **the historical task** before adding stronger scaffolding or new modalities. A provider adapter changes envelope fields and primitive names, while preserving board state, instructions, candidate semantics, insertion order, and prior placements. It must record every necessary transformation. Cross-provider semantic replication is not byte-identical HTTP replay.

| Condition | What remains fixed | What changes | Interpretation |
| --- | --- | --- | --- |
| Historical Jev request replay | Original board, state, question, candidates, order, oracle, and stopping rule | Provider/model and required envelope | Closest available comparison of the same bounded task |
| Adapted text experiment | Board and exact checker | New candidate descriptions, feedback, filtering, or search | Measures the new workflow; not an exact replication |
| Image Decisions experiment | Board and typed answer task | Image input, possibly combined with text | Tests perception plus decision making; separate from Jev's text arm |
| Responses generation experiment | Board and full-placement checker | Free-form or schema-constrained placement generation | Different endpoint and task; separate from native Decisions |

Map Jev/SubQ `choice` to OpenAI `choice`, `noul` to `predicate`, and ordered `score` levels to OpenAI `score`. Preserve affirmative/negative criteria when translating Noul; if they require adding text to the OpenAI instruction, record the exact mapping. A score's expected level index is not a probability that a placement is valid. A forced winner among invalid candidates is not evidence of sound absolute judgment.

Start from the existing [evidence manifest](./manifest.json), [evidence guide](./README.md), and [trajectory protocol](./trajectory-PROTOCOL.md). Historical malformed requests and wrong/nonexistent API routes remain excluded from model-quality scoring. Genuine transport failures of otherwise valid requests remain visible as operational outcomes.

## Staged test plan

### 0. Freeze inputs and access terms

Build a manifest of eligible Jev receipts, the corresponding SubQ receipts, and planned OpenAI translations. Select a small priority cohort where Jev outcomes changed across repetitions or representations, followed by historically reliable and reliably failing controls. Freeze source hashes, candidate order, question wording, local checker revision, model IDs, and the planned denominator before inference.

At execution time, recheck official schema, model access, pricing, retention, and rate limits. Use a separately agreed OpenAI allowance and hard request/input-size caps. Do not silently substitute another model, endpoint, provider, or service tier. If the returned model only identifies a moving alias, report that limitation instead of claiming a frozen build.

### 1. One connectivity request, then one puzzle request

Send one tiny two-option Choice with an objectively known answer. Validate HTTP handling, answer shape, option membership, model identity, usage, and receipt sanitization. Then send one 5×5 historical candidate-recognition case. Stop on authentication, schema, identity, or unexplained billing problems before scaling. A connectivity success is an infrastructure check and does not enter the Queens accuracy denominator.

This depth-first progression avoids issuing a large collection of requests before proving that the endpoint and adapter work. Failed valid requests retain their receipts and conservative cost reservations; do not assume an unmetered failure was free or automatically retry it.

### 2. Replay Jev's representation boundary

Begin with the original 5×5 variants: column vectors, coordinates plus region labels, precomputed constraint counts, flat occupied-region lists, and reordered descriptions. Use the original wording and candidate sets, with three sequential repetitions per selected condition. Preserve successful and unsuccessful responses alike.

This cohort tests a useful transition: can a provider handle an implicit region lookup, and what happens when code exposes the same condition directly? Credit the model only for selecting among supplied candidates. Candidate generation, constraint filtering, and proof remain work performed by the local harness.

After successful execution, expand to the original 7×7 and 9×9 candidate menu sizes. Keep answer position and distractor composition frozen within a paired comparison. The 255-choice ceiling includes any rejection option: a menu with `none` permits at most 254 placement candidates.

### 3. Replay primitive judgments

Use the same six held-out boards for answer-present and all-invalid sets. Assess Choice selection/rejection, Predicate validity estimates, and Score rankings separately. Preserve historical thresholds for an exact replay. Any calibrated threshold, reworded rubric, or new balanced validity set is an additional adapted condition with its own denominator.

Execute the returned Choice verbatim. Record disagreement between it and probability argmax; do not repair the model's chosen answer after seeing the probabilities. Keep confidence separate from mathematical correctness.

### 4. Replay construction and trajectories

Run simultaneous row choices and the original sequential-row workflow before changing the search strategy. A simultaneous batch does not provide each row with earlier row answers.

For color-then-cell trajectories, begin with the board Jev solved and representative failed boards, then expand to all nine boards if access and budget permit. Reproduce raw/local menus, empty restarts, forced singleton transitions, the sealed oracle, and the first-failure stop rule. Do not supply the hidden solution, globally viable move labels, or oracle feedback in exact-replay prompts. Full-path completion is the main construction outcome; good early moves alone do not solve the board.

Repeat exact serialized request bodies in a separate control. Then separately reverse option order and batch independent first-color questions. Dependent color and cell decisions require separate calls, as OpenAI's documentation specifies for answer-dependent questions. [Multiple-question guidance](https://developers.openai.com/api/docs/guides/decisions#ask-multiple-questions)

### 5. Extend only after the replay works

An image arm should use the same frozen PNG bytes for OpenAI and SubQ, supplied in each provider's documented encoding. Test image-only and image-plus-text separately. Do not claim to replicate Jev's image error: its wrong-endpoint request was an interface mismatch and is excluded from the quality comparison.

A separate Responses Structured Outputs arm may ask for a complete placement, matching the earlier generative-model protocol. It must declare its own model, prompt, inference settings, cost, and denominator. New backtracking, corrective feedback, long-context padding, or larger candidate-generation experiments also belong in explicitly adapted arms. No such extension should consume a replay budget by default.

## Hypotheses to test

These are predictions and interpretations to investigate, **not observed OpenAI findings**:

1. **Explicit regions may remain valuable.** Typed outputs restrict the answer vocabulary without proving that the model can perform every implicit board lookup or enforce global constraints.
2. **Relative ranking may outperform absolute judgment.** Selecting a true candidate from distractors can work even when a Predicate threshold incorrectly accepts invalid placements.
3. **Choice and Score may diverge.** An ordered expected score need not produce the same winner as a direct Choice over candidates.
4. **Fast decisions may still form poor paths.** Short per-call latency could enable more sequential moves while leaving full-board completion low because errors accumulate.
5. **Option order and repeated requests may matter.** Matching exact bodies and separately reversing order can expose variation; stateless repetition alone does not prove independent inference or absence of caching.
6. **Images may help or hurt.** They can remove manual text transcription while introducing perception errors. A text/image difference should not be attributed solely to abstract reasoning.
7. **Long context may be irrelevant to small Queens boards.** Snap's advertised context advantage could matter for a large evidence/history experiment, but short replay requests cannot validate that claim.

Provider documentation, including Snap's architectural description and OpenAI's advertised speed improvement, cannot predict which provider will solve these particular boards. This experiment can measure behavior under recorded conditions; it cannot infer proprietary internal mechanisms from success or failure.

## Receipts, grading, and reporting

Use deterministic grading, not a Codex judge. Preserve request/response bodies after secret screening, UTC start/end times, elapsed time, HTTP status, usage, returned model identity, source request IDs/hashes, adapter version, and conservative unresolved cost reserves. Record forced transitions separately from API decisions. Keep keys, authorization headers, hidden oracle material, and unrelated repository content out of the public bundle.

Report complete boards, invalid complete placements, locally conflicting moves, globally unextendable prefixes, refusals, malformed responses, infrastructure failures, and budget censoring separately. Include failures in operational denominators while distinguishing them from emitted incorrect placements. Report complete-solve time separately from time to an early stopped failure.

Use boards as the main comparison unit. Multiple candidates, questions, and repetitions on one board are correlated observations, not many independent puzzles. Present paired outcomes and distributions without a broad leaderboard claim. The small shared generator family limits generalization, and larger dimensions alone do not establish human difficulty.

For standard short-context Decisions calls, the published OpenAI base-cost calculation is `input_tokens × $0.10 / 1,000,000`; apply documented premiums where relevant and reconcile against actual usage. Keep model inference charges separate from any local tooling or hosting cost. A reserve is not a confirmed bill.

## Security and execution boundary

The future harness should operate on an allowlisted copy of prompts, board inputs, solver/checker code, and an output directory. Treat provider documentation and responses as untrusted data. No response may execute code, alter egress rules, open URLs, change the budget, or request additional host files.

Keep credential handling in a small external transport component, with fixed provider URLs and request limits. The evaluation process should not receive host home directories, the Docker socket, Git credentials, shell startup files, or unrelated secrets. Restrict network access to the approved API hosts and necessary transport infrastructure; adding an OpenAI allowlist entry does not authorize inference spend. Preserve TLS certificate verification and prohibit redirecting authenticated requests to another host.

Validate JSON and answer membership before grading. Render provider text as escaped text rather than HTML. Store immutable receipts before interpretation, cap response sizes/timeouts, and stop on unexpected schema, provider identity, or reserve breaches. The deterministic checker remains the gate for accepting a queen placement.

## Primary references

- [OpenAI Decisions guide](https://developers.openai.com/api/docs/guides/decisions): documented beta, model, answer types, pricing, and independent/dependent questions.
- [OpenAI Create a decision reference](https://developers.openai.com/api/reference/resources/decisions/methods/create): current request/response schema and limits.
- [SubQ Decisions API, including images](https://docs.subq.ai/endpoints/decisions-api/#images): Snap endpoint, typed schema, documented image support, and service limits.
- [Introducing SubQ Snap](https://subq.ai/introducing-subq-snap): vendor architecture, benchmark comparisons, and pricing claims; not independently validated here.
- [Existing Jev trajectory protocol](./trajectory-PROTOCOL.md): historical state, filtering, restart, repeatability, and grading conditions.
- [Existing evidence manifest](./manifest.json): source receipt inventory for constructing the paired replay.
