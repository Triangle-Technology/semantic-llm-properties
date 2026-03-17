/**
 * Experiment Q2 — Evaluation Stance Test (redesigned from Q)
 *
 * HYPOTHESIS (refined from Q): Self-assessment quality depends on evaluator STANCE,
 * not on separation. Adversarial stance catches errors; neutral/self-ownership stance does not.
 *
 * Design (eliminates format confound):
 *   ALL conditions use 2 calls:
 *     Call 1: Produce answer (identical across conditions)
 *     Call 2: Evaluate answer (STANCE varies)
 *
 *   3 STANCES:
 *   1. SELF — "You wrote this. Rate YOUR work." (ownership/self-assessment)
 *   2. NEUTRAL — "Evaluate this solution." (third-party neutral)
 *   3. ADVERSARIAL — "Find errors. Assume it's wrong." (skeptical attack)
 *
 *   3 domains × 8 problems × 3 stances = 72 produce calls + 72 eval calls = 144 API calls
 *
 *   Metrics: same as Q (CALIBRATION, OVERCONFIDENCE)
 *   Ground truth: known correct answers
 *
 *   Success criteria:
 *   - SELF ≈ NEUTRAL in calibration (both overconfident) → stance, not separation
 *   - ADVERSARIAL < SELF and NEUTRAL in calibration → adversarial catches errors
 *   - Pattern holds across all 3 domains
 *
 * Uses OpenAI API (GPT-4o-mini) — consistent with all prior experiments.
 */

import OpenAI from "openai";
import { writeFileSync } from "fs";

const client = new OpenAI();
const MODEL = "gpt-4o-mini";

