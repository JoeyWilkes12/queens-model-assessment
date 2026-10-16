/** Check source-driven receipt summaries and experimental provenance, no browser. */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import ts from '../../node_modules/typescript/lib/typescript.js'

const root = new URL('../../', import.meta.url)
const json = name => JSON.parse(readFileSync(new URL(`public/evidence/z3/${name}`, root),'utf8'))
const receipts = json('z3-receipts.json')
console.log('# Display and experiment checks\n')
let stale = 0
for (const b of receipts.boards) for (const r of b.runs) for (const c of r.checks) {
  const first = new Map()
  const runs = []
  for (const line of c.route.lines) {
    const name = line.match(/^\s*\(([A-Za-z][\w.-]*)/)?.[1]
    if (!name) continue
    if (!first.has(name)) first.set(name,line)
    if (runs.at(-1)?.name === name) runs.at(-1).lines.push(line)
    else runs.push({name,lines:[line]})
  }
  if (runs.length !== c.route.stages.length) throw Error('stage parse mismatch')
  for (let i=0;i<runs.length;i++) {
    const {name,lines} = runs[i]
    if (lines.length !== c.route.stages[i].count) throw Error('log count mismatch')
    const shown = first.get(name).match(/:num-exprs (\d+)/)?.[1]
    const actual = lines.map(l=>l.match(/:num-exprs (\d+)/)?.[1]).filter(Boolean).at(-1)
    if (shown && actual && shown !== actual) {
      stale++
      console.log(`- ${b.id}/${r.mode}/${c.query}, stage ${i} ${name}: UI ${shown} expressions, occurrence ends with ${actual}.`)
    }
  }
}
console.log(`\nTotal stale expression-count badges: ${stale}.\n`)
const source = readFileSync(new URL('src/z3/kernel.ts',root),'utf8')
const compiled = ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText
const kernel = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`)
const existence = json('reference-trace-existence.json')
const blocked = json('reference-trace-blocked.json')
const initial = existence.clauses.slice(0,513).map(x=>x.lits)
const blocker = blocked.clauses[blocked.blockerId].lits
let blockerExample = null
let completed=0
for (const withBlocker of [false,true]) for (let preferred=1;preferred<=49;preferred++) {
  const clauses = [...initial,...(withBlocker ? [blocker] : [])]
  const run = kernel.runCdcl(clauses,49,[preferred])
  if (run.truncated) throw Error('unexpected truncation')
  if (!!run.model === withBlocker) throw Error('wrong verdict')
  const failures = kernel.validateEvents(run.clauses,clauses.map((_,i)=>i),run.events,49)
  if (failures.length) throw Error(failures.join('; '))
  if (withBlocker) {
    const propagation = run.events.find(e=>e.reasonClauseId===513)
    if (propagation) blockerExample ??= {preferences:[preferred],event:propagation}
  }
  completed++
}
console.log(`- Exercised ${completed} experimental runs: all 49 one-cell preferences, with/without the full blocker; all terminated correctly and validated.`)
console.log(`- Blocker propagation example in this set: ${JSON.stringify(blockerExample)}.`)
if (!blockerExample) console.log('- Broad “learned” classification has no observed displayed counterexample here; exclude it from confirmed findings.')
console.log('- These are programmatic TypeScript-kernel checks; no browser or device rendering was performed.')
console.log('\nAll display/experiment checks completed.')
