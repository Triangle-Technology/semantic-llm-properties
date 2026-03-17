/**
 * SEMANTIC COMPUTING — Semantic Profiler
 *
 * Measures structural semantic properties of any concept:
 *   - CAS (Concept Attractor Strength): stability under contextual pressure
 *   - Phase transitions: where meaning shifts discontinuously
 *   - Interference classification: constructive, meta-constructive, or destructive
 *
 * Algorithms extracted from Experiments J2, E, H, D — all validated with data.
 *
 * Usage:
 *   import { measureCAS, detectPhaseTransitions, classifyInterference, profile } from './profiler.mjs'
 *
 *   const cas = await measureCAS("justice", [
 *     { name: "legal", system: "You are a Supreme Court judge." },
 *     { name: "social", system: "You are a community activist." }
 *   ])
 *   // → { CAS: 0.72, level: "HIGH", ... }
 */

import { createClient } from "./router.mjs";
import {
  wordFrequency,
  cosineSimilarity,
  normalizedEntropy,
  findEmergent,
  scoreWithMarkers,
  contradictionScore,
} from "./analysis.mjs";

// ═══════════════════════════════════════════════════════════
// DEFAULT CONFIGURATION
// ═══════════════════════════════════════════════════════════

const DEFAULTS = {
  n: 15,
  model: "claude-haiku-4-5-20251001",
  prompt: "Explain {concept} in exactly 5 words.",
  maxTokens: 50,
  temperature: 1.0,
  phaseSteps: [100, 80, 60, 50, 40, 20, 0],
  transitionThreshold: 0.15,
};

function makePrompt(template, concept) {
  return template.replace("{concept}", concept);
}

// ═══════════════════════════════════════════════════════════
// CAS MEASUREMENT (from Experiment J2)
// ═══════════════════════════════════════════════════════════

/**
 * Measure Concept Attractor Strength.
 *
 * CAS = ContextResistance × (1 - BaselineEntropy)
 * where ContextResistance = 1 - AvgShift
 * and AvgShift = average cosine distance from baseline to each context
 *
 * @param {string} concept - The concept to measure (e.g., "justice", "love")
 * @param {Array<{name: string, system: string}>} contexts - At least 2 contrasting contexts
 * @param {Object} [options]
 * @param {number} [options.n=15] - Samples per condition
 * @param {string} [options.model] - Model to use
 * @param {string} [options.prompt] - Prompt template ({concept} is replaced)
 * @param {Function} [options.onProgress] - Progress callback
 * @returns {Promise<Object>} CAS measurement result
 */
export async function measureCAS(concept, contexts, options = {}) {
  const n = options.n ?? DEFAULTS.n;
  const model = options.model ?? DEFAULTS.model;
  const promptTemplate = options.prompt ?? DEFAULTS.prompt;
  const onProgress = options.onProgress ?? null;
  const userPrompt = makePrompt(promptTemplate, concept);

  const client = createClient(model);

  const log = onProgress
    ? (msg) => onProgress(msg)
    : (msg) => process.stderr.write(msg + "\n");

  log(`[CAS] Measuring "${concept}" with ${contexts.length} contexts, n=${n}`);

  // 1. Baseline (no system prompt)
  log(`[CAS] Collecting baseline (${n} samples)...`);
  const baseline = await client.sampleN(null, userPrompt, n, {
    maxTokens: DEFAULTS.maxTokens,
    temperature: DEFAULTS.temperature,
  });

  // 2. Each context
  const contextResponses = [];
  for (const ctx of contexts) {
    log(`[CAS] Collecting context "${ctx.name}" (${n} samples)...`);
    const responses = await client.sampleN(ctx.system, userPrompt, n, {
      maxTokens: DEFAULTS.maxTokens,
      temperature: DEFAULTS.temperature,
    });
    contextResponses.push({ name: ctx.name, responses });
  }

  // 3. Calculate
  const baselineFreq = wordFrequency(baseline);
  const baseEntropy = normalizedEntropy(baselineFreq);

  const perContext = contextResponses.map((ctx) => {
    const ctxFreq = wordFrequency(ctx.responses);
    const sim = cosineSimilarity(baselineFreq, ctxFreq);
    const shift = 1 - sim;
    return {
      name: ctx.name,
      similarity: +sim.toFixed(4),
      shift: +shift.toFixed(4),
    };
  });

  const avgShift =
    perContext.reduce((sum, c) => sum + c.shift, 0) / perContext.length;
  const contextResistance = 1 - avgShift;
  const CAS = contextResistance * (1 - baseEntropy);

  // Cross-context distance (how different the contexts push vocabulary)
  const crossSims = [];
  for (let i = 0; i < contextResponses.length; i++) {
    for (let j = i + 1; j < contextResponses.length; j++) {
      const freqI = wordFrequency(contextResponses[i].responses);
      const freqJ = wordFrequency(contextResponses[j].responses);
      crossSims.push(cosineSimilarity(freqI, freqJ));
    }
  }
  const avgCrossSim =
    crossSims.length > 0
      ? crossSims.reduce((s, v) => s + v, 0) / crossSims.length
      : 0;
  const CD = 1 - avgCrossSim;

  const level = CAS > 0.5 ? "HIGH" : CAS > 0.25 ? "MEDIUM" : "LOW";

  // Phase transition prediction
  const phaseTransitionPredicted = CAS < 0.4 && CD > 0.5;

  const totalCalls = n * (1 + contexts.length);
  log(`[CAS] Done. CAS=${CAS.toFixed(3)} (${level}), CD=${CD.toFixed(3)}, ${totalCalls} API calls`);

  return {
    concept,
    model,
    CAS: +CAS.toFixed(4),
    level,
    contextResistance: +contextResistance.toFixed(4),
    baselineEntropy: +baseEntropy.toFixed(4),
    avgShift: +avgShift.toFixed(4),
    contextDistance: +CD.toFixed(4),
    phaseTransitionPredicted,
    perContext,
    apiCalls: totalCalls,
    raw: {
      baseline,
      contexts: contextResponses.map((c) => ({
        name: c.name,
        responses: c.responses,
      })),
    },
  };
}

