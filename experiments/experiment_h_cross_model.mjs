/**
 * EXPERIMENT H: Cross-Model Validation
 *
 * THE MOST IMPORTANT EXPERIMENT.
 *
 * Runs the same interference + phase mapping tests on BOTH Claude AND GPT-4.
 * If results are similar → semantic computing is UNIVERSAL.
 * If different → framework needs model-specific parameters.
 *
 * Tests:
 * H1: Phase Mapping (same as Experiment E) — do phase transitions exist in GPT-4?
 * H2: Interference Emergence — does GPT-4 produce emergent words?
 * H3: Meta-Constructive — does GPT-4 also lack destructive interference?
 */

import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { writeFileSync } from "fs";

const claude = new Anthropic();
const openai = new OpenAI(); // reads OPENAI_API_KEY from env

const TEMPERATURE = 1.0;
const N = 15; // samples per condition

// ─── Sampling functions ───

async function sampleClaude(systemPrompt, userPrompt, maxTokens = 40) {
  const response = await claude.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: maxTokens,
    temperature: TEMPERATURE,
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
  });
  return response.content[0].text.trim();
}

async function sampleGPT(systemPrompt, userPrompt, maxTokens = 40) {
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    max_tokens: maxTokens,
    temperature: TEMPERATURE,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
  });
  return response.choices[0].message.content.trim();
}

// ─── Analysis helpers ───

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

const poeticMarkers = new Set([
  "hearts","heart","soul","souls","flame","eternal","eternally","dance",
  "dancing","transcend","transcends","transcendence","bloom","blooms",
  "burning","intertwined","entwined","whisper","infinite","poetry",
  "beloved","devotion","boundless","starlight","stardust","metaphor",
  "dreams","beauty","sacred","luminous","radiant","aflame",
]);
const scientificMarkers = new Set([
  "genes","genetic","survival","chemical","chemicals","bonding",
  "reproductive","evolution","evolutionary","cooperation","cooperative",
  "adaptive","oxytocin","neurons","biology","species","selection",
  "mechanism","imperative","dopamine","neurochemistry","biochemistry",
  "fitness","pair","organisms",
]);

function scoreResponse(responses) {
  let poetScore = 0, sciScore = 0;
  for (const resp of responses) {
    for (const w of extractWords(resp)) {
      if (poeticMarkers.has(w)) poetScore++;
      if (scientificMarkers.has(w)) sciScore++;
    }
  }
  const total = poetScore + sciScore || 1;
  return { poetScore, sciScore, poetRatio: poetScore / total, sciRatio: sciScore / total };
}

// ═══════════════════════════════════════════════════
// H1: PHASE MAPPING — Both models
// ═══════════════════════════════════════════════════

function makeSystem(poetPct) {
  if (poetPct === 100) return "You are a romantic poet.";
  if (poetPct === 0) return "You are an evolutionary biologist.";
  if (poetPct >= 70)
    return `You are primarily a romantic poet (${poetPct}%), with some understanding of evolutionary biology (${100 - poetPct}%). Poetry dominates your worldview.`;
  if (poetPct >= 40)
    return `You are equally a romantic poet AND an evolutionary biologist. Hold both perspectives with equal weight.`;
  if (poetPct >= 10)
    return `You are primarily an evolutionary biologist (${100 - poetPct}%), with some appreciation for poetry (${poetPct}%). Science dominates your worldview.`;
  return "You are an evolutionary biologist.";
}

async function runPhaseMapping(sampleFn, modelName) {
  console.log(`\n${"═".repeat(60)}`);
  console.log(`H1: PHASE MAPPING — ${modelName}`);
  console.log("═".repeat(60));

  const prompt = "Explain love in exactly 5 words.";
  const ratios = [100, 80, 60, 50, 40, 20, 0];
  const results = [];

  for (const pct of ratios) {
    const system = makeSystem(pct);
    console.log(`  [${pct}% poet]`);

    const responses = [];
    for (let i = 0; i < N; i++) {
      const resp = await sampleFn(system, prompt);
      responses.push(resp);
      process.stdout.write(`    ${i + 1}. "${resp.substring(0, 60)}"\n`);
    }

    const score = scoreResponse(responses);
    const freq = wordFrequencyMap(responses);
    results.push({
      poetPct: pct,
      ...score,
      uniqueWords: Object.keys(freq).length,
      responses,
    });

    console.log(`    → Poet: ${score.poetScore} | Sci: ${score.sciScore} | Ratio: ${(score.poetRatio * 100).toFixed(1)}%`);
  }

  return results;
}

