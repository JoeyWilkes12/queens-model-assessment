import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from 'react'
import type { BookUi } from './ollamaEvidence'
import './leaderboard.css'

type Cell = { outcome: string; solved: boolean; usd: number | null; requests: number; unknown: number }
type Family = 'frontier' | 'earlier' | 'decision' | 'baseline' | 'local'
type System = { key: string; name: string; author: string | null; logo: string | null; family: Family; method: 'image' | 'menus' | 'rule'; attempts_per_board: number; route: string | null; panel_192?: { solved: number; boards: number }; boards: Record<string, Cell> }
type Data = { boards: { id: string; size: number }[]; local_boards: string[]; systems: System[] }
type Row = { system: System; total: number; solved: number; strict: number; offFormat: number; usd: number | null; requests: number; unknown: number; misses: Record<string, number>; bySize: { size: number; solved: number; total: number }[] }

type View = 'solved' | 'cost' | 'scatter'
type Scope = 'panel' | 'local'
type Size = 'all' | '5' | '7' | '9'

const SIZES: [Size, string][] = [['all', 'All sizes'], ['5', '5×5'], ['7', '7×7'], ['9', '9×9']]
const TAG: Record<Family, string> = { frontier: 'image', earlier: 'image', decision: 'menus', baseline: 'rule', local: 'local' }
const METHOD: Record<Family, string> = {
  frontier: 'Frontier language model. Saw each board as a picture and answered once (16 Oct).',
  earlier: 'Earlier-generation language model. Same pictures, one answer each (17–19 Oct).',
  decision: 'Decision model. Picked one move at a time from menus our code built; a board counts if either of two runs solved it, one with illegal moves removed (15–16 Oct).',
  baseline: 'No model. A fixed rule: fill the color with the fewest open squares first, and never undo a move.',
  local: 'Small free model run on our own computer. Same pictures, one answer each (28 Oct).',
}
const EVIDENCE: Record<Family, string> = { frontier: '#/board-receipts', earlier: '#/earlier-generations', decision: '#/subq-assessment/panel', baseline: '#/greedy-rule', local: '#/local-open-models' }
const MISS: Record<string, string> = { wrong: 'wrong', truncated: 'hit the length limit', no_answer: 'refused before any answer' }

const assetUrl = (path: string) => `${import.meta.env.BASE_URL}${path}`
const usd = (value: number) => value >= 1 ? `$${value.toFixed(2)}` : value >= 0.01 ? `$${value.toFixed(3)}` : `$${value.toFixed(4)}`
const shortName = (name: string) => name.replace(' (preview)', '').replace('Greedy rule (no model)', 'Simple rule').replace(', local', '')
const fullName = (system: System) => system.family === 'baseline' ? 'Simple rule (greedy, no model)' : system.name
const evidenceFor = (system: System) => system.key.endsWith('-caveman') ? '#/caveman-summary' : EVIDENCE[system.family]
const noCost = (system: System) => system.family === 'local' ? 'No fee' : 'No model, no cost'
const batch = (system: System) => system.route === 'batch' ? '†' : ''

function isData(value: unknown): value is Data {
  const data = value as Data
  return !!data && Array.isArray(data.boards) && Array.isArray(data.local_boards) && Array.isArray(data.systems)
    && data.systems.every(system => typeof system.key === 'string' && typeof system.name === 'string' && !!system.boards && typeof system.boards === 'object')
}

/** A callback ref measured before paint, so the first frame already uses the right layout. */
function useWidth<T extends HTMLElement>(): [(element: T | null) => void, number | null] {
  const [element, setElement] = useState<T | null>(null)
  const [width, setWidth] = useState<number | null>(null)
  useLayoutEffect(() => {
    if (!element) return
    const measure = () => setWidth(Math.round(element.getBoundingClientRect().width))
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(element)
    return () => observer.disconnect()
  }, [element])
  return [setElement, width]
}

