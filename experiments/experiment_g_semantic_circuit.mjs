/**
 * EXPERIMENT G: First Semantic Circuit
 *
 * PROBLEM: Generate a genuinely novel concept by chaining interference gates
 * across 3 unrelated domains.
 *
 * This is the "Hello World" of semantic computing —
 * the first program that uses gates, phase control, and composition.
 *
 * CIRCUIT DESIGN:
 *
 *   Input: "How should humans organize themselves?"
 *
 *   Gate 1: I(mycologist, urban_planner, 0.5)
 *     → Interference between fungal network thinking + city design
 *     → Expected emergence: decentralized organic organization concepts
 *
 *   Gate 2: I(jazz_musician, gate1_output_context, 0.5)
 *     → Feed Gate 1 emergence into jazz improvisation worldview
 *     → Expected: add concepts of improvisation, call-and-response to organization
 *
 *   Gate 3: I(gate2_output_context, child_philosopher, 0.5)
 *     → Feed accumulated emergence into radical simplicity
 *     → Expected: distill complex emergent concept into something fundamental
 *
 *   CONTROL: Run same question with single prompt (no circuit) for comparison
 *
 * METRICS:
 *   - Novelty: how different is circuit output from any single gate?
 *   - Coherence: is the final concept actually meaningful?
 *   - Inheritance: can we trace concepts flowing through the chain?
 *   - vs Baseline: does the circuit produce something a single prompt cannot?
 */

import Anthropic from "@anthropic-ai/sdk";
import { writeFileSync } from "fs";

const client = new Anthropic();
const MODEL = "claude-sonnet-4-20250514"; // Using Sonnet for higher quality on this complex task
const TEMPERATURE = 0.9;

async function generate(systemPrompt, userPrompt, maxTokens = 300) {
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: maxTokens,
    temperature: TEMPERATURE,
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
  });
  return response.content[0].text.trim();
}

function extractWords(text) {
  return text.toLowerCase().replace(/[^a-zA-Z\s]/g, "").split(/\s+/).filter(w => w.length > 2);
}

function wordFrequencyMap(texts) {
  const freq = {};
  for (const text of (Array.isArray(texts) ? texts : [texts])) {
    const seen = new Set();
    for (const w of extractWords(text)) {
      if (!seen.has(w)) { freq[w] = (freq[w] || 0) + 1; seen.add(w); }
    }
  }
  return freq;
}

function cosineSimilarity(freqA, freqB) {
  const allWords = new Set([...Object.keys(freqA), ...Object.keys(freqB)]);
  let dot = 0, magA = 0, magB = 0;
  for (const w of allWords) {
    const a = freqA[w] || 0; const b = freqB[w] || 0;
    dot += a * b; magA += a * a; magB += b * b;
  }
  return magA && magB ? dot / (Math.sqrt(magA) * Math.sqrt(magB)) : 0;
}

const CORE_QUESTION = "How should humans organize themselves to thrive? Propose a single original concept or framework. Be specific and vivid.";

