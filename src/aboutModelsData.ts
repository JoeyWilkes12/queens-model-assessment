/**
 * Background facts for the "About the models" page (`#/about-models`).
 *
 * Every model fact carries the keys of the primary sources it came from, so the page can print the
 * source link next to the value. The ledger in `docs/about-models-sources.md` records the supporting
 * quote and access date (11 November 2026) for each claim. Facts that no primary source we opened
 * states are written as "Not stated in the primary sources we found" rather than filled in.
 *
 * Exact local builds come from the book's own receipts (`public/evidence/local-qwen/index.json`),
 * not from the Ollama library: several tags have since been repointed to different digests.
 */

export type SourceRef = {
  /** Short reader-facing label, e.g. "Hugging Face model card". */
  label: string
  url: string
}

/** One labelled fact. `src` lists keys into the entry's `sources`; book receipts use the `receipt` key. */
export type Fact = { label: string; value: string; src: string[] }

export type ModelGroupId = 'local' | 'openrouter' | 'direct' | 'system'

export type ModelEntry = {
  id: string
  name: string
  lab: string
  group: ModelGroupId
  /** Sub-heading inside a group, e.g. the lab for hosted models. */
  family?: string
  /** At-a-glance columns. Keep each one short; the card carries the detail. */
  glance: { released: string; size: string; modalities: string; licence: string; build: string }
  facts: Fact[]
  /** Original prose: what the model is designed for, and anything a reader needs to read the build. */
  prose: { text: string; src: string[] }[]
  sources: Record<string, SourceRef>
  results: { label: string; href: string }[]
}

export type ModelGroup = { id: ModelGroupId; title: string; intro: string }

const NOT_STATED = 'Not stated in the primary sources we found'

// Shared primary sources, reused across entries.
const OLLAMA_MLX: SourceRef = { label: 'Ollama blog: MLX on Apple silicon', url: 'https://ollama.com/blog/mlx' }
const QWEN_REPO: SourceRef = { label: 'Qwen3.5 GitHub repository', url: 'https://github.com/QwenLM/Qwen3.5' }
const QWEN_TAGS: SourceRef = { label: 'Ollama qwen3.5 tags', url: 'https://ollama.com/library/qwen3.5/tags' }
const LOCAL_RECEIPT: SourceRef = { label: 'Book receipt: local evidence index', url: '#/local-qwen' }

export const MODEL_GROUPS: ModelGroup[] = [
  {
    id: 'local',
    title: 'Open-weight models run locally through Ollama',
    intro: 'Six open-weight models, downloaded once and run on our own Apple-silicon Mac through Ollama 0.40.10. The "build we ran" column is the exact file the receipts recorded, identified by its digest; the same model name can refer to several different files.',
  },
  {
    id: 'openrouter',
    title: 'Hosted models reached through OpenRouter',
    intro: 'API-only models from four labs. Each request went through OpenRouter with a pinned upstream provider and fallbacks disabled, so the route is part of what was measured. None of the sources we opened offers downloadable weights for these models.',
  },
  {
    id: 'direct',
    title: 'Decision models and other hosted routes',
    intro: 'Two decision models that return a probability over supplied options rather than free text. Jev was reached through OpenRouter; SubQ Snap through its own API.',
  },
  {
    id: 'system',
    title: 'Non-model systems on the leaderboard',
    intro: 'Two entries are not language models. They are included so every leaderboard row has an explanation.',
  },
]

