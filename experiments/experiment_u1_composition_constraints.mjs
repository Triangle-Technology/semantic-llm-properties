/**
 * Experiment U1 — Composition Proof: Multi-Constraint Satisfaction
 *
 * THE KEY TEST: Can composed semantic primitives satisfy MORE constraints
 * simultaneously than single prompts?
 *
 * Design:
 *   6 problems, each with 6 clearly stated constraints
 *   8 conditions:
 *     1. BASELINE:     Direct question
 *     2. SINGLE:       SUPERPOSE only (3 expert frames)
 *     3. PAIR:         SUPERPOSE → INTERFERE
 *     4. TRIPLE:       SUPERPOSE → INTERFERE → REFRAME
 *     5. FULL:         SUPERPOSE → INTERFERE → REFRAME → SYNTHESIZE → VALIDATE
 *     6. SCRAMBLED:    Same 5 ops, wrong order
 *     7. LONG_PROMPT:  Single prompt, same context length as FULL
 *     8. LIST_PROMPT:  "Consider perspectives A, B, C, then synthesize"
 *
 *   Scoring: Each constraint checked binary (satisfied/not). Score 0-6.
 *   Evaluated by SEPARATE model (Claude Opus or Sonnet) with structured rubric.
 *
 *   N = 10 per condition
 *
 *   Models: Claude Sonnet, GPT-4o, Gemini 2.5 Flash
 */

import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { writeFileSync, readFileSync } from "fs";
import { config } from "dotenv";

config({ override: true }); // Load .env, override existing env vars

// ═══════════════════════════════════════════════════════
// CLIENTS
// ═══════════════════════════════════════════════════════

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const MODELS = {
  claude: "claude-sonnet-4-20250514",
  gpt: "gpt-4o-mini",
  gemini: "gemini-2.5-flash",
};

const JUDGE_MODEL = "claude-sonnet-4-20250514"; // Separate from generators
const N_RUNS = 10;
const MAX_TOKENS = 1500;

// ═══════════════════════════════════════════════════════
// MULTI-MODEL CALLER
// ═══════════════════════════════════════════════════════

