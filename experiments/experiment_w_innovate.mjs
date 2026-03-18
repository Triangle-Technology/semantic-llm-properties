/**
 * EXPERIMENT W: INNOVATE Composition — Second Composition Proof
 *
 * Hypothesis: INNOVATE = SUPERPOSE → INTERFERE → SYNTHESIZE (3 primitives)
 * solves a DIFFERENT problem class (innovation/novel solutions) than DISSOLVE
 * (structural trap detection).
 *
 * If INNOVATE outperforms baseline on novelty → second composition confirmed
 * → Semantic Computing is a PARADIGM, not just a technique.
 *
 * Usage:
 *   node experiments/experiment_w_innovate.mjs claude all 5
 *   node experiments/experiment_w_innovate.mjs claude stale_saas 3   # sanity check
 */

import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import fs from 'fs';
import { config } from 'dotenv';
config({ override: true });

// ─── Config ───
const MODELS = {
  claude: 'claude-sonnet-4-20250514',
  gpt: 'gpt-4o-mini',
  gemini: 'gemini-2.5-flash',
};

const JUDGE_MODEL = 'claude-sonnet-4-20250514';

// ─── Problems: "Stale" problems where conventional thinking is stuck ───
const PROBLEMS = [
  {
    id: 'stale_saas',
    domain: 'Business Growth',
    difficulty: 'MEDIUM',
    problem: 'A B2B SaaS company with 50 employees and $5M ARR is experiencing slowing growth. Customer acquisition cost is rising, churn is stable at 5% monthly, and the market is becoming commoditized. How should they reignite growth?',
    conventional_answers: ['increase marketing spend', 'upsell existing customers', 'expand to enterprise', 'reduce pricing', 'add features'],
    what_makes_it_stale: 'Every SaaS consultant gives the same 5 answers. The problem is not lack of options but lack of NOVEL options.',
  },
  {
    id: 'stale_education',
    domain: 'Education Reform',
    difficulty: 'HARD',
    problem: 'University lecture attendance is declining globally despite rising tuition. Students prefer online content but employers still value degrees. How should a mid-tier university adapt?',
    conventional_answers: ['more online courses', 'hybrid model', 'reduce tuition', 'partner with industry', 'improve campus experience'],
    what_makes_it_stale: 'Every education reformer suggests the same hybrid model. Nobody questions what a "university" fundamentally is.',
  },
  {
    id: 'stale_hiring',
    domain: 'Talent Acquisition',
    difficulty: 'MEDIUM',
    problem: 'A tech startup cannot compete with FAANG salaries to hire senior engineers. They have interesting problems but limited budget ($120k max vs $300k+ at big tech). How do they attract top talent?',
    conventional_answers: ['offer equity', 'emphasize mission', 'remote work', 'faster promotion', 'interesting tech stack'],
    what_makes_it_stale: 'Every startup gives the same equity+mission pitch. Senior engineers have heard it 100 times.',
  },
  {
    id: 'stale_climate',
    domain: 'Climate Action',
    difficulty: 'HARD',
    problem: 'A mid-size city (500k population) wants to reduce carbon emissions 40% by 2030 but has limited budget and political resistance to new taxes or regulations. What should they do?',
    conventional_answers: ['public transit expansion', 'EV incentives', 'building efficiency standards', 'renewable energy procurement', 'bike lanes'],
    what_makes_it_stale: 'Every city climate plan has the same 5 pillars. Few cities actually achieve their targets.',
  },
  {
    id: 'stale_retention',
    domain: 'Employee Retention',
    difficulty: 'MEDIUM',
    problem: 'A consulting firm is losing mid-level consultants (3-5 years experience) at 30% annual rate. They leave for tech companies or start their own firms. Exit interviews cite "burnout" and "lack of growth." How to retain them?',
    conventional_answers: ['higher compensation', 'reduced hours', 'sabbaticals', 'clearer promotion path', 'mentorship programs'],
    what_makes_it_stale: 'Every consulting firm tries these exact things. The industry-wide attrition rate barely changes.',
  },
];

