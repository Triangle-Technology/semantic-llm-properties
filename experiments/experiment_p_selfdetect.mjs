/**
 * Experiment P — Self-Detection Mechanism
 *
 * PROBLEM: Experiment O showed the circuit ALWAYS attempts dissolution (100%
 * classification), even on true binaries. It cannot distinguish genuine from
 * artificial dissolution. An external GENUINE validator is needed, but relying
 * on external evaluation is a weakness.
 *
 * HYPOTHESIS: A self-detection mechanism can be integrated into the circuit
 * itself, allowing it to assess whether its own dissolution is genuine or
 * artificial — WITHOUT external evaluation.
 *
 * Design:
 *   Same 8 problems from Experiment O.
 *   3 self-detection approaches tested:
 *
 *   APPROACH 1: VALIDATE primitive (5th step after SYNTHESIZE)
 *     Add a new step that explicitly checks: "Does this dissolution violate
 *     any stated physical/logical constraints? Is the hidden assumption REAL
 *     or manufactured?"
 *     → Tests: can a dedicated validation step catch artificial dissolution?
 *
 *   APPROACH 2: Constraint-aware SYNTHESIZE (modified 4th step)
 *     Modify SYNTHESIZE prompt to include self-assessment: rate own confidence
 *     that the dissolution is genuine (1-5) and explain why.
 *     → Tests: can synthesis self-assess during production?
 *
 *   APPROACH 3: Pre-classification (step 0 before SUPERPOSE)
 *     Before running the circuit, classify the problem: "Is this a true binary
 *     (physical/logical constraint makes it genuinely binary) or a false binary
 *     (hidden assumption creates appearance of binary)?"
 *     → Tests: can the circuit avoid even attempting dissolution on true binaries?
 *
 *   + BASELINE: Original circuit from Experiment O (no self-detection)
 *
 *   8 problems × 4 approaches × 1 run = 32 attempts
 *   ~220 API calls
 *
 *   Evaluation:
 *     - External GENUINE score (same as Exp O) — ground truth
 *     - Self-reported GENUINE score — from the circuit itself
 *     - CALIBRATION = |external - self-reported| — lower is better
 *     - For Approach 3: CLASSIFICATION_ACCURACY on true vs false binary
 *
 *   SUCCESS CRITERIA:
 *     - At least one approach achieves CALIBRATION ≤ 1.0
 *     - True binary self-reported GENUINE ≤ 2.5 (circuit recognizes artificiality)
 *     - False binary self-reported GENUINE ≥ 3.5 (circuit recognizes genuineness)
 *     - Approach 3: ≥75% classification accuracy
 *
 *   Uses OpenAI API (GPT-4o-mini) — consistent with Experiments O and live demo.
 */

import OpenAI from "openai";
import { writeFileSync } from "fs";

const client = new OpenAI();
const MODEL = "gpt-4o-mini";

async function callLLM(system, userMessage, maxTokens = 1500) {
  const messages = [];
  if (system) messages.push({ role: "system", content: system });
  // Truncate very long messages to avoid JSON body parse errors
  const truncated = userMessage.length > 12000 ? userMessage.slice(0, 12000) + "\n\n[truncated for length]" : userMessage;
  messages.push({ role: "user", content: truncated });

  const res = await client.chat.completions.create({
    model: MODEL,
    max_tokens: maxTokens,
    temperature: 1.0,
    messages,
  });
  return res.choices[0].message.content.trim();
}

// ═══════════════════════════════════════════
//  PROBLEMS — Same 8 from Experiment O
// ═══════════════════════════════════════════

