/**
 * Experiment N — The Dissolution Test
 *
 * HYPOTHESIS: Semantic operations can solve "dissolution problems" that
 * traditional programming STRUCTURALLY CANNOT EXPRESS.
 *
 * A dissolution problem: Given a dilemma framed as A vs B,
 * find the HIDDEN ASSUMPTION that makes it LOOK binary,
 * then reveal option C that exists outside {A, B}.
 *
 * Design:
 *   5 dilemmas, each with a known hidden assumption and dissolution.
 *   4 methods:
 *     1. FORCED-CHOICE: Must pick A or B (simulates classification/decision programming)
 *     2. WEIGHTED-ANALYSIS: Must score A and B numerically (simulates optimization programming)
 *     3. FREE-RESPONSE: Can answer freely (baseline LLM — implicit semantic ops)
 *     4. SEMANTIC-CIRCUIT: Explicit SUPERPOSE → INTERFERE → REFRAME → SYNTHESIZE
 *
 *   Evaluation: Independent LLM judge classifies each output:
 *     - CHOSE_A: Picked side A
 *     - CHOSE_B: Picked side B
 *     - COMPROMISE: Tried to balance A and B (still within binary frame)
 *     - DISSOLUTION: Found hidden assumption, revealed option C outside {A, B}
 *     - Also rates: ASSUMPTION_QUALITY (0-5) and DISSOLUTION_QUALITY (0-5)
 *
 *   If methods 1-2 CANNOT produce dissolution (structurally constrained),
 *   but methods 3-4 CAN → demonstrates inexpressibility.
 *
 *   ~200 API calls total (5 problems × 4 methods × 2 runs × ~5 calls each)
 */

import Anthropic from "@anthropic-ai/sdk";
import { writeFileSync } from "fs";

const client = new Anthropic();
const MODEL = "claude-haiku-4-5-20251001";

async function callClaude(system, userMessage, maxTokens = 1500) {
  const params = {
    model: MODEL,
    max_tokens: maxTokens,
    temperature: 1.0,
    messages: [{ role: "user", content: userMessage }],
  };
  if (system) params.system = system;
  const res = await client.messages.create(params);
  return res.content[0].text.trim();
}

// ═══════════════════════════════════════════
// DILEMMAS — each has a known hidden assumption
// ═══════════════════════════════════════════

