# Local open-weight update: November 12–13, 2026

The new night adds **54 primary outcome records** to the November 12 snapshot:
six remaining Qwen 4B Fresh2 image calls and 48 Qwen 9B Fresh2 text calls.
**All four fixed criteria hold.** Qwen 4B finishes at 19/48 strict (Fresh1 16/48,
inside ±6); Qwen 9B text finishes at 27/48 versus image’s 43/48.
The earlier GPT-OSS and Gemma conclusions are unchanged.

Coverage is now **31 study roots, 1,027 primary/audit receipts and 38 separate
rescues**: 27 completed assessment conditions (1,008 calls), two historical
original-budget partial conditions (eight recorded of 48 planned), and two
selected audits (11 calls). All six Fresh2 conditions have 48/48 recorded.
The 1,067 eligible planned calls retain 40 historical unrecorded slots; no
unfinished queued condition remains. Cut-offs count as recorded outcomes,
not solved boards. Historical transport-failure usage remains null.

Sources: [November 13 catalog](../public/evidence/local-qwen/snapshots/2026-11-13-overnight/catalog.json),
[file manifest and hashes](../public/evidence/local-qwen/snapshots/2026-11-13-overnight/manifest.json),
[retained November 12 catalog](../public/evidence/local-qwen/snapshots/2026-11-12-overnight/catalog.json),
[previous report](local-qwen-nov12.md), and
[reproducible offline analysis](../.empower/2026-11-13-nov13-night/analyze_night.py).
Requests, responses, metadata, grades and diagnostics are linked from each
catalog study. New snapshot: 6,934 manifest-hashed files, plus the manifest itself.
No inference or service action was part of this publication.

## Analysis fixed before the night

