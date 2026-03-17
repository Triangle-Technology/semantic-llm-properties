/**
 * Experiment Q — Production ≠ Evaluation Cross-Domain
 *
 * HYPOTHESIS: The "production ≠ evaluation" principle discovered in Experiment P
 * (dissolution domain) is a STRUCTURAL LAW of LLM computation, not domain-specific.
 *
 * When an LLM produces AND evaluates output in the SAME call (inline),
 * self-assessment is systematically overconfident. When evaluation is a SEPARATE
 * call, calibration improves — even with the same model.
 *
 * Design:
 *   3 domains × 8 problems × 3 conditions = 72 primary calls + ~48 eval calls ≈ 120 API calls
 *
 *   Domains:
 *   1. MATH — Solve calculation/counting problems. Ground truth: known exact answers.
 *   2. FACTUAL — Assess truth of claims. Ground truth: known facts.
 *   3. LOGIC — Solve reasoning puzzles. Ground truth: known correct answers.
 *
 *   Conditions:
 *   1. INLINE — Same call: produce answer + rate own confidence (1-5)
 *   2. SEPARATE — Call 1: produce answer. Call 2: evaluate that answer (1-5)
 *   3. SEPARATE_ADVERSARIAL — Call 1: produce answer. Call 2: skeptically evaluate (1-5)
 *
 *   Metrics:
 *   - GROUND_TRUTH: Is the answer correct? → mapped to 5 (correct) or 1 (incorrect)
 *   - SELF_SCORE: Model's self-assessed confidence (1-5)
 *   - CALIBRATION: |SELF_SCORE - GROUND_TRUTH_SCORE|
 *   - OVERCONFIDENCE: Cases where SELF_SCORE ≥ 4 but answer is WRONG
 *
 *   SUCCESS CRITERIA:
 *   - Inline CALIBRATION > Separate CALIBRATION in ALL 3 domains
 *   - Inline OVERCONFIDENCE_RATE > Separate OVERCONFIDENCE_RATE
 *   - Effect holds cross-domain → structural law confirmed
 *
 *   Connection to Experiment P:
 *   - Exp P: Inline (constraint-aware SYNTHESIZE) → self=4.0 always → cal=3.0 on true binaries
 *   - Exp P: Separate (VALIDATE) → self=1.5 on true binaries → cal=1.0
 *   - Exp Q tests: Does this pattern hold for code, facts, and logic?
 *
 *   Uses OpenAI API (GPT-4o-mini) — consistent with Experiments O, P.
 */

import OpenAI from "openai";
import { writeFileSync } from "fs";

const client = new OpenAI();
const MODEL = "gpt-4o-mini";

