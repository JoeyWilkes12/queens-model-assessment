import { type ReactNode } from 'react'
import { CostLedger } from './CostLedger'
import { FeaturedReplays } from './FeaturedReplays'
import { Leaderboard } from './Leaderboard'
import { PairStrip } from './PairStrip'
import { Scoreboard } from './Scoreboard'
import { BoardDiagram, AssessmentReceipt, JevCandidateLens } from './bookFigures'
import { Icon, LocalToc, PageHero, Section, bookUi } from './bookUi'
import { studies } from './studies'

export function Disclosure({ label, children }: { label: string; children: ReactNode }) {
  return (
    <details className="qa-more">
      <summary>{label}</summary>
      <div className="qa-more-body">{children}</div>
    </details>
  )
}

/** One reader question: a number, a one-line answer, and the evidence behind a disclosure. */
export function Answer({
  id,
  question,
  stat,
  statLabel,
  statSr,
  answer,
  more,
  children,
}: {
  id: string
  question: string
  stat: string
  statLabel: string
  statSr?: string
  answer: ReactNode
  more: string
  children: ReactNode
}) {
  const hidden = statSr ? true : undefined
  return (
    <li className="qa-item" id={id}>
      <h3>{question}</h3>
      <p className="qa-stat">
        <span className="qa-number" aria-hidden={hidden}>
          {stat}
        </span>
        <span className="qa-label" aria-hidden={hidden}>
          {statLabel}
        </span>
        {statSr && <span className="sr-only">{statSr}</span>}
      </p>
      <p className="qa-answer">{answer}</p>
      <Disclosure label={more}>{children}</Disclosure>
    </li>
  )
}

export function Facts({ items }: { items: [string, ReactNode][] }) {
  return (
    <dl className="qa-facts">
      {items.map(([term, text]) => (
        <div key={term}>
          <dt>{term}</dt>
          <dd>{text}</dd>
        </div>
      ))}
    </dl>
  )
}

export function QaLinks({ links }: { links: [string, string][] }) {
  return (
    <p className="qa-links">
      {links.map(([label, href]) => (
        <a key={href} href={href}>
          {label} <Icon name="arrow" size={14} />
        </a>
      ))}
    </p>
  )
}

