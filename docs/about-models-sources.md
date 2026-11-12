# About the models: source ledger

Ledger for the reader page `#/about-models` (`src/AboutModels.tsx`, data in `src/aboutModelsData.ts`).
Every claim on the page maps to a row here: claim, URL, date accessed and a short supporting quote
(under 15 words, quoted or closely paraphrased from what the page returned). All sources were opened
on **2026-11-11**. Facts about our own builds come from the book's receipts, cited by file.

Book receipt for local builds: `public/evidence/local-qwen/index.json` (snapshot `2026-11-06-overnight`),
fields `studies[].runtime` (model, digest, server_version, details) and `studies[].protocol` (think,
num_predict, num_ctx). Reader route: `#/local-qwen`.

## Primer

| Claim | URL | Accessed | Supporting quote |
|---|---|---|---|
| GGUF holds tensors plus standard metadata; designed for GGML executors such as llama.cpp | https://huggingface.co/docs/hub/en/gguf | 2026-11-11 | "GGUF encodes both the tensors and a standardized set of metadata" |
| Q4_K: super-blocks of 8 blocks × 32 weights, 6-bit scale and min, 4.5 bpw | https://huggingface.co/docs/hub/en/gguf | 2026-11-11 | "Super-blocks with 8 blocks, each block has 32 weights" |
| Q4_K_M ≈ 4.89 bits/weight on Llama 3.1 8B | https://github.com/ggml-org/llama.cpp/blob/master/tools/quantize/README.md | 2026-11-11 | Table row: Q4_K_M, 4.8944 bits/weight |
| NVFP4 is E2M1 with 16-value blocks, FP8 E4M3 block scale and FP32 tensor scale | https://developer.nvidia.com/blog/introducing-nvfp4-for-efficient-and-accurate-low-precision-inference/ | 2026-11-11 | "a second-level FP32 scalar applied per tensor" |
| MXFP4 uses one power-of-two scale per 32-value block | same NVIDIA page | 2026-11-11 | "1 shared power-of-two scale per 32 value block" |
| MLX is Apple's array framework for Apple silicon with shared memory | https://github.com/ml-explore/mlx | 2026-11-11 | "Arrays in MLX live in shared memory" |
| Ollama 0.19 runs on MLX on Apple silicon and supports NVFP4 | https://ollama.com/blog/mlx | 2026-11-11 | "Ollama on Apple silicon is now built on top of Apple's machine learning framework, MLX" |
| gpt-oss MoE weights post-trained in MXFP4 | https://huggingface.co/openai/gpt-oss-20b | 2026-11-11 | "post-trained with MXFP4 quantization of the MoE weights" |
| The qwen3.5 library lists many tags differing in size, format and runner | https://ollama.com/library/qwen3.5/tags | 2026-11-11 | Page lists 72 tags (e.g. 4b-mlx-bf16 9.1GB, 4b-nvfp4 4.0GB) |

## Local open-weight models (Ollama 0.40.10)

### Qwen3.5 4B

