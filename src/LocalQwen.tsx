import { useEffect, useState } from 'react'
import type { BookUi } from './ollamaEvidence'
import { compareArms, isMatchedCohort, parseRate, type Rates } from './localQwenMath'
import { armName, localArtifact, localReceiptUrl, rowOutcome, useLocalStudies, type LocalIndex, type LocalRow, type LocalStudy, type Pricing } from './localQwenEvidence'
import './ollama-comparison.css'
import './local-qwen.css'

const number = (v: number | null) => v === null ? 'Not reported' : v.toLocaleString('en-US', { maximumFractionDigits: 2 })
const usd = (v: number | null) => v === null ? 'Unknown: usage missing' : v === 0 ? '$0' : v < .000001 ? `$${v.toExponential(2)}` : `$${v.toFixed(6)}`
const percent = (v: number | null) => v === null ? 'No baseline percentage' : `${v > 0 ? '+' : ''}${v.toFixed(2)}%`
const recorded = (rows: LocalRow[]) => rows.filter(r => r.state === 'recorded')

/** Draw status glyphs in the book's consistent stroke style, redundant with visible labels. */
function Mark({ kind }: { kind: 'check' | 'loop' | 'clock' | 'up' | 'down' }) {
  return <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">{kind === 'check' ? <path d="m4 10 4 4 8-9" /> : kind === 'loop' ? <><path d="M15 6a6 6 0 1 0 1 6M15 2v5h-5" /></> : kind === 'clock' ? <><circle cx="10" cy="10" r="7" /><path d="M10 5v5l3 2" /></> : <path d={kind === 'up' ? 'M10 16V4m-5 5 5-5 5 5' : 'M10 4v12m-5-5 5 5 5-5'} />}</svg>
}

/** Summarize mutually exclusive outcomes, retaining pending requests in the planned denominator. */
function outcomeCounts(rows: LocalRow[]) {
  return [rows.filter(r => r.state === 'recorded' && r.strict_correct).length,
    rows.filter(r => r.state === 'recorded' && !r.strict_correct && r.format_only_correct).length,
    rows.filter(r => r.state === 'recorded' && r.loop_stopped).length,
    rows.filter(r => r.state === 'recorded' && r.truncated).length,
    rows.filter(r => r.state !== 'recorded').length,
    rows.filter(r => r.state === 'recorded' && !r.strict_correct && !r.format_only_correct && !r.loop_stopped && !r.truncated).length]
}
const categories = ['Strict correct', 'Correct, wrong format', 'Client loop-stop', 'Token cap', 'Pending', 'Other']
const classes = ['cv-strict', 'cv-extracted', 'lq-loop', 'cv-capped', 'lq-pending', 'cv-other']

/** Use one zero-based planned-count scale across every board size and treatment. */
function OutcomeMatrix({ study, rows }: { study: LocalStudy; rows: LocalRow[] }) {
  return <figure className="cv-figure"><figcaption><strong>What each request returned</strong><p>{study.label}. Four fixed boards per size and condition; one request per board in this study.</p></figcaption>
    <div className="cv-legend">{categories.map((c, i) => <span key={c}><i className={classes[i]} />{c}</span>)}</div>
    {[5, 7, 9].filter(size => rows.some(r => r.size === size)).map(size => <div className="cv-outcome-group" key={size}><h3>{size}×{size}</h3>{(['baseline', 'caveman'] as const).map(arm => {
      const group = rows.filter(r => r.size === size && r.treatment === arm), counts = outcomeCounts(group)
      return <div key={arm} className="cv-outcome-row"><span>{armName(arm)}</span><div className="cv-outcome-bar" role="img" aria-label={`${armName(arm)} ${size}×${size}: ${counts.map((n, i) => `${n} ${categories[i]}`).join(', ')}`}>
        {counts.map((n, i) => n > 0 ? <span key={i} className={classes[i]} style={{ width: `${n / 4 * 100}%` }} title={`${n} ${categories[i]}`}>{n}</span> : null)}
      </div><small>{counts[0]}/{group.length} strict</small></div>
    })}</div>)}
    <p className="cv-note">A token cap and a client loop-stop both leave the original attempt without a final solution. They are different stopping events. Follow-up rescues are counted separately.</p>
  </figure>
}

