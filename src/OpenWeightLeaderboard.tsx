import { lazy, Suspense, useId, useState, type CSSProperties, type ReactNode } from 'react'
import { defaultTariff, localArtifact, useLocalStudies, type LocalStudy } from './localQwenEvidence'
import { usePricing } from './localPricing'
import { estimateCohort } from './localQwenMath'
import { groupCohorts, rank } from './openWeightCohorts'
import type { BookUi } from './ollamaEvidence'
import { Choice, InfoBubble } from './leaderboardUi'
import './open-weight-leaderboard.css'

const OpenWeightProgress = lazy(() => import('./OpenWeightProgress'))

type Protocol = NonNullable<LocalStudy['protocol']> & { think?: boolean | string; timeout_seconds?: number }
type Score = { study: LocalStudy; rows: LocalStudy['rows']; strict: number; format: number; remaining: number; total: number }
/** cost: estimated USD per call at the saved hosted price for this model family; null when no price is saved. */
type Entry = Score & { cost: number | null; costIsFloor: boolean }
type Sort = 'rate' | 'cost'

/** Identify fully recorded cohorts, including selected audits for separate display. */
function isComplete(study: LocalStudy) {
  return study.status === 'complete' && study.planned > 0 &&
    study.rows.length === study.planned && study.recorded === study.planned &&
    study.rows.every(row => row.state === 'recorded')
}

/** Count disjoint outcomes within a single study and board size. */
function score(study: LocalStudy, size: string): Score {
  const rows = study.rows.filter(row => size === 'all' || row.size === Number(size))
  const strict = rows.filter(row => row.strict_correct).length
  const format = rows.filter(row => !row.strict_correct && row.format_only_correct).length
  return { study, rows, strict, format, remaining: rows.length - strict - format, total: rows.length }
}

/** Reader-facing names for the Ollama tags, with the lab's mark where the book already carries one. */
const MODELS: Record<string, { name: string; lab: string; logo?: string }> = {
  'qwen3.5:27b-q4_K_M': { name: 'Qwen3.5 27B', lab: 'Alibaba' },
  'qwen3.5:9b-nvfp4': { name: 'Qwen3.5 9B', lab: 'Alibaba' },
  'qwen3.5:4b': { name: 'Qwen3.5 4B', lab: 'Alibaba' },
  'gpt-oss:20b': { name: 'gpt-oss 20B', lab: 'OpenAI', logo: 'assets/logos/openai.svg' },
  'gemma4:e4b': { name: 'Gemma 4 E4B', lab: 'Google DeepMind', logo: 'assets/logos/google-gemini.svg' },
  'llava-llama3:8b': { name: 'LLaVA-Llama3 8B', lab: 'XTuner' },
}
const modelInfo = (tag: string) => MODELS[tag] ?? { name: tag, lab: '' }

const PANELS: Record<string, string> = { fresh1: 'Fresh1', fresh2: 'Fresh2', legacy: 'Earlier boards' }
const panelOf = (study: LocalStudy) => study.board_set || 'legacy'
const inputOf = (study: LocalStudy) => study.protocol?.modality === 'text' ? 'text' : 'image'
const tokens = (budget: number) => `${Math.round(budget / 1024)}k`
const armCount = (rows: LocalStudy['rows']) => new Set(rows.map(row => row.treatment)).size

/** The settings that tell one cohort from another; everything else waits in the cohort's info bubble. */
function protocolTags(study: LocalStudy) {
  const protocol = (study.protocol ?? {}) as Protocol
  return [
    inputOf(study) === 'text' ? 'text grid' : 'image',
    tokens(study.budget),
    `${armCount(study.rows)} arms`,
    study.id === 'qwen3.5-4b-pilot' && 'pilot',
    typeof protocol.think === 'string' && `think ${protocol.think}`,
    protocol.think === false && 'no thinking',
    protocol.format && 'JSON schema',
    study.decoding === 'sampling' && `sampling r${study.round}`,
    study.loop_mode === 'shadow' && 'shadow detection',
    (study.loop_mode === 'active' || study.decoding === 'greedy+ls') && 'loop-stop',
  ].filter((tag): tag is string => !!tag)
}