async function callModel(provider, system, userMessage, maxTokens = MAX_TOKENS) {
  if (provider === "claude") {
    const params = {
      model: MODELS.claude,
      max_tokens: maxTokens,
      temperature: 1.0,
      messages: [{ role: "user", content: userMessage }],
    };
    if (system) params.system = system;
    const res = await anthropic.messages.create(params);
    return res.content[0].text.trim();
  }

  if (provider === "gpt") {
    const messages = [];
    if (system) messages.push({ role: "system", content: system });
    messages.push({ role: "user", content: userMessage });
    const res = await openai.chat.completions.create({
      model: MODELS.gpt,
      max_tokens: maxTokens,
      temperature: 1.0,
      messages,
    });
    return res.choices[0].message.content.trim();
  }

  if (provider === "gemini") {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODELS.gemini}:generateContent?key=${process.env.GEMINI_API_KEY}`;
    const body = {
      contents: [{ parts: [{ text: system ? `${system}\n\n${userMessage}` : userMessage }] }],
      generationConfig: { maxOutputTokens: maxTokens, temperature: 1.0 },
    };
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
      throw new Error("Gemini error: " + JSON.stringify(data).substring(0, 300));
    }
    return data.candidates[0].content.parts[0].text.trim();
  }

  throw new Error(`Unknown provider: ${provider}`);
}

async function judge(userMessage) {
  const res = await anthropic.messages.create({
    model: JUDGE_MODEL,
    max_tokens: 1000,
    temperature: 0,
    messages: [{ role: "user", content: userMessage }],
  });
  return res.content[0].text.trim();
}

// ═══════════════════════════════════════════════════════
// PROBLEMS — 6 constraints each, diverse domains
// ═══════════════════════════════════════════════════════

const PROBLEMS = [
  {
    id: "public_space",
    question:
      "Design a public space for a mid-sized city neighborhood. Your design MUST satisfy ALL of the following constraints simultaneously. Describe a SPECIFIC, concrete design.",
    constraints: [
      { id: "child_safety", text: "Safe for unsupervised children under 5 (no sharp edges, toxic plants, deep water, or uncontrolled vehicle access)" },
      { id: "teen_appeal", text: "Appealing enough that teenagers voluntarily spend time there (not just 'a playground')" },
      { id: "elderly_fitness", text: "Includes features that support elderly exercise and mobility (not just benches)" },
      { id: "revenue", text: "Generates at least some revenue for city maintenance (not purely cost center)" },
      { id: "ecology", text: "Provides measurable ecological benefit (biodiversity, water management, or carbon sequestration)" },
      { id: "budget", text: "Buildable with a budget under $500,000 including 3 years of maintenance" },
    ],
    frames: [
      "a child development specialist who designs play environments for children with different abilities",
      "an urban sociologist who studies why teenagers avoid or embrace public spaces",
      "a landscape architect specializing in therapeutic gardens for aging populations",
    ],
    reframe_lens: "a permaculture designer who knows that every element in a system should serve at least 3 functions",
  },
  {
    id: "school_schedule",
    question:
      "Redesign the daily schedule for a public high school (grades 9-12, 800 students). Your schedule MUST satisfy ALL of the following constraints simultaneously. Be SPECIFIC about times, durations, and activities.",
    constraints: [
      { id: "sleep_science", text: "Aligned with adolescent sleep science (teens need 8-10 hours; circadian rhythm shifts later)" },
      { id: "working_parents", text: "Compatible with typical working parent schedules (drop-off and pickup feasible for 9-5 workers)" },
      { id: "teacher_contract", text: "Teachers work no more than 8 consecutive hours including prep time" },
      { id: "sports", text: "Allows meaningful time for sports/physical activity for ALL students (not just athletes)" },
      { id: "deep_learning", text: "Includes at least two 90+ minute blocks per day for deep learning (research shows short periods are ineffective for complex subjects)" },
      { id: "cost_neutral", text: "Implementable with existing staff and facilities (no additional budget)" },
    ],
    frames: [
      "a sleep researcher who has published on adolescent circadian rhythms",
      "a working single parent with two teenagers who can't afford after-school care",
      "a veteran teacher who has seen 5 schedule reform attempts fail",
    ],
    reframe_lens: "a factory efficiency consultant who sees that the current school schedule was literally designed for industrial-age factory shifts, not learning",
  },
  {
    id: "remote_team",
    question:
      "Design a communication system for a 30-person remote team across 4 time zones (US Pacific, US Eastern, London, Tokyo). Your system MUST satisfy ALL constraints simultaneously. Be SPECIFIC about tools, rhythms, and rules.",
    constraints: [
      { id: "no_meeting_overload", text: "No person attends more than 4 hours of synchronous meetings per week" },
      { id: "timezone_equity", text: "No timezone consistently bears the burden of inconvenient meeting times" },
      { id: "fast_decisions", text: "Urgent decisions (blocking someone's work) resolved within 4 hours during any timezone's work day" },
      { id: "culture", text: "Maintains team cohesion and social bonds (not purely transactional)" },
      { id: "deep_work", text: "Guarantees at least 4 consecutive hours of uninterrupted deep work daily for each person" },
      { id: "transparency", text: "All decisions and their rationale accessible to anyone within 24 hours (no information silos)" },
    ],
    frames: [
      "a distributed systems engineer who sees communication as a consistency problem",
      "a cultural anthropologist who studies how trust forms in remote communities",
      "a Tokyo-based developer who has been the 'sacrifice timezone' for years and is burned out",
    ],
    reframe_lens: "a jazz band leader who knows that great improvisation requires both structure AND freedom — the key is knowing when to lead and when to listen",
  },
  {
    id: "food_system",
    question:
      "Design a neighborhood food system for a low-income urban area (5,000 residents, food desert, nearest grocery store 3 miles away). Your system MUST satisfy ALL constraints simultaneously. Be SPECIFIC.",
    constraints: [
      { id: "fresh_access", text: "Every resident can access fresh produce within 10-minute walk" },
      { id: "affordable", text: "Food costs no more than SNAP benefit levels ($234/month per person)" },
      { id: "culturally_relevant", text: "Reflects the actual cuisines of the community (not just 'healthy food' — residents are 40% Latino, 35% Black, 25% Southeast Asian)" },
      { id: "jobs", text: "Creates at least 10 living-wage local jobs" },
      { id: "sustainable", text: "Financially self-sustaining within 3 years (not dependent on ongoing grants)" },
      { id: "resilient", text: "Can maintain food access during supply chain disruptions (pandemic, natural disaster)" },
    ],
    frames: [
      "a community organizer from the neighborhood who knows what previous food programs failed and why",
      "a social enterprise founder who has built profitable businesses in food deserts",
      "a food sovereignty activist who believes communities should control their own food systems",
    ],
    reframe_lens: "an ecosystem ecologist who sees that healthy food systems, like healthy ecosystems, need DIVERSITY of producers, distributors, and feedback loops — not a single solution",
  },
  {
    id: "housing_policy",
    question:
      "Design a housing policy for a city experiencing rapid tech industry growth. Housing costs have risen 60% in 5 years. Your policy MUST satisfy ALL constraints simultaneously. Be SPECIFIC about mechanisms.",
    constraints: [
      { id: "affordable_units", text: "Produces at least 2,000 affordable housing units within 5 years" },
      { id: "no_displacement", text: "Existing long-term residents (10+ years) cannot be priced out of their neighborhoods" },
      { id: "market_friendly", text: "Does not create perverse incentives that reduce total housing construction" },
      { id: "fiscally_neutral", text: "Net zero impact on city budget over 10-year period (can use bonds if repaid)" },
      { id: "quality", text: "All new units meet or exceed current building codes for energy efficiency and livability" },
      { id: "speed", text: "First units available within 18 months (not just 'planned')" },
    ],
    frames: [
      "a housing economist who has studied rent control failures and successes across 20 cities",
      "a community land trust director who has preserved affordable housing for 15 years",
      "a real estate developer who actually builds housing and knows what kills projects",
    ],
    reframe_lens: "a game theorist who sees housing markets as multiplayer games — the key is designing incentives so that each player's selfish strategy produces the collective optimum",
  },
  {
    id: "elder_care",
    question:
      "Design a care system for elderly residents in a suburban community where 20% of residents are over 70, many living alone. Your system MUST satisfy ALL constraints simultaneously. Be SPECIFIC.",
    constraints: [
      { id: "autonomy", text: "Preserves maximum independence — no one is forced into assisted living against their will" },
      { id: "safety_net", text: "Detects medical emergencies (falls, strokes) within 15 minutes even for those living alone" },
      { id: "social", text: "Ensures every elderly resident has meaningful social interaction at least 3 times per week" },
      { id: "family_burden", text: "Does not require family members to provide more than 5 hours/week of direct care" },
      { id: "cost", text: "Costs less per person than assisted living facility ($4,500/month average)" },
      { id: "dignity", text: "Does not require invasive monitoring (no cameras in homes, no GPS tracking without consent)" },
    ],
    frames: [
      "a geriatrician who has seen both premature institutionalization and preventable deaths from living alone",
      "an adult daughter who provided care for her mother for 7 years while working full-time",
      "a 78-year-old retired engineer who lives alone, values independence, and designs solutions for fellow seniors",
    ],
    reframe_lens: "a village community organizer from rural Japan who knows about 'kominkan' — community centers where elderly people teach, learn, and care for each other as equals, not patients",
  },
];

// ═══════════════════════════════════════════════════════
// 8 CONDITIONS
// ═══════════════════════════════════════════════════════

function formatConstraints(problem) {
  return problem.constraints.map((c, i) => `${i + 1}. ${c.text}`).join("\n");
}

// 1. BASELINE
async function runBaseline(provider, problem) {
  const prompt = `${problem.question}\n\nConstraints:\n${formatConstraints(problem)}`;
  const output = await callModel(
    provider,
    "You are an expert problem solver. Give a specific, concrete, detailed solution.",
    prompt
  );
  return { steps: [{ name: "direct", output }], final: output };
}

// 2. SINGLE — SUPERPOSE only
async function runSingle(provider, problem) {
  const responses = [];
  for (const frame of problem.frames) {
    const output = await callModel(
      provider,
      `You are ${frame}. Answer from your specific expertise and lived experience. Be concrete and specific.`,
      `${problem.question}\n\nConstraints:\n${formatConstraints(problem)}`
    );
    responses.push({ frame, output });
  }
  // Pick response satisfying most constraints (judged quickly by word overlap)
  // For fair comparison, return the longest/most detailed one
  const best = responses.reduce((a, b) => (a.output.length > b.output.length ? a : b));
  return {
    steps: [{ name: "SUPERPOSE", outputs: responses.map((r) => r.output) }],
    final: best.output,
  };
}

// 3. PAIR — SUPERPOSE → INTERFERE
async function runPair(provider, problem) {
  const responses = [];
  for (const frame of problem.frames) {
    const output = await callModel(
      provider,
      `You are ${frame}. Answer from your specific expertise.`,
      `${problem.question}\n\nConstraints:\n${formatConstraints(problem)}`,
      1000
    );
    responses.push({ frame, output });
  }

  const interferencePrompt = `You are analyzing THREE expert solutions to the same problem. Your job is to find where they CONFLICT and where their conflicts reveal something none of them saw alone.

PROBLEM: ${problem.question}

CONSTRAINTS:
${formatConstraints(problem)}

SOLUTION 1 (${problem.frames[0]}):
${responses[0].output}

SOLUTION 2 (${problem.frames[1]}):
${responses[1].output}

SOLUTION 3 (${problem.frames[2]}):
${responses[2].output}

Now:
1. Where do these solutions CONFLICT? Be specific.
2. What do ALL THREE solutions secretly ASSUME that might be wrong?
3. Based on the conflicts and hidden assumptions, propose a SINGLE integrated solution that satisfies ALL 6 constraints. Be very specific and concrete.`;

  const interference = await callModel(
    provider,
    "You find what emerges when different expert views collide. Don't average or compromise. Find the HIGHER solution that resolves conflicts.",
    interferencePrompt
  );

  return {
    steps: [
      { name: "SUPERPOSE", outputs: responses.map((r) => r.output) },
      { name: "INTERFERE", output: interference },
    ],
    final: interference,
  };
}

// 4. TRIPLE — SUPERPOSE → INTERFERE → REFRAME
async function runTriple(provider, problem) {
  const pair = await runPair(provider, problem);

  const reframePrompt = `You have received an integrated analysis of a complex problem. Your job is to TRANSFORM it through your unique lens — see what the analysts missed.

ORIGINAL PROBLEM: ${problem.question}

CONSTRAINTS:
${formatConstraints(problem)}

CURRENT BEST SOLUTION:
${pair.final}

Now REFRAME this through YOUR expertise. What critical element are they all missing? Transform the solution — don't just add to it. Propose your version that satisfies ALL 6 constraints.`;

  const reframed = await callModel(
    provider,
    `You are ${problem.reframe_lens}. Transform the given solution through your unique expertise. Find what everyone else missed.`,
    reframePrompt
  );

  return {
    steps: [...pair.steps, { name: "REFRAME", output: reframed }],
    final: reframed,
  };
}

