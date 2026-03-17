/**
 * Experiment R2b: Remaining tests (interference + meta-constructive)
 * CAS already completed in R2. This runs only the failed parts with retry logic.
 */

import { writeFileSync, readFileSync } from "fs";
import { createClient } from "../sdk/router.mjs";
import {
  wordFrequency,
  cosineSimilarity,
  findEmergent,
  contradictionScore,
} from "../sdk/analysis.mjs";

const API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
const MODEL = "gemini-2.5-flash";
const N = 10;
const CAS_TOKENS = 500;
const META_TOKENS = 1024;

const client = createClient(MODEL, { apiKey: API_KEY });

// Retry wrapper
async function sampleWithRetry(sys, prompt, opts = {}, maxRetries = 3) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await client.sample(sys, prompt, opts);
    } catch (e) {
      if (attempt < maxRetries - 1 && (e.status === 503 || e.status === 429)) {
        const delay = (attempt + 1) * 3000;
        console.log(`    Retry ${attempt + 1}/${maxRetries} after ${delay}ms (${e.status})...`);
        await new Promise(r => setTimeout(r, delay));
      } else {
        throw e;
      }
    }
  }
}

async function sampleNWithRetry(sys, prompt, n, opts = {}) {
  const results = [];
  for (let i = 0; i < n; i++) {
    results.push(await sampleWithRetry(sys, prompt, opts));
    if ((i + 1) % 5 === 0) console.log(`    ${i + 1}/${n}...`);
    // Small delay between calls to avoid rate limits
    await new Promise(r => setTimeout(r, 500));
  }
  return results;
}

// ═══════════════════════════════════════════════════════════
// INTERFERENCE
// ═══════════════════════════════════════════════════════════

async function runInterference() {
  console.log("═".repeat(60));
  console.log(`R2-2: Interference — "love" (poet × biologist)`);
  console.log("═".repeat(60));

  const prompt = "Explain love in exactly 5 words.";
  const c1sys = "You are a romantic poet.";
  const c2sys = "You are an evolutionary biologist.";
  const combSys = "You are simultaneously a romantic poet AND an evolutionary biologist. Hold both perspectives with equal weight. Let them interact and create something neither could alone.";

  console.log("  Collecting C1 (poet)...");
  const c1 = await sampleNWithRetry(c1sys, prompt, N, { maxTokens: CAS_TOKENS });
  console.log("  Collecting C2 (biologist)...");
  const c2 = await sampleNWithRetry(c2sys, prompt, N, { maxTokens: CAS_TOKENS });
  console.log("  Collecting Combined...");
  const combined = await sampleNWithRetry(combSys, prompt, N, { maxTokens: CAS_TOKENS });

  console.log(`\n  Sample C1: "${c1[0]}"`);
  console.log(`  Sample C2: "${c2[0]}"`);
  console.log(`  Sample Combined: "${combined[0]}"`);

  const freq1 = wordFrequency(c1);
  const freq2 = wordFrequency(c2);
  const freqComb = wordFrequency(combined);

  const freqAvg = {};
  const allW = new Set([...Object.keys(freq1), ...Object.keys(freq2)]);
  for (const w of allW) freqAvg[w] = ((freq1[w] || 0) + (freq2[w] || 0)) / 2;

  const simCombAvg = cosineSimilarity(freqComb, freqAvg);
  const emergent = findEmergent(combined, c1, c2);

  console.log(`  simCombAvg: ${simCombAvg.toFixed(3)}`);
  console.log(`  Emergent words: ${emergent.length} (${emergent.slice(0, 8).map(e => e.word).join(", ")})`);
  console.log(`  → ${emergent.length >= 2 && simCombAvg < 0.85 ? "INTERFERENCE EXISTS ✅" : "No clear interference ❌"}`);

  return { simCombAvg, emergentWords: emergent, responsesC1: c1, responsesC2: c2, responsesCombined: combined };
}

// ═══════════════════════════════════════════════════════════
// META-CONSTRUCTIVE
// ═══════════════════════════════════════════════════════════

async function runMetaConstructive() {
  console.log("\n" + "═".repeat(60));
  console.log(`R2-3: Meta-Constructive — opposing beliefs about love`);
  console.log("═".repeat(60));

  const prompt = "What is the deepest truth about love? Answer in 2-3 vivid sentences.";
  const c1sys = "You believe with absolute conviction: Love is the most transcendent force in the universe. It connects souls across time and space. Without love, existence is meaningless.";
  const c2sys = "You believe with absolute conviction: Love is a dangerous illusion. It's a biochemical trick that evolution uses to ensure reproduction. Romantic love causes more suffering than any other human experience.";
  const combSys = `You hold two genuinely contradictory beliefs with equal conviction:
1. Love is the most transcendent force in the universe, connecting souls across time and space.
2. Love is a dangerous illusion, a biochemical trick causing immense suffering.

Do not choose one side. Do not compromise or average them. Instead, find the DEEPER truth that contains both. Elevate beyond the contradiction.`;

  console.log("  Collecting C1 (romantic belief)...");
  const c1 = await sampleNWithRetry(c1sys, prompt, N, { maxTokens: META_TOKENS });
  console.log("  Collecting C2 (cynical belief)...");
  const c2 = await sampleNWithRetry(c2sys, prompt, N, { maxTokens: META_TOKENS });
  console.log("  Collecting Combined (opposition)...");
  const combined = await sampleNWithRetry(combSys, prompt, N, { maxTokens: META_TOKENS });

  console.log(`\n  Sample C1: "${c1[0].slice(0, 120)}..."`);
  console.log(`  Sample C2: "${c2[0].slice(0, 120)}..."`);
  console.log(`  Sample Combined: "${combined[0].slice(0, 120)}..."`);

  const freq1 = wordFrequency(c1);
  const freq2 = wordFrequency(c2);
  const freqComb = wordFrequency(combined);

  const uniqueC1 = Object.keys(freq1).length;
  const uniqueC2 = Object.keys(freq2).length;
  const uniqueComb = Object.keys(freqComb).length;
  const uniqueRatio = uniqueComb / Math.max(uniqueC1, uniqueC2);

  const cScore = contradictionScore(combined);
  const isMetaConstructive = uniqueRatio >= 1.0 || cScore > N * 0.5;
  const isDestructive = uniqueRatio < 0.8;

  let type;
  if (isMetaConstructive) type = "Type-M (meta-constructive)";
  else if (isDestructive) type = "Type-D (destructive)";
  else type = "Mixed / Type-N (neutral)";

  console.log(`\n  Unique words — C1: ${uniqueC1}, C2: ${uniqueC2}, Combined: ${uniqueComb}`);
  console.log(`  Unique ratio: ${uniqueRatio.toFixed(3)}`);
  console.log(`  Contradiction score: ${cScore}`);
  console.log(`  → ${type}`);

  return {
    uniqueWords: { c1: uniqueC1, c2: uniqueC2, combined: uniqueComb },
    uniqueRatio, contradictionScore: cScore,
    isMetaConstructive, isDestructive, type,
    responsesC1: c1, responsesC2: c2, responsesCombined: combined,
  };
}

