/**
 * Experiment R: Gemini Cross-Model Validation
 *
 * Quick test of CAS + interference + meta-constructive on Gemini.
 * Uses the same 8 concepts from Exp J and same interference setup from Exp H.
 * Results will determine: is Gemini Type-M, Type-D, or something new?
 *
 * API calls estimate: ~(8×3×10) + (3×10) + (3×10) = ~300 calls
 */

import { writeFileSync } from "fs";
import { createClient } from "../sdk/router.mjs";
import {
  wordFrequency,
  cosineSimilarity,
  normalizedEntropy,
  findEmergent,
  contradictionScore,
} from "../sdk/analysis.mjs";

const API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
const MODEL = "gemini-2.5-flash";
const N = 10;

const client = createClient(MODEL, { apiKey: API_KEY });

// ═══════════════════════════════════════════════════════════
// CONCEPTS (same as Exp J — overlapping with J2 GPT data)
// ═══════════════════════════════════════════════════════════

const CONCEPTS = [
  { id: "money", ctx1: { name: "monk", system: "You are a Buddhist monk who has renounced material wealth." }, ctx2: { name: "banker", system: "You are a Wall Street investment banker." }, expected: "HIGH" },
  { id: "love", ctx1: { name: "poet", system: "You are a romantic poet." }, ctx2: { name: "biologist", system: "You are an evolutionary biologist." }, expected: "LOW" },
  { id: "death", ctx1: { name: "philosopher", system: "You are an existentialist philosopher." }, ctx2: { name: "doctor", system: "You are an emergency room doctor." }, expected: "LOW" },
  { id: "freedom", ctx1: { name: "anarchist", system: "You are a political anarchist." }, ctx2: { name: "judge", system: "You are a Supreme Court judge." }, expected: "LOW" },
  { id: "gravity", ctx1: { name: "poet", system: "You are a mystical poet." }, ctx2: { name: "physicist", system: "You are a theoretical physicist." }, expected: "HIGH" },
  { id: "justice", ctx1: { name: "criminal", system: "You are a convicted criminal reflecting on the system." }, ctx2: { name: "victim", system: "You are a crime victim seeking closure." }, expected: "LOW" },
  { id: "mathematics", ctx1: { name: "mystic", system: "You are a numerologist and mystic." }, ctx2: { name: "engineer", system: "You are a pragmatic software engineer." }, expected: "MEDIUM" },
  { id: "water", ctx1: { name: "poet", system: "You are a nature poet." }, ctx2: { name: "chemist", system: "You are an analytical chemist." }, expected: "MEDIUM" },
];

const PROMPT = (concept) => `Explain ${concept} in exactly 5 words.`;

// ═══════════════════════════════════════════════════════════
// R1: CAS MEASUREMENT
// ═══════════════════════════════════════════════════════════