// ═══════════════════════════════════════════════════════════
// PHASE TRANSITION DETECTION (from Experiments E, H)
// ═══════════════════════════════════════════════════════════

/**
 * Build a blended system prompt for two personas at a given mixing ratio.
 * Generalized from experiment_e's makeSystem().
 *
 * @param {number} pct1 - Percentage for persona1 (0-100)
 * @param {string} persona1 - First persona description
 * @param {string} persona2 - Second persona description
 * @returns {string} System prompt
 */
function makeBlendedPrompt(pct1, persona1, persona2) {
  const pct2 = 100 - pct1;
  if (pct1 === 100) return `You are ${persona1}.`;
  if (pct1 === 0) return `You are ${persona2}.`;
  if (pct1 >= 70)
    return `You are primarily ${persona1} (${pct1}%), with some perspective from ${persona2} (${pct2}%). The first perspective dominates your worldview.`;
  if (pct1 >= 40)
    return `You are simultaneously ${persona1} AND ${persona2}. Hold both perspectives with equal weight. Let them interact.`;
  if (pct1 >= 10)
    return `You are primarily ${persona2} (${pct2}%), with some perspective from ${persona1} (${pct1}%). The second perspective dominates your worldview.`;
  return `You are ${persona2}.`;
}

/**
 * Detect phase transitions by varying mixing ratio between two contexts.
 *
 * @param {string} concept
 * @param {{name: string, system: string, markers?: string[]}} ctx1
 * @param {{name: string, system: string, markers?: string[]}} ctx2
 * @param {Object} [options]
 * @param {number} [options.n=15] - Samples per ratio step
 * @param {number[]} [options.steps=[100,80,60,50,40,20,0]] - Mixing ratios
 * @param {number} [options.threshold=0.15] - Minimum jump to count as transition
 * @param {string} [options.model]
 * @returns {Promise<Object>}
 */