// 5. FULL — SUPERPOSE → INTERFERE → REFRAME → SYNTHESIZE → VALIDATE
async function runFull(provider, problem) {
  const triple = await runTriple(provider, problem);

  const synthesizePrompt = `You must synthesize multiple expert analyses into a SINGLE, SPECIFIC, CONCRETE solution.

PROBLEM: ${problem.question}

CONSTRAINTS:
${formatConstraints(problem)}

INTERFERENCE ANALYSIS (conflicts and hidden assumptions found):
${triple.steps[1].output}

REFRAMED SOLUTION (transformed through different lens):
${triple.final}

Create the FINAL solution. Requirements:
- Must be SPECIFIC (names, numbers, timelines, mechanisms)
- Must EXPLICITLY address each of the 6 constraints
- For each constraint, explain HOW your solution satisfies it
- Be honest about any constraint that is only partially satisfied`;

  const synthesis = await callModel(
    provider,
    "You are a master integrator. Create the best possible specific solution from the analyses provided. Address each constraint explicitly.",
    synthesizePrompt
  );

  // VALIDATE
  const validatePrompt = `You are a critical evaluator. Your job is to find FLAWS in this solution.

PROBLEM: ${problem.question}

CONSTRAINTS:
${formatConstraints(problem)}

PROPOSED SOLUTION:
${synthesis}

For each constraint, assess:
- Is it TRULY satisfied, or just hand-waved?
- What specific failure mode could occur?
- If NOT fully satisfied, suggest a specific fix.

Then produce an IMPROVED version that addresses any gaps you found.`;

  const validated = await callModel(
    provider,
    "You are an adversarial critic. Find every flaw, then fix them. Be ruthlessly specific.",
    validatePrompt
  );

  return {
    steps: [
      ...triple.steps,
      { name: "SYNTHESIZE", output: synthesis },
      { name: "VALIDATE", output: validated },
    ],
    final: validated,
  };
}