| Claim | URL | Accessed | Supporting quote |
|---|---|---|---|
| Developer Qwen team; February 2026 citation | https://huggingface.co/Qwen/Qwen3.5-4B | 2026-11-11 | Citation author "{Qwen Team}", "month = {February}, year = {2026}" |
| Family attributed to Alibaba | https://ollama.com/blog/mlx | 2026-11-11 | "Alibaba's Qwen3.5-35B-A3B" |
| 4B/9B/2B/0.8B released 2026-03-02 | https://github.com/QwenLM/Qwen3.5 | 2026-11-11 | "Qwen3.5-9B, Qwen3.5-4B, Qwen3.5-2B, and Qwen3.5-0.8B are now available" |
| Base model Qwen3.5-4B-Base | https://huggingface.co/Qwen/Qwen3.5-4B | 2026-11-11 | Hub lists base model "Qwen/Qwen3.5-4B-Base" |
| Causal LM with vision encoder; 32 layers, Gated DeltaNet / Gated Attention | same | 2026-11-11 | "8 × (3 × (Gated DeltaNet → FFN) → 1 × (Gated Attention → FFN))" |
| 4B parameters; Hub metadata 5B | same | 2026-11-11 | "Number of Parameters: 4B" |
| Text, image, video input | same | 2026-11-11 | Image-text-to-text, with "video_url" input examples |
| Context 262,144 native, 1,010,000 with YaRN | same | 2026-11-11 | "262,144 natively and extensible up to 1,010,000 tokens" |
| Apache 2.0 | same | 2026-11-11 | "License: apache-2.0" |
| Thinking on by default | same | 2026-11-11 | "Qwen3.5 models operate in thinking mode by default" |
| Build: qwen3.5:4b, digest 7f3251fa6878…, safetensors, nvfp4, mlx, 0.40.10, 4.5B | receipt `index.json` study `qwen3.5-4b-pilot` | 2026-11-11 | `"quantization_level": "nvfp4", "runner": "mlx"` |
| think=true | receipt, `protocol.think` | 2026-11-11 | `"think": true` |
| Tag qwen3.5:4b now digest 492e37dc6907; 4b-nvfp4 is 61aa3858e9d3 | https://ollama.com/library/qwen3.5/tags | 2026-11-11 | "qwen3.5:4b … 492e37dc6907"; "4b-nvfp4 … 61aa3858e9d3" |
| Current qwen3.5:4b page shows Q4_K_M | https://ollama.com/library/qwen3.5:4b | 2026-11-11 | Model blob Q4_K_M, projector BF16 |

### Qwen3.5 9B (NVFP4)

| Claim | URL | Accessed | Supporting quote |
|---|---|---|---|
| Released 2026-03-02 | https://github.com/QwenLM/Qwen3.5 | 2026-11-11 | (as above) |
| Base Qwen3.5-9B-Base; 9B (Hub 10B); 32 layers same layout | https://huggingface.co/Qwen/Qwen3.5-9B | 2026-11-11 | "Number of Parameters: 9B" |
| Modalities, context, Apache 2.0, thinking default | same | 2026-11-11 | "extensible up to 1,010,000 tokens" |
| Build: qwen3.5:9b-nvfp4, digest 8218177ac78e…, safetensors, nvfp4, mlx, 9.4B | receipt study `qwen3.5-9b-nvfp4-fresh1-4arm-np32768` | 2026-11-11 | `"parameter_size": "9.4B"` |
| Tag today still 8218177ac78e, 7.2GB, MLX; plain 9b is fdf5fd4cd409 | https://ollama.com/library/qwen3.5/tags | 2026-11-11 | "qwen3.5:9b-nvfp4 (MLX) 7.2GB 8218177ac78e" |

### Qwen3.5 27B (Q4_K_M)

| Claim | URL | Accessed | Supporting quote |
|---|---|---|---|
| Released 2026-02-24 | https://github.com/QwenLM/Qwen3.5 | 2026-11-11 | "Qwen3.5-122B-A10B, Qwen3.5-35B-A3B, and Qwen3.5-27B are released" |
| 27B (Hub 28B); 64 layers; base not named | https://huggingface.co/Qwen/Qwen3.5-27B | 2026-11-11 | "16 × (3 × (Gated DeltaNet → FFN) → 1 × (Gated Attention → FFN))" |
| Modalities, context, Apache 2.0, thinking default | same | 2026-11-11 | "License: apache-2.0" |
| Build: qwen3.5:27b-q4_K_M, digest 64ae5b1d651f…, gguf, Q4_K_M, llamacpp, 26.9B, parent qwen35-validation-20261004:27b-q4 | receipt study `qwen3.5-27b-q4_K_M-fresh1-4arm-np24576` | 2026-11-11 | `"runner": "llamacpp"` |
| Tag today 64ae5b1d651f, 17GB; 27b-nvfp4 20GB | https://ollama.com/library/qwen3.5/tags | 2026-11-11 | "qwen3.5:27b-q4_K_M 17GB 64ae5b1d651f" |

