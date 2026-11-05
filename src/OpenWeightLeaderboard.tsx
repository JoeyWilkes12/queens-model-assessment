import { useState } from 'react'
import { armName, localArtifact, useLocalStudies, type LocalStudy } from './localQwenEvidence'
import type { BookUi } from './ollamaEvidence'
import './open-weight-leaderboard.css'

/** Identify fully recorded cohorts, including selected audits for separate display. */
function isComplete(study: LocalStudy) {
  return study.status === 'complete' && study.planned > 0 &&
    study.rows.length === study.planned && study.recorded === study.planned &&
    study.rows.every(row => row.state === 'recorded')
}

/** Count disjoint outcomes within a single cohort and board size. */
function score(study: LocalStudy, size: string) {
  const rows = study.rows.filter(row => size === 'all' || row.size === Number(size))
  const strict = rows.filter(row => row.strict_correct).length
  const format = rows.filter(row => !row.strict_correct && row.format_only_correct).length
  return { study, rows, strict, format, remaining: rows.length - strict - format, total: rows.length }
}

/** Describe the controls that define the cohort rather than assuming the same protocol. */
function settings(study: LocalStudy) {
  const modality = study.protocol?.modality === 'text' ? 'text grid' : 'image'
  const format = study.protocol?.format ? 'JSON schema requested' : 'prompted answer format'
  const detector = study.loop_mode || (study.decoding === 'greedy+ls' ? 'active' : 'off')
  const decode = study.decoding === 'greedy+ls' ? 'greedy' : study.decoding
  const round = study.round ? ` round ${study.round}` : ''
  const arms = Object.keys(study.arms || {}).length || new Set(study.rows.map(row => row.treatment)).size
  return [
    `${study.board_set || 'legacy'} panel`, modality, `${arms} prompt arms`, format,
    `${study.budget.toLocaleString('en-US')} tokens`, `${decode}${round}`, `detector ${detector}`,
  ].join(' · ')
}

/** Link to the exact saved study, even when its model has multiple cohorts. */
function studyHref(study: LocalStudy) {
  return `#/local-qwen/study/${study.id}`
}

const outcomeLabels = ['Strict correct', 'Correct, wrong format', 'Remaining']
const outcomeStyles = ['lb-fill--solid', 'lb-fill--hatched', 'ow-remaining']

/** Show completed configurations and retain their exact denominators in the selected size scope. */
export default function OpenWeightLeaderboard({ ui }: { ui: BookUi }) {
  const saved = useLocalStudies()
  const [model, setModel] = useState('all')
  const [size, setSize] = useState('all')
  const { DataTable } = ui

  if (saved.status === 'loading') return <p role="status">Loading completed studies…</p>
  if (saved.status !== 'ready') return <p role="status">
    The saved study index could not be loaded. Reload the page or <a href={localArtifact('index.json')}>inspect the index</a>.
  </p>

  const complete = saved.data.studies.filter(isComplete)
  const assessments = complete.filter(study => study.kind !== 'audit')
  const audits = complete.filter(study => study.kind === 'audit').map(study => score(study, 'all'))
  const models = Array.from(new Set(assessments.map(study => study.model))).sort()
  const sizes = Array.from(new Set(assessments.flatMap(study => study.rows.map(row => row.size)))).sort((a, b) => a - b)
  const visible = assessments
    .filter(study => model === 'all' || study.model === model)
    .map(study => score(study, size))
    .filter(cohort => cohort.total > 0)
    .sort((a, b) => a.study.model.localeCompare(b.study.model))
  const scope = size === 'all' ? 'all board sizes' : `${size}×${size} boards`

  return <div className="ow-leaderboard">
    <p>{assessments.length} completed assessments across {models.length} models. Each row represents one configuration, grouped by model. Calls reuse boards across prompt arms. Compare the board panel, input, budget and stopping policy alongside each score.</p>
    <div className="ow-controls">
      <div><label htmlFor="ow-model">Model</label><select id="ow-model" value={model} onChange={event => setModel(event.target.value)}>
        <option value="all">All models</option>
        {models.map(name => <option key={name} value={name}>{name}</option>)}
      </select></div>
      <div><label htmlFor="ow-size">Board size</label><select id="ow-size" value={size} onChange={event => setSize(event.target.value)}>
        <option value="all">All board sizes</option>
        {sizes.map(value => <option key={value} value={value}>{value}×{value}</option>)}
      </select></div>
    </div>
    <p className="ow-scope" role="status">{visible.length} of {assessments.length} completed assessments · {scope}</p>
    {visible.length ? <figure className="ow-figure">
      <figcaption>
        <div className="lb-legend">{outcomeLabels.map((label, index) => <span key={label}><i className={`lb-swatch ${outcomeStyles[index]}`} aria-hidden="true" />{label}</span>)}</div>
        <p>Each bar spans all recorded calls in that row. Remaining includes incorrect answers, token caps and client stops.</p>
      </figcaption>
      <ul className="ow-results">
        {visible.map(({ study, rows, strict, format, remaining, total }) => {
          const counts = [strict, format, remaining]
          const modelLabel = study.id === 'qwen3.5-4b-pilot' ? `${study.model} · pilot` : study.model
          const protocolLabel = settings(study)
          return <li key={study.id}>
            <div className="ow-row-title">
              <a href={studyHref(study)} aria-label={`${modelLabel} · ${protocolLabel}`}>{modelLabel}</a>
              <strong>{strict}/{total} strict</strong>
            </div>
            <p className="ow-settings">{protocolLabel}</p>
            <div className="ow-bar" aria-hidden="true">{counts.map((count, index) => count > 0 &&
              <span key={outcomeLabels[index]} className={outcomeStyles[index]} style={{ width: `${count / total * 100}%` }} />)}</div>
            <p className="ow-counts">{format} correct, wrong format · {remaining} remaining</p>
            <details className="ow-arms">
              <summary>Prompt arm results</summary>
              <ul>{[...new Set(rows.map(row => row.treatment))].map(arm => {
                const calls = rows.filter(row => row.treatment === arm)
                const correct = calls.filter(row => row.strict_correct).length
                const wrongFormat = calls.filter(row => row.format_only_correct && !row.strict_correct).length
                return <li key={arm}>{armName(arm)} · {correct}/{calls.length} strict · {wrongFormat} correct in the wrong format</li>
              })}</ul>
            </details>
          </li>
        })}
      </ul>
    </figure> : <p>No completed assessments have recorded calls for these filters.</p>}
    {audits.length > 0 && <details className="lb-table ow-audits">
      <summary>{audits.length} selected loop-stop audits · diagnostic reruns</summary>
      <p>These audits reran only calls interrupted by the original detector. The counts cover the full selected audit workload and stay separate from the model and size filters above.</p>
      <DataTable caption="Completed audits of selected client stops" headers={['Study', 'Strict / recorded', 'Correct, wrong format', 'Remaining']} rows={audits.map(({ study, strict, format, remaining, total }) => [
        <a href={studyHref(study)}>{study.label}</a>, `${strict}/${total}`, String(format), String(remaining),
      ])} />
    </details>}
  </div>
}