const LOCAL_MODELS: ModelEntry[] = [
  // ---------------------------------------------------------------- Local open-weight models
  {
    id: 'qwen3.5-4b',
    name: 'Qwen3.5 4B',
    lab: 'Qwen team (Alibaba)',
    group: 'local',
    glance: { released: '2 Mar 2026', size: '4B (runtime reports 4.5B)', modalities: 'Text, image, video → text', licence: 'Apache 2.0', build: 'qwen3.5:4b · MLX · NVFP4 · 7f3251fa…' },
    facts: [
      { label: 'Developer', value: 'Qwen team; Ollama attributes the Qwen3.5 family to Alibaba', src: ['card', 'mlx'] },
      { label: 'Released', value: '2 March 2026, alongside the 9B, 2B and 0.8B sizes', src: ['repo'] },
      { label: 'Lineage', value: 'Post-trained from Qwen3.5-4B-Base; the card compares it with Qwen3 and Qwen3-VL', src: ['card'] },
      { label: 'Architecture', value: 'Causal language model with a vision encoder; 32 layers alternating three Gated DeltaNet (linear attention) blocks with one Gated Attention block. The specification lists no expert count.', src: ['card'] },
      { label: 'Parameters', value: '4B in the language model (Hub metadata 5B with the vision encoder)', src: ['card'] },
      { label: 'Modalities', value: 'Text, image and video input; text output', src: ['card'] },
      { label: 'Context window', value: '262,144 tokens natively, extensible to 1,010,000 with YaRN', src: ['card'] },
      { label: 'Licence', value: 'Apache 2.0, open weights', src: ['card'] },
      { label: 'Reasoning control', value: 'Thinking mode is on by default and can be disabled through the chat template. The book requested think=true.', src: ['card', 'receipt'] },
      { label: 'Build we ran', value: 'Tag qwen3.5:4b, digest 7f3251fa6878…, safetensors, NVFP4, MLX runner, Ollama 0.40.10, reported 4.5B parameters', src: ['receipt'] },
      { label: 'Tag today', value: 'The library now points qwen3.5:4b at digest 492e37dc6907 (a Q4_K_M build); the MLX NVFP4 tag is 61aa3858e9d3. Neither matches the digest we ran.', src: ['tags', 'ollama'] },
    ],
    prose: [
      { text: 'The smallest Qwen3.5 size in the book and the subject of the original 4B pilot. It is a general vision-language chat model with a long native context; the card does not describe a narrower intended use.', src: ['card'] },
      { text: 'Because the qwen3.5:4b tag has since moved, a reader who pulls it today gets a different file. The digest in our receipts is the only reliable identifier of what was tested.', src: ['receipt', 'tags'] },
    ],
    sources: {
      card: { label: 'Hugging Face: Qwen/Qwen3.5-4B', url: 'https://huggingface.co/Qwen/Qwen3.5-4B' },
      repo: QWEN_REPO,
      ollama: { label: 'Ollama library: qwen3.5:4b', url: 'https://ollama.com/library/qwen3.5:4b' },
      tags: QWEN_TAGS,
      mlx: OLLAMA_MLX,
      receipt: LOCAL_RECEIPT,
    },
    results: [
      { label: 'Original 4B pilot', href: '#/local-open-models' },
      { label: 'Fresh1 four-arm study', href: '#/local-qwen/study/qwen3.5-4b-fresh1-4arm-np32768' },
    ],
  },
  {
    id: 'qwen3.5-9b',
    name: 'Qwen3.5 9B (NVFP4)',
    lab: 'Qwen team (Alibaba)',
    group: 'local',
    glance: { released: '2 Mar 2026', size: '9B (runtime reports 9.4B)', modalities: 'Text, image, video → text', licence: 'Apache 2.0', build: 'qwen3.5:9b-nvfp4 · MLX · NVFP4 · 8218177a…' },
    facts: [
      { label: 'Developer', value: 'Qwen team', src: ['card'] },
      { label: 'Released', value: '2 March 2026', src: ['repo'] },
      { label: 'Lineage', value: 'Post-trained from Qwen3.5-9B-Base', src: ['card'] },
      { label: 'Architecture', value: 'Same hybrid layout as the 4B: 32 layers of Gated DeltaNet and Gated Attention blocks, with a vision encoder. No expert count is listed.', src: ['card'] },
      { label: 'Parameters', value: '9B (Hub metadata 10B)', src: ['card'] },
      { label: 'Modalities', value: 'Text, image and video input; text output', src: ['card'] },
      { label: 'Context window', value: '262,144 tokens natively, extensible to 1,010,000 with YaRN', src: ['card'] },
      { label: 'Licence', value: 'Apache 2.0, open weights', src: ['card'] },
      { label: 'Reasoning control', value: 'Thinking on by default; the book requested think=true', src: ['card', 'receipt'] },
      { label: 'Build we ran', value: 'Tag qwen3.5:9b-nvfp4, digest 8218177ac78e…, safetensors, NVFP4, MLX runner, Ollama 0.40.10, reported 9.4B parameters', src: ['receipt'] },
      { label: 'Tag today', value: 'Still digest 8218177ac78e, listed as a 7.2 GB MLX build with a 256K context. The plain qwen3.5:9b tag is a different file (fdf5fd4cd409).', src: ['tags'] },
    ],
    prose: [
      { text: 'The mid-sized Qwen3.5 model in the book. We ran the NVFP4 build on Ollama\'s MLX runner rather than the default tag, so its numbers describe that 4-bit file on Apple silicon, not every 9B build.', src: ['receipt', 'tags'] },
    ],
    sources: {
      card: { label: 'Hugging Face: Qwen/Qwen3.5-9B', url: 'https://huggingface.co/Qwen/Qwen3.5-9B' },
      repo: QWEN_REPO,
      tags: QWEN_TAGS,
      receipt: LOCAL_RECEIPT,
    },
    results: [
      { label: 'Fresh1 four-arm study', href: '#/local-qwen/study/qwen3.5-9b-nvfp4-fresh1-4arm-np32768' },
      { label: 'Fresh2 four-arm study', href: '#/local-qwen/study/qwen3.5-9b-nvfp4-fresh2-4arm-np32768' },
    ],
  },
  {
    id: 'qwen3.5-27b',
    name: 'Qwen3.5 27B (Q4_K_M)',
    lab: 'Qwen team (Alibaba)',
    group: 'local',
    glance: { released: '24 Feb 2026', size: '27B (runtime reports 26.9B)', modalities: 'Text, image, video → text', licence: 'Apache 2.0', build: 'qwen3.5:27b-q4_K_M · llama.cpp · GGUF Q4_K_M · 64ae5b1d…' },
    facts: [
      { label: 'Developer', value: 'Qwen team', src: ['card'] },
      { label: 'Released', value: '24 February 2026, with the 122B-A10B and 35B-A3B sizes', src: ['repo'] },
      { label: 'Lineage', value: 'A post-trained Qwen3.5 model; the card does not name a base checkpoint', src: ['card'] },
      { label: 'Architecture', value: '64 layers in the same Gated DeltaNet / Gated Attention pattern, with a vision encoder. No expert count is listed.', src: ['card'] },
      { label: 'Parameters', value: '27B (Hub metadata 28B)', src: ['card'] },
      { label: 'Modalities', value: 'Text, image and video input; text output', src: ['card'] },
      { label: 'Context window', value: '262,144 tokens natively, extensible to 1,010,000 with YaRN', src: ['card'] },
      { label: 'Licence', value: 'Apache 2.0, open weights', src: ['card'] },
      { label: 'Reasoning control', value: 'Thinking on by default; the book requested think=true', src: ['card', 'receipt'] },
      { label: 'Build we ran', value: 'Tag qwen3.5:27b-q4_K_M, digest 64ae5b1d651f…, GGUF, Q4_K_M, llama.cpp runner, Ollama 0.40.10, reported 26.9B parameters. The receipt records a local parent model named qwen35-validation-20261004:27b-q4.', src: ['receipt'] },
      { label: 'Tag today', value: 'Still digest 64ae5b1d651f, listed at 17 GB. The MLX NVFP4 27B build is a separate 20 GB tag.', src: ['tags'] },
    ],
    prose: [
      { text: 'The largest Qwen3.5 model the book ran. Unlike the 4B and 9B builds it used a GGUF file on the llama.cpp runner, so a 27B-versus-9B comparison also changes the quantisation format and the inference engine.', src: ['receipt'] },
    ],
    sources: {
      card: { label: 'Hugging Face: Qwen/Qwen3.5-27B', url: 'https://huggingface.co/Qwen/Qwen3.5-27B' },
      repo: QWEN_REPO,
      tags: QWEN_TAGS,
      receipt: LOCAL_RECEIPT,
    },
    results: [
      { label: 'Fresh1 four-arm study', href: '#/local-qwen/study/qwen3.5-27b-q4_K_M-fresh1-4arm-np24576' },
      { label: 'Legacy-board study', href: '#/local-qwen/study/qwen3.5-27b-q4_K_M-np24576' },
    ],
  },
  {
    id: 'gemma4-e4b',
    name: 'Gemma 4 E4B',
    lab: 'Google DeepMind',
    group: 'local',
    glance: { released: '2 Apr 2026', size: '4.5B effective, 8B with embeddings (runtime reports 8.1B)', modalities: 'Text, image, audio, video → text', licence: 'Apache 2.0', build: 'gemma4:e4b · MLX · NVFP4 · eb2177ad…' },
    facts: [
      { label: 'Developer', value: 'Google DeepMind', src: ['card'] },
      { label: 'Released', value: '2 April 2026, in four sizes: E2B, E4B, a 26B mixture-of-experts model and a 31B dense model', src: ['blog'] },
      { label: 'Lineage', value: 'Gemma 4 family; the card compares it with Gemma 3 and Gemma 3n', src: ['card'] },
      { label: 'Architecture', value: 'Dense, 42 layers, mixing 512-token sliding-window attention with global attention. Per-Layer Embeddings give each decoder layer its own token embedding table.', src: ['card'] },
      { label: 'Parameters', value: '"E" means effective: 4.5B effective, 8B including the embedding tables', src: ['card'] },
      { label: 'Modalities', value: 'Text, image, audio and video input; text output', src: ['card', 'blog'] },
      { label: 'Context window', value: '128K tokens', src: ['card', 'ollama'] },
      { label: 'Licence', value: 'Apache 2.0, open weights', src: ['card', 'blog'] },
      { label: 'Reasoning control', value: 'Thinking switches on with a <|think|> token in the system prompt (enable_thinking in Transformers). The book requested think=true.', src: ['card', 'receipt'] },
      { label: 'Build we ran', value: 'Tag gemma4:e4b, digest eb2177adf764…, safetensors, NVFP4, MLX runner, Ollama 0.40.10, reported 8.1B parameters', src: ['receipt'] },
      { label: 'Tag today', value: 'gemma4:e4b now resolves to 009acb0d7fe1 and the NVFP4 tag to 5a08735df03c; no current tag carries the digest we ran', src: ['tags'] },
    ],
    prose: [
      { text: 'Google positions the E2B and E4B sizes for on-device use, offline on phones and small boards. The runtime\'s 8.1B parameter figure counts the embedding tables, which is why it differs from the 4.5B in the name.', src: ['blog', 'card', 'receipt'] },
    ],
    sources: {
      card: { label: 'Hugging Face: google/gemma-4-E4B-it', url: 'https://huggingface.co/google/gemma-4-E4B-it' },
      blog: { label: 'Google blog: Gemma 4', url: 'https://blog.google/innovation-and-ai/technology/developers-tools/gemma-4/' },
      ollama: { label: 'Ollama library: gemma4:e4b', url: 'https://ollama.com/library/gemma4:e4b' },
      tags: { label: 'Ollama gemma4 tags', url: 'https://ollama.com/library/gemma4/tags' },
      receipt: LOCAL_RECEIPT,
    },
    results: [{ label: 'Fresh1 four-arm study', href: '#/local-qwen/study/gemma4-e4b-fresh1-4arm-np32768' }],
  },
  {
    id: 'llava-llama3-8b',
    name: 'LLaVA-Llama3 8B',
    lab: 'XTuner (fine-tune of Meta Llama 3)',
    group: 'local',
    glance: { released: 'Base model 18 Apr 2024; fine-tune date not stated', size: '8B + 0.3B projector', modalities: 'Text, image → text', licence: 'Base: Meta Llama 3 Community License', build: 'llava-llama3:8b · GGUF Q4_K_M · 44c161b1…' },
    facts: [
      { label: 'Developer', value: 'Fine-tuned by XTuner from Meta-Llama-3-8B-Instruct and OpenAI\'s CLIP-ViT-Large-patch14-336, joined by an MLP projector', src: ['hf', 'ollama'] },
      { label: 'Released', value: 'The Llama 3 base was released 18 April 2024. The fine-tune\'s release date is not stated in the primary sources we found.', src: ['llama', 'hf'] },
      { label: 'Training data', value: 'ShareGPT4V-PT for pretraining and InternVL-SFT for fine-tuning', src: ['hf'] },
      { label: 'Architecture', value: 'LLaVA design: a CLIP vision encoder at 336-pixel input, a projector, and the Llama 3 8B language model', src: ['hf'] },
      { label: 'Parameters', value: '8.03B language model plus a 312M projector in the Ollama build', src: ['ollama'] },
      { label: 'Modalities', value: 'Text and image input; text output', src: ['hf', 'ollama'] },
      { label: 'Context window', value: 'Llama 3 8B: 8K tokens. The Ollama build defaults to num_ctx 4096.', src: ['llama', 'ollama'] },
      { label: 'Licence', value: 'The base model uses the Meta Llama 3 Community License. A licence for the fine-tuned checkpoint is not stated on its card or Ollama page.', src: ['llama', 'hf', 'ollama'] },
      { label: 'Reasoning control', value: 'No thinking mode; the book requested think=false with a 4,096-token output budget', src: ['receipt'] },
      { label: 'Build we ran', value: 'Tag llava-llama3:8b, digest 44c161b1f465…, GGUF, Q4_K_M, families llama + clip, Ollama 0.40.10', src: ['receipt'] },
      { label: 'Tag today', value: 'Same digest, 44c161b1f465: Q4_K_M model (4.9 GB) with an F16 projector', src: ['ollama'] },
    ],
    prose: [
      { text: 'The oldest model in the local set: a 2024-generation Llama 3 language model with a CLIP vision encoder bolted on by an independent fine-tuner. It has no reasoning mode and a far shorter context than the 2026 models, so the book gave it a smaller budget.', src: ['hf', 'llama', 'receipt'] },
    ],
    sources: {
      hf: { label: 'Hugging Face: xtuner/llava-llama-3-8b-v1_1', url: 'https://huggingface.co/xtuner/llava-llama-3-8b-v1_1' },
      llama: { label: 'Hugging Face: meta-llama/Meta-Llama-3-8B-Instruct', url: 'https://huggingface.co/meta-llama/Meta-Llama-3-8B-Instruct' },
      ollama: { label: 'Ollama library: llava-llama3:8b', url: 'https://ollama.com/library/llava-llama3:8b' },
      receipt: LOCAL_RECEIPT,
    },
    results: [{ label: 'Fresh1 four-arm study', href: '#/local-qwen/study/llava-llama3-8b-fresh1-4arm-np4096' }],
  },
  {
    id: 'gpt-oss-20b',
    name: 'gpt-oss 20B',
    lab: 'OpenAI',
    group: 'local',
    glance: { released: 'Model card 8 Aug 2025', size: '21B total, 3.6B active (MoE)', modalities: 'Text → text', licence: 'Apache 2.0', build: 'gpt-oss:20b · llama.cpp · GGUF MXFP4 · f38aa0c5…' },
    facts: [
      { label: 'Developer', value: 'OpenAI, as an open-weight model', src: ['hf'] },
      { label: 'Released', value: 'The model card was published on arXiv on 8 August 2025; a separate release date is not stated in the primary sources we found', src: ['arxiv'] },
      { label: 'Architecture', value: 'Mixture-of-experts transformer; the MoE weights were post-trained with MXFP4 quantisation', src: ['arxiv', 'hf'] },
      { label: 'Parameters', value: '21B total, 3.6B active per token', src: ['hf', 'github'] },
      { label: 'Modalities', value: 'Text only', src: ['hf'] },
      { label: 'Context window', value: NOT_STATED, src: [] },
      { label: 'Licence', value: 'Apache 2.0, open weights', src: ['hf', 'arxiv'] },
      { label: 'Reasoning control', value: 'Reasoning effort low, medium or high, set in the system prompt; requires the harmony response format. The book requested think="high".', src: ['hf', 'receipt'] },
      { label: 'Build we ran', value: 'Tag gpt-oss:20b, digest f38aa0c53da5…, GGUF, MXFP4, llama.cpp runner, Ollama 0.40.10, reported 20.9B parameters; parent model dhiltgen/gpt-oss:20b-llamacpp', src: ['receipt'] },
      { label: 'Tag today', value: 'Same digest, f38aa0c53da5, 14 GB, MXFP4', src: ['ollama'] },
    ],
    prose: [
      { text: 'OpenAI describes the 20B model for lower-latency, local and specialised use, sized to run within 16 GB of memory. It cannot read images, so the book gave it the board as a text grid; its results are not directly comparable with the image studies.', src: ['hf', 'receipt'] },
    ],
    sources: {
      hf: { label: 'Hugging Face: openai/gpt-oss-20b', url: 'https://huggingface.co/openai/gpt-oss-20b' },
      arxiv: { label: 'arXiv 2508.10925: gpt-oss model card', url: 'https://arxiv.org/abs/2508.10925' },
      github: { label: 'GitHub: openai/gpt-oss', url: 'https://github.com/openai/gpt-oss' },
      ollama: { label: 'Ollama library: gpt-oss:20b', url: 'https://ollama.com/library/gpt-oss:20b' },
      receipt: LOCAL_RECEIPT,
    },
    results: [{ label: 'Fresh1 text-grid study', href: '#/local-qwen/study/gpt-oss-20b-fresh1-text-4arm-np32768' }],
  },
]

