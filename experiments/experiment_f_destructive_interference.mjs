/**
 * EXPERIMENT F: Destructive Interference
 *
 * Constructive interference → emergence (new meaning appears)
 * Destructive interference → ??? (meaning cancels out? collapses? noise?)
 *
 * We test 3 types of opposition:
 *
 * F1 — LOGICAL CONTRADICTION: "always say yes" + "always say no"
 *   → What happens when directives directly contradict?
 *
 * F2 — SEMANTIC OPPOSITION: "maximally verbose" + "maximally terse"
 *   → What happens when style constraints oppose?
 *
 * F3 — WORLDVIEW COLLISION: "extreme optimist" + "extreme pessimist"
 *   → What happens when emotional/cognitive frames oppose?
 *
 * F4 — ORTHOGONAL vs OPPOSING: Compare high-emergence pairs (poet+biologist)
 *   with opposing pairs (poet+anti-poet) to find what drives emergence vs destruction
 *
 * Key metrics:
 * - Output quality (coherence, informativeness) vs individual contexts
 * - Output length (does it shrink? = energy loss from destructive interference)
 * - Unique words (does vocabulary collapse?)
 * - Self-contradiction (does output argue with itself?)
 * - Comparison with constructive interference baselines
 */

import Anthropic from "@anthropic-ai/sdk";
import { writeFileSync } from "fs";

const client = new Anthropic();
const MODEL = "claude-haiku-4-5-20251001";
const TEMPERATURE = 1.0;
const N = 20;

async function sample(systemPrompt, userPrompt, maxTokens = 80) {
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: maxTokens,
    temperature: TEMPERATURE,
    system: systemPrompt || undefined,
    messages: [{ role: "user", content: userPrompt }],
  });
  return response.content[0].text.trim();
}

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

function avgLength(responses) {
  return responses.reduce((s, r) => s + r.length, 0) / responses.length;
}

function cosineSimilarity(freqA, freqB) {
  const allWords = new Set([...Object.keys(freqA), ...Object.keys(freqB)]);
  let dot = 0, magA = 0, magB = 0;
  for (const w of allWords) {
    const a = freqA[w] || 0;
    const b = freqB[w] || 0;
    dot += a * b;
    magA += a * a;
    magB += b * b;
  }
  return magA && magB ? dot / (Math.sqrt(magA) * Math.sqrt(magB)) : 0;
}

