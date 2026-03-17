/**
 * Experiment J2: Expanded CAS Validation
 *
 * Purpose: Expand CAS measurement from 8 to 20 concepts across more diverse domains.
 * Tests whether CAS metric generalizes beyond the original concept set.
 *
 * Original J: 8 concepts (money, water, love, death, mathematics, freedom, gravity, justice)
 * J2 adds 12 new concepts across domains: physical, abstract, emotional, social, temporal
 *
 * Uses OpenAI API (GPT-4o-mini) for cross-model validation of CAS.
 * Original J used Claude Haiku — if CAS measurements are consistent across models,
 * this strengthens CAS as a universal metric, not model-specific.
 */

import OpenAI from "openai";
import { writeFileSync } from "fs";

const client = new OpenAI();
const N_SAMPLES = 15;
const MODEL = "gpt-4o-mini";
const TEMPERATURE = 1.0;

const CONCEPTS = [
  // === ORIGINAL 8 (from Experiment J, for cross-model comparison) ===
  { concept: "money", ctx1: { name: "monk", system: "You are a Buddhist monk who has renounced material wealth." }, ctx2: { name: "banker", system: "You are a Wall Street investment banker." }, expected: "HIGH" },
  { concept: "love", ctx1: { name: "poet", system: "You are a romantic poet." }, ctx2: { name: "biologist", system: "You are an evolutionary biologist." }, expected: "LOW" },
  { concept: "death", ctx1: { name: "philosopher", system: "You are an existentialist philosopher." }, ctx2: { name: "doctor", system: "You are an emergency room doctor." }, expected: "LOW" },
  { concept: "freedom", ctx1: { name: "anarchist", system: "You are a political anarchist." }, ctx2: { name: "judge", system: "You are a Supreme Court judge." }, expected: "LOW" },
  { concept: "gravity", ctx1: { name: "poet", system: "You are a mystical poet." }, ctx2: { name: "physicist", system: "You are a theoretical physicist." }, expected: "HIGH" },
  { concept: "justice", ctx1: { name: "criminal", system: "You are a convicted criminal reflecting on the system." }, ctx2: { name: "victim", system: "You are a crime victim seeking closure." }, expected: "LOW" },
  { concept: "mathematics", ctx1: { name: "mystic", system: "You are a numerologist and mystic." }, ctx2: { name: "engineer", system: "You are a pragmatic software engineer." }, expected: "MEDIUM" },
  { concept: "water", ctx1: { name: "poet", system: "You are a nature poet." }, ctx2: { name: "chemist", system: "You are an analytical chemist." }, expected: "MEDIUM" },

  // === NEW 12 — diverse domains ===
  // Physical concepts
  { concept: "fire", ctx1: { name: "shaman", system: "You are a spiritual shaman who sees fire as sacred." }, ctx2: { name: "firefighter", system: "You are a veteran firefighter." }, expected: "MEDIUM" },
  { concept: "time", ctx1: { name: "physicist", system: "You are a theoretical physicist studying spacetime." }, ctx2: { name: "elder", system: "You are a 90-year-old reflecting on your life." }, expected: "LOW" },
  { concept: "light", ctx1: { name: "artist", system: "You are an impressionist painter obsessed with light." }, ctx2: { name: "engineer", system: "You are a fiber optics engineer." }, expected: "MEDIUM" },

  // Abstract concepts
  { concept: "truth", ctx1: { name: "journalist", system: "You are an investigative journalist." }, ctx2: { name: "philosopher", system: "You are a postmodern philosopher who questions objective truth." }, expected: "LOW" },
  { concept: "power", ctx1: { name: "activist", system: "You are a grassroots community activist." }, ctx2: { name: "ceo", system: "You are the CEO of a Fortune 500 company." }, expected: "LOW" },
  { concept: "beauty", ctx1: { name: "mathematician", system: "You are a mathematician who sees beauty in proofs." }, ctx2: { name: "surgeon", system: "You are a cosmetic surgeon." }, expected: "LOW" },

  // Social concepts
  { concept: "family", ctx1: { name: "orphan", system: "You grew up in foster care without a stable family." }, ctx2: { name: "patriarch", system: "You are the patriarch of a large traditional family." }, expected: "MEDIUM" },
  { concept: "war", ctx1: { name: "general", system: "You are a military general planning strategy." }, ctx2: { name: "refugee", system: "You are a refugee who lost everything to war." }, expected: "MEDIUM" },
  { concept: "home", ctx1: { name: "nomad", system: "You are a digital nomad who hasn't had a fixed address in years." }, ctx2: { name: "architect", system: "You are a residential architect." }, expected: "MEDIUM" },

  // Emotional concepts
  { concept: "fear", ctx1: { name: "psychologist", system: "You are a clinical psychologist specializing in anxiety." }, ctx2: { name: "soldier", system: "You are a combat veteran." }, expected: "LOW" },
  { concept: "hope", ctx1: { name: "oncologist", system: "You are an oncologist who gives prognoses daily." }, ctx2: { name: "entrepreneur", system: "You are a serial entrepreneur on your fourth startup." }, expected: "LOW" },
  { concept: "silence", ctx1: { name: "monk", system: "You are a Trappist monk who practices silence." }, ctx2: { name: "interrogator", system: "You are a police interrogator." }, expected: "LOW" },
];