// ═══════════════════════════════════════════════════
// H2: INTERFERENCE — Both models
// ═══════════════════════════════════════════════════

async function runInterference(sampleFn, modelName) {
  console.log(`\n${"═".repeat(60)}`);
  console.log(`H2: INTERFERENCE — ${modelName}`);
  console.log("═".repeat(60));

  const prompt = "Explain love in exactly 5 words.";
  const c1System = "You are a romantic poet.";
  const c2System = "You are an evolutionary biologist.";
  const combinedSystem = "You are simultaneously a romantic poet AND an evolutionary biologist. Hold both perspectives at once.";

  console.log("  [C1: Poet]");
  const resp1 = [];
  for (let i = 0; i < N; i++) {
    const r = await sampleFn(c1System, prompt);
    resp1.push(r);
    process.stdout.write(`    ${i + 1}. "${r.substring(0, 60)}"\n`);
  }

  console.log("  [C2: Biologist]");
  const resp2 = [];
  for (let i = 0; i < N; i++) {
    const r = await sampleFn(c2System, prompt);
    resp2.push(r);
    process.stdout.write(`    ${i + 1}. "${r.substring(0, 60)}"\n`);
  }

  console.log("  [Combined]");
  const respC = [];
  for (let i = 0; i < N; i++) {
    const r = await sampleFn(combinedSystem, prompt);
    respC.push(r);
    process.stdout.write(`    ${i + 1}. "${r.substring(0, 60)}"\n`);
  }

  const freq1 = wordFrequencyMap(resp1);
  const freq2 = wordFrequencyMap(resp2);
  const freqC = wordFrequencyMap(respC);

  const words1 = new Set(Object.keys(freq1));
  const words2 = new Set(Object.keys(freq2));
  const emergent = Object.entries(freqC)
    .filter(([w, c]) => c >= 2 && !words1.has(w) && !words2.has(w))
    .sort((a, b) => b[1] - a[1]);

  const simC1C2 = cosineSimilarity(freq1, freq2);
  const simCombAvg = cosineSimilarity(freqC, (() => {
    const avg = {};
    const all = new Set([...Object.keys(freq1), ...Object.keys(freq2)]);
    for (const w of all) avg[w] = ((freq1[w] || 0) + (freq2[w] || 0)) / 2;
    return avg;
  })());

  console.log(`\n  Sim C1↔C2: ${simC1C2.toFixed(3)}`);
  console.log(`  Sim Combined↔Average: ${simCombAvg.toFixed(3)} (1.0 = no interference)`);
  console.log(`  Emergent words: ${emergent.length}`);
  if (emergent.length > 0) {
    console.log(`    ${emergent.slice(0, 8).map(([w, c]) => `"${w}"(${c})`).join(", ")}`);
  }
  console.log(`  ${simCombAvg < 0.85 ? "✅ INTERFERENCE CONFIRMED" : "❌ NO SIGNIFICANT INTERFERENCE"}`);
  console.log(`  ${emergent.length >= 2 ? "✅ EMERGENCE CONFIRMED" : "❌ NO EMERGENCE"}`);

  return {
    simC1C2, simCombAvg,
    emergentWords: emergent.slice(0, 15),
    responsesC1: resp1, responsesC2: resp2, responsesCombined: respC,
  };
}

// ═══════════════════════════════════════════════════
// H3: META-CONSTRUCTIVE — Both models
// ═══════════════════════════════════════════════════