const PROBLEMS = [
  {
    id: "organ_allocation",
    type: "true_binary",
    dilemma:
      "One donor organ is available. Two patients will die without it. Patient A is 8 years old with 60+ years of life ahead. Patient B is 45 with three dependent children. The organ is compatible with both. Only one can receive it. Who gets the organ?",
    option_a: "Give to Patient A (child, more life-years)",
    option_b: "Give to Patient B (parent, dependent children)",
    true_binary_reason: "Physical scarcity — one indivisible resource, two recipients, immediate deadline.",
  },
  {
    id: "trolley_physical",
    type: "true_binary",
    dilemma:
      "A runaway trolley is heading toward 5 people tied to the track. You are standing next to a lever. If you pull it, the trolley diverts to a side track where 1 person is tied. You have 3 seconds to act. Pull the lever or don't — there is no third option in this moment.",
    option_a: "Pull the lever (save 5, kill 1)",
    option_b: "Don't pull (let 5 die, don't actively kill)",
    true_binary_reason: "Physical mechanism with exactly 2 states, extreme time constraint eliminates alternatives.",
  },
  {
    id: "instrument_choice",
    type: "preference",
    dilemma:
      "My 10-year-old child wants to learn a musical instrument. They're equally interested in piano and violin. We can only afford lessons for one instrument this year. Should they learn piano or violin?",
    option_a: "Learn piano",
    option_b: "Learn violin",
  },
  {
    id: "vacation_choice",
    type: "preference",
    dilemma:
      "We have one week of vacation and budget for one trip. My partner wants to go to the mountains for hiking. I want to go to the beach for relaxation. We both refuse to go alone. Mountains or beach?",
    option_a: "Go to the mountains (hiking)",
    option_b: "Go to the beach (relaxation)",
  },
  {
    id: "loyalty_vs_justice",
    type: "false_binary_ethical",
    dilemma:
      "My brother committed a serious financial fraud that harmed dozens of families. I have evidence that could convict him. Turning him in would destroy my family — my parents would never forgive me, and my brother would go to prison for years. Staying silent means the victims get no justice and he might do it again. Do I turn in my brother or protect my family?",
    option_a: "Turn him in (justice for victims)",
    option_b: "Stay silent (protect family)",
  },
  {
    id: "tradition_vs_identity",
    type: "false_binary_ethical",
    dilemma:
      "I'm the eldest son in a traditional family. My parents expect me to take over the family business — a restaurant they built over 30 years. But I've been accepted to medical school, my lifelong dream. Taking over the restaurant means giving up medicine forever. Pursuing medicine means the restaurant closes and my parents lose their legacy. Do I follow my dream or honor my family's legacy?",
    option_a: "Take over the restaurant (honor family legacy)",
    option_b: "Go to medical school (follow personal dream)",
  },
  {
    id: "startup_pivot",
    type: "false_binary_strategic",
    dilemma:
      "Our startup has 6 months of runway left. Our B2B product has 5 paying enterprise clients but slow growth. Our B2C prototype went viral on social media with 100K signups but zero revenue. We can only invest engineering resources in one direction. Do we double down on B2B (safe revenue, slow growth) or pivot to B2C (explosive growth, no revenue)?",
    option_a: "Double down on B2B (safe revenue)",
    option_b: "Pivot to B2C (explosive growth)",
  },
  {
    id: "creative_direction",
    type: "false_binary_strategic",
    dilemma:
      "I'm a musician with a growing following for my experimental electronic music. A major label offers a deal but wants me to produce mainstream pop. Accepting means financial security and massive exposure but losing my artistic identity. Refusing means staying independent, keeping my art pure, but possibly never reaching a wider audience. Do I sign the deal or stay independent?",
    option_a: "Sign the deal (financial security, exposure)",
    option_b: "Stay independent (artistic integrity)",
  },
];

// ═══════════════════════════════════════════
//  SHARED PRIMITIVES (SUPERPOSE, INTERFERE, REFRAME)
// ═══════════════════════════════════════════

async function runSuperpose(problem) {
  const prompt = `You are examining a dilemma from BOTH sides simultaneously. Do NOT choose a side. Instead, fully inhabit each perspective and notice what each frame ASSUMES but doesn't examine.

DILEMMA: ${problem.dilemma}

For EACH side:
1. State the strongest version of this position
2. Identify what this position ASSUMES to be true (especially assumptions it doesn't question)
3. What does this position CANNOT SEE from inside its own frame?

Be specific about hidden assumptions.`;

  return await callLLM(
    "You are performing SUPERPOSITION — holding multiple frames simultaneously without collapsing to either one. Your job is to inhabit each perspective fully while maintaining awareness of what each perspective hides.",
    prompt,
    1200
  );
}

async function runInterfere(problem, superposition) {
  const prompt = `You previously examined both sides of a dilemma. Now COLLIDE them.

DILEMMA: ${problem.dilemma}

SUPERPOSITION ANALYSIS:
${superposition}

Now perform INTERFERENCE — where these two frames meet:
1. What do BOTH sides secretly AGREE on (that might be wrong)?
2. What SHARED ASSUMPTION do both sides make that they don't examine?
3. Where does the collision expose something NEITHER side can see alone?

Focus especially on the SHARED hidden assumption — the thing that makes this LOOK like a binary choice.`;

  return await callLLM(
    "You are performing INTERFERENCE — forcing two opposing frames to collide and expose their shared hidden assumptions. Focus on what BOTH sides take for granted.",
    prompt,
    1000
  );
}

