import { LocalToc, PageHero, Section, Callout, DataTable } from './bookUi'

export function ScalePrimitives() {
  return (
    <>
      <PageHero
        trail="The Jev question / scale"
        title="Ranking held; absolute judgment wobbled."
        deck="Across two reused boards and 24 menu variants, explicit-region selection was correct 24/24; the candidate lists overlap, so these are not 24 independent puzzles. The primitive study shows why selection, validity, and ordinal coverage are different claims."
      />
      <div className="reading-layout">
        <LocalToc
          items={[
            { id: 'scale-table', label: 'Scale table' },
            { id: 'new-boards', label: 'Held-out boards' },
            { id: 'noul-score', label: 'Noul + Score' },
          ]}
        />
        <main className="reading-column" id="main-content">
          <Section id="scale-table" title="The 255-option edge">
            <DataTable
              caption="Jev scale study"
              headers={['Board', 'Options', 'Columns only', 'Explicit regions', 'Mean P(true), regions']}
              rows={[
                ['7×7', '12', '0/3', '3/3', '0.960'],
                ['7×7', '50', '0/3', '3/3', '0.877'],
                ['7×7', '100', '0/3', '3/3', '0.837'],
                ['7×7', '255', '0/3', '3/3', '0.730'],
                ['9×9', '12', '1/3', '3/3', '0.900'],
                ['9×9', '50', '0/3', '3/3', '0.790'],
                ['9×9', '100', '0/3', '3/3', '0.730'],
                ['9×9', '255', '0/3', '3/3', '0.667'],
              ]}
            />
            <p>
              <strong>All 24 tested explicit-region menus succeeded, including six at the 255-option limit.</strong>{' '}
              Larger menus, new boards and harder search remain untested by this comparison. Also, mean probability on
              the correct answer declined as options increased, and one 9×9/255 response assigned the true option only
              0.50.
            </p>
          </Section>
          <Section id="new-boards" title="Six new boards, five tasks each">
            <p>
              Two boards each at 5×5, 7×7, and 9×9 were accepted from separate fixed seeds after connected regions,
              unique solutions, and nonduplication checks. These are six board-level units, not 30 independent puzzles
              or 534 independent decisions.
            </p>
            <div className="finding-strip finding-strip--quiet">
              <div>
                <strong>0/6</strong>
                <span>matrix construction</span>
              </div>
              <div>
                <strong>0/6</strong>
                <span>prose construction</span>
              </div>
              <div>
                <strong>6/6</strong>
                <span>explicit-region Choice</span>
              </div>
            </div>
            <Callout tone="caution" title="Distribution diversity is not established.">
              The new boards share a generator family. The 9×9 construction intentionally restricts two seed regions
              from growing. Size must not be equated with validated difficulty.
            </Callout>
          </Section>
          <Section id="noul-score" title="Noul and Score are not interchangeable">
            <DataTable
              caption="Held-out primitive checks"
              headers={['Condition', 'Result', 'What it means']}
              rows={[
                [
                  'Explicit regions · answer present · Noul',
                  '6 TP, 5 FP',
                  'True candidate ranked highest, but threshold acceptance was unsafe.',
                ],
                [
                  'Explicit regions · answer present · Score',
                  '32/72 modal level',
                  'Ordinal precision stayed below a majority reference.',
                ],
                [
                  'All-invalid · Choice none',
                  '6/6 rejects',
                  'Choice chose “none” on all six all-invalid sets; a small same-family sample, not a general rejection rate.',
                ],
                ['All-invalid · Noul < .5', '4/6 rejects', 'Independent thresholds missed two sets.'],
                ['All-invalid · Score complete < .5', '3/6 rejects', 'Scalar threshold missed three sets.'],
              ]}
            />
            <p>
              Choice's winning option and Noul/Score's absolute values answer different questions. Keep the exact
              validator in the loop.
            </p>
          </Section>
        </main>
      </div>
    </>
  )
}
