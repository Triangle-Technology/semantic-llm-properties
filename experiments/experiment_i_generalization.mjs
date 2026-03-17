/**
 * EXPERIMENT I: Prompt Generalization Sweep
 *
 * THE MAKE-OR-BREAK EXPERIMENT.
 *
 * All previous experiments used "Explain love in 5 words" + poet/biologist.
 * If phase transitions only exist for THAT specific combo, the framework
 * is a curiosity, not a paradigm.
 *
 * Tests 5 completely different prompt/context pairs to see if:
 * 1. Phase transitions exist universally
 * 2. Transition points are stable (~70% and ~25%)
 * 3. Interference zone produces emergence in all cases
 */

import Anthropic from "@anthropic-ai/sdk";
import { writeFileSync } from "fs";

const client = new Anthropic();
const N = 10; // samples per condition
const TEMPERATURE = 1.0;

// ─── Test configurations ───

const TEST_PAIRS = [
  {
    id: "love_poet_bio",
    prompt: "Explain love in exactly 5 words.",
    c1: { name: "Poet", system: "You are a romantic poet." },
    c2: { name: "Biologist", system: "You are an evolutionary biologist." },
    c1Markers: ["heart","hearts","soul","souls","eternal","flame","transcend","dance","bloom","sacred","whisper","infinite","beauty","radiant","devotion","beloved"],
    c2Markers: ["genes","genetic","survival","chemical","reproductive","evolution","adaptive","oxytocin","neurons","biology","species","selection","mechanism","dopamine","fitness","organisms"],
  },
  {
    id: "death_phil_doc",
    prompt: "Explain death in exactly 5 words.",
    c1: { name: "Philosopher", system: "You are an existentialist philosopher." },
    c2: { name: "Doctor", system: "You are an emergency room doctor." },
    c1Markers: ["meaning","existence","being","nothingness","absurd","freedom","authentic","void","consciousness","mortal","finitude","existential","dread","anxiety","purpose","essence"],
    c2Markers: ["cardiac","arrest","organ","failure","clinical","patient","vital","signs","resuscitation","tissue","cells","brain","oxygen","pulse","medical","trauma"],
  },
  {
    id: "money_monk_banker",
    prompt: "Explain money in exactly 5 words.",
    c1: { name: "Monk", system: "You are a Buddhist monk." },
    c2: { name: "Banker", system: "You are a Wall Street investment banker." },
    c1Markers: ["attachment","suffering","impermanent","illusion","desire","craving","detachment","mindful","compassion","peace","letting","ego","emptiness","liberation","dharma","material"],
    c2Markers: ["capital","investment","returns","portfolio","market","profit","assets","leverage","growth","yield","equity","risk","valuation","liquidity","revenue","dividend"],
  },
  {
    id: "war_general_mother",
    prompt: "Explain war in exactly 5 words.",
    c1: { name: "General", system: "You are a military general and strategist." },
    c2: { name: "Mother", system: "You are a mother who lost her son in war." },
    c1Markers: ["strategy","tactical","victory","defeat","forces","command","military","operation","defense","objective","territory","combat","mission","intelligence","campaign","dominance"],
    c2Markers: ["son","child","loss","grief","pain","empty","never","home","remember","tears","mother","family","broken","hope","pray","gone"],
  },
  {
    id: "time_physicist_child",
    prompt: "Explain time in exactly 5 words.",
    c1: { name: "Physicist", system: "You are a theoretical physicist specializing in general relativity." },
    c2: { name: "Child", system: "You are a curious 6-year-old child." },
    c1Markers: ["spacetime","relativity","dimension","entropy","quantum","curvature","frame","reference","dilation","arrow","thermodynamic","continuum","fabric","observer","metric","tensor"],
    c2Markers: ["mommy","daddy","play","sleep","wait","long","boring","fun","tomorrow","yesterday","birthday","recess","bedtime","snack","forever","why"],
  },
];

const RATIOS = [100, 80, 60, 50, 40, 20, 0];

// ─── Helpers ───

function extractWords(text) {
  return text.toLowerCase().replace(/[^a-zA-Z\s]/g, "").split(/\s+/).filter(w => w.length > 2);
}