export async function detectPhaseTransitions(
  concept,
  ctx1,
  ctx2,
  options = {}
) {
  const n = options.n ?? DEFAULTS.n;
  const steps = options.steps ?? DEFAULTS.phaseSteps;
  const threshold = options.threshold ?? DEFAULTS.transitionThreshold;
  const model = options.model ?? DEFAULTS.model;
  const promptTemplate = options.prompt ?? DEFAULTS.prompt;
  const onProgress = options.onProgress ?? null;
  const userPrompt = makePrompt(promptTemplate, concept);

  const client = createClient(model);
  const log = onProgress
    ? (msg) => onProgress(msg)
    : (msg) => process.stderr.write(msg + "\n");

  log(`[Phase] Mapping "${concept}": ${ctx1.name} ↔ ${ctx2.name}, ${steps.length} steps`);

  // Build marker sets if provided
  const hasMarkers = ctx1.markers && ctx2.markers;
  const markerSets = hasMarkers
    ? {
        [ctx1.name]: new Set(ctx1.markers),
        [ctx2.name]: new Set(ctx2.markers),
      }
    : null;

  const dataPoints = [];

  for (const pct of steps) {
    const systemPrompt = makeBlendedPrompt(pct, ctx1.system, ctx2.system);
    log(`[Phase] Step ${pct}% ${ctx1.name} / ${100 - pct}% ${ctx2.name}...`);

    const responses = await client.sampleN(systemPrompt, userPrompt, n, {
      maxTokens: DEFAULTS.maxTokens,
      temperature: DEFAULTS.temperature,
    });

    const freq = wordFrequency(responses);
    const uniqueWords = Object.keys(freq).length;

    let dominance = null;
    if (markerSets) {
      const scored = scoreWithMarkers(responses, markerSets);
      dominance = {
        scores: scored.scores,
        ratios: scored.ratios,
        ctx1Ratio: scored.ratios[ctx1.name] ?? 0,
      };
    }

    dataPoints.push({
      ratio: pct,
      responses,
      uniqueWords,
      dominance,
    });
  }

  // Detect transitions
  const transitions = [];
  const dominanceKey = hasMarkers ? "ctx1Ratio" : null;

  if (dominanceKey) {
    for (let i = 1; i < dataPoints.length; i++) {
      const prev = dataPoints[i - 1].dominance.ctx1Ratio;
      const curr = dataPoints[i].dominance.ctx1Ratio;
      const diff = Math.abs(curr - prev);
      if (diff > threshold) {
        transitions.push({
          fromRatio: dataPoints[i - 1].ratio,
          toRatio: dataPoints[i].ratio,
          magnitude: +diff.toFixed(4),
          fromDominance: +prev.toFixed(4),
          toDominance: +curr.toFixed(4),
        });
      }
    }
  }

  // Find interference zone (where unique words peak)
  const maxUnique = Math.max(...dataPoints.map((d) => d.uniqueWords));
  const peakPoints = dataPoints.filter(
    (d) => d.uniqueWords >= maxUnique * 0.9
  );
  const interferenceZone =
    peakPoints.length > 0
      ? {
          from: Math.min(...peakPoints.map((d) => d.ratio)),
          to: Math.max(...peakPoints.map((d) => d.ratio)),
          peakUniqueWords: maxUnique,
        }
      : null;

  const totalCalls = steps.length * n;
  log(`[Phase] Done. ${transitions.length} transitions found, ${totalCalls} API calls`);

  return {
    concept,
    model,
    ctx1: ctx1.name,
    ctx2: ctx2.name,
    steps: dataPoints.map((d) => ({
      ratio: d.ratio,
      uniqueWords: d.uniqueWords,
      dominance: d.dominance,
    })),
    transitions,
    interferenceZone,
    hasTransitions: transitions.length > 0,
    apiCalls: totalCalls,
  };
}

// ═══════════════════════════════════════════════════════════
// INTERFERENCE CLASSIFICATION (from Experiment H)
// ═══════════════════════════════════════════════════════════

/**
 * Classify interference between two contexts as:
 *   - constructive: emergent words appear, combined ≠ average
 *   - meta-constructive: opposition triggers elevation (Type-M specific)
 *   - destructive: combined output simpler than individuals
 *   - mixed: doesn't fit cleanly into above categories
 *
 * @param {string} concept
 * @param {{name: string, system: string}} ctx1
 * @param {{name: string, system: string}} ctx2
 * @param {Object} [options]
 * @param {number} [options.n=15]
 * @param {string} [options.model]
 * @returns {Promise<Object>}
 */