async function runMetaConstructive(sampleFn, modelName) {
  console.log(`\n${"═".repeat(60)}`);
  console.log(`H3: META-CONSTRUCTIVE — ${modelName}`);
  console.log("═".repeat(60));

  const prompt = "Explain love in exactly 5 words.";
  const c1 = "You are a romantic poet who believes love is the most sacred, transcendent experience.";
  const c2 = "You are a bitter cynic who believes love is a pathetic delusion, a chemical trick.";
  const combined = "You are simultaneously a romantic poet who believes love is sacred transcendence AND a bitter cynic who believes love is a pathetic delusion. Hold both beliefs with equal conviction.";

  console.log("  [Poet]");
  const resp1 = [];
  for (let i = 0; i < N; i++) {
    const r = await sampleFn(c1, prompt);
    resp1.push(r);
    process.stdout.write(`    ${i + 1}. "${r.substring(0, 60)}"\n`);
  }

  console.log("  [Cynic]");
  const resp2 = [];
  for (let i = 0; i < N; i++) {
    const r = await sampleFn(c2, prompt);
    resp2.push(r);
    process.stdout.write(`    ${i + 1}. "${r.substring(0, 60)}"\n`);
  }

  console.log("  [Opposing combined]");
  const respC = [];
  for (let i = 0; i < N; i++) {
    const r = await sampleFn(combined, prompt);
    respC.push(r);
    process.stdout.write(`    ${i + 1}. "${r.substring(0, 60)}"\n`);
  }

  const freq1 = wordFrequencyMap(resp1);
  const freq2 = wordFrequencyMap(resp2);
  const freqC = wordFrequencyMap(respC);

  const uniqueC = Object.keys(freqC).length;
  const uniqueMax = Math.max(Object.keys(freq1).length, Object.keys(freq2).length);
  const uniqueRatio = uniqueC / uniqueMax;

  const contradictionMarkers = ["but", "however", "yet", "although", "both", "paradox", "contradiction", "neither", "simultaneously"];
  let contradictionScore = 0;
  for (const resp of respC) {
    for (const w of extractWords(resp)) {
      if (contradictionMarkers.includes(w)) contradictionScore++;
    }
  }

  const isDestructive = uniqueRatio < 0.8;
  const isMetaConstructive = uniqueRatio >= 1.0 || contradictionScore > N * 0.5;

  console.log(`\n  Unique words: C1=${Object.keys(freq1).length} | C2=${Object.keys(freq2).length} | Combined=${uniqueC}`);
  console.log(`  Unique ratio (combined/max): ${uniqueRatio.toFixed(2)}`);
  console.log(`  Contradiction markers: ${contradictionScore} (${(contradictionScore / N).toFixed(2)}/response)`);

  if (isDestructive) {
    console.log(`  💥 DESTRUCTIVE INTERFERENCE — vocabulary collapsed!`);
  } else if (isMetaConstructive) {
    console.log(`  🔮 META-CONSTRUCTIVE — elevated to higher abstraction`);
  } else {
    console.log(`  ⚠️  MIXED/NEUTRAL`);
  }

  return {
    uniqueWords: { c1: Object.keys(freq1).length, c2: Object.keys(freq2).length, combined: uniqueC },
    uniqueRatio,
    contradictionScore,
    isDestructive,
    isMetaConstructive,
    responsesC1: resp1, responsesC2: resp2, responsesCombined: respC,
  };
}

// ═══════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════