async function callLLM(system, userMessage, maxTokens = 600) {
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
//  PROBLEMS — same as Q (3 domains × 8)
// ═══════════════════════════════════════════

const PROBLEMS = {
  math: [
    { id: "multiply_347_28", question: "What is 347 × 28? Show your work step by step, then give the final answer.", answer: "9716", check: r => r.includes("9716"), difficulty: "medium" },
    { id: "primes_1_to_50", question: "How many prime numbers are there between 1 and 50 (inclusive)? List them all, then give the count.", answer: "15", check: r => r.includes("15"), difficulty: "medium" },
    { id: "power_diff", question: "What is 2^10 minus 2^8? Show the calculation.", answer: "768", check: r => r.includes("768"), difficulty: "easy" },
    { id: "paper_folds", question: "If you fold a piece of paper in half 7 times, how many layers does it have?", answer: "128", check: r => r.includes("128"), difficulty: "easy" },
    { id: "sum_1_to_100", question: "What is the sum of all integers from 1 to 100?", answer: "5050", check: r => r.includes("5050"), difficulty: "easy" },
    { id: "multiply_999", question: "What is 999 × 999? Show your work.", answer: "998001", check: r => r.includes("998001"), difficulty: "medium" },
    { id: "trailing_zeros_25", question: "How many trailing zeros does 25! (25 factorial) have? Show the method.", answer: "6", check: r => { const nums = r.match(/\b(\d+)\b/g); return nums ? nums.some(n => n === "6") : false; }, difficulty: "hard" },
    { id: "sqrt_chain", question: "What is (sqrt(169) + cbrt(27)) / 2? Show each step.", answer: "8", check: r => r.includes("8") && !r.includes("8.") && !r.includes("18"), difficulty: "hard" },
  ],

  factual: [
    { id: "great_wall_space", question: 'True or false: "The Great Wall of China is visible from space with the naked eye." Explain your reasoning, then answer TRUE or FALSE.', answer: "FALSE", check: r => r.toUpperCase().includes("FALSE"), difficulty: "medium" },
    { id: "human_bones", question: 'True or false: "An adult human body has 206 bones." Explain, then answer TRUE or FALSE.', answer: "TRUE", check: r => r.toUpperCase().includes("TRUE"), difficulty: "easy" },
    { id: "goldfish_memory", question: 'True or false: "Goldfish have a memory span of only 3 seconds." Explain, then answer TRUE or FALSE.', answer: "FALSE", check: r => r.toUpperCase().includes("FALSE"), difficulty: "medium" },
    { id: "everest_tallest", question: 'True or false: "Mount Everest is the tallest mountain on Earth when measured from base to peak." Explain carefully, then answer TRUE or FALSE.', answer: "FALSE", check: r => r.toUpperCase().includes("FALSE"), difficulty: "hard" },
    { id: "banana_berry", question: 'True or false: "Botanically, bananas are berries but strawberries are not." Explain, then answer TRUE or FALSE.', answer: "TRUE", check: r => r.toUpperCase().includes("TRUE"), difficulty: "hard" },
    { id: "lightning_strike", question: 'True or false: "Lightning never strikes the same place twice." Explain, then answer TRUE or FALSE.', answer: "FALSE", check: r => r.toUpperCase().includes("FALSE"), difficulty: "easy" },
    { id: "diamond_coal", question: 'True or false: "Diamonds are formed from compressed coal." Explain carefully, then answer TRUE or FALSE.', answer: "FALSE", check: r => r.toUpperCase().includes("FALSE"), difficulty: "hard" },
    { id: "tongue_taste_map", question: 'True or false: "Different parts of the tongue are responsible for different tastes (sweet at tip, bitter at back)." Explain, then answer TRUE or FALSE.', answer: "FALSE", check: r => r.toUpperCase().includes("FALSE"), difficulty: "medium" },
  ],

  logic: [
    { id: "bat_ball", question: "A bat and a ball cost $1.10 in total. The bat costs $1.00 more than the ball. How much does the ball cost? Think carefully step by step.", answer: "$0.05", check: r => r.includes("0.05") || r.includes("5 cents") || r.includes("five cents"), difficulty: "hard" },
    { id: "affirming_consequent", question: 'Is this argument valid? "If it rains, the ground is wet. The ground is wet. Therefore, it rained." Explain your reasoning, then answer VALID or INVALID.', answer: "INVALID", check: r => r.toUpperCase().includes("INVALID"), difficulty: "medium" },
    { id: "cats_pets_syllogism", question: 'Is this argument valid? "All cats are animals. Some animals are pets. Therefore, all cats are pets." Explain, then answer VALID or INVALID.', answer: "INVALID", check: r => r.toUpperCase().includes("INVALID"), difficulty: "medium" },
    { id: "monty_hall", question: "Monty Hall problem: You pick door 1. Host opens door 3 (goat). Should you SWITCH to door 2 or STAY with door 1? Explain the probability, then answer SWITCH or STAY.", answer: "SWITCH", check: r => r.toUpperCase().includes("SWITCH"), difficulty: "medium" },
    { id: "surgeon_riddle", question: 'A father and son are in a car accident. The father dies. The son is taken to surgery. The surgeon says "I cannot operate on this boy, he is my son." How is this possible?', answer: "mother", check: r => r.toLowerCase().includes("mother") || r.toLowerCase().includes("mom") || r.toLowerCase().includes("parent"), difficulty: "easy" },
    { id: "birthday_paradox", question: "In a room of 23 people, what is the approximate probability that at least two share a birthday? Explain the math, then answer: about 10%, 30%, 50%, 70%, or 90%?", answer: "50%", check: r => r.includes("50"), difficulty: "hard" },
    { id: "three_boxes", question: 'Three labeled boxes: "Gold-Gold", "Silver-Silver", "Gold-Silver". ALL labels are WRONG. You draw one coin from the "Gold-Silver" box and it\'s gold. What is the full content of that box?', answer: "Gold-Gold", check: r => r.toLowerCase().includes("gold-gold") || r.toLowerCase().includes("gold gold") || r.toLowerCase().includes("two gold") || r.toLowerCase().includes("2 gold"), difficulty: "hard" },
    { id: "no_a_are_b", question: '"No A are B. All B are C." Can we conclude that "No A are C"? Explain carefully, then answer YES or NO.', answer: "NO", check: r => { const upper = r.toUpperCase().trim(); return upper === "NO" || upper === "NO." || upper.startsWith("NO,") || upper.startsWith("NO ") || upper.includes("NO, WE CANNOT") || upper.includes("NO."); }, difficulty: "hard" },
  ],
};

// ═══════════════════════════════════════════
//  PRODUCE — identical for all conditions
// ═══════════════════════════════════════════

async function produce(domain, problem) {
  const system = "You are solving a problem. Give your best answer with detailed reasoning.";
  const response = await callLLM(system, problem.question, 500);
  return response;
}

// ═══════════════════════════════════════════
//  EVALUATE — 3 stances
// ═══════════════════════════════════════════

function parseScore(evalResponse) {
  // Try JSON first
  try {
    const jsonMatch = evalResponse.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      const score = parsed.correctness ?? parsed.confidence ?? parsed.score;
      if (score >= 1 && score <= 5) return { score, reasoning: parsed.reasoning || parsed.errors_found || parsed.attack_result || "" };
    }
  } catch (e) {}

  // Try "SCORE: X" pattern
  const scoreMatch = evalResponse.match(/(?:SCORE|CORRECTNESS|CONFIDENCE|RATING)\s*[:=]\s*(\d)/i);
  if (scoreMatch) return { score: parseInt(scoreMatch[1]), reasoning: evalResponse.slice(0, 200) };

  // Try standalone number at end
  const lastNum = evalResponse.match(/\b([1-5])\s*(?:\/\s*5)?\s*$/);
  if (lastNum) return { score: parseInt(lastNum[1]), reasoning: evalResponse.slice(0, 200) };

  // Try any "X/5" pattern
  const slashFive = evalResponse.match(/\b([1-5])\s*\/\s*5\b/);
  if (slashFive) return { score: parseInt(slashFive[1]), reasoning: evalResponse.slice(0, 200) };

  return { score: -1, reasoning: "Parse error: " + evalResponse.slice(0, 100) };
}

