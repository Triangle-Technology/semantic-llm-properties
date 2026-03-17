/**
 * EXPERIMENT A: Born Rule Validation
 *
 * Mục tiêu: Kiểm tra xem output distribution của LLM có tuân theo
 * phân phối xác suất có cấu trúc (Born rule analog) hay không.
 *
 * Thiết kế:
 * - Cho cùng một input mơ hồ N lần (temperature > 0)
 * - Thu thập first token/word của mỗi response
 * - Phân tích distribution
 * - So sánh: có tuân theo phân phối ổn định hay random?
 *
 * Prediction từ framework:
 * - Output KHÔNG random — phải có phân phối ổn định
 * - Phân phối phải tập trung quanh vài cluster (semantic attractors)
 * - Tăng N → distribution converge (Born rule analog)
 */

import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

const AMBIGUOUS_PROMPTS = [
  {
    id: "crane",
    prompt: "Complete this sentence with ONE word: The crane ___",
    description: "crane = con hạc / cần cẩu / crane (origami)"
  },
  {
    id: "bank",
    prompt: "Complete this sentence with ONE word: She walked to the bank to ___",
    description: "bank = ngân hàng / bờ sông"
  },
  {
    id: "light",
    prompt: "Complete this sentence with ONE word: The light was ___",
    description: "light = ánh sáng / nhẹ / light (mood)"
  }
];

const N_SAMPLES = 30; // Số lần lặp mỗi prompt
const TEMPERATURE = 1.0; // Maximize non-determinism

async function runSingleQuery(prompt) {
  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001", // Dùng Haiku cho tốc độ & cost
    max_tokens: 5,
    temperature: TEMPERATURE,
    messages: [{ role: "user", content: prompt }]
  });
  return response.content[0].text.trim().toLowerCase().split(/\s+/)[0];
}

async function runExperiment(promptConfig) {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`TEST: "${promptConfig.id}" — ${promptConfig.description}`);
  console.log(`Prompt: "${promptConfig.prompt}"`);
  console.log(`Samples: ${N_SAMPLES} | Temperature: ${TEMPERATURE}`);
  console.log("=".repeat(60));

  const results = [];
  const startTime = Date.now();

  for (let i = 0; i < N_SAMPLES; i++) {
    try {
      const word = await runSingleQuery(promptConfig.prompt);
      results.push(word);
      process.stdout.write(`  [${i + 1}/${N_SAMPLES}] "${word}"\n`);
    } catch (err) {
      console.error(`  [${i + 1}] ERROR: ${err.message}`);
    }
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

  // Phân tích distribution
  const freq = {};
  for (const word of results) {
    freq[word] = (freq[word] || 0) + 1;
  }

  // Sort by frequency
  const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1]);
  const total = results.length;

  console.log(`\n--- DISTRIBUTION (${elapsed}s) ---`);
  for (const [word, count] of sorted) {
    const pct = ((count / total) * 100).toFixed(1);
    const bar = "█".repeat(Math.round(count / total * 40));
    console.log(`  "${word}": ${count}/${total} (${pct}%) ${bar}`);
  }

  // Metrics
  const uniqueWords = sorted.length;
  const topWordPct = (sorted[0][1] / total) * 100;

  // Shannon entropy
  let entropy = 0;
  for (const [, count] of sorted) {
    const p = count / total;
    if (p > 0) entropy -= p * Math.log2(p);
  }
  const maxEntropy = Math.log2(uniqueWords);
  const normalizedEntropy = maxEntropy > 0 ? entropy / maxEntropy : 0;

  // Top-3 concentration
  const top3Count = sorted.slice(0, 3).reduce((sum, [, c]) => sum + c, 0);
  const top3Pct = ((top3Count / total) * 100).toFixed(1);

  console.log(`\n--- ANALYSIS ---`);
  console.log(`  Unique outputs: ${uniqueWords}`);
  console.log(`  Top word: "${sorted[0][0]}" at ${topWordPct.toFixed(1)}%`);
  console.log(`  Top-3 concentration: ${top3Pct}%`);
  console.log(`  Shannon entropy: ${entropy.toFixed(3)} bits`);
  console.log(`  Normalized entropy: ${normalizedEntropy.toFixed(3)} (0=deterministic, 1=uniform)`);

  // Born Rule Test
  console.log(`\n--- BORN RULE ASSESSMENT ---`);
  if (normalizedEntropy < 0.3) {
    console.log(`  ⚡ STRONG ATTRACTOR: Output strongly concentrated → clear semantic attractors`);
  } else if (normalizedEntropy < 0.7) {
    console.log(`  🌊 STRUCTURED DISTRIBUTION: Multiple attractors with clear hierarchy`);
  } else {
    console.log(`  ☁️  DIFFUSE: Near-uniform distribution → weak attractors or high noise`);
  }

  return { id: promptConfig.id, freq: sorted, entropy, normalizedEntropy, uniqueWords, total };
}

async function main() {
  console.log("╔══════════════════════════════════════════════════════════════╗");
  console.log("║  EXPERIMENT A: BORN RULE VALIDATION                        ║");
  console.log("║  Testing if LLM output follows structured probability      ║");
  console.log("║  distribution (Born rule analog)                           ║");
  console.log("╚══════════════════════════════════════════════════════════════╝");

  const allResults = [];

  for (const promptConfig of AMBIGUOUS_PROMPTS) {
    const result = await runExperiment(promptConfig);
    allResults.push(result);
  }

  // Final summary
  console.log("\n" + "═".repeat(60));
  console.log("FINAL SUMMARY");
  console.log("═".repeat(60));

  let bornRuleSupported = true;

  for (const r of allResults) {
    console.log(`\n  [${r.id}]`);
    console.log(`    Unique: ${r.uniqueWords} | Entropy: ${r.normalizedEntropy.toFixed(3)}`);

    if (r.normalizedEntropy > 0.85) {
      console.log(`    ❌ Near-uniform → Born rule NOT supported (looks random)`);
      bornRuleSupported = false;
    } else {
      console.log(`    ✅ Structured distribution → Born rule analog SUPPORTED`);
    }
  }

  console.log("\n" + "═".repeat(60));
  if (bornRuleSupported) {
    console.log("CONCLUSION: Born Rule Analog SUPPORTED");
    console.log("Output follows structured probability distribution,");
    console.log("not random noise. Semantic attractors exist.");
  } else {
    console.log("CONCLUSION: Born Rule Analog NEEDS REVISION");
    console.log("Some distributions appear near-uniform.");
    console.log("Framework may need to account for high-entropy states.");
  }
  console.log("═".repeat(60));

  // Save raw data
  const outputPath = "experiments/results_a_born_rule.json";
  const fs = await import("fs");
  fs.writeFileSync(outputPath, JSON.stringify(allResults, null, 2));
  console.log(`\nRaw data saved to ${outputPath}`);
}

main().catch(console.error);
