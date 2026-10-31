import assert from 'node:assert/strict'
import fs from 'node:fs'
import { aggregateUsage, estimateCohort, compareArms, parseRate, breakEvenRatio, isMatchedCohort } from '../src/localQwenMath.ts'
const row = (i, o, extra = {}) => ({state:'recorded',input_tokens:i,output_tokens:o,strict_correct:false,format_only_correct:false,truncated:false,loop_stopped:false,elapsed_seconds:1,treatment:'baseline',rescue:null,...extra})
const rates = {input:1,output:2}
const paired = [row(10,20,{board_id:'one'}),row(10,20,{board_id:'one',treatment:'caveman'})]
assert.equal(isMatchedCohort(paired),true)
assert.equal(isMatchedCohort([...paired,row(10,20,{board_id:'two'})]),false)
assert.equal(isMatchedCohort([paired[0],{...paired[1],board_id:'two'}]),false)
assert.equal(isMatchedCohort([...paired,...paired]),false)
assert.equal(isMatchedCohort([]),false)
assert.equal(isMatchedCohort([...paired,row(null,null,{state:'pending',board_id:'two'})]),true)
assert.equal(estimateCohort([],rates).costUsd,null)
assert.equal(estimateCohort([row(0,0)],rates).costUsd,0)
assert.equal(estimateCohort([row(1,null,{loop_stopped:true})],rates).costUsd,null)
assert.equal(aggregateUsage([row(3,4),row(null,5)]).knownInputTokens,3)
assert.equal(aggregateUsage([row(3,4),row(null,5)]).outputTokens,9)
assert.equal(estimateCohort([row(10,20,{truncated:true}),row(10,20,{strict_correct:true})],rates).costPerStrictSuccessUsd,0.0001)
assert.equal(estimateCohort([row(1,2)],rates).costPerStrictSuccessUsd,null)
const rescued = row(10,20,{rescue:{input_tokens:30,output_tokens:40,strict_correct:true,elapsed_seconds:1}})
assert.equal(estimateCohort([rescued],rates).combinedStrictSuccessCount,0)
assert.equal(estimateCohort([rescued],rates,true).combinedStrictSuccessCount,1)
assert.equal(estimateCohort([rescued],rates,true).combinedCostUsd,0.00016)
assert.equal(estimateCohort([row(1,2,{rescue:{input_tokens:null,output_tokens:3,strict_correct:true,elapsed_seconds:1}})],rates,true).combinedCostUsd,null)
assert.equal(estimateCohort([row(1,2,{strict_correct:true,rescue:rescued.rescue})],rates,true).combinedStrictSuccessCount,1)
for (const bad of [-1,NaN,Infinity,1.5,Number.MAX_SAFE_INTEGER+1]) assert.throws(()=>aggregateUsage([row(bad,1)]))
assert.throws(()=>aggregateUsage([row(Number.MAX_SAFE_INTEGER,0),row(1,0)]))
for (const bad of ['', ' ', '-1', 'Infinity','NaN','1foo',Infinity,-1]) assert.throws(()=>parseRate(bad))
assert.equal(parseRate('0'),0)
for (const bad of [null,undefined,{},[],true]) assert.throws(()=>parseRate(bad))
for (const bad of [undefined,'1',{},true]) assert.throws(()=>aggregateUsage([row(bad,1)]))
assert.ok(Math.abs(estimateCohort([row(1,2),row(null,null,{state:'pending'})],rates).costUsd-0.000005)<1e-15)
assert.equal(estimateCohort([row(1,2),row(null,null,{state:'pending'})],rates).pendingCount,1)
assert.equal(estimateCohort([row(0,0,{state:'pending'})],rates).costUsd,null)
assert.throws(()=>estimateCohort([],{input:NaN,output:0}))
assert.equal(breakEvenRatio(10,20,1,2),null)
assert.equal(breakEvenRatio(20,10,2,1),null)
assert.equal(breakEvenRatio(null,10,1,2),null)
assert.throws(()=>estimateCohort([row(Number.MAX_SAFE_INTEGER,Number.MAX_SAFE_INTEGER)],{input:Number.MAX_VALUE,output:Number.MAX_VALUE}))
assert.equal(compareArms([row(0,0),row(1,2,{treatment:'caveman'})],rates).percentDelta,null)
assert.equal(breakEvenRatio(141515,132800,10236,23808),13572/8715)
for (const [b,c] of [[141515,132800],[168414,170728],[115628,96546]]) {
 const result=compareArms([row(10236,b),row(23808,c,{treatment:'caveman'})],rates)
 assert.ok(Math.abs(result.deltaUsd-((23808-10236)+2*(c-b))/1e6)<1e-12)
}
const snapshot=JSON.parse(fs.readFileSync(new URL('../public/evidence/local-qwen-pricing.json',import.meta.url)))
assert.match(snapshot.catalog_sha256,/^[0-9a-f]{64}$/)
assert.ok(Number.isFinite(Date.parse(snapshot.checked_utc)))
assert.equal(snapshot.checked_utc.slice(0,10),'2026-10-30') // Controlled price comparison: never silently refresh tariffs.
assert.equal(snapshot.absent_models.find(m=>m.id==='qwen/qwen3.5-4b').present,false)
assert.deepEqual(snapshot.models.find(m=>m.id==='qwen/qwen3.5-9b').usd_per_million,{input:0.17,output:0.25})
assert.deepEqual(snapshot.models.find(m=>m.id==='qwen/qwen3.5-27b').usd_per_million,{input:0.26,output:2.6})
for (const model of snapshot.models) {
 assert.ok(Math.abs(model.usd_per_million.input-Number(model.raw_usd_per_token.prompt)*1e6)<1e-12)
 assert.ok(Math.abs(model.usd_per_million.output-Number(model.raw_usd_per_token.completion)*1e6)<1e-12)
}
console.log('Local Qwen cost verification passed: completeness, partials, caps, loops, rescue uniqueness, overflow, zero denominators, fixture deltas and dated pricing.')
const index=JSON.parse(fs.readFileSync(new URL('../public/evidence/local-qwen/index.json',import.meta.url)))
const near=(actual,expected)=>expected===null?assert.equal(actual,null):assert.ok(actual!==null&&Math.abs(actual-expected)<1e-10,`${actual} != ${expected}`)
const independentCost=(rows,r)=>!rows.length||rows.some(x=>x.input_tokens===null||x.output_tokens===null)?null:rows.reduce((sum,x)=>sum+x.input_tokens*r.input/1e6+x.output_tokens*r.output/1e6,0)
for(const study of index.studies) for(const treatment of ['baseline','caveman']) {
 const selected=study.rows.filter(x=>x.treatment===treatment), recorded=selected.filter(x=>x.state==='recorded')
 const tariff=snapshot.models.find(m=>m.id=== (study.model.includes('27b')?'qwen/qwen3.5-27b':study.model.includes('9b')?'qwen/qwen3.5-9b':'qwen/qwen3.5-flash-02-23'))?.usd_per_million
 assert.ok(tariff,`Missing explicit tariff for ${study.id}`)
 for (const r of [rates,tariff]) {
 const result=estimateCohort(selected,r,true), expected=independentCost(recorded,r)
 near(result.oneShotCostUsd,expected)
 assert.equal(result.pendingCount,selected.length-recorded.length)
 const rescues=recorded.flatMap(x=>x.rescue?[x.rescue]:[])
 const extra=rescues.length?independentCost(rescues,r):0
 near(result.rescueIncrementalCostUsd,extra)
 near(result.combinedCostUsd,expected===null||extra===null?null:expected+extra)
 const strict=recorded.filter(x=>x.strict_correct).length, combined=recorded.filter(x=>x.strict_correct||x.rescue?.strict_correct).length
 assert.equal(result.strictSuccessCount,strict);assert.equal(result.combinedStrictSuccessCount,combined)
 near(result.costPerStrictSuccessUsd,strict&&expected!==null?expected/strict:null)
 near(result.costPerCombinedStrictSuccessUsd,combined&&expected!==null&&extra!==null?(expected+extra)/combined:null)
 for(const key of ['input_tokens','output_tokens']) {
  const expectedTokens=recorded.length&&!recorded.some(x=>x[key]===null)?recorded.reduce((sum,x)=>sum+x[key],0):null
  assert.equal(result.usage[key==='input_tokens'?'inputTokens':'outputTokens'],expectedTokens)
  near(result[key==='input_tokens'?'inputCostUsd':'outputCostUsd'],expectedTokens===null?null:expectedTokens*r[key==='input_tokens'?'input':'output']/1e6)
 }
 }
}
const fixtures={'qwen3.5-4b-pilot':[[10236,141515],[23808,132800]],'qwen3.5-9b-nvfp4-np24576':[[10236,168414],[23808,170728]],'qwen3.5-27b-q4_K_M-np24576':[[10236,115628],[23808,96546]]}
for(const [id,expected] of Object.entries(fixtures)) {
 const study=index.studies.find(x=>x.id===id)
 if(study) for(const [i,arm] of ['baseline','caveman'].entries()) {
  const usage=aggregateUsage(study.rows.filter(x=>x.state==='recorded'&&x.treatment===arm))
  assert.deepEqual([usage.inputTokens,usage.outputTokens],expected[i])
 }
}
console.log(`Verified independent integration math across ${index.studies.length} frozen studies.`)
const oct31Fixtures = {
 'qwen3.5-9b-nvfp4-np24576-qwen-sampling-r2': [[12,10236,211838,10],[12,23808,191712,8]],
 'qwen3.5-27b-q4_K_M-np24576-qwen-sampling-r2': [[11,9383,112997,7],[11,21824,97334,9]],
 'qwen3.5-4b-np32768-loopstop-audit': [[0,null,null,0],[6,11904,196608,0]],
 'qwen3.5-9b-nvfp4-np32768-loopstop-audit': [[1,853,32768,0],[4,7936,127398,1]],
}
for (const [id, expected] of Object.entries(oct31Fixtures)) {
 const study=index.studies.find(s=>s.id===id)
 assert.ok(study,`Missing Oct31 study ${id}`)
 for (const [i,arm] of ['baseline','caveman'].entries()) {
  const rows=study.rows.filter(r=>r.state==='recorded'&&r.treatment===arm), usage=aggregateUsage(rows)
  assert.deepEqual([rows.length,usage.inputTokens,usage.outputTokens,rows.filter(r=>r.strict_correct).length],expected[i])
 }
 if (id.endsWith('-audit')) {
  assert.equal(study.kind,'audit');assert.equal(study.decoding,'loop-audit')
  assert.equal(isMatchedCohort(study.rows),false) // Selected unmatched arms cannot support a treatment contrast.
  const source=JSON.parse(fs.readFileSync(new URL(`../public/evidence/local-qwen/${study.summary}`,import.meta.url)))
  assert.equal(source.rows.length,24) // Preserve raw scheduled summary; price selected eligible calls only.
  const original=index.studies.find(s=>s.id===study.audit_of)
  assert.ok(original)
  const eligible=original.rows.filter(r=>r.loop_stopped)
  assert.equal(study.rows.length,eligible.length)
  for (const r of study.rows) {
   assert.ok(eligible.some(e=>e.call_id===r.call_id))
   const raw=source.rows.find(x=>x.call_id===r.call_id)
   assert.ok(raw);assert.equal(r.input_tokens,raw.input_tokens);assert.equal(r.output_tokens,raw.output_tokens)
  }
  for (const r of eligible) { assert.equal(r.input_tokens,null);assert.equal(r.output_tokens,null) }
 } else {
  assert.equal(isMatchedCohort(study.rows),true)
 }
}
console.log('Verified Oct31 r2 counts, 11-pair partial scope, selected audit source usage and unchanged canceled usage.')
