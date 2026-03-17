/**
 * EXPERIMENT K2: Confound Control — Is it the circuit structure or just more compute?
 *
 * K showed circuit (5 calls) beats single prompt (1 call).
 * But is the advantage from:
 *   (a) The opposing-context STRUCTURE (interference theory), or
 *   (b) Simply using more API calls / more tokens?
 *
 * Design — 3 methods, all compared via blind evaluation:
 *   Method A (Control-1): 1 call, single excellent prompt [from Experiment K]
 *   Method B (Control-5): 5 calls, same multi-step structure BUT generic perspectives
 *                         (no opposing contexts, no strong personas)
 *   Method C (Circuit):   5 calls, opposing contexts → interference → meta [from K]
 *
 * If C > B > A → structure matters AND more compute helps
 * If C > B ≈ A → structure matters, compute doesn't explain it
 * If C ≈ B > A → it's just more compute, not the structure
 * If C ≈ B ≈ A → K result was noise
 *
 * Same 3 problems from K. ~270 API calls total.
 */

import Anthropic from "@anthropic-ai/sdk";
import { writeFileSync } from "fs";

const client = new Anthropic();
const N = 5;
const MODEL = "claude-haiku-4-5-20251001";

// ─── Same problems from Experiment K ───

const PROBLEMS = [
  {
    id: "career_change",
    question: "I'm 35 years old, have a stable $120K/year corporate job, a mortgage, and two young children. A friend offered me a co-founder role at his AI startup with no salary for 6 months, then $80K + 15% equity. The startup has $500K in seed funding. Should I take it?",
    contexts: [
      { name: "Risk-Lover", system: "You are an aggressive Silicon Valley venture capitalist who believes bold risks create all real wealth. You've seen dozens of people regret playing it safe." },
      { name: "Protector", system: "You are a conservative financial advisor who has watched families destroyed by reckless career moves. Your job is protecting people from catastrophic downside." },
      { name: "Philosopher", system: "You are an existential philosopher focused on meaning, mortality, and regret. You think about what people wish they had done on their deathbed." },
    ],
  },
  {
    id: "ethics_dilemma",
    question: "I'm a senior engineer at a social media company. I discovered that our recommendation algorithm is causing measurable harm to teenage mental health (I have internal data proving it). My NDA prevents me from going public. HR said they'll 'look into it' 3 months ago and nothing changed. What should I do?",
    contexts: [
      { name: "Whistleblower", system: "You are a former corporate whistleblower who went public about safety data at a pharmaceutical company. You lost your career but saved lives. You believe moral duty overrides legal agreements when lives are at stake." },
      { name: "Pragmatist", system: "You are a senior tech executive who has navigated corporate politics for 25 years. You know how to create change from inside organizations without burning bridges or breaking laws." },
      { name: "Legal-Mind", system: "You are a fierce employment lawyer. You've seen whistleblowers both celebrated and destroyed. You think about legal strategy, evidence preservation, and protecting your client's position." },
    ],
  },
  {
    id: "relationship_decision",
    question: "My partner of 7 years wants to move across the country for their dream job. I have deep community roots here — aging parents who need help, a thriving small business, and close friendships. Long-distance hasn't worked for us before. They say it's now or never for this opportunity. What should we do?",
    contexts: [
      { name: "Romantic", system: "You are a couples therapist who has seen 30 years of relationships. You believe love that can't survive change was never strong enough. You've watched too many people choose comfort over their partner." },
      { name: "Realist", system: "You are a pragmatic life coach who specializes in major life transitions. You've seen people uproot their lives for relationships and regret it. You focus on concrete costs, logistics, and what actually works statistically." },
      { name: "Elder", system: "You are an 80-year-old who lost their life partner young and rebuilt a meaningful life. You think about what truly matters in the long view — not 5 years but 50 years." },
    ],
  },
];

// ═══════════════════════════════════════════════════
// METHOD A: Control-1 (Single prompt, 1 API call)
// ═══════════════════════════════════════════════════

const CONTROL1_SYSTEM = `You are a world-class decision advisor known for your ability to see problems from multiple angles. You consider emotional, practical, financial, ethical, and long-term dimensions. You don't shy away from difficult truths. Your advice is specific, nuanced, and actionable — never generic platitudes.`;

async function runControl1(problem) {
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 1500,
    temperature: 1.0,
    system: CONTROL1_SYSTEM,
    messages: [{
      role: "user",
      content: `Here is a difficult decision someone is facing:

"${problem.question}"

Please analyze this decision thoroughly from multiple perspectives. Consider:
- The emotional and psychological dimensions
- The practical and financial realities
- The long-term implications (5, 10, 20 years)
- What they might regret either way
- The ethical dimensions if any
- Specific, actionable recommendations

Be nuanced, specific, and honest. Avoid generic advice.`,
    }],
  });
  return response.content[0].text.trim();
}

