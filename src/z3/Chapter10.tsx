import { useMemo, useRef, useState, type ReactNode } from 'react'
import { ConstraintBoard, type CellMark } from './ConstraintBoard'
import { board, cellName, formatCount, varOf } from './data'
import { CheckYourself, EngineTag, Figure, Formula, Lede, ReadSource, Term } from './format'
import type { ChapterProps } from './ui'
import {
  ALL_RULES, COUNT_CAP, RULE_KEYS, columnsByRow, countModels, directConflicts, exportFileName,
  pairwiseCnf, productionCounts, smtLib, type CountResult, type ExportForm, type RuleKey, type Rules,
} from './workbench'

const n = board.size
const FIGURE_ID = 'z3-workbench-figure'
const meta = { boardLabel: board.label, partitionSha256: board.partitionSha256 }

const RULES: { key: RuleKey; label: string; formula: ReactNode }[] = [
  { key: 'rows', label: 'One per row', formula: <>Σ<sub>c</sub> q<sub>rc</sub> = 1</> },
  { key: 'columns', label: 'One per column', formula: <>Σ<sub>r</sub> q<sub>rc</sub> = 1</> },
  { key: 'regions', label: 'One per region', formula: <>Σ<sub>v∈R</sub> q<sub>v</sub> = 1</> },
  { key: 'touching', label: 'No touching', formula: <>¬q<sub>u</sub> ∨ ¬q<sub>v</sub></> },
]
const ruleLabel = (key: RuleKey) => RULES.find(r => r.key === key)!.label

const FORMS: { id: ExportForm; label: string }[] = [
  { id: 'production', label: 'Production encoding' },
  { id: 'pairwise', label: 'Pairwise CNF' },
]

const plural = (count: number, one: string, many = `${one}s`) => `${formatCount(count)} ${count === 1 ? one : many}`

/** "exactly 1 placement" or "at least 100,000 placements". */
export function countWords(result: CountResult) {
  if (result.status === 'unknown') return 'not decided: the counter reached its node limit'
  return result.exact ? `exactly ${plural(result.count, 'placement')}` : `at least ${plural(result.count, 'placement')}`
}

function witnessWords(witness: number[] | null) {
  if (!witness) return null
  if (!witness.length) return 'the empty board, with no queen at all'
  const columns = columnsByRow(witness, n)
  if (columns) return `columns by row [${columns.join(', ')}]`
  const names = witness.map(v => cellName(v))
  return `${plural(witness.length, 'queen')}: ${names.slice(0, 10).join(', ')}${names.length > 10 ? `, and ${names.length - 10} more` : ''}`
}

function summary(result: CountResult) {
  if (result.status === 'unknown') return 'Not decided.'
  if (result.status === 'unsat') return 'UNSAT: no placement satisfies the active rules and fixed cells.'
  return `SAT: ${countWords(result)}. Witness: ${witnessWords(result.witness)}.`
}

