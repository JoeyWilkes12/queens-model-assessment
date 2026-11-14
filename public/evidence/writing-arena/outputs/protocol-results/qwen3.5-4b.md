# Freeze the input before interpreting the output.

The cleanest result in the report is the protocol boundary: identical board bytes, one request, no tools, and a separate diagnostic for formatting. This ensures we test the model on fixed data without external interference.

## What each entrant actually received

This section details what data each AI model (entrant) processed during the test. We define an **entrant** as any software agent running the Queens evaluation. An **entrant** receives specific inputs based on its configuration.

Table: EVALUATION CONDITIONS

| CONDITION | INPUT | MODEL WORK | EXTERNAL HELP |
| --- | --- | --- | --- |
| Four reasoning models | Same image and rules per board | Generate complete written placement | None; no repair turns |
| Jev native row choices | Canonical text region grid | Select one column per row | Fixed typed options |
| Jev candidate recognition | Text board plus complete placements | Choose one option | Candidate construction by code |
| Repository solver | Exact region map | Solve explicit Boolean constraints | Local Z3; not a timed entrant · How Z3 solves Queens |

Figure caption: Image shows clean 768×768 synthetic PNGs with region letters. They were not live-game screenshots or unlabelled color fields.

## Reasoning-model results

This section lists performance metrics for the reasoning models tested on three boards.

Table: THREE BOARDS PER REASONING MODEL

| MODEL | STRICT + CORRECT | WRITTEN CORRECT | MEDIAN SECONDS | OPENROUTER COST, 3 BOARDS |
| --- | --- | --- | --- | --- |
| GPT-5.6 Sol | 3/3 | 3/3 | 13.70 | $0.034 |
| Claude Opus 4.8 | 2/3 | 3/3 | 39.13 | $0.244 |
| Grok 4.6 via Bedrock | 2/3 | 2/3 | 91.96 | $0.076 + 1 timeout (cost unknown) |
| Gemini 3.1 Pro Preview | 2/3 | 3/3 | 71.97 | $0.313 |

“Format only” means a unique visible solution passed the post-hoc mathematical check while breaking the original JSON-only contract. This indicates a valid result despite format issues. “No answer” is not an invalid queen placement. It may simply mean no response was generated for that specific board.

## Routes, costs, and operational failures