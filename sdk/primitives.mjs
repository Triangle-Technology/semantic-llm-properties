/**
 * SEMANTIC COMPUTING — Primitive Operations
 *
 * The 5 fundamental semantic operations, implemented as first-class functions.
 * Each returns an enriched SemanticState with CAS metadata and trace.
 *
 * Operations:
 *   SUPERPOSE  → Hold concept in multiple frames simultaneously
 *   INTERFERE  → Two frames interact → emergence
 *   REFRAME    → Shift perspective through a new lens
 *   SYNTHESIZE → Combine multiple states into coherent whole
 *   VALIDATE   → Check coherence and stability
 *
 * Usage:
 *   import { superpose, interfere, reframe, synthesize, validate } from './primitives.mjs'
 *
 *   const frames = await superpose("justice", ["legal scholar", "activist", "philosopher"])
 *   const emerged = await interfere(frames[0], frames[1], "justice")
 *   const shifted = await reframe(emerged, "through the lens of a child")
 *   const result = await synthesize([shifted, frames[2]], "create actionable insight")
 *   const verified = await validate(result, { minCAS: 0.3 })
 */

import { SemanticState } from "./semantic.mjs";
import { createClient } from "./router.mjs";
import { wordFrequency, cosineSimilarity } from "./analysis.mjs";

const DEFAULT_MODEL = "claude-haiku-4-5-20251001";
const DEFAULT_MAX_TOKENS = 200;
const DEFAULT_TEMPERATURE = 1.0;

// ═══════════════════════════════════════════════════════════
// SUPERPOSE — Hold concept in multiple frames
// ═══════════════════════════════════════════════════════════

/**
 * Generate responses from multiple perspective frames simultaneously.
 * Returns an array of SemanticStates, one per frame.
 *
 * @param {string} concept - The concept or question
 * @param {string[]} frames - Array of persona/perspective descriptions
 * @param {Object} [options]
 * @param {number} [options.n=5] - Samples per frame
 * @param {string} [options.model]
 * @returns {Promise<SemanticState[]>}
 */
export async function superpose(concept, frames, options = {}) {
  const n = options.n ?? 5;
  const model = options.model ?? DEFAULT_MODEL;
  const maxTokens = options.maxTokens ?? DEFAULT_MAX_TOKENS;
  const client = createClient(model);

  const states = [];

  for (const frame of frames) {
    const systemPrompt = `You are ${frame}.`;
    const responses = await client.sampleN(systemPrompt, concept, n, {
      maxTokens,
      temperature: DEFAULT_TEMPERATURE,
    });

    // Use the most representative response (closest to centroid)
    const freqs = responses.map((r) => wordFrequency([r]));
    const centroid = wordFrequency(responses);
    let bestIdx = 0;
    let bestSim = -1;
    for (let i = 0; i < responses.length; i++) {
      const sim = cosineSimilarity(freqs[i], centroid);
      if (sim > bestSim) {
        bestSim = sim;
        bestIdx = i;
      }
    }

    const state = new SemanticState(responses[bestIdx], {
      frame,
      allResponses: responses,
      representativeness: +bestSim.toFixed(4),
    });
    state.addTrace({
      operation: "SUPERPOSE",
      frame,
      concept,
      nSamples: n,
      model,
    });

    states.push(state);
  }

  return states;
}

// ═══════════════════════════════════════════════════════════
// INTERFERE — Two frames interact → emergence
// ═══════════════════════════════════════════════════════════

/**
 * Create interference between two semantic states or frames.
 * The combined output contains emergent content not present in either input.
 *
 * @param {SemanticState|string} state1 - First state or frame description
 * @param {SemanticState|string} state2 - Second state or frame description
 * @param {string} concept - The concept or question to apply interference to
 * @param {Object} [options]
 * @param {number} [options.n=5]
 * @param {number} [options.alpha=0.5] - Mixing ratio (0=state2, 1=state1)
 * @param {string} [options.model]
 * @returns {Promise<SemanticState>}
 */
