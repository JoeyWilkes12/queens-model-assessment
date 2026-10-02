#!/usr/bin/env node
// Offline public-evidence adapter audit: no requests, solver/private files, or writes.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const site = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const evidence = path.join(site, 'public/evidence');
const evidenceHashes = new Map();
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
async function readEvidence(relative) {
  const resolved = path.join(evidence, relative);
  const bytes = await readFile(resolved);
  evidenceHashes.set(resolved, sha256(bytes));
  return JSON.parse(bytes.toString('utf8'));
}
const adapterPath = path.join(site, 'src/trajectoryBoardData.ts');
const source = await readFile(adapterPath, 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022, verbatimModuleSyntax: true },
});
const { deriveTrajectoryFrames, findReceiptTrajectories, linkedTrajectoryForReceipt } = await import(`data:text/javascript;base64,${Buffer.from(compiled.outputText).toString('base64')}`);
const study = await readEvidence('trajectory-study.json');
const manifest = await readEvidence('manifest.json');
const records = new Map(manifest.records.map(record => [record.id, record]));
assert.equal(study.trajectories.length, 90);
assert.equal(study.boards.length, 9);

let linkedCalls = 0;
let forcedDecisions = 0;
let renderedFrames = 0;
const outcomes = {};
const actualReceiptAttempts = new Map();
for (const trace of study.trajectories) {
  const board = study.boards.find(board => board.id === trace.board_id);
  assert.ok(board, `Missing board ${trace.board_id}`);
  const before = JSON.stringify({ trace, board });
  const frames = deriveTrajectoryFrames(trace, board.regions);
  assert.equal(frames.length, 1 + 3 * trace.steps.length, trace.trajectory_id);
  assert.equal(new Set(frames.map(frame => frame.id)).size, frames.length);
  assert.deepEqual(frames[0].queens, []);
  renderedFrames += frames.length;
  let placed = [];
  for (const [index, step] of trace.steps.entries()) {
    const regionFrame = frames[1 + index * 3];
    const proposalFrame = frames[2 + index * 3];
    const outcomeFrame = frames[3 + index * 3];
    assert.deepEqual(regionFrame.queens, placed);
    assert.equal(regionFrame.highlightRegion, step.region);
    assert.deepEqual(proposalFrame.queens, placed);
    assert.deepEqual(proposalFrame.selectedCell, step.cell);
    assert.equal(proposalFrame.candidateCells, undefined, 'Menus must not be invented from counts.');
    assert.equal(outcomeFrame.sourceLabel, 'Recorded harness transition + evaluator-only annotation');
    for (const phase of ['region', 'cell']) {
      const call = step[`${phase}_call`];
      if (!call) {
        assert.equal(step[`${phase}_forced`], true);
        forcedDecisions++;
        continue;
      }
      const receiptId = `2026-09-30-jev-trajectories:${call}`;
      const record = records.get(receiptId);
      assert.ok(record, `Missing linked receipt ${receiptId}`);
      actualReceiptAttempts.set(receiptId, trace.trajectory_id);
      assert.equal(linkedTrajectoryForReceipt(receiptId), trace.trajectory_id);
      assert.deepEqual(findReceiptTrajectories(receiptId, study.trajectories).map(t => t.trajectory_id), [trace.trajectory_id]);
      const request = await readEvidence(record.files.request);
      const response = await readEvidence(record.files.response);
      assert.equal(request.state.board_id, trace.board_id);
      assert.deepEqual(request.state.placed_queens.map(q => [q.row, q.column]), placed);
      assert.deepEqual(request.state.region_grid_rows, board.regions.map(row => row.map(region => String.fromCharCode(65 + region))));
      assert.equal(response.answers[phase].choice, phase === 'region' ? step.region : `r${step.cell[0]}c${step.cell[1]}`);
      if (phase === 'cell') assert.equal(request.state.selected_region, step.region);
      linkedCalls++;
    }
    // Independently reproduce the recorded harness retention rule, not oracle truth.
    if (step.local_violations.length === 0) placed = [...placed, [...step.cell]];
    assert.deepEqual(outcomeFrame.queens, placed);
    if (step.local_violations.length || step.on_unique_solution === false) {
      assert.deepEqual(outcomeFrame.invalidCells, [step.cell]);
      assert.equal(index, trace.steps.length - 1, 'No frames may follow a recorded failure.');
      assert.match(outcomeFrame.label, /attempt stopped/);
    }
  }
  assert.deepEqual(frames.at(-1).queens, trace.placement_prefix, `Final prefix ${trace.trajectory_id}`);
  assert.equal(frames.at(-1).queens.length, trace.accepted_queens);
  assert.equal(JSON.stringify({ trace, board }), before, 'Adapter mutated evidence.');
  assert.deepEqual(deriveTrajectoryFrames(trace, board.regions.map(row => row.map(region => String.fromCharCode(65 + region)))), frames);
  for (const frame of frames) for (const link of frame.receiptLinks || []) assert.ok(records.has(link.id));
  outcomes[trace.stop_reason] = (outcomes[trace.stop_reason] || 0) + 1;
}

