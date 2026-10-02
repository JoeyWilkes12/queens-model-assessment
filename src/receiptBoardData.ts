/** Conservative receipt-to-board adapter. It never imports a solver or an answer key. */
export type Cell = readonly [number, number]

export type BoardFrame = {
  id: string
  label: string
  queens: Cell[]
  candidateCells?: Cell[]
  highlightRegion?: string
  selectedCell?: Cell
  selectedCellLabel?: string
  note: string
  sourceLabel: string
  receiptLinks?: { label: string; id: string }[]
  invalidCells?: Cell[]
}

type ObjectValue = Record<string, unknown>
type BoardSource = { id: string; size: number; regions: string[][]; source: string; state?: ObjectValue }
type JsonValue = { value: unknown; end: number }

const object = (value: unknown): ObjectValue | null => value !== null && typeof value === 'object' && !Array.isArray(value) ? value as ObjectValue : null
const integer = (value: unknown): value is number => typeof value === 'number' && Number.isSafeInteger(value)
const label = (value: unknown): value is string => typeof value === 'string' && value.length > 0 && value.length <= 80
const inBounds = (cell: Cell, size: number) => cell.every(value => integer(value) && value >= 1 && value <= size)

/** Read one JSON value, rejecting duplicate object keys rather than silently overwriting. */
function jsonAt(text: string, start = 0): JsonValue | null {
  if (text.length > 500000) return null
  let cursor = start
  const whitespace = () => { while (/\s/.test(text[cursor] || '') && cursor < text.length) cursor++ }
  const string = (): string => {
    if (text[cursor] !== '"') throw new Error('string')
    const begin = cursor++
    while (cursor < text.length) {
      const next = text[cursor++]
      if (next === '\\') cursor++
      else if (next === '"') return JSON.parse(text.slice(begin, cursor)) as string
    }
    throw new Error('unterminated')
  }
  const value = (depth: number): unknown => {
    if (depth > 40) throw new Error('depth')
    whitespace()
    if (text[cursor] === '"') return string()
    if (text[cursor] === '{') {
      cursor++
      const result: ObjectValue = Object.create(null) as ObjectValue
      const keys = new Set<string>()
      whitespace()
      if (text[cursor] === '}') { cursor++; return result }
      while (cursor < text.length) {
        whitespace()
        const key = string()
        if (keys.has(key)) throw new Error('duplicate key')
        keys.add(key)
        whitespace()
        if (text[cursor++] !== ':') throw new Error('colon')
        result[key] = value(depth + 1)
        whitespace()
        const separator = text[cursor++]
        if (separator === '}') return result
        if (separator !== ',') throw new Error('separator')
      }
      throw new Error('object')
    }
    if (text[cursor] === '[') {
      cursor++
      const result: unknown[] = []
      whitespace()
      if (text[cursor] === ']') { cursor++; return result }
      while (cursor < text.length) {
        result.push(value(depth + 1))
        whitespace()
        const separator = text[cursor++]
        if (separator === ']') return result
        if (separator !== ',') throw new Error('separator')
      }
      throw new Error('array')
    }
    const token = /^(?:true|false|null|-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?)/.exec(text.slice(cursor))?.[0]
    if (!token) throw new Error('value')
    cursor += token.length
    return JSON.parse(token)
  }
  try { return { value: value(0), end: cursor } } catch { return null }
}

function matrix(value: unknown, size: number): string[][] | null {
  if (!Array.isArray(value) || value.length !== size || value.some(row => !Array.isArray(row) || row.length !== size || row.some(cell => !label(cell)))) return null
  const rows = value as string[][]
  if (new Set(rows.flat()).size !== size) return null
  return rows.map(row => [...row])
}