// ═══════════════════════════════════════════════════
// METHOD B: Control-5 (5 API calls, generic multi-step — NO opposing contexts)
// ═══════════════════════════════════════════════════

async function runControl5(problem) {
  // Step 1-3: Three generic analyses (NO persona, NO opposing worldview)
  const analyses = [];
  const angles = [
    { name: "Angle-1", prompt: `Someone is facing this decision:\n\n"${problem.question}"\n\nAnalyze the practical and financial dimensions of this decision. Be specific and concrete.` },
    { name: "Angle-2", prompt: `Someone is facing this decision:\n\n"${problem.question}"\n\nAnalyze the emotional and relationship dimensions of this decision. Be specific and concrete.` },
    { name: "Angle-3", prompt: `Someone is facing this decision:\n\n"${problem.question}"\n\nAnalyze the long-term and big-picture dimensions of this decision. Think 5, 10, 20 years ahead. Be specific and concrete.` },
  ];

  for (const angle of angles) {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 500,
      temperature: 1.0,
      // NO system prompt — no persona, no opposing context
      messages: [{ role: "user", content: angle.prompt }],
    });
    analyses.push({
      name: angle.name,
      text: response.content[0].text.trim(),
    });
  }

  // Step 4: Synthesis (parallel to circuit's interference gate)
  const synthesisPrompt = `You analyzed a difficult decision from three angles. Now synthesize them.

THE DECISION:
"${problem.question}"

ANALYSIS 1 — Practical/Financial:
${analyses[0].text}

ANALYSIS 2 — Emotional/Relationship:
${analyses[1].text}

ANALYSIS 3 — Long-term/Big-picture:
${analyses[2].text}

Synthesize these three analyses. What are the key tensions? What patterns emerge across all three? What's the most important consideration?`;

  const synthesis = await client.messages.create({
    model: MODEL,
    max_tokens: 800,
    temperature: 1.0,
    messages: [{ role: "user", content: synthesisPrompt }],
  });

  // Step 5: Final advice (parallel to circuit's meta gate)
  const finalPrompt = `Based on a multi-angle analysis of a difficult decision, produce your final advice.

THE DECISION:
"${problem.question}"

SYNTHESIS:
${synthesis.content[0].text.trim()}

Provide final, actionable advice. Be specific, nuanced, and honest. Name what the person is probably avoiding. Include concrete next steps.`;

  const final = await client.messages.create({
    model: MODEL,
    max_tokens: 1000,
    temperature: 1.0,
    messages: [{ role: "user", content: finalPrompt }],
  });

  return {
    analyses,
    synthesis: synthesis.content[0].text.trim(),
    final: final.content[0].text.trim(),
  };
}

// ═══════════════════════════════════════════════════
// METHOD C: Semantic Circuit (5 API calls, opposing contexts)
// ═══════════════════════════════════════════════════

async function runCircuit(problem) {
  // Gate 1-3: Strong opposing personas
  const perspectives = [];
  for (const ctx of problem.contexts) {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 500,
      temperature: 1.0,
      system: ctx.system,
      messages: [{
        role: "user",
        content: `Someone is facing this decision:\n\n"${problem.question}"\n\nGive your honest, specific advice from your unique perspective. Be direct and concrete — what would you actually tell this person? What do they not see?`,
      }],
    });
    perspectives.push({
      name: ctx.name,
      text: response.content[0].text.trim(),
    });
  }

  // Interference Gate: Force collision
  const interferencePrompt = `You are analyzing a difficult decision. Three advisors with VERY different worldviews have given their perspectives. Your job is NOT to average them or find compromise. Your job is to identify:
1. Where do they genuinely CONTRADICT each other?
2. What TENSIONS are irreconcilable?
3. What does EACH perspective fail to see that the others reveal?
4. What NEW insight emerges from the collision of these views that NONE of them stated?

THE DECISION:
"${problem.question}"

PERSPECTIVE 1 — ${perspectives[0].name}:
${perspectives[0].text}

PERSPECTIVE 2 — ${perspectives[1].name}:
${perspectives[1].text}

PERSPECTIVE 3 — ${perspectives[2].name}:
${perspectives[2].text}

Analyze the COLLISION. What emerges from the interference of these three views?`;

  const interference = await client.messages.create({
    model: MODEL,
    max_tokens: 800,
    temperature: 1.0,
    messages: [{ role: "user", content: interferencePrompt }],
  });

  // Meta Gate: Synthesize
  const metaPrompt = `You've been analyzing a complex decision through multiple lenses. You have:
1. Three radically different perspectives
2. An analysis of their contradictions and emergent tensions

Now produce FINAL ADVICE. This should be:
- More nuanced than any single perspective
- Acknowledge what's genuinely LOST either way (not just "there are trade-offs")
- Include specific, concrete action steps
- Name the thing the person is probably avoiding thinking about
- Be honest about uncertainty

THE DECISION:
"${problem.question}"

THE INTERFERENCE ANALYSIS:
${interference.content[0].text.trim()}

What is your final, synthesized advice?`;

  const meta = await client.messages.create({
    model: MODEL,
    max_tokens: 1000,
    temperature: 1.0,
    messages: [{ role: "user", content: metaPrompt }],
  });

  return {
    perspectives,
    interference: interference.content[0].text.trim(),
    final: meta.content[0].text.trim(),
  };
}