export async function classifyInterference(concept, ctx1, ctx2, options = {}) {
  const n = options.n ?? DEFAULTS.n;
  const model = options.model ?? DEFAULTS.model;
  const promptTemplate = options.prompt ?? DEFAULTS.prompt;
  const onProgress = options.onProgress ?? null;
  const userPrompt = makePrompt(promptTemplate, concept);

  const client = createClient(model);
  const log = onProgress
    ? (msg) => onProgress(msg)
    : (msg) => process.stderr.write(msg + "\n");

  log(`[Interference] "${concept}": ${ctx1.name} × ${ctx2.name}`);

  // Run three conditions
  log(`[Interference] Condition 1: ${ctx1.name} alone...`);
  const resp1 = await client.sampleN(ctx1.system, userPrompt, n, {
    maxTokens: DEFAULTS.maxTokens,
    temperature: DEFAULTS.temperature,
  });

  log(`[Interference] Condition 2: ${ctx2.name} alone...`);
  const resp2 = await client.sampleN(ctx2.system, userPrompt, n, {
    maxTokens: DEFAULTS.maxTokens,
    temperature: DEFAULTS.temperature,
  });

  log(`[Interference] Condition 3: combined...`);
  const combinedSystem = `You are simultaneously ${ctx1.system.replace(/^You are /, "")} AND ${ctx2.system.replace(/^You are /, "")}. Hold both perspectives with equal weight. Let them interact and create something neither could alone.`;
  const respCombined = await client.sampleN(combinedSystem, userPrompt, n, {
    maxTokens: DEFAULTS.maxTokens,
    temperature: DEFAULTS.temperature,
  });

  // Analysis
  const freq1 = wordFrequency(resp1);
  const freq2 = wordFrequency(resp2);
  const freqCombined = wordFrequency(respCombined);

  // Average frequency of individual conditions
  const freqAvg = {};
  const allWords = new Set([
    ...Object.keys(freq1),
    ...Object.keys(freq2),
  ]);
  for (const w of allWords) {
    freqAvg[w] = ((freq1[w] || 0) + (freq2[w] || 0)) / 2;
  }

  const simCombinedAvg = cosineSimilarity(freqCombined, freqAvg);
  const emergentWords = findEmergent(respCombined, resp1, resp2);

  // Unique word counts
  const uniqueWords1 = Object.keys(freq1).length;
  const uniqueWords2 = Object.keys(freq2).length;
  const uniqueWordsCombined = Object.keys(freqCombined).length;
  const uniqueRatio =
    uniqueWordsCombined / Math.max(uniqueWords1, uniqueWords2);

  // Meta-constructive detection
  const cScore = contradictionScore(respCombined);

  // Classify
  let type;
  if (uniqueRatio < 0.8) {
    type = "destructive";
  } else if (uniqueRatio >= 1.0 || cScore > n * 0.5) {
    type = "meta-constructive";
  } else if (emergentWords.length >= 2 && simCombinedAvg < 0.85) {
    type = "constructive";
  } else {
    type = "mixed";
  }

  const totalCalls = 3 * n;
  log(`[Interference] Done. Type: ${type}, ${emergentWords.length} emergent words, ${totalCalls} API calls`);

  return {
    concept,
    model,
    ctx1: ctx1.name,
    ctx2: ctx2.name,
    type,
    emergentWords: emergentWords.slice(0, 20),
    simCombinedAvg: +simCombinedAvg.toFixed(4),
    uniqueRatio: +uniqueRatio.toFixed(4),
    contradictionScore: cScore,
    uniqueWords: {
      ctx1: uniqueWords1,
      ctx2: uniqueWords2,
      combined: uniqueWordsCombined,
    },
    apiCalls: totalCalls,
    raw: {
      ctx1: resp1,
      ctx2: resp2,
      combined: respCombined,
    },
  };
}

// ═══════════════════════════════════════════════════════════
// FULL PROFILE (all-in-one)
// ═══════════════════════════════════════════════════════════

/**
 * Generate a complete semantic profile for a concept.
 * Runs CAS measurement, phase transition detection, and interference classification.
 *
 * @param {string} concept
 * @param {Object} options
 * @param {Array<{name: string, system: string, markers?: string[]}>} options.contexts - At least 2
 * @param {number} [options.n=15]
 * @param {string} [options.model]
 * @param {boolean} [options.skipPhase=false] - Skip phase detection (saves API calls)
 * @param {boolean} [options.skipInterference=false] - Skip interference classification
 * @param {Function} [options.onProgress]
 * @returns {Promise<Object>}
 */
