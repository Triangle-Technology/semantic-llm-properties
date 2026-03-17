/**
 * RUN ALL EXPERIMENTS — Sequential
 * A → B → C (logical dependency order)
 *
 * Usage:
 *   export ANTHROPIC_API_KEY="sk-ant-..."
 *   node experiments/run_all.mjs
 *
 * Estimated cost: ~$0.50-1.00 (using Haiku)
 * Estimated time: ~10-15 minutes
 */

import { execSync } from "child_process";

const experiments = [
  { file: "experiments/experiment_a_born_rule.mjs", name: "A: Born Rule Validation" },
  { file: "experiments/experiment_b_interference.mjs", name: "B: Interference Measurement" },
  { file: "experiments/experiment_c_entanglement.mjs", name: "C: Entanglement Scale Test" },
];

console.log("╔══════════════════════════════════════════════════════════════╗");
console.log("║  SEMANTIC COMPUTING — EXPERIMENTAL VALIDATION SUITE        ║");
console.log("║  Running: A (Born Rule) → B (Interference) → C (Entangle) ║");
console.log("╚══════════════════════════════════════════════════════════════╝\n");

if (!process.env.ANTHROPIC_API_KEY) {
  console.error("ERROR: ANTHROPIC_API_KEY not set.");
  console.error("Run: export ANTHROPIC_API_KEY=\"sk-ant-...\"");
  process.exit(1);
}

const startTime = Date.now();

for (const exp of experiments) {
  console.log(`\n\n${"#".repeat(60)}`);
  console.log(`# STARTING: ${exp.name}`);
  console.log(`${"#".repeat(60)}\n`);

  try {
    execSync(`node ${exp.file}`, { stdio: "inherit", cwd: process.cwd() });
    console.log(`\n✅ ${exp.name} — COMPLETE`);
  } catch (err) {
    console.error(`\n❌ ${exp.name} — FAILED: ${err.message}`);
  }
}

const elapsed = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
console.log(`\n\n${"═".repeat(60)}`);
console.log(`ALL EXPERIMENTS COMPLETE — Total time: ${elapsed} minutes`);
console.log(`Results saved in experiments/results_*.json`);
console.log("═".repeat(60));
