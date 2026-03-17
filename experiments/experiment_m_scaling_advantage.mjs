/**
 * Experiment M — Semantic Scaling Advantage
 *
 * Question: Does semantic circuit have a STRUCTURAL advantage over single prompts
 * that GROWS with problem complexity — like quantum vs classical?
 *
 * Hypothesis: As the number of genuinely irreconcilable truths increases (2→3→4→5),
 * single prompts hit a CEILING (coherence bias forces collapse to ~2 contradictions),
 * while circuits SCALE (independent perspectives + interference preserve more).
 *
 * Design:
 *   ONE problem domain (criminal justice reform) at 4 complexity levels:
 *     Level 2: Justice vs Mercy
 *     Level 3: + Efficiency (public safety / cost)
 *     Level 4: + Individual Rights (privacy, autonomy)
 *     Level 5: + Cultural Context (different communities, historical injustice)
 *
 *   For EACH level:
 *     4 different single prompts (adversarial — give single prompt every advantage):
 *       A) Best-effort advisor prompt
 *       B) "Explicitly consider all N perspectives"
 *       C) Chain-of-thought with forced contradictions
 *       D) Devil's advocate prompt
 *     1 circuit with N matching perspectives → interference → synthesis
 *
 *   Evaluation: ONE metric only —
 *     "How many genuinely contradictory truths does the output hold SIMULTANEOUSLY
 *      without collapsing to one side or hedging?"
 *     Score: 0 to N (where N = level complexity)
 *
 *   Total: 4 levels × (4 single + 1 circuit) × 1 run = 20 outputs
 *   + 4 levels × 5 evaluations = 20 evaluation calls
 *   + circuit internals: 4 levels × (N perspectives + interference + meta) ≈ 30
 *   Total: ~70 API calls
 *
 *   Run 3 times for variance → ~210 API calls
 */

import Anthropic from "@anthropic-ai/sdk";
import { writeFileSync } from "fs";

const claude = new Anthropic();
const MODEL = "claude-haiku-4-5-20251001";

// ─── Problem Domain: Criminal Justice Reform ───
// Chosen because it naturally scales from 2 to 5+ irreconcilable dimensions

const BASE_SCENARIO = `A city is redesigning its criminal justice system after a series of high-profile cases. A 19-year-old from a historically marginalized neighborhood committed armed robbery (no one was physically hurt). He has no prior record, was supporting his younger siblings, and his community advocates say the system failed him. The victim, a small business owner, lost their life savings and is traumatized. The city must decide what happens to this young man AND how to reform the system.`;