/** Show observed completion lengths rather than an untested smaller-budget counterfactual. */
function BudgetChart({ study, rows, ui }: { study: LocalStudy; rows: LocalRow[]; ui: BookUi }) {
  const { DataTable } = ui, max = Math.max(1, ...(['baseline', 'caveman'] as const).map(a => rows.filter(r => r.treatment === a).length))
  return <><figure className="cv-figure"><figcaption><strong>When strict answers finished</strong><p>Observed output-token lengths in this selected run. Unfinished requests never enter the completion count.</p></figcaption>
    <div className="cv-legend"><span><i className="cv-strict" />≤12,288</span><span><i className="lq-mid" />12,289–24,576</span><span><i className="lq-late" />24,577–32,768</span></div>
    {(['baseline', 'caveman'] as const).map(arm => {
      const group = rows.filter(r => r.treatment === arm && r.strict_correct && r.output_tokens !== null)
      const bins = [group.filter(r => r.output_tokens! <= 12288).length, group.filter(r => r.output_tokens! > 12288 && r.output_tokens! <= 24576).length, group.filter(r => r.output_tokens! > 24576).length]
      return <div className="cv-outcome-row" key={arm}><span>{armName(arm)}</span><div className="cv-outcome-bar" role="img" aria-label={`${armName(arm)}: ${bins.join(', ')} strict answers in the three output-token intervals`}>{bins.map((n, i) => n ? <span className={['cv-strict', 'lq-mid', 'lq-late'][i]} style={{ width: `${n / max * 100}%` }} key={i}>{n}</span> : null)}</div><small>{group.length}/{rows.filter(r => r.treatment === arm).length}</small></div>
    })}</figure>
    <DataTable caption={`Observed strict completions in ${study.label}`} headers={['Condition', '≤12,288', '≤24,576', 'All strict']} rows={(['baseline', 'caveman'] as const).map(arm => {
      const all = rows.filter(r => r.treatment === arm), strict = all.filter(r => r.strict_correct)
      return [armName(arm), String(strict.filter(r => r.output_tokens !== null && r.output_tokens <= 12288).length), String(strict.filter(r => r.output_tokens !== null && r.output_tokens <= 24576).length), `${strict.length}/${all.length}`]
    })} />
    <p className="cv-note">This is not a controlled estimate of the benefit of a larger budget. Budget, cache policy, transport, host conditions and stopping policy can differ between studies; the 4B pilot also diverged from a fresh replay. Sampling changes multiple decoding settings.</p></>
}

/** Load only the saved public tariff evidence, with no live API or inference requests. */
function usePricing() {
  const [state, setState] = useState<{ status: 'loading' | 'error' } | { status: 'ready'; data: Pricing }>({ status: 'loading' })
  useEffect(() => {
    const controller = new AbortController()
    fetch(`${import.meta.env.BASE_URL}evidence/local-qwen-pricing.json`, { signal: controller.signal }).then(r => { if (!r.ok) throw new Error('Missing rates'); return r.json() })
      .then((p: Pricing) => {
        if (p.schema_version !== 1 || p.catalog_url !== 'https://openrouter.ai/api/v1/models' || !Array.isArray(p.models) || !p.models.length || !Number.isFinite(Date.parse(p.checked_utc))
          || !p.models.every(m => /^qwen\/[a-zA-Z0-9.-]+$/.test(m.id) && [m.usd_per_million?.input, m.usd_per_million?.output].every(n => typeof n === 'number' && Number.isFinite(n) && n >= 0))) throw new Error('Invalid rates')
        if (!controller.signal.aborted) setState({ status: 'ready', data: p })
      }).catch(() => { if (!controller.signal.aborted) setState({ status: 'error' }) })
    return () => controller.abort()
  }, [])
  return state
}

/** Price every recorded attempt, including unsuccessful outputs; rescues retain their full replay usage. */
function Finance({ study, rows, ui }: { study: LocalStudy; rows: LocalRow[]; ui: BookUi }) {
  const prices = usePricing()
  if (prices.status !== 'ready') return <p role="status">{prices.status === 'loading' ? 'Loading saved tariffs…' : <>Saved tariffs could not be loaded. Reload or <a href={`${import.meta.env.BASE_URL}evidence/local-qwen-pricing.json`}>inspect the pricing artifact</a>. No substitute rates are used.</>}</p>
  if (!recorded(rows).length) return <p role="status">No requests have been recorded in this selected scope. Pending requests have no observed cost or success rate.</p>
  return <FinanceReady key={study.id} study={study} rows={rows} pricing={prices.data} ui={ui} />
}

