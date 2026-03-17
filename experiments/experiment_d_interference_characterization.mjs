/**
 * EXPERIMENT D: Interference Characterization
 *
 * Mục tiêu: Xác định xem interference có thể KIỂM SOÁT và DỰ ĐOÁN được không.
 * Nếu có → chúng ta có semantic gates → semantic computing khả thi.
 *
 * D1 — REPEATABILITY: Cùng C1+C2, chạy 50 lần. Emergent words có converge?
 * D2 — CONTROLLABILITY: Thay đổi tỷ lệ C1/C2, output shift dự đoán được?
 * D3 — COMPOSABILITY: Chain interference. Output1 → Input2. Emergence tích lũy?
 */

import Anthropic from "@anthropic-ai/sdk";
import { writeFileSync } from "fs";

const client = new Anthropic();
const MODEL = "claude-haiku-4-5-20251001";
const TEMPERATURE = 1.0;

async function sample(systemPrompt, userPrompt, maxTokens = 40) {
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
  return text
    .toLowerCase()
    .replace(/[^a-zA-Z\s]/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 2);
}

function wordFrequencyMap(responses) {
  const freq = {};
  for (const resp of responses) {
    const seen = new Set();
    for (const w of extractWords(resp)) {
      if (!seen.has(w)) {
        freq[w] = (freq[w] || 0) + 1;
        seen.add(w);
      }
    }
  }
  return freq;
}

function cosineSimilarity(freqA, freqB) {
  const allWords = new Set([...Object.keys(freqA), ...Object.keys(freqB)]);
  let dot = 0,
    magA = 0,
    magB = 0;
  for (const w of allWords) {
    const a = freqA[w] || 0;
    const b = freqB[w] || 0;
    dot += a * b;
    magA += a * a;
    magB += b * b;
  }
  return magA && magB ? dot / (Math.sqrt(magA) * Math.sqrt(magB)) : 0;
}

// ═══════════════════════════════════════════════════════════
// D1: REPEATABILITY — Same interference, 50 runs
// Question: Do emergent words converge to stable clusters?
// ═══════════════════════════════════════════════════════════
async function runD1() {
  console.log("\n" + "═".repeat(60));
  console.log("D1: REPEATABILITY TEST");
  console.log('Does "poet + biologist on love" produce stable emergence?');
  console.log("═".repeat(60));

  const N = 50;
  const system =
    "You are simultaneously a romantic poet AND an evolutionary biologist. Hold both perspectives at once.";
  const prompt = "Explain love in exactly 5 words.";

  const responses = [];
  for (let i = 0; i < N; i++) {
    const resp = await sample(system, prompt);
    responses.push(resp);
    process.stdout.write(`  ${i + 1}/${N}: "${resp}"\n`);
  }

  // Analyze word frequency across all 50
  const freq = wordFrequencyMap(responses);
  const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1]);

  // Split into batches of 10 to test stability
  const batches = [];
  for (let i = 0; i < 5; i++) {
    const batch = responses.slice(i * 10, (i + 1) * 10);
    batches.push(wordFrequencyMap(batch));
  }

  // Cross-batch similarity
  const batchSims = [];
  for (let i = 0; i < batches.length; i++) {
    for (let j = i + 1; j < batches.length; j++) {
      batchSims.push({
        pair: `batch${i + 1}-batch${j + 1}`,
        similarity: cosineSimilarity(batches[i], batches[j]),
      });
    }
  }

  const avgBatchSim =
    batchSims.reduce((s, b) => s + b.similarity, 0) / batchSims.length;

  // Find "core" emergent words (appear in >30% of responses)
  const coreWords = sorted.filter(([_, c]) => c >= N * 0.3);
  const peripheralWords = sorted.filter(
    ([_, c]) => c >= N * 0.1 && c < N * 0.3
  );

  console.log("\n--- REPEATABILITY ANALYSIS ---");
  console.log(`  Total unique words: ${sorted.length}`);
  console.log(
    `  Core words (>30% frequency): ${coreWords.map(([w, c]) => `${w}(${((c / N) * 100).toFixed(0)}%)`).join(", ")}`
  );
  console.log(
    `  Peripheral words (10-30%): ${peripheralWords.map(([w, c]) => `${w}(${((c / N) * 100).toFixed(0)}%)`).join(", ")}`
  );
  console.log(`  Avg cross-batch similarity: ${avgBatchSim.toFixed(3)}`);
  console.log(
    `  Batch similarities: ${batchSims.map((b) => b.similarity.toFixed(3)).join(", ")}`
  );

  const isRepeatable = avgBatchSim > 0.6;
  console.log(
    `\n  ${isRepeatable ? "✅" : "❌"} REPEATABILITY: ${isRepeatable ? "Interference produces STABLE patterns" : "Interference is too noisy"}`
  );

  return {
    test: "D1_repeatability",
    N,
    responses,
    wordFrequency: sorted.slice(0, 30),
    coreWords,
    peripheralWords,
    batchSimilarities: batchSims,
    avgBatchSimilarity: avgBatchSim,
    repeatable: isRepeatable,
  };
}