// 6. SCRAMBLED — REFRAME → SUPERPOSE → VALIDATE → SYNTHESIZE → INTERFERE
async function runScrambled(provider, problem) {
  // Step 1: REFRAME cold
  const coldReframe = await callModel(
    provider,
    `You are ${problem.reframe_lens}. Answer from your unique expertise.`,
    `${problem.question}\n\nConstraints:\n${formatConstraints(problem)}`
  );

  // Step 2: SUPERPOSE (after reframe)
  const responses = [];
  for (const frame of problem.frames) {
    const output = await callModel(
      provider,
      `You are ${frame}. Someone already proposed: "${coldReframe.substring(0, 400)}..." Now give YOUR solution.`,
      `${problem.question}\n\nConstraints:\n${formatConstraints(problem)}`,
      1000
    );
    responses.push({ frame, output });
  }

  // Step 3: VALIDATE (premature — nothing to validate yet, just best guess)
  const prematureValidate = await callModel(
    provider,
    "Find flaws and improve.",
    `Evaluate and improve this solution:\n${responses[0].output}\n\nConstraints:\n${formatConstraints(problem)}`
  );

  // Step 4: SYNTHESIZE (premature)
  const prematureSynth = await callModel(
    provider,
    "Synthesize into one solution.",
    `Combine these:\n1: ${prematureValidate.substring(0, 500)}\n2: ${responses[1].output.substring(0, 500)}\n\nConstraints:\n${formatConstraints(problem)}`
  );

  // Step 5: INTERFERE (late)
  const lateInterference = await callModel(
    provider,
    "Find conflicts and resolve.",
    `These two solutions conflict. Find what emerges:\nA: ${coldReframe.substring(0, 500)}\nB: ${prematureSynth.substring(0, 500)}\n\nProduce final solution for:\n${problem.question}\n\nConstraints:\n${formatConstraints(problem)}`
  );

  return {
    steps: [
      { name: "REFRAME(cold)", output: coldReframe },
      { name: "SUPERPOSE(post-reframe)", outputs: responses.map((r) => r.output) },
      { name: "VALIDATE(premature)", output: prematureValidate },
      { name: "SYNTHESIZE(premature)", output: prematureSynth },
      { name: "INTERFERE(late)", output: lateInterference },
    ],
    final: lateInterference,
  };
}

