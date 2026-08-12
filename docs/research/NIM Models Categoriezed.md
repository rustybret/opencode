# Group 1 - Agent Models

## Frontier & Flagship Reasoning / Coding LLMs

- z-ai/glm-5.2 (Flagship long-horizon agentic & tool-use model)
- deepseek-ai/deepseek-v4-pro
- deepseek-ai/deepseek-v4-flash & deepseek-ai/deepseek-v4-flash-0731
- minimaxai/minimax-m3 & minimaxai/minimax-m2.7
- openai/gpt-oss-120b & openai/gpt-oss-20b
- mistralai/mistral-large-3-675b-instruct-2512
- mistralai/mistral-medium-3.5-128b & mistralai/mistral-medium-3-instruct
- mistralai/mistral-small-4-119b-2603
- mistralai/mixtral-8x22b-instruct & mistralai/mixtral-8x7b-instruct
- qwen/qwen3.5-397b-a17b & qwen/qwen3.5-122b-a10b
- qwen/qwen3-coder-480b-a35b-instruct
- qwen/qwen3-next-80b-a3b-instruct
- qwen/qwen2.5-coder-32b-instruct
- meta/llama-3.3-70b-instruct (Web slug: llama-3_3-70b-instruct)
- meta/llama-3.1-70b-instruct (Web slug: llama-3_1-70b-instruct)
- meta/llama-4-maverick-17b-128e-instruct
- meta/llama-3.2-90b-vision-instruct
- nvidia/nemotron-3-ultra-550b-a55b
- nvidia/nemotron-3-super-120b-a12b
- nvidia/llama-3.1-nemotron-ultra-253b-v1
- nvidia/llama-3.1-nemotron-70b-instruct
- nvidia/llama-3.3-nemotron-super-49b-v1 (Web slug: llama-3_3-nemotron-super-49b-v1)
- nvidia/llama-3.3-nemotron-super-49b-v1.5 (Web slug: llama-3_3-nemotron-super-49b-v1_5)
- abacusai/dracarys-llama-3.1-70b-instruct

## Mid-Range & Agent-Optimized Models

- nvidia/nemotron-3.5-lightning-30b-a3b (Low-latency MoE agent engine)
- nvidia/nemotron-3-nano-omni-30b-a3b-reasoning
- nvidia/nemotron-3-nano-30b-a3b
- poolside/laguna-xs-2.1 (33B MoE agentic coding & terminal tasks)
- stepfun-ai/step-3.7-flash & stepfun-ai/step-3.5-flash
- bytedance/seed-oss-36b-instruct
- google/gemma-4-31b-it
- google/diffusiongemma-26b-a4b-it
- meta/muse-glimmer-30b
- mistralai/ministral-14b-instruct-2512
- mistralai/magistral-small-2506
- mistralai/mistral-nemotron
- sarvamai/sarvam-m (Multilingual & Indic math/reasoning/coding)
- thinkingmachines/inkling
- upstage/solar-10.7b-instruct (Web slug: solar-10_7b-instruct)

## Lightweight & Small-Footprint Agentic LLMs

- nvidia/nvidia-nemotron-nano-9b-v2
- nvidia/llama-3.1-nemotron-nano-8b-v1 (Web slug: llama-3_1-nemotron-nano-8b-v1)
- nvidia/llama-3.1-nemotron-nano-vl-8b-v1
- nvidia/nemotron-mini-4b-instruct
- nvidia/nemotron-nano-12b-v2-vl
- nvidia/cosmos-reason2-8b (VLM structured reasoning)
- google/gemma-3-12b-it & google/gemma-3-4b-it
- google/gemma-3n-e4b-it & google/gemma-3n-e2b-it
- google/gemma-2-2b-it
- google/google-paligemma
- meta/llama-3.1-8b-instruct (Web slug: llama-3_1-8b-instruct)
- meta/llama-3.2-11b-vision-instruct
- meta/llama-3.2-3b-instruct & meta/llama-3.2-1b-instruct
- microsoft/phi-4-mini-instruct & microsoft/phi-4-multimodal-instruct
- mistralai/mistral-7b-instruct-v0.3

# Group 2: Image & Video Generation & Editing Models — 16 Models

## Models designed specifically for image generation, image-to-image editing, video generation, lighting, and synthetic video creation