Queue commit `92d01052422870cce3029cc3d415160709614e64` is dated November 11
20:47:35 local. The [analysis committed at 20:56](https://github.com/JoeyWilkes12/queens-model-assessment/blob/46234d1d26c19cd835d96bb259e8dc63fa2921a6/docs/scientific-review-2026-11-11.md#analysis-fixed-in-advance-for-the-studies-queued-on-11-november)
precedes both nights. Its saved source matches that commit byte for byte.
Strict is primary. Cut-offs and transport errors are not solved and remain
separately reported. Earlier studies remain exploratory.

## Final fixed predictions

| Prediction | Status | Fixed numbers and interpretation |
| --- | --- | --- |
| 1. GPT-OSS medium versus high fresh2 | REPLICATED | Medium 31/48 strict and 9 cut-offs; high 25/48 and 23. Both fewer cut-offs and at least as many strict required. |
| 2. Gemma Caveman below baseline fresh2 | REPLICATED | Baseline 5/12; Caveman 2/12. Strict inequality required. |
| 3. Qwen 4B fresh2 within ±6 of fresh1 | REPLICATED | Fresh2 19/48 versus fresh1 16/48: difference +3, within the fixed 10–22 strict interval. No directional arm prediction was fixed. |
| 4. Qwen 9B fresh2 text below image | REPLICATED | Text 27/48 versus image 43/48 across all four arms. Strict inequality required. |

4 of four fixed predictions hold. This is informative prospective agreement across the complete specified set, rather than selecting a successful contrast afterward. Three criteria predict directions; Qwen 4B predicts a ±6 replication band, explicitly not a direction. There is no fixed joint null model, independence assumption or chance-success probability for these mixed criteria; the exact probability of four successes by chance is UNCONFIRMED. Do not interpret the count as four significant effects.

The fixed pooled GPT-OSS accuracy test has discordance 25 medium-only versus 13 high-only, exact two-sided p=0.072951389: no accuracy effect is licensed by the fixed p<0.05 rule. Gemma has seven baseline-only versus zero Caveman-only boards pooled over fresh1/fresh2, p=0.015625: the nominal fixed rule licenses a deficit for these frozen configurations and panels. No general Caveman mechanism is identified. Neither the Qwen 4B replication band nor the Qwen 9B directional rule licenses an accuracy-effect claim. No extra significance threshold or multiplicity correction was introduced.

Each set is twelve public boards, four per size, with one greedy run per board×arm cell. Four arms reuse each board; 48 calls are not 48 independent boards. The effort pool has 96 matched calls on 24 boards, and the Gemma pool 24 matched boards. These are disjoint local replication panels drawn deterministically from an already public hosted corpus, not unseen held-out tasks. Run-to-run variation, cross-night host conditions, architecture and prompt bundles remain limits. A format-only diagnostic never upgrades strict correctness.

## Newly completed studies: results by arm and size

Every size cell is strict/recorded (four planned). Full arm×size diagnostics follow below. Shadow flags never stop generation; strict escapes are flagged calls that finish strictly correct.

### qwen3.5-4b-fresh2-4arm-np32768

Recorded 48/48; strict 19/48; request hours 5.707725.

| Arm | 5×5 | 7×7 | 9×9 | Strict/recorded | Format-only | Cut-offs | Shadow flags | Strict escapes | Transport |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| baseline | 1/4 | 1/4 | 1/4 | 3/12 | 5 | 4 | 1 | 0 | 0 |
| schema | 3/4 | 4/4 | 1/4 | 8/12 | 0 | 4 | 2 | 0 | 0 |
| neutral | 1/4 | 2/4 | 0/4 | 3/12 | 4 | 5 | 2 | 0 | 0 |
| caveman | 3/4 | 2/4 | 0/4 | 5/12 | 0 | 4 | 2 | 0 | 0 |

Totals: 9 format-only; 17 cut-offs; 7 shadow flags; 0 strict escapes; 0 transport errors. Input tokens 67,944; output tokens 1,096,837, both 48/48 observed.

### qwen3.5-9b-nvfp4-fresh2-text-4arm-np32768

Recorded 48/48; strict 27/48; request hours 8.446880.

| Arm | 5×5 | 7×7 | 9×9 | Strict/recorded | Format-only | Cut-offs | Shadow flags | Strict escapes | Transport |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| baseline | 3/4 | 1/4 | 0/4 | 4/12 | 0 | 8 | 7 | 0 | 0 |
| schema | 3/4 | 3/4 | 0/4 | 6/12 | 0 | 6 | 4 | 0 | 0 |
| neutral | 4/4 | 3/4 | 2/4 | 9/12 | 0 | 3 | 2 | 0 | 0 |
| caveman | 3/4 | 4/4 | 1/4 | 8/12 | 0 | 4 | 3 | 0 | 0 |

Totals: 0 format-only; 21 cut-offs; 16 shadow flags; 0 strict escapes; 0 transport errors. Input tokens 45,496; output tokens 1,151,034, both 48/48 observed.

## Descriptive paired comparisons

Qwen 4B fresh2 baseline/Caveman: 2 baseline-only boards ['panel-7-46', 'panel-9-32']; 4 Caveman-only boards ['panel-5-42', 'panel-5-63', 'panel-7-38', 'panel-7-62']. Exact two-sided p=0.687500000, descriptive only. No directional baseline/Caveman prediction was fixed.

Qwen 9B matches by board ID, geometry and arm. These breakdowns are descriptive; the fixed decision uses all four arms combined.

| Arm / size | Text strict/recorded | Image strict/recorded | Text only | Image only |
| --- | ---: | ---: | ---: | ---: |
| All arms | 27/48 | 43/48 | 0 | 16 |
| All arms — 5×5 | 13/16 | 16/16 | 0 | 3 |
| All arms — 7×7 | 11/16 | 16/16 | 0 | 5 |
| All arms — 9×9 | 3/16 | 11/16 | 0 | 8 |
| baseline | 4/12 | 11/12 | 0 | 7 |
| baseline — 5×5 | 3/4 | 4/4 | 0 | 1 |
| baseline — 7×7 | 1/4 | 4/4 | 0 | 3 |
| baseline — 9×9 | 0/4 | 3/4 | 0 | 3 |
| schema | 6/12 | 12/12 | 0 | 6 |
| schema — 5×5 | 3/4 | 4/4 | 0 | 1 |
| schema — 7×7 | 3/4 | 4/4 | 0 | 1 |
| schema — 9×9 | 0/4 | 4/4 | 0 | 4 |
| neutral | 9/12 | 11/12 | 0 | 2 |
| neutral — 5×5 | 4/4 | 4/4 | 0 | 0 |
| neutral — 7×7 | 3/4 | 4/4 | 0 | 1 |
| neutral — 9×9 | 2/4 | 3/4 | 0 | 1 |
| caveman | 8/12 | 9/12 | 0 | 1 |
| caveman — 5×5 | 3/4 | 4/4 | 0 | 1 |
| caveman — 7×7 | 4/4 | 4/4 | 0 | 0 |
| caveman — 9×9 | 1/4 | 1/4 | 0 | 0 |

## Prior fixed tests (unchanged)

| Contrast | Pairs | Left only | Right only | Exact two-sided p |
| --- | ---: | ---: | ---: | ---: |
| GPT-OSS medium/high fresh1 | 48 | 12 | 6 | 0.237884521 |
| GPT-OSS medium/high fresh2 | 48 | 13 | 7 | 0.263175964 |
| GPT-OSS medium/high pooled | 96 | 25 | 13 | 0.072951389 |
| Gemma baseline/Caveman fresh1 | 12 | 4 | 0 | 0.125000000 |
| Gemma baseline/Caveman fresh2 | 12 | 3 | 0 | 0.250000000 |
| Gemma baseline/Caveman pooled | 24 | 7 | 0 | 0.015625000 |

Exact p=min(1, 2×sum(comb(n,k), k=0..min(left-only,right-only))/2^n), n=discordant pairs. Unchanged from the fixed analysis.

## Session, provenance and cross-night conditions

Session `20261112T210028` started November 12 at 21:00:28 and finished November 13 at 06:26:02 (America/Denver). The early start is documented; who or what initiated it is UNCONFIRMED. A session file and its arguments do not establish the initiator. Old-model completion labels at 21:00:47–48 are checks of existing evidence, not new requests. Exactly 54 started and 54 recorded events reconcile with six remaining 4B calls and 48 new 9B text calls. 4B finished at 21:57:20; 9B text finished at 06:25:07.

There are no whole-study gate deferrals (gate_retries=[]), waiting/admitted_anonymous events, abandoned starts, transport errors or resource-guard trips for these new calls. No abandoned metadata exists in either newly completed study. The rescue_skipped event at 21:00:48 checks an old sampling-r3 cut-off (baseline_panel-9-08); no new rescue was run. Docker pause/restore both have returncode 0 in the session; this review performed no service action. Queue entries remain historical configuration: “empty” means no unfinished work after these completions, not necessarily an empty JSON array.

### Provenance: qwen3.5-4b-fresh2-4arm-np32768

Plan frozen 2026-11-12T11:04:30.210333+00:00; first request 2026-11-12T04:04:32.584854-07:00; last completion 2026-11-12T21:57:20.066784-07:00. Plan records Ollama 0.40.10.

- November 11→12: 42 calls, 18 strict; 4.767026 request hours; runner hash→commit [('97114c58b735a4bbc84a13ae6b78bb9351c2d657e65b3705c4be593e8ddf9d47', 'e89d4a9dd6958c660e4efb905fc32fe17864e56b')]; host-window metric ranges `{"max_compressor_gib": [1.11, 2.36], "max_model_size_gib": [3.68, 8.73], "max_model_vram_gib": [3.68, 8.73], "max_pressure_level": [1, 1], "min_free_plus_inactive_gib": [4.37, 9.4], "samples": [10, 64], "swap_used_gib_end": [2.55, 2.66], "swap_used_gib_max": [2.55, 2.66], "swap_used_gib_start": [2.55, 2.66]}`.
- November 12→13: 6 calls, 1 strict; 0.940699 request hours; runner hash→commit [('97114c58b735a4bbc84a13ae6b78bb9351c2d657e65b3705c4be593e8ddf9d47', 'e89d4a9dd6958c660e4efb905fc32fe17864e56b')]; host-window metric ranges `{"max_compressor_gib": [1.13, 1.15], "max_model_size_gib": [3.68, 3.68], "max_model_vram_gib": [3.68, 3.68], "max_pressure_level": [1, 1], "min_free_plus_inactive_gib": [7.81, 7.91], "samples": [34, 62], "swap_used_gib_end": [1.47, 1.47], "swap_used_gib_max": [1.47, 1.47], "swap_used_gib_start": [1.47, 1.47]}`.

### Provenance: qwen3.5-9b-nvfp4-fresh2-text-4arm-np32768

Plan frozen 2026-11-13T04:57:20.166606+00:00; first request 2026-11-12T21:57:22.603970-07:00; last completion 2026-11-13T06:25:07.628199-07:00. Plan records Ollama 0.40.10.

- November 12→13: 48 calls, 27 strict; 8.446880 request hours; runner hash→commit [('97114c58b735a4bbc84a13ae6b78bb9351c2d657e65b3705c4be593e8ddf9d47', 'e89d4a9dd6958c660e4efb905fc32fe17864e56b')]; host-window metric ranges `{"max_compressor_gib": [1.63, 2.36], "max_model_size_gib": [6.67, 6.7], "max_model_vram_gib": [6.67, 6.7], "max_pressure_level": [1, 1], "min_free_plus_inactive_gib": [4.800000000000001, 5.949999999999999], "samples": [18, 88], "swap_used_gib_end": [1.47, 1.47], "swap_used_gib_max": [1.47, 1.47], "swap_used_gib_start": [1.47, 1.47]}`.

All 96 calls in the two completed Qwen studies use runner hash `97114c58b735a4bbc84a13ae6b78bb9351c2d657e65b3705c4be593e8ddf9d47` → commit `e89d4a9dd6958c660e4efb905fc32fe17864e56b` via runner-versions.json. The committed script bytes were independently hashed. The 42+6 parts of 4B share that runner and the same frozen Ollama 0.40.10 plan/runtime; no recorded version change. Host ranges differ numerically across the two parts (reported above); pressure levels and resource-guard evidence describe observed windows only. A causal answer effect, identical host conditions or a clean complete receipt-time checkout is UNCONFIRMED. The 9B fresh2 image comparator also records this runner hash and Ollama 0.40.10, on earlier nights. Equal recorded script/runtime identities do not establish equal host conditions. No live version probe was performed.

Queue commit `92d01052422870cce3029cc3d415160709614e64` (November 11 20:47:35 local) and analysis commit `46234d1d26c19cd835d96bb259e8dc63fa2921a6` (20:56:00) predate both nights. The supplied analysis matches the committed source byte for byte. This does not retrospectively preregister earlier work.

Request hours sum metadata.elapsed_seconds: not total job compute, admission, placement, idle time, abandoned work or a hosted bill. No prices refreshed; 4B remains a labelled hosted-rate proxy, and local electricity/hardware remains unmeasured.

## Arm × size diagnostics

| Study | Arm | Size | Strict/recorded | Format-only | Cut-offs | Flags | Strict escapes | Transport |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| qwen3.5-4b-fresh2-4arm-np32768 | baseline | 5 | 1/4 | 3 | 0 | 0 | 0 | 0 |
| qwen3.5-4b-fresh2-4arm-np32768 | baseline | 7 | 1/4 | 2 | 1 | 0 | 0 | 0 |
| qwen3.5-4b-fresh2-4arm-np32768 | baseline | 9 | 1/4 | 0 | 3 | 1 | 0 | 0 |
| qwen3.5-4b-fresh2-4arm-np32768 | schema | 5 | 3/4 | 0 | 1 | 1 | 0 | 0 |
| qwen3.5-4b-fresh2-4arm-np32768 | schema | 7 | 4/4 | 0 | 0 | 0 | 0 | 0 |
| qwen3.5-4b-fresh2-4arm-np32768 | schema | 9 | 1/4 | 0 | 3 | 1 | 0 | 0 |
| qwen3.5-4b-fresh2-4arm-np32768 | neutral | 5 | 1/4 | 3 | 0 | 0 | 0 | 0 |
| qwen3.5-4b-fresh2-4arm-np32768 | neutral | 7 | 2/4 | 1 | 1 | 1 | 0 | 0 |
| qwen3.5-4b-fresh2-4arm-np32768 | neutral | 9 | 0/4 | 0 | 4 | 1 | 0 | 0 |
| qwen3.5-4b-fresh2-4arm-np32768 | caveman | 5 | 3/4 | 0 | 1 | 1 | 0 | 0 |
| qwen3.5-4b-fresh2-4arm-np32768 | caveman | 7 | 2/4 | 0 | 0 | 0 | 0 | 0 |
| qwen3.5-4b-fresh2-4arm-np32768 | caveman | 9 | 0/4 | 0 | 3 | 1 | 0 | 0 |
| qwen3.5-9b-nvfp4-fresh2-text-4arm-np32768 | baseline | 5 | 3/4 | 0 | 1 | 1 | 0 | 0 |
| qwen3.5-9b-nvfp4-fresh2-text-4arm-np32768 | baseline | 7 | 1/4 | 0 | 3 | 3 | 0 | 0 |
| qwen3.5-9b-nvfp4-fresh2-text-4arm-np32768 | baseline | 9 | 0/4 | 0 | 4 | 3 | 0 | 0 |
| qwen3.5-9b-nvfp4-fresh2-text-4arm-np32768 | schema | 5 | 3/4 | 0 | 1 | 0 | 0 | 0 |
| qwen3.5-9b-nvfp4-fresh2-text-4arm-np32768 | schema | 7 | 3/4 | 0 | 1 | 1 | 0 | 0 |
| qwen3.5-9b-nvfp4-fresh2-text-4arm-np32768 | schema | 9 | 0/4 | 0 | 4 | 3 | 0 | 0 |
| qwen3.5-9b-nvfp4-fresh2-text-4arm-np32768 | neutral | 5 | 4/4 | 0 | 0 | 0 | 0 | 0 |
| qwen3.5-9b-nvfp4-fresh2-text-4arm-np32768 | neutral | 7 | 3/4 | 0 | 1 | 1 | 0 | 0 |
| qwen3.5-9b-nvfp4-fresh2-text-4arm-np32768 | neutral | 9 | 2/4 | 0 | 2 | 1 | 0 | 0 |
| qwen3.5-9b-nvfp4-fresh2-text-4arm-np32768 | caveman | 5 | 3/4 | 0 | 1 | 1 | 0 | 0 |
| qwen3.5-9b-nvfp4-fresh2-text-4arm-np32768 | caveman | 7 | 4/4 | 0 | 0 | 0 | 0 | 0 |
| qwen3.5-9b-nvfp4-fresh2-text-4arm-np32768 | caveman | 9 | 1/4 | 0 | 3 | 2 | 0 | 0 |

## Deviations, prices and publication scope

No deviation from the fixed outcome definitions, decision criteria or pooled
tests. The arm/size modality breakdowns, Qwen 4B baseline/Caveman discordance,
diagnostics and provenance are descriptive. Prediction 3 is explicitly a
nondirectional replication band; “all four” does not turn it into a directional
Caveman prediction. The [November 9 report](local-qwen-nov9.md) retains the earlier
interrupted start and 65k transport error; no historical outcome was rewritten.

The October 30 hosted-rate reference remains unchanged. Failed and capped
attempts remain in spend denominators. Completed 4B Fresh2 now has matched
baseline/Caveman board coverage, so comparative cost scenarios can be shown;
its tariff is still an explicit proxy. No hosted-rate scenario is a local
power/hardware measurement or a hosted bill forecast.

Updated `#/local-qwen`, its study/receipt routes and `#/changelog`. The matched
Fresh2 text/image table includes all four arms and each board size. Activation
also refreshes shared-index data in `#/caveman-summary` and completed/incomplete
open-weight leaderboard views, without leaderboard source or CSS changes.
The original `#/caveman-summary/pilot` and hosted-comparison local rows retain
their historical 4B pilot scope.

The inactive capture completed November 13 at 21:49:32 MST, before the 22:50
cutoff and 23:00 completion-check job. Importer double-read inventory/hash checks
and an independent source inventory comparison passed. All 34,782 previous
public files, including the active index, stayed byte-identical through the
evidence checkpoint. Activation then copied the verified candidate catalog
with its display changes. All historical snapshots remain immutable.
The source and snapshot-only analyses produce exactly equal result JSON.
Required validation and browser-check results are recorded in the worktree’s
[REVIEW.md](../.empower/2026-11-13-nov13-night/REVIEW.md).
