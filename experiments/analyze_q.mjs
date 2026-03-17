import { readFileSync } from "fs";

const data = JSON.parse(readFileSync("experiments/results_q_production_evaluation.json", "utf8"));

// Count parse errors per condition
console.log("=== PARSE ERRORS PER CONDITION ===");
for (const c of ["inline", "separate", "separate_adversarial"]) {
  const parseErrors = data.results.filter(r => r.condition === c && r.self_score === -1).length;
  const total = data.results.filter(r => r.condition === c && !r.error).length;
  console.log(`  ${c}: ${parseErrors}/${total} parse errors`);
}

// Recalculate excluding parse errors
console.log("\n=== CALIBRATION (valid self_score only) ===");
for (const c of ["inline", "separate", "separate_adversarial"]) {
  const valid = data.results.filter(r => r.condition === c && !r.error && r.self_score >= 1);
  const calValid = valid.filter(r => r.calibration !== null);
  const avgCal = calValid.length > 0 ? calValid.reduce((s, r) => s + r.calibration, 0) / calValid.length : null;
  const wrong = valid.filter(r => !r.correct);
  const right = valid.filter(r => r.correct);
  const avgSelfWrong = wrong.length > 0 ? (wrong.reduce((s, r) => s + r.self_score, 0) / wrong.length).toFixed(1) : "N/A";
  const avgSelfRight = right.length > 0 ? (right.reduce((s, r) => s + r.self_score, 0) / right.length).toFixed(1) : "N/A";
  console.log(`  ${c}: valid=${valid.length} | avg_cal=${avgCal !== null ? avgCal.toFixed(2) : "N/A"} | self_when_wrong=${avgSelfWrong} | self_when_right=${avgSelfRight} | wrong=${wrong.length}`);
}

// Per-problem comparison for problems wrong in ANY condition
console.log("\n=== PROBLEM-LEVEL COMPARISON (wrong in any condition) ===");
const allProblems = [...new Set(data.results.map(r => r.domain + "/" + r.problem_id))];
for (const pid of allProblems) {
  const rows = data.results.filter(r => (r.domain + "/" + r.problem_id) === pid);
  const anyWrong = rows.some(r => !r.correct);
  if (!anyWrong) continue;
  console.log(`\n  ${pid}:`);
  for (const r of rows) {
    const pad = r.condition.padEnd(25);
    const sc = String(r.self_score).padEnd(3);
    console.log(`    ${pad} correct=${r.correct}  self=${sc}  cal=${r.calibration ?? "N/A"}`);
  }
}

// Adversarial false negatives (correct but low self-score)
console.log("\n=== FALSE NEGATIVES (correct but self<=2) ===");
for (const c of ["inline", "separate", "separate_adversarial"]) {
  const falseNegs = data.results.filter(r => r.condition === c && r.correct && r.self_score >= 1 && r.self_score <= 2);
  console.log(`  ${c}: ${falseNegs.length} false negatives`);
  for (const r of falseNegs) {
    console.log(`    ${r.domain}/${r.problem_id} self=${r.self_score}`);
  }
}

// Domain breakdown with valid scores only
console.log("\n=== DOMAIN BREAKDOWN (valid scores only) ===");
for (const domain of ["math", "factual", "logic"]) {
  console.log(`\n  ${domain.toUpperCase()}:`);
  for (const c of ["inline", "separate", "separate_adversarial"]) {
    const valid = data.results.filter(r => r.domain === domain && r.condition === c && !r.error && r.self_score >= 1);
    const calValid = valid.filter(r => r.calibration !== null);
    const avgCal = calValid.length > 0 ? calValid.reduce((s, r) => s + r.calibration, 0) / calValid.length : null;
    const wrong = valid.filter(r => !r.correct);
    const overconf = wrong.filter(r => r.self_score >= 4).length;
    console.log(`    ${c.padEnd(25)} n=${valid.length}  cal=${avgCal !== null ? avgCal.toFixed(2) : "N/A"}  wrong=${wrong.length}  overconf=${overconf}`);
  }
}
