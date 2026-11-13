import assert from 'node:assert/strict'
import fs from 'node:fs'
import { isLocalIndex } from '../src/localQwenEvidence.ts'
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
assert.equal(isLocalIndex(index),true,'Shipped snapshot must pass the actual frontend display contract')
for (const invalid of [null, {}, {schema_version:3,studies:[null]}, {...index,studies:[{...index.studies[0],arms:{baseline:null}}]}]) {
 assert.equal(isLocalIndex(invalid),false,'Malformed public data must fail closed without throwing')
}
for (const name of fs.readdirSync(new URL('../public/evidence/local-qwen/snapshots/',import.meta.url))) {
 const catalog=JSON.parse(fs.readFileSync(new URL(`../public/evidence/local-qwen/snapshots/${name}/catalog.json`,import.meta.url)))
 assert.equal(isLocalIndex(catalog),true,`Retained ${name} catalog must remain compatible with the frontend`)
}
const near=(actual,expected)=>expected===null?assert.equal(actual,null):assert.ok(actual!==null&&Math.abs(actual-expected)<1e-10,`${actual} != ${expected}`)
const independentCost=(rows,r)=>!rows.length||rows.some(x=>x.input_tokens===null||x.output_tokens===null)?null:rows.reduce((sum,x)=>sum+x.input_tokens*r.input/1e6+x.output_tokens*r.output/1e6,0)
for(const study of index.studies) for(const treatment of Object.keys(study.arms ?? {baseline:{},caveman:{}})) {
 const selected=study.rows.filter(x=>x.treatment===treatment), recorded=selected.filter(x=>x.state==='recorded')
 const tariffId=!study.model.startsWith('qwen3.5:')?null:study.model.includes('27b')?'qwen/qwen3.5-27b':study.model.includes('9b')?'qwen/qwen3.5-9b':'qwen/qwen3.5-flash-02-23'
 const tariff=snapshot.models.find(m=>m.id===tariffId)?.usd_per_million
 // Non-Qwen studies have no asserted hosted tariff; verify arithmetic at explicit fixture rates only.
 for (const r of tariff ? [rates,tariff] : [rates]) {
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
const oct31Index=JSON.parse(fs.readFileSync(new URL('../public/evidence/local-qwen/snapshots/2026-10-31-overnight/catalog.json',import.meta.url)))
const nov1Index=JSON.parse(fs.readFileSync(new URL('../public/evidence/local-qwen/snapshots/2026-11-01-local-coverage/catalog.json',import.meta.url)))
const oct31Fixtures = {
 'qwen3.5-9b-nvfp4-np24576-qwen-sampling-r2': [[12,10236,211838,10],[12,23808,191712,8]],
 'qwen3.5-27b-q4_K_M-np24576-qwen-sampling-r2': [[11,9383,112997,7],[11,21824,97334,9]],
 'qwen3.5-4b-np32768-loopstop-audit': [[0,null,null,0],[6,11904,196608,0]],
 'qwen3.5-9b-nvfp4-np32768-loopstop-audit': [[1,853,32768,0],[4,7936,127398,1]],
}
for (const [id, expected] of Object.entries(oct31Fixtures)) {
 const study=oct31Index.studies.find(s=>s.id===id)
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
  const original=oct31Index.studies.find(s=>s.id===study.audit_of)
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

const coverageFixtures = {
 'gemma4-e4b-fresh1-4arm-np32768': [[12,6600,147364,4],[12,7272,139349,4],[12,19044,151620,2],[12,19920,69352,0]],
 'llava-llama3-8b-fresh1-4arm-np4096': [[12,10128,346,0],[12,10824,392,0],[12,22752,348,0],[12,23304,342,0]],
 'qwen3.5-9b-nvfp4-fresh1-4arm-np32768': [[12,10236,210412,9],[12,10932,208496,10],[12,22968,219049,9],[12,23808,174627,10]],
 'qwen3.5-4b-fresh1-4arm-np32768': [[7,5971,143453,4],[7,6377,184583,2],[8,15312,161556,3],[8,15872,175976,4]],
 'qwen3.5-9b-nvfp4': [[3,2559,29091,2],[3,5952,30335,1]],
 'qwen3.5-27b-q4_K_M': [[1,853,5915,1],[1,1984,4602,1]],
}
for (const [id,expected] of Object.entries(coverageFixtures)) {
 const study=nov1Index.studies.find(s=>s.id===id)
 assert.ok(study,`Missing coverage study ${id}`)
 for (const [i,arm] of Object.keys(study.arms).entries()) {
  const rows=study.rows.filter(r=>r.state==='recorded'&&r.treatment===arm), usage=aggregateUsage(rows)
  assert.deepEqual([rows.length,usage.inputTokens,usage.outputTokens,rows.filter(r=>r.strict_correct).length],expected[i])
 }
}
const fresh9=index.studies.find(s=>s.id==='qwen3.5-9b-nvfp4-fresh1-4arm-np32768')
const fresh4=nov1Index.studies.find(s=>s.id==='qwen3.5-4b-fresh1-4arm-np32768')
assert.equal(isMatchedCohort(fresh9.rows),true)
assert.equal(isMatchedCohort(fresh4.rows),false)
const freshContrast=compareArms(fresh9.rows,{input:0.17,output:0.25})
near(freshContrast.baseline.costUsd,0.05434312)
near(freshContrast.caveman.costUsd,0.04770411)
near(freshContrast.deltaUsd,-0.00663901)
// Adding the two control arms must never contaminate baseline/Caveman contrast.
assert.deepEqual(compareArms(fresh9.rows.filter(r=>['baseline','caveman'].includes(r.treatment)),rates),compareArms(fresh9.rows,rates))
console.log('Verified six previously omitted cohorts, four-arm usage and unmatched partial cost guard.')

const nov2Index=JSON.parse(fs.readFileSync(new URL('../public/evidence/local-qwen/snapshots/2026-11-02-overnight/catalog.json',import.meta.url)))
// Independently transcribed from Nov2 recorded raw summary usage, including failures.
const nov2Fixtures = {
 'qwen3.5-27b-q4_K_M-np24576-qwen-sampling-r2': [[12,10236,132997,8,4],[12,23808,119929,9,0]],
 'qwen3.5-27b-q4_K_M-np24576-qwen-sampling-r3': [[12,10236,123190,10,2],[12,23808,95594,12,0]],
 'qwen3.5-9b-nvfp4-np24576-qwen-sampling-r3': [[12,10236,191680,9,1],[12,23808,196740,7,1]],
 'qwen3.5-4b-fresh1-4arm-np32768': [[9,7677,208989,4,1],[9,8199,250119,2,0],[9,17226,194324,3,3],[10,19840,241512,4,0]],
}
for (const [id, expected] of Object.entries(nov2Fixtures)) {
 const study=nov2Index.studies.find(s=>s.id===id)
 assert.ok(study,`Missing Nov2 study ${id}`)
 const source=JSON.parse(fs.readFileSync(new URL(`../public/evidence/local-qwen/${study.summary}`,import.meta.url)))
 for (const [i,arm] of Object.keys(study.arms).entries()) {
  for (const all of [study.rows,source.rows]) {
   const rows=all.filter(r=>r.state==='recorded'&&r.treatment===arm), usage=aggregateUsage(rows)
   assert.deepEqual([rows.length,usage.inputTokens,usage.outputTokens,rows.filter(r=>r.strict_correct).length,rows.filter(r=>r.format_only_correct || r.outcome==='format_only').length],expected[i])
  }
 }
 assert.equal(isMatchedCohort(study.rows),!id.includes('4b-fresh'))
}
console.log('Verified Nov2 round-3, completed 27B round-2 and unmatched 37/48 fresh 4B usage against independent fixtures and raw summaries.')

const nov2Round3=nov2Index.studies.find(s=>s.id==='qwen3.5-9b-nvfp4-np24576-qwen-sampling-r3')
const nov2Round3Cost=compareArms(nov2Round3.rows,{input:0.17,output:0.25},true)
near(nov2Round3Cost.baseline.oneShotCostUsd,0.04966012)
near(nov2Round3Cost.caveman.oneShotCostUsd,0.05323236)
near(nov2Round3Cost.baseline.rescueIncrementalCostUsd,0.00433623)
near(nov2Round3Cost.caveman.rescueIncrementalCostUsd,0.01810583)
near(nov2Round3Cost.baseline.combinedCostUsd,0.05399635)
near(nov2Round3Cost.caveman.combinedCostUsd,0.07133819)
assert.equal(nov2Round3Cost.baseline.combinedStrictSuccessCount,9)
assert.equal(nov2Round3Cost.caveman.combinedStrictSuccessCount,9)
near(compareArms(nov2Index.studies.find(s=>s.id==='qwen3.5-27b-q4_K_M-np24576-qwen-sampling-r3').rows,{input:0.26,output:2.6}).deltaUsd,-0.06822088)
near(compareArms(nov2Index.studies.find(s=>s.id==='qwen3.5-27b-q4_K_M-np24576-qwen-sampling-r2').rows,{input:0.26,output:2.6}).deltaUsd,-0.03044808)


const nov3Index=JSON.parse(fs.readFileSync(new URL('../public/evidence/local-qwen/snapshots/2026-11-03-overnight/catalog.json',import.meta.url)))

// Recorded raw summaries from the November 3 evidence. Each tuple records calls,
// input, output, strict successes, format-only successes and truncations.
const nov3Fixtures = {
 'qwen3.5-4b-fresh1-4arm-np32768': [[12,10236,288892,4,3,5],[12,10932,336091,3,0,9],[12,22968,276054,4,3,5],[12,23808,293729,5,0,7]],
 'gpt-oss-20b-fresh1-text-4arm-np32768': [[12,5260,263898,6,0,6],[12,6004,300201,5,0,7],[12,17812,248506,6,0,6],[12,18388,214813,6,0,5]],
 'qwen3.5-9b-nvfp4-fresh1-text-4arm-np32768': [[2,712,44494,2,0,0],[2,828,35607,2,0,0],[2,2834,19417,2,0,0],[2,2974,20355,2,0,0]],
}
for (const [id, expected] of Object.entries(nov3Fixtures)) {
 const study=nov3Index.studies.find(s=>s.id===id)
 assert.ok(study,`Missing Nov3 study ${id}`)
 const source=JSON.parse(fs.readFileSync(new URL(`../public/evidence/local-qwen/${study.summary}`,import.meta.url)))
 for (const [i,arm] of ['baseline','schema','neutral','caveman'].entries()) {
  for (const all of [study.rows,source.rows]) {
   const rows=all.filter(r=>r.state==='recorded'&&r.treatment===arm)
   const usage=aggregateUsage(rows)
   const strict=rows.filter(r=>r.strict_correct).length
   const formatOnly=rows.filter(r=>r.format_only_correct || r.outcome==='format_only').length
   const truncated=rows.filter(r=>r.truncated || r.outcome==='truncated').length
   assert.deepEqual([rows.length,usage.inputTokens,usage.outputTokens,strict,formatOnly,truncated],expected[i])
  }
 }
 assert.equal(isMatchedCohort(study.rows),true)
 const recorded=study.rows.filter(r=>r.state==='recorded')
 assert.equal(recorded.some(r=>r.rescue),false)
 if (id.includes('9b')) {
  assert.deepEqual([...new Set(recorded.map(r=>r.board_id))].sort(),['panel-5-28','panel-7-06'])
  assert.equal(study.rows.filter(r=>r.state==='pending').length,40)
  near(compareArms(study.rows,{input:0.17,output:0.25}).deltaUsd,-0.00565021)
 }
 if (id.includes('4b')) near(compareArms(study.rows,{input:0.065,output:0.26}).deltaUsd,0.0021398)
}
console.log('Verified Nov3 fresh 4B, GPT-OSS text and matched two-board Qwen 9B text usage and outcomes.')

const nov5Index=JSON.parse(fs.readFileSync(new URL('../public/evidence/local-qwen/snapshots/2026-11-05-overnight/catalog.json',import.meta.url)))

// November 5 receipt totals and cost accounting. Order: calls, input, generated,
// strict, format-only, capped.
const nov5Fixtures = {
 'qwen3.5-9b-nvfp4-fresh1-text-4arm-np32768': {
  baseline: [12,4624,332471,7,0,5], schema: [12,5320,320696,6,0,6],
  neutral: [12,17356,268829,7,0,5], caveman: [12,18196,267212,6,0,6],
 },
 'qwen3.5-9b-nvfp4-fresh1-json-2arm-np32768': {
  baseline: [12,10236,210425,9,0,3], caveman: [12,23808,174617,10,0,2],
 },
 'qwen3.5-27b-q4_K_M-fresh1-4arm-np24576': {
  baseline: [11,9383,113883,8,3,0], schema: [10,9110,108693,10,0,0],
  neutral: [10,19140,93374,9,1,0], caveman: [10,19840,84142,10,0,0],
 },
}
for (const [id, expected] of Object.entries(nov5Fixtures)) {
 const study=nov5Index.studies.find(s=>s.id===id)
 assert.ok(study,`Missing Nov5 study ${id}`)
 const source=JSON.parse(fs.readFileSync(new URL(`../public/evidence/local-qwen/${study.summary}`,import.meta.url)))
 for (const [arm, fixture] of Object.entries(expected)) {
  for (const all of [study.rows,source.rows]) {
   const rows=all.filter(r=>r.state==='recorded'&&r.treatment===arm)
   const usage=aggregateUsage(rows)
   assert.deepEqual([rows.length,usage.inputTokens,usage.outputTokens,rows.filter(r=>r.strict_correct).length,
    rows.filter(r=>r.format_only_correct || r.outcome==='format_only').length,
    rows.filter(r=>r.truncated || r.outcome==='truncated').length],fixture)
  }
 }
 assert.equal(isMatchedCohort(study.rows),!id.includes('27b'))
}
const nov5Plain=nov5Index.studies.find(s=>s.id==='qwen3.5-9b-nvfp4-fresh1-4arm-np32768')
const nov5Json=nov5Index.studies.find(s=>s.id==='qwen3.5-9b-nvfp4-fresh1-json-2arm-np32768')
const nov5Text=nov5Index.studies.find(s=>s.id==='qwen3.5-9b-nvfp4-fresh1-text-4arm-np32768')
assert.equal(nov5Json.rows.length,24)
assert.ok(nov5Json.protocol.format)
for (const row of nov5Json.rows) {
 const plain=nov5Plain.rows.find(r=>r.call_id===row.call_id)
 assert.equal(row.strict_correct,plain.strict_correct)
 assert.equal(row.truncated,plain.truncated)
}
const nov5Rates = { input: 0.17, output: 0.25 }
near(compareArms(nov5Json.rows,nov5Rates).deltaUsd,-0.00664476)
near(compareArms(nov5Text.rows,nov5Rates).deltaUsd,-0.01400751)
console.log('Verified November 5 outcome, pairing and hosted-cost fixtures.')

const nov6Index=JSON.parse(fs.readFileSync(new URL('../public/evidence/local-qwen/snapshots/2026-11-06-overnight/catalog.json',import.meta.url)))
// Recorded calls, input, generated, strict, format-only and capped.
const nov6Fixtures = {
 'qwen3.5-27b-q4_K_M-fresh1-4arm-np24576': {
  baseline: [12,10236,130101,9,3,0], schema: [12,10932,144470,12,0,0],
  neutral: [12,22968,132099,10,1,1], caveman: [12,23808,105203,12,0,0],
 },
 'qwen3.5-9b-nvfp4-fresh2-4arm-np32768': {
  baseline: [12,10236,180366,11,0,1], schema: [12,10932,209674,12,0,0],
  neutral: [12,22968,181517,11,0,1], caveman: [12,23808,187503,9,0,3],
 },
 'gpt-oss-20b-fresh2-text-4arm-np32768': {
  baseline: [5,2131,65049,4,0,1], schema: [5,2441,134404,1,0,4],
  neutral: [4,5882,67917,3,0,1], caveman: [4,6074,73142,2,0,2],
 },
}
for (const [id, expected] of Object.entries(nov6Fixtures)) {
 const study=nov6Index.studies.find(s=>s.id===id)
 assert.ok(study,`Missing Nov6 study ${id}`)
 const source=JSON.parse(fs.readFileSync(new URL(`../public/evidence/local-qwen/${study.summary}`,import.meta.url)))
 for (const [arm, fixture] of Object.entries(expected)) {
  for (const all of [study.rows,source.rows]) {
   const rows=all.filter(r=>r.state==='recorded'&&r.treatment===arm)
   const usage=aggregateUsage(rows)
   assert.deepEqual([rows.length,usage.inputTokens,usage.outputTokens,rows.filter(r=>r.strict_correct).length,
    rows.filter(r=>r.format_only_correct || r.outcome==='format_only').length,
    rows.filter(r=>r.truncated || r.outcome==='truncated').length],fixture)
  }
 }
 assert.equal(isMatchedCohort(study.rows),!id.startsWith('gpt-oss'))
}
const nov6Nine=nov6Index.studies.find(s=>s.id==='qwen3.5-9b-nvfp4-fresh2-4arm-np32768')
const nov6TwentySeven=nov6Index.studies.find(s=>s.id==='qwen3.5-27b-q4_K_M-fresh1-4arm-np24576')
const nov6GptOss=nov6Index.studies.find(s=>s.id==='gpt-oss-20b-fresh2-text-4arm-np32768')
near(compareArms(nov6Nine.rows,nov5Rates).deltaUsd,0.00409149)
near(compareArms(nov6TwentySeven.rows,{input:0.26,output:2.60}).deltaUsd,-0.06120608)
assert.equal(nov6GptOss.rows.filter(r=>r.state==='pending').length,30)
assert.deepEqual(nov6GptOss.rows.filter(r=>r.strict_correct&&r.loop_stop?.would_have_stopped).map(r=>r.call_id).sort(),
 ['baseline_panel-9-32','neutral_panel-7-46'])
console.log('Verified November 6 outcome, cost and pending-coverage fixtures.')

const nov9Index=JSON.parse(fs.readFileSync(new URL('../public/evidence/local-qwen/snapshots/2026-11-09-overnight/catalog.json',import.meta.url)))
assert.equal(isLocalIndex(nov9Index),true)
assert.equal(nov9Index.studies.length,27)
assert.equal(nov9Index.studies.reduce((n,s)=>n+s.recorded,0),835)
assert.equal(nov9Index.studies.reduce((n,s)=>n+s.planned,0),875)
assert.equal(nov9Index.studies.filter(s=>s.kind!=='audit'&&s.status==='complete').length,23)
assert.equal(nov9Index.studies.filter(s=>s.kind==='audit').length,2)
assert.deepEqual(nov9Index.studies.filter(s=>s.status==='partial').map(s=>s.id).sort(),
 ['qwen3.5-27b-q4_K_M','qwen3.5-9b-nvfp4'])
// Strict counts by size, total caps, errors, known input/output subtotals.
const nov9Fixtures = {
 'gpt-oss-20b-fresh2-text-4arm-np32768': {
  baseline: [[2,2,2],6,0,5260,254295], schema: [[3,1,1],7,0,6004,293849],
  neutral: [[3,3,1],5,0,17812,256504], caveman: [[3,2,2],5,0,18388,250062],
 },
 'gpt-oss-20b-fresh1-text-think-medium-4arm-np32768': {
  baseline: [[4,3,0],4,0,5260,184646], schema: [[4,2,2],3,0,6004,172779],
  neutral: [[4,3,1],2,0,17812,155692], caveman: [[2,3,1],1,0,18388,166022],
 },
 'gpt-oss-20b-fresh1-text-4arm-np65536': {
  baseline: [[4,3,1],4,0,5260,438670], schema: [[3,3,1],5,0,6004,417023],
  neutral: [[4,2,1],4,1,16267,349629], caveman: [[4,2,1],3,0,18388,313105],
 },
}
for(const [id,arms] of Object.entries(nov9Fixtures)) {
 const study=nov9Index.studies.find(s=>s.id===id)
 assert.ok(study)
 assert.equal(study.recorded,48)
 assert.equal(isMatchedCohort(study.rows),true)
 for(const [arm,[sizes,caps,errors,input,output]] of Object.entries(arms)) {
  const rows=study.rows.filter(r=>r.treatment===arm)
  assert.equal(rows.length,12)
  for(const [i,size] of [5,7,9].entries()) {
   const cell=rows.filter(r=>r.size===size)
   assert.equal(cell.length,4)
   assert.equal(cell.filter(r=>r.strict_correct).length,sizes[i])
  }
  const usage=aggregateUsage(rows)
  assert.equal(rows.filter(r=>r.truncated).length,caps)
  assert.equal(rows.filter(r=>r.transport_error).length,errors)
  assert.equal(rows.filter(r=>r.format_only_correct).length,0)
  assert.equal(usage.knownInputTokens,input)
  assert.equal(usage.knownOutputTokens,output)
  assert.equal(usage.inputTokens,errors?null:input)
  assert.equal(usage.outputTokens,errors?null:output)
 }
}
const final65=nov9Index.studies.find(s=>s.id==='gpt-oss-20b-fresh1-text-4arm-np65536')
const transport=final65.rows.find(r=>r.transport_error)
assert.equal(transport.call_id,'neutral_panel-9-45')
assert.equal(transport.finish_reason,null)
assert.equal(estimateCohort(final65.rows,{input:1,output:1}).costUsd,null)
assert.equal(isLocalIndex({...nov9Index,studies:[{...final65,rows:final65.rows.map(r=>r===transport?{...r,output_tokens:0}:r)}]}),false)
for(const id of ['qwen3.5-27b-q4_K_M-fresh1-4arm-np24576','qwen3.5-9b-nvfp4-fresh2-4arm-np32768']) {
 const prior=nov6Index.studies.find(s=>s.id===id)
 const final=nov9Index.studies.find(s=>s.id===id)
 // Root paths change in a new immutable snapshot, but scientific outcome/usage fields do not.
 for(const key of ['strict_correct','format_only_correct','truncated','input_tokens','output_tokens','elapsed_seconds'])
  assert.deepEqual(final.rows.map(r=>r[key]),prior.rows.map(r=>r[key]))
}
console.log('Verified final-night completion, arm/size outcomes, unchanged Qwen panels and unknown transport-error usage.')

// November 12 fixtures transcribed from recorded raw summary usage (failures included).
// Keep this dated catalog independent of whichever snapshot is active next.
const nov12Index=JSON.parse(fs.readFileSync(new URL('../public/evidence/local-qwen/snapshots/2026-11-12-overnight/catalog.json',import.meta.url)))
assert.equal(isLocalIndex(nov12Index),true)
assert.deepEqual([nov12Index.studies.length,nov12Index.studies.reduce((n,s)=>n+s.recorded,0),nov12Index.studies.reduce((n,s)=>n+s.planned,0)],[30,973,1019])
assert.equal(nov12Index.studies.filter(s=>s.kind!=='audit'&&s.status==='complete').length,25)
const nov12Fixtures={
 'gpt-oss-20b-fresh2-text-think-medium-4arm-np32768': {baseline:[12,9,5260,146586],schema:[12,7,6004,177568],neutral:[12,8,17812,159130],caveman:[12,7,18388,126304]},
 'gemma4-e4b-fresh2-4arm-np32768': {baseline:[12,5,6600,156707],schema:[12,3,7272,166765],neutral:[12,3,19044,139572],caveman:[12,2,19920,66951]},
 'qwen3.5-4b-fresh2-4arm-np32768': {baseline:[11,3,9383,221073],schema:[11,8,10021,254604],neutral:[10,3,19140,236082],caveman:[10,4,19840,206349]},
}
for(const [id,arms] of Object.entries(nov12Fixtures)) {
 const study=nov12Index.studies.find(s=>s.id===id)
 assert.ok(study)
 assert.equal(study.board_set,'fresh2')
 assert.equal(study.rows.length,48)
 for(const [arm,expected] of Object.entries(arms)) {
  const rows=study.rows.filter(r=>r.treatment===arm&&r.state==='recorded'), usage=aggregateUsage(rows)
  assert.deepEqual([rows.length,rows.filter(r=>r.strict_correct).length,usage.inputTokens,usage.outputTokens],expected)
  for(const r of [{input:1,output:2},...(study.model.startsWith('qwen')?[{input:0.1,output:0.4}]:[])])
   near(estimateCohort(rows,r).costUsd,independentCost(rows,r))
 }
 assert.equal(study.rows.filter(r=>r.transport_error).length,0)
}
const nov12Four=nov12Index.studies.find(s=>s.id==='qwen3.5-4b-fresh2-4arm-np32768')
assert.equal(nov12Four.status,'partial')
assert.equal(nov12Four.rows.filter(r=>r.state==='pending').length,6)
assert.equal(isMatchedCohort(nov12Four.rows),false)
for(const r of nov12Four.rows.filter(r=>r.state==='pending')) {
 assert.equal(r.input_tokens,null);assert.equal(r.output_tokens,null);assert.equal(r.receipt,null)
}
assert.equal(nov12Index.studies.some(s=>s.id==='qwen3.5-9b-nvfp4-fresh2-text-4arm-np32768'),false)
// Keyed pairing checks the preregistered discordant outcomes across both panels.
const discordance=(left,right)=>{
 const peers=new Map(right.map(r=>[r.call_id,r]))
 assert.equal(peers.size,left.length)
 return [left.filter(r=>r.strict_correct&&!peers.get(r.call_id)?.strict_correct).length,
         left.filter(r=>!r.strict_correct&&peers.get(r.call_id)?.strict_correct).length]
}
for(const [set,expected] of [['fresh1',[12,6]],['fresh2',[13,7]]]) {
 const medium=nov12Index.studies.find(s=>s.id===`gpt-oss-20b-${set}-text-think-medium-4arm-np32768`)
 const high=nov12Index.studies.find(s=>s.id===`gpt-oss-20b-${set}-text-4arm-np32768`)
 assert.deepEqual(discordance(medium.rows,high.rows),expected)
}
for(const [set,expected] of [['fresh1',[4,0]],['fresh2',[3,0]]]) {
 const rows=nov12Index.studies.find(s=>s.id===`gemma4-e4b-${set}-4arm-np32768`).rows
 const arm=name=>rows.filter(r=>r.treatment===name).map(r=>({...r,call_id:r.board_id}))
 assert.deepEqual(discordance(arm('baseline'),arm('caveman')),expected)
}
console.log('Verified November 12 complete/partial usage, unmatched-cost guards and fixed-analysis discordances.')
