# Analysis Summary

- User Provided List Count: 97 models (all prefixed with nvidia/)
- build.nvidia.com Catalog Count: 130 models (pageSize=96; Page 1 = 96 models, Page 2 = 34 models)
- Exact String Matches: 53 models
- Slug Format Variant Matches (Dots vs. Underscores in URLs): 10 models
- Models in User List MISSING from build.nvidia.com: 34 models
- Models on build.nvidia.com MISSING from User List: 67 models

## 1. Naming / Slug Convention Equivalents (10 Models)

build.nvidia.com replaces decimal dots (.) with underscores (_) in URL slugs for certain model versions. These refer to the same underlying models:

User Provided Slug build.nvidia.com Slug

- black-forest-labs/flux.1-dev black-forest-labs/flux_1-dev
- meta/llama-3.1-70b-instruct meta/llama-3_1-70b-instruct
- meta/llama-3.1-8b-instruct meta/llama-3_1-8b-instruct
- meta/llama-3.3-70b-instruct meta/llama-3_3-70b-instruct
- nvidia/llama-3.1-nemotron-nano-8b-v1 nvidia/llama-3_1-nemotron-nano-8b-v1
- nvidia/llama-3.1-nemotron-safety-guard-8b-v3 nvidia/llama-3_1-nemotron-safety-guard-8b-v3
- nvidia/llama-3.3-nemotron-super-49b-v1 nvidia/llama-3_3-nemotron-super-49b-v1
- nvidia/llama-3.3-nemotron-super-49b-v1.5 nvidia/llama-3_3-nemotron-super-49b-v1_5
- nvidia/riva-translate-4b-instruct-v1.1 nvidia/riva-translate-4b-instruct-v1_1
- upstage/solar-10.7b-instruct upstage/solar-10_7b-instruct

## 2. Models in Your List MISSING from build.nvidia.com (34 Models)

These 34 models exist in your refreshed OpenCode list but are not present on build.nvidia.com (pages 1 and 2):

- abacusai/dracarys-llama-3.1-70b-instruct
- deepseek-ai/deepseek-v4-flash
- deepseek-ai/deepseek-v4-flash-0731
- deepseek-ai/deepseek-v4-pro
- google/gemma-2-2b-it
- google/gemma-3-12b-it
- google/gemma-3-4b-it
- google/gemma-3n-e2b-it
- google/gemma-3n-e4b-it
- meta/llama-4-maverick-17b-128e-instruct
- microsoft/phi-4-mini-instruct
- microsoft/phi-4-multimodal-instruct
- minimaxai/minimax-m2.7
- mistralai/magistral-small-2506
- mistralai/ministral-14b-instruct-2512
- mistralai/mistral-7b-instruct-v0.3
- mistralai/mistral-large-3-675b-instruct-2512
- mistralai/mistral-medium-3-instruct
- mistralai/mistral-medium-3.5-128b
- mistralai/mistral-small-4-119b-2603
- mistralai/mixtral-8x22b-instruct
- nvidia/cosmos-predict1-5b
- nvidia/gliner-pii
- nvidia/llama-3.1-nemotron-70b-instruct
- nvidia/llama-3.1-nemotron-ultra-253b-v1
- nvidia/llama-3_2-nemoretriever-300m-embed-v1
- nvidia/nemotron-3-content-safety
- nvidia/nemotron-content-safety-reasoning-4b
- nvidia/usdcode
- nvidia/usdvalidate
- qwen/qwen2.5-coder-32b-instruct
- qwen/qwen3-coder-480b-a35b-instruct
- qwen/qwen3.5-122b-a10b
- qwen/qwen3.5-397b-a17b

## 3. Models on build.nvidia.com MISSING from Your List (67 Models)

These 67 models are live on build.nvidia.com (pages 1 and 2) but do not appear in your list:

- arc/evo2-40b
- arc/evo2-40b-forward
- arc/evo2-7b-forward
- baidu/paddleocr
- colabfold/msa-search
- deepmind/alphafold2
- deepmind/alphafold2-multimer
- google/diffusiongemma-26b-a4b-it
- ipd/proteinmpnn
- ipd/rfdiffusion
- meta/muse-glimmer-30b
- microsoft/trellis
- mit/boltz2
- mit/diffdock
- nvidia/bnr
- nvidia/canary-1b-asr
- nvidia/conformer-ctc-asr
- nvidia/cosmos3-nano
- nvidia/cosmos3-nano-reasoner
- nvidia/eyecontact
- nvidia/fourcastnet
- nvidia/genmol-generate
- nvidia/ising-calibration-1-35b-a3b
- nvidia/ising-calibration-1.5-31b
- nvidia/lipsync
- nvidia/llama-3_1-nemoguard-8b-content-safety
- nvidia/llama-3_1-nemoguard-8b-topic-control
- nvidia/llama-nemotron-embed-1b-v2
- nvidia/llama-nemotron-rerank-1b-v2
- nvidia/magpie-tts-multilingual
- nvidia/megatron-1b-nmt
- nvidia/molmim-generate
- nvidia/nemoguard-jailbreak-detect
- nvidia/nemoretriever-ocr
- nvidia/nemoretriever-page-elements-v2
- nvidia/nemoretriever-parse
- nvidia/nemotron-3-embed-1b
- nvidia/nemotron-3.5-content-safety
- nvidia/nemotron-3.5-lightning-30b-a3b
- nvidia/nemotron-asr-streaming
- nvidia/nemotron-graphic-elements-v1
- nvidia/nemotron-ocr-v1
- nvidia/nemotron-ocr-v2
- nvidia/nemotron-page-elements-v3
- nvidia/nemotron-parse
- nvidia/nemotron-table-structure-v1
- nvidia/nv-embedqa-e5-v5
- nvidia/nv-yolox-page-elements-v1
- nvidia/nvidia-cuopt
- nvidia/parakeet-1_1b-rnnt-multilingual-asr
- nvidia/parakeet-ctc-0_6b-asr
- nvidia/parakeet-ctc-0_6b-es
- nvidia/parakeet-ctc-0_6b-vi
- nvidia/parakeet-ctc-0_6b-zh-cn
- nvidia/parakeet-ctc-0_6b-zh-tw
- nvidia/parakeet-ctc-1_1b-asr
- nvidia/parakeet-tdt-0_6b-v2
- nvidia/qwen-image-edit-nvpcb-ovsl2sl
- nvidia/relighting
- nvidia/riva-translate-1_6b
- nvidia/riva-translate-4b-instruct-v2
- nvidia/vista-3d
- nvidia/vsr
- openfold/openfold2
- openfold/openfold3
- resembleai/chatterbox-multilingual-tts
- stabilityai/stable-diffusion-3_5-large