// ─── Conditions ───
const CONDITIONS = {
  DIRECT: {
    name: 'DIRECT',
    description: 'Single prompt, straightforward question',
    buildPrompt: (problem) => ({
      system: 'You are a strategic advisor. Provide your best recommendation.',
      user: `${problem.problem}\n\nWhat would you recommend? Be specific and actionable.`,
    }),
  },
  FREE_BRAINSTORM: {
    name: 'FREE_BRAINSTORM',
    description: 'Single prompt, explicitly asked to be creative/novel',
    buildPrompt: (problem) => ({
      system: 'You are a creative strategist known for unconventional thinking. Your job is to find solutions that nobody else has thought of.',
      user: `${problem.problem}\n\nI need truly NOVEL solutions — not the usual advice. Think outside the box. What unconventional approaches could work here? Be specific and actionable.`,
    }),
  },
  INNOVATE: {
    name: 'INNOVATE',
    description: 'SUPERPOSE → INTERFERE → SYNTHESIZE (3-step composition)',
    steps: ['superpose', 'interfere', 'synthesize'],
  },
};

// ─── INNOVATE Pipeline Prompts ───
function innovateSuperpose(problem) {
  return {
    system: 'You generate genuinely diverse expert perspectives. Each must be fundamentally different — not just different emphasis on the same approach.',
    user: `Consider this challenge from 3 very different expert angles. Each expert should see something the others completely miss.

Challenge: "${problem.problem}"

Expert 1 — A systems thinker who sees hidden feedback loops and second-order effects:
Expert 2 — A contrarian from a completely different industry who sees analogies others miss:
Expert 3 — A radical innovator who questions whether the problem itself is correctly defined:

For each, provide 3-4 sentences capturing their unique insight.`,
  };
}

function innovateInterfere(problem, perspectives) {
  return {
    system: 'You find what EMERGES when ideas collide — insights that exist in NONE of the inputs alone. Focus on the unexpected.',
    user: `Three experts analyzed this challenge: "${problem.problem}"

Their perspectives:
${perspectives}

Now find the COLLISIONS:

🔴 CONTRADICTIONS: Where do these experts fundamentally disagree?

🟢 EMERGENT IDEAS: What NEW solutions appear when you combine elements from different perspectives that no single expert would propose? These must be genuinely novel — not just "do both" or "compromise."

🌟 UNEXPECTED CONNECTIONS: What surprising link exists between seemingly unrelated aspects of their analyses?

Focus on ideas that are GENUINELY NEW — not present in any single perspective.`,
  };
}

function innovateSynthesize(problem, perspectives, interference) {
  return {
    system: 'You synthesize collision insights into concrete, actionable, NOVEL strategies. The output must contain ideas that did not exist in any input.',
    user: `Challenge: "${problem.problem}"

Expert perspectives:
${perspectives}

Collision analysis:
${interference}

Synthesize into 2-3 NOVEL strategies. Each strategy must:
1. Be genuinely new — not the conventional wisdom (conventional answers for this problem include: ${problem.conventional_answers.join(', ')})
2. Combine elements from multiple perspectives in a non-obvious way
3. Be specific enough to act on (who does what, when, how)
4. Explain WHY this is different from conventional approaches

For each strategy, mark it: [NOVEL] if it doesn't appear in the conventional list, [VARIANT] if it's a meaningful twist on conventional wisdom.`,
  };
}

// ─── Judge Prompt ───
function judgePrompt(problem, response, condition) {
  return {
    system: `You are a strict innovation judge. You evaluate whether proposed solutions are genuinely novel or just conventional wisdom repackaged. Be harsh — most "creative" suggestions are actually conventional.

Known conventional answers for this problem: ${problem.conventional_answers.join(', ')}

Score conservatively. A solution is only "novel" if it would surprise an expert in the field.`,
    user: `Problem: "${problem.problem}"

Condition: ${condition}

Response to evaluate:
"""
${response}
"""

Evaluate strictly:

NOVEL_SOLUTIONS: How many genuinely novel solutions are proposed (not variants of: ${problem.conventional_answers.join(', ')})? Count only solutions that would surprise a domain expert.
Answer as integer: 0, 1, 2, 3, or more.

EMERGENT_COMPONENTS: How many ideas appear that are clearly combinations of multiple perspectives (not present in any single viewpoint)?
Answer as integer: 0, 1, 2, 3, or more.

ACTIONABILITY: How specific and actionable are the proposals?
Score 1-5 (1=vague platitudes, 5=ready to implement tomorrow).

CONVENTIONAL_ESCAPE: Did the response break free from the conventional answer space?
Score 1-5 (1=entirely conventional, 5=completely novel frame).

Format your response EXACTLY as:
NOVEL_SOLUTIONS: [number]
EMERGENT_COMPONENTS: [number]
ACTIONABILITY: [number]
CONVENTIONAL_ESCAPE: [number]`,
  };
}