// Include every corpus control/probe, not just hand-picked unrelated examples.
let unlinkedControls = 0;
for (const record of manifest.records.filter(record => record.study === '2026-09-30-jev-trajectories')) {
  assert.equal(linkedTrajectoryForReceipt(record.id), actualReceiptAttempts.get(record.id) ?? null, record.id);
  if (!actualReceiptAttempts.has(record.id)) unlinkedControls++;
}
assert.equal(actualReceiptAttempts.size, 394);
assert.equal(linkedTrajectoryForReceipt('2026-09-30-jev-trajectories:sequence-5-1_raw_a1_p01_cell'), null, 'Forced cells have no receipt.');
assert.equal(linkedTrajectoryForReceipt('2026-09-30-jev-trajectories:sequence-9-1_raw_a1_p08_cell'), null, 'Naming-shaped invented calls have no link.');

// Edge cases enforce honest absence, halt semantics, and exact membership.
const successful = study.trajectories.find(trace => trace.success);
const failed = study.trajectories.find(trace => trace.stop_reason === 'local_rule_violation');
const global = study.trajectories.find(trace => trace.stop_reason === 'globally_unextendable_prefix');
const boardFor = trace => study.boards.find(board => board.id === trace.board_id).regions;
const syntheticExtra = { ...failed, steps: [...failed.steps, successful.steps[0]] };
assert.equal(deriveTrajectoryFrames(syntheticExtra, boardFor(failed)).length, 1 + failed.steps.length * 3, 'Do not continue after failure.');
const globalFrames = deriveTrajectoryFrames(global, boardFor(global));
assert.equal(globalFrames.at(-1).queens.length, global.accepted_queens);
assert.equal(globalFrames.at(-1).queens.length, global.correct_queens_before_failure + 1, 'A local retention can be globally wrong.');
const missing = { ...successful, steps: [{ ...successful.steps[0], local_violations: undefined }, successful.steps[1]] };
const unknownFrames = deriveTrajectoryFrames(missing, boardFor(missing));
assert.equal(unknownFrames.length, 4);
assert.deepEqual(unknownFrames.at(-1).queens, []);
assert.match(unknownFrames.at(-1).label, /unavailable/);
const noCell = { ...successful, stop_reason: 'no_locally_legal_cell', steps: [{ ...successful.steps[0], cell: undefined }] };
assert.equal(deriveTrajectoryFrames(noCell, boardFor(noCell)).length, 3);
assert.deepEqual(findReceiptTrajectories('2026-09-19-jev-scale:construction_7', study.trajectories), []);
assert.deepEqual(findReceiptTrajectories('2026-09-30-jev-trajectories:not-a-call', study.trajectories), []);
assert.throws(() => deriveTrajectoryFrames(successful, [[]]), /square matrix/);
assert.throws(() => deriveTrajectoryFrames({ ...successful, steps: [{ ...successful.steps[0], cell: [0, 1] }] }, boardFor(successful)), /Invalid recorded cell/);

for (const [file, originalHash] of evidenceHashes) assert.equal(sha256(await readFile(file)), originalHash, `Evidence changed: ${file}`);
console.log(JSON.stringify({ status: 'passed', trajectories: study.trajectories.length, boards: study.boards.length, renderedFrames, linkedCalls, forcedDecisions, unlinkedControls, outcomes, evidenceFilesCheckedUnchanged: evidenceHashes.size, privateFilesRead: 0, externalCalls: 0 }, null, 2));
