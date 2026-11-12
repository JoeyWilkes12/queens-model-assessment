import { Fragment, type ComponentType, type ReactNode } from 'react'
import { MODEL_GROUPS, MODELS, PRIMER_SOURCES, type ModelEntry, type ModelGroup, type SourceRef } from './aboutModelsData'
import './about-models.css'

type BookUi = {
  PageHero: ComponentType<{ title: string; deck: string; trail: string; action?: { label: string; path?: string; scrollTo?: string } }>
  LocalToc: ComponentType<{ items: { id: string; label: string }[] }>
  Section: ComponentType<{ id?: string; title: string; label?: string; children: ReactNode }>
  Callout: ComponentType<{ tone?: 'note' | 'evidence' | 'caution' | 'stop'; title: string; children: ReactNode }>
  DataTable: ComponentType<{ caption: string; headers: string[]; rows: (string | ReactNode)[][] }>
}

/** A source link. Book routes (starting with `#`) stay in the tab; external sources open normally. */
function SourceLink({ source }: { source: SourceRef }) {
  return <a className="am-src" href={source.url}>{source.label}</a>
}

/** The source links for one fact or paragraph, separated by middle dots. */
function Sources({ keys, entry }: { keys: string[]; entry: ModelEntry }) {
  const refs = keys.map(key => entry.sources[key]).filter((ref): ref is SourceRef => Boolean(ref))
  if (!refs.length) return null
  return <span className="am-srcs">{refs.map((ref, index) => <Fragment key={ref.url}>{index > 0 && ' · '}<SourceLink source={ref} /></Fragment>)}</span>
}

/** One model: identity line, labelled facts with their sources, original prose and where its results live. */
function ModelCard({ entry }: { entry: ModelEntry }) {
  return <article className="am-card" id={`model-${entry.id}`} aria-labelledby={`model-${entry.id}-title`}>
    <header className="am-card-head">
      <h3 id={`model-${entry.id}-title`}>{entry.name}</h3>
      <p className="am-card-lab">{entry.lab}</p>
    </header>
    {entry.prose.map(paragraph => <p key={paragraph.text}>{paragraph.text} <Sources keys={paragraph.src} entry={entry} /></p>)}
    <dl className="am-facts">
      {entry.facts.map(fact => <div key={fact.label}>
        <dt>{fact.label}</dt>
        <dd>{fact.value}{fact.src.length > 0 && <> <Sources keys={fact.src} entry={entry} /></>}</dd>
      </div>)}
    </dl>
    <p className="am-results"><span>Results in this book:</span> {entry.results.map((result, index) => <Fragment key={result.href}>{index > 0 && ' · '}<a href={result.href}>{result.label}</a></Fragment>)}</p>
  </article>
}

