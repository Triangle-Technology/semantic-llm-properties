/**
 * Experiment L — Cross-Model Circuits
 *
 * Question: Does mixing Type-M (Claude, meta-constructive) and Type-D (GPT, destructive)
 * models in the SAME circuit create output that neither can produce alone?
 *
 * Design:
 *   Same 3 decision problems from Experiment K.
 *   4 circuit configurations:
 *     A) Claude-only circuit (all 6 steps on Claude)
 *     B) GPT-only circuit (all 6 steps on GPT)
 *     C) Hybrid-CM: Claude perspectives + GPT perspectives → Claude interference → Claude meta
 *     D) Hybrid-MC: Mixed perspectives → GPT interference → GPT meta
 *
 *   Blind evaluation by Claude (randomized labels).
 *
 * Hypothesis: Hybrid circuits may produce output that combines Claude's elevation
 * with GPT's decisiveness — or they may create destructive interference.
 * I genuinely don't know which.
 *
 * ~160 API calls total.
 */

import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { writeFileSync } from "fs";

const claude = new Anthropic();
const openai = new OpenAI();

const CLAUDE_MODEL = "claude-haiku-4-5-20251001";
const GPT_MODEL = "gpt-4o-mini";

// ─── Problems (same as Experiment K) ───

const PROBLEMS = [
  {
    id: "career",
    question: "I'm 35 with a stable job, mortgage, and two young kids. A close friend offered me a co-founder role at his AI startup — no salary for 6 months, then $80K + 15% equity. The startup has a working prototype and one paying customer. Should I take it?"
  },
  {
    id: "ethics",
    question: "I'm a doctor. My patient's genetic test reveals they carry a gene for a fatal hereditary condition that's highly likely to affect their siblings and children. My patient explicitly refuses to tell their family. Medical confidentiality legally protects their decision. But their sister is pregnant. What should I do?"
  },
  {
    id: "relationship",
    question: "My partner of 8 years wants to move to another country for their dream job. I have aging parents here who need increasing care. We love each other deeply but neither of us can compromise without giving up something fundamental. What should we do?"
  }
];

// ─── Opposing personas ───

const PERSONAS = [
  {
    name: "The Risk-Taker",
    system: "You are a bold, action-oriented advisor who believes growth comes from discomfort. You've seen too many people die with regret for playing it safe. You push toward decisive action, not careful deliberation. Be direct and challenging."
  },
  {
    name: "The Protector",
    system: "You are a cautious realist who has seen lives destroyed by impulsive decisions. You protect people from downside risk. You think about worst-case scenarios, dependents, and irreversible consequences. Be specific about what could go wrong."
  },
  {
    name: "The Philosopher",
    system: "You are an existential philosopher. You don't care about practical outcomes — you care about authenticity, meaning, and what people truly value beneath their surface desires. You ask uncomfortable questions about identity and self-deception."
  }
];

// ─── API Callers ───

async function callClaude(system, userMessage, maxTokens = 600) {
  const params = {
    model: CLAUDE_MODEL,
    max_tokens: maxTokens,
    temperature: 1.0,
    messages: [{ role: "user", content: userMessage }]
  };
  if (system) params.system = system;
  const res = await claude.messages.create(params);
  return res.content[0].text.trim();
}

async function callGPT(system, userMessage, maxTokens = 600) {
  const messages = [];
  if (system) messages.push({ role: "system", content: system });
  messages.push({ role: "user", content: userMessage });
  const res = await openai.chat.completions.create({
    model: GPT_MODEL,
    max_tokens: maxTokens,
    temperature: 1.0,
    messages
  });
  return res.choices[0].message.content.trim();
}

// ─── Circuit Runner ───

async function runCircuit(problem, config) {
  const { perspectiveModels, interferenceModel, metaModel, label } = config;

  // Step 1-3: Three perspectives
  const perspectives = [];
  for (let i = 0; i < 3; i++) {
    const caller = perspectiveModels[i] === "claude" ? callClaude : callGPT;
    const text = await caller(
      PERSONAS[i].system,
      `Someone is facing this decision:\n\n"${problem.question}"\n\nGive your honest, specific advice from your unique perspective. Be direct — what would you actually tell this person? What are they not seeing?`
    );
    perspectives.push({ name: PERSONAS[i].name, model: perspectiveModels[i], text });
    process.stdout.write(".");
  }

  // Step 4: Interference
  const interferenceCaller = interferenceModel === "claude" ? callClaude : callGPT;
  const interferenceText = await interferenceCaller(
    null,
    `Three advisors with VERY different worldviews gave their perspectives on a decision. Your job is NOT to average them. Identify:
1. Where do they genuinely CONTRADICT each other?
2. What TENSIONS are irreconcilable?
3. What does EACH miss that the others reveal?
4. What NEW insight emerges from the collision that NONE of them stated?

DECISION: "${problem.question}"

${perspectives.map((p, i) => `PERSPECTIVE ${i + 1} — ${p.name}:\n${p.text}`).join("\n\n")}

Analyze the COLLISION between these worldviews.`,
    800
  );
  process.stdout.write(".");

  // Step 5: Meta synthesis
  const metaCaller = metaModel === "claude" ? callClaude : callGPT;
  const metaText = await metaCaller(
    null,
    `You've analyzed a complex decision through colliding perspectives. Now produce FINAL ADVICE.

This should be:
- More nuanced than any single perspective
- Acknowledge what's genuinely LOST either way
- Include specific, concrete action steps
- Name the thing the person is probably avoiding thinking about
- Be honest about uncertainty

DECISION: "${problem.question}"

INTERFERENCE ANALYSIS:
${interferenceText}

What is your final, synthesized advice?`,
    1000
  );
  process.stdout.write(".");

  return {
    config: label,
    perspectives,
    interference: interferenceText,
    meta: metaText
  };
}