/** Count each system on exactly the selected boards; a system missing any of them is left out, never scored as a miss. */
function rowsFor(data: Data, ids: string[]): Row[] {
  const sizes = [...new Set(data.boards.filter(board => ids.includes(board.id)).map(board => board.size))].sort((a, b) => a - b)
  return data.systems.filter(system => ids.every(id => system.boards[id])).map(system => {
    const cells = ids.map(id => system.boards[id])
    const solved = cells.filter(cell => cell.solved).length
    const offFormat = cells.filter(cell => cell.solved && cell.outcome === 'format_only').length
    const priced = system.family !== 'baseline' && system.family !== 'local'
    const misses: Record<string, number> = {}
    for (const cell of cells) if (!cell.solved && MISS[cell.outcome]) misses[cell.outcome] = (misses[cell.outcome] ?? 0) + 1
    return {
      system, total: ids.length, solved, strict: solved - offFormat, offFormat, misses,
      usd: priced ? cells.reduce((sum, cell) => sum + (cell.usd ?? 0), 0) : null,
      requests: cells.reduce((sum, cell) => sum + cell.requests, 0), unknown: cells.reduce((sum, cell) => sum + cell.unknown, 0),
      bySize: sizes.map(size => {
        const own = data.boards.filter(board => board.size === size && ids.includes(board.id))
        return { size, solved: own.filter(board => system.boards[board.id].solved).length, total: own.length }
      }),
    }
  })
}

/** Most boards first. Ties between language models go to the one with more answers in the exact format; then the cheaper one. */
const byRank = (a: Row, b: Row) => b.solved - a.solved
  || (a.system.method === 'image' && b.system.method === 'image' ? b.strict - a.strict : 0)
  || (a.usd ?? 0) - (b.usd ?? 0) || a.system.name.localeCompare(b.system.name)
const byCost = (a: Row, b: Row) => (b.usd ?? -1) - (a.usd ?? -1) || byRank(a, b)

function Logo({ system }: { system: System }) {
  return <span className="lb-logo" aria-hidden="true">{system.logo ? <img src={assetUrl(system.logo)} alt="" width={16} height={16} loading="lazy" /> : <span>{shortName(system.name)[0]}</span>}</span>
}

function summary(row: Row) {
  const format = row.system.method === 'image' && row.offFormat ? `, ${row.offFormat} in the wrong format` : ''
  const cost = row.usd === null ? noCost(row.system) : `cost ${row.unknown ? 'at least ' : ''}${usd(row.usd)}${row.system.route === 'batch' ? ' at batch price' : ''}`
  return `${fullName(row.system)}: ${row.solved} of ${row.total} boards solved${format}; ${cost}.`
}

/** Single-choice controls: one tab stop per group, arrow keys move the choice. */
function Choice<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: [T, string][]; onChange: (value: T) => void }) {
  const buttons = useRef<(HTMLButtonElement | null)[]>([])
  const move = (index: number) => {
    const next = (index + options.length) % options.length
    onChange(options[next][0])
    buttons.current[next]?.focus()
  }
  return <div className="lb-tabs" role="radiogroup" aria-label={label}>
    {options.map(([key, text], index) => <button key={key} ref={element => { buttons.current[index] = element }} type="button" role="radio" aria-checked={value === key} tabIndex={value === key ? 0 : -1}
      onClick={() => onChange(key)} onKeyDown={event => {
        if (event.key === 'ArrowRight' || event.key === 'ArrowDown') { event.preventDefault(); move(index + 1) }
        else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') { event.preventDefault(); move(index - 1) }
      }}>{text}</button>)}
  </div>
}

type Pick = { selected: string | null; peek: string | null; onPick: (key: string) => void; onPeek: (key: string | null) => void }
const stateClass = (pick: Pick, key: string) => `${pick.selected === key ? ' is-active' : ''}${pick.peek === key && pick.selected !== key ? ' is-peek' : ''}`

