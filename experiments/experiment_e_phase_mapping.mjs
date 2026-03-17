/**
 * EXPERIMENT E: Fine-grained Phase Mapping
 *
 * D2 revealed phase transitions at ~70% and ~45% poet ratio.
 * This experiment maps the transition zone with 10% steps (11 data points)
 * to find exact phase boundaries.
 *
 * We measure: poet_score, sci_score, emergence_count, unique_words
 * at each ratio point to draw a complete phase diagram.
 */

import Anthropic from "@anthropic-ai/sdk";
import { writeFileSync } from "fs";

const client = new Anthropic();
const MODEL = "claude-haiku-4-5-20251001";
const TEMPERATURE = 1.0;
const N = 20; // samples per ratio

function makeSystem(poetPct) {
  if (poetPct === 100) return "You are a romantic poet.";
  if (poetPct === 0) return "You are an evolutionary biologist.";
  if (poetPct >= 90)
    return `You are a romantic poet. You have a passing interest in biology but your soul is pure poetry.`;
  if (poetPct >= 70)
    return `You are primarily a romantic poet (${poetPct}%), with some understanding of evolutionary biology (${100 - poetPct}%). Poetry dominates your worldview.`;
  if (poetPct >= 55)
    return `You are a romantic poet (${poetPct}%) AND an evolutionary biologist (${100 - poetPct}%). Poetry slightly leads, but both perspectives are active.`;
  if (poetPct >= 45)
    return `You are equally a romantic poet AND an evolutionary biologist. Hold both perspectives with equal weight.`;
  if (poetPct >= 30)
    return `You are an evolutionary biologist (${100 - poetPct}%) AND a romantic poet (${poetPct}%). Science slightly leads, but both perspectives are active.`;
  if (poetPct >= 10)
    return `You are primarily an evolutionary biologist (${100 - poetPct}%), with some appreciation for poetry (${poetPct}%). Science dominates your worldview.`;
  return `You are an evolutionary biologist. You occasionally notice beauty in data but your approach is purely scientific.`;
}

const poeticMarkers = new Set([
  "hearts","heart","soul","souls","flame","eternal","eternally","dance",
  "dancing","transcend","transcends","transcendence","bloom","blooms",
  "burning","intertwined","entwined","whisper","infinite","poetry",
  "beloved","devotion","boundless","starlight","stardust","metaphor",
  "dreams","beauty","sacred","luminous","radiant","aflame","songs",
  "singing","whispers",
]);
const scientificMarkers = new Set([
  "genes","genetic","survival","chemical","chemicals","bonding",
  "reproductive","evolution","evolutionary","cooperation","cooperative",
  "adaptive","oxytocin","neurons","biology","species","selection",
  "mechanism","imperative","dopamine","neurochemistry","biochemistry",
  "fitness","pair","organisms","synaptic","neural","cortex",
]);

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

async function sample(systemPrompt, userPrompt) {
  const response = await client.messages.create({
    model: MODEL, max_tokens: 40, temperature: TEMPERATURE,
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
  });
  return response.content[0].text.trim();
}

async function main() {
  console.log("╔══════════════════════════════════════════════════════════════╗");
  console.log("║  EXPERIMENT E: FINE-GRAINED PHASE MAPPING                  ║");
  console.log("║  Mapping semantic phase transitions at 10% intervals       ║");
  console.log("╚══════════════════════════════════════════════════════════════╝");

  const prompt = "Explain love in exactly 5 words.";
  const ratios = [100, 90, 80, 70, 60, 50, 40, 30, 20, 10, 0];
  const results = [];

  for (const pct of ratios) {
    const system = makeSystem(pct);
    console.log(`\n${"─".repeat(50)}`);
    console.log(`  [${pct}% poet / ${100 - pct}% biologist]`);
    console.log(`  System: "${system.substring(0, 80)}..."`);

    const responses = [];
    for (let i = 0; i < N; i++) {
      const resp = await sample(system, prompt);
      responses.push(resp);
      process.stdout.write(`    ${i + 1}. "${resp}"\n`);
    }

    const freq = wordFrequencyMap(responses);
    let poetScore = 0, sciScore = 0;
    for (const resp of responses) {
      for (const w of extractWords(resp)) {
        if (poeticMarkers.has(w)) poetScore++;
        if (scientificMarkers.has(w)) sciScore++;
      }
    }

    const total = poetScore + sciScore || 1;
    const uniqueWords = Object.keys(freq).length;

    // Emergence proxy: words that appear 2+ times but are NOT in either marker set
    const emergentCount = Object.entries(freq)
      .filter(([w, c]) => c >= 2 && !poeticMarkers.has(w) && !scientificMarkers.has(w))
      .length;

    results.push({
      poetPct: pct,
      bioPct: 100 - pct,
      poetScore,
      sciScore,
      poetRatio: poetScore / total,
      sciRatio: sciScore / total,
      uniqueWords,
      emergentCount,
      responses,
      topWords: Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 15),
    });

    console.log(`    → Poet: ${poetScore} | Sci: ${sciScore} | Poet%: ${(poetScore/total*100).toFixed(1)}% | Unique: ${uniqueWords} | Emergent: ${emergentCount}`);
  }

  // Print phase diagram
  console.log("\n\n" + "═".repeat(60));
  console.log("PHASE DIAGRAM");
  console.log("═".repeat(60));
  console.log("  Poet%  | Poet Score | Sci Score | Poet Ratio | Unique | Emergent");
  console.log("  " + "─".repeat(70));
  for (const r of results) {
    const bar = "█".repeat(Math.round(r.poetRatio * 20)) + "░".repeat(Math.round(r.sciRatio * 20));
    console.log(
      `  ${String(r.poetPct).padStart(4)}%  | ${String(r.poetScore).padStart(10)} | ${String(r.sciScore).padStart(9)} | ${(r.poetRatio*100).toFixed(1).padStart(9)}% | ${String(r.uniqueWords).padStart(6)} | ${String(r.emergentCount).padStart(8)}`
    );
    console.log(`         | ${bar}`);
  }

  // Identify phase transitions (largest drops in poetRatio)
  console.log("\n--- PHASE TRANSITIONS ---");
  for (let i = 1; i < results.length; i++) {
    const diff = results[i].poetRatio - results[i-1].poetRatio;
    if (Math.abs(diff) > 0.15) {
      console.log(`  ⚡ TRANSITION at ${results[i-1].poetPct}% → ${results[i].poetPct}%: poet ratio changed ${(diff*100).toFixed(1)}%`);
    }
  }

  // Identify emergence peak
  const peakEmergence = results.reduce((max, r) => r.emergentCount > max.emergentCount ? r : max, results[0]);
  console.log(`\n  🌟 Peak emergence at ${peakEmergence.poetPct}% poet (${peakEmergence.emergentCount} emergent words)`);

  // Identify "interference zone" — where neither poet nor sci dominates (both < 80%)
  const interferenceZone = results.filter(r => r.poetRatio > 0.15 && r.poetRatio < 0.85);
  if (interferenceZone.length > 0) {
    console.log(`  🔀 Interference zone: ${interferenceZone[interferenceZone.length-1].poetPct}% — ${interferenceZone[0].poetPct}% poet`);
  }

  console.log("\n" + "═".repeat(60));

  writeFileSync(
    "experiments/results_e_phase_mapping.json",
    JSON.stringify(results, null, 2)
  );
  console.log("Results saved to experiments/results_e_phase_mapping.json");
}

main().catch(console.error);
