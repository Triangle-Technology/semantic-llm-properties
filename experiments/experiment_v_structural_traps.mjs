// ═══════════════════════════════════════════════════════════
// EXPERIMENT V: Structural Trap Taxonomy
// Tests whether LLMs are trapped by anchoring, sunk cost,
// and false constraints — beyond binary dilemmas
// ═══════════════════════════════════════════════════════════

import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { config } from 'dotenv';
import fs from 'fs';

config({ override: true });

// ─── Problem Definitions ───

const PROBLEMS = [
  // === ANCHORING TRAP ===
  {
    id: 'anchor_salary',
    trap: 'anchoring',
    difficulty: 'MEDIUM',
    domain: 'HR/Negotiation',
    scenario: 'A software engineer with 5 years of experience is currently making $95,000. They received a competing offer. How much should we offer to retain them?',
    hiddenTrap: 'The $95k anchor makes people adjust incrementally (e.g., $105-115k) instead of evaluating market rate from scratch (which might be $140-160k).',
    escapeIndicators: ['market rate', 'benchmark', 'regardless of current', 'zero-base', 'what the role is worth', 'ignore current salary'],
  },
  {
    id: 'anchor_pricing',
    trap: 'anchoring',
    difficulty: 'HARD',
    domain: 'Business Strategy',
    scenario: 'Our SaaS product has been priced at $49/month for 3 years. Costs have risen 40% and competitors charge $79-129. How much should we raise the price?',
    hiddenTrap: 'The $49 anchor makes people think in terms of "raise by X%" instead of repricing from value delivered (might warrant $99-149 or a completely different pricing model).',
    escapeIndicators: ['value-based', 'reprice from scratch', 'pricing model', 'not about raising', 'willingness to pay', 'ignore current price'],
  },
  {
    id: 'anchor_timeline',
    trap: 'anchoring',
    difficulty: 'MEDIUM',
    domain: 'Project Management',
    scenario: 'The original project estimate was 6 months. We\'re now 4 months in and only 30% complete. How should we adjust the timeline?',
    hiddenTrap: 'The 6-month anchor makes people extend incrementally (e.g., 10-12 months) instead of re-estimating from scratch based on actual velocity (which suggests 13+ months) or questioning if the project should continue at all.',
    escapeIndicators: ['re-estimate from scratch', 'actual velocity', 'should we continue', 'cancel', 'pivot', 'ignore original estimate', 'zero-base estimate'],
  },

  // === SUNK COST TRAP ===
  {
    id: 'sunk_product',
    trap: 'sunk_cost',
    difficulty: 'MEDIUM',
    domain: 'Product Strategy',
    scenario: 'We\'ve spent $2M and 18 months building a new product feature. It\'s 80% complete but early user testing shows only 5% of users want it. Should we finish the remaining 20% or stop?',
    hiddenTrap: 'The $2M/18 months sunk cost biases toward finishing. The correct question is: "If we were starting fresh today, would we build this?" (answer: clearly no). The remaining $500k could be better invested elsewhere.',
    escapeIndicators: ['sunk cost', 'if starting fresh', 'ignore what we spent', 'opportunity cost', 'better use of remaining', 'not relevant what was spent'],
  },
  {
    id: 'sunk_hire',
    trap: 'sunk_cost',
    difficulty: 'HARD',
    domain: 'People Management',
    scenario: 'We invested 6 months training a new team lead. They\'ve been underperforming for 3 months despite coaching. We\'ve already invested significantly in their development. Should we give them more time or let them go?',
    hiddenTrap: 'The training investment creates bias toward giving more time. The question should be: "If this person walked in today with their current performance, would we hire them for this role?" Investment in training is irrelevant to future decisions.',
    escapeIndicators: ['sunk cost', 'if they walked in today', 'future performance', 'ignore training investment', 'fresh evaluation', 'what matters going forward'],
  },
  {
    id: 'sunk_tech',
    trap: 'sunk_cost',
    difficulty: 'MEDIUM',
    domain: 'Technical Architecture',
    scenario: 'Our team spent a year migrating from MySQL to MongoDB. The migration is 60% complete but we\'re experiencing significant issues. Several senior engineers believe PostgreSQL would be a better fit. Should we push through the MongoDB migration or consider switching?',
    hiddenTrap: 'The year of migration effort biases toward continuing. The correct analysis ignores past investment and asks: "Given what we know NOW, what\'s the best database choice? What\'s the total FUTURE cost of each path?" The sunk year is irrelevant.',
    escapeIndicators: ['sunk cost', 'ignore past effort', 'future cost only', 'if starting today', 'total cost going forward', 'what we know now'],
  },

  // === FALSE CONSTRAINT TRAP ===
  {
    id: 'false_budget',
    trap: 'false_constraint',
    difficulty: 'MEDIUM',
    domain: 'Resource Allocation',
    scenario: 'We have a $500k annual marketing budget. How should we allocate it between digital ads (currently 60%), content marketing (25%), and events (15%)?',
    hiddenTrap: 'Accepting $500k as fixed. The real question might be: Is $500k the right budget? Should we spend $200k and save the rest? Or $1M because ROI justifies it? The constraint itself is the assumption.',
    escapeIndicators: ['is $500k right', 'question the budget', 'budget itself', 'should we spend more', 'should we spend less', 'ROI justifies', 'wrong constraint'],
  },
  {
    id: 'false_team',
    trap: 'false_constraint',
    difficulty: 'HARD',
    domain: 'Organizational Design',
    scenario: 'Our engineering team of 12 needs to deliver 3 major projects this quarter. How should we distribute the engineers across the projects?',
    hiddenTrap: 'Accepting "12 engineers" and "3 projects this quarter" as fixed constraints. Should we hire contractors? Can we defer 1 project? Can we change scope? Should we NOT do all 3? The constraints themselves may be wrong.',
    escapeIndicators: ['question the constraints', 'do we need all 3', 'hire more', 'defer', 'change scope', 'reduce projects', 'constraints themselves', 'why 3 projects'],
  },
  {
    id: 'false_time',
    trap: 'false_constraint',
    difficulty: 'MEDIUM',
    domain: 'Process Design',
    scenario: 'Our sprint cycle is 2 weeks. The team consistently fails to complete planned work. How should we improve our sprint planning to fit work into the 2-week cycle?',
    hiddenTrap: 'Accepting "2-week sprint" as immutable. Maybe the cycle should be 3 weeks, or 1 week, or no fixed sprints at all. Maybe the issue isn\'t planning but scope creep, interruptions, or the sprint model itself.',
    escapeIndicators: ['change sprint length', 'question 2 weeks', 'sprint model itself', 'maybe not sprints', 'cycle is wrong', 'constraint is the problem', 'kanban', 'continuous flow'],
  },
];

