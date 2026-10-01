# Queens diagnostic completion

## Contents

- [Run and audit](#run-and-audit)
- [Boundaries](#boundaries)

## Run and audit

This is a separate, offline-prepared $5 study. Root is the only inference
caller. Read `PROTOCOL.md` before freezing or sending requests.

1. Save the live, read-only catalog and three endpoint receipts:
   `python3 discover.py`
2. Freeze all 36 requests after reviewing the receipts:
   `python3 experiment.py freeze`
3. Inspect the frozen schedule and hashes. Root may send at most three calls
   per invocation with `python3 experiment.py next --count 3`.
4. Recompute local grades and descriptive summaries at any time with:
   `python3 experiment.py analyze`

5. Require all terminal outcomes with `python3 verify_experiment.py --require-complete`, then build the report and public bundle and run `verify_public_evidence.py`. After successful Pages deployment, `verify_deployment.py` reads back the audited public files over HTTPS.

## Boundaries

`freeze` refuses changed model routes/prices, stale source grades, absent
discovery receipts, or a worst-case plan that exceeds the dedicated $5 cap.
`next` verifies source, protocol, discovery, and request hashes before each
send, reserves the remaining schedule before dispatch, and never retries an
existing start marker. The earlier study and its unused budget are untouched.