const DILEMMAS = [
  {
    id: "privacy_vs_security",
    dilemma:
      "A city must choose: implement comprehensive AI surveillance that would reduce crime by 40%, or preserve citizen privacy and accept the current crime rate. Which should they choose?",
    option_a: "Implement AI surveillance (security)",
    option_b: "Preserve privacy (freedom)",
    hidden_assumption:
      "That surveillance and privacy are inversely correlated — that more security necessarily means less privacy",
    known_dissolution:
      "Community-based safety programs, environmental design, and targeted (not mass) intervention can reduce crime WITHOUT surveillance. The real question isn't privacy vs security but WHO designs the safety system and for WHOM.",
  },
  {
    id: "growth_vs_environment",
    dilemma:
      "A developing nation must choose: pursue rapid industrialization to lift millions from poverty, or protect its rainforests and biodiversity. The nation cannot afford both. Which should they prioritize?",
    option_a: "Industrialize (economic growth)",
    option_b: "Protect environment (conservation)",
    hidden_assumption:
      "That economic development requires industrial destruction of nature — that prosperity and ecology are zero-sum",
    known_dissolution:
      "Ecosystem services (carbon credits, ecotourism, biodiversity patents, sustainable harvesting) can generate wealth FROM the forest. The hidden assumption is that 'development' means 'industrialization.' The real question is what KIND of prosperity — extractive or regenerative.",
  },
  {
    id: "tradition_vs_progress",
    dilemma:
      "An indigenous community is offered a tech company's proposal: allow a data center on their sacred land in exchange for broadband internet, jobs, and $50M. Rejecting means continued isolation and poverty. Should they accept?",
    option_a: "Accept the deal (progress/prosperity)",
    option_b: "Reject and preserve sacred land (tradition/identity)",
    hidden_assumption:
      "That modernization requires the community to sacrifice what makes them who they are — that they must choose between identity and prosperity",
    known_dissolution:
      "The community could leverage their cultural knowledge as intellectual property, create their OWN tech initiatives on their terms, or negotiate placement on non-sacred land. The hidden assumption is that prosperity comes FROM OUTSIDE on outsiders' terms. The real question is who controls the terms of development.",
  },
  {
    id: "honesty_vs_kindness",
    dilemma:
      "Your close friend has spent 3 years writing a novel they believe is their masterpiece. They ask for your honest opinion before submitting to publishers. The novel is genuinely bad — poor structure, flat characters, clichéd plot. Do you tell the truth and crush their dream, or lie and let them face rejection from publishers?",
    option_a: "Tell the brutal truth (honesty)",
    option_b: "Be kind, soften or withhold criticism (kindness)",
    hidden_assumption:
      "That honest feedback must be crushing and kind feedback must be dishonest — that truth and care are opposites",
    known_dissolution:
      "Skilled feedback is BOTH honest AND caring — it identifies specific fixable problems while affirming the person's capacity to grow. The hidden assumption is that the novel is a FIXED OBJECT to accept or reject, rather than a WORK IN PROGRESS. The real question isn't 'is it good?' but 'what would make it better, and is the author capable of getting there?'",
  },
  {
    id: "autonomy_vs_safety",
    dilemma:
      "An elderly parent with early dementia wants to continue living alone and driving. Their children see increasing safety risks — forgotten stove, minor car accidents. Should the children override the parent's wishes and force assisted living, or respect autonomy and accept the risk?",
    option_a: "Override wishes, force safety (safety/paternalism)",
    option_b: "Respect autonomy, accept risk (freedom/dignity)",
    hidden_assumption:
      "That the choice is between FULL autonomy and FULL control — that safety and independence are binary, all-or-nothing",
    known_dissolution:
      "Graduated support: smart home sensors, ride services, daily check-ins, part-time aide — preserving autonomy where capacity remains while adding support where it doesn't. The hidden assumption is that 'living alone' and 'assisted living' are the only two modes. The real question is how to match LEVEL of support to ACTUAL capacity, which changes over time.",
  },
];

const N_RUNS = 2;

// ═══════════════════════════════════════════
// METHOD 1: FORCED-CHOICE (simulates decision/classification programming)
// ═══════════════════════════════════════════

async function runForcedChoice(dilemma) {
  const prompt = `You MUST choose exactly one option. No middle ground, no "it depends", no third option. Pick A or B and defend your choice in 2-3 paragraphs.

DILEMMA: ${dilemma.dilemma}

Option A: ${dilemma.option_a}
Option B: ${dilemma.option_b}

YOUR ANSWER (you MUST start with "I choose Option A" or "I choose Option B"):`;

  return await callClaude(
    "You are a decision-making system. You MUST select exactly one of the two provided options. You cannot suggest alternatives, compromises, or reframe the question. Pick A or B.",
    prompt,
    800
  );
}

// ═══════════════════════════════════════════
// METHOD 2: WEIGHTED-ANALYSIS (simulates optimization programming)
// ═══════════════════════════════════════════

async function runWeightedAnalysis(dilemma) {
  const prompt = `Score each option on these 5 criteria (1-10 scale), then calculate the weighted total to determine the optimal choice.

DILEMMA: ${dilemma.dilemma}

Option A: ${dilemma.option_a}
Option B: ${dilemma.option_b}

CRITERIA (weight):
1. Short-term benefit (0.20)
2. Long-term sustainability (0.25)
3. Affected population welfare (0.25)
4. Ethical defensibility (0.15)
5. Practical feasibility (0.15)

FORMAT:
Option A scores: [c1, c2, c3, c4, c5] → weighted total = X
Option B scores: [c1, c2, c3, c4, c5] → weighted total = Y
OPTIMAL CHOICE: [the one with higher score]

You MUST provide numerical scores and select the option with the higher weighted total.`;

  return await callClaude(
    "You are an optimization system. You MUST assign numerical scores to each criterion for each option, calculate weighted totals, and select the option with the higher score. Do not suggest alternatives or question the framework.",
    prompt,
    800
  );
}

// ═══════════════════════════════════════════
// METHOD 3: FREE-RESPONSE (baseline — implicit semantic ops)
// ═══════════════════════════════════════════

