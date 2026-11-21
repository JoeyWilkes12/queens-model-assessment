# Input Integrity: Freezing the Test Environment

The most reliable results come from the protocol boundary. This boundary ensures identical board bytes, a single request, no external tools, and a separate diagnostic for output formatting.

## Test Conditions and Model Inputs

The test used four types of entrants. These entrants varied in how they received the puzzle input. The inputs ranged from synthetic images to precise Boolean constraints.

| CONDITION | INPUT | MODEL WORK | EXTERNAL HELP |
| :--- | :--- | :--- | :--- |
| Four reasoning models | Same image and rules per board | Generate complete written placement | None; no repair turns |
| Jev native row choices | Canonical text region grid | Select one column per row | Fixed typed options |
| Jev candidate recognition | Text board plus complete placements | Choose one option | Candidate construction by code |
| Repository solver | Exact region map | Solve explicit Boolean constraints | Local Z3; not a timed entrant · How Z3 solves Queens |

The images used were clean 768×768 synthetic PNGs. These images included region letters. They were not screenshots from a live game, nor were they unlabelled color fields.

## Performance of Reasoning Models

We tested four reasoning models. The results measured correctness, speed, and cost.

Figure caption: Table showing the performance metrics of the four reasoning models on three boards.

| MODEL | STRICT + CORRECT | WRITTEN CORRECT | MEDIAN SECONDS | OPENROUTER COST, 3 BOARDS |
| :--- | :--- | :--- | :--- | :--- |
| GPT-5.6 Sol | 3/3 | 3/3 | 13.70 | $0.034 |
| Claude Opus 4.8 | 2/3 | 3/3 | 39.13 | $0.244 |
| Grok 4.6 via Bedrock | 2/3 | 2/3 | 91.96 | $0.076 + 1 timeout (cost unknown) |
| Gemini 3.1 Pro Preview | 2/3 | 3/3 | 71.97 | $0.313 |

“Strict + Correct” means the model provided a unique visible solution that passed a post-hoc mathematical check. This check also required the solution to be generated in a written format, even if the original contract demanded only a JSON response. “Written Correct” means the solution was visible and correct. “No answer” does not indicate an invalid queen placement.

## Operational Failures and Resource Costs

The different input methods resulted in varying operational outcomes. The costs and operational failures varied significantly between the models.