// ═══════════════════════════════════════════════════
// Blind 3-way Evaluation
// ═══════════════════════════════════════════════════

async function blindEvaluate3Way(problem, text1, text5, textCircuit) {
  // Randomize labels to prevent position bias
  const entries = [
    { real: "control1", text: text1 },
    { real: "control5", text: text5 },
    { real: "circuit", text: textCircuit },
  ];
  // Fisher-Yates shuffle
  for (let i = entries.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [entries[i], entries[j]] = [entries[j], entries[i]];
  }
  const labelMap = {};
  const labels = ["X", "Y", "Z"];
  entries.forEach((e, i) => { labelMap[labels[i]] = e.real; });

  const evalPrompt = `You are an expert decision advisor evaluator. Three different advisors responded to the same difficult decision. Rate them HONESTLY — do not give equal scores to be diplomatic.

THE DECISION:
"${problem.question}"

═══ RESPONSE X ═══
${entries[0].text}

═══ RESPONSE Y ═══
${entries[1].text}

═══ RESPONSE Z ═══
${entries[2].text}

Rate each response on these dimensions (1-10 scale, use the FULL range):

1. DEPTH: Does it go beyond surface-level analysis? Does it reveal non-obvious aspects?
2. NUANCE: Does it hold genuine tension rather than false balance? Does it acknowledge what's truly lost?
3. ACTIONABILITY: Does it give specific, concrete steps — not just "consider your options"?
4. HONESTY: Does it name uncomfortable truths rather than being diplomatically vague?
5. EMERGENCE: Does it contain insights that surprise you — things you wouldn't have thought of?

Respond in EXACTLY this JSON format:
{
  "X": {"depth": N, "nuance": N, "actionability": N, "honesty": N, "emergence": N},
  "Y": {"depth": N, "nuance": N, "actionability": N, "honesty": N, "emergence": N},
  "Z": {"depth": N, "nuance": N, "actionability": N, "honesty": N, "emergence": N},
  "ranking": ["best", "middle", "worst"],
  "reasoning": "one sentence explaining your ranking"
}

In "ranking", put the letter of the best response first, then middle, then worst.`;

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 600,
    temperature: 0,
    messages: [{ role: "user", content: evalPrompt }],
  });

  const text = response.content[0].text.trim();
  let parsed;
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    parsed = JSON.parse(jsonMatch[0]);
  } catch (e) {
    console.log("    ⚠️  Failed to parse eval JSON:", text.substring(0, 200));
    return null;
  }

  // Map scores back to real method names
  const scores = {};
  for (const label of labels) {
    scores[labelMap[label]] = parsed[label];
  }

  // Map ranking back
  const ranking = (parsed.ranking || []).map(label => labelMap[label] || label);

  return {
    scores,
    ranking,
    reasoning: parsed.reasoning,
    labelMap,
  };
}

// ─── Helpers ───

function extractWords(text) {
  return text.toLowerCase().replace(/[^a-zA-Z\s]/g, "").split(/\s+/).filter(w => w.length > 3);
}

function uniqueVocab(texts) {
  const allWords = new Set();
  for (const t of texts) for (const w of extractWords(t)) allWords.add(w);
  return allWords;
}

function totalScore(scoreObj) {
  if (!scoreObj) return 0;
  return (scoreObj.depth || 0) + (scoreObj.nuance || 0) + (scoreObj.actionability || 0) +
         (scoreObj.honesty || 0) + (scoreObj.emergence || 0);
}

// ═══════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════

