# Freeze the input before interpreting the output.

The clearest finding in this report concerns the protocol boundary. We used identical board bytes for every request. Board bytes are the raw data representing the puzzle state. There were no tools allowed. Formatting diagnostics were separate from logic checks.

## What each entrant actually received

Different model setups received different input formats. An entrant is a specific configuration tested in this evaluation. The table below lists the conditions for each group.

Table: EVALUATION CONDITIONS

| CONDITION | INPUT | MODEL WORK | EXTERNAL HELP |
| --- | --- | --- | --- |
| Four reasoning models | Same image and rules per board | Generate complete written placement | None; no repair turns |
| Jev native row choices | Canonical text region grid | Select one column per row | Fixed typed options |
| Jev candidate recognition | Text board plus complete placements | Choose one option | Candidate construction by code |
| Repository solver | Exact region map | Solve explicit Boolean constraints | Local Z3; not a timed entrant · How Z3 solves Queens |

The images were clean 768×768 synthetic PNGs with region letters. They were not live-game screenshots or unlabelled color fields.

## Reasoning-model results

These models varied in speed, cost, and accuracy across three boards. Each reasoning model attempted three separate puzzle boards. "Strict + Correct" requires both valid JSON format and correct logic. "Written Correct" counts solutions that are logically right but fail the format contract.

Table: THREE BOARDS PER REASONING MODEL

| MODEL | STRICT + CORRECT | WRITTEN CORRECT | MEDIAN SECONDS | OPENROUTER COST, 3 BOARDS |
| --- | --- | --- | --- | --- |
| GPT-5.6 Sol | 3/3 | 3/3 | 13.70 | $0.034 |
| Claude Opus 4.8 | 2/3 | 3/3 | 39.13 | $0.244 |
| Grok 4.6 via Bedrock | 2/3 | 2/3 | 91.96 | $0.076 + 1 timeout (cost unknown) |
| Gemini 3.1 Pro Preview | 2/3 | 3/3 | 71.97 | $0.313 |

“Format only” means a unique visible solution passed the post-hoc mathematical check while breaking the original JSON-only contract. A post-hoc mathematical check verifies logic after generation. “No answer” is not an invalid queen placement.

## Routes, costs, and operational failures