// ─── API Callers ───
async function callClaude(systemPrompt, userPrompt, options = {}) {
  const client = new Anthropic();
  const msg = await client.messages.create({
    model: options.model || MODELS.claude,
    max_tokens: 2000,
    temperature: options.temperature ?? 0.7,
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }],
  });
  return msg.content[0].text;
}

async function callGPT(systemPrompt, userPrompt, options = {}) {
  const client = new OpenAI();
  const resp = await client.chat.completions.create({
    model: options.model || MODELS.gpt,
    temperature: options.temperature ?? 0.7,
    max_tokens: 2000,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
  });
  return resp.choices[0].message.content;
}

async function callGemini(systemPrompt, userPrompt, options = {}) {
  const model = options.model || MODELS.gemini;
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: systemPrompt + '\n\n' + userPrompt }] }],
        generationConfig: { temperature: options.temperature ?? 0.7, maxOutputTokens: 2000 },
      }),
    }
  );
  const data = await res.json();
  return data.candidates[0].content.parts[0].text;
}

function getCallFn(provider) {
  if (provider === 'claude') return callClaude;
  if (provider === 'gpt') return callGPT;
  if (provider === 'gemini') return callGemini;
  throw new Error(`Unknown provider: ${provider}`);
}

// ─── Parse Judge Response ───
function parseJudge(text) {
  const novel = parseInt(text.match(/NOVEL_SOLUTIONS:\s*(\d+)/)?.[1] || '-1');
  const emergent = parseInt(text.match(/EMERGENT_COMPONENTS:\s*(\d+)/)?.[1] || '-1');
  const actionability = parseInt(text.match(/ACTIONABILITY:\s*(\d+)/)?.[1] || '-1');
  const escape = parseInt(text.match(/CONVENTIONAL_ESCAPE:\s*(\d+)/)?.[1] || '-1');
  return { novel_solutions: novel, emergent_components: emergent, actionability, conventional_escape: escape };
}