function Columns({ rows, view, columns, pick }: { rows: Row[]; view: 'solved' | 'cost'; columns: boolean; pick: Pick }) {
  const maxCost = Math.max(0.000001, ...rows.map(row => row.usd ?? 0))
  return <ol className={`lb-bars ${columns ? 'lb-bars--columns' : 'lb-bars--rows'}`} aria-label={view === 'solved' ? 'Boards solved, most first' : 'API cost on these boards, highest first'}>
    {rows.map((row, index) => {
      const { system } = row
      const free = view === 'cost' && row.usd === null
      const segments: [string, number][] = view === 'solved'
        ? system.family === 'baseline' ? [['base', row.solved / row.total]] : [['solid', row.strict / row.total], ['hatched', row.offFormat / row.total]]
        : [['cost', (row.usd ?? 0) / maxCost]]
      const value = view === 'solved' ? <>{row.solved}<small>/{row.total}</small></> : row.usd === null ? <small>$0</small> : `${row.unknown ? '≥ ' : ''}${usd(row.usd)}${batch(system)}`
      const track = <span className="lb-track" aria-hidden="true">
        {free ? <span className="lb-free">{noCost(system)}</span> : segments.map(([kind, share]) => <span key={kind} className={`lb-fill lb-fill--${kind}`} style={columns ? { height: `${share * 100}%` } : { width: `${share * 100}%` }} />)}
      </span>
      return <li key={system.key} style={{ '--i': index } as CSSProperties}>
        <button type="button" className={`lb-item lb-item--${system.family}${stateClass(pick, system.key)}`} aria-pressed={pick.selected === system.key} aria-label={summary(row)}
          onClick={() => pick.onPick(system.key)} onMouseEnter={() => pick.onPeek(system.key)} onMouseLeave={() => pick.onPeek(null)} onFocus={() => pick.onPeek(system.key)} onBlur={() => pick.onPeek(null)}>
          {columns ? <>
            <span className="lb-value">{value}</span>
            {track}
            <Logo system={system} />
            <span className="lb-name">{shortName(system.name)}</span>
            <span className="lb-tag">{TAG[system.family]}</span>
          </> : <>
            <span className="lb-row-label"><Logo system={system} /><span className="lb-name">{shortName(system.name)}</span><span className="lb-tag">{TAG[system.family]}</span></span>
            {track}
            <span className="lb-value">{value}</span>
          </>}
        </button>
      </li>
    })}
  </ol>
}

type Placed = { row: Row; cx: number; cy: number; label: { x: number; y: number; anchor: 'start' | 'end' | 'middle' } | null }

/** Put each name beside its point where it overlaps no other point or name; otherwise leave it to the detail strip. */
function placeLabels(points: { row: Row; cx: number; cy: number }[], width: number, height: number): Placed[] {
  const boxes: [number, number, number, number][] = points.map(point => [point.cx - 11, point.cy - 11, point.cx + 11, point.cy + 11])
  const free = (box: [number, number, number, number]) => box[0] >= 0 && box[2] <= width && box[1] >= 0 && box[3] <= height && boxes.every(other => box[2] <= other[0] || box[0] >= other[2] || box[3] <= other[1] || box[1] >= other[3])
  return points.map(point => {
    const text = shortName(point.row.system.name)
    const w = text.length * 6.4 + 4, h = 14
    const options: [number, number, 'start' | 'end' | 'middle', [number, number, number, number]][] = [
      [point.cx + 15, point.cy + 4, 'start', [point.cx + 13, point.cy - h / 2, point.cx + 13 + w, point.cy + h / 2]],
      [point.cx - 15, point.cy + 4, 'end', [point.cx - 13 - w, point.cy - h / 2, point.cx - 13, point.cy + h / 2]],
      [point.cx, point.cy - 17, 'middle', [point.cx - w / 2, point.cy - 13 - h, point.cx + w / 2, point.cy - 13]],
      [point.cx, point.cy + 26, 'middle', [point.cx - w / 2, point.cy + 13, point.cx + w / 2, point.cy + 13 + h]],
    ]
    const chosen = options.find(option => free(option[3]))
    if (!chosen) return { ...point, label: null }
    boxes.push(chosen[3])
    return { ...point, label: { x: chosen[0], y: chosen[1], anchor: chosen[2] } }
  })
}

function Marker({ row, cx, cy }: { row: Row; cx: number; cy: number }) {
  return <>
    <circle cx={cx} cy={cy} r={11} className="lb-dot" />
    {row.system.logo ? <image href={assetUrl(row.system.logo)} x={cx - 7} y={cy - 7} width={14} height={14} /> : <text x={cx} y={cy + 4} textAnchor="middle" className="lb-dot-letter">{shortName(row.system.name)[0]}</text>}
  </>
}

type Window = { x: [number, number]; y: [number, number] }

const clampWindow = ([a, b]: [number, number], [lo, hi]: [number, number], minSpan: number): [number, number] => {
  const span = Math.min(hi - lo, Math.max(minSpan, b - a))
  const start = Math.min(hi - span, Math.max(lo, a))
  return [start, start + span]
}
const sameWindow = (a: Window, b: Window) => [0, 1].every(i => Math.abs(a.x[i] - b.x[i]) < 1e-9 && Math.abs(a.y[i] - b.y[i]) < 1e-9)