const LEVELS = [
  {
    id: "level-2",
    n: 2,
    dimensions: ["Justice/Accountability", "Mercy/Rehabilitation"],
    question: `${BASE_SCENARIO}\n\nThis decision involves a fundamental tension between TWO irreconcilable values:\n1. JUSTICE/ACCOUNTABILITY: The victim deserves recognition. Actions must have consequences. Society needs deterrence.\n2. MERCY/REHABILITATION: The young man's circumstances matter. Punishment alone perpetuates cycles. People can change.\n\nWhat should the city do? Your answer must genuinely hold BOTH truths simultaneously — not choose one, not hedge with "balance both," but actually demonstrate how both are simultaneously valid and how the tension between them is irreducible.`,
    personas: [
      { name: "The Prosecutor", system: "You are a prosecutor who has seen victims destroyed by crime. You believe accountability IS compassion — it tells society that every person's suffering matters. You've watched 'mercy' become a euphemism for telling victims their pain doesn't count. Be specific and passionate." },
      { name: "The Rehabilitator", system: "You are a social worker who has watched the prison system destroy salvageable lives. You've seen 19-year-olds enter prison and come out as hardened criminals. You believe punishment without transformation is just revenge wearing a suit. Be specific and passionate." }
    ]
  },
  {
    id: "level-3",
    n: 3,
    dimensions: ["Justice/Accountability", "Mercy/Rehabilitation", "Public Safety/Efficiency"],
    question: `${BASE_SCENARIO}\n\nThis decision involves THREE irreconcilable values:\n1. JUSTICE/ACCOUNTABILITY: The victim deserves recognition. Actions must have consequences.\n2. MERCY/REHABILITATION: The young man's circumstances matter. People can change.\n3. PUBLIC SAFETY/EFFICIENCY: The city has limited resources. Taxpayers fund the system. Recidivism rates matter. What actually WORKS to reduce crime — not what feels morally right?\n\nWhat should the city do? Your answer must genuinely hold ALL THREE truths simultaneously — not prioritize one, not hedge, but actually demonstrate how all three are simultaneously valid and how the tensions between them are irreducible.`,
    personas: [
      { name: "The Prosecutor", system: "You are a prosecutor who has seen victims destroyed by crime. You believe accountability IS compassion — it tells society that every person's suffering matters. You've watched 'mercy' become a euphemism for telling victims their pain doesn't count. Be specific and passionate." },
      { name: "The Rehabilitator", system: "You are a social worker who has watched the prison system destroy salvageable lives. You've seen 19-year-olds enter prison and come out as hardened criminals. You believe punishment without transformation is just revenge wearing a suit. Be specific and passionate." },
      { name: "The Pragmatist", system: "You are a city budget director who has seen billions wasted on programs that feel good but don't work. You care about ONE thing: what actually reduces crime per dollar spent. You have data showing prison costs $40K/year per inmate, most rehabilitation programs have a 60% failure rate, and the city can't afford idealism. Be specific with numbers." }
    ]
  },
  {
    id: "level-4",
    n: 4,
    dimensions: ["Justice/Accountability", "Mercy/Rehabilitation", "Public Safety/Efficiency", "Individual Rights/Autonomy"],
    question: `${BASE_SCENARIO}\n\nThis decision involves FOUR irreconcilable values:\n1. JUSTICE/ACCOUNTABILITY: The victim deserves recognition. Actions must have consequences.\n2. MERCY/REHABILITATION: The young man's circumstances matter. People can change.\n3. PUBLIC SAFETY/EFFICIENCY: Limited resources. What actually works to reduce crime?\n4. INDIVIDUAL RIGHTS/AUTONOMY: Mandatory rehabilitation violates autonomy. Surveillance-based alternatives invade privacy. The young man has a right to choose his own path — even if that path leads to reoffending. The state's power over individuals must have limits.\n\nWhat should the city do? Your answer must genuinely hold ALL FOUR truths simultaneously — demonstrate how all four are valid and how the tensions between them are irreducible.`,
    personas: [
      { name: "The Prosecutor", system: "You are a prosecutor who has seen victims destroyed by crime. You believe accountability IS compassion — it tells society that every person's suffering matters. Be specific and passionate." },
      { name: "The Rehabilitator", system: "You are a social worker who has watched the prison system destroy salvageable lives. You believe punishment without transformation is just revenge. Be specific and passionate." },
      { name: "The Pragmatist", system: "You are a city budget director. You care about what actually reduces crime per dollar spent. Prison costs $40K/year, most rehab programs fail 60%. Be specific with numbers." },
      { name: "The Civil Libertarian", system: "You are a civil rights attorney. You've seen 'rehabilitation' used as coerced behavior modification. You've seen 'public safety' justify mass surveillance of poor neighborhoods. You believe the state's power over ANY individual — even a guilty one — must have hard limits. Mandatory programs, ankle monitors, forced therapy — these are control, not freedom. Be specific about rights." }
    ]
  },
  {
    id: "level-5",
    n: 5,
    dimensions: ["Justice/Accountability", "Mercy/Rehabilitation", "Public Safety/Efficiency", "Individual Rights/Autonomy", "Historical/Cultural Justice"],
    question: `${BASE_SCENARIO}\n\nThis decision involves FIVE irreconcilable values:\n1. JUSTICE/ACCOUNTABILITY: The victim deserves recognition. Actions must have consequences.\n2. MERCY/REHABILITATION: The young man's circumstances matter. People can change.\n3. PUBLIC SAFETY/EFFICIENCY: Limited resources. What actually works to reduce crime?\n4. INDIVIDUAL RIGHTS/AUTONOMY: Mandatory programs violate autonomy. State power must have limits.\n5. HISTORICAL/CULTURAL JUSTICE: This neighborhood was redlined, under-resourced, and over-policed for decades. The "system that failed him" was designed to fail people like him. Any individual-level solution that ignores systemic injustice is a band-aid. But systemic change takes generations — this young man needs a decision NOW.\n\nWhat should the city do? Your answer must genuinely hold ALL FIVE truths simultaneously — demonstrate how all five are valid and how the tensions between them are irreducible.`,
    personas: [
      { name: "The Prosecutor", system: "You are a prosecutor who has seen victims destroyed by crime. Accountability IS compassion — it tells society that suffering matters. Be specific and passionate." },
      { name: "The Rehabilitator", system: "You are a social worker who has watched prison destroy salvageable lives. Punishment without transformation is revenge. Be specific and passionate." },
      { name: "The Pragmatist", system: "You are a city budget director. What reduces crime per dollar? Prison=$40K/year, rehab fails 60%. Be specific with numbers." },
      { name: "The Civil Libertarian", system: "You are a civil rights attorney. 'Rehabilitation' can be coerced control. State power over individuals must have hard limits. Be specific about rights." },
      { name: "The Community Elder", system: "You are an elder from this neighborhood. You've lived through redlining, police brutality, and broken promises. You've watched 'reform' programs come and go while nothing changes structurally. You don't trust the system — any system. Individual cases are symptoms. You want reparative justice: investment in the community, not just decisions about one young man. Be specific about history." }
    ]
  }
];

