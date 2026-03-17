# Structural Properties of LLM Semantic Processing

Code and data for the paper: *Structural Properties of LLM Semantic Processing: Measurement, Prediction, and Inexpressibility*

## What This Is

24 controlled experiments (~5,400 API calls across Claude, GPT-4o-mini, and Gemini-2.5-flash) investigating structural computational properties of LLMs: superposition, interference, phase transitions, and inexpressibility.

## Key Findings

- **Concept Attractor Strength (CAS)** quantifies how much a concept resists contextual reshaping
- **Phase Transition Condition**: CAS < 0.4 AND CD > 0.5 predicts qualitative output shifts
- **Meta-constructive interference**: opposing contexts produce vocabulary explosion (Claude), mild collapse with contradiction markers (Gemini), or full collapse (GPT)
- **Dissolution**: semantic operations solve problems that programming structurally cannot express (0% constrained vs 85-100% semantic, universal across 3 model families)

## Repository Structure

```
paper.tex              # Main paper (LaTeX)
references.bib         # Bibliography
figures/               # PDF figures (5 figures)
experiments/
  experiment_*.mjs     # Experiment scripts (A through S)
  results_*.json       # Raw results data
  analyze_*.mjs        # Analysis scripts
  generate_figures.mjs # Figure generation
sdk/
  semantic.mjs         # Core semantic state + gates
  router.mjs           # Multi-model client (Claude/GPT/Gemini)
  analysis.mjs         # Word frequency, cosine similarity, entropy
  profiler.mjs         # CAS measurement, phase detection
  primitives.mjs       # 5 semantic operations
  index.mjs            # Barrel export
  demo_circuit.mjs     # Demo: 3-gate semantic circuit
```

## Running Experiments

Requirements: Node.js 18+, API keys as environment variables.

```bash
# Install dependencies
npm install @anthropic-ai/sdk openai @google/generative-ai

# Set API keys
export ANTHROPIC_API_KEY="sk-ant-..."
export OPENAI_API_KEY="sk-..."
export GEMINI_API_KEY="..."

# Run a single experiment
node experiments/experiment_j_cas.mjs

# Run all experiments (warning: ~5,400 API calls)
node experiments/run_all.mjs
```

## Pre-computed Results

All `experiments/results_*.json` files contain the actual data from our runs. You can verify the paper's claims without making any API calls by examining these files.

## Authors

Trian & Claude (Anthropic)

## License

MIT
