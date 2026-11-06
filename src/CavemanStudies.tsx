import type { BookUi } from './ollamaEvidence'
import { compareArms, isMatchedCohort } from './localQwenMath'
import { armName, defaultTariff, localArtifact, useLocalStudies, type LocalIndex, type LocalStudy } from './localQwenEvidence'
import { usePricing } from './localPricing'
import './ollama-comparison.css'

/** Count original outcomes and retain both observed and planned denominators. */
function arm(study: LocalStudy, treatment: string) {
  const rows = study.rows.filter(row => row.treatment === treatment)
  const recorded = rows.filter(row => row.state === 'recorded')
  return {
    recorded: recorded.length,
    planned: rows.length,
    strict: recorded.filter(row => row.strict_correct).length,
    format: recorded.filter(row => row.format_only_correct).length,
  }
}

const studyLink = (study: LocalStudy) => `#/local-qwen/study/${study.id}`
const usd = (value: number | null) => value === null ? 'Usage incomplete' : `$${value.toFixed(6)}`

/** Draw strict and format-only segments over a shared planned-attempt scale. */
function SamplingBars({ study }: { study: LocalStudy }) {
  return <div className="cv-outcome-group">
    <h3><a href={studyLink(study)}>Round {study.round}</a></h3>
    {['baseline', 'caveman'].map(treatment => {
      const count = arm(study, treatment)
      return <div className="cv-outcome-row" key={treatment}>
        <span>{armName(treatment)}</span>
        <div className="cv-outcome-bar cv-study-track" aria-hidden="true">
          <span className="cv-strict" style={{ width: `${100 * count.strict / count.planned}%` }} />
          <span className="cv-extracted" style={{ width: `${100 * count.format / count.planned}%` }} />
        </div>
        <small>{count.strict}/{count.recorded} strict · {count.format} format only</small>
      </div>
    })}
  </div>
}

