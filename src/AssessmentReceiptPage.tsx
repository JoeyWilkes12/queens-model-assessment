import { CostLedger } from './CostLedger'
import { AssessmentReceipt } from './bookFigures'
import { LocalToc, PageHero, Section, Callout, DataTable, bookUi } from './bookUi'

export function AssessmentReceiptPage() {
  return (
    <>
      <PageHero
        trail="Read first / receipt"
        title="Assessment receipt"
        deck="The report's trust strip, expanded into a readable ledger: what was in scope, what was measured, and which edges remain unresolved."
      />
      <AssessmentReceipt />
      <div className="reading-layout">
        <LocalToc
          items={[
            { id: 'scope', label: 'Scope' },
            { id: 'ledger', label: 'Ledger' },
            { id: 'costs', label: 'Cost by evaluation' },
            { id: 'boundaries', label: 'Boundaries' },
          ]}
        />
        <main className="reading-column" id="main-content">
          <Section id="scope" title="Scope before score">
            <p>
              The original language-model condition was one request, one fresh context, and one scored answer
              opportunity per model per board. It was not an agentic sandbox. Jev was evaluated separately through typed
              Decisions calls with text state.
            </p>
            <div className="scope-grid">
              <div>
                <span>Included</span>
                <strong>Historical studies and the SubQ replay</strong>
                <p>
                  Requests, visible responses, grades, usage, timing, and preserved transport failures, including the
                  October 1 generation replay and the October 13 SubQ follow-up.
                </p>
              </div>
              <div>
                <span>Excluded</span>
                <strong>Private and irreproducible payloads</strong>
                <p>No credentials, encrypted reasoning, hidden answer keys, or unrelated repository files.</p>
              </div>
            </div>
          </Section>
          <Section id="ledger" title="September 19 historical ledger">
            <DataTable
              caption="Inference cost accounting"
              headers={['Component', 'Confirmed USD', 'Unresolved allowance']}
              rows={[
                ['Original reasoning-model pilot', '$0.667009200', '$0.225228800'],
                ['First Jev deep dive', '$0.000792540', '$0.041268820'],
                ['Jev 39-call variations', '$0.002274384', '$0.000000000'],
                ['Jev larger-board scale', '$0.020552112', '$0.040000000'],
                ['Jev new-board primitives', '$0.004976664', '$0.012497446'],
                ['Total', '$0.695604900', '$0.318995066'],
              ]}
            />
            <p className="table-note">
              Conservative accounted total: <strong>$1.014599966</strong>. Remaining under the $3 allowance:{' '}
              <strong>$1.985400034</strong>. Allowances are reservations, not measured charges.
            </p>
          </Section>
          <p>
            <a href="#/jev-trajectories">September 30 follow-up: view the updated all-study cost ledger.</a>{' '}
            <a href="#/earlier-generations">The October 1 replay reports its own incremental budget and cost ledger.</a>{' '}
            <a href="#/subq-assessment">
              SubQ Snap is billed by SubQ directly: $0.17 for its 2,434 answered requests (as of 19 October), itemised
              in the cost table below.
            </a>
          </p>
          <Section id="costs" title="API cost by evaluation, board, request and model">
            <CostLedger ui={bookUi} />
          </Section>
          <Section id="boundaries" title="The receipt is not a certificate">
            <Callout tone="stop" title="A trust receipt makes provenance visible; it does not certify a model.">
              Source class, date, interaction mode, and outcome are reminders to inspect the evidence. They do not imply
              security, broad quality, or production readiness.
            </Callout>
          </Section>
        </main>
      </div>
    </>
  )
}
