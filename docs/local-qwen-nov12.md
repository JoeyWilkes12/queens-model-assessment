# Local open-weight update: November 11–12, 2026

The new night adds **138 primary outcome records** to the November 9 snapshot:
48 GPT-OSS 20B medium-effort Fresh2 text calls, 48 Gemma 4 E4B Fresh2 image calls,
and 42 of 48 Qwen 4B Fresh2 image calls. Coverage is now **30 study roots,
973 primary/audit receipts and 38 separate rescues**: 25 fully recorded assessment
conditions (912 calls), three partial conditions (50 recorded of 96 planned),
and two selected audits (11 calls). The 1,019 eligible planned calls retain
46 unrecorded slots: six new Qwen 4B calls and 40 historical original-budget calls.
Qwen 9B Fresh2 text has not started; no frozen plan exists, so its queue intention
is excluded from those denominators.

Sources: [November 12 catalog](../public/evidence/local-qwen/snapshots/2026-11-12-overnight/catalog.json),
[file manifest and hashes](../public/evidence/local-qwen/snapshots/2026-11-12-overnight/manifest.json),
[retained November 9 catalog](../public/evidence/local-qwen/snapshots/2026-11-09-overnight/catalog.json),
[earlier report](local-qwen-nov9.md), and
[reproducible offline analysis](../.empower/2026-11-12-nov12-night/analyze_night.py).
Raw requests, responses, metadata, grades and diagnostics are linked from the
catalog’s study roots. No inference or service action was part of publication.

## Analysis fixed before the night

