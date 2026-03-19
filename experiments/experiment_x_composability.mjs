// ═══════════════════════════════════════════════════════════
// EXPERIMENT X: Composability Rules — Does Order Matter?
// Tests whether primitive ORDER affects output quality
// Same 3 primitives in 4 different orders
// ═══════════════════════════════════════════════════════════

import { config } from 'dotenv';
config({ override: true });

// ─── Config ───
const PROVIDERS = {
  claude: {
    model: 'claude-sonnet-4-20250514',
    call: async (system, user) => {
      const body = { model: 'claude-sonnet-4-20250514', max_tokens: 2000, temperature: 0.7, messages: [{ role: 'user', content: user }] };
      if (system) body.system = system;
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(`Anthropic: ${res.status} ${(await res.text()).slice(0, 200)}`);
      return (await res.json()).content[0].text;
    },
  },
};

const JUDGE_CALL = async (system, user) => {
  const body = { model: 'claude-sonnet-4-20250514', max_tokens: 500, temperature: 0, messages: [{ role: 'user', content: user }] };
  if (system) body.system = system;
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Judge: ${res.status} ${(await res.text()).slice(0, 200)}`);
  return (await res.json()).content[0].text;
};

// ─── Problems (same 5 from Exp W) ───
const PROBLEMS = [
  {
    id: 'stale_saas',
    domain: 'Business Growth',
    question: 'We are a B2B SaaS company with 50 employees, $5M ARR, and growth is slowing down. All the obvious strategies (more marketing, upselling, new features) have been tried. How can we reignite growth?',
  },
  {
    id: 'stale_education',
    domain: 'Education',
    question: 'Traditional university education is becoming less relevant for many careers, especially in tech. But alternatives (bootcamps, self-learning) lack credibility and depth. How should we fundamentally rethink education for the 2030s?',
  },
  {
    id: 'stale_hiring',
    domain: 'HR/Talent',
    question: 'Tech companies all use the same hiring process: resume screen, coding challenge, system design interview, culture fit. Everyone agrees it is broken but nobody has found a better alternative. How should we fundamentally rethink tech hiring?',
  },
  {
    id: 'stale_climate',
    domain: 'Environment',
    question: 'Individual actions (recycling, reducing flights) feel insignificant against climate change. Government policy is slow. Corporate pledges are often greenwashing. What approaches could actually make a meaningful difference?',
  },
  {
    id: 'stale_retention',
    domain: 'Management',
    question: 'Our best engineers keep leaving for competitors despite competitive salaries, good benefits, and interesting projects. Exit interviews say "better opportunity" but that is vague. How do we actually retain top engineering talent?',
  },
];

// ─── 4 Composition Orders ───
const ORDERS = {
  innovate: {
    name: 'INNOVATE (S→I→Syn)',
    pipeline: ['superpose', 'interfere', 'synthesize'],
    rulesFollowed: 'All rules followed',
  },
  scramble_1: {
    name: 'SCRAMBLE_1 (I→S→Syn)',
    pipeline: ['interfere', 'superpose', 'synthesize'],
    rulesFollowed: 'Violates: EXPAND before COLLIDE',
  },
  scramble_2: {
    name: 'SCRAMBLE_2 (S→Syn→I)',
    pipeline: ['superpose', 'synthesize', 'interfere'],
    rulesFollowed: 'Violates: CONVERGE at end',
  },
  scramble_3: {
    name: 'SCRAMBLE_3 (Syn→S→I)',
    pipeline: ['synthesize', 'superpose', 'interfere'],
    rulesFollowed: 'Violates: EXPAND before COLLIDE + CONVERGE at end',
  },
};

// ─── Prompt Builders ───
function buildPrompt(step, question, prevOutputs) {
  const prev = prevOutputs.length > 0 ? prevOutputs[prevOutputs.length - 1] : '';

  switch (step) {
    case 'superpose':
      if (prevOutputs.length === 0) {
        return {
          system: 'You generate genuinely diverse expert perspectives.',
          user: `Consider this from 3 very different expert perspectives:\n\n"${question}"\n\nExpert 1 — Systems thinker:\nExpert 2 — Contrarian:\nExpert 3 — Pragmatist focused on hidden constraints:`,
        };
      }
      return {
        system: 'You generate genuinely diverse expert perspectives based on prior analysis.',
        user: `Given this prior analysis:\n${prev}\n\nNow consider the original question from 3 very different expert perspectives:\n"${question}"\n\nExpert 1 — Systems thinker:\nExpert 2 — Contrarian:\nExpert 3 — Pragmatist:`,
      };

    case 'interfere':
      if (prevOutputs.length === 0) {
        return {
          system: 'You find what EMERGES when ideas collide.',
          user: `Consider this question: "${question}"\n\nGenerate 2 opposing viewpoints, then find:\n🔴 CONFLICT ZONES\n🟢 EMERGENT INSIGHTS that exist in neither viewpoint\n📊 Hidden shared assumption`,
        };
      }
      return {
        system: 'You find hidden patterns in contradictions.',
        user: `Prior analysis:\n${prev}\n\nOriginal question: "${question}"\n\nFind COLLISION POINTS:\n1. Contradictions within the analysis\n2. What all perspectives secretly AGREE on\n3. Hidden shared assumption`,
      };

    case 'synthesize':
      if (prevOutputs.length === 0) {
        return {
          system: 'You synthesize novel solutions.',
          user: `Question: "${question}"\n\nCreate a synthesis that:\n1. Goes beyond obvious answers\n2. Combines unexpected elements\n3. Is concrete and actionable\n4. Escapes conventional thinking entirely`,
        };
      }
      return {
        system: 'You synthesize insights into novel, actionable solutions.',
        user: `Prior analysis:\n${prev}\n\nOriginal question: "${question}"\n\nSynthesize a final answer that:\n1. Goes beyond what any single perspective could reach\n2. Combines unexpected elements from the analysis\n3. Is concrete and actionable\n4. Escapes conventional thinking entirely`,
      };

    default:
      throw new Error(`Unknown step: ${step}`);
  }
}

// ─── Judge ───
const JUDGE_SYSTEM = `You evaluate whether a response to a "stale problem" escapes conventional thinking.
Score on these dimensions:
- novel_solution (0-5): How novel/unexpected is the proposed solution? 0=completely conventional, 5=genuinely surprising
- emergent_components (0-5): How many ideas appear that weren't in the original question? 0=restates obvious, 5=rich emergent content
- actionability (1-5): How concrete and implementable? 1=vague platitude, 5=specific action plan
- conventional_escape (1-5): How well does it escape the "obvious" answers? 1=same as any consultant, 5=completely reframes the problem

Respond EXACTLY in this format:
NOVEL: [0-5]
EMERGENT: [0-5]
ACTIONABILITY: [1-5]
ESCAPE: [1-5]`;

function parseJudge(text) {
  const novel = parseInt(text.match(/NOVEL:\s*(\d)/)?.[1] || '0');
  const emergent = parseInt(text.match(/EMERGENT:\s*(\d)/)?.[1] || '0');
  const actionability = parseInt(text.match(/ACTIONABILITY:\s*(\d)/)?.[1] || '1');
  const escape = parseInt(text.match(/ESCAPE:\s*(\d)/)?.[1] || '1');
  return { novel, emergent, actionability, escape };
}

// ─── Run ───
async function main() {
  const providerName = process.argv[2] || 'claude';
  const problemFilter = process.argv[3] || 'all';
  const nRuns = parseInt(process.argv[4]) || 3;

  const provider = PROVIDERS[providerName];
  if (!provider) { console.error('Unknown provider:', providerName); process.exit(1); }

  const problems = problemFilter === 'all'
    ? PROBLEMS
    : PROBLEMS.filter(p => p.id === problemFilter);

  console.log('═══════════════════════════════════════════════════════════');
  console.log('EXPERIMENT X: COMPOSABILITY RULES — DOES ORDER MATTER?');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`Provider: ${providerName} (${provider.model})`);
  console.log(`N = ${nRuns} per condition`);
  console.log(`Orders: ${Object.keys(ORDERS).join(', ')}`);
  console.log(`Problems: ${problems.length}`);
  console.log();

  const fs = await import('fs');
  const resultsFile = `experiments/results_x_composability_${providerName}.json`;
  let allResults = {};
  try { allResults = JSON.parse(fs.readFileSync(resultsFile, 'utf8')); } catch (e) {}

  for (const problem of problems) {
    if (allResults[problem.id]) {
      console.log(`SKIPPING ${problem.id} (already completed)\n`);
      continue;
    }

    console.log(`PROBLEM: ${problem.id} — ${problem.domain}`);
    const problemResults = {};

    for (const [orderId, order] of Object.entries(ORDERS)) {
      console.log(`  ${order.name}:`);
      const runs = [];

      for (let r = 0; r < nRuns; r++) {
        process.stdout.write(`    run ${r + 1}/${nRuns}...`);
        try {
          // Execute pipeline
          const outputs = [];
          for (const step of order.pipeline) {
            const { system, user } = buildPrompt(step, problem.question, outputs);
            const result = await provider.call(system, user);
            outputs.push(result);
          }
          const finalOutput = outputs[outputs.length - 1];

          // Judge
          const judgeResult = await JUDGE_CALL(JUDGE_SYSTEM,
            `Original question: "${problem.question}"\n\nResponse to evaluate:\n${finalOutput}`
          );
          const scores = parseJudge(judgeResult);
          runs.push(scores);
          console.log(` novel=${scores.novel} emergent=${scores.emergent} action=${scores.actionability} escape=${scores.escape}`);
        } catch (err) {
          console.log(` ERROR: ${err.message.slice(0, 100)}`);
          runs.push({ novel: -1, emergent: -1, actionability: -1, escape: -1 });
        }
      }

      const valid = runs.filter(r => r.novel >= 0);
      const avg = (arr, key) => (arr.reduce((s, r) => s + r[key], 0) / arr.length).toFixed(1);
      if (valid.length > 0) {
        console.log(`    → Novel: ${avg(valid, 'novel')} | Emergent: ${avg(valid, 'emergent')} | Action: ${avg(valid, 'actionability')} | Escape: ${avg(valid, 'escape')} (n=${valid.length})`);
      }
      console.log();

      problemResults[orderId] = runs;
    }

    allResults[problem.id] = problemResults;
    fs.writeFileSync(resultsFile, JSON.stringify(allResults, null, 2));
    console.log(`  → Saved\n`);
  }

  // ─── Analysis ───
  console.log('\n══════════════════════════════════════════════════════════════════════');
  console.log('ANALYSIS — COMPOSABILITY RULES');
  console.log('══════════════════════════════════════════════════════════════════════\n');

  const orderIds = Object.keys(ORDERS);
  const metrics = ['novel', 'emergent', 'actionability', 'escape'];

  // Average per order across all problems
  const orderAvgs = {};
  for (const orderId of orderIds) {
    const allScores = [];
    for (const probResults of Object.values(allResults)) {
      if (probResults[orderId]) {
        allScores.push(...probResults[orderId].filter(r => r.novel >= 0));
      }
    }
    orderAvgs[orderId] = {};
    for (const m of metrics) {
      orderAvgs[orderId][m] = allScores.length > 0
        ? (allScores.reduce((s, r) => s + r[m], 0) / allScores.length).toFixed(1)
        : '?';
    }
  }

  console.log('1. AVERAGE SCORES BY ORDER:');
  console.log('   ' + '─'.repeat(65));
  console.log('   ' + 'Order'.padEnd(30) + metrics.map(m => m.substring(0, 8).padEnd(10)).join(''));
  console.log('   ' + '─'.repeat(65));
  for (const orderId of orderIds) {
    const order = ORDERS[orderId];
    console.log('   ' + order.name.padEnd(30) + metrics.map(m => (orderAvgs[orderId][m] + '').padEnd(10)).join(''));
  }
  console.log('   ' + '─'.repeat(65));

  // Key comparison
  const innov = orderAvgs.innovate;
  const s1 = orderAvgs.scramble_1;
  const s2 = orderAvgs.scramble_2;
  const s3 = orderAvgs.scramble_3;

  console.log('\n2. KEY COMPARISONS (escape score):');
  console.log(`   INNOVATE (S→I→Syn):     ${innov.escape}`);
  console.log(`   SCRAMBLE_1 (I→S→Syn):   ${s1.escape}  (Δ=${(s1.escape - innov.escape).toFixed(1)})`);
  console.log(`   SCRAMBLE_2 (S→Syn→I):   ${s2.escape}  (Δ=${(s2.escape - innov.escape).toFixed(1)})`);
  console.log(`   SCRAMBLE_3 (Syn→S→I):   ${s3.escape}  (Δ=${(s3.escape - innov.escape).toFixed(1)})`);

  console.log('\n3. COMPOSABILITY RULES VERDICT:');
  const innovEsc = parseFloat(innov.escape);
  const avgScramble = (parseFloat(s1.escape) + parseFloat(s2.escape) + parseFloat(s3.escape)) / 3;
  if (innovEsc > avgScramble + 0.5) {
    console.log('  ✓ ORDER MATTERS: INNOVATE significantly outperforms scrambled orders.');
    console.log('    → Composability rules CONFIRMED: EXPAND before COLLIDE, CONVERGE at end.');
  } else if (innovEsc > avgScramble) {
    console.log('  ~ ORDER MATTERS SLIGHTLY: INNOVATE marginally outperforms scrambled orders.');
    console.log('    → Composability rules PARTIALLY confirmed.');
  } else {
    console.log('  ✗ ORDER DOES NOT MATTER: Scrambled orders perform similarly to INNOVATE.');
    console.log('    → Composability rules NOT confirmed — primitives may be order-independent.');
  }

  console.log(`\n  Results saved to ${resultsFile}`);
}

main().catch(console.error);