function Workbench({ data, rules, setRules, fixed, setFixed, action, setAction }: {
  data: ChapterProps['data']
  rules: Rules; setRules: (rules: Rules) => void
  fixed: Map<number, boolean>; setFixed: (fixed: Map<number, boolean>) => void
  action: string; setAction: (action: string) => void
}) {
  const [form, setForm] = useState<ExportForm>('production')
  // The status names the exact text it describes, so it disappears when the export changes.
  const [exportNote, setExportNote] = useState<{ text: string; source: string } | null>(null)
  const sourceRef = useRef<HTMLPreElement>(null)

  const result = useMemo(() => countModels(board.regions, rules, fixed), [rules, fixed])
  const cnf = useMemo(() => pairwiseCnf(board.regions, rules, fixed), [rules, fixed])
  const production = productionCounts(board.regions, rules, fixed)
  const reasons = result.status === 'unsat' ? directConflicts(board.regions, rules, fixed) : []
  const smt = useMemo(() => smtLib(form, board.regions, rules, fixed, meta), [form, rules, fixed])
  const fileName = exportFileName(form, rules, fixed, n)
  const lines = smt.trimEnd().split('\n').length
  const witness = new Set(result.witness ?? [])
  const intact = RULE_KEYS.every(k => rules[k]) && fixed.size === 0
  const partitions = rules.rows || rules.columns || rules.regions
  const z3Model = data?.receipts.boards.find(b => b.id === 'seven')?.runs.find(r => r.mode === 'default')?.modelColumns
  const ours = columnsByRow(result.witness, n)

  const toggleRule = (key: RuleKey, on: boolean) => {
    setRules({ ...rules, [key]: on })
    setAction(`${ruleLabel(key)} ${on ? 'on' : 'off'}.`)
  }
  const cycle = (r: number, c: number) => {
    const v = varOf(r, c)
    const next = new Map(fixed)
    const was = fixed.get(v)
    if (was === undefined) next.set(v, true)
    else if (was) next.set(v, false)
    else next.delete(v)
    setFixed(next)
    setAction(`r${r}c${c} ${was === undefined ? 'fixed as a queen' : was ? 'fixed empty' : 'released'}.`)
  }
  const mark = (r: number, c: number): CellMark => {
    const v = varOf(r, c)
    const f = fixed.get(v)
    if (f === true) return { value: true, fixed: true, badge: '=1', label: 'fixed queen (your assumption)' }
    if (f === false) return { value: false, fixed: true, badge: '=0', label: 'fixed empty (your assumption)' }
    if (witness.has(v)) return { value: true, label: 'queen in the witness' }
    return { label: result.status === 'sat' ? 'empty in the witness' : 'open, not fixed' }
  }

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(smt)
      setExportNote({ text: `Copied ${lines} lines (${fileName}) to the clipboard.`, source: smt })
    } catch {
      const pre = sourceRef.current
      const selection = window.getSelection()
      if (pre && selection) { const range = document.createRange(); range.selectNodeContents(pre); selection.removeAllRanges(); selection.addRange(range) }
      setExportNote({ text: 'This browser blocked clipboard access. The source is now selected; copy it with the keyboard.', source: smt })
    }
  }
  const download = () => {
    const url = URL.createObjectURL(new Blob([smt], { type: 'text/plain;charset=utf-8' }))
    const link = document.createElement('a')
    link.href = url
    link.download = fileName
    document.body.append(link)
    link.click()
    link.remove()
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
    setExportNote({ text: `Downloaded ${fileName}.`, source: smt })
  }

  const statusWord = result.status === 'sat' ? 'SAT' : result.status === 'unsat' ? 'UNSAT' : 'UNDECIDED'
  return <Figure id={FIGURE_ID} label="Figure 10.1 · Manipulation" title="Switch rules, fix cells, count the placements" tag={<EngineTag kind="counter" note={`every model up to ${formatCount(COUNT_CAP)}`} />}>
    <div className="z3-figure-body z3-wb-body">
      <div className="z3-stage">
        <fieldset className="z3-wb-rules">
          <legend>Rules in the formula</legend>
          {RULES.map(rule => <label key={rule.key} className={`z3-wb-rule${rules[rule.key] ? ' is-on' : ''}`}>
            <input type="checkbox" checked={rules[rule.key]} onChange={event => toggleRule(rule.key, event.target.checked)} />
            <span className="z3-wb-rule-name">{rule.label}</span>
            <span className="z3-wb-rule-formula" aria-hidden="true">{rule.formula}</span>
          </label>)}
        </fieldset>
        <div className="z3-wb-board">
          <ConstraintBoard regions={board.regions} interactive onSelect={cycle} mark={mark} label="7 by 7 workbench board. Activate a cell to cycle it: open, fixed queen, fixed empty, open. Arrow keys move between cells." />
        </div>
        <p className="z3-hint">Activate a cell to cycle it: open → fixed queen (<span className="z3-wb-key">=1</span>) → fixed empty (<span className="z3-wb-key">=0</span>) → open. Unframed queens are the witness.</p>
        <div className="z3-board-actions">
          <button type="button" className="z3-button" disabled={!fixed.size} onClick={() => { setFixed(new Map()); setAction('Fixed cells cleared.') }}>Clear fixed cells{fixed.size ? ` (${fixed.size})` : ''}</button>
          <button type="button" className="z3-button" disabled={RULE_KEYS.every(k => rules[k])} onClick={() => { setRules({ ...ALL_RULES }); setAction('All four rules on.') }}>All rules on</button>
        </div>
      </div>
      <div className="z3-explain">
        <p className="z3-wb-verdict"><span className={`z3-result z3-result--${result.status}`}>{statusWord}</span><span>{result.status === 'sat' ? 'a placement exists' : result.status === 'unsat' ? 'no placement exists' : 'the counter stopped before deciding'}</span></p>
        <div className="z3-counters z3-wb-counters">
          <div><span>Placements</span><strong>{result.status === 'unknown' ? '?' : result.exact ? formatCount(result.count) : `≥ ${formatCount(result.count)}`}</strong></div>
          <div><span>Variables</span><strong>{cnf.variables}</strong></div>
          <div><span>CNF clauses</span><strong>{formatCount(cnf.clauses.length)}</strong></div>
          <div><span>Z3 assertions</span><strong>{production.assertions}</strong></div>
        </div>
        <p className="z3-wb-line"><strong>{countWords(result).replace(/^./, s => s.toUpperCase())}.</strong>{result.capped && <> The counter stops at {formatCount(COUNT_CAP)}; the true number is larger.</>}</p>
        {result.status === 'sat' && <p className="z3-wb-line"><span className="z3-mini-label">Witness · first model found</span>{witnessWords(result.witness)}</p>}
        {intact && z3Model && <p className={`z3-wb-agree${ours && ours.join() === z3Model.join() ? ' is-ok' : ' is-bad'}`}>{ours && ours.join() === z3Model.join()
          ? <>Agrees with Z3: the recorded Z3 model in Chapter 9 has the same columns, and its blocked check was UNSAT, so both find exactly one placement.</>
          : <>Does not match the recorded Z3 model [{z3Model.join(', ')}]. Please report this.</>}</p>}
        {reasons.length > 0 && <ul className="z3-wb-reasons" aria-label="Why there is no placement">{reasons.slice(0, 3).map(reason => <li key={reason}>{reason}</li>)}</ul>}
        {result.status === 'unsat' && !reasons.length && <p className="z3-wb-line">No two fixed cells clash directly; the search found that no placement extends them.</p>}
        {!partitions && <p className="z3-wb-line">With no row, column or region rule, nothing requires a queen, so any number of queens, including none, can be a model.</p>}
        <p className="z3-fineprint">Pairwise CNF, no auxiliary variables: {RULE_KEYS.map(k => `${k} ${cnf.distinct[k]}`).join(' · ')} · fixed {cnf.distinct.fixed} clauses ({formatCount(cnf.literalOccurrences)} literal occurrences). Production form: {production.equations} equations + {production.implications} implications + {production.fixed} fixed.</p>
        <p className="sr-only" aria-live="polite">{action ? `${action} ${summary(result)}` : ''}</p>
      </div>
    </div>
    <div className="z3-figure-foot">
      <h4>Export the active formula as SMT-LIB</h4>
      <p><Term id="smt-lib">SMT-LIB</Term> is the standard text language that SMT solvers, Z3 among them, read. Both files declare the same 49 Booleans and follow your switches and fixed cells. The production encoding is what the repository solver asserts (Chapter 9); the pairwise CNF is the formula counted above.</p>
      <div className="z3-controls z3-wb-export">
        <div className="z3-segmented" role="radiogroup" aria-label="Export form">
          {FORMS.map(item => <button type="button" role="radio" aria-checked={form === item.id} key={item.id} onClick={() => setForm(item.id)}>{item.label}</button>)}
        </div>
        <div className="z3-wb-export-actions">
          <button type="button" className="z3-button" onClick={copy}>Copy</button>
          <button type="button" className="z3-button z3-button--primary" onClick={download}>Download .smt2</button>
        </div>
      </div>
      <p className="z3-fineprint"><code>{fileName}</code> · {lines} lines · {form === 'production' ? `${production.assertions} assertions` : `${formatCount(cnf.clauses.length)} clauses`} · ends with (check-sat) and (get-model)</p>
      <pre ref={sourceRef} className="z3-pre z3-wb-source" tabIndex={0} aria-label={`SMT-LIB source, ${form === 'production' ? 'production encoding' : 'pairwise CNF'}, ${lines} lines`}>{smt}</pre>
      <p className="z3-wb-export-status" role="status">{exportNote?.source === smt ? exportNote.text : ''}</p>
    </div>
  </Figure>
}