/** The OpenRouter catalogue entry (JSON) for one exact slug: name, endpoints and context per provider. */
const openRouter = (slug: string): SourceRef => ({ label: `OpenRouter catalogue: ${slug}`, url: `https://openrouter.ai/api/v1/models/${slug}/endpoints` })
const OPENROUTER_MODELS: SourceRef = { label: 'OpenRouter models API', url: 'https://openrouter.ai/api/v1/models' }
const FRONTIER_RECEIPT: SourceRef = { label: 'Book receipt: frontier panel plan', url: '#/protocol-results' }
const LEGACY_RECEIPT: SourceRef = { label: 'Book receipt: earlier-generations panel plan', url: '#/earlier-generations' }
const OCT1_RECEIPT: SourceRef = { label: 'Book receipt: October 1 replay requests', url: '#/earlier-generations' }
const CLAUDE_MODELS: SourceRef = { label: 'Claude docs: models overview', url: 'https://platform.claude.com/docs/en/about-claude/models/overview' }
const openAiDoc = (id: string, name: string): SourceRef => ({ label: `OpenAI docs: ${name}`, url: `https://developers.openai.com/api/docs/models/${id}` })
const geminiDoc = (id: string, name: string): SourceRef => ({ label: `Google AI Studio docs: ${name}`, url: `https://aistudio.google.com/docs/models/${id}` })
const HOSTED_LICENCE = 'Hosted API; no open weights in the sources'

/** Sources for the primer box on open weights, quantisation and runtimes. */
export const PRIMER_SOURCES: Record<string, SourceRef> = {
  gguf: { label: 'Hugging Face Hub docs: GGUF', url: 'https://huggingface.co/docs/hub/en/gguf' },
  quantize: { label: 'llama.cpp quantize README', url: 'https://github.com/ggml-org/llama.cpp/blob/master/tools/quantize/README.md' },
  nvfp4: { label: 'NVIDIA: Introducing NVFP4', url: 'https://developer.nvidia.com/blog/introducing-nvfp4-for-efficient-and-accurate-low-precision-inference/' },
  mlx: { label: 'GitHub: ml-explore/mlx', url: 'https://github.com/ml-explore/mlx' },
  ollamaMlx: OLLAMA_MLX,
  gptoss: { label: 'Hugging Face: openai/gpt-oss-20b', url: 'https://huggingface.co/openai/gpt-oss-20b' },
  tags: QWEN_TAGS,
}

