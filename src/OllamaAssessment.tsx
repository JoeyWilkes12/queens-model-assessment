import { type ReactNode } from 'react'
import { useSavedOllamaStudy, evidenceUrl, measurement, reportedInputLengths, treatmentName, outcomeNames, type BookUi, type ResultRow } from './ollamaEvidence'

/** Link only to a relative artifact within this saved study bundle. */
export function artifactLink(path: string, label: string, context?: string): ReactNode {
  if (!/^[a-zA-Z0-9][a-zA-Z0-9/_.-]*$/.test(path) || path.split('/').includes('..')) return <span>{label} unavailable</span>
  return <a href={evidenceUrl(path)} aria-label={context ? `${context}: ${label}` : undefined}>{label}</a>
}

/** Expose the exact saved input, returned output, and two separate grades for one request. */
export function receiptLinks(row: ResultRow): ReactNode {
  if (row.state === 'started_unrecorded') return <>Result unrecorded · {artifactLink(`receipts/${row.call_id}/started.json`, 'Start marker', row.call_id)}</>
  if (!row.receipt) return 'Not run'
  const directory = row.receipt.slice(0, row.receipt.lastIndexOf('/') + 1)
  return <>{artifactLink(`${directory}request.json`, 'Request', row.call_id)} · {artifactLink(`${directory}response.json`, 'Response', row.call_id)} · {artifactLink(`${directory}grade.json`, 'Strict grade', row.call_id)} · {artifactLink(`${directory}diagnostic.json`, 'Extraction grade', row.call_id)} · {artifactLink(row.receipt, 'Metadata', row.call_id)}</>
}

/** Render a static local-model study using the book's existing reading and table components. */
export function OllamaAssessment({ ui }: { ui: BookUi }) {
  const { PageHero, LocalToc, Section, Callout, DataTable } = ui
  const saved = useSavedOllamaStudy()

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
        <p><a href="#/caveman-summary">Read the Caveman comparison summary</a> or <a href="#/local-open-models/configuration">inspect the shared model configuration</a>. Every receipt has a direct link to the same board with the other condition.</p>
        <p>Each board link opens the exact image supplied to the model. Request, response, strict grade, extraction grade, and runtime metadata stay separate. The page reads committed evidence; it never calls a model. Runtime-reported generated tokens include thinking and final-answer tokens, not just the visible final answer.</p>
        <p>For a budget-limited response, “No final answer” means no validated final placement was returned within the cap. It does not label an unfinished attempt as an invalid completed solution.</p>
        {data.rows.length ? <DataTable caption="Local model request ledger with raw JSON receipts" headers={['Request / treatment', 'Board image', 'Outcome', 'Strict correct', 'Valid after extraction', 'Wall time', 'Input tokens (reported)', 'Generated tokens (reported)', 'Evidence (JSON)']} rows={data.rows.map(row => [
          <><a href={`#/local-open-models/receipt/${row.call_id}`}><code>{row.call_id}</code></a><br />{treatmentName(row.treatment)}<br /><a href={`#/local-open-models/receipt/${row.treatment === 'baseline' ? 'caveman' : 'baseline'}_${row.board_id}`}>Compare {row.treatment === 'baseline' ? 'with Caveman' : 'without Caveman'}</a></>, artifactLink(row.image, `${row.board_id} · ${row.size}×${row.size}`),
          <>{outcomeNames[row.outcome] ?? row.outcome.replace(/_/g, ' ')}{row.finish_reason ? <><br /><small>Finish: {row.finish_reason}</small></> : null}</>,
          row.state === 'not_run' ? 'Not run' : row.state === 'started_unrecorded' ? 'Unrecorded' : row.strict_correct ? 'Yes' : row.finish_reason === 'length' ? 'No final answer' : 'No',
          row.state === 'not_run' ? 'Not run' : row.state === 'started_unrecorded' ? 'Unrecorded' : row.rule_valid_after_extraction ? 'Yes' : row.finish_reason === 'length' ? 'No final answer' : 'No',
          measurement(row.elapsed_seconds, 's'), measurement(row.input_tokens), measurement(row.output_tokens), receiptLinks(row),
        ])} /> : <p>No requests are scheduled in this saved snapshot.</p>}
      </Section>

      <Section id="ollama-caveman" title="The paired Caveman comparison">
        <p><a href="#/caveman-summary">Caveman summary: correctness, token use and every matched pair</a>.</p>
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