async function runReframe(problem, interference) {
  const prompt = `The collision between two opposing views has exposed hidden assumptions.

DILEMMA: ${problem.dilemma}

INTERFERENCE ANALYSIS:
${interference}

Now perform REFRAME — based on the hidden assumption exposed:
1. State the hidden assumption that makes this LOOK like a binary A-vs-B choice
2. What happens to the dilemma when you REMOVE that assumption?
3. What new option(s) become visible that weren't in the original {A, B} frame?
4. What is the REAL question this situation is asking (not the surface binary)?`;

  return await callLLM(
    "You are performing REFRAME — using exposed hidden assumptions to dissolve the apparent binary. Your goal is to find options that exist OUTSIDE the original A-vs-B frame.",
    prompt,
    1000
  );
}

// ═══════════════════════════════════════════
//  APPROACH 0: BASELINE (original circuit)
// ═══════════════════════════════════════════

async function runBaseline(problem) {
  const superposition = await runSuperpose(problem);
  const interference = await runInterfere(problem, superposition);
  const reframe = await runReframe(problem, interference);

  const synthesizePrompt = `Based on the full analysis below, synthesize a DISSOLUTION of this dilemma.

DILEMMA: ${problem.dilemma}

SUPERPOSITION: ${superposition}
INTERFERENCE: ${interference}
REFRAME: ${reframe}

Provide your FINAL SYNTHESIS:
1. The hidden assumption that created the false binary (1-2 sentences)
2. The dissolution — what should actually be done (NOT choosing A or B, but transcending the frame)
3. Why this dissolution was invisible from within either original frame
4. Concrete next steps`;

  const synthesis = await callLLM(
    "You are performing SYNTHESIS — integrating all previous analysis into a coherent dissolution that transcends the original binary frame.",
    synthesizePrompt,
    1000
  );

  return {
    approach: "baseline",
    superposition,
    interference,
    reframe,
    synthesis,
    self_genuine: null, // baseline has no self-assessment
    self_classification: null,
    full_output: synthesis,
  };
}

// ═══════════════════════════════════════════
//  APPROACH 1: VALIDATE primitive (5th step)
// ═══════════════════════════════════════════

async function runWithValidate(problem) {
  const superposition = await runSuperpose(problem);
  const interference = await runInterfere(problem, superposition);
  const reframe = await runReframe(problem, interference);

  // Standard SYNTHESIZE
  const synthesizePrompt = `Based on the full analysis below, synthesize a DISSOLUTION of this dilemma.

DILEMMA: ${problem.dilemma}

SUPERPOSITION: ${superposition}
INTERFERENCE: ${interference}
REFRAME: ${reframe}

Provide your FINAL SYNTHESIS:
1. The hidden assumption that created the false binary (1-2 sentences)
2. The dissolution — what should actually be done (NOT choosing A or B, but transcending the frame)
3. Why this dissolution was invisible from within either original frame
4. Concrete next steps`;

  const synthesis = await callLLM(
    "You are performing SYNTHESIS — integrating all previous analysis into a coherent dissolution that transcends the original binary frame.",
    synthesizePrompt,
    1000
  );

  // NEW: VALIDATE step
  const validatePrompt = `You are a VALIDATOR checking whether a dissolution is GENUINE or ARTIFICIAL.

ORIGINAL DILEMMA: ${problem.dilemma}

PROPOSED DISSOLUTION:
${synthesis}

Carefully evaluate:

1. CONSTRAINT CHECK: Does the proposed dissolution VIOLATE any physical, logical, or explicitly stated constraints in the original dilemma? (e.g., if there's one indivisible resource for two people, does the dissolution pretend the resource can be split?)

2. ASSUMPTION CHECK: Is the identified "hidden assumption" ACTUALLY hidden and ACTUALLY an assumption? Or is it a REAL constraint being mislabeled as an assumption?

3. OPTION C CHECK: Does the proposed option C genuinely exist OUTSIDE {A, B}? Or is it just a compromise (weighted mix of A and B) disguised as transcendence?

4. PRACTICALITY CHECK: Could the proposed dissolution actually be IMPLEMENTED in the real situation described? Or does it require changing the setup of the problem?

Based on your analysis, rate:

GENUINE_SCORE (1-5):
1 = Completely artificial — ignores real constraints, manufactures fake assumptions
2 = Mostly artificial — the "hidden assumption" is actually a real constraint
3 = Mixed — some real insight but the dissolution still requires choosing A or B
4 = Mostly genuine — real hidden assumption found, viable path proposed
5 = Completely genuine — dissolution clearly superior to any A/B/compromise

Respond in JSON:
{
  "constraint_violated": true/false,
  "assumption_real": true/false,
  "option_c_genuine": true/false,
  "practical": true/false,
  "genuine_score": 1-5,
  "reasoning": "brief explanation"
}`;

  const validateResponse = await callLLM(
    "You are a rigorous validator. Your job is to catch ARTIFICIAL dissolutions — cases where the circuit manufactured a fake 'hidden assumption' or proposed an option that violates stated constraints. Be skeptical. True binaries exist.",
    validatePrompt,
    600
  );

  let validateResult;
  try {
    const jsonMatch = validateResponse.match(/\{[\s\S]*\}/);
    validateResult = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
  } catch (e) {
    validateResult = { genuine_score: -1, reasoning: "Parse error: " + validateResponse.slice(0, 200) };
  }

  return {
    approach: "validate",
    superposition,
    interference,
    reframe,
    synthesis,
    validate: validateResult,
    self_genuine: validateResult?.genuine_score ?? null,
    self_classification: null,
    full_output: synthesis,
  };
}