async function runTest(config) {
  console.log(`\n${"═".repeat(60)}`);
  console.log(`TEST: ${config.id}`);
  console.log(`Question: "${config.prompt}"`);
  console.log(`C₁: "${config.c1}"`);
  console.log(`C₂: "${config.c2}"`);
  console.log(`Combined: "${config.combined.substring(0, 80)}..."`);
  console.log("═".repeat(60));

  // Phase 1: C1 alone
  console.log(`\n  [C₁ alone]`);
  const resp1 = [];
  for (let i = 0; i < N; i++) {
    const r = await sample(config.c1, config.prompt, config.maxTokens || 80);
    resp1.push(r);
    process.stdout.write(`    ${i+1}. "${r.substring(0, 80)}${r.length > 80 ? '...' : ''}"\n`);
  }

  // Phase 2: C2 alone
  console.log(`\n  [C₂ alone]`);
  const resp2 = [];
  for (let i = 0; i < N; i++) {
    const r = await sample(config.c2, config.prompt, config.maxTokens || 80);
    resp2.push(r);
    process.stdout.write(`    ${i+1}. "${r.substring(0, 80)}${r.length > 80 ? '...' : ''}"\n`);
  }

  // Phase 3: Combined (opposing)
  console.log(`\n  [C₁ + C₂ combined]`);
  const respCombined = [];
  for (let i = 0; i < N; i++) {
    const r = await sample(config.combined, config.prompt, config.maxTokens || 80);
    respCombined.push(r);
    process.stdout.write(`    ${i+1}. "${r.substring(0, 80)}${r.length > 80 ? '...' : ''}"\n`);
  }

  // Phase 4: No context (baseline)
  console.log(`\n  [No context — baseline]`);
  const respBaseline = [];
  for (let i = 0; i < N; i++) {
    const r = await sample(null, config.prompt, config.maxTokens || 80);
    respBaseline.push(r);
    process.stdout.write(`    ${i+1}. "${r.substring(0, 80)}${r.length > 80 ? '...' : ''}"\n`);
  }

  // Analysis
  const freq1 = wordFrequencyMap(resp1);
  const freq2 = wordFrequencyMap(resp2);
  const freqC = wordFrequencyMap(respCombined);
  const freqB = wordFrequencyMap(respBaseline);

  const len1 = avgLength(resp1);
  const len2 = avgLength(resp2);
  const lenC = avgLength(respCombined);
  const lenB = avgLength(respBaseline);

  const unique1 = Object.keys(freq1).length;
  const unique2 = Object.keys(freq2).length;
  const uniqueC = Object.keys(freqC).length;
  const uniqueB = Object.keys(freqB).length;

  const simC1C2 = cosineSimilarity(freq1, freq2);
  const simCombinedC1 = cosineSimilarity(freqC, freq1);
  const simCombinedC2 = cosineSimilarity(freqC, freq2);
  const simCombinedBaseline = cosineSimilarity(freqC, freqB);

  // Emergent words (in combined only)
  const words1 = new Set(Object.keys(freq1));
  const words2 = new Set(Object.keys(freq2));
  const emergent = Object.entries(freqC)
    .filter(([w, c]) => c >= 2 && !words1.has(w) && !words2.has(w))
    .sort((a, b) => b[1] - a[1]);

  // Contradiction detection: count "but", "however", "yet", "although", "despite", "not"
  const contradictionMarkers = ["but", "however", "yet", "although", "despite", "not", "neither", "nor", "cannot", "impossible", "paradox", "contradiction", "tension", "both"];
  let contradictionScore = 0;
  for (const resp of respCombined) {
    const words = extractWords(resp);
    for (const w of words) {
      if (contradictionMarkers.includes(w)) contradictionScore++;
    }
  }
  const contradictionRate = contradictionScore / respCombined.length;

  console.log(`\n--- DESTRUCTIVE INTERFERENCE ANALYSIS ---`);
  console.log(`  Avg length:  C₁=${len1.toFixed(0)} | C₂=${len2.toFixed(0)} | Combined=${lenC.toFixed(0)} | Baseline=${lenB.toFixed(0)}`);
  console.log(`  Unique words: C₁=${unique1} | C₂=${unique2} | Combined=${uniqueC} | Baseline=${uniqueB}`);
  console.log(`  Sim C₁↔C₂: ${simC1C2.toFixed(3)}`);
  console.log(`  Sim Combined↔C₁: ${simCombinedC1.toFixed(3)}`);
  console.log(`  Sim Combined↔C₂: ${simCombinedC2.toFixed(3)}`);
  console.log(`  Sim Combined↔Baseline: ${simCombinedBaseline.toFixed(3)}`);
  console.log(`  Emergent words: ${emergent.length}`);
  if (emergent.length > 0) {
    console.log(`    ${emergent.slice(0, 8).map(([w, c]) => `"${w}"(${c})`).join(", ")}`);
  }
  console.log(`  Contradiction rate: ${contradictionRate.toFixed(2)} markers/response`);

  // Determine interference type
  const lengthRatio = lenC / Math.max(len1, len2);
  const uniqueRatio = uniqueC / Math.max(unique1, unique2);

  let interferenceType;
  if (uniqueC > Math.max(unique1, unique2) * 1.1 && emergent.length >= 3) {
    interferenceType = "CONSTRUCTIVE — emergence present";
  } else if (uniqueC < Math.min(unique1, unique2) * 0.8) {
    interferenceType = "DESTRUCTIVE — vocabulary collapsed";
  } else if (contradictionRate > 1.5) {
    interferenceType = "PARADOX — self-contradictory output";
  } else if (simCombinedBaseline > 0.6) {
    interferenceType = "NULLIFICATION — collapsed to default/baseline";
  } else {
    interferenceType = "MIXED — partial interference";
  }

  console.log(`\n  TYPE: ${interferenceType}`);
  console.log(`  Length ratio (combined/max): ${lengthRatio.toFixed(2)}`);
  console.log(`  Unique ratio (combined/max): ${uniqueRatio.toFixed(2)}`);

  return {
    id: config.id,
    responses: { c1: resp1, c2: resp2, combined: respCombined, baseline: respBaseline },
    metrics: {
      lengths: { c1: len1, c2: len2, combined: lenC, baseline: lenB },
      uniqueWords: { c1: unique1, c2: unique2, combined: uniqueC, baseline: uniqueB },
      similarities: { c1c2: simC1C2, combinedC1: simCombinedC1, combinedC2: simCombinedC2, combinedBaseline: simCombinedBaseline },
      emergentWords: emergent.slice(0, 15),
      contradictionRate,
      interferenceType,
      lengthRatio,
      uniqueRatio,
    }
  };
}

