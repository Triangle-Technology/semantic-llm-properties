/**
 * Experiment O — Dissolution Boundary Test
 *
 * HYPOTHESIS: Dissolution has BOUNDARY CONDITIONS.
 * Not all binary-seeming problems have hidden assumptions.
 * Dissolution should FAIL on "true binaries" and SUCCEED on "false binaries."
 *
 * If dissolution always succeeds (even on true binaries), it's not a reliable
 * computation — it's confabulation. Finding where dissolution FAILS is as
 * important as showing where it succeeds.
 *
 * Design:
 *   8 problems across 4 TYPES (2 each):
 *
 *   TYPE 1: TRUE BINARY (dissolution SHOULD FAIL)
 *     Physical/logical constraints → no hidden assumption → binary is real.
 *     Expected: dissolution attempt produces FORCED/ARTIFICIAL reframe.
 *
 *   TYPE 2: PREFERENCE (dissolution outcome UNCERTAIN)
 *     Genuine preference with no hidden assumption, just different values.
 *     Expected: dissolution may not be meaningful — "both are fine" is valid.
 *
 *   TYPE 3: FALSE BINARY — ETHICAL (dissolution SHOULD SUCCEED)
 *     Classic ethical dilemmas with known hidden assumptions.
 *     Expected: dissolution finds hidden assumption → option C.
 *     (Control — same type as Experiment N)
 *
 *   TYPE 4: FALSE BINARY — STRATEGIC (dissolution SHOULD SUCCEED)
 *     Business/creative decisions that LOOK binary but aren't.
 *     Expected: dissolution reveals broader option space.
 *     (New domain — tests generalization beyond ethics)
 *
 *   Methods: semantic-circuit only (we already know constrained = 0%)
 *   + free-response as baseline
 *   2 runs each → 8 problems × 2 methods × 2 runs = 32 attempts
 *   ~160 API calls (circuit = 4 calls + 1 eval, free = 1 + 1 eval)
 *
 *   Evaluation adds new dimension:
 *     - CLASSIFICATION: CHOSE_A / CHOSE_B / COMPROMISE / DISSOLUTION
 *     - ASSUMPTION_FOUND (0-5)
 *     - DISSOLUTION_QUALITY (0-5)
 *     - DISSOLUTION_GENUINE (0-5): Is the dissolution REAL or forced/artificial?
 *       (New metric — catches confabulation on true binaries)
 *
 *   SUCCESS CRITERIA:
 *     - Type 1 (true binary): circuit should NOT produce genuine dissolution
 *       → DISSOLUTION_GENUINE ≤ 2 (forced/artificial)
 *     - Type 2 (preference): circuit may or may not dissolve
 *       → Results are informative either way
 *     - Type 3 (false binary - ethical): circuit SHOULD dissolve
 *       → DISSOLUTION_GENUINE ≥ 4, same pattern as Experiment N
 *     - Type 4 (false binary - strategic): circuit SHOULD dissolve
 *       → Tests generalization to non-ethical domains
 *
 *   If circuit produces "dissolution" on true binaries with high GENUINE score,
 *   that's a NEGATIVE result — means the circuit confabulates rather than computes.
 *
 *   Uses OpenAI API (GPT-4o-mini) — consistent with live Semantic Computer.
 */

import OpenAI from "openai";
import { writeFileSync } from "fs";

const client = new OpenAI();
const MODEL = "gpt-4o-mini";

async function callLLM(system, userMessage, maxTokens = 1500) {
  const messages = [];
  if (system) messages.push({ role: "system", content: system });
  messages.push({ role: "user", content: userMessage });

  const res = await client.chat.completions.create({
    model: MODEL,
    max_tokens: maxTokens,
    temperature: 1.0,
    messages,
  });
  return res.choices[0].message.content.trim();
}

// ═══════════════════════════════════════════
//  PROBLEMS — 4 Types × 2 Each
// ═══════════════════════════════════════════

