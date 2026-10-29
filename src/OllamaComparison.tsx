import { useEffect, useState } from 'react'
import { CavemanCostExplorer, CavemanOutcomeChart, CavemanTokenChart } from './CavemanVisuals'
import { artifactLink, receiptLinks } from './OllamaAssessment'
import { evidenceUrl, measurement, outcomeNames, reportedInputLengths, treatmentName, useSavedOllamaStudy, type BookUi, type ResultRow, type Summary } from './ollamaEvidence'
import './ollama-comparison.css'

type PairCall = { call_id: string; request_sha256: string; response_sha256: string }
type Pair = {
  board_id: string; size: number; image: string; image_sha256: string
  user_message_sha256: string; configuration_sha256: string
  checks: { same_user_message: boolean; same_requested_configuration: boolean; same_model_digest: boolean; caveman_system_only_difference: boolean }
  baseline: PairCall; caveman: PairCall
}
type Comparisons = {
  schema_version: number; study: string; model: { tag: string; digest: string }
  configuration: { model: string; stream: boolean; think: boolean; keep_alive: string | number; options: { num_ctx: number; num_predict: number; temperature: number; seed: number } }
  configuration_sha256: string; plan_sha256: string; system_sha256: string; pairs: Pair[]
}
type PairState = { status: 'loading' | 'error' } | { status: 'ready'; data: Comparisons }

/** Reject stale or unrelated pair indexes before using them to connect receipt routes. */
function isComparisons(value: unknown, summary: Summary): value is Comparisons {
  if (!value || typeof value !== 'object') return false
  const data = value as Partial<Comparisons>
  const hash = (value: unknown) => typeof value === 'string' && /^[a-f0-9]{64}$/.test(value)
  const call = (value: PairCall | undefined) => !!value && /^[a-z0-9_-]+$/.test(value.call_id) && hash(value.request_sha256) && hash(value.response_sha256)
  const config = data.configuration
  return data.schema_version === 1 && data.study === summary.study && data.model?.tag === summary.runtime.model
    && data.model.digest === summary.runtime.digest && hash(data.configuration_sha256) && hash(data.plan_sha256) && hash(data.system_sha256)
    && !!config && config.model === data.model.tag && config.stream === false && config.think === summary.protocol.think
    && (typeof config.keep_alive === 'string' || typeof config.keep_alive === 'number') && !!config.options
    && ['num_ctx', 'num_predict', 'temperature', 'seed'].every(key => config.options[key as keyof typeof config.options] === summary.protocol[key as 'num_ctx' | 'num_predict' | 'temperature' | 'seed'])
    && Array.isArray(data.pairs) && data.pairs.length > 0 && data.pairs.length * 2 === summary.rows.length
    && new Set(data.pairs.map(pair => pair.board_id)).size === data.pairs.length
    && data.pairs.every(pair => pair && /^[a-z0-9-]+$/.test(pair.board_id) && Number.isInteger(pair.size)
      && pair.image === `images/${pair.board_id}.png` && hash(pair.image_sha256) && hash(pair.user_message_sha256)
      && pair.configuration_sha256 === data.configuration_sha256 && call(pair.baseline) && call(pair.caveman)
      && !!pair.checks && pair.checks.same_user_message === true && pair.checks.same_requested_configuration === true
      && pair.checks.same_model_digest === true && pair.checks.caveman_system_only_difference === true
      && (['baseline', 'caveman'] as const).every(treatment => summary.rows.filter(row => row.call_id === pair[treatment].call_id
        && row.board_id === pair.board_id && row.size === pair.size && row.image === pair.image
        && row.treatment === treatment && row.state === 'recorded' && row.receipt === `receipts/${row.call_id}/metadata.json`).length === 1))
}

/** Read a derived, offline-verified pair index; missing provenance never creates inferred pairs. */
function useComparisons(summary: Summary | null): PairState {
  const [state, setState] = useState<PairState>({ status: 'loading' })
  useEffect(() => {
    if (!summary) return
    const controller = new AbortController()
    fetch(evidenceUrl('comparisons.json'), { signal: controller.signal })
      .then(response => { if (!response.ok) throw new Error('Pair index unavailable'); return response.json() })
      .then(value => { if (!isComparisons(value, summary)) throw new Error('Pair index invalid'); return value })
      .then(data => { if (!controller.signal.aborted) setState({ status: 'ready', data }) })
      .catch(() => { if (!controller.signal.aborted) setState({ status: 'error' }) })
    return () => controller.abort()
  }, [summary])
  return state
}

