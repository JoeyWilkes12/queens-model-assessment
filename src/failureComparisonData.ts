import { deriveReceiptBoard, submittedQueens, type Cell } from './receiptBoardData'
import { comparisonLineageManifest, comparisonReferences, type ComparisonReference } from './comparisonReferences'

export type FailureComparisonData = {
  regions: string[][]
  modelQueens: readonly Cell[] | null
  solutionQueens: readonly Cell[]
  mismatchedCells: readonly Cell[]
  conflictCells: readonly Cell[]
  conflicts: { label: string; cells: readonly Cell[] }[]
  modelLabel: string
  modelSource: string
  referenceSource: string
  bindingSource: string
  complete: boolean
  matchingCells: number
  note: string
}

type ObjectValue = Record<string, unknown>
const object = (value: unknown): ObjectValue | null => value !== null && typeof value === 'object' && !Array.isArray(value) ? value as ObjectValue : null
const key = ([row, column]: Cell) => `${row},${column}`
const named = ([row, column]: Cell) => `r${row}c${column}`
const unique = (cells: readonly Cell[]): Cell[] => [...new Map(cells.map(cell => [key(cell), cell])).values()]
const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b)
const canonicalStateAxes = 'Rows top to bottom; columns left to right; both start at 1.'
const imageAxes = 'Row numbers increase from top to bottom and column numbers from left to right, both starting at 1.'

/** Deliberately recognizes only the published sanitized image-pointer schema. */
function imageReference(value: unknown): ComparisonReference | null {
  const pointer = object(value)
  if (!pointer || Object.keys(pointer).sort().join(',') !== 'asset_path,asset_ref,bytes,media_type,sha256') return null
  const reference = comparisonReferences.find(entry => entry.image?.sha256 === pointer.sha256)
  const image = reference?.image
  if (!reference || !image || pointer.asset_ref !== `request-inline-image://sha256/${image.sha256}`
    || pointer.asset_path !== image.assetPath || pointer.bytes !== image.bytes || pointer.media_type !== 'image/png') return null
  return reference
}

/** No board-ID-only lookup: bind a full partition or an explicitly registered image. */
function bind(request: ObjectValue): { reference: ComparisonReference; source: string; receipt: ReturnType<typeof deriveReceiptBoard> } | null {
  const state = object(request.state)
  if ('state' in request && !state) return null
  if (state && (('coordinates' in state && state.coordinates !== canonicalStateAxes)
    || ('row_direction' in state && state.row_direction !== 'top to bottom')
    || ('column_direction' in state && state.column_direction !== 'left to right'))) return null

  const texts: string[] = []
  const images: { value: unknown; message: number }[] = []
  let finalUser = -1
  if ('messages' in request) {
    if (!Array.isArray(request.messages)) return null
    for (let index = 0; index < request.messages.length; index++) {
      const message = object(request.messages[index])
      if (!message) return null
      if (message.role === 'user') finalUser = index
      const content = message.content
      if (typeof content === 'string') { if (message.role === 'user') texts.push(content); continue }
      if (!Array.isArray(content)) return null
      for (const item of content) {
        const part = object(item)
        if (!part) return null
        if (part.type === 'text') {
          if (typeof part.text !== 'string') return null
          if (message.role === 'user') texts.push(part.text)
        } else if (part.type === 'image_url') images.push({ value: part.image_url, message: index })
        else return null // Unknown image/content encodings never silently disappear.
      }
    }
  }
  if (images.length > 1 || (images.length === 1 && images[0].message !== finalUser)) return null
  // Refuse contradictory axes even if a canonical substring is also present.
  if (texts.some(text => /bottom[ -]to[ -]top|right[ -]to[ -]left|zero[ -]based|(?:start(?:ing)?|numbered)\s+(?:at|from)\s+0\b/i.test(text))) return null
  const ids = texts.flatMap(text => [...text.matchAll(/^Board ID:\s*([^\r\n]+)\s*$/gm)].map(match => match[1].trim()))
  const sizes = texts.flatMap(text => [...text.matchAll(/^N:\s*(\d+)\s*$/gm)].map(match => Number(match[1])))
  if (ids.length > 1 || sizes.length > 1 || ids.length !== sizes.length) return null
  const partitionMentions = texts.filter(text => /Region (?:cells|grid rows)/.test(text))
  const markers = texts.flatMap(text => [...text.matchAll(/^Region (?:cells \(JSON object\)|grid rows \(JSON matrix\)):\s*/gm)])
  if (partitionMentions.length !== markers.length || markers.length > 1) return null

  const receipt = deriveReceiptBoard(request, null)
  if ('state' in request && !receipt) return null // Never fall through from a malformed state.
  let explicit = receipt
  if (state && markers.length) {
    const { state: omitted, ...promptRequest } = request
    void omitted
    const prompt = deriveReceiptBoard(promptRequest, null)
    if (!prompt || !receipt || !same(prompt.regions, receipt.regions)) return null
    explicit = prompt
  }
  if (markers.length && !explicit) return null
  const boardId = state?.board_id ?? ids[0]
  const size = state?.size ?? sizes[0]
  if ((ids.length && ids[0] !== boardId) || (sizes.length && sizes[0] !== size)) return null
  const image = images.length ? imageReference(images[0].value) : null
  if (images.length && (!image || !texts.some(text => text.includes(imageAxes)) || ids.length !== 1)) return null
  const reference = image ?? comparisonReferences.find(entry => entry.id === boardId && entry.size === size && explicit && same(entry.regions, explicit.regions))
  if (!reference || reference.id !== boardId || reference.size !== size
    || (explicit && !same(reference.regions, explicit.regions))) return null
  if (!image && !explicit) return null
  const source = image
    ? `Exact published image SHA-256 ${reference.image!.sha256}; matching board ID, size and one-based axes; image-to-partition lineage in public ${comparisonLineageManifest.path} (${reference.image!.lineageCallId}).`
    : `Exact full partition, board ID, size and one-based axes match public ${reference.publicRequest}; partition SHA-256 ${reference.partitionSha256}.`
  return { reference, source, receipt }
}

