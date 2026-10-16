import { useState } from 'react'
import { evidencePath, FILES, formatCount, type Z3Check, type Z3Receipts, type Z3Run } from './data'
import { EngineTag, Figure } from './format'
import type { BookUi } from './ui'

const PHASES = [
  { id: 'simplify', label: 'Simplify', detail: 'rewriting, value propagation, equation solving' },
  { id: 'cardinality', label: 'Counting → Boolean', detail: 'lia2card, pb2bv, card2bv: compile sums to Boolean structure' },
  { id: 'bit-level', label: 'Bit level', detail: 'bit-blast, AIG' },
  { id: 'sat-core', label: 'SAT core', detail: 'CDCL over clauses' },
  { id: 'smt-core', label: 'SMT core', detail: 'CDCL(T) with theory solvers' },
] as const

const QUERY_LABEL: Record<Z3Check['query'], string> = { first: 'First check', 'incremental-blocked': 'Same solver + blocker', 'fresh-blocked': 'Fresh solver + blocker' }
const BOARD_LABEL = { five: '5×5', seven: '7×7', nine: '9×9' } as const

/** D/C/P as defined in the design: SAT P = binary + n-ary; SMT P = reported total. */
export function dcp(check: Z3Check) {
  const s = check.statistics
  const sat = 'sat decisions' in s || 'sat conflicts' in s || 'sat propagations 2ary' in s
  if (sat) {
    const p = 'sat propagations 2ary' in s || 'sat propagations nary' in s ? (s['sat propagations 2ary'] ?? 0) + (s['sat propagations nary'] ?? 0) : null
    return { family: 'sat' as const, d: s['sat decisions'] ?? null, c: s['sat conflicts'] ?? null, p, keys: ['sat decisions', 'sat conflicts', 'sat propagations 2ary + sat propagations nary'] }
  }
  if ('decisions' in s || 'conflicts' in s) return { family: 'smt' as const, d: s.decisions ?? null, c: s.conflicts ?? null, p: s.propagations ?? null, keys: ['decisions', 'conflicts', 'propagations'] }
  return { family: 'none' as const, d: null, c: null, p: null, keys: [] }
}

const shown = (value: number | null) => value === null ? 'not reported' : formatCount(value)

export function CheckSummary({ run, queries }: { run: Z3Run; queries: Z3Check['query'][] }) {
  return <div className="z3-check-cards">{run.checks.filter(c => queries.includes(c.query)).map(c => {
    const m = dcp(c)
    return <article key={c.query} className="z3-check-card">
      <span className="z3-mini-label">{QUERY_LABEL[c.query]}</span>
      <strong className={`z3-result z3-result--${c.result}`}>{c.result.toUpperCase()}</strong>
      <p className="z3-check-engine">Engine: <strong>{c.engine.label}</strong></p>
      <dl className="z3-dcp">
        <div><dt>Decisions</dt><dd>{shown(m.d)}</dd></div>
        <div><dt>Conflicts</dt><dd>{shown(m.c)}</dd></div>
        <div><dt>Propagations</dt><dd>{shown(m.p)}</dd></div>
      </dl>
      <p className="z3-fineprint">{m.family === 'none' ? 'No search counters in this receipt.' : `Raw counters: ${m.keys.join(' · ')}.`}{c.countersCumulativeWithFirst ? ' These counters are cumulative and include the first check.' : ''}</p>
    </article>
  })}</div>
}

const metric = (line: string) => {
  const exprs = line.match(/:num-exprs (\d+)/)?.[1]
  const elim = line.match(/:solve-eqs-elim-vars (\d+)/)?.[1]
  return exprs ? `${exprs} expressions after` : elim ? `${elim} variables eliminated` : null
}

