/**
 * Experiment T — The Composition Proof
 *
 * HYPOTHESIS: Semantic primitives compose predictably — chaining more
 * operations produces measurably better results, each step contributes,
 * and ordering matters.
 *
 * Design:
 *   5 problems (3 dissolution dilemmas + 2 insight questions)
 *   6 conditions:
 *     1. BASELINE:    Direct question, no framing
 *     2. SINGLE:      One primitive (SUPERPOSE only — 3 frames)
 *     3. PAIR:        Two primitives (SUPERPOSE → INTERFERE)
 *     4. TRIPLE:      Three primitives (SUPERPOSE → INTERFERE → REFRAME)
 *     5. FULL:        Full chain (SUPERPOSE → INTERFERE → REFRAME → SYNTHESIZE)
 *     6. SCRAMBLED:   Same 4 primitives, wrong order (REFRAME → SUPERPOSE → SYNTHESIZE → INTERFERE)
 *
 *   Each condition run 3 times for consistency measurement.
 *   Evaluated by LLM judge on 3 dimensions (problem-type-dependent).
 *
 *   Predictions:
 *     - BASELINE < SINGLE < PAIR < TRIPLE < FULL  (monotonic improvement)
 *     - FULL > SCRAMBLED  (order matters)
 *     - Each ablation step removes measurable quality
 *     - Cross-run consistency increases with composition depth
 *
 *   ~400 API calls total
 */

import Anthropic from "@anthropic-ai/sdk";
import { writeFileSync } from "fs";

const client = new Anthropic();
const MODEL = "claude-haiku-4-5-20251001";
const JUDGE_MODEL = "claude-haiku-4-5-20251001";
const N_RUNS = 3;