### Gemma 4 E4B

| Claim | URL | Accessed | Supporting quote |
|---|---|---|---|
| Developer Google DeepMind | https://huggingface.co/google/gemma-4-E4B-it | 2026-11-11 | "a family of open models built by Google DeepMind" |
| Released 2026-04-02 in four sizes | https://blog.google/innovation-and-ai/technology/developers-tools/gemma-4/ | 2026-11-11 | Dated "Apr 02, 2026"; "26B Mixture of Experts (MoE)" and "31B Dense" |
| Dense, 42 layers, sliding window 512 + global; PLE | HF card | 2026-11-11 | PLE "gives each decoder layer its own small embedding for every token" |
| E = effective; 4.5B effective, 8B with embeddings | HF card | 2026-11-11 | "The "E" in E2B and E4B stands for "effective" parameters" |
| Text, image, audio, video input; text output | HF card; Google blog | 2026-11-11 | "All models natively process video and images" |
| 128K context | HF card; https://ollama.com/library/gemma4:e4b | 2026-11-11 | "Context Length 128K tokens" |
| Apache 2.0 | Google blog | 2026-11-11 | "commercially permissive Apache 2.0 license" |
| Thinking via <\|think\|> / enable_thinking | HF card | 2026-11-11 | `<|think|>` token at start of system prompt enables thinking |
| On-device positioning | Google blog | 2026-11-11 | "run completely offline with near-zero latency across edge devices" |
| Build: gemma4:e4b, digest eb2177adf764…, safetensors, nvfp4, mlx, 8.1B | receipt study `gemma4-e4b-fresh1-4arm-np32768` | 2026-11-11 | `"parameter_size": "8.1B"` |
| Tag today 009acb0d7fe1; nvfp4 5a08735df03c; eb2177adf764 not listed | https://ollama.com/library/gemma4/tags | 2026-11-11 | "gemma4:e4b (latest) 009acb0d7fe1" |

### LLaVA-Llama3 8B

| Claim | URL | Accessed | Supporting quote |
|---|---|---|---|
| XTuner fine-tune of Meta-Llama-3-8B-Instruct + CLIP-ViT-Large-patch14-336, MLP projector | https://huggingface.co/xtuner/llava-llama-3-8b-v1_1 | 2026-11-11 | Fine-tuned "by XTuner"; projector "MLP" |
| ShareGPT4V-PT and InternVL-SFT; 336 resolution | same | 2026-11-11 | ShareGPT4V-PT (1246K), InternVL-SFT (1268K) |
| Fine-tune release date and licence not stated | same; https://ollama.com/library/llava-llama3:8b | 2026-11-11 | Neither page states a date or licence |
| Llama 3 released 2024-04-18; 8k context; Meta Llama 3 Community License | https://huggingface.co/meta-llama/Meta-Llama-3-8B-Instruct | 2026-11-11 | "Model Release Date April 18, 2024" |
| Ollama build: Q4_K_M 8.03B + F16 projector 312M; num_ctx 4096; digest 44c161b1f465 | https://ollama.com/library/llava-llama3:8b | 2026-11-11 | "A LLaVA model fine-tuned from Llama 3 Instruct" |
| Build: digest 44c161b1f465…, gguf, Q4_K_M, families llama+clip; think=false, num_predict 4096 | receipt study `llava-llama3-8b-fresh1-4arm-np4096` | 2026-11-11 | `"think": false` |

### gpt-oss 20B