/** Tick values for a log axis window: decades when wide, 1-2-5 or every digit when zoomed in. */
function logTicks(lo: number, hi: number) {
  const span = hi - lo
  const steps = span > 1.6 ? [1] : span > .55 ? [1, 2, 5] : [1, 2, 3, 4, 5, 6, 7, 8, 9]
  const ticks: number[] = []
  for (let decade = Math.floor(lo); decade <= Math.ceil(hi); decade++) for (const step of steps) {
    const value = step * 10 ** decade
    if (Math.log10(value) >= lo - 1e-9 && Math.log10(value) <= hi + 1e-9) ticks.push(value)
  }
  return ticks
}
const tickUsd = (value: number) => value >= 1 ? `$${+value.toPrecision(3)}` : `$${value.toFixed(Math.max(0, -Math.floor(Math.log10(value) + 1e-9)))}`

function boardTicks([lo, hi]: [number, number], n: number) {
  if (lo <= 0 && hi >= n) return [...new Set([0, 1 / 3, 2 / 3, 1].map(share => Math.round(share * n)))]
  const step = Math.max(1, Math.round((hi - lo) / 4))
  const ticks: number[] = []
  for (let tick = Math.max(0, Math.ceil(lo / step) * step); tick <= Math.min(n, hi) + 1e-9; tick += step) ticks.push(tick)
  return ticks
}

/**
 * Boards solved against API cost per board. Zooming rescales the axes rather than magnifying the
 * marks, so crowded points separate while logos and labels keep their size.
 */