export async function interfere(state1, state2, concept, options = {}) {
  const n = options.n ?? 5;
  const alpha = options.alpha ?? 0.5;
  const model = options.model ?? DEFAULT_MODEL;
  const maxTokens = options.maxTokens ?? DEFAULT_MAX_TOKENS;
  const client = createClient(model);

  const frame1 =
    state1 instanceof SemanticState ? state1.metadata.frame : state1;
  const frame2 =
    state2 instanceof SemanticState ? state2.metadata.frame : state2;

  // Build interference prompt
  let systemPrompt;
  if (alpha >= 0.7) {
    systemPrompt = `You are primarily ${frame1} (${Math.round(alpha * 100)}%), with some perspective from ${frame2} (${Math.round((1 - alpha) * 100)}%). The first perspective dominates your worldview.`;
  } else if (alpha <= 0.3) {
    systemPrompt = `You are primarily ${frame2} (${Math.round((1 - alpha) * 100)}%), with some perspective from ${frame1} (${Math.round(alpha * 100)}%). The second perspective dominates your worldview.`;
  } else {
    systemPrompt = `You are simultaneously ${frame1} AND ${frame2}. Hold both perspectives with equal weight. Let them interact and create something neither could alone.`;
  }

  const responses = await client.sampleN(systemPrompt, concept, n, {
    maxTokens,
    temperature: DEFAULT_TEMPERATURE,
  });

  // Pick most representative
  const centroid = wordFrequency(responses);
  let bestIdx = 0;
  let bestSim = -1;
  for (let i = 0; i < responses.length; i++) {
    const sim = cosineSimilarity(wordFrequency([responses[i]]), centroid);
    if (sim > bestSim) {
      bestSim = sim;
      bestIdx = i;
    }
  }

  const state = new SemanticState(responses[bestIdx], {
    frame: `${frame1} × ${frame2}`,
    allResponses: responses,
    alpha,
    parentFrames: [frame1, frame2],
  });
  state.addTrace({
    operation: "INTERFERE",
    frames: [frame1, frame2],
    alpha,
    concept,
    nSamples: n,
    model,
  });

  return state;
}

// ═══════════════════════════════════════════════════════════
// REFRAME — Shift perspective through a new lens
// ═══════════════════════════════════════════════════════════

/**
 * Take an existing semantic state and reframe it through a new lens.
 * This is a transformation: the input meaning is reshaped, not replaced.
 *
 * @param {SemanticState|string} state - Input state or text
 * @param {string} lens - The new perspective (e.g., "through the lens of a child")
 * @param {Object} [options]
 * @param {number} [options.n=5]
 * @param {string} [options.model]
 * @returns {Promise<SemanticState>}
 */
export async function reframe(state, lens, options = {}) {
  const n = options.n ?? 5;
  const model = options.model ?? DEFAULT_MODEL;
  const maxTokens = options.maxTokens ?? DEFAULT_MAX_TOKENS;
  const client = createClient(model);

  const inputText = state instanceof SemanticState ? state.text : state;

  const systemPrompt = `You are ${lens}. You have been given a perspective from someone else. Don't just summarize it — let it pass through YOUR worldview and transform it. What does this become when seen through your eyes?`;
  const userPrompt = `Here is the perspective to reframe:\n\n"${inputText}"\n\nReframe this through your unique lens. Create something the original perspective couldn't see.`;

  const responses = await client.sampleN(systemPrompt, userPrompt, n, {
    maxTokens,
    temperature: DEFAULT_TEMPERATURE,
  });

  // Pick most representative
  const centroid = wordFrequency(responses);
  let bestIdx = 0;
  let bestSim = -1;
  for (let i = 0; i < responses.length; i++) {
    const sim = cosineSimilarity(wordFrequency([responses[i]]), centroid);
    if (sim > bestSim) {
      bestSim = sim;
      bestIdx = i;
    }
  }

  const newState = new SemanticState(responses[bestIdx], {
    frame: lens,
    allResponses: responses,
    reframedFrom: inputText.substring(0, 100),
  });

  // Inherit trace from parent
  if (state instanceof SemanticState) {
    newState.trace = [...state.trace];
  }
  newState.addTrace({
    operation: "REFRAME",
    lens,
    inputPreview: inputText.substring(0, 80),
    nSamples: n,
    model,
  });

  return newState;
}

// ═══════════════════════════════════════════════════════════
// SYNTHESIZE — Combine multiple states into coherent whole
// ═══════════════════════════════════════════════════════════

/**
 * Synthesize multiple semantic states into a unified output.
 * Extracts key concepts from each state and asks the model to create a coherent synthesis.
 *
 * @param {(SemanticState|string)[]} states - Array of states to synthesize
 * @param {string} [constraints] - Optional constraint or goal for synthesis
 * @param {Object} [options]
 * @param {number} [options.n=5]
 * @param {string} [options.model]
 * @returns {Promise<SemanticState>}
 */
