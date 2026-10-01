# Review and interpretation notes

## Contents

- [Reasoning controls](#reasoning-controls)
- [Caller safeguards](#caller-safeguards)

## Reasoning controls

GPT-6 Luna Xhigh flagged that Gemini 2.5 and older Claude catalogs support reasoning without exposing a native `supported_efforts` list. The frozen requests use OpenRouter's unified `reasoning.effort: high`; this is a gateway-level request, **not evidence of a native High setting**. [OpenRouter's reasoning documentation](https://openrouter.ai/docs/guides/best-practices/reasoning-tokens), inspected October 1, says its effort interface maps to a percentage token budget for models that support only reasoning token budgets (High approximately 80% of max tokens). This mapping does not equalize computation across providers, and the downstream budget actually applied is not present in captured responses.

The original request bytes remain frozen. Inferences accepted by these routes are labeled gateway-mapped High / downstream budget unobserved in the assessment. GPT-4.1 and GPT-4o have no reasoning parameter. Reported reasoning-token usage is retained; no effort sweep has been run.

## Caller safeguards

Before round 2, local review prompted stronger guards: verify returned provider and exactly one choice, count started-only requests at their full reserve, halt on any prior unresolved request, and require prior rounds to be closed before descending. These do not alter submitted messages, model parameters, provider routes or frozen request hashes. Round 1 returned nine completed responses from the requested providers and models. Its completed closeout was reconstructed from retained metadata before resuming.