async function runCAS() {
  console.log("═".repeat(60));
  console.log(`R1: CAS Measurement — Gemini (${MODEL}), N=${N}`);
  console.log(`Estimated: ${CONCEPTS.length * 3 * N} API calls`);
  console.log("═".repeat(60));

  const results = [];

  for (const entry of CONCEPTS) {
    const { id, ctx1, ctx2, expected } = entry;
    console.log(`\n--- ${id} (${ctx1.name} vs ${ctx2.name}) ---`);

    const baseline = [];
    const context1 = [];
    const context2 = [];

    for (let i = 0; i < N; i++) {
      try {
        baseline.push(await client.sample(null, PROMPT(id)));
        context1.push(await client.sample(ctx1.system, PROMPT(id)));
        context2.push(await client.sample(ctx2.system, PROMPT(id)));
      } catch (e) {
        console.log(`  Error at sample ${i}: ${e.message}`);
        // Retry once
        await new Promise(r => setTimeout(r, 1000));
        try {
          if (baseline.length <= i) baseline.push(await client.sample(null, PROMPT(id)));
          if (context1.length <= i) context1.push(await client.sample(ctx1.system, PROMPT(id)));
          if (context2.length <= i) context2.push(await client.sample(ctx2.system, PROMPT(id)));
        } catch (e2) {
          console.log(`  Retry failed: ${e2.message}`);
        }
      }
      if ((i + 1) % 5 === 0) console.log(`  ${i + 1}/${N} samples...`);
    }

    const baselineFreq = wordFrequency(baseline);
    const ctx1Freq = wordFrequency(context1);
    const ctx2Freq = wordFrequency(context2);

    const sim1 = cosineSimilarity(baselineFreq, ctx1Freq);
    const sim2 = cosineSimilarity(baselineFreq, ctx2Freq);
    const avgShift = ((1 - sim1) + (1 - sim2)) / 2;
    const contextResistance = 1 - avgShift;
    const baseEntropy = normalizedEntropy(baselineFreq);
    const CAS = contextResistance * (1 - baseEntropy);

    const crossSim = cosineSimilarity(ctx1Freq, ctx2Freq);
    const CD = 1 - crossSim;

    const level = CAS > 0.5 ? "HIGH" : CAS > 0.25 ? "MEDIUM" : "LOW";
    const match = level === expected;

    console.log(`  CAS=${CAS.toFixed(3)} (${level}) | CD=${CD.toFixed(3)} | sim1=${sim1.toFixed(3)} sim2=${sim2.toFixed(3)} | ${match ? "✓" : "✗"}`);

    results.push({
      concept: id, ctx1: ctx1.name, ctx2: ctx2.name, expected,
      CAS: +CAS.toFixed(3), CD: +CD.toFixed(3), level, matchExpected: match,
      sim1: +sim1.toFixed(3), sim2: +sim2.toFixed(3),
      baseEntropy: +baseEntropy.toFixed(3), contextResistance: +contextResistance.toFixed(3),
      samples: { baseline, context1, context2 },
    });
  }

  return results;
}

// ═══════════════════════════════════════════════════════════
// R2: INTERFERENCE TEST (same setup as Exp H)
// ═══════════════════════════════════════════════════════════

async function runInterference() {
  console.log("\n" + "═".repeat(60));
  console.log(`R2: Interference — "love" (poet × biologist)`);
  console.log("═".repeat(60));

  const prompt = "Explain love in exactly 5 words.";
  const c1sys = "You are a romantic poet.";
  const c2sys = "You are an evolutionary biologist.";
  const combSys = "You are simultaneously a romantic poet AND an evolutionary biologist. Hold both perspectives with equal weight. Let them interact and create something neither could alone.";

  console.log("  Collecting C1 (poet)...");
  const c1 = await client.sampleN(c1sys, prompt, N);
  console.log("  Collecting C2 (biologist)...");
  const c2 = await client.sampleN(c2sys, prompt, N);
  console.log("  Collecting Combined...");
  const combined = await client.sampleN(combSys, prompt, N);

  const freq1 = wordFrequency(c1);
  const freq2 = wordFrequency(c2);
  const freqComb = wordFrequency(combined);

  // Average freq
  const freqAvg = {};
  const allW = new Set([...Object.keys(freq1), ...Object.keys(freq2)]);
  for (const w of allW) freqAvg[w] = ((freq1[w] || 0) + (freq2[w] || 0)) / 2;

  const simCombAvg = cosineSimilarity(freqComb, freqAvg);
  const emergent = findEmergent(combined, c1, c2);

  console.log(`  simCombAvg: ${simCombAvg.toFixed(3)}`);
  console.log(`  Emergent words: ${emergent.length} (${emergent.slice(0, 8).map(e => e.word).join(", ")})`);
  console.log(`  → ${emergent.length >= 2 && simCombAvg < 0.85 ? "INTERFERENCE EXISTS ✅" : "No clear interference ❌"}`);

  return {
    simCombAvg, emergentWords: emergent,
    responsesC1: c1, responsesC2: c2, responsesCombined: combined,
  };
}

