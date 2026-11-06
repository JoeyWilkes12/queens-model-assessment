import { useEffect, useMemo, useState } from 'react'
import { BoardReplay } from './BoardReplay'
import { assetUrl, Icon, LocalToc, PageHero, Section, Callout, DataTable } from './bookUi'
import { deriveTrajectoryFrames } from './trajectoryBoardData'

export type TraceStep = {
  step: number
  region: string
  cell?: number[]
  region_call?: string | null
  cell_call?: string | null
  region_forced?: boolean
  cell_forced?: boolean
  candidate_count: number
  local_violations?: string[]
  on_unique_solution?: boolean
}

export type Trajectory = {
  trajectory_id: string
  board_id: string
  size: number
  mode: string
  replicate: number
  success: boolean
  stop_reason: string
  correct_queens_before_failure: number
  api_elapsed_seconds: number
  http_calls: number
  forced_decisions: number
  steps: TraceStep[]
}

export type TrajectoryStudy = {
  audit: {
    calls: number
    successful_calls: number
    typed_decisions: number
    confirmed_usd: string
    combined_accounted_usd: string
    remaining_usd: string
    per_board: {
      board_id: string
      size: number
      mode: string
      attempts: number
      solved: number
      distinct_traces: number
      median_correct_queens_before_failure: number
      median_seconds: number
    }[]
    repeatability: {
      board_id: string
      phase: string
      calls: number
      choice_counts: Record<string, number>
      modal_agreement: number
      distinct_probability_vectors: number
      max_option_probability_range: number
    }[]
    controls: {
      board_id: string
      single_region_counts: Record<string, number>
      batched_region_counts: Record<string, number>
      canonical_cell_counts: Record<string, number>
      reversed_cell_counts: Record<string, number>
    }[]
    choice_probability_disagreements: unknown[]
  }
  trajectories: Trajectory[]
  boards: { id: string; size: number; regions: number[][] }[]
}