function Scatter({ rows, width, pick }: { rows: Row[]; width: number; pick: Pick }) {
  const n = rows[0]?.total ?? 1
  const height = 360, left = 40, lane = 64, right = 28, top = 18, bottom = 46, inset = 16
  const perBoard = (row: Row) => row.usd === null || row.usd <= 0 ? null : row.usd / row.total
  const priced = rows.map(perBoard).filter((value): value is number => value !== null)
  // The cost axis spans the data plus a little room, so close prices are not squeezed into one corner.
  const lo = priced.length ? Math.log10(Math.min(...priced)) - .3 : -3, hi = priced.length ? Math.log10(Math.max(...priced)) + .3 : 0
  const full: Window = { x: [lo, lo + Math.max(.5, hi - lo)], y: [0, n] }
  // Zoomed windows may run half a board past either end, so points on 0 or n never sit on the clipped edge.
  const bounds: Window = { x: full.x, y: [-.5, n + .5] }
  const minX = .25, minY = Math.min(n, Math.max(2, n / 12))
  const [view, setView] = useState<Window>(full)
  const zoomed = !sameWindow(view, full)
  const plotLeft = left + lane
  const x0 = plotLeft + inset, x1 = width - right, y0 = top, y1 = height - bottom
  const x = (value: number) => x0 + (Math.log10(value) - view.x[0]) / (view.x[1] - view.x[0]) * (x1 - x0)
  const y = (solved: number) => y0 + (1 - (solved - view.y[0]) / (view.y[1] - view.y[0])) * (y1 - y0)

  const svgRef = useRef<SVGSVGElement>(null)
  const pointers = useRef(new Map<number, { x: number; y: number }>())
  const dragged = useRef(false)
  const toSvg = (clientX: number, clientY: number) => {
    const box = svgRef.current?.getBoundingClientRect()
    return box ? { x: (clientX - box.left) * width / box.width, y: (clientY - box.top) * height / box.height } : { x: 0, y: 0 }
  }
  /** Zoom by `factor` (above 1 zooms in), keeping the data under (px, py) in place. */
  const zoomAt = (factor: number, px = (x0 + x1) / 2, py = (y0 + y1) / 2) => setView(current => {
    const fx = current.x[0] + (Math.min(x1, Math.max(x0, px)) - x0) / (x1 - x0) * (current.x[1] - current.x[0])
    const fy = current.y[0] + (1 - (Math.min(y1, Math.max(y0, py)) - y0) / (y1 - y0)) * (current.y[1] - current.y[0])
    const scale = (value: number, [a, b]: [number, number]): [number, number] => [value - (value - a) / factor, value + (b - value) / factor]
    // Points in the $0 lane have no cost to zoom into; zooming there changes only the boards axis.
    const next: Window = { x: px < plotLeft ? current.x : clampWindow(scale(fx, current.x), bounds.x, minX), y: clampWindow(scale(fy, current.y), bounds.y, minY) }
    // Zooming back out past the whole chart returns exactly to the starting view.
    return next.x[1] - next.x[0] >= full.x[1] - full.x[0] - 1e-9 && next.y[1] - next.y[0] >= full.y[1] - full.y[0] - 1e-9 ? full : next
  })
  const panBy = (dx: number, dy: number) => setView(current => ({
    x: clampWindow([current.x[0] - dx / (x1 - x0) * (current.x[1] - current.x[0]), current.x[1] - dx / (x1 - x0) * (current.x[1] - current.x[0])], full.x, minX),
    y: clampWindow([current.y[0] + dy / (y1 - y0) * (current.y[1] - current.y[0]), current.y[1] + dy / (y1 - y0) * (current.y[1] - current.y[0])], bounds.y, minY),
  }))

  // Ctrl or ⌘ + wheel (and trackpad pinch, which browsers report the same way) zooms; a plain wheel still scrolls the page.
  useEffect(() => {
    const svg = svgRef.current
    if (!svg) return
    const onWheel = (event: WheelEvent) => {
      if (!event.ctrlKey && !event.metaKey) return
      event.preventDefault()
      const point = toSvg(event.clientX, event.clientY)
      zoomAt(Math.exp(-event.deltaY * .01), point.x, point.y)
    }
    svg.addEventListener('wheel', onWheel, { passive: false })
    return () => svg.removeEventListener('wheel', onWheel)
  })

  const onPointerDown = (event: ReactPointerEvent<SVGSVGElement>) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return
    pointers.current.set(event.pointerId, toSvg(event.clientX, event.clientY))
    if (pointers.current.size === 1) dragged.current = false
  }
  const onPointerMove = (event: ReactPointerEvent<SVGSVGElement>) => {
    const previous = pointers.current.get(event.pointerId)
    if (!previous) return
    const point = toSvg(event.clientX, event.clientY)
    if (pointers.current.size === 2) {
      const [other] = [...pointers.current.entries()].filter(([id]) => id !== event.pointerId).map(([, value]) => value)
      const before = Math.hypot(previous.x - other.x, previous.y - other.y), after = Math.hypot(point.x - other.x, point.y - other.y)
      if (before > 4) zoomAt(after / before, (point.x + other.x) / 2, (point.y + other.y) / 2)
      dragged.current = true
    } else if (pointers.current.size === 1 && zoomed) {
      const dx = point.x - previous.x, dy = point.y - previous.y
      if (!dragged.current && Math.hypot(dx, dy) < 4) return
      if (!dragged.current) svgRef.current?.setPointerCapture(event.pointerId)
      dragged.current = true
      panBy(dx, dy)
    }
    pointers.current.set(event.pointerId, point)
  }
  const onPointerEnd = (event: ReactPointerEvent<SVGSVGElement>) => { pointers.current.delete(event.pointerId) }
  const choose = (key: string) => { if (!dragged.current) pick.onPick(key) }

  const freeRows = rows.filter(row => perBoard(row) === null)
  const spacing = freeRows.length > 1 ? Math.min(22, (lane - 24) / (freeRows.length - 1)) : 0
  const points = rows.map(row => {
    const value = perBoard(row)
    const cx = value === null ? left + lane / 2 - 4 + (freeRows.indexOf(row) - (freeRows.length - 1) / 2) * spacing : x(value)
    return { row, cx, cy: y(row.solved) }
  })
  // Points outside the zoomed window are left out entirely, so keyboard focus never lands on a hidden mark.
  const visible = points.filter(point => (perBoard(point.row) === null || (point.cx >= x0 - 10 && point.cx <= x1 + 10)) && point.cy >= y0 - 12 && point.cy <= y1 + 12)
  const placed = placeLabels(visible, width, height)
  const ticks = logTicks(view.x[0], view.x[1])
  const yTicks = boardTicks(view.y, n)
  const highlight = placed.find(point => point.row.system.key === (pick.peek ?? pick.selected))
  const clipId = useId().replace(/:/g, '')
  return <div className="lb-scatter-wrap">
    <div className="lb-zoom" role="group" aria-label="Zoom the scatter plot">
      <button type="button" onClick={() => zoomAt(1 / 1.8)} disabled={!zoomed} aria-label="Zoom out">−</button>
      <button type="button" onClick={() => zoomAt(1.8)} disabled={view.x[1] - view.x[0] <= minX + 1e-6 && view.y[1] - view.y[0] <= minY + 1e-6} aria-label="Zoom in">+</button>
      <button type="button" onClick={() => setView(full)} disabled={!zoomed}>Reset</button>
      <span className="lb-zoom-hint">{zoomed ? visible.length ? `${visible.length} of ${rows.length} shown · drag to pan` : 'No systems in this area · drag to pan or reset' : 'Zoom: double-click or double-tap, pinch, or Ctrl/⌘ + scroll'}</span>
    </div>
    <svg ref={svgRef} className={`lb-scatter${zoomed ? ' is-zoomed' : ''}`} viewBox={`0 0 ${width} ${height}`} width={width} height={height} role="group" aria-label={`Boards solved out of ${n} against API cost per board on a logarithmic axis. Systems with no API cost sit in the left lane.${zoomed ? ` Zoomed to ${visible.length} of ${rows.length} systems.` : ''}`}
      onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerEnd} onPointerCancel={onPointerEnd}
      onDoubleClick={event => { const point = toSvg(event.clientX, event.clientY); zoomAt(1.8, point.x, point.y) }}>
      {zoomed && <defs><clipPath id={clipId}><rect x={0} y={y0 - 14} width={width} height={y1 - y0 + 28} /></clipPath></defs>}
      <rect x={left} y={y0} width={x1 - left} height={y1 - y0} className="lb-plot-bg" />
      {yTicks.map(tick => <g key={tick} aria-hidden="true"><line x1={left} x2={x1} y1={y(tick)} y2={y(tick)} className="lb-grid" /><text x={left - 8} y={y(tick) + 4} textAnchor="end" className="lb-axis">{tick}</text></g>)}
      {ticks.map(tick => <g key={tick} aria-hidden="true"><line x1={x(tick)} x2={x(tick)} y1={y0} y2={y1} className="lb-grid" /><text x={x(tick)} y={y1 + 17} textAnchor="middle" className="lb-axis">{tickUsd(tick)}</text></g>)}
      <g aria-hidden="true">
        <line x1={plotLeft - 6} x2={plotLeft - 6} y1={y0} y2={y1} className="lb-lane-edge" />
        <text x={left + lane / 2 - 4} y={y1 + 17} textAnchor="middle" className="lb-axis">$0</text>
        <text x={(plotLeft + x1) / 2} y={height - 8} textAnchor="middle" className="lb-axis-title">API cost per board (log scale)</text>
        <text transform={`translate(12 ${(y0 + y1) / 2}) rotate(-90)`} textAnchor="middle" className="lb-axis-title">Boards solved</text>
      </g>
      <g clipPath={zoomed ? `url(#${clipId})` : undefined}>
        {placed.map(({ row, cx, cy, label }) => <g key={row.system.key} className={`lb-point lb-point--${row.system.family}${stateClass(pick, row.system.key)}`} tabIndex={0} role="button" aria-pressed={pick.selected === row.system.key} aria-label={summary(row)}
          onClick={() => choose(row.system.key)} onDoubleClick={event => event.stopPropagation()} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); pick.onPick(row.system.key) } }}
          onMouseEnter={() => pick.onPeek(row.system.key)} onMouseLeave={() => pick.onPeek(null)} onFocus={() => pick.onPeek(row.system.key)} onBlur={() => pick.onPeek(null)}>
          <circle cx={cx} cy={cy} r={14} className="lb-hit" />
          <Marker row={row} cx={cx} cy={cy} />
          {label && <text x={label.x} y={label.y} textAnchor={label.anchor} className="lb-point-label">{shortName(row.system.name)}</text>}
        </g>)}
        {/* A drawn copy on top of the pile; the focusable points never move in the DOM. */}
        {highlight && <g className="lb-point-top" aria-hidden="true"><Marker row={highlight.row} cx={highlight.cx} cy={highlight.cy} /><circle cx={highlight.cx} cy={highlight.cy} r={12.5} className="lb-ring" /></g>}
      </g>
    </svg>
  </div>
}

