import { readFileSync } from "fs";
const data = JSON.parse(readFileSync("experiments/results_j_cas.json", "utf8"));

console.log("CAS RANKING:");
console.log("─".repeat(85));
console.log("Rank | Concept      | CAS     | Expected | Resistance | Entropy | AvgShift | Match");
console.log("─".repeat(85));

const sorted = [...data].sort((a, b) => b.CAS - a.CAS);
sorted.forEach((r, i) => {
  const level = r.CAS > 0.5 ? "HIGH" : r.CAS > 0.25 ? "MEDIUM" : "LOW";
  const match = level === r.expectedCAS ? "✅" : "❌";
  console.log(
    `${String(i + 1).padStart(4)} | ${r.id.padEnd(12)} | ${r.CAS.toFixed(3).padStart(7)} | ${r.expectedCAS.padEnd(8)} | ${r.contextResistance.toFixed(3).padStart(10)} | ${r.baseline.entropy.toFixed(3).padStart(7)} | ${r.avgShift.toFixed(3).padStart(8)} | ${match}`
  );
});

const predictions = sorted.map(r => {
  const level = r.CAS > 0.5 ? "HIGH" : r.CAS > 0.25 ? "MEDIUM" : "LOW";
  return level === r.expectedCAS;
});
console.log(`\nPrediction accuracy: ${(predictions.filter(Boolean).length / predictions.length * 100).toFixed(0)}%`);

console.log("\nVALIDATION vs EXPERIMENT I:");
const expI = { love: { t: true, n: "2 clean transitions" }, death: { t: true, n: "2 messy transitions" }, money: { t: false, n: "NO transitions" } };
for (const [c, e] of Object.entries(expI)) {
  const r = data.find(x => x.id === c);
  if (r) {
    const pred = r.CAS < 0.35;
    const match = pred === e.t ? "✅" : "❌";
    console.log(`  ${c.padEnd(8)}: CAS=${r.CAS.toFixed(3)} → predicted=${pred ? "transitions" : "no transitions"} | actual=${e.n} | ${match}`);
  }
}

console.log("\nCROSS-CONTEXT SIMILARITY (how different are the two contexts?):");
sorted.forEach(r => {
  console.log(`  ${r.id.padEnd(12)}: crossSim=${r.crossContextSim.toFixed(3)} (low=contexts very different)`);
});