/** Compare cohorts at their matching-family tariff; the unlisted 4B price remains an explicit proxy. */
function StudyCosts({ data, ui }: { data: LocalIndex; ui: BookUi }) {
  const pricing = usePricing(), { DataTable } = ui
  if (pricing.status !== 'ready') return <p role="status">{pricing.status === 'loading' ? 'Loading saved study-cost scenarios…' : 'Saved tariffs unavailable; study cost scenarios cannot be shown.'}</p>
  const prices = pricing.data
  return <><DataTable caption="Original attempts only · each study uses its own recorded tokens, with a matching hosted-model tariff or explicit 4B proxy" headers={['Study / tariff', 'Baseline', '+ Caveman', 'Spend change']} rows={data.studies.map(s => {
    const id = s.model.includes(':4b') ? 'qwen/qwen3.5-flash-02-23' : s.model.includes('27b') ? 'qwen/qwen3.5-27b' : 'qwen/qwen3.5-9b', tariff = prices.models.find(p => p.id === id)
    if (!tariff || !s.recorded) return [s.label, 'Not estimated', 'Not estimated', s.recorded ? 'Tariff unavailable' : 'No recorded requests']
    const c = compareArms(recorded(s.rows), tariff.usd_per_million)
    return [<>{s.label}<br /><small>{id}{s.model.includes(':4b') ? ' · 4B proxy' : ''}</small></>, usd(c.baseline.oneShotCostUsd), usd(c.caveman.oneShotCostUsd), !isMatchedCohort(s.rows) ? 'Comparison withheld: unmatched recorded boards' : c.deltaUsd === null ? 'Unknown: canceled-stream usage missing' : <span className={`cv-change ${c.deltaUsd < 0 ? 'cv-benefit' : c.deltaUsd > 0 ? 'cv-increase' : 'cv-neutral'}`}>{c.deltaUsd !== 0 && <Mark kind={c.deltaUsd < 0 ? 'down' : 'up'} />}{percent(c.percentDelta)}</span>]
  })} /><p className="cv-note">These are distinct workload scenarios, not a pooled bill or a hosted-performance comparison. Capped outputs are charged in full when usage is recorded. Client-stopped streams lack final usage, so full study costs are unknown.</p></>
}

