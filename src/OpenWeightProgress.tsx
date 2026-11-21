import type { BookUi } from './ollamaEvidence'
import { armName, localReceiptUrl, useLocalStudies, type LocalStudy } from './localQwenEvidence'
import './open-weight-progress.css'

const SUPERSEDED_STUDIES = new Set(['qwen3.5-9b-nvfp4', 'qwen3.5-27b-q4_K_M'])

/** Show coverage and outcomes for each recorded arm without scoring unfinished requests. */
function ProgressStudy({ study, ui }: { study: LocalStudy; ui: BookUi }) {
  const { DataTable } = ui
  const observed = study.rows.filter(row => row.state === 'recorded')
  const pending = study.rows.filter(row => row.state === 'pending')
  const strict = observed.filter(row => row.strict_correct).length
  const formatOnly = observed.filter(row => row.format_only_correct).length
  const other = observed.length - strict - formatOnly
  const label = `${strict} strict, ${formatOnly} correct in the wrong format, ${other} other recorded outcomes, ${pending.length} unrecorded`
  return <li className="lb-progress-study">
    <h3><a href={`#/local-qwen/study/${study.id}`}>{study.label}</a></h3>
    <p className="lb-key">{observed.length}/{study.planned} recorded · {pending.length} unrecorded</p>
    <div className="lb-progress-track" role="img" aria-label={label}>
      <span className="lb-fill--solid" style={{ width: `${strict / study.planned * 100}%` }} />
      <span className="lb-fill--hatched" style={{ width: `${formatOnly / study.planned * 100}%` }} />
      <span className="lb-progress-other" style={{ width: `${other / study.planned * 100}%` }} />
    </div>
    <p className="lb-key">{label}.</p>
    <details className="lb-table">
      <summary>Arm counts and unrecorded boards</summary>
      <DataTable caption="Recorded outcomes and frozen coverage by arm"
        headers={['Arm', 'Recorded / planned', 'Strict', 'Format only', 'Token cap']}
        rows={Object.keys(study.arms ?? { baseline: {}, caveman: {} }).map(arm => {
          const calls = observed.filter(row => row.treatment === arm)
          const planned = study.rows.filter(row => row.treatment === arm).length
          return [armName(arm), `${calls.length}/${planned}`, String(calls.filter(row => row.strict_correct).length),
            String(calls.filter(row => row.format_only_correct).length), String(calls.filter(row => row.truncated).length)]
        })} />
      <ul className="lb-progress-pending">{pending.map(row => <li key={row.call_id}>
        <a href={localReceiptUrl(study, row)}>{row.board_id} · {armName(row.treatment)}</a>
      </li>)}</ul>
    </details>
  </li>
}

/** Report partial coverage separately from completed study results. */
export default function OpenWeightProgress({ ui }: { ui: BookUi }) {
  const saved = useLocalStudies()
  if (saved.status !== 'ready') return <p role="status">{saved.status === 'loading'
    ? 'Loading recorded progress…' : 'The saved progress snapshot could not be loaded.'}</p>

  const partial = saved.data.studies.filter(study => study.kind !== 'audit' && study.recorded < study.planned)
  const active = partial.filter(study => !SUPERSEDED_STUDIES.has(study.id))
  const historical = partial.filter(study => SUPERSEDED_STUDIES.has(study.id))
  return <div className="lb-progress">
    <p className="lb-key">Saved snapshot · <time dateTime={saved.data.captured_utc}>{saved.data.captured_utc.slice(0, 10)} UTC</time></p>
    <p>Bars cover each study’s planned calls. The open area shows unrecorded requests, which have no score. Rescues are tracked separately.</p>
    <div className="lb-legend">
      <span><i className="lb-swatch lb-fill--solid" aria-hidden="true" />Strict correct</span>
      <span><i className="lb-swatch lb-fill--hatched" aria-hidden="true" />Correct, wrong format</span>
      <span><i className="lb-swatch lb-progress-other" aria-hidden="true" />Other recorded</span>
      <span><i className="lb-swatch lb-progress-unrecorded" aria-hidden="true" />Unrecorded</span>
    </div>
    <h2>Unfinished panels</h2>
    {active.length ? <ul className="lb-progress-list">{active.map(study => <ProgressStudy study={study} ui={ui} key={study.id} />)}</ul>
      : <p>All current panels in this snapshot are complete.</p>}
    {historical.length > 0 && <details className="lb-table">
      <summary>Historical partial runs ({historical.length})</summary>
      <p>Later studies used larger output allowances. The original plans and their recorded results remain available here.</p>
      <ul className="lb-progress-list">{historical.map(study => <ProgressStudy study={study} ui={ui} key={study.id} />)}</ul>
    </details>}
  </div>
}