// 7. LONG_PROMPT — same token budget as FULL, but single prompt
async function runLongPrompt(provider, problem) {
  const longPrompt = `${problem.question}

CONSTRAINTS:
${formatConstraints(problem)}

IMPORTANT CONTEXT FOR YOUR SOLUTION:

Consider these expert perspectives:
- ${problem.frames[0]}: Think about what this expert would prioritize and why.
- ${problem.frames[1]}: Think about what this expert would prioritize and why.
- ${problem.frames[2]}: Think about what this expert would prioritize and why.

Also consider the perspective of ${problem.reframe_lens}.

In your solution:
1. First, identify where different expert perspectives CONFLICT
2. Then identify hidden ASSUMPTIONS in the problem framing
3. Propose a SPECIFIC, CONCRETE solution that satisfies all 6 constraints
4. For each constraint, explain explicitly how your solution satisfies it
5. Then critically evaluate your own solution — find flaws and fix them
6. Produce your FINAL improved solution

Be specific: include names, numbers, timelines, mechanisms.`;

  const output = await callModel(
    provider,
    "You are a master problem solver with expertise across multiple domains. Give your most thorough, specific, creative solution.",
    longPrompt,
    2000 // More tokens to match FULL's total compute
  );

  return {
    steps: [{ name: "long_prompt", output }],
    final: output,
  };
}

