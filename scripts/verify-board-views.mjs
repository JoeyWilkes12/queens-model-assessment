#!/usr/bin/env node
/** Offline adapter checks against preserved public receipts; no inference or writes. */
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';

const source = await readFile(new URL('../src/receiptBoardData.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
const { deriveReceiptBoard } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);
const root = new URL('../public/evidence/runs/', import.meta.url);
const read = async (study, call, file) => JSON.parse(await readFile(new URL(`${study}/${call}/${file}.json`, root), 'utf8'));
const receipt = async (study, call) => Promise.all(['request', 'response', 'grade'].map(file => read(study, call, file)));
const clone = value => JSON.parse(JSON.stringify(value));
let tests = 0;
const check = (label, fn) => { fn(); tests++; console.log(`PASS ${label}`); };

const [request, response, grade] = await receipt('2026-10-01-diagnostic-completion', 'rep1_gpt-4.1__queens-9-hard_region_cells');
const target = deriveReceiptBoard(request, response, grade);
check('exact target reconstructs all 81 cells and invalid answer without repair', () => {
  assert.equal(target.regions.length, 9);
  assert.equal(target.regions.flat().length, 81);
  assert.equal(new Set(target.regions.flat()).size, 9);
  assert.deepEqual(target.frames[0].queens, []);
  assert.deepEqual(target.frames[1].queens, [6, 2, 8, 3, 9, 4, 1, 7, 5].map((column, row) => [row + 1, column]));
  assert.deepEqual(target.frames[1].queens.map(([row, column]) => target.regions[row - 1][column - 1]), ['C', 'B', 'C', 'A', 'H', 'A', 'A', 'G', 'G']);
  assert.equal(grade.correct, false);
  assert.equal(grade.checks.one_per_region, false);
});
const matrixReceipt = await receipt('2026-10-01-diagnostic-completion', 'rep1_gpt-4.1__queens-9-hard_region_grid_rows');
check('actual matrix and cell-list inputs have identical partitions', () => {
  assert.deepEqual(deriveReceiptBoard(...matrixReceipt).regions, target.regions);
});
const textOf = req => req.messages[0].content[0].text;
const withCells = cells => {
  const req = clone(request);
  req.messages[0].content[0].text = textOf(req).replace(/(Region cells \(JSON object\):\n)[^\n]+/, `$1${JSON.stringify(cells)}`);
  return req;
};
const cells = JSON.parse(/Region cells \(JSON object\):\n([^\n]+)/.exec(textOf(request))[1]);
check('missing partition member rejected', () => { const bad = clone(cells); bad.A.pop(); assert.equal(deriveReceiptBoard(withCells(bad), response), null); });
check('overlapping regions rejected', () => { const bad = clone(cells); bad.B.push(bad.A[0]); assert.equal(deriveReceiptBoard(withCells(bad), response), null); });
check('duplicate within one region rejected', () => { const bad = clone(cells); bad.A.push(bad.A[0]); assert.equal(deriveReceiptBoard(withCells(bad), response), null); });
check('out-of-range and noninteger coordinates rejected', () => {
  for (const coordinate of [[0, 1], [10, 1], [1.5, 1], [true, 1]]) { const bad = clone(cells); bad.A[0] = coordinate; assert.equal(deriveReceiptBoard(withCells(bad), response), null); }
});
check('duplicate JSON region keys rejected rather than overwritten', () => {
  const req = clone(request); req.messages[0].content[0].text = textOf(req).replace('"A":', '"A":[],"A":'); assert.equal(deriveReceiptBoard(req, response), null);
});
check('ragged matrix and unknown coordinate orientation rejected', () => {
  const ragged = clone(matrixReceipt[0]); ragged.messages[0].content[0].text = textOf(ragged).replace('"A","B","B","B","B","C","C","C","C"', '"A","B"');
  assert.equal(deriveReceiptBoard(ragged, matrixReceipt[1]), null);
  const zeroBased = clone(request); zeroBased.messages[0].content[0].text = textOf(zeroBased).replace('one-based [row, column]', 'zero-based [row, column]');
  assert.equal(deriveReceiptBoard(zeroBased, response), null);
});
const written = content => ({ choices: [{ message: { content } }] });
const final = response.choices[0].message.content;
check('a prose answer requires saved one-object extraction and remains diagnostic', () => {
  assert.equal(deriveReceiptBoard(request, written(`Explanation\n${final}`)).frames.length, 1);
  const result = deriveReceiptBoard(request, written(`Explanation\n${final}`), { extraction: { diagnostic_only: true, candidate_count: 1 } });
  assert.equal(result.frames.length, 2);
  assert.match(result.frames[1].sourceLabel, /not strict-format success/);
});
check('multiple final answer candidates are never selected between', () => {
  const result = deriveReceiptBoard(request, written(`${final}\n${final}`), { extraction: { diagnostic_only: true, candidate_count: 1 } });
  assert.equal(result.frames.length, 1);
});
check('malformed, wrong-board, duplicate-key and incomplete answer coordinates not repaired', () => {
  for (const answer of [final.replace('queens-9-hard', 'another-board'), final.replace('[6,2,8,3,9,4,1,7,5]', '[6,2]'), final.replace('[6,2,8,3,9,4,1,7,5]', '[0,2,8,3,9,4,1,7,5]'), final.replace('"board_id":', '"board_id":"x","board_id":')]) assert.equal(deriveReceiptBoard(request, written(answer)).frames.length, 1);
});
const batch = await receipt('2026-09-19-jev-scale', 'construction_9');
check('actual Jev typed row choices render exact returned choices including invalid repeats', () => {
  const result = deriveReceiptBoard(...batch);
  assert.equal(result.regions.length, 9);
  assert.equal(result.frames[1].queens.length, 9);
  assert.equal(result.frames[1].queens[0][1], Number(batch[1].answers.row_1.choice));
  assert.equal(result.frames[1].queens[1][1], Number(batch[1].answers.row_2.choice));
  assert.match(result.frames[1].note, /not a reasoning trace/);
});
const sequential = await receipt('2026-09-18-jev-deep-dive', '03_sequential_5_row_3');
check('actual Jev request previous decisions are kept fixed, new row choice added', () => {
  const result = deriveReceiptBoard(...sequential);
  assert.deepEqual(result.frames[0].queens, [[1, 5], [2, 2]]);
  assert.deepEqual(result.frames[1].queens, [[1, 5], [2, 2], [3, 1]]);
});
const region = await receipt('2026-09-30-jev-trajectories', 'sequence-9-3_local_a5_p02_region');
check('actual Jev region Choice highlights region without inventing a queen', () => {
  const result = deriveReceiptBoard(...region);
  assert.deepEqual(result.frames[0].queens, [[1, 7]]);
  assert.deepEqual(result.frames[1].queens, [[1, 7]]);
  assert.equal(result.frames[1].highlightRegion, 'H');
});
check('disagreeing Jev partition encodings rejected', () => {
  const req = clone(region[0]); req.state.region_grid_rows[0][0] = 'B'; assert.equal(deriveReceiptBoard(req, region[1]), null);
});
check('actual Choice is used rather than rounded probability argmax', () => {
  const req = clone(region[0]); req.state.selected_region = 'A'; req.questions = { cell: { type: 'choice', criteria: { r1c1: 'Place queen at row 1, column 1, region A.', r2c2: 'Place queen at row 2, column 2, region A.' } } };
  const result = deriveReceiptBoard(req, { answers: { cell: { type: 'choice', choice: 'r2c2', probabilities: { r1c1: 0.8, r2c2: 0.2 } } } });
  assert.deepEqual(result.frames[0].candidateCells, [[1, 1], [2, 2]]);
  assert.deepEqual(result.frames[1].selectedCell, [2, 2]);
});
const actualCell = await receipt('2026-09-30-jev-trajectories', 'sequence-7-2_local_a5_p02_cell');
check('actual Jev cell receipt overlays its returned choice and exact request menu', () => {
  const result = deriveReceiptBoard(...actualCell);
  assert.equal(result.frames.length, 2);
  const selected = /^r(\d+)c(\d+)$/.exec(actualCell[1].answers.cell.choice).slice(1).map(Number);
  assert.deepEqual(result.frames[1].selectedCell, selected);
  assert.equal(result.frames[0].candidateCells.length, Object.keys(actualCell[0].questions.cell.criteria).length);
});
check('invalid Jev givens and choices cannot be repaired or fabricated', () => {
  const req = clone(region[0]); req.state.placed_queens[0].column = 0; assert.equal(deriveReceiptBoard(req, region[1]), null);
  const out = clone(region[1]); out.answers.region.choice = 'not-in-the-menu'; assert.equal(deriveReceiptBoard(region[0], out).frames.length, 1);
});
check('grade solution-like fields never supply queens', () => {
  const result = deriveReceiptBoard(request, null, { solution_columns_by_row: [1, 2, 3], interpreted_answer: { columns_by_row: [1, 2, 3] } });
  assert.equal(result.frames.length, 1); assert.deepEqual(result.frames[0].queens, []);
});
check('image-only or unstructured prose inputs do not receive guessed board mappings', () => {
  assert.equal(deriveReceiptBoard({ messages: [{ role: 'user', content: 'Board ID: queens-9-hard\nN: 9\n[image only]' }] }, response, grade), null);
});
check('adapter has no hidden-solution, canonical-board, solver or runtime import dependency', () => {
  assert.doesNotMatch(source, /^import\s/m);
  assert.doesNotMatch(source, /boardConfig|BOARDS|solution_columns_by_row|readFile|fetch\s*\(/);
});
console.log(`\n${tests} board-view checks passed; exact receipts only; no network, inference, evidence writes, or answer-key reads.`);

const manifest = JSON.parse(await readFile(new URL('../public/evidence/manifest.json', import.meta.url), 'utf8'));
const records = Array.isArray(manifest) ? manifest : [...(manifest.records || []), ...(manifest.gradeRecords || [])];
const coverage = {};
for (const record of records) {
  if (!record.files?.request) continue;
  const files = record.files;
  const base = new URL('../public/evidence/', import.meta.url);
  const load = async file => file ? JSON.parse(await readFile(new URL(file, base), 'utf8')) : null;
  const [req, out, savedGrade] = await Promise.all([load(files.request), load(files.response), load(files.grade)]);
  const supported = deriveReceiptBoard(req, out, savedGrade);
  const study = record.study || record.id.split(':')[0];
  coverage[study] ||= { requests: 0, board_views: 0, response_overlays: 0 };
  coverage[study].requests++;
  if (supported) { coverage[study].board_views++; if (supported.frames.length > 1) coverage[study].response_overlays++; }
}
console.log(`\nOffline current-bundle coverage (unsupported receipts keep raw JSON):\n${JSON.stringify(coverage, null, 2)}`);
