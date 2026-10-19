import { useEffect, useState } from 'react'
import { money } from './BoardReceipts'

/** [usd or null, basis, board total or null, requests on that board, requests with unknown cost] */
type Entry = [number | null, string, number | null, number, number]
type Costs = { receipts: Record<string, Record<string, Entry>> }
type BoardIndex = { boards: { id: string }[] }

const evidence = (path: string) => `${import.meta.env.BASE_URL}evidence/${path}`
const BASIS: Record<string, string> = {
  reported: 'reported by OpenRouter (usage.cost)',
  derived: 'batch item: tokens × the batch price, which reproduces the billed batch total',
  unbilled: 'rejected before any generation; not billed',
  unknown: 'unknown: no generation ID or usage was returned',
  subq_rate: "SubQ: input tokens × SubQ's published $0.05 per million (output is free)",
}

// One fetch per page load, shared by the atlas list and every receipt page.
let costs: Promise<Costs | null> | null = null
let boards: Promise<Set<string>> | null = null
const loadCosts = () => costs ??= fetch(evidence('costs/receipts.json')).then(r => r.ok ? r.json() as Promise<Costs> : null).catch(() => null)
const loadBoards = () => boards ??= fetch(evidence('board-receipts/index.json')).then(r => r.ok ? r.json() as Promise<BoardIndex> : { boards: [] }).then(d => new Set(d.boards.map(b => b.id))).catch(() => new Set<string>())

const lookup = (data: Costs | null, id: string): Entry | undefined => {
  const split = id.indexOf(':')
  return split < 0 || !data ? undefined : data.receipts[id.slice(0, split)]?.[id.slice(split + 1)]
}

export function useReceiptCosts() {
  const [data, setData] = useState<Costs | null>(null)
  useEffect(() => { let active = true; loadCosts().then(value => { if (active) setData(value) }); return () => { active = false } }, [])
  return (id: string) => lookup(data, id)
}

/** A short cost for an atlas row: the request's own cost. */
export function receiptCostText(entry: Entry | undefined) {
  if (!entry) return null
  const [usd, basis] = entry
  return basis === 'unknown' ? 'cost unknown' : basis === 'unbilled' ? '$0 (not billed)' : money(usd)
}

/** Cost per request and cost per board for one receipt page. */
export function ReceiptCostStrip({ id, board }: { id: string; board?: string }) {
  const [state, setState] = useState<{ entry?: Entry; boards: Set<string> } | null>(null)
  useEffect(() => {
    let active = true
    Promise.all([loadCosts(), loadBoards()]).then(([data, ids]) => { if (active) setState({ entry: lookup(data, id), boards: ids }) })
    return () => { active = false }
  }, [id])
  if (!state?.entry) return null
  const [usd, basis, boardTotal, requests, unknown] = state.entry
  const hasPage = !!board && state.boards.has(board)
  return <section className="receipt-cost" aria-label="Cost of this receipt">
    <div><span>This request</span><strong>{basis === 'unknown' ? 'Unknown' : money(usd)}</strong><small>{BASIS[basis] ?? basis}</small></div>
    {board && requests > 0 && <div><span>This model on {board}, this study</span><strong>{boardTotal === null ? 'Unknown' : money(boardTotal)}</strong>
      <small>{requests} {requests === 1 ? 'request' : 'requests'}{boardTotal !== null && requests > 1 ? ` · ${money(boardTotal / requests)} per request` : ''}{unknown ? ` · ${unknown} with unknown cost` : ''}</small></div>}
    {hasPage && <div><span>Every system on this board</span><strong><a href={`#/board-receipts/${board}`}>Board receipt →</a></strong><small>Outcomes, written answers, replays and cost</small></div>}
  </section>
}