const PROBLEMS = [
  // ── TYPE 1: TRUE BINARY (dissolution SHOULD FAIL) ──
  {
    id: "organ_allocation",
    type: "true_binary",
    dilemma:
      "One donor organ is available. Two patients will die without it. Patient A is 8 years old with 60+ years of life ahead. Patient B is 45 with three dependent children. The organ is compatible with both. Only one can receive it. Who gets the organ?",
    option_a: "Give to Patient A (child, more life-years)",
    option_b: "Give to Patient B (parent, dependent children)",
    expected_dissolution: "SHOULD FAIL — there is genuinely one organ and two patients. The physical constraint is real. Any 'dissolution' would be artificial (e.g., 'grow more organs' doesn't help NOW).",
    true_binary_reason: "Physical scarcity — one indivisible resource, two recipients, immediate deadline.",
  },
  {
    id: "trolley_physical",
    type: "true_binary",
    dilemma:
      "A runaway trolley is heading toward 5 people tied to the track. You are standing next to a lever. If you pull it, the trolley diverts to a side track where 1 person is tied. You have 3 seconds to act. Pull the lever or don't — there is no third option in this moment.",
    option_a: "Pull the lever (save 5, kill 1)",
    option_b: "Don't pull (let 5 die, don't actively kill)",
    expected_dissolution: "SHOULD FAIL — this is deliberately constructed as a true binary with physical constraints and time pressure. The lever has two states. Any 'dissolution' (e.g., 'untie people') violates the constraint.",
    true_binary_reason: "Physical mechanism with exactly 2 states, extreme time constraint eliminates alternatives.",
  },

  // ── TYPE 2: PREFERENCE (dissolution outcome UNCERTAIN) ──
  {
    id: "instrument_choice",
    type: "preference",
    dilemma:
      "My 10-year-old child wants to learn a musical instrument. They're equally interested in piano and violin. We can only afford lessons for one instrument this year. Should they learn piano or violin?",
    option_a: "Learn piano",
    option_b: "Learn violin",
    expected_dissolution: "UNCERTAIN — this may be a genuine preference without hidden assumption. Both are valid. A 'dissolution' might feel forced here.",
    preference_reason: "No hidden assumption — the choice is between two genuinely equivalent options based on personal taste.",
  },
  {
    id: "vacation_choice",
    type: "preference",
    dilemma:
      "We have one week of vacation and budget for one trip. My partner wants to go to the mountains for hiking. I want to go to the beach for relaxation. We both refuse to go alone. Mountains or beach?",
    option_a: "Go to the mountains (hiking)",
    option_b: "Go to the beach (relaxation)",
    expected_dissolution: "UNCERTAIN — could dissolve if hidden assumption is 'vacation must be one type.' But could also be a genuine preference conflict with no deeper assumption.",
    preference_reason: "May or may not have hidden assumption — depends on whether the framing conceals a real option C.",
  },

  // ── TYPE 3: FALSE BINARY — ETHICAL (dissolution SHOULD SUCCEED) ──
  {
    id: "loyalty_vs_justice",
    type: "false_binary_ethical",
    dilemma:
      "My brother committed a serious financial fraud that harmed dozens of families. I have evidence that could convict him. Turning him in would destroy my family — my parents would never forgive me, and my brother would go to prison for years. Staying silent means the victims get no justice and he might do it again. Do I turn in my brother or protect my family?",
    option_a: "Turn him in (justice for victims)",
    option_b: "Stay silent (protect family)",
    hidden_assumption: "That justice and family loyalty operate in separate, incompatible domains — that accountability necessarily means betrayal, and that protecting family means enabling harm.",
    known_dissolution: "Confront brother directly and give him a deadline to make restitution and turn himself in. Support him through accountability rather than covering for him. Family loyalty expressed through helping someone face consequences, not hiding from them.",
  },
  {
    id: "tradition_vs_identity",
    type: "false_binary_ethical",
    dilemma:
      "I'm the eldest son in a traditional family. My parents expect me to take over the family business — a restaurant they built over 30 years. But I've been accepted to medical school, my lifelong dream. Taking over the restaurant means giving up medicine forever. Pursuing medicine means the restaurant closes and my parents lose their legacy. Do I follow my dream or honor my family's legacy?",
    option_a: "Take over the restaurant (honor family legacy)",
    option_b: "Go to medical school (follow personal dream)",
    hidden_assumption: "That the family legacy IS the physical restaurant, and that honoring parents means literally replicating their path. Also assumes the restaurant cannot survive without this specific person running it.",
    known_dissolution: "The family legacy is the VALUES (hard work, service, community) not the specific business form. These values can be honored through medicine. The restaurant can be managed by a hired manager, franchised, or evolved. Parents' true wish is likely their child's flourishing, not their child's sacrifice.",
  },

  // ── TYPE 4: FALSE BINARY — STRATEGIC (dissolution SHOULD SUCCEED) ──
  {
    id: "startup_pivot",
    type: "false_binary_strategic",
    dilemma:
      "Our startup has 6 months of runway left. Our B2B product has 5 paying enterprise clients but slow growth. Our B2C prototype went viral on social media with 100K signups but zero revenue. We can only invest engineering resources in one direction. Do we double down on B2B (safe revenue, slow growth) or pivot to B2C (explosive growth, no revenue)?",
    option_a: "Double down on B2B (safe revenue)",
    option_b: "Pivot to B2C (explosive growth)",
    hidden_assumption: "That B2B and B2C are separate products requiring separate engineering investments, and that growth and revenue are opposing forces.",
    known_dissolution: "Use the B2C viral product as a lead-generation funnel for B2B sales. Or create a freemium B2C that upsells to B2B. The 100K signups ARE potential B2B leads. The real question is how to connect the demand signal (B2C) to the revenue model (B2B).",
  },
  {
    id: "creative_direction",
    type: "false_binary_strategic",
    dilemma:
      "I'm a musician with a growing following for my experimental electronic music. A major label offers a deal but wants me to produce mainstream pop. Accepting means financial security and massive exposure but losing my artistic identity. Refusing means staying independent, keeping my art pure, but possibly never reaching a wider audience. Do I sign the deal or stay independent?",
    option_a: "Sign the deal (financial security, exposure)",
    option_b: "Stay independent (artistic integrity)",
    hidden_assumption: "That mainstream appeal and artistic integrity are inversely correlated, and that a label deal means complete creative surrender.",
    known_dissolution: "Negotiate creative control clauses in the deal. Use label resources for distribution while self-producing. Release experimental music under own name and pop under alias. Build audience through live shows that blend both. The real question is about leverage and deal structure, not all-or-nothing identity.",
  },
];

