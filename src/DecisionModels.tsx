import { useEffect, useId, useMemo, useState, type ComponentType, type ReactNode } from 'react'
import './decision-models.css'

type BookUi = {
  PageHero: ComponentType<{ title: string; deck: string; trail: string; action?: { label: string; path?: string; scrollTo?: string } }>
  LocalToc: ComponentType<{ items: { id: string; label: string }[] }>
  Section: ComponentType<{ id?: string; title: string; label?: string; children: ReactNode }>
  Callout: ComponentType<{ tone?: 'note' | 'evidence' | 'caution' | 'stop'; title: string; children: ReactNode }>
  DataTable: ComponentType<{ caption: string; headers: string[]; rows: (string | ReactNode)[][] }>
}

type CalibrationBin = { answers: number; meanConfidence: number; accuracy: number }
type Scores = { omniscienceAccuracy: number; omniscienceNonHallucinationRate: number; hleTextMcqAccuracy: number; when2callAccuracy: number; wildguardtestAverageF1: number }
type AAModel = {
  slug: string
  kind: 'decisionModel' | 'llm'
  name: string
  creatorName: string
  indexScore: number
  scores: Scores
  costPer1MTasksUsd: number | null
  timePerTaskMs: number | null
  calibrationBins: CalibrationBin[]
  byDataset: Record<string, { calibrationBins: CalibrationBin[] }>
}
type Snapshot = { retrieved_utc: string; source_urls: Record<string, string>; models: AAModel[] }

const snapshotFile = 'evidence/external/aa-decision-index-2026-10-14.json'
const evidenceUrl = (path: string) => `${import.meta.env.BASE_URL}${path}`
const aa = {
  article: 'https://artificialanalysis.ai/articles/artificial-analysis-decision-index',
  leaderboard: 'https://artificialanalysis.ai/evaluations/artificial-analysis-decision-index',
  methodology: 'https://artificialanalysis.ai/methodology/decision-index',
}
const providerDocs = {
  jev: 'https://docs.typesafe.ai/concepts/system-one',
  subq: 'https://docs.subq.ai/endpoints/decisions-api/',
  subqLaunch: 'https://subq.ai/introducing-subq-snap',
  openai: 'https://developers.openai.com/api/docs/guides/decisions',
  openaiReference: 'https://developers.openai.com/api/reference/resources/decisions/methods/create',
}

/** Focal entities keep their color under every filter; everything else is a neutral de-emphasis mark. */
const focal: Record<string, 'jev' | 'openai'> = { 'Jev 1.13': 'jev', 'GPT-6 Luna (Decisions)': 'openai' }
const markClass = (model: AAModel) => focal[model.name] ? `dm-mark--${focal[model.name]}` : model.kind === 'llm' ? 'dm-mark--llm' : 'dm-mark--decision'

const benchmarkLabels: [keyof Scores, string][] = [
  ['omniscienceAccuracy', 'Omniscience accuracy'],
  ['omniscienceNonHallucinationRate', 'Non-hallucination'],
  ['hleTextMcqAccuracy', 'HLE-MultiChoice'],
  ['when2callAccuracy', 'When2Call'],
  ['wildguardtestAverageF1', 'WildGuardTest F1'],
]
const datasetLabels: [string, string][] = [
  ['all', 'All four, equally weighted'],
  ['aa-omniscience-decision', 'AA-Omniscience-Decision'],
  ['hle-multichoice', 'HLE-MultiChoice'],
  ['when2call', 'When2Call'],
  ['wildguardtest', 'WildGuardTest'],
]

function useSnapshot() {
  const [state, setState] = useState<{ status: 'loading' } | { status: 'error' } | { status: 'ready'; data: Snapshot }>({ status: 'loading' })
  useEffect(() => {
    const controller = new AbortController()
    fetch(evidenceUrl(snapshotFile), { signal: controller.signal })
      .then(response => { if (!response.ok) throw new Error('snapshot unavailable'); return response.json() as Promise<Snapshot> })
      .then(data => { if (!Array.isArray(data.models)) throw new Error('schema'); setState({ status: 'ready', data }) })
      .catch(() => { if (!controller.signal.aborted) setState({ status: 'error' }) })
    return () => controller.abort()
  }, [])
  return state
}

