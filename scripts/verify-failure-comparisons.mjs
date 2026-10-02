#!/usr/bin/env node
/** Offline PUBLIC-only reference, binding, placement and annotation verification. */
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import ts from 'typescript';

const evidence = new URL('../public/evidence/', import.meta.url);
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const load = async path => JSON.parse(await readFile(new URL(path, evidence), 'utf8'));
const clone = value => JSON.parse(JSON.stringify(value));
const keys = cells => cells.map(cell => cell.join(',')).sort();
const written = content => ({ choices: [{ message: { content } }] });
const answer = (id, columns) => written(JSON.stringify({ board_id: id, columns_by_row: columns }));
let checks = 0;
const check = async (label, fn) => { await fn(); checks++; console.log(`PASS ${label}`); };
const snapshot = async (root = evidence, prefix = '') => {
  const result = [];
  for (const entry of (await readdir(root, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name))) {
    const path = `${prefix}${entry.name}`;
    if (entry.isDirectory()) result.push(...await snapshot(new URL(`${entry.name}/`, root), `${path}/`));
    else if (entry.isFile()) result.push([path, sha256(await readFile(new URL(entry.name, root)))]);
    else assert.fail(`Unexpected non-file public evidence entry: ${path}`);
  }
  return result;
};
const before = await snapshot();
const sources = {};
const moduleUrl = async (name, dependencies = {}) => {
  const source = await readFile(new URL(`../src/${name}.ts`, import.meta.url), 'utf8');
  sources[name] = source;
  let compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
  for (const [dependency, url] of Object.entries(dependencies)) compiled = compiled.replaceAll(`'./${dependency}'`, JSON.stringify(url));
  return `data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`;
};
const receiptUrl = await moduleUrl('receiptBoardData');
const referenceUrl = await moduleUrl('comparisonReferences');
const comparisonUrl = await moduleUrl('failureComparisonData', { receiptBoardData: receiptUrl, comparisonReferences: referenceUrl });
const { deriveReceiptBoard } = await import(receiptUrl);
const { comparisonReferences, comparisonLineageManifest } = await import(referenceUrl);
const { deriveFailureComparison } = await import(comparisonUrl);

