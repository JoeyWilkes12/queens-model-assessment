import { useEffect, useState, type ComponentType, type ReactNode } from 'react'

type BookUi = {
  PageHero: ComponentType<{ title: string; deck: string; trail: string }>
  LocalToc: ComponentType<{ items: { id: string; label: string }[] }>
  Section: ComponentType<{ id?: string; title: string; children: ReactNode }>
  Callout: ComponentType<{ tone?: 'note' | 'evidence' | 'caution' | 'stop'; title: string; children: ReactNode }>
  DataTable: ComponentType<{ caption: string; headers: string[]; rows: (string | ReactNode)[][] }>
}

type Treatment = 'baseline' | 'caveman'
type ResultRow = {
  call_id: string; board_id: string; size: number; treatment: Treatment
  state: 'recorded' | 'not_run' | 'started_unrecorded'; outcome: string
  strict_correct: boolean; rule_valid_after_extraction: boolean
  elapsed_seconds: number | null; input_tokens: number | null; output_tokens: number | null
  finish_reason: string | null; http_status: number | null; receipt: string | null; image: string
}
type Group = {
  treatment: Treatment; size: number; scheduled: number; recorded: number; http_completed: number
  strict_correct: number; rule_valid_after_extraction: number; format_only: number
  transport_errors: number; truncated: number; not_run: number; unrecorded?: number
}
type Summary = {
  study: string; updated_utc: string
  protocol: {
    modality: string; one_shot: boolean; tools: boolean; retries: number; think: boolean
    num_predict: number; timeout_seconds: number; temperature: number; seed: number; num_ctx: number
    structured_output_enforcement: boolean; reasoning_control_note: string
  }
  runtime: {
    model: string; digest: string; server_version: string; transport: string
    os: string; machine_architecture: string
    details: { family: string; parameter_size: string; quantization_level: string; runner: string; format: string }
  }
  rows: ResultRow[]; by_treatment_size: Group[]
  gate: { baseline_success: boolean; caveman_status: string }
  costs: { provider_fee_usd: number; local_total_cost_usd: number | null; note: string }
  limitations: string[]
}
type Skill = {
  repository: string; commit: string; skill_path: string; artifact_sha256: string; system_sha256: string
  application: string; review: { mode: string; report: string }
}
type SavedState = { status: 'loading' } | { status: 'error' } | { status: 'ready'; summary: Summary; skill: Skill | null }

const evidenceUrl = (path: string) => `${import.meta.env.BASE_URL}evidence/ollama/${path}`
const treatmentName = (value: Treatment) => value === 'baseline' ? 'Qwen baseline' : 'Qwen + Caveman'
const outcomeNames: Record<string, string> = {
  strict: 'Strict JSON + correct', format_only: 'Correct after extraction', incorrect: 'Incorrect placement',
  no_final_answer: 'No final answer', transport_error: 'Request failed', truncated: 'Budget-limited (token cap)', not_run: 'Not run', unrecorded: 'Started; result unrecorded',
}