/** A model group: the at-a-glance table, then one card per model (sub-headed by family where set). */
function ModelGroupSection({ group, ui }: { group: ModelGroup; ui: BookUi }) {
  const { Section, DataTable } = ui
  const entries = MODELS.filter(entry => entry.group === group.id)
  if (!entries.length) return null
  const families = Array.from(new Set(entries.map(entry => entry.family ?? '')))
  const glanceRows = entries.map(entry => [
    // Hash routing owns the fragment, so the link scrolls in place instead of adding a second `#`.
    <a href="#/about-models" onClick={event => { event.preventDefault(); document.getElementById(`model-${entry.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }) }}>{entry.name}</a>,
    entry.lab, entry.glance.released, entry.glance.size, entry.glance.modalities, entry.glance.licence, <code>{entry.glance.build}</code>,
  ])
  return <Section id={`group-${group.id}`} title={group.title}>
    <p>{group.intro}</p>
    <DataTable caption={`${group.title}: at a glance`} headers={['Model', 'Lab', 'Released', 'Size', 'Modalities', 'Licence', 'Build or route we ran']} rows={glanceRows} />
    {families.map(family => <Fragment key={family || 'all'}>
      {family && <h3 className="am-family">{family}</h3>}
      <div className="am-cards">{entries.filter(entry => (entry.family ?? '') === family).map(entry => <ModelCard key={entry.id} entry={entry} />)}</div>
    </Fragment>)}
  </Section>
}

/** Why "the same model" can behave differently: open weights, quantisation, runtimes and tags. */
function Primer({ ui }: { ui: BookUi }) {
  const { Callout } = ui
  const s = PRIMER_SOURCES
  return <Callout tone="note" title="Reading a build: open weights, quantisation, runtimes and tags">
    <dl className="am-primer">
      <div><dt>Open weights</dt><dd>The trained parameters are published for download, so anyone can run the model on their own hardware. Hosted API models are reached only through the lab or a provider; their weights are not published.</dd></div>
      <div><dt>Quantisation</dt><dd>Storing each weight in fewer bits to save memory, at some cost in fidelity. A 4-bit file is roughly a quarter the size of a 16-bit one, so two 4-bit formats of one model are different files and can answer differently.</dd></div>
      <div><dt>Q4_K_M</dt><dd>A llama.cpp "k-quant": 4-bit weights grouped into super-blocks of eight 32-weight blocks, each with a 6-bit scale and minimum, about 4.5 bits per weight for the Q4_K type. The "_M" mix measures about 4.89 bits per weight on Llama 3.1 8B in llama.cpp's own table. <SourceLink source={s.gguf} /> · <SourceLink source={s.quantize} /></dd></div>
      <div><dt>NVFP4 and MXFP4</dt><dd>Both store 4-bit floating-point values (one sign, two exponent, one mantissa bit) with a shared scale per block. MXFP4 uses 32-value blocks with a power-of-two scale; NVIDIA's NVFP4 uses 16-value blocks with an FP8 scale plus a per-tensor FP32 scale. gpt-oss ships with its expert weights already in MXFP4. <SourceLink source={s.nvfp4} /> · <SourceLink source={s.gptoss} /></dd></div>
      <div><dt>GGUF and llama.cpp</dt><dd>GGUF is a single-file format that holds tensors and standard metadata, designed for GGML-based engines such as llama.cpp. <SourceLink source={s.gguf} /></dd></div>
      <div><dt>MLX</dt><dd>Apple's array framework for Apple silicon, where arrays live in memory shared by CPU and GPU. Since version 0.19 Ollama can run models on MLX on Apple silicon and load NVFP4 files. Our receipts record which runner each build used. <SourceLink source={s.mlx} /> · <SourceLink source={s.ollamaMlx} /></dd></div>
      <div><dt>Ollama tags and digests</dt><dd>A tag such as <code>qwen3.5:4b</code> is a movable name; the digest is the hash of the exact file. The Qwen3.5 library lists dozens of tags for one family, differing in size, format and runner. Two of our six tags now point to different files than the ones we ran, so this page quotes digests. <SourceLink source={s.tags} /></dd></div>
    </dl>
  </Callout>
}

/** `#/about-models`: where each assessed model comes from and what kind of model it is. Background, not results. */
export default function AboutModels({ ui }: { ui: BookUi }) {
  const { PageHero, LocalToc, Section } = ui
  return <>
    <PageHero trail="Start here / about the models" title="About the models" deck="Where each assessed model comes from, what kind of model it is, and the exact build or route this book ran. Background only: scores live in the chapters linked from each entry." />
    <div className="reading-layout">
      <LocalToc items={[{ id: 'how-to-read', label: 'How to read this page' }, ...MODEL_GROUPS.map(group => ({ id: `group-${group.id}`, label: group.title })), { id: 'sourcing', label: 'Sourcing' }]} />
      <main className="reading-column about-models" id="main-content">
        <Section id="how-to-read" title="How to read this page">
          <p className="lead">The book measures particular files and routes, not model names. This page describes each model one level up: its lab, lineage, size, inputs, licence and controls, then the build we actually ran.</p>
          <p>Each fact links to the primary source it came from: a lab model card or announcement, official documentation, the Ollama library page for the tag, or the OpenRouter catalogue entry for the slug. Facts about our own builds come from the book's receipts. Where no primary source we opened states a fact, the entry says so rather than estimating it.</p>
          <Primer ui={ui} />
        </Section>
        {MODEL_GROUPS.map(group => <ModelGroupSection key={group.id} group={group} ui={ui} />)}
        <Section id="sourcing" title="Sourcing">
          <p>All sources were opened on 11 November 2026. The full ledger, with a short supporting quote for each claim and a list of facts we could not verify, is <code>docs/about-models-sources.md</code> in the repository. Lab pages change: model cards are revised, Ollama tags are repointed and providers retire routes, so a link may no longer show what we read.</p>
        </Section>
      </main>
    </div>
  </>
}
