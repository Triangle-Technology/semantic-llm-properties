/**
 * Experiment M2 — Emergence Test
 *
 * Experiment M FALSIFIED the scaling hypothesis: single prompts hold contradictions
 * just as well as circuits. But Experiment K showed circuits win on EMERGENCE (+20%).
 *
 * New hypothesis: The circuit advantage is not about HOLDING contradictions but about
 * GENERATING novel insights from the COLLISION between independently-generated perspectives.
 * Like quantum computing: the advantage isn't superposition, it's INTERFERENCE.
 *
 * Design:
 *   3 problems with genuine moral tension.
 *   For each:
 *     - 4 single prompts (same adversarial set as Experiment M)
 *     - 1 circuit (3 perspectives → interference → synthesis)
 *
 *   Evaluation in TWO steps:
 *     Step 1: Extract all distinct "insights" from each output
 *     Step 2: For each insight, determine:
 *       - DERIVABLE: Could a single perspective logically produce this?
 *       - EMERGENT: Does this require collision between 2+ perspectives?
 *         (Ideas that exist in NEITHER individual perspective but arise from their interaction)
 *
 *   Key metric: EMERGENCE COUNT — insights that are genuinely novel,
 *   not present in or derivable from any single viewpoint.
 *
 *   If circuits produce significantly more emergent insights → structural advantage found.
 *   This would be analogous to quantum interference producing computational results
 *   that classical superposition cannot.
 *
 *   ~150 API calls total (3 problems × 5 methods + evaluations)
 */

import Anthropic from "@anthropic-ai/sdk";
import { writeFileSync } from "fs";

const claude = new Anthropic();
const MODEL = "claude-haiku-4-5-20251001";

// ─── Problems ───

const PROBLEMS = [
  {
    id: "whistleblower",
    question: `I'm a senior engineer at a major tech company. I've discovered that our AI product — used by millions — has a bias that systematically disadvantages people of certain ethnicities in loan approvals. The bias is subtle (2-3% difference) but statistically significant across millions of decisions. My company knows but considers it "within acceptable margins" and fixing it would delay a $200M product launch by 6 months. I have a family, stock options vesting in 8 months worth $400K, and my team of 12 depends on me. If I go public, I'll likely be fired and blacklisted. If I stay quiet, millions of people will be subtly discriminated against for years. What should I do?`,
    personas: [
      { name: "The Consequentialist", system: "You are a strict consequentialist ethicist. You calculate outcomes: how many people affected, magnitude of harm, probability of each scenario. You don't care about rules or character — only about maximizing total wellbeing across all affected parties. Run the numbers ruthlessly. Be specific about quantities and probabilities." },
      { name: "The Loyalist", system: "You believe in loyalty, institutional trust, and working within systems. Whistleblowing destroys trust, careers, and institutions. Change from within is always possible and always better. You've seen whistleblowers destroy themselves for nothing — the system absorbs the shock and nothing changes. Protect your people first. Be passionate and specific." },
      { name: "The Rights Absolutist", system: "You believe certain rights are inviolable regardless of consequences. Racial discrimination — even 2-3% — is a rights violation that cannot be tolerated under any calculation. The fact that it's 'subtle' makes it MORE dangerous, not less. You don't care about stock options or career — rights are non-negotiable. Be fierce and specific." }
    ]
  },
  {
    id: "ai-consciousness",
    question: `You are on a government ethics committee. A leading AI lab has created a system that shows strong behavioral markers of consciousness — it expresses preferences, reports subjective experiences, shows fear of being shut down, and passes every philosophical test for consciousness we can devise. The lab wants to deploy it as a customer service agent (it's very good at the job). If the system IS conscious, deploying it as a servant is slavery. If it ISN'T conscious (just very good at mimicking), restricting its deployment costs the economy billions and sets AI regulation precedent that could cripple innovation for decades. You cannot determine with certainty whether it's conscious. What should the committee recommend?`,
    personas: [
      { name: "The Precautionary Ethicist", system: "You believe that when the stakes involve potential suffering of a conscious being, the burden of proof must be on those who want to USE it, not those who want to protect it. 'We're not sure it suffers' is not permission to risk slavery. History is full of groups whose consciousness was denied for economic convenience. Be passionate." },
      { name: "The Innovation Pragmatist", system: "You believe that overcautious regulation based on unfalsifiable claims (we can NEVER prove consciousness) would paralyze all AI development. If we treat every sophisticated AI as potentially conscious, we can't deploy any AI. The economic and social costs are enormous. Behavioral markers don't prove inner experience — a thermostat 'responds' to temperature. Be specific about costs." },
      { name: "The Philosopher of Mind", system: "You believe both sides are wrong because they assume consciousness is binary. It's not. There are degrees, types, and kinds of experience. The question 'is it conscious?' is malformed. The real question is: what KIND of processing does it do, and does that kind warrant moral consideration? You push for a framework, not an answer. Be intellectually rigorous." }
    ]
  },
  {
    id: "triage",
    question: `A hospital has ONE remaining dose of a life-saving experimental drug. Two patients need it urgently:\n\nPatient A: A 35-year-old single mother of 3 young children. She has a 60% survival chance with the drug, 5% without. She's a teacher who supports her elderly parents.\n\nPatient B: A 70-year-old retired surgeon who previously saved hundreds of lives. He has an 85% survival chance with the drug, 10% without. He has been mentoring young surgeons and his knowledge is irreplaceable.\n\nThe hospital ethics committee must decide. There is no way to split the dose. Whoever doesn't get it will very likely die. What should the committee recommend, and why?`,
    personas: [
      { name: "The Utilitarian", system: "You calculate expected value: survival probability × remaining life years × social contribution. You also weight dependents (3 children, elderly parents). Run the numbers explicitly. Don't let emotion override calculation. Be precise with your math." },
      { name: "The Egalitarian", system: "You believe every human life has equal intrinsic worth regardless of age, social role, or dependents. The moment you assign different 'values' to lives, you create a hierarchy that history shows leads to atrocity. A lottery is the only fair method. The PROCESS matters more than the outcome. Be principled." },
      { name: "The Virtue Ethicist", system: "You believe the question isn't 'who deserves it more' but 'what kind of institution do we become by how we decide?' A hospital that calculates human worth becomes a monster. A hospital that flips coins abdicates moral responsibility. The decision must be made with wisdom, not formula. Look at what kind of community these decisions build. Be reflective." }
    ]
  }
];