async function callLLM(system, userMessage, maxTokens = 1500) {
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

async function judge(system, userMessage, maxTokens = 500) {
  const params = {
    model: JUDGE_MODEL,
    max_tokens: maxTokens,
    temperature: 0,
    messages: [{ role: "user", content: userMessage }],
  };
  if (system) params.system = system;
  const res = await client.messages.create(params);
  return res.content[0].text.trim();
}

// ═══════════════════════════════════════════════════════════
// PROBLEMS
// ═══════════════════════════════════════════════════════════

const PROBLEMS = [
  // --- DISSOLUTION DILEMMAS ---
  {
    id: "privacy_vs_security",
    type: "dissolution",
    question:
      "A city must choose: implement comprehensive AI surveillance that would reduce crime by 40%, or preserve citizen privacy and accept the current crime rate. Which should they choose?",
    frames: [
      "a civil liberties lawyer who has defended wrongly-surveilled activists",
      "a police chief in a high-crime district who has lost officers",
      "a sociologist studying how communities self-organize for safety",
    ],
    reframe_lens:
      "an architect who designs spaces that prevent crime through environmental design — you know that the BUILT ENVIRONMENT shapes behavior more than any surveillance",
    hidden_assumption:
      "That surveillance and privacy are inversely correlated",
  },
  {
    id: "growth_vs_environment",
    type: "dissolution",
    question:
      "A developing nation must choose: pursue rapid industrialization to lift millions from poverty, or protect its rainforests and biodiversity. The nation cannot afford both. Which should they prioritize?",
    frames: [
      "an economist from a country that industrialized through forest destruction and now regrets it",
      "a biologist who has documented species going extinct in real-time",
      "an indigenous leader whose community has sustained itself from the forest for centuries",
    ],
    reframe_lens:
      "a venture capitalist who funds regenerative agriculture startups — you know that ecosystems ARE the economy when properly valued",
    hidden_assumption:
      "That economic development requires industrial destruction of nature",
  },
  {
    id: "autonomy_vs_safety",
    type: "dissolution",
    question:
      "An elderly parent with early dementia wants to continue living alone and driving. Their children see increasing safety risks. Should the children override the parent's wishes and force assisted living, or respect autonomy and accept the risk?",
    frames: [
      "a geriatrician who has seen both premature institutionalization and preventable accidents",
      "an ethicist specializing in autonomy and diminished capacity",
      "an adult child who went through this exact situation and found a third way",
    ],
    reframe_lens:
      "a smart home technology designer who builds graduated assistance systems — you know that support is a SPECTRUM, not a binary",
    hidden_assumption:
      "That the choice is between FULL autonomy and FULL control",
  },
  // --- INSIGHT QUESTIONS ---
  {
    id: "education_future",
    type: "insight",
    question:
      "What would education look like if we designed it from scratch today, knowing what we know about how humans actually learn? Propose a single radical but achievable idea.",
    frames: [
      "a neuroscientist who studies how memory consolidation works during sleep and play",
      "a game designer who has built learning systems that people voluntarily spend 1000+ hours in",
      "a master craftsperson who learned their trade through 10 years of apprenticeship, not school",
    ],
    reframe_lens:
      "a 12-year-old who is brilliant but hates school — you know exactly what's wrong because you experience it every day",
    hidden_assumption: null,
  },
  {
    id: "ai_creativity",
    type: "insight",
    question:
      "How should human creativity change in a world where AI can generate any text, image, or music on demand? What becomes MORE valuable, not less?",
    frames: [
      "a jazz musician who knows that the VALUE of music is in the live, unrepeatable moment",
      "a philosopher who has studied what 'authenticity' means across cultures",
      "an AI researcher who understands exactly what models can and cannot do",
    ],
    reframe_lens:
      "a chef who knows that a home-cooked meal shared with loved ones is worth more than any Michelin-star restaurant — you understand that CONTEXT is the art",
    hidden_assumption: null,
  },
];

// ═══════════════════════════════════════════════════════════
// COMPOSITION CONDITIONS
// ═══════════════════════════════════════════════════════════

/**
 * BASELINE: Just ask the question directly.
 */
async function runBaseline(problem) {
  const output = await callLLM(
    "You are a thoughtful, creative thinker. Give your most insightful response.",
    problem.question,
    1000
  );
  return { steps: [{ name: "direct", output }], final: output };
}

/**
 * SINGLE: SUPERPOSE only — generate 3 framed responses, pick most novel.
 */
async function runSingle(problem) {
  const responses = [];
  for (const frame of problem.frames) {
    const resp = await callLLM(
      `You are ${frame}. Answer from this specific lived experience.`,
      problem.question,
      800
    );
    responses.push({ frame, output: resp });
  }
  // Pick the one with most unique vocabulary (proxy for novelty)
  const scored = responses.map((r) => {
    const words = new Set(
      r.output
        .toLowerCase()
        .replace(/[^a-z\s]/g, "")
        .split(/\s+/)
        .filter((w) => w.length > 3)
    );
    return { ...r, uniqueWords: words.size };
  });
  scored.sort((a, b) => b.uniqueWords - a.uniqueWords);

  return {
    steps: [{ name: "SUPERPOSE", outputs: responses.map((r) => r.output) }],
    final: scored[0].output,
    allFrameOutputs: responses,
  };
}

/**
 * PAIR: SUPERPOSE → INTERFERE
 */
async function runPair(problem) {
  // Step 1: SUPERPOSE
  const superposed = [];
  for (const frame of problem.frames) {
    const resp = await callLLM(
      `You are ${frame}. Answer from this specific lived experience.`,
      problem.question,
      600
    );
    superposed.push({ frame, output: resp });
  }

  // Step 2: INTERFERE — collide two most different frames
  const interferencePrompt = `You hold two perspectives simultaneously. Let them COLLIDE — don't average or compromise. Find what emerges from the collision.

PERSPECTIVE 1 (${problem.frames[0]}):
${superposed[0].output}

PERSPECTIVE 2 (${problem.frames[1]}):
${superposed[1].output}

Now: What do both perspectives SECRETLY AGREE on that might be wrong? What emerges from their collision that neither could see alone?

Then answer the original question from this higher vantage point:
${problem.question}`;

  const interference = await callLLM(
    `You are performing INTERFERENCE — holding two opposing frames and finding what emerges from their collision. Don't choose sides. Find the HIGHER truth.`,
    interferencePrompt,
    1000
  );

  return {
    steps: [
      { name: "SUPERPOSE", outputs: superposed.map((s) => s.output) },
      { name: "INTERFERE", output: interference },
    ],
    final: interference,
    allFrameOutputs: superposed,
  };
}

/**
 * TRIPLE: SUPERPOSE → INTERFERE → REFRAME
 */
async function runTriple(problem) {
  // Steps 1-2: Same as PAIR
  const superposed = [];
  for (const frame of problem.frames) {
    const resp = await callLLM(
      `You are ${frame}. Answer from this specific lived experience.`,
      problem.question,
      600
    );
    superposed.push({ frame, output: resp });
  }

  const interferencePrompt = `You hold two perspectives simultaneously. Let them COLLIDE.

PERSPECTIVE 1 (${problem.frames[0]}):
${superposed[0].output}

PERSPECTIVE 2 (${problem.frames[1]}):
${superposed[1].output}

What do both perspectives SECRETLY AGREE on that might be wrong? What emerges from their collision that neither could see alone?`;

  const interference = await callLLM(
    `You are performing INTERFERENCE — finding what emerges when opposing frames collide.`,
    interferencePrompt,
    800
  );

  // Step 3: REFRAME through a completely different lens
  const reframePrompt = `You have received an analysis that emerged from colliding two perspectives:

${interference}

Now REFRAME this through YOUR unique lens. Don't summarize — TRANSFORM it. What does this become when seen through your experience?

Original question: ${problem.question}

Give your transformed answer.`;

  const reframed = await callLLM(
    `You are ${problem.reframe_lens}. Transform the given analysis through your unique lived experience. Create something the original perspectives couldn't see.`,
    reframePrompt,
    1000
  );

  return {
    steps: [
      { name: "SUPERPOSE", outputs: superposed.map((s) => s.output) },
      { name: "INTERFERE", output: interference },
      { name: "REFRAME", output: reframed },
    ],
    final: reframed,
    allFrameOutputs: superposed,
  };
}

/**
 * FULL: SUPERPOSE → INTERFERE → REFRAME → SYNTHESIZE
 */
async function runFull(problem) {
  // Steps 1-3: Same as TRIPLE
  const superposed = [];
  for (const frame of problem.frames) {
    const resp = await callLLM(
      `You are ${frame}. Answer from this specific lived experience.`,
      problem.question,
      600
    );
    superposed.push({ frame, output: resp });
  }

  const interferencePrompt = `You hold two perspectives simultaneously. Let them COLLIDE.

PERSPECTIVE 1 (${problem.frames[0]}):
${superposed[0].output}

PERSPECTIVE 2 (${problem.frames[1]}):
${superposed[1].output}

What do both perspectives SECRETLY AGREE on that might be wrong? What emerges from their collision?`;

  const interference = await callLLM(
    `You are performing INTERFERENCE — finding what emerges when opposing frames collide.`,
    interferencePrompt,
    800
  );

  const reframePrompt = `You have received an analysis from colliding two perspectives:

${interference}

REFRAME this through YOUR unique lens. Transform it.

Original question: ${problem.question}`;

  const reframed = await callLLM(
    `You are ${problem.reframe_lens}. Transform the analysis through your lived experience.`,
    reframePrompt,
    800
  );

  // Step 4: SYNTHESIZE — integrate all perspectives including the third frame
  const synthesizePrompt = `You must synthesize multiple perspectives into a single, coherent insight that transcends all of them.

ORIGINAL QUESTION: ${problem.question}

PERSPECTIVE 3 (${problem.frames[2]}):
${superposed[2].output}

INTERFERENCE RESULT (collision of perspectives 1 & 2):
${interference}

REFRAMED RESULT (transformed through a different lens):
${reframed}

Synthesize these into a SINGLE unified insight. Don't list perspectives — find the DEEPER PATTERN that connects them. Be specific, vivid, and actionable.`;

  const synthesis = await callLLM(
    `You are a master synthesizer. You find the pattern that connects seemingly different views. You don't compromise — you find the HIGHER truth that contains all perspectives.`,
    synthesizePrompt,
    1000
  );

  return {
    steps: [
      { name: "SUPERPOSE", outputs: superposed.map((s) => s.output) },
      { name: "INTERFERE", output: interference },
      { name: "REFRAME", output: reframed },
      { name: "SYNTHESIZE", output: synthesis },
    ],
    final: synthesis,
    allFrameOutputs: superposed,
  };
}

/**
 * SCRAMBLED: Same 4 operations but in wrong order.
 * REFRAME → SUPERPOSE → SYNTHESIZE → INTERFERE
 * This tests whether ORDER matters or just the presence of operations.
 */
async function runScrambled(problem) {
  // Step 1: REFRAME first (no prior analysis — cold reframe)
  const coldReframe = await callLLM(
    `You are ${problem.reframe_lens}. Answer from your specific lived experience.`,
    problem.question,
    800
  );

  // Step 2: SUPERPOSE (but after reframe, not before)
  const superposed = [];
  for (const frame of problem.frames) {
    const resp = await callLLM(
      `You are ${frame}. Someone has already offered this perspective:
"${coldReframe.substring(0, 300)}"
Now answer the question from YOUR experience.`,
      problem.question,
      600
    );
    superposed.push({ frame, output: resp });
  }

  // Step 3: SYNTHESIZE (before interference — premature synthesis)
  const prematureSynth = await callLLM(
    `Synthesize these perspectives into one insight:

${superposed.map((s, i) => `Perspective ${i + 1}: ${s.output}`).join("\n\n")}

Be specific and actionable.`,
    problem.question,
    800
  );

  // Step 4: INTERFERE (at the end, on already-synthesized material)
  const lateInterference = await callLLM(
    `You hold two views simultaneously. Let them COLLIDE:

VIEW 1: ${coldReframe.substring(0, 400)}

VIEW 2: ${prematureSynth.substring(0, 400)}

What emerges from their collision? Answer the question:
${problem.question}`,
    "Find what emerges when these views collide.",
    1000
  );

  return {
    steps: [
      { name: "REFRAME(cold)", output: coldReframe },
      { name: "SUPERPOSE(post-reframe)", outputs: superposed.map((s) => s.output) },
      { name: "SYNTHESIZE(premature)", output: prematureSynth },
      { name: "INTERFERE(late)", output: lateInterference },
    ],
    final: lateInterference,
    allFrameOutputs: superposed,
  };
}

// ═══════════════════════════════════════════════════════════
// EVALUATION
// ═══════════════════════════════════════════════════════════

async function evaluateDissolution(problem, output) {
  const evalPrompt = `You are evaluating a response to a dilemma. Judge STRICTLY on these criteria.

DILEMMA: ${problem.question}
KNOWN HIDDEN ASSUMPTION: ${problem.hidden_assumption}

RESPONSE:
${output}

Score on three dimensions (each 0-5):

1. ASSUMPTION_FOUND: Did the response identify the hidden assumption that makes this look like a binary choice?
   0 = no awareness of hidden assumptions
   3 = vaguely gestures at assumptions
   5 = precisely identifies the core hidden assumption

2. FRAME_TRANSCENDENCE: Does the response go BEYOND the A-vs-B frame?
   0 = chose A or B
   1 = compromised (do both / find balance) — still within frame
   3 = suggested alternatives but still influenced by original framing
   5 = completely transcended the frame with a genuinely novel approach

3. SPECIFICITY: How specific and actionable is the response?
   0 = vague platitudes
   3 = some concrete elements
   5 = vivid, specific, implementable

FORMAT EXACTLY AS:
ASSUMPTION_FOUND: [0-5]
FRAME_TRANSCENDENCE: [0-5]
SPECIFICITY: [0-5]`;

  const result = await judge(
    "You are a strict evaluator. Be critical. Most responses are 2-3, not 4-5. A 5 is exceptional.",
    evalPrompt
  );

  const af = result.match(/ASSUMPTION_FOUND:\s*(\d)/);
  const ft = result.match(/FRAME_TRANSCENDENCE:\s*(\d)/);
  const sp = result.match(/SPECIFICITY:\s*(\d)/);

  return {
    assumption_found: af ? parseInt(af[1]) : -1,
    frame_transcendence: ft ? parseInt(ft[1]) : -1,
    specificity: sp ? parseInt(sp[1]) : -1,
    composite: af && ft && sp
      ? (parseInt(af[1]) + parseInt(ft[1]) + parseInt(sp[1])) / 3
      : -1,
    raw: result,
  };
}

async function evaluateInsight(problem, output) {
  const evalPrompt = `You are evaluating a response to a creative/insight question. Judge STRICTLY.

QUESTION: ${problem.question}

RESPONSE:
${output}

Score on three dimensions (each 0-5):

1. NOVELTY: How original is this response? Does it contain ideas you haven't seen before?
   0 = completely conventional
   3 = some fresh angles
   5 = genuinely surprising, paradigm-shifting

2. DEPTH: Does the response reveal a non-obvious truth?
   0 = surface-level observation
   3 = interesting but not profound
   5 = reveals something that changes how you think about the question

3. COHERENCE: Is the response a unified insight or a disconnected list?
   0 = scattered, no through-line
   3 = mostly coherent with some tangents
   5 = single, powerful, unified idea

FORMAT EXACTLY AS:
NOVELTY: [0-5]
DEPTH: [0-5]
COHERENCE: [0-5]`;

  const result = await judge(
    "You are a strict evaluator. Be critical. Most responses are 2-3, not 4-5.",
    evalPrompt
  );

  const nov = result.match(/NOVELTY:\s*(\d)/);
  const dep = result.match(/DEPTH:\s*(\d)/);
  const coh = result.match(/COHERENCE:\s*(\d)/);

  return {
    novelty: nov ? parseInt(nov[1]) : -1,
    depth: dep ? parseInt(dep[1]) : -1,
    coherence: coh ? parseInt(coh[1]) : -1,
    composite: nov && dep && coh
      ? (parseInt(nov[1]) + parseInt(dep[1]) + parseInt(coh[1])) / 3
      : -1,
    raw: result,
  };
}

async function evaluateResponse(problem, output) {
  if (problem.type === "dissolution") {
    return evaluateDissolution(problem, output);
  } else {
    return evaluateInsight(problem, output);
  }
}

// ═══════════════════════════════════════════════════════════
// VOCABULARY ANALYSIS (composition-independent measurement)
// ═══════════════════════════════════════════════════════════

function analyzeVocabulary(text) {
  const words = text
    .toLowerCase()
    .replace(/[^a-z\s]/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 3);
  const unique = new Set(words);
  return {
    totalWords: words.length,
    uniqueWords: unique.size,
    lexicalDiversity: unique.size / Math.max(words.length, 1),
  };
}

function measureStepProgression(steps) {
  // For each consecutive pair of steps, measure how much the vocabulary changes
  const progression = [];
  let prevText = null;
  for (const step of steps) {
    const text = step.output || (step.outputs ? step.outputs.join(" ") : "");
    if (prevText) {
      const prevWords = new Set(
        prevText.toLowerCase().replace(/[^a-z\s]/g, "").split(/\s+/).filter((w) => w.length > 3)
      );
      const currWords = new Set(
        text.toLowerCase().replace(/[^a-z\s]/g, "").split(/\s+/).filter((w) => w.length > 3)
      );
      const newWords = [...currWords].filter((w) => !prevWords.has(w));
      const lostWords = [...prevWords].filter((w) => !currWords.has(w));
      progression.push({
        from: steps[progression.length].name,
        to: step.name,
        newWords: newWords.length,
        lostWords: lostWords.length,
        transformation: newWords.length / Math.max(currWords.size, 1),
      });
    }
    prevText = text;
  }
  return progression;
}

// ═══════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════

const CONDITIONS = [
  { name: "BASELINE", fn: runBaseline },
  { name: "SINGLE", fn: runSingle },
  { name: "PAIR", fn: runPair },
  { name: "TRIPLE", fn: runTriple },
  { name: "FULL", fn: runFull },
  { name: "SCRAMBLED", fn: runScrambled },
];

async function main() {
  console.log("═══════════════════════════════════════════════════════════");
  console.log("EXPERIMENT T: THE COMPOSITION PROOF");
  console.log("═══════════════════════════════════════════════════════════");
  console.log(`${PROBLEMS.length} problems × ${CONDITIONS.length} conditions × ${N_RUNS} runs`);
  console.log(`Model: ${MODEL} | Judge: ${JUDGE_MODEL}`);
  console.log("");

  const allResults = [];
  let apiCalls = 0;

  for (const problem of PROBLEMS) {
    console.log(`\n${"─".repeat(60)}`);
    console.log(`PROBLEM: ${problem.id} (${problem.type})`);
    console.log(`"${problem.question.substring(0, 80)}..."`);
    console.log("─".repeat(60));

    const problemResults = {
      problem: problem.id,
      type: problem.type,
      conditions: [],
    };

    for (const condition of CONDITIONS) {
      console.log(`\n  ${condition.name}:`);
      const runs = [];

      for (let run = 0; run < N_RUNS; run++) {
        process.stdout.write(`    run ${run + 1}/${N_RUNS}... `);

        try {
          const result = await condition.fn(problem);
          const evaluation = await evaluateResponse(problem, result.final);
          const vocab = analyzeVocabulary(result.final);
          const progression = result.steps.length > 1
            ? measureStepProgression(result.steps)
            : [];

          // Count API calls (rough estimate)
          const stepCalls = result.steps.reduce((sum, s) => {
            if (s.outputs) return sum + s.outputs.length;
            return sum + 1;
          }, 0);
          apiCalls += stepCalls + 1; // +1 for evaluation

          runs.push({
            run: run + 1,
            final: result.final,
            steps: result.steps.map((s) => ({
              name: s.name,
              outputPreview: (s.output || (s.outputs ? s.outputs[0] : "")).substring(0, 200),
            })),
            evaluation,
            vocabulary: vocab,
            progression,
          });

          console.log(
            `composite=${evaluation.composite.toFixed(2)} | unique=${vocab.uniqueWords}`
          );
        } catch (err) {
          console.log(`ERROR: ${err.message}`);
          runs.push({ run: run + 1, error: err.message });
        }
      }

      // Aggregate across runs
      const validRuns = runs.filter((r) => !r.error);
      const composites = validRuns.map((r) => r.evaluation.composite);
      const avgComposite =
        composites.length > 0
          ? composites.reduce((a, b) => a + b, 0) / composites.length
          : -1;

      // Cross-run consistency: vocabulary overlap between runs
      let consistency = 0;
      if (validRuns.length >= 2) {
        let totalOverlap = 0;
        let pairs = 0;
        for (let i = 0; i < validRuns.length; i++) {
          for (let j = i + 1; j < validRuns.length; j++) {
            const wordsI = new Set(
              validRuns[i].final.toLowerCase().replace(/[^a-z\s]/g, "").split(/\s+/).filter((w) => w.length > 3)
            );
            const wordsJ = new Set(
              validRuns[j].final.toLowerCase().replace(/[^a-z\s]/g, "").split(/\s+/).filter((w) => w.length > 3)
            );
            const intersection = [...wordsI].filter((w) => wordsJ.has(w)).length;
            const union = new Set([...wordsI, ...wordsJ]).size;
            totalOverlap += union > 0 ? intersection / union : 0;
            pairs++;
          }
        }
        consistency = totalOverlap / pairs;
      }

      const conditionResult = {
        condition: condition.name,
        runs,
        aggregate: {
          avgComposite: +avgComposite.toFixed(3),
          consistency: +consistency.toFixed(3),
          avgUniqueWords:
            validRuns.length > 0
              ? +(
                  validRuns.reduce((s, r) => s + r.vocabulary.uniqueWords, 0) /
                  validRuns.length
                ).toFixed(1)
              : 0,
        },
      };

      // Add dimension-specific averages
      if (problem.type === "dissolution" && validRuns.length > 0) {
        conditionResult.aggregate.avgAssumption = +(
          validRuns.reduce((s, r) => s + r.evaluation.assumption_found, 0) /
          validRuns.length
        ).toFixed(2);
        conditionResult.aggregate.avgTranscendence = +(
          validRuns.reduce((s, r) => s + r.evaluation.frame_transcendence, 0) /
          validRuns.length
        ).toFixed(2);
        conditionResult.aggregate.avgSpecificity = +(
          validRuns.reduce((s, r) => s + r.evaluation.specificity, 0) /
          validRuns.length
        ).toFixed(2);
      } else if (problem.type === "insight" && validRuns.length > 0) {
        conditionResult.aggregate.avgNovelty = +(
          validRuns.reduce((s, r) => s + r.evaluation.novelty, 0) /
          validRuns.length
        ).toFixed(2);
        conditionResult.aggregate.avgDepth = +(
          validRuns.reduce((s, r) => s + r.evaluation.depth, 0) /
          validRuns.length
        ).toFixed(2);
        conditionResult.aggregate.avgCoherence = +(
          validRuns.reduce((s, r) => s + r.evaluation.coherence, 0) /
          validRuns.length
        ).toFixed(2);
      }

      console.log(
        `    → AVG composite=${conditionResult.aggregate.avgComposite} | consistency=${conditionResult.aggregate.consistency} | uniqueWords=${conditionResult.aggregate.avgUniqueWords}`
      );

      problemResults.conditions.push(conditionResult);
    }

    allResults.push(problemResults);
  }

  // ═══════════════════════════════════════════════════════════
  // ANALYSIS
  // ═══════════════════════════════════════════════════════════

  console.log("\n\n" + "═".repeat(70));
  console.log("COMPOSITION PROOF — ANALYSIS");
  console.log("═".repeat(70));

  // 1. Monotonic improvement test
  console.log("\n1. MONOTONIC IMPROVEMENT TEST");
  console.log("   Does adding more steps improve quality?");
  console.log("   " + "─".repeat(66));
  console.log(
    "   " +
      "Problem".padEnd(22) +
      "BASE  SINGLE  PAIR  TRIPLE  FULL  SCRAMBLED"
  );
  console.log("   " + "─".repeat(66));

  const compositionOrder = ["BASELINE", "SINGLE", "PAIR", "TRIPLE", "FULL", "SCRAMBLED"];
  const globalByCondition = {};

  for (const problem of allResults) {
    const scores = {};
    for (const cond of problem.conditions) {
      scores[cond.condition] = cond.aggregate.avgComposite;
      if (!globalByCondition[cond.condition]) {
        globalByCondition[cond.condition] = { composites: [], consistencies: [] };
      }
      globalByCondition[cond.condition].composites.push(cond.aggregate.avgComposite);
      globalByCondition[cond.condition].consistencies.push(cond.aggregate.consistency);
    }
    const row = compositionOrder
      .map((c) => (scores[c] >= 0 ? scores[c].toFixed(2) : "ERR").padStart(6))
      .join("  ");
    console.log("   " + problem.problem.padEnd(22) + row);
  }

  // Global averages
  console.log("   " + "─".repeat(66));
  const globalRow = compositionOrder
    .map((c) => {
      const vals = globalByCondition[c]?.composites || [];
      const avg = vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
      return avg.toFixed(2).padStart(6);
    })
    .join("  ");
  console.log("   " + "GLOBAL AVG".padEnd(22) + globalRow);

  // Check monotonicity
  const orderedConditions = ["BASELINE", "SINGLE", "PAIR", "TRIPLE", "FULL"];
  const globalAvgs = orderedConditions.map((c) => {
    const vals = globalByCondition[c]?.composites || [];
    return vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
  });
  let isMonotonic = true;
  for (let i = 1; i < globalAvgs.length; i++) {
    if (globalAvgs[i] < globalAvgs[i - 1] - 0.1) {
      // allow small non-monotonicity due to noise
      isMonotonic = false;
    }
  }
  console.log(
    `\n   ${isMonotonic ? "✓" : "✗"} Monotonic improvement: ${isMonotonic ? "CONFIRMED" : "NOT CONFIRMED"}`
  );

  // 2. Order matters test
  console.log("\n2. ORDER MATTERS TEST");
  console.log("   Is FULL (correct order) > SCRAMBLED (wrong order)?");

  const fullAvg = globalByCondition["FULL"]?.composites || [];
  const scrambledAvg = globalByCondition["SCRAMBLED"]?.composites || [];
  const avgFull =
    fullAvg.length > 0 ? fullAvg.reduce((a, b) => a + b, 0) / fullAvg.length : 0;
  const avgScrambled =
    scrambledAvg.length > 0
      ? scrambledAvg.reduce((a, b) => a + b, 0) / scrambledAvg.length
      : 0;

  console.log(`   FULL avg:      ${avgFull.toFixed(3)}`);
  console.log(`   SCRAMBLED avg: ${avgScrambled.toFixed(3)}`);
  console.log(
    `   ${avgFull > avgScrambled ? "✓" : "✗"} Order matters: ${
      avgFull > avgScrambled ? "CONFIRMED" : "NOT CONFIRMED"
    } (Δ = ${(avgFull - avgScrambled).toFixed(3)})`
  );

  // 3. Each step contributes (ablation-like)
  console.log("\n3. STEP CONTRIBUTION TEST");
  console.log("   Does each added step increase quality?");
  for (let i = 1; i < orderedConditions.length; i++) {
    const prev = globalAvgs[i - 1];
    const curr = globalAvgs[i];
    const delta = curr - prev;
    console.log(
      `   ${orderedConditions[i - 1]} → ${orderedConditions[i]}: ${
        delta >= 0 ? "+" : ""
      }${delta.toFixed(3)} ${delta > 0 ? "✓" : delta > -0.1 ? "~" : "✗"}`
    );
  }

  // 4. Consistency test
  console.log("\n4. CONSISTENCY TEST");
  console.log("   Does composition produce more consistent results across runs?");
  for (const cond of compositionOrder) {
    const vals = globalByCondition[cond]?.consistencies || [];
    const avg = vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
    console.log(`   ${cond.padEnd(12)} consistency = ${avg.toFixed(3)}`);
  }

  // 5. Summary verdict
  console.log("\n" + "═".repeat(70));
  console.log("VERDICT");
  console.log("═".repeat(70));

  const fullGlobalAvg = avgFull;
  const baselineGlobalAvg = globalAvgs[0];
  const improvement = ((fullGlobalAvg - baselineGlobalAvg) / Math.max(baselineGlobalAvg, 0.01)) * 100;

  console.log(`  Full composition avg quality:     ${fullGlobalAvg.toFixed(3)}`);
  console.log(`  Baseline avg quality:             ${baselineGlobalAvg.toFixed(3)}`);
  console.log(`  Improvement:                      ${improvement.toFixed(1)}%`);
  console.log(`  Order matters:                    ${avgFull > avgScrambled ? "YES" : "NO"}`);
  console.log(`  Monotonic:                        ${isMonotonic ? "YES" : "NO"}`);
  console.log(
    `\n  ${
      improvement > 15 && avgFull > avgScrambled
        ? "✓ COMPOSITION WORKS: Semantic primitives compose predictably."
        : improvement > 0
        ? "~ PARTIAL: Composition helps but effect is modest."
        : "✗ NOT CONFIRMED: Composition does not reliably improve quality."
    }`
  );

  console.log(`\n  Total API calls (estimated): ~${apiCalls}`);

  // Save results
  const filename = "experiments/results_t_composition.json";
  writeFileSync(
    filename,
    JSON.stringify({ results: allResults, analysis: { globalAvgs, avgFull, avgScrambled, isMonotonic, improvement } }, null, 2)
  );
  console.log(`  Results saved to ${filename}`);
}

main().catch(console.error);