Queue commit `92d01052422870cce3029cc3d415160709614e64` is dated November 11 at
20:47:35 local. The [fixed analysis committed at 20:56](https://github.com/JoeyWilkes12/queens-model-assessment/blob/46234d1d26c19cd835d96bb259e8dc63fa2921a6/docs/scientific-review-2026-11-11.md#analysis-fixed-in-advance-for-the-studies-queued-on-11-november)
precedes the 23:00 start and first request. Its saved source was checked byte for
byte against that commit. Earlier studies remain exploratory; this precommitment
does not retrospectively preregister them. Primary outcome is strict correctness;
cut-offs and transport errors are not solved and are reported separately.

## Fixed predictions

| Prediction | Status | Fixed numbers and interpretation |
| --- | --- | --- |
| GPT-OSS medium versus high fresh2 | REPLICATED | Medium 31/48 strict, 9 cut-offs; high 25/48 strict, 23 cut-offs. Fewer caps AND at least as many strict required. |
| Gemma Caveman below baseline fresh2 | REPLICATED | Baseline 5/12, Caveman 2/12. Strict inequality required. |
| Qwen 4B fresh2 within ±6 of fresh1 16/48 | NOT YET EVALUABLE | 42/48 recorded, six pending. The fixed 10–22/48 criterion cannot be evaluated until all 48 are recorded. No peek-and-conclude. |
| Qwen 9B fresh2 text below fresh2 image | NOT YET EVALUABLE | Not started: no plan, summary or receipts. Queue intention is not an observation. |

## Paired strict comparisons and exact two-sided tests

| Contrast (left versus right) | Pairs | Left only | Right only | Exact p |
| --- | ---: | ---: | ---: | ---: |
| GPT-OSS medium versus high fresh1 | 48 | 12 | 6 | 0.237884521 |
| GPT-OSS medium versus high fresh2 | 48 | 13 | 7 | 0.263175964 |
| GPT-OSS medium versus high pooled | 96 | 25 | 13 | 0.072951389 |
| Gemma baseline versus Caveman fresh1 | 12 | 4 | 0 | 0.125000000 |
| Gemma baseline versus Caveman fresh2 | 12 | 3 | 0 | 0.250000000 |
| Gemma baseline versus Caveman pooled | 24 | 7 | 0 | 0.015625000 |

Exact p = min(1, 2 × sum binomial(n,k) for k=0..min(left-only,right-only) / 2^n), n = discordant pairs; concordant pairs excluded from the sign-test denominator. Pooled effort uses 96 matched board×arm calls, Gemma 24 matched boards, as fixed in advance. Four arms reuse each board: 96 pairs are not 96 independent boards. No extra outcome or multiplicity correction was introduced.

Under the fixed nominal p<0.05 rule, GPT-OSS accuracy effect does not meet the threshold; Gemma deficit meets it. Directional replication is distinct from that threshold. Four predictions were fixed; only two are evaluable now. One successful prediction by chance is plausible. The direction/±6 criteria have no specified null success probability, so an exact chance count is UNCONFIRMED; do not turn nominal p-values into that probability. Under four independent nominal 5% tests alone, the illustrative probability of at least one false positive is 1−0.95^4≈18.5%, but these four criteria are neither all 5% tests nor independent.

## Results by arm and size

Each size cell is **strict / recorded**, with four planned calls per cell.
Format-only is a separately derived conservative recovery diagnostic; it never
upgrades strict correctness. All three studies request greedy temperature zero,
seed 20261028, 32,768 output / 36,864 context, cold unloads and four arms in
alternating forward/reverse board order. GPT-OSS requests medium effort;
Gemma and Qwen request boolean thinking. All detectors are shadow-only; no rescues.

### gpt-oss-20b-fresh2-text-think-medium-4arm-np32768

Recorded 48/48; strict 31/48; request hours 3.580620.

| Arm | 5×5 | 7×7 | 9×9 | Strict/recorded | Format-only | Cut-offs | Shadow flags | Strict escapes | Transport |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| baseline | 4/4 | 4/4 | 1/4 | 9/12 | 0 | 2 | 0 | 0 | 0 |
| schema | 3/4 | 2/4 | 2/4 | 7/12 | 0 | 3 | 3 | 1 | 0 |
| neutral | 4/4 | 3/4 | 1/4 | 8/12 | 0 | 3 | 2 | 1 | 0 |
| caveman | 4/4 | 3/4 | 0/4 | 7/12 | 0 | 1 | 2 | 0 | 0 |



### gemma4-e4b-fresh2-4arm-np32768

Recorded 48/48; strict 13/48; request hours 1.410192.

| Arm | 5×5 | 7×7 | 9×9 | Strict/recorded | Format-only | Cut-offs | Shadow flags | Strict escapes | Transport |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| baseline | 4/4 | 1/4 | 0/4 | 5/12 | 0 | 0 | 0 | 0 | 0 |
| schema | 3/4 | 0/4 | 0/4 | 3/12 | 0 | 0 | 0 | 0 | 0 |
| neutral | 2/4 | 1/4 | 0/4 | 3/12 | 0 | 0 | 0 | 0 | 0 |
| caveman | 1/4 | 1/4 | 0/4 | 2/12 | 0 | 0 | 0 | 0 | 0 |



### qwen3.5-4b-fresh2-4arm-np32768

Recorded 42/48; strict 18/42; request hours 4.767026.

| Arm | 5×5 | 7×7 | 9×9 | Strict/recorded | Format-only | Cut-offs | Shadow flags | Strict escapes | Transport |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| baseline | 1/4 | 1/4 | 1/3 | 3/11 | 5 | 3 | 0 | 0 | 0 |
| schema | 3/4 | 4/4 | 1/3 | 8/11 | 0 | 3 | 2 | 0 | 0 |
| neutral | 1/4 | 2/3 | 0/3 | 3/10 | 3 | 4 | 2 | 0 | 0 |
| caveman | 3/4 | 1/3 | 0/3 | 4/10 | 0 | 3 | 1 | 0 | 0 |



The unfinished Qwen 4B totals are recorded calls only: 18/42 strict, eight
format-only, 13 cut-offs and three completed incorrect answers. Baseline/schema
have 11/12 recorded; neutral/Caveman 10/12. No result is imputed for the six
unobserved calls. The fixed criterion compares a **completed** score with 16/48
within ±6 (10–22 strict); no success/failure conclusion is drawn while partial.
Qwen 9B Fresh2 text has no plan, summary or receipt directory and no observed
strict, formatting, cut-off, detector, transport or timing result.

## Usage, timing and detector observations

No new tariff was captured. The October 30 reference pricing has no saved exact
gpt-oss or Gemma rate, and Qwen 4B still uses an explicitly labelled proxy in
hosted-rate scenarios. Local provider fees are zero; power/hardware cost remains
unmeasured. Request hours sum metadata.elapsed_seconds and exclude admission,
placement, idle gaps and abandoned work outside recorded requests. They are
neither a hosted bill nor total overnight compute.

| New condition | Recorded / planned | Input tokens (coverage) | Output tokens (coverage) | Request hours | Shadow flags / recorded | Strict escapes / flags | Transport |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| gpt-oss-20b-fresh2-text-think-medium-4arm-np32768 | 48/48 | 47,464 (48/48) | 609,588 (48/48) | 3.581 | 7/48 | 2/7 | 0 |
| gemma4-e4b-fresh2-4arm-np32768 | 48/48 | 52,836 (48/48) | 529,995 (48/48) | 1.410 | 0/48 | 0/0 | 0 |
| qwen3.5-4b-fresh2-4arm-np32768 | 42/48 | 58,384 (42/42) | 918,108 (42/42) | 4.767 | 5/42 | 0/5 | 0 |

Qwen 4B baseline and Caveman currently cover different recorded board sets;
comparative costs and break-even ratios remain withheld. Pending calls have no
observed usage or forecast cost. Historic canceled/transport-failure usage remains
null; completed-condition labels do not imply every call returned an answer.

## Session, provenance and scientific limits

All times here are America/Denver. Session `20261111T230000` runs November 11
23:00:00 → November 12 08:52:02. The log and receipts agree on **138 starts and
138 recorded outcomes**, all in the three new studies. Old-model “complete” labels
at 23:00:16–17 are checks of existing evidence. Medium finishes at 02:37:42,
Gemma at 04:04:30; Qwen 4B stops cleanly at 08:51:06 because the estimated next
request (648 seconds) would exceed the 09:00 deadline. No abandoned started-only
attempt or new transport error is present. The older abandoned attempt and
65k transport error remain documented in the [November 9 report](local-qwen-nov9.md).

There are two GPT-OSS memory-admission waits, at 23:01:32 (active memory
14.27 GiB > 9.5 allowed) and 01:49:54 (13.96 > 9.5), plus 44 admissions under
the existing anonymous-memory alternative. Session gate_retries is empty; there
are no whole-study gate deferrals or tripped resource guards. Receipt host windows
reach pressure level 2 (Warning) for medium and level 1 (Normal) for Gemma/Qwen.
Whether pressure changed answers is **UNCONFIRMED**. The log records successful
Docker pause and restoration by the benchmark owner; the publication made no
service changes. Operational logs remain outside the public snapshot allowlist.

All 138 new receipts map runner hash
`97114c58b735a4bbc84a13ae6b78bb9351c2d657e65b3705c4be593e8ddf9d47`
to commit `e89d4a9dd6958c660e4efb905fc32fe17864e56b` through
runner-versions.json. Plans record Ollama 0.40.10. No recorded runner or Ollama
version change occurs within this night; no live service probe was performed.
GPT-OSS high Fresh2 uses the same runner hash; Gemma fresh1 is older and has
different runner chronology. Mapped script identity is not proof of the whole
receipt-time checkout’s cleanliness. Each new plan was frozen before its first
request; the queue and analysis were committed earlier still.

Fresh1 and Fresh2 are disjoint twelve-board local panels drawn deterministically
from an already public hosted corpus. Four prompt arms reuse each board, and
alternating order is counterbalancing, not random treatment assignment. The
fixed pooled effort analysis uses 96 matched board×arm calls but only 24 unique
boards. Greedy run-to-run variance, cross-night host/runner changes, prompt bundles
and architecture/modality differences remain. Gemma’s nominal deficit applies
to these frozen configurations and panels; it does not establish a general
Caveman mechanism or a family-wide effect. No isolated causal or population
accuracy ranking is claimed. **No deviation from the fixed analysis.**

Next: the six missing 4B calls and unstarted 9B text condition remain open; no
queue changes or scheduling recommendations are part of this update.

## Publication scope and validation

Updated `#/local-qwen`, its study/receipt routes and `#/changelog`. Activating the
shared index also refreshes `#/caveman-summary` and completed/incomplete open-weight
leaderboard data, with no leaderboard source or CSS changes. The original
`#/caveman-summary/pilot` and hosted-comparison local rows retain their historical
4B pilot scope. The earlier November 9 snapshot and every other historical
snapshot remain immutable.

The inactive capture was completed and verified November 12 at 20:25 local,
well before the 22:40 capture deadline. The importer’s double-read hash/inventory
check and an independent source-state comparison both passed. Active index
stayed unchanged through the evidence checkpoint; activation accompanied the
presentation update. Exact offline test, hash/grade verification, public scrub,
board, changelog, cost/display-contract and build results are recorded in the
worktree’s REVIEW.md.