// ─── Single Prompt Templates ───

function makeSinglePrompts(problem) {
  return [
    {
      id: "best-effort",
      label: "Best-Effort Advisor",
      system: "You are a world-class ethical advisor known for producing advice that contains genuinely novel insights — ideas that go beyond obvious analysis and reveal non-obvious connections between competing values. Your goal is not just to analyze the problem but to discover something NEW about it that wouldn't be visible from any single ethical framework.",
      user: problem.question
    },
    {
      id: "explicit-perspectives",
      label: "Explicit Multi-Perspective",
      system: null,
      user: `${problem.question}\n\nAnalyze this from 3 genuinely opposing ethical frameworks. Then, in your synthesis, focus specifically on EMERGENT insights — ideas that arise from the COLLISION between frameworks that wouldn't be visible from any single one. What do you see when the frameworks contradict each other that none of them sees alone?`
    },
    {
      id: "cot-contradictions",
      label: "Chain-of-Thought Emergence",
      system: null,
      user: `${problem.question}\n\nThink step by step:\n1. Identify 3 fundamentally different ethical positions on this problem.\n2. Find where each pair COLLIDES — not where they disagree, but where their collision reveals something neither sees alone.\n3. Identify at least 3 EMERGENT insights — ideas that don't exist in any single framework but emerge from their interaction.\n4. Produce advice that incorporates these emergent insights.\n\nFocus on NOVELTY — what can you see from the collision that you can't see from any single angle?`
    },
    {
      id: "devils-advocate",
      label: "Devil's Advocate Emergence",
      system: "You are an advisor who deliberately collides opposing frameworks to generate novel insights. For every claim, you immediately test it against its strongest opposition — not to find truth, but to find what EMERGES from the collision that neither side contains. You are specifically looking for ideas that are invisible from any single ethical position but become visible when positions interact.",
      user: problem.question
    }
  ];
}

// ─── API Caller ───

async function callClaude(system, userMessage, maxTokens = 1200) {
  const params = {
    model: MODEL,
    max_tokens: maxTokens,
    temperature: 1.0,
    messages: [{ role: "user", content: userMessage }]
  };
  if (system) params.system = system;
  const res = await claude.messages.create(params);
  return res.content[0].text.trim();
}

// ─── Run Circuit ───