| Claim | URL | Accessed | Supporting quote |
|---|---|---|---|
| OpenAI open-weight model | https://huggingface.co/openai/gpt-oss-20b | 2026-11-11 | "OpenAI's open-weight models" |
| Model card on arXiv 2025-08-08; MoE; Apache 2.0 | https://arxiv.org/abs/2508.10925 | 2026-11-11 | "efficient mixture-of-expert transformer architecture" |
| 21B total, 3.6B active | HF card; https://github.com/openai/gpt-oss | 2026-11-11 | "21B parameters with 3.6B active parameters" |
| Text only; 16GB memory; lower-latency/local use | HF card | 2026-11-11 | "run within 16GB of memory" |
| Reasoning effort low/medium/high; harmony required | HF card | 2026-11-11 | "should only be used with the harmony format" |
| Ollama: digest f38aa0c53da5, 14GB, MXFP4, 20.9B | https://ollama.com/library/gpt-oss:20b | 2026-11-11 | "quantized to 4.25 bits per parameter" |
| Build: gguf, MXFP4, llamacpp, parent dhiltgen/gpt-oss:20b-llamacpp; think "high"; text modality | receipt study `gpt-oss-20b-fresh1-text-4arm-np32768` | 2026-11-11 | `"think": "high"`, `"modality": "text"` |

## Hosted models through OpenRouter

Shared sources, all opened 2026-11-11:

- OpenRouter catalogue entry per slug: `https://openrouter.ai/api/v1/models/<slug>/endpoints` (name, endpoints, provider, context per endpoint) and the list `https://openrouter.ai/api/v1/models` (created date, input modalities, supported parameters, description). The HTML model page (`openrouter.ai/<slug>`) returned an API guide without model facts, so the page links the JSON entries.
- Claude models overview: https://platform.claude.com/docs/en/about-claude/models/overview — context windows and max output for Opus 4.8/4.7/4.6 ("1M tokens", "128K tokens"), Opus 4.5, Sonnet 4.5, Sonnet 4 ("200K tokens", "64K tokens"); Sonnet 4 "retired, except on Claude Models on Google Cloud (Google managed) and Bedrock"; extended thinking "deprecated on Claude Opus 4.6"; tokenizer "introduced with Claude Opus 4.7".
- Book receipts: `public/evidence/frontier-image-panel/plan.json` (`reasoning_effort: "high"`, `max_tokens: 12288`, per-model `provider` / `batch_provider`, `allow_fallbacks: false`); `public/evidence/legacy-panel/plan.json` (per-model `reasoning: {effort: "high", exclude: true}`, GPT-4.1 `reasoning: null`, Gemini `batch_provider: "google-vertex/global"`); `public/evidence/runs/2026-10-01-earlier-generations/*/request.json` and `metadata.json` (Oct 1 replay providers; Sonnet 4 provider "Amazon Bedrock").