- black-forest-labs/flux.1-dev (Web slug: flux_1-dev)
- black-forest-labs/flux_1-kontext-dev
- black-forest-labs/flux_1-schnell
- black-forest-labs/flux_2-klein-4b
- qwen/qwen-image
- qwen/qwen-image-edit
- nvidia/qwen-image-edit-nvpcb-ovsl2sl
- stabilityai/stable-diffusion-3_5-large
- nvidia/cosmos-transfer1-7b (Video-to-world simulation)
- nvidia/cosmos-transfer2_5-2b
- nvidia/cosmos-predict1-5b
- nvidia/cosmos3-nano & nvidia/cosmos3-nano-reasoner
- nvidia/relighting
- nvidia/synthetic-video-detector

# Group 3: Specialized / Single-Purpose / Irrelevant Models — 86 Models

## Domain-specific microservices unusable for agentic orchestration tasks (speech-to-text, bio/protein folding, document/OCR parsers, embeddings, vehicle perception, and safety classifiers)

### Biology, Protein Folding & Chemistry (18)

- meta/esm2-650m & meta/esmfold
- deepmind/alphafold2 & deepmind/alphafold2-multimer
- openfold/openfold2 & openfold/openfold3
- mit/boltz2 & mit/diffdock
- arc/evo2-40b, arc/evo2-40b-forward, arc/evo2-7b-forward
- ipd/proteinmpnn & ipd/rfdiffusion
- nvidia/molmim-generate & nvidia/genmol-generate
- colabfold/msa-search

### Speech Recognition (ASR), Translation (NMT), TTS & Audio (21)

- openai/whisper-large-v3
- nvidia/canary-1b-asr
- nvidia/conformer-ctc-asr
- nvidia/nemotron-asr-streaming
- nvidia/parakeet-1_1b-rnnt-multilingual-asr
- nvidia/parakeet-ctc-1_1b-asr
- nvidia/parakeet-ctc-0_6b-asr
- nvidia/parakeet-ctc-0_6b-es
- nvidia/parakeet-ctc-0_6b-vi
- nvidia/parakeet-ctc-0_6b-zh-cn
- nvidia/parakeet-ctc-0_6b-zh-tw
- nvidia/parakeet-tdt-0_6b-v2
- nvidia/magpie-tts-zeroshot & nvidia/magpie-tts-multilingual
- resembleai/chatterbox-multilingual-tts
- nvidia/studiovoice, nvidia/active-speaker-detection, nvidia/nemotron-voicechat
- nvidia/riva-translate-4b-instruct-v1.1 (Web slug: v1_1), v2, 1_6b
- nvidia/megatron-1b-nmt

### Embeddings, Reranking & Retrieval (13)

- nvidia/baai/bge-m3
- nvidia/nv-embed-v1 & nvidia/nv-embedcode-7b-v1
- nvidia/nv-embedqa-e5-v5
- nvidia/rerank-qa-mistral-4b
- nvidia/nemotron-3-embed-1b
- nvidia/llama-3_2-nemoretriever-300m-embed-v1
- nvidia/llama-nemotron-embed-1b-v2 & nvidia/llama-nemotron-embed-vl-1b-v2
- nvidia/llama-nemotron-rerank-1b-v2 & nvidia/llama-nemotron-rerank-vl-1b-v2
- nvidia/nemoretriever-parse & nvidia/nemotron-parse

### OCR, Document Parsing & Visual Layout (11)

- baidu/paddleocr
- nvidia/nemoretriever-ocr, nvidia/nemotron-ocr-v1, nvidia/nemotron-ocr-v2
- nvidia/nemoretriever-page-elements-v2, nvidia/nemotron-page-elements-v3
- nvidia/nemotron-table-structure-v1, nvidia/nemotron-graphic-elements-v1
- nvidia/nv-yolox-page-elements-v1

### Autonomous Vehicles, Physical AI & 3D Tools (12)

- nvidia/bevformer, nvidia/sparsedrive, nvidia/streampetr
- nvidia/eyecontact, nvidia/lipsync, nvidia/bnr, nvidia/vsr
- nvidia/fourcastnet, nvidia/vista-3d, microsoft/trellis
- nvidia/usdcode & nvidia/usdvalidate

### Quantum Calibration, Safety & Guardrail Models (11)

- nvidia/ising-calibration-1.5-31b & nvidia/ising-calibration-1-35b-a3b
- meta/llama-guard-4-12b
- nvidia/llama-3.1-nemotron-safety-guard-8b-v3 (Web slug: llama-3_1-nemotron-safety-guard-8b-v3)
- nvidia/llama-3_1-nemoguard-8b-content-safety & nvidia/llama-3_1-nemoguard-8b-topic-control
- nvidia/nemoguard-jailbreak-detect
- nvidia/nemotron-3-content-safety & nvidia/nemotron-3.5-content-safety
- nvidia/nemotron-content-safety-reasoning-4b
- nvidia/gliner-pii