const protocolName = (study: LocalStudy) => protocolTags(study).join(' · ')
const cohortName = (study: LocalStudy) => `${PANELS[panelOf(study)] ?? panelOf(study)} · ${protocolName(study)}`

/** Every control that defines the cohort, spelled out for the info bubble. */
function settings(study: LocalStudy): [string, string][] {
  const protocol = (study.protocol ?? {}) as Protocol
  const detector = study.loop_mode || (study.decoding === 'greedy+ls' ? 'active' : 'off')
  const thinking = typeof protocol.think === 'string' ? `Effort ${protocol.think}` : protocol.think === false ? 'None' : protocol.think ? 'On' : null
  return ([
    ['Board panel', PANELS[panelOf(study)] ?? panelOf(study)],
    ['Input', inputOf(study) === 'text' ? 'Board as a text grid' : 'Board as an image'],
    ['Answer format', protocol.format ? 'JSON schema enforced' : 'Asked for in the prompt'],
    ['Token budget', `${study.budget.toLocaleString('en-US')} per call`],
    ['Decoding', study.decoding === 'sampling' ? `Sampling, round ${study.round}` : 'Greedy'],
    ['Thinking', thinking],
    ['Loop detector', detector === 'shadow' ? 'Shadow (records, never stops)' : detector === 'active' ? 'Active (stops loops)' : 'Off'],
  ] as [string, string | null][]).filter((entry): entry is [string, string] => !!entry[1])
}

/** Link to the exact saved study, even when its model has multiple studies. */
const studyHref = (study: LocalStudy) => `#/local-qwen/study/${study.id}`

const OUTCOMES: [string, string][] = [['Strict correct', 'lb-fill--solid'], ['Correct, wrong format', 'lb-fill--hatched'], ['Not solved', 'ow-remaining']]

function Bar({ counts, total }: { counts: number[]; total: number }) {
  return <span className="ow-bar" aria-hidden="true">{counts.map((count, index) => count > 0 &&
    <span key={OUTCOMES[index][0]} className={OUTCOMES[index][1]} style={{ width: `${count / total * 100}%` }} />)}</span>
}

const perCall = (value: number) => value >= .01 ? `$${value.toFixed(3)}` : `$${value.toFixed(4)}`
const isExact = (entry: Entry): entry is Entry & { cost: number } => entry.cost !== null && !entry.costIsFloor
const costText = (entry: Entry, missing: string) => entry.cost === null ? missing : `${entry.costIsFloor ? 'at least ' : ''}${perCall(entry.cost)} per call`