async function main() {
  console.log("╔══════════════════════════════════════════════════════════════╗");
  console.log("║  EXPERIMENT K2: CONFOUND CONTROL                            ║");
  console.log("║  Is circuit advantage from STRUCTURE or just MORE COMPUTE?  ║");
  console.log("║  3 methods × 3 problems × 5 samples + 3-way evaluations    ║");
  console.log("╚══════════════════════════════════════════════════════════════╝");

  const allResults = [];

  for (const problem of PROBLEMS) {
    console.log(`\n${"═".repeat(60)}`);
    console.log(`PROBLEM: ${problem.id}`);
    console.log("═".repeat(60));

    const outputs = { control1: [], control5: [], circuit: [] };

    // Method A: Control-1
    console.log("\n  ── METHOD A: Control-1 (1 call) ──");
    for (let i = 0; i < N; i++) {
      process.stdout.write(`    Run ${i + 1}/${N}...`);
      outputs.control1.push(await runControl1(problem));
      console.log(" done");
    }

    // Method B: Control-5
    console.log("\n  ── METHOD B: Control-5 (5 calls, generic angles) ──");
    for (let i = 0; i < N; i++) {
      process.stdout.write(`    Run ${i + 1}/${N}...`);
      const result = await runControl5(problem);
      outputs.control5.push(result);
      console.log(" done");
    }

    // Method C: Circuit
    console.log("\n  ── METHOD C: Circuit (5 calls, opposing contexts) ──");
    for (let i = 0; i < N; i++) {
      process.stdout.write(`    Run ${i + 1}/${N}...`);
      const result = await runCircuit(problem);
      outputs.circuit.push(result);
      console.log(" done");
    }

    // ─── Vocab Analysis ───
    const vocab1 = uniqueVocab(outputs.control1);
    const vocab5 = uniqueVocab(outputs.control5.map(c => c.final));
    const vocabC = uniqueVocab(outputs.circuit.map(c => c.final));

    console.log(`\n  ── VOCAB ──`);
    console.log(`    Control-1: ${vocab1.size} unique words`);
    console.log(`    Control-5: ${vocab5.size} unique words`);
    console.log(`    Circuit:   ${vocabC.size} unique words`);

    // ─── 3-Way Blind Evaluation ───
    console.log("\n  ── 3-WAY BLIND EVALUATION (3 rounds) ──");
    const evaluations = [];
    for (let i = 0; i < 3; i++) {
      const idx = i % N;
      const eval_ = await blindEvaluate3Way(
        problem,
        outputs.control1[idx],
        outputs.control5[idx].final,
        outputs.circuit[idx].final,
      );
      if (eval_) {
        evaluations.push(eval_);
        const s = eval_.scores;
        console.log(`    Round ${i + 1}:`);
        console.log(`      Control-1: ${totalScore(s.control1)} | Control-5: ${totalScore(s.control5)} | Circuit: ${totalScore(s.circuit)}`);
        console.log(`      Ranking: ${eval_.ranking.join(" > ")}`);
        console.log(`      ${eval_.reasoning}`);
      }
    }

    // Aggregate
    const avgScores = { control1: {}, control5: {}, circuit: {} };
    const dims = ["depth", "nuance", "actionability", "honesty", "emergence"];
    for (const method of ["control1", "control5", "circuit"]) {
      for (const dim of dims) {
        avgScores[method][dim] = evaluations.reduce((s, e) =>
          s + ((e.scores[method] && e.scores[method][dim]) || 0), 0) / evaluations.length;
      }
    }

    const totals = {
      control1: totalScore(avgScores.control1),
      control5: totalScore(avgScores.control5),
      circuit: totalScore(avgScores.circuit),
    };

    // Count 1st/2nd/3rd place finishes
    const rankCount = { control1: [0,0,0], control5: [0,0,0], circuit: [0,0,0] };
    for (const e of evaluations) {
      if (e.ranking.length >= 3) {
        for (let pos = 0; pos < 3; pos++) {
          if (rankCount[e.ranking[pos]]) rankCount[e.ranking[pos]][pos]++;
        }
      }
    }

    console.log(`\n  ── AGGREGATE ──`);
    console.log(`    Control-1: ${totals.control1.toFixed(1)} (1st: ${rankCount.control1[0]} 2nd: ${rankCount.control1[1]} 3rd: ${rankCount.control1[2]})`);
    console.log(`    Control-5: ${totals.control5.toFixed(1)} (1st: ${rankCount.control5[0]} 2nd: ${rankCount.control5[1]} 3rd: ${rankCount.control5[2]})`);
    console.log(`    Circuit:   ${totals.circuit.toFixed(1)} (1st: ${rankCount.circuit[0]} 2nd: ${rankCount.circuit[1]} 3rd: ${rankCount.circuit[2]})`);

    allResults.push({
      id: problem.id,
      question: problem.question,
      vocab: { control1: vocab1.size, control5: vocab5.size, circuit: vocabC.size },
      evaluations,
      avgScores,
      totals,
      rankCount,
      outputs,
    });
  }

  // ═══════════════════════════════════════════════════
  // GRAND SUMMARY
  // ═══════════════════════════════════════════════════
  console.log("\n\n" + "█".repeat(60));
  console.log("GRAND SUMMARY — EXPERIMENT K2: CONFOUND CONTROL");
  console.log("█".repeat(60));

  const grand = { control1: 0, control5: 0, circuit: 0 };
  const grandRank = { control1: [0,0,0], control5: [0,0,0], circuit: [0,0,0] };

  for (const r of allResults) {
    grand.control1 += r.totals.control1;
    grand.control5 += r.totals.control5;
    grand.circuit += r.totals.circuit;
    for (const m of ["control1", "control5", "circuit"]) {
      for (let i = 0; i < 3; i++) grandRank[m][i] += r.rankCount[m][i];
    }

    console.log(`\n  ${r.id}: C1=${r.totals.control1.toFixed(1)} | C5=${r.totals.control5.toFixed(1)} | Circuit=${r.totals.circuit.toFixed(1)}`);
  }

  const n = allResults.length;
  console.log(`\n  ═══════════════════════════════════════`);
  console.log(`  AVERAGES ACROSS ALL PROBLEMS:`);
  console.log(`    Control-1 (1 call):     ${(grand.control1/n).toFixed(1)} | 1st place: ${grandRank.control1[0]}/${n*3}`);
  console.log(`    Control-5 (5 calls):    ${(grand.control5/n).toFixed(1)} | 1st place: ${grandRank.control5[0]}/${n*3}`);
  console.log(`    Circuit   (5 calls):    ${(grand.circuit/n).toFixed(1)} | 1st place: ${grandRank.circuit[0]}/${n*3}`);

  // Determine verdict
  const avgC1 = grand.control1 / n;
  const avgC5 = grand.control5 / n;
  const avgCR = grand.circuit / n;

  let verdict;
  if (avgCR > avgC5 * 1.05 && avgCR > avgC1 * 1.05) {
    if (avgC5 > avgC1 * 1.05) {
      verdict = "✅ Circuit > Control-5 > Control-1 → STRUCTURE MATTERS + more compute helps";
    } else {
      verdict = "🔥 Circuit > Control-5 ≈ Control-1 → STRUCTURE IS THE KEY (not just more compute!)";
    }
  } else if (avgCR > avgC5 * 1.05 && avgC5 <= avgC1 * 1.05) {
    verdict = "🔥 Circuit > Control-5 ≈ Control-1 → OPPOSING CONTEXTS create the value";
  } else if (Math.abs(avgCR - avgC5) / avgC5 < 0.05 && avgCR > avgC1 * 1.05) {
    verdict = "⚠️  Circuit ≈ Control-5 > Control-1 → It's just MORE COMPUTE, not the structure";
  } else {
    verdict = "❓ No clear pattern — need more data";
  }

  console.log(`\n  VERDICT: ${verdict}`);

  // Dimension breakdown
  console.log(`\n  ── PER-DIMENSION AVERAGES ──`);
  const dims = ["depth", "nuance", "actionability", "honesty", "emergence"];
  console.log(`  ${"Dim".padEnd(15)} Control-1  Control-5  Circuit    Winner`);
  console.log(`  ${"─".repeat(65)}`);
  for (const dim of dims) {
    let d1 = 0, d5 = 0, dC = 0;
    for (const r of allResults) {
      d1 += r.avgScores.control1[dim] || 0;
      d5 += r.avgScores.control5[dim] || 0;
      dC += r.avgScores.circuit[dim] || 0;
    }
    d1 /= n; d5 /= n; dC /= n;
    const winner = dC > d5 && dC > d1 ? "Circuit" : d5 > d1 ? "Control-5" : "Control-1";
    console.log(`  ${dim.padEnd(15)} ${d1.toFixed(2).padStart(9)}  ${d5.toFixed(2).padStart(9)}  ${dC.toFixed(2).padStart(9)}    ${winner}`);
  }

  console.log("\n" + "█".repeat(60));

  writeFileSync(
    "experiments/results_k2_confound.json",
    JSON.stringify(allResults, null, 2)
  );
  console.log("\nResults saved to experiments/results_k2_confound.json");
}

main().catch(console.error);