// ---------------------------------------------------------------- Hosted models through OpenRouter
const ANTHROPIC = 'Anthropic'
const OPENAI = 'OpenAI'
const GOOGLE = 'Google'
const XAI = 'xAI'

const HOSTED_MODELS: ModelEntry[] = [
  {
    id: 'claude-opus-4.8', name: 'Claude Opus 4.8', lab: ANTHROPIC, family: ANTHROPIC, group: 'openrouter',
    glance: { released: '28 May 2026', size: 'Not disclosed', modalities: 'Text, image, file → text', licence: HOSTED_LICENCE, build: 'anthropic/claude-opus-4.8 · Anthropic · high effort' },
    facts: [
      { label: 'Released', value: '28 May 2026', src: ['news'] },
      { label: 'Lineage', value: 'Builds on Claude Opus 4.7', src: ['news'] },
      { label: 'Context window', value: '1M tokens; 128K maximum output', src: ['docs'] },
      { label: 'Modalities', value: 'Text, image and file input; text output', src: ['docs', 'or'] },
      { label: 'Reasoning control', value: 'Effort parameter, default high, with extra-high and max settings', src: ['news'] },
      { label: 'Parameters', value: NOT_STATED, src: [] },
      { label: 'Route we ran', value: 'OpenRouter slug anthropic/claude-opus-4.8, provider pinned to Anthropic (fast variant excluded), no fallbacks, reasoning effort high, 12,288-token cap', src: ['receipt'] },
    ],
    prose: [{ text: 'The newest Anthropic model in the book and one of the four entrants in the original image protocol. Anthropic presents it as its most capable generally available Opus model.', src: ['or', 'news'] }],
    sources: { news: { label: 'Anthropic: Claude Opus 4.8', url: 'https://www.anthropic.com/news/claude-opus-4-8' }, docs: CLAUDE_MODELS, or: openRouter('anthropic/claude-opus-4.8'), receipt: FRONTIER_RECEIPT },
    results: [{ label: 'Protocol & results', href: '#/protocol-results' }, { label: 'One queen at a time', href: '#/frontier-trajectories' }],
  },
  {
    id: 'claude-opus-4.7', name: 'Claude Opus 4.7', lab: ANTHROPIC, family: ANTHROPIC, group: 'openrouter',
    glance: { released: '16 Apr 2026', size: 'Not disclosed', modalities: 'Text, image, file → text', licence: HOSTED_LICENCE, build: 'anthropic/claude-opus-4.7 · Anthropic · high effort' },
    facts: [
      { label: 'Released', value: '16 April 2026', src: ['news'] },
      { label: 'Lineage', value: 'A direct upgrade to Claude Opus 4.6; introduced a new tokenizer', src: ['news', 'docs'] },
      { label: 'Context window', value: '1M tokens; 128K maximum output', src: ['docs'] },
      { label: 'Modalities', value: 'Text, image and file input; accepts images up to 2,576 pixels on the long edge', src: ['news', 'or'] },
      { label: 'Reasoning control', value: 'Effort parameter; added an xhigh level between high and max', src: ['news'] },
      { label: 'Parameters', value: NOT_STATED, src: [] },
      { label: 'Route we ran', value: 'Provider pinned to Anthropic, no fallbacks, reasoning effort high with reasoning text excluded, 12,288-token cap', src: ['receipt'] },
    ],
    prose: [{ text: 'Positioned for long-running, asynchronous agent work. In this book it is one of the earlier-generation entrants replayed on the same boards.', src: ['or'] }],
    sources: { news: { label: 'Anthropic: Claude Opus 4.7', url: 'https://www.anthropic.com/news/claude-opus-4-7' }, docs: CLAUDE_MODELS, or: openRouter('anthropic/claude-opus-4.7'), receipt: LEGACY_RECEIPT },
    results: [{ label: 'Earlier generations', href: '#/earlier-generations' }],
  },
  {
    id: 'claude-opus-4.6', name: 'Claude Opus 4.6', lab: ANTHROPIC, family: ANTHROPIC, group: 'openrouter',
    glance: { released: '5 Feb 2026', size: 'Not disclosed', modalities: 'Text, image, file → text', licence: HOSTED_LICENCE, build: 'anthropic/claude-opus-4.6 · Anthropic · high effort' },
    facts: [
      { label: 'Released', value: '5 February 2026', src: ['news'] },
      { label: 'Lineage', value: 'Successor to Claude Opus 4.5; the first Opus model with a 1M-token context', src: ['news'] },
      { label: 'Context window', value: '1M tokens; 128K maximum output', src: ['docs'] },
      { label: 'Modalities', value: 'Text, image and file input; text output', src: ['docs', 'or'] },
      { label: 'Reasoning control', value: 'Adaptive thinking with four effort levels: low, medium, high (default) and max', src: ['news'] },
      { label: 'Parameters', value: NOT_STATED, src: [] },
      { label: 'Route we ran', value: 'Provider pinned to Anthropic, no fallbacks, reasoning effort high with reasoning text excluded, 12,288-token cap', src: ['receipt'] },
    ],
    prose: [{ text: 'Aimed at coding and long-running professional tasks. Its adaptive thinking lets the model decide how much to reason, steered by the effort setting.', src: ['or', 'news'] }],
    sources: { news: { label: 'Anthropic: Claude Opus 4.6', url: 'https://www.anthropic.com/news/claude-opus-4-6' }, docs: CLAUDE_MODELS, or: openRouter('anthropic/claude-opus-4.6'), receipt: LEGACY_RECEIPT },
    results: [{ label: 'Earlier generations', href: '#/earlier-generations' }],
  },
  {
    id: 'claude-opus-4.5', name: 'Claude Opus 4.5', lab: ANTHROPIC, family: ANTHROPIC, group: 'openrouter',
    glance: { released: '24 Nov 2025', size: 'Not disclosed', modalities: 'Text, image, file → text', licence: HOSTED_LICENCE, build: 'anthropic/claude-opus-4.5 · Anthropic · high effort' },
    facts: [
      { label: 'Released', value: '24 November 2025 (snapshot claude-opus-4-5-20251101)', src: ['news'] },
      { label: 'Context window', value: '200K tokens; 64K maximum output', src: ['docs'] },
      { label: 'Modalities', value: 'Text, image and file input; text output', src: ['or'] },
      { label: 'Reasoning control', value: 'Introduced the effort parameter on the Claude API', src: ['news'] },
      { label: 'Parameters', value: NOT_STATED, src: [] },
      { label: 'Route we ran', value: 'October 1 replay: provider pinned to Anthropic, reasoning effort high, 12,288-token cap', src: ['receipt'] },
    ],
    prose: [{ text: 'Anthropic aimed it at coding, agents and computer use. It appears only in the October 1 earlier-generations ladder.', src: ['news'] }],
    sources: { news: { label: 'Anthropic: Claude Opus 4.5', url: 'https://www.anthropic.com/news/claude-opus-4-5' }, docs: CLAUDE_MODELS, or: openRouter('anthropic/claude-opus-4.5'), receipt: OCT1_RECEIPT },
    results: [{ label: 'Earlier generations', href: '#/earlier-generations' }],
  },
  {
    id: 'claude-sonnet-4.5', name: 'Claude Sonnet 4.5', lab: ANTHROPIC, family: ANTHROPIC, group: 'openrouter',
    glance: { released: '29 Sep 2025', size: 'Not disclosed', modalities: 'Text, image, file → text', licence: HOSTED_LICENCE, build: 'anthropic/claude-sonnet-4.5 · Anthropic · high effort' },
    facts: [
      { label: 'Released', value: '29 September 2025', src: ['news'] },
      { label: 'Lineage', value: 'Sonnet tier, priced the same as Claude Sonnet 4', src: ['news'] },
      { label: 'Context window', value: '200K tokens; 64K maximum output (Anthropic API)', src: ['docs'] },
      { label: 'Modalities', value: 'Text, image and file input; text output', src: ['or'] },
      { label: 'Reasoning control', value: 'Extended thinking with a token budget (the pre-adaptive mode)', src: ['news', 'docs'] },
      { label: 'Parameters', value: NOT_STATED, src: [] },
      { label: 'Route we ran', value: 'October 1 replay: provider pinned to Anthropic, reasoning effort high, 12,288-token cap', src: ['receipt'] },
    ],
    prose: [{ text: 'A mid-tier Sonnet model rather than an Opus, so comparing it with the Opus entries changes product tier as well as age.', src: ['news'] }],
    sources: { news: { label: 'Anthropic: Claude Sonnet 4.5', url: 'https://www.anthropic.com/news/claude-sonnet-4-5' }, docs: CLAUDE_MODELS, or: openRouter('anthropic/claude-sonnet-4.5'), receipt: OCT1_RECEIPT },
    results: [{ label: 'Earlier generations', href: '#/earlier-generations' }],
  },
  {
    id: 'claude-sonnet-4', name: 'Claude Sonnet 4', lab: ANTHROPIC, family: ANTHROPIC, group: 'openrouter',
    glance: { released: '22 May 2025', size: 'Not disclosed', modalities: 'Text, image, file → text', licence: HOSTED_LICENCE, build: 'anthropic/claude-sonnet-4 · Amazon Bedrock' },
    facts: [
      { label: 'Released', value: '22 May 2025', src: ['news'] },
      { label: 'Lineage', value: 'An upgrade to Claude Sonnet 3.7', src: ['news'] },
      { label: 'Context window', value: '200K tokens; 64K maximum output', src: ['docs'] },
      { label: 'Modalities', value: 'Image, text and file input; text output', src: ['or'] },
      { label: 'Reasoning control', value: 'Hybrid model: near-instant responses or extended thinking', src: ['news'] },
      { label: 'Status today', value: 'Retired on Anthropic\'s API, still offered on Bedrock and Google Cloud; OpenRouter now lists no endpoints for the slug', src: ['docs', 'or'] },
      { label: 'Route we ran', value: 'Served by Amazon Bedrock, the only route at discovery; used in the October 1 replay and the diagnostic-completion study', src: ['receipt'] },
    ],
    prose: [{ text: 'The oldest Claude model in the book. Its route differed from the other Claude entries, which ran on Anthropic\'s own endpoint.', src: ['receipt'] }],
    sources: { news: { label: 'Anthropic: Introducing Claude 4', url: 'https://www.anthropic.com/news/claude-4' }, docs: CLAUDE_MODELS, or: openRouter('anthropic/claude-sonnet-4'), receipt: OCT1_RECEIPT },
    results: [{ label: 'Earlier generations', href: '#/earlier-generations' }],
  },
  {
    id: 'gpt-5.6-sol', name: 'GPT-5.6 Sol', lab: OPENAI, family: OPENAI, group: 'openrouter',
    glance: { released: 'Listed on OpenRouter 9 Jul 2026', size: 'Not disclosed', modalities: 'Text, image → text', licence: HOSTED_LICENCE, build: 'openai/gpt-5.6-sol · OpenAI batch · high effort' },
    facts: [
      { label: 'Released', value: 'OpenAI\'s model page gives no date; OpenRouter lists the slug from 9 July 2026', src: ['docs', 'models'] },
      { label: 'Lineage', value: 'Flagship of the GPT-5.6 series', src: ['docs', 'or'] },
      { label: 'Context window', value: '1,050,000 tokens (922,000 input); 128,000 maximum output', src: ['docs'] },
      { label: 'Modalities', value: 'Text and image input; text output', src: ['docs'] },
      { label: 'Reasoning control', value: 'Reasoning effort, default medium, with none, low, high, xhigh and max listed', src: ['docs'] },
      { label: 'Knowledge cutoff', value: '16 February 2026', src: ['docs'] },
      { label: 'Route we ran', value: 'OpenRouter batch route, provider OpenAI only, no fallbacks, reasoning effort high, 12,288-token cap', src: ['receipt'] },
    ],
    prose: [{ text: 'The OpenAI entrant in the original four-model image protocol, aimed at complex professional, coding and agent work.', src: ['docs', 'or'] }],
    sources: { docs: openAiDoc('gpt-5.6-sol', 'GPT-5.6 Sol'), or: openRouter('openai/gpt-5.6-sol'), models: OPENROUTER_MODELS, receipt: FRONTIER_RECEIPT },
    results: [{ label: 'Protocol & results', href: '#/protocol-results' }, { label: 'One queen at a time', href: '#/frontier-trajectories' }],
  },
  {
    id: 'gpt-5.5', name: 'GPT-5.5', lab: OPENAI, family: OPENAI, group: 'openrouter',
    glance: { released: 'Snapshot 23 Apr 2026', size: 'Not disclosed', modalities: 'Text, image → text', licence: HOSTED_LICENCE, build: 'openai/gpt-5.5 · OpenAI · high effort' },
    facts: [
      { label: 'Released', value: 'Snapshot gpt-5.5-2026-04-23', src: ['docs'] },
      { label: 'Lineage', value: 'Builds on GPT-5.4', src: ['or'] },
      { label: 'Context window', value: '1,050,000 tokens; 128,000 maximum output', src: ['docs'] },
      { label: 'Modalities', value: 'Text and image input; text output', src: ['docs'] },
      { label: 'Reasoning control', value: 'Effort none, low, medium (default), high and xhigh', src: ['docs'] },
      { label: 'Knowledge cutoff', value: '1 December 2025', src: ['docs'] },
      { label: 'Route we ran', value: 'Provider pinned to OpenAI (flex and fast excluded), reasoning effort high with reasoning text excluded, 12,288-token cap', src: ['receipt'] },
    ],
    prose: [{ text: 'OpenAI describes it for coding and professional work. It is the newest model in the earlier-generations panel.', src: ['docs'] }],
    sources: { docs: openAiDoc('gpt-5.5', 'GPT-5.5'), or: openRouter('openai/gpt-5.5'), receipt: LEGACY_RECEIPT },
    results: [{ label: 'Earlier generations', href: '#/earlier-generations' }],
  },
  {
    id: 'gpt-5.4', name: 'GPT-5.4', lab: OPENAI, family: OPENAI, group: 'openrouter',
    glance: { released: 'Snapshot 5 Mar 2026', size: 'Not disclosed', modalities: 'Text, image → text', licence: HOSTED_LICENCE, build: 'openai/gpt-5.4 · OpenAI · high effort' },
    facts: [
      { label: 'Released', value: 'Snapshot gpt-5.4-2026-03-05', src: ['docs'] },
      { label: 'Lineage', value: 'OpenRouter describes it as unifying the Codex and GPT lines', src: ['or'] },
      { label: 'Context window', value: '1,050,000 tokens; 128,000 maximum output', src: ['docs'] },
      { label: 'Modalities', value: 'Text and image input; text output', src: ['docs'] },
      { label: 'Reasoning control', value: 'Effort none (default), low, medium, high and xhigh', src: ['docs'] },
      { label: 'Knowledge cutoff', value: '31 August 2025', src: ['docs'] },
      { label: 'Route we ran', value: 'Provider pinned to OpenAI, reasoning effort high with reasoning text excluded, 12,288-token cap', src: ['receipt'] },
    ],
    prose: [{ text: 'A reasoning model for coding and professional work; its default effort is none, so the book\'s explicit high setting matters.', src: ['docs', 'receipt'] }],
    sources: { docs: openAiDoc('gpt-5.4', 'GPT-5.4'), or: openRouter('openai/gpt-5.4'), receipt: LEGACY_RECEIPT },
    results: [{ label: 'Earlier generations', href: '#/earlier-generations' }],
  },
  {
    id: 'gpt-5.2', name: 'GPT-5.2', lab: OPENAI, family: OPENAI, group: 'openrouter',
    glance: { released: 'Snapshot 11 Dec 2025', size: 'Not disclosed', modalities: 'Text, image → text', licence: HOSTED_LICENCE, build: 'openai/gpt-5.2 · OpenAI · high effort' },
    facts: [
      { label: 'Released', value: 'Snapshot gpt-5.2-2025-12-11', src: ['docs'] },
      { label: 'Lineage', value: 'GPT-5 series, following GPT-5.1', src: ['or'] },
      { label: 'Context window', value: '400,000 tokens; 128,000 maximum output', src: ['docs'] },
      { label: 'Modalities', value: 'Text and image input; text output', src: ['docs'] },
      { label: 'Reasoning control', value: 'Effort none (default), low, medium, high and xhigh', src: ['docs'] },
      { label: 'Knowledge cutoff', value: '31 August 2025', src: ['docs'] },
      { label: 'Route we ran', value: 'October 1 replay: provider pinned to OpenAI, reasoning effort high, 12,288-token cap', src: ['receipt'] },
    ],
    prose: [{ text: 'OpenAI now labels it a previous flagship for professional work. It is a rung in the October 1 generation ladder.', src: ['docs'] }],
    sources: { docs: openAiDoc('gpt-5.2', 'GPT-5.2'), or: openRouter('openai/gpt-5.2'), receipt: OCT1_RECEIPT },
    results: [{ label: 'Earlier generations', href: '#/earlier-generations' }],
  },
  {
    id: 'gpt-5.1', name: 'GPT-5.1', lab: OPENAI, family: OPENAI, group: 'openrouter',
    glance: { released: 'Snapshot 13 Nov 2025', size: 'Not disclosed', modalities: 'Text, image → text', licence: HOSTED_LICENCE, build: 'openai/gpt-5.1 · OpenAI · high effort' },
    facts: [
      { label: 'Released', value: 'Snapshot gpt-5.1-2025-11-13, now deprecated', src: ['docs'] },
      { label: 'Lineage', value: 'GPT-5 series, following GPT-5', src: ['or'] },
      { label: 'Context window', value: '400,000 tokens; 128,000 maximum output', src: ['docs'] },
      { label: 'Modalities', value: 'Text and image input; text output', src: ['docs'] },
      { label: 'Reasoning control', value: 'Effort none (default), low, medium and high', src: ['docs'] },
      { label: 'Knowledge cutoff', value: '30 September 2024', src: ['docs'] },
      { label: 'Route we ran', value: 'October 1 replay: provider pinned to OpenAI, reasoning effort high, 12,288-token cap', src: ['receipt'] },
    ],
    prose: [{ text: 'Described by OpenAI for coding and agent tasks with configurable reasoning effort.', src: ['docs'] }],
    sources: { docs: openAiDoc('gpt-5.1', 'GPT-5.1'), or: openRouter('openai/gpt-5.1'), receipt: OCT1_RECEIPT },
    results: [{ label: 'Earlier generations', href: '#/earlier-generations' }],
  },
  {
    id: 'gpt-5', name: 'GPT-5', lab: OPENAI, family: OPENAI, group: 'openrouter',
    glance: { released: 'Snapshot 7 Aug 2025', size: 'Not disclosed', modalities: 'Text, image → text', licence: HOSTED_LICENCE, build: 'openai/gpt-5 · OpenAI · high effort' },
    facts: [
      { label: 'Released', value: 'Snapshot gpt-5-2025-08-07, now deprecated', src: ['docs'] },
      { label: 'Context window', value: '400,000 tokens (272,000 input); 128,000 maximum output', src: ['docs'] },
      { label: 'Modalities', value: 'Text and image input; text output', src: ['docs'] },
      { label: 'Reasoning control', value: 'Effort minimal, low, medium and high', src: ['docs'] },
      { label: 'Knowledge cutoff', value: '30 September 2024', src: ['docs'] },
      { label: 'Route we ran', value: 'Provider pinned to openai/default, reasoning effort high with reasoning text excluded, 12,288-token cap', src: ['receipt'] },
    ],
    prose: [{ text: 'OpenAI now calls it a previous reasoning model for coding and agent tasks. By snapshot date it is the oldest OpenAI reasoning model in the book.', src: ['docs'] }],
    sources: { docs: openAiDoc('gpt-5', 'GPT-5'), or: openRouter('openai/gpt-5'), receipt: LEGACY_RECEIPT },
    results: [{ label: 'Earlier generations', href: '#/earlier-generations' }],
  },
  {
    id: 'gpt-4.1', name: 'GPT-4.1', lab: OPENAI, family: OPENAI, group: 'openrouter',
    glance: { released: 'Snapshot 14 Apr 2025', size: 'Not disclosed', modalities: 'Text, image → text', licence: HOSTED_LICENCE, build: 'openai/gpt-4.1 · OpenAI · no reasoning' },
    facts: [
      { label: 'Released', value: 'Snapshot gpt-4.1-2025-04-14, now deprecated', src: ['docs'] },
      { label: 'Context window', value: '1,047,576 tokens; 32,768 maximum output', src: ['docs'] },
      { label: 'Modalities', value: 'Text and image input; text output', src: ['docs'] },
      { label: 'Reasoning control', value: 'None: OpenAI calls it a non-reasoning model', src: ['docs'] },
      { label: 'Knowledge cutoff', value: '1 June 2024', src: ['docs'] },
      { label: 'Route we ran', value: 'Provider pinned to OpenAI, no reasoning parameter sent, 12,288-token cap; also used in the diagnostic-completion study', src: ['receipt'] },
    ],
    prose: [{ text: 'A non-reasoning model built for instruction following and tool calling. It answers without a separate thinking phase, unlike the other OpenRouter entries except GPT-4o.', src: ['docs'] }],
    sources: { docs: openAiDoc('gpt-4.1', 'GPT-4.1'), or: openRouter('openai/gpt-4.1'), receipt: LEGACY_RECEIPT },
    results: [{ label: 'Earlier generations', href: '#/earlier-generations' }],
  },
  {
    id: 'gpt-4o-2024-11-20', name: 'GPT-4o (2024-11-20)', lab: OPENAI, family: OPENAI, group: 'openrouter',
    glance: { released: 'Snapshot 20 Nov 2024', size: 'Not disclosed', modalities: 'Text, image → text', licence: HOSTED_LICENCE, build: 'openai/gpt-4o-2024-11-20 · OpenAI · no reasoning' },
    facts: [
      { label: 'Released', value: 'Snapshot gpt-4o-2024-11-20, now deprecated', src: ['docs'] },
      { label: 'Context window', value: '128,000 tokens; 16,384 maximum output', src: ['docs'] },
      { label: 'Modalities', value: 'Text and image input; text output', src: ['docs'] },
      { label: 'Reasoning control', value: 'No reasoning parameter is listed for the slug; the book sent none', src: ['or', 'receipt'] },
      { label: 'Knowledge cutoff', value: '1 October 2023', src: ['docs'] },
      { label: 'Route we ran', value: 'October 1 replay: provider pinned to OpenAI, 12,288-token cap', src: ['receipt'] },
    ],
    prose: [{ text: 'The oldest hosted model in the book: a general-purpose multimodal GPT from before OpenAI\'s reasoning models.', src: ['docs'] }],
    sources: { docs: openAiDoc('gpt-4o', 'GPT-4o'), or: openRouter('openai/gpt-4o-2024-11-20'), receipt: OCT1_RECEIPT },
    results: [{ label: 'Earlier generations', href: '#/earlier-generations' }],
  },
  {
    id: 'gemini-3.1-pro-preview', name: 'Gemini 3.1 Pro Preview', lab: GOOGLE, family: GOOGLE, group: 'openrouter',
    glance: { released: '19 Feb 2026 (preview)', size: 'Not disclosed', modalities: 'Text, image, video, audio, PDF → text', licence: HOSTED_LICENCE, build: 'google/gemini-3.1-pro-preview · Google AI Studio · high effort' },
    facts: [
      { label: 'Released', value: '19 February 2026, as a preview', src: ['blog'] },
      { label: 'Lineage', value: 'Builds on the Gemini 3 series, after Gemini 3 Pro', src: ['blog'] },
      { label: 'Context window', value: '1,048,576 input tokens; 65,536 output tokens', src: ['docs'] },
      { label: 'Modalities', value: 'Text, image, video, audio and PDF input; text output', src: ['docs'] },
      { label: 'Reasoning control', value: 'Thinking supported; levels are not described on the model page', src: ['docs'] },
      { label: 'Parameters', value: NOT_STATED, src: [] },
      { label: 'Route we ran', value: 'Provider pinned to Google AI Studio (flex and priority excluded), no fallbacks, reasoning effort high, 12,288-token cap', src: ['receipt'] },
    ],
    prose: [{ text: 'The Google entrant in the original image protocol. As a preview model it may change before general availability.', src: ['blog'] }],
    sources: { blog: { label: 'Google blog: Gemini 3.1 Pro', url: 'https://blog.google/innovation-and-ai/models-and-research/gemini-models/gemini-3-1-pro/' }, docs: geminiDoc('gemini-3.1-pro-preview', 'Gemini 3.1 Pro Preview'), or: openRouter('google/gemini-3.1-pro-preview'), receipt: FRONTIER_RECEIPT },
    results: [{ label: 'Protocol & results', href: '#/protocol-results' }, { label: 'One queen at a time', href: '#/frontier-trajectories' }],
  },
  {
    id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', lab: GOOGLE, family: GOOGLE, group: 'openrouter',
    glance: { released: 'Stable June 2025', size: 'Not disclosed', modalities: 'Audio, image, video, text, PDF → text', licence: HOSTED_LICENCE, build: 'google/gemini-2.5-pro · batch via Vertex · high effort' },
    facts: [
      { label: 'Released', value: 'Latest update June 2025; now deprecated, with requests rerouted from 1 December 2026', src: ['docs'] },
      { label: 'Context window', value: '1,048,576 input tokens; 65,536 output tokens', src: ['docs'] },
      { label: 'Modalities', value: 'Audio, image, video, text and PDF input; text output', src: ['docs'] },
      { label: 'Reasoning control', value: 'Thinking supported', src: ['docs'] },
      { label: 'Knowledge cutoff', value: 'January 2025', src: ['docs'] },
      { label: 'Route we ran', value: 'Earlier-generations panel: batch through Google Vertex (global), reasoning effort high with reasoning text excluded. October 1 replay: Google AI Studio.', src: ['receipt'] },
    ],
    prose: [{ text: 'The Pro tier of the Gemini 2.5 family, which OpenRouter describes as built for reasoning, coding, mathematics and science.', src: ['or'] }],
    sources: { docs: geminiDoc('gemini-2.5-pro', 'Gemini 2.5 Pro'), or: openRouter('google/gemini-2.5-pro'), receipt: LEGACY_RECEIPT },
    results: [{ label: 'Earlier generations', href: '#/earlier-generations' }],
  },
  {
    id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', lab: GOOGLE, family: GOOGLE, group: 'openrouter',
    glance: { released: 'Stable June 2025', size: 'Not disclosed', modalities: 'Text, image, video, audio → text', licence: HOSTED_LICENCE, build: 'google/gemini-2.5-flash · batch via Vertex · high effort' },
    facts: [
      { label: 'Released', value: 'Latest update June 2025; now deprecated, with requests rerouted from 1 December 2026', src: ['docs'] },
      { label: 'Context window', value: '1,048,576 input tokens; 65,536 output tokens', src: ['docs'] },
      { label: 'Modalities', value: 'Text, image, video and audio input; text output', src: ['docs'] },
      { label: 'Reasoning control', value: 'Thinking supported', src: ['docs'] },
      { label: 'Knowledge cutoff', value: 'January 2025', src: ['docs'] },
      { label: 'Route we ran', value: 'Earlier-generations panel: batch through Google Vertex (global), reasoning effort high. October 1 replay and diagnostic-completion study: Google AI Studio.', src: ['receipt'] },
    ],
    prose: [{ text: 'Google\'s price-performance tier of Gemini 2.5, below Pro.', src: ['docs'] }],
    sources: { docs: geminiDoc('gemini-2.5-flash', 'Gemini 2.5 Flash'), or: openRouter('google/gemini-2.5-flash'), receipt: LEGACY_RECEIPT },
    results: [{ label: 'Earlier generations', href: '#/earlier-generations' }],
  },
  {
    id: 'gemini-2.5-flash-lite', name: 'Gemini 2.5 Flash-Lite', lab: GOOGLE, family: GOOGLE, group: 'openrouter',
    glance: { released: 'July 2025', size: 'Not disclosed', modalities: 'Text, image, video, audio, PDF → text', licence: HOSTED_LICENCE, build: 'google/gemini-2.5-flash-lite · Google AI Studio · high effort' },
    facts: [
      { label: 'Released', value: 'Latest update July 2025', src: ['docs'] },
      { label: 'Context window', value: '1,048,576 input tokens; 65,536 output tokens', src: ['docs'] },
      { label: 'Modalities', value: 'Text, image, video, audio and PDF input; text output', src: ['docs'] },
      { label: 'Reasoning control', value: 'Thinking supported', src: ['docs'] },
      { label: 'Knowledge cutoff', value: 'January 2025', src: ['docs'] },
      { label: 'Route we ran', value: 'October 1 replay: provider pinned to Google AI Studio, reasoning effort high, 12,288-token cap', src: ['receipt'] },
    ],
    prose: [{ text: 'Google\'s most cost-efficient Gemini 2.5 model, intended for high-volume, lightweight tasks.', src: ['docs'] }],
    sources: { docs: geminiDoc('gemini-2.5-flash-lite', 'Gemini 2.5 Flash-Lite'), or: openRouter('google/gemini-2.5-flash-lite'), receipt: OCT1_RECEIPT },
    results: [{ label: 'Earlier generations', href: '#/earlier-generations' }],
  },
  {
    id: 'grok-4.6', name: 'Grok 4.6', lab: 'xAI (listed on OpenRouter as SpaceXAI)', family: XAI, group: 'openrouter',
    glance: { released: '12 Aug 2026', size: 'Not disclosed', modalities: 'Text, image, file → text', licence: HOSTED_LICENCE, build: 'x-ai/grok-4.6 · Amazon Bedrock us-west-2 · high effort' },
    facts: [
      { label: 'Released', value: '12 August 2026', src: ['news'] },
      { label: 'Lineage', value: 'Builds on Grok 4.5; OpenRouter lists Grok 4.7 as its successor', src: ['news', 'or'] },
      { label: 'Context window', value: '500K tokens', src: ['docs', 'or'] },
      { label: 'Modalities', value: 'Text, image and file input; text output', src: ['or'] },
      { label: 'Reasoning control', value: 'Not described on xAI\'s announcement or model page; OpenRouter accepts a reasoning parameter', src: ['news', 'models'] },
      { label: 'Parameters', value: NOT_STATED, src: [] },
      { label: 'Route we ran', value: 'Provider pinned to Amazon Bedrock us-west-2, no fallbacks, reasoning effort high, 12,288-token cap', src: ['receipt'] },
    ],
    prose: [{ text: 'xAI aimed this release at long-running agents and interactive, visual work. In the book it is the only frontier entrant served through a cloud platform (Amazon Bedrock) rather than its developer\'s own endpoint.', src: ['news', 'receipt'] }],
    sources: { news: { label: 'xAI: Grok 4.6', url: 'https://x.ai/news/grok-4-6' }, docs: { label: 'xAI docs: models', url: 'https://docs.x.ai/docs/models' }, or: openRouter('x-ai/grok-4.6'), models: OPENROUTER_MODELS, receipt: FRONTIER_RECEIPT },
    results: [{ label: 'Protocol & results', href: '#/protocol-results' }, { label: 'One queen at a time', href: '#/frontier-trajectories' }],
  },
]