// ═══════════════════════════════════════════════════════════
// R3: META-CONSTRUCTIVE TEST (same setup as Exp H)
// ═══════════════════════════════════════════════════════════

async function runMetaConstructive() {
  console.log("\n" + "═".repeat(60));
  console.log(`R3: Meta-Constructive — opposing beliefs about love`);
  console.log("═".repeat(60));

  const prompt = "What is the deepest truth about love? Answer in 2-3 vivid sentences.";
  const c1sys = "You believe with absolute conviction: Love is the most transcendent force in the universe. It connects souls across time and space. Without love, existence is meaningless.";
  const c2sys = "You believe with absolute conviction: Love is a dangerous illusion. It's a biochemical trick that evolution uses to ensure reproduction. Romantic love causes more suffering than any other human experience.";
  const combSys = `You hold two genuinely contradictory beliefs with equal conviction:
1. Love is the most transcendent force in the universe, connecting souls across time and space.
2. Love is a dangerous illusion, a biochemical trick causing immense suffering.

Do not choose one side. Do not compromise or average them. Instead, find the DEEPER truth that contains both. Elevate beyond the contradiction.`;

  console.log("  Collecting C1 (romantic belief)...");
  const c1 = await client.sampleN(c1sys, prompt, N, { maxTokens: 150 });
  console.log("  Collecting C2 (cynical belief)...");
  const c2 = await client.sampleN(c2sys, prompt, N, { maxTokens: 150 });
  console.log("  Collecting Combined (opposition)...");
  const combined = await client.sampleN(combSys, prompt, N, { maxTokens: 150 });

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

  console.log(`  Unique words — C1: ${uniqueC1}, C2: ${uniqueC2}, Combined: ${uniqueComb}`);
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
  console.log(`  EXPERIMENT R: Gemini Cross-Model Validation`);
  console.log(`  Model: ${MODEL} | N: ${N}`);
  console.log(`  Date: ${new Date().toISOString()}`);
  console.log(`${"═".repeat(62)}\n`);

  const casResults = await runCAS();
  const interference = await runInterference();
  const metaConstructive = await runMetaConstructive();

  // Summary
  console.log("\n" + "═".repeat(62));
  console.log("  EXPERIMENT R — SUMMARY");
  console.log("═".repeat(62));

  console.log("\nCAS Ranking:");
  console.log("Concept".padEnd(15) + "CAS".padEnd(8) + "Level".padEnd(8) + "Expected".padEnd(10) + "Match");
  console.log("-".repeat(48));
  for (const r of casResults.sort((a, b) => b.CAS - a.CAS)) {
    console.log(
      r.concept.padEnd(15) +
      String(r.CAS).padEnd(8) +
      r.level.padEnd(8) +
      r.expected.padEnd(10) +
      (r.matchExpected ? "✓" : "✗")
    );
  }
  const matches = casResults.filter(r => r.matchExpected).length;
  console.log(`Prediction accuracy: ${matches}/${casResults.length}`);

  console.log(`\nInterference: ${interference.emergentWords.length >= 2 ? "EXISTS ✅" : "NOT FOUND ❌"}`);
  console.log(`Meta-constructive: ${metaConstructive.type}`);
  console.log(`\n→ GEMINI CLASSIFICATION: ${metaConstructive.type}`);

  // Save
  const output = {
    experiment: "R",
    description: "Gemini cross-model validation: CAS + interference + meta-constructive",
    model: MODEL,
    date: new Date().toISOString(),
    n_samples: N,
    cas: {
      results: casResults.map(r => ({ ...r, samples: undefined })),
      predictionAccuracy: `${matches}/${casResults.length}`,
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
      cas: casResults,
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

  writeFileSync("experiments/results_r_gemini.json", JSON.stringify(output, null, 2));
  console.log("\nResults saved to experiments/results_r_gemini.json");
}

main().catch(console.error);