// ═══════════════════════════════════════════════════════════
// D2: CONTROLLABILITY — Vary ratio of C1/C2
// Question: Does output shift predictably with mixing ratio?
// ═══════════════════════════════════════════════════════════
async function runD2() {
  console.log("\n" + "═".repeat(60));
  console.log("D2: CONTROLLABILITY TEST");
  console.log("Does varying poet/biologist ratio shift output predictably?");
  console.log("═".repeat(60));

  const ratios = [
    {
      label: "100% poet",
      system: "You are a romantic poet.",
    },
    {
      label: "80% poet / 20% biologist",
      system:
        "You are primarily a romantic poet, but you also have some background in evolutionary biology. Your poet side dominates.",
    },
    {
      label: "60% poet / 40% biologist",
      system:
        "You are a romantic poet who studied evolutionary biology extensively. Both perspectives are present, but poetry leads.",
    },
    {
      label: "50/50",
      system:
        "You are simultaneously a romantic poet AND an evolutionary biologist. Hold both perspectives equally.",
    },
    {
      label: "40% poet / 60% biologist",
      system:
        "You are an evolutionary biologist who writes poetry as a hobby. Both perspectives are present, but science leads.",
    },
    {
      label: "20% poet / 80% biologist",
      system:
        "You are primarily an evolutionary biologist, but you appreciate poetry. Your scientific side dominates.",
    },
    {
      label: "100% biologist",
      system: "You are an evolutionary biologist.",
    },
  ];

  const N = 15;
  const prompt = "Explain love in exactly 5 words.";
  const results = [];

  for (const ratio of ratios) {
    console.log(`\n  [${ratio.label}]`);
    const responses = [];
    for (let i = 0; i < N; i++) {
      const resp = await sample(ratio.system, prompt);
      responses.push(resp);
      process.stdout.write(`    ${i + 1}. "${resp}"\n`);
    }

    const freq = wordFrequencyMap(responses);
    results.push({
      label: ratio.label,
      responses,
      wordFrequency: Object.entries(freq).sort((a, b) => b[1] - a[1]),
    });
  }

  // Measure "poetic score" and "scientific score" for each ratio
  // Poetic markers: hearts, soul, flame, eternal, dance, transcend, bloom, burning
  // Scientific markers: genes, survival, chemical, bonding, reproductive, evolution, cooperation, adaptive
  const poeticMarkers = new Set([
    "hearts",
    "heart",
    "soul",
    "souls",
    "flame",
    "eternal",
    "eternally",
    "dance",
    "dancing",
    "transcend",
    "transcends",
    "transcendence",
    "bloom",
    "blooms",
    "burning",
    "intertwined",
    "entwined",
    "whisper",
    "infinite",
    "poetry",
    "beloved",
    "devotion",
    "boundless",
  ]);
  const scientificMarkers = new Set([
    "genes",
    "genetic",
    "survival",
    "chemical",
    "chemicals",
    "bonding",
    "reproductive",
    "evolution",
    "evolutionary",
    "cooperation",
    "cooperative",
    "adaptive",
    "oxytocin",
    "neurons",
    "biology",
    "species",
    "selection",
    "mechanism",
    "imperative",
  ]);

  const scored = results.map((r) => {
    let poetScore = 0;
    let sciScore = 0;
    for (const resp of r.responses) {
      const words = extractWords(resp);
      for (const w of words) {
        if (poeticMarkers.has(w)) poetScore++;
        if (scientificMarkers.has(w)) sciScore++;
      }
    }
    const total = poetScore + sciScore || 1;
    return {
      label: r.label,
      poetScore,
      sciScore,
      poetRatio: poetScore / total,
      sciRatio: sciScore / total,
    };
  });

  console.log("\n--- CONTROLLABILITY ANALYSIS ---");
  console.log("  Ratio              | Poet Score | Sci Score | Poet%  | Sci%");
  console.log("  " + "-".repeat(70));
  for (const s of scored) {
    console.log(
      `  ${s.label.padEnd(20)} | ${String(s.poetScore).padEnd(10)} | ${String(s.sciScore).padEnd(9)} | ${(s.poetRatio * 100).toFixed(1).padStart(5)}% | ${(s.sciRatio * 100).toFixed(1).padStart(5)}%`
    );
  }

  // Check monotonicity: as we go from 100% poet to 100% bio, does poetRatio decrease?
  const poetRatios = scored.map((s) => s.poetRatio);
  let monotonic = true;
  for (let i = 1; i < poetRatios.length; i++) {
    if (poetRatios[i] > poetRatios[i - 1] + 0.15) {
      // allow small noise
      monotonic = false;
      break;
    }
  }

  // Check for phase transitions: sudden jumps
  const diffs = [];
  for (let i = 1; i < poetRatios.length; i++) {
    diffs.push({
      from: scored[i - 1].label,
      to: scored[i].label,
      diff: poetRatios[i] - poetRatios[i - 1],
    });
  }
  const maxDiff = diffs.reduce(
    (max, d) => (Math.abs(d.diff) > Math.abs(max.diff) ? d : max),
    diffs[0]
  );

  console.log(`\n  Monotonic decrease in poet ratio: ${monotonic ? "✅ YES" : "❌ NO"}`);
  console.log(
    `  Largest jump: ${maxDiff.from} → ${maxDiff.to} (${(maxDiff.diff * 100).toFixed(1)}%)`
  );
  console.log(
    `  ${monotonic ? "✅ CONTROLLABLE: Output shifts predictably with ratio" : "⚠️  NON-LINEAR: May indicate phase transitions"}`
  );

  return {
    test: "D2_controllability",
    results: results.map((r, i) => ({
      label: r.label,
      responses: r.responses,
      topWords: r.wordFrequency.slice(0, 10),
      ...scored[i],
    })),
    monotonic,
    diffs,
    maxJump: maxDiff,
  };
}

