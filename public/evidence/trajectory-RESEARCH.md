# Jev sampling, versioning, and batching research

Sources retrieved September 30 / October 1, 2026. Local live discovery: [discovery.json](discovery.json). Findings describe the documented API and this route, not undocumented model internals.

## Contents

- [Repeatability and stochasticity](#repeatability-and-stochasticity)
- [Parameters](#parameters)
- [Model and endpoint versions](#model-and-endpoint-versions)
- [Parallelism and batching](#parallelism-and-batching)
- [Questions answered by the experiment](#questions-answered-by-the-experiment)

## Repeatability and stochasticity

The [TypeSafe Choice self-consistency cookbook](https://docs.typesafe.ai/cookbooks/consistency_choice_cookbook) reports 15 repetitions of an eight-question moderation rubric: 90.8% raw label agreement and label flips on two questions. Adding a probability threshold improves routing agreement by permitting abstention; it does not demonstrate deterministic inference. Crucially, each call adds a fresh UID to state. The authors explicitly acknowledge that their setup cannot distinguish irrelevant-field sensitivity from variation on identical requests. Its September 11 latest-alias experiment is contextual evidence, not a pinned-build Queens reproducibility test.

Our own tests hold serialized payload bytes constant. Choice labels change in 8 of 17 question groups, while reported probability vectors change in all 17. This establishes empirical variation for the observed OpenRouter route with an unchanged reported build. It does not establish that Jev intentionally samples options or identify an intrinsic source such as inference kernels, internal inference noise, probability postprocessing, provider scheduling, or gateway behavior. Those possible mechanisms remain unverified.

The [TypeSafe API reference](https://docs.typesafe.ai/api) defines Choice as the highest-probability option. It also returns the option distribution. Selection is therefore documented as an argmax operation, not token sampling. In our saved outputs, 13 answers show a selected option 0.01 below the displayed maximum; this contract discrepancy remains unresolved. We execute the returned Choice faithfully rather than substituting a recomputed winner. [Confidence](https://docs.typesafe.ai/confidence) is a distribution-derived measure and should not be treated as the selected option's probability or a certificate of correctness.

## Parameters

The [OpenRouter Decisions schema](https://openrouter.ai/docs/api/api-reference/alphadecisions/submit-a-decisions-request) has model, state, questions, provider routing, and observability fields. It does not expose temperature, seed, or top-p. Live Jev model and endpoint records list `supported_parameters: []`. The direct TypeSafe API likewise documents no sampling dial. Generic OpenRouter chat parameters do not establish support for Decisions. No unsupported temperature or seed field was sent, and no trial used harness-side random sampling of distributions.

## Model and endpoint versions

OpenRouter discovery lists `typesafe/jev-1.13` and the moving alias `~typesafe/jev-latest`. The latter has a leading tilde. Every successful new inference requested the versioned family ID and returned `typesafe/jev-1.13-20260917` from TypeSafe. Live endpoint metadata names the same dated build. A runtime assertion stops the cohort if the returned build changes.

The local broker rejected a request whose model field was the dated returned-build string; it did so before upstream inference. This is evidence about the broker's narrow approved-model policy, not proof that OpenRouter rejects that identifier. We did not widen the broker or invoke the latest alias. Family-version pinning plus returned-build checks prevents silent pooling of reported revisions, but it cannot certify immutable hidden weights.

The [OpenRouter Jev model page](https://openrouter.ai/typesafe/jev-1.13) and [endpoint inventory](https://openrouter.ai/api/v1/models/typesafe/jev-1.13/endpoints) provide the current serving route. Our endpoint remains `/api/alpha/decisions`.

The [TypeSafe models reference](https://docs.typesafe.ai/models) lists direct version `jev-1.13.0`; its stable and preview aliases currently resolve there, and it states no preview is available. The direct endpoint is `/v1/systemone`. These names belong to different APIs and are not interchangeable requests. No newer Jev version appeared in OpenRouter discovery. No separate TypeSafe credential was used, so we did not compare direct serving against OpenRouter. That comparison remains a documented access-dependent question.

## Parallelism and batching

TypeSafe evaluates questions against shared state in parallel; answers do not feed one another. Its current model reference advertises 40 requests/second and 100k tokens/second, subject to change. Its total request budget is 64k tokens, with state plus the longest question at most 32k; OpenRouter advertises 32k context. Apply the route-specific limits rather than assume the largest direct limit governs OpenRouter.

Four independent trajectories ran concurrently. Region selection and cell selection within one trajectory remained sequential. Five nine-question requests successfully produced 45 independent first-color decisions. The batch contains multiple boards in shared state, so it is a changed-context treatment, not an exact replica of the singleton requests. Choice allows 255 options; Score allows up to ten levels. We found no official numeric maximum question-count field in the Decisions schema and claim only the tested nine-question batch.

The [OpenRouter rate-limit guide](https://openrouter.ai/docs/api_reference/limits) notes provider and operational limits even for paid inference. We use bounded concurrency and stop for review on errors rather than unbounded retries. OpenRouter's [documentation index](https://openrouter.ai/docs/llms.txt) lists the asynchronous Batch API's supported target endpoints; Decisions is not listed. Successful question-map batching does not establish that asynchronous `/batches` accepts Decisions.

## Questions answered by the experiment

| Question | Finding or boundary |
|---|---|
| Was the proposed workflow already tested? | No. One earlier fixed-row 5×5 trajectory failed; no prior color-then-cell restart campaign existed. |
| Can the new workflow complete a puzzle? | Yes, one new 5×5 board in all five repetitions of each mode. |
| Does that generalize to other boards of the same size? | Two other 5×5 boards were not completed. |
| What about 7×7 and 9×9? | None of the six new larger boards was completed. |
| Does immediate-conflict filtering improve solve count? | No in this corpus; it removes local violations and can lengthen correct prefixes. |
| Does a fresh request reset the experiment? | It resubmits stateless board state without prior failures; it is not proof of independent inference. |
| Can identical requests differ? | Yes, measured directly with matching wire-body hashes. |
| Is there a temperature or seed control? | Not in the documented Decisions interfaces or current supported-parameter metadata. |
| Is Choice sampling the returned distribution? | Not according to its contract; the returned Choice is executed directly. |
| Is the source of variation inherently in Jev? | Not established by these observations or documentation. |
| Can independent requests run concurrently? | Yes, four concurrent trajectories completed. |
| Can questions be batched? | Yes, nine independent color questions per request completed. |
| Can dependent color and cell moves share a request? | They cannot consume one another's answers; use a subsequent request. |
| Does option order matter? | Reversed order changed response patterns on several boards; the sample is small. |
| Can the model be pinned? | The family ID and returned build were fixed; dated-ID access was locally blocked. |
| Is a new version/endpoint available? | No newer OpenRouter version discovered; the direct API was documented but not called. |
| Are probability distributions calibrated for Queens? | Not demonstrated; repeats and ranking do not establish calibration. |
| Are restarts independent samples? | Not established; repeated same-board attempts are clustered observations. |
| Did retries repair a puzzle answer? | No. Saved valid responses were replayed once after correcting a local validator assumption. |
| What remains unknown? | Serving-layer cause of variation, reported Choice/probability disagreement, direct-route comparison, different generator families, and recovery with feedback/backtracking. |

Research was split across agents for official-source discovery and local-history inspection. Those initial reviews completed. Later delegated code/site work hit the local account usage limit and did not complete; the primary agent performed implementation and offline verification. No external researcher model charges were added to OpenRouter.