/** Keep explicit tariff selection and editable rates independent from the selected local model. */
function FinanceReady({ study, rows, pricing, ui }: { study: LocalStudy; rows: LocalRow[]; pricing: Pricing; ui: BookUi }) {
  const { DataTable } = ui
  const defaultId = study.model.includes(':4b') ? 'qwen/qwen3.5-flash-02-23' : study.model.includes('27b') ? 'qwen/qwen3.5-27b' : 'qwen/qwen3.5-9b'
  const initial = pricing.models.find(m => m.id === defaultId)
  const [tariff, setTariff] = useState(initial?.id || 'custom'), [input, setInput] = useState(initial ? String(initial.usd_per_million.input) : ''), [output, setOutput] = useState(initial ? String(initial.usd_per_million.output) : ''), [rescues, setRescues] = useState(false)
  let rates: Rates | null = null
  try { rates = { input: parseRate(input), output: parseRate(output) } } catch { /* Keep invalid input visible, without an estimate. */ }
  let comparison: ReturnType<typeof compareArms> | null = null
  try { if (rates) comparison = compareArms(recorded(rows), rates, rescues) } catch { rates = null }
  const selection = (id: string) => { setTariff(id); const p = pricing.models.find(m => m.id === id); if (p) { setInput(String(p.usd_per_million.input)); setOutput(String(p.usd_per_million.output)) } }
  const change = (side: 'input' | 'output', value: string) => { setTariff('custom'); (side === 'input' ? setInput : setOutput)(value) }
  const proxy = study.model.includes(':4b') || (tariff !== 'custom' && tariff !== defaultId)
  const matched = isMatchedCohort(rows), delta = matched ? comparison?.deltaUsd ?? null : null
  const baseline = comparison?.baseline, caveman = comparison?.caveman
  const costs = comparison ? [comparison.baseline, comparison.caveman] : []
  const maxCost = Math.max(.000000001, ...costs.flatMap(c => [c.inputCostUsd ?? 0, (c.inputCostUsd ?? 0) + (c.outputCostUsd ?? 0)]))
  return <>
    <p><strong>{study.label} · {new Set(rows.map(r => r.size)).size === 1 ? `${rows[0].size}×${rows[0].size}` : 'all board sizes'}.</strong> Hosted-price scenario for this study’s actual local usage. {proxy ? 'The selected tariff is a proxy: no exact 4B price is available, or a different model tariff was selected. ' : ''}Local provider fees were $0; electricity and hardware costs were not measured. Hosted weights, quantization, tokenization and outputs may differ.</p>
    <div className="cv-controls">
      <div><label htmlFor="lq-tariff">Hosted reference tariff</label><select id="lq-tariff" value={tariff} onChange={e => selection(e.target.value)}>{pricing.models.map(p => <option value={p.id} key={p.id}>{p.id}{p.id === defaultId && !study.model.includes(':4b') ? ' · matching model family' : ' · proxy tariff'}</option>)}<option value="custom">Custom rates</option></select></div>
      <div><label htmlFor="lq-input">Input price · USD per million tokens</label><input id="lq-input" inputMode="decimal" type="text" value={input} aria-invalid={!rates} onChange={e => change('input', e.target.value)} /></div>
      <div><label htmlFor="lq-output">Output price · USD per million tokens</label><input id="lq-output" inputMode="decimal" type="text" value={output} aria-invalid={!rates} onChange={e => change('output', e.target.value)} /></div>
      <div className="lq-checkbox"><label><input type="checkbox" checked={rescues} onChange={e => setRescues(e.target.checked)} /> Include recorded follow-up rescues</label><small>Includes replayed thinking in reported input usage, not just the 256-token answer allowance.</small></div>
    </div>
    {!rates || !comparison ? <p role="status">Enter finite, nonnegative prices. Blank, invalid or overflowing values produce no estimate.</p> : <>
      <div className="cv-cost-result" role="status" aria-live="polite"><strong>{!matched ? 'Arm comparison withheld' : delta === null ? 'Total estimated cost is unknown' : delta < 0 ? 'Caveman reduces estimated spend' : delta > 0 ? 'Caveman increases estimated spend' : 'No estimated spend difference'}</strong>
        <span className={`cv-change ${delta === null || delta === 0 ? 'cv-neutral' : delta < 0 ? 'cv-benefit' : 'cv-increase'}`}>{delta !== null && delta !== 0 && <Mark kind={delta < 0 ? 'down' : 'up'} />}{!matched ? 'Recorded arms cover different boards or counts. Individual costs remain visible.' : delta === null ? 'Some original usage was not reported.' : `${delta > 0 ? '+' : delta < 0 ? '−' : ''}${usd(Math.abs(delta))} · ${percent(comparison.percentDelta)}`}</span>
        <span>{rescues ? 'Original attempts + recorded rescues' : 'Original attempts only'} · {recorded(rows).length}/{rows.length} planned requests recorded in this scope.</span>
      </div>
      <figure className="cv-figure"><figcaption><strong>Input overhead and generated-token charges</strong><p>Same zero-based USD scale for both arms. Original attempts only; missing components are labeled and never drawn as free.</p></figcaption><div className="cv-legend"><span><i className="cv-input" />Input charge</span><span><i className="cv-generated" />Generated-token charge, including thinking</span></div>
        {costs.map((c, i) => <div className="cv-token-row" key={i}><div><strong>{i ? '+ Caveman' : 'Baseline'}</strong><span>{usd(c.oneShotCostUsd)}</span></div>{c.oneShotCostUsd !== null ? <div className="cv-token-track" role="img" aria-label={`Input ${usd(c.inputCostUsd)}, generated ${usd(c.outputCostUsd)}`}><span className="cv-input" style={{ width: `${c.inputCostUsd! / maxCost * 100}%` }} /><span className="cv-generated" style={{ width: `${c.outputCostUsd! / maxCost * 100}%` }} /></div> : <p className="cv-note">Usage incomplete. Known components sum to {usd(c.knownPartialCostUsd)}; this is not the total.</p>}</div>)}
      </figure>
      <DataTable caption="Spend and success at the selected tariff; includes all recorded attempts, not only successful ones" headers={['Measurement', 'Baseline', '+ Caveman']} rows={[
        ['Reported input tokens', number(baseline!.usage.inputTokens), number(caveman!.usage.inputTokens)],
        ['Reported generated tokens', number(baseline!.usage.outputTokens), number(caveman!.usage.outputTokens)],
        ['One-shot estimated cost', usd(baseline!.oneShotCostUsd), usd(caveman!.oneShotCostUsd)],
        ['Strict one-shot solves', String(baseline!.strictSuccessCount), String(caveman!.strictSuccessCount)],
        ['Estimated cost per strict one-shot solve', baseline!.strictSuccessCount ? usd(baseline!.costPerStrictSuccessUsd) : 'Undefined: no strict solves', caveman!.strictSuccessCount ? usd(caveman!.costPerStrictSuccessUsd) : 'Undefined: no strict solves'],
        ...(rescues ? [
          ['Rescues recorded', String(baseline!.rescueAttemptCount), String(caveman!.rescueAttemptCount)],
          ['Incremental rescue cost', usd(baseline!.rescueIncrementalCostUsd), usd(caveman!.rescueIncrementalCostUsd)],
          ['Combined estimated cost', usd(baseline!.combinedCostUsd), usd(caveman!.combinedCostUsd)],
          ['Unique successes, original or rescued', String(baseline!.combinedStrictSuccessCount), String(caveman!.combinedStrictSuccessCount)],
          ['Cost per unique combined success', baseline!.combinedStrictSuccessCount ? usd(baseline!.costPerCombinedStrictSuccessUsd) : 'Undefined: no successes', caveman!.combinedStrictSuccessCount ? usd(caveman!.costPerCombinedStrictSuccessUsd) : 'Undefined: no successes'],
        ] : []),
      ]} />
      <p className="cv-break-even">{!matched ? 'No comparative break-even is reported for unmatched recorded cohorts.' : comparison.breakEvenRatio !== null ? `For original attempts, output/input pricing must exceed ${comparison.breakEvenRatio.toFixed(4)}× for extra Caveman input to pay for the observed output reduction.` : baseline!.usage.complete && caveman!.usage.complete ? 'No extra-input / reduced-output break-even applies here. The selected rates determine the signed cost difference above.' : 'A break-even ratio cannot be calculated because original usage is incomplete.'}</p>
    </>}
    <details className="cv-method"><summary>Pricing source, formula and limits</summary><p>Checked {new Date(pricing.checked_utc).toISOString().replace('T', ' ').slice(0, 19)} UTC. <a href={pricing.catalog_url}>OpenRouter public catalog</a> · <a href={`${import.meta.env.BASE_URL}evidence/local-qwen-pricing.json`}>Saved tariffs and catalog digest</a>. Catalog rates represent its provider/default conditions, not a guaranteed lowest quote. Full catalog bytes were not retained; the digest alone cannot reconstruct them.</p><p><code>USD = (input × input USD/M + generated × output USD/M) / 1,000,000</code>. Generated tokens include thinking once. Cache discounts, provider-specific image accounting and additional fees are not modeled. This reprices local counts; it is not an OpenRouter invoice or a prediction of hosted accuracy.</p><p>A canceled stream has no final token-usage receipt. Its unknown usage is not zero. Stream chunks and character lengths are not exact billable token counts, so loop-stop savings remain unpriced where usage is missing.</p></details>
  </>
}