/** Show each assessment separately and link its frozen configuration and receipts. */
function StudyOverview({ data, ui }: { data: LocalIndex; ui: BookUi }) {
  const { Section, LocalToc, DataTable } = ui
  const pricing = usePricing()
  const studies = data.studies.filter(study => study.kind !== 'audit')
  const audits = data.studies.filter(study => study.kind === 'audit')
  const sampling = studies.filter(study => study.decoding === 'sampling' && study.status === 'complete' && isMatchedCohort(study.rows))
  const samplingModels = [...new Set(sampling.map(study => study.model))].sort((a, b) => Number(a.includes('27b')) - Number(b.includes('27b')))
  const pricedSampling = pricing.status === 'ready' ? sampling.flatMap(study => {
    const tariff = pricing.data.models.find(model => model.id === defaultTariff(study))
    if (!tariff) return []
    const delta = compareArms(study.rows, tariff.usd_per_million).percentDelta
    return delta === null ? [] : [{ study, delta }]
  }) : []
  const spendScale = Math.max(25, ...pricedSampling.map(({ delta }) => Math.ceil(Math.abs(delta) / 5) * 5))
  return <div className="reading-layout ollama-study">
    <LocalToc items={[
      { id: 'cv-sampling', label: 'Sampling rounds' },
      { id: 'cv-conditions', label: 'All conditions' },
      { id: 'cv-spend', label: 'Hosted cost scenarios' },
      { id: 'cv-methods', label: 'Limits and original pilot' },
    ]} />
    <main className="reading-column" id="main-content">
      <Section id="cv-sampling" title="Strict results vary by model and round">
        <p className="lead">Caveman changed the strict score in different directions. In the third sampling round, Qwen 9B went from 9/12 to 7/12 strict, while Qwen 27B went from 10/12 to 12/12. For 27B, both arms solved all twelve boards after format recovery. In round two, baseline solved twelve boards after format recovery and Caveman solved nine.</p>
        <p>Snapshot captured <time dateTime={data.captured_utc}>{new Date(data.captured_utc).toISOString().slice(0, 10)}</time>. It covers {data.studies.length} frozen conditions, {data.studies.reduce((total, study) => total + study.recorded, 0)} primary receipts including selected audits, and {data.studies.reduce((total, study) => total + study.rows.filter(row => row.rescue).length, 0)} separate rescues.</p>
        <figure className="cv-figure">
          <figcaption><strong>Same legacy boards, separate 24,576-token sampling rounds</strong></figcaption>
          <div className="cv-legend"><span><i className="cv-strict" />Strict correct</span><span><i className="cv-extracted" />Correct after format recovery</span></div>
          <div className="cv-study-rounds">{samplingModels.map(model => <div key={model}>
            <h3><code>{model}</code></h3>
            {sampling.filter(study => study.model === model).sort((a, b) => a.round - b.round).map(study => <SamplingBars key={study.id} study={study} />)}
          </div>)}</div>
        </figure>
      </Section>
      <Section id="cv-conditions" title="Every saved condition, with its own denominator">
        <p>Fresh1 includes schema reminder and neutral control arms. The schema reminder changes the prompt. The neutral control adds system text of a different length from Caveman. The shadow detector observes repetition and allows generation to continue.</p>
        <DataTable caption="Original outcomes by arm · strict / recorded, format only, recorded / planned"
          headers={['Study', 'Baseline', '+ Caveman', 'Schema reminder', 'Neutral control', 'Coverage']}
          rows={studies.map(study => [
            <a href={studyLink(study)}>{study.label}</a>,
            ...['baseline', 'caveman', 'schema', 'neutral'].map(treatment => {
              const count = arm(study, treatment)
              return count.planned ? <>{count.strict}/{count.recorded} strict<br /><small>{count.format} format only · {count.recorded}/{count.planned} recorded</small></> : '—'
            }),
            study.status === 'complete' ? 'Complete' : isMatchedCohort(study.rows) ? 'Partial · matched recorded boards' : 'Partial · unmatched arms',
          ])} />
        <p>Pending calls carry no scored outcome. Selected no-stop reruns cover previously interrupted calls and remain separate from the original attempts.</p>
        <ul>{audits.map(study => <li key={study.id}><a href={studyLink(study)}>{study.label}</a> · {study.recorded} selected reruns</li>)}</ul>
      </Section>
      <Section id="cv-spend" title="Reprice the recorded attempts">
        <p>Estimates apply the saved hosted tariffs to local input and generated tokens, including thinking. They include unsuccessful original calls. The 4B scenario uses the Flash tariff as a proxy. Separate rescue and audit costs are available in the linked study views.</p>
        {pricing.status === 'ready' ? <>
          {pricedSampling.length > 0 && <figure className="cv-figure">
            <figcaption><strong>Spend change by sampling round</strong><p>One-shot Caveman spend relative to baseline. Bars share a scale from −{spendScale}% to +{spendScale}%.</p></figcaption>
            {pricedSampling.map(({ study, delta }) => {
              const width = Math.abs(delta) / spendScale * 50
              return <div className="cv-bridge-row" key={study.id}>
                <a href={studyLink(study)}>{study.label}</a>
                <div className="cv-bridge-track" aria-hidden="true"><span
                  className={delta < 0 ? 'cv-saving-bar' : 'cv-increase-bar'}
                  style={{ left: `${delta < 0 ? 50 - width : 50}%`, width: `${width}%` }} /></div>
                <span className="cv-change">{delta > 0 ? '+' : ''}{delta.toFixed(2)}%</span>
              </div>
            })}
          </figure>}
          <DataTable caption="Baseline and Caveman only · original estimated USD"
            headers={['Study / tariff', 'Baseline', '+ Caveman', 'Estimated spend change']}
            rows={studies.map(study => {
              const tariff = pricing.data.models.find(model => model.id === defaultTariff(study))
              const cost = tariff && compareArms(study.rows, tariff.usd_per_million)
              return [
                <><a href={studyLink(study)}>{study.label}</a>{tariff && <><br /><small>{tariff.id}{study.model.includes(':4b') ? ' · proxy' : ''}</small></>}</>,
                cost?.baseline.usage.attemptCount ? usd(cost.baseline.oneShotCostUsd) : '—',
                cost?.caveman.usage.attemptCount ? usd(cost.caveman.oneShotCostUsd) : '—',
                !cost ? 'No saved tariff' : !isMatchedCohort(study.rows) ? 'Withheld · unmatched recorded boards'
                  : cost.percentDelta === null ? 'Unavailable · incomplete usage or zero baseline cost'
                  : `${cost.percentDelta > 0 ? '+' : ''}${cost.percentDelta.toFixed(2)}%${study.status === 'partial' ? ' · matched recorded subset' : ''}`,
              ]
            })} />
          <p className="cv-note">Client-stopped streams can lack final usage. These scenarios exclude cache discounts, image accounting differences and fees. <a href={`${import.meta.env.BASE_URL}evidence/local-qwen-pricing.json`}>Saved tariff evidence</a>.</p>
        </> : <p role="status">{pricing.status === 'loading' ? 'Loading saved tariffs…' : 'Saved tariffs could not be loaded.'}</p>}
      </Section>
      <Section id="cv-methods" title="Read each result under its own protocol">
        <p>The study links identify model digest, board set, budget, decoding, stopping policy and receipts. Repeated boards across rounds describe variability on those boards. Combining the rounds or mixing them with greedy runs, fresh1 or active loop-stop would obscure differences in the test conditions.</p>
        <p>The October 28 pilot preserves its twelve matched boards, token and timing analysis, and original cost calculator. Its baseline ran first, with uncontrolled cache and memory state.</p>
        <div className="next-actions"><a href="#/caveman-summary/pilot">Original 4B Caveman pilot</a><a href="#/local-qwen">Full local open-weight assessments</a><a href={localArtifact(data.manifest)}>Snapshot file hashes</a></div>
      </Section>
    </main>
  </div>
}

/** Read the current saved snapshot for the cross-study Caveman overview. */
export default function CavemanStudies({ ui }: { ui: BookUi }) {
  const state = useLocalStudies()
  const { PageHero, Callout } = ui
  return <>
    <PageHero trail="Model generations / Caveman comparison" title="Caveman across the local studies" deck="Follow strict correctness, format recovery and estimated hosted cost across frozen local model conditions." />
    {state.status === 'ready' ? <StudyOverview data={state.data} ui={ui} />
      : <main className="reading-column ollama-standalone" id="main-content">
        {state.status === 'loading' ? <p role="status">Loading saved local assessments…</p>
          : <Callout tone="stop" title="The saved local assessments could not be loaded."><p>Reload this page or open the <a href="#/caveman-summary/pilot">original 4B Caveman pilot</a>.</p></Callout>}
      </main>}
  </>
}
