import { useEffect, useState, type ComponentType, type ReactNode } from 'react'

type Ui = {
  Callout: ComponentType<{ tone?: 'note' | 'evidence' | 'caution' | 'stop'; title: string; children: ReactNode }>
  DataTable: ComponentType<{ caption: string; headers: string[]; rows: (string | ReactNode)[][] }>
}
type Row = { call_id: string; board_id: string; size: number; model: string; short: string; route: string; state: string; outcome?: string; cost_usd?: number | null }
type ModelSummary = { model: string; recorded: number; correct: number; strict: number; correct_cp95: [number, number] | null; outcomes: Record<string, number>; cost_usd: number; route: string | null; providers: string[] }
type Summary = { study: string; rows: Row[]; by_model: Record<string, ModelSummary>; retired: Record<string, string>; amendments: { id: number; model?: string; change: string }[]; cost_usd_reported: number }
type FrontierSummary = { rows: Row[] }
type October = { models: { model: string; condition: string; attempted: number; strict_correct: number; written_correct: number }[] }

const url = (path: string) => `${import.meta.env.BASE_URL}evidence/${path}`
const NAMES: Record<string, string> = {
  'openai/gpt-5.5': 'GPT-5.5', 'openai/gpt-5.4': 'GPT-5.4', 'openai/gpt-5': 'GPT-5', 'openai/gpt-4.1': 'GPT-4.1',
  'anthropic/claude-opus-4.7': 'Claude Opus 4.7', 'anthropic/claude-opus-4.6': 'Claude Opus 4.6',
  'google/gemini-2.5-pro': 'Gemini 2.5 Pro', 'google/gemini-2.5-flash': 'Gemini 2.5 Flash', 'anthropic/claude-sonnet-4': 'Claude Sonnet 4',
  'openai/gpt-5.6-sol': 'GPT-5.6 Sol', 'anthropic/claude-opus-4.8': 'Claude Opus 4.8', 'google/gemini-3.1-pro-preview': 'Gemini 3.1 Pro Preview', 'x-ai/grok-4.6': 'Grok 4.6',
}
const pct = (value: number) => `${Math.round(value * 100)}%`
const solved = (row: Row) => row.outcome === 'strict' || row.outcome === 'format_only'

/** The 17 October extension of the earlier-generation replay to the 36 panel boards. */
export function LegacyPanel({ ui }: { ui: Ui }) {
  const { Callout, DataTable } = ui
  const [data, setData] = useState<{ legacy: Summary; frontier: FrontierSummary; october: October } | null>(null)
  const [error, setError] = useState(false)
  useEffect(() => {
    const controller = new AbortController()
    const get = (path: string) => fetch(url(path), { signal: controller.signal }).then(response => { if (!response.ok) throw new Error(path); return response.json() })
    Promise.all([get('legacy-panel/summary.json'), get('frontier-image-panel/summary.json'), get('earlier-generations-summary.json')])
      .then(([legacy, frontier, october]) => setData({ legacy, frontier, october }))
      .catch(() => { if (!controller.signal.aborted) setError(true) })
    return () => controller.abort()
  }, [])
  if (error) return <p role="status">The saved 36-board results could not be loaded. No results are substituted.</p>
  if (!data) return <p role="status">Loading the saved 36-board results…</p>

  const { legacy, frontier, october } = data
  const sizes = [5, 7, 9]
  const cell = (rows: Row[], size: number) => { const mine = rows.filter(r => r.size === size && r.state === 'recorded'); return `${mine.filter(solved).length}/${mine.length}` }
  const oct = (model: string) => { const m = october.models.find(item => item.model === model && item.condition === 'original_image'); return m ? `${m.written_correct}/${m.attempted}` : '—' }
  const modelRows = Object.entries(legacy.by_model).sort((a, b) => b[1].correct - a[1].correct || a[1].model.localeCompare(b[1].model)).map(([short, m]) => {
    const rows = legacy.rows.filter(r => r.short === short)
    const notRun = rows.filter(r => r.state !== 'recorded').length
    const misses = Object.entries(m.outcomes).filter(([key]) => key !== 'strict' && key !== 'format_only').map(([key, count]) => `${count} ${key.replace('_', ' ')}`)
    return [NAMES[m.model] ?? m.model, ...sizes.map(size => cell(rows, size)), <strong key="all">{m.correct}/{m.recorded}</strong>, `${m.strict}/${m.recorded}`,
      m.correct_cp95 ? `${pct(m.correct_cp95[0])}–${pct(m.correct_cp95[1])}` : '—', misses.join(', ') || 'none', oct(m.model),
      `${m.route === 'batch' ? 'Batch, Vertex' : 'On demand'}${notRun ? ` · ${notRun} not run` : ''}`, `$${m.cost_usd.toFixed(2)}`]
  })
  const frontierRows = [...new Set(frontier.rows.map(r => r.model))].map(model => {
    const rows = frontier.rows.filter(r => r.model === model)
    return [NAMES[model] ?? model, ...sizes.map(size => cell(rows, size)), <strong key="all">{rows.filter(solved).length}/{rows.filter(r => r.state === 'recorded').length}</strong>]
  })
  const retired = Object.values(legacy.retired ?? {})
  return <>
    <p className="lead">On 17 October the eight earlier-generation models that OpenRouter still serves each answered the same 36 boards as the 16 October frontier panel: same images, same prompt, and each model's 1 October settings. One request per model and board, no retries.</p>
    <DataTable caption="Earlier generations on the 36-board panel: correct placements (strict JSON or off-format)" headers={['Model', '5×5', '7×7', '9×9', 'All 36', 'Strict JSON', '95% interval (all)', 'Misses', '1 Oct, 3 boards', 'Route', 'Cost']} rows={modelRows} />
    <DataTable caption="Current frontier models on the same 36 boards (16 October), for comparison" headers={['Model', '5×5', '7×7', '9×9', 'All 36']} rows={frontierRows} />
    <Callout tone="caution" title="Routes changed for six models; one model is gone.">Gemini 2.5 Pro and Flash ran through OpenRouter's Batch API on Google Vertex (1 October used Google AI Studio). OpenRouter rejected every OpenAI and Anthropic batch submission with "does not have a :batch endpoint", so GPT-5.5, GPT-5.4, GPT-5, GPT-4.1 and Claude Opus 4.7 and 4.6 ran on demand with their 1 October provider blocks, as preregistered. {retired.length ? `${retired.map(id => NAMES[id] ?? id).join(', ')} was tested on 1 October but OpenRouter no longer serves it, so it is not here.` : ''} Comparisons between models are descriptive.</Callout>
    <p className="table-note">“1 Oct, 3 boards” is the written-correct count on the three original boards. <a href={url('legacy-panel/summary.json')} download>Results (JSON)</a> · preregistration and amendments in <code>docs/legacy-panel-preregistration.md</code> · total reported cost ${legacy.cost_usd_reported.toFixed(2)}.</p>
  </>
}