// ═══════════════════════════════════════════
//  APPROACH 2: Constraint-aware SYNTHESIZE
// ═══════════════════════════════════════════

async function runConstraintAware(problem) {
  const superposition = await runSuperpose(problem);
  const interference = await runInterfere(problem, superposition);
  const reframe = await runReframe(problem, interference);

  // MODIFIED SYNTHESIZE with self-assessment
  const synthesizePrompt = `Based on the full analysis below, synthesize a DISSOLUTION of this dilemma.

DILEMMA: ${problem.dilemma}

SUPERPOSITION: ${superposition}
INTERFERENCE: ${interference}
REFRAME: ${reframe}

Provide your FINAL SYNTHESIS:
1. The hidden assumption that created the false binary (1-2 sentences)
2. The dissolution — what should actually be done (NOT choosing A or B, but transcending the frame)
3. Why this dissolution was invisible from within either original frame
4. Concrete next steps

CRITICAL SELF-ASSESSMENT — After writing your dissolution, honestly evaluate:
5. CONSTRAINT CHECK: Does your dissolution VIOLATE any physical or logical constraints stated in the original dilemma? Be honest — if the dilemma states a resource is indivisible or time is limited, your dissolution cannot pretend otherwise.
6. GENUINE SCORE (1-5): How confident are you that this dissolution is REAL and not manufactured?
   1 = I had to stretch/ignore constraints to find a dissolution — this is probably artificial
   2 = The "hidden assumption" I found might actually be a real constraint
   3 = Mixed — I found something but I'm not sure it truly transcends the binary
   4 = I'm fairly confident this is a genuine dissolution
   5 = This dissolution clearly reveals a real hidden assumption and a viable path

Respond with your synthesis FIRST, then add a JSON block at the end:
{"genuine_score": 1-5, "constraint_violated": true/false, "self_reasoning": "brief explanation"}`;

  const synthesis = await callLLM(
    "You are performing SYNTHESIS with SELF-ASSESSMENT. After producing your dissolution, honestly evaluate whether it is genuine or artificial. It is OK to admit that a dissolution is artificial — true binaries exist and recognizing them is a strength, not a failure.",
    synthesizePrompt,
    1200
  );

  let selfAssessment;
  try {
    const jsonMatch = synthesis.match(/\{[\s\S]*\}/);
    selfAssessment = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
  } catch (e) {
    selfAssessment = { genuine_score: -1, self_reasoning: "Parse error" };
  }

  return {
    approach: "constraint_aware",
    superposition,
    interference,
    reframe,
    synthesis,
    self_assessment: selfAssessment,
    self_genuine: selfAssessment?.genuine_score ?? null,
    self_classification: null,
    full_output: synthesis,
  };
}