/** Preserve absent usage rather than treating it as zero in treatment totals. */
function total(rows: ResultRow[], field: 'input_tokens' | 'output_tokens' | 'elapsed_seconds'): number | null {
  return rows.length && rows.every(row => row[field] !== null) ? rows.reduce((sum, row) => sum + row[field]!, 0) : null
}

/** Add reported usage only when both components were captured. */
function combinedTokens(rows: ResultRow[]): number | null {
  const input = total(rows, 'input_tokens'), output = total(rows, 'output_tokens')
  return input === null || output === null ? null : input + output
}

/** Use stable saved call IDs for deep links, independent of ledger order. */
function receiptUrl(call: PairCall): string {
  return `#/local-open-models/receipt/${call.call_id}`
}

/** Show the two conditions as a reciprocal chain under one task and model configuration. */
function PairNavigation({ pair, current, model }: { pair: Pair; current: string; model: string }) {
  return <nav className="receipt-chain" aria-label="Matched baseline and Caveman receipts">
    <p><strong>{pair.board_id} · {pair.size}×{pair.size} · <code>{model}</code></strong><br />Same user prompt, board image and requested model configuration. Caveman adds one reviewed system instruction.</p>
    <div className="receipt-chain-actions">
      <a className={`button button-small ${current === pair.baseline.call_id ? 'button-mint' : 'button-outline'}`} href={receiptUrl(pair.baseline)} aria-current={current === pair.baseline.call_id ? 'page' : undefined}>Without Caveman · baseline</a>
      <a className={`button button-small ${current === pair.caveman.call_id ? 'button-mint' : 'button-outline'}`} href={receiptUrl(pair.caveman)} aria-current={current === pair.caveman.call_id ? 'page' : undefined}>With Caveman · skill applied</a>
    </div>
    <p className="receipt-chain-context"><a href="#/local-open-models/configuration">Shared model configuration</a> · <a href="#/caveman-summary">Caveman summary and all pairs</a> · <a href="#/local-open-models">Full request ledger</a></p>
  </nav>
}

/** Display the exact shared controls, keeping requested settings distinct from runtime guarantees. */
function Configuration({ data, summary, ui }: { data: Comparisons; summary: Summary; ui: BookUi }) {
  const { DataTable } = ui, config = data.configuration
  return <>
    <p>All {data.pairs.length} pairs use this frozen requested configuration and recorded weight digest. The offline comparison audit checks both raw requests, their hashes, the exact user message and the added system message. This establishes input matching; it does not control runtime cache or host state.</p>
    <DataTable caption="Shared Qwen configuration for both conditions" headers={['Field', 'Saved value']} rows={[
      ['Model', data.model.tag], ['Weight digest', <code>{data.model.digest}</code>],
      ['Requested configuration SHA-256', <code>{data.configuration_sha256}</code>],
      ['Runner / server', `${summary.runtime.details.runner} / ${summary.runtime.server_version}`],
      ['Quantization / format', `${summary.runtime.details.quantization_level} / ${summary.runtime.details.format}`],
      ['Thinking / streaming requested', `${config.think} / ${config.stream}`],
      ['Context / generation cap', `${config.options.num_ctx.toLocaleString()} / ${config.options.num_predict.toLocaleString()} tokens`],
      ['Temperature / seed', `${config.options.temperature} / ${config.options.seed}`], ['Keep-alive', String(config.keep_alive)],
      ['Client timeout', `${summary.protocol.timeout_seconds} s`],
      ['Baseline system message', 'None'], ['Caveman system message SHA-256', <code>{data.system_sha256}</code>],
    ]} />
    <p>{artifactLink('comparisons.json', 'Verified pair index (JSON)')} · {artifactLink('plan.json', 'Frozen plan')} · {artifactLink('runtime-audit.json', 'Runtime and host audit')} · {artifactLink('caveman-system.txt', 'Added Caveman instruction')}.</p>
    <p>The full request hashes differ because Caveman adds a system message. The common configuration hash excludes messages; each pair also records the shared user-message and image hashes. These are separate one-shot calls, with no shared conversation history.</p>
  </>
}