function regionCells(value: unknown, size: number): string[][] | null {
  const groups = object(value)
  if (!groups || Object.keys(groups).length !== size || Object.keys(groups).some(key => !label(key))) return null
  const result = Array.from({ length: size }, () => Array<string>(size).fill(''))
  for (const [region, members] of Object.entries(groups)) {
    if (!Array.isArray(members) || !members.length) return null
    for (const member of members) {
      const coordinates = Array.isArray(member) && member.length === 2 ? member : object(member) ? [object(member)?.row, object(member)?.column] : null
      if (!coordinates || !integer(coordinates[0]) || !integer(coordinates[1])) return null
      const cell: Cell = [coordinates[0], coordinates[1]]
      if (!inBounds(cell, size) || result[cell[0] - 1][cell[1] - 1]) return null
      result[cell[0] - 1][cell[1] - 1] = region
    }
  }
  return result.some(row => row.some(region => !region)) ? null : result
}

function stateBoard(request: ObjectValue): BoardSource | null {
  const state = object(request.state)
  if (!state || !integer(state.size) || state.size < 2 || state.size > 50 || !label(state.board_id)) return null
  const coordinates = typeof state.coordinates === 'string' ? state.coordinates : ''
  const rules = Array.isArray(state.rules) ? state.rules.filter(rule => typeof rule === 'string').join(' ') : ''
  const canonicalAxes = coordinates === 'Rows top to bottom; columns left to right; both start at 1.'
    || (state.row_direction === 'top to bottom' && state.column_direction === 'left to right' && rules.includes('Rows and columns are numbered from 1.'))
  if (!canonicalAxes) return null
  const partitions: string[][][] = []
  for (const key of ['region_grid_rows', 'region_cells', 'regions']) {
    if (!(key in state)) continue
    const partition = key === 'region_grid_rows' ? matrix(state[key], state.size) : regionCells(state[key], state.size)
    if (!partition) return null
    partitions.push(partition)
  }
  if (!partitions.length || partitions.some(partition => JSON.stringify(partition) !== JSON.stringify(partitions[0]))) return null
  return { id: state.board_id, size: state.size, regions: partitions[0], state, source: 'request.state explicit partition; one-based rows/columns' }
}

function promptBoard(request: ObjectValue): BoardSource | null {
  if (!Array.isArray(request.messages)) return null
  const message = [...request.messages].reverse().find(entry => object(entry)?.role === 'user')
  const content = object(message)?.content
  const texts = typeof content === 'string' ? [content] : Array.isArray(content) ? content.filter(part => object(part)?.type === 'text').map(part => object(part)?.text).filter((part): part is string => typeof part === 'string') : []
  const found: BoardSource[] = []
  for (const text of texts) {
    const canonicalAxes = (text.includes('one-based [row, column] coordinates.') && text.includes('Rows increase top to bottom and columns left to right.'))
      || text.includes('Rows are listed top to bottom and columns left to right, both numbered starting at 1.')
    if (!canonicalAxes) continue
    const sizes = [...text.matchAll(/^N:\s*(\d+)\s*$/gm)]
    const ids = [...text.matchAll(/^Board ID:\s*([^\r\n]+)\s*$/gm)]
    if (sizes.length !== 1 || ids.length !== 1) continue
    const size = Number(sizes[0][1])
    const id = ids[0][1].trim()
    if (!integer(size) || size < 2 || size > 50 || !label(id)) continue
    const markers = [...text.matchAll(/^Region (cells \(JSON object\)|grid rows \(JSON matrix\)):\s*/gm)]
    if (markers.length !== 1) continue
    const marker = markers[0]
    const parsed = jsonAt(text, (marker.index ?? 0) + marker[0].length)
    if (!parsed) continue
    const partition = marker[1].startsWith('cells') ? regionCells(parsed.value, size) : matrix(parsed.value, size)
    if (!partition) continue
    found.push({ id, size, regions: partition, source: `final user message: ${marker[1]}; explicit one-based rows/columns` })
  }
  return found.length === 1 ? found[0] : null
}