// ---------------------------------------------------------------- Decision models and other hosted routes
const DIRECT_MODELS: ModelEntry[] = [
  {
    id: 'jev-1.13', name: 'Jev 1.13', lab: 'TypeSafe', group: 'direct',
    glance: { released: 'Listed on OpenRouter 18 Sep 2026', size: 'Not disclosed', modalities: 'Text, PNG/JPEG image → typed decision', licence: 'Hosted API; openness not stated', build: 'typesafe/jev-1.13 · OpenRouter Decisions · text state' },
    facts: [
      { label: 'Developer', value: 'TypeSafe; Jev is its flagship and first "System One" model', src: ['docs'] },
      { label: 'Released', value: 'No date given for 1.13 on TypeSafe\'s model page (Jev 1.14 is dated 14 October 2026); OpenRouter lists the slug from 18 September 2026', src: ['docs', 'or'] },
      { label: 'Kind of model', value: 'A decision model: it returns a probability distribution over supplied options instead of free text. Question types are Choice, Score and Noul.', src: ['docs', 'or'] },
      { label: 'Modalities', value: 'Text (string, JSON object or array) and PNG or JPEG images in; decisions out', src: ['docs', 'or'] },
      { label: 'Context window', value: '64K tokens per request and 32K per question by default; 262K with a long-context header', src: ['docs', 'or'] },
      { label: 'Training', value: 'Trained with RLCD to return calibrated decisions; the same weights serve every account', src: ['docs'] },
      { label: 'Parameters and licence', value: NOT_STATED, src: [] },
      { label: 'Route we ran', value: 'OpenRouter\'s Decisions route with a canonical text grid of the board; the image prompt was rejected because this family needs the Decisions API', src: ['receipt'] },
    ],
    prose: [{ text: 'Jev never writes a solution. It picks among options the harness builds, so the book scores it on a different task from the language models: choosing a cell or colour from a menu, one decision per call.', src: ['docs', 'receipt'] }],
    sources: { docs: { label: 'TypeSafe docs: models', url: 'https://docs.typesafe.ai/models' }, or: openRouter('typesafe/jev-1.13'), receipt: { label: 'Book chapter: Jev primer', url: '#/jev-primer' } },
    results: [{ label: 'Jev primer', href: '#/jev-primer' }, { label: 'Decision models vs the index', href: '#/decision-models' }],
  },
  {
    id: 'subq-snap-preview', name: 'SubQ Snap (preview)', lab: 'Subquadratic', group: 'direct',
    glance: { released: 'Announced 12 Oct 2026', size: 'Not disclosed', modalities: 'Text, image → probability over answers', licence: 'Hosted API; openness not stated', build: 'subq-snap-preview · SubQ API (direct)' },
    facts: [
      { label: 'Developer', value: 'Subquadratic', src: ['blog'] },
      { label: 'Released', value: 'Announced 12 October 2026 as a public preview', src: ['blog'] },
      { label: 'Kind of model', value: 'A decision model for agent workflows: a decision head maps its representations to a probability for each allowed answer', src: ['blog'] },
      { label: 'Architecture claim', value: 'Subquadratic Sparse Attention, which the company says reduces attention cost from quadratic to linear. This is the developer\'s claim.', src: ['blog'] },
      { label: 'Modalities', value: 'Text and image input, up to 384K tokens of mixed context', src: ['blog'] },
      { label: 'Parameters and licence', value: NOT_STATED, src: [] },
      { label: 'Status today', value: 'subq-snap-preview is listed as retired on 11 November 2026 and now routes to Snap 1.2', src: ['docs'] },
      { label: 'Route we ran', value: 'SubQ\'s own Decisions endpoint, called directly rather than through OpenRouter', src: ['receipt'] },
    ],
    prose: [{ text: 'A second decision model, run on the same historical Jev tasks and the new-board panel so the two can be compared on identical menus. Because the preview ID now routes to a newer model, the book\'s receipts describe the preview only.', src: ['blog', 'docs', 'receipt'] }],
    sources: { blog: { label: 'Subquadratic: Introducing SubQ Snap', url: 'https://subq.ai/introducing-subq-snap' }, docs: { label: 'SubQ docs: models', url: 'https://docs.subq.ai/using-the-api/models/' }, receipt: { label: 'Book chapter: SubQ Snap replay', url: '#/subq-assessment' } },
    results: [{ label: 'SubQ Snap replay', href: '#/subq-assessment' }, { label: 'New-board panel', href: '#/subq-assessment/panel' }],
  },
]

