#!/usr/bin/env node
/**
 * Semantic Circuit Demo — Decision Advisor
 *
 * Usage:
 *   node demo.mjs "Should I quit my stable job for a startup?"
 *   node demo.mjs    (uses default example question)
 *
 * Requires: ANTHROPIC_API_KEY environment variable
 *
 * This demo implements a 5-step semantic circuit:
 *   1-3. Three opposing-context gates (different worldviews)
 *   4.   Interference gate (force contradiction analysis)
 *   5.   Meta gate (synthesize final advice)
 *
 * Based on Experiment K findings: this approach produces measurably
 * better output (nuance +11%, honesty +11%, emergence +20%) than
 * a single well-crafted prompt — and the advantage comes from the
 * opposing-context STRUCTURE, not from using more API calls.
 *
 * Paper: "Semantic Computing: Foundations"
 */

import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();
const MODEL = "claude-haiku-4-5-20251001";

// ─── Detect question type and generate opposing contexts ───

async function generateContexts(question) {
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 600,
    temperature: 0.7,
    messages: [{
      role: "user",
      content: `Given this decision question, generate exactly 3 OPPOSING advisor personas. Each should have a genuinely different worldview that creates TENSION with the others. They should NOT be 3 versions of "balanced advisor" — they should DISAGREE fundamentally.

QUESTION: "${question}"

Respond in this exact JSON format:
[
  {"name": "Name1", "system": "You are a... (2-3 sentences describing a specific persona with strong convictions)"},
  {"name": "Name2", "system": "You are a... (opposing worldview)"},
  {"name": "Name3", "system": "You are a... (third contrasting perspective)"}
]

Make personas specific and opinionated, not generic.`,
    }],
  });

  try {
    const match = response.content[0].text.match(/\[[\s\S]*\]/);
    return JSON.parse(match[0]);
  } catch {
    // Fallback personas
    return [
      { name: "Optimist", system: "You are a bold optimist who believes growth comes from risk and discomfort. You've seen too many people die with regret for playing it safe." },
      { name: "Protector", system: "You are a cautious realist who has seen lives destroyed by impulsive decisions. You protect people from downside risk." },
      { name: "Philosopher", system: "You are an existential philosopher focused on meaning, authenticity, and what people truly value beneath their surface desires." },
    ];
  }
}

// ─── The semantic circuit ───

async function runCircuit(question, contexts) {
  // Gates 1-3: Opposing perspectives
  const perspectives = [];
  for (const ctx of contexts) {
    process.stdout.write(`  ⚡ ${ctx.name}...`);
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 500,
      temperature: 1.0,
      system: ctx.system,
      messages: [{
        role: "user",
        content: `Someone is facing this decision:\n\n"${question}"\n\nGive your honest, specific advice from your unique perspective. Be direct — what would you actually tell this person? What are they not seeing?`,
      }],
    });
    perspectives.push({ name: ctx.name, text: response.content[0].text.trim() });
    console.log(" done");
  }

  // Gate 4: Interference
  process.stdout.write("  💥 Interference gate...");
  const interference = await client.messages.create({
    model: MODEL,
    max_tokens: 800,
    temperature: 1.0,
    messages: [{
      role: "user",
      content: `Three advisors with VERY different worldviews gave their perspectives on a decision. Your job is NOT to average them. Identify:
1. Where do they genuinely CONTRADICT each other?
2. What TENSIONS are irreconcilable?
3. What does EACH miss that the others reveal?
4. What NEW insight emerges from the collision that NONE of them stated?

DECISION: "${question}"

${perspectives.map((p, i) => `PERSPECTIVE ${i + 1} — ${p.name}:\n${p.text}`).join("\n\n")}

Analyze the COLLISION.`,
    }],
  });
  console.log(" done");

  // Gate 5: Meta synthesis
  process.stdout.write("  🔮 Meta gate...");
  const meta = await client.messages.create({
    model: MODEL,
    max_tokens: 1200,
    temperature: 1.0,
    messages: [{
      role: "user",
      content: `You've analyzed a complex decision through colliding perspectives. Now produce FINAL ADVICE.

This should be:
- More nuanced than any single perspective
- Acknowledge what's genuinely LOST either way
- Include specific, concrete action steps
- Name the thing the person is probably avoiding thinking about
- Be honest about uncertainty

DECISION: "${question}"

INTERFERENCE ANALYSIS:
${interference.content[0].text.trim()}

What is your final, synthesized advice?`,
    }],
  });
  console.log(" done");

  return {
    perspectives,
    interference: interference.content[0].text.trim(),
    final: meta.content[0].text.trim(),
  };
}

// ─── Main ───

async function main() {
  const question = process.argv[2] || "I'm 35 with a stable job, mortgage, and two young kids. A friend offered me a co-founder role at his AI startup — no salary for 6 months, then $80K + 15% equity. Should I take it?";

  console.log("╔══════════════════════════════════════════════════════════╗");
  console.log("║  SEMANTIC CIRCUIT — Decision Advisor Demo               ║");
  console.log("║  3 opposing contexts → interference → meta synthesis    ║");
  console.log("╚══════════════════════════════════════════════════════════╝");
  console.log();
  console.log(`❓ QUESTION: ${question}`);
  console.log();

  // Step 1: Generate opposing contexts
  console.log("📡 Generating opposing advisor personas...");
  const contexts = await generateContexts(question);
  for (const ctx of contexts) {
    console.log(`   • ${ctx.name}`);
  }
  console.log();

  // Step 2: Run the circuit
  console.log("🔄 Running semantic circuit (5 steps):");
  const result = await runCircuit(question, contexts);

  // Step 3: Output
  console.log();
  console.log("═".repeat(60));
  console.log("PERSPECTIVES (what each advisor sees):");
  console.log("═".repeat(60));
  for (const p of result.perspectives) {
    console.log(`\n── ${p.name} ──`);
    console.log(p.text);
  }

  console.log();
  console.log("═".repeat(60));
  console.log("INTERFERENCE (where perspectives collide):");
  console.log("═".repeat(60));
  console.log(result.interference);

  console.log();
  console.log("═".repeat(60));
  console.log("★ FINAL SYNTHESIZED ADVICE:");
  console.log("═".repeat(60));
  console.log(result.final);
  console.log();
  console.log("─".repeat(60));
  console.log("This advice was produced by a semantic circuit — 3 opposing");
  console.log("worldviews forced into collision, then synthesized.");
  console.log("Paper: \"Semantic Computing: Foundations\"");
}

main().catch(console.error);