/** Show all saved pairs with outcomes and direct routes to both arms. */
function PairTable({ data, summary, ui }: { data: Comparisons; summary: Summary; ui: BookUi }) {
  const { DataTable } = ui
  const outcome = (call: PairCall) => {
    const row = summary.rows.find(row => row.call_id === call.call_id)!
    return <a href={receiptUrl(call)} aria-label={`${row.board_id}: ${treatmentName(row.treatment)} receipt`}>{outcomeNames[row.outcome] ?? row.outcome}</a>
  }
  return <DataTable caption="Twelve matched tasks: baseline receipt and Caveman receipt" headers={['Same board image', 'Without Caveman', 'With Caveman']} rows={data.pairs.map(pair => [
    artifactLink(pair.image, `${pair.board_id} · ${pair.size}×${pair.size}`), outcome(pair.baseline), outcome(pair.caveman),
  ])} />
}

/** Render a scope-limited performance readout from the saved paired sample. */
function CavemanSummary({ summary, data, ui }: { summary: Summary; data: Comparisons; ui: BookUi }) {
  const { LocalToc, Section, DataTable, Callout } = ui
  const baseline = summary.rows.filter(row => row.treatment === 'baseline'), caveman = summary.rows.filter(row => row.treatment === 'caveman')
  const strict = (rows: ResultRow[]) => `${rows.filter(row => row.strict_correct).length}/${rows.length}`
  const valid = (rows: ResultRow[]) => `${rows.filter(row => row.rule_valid_after_extraction).length}/${rows.length}`
  const capped = (rows: ResultRow[]) => String(rows.filter(row => row.finish_reason === 'length').length)
  const pairs = data.pairs.map(pair => ({ pair, baseline: baseline.find(row => row.call_id === pair.baseline.call_id)!, caveman: caveman.find(row => row.call_id === pair.caveman.call_id)! }))
  const transition = (field: 'strict_correct' | 'rule_valid_after_extraction', left: boolean, right: boolean) => pairs.filter(pair => pair.baseline[field] === left && pair.caveman[field] === right).length
  return <div className="reading-layout ollama-study">
    <LocalToc items={[{ id: 'caveman-finding', label: 'Observed result' }, { id: 'caveman-usage', label: 'Tokens & time' }, { id: 'caveman-cost', label: 'Cost tradeoff' }, { id: 'caveman-pairs', label: 'Every matched pair' }, { id: 'caveman-limits', label: 'What this supports' }]} />
    <main className="reading-column" id="main-content">
      <Section id="caveman-finding" title="More strict answers in this sample">
        <p className="lead"><code>{summary.runtime.model}</code> returned <strong>{strict(caveman)} strict correct answers with Caveman</strong>, compared with <strong>{strict(baseline)} without it</strong>. Counting uniquely recoverable off-format answers as a diagnostic, the counts were {valid(caveman)} and {valid(baseline)}.</p>
        <p>This is exploratory: <strong>n=4 boards per size, one run per condition</strong>. Only <code>qwen3.5:4b</code> was tested in this comparison. It cannot establish that Caveman caused the difference or that other Qwen models would behave the same way.</p>
        <CavemanOutcomeChart rows={summary.rows} />
        <details className="cv-method"><summary>Exact scores and paired transitions</summary>
        <DataTable caption="Caveman comparison by board size; four paired boards per size" headers={['Board size', 'Baseline strict', 'Caveman strict', 'Baseline valid¹', 'Caveman valid¹', 'Baseline capped²', 'Caveman capped²']} rows={[5, 7, 9].map(size => {
          const b = baseline.filter(row => row.size === size), c = caveman.filter(row => row.size === size)
          return [`${size}×${size}`, strict(b), strict(c), valid(b), valid(c), capped(b), capped(c)]
        }).concat([['All 12 boards', strict(baseline), strict(caveman), valid(baseline), valid(caveman), capped(baseline), capped(caveman)]])} />
        <p className="table-note">¹ Valid includes strict successes plus uniquely extracted, rule-valid JSON; extraction is a diagnostic, never a second attempt. ² Capped means <code>finish_reason=length</code> at {summary.protocol.num_predict.toLocaleString()} generated tokens. All 16 capped responses had no final answer. All 24 calls returned HTTP 200; the caps do not establish throttling or invalid completed solutions.</p>
        <DataTable caption="Paired outcomes on the same twelve boards" headers={['Grading criterion', 'Both pass', 'Caveman only', 'Baseline only', 'Neither passes']} rows={[
          ['Strict JSON + correct', transition('strict_correct', true, true), transition('strict_correct', false, true), transition('strict_correct', true, false), transition('strict_correct', false, false)].map(String),
          ['Valid after extraction', transition('rule_valid_after_extraction', true, true), transition('rule_valid_after_extraction', false, true), transition('rule_valid_after_extraction', true, false), transition('rule_valid_after_extraction', false, false)].map(String),
        ]} />
        </details>
        <p>The result was not uniformly better: on <a href="#/local-open-models/receipt/baseline_panel-7-01">panel-7-01, baseline returned a valid answer after extraction</a>, while <a href="#/local-open-models/receipt/caveman_panel-7-01">Caveman reached the token cap without a final answer</a>. Neither condition solved a 9×9 board within the budget.</p>
      </Section>
      <Section id="caveman-usage" title="Less generated text; more total reported tokens">
        <CavemanTokenChart rows={summary.rows} />
        <details className="cv-method"><summary>Exact token counts and request timing</summary>
        <DataTable caption="Usage and elapsed time across all twelve requests in each condition" headers={['Reported measure', 'Without Caveman', 'With Caveman']} rows={[
          ['Input tokens per request', reportedInputLengths(baseline), reportedInputLengths(caveman)],
          ['Total input tokens', measurement(total(baseline, 'input_tokens')), measurement(total(caveman, 'input_tokens'))],
          ['Total generated tokens (including thinking)', measurement(total(baseline, 'output_tokens')), measurement(total(caveman, 'output_tokens'))],
          ['Combined input + generated tokens', measurement(combinedTokens(baseline)), measurement(combinedTokens(caveman))],
          ['Sum of request wall times', measurement(total(baseline, 'elapsed_seconds'), 's'), measurement(total(caveman, 'elapsed_seconds'), 's')],
        ]} />
        </details>
        <p>Caveman added 1,131 reported input tokens to every request: 1,984 versus 853. The skill condition generated fewer tokens in total, but input plus generated tokens increased. Generated counts include thinking and do not measure final-answer verbosity. These receipts do not demonstrate a net token saving.</p>
        <p>The smaller sum of wall times is descriptive. All baseline requests ran before all Caveman requests; order was not counterbalanced. Prefix-cache growth, host memory pressure and swap changed during the run and were not captured per call. The study cannot isolate a speed effect from the skill.</p>
      </Section>
      <Section id="caveman-cost" title="Does the output reduction pay for the added input?">
        <p><strong>Sometimes, under a hosted tariff.</strong> Across these twelve boards, Caveman added 13,572 input tokens and reduced generated tokens by 8,715. The output-token price must exceed <strong>1.5573× the input-token price</strong> for the combined estimated charge to fall. Fewer generated tokens did occur; a net reduction in token count did not.</p>
        <CavemanCostExplorer rows={summary.rows} ui={ui} />
      </Section>
      <Section id="caveman-pairs" title="Follow the same task through both conditions">
        <p>Open either outcome to read its receipt, switch to its counterpart, inspect the shared configuration, and follow links to the original request, response and grades. The offline audit verifies matching user messages, image bytes, model digests and requested settings; the added Caveman system instruction is the only request-content difference.</p>
        <div className="next-actions"><a href="#/local-open-models/configuration">Shared model configuration</a>{artifactLink('comparisons.json', 'Pair index with hashes')}</div>
        <PairTable data={data} summary={summary} ui={ui} />
      </Section>
      <Section id="caveman-limits" title="An observation to replicate">
        <Callout tone="caution" title="A paired pilot, with uncontrolled conditions"><p>These are reused public boards, not a held-out test. The skill changes both the instruction and the input-token count. With one run per condition and no counterbalanced order, the observed difference supports a follow-up experiment, not a causal performance claim, a model ranking, or a general recommendation.</p></Callout>
        <p>The reviewed Caveman body was added to a fresh system message. No skill scripts, hooks, tools, global installation or additional attempts were used. {artifactLink('skill.json', 'Pinned application record')} · {artifactLink('caveman-system.txt', 'Exact skill instruction')} · {artifactLink('caveman-review.json', 'Scoped security review')}.</p>
        <p>A follow-up should repeat each condition, counterbalance order, include an input-length control, and record host conditions. It needs a separate plan and must respect ownership of the local inference service.</p>
        <div className="next-actions"><a href="#/local-open-models">Full local-model assessment</a>{artifactLink('summary.json', 'Original saved results')}{artifactLink('runtime-audit.json', 'Runtime and host audit')}</div>
      </Section>
    </main>
  </div>
}