function queens(value: unknown, size: number): Cell[] | null {
  if (!Array.isArray(value)) return null
  const result: Cell[] = []
  for (const item of value) {
    const entry = object(item)
    const coordinates = Array.isArray(item) && item.length === 2 ? item : entry ? [entry.row, entry.column] : null
    if (!coordinates || !integer(coordinates[0]) || !integer(coordinates[1])) return null
    const cell: Cell = [coordinates[0], coordinates[1]]
    if (!inBounds(cell, size)) return null
    result.push(cell)
  }
  return result
}

function inputQueens(board: BoardSource): Cell[] | null {
  const state = board.state
  if (!state) return []
  const sources: Cell[][] = []
  for (const key of ['placed_queens', 'previous_queen_decisions', 'given_correct_queen']) {
    if (!(key in state)) continue
    const cells = queens(key === 'given_correct_queen' ? [state[key]] : state[key], board.size)
    if (!cells) return null
    sources.push(cells)
  }
  if (sources.some(cells => JSON.stringify(cells) !== JSON.stringify(sources[0]))) return null
  return sources[0] || []
}

function answerCells(value: unknown, board: { id: string; size: number }): Cell[] | null {
  const answer = object(value)
  if (!answer || Object.keys(answer).sort().join(',') !== 'board_id,columns_by_row' || answer.board_id !== board.id || !Array.isArray(answer.columns_by_row) || answer.columns_by_row.length !== board.size || answer.columns_by_row.some(column => !integer(column) || column < 1 || column > board.size)) return null
  return answer.columns_by_row.map((column, row) => [row + 1, column as number] as Cell)
}

/** Shared conservative visible-written-placement parser; never reads grade coordinates. */
export function submittedQueens(output: unknown, grade: unknown, board: { id: string; size: number }): { cells: Cell[]; source: string } | null {
  const body = object(output)
  const choices = body?.choices
  if (!Array.isArray(choices) || choices.length !== 1) return null
  const text = object(object(choices[0])?.message)?.content
  if (typeof text !== 'string') return null
  const exact = jsonAt(text)
  if (exact && !text.slice(exact.end).trim()) {
    const cells = answerCells(exact.value, board)
    if (cells) return { cells, source: 'response.choices[0].message.content: exact visible JSON (not a verified solution)' }
    return null
  }
  const extraction = object(object(grade)?.extraction)
  if (!extraction || extraction.diagnostic_only !== true || extraction.candidate_count !== 1) return null
  const candidates: unknown[] = []
  let cursor = 0
  while (cursor < text.length) {
    const begin = text.indexOf('{', cursor)
    if (begin < 0) break
    const parsed = jsonAt(text, begin)
    if (!parsed) { cursor = begin + 1; continue }
    const candidate = object(parsed.value)
    if (candidate && Object.keys(candidate).sort().join(',') === 'board_id,columns_by_row') candidates.push(candidate)
    cursor = parsed.end
  }
  if (candidates.length !== 1) return null
  const cells = answerCells(candidates[0], board)
  return cells ? { cells, source: 'visible final content: single schema object; saved deterministic extraction diagnostic, not strict-format success' } : null
}

function cellKey(key: unknown, size: number): Cell | null {
  if (typeof key !== 'string') return null
  const match = /^r([1-9]\d*)c([1-9]\d*)$/.exec(key)
  if (!match) return null
  const cell: Cell = [Number(match[1]), Number(match[2])]
  return inBounds(cell, size) ? cell : null
}

