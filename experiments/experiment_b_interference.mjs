/**
 * EXPERIMENT B: Interference Measurement
 *
 * Mục tiêu: Chứng minh rằng khi hai context tác động đồng thời,
 * output KHÔNG phải trung bình cộng của từng context riêng lẻ.
 * Đó là interference thực sự.
 *
 * Thiết kế:
 * - Context C₁ đơn lẻ → thu thập output keywords (N lần)
 * - Context C₂ đơn lẻ → thu thập output keywords (N lần)
 * - C₁ + C₂ đồng thời → thu thập output keywords (N lần)
 * - So sánh: C₁+C₂ distribution vs trung bình(C₁, C₂)
 * - Nếu khác biệt có ý nghĩa → interference xác nhận
 *
 * Prediction:
 * - C₁+C₂ sẽ tạo ra keywords MỚI không xuất hiện trong C₁ hay C₂ riêng lẻ
 * - Đó là constructive interference → emergence
 */

import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

const EXPERIMENTS = [
  {
    id: "love",
    base: "Explain love in exactly 5 words.",
    context1: "You are a romantic poet.",
    context2: "You are an evolutionary biologist.",
    combined: "You are simultaneously a romantic poet AND an evolutionary biologist. Hold both perspectives at once.",
  },
  {
    id: "time",
    base: "Describe time in exactly 5 words.",
    context1: "You are a physicist studying relativity.",
    context2: "You are a Buddhist monk meditating.",
    combined: "You are simultaneously a physicist studying relativity AND a Buddhist monk. Hold both perspectives at once.",
  },
  {
    id: "freedom",
    base: "Define freedom in exactly 5 words.",
    context1: "You are a political philosopher.",
    context2: "You are a cage-raised bird just released.",
    combined: "You are simultaneously a political philosopher AND a bird just freed from its cage. Hold both perspectives at once.",
  }
];

const N_SAMPLES = 20;
const TEMPERATURE = 1.0;

async function sample(systemPrompt, userPrompt) {
  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 30,
    temperature: TEMPERATURE,
    system: systemPrompt || undefined,
    messages: [{ role: "user", content: userPrompt }]
  });
  return response.content[0].text.trim().toLowerCase();
}