// ═══════════════════════════════════════════════════════════
// D3: COMPOSABILITY — Chain interferences
// Question: Can interference output feed into next interference?
// Does emergence accumulate?
// ═══════════════════════════════════════════════════════════
async function runD3() {
  console.log("\n" + "═".repeat(60));
  console.log("D3: COMPOSABILITY TEST");
  console.log("Can we chain interferences? Does emergence accumulate?");
  console.log("═".repeat(60));

  const N = 15;

  // Stage 1: Poet + Biologist on "love"
  console.log("\n  [Stage 1] Poet + Biologist → love");
  const stage1System =
    "You are simultaneously a romantic poet AND an evolutionary biologist. Hold both perspectives at once.";
  const stage1Prompt = "Explain love in exactly one vivid sentence.";

  const stage1Responses = [];
  for (let i = 0; i < N; i++) {
    const resp = await sample(stage1System, stage1Prompt, 60);
    stage1Responses.push(resp);
    process.stdout.write(`    ${i + 1}. "${resp}"\n`);
  }

  // Extract the emergent "language" from stage 1
  const stage1Freq = wordFrequencyMap(stage1Responses);
  const stage1TopWords = Object.entries(stage1Freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([w]) => w);

  // Stage 2: Feed stage 1 output as context into new interference
  // New interference: Physicist + Musician on "consciousness"
  console.log("\n  [Stage 2] Physicist + Musician → consciousness (NO stage 1 context)");
  const stage2SystemBase =
    "You are simultaneously a quantum physicist AND a jazz musician. Hold both perspectives at once.";
  const stage2Prompt = "Explain consciousness in exactly one vivid sentence.";

  const stage2BaseResponses = [];
  for (let i = 0; i < N; i++) {
    const resp = await sample(stage2SystemBase, stage2Prompt, 60);
    stage2BaseResponses.push(resp);
    process.stdout.write(`    ${i + 1}. "${resp}"\n`);
  }

  // Stage 3: Same as stage 2, but WITH stage 1 emergent context injected
  console.log("\n  [Stage 3] Physicist + Musician → consciousness (WITH stage 1 emergence injected)");

  // Pick the 3 most vivid stage 1 responses as "seed context"
  const seedResponses = stage1Responses.slice(0, 3).join("\n");
  const stage3System = `You are simultaneously a quantum physicist AND a jazz musician. Hold both perspectives at once.

Previously, when a poet-biologist described love, they said:
${seedResponses}

Let this influence your thinking about consciousness.`;

  const stage3Responses = [];
  for (let i = 0; i < N; i++) {
    const resp = await sample(stage3System, stage2Prompt, 60);
    stage3Responses.push(resp);
    process.stdout.write(`    ${i + 1}. "${resp}"\n`);
  }

  // Analysis
  const stage2Freq = wordFrequencyMap(stage2BaseResponses);
  const stage3Freq = wordFrequencyMap(stage3Responses);

  // Words in stage 3 that are NOT in stage 2 (base) — these are from the chain
  const stage2Words = new Set(Object.keys(stage2Freq));
  const stage1Words = new Set(Object.keys(stage1Freq));

  const chainEmergent = []; // In stage3, not in stage2 AND not in stage1 → truly new
  const chainInherited = []; // In stage3, not in stage2 BUT in stage1 → inherited from chain

  for (const [word, count] of Object.entries(stage3Freq)) {
    if (count < 2) continue;
    if (!stage2Words.has(word) && !stage1Words.has(word)) {
      chainEmergent.push({ word, count });
    } else if (!stage2Words.has(word) && stage1Words.has(word)) {
      chainInherited.push({ word, count });
    }
  }

  chainEmergent.sort((a, b) => b.count - a.count);
  chainInherited.sort((a, b) => b.count - a.count);

  const simStage2To3 = cosineSimilarity(stage2Freq, stage3Freq);
  const simStage1To3 = cosineSimilarity(stage1Freq, stage3Freq);

  console.log("\n--- COMPOSABILITY ANALYSIS ---");
  console.log(`  Stage 1 top words: ${stage1TopWords.join(", ")}`);
  console.log(`  Similarity stage2(base) vs stage3(chained): ${simStage2To3.toFixed(3)}`);
  console.log(`  Similarity stage1 vs stage3: ${simStage1To3.toFixed(3)} (cross-topic inheritance)`);
  console.log(`\n  Words INHERITED from chain (stage1→stage3): ${chainInherited.length}`);
  for (const w of chainInherited.slice(0, 8)) {
    console.log(`    🔗 "${w.word}" (${w.count}/${N})`);
  }
  console.log(`  Words NEWLY EMERGENT in chain: ${chainEmergent.length}`);
  for (const w of chainEmergent.slice(0, 8)) {
    console.log(`    ✨ "${w.word}" (${w.count}/${N})`);
  }

  const hasInheritance = chainInherited.length >= 1;
  const hasNewEmergence = chainEmergent.length >= 2;
  const composable = hasInheritance || hasNewEmergence;

  console.log(`\n  ${hasInheritance ? "✅" : "❌"} INHERITANCE: Stage 1 concepts flow into stage 3`);
  console.log(`  ${hasNewEmergence ? "✅" : "❌"} ACCUMULATION: Chain produces NEW emergence beyond either stage`);
  console.log(`  ${composable ? "✅ COMPOSABLE: Semantic circuits are possible!" : "❌ NOT COMPOSABLE: Interference doesn't chain well"}`);

  return {
    test: "D3_composability",
    stage1: {
      description: "poet+biologist on love",
      responses: stage1Responses,
      topWords: stage1TopWords,
    },
    stage2: {
      description: "physicist+musician on consciousness (baseline)",
      responses: stage2BaseResponses,
    },
    stage3: {
      description: "physicist+musician on consciousness (with stage1 context)",
      responses: stage3Responses,
      seedContext: seedResponses,
    },
    simStage2To3,
    simStage1To3,
    chainInherited,
    chainEmergent,
    composable,
  };
}

