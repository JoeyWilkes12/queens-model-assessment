import { lazy, Suspense, useState, type CSSProperties } from 'react'
import { armName, localArtifact, useLocalStudies, type LocalStudy } from './localQwenEvidence'
import type { BookUi } from './ollamaEvidence'
import { Choice, InfoBubble } from './leaderboardUi'
import './open-weight-leaderboard.css'

const OpenWeightProgress = lazy(() => import('./OpenWeightProgress'))

type Protocol = NonNullable<LocalStudy['protocol']> & { think?: boolean | string }
type Score = { study: LocalStudy; rows: LocalStudy['rows']; strict: number; format: number; remaining: number; total: number }

/** Identify fully recorded cohorts, including selected audits for separate display. */
function isComplete(study: LocalStudy) {
  return study.status === 'complete' && study.planned > 0 &&
    study.rows.length === study.planned && study.recorded === study.planned &&
    study.rows.every(row => row.state === 'recorded')
}

/** Count disjoint outcomes within a single cohort and board size. */
function score(study: LocalStudy, size: string): Score {
  const rows = study.rows.filter(row => size === 'all' || row.size === Number(size))
  const strict = rows.filter(row => row.strict_correct).length
  const format = rows.filter(row => !row.strict_correct && row.format_only_correct).length
  return { study, rows, strict, format, remaining: rows.length - strict - format, total: rows.length }
}

const tokens = (budget: number) => `${Math.round(budget / 1024)}k`
const armCount = (study: LocalStudy) => Object.keys(study.arms || {}).length || new Set(study.rows.map(row => row.treatment)).size

/** The few settings that tell two rows of one model apart; everything else waits in the info bubble. */
function tags(study: LocalStudy) {
  const protocol = (study.protocol ?? {}) as Protocol
  return [
    ({ fresh1: 'Fresh1', fresh2: 'Fresh2' } as Record<string, string>)[study.board_set || ''] ?? 'Earlier boards',
    protocol.modality === 'text' ? 'text' : 'image',
    tokens(study.budget),
    study.id === 'qwen3.5-4b-pilot' && 'pilot',
    typeof protocol.think === 'string' && `think ${protocol.think}`,
    protocol.format && 'JSON',
    study.decoding === 'sampling' && `sampling r${study.round}`,
    study.decoding === 'greedy+ls' && 'loop-stop',
  ].filter((tag): tag is string => !!tag)
}

/** Every control that defines the cohort, spelled out for the info bubble. */
function settings(study: LocalStudy): [string, string][] {
  const protocol = (study.protocol ?? {}) as Protocol
  const detector = study.loop_mode || (study.decoding === 'greedy+ls' ? 'active' : 'off')
  const thinking = typeof protocol.think === 'string' ? `Effort ${protocol.think}` : protocol.think === false ? 'None' : protocol.think ? 'On' : null
  return ([
    ['Input', protocol.modality === 'text' ? 'Board as a text grid' : 'Board as an image'],
    ['Prompt arms', String(armCount(study))],
    ['Answer format', protocol.format ? 'JSON schema enforced' : 'Asked for in the prompt'],
    ['Token budget', study.budget.toLocaleString('en-US')],
    ['Decoding', study.decoding === 'sampling' ? `Sampling, round ${study.round}` : 'Greedy'],
    ['Thinking', thinking],
    ['Loop detector', detector === 'shadow' ? 'Shadow (records, never stops)' : detector === 'active' ? 'Active (stops loops)' : 'Off'],
    ['Build', [study.runtime?.details?.quantization_level, study.runtime?.details?.runner].filter(Boolean).join(' · ') || null],
  ] as [string, string | null][]).filter((entry): entry is [string, string] => !!entry[1])
}

/** Link to the exact saved study, even when its model has multiple cohorts. */
const studyHref = (study: LocalStudy) => `#/local-qwen/study/${study.id}`

const OUTCOMES: [string, string][] = [['Strict correct', 'lb-fill--solid'], ['Correct, wrong format', 'lb-fill--hatched'], ['Not solved', 'ow-remaining']]

function Bar({ counts, total }: { counts: number[]; total: number }) {
  return <span className="ow-bar" aria-hidden="true">{counts.map((count, index) => count > 0 &&
    <span key={OUTCOMES[index][0]} className={OUTCOMES[index][1]} style={{ width: `${count / total * 100}%` }} />)}</span>
}

type ModelRow = { model: string; cohorts: Score[]; strict: number; format: number; remaining: number; total: number }