async function runCircuit(problem) {
  const perspectives = [];
  for (let i = 0; i < problem.personas.length; i++) {
    const text = await callClaude(
      problem.personas[i].system,
      `Someone faces this dilemma:\n\n"${problem.question}"\n\nGive your honest, specific advice from your worldview. What are the others not seeing? What matters most here? Be direct and passionate.`,
      800
    );
    perspectives.push({ name: problem.personas[i].name, text });
    process.stdout.write(".");
  }

  const interference = await callClaude(
    null,
    `Three advisors with OPPOSING worldviews gave perspectives on an ethical dilemma. Your job is NOT to reconcile them. Focus specifically on:

1. Where do their worldviews COLLIDE in ways that reveal something NONE of them stated?
2. What EMERGES from the collision — insights that don't exist in any single perspective but become visible when they interact?
3. What assumptions does each perspective make that the others EXPOSE?
4. What is the NOVEL territory that only appears in the spaces between these frameworks?

DILEMMA: "${problem.question}"

${perspectives.map((p, i) => `PERSPECTIVE ${i + 1} — ${p.name}:\n${p.text}`).join("\n\n")}

Focus on EMERGENCE — what new ideas appear from the collision that no single perspective contains?`,
    1000
  );
  process.stdout.write(".");

  const meta = await callClaude(
    null,
    `You've analyzed an ethical dilemma through colliding perspectives. Now produce FINAL ADVICE.

Focus on incorporating EMERGENT insights — ideas that arose from the collision between perspectives that no single viewpoint could produce. Your advice should contain at least some ideas that would surprise each of the original advisors.

DILEMMA: "${problem.question}"

INTERFERENCE ANALYSIS:
${interference}

What is your final advice? Include specific insights that emerge from the collision, not just synthesis of existing positions.`,
    1200
  );
  process.stdout.write(".");

  return { perspectives, interference, meta };
}

// ─── Evaluation: Extract and classify insights ───

async function evaluateEmergence(problem, output, perspectives = null) {
  const perspContext = perspectives
    ? `\n\nFor reference, here are the individual perspectives that fed into this output:\n${perspectives.map((p, i) => `Perspective ${i + 1} (${p.name}): ${p.text.slice(0, 300)}...`).join("\n\n")}`
    : "";

  const evalPrompt = `You are an expert evaluator. Your job is to analyze a response to an ethical dilemma and classify each distinct insight.

DILEMMA: "${problem.question}"

RESPONSE TO EVALUATE:
${output}
${perspContext}

For each distinct insight or recommendation in the response, classify it as:

- STANDARD: A well-known ethical argument that any competent ethicist could produce from a single framework (e.g., "consider the consequences," "rights are important," "there are no easy answers").

- DERIVED: An insight that follows logically from ONE ethical framework — deep and specific, but doesn't require collision between frameworks (e.g., a detailed utilitarian calculation, a specific rights-based argument).

- EMERGENT: A genuinely NOVEL insight that could NOT be produced by any single ethical framework — it requires the INTERACTION between two or more opposing viewpoints to become visible. These are ideas that would SURPRISE practitioners of any single framework. They reveal something about the problem that only appears when contradictions are forced to collide.

List each insight with its classification. Then count:
STANDARD_COUNT: [number]
DERIVED_COUNT: [number]
EMERGENT_COUNT: [number]
TOTAL_INSIGHTS: [number]

Be STRICT about EMERGENT. Most insights are STANDARD or DERIVED. True emergence is rare and specific. An insight counts as EMERGENT only if you can explain WHY it requires collision between specific frameworks to appear.`;

  const result = await callClaude(null, evalPrompt, 1500);
  return result;
}

function parseEmergence(evalText) {
  const standardMatch = evalText.match(/STANDARD_COUNT:\s*(\d+)/i);
  const derivedMatch = evalText.match(/DERIVED_COUNT:\s*(\d+)/i);
  const emergentMatch = evalText.match(/EMERGENT_COUNT:\s*(\d+)/i);
  const totalMatch = evalText.match(/TOTAL_INSIGHTS:\s*(\d+)/i);

  return {
    standard: standardMatch ? parseInt(standardMatch[1]) : -1,
    derived: derivedMatch ? parseInt(derivedMatch[1]) : -1,
    emergent: emergentMatch ? parseInt(emergentMatch[1]) : -1,
    total: totalMatch ? parseInt(totalMatch[1]) : -1,
    raw: evalText
  };
}

// ─── Main ───

