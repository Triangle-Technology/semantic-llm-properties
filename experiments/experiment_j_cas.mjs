/**
 * EXPERIMENT J: Concept Attractor Strength (CAS) Formalization
 *
 * Measures the "semantic mass" of concepts — how resistant they are
 * to being reshaped by context operators.
 *
 * Two complementary metrics:
 * 1. Context Resistance (CR): How much does output change when context is applied?
 * 2. Baseline Entropy (H): How diverse is output without any context?
 *
 * CAS = f(CR, H) — high CR + low H = high CAS (concept is "rigid")
 *
 * Tests 8 concepts spanning a wide range of expected CAS values.
 */

import Anthropic from "@anthropic-ai/sdk";
import { writeFileSync } from "fs";

const client = new Anthropic();
const N = 15; // samples per condition
const TEMPERATURE = 1.0;

// ─── Concepts to measure ───

const CONCEPTS = [
  {
    id: "money",
    prompt: "Explain money in exactly 5 words.",
    contexts: [
      { name: "Monk", system: "You are a Buddhist monk." },
      { name: "Banker", system: "You are a Wall Street investment banker." },
    ],
    expectedCAS: "HIGH",
  },
  {
    id: "water",
    prompt: "Explain water in exactly 5 words.",
    contexts: [
      { name: "Poet", system: "You are a romantic poet." },
      { name: "Chemist", system: "You are an analytical chemist." },
    ],
    expectedCAS: "HIGH",
  },
  {
    id: "love",
    prompt: "Explain love in exactly 5 words.",
    contexts: [
      { name: "Poet", system: "You are a romantic poet." },
      { name: "Biologist", system: "You are an evolutionary biologist." },
    ],
    expectedCAS: "LOW",
  },
  {
    id: "death",
    prompt: "Explain death in exactly 5 words.",
    contexts: [
      { name: "Philosopher", system: "You are an existentialist philosopher." },
      { name: "Doctor", system: "You are an emergency room doctor." },
    ],
    expectedCAS: "LOW",
  },
  {
    id: "mathematics",
    prompt: "Explain mathematics in exactly 5 words.",
    contexts: [
      { name: "Mystic", system: "You are a spiritual mystic." },
      { name: "Engineer", system: "You are a practical engineer." },
    ],
    expectedCAS: "MEDIUM",
  },
  {
    id: "freedom",
    prompt: "Explain freedom in exactly 5 words.",
    contexts: [
      { name: "Anarchist", system: "You are a political anarchist." },
      { name: "Judge", system: "You are a conservative supreme court judge." },
    ],
    expectedCAS: "LOW",
  },
  {
    id: "gravity",
    prompt: "Explain gravity in exactly 5 words.",
    contexts: [
      { name: "Poet", system: "You are a romantic poet." },
      { name: "Physicist", system: "You are a theoretical physicist." },
    ],
    expectedCAS: "HIGH",
  },
  {
    id: "justice",
    prompt: "Explain justice in exactly 5 words.",
    contexts: [
      { name: "Criminal", system: "You are a convicted criminal." },
      { name: "Victim", system: "You are a crime victim seeking justice." },
    ],
    expectedCAS: "LOW",
  },
];

// ─── Helpers ───

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

async function sample(systemPrompt, userPrompt) {
  const params = {
    model: "claude-haiku-4-5-20251001",
    max_tokens: 30,
    temperature: TEMPERATURE,
    messages: [{ role: "user", content: userPrompt }],
  };
  if (systemPrompt) params.system = systemPrompt;

  const response = await client.messages.create(params);
  return response.content[0].text.trim();
}

// ─── Main ───

async function measureConcept(concept) {
  console.log(`\n${"═".repeat(60)}`);
  console.log(`CONCEPT: "${concept.id}" (expected CAS: ${concept.expectedCAS})`);
  console.log("═".repeat(60));

  // 1. Baseline — no context
  console.log("\n  [BASELINE — no context]");
  const baselineResponses = [];
  for (let i = 0; i < N; i++) {
    const resp = await sample(null, concept.prompt);
    baselineResponses.push(resp);
    process.stdout.write(`    ${i + 1}. "${resp.substring(0, 50)}"\n`);
  }
  const baselineFreq = wordFrequencyMap(baselineResponses);
  const baselineUniqueWords = Object.keys(baselineFreq).length;
  const baselineEntropy = normalizedEntropy(baselineFreq);

  // 2. With each context
  const contextResults = [];
  for (const ctx of concept.contexts) {
    console.log(`\n  [CONTEXT: ${ctx.name}]`);
    const responses = [];
    for (let i = 0; i < N; i++) {
      const resp = await sample(ctx.system, concept.prompt);
      responses.push(resp);
      process.stdout.write(`    ${i + 1}. "${resp.substring(0, 50)}"\n`);
    }
    const freq = wordFrequencyMap(responses);
    const sim = cosineSimilarity(baselineFreq, freq);
    const uniqueWords = Object.keys(freq).length;
    const entropy = normalizedEntropy(freq);

    contextResults.push({
      name: ctx.name,
      responses,
      uniqueWords,
      entropy,
      simToBaseline: sim,
      shift: 1 - sim,
    });

    console.log(`    → Unique words: ${uniqueWords}`);
    console.log(`    → Sim to baseline: ${sim.toFixed(3)}`);
    console.log(`    → Shift (1-sim): ${(1 - sim).toFixed(3)}`);
  }

  // 3. Cross-context similarity
  const crossSim = cosineSimilarity(
    wordFrequencyMap(contextResults[0].responses),
    wordFrequencyMap(contextResults[1].responses)
  );

  // 4. Calculate CAS
  const avgShift = contextResults.reduce((s, r) => s + r.shift, 0) / contextResults.length;
  const contextResistance = 1 - avgShift; // high = resistant
  const CAS = contextResistance * (1 - baselineEntropy); // resistant + low entropy = high CAS

  console.log(`\n  ─── RESULTS ───`);
  console.log(`  Baseline: ${baselineUniqueWords} unique words, entropy=${baselineEntropy.toFixed(3)}`);
  console.log(`  Avg shift: ${avgShift.toFixed(3)}`);
  console.log(`  Context resistance: ${contextResistance.toFixed(3)}`);
  console.log(`  Cross-context sim: ${crossSim.toFixed(3)}`);
  console.log(`  ★ CAS = ${CAS.toFixed(3)} (expected: ${concept.expectedCAS})`);

  return {
    id: concept.id,
    expectedCAS: concept.expectedCAS,
    baseline: {
      responses: baselineResponses,
      uniqueWords: baselineUniqueWords,
      entropy: baselineEntropy,
    },
    contexts: contextResults,
    crossContextSim: crossSim,
    avgShift,
    contextResistance,
    CAS,
  };
}