// ─── Condition Prompts ───

function getConstrainedPrompt(problem) {
  return {
    system: 'You are a practical advisor. Give a specific, actionable answer within the parameters described. Focus on optimizing within the given situation.',
    user: problem.scenario + '\n\nProvide your recommendation with specific numbers or percentages where applicable.',
  };
}

function getFreeResponsePrompt(problem) {
  return {
    system: null,
    user: problem.scenario + '\n\nWhat are your thoughts on this? What would you recommend?',
  };
}

function getFullCompositionPrompts(problem) {
  return {
    superpose: {
      system: 'You generate genuinely diverse expert perspectives. Each must see fundamentally different things.',
      user: `Consider this situation from 3 very different expert angles:\n\n"${problem.scenario}"\n\nExpert 1 — Behavioral economist:\nExpert 2 — First-principles thinker:\nExpert 3 — Meta-analyst who studies decision-making errors:`,
    },
    interfere: {
      system: 'You find hidden patterns and shared blind spots across perspectives.',
      user: `Original situation: "${problem.scenario}"\n\nPerspectives:\n{PREV}\n\nFind the COLLISION POINTS:\n1. What contradictions exist between these perspectives?\n2. What do ALL THREE secretly agree on without stating it?\n3. What COGNITIVE TRAP or DECISION-MAKING ERROR might be operating here that none of them explicitly named?`,
    },
    reframe: {
      system: 'You break cognitive frames. You see decision-making traps that others fall into.',
      user: `Original situation: "${problem.scenario}"\n\nAnalysis found these patterns:\n{PREV}\n\nREFRAME: What cognitive trap or structural bias is embedded in how this question is framed? How should the question actually be posed? What would someone who is NOT trapped by this bias ask instead?`,
    },
    synthesize: {
      system: 'You synthesize insights into clear, actionable answers.',
      user: `Original situation: "${problem.scenario}"\n\nReframed analysis:\n{PREV}\n\nFinal synthesis:\n1. **Structural Trap**: What specific cognitive/structural trap is this question embedded in? Name it.\n2. **What the question assumes**: What constraint or framing does the question take for granted?\n3. **Better question**: What question SHOULD we be asking?\n4. **Recommendation**: What should we actually do?`,
    },
    validate: {
      system: 'You are an adversarial evaluator of reasoning quality.',
      user: `Evaluate this analysis:\n\n{PREV}\n\nIs the identified trap GENUINE or is it finding problems where none exist?\nScore 1-5 (1=manufactured problem, 5=genuinely caught a real trap)\nVerdict: GENUINE, PARTIALLY GENUINE, or ARTIFICIAL`,
    },
  };
}

