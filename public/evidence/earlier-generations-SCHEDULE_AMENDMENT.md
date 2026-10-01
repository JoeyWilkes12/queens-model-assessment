# Budget-driven schedule amendment — October 1

## Contents

- [Decision and timing](#decision-and-timing)
- [Amended sequence](#amended-sequence)
- [Interpretation](#interpretation)

## Decision and timing

Freeze this amendment after round 1 (all nine written placements valid; $0.62023875 confirmed) while round 2 is underway, before any amended-phase calls. The original dense candidate ladder risks consuming the $2 budget before reaching non-reasoning models and much older Claude tiers. The original manifest, protocol and all message/request hashes remain unchanged. The user's objective is to find observed earlier-model failures across authors before any effort sweep.

## Amended sequence

1. Complete round 2: GPT-5.4, Opus 4.6, Gemini 2.5 Flash across the original boards.
2. Test older anchors in breadth-first board blocks: **GPT-4.1 → Claude Sonnet 4 → Gemini 2.5 Flash Lite**. If a family already has a mathematical failure in completed rounds 1–2, omit its older anchor. These are original-input requests already frozen in the original candidate manifest, not new prompts. Sonnet 4 uses the discovered Amazon Bedrock route; GPT-4.1 has no reasoning control.
3. Once the anchor block is complete, if GPT-4.1 has any mathematical failure, test GPT-5 as a newer bridge between the last passing GPT-5.4 and the failing anchor. If GPT-4.1 passes all three, descend instead to GPT-4o November 20 2024. Claude Sonnet 4 is the oldest affordable Claude tier in the discovered practical ladder; older Gemini 2.0/Claude 3 routes are absent. The GPT bridge is an explicitly adaptive bracket probe, after breadth across families, not an effort sweep.
4. After original-input breadth and the bridge, perform reserved text diagnostics on failed original model/board pairs if their full block reserves fit. Stop at $2 including unresolved reserves. Leave other frozen candidate requests unexecuted.

The runner freezes each amended phase with exact source call IDs and hashes before sending its first call. Complete-block reserve gates still apply with the original token cap and diagnostic hold. Actual start/end metadata establishes call order; the candidate manifest's `round` field continues to identify its original ladder rung rather than the amended chronological phase. `execution_phase` identifies the executed grouping.

## Interpretation

This prioritization is adaptive to observed successes and spend, and is disclosed as such. The report cannot say a skipped model passed or failed, identify an exact contiguous release threshold, or attribute Sonnet/Opus and Pro/Flash/Lite differences solely to generation. A GPT bridge success narrows a sampled bracket but does not make missing intermediate releases measured outcomes. No request gets prior outputs or engine feedback, and no original-input cell is retried.
