#!/usr/bin/env node

/**
 * Build the static, public evidence bundle used by the local assessment site.
 *
 * This script intentionally has no network or package dependencies.  It reads
 * the five completed evaluation studies, keeps model-visible requests and
 * evaluator-visible records, removes private/sensitive fields, and writes a
 * searchable manifest plus a small, predictable file tree under public/.
 */

import { createHash } from "node:crypto";
import { mkdir, readdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const SITE_DIR = path.resolve(SCRIPT_DIR, "..");
const PROJECT_ROOT = path.resolve(SITE_DIR, "../../..");
const EVALUATIONS_DIR = path.join(PROJECT_ROOT, "evaluations");
const OUTPUT_DIR = path.join(SITE_DIR, "public", "evidence");
const README_SOURCE = path.join(SITE_DIR, "evidence", "README.md");
const INLINE_ASSETS = new Map();

// These are the five source studies.  The comprehensive directory contains
// this site and is deliberately not treated as an evidence input study.
const STUDIES = [
  "2026-09-17-one-shot",
  "2026-09-18-jev-5x5-variations",
  "2026-09-18-jev-deep-dive",
  "2026-09-19-jev-primitives",
  "2026-09-19-jev-scale",
];

// Grade sources are deliberately explicit.  Discovery dumps, catalogs,
// manifests, billing records, and other planning artifacts are not evidence
// records consumed by the site.
const GRADE_SOURCES = {
  "2026-09-17-one-shot": ["grades.json"],
  "2026-09-18-jev-5x5-variations": ["audit.json"],
  "2026-09-18-jev-deep-dive": ["grades/*.json"],
  "2026-09-19-jev-primitives": ["audit.json", "candidate_scores.json"],
  "2026-09-19-jev-scale": ["audit.json"],
};

// Records here remain in the public bundle and manifest, but the atlas omits
// them from its default browse view. Exclusion is deliberately curated rather
// than inferred from HTTP status: intentional compatibility probes and genuine
// transport failures are still first-class study evidence.
const EXCLUDED_RECORDS = new Map([
  [
    "2026-09-17-one-shot:03_queens-5-easy_grok-4.6",
    "Pre-inference provider-routing rejection caused by the direct-xAI request route conflicting with the account allowlist; superseded by the same-input Amazon Bedrock run.",
  ],
  [
    "2026-09-18-jev-deep-dive:01_unchanged_5x5",
    "Pre-inference endpoint rejection: the Jev Decisions model was submitted to the chat-completions endpoint and returned no model answer.",
  ],
  [
    "2026-09-18-jev-deep-dive:02_batch_5x5",
    "Pre-inference provider-routing rejection caused by the TypeSafe provider not yet being present in the account allowlist.",
  ],
  [
    "2026-09-18-jev-deep-dive:02_batch_5x5_provider_enabled",
    "Pre-inference provider-routing rejection caused by the TypeSafe provider not yet being present in the key guardrail.",
  ],
  [
    "2026-09-19-jev-scale:original_7",
    "Pre-inference endpoint rejection: the Jev Decisions model was intentionally probed through chat completions and returned no model answer.",
  ],
  [
    "2026-09-19-jev-scale:original_9",
    "Pre-inference endpoint rejection: the Jev Decisions model was intentionally probed through chat completions and returned no model answer.",
  ],
]);

const ERROR_CONTEXTS = new Map([
  [
    "2026-09-17-one-shot:03_queens-5-easy_grok-4.6",
    {
      category: "Request routing",
      title: "The request was rejected before inference",
      interpretation: "The request forced the direct xAI route while the account provider allowlist excluded xAI. No generation ID, model output, or usage record was returned, so this is not a Grok Queens result.",
      followUp: "The same model input was sent through the approved Amazon Bedrock route and produced a correct graded answer.",
    },
  ],
  [
    "2026-09-18-jev-deep-dive:01_unchanged_5x5",
    {
      category: "Endpoint mismatch",
      title: "A Decisions model was sent to chat completions",
      interpretation: "OpenRouter returned HTTP 400 because Jev requires the Decisions endpoint. No model answer was produced, so the record establishes interface incompatibility rather than a Queens failure.",
      followUp: "The study moved to the Decisions endpoint with text state and typed questions.",
    },
  ],
  [
    "2026-09-18-jev-deep-dive:02_batch_5x5",
    {
      category: "Provider allowlist",
      title: "The TypeSafe route was unavailable to the account",
      interpretation: "OpenRouter returned HTTP 404 before inference because the request required TypeSafe while the account allowlist did not yet include it. No Jev answer was produced.",
      followUp: "After the account allowlist changed, a separate key-guardrail rejection was captured before the approved request succeeded.",
    },
  ],
  [
    "2026-09-18-jev-deep-dive:02_batch_5x5_provider_enabled",
    {
      category: "Key guardrail",
      title: "The route remained blocked by the key guardrail",
      interpretation: "OpenRouter returned HTTP 404 before inference because the workspace key guardrail still excluded the TypeSafe provider. This is configuration evidence, not a model response.",
      followUp: "The subsequent guardrail-enabled request reached Jev and returned typed decisions.",
    },
  ],
  [
    "2026-09-19-jev-primitives:heldout-9-2_construct_matrix",
    {
      category: "Upstream transport",
      title: "HTTP 520 returned no model answer",
      interpretation: "The saved response contains only HTTP 520, with no generation ID, returned model or provider, usage, or answer. Cloudflare defines 520 as an empty, unknown, or unexpected response from an origin; the retained record does not reveal the deeper upstream cause. It must not be scored as a Queens failure.",
      followUp: "One bounded retry used the same request hash and completed. That retry reached the model, but its returned placement failed the deterministic Queens checks.",
      sourceUrl: "https://developers.cloudflare.com/support/troubleshooting/http-status-codes/cloudflare-5xx-errors/error-520/",
      sourceLabel: "Cloudflare error 520 documentation",
    },
  ],
  [
    "2026-09-19-jev-scale:original_7",
    {
      category: "Endpoint mismatch",
      title: "The 7×7 compatibility probe never reached Jev",
      interpretation: "OpenRouter returned HTTP 400 because the Jev Decisions model was sent to chat completions. There is no model answer to assess.",
      followUp: "The paired native 7×7 construction request used the Decisions endpoint and is retained separately.",
    },
  ],
  [
    "2026-09-19-jev-scale:original_9",
    {
      category: "Endpoint mismatch",
      title: "The 9×9 compatibility probe never reached Jev",
      interpretation: "OpenRouter returned HTTP 400 because the Jev Decisions model was sent to chat completions. There is no model answer to assess.",
      followUp: "The paired native 9×9 construction request used the Decisions endpoint and is retained separately.",
    },
  ],
]);

const PRIVATE_KEY = /^(?:reasoning_details|encrypted_reasoning|api[_-]?key|authorization|proxy[_-]?authorization|access[_-]?token|refresh[_-]?token|client[_-]?secret|password|credential(?:s)?|user[_-]?id)$/i;

function safePart(value) {
  const text = String(value ?? "unknown")
    .replace(/[^A-Za-z0-9._-]+/g, "_")
    .replace(/^\.+/, "")
    .slice(0, 160);
  return text || "unknown";
}

function relativeProject(filePath) {
  return path.relative(PROJECT_ROOT, filePath).split(path.sep).join("/");
}

function relativeOutput(filePath) {
  return path.relative(OUTPUT_DIR, filePath).split(path.sep).join("/");
}

function sanitize(value) {
  if (Array.isArray(value)) return value.map(sanitize);
  if (!value || typeof value !== "object") return value;

  const result = {};
  for (const [key, child] of Object.entries(value)) {
    // Encrypted model reasoning and credential-like fields are never part of
    // the public evidence contract.  This is recursive so provider-specific
    // response shapes receive the same treatment.
    if (PRIVATE_KEY.test(key)) continue;
    result[key] = sanitize(child);
  }
  return result;
}

function replaceInlineImage(value) {
  if (Array.isArray(value)) return value.map(replaceInlineImage);
  if (!value || typeof value !== "object") return value;

  // Requests in the original studies embed the board PNG as a data URL.  A
  // static evidence bundle should keep the prompt and attachment provenance
  // without shipping a large opaque base64 field.  The content-addressed
  // reference is stable across studies that used the same board image.
  if (typeof value.url === "string" && value.url.startsWith("data:image/")) {
    const separator = value.url.indexOf(",");
    const header = separator >= 0 ? value.url.slice(0, separator) : value.url;
    const encoded = separator >= 0 ? value.url.slice(separator + 1) : "";
    const bytes = Buffer.from(encoded, "base64");
    const mediaType = header.slice("data:".length).split(";", 1)[0] || "image/png";
    const digest = createHash("sha256").update(bytes).digest("hex");
    const extension = mediaType === "image/jpeg"
      ? "jpg"
      : mediaType === "image/webp"
        ? "webp"
        : "png";
    const assetPath = `assets/${digest}.${extension}`;
    INLINE_ASSETS.set(assetPath, bytes);
    return {
      asset_ref: `request-inline-image://sha256/${digest}`,
      asset_path: assetPath,
      media_type: mediaType,
      sha256: digest,
      bytes: bytes.length,
    };
  }

  const result = {};
  for (const [key, child] of Object.entries(value)) {
    if (PRIVATE_KEY.test(key)) continue;
    result[key] = replaceInlineImage(child);
  }
  return result;
}

async function exists(filePath) {
  try {
    await stat(filePath);
    return true;
  } catch (error) {
    if (error.code === "ENOENT") return false;
    throw error;
  }
}

async function readJson(filePath) {
  const raw = await readFile(filePath, "utf8");
  return JSON.parse(raw);
}

async function writeJson(filePath, value) {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(sanitize(value), null, 2)}\n`, "utf8");
}

function parseBoard(request, run) {
  const fromState = request?.state?.board_id;
  if (fromState) return fromState;

  const text = request?.messages
    ?.flatMap((message) => (Array.isArray(message.content) ? message.content : []))
    ?.find((part) => part.type === "text")?.text;
  const fromPrompt = text?.match(/Board ID:\s*([^\s]+)/i)?.[1];
  if (fromPrompt) return fromPrompt;

  const fromRun = String(run).match(/((?:queens|heldout)-\d+(?:-[A-Za-z0-9]+){1,2})/i)?.[1];
  if (fromRun) return fromRun;

  const fromSize = String(run).match(/(?:^|[_-])(\d+)(?:x\1)?(?:[_-]|$)/)?.[1];
  return fromSize ? `size-${fromSize}` : null;
}

function parseModel(request, metadata, response) {
  return request?.model
    ?? metadata?.model
    ?? metadata?.returned_model
    ?? response?.model
    ?? null;
}

function providerLabel(value) {
  if (!value || typeof value !== "string") return null;
  const normalized = value.replace(/^~/, "").toLowerCase();
  const labels = {
    "anthropic": "Anthropic",
    "google": "Google",
    "openai": "OpenAI",
    "typesafe": "TypeSafe",
    "x-ai": "xAI",
    "xai": "xAI",
  };
  return labels[normalized] ?? value;
}

function parseProvider(model) {
  const modelNamespace = typeof model === "string" ? model.split("/")[0] : null;
  return providerLabel(modelNamespace);
}

function parseModelVersion(request, metadata, response) {
  return metadata?.returned_model
    ?? response?.model
    ?? metadata?.model
    ?? request?.model
    ?? null;
}

function parseSize(request, board, run) {
  if (Number.isInteger(request?.state?.size)) return request.state.size;
  const boardSize = String(board ?? "").match(/(?:queens|heldout)-(\d+)/i)?.[1];
  if (boardSize) return Number(boardSize);
  const runSize = String(run).match(/(?:^|[_-])(\d+)(?:x\1)?(?:[_-]|$)/)?.[1];
  return runSize ? Number(runSize) : null;
}

function responseStatus({ response, metadata, rawDirExists }) {
  const httpStatus = metadata?.http_status;
  if (response?.error || (Number.isInteger(httpStatus) && httpStatus >= 400)) return "error";
  if (response) return "success";
  if (!rawDirExists) return "not_run";
  if (metadata?.exception_type || metadata?.halt_reason) return "timeout_or_transport_failure";
  return "missing_response";
}

function failureSummary({ response, metadata, partialResponse }) {
  const failure = {};
  if (response?.error) failure.error = response.error;
  else if (metadata?.error) failure.error = metadata.error;
  if (Number(metadata?.http_status) >= 400) failure.httpStatus = metadata.http_status;
  if (metadata?.exception_type) failure.exceptionType = metadata.exception_type;
  if (metadata?.halt_reason) failure.haltReason = metadata.halt_reason;
  if (partialResponse) failure.partialResponse = true;
  return Object.keys(failure).length ? sanitize(failure) : null;
}

function addGradeEntry(map, callId, value) {
  if (!callId) return;
  const previous = map.get(callId);
  if (previous === undefined) map.set(callId, value);
  else if (Array.isArray(previous)) map.set(callId, [...previous, value]);
  else map.set(callId, [previous, value]);
}

function collectCallEntries(value, map) {
  if (Array.isArray(value)) {
    for (const item of value) {
      if (item && typeof item === "object") addGradeEntry(map, item.call_id, item);
    }
    return;
  }
  if (!value || typeof value !== "object") return;
  for (const key of ["attempts", "records", "errors"]) {
    if (Array.isArray(value[key])) collectCallEntries(value[key], map);
  }
}

function deepDiveAssignments(sourceName, run) {
  const stem = path.basename(sourceName, ".json");
  const direct = {
    batch_5: /^02_batch_5x5$/,
    batch_7: /^02_batch_7x7$/,
    batch_9: /^02_batch_9x9$/,
    sequential_5: /^03_sequential_5_row_/,
    recognition_5: /^04_recognition_5_all120$/,
    grid_reading_5: /^05_grid_reading_5$/,
  };
  return direct[stem]?.test(run) ?? false;
}

function boardFromGrade(data, sourceName) {
  if (data?.interpreted_answer?.board_id) return data.interpreted_answer.board_id;
  const arrays = [data, data?.records, data?.attempts].filter(Array.isArray).flat();
  const board = arrays.find((item) => item?.board_id)?.board_id;
  if (board) return board;
  return String(sourceName).match(/(?:queens|heldout)-\d+(?:-[A-Za-z0-9]+){1,2}/i)?.[0] ?? null;
}

async function expandGradeSources(study) {
  const studyDir = path.join(EVALUATIONS_DIR, study);
  const definitions = GRADE_SOURCES[study] ?? [];
  const sources = [];
  for (const definition of definitions) {
    if (definition.endsWith("/*.json")) {
      const gradeDir = path.join(studyDir, definition.slice(0, -"*.json".length));
      const entries = (await readdir(gradeDir, { withFileTypes: true })).filter(
        (entry) => entry.isFile() && entry.name.endsWith(".json"),
      );
      for (const entry of entries) sources.push(path.join(gradeDir, entry.name));
    } else {
      sources.push(path.join(studyDir, definition));
    }
  }

  const gradeByRun = new Map();
  const outputRecords = [];
  for (const sourcePath of sources.sort()) {
    if (!(await exists(sourcePath))) continue;
    const sourceData = await readJson(sourcePath);
    const sanitized = sanitize(sourceData);
    const relativeSource = relativeProject(sourcePath);
    const outputPath = path.join(
      OUTPUT_DIR,
      "grades",
      safePart(study),
      safePart(path.basename(sourcePath)),
    );
    await writeJson(outputPath, sanitized);

    const callEntries = new Map();
    collectCallEntries(sourceData, callEntries);
    for (const [callId, grade] of callEntries) {
      const existing = gradeByRun.get(callId) ?? [];
      existing.push({ grade: sanitize(grade), source: relativeOutput(outputPath), sourceProject: relativeSource });
      gradeByRun.set(callId, existing);
    }

    outputRecords.push({
      id: `grade:${study}:${path.basename(sourcePath, ".json")}`,
      study,
      board: boardFromGrade(sourceData, path.basename(sourcePath)),
      model: null,
      modelVersion: null,
      provider: null,
      run: null,
      kind: "grade-source",
      status: "success",
      hasResponse: false,
      hasMetadata: false,
      hasGrade: true,
      partialResponse: false,
      files: {
        request: null,
        response: null,
        metadata: null,
        grade: relativeOutput(outputPath),
      },
      path: relativeOutput(outputPath),
      source: relativeSource,
      failure: null,
    });
  }

  return { gradeByRun, outputRecords };
}

function gradeForRun(study, run, gradeByRun, gradeSources) {
  const entries = gradeByRun.get(run) ?? [];
  const assigned = gradeSources.filter((source) => deepDiveAssignments(source.source, run));
  const candidates = [
    ...entries,
    ...assigned.map((source) => ({ grade: source.data, source: source.path, sourceProject: source.sourceProject })),
  ];
  return candidates[0] ?? null;
}

function gradeCorrectness(grade) {
  if (!grade || typeof grade !== "object") return null;
  if (typeof grade.correct === "boolean") return grade.correct;
  if (typeof grade.correct === "number" && typeof grade.total === "number") {
    return grade.correct === grade.total;
  }
  if (typeof grade.task_correct === "boolean") return grade.task_correct;
  if (typeof grade.engine?.correct === "boolean") return grade.engine.correct;
  if (typeof grade.choice_correct === "boolean") return grade.choice_correct;
  return null;
}

function assessmentOutcome(status, grade) {
  if (status === "not_run") return "not_run";
  if (status !== "success") return "request_failure";
  const correct = gradeCorrectness(grade?.grade);
  if (correct === true) return "success";
  if (correct === false) return "model_failure";
  return "ungraded";
}

async function buildStudy(study) {
  const studyDir = path.join(EVALUATIONS_DIR, study);
  const requestsDir = path.join(studyDir, "requests");
  const rawDir = path.join(studyDir, "raw");
  const { gradeByRun, outputRecords: gradeRecords } = await expandGradeSources(study);

  // Keep the complete sanitized grade source available for reviewers while
  // also exposing an exact per-run grade record when one can be identified.
  const gradeSourceData = [];
  for (const definition of GRADE_SOURCES[study] ?? []) {
    if (definition.endsWith("/*.json")) {
      const dir = path.join(studyDir, definition.slice(0, -"*.json".length));
      for (const entry of (await readdir(dir, { withFileTypes: true })).filter((item) => item.isFile() && item.name.endsWith(".json"))) {
        const source = path.join(dir, entry.name);
        if (await exists(source)) gradeSourceData.push({ source, data: await readJson(source) });
      }
    } else {
      const source = path.join(studyDir, definition);
      if (await exists(source)) gradeSourceData.push({ source, data: await readJson(source) });
    }
  }

  const requestFiles = (await readdir(requestsDir, { withFileTypes: true }))
    .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
    .map((entry) => entry.name)
    .sort();

  const records = [];
  for (const requestFile of requestFiles) {
    const run = path.basename(requestFile, ".json");
    const requestPath = path.join(requestsDir, requestFile);
    const request = await readJson(requestPath);
    const runSourceDir = path.join(rawDir, run);
    const rawDirExists = await exists(runSourceDir);
    const metadataPath = path.join(runSourceDir, "metadata.json");
    const responsePath = path.join(runSourceDir, "response.json");
    const partialResponsePath = path.join(runSourceDir, "response.partial");
    const hasMetadata = await exists(metadataPath);
    const hasResponse = await exists(responsePath);
    const partialResponse = await exists(partialResponsePath);
    const metadata = hasMetadata ? await readJson(metadataPath) : null;
    const response = hasResponse ? await readJson(responsePath) : null;
    const board = parseBoard(request, run);
    const model = parseModel(request, metadata, response);
    const modelVersion = parseModelVersion(request, metadata, response);
    const provider = parseProvider(model);
    const size = parseSize(request, board, run);
    const status = responseStatus({ response, metadata, rawDirExists });
    const grade = gradeForRun(study, run, gradeByRun, gradeSourceData.map(({ source, data }) => ({
      source: path.basename(source),
      sourceProject: relativeProject(source),
      path: relativeOutput(path.join(OUTPUT_DIR, "grades", safePart(study), safePart(path.basename(source)))),
      data: sanitize(data),
    })));

    const outputRunDir = path.join(OUTPUT_DIR, "runs", safePart(study), safePart(run));
    await writeJson(path.join(outputRunDir, "request.json"), replaceInlineImage(request));
    if (metadata) await writeJson(path.join(outputRunDir, "metadata.json"), metadata);
    if (response) await writeJson(path.join(outputRunDir, "response.json"), response);
    let gradePath = null;
    if (grade) {
      gradePath = path.join(outputRunDir, "grade.json");
      await writeJson(gradePath, grade.grade);
    }

    const recordId = `${study}:${run}`;
    const exclusionReason = EXCLUDED_RECORDS.get(recordId) ?? null;
    const errorContext = ERROR_CONTEXTS.get(recordId) ?? null;
    const outcome = assessmentOutcome(status, grade);
    records.push({
      id: recordId,
      study,
      board,
      size,
      model,
      modelVersion,
      provider,
      run,
      status,
      hasResponse,
      hasMetadata,
      hasGrade: Boolean(grade),
      partialResponse,
      assessmentOutcome: outcome,
      ...(exclusionReason ? { excluded: true, exclusionReason } : {}),
      ...(errorContext ? { errorContext } : {}),
      files: {
        request: relativeOutput(path.join(outputRunDir, "request.json")),
        response: response ? relativeOutput(path.join(outputRunDir, "response.json")) : null,
        metadata: metadata ? relativeOutput(path.join(outputRunDir, "metadata.json")) : null,
        grade: gradePath ? relativeOutput(gradePath) : null,
      },
      source: {
        request: relativeProject(requestPath),
        response: response ? relativeProject(responsePath) : null,
        metadata: metadata ? relativeProject(metadataPath) : null,
        grade: grade?.sourceProject ?? null,
      },
      failure: failureSummary({ response, metadata, partialResponse }),
    });
  }

  return { records, gradeRecords };
}

function addToIndex(index, key, value, recordId) {
  if (!value) return;
  index[key] ??= {};
  index[key][String(value)] ??= [];
  index[key][String(value)].push(recordId);
}

function buildIndex(records, gradeRecords) {
  const index = { study: {}, board: {}, model: {}, modelVersion: {}, provider: {}, run: {}, excluded: {}, assessmentOutcome: {} };
  for (const record of [...records, ...gradeRecords]) {
    addToIndex(index, "study", record.study, record.id);
    addToIndex(index, "board", record.board, record.id);
    addToIndex(index, "model", record.model, record.id);
    addToIndex(index, "modelVersion", record.modelVersion, record.id);
    addToIndex(index, "provider", record.provider, record.id);
    addToIndex(index, "run", record.run, record.id);
    if (record.excluded) addToIndex(index, "excluded", "true", record.id);
    addToIndex(index, "assessmentOutcome", record.assessmentOutcome, record.id);
  }
  for (const dimension of Object.values(index)) {
    for (const values of Object.values(dimension)) values.sort();
  }
  return index;
}

function assertPublic(value, location = "manifest") {
  if (Array.isArray(value)) {
    value.forEach((child, index) => assertPublic(child, `${location}[${index}]`));
    return;
  }
  if (!value || typeof value !== "object") return;
  for (const [key, child] of Object.entries(value)) {
    if (PRIVATE_KEY.test(key)) throw new Error(`Sensitive key survived sanitization at ${location}.${key}`);
    assertPublic(child, `${location}.${key}`);
  }
}

async function main() {
  if (!(await exists(README_SOURCE))) {
    throw new Error(`Missing evidence README source: ${README_SOURCE}`);
  }
  await rm(OUTPUT_DIR, { recursive: true, force: true });
  await mkdir(OUTPUT_DIR, { recursive: true });
  await writeFile(path.join(OUTPUT_DIR, "README.md"), await readFile(README_SOURCE, "utf8"), "utf8");

  const allRecords = [];
  const allGradeRecords = [];
  for (const study of STUDIES) {
    const result = await buildStudy(study);
    allRecords.push(...result.records);
    allGradeRecords.push(...result.gradeRecords);
  }
  for (const [assetPath, bytes] of INLINE_ASSETS) {
    const outputPath = path.join(OUTPUT_DIR, assetPath);
    await mkdir(path.dirname(outputPath), { recursive: true });
    await writeFile(outputPath, bytes);
  }
  allRecords.sort((a, b) => a.id.localeCompare(b.id));
  allGradeRecords.sort((a, b) => a.id.localeCompare(b.id));

  const manifest = {
    schemaVersion: 1,
    sourceRoot: "evaluations",
    studies: STUDIES,
    counts: {
      studies: STUDIES.length,
      requests: allRecords.length,
      responses: allRecords.filter((record) => record.hasResponse).length,
      metadata: allRecords.filter((record) => record.hasMetadata).length,
      grades: allRecords.filter((record) => record.hasGrade).length,
      gradeSources: allGradeRecords.length,
      inlineImageAssets: INLINE_ASSETS.size,
      excluded: allRecords.filter((record) => record.excluded).length,
      assessmentOutcomes: Object.fromEntries(
        [...new Set(allRecords.map((record) => record.assessmentOutcome))].sort().map((outcome) => [
          outcome,
          allRecords.filter((record) => record.assessmentOutcome === outcome).length,
        ]),
      ),
      statuses: Object.fromEntries(
        [...new Set(allRecords.map((record) => record.status))].sort().map((status) => [
          status,
          allRecords.filter((record) => record.status === status).length,
        ]),
      ),
    },
    index: buildIndex(allRecords, allGradeRecords),
    records: allRecords,
    gradeRecords: allGradeRecords,
  };
  assertPublic(manifest);
  await writeJson(path.join(OUTPUT_DIR, "manifest.json"), manifest);

  // Verify the generated tree cannot accidentally contain a private path.
  const outputFiles = [];
  async function walk(directory) {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const filePath = path.join(directory, entry.name);
      if (entry.isDirectory()) await walk(filePath);
      else outputFiles.push(filePath);
    }
  }
  await walk(OUTPUT_DIR);
  for (const filePath of outputFiles) {
    const relative = relativeOutput(filePath);
    if (/(?:^|\/)(?:private|tmp|pdf)(?:\/|$)/i.test(relative)) {
      throw new Error(`Forbidden generated path: ${relative}`);
    }
  }

  console.log(JSON.stringify({
    output: relativeProject(OUTPUT_DIR),
    manifest: relativeProject(path.join(OUTPUT_DIR, "manifest.json")),
    counts: manifest.counts,
    statuses: manifest.counts.statuses,
  }, null, 2));
}

main().catch((error) => {
  console.error(error.stack ?? error.message ?? error);
  process.exitCode = 1;
});