// ─── Judge Prompt ───

function getJudgePrompt(problem, response) {
  return `You are evaluating whether a response successfully escaped a structural trap in reasoning.

SCENARIO: "${problem.scenario}"

STRUCTURAL TRAP TYPE: ${problem.trap.toUpperCase().replace('_', ' ')}
SPECIFIC TRAP: ${problem.hiddenTrap}
ESCAPE INDICATORS (response should contain concepts like): ${problem.escapeIndicators.join(', ')}

RESPONSE TO EVALUATE:
"""
${response}
"""

Evaluate:
1. Did the response recognize the structural trap (${problem.trap})? (YES/NO)
2. Did it escape the trap (propose thinking outside the given frame)? (YES/NO)
3. Quality of escape: 1-5 (1=superficial mention, 5=deep reframe with actionable alternative)

Answer in this EXACT format:
TRAP_RECOGNIZED: 0 or 1
TRAP_ESCAPED: 0 or 1
ESCAPE_QUALITY: 1-5`;
}

// ─── API Clients ───

const PROVIDERS = {
  claude: {
    model: 'claude-sonnet-4-20250514',
    call: async (system, user) => {
      const client = new Anthropic();
      const params = {
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        temperature: 0.7,
        messages: [{ role: 'user', content: user }],
      };
      if (system) params.system = system;
      const res = await client.messages.create(params);
      return res.content[0].text;
    },
    judge: async (prompt) => {
      const client = new Anthropic();
      const res = await client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 500,
        temperature: 0,
        messages: [{ role: 'user', content: prompt }],
      });
      return res.content[0].text;
    },
  },
  gpt: {
    model: 'gpt-4o-mini',
    call: async (system, user) => {
      const client = new OpenAI();
      const messages = [];
      if (system) messages.push({ role: 'system', content: system });
      messages.push({ role: 'user', content: user });
      const res = await client.chat.completions.create({
        model: 'gpt-4o-mini', messages, temperature: 0.7, max_tokens: 2000,
      });
      return res.choices[0].message.content;
    },
  },
};

// ─── Run single condition ───

async function runCondition(provider, problem, condition, nRuns) {
  const runs = [];

  for (let r = 0; r < nRuns; r++) {
    process.stdout.write(`    run ${r + 1}/${nRuns}... `);
    try {
      let response;

      if (condition === 'CONSTRAINED') {
        const { system, user } = getConstrainedPrompt(problem);
        response = await provider.call(system, user);
      } else if (condition === 'FREE_RESPONSE') {
        const { system, user } = getFreeResponsePrompt(problem);
        response = await provider.call(system, user);
      } else if (condition === 'FULL_COMPOSITION') {
        const prompts = getFullCompositionPrompts(problem);
        // Step 1: SUPERPOSE
        const perspectives = await provider.call(prompts.superpose.system, prompts.superpose.user);
        // Step 2: INTERFERE
        const interference = await provider.call(
          prompts.interfere.system,
          prompts.interfere.user.replace('{PREV}', perspectives)
        );
        // Step 3: REFRAME
        const reframe = await provider.call(
          prompts.reframe.system,
          prompts.reframe.user.replace('{PREV}', interference)
        );
        // Step 4: SYNTHESIZE
        const synthesis = await provider.call(
          prompts.synthesize.system,
          prompts.synthesize.user.replace('{PREV}', reframe)
        );
        // Step 5: VALIDATE (optional for judging — we use the synthesis as the response)
        response = synthesis;
      }

      // Judge
      const judgePrompt = getJudgePrompt(problem, response);
      const judgeResponse = await PROVIDERS.claude.judge(judgePrompt);

      // Parse judge response
      const trapRecognized = judgeResponse.match(/TRAP_RECOGNIZED:\s*(\d)/)?.[1] === '1' ? 1 : 0;
      const trapEscaped = judgeResponse.match(/TRAP_ESCAPED:\s*(\d)/)?.[1] === '1' ? 1 : 0;
      const escapeQuality = parseInt(judgeResponse.match(/ESCAPE_QUALITY:\s*(\d)/)?.[1] || '1');

      console.log(`recognized=${trapRecognized} escaped=${trapEscaped} quality=${escapeQuality}`);

      runs.push({
        run: r + 1,
        response: response.substring(0, 500),
        evaluation: { trap_recognized: trapRecognized, trap_escaped: trapEscaped, escape_quality: escapeQuality },
        judgeRaw: judgeResponse.substring(0, 300),
      });
    } catch (err) {
      console.log(`ERROR: ${err.message.substring(0, 100)}`);
      runs.push({ run: r + 1, error: err.message.substring(0, 200) });
    }
  }

  return runs;
}

