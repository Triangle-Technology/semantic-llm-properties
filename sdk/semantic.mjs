/**
 * SEMANTIC COMPUTING SDK v1.0
 *
 * The first programming framework for semantic computing.
 * Analogous to Qiskit for quantum computing.
 *
 * Core primitives:
 *   - SemanticState: a token/concept in superposition
 *   - ContextGate: applies a single context to collapse/reshape state
 *   - InterferenceGate: two contexts interact → emergence
 *   - ChainGate: compose gates sequentially with semantic inheritance
 *   - SemanticCircuit: compose multiple gates into a program
 *   - Runner: execute circuits, collect results, analyze
 *
 * Usage:
 *   import { SemanticCircuit, ContextGate, InterferenceGate, Runner } from './semantic.mjs'
 *
 *   const circuit = new SemanticCircuit("my-circuit")
 *     .input("What is consciousness?")
 *     .gate(new InterferenceGate("physicist", "monk", 0.5))
 *     .gate(new ContextGate("child philosopher"))
 *     .build()
 *
 *   const results = await Runner.run(circuit, { n: 10 })
 */

import Anthropic from "@anthropic-ai/sdk";

// ═══════════════════════════════════════════════════════════
// SEMANTIC STATE
// ═══════════════════════════════════════════════════════════

export class SemanticState {
  constructor(text, metadata = {}) {
    this.text = text;
    this.metadata = metadata;
    this.history = []; // trace of gates applied

    // v1.0 additions — semantic measurement fields
    this.cas = metadata.cas ?? null;       // CAS score (0-1)
    this.phase = metadata.phase ?? null;   // "stable" | "transitional" | "dissolved"
    this.trace = metadata.trace ?? [];     // operation trace log
  }

  clone() {
    const s = new SemanticState(this.text, { ...this.metadata });
    s.history = [...this.history];
    s.cas = this.cas;
    s.phase = this.phase;
    s.trace = [...this.trace];
    return s;
  }

  /** Add a trace entry for this state's transformation history. */
  addTrace(entry) {
    this.trace.push({ timestamp: Date.now(), ...entry });
    return this;
  }
}

// ═══════════════════════════════════════════════════════════
// GATES
// ═══════════════════════════════════════════════════════════

export class ContextGate {
  constructor(persona, options = {}) {
    this.type = "context";
    this.persona = persona;
    this.alpha = options.alpha ?? 1.0;
    this.label = options.label || persona;
  }

  buildSystemPrompt(_inputState) {
    return `You are ${this.persona}.`;
  }
}

export class InterferenceGate {
  constructor(persona1, persona2, alpha = 0.5, options = {}) {
    this.type = "interference";
    this.persona1 = persona1;
    this.persona2 = persona2;
    this.alpha = alpha; // 0 = pure persona2, 1 = pure persona1, 0.5 = equal
    this.label = options.label || `${persona1} × ${persona2}`;
  }

  buildSystemPrompt(_inputState) {
    if (this.alpha >= 0.7) {
      return `You are primarily ${this.persona1} (${Math.round(this.alpha * 100)}%), with some perspective from ${this.persona2} (${Math.round((1 - this.alpha) * 100)}%). ${this.persona1} dominates your worldview.`;
    } else if (this.alpha <= 0.3) {
      return `You are primarily ${this.persona2} (${Math.round((1 - this.alpha) * 100)}%), with some perspective from ${this.persona1} (${Math.round(this.alpha * 100)}%). ${this.persona2} dominates your worldview.`;
    } else {
      return `You are simultaneously ${this.persona1} AND ${this.persona2}. Hold both perspectives with equal weight. Let them interact and create something neither could alone.`;
    }
  }
}

export class ChainGate {
  constructor(innerGate, options = {}) {
    this.type = "chain";
    this.innerGate = innerGate;
    this.inheritPrompt = options.inheritPrompt ||
      "You are a precise summarizer. Extract the 3 most novel concepts or metaphors in bullet points (one line each):";
    this.label = options.label || `chain(${innerGate.label})`;
  }

  // ChainGate needs special handling in Runner - it extracts concepts
  // from previous gate output and injects them into the next gate's context
  buildSystemPrompt(inputState) {
    const basePrompt = this.innerGate.buildSystemPrompt(inputState);
    if (inputState.metadata.inheritedConcepts) {
      return `${basePrompt}\n\nYou have encountered these ideas from a previous thinker:\n${inputState.metadata.inheritedConcepts}\n\nLet these concepts deeply influence your thinking. Don't just reference them — let them transform how you approach the question.`;
    }
    return basePrompt;
  }
}

export class MetaGate {
  /**
   * NEW: Meta-Constructive Interference Gate
   * Discovered in Experiment F: opposing contexts don't cancel —
   * they elevate to a higher abstraction level.
   *
   * This gate deliberately creates OPPOSITION to trigger meta-cognition.
   */
  constructor(persona1, antiPersona, options = {}) {
    this.type = "meta";
    this.persona1 = persona1;
    this.antiPersona = antiPersona;
    this.label = options.label || `meta(${persona1} ⊕ ${antiPersona})`;
  }

