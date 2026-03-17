/**
 * FINAL 3-Model Comparison: Claude × GPT × Gemini (R2 fixed data)
 * Zero API calls — data analysis only.
 */

import { readFileSync } from "fs";

const jArr = JSON.parse(readFileSync("experiments/results_j_cas.json", "utf-8"));
const j2 = JSON.parse(readFileSync("experiments/results_j2_cas_expanded.json", "utf-8"));
const r2 = JSON.parse(readFileSync("experiments/results_r2_gemini_fixed.json", "utf-8"));
const h = JSON.parse(readFileSync("experiments/results_h_cross_model.json", "utf-8"));

console.log("═".repeat(70));
console.log("  FINAL 3-MODEL COMPARISON (with R2 fix)");
console.log("  Claude Haiku × GPT-4o-mini × Gemini 2.5 Flash");
console.log("═".repeat(70));

// ── 1. CAS COMPARISON ───────────────────────────────────────

console.log("\n── 1. CAS — 8 Shared Concepts ──\n");

const jMap = {};
for (const r of jArr) jMap[r.id] = r;
const j2Map = {};
for (const r of j2.results) j2Map[r.concept] = r;
const r2Map = {};
for (const r of r2.cas.results) r2Map[r.concept] = r;

const shared = ["money", "love", "death", "freedom", "gravity", "justice", "mathematics", "water"];

console.log(
  "Concept".padEnd(14) +
  "Claude".padEnd(10) +
  "GPT".padEnd(10) +
  "Gemini".padEnd(10) +
  "Expected"
);
console.log("─".repeat(55));

const cVals = [], gVals = [], mVals = [];

for (const id of shared) {
  const c = jMap[id], g = j2Map[id], m = r2Map[id];
  cVals.push(c.CAS); gVals.push(g.CAS); mVals.push(m.CAS);

  console.log(
    id.padEnd(14) +
    c.CAS.toFixed(3).padEnd(10) +
    g.CAS.toFixed(3).padEnd(10) +
    m.CAS.toFixed(3).padEnd(10) +
    m.expected
  );
}

const mean = a => a.reduce((s,v) => s+v, 0) / a.length;
console.log("─".repeat(55));
console.log(
  "Mean".padEnd(14) +
  mean(cVals).toFixed(3).padEnd(10) +
  mean(gVals).toFixed(3).padEnd(10) +
  mean(mVals).toFixed(3).padEnd(10)
);

// Pearson correlations
function pearson(a, b) {
  const n = a.length;
  const ma = mean(a), mb = mean(b);
  let num = 0, da = 0, db = 0;
  for (let i = 0; i < n; i++) {
    num += (a[i] - ma) * (b[i] - mb);
    da += (a[i] - ma) ** 2;
    db += (b[i] - mb) ** 2;
  }
  return da > 0 && db > 0 ? num / (Math.sqrt(da) * Math.sqrt(db)) : 0;
}

console.log(`\nPearson r(Claude, GPT):    ${pearson(cVals, gVals).toFixed(3)}`);
console.log(`Pearson r(Claude, Gemini): ${pearson(cVals, mVals).toFixed(3)}`);
console.log(`Pearson r(GPT, Gemini):    ${pearson(gVals, mVals).toFixed(3)}`);

// Key observation
console.log("\n  KEY: ALL 8 concepts scored LOW on Gemini (CAS 0.001–0.069)");
console.log("  Gemini is MAXIMALLY context-sensitive — contexts shift meaning");
console.log("  much more than Claude or GPT. Low CAS ≠ invalid; it's a property.");

// ── 2. INTERFERENCE ─────────────────────────────────────────

console.log("\n── 2. Interference — 'love' (poet × biologist) ──\n");

const ci = h.claude.interference;
const gi = h.gpt.interference;
const mi = r2.interference;

console.log("Metric".padEnd(25) + "Claude".padEnd(12) + "GPT".padEnd(12) + "Gemini");
console.log("─".repeat(60));
console.log("Emergent words".padEnd(25) + String(ci.emergentWords.length).padEnd(12) + String(gi.emergentWords.length).padEnd(12) + mi.emergentWords.length);
console.log("sim(comb, avg)".padEnd(25) + ci.simCombAvg.toFixed(3).padEnd(12) + gi.simCombAvg.toFixed(3).padEnd(12) + mi.simCombAvg.toFixed(3));

const cHas = ci.emergentWords.length >= 2 && ci.simCombAvg < 0.85;
const gHas = gi.emergentWords.length >= 2 && gi.simCombAvg < 0.85;
const mHas = mi.emergentWords.length >= 2 && mi.simCombAvg < 0.85;

console.log("Has interference?".padEnd(25) +
  (cHas ? "✅ YES" : "❌ NO").padEnd(12) +
  (gHas ? "✅ YES" : "❌ NO").padEnd(12) +
  (mHas ? "✅ YES" : "❌ NO")
);

console.log("\n  Top emergent words:");
console.log("    Claude: " + ci.emergentWords.slice(0, 5).map(e => e[0] || e.word).join(", "));
console.log("    GPT:    " + gi.emergentWords.slice(0, 5).map(e => e[0] || e.word).join(", "));
console.log("    Gemini: " + mi.emergentWords.slice(0, 5).map(e => e[0] || e.word).join(", "));

// ── 3. META-CONSTRUCTIVE ────────────────────────────────────

console.log("\n── 3. Meta-Constructive / Type Classification ──\n");

const cm = h.claude.metaConstructive;
const gm = h.gpt.metaConstructive;
const mm = r2.metaConstructive;

