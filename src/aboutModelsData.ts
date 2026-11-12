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
    intro: 'API-only models from four labs. Each request went through OpenRouter with a pinned upstream provider and fallbacks disabled, so the route is part of what was measured. Weights for these models are not published.',
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

export const MODELS: ModelEntry[] = [
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