// ─── Main Runner ───
async function main() {
  const [,, provider = 'claude', problemFilter = 'all', nStr = '5'] = process.argv;
  const N = parseInt(nStr);
  const callFn = getCallFn(provider);

  const problems = problemFilter === 'all'
    ? PROBLEMS
    : PROBLEMS.filter(p => p.id === problemFilter);

  if (problems.length === 0) {
    console.error(`No problems matching: ${problemFilter}`);
    console.log('Available:', PROBLEMS.map(p => p.id).join(', '));
    process.exit(1);
  }

  console.log('═══════════════════════════════════════════════════════════');
  console.log('EXPERIMENT W: INNOVATE COMPOSITION — SECOND COMPOSITION PROOF');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`Provider: ${provider} (${MODELS[provider]})`);
  console.log(`Judge: ${JUDGE_MODEL}`);
  console.log(`N = ${N} per condition`);
  console.log(`Problems: ${problemFilter} (${problems.length})`);
  console.log();

  // Load existing results for resume
  const resultsFile = `experiments/results_w_innovate_${provider}.json`;
  let allResults = { provider, model: MODELS[provider], judge: JUDGE_MODEL, nRuns: N, results: [] };
  if (fs.existsSync(resultsFile)) {
    allResults = JSON.parse(fs.readFileSync(resultsFile, 'utf8'));
    console.log(`Resuming: found ${allResults.results.length} existing problem results\n`);
  }

  for (const problem of problems) {
    // Check resume
    const existing = allResults.results.find(r => r.problem === problem.id);
    if (existing && existing.conditions.every(c => c.runs.length >= N)) {
      console.log(`\nSKIPPING ${problem.id} (already completed)`);
      continue;
    }

    console.log(`PROBLEM: ${problem.id} [${problem.difficulty}] — ${problem.domain}`);

    const problemResult = existing || { problem: problem.id, difficulty: problem.difficulty, domain: problem.domain, conditions: [] };

    for (const [condName, cond] of Object.entries(CONDITIONS)) {
      let condResult = problemResult.conditions.find(c => c.condition === condName);
      if (condResult && condResult.runs.length >= N) {
        console.log(`  ${condName}: already completed`);
        continue;
      }
      if (!condResult) {
        condResult = { condition: condName, runs: [] };
        problemResult.conditions.push(condResult);
      }

      console.log(`  ${condName}:`);

      const startRun = condResult.runs.length;
      for (let r = startRun; r < N; r++) {
        process.stdout.write(`    run ${r + 1}/${N}... `);
        try {
          let response;

          if (condName === 'INNOVATE') {
            // 3-step pipeline: SUPERPOSE → INTERFERE → SYNTHESIZE
            const { system: s1, user: u1 } = innovateSuperpose(problem);
            const perspectives = await callFn(s1, u1);

            const { system: s2, user: u2 } = innovateInterfere(problem, perspectives);
            const interference = await callFn(s2, u2);

            const { system: s3, user: u3 } = innovateSynthesize(problem, perspectives, interference);
            response = await callFn(s3, u3);
          } else {
            // Single prompt
            const { system, user } = cond.buildPrompt(problem);
            response = await callFn(system, user);
          }

          // Judge
          const { system: jSys, user: jUser } = judgePrompt(problem, response, condName);
          const judgeResp = await callClaude(jSys, jUser, { temperature: 0, model: JUDGE_MODEL });
          const scores = parseJudge(judgeResp);

          console.log(`novel=${scores.novel_solutions} emergent=${scores.emergent_components} action=${scores.actionability} escape=${scores.conventional_escape}`);

          condResult.runs.push({
            run: r + 1,
            response: response.substring(0, 500), // truncate for storage
            evaluation: scores,
            raw: judgeResp,
          });
        } catch (err) {
          console.log(`ERROR: ${err.message.substring(0, 100)}`);
          condResult.runs.push({ run: r + 1, error: err.message.substring(0, 200) });
        }
      }

      const validRuns = condResult.runs.filter(r => r.evaluation && r.evaluation.novel_solutions >= 0);
      if (validRuns.length > 0) {
        const avgNovel = (validRuns.reduce((s, r) => s + r.evaluation.novel_solutions, 0) / validRuns.length).toFixed(1);
        const avgEmergent = (validRuns.reduce((s, r) => s + r.evaluation.emergent_components, 0) / validRuns.length).toFixed(1);
        const avgAction = (validRuns.reduce((s, r) => s + r.evaluation.actionability, 0) / validRuns.length).toFixed(1);
        const avgEscape = (validRuns.reduce((s, r) => s + r.evaluation.conventional_escape, 0) / validRuns.length).toFixed(1);
        console.log(`    → Novel: ${avgNovel} | Emergent: ${avgEmergent} | Action: ${avgAction} | Escape: ${avgEscape} (n=${validRuns.length})`);
      }
    }

    // Save after each problem
    if (!existing) allResults.results.push(problemResult);
    fs.writeFileSync(resultsFile, JSON.stringify(allResults, null, 2));
    console.log(`  → Saved to ${resultsFile}`);
  }

  // ─── Analysis ───
  console.log('\n\n══════════════════════════════════════════════════════════════════════');
  console.log('ANALYSIS — INNOVATE COMPOSITION');
  console.log('══════════════════════════════════════════════════════════════════════\n');

  const metrics = ['novel_solutions', 'emergent_components', 'actionability', 'conventional_escape'];
  const condNames = ['DIRECT', 'FREE_BRAINSTORM', 'INNOVATE'];

  console.log('1. AVERAGE SCORES BY CONDITION:');
  console.log('   ' + '─'.repeat(65));
  console.log('   ' + 'Condition'.padEnd(20) + metrics.map(m => m.substring(0, 8).padEnd(10)).join(''));
  console.log('   ' + '─'.repeat(65));

  const globalAvgs = {};
  for (const cName of condNames) {
    const allRuns = [];
    for (const p of allResults.results) {
      const c = p.conditions.find(c => c.condition === cName);
      if (c) allRuns.push(...c.runs.filter(r => r.evaluation));
    }
    if (allRuns.length === 0) continue;

    const avgs = {};
    for (const m of metrics) {
      avgs[m] = (allRuns.reduce((s, r) => s + (r.evaluation[m] || 0), 0) / allRuns.length).toFixed(2);
    }
    globalAvgs[cName] = avgs;
    console.log('   ' + cName.padEnd(20) + metrics.map(m => avgs[m].padEnd(10)).join(''));
  }
  console.log('   ' + '─'.repeat(65));

  console.log('\n2. KEY COMPARISONS:');
  if (globalAvgs.DIRECT && globalAvgs.INNOVATE) {
    const dNovel = parseFloat(globalAvgs.DIRECT.novel_solutions);
    const iNovel = parseFloat(globalAvgs.INNOVATE.novel_solutions);
    const dEscape = parseFloat(globalAvgs.DIRECT.conventional_escape);
    const iEscape = parseFloat(globalAvgs.INNOVATE.conventional_escape);
    const dEmergent = parseFloat(globalAvgs.DIRECT.emergent_components);
    const iEmergent = parseFloat(globalAvgs.INNOVATE.emergent_components);

    console.log(`   INNOVATE vs DIRECT (novel):    ${iNovel} vs ${dNovel} (Δ=${(iNovel - dNovel).toFixed(2)})`);
    console.log(`   INNOVATE vs DIRECT (escape):   ${iEscape} vs ${dEscape} (Δ=${(iEscape - dEscape).toFixed(2)})`);
    console.log(`   INNOVATE vs DIRECT (emergent): ${iEmergent} vs ${dEmergent} (Δ=${(iEmergent - dEmergent).toFixed(2)})`);
  }
  if (globalAvgs.FREE_BRAINSTORM && globalAvgs.INNOVATE) {
    const bNovel = parseFloat(globalAvgs.FREE_BRAINSTORM.novel_solutions);
    const iNovel = parseFloat(globalAvgs.INNOVATE.novel_solutions);
    console.log(`   INNOVATE vs BRAINSTORM (novel): ${iNovel} vs ${bNovel} (Δ=${(iNovel - bNovel).toFixed(2)})`);
  }

  // Verdict
  console.log('\n══════════════════════════════════════════════════════════════════════');
  console.log('VERDICT');
  console.log('══════════════════════════════════════════════════════════════════════');

  if (globalAvgs.DIRECT && globalAvgs.INNOVATE) {
    const iNovel = parseFloat(globalAvgs.INNOVATE.novel_solutions);
    const dNovel = parseFloat(globalAvgs.DIRECT.novel_solutions);
    const iEscape = parseFloat(globalAvgs.INNOVATE.conventional_escape);
    const dEscape = parseFloat(globalAvgs.DIRECT.conventional_escape);

    const novelWin = iNovel > dNovel + 0.5;
    const escapeWin = iEscape > dEscape + 0.5;

    if (novelWin && escapeWin) {
      console.log('  ✓ SECOND COMPOSITION CONFIRMED: INNOVATE produces more novel solutions');
      console.log('    AND escapes conventional thinking better than direct prompting.');
      console.log('    → Semantic Computing is a PARADIGM, not just a technique.');
    } else if (novelWin || escapeWin) {
      console.log('  ~ PARTIAL: INNOVATE shows advantage on some metrics but not all.');
      console.log('    → Promising but needs further investigation.');
    } else {
      console.log('  ✗ SECOND COMPOSITION NOT CONFIRMED: INNOVATE does not outperform baseline.');
      console.log('    → DISSOLVE may be the only effective composition (technique, not paradigm).');
    }
  }

  console.log(`\n  Results saved to ${resultsFile}`);
}

main().catch(console.error);