/** Display the exact final answer and its reciprocal same-study pair without preloading all reasoning. */
function Receipt({ data, studyId, callId, ui }: { data: LocalIndex; studyId: string; callId: string; ui: BookUi }) {
  const study = data.studies.find(s => s.id === studyId), row = study?.rows.find(r => r.call_id === callId)
  const [answer, setAnswer] = useState<{ key: string; text: string } | null>(null)
  const key = `${studyId}/${callId}`
  useEffect(() => {
    if (!row?.receipt) return
    const controller = new AbortController()
    fetch(localArtifact(`${row.receipt}/response.json`), { signal: controller.signal }).then(r => { if (!r.ok) throw new Error(); return r.json() })
      .then(r => { if (!controller.signal.aborted) setAnswer({ key, text: r.message?.content || 'No final answer was returned.' }) })
      .catch(() => { if (!controller.signal.aborted) setAnswer({ key, text: 'The saved response could not be loaded. Inspect the raw artifact below.' }) })
    return () => controller.abort()
  }, [key, row?.receipt])
  const { PageHero, DataTable } = ui
  if (!study || !row) return <><PageHero trail="Local Qwen / receipts" title="Receipt not found" deck="This study or call is not present in the saved snapshot." /><main className="ollama-standalone"><a href="#/local-qwen">Return to Local Qwen</a></main></>
  const peer = study.rows.find(r => r.call_id === row.peer_call_id)
  return <><PageHero trail="Local Qwen / saved receipt" title={`${row.board_id} · ${armName(row.treatment)}`} deck={`${study.label} · ${rowOutcome(row)}`} /><main className="ollama-standalone lq-study" id="main-content">
    <nav className="receipt-chain" aria-label="Matched conditions"><strong>{study.model} · {study.budget.toLocaleString()} tokens · {study.decoding}</strong><p>{row.pair_verified ? 'Verified same board image, user message, model digest and requested controls; Caveman adds the reviewed system instruction.' : 'A verified complete pair is not available for this receipt.'}</p><div className="receipt-chain-actions"><a className="button button-small button-outline" href={`#/local-qwen/study/${study.id}`}>Study overview</a>{peer && <a className="button button-small button-mint" href={localReceiptUrl(study, peer)}>Compare {armName(peer.treatment)}</a>}</div></nav>
    <figure className="ollama-pair-board"><img src={localArtifact(row.image)} alt={`Saved ${row.size} by ${row.size} Queens board ${row.board_id}`} /><figcaption>Exact model-visible image, preserved in this snapshot.</figcaption></figure>
    <h2>Original final answer</h2><pre className="lq-answer">{row.state !== 'recorded' ? 'No completed receipt recorded.' : answer?.key === key ? answer.text : 'Loading saved final answer…'}</pre>
    {row.loop_stopped && <p>Client-stopped for detected repetition. The outcome under continued generation is unobserved. Final token usage was not reported; character and chunk counts are not billable token counts.</p>}
    {row.loop_stop?.enabled === true && <p>Detector: {String(row.loop_stop.checks ?? 'unreported')} checks · maximum repetition metric {String(row.loop_stop.max_metric ?? 'unreported')} · trigger at {String(row.loop_stop.fired_at_thinking_chars ?? 'no trigger')} thinking characters.</p>}
    <DataTable caption="Recorded original attempt" headers={['Field', 'Value']} rows={[
      ['Outcome', rowOutcome(row)], ['Input tokens', number(row.input_tokens)], ['Generated tokens', number(row.output_tokens)], ['Elapsed seconds', number(row.elapsed_seconds)], ['Model digest', <code>{study.runtime.digest}</code>],
      ['Configuration', <a href={localArtifact(study.plan)}>Frozen study plan</a>], ['Raw evidence', row.receipt ? <span className="lq-links">{['request', 'response', 'metadata'].map(f => <a key={f} href={localArtifact(`${row.receipt}/${f}.json`)}>{f}.json</a>)}</span> : 'Not recorded'],
    ]} />
    {row.rescue && <><h2>Separate forced-answer rescue</h2><p>{row.rescue.strict_correct ? 'Strict correct under the follow-up protocol.' : 'No strict correct answer under the follow-up protocol.'} This does not change the original grade.</p><p>Input {number(row.rescue.input_tokens)} · generated {number(row.rescue.output_tokens)} tokens. <a href={localArtifact(`${row.rescue.receipt}/metadata.json`)}>Rescue metadata</a> · <a href={localArtifact(`${row.rescue.receipt}/request.json`)}>Full replay request</a> · <a href={localArtifact(`${row.rescue.receipt}/response.json`)}>Response</a></p></>}
    <h2>Same board and model in other conditions</h2><p>These are related experiments with different budgets, decoding or stopping policies. They are not interchangeable repeats of an identical configuration.</p>
    <DataTable caption="Cross-study navigation; original grades retained" headers={['Study', 'Condition', 'Original outcome']} rows={data.studies.filter(s => s.runtime.digest === study.runtime.digest).flatMap(s => s.rows.filter(r => r.board_id === row.board_id && r.treatment === row.treatment).map(r => [<a href={localReceiptUrl(s, r)}>{s.label}</a>, `${s.budget.toLocaleString()} · ${s.decoding}`, rowOutcome(r)]))} />
  </main></>
}