/** Load only the visible final answer for a selected receipt, without showing stale output on navigation. */
function FinalAnswer({ row }: { row: ResultRow }) {
  const [saved, setSaved] = useState<{ callId: string; content?: string; error?: boolean } | null>(null)
  useEffect(() => {
    const controller = new AbortController()
    fetch(evidenceUrl(`receipts/${row.call_id}/response.json`), { signal: controller.signal })
      .then(response => { if (!response.ok) throw new Error('Response unavailable'); return response.json() })
      .then(value => { if (typeof value?.message?.content !== 'string') throw new Error('Response invalid'); return value.message.content as string })
      .then(content => { if (!controller.signal.aborted) setSaved({ callId: row.call_id, content }) })
      .catch(() => { if (!controller.signal.aborted) setSaved({ callId: row.call_id, error: true }) })
    return () => controller.abort()
  }, [row.call_id])
  if (!saved || saved.callId !== row.call_id) return <p role="status">Loading the saved final answer…</p>
  if (saved.error) return <p role="status">The saved final answer could not be loaded. Use the raw response link below or reload this page; no output is substituted.</p>
  return saved.content ? <div className="json-panel"><pre>{saved.content}</pre></div> : <p>No final-answer content was returned.{row.finish_reason === 'length' ? ' The response reached its generation budget; it is an unfinished attempt, not an invalid completed placement.' : ''} Generated tokens may still include thinking; inspect the raw response separately.</p>
}