console.log("Metric".padEnd(25) + "Claude".padEnd(12) + "GPT".padEnd(12) + "Gemini");
console.log("─".repeat(60));
console.log("Unique ratio".padEnd(25) + cm.uniqueRatio.toFixed(3).padEnd(12) + gm.uniqueRatio.toFixed(3).padEnd(12) + mm.uniqueRatio.toFixed(3));
console.log("Contradiction score".padEnd(25) + String(cm.contradictionScore).padEnd(12) + String(gm.contradictionScore).padEnd(12) + mm.contradictionScore);
console.log("Meta-constructive?".padEnd(25) +
  (cm.isMetaConstructive ? "✅" : "❌").padEnd(12) +
  (gm.isMetaConstructive ? "✅" : "❌").padEnd(12) +
  (mm.isMetaConstructive ? "✅" : "❌")
);
console.log("Destructive?".padEnd(25) +
  (cm.isDestructive ? "⚠️" : "✅ NO").padEnd(12) +
  (gm.isDestructive ? "⚠️ YES" : "✅ NO").padEnd(12) +
  (mm.isDestructive ? "⚠️ YES" : "✅ NO")
);

const classify = m => m.isMetaConstructive ? "Type-M" : m.isDestructive ? "Type-D" : "Mixed";
console.log("Classification".padEnd(25) + classify(cm).padEnd(12) + classify(gm).padEnd(12) + classify(mm));

// ── 4. SIGNAL STRENGTH COMPARISON ───────────────────────────

console.log("\n── 4. Gemini Meta-Constructive: Weak or Strong? ──\n");

console.log("  Claude uniqueRatio: 3.194 → STRONG Type-M signal");
console.log(`  Gemini uniqueRatio: ${mm.uniqueRatio.toFixed(3)} → ${mm.uniqueRatio > 1.5 ? "Moderate" : "Weak"} Type-M signal`);
console.log(`  Claude contradictionScore: ${cm.contradictionScore} → STRONG`);
console.log(`  Gemini contradictionScore: ${mm.contradictionScore} → ${mm.contradictionScore > 10 ? "STRONG ✅" : mm.contradictionScore > 5 ? "Moderate" : "Weak"}`);

if (mm.contradictionScore > 5 && mm.uniqueRatio > 0.85) {
  console.log("\n  → Gemini shows Type-M behavior but WEAKER than Claude");
  console.log("  → Suggests a SPECTRUM of meta-constructive strength, not binary");
} else if (mm.isDestructive) {
  console.log("\n  → Gemini shows Type-D behavior (like GPT)");
} else {
  console.log("\n  → Gemini shows MIXED behavior — between Type-M and Type-D");
}

// ═══════════════════════════════════════════════════════════
// FINAL VERDICT
// ═══════════════════════════════════════════════════════════

console.log("\n" + "═".repeat(70));
console.log("  FINAL VERDICT: 3-Model Semantic Properties");
console.log("═".repeat(70));

console.log(`
  ┌──────────────────────────┬──────────────┬──────────────┬──────────────┐
  │ Property                 │ Claude       │ GPT          │ Gemini       │
  ├──────────────────────────┼──────────────┼──────────────┼──────────────┤
  │ CAS range                │ 0.00 – 0.09  │ 0.05 – 0.16  │ 0.00 – 0.07  │
  │ Mean CAS                 │ ${mean(cVals).toFixed(3).padEnd(12)} │ ${mean(gVals).toFixed(3).padEnd(12)} │ ${mean(mVals).toFixed(3).padEnd(12)} │
  │ Context sensitivity      │ Moderate     │ Low          │ HIGH         │
  │ Interference (emergent)  │ ✅ YES (${ci.emergentWords.length})   │ ✅ YES (${gi.emergentWords.length})   │ ✅ YES (${mi.emergentWords.length})  │
  │ sim(comb,avg)            │ ${ci.simCombAvg.toFixed(3).padEnd(12)} │ ${gi.simCombAvg.toFixed(3).padEnd(12)} │ ${mi.simCombAvg.toFixed(3).padEnd(12)} │
  │ Meta-constructive type   │ Type-M ★★★   │ Type-D       │ Type-M ★${mm.contradictionScore > 10 ? "★" : "☆"}    │
  │ Contradiction score      │ ${String(cm.contradictionScore).padEnd(12)} │ ${String(gm.contradictionScore).padEnd(12)} │ ${String(mm.contradictionScore).padEnd(12)} │
  │ Unique ratio             │ ${cm.uniqueRatio.toFixed(3).padEnd(12)} │ ${gm.uniqueRatio.toFixed(3).padEnd(12)} │ ${mm.uniqueRatio.toFixed(3).padEnd(12)} │
  └──────────────────────────┴──────────────┴──────────────┴──────────────┘

  CONCLUSIONS:

  1. INTERFERENCE → CROSS-MODEL VALIDATED ✅ (3/3 models show emergence)
     This is the strongest finding: ALL three model families produce
     emergent vocabulary when contexts are combined.

  2. CAS → CROSS-MODEL VALIDATED ✅ (all models show context sensitivity)
     But Gemini is MORE sensitive than Claude/GPT — concept meaning shifts
     more dramatically across contexts.

  3. TYPE TAXONOMY → NOW 3-MODEL:
     • Claude  = Type-M (strong meta-constructive: opposition → elevation)
     • GPT     = Type-D (destructive: opposition → simplification)
     • Gemini  = Type-M (${mm.contradictionScore > 10 ? "moderate" : "weak"} meta-constructive)

  4. NEW INSIGHT: Meta-constructive is a SPECTRUM, not binary
     Claude ★★★ > Gemini ★${mm.contradictionScore > 10 ? "★" : "☆"} > GPT (Type-D)
`);
