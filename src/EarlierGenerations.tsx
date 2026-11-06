import { Suspense, useEffect, useState } from 'react'
import { assetUrl, LocalToc, PageHero, Section, Callout, DataTable, bookUi } from './bookUi'
import { LegacyPanel } from './chapters'

export type EarlierBoardResult = {
  board_id: string
  strict_correct: boolean | null
  written_correct: boolean | null
  failure: string | null
  finish_reason: string | null
  seconds: number | null
  cost_usd: number | null
  call_id: string
}

export type EarlierModelResult = {
  model: string
  family: string
  round: number
  condition: string
  attempted: number
  strict_correct: number
  written_correct: number
  median_seconds: number | null
  cost_usd: number | null
  boards: EarlierBoardResult[]
}

export type EarlierGenerationsSummary = {
  study: string
  updated_utc: string
  status: 'complete' | 'running'
  attempted: number
  original_attempted: number
  strict_correct: number
  written_correct: number
  known_cost_usd: number
  original_cost_usd: number
  diagnostic_cost_usd: number
  accounted_usd: number
  budget_usd: number
  remaining_usd: number
  models: EarlierModelResult[]
  first_failures: {
    family: string
    model: string
    round: number
    board_id: string
    failure: string | null
    finish_reason: string | null
    written_failure: string
    written_checks: Record<string, boolean>
    candidate_count: number
  }[]
  diagnostic_results: {
    model: string
    board_id: string
    condition: string
    strict_correct: boolean | null
    written_correct: boolean | null
    seconds: number | null
    cost_usd: number | null
    call_id: string
  }[]
  limits: string[]
  conclusions: string[]
}

export type CompletionReplicate = {
  replicate: number
  call_id: string
  attempted: boolean
  correct: boolean | null
  written_correct: boolean | null
  failure: string | null
  extraction_failure: string | null
  finish_reason: string | null
  seconds: number | null
  cost_usd: number | null
}

export type CompletionPair = {
  matched_pair_id: string
  family: string
  model: string
  board_id: string
  historical_source_call_id: string
  source_failure_category: string
  source_failure_basis: Record<string, unknown>
  conditions: {
    condition: string
    label: string
    attempted_calls: number
    strict_correct_count: number
    written_correct_count: number
    replicates: CompletionReplicate[]
  }[]
}

export type DiagnosticCompletionSummary = {
  study: string
  generated_utc: string
  design: string
  attempt_policy: string
  planned_calls: number
  attempted_calls: number
  strict_correct_count: number
  written_correct_count: number
  budget: {
    cap_usd: number
    worst_case_frozen_reserve_usd: number
    known_cost_usd: number | null
    accounted_usd: number | null
    remaining_usd: number | null
  }
  conditions: {
    condition: string
    label: string
    planned_calls: number
    attempted_calls: number
    strict_correct_count: number
    written_correct_count: number
    known_cost_usd: number
    by_replicate: {
      replicate: number
      planned_calls: number
      attempted_calls: number
      strict_correct_count: number
      written_correct_count: number
      known_cost_usd: number
    }[]
  }[]
  pairs: CompletionPair[]
  historical_diagnostics_note: string
}

export function earlierPassLabel(value: boolean | null | undefined) {
  return value === true ? 'Pass' : value === false ? 'Fail' : 'Not scored'
}

export function earlierSeconds(value: number | null | undefined) {
  return typeof value === 'number' && Number.isFinite(value) ? `${value.toFixed(1)} s` : '—'
}

export function earlierUsd(value: number | null | undefined) {
  return typeof value === 'number' && Number.isFinite(value) ? `$${value.toFixed(9)}` : '—'
}

export function earlierReceipt(callId: string | null | undefined) {
  return callId ? (
    <a href={`#/evidence-atlas/2026-10-01-earlier-generations:${callId}`}>Open receipt</a>
  ) : (
    'No request recorded'
  )
}

export function completionReceipt(callId: string) {
  return <a href={`#/evidence-atlas/2026-10-01-diagnostic-completion:${callId}`}>Open receipt</a>
}