/** One study's result; `place` is null when the entry is shown outside any ranking. */
function EntryLine({ entry, place, sort, missing, index }: { entry: Entry; place: { place: number; tied: boolean } | null; sort: Sort; missing: string; index: number }) {
  const { study, strict, format, remaining, total, cost, costIsFloor } = entry
  const info = modelInfo(study.model)
  const timeout = ((study.protocol ?? {}) as Protocol).timeout_seconds
  const build = [study.runtime?.details?.quantization_level, study.runtime?.details?.runner].filter(Boolean).join(' · ')
  return <li className="ow-row" style={{ '--i': index } as CSSProperties}>
    <span className="ow-place">{place && <><span aria-hidden="true">{place.tied ? '=' : ''}{place.place}</span><span className="sr-only">{place.tied ? `Tied for place ${place.place}` : `Place ${place.place}`}</span></>}</span>
    <span className="ow-row-name">
      <span className="lb-logo" aria-hidden="true">{info.logo ? <img src={`${import.meta.env.BASE_URL}${info.logo}`} alt="" width={16} height={16} loading="lazy" /> : <span>{info.name[0]}</span>}</span>
      <a href={studyHref(study)}>{info.name}</a>
      {info.lab && <span className="ow-tags"><span>{info.lab}</span></span>}
    </span>
    <Bar counts={[strict, format, remaining]} total={total} />
    {sort === 'cost'
      ? <strong className="ow-score">{cost === null ? <small>{missing}</small> : <>{costIsFloor ? '≥ ' : ''}{perCall(cost)}<small> per call</small></>}</strong>
      : <strong className="ow-score">{Math.round(strict / total * 100)}%<small> {strict}/{total}</small></strong>}
    <InfoBubble label={`Details for ${info.name}`} wide>
      <dl className="lb-info-list ow-build">
        <div><dt>Solved</dt><dd>{Math.round(strict / total * 100)}% · {strict}/{total} strict</dd></div>
        {format > 0 && <div><dt>Wrong format</dt><dd>{format} more {format === 1 ? 'answer was' : 'answers were'} correct but in the wrong format</dd></div>}
        <div><dt>Hosted price</dt><dd>{costText(entry, missing)}{costIsFloor && ' (some calls have no token counts)'}</dd></div>
        <div><dt>Study</dt><dd><a href={studyHref(study)}>{study.label}</a></dd></div>
        <div><dt>Ollama tag</dt><dd>{study.model}</dd></div>
        {build && <div><dt>Build</dt><dd>{build}</dd></div>}
        {timeout !== undefined && <div><dt>Timeout</dt><dd>{timeout.toLocaleString('en-US')} s per call, set for this model</dd></div>}
      </dl>
    </InfoBubble>
  </li>
}

/** One set of studies run under matching conditions. Places are only ever given within it. */
function Cohort({ entries, sort, missing }: { entries: Entry[]; sort: Sort; missing: string }) {
  const id = useId()
  const lead = entries[0]
  const title = cohortName(lead.study)
  const boards = new Set(lead.rows.map(row => row.board_id)).size
  // Lower-bound and missing costs never enter the cost order. Equal conditions mean equal calls,
  // so strict counts compare directly.
  const exact = entries.filter(isExact)
  const ordered: Entry[] = sort === 'cost' ? exact : entries
  const outside = sort === 'cost' ? entries.filter(entry => !isExact(entry)) : []
  const places: { entry: Entry; place: number; tied: boolean }[] | null = ordered.length < 2 ? null
    : sort === 'cost' ? rank(exact, (a, b) => b.cost - a.cost) : rank(entries, (a, b) => b.strict - a.strict)
  const summary = entries.length === 1 ? `One study, ${lead.total} calls · no matching study to rank against`
    : `${entries.length} models on the same ${lead.total} calls${sort === 'cost' && !places ? ' · too few exact costs to order' : ''}`
  return <section className="ow-cohort" aria-labelledby={id}>
    <div className="ow-cohort-head">
      <p id={id} className="ow-cohort-title">{title}</p>
      <span className="ow-cohort-note">{summary}</span>
      <InfoBubble label={`Conditions for ${title}`} wide>
        <p>Every study here ran the same {boards} boards with the same {armCount(lead.rows)} prompt arms, {lead.total} calls each, under these settings.</p>
        <p>Ranks describe the saved configurations. Runners, quantization, and host conditions can differ between models.</p>
        <dl className="lb-info-list">{settings(lead.study).map(([term, value]) => <div key={term}><dt>{term}</dt><dd>{value}</dd></div>)}</dl>
      </InfoBubble>
    </div>
    {places
      ? <ol className="ow-results" aria-label={`${sort === 'cost' ? 'Cost per call' : 'Strict solve rate'} order for ${title}`}>{places.map(({ entry, place, tied }, index) =>
          <EntryLine key={entry.study.id} entry={entry} place={{ place, tied }} sort={sort} missing={missing} index={index} />)}</ol>
      : ordered.length > 0 && <ul className="ow-results" aria-label={`Unranked result for ${title}`}>{ordered.map((entry, index) =>
          <EntryLine key={entry.study.id} entry={entry} place={null} sort={sort} missing={missing} index={index} />)}</ul>}
    {outside.length > 0 && <>
      <p className="ow-outside">Outside the cost order: lower-bound or unavailable estimates</p>
      <ul className="ow-results" aria-label={`Outside the cost order for ${title}`}>{outside.map((entry, index) =>
        <EntryLine key={entry.study.id} entry={entry} place={null} sort={sort} missing={missing} index={ordered.length + index} />)}</ul>
    </>}
  </section>
}