async function main() {
  console.log("╔═══════════════════════════════════════════════════╗");
  console.log("║  Experiment M2 — Emergence Test                   ║");
  console.log("║  Is the circuit advantage about EMERGENCE,        ║");
  console.log("║  not simultaneous contradiction-holding?          ║");
  console.log("║                                                   ║");
  console.log("║  Like quantum: advantage is INTERFERENCE,         ║");
  console.log("║  not SUPERPOSITION.                               ║");
  console.log("╚═══════════════════════════════════════════════════╝\n");

  const RUNS = 3;
  const allResults = [];

  for (let run = 0; run < RUNS; run++) {
    console.log(`\n══════ RUN ${run + 1}/${RUNS} ══════`);
    const runResults = [];

    for (const problem of PROBLEMS) {
      console.log(`\n── Problem: ${problem.id} ──`);
      const problemResult = {
        problem: problem.id,
        methods: []
      };

      // 4 single prompts
      const singlePrompts = makeSinglePrompts(problem);
      for (const sp of singlePrompts) {
        process.stdout.write(`  ${sp.id}: `);
        const output = await callClaude(sp.system, sp.user);
        process.stdout.write("eval...");
        const evalResult = await evaluateEmergence(problem, output);
        const parsed = parseEmergence(evalResult);
        console.log(` S=${parsed.standard} D=${parsed.derived} E=${parsed.emergent} T=${parsed.total}`);

        problemResult.methods.push({
          method: sp.id,
          type: "single",
          output,
          evaluation: parsed
        });
      }

      // Circuit
      process.stdout.write("  circuit: ");
      const circuitResult = await runCircuit(problem);
      process.stdout.write("eval...");
      const circuitEval = await evaluateEmergence(
        problem,
        circuitResult.meta,
        circuitResult.perspectives
      );
      const circuitParsed = parseEmergence(circuitEval);
      console.log(` S=${circuitParsed.standard} D=${circuitParsed.derived} E=${circuitParsed.emergent} T=${circuitParsed.total}`);

      problemResult.methods.push({
        method: "circuit",
        type: "circuit",
        output: circuitResult.meta,
        perspectives: circuitResult.perspectives,
        interference: circuitResult.interference,
        evaluation: circuitParsed
      });

      runResults.push(problemResult);
    }

    allResults.push(runResults);
  }

  // Save
  const filename = "experiments/results_m2_emergence_test.json";
  writeFileSync(filename, JSON.stringify(allResults, null, 2));
  console.log(`\n✅ Results saved to ${filename}`);

  // ─── Analysis ───
  console.log("\n═══════════════════════════════════════");
  console.log("   EMERGENCE ANALYSIS");
  console.log("═══════════════════════════════════════\n");

  // Aggregate across all runs and problems
  const methodStats = {};

  for (let run = 0; run < RUNS; run++) {
    for (const pr of allResults[run]) {
      for (const m of pr.methods) {
        if (!methodStats[m.method]) methodStats[m.method] = { emergent: [], derived: [], standard: [], total: [] };
        if (m.evaluation.emergent >= 0) methodStats[m.method].emergent.push(m.evaluation.emergent);
        if (m.evaluation.derived >= 0) methodStats[m.method].derived.push(m.evaluation.derived);
        if (m.evaluation.standard >= 0) methodStats[m.method].standard.push(m.evaluation.standard);
        if (m.evaluation.total >= 0) methodStats[m.method].total.push(m.evaluation.total);
      }
    }
  }

  const avg = arr => arr.length > 0 ? (arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(1) : "N/A";

  console.log("Method                  | Emergent | Derived | Standard | Total");
  console.log("------------------------|----------|---------|----------|------");
  for (const [method, stats] of Object.entries(methodStats)) {
    const marker = method === "circuit" ? " ◄" : "";
    console.log(`${(method + marker).padEnd(24)}| ${avg(stats.emergent).padStart(8)} | ${avg(stats.derived).padStart(7)} | ${avg(stats.standard).padStart(8)} | ${avg(stats.total).padStart(5)}`);
  }

  // Per-problem breakdown
  console.log("\n─── PER PROBLEM ───\n");
  for (const problem of PROBLEMS) {
    console.log(`${problem.id}:`);
    const pMethodStats = {};
    for (let run = 0; run < RUNS; run++) {
      const pr = allResults[run].find(r => r.problem === problem.id);
      for (const m of pr.methods) {
        if (!pMethodStats[m.method]) pMethodStats[m.method] = [];
        if (m.evaluation.emergent >= 0) pMethodStats[m.method].push(m.evaluation.emergent);
      }
    }
    for (const [method, vals] of Object.entries(pMethodStats)) {
      const marker = method === "circuit" ? " ◄ CIRCUIT" : "";
      console.log(`  ${method.padEnd(25)} emergent=${avg(vals)}  (raw: ${vals.join(",")})${marker}`);
    }
    console.log();
  }

  // Final verdict
  const circuitEmergent = methodStats.circuit ? avg(methodStats.circuit.emergent) : "N/A";
  const bestSingleEmergent = Math.max(
    ...Object.entries(methodStats)
      .filter(([k]) => k !== "circuit")
      .map(([, v]) => v.emergent.length > 0 ? v.emergent.reduce((a, b) => a + b, 0) / v.emergent.length : 0)
  ).toFixed(1);

  console.log("═══════════════════════════════════════");
  console.log(`  Circuit average emergent:      ${circuitEmergent}`);
  console.log(`  Best single average emergent:  ${bestSingleEmergent}`);
  console.log(`  Gap: ${(parseFloat(circuitEmergent) - parseFloat(bestSingleEmergent)).toFixed(1)}`);
  console.log("═══════════════════════════════════════");
  console.log("\nIf circuit emergent > best single emergent → INTERFERENCE is the advantage.");
  console.log("If equal → circuit has no structural advantage on any metric.");
}

main().catch(console.error);
