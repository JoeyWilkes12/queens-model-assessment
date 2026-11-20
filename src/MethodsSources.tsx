import { Icon, LocalToc, PageHero, Section, Callout } from './bookUi'

export function MethodsSources() {
  return (
    <>
      <PageHero
        trail="Receipts / methods"
        title="Methods & sources"
        deck="Definitions keep the narrative honest. This page names the measurement boundaries, the limits, and the primary public references used for interpretation."
      />
      <div className="reading-layout">
        <LocalToc
          items={[
            { id: 'definitions', label: 'Definitions' },
            { id: 'limits', label: 'Limits' },
            { id: 'models', label: 'Model listings' },
            { id: 'sources', label: 'Rules & Jev docs' },
          ]}
        />
        <main className="reading-column" id="main-content">
          <Section id="definitions" title="Measurement boundaries">
            <div className="definition-list">
              <div>
                <strong>Correct solution</strong>
                <p>An in-range queen in every row, unique columns, exactly one hit per region, and no touching pair.</p>
              </div>
              <div>
                <strong>Strict pass</strong>
                <p>
                  The original output also satisfies the exact JSON-only schema. Post-hoc extraction is a separate
                  diagnostic.
                </p>
              </div>
              <div>
                <strong>Elapsed API time</strong>
                <p>
                  Monotonic client time through full response receipt; not isolated model compute or preparation time.
                </p>
              </div>
              <div>
                <strong>Confirmed USD</strong>
                <p>
                  Returned <code>usage.cost</code>. Missing charges are not zero; allowance is reservation, not billed
                  amount.
                </p>
              </div>
            </div>
          </Section>
          <Section id="limits" title="Limits that materially affect interpretation">
            <Callout tone="caution" title="The denominator is intentionally visible.">
              The October generation replay reuses the three original board images; later Jev studies use small,
              study-specific cohorts, including six held-out construction boards and nine trajectory boards. These do
              not establish broad distribution coverage. Clean images, region letters, singleton regions, preview model
              versions, unequal provider conditions, and generator-family reuse all constrain the inference.
            </Callout>
            <p>
              The same board appears in several conditions and candidate lists overlap. Use distinct boards for
              generalization, paired board-level contrasts for treatments, and board-cluster uncertainty for repeated
              trajectories; report call-level variability separately.{' '}
              <a href="#/methods-critique">Read the full methods critique.</a>
            </p>
          </Section>
          <Section id="models" title="OpenRouter model listings">
            <ul className="source-list">
              <li>
                <a href="https://openrouter.ai/openai/gpt-5.6-sol" target="_blank" rel="noreferrer">
                  GPT-5.6 Sol <Icon name="external" />
                </a>
                <span>OpenAI model listing used for the one-shot pilot.</span>
              </li>
              <li>
                <a href="https://openrouter.ai/anthropic/claude-opus-4.8" target="_blank" rel="noreferrer">
                  Claude Opus 4.8 <Icon name="external" />
                </a>
                <span>Anthropic model listing used for the one-shot pilot.</span>
              </li>
              <li>
                <a href="https://openrouter.ai/x-ai/grok-4.6" target="_blank" rel="noreferrer">
                  Grok 4.6 <Icon name="external" />
                </a>
                <span>Model listing; saved runs used the approved Amazon Bedrock US West 2 route.</span>
              </li>
              <li>
                <a href="https://openrouter.ai/google/gemini-3.1-pro-preview" target="_blank" rel="noreferrer">
                  Gemini 3.1 Pro Preview <Icon name="external" />
                </a>
                <span>Google preview-model listing used for the one-shot pilot.</span>
              </li>
              <li>
                <a href="https://openrouter.ai/typesafe/jev-1.13" target="_blank" rel="noreferrer">
                  Jev 1.13 <Icon name="external" />
                </a>
                <span>Versioned listing resolved by the experiment.</span>
              </li>
              <li>
                <a href="https://openrouter.ai/~typesafe/jev-latest" target="_blank" rel="noreferrer">
                  Jev Latest alias <Icon name="external" />
                </a>
                <span>Moving alias supplied for the deep dive; do not equate it with a frozen build.</span>
              </li>
            </ul>
          </Section>
          <Section id="sources" title="Queens rules, play link, and Jev documentation">
            <ul className="source-list">
              <li>
                <a href="https://www.linkedin.com/help/linkedin/answer/a6269510" target="_blank" rel="noreferrer">
                  LinkedIn Queens help <Icon name="external" />
                </a>
                <span>Authoritative regional one-queen and no-touch rule reference.</span>
              </li>
              <li>
                <a href="https://www.linkedin.com/games/queens/" target="_blank" rel="noreferrer">
                  Play LinkedIn Queens <Icon name="external" />
                </a>
                <span>Live daily game; not a frozen copy of these benchmark boards.</span>
              </li>
              <li>
                <a href="https://docs.typesafe.ai/models" target="_blank" rel="noreferrer">
                  TypeSafe models and aliases <Icon name="external" />
                </a>
                <span>Text modality, version names, and context notes.</span>
              </li>
              <li>
                <a href="https://docs.typesafe.ai/concepts/system-one" target="_blank" rel="noreferrer">
                  System One <Icon name="external" />
                </a>
                <span>Typed decisions over structured state.</span>
              </li>
              <li>
                <a href="https://docs.typesafe.ai/primitives/choice" target="_blank" rel="noreferrer">
                  Choice primitive <Icon name="external" />
                </a>
                <span>Fixed candidate selection and rejection-option design.</span>
              </li>
              <li>
                <a href="https://docs.typesafe.ai/primitives/noul" target="_blank" rel="noreferrer">
                  Noul primitive <Icon name="external" />
                </a>
                <span>Probability of an affirmative binary judgment.</span>
              </li>
              <li>
                <a href="https://docs.typesafe.ai/primitives/score" target="_blank" rel="noreferrer">
                  Score primitive <Icon name="external" />
                </a>
                <span>Ordered descriptive levels and expected index.</span>
              </li>
              <li>
                <a href="https://docs.typesafe.ai/model-jaggedness/jev-1.13" target="_blank" rel="noreferrer">
                  Jev 1.13 known limitations <Icon name="external" />
                </a>
                <span>Vendor cautions about counting, indirection, precision, and cross-primitive consistency.</span>
              </li>
            </ul>
          </Section>
        </main>
      </div>
    </>
  )
}
