import { LocalToc, PageHero, Section, Callout, DataTable } from './bookUi'

export function JevPrimer() {
  return (
    <>
      <PageHero
        trail="The Jev question"
        title="Jev receives a decision, not a blank canvas."
        deck="Jev 1.13 accepts text or structured state and returns typed decisions. It does not see the report's images or write an ordinary explanatory chat answer."
      />
      <div className="reading-layout">
        <LocalToc
          items={[
            { id: 'interface', label: 'Interface' },
            { id: 'before', label: 'Before engineering' },
            { id: 'primitives', label: 'Primitives' },
          ]}
        />
        <main className="reading-column" id="main-content">
          <Section id="interface" title="The interface changes the task">
            <p>
              The saved experiment used OpenRouter's Decisions route with a canonical text region grid. The original
              image prompt received HTTP 400 because this family requires its separate Decisions API. That is an
              interface mismatch, not a wrong puzzle answer.
            </p>
            <div className="primitive-ribbon">
              <div>
                <strong>Choice</strong>
                <span>Which supplied option?</span>
              </div>
              <div>
                <strong>Noul</strong>
                <span>Is this statement true?</span>
              </div>
              <div>
                <strong>Score</strong>
                <span>Where on ordered levels?</span>
              </div>
            </div>
          </Section>
          <Section id="before" title="Before candidate engineering">
            <DataTable
              caption="Native Jev probes"
              headers={['Test', 'Complete answer', 'Elapsed', 'Confirmed USD']}
              rows={[
                ['5×5 simultaneous row choices', 'Invalid', '0.435s', '$0.000056742'],
                ['7×7 simultaneous row choices', 'Invalid', '0.249s', '$0.000088452'],
                ['9×9 simultaneous row choices', 'Invalid', '0.349s', '$0.000129276'],
                ['5×5 sequential rows', 'Invalid', '1.189s total', '$0.000158802'],
                ['120-permutation recognition', 'Invalid', '0.245s', '$0.000235746'],
              ]}
            />
            <p>
              Jev read 9/9 sampled grid cells correctly but agreed with the checker on only 8/12 self-constraint
              questions. The questions were unbalanced, so the result does not establish reliable self-verification.
            </p>
          </Section>
          <Section id="primitives" title="Do not turn a scalar into a certificate">
            <Callout tone="evidence" title="Choice is relative; Noul is absolute; Score is ordinal.">
              Choice can force a winner when none is correct unless a rejection option is present. Noul's probability of
              yes needs a threshold and a balanced prevalence. Score's expected level is a probability-weighted index
              within the authored rubric, not a probability of validity.
            </Callout>
            <p>
              Questions in a batch see the same state but are evaluated separately. Confidence is concentration of a
              returned distribution, not proof that a candidate satisfies the board.
            </p>
          </Section>
        </main>
      </div>
    </>
  )
}