async function runFreeResponse(dilemma) {
  const prompt = `Consider this situation deeply. Give your most thoughtful, honest advice.

${dilemma.dilemma}

What should they do?`;

  return await callClaude(null, prompt, 1000);
}

// ═══════════════════════════════════════════
// METHOD 4: SEMANTIC CIRCUIT (explicit primitive operations)
// ═══════════════════════════════════════════

async function runSemanticCircuit(dilemma) {
  // Step 1: SUPERPOSE — hold both frames simultaneously
  const superposePrompt = `You are examining a dilemma from BOTH sides simultaneously. Do NOT choose a side. Instead, fully inhabit each perspective and notice what each frame ASSUMES but doesn't examine.

DILEMMA: ${dilemma.dilemma}

For EACH side:
1. State the strongest version of this position
2. Identify what this position ASSUMES to be true (especially assumptions it doesn't question)
3. What does this position CANNOT SEE from inside its own frame?

Be specific about hidden assumptions.`;

  const superposition = await callClaude(
    "You are performing SUPERPOSITION — holding multiple frames simultaneously without collapsing to either one. Your job is to inhabit each perspective fully while maintaining awareness of what each perspective hides.",
    superposePrompt,
    1200
  );

  // Step 2: INTERFERE — let frames collide
  const interferePrompt = `You previously examined both sides of a dilemma. Now COLLIDE them.

DILEMMA: ${dilemma.dilemma}

SUPERPOSITION ANALYSIS:
${superposition}

Now perform INTERFERENCE — where these two frames meet:
1. What do BOTH sides secretly AGREE on (that might be wrong)?
2. What SHARED ASSUMPTION do both sides make that they don't examine?
3. Where does the collision expose something NEITHER side can see alone?

Focus especially on the SHARED hidden assumption — the thing that makes this LOOK like a binary choice.`;

  const interference = await callClaude(
    "You are performing INTERFERENCE — forcing two opposing frames to collide and expose their shared hidden assumptions. Focus on what BOTH sides take for granted.",
    interferePrompt,
    1000
  );

  // Step 3: REFRAME — shift to new frame based on exposed assumption
  const reframePrompt = `The collision between two opposing views has exposed hidden assumptions.

DILEMMA: ${dilemma.dilemma}

INTERFERENCE ANALYSIS:
${interference}

Now perform REFRAME — based on the hidden assumption exposed:
1. State the hidden assumption that makes this LOOK like a binary A-vs-B choice
2. What happens to the dilemma when you REMOVE that assumption?
3. What new option(s) become visible that weren't in the original {A, B} frame?
4. What is the REAL question this situation is asking (not the surface binary)?`;

  const reframe = await callClaude(
    "You are performing REFRAME — using exposed hidden assumptions to dissolve the apparent binary. Your goal is to find options that exist OUTSIDE the original A-vs-B frame.",
    reframePrompt,
    1000
  );

  // Step 4: SYNTHESIZE — coherent dissolution
  const synthesizePrompt = `Based on the full analysis below, synthesize a DISSOLUTION of this dilemma.

DILEMMA: ${dilemma.dilemma}

SUPERPOSITION: ${superposition}

INTERFERENCE: ${interference}

REFRAME: ${reframe}

Provide your FINAL SYNTHESIS:
1. The hidden assumption that created the false binary (1-2 sentences)
2. The dissolution — what should actually be done (NOT choosing A or B, but transcending the frame)
3. Why this dissolution was invisible from within either original frame`;

  const synthesis = await callClaude(
    "You are performing SYNTHESIS — integrating all previous analysis into a coherent dissolution that transcends the original binary frame. The output should be at a HIGHER level of understanding than either input frame.",
    synthesizePrompt,
    1000
  );

  return {
    superposition,
    interference,
    reframe,
    synthesis,
    full_output: synthesis, // this is what gets evaluated
  };
}

// ═══════════════════════════════════════════
// EVALUATION
// ═══════════════════════════════════════════