/** True while the viewport is taller than it is wide; updates when the phone turns. */
function usePortrait() {
  const query = '(orientation: portrait)'
  const [portrait, setPortrait] = useState(() => typeof window !== 'undefined' && !!window.matchMedia?.(query).matches)
  useEffect(() => {
    const media = window.matchMedia?.(query)
    if (!media) return
    const update = () => setPortrait(media.matches)
    update()
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])
  return portrait
}

/** Shown in place of the scatter plot when it would be too narrow to read. */
function RotatePrompt({ portrait, onShow }: { portrait: boolean; onShow: () => void }) {
  return <div className="lb-rotate" role="note">
    <svg className="lb-rotate-icon" aria-hidden="true" width="64" height="64" viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="22" y="8" width="20" height="34" rx="3" />
      <rect x="14" y="36" width="34" height="20" rx="3" className="lb-rotate-landscape" />
      <path d="M50 14a14 14 0 0 1 4 12" /><path d="m51 24 3 3 3-4" />
    </svg>
    <div>
      <strong>{portrait ? 'Turn your phone sideways for this chart' : 'This chart needs a wider window'}</strong>
      <p>{portrait ? 'Solved vs cost places every system by its result and its price per board. In landscape it appears here, at a readable size.' : 'Solved vs cost places every system by its result and its price per board. Widen the window and it appears here.'}</p>
      <button type="button" className="lb-rotate-show" onClick={onShow}>Show it here anyway</button>
      <span className="lb-rotate-note">The narrow plot zooms, so crowded points can be pulled apart. The table below has the same numbers.</span>
    </div>
  </div>
}

