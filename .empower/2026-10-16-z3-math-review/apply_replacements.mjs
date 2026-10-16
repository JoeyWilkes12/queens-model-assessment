/** Verify the review's precise substitutions against current source, in memory. */
import { readFileSync, writeFileSync } from 'node:fs'
import ts from '../../node_modules/typescript/lib/typescript.js'
const root=new URL('../../src/z3/',import.meta.url)
const changed=new Map()
let substitutions=0
function sub(file,before,after) {
  let text=changed.get(file) ?? readFileSync(new URL(file,root),'utf8')
  const matches=text.split(before).length-1
  if(matches!==1) throw Error(`${file}: expected one match, got ${matches}: ${before}`)
  changed.set(file,text.replace(before,after))
  substitutions++
}
sub('Chapter3.tsx','<Lit lit={step.literal} />','<Lit lit={Math.abs(step.literal)} />')
sub('Chapter3.tsx','<Lit lit={s.literal} />','<Lit lit={Math.abs(s.literal)} />')
sub('Chapter3.tsx','<Lit lit={s.literal} n={5} />','<Lit lit={Math.abs(s.literal)} n={5} />')
sub('CDCLPlayer.tsx','<Lit lit={e.literal as number} /> {(e.literal as number) > 0','<Lit lit={Math.abs(e.literal as number)} /> {(e.literal as number) > 0')
sub('CDCLPlayer.tsx','<Lit lit={selected.lit} /> =','<Lit lit={Math.abs(selected.lit)} /> =')
sub('Chapter1.tsx','so each touching clause has a false literal','so each touching clause has a true literal')
const deliverable=readFileSync(new URL('DELIVERABLE.md',import.meta.url),'utf8')
const rowWith=needle=>deliverable.split('\n').find(line=>line.startsWith('|') && line.includes(needle))
const proofReplacement=rowWith('Adding literals can only').match(/with: “(.*?)” \|$/)[1]
const c3=changed.get('Chapter3.tsx')
sub('Chapter3.tsx',c3.match(/<Proof>.*?<\/Proof>/s)[0],`<Proof>${proofReplacement}</Proof>`)
const oldMetric='{metric(firstLines.get(s.name) ?? \'\') && <span className="z3-route-metric">{metric(firstLines.get(s.name) ?? \'\')}</span>}'
const metricReplacement=rowWith('Every later occurrence of a tactic').match(/with `([^`]+)`/)[1]
sub('EngineReceipt.tsx',oldMetric,metricReplacement)
sub('Chapter7.tsx','making r3c1 false leaves every clause with at least two open literals','making r3c1 false leaves every unsatisfied clause with at least two open literals')
sub('Chapter3.tsx','a closure operator on literal sets ordered by inclusion with ⊤ on top','a closure operator on consistent partial assignments ordered by inclusion, with a greatest conflict element ⊤ and U_F(⊤) = ⊤')
const watchesReplacement=rowWith('keep two watches on literals').match(/with: “(.*?)” \|$/)[1]
const watchesOld=changed.get('Chapter3.tsx').match(/<p>For each clause with at least two literals, keep two .*?<\/p>/s)[0]
sub('Chapter3.tsx',watchesOld,`<p>${watchesReplacement}</p>`)
const resolutionReplacement=rowWith('Resolution is the whole').match(/\| “(.*?)” \|$/)[1]
const resolutionOld=readFileSync(new URL('Chapter6.tsx',root),'utf8').match(/<p><dfn.*?Resolution<\/dfn>.*?<\/p>/s)[0]
sub('Chapter6.tsx',resolutionOld,`<p>${resolutionReplacement}</p>`)
const tseitinReplacement=rowWith('not equivalent over the old ones').match(/\| “(.*?)” \|$/)[1]
sub('Chapter9.tsx','The translation is <em>equisatisfiable</em> after extending the variables, not equivalent over the old ones, which is the same projection idea as Theorem 2.4.',tseitinReplacement)
sub('Chapter3.tsx','suppose the first four literals are false.','suppose the first four literals are false and q₃₁ is unassigned.')
sub('Chapter4.tsx','Classical DPLL undoes only the most recent decision and tries its opposite.','Classical DPLL backtracks chronologically to the most recent decision whose other branch has not yet been tried; if none remains, it reports UNSAT.')
sub('Chapter5.tsx','Let d be the decision of the current level.','Consider a conflict at a positive decision level, with unit propagation exhausted before each decision. Let d be that level’s decision. At level 0 there is no decision or UIP; a conflict instead yields a refutation.')
sub('Chapter5.tsx','Start from the conflict clause and repeatedly resolve it with the reason of its current-level literal that was assigned last, until exactly one current-level literal remains.','Start from the conflict clause. While it has more than one current-level literal, choose the one whose complementary trail assignment was latest and resolve with that assignment’s reason clause.')
sub('Chapter5.tsx','which is also valid but says less','which is also entailed by F and includes the lower-level literal q₁₁')
sub('EngineReceipt.tsx','<span className="z3-route-count">×{s.count}</span>','<span className="z3-route-count">{s.count} log entries</span>')
sub('Chapter8.tsx',"locator: '§5.1'","locator: '§§4.4, 5.1'")
sub('Chapter9.tsx',"locator: '§§4.3, 9.2.3'","locator: '§§3.3, 4.3, 9.2.3'")
sub('Z3Part.tsx','Every figure replays recorded, checked evidence.','Figures distinguish recorded runs, checked encodings and labelled illustrations.')
console.log('# Proposed-replacement checks\n')
for(const [file,text] of changed) {
  const parsed=ts.createSourceFile(file,text,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX)
  if(parsed.parseDiagnostics.length) throw Error(`${file}: ${JSON.stringify(parsed.parseDiagnostics)}`)
  console.log(`- ${file}: quoted source substitutions matched uniquely; resulting TSX parses.`)
}
for (const [file,text] of changed) writeFileSync(new URL(file,root), text)
console.log(`\n${substitutions} substitutions written in ${changed.size} source files, all in memory. No application file written. This is syntax checking, not a rendered UI or full project type check.`)