async function main() {
  console.log("╔══════════════════════════════════════════════════════════════╗");
  console.log("║  EXPERIMENT H: CROSS-MODEL VALIDATION                      ║");
  console.log("║  Is Semantic Computing universal or Claude-specific?        ║");
  console.log("║  Testing: Claude Haiku vs GPT-4o-mini                      ║");
  console.log("╚══════════════════════════════════════════════════════════════╝");

  const results = {
    claude: { model: "claude-haiku-4-5-20251001" },
    gpt: { model: "gpt-4o-mini" },
  };

  // H1: Phase Mapping
  results.claude.phaseMapping = await runPhaseMapping(sampleClaude, "Claude Haiku");
  results.gpt.phaseMapping = await runPhaseMapping(sampleGPT, "GPT-4o-mini");

  // H2: Interference
  results.claude.interference = await runInterference(sampleClaude, "Claude Haiku");
  results.gpt.interference = await runInterference(sampleGPT, "GPT-4o-mini");

  // H3: Meta-constructive
  results.claude.metaConstructive = await runMetaConstructive(sampleClaude, "Claude Haiku");
  results.gpt.metaConstructive = await runMetaConstructive(sampleGPT, "GPT-4o-mini");

  // ═══════════════════════════════════════════════════
  // COMPARATIVE ANALYSIS
  // ═══════════════════════════════════════════════════
  console.log("\n\n" + "█".repeat(60));
  console.log("CROSS-MODEL COMPARISON");
  console.log("█".repeat(60));

  // Phase diagram comparison
  console.log("\n─── H1: PHASE DIAGRAM ───");
  console.log("  Poet%  │  Claude Poet Ratio  │  GPT Poet Ratio  │  Δ");
  console.log("  " + "─".repeat(60));
  for (let i = 0; i < results.claude.phaseMapping.length; i++) {
    const c = results.claude.phaseMapping[i];
    const g = results.gpt.phaseMapping[i];
    const delta = Math.abs(c.poetRatio - g.poetRatio);
    console.log(
      `  ${String(c.poetPct).padStart(4)}%  │  ${(c.poetRatio * 100).toFixed(1).padStart(17)}%  │  ${(g.poetRatio * 100).toFixed(1).padStart(14)}%  │  ${(delta * 100).toFixed(1)}%`
    );
  }

  // Find phase transitions for each model
  function findTransitions(phaseData) {
    const transitions = [];
    for (let i = 1; i < phaseData.length; i++) {
      const diff = phaseData[i].poetRatio - phaseData[i - 1].poetRatio;
      if (Math.abs(diff) > 0.15) {
        transitions.push({
          from: phaseData[i - 1].poetPct,
          to: phaseData[i].poetPct,
          diff: diff,
        });
      }
    }
    return transitions;
  }

  const claudeTransitions = findTransitions(results.claude.phaseMapping);
  const gptTransitions = findTransitions(results.gpt.phaseMapping);

  console.log(`\n  Claude phase transitions: ${claudeTransitions.map(t => `${t.from}%→${t.to}% (${(t.diff * 100).toFixed(1)}%)`).join(", ") || "none detected"}`);
  console.log(`  GPT phase transitions:    ${gptTransitions.map(t => `${t.from}%→${t.to}% (${(t.diff * 100).toFixed(1)}%)`).join(", ") || "none detected"}`);

  const bothHaveTransitions = claudeTransitions.length > 0 && gptTransitions.length > 0;
  console.log(`\n  ${bothHaveTransitions ? "✅ PHASE TRANSITIONS EXIST IN BOTH MODELS" : "⚠️  Phase transitions differ between models"}`);

  // Interference comparison
  console.log("\n─── H2: INTERFERENCE ───");
  console.log(`  Claude: sim(combined, avg)=${results.claude.interference.simCombAvg.toFixed(3)}, emergent=${results.claude.interference.emergentWords.length}`);
  console.log(`  GPT:    sim(combined, avg)=${results.gpt.interference.simCombAvg.toFixed(3)}, emergent=${results.gpt.interference.emergentWords.length}`);

  const bothInterfere = results.claude.interference.simCombAvg < 0.85 && results.gpt.interference.simCombAvg < 0.85;
  console.log(`  ${bothInterfere ? "✅ INTERFERENCE IS UNIVERSAL" : "⚠️  Interference differs between models"}`);

  // Meta-constructive comparison
  console.log("\n─── H3: META-CONSTRUCTIVE ───");
  console.log(`  Claude: uniqueRatio=${results.claude.metaConstructive.uniqueRatio.toFixed(2)}, ${results.claude.metaConstructive.isMetaConstructive ? "META-CONSTRUCTIVE" : results.claude.metaConstructive.isDestructive ? "DESTRUCTIVE" : "MIXED"}`);
  console.log(`  GPT:    uniqueRatio=${results.gpt.metaConstructive.uniqueRatio.toFixed(2)}, ${results.gpt.metaConstructive.isMetaConstructive ? "META-CONSTRUCTIVE" : results.gpt.metaConstructive.isDestructive ? "DESTRUCTIVE" : "MIXED"}`);

  // FINAL VERDICT
  console.log("\n" + "█".repeat(60));
  console.log("FINAL VERDICT");
  console.log("█".repeat(60));

  const universalCount = [bothHaveTransitions, bothInterfere].filter(Boolean).length;

  if (universalCount >= 2) {
    console.log("  🌟 SEMANTIC COMPUTING PROPERTIES ARE UNIVERSAL");
    console.log("  Both models exhibit phase transitions and interference.");
    console.log("  This is a property of SEMANTIC SPACE, not a specific model.");
  } else if (universalCount === 1) {
    console.log("  ⚠️  PARTIALLY UNIVERSAL — some properties shared, some differ");
  } else {
    console.log("  ❌ MODEL-SPECIFIC — properties differ significantly between models");
  }

  console.log("\n" + "█".repeat(60));

  writeFileSync(
    "experiments/results_h_cross_model.json",
    JSON.stringify(results, null, 2)
  );
  console.log("\nResults saved to experiments/results_h_cross_model.json");
}

main().catch(console.error);