function jevFrames(request: ObjectValue, output: unknown, board: BoardSource, placed: Cell[]): BoardFrame[] {
  const questions = object(request.questions)
  const answers = object(object(output)?.answers)
  if (!questions || !answers) return []
  const frames: BoardFrame[] = []
  const choice = (question: unknown, answer: unknown): string | null => {
    const q = object(question), a = object(answer), criteria = object(q?.criteria)
    return q?.type === 'choice' && a?.type === 'choice' && typeof a.choice === 'string' && criteria && Object.prototype.hasOwnProperty.call(criteria, a.choice) ? a.choice : null
  }
  if (Object.keys(questions).length === 1 && 'region' in questions) {
    const selected = choice(questions.region, answers.region)
    if (selected && board.regions.flat().includes(selected)) frames.push({ id: 'returned-region', label: 'Returned region Choice', queens: placed, highlightRegion: selected, note: 'The response selected a region, not a queen cell. Existing queens remain unchanged.', sourceLabel: 'response.answers.region.choice; request.questions.region.criteria' })
  }
  if (Object.keys(questions).length === 1 && 'cell' in questions) {
    const selected = cellKey(choice(questions.cell, answers.cell), board.size)
    if (selected) frames.push({ id: 'returned-cell', label: 'Returned cell Choice', queens: [...placed, selected], selectedCell: selected, selectedCellLabel: 'Returned cell Choice', note: 'The returned Choice is overlaid exactly as submitted, including any local rule conflicts; no probability argmax substitution.', sourceLabel: 'response.answers.cell.choice; request.questions.cell.criteria' })
  }
  const rowKeys = Object.keys(questions)
  if (rowKeys.length && rowKeys.every(key => /^row_[1-9]\d*$/.test(key))) {
    const cells: Cell[] = []
    for (const key of rowKeys) {
      const row = Number(key.slice(4)), selected = choice(questions[key], answers[key])
      if (!selected || !/^[1-9]\d*$/.test(selected)) return frames
      const cell: Cell = [row, Number(selected)]
      if (!inBounds(cell, board.size)) return frames
      cells.push(cell)
    }
    frames.push({ id: 'returned-rows', label: rowKeys.length === board.size ? 'Returned row Choices' : 'Returned partial row Choices', queens: [...placed, ...cells], note: 'Row choices are simultaneous typed answers unless the request itself contains previous decisions. Array order is not a reasoning trace.', sourceLabel: 'response.answers.row_N.choice; request.questions.row_N.criteria' })
  }
  return frames
}

/** Unsupported or ambiguous board evidence stays in the original raw JSON panels. */
export function deriveReceiptBoard(request: unknown, output: unknown, grade?: unknown): { regions: string[][]; frames: BoardFrame[]; description: string } | null {
  const req = object(request)
  if (!req) return null
  // A malformed explicit native state must not silently fall through to another source.
  const board = 'state' in req ? stateBoard(req) : promptBoard(req)
  if (!board) return null
  const placed = inputQueens(board)
  if (!placed) return null
  const selectedRegion = label(board.state?.selected_region) && board.regions.flat().includes(board.state.selected_region) ? board.state.selected_region : undefined
  const criteria = object(object(object(req.questions)?.cell)?.criteria)
  const candidates = criteria ? Object.keys(criteria).map(key => cellKey(key, board.size)) : []
  const frames: BoardFrame[] = [{ id: 'model-input', label: placed.length ? 'Input with fixed queens' : 'Input board', queens: placed, ...(selectedRegion ? { highlightRegion: selectedRegion } : {}), ...(candidates.length && candidates.every((cell): cell is Cell => cell !== null) ? { candidateCells: candidates } : {}), note: 'Deterministic rendering of the model-visible partition. Colors are display encodings of region labels, not pixels submitted to the model. No hidden solution is used.', sourceLabel: board.source }]
  const submitted = submittedQueens(output, grade, board)
  if (submitted) frames.push({ id: 'written-answer', label: 'Submitted written answer', queens: submitted.cells, note: 'Exact submitted coordinates. An invalid answer remains invalid; this display does not repair it or change its saved grade.', sourceLabel: submitted.source })
  if (board.state) frames.push(...jevFrames(req, output, board, placed))
  return { regions: board.regions, frames, description: `${board.id} · ${board.size}×${board.size} · reconstructed only from explicit receipt input; overlays are visible submitted decisions, never an answer key.` }
}