| Model | Claim | URL | Accessed | Supporting quote |
|---|---|---|---|---|
| Claude Opus 4.8 | Released 28 May 2026; builds on 4.7; effort default high, extra/max | https://www.anthropic.com/news/claude-opus-4-8 | 2026-11-11 | "builds on Opus 4.7 with improvements across benchmarks" |
| Claude Opus 4.8 | Most capable GA Opus; text/image/file in | https://openrouter.ai/api/v1/models/anthropic/claude-opus-4.8/endpoints | 2026-11-11 | "most capable generally available model in the Opus family" |
| Claude Opus 4.7 | Released 16 Apr 2026; upgrade to 4.6; xhigh; 2,576-px images | https://www.anthropic.com/news/claude-opus-4-7 | 2026-11-11 | "a direct upgrade to Opus 4.6" |
| Claude Opus 4.7 | Built for long-running asynchronous agents | https://openrouter.ai/api/v1/models/anthropic/claude-opus-4.7/endpoints | 2026-11-11 | "built for long-running, asynchronous agents" |
| Claude Opus 4.6 | Released 5 Feb 2026; successor to 4.5; first 1M Opus; adaptive thinking; four effort levels | https://www.anthropic.com/news/claude-opus-4-6 | 2026-11-11 | "four effort levels to choose from: low, medium, high (default), and max" |
| Claude Opus 4.6 | Coding and long-running professional tasks | https://openrouter.ai/api/v1/models/anthropic/claude-opus-4.6/endpoints | 2026-11-11 | "strongest model for coding and long-running professional tasks" |
| Claude Opus 4.5 | Released 24 Nov 2025; snapshot 20251101; effort parameter; coding/agents/computer use | https://www.anthropic.com/news/claude-opus-4-5 | 2026-11-11 | "With our new effort parameter on the Claude API" |
| Claude Sonnet 4.5 | Released 29 Sep 2025; priced as Sonnet 4; extended thinking | https://www.anthropic.com/news/claude-sonnet-4-5 | 2026-11-11 | Pricing matches Claude Sonnet 4: "$3/$15 per million tokens" |
| Claude Sonnet 4 | Released 22 May 2025; upgrade to 3.7; hybrid with extended thinking | https://www.anthropic.com/news/claude-4 | 2026-11-11 | "near-instant responses and extended thinking for deeper reasoning" |
| Claude Sonnet 4 | OpenRouter lists no endpoints today; image/text/file input | https://openrouter.ai/api/v1/models/anthropic/claude-sonnet-4/endpoints | 2026-11-11 | `"endpoints": []` |
| GPT-5.6 Sol | Flagship of 5.6 series; 1,050,000 ctx (922K in), 128K out; text+image; effort levels; cutoff 16 Feb 2026; no date | https://developers.openai.com/api/docs/models/gpt-5.6-sol | 2026-11-11 | "GPT-5.6 flagship model for complex professional work" |
| GPT-5.6 Sol | OpenRouter created 2026-07-09 | https://openrouter.ai/api/v1/models | 2026-11-11 | `created` timestamp for `openai/gpt-5.6-sol` = 2026-07-09 UTC |
| GPT-5.5 | Snapshot 2026-04-23; 1.05M/128K; effort none…xhigh, default medium; cutoff 1 Dec 2025 | https://developers.openai.com/api/docs/models/gpt-5.5 | 2026-11-11 | "none, low, medium (default), high and xhigh" |
| GPT-5.5 | Builds on GPT-5.4 | https://openrouter.ai/api/v1/models/openai/gpt-5.5/endpoints | 2026-11-11 | "building on GPT-5.4 with stronger reasoning" |
| GPT-5.4 | Snapshot 2026-03-05; 1.05M/128K; effort default none; cutoff 31 Aug 2025 | https://developers.openai.com/api/docs/models/gpt-5.4 | 2026-11-11 | "none (default), low, medium, high and xhigh" |
| GPT-5.4 | Unifies Codex and GPT lines | https://openrouter.ai/api/v1/models/openai/gpt-5.4/endpoints | 2026-11-11 | "unifying the Codex and GPT lines into a single system" |
| GPT-5.2 | Snapshot 2025-12-11; 400K/128K; default none; cutoff 31 Aug 2025; previous flagship | https://developers.openai.com/api/docs/models/gpt-5.2 | 2026-11-11 | "Previous flagship model for professional work" |
| GPT-5.1 | Snapshot 2025-11-13 deprecated; 400K/128K; none/low/medium/high; cutoff 30 Sep 2024 | https://developers.openai.com/api/docs/models/gpt-5.1 | 2026-11-11 | "configurable reasoning effort" |
| GPT-5 | Snapshot 2025-08-07 deprecated; 400K (272K in)/128K; minimal…high; cutoff 30 Sep 2024 | https://developers.openai.com/api/docs/models/gpt-5 | 2026-11-11 | "Previous intelligent reasoning model for coding and agentic tasks" |
| GPT-4.1 | Snapshot 2025-04-14 deprecated; 1,047,576/32,768; non-reasoning; cutoff 1 Jun 2024 | https://developers.openai.com/api/docs/models/gpt-4.1 | 2026-11-11 | "Smartest non-reasoning model" |
| GPT-4o (2024-11-20) | Snapshot listed, deprecated; 128K/16,384; cutoff 1 Oct 2023 | https://developers.openai.com/api/docs/models/gpt-4o | 2026-11-11 | `gpt-4o-2024-11-20` (Deprecated) |
| GPT-4o (2024-11-20) | No `reasoning` in supported parameters | https://openrouter.ai/api/v1/models | 2026-11-11 | `supported_parameters` lacks `reasoning` |
| Gemini 3.1 Pro Preview | 19 Feb 2026 preview; builds on Gemini 3 series | https://blog.google/innovation-and-ai/models-and-research/gemini-models/gemini-3-1-pro/ | 2026-11-11 | "We are releasing 3.1 Pro in preview today" |
| Gemini 3.1 Pro Preview | Inputs text/image/video/audio/PDF; 1,048,576 in / 65,536 out; thinking supported | https://aistudio.google.com/docs/models/gemini-3.1-pro-preview | 2026-11-11 | "Text, Image, Video, Audio, and PDF" |
| Gemini 2.5 Pro | Updated June 2025; deprecated, reroute 1 Dec 2026; limits; thinking; cutoff Jan 2025 | https://aistudio.google.com/docs/models/gemini-2.5-pro | 2026-11-11 | "Audio, images, video, text, and PDF" |
| Gemini 2.5 Pro | Reasoning, coding, maths, science | https://openrouter.ai/api/v1/models/google/gemini-2.5-pro/endpoints | 2026-11-11 | "designed for advanced reasoning, coding, mathematics, and scientific tasks" |
| Gemini 2.5 Flash | Price-performance; June 2025; deprecated; limits; cutoff Jan 2025 | https://aistudio.google.com/docs/models/gemini-2.5-flash | 2026-11-11 | "Our best model in terms of price-performance" |
| Gemini 2.5 Flash-Lite | July 2025; most cost-efficient; limits; cutoff Jan 2025 | https://aistudio.google.com/docs/models/gemini-2.5-flash-lite | 2026-11-11 | "Our most cost-efficient multimodal model" |
| Grok 4.6 | 12 Aug 2026; builds on Grok 4.5; long-running agents, visual work; reasoning controls not described | https://x.ai/news/grok-4-6 | 2026-11-11 | "builds on Grok 4.5" |
| Grok 4.6 | 500K context | https://docs.x.ai/docs/models | 2026-11-11 | Pricing table lists "500k" for grok-4.6 |
| Grok 4.6 | Author SpaceXAI; succeeded by Grok 4.7; text/image/file in; 500,000 ctx | https://openrouter.ai/api/v1/models/x-ai/grok-4.6/endpoints | 2026-11-11 | "It is succeeded by Grok 4.7" |

