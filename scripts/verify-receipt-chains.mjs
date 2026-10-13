#!/usr/bin/env node
// Offline audit: public saved evidence only; no provider calls or credentials.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const site = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const evidenceRoot = path.join(site, 'public/evidence');
const hashes = new Map();
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
async function evidence(relative) {
  const filename = path.resolve(evidenceRoot, relative);
  assert.ok(filename.startsWith(`${evidenceRoot}${path.sep}`), 'Evidence path must remain public.');
  const bytes = await readFile(filename);
  hashes.set(filename, digest(bytes));
  return JSON.parse(bytes.toString('utf8'));
}

// Compile the actual adapters in memory, resolving only their local source/JSON
// imports. No build output, mocks, private files, or duplicated adapter logic.
const modules = new Map();
async function moduleUrl(filename) {
  const resolved = path.resolve(filename);
  assert.ok(resolved.startsWith(`${path.join(site, 'src')}${path.sep}`));
  if (modules.has(resolved)) return modules.get(resolved);
  const source = await readFile(resolved, 'utf8');
  if (resolved.endsWith('.json')) {
    const url = `data:text/javascript;base64,${Buffer.from(`export default ${JSON.stringify(JSON.parse(source))};`).toString('base64')}`;
    modules.set(resolved, url);
    return url;
  }
  let compiled = ts.transpileModule(source, { compilerOptions: {
    target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022, verbatimModuleSyntax: true,
  } }).outputText;
  const syntax = ts.createSourceFile(resolved, compiled, ts.ScriptTarget.ES2022, true, ts.ScriptKind.JS);
  const imports = syntax.statements.filter(ts.isImportDeclaration);
  for (const declaration of imports.reverse()) {
    const specifier = declaration.moduleSpecifier;
    assert.ok(ts.isStringLiteral(specifier));
    assert.ok(specifier.text.startsWith('./'), `Unexpected adapter dependency ${specifier.text}`);
    const dependency = path.resolve(path.dirname(resolved), specifier.text.endsWith('.json') ? specifier.text : `${specifier.text}.ts`);
    compiled = `${compiled.slice(0, specifier.getStart(syntax))}${JSON.stringify(await moduleUrl(dependency))}${compiled.slice(specifier.getEnd())}`;
  }
  const url = `data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`;
  modules.set(resolved, url);
  return url;
}
const { receiptChainForId } = await import(await moduleUrl(path.join(site, 'src/receiptChainData.ts')));
const { deriveTrajectoryFrames } = await import(await moduleUrl(path.join(site, 'src/trajectoryBoardData.ts')));
const manifest = await evidence('manifest.json');
const jev = await evidence('trajectory-study.json');
const subq = await evidence('subq-trajectories-summary.json');
const records = new Map(manifest.records.map(record => [record.id, record]));
const generated = JSON.parse(await readFile(path.join(site, 'src/trajectoryReceiptChains.json'), 'utf8'));
assert.equal(generated.schemaVersion, 1);
assert.equal(generated.chains.length, 180);
assert.deepEqual(generated.sources.map(source => source.path).sort(), [
  'public/evidence/subq-trajectories-summary.json', 'public/evidence/trajectory-study.json',
]);
for (const source of generated.sources) {
  assert.ok(source.path.startsWith('public/evidence/'));
  await evidence(source.path.slice('public/evidence/'.length));
  assert.equal(hashes.get(path.resolve(site, source.path)), source.sha256, `Stale chain source ${source.path}`);
}