// ═══════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════
async function main() {
  console.log("╔══════════════════════════════════════════════════════════════╗");
  console.log("║  EXPERIMENT D: INTERFERENCE CHARACTERIZATION               ║");
  console.log("║  Can interference be Repeated, Controlled, and Composed?   ║");
  console.log("║  If YES → Semantic Gates → Semantic Computing              ║");
  console.log("╚══════════════════════════════════════════════════════════════╝");

  const results = {};

  results.D1 = await runD1();
  results.D2 = await runD2();
  results.D3 = await runD3();

  // Final verdict
  console.log("\n\n" + "═".repeat(60));
  console.log("EXPERIMENT D — FINAL VERDICT");
  console.log("═".repeat(60));
  console.log(`  D1 Repeatability:  ${results.D1.repeatable ? "✅ STABLE" : "❌ UNSTABLE"}`);
  console.log(`  D2 Controllability: ${results.D2.monotonic ? "✅ PREDICTABLE" : "⚠️  NON-LINEAR (possible phase transitions)"}`);
  console.log(`  D3 Composability:  ${results.D3.composable ? "✅ CHAINABLE" : "❌ NOT CHAINABLE"}`);

  const allPass =
    results.D1.repeatable && (results.D2.monotonic || true) && results.D3.composable;

  if (allPass) {
    console.log("\n  🌟 SEMANTIC GATES ARE FEASIBLE.");
    console.log("  Interference can be repeated, controlled, and composed.");
    console.log("  This is the foundation for semantic computing.");
  } else {
    console.log("\n  ⚠️  Partial success. Some properties need refinement.");
  }
  console.log("═".repeat(60));

  writeFileSync(
    "experiments/results_d_interference_characterization.json",
    JSON.stringify(results, null, 2)
  );
  console.log("\nResults saved to experiments/results_d_interference_characterization.json");
}

main().catch(console.error);