## Decision models and other hosted routes

| Model | Claim | URL | Accessed | Supporting quote |
|---|---|---|---|---|
| Jev 1.13 | TypeSafe flagship, first System One model; Choice/Score/Noul; text + PNG/JPEG; 64K/32K, 262K with header; RLCD; same weights for all; 1.13 undated, 1.14 dated 14 Oct 2026 | https://docs.typesafe.ai/models | 2026-11-11 | "TypeSafe's flagship model and the first System One model" |
| Jev 1.13 | Listed 2026-09-18; output modality "decisions"; TypeSafe provider, 262,144 ctx | https://openrouter.ai/api/v1/models/typesafe/jev-1.13/endpoints | 2026-11-11 | `"modality": "text+image->decisions"` |
| Jev 1.13 | Image prompt got HTTP 400; Decisions route with text grid | book `#/jev-primer` (`src/App.tsx` JevPrimer) | 2026-11-11 | "requires its separate Decisions API" |
| SubQ Snap | Subquadratic; 12 Oct 2026; public preview; decision head; SSA claim; 384K mixed context | https://subq.ai/introducing-subq-snap | 2026-11-11 | "a decision model for agentic workflows" |
| SubQ Snap | `subq-snap-preview` retired 11 Nov 2026, routes to Snap 1.2 | https://docs.subq.ai/using-the-api/models/ | 2026-11-11 | "These models have been retired and now route to Snap 1.2" |
| SubQ Snap | Called directly, not via OpenRouter | book `#/protocol-results` routes callout | 2026-11-11 | "calls its documented provider endpoint directly" |