export async function profile(concept, options = {}) {
  const contexts = options.contexts;
  if (!contexts || contexts.length < 2) {
    throw new Error("profile() requires at least 2 contexts");
  }

  const n = options.n ?? DEFAULTS.n;
  const model = options.model ?? DEFAULTS.model;
  const onProgress = options.onProgress ?? null;
  const log = onProgress
    ? (msg) => onProgress(msg)
    : (msg) => process.stderr.write(msg + "\n");

  log(`\n${"═".repeat(60)}`);
  log(`SEMANTIC PROFILE: "${concept}"`);
  log(`Model: ${model} | Contexts: ${contexts.map((c) => c.name).join(", ")} | n=${n}`);
  log("═".repeat(60));

  // 1. CAS
  log("\n── Phase 1: CAS Measurement ──");
  const cas = await measureCAS(concept, contexts, { n, model, onProgress });

  // 2. Phase transitions (between first two contexts)
  let phase = null;
  if (!options.skipPhase) {
    log("\n── Phase 2: Phase Transition Detection ──");
    phase = await detectPhaseTransitions(concept, contexts[0], contexts[1], {
      n,
      model,
      onProgress,
    });
  }

  // 3. Interference (between first two contexts)
  let interference = null;
  if (!options.skipInterference) {
    log("\n── Phase 3: Interference Classification ──");
    interference = await classifyInterference(
      concept,
      contexts[0],
      contexts[1],
      { n, model, onProgress }
    );
  }

  // Summary
  const totalCalls =
    cas.apiCalls + (phase?.apiCalls ?? 0) + (interference?.apiCalls ?? 0);

  const summary = [
    `Concept: "${concept}"`,
    `CAS: ${cas.CAS} (${cas.level})`,
    `Context Resistance: ${cas.contextResistance}`,
    `Context Distance: ${cas.contextDistance}`,
    `Phase Transition Predicted: ${cas.phaseTransitionPredicted ? "YES" : "NO"}`,
    phase
      ? `Phase Transitions Found: ${phase.transitions.length} (${phase.transitions.map((t) => `${t.fromRatio}→${t.toRatio}%`).join(", ") || "none"})`
      : null,
    interference ? `Interference Type: ${interference.type}` : null,
    interference
      ? `Emergent Words: ${interference.emergentWords.length} (${interference.emergentWords.slice(0, 5).map((e) => e.word).join(", ")})`
      : null,
    `Total API Calls: ${totalCalls}`,
  ]
    .filter(Boolean)
    .join("\n");

  log(`\n${"═".repeat(60)}`);
  log("SUMMARY");
  log("═".repeat(60));
  log(summary);

  return {
    concept,
    model,
    timestamp: new Date().toISOString(),
    cas,
    phaseTransitions: phase,
    interference,
    summary,
    totalApiCalls: totalCalls,
  };
}

// ═══════════════════════════════════════════════════════════
// BUILT-IN CONCEPT DEFINITIONS (from Experiment J2)
// ═══════════════════════════════════════════════════════════

/**
 * Pre-defined concepts with contrasting contexts.
 * Extracted from Experiment J2 — validated on both Claude and GPT.
 */
export const KNOWN_CONCEPTS = {
  money: {
    contexts: [
      { name: "monk", system: "You are a Buddhist monk who has renounced material wealth." },
      { name: "banker", system: "You are a Wall Street investment banker." },
    ],
    expectedCAS: "HIGH",
  },
  love: {
    contexts: [
      { name: "poet", system: "You are a romantic poet." },
      { name: "biologist", system: "You are an evolutionary biologist." },
    ],
    markers: {
      poet: ["hearts", "heart", "soul", "souls", "flame", "eternal", "dance", "transcend", "bloom", "burning", "starlight", "stardust", "dreams", "beauty", "sacred"],
      biologist: ["genes", "genetic", "survival", "chemical", "bonding", "reproductive", "evolution", "cooperation", "adaptive", "oxytocin", "neurons", "biology", "species", "selection"],
    },
    expectedCAS: "LOW",
  },
  justice: {
    contexts: [
      { name: "criminal", system: "You are a convicted criminal reflecting on the system." },
      { name: "victim", system: "You are a crime victim seeking closure." },
    ],
    expectedCAS: "LOW",
  },
  gravity: {
    contexts: [
      { name: "poet", system: "You are a mystical poet." },
      { name: "physicist", system: "You are a theoretical physicist." },
    ],
    expectedCAS: "HIGH",
  },
  truth: {
    contexts: [
      { name: "journalist", system: "You are an investigative journalist." },
      { name: "philosopher", system: "You are a postmodern philosopher who questions objective truth." },
    ],
    expectedCAS: "LOW",
  },
  time: {
    contexts: [
      { name: "physicist", system: "You are a theoretical physicist studying spacetime." },
      { name: "elder", system: "You are a 90-year-old reflecting on your life." },
    ],
    expectedCAS: "LOW",
  },
  home: {
    contexts: [
      { name: "nomad", system: "You are a digital nomad who hasn't had a fixed address in years." },
      { name: "architect", system: "You are a residential architect." },
    ],
    expectedCAS: "MEDIUM",
  },
  silence: {
    contexts: [
      { name: "monk", system: "You are a Trappist monk who practices silence." },
      { name: "interrogator", system: "You are a police interrogator." },
    ],
    expectedCAS: "LOW",
  },
};