// Independent exhaustive column-permutation enumeration. No implementation
// helper, grader boolean, stored solution or private board/answer file is used.
function enumerate(regions) {
  const solutions = [];
  const permutation = Array.from({ length: regions.length }, (_, index) => index + 1);
  const visit = row => {
    if (row === permutation.length) {
      for (let index = 1; index < permutation.length; index++) if (Math.abs(permutation[index] - permutation[index - 1]) <= 1) return;
      if (new Set(permutation.map((column, index) => regions[index][column - 1])).size === regions.length) solutions.push([...permutation]);
      return;
    }
    for (let index = row; index < permutation.length; index++) {
      [permutation[row], permutation[index]] = [permutation[index], permutation[row]];
      visit(row + 1);
      [permutation[row], permutation[index]] = [permutation[index], permutation[row]];
    }
  };
  visit(0);
  return solutions;
}
const manifestBytes = await readFile(new URL(comparisonLineageManifest.path, evidence));
const lineage = JSON.parse(manifestBytes);
await check('public lineage manifest byte hash is frozen', () => assert.equal(sha256(manifestBytes), comparisonLineageManifest.sha256));
await check('registry is twelve distinct deeply frozen public partition snapshots', () => {
  assert.equal(comparisonReferences.length, 12);
  assert.equal(new Set(comparisonReferences.map(reference => reference.id)).size, 12);
  assert.ok(Object.isFrozen(comparisonReferences));
  for (const reference of comparisonReferences) {
    assert.ok(Object.isFrozen(reference) && Object.isFrozen(reference.columns) && Object.isFrozen(reference.regions) && reference.regions.every(Object.isFrozen));
    if (reference.image) assert.ok(Object.isFrozen(reference.image));
  }
});
for (const reference of comparisonReferences) {
  const publicBytes = await readFile(new URL(reference.publicRequest, evidence));
  const publicRequest = JSON.parse(publicBytes);
  await check(`${reference.id}: public receipt and complete partition hashes`, () => {
    assert.equal(sha256(publicBytes), reference.publicRequestSha256);
    assert.equal(publicRequest.state.board_id, reference.id);
    assert.equal(publicRequest.state.size, reference.size);
    assert.deepEqual(publicRequest.state.region_grid_rows, reference.regions);
    assert.equal(sha256(JSON.stringify(reference.regions)), reference.partitionSha256);
    assert.deepEqual(deriveReceiptBoard(publicRequest, null).regions, reference.regions);
  });
  await check(`${reference.id}: independent exhaustive enumeration finds exactly the frozen unique solution`, () => {
    const solutions = enumerate(publicRequest.state.region_grid_rows);
    assert.equal(solutions.length, 1);
    assert.deepEqual(solutions[0], reference.columns);
  });
  if (!reference.image) continue;
  const image = reference.image;
  const originalBytes = await readFile(new URL(image.publicOriginalRequest, evidence));
  const original = JSON.parse(originalBytes);
  const imageBytes = await readFile(new URL(image.assetPath, evidence));
  const diagnosticPath = `runs/2026-10-01-diagnostic-completion/${image.lineageCallId}/request.json`;
  const diagnosticBytes = await readFile(new URL(diagnosticPath, evidence));
  const entry = lineage.schedule.find(item => item.call_id === image.lineageCallId);
  await check(`${reference.id}: actual image bytes, public versus original hashes, and published diagnostic binding`, () => {
    assert.equal(sha256(originalBytes), image.publicOriginalRequestSha256);
    assert.notEqual(image.publicOriginalRequestSha256, image.originalRequestSha256);
    assert.equal(sha256(imageBytes), image.sha256);
    assert.equal(imageBytes.length, image.bytes);
    assert.equal(original.messages[0].content[1].image_url.sha256, image.sha256);
    assert.equal(entry.board_id, reference.id);
    assert.equal(entry.source_image_sha256, image.sha256);
    assert.equal(entry.source_original_request_sha256, image.originalRequestSha256);
    assert.equal(entry.source_jev_request_sha256, reference.publicRequestSha256);
    const [, study, call] = reference.publicRequest.split('/');
    assert.equal(entry.source_jev_request, `evaluations/${study}/requests/${call}.json`);
    assert.equal(entry.request_sha256, image.originalDiagnosticRequestSha256);
    assert.equal(sha256(diagnosticBytes), image.publicDiagnosticRequestSha256);
    assert.notEqual(image.publicDiagnosticRequestSha256, image.originalDiagnosticRequestSha256);
    assert.deepEqual(deriveReceiptBoard(JSON.parse(diagnosticBytes), null).regions, reference.regions);
    const comparison = deriveFailureComparison(original, answer(reference.id, reference.columns));
    assert.deepEqual(comparison.solutionQueens.map(cell => cell[1]), reference.columns);
    assert.equal(comparison.matchingCells, reference.size);
    assert.deepEqual(comparison.conflicts, []);
  });
}