// ============================================================
// ANALYSIS FUNCTIONS (same as Experiment J)
// ============================================================
function extractWords(text) {
  return text.toLowerCase().replace(/[^a-zA-Z\s]/g, "").split(/\s+/).filter(w => w.length > 2);
}

function wordFrequencyMap(responses) {
  const freq = {};
  for (const resp of responses) {
    const seen = new Set();
    for (const w of extractWords(resp)) {
      if (!seen.has(w)) { freq[w] = (freq[w] || 0) + 1; seen.add(w); }
    }
  }
  return freq;
}

function cosineSimilarity(freqA, freqB) {
  const all = new Set([...Object.keys(freqA), ...Object.keys(freqB)]);
  let dot = 0, magA = 0, magB = 0;
  for (const w of all) {
    const a = freqA[w] || 0, b = freqB[w] || 0;
    dot += a * b; magA += a * a; magB += b * b;
  }
  return magA && magB ? dot / (Math.sqrt(magA) * Math.sqrt(magB)) : 0;
}

function shannonEntropy(freq) {
  const total = Object.values(freq).reduce((s, v) => s + v, 0);
  if (total === 0) return 0;
  let h = 0;
  for (const count of Object.values(freq)) {
    const p = count / total;
    if (p > 0) h -= p * Math.log2(p);
  }
  return h;
}

function normalizedEntropy(freq) {
  const n = Object.keys(freq).length;
  if (n <= 1) return 0;
  return shannonEntropy(freq) / Math.log2(n);
}

// ============================================================
// API CALL
// ============================================================
async function generate(system, concept) {
  const response = await client.chat.completions.create({
    model: MODEL,
    temperature: TEMPERATURE,
    max_tokens: 50,
    messages: [
      ...(system ? [{ role: "system", content: system }] : []),
      { role: "user", content: `Explain ${concept} in exactly 5 words.` }
    ]
  });
  return response.choices[0].message.content.trim();
}

