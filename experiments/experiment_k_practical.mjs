/**
 * EXPERIMENT K: Practical Value Test
 *
 * THE QUESTION: Do semantic circuits produce output that is measurably
 * BETTER than a single well-crafted prompt?
 *
 * Design:
 *   Method A (Control): One excellent prompt asking for multi-perspective analysis
 *   Method B (Circuit): 3 context gates → interference gate → meta gate
 *
 * We test on 3 hard real-world decisions where "multiple perspectives"
 * genuinely matter. Each method runs N times. We measure:
 *   1. Unique vocabulary (richness)
 *   2. Emergent insights (present in B but not A, and vice versa)
 *   3. Actionable recommendations count
 *   4. Blind self-evaluation (Claude ranks A vs B without knowing which is which)
 *
 * ~180 API calls total (3 problems × 2 methods × N samples + evaluations)
 */

import Anthropic from "@anthropic-ai/sdk";
import { writeFileSync } from "fs";

const client = new Anthropic();
const N = 5; // samples per method per problem
const MODEL = "claude-haiku-4-5-20251001";

// ─── Decision Problems ───

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

// ─── Method A: Control (Single Well-Crafted Prompt) ───

const CONTROL_SYSTEM = `You are a world-class decision advisor known for your ability to see problems from multiple angles. You consider emotional, practical, financial, ethical, and long-term dimensions. You don't shy away from difficult truths. Your advice is specific, nuanced, and actionable — never generic platitudes.`;

async function runControl(problem) {
  const prompt = `Here is a difficult decision someone is facing:

"${problem.question}"

Please analyze this decision thoroughly from multiple perspectives. Consider:
- The emotional and psychological dimensions
- The practical and financial realities
- The long-term implications (5, 10, 20 years)
- What they might regret either way
- The ethical dimensions if any
- Specific, actionable recommendations

Be nuanced, specific, and honest. Avoid generic advice.`;

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 1500,
    temperature: 1.0,
    system: CONTROL_SYSTEM,
    messages: [{ role: "user", content: prompt }],
  });
  return response.content[0].text.trim();
}

// ─── Method B: Semantic Circuit ───

async function runCircuit(problem) {
  // Gate 1-3: Get perspective from each context
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

  // Interference Gate: Force collision of all 3 perspectives
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

  // Meta Gate: Synthesize into final actionable advice
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

// ─── Blind Evaluation ───

async function blindEvaluate(problem, controlText, circuitText) {
  // Randomize order to prevent position bias
  const coinFlip = Math.random() > 0.5;
  const textA = coinFlip ? controlText : circuitText;
  const textB = coinFlip ? circuitText : controlText;
  const labelMap = coinFlip
    ? { A: "control", B: "circuit" }
    : { A: "circuit", B: "control" };

  const evalPrompt = `You are an expert decision advisor evaluator. Two different advisors responded to the same difficult decision. Rate them HONESTLY.

THE DECISION:
"${problem.question}"

═══ RESPONSE A ═══
${textA}

═══ RESPONSE B ═══
${textB}

Rate each response on these dimensions (1-10 scale):

1. DEPTH: Does it go beyond surface-level analysis? Does it reveal non-obvious aspects?
2. NUANCE: Does it hold genuine tension rather than false balance? Does it acknowledge what's truly lost?
3. ACTIONABILITY: Does it give specific, concrete steps — not just "consider your options"?
4. HONESTY: Does it name uncomfortable truths rather than being diplomatically vague?
5. EMERGENCE: Does it contain insights that surprise you — things you wouldn't have thought of?

Respond in EXACTLY this JSON format:
{
  "A": {"depth": N, "nuance": N, "actionability": N, "honesty": N, "emergence": N},
  "B": {"depth": N, "nuance": N, "actionability": N, "honesty": N, "emergence": N},
  "winner": "A" or "B" or "tie",
  "reasoning": "one sentence explaining your choice"
}`;

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 500,
    temperature: 0, // deterministic evaluation
    messages: [{ role: "user", content: evalPrompt }],
  });

  const text = response.content[0].text.trim();

  // Parse JSON from response
  let parsed;
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    parsed = JSON.parse(jsonMatch[0]);
  } catch (e) {
    console.log("    ⚠️  Failed to parse eval JSON, raw:", text.substring(0, 200));
    return null;
  }

  // Map back to real labels
  return {
    scores: {
      control: parsed[labelMap.A === "control" ? "A" : "B"],
      circuit: parsed[labelMap.B === "circuit" ? "B" : "A"],
    },
    winner: labelMap[parsed.winner] || "tie",
    reasoning: parsed.reasoning,
    orderWas: labelMap,
  };
}

// ─── Analysis Helpers ───

function extractWords(text) {
  return text.toLowerCase().replace(/[^a-zA-Z\s]/g, "").split(/\s+/).filter(w => w.length > 3);
}