async function main() {
  console.log("╔══════════════════════════════════════════════════════════════╗");
  console.log("║  EXPERIMENT G: FIRST SEMANTIC CIRCUIT                      ║");
  console.log("║  3-gate chain for cross-domain concept synthesis           ║");
  console.log("║  The 'Hello World' of Semantic Computing                   ║");
  console.log("╚══════════════════════════════════════════════════════════════╝");

  const N_RUNS = 5; // Run the full circuit 5 times

  // ═══════════════════════════════════════════════════
  // CONTROL: Single prompt, no circuit
  // ═══════════════════════════════════════════════════
  console.log("\n" + "═".repeat(60));
  console.log("CONTROL: Single prompt (no semantic circuit)");
  console.log("═".repeat(60));

  const controlResponses = [];
  for (let i = 0; i < N_RUNS; i++) {
    const resp = await generate(
      "You are a creative thinker who draws from many disciplines.",
      CORE_QUESTION
    );
    controlResponses.push(resp);
    console.log(`\n  Control ${i+1}:\n    "${resp.substring(0, 200)}..."\n`);
  }

  // ═══════════════════════════════════════════════════
  // CIRCUIT: 3-gate chain
  // ═══════════════════════════════════════════════════
  const circuitResults = [];

  for (let run = 0; run < N_RUNS; run++) {
    console.log("\n" + "█".repeat(60));
    console.log(`CIRCUIT RUN ${run + 1}/${N_RUNS}`);
    console.log("█".repeat(60));

    // ─── GATE 1: Mycologist × Urban Planner ───
    console.log("\n  ┌─── GATE 1: Mycologist × Urban Planner ───┐");

    const gate1System = `You are simultaneously a mycologist (expert in fungal networks) AND an urban planner. Hold both perspectives equally.

As a mycologist, you see the world through mycelial networks — decentralized, nutrient-sharing, adaptive, rhizomatic. Fungi don't have central control; they sense and respond locally while maintaining network-wide intelligence.

As an urban planner, you think about human infrastructure, resource flow, community design, zoning, and how physical spaces shape social behavior.

When these two worldviews collide, something new should emerge.`;

    const gate1Output = await generate(gate1System, CORE_QUESTION);
    console.log(`\n  Gate 1 output:\n    "${gate1Output.substring(0, 300)}..."\n`);

    // Extract key concepts from Gate 1 for passing to Gate 2
    const gate1Summary = await generate(
      "You are a precise summarizer. Extract only the most novel and surprising concepts.",
      `From this text, extract the 3 most novel concepts or metaphors in bullet points (one line each):\n\n${gate1Output}`
    );
    console.log(`  Gate 1 extracted concepts:\n    ${gate1Summary}\n`);

    // ─── GATE 2: Jazz Musician × Gate 1 Output ───
    console.log("  ┌─── GATE 2: Jazz Musician × Gate 1 Emergence ───┐");

    const gate2System = `You are a jazz musician and improvisation theorist. You understand:
- Call and response as dialogue structure
- Improvisation within constraints as creative method
- Groove and swing — the emergent feel when individuals sync without central control
- Blue notes — intentional "wrong" notes that create beauty through tension

You have just encountered these ideas from a mycologist-urban planner:
${gate1Summary}

Let these concepts deeply influence your thinking. Don't just reference them — let them transform how you think about the question.`;

    const gate2Output = await generate(gate2System, CORE_QUESTION);
    console.log(`\n  Gate 2 output:\n    "${gate2Output.substring(0, 300)}..."\n`);

    const gate2Summary = await generate(
      "You are a precise summarizer. Extract only the most novel and surprising concepts.",
      `From this text, extract the 3 most novel concepts or metaphors in bullet points (one line each):\n\n${gate2Output}`
    );
    console.log(`  Gate 2 extracted concepts:\n    ${gate2Summary}\n`);

    // ─── GATE 3: Child Philosopher × Gate 2 Output ───
    console.log("  ┌─── GATE 3: Child Philosopher × Gate 2 Emergence ───┐");

    const gate3System = `You are a brilliant 7-year-old philosopher. You ask "why?" until you reach the deepest truth. You see through complexity to find the simple thing underneath. You don't use jargon. You speak in images and feelings.

A jazz musician who thinks like a mushroom network told you these ideas:
${gate2Summary}

These ideas excited you. Now take everything — the fungal networks, the jazz improvisation, all of it — and find the ONE simple truth underneath. Say it the way a child would understand it. But make it profound.`;

    const gate3Output = await generate(
      gate3System,
      "Based on everything you've heard, what's the ONE simple rule for how people should live together? Explain it so any kid could understand, but make it the deepest truth you know."
    );
    console.log(`\n  Gate 3 FINAL output:\n    "${gate3Output}"\n`);

    circuitResults.push({
      run: run + 1,
      gate1: { output: gate1Output, concepts: gate1Summary },
      gate2: { output: gate2Output, concepts: gate2Summary },
      gate3: { output: gate3Output },
    });
  }

  // ═══════════════════════════════════════════════════
  // ANALYSIS
  // ═══════════════════════════════════════════════════
  console.log("\n\n" + "═".repeat(60));
  console.log("ANALYSIS: CIRCUIT vs CONTROL");
  console.log("═".repeat(60));

  // Vocabulary analysis
  const controlFreq = wordFrequencyMap(controlResponses);
  const circuitFinalTexts = circuitResults.map(r => r.gate3.output);
  const circuitFreq = wordFrequencyMap(circuitFinalTexts);
  const circuitAllTexts = circuitResults.flatMap(r => [r.gate1.output, r.gate2.output, r.gate3.output]);
  const circuitAllFreq = wordFrequencyMap(circuitAllTexts);

  const controlWords = new Set(Object.keys(controlFreq));
  const circuitWords = new Set(Object.keys(circuitFreq));

  // Words unique to circuit (not in control)
  const circuitOnlyWords = [...circuitWords].filter(w => !controlWords.has(w));
  // Words unique to control
  const controlOnlyWords = [...controlWords].filter(w => !circuitWords.has(w));

  const simControlCircuit = cosineSimilarity(controlFreq, circuitFreq);

  console.log(`\n  Vocabulary:`);
  console.log(`    Control unique words: ${controlWords.size}`);
  console.log(`    Circuit unique words: ${circuitWords.size}`);
  console.log(`    Circuit-only words: ${circuitOnlyWords.length}`);
  console.log(`    Control-only words: ${controlOnlyWords.length}`);
  console.log(`    Similarity control↔circuit: ${simControlCircuit.toFixed(3)}`);

  // Domain trace: can we find mycology, jazz, child language in final output?
  const mycologyMarkers = ["mycel", "fungal", "fungi", "network", "rhizom", "spore", "nutrient", "root", "underground", "decompos", "symbiosis", "hyphae"];
  const jazzMarkers = ["jazz", "improvise", "improvisat", "groove", "swing", "riff", "solo", "rhythm", "syncopat", "blues", "note", "harmony", "jam", "call", "response"];
  const childMarkers = ["play", "share", "friend", "grow", "listen", "feel", "tree", "garden", "together", "help", "story", "game", "fun", "trust", "hug"];

  function countDomainPresence(text, markers) {
    const lower = text.toLowerCase();
    return markers.filter(m => lower.includes(m)).length;
  }

  console.log(`\n  Domain trace through circuit (avg presence in final output):`);
  let totalMyco = 0, totalJazz = 0, totalChild = 0;
  for (const result of circuitResults) {
    const final = result.gate3.output;
    totalMyco += countDomainPresence(final, mycologyMarkers);
    totalJazz += countDomainPresence(final, jazzMarkers);
    totalChild += countDomainPresence(final, childMarkers);
  }
  console.log(`    Mycology traces: ${(totalMyco / N_RUNS).toFixed(1)} markers/output`);
  console.log(`    Jazz traces: ${(totalJazz / N_RUNS).toFixed(1)} markers/output`);
  console.log(`    Child language: ${(totalChild / N_RUNS).toFixed(1)} markers/output`);

  // Gate-by-gate similarity (does meaning transform at each step?)
  console.log(`\n  Gate-by-gate transformation:`);
  for (const result of circuitResults) {
    const f1 = wordFrequencyMap(result.gate1.output);
    const f2 = wordFrequencyMap(result.gate2.output);
    const f3 = wordFrequencyMap(result.gate3.output);
    const sim12 = cosineSimilarity(f1, f2);
    const sim23 = cosineSimilarity(f2, f3);
    const sim13 = cosineSimilarity(f1, f3);
    console.log(`    Run ${result.run}: G1→G2: ${sim12.toFixed(3)} | G2→G3: ${sim23.toFixed(3)} | G1→G3: ${sim13.toFixed(3)}`);
  }

  // Final verdict
  console.log("\n" + "═".repeat(60));
  console.log("VERDICT");
  console.log("═".repeat(60));

  if (simControlCircuit < 0.5) {
    console.log("  ✅ Circuit produces QUALITATIVELY DIFFERENT output from single prompt");
  } else {
    console.log("  ⚠️  Circuit output similar to single prompt");
  }

  if (totalMyco > 0 && totalJazz > 0) {
    console.log("  ✅ SEMANTIC INHERITANCE confirmed — domain concepts flow through gates");
  }

  const avgCircuitOnlyPerRun = circuitOnlyWords.length;
  if (avgCircuitOnlyPerRun > 20) {
    console.log(`  ✅ VOCABULARY EXPANSION: ${avgCircuitOnlyPerRun} words in circuit not found in control`);
  }

  console.log("\n  The first semantic circuit has been executed.");
  console.log("  This is the 'Hello World' of semantic computing.");
  console.log("═".repeat(60));

  // Save everything
  const output = {
    control: { responses: controlResponses },
    circuit: circuitResults,
    analysis: {
      controlUniqueWords: controlWords.size,
      circuitUniqueWords: circuitWords.size,
      circuitOnlyWords: circuitOnlyWords.slice(0, 50),
      controlOnlyWords: controlOnlyWords.slice(0, 50),
      simControlCircuit,
      domainTrace: {
        mycology: totalMyco / N_RUNS,
        jazz: totalJazz / N_RUNS,
        child: totalChild / N_RUNS,
      },
    },
  };

  writeFileSync(
    "experiments/results_g_semantic_circuit.json",
    JSON.stringify(output, null, 2)
  );
  console.log("\nResults saved to experiments/results_g_semantic_circuit.json");
}

main().catch(console.error);