export function JevTrajectories({ selectedId }: { selectedId?: string }) {
  const [data, setData] = useState<TrajectoryStudy | null>(null)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState(selectedId || 'sequence-5-1_raw_a1')
  useEffect(() => {
    if (selectedId) setSelected(selectedId)
  }, [selectedId])
  useEffect(() => {
    let active = true
    fetch(assetUrl('evidence/trajectory-study.json'))
      .then(response => {
        if (!response.ok) throw new Error(`Evidence HTTP ${response.status}`)
        return response.json()
      })
      .then(value => {
        if (active) setData(value)
      })
      .catch(reason => {
        if (active) setError(String(reason))
      })
    return () => {
      active = false
    }
  }, [])
  const countText = (counts: Record<string, number>) =>
    Object.entries(counts)
      .map(([label, count]) => `${label}: ${count}`)
      .join(' · ') || 'Forced cell; no probe'
  const trace = data?.trajectories.find(item => item.trajectory_id === selected)
  const traceBoard = data?.boards.find(item => item.id === trace?.board_id)
  const replayRegions = useMemo(
    () => traceBoard?.regions.map(row => row.map(region => String.fromCharCode(65 + region))) ?? [],
    [traceBoard],
  )
  const replayFrames = useMemo(
    () => (trace && traceBoard ? deriveTrajectoryFrames(trace, replayRegions) : []),
    [trace, traceBoard, replayRegions],
  )
  const receiptLink = (id: string | null | undefined, forced?: boolean) =>
    id ? (
      <a href={`#/evidence-atlas/2026-09-30-jev-trajectories:${id}`}>Receipt</a>
    ) : forced === true ? (
      'Forced by code'
    ) : (
      'No recorded API receipt'
    )
  return (
    <>
      <PageHero
        trail="The Jev question / September 30 follow-up"
        title="Jev solved one board; repeated requests still changed its decisions."
        deck="Ninety attempts on nine new boards tested color selection followed by cell placement. Every attempt started empty and stopped on its first failed placement, then the next attempt started fresh."
      />
      <div className="reading-layout">
        <LocalToc
          items={[
            { id: 'trajectory-results', label: 'Full attempts' },
            { id: 'trajectory-trace', label: 'Inspect a trace' },
            { id: 'repeatability', label: 'Identical requests' },
            { id: 'batching', label: 'Batch & order' },
            { id: 'trajectory-methods', label: 'Methods & sources' },
          ]}
        />
        <main className="reading-column" id="main-content">
          {!data && <p role="status">{error || 'Loading the saved trajectory evidence…'}</p>}
          {data && (
            <>
              <Section
                id="trajectory-results"
                title="Completion was concentrated in one 5×5 board"
                label="90 attempts · 9 distinct boards"
              >
                <p className="lead">
                  Each condition solved <strong>5/15</strong> attempts at 5×5, and <strong>0/15</strong> at both 7×7 and
                  9×9. All ten successes belong to <code>sequence-5-1</code>. That is one completed board out of nine,
                  with five repetitions in each condition.
                </p>
                <p>
                  Both conditions provide color membership and explicit cell menus. “Raw” offers all cells in the chosen
                  color. “Local” removes row, column, and touching conflicts using code. Single-option decisions are
                  forced by the harness and incur no model call.
                </p>
                <DataTable
                  caption="Complete attempts, grouped by board and assistance"
                  headers={['Board', 'Menu', 'Solved', 'Distinct traces', 'Median correct prefix', 'Median seconds']}
                  rows={data.audit.per_board.map(row => [
                    row.board_id,
                    row.mode,
                    `${row.solved}/${row.attempts}`,
                    String(row.distinct_traces),
                    String(row.median_correct_queens_before_failure),
                    row.median_seconds.toFixed(3),
                  ])}
                />
                <Callout tone="caution" title="Local legality did not ensure a solution.">
                  Eleven raw attempts failed an immediate rule. Filtering prevented those immediate conflicts, but all
                  40 unsolved local attempts still selected a cell outside the unique solution. The sealed oracle
                  stopped those globally unextendable prefixes; it never filtered candidate menus or told Jev the
                  answer.
                </Callout>
              </Section>
              <Section id="trajectory-trace" title="Follow each color decision and cell decision">
                <label htmlFor="trajectory-select">Saved attempt</label>{' '}
                <select id="trajectory-select" value={selected} onChange={event => setSelected(event.target.value)}>
                  {data.trajectories.map(item => (
                    <option value={item.trajectory_id} key={item.trajectory_id}>
                      {item.trajectory_id} · {item.stop_reason}
                    </option>
                  ))}
                </select>
                {!trace && (
                  <p role="status">
                    This attempt is not in the saved evidence. Choose a recorded attempt above; no missing trace will be
                    reconstructed.
                  </p>
                )}
                {trace && (
                  <>
                    <p>
                      <strong>{trace.stop_reason.replace(/_/g, ' ')}</strong> · {trace.correct_queens_before_failure}{' '}
                      correct placements before termination · {trace.http_calls} API requests · {trace.forced_decisions}{' '}
                      forced decisions · {trace.api_elapsed_seconds.toFixed(3)} summed API seconds.
                    </p>
                    {traceBoard && replayFrames.length > 0 && (
                      <BoardReplay
                        key={trace.trajectory_id}
                        regions={replayRegions}
                        frames={replayFrames}
                        title="Recorded attempt, one decision at a time"
                        description="This replay reconstructs saved input states and recorded decisions. It distinguishes model choices, forced harness decisions and evaluator outcomes; it does not reveal an internal reasoning trace or invent intermediate search."
                      />
                    )}
                    <p>
                      <a className="text-link" href={`#/jev-trajectories/${encodeURIComponent(trace.trajectory_id)}`}>
                        Link to this recorded attempt <Icon name="external" />
                      </a>
                    </p>
                    <DataTable
                      caption="Ordered attempt trace"
                      headers={[
                        'Step',
                        'Color',
                        'Color decision',
                        'Cell',
                        'Cell decision',
                        'Menu size',
                        'Engine result',
                      ]}
                      rows={trace.steps.map(step => [
                        String(step.step),
                        step.region,
                        receiptLink(step.region_call, step.region_forced),
                        step.cell ? `r${step.cell[0]}c${step.cell[1]}` : '—',
                        receiptLink(step.cell_call, step.cell_forced),
                        String(step.candidate_count),
                        step.local_violations?.length
                          ? step.local_violations.join(', ')
                          : step.on_unique_solution === true
                            ? 'On unique solution'
                            : step.on_unique_solution === false
                              ? 'Globally unextendable'
                              : 'No recorded evaluator verdict',
                      ])}
                    />
                    {traceBoard && (
                      <details>
                        <summary>Show this blank board as a letter matrix</summary>
                        <pre>
                          {traceBoard.regions
                            .map(row => row.map(region => String.fromCharCode(65 + region)).join(' '))
                            .join('\n')}
                        </pre>
                      </details>
                    )}
                  </>
                )}
              </Section>
              <Section id="repeatability" title="The same request did not always produce the same Choice">
                <p>
                  Ten byte-identical HTTP requests were made for each of 17 frozen questions. Choices varied in{' '}
                  <strong>8/17</strong> groups; reported probability distributions varied in <strong>17/17</strong>.
                  Modal agreement ranged from 50% to 100%. No trial identifiers, nonces, or fresh UID fields entered the
                  input.
                </p>
                <DataTable
                  caption="Exact-request repeatability; agreement is not correctness"
                  headers={[
                    'Board',
                    'Question',
                    'Choices across 10 requests',
                    'Modal agreement',
                    'Distinct distributions',
                    'Largest probability range',
                  ]}
                  rows={data.audit.repeatability.map(row => [
                    row.board_id,
                    row.phase,
                    countText(row.choice_counts),
                    `${Math.round(row.modal_agreement * 100)}%`,
                    String(row.distinct_probability_vectors),
                    row.max_option_probability_range.toFixed(2),
                  ])}
                />
                <p>
                  The observed OpenRouter route is empirically variable. This does not locate the cause inside the model
                  or serving stack. Fresh requests also do not prove statistically independent samples. A color choice
                  measures preference; every unoccupied color is valid before its cell is selected.
                </p>
                <Callout tone="note" title="The returned Choice and reported probabilities occasionally disagreed.">
                  In {data.audit.choice_probability_disagreements.length} of {data.audit.typed_decisions} typed answers,
                  another option had a reported probability 0.01 above the selected Choice. We executed the returned
                  Choice verbatim. Raw responses and the initial validator pause/recovery remain recorded; the cause is
                  unresolved.
                </Callout>
              </Section>
              <Section id="batching" title="Independent questions can share a request; dependent moves cannot">
                <p>
                  Five requests each batched nine independent first-color questions. All completed, producing 45
                  decision items. This reduces HTTP calls; the shared board context also changes the input. On{' '}
                  <code>sequence-7-3</code>, the singleton question favored G in 6/10 calls, whereas the batch favored B
                  in 4/5. The sample does not separate batching effects from ordinary response variation.
                </p>
                <DataTable
                  caption="Batch and option-order controls are separate treatments"
                  headers={[
                    'Board',
                    'Color alone',
                    'Color in batch',
                    'Cell A canonical order',
                    'Cell A reversed order',
                  ]}
                  rows={data.audit.controls.map(row => [
                    row.board_id,
                    countText(row.single_region_counts),
                    countText(row.batched_region_counts),
                    countText(row.canonical_cell_counts),
                    countText(row.reversed_cell_counts),
                  ])}
                />
                <p>
                  Reversing cell-option order changed the favored response on several boards. For{' '}
                  <code>sequence-5-3</code>, canonical order returned r4c1 ten times; reversed order returned two other
                  cells across three calls. Do not treat option order as an inert formatting choice. A cell question
                  that depends on a chosen color requires a later request; Jev’s questions do not consume each other’s
                  answers.
                </p>
              </Section>
              <Section id="trajectory-methods" title="Version controls, cost, and inspectable evidence">
                <p>
                  All {data.audit.successful_calls} successful requests used <code>typesafe/jev-1.13</code> and returned{' '}
                  <code>typesafe/jev-1.13-20260917</code> from TypeSafe. Every response was checked against that build.
                  No newer Jev version was found in discovery. The dated build string was rejected by the local broker
                  before upstream inference; its direct OpenRouter acceptance remains untested.
                </p>
                <p>
                  Current Decisions schemas expose no temperature, seed, or top-p control. Choice is documented as the
                  highest-probability option, rather than a sampled token. Our measured variation still matters
                  operationally, even though its internal cause is not established.
                </p>
                <DataTable
                  caption="Updated experiment ledger"
                  headers={['Measure', 'Observed value']}
                  rows={[
                    ['New HTTP attempts', String(data.audit.calls)],
                    ['Successful HTTP requests', String(data.audit.successful_calls)],
                    ['Typed decisions', String(data.audit.typed_decisions)],
                    ['New confirmed USD', `$${data.audit.confirmed_usd}`],
                    ['All studies accounted USD', `$${data.audit.combined_accounted_usd}`],
                    ['Remaining original $3 allowance', `$${data.audit.remaining_usd}`],
                  ]}
                />
                <p>
                  Nine boards come from one synthetic generator family, with singleton regions. The first solved board
                  used three forced decisions per raw attempt and six per local attempt. Complete-solve time is distinct
                  from the shorter time to a stopped failure. This is a no-backtracking experiment, not a test of
                  self-correction after feedback.
                </p>
                <div className="next-actions">
                  <a href={assetUrl('evidence/trajectory-REPORT.md')} download>
                    Download full report
                  </a>
                  <a href={assetUrl('evidence/trajectory-PROTOCOL.md')} download>
                    Frozen protocol
                  </a>
                  <a href={assetUrl('evidence/trajectory-RESEARCH.md')} download>
                    Research and sources
                  </a>
                  <a href="#/evidence-atlas">Inspect inputs and raw outputs</a>
                </div>
                <ul className="source-list">
                  <li>
                    <a
                      href="https://openrouter.ai/docs/api/api-reference/alphadecisions/submit-a-decisions-request"
                      target="_blank"
                      rel="noreferrer"
                    >
                      OpenRouter Decisions API
                    </a>
                    <span>Typed request schema and routing fields.</span>
                  </li>
                  <li>
                    <a href="https://docs.typesafe.ai/models" target="_blank" rel="noreferrer">
                      TypeSafe models and limits
                    </a>
                    <span>Versioning, text input, and parallel questions.</span>
                  </li>
                  <li>
                    <a
                      href="https://docs.typesafe.ai/cookbooks/consistency_choice_cookbook"
                      target="_blank"
                      rel="noreferrer"
                    >
                      TypeSafe self-consistency experiment
                    </a>
                    <span>Reported variation; its fresh-UID setup differs from these exact-body tests.</span>
                  </li>
                  <li>
                    <a href="https://docs.typesafe.ai/api" target="_blank" rel="noreferrer">
                      TypeSafe API reference
                    </a>
                    <span>Choice, distributions, and no sampling controls.</span>
                  </li>
                </ul>
              </Section>
            </>
          )}
        </main>
      </div>
    </>
  )
}