export function EngineFigure({ receipts, ui }: { receipts: Z3Receipts; ui: BookUi }) {
  const { DataTable } = ui
  const [boardId, setBoardId] = useState<'five' | 'seven' | 'nine'>('seven')
  const [query, setQuery] = useState<Z3Check['query']>('first')
  const [mode, setMode] = useState<Z3Run['mode']>('default')
  const boardData = receipts.boards.find(b => b.id === boardId)!
  const run = boardData.runs.find(r => r.mode === mode)!
  const check = run.checks.find(c => c.query === query)!
  const stagePhases = new Set(check.route.stages.map(s => s.phase))
  const m = dcp(check)
  const satStatus = check.route.lines.join('\n').match(/:vars\s+(\d+)/)?.[1]
  const cells = boardData.size * boardData.size
  const firstLines = new Map<string, string>()
  check.route.lines.forEach(line => { const name = line.match(/^\s*\(([A-Za-z][\w.-]*)/)?.[1]; if (name && !firstLines.has(name)) firstLines.set(name, line) })
  const formulaHash = query === 'first' ? run.formulaSha256 : query === 'incremental-blocked' ? run.blockedFormulaSha256 : run.freshBlockedFormulaSha256
  const standard = m.family === 'smt' ? ['decisions', 'conflicts', 'propagations'] : ['sat decisions', 'sat conflicts', 'sat propagations 2ary', 'sat propagations nary']
  const missing = standard.filter(k => !(k in check.statistics))
  return <Figure label="Figure 9.1 · Recorded receipts" title="Which route did this check take?" tag={<EngineTag kind="z3" version={receipts.z3Version} configuration={run.configuration} />}>
    <div className="z3-controls">
      <div className="z3-segmented" role="radiogroup" aria-label="Board">{(['five', 'seven', 'nine'] as const).map(b => <button type="button" role="radio" aria-checked={boardId === b} key={b} onClick={() => setBoardId(b)}>{BOARD_LABEL[b]}</button>)}</div>
      <div className="z3-segmented" role="radiogroup" aria-label="Query">{(['first', 'incremental-blocked', 'fresh-blocked'] as const).map(q => <button type="button" role="radio" aria-checked={query === q} key={q} onClick={() => setQuery(q)}>{QUERY_LABEL[q]}</button>)}</div>
    </div>
    <details className="z3-disclosure z3-advanced">
      <summary>Advanced: compare the production syntax with PbEq and QF_FD</summary>
      <div className="z3-segmented" role="radiogroup" aria-label="Configuration">{receipts.boards[0].runs.map(r => <button type="button" role="radio" aria-checked={mode === r.mode} key={r.mode} onClick={() => setMode(r.mode)}>{r.mode === 'default' ? 'Production · Solver()' : r.mode === 'fd' ? 'Sum(If) · QF_FD' : 'PbEq · QF_FD'}</button>)}</div>
      <p className="z3-fineprint">{run.syntax}. {run.production ? 'This is the repository solver’s configuration.' : 'Diagnostic configuration, not the production baseline.'}</p>
    </details>
    <p className="z3-engine-verdict"><span className="z3-mini-label">{BOARD_LABEL[boardId]} · {QUERY_LABEL[query]} · {check.result.toUpperCase()}</span><strong>{check.engine.label}</strong></p>
    <ul className="z3-basis">{check.engine.basis.map(b => <li key={b}>{b}</li>)}</ul>
    <ol className="z3-phases" aria-label="Phases observed in this receipt">
      {PHASES.map(p => <li key={p.id} className={stagePhases.has(p.id) ? 'is-on' : ''}><strong>{p.label}</strong><span>{stagePhases.has(p.id) ? 'observed' : 'not observed'}</span></li>)}
    </ol>
    <div className="z3-figure-body">
      <div className="z3-stage">
        <p className="z3-mini-label">Recorded verbose route, in order ({check.route.source})</p>
        {check.route.stages.length ? <ol className="z3-route">
          {check.route.stages.map((s, i) => <li key={i} className={`z3-route-${s.phase}`}><span className="z3-route-phase">{PHASES.find(p => p.id === s.phase)?.label ?? s.phase}</span><code>{s.name}</code>{s.count > 1 && <span className="z3-route-count">{s.count} log entries</span>}{i === check.route.stages.findIndex(stage => stage.name === s.name) && metric(firstLines.get(s.name) ?? '') && <span className="z3-route-metric">{metric(firstLines.get(s.name) ?? '')} (first report)</span>}</li>)}
        </ol> : <p className="z3-unavailable">No verbose output was printed during this check.</p>}
        <div className="z3-lanes">
          <div><span className="z3-mini-label">Board lane</span><strong>{cells} cell variables</strong><span>q<sub>rc</sub>, as in Chapter 1</span></div>
          <div><span className="z3-mini-label">Internal lane</span><strong>{satStatus ? `${satStatus} SAT variables` : 'count not printed'}</strong><span>{satStatus ? 'Internal variables. The receipt does not map them to cells, so none is given board meaning here.' : check.statistics['mk bool var'] ? `${formatCount(check.statistics['mk bool var'])} Boolean variables created (mk bool var); no mapping to cells recorded.` : 'No mapping to cells is recorded.'}</span></div>
        </div>
      </div>
      <div className="z3-explain">
        <dl className="z3-dcp z3-dcp--large">
          <div><dt>Decisions</dt><dd>{shown(m.d)}</dd></div>
          <div><dt>Conflicts</dt><dd>{shown(m.c)}</dd></div>
          <div><dt>Propagations</dt><dd>{shown(m.p)}</dd></div>
        </dl>
        {missing.length > 0 && <p className="z3-fineprint">Not reported in this receipt: {missing.join(', ')}. Absent means unavailable, not zero.</p>}
        {check.countersCumulativeWithFirst && <p className="z3-fineprint">This solver keeps one statistics object across checks, so these counters include the first check.</p>}
        <dl className="z3-facts">
          <div><dt>Z3</dt><dd>{receipts.z3Version}</dd></div>
          <div><dt>Configuration</dt><dd>{run.configuration}</dd></div>
          <div><dt>Partition SHA-256</dt><dd><code>{boardData.partitionSha256}</code></dd></div>
          <div><dt>Formula SHA-256</dt><dd><code>{formulaHash}</code></dd></div>
          <div><dt>Assertions</dt><dd>{run.assertions}{query !== 'first' ? ' + 1 blocking clause' : ''}</dd></div>
          <div><dt>Wall clock</dt><dd>{(check.elapsedSeconds * 1000).toFixed(1)} ms on one machine (not a benchmark)</dd></div>
        </dl>
        <details className="z3-disclosure">
          <summary>All {Object.keys(check.statistics).length} raw counters</summary>
          <DataTable caption={`Raw statistics · ${BOARD_LABEL[boardId]} · ${QUERY_LABEL[query]}`} headers={['Counter', 'Value']} rows={Object.entries(check.statistics).map(([k, v]) => [<code key={k}>{k}</code>, String(v)])} />
        </details>
        <details className="z3-disclosure">
          <summary>Raw verbose lines ({check.route.lines.length})</summary>
          <pre className="z3-pre">{check.route.lines.join('\n') || '(none)'}</pre>
        </details>
        <p className="z3-fineprint">Full receipt: <a href={evidencePath(FILES.receipts)}>z3-receipts.json</a> · recorded {receipts.generatedAt.slice(0, 10)} · Python {receipts.pythonVersion}.</p>
      </div>
    </div>
  </Figure>
}

export function ReceiptSummaryTable({ receipts, ui }: { receipts: Z3Receipts; ui: BookUi }) {
  const { DataTable } = ui
  const cell = (c: Z3Check) => { const m = dcp(c); return `${c.result.toUpperCase()} · ${m.family === 'none' ? 'no search counters' : `D${shown(m.d)}/C${shown(m.c)}/P${shown(m.p)}`} · ${c.engine.label}` }
  return <DataTable caption={`Recorded Z3 execution · Z3 4.16.0 · production configuration (Solver(), default parameters, timeout 30 s)`} headers={['Board', 'First check', 'Same solver + blocker', 'Fresh solver + blocker']} rows={receipts.boards.map(b => {
    const run = b.runs.find(r => r.mode === 'default')!
    return [BOARD_LABEL[b.id], ...run.checks.map(cell)]
  })} />
}

/** Transfer example for DPLL(T). Not part of any Queens run. */
export function ArithmeticInset() {
  const [a, setA] = useState(true)
  const [b, setB] = useState(true)
  const [domain, setDomain] = useState<'reals' | 'integers'>('reals')
  // a ↔ x ≤ 0, b ↔ x ≥ 1. Feasible set as an interval with open/closed ends.
  let lo = -Infinity, hi = Infinity, loOpen = false, hiOpen = false
  if (a) { hi = 0 } else if (domain === 'integers') { lo = 1 } else { lo = 0; loOpen = true }
  if (b) { lo = Math.max(lo, 1); if (lo === 1) loOpen = false } else if (domain === 'integers') { hi = Math.min(hi, 0) } else { if (1 <= hi) { hi = 1; hiOpen = true } }
  const empty = lo > hi || (lo === hi && (loOpen || hiOpen)) || (domain === 'integers' && Math.ceil(lo) > Math.floor(hi))
  const lemma = empty ? (a && b ? '¬a ∨ ¬b' : !a && !b ? 'a ∨ b' : a ? '¬a ∨ b' : 'a ∨ ¬b') : null
  const witness = empty ? null : domain === 'integers' ? (Number.isFinite(hi) ? Math.floor(hi) : Math.ceil(lo)) : (Number.isFinite(lo) && Number.isFinite(hi) ? (lo + hi) / 2 : Number.isFinite(hi) ? hi - 1 : lo + 1)
  const X = (x: number) => 20 + (x + 3) * 40
  const from = Math.max(lo, -3.4), to = Math.min(hi, 4.4)
  return <Figure label="Figure 9.2 · Transfer example" title="When the Boolean answer is not enough" tag={<EngineTag kind="illustration" note="DPLL(T) transfer example; this conflict did not occur in the Queens run" />} className="z3-figure--inset">
    <p>Let a stand for x ≤ 0 and b for x ≥ 1. Propositionally, any of the four truth assignments is consistent. The theory of {domain} decides which can actually happen.</p>
    <div className="z3-controls">
      <label className="z3-toggle"><input type="checkbox" checked={a} onChange={e => setA(e.target.checked)} /> a: x ≤ 0 is {a ? 'true' : 'false'}</label>
      <label className="z3-toggle"><input type="checkbox" checked={b} onChange={e => setB(e.target.checked)} /> b: x ≥ 1 is {b ? 'true' : 'false'}</label>
      <div className="z3-segmented" role="radiogroup" aria-label="Domain of x">{(['reals', 'integers'] as const).map(d => <button key={d} type="button" role="radio" aria-checked={domain === d} onClick={() => setDomain(d)}>{d === 'reals' ? 'x real' : 'x integer'}</button>)}</div>
    </div>
    <svg className="z3-numberline" viewBox="0 0 320 64" role="img" aria-label={empty ? 'No value of x satisfies both atoms.' : `Feasible values exist, for example x = ${witness}.`}>
      <line x1="10" x2="310" y1="34" y2="34" className="z3-nl-axis" />
      {Array.from({ length: 8 }, (_, i) => i - 3).map(x => <g key={x}><line x1={X(x)} x2={X(x)} y1="29" y2="39" className="z3-nl-tick" /><text x={X(x)} y="58" textAnchor="middle" className="z3-nl-label">{x}</text></g>)}
      {!empty && domain === 'reals' && <rect x={X(from)} y="26" width={Math.max(2, X(to) - X(from))} height="16" className="z3-nl-feasible" />}
      {!empty && domain === 'integers' && Array.from({ length: 8 }, (_, i) => i - 3).filter(x => x >= lo && x <= hi).map(x => <circle key={x} cx={X(x)} cy="34" r="6" className="z3-nl-feasible" />)}
      {Number.isFinite(lo) && domain === 'reals' && <circle cx={X(lo)} cy="34" r="5" className={loOpen ? 'z3-nl-open' : 'z3-nl-closed'} />}
      {Number.isFinite(hi) && domain === 'reals' && <circle cx={X(hi)} cy="34" r="5" className={hiOpen ? 'z3-nl-open' : 'z3-nl-closed'} />}
    </svg>
    <p className={`z3-inference${empty ? ' is-bad' : ' is-ok'}`} aria-live="polite">{empty
      ? <>Theory conflict: no {domain === 'reals' ? 'real' : 'integer'} x satisfies this assignment. Arithmetic returns the valid clause <strong>{lemma}</strong> to the Boolean search, which then learns and backjumps exactly as in Chapter 6.</>
      : <>Consistent: for example x = {witness}. {!a && !b && domain === 'reals' ? 'Switch to integers: 0 < x < 1 has no integer solution. Rational feasibility is not integer feasibility.' : ''}</>}</p>
  </Figure>
}