const fmt = (value: number, digits = 1) => value.toFixed(digits)
const money = (value: number | null) => value === null ? 'n/a' : `$${value < 10 ? value.toFixed(1) : Math.round(value)}`
const seconds = (ms: number | null) => ms === null ? 'n/a' : ms < 1000 ? `${(ms / 1000).toFixed(2)} s` : `${(ms / 1000).toFixed(1)} s`

function ChartFrame({ title, subtitle, legend, children, table }: { title: string; subtitle: string; legend?: ReactNode; children: ReactNode; table: ReactNode }) {
  const id = useId()
  return <figure className="dm-chart" aria-labelledby={`${id}-title`}>
    <figcaption><strong id={`${id}-title`}>{title}</strong><span>{subtitle}</span></figcaption>
    {legend && <div className="dm-legend">{legend}</div>}
    {children}
    <details className="dm-table-view"><summary>Show the data as a table</summary>{table}</details>
  </figure>
}

function LegendKey({ kind, label }: { kind: 'jev' | 'openai' | 'decision' | 'llm' | 'ideal'; label: string }) {
  return <span className="dm-legend-item"><span className={`dm-swatch dm-swatch--${kind}`} aria-hidden="true" />{label}</span>
}

function IndexBars({ models, includeLlms }: { models: AAModel[]; includeLlms: boolean }) {
  const rows = models.filter(model => includeLlms || model.kind === 'decisionModel').sort((a, b) => b.indexScore - a.indexScore)
  const [hover, setHover] = useState<string | null>(null)
  const max = 80
  const rowHeight = 26
  const labelWidth = 178
  const width = 640
  const plot = width - labelWidth - 44
  const height = rows.length * rowHeight + 26
  return <div className="dm-svg-wrap">
    <svg viewBox={`0 0 ${width} ${height}`} className="dm-svg" role="img" aria-label={`Decision Index scores for ${rows.length} models, highest first. Jev 1.13 scores ${fmt(models.find(m => m.name === 'Jev 1.13')?.indexScore ?? 0)}.`}>
      <defs><pattern id="dm-hatch" width="6" height="6" patternTransform="rotate(45)" patternUnits="userSpaceOnUse"><rect width="6" height="6" className="dm-hatch-bg" /><line x1="0" y1="0" x2="0" y2="6" className="dm-hatch-line" /></pattern></defs>
      {[0, 20, 40, 60, 80].map(tick => <g key={tick}><line x1={labelWidth + plot * tick / max} x2={labelWidth + plot * tick / max} y1={0} y2={height - 20} className="dm-grid" /><text x={labelWidth + plot * tick / max} y={height - 6} textAnchor="middle" className="dm-axis">{tick}</text></g>)}
      {rows.map((model, index) => {
        const y = index * rowHeight + 4
        const w = plot * model.indexScore / max
        return <g key={model.slug} className={hover && hover !== model.slug ? 'is-faded' : ''} onMouseEnter={() => setHover(model.slug)} onMouseLeave={() => setHover(null)}>
          <title>{`${model.name} (${model.creatorName}, ${model.kind === 'llm' ? 'language model' : 'decision model'}): index ${fmt(model.indexScore)}`}</title>
          <text x={labelWidth - 8} y={y + 13} textAnchor="end" className={`dm-label${focal[model.name] ? ' is-focal' : ''}`}>{model.name}</text>
          <path d={`M${labelWidth} ${y}h${Math.max(0, w - 4)}a4 4 0 0 1 4 4v10a4 4 0 0 1 -4 4h-${Math.max(0, w - 4)}z`} className={`dm-bar ${markClass(model)}`} />
          <text x={labelWidth + w + 6} y={y + 13} className="dm-value">{fmt(model.indexScore)}</text>
        </g>
      })}
    </svg>
  </div>
}