export function Chapter10({ ui, data }: ChapterProps) {
  const { Section } = ui
  const [rules, setRules] = useState<Rules>({ ...ALL_RULES })
  const [fixed, setFixed] = useState<Map<number, boolean>>(() => new Map())
  const [action, setAction] = useState('')
  const drops = useMemo(() => RULE_KEYS.map(key => ({ key, result: countModels(board.regions, { ...ALL_RULES, [key]: false }) })), [])
  const dropped = (key: RuleKey) => drops.find(d => d.key === key)!.result.count
  const load = (key: RuleKey) => {
    setRules({ ...ALL_RULES, [key]: false })
    setFixed(new Map())
    setAction(`${ruleLabel(key)} dropped; nothing fixed.`)
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    document.getElementById(FIGURE_ID)?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' })
  }
  return <Section id="z3-workbench" label="Chapter 10" title="Workbench: change the rules">
    <Lede>Each rule is one family of conjuncts in F. Switch families off, fix cells yourself, and count the placements that are left.</Lede>
    <Formula spoken="F sub S, A equals the conjunction over the active families f in S of F sub f, and the conjunction over the fixed cells v in A of the literal l sub v, which is q v for a fixed queen and not q v for a fixed empty cell.">
      F<sub>S,A</sub> = ⋀<sub>f ∈ S</sub> F<sub>f</sub> ∧ ⋀<sub>v ∈ A</sub> ℓ<sub>v</sub>,  S ⊆ {"{"}rows, columns, regions, touching{"}"},  ℓ<sub>v</sub> ∈ {"{"}q<sub>v</sub>, ¬q<sub>v</sub>{"}"}
    </Formula>
    <p>Removing a family can only enlarge the set of models, and fixing a cell adds a unit clause, which can only shrink it. Dropping the region rule leaves the 7! = 5,040 permutations, filtered only by the local diagonal exclusions of the touching rule: {formatCount(dropped('regions'))} survive, as in Chapter 1’s funnel. Dropping the touching rule instead leaves the {dropped('touching')} permutations that also meet every region once. With no row, column or region rule nothing forces a queen at all, so even the empty board is a model.</p>
    <p>The counts come from a small exact counter compiled into this page, not from Z3. Its propagation is unit propagation on the pairwise CNF (Chapter 3); it branches on the row, column or region with the fewest open cells and counts every model it reaches, up to {formatCount(COUNT_CAP)}. The build compares it with an independent enumeration for every combination of switches and runs both exports below through Z3.</p>
    <Workbench data={data} rules={rules} setRules={setRules} fixed={fixed} setFixed={setFixed} action={action} setAction={setAction} />
    <CheckYourself question="Which single rule, when dropped, makes the puzzle have more than one solution?">
      <p>All four. Every rule is needed for uniqueness. Counted in this page with nothing fixed:</p>
      <ul className="z3-wb-drops">
        {drops.map(({ key, result }) => <li key={key}>
          <span><strong>{ruleLabel(key)}</strong> dropped: {countWords(result)}</span>
          <button type="button" className="z3-button" onClick={() => load(key)}>Load on the board<span className="sr-only">: {ruleLabel(key)} dropped</span></button>
        </li>)}
      </ul>
      <p>Dropping the touching rule lets in the fewest placements ({dropped('touching')}, the regional permutations of Chapter 1); dropping the region rule lets in the most ({formatCount(dropped('regions'))}). The build re-checks all four counts by enumerating models with Z3.</p>
    </CheckYourself>
    <ReadSource items={[
      { id: 'P22', locator: '§4.2, Fig. 3.5', why: 'the commands in the export (declare-const, assert, check-sat, get-model) and the Core theory of Booleans.' },
      { id: 'P18', locator: 'Cardinality Constraints; Pseudo Boolean Constraints', why: 'how Z3 states counting rules over Booleans, such as AtMost and PbEq, as alternatives to Sum(If(q, 1, 0)).' },
      { id: 'P20', locator: 'whole short paper', why: 'explaining a failed or changed model in terms of user-level constraint families rather than solver internals.' },
    ]} />
  </Section>
}