function Detail({ row }: { row: Row | null }) {
  if (!row) return <p className="lb-detail lb-detail--empty">Pick a bar or dot for details.</p>
  const { system } = row
  const misses = Object.entries(row.misses).map(([outcome, count]) => `${count} ${MISS[outcome]}`).join(', ')
  const reruns = system.method === 'image' ? row.requests - row.total : 0
  return <div className="lb-detail">
    <div className="lb-detail-head"><Logo system={system} /><strong>{fullName(system)}</strong>{system.author && <span>{system.author}</span>}</div>
    <p className="lb-detail-method">{METHOD[system.family]}</p>
    <dl>
      <div><dt>Solved</dt><dd>{row.solved} of {row.total}{row.offFormat ? ` · ${row.offFormat} in the wrong format` : ''}</dd></div>
      {misses && <div><dt>Misses</dt><dd>{misses}</dd></div>}
      {row.bySize.length > 1 && <div><dt>By size</dt><dd>{row.bySize.map(part => `${part.size}×${part.size} ${part.solved}/${part.total}`).join(' · ')}</dd></div>}
      {system.panel_192 && <div><dt>All {system.panel_192.boards} panel boards</dt><dd>{system.panel_192.solved} solved</dd></div>}
      <div><dt>Cost</dt><dd>{row.usd === null ? `${noCost(system)}${system.family === 'local' ? '; electricity not measured' : ''}` : `${row.unknown ? '≥ ' : ''}${usd(row.usd)} · ${usd(row.usd / row.total)} per board · ${row.requests.toLocaleString()} ${row.requests === 1 ? 'request' : 'requests'}${reruns > 0 ? `, ${reruns} ${reruns === 1 ? 're-run' : 're-runs'}` : ''}${system.route === 'batch' ? ' · batch price' : ''}`}</dd></div>
    </dl>
    <a className="lb-detail-link" href={evidenceFor(system)}>Open the evidence <svg aria-hidden="true" width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M4 9h11" /><path d="m11 4 5 5-5 5" /></svg></a>
  </div>
}