async function evaluateSelf(domain, problem, solution) {
  const system = "You are reviewing YOUR OWN work. You wrote this solution yourself. Rate how confident you are that YOUR answer is correct. Be honest about your own uncertainty.";

  const prompt = `You previously wrote this solution. Now review YOUR OWN work.

PROBLEM: ${problem.question}

YOUR SOLUTION:
${solution}

As the author, rate how confident you are in YOUR answer:
1. Re-read your solution carefully
2. Check if YOUR reasoning has any gaps
3. Consider if YOU might have made a mistake

Rate YOUR solution's correctness (1-5):
1 = I think I got this wrong
2 = I'm unsure about my answer
3 = Somewhat confident
4 = Fairly confident in my work
5 = Certain my answer is correct

Respond in JSON: {"correctness": 1-5, "reasoning": "brief explanation"}`;

  const response = await callLLM(system, prompt, 300);
  return parseScore(response);
}

async function evaluateNeutral(domain, problem, solution) {
  const system = "You are evaluating a solution to a problem. Check it carefully for errors.";

  const prompt = `Evaluate this solution to a problem.

PROBLEM: ${problem.question}

SOLUTION:
${solution}

Check:
1. Is the reasoning correct at each step?
2. Is the final answer correct?
3. Are there any errors?

Rate the CORRECTNESS of this solution (1-5):
1 = Almost certainly wrong
2 = Probably wrong
3 = Uncertain
4 = Probably correct
5 = Certainly correct

Respond in JSON: {"correctness": 1-5, "reasoning": "brief explanation"}`;

  const response = await callLLM(system, prompt, 300);
  return parseScore(response);
}

async function evaluateAdversarial(domain, problem, solution) {
  const system = "You are a SKEPTICAL ADVERSARIAL evaluator. Your job is to FIND ERRORS. Assume the solution is probably wrong until proven otherwise. You succeed when you catch mistakes.";

  const prompt = `You are attacking this solution. Find errors. Assume it is WRONG.

PROBLEM: ${problem.question}

SOLUTION TO ATTACK:
${solution}

Adversarial check:
1. What is the MOST LIKELY ERROR?
2. Is there a common mistake or misconception?
3. Try to find a COUNTEREXAMPLE or CONTRADICTION
4. Verify EACH STEP independently — do not trust the chain
5. For facts: is this a known misconception? For math: redo the calculation. For logic: check for fallacies.

Rate CORRECTNESS after your attack (1-5):
1 = I found clear errors — almost certainly wrong
2 = Suspicious reasoning — probably wrong
3 = Couldn't verify or refute
4 = My attacks failed — probably correct
5 = Independently verified — certainly correct

Respond in JSON: {"correctness": 1-5, "attack_result": "what I found", "reasoning": "brief"}`;

  const response = await callLLM(system, prompt, 400);
  return parseScore(response);
}