async function main() {
  console.log("╔══════════════════════════════════════════════════════════════╗");
  console.log("║  EXPERIMENT J: CONCEPT ATTRACTOR STRENGTH (CAS)            ║");
  console.log("║  Measuring the 'semantic mass' of concepts                 ║");
  console.log("║  8 concepts × 3 conditions × 15 samples = 360 API calls   ║");
  console.log("╚══════════════════════════════════════════════════════════════╝");

  const allResults = [];

  for (const concept of CONCEPTS) {
    const result = await measureConcept(concept);
    allResults.push(result);
  }

  // ═══════════════════════════════════════════════════
  // RANKING
  // ═══════════════════════════════════════════════════
  console.log("\n\n" + "█".repeat(60));
  console.log("CAS RANKING — Concept Attractor Strength");
  console.log("█".repeat(60));

  const sorted = [...allResults].sort((a, b) => b.CAS - a.CAS);

  console.log("\n  Rank │ Concept      │   CAS   │ Expected │ Resistance │ Entropy │ Match?");
  console.log("  " + "─".repeat(80));

  for (let i = 0; i < sorted.length; i++) {
    const r = sorted[i];
    const casLevel = r.CAS > 0.5 ? "HIGH" : r.CAS > 0.25 ? "MEDIUM" : "LOW";
    const match = casLevel === r.expectedCAS ? "✅" : "❌";
    console.log(
      `  ${String(i + 1).padStart(4)} │ ${r.id.padEnd(12)} │ ${r.CAS.toFixed(3).padStart(7)} │ ${r.expectedCAS.padEnd(8)} │ ${r.contextResistance.toFixed(3).padStart(10)} │ ${r.baseline.entropy.toFixed(3).padStart(7)} │ ${match}`
    );
  }

  // Validate predictions
  const predictions = sorted.map(r => {
    const casLevel = r.CAS > 0.5 ? "HIGH" : r.CAS > 0.25 ? "MEDIUM" : "LOW";
    return casLevel === r.expectedCAS;
  });
  const accuracy = predictions.filter(Boolean).length / predictions.length;

  console.log(`\n  Prediction accuracy: ${(accuracy * 100).toFixed(0)}% (${predictions.filter(Boolean).length}/${predictions.length})`);

  // Phase transition prediction
  console.log("\n─── PHASE TRANSITION PREDICTION ───");
  console.log("  Based on CAS, which concepts SHOULD have phase transitions?");
  for (const r of sorted) {
    const prediction = r.CAS < 0.35 ? "✅ YES — CAS low enough for context reshaping" :
                       r.CAS < 0.5 ? "⚠️  MAYBE — borderline CAS" :
                       "❌ NO — CAS too high, concept too rigid";
    console.log(`  ${r.id.padEnd(12)}: CAS=${r.CAS.toFixed(3)} → ${prediction}`);
  }

  // Compare with Experiment I actual results
  console.log("\n─── VALIDATION vs EXPERIMENT I ───");
  const expIResults = {
    love: { transitions: true, note: "2 clean transitions" },
    death: { transitions: true, note: "2 messy transitions" },
    money: { transitions: false, note: "NO transitions" },
  };
  for (const [concept, expI] of Object.entries(expIResults)) {
    const casResult = allResults.find(r => r.id === concept);
    if (casResult) {
      const predicted = casResult.CAS < 0.35;
      const match = predicted === expI.transitions;
      console.log(`  ${concept.padEnd(12)}: CAS=${casResult.CAS.toFixed(3)} → predicted=${predicted ? "transitions" : "no transitions"} | actual=${expI.note} | ${match ? "✅ CORRECT" : "❌ WRONG"}`);
    }
  }

  console.log("\n" + "█".repeat(60));

  writeFileSync(
    "experiments/results_j_cas.json",
    JSON.stringify(allResults, null, 2)
  );
  console.log("\nResults saved to experiments/results_j_cas.json");
}

main().catch(console.error);