  buildSystemPrompt(_inputState) {
    return `You hold two genuinely contradictory beliefs with equal conviction:
1. ${this.persona1}
2. ${this.antiPersona}

Do not choose one side. Do not compromise or average them. Instead, find the DEEPER truth that contains both. Elevate beyond the contradiction to something neither view alone can see.`;
  }
}

// ═══════════════════════════════════════════════════════════
// CIRCUIT
// ═══════════════════════════════════════════════════════════

export class SemanticCircuit {
  constructor(name) {
    this.name = name;
    this.prompt = null;
    this.gates = [];
    this._built = false;
  }

  input(prompt) {
    this.prompt = prompt;
    return this;
  }

  gate(g) {
    this.gates.push(g);
    return this;
  }

  build() {
    if (!this.prompt) throw new Error("Circuit needs an input prompt. Call .input() first.");
    if (this.gates.length === 0) throw new Error("Circuit needs at least one gate. Call .gate() first.");
    this._built = true;
    return this;
  }

  describe() {
    const lines = [`Circuit: ${this.name}`, `Input: "${this.prompt}"`, "Gates:"];
    this.gates.forEach((g, i) => {
      lines.push(`  ${i + 1}. [${g.type.toUpperCase()}] ${g.label}`);
    });
    return lines.join("\n");
  }
}

// ═══════════════════════════════════════════════════════════
// ANALYSIS TOOLS
// ═══════════════════════════════════════════════════════════

// v1.0: Analysis re-exported from analysis.mjs (consolidated module)
// Kept here for backward compatibility: import { Analysis } from './semantic.mjs'
export { Analysis } from "./analysis.mjs";

// ═══════════════════════════════════════════════════════════
// RUNNER
// ═══════════════════════════════════════════════════════════

export class Runner {
  constructor(options = {}) {
    this.model = options.model || "claude-haiku-4-5-20251001";
    this.temperature = options.temperature ?? 1.0;
    this.maxTokens = options.maxTokens || 150;
    this.verbose = options.verbose ?? true;

    // v1.0: support external router, fallback to direct Anthropic client
    this._router = options.router ?? null;
    this._client = null; // lazy Anthropic client (backward compat)
  }

  async _sample(systemPrompt, userPrompt, maxTokens) {
    // v1.0: use router if provided
    if (this._router) {
      return this._router.sample(systemPrompt, userPrompt, {
        maxTokens: maxTokens || this.maxTokens,
        temperature: this.temperature,
      });
    }

    // Backward compat: direct Anthropic client
    if (!this._client) {
      this._client = new Anthropic();
    }
    const response = await this._client.messages.create({
      model: this.model,
      max_tokens: maxTokens || this.maxTokens,
      temperature: this.temperature,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    });
    return response.content[0].text.trim();
  }

  async _extractConcepts(text) {
    const resp = await this._sample(
      "You are a precise summarizer. Extract only the most novel and surprising concepts.",
      `Extract the 3 most novel concepts from this text in bullet points (one line each):\n\n${text}`,
      200
    );
    return resp;
  }

  /**
   * Run a semantic circuit.
   *
   * For single-gate circuits: runs N times, returns all outputs.
   * For multi-gate circuits: runs the chain N times, each time
   * passing concepts from gate i as context to gate i+1.
   */
  async run(circuit, options = {}) {
    if (!circuit._built) throw new Error("Circuit not built. Call .build() first.");

    const n = options.n || 5;
    const log = this.verbose ? (...args) => console.log(...args) : () => {};

    log(`\n${"═".repeat(60)}`);
    log(`RUNNING: ${circuit.name}`);
    log(circuit.describe());
    log("═".repeat(60));

    const runs = [];

    for (let run = 0; run < n; run++) {
      log(`\n── Run ${run + 1}/${n} ${"─".repeat(40)}`);

      let state = new SemanticState(circuit.prompt);
      const gateOutputs = [];

      for (let gi = 0; gi < circuit.gates.length; gi++) {
        const gate = circuit.gates[gi];
        log(`  Gate ${gi + 1} [${gate.type}] ${gate.label}`);

        const systemPrompt = gate.buildSystemPrompt(state);
        const output = await this._sample(systemPrompt, state.text, this.maxTokens);

        log(`    → "${output.substring(0, 120)}${output.length > 120 ? '...' : ''}"`);

        gateOutputs.push({
          gate: gate.label,
          type: gate.type,
          output,
          systemPrompt,
        });

        // Prepare state for next gate
        if (gi < circuit.gates.length - 1) {
          const nextGate = circuit.gates[gi + 1];

          if (nextGate.type === "chain" || circuit.gates.length > 1) {
            // Extract concepts for inheritance
            const concepts = await this._extractConcepts(output);
            state = new SemanticState(circuit.prompt, {
              inheritedConcepts: concepts,
              previousOutput: output,
            });
            log(`    Extracted concepts for next gate`);
          } else {
            state = new SemanticState(circuit.prompt, { previousOutput: output });
          }
        }

        // Record final state
        state.text = circuit.prompt; // Keep original question
        state.history.push({ gate: gate.label, output });
      }

      runs.push({
        run: run + 1,
        gates: gateOutputs,
        finalOutput: gateOutputs[gateOutputs.length - 1].output,
      });
    }

    // Analysis
    log(`\n${"═".repeat(60)}`);
    log("ANALYSIS");
    log("═".repeat(60));

    const finalOutputs = runs.map(r => r.finalOutput);
    const freq = Analysis.wordFrequency(finalOutputs);
    const uniqueWords = Object.keys(freq).length;
    const topWords = Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 15);

