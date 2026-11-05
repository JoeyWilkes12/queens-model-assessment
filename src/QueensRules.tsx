import { BoardDiagram, ReportFigures } from './bookFigures'
import { Icon, LocalToc, PageHero, Section, Callout, DataTable } from './bookUi'

export function QueensRules() {
  return (
    <>
      <PageHero
        trail="The board"
        title="Queens is regional, not ordinary N-queens."
        deck="Every row, every column, every connected region, and every touching pair participates in the same global constraint system."
      />
      <div className="reading-layout">
        <LocalToc
          items={[
            { id: 'four-rules', label: 'Four rules' },
            { id: 'five-board', label: '5×5 board' },
            { id: 'figures', label: 'Report figures' },
            { id: 'scale', label: 'Board scale' },
          ]}
        />
        <main className="reading-column" id="main-content">
          <Section id="four-rules" title="Four rules, one placement">
            <div className="rule-list">
              <div>
                <span>R1</span>
                <p>
                  <strong>One queen per row.</strong> Every row receives exactly one selected cell.
                </p>
              </div>
              <div>
                <span>R2</span>
                <p>
                  <strong>One queen per column.</strong> Column positions must be unique.
                </p>
              </div>
              <div>
                <span>R3</span>
                <p>
                  <strong>One queen per region.</strong> Matching letters identify the same connected region.
                </p>
              </div>
              <div>
                <span>R4</span>
                <p>
                  <strong>No touching queens.</strong> Chebyshev distance must exceed one; longer diagonals are allowed.
                </p>
              </div>
            </div>
            <p className="lead">
              The global burden is the interaction: a locally legal cell can consume the only useful region or column
              needed later.
            </p>
            <div className="next-actions">
              <a href="#/how-z3-solves-queens">
                How Z3 solves Queens <Icon name="arrow" />
              </a>
            </div>
          </Section>
          <Section id="five-board" title="A verified 5×5 target">
            <div className="split-figure">
              <BoardDiagram size="five" />
              <div className="figure-copy">
                <p>
                  The solution is columns by row <code>[5, 3, 1, 4, 2]</code>; its occupied regions are C, B, A, D, E.
                  Region C is a singleton in the upper-right cell.
                </p>
                <Callout tone="evidence" title="Why the red outline mattered in the report.">
                  The illustrative comparison shows a near-miss that passes rows, columns, and spacing but repeats D.
                  The deterministic checker, not visual plausibility, decides correctness.
                </Callout>
              </div>
            </div>
          </Section>
          <Section id="figures" title="The report's visual receipts">
            <ReportFigures />
          </Section>
          <Section id="scale" title="Three boards, not a difficulty curve">
            <DataTable
              caption="Canonical target boards"
              headers={['Board', 'Permutations checked', 'Search nodes', 'Unique solutions']}
              rows={[
                ['5×5 · easy', '120', '38', '1'],
                ['7×7 · medium', '5,040', '197', '1'],
                ['9×9 · hard', '362,880', '1,172', '1'],
              ]}
            />
            <p>
              Labels are provisional descriptions of these generated boards. Size, solver search work, image handling,
              response length, routing, and provider timing are not interchangeable measurements.
            </p>
          </Section>
        </main>
      </div>
    </>
  )
}