export function completionMedianSeconds(pairs: CompletionPair[], condition: string) {
  const times = pairs
    .flatMap(pair => pair.conditions.find(item => item.condition === condition)?.replicates ?? [])
    .map(rep => rep.seconds)
    .filter((value): value is number => typeof value === 'number')
    .sort((a, b) => a - b)
  if (!times.length) return null
  const middle = Math.floor(times.length / 2)
  return times.length % 2 ? times[middle] : (times[middle - 1] + times[middle]) / 2
}

export function completionFindings(data: DiagnosticCompletionSummary) {
  return data.pairs.map(pair => {
    const count = (condition: string) =>
      pair.conditions.find(cell => cell.condition === condition)?.written_correct_count ?? 0
    const image = count('original_image')
    const capped = pair.conditions.flatMap(cell => cell.replicates).filter(rep => rep.finish_reason === 'length').length
    const results = `${pair.model} · ${pair.board_id}: image ${image}/2, matrix ${count('text_only_region_grid_rows')}/2, cell lists ${count('text_only_region_cells')}/2 mathematically valid.`
    return `${results} ${
      image === 2
        ? 'The earlier image failure did not reproduce in either fresh image control.'
        : image === 1
          ? 'The fresh image controls disagreed; the observed failure is not a stable boundary.'
          : capped === 6
            ? 'All six responses hit the completion cap; this does not isolate a rule-solving misconception.'
            : count('text_only_region_grid_rows') === 0 && count('text_only_region_cells') === 0
              ? 'Neither text encoding rescued these one-shot trials; this is not a universal inability claim.'
              : 'Both fresh image controls failed; text differences remain representation-sensitive observations, not a vision-only diagnosis.'
    }`
  })
}