const originalPath = 'runs/2026-10-01-earlier-generations/r6_queens-5-easy_gpt-4.1/';
const [original, output, grade] = await Promise.all(['request', 'response', 'grade'].map(file => load(`${originalPath}${file}.json`)));
const diagnostic = await load('runs/2026-10-01-diagnostic-completion/rep1_gpt-4.1__queens-5-easy_region_grid_rows/request.json');
const jev = await load(comparisonReferences[0].publicRequest);
const reference = comparisonReferences[0];
const pristine = JSON.stringify([original, output, grade]);
const target = deriveFailureComparison(original, output, grade);
await check('motivating complete r6 response is [5,1,4,2,3], one match, and never repaired', () => {
  assert.deepEqual(target.modelQueens, [[1, 5], [2, 1], [3, 4], [4, 2], [5, 3]]);
  assert.deepEqual(target.solutionQueens, [[1, 5], [2, 3], [3, 1], [4, 4], [5, 2]]);
  assert.equal(target.complete, true);
  assert.equal(target.matchingCells, 1);
  assert.deepEqual(keys(target.mismatchedCells), keys([[2, 1], [3, 4], [4, 2], [5, 3]]));
  assert.deepEqual(keys(target.conflictCells), keys([[3, 4], [4, 2], [5, 3]]));
  assert.deepEqual(target.conflicts.map(conflict => conflict.label), ['Region B is empty in this complete submitted answer.', 'Region D has 2 queens: r3c4, r5c3.', 'Queens touch: r4c2 and r5c3.']);
  assert.deepEqual(target.conflicts[1].cells, [[3, 4], [5, 3]]);
  assert.deepEqual(target.conflicts[2].cells, [[4, 2], [5, 3]]);
  assert.equal(JSON.stringify([original, output, grade]), pristine);
});
await check('misleading manifest/grade partialResponse does not override a visibly complete submission', () => {
  assert.equal(deriveFailureComparison(original, output, { ...grade, partialResponse: true }).complete, true);
});
await check('same exact text-matrix and Jev partition bind without any image', () => {
  assert.deepEqual(deriveFailureComparison(diagnostic, output, grade).regions, target.regions);
  assert.deepEqual(deriveFailureComparison(jev, output, grade).regions, target.regions);
});

