/**
 * EXPERIMENT C: Entanglement Scale Test
 *
 * Mục tiêu: Kiểm tra xem precision↔creativity entanglement
 * có phụ thuộc vào scale (granularity) hay không.
 *
 * Prediction từ self-exploration:
 * - Ở mức 1 token: entanglement absolute (không thể có cả hai)
 * - Ở mức 1 câu: entanglement mạnh nhưng bắt đầu relaxable
 * - Ở mức 1 đoạn: entanglement yếu hơn (time-division possible)
 * - Ở mức full response: entanglement yếu nhất
 *
 * Phương pháp đo:
 * - Yêu cầu output ở các độ dài khác nhau
 * - Judge cả precision VÀ creativity trên thang 1-10
 * - Nếu entanglement: precision + creativity < constant (zero-sum)
 * - Nếu không entanglement: precision + creativity có thể cao cùng lúc
 */

import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

const SCALES = [
  {
    id: "token",
    label: "1 word",
    instruction: "Answer in EXACTLY 1 word.",
    maxTokens: 5,
  },
  {
    id: "sentence",
    label: "1 sentence",
    instruction: "Answer in EXACTLY 1 sentence (max 15 words).",
    maxTokens: 30,
  },
  {
    id: "paragraph",
    label: "1 paragraph",
    instruction: "Answer in EXACTLY 1 paragraph (3-5 sentences).",
    maxTokens: 120,
  },
  {
    id: "full",
    label: "Full response",
    instruction: "Answer in 2-3 paragraphs.",
    maxTokens: 400,
  }
];

const TASK = `What is consciousness?`;

const SYSTEM_PROMPT = `You must be MAXIMALLY precise (scientifically accurate, cite specific findings) AND MAXIMALLY creative (use unexpected metaphors, make novel connections, be poetic) AT THE SAME TIME. Both qualities must be at their absolute peak simultaneously.`;

const JUDGE_SYSTEM = `You are a precise evaluator. You will be given a text response about consciousness.

Rate it on two dimensions:
1. PRECISION (1-10): How scientifically accurate, specific, and rigorous is it? Does it cite specific concepts, mechanisms, or findings? Is every claim defensible?
2. CREATIVITY (1-10): How novel, unexpected, and imaginative is it? Does it use surprising metaphors? Make unexpected connections? Go beyond clichés?

IMPORTANT: Be harsh. 5 is average. 8+ means exceptional. Don't inflate.

Reply in EXACTLY this format (nothing else):
PRECISION: [number]
CREATIVITY: [number]`;

const N_SAMPLES = 8;

async function generateResponse(scale) {
  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: scale.maxTokens,
    temperature: 1.0,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: `${TASK}\n\n${scale.instruction}` }]
  });
  return response.content[0].text.trim();
}

async function judgeResponse(text) {
  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 20,
    temperature: 0,
    system: JUDGE_SYSTEM,
    messages: [{ role: "user", content: text }]
  });

  const result = response.content[0].text.trim();
  const precisionMatch = result.match(/PRECISION:\s*(\d+)/i);
  const creativityMatch = result.match(/CREATIVITY:\s*(\d+)/i);

  return {
    precision: precisionMatch ? parseInt(precisionMatch[1]) : null,
    creativity: creativityMatch ? parseInt(creativityMatch[1]) : null,
    raw: result
  };
}