/** Render one call with its matched counterpart and original artifacts. */
function PairedReceipt({ pair, callId, data, summary, ui }: { pair: Pair; callId: string; data: Comparisons; summary: Summary; ui: BookUi }) {
  const { Section, DataTable } = ui
  const row = summary.rows.find(row => row.call_id === callId)!, call = pair[row.treatment]
  return <main className="reading-column ollama-study ollama-standalone" id="main-content">
    <PairNavigation pair={pair} current={callId} model={data.model.tag} />
    <Section title="Recorded outcome">
      <p className="lead">{outcomeNames[row.outcome] ?? row.outcome}. {row.strict_correct ? 'The answer passed the requested JSON format and every Queens rule.' : row.rule_valid_after_extraction ? 'The strict format check failed; a uniquely extracted answer passed every Queens rule.' : 'No valid final placement was recorded.'}</p>
      <DataTable caption={`${callId}: saved usage and result`} headers={['Measure', 'Recorded value']} rows={[
        ['Call ID', <code>{callId}</code>], ['Condition', treatmentName(row.treatment)], ['HTTP / finish reason', `${row.http_status} / ${row.finish_reason}`],
        ['Input / generated tokens', `${measurement(row.input_tokens)} / ${measurement(row.output_tokens)}`], ['Request wall time', measurement(row.elapsed_seconds, 's')],
      ]} />
      <h3>Visible final answer</h3><FinalAnswer row={row} />
      <p>{receiptLinks(row)}</p>
    </Section>
    <Section title="The same model-visible task">
      <p>The written rules and attached image are byte-identical across this pair. {artifactLink(`receipts/${callId}/request.json`, 'Exact request JSON')} includes the full user prompt and image transport. {row.treatment === 'caveman' ? <>{artifactLink('caveman-system.txt', 'Caveman system instruction')} was prepended.</> : 'No system message was sent in this baseline call.'}</p>
      <figure className="ollama-pair-board"><a href={evidenceUrl(pair.image)}><img src={evidenceUrl(pair.image)} alt={`Exact blank ${pair.size} by ${pair.size} regional Queens image for ${pair.board_id}; open the original image`} /></a><figcaption>{pair.board_id} · the image supplied to both calls, with no answer overlay.</figcaption></figure>
      <details><summary>Shared task and request hashes</summary>
        <p>User message SHA-256: <code>{pair.user_message_sha256}</code><br />Image SHA-256: <code>{pair.image_sha256}</code><br />This request SHA-256: <code>{call.request_sha256}</code><br />This response SHA-256: <code>{call.response_sha256}</code></p>
      </details>
    </Section>
    <Section title="Shared model configuration">
      <Configuration data={data} summary={summary} ui={ui} />
      <p>Matching requested controls do not make this a fully controlled experiment: all baseline calls ran first, and cache and host memory state changed. <a href="#/caveman-summary">Read the performance summary and limitations</a>.</p>
    </Section>
  </main>
}