const studies = [
  { id: '2026-09-30-jev-trajectories', label: 'Jev', playbackPath: '#/jev-trajectories', traces: jev.trajectories, calls: 394 },
  { id: '2026-10-13-subq-trajectories', label: 'SubQ', playbackPath: '#/subq-assessment', traces: subq.trajectories, calls: 325 },
];
const allLinked = new Set();
const results = [];
for (const study of studies) {
  assert.equal(study.traces.length, 90);
  let linkedCalls = 0;
  let forcedDecisions = 0;
  let framesChecked = 0;
  for (const trace of study.traces) {
    if (study.label === 'SubQ') assert.deepEqual(await evidence(`subq-trajectories/${trace.trajectory_id}.json`), trace, `Summary must match saved trace ${trace.trajectory_id}`);
    const board = jev.boards.find(item => item.id === trace.board_id);
    assert.ok(board, `Missing board ${trace.board_id}`);
    const events = trace.steps.flatMap(step => ['region', 'cell'].map(phase => ({
      id: step[`${phase}_call`] ? `${study.id}:${step[`${phase}_call`]}` : null,
      step: step.step, phase, forced: step[`${phase}_forced`] === true,
    })));
    const actual = events.filter(event => event.id);
    assert.equal(actual.length, trace.http_calls);
    assert.equal(events.filter(event => event.forced).length, trace.forced_decisions);
    const generatedChain = generated.chains.find(chain => chain.studyId === study.id && chain.trajectoryId === trace.trajectory_id);
    assert.ok(generatedChain, `Missing generated chain ${study.id}:${trace.trajectory_id}`);
    assert.equal(generatedChain.stopReason, trace.stop_reason);
    assert.equal(generatedChain.calls.length, actual.length);

    for (const [index, event] of actual.entries()) {
      assert.equal(event.forced, false, 'API calls and harness-forced phases must be distinguished.');
      const current = { id: event.id, step: event.step, phase: event.phase };
      const adjacent = item => item ? { id: item.id, step: item.step, phase: item.phase } : null;
      const position = events.indexOf(event);
      const nextPosition = actual[index + 1] ? events.indexOf(actual[index + 1]) : events.length;
      const forcedBeforeNext = events.slice(position + 1, nextPosition).filter(item => item.forced).length;
      const expected = {
        studyId: study.id, trajectoryId: trace.trajectory_id, modelLabel: study.label,
        playbackPath: `${study.playbackPath}/${encodeURIComponent(trace.trajectory_id)}`, stopReason: trace.stop_reason, current,
        previous: adjacent(actual[index - 1]), next: adjacent(actual[index + 1]),
        index, total: actual.length, forcedBeforeNext,
      };
      const chain = receiptChainForId(event.id);
      assert.deepEqual(chain, expected, event.id);
      assert.deepEqual(generatedChain.calls[index], { ...current, forcedBeforeNext });
      assert.ok(!allLinked.has(event.id), `Receipt appears in multiple chains ${event.id}`);
      allLinked.add(event.id);
      const record = records.get(event.id);
      assert.ok(record, `Nonexistent receipt ${event.id}`);
      assert.equal(record.study, study.id);
      assert.equal(record.board, trace.board_id);
      if (chain.previous) assert.equal(receiptChainForId(chain.previous.id).next.id, event.id);
      if (chain.next) assert.equal(receiptChainForId(chain.next.id).previous.id, event.id);
      linkedCalls++;
    }
    for (const event of events.filter(event => !event.id)) {
      assert.equal(event.forced, true, 'Missing decisions must be explicitly harness-forced.');
      forcedDecisions++;
      const invented = `${study.id}:${trace.trajectory_id}_p${String(event.step).padStart(2, '0')}_${event.phase}`;
      assert.equal(receiptChainForId(invented), null, `Forced decision must not gain a receipt ${invented}`);
    }

    const inputBefore = JSON.stringify({ trace, board });
    const frames = deriveTrajectoryFrames(trace, board.regions, study.id);
    assert.equal(frames.length, 1 + 3 * trace.steps.length, trace.trajectory_id);
    assert.equal(new Set(frames.map(frame => frame.id)).size, frames.length);
    assert.deepEqual(frames[0].queens, []);
    let placed = [];
    for (const [index, step] of trace.steps.entries()) {
      const region = frames[1 + index * 3];
      const proposal = frames[2 + index * 3];
      const outcome = frames[3 + index * 3];
      const link = phase => ({ label: `${phase === 'region' ? 'Region' : 'Cell'} Choice receipt`, id: `${study.id}:${step[`${phase}_call`]}` });
      const stepLinks = ['region', 'cell'].filter(phase => step[`${phase}_call`]).map(link);
      assert.deepEqual(region.queens, placed);
      assert.deepEqual(proposal.queens, placed);
      assert.equal(region.highlightRegion, step.region);
      assert.equal(proposal.highlightRegion, step.region);
      assert.deepEqual(proposal.selectedCell, step.cell);
      assert.equal(proposal.candidateCells, undefined, 'Never fabricate menus from counts.');
      assert.deepEqual(region.receiptLinks, step.region_call ? [link('region')] : []);
      assert.deepEqual(proposal.receiptLinks, step.cell_call ? [link('cell')] : stepLinks);
      assert.deepEqual(outcome.receiptLinks, stepLinks);
      assert.match(region.sourceLabel, step.region_forced ? /harness-forced/ : /model API Choice/);
      assert.match(proposal.sourceLabel, step.cell_forced ? /harness-forced/ : /model API Choice/);

      for (const phase of ['region', 'cell']) {
        if (!step[`${phase}_call`]) continue;
        const record = records.get(`${study.id}:${step[`${phase}_call`]}`);
        const request = await evidence(record.files.request);
        const response = await evidence(record.files.response);
        assert.equal(request.state.board_id, trace.board_id);
        assert.deepEqual(request.state.placed_queens.map(q => [q.row, q.column]), placed);
        assert.deepEqual(request.state.region_grid_rows, board.regions.map(row => row.map(value => String.fromCharCode(65 + value))));
        assert.equal(response.answers[phase].choice, phase === 'region' ? step.region : `r${step.cell[0]}c${step.cell[1]}`);
        if (phase === 'cell') assert.equal(request.state.selected_region, step.region);
      }
      if (!step.local_violations.length) placed = [...placed, [...step.cell]];
      assert.deepEqual(outcome.queens, placed, 'Playback must follow saved harness retention.');
      assert.deepEqual(outcome.selectedCell, step.cell);
      assert.deepEqual(outcome.invalidCells, step.local_violations.length || step.on_unique_solution === false ? [step.cell] : []);
      assert.equal(outcome.sourceLabel, 'Recorded harness transition + evaluator-only annotation');
      if (step.local_violations.length || step.on_unique_solution === false) {
        assert.equal(index, trace.steps.length - 1, 'Never show decisions after recorded failure.');
        assert.match(outcome.label, /attempt stopped/);
      }
    }
    for (const frame of frames) for (const link of frame.receiptLinks ?? []) {
      assert.equal(records.get(link.id)?.study, study.id, 'Frame receipts must use the same provider study.');
      assert.equal(receiptChainForId(link.id)?.trajectoryId, trace.trajectory_id);
    }
    assert.deepEqual(frames.at(-1).queens, trace.placement_prefix);
    assert.equal(frames.at(-1).queens.length, trace.accepted_queens);
    assert.equal(JSON.stringify({ trace, board }), inputBefore, 'Adapter must not mutate evidence.');
    framesChecked += frames.length;
  }
  // Conservative adapter behavior must hold for either provider, including
  // evidence absence and malformed data. These cases never invoke a solver.
  const successful = study.traces.find(trace => trace.success);
  const failed = study.traces.find(trace => trace.stop_reason === 'local_rule_violation');
  const regionsFor = trace => jev.boards.find(board => board.id === trace.board_id).regions;
  assert.ok(successful && failed);
  const extraAfterFailure = { ...failed, steps: [...failed.steps, successful.steps[0]] };
  assert.equal(deriveTrajectoryFrames(extraAfterFailure, regionsFor(failed), study.id).length, 1 + 3 * failed.steps.length, 'Do not animate fabricated continuation after failure.');
  const unknownValidation = { ...successful, steps: [{ ...successful.steps[0], local_violations: undefined }, successful.steps[1]] };
  const unknownFrames = deriveTrajectoryFrames(unknownValidation, regionsFor(successful), study.id);
  assert.equal(unknownFrames.length, 4);
  assert.deepEqual(unknownFrames.at(-1).queens, []);
  assert.match(unknownFrames.at(-1).label, /unavailable/);
  const noCell = { ...successful, stop_reason: 'no_locally_legal_cell', steps: [{ ...successful.steps[0], cell: undefined }] };
  const noCellFrames = deriveTrajectoryFrames(noCell, regionsFor(successful), study.id);
  assert.equal(noCellFrames.length, 3);
  assert.deepEqual(noCellFrames.at(-1).queens, []);
  assert.equal(noCellFrames.at(-1).selectedCell, undefined, 'Missing coordinates must stay absent.');
  assert.throws(() => deriveTrajectoryFrames(successful, [[]], study.id), /square matrix/);
  assert.throws(() => deriveTrajectoryFrames({ ...successful, steps: [{ ...successful.steps[0], cell: [0, 1] }] }, regionsFor(successful), study.id), /Invalid recorded cell/);
  assert.equal(linkedCalls, study.calls);
  results.push({ study: study.id, trajectories: study.traces.length, linkedCalls, forcedDecisions, framesChecked });
}