function CostScatter({ models }: { models: AAModel[] }) {
  const points = models.filter(model => model.costPer1MTasksUsd !== null)
  const [active, setActive] = useState<AAModel | null>(null)
  const width = 640, height = 340, left = 46, right = 40, top = 14, bottom = 42
  const minLog = Math.log10(10), maxLog = Math.log10(100000)
  const x = (cost: number) => left + (Math.log10(cost) - minLog) / (maxLog - minLog) * (width - left - right)
  const y = (score: number) => top + (1 - (score - 40) / 45) * (height - top - bottom)
  const labelled = new Set(['Jev 1.13', 'GPT-6 Luna (Decisions)', 'Claude Haiku 5.5 (Low)', 'Claude Opus 5.5 (Max, Default Fallback)'])
  return <div className="dm-svg-wrap dm-scatter">
    <svg viewBox={`0 0 ${width} ${height}`} className="dm-svg" role="img" aria-label="Decision Index score against cost per one million tasks on a logarithmic axis. Decision models cluster between $17 and $199 per million tasks; language models range from $88 to over $51,000.">
      {[10, 100, 1000, 10000, 100000].map(tick => <g key={tick}><line x1={x(tick)} x2={x(tick)} y1={top} y2={height - bottom} className="dm-grid" /><text x={x(tick)} y={height - bottom + 16} textAnchor="middle" className="dm-axis">{`$${tick.toLocaleString()}`}</text></g>)}
      {[40, 50, 60, 70, 80].map(tick => <g key={tick}><line x1={left} x2={width - right} y1={y(tick)} y2={y(tick)} className="dm-grid" /><text x={left - 8} y={y(tick) + 4} textAnchor="end" className="dm-axis">{tick}</text></g>)}
      <text x={(width + left) / 2} y={height - 6} textAnchor="middle" className="dm-axis-title">Cost per 1M tasks (USD, log scale)</text>
      {points.map(model => {
        const cx = x(model.costPer1MTasksUsd as number), cy = y(model.indexScore)
        const label = labelled.has(model.name)
        return <g key={model.slug} tabIndex={0} role="img" aria-label={`${model.name}: index ${fmt(model.indexScore)}, ${money(model.costPer1MTasksUsd)} per million tasks, ${seconds(model.timePerTaskMs)} per task`} onMouseEnter={() => setActive(model)} onMouseLeave={() => setActive(null)} onFocus={() => setActive(model)} onBlur={() => setActive(null)} className="dm-point">
          <circle cx={cx} cy={cy} r={14} className="dm-hit" />
          {model.kind === 'llm' ? <rect x={cx - 5} y={cy - 5} width={10} height={10} className={`dm-dot ${markClass(model)}`} /> : <circle cx={cx} cy={cy} r={5.5} className={`dm-dot ${markClass(model)}`} />}
          {label && <text x={cx > width * .7 ? cx - 9 : cx + 9} y={model.name === 'GPT-6 Luna (Decisions)' ? cy + 15 : cy + 4} textAnchor={cx > width * .7 ? 'end' : 'start'} className={`dm-point-label${focal[model.name] ? ' is-focal' : ''}`}>{model.name.replace(' (Max, Default Fallback)', ' (Max)')}</text>}
        </g>
      })}
    </svg>
    {active && <div className="dm-tooltip" role="status"><strong>{active.name}</strong><span>{active.kind === 'llm' ? 'Language model' : 'Decision model'} · {active.creatorName}</span><span>Index {fmt(active.indexScore)} · {money(active.costPer1MTasksUsd)} / 1M tasks · {seconds(active.timePerTaskMs)} per task</span></div>}
  </div>
}