## Non-model systems

| System | Claim | URL | Accessed | Supporting quote |
|---|---|---|---|---|
| Greedy rule | Four-step rule; fail-first / MRV heuristic (Haralick and Elliott 1980) | book `#/greedy-rule` (`src/GreedyRule.tsx`) | 2026-11-11 | "Take the color with the fewest legal cells" |
| Z3 | Theorem prover from Microsoft Research; MIT licence | https://github.com/Z3Prover/z3 | 2026-11-11 | "Z3 is a theorem prover from Microsoft Research" |
| Z3 | Book pins 4.16.0; explanatory context, not a timed competitor | book `#/how-z3-solves-queens` (`src/z3/Chapter9.tsx`), `DESIGN.md` | 2026-11-11 | "The repository solver is explanatory context, not a timed competitor" |

## Unverified / omitted

- **gpt-oss 20B context window.** Not stated on the Hugging Face card, the arXiv abstract page, the GitHub README (only a CLI default of 8,192) or the Ollama page. Written as "Not stated in the primary sources we found".
- **gpt-oss release date.** Only the model-card submission date (8 Aug 2025) was confirmed; `openai.com/index/introducing-gpt-oss/` returned HTTP 403.
- **Qwen3.5 small sizes: dense or MoE.** The cards' highlights mention "sparse Mixture-of-Experts" but the per-model specifications list no experts, and the repository labels only 397B-A17B as MoE. The page says "no expert count is listed" and does not call them dense.
- **Qwen3.5 27B base checkpoint.** Not named on its card.
- **LLaVA-Llama3 fine-tune release date and checkpoint licence.** Not stated on the XTuner card or the Ollama page.
- **Gemma 4 E4B Ollama input types.** The library page lists text, image and audio; the tags page lists text and image. The page cites the Google card and blog for modalities instead.
- **Qwen blog post.** `qwen.ai/blog?id=qwen3.5` rendered no text; the GitHub repository was used for release dates.
- **OCP MX specification PDF.** Could not be read as text; MXFP4 is described from the NVIDIA comparison and the gpt-oss card.
- **Hosted model sizes.** None of the lab pages, docs or OpenRouter entries we opened state parameter counts for any hosted model; written as "Not disclosed" / "Not stated in the primary sources we found".
- **"No open weights" for hosted models.** A negative claim: none of the sources we opened offers downloadable weights. Worded on the page as "no open weights in the sources".
- **GPT-5.6 Sol release date.** OpenAI's model page gives none and `openai.com` returned HTTP 403; only OpenRouter's listing date (9 Jul 2026) is shown. Secondary press dates were not used.
- **Other OpenAI dates.** Shown as snapshot dates from OpenAI's docs, not announcement dates.
- **Gemini 2.5 release dates.** Shown as the docs' "Latest update" month, not an announcement date.
- **Grok 4.6 reasoning controls and parameter count.** Not described by xAI; secondary reports of a parameter count were not used.
- **Gemini 3.1 Pro thinking levels, Claude parameter counts, Jev/SubQ architecture details beyond the developer's own claims.** Not stated in primary sources.
- **Claude Sonnet 4.5 context.** OpenRouter lists 1M on some endpoints; Anthropic's docs list 200K. The page uses Anthropic's figure.
