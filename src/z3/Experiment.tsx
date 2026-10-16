import { useState } from 'react'
import { CDCLPlayer } from './CDCLPlayer'
import { ConstraintBoard } from './ConstraintBoard'
import { board, varOf, type Z3Data } from './data'
import { EngineTag, Figure, Lit, Unavailable } from './format'
import { runCdcl, validateEvents, type KernelRun } from './kernel'
import type { BookUi, ChapterProps } from './ui'

type NewRun = KernelRun & { failures: string[]; withBlocker: boolean; preferences: number[]; sources: string[][]; ms: number }

function Sandbox({ data, ui }: { data: Z3Data; ui: BookUi }) {
  const { existence, blocked } = data
  const [preferences, setPreferences] = useState<number[]>([])
  const [withBlocker, setWithBlocker] = useState(false)
  const [run, setRun] = useState<NewRun | null>(null)
  const original = existence.clauses.slice(0, existence.originalClauseCount)
  const blocker = blocked.clauses[blocked.blockerId as number]
  const toggle = (r: number, c: number) => {
    const v = varOf(r, c)
    setPreferences(previous => previous.includes(v) ? previous.filter(p => p !== v) : previous.length >= 7 ? previous : [...previous, v])
  }
  const start = () => {
    const initial = [...original.map(c => c.lits), ...(withBlocker ? [blocker.lits] : [])]
    const t0 = performance.now()
    const result = runCdcl(initial, 49, preferences)
    const ms = performance.now() - t0
    const failures = validateEvents(result.clauses, initial.map((_, i) => i), result.events, 49)
    const sources = result.clauses.map((_, id) => id < original.length ? original[id].sources : withBlocker && id === original.length ? ['blocker'] : [`learned@new-run:${result.events.find(e => e.learnedClauseId === id)?.seq ?? '?'}`])
    setRun({ ...result, failures, withBlocker, preferences: [...preferences], sources, ms })
  }
  const recordedEvents = withBlocker ? null : existence.events.length
  const count = (kind: string) => run ? run.events.filter(e => e.kind === kind).length : 0
  return <Figure label="Figure E.1 · New run" title="Your decisions, a fresh run" tag={<EngineTag kind="new-run" />} className="z3-figure--player">
    <div className="z3-figure-body">
      <div className="z3-stage z3-stage--small">
        <ConstraintBoard regions={board.regions} interactive onSelect={toggle} label="Activate cells to add them, in order, to your decision preferences. Activate again to remove." mark={(r, c) => { const i = preferences.indexOf(varOf(r, c)); return i >= 0 ? { highlight: true, badge: String(i + 1) } : undefined }} />
      </div>
      <div className="z3-explain">
        <p>Pick up to seven cells. Whenever the kernel must decide, it sets your first unassigned preferred cell true; after that it falls back to the lowest-numbered open cell, as in the recorded run. Learning may later make your choices false, and the run will respect that.</p>
        <p className="z3-mini-label">Preferences: {preferences.length ? preferences.map((v, i) => <span key={v}>{i > 0 && ' → '}<Lit lit={v} /></span>) : 'none (this reproduces the recorded run)'}</p>
        <label className="z3-toggle"><input type="checkbox" checked={withBlocker} onChange={event => setWithBlocker(event.target.checked)} /> Add the blocking clause B<sub>M</sub> (ask for a second solution)</label>
        <div className="z3-board-actions">
          <button type="button" className="z3-button z3-button--primary" onClick={start}>Run the reference kernel</button>
          <button type="button" className="z3-button" onClick={() => { setPreferences([]); setRun(null) }}>Clear</button>
        </div>
        {run && <div className="z3-run-summary" role="status">
          <p><strong>{run.truncated ? 'Stopped (event limit)' : run.model ? 'SAT' : 'UNSAT'}</strong> after {run.events.length} events: {count('decide')} decisions, {count('conflict')} conflicts, {run.learnedIds.length} learned clauses, in {run.ms.toFixed(1)} ms in this browser.</p>
          <p>{run.failures.length === 0 ? 'Browser re-check passed: every reason was unit at enqueue, every conflict clause false, every resolvent recomputed, every backjump restored the trail.' : `Browser re-check found ${run.failures.length} problem(s): ${run.failures.slice(0, 3).join('; ')}`}</p>
          {!run.withBlocker && !run.preferences.length && recordedEvents !== null && <p>With no preferences this run matches the recorded {recordedEvents}-event trace{run.events.length === recordedEvents ? '' : ' (length differs; please report this)'}.</p>}
          <p className="z3-fineprint">Learned clauses of a new run are not checked with Z3; only the recorded runs carry build-time entailment checks.</p>
        </div>}
      </div>
    </div>
    {run && <CDCLPlayer ui={ui} events={run.events} clauseOf={id => ({ lits: run.clauses[id], sources: run.sources[id] })} originalCount={original.length} runLabel="New-run event" eventTableCaption="Every event of your new run" />}
  </Figure>
}

export function Experiment({ ui, data }: ChapterProps) {
  const { Section } = ui
  return <Section id="z3-experiment" label="Open the experiment" title="Fork the reference kernel">
    <p className="lead">The recorded runs never change. Here you start a new one, from your own decisions, with the same small kernel compiled into this page.</p>
    <p>This is a new run, not a continuation of a recorded one and not Z3. It uses the same 513 pairwise clauses and the same policies as Chapter 4: full clause scans, first-UIP learning, asserting backjumps, no restarts.</p>
    {data ? <Sandbox data={data} ui={ui} /> : <Unavailable what="The experiment" />}
  </Section>
}