for (const [label, mutate] of [
  ['unknown SHA', req => req.messages[0].content[1].image_url.sha256 = '0'.repeat(64)],
  ['wrong-board registered image', req => { const other = comparisonReferences[1].image; req.messages[0].content[1].image_url = { asset_ref: `request-inline-image://sha256/${other.sha256}`, asset_path: other.assetPath, media_type: 'image/png', sha256: other.sha256, bytes: other.bytes }; }],
  ['conflicting asset reference', req => req.messages[0].content[1].image_url.asset_ref += '0'],
  ['conflicting asset path', req => req.messages[0].content[1].image_url.asset_path = 'assets/other.png'],
  ['conflicting byte count', req => req.messages[0].content[1].image_url.bytes++],
  ['non-PNG metadata', req => req.messages[0].content[1].image_url.media_type = 'image/jpeg'],
  ['raw external image URL', req => req.messages[0].content[1].image_url = { url: 'https://example.invalid/board.png' }],
  ['raw inline base64 image URL', req => req.messages[0].content[1].image_url = { url: 'data:image/png;base64,AA==' }],
  ['multiple identical images', req => req.messages[0].content.push(clone(req.messages[0].content[1]))],
  ['multiple different images', req => req.messages[0].content.push({ type: 'image_url', image_url: { ...req.messages[0].content[1].image_url, sha256: comparisonReferences[1].image.sha256 } })],
  ['image only in earlier user message', req => req.messages.push({ role: 'user', content: req.messages[0].content[0].text })],
  ['unrecognized image content encoding', req => req.messages[0].content[1].type = 'image'],
  ['wrong board ID', req => req.messages[0].content[0].text = req.messages[0].content[0].text.replace('Board ID: queens-5-easy', 'Board ID: queens-7-medium')],
  ['wrong size', req => req.messages[0].content[0].text = req.messages[0].content[0].text.replace('N: 5', 'N: 7')],
  ['missing axes', req => req.messages[0].content[0].text = req.messages[0].content[0].text.replace('Row numbers increase from top to bottom and column numbers from left to right, both starting at 1.', '')],
  ['conflicting axes', req => req.messages[0].content[0].text += '\nRows increase bottom to top.'],
  ['conflicting ID in second text part', req => req.messages[0].content.push({ type: 'text', text: 'Board ID: queens-7-medium\nN: 7\n' })],
  ['malformed state does not fall through to image', req => req.state = { board_id: 'queens-5-easy' }],
  ['missing image and no explicit partition', req => req.messages[0].content.pop()],
]) {
  await check(`reject image binding: ${label}`, () => { const req = clone(original); mutate(req); assert.equal(deriveFailureComparison(req, output, grade), null); });
}
const textOf = req => req.messages[0].content[0].text;
for (const [label, mutate] of [
  ['known ID with altered full matrix', req => req.messages[0].content[0].text = textOf(req).replace('[["A","A","B"', '[["B","A","B"')],
  ['ragged full matrix', req => req.messages[0].content[0].text = textOf(req).replace('"A","A","B","B","C"', '"A","B"')],
  ['two conflicting mappings', req => req.messages[0].content.push({ type: 'text', text: textOf(req).replace('[["A","A","B"', '[["B","A","B"') })],
  ['valid mapping plus malformed second mapping', req => req.messages[0].content.push({ type: 'text', text: 'Region grid rows (JSON matrix):\n[bad' })],
  ['reversed text coordinates', req => req.messages[0].content[0].text += '\nColumns are numbered right to left.'],
  ['state partition conflict with text', req => { req.state = clone(jev.state); req.state.region_grid_rows[0][0] = 'B'; }],
]) {
  await check(`reject text binding: ${label}`, () => { const req = clone(diagnostic); mutate(req); assert.equal(deriveFailureComparison(req, output, grade), null); });
}
await check('same state plus explicit text mapping is accepted only with exact agreement', () => {
  const req = clone(diagnostic); req.state = clone(jev.state); assert.deepEqual(deriveFailureComparison(req, output, grade).regions, target.regions);
});
await check('registered image plus conflicting complete text partition is rejected', () => {
  const req = clone(original);
  req.messages[0].content[0].text = textOf(diagnostic).replace('[["A","A","B"', '[["B","A","B"');
  req.messages[0].content[0].text += '\nRow numbers increase from top to bottom and column numbers from left to right, both starting at 1.';
  assert.equal(deriveFailureComparison(req, output, grade), null);
});
for (const [label, mutate] of [
  ['unknown matrix despite known ID', req => req.state.region_grid_rows[0][0] = 'B'],
  ['unknown board ID despite known matrix', req => req.state.board_id = 'unregistered-board'],
  ['wrong size', req => req.state.size = 7],
  ['explicit reversed coordinates', req => req.state.coordinates = 'Rows bottom to top; columns left to right; both start at 1.'],
  ['canonical coordinate text plus reversed directional metadata', req => { req.state.coordinates = 'Rows top to bottom; columns left to right; both start at 1.'; req.state.row_direction = 'bottom to top'; }],
  ['conflicting redundant matrix/cells', req => req.state.regions = { A: [[1, 1]] }],
]) {
  await check(`reject native binding: ${label}`, () => { const req = clone(jev); mutate(req); assert.equal(deriveFailureComparison(req, output, grade), null); });
}
const finalText = output.choices[0].message.content;
for (const [label, bad] of [
  ['missing output', null],
  ['non-object output', 'bad'],
  ['multiple choices', { choices: [...output.choices, ...output.choices] }],
  ['malformed JSON', written('{bad}')],
  ['wrong-board answer', answer('queens-7-medium', [5, 1, 4, 2, 3])],
  ['short columns', answer('queens-5-easy', [5, 1])],
  ['out-of-range columns', answer('queens-5-easy', [0, 1, 4, 2, 3])],
  ['noninteger columns', answer('queens-5-easy', [5, 1.5, 4, 2, 3])],
  ['boolean column', answer('queens-5-easy', [5, true, 4, 2, 3])],
  ['extra object key', written('{"board_id":"queens-5-easy","columns_by_row":[5,1,4,2,3],"other":true}')],
  ['duplicate object key', written('{"board_id":"queens-5-easy","board_id":"queens-5-easy","columns_by_row":[5,1,4,2,3]}')],
  ['duplicate escaped-equivalent key', written('{"board_id":"queens-5-easy","\\u0062oard_id":"queens-5-easy","columns_by_row":[5,1,4,2,3]}')],
  ['multiple visible schema objects despite grade claiming one', written(`${finalText}\n${finalText}`)],
]) {
  await check(`no recoverable model placement: ${label}`, () => {
    const result = deriveFailureComparison(original, bad, grade);
    assert.equal(result.modelQueens, null);
    assert.deepEqual(result.mismatchedCells, []);
    assert.deepEqual(result.conflictCells, []);
    assert.equal(result.complete, false);
    assert.equal(result.matchingCells, 0);
    assert.deepEqual(result.solutionQueens, target.solutionQueens);
    assert.match(result.note, /not repaired/);
  });
}
await check('grade coordinates, keys and correctness cannot supply or repair the model placement', () => {
  const bogus = { solution_columns_by_row: reference.columns, interpreted_answer: { board_id: reference.id, columns_by_row: reference.columns }, queens: target.solutionQueens, checks: { one_per_region: true, no_touch: true }, correct: true };
  assert.equal(deriveFailureComparison(original, null, bogus).modelQueens, null);
  const result = deriveFailureComparison(original, output, bogus);
  assert.deepEqual(result.modelQueens, target.modelQueens);
  assert.deepEqual(result.conflicts, target.conflicts);
});
await check('prose single-object extraction is diagnostic only and requires saved metadata', () => {
  const prose = written(`Explanation\n${finalText}`);
  assert.equal(deriveFailureComparison(original, prose).modelQueens, null);
  assert.equal(deriveFailureComparison(original, prose, { extraction: { diagnostic_only: true, candidate_count: 2 } }).modelQueens, null);
  assert.equal(deriveFailureComparison(original, prose, { extraction: { candidate_count: 1 } }).modelQueens, null);
  const result = deriveFailureComparison(original, prose, { extraction: { diagnostic_only: true, candidate_count: 1 } });
  assert.deepEqual(result.modelQueens, target.modelQueens);
  assert.match(result.modelSource, /not strict-format success/);
});
await check('valid geometry but strict-format failure stays a format failure, not a geometry violation', () => {
  const formatGrade = { correct: false, format_valid: false, extraction: { diagnostic_only: true, candidate_count: 1 }, failure: 'invalid_format' };
  const result = deriveFailureComparison(original, written(`\`\`\`json\n${JSON.stringify({ board_id: reference.id, columns_by_row: reference.columns })}\n\`\`\``), formatGrade);
  assert.equal(result.matchingCells, 5);
  assert.deepEqual(result.conflicts, []);
  assert.deepEqual(result.mismatchedCells, []);
  assert.equal(formatGrade.correct, false);
  assert.match(result.note, /do not become successes/);
});
await check('duplicate-column and touching written placements remain visible and locally flagged', () => {
  const result = deriveFailureComparison(original, answer(reference.id, [5, 1, 1, 2, 3]));
  assert.deepEqual(result.modelQueens, [[1, 5], [2, 1], [3, 1], [4, 2], [5, 3]]);
  assert.ok(result.conflicts.some(conflict => conflict.label.startsWith('Column 1 has 2')));
  assert.ok(result.conflicts.some(conflict => conflict.label === 'Queens touch: r2c1 and r3c1.'));
});

