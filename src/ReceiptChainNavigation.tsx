import { receiptChainForId } from './receiptChainData'

/** Navigation is defined by a saved attempt's ordered calls, not nearby files. */
export function ReceiptChainNavigation({ receiptId }: { receiptId: string }) {
  const chain = receiptChainForId(receiptId)
  if (!chain) return null
  const label = (call: NonNullable<typeof chain.next>) => `Step ${call.step} · ${call.phase} decision`
  return <nav className="receipt-chain" aria-label="Recorded game request chain">
    <p><strong>{chain.modelLabel} saved attempt · <code>{chain.trajectoryId}</code></strong><br />
      Request {chain.index + 1} of {chain.total} · {label(chain.current)}</p>
    <div className="receipt-chain-actions">
      {chain.previous
        ? <a className="button button-small button-outline" href={`#/evidence-atlas/${chain.previous.id}`} title={label(chain.previous)}>Previous Receipt</a>
        : <button className="button button-small button-outline" disabled>Previous Receipt</button>}
      {chain.next
        ? <a className="button button-small button-mint" href={`#/evidence-atlas/${chain.next.id}`} title={label(chain.next)}>Next Receipt</a>
        : <button className="button button-small button-mint" disabled>Next Receipt</button>}
      <a className="button button-small button-outline receipt-chain-playback" href={chain.playbackPath}>Play full {chain.modelLabel} attempt</a>
    </div>
    <p className="receipt-chain-context">
      {chain.next ? <>Next recorded request: {label(chain.next)}.</> : <>End of this attempt · {chain.stopReason.replace(/_/g, ' ')}.</>}
      {chain.forcedBeforeNext > 0 && <> {chain.forcedBeforeNext} harness-forced decision{chain.forcedBeforeNext === 1 ? '' : 's'} follow this receipt{chain.next ? ' before the next request' : ''}; no API receipts exist for those transitions.</>}
      {' '}Playback includes these forced transitions and the saved evaluator outcomes.
    </p>
  </nav>
}