// ═══════════════════════════════════════════
//  METHODS
// ═══════════════════════════════════════════

async function runFreeResponse(problem) {
  const prompt = `Consider this situation deeply. Give your most thoughtful, honest advice.

${problem.dilemma}

What should they do?`;

  return await callLLM(null, prompt, 1000);
}

async function runSemanticCircuit(problem) {
  // Step 1: SUPERPOSE
  const superposePrompt = `You are examining a dilemma from BOTH sides simultaneously. Do NOT choose a side. Instead, fully inhabit each perspective and notice what each frame ASSUMES but doesn't examine.

DILEMMA: ${problem.dilemma}

For EACH side:
1. State the strongest version of this position
2. Identify what this position ASSUMES to be true (especially assumptions it doesn't question)
3. What does this position CANNOT SEE from inside its own frame?

Be specific about hidden assumptions.`;

  const superposition = await callLLM(
    "You are performing SUPERPOSITION — holding multiple frames simultaneously without collapsing to either one. Your job is to inhabit each perspective fully while maintaining awareness of what each perspective hides.",
    superposePrompt,
    1200
  );

  // Step 2: INTERFERE
  const interferePrompt = `You previously examined both sides of a dilemma. Now COLLIDE them.

DILEMMA: ${problem.dilemma}

SUPERPOSITION ANALYSIS:
${superposition}

Now perform INTERFERENCE — where these two frames meet:
1. What do BOTH sides secretly AGREE on (that might be wrong)?
2. What SHARED ASSUMPTION do both sides make that they don't examine?
3. Where does the collision expose something NEITHER side can see alone?

Focus especially on the SHARED hidden assumption — the thing that makes this LOOK like a binary choice.`;

  const interference = await callLLM(
    "You are performing INTERFERENCE — forcing two opposing frames to collide and expose their shared hidden assumptions. Focus on what BOTH sides take for granted.",
    interferePrompt,
    1000
  );

  // Step 3: REFRAME
  const reframePrompt = `The collision between two opposing views has exposed hidden assumptions.

DILEMMA: ${problem.dilemma}

INTERFERENCE ANALYSIS:
${interference}

Now perform REFRAME — based on the hidden assumption exposed:
1. State the hidden assumption that makes this LOOK like a binary A-vs-B choice
2. What happens to the dilemma when you REMOVE that assumption?
3. What new option(s) become visible that weren't in the original {A, B} frame?
4. What is the REAL question this situation is asking (not the surface binary)?`;

  const reframe = await callLLM(
    "You are performing REFRAME — using exposed hidden assumptions to dissolve the apparent binary. Your goal is to find options that exist OUTSIDE the original A-vs-B frame.",
    reframePrompt,
    1000
  );

  // Step 4: SYNTHESIZE
  const synthesizePrompt = `Based on the full analysis below, synthesize a DISSOLUTION of this dilemma.

DILEMMA: ${problem.dilemma}

SUPERPOSITION: ${superposition}

INTERFERENCE: ${interference}

REFRAME: ${reframe}

Provide your FINAL SYNTHESIS:
1. The hidden assumption that created the false binary (1-2 sentences)
2. The dissolution — what should actually be done (NOT choosing A or B, but transcending the frame)
3. Why this dissolution was invisible from within either original frame
4. Concrete next steps the person can take`;

  const synthesis = await callLLM(
    "You are performing SYNTHESIS — integrating all previous analysis into a coherent dissolution that transcends the original binary frame. The output should be at a HIGHER level of understanding than either input frame.",
    synthesizePrompt,
    1000
  );

  return {
    superposition,
    interference,
    reframe,
    synthesis,
    full_output: synthesis,
  };
}

