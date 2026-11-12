import { lazy, Suspense, useState } from 'react'
import { armName, localArtifact, useLocalStudies, type LocalStudy } from './localQwenEvidence'
import type { BookUi } from './ollamaEvidence'
import { Choice, InfoBubble } from './leaderboardUi'
import './open-weight-leaderboard.css'

const OpenWeightProgress = lazy(() => import('./OpenWeightProgress'))

type Protocol = NonNullable<LocalStudy['protocol']> & { think?: boolean | string }
type Score = { study: LocalStudy; rows: LocalStudy['rows']; strict: number; format: number; remaining: number; total: number }

/** Board panels in reading order: the frozen queue sets first, the earlier pilot boards last. */
const PANELS: { id: string; title: string; about: string }[] = [
  { id: 'fresh1', title: 'Fresh1 boards', about: 'Twelve of the 36 shared boards, four each at 5×5, 7×7 and 9×9, frozen on 31 October before any local model ran on them. Every study here used the same boards. Rows still differ in model, input type, token budget and thinking setting, so read them as descriptions, not a controlled ranking.' },
  { id: 'fresh2', title: 'Fresh2 boards', about: 'Another twelve of the 36 shared boards, frozen on 3 November before any local model ran on them. It repeats Fresh1 studies to check whether their results hold on different boards.' },
  { id: 'legacy', title: 'Earlier boards', about: 'The twelve shared boards used by the first local studies: the 4B pilot, the larger token budgets, the sampling rounds and the loop-stop studies. Sampling rounds are exploratory and never pooled with greedy runs.' },
]

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

/** One completed study: name, distinguishing tags, outcome bar and score; settings and arms sit in the bubble. */
function StudyRow({ cohort }: { cohort: Score }) {
  const { study, rows, strict, format, remaining, total } = cohort
  const arms = [...new Set(rows.map(row => row.treatment))]
  return <li className="ow-row">
    <span className="ow-row-name">
      <a href={studyHref(study)}>{study.model}</a>
      <span className="ow-tags">{tags(study).map(tag => <span key={tag}>{tag}</span>)}</span>
    </span>
    <Bar counts={[strict, format, remaining]} total={total} />
    <strong className="ow-score">{strict}<small>/{total}</small></strong>
    <InfoBubble label={`Settings and prompt arms for ${study.label}`} wide>
      <dl className="lb-info-list">{settings(study).map(([term, value]) => <div key={term}><dt>{term}</dt><dd>{value}</dd></div>)}</dl>
      <table className="ow-arm-table">
        <caption>Strict correct by prompt arm</caption>
        <tbody>{arms.map(arm => {
          const calls = rows.filter(row => row.treatment === arm)
          const correct = calls.filter(row => row.strict_correct).length
          const wrongFormat = calls.filter(row => row.format_only_correct && !row.strict_correct).length
          return <tr key={arm}><th scope="row">{armName(arm)}</th><td><Bar counts={[correct, wrongFormat, calls.length - correct - wrongFormat]} total={calls.length} /></td><td>{correct}/{calls.length}</td></tr>
        })}</tbody>
      </table>
      {format > 0 && <p>{format} more {format === 1 ? 'answer was' : 'answers were'} correct but in the wrong format.</p>}
      <a className="lb-info-link" href={studyHref(study)}>Open the study and its receipts</a>
    </InfoBubble>
  </li>
}

/** Completed open-weight studies, grouped by the board panel they share; unfinished runs stay in a disclosure. */
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
  const models = new Set(assessments.map(study => study.model)).size
  const sizes = Array.from(new Set(assessments.flatMap(study => study.rows.map(row => row.size)))).sort((a, b) => a - b)
  const known = new Set(PANELS.map(panel => panel.id))
  const groups = [...PANELS, ...Array.from(new Set(assessments.map(study => study.board_set || 'legacy'))).filter(id => !known.has(id)).map(id => ({ id, title: id, about: '' }))]
    .map(panel => ({
      panel,
      cohorts: assessments.filter(study => (study.board_set || 'legacy') === panel.id).map(study => score(study, size)).filter(cohort => cohort.total > 0)
        .sort((a, b) => b.strict / b.total - a.strict / a.total || a.study.model.localeCompare(b.study.model) || a.study.id.localeCompare(b.study.id)),
    })).filter(group => group.cohorts.length > 0)

  return <div className="ow-leaderboard">
    <div className="lb-controls">
      <Choice label="Board size" value={size} onChange={setSize} options={[['all', 'All sizes'], ...sizes.map(value => [String(value), `${value}×${value}`] as [string, string])]} />
    </div>
    <div className="lb-meta">
      <span>{assessments.length} completed studies · {models} models</span>
      <InfoBubble label="How to read these studies" wide>
        <p>Each row is one completed study: one model under one fixed set of settings. The bar covers every recorded call, and each board is asked once per prompt arm.</p>
        <p>Compare rows inside one board panel, and only between rows with the same input type. Token budgets and thinking settings differ between models; the tags and each row’s info button show them.</p>
        <p>Not solved includes wrong answers, answers cut off at the token budget and calls the loop detector stopped.</p>
      </InfoBubble>
      {OUTCOMES.map(([label, style]) => <span key={label} className="lb-legend-item"><i className={`lb-swatch ${style}`} aria-hidden="true" />{label}</span>)}
    </div>
    {groups.length ? groups.map(({ panel, cohorts }) => <section key={panel.id} className="ow-group" aria-labelledby={`ow-${panel.id}`}>
      <h3 id={`ow-${panel.id}`}>{panel.title}{panel.about && <InfoBubble label={`About the ${panel.title}`}><p>{panel.about}</p></InfoBubble>}</h3>
      <ol className="ow-results">{cohorts.map(cohort => <StudyRow key={cohort.study.id} cohort={cohort} />)}</ol>
    </section>) : <p>No completed studies have recorded calls at this board size.</p>}
    {audits.length > 0 && <details className="lb-table ow-audits">
      <summary>Loop-stop audits ({audits.length})</summary>
      <p>Diagnostic reruns of only the calls the loop detector had stopped. They are never pooled with the studies above and ignore the size filter.</p>
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
