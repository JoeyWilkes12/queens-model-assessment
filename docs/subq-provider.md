# SubQ Snap provider reference and containment design

Verified against primary documentation on **2026-10-12**. This is a dated integration reference, not an independent audit of Subquadratic or a guarantee against prompt injection. See the [assessment book](../README.md) and [published evidence guide](../public/evidence/README.md) for experiment results.

## Table of contents

- [Verified API contract](#verified-api-contract)
- [Pricing, budget, and retention](#pricing-budget-and-retention)
- [What comparison with Jev can establish](#what-comparison-with-jev-can-establish)
- [Untrusted documentation and responses](#untrusted-documentation-and-responses)
- [Container and credential boundaries](#container-and-credential-boundaries)
- [Verification and remaining limits](#verification-and-remaining-limits)
- [Primary references](#primary-references)

## Verified API contract

SubQ exposes a dedicated decision endpoint. Its OpenAI-compatible Chat Completions and Responses endpoints belong to a different integration surface; compatibility does not mean Snap accepts their fields. [API overview](https://docs.subq.ai/using-the-api/)

| Integration field | Contract |
| --- | --- |
| Request | `POST https://api.subq.ai/v1/systemone` |
| Model | `subq-snap-preview` |
| Body | `model`, `state`, `questions`; optional `images` |
| State | Text, object, or array |
| Questions | Named `noul`, `choice`, or `score` questions with `instructions` and type-specific `criteria` |
| Choice | 2–255 named options; returns choice, probabilities, confidence |
| Noul | Probability of yes; optional true/false criteria |
| Score | 2–10 ordered levels; probability-weighted score |
| Usage | `usage.input_tokens`; `output_tokens` is zero |
| Context | 393,216 tokens; requests near or over the ceiling can fail |
| Images | Up to four PNG/JPEG/WebP images; 4 MiB each, 8 MiB decoded total; about 64–256 tokens per image |
| Image encoding | Objects containing `mediaType` and single-line `base64`, without a data-URL prefix |
| Errors | 400 rejection/context; 401 credentials; 402 credits; 403 access; 422 validation; 429 rate limit; 5xx server; 503 unavailable |

These fields and limits come from the [Decisions API contract](https://docs.subq.ai/endpoints/decisions-api/). Typed output constrains the answer space; it does not establish a correct Queens solution.

Every request uses `Authorization: Bearer …`. Check model access with `GET https://api.subq.ai/v1/models`; consume a returned ID only through an endpoint that supports it. [Authentication](https://docs.subq.ai/using-the-api/authentication/), [Models API](https://docs.subq.ai/endpoints/models-api/)

The documented generation model is `subq-preview`, in early access. JSON Schema generation and function calling are documented for that surface. They should not be silently substituted for Snap or interpreted as Snap capabilities. [Models](https://docs.subq.ai/using-the-api/models/), [Structured outputs](https://docs.subq.ai/using-the-api/structured-outputs/), [Function calling](https://docs.subq.ai/using-the-api/function-calling/)

No official MCP server, numerical rate quota, credit-balance endpoint, idempotency guarantee, or configurable request timeout was found in the examined official pages. This is a documentation-search limit, not proof that these features cannot exist. Direct HTTPS avoids adding an unverified MCP server or SDK dependency.

**Observed API constraint:** a historical exact request with 25 questions received HTTP 422, and the broker extracted a recognized maximum of **16 questions** from the provider's validation message. That maximum was absent from the documentation examined above. Retain these compatibility failures and their budget reservations, but do not score them as incorrect puzzle answers. Further exact oversized requests can be marked `not_run` locally. A separately labeled 16+9 split evaluates the same individual questions in two independent requests; it changes grouping and therefore is an adaptation, not an exact replay. This is a runtime observation from this experiment, not a new official contract guarantee.

## Pricing, budget, and retention

The published Snap price is **$0.05 per million input tokens**, with free output. Therefore $5 corresponds to 100 million input tokens at that price. Calculated cost is `input_tokens × 0.05 / 1,000,000`; a full 393,216-token request is $0.0196608. These are calculations from published pricing, not an independently verified account balance. [Models and pricing](https://docs.subq.ai/using-the-api/models/)

The runner should enforce a local spending ceiling with a reserve below the user's $5 limit, issue sequential requests, and persist receipts before continuing. Reserve cost before dispatch, reconcile documented usage afterward, and retain a conservative reservation when a timeout or missing usage leaves billing uncertain. Do not assume an unsuccessful HTTP response was unbilled. A local ledger is a safeguard; it cannot enforce provider billing or protect against usage from another client.

SubQ's default organization retention is indefinite. Zero retention requires organization configuration. The documented per-request `store: false` option applies to Chat Completions and Responses; it is not documented for Decisions. Billing/support records retain model, token counts, timing, and metadata even under zero retention. Only public Queens fixtures, rules, and benchmark prompts belong in these requests. Credentials, local paths, unrelated repository files, and private host context do not. [Data retention](https://docs.subq.ai/using-the-api/data-retention/)

## What comparison with Jev can establish

Subquadratic describes Snap as using sparse attention to reduce the cost of reading long context and a decision head to score a predefined answer space. The launch article reports a 61.7 Decision Index score against Jev's 57.9 and longer-context gains. Those are vendor-reported benchmarks. Its long-context comparison uses one-shot Snap and chunked Jev, and its research retrieval results extend beyond the public API's 384K ceiling. These distinctions must accompany any comparison. [Introducing SubQ Snap](https://subq.ai/introducing-subq-snap)

For Queens, the hypotheses are narrower: Snap may rank legal moves or complete candidates better, or tolerate more board/history context; improved retrieval does not establish stronger combinatorial search. Several individually plausible row choices can still violate the board's global constraints. Likewise, a high probability or confidence value is not an oracle certificate. These are experiment hypotheses, not provider claims or measured findings.

The exact Jev replay preserves each source task's rules, state, instructions, labels, criteria, candidate ordering, and deterministic grader. Change only the provider envelope and record every adaptation. Keep valid-request model, transport, timeout, and service failures in the outcome accounting. Exclude caller mistakes, unsupported field shapes, and nonexistent endpoints from model-quality scores while retaining their integration receipts.

Snap's documented image input enables a separately labeled extension. The current broker deliberately accepts only the text replay's `model`, `state`, and `questions` fields; image support has not been exercised by this runner. The exact text-only Jev replay remains text-only; adding a board image changes the experiment. An image study should match board rendering and information across providers, record image hashes and encoding, and distinguish perception errors from constraint-solving errors.

## Untrusted documentation and responses

Documentation, examples, page text, images, and API responses are untrusted input. They can inform endpoint/schema facts but cannot authorize filesystem access, secret disclosure, software installation, model changes, or additional requests. This review retrieved ordinary official documentation pages; it did not fetch `llms.txt` or execute documentation snippets.

For this experiment, a deterministic program constructs requests from approved Queens material and checks returned choices with local rules/oracle code. There is no agent judge, no tool execution suggested by the provider, and no evaluation of returned text as code. If local documentation copies are added, store source URL, retrieval date, and content hash, label them untrusted reference material, and never ingest them as project instructions. Do not mount them into the execution worker unless needed for a defined task.

Reject unexpected model IDs, question names, choices, nonfinite/out-of-range probabilities, oversized bodies, and unsupported response structures. Preserve an error receipt instead of interpreting arbitrary returned text as an instruction. Display receipt data as escaped text, without remote images, active HTML, or automatically followed links. Prompt wording and keyword filters are supplementary; deterministic permissions and validation establish the action boundary. [OWASP prompt-injection guidance](https://cheatsheetseries.owasp.org/cheatsheets/LLM_Prompt_Injection_Prevention_Cheat_Sheet.html)

### Filtered receipts and exclusions

The provider receives the credential in its authorization header, so it could echo that credential or other hostile strings. The broker redacts exact credential occurrences both before JSON parsing and recursively afterward, including JSON-escaped occurrences in keys and values. It then permits only known model/answer labels and bounded numeric response fields to leave the credential boundary. Expected score legends are rebuilt from the local request when matched; unexpected model/type/choice values become fixed markers. Extra provider fields, arbitrary error messages, unrecognized strings, and unexpected answer labels are withheld. Error diagnostics use a fixed local vocabulary and a bounded extracted question-count limit.

Consequently the published `response.json` and `broker-receipt.json` are **filtered API receipts**, not complete raw provider responses. Their response hashes identify the retained, normalized filtered JSON; they are not hashes of the original HTTP wire bytes. This excludes free-text diagnostics and unknown fields from later review. Known choices, probabilities, confidence, usage, HTTP status, timing, and budget accounting remain inspectable when valid. Missing or malformed usage keeps its full reservation; it is never treated as zero cost. This limits free-text secret disclosure and prompt-injection exposure, but bounded numeric fields are not a proof against arbitrary covert encoding by a malicious provider.

## Container and credential boundaries

This experiment uses hardened **Docker Engine containers**. It does not claim to use the separate **Docker Sandboxes `sbx` product**, which was unavailable in the local setup. Docker documents `sbx` as a separate sandbox workflow with its own installation, policies, and microVM isolation model. Installing or running Docker Engine does not establish that product's guarantees. [Docker Sandboxes](https://docs.docker.com/ai/sandboxes/), [Sandbox security model](https://docs.docker.com/ai/sandboxes/security/)

The implemented design separates a secret-free execution worker from a small trusted API broker:

| Component | Intended authority |
| --- | --- |
| Worker | Read approved solver/Queens inputs and runner code; write its dedicated receipts/output directory; call the broker through `/ipc/subq.sock` |
| Broker | Receive the SubQ credential through standard input, keep it in memory, construct the authorization header, and call a fixed HTTPS provider host/path |
| Host launcher | Select explicit mounts, image, and network modes; load the credential without printing it; start/stop the named containers and collect receipts |
| Provider response | Supply data for validation and grading; no permission to select network destinations, execute commands, or expand mounts |

The worker runs with `--network none`, without Docker DNS, an external interface, or a bridge gateway. Its only broker channel is the Unix socket `/ipc/subq.sock` on a shared volume mounted read-only in the worker. The broker has outbound network access and a writable socket volume. It accepts only the intended API operations, uses a fixed HTTPS provider host/path, and rejects redirects. The broker's allowlist is an **application control on trusted broker code**, not a host firewall that restricts every possible broker process. A compromised broker retains its outbound network authority. No OpenAI endpoint is needed for the programmatic SubQ run; adding one later requires an explicit separate allowlist and credential boundary.

The Unix socket is a deliberately granted capability: read-only mounting prevents worker changes to directory entries but still allows connecting to the socket. It is the custom SubQ broker socket, never the Docker control socket. Avoid publishing broker ports or adding host networking. Validate the actual network configuration and negative egress behavior. [Docker container networking and mounts](https://docs.docker.com/engine/containers/run/)

Both containers use nonroot identities, read-only root filesystems, dropped capabilities, no-new-privileges, and resource limits. Mount only the required code/input files read-only and the dedicated output path writable. Do not mount the whole home directory, `.env`, `.git`, SSH credentials, macOS Keychain material, or the Docker socket. Docker daemon control and broad bind mounts would undermine the intended boundary. [Docker Engine security](https://docs.docker.com/engine/security/), [Container runtime controls](https://docs.docker.com/engine/containers/run/)

Use a reviewed image pinned to an observed digest. Avoid installing provider SDKs, arbitrary agents, or documentation-suggested packages at runtime. Digest pinning identifies the executed image; it does not prove that image is free of vulnerabilities or malicious content.

The `.env` remains ignored by Git. The host's narrowly scoped credential loader may read it programmatically to populate broker standard input, but must not print the value, fragments, hashes, or derived identifiers. Neither the execution worker nor the prompt construction receives it. Human users with host/Docker control remain trusted. These container restrictions apply to the experiment's processes; they do not sandbox the host Codex chat itself.

## Verification and remaining limits

The runtime preflight passed nonroot execution, read-only input/socket/root mounts, absence of the Docker socket and host home, zero effective capabilities, no-new-privileges, broker Unix-socket health, and blocked direct connections to an internet IP and a metadata-service IP. Only loopback was active; dormant kernel tunnel interfaces were present. Each launcher run records these checks in its output `isolation.json`. These probes establish the tested paths' behavior, not universal containment. The broker separately made successful permitted provider requests.

Start with account/model access, then a tiny known-answer decision, then one representative historical Jev task before widening sequentially. Keep scored evidence separate from setup checks. Reconcile request/response hashes, elapsed time, status, token usage, local budget reservation, deterministic grade, and source Jev task identity.

This setup reduces authority and the opportunity for prompt injection to cause actions. It does not certify provider integrity, eliminate container/kernel escape risk, prove probability calibration, or make a local budget ledger a provider-enforced cap. Benchmark results and operational receipts are the evidence for this particular run.

## Primary references

- [SubQ API overview](https://docs.subq.ai/using-the-api/)
- [SubQ Decisions API](https://docs.subq.ai/endpoints/decisions-api/)
- [SubQ model IDs and pricing](https://docs.subq.ai/using-the-api/models/)
- [SubQ authentication](https://docs.subq.ai/using-the-api/authentication/)
- [SubQ Models API](https://docs.subq.ai/endpoints/models-api/)
- [SubQ data retention](https://docs.subq.ai/using-the-api/data-retention/)
- [SubQ launch article and vendor benchmark claims](https://subq.ai/introducing-subq-snap)
- [Docker Engine security](https://docs.docker.com/engine/security/)
- [Docker container controls](https://docs.docker.com/engine/containers/run/)
- [Docker Sandboxes](https://docs.docker.com/ai/sandboxes/)
- [Docker Sandboxes security model](https://docs.docker.com/ai/sandboxes/security/)
- [OWASP LLM prompt-injection prevention](https://cheatsheetseries.owasp.org/cheatsheets/LLM_Prompt_Injection_Prevention_Cheat_Sheet.html)