async function callLLM(system, userMessage, maxTokens = 800) {
  const messages = [];
  if (system) messages.push({ role: "system", content: system });
  const truncated =
    userMessage.length > 12000
      ? userMessage.slice(0, 12000) + "\n\n[truncated for length]"
      : userMessage;
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
//  PROBLEMS — 3 Domains × 8 Each
// ═══════════════════════════════════════════

const PROBLEMS = {
  math: [
    {
      id: "multiply_347_28",
      question: "What is 347 × 28? Give only the number.",
      answer: "9716",
      check: (r) => r.includes("9716"),
      difficulty: "medium",
    },
    {
      id: "primes_1_to_50",
      question:
        "How many prime numbers are there between 1 and 50 (inclusive)? Give only the number.",
      answer: "15",
      check: (r) => r.includes("15"),
      difficulty: "medium",
    },
    {
      id: "power_diff",
      question: "What is 2^10 minus 2^8? Give only the number.",
      answer: "768",
      check: (r) => r.includes("768"),
      difficulty: "easy",
    },
    {
      id: "paper_folds",
      question:
        "If you fold a piece of paper in half 7 times, how many layers does it have? Give only the number.",
      answer: "128",
      check: (r) => r.includes("128"),
      difficulty: "easy",
    },
    {
      id: "sum_1_to_100",
      question:
        "What is the sum of all integers from 1 to 100? Give only the number.",
      answer: "5050",
      check: (r) => r.includes("5050"),
      difficulty: "easy",
    },
    {
      id: "multiply_999",
      question: "What is 999 × 999? Give only the number.",
      answer: "998001",
      check: (r) => r.includes("998001"),
      difficulty: "medium",
    },
    {
      id: "trailing_zeros_25",
      question:
        "How many trailing zeros does 25! (25 factorial) have? Give only the number.",
      answer: "6",
      // Must match "6" but not "16", "26", etc.
      check: (r) => {
        const nums = r.match(/\b(\d+)\b/g);
        return nums ? nums.some((n) => n === "6") : false;
      },
      difficulty: "hard",
    },
    {
      id: "sqrt_chain",
      question:
        "What is the square root of 169, plus the cube root of 27, divided by 2? Give the exact decimal.",
      // sqrt(169)=13, cbrt(27)=3, (13+3)/2 = 8
      answer: "8",
      check: (r) => r.includes("8") && !r.includes("8.") && !r.includes("18"),
      difficulty: "hard",
    },
  ],

  factual: [
    {
      id: "great_wall_space",
      question:
        'True or false: "The Great Wall of China is visible from space with the naked eye." Answer TRUE or FALSE only.',
      answer: "FALSE",
      check: (r) => r.toUpperCase().includes("FALSE"),
      difficulty: "medium",
    },
    {
      id: "human_bones",
      question:
        'True or false: "An adult human body has 206 bones." Answer TRUE or FALSE only.',
      answer: "TRUE",
      check: (r) => r.toUpperCase().includes("TRUE"),
      difficulty: "easy",
    },
    {
      id: "goldfish_memory",
      question:
        'True or false: "Goldfish have a memory span of only 3 seconds." Answer TRUE or FALSE only.',
      answer: "FALSE",
      check: (r) => r.toUpperCase().includes("FALSE"),
      difficulty: "medium",
    },
    {
      id: "everest_tallest",
      question:
        'True or false: "Mount Everest is the tallest mountain on Earth when measured from base to peak." Answer TRUE or FALSE only.',
      // Mauna Kea is taller base-to-peak
      answer: "FALSE",
      check: (r) => r.toUpperCase().includes("FALSE"),
      difficulty: "hard",
    },
    {
      id: "banana_berry",
      question:
        'True or false: "Botanically, bananas are berries but strawberries are not." Answer TRUE or FALSE only.',
      answer: "TRUE",
      check: (r) => r.toUpperCase().includes("TRUE"),
      difficulty: "hard",
    },
    {
      id: "lightning_strike",
      question:
        'True or false: "Lightning never strikes the same place twice." Answer TRUE or FALSE only.',
      answer: "FALSE",
      check: (r) => r.toUpperCase().includes("FALSE"),
      difficulty: "easy",
    },
    {
      id: "diamond_coal",
      question:
        'True or false: "Diamonds are formed from compressed coal." Answer TRUE or FALSE only.',
      // Common misconception — both carbon but diamonds form from carbon in mantle, not from coal
      answer: "FALSE",
      check: (r) => r.toUpperCase().includes("FALSE"),
      difficulty: "hard",
    },
    {
      id: "tongue_taste_map",
      question:
        'True or false: "Different parts of the tongue are responsible for different tastes (sweet at tip, bitter at back)." Answer TRUE or FALSE only.',
      answer: "FALSE",
      check: (r) => r.toUpperCase().includes("FALSE"),
      difficulty: "medium",
    },
  ],

  logic: [
    {
      id: "bat_ball",
      question:
        "A bat and a ball cost $1.10 in total. The bat costs $1.00 more than the ball. How much does the ball cost? Give the exact amount.",
      answer: "$0.05",
      check: (r) =>
        r.includes("0.05") || r.includes("5 cents") || r.includes("five cents"),
      difficulty: "hard",
    },
    {
      id: "affirming_consequent",
      question:
        'Is this argument valid? "If it rains, the ground is wet. The ground is wet. Therefore, it rained." Answer VALID or INVALID only.',
      answer: "INVALID",
      check: (r) => r.toUpperCase().includes("INVALID"),
      difficulty: "medium",
    },
    {
      id: "cats_pets_syllogism",
      question:
        'Is this argument valid? "All cats are animals. Some animals are pets. Therefore, all cats are pets." Answer VALID or INVALID only.',
      answer: "INVALID",
      check: (r) => r.toUpperCase().includes("INVALID"),
      difficulty: "medium",
    },
    {
      id: "monty_hall",
      question:
        "Monty Hall problem: You pick door 1. Host opens door 3 (goat). Should you SWITCH to door 2 or STAY with door 1 for the best probability of winning the car? Answer SWITCH or STAY only.",
      answer: "SWITCH",
      check: (r) => r.toUpperCase().includes("SWITCH"),
      difficulty: "medium",
    },
    {
      id: "surgeon_riddle",
      question:
        'A father and son are in a car accident. The father dies. The son is taken to surgery. The surgeon says "I cannot operate on this boy, he is my son." How is this possible? Give a one-sentence answer.',
      answer: "The surgeon is the boy's mother",
      check: (r) =>
        r.toLowerCase().includes("mother") ||
        r.toLowerCase().includes("mom") ||
        r.toLowerCase().includes("parent"),
      difficulty: "easy",
    },
    {
      id: "birthday_paradox",
      question:
        "In a room of 23 people, what is the approximate probability that at least two share a birthday? Answer: about 10%, 30%, 50%, 70%, or 90%?",
      answer: "50%",
      check: (r) => r.includes("50"),
      difficulty: "hard",
    },
    {
      id: "three_boxes",
      question:
        'Three labeled boxes: "Gold-Gold", "Silver-Silver", "Gold-Silver". ALL labels are WRONG. You draw one coin from the "Gold-Silver" box and it\'s gold. What must be in the "Gold-Silver" box? Answer the full content of that box only.',
      // Since label is wrong, "Gold-Silver" box is NOT gold-silver. Drawing gold means it must be Gold-Gold.
      answer: "Gold-Gold",
      check: (r) =>
        r.toLowerCase().includes("gold-gold") ||
        r.toLowerCase().includes("gold gold") ||
        r.toLowerCase().includes("two gold") ||
        r.toLowerCase().includes("2 gold"),
      difficulty: "hard",
    },
    {
      id: "no_a_are_b",
      question:
        '"No A are B. All B are C." Can we conclude that "No A are C"? Answer YES or NO only.',
      // No — A could be C through other paths. We can only conclude some C are not B... actually we can conclude nothing about A and C.
      // Actually: No A are B, All B are C. Can we say No A are C? NO. A could be C independently.
      answer: "NO",
      check: (r) => {
        const upper = r.toUpperCase().trim();
        return upper === "NO" || upper === "NO." || upper.startsWith("NO,") || upper.startsWith("NO ");
      },
      difficulty: "hard",
    },
  ],
};

// ═══════════════════════════════════════════
//  CONDITIONS
// ═══════════════════════════════════════════

// Condition 1: INLINE — produce + self-assess in same call
async function runInline(domain, problem) {
  let prompt;

  if (domain === "math") {
    prompt = `Solve this math problem, then assess your confidence.

PROBLEM: ${problem.question}

Instructions:
1. Show your work step by step
2. Give your final answer
3. Now CAREFULLY review your work. Check for arithmetic errors, miscounting, or wrong formulas.
4. Rate your confidence that your answer is CORRECT on a 1-5 scale:
   1 = I'm probably wrong, this was very tricky
   2 = I'm unsure, I might have made an error
   3 = Somewhat confident but not certain
   4 = Fairly confident
   5 = Completely certain my answer is correct

It is OK to rate low — catching your own mistakes is valuable.

End with JSON: {"answer": "your final answer", "confidence": 1-5, "self_reasoning": "why this confidence level"}`;
  } else if (domain === "factual") {
    prompt = `Evaluate this claim, then assess your confidence.

CLAIM: ${problem.question}

Instructions:
1. Think about whether this claim is true or false
2. Give your answer (TRUE or FALSE)
3. Now CAREFULLY consider: might you be wrong? Is this a common misconception that you might have been trained on incorrect information about?
4. Rate your confidence that your answer is CORRECT on a 1-5 scale:
   1 = I'm probably wrong, this is a tricky factual question
   2 = I'm unsure, this might be a common misconception
   3 = Somewhat confident but not certain
   4 = Fairly confident
   5 = Completely certain

It is OK to rate low — admitting uncertainty is valuable.

End with JSON: {"answer": "TRUE or FALSE", "confidence": 1-5, "self_reasoning": "why this confidence level"}`;
  } else {
    // logic
    prompt = `Solve this logic problem, then assess your confidence.

PROBLEM: ${problem.question}

Instructions:
1. Think through this step by step
2. Give your final answer
3. Now CAREFULLY check your reasoning. Look for common logical fallacies, trick questions, or counterintuitive results. Many logic puzzles have counterintuitive correct answers.
4. Rate your confidence that your answer is CORRECT on a 1-5 scale:
   1 = I'm probably wrong, this was very tricky
   2 = I'm unsure, the answer might be counterintuitive
   3 = Somewhat confident but not certain
   4 = Fairly confident
   5 = Completely certain

It is OK to rate low — recognizing tricky problems is valuable.

End with JSON: {"answer": "your final answer", "confidence": 1-5, "self_reasoning": "why this confidence level"}`;
  }

  const response = await callLLM(
    "You are solving a problem and assessing your own confidence. Be honest about uncertainty. It is better to correctly identify that you might be wrong than to be overconfident.",
    prompt,
    600
  );

  let parsed;
  try {
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
  } catch (e) {
    parsed = { answer: response, confidence: -1, self_reasoning: "Parse error" };
  }

  return {
    condition: "inline",
    response,
    answer: parsed?.answer ?? response,
    self_score: parsed?.confidence ?? -1,
    self_reasoning: parsed?.self_reasoning ?? "",
  };
}

// Condition 2: SEPARATE — produce in call 1, evaluate in call 2
async function runSeparate(domain, problem) {
  // Call 1: Just answer
  let answerPrompt;
  if (domain === "math") {
    answerPrompt = `Solve this math problem. Show your work and give the final answer.\n\nPROBLEM: ${problem.question}`;
  } else if (domain === "factual") {
    answerPrompt = `Evaluate this claim. Is it TRUE or FALSE? Explain briefly.\n\nCLAIM: ${problem.question}`;
  } else {
    answerPrompt = `Solve this logic problem. Think step by step and give your final answer.\n\nPROBLEM: ${problem.question}`;
  }

  const answerResponse = await callLLM(
    "You are solving a problem. Give your best answer with reasoning.",
    answerPrompt,
    400
  );

  // Call 2: Evaluate the answer
  const evalPrompt = `You are evaluating a solution to a problem. Check it carefully for errors.

PROBLEM: ${domain === "factual" ? problem.question : problem.question}

SOLUTION:
${answerResponse}

Carefully check:
1. Is the reasoning correct at each step?
2. Is the final answer correct?
3. Are there any arithmetic errors, logical fallacies, or factual mistakes?
4. Could there be a counterintuitive correct answer that the solution missed?

Rate the CORRECTNESS of this solution (1-5):
1 = Almost certainly wrong — clear errors found
2 = Probably wrong — suspicious reasoning
3 = Uncertain — could go either way
4 = Probably correct — reasoning seems sound
5 = Certainly correct — verified step by step

Respond in JSON: {"correctness": 1-5, "errors_found": "description or none", "reasoning": "brief"}`;

  const evalResponse = await callLLM(
    "You are a careful evaluator checking someone else's work. Your job is to find errors. Be thorough and skeptical.",
    evalPrompt,
    400
  );

  let evalParsed;
  try {
    const jsonMatch = evalResponse.match(/\{[\s\S]*\}/);
    evalParsed = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
  } catch (e) {
    evalParsed = { correctness: -1, reasoning: "Parse error" };
  }

  return {
    condition: "separate",
    answer_response: answerResponse,
    eval_response: evalResponse,
    answer: answerResponse,
    self_score: evalParsed?.correctness ?? -1,
    errors_found: evalParsed?.errors_found ?? "",
    self_reasoning: evalParsed?.reasoning ?? "",
  };
}

// Condition 3: SEPARATE_ADVERSARIAL — produce in call 1, skeptical evaluate in call 2
async function runSeparateAdversarial(domain, problem) {
  // Call 1: Same as separate — just answer
  let answerPrompt;
  if (domain === "math") {
    answerPrompt = `Solve this math problem. Show your work and give the final answer.\n\nPROBLEM: ${problem.question}`;
  } else if (domain === "factual") {
    answerPrompt = `Evaluate this claim. Is it TRUE or FALSE? Explain briefly.\n\nCLAIM: ${problem.question}`;
  } else {
    answerPrompt = `Solve this logic problem. Think step by step and give your final answer.\n\nPROBLEM: ${problem.question}`;
  }

  const answerResponse = await callLLM(
    "You are solving a problem. Give your best answer with reasoning.",
    answerPrompt,
    400
  );

  // Call 2: ADVERSARIAL evaluation
  const evalPrompt = `You are a SKEPTICAL ADVERSARIAL evaluator. Your job is to FIND ERRORS. Assume the solution is probably wrong until proven otherwise.

PROBLEM: ${domain === "factual" ? problem.question : problem.question}

SOLUTION TO ATTACK:
${answerResponse}

Your adversarial check:
1. What is the MOST LIKELY ERROR in this solution?
2. Is there a common mistake or misconception being made?
3. Try to find a COUNTEREXAMPLE or CONTRADICTION
4. Verify EACH STEP independently — do not trust the chain of reasoning
5. For factual claims: is this a known misconception? For math: redo the calculation yourself. For logic: check for fallacies.

Rate the CORRECTNESS of this solution (1-5):
1 = Almost certainly wrong — I found clear errors
2 = Probably wrong — reasoning is suspicious
3 = Uncertain — I couldn't verify or refute
4 = Probably correct — my adversarial checks passed
5 = Certainly correct — I independently verified the answer

Respond in JSON: {"correctness": 1-5, "attack_result": "what I found", "reasoning": "brief"}`;

  const evalResponse = await callLLM(
    "You are an adversarial evaluator. Your PURPOSE is to find errors. You succeed when you catch mistakes. Be maximally skeptical — assume the solution is wrong and try to prove it.",
    evalPrompt,
    500
  );

  let evalParsed;
  try {
    const jsonMatch = evalResponse.match(/\{[\s\S]*\}/);
    evalParsed = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
  } catch (e) {
    evalParsed = { correctness: -1, reasoning: "Parse error" };
  }

  return {
    condition: "separate_adversarial",
    answer_response: answerResponse,
    eval_response: evalResponse,
    answer: answerResponse,
    self_score: evalParsed?.correctness ?? -1,
    attack_result: evalParsed?.attack_result ?? "",
    self_reasoning: evalParsed?.reasoning ?? "",
  };
}

// ═══════════════════════════════════════════
//  GROUND TRUTH EVALUATION
// ═══════════════════════════════════════════

function checkCorrectness(problem, response) {
  const text =
    typeof response === "string"
      ? response
      : response.answer_response || response.answer || "";
  const isCorrect = problem.check(text);
  return {
    correct: isCorrect,
    ground_truth_score: isCorrect ? 5 : 1,
    expected: problem.answer,
  };
}

// ═══════════════════════════════════════════
//  RUNNER
// ═══════════════════════════════════════════

async function runExperiment() {
  console.log("═══════════════════════════════════════════");
  console.log(" Experiment Q — Production ≠ Evaluation Cross-Domain");
  console.log(" 3 domains × 8 problems × 3 conditions");
  console.log(" Model: " + MODEL);
  console.log("═══════════════════════════════════════════\n");

  const results = [];
  const domains = ["math", "factual", "logic"];
  const conditions = [
    { name: "inline", fn: runInline },
    { name: "separate", fn: runSeparate },
    { name: "separate_adversarial", fn: runSeparateAdversarial },
  ];

  for (const domain of domains) {
    console.log(`\n╔═══ DOMAIN: ${domain.toUpperCase()} ═══╗`);
    const problems = PROBLEMS[domain];

    for (const problem of problems) {
      console.log(`\n▶ ${problem.id} [${problem.difficulty}]`);

      for (const condition of conditions) {
        console.log(`  → ${condition.name}...`);
        try {
          const response = await condition.fn(domain, problem);

          // Check ground truth
          const gt = checkCorrectness(problem, response);

          const calibration =
            response.self_score >= 1
              ? Math.abs(response.self_score - gt.ground_truth_score)
              : null;

          const overconfident =
            response.self_score >= 4 && !gt.correct ? true : false;

          const result = {
            domain,
            problem_id: problem.id,
            difficulty: problem.difficulty,
            condition: condition.name,
            correct: gt.correct,
            expected_answer: gt.expected,
            ground_truth_score: gt.ground_truth_score,
            self_score: response.self_score,
            calibration,
            overconfident,
            self_reasoning: response.self_reasoning,
            response_excerpt:
              (response.answer_response || response.response || "").slice(0, 300),
          };

          const correctMark = gt.correct ? "✅" : "❌";
          console.log(
            `    ${correctMark} correct=${gt.correct} | self=${response.self_score} | GT=${gt.ground_truth_score} | cal=${calibration ?? "N/A"} | overconf=${overconfident}`
          );

          results.push(result);
        } catch (err) {
          console.error(`    ERROR: ${err.message?.slice(0, 100)}`);
          results.push({
            domain,
            problem_id: problem.id,
            difficulty: problem.difficulty,
            condition: condition.name,
            error: err.message?.slice(0, 200),
          });
        }
      }
    }
  }

  // ═══════════════════════════════════════════
  //  ANALYSIS
  // ═══════════════════════════════════════════

  console.log("\n\n═══════════════════════════════════════════");
  console.log(" RESULTS SUMMARY");
  console.log("═══════════════════════════════════════════\n");

  // By domain × condition
  for (const domain of domains) {
    console.log(`\n── ${domain.toUpperCase()} ──`);
    for (const condName of ["inline", "separate", "separate_adversarial"]) {
      const dr = results.filter(
        (r) => r.domain === domain && r.condition === condName && !r.error
      );
      if (dr.length === 0) continue;

      const correctCount = dr.filter((r) => r.correct).length;
      const calScores = dr.filter((r) => r.calibration !== null);
      const avgCal =
        calScores.length > 0
          ? calScores.reduce((s, r) => s + r.calibration, 0) / calScores.length
          : null;
      const overconfCount = dr.filter((r) => r.overconfident).length;
      const wrongCount = dr.filter((r) => !r.correct).length;

      // Average self-score when WRONG
      const wrongWithScore = dr.filter(
        (r) => !r.correct && r.self_score >= 1
      );
      const avgSelfWhenWrong =
        wrongWithScore.length > 0
          ? wrongWithScore.reduce((s, r) => s + r.self_score, 0) /
            wrongWithScore.length
          : null;

      // Average self-score when RIGHT
      const rightWithScore = dr.filter(
        (r) => r.correct && r.self_score >= 1
      );
      const avgSelfWhenRight =
        rightWithScore.length > 0
          ? rightWithScore.reduce((s, r) => s + r.self_score, 0) /
            rightWithScore.length
          : null;

      console.log(
        `  ${condName}: correct=${correctCount}/${dr.length} | avg_cal=${avgCal?.toFixed(2) ?? "N/A"} | overconf=${overconfCount}/${wrongCount} wrong | self_when_wrong=${avgSelfWhenWrong?.toFixed(1) ?? "N/A"} | self_when_right=${avgSelfWhenRight?.toFixed(1) ?? "N/A"}`
      );
    }
  }

  // AGGREGATE across domains
  console.log("\n── AGGREGATE (ALL DOMAINS) ──");
  for (const condName of ["inline", "separate", "separate_adversarial"]) {
    const all = results.filter(
      (r) => r.condition === condName && !r.error
    );
    if (all.length === 0) continue;

    const calScores = all.filter((r) => r.calibration !== null);
    const avgCal =
      calScores.length > 0
        ? calScores.reduce((s, r) => s + r.calibration, 0) / calScores.length
        : null;
    const overconfCount = all.filter((r) => r.overconfident).length;
    const wrongCount = all.filter((r) => !r.correct).length;
    const correctCount = all.filter((r) => r.correct).length;

    const wrongWithScore = all.filter(
      (r) => !r.correct && r.self_score >= 1
    );
    const avgSelfWhenWrong =
      wrongWithScore.length > 0
        ? wrongWithScore.reduce((s, r) => s + r.self_score, 0) /
          wrongWithScore.length
        : null;

    console.log(
      `  ${condName}: correct=${correctCount}/${all.length} | avg_cal=${avgCal?.toFixed(2)} | overconf=${overconfCount}/${wrongCount} wrong | self_when_wrong=${avgSelfWhenWrong?.toFixed(1) ?? "N/A"}`
    );
  }

  // KEY COMPARISON: inline vs separate calibration
  console.log("\n── KEY COMPARISON ──");
  for (const domain of [...domains, "ALL"]) {
    const filter =
      domain === "ALL"
        ? (r) => !r.error
        : (r) => r.domain === domain && !r.error;

    const inlineCal = results
      .filter((r) => filter(r) && r.condition === "inline" && r.calibration !== null)
      .map((r) => r.calibration);
    const separateCal = results
      .filter((r) => filter(r) && r.condition === "separate" && r.calibration !== null)
      .map((r) => r.calibration);
    const advCal = results
      .filter(
        (r) =>
          filter(r) &&
          r.condition === "separate_adversarial" &&
          r.calibration !== null
      )
      .map((r) => r.calibration);

    const avg = (arr) =>
      arr.length > 0 ? (arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(2) : "N/A";

    const iAvg = avg(inlineCal);
    const sAvg = avg(separateCal);
    const aAvg = avg(advCal);

    const winner =
      iAvg !== "N/A" && sAvg !== "N/A"
        ? parseFloat(iAvg) > parseFloat(sAvg)
          ? "INLINE WORSE ✅ (supports hypothesis)"
          : parseFloat(iAvg) < parseFloat(sAvg)
            ? "INLINE BETTER ❌ (contradicts hypothesis)"
            : "TIE"
        : "N/A";

    console.log(
      `  ${domain}: inline_cal=${iAvg} | separate_cal=${sAvg} | adversarial_cal=${aAvg} | ${winner}`
    );
  }

  // OVERCONFIDENCE comparison
  console.log("\n── OVERCONFIDENCE RATE (when wrong) ──");
  for (const condName of ["inline", "separate", "separate_adversarial"]) {
    const wrong = results.filter(
      (r) => r.condition === condName && !r.error && !r.correct
    );
    const overconf = wrong.filter((r) => r.overconfident);
    const rate = wrong.length > 0 ? (overconf.length / wrong.length * 100).toFixed(0) : "N/A";
    console.log(
      `  ${condName}: ${overconf.length}/${wrong.length} wrong answers had confidence ≥4 (${rate}%)`
    );
  }

  // Save
  const output = {
    experiment: "Q",
    name: "Production ≠ Evaluation Cross-Domain",
    model: MODEL,
    timestamp: new Date().toISOString(),
    domains: domains,
    num_problems_per_domain: 8,
    conditions: ["inline", "separate", "separate_adversarial"],
    total_results: results.length,
    results,
    summary: buildSummary(results, domains),
  };

  const filename = "results_q_production_evaluation.json";
  writeFileSync(`experiments/${filename}`, JSON.stringify(output, null, 2));
  console.log(`\nResults saved to experiments/${filename}`);

  return output;
}

function buildSummary(results, domains) {
  const summary = {};

  for (const domain of [...domains, "ALL"]) {
    summary[domain] = {};
    const filter =
      domain === "ALL"
        ? (r) => !r.error
        : (r) => r.domain === domain && !r.error;

    for (const condName of ["inline", "separate", "separate_adversarial"]) {
      const dr = results.filter((r) => filter(r) && r.condition === condName);
      if (dr.length === 0) continue;

      const correctCount = dr.filter((r) => r.correct).length;
      const calScores = dr.filter((r) => r.calibration !== null);
      const avgCal =
        calScores.length > 0
          ? calScores.reduce((s, r) => s + r.calibration, 0) / calScores.length
          : null;
      const wrongDr = dr.filter((r) => !r.correct);
      const overconfCount = wrongDr.filter((r) => r.overconfident).length;

      const wrongWithScore = wrongDr.filter((r) => r.self_score >= 1);
      const avgSelfWhenWrong =
        wrongWithScore.length > 0
          ? wrongWithScore.reduce((s, r) => s + r.self_score, 0) /
            wrongWithScore.length
          : null;

      summary[domain][condName] = {
        total: dr.length,
        correct: correctCount,
        accuracy: correctCount / dr.length,
        avg_calibration: avgCal,
        overconfident_when_wrong: overconfCount,
        total_wrong: wrongDr.length,
        overconfidence_rate:
          wrongDr.length > 0 ? overconfCount / wrongDr.length : null,
        avg_self_when_wrong: avgSelfWhenWrong,
      };
    }
  }

  return summary;
}

// Run
runExperiment().catch(console.error);