export async function synthesize(states, constraints = "", options = {}) {
  const n = options.n ?? 5;
  const model = options.model ?? DEFAULT_MODEL;
  const maxTokens = options.maxTokens ?? 300;
  const client = createClient(model);

  const texts = states.map((s) =>
    s instanceof SemanticState ? s.text : s
  );

  const perspectives = texts
    .map((t, i) => `Perspective ${i + 1}: "${t}"`)
    .join("\n\n");

  const systemPrompt = `You are a master synthesizer. You find the deeper pattern that connects seemingly different perspectives. You don't compromise or average — you find the higher truth that contains all views.`;
  const userPrompt = `Synthesize these perspectives into a coherent, unified insight:\n\n${perspectives}${constraints ? `\n\nConstraint: ${constraints}` : ""}\n\nCreate a synthesis that transcends the individual perspectives. Be specific and vivid.`;

  const responses = await client.sampleN(systemPrompt, userPrompt, n, {
    maxTokens,
    temperature: DEFAULT_TEMPERATURE,
  });

  // Pick most representative
  const centroid = wordFrequency(responses);
  let bestIdx = 0;
  let bestSim = -1;
  for (let i = 0; i < responses.length; i++) {
    const sim = cosineSimilarity(wordFrequency([responses[i]]), centroid);
    if (sim > bestSim) {
      bestSim = sim;
      bestIdx = i;
    }
  }

  const newState = new SemanticState(responses[bestIdx], {
    frame: "synthesis",
    allResponses: responses,
    sourceCount: states.length,
    constraints: constraints || null,
  });

  // Merge traces from all parent states
  const mergedTrace = [];
  for (const s of states) {
    if (s instanceof SemanticState && s.trace) {
      mergedTrace.push(...s.trace);
    }
  }
  newState.trace = mergedTrace;
  newState.addTrace({
    operation: "SYNTHESIZE",
    sourceCount: states.length,
    constraints: constraints || null,
    nSamples: n,
    model,
  });

  return newState;
}

// ═══════════════════════════════════════════════════════════
// VALIDATE — Check coherence and stability
// ═══════════════════════════════════════════════════════════

/**
 * Validate a semantic state by checking if it maintains coherence
 * when probed from multiple angles.
 *
 * Generates N paraphrases/interpretations of the state and measures
 * how consistent they are (high consistency = high coherence).
 *
 * @param {SemanticState|string} state - State to validate
 * @param {Object} [options]
 * @param {number} [options.n=5]
 * @param {number} [options.minCoherence=0.3] - Minimum acceptable coherence
 * @param {string} [options.model]
 * @returns {Promise<{state: SemanticState, coherence: number, passed: boolean}>}
 */
export async function validate(state, options = {}) {
  const n = options.n ?? 5;
  const minCoherence = options.minCoherence ?? 0.3;
  const model = options.model ?? DEFAULT_MODEL;
  const client = createClient(model);

  const inputText = state instanceof SemanticState ? state.text : state;

  // Generate interpretations from different angles
  const probes = [
    "Summarize the core insight in one sentence.",
    "What is the most important claim being made?",
    "If you had to explain this to a skeptic, what would you say?",
    "What does this imply for practical action?",
    "What assumption is this insight built on?",
  ];

  const interpretations = [];
  for (let i = 0; i < Math.min(n, probes.length); i++) {
    const resp = await client.sample(
      "You are a careful analytical thinker.",
      `Given this text:\n"${inputText}"\n\n${probes[i]}`,
      { maxTokens: 100, temperature: 0.7 }
    );
    interpretations.push(resp);
  }

  // Measure coherence: average pairwise similarity of interpretations
  let totalSim = 0;
  let pairs = 0;
  for (let i = 0; i < interpretations.length; i++) {
    for (let j = i + 1; j < interpretations.length; j++) {
      const fi = wordFrequency([interpretations[i]]);
      const fj = wordFrequency([interpretations[j]]);
      totalSim += cosineSimilarity(fi, fj);
      pairs++;
    }
  }
  const coherence = pairs > 0 ? totalSim / pairs : 0;
  const passed = coherence >= minCoherence;

  const resultState =
    state instanceof SemanticState ? state.clone() : new SemanticState(inputText);
  resultState.cas = +coherence.toFixed(4);
  resultState.phase = passed ? "stable" : "transitional";
  resultState.addTrace({
    operation: "VALIDATE",
    coherence: +coherence.toFixed(4),
    passed,
    minCoherence,
    nProbes: interpretations.length,
    model,
  });

  return {
    state: resultState,
    coherence: +coherence.toFixed(4),
    passed,
    interpretations,
  };
}
