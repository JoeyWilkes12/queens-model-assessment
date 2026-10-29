import { useEffect, useId, useState, type ReactNode } from 'react'
import { aggregateUsage, breakEvenRatio, costComparison, parseRate, type Rates } from './cavemanCost'
import { evidenceUrl, type BookUi, type ResultRow } from './ollamaEvidence'
import { artifactLink } from './OllamaAssessment'

/** Pair redundant signed text with the book's small outline icons. */
function ChangeMark({ direction }: { direction: 'up' | 'down' | 'flat' }) {
  return <svg aria-hidden="true" viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6">
    {direction === 'flat' ? <path d="M3 10h14" /> : direction === 'up' ? <path d="M10 17V3m-5 5 5-5 5 5" /> : <path d="M10 3v14m-5-5 5 5 5-5" />}
  </svg>
}

/** Classify a resource change separately from correctness or causal effects. */
function Change({ value, children }: { value: number; children: ReactNode }) {
  return <span className={`cv-change ${value < 0 ? 'cv-benefit' : value > 0 ? 'cv-increase' : 'cv-neutral'}`}><ChangeMark direction={value < 0 ? 'down' : value > 0 ? 'up' : 'flat'} />{children}</span>
}

/** Format small counterfactual charges without rounding the sign away. */
function dollars(value: number, signed = false): string {
  const magnitude = Math.abs(value)
  return `${value < 0 ? '−' : signed && value > 0 ? '+' : ''}$${magnitude > 0 && magnitude < 0.000001 ? magnitude.toExponential(3) : magnitude.toFixed(6)}`
}

/** Format a signed relative change, retaining an undefined zero-baseline percentage. */
function percent(value: number | null): string {
  return value === null ? 'No baseline percentage' : `${value > 0 ? '+' : value < 0 ? '−' : ''}${Math.abs(value).toFixed(2)}%`
}

/** Compare four-board outcomes on a shared zero-to-four scale, with a written equivalent. */
export function CavemanOutcomeChart({ rows }: { rows: ResultRow[] }) {
  return <figure className="cv-figure">
    <figcaption><strong>Final-answer outcomes by board size</strong><p>Four matched boards per size; one request per condition. Strict and extracted-only answers remain distinct.</p></figcaption>
    <div className="cv-legend"><span><i className="cv-strict" />Strict correct</span><span><i className="cv-extracted" />Valid after extraction only</span><span><i className="cv-capped" />Budget-limited; no final answer</span></div>
    {[5, 7, 9].map(size => <div className="cv-outcome-group" key={size}><h3>{size}×{size} · n=4</h3>{(['baseline', 'caveman'] as const).map(treatment => {
      const sample = rows.filter(row => row.size === size && row.treatment === treatment), usage = aggregateUsage(sample)
      if (!usage) return <p key={treatment}>Recorded outcomes unavailable.</p>
      const extracted = usage.valid - usage.strict, other = usage.samples - usage.valid - usage.capped
      const description = `${treatment === 'baseline' ? 'Baseline' : 'Caveman'}: ${usage.strict}/${usage.samples} strict, ${extracted} extraction only, ${usage.capped} budget-limited${other ? `, ${other} other` : ''}`
      return <div className="cv-outcome-row" key={treatment}>
        <span>{treatment === 'baseline' ? 'Baseline' : '+ Caveman'}</span>
        <div className="cv-outcome-bar" role="img" aria-label={description}>{[{ count: usage.strict, className: 'cv-strict' }, { count: extracted, className: 'cv-extracted' }, { count: usage.capped, className: 'cv-capped' }, { count: other, className: 'cv-other' }].filter(item => item.count > 0).map(item => <span key={item.className} className={item.className} style={{ width: `${item.count / usage.samples * 100}%` }} aria-hidden="true">{item.count}</span>)}</div>
        <small>{usage.strict}/{usage.samples} strict</small><span className="sr-only">{description}</span>
      </div>
    })}</div>)}
    <p className="cv-note">Bar length = four requests, starting at zero. Counts are descriptive; this pilot does not establish a causal skill benefit. Exact outcomes and receipt links follow below.</p>
  </figure>
}