export function EarlierGenerations() {
  const [data, setData] = useState<EarlierGenerationsSummary | null>(null)
  const [error, setError] = useState(false)
  const [completion, setCompletion] = useState<DiagnosticCompletionSummary | null>(null)
  const [completionError, setCompletionError] = useState(false)
  useEffect(() => {
    let active = true
    fetch(assetUrl('evidence/earlier-generations-summary.json'))
      .then(response => {
        if (!response.ok) throw new Error('Summary unavailable')
        return response.json()
      })
      .then(value => {
        if (active) setData(value as EarlierGenerationsSummary)
      })
      .catch(() => {
        if (active) setError(true)
      })
    return () => {
      active = false
    }
  }, [])
  useEffect(() => {
    let active = true
    fetch(assetUrl('evidence/diagnostic-completion-summary.json'))
      .then(response => {
        if (!response.ok) throw new Error('Diagnostic summary unavailable')
        return response.json()
      })
      .then(value => {
        if (active) setCompletion(value as DiagnosticCompletionSummary)
      })
      .catch(() => {
        if (active) setCompletionError(true)
      })
    return () => {
      active = false
    }
  }, [])

  const originalAttempted = data?.models.reduce((total, model) => total + model.attempted, 0) ?? 0
  const originalStrictCorrect = data?.models.reduce((total, model) => total + model.strict_correct, 0) ?? 0
  const originalWrittenCorrect = data?.models.reduce((total, model) => total + model.written_correct, 0) ?? 0
  const modelRows =
    data?.models.map(model => [
      `Candidate rung ${model.round} · ${model.family}`,
      model.model,
      `${model.strict_correct}/${model.attempted}`,
      `${model.written_correct}/${model.attempted}`,
      earlierSeconds(model.median_seconds),
      earlierUsd(model.cost_usd),
    ]) ?? []
  const boardRows =
    data?.models.flatMap(model =>
      model.boards.map(board => [
        model.model,
        `Candidate rung ${model.round}`,
        board.board_id,
        earlierPassLabel(board.strict_correct),
        earlierPassLabel(board.written_correct),
        earlierSeconds(board.seconds),
        earlierUsd(board.cost_usd),
        board.failure || board.finish_reason || '—',
        earlierReceipt(board.call_id),
      ]),
    ) ?? []
  const firstFailureRows =
    data?.first_failures.map(failure => {
      const board = data.models
        .find(model => model.model === failure.model && model.round === failure.round)
        ?.boards.find(result => result.board_id === failure.board_id)
      return [
        failure.family,
        failure.model,
        `Candidate rung ${failure.round}`,
        failure.board_id,
        `Strict: ${failure.failure || '—'}; written: ${failure.written_failure}; objects: ${failure.candidate_count}; ${
          Object.entries(failure.written_checks)
            .filter(([, passed]) => !passed)
            .map(([rule]) => rule)
            .join(', ') ||
          failure.finish_reason ||
          '—'
        }`,
        earlierReceipt(board?.call_id),
      ]
    }) ?? []
  const diagnosticRows =
    data?.diagnostic_results.map(result => [
      result.model,
      result.board_id,
      result.condition,
      earlierPassLabel(result.strict_correct),
      earlierPassLabel(result.written_correct),
      earlierSeconds(result.seconds),
      earlierUsd(result.cost_usd),
      earlierReceipt(result.call_id),
    ]) ?? []

  return (
    <>
      <PageHero
        trail="Model generations / October 1 cohort"
        title="The same board, across earlier model generations."
        deck="A sparse, adaptively reprioritized comparison replays the original image prompts and separates strict JSON-plus-rules success from a deterministic written-answer diagnostic."
        action={{ label: 'Open the request receipts', path: 'evidence-atlas' }}
      />
      <div className="reading-layout">
        <LocalToc
          items={[
            { id: 'earlier-panel', label: '36-board panel' },
            { id: 'earlier-method', label: 'Scoring boundary' },
            { id: 'earlier-models', label: 'By model' },
            { id: 'earlier-receipts', label: 'Every board receipt' },
            { id: 'earlier-failures', label: 'First observed failures' },
            { id: 'earlier-diagnostics', label: 'Historical diagnostics' },
            { id: 'diagnostic-completion', label: 'Matched completion study' },
            { id: 'earlier-limits', label: 'Cost & limits' },
          ]}
        />
        <main className="reading-column" id="main-content">
          <Section id="earlier-panel" title="36 boards per model (17–19 October)">
            <Suspense fallback={<p role="status">Loading the 36-board panel…</p>}>
              <LegacyPanel ui={bookUi} />
            </Suspense>
          </Section>
          {!data && (
            <p role="status">
              {error
                ? 'The saved cohort summary is not available. You can still inspect this study’s saved requests and responses in the evidence atlas.'
                : 'Loading the saved cohort summary…'}
            </p>
          )}
          {data && (
            <>
              {data.status === 'running' && (
                <Callout tone="caution" title="This cohort is still in progress.">
                  The counts below are a live saved summary, not a final result. Do not interpret unfinished requests or
                  phases as the generation ladder’s stopping point.
                </Callout>
              )}
              <Section id="earlier-method" title="Same images, separate scores, adaptive sparse schedule">
                <p className="lead">
                  Strict success requires the original JSON-only contract and every Queens rule. The separate
                  written-answer diagnostic extracts exactly one schema-shaped JSON object from visible text, then
                  applies the same deterministic checker; it does not repair placements or replace the strict score.
                </p>
                <p>
                  The original frozen candidate ladder was reprioritized after round 1 to spend the limited budget on
                  older cross-family anchors before deeper within-family probes. The “candidate rung” shown below
                  preserves each model’s position in that original ladder; it is{' '}
                  <strong>not execution chronology</strong>. Consult the schedule amendment for the actual adaptive
                  sequence. Skipped intermediate releases are unobserved—not passes or failures—so this study cannot
                  establish a contiguous generation threshold.
                </p>
                <DataTable
                  caption="Original-image cohort summary"
                  headers={['Measure', 'Observed value']}
                  rows={[
                    ['Original-image requests attempted', String(data.original_attempted)],
                    ['Strict JSON and all rules', `${originalStrictCorrect}/${originalAttempted}`],
                    [
                      'Mathematically valid written answer after extraction',
                      `${originalWrittenCorrect}/${originalAttempted}`,
                    ],
                    ['Original-image usage cost', earlierUsd(data.original_cost_usd)],
                    ['Text-diagnostic usage cost', earlierUsd(data.diagnostic_cost_usd)],
                    ['Combined confirmed usage', earlierUsd(data.known_cost_usd)],
                    [
                      'Accounted within the incremental budget',
                      `${earlierUsd(data.accounted_usd)} of ${earlierUsd(data.budget_usd)}`,
                    ],
                    ['Budget remaining', earlierUsd(data.remaining_usd)],
                  ]}
                />
                <p>
                  One sample per model/board cell does not estimate stable accuracy. Model versions are the versions
                  reported by OpenRouter; a family slug or alias does not guarantee immutable weights.
                </p>
              </Section>
              <Section id="earlier-models" title="Results by model and frozen candidate rung">
                <DataTable
                  caption="Original image prompts · deterministic grades"
                  headers={[
                    'Original candidate rung',
                    'Requested model',
                    'Strict correct',
                    'Written valid',
                    'Median API time',
                    'Reported cost',
                  ]}
                  rows={modelRows}
                />
                <p>
                  “Strict correct” and “written valid” use the same attempted-request denominator shown for each model
                  rung. It can be fewer than three when the budget-gated phase did not reach every board. The
                  written-answer measure was preregistered for this October stage; it was post hoc in the historical
                  frontier pilot. Strict formatting failures remain failures in the primary cohort.
                </p>
              </Section>
              <Section id="earlier-receipts" title="Every board-level response and request receipt">
                <p>
                  Each receipt opens the exact saved request, visible final response or transport error, deterministic
                  grade, and usage/timing metadata. The attached image is decoded to a SHA-256-addressed asset so its
                  submitted pixels remain inspectable without embedding base64 in the public JSON.
                </p>
                <DataTable
                  caption="Board-level records · original image condition"
                  headers={[
                    'Requested model',
                    'Candidate rung',
                    'Board',
                    'Strict',
                    'Written',
                    'API time',
                    'Cost',
                    'Failure / finish',
                    'Evidence',
                  ]}
                  rows={boardRows}
                />
              </Section>
              <Section id="earlier-failures" title="First sampled failures are not a contiguous threshold">
                <p>
                  Family stopping decisions and the limited budget leave generations untested. An observed failure is
                  only a location in this adaptive sample; it does not show that all older versions fail, all newer ones
                  pass, or that a boundary lies between adjacent releases.
                </p>
                {firstFailureRows.length ? (
                  <DataTable
                    caption="Observed family stopping points · original candidate rungs"
                    headers={['Family', 'Model', 'Candidate rung', 'Board', 'Observed failure', 'Evidence']}
                    rows={firstFailureRows}
                  />
                ) : (
                  <p>No family stopping observation is recorded in the current summary.</p>
                )}
              </Section>
              <Section id="earlier-diagnostics" title="Representation diagnostics are a separate condition">
                <p>
                  These text-input probes were selected only after an original-image failure. They remove image
                  perception and change the representation, so they cannot be combined with or used to revise the
                  original-image score.
                </p>
                <p>
                  The two probes funded in this original $2 phase used complete region matrices on 5×5: GPT-4.1 still
                  failed region coverage; Gemini 2.5 Flash returned a valid placement but not strict JSON. Claude’s
                  failed 9×9 matrix probe was omitted at that time because its conservative $0.230320 reserve exceeded
                  the $0.199215 then remaining. That historical budget omission is now superseded by a separate,
                  additional-$5 controlled completion stage, which includes Claude Sonnet 4 on 9×9 with two fresh
                  requests per representation. The original two probes remain exploratory and are excluded from that new
                  matched denominator; no outcomes or costs are pooled. No correctness feedback or candidate answers
                  entered those original requests.
                </p>
                {diagnosticRows.length ? (
                  <DataTable
                    caption="Exploratory diagnostic calls"
                    headers={['Model', 'Board', 'Text condition', 'Strict', 'Written', 'API time', 'Cost', 'Evidence']}
                    rows={diagnosticRows}
                  />
                ) : (
                  <p>No diagnostic results are recorded in the current summary.</p>
                )}
              </Section>
              <Section
                id="diagnostic-completion"
                title="Matched diagnostic completion: six failed pairs, three representations"
              >
                {!completion && (
                  <p role="status">
                    {completionError
                      ? 'The separate diagnostic-completion summary is not available yet. Its frozen requests and any saved responses remain inspectable in the evidence atlas.'
                      : 'Loading the saved diagnostic-completion summary…'}
                  </p>
                )}
                {completion && (
                  <>
                    {completion.attempted_calls < completion.planned_calls && (
                      <Callout tone="caution" title="This separate $5 stage is still in progress.">
                        The table reflects saved attempts only; unattempted schedule entries are not failures. This
                        stage has its own authorization and ledger, separate from the earlier $2 cohort.
                      </Callout>
                    )}
                    <p className="lead">
                      The follow-up repeats each of six previously mathematical-failure model/board pairs in the
                      original image condition, a full region matrix, and region cell lists, with two independent fresh
                      one-shot requests per condition. There is no feedback, answer key, retry, or best-of-two score.
                    </p>
                    <p>
                      The prior two text probes above are retained as historical exploratory data, not inserted into
                      these matched results. Strict success requires the original JSON-only schema and every Queens
                      rule; written success extracts exactly one schema-shaped object from visible final text and
                      applies the same deterministic checker, without repairs or choosing among answers.
                    </p>
                    {completion.attempted_calls === completion.planned_calls && (
                      <>
                        <h3>What the fresh controls showed</h3>
                        <ul>
                          {completionFindings(completion).map(finding => (
                            <li key={finding}>{finding}</li>
                          ))}
                        </ul>
                      </>
                    )}
                    <DataTable
                      caption="New-stage outcomes by representation"
                      headers={[
                        'Representation',
                        'Attempted / planned',
                        'Strict correct',
                        'Written valid',
                        'Median request time',
                        'Known usage cost',
                      ]}
                      rows={completion.conditions.map(condition => [
                        condition.label,
                        `${condition.attempted_calls} / ${condition.planned_calls}`,
                        `${condition.strict_correct_count} / ${condition.attempted_calls}`,
                        `${condition.written_correct_count} / ${condition.attempted_calls}`,
                        earlierSeconds(completionMedianSeconds(completion.pairs, condition.condition)),
                        earlierUsd(condition.known_cost_usd),
                      ])}
                    />
                    <p>
                      Each pair-condition has two independently reported replicates, not a two-attempt session. Two
                      observations per cell are a limited repeatability check, not a stable accuracy estimate or
                      significance test. Text conditions change modality, wording, token count, and serialization
                      together, so they do not isolate visual perception as a cause.
                    </p>
                    <p>
                      The saved timestamps show a 146.89-minute pause between trials 9 and 10. That orchestration gap is
                      excluded from request latency; this was not an uninterrupted session. Service/time drift remains
                      possible despite the unchanged frozen inputs and counterbalanced order.
                    </p>
                    <DataTable
                      caption="Every matched pair, replicate, and response receipt"
                      headers={[
                        'Pair / earlier failure',
                        'Representation',
                        'Replicate 1',
                        'Replicate 2',
                        'Evidence receipts',
                      ]}
                      rows={completion.pairs.flatMap(pair =>
                        pair.conditions.map(condition => {
                          const reps = [0, 1].map(index => condition.replicates[index])
                          const describe = (rep: CompletionReplicate | undefined) =>
                            !rep || !rep.attempted
                              ? 'Not attempted'
                              : `Strict ${earlierPassLabel(rep.correct)} · written ${earlierPassLabel(rep.written_correct)} · ${earlierSeconds(rep.seconds)} · ${earlierUsd(rep.cost_usd)}`
                          const receipts = reps
                            .filter((rep): rep is CompletionReplicate => Boolean(rep))
                            .map(rep => <span key={rep.call_id}>{completionReceipt(rep.call_id)}</span>)
                          return [
                            `${pair.family} · ${pair.model} · ${pair.board_id}\nPrior: ${pair.source_failure_category}`,
                            condition.label,
                            describe(reps[0]),
                            describe(reps[1]),
                            receipts.length ? (
                              <>
                                {receipts[0]}
                                {receipts[1] && <> · {receipts[1]}</>}
                              </>
                            ) : (
                              'No frozen requests'
                            ),
                          ]
                        }),
                      )}
                    />
                    <DataTable
                      caption="Separate diagnostic-completion ledger"
                      headers={['Measure', 'Observed value']}
                      rows={[
                        ['Scheduled requests', String(completion.planned_calls)],
                        ['Attempted requests', String(completion.attempted_calls)],
                        ['Strict successes', `${completion.strict_correct_count}/${completion.attempted_calls}`],
                        [
                          'Written-answer successes',
                          `${completion.written_correct_count}/${completion.attempted_calls}`,
                        ],
                        ['Known usage cost', earlierUsd(completion.budget.known_cost_usd)],
                        [
                          'Accounted against this stage’s cap',
                          `${earlierUsd(completion.budget.accounted_usd)} / ${earlierUsd(completion.budget.cap_usd)}`,
                        ],
                        ['Remaining in this stage', earlierUsd(completion.budget.remaining_usd)],
                        ['Summary updated', completion.generated_utc],
                      ]}
                    />
                    <div className="next-actions">
                      <a href={assetUrl('evidence/diagnostic-completion-REPORT.md')} download>
                        Download the report
                      </a>
                      <a href={assetUrl('evidence/diagnostic-completion-PROTOCOL.md')} download>
                        Frozen protocol
                      </a>
                      <a href={assetUrl('evidence/diagnostic-completion-manifest.json')} download>
                        Frozen schedule
                      </a>
                      <a href={assetUrl('evidence/diagnostic-completion-grades.json')} download>
                        Grades and ledger
                      </a>
                      <a href={assetUrl('evidence/diagnostic-completion-audit.json')} download>
                        Independent audit
                      </a>
                      <a href="#/evidence-atlas">Browse all trial receipts</a>
                    </div>
                  </>
                )}
              </Section>
              <Section id="earlier-limits" title="Budget, boundaries, and downloadable record">
                <DataTable
                  caption="Incremental study ledger"
                  headers={['Measure', 'Observed value']}
                  rows={[
                    ['Requests attempted', String(data.attempted)],
                    ['Original-image attempts', String(data.original_attempted)],
                    ['Confirmed usage cost', earlierUsd(data.known_cost_usd)],
                    ['Conservative accounted cost', earlierUsd(data.accounted_usd)],
                    ['Authorized maximum', earlierUsd(data.budget_usd)],
                    ['Remaining allowance', earlierUsd(data.remaining_usd)],
                    ['Summary updated', data.updated_utc],
                  ]}
                />
                <ul>
                  {data.conclusions.map((conclusion, index) => (
                    <li key={`conclusion-${index}`}>{conclusion}</li>
                  ))}
                </ul>
                <Callout tone="caution" title="A practical service comparison, not an isolated generation effect.">
                  <ul>
                    {data.limits.map((limit, index) => (
                      <li key={`limit-${index}`}>{limit}</li>
                    ))}
                  </ul>
                </Callout>
                <div className="next-actions">
                  <a href={assetUrl('evidence/earlier-generations-REPORT.md')} download>
                    Download the report
                  </a>
                  <a href={assetUrl('evidence/earlier-generations-PROTOCOL.md')} download>
                    Frozen protocol
                  </a>
                  <a href={assetUrl('evidence/earlier-generations-SCHEDULE_AMENDMENT.md')} download>
                    Adaptive schedule amendment
                  </a>
                  <a href={assetUrl('evidence/earlier-generations-REVIEW_NOTES.md')} download>
                    Review and interpretation notes
                  </a>
                  <a href="#/evidence-atlas">Search all request receipts</a>
                </div>
              </Section>
            </>
          )}
        </main>
      </div>
    </>
  )
}