/** Explore frozen cohorts without pooling budgets, decoding settings or policy interventions. */
function Overview({ data, ui, requested }: { data: LocalIndex; ui: BookUi; requested?: string }) {
  const initial = data.studies.find(s => s.id === requested) || data.studies.find(s => s.model.includes('9b') && s.budget === 24576 && s.decoding === 'greedy') || data.studies[0]
  const [studyId, setStudyId] = useState(initial.id), [size, setSize] = useState('all')
  const study = data.studies.find(s => s.id === studyId) || initial, rows = study.rows.filter(r => size === 'all' || r.size === Number(size))
  const { PageHero, Section, LocalToc, DataTable, Callout } = ui
  return <><PageHero trail="Model generations / local Qwen" title="Local Qwen: quality, compute and cost." deck="Compare fixed-board experiments by model, decoding, token budget and Caveman condition. Every number leads back to saved evidence." />
    <div className="reading-layout lq-study"><LocalToc items={[{ id: 'lq-overview', label: 'Study overview' }, { id: 'lq-selected', label: 'Selected results' }, { id: 'lq-budget', label: 'Completion lengths' }, { id: 'lq-finance', label: 'Hosted cost scenario' }, { id: 'lq-loop', label: 'Loop-stop method' }, { id: 'lq-receipts', label: 'Every request' }, { id: 'lq-provenance', label: 'Snapshot & method' }]} /><main className="reading-column" id="main-content">
      <Section id="lq-overview" title="Separate studies, visible denominators">
        <p className="lead">27B greedy completed every request strictly at 24,576 tokens. Sampling introduced correct answers in the wrong format; the 32K studies added an active loop-stopping policy. Each condition answers a different question.</p>
        <p>Snapshot captured <time dateTime={data.captured_utc}>{new Date(data.captured_utc).toISOString().replace('T', ' ').slice(0, 19)} UTC</time>. Additional nights are imported as new dated snapshots; this page does not poll the running benchmark.</p>
        <DataTable caption="All frozen cohorts; counts include both baseline and Caveman, not independent boards" headers={['Study', 'Recorded', 'Strict', 'Correct, wrong format', 'Token cap', 'Loop-stop', 'Rescued / tried']} rows={data.studies.map(s => {
          const c = outcomeCounts(s.rows), rescues = s.rows.filter(r => r.rescue)
          return [<button className="lq-study-link" onClick={() => { setStudyId(s.id); setSize('all'); document.getElementById('lq-selected')?.scrollIntoView() }}>{s.label}</button>, `${s.recorded}/${s.planned} · ${s.status}`, s.recorded ? `${c[0]}/${s.recorded}` : 'Pending', String(c[1]), String(c[3]), String(c[2]), `${rescues.filter(r => r.rescue!.strict_correct).length}/${rescues.length}`]
        })} />
        <p className="cv-note">Repeated conditions reuse 12 public boards, four at each size. Calls across studies are not independent board samples. No pooled model ranking or causal Caveman claim is implied.</p>
      </Section>
      <Section id="lq-selected" title="Inspect one configuration">
        <div className="cv-controls"><div><label htmlFor="lq-study">Study</label><select id="lq-study" value={study.id} onChange={e => setStudyId(e.target.value)}>{data.studies.map(s => <option value={s.id} key={s.id}>{s.label}</option>)}</select></div><div><label htmlFor="lq-size">Board size</label><select id="lq-size" value={size} onChange={e => setSize(e.target.value)}><option value="all">All board sizes</option>{[5, 7, 9].map(n => <option value={n} key={n}>{n}×{n}</option>)}</select></div></div>
        <p><code>{study.model}</code> · {study.budget.toLocaleString()} output-token allowance · {study.decoding}{study.round ? ` round ${study.round}` : ''} · {study.runtime.details?.runner} / {study.runtime.details?.quantization_level}. <a href={localArtifact(study.plan)}>Frozen configuration</a>.</p>
        <OutcomeMatrix study={study} rows={rows} />
      </Section>
      <Section id="lq-budget" title="Token budgets and completion lengths"><BudgetChart study={study} rows={rows} ui={ui} /></Section>
      <Section id="lq-finance" title="What would these requests cost through OpenRouter?"><StudyCosts data={data} ui={ui} /><h3>Explore the selected study and board-size scope</h3><Finance study={study} rows={rows} ui={ui} /></Section>
      <Section id="lq-loop" title="Loop-stop is an inference policy intervention">
        <Callout tone="caution" title="An early stop changes the experiment">Loop-stop uses the model’s evolving text to decide when to cancel a request. That is an outcome-dependent stopping rule, even though it leaves the initial prompt intact. A forced-answer rescue then adds replayed thinking, an instruction, an answer prefix and a second request.</Callout>
        <p>Only the separate 4B and 9B greedy 32K studies enable it. The detector checks repeated lines in the last 6,000 thinking characters, beginning at 12,000 characters and every 500 thereafter. It triggers at a repeat share of at least 0.7 for three consecutive checks, before final-answer text begins.</p>
        <p>The threshold was calibrated on earlier traces, including known cut-offs. It triggered on five historical 9B cut-offs and no historical completed calls. That is in-sample calibration, not an independent estimate of sensitivity or specificity. Last night’s matching live triggers support implementation reproducibility; they do not prove those requests would never finish.</p>
        <p>For the 9B matched 24K/32K observations, all 24 thinking prefixes matched, 18 complete outputs matched, and one previously capped request completed at 29,118 tokens. This is useful paired evidence. The budget, streaming and stopping policy changed together, so their separate causal effects remain unidentified. The 4B pilot had a different cache policy and most prefixes diverged.</p>
        <p>Describe a triggered call as <strong>“client-stopped for detected repetition; final outcome under continued generation unobserved.”</strong> Do not label it a natural token cap, completed incorrect answer, or a proven hopeless loop. Include triggered calls in the planned denominator.</p>
        <p>Within a loop-stop study both prompt arms use the same frozen detector. Their contrast describes performance under that policy; it does not isolate Caveman’s effect without it. Caveman may change repetition and therefore the chance of interruption. Comparing only the requests that escaped stopping would select on a post-treatment outcome.</p>
        <p>A clean future test would freeze the detector before evaluation and compare stop-on versus stop-off at the same 32K budget, model digest, prompt, board, cache policy and sampling controls, with repeated seeds and recorded usage. Savings against an unobserved uninterrupted 32K run are currently a hypothesis.</p>
        <p>New receipts retain code hashes but their per-call Git revision fields are null; the later checkout revision is not a substitute for missing call-time provenance. <a href="https://github.com/JoeyWilkes12/queens-model-assessment/blob/codex/caveman-cost-visuals/docs/local-qwen-methods.md">Read the detailed scientific review</a>, including calibration counts, matched traces and timing limitations.</p>
      </Section>
      <Section id="lq-receipts" title="Every request, its pair and any rescue">
        <DataTable caption={`${study.label} · ${size === 'all' ? 'all sizes' : `${size}×${size}`} · original attempts`} headers={['Board / condition', 'Original result', 'Input / generated tokens', 'Elapsed', 'Pair / follow-up']} rows={rows.map(r => [<a href={localReceiptUrl(study, r)}>{r.board_id}<br />{armName(r.treatment)}</a>, <span className="lq-status">{r.strict_correct ? <Mark kind="check" /> : r.loop_stopped ? <Mark kind="loop" /> : <Mark kind="clock" />}{rowOutcome(r)}</span>, `${number(r.input_tokens)} / ${number(r.output_tokens)}`, `${number(r.elapsed_seconds)} s`, <><a href={`#/local-qwen/receipt/${study.id}/${r.peer_call_id}`}>Other condition{r.pair_verified ? ' · verified pair' : ''}</a>{r.rescue && <><br />Rescue: {r.rescue.strict_correct ? 'strict correct' : 'not strict correct'}</>}</>])} />
      </Section>
      <Section id="lq-provenance" title="Frozen evidence, refreshable imports">
        <p>Original receipts, plans and grades are preserved byte for byte. Formatting recovery and host summaries are separately derived. <a href={localArtifact(data.manifest)}>Snapshot file hashes</a> · <a href={localArtifact('index.json')}>Study index</a> · <a href="#/caveman-summary">Original 4B Caveman analysis</a>.</p>
        <p>Source revision <code>{data.source_commit}</code>{data.source_dirty ? ', with uncommitted source state recorded at capture' : ''}. The snapshot verifier checks artifact hashes and derived results without inference. New samples never overwrite an older snapshot.</p>
        <details className="cv-method"><summary>Resource conditions for the selected study</summary><p>27B uses a different runner and quantization from 4B/9B. Latency also reflects host state and model order. Warning pressure alone does not establish throttling; swap-in rate and decode speed are needed. Host windows can include placement or the previously loaded model, so a window maximum is not a precise attribution to the selected model.</p><DataTable caption="Allowlisted numeric window maxima; full machine logs are excluded" headers={['Call', 'Max pressure', 'Max swap · GiB', 'Max model VRAM · GiB']} rows={rows.map(r => [r.call_id, r.host ? ({ 1: 'Normal', 2: 'Warning', 4: 'Critical' }[r.host.max_pressure_level as 1 | 2 | 4] || 'Not reported') : 'Not captured', number(r.host?.swap_used_gib_max ?? null), number(r.host?.max_model_vram_gib ?? null)])} /></details>
      </Section>
    </main></div>
  </>
}

/** Static-site entry point; all computation uses saved evidence, never a model endpoint. */
export default function LocalQwen({ ui, studyId, callId }: { ui: BookUi; studyId?: string; callId?: string }) {
  const saved = useLocalStudies(), { PageHero } = ui
  if (saved.status !== 'ready') return <><PageHero trail="Model generations / local Qwen" title="Local Qwen assessment" deck="Saved experiments and illustrative hosted costs." /><main className="ollama-standalone" role="status">{saved.status === 'loading' ? 'Loading the saved study snapshot…' : <>The saved study snapshot is unavailable or invalid. Reload or <a href={localArtifact('index.json')}>inspect the index</a>. No results are substituted.</>}</main></>
  return studyId && callId ? <Receipt data={saved.data} studyId={studyId} callId={callId} ui={ui} /> : <Overview key={studyId} data={saved.data} ui={ui} requested={studyId} />
}