/** Show input overhead and generated-token reduction on one honest token scale. */
export function CavemanTokenChart({ rows }: { rows: ResultRow[] }) {
  const baseline = aggregateUsage(rows.filter(row => row.treatment === 'baseline')), caveman = aggregateUsage(rows.filter(row => row.treatment === 'caveman'))
  if (!baseline || !caveman) return <p>Token comparison unavailable; no missing usage is treated as zero.</p>
  const inputDelta = caveman.input - baseline.input, outputDelta = caveman.output - baseline.output
  const totalDelta = inputDelta + outputDelta, maximum = Math.max(baseline.input + baseline.output, caveman.input + caveman.output)
  return <figure className="cv-figure">
    <figcaption><strong>The token tradeoff, across all twelve boards</strong><p>Reported generated tokens include thinking. Combined counts are not a dollar cost.</p></figcaption>
    <div className="cv-token-changes">
      {[{ label: 'Extra input', value: inputDelta, base: baseline.input }, { label: 'Generated-token change', value: outputDelta, base: baseline.output }, { label: 'Combined-token change', value: totalDelta, base: baseline.input + baseline.output }].map(item => <div key={item.label}><span>{item.label}</span><Change value={item.value}><strong>{item.value > 0 ? '+' : '−'}{Math.abs(item.value).toLocaleString()}</strong> <small>({percent(item.value / item.base * 100)})</small></Change></div>)}
    </div>
    <div className="cv-legend"><span><i className="cv-input" />Input tokens</span><span><i className="cv-generated" />Generated tokens, including thinking</span></div>
    {[{ label: 'Baseline', usage: baseline }, { label: '+ Caveman', usage: caveman }].map(({ label, usage }) => <div className="cv-token-row" key={label}>
      <div><strong>{label}</strong><span>{(usage.input + usage.output).toLocaleString()} total</span></div>
      <div className="cv-token-track" role="img" aria-label={`${label}: ${usage.input.toLocaleString()} input and ${usage.output.toLocaleString()} generated tokens`}><span className="cv-input" style={{ width: `${usage.input / maximum * 100}%` }} /><span className="cv-generated" style={{ width: `${usage.output / maximum * 100}%` }} /></div>
      <small>{usage.input.toLocaleString()} input + {usage.output.toLocaleString()} generated</small>
    </div>)}
    <div className="cv-axis"><span>0 tokens</span><span>{maximum.toLocaleString()} tokens · common scale</span></div>
  </figure>
}

type Reference = { id: string; label: string; input_usd_per_million: number; output_usd_per_million: number; source_url: string; model_url: string }
type Pricing = { schema_version: number; checked_utc: string; measured_model: string; exact_model_available: boolean; exact_model_note: string; source: { name: string; url: string; selection_note: string }; references: Reference[] }
type PricingState = { status: 'loading' } | { status: 'error' } | { status: 'ready'; data: Pricing }

/** Accept only the pinned public pricing schema and nonnegative finite tariff values. */
function isPricing(value: unknown): value is Pricing {
  if (!value || typeof value !== 'object') return false
  const data = value as Partial<Pricing>
  return data.schema_version === 1 && data.measured_model === 'qwen3.5:4b' && data.exact_model_available === false
    && typeof data.checked_utc === 'string' && Number.isFinite(Date.parse(data.checked_utc)) && typeof data.exact_model_note === 'string'
    && data.source?.url === 'https://openrouter.ai/api/v1/models' && typeof data.source.name === 'string' && typeof data.source.selection_note === 'string'
    && Array.isArray(data.references) && data.references.length > 0 && data.references.every(item => item && typeof item.id === 'string' && typeof item.label === 'string'
      && [item.input_usd_per_million, item.output_usd_per_million].every(rate => typeof rate === 'number' && Number.isFinite(rate) && rate >= 0)
      && item.source_url === data.source?.url && typeof item.model_url === 'string' && /^https:\/\/openrouter\.ai\/qwen\/[a-z0-9.-]+$/.test(item.model_url))
}