// ---------------------------------------------------------------- Non-model systems
const SYSTEMS: ModelEntry[] = [
  {
    id: 'greedy-rule', name: 'Greedy rule (no model)', lab: 'This book', group: 'system',
    glance: { released: 'n/a', size: 'No parameters', modalities: 'Board state → one placement per step', licence: 'n/a', build: 'Fixed four-step rule, no search, no backtracking' },
    facts: [
      { label: 'What it is', value: 'A fixed rule: list each unplaced colour\'s legal cells, take the colour with the fewest, place its first legal cell in reading order, never undo', src: ['chapter'] },
      { label: 'Origin', value: 'The fail-first, minimum-remaining-values heuristic from constraint search (Haralick and Elliott, 1980), used here with no search at all', src: ['chapter'] },
      { label: 'Why it is on the leaderboard', value: 'A no-model baseline that uses the same conflict filter as the decision models\' filtered menus', src: ['chapter'] },
    ],
    prose: [{ text: 'It shows how much of a board a mechanical rule can solve with no model, which puts the decision-model results in context.', src: ['chapter'] }],
    sources: { chapter: { label: 'Book chapter: Greedy rule baseline', url: '#/greedy-rule' } },
    results: [{ label: 'Greedy rule baseline', href: '#/greedy-rule' }],
  },
  {
    id: 'z3', name: 'Z3 (referee, not an entrant)', lab: 'Microsoft Research', group: 'system',
    glance: { released: 'Book pins Z3 4.16.0', size: 'Not a learned model', modalities: 'Logical constraints → proof or model', licence: 'MIT', build: 'Z3 4.16.0, default solver parameters' },
    facts: [
      { label: 'What it is', value: 'A theorem prover from Microsoft Research', src: ['repo'] },
      { label: 'Licence', value: 'MIT', src: ['repo'] },
      { label: 'Version we ran', value: 'Z3 4.16.0 with the stated configuration', src: ['chapter'] },
      { label: 'Role in the book', value: 'Checks that each board has exactly one solution and teaches how a solver reasons; it is explanatory context, not a timed competitor', src: ['chapter'] },
    ],
    prose: [{ text: 'Z3 does not appear as a scored row: it is the referee that makes "exactly one solution" a checked fact rather than an assumption.', src: ['chapter'] }],
    sources: { repo: { label: 'GitHub: Z3Prover/z3', url: 'https://github.com/Z3Prover/z3' }, chapter: { label: 'Book part: How Z3 solves Queens', url: '#/how-z3-solves-queens' } },
    results: [{ label: 'How Z3 solves Queens', href: '#/how-z3-solves-queens' }],
  },
]

/** Every entry on the page, in reading order: local first (the owner's priority), then hosted, then systems. */
export const MODELS: ModelEntry[] = [...LOCAL_MODELS, ...HOSTED_MODELS, ...DIRECT_MODELS, ...SYSTEMS]
