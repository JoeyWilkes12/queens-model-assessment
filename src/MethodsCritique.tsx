import type { ComponentType, ReactNode } from 'react'

type BookUi = {
  PageHero: ComponentType<{ title: string; deck: string; trail: string; action?: { label: string; path?: string; scrollTo?: string } }>
  LocalToc: ComponentType<{ items: { id: string; label: string }[] }>
  Section: ComponentType<{ id?: string; title: string; label?: string; children: ReactNode }>
  Callout: ComponentType<{ tone?: 'note' | 'evidence' | 'caution' | 'stop'; title: string; children: ReactNode }>
  DataTable: ComponentType<{ caption: string; headers: string[]; rows: (string | ReactNode)[][] }>
}

const evidenceUrl = (path: string) => `${import.meta.env.BASE_URL}evidence/${path}`

const greedyRows: [string, string, string, string][] = [
  ['sequence-5-1', 'Solved', '5/5 · 5/5', '0/5 · 0/5'],
  ['sequence-5-2', 'Stops after 2', '0/5 · 0/5', '0/5 · 5/5'],
  ['sequence-5-3', 'Solved', '0/5 · 0/5', '0/5 · 5/5'],
  ['sequence-7-1', 'Solved', '0/5 · 0/5', '0/5 · 0/5'],
  ['sequence-7-2', 'Stops after 1', '0/5 · 0/5', '0/5 · 0/5'],
  ['sequence-7-3', 'Stops after 4', '0/5 · 0/5', '0/5 · 0/5'],
  ['sequence-9-1', 'Stops after 2', '0/5 · 0/5', '0/5 · 0/5'],
  ['sequence-9-2', 'Solved', '0/5 · 0/5', '0/5 · 0/5'],
  ['sequence-9-3', 'Stops after 2', '0/5 · 0/5', '0/5 · 0/5'],
]