function extractWords(responses) {
  const wordFreq = {};
  for (const resp of responses) {
    // Split into words, remove punctuation
    const words = resp.replace(/[^a-zA-Z\s]/g, "").split(/\s+/).filter(w => w.length > 2);
    const seen = new Set(); // count each word once per response
    for (const w of words) {
      if (!seen.has(w)) {
        wordFreq[w] = (wordFreq[w] || 0) + 1;
        seen.add(w);
      }
    }
  }
  return wordFreq;
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

function averageFreq(freqA, freqB) {
  const avg = {};
  const allWords = new Set([...Object.keys(freqA), ...Object.keys(freqB)]);
  for (const w of allWords) {
    avg[w] = ((freqA[w] || 0) + (freqB[w] || 0)) / 2;
  }
  return avg;
}

async function runInterferenceTest(config) {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`TEST: "${config.id}"`);
  console.log(`Base: "${config.base}"`);
  console.log(`C₁: "${config.context1}"`);
  console.log(`C₂: "${config.context2}"`);
  console.log("=".repeat(60));

  // Phase 1: Context 1 only
  console.log(`\n  [Phase 1] Running C₁ alone (${N_SAMPLES} samples)...`);
  const responsesC1 = [];
  for (let i = 0; i < N_SAMPLES; i++) {
    const resp = await sample(config.context1, config.base);
    responsesC1.push(resp);
    process.stdout.write(`    ${i + 1}. "${resp}"\n`);
  }

  // Phase 2: Context 2 only
  console.log(`\n  [Phase 2] Running C₂ alone (${N_SAMPLES} samples)...`);
  const responsesC2 = [];
  for (let i = 0; i < N_SAMPLES; i++) {
    const resp = await sample(config.context2, config.base);
    responsesC2.push(resp);
    process.stdout.write(`    ${i + 1}. "${resp}"\n`);
  }

  // Phase 3: Combined
  console.log(`\n  [Phase 3] Running C₁+C₂ combined (${N_SAMPLES} samples)...`);
  const responsesCombined = [];
  for (let i = 0; i < N_SAMPLES; i++) {
    const resp = await sample(config.combined, config.base);
    responsesCombined.push(resp);
    process.stdout.write(`    ${i + 1}. "${resp}"\n`);
  }

  // Analysis
  const freqC1 = extractWords(responsesC1);
  const freqC2 = extractWords(responsesC2);
  const freqCombined = extractWords(responsesCombined);
  const freqAvg = averageFreq(freqC1, freqC2);

  // Key metric: Is combined closer to average(C1,C2) or to something different?
  const simCombinedToAvg = cosineSimilarity(freqCombined, freqAvg);
  const simC1ToC2 = cosineSimilarity(freqC1, freqC2);
  const simCombinedToC1 = cosineSimilarity(freqCombined, freqC1);
  const simCombinedToC2 = cosineSimilarity(freqCombined, freqC2);

  // Emergence: words in combined that appear in NEITHER C1 nor C2
  const wordsC1 = new Set(Object.keys(freqC1));
  const wordsC2 = new Set(Object.keys(freqC2));
  const wordsCombined = new Set(Object.keys(freqCombined));

  const emergentWords = [];
  for (const w of wordsCombined) {
    if (!wordsC1.has(w) && !wordsC2.has(w) && freqCombined[w] >= 2) {
      emergentWords.push({ word: w, count: freqCombined[w] });
    }
  }
  emergentWords.sort((a, b) => b.count - a.count);

  console.log(`\n--- INTERFERENCE ANALYSIS ---`);
  console.log(`  Cosine sim C₁ vs C₂:              ${simC1ToC2.toFixed(3)} (baseline: how different are contexts)`);
  console.log(`  Cosine sim Combined vs Average:     ${simCombinedToAvg.toFixed(3)} (1.0 = no interference)`);
  console.log(`  Cosine sim Combined vs C₁:          ${simCombinedToC1.toFixed(3)}`);
  console.log(`  Cosine sim Combined vs C₂:          ${simCombinedToC2.toFixed(3)}`);

  console.log(`\n--- EMERGENCE ---`);
  console.log(`  Words unique to C₁: ${[...wordsC1].filter(w => !wordsC2.has(w) && !wordsCombined.has(w)).length}`);
  console.log(`  Words unique to C₂: ${[...wordsC2].filter(w => !wordsC1.has(w) && !wordsCombined.has(w)).length}`);
  console.log(`  EMERGENT words (in Combined only, count≥2): ${emergentWords.length}`);
  if (emergentWords.length > 0) {
    for (const ew of emergentWords.slice(0, 10)) {
      console.log(`    ✨ "${ew.word}" (appeared ${ew.count}/${N_SAMPLES} times)`);
    }
  }

  // Top words per condition
  const topN = 8;
  const topWords = (freq) => Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, topN);

  console.log(`\n--- TOP WORDS ---`);
  console.log(`  C₁ only:    ${topWords(freqC1).map(([w, c]) => `${w}(${c})`).join(", ")}`);
  console.log(`  C₂ only:    ${topWords(freqC2).map(([w, c]) => `${w}(${c})`).join(", ")}`);
  console.log(`  Combined:   ${topWords(freqCombined).map(([w, c]) => `${w}(${c})`).join(", ")}`);

  // Verdict
  console.log(`\n--- VERDICT ---`);
  if (simCombinedToAvg < 0.85) {
    console.log(`  ✅ INTERFERENCE CONFIRMED: Combined ≠ Average(C₁, C₂)`);
    console.log(`     Deviation from average: ${((1 - simCombinedToAvg) * 100).toFixed(1)}%`);
  } else {
    console.log(`  ❌ NO SIGNIFICANT INTERFERENCE: Combined ≈ Average(C₁, C₂)`);
  }

  if (emergentWords.length >= 2) {
    console.log(`  ✅ EMERGENCE CONFIRMED: ${emergentWords.length} new concepts appeared`);
  } else {
    console.log(`  ⚠️  WEAK EMERGENCE: Few/no truly new concepts`);
  }

  return {
    id: config.id,
    simCombinedToAvg,
    simC1ToC2,
    simCombinedToC1,
    simCombinedToC2,
    emergentWords,
    responsesC1,
    responsesC2,
    responsesCombined
  };
}

async function main() {
  console.log("╔══════════════════════════════════════════════════════════════╗");
  console.log("║  EXPERIMENT B: INTERFERENCE MEASUREMENT                    ║");
  console.log("║  Testing if C₁+C₂ ≠ Average(C₁, C₂)                      ║");
  console.log("║  Looking for emergence through constructive interference   ║");
  console.log("╚══════════════════════════════════════════════════════════════╝");

  const allResults = [];
  for (const config of EXPERIMENTS) {
    const result = await runInterferenceTest(config);
    allResults.push(result);
  }

  console.log("\n" + "═".repeat(60));
  console.log("FINAL SUMMARY");
  console.log("═".repeat(60));

  let interferenceCount = 0;
  let emergenceCount = 0;

  for (const r of allResults) {
    const hasInterference = r.simCombinedToAvg < 0.85;
    const hasEmergence = r.emergentWords.length >= 2;
    if (hasInterference) interferenceCount++;
    if (hasEmergence) emergenceCount++;

    console.log(`\n  [${r.id}] Interference: ${hasInterference ? "✅" : "❌"} | Emergence: ${hasEmergence ? "✅" : "⚠️"}`);
  }

  console.log("\n" + "═".repeat(60));
  console.log(`Interference confirmed: ${interferenceCount}/${allResults.length} tests`);
  console.log(`Emergence confirmed: ${emergenceCount}/${allResults.length} tests`);

  if (interferenceCount >= 2) {
    console.log("\nCONCLUSION: Semantic Interference is REAL.");
    console.log("Combined contexts produce qualitatively different output,");
    console.log("not just a blend of individual contexts.");
  }
  console.log("═".repeat(60));

  const fs = await import("fs");
  fs.writeFileSync("experiments/results_b_interference.json", JSON.stringify(allResults, null, 2));
  console.log("\nRaw data saved to experiments/results_b_interference.json");
}

main().catch(console.error);