function CalibrationChart({ models, dataset }: { models: AAModel[]; dataset: string }) {
  const series = models.filter(model => model.kind === 'decisionModel').map(model => ({ model, bins: (dataset === 'all' ? model.calibrationBins : model.byDataset[dataset]?.calibrationBins) || [] })).filter(item => item.bins.length)
  const ordered = [...series.filter(item => !focal[item.model.name]), ...series.filter(item => focal[item.model.name])]
  const size = 420, pad = 44
  const sx = (value: number) => pad + value * (size - pad - 12)
  const sy = (value: number) => size - pad - value * (size - pad - 12)
  return <div className="dm-svg-wrap dm-calibration">
    <svg viewBox={`0 0 ${size} ${size}`} className="dm-svg" role="img" aria-label="Reliability diagram: accuracy against stated probability of the chosen answer. Points below the diagonal are overconfident.">
      {[0, .25, .5, .75, 1].map(tick => <g key={tick}><line x1={sx(tick)} x2={sx(tick)} y1={sy(0)} y2={sy(1)} className="dm-grid" /><line x1={sx(0)} x2={sx(1)} y1={sy(tick)} y2={sy(tick)} className="dm-grid" /><text x={sx(tick)} y={size - pad + 14} textAnchor="middle" className="dm-axis">{tick}</text><text x={pad - 6} y={sy(tick) + 4} textAnchor="end" className="dm-axis">{tick}</text></g>)}
      <line x1={sx(0)} y1={sy(0)} x2={sx(1)} y2={sy(1)} className="dm-ideal" />
      <text x={sx(.5)} y={size - 6} textAnchor="middle" className="dm-axis-title">Stated probability of chosen answer</text>
      <text transform={`translate(11 ${size / 2 - 10}) rotate(-90)`} textAnchor="middle" className="dm-axis-title">Accuracy</text>
      {ordered.map(({ model, bins }) => <g key={model.slug} className={`dm-cal-series ${markClass(model)}`}>
        <title>{`${model.name}: ${bins.map(bin => `${fmt(bin.meanConfidence * 100, 0)}% stated → ${fmt(bin.accuracy * 100, 0)}% correct (${bin.answers} answers)`).join('; ')}`}</title>
        <polyline points={bins.map(bin => `${sx(bin.meanConfidence)},${sy(bin.accuracy)}`).join(' ')} className="dm-cal-line" />
        {focal[model.name] && bins.map((bin, index) => <circle key={index} cx={sx(bin.meanConfidence)} cy={sy(bin.accuracy)} r={4} className="dm-cal-dot" />)}
      </g>)}
    </svg>
  </div>
}

function QueensAAComparison({ ui }: { ui: BookUi }) {
  const { DataTable } = ui
  return <DataTable caption="The same decision models through two lenses" headers={['Model', 'AA Decision Index', 'AA HLE-MultiChoice', 'Queens: prepared candidates, explicit regions', 'Queens: fresh trajectories solved', 'Queens: deepest correct prefix at 9×9']} rows={[
    ['Jev 1.13', '57.5 (top decision model)', '20.9', '24/24 (7×7, 9×9; up to 255 options)', <>10/90 · <a href="#/jev-trajectories">1 of 9 boards</a></>, '5 queens'],
    ['SubQ Snap (preview)', 'Not listed (14 Oct)', 'Not listed', '24/24 (same requests, replayed)', <>10/90 · <a href="#/subq-assessment">2 of 9 boards</a></>, '1 queen'],
    ['GPT-6 Luna (Decisions)', '48.5', '11.7', 'Not run', 'Not run', 'Not run'],
  ]} />
}