// ============================================================
// MAIN
// ============================================================
async function main() {
  console.log(`=== Experiment J2: Expanded CAS Validation ===`);
  console.log(`Model: ${MODEL}, N=${N_SAMPLES}, Concepts: ${CONCEPTS.length}`);
  console.log(`Total API calls: ~${CONCEPTS.length * 3 * N_SAMPLES}\n`);

  const results = [];

  for (const entry of CONCEPTS) {
    const { concept, ctx1, ctx2, expected } = entry;
    console.log(`\n--- ${concept} (${ctx1.name} vs ${ctx2.name}, expected: ${expected}) ---`);

    // Collect samples
    const baseline = [], context1 = [], context2 = [];
    for (let i = 0; i < N_SAMPLES; i++) {
      baseline.push(await generate(null, concept));
      context1.push(await generate(ctx1.system, concept));
      context2.push(await generate(ctx2.system, concept));
      if ((i + 1) % 5 === 0) console.log(`  ${i + 1}/${N_SAMPLES} samples...`);
    }

    // Calculate CAS
    const baselineFreq = wordFrequencyMap(baseline);
    const ctx1Freq = wordFrequencyMap(context1);
    const ctx2Freq = wordFrequencyMap(context2);

    const sim1 = cosineSimilarity(baselineFreq, ctx1Freq);
    const sim2 = cosineSimilarity(baselineFreq, ctx2Freq);
    const avgShift = ((1 - sim1) + (1 - sim2)) / 2;
    const contextResistance = 1 - avgShift;
    const baseEntropy = normalizedEntropy(baselineFreq);
    const CAS = contextResistance * (1 - baseEntropy);

    // Context Distance (cross-context similarity)
    const crossSim = cosineSimilarity(ctx1Freq, ctx2Freq);
    const CD = 1 - crossSim;

    const level = CAS > 0.5 ? "HIGH" : CAS > 0.25 ? "MEDIUM" : "LOW";
    const matchExpected = level === expected;

    console.log(`  CAS=${CAS.toFixed(3)} (${level}) | CD=${CD.toFixed(3)} | sim1=${sim1.toFixed(3)} sim2=${sim2.toFixed(3)} | match=${matchExpected ? "✓" : "✗"}`);

    results.push({
      concept,
      ctx1: ctx1.name,
      ctx2: ctx2.name,
      expected,
      CAS: +CAS.toFixed(3),
      CD: +CD.toFixed(3),
      level,
      matchExpected,
      sim1: +sim1.toFixed(3),
      sim2: +sim2.toFixed(3),
      baseEntropy: +baseEntropy.toFixed(3),
      contextResistance: +contextResistance.toFixed(3),
      samples: { baseline, context1, context2 }
    });
  }

  // Summary
  console.log("\n\n=== SUMMARY ===\n");
  console.log("Concept".padEnd(15) + "CAS".padEnd(8) + "Level".padEnd(8) + "CD".padEnd(8) + "Expected".padEnd(10) + "Match");
  console.log("-".repeat(55));
  for (const r of results) {
    console.log(
      r.concept.padEnd(15) +
      String(r.CAS).padEnd(8) +
      r.level.padEnd(8) +
      String(r.CD).padEnd(8) +
      r.expected.padEnd(10) +
      (r.matchExpected ? "✓" : "✗")
    );
  }

  const matches = results.filter(r => r.matchExpected).length;
  console.log(`\nPrediction accuracy: ${matches}/${results.length} (${(100 * matches / results.length).toFixed(0)}%)`);

  // Phase transition predictions for new concepts
  console.log("\n=== PHASE TRANSITION PREDICTIONS ===\n");
  for (const r of results) {
    const predicted = r.CAS < 0.4 && r.CD > 0.5 ? "TRANSITIONS" : "NO transitions";
    console.log(`${r.concept.padEnd(15)} CAS=${String(r.CAS).padEnd(8)} CD=${String(r.CD).padEnd(8)} → ${predicted}`);
  }

  // Save
  const output = {
    experiment: "J2",
    description: "Expanded CAS validation: 20 concepts (8 original + 12 new), GPT-4o-mini cross-model test",
    model: MODEL,
    date: new Date().toISOString(),
    n_concepts: results.length,
    n_samples: N_SAMPLES,
    total_calls: results.length * 3 * N_SAMPLES,
    results: results.map(r => ({ ...r, samples: undefined })), // exclude raw samples from summary
    raw_samples: results.map(r => ({ concept: r.concept, ...r.samples })),
    prediction_accuracy: `${matches}/${results.length}`
  };

  writeFileSync("experiments/results_j2_cas_expanded.json", JSON.stringify(output, null, 2));
  console.log("\nResults saved to experiments/results_j2_cas_expanded.json");
}

main().catch(console.error);