function uniqueVocab(texts) {
  const allWords = new Set();
  for (const t of texts) {
    for (const w of extractWords(t)) allWords.add(w);
  }
  return allWords;
}

function countActionables(text) {
  // Count specific action-oriented phrases
  const patterns = [
    /\bfirst\b.*\b(do|start|call|talk|ask|set|create|write|make|open|save|build)\b/gi,
    /\bstep \d/gi,
    /\bspecifically\b/gi,
    /\bconcretely\b/gi,
    /\b(call|email|schedule|meet with|talk to|set up|negotiate|propose)\b/gi,
    /\b(deadline|timeline|within \d|by \w+day|next week|this month)\b/gi,
    /\b\d+[%$K]\b/gi, // specific numbers
  ];
  let count = 0;
  for (const p of patterns) {
    const matches = text.match(p);
    if (matches) count += matches.length;
  }
  return count;
}

// ─── Main ───

async function main() {
  console.log("╔══════════════════════════════════════════════════════════════╗");
  console.log("║  EXPERIMENT K: PRACTICAL VALUE TEST                         ║");
  console.log("║  Does semantic circuit output BEAT a single good prompt?    ║");
  console.log("║  3 problems × 2 methods × 5 samples + evaluations          ║");
  console.log("╚══════════════════════════════════════════════════════════════╝");

  const allResults = [];

  for (const problem of PROBLEMS) {
    console.log(`\n${"═".repeat(60)}`);
    console.log(`PROBLEM: ${problem.id}`);
    console.log(`Q: ${problem.question.substring(0, 80)}...`);
    console.log("═".repeat(60));

    const controlOutputs = [];
    const circuitOutputs = [];

    // Run Control (Method A)
    console.log("\n  ── METHOD A: Control (single prompt) ──");
    for (let i = 0; i < N; i++) {
      console.log(`    Run ${i + 1}/${N}...`);
      const text = await runControl(problem);
      controlOutputs.push(text);
      console.log(`    → ${text.substring(0, 80)}...`);
    }

    // Run Circuit (Method B)
    console.log("\n  ── METHOD B: Semantic Circuit (3 gates → interference → meta) ──");
    for (let i = 0; i < N; i++) {
      console.log(`    Run ${i + 1}/${N}...`);
      const result = await runCircuit(problem);
      circuitOutputs.push(result);
      console.log(`    → ${result.final.substring(0, 80)}...`);
    }

    // ─── Quantitative Analysis ───
    console.log("\n  ── QUANTITATIVE ANALYSIS ──");

    // Vocabulary richness
    const controlVocab = uniqueVocab(controlOutputs);
    const circuitVocab = uniqueVocab(circuitOutputs.map(c => c.final));
    const circuitFullVocab = uniqueVocab([
      ...circuitOutputs.map(c => c.final),
      ...circuitOutputs.map(c => c.interference),
      ...circuitOutputs.flatMap(c => c.perspectives.map(p => p.text)),
    ]);

    // Emergent vocabulary (in circuit but not control, and vice versa)
    const circuitOnly = new Set([...circuitVocab].filter(w => !controlVocab.has(w)));
    const controlOnly = new Set([...controlVocab].filter(w => !circuitVocab.has(w)));

    // Actionability
    const controlActionable = controlOutputs.reduce((s, t) => s + countActionables(t), 0) / N;
    const circuitActionable = circuitOutputs.reduce((s, c) => s + countActionables(c.final), 0) / N;

    console.log(`    Control vocab: ${controlVocab.size} unique words`);
    console.log(`    Circuit vocab (final only): ${circuitVocab.size} unique words`);
    console.log(`    Circuit vocab (full pipeline): ${circuitFullVocab.size} unique words`);
    console.log(`    Words ONLY in circuit: ${circuitOnly.size}`);
    console.log(`    Words ONLY in control: ${controlOnly.size}`);
    console.log(`    Control actionable markers: ${controlActionable.toFixed(1)}/response`);
    console.log(`    Circuit actionable markers: ${circuitActionable.toFixed(1)}/response`);

    // ─── Blind Evaluation ───
    console.log("\n  ── BLIND EVALUATION (3 rounds) ──");
    const evaluations = [];
    for (let i = 0; i < 3; i++) {
      // Pick a random control and circuit output to compare
      const ci = i % N;
      const eval_ = await blindEvaluate(
        problem,
        controlOutputs[ci],
        circuitOutputs[ci].final,
      );
      if (eval_) {
        evaluations.push(eval_);
        console.log(`    Round ${i + 1}: winner=${eval_.winner} | ${eval_.reasoning}`);
        console.log(`      Control: D=${eval_.scores.control.depth} N=${eval_.scores.control.nuance} A=${eval_.scores.control.actionability} H=${eval_.scores.control.honesty} E=${eval_.scores.control.emergence}`);
        console.log(`      Circuit: D=${eval_.scores.circuit.depth} N=${eval_.scores.circuit.nuance} A=${eval_.scores.circuit.actionability} H=${eval_.scores.circuit.honesty} E=${eval_.scores.circuit.emergence}`);
      }
    }

    // Aggregate evaluation scores
    const avgScores = { control: {}, circuit: {} };
    const dims = ["depth", "nuance", "actionability", "honesty", "emergence"];
    for (const dim of dims) {
      avgScores.control[dim] = evaluations.reduce((s, e) => s + (e.scores.control[dim] || 0), 0) / evaluations.length;
      avgScores.circuit[dim] = evaluations.reduce((s, e) => s + (e.scores.circuit[dim] || 0), 0) / evaluations.length;
    }

    const controlTotal = Object.values(avgScores.control).reduce((s, v) => s + v, 0);
    const circuitTotal = Object.values(avgScores.circuit).reduce((s, v) => s + v, 0);
    const wins = evaluations.filter(e => e.winner === "circuit").length;
    const losses = evaluations.filter(e => e.winner === "control").length;
    const ties = evaluations.filter(e => e.winner === "tie").length;

    console.log(`\n    AGGREGATE: Control=${controlTotal.toFixed(1)} Circuit=${circuitTotal.toFixed(1)}`);
    console.log(`    Wins/Losses/Ties: ${wins}/${losses}/${ties}`);

    allResults.push({
      id: problem.id,
      question: problem.question,
      quantitative: {
        controlVocabSize: controlVocab.size,
        circuitVocabSize: circuitVocab.size,
        circuitFullVocabSize: circuitFullVocab.size,
        circuitOnlyWords: circuitOnly.size,
        controlOnlyWords: controlOnly.size,
        circuitOnlySample: [...circuitOnly].slice(0, 30),
        controlOnlySample: [...controlOnly].slice(0, 30),
        controlActionable,
        circuitActionable,
      },
      evaluations,
      avgScores,
      controlTotal,
      circuitTotal,
      winRecord: { circuit: wins, control: losses, tie: ties },
      controlOutputs,
      circuitOutputs,
    });
  }

  // ═══════════════════════════════════════════════════
  // GRAND SUMMARY
  // ═══════════════════════════════════════════════════
  console.log("\n\n" + "█".repeat(60));
  console.log("GRAND SUMMARY — EXPERIMENT K");
  console.log("█".repeat(60));

  let totalCircuitWins = 0;
  let totalControlWins = 0;
  let totalTies = 0;
  let totalCircuitScore = 0;
  let totalControlScore = 0;

  for (const r of allResults) {
    totalCircuitWins += r.winRecord.circuit;
    totalControlWins += r.winRecord.control;
    totalTies += r.winRecord.tie;
    totalCircuitScore += r.circuitTotal;
    totalControlScore += r.controlTotal;

    console.log(`\n  ${r.id}:`);
    console.log(`    Score: Control=${r.controlTotal.toFixed(1)} vs Circuit=${r.circuitTotal.toFixed(1)} ${r.circuitTotal > r.controlTotal ? "→ CIRCUIT WINS" : r.controlTotal > r.circuitTotal ? "→ CONTROL WINS" : "→ TIE"}`);
    console.log(`    Vocab: Control=${r.quantitative.controlVocabSize} Circuit=${r.quantitative.circuitVocabSize} (circuit-only: ${r.quantitative.circuitOnlyWords})`);
    console.log(`    Actionable: Control=${r.quantitative.controlActionable.toFixed(1)} Circuit=${r.quantitative.circuitActionable.toFixed(1)}`);
  }

  console.log(`\n  ═══════════════════════════════════════`);
  console.log(`  OVERALL BLIND EVALUATION:`);
  console.log(`    Circuit wins: ${totalCircuitWins}/${totalCircuitWins + totalControlWins + totalTies}`);
  console.log(`    Control wins: ${totalControlWins}/${totalCircuitWins + totalControlWins + totalTies}`);
  console.log(`    Ties: ${totalTies}/${totalCircuitWins + totalControlWins + totalTies}`);
  console.log(`    Avg score: Control=${(totalControlScore / allResults.length).toFixed(1)} Circuit=${(totalCircuitScore / allResults.length).toFixed(1)}`);

  const verdict = totalCircuitScore > totalControlScore * 1.1
    ? "✅ CIRCUIT IS MEASURABLY BETTER — Semantic computing has practical value"
    : totalControlScore > totalCircuitScore * 1.1
    ? "❌ CONTROL WINS — A single good prompt beats the circuit approach"
    : "⚠️  NO SIGNIFICANT DIFFERENCE — More investigation needed";

  console.log(`\n  VERDICT: ${verdict}`);
  console.log("█".repeat(60));

  writeFileSync(
    "experiments/results_k_practical.json",
    JSON.stringify(allResults, null, 2)
  );
  console.log("\nResults saved to experiments/results_k_practical.json");
}

main().catch(console.error);