/** Check the saved summary before presenting any score as evidence. */
function isSummary(value: unknown): value is Summary {
  if (!value || typeof value !== 'object') return false
  const data = value as Partial<Summary>
  return typeof data.study === 'string' && typeof data.updated_utc === 'string'
    && !!data.protocol && [data.protocol.num_predict, data.protocol.num_ctx, data.protocol.timeout_seconds, data.protocol.temperature, data.protocol.seed].every(item => typeof item === 'number' && Number.isFinite(item))
    && typeof data.protocol.think === 'boolean' && typeof data.protocol.reasoning_control_note === 'string'
    && !!data.runtime && typeof data.runtime.model === 'string' && typeof data.runtime.digest === 'string'
    && [data.runtime.server_version, data.runtime.transport, data.runtime.os, data.runtime.machine_architecture].every(item => typeof item === 'string')
    && !!data.runtime.details && [data.runtime.details.runner, data.runtime.details.family, data.runtime.details.parameter_size, data.runtime.details.quantization_level, data.runtime.details.format].every(item => typeof item === 'string')
    && !!data.gate && typeof data.gate.caveman_status === 'string'
    && !!data.costs && typeof data.costs.note === 'string' && typeof data.costs.provider_fee_usd === 'number'
    && (data.costs.local_total_cost_usd === null || typeof data.costs.local_total_cost_usd === 'number')
    && Array.isArray(data.limitations) && data.limitations.every(item => typeof item === 'string')
    && Array.isArray(data.rows) && data.rows.every(row => row && typeof row.call_id === 'string'
      && typeof row.board_id === 'string' && typeof row.size === 'number' && typeof row.image === 'string'
      && (row.treatment === 'baseline' || row.treatment === 'caveman')
      && (row.state === 'recorded' || row.state === 'not_run' || row.state === 'started_unrecorded') && typeof row.outcome === 'string'
      && typeof row.strict_correct === 'boolean' && typeof row.rule_valid_after_extraction === 'boolean'
      && (row.receipt === null || typeof row.receipt === 'string')
      && [row.elapsed_seconds, row.input_tokens, row.output_tokens].every(item => item === null || (typeof item === 'number' && Number.isFinite(item)))
      && (row.http_status === null || (typeof row.http_status === 'number' && Number.isInteger(row.http_status)))
      && (row.finish_reason === null || typeof row.finish_reason === 'string'))
    && Array.isArray(data.by_treatment_size) && data.by_treatment_size.every(group => group
      && (group.treatment === 'baseline' || group.treatment === 'caveman')
      && [group.size, group.scheduled, group.recorded, group.http_completed, group.strict_correct,
        group.rule_valid_after_extraction, group.format_only, group.transport_errors, group.truncated, group.not_run]
        .every(count => typeof count === 'number' && Number.isInteger(count) && count >= 0)
      && (group.unrecorded === undefined || (Number.isInteger(group.unrecorded) && group.unrecorded >= 0)))
}

/** Recognize optional pinned-skill provenance without blocking the baseline results. */
function isSkill(value: unknown): value is Skill {
  if (!value || typeof value !== 'object') return false
  const skill = value as Partial<Skill>
  return skill.repository === 'https://github.com/juliusbrussee/caveman'
    && typeof skill.commit === 'string' && /^[a-f0-9]{40}$/.test(skill.commit)
    && typeof skill.skill_path === 'string' && typeof skill.artifact_sha256 === 'string'
    && typeof skill.system_sha256 === 'string' && typeof skill.application === 'string'
    && !!skill.review && typeof skill.review.mode === 'string' && typeof skill.review.report === 'string'
}

/** Preserve missing timing and usage instead of turning absent measurements into zero. */
function measurement(value: number | null, unit?: string): string {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 'Not reported'
  return `${unit === 's' ? value.toFixed(2) : value.toLocaleString()}${unit ? ` ${unit}` : ''}`
}

/** Show distinct observed prompt lengths without inferring missing usage. */
function reportedInputLengths(rows: ResultRow[]): string {
  const lengths = [...new Set(rows.flatMap(row => typeof row.input_tokens === 'number' ? [row.input_tokens] : []))].sort((left, right) => left - right)
  return lengths.length ? lengths.map(value => value.toLocaleString()).join(', ') : 'not reported'
}

/** Link only to a relative artifact within this saved study bundle. */
function artifactLink(path: string, label: string, context?: string): ReactNode {
  if (!/^[a-zA-Z0-9][a-zA-Z0-9/_.-]*$/.test(path) || path.split('/').includes('..')) return <span>{label} unavailable</span>
  return <a href={evidenceUrl(path)} aria-label={context ? `${context}: ${label}` : undefined}>{label}</a>
}

/** Expose the exact saved input, returned output, and two separate grades for one request. */
function receiptLinks(row: ResultRow): ReactNode {
  if (row.state === 'started_unrecorded') return <>Result unrecorded · {artifactLink(`receipts/${row.call_id}/started.json`, 'Start marker', row.call_id)}</>
  if (!row.receipt) return 'Not run'
  const directory = row.receipt.slice(0, row.receipt.lastIndexOf('/') + 1)
  return <>{artifactLink(`${directory}request.json`, 'Request', row.call_id)} · {artifactLink(`${directory}response.json`, 'Response', row.call_id)} · {artifactLink(`${directory}grade.json`, 'Strict grade', row.call_id)} · {artifactLink(`${directory}diagnostic.json`, 'Extraction grade', row.call_id)} · {artifactLink(row.receipt, 'Metadata', row.call_id)}</>
}