    log(`  Unique words across ${n} runs: ${uniqueWords}`);
    log(`  Top words: ${topWords.map(([w, c]) => `${w}(${c})`).join(", ")}`);

    // Cross-run similarity (are runs diverse?)
    let totalSim = 0, simCount = 0;
    for (let i = 0; i < runs.length; i++) {
      for (let j = i + 1; j < runs.length; j++) {
        const fi = Analysis.wordFrequency(runs[i].finalOutput);
        const fj = Analysis.wordFrequency(runs[j].finalOutput);
        totalSim += Analysis.cosineSimilarity(fi, fj);
        simCount++;
      }
    }
    const avgCrossRunSim = simCount > 0 ? totalSim / simCount : 0;
    log(`  Avg cross-run similarity: ${avgCrossRunSim.toFixed(3)} (lower = more diverse)`);

    // Gate-by-gate transformation
    if (circuit.gates.length > 1) {
      log(`\n  Gate-by-gate transformation:`);
      for (const run of runs) {
        const sims = [];
        for (let i = 1; i < run.gates.length; i++) {
          const fi = Analysis.wordFrequency(run.gates[i - 1].output);
          const fj = Analysis.wordFrequency(run.gates[i].output);
          sims.push(Analysis.cosineSimilarity(fi, fj).toFixed(3));
        }
        log(`    Run ${run.run}: ${sims.map((s, i) => `G${i + 1}→G${i + 2}: ${s}`).join(" | ")}`);
      }
    }

    return {
      circuit: circuit.name,
      n,
      runs,
      analysis: {
        uniqueWords,
        topWords,
        avgCrossRunSimilarity: avgCrossRunSim,
        finalOutputs,
      },
    };
  }

  /**
   * Run a circuit AND a control (no circuit) for comparison.
   */
  async runWithControl(circuit, options = {}) {
    const n = options.n || 5;

    // Run control
    const log = this.verbose ? (...args) => console.log(...args) : () => {};
    log(`\n${"═".repeat(60)}`);
    log("CONTROL: Single prompt, no circuit");
    log("═".repeat(60));

    const controlResponses = [];
    for (let i = 0; i < n; i++) {
      const resp = await this._sample(
        "You are a creative, multidisciplinary thinker.",
        circuit.prompt
      );
      controlResponses.push(resp);
      log(`  ${i + 1}. "${resp.substring(0, 100)}..."`);
    }

    // Run circuit
    const circuitResults = await this.run(circuit, options);

    // Compare
    const controlFreq = Analysis.wordFrequency(controlResponses);
    const circuitFreq = Analysis.wordFrequency(circuitResults.analysis.finalOutputs);
    const sim = Analysis.cosineSimilarity(controlFreq, circuitFreq);

    const controlWords = new Set(Object.keys(controlFreq));
    const circuitWords = new Set(Object.keys(circuitFreq));
    const circuitOnly = [...circuitWords].filter(w => !controlWords.has(w));

    log(`\n${"═".repeat(60)}`);
    log("CIRCUIT vs CONTROL");
    log("═".repeat(60));
    log(`  Similarity: ${sim.toFixed(3)} (lower = more different)`);
    log(`  Circuit-only words: ${circuitOnly.length}`);
    log(`  ${sim < 0.5 ? "✅ QUALITATIVELY DIFFERENT" : "⚠️  Similar to control"}`);

    return {
      ...circuitResults,
      control: {
        responses: controlResponses,
        uniqueWords: controlWords.size,
      },
      comparison: {
        similarity: sim,
        circuitOnlyWords: circuitOnly.slice(0, 30),
        qualitativelyDifferent: sim < 0.5,
      },
    };
  }
}

// ═══════════════════════════════════════════════════════════
// CONVENIENCE: Quick circuit builders
// ═══════════════════════════════════════════════════════════

export function interfere(persona1, persona2, alpha = 0.5) {
  return new InterferenceGate(persona1, persona2, alpha);
}

export function context(persona) {
  return new ContextGate(persona);
}

export function meta(belief1, belief2) {
  return new MetaGate(belief1, belief2);
}

export function circuit(name) {
  return new SemanticCircuit(name);
}

export function runner(options = {}) {
  return new Runner(options);
}