// 8. LIST_PROMPT — "Consider multiple perspectives then synthesize"
async function runListPrompt(provider, problem) {
  const listPrompt = `${problem.question}

CONSTRAINTS:
${formatConstraints(problem)}

Please approach this problem by:
1. Consider the problem from 3 different expert perspectives
2. Identify conflicts between those perspectives
3. Find hidden assumptions
4. Reframe the problem through an unconventional lens
5. Synthesize everything into one integrated solution
6. Critically validate your solution and fix any gaps

Be specific and concrete. Address each constraint explicitly.`;

  const output = await callModel(
    provider,
    "You are a thoughtful expert problem solver. Follow the approach described.",
    listPrompt,
    2000
  );

  return {
    steps: [{ name: "list_prompt", output }],
    final: output,
  };
}

// ═══════════════════════════════════════════════════════
// OBJECTIVE EVALUATION — constraint satisfaction
// ═══════════════════════════════════════════════════════

async function evaluateConstraints(problem, solutionText) {
  const evalPrompt = `You are a STRICT evaluator. You must assess whether a proposed solution TRULY satisfies each constraint. Be critical — most solutions partially fail on at least 2-3 constraints.

PROBLEM: ${problem.question}

PROPOSED SOLUTION:
${solutionText}

For EACH constraint below, assess:
- SATISFIED (1): The solution includes a SPECIFIC, CONCRETE mechanism that addresses this constraint. Not just mentioning it — actually solving it.
- NOT SATISFIED (0): The solution either ignores this constraint, only vaguely gestures at it, or proposes something that wouldn't actually work.

BE STRICT. "We could also add..." or "this could be combined with..." is NOT satisfied — it must be a concrete part of the design.

${problem.constraints.map((c, i) => `CONSTRAINT ${i + 1}: ${c.text}`).join("\n")}

Respond in EXACTLY this format (one line per constraint):
C1: [0 or 1] — [brief reason]
C2: [0 or 1] — [brief reason]
C3: [0 or 1] — [brief reason]
C4: [0 or 1] — [brief reason]
C5: [0 or 1] — [brief reason]
C6: [0 or 1] — [brief reason]
TOTAL: [sum]/6`;

  const result = await judge(evalPrompt);

  // Parse scores
  const scores = {};
  let total = 0;
  for (let i = 1; i <= 6; i++) {
    const match = result.match(new RegExp(`C${i}:\\s*(\\d)`));
    const score = match ? parseInt(match[1]) : 0;
    scores[problem.constraints[i - 1].id] = score;
    total += score;
  }

  // Also extract total if present
  const totalMatch = result.match(/TOTAL:\s*(\d)/);

  return {
    scores,
    total,
    parsedTotal: totalMatch ? parseInt(totalMatch[1]) : total,
    raw: result,
  };
}

// ═══════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════