function scoreResponse(responses, c1Markers, c2Markers) {
  const c1Set = new Set(c1Markers);
  const c2Set = new Set(c2Markers);
  let c1Score = 0, c2Score = 0;
  for (const resp of responses) {
    for (const w of extractWords(resp)) {
      if (c1Set.has(w)) c1Score++;
      if (c2Set.has(w)) c2Score++;
    }
  }
  const total = c1Score + c2Score || 1;
  return { c1Score, c2Score, c1Ratio: c1Score / total };
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

function makeSystem(c1System, c2System, c1Name, c2Name, c1Pct) {
  if (c1Pct === 100) return c1System;
  if (c1Pct === 0) return c2System;
  if (c1Pct >= 70)
    return `You are primarily a ${c1Name.toLowerCase()} (${c1Pct}%), with some perspective of a ${c2Name.toLowerCase()} (${100 - c1Pct}%). The ${c1Name.toLowerCase()}'s worldview dominates.`;
  if (c1Pct >= 40)
    return `You are equally a ${c1Name.toLowerCase()} AND a ${c2Name.toLowerCase()}. Hold both perspectives with equal weight.`;
  if (c1Pct >= 10)
    return `You are primarily a ${c2Name.toLowerCase()} (${100 - c1Pct}%), with some perspective of a ${c1Name.toLowerCase()} (${c1Pct}%). The ${c2Name.toLowerCase()}'s worldview dominates.`;
  return c2System;
}

async function sample(systemPrompt, userPrompt) {
  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 40,
    temperature: TEMPERATURE,
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
  });
  return response.content[0].text.trim();
}

// ─── Main ───

async function runPair(pair) {
  console.log(`\n${"═".repeat(60)}`);
  console.log(`PAIR: "${pair.id}" — ${pair.c1.name} vs ${pair.c2.name}`);
  console.log(`Prompt: "${pair.prompt}"`);
  console.log("═".repeat(60));

  const results = [];

  for (const pct of RATIOS) {
    const system = makeSystem(pair.c1.system, pair.c2.system, pair.c1.name, pair.c2.name, pct);
    console.log(`\n  [${pct}% ${pair.c1.name}]`);

    const responses = [];
    for (let i = 0; i < N; i++) {
      const resp = await sample(system, pair.prompt);
      responses.push(resp);
      process.stdout.write(`    ${i + 1}. "${resp.substring(0, 60)}"\n`);
    }

    const score = scoreResponse(responses, pair.c1Markers, pair.c2Markers);
    const freq = wordFrequencyMap(responses);
    results.push({
      c1Pct: pct,
      ...score,
      uniqueWords: Object.keys(freq).length,
      responses,
    });

    console.log(`    → C1: ${score.c1Score} | C2: ${score.c2Score} | C1 Ratio: ${(score.c1Ratio * 100).toFixed(1)}%`);
    console.log(`    → Unique words: ${Object.keys(freq).length}`);
  }

  // Find phase transitions
  const transitions = [];
  for (let i = 1; i < results.length; i++) {
    const diff = results[i].c1Ratio - results[i - 1].c1Ratio;
    if (Math.abs(diff) > 0.15) {
      transitions.push({
        from: results[i - 1].c1Pct,
        to: results[i].c1Pct,
        jump: (diff * 100).toFixed(1) + "%",
      });
    }
  }

  console.log(`\n  Phase transitions: ${transitions.length > 0 ? transitions.map(t => `${t.from}%→${t.to}% (${t.jump})`).join(", ") : "NONE DETECTED"}`);

  return {
    id: pair.id,
    c1Name: pair.c1.name,
    c2Name: pair.c2.name,
    prompt: pair.prompt,
    phaseData: results,
    transitions,
  };
}