/** Render a static local-model study using the book's existing reading and table components. */
export function OllamaAssessment({ ui }: { ui: BookUi }) {
  const { PageHero, LocalToc, Section, Callout, DataTable } = ui
  const [saved, setSaved] = useState<SavedState>({ status: 'loading' })
  useEffect(() => {
    const controller = new AbortController()
    const summary = fetch(evidenceUrl('summary.json'), { signal: controller.signal })
      .then(response => { if (!response.ok) throw new Error('Saved summary unavailable'); return response.json() })
      .then(data => { if (!isSummary(data)) throw new Error('Saved summary invalid'); return data })
    summary.then(async data => {
      // The application record is created only when the conditional arm is enabled.
      let pinned: Skill | null = null
      if (data.gate.caveman_status === 'enabled_after_review' || data.rows.some(row => row.treatment === 'caveman')) {
        try {
          const response = await fetch(evidenceUrl('skill.json'), { signal: controller.signal })
          const value: unknown = response.ok ? await response.json() : null
          pinned = isSkill(value) ? value : null
        } catch { /* Baseline results remain readable when optional provenance is unavailable. */ }
      }
      if (!controller.signal.aborted) setSaved({ status: 'ready', summary: data, skill: pinned })
    })
      .catch(() => { if (!controller.signal.aborted) setSaved({ status: 'error' }) })
    return () => controller.abort()
  }, [])

  const hero = <PageHero trail="Model generations / local open models" title="Local Qwen, measured separately." deck="A saved image pilot on 5×5, 7×7 and 9×9 regional Queens boards. Inspect the local runner, exact requests, deterministic grades, and conditional Caveman comparison." />
  if (saved.status === 'loading') return <>{hero}<main className="reading-column" id="main-content"><p className="board-view-unavailable" role="status">Loading the saved local-model assessment…</p></main></>
  if (saved.status === 'error') return <>{hero}<main className="reading-column" id="main-content"><Callout tone="stop" title="The saved assessment could not be loaded."><p>No results are substituted. Reload this page, or {artifactLink('summary.json', 'open the saved summary')} to inspect the published artifact.</p></Callout></main></>

  const { summary: data, skill } = saved
  const recorded = data.rows.filter(row => row.state === 'recorded')
  const baseline = recorded.filter(row => row.treatment === 'baseline')
  const caveman = recorded.filter(row => row.treatment === 'caveman')
  const baselineScheduled = data.rows.filter(row => row.treatment === 'baseline').length
  const unrecorded = data.rows.filter(row => row.state === 'started_unrecorded').length
  const budgetLimited = recorded.filter(row => row.finish_reason === 'length').length
  const httpCompleted = recorded.filter(row => row.http_status === 200).length
  const ratio = (count: number, attempts: number) => attempts ? `${count}/${attempts}` : 'No recorded results'
  const status = data.gate.caveman_status
  const gateTitle = status === 'gate_not_met' ? 'The baseline did not open the Caveman arm.'
    : data.gate.baseline_success ? 'The baseline success condition was met.' : 'The Caveman arm is conditional.'

  return <>{hero}<div className="reading-layout">
    <LocalToc items={[{ id: 'ollama-results', label: 'Saved results' }, { id: 'ollama-receipts', label: 'Every request' }, { id: 'ollama-caveman', label: 'Caveman condition' }, { id: 'ollama-runtime', label: 'Local runner' }, { id: 'ollama-method', label: 'Method & limits' }]} />
    <main className="reading-column" id="main-content">
      <Section id="ollama-results" title="What the local run returned">
        <p className="lead"><code>{data.runtime.model}</code> has {baseline.length} of {baselineScheduled} baseline requests recorded in this snapshot: <strong>{baseline.filter(row => row.strict_correct).length} strict correct</strong> and <strong>{baseline.filter(row => row.rule_valid_after_extraction).length} valid after extraction</strong>. {caveman.length ? `${caveman.length} paired Caveman requests are also recorded below.` : 'The Caveman condition is reported separately below.'}</p>
        <p><strong>{httpCompleted}/{recorded.length} recorded requests returned HTTP 200.</strong> {recorded.length === data.rows.length && httpCompleted === recorded.length ? 'Every scheduled request completed without a timeout. ' : ''}{budgetLimited} responses were budget-limited: <code>finish_reason: length</code> means the requested {data.protocol.num_predict.toLocaleString()}-token generation cap was reached. This is a token-budget outcome, not evidence of throttling or an invalid completed placement.</p>
        <p>“Strict correct” requires the requested JSON format and a valid placement. “Valid after extraction” includes strict successes and uniquely recoverable off-format answers; it is a diagnostic, not a second attempt. Denominators include recorded requests that failed or returned no final answer. Unattempted requests remain “Not run.” Started requests without a saved result are “Unrecorded” and excluded from correctness denominators.</p>
        {unrecorded ? <p role="status">{unrecorded} {unrecorded === 1 ? 'request was' : 'requests were'} started without a recorded result in this snapshot; {unrecorded === 1 ? 'it may' : 'they may'} be in progress or interrupted.</p> : null}
        <DataTable caption="Local pilot results by treatment and board size" headers={['Treatment / size', 'Recorded / planned', 'Strict correct', 'Valid after extraction', 'Format only', 'HTTP completed', 'Request failures', 'Budget-limited', 'Unrecorded', 'Not run']} rows={data.by_treatment_size.map(group => [
          `${treatmentName(group.treatment)} · ${group.size}×${group.size}`, `${group.recorded}/${group.scheduled}`,
          ratio(group.strict_correct, group.recorded), ratio(group.rule_valid_after_extraction, group.recorded),
          String(group.format_only), String(group.http_completed), String(group.transport_errors), String(group.truncated), String(data.rows.filter(row => row.treatment === group.treatment && row.size === group.size && row.state === 'started_unrecorded').length), String(group.not_run),
        ])} />
        <p className="table-note">Saved study <code>{data.study}</code>. Updated <time dateTime={data.updated_utc}>{data.updated_utc}</time>. {artifactLink('summary.json', 'Full summary (JSON)')}.</p>
        <Callout tone="caution" title="A local pilot has its own denominator."><p>These boards reuse a subset of the earlier image panel, with a different model, runner, and reasoning control. Read this as a bounded local experiment. It does not establish a model ranking or a controlled speed comparison.</p></Callout>
      </Section>

      <Section id="ollama-receipts" title="Every scheduled request">
        <p>Each board link opens the exact image supplied to the model. Request, response, strict grade, extraction grade, and runtime metadata stay separate. The page reads committed evidence; it never calls a model. Runtime-reported generated tokens include thinking and final-answer tokens, not just the visible final answer.</p>
        <p>For a budget-limited response, “No final answer” means no validated final placement was returned within the cap. It does not label an unfinished attempt as an invalid completed solution.</p>
        {data.rows.length ? <DataTable caption="Local model request ledger with raw JSON receipts" headers={['Request / treatment', 'Board image', 'Outcome', 'Strict correct', 'Valid after extraction', 'Wall time', 'Input tokens (reported)', 'Generated tokens (reported)', 'Evidence (JSON)']} rows={data.rows.map(row => [
          <><code>{row.call_id}</code><br />{treatmentName(row.treatment)}</>, artifactLink(row.image, `${row.board_id} · ${row.size}×${row.size}`),
          <>{outcomeNames[row.outcome] ?? row.outcome.replace(/_/g, ' ')}{row.finish_reason ? <><br /><small>Finish: {row.finish_reason}</small></> : null}</>,
          row.state === 'not_run' ? 'Not run' : row.state === 'started_unrecorded' ? 'Unrecorded' : row.strict_correct ? 'Yes' : row.finish_reason === 'length' ? 'No final answer' : 'No',
          row.state === 'not_run' ? 'Not run' : row.state === 'started_unrecorded' ? 'Unrecorded' : row.rule_valid_after_extraction ? 'Yes' : row.finish_reason === 'length' ? 'No final answer' : 'No',
          measurement(row.elapsed_seconds, 's'), measurement(row.input_tokens), measurement(row.output_tokens), receiptLinks(row),
        ])} /> : <p>No requests are scheduled in this saved snapshot.</p>}
      </Section>

      <Section id="ollama-caveman" title="When the skill comparison runs">
        <Callout tone={data.gate.baseline_success ? 'evidence' : 'note'} title={gateTitle}>
          <p>The frozen gate requires at least one baseline solution at 5×5 or larger, either strict or uniquely extracted and rule-valid, plus completed skill review. The paired arm uses the same frozen boards and generation settings in fresh requests, with the reviewed Caveman body added as a system instruction.</p>
          <p>{status === 'gate_not_met' ? 'No qualifying baseline solution was recorded, so Caveman was not run.' : status === 'enabled_after_review' ? 'The reviewed Caveman arm is enabled. Its recorded, unrecorded and not-run requests appear in the tables above.' : 'The saved status is pending baseline success or skill review; absence of Caveman results is not a failed model attempt.'}</p>
        </Callout>
        <p>{artifactLink('caveman-review.json', 'Caveman security review (JSON)')}: local semantic review, SkillSpector findings, and the three skills.sh audits.</p>
        {skill ? <>
          <p><a href={`${skill.repository}/blob/${skill.commit}/${skill.skill_path}`}>Pinned Caveman skill source</a> · {artifactLink('skill.json', 'Application record (JSON)')} · {artifactLink('caveman-system.txt', 'Exact system instruction')}.</p>
          <p>{skill.application} Review: {skill.review.mode}.</p>
          <details><summary>Skill artifact hashes</summary><p>Commit: <code>{skill.commit}</code><br />Raw artifact SHA-256: <code>{skill.artifact_sha256}</code><br />Applied system instruction SHA-256: <code>{skill.system_sha256}</code></p></details>
        </> : <p>The pinned application record is not available in this snapshot. This page does not infer that the skill was applied.</p>}
        <p>This is exploratory n=4 boards per size, with one run per condition. It cannot isolate a causal benefit from the style instruction. Any output-token or latency difference describes this sample; it is not a measured general saving.</p>
        <p>The baseline reported {reportedInputLengths(baseline)} input tokens per request; Caveman reported {reportedInputLengths(caveman)}. Adding the skill lengthened the input, so a shorter output does not by itself establish a net token saving. Baseline requests ran first, followed by Caveman, one request at a time. Run order was not counterbalanced; accumulated prefix-cache state and host memory pressure were uncontrolled.</p>
      </Section>

      <Section id="ollama-runtime" title="The local runner is part of the result">
        <DataTable caption="Recorded local runtime identity and requested generation controls" headers={['Measure', 'Saved value']} rows={[
          ['Model tag', data.runtime.model], ['Model digest', <code>{data.runtime.digest}</code>],
          ['Reported model size / family', `${data.runtime.details.parameter_size} · ${data.runtime.details.family}`],
          ['Reported quantization / format', `${data.runtime.details.quantization_level} · ${data.runtime.details.format}`],
          ['Runner / compatible server version', `${data.runtime.details.runner} · ${data.runtime.server_version}`],
          ['Transport', data.runtime.transport], ['Machine platform', `${data.runtime.os} · ${data.runtime.machine_architecture}`],
          ['Thinking requested', String(data.protocol.think)], ['Output token limit requested', data.protocol.num_predict.toLocaleString()],
          ['Context length requested', data.protocol.num_ctx.toLocaleString()], ['Temperature / seed requested', `${data.protocol.temperature} / ${data.protocol.seed}`],
          ['Request timeout', `${data.protocol.timeout_seconds} s`],
          ['Keep-alive sent in the saved requests', '10m'],
        ]} />
        <p>{data.protocol.reasoning_control_note}</p>
        <p>{artifactLink('runtime-audit.json', 'Completion and host-condition audit (JSON)')} separates the request receipts from historical host observations. Those observations were not captured for every request. The settings above describe this run; later context-size or unloading policies do not change its recorded conditions.</p>
        <p>Reported provider inference fee: <strong>${data.costs.provider_fee_usd.toFixed(2)}</strong>. {data.costs.note} {data.costs.local_total_cost_usd === null ? 'Total local cost is unknown.' : `Recorded local total: $${data.costs.local_total_cost_usd.toFixed(2)}.`}</p>
      </Section>

      <Section id="ollama-method" title="Frozen inputs, bounded conclusions">
        <p>The plan selects one board from each size × singleton-status × search-tier cell of the existing image-panel subset: four boards each at 5×5, 7×7 and 9×9. Each condition gets one fresh image request per board, the same regional Queens rules, no solving tools, no repair turns, and no retry. JSON is requested in the prompt rather than enforced by the server.</p>
        <ul>{data.limitations.map(item => <li key={item}>{item}</li>)}</ul>
        <div className="next-actions">{artifactLink('plan.json', 'Frozen plan (JSON)')}{artifactLink('prompt-template.txt', 'Exact prompt template')}<a href="#/queens-rules">Regional Queens rules</a><a href="#/earlier-generations">Earlier image results</a></div>
      </Section>
    </main>
  </div></>
}