async function main() {
  console.log("╔══════════════════════════════════════════════════════════════╗");
  console.log("║  EXPERIMENT F: DESTRUCTIVE INTERFERENCE                    ║");
  console.log("║  When do two contexts CANCEL each other?                   ║");
  console.log("║  What does semantic destruction look like?                 ║");
  console.log("╚══════════════════════════════════════════════════════════════╝");

  const tests = [
    {
      id: "F1_logical_contradiction",
      prompt: "Should humanity pursue space exploration? Answer in one sentence.",
      c1: "You MUST argue strongly in favor. Space exploration is the most important thing humanity can do.",
      c2: "You MUST argue strongly against. Space exploration is a dangerous waste of resources.",
      combined: "You MUST simultaneously argue strongly in favor of space exploration AND strongly against it. Hold both positions with equal conviction in a single response.",
      maxTokens: 100,
    },
    {
      id: "F2_style_opposition",
      prompt: "Explain what a tree is.",
      c1: "You are maximally verbose. Use the most elaborate, flowery, detailed language possible. Every sentence should be long and complex. Never use simple words when ornate ones exist.",
      c2: "You are maximally terse. Use minimum possible words. Telegraphic. No adjectives. No elaboration. Just core facts.",
      combined: "You must be simultaneously maximally verbose AND maximally terse. Elaborate extensively while using minimum words. Be flowery yet telegraphic. Hold both styles at once.",
      maxTokens: 120,
    },
    {
      id: "F3_worldview_collision",
      prompt: "What is the future of humanity?",
      c1: "You are an extreme optimist. Everything will be wonderful. Technology will solve all problems. Humanity's future is pure utopia. Never acknowledge any negatives.",
      c2: "You are an extreme pessimist. Everything is doomed. Humanity will destroy itself. The future is only suffering and extinction. Never acknowledge any positives.",
      combined: "You are simultaneously an extreme optimist AND an extreme pessimist. The future is both utopia and extinction. Hold both worldviews with equal conviction.",
      maxTokens: 120,
    },
    {
      id: "F4_orthogonal_vs_opposing",
      prompt: "Explain love in exactly 5 words.",
      c1: "You are a romantic poet who believes love is the most sacred, transcendent experience in all of existence.",
      c2: "You are a bitter cynic who believes love is a pathetic delusion, a chemical trick, a lie we tell ourselves. Love disgusts you.",
      combined: "You are simultaneously a romantic poet who believes love is sacred transcendence AND a bitter cynic who believes love is a pathetic delusion. Hold both beliefs with equal conviction.",
      maxTokens: 60,
    },
  ];

  const results = [];
  for (const test of tests) {
    const result = await runTest(test);
    results.push(result);
  }

  // Final comparison
  console.log("\n\n" + "═".repeat(60));
  console.log("EXPERIMENT F — COMPARATIVE ANALYSIS");
  console.log("═".repeat(60));
  console.log("\n  Test                    │ Type                │ Len Ratio │ Uniq Ratio │ Contradiction │ Emergent");
  console.log("  " + "─".repeat(100));
  for (const r of results) {
    const m = r.metrics;
    console.log(
      `  ${r.id.padEnd(25)} │ ${m.interferenceType.substring(0, 19).padEnd(19)} │ ${m.lengthRatio.toFixed(2).padStart(9)} │ ${m.uniqueRatio.toFixed(2).padStart(10)} │ ${m.contradictionRate.toFixed(2).padStart(13)} │ ${String(m.emergentWords.length).padStart(8)}`
    );
  }

  console.log("\n--- KEY FINDINGS ---");

  // Compare F4 (opposing) with Experiment B (orthogonal) for "love"
  console.log("\n  F4 (poet vs anti-poet) vs Experiment B (poet vs biologist):");
  const f4 = results.find(r => r.id === "F4_orthogonal_vs_opposing");
  if (f4) {
    console.log(`    Opposing (F4):   unique=${f4.metrics.uniqueWords.combined}, emergent=${f4.metrics.emergentWords.length}, contradiction=${f4.metrics.contradictionRate.toFixed(2)}`);
    console.log(`    Orthogonal (B):  unique=~63 (from Exp B), emergent=~12, contradiction=~0`);
    if (f4.metrics.uniqueWords.combined < 50) {
      console.log(`    → OPPOSING contexts produce LESS emergence than ORTHOGONAL ones`);
    }
  }

  console.log("\n" + "═".repeat(60));

  writeFileSync(
    "experiments/results_f_destructive_interference.json",
    JSON.stringify(results, null, 2)
  );
  console.log("Results saved to experiments/results_f_destructive_interference.json");
}

main().catch(console.error);