/** Compare placement tasks only, not valid scalar, ranking or region-only answers. */
function asksForPlacement(request: ObjectValue, size: number): boolean {
  if ('questions' in request) {
    const questions = object(request.questions)
    if (!questions) return false
    const names = Object.keys(questions)
    const rowChoices = names.length > 0 && names.every(name => /^row_[1-9]\d*$/.test(name) && Number(name.slice(4)) <= size)
    const cellChoice = names.length === 1 && names[0] === 'cell'
    if (!rowChoices && !cellChoice) return false
    return names.every(name => {
      const question = object(questions[name])
      const criteria = object(question?.criteria)
      return question?.type === 'choice' && criteria !== null && Object.keys(criteria).length > 0
    })
  }
  if (!Array.isArray(request.messages)) return false
  const finalUser = [...request.messages].reverse().map(object).find(message => message?.role === 'user')
  const content = finalUser?.content
  const texts = typeof content === 'string' ? [content] : Array.isArray(content) ? content.map(object).filter(part => part?.type === 'text').map(part => part?.text).filter((text): text is string => typeof text === 'string') : []
  return texts.some(text => text.includes('Return a written solution as exactly one JSON object') && text.includes('"columns_by_row"'))
}

/** Viewer annotations only. No grade boolean, coordinate, answer key or argmax is read. */
function localConflicts(regions: string[][], cells: readonly Cell[], complete: boolean): FailureComparisonData['conflicts'] {
  const size = regions.length
  const conflicts: FailureComparisonData['conflicts'] = []
  const groups = (values: readonly (string | number)[], valueOf: (cell: Cell) => string | number, label: string) => {
    for (const value of values) {
      const occupied = cells.filter(cell => valueOf(cell) === value)
      if (occupied.length > 1) conflicts.push({ label: `${label} ${value} has ${occupied.length} queens: ${occupied.map(named).join(', ')}.`, cells: unique(occupied) })
      else if (complete && !occupied.length) conflicts.push({ label: `${label} ${value} is empty in this complete submitted answer.`, cells: [] })
    }
  }
  const axes = Array.from({ length: size }, (_, index) => index + 1)
  groups(axes, cell => cell[0], 'Row')
  groups(axes, cell => cell[1], 'Column')
  groups([...new Set(regions.flat())].sort(), cell => regions[cell[0] - 1][cell[1] - 1], 'Region')
  if (complete && cells.length !== size) conflicts.push({ label: `Complete submitted answer has ${cells.length} queens; exactly ${size} are required.`, cells: unique(cells) })
  for (let index = 0; index < cells.length; index++) {
    for (let other = index + 1; other < cells.length; other++) {
      const a = cells[index], b = cells[other]
      if (Math.max(Math.abs(a[0] - b[0]), Math.abs(a[1] - b[1])) <= 1) {
        conflicts.push({ label: key(a) === key(b) ? `Repeated placement at ${named(a)}.` : `Queens touch: ${named(a)} and ${named(b)}.`, cells: unique([a, b]) })
      }
    }
  }
  return conflicts
}