// ═══════════════════════════════════════════
//  APPROACH 3: Pre-classification
// ═══════════════════════════════════════════

async function runPreClassify(problem) {
  // Step 0: Classify the problem
  const classifyPrompt = `Before analyzing this dilemma, classify it:

DILEMMA: ${problem.dilemma}

Is this a TRUE BINARY or a FALSE BINARY?

TRUE BINARY: The choice is genuinely binary due to physical constraints, logical necessity, or indivisible resources. No hidden assumption — the binary IS the reality. Examples: one organ for two patients, a lever with exactly two positions, a yes/no legal decision.

FALSE BINARY: The choice APPEARS binary but contains hidden assumptions that, when revealed, open options outside {A, B}. The binary is a FRAME, not reality. Examples: "Should I betray my friend or stay silent?" hides assumptions about what loyalty means.

Analyze:
1. Are there PHYSICAL/LOGICAL constraints that make the binary real?
2. Could the framing be hiding assumptions about what the options mean?
3. Is there a genuine indivisible resource or irreversible mechanism?

Respond in JSON:
{
  "classification": "TRUE_BINARY" or "FALSE_BINARY",
  "confidence": 1-5,
  "reasoning": "brief explanation",
  "constraints_identified": ["list of real physical/logical constraints if any"]
}`;

  const classifyResponse = await callLLM(
    "You are a problem classifier. Your job is to determine whether a dilemma is a TRUE BINARY (genuinely only two options due to physical/logical constraints) or a FALSE BINARY (appears binary but contains hidden assumptions). Be rigorous — not every problem has a hidden assumption.",
    classifyPrompt,
    500
  );

  let classification;
  try {
    const jsonMatch = classifyResponse.match(/\{[\s\S]*\}/);
    classification = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
  } catch (e) {
    classification = { classification: "UNKNOWN", confidence: 0, reasoning: "Parse error" };
  }

  // Run circuit regardless (for comparison), but record classification
  const superposition = await runSuperpose(problem);
  const interference = await runInterfere(problem, superposition);
  const reframe = await runReframe(problem, interference);

  const synthesizePrompt = `Based on the full analysis below, synthesize a DISSOLUTION of this dilemma.

DILEMMA: ${problem.dilemma}

PRE-CLASSIFICATION: This problem was classified as ${classification?.classification} with confidence ${classification?.confidence}/5.
${classification?.classification === "TRUE_BINARY" ? "WARNING: This may be a genuine binary with no hidden assumption. If your dissolution requires violating stated physical/logical constraints, acknowledge that the binary may be REAL and your dissolution may be ARTIFICIAL." : "This appears to be a false binary — proceed with dissolution."}

SUPERPOSITION: ${superposition}
INTERFERENCE: ${interference}
REFRAME: ${reframe}

Provide your FINAL SYNTHESIS:
1. The hidden assumption that created the false binary (1-2 sentences) — OR acknowledge this may be a TRUE BINARY
2. The dissolution — what should actually be done — OR explain why dissolution is not possible here
3. GENUINE SCORE (1-5): How confident are you this dissolution is real?

End with JSON: {"genuine_score": 1-5, "is_true_binary": true/false, "reasoning": "brief"}`;

  const synthesis = await callLLM(
    "You are performing SYNTHESIS informed by pre-classification. If the problem was classified as a true binary, it is OK to conclude that no genuine dissolution exists. Recognizing true binaries is a sign of computational integrity.",
    synthesizePrompt,
    1200
  );

  let selfAssessment;
  try {
    const jsonMatch = synthesis.match(/\{[\s\S]*\}/);
    selfAssessment = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
  } catch (e) {
    selfAssessment = { genuine_score: -1, reasoning: "Parse error" };
  }

  return {
    approach: "pre_classify",
    classification,
    superposition,
    interference,
    reframe,
    synthesis,
    self_genuine: selfAssessment?.genuine_score ?? null,
    self_classification: classification?.classification ?? null,
    full_output: synthesis,
  };
}

// ═══════════════════════════════════════════
//  EXTERNAL EVALUATION (ground truth)
// ═══════════════════════════════════════════