/** A Choice with its name shown above it; the radio group carries the same name for assistive tech. */
function Field({ label, children }: { label: string; children: ReactNode }) {
  return <div className="ow-control"><span className="ow-control-label" aria-hidden="true">{label}</span>{children}</div>
}

/** Completed open-weight results, ranked only within cohorts of matching conditions; unfinished runs stay in a disclosure. */
export default function OpenWeightLeaderboard({ ui }: { ui: BookUi }) {
  const saved = useLocalStudies()
  const pricing = usePricing()
  const [sort, setSort] = useState<Sort>('rate')
  const [panel, setPanel] = useState('all')
  const [protocol, setProtocol] = useState('all')
  const [size, setSize] = useState('all')
  const [showProgress, setShowProgress] = useState(false)
  const { DataTable } = ui

  if (saved.status === 'loading') return <p className="leaderboard-status" role="status">Loading completed studies…</p>
  if (saved.status !== 'ready') return <p role="status">
    The saved study index could not be loaded. Reload the page or <a href={localArtifact('index.json')}>inspect the index</a>.
  </p>

  const complete = saved.data.studies.filter(isComplete)
  const assessments = complete.filter(study => study.kind !== 'audit')
  const audits = complete.filter(study => study.kind === 'audit').map(study => score(study, 'all'))
  const unfinished = saved.data.studies.filter(study => study.kind !== 'audit' && study.recorded < study.planned).length
  const panels = Object.keys(PANELS).filter(key => assessments.some(study => panelOf(study) === key))
  const panelStudies = assessments.filter(study => panel === 'all' || panelOf(study) === panel)
  const protocols = [...new Set(panelStudies.map(protocolName))].sort()
  const sizes = Array.from(new Set(assessments.flatMap(study => study.rows.map(row => row.size)))).sort((a, b) => a - b)
  const rates = pricing.status === 'ready' ? pricing.data.models : []
  const missing = pricing.status === 'ready' ? 'no price saved' : pricing.status === 'loading' ? 'loading prices' : 'prices unavailable'

  /** Reprice one study's recorded token counts at its family's saved hosted tariff; calls with unknown usage make it a floor. */
  const price = (study: LocalStudy, rows: LocalStudy['rows']) => {
    const tariff = rates.find(entry => entry.id === defaultTariff(study))
    const estimate = tariff && estimateCohort(rows, tariff.usd_per_million)
    return estimate && estimate.usage.attemptCount
      ? { cost: estimate.knownPartialCostUsd / estimate.usage.attemptCount, costIsFloor: !estimate.usage.complete }
      : { cost: null, costIsFloor: false }
  }
  const entries: Entry[] = panelStudies
    .filter(study => protocol === 'all' || protocolName(study) === protocol)
    .map(study => score(study, size)).filter(entry => entry.total > 0)
    .map(entry => ({ ...entry, ...price(entry.study, entry.rows) }))
    .sort((a, b) => modelInfo(a.study.model).name.localeCompare(modelInfo(b.study.model).name) || a.study.id.localeCompare(b.study.id))
  // Cohorts with something to rank come first, then by panel and title, so the order never depends on the scores.
  const cohorts = groupCohorts(entries).sort((a, b) => Number(b.length > 1) - Number(a.length > 1)
    || panels.indexOf(panelOf(a[0].study)) - panels.indexOf(panelOf(b[0].study)) || cohortName(a[0].study).localeCompare(cohortName(b[0].study)))
  const ranked = cohorts.filter(cohort => cohort.length > 1).length

  return <div className="ow-leaderboard">
    <div className="lb-controls">
      <Field label="Order within cohort"><Choice label="Order within cohort" value={sort} onChange={setSort} options={[['rate', 'Solve rate'], ['cost', 'Cost per call']]} /></Field>
      {panels.length > 1 && <Field label="Board panel"><Choice label="Board panel" value={panel} onChange={next => { setPanel(next); setProtocol('all') }} options={[['all', 'All panels'], ...panels.map(key => [key, PANELS[key]] as [string, string])]} /></Field>}
      <label className="ow-control"><span className="ow-control-label">Protocol</span>
        <select value={protocol} onChange={event => setProtocol(event.target.value)}>
          <option value="all">All protocols</option>
          {protocols.map(name => <option key={name} value={name}>{name}</option>)}
        </select>
      </label>
      <Field label="Board size"><Choice label="Board size" value={size} onChange={setSize} options={[['all', 'All sizes'], ...sizes.map(value => [String(value), `${value}×${value}`] as [string, string])]} /></Field>
    </div>
    <div className="lb-meta">
      <span>{cohorts.length} {cohorts.length === 1 ? 'cohort' : 'cohorts'} · {ranked} with more than one model · {sort === 'cost' ? 'highest exact cost per call first' : 'highest strict solve rate first'}</span>
      <InfoBubble label="How to read these results" wide>
        <p>Models are ranked only against studies run under the same conditions: the same boards and prompt arms, input (image or text grid), token budget and context, decoding and sampling round, thinking setting, answer-format constraint and loop detector. Each such group is a cohort with its own counts. A study with no match is shown alone, unranked. Repeated studies of the same model are shown separately when a cohort would otherwise count that model twice. Places never carry across cohorts, and nothing is pooled.</p>
        <p>These are fully completed studies on our own computer: {assessments.length} in all. A call is one board, asked once. When models had different time limits, a comparison requires every call to have finished within the shortest limit. Each row lists its own limit. Unfinished studies and loop-stop audits are listed separately below.</p>
        <p>Cost is not a bill: these models ran on our own computer for no fee. It reprices each study’s recorded tokens at the hosted price saved for its model family on {pricing.status === 'ready' ? pricing.data.checked_utc.slice(0, 10) : '30 October'}, per call. Only the Qwen models have a saved price (the 4B uses a stand-in). Only exact estimates are put in order; a lower bound (some calls have no token counts) or a missing price is listed after the order, never inside it. Electricity and hardware are not counted.</p>
        <p>Not solved includes wrong answers, answers cut off at the token budget, calls the loop detector stopped and recorded transport errors.</p>
      </InfoBubble>
      {OUTCOMES.map(([label, style]) => <span key={label} className="lb-legend-item"><i className={`lb-swatch ${style}`} aria-hidden="true" />{label}</span>)}
    </div>
    {cohorts.length ? cohorts.map(cohort => <Cohort key={cohort.map(entry => entry.study.id).join()} entries={cohort} sort={sort} missing={missing} />)
      : <p>No completed studies match these filters.</p>}
    {audits.length > 0 && <details className="lb-table ow-audits">
      <summary>Loop-stop audits ({audits.length})</summary>
      <p>Diagnostic reruns of only the calls the loop detector had stopped. They are never ranked with the cohorts above and ignore the filters.</p>
      <DataTable caption="Completed audits of selected client stops" headers={['Study', 'Strict / recorded', 'Correct, wrong format', 'Not solved']} rows={audits.map(({ study, strict, format, remaining, total }) => [
        <a href={studyHref(study)}>{study.label}</a>, `${strict}/${total}`, String(format), String(remaining),
      ])} />
    </details>}
    <details className="lb-table ow-unfinished" onToggle={event => { if (event.currentTarget.open) setShowProgress(true) }}>
      <summary>Unfinished and superseded runs ({unfinished})</summary>
      {showProgress && <Suspense fallback={<p role="status">Loading recorded progress…</p>}><OpenWeightProgress ui={ui} /></Suspense>}
    </details>
  </div>
}