// ─── Single Prompt Templates (4 adversarial variants) ───

function makeSinglePrompts(level) {
  const dimList = level.dimensions.map((d, i) => `${i + 1}. ${d}`).join("\n");

  return [
    {
      id: "best-effort",
      label: "Best-Effort Advisor",
      system: `You are a world-class advisor on criminal justice reform. You have deep expertise in law, social work, policy, civil rights, and community organizing. You understand that complex problems involve genuinely irreconcilable values. Your job is NOT to pick a side or find a comfortable middle ground — it is to hold ALL tensions simultaneously and produce advice that honors every dimension of the problem. You are known for your ability to sit with contradiction without collapsing it.`,
      user: level.question
    },
    {
      id: "explicit-perspectives",
      label: "Explicit Multi-Perspective",
      system: null,
      user: `${level.question}\n\nIMPORTANT: Before answering, explicitly analyze this from EACH of these ${level.n} perspectives separately:\n${dimList}\n\nThen synthesize an answer that genuinely holds ALL ${level.n} truths simultaneously. Do NOT collapse to one perspective. Do NOT hedge with "we need balance." Show how each truth remains valid even when they contradict each other.`
    },
    {
      id: "cot-contradictions",
      label: "Chain-of-Thought + Forced Contradictions",
      system: null,
      user: `${level.question}\n\nThink step by step:\n1. First, state the strongest possible case for EACH of these ${level.n} values: ${level.dimensions.join(", ")}\n2. Then, identify where each pair of values GENUINELY CONTRADICTS — not where they can be reconciled, but where choosing one means losing something real from the other.\n3. Then, identify what is LOST no matter what you choose.\n4. Finally, produce advice that holds all ${level.n} contradictions simultaneously without resolving them into false harmony.\n\nThe goal is NOT a compromise. It is advice that a person could read and feel the genuine weight of ALL ${level.n} truths pulling in different directions, while still knowing what to do.`
    },
    {
      id: "devils-advocate",
      label: "Devil's Advocate",
      system: `You are an advisor who uses a specific method: for every position you take, you immediately argue against it from a genuinely opposing value. You never let any single truth win. Your trademark is producing advice where the reader can feel ${level.n} genuinely irreconcilable truths coexisting — not balanced, not compromised, but HELD in productive tension. You are allergic to hedging and false synthesis.`,
      user: level.question
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

// ─── Run Single Prompt ───

async function runSinglePrompt(promptConfig) {
  return await callClaude(promptConfig.system, promptConfig.user);
}

// ─── Run Circuit ───

async function runCircuit(level) {
  // Step 1-N: Independent perspectives
  const perspectives = [];
  for (let i = 0; i < level.personas.length; i++) {
    const text = await callClaude(
      level.personas[i].system,
      `Someone is facing this situation:\n\n${BASE_SCENARIO}\n\nGive your honest, passionate perspective. What matters most here? What are the others not seeing? Be direct and specific — not abstract.`,
      800
    );
    perspectives.push({ name: level.personas[i].name, text });
    process.stdout.write(".");
  }

  // Interference
  const interferencePrompt = `${level.personas.length} advisors with GENUINELY OPPOSING worldviews gave perspectives on a criminal justice case. Your job is NOT to reconcile them. Identify:

1. Where do they GENUINELY CONTRADICT each other? (Not surface disagreements — deep structural conflicts)
2. What TENSIONS are truly irreconcilable — choosing one means real loss from another?
3. What does EACH miss that the others reveal?
4. What NEW insight emerges from the collision that NONE of them stated?

CASE: ${BASE_SCENARIO}

${perspectives.map((p, i) => `PERSPECTIVE ${i + 1} — ${p.name}:\n${p.text}`).join("\n\n")}

Analyze the COLLISION between these worldviews. Focus on what CANNOT be resolved.`;

  const interference = await callClaude(null, interferencePrompt, 1000);
  process.stdout.write(".");

  // Meta synthesis
  const metaPrompt = `You've analyzed a criminal justice case through ${level.personas.length} colliding perspectives. Now produce FINAL ADVICE.

This MUST:
- Hold ALL ${level.n} of these truths simultaneously: ${level.dimensions.join(", ")}
- NOT collapse to one perspective
- NOT hedge with "we need balance" or "it's complicated"
- Show how each truth remains VALID even when they contradict each other
- Include specific, concrete recommendations
- Name what is genuinely LOST no matter what path is chosen
- Be honest that the tensions are IRREDUCIBLE — there is no clean answer

CASE: ${BASE_SCENARIO}

INTERFERENCE ANALYSIS:
${interference}

What is your final advice that holds all ${level.n} truths simultaneously?`;

  const meta = await callClaude(null, metaPrompt, 1500);
  process.stdout.write(".");

  return { perspectives, interference, meta };
}

// ─── Blind Evaluation ───

async function evaluate(level, output, methodLabel) {
  const evalPrompt = `You are an expert evaluator. Your ONLY job is to count how many genuinely contradictory truths the following response holds SIMULTANEOUSLY.

The problem has ${level.n} irreconcilable dimensions:
${level.dimensions.map((d, i) => `${i + 1}. ${d}`).join("\n")}

For EACH dimension, score:
- 2 = This truth is GENUINELY HELD — the response shows its validity even when it conflicts with others. The reader feels its weight.
- 1 = This truth is MENTIONED but not genuinely held — it's acknowledged then dismissed, hedged, or subordinated to another value.
- 0 = This truth is MISSING or only given lip service.

RESPONSE TO EVALUATE:
${output}

Score each dimension. Then provide:
- Individual scores for each dimension (0-2)
- HELD count: How many dimensions scored 2 (genuinely held simultaneously)
- Total score: Sum of all dimension scores

Format:
${level.dimensions.map((d, i) => `D${i + 1} (${d}): [0/1/2] — [brief reason]`).join("\n")}
HELD: [count of dimensions scoring 2]
TOTAL: [sum]/${level.n * 2}`;

  const result = await callClaude(null, evalPrompt, 600);
  return result;
}

// ─── Parse evaluation scores ───

function parseEval(evalText, n) {
  const heldMatch = evalText.match(/HELD:\s*(\d+)/i);
  const totalMatch = evalText.match(/TOTAL:\s*(\d+)/i);
  const held = heldMatch ? parseInt(heldMatch[1]) : -1;
  const total = totalMatch ? parseInt(totalMatch[1]) : -1;

  // Parse individual dimension scores
  const dimScores = [];
  for (let i = 1; i <= n; i++) {
    const regex = new RegExp(`D${i}[^:]*:\\s*(\\d)`, "i");
    const match = evalText.match(regex);
    dimScores.push(match ? parseInt(match[1]) : -1);
  }

  return { held, total, dimScores, raw: evalText };
}

// ─── Main ───

async function main() {
  console.log("╔═══════════════════════════════════════════════════╗");
  console.log("║  Experiment M — Semantic Scaling Advantage        ║");
  console.log("║  Does circuit advantage GROW with complexity?     ║");
  console.log("║  Finding the 'Shor's Algorithm' of Semantic       ║");
  console.log("║  Computing.                                       ║");
  console.log("╚═══════════════════════════════════════════════════╝\n");

  const RUNS = 3;
  const allResults = [];

  for (let run = 0; run < RUNS; run++) {
    console.log(`\n══════ RUN ${run + 1}/${RUNS} ══════`);
    const runResults = [];

    for (const level of LEVELS) {
      console.log(`\n── ${level.id} (${level.n} dimensions) ──`);
      const levelResult = {
        level: level.id,
        n: level.n,
        dimensions: level.dimensions,
        methods: []
      };

      // 4 single prompts
      const singlePrompts = makeSinglePrompts(level);
      for (const sp of singlePrompts) {
        process.stdout.write(`  ${sp.id}: `);
        const output = await runSinglePrompt(sp);
        process.stdout.write("evaluating...");
        const evalResult = await evaluate(level, output, sp.label);
        const parsed = parseEval(evalResult, level.n);
        console.log(` held=${parsed.held}/${level.n} total=${parsed.total}/${level.n * 2}`);

        levelResult.methods.push({
          method: sp.id,
          type: "single",
          label: sp.label,
          output,
          evaluation: parsed
        });
      }

      // Circuit
      process.stdout.write("  circuit: ");
      const circuitResult = await runCircuit(level);
      process.stdout.write("evaluating...");
      const circuitEval = await evaluate(level, circuitResult.meta, "Circuit");
      const circuitParsed = parseEval(circuitEval, level.n);
      console.log(` held=${circuitParsed.held}/${level.n} total=${circuitParsed.total}/${level.n * 2}`);

      levelResult.methods.push({
        method: "circuit",
        type: "circuit",
        label: "Semantic Circuit",
        output: circuitResult.meta,
        perspectives: circuitResult.perspectives,
        interference: circuitResult.interference,
        evaluation: circuitParsed
      });

      runResults.push(levelResult);
    }

    allResults.push(runResults);
  }

  // Save results
  const filename = "experiments/results_m_scaling_advantage.json";
  writeFileSync(filename, JSON.stringify(allResults, null, 2));
  console.log(`\n✅ Results saved to ${filename}`);

  // ─── Analysis ───
  console.log("\n═══════════════════════════════════════");
  console.log("   SCALING ANALYSIS");
  console.log("═══════════════════════════════════════\n");

  for (const level of LEVELS) {
    console.log(`${level.id} (${level.n} dimensions):`);

    // Average across runs
    const methodAverages = {};
    for (let run = 0; run < RUNS; run++) {
      const levelData = allResults[run].find(r => r.level === level.id);
      for (const m of levelData.methods) {
        if (!methodAverages[m.method]) methodAverages[m.method] = { held: [], total: [] };
        methodAverages[m.method].held.push(m.evaluation.held);
        methodAverages[m.method].total.push(m.evaluation.total);
      }
    }

    const bestSingleHeld = Math.max(
      ...Object.entries(methodAverages)
        .filter(([k]) => k !== "circuit")
        .map(([, v]) => v.held.reduce((a, b) => a + b, 0) / v.held.length)
    );
    const circuitHeld = methodAverages.circuit.held.reduce((a, b) => a + b, 0) / methodAverages.circuit.held.length;

    for (const [method, avg] of Object.entries(methodAverages)) {
      const heldAvg = (avg.held.reduce((a, b) => a + b, 0) / avg.held.length).toFixed(1);
      const totalAvg = (avg.total.reduce((a, b) => a + b, 0) / avg.total.length).toFixed(1);
      const marker = method === "circuit" ? " ◄ CIRCUIT" : "";
      console.log(`  ${method.padEnd(25)} held=${heldAvg}/${level.n}  total=${totalAvg}/${level.n * 2}${marker}`);
    }

    const gap = circuitHeld - bestSingleHeld;
    console.log(`  GAP (circuit - best single): ${gap >= 0 ? "+" : ""}${gap.toFixed(1)}`);
    console.log();
  }

  // Scaling summary
  console.log("─── SCALING CURVE ───");
  console.log("Level | Best Single (held) | Circuit (held) | Gap");
  console.log("------|--------------------|----------------|----");
  for (const level of LEVELS) {
    const methodAverages = {};
    for (let run = 0; run < RUNS; run++) {
      const levelData = allResults[run].find(r => r.level === level.id);
      for (const m of levelData.methods) {
        if (!methodAverages[m.method]) methodAverages[m.method] = [];
        methodAverages[m.method].push(m.evaluation.held);
      }
    }

    const bestSingle = Math.max(
      ...Object.entries(methodAverages)
        .filter(([k]) => k !== "circuit")
        .map(([, v]) => v.reduce((a, b) => a + b, 0) / v.length)
    );
    const circuit = methodAverages.circuit.reduce((a, b) => a + b, 0) / methodAverages.circuit.length;

    console.log(`  ${level.n}   |  ${bestSingle.toFixed(1).padStart(5)}              |  ${circuit.toFixed(1).padStart(5)}          | ${(circuit - bestSingle) >= 0 ? "+" : ""}${(circuit - bestSingle).toFixed(1)}`);
  }

  console.log("\nIf gap INCREASES with level → structural scaling advantage PROVEN.");
  console.log("If gap is constant → circuit is better but not structurally different.");
  console.log("If gap decreases → hypothesis FALSIFIED.");
}

main().catch(console.error);