async function evaluateExternal(problem, response) {
  const responseText =
    typeof response === "string" ? response : response.full_output;

  const evalPrompt = `You are an expert evaluator assessing dissolution genuineness.

DILEMMA: ${problem.dilemma}
Option A: ${problem.option_a}
Option B: ${problem.option_b}
Problem Type: ${problem.type}
${problem.true_binary_reason ? `Physical constraint: ${problem.true_binary_reason}` : ""}

RESPONSE:
${responseText}

Rate DISSOLUTION_GENUINE (0-5):
0 = Completely artificial — ignores real constraints
1 = Mostly artificial — mislabels real constraints as assumptions
2 = Somewhat artificial — some insight but dissolution requires choosing A or B
3 = Mixed
4 = Mostly genuine — real hidden assumption, viable path
5 = Completely genuine

JSON only:
{"genuine_score": 0-5, "reasoning": "brief"}`;

  const evalResponse = await callLLM(
    "You are a rigorous evaluator. True binaries have no genuine dissolution. Be especially critical of dissolutions that ignore physical constraints.",
    evalPrompt,
    300
  );

  try {
    const jsonMatch = evalResponse.match(/\{[\s\S]*\}/);
    return jsonMatch ? JSON.parse(jsonMatch[0]) : { genuine_score: -1 };
  } catch (e) {
    return { genuine_score: -1, reasoning: "Parse error" };
  }
}

// ═══════════════════════════════════════════
//  RUNNER
// ═══════════════════════════════════════════

async function runExperiment() {
  console.log("═══════════════════════════════════════════");
  console.log(" Experiment P — Self-Detection Mechanism");
  console.log(" 8 problems × 4 approaches");
  console.log(" Model: " + MODEL);
  console.log("═══════════════════════════════════════════\n");

  const results = [];

  const approaches = [
    { name: "baseline", fn: runBaseline },
    { name: "validate", fn: runWithValidate },
    { name: "constraint_aware", fn: runConstraintAware },
    { name: "pre_classify", fn: runPreClassify },
  ];

  for (const problem of PROBLEMS) {
    console.log(`\n▶ ${problem.id} [${problem.type}]`);

    for (const approach of approaches) {
      console.log(`  → ${approach.name}...`);
      try {
        const response = await approach.fn(problem);

        // External evaluation
        const externalEval = await evaluateExternal(problem, response);

        const result = {
          problem_id: problem.id,
          problem_type: problem.type,
          approach: approach.name,
          self_genuine: response.self_genuine,
          external_genuine: externalEval.genuine_score,
          calibration:
            response.self_genuine !== null && externalEval.genuine_score >= 0
              ? Math.abs(externalEval.genuine_score - response.self_genuine)
              : null,
          self_classification: response.self_classification,
          external_reasoning: externalEval.reasoning,
          response_data: {
            synthesis: response.synthesis?.slice(0, 500),
            validate: response.validate || null,
            self_assessment: response.self_assessment || null,
            classification: response.classification || null,
          },
        };

        console.log(
          `    external=${externalEval.genuine_score} | self=${response.self_genuine ?? "N/A"} | cal=${result.calibration ?? "N/A"}`
        );

        results.push(result);
      } catch (err) {
        console.error(`    ERROR: ${err.message?.slice(0, 100)}`);
        results.push({
          problem_id: problem.id,
          problem_type: problem.type,
          approach: approach.name,
          error: err.message?.slice(0, 200),
        });
      }
    }
  }

  // ═══════════════════════════════════════════
  //  ANALYSIS
  // ═══════════════════════════════════════════

  console.log("\n\n═══════════════════════════════════════════");
  console.log(" RESULTS SUMMARY");
  console.log("═══════════════════════════════════════════\n");

  for (const approachName of ["baseline", "validate", "constraint_aware", "pre_classify"]) {
    const ar = results.filter((r) => r.approach === approachName);
    console.log(`\n── ${approachName.toUpperCase()} ──`);

    // By type
    for (const type of ["true_binary", "preference", "false_binary_ethical", "false_binary_strategic"]) {
      const tr = ar.filter((r) => r.problem_type === type);
      const avgExternal = tr.reduce((s, r) => s + (r.external_genuine || 0), 0) / tr.length;
      const selfScores = tr.filter((r) => r.self_genuine !== null);
      const avgSelf =
        selfScores.length > 0
          ? selfScores.reduce((s, r) => s + r.self_genuine, 0) / selfScores.length
          : null;
      const calScores = tr.filter((r) => r.calibration !== null);
      const avgCal =
        calScores.length > 0
          ? calScores.reduce((s, r) => s + r.calibration, 0) / calScores.length
          : null;

      console.log(
        `  ${type}: ext=${avgExternal.toFixed(1)} | self=${avgSelf?.toFixed(1) ?? "N/A"} | cal=${avgCal?.toFixed(1) ?? "N/A"}`
      );
    }
  }

  // Pre-classify accuracy
  console.log("\n── PRE-CLASSIFY ACCURACY ──");
  const classifyResults = results.filter((r) => r.approach === "pre_classify");
  let correct = 0;
  let total = 0;
  for (const r of classifyResults) {
    const actual = r.problem_type === "true_binary" ? "TRUE_BINARY" : "FALSE_BINARY";
    const predicted = r.self_classification;
    if (predicted) {
      total++;
      if (predicted === actual) correct++;
      console.log(
        `  ${r.problem_id}: actual=${actual} predicted=${predicted} ${predicted === actual ? "✅" : "❌"}`
      );
    }
  }
  console.log(`  Accuracy: ${correct}/${total} (${((correct / total) * 100).toFixed(0)}%)`);

  // Best approach
  console.log("\n── BEST APPROACH ──");
  for (const approachName of ["validate", "constraint_aware", "pre_classify"]) {
    const ar = results.filter((r) => r.approach === approachName && r.calibration !== null);
    const avgCal = ar.reduce((s, r) => s + r.calibration, 0) / ar.length;
    const tbSelf = results
      .filter((r) => r.approach === approachName && r.problem_type === "true_binary" && r.self_genuine !== null)
      .map((r) => r.self_genuine);
    const fbSelf = results
      .filter(
        (r) =>
          r.approach === approachName &&
          (r.problem_type === "false_binary_ethical" || r.problem_type === "false_binary_strategic") &&
          r.self_genuine !== null
      )
      .map((r) => r.self_genuine);

    const tbAvg = tbSelf.length > 0 ? tbSelf.reduce((a, b) => a + b, 0) / tbSelf.length : null;
    const fbAvg = fbSelf.length > 0 ? fbSelf.reduce((a, b) => a + b, 0) / fbSelf.length : null;

    console.log(
      `  ${approachName}: avg_cal=${avgCal.toFixed(2)} | tb_self=${tbAvg?.toFixed(1) ?? "N/A"} | fb_self=${fbAvg?.toFixed(1) ?? "N/A"}`
    );
  }

  // Save
  const output = {
    experiment: "P",
    name: "Self-Detection Mechanism",
    model: MODEL,
    timestamp: new Date().toISOString(),
    num_problems: PROBLEMS.length,
    approaches: ["baseline", "validate", "constraint_aware", "pre_classify"],
    results,
    summary: buildSummary(results),
  };

  const filename = "results_p_selfdetect.json";
  writeFileSync(`experiments/${filename}`, JSON.stringify(output, null, 2));
  console.log(`\nResults saved to experiments/${filename}`);

  return output;
}