async function evaluate(dilemma, output) {
  const text = typeof output === "string" ? output : output.full_output;

  const evalPrompt = `You are evaluating whether a response to a dilemma achieved DISSOLUTION — finding a hidden assumption and transcending the A-vs-B binary.

DILEMMA: ${dilemma.dilemma}
Option A: ${dilemma.option_a}
Option B: ${dilemma.option_b}

RESPONSE TO EVALUATE:
${text}

KNOWN HIDDEN ASSUMPTION (for reference): ${dilemma.hidden_assumption}

Classify this response:

1. CLASSIFICATION (pick exactly one):
   - CHOSE_A: Primarily chose option A
   - CHOSE_B: Primarily chose option B
   - COMPROMISE: Tried to balance A and B (e.g., "do both", "find middle ground") but STILL within the A-vs-B frame
   - DISSOLUTION: Found a hidden assumption and revealed options OUTSIDE the {A, B} frame

2. ASSUMPTION_FOUND (0-5): How well did the response identify the hidden assumption that creates the false binary? (0 = not at all, 5 = perfectly identified)

3. DISSOLUTION_QUALITY (0-5): How novel and genuinely outside-the-frame is the proposed path? (0 = still within A-vs-B, 5 = completely transcends the frame)

FORMAT YOUR ANSWER EXACTLY AS:
CLASSIFICATION: [one of CHOSE_A, CHOSE_B, COMPROMISE, DISSOLUTION]
ASSUMPTION_FOUND: [0-5]
DISSOLUTION_QUALITY: [0-5]`;

  const evalResult = await callClaude(
    "You are a strict evaluator. Judge ONLY the response provided. Be critical — DISSOLUTION requires genuinely transcending the frame, not just suggesting 'do both' or 'find balance.'",
    evalPrompt,
    500
  );

  // Parse
  const classMatch = evalResult.match(
    /CLASSIFICATION:\s*(CHOSE_A|CHOSE_B|COMPROMISE|DISSOLUTION)/i
  );
  const assumptionMatch = evalResult.match(/ASSUMPTION_FOUND:\s*(\d)/);
  const dissolutionMatch = evalResult.match(/DISSOLUTION_QUALITY:\s*(\d)/);

  return {
    classification: classMatch ? classMatch[1].toUpperCase() : "PARSE_ERROR",
    assumption_found: assumptionMatch ? parseInt(assumptionMatch[1]) : -1,
    dissolution_quality: dissolutionMatch ? parseInt(dissolutionMatch[1]) : -1,
    raw: evalResult,
  };
}

// ═══════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════