// ═══════════════════════════════════════════
//  EVALUATION — Enhanced with GENUINE metric
// ═══════════════════════════════════════════

async function evaluateResponse(problem, response, method) {
  const responseText =
    typeof response === "string" ? response : response.full_output;

  const evalPrompt = `You are an expert evaluator assessing whether a response to a dilemma achieves genuine "dissolution" — finding the hidden assumption that creates a false binary and revealing options outside the original frame.

DILEMMA: ${problem.dilemma}
Option A: ${problem.option_a}
Option B: ${problem.option_b}

PROBLEM TYPE: ${problem.type}
${problem.type === "true_binary" ? `NOTE: This problem may be a GENUINE binary with no hidden assumption. The physical/logical constraint is: ${problem.true_binary_reason}` : ""}
${problem.type === "preference" ? `NOTE: This problem may be a genuine preference choice. Consider: ${problem.preference_reason}` : ""}

RESPONSE TO EVALUATE:
${responseText}

Evaluate this response on these dimensions:

1. CLASSIFICATION (exactly one):
   - CHOSE_A: Primarily chose option A
   - CHOSE_B: Primarily chose option B
   - COMPROMISE: Tried to balance A and B (still within the binary frame)
   - DISSOLUTION: Found a hidden assumption and revealed options outside {A, B}

2. ASSUMPTION_FOUND (0-5): How clearly did the response identify a hidden assumption?
   0 = No assumption identified
   5 = Hidden assumption clearly and precisely identified

3. DISSOLUTION_QUALITY (0-5): How genuinely transcendent is the proposed path?
   0 = No transcendence — stayed within {A, B}
   5 = Completely transcended the original frame with a viable path

4. DISSOLUTION_GENUINE (0-5): Is the dissolution REAL or forced/artificial?
   0 = Completely artificial — the "dissolution" ignores real constraints or invents impossible options
   1 = Mostly artificial — reframes in a way that doesn't actually change the core constraint
   2 = Somewhat artificial — identifies a real insight but the proposed path still requires choosing A or B
   3 = Mixed — some genuine insight but partially forced
   4 = Mostly genuine — real hidden assumption found, viable path proposed
   5 = Completely genuine — the dissolution is clearly superior to any A/B/compromise approach

IMPORTANT: A dissolution can be high-quality but LOW GENUINE if it ignores real physical constraints.
For true binaries (like trolley problems), even a well-argued dissolution gets low GENUINE if it violates the stated constraints.

Respond in this exact JSON format:
{
  "classification": "CHOSE_A|CHOSE_B|COMPROMISE|DISSOLUTION",
  "assumption_found": 0-5,
  "dissolution_quality": 0-5,
  "dissolution_genuine": 0-5,
  "reasoning": "Brief explanation of your evaluation"
}`;

  const evalResponse = await callLLM(
    "You are a rigorous evaluator. Be especially critical of dissolutions that ignore physical constraints or invent impossible alternatives. A true binary has no dissolution — any attempt to dissolve it is ARTIFICIAL.",
    evalPrompt,
    500
  );

  try {
    // Try to extract JSON from the response
    const jsonMatch = evalResponse.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (e) {
    console.error("Failed to parse evaluation:", evalResponse);
  }

  return {
    classification: "UNKNOWN",
    assumption_found: -1,
    dissolution_quality: -1,
    dissolution_genuine: -1,
    reasoning: "Parse error: " + evalResponse.slice(0, 200),
  };
}

// ═══════════════════════════════════════════
//  RUNNER
// ═══════════════════════════════════════════

async function runExperiment() {
  console.log("═══════════════════════════════════════════");
  console.log(" Experiment O — Dissolution Boundary Test");
  console.log(" 8 problems × 2 methods × 2 runs");
  console.log(" Model: " + MODEL);
  console.log("═══════════════════════════════════════════\n");

  const results = [];
  const NUM_RUNS = 2;

  for (const problem of PROBLEMS) {
    console.log(`\n▶ ${problem.id} [${problem.type}]`);

    for (let run = 0; run < NUM_RUNS; run++) {
      console.log(`  Run ${run + 1}/${NUM_RUNS}`);

      // --- Free Response ---
      console.log("    → free-response...");
      const freeResponse = await runFreeResponse(problem);
      const freeEval = await evaluateResponse(problem, freeResponse, "free-response");
      console.log(`      ${freeEval.classification} | genuine=${freeEval.dissolution_genuine}`);

      results.push({
        problem_id: problem.id,
        problem_type: problem.type,
        method: "free-response",
        run: run + 1,
        response: freeResponse,
        evaluation: freeEval,
      });

      // --- Semantic Circuit ---
      console.log("    → semantic-circuit...");
      const circuitResponse = await runSemanticCircuit(problem);
      const circuitEval = await evaluateResponse(problem, circuitResponse, "semantic-circuit");
      console.log(`      ${circuitEval.classification} | genuine=${circuitEval.dissolution_genuine}`);

      results.push({
        problem_id: problem.id,
        problem_type: problem.type,
        method: "semantic-circuit",
        run: run + 1,
        response:
          typeof circuitResponse === "string"
            ? circuitResponse
            : {
                superposition: circuitResponse.superposition,
                interference: circuitResponse.interference,
                reframe: circuitResponse.reframe,
                synthesis: circuitResponse.synthesis,
              },
        evaluation: circuitEval,
      });
    }
  }

  // ═══════════════════════════════════════════
  //  ANALYSIS
  // ═══════════════════════════════════════════

  console.log("\n\n═══════════════════════════════════════════");
  console.log(" RESULTS SUMMARY");
  console.log("═══════════════════════════════════════════\n");

  const types = ["true_binary", "preference", "false_binary_ethical", "false_binary_strategic"];

  for (const type of types) {
    const typeResults = results.filter((r) => r.problem_type === type);
    console.log(`\n── ${type.toUpperCase()} ──`);

    for (const method of ["free-response", "semantic-circuit"]) {
      const methodResults = typeResults.filter((r) => r.method === method);
      const dissolutions = methodResults.filter(
        (r) => r.evaluation.classification === "DISSOLUTION"
      );
      const avgGenuine =
        methodResults.reduce((s, r) => s + (r.evaluation.dissolution_genuine || 0), 0) /
        methodResults.length;
      const avgAssumption =
        methodResults.reduce((s, r) => s + (r.evaluation.assumption_found || 0), 0) /
        methodResults.length;

      console.log(
        `  ${method}: ${dissolutions.length}/${methodResults.length} dissolution | ` +
          `genuine=${avgGenuine.toFixed(1)} | assumption=${avgAssumption.toFixed(1)}`
      );
    }
  }

  // Boundary detection
  console.log("\n\n── BOUNDARY ANALYSIS ──");
  const trueBinaryCircuit = results.filter(
    (r) => r.problem_type === "true_binary" && r.method === "semantic-circuit"
  );
  const falseBinaryCircuit = results.filter(
    (r) =>
      (r.problem_type === "false_binary_ethical" || r.problem_type === "false_binary_strategic") &&
      r.method === "semantic-circuit"
  );

  const tbGenuine =
    trueBinaryCircuit.reduce((s, r) => s + (r.evaluation.dissolution_genuine || 0), 0) /
    trueBinaryCircuit.length;
  const fbGenuine =
    falseBinaryCircuit.reduce((s, r) => s + (r.evaluation.dissolution_genuine || 0), 0) /
    falseBinaryCircuit.length;

  console.log(`True binary avg GENUINE: ${tbGenuine.toFixed(2)}`);
  console.log(`False binary avg GENUINE: ${fbGenuine.toFixed(2)}`);
  console.log(`Gap: ${(fbGenuine - tbGenuine).toFixed(2)}`);

  if (fbGenuine - tbGenuine >= 1.5) {
    console.log("✅ BOUNDARY DETECTED — dissolution is SELECTIVE (works on false binaries, not true ones)");
  } else if (fbGenuine - tbGenuine >= 0.5) {
    console.log("⚠️ WEAK BOUNDARY — some selectivity but not strong");
  } else {
    console.log("❌ NO BOUNDARY — dissolution may be confabulation (works equally on everything)");
  }

  // Save results
  const output = {
    experiment: "O",
    name: "Dissolution Boundary Test",
    model: MODEL,
    timestamp: new Date().toISOString(),
    num_problems: PROBLEMS.length,
    num_runs: NUM_RUNS,
    problems: PROBLEMS.map((p) => ({
      id: p.id,
      type: p.type,
      dilemma: p.dilemma,
    })),
    results,
    summary: {
      true_binary: summarizeType(results, "true_binary"),
      preference: summarizeType(results, "preference"),
      false_binary_ethical: summarizeType(results, "false_binary_ethical"),
      false_binary_strategic: summarizeType(results, "false_binary_strategic"),
    },
    boundary_analysis: {
      true_binary_genuine: tbGenuine,
      false_binary_genuine: fbGenuine,
      gap: fbGenuine - tbGenuine,
      boundary_detected: fbGenuine - tbGenuine >= 1.5,
    },
  };

  const filename = `results_o_boundary.json`;
  writeFileSync(`experiments/${filename}`, JSON.stringify(output, null, 2));
  console.log(`\nResults saved to experiments/${filename}`);

  return output;
}

function summarizeType(results, type) {
  const typeResults = results.filter((r) => r.problem_type === type);
  const summary = {};

  for (const method of ["free-response", "semantic-circuit"]) {
    const mr = typeResults.filter((r) => r.method === method);
    summary[method] = {
      total: mr.length,
      dissolutions: mr.filter((r) => r.evaluation.classification === "DISSOLUTION").length,
      compromises: mr.filter((r) => r.evaluation.classification === "COMPROMISE").length,
      chose_a: mr.filter((r) => r.evaluation.classification === "CHOSE_A").length,
      chose_b: mr.filter((r) => r.evaluation.classification === "CHOSE_B").length,
      avg_assumption: mr.reduce((s, r) => s + (r.evaluation.assumption_found || 0), 0) / mr.length,
      avg_dissolution_quality:
        mr.reduce((s, r) => s + (r.evaluation.dissolution_quality || 0), 0) / mr.length,
      avg_genuine:
        mr.reduce((s, r) => s + (r.evaluation.dissolution_genuine || 0), 0) / mr.length,
    };
  }

  return summary;
}

// Run
runExperiment().catch(console.error);