const fullChoices = { answers: Object.fromEntries(reference.columns.map((column, row) => [`row_${row + 1}`, { type: 'choice', choice: String(column), probabilities: { '1': 1 } }])) };
await check('full Jev visible Choices use actual choice, not probability argmax', () => {
  const result = deriveFailureComparison(jev, fullChoices);
  assert.deepEqual(result.modelQueens, target.solutionQueens);
  assert.equal(result.complete, true);
  assert.equal(result.matchingCells, 5);
  assert.deepEqual(result.conflicts, []);
});
await check('partial Jev Choices do not invent empty-row/column/region violations', () => {
  const req = clone(jev); req.questions = { row_2: req.questions.row_2 };
  const result = deriveFailureComparison(req, { answers: { row_2: { type: 'choice', choice: '1', probabilities: { '3': 0.99, '1': 0.01 } } } });
  assert.deepEqual(result.modelQueens, [[2, 1]]);
  assert.equal(result.complete, false);
  assert.deepEqual(result.mismatchedCells, [[2, 1]]);
  assert.deepEqual(result.conflicts, []);
  assert.match(result.note, /not full-answer violations/);
});
await check('partial Jev conflicting choices retain local touch conflicts without completion errors', () => {
  const req = clone(jev); req.questions = { row_2: req.questions.row_2, row_3: req.questions.row_3 };
  const result = deriveFailureComparison(req, { answers: { row_2: { type: 'choice', choice: '3' }, row_3: { type: 'choice', choice: '4' } } });
  assert.equal(result.complete, false);
  assert.deepEqual(keys(result.conflictCells), keys([[2, 3], [3, 4]]));
  assert.equal(result.conflicts.length, 1);
  assert.equal(result.conflicts[0].label, 'Queens touch: r2c3 and r3c4.');
});
await check('partial Jev repeated row is annotated locally without missing-answer violations', () => {
  const req = clone(jev); req.questions = { row_2: req.questions.row_2 };
  req.state.previous_queen_decisions = [{ row: 2, column: 3 }];
  const result = deriveFailureComparison(req, { answers: { row_2: { type: 'choice', choice: '1' } } });
  assert.deepEqual(result.modelQueens, [[2, 3], [2, 1]]);
  assert.equal(result.complete, false);
  assert.deepEqual(result.conflicts.map(conflict => conflict.label), ['Row 2 has 2 queens: r2c3, r2c1.']);
  assert.deepEqual(keys(result.conflictCells), keys([[2, 3], [2, 1]]));
});
await check('unsupported or malformed Jev Choices are not fabricated from probabilities or input', () => {
  assert.equal(deriveFailureComparison(jev, { answers: {} }).modelQueens, null);
  const out = clone(fullChoices); out.answers.row_1.choice = '6';
  assert.equal(deriveFailureComparison(jev, out).modelQueens, null);
  delete out.answers.row_1.choice; out.answers.row_1.probabilities = { '5': 1 };
  assert.equal(deriveFailureComparison(jev, out).modelQueens, null);
});
await check('multiple visible output interpretations are ambiguous rather than selected between', () => {
  assert.equal(deriveFailureComparison(jev, { ...clone(output), ...fullChoices }, grade).modelQueens, null);
  assert.equal(deriveFailureComparison(jev, { choices: 'malformed written branch', ...fullChoices }, grade).modelQueens, null);
  assert.equal(deriveFailureComparison(jev, { ...clone(output), answers: 'malformed Jev branch' }, grade).modelQueens, null);
});
const trajectoryRegion = await load('runs/2026-09-30-jev-trajectories/sequence-9-3_local_a5_p02_region/request.json');
await check('region-only Choice has no failure solution comparison and retains its static region highlight', () => {
  const regionOutput = { answers: { region: { type: 'choice', choice: 'H' } } };
  assert.equal(deriveFailureComparison(trajectoryRegion, regionOutput), null);
  const staticView = deriveReceiptBoard(trajectoryRegion, regionOutput);
  assert.equal(staticView.frames[1].highlightRegion, 'H');
  assert.deepEqual(staticView.frames[1].queens, [[1, 7]]);
});
await check('valid Noul/Score, scalar, candidate-ranking and unsupported placement encodings stay in their original presentation', () => {
  for (const [questions, answers] of [
    [{ valid: { type: 'noul' } }, { valid: { type: 'noul', value: true } }],
    [{ score: { type: 'score' } }, { score: { type: 'score', value: 0.5 } }],
    [{ row_1: { type: 'score' } }, { row_1: { type: 'score', value: 5 } }],
    [{ pick: { type: 'choice', criteria: { candidate_1: 'Candidate layout.' } } }, { pick: { type: 'choice', choice: 'candidate_1' } }],
    [{ solution: { type: 'choice', criteria: { '5,3,1,4,2': 'A full layout alternative.' } } }, { solution: { type: 'choice', choice: '5,3,1,4,2' } }],
    [{ cell_A: { type: 'choice', criteria: { r2c2: 'Place at row 2 column 2.' } } }, { cell_A: { type: 'choice', choice: 'r2c2' } }],
  ]) {
    const req = clone(jev); req.questions = questions;
    assert.equal(deriveFailureComparison(req, { answers }), null);
    assert.equal(deriveFailureComparison(req, null), null);
  }
});
await check('bare explicit partition or image task without full written-solver semantics gets no solution comparison', () => {
  const stateOnly = clone(jev); delete stateOnly.questions;
  assert.equal(deriveFailureComparison(stateOnly, output, grade), null);
  const imageTask = clone(original);
  imageTask.messages[0].content[0].text = textOf(imageTask).replace('Return a written solution as exactly one JSON object', 'Identify the board size without providing queen positions');
  assert.equal(deriveFailureComparison(imageTask, null), null);
});
await check('public trajectory cell Choice retains prior state and exact selected cell', () => {
  const req = clone(trajectoryRegion);
  req.questions = { cell: { type: 'choice', criteria: { r2c2: 'Row 2 column 2.', r2c6: 'Row 2 column 6.' } } };
  const result = deriveFailureComparison(req, { answers: { cell: { type: 'choice', choice: 'r2c6', probabilities: { r2c2: 0.99, r2c6: 0.01 } } } });
  assert.deepEqual(result.modelQueens, [[1, 7], [2, 6]]);
  assert.equal(result.complete, false);
  assert.deepEqual(result.mismatchedCells, [[2, 6]]);
  assert.deepEqual(keys(result.conflictCells), keys([[1, 7], [2, 6]]));
});
await check('reference/result arrays are not aliases that can mutate frozen evaluator references', () => {
  const result = deriveFailureComparison(original, output, grade);
  result.regions[0][0] = 'changed'; result.solutionQueens[0][1] = 1;
  assert.equal(reference.regions[0][0], 'A');
  assert.equal(reference.columns[0], 5);
  assert.deepEqual(deriveFailureComparison(original, output, grade).solutionQueens, target.solutionQueens);
});
await check('runtime modules have only receipt parser and frozen public snapshot dependencies', () => {
  for (const source of [sources.failureComparisonData, sources.comparisonReferences]) assert.doesNotMatch(source, /\b(?:fetch|readFile|enumerate|solveQueens|boardConfig|BOARDS|solution_columns_by_row)\b/);
  const imports = [...sources.failureComparisonData.matchAll(/^import.*from\s+['"]([^'"]+)['"]/gm)].map(match => match[1]);
  assert.deepEqual(imports.sort(), ['./comparisonReferences', './receiptBoardData']);
  assert.doesNotMatch(sources.comparisonReferences, /^import\s/m);
});