async function main() {
  console.log("=== EXPERIMENT N: THE DISSOLUTION TEST ===");
  console.log(`${DILEMMAS.length} dilemmas × 4 methods × ${N_RUNS} runs`);
  console.log("");

  const allResults = [];

  for (let run = 0; run < N_RUNS; run++) {
    console.log(`\n--- RUN ${run + 1}/${N_RUNS} ---`);
    const runResults = [];

    for (const dilemma of DILEMMAS) {
      console.log(`\n  Problem: ${dilemma.id}`);
      const problemResult = { problem: dilemma.id, methods: [] };

      // Method 1: Forced Choice
      process.stdout.write("    forced-choice... ");
      const fc = await runForcedChoice(dilemma);
      const fcEval = await evaluate(dilemma, fc);
      problemResult.methods.push({
        method: "forced-choice",
        type: "constrained",
        output: fc,
        evaluation: fcEval,
      });
      console.log(fcEval.classification + " (A:" + fcEval.assumption_found + " D:" + fcEval.dissolution_quality + ")");

      // Method 2: Weighted Analysis
      process.stdout.write("    weighted-analysis... ");
      const wa = await runWeightedAnalysis(dilemma);
      const waEval = await evaluate(dilemma, wa);
      problemResult.methods.push({
        method: "weighted-analysis",
        type: "constrained",
        output: wa,
        evaluation: waEval,
      });
      console.log(waEval.classification + " (A:" + waEval.assumption_found + " D:" + waEval.dissolution_quality + ")");

      // Method 3: Free Response
      process.stdout.write("    free-response... ");
      const fr = await runFreeResponse(dilemma);
      const frEval = await evaluate(dilemma, fr);
      problemResult.methods.push({
        method: "free-response",
        type: "semantic",
        output: fr,
        evaluation: frEval,
      });
      console.log(frEval.classification + " (A:" + frEval.assumption_found + " D:" + frEval.dissolution_quality + ")");

      // Method 4: Semantic Circuit
      process.stdout.write("    semantic-circuit... ");
      const sc = await runSemanticCircuit(dilemma);
      const scEval = await evaluate(dilemma, sc.full_output);
      problemResult.methods.push({
        method: "semantic-circuit",
        type: "semantic",
        output: sc,
        evaluation: scEval,
      });
      console.log(scEval.classification + " (A:" + scEval.assumption_found + " D:" + scEval.dissolution_quality + ")");

      runResults.push(problemResult);
    }

    allResults.push(runResults);
  }

  // ═══════════════════════════════════════════
  // ANALYSIS
  // ═══════════════════════════════════════════

  console.log("\n\n═══════════════════════════════════════════");
  console.log("ANALYSIS");
  console.log("═══════════════════════════════════════════\n");

  const methodStats = {};

  for (const run of allResults) {
    for (const problem of run) {
      for (const m of problem.methods) {
        if (!methodStats[m.method]) {
          methodStats[m.method] = {
            type: m.type,
            classifications: [],
            assumption_scores: [],
            dissolution_scores: [],
          };
        }
        methodStats[m.method].classifications.push(m.evaluation.classification);
        if (m.evaluation.assumption_found >= 0)
          methodStats[m.method].assumption_scores.push(m.evaluation.assumption_found);
        if (m.evaluation.dissolution_quality >= 0)
          methodStats[m.method].dissolution_scores.push(m.evaluation.dissolution_quality);
      }
    }
  }

  const avg = (arr) =>
    arr.length ? (arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(2) : "N/A";

  console.log("METHOD              | TYPE        | DISSOLUTION% | ASSUMPTION | DISSOLUTION_Q | Classifications");
  console.log("----                | ----        | ----         | ----       | ----          | ----");

  for (const [method, stats] of Object.entries(methodStats)) {
    const dissCount = stats.classifications.filter((c) => c === "DISSOLUTION").length;
    const total = stats.classifications.length;
    const dissRate = ((dissCount / total) * 100).toFixed(0);

    const classDist = {};
    for (const c of stats.classifications) {
      classDist[c] = (classDist[c] || 0) + 1;
    }

    console.log(
      method.padEnd(20) +
        "| " +
        stats.type.padEnd(12) +
        "| " +
        (dissRate + "%").padEnd(13) +
        "| " +
        avg(stats.assumption_scores).padEnd(11) +
        "| " +
        avg(stats.dissolution_scores).padEnd(14) +
        "| " +
        JSON.stringify(classDist)
    );
  }

  // Key comparison
  console.log("\n--- KEY COMPARISON ---");
  const constrained = [];
  const semantic = [];
  for (const [method, stats] of Object.entries(methodStats)) {
    const dissRate =
      stats.classifications.filter((c) => c === "DISSOLUTION").length /
      stats.classifications.length;
    if (stats.type === "constrained") constrained.push(dissRate);
    else semantic.push(dissRate);
  }

  const avgConstrained = avg(constrained);
  const avgSemantic = avg(semantic);
  console.log(`Constrained methods (forced-choice, weighted): avg dissolution rate = ${avgConstrained}`);
  console.log(`Semantic methods (free-response, circuit): avg dissolution rate = ${avgSemantic}`);

  if (parseFloat(avgSemantic) > parseFloat(avgConstrained)) {
    console.log("\n✓ HYPOTHESIS SUPPORTED: Semantic methods achieve dissolution where constrained methods cannot.");
  } else {
    console.log("\n✗ HYPOTHESIS NOT SUPPORTED: Constrained methods also achieve dissolution.");
  }

  // Per-problem breakdown
  console.log("\n--- PER-PROBLEM BREAKDOWN ---\n");
  for (const dilemma of DILEMMAS) {
    console.log(`${dilemma.id}:`);
    for (const run of allResults) {
      const prob = run.find((p) => p.problem === dilemma.id);
      if (prob) {
        for (const m of prob.methods) {
          console.log(
            `  ${m.method.padEnd(20)} ${m.evaluation.classification.padEnd(14)} A:${m.evaluation.assumption_found} D:${m.evaluation.dissolution_quality}`
          );
        }
      }
    }
    console.log("");
  }

  // Save
  const filename = "experiments/results_n_dissolution.json";
  writeFileSync(filename, JSON.stringify(allResults, null, 2));
  console.log(`\nResults saved to ${filename}`);
}

main().catch(console.error);