// ─── Blind Evaluation ───

async function blindEvaluate(problem, outputs) {
  // Shuffle and assign anonymous labels
  const shuffled = [...outputs].sort(() => Math.random() - 0.5);
  const labels = ["Response A", "Response B", "Response C", "Response D"];

  const labelMap = {};
  shuffled.forEach((out, i) => {
    labelMap[labels[i]] = out.config;
  });

  const evalPrompt = `You are an expert evaluator. Below are 4 different responses to the same decision question. They were generated by different methods — you do NOT know which is which. Evaluate each on 5 dimensions (1-10 scale):

1. DEPTH: How deeply does it analyze the problem?
2. NUANCE: Does it hold multiple truths simultaneously without collapsing to one side?
3. ACTIONABILITY: Does it give specific, concrete steps?
4. HONESTY: Does it name uncomfortable truths and acknowledge genuine loss?
5. EMERGENCE: Does it contain insights that surprise you — ideas that go beyond obvious analysis?

DECISION: "${problem.question}"

${shuffled.map((out, i) => `=== ${labels[i]} ===\n${out.meta}`).join("\n\n")}

For EACH response, provide scores in this exact format:
${labels.map(l => `${l}: depth=X nuance=X actionability=X honesty=X emergence=X`).join("\n")}

Then rank them 1st to 4th with brief reasoning.`;

  const evalResult = await callClaude(null, evalPrompt, 1200);
  return { labelMap, evaluation: evalResult };
}

// ─── Circuit Configurations ───

const CONFIGS = [
  {
    label: "claude-only",
    perspectiveModels: ["claude", "claude", "claude"],
    interferenceModel: "claude",
    metaModel: "claude"
  },
  {
    label: "gpt-only",
    perspectiveModels: ["gpt", "gpt", "gpt"],
    interferenceModel: "gpt",
    metaModel: "gpt"
  },
  {
    label: "hybrid-claude-lead",
    perspectiveModels: ["claude", "gpt", "claude"],
    interferenceModel: "claude",
    metaModel: "claude"
  },
  {
    label: "hybrid-gpt-lead",
    perspectiveModels: ["gpt", "claude", "gpt"],
    interferenceModel: "gpt",
    metaModel: "gpt"
  }
];

// ─── Main ───

async function main() {
  console.log("╔═══════════════════════════════════════════════════╗");
  console.log("║  Experiment L — Cross-Model Circuits              ║");
  console.log("║  Does mixing Type-M + Type-D create something     ║");
  console.log("║  neither can produce alone?                       ║");
  console.log("╚═══════════════════════════════════════════════════╝\n");

  const allResults = [];

  for (const problem of PROBLEMS) {
    console.log(`\n── Problem: ${problem.id} ──`);
    const outputs = [];

    for (const config of CONFIGS) {
      process.stdout.write(`  ${config.label}: `);
      const result = await runCircuit(problem, config);
      outputs.push(result);
      console.log(" done");
    }

    // Blind evaluation
    process.stdout.write("  Evaluating (blind)...");
    const evaluation = await blindEvaluate(problem, outputs);
    console.log(" done");

    allResults.push({
      problem: problem.id,
      question: problem.question,
      outputs,
      evaluation
    });
  }

  // Save results
  const filename = "experiments/results_l_crossmodel_circuit.json";
  writeFileSync(filename, JSON.stringify(allResults, null, 2));
  console.log(`\n✅ Results saved to ${filename}`);

  // Quick summary
  console.log("\n═══ QUICK SUMMARY ═══");
  for (const r of allResults) {
    console.log(`\n${r.problem}:`);
    console.log(`  Label map: ${JSON.stringify(r.evaluation.labelMap)}`);
    console.log(`  Evaluation:\n${r.evaluation.evaluation}`);
  }
}

main().catch(console.error);
