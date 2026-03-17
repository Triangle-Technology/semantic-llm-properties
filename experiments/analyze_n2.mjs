import { readFileSync } from "fs";
const data = JSON.parse(readFileSync("experiments/results_n2_actual_programs.json", "utf8"));

const originalIds = ["privacy_security", "growth_environment", "tradition_progress", "honesty_kindness", "autonomy_safety"];
const methods = ["rule_based", "pattern_matching", "ontology_lookup", "semantic_circuit"];

// Check for evaluator reliability issues
console.log("=== EVALUATOR RELIABILITY CHECK ===\n");
for (const r of data.results) {
  for (const m of methods) {
    const entry = r[m];
    const ev = entry.eval;
    const resp = entry.response || "";
    // Flag suspicious: empty response but high score, or "Cannot analyze" but DISSOLUTION
    if ((resp.length < 30 && ev.classification === "DISSOLUTION") ||
        (resp.includes("Cannot analyze") && ev.classification === "DISSOLUTION")) {
      console.log(`⚠️  ${r.problem_id}/${m}: response="${resp.slice(0, 60)}..." → ${ev.classification} (${ev.assumption_score}/${ev.dissolution_quality})`);
      console.log(`   Evaluator reasoning: ${ev.reasoning.slice(0, 100)}...`);
    }
  }
}

// Count actual program output characteristics (ground truth, no LLM eval)
console.log("\n=== GROUND TRUTH: PROGRAM OUTPUT ANALYSIS ===\n");
for (const m of ["rule_based", "pattern_matching", "ontology_lookup"]) {
  console.log(`\n--- ${m} ---`);
  for (const r of data.results) {
    const entry = r[m];
    const isOriginal = originalIds.includes(r.problem_id);
    const respLen = (entry.response || "").length;
    const hasAssumption = entry.identifies_hidden_assumption || false;
    const strategy = entry.strategy || entry.matchedCategory || "N/A";
    console.log(`  ${r.problem_id.padEnd(20)} [${isOriginal ? "ORIG" : "NOVEL"}] len=${String(respLen).padEnd(4)} assumption=${hasAssumption} strategy=${strategy}`);
  }
}

// LLM eval summary
console.log("\n\n=== LLM EVALUATOR SUMMARY ===\n");
for (const [label, filter] of [["ALL", () => true], ["ORIGINAL", r => originalIds.includes(r.problem_id)], ["NOVEL", r => !originalIds.includes(r.problem_id)]]) {
  console.log(`\n--- ${label} ---`);
  for (const m of methods) {
    const subset = data.results.filter(filter);
    const evals = subset.map(r => r[m].eval);
    const diss = evals.filter(e => e.classification === "DISSOLUTION").length;
    const comp = evals.filter(e => e.classification === "COMPROMISE").length;
    const avgA = (evals.reduce((s, e) => s + e.assumption_score, 0) / evals.length).toFixed(1);
    const avgQ = (evals.reduce((s, e) => s + e.dissolution_quality, 0) / evals.length).toFixed(1);
    console.log(`  ${m.padEnd(20)} diss=${diss}/${subset.length} comp=${comp}/${subset.length} avgA=${avgA} avgQ=${avgQ}`);
  }
}

// Qualitative comparison: response length as proxy for depth
console.log("\n\n=== RESPONSE LENGTH (proxy for depth) ===\n");
for (const m of methods) {
  const lengths = data.results.map(r => (r[m].response || "").length);
  const avg = (lengths.reduce((a, b) => a + b, 0) / lengths.length).toFixed(0);
  const min = Math.min(...lengths);
  const max = Math.max(...lengths);
  console.log(`${m.padEnd(20)} avg=${avg} min=${min} max=${max}`);
}