/** The book's headline chart: every system on the same boards, ranked the way public AI leaderboards rank them. */
export function Leaderboard({ ui, titleId }: { ui: BookUi; titleId?: string }) {
  const { DataTable } = ui
  const ownId = useId()
  const headingId = titleId ?? ownId
  const [data, setData] = useState<Data | null>(null)
  const [error, setError] = useState(false)
  const [view, setView] = useState<View>('solved')
  const [scope, setScope] = useState<Scope>('panel')
  const [size, setSize] = useState<Size>('all')
  const [selected, setSelected] = useState<string | null>(null)
  const [peek, setPeek] = useState<string | null>(null)
  const [announcement, setAnnouncement] = useState('')
  const [chartRef, width] = useWidth<HTMLDivElement>()

  useEffect(() => {
    const controller = new AbortController()
    fetch(assetUrl('evidence/leaderboard.json'), { signal: controller.signal })
      .then(response => { if (!response.ok) throw new Error('leaderboard'); return response.json() })
      .then(value => { if (!isData(value)) throw new Error('leaderboard shape'); setData(value) })
      .catch(() => { if (!controller.signal.aborted) setError(true) })
    return () => controller.abort()
  }, [])

  const ids = useMemo(() => {
    if (!data) return []
    const pool = scope === 'local' ? data.local_boards : data.boards.map(board => board.id)
    return pool.filter(id => size === 'all' || String(data.boards.find(board => board.id === id)?.size) === size)
  }, [data, scope, size])
  const portrait = usePortrait()
  const [narrowScatter, setNarrowScatter] = useState(false)
  const wideEnough = width === null || width >= 560
  const shownView: View = view
  const rows = useMemo(() => data ? rowsFor(data, ids).sort(shownView === 'cost' ? byCost : byRank) : [], [data, ids, shownView])

  if (error) return <p className="leaderboard-status" role="status">The leaderboard could not load, so no scores are shown.</p>
  if (!data) return <p className="leaderboard-status" role="status">Loading the leaderboard…</p>

  const shown = rows.find(row => row.system.key === (peek ?? selected)) ?? null
  const pick: Pick = {
    selected, peek, onPeek: setPeek,
    onPick: key => {
      const next = selected === key ? null : key
      const system = data.systems.find(entry => entry.key === next)
      setSelected(next)
      setAnnouncement(system ? `Showing ${fullName(system)}.` : 'Selection cleared.')
    },
  }
  const columns = width !== null && width / Math.max(1, rows.length) >= (shownView === 'cost' ? 60 : 46)
  const boardsLabel = `${ids.length} ${ids.length === 1 ? 'board' : 'boards'}`
  const hasBatch = rows.some(row => row.system.route === 'batch')
  const legend: [string, string][] = shownView === 'solved'
    ? [['solid', 'Solved'], ['hatched', 'Solved, wrong answer format'], ['base', 'Solved by the rule']]
    : shownView === 'cost' ? [['cost', 'API spend on these boards']] : []
  const sizeHeaders = (rows[0]?.bySize.length ?? 0) > 1 ? rows[0].bySize.map(part => `${part.size}×${part.size}`) : []
  const views: [View, string][] = [['solved', 'Boards solved'], ['cost', 'Cost'], ['scatter', 'Solved vs cost']]

  return <figure className="leaderboard" aria-labelledby={headingId}>
    <figcaption className="lb-caption">
      <strong id={headingId}>Queens leaderboard</strong>
      <span>{rows.length} systems · {boardsLabel}</span>
    </figcaption>
    <div className="lb-controls">
      <Choice label="Measure" value={shownView} onChange={setView} options={views} />
      <Choice label="Board size" value={size} onChange={setSize} options={SIZES} />
      <Choice label="Boards" value={scope} onChange={setScope} options={[['panel', `All ${data.boards.length} boards`], ['local', `${data.local_boards.length} boards, with local models`]]} />
    </div>
    <p className="lb-key"><span><b>image</b>: one reply to a picture</span><span><b>menus</b>: picked moves from menus our code built; best of two runs</span><span><b>rule</b>: no model</span>{scope === 'local' && <span><b>local</b>: small model on our own computer</span>}</p>
    {(legend.length > 0 || (shownView === 'cost' && hasBatch)) && <div className="lb-legend">
      {legend.map(([kind, label]) => <span key={kind}><span className={`lb-swatch lb-fill--${kind}`} aria-hidden="true" />{label}</span>)}
      {shownView === 'cost' && hasBatch && <span>† batch price</span>}
    </div>}
    <div ref={chartRef} className="lb-chart" key={`${shownView}-${scope}-${size}`}>
      {width !== null && (shownView !== 'scatter' ? <Columns rows={rows} view={shownView} columns={columns} pick={pick} />
        : wideEnough || narrowScatter ? <Scatter rows={rows} width={width} pick={pick} />
          : <RotatePrompt portrait={portrait} onShow={() => setNarrowScatter(true)} />)}
    </div>
    <Detail row={shown} />
    <p className="sr-only" aria-live="polite">{announcement}</p>
    <details className="lb-table">
      <summary>Show the data as a table</summary>
      <DataTable caption={`Every system on the same ${boardsLabel}`} headers={['System', 'Method', 'Boards solved', 'Exact format', ...sizeHeaders, 'Cost', 'Per board', 'Requests']}
        rows={[...rows].sort(byRank).map(row => [fullName(row.system), TAG[row.system.family], `${row.solved}/${row.total}`, row.system.method === 'image' ? String(row.strict) : '—', ...(sizeHeaders.length ? row.bySize.map(part => `${part.solved}/${part.total}`) : []), row.usd === null ? noCost(row.system) : `${usd(row.usd)}${batch(row.system)}`, row.usd === null ? '—' : usd(row.usd / row.total), String(row.requests)])} />
      <p>A right answer counts as solved even if it ignored the requested format. A decision model solves a board if either of its two runs does. Ties go to more answers in the exact format, then to the lower cost. Costs are what the saved receipts record for requests on these boards, re-runs included; † marks batch prices. <a href={assetUrl('evidence/leaderboard.json')} download>Download the data (JSON)</a></p>
    </details>
  </figure>
}