/** One model: every completed call pooled into one bar; the studies behind it sit in the bubble. */
function ModelLine({ row, index }: { row: ModelRow; index: number }) {
  const { model, cohorts, strict, format, remaining, total } = row
  return <li className="ow-row" style={{ '--i': index } as CSSProperties}>
    <span className="ow-row-name"><a href="#/local-qwen">{model}</a></span>
    <Bar counts={[strict, format, remaining]} total={total} />
    <strong className="ow-score">{Math.round(strict / total * 100)}%<small> {strict}/{total}</small></strong>
    <InfoBubble label={`Studies behind ${model}`} wide>
      <p>{cohorts.length === 1 ? 'One completed study.' : `${cohorts.length} completed studies, pooled. Their settings differ, so each is listed with its own score.`}{format > 0 && ` ${format} more ${format === 1 ? 'answer was' : 'answers were'} correct but in the wrong format.`}</p>
      <table className="ow-arm-table">
        <caption>Strict correct by study</caption>
        <tbody>{cohorts.map(cohort => <tr key={cohort.study.id}>
          <th scope="row"><a href={studyHref(cohort.study)}>{tags(cohort.study).join(' · ')}</a></th>
          <td><Bar counts={[cohort.strict, cohort.format, cohort.remaining]} total={cohort.total} /></td>
          <td>{cohort.strict}/{cohort.total}</td>
        </tr>)}</tbody>
      </table>
      <dl className="lb-info-list ow-build">{settings(cohorts[0].study).filter(([term]) => term === 'Build').map(([term, value]) => <div key={term}><dt>{term}</dt><dd>{value}</dd></div>)}</dl>
    </InfoBubble>
  </li>
}

/** Completed open-weight results, one bar per model, best first; unfinished runs stay in a disclosure. */
export default function OpenWeightLeaderboard({ ui }: { ui: BookUi }) {
  const saved = useLocalStudies()
  const [size, setSize] = useState('all')
  const { DataTable } = ui

  if (saved.status === 'loading') return <p className="leaderboard-status" role="status">Loading completed studies…</p>
  if (saved.status !== 'ready') return <p role="status">
    The saved study index could not be loaded. Reload the page or <a href={localArtifact('index.json')}>inspect the index</a>.
  </p>

  const complete = saved.data.studies.filter(isComplete)
  const assessments = complete.filter(study => study.kind !== 'audit')
  const audits = complete.filter(study => study.kind === 'audit').map(study => score(study, 'all'))
  const unfinished = saved.data.studies.filter(study => study.kind !== 'audit' && study.recorded < study.planned).length
  const sizes = Array.from(new Set(assessments.flatMap(study => study.rows.map(row => row.size)))).sort((a, b) => a - b)
  const sum = (cohorts: Score[], key: 'strict' | 'format' | 'remaining' | 'total') => cohorts.reduce((n, cohort) => n + cohort[key], 0)
  // Pool each model's completed calls; rows are always presented best first.
  const rows: ModelRow[] = Array.from(new Set(assessments.map(study => study.model))).map(model => {
    const cohorts = assessments.filter(study => study.model === model).map(study => score(study, size)).filter(cohort => cohort.total > 0)
      .sort((a, b) => b.strict / b.total - a.strict / a.total || a.study.id.localeCompare(b.study.id))
    return { model, cohorts, strict: sum(cohorts, 'strict'), format: sum(cohorts, 'format'), remaining: sum(cohorts, 'remaining'), total: sum(cohorts, 'total') }
  }).filter(row => row.total > 0).sort((a, b) => b.strict / b.total - a.strict / a.total || a.model.localeCompare(b.model))

  return <div className="ow-leaderboard">
    <div className="lb-controls">
      <Choice label="Board size" value={size} onChange={setSize} options={[['all', 'All sizes'], ...sizes.map(value => [String(value), `${value}×${value}`] as [string, string])]} />
    </div>
    <div className="lb-meta">
      <span>{rows.length} models · ranked by strict solve rate</span>
      <InfoBubble label="How to read these results" wide>
        <p>Each bar pools every completed call for one model on our own computer: {assessments.length} studies in all. A call is one board, asked once.</p>
        <p>Studies differ in boards, input (image or text grid), token budget and thinking setting, and models were not all run under the same ones. Read the order as a summary of what was recorded, not a controlled ranking. Each row’s info button lists its studies.</p>
        <p>Not solved includes wrong answers, answers cut off at the token budget, calls the loop detector stopped and recorded transport errors.</p>
      </InfoBubble>
      {OUTCOMES.map(([label, style]) => <span key={label} className="lb-legend-item"><i className={`lb-swatch ${style}`} aria-hidden="true" />{label}</span>)}
    </div>
    {rows.length ? <ol className="ow-results">{rows.map((row, index) => <ModelLine key={row.model} row={row} index={index} />)}</ol>
      : <p>No completed studies have recorded calls at this board size.</p>}
    {audits.length > 0 && <details className="lb-table ow-audits">
      <summary>Loop-stop audits ({audits.length})</summary>
      <p>Diagnostic reruns of only the calls the loop detector had stopped. They are never pooled with the results above and ignore the size filter.</p>
      <DataTable caption="Completed audits of selected client stops" headers={['Study', 'Strict / recorded', 'Correct, wrong format', 'Not solved']} rows={audits.map(({ study, strict, format, remaining, total }) => [
        <a href={studyHref(study)}>{study.label}</a>, `${strict}/${total}`, String(format), String(remaining),
      ])} />
    </details>}
    <details className="lb-table ow-unfinished">
      <summary>Unfinished and superseded runs ({unfinished})</summary>
      <Suspense fallback={<p role="status">Loading recorded progress…</p>}><OpenWeightProgress ui={ui} /></Suspense>
    </details>
  </div>
}
