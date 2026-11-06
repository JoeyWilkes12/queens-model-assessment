import { JevCandidateLens } from './bookFigures'
import { LocalToc, PageHero, Section, Callout, DataTable } from './bookUi'

export function CandidateEngineering() {
  return (
    <>
      <PageHero
        trail="The Jev question / candidate engineering"
        title="Make the missing condition legible."
        deck="The successful adaptation supplied complete placements and asked Jev to select among them; it did not require discovering one. Code guaranteed rows, columns and non-touching, then exposed occupied region letters so the choice depended on region distinctness."
        action={{ label: 'Inspect the scale study', path: 'scale-primitives' }}
      />
      <div className="reading-layout">
        <LocalToc
          items={[
            { id: 'lens', label: 'Rule lens' },
            { id: 'variations', label: 'Variations' },
            { id: 'interpretation', label: 'Interpretation' },
          ]}
        />
        <main className="reading-column" id="main-content">
          <Section id="lens" title="The candidate lens">
            <JevCandidateLens />
          </Section>
          <Section id="variations" title="Not every representation improved">
            <DataTable
              caption="5×5 candidate-variation results"
              headers={['Input variation', 'Correct', 'Median API seconds']}
              rows={[
                ['Column vectors with mixed distractors', '0/3', '0.311'],
                ['Individual coordinates + region labels', '1/3', '0.324'],
                ['Precomputed counts + touching pairs', '3/3', '0.314'],
                ['Flat occupied-region list', '3/3', '0.333'],
                ['Same list in one sentence', '3/3', '0.233'],
                ['Reordered descriptions', '1/3', '0.248'],
              ]}
            />
            <p>
              All 39 requests returned interpretable Choice answers. The final successful reformulation was exploratory
              evidence, not a preregistered independent validation.
            </p>
          </Section>
          <Section id="interpretation" title="What can and cannot be credited">
            <Callout tone="caution" title="Representation and instruction specificity changed together.">
              The data support the combined interface: explicit regions plus a precise distinctness instruction.
              Formatting alone cannot be credited for the improvement, and the model must not receive credit for the
              local generator's search and validation.
            </Callout>
            <p>
              The practical pattern is proposal then proof: a Jev-assisted application may choose a candidate, but the
              exact checker should gate acceptance.
            </p>
          </Section>
        </main>
      </div>
    </>
  )
}