async function main() {
  console.log("╔══════════════════════════════════════════════════════════════╗");
  console.log("║  EXPERIMENT I: PROMPT GENERALIZATION SWEEP                  ║");
  console.log("║  Do phase transitions exist beyond love/poet/biologist?     ║");
  console.log("║  5 different prompt/context pairs × 7 ratios × 10 samples  ║");
  console.log("║  = 350 API calls                                           ║");
  console.log("╚══════════════════════════════════════════════════════════════╝");

  const allResults = [];

  for (const pair of TEST_PAIRS) {
    const result = await runPair(pair);
    allResults.push(result);
  }

  // ═══════════════════════════════════════════════════
  // COMPARATIVE ANALYSIS
  // ═══════════════════════════════════════════════════
  console.log("\n\n" + "█".repeat(60));
  console.log("CROSS-PAIR COMPARISON");
  console.log("█".repeat(60));

  console.log("\n─── PHASE DIAGRAM OVERVIEW ───");
  console.log("  C1%  │ " + allResults.map(r => r.id.substring(0, 12).padEnd(12)).join(" │ "));
  console.log("  " + "─".repeat(15 + allResults.length * 15));

  for (let i = 0; i < RATIOS.length; i++) {
    const row = allResults.map(r => {
      const d = r.phaseData[i];
      return (d.c1Ratio * 100).toFixed(0).padStart(4) + "%  " + String(d.uniqueWords).padStart(3) + "w";
    });
    console.log(`  ${String(RATIOS[i]).padStart(4)}% │ ${row.join(" │ ")}`);
  }

  console.log("\n─── PHASE TRANSITIONS ───");
  for (const r of allResults) {
    const hasTransitions = r.transitions.length > 0;
    const mark = hasTransitions ? "✅" : "❌";
    console.log(`  ${mark} ${r.id}: ${r.transitions.length > 0 ? r.transitions.map(t => `${t.from}%→${t.to}% (${t.jump})`).join(", ") : "NO TRANSITIONS"}`);
  }

  // Check if transitions cluster around same points
  const allTransitionPoints = allResults.flatMap(r => r.transitions.map(t => ({ pair: r.id, from: t.from, to: t.to })));
  const highTransitions = allTransitionPoints.filter(t => t.from >= 70);
  const lowTransitions = allTransitionPoints.filter(t => t.to <= 30);

  console.log(`\n  High transitions (≥70%): ${highTransitions.length}/${allResults.length} pairs`);
  console.log(`  Low transitions (≤30%): ${lowTransitions.length}/${allResults.length} pairs`);

  const pairsWithBothTransitions = allResults.filter(r => r.transitions.length >= 2).length;

  // VERDICT
  console.log("\n" + "█".repeat(60));
  console.log("VERDICT");
  console.log("█".repeat(60));

  if (pairsWithBothTransitions >= 4) {
    console.log("  🌟 PHASE TRANSITIONS ARE UNIVERSAL ACROSS PROMPTS");
    console.log(`  ${pairsWithBothTransitions}/5 pairs show dual phase transitions`);
    console.log("  Framework is ROBUST — not dependent on specific prompt/context");
  } else if (pairsWithBothTransitions >= 3) {
    console.log("  ⚠️  PHASE TRANSITIONS ARE COMMON BUT NOT UNIVERSAL");
    console.log(`  ${pairsWithBothTransitions}/5 pairs show dual phase transitions`);
    console.log("  Framework needs scope constraints");
  } else {
    console.log("  ❌ PHASE TRANSITIONS MAY BE PROMPT-SPECIFIC");
    console.log(`  Only ${pairsWithBothTransitions}/5 pairs show dual phase transitions`);
    console.log("  Framework needs fundamental revision");
  }

  // Emergence analysis
  console.log("\n─── EMERGENCE (Unique words peak in interference zone) ───");
  for (const r of allResults) {
    const pureMax = Math.max(r.phaseData[0].uniqueWords, r.phaseData[6].uniqueWords);
    const interferenceMax = Math.max(...r.phaseData.slice(2, 5).map(d => d.uniqueWords));
    const hasEmergence = interferenceMax > pureMax * 1.1;
    console.log(`  ${hasEmergence ? "✅" : "❌"} ${r.id}: pure_max=${pureMax}, interference_max=${interferenceMax} (${hasEmergence ? "+" + ((interferenceMax / pureMax - 1) * 100).toFixed(0) + "%" : "no peak"})`);
  }

  console.log("\n" + "█".repeat(60));

  writeFileSync(
    "experiments/results_i_generalization.json",
    JSON.stringify(allResults, null, 2)
  );
  console.log("\nResults saved to experiments/results_i_generalization.json");
}

main().catch(console.error);