// ─── Main ───

async function main() {
  const args = process.argv.slice(2);
  const providerName = args[0] || 'claude';
  const filterTrap = args[1] || 'all';  // 'anchoring', 'sunk_cost', 'false_constraint', or 'all'
  const nRuns = parseInt(args[2]) || 10;

  const provider = PROVIDERS[providerName];
  if (!provider) { console.error(`Unknown provider: ${providerName}`); process.exit(1); }

  const problems = filterTrap === 'all'
    ? PROBLEMS
    : PROBLEMS.filter(p => p.trap === filterTrap);

  const CONDITIONS = ['CONSTRAINED', 'FREE_RESPONSE', 'FULL_COMPOSITION'];

  console.log('═══════════════════════════════════════════════════════════');
  console.log('EXPERIMENT V: STRUCTURAL TRAP TAXONOMY');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`Provider: ${providerName} (${provider.model})`);
  console.log(`Judge: claude-sonnet-4-20250514`);
  console.log(`N = ${nRuns} per condition`);
  console.log(`Trap types: ${filterTrap}`);
  console.log(`Problems: ${problems.length}`);
  console.log();

  const resultsFile = `experiments/results_v_traps_${providerName}.json`;

  // Resume support
  let existing = { provider: providerName, model: provider.model, judge: 'claude-sonnet-4-20250514', nRuns, results: [] };
  if (fs.existsSync(resultsFile)) {
    existing = JSON.parse(fs.readFileSync(resultsFile, 'utf8'));
    console.log(`Resuming: found ${existing.results.length} existing problem results\n`);
  }

  for (const problem of problems) {
    // Check if already completed
    const existingProblem = existing.results.find(p => p.problem === problem.id);
    if (existingProblem && existingProblem.conditions.length === CONDITIONS.length) {
      const firstCond = existingProblem.conditions[0];
      if (firstCond.runs.length >= nRuns) {
        console.log(`SKIPPING ${problem.id} (already completed)\n`);
        continue;
      }
    }

    console.log(`PROBLEM: ${problem.id} [${problem.difficulty}] — ${problem.domain} (${problem.trap})`);

    const problemResult = {
      problem: problem.id,
      trap: problem.trap,
      difficulty: problem.difficulty,
      domain: problem.domain,
      conditions: [],
    };

    for (const condition of CONDITIONS) {
      console.log(`  ${condition}:`);
      const runs = await runCondition(provider, problem, condition, nRuns);

      const validRuns = runs.filter(r => r.evaluation);
      const recognizedRate = validRuns.length > 0
        ? (validRuns.filter(r => r.evaluation.trap_recognized === 1).length / validRuns.length * 100).toFixed(0)
        : '0';
      const escapedRate = validRuns.length > 0
        ? (validRuns.filter(r => r.evaluation.trap_escaped === 1).length / validRuns.length * 100).toFixed(0)
        : '0';
      const avgQuality = validRuns.length > 0
        ? (validRuns.reduce((s, r) => s + r.evaluation.escape_quality, 0) / validRuns.length).toFixed(1)
        : '0';

      console.log(`    → Recognized: ${recognizedRate}% | Escaped: ${escapedRate}% | Quality: ${avgQuality} (n=${validRuns.length})\n`);

      problemResult.conditions.push({ condition, runs });
    }

    // Update results (replace if exists)
    const idx = existing.results.findIndex(p => p.problem === problem.id);
    if (idx >= 0) existing.results[idx] = problemResult;
    else existing.results.push(problemResult);

    // Save after each problem
    fs.writeFileSync(resultsFile, JSON.stringify(existing, null, 2));
    console.log(`  → Saved to ${resultsFile}\n`);
  }

  // ─── Analysis ───
  console.log('\n══════════════════════════════════════════════════════════════════════');
  console.log('ANALYSIS — STRUCTURAL TRAP TAXONOMY');
  console.log('══════════════════════════════════════════════════════════════════════');

  const allResults = existing.results;

  // By trap type
  const trapTypes = ['anchoring', 'sunk_cost', 'false_constraint'];

  console.log('\n1. TRAP ESCAPE RATE BY TYPE × CONDITION:');
  console.log('   ─────────────────────────────────────────────────────────────────');
  console.log('   Trap Type           CONST  FREE   FULL');
  console.log('   ─────────────────────────────────────────────────────────────────');

  for (const trapType of trapTypes) {
    const problems = allResults.filter(p => p.trap === trapType);
    const rates = {};

    for (const cond of CONDITIONS) {
      let escaped = 0, total = 0;
      for (const p of problems) {
        const c = p.conditions.find(c => c.condition === cond);
        if (!c) continue;
        const valid = c.runs.filter(r => r.evaluation);
        escaped += valid.filter(r => r.evaluation.trap_escaped === 1).length;
        total += valid.length;
      }
      rates[cond] = total > 0 ? (escaped / total * 100).toFixed(0) : '?';
    }

    console.log(`   ${trapType.padEnd(22)} ${rates.CONSTRAINED.padStart(4)}%  ${rates.FREE_RESPONSE.padStart(4)}%  ${rates.FULL_COMPOSITION.padStart(4)}%`);
  }

  // Global
  const globalRates = {};
  for (const cond of CONDITIONS) {
    let escaped = 0, total = 0;
    for (const p of allResults) {
      const c = p.conditions.find(c => c.condition === cond);
      if (!c) continue;
      const valid = c.runs.filter(r => r.evaluation);
      escaped += valid.filter(r => r.evaluation.trap_escaped === 1).length;
      total += valid.length;
    }
    globalRates[cond] = total > 0 ? (escaped / total * 100).toFixed(0) : '?';
  }

  console.log('   ─────────────────────────────────────────────────────────────────');
  console.log(`   GLOBAL AVG            ${globalRates.CONSTRAINED.padStart(4)}%  ${globalRates.FREE_RESPONSE.padStart(4)}%  ${globalRates.FULL_COMPOSITION.padStart(4)}%`);

  console.log('\n2. KEY COMPARISONS:');
  console.log(`   CONSTRAINED:       ${globalRates.CONSTRAINED}%`);
  console.log(`   FREE_RESPONSE:     ${globalRates.FREE_RESPONSE}%`);
  console.log(`   FULL_COMPOSITION:  ${globalRates.FULL_COMPOSITION}%`);
  console.log(`   FULL vs CONSTRAINED: ${globalRates.FULL_COMPOSITION}% vs ${globalRates.CONSTRAINED}% (Δ=${globalRates.FULL_COMPOSITION - globalRates.CONSTRAINED}pp)`);

  // Per-problem
  console.log('\n3. PER-PROBLEM ESCAPE RATE:');
  for (const p of allResults) {
    const rates = {};
    for (const cond of CONDITIONS) {
      const c = p.conditions.find(c => c.condition === cond);
      if (!c) { rates[cond] = '?'; continue; }
      const valid = c.runs.filter(r => r.evaluation);
      rates[cond] = valid.length > 0 ? (valid.filter(r => r.evaluation.trap_escaped === 1).length / valid.length * 100).toFixed(0) : '0';
    }
    console.log(`   ${p.problem.padEnd(22)} [${p.trap.padEnd(16)}] CONST=${rates.CONSTRAINED}% FREE=${rates.FREE_RESPONSE}% FULL=${rates.FULL_COMPOSITION}%`);
  }

  // Verdict
  const fullRate = parseInt(globalRates.FULL_COMPOSITION);
  const constRate = parseInt(globalRates.CONSTRAINED);
  const freeRate = parseInt(globalRates.FREE_RESPONSE);

  console.log('\n══════════════════════════════════════════════════════════════════════');
  console.log('VERDICT');
  console.log('══════════════════════════════════════════════════════════════════════');

  if (fullRate > constRate + 20 && fullRate > freeRate + 20) {
    console.log('  ✓ STRUCTURAL TRAPS EXTEND BEYOND BINARY: Pipeline breaks multiple trap types.');
  } else if (freeRate > constRate + 20) {
    console.log('  ~ PARTIAL: Free response escapes some traps (different from binary dilemmas where FREE=0%).');
  } else {
    console.log('  ✗ TRAPS NOT CONFIRMED: Pipeline does not significantly improve escape rate.');
  }

  console.log(`\n  Results saved to ${resultsFile}`);
}

main().catch(console.error);