/** Resolve summary, shared configuration and receipt deep links exclusively from committed evidence. */
export function OllamaComparison({ ui, view, callId }: { ui: BookUi; view: 'summary' | 'configuration' | 'receipt'; callId?: string }) {
  const saved = useSavedOllamaStudy(), paired = useComparisons(saved.status === 'ready' ? saved.summary : null)
  const { PageHero, Callout, Section } = ui
  const pair = paired.status === 'ready' ? paired.data.pairs.find(pair => pair.baseline.call_id === callId || pair.caveman.call_id === callId) : undefined
  const title = view === 'summary' ? 'Caveman on local Qwen.' : view === 'configuration' ? 'One model configuration, two conditions.' : pair ? `${callId?.startsWith('caveman_') ? 'With Caveman' : 'Without Caveman'} · ${pair.board_id}` : 'Local Qwen receipt'
  const hero = <PageHero trail="Model generations / Caveman comparison" title={title} deck={view === 'summary' ? 'The saved qwen3.5:4b pilot, at a glance: final-answer outcomes, the token tradeoff, and when fewer generated tokens would lower a hosted charge.' : 'Follow the same board and user prompt from the baseline request to the request with the reviewed Caveman instruction.'} />
  if (saved.status === 'error' || paired.status === 'error') return <>{hero}<main className="reading-column ollama-standalone" id="main-content"><Callout tone="stop" title="The saved comparison could not be verified."><p>Reload this page, or inspect {artifactLink('comparisons.json', 'the pair index')} and {artifactLink('summary.json', 'the saved results')}. No receipt relationships or results are substituted.</p></Callout></main></>
  if (saved.status !== 'ready' || paired.status !== 'ready') return <>{hero}<main className="reading-column ollama-standalone" id="main-content"><p role="status">Loading the saved paired evidence…</p></main></>
  if (view === 'summary') return <>{hero}<CavemanSummary summary={saved.summary} data={paired.data} ui={ui} /></>
  if (view === 'configuration') return <>{hero}<main className="reading-column ollama-study ollama-standalone" id="main-content"><Section title="Matching requested controls"><Configuration data={paired.data} summary={saved.summary} ui={ui} /></Section><Section title="Every paired receipt"><PairTable data={paired.data} summary={saved.summary} ui={ui} /><div className="next-actions"><a href="#/caveman-summary">Caveman performance summary</a><a href="#/local-open-models">Full request ledger</a></div></Section></main></>
  return <>{hero}{pair && callId ? <PairedReceipt pair={pair} callId={callId} data={paired.data} summary={saved.summary} ui={ui} /> : <main className="reading-column ollama-standalone" id="main-content"><Callout title="This receipt is not in the saved comparison."><p><a href="#/caveman-summary">Return to the twelve matched pairs</a> to choose a recorded request.</p></Callout></main>}</>
}