/** Show signed charge contributions around a common zero; labels carry meaning without color. */
function CostBridge({ input, output, net }: { input: number; output: number; net: number }) {
  const maximum = Math.max(Math.abs(input), Math.abs(output), Math.abs(net)) || 1
  return <figure className="cv-figure cv-cost-bridge"><figcaption><strong>What changes the estimated charge</strong><p>Signed change in USD; both sides use the same scale.</p></figcaption>
    {[{ label: 'Added input charge', value: input }, { label: 'Generated-output charge change', value: output }, { label: 'Net charge change', value: net }].map(item => <div className="cv-bridge-row" key={item.label}>
      <span>{item.label}</span><div className="cv-bridge-track" aria-hidden="true"><span className={item.value < 0 ? 'cv-saving-bar' : 'cv-increase-bar'} style={{ left: item.value < 0 ? `${50 - Math.abs(item.value) / maximum * 50}%` : '50%', width: `${Math.abs(item.value) / maximum * 50}%` }} /></div><Change value={item.value}>{dollars(item.value, true)}</Change>
    </div>)}
    <div className="cv-bridge-axis"><div className="cv-axis"><span>− USD</span><span>0</span><span>+ USD</span></div></div>
  </figure>
}

/** Explore counterfactual hosted tariffs using fixed saved usage, without sending inference requests. */
export function CavemanCostExplorer({ rows, ui }: { rows: ResultRow[]; ui: BookUi }) {
  const { DataTable } = ui, id = useId()
  const [pricing, setPricing] = useState<PricingState>({ status: 'loading' }), [selection, setSelection] = useState(''), [scope, setScope] = useState('all')
  const [input, setInput] = useState(''), [output, setOutput] = useState('')
  useEffect(() => {
    const controller = new AbortController()
    fetch(evidenceUrl('pricing-reference.json'), { signal: controller.signal })
      .then(response => { if (!response.ok) throw new Error('Pricing snapshot unavailable'); return response.json() })
      .then(value => { if (!isPricing(value)) throw new Error('Pricing snapshot invalid'); return value })
      .then(data => { if (!controller.signal.aborted) { setPricing({ status: 'ready', data }); setSelection(data.references[0].id); setInput(String(data.references[0].input_usd_per_million)); setOutput(String(data.references[0].output_usd_per_million)) } })
      .catch(() => { if (!controller.signal.aborted) setPricing({ status: 'error' }) })
    return () => controller.abort()
  }, [])
  if (pricing.status === 'loading') return <p role="status">Loading the saved pricing references…</p>
  if (pricing.status === 'error') return <p role="status">Pricing references could not be loaded. {artifactLink('pricing-reference.json', 'Inspect the saved pricing snapshot')} or reload. No prices are substituted.</p>
  const sample = rows.filter(row => scope === 'all' || row.size === Number(scope)), baseline = aggregateUsage(sample.filter(row => row.treatment === 'baseline')), caveman = aggregateUsage(sample.filter(row => row.treatment === 'caveman'))
  const inputRate = parseRate(input), outputRate = parseRate(output), rates: Rates | null = inputRate === null || outputRate === null ? null : { input: inputRate, output: outputRate }
  const result = baseline && caveman && rates ? costComparison(baseline, caveman, rates) : null
  const threshold = baseline && caveman ? breakEvenRatio(baseline, caveman) : null
  const preset = pricing.data.references.find(item => item.id === selection)
  /** Copy a public reference tariff into editable local calculator fields. */
  function selectReference(value: string) {
    setSelection(value)
    const reference = pricing.status === 'ready' ? pricing.data.references.find(item => item.id === value) : undefined
    if (reference) { setInput(String(reference.input_usd_per_million)); setOutput(String(reference.output_usd_per_million)) }
  }
  /** Quote each subgroup with the same rate assumptions as the selected scope. */
  function estimateScope(size: number | null) {
    const scoped = rows.filter(row => size === null || row.size === size), b = aggregateUsage(scoped.filter(row => row.treatment === 'baseline')), c = aggregateUsage(scoped.filter(row => row.treatment === 'caveman'))
    return b && c && rates ? costComparison(b, c, rates) : null
  }
  return <div className="cv-cost-explorer">
    <p><strong>Illustrative hosted repricing of the recorded 4b usage.</strong> The local run's provider fee was $0; power and hardware costs were not measured. No exact 4b tariff was listed in the checked OpenRouter catalog. Selecting a 9B, 27B or Flash tariff does not show that model's performance or predict its bill.</p>
    <div className="cv-controls">
      <div><label htmlFor={`${id}-reference`}>Pricing reference</label><select id={`${id}-reference`} value={selection} onChange={event => selectReference(event.target.value)}>{pricing.data.references.map(item => <option key={item.id} value={item.id}>{item.label} · 4b usage only</option>)}<option value="custom">Custom rates · 4b usage only</option></select></div>
      <div><label htmlFor={`${id}-scope`}>Recorded sample</label><select id={`${id}-scope`} value={scope} onChange={event => setScope(event.target.value)}><option value="all">All twelve matched boards</option>{[5, 7, 9].map(size => <option key={size} value={String(size)}>{size}×{size} · four boards</option>)}</select></div>
      <div><label htmlFor={`${id}-input`}>Input price · USD / 1M tokens</label><input id={`${id}-input`} type="number" min="0" step="any" inputMode="decimal" value={input} onChange={event => { setSelection('custom'); setInput(event.target.value) }} aria-invalid={inputRate === null} /></div>
      <div><label htmlFor={`${id}-output`}>Output price · USD / 1M tokens</label><input id={`${id}-output`} type="number" min="0" step="any" inputMode="decimal" value={output} onChange={event => { setSelection('custom'); setOutput(event.target.value) }} aria-invalid={outputRate === null} /></div>
    </div>
    {result && baseline && caveman ? <>
      <div className="cv-cost-result" role="status" aria-live="polite"><strong>{result.delta < 0 ? 'Estimated saving' : result.delta > 0 ? 'Estimated increase' : 'No estimated difference'}</strong><Change value={result.delta}>{dollars(result.delta, true)} · {percent(result.percent)}</Change><span>Baseline {dollars(result.baseline.total)} → Caveman {dollars(result.caveman.total)} across {baseline.samples} boards.</span></div>
      <CostBridge input={result.inputDelta} output={result.outputDelta} net={result.delta} />
      <p className="cv-break-even">{threshold === null ? 'No generated-token reduction in this scope: additional input costs more whenever input has a positive price.' : <>Break-even for this scope: output tokens must cost <strong>more than {threshold.toFixed(4)}×</strong> the input-token price. {inputRate === 0 ? 'Input is currently free in this scenario.' : `Selected output/input price ratio: ${(outputRate! / inputRate!).toFixed(4)}×.`}</>}</p>
      <DataTable caption="Same selected tariff, different board sizes; estimated USD for recorded 4b usage" headers={['Recorded scope', 'Baseline', 'Caveman', 'Estimated change']} rows={[null, 5, 7, 9].map(size => {
        const estimate = estimateScope(size)
        return [size === null ? 'All twelve boards' : `${size}×${size} · n=4`, estimate ? dollars(estimate.baseline.total) : 'Unavailable', estimate ? dollars(estimate.caveman.total) : 'Unavailable', estimate ? <Change value={estimate.delta}>{dollars(estimate.delta, true)} · {percent(estimate.percent)}</Change> : 'Unavailable']
      })} />
    </> : <p role="status">Enter finite, nonnegative input and output prices. Missing usage or invalid prices are not treated as free tokens.</p>}
    <details className="cv-method"><summary>Pricing sources, formula and assumptions</summary>
      <p>Checked <time dateTime={pricing.data.checked_utc}>{new Date(pricing.data.checked_utc).toISOString().replace('T', ' ').slice(0, 19)} UTC</time>. <a href={pricing.data.source.url}>{pricing.data.source.name}</a> · {artifactLink('pricing-reference.json', 'Saved rate snapshot')}{preset ? <> · <a href={preset.model_url}>{preset.label} model page</a></> : null}.</p>
      <p>{pricing.data.source.selection_note} Model pages may show a different provider quote; this calculator consistently uses the dated API snapshot, not the lowest available price.</p>
      <p><code>Cost = (input tokens × input price + generated tokens × output price) / 1,000,000</code>. All reported generated tokens, including thinking, count once as output. <a href="https://openrouter.ai/docs/guides/best-practices/reasoning-tokens">OpenRouter's reasoning-token billing</a>.</p>
      <p>Assumes linear, uncached standard rates applied to the local reported counts. Hosted tokenization, image handling and routing may differ. Cache discounts, per-image/request charges, conditional rates, credit-purchase fees, taxes and local power/hardware are outside this estimate. The page reads only a committed snapshot; it sends no requests to OpenRouter or Ollama.</p>
    </details>
    <p className="cv-note">Positive charge changes mean more expensive under the selected assumptions; negative changes mean less expensive. These colors describe resource use, not a causal effect or a general model ranking.</p>
  </div>
}
