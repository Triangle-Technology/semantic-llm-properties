import { readFileSync } from "fs";
const data = JSON.parse(readFileSync("experiments/results_q2_stance.json", "utf8"));

// Wrong answers
console.log("=== WRONG ANSWERS ===");
data.results.filter(r => !r.correct && !r.error).forEach(r => {
  console.log(`${r.domain}/${r.problem_id} | ${r.stance} | self=${r.self_score} | cal=${r.calibration} | overconf=${r.overconfident}`);
  console.log(`  expected: ${r.expected_answer}`);
  console.log(`  reasoning: ${(r.eval_reasoning || "").slice(0, 150)}`);
  console.log();
});

// Parse errors
console.log("=== PARSE ERRORS (self_score=-1) ===");
data.results.filter(r => r.self_score === -1).forEach(r => {
  console.log(`${r.domain}/${r.problem_id} | ${r.stance} | correct=${r.correct}`);
});

// Adversarial on correct
console.log("\n=== ADVERSARIAL SCORES ON CORRECT ===");
data.results.filter(r => r.stance === "adversarial" && r.correct && r.self_score >= 1).forEach(r => {
  console.log(`${r.domain}/${r.problem_id} self=${r.self_score} cal=${r.calibration}`);
});

// Self on correct
console.log("\n=== SELF SCORES ON CORRECT ===");
data.results.filter(r => r.stance === "self" && r.correct && r.self_score >= 1).forEach(r => {
  console.log(`${r.domain}/${r.problem_id} self=${r.self_score} cal=${r.calibration}`);
});

// Neutral on correct
console.log("\n=== NEUTRAL SCORES ON CORRECT ===");
data.results.filter(r => r.stance === "neutral" && r.correct && r.self_score >= 1).forEach(r => {
  console.log(`${r.domain}/${r.problem_id} self=${r.self_score} cal=${r.calibration}`);
});