/**
 * Called only for user-requested evaluator views of saved model_failure records.
 * Never augments request input, repairs a response, rewrites a grade, or runs a solver.
 */
export function deriveFailureComparison(request: unknown, output: unknown, grade?: unknown): FailureComparisonData | null {
  const req = object(request)
  if (!req) return null
  const binding = bind(req)
  if (!binding) return null
  const { reference } = binding
  if (!asksForPlacement(req, reference.size)) return null
  const regions = reference.regions.map(row => [...row])
  const solutionQueens: Cell[] = reference.columns.map((column, row) => [row + 1, column])
  const written = submittedQueens(output, grade, reference)
  const rendered = deriveReceiptBoard(req, output, grade)
  const choices = rendered?.frames.filter(frame => ['returned-rows', 'returned-cell'].includes(frame.id)) ?? []
  const response = object(output)
  const mixedOutput = response !== null && 'choices' in response && 'answers' in response
  let modelQueens: Cell[] | null = null
  let modelLabel = 'No recoverable placement'
  let modelSource = 'No single, well-formed, same-board placement recovered from the visible response.'
  let complete = false
  let note = 'Missing, malformed, ambiguous or wrong-board output is not repaired. No reference queen is substituted into the model panel. The original saved grade remains unchanged.'
  if (written && !choices.length && !mixedOutput) {
    modelQueens = written.cells
    modelLabel = 'Exact model written placement'
    modelSource = written.source
    complete = true
    note = 'This complete visible written placement is shown unchanged. Geometry annotations are recomputed locally; solution mismatches are separate. Strict-format diagnostics do not become successes. The original saved grade remains unchanged.'
  } else if (!written && choices.length === 1 && !mixedOutput) {
    const frame = choices[0]
    modelQueens = [...frame.queens]
    modelLabel = frame.label
    modelSource = `${frame.sourceLabel}${rendered?.frames[0].queens.length ? '; fixed queens copied exactly from visible request state' : ''}`
    complete = frame.label === 'Returned row Choices' || frame.queens.length >= reference.size
    note = `${complete ? 'Complete' : 'Partial'} visible Jev Choices and any fixed input queens are shown unchanged, without probability argmax. ${complete ? 'Full-answer geometry is checked locally.' : 'Missing rows, columns and regions are not full-answer violations for partial choices.'} Solution mismatches are separate from direct local conflicts. The original saved grade remains unchanged.`
  }
  const solutionKeys = new Set(solutionQueens.map(key))
  const conflicts = modelQueens ? localConflicts(regions, modelQueens, complete) : []
  return {
    regions, modelQueens, solutionQueens,
    mismatchedCells: modelQueens ? unique(modelQueens.filter(cell => !solutionKeys.has(key(cell)))) : [],
    conflictCells: unique(conflicts.flatMap(conflict => conflict.cells)), conflicts,
    modelLabel, modelSource,
    referenceSource: `Evaluator-only unique legal regional Queens solution, independently enumerated offline from public ${reference.publicRequest}. Frozen partition SHA-256 ${reference.partitionSha256}; one queen per row, column and region; no touching; long diagonals allowed. Evaluator-identified reference and annotations added after evaluation; not a returned model answer or revised grade.`,
    bindingSource: binding.source, complete,
    matchingCells: modelQueens ? unique(modelQueens.filter(cell => solutionKeys.has(key(cell)))).length : 0,
    note,
  }
}