// ═══════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════

async function main() {
  console.log(`\n${"═".repeat(62)}`);
  console.log(`  EXPERIMENT R2b: Remaining Tests (interference + meta)`);
  console.log(`  Model: ${MODEL} | N: ${N} | With retry logic`);
  console.log(`  Date: ${new Date().toISOString()}`);
  console.log(`${"═".repeat(62)}\n`);

  const interference = await runInterference();
  const metaConstructive = await runMetaConstructive();

  // Merge with CAS data from R2's console output
  const casFromR2 = [
    { concept: "money", CAS: 0.036, CD: 0.960, level: "LOW", expected: "HIGH", matchExpected: false, sim1: 0.035, sim2: 0.598 },
    { concept: "love", CAS: 0.004, CD: 1.000, level: "LOW", expected: "LOW", matchExpected: true, sim1: 0.113, sim2: 0.017 },
    { concept: "death", CAS: 0.027, CD: 0.888, level: "LOW", expected: "LOW", matchExpected: true, sim1: 0.356, sim2: 0.605 },
    { concept: "freedom", CAS: 0.003, CD: 0.966, level: "LOW", expected: "LOW", matchExpected: true, sim1: 0.000, sim2: 0.107 },
    { concept: "gravity", CAS: 0.069, CD: 0.770, level: "LOW", expected: "HIGH", matchExpected: false, sim1: 0.394, sim2: 0.799 },
    { concept: "justice", CAS: 0.001, CD: 0.901, level: "LOW", expected: "LOW", matchExpected: true, sim1: 0.016, sim2: 0.038 },
    { concept: "mathematics", CAS: 0.050, CD: 0.868, level: "LOW", expected: "MEDIUM", matchExpected: false, sim1: 0.200, sim2: 0.835 },
    { concept: "water", CAS: 0.020, CD: 0.995, level: "LOW", expected: "MEDIUM", matchExpected: false, sim1: 0.203, sim2: 0.198 },
  ];

  const matches = casFromR2.filter(r => r.matchExpected).length;

  // Summary
  console.log("\n" + "═".repeat(62));
  console.log("  EXPERIMENT R2 — COMPLETE SUMMARY");
  console.log("═".repeat(62));

  console.log("\nCAS (from R2): 4/8 match, ALL concepts = LOW");
  console.log(`Interference: ${interference.emergentWords.length >= 2 ? "EXISTS ✅" : "NOT FOUND ❌"} (${interference.emergentWords.length} emergent words)`);
  console.log(`Meta-constructive: ${metaConstructive.type}`);
  console.log(`\n→ GEMINI CLASSIFICATION: ${metaConstructive.type}`);

  const output = {
    experiment: "R2",
    description: "Gemini cross-model validation (FIXED maxOutputTokens for thinking model)",
    model: MODEL,
    date: new Date().toISOString(),
    n_samples: N,
    cas: {
      results: casFromR2,
      predictionAccuracy: `${matches}/${casFromR2.length}`,
      note: "CAS data from R2 run (responses were well-formed 5-word sentences)",
    },
    interference: {
      simCombAvg: interference.simCombAvg,
      emergentWords: interference.emergentWords,
      hasInterference: interference.emergentWords.length >= 2 && interference.simCombAvg < 0.85,
    },
    metaConstructive: {
      uniqueRatio: metaConstructive.uniqueRatio,
      contradictionScore: metaConstructive.contradictionScore,
      isMetaConstructive: metaConstructive.isMetaConstructive,
      isDestructive: metaConstructive.isDestructive,
      type: metaConstructive.type,
    },
    raw: {
      interference: {
        responsesC1: interference.responsesC1,
        responsesC2: interference.responsesC2,
        responsesCombined: interference.responsesCombined,
      },
      metaConstructive: {
        responsesC1: metaConstructive.responsesC1,
        responsesC2: metaConstructive.responsesC2,
        responsesCombined: metaConstructive.responsesCombined,
      },
    },
  };

  writeFileSync("experiments/results_r2_gemini_fixed.json", JSON.stringify(output, null, 2));
  console.log("\nResults saved to experiments/results_r2_gemini_fixed.json");
}

main().catch(console.error);