const CONDITIONS = [
  { name: "BASELINE", fn: runBaseline },
  { name: "SINGLE", fn: runSingle },
  { name: "PAIR", fn: runPair },
  { name: "TRIPLE", fn: runTriple },
  { name: "FULL", fn: runFull },
  { name: "SCRAMBLED", fn: runScrambled },
  { name: "LONG_PROMPT", fn: runLongPrompt },
  { name: "LIST_PROMPT", fn: runListPrompt },
];

async function main() {
  // Parse command line args
  const args = process.argv.slice(2);
  const providerArg = args[0] || "claude";
  const problemFilter = args[1] || null; // Optional: run only one problem
  const nRuns = parseInt(args[2]) || N_RUNS;

  console.log("═══════════════════════════════════════════════════════════");
  console.log("EXPERIMENT U1: COMPOSITION PROOF — MULTI-CONSTRAINT");
  console.log("═══════════════════════════════════════════════════════════");
  console.log(`Provider: ${providerArg} (${MODELS[providerArg]})`);
  console.log(`Judge: ${JUDGE_MODEL}`);
  console.log(`N = ${nRuns} runs per condition`);
  console.log(`Problems: ${problemFilter || "ALL"}`);
  console.log("");

  const problems = problemFilter
    ? PROBLEMS.filter((p) => p.id === problemFilter)
    : PROBLEMS;

  const allResults = [];
  let totalCalls = 0;

  for (const problem of problems) {
    console.log(`\n${"─".repeat(70)}`);
    console.log(`PROBLEM: ${problem.id}`);
    console.log("─".repeat(70));

    const problemResults = { problem: problem.id, conditions: [] };

    for (const condition of CONDITIONS) {
      console.log(`\n  ${condition.name}:`);
      const runs = [];

      for (let run = 0; run < nRuns; run++) {
        process.stdout.write(`    run ${run + 1}/${nRuns}... `);

        try {
          const result = await condition.fn(providerArg, problem);
          const evaluation = await evaluateConstraints(problem, result.final);
          totalCalls++;

          runs.push({
            run: run + 1,
            finalPreview: result.final.substring(0, 300),
            evaluation,
            wordCount: result.final.split(/\s+/).length,
          });

          console.log(`score=${evaluation.total}/6`);
        } catch (err) {
          console.log(`ERROR: ${err.message.substring(0, 100)}`);
          runs.push({ run: run + 1, error: err.message });
        }
      }

      // Aggregate
      const validRuns = runs.filter((r) => !r.error);
      const scores = validRuns.map((r) => r.evaluation.total);
      const avg = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : -1;
      const std =
        scores.length > 1
          ? Math.sqrt(scores.reduce((s, v) => s + (v - avg) ** 2, 0) / (scores.length - 1))
          : 0;

      // Per-constraint averages
      const constraintAvgs = {};
      for (const c of problem.constraints) {
        const vals = validRuns.map((r) => r.evaluation.scores[c.id] || 0);
        constraintAvgs[c.id] = vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
      }

      const condResult = {
        condition: condition.name,
        runs,
        aggregate: {
          avgScore: +avg.toFixed(2),
          stdDev: +std.toFixed(2),
          n: validRuns.length,
          constraintAvgs,
        },
      };

      console.log(
        `    → AVG: ${avg.toFixed(2)}/6 (σ=${std.toFixed(2)}, n=${validRuns.length})`
      );
      console.log(
        `    → Per constraint: ${Object.entries(constraintAvgs)
          .map(([k, v]) => `${k}=${(v * 100).toFixed(0)}%`)
          .join(", ")}`
      );

      problemResults.conditions.push(condResult);
    }

    allResults.push(problemResults);
  }

  // ═══════════════════════════════════════════════════════
  // ANALYSIS
  // ═══════════════════════════════════════════════════════

  console.log("\n\n" + "═".repeat(70));
  console.log("ANALYSIS");
  console.log("═".repeat(70));

  // Global averages per condition
  const globalByCondition = {};
  for (const prob of allResults) {
    for (const cond of prob.conditions) {
      if (!globalByCondition[cond.condition]) globalByCondition[cond.condition] = [];
      globalByCondition[cond.condition].push(cond.aggregate.avgScore);
    }
  }

  console.log("\n1. GLOBAL AVERAGES (constraints satisfied out of 6):");
  console.log("   " + "─".repeat(50));
  const conditionOrder = CONDITIONS.map((c) => c.name);
  for (const cond of conditionOrder) {
    const vals = globalByCondition[cond] || [];
    const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
    const bar = "█".repeat(Math.round(avg * 5));
    console.log(`   ${cond.padEnd(14)} ${avg.toFixed(2)}/6  ${bar}`);
  }

  // Key comparisons
  const avgOf = (name) => {
    const vals = globalByCondition[name] || [];
    return vals.reduce((a, b) => a + b, 0) / vals.length;
  };

  console.log("\n2. KEY COMPARISONS:");
  const full = avgOf("FULL");
  const base = avgOf("BASELINE");
  const scrambled = avgOf("SCRAMBLED");
  const longP = avgOf("LONG_PROMPT");
  const listP = avgOf("LIST_PROMPT");

  console.log(`   FULL vs BASELINE:    ${full.toFixed(2)} vs ${base.toFixed(2)} (Δ=${(full - base).toFixed(2)}, ${(((full - base) / Math.max(base, 0.01)) * 100).toFixed(1)}%)`);
  console.log(`   FULL vs SCRAMBLED:   ${full.toFixed(2)} vs ${scrambled.toFixed(2)} (Δ=${(full - scrambled).toFixed(2)}) → Order matters: ${full > scrambled + 0.2 ? "YES" : full > scrambled ? "WEAK" : "NO"}`);
  console.log(`   FULL vs LONG_PROMPT: ${full.toFixed(2)} vs ${longP.toFixed(2)} (Δ=${(full - longP).toFixed(2)}) → Not just more tokens: ${full > longP + 0.2 ? "YES" : full > longP ? "WEAK" : "NO"}`);
  console.log(`   FULL vs LIST_PROMPT: ${full.toFixed(2)} vs ${listP.toFixed(2)} (Δ=${(full - listP).toFixed(2)}) → Not just asking for views: ${full > listP + 0.2 ? "YES" : full > listP ? "WEAK" : "NO"}`);

  // Monotonicity test
  const progression = ["BASELINE", "SINGLE", "PAIR", "TRIPLE", "FULL"];
  const progAvgs = progression.map(avgOf);
  let monotonic = true;
  for (let i = 1; i < progAvgs.length; i++) {
    if (progAvgs[i] < progAvgs[i - 1] - 0.15) monotonic = false;
  }
  console.log(`\n   Monotonic improvement: ${monotonic ? "YES" : "NO"}`);
  console.log(`   Progression: ${progression.map((p, i) => `${p}=${progAvgs[i].toFixed(2)}`).join(" → ")}`);

  // Verdict
  console.log("\n" + "═".repeat(70));
  console.log("VERDICT");
  console.log("═".repeat(70));

  const improvement = ((full - base) / Math.max(base, 0.01)) * 100;
  const orderEffect = full - scrambled;
  const computeEffect = full - longP;

  if (improvement > 15 && orderEffect > 0.3 && computeEffect > 0.2) {
    console.log("  ✓ COMPOSITION WORKS: Strong evidence for compositional improvement.");
  } else if (improvement > 8 && orderEffect > 0.1) {
    console.log("  ~ PARTIAL: Composition helps, order matters, but effect is moderate.");
  } else {
    console.log("  ✗ NOT CONFIRMED: Composition does not reliably improve constraint satisfaction.");
  }

  console.log(`\n  Estimated total API calls: ~${totalCalls}`);

  // Save
  const filename = `experiments/results_u1_composition_${providerArg}.json`;
  writeFileSync(filename, JSON.stringify({ provider: providerArg, model: MODELS[providerArg], judge: JUDGE_MODEL, nRuns, results: allResults, analysis: { globalByCondition } }, null, 2));
  console.log(`  Results saved to ${filename}`);
}

main().catch(console.error);
