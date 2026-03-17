/**
 * DEMO: Rebuild Experiment G using the Semantic Computing SDK
 *
 * What took 200+ lines in experiment_g now takes ~20 lines.
 * This is what "Hello World" looks like in semantic computing.
 */

import { circuit, interfere, context, runner } from "./semantic.mjs";

// Define the circuit
const myCircuit = circuit("cross-domain-synthesis")
  .input("How should humans organize themselves to thrive? Propose a single original concept. Be vivid and specific.")
  .gate(interfere(
    "a mycologist who sees the world through fungal networks — decentralized, nutrient-sharing, rhizomatic",
    "an urban planner who thinks about infrastructure, resource flow, and how spaces shape behavior",
    0.5
  ))
  .gate(interfere(
    "a jazz musician who understands improvisation, call-and-response, groove, and blue notes",
    "the previous thinker's ideas (injected via chain)",
    0.5
  ))
  .gate(context(
    "a brilliant 7-year-old philosopher who asks 'why?' until reaching the deepest truth, speaks in images and feelings, and finds the ONE simple rule underneath all complexity"
  ))
  .build();

// Run it
const r = runner({
  model: "claude-sonnet-4-20250514",
  temperature: 0.9,
  maxTokens: 300,
});

const results = await r.runWithControl(myCircuit, { n: 3 });

console.log("\n\n" + "█".repeat(60));
console.log("FINAL OUTPUTS FROM CIRCUIT:");
console.log("█".repeat(60));
for (const run of results.runs) {
  console.log(`\n--- Run ${run.run} ---`);
  console.log(run.finalOutput);
}