// Exhaustively reject every unrelated receipt, including probes, static exact
// replays, split adaptations, other providers and naming-shaped absent calls.
let unrelatedReceipts = 0;
for (const record of manifest.records) if (!allLinked.has(record.id)) {
  assert.equal(receiptChainForId(record.id), null, `Unrelated receipt gained a chain: ${record.id}`);
  unrelatedReceipts++;
}
for (const id of ['', 'not-a-receipt',
  '2026-10-13-subq-trajectories:sequence-5-1_local_a1_p99_region',
  '2026-10-13-subq-trajectories:sequence-5-1_local_a1_p01_region_repeat1',
  '2026-09-30-jev-trajectories:sequence-9-1_raw_a1_p08_cell',
  '2026-10-13-subq-replay:sequence-5-1_local_a1_p01_region_repeat1',
]) assert.equal(receiptChainForId(id), null, id);
assert.equal(allLinked.size, 719);
for (const [filename, hash] of hashes) assert.equal(digest(await readFile(filename)), hash, `Evidence changed: ${filename}`);
console.log(JSON.stringify({ status: 'passed', studies: results, uniqueLinkedReceipts: allLinked.size,
  unrelatedReceipts, evidenceFilesCheckedUnchanged: hashes.size, privateFilesRead: 0, externalCalls: 0 }, null, 2));