export function MethodsCritique({ ui }: { ui: BookUi }) {
  const { PageHero, LocalToc, Section, Callout, DataTable } = ui
  return <>
    <PageHero trail="Receipts / methods critique" title="Ninety attempts, nine boards." deck="An AI-engineering review of what this assessment can support. The selection result holds. The construction result is thinner than its counts suggest, a simple heuristic beats both decision models, and the next study should add boards rather than repeats." action={{ label: 'Read the verdict', scrollTo: 'verdict' }} />
    <div className="reading-layout">
      <LocalToc items={[{ id: 'verdict', label: 'Verdict' }, { id: 'baselines', label: 'Missing baselines' }, { id: 'sample', label: 'Sample & power' }, { id: 'confounds', label: 'Confounds' }, { id: 'next-experiments', label: 'Next experiments' }, { id: 'critique-sources', label: 'Full review' }]} />
      <main className="reading-column" id="main-content">
        <Section id="verdict" title="The verdict in five points" label="Methods critique">
          <ol className="limit-list">
            <li><strong>Selection is solid within its scope.</strong> With explicit candidate regions, Jev and SubQ each chose correctly 24/24 times at 7×7 and 9×9. Representation, not model choice, drives it.</li>
            <li><strong>The real denominator is nine boards.</strong> Every board-by-menu condition was 0/5 or 5/5, so 90 attempts carry about the information of 9–18 boards.</li>
            <li><strong>A greedy rule beats both models:</strong> 4 of 9 boards against Jev's 1 and SubQ's 2.</li>
            <li><strong>Cell choices were near chance.</strong> Excluding forced moves, 34% (Jev) and 33% (SubQ) against 30% and 29% for random picks from the same menus.</li>
            <li><strong>The 10/90 tie says nothing about equal ability.</strong> The models solved different boards; an exact paired test gives p = 1.</li>
          </ol>
          <Callout tone="note" title="How this review was produced.">Claude drafted the questions and synthesis; GPT-6.1 Sol (extra-high reasoning, via Codex) reviewed the evidence read-only. Every figure was recomputed from the published evidence, and the headline baselines were verified a second time independently. No new model requests were made.</Callout>
        </Section>

        <Section id="baselines" title="Baselines the book was missing">
          <p>A greedy rule needs no model: take the unplaced color with the fewest legal cells, place its first legal cell, never backtrack. It uses the same conflict filter as the "local" menu. <a href="#/greedy-rule">The greedy rule chapter</a> replays it step by step on all 201 boards.</p>
          <DataTable caption="Greedy rule against recorded attempts (decision models: raw · local)" headers={['Board', 'Greedy', 'Jev', 'SubQ']} rows={greedyRows.map(row => [row[0].replace('sequence-', ''), row[1] === 'Solved' ? <strong>Solved</strong> : row[1], row[2], row[3]])} />
          <p>It fails on <code>sequence-5-2</code>, where SubQ succeeds, so it is a reference point, not a ceiling. A uniformly random policy under the same protocol expects 1.6 solves in 90 attempts, almost all from filtered menus; filtering raises the chance of solving <code>sequence-5-1</code> from 0.3% to 13.7%.</p>
          <DataTable caption="Non-forced cell choices against chance" headers={['Model', 'Calls', 'Picked a solution cell', 'Random pick, same menus', 'Mean stated probability']} rows={[
            ['Jev 1.13', '121', '33.9%', '30.0%', '48.3%'],
            ['SubQ Snap', '120', '33.3%', '28.8%', '44.9%'],
          ]} />
          <p className="table-note">Region choices are excluded because every region eventually needs a queen. States are adaptive and repeated, so these are descriptive rates. On Jev's filtered <code>sequence-5-1</code> solves, every cell was forced; Jev chose only the color order.</p>
        </Section>

        <Section id="sample" title="How many boards would settle it">
          <DataTable caption="Board-level 95% intervals (Clopper–Pearson)" headers={['Outcome', 'Observed', 'Interval']} rows={[
            ['Jev solved the board (any of 10 attempts)', '1/9', '0.3%–48.2%'],
            ['SubQ, same allowance', '2/9', '2.8%–60.0%'],
            ['Each model, 7×7 and 9×9 pooled', '0/6', '0%–45.9%'],
          ]} />
          <p>To tell a 20% per-board solve rate from 50% with 80% power, a paired design on shared boards needs 25–64 boards per size, depending on how often the two policies disagree. <strong>64 new boards per size</strong> covers the plausible range.</p>
        </Section>

        <Section id="confounds" title="Confounds to design out">
          <DataTable caption="Protocol confounds" headers={['Confound', 'Fix']} rows={[
            ['Options listed alphabetically and row-major, so position, label and geometry are entangled', 'Balanced permutations, interleaved; test label renaming separately'],
            ['Different providers, routes, dates and preview aliases', 'Report a comparison of services under recorded conditions'],
            ['Singleton menus count as progress without any inference', 'Report non-forced decision survival alongside placements'],
            ['16 + 9 batch split changes co-present questions', 'Compare 1/8/16-question batches on matched states'],
            ['One generator family; size used as a difficulty label', 'Stratify by a difficulty profile; add a second generator and real boards'],
          ]} />
          <p>The stopping rule, end the attempt at the first unextendable prefix, is principled for first-path estimates on unique-solution boards. It also rules out recovery, which deserves its own labelled condition.</p>
        </Section>

        <Section id="next-experiments" title="Next experiments">
          <DataTable caption="Prioritised experiments" headers={['Priority', 'Experiment', 'Cost']} rows={[
            ['1 · offline', 'Oracle-label every offered cell in all 180 recorded trajectories', '$0'],
            ['2 · offline, done', 'Random and greedy baselines on every board; greedy step records for all 201 boards (17 Oct)', '$0'],
            ['3 · offline', 'Calibration by task, menu and board', '$0'],
            ['4 · SubQ, done 15 Oct', '64 new certified boards per size, one raw and one local attempt each', '≈$0.08 spent'],
            ['5 · SubQ now', 'Answer-position permutations on one frozen state per board', '≈$0.03'],
            ['6 · SubQ now', 'Same question in 1-, 8- and 16-question batches', '≈$0.04'],
            ['7 · later', 'Feedback and backtracking, equal call budgets', '≤$0.29'],
            ['8 · done 16 Oct', 'Jev on the same 192-board panel; four frontier models on 36 of its boards', '≈$9.26 (Jev $0.12)'],
          ]} />
          <Callout tone="evidence" title="Experiment 4 ran on 15 October, as preregistered.">On 192 new boards SubQ solved 19: 16 of 64 at 5×5, 3 of 64 at 7×7 and none at 9×9. The greedy rule solved 80; random choice would be expected to solve about 7. The conflict filter helped significantly at 5×5 (15/64 vs 6/64, Holm p = 0.035). <a href="#/subq-assessment/panel">Read the panel results</a>.</Callout>
        </Section>

        <Section id="critique-sources" title="Read the full review">
          <div className="next-actions">
            <a href={evidenceUrl('methods-critique.md')} download>Download the full methods critique</a>
            <a href={evidenceUrl('methods-critique/calculation-results.json')} download>Calculation results (JSON)</a>
            <a href={evidenceUrl('methods-critique/cell-probability-labels.json')} download>Labelled cell decisions (JSON)</a>
          </div>
          <p>The full review covers construct validity, power calculations, difficulty profiling, Noul scoring, the Artificial Analysis comparison, harness changes and a preregistration checklist. The calculation script is <code>scripts/analysis/methods_critique_calculations.py</code>; it reads only public evidence and makes no network requests.</p>
        </Section>
      </main>
    </div>
  </>
}