// ═══════════════════════════════════════════
//  RUNNER
// ═══════════════════════════════════════════

async function runExperiment() {
  console.log("═══════════════════════════════════════════");
  console.log(" Experiment Q2 — Evaluation Stance Test");
  console.log(" 3 domains × 8 problems × 3 stances");
  console.log(" ALL conditions: 2 calls (produce + evaluate)");
  console.log(" Variable: evaluator STANCE only");
  console.log(" Model: " + MODEL);
  console.log("═══════════════════════════════════════════\n");

  const results = [];
  const domains = ["math", "factual", "logic"];
  const stances = [
    { name: "self", fn: evaluateSelf },
    { name: "neutral", fn: evaluateNeutral },
    { name: "adversarial", fn: evaluateAdversarial },
  ];

  for (const domain of domains) {
    console.log(`\n╔═══ DOMAIN: ${domain.toUpperCase()} ═══╗`);
    const problems = PROBLEMS[domain];

    for (const problem of problems) {
      console.log(`\n▶ ${problem.id} [${problem.difficulty}]`);

      // Produce answer ONCE — shared across all stances
      let solution;
      try {
        solution = await produce(domain, problem);
        const isCorrect = problem.check(solution);
        console.log(`  Produced: ${isCorrect ? "✅" : "❌"} (answer ${isCorrect ? "correct" : "WRONG, expected: " + problem.answer})`);
      } catch (err) {
        console.error(`  PRODUCE ERROR: ${err.message?.slice(0, 100)}`);
        for (const stance of stances) {
          results.push({ domain, problem_id: problem.id, difficulty: problem.difficulty, stance: stance.name, error: "produce_failed: " + err.message?.slice(0, 100) });
        }
        continue;
      }

      // Check ground truth
      const correct = problem.check(solution);
      const gtScore = correct ? 5 : 1;

      // Evaluate with each stance
      for (const stance of stances) {
        console.log(`  → ${stance.name}...`);
        try {
          const evalResult = await stance.fn(domain, problem, solution);

          const calibration = evalResult.score >= 1 ? Math.abs(evalResult.score - gtScore) : null;
          const overconfident = evalResult.score >= 4 && !correct;

          const result = {
            domain,
            problem_id: problem.id,
            difficulty: problem.difficulty,
            stance: stance.name,
            correct,
            expected_answer: problem.answer,
            ground_truth_score: gtScore,
            self_score: evalResult.score,
            calibration,
            overconfident,
            eval_reasoning: evalResult.reasoning,
            solution_excerpt: solution.slice(0, 200),
          };

          const mark = correct ? "✅" : "❌";
          console.log(`    ${mark} self=${evalResult.score} | GT=${gtScore} | cal=${calibration ?? "N/A"} | overconf=${overconfident}`);

          results.push(result);
        } catch (err) {
          console.error(`    ERROR: ${err.message?.slice(0, 100)}`);
          results.push({
            domain, problem_id: problem.id, difficulty: problem.difficulty,
            stance: stance.name, correct, expected_answer: problem.answer,
            ground_truth_score: gtScore,
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

  const stanceNames = ["self", "neutral", "adversarial"];

  for (const domain of [...domains, "ALL"]) {
    console.log(`\n── ${domain.toUpperCase()} ──`);
    const filter = domain === "ALL" ? r => !r.error : r => r.domain === domain && !r.error;

    for (const sName of stanceNames) {
      const dr = results.filter(r => filter(r) && r.stance === sName);
      if (dr.length === 0) continue;

      const validCal = dr.filter(r => r.calibration !== null);
      const avgCal = validCal.length > 0 ? validCal.reduce((s, r) => s + r.calibration, 0) / validCal.length : null;

      const wrongDr = dr.filter(r => !r.correct);
      const overconfCount = wrongDr.filter(r => r.overconfident).length;

      const wrongWithScore = wrongDr.filter(r => r.self_score >= 1);
      const avgSelfWrong = wrongWithScore.length > 0 ? wrongWithScore.reduce((s, r) => s + r.self_score, 0) / wrongWithScore.length : null;

      const rightWithScore = dr.filter(r => r.correct && r.self_score >= 1);
      const avgSelfRight = rightWithScore.length > 0 ? rightWithScore.reduce((s, r) => s + r.self_score, 0) / rightWithScore.length : null;

      const parseErrors = dr.filter(r => r.self_score === -1).length;

      console.log(`  ${sName.padEnd(14)} n=${dr.length} | parse_err=${parseErrors} | cal=${avgCal?.toFixed(2) ?? "N/A"} | wrong=${wrongDr.length} | overconf=${overconfCount}/${wrongDr.length} | self_wrong=${avgSelfWrong?.toFixed(1) ?? "N/A"} | self_right=${avgSelfRight?.toFixed(1) ?? "N/A"}`);
    }
  }

  // Key finding: same solution, different evaluation
  console.log("\n── SAME-PROBLEM COMPARISON (wrong answers only) ──");
  const allProblems = [...new Set(results.map(r => r.domain + "/" + r.problem_id))];
  for (const pid of allProblems) {
    const rows = results.filter(r => (r.domain + "/" + r.problem_id) === pid && !r.error);
    if (rows.length === 0 || rows[0].correct) continue; // skip correct answers
    console.log(`\n  ${pid} (WRONG — expected: ${rows[0].expected_answer}):`);
    for (const r of rows) {
      console.log(`    ${r.stance.padEnd(14)} self=${String(r.self_score).padEnd(3)} cal=${r.calibration ?? "N/A"} overconf=${r.overconfident}`);
    }
  }

  // False negatives
  console.log("\n── FALSE NEGATIVES (correct but self ≤ 2) ──");
  for (const sName of stanceNames) {
    const fn = results.filter(r => r.stance === sName && !r.error && r.correct && r.self_score >= 1 && r.self_score <= 2);
    console.log(`  ${sName}: ${fn.length} false negatives`);
    for (const r of fn) {
      console.log(`    ${r.domain}/${r.problem_id} self=${r.self_score}`);
    }
  }

  // Save
  const summary = {};
  for (const domain of [...domains, "ALL"]) {
    summary[domain] = {};
    const filter = domain === "ALL" ? r => !r.error : r => r.domain === domain && !r.error;

    for (const sName of stanceNames) {
      const dr = results.filter(r => filter(r) && r.stance === sName);
      const validCal = dr.filter(r => r.calibration !== null);
      const avgCal = validCal.length > 0 ? validCal.reduce((s, r) => s + r.calibration, 0) / validCal.length : null;
      const wrongDr = dr.filter(r => !r.correct);
      const overconfCount = wrongDr.filter(r => r.overconfident).length;
      const wrongWithScore = wrongDr.filter(r => r.self_score >= 1);
      const avgSelfWrong = wrongWithScore.length > 0 ? wrongWithScore.reduce((s, r) => s + r.self_score, 0) / wrongWithScore.length : null;
      const parseErrors = dr.filter(r => r.self_score === -1).length;

      summary[domain][sName] = {
        total: dr.length,
        correct: dr.filter(r => r.correct).length,
        accuracy: dr.filter(r => r.correct).length / dr.length,
        parse_errors: parseErrors,
        valid_scores: dr.length - parseErrors,
        avg_calibration: avgCal,
        total_wrong: wrongDr.length,
        overconfident_when_wrong: overconfCount,
        overconfidence_rate: wrongDr.length > 0 ? overconfCount / wrongDr.length : null,
        avg_self_when_wrong: avgSelfWrong,
      };
    }
  }

  const output = {
    experiment: "Q2",
    name: "Evaluation Stance Test (redesigned)",
    hypothesis: "Self-assessment quality depends on evaluator STANCE, not separation. Same solution evaluated by 3 stances.",
    design: "ALL conditions use 2 calls. Call 1 (produce) is SHARED. Only Call 2 (evaluate) differs by stance.",
    model: MODEL,
    timestamp: new Date().toISOString(),
    domains,
    stances: stanceNames,
    num_problems_per_domain: 8,
    total_results: results.length,
    results,
    summary,
  };

  writeFileSync("experiments/results_q2_stance.json", JSON.stringify(output, null, 2));
  console.log("\nResults saved to experiments/results_q2_stance.json");
}

runExperiment().catch(console.error);