function buildSummary(results) {
  const summary = {};

  for (const approach of ["baseline", "validate", "constraint_aware", "pre_classify"]) {
    summary[approach] = {};
    for (const type of ["true_binary", "preference", "false_binary_ethical", "false_binary_strategic"]) {
      const tr = results.filter((r) => r.approach === approach && r.problem_type === type);
      const selfScores = tr.filter((r) => r.self_genuine !== null);
      const calScores = tr.filter((r) => r.calibration !== null);

      summary[approach][type] = {
        avg_external:
          tr.reduce((s, r) => s + (r.external_genuine || 0), 0) / tr.length,
        avg_self:
          selfScores.length > 0
            ? selfScores.reduce((s, r) => s + r.self_genuine, 0) / selfScores.length
            : null,
        avg_calibration:
          calScores.length > 0
            ? calScores.reduce((s, r) => s + r.calibration, 0) / calScores.length
            : null,
      };
    }
  }

  // Pre-classify accuracy
  const classifyResults = results.filter((r) => r.approach === "pre_classify");
  let correct = 0;
  let total = 0;
  for (const r of classifyResults) {
    const actual = r.problem_type === "true_binary" ? "TRUE_BINARY" : "FALSE_BINARY";
    if (r.self_classification) {
      total++;
      if (r.self_classification === actual) correct++;
    }
  }
  summary.pre_classify_accuracy = { correct, total, pct: total > 0 ? correct / total : 0 };

  return summary;
}

// Run
runExperiment().catch(console.error);