export function ExecutiveSummary() {
  return (
    <>
      <PageHero
        className="page-hero--board"
        trail="Read first"
        title="Frontier reasoning models solve Queens boards from a picture. Decision models rarely finish one."
        deck="Queens is a logic puzzle: one queen in every row, column and colored region, with no two queens touching. The shared benchmark compares systems on the same boards. The completed open-weight view shows local results by study."
      />
      <section className="board-cover" aria-labelledby="leaderboard-title">
        <Leaderboard ui={bookUi} titleId="leaderboard-title" />
      </section>
      <p className="qa-caveat" style={{ paddingInline: '28px' }}>
        Open-weight results retain their board panels, prompt arms, input formats and token budgets.{' '}
        <a href="#/local-qwen">Explore the local assessment receipts and cost scenarios</a>.
      </p>
      <AssessmentReceipt />
      <div className="reading-layout">
        <LocalToc
          items={[
            { id: 'finding', label: 'Short answers' },
            { id: 'scoreboard', label: 'Results by task' },
            { id: 'watch', label: 'Watch it happen' },
            { id: 'limits', label: 'Limits' },
            { id: 'next', label: 'Go deeper' },
          ]}
        />
        <main className="reading-column" id="main-content">
          <Section id="finding" title="Short answers">
            <Disclosure label="What a solved board looks like">
              <div className="split-figure">
                <BoardDiagram size="five" compact />
                <div className="figure-copy">
                  <p>
                    Our code checks every answer against the four rules, and two independent solvers confirmed that each
                    test board has exactly one solution. Z3, a standard solver, never competed; its chapter walks
                    through three reference boards.
                  </p>
                  <QaLinks
                    links={[
                      ['Queens rules', '#/queens-rules'],
                      ['How Z3 solves Queens', '#/how-z3-solves-queens'],
                    ]}
                  />
                </div>
              </div>
            </Disclosure>
            <ul className="qa-list">
              <Answer
                id="qa-image"
                question="Can a model solve a board from a picture?"
                stat="140/144"
                statLabel="right answers, 4 models × 36 boards"
                statSr="140 of 144: four frontier models on 36 boards."
                answer="Yes. Each model saw an empty board and wrote the whole solution in one reply."
                more="Model by model"
              >
                <Facts
                  items={[
                    [
                      '16 Oct · The 36 boards',
                      'GPT-5.6 Sol and Claude Opus 4.8 solved 36, Grok 4.6 and Gemini 3.1 Pro Preview 34. 127 of the 140 followed the requested answer format exactly; 13 were right but formatted loosely. Grok hit its length limit on two 9×9 boards; two Gemini requests were refused by the provider (HTTP 429) before any answer.',
                    ],
                    [
                      '17–19 Oct · Older models',
                      'GPT-5.5, GPT-5.4, GPT-5, Claude Opus 4.7 and Opus 4.6 solved 166 of 180 on the same boards; all 14 misses hit the length limit, 13 of them GPT-5’s. Gemini 2.5 Pro solved 27, Gemini 2.5 Flash 12, GPT-4.1 1.',
                    ],
                    [
                      '17 Sep · Original 3 boards',
                      '11 of 12. Grok’s 7×7 request timed out after ten minutes; sent again unchanged on 16 Oct, it came back correct.',
                    ],
                    [
                      '1 Oct · Nine earlier models',
                      '21 of 27 on the original boards. Retrying the 6 misses twice each, as an image, a region grid and cell lists, solved 10 of 36 tries, 4 of 12 from the image.',
                    ],
                    [
                      '17 Oct · One queen per request',
                      'All four frontier models solved a 5×5 practice board one queen per request, with no revisions. The full 36-board run was over budget, so it never ran.',
                    ],
                    [
                      'Cost per solved board',
                      'GPT-5.6 Sol $0.015 (half-price batch service), Grok 4.6 $0.045, Claude Opus 4.8 $0.092, Gemini 3.1 Pro Preview $0.102.',
                    ],
                  ]}
                />
                <p className="qa-caveat">
                  The top models scored near perfect on these computer-made, lettered boards, so this test can’t rank
                  them.
                </p>
                <QaLinks
                  links={[
                    ['Protocol & results', '#/protocol-results'],
                    ['Earlier generations', '#/earlier-generations'],
                    ['One queen at a time', '#/frontier-trajectories'],
                    ['Board receipts', '#/board-receipts'],
                  ]}
                />
              </Answer>
              <Answer
                id="qa-build"
                question="Can a decision model solve a board move by move?"
                stat="21 · 19"
                statLabel="of 192 boards, Jev and SubQ Snap"
                statSr="Jev solved 21 of 192 boards, SubQ Snap 19."
                answer="Rarely. Neither solved a 9×9, while a simple rule with no model solved 80 boards, 14 of them 9×9."
                more="By size, and the first nine boards"
              >
                <Facts
                  items={[
                    [
                      'By size, 64 boards each',
                      '5×5, 7×7, 9×9: Jev 14, 7, 0 · SubQ Snap 16, 3, 0 · simple rule 42, 24, 14. Random picks would solve about 7 in all.',
                    ],
                    ['Overlap', 'Only 7 boards were solved by both models; 33 by either.'],
                    [
                      'Removing illegal moves',
                      'Taking illegal squares off the menu helped SubQ on 5×5 boards (15 vs 6 of 64), a gap unlikely to be chance. Jev’s gain, 13 vs 7, could be chance.',
                    ],
                    [
                      'Real choices',
                      'When the menu left a real choice of square, Jev kept the solution in reach 43.8% of the time (a random pick: 32.6%), SubQ 30.5% (random: 23.4%). The edge came from unfiltered menus; with illegal squares removed, both were near chance.',
                    ],
                    [
                      '30 Sep and 13 Oct · First nine boards',
                      'Each model finished 10 of 90 attempts: Jev 1 board, SubQ 2. The simple rule solved 4 of 9, including a 7×7 and a 9×9 neither model solved.',
                    ],
                  ]}
                />
                <p className="qa-caveat">
                  The simple rule fills the color with the fewest open squares first and never undoes a move. The
                  192-board test plan was fixed before any run.
                </p>
                <QaLinks
                  links={[
                    ['192-board test', '#/subq-assessment/panel'],
                    ['The simple rule', '#/greedy-rule'],
                    ['SubQ Snap replay', '#/subq-assessment'],
                    ['Jev trajectories', '#/jev-trajectories'],
                  ]}
                />
              </Answer>
              <Answer
                id="qa-jev"
                question="What is Jev good at?"
                stat="24/24"
                statLabel="right picks, colors listed"
                answer="Picking the one valid board from up to 255 options, once our code has checked the other rules and listed the colored regions each option uses. Given only column numbers, it got 1 of 24."
                more="Try both kinds of list"
              >
                <JevCandidateLens />
                <Facts
                  items={[
                    [
                      'Input',
                      'Jev answers three kinds of question about a text version of the board: pick an option, yes or no, or a score. It cannot read images; our picture prompt was rejected (HTTP 400).',
                    ],
                    [
                      'Building',
                      'Asked to produce a board itself, it failed all 5 early probes (four row-by-row builds, one pick from all 120 column orders) and all 6 fresh boards. On those 6 boards it picked the right finished board 6 of 6 times with colors listed, 0 of 6 with columns only.',
                    ],
                    [
                      'Confidence',
                      'Its confidence in the right option fell as lists grew from 12 to 255: 0.96 to 0.73 on a 7×7 board, 0.90 to 0.67 on a 9×9.',
                    ],
                    [
                      'Yes or no',
                      'Asked whether each option was valid, it said yes to all 6 valid boards and to 5 of the 66 invalid ones.',
                    ],
                    ['Repeatability', 'Asking the same question again changed its pick in 8 of 17 cases.'],
                    [
                      '14 Oct · Decision Index',
                      'Jev scores 57.5, the highest of 11 decision models on the Artificial Analysis index. Claude Haiku 5.5 (Low), a general model, scores 60.6.',
                    ],
                  ]}
                />
                <p className="qa-caveat">The 24 lists come from two boards, so they are not 24 separate puzzles.</p>
                <QaLinks
                  links={[
                    ['Jev primer', '#/jev-primer'],
                    ['Candidate engineering', '#/candidate-engineering'],
                    ['Scale & primitives', '#/scale-primitives'],
                    ['Decision models vs the index', '#/decision-models'],
                  ]}
                />
              </Answer>
              <Answer
                id="qa-local"
                question="Can models running on our own computer do it?"
                stat="38/48"
                statLabel="strict requests, Qwen 9B on fresh1"
                statSr="Qwen 9B returned 38 strict correct answers on 48 requests across 12 fresh1 boards and four prompt conditions."
                answer="Yes, with large differences between tested configurations. On the same 12 fresh1 boards across four prompt arms, Qwen 9B returned 38 of 48 strict answers, Gemma 4 E4B 10 of 48 and LLaVA-Llama3 0 of 48. Qwen 4B finished the image panel at 16 of 48 strict. On text grids, GPT-OSS 20B scored 23 of 48 and Qwen 9B scored 26 of 48. On images with a request-level JSON schema, Qwen 9B returned 19 of 24 strict. Qwen 27B completed Fresh1 images with 43 of 48 strict. Qwen 9B also scored 43 of 48 on the separate Fresh2 image panel. Three sampling rounds are now complete for both larger Qwen models on the earlier panel. On the earlier boards, Qwen 27B greedy returned 24 of 24 at its 24,576-token limit. These are separate studies; repeated prompt arms are not independent puzzles."
                more="Original 4B pilot, 28 Oct"
              >
                <p>
                  The original 4B pilot below is preserved separately from the later larger-budget and larger-model
                  experiments.
                </p>
                <PairStrip />
                <Facts
                  items={[
                    ['Exact format only', 'Plain prompt 1, Caveman 5: both solved 1 board, only Caveman 4, neither 7.'],
                    [
                      'Setup',
                      'Qwen3.5 4B through Ollama, a free app for running models, with no tools. 12 of the 36 boards, 4 per size, one try per board per prompt.',
                    ],
                    [
                      'Length limit',
                      '16 of 24 replies hit the 12,288-token limit before answering, including all 8 at 9×9. On panel-7-01 the plain prompt answered and Caveman ran out.',
                    ],
                    [
                      'Tokens',
                      'Caveman’s instructions added 1,131 tokens to every request, so the total did not fall: 156,608 with Caveman, 151,751 without.',
                    ],
                    [
                      'Caveman',
                      'A free third-party add-on that tells the model to answer in as few words as possible, checked for safety before use. No fee; electricity was not measured.',
                    ],
                  ]}
                />
                <p className="qa-caveat">
                  Four boards per size, one run each, plain prompt always first: this cannot show that Caveman caused
                  the gain.
                </p>
                <p>
                  {'Caveman’s cost and correctness tradeoffs varied across studies. At the saved tariffs, Qwen 27B spent less with Caveman in each of its three sampling rounds, while Qwen 9B spent more in round three. Both 27B arms solved all twelve round-three boards after accounting for response format. '}
                  <a href="#/caveman-summary">Compare outcomes and estimated costs across studies</a>.
                </p>
                <QaLinks
                  links={[
                    ['Local open-weight assessments', '#/local-qwen'],
                    ['Original 4B pilot', '#/local-open-models'],
                    ['Caveman comparison', '#/caveman-summary'],
                  ]}
                />
              </Answer>
              <Answer
                id="qa-cost"
                question="What did it cost?"
                stat="$31.48"
                statLabel="recorded API spend, all studies"
                answer="Little. Most went on the two 36-board picture tests, and every request, visible reply and grade is saved."
                more="Breakdown and records"
              >
                <Facts
                  items={[
                    ['By provider', 'OpenRouter $31.31, SubQ $0.17.'],
                    [
                      'Largest items',
                      'The two 36-board picture tests: $17.71 for the older models, $9.10 for the frontier models.',
                    ],
                    [
                      'Not counted',
                      '2 requests with unknown cost, AI agent use outside the studies, and the local runs, which had no fee.',
                    ],
                    [
                      'Evidence atlas',
                      '5,417 request records from 19 study stages. The local runs keep their own receipts.',
                    ],
                    [
                      'Board receipts',
                      '36 boards, each tried by 15 systems. None was solved by all 15; each was solved by 7 to 14.',
                    ],
                  ]}
                />
                <QaLinks
                  links={[
                    ['Assessment receipt', '#/assessment-receipt'],
                    ['Evidence atlas', '#/evidence-atlas'],
                    ['Board receipts', '#/board-receipts'],
                  ]}
                />
              </Answer>
            </ul>
          </Section>
          <Section id="scoreboard" title="Results by task">
            <p>
              Each task scored on its full set of boards, including all 192 decision-model boards. Compare models within
              one chart.
            </p>
            <Scoreboard>
              <details className="sb-explain">
                <summary>Why the two charts differ</summary>
                <p>
                  The language models saw a picture of an empty board and wrote the whole answer in one reply, with one
                  try per board. The decision models read a text grid and picked one option at a time from a menu our
                  code built. Moves with a single option were made for them, and the filtered menu also removed illegal
                  squares. They had 10 tries per board on the first nine boards and 2 on the 192-board test. The closest
                  like-for-like test is <a href="#/frontier-trajectories">One queen at a time</a>, so far only a pilot
                  on one 5×5 practice board: the language models get the same text state, with no menu, and may revise.
                </p>
              </details>
            </Scoreboard>
            <details className="sb-help sb-ledger">
              <summary>Cost per solved board</summary>
              <p>
                Both 36-board picture tests, scored requests only. The{' '}
                <a href="#/assessment-receipt">assessment receipt</a> lists every API-billed study; each{' '}
                <a href="#/board-receipts">board receipt</a> shows its answers, replays and cost.
              </p>
              <CostLedger ui={bookUi} compact />
            </details>
          </Section>
          <Section id="watch" title="Watch it happen">
            <p>Each frame is a saved move, including moves the harness forced, and the checker’s verdict.</p>
            <FeaturedReplays />
            <div className="next-actions">
              <a href="#/frontier-trajectories">
                Frontier models, one queen per request <Icon name="arrow" />
              </a>
              <a href="#/greedy-rule">
                The simple rule, step by step <Icon name="arrow" />
              </a>
            </div>
          </Section>
          <Section id="limits" title="What this can’t tell you">
            <ul className="limit-list">
              <li>
                <strong>Which model is best.</strong> Queens is one puzzle, the boards are computer-made with lettered
                regions, and the top models all scored near perfect.
              </li>
              <li>
                <strong>Whether decision models plan on their own.</strong> Every success went through code that built,
                filtered or checked their options.
              </li>
              <li>
                <strong>Much from the small studies.</strong> Jev solved 1 of its first nine boards; its true rate could
                be anywhere from under 1% to nearly half.
              </li>
            </ul>
            <Disclosure label="What would settle it">
              <p>
                Telling a 20% solve rate from a 50% one takes 25 to 64 shared boards per size. The 192-board test has 64
                per size; the picture tests 12; the local runs 4. Still to do:
              </p>
              <ul className="limit-list">
                <li>Mark every square offered in all 180 recorded attempts as on or off the solution (no cost).</li>
                <li>Check whether Jev’s confidence matches how often it is right (no cost).</li>
                <li>
                  Shuffle the order of options (about $0.03) and change how many questions go in one request (about
                  $0.04).
                </li>
                <li>Let models see mistakes and undo moves (up to $0.29).</li>
                <li>Run one queen at a time on all 36 boards when budget allows.</li>
              </ul>
              <QaLinks links={[['Methods critique', '#/methods-critique']]} />
            </Disclosure>
          </Section>
          <Section id="next" title="Go deeper">
            <div className="next-actions">
              <a href="#/queens-rules">
                Queens rules <Icon name="arrow" />
              </a>
              <a href="#/how-z3-solves-queens">
                How Z3 solves Queens, in ten chapters <Icon name="arrow" />
              </a>
              <a href="#/board-receipts">
                36 board receipts <Icon name="arrow" />
              </a>
              <a href="#/evidence-atlas">
                Search 5,417 saved requests <Icon name="arrow" />
              </a>
            </div>
            <Disclosure label="Main studies by date, 17 Sep to 2 Nov">
              <ol className="study-timeline">
                {studies.map(([iso, date, title, path, result]) => (
                  <li key={`${iso}-${title}`}>
                    <time dateTime={iso}>{date}</time>
                    <a href={`#/${path}`}>{title}</a>
                    <span className="study-result">{result}</span>
                  </li>
                ))}
              </ol>
            </Disclosure>
          </Section>
        </main>
      </div>
    </>
  )
}