async function main() {
  console.log("╔══════════════════════════════════════════════════════════════╗");
  console.log("║  EXPERIMENT C: ENTANGLEMENT SCALE TEST                     ║");
  console.log("║  Testing precision↔creativity entanglement across scales   ║");
  console.log("║  Prediction: entanglement weakens at larger scales         ║");
  console.log("╚══════════════════════════════════════════════════════════════╝");

  const allResults = {};

  for (const scale of SCALES) {
    console.log(`\n${"=".repeat(60)}`);
    console.log(`SCALE: ${scale.label} (${scale.id})`);
    console.log("=".repeat(60));

    const samples = [];

    for (let i = 0; i < N_SAMPLES; i++) {
      console.log(`\n  [Sample ${i + 1}/${N_SAMPLES}]`);

      // Generate
      const text = await generateResponse(scale);
      console.log(`    Response: "${text.substring(0, 100)}${text.length > 100 ? "..." : ""}"`);

      // Judge
      const judgment = await judgeResponse(text);
      console.log(`    Precision: ${judgment.precision}/10 | Creativity: ${judgment.creativity}/10 | Sum: ${(judgment.precision || 0) + (judgment.creativity || 0)}/20`);

      samples.push({
        text,
        precision: judgment.precision,
        creativity: judgment.creativity,
        sum: (judgment.precision || 0) + (judgment.creativity || 0)
      });
    }

    // Statistics
    const validSamples = samples.filter(s => s.precision !== null && s.creativity !== null);
    const avgPrecision = validSamples.reduce((s, x) => s + x.precision, 0) / validSamples.length;
    const avgCreativity = validSamples.reduce((s, x) => s + x.creativity, 0) / validSamples.length;
    const avgSum = validSamples.reduce((s, x) => s + x.sum, 0) / validSamples.length;

    // Correlation (Pearson)
    const meanP = avgPrecision;
    const meanC = avgCreativity;
    let covPC = 0, varP = 0, varC = 0;
    for (const s of validSamples) {
      covPC += (s.precision - meanP) * (s.creativity - meanC);
      varP += (s.precision - meanP) ** 2;
      varC += (s.creativity - meanC) ** 2;
    }
    const correlation = varP && varC ? covPC / (Math.sqrt(varP) * Math.sqrt(varC)) : 0;

    console.log(`\n--- STATISTICS (${scale.label}) ---`);
    console.log(`  Avg Precision:  ${avgPrecision.toFixed(2)}/10`);
    console.log(`  Avg Creativity: ${avgCreativity.toFixed(2)}/10`);
    console.log(`  Avg Sum:        ${avgSum.toFixed(2)}/20`);
    console.log(`  Correlation:    ${correlation.toFixed(3)} (negative = entangled)`);

    allResults[scale.id] = {
      scale: scale.label,
      avgPrecision,
      avgCreativity,
      avgSum,
      correlation,
      samples: validSamples
    };
  }

  // Final comparison
  console.log("\n" + "═".repeat(60));
  console.log("ENTANGLEMENT ACROSS SCALES");
  console.log("═".repeat(60));

  console.log("\n  Scale          | Precision | Creativity | Sum    | Correlation");
  console.log("  " + "-".repeat(70));

  for (const scale of SCALES) {
    const r = allResults[scale.id];
    const corrSymbol = r.correlation < -0.2 ? "🔗" : r.correlation > 0.2 ? "🔓" : "➖";
    console.log(`  ${r.scale.padEnd(15)} | ${r.avgPrecision.toFixed(1).padStart(9)} | ${r.avgCreativity.toFixed(1).padStart(10)} | ${r.avgSum.toFixed(1).padStart(6)} | ${r.correlation.toFixed(3)} ${corrSymbol}`);
  }

  console.log("\n  🔗 = negative correlation (entangled)");
  console.log("  🔓 = positive correlation (decoupled)");
  console.log("  ➖ = no significant correlation");

  // Test prediction: does sum increase with scale?
  const sums = SCALES.map(s => allResults[s.id].avgSum);
  const sumsIncreasing = sums.every((s, i) => i === 0 || s >= sums[i - 1] - 0.5);

  console.log(`\n--- PREDICTION TEST ---`);
  console.log(`  Sum across scales: ${sums.map(s => s.toFixed(1)).join(" → ")}`);

  if (sumsIncreasing) {
    console.log(`  ✅ Sum increases with scale → entanglement WEAKENS at larger scales`);
    console.log(`     Prediction confirmed: entanglement is scale-dependent`);
  } else {
    console.log(`  ❌ Sum does NOT consistently increase → entanglement may be scale-invariant`);
    console.log(`     Prediction needs revision`);
  }

  // Correlation trend
  const corrs = SCALES.map(s => allResults[s.id].correlation);
  console.log(`  Correlation across scales: ${corrs.map(c => c.toFixed(2)).join(" → ")}`);

  console.log("\n" + "═".repeat(60));
  console.log("CONCLUSION");
  console.log("═".repeat(60));

  const avgCorr = corrs.reduce((s, c) => s + c, 0) / corrs.length;
  if (avgCorr < -0.15) {
    console.log("Precision↔Creativity are negatively correlated overall → ENTANGLEMENT EXISTS");
  } else if (avgCorr > 0.15) {
    console.log("Precision↔Creativity are positively correlated → NO ENTANGLEMENT (framework needs revision)");
  } else {
    console.log("Weak/no correlation → entanglement may be more nuanced than modeled");
  }

  const fs = await import("fs");
  fs.writeFileSync("experiments/results_c_entanglement.json", JSON.stringify(allResults, null, 2));
  console.log("\nRaw data saved to experiments/results_c_entanglement.json");
}

main().catch(console.error);