export function DecisionModels({ ui, focusSection }: { ui: BookUi; focusSection?: string }) {
  const { PageHero, LocalToc, Section, Callout, DataTable } = ui
  const state = useSnapshot()
  const [includeLlms, setIncludeLlms] = useState(false)
  const [dataset, setDataset] = useState('all')
  useEffect(() => {
    if (!focusSection) return
    const frame = window.requestAnimationFrame(() => document.getElementById(focusSection)?.scrollIntoView({ block: 'start' }))
    return () => window.cancelAnimationFrame(frame)
  }, [focusSection])
  const models = state.status === 'ready' ? state.data.models : []
  const decision = useMemo(() => models.filter(model => model.kind === 'decisionModel'), [models])

  return <>
    <PageHero trail="Decision models" title="One call is not a plan." deck="Decision models return a probability for every option in a single, cheap call. Artificial Analysis now ranks eleven of them on knowledge, reasoning, tool routing and safety. Queens asks something its index cannot: many dependent decisions in a row." action={{ label: 'Jump to the comparison', scrollTo: 'dm-agree' }} />
    <div className="reading-layout">
      <LocalToc items={[{ id: 'dm-what', label: 'What they are' }, { id: 'dm-index', label: 'The Decision Index' }, { id: 'dm-agree', label: 'Where we agree' }, { id: 'dm-differ', label: 'Where we differ' }, { id: 'dm-lenses', label: 'Two lenses' }, { id: 'openai-plan', label: 'OpenAI Decisions plan' }, { id: 'dm-sources', label: 'Sources & snapshot' }]} />
      <main className="reading-column" id="main-content">
        <Section id="dm-what" title="A typed answer in one call" label="Decision models">
          <p className="lead">You send a state and typed questions; the model returns a probability for each allowed answer. There is no free text, no tool use and no second turn, and billing is per input token.</p>
          <DataTable caption="Three decision interfaces in this book" headers={['Interface', 'Questions', 'How we used it', 'Status']} rows={[
            [<a href={providerDocs.jev} target="_blank" rel="noreferrer">Jev 1.13 (TypeSafe)</a>, 'Choice, Noul, Score', 'OpenRouter Decisions route, text state', <a href="#/jev-primer">Five studies, Sep 18–30</a>],
            [<a href={providerDocs.subq} target="_blank" rel="noreferrer">SubQ Snap (Subquadratic)</a>, 'choice, noul, score', 'Direct provider API, same text states', <a href="#/subq-assessment">Replay + 90 trajectories, Oct 13</a>],
            [<a href={providerDocs.openai} target="_blank" rel="noreferrer">OpenAI Decisions (gpt-6-luna)</a>, 'choice, predicate, score', 'Planned; no request sent', <a href="#openai-plan" onClick={event => { event.preventDefault(); document.getElementById('openai-plan')?.scrollIntoView({ behavior: 'smooth' }) }}>Staged plan below</a>],
          ]} />
          <p>That shape suits classification and routing. It does not fit search: a decision model cannot propose, test and retract a placement within one call. Our harness had to supply each menu and stop on the first dead end.</p>
        </Section>

        <Section id="dm-index" title="The Decision Index, 14 October snapshot" label="Artificial Analysis">
          <p>Artificial Analysis averages four evaluations at 25% each: AA-Omniscience-Decision (500 private knowledge questions, split evenly between accuracy and non-hallucination), HLE-MultiChoice (513 reasoning questions), When2Call (3,423 tool-routing tasks) and WildGuardTest (835 safety-classification rows). Decision models are scored on their top-probability option; language models answer the same items through structured outputs.</p>
          {state.status === 'loading' && <p role="status">Loading the saved leaderboard snapshot…</p>}
          {state.status === 'error' && <p role="status">The saved leaderboard snapshot could not be loaded. No scores are substituted.</p>}
          {state.status === 'ready' && <>
            <div className="dm-filter" role="group" aria-label="Models shown">
              <button type="button" aria-pressed={!includeLlms} onClick={() => setIncludeLlms(false)}>Decision models (11)</button>
              <button type="button" aria-pressed={includeLlms} onClick={() => setIncludeLlms(true)}>With language models (26)</button>
            </div>
            <ChartFrame title="Decision Index" subtitle="Weighted average of four evaluations · higher is better · values as published"
              legend={<><LegendKey kind="jev" label="Jev 1.13" /><LegendKey kind="openai" label="GPT-6 Luna (Decisions)" /><LegendKey kind="decision" label="Other decision models" />{includeLlms && <LegendKey kind="llm" label="Language models" />}</>}
              table={<DataTable caption="Decision Index snapshot" headers={['Model', 'Kind', 'Developer', 'Index', 'Cost / 1M tasks', 'Time / task']} rows={models.filter(model => includeLlms || model.kind === 'decisionModel').sort((a, b) => b.indexScore - a.indexScore).map(model => [model.name, model.kind === 'llm' ? 'Language model' : 'Decision model', model.creatorName, fmt(model.indexScore), money(model.costPer1MTasksUsd), seconds(model.timePerTaskMs)])} />}>
              <IndexBars models={models} includeLlms={includeLlms} />
            </ChartFrame>
            <p>Jev 1.13 leads the decision models at 57.5. The next five sit between 52.3 and 53.9. Claude Haiku 5.5 at low effort scores 60.6 but takes 1.4 s and $184 per million tasks, against Jev's 0.13 s and $42.</p>
            <ChartFrame title="Capability against cost" subtitle="Index vs. cost per 1M tasks (log scale) · circles are decision models, squares are language models"
              legend={<><LegendKey kind="jev" label="Jev 1.13" /><LegendKey kind="openai" label="GPT-6 Luna (Decisions)" /><LegendKey kind="decision" label="Other decision models" /><LegendKey kind="llm" label="Language models" /></>}
              table={<DataTable caption="Index, cost and time" headers={['Model', 'Index', 'Cost / 1M tasks', 'Time / task']} rows={[...models].sort((a, b) => (a.costPer1MTasksUsd ?? 0) - (b.costPer1MTasksUsd ?? 0)).map(model => [model.name, fmt(model.indexScore), money(model.costPer1MTasksUsd), seconds(model.timePerTaskMs)])} />}>
              <CostScatter models={models} />
            </ChartFrame>
            <ChartFrame title="Calibration" subtitle="Accuracy against the stated probability of the chosen answer · below the diagonal means overconfident"
              legend={<><LegendKey kind="jev" label="Jev 1.13" /><LegendKey kind="openai" label="GPT-6 Luna (Decisions)" /><LegendKey kind="decision" label="Other decision models" /><LegendKey kind="ideal" label="Perfect calibration" /></>}
              table={<DataTable caption={`Calibration bins · ${datasetLabels.find(([key]) => key === dataset)?.[1]}`} headers={['Model', 'Stated → observed (answers)']} rows={decision.map(model => [model.name, ((dataset === 'all' ? model.calibrationBins : model.byDataset[dataset]?.calibrationBins) || []).map(bin => `${fmt(bin.meanConfidence * 100, 0)}% → ${fmt(bin.accuracy * 100, 0)}% (${bin.answers})`).join(' · ') || 'Not published'])} />}>
              <label className="dm-select-label" htmlFor="dm-dataset">Evaluation</label>
              <select id="dm-dataset" className="dm-select" value={dataset} onChange={event => setDataset(event.target.value)}>{datasetLabels.map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select>
              <CalibrationChart models={models} dataset={dataset} />
            </ChartFrame>
            <DataTable caption="Decision models by benchmark (values as published)" headers={['Model', ...benchmarkLabels.map(([, label]) => label), 'Index']} rows={[...decision].sort((a, b) => b.indexScore - a.indexScore).map(model => [focal[model.name] ? <strong>{model.name}</strong> : model.name, ...benchmarkLabels.map(([key]) => fmt(model.scores[key])), fmt(model.indexScore)])} />
            <p className="table-note">Charts are redrawn from a data snapshot of the public leaderboard taken {state.data.retrieved_utc.slice(0, 10)}; values are copied, not recomputed. The live leaderboard may have changed.</p>
          </>}
        </Section>

        <Section id="dm-agree" title="Where our Queens evidence agrees">
          <div className="dm-claims">
            <article><h3>Stated confidence runs ahead of accuracy on hard decisions.</h3><p><strong>AA:</strong> decision models are overconfident overall, driven by knowledge and reasoning; Jev states 61% average confidence on HLE-MultiChoice while answering 21% correctly. On WildGuardTest the same model is slightly underconfident. <strong>Queens:</strong> on non-forced cell choices, Jev was right 34% of the time at 48% average stated probability, SubQ 33% at 45%. Its Noul ranked the true candidate first on all six held-out boards yet accepted five wrong ones at P(yes) ≥ 0.5. Use the ranking, distrust the number, keep a checker.</p></article>
            <article><h3>Well-posed selection is their strength.</h3><p><strong>AA:</strong> the best decision models match or beat low-effort language models on WildGuardTest (95 vs 93) and When2Call (84 vs 77). <strong>Queens:</strong> with each candidate's regions spelled out, Jev and SubQ both picked the valid board 24/24 times from menus of up to 255.</p></article>
            <article><h3>Jev reasons further than its peers.</h3><p><strong>AA:</strong> Jev scores 20.9 on HLE-MultiChoice; no other decision model exceeds 15.4. <strong>Queens:</strong> on 7×7 and 9×9 boards Jev's attempts reached deeper correct prefixes than SubQ's (up to five queens vs one). SubQ is not on the index, so this is consistency across studies, not a test.</p></article>
          </div>
        </Section>

        <Section id="dm-differ" title="Where we differ, or where the index cannot see">
          <div className="dm-claims">
            <article><h3>A three-point gap on the index; a large gap on Queens.</h3><p>Claude Haiku 5.5 (Low) leads Jev by 3 index points. On Queens, frontier reasoning models built 11 complete solutions in 12 attempts, while no decision model completed a board larger than 5×5. Our language-model cohort differs from AA's comparators, but index proximity clearly does not imply proximity on multi-step constraint satisfaction.</p></article>
            <article><h3>Single calls cannot show compounding error.</h3><p>Every AA task is answered in one call. A 9×9 Queens trajectory needs nine cell placements in a row, and one legal-looking but wrong cell ends it. Even 90% accuracy per independent placement compounds to about 39% over nine. A greedy rule with no model completed 4 of our 9 boards, more than either decision model.</p></article>
            <article><h3>OpenAI's Decisions entry scores like non-reasoning Luna.</h3><p>GPT-6 Luna (Decisions) scores 48.5, next to GPT-6 Luna without reasoning (49.6) and well below Luna at low effort (55.2), at $79 vs $131 per million tasks. We predict it will behave like the other decision models on Queens: strong on prepared candidates, weak at construction. That is a hypothesis; no request has been sent.</p></article>
            <article><h3>SubQ Snap is not ranked.</h3><p>As of this snapshot, the index does not list SubQ Snap. Subquadratic's launch article reports a Decision Index score of 61.7 against Jev's 57.9; that is vendor-reported, not a leaderboard entry. On Queens, SubQ matched Jev on both headline counts with a different failure profile. Neither result confirms a general advantage.</p></article>
            <article><h3>The index has uncertainty it does not report.</h3><p>No intervals, repeats or seeds are published. A binomial approximation from the published item counts gives roughly ±1.7 points (95%) on a difference between two index scores; on HLE-MultiChoice alone a single model's score is uncertain by about ±3.5 points. Jev's 3.6-point lead clears the index threshold; the five models between 52.3 and 53.9 do not separate. Our exact-request tests also found Jev changing its choice in 8 of 17 identical-request groups, so single-pass scores carry run-to-run noise too. Calibration bins are incomplete as well: Jev's knowledge bins cover 385 of 500 questions.</p></article>
          </div>
          <Callout tone="caution" title="Neither benchmark answers the other's question.">The index measures breadth over thousands of independent single-step items. Queens measures depth: dependent decisions on a handful of boards. Read them together; do not let either stand in for the other.</Callout>
        </Section>

        <Section id="dm-lenses" title="The same models, two lenses">
          <QueensAAComparison ui={ui} />
          <p className="table-note">Queens counts come from saved, deterministic grades. SubQ's 24/24 replays the same historical requests that Jev answered; its fresh trajectories reuse Jev's nine boards and protocol. Boards solved differ by model.</p>
        </Section>

        <Section id="openai-plan" title="Next: OpenAI Decisions on the same tasks">
          <Callout tone="stop" title="Future plan: access and behavior remain unverified.">Official documentation establishes the API. This assessment has not verified OpenAI account access, issued inference calls or incurred OpenAI charges.</Callout>
          <DataTable caption="OpenAI Decisions facts checked October 12, 2026" headers={['Field', 'Documented contract']} rows={[
            ['Status and model', 'Public beta · gpt-6-luna'],
            ['Endpoint', 'POST /v1/decisions'],
            ['Questions', 'predicate, choice, score; 2–255 unique choices'],
            ['Input', 'Text and images; no tools, audio or files'],
            ['Published base price', '$0.10 / million input tokens; output omitted for Decisions'],
          ]} />
          <DataTable caption="Proposed sequence" headers={['Stage', 'Work', 'Advance when']} rows={[
            ['Freeze', 'Pair eligible Jev/SubQ receipts; preserve board, wording, options, order and hashes.', 'Access terms and a separate budget are settled.'],
            ['Connectivity', 'One known-answer Choice, then one historical 5×5 candidate request.', 'Identity, schema, receipts, grading and usage are verified.'],
            ['Representation', 'Replay columns, coordinates, explicit regions and reordered descriptions.', 'The semantic mapping is working.'],
            ['Primitives', 'Compare Choice, Predicate and Score on answer-present and all-invalid sets.', 'Each threshold stays explicit.'],
            ['Construction', 'Fresh raw/local trajectories and exact-body repeatability.', 'The harness preserves dependencies and stopping rules.'],
          ]} />
          <p>Predictions to test: explicit region lists still beat column vectors; ranking works where absolute thresholds fail; individually fast decisions still accumulate into dead-end paths; option order changes choices. <a href={evidenceUrl('evidence/openai-decisions-plan.md')} download>Download the complete test plan</a>.</p>
        </Section>

        <Section id="dm-sources" title="Sources and the saved snapshot">
          <ul className="source-list">
            <li><a href={aa.article} target="_blank" rel="noreferrer">Artificial Analysis Decision Index v1.0</a><span>Launch article, 13 October 2026.</span></li>
            <li><a href={aa.leaderboard} target="_blank" rel="noreferrer">Live Decision Index leaderboard</a><span>Current values; may differ from the snapshot.</span></li>
            <li><a href={aa.methodology} target="_blank" rel="noreferrer">Decision Index methodology</a><span>Datasets, scoring rules and weights.</span></li>
            <li><a href={providerDocs.subqLaunch} target="_blank" rel="noreferrer">Introducing SubQ Snap</a><span>Vendor claims; not independently ranked.</span></li>
            <li><a href={providerDocs.openaiReference} target="_blank" rel="noreferrer">OpenAI Decisions reference</a><span>Request and response schema.</span></li>
          </ul>
          <p><a href={evidenceUrl(snapshotFile)} download>Download the leaderboard data snapshot (JSON)</a>. It holds every published model record, unrounded, with retrieval time and SHA-256 hashes of the captured pages. Artificial Analysis publishes no <code>llms.txt</code>; the full page captures are kept privately for provenance and are not redistributed.</p>
        </Section>
      </main>
    </div>
  </>
}