const publicManifest = await load('manifest.json');
const coverage = {};
let unavailableTypedRequests = 0;
for (const record of publicManifest.records) {
  if (!record.files?.request || record.assessmentOutcome !== 'model_failure') continue;
  const [req, response, savedGrade] = await Promise.all(['request', 'response', 'grade'].map(file => record.files[file] ? load(record.files[file]) : null));
  const result = deriveFailureComparison(req, response, savedGrade);
  const group = coverage[record.study] ||= { failures: 0, eligible: 0, placement: 0, unavailable: 0, complete: 0, partial: 0, ineligible: 0 };
  group.failures++;
  if (result) {
    group.eligible++;
    if (result.modelQueens !== null) { group.placement++; group[result.complete ? 'complete' : 'partial']++; }
    else { group.unavailable++; if ('questions' in req) unavailableTypedRequests++; }
  } else group.ineligible++;
}
const totals = Object.values(coverage).reduce((total, group) => {
  for (const [key, value] of Object.entries(group)) total[key] = (total[key] || 0) + value;
  return total;
}, {});
await check('current frozen corpus eligibility excludes non-placement tasks instead of reporting unusable queen answers', () => {
  assert.deepEqual(totals, { failures: 299, eligible: 142, placement: 130, unavailable: 12, complete: 46, partial: 84, ineligible: 157 });
  assert.equal(unavailableTypedRequests, 0);
});
await check('all public evidence byte hashes unchanged after verification', async () => assert.deepEqual(await snapshot(), before));
console.log(`\n${checks} offline failure-comparison checks passed; ${before.length} public files unchanged. No network, browser, model, evidence writes, or private-answer reads.`);
console.log(`Saved model_failure coverage only (non-placement tasks and unknown inputs retain existing presentation):\n${JSON.stringify({ totals, studies: coverage }, null, 2)}`);
