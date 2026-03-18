// ═══════════════════════════════════════════════════════════
// SEMANTIC COMPUTER v2 — Dynamic Pipeline Backend
// Accepts any combination/order of 5 semantic primitives
// ═══════════════════════════════════════════════════════════

// ─── Model Type Classification ───
const MODEL_TYPES = {
  'anthropic': { type: 'Type-M_strong', label: 'Claude (Meta-Constructive Strong)', dissolutionRate: '81%' },
  'openai':    { type: 'Type-D',        label: 'GPT (Destructive Interference)',    dissolutionRate: '64%' },
  'google':    { type: 'Type-M_mod',    label: 'Gemini (Meta-Constructive Moderate)', dissolutionRate: '50%' },
};

const OPTIMAL_ROUTING = {
  superpose:  'any',
  interfere:  'any',
  reframe:    'Type-M',
  synthesize: 'Type-M_strong',
  validate:   'any',
};

function detectProvider(apiKey) {
  if (!apiKey) return null;
  if (apiKey.startsWith('sk-ant-')) return 'anthropic';
  if (apiKey.startsWith('sk-')) return 'openai';
  if (apiKey.length > 30 && !apiKey.startsWith('sk')) return 'google';
  return null;
}

// ─── LLM API Call ───
async function callLLM(provider, apiKey, systemPrompt, userPrompt, options = {}) {
  const temp = options.temperature ?? 0.7;
  const maxTokens = options.maxTokens ?? 2000;

  if (provider === 'anthropic') {
    const body = {
      model: options.model || 'claude-sonnet-4-20250514',
      max_tokens: maxTokens, temperature: temp,
      messages: [{ role: 'user', content: userPrompt }],
    };
    if (systemPrompt) body.system = systemPrompt;
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`Anthropic: ${res.status} ${(await res.text()).slice(0, 200)}`);
    return (await res.json()).content[0].text;
  }

  if (provider === 'openai') {
    const messages = [];
    if (systemPrompt) messages.push({ role: 'system', content: systemPrompt });
    messages.push({ role: 'user', content: userPrompt });
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify({ model: options.model || 'gpt-4o-mini', messages, temperature: temp, max_tokens: maxTokens }),
    });
    if (!res.ok) throw new Error(`OpenAI: ${res.status} ${(await res.text()).slice(0, 200)}`);
    return (await res.json()).choices[0].message.content;
  }

  if (provider === 'google') {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${options.model || 'gemini-2.0-flash'}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: (systemPrompt ? systemPrompt + '\n\n' : '') + userPrompt }] }],
          generationConfig: { temperature: temp, maxOutputTokens: maxTokens },
        }),
      }
    );
    if (!res.ok) throw new Error(`Google: ${res.status} ${(await res.text()).slice(0, 200)}`);
    return (await res.json()).candidates[0].content.parts[0].text;
  }

  throw new Error(`Unknown provider: ${provider}`);
}

// ─── Route step to optimal model ───
function routeStep(step, keys) {
  const requirement = OPTIMAL_ROUTING[step] || 'any';
  const providers = Object.entries(keys).filter(([, v]) => v).map(([k]) => k);
  if (providers.length === 0) throw new Error('No API keys');

  if (requirement === 'any') {
    for (const pref of ['openai', 'google', 'anthropic']) {
      if (providers.includes(pref)) return pref;
    }
  }
  if (requirement === 'Type-M_strong') {
    if (providers.includes('anthropic')) return 'anthropic';
    if (providers.includes('google')) return 'google';
  }
  if (requirement === 'Type-M') {
    if (providers.includes('anthropic')) return 'anthropic';
    if (providers.includes('google')) return 'google';
  }
  return providers[0];
}

// ─── SSE Helper ───
function sse(event, data) { return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`; }

// ═══════════════════════════════════════════════════════════
// PROMPT GENERATORS — Each primitive creates a prompt from
// the user's original input + previous step outputs
// ═══════════════════════════════════════════════════════════

function buildPrompt(step, originalInput, prevOutputs) {
  const prev = prevOutputs.length > 0 ? prevOutputs[prevOutputs.length - 1].content : '';
  const allPrev = prevOutputs.map(p => `[${p.step.toUpperCase()}]: ${p.content}`).join('\n\n');
  const topic = originalInput.input || originalInput.problem || '';

  switch (step) {
    case 'superpose': {
      if (originalInput.ideaA) {
        // Started with interfere input but superpose is first
        return {
          system: 'You generate genuinely diverse expert perspectives. Each must be fundamentally different.',
          user: `Explore this from 3 very different expert angles:\n\n"${originalInput.ideaA}" vs "${originalInput.ideaB}"\n\nFor each perspective, provide a 2-3 sentence analysis of what they see that others miss.\n\nExpert 1 — Systems thinker:\nExpert 2 — Contrarian:\nExpert 3 — Pragmatist focused on hidden constraints:`,
        };
      }
      return {
        system: 'You generate genuinely diverse expert perspectives. Each must be fundamentally different — not just different emphasis.',
        user: `Consider this from 3 very different expert perspectives. For each, provide a 2-3 sentence analysis.\n\nQuestion: "${topic}"\n\nExpert 1 — Systems thinker who sees interconnections:\nExpert 2 — Contrarian who challenges conventional wisdom:\nExpert 3 — Pragmatist focused on hidden constraints:`,
      };
    }

    case 'interfere': {
      if (originalInput.ideaA && prevOutputs.length === 0) {
        // Interfere is first step, user provided two ideas
        return {
          system: 'You find what EMERGES when ideas collide — insights that exist in neither input alone.',
          user: `Two ideas collide:\n\nIDEA A: "${originalInput.ideaA}"\nIDEA B: "${originalInput.ideaB}"\n\n🔴 CONFLICT ZONES: Where do they fundamentally contradict?\n🟢 EMERGENT INSIGHTS: What NEW ideas emerge from this collision that exist in NEITHER input?\n📊 What hidden assumption do both ideas secretly share?`,
        };
      }
      // Interfere after previous steps
      return {
        system: 'You find hidden patterns in contradictions and shared blind spots.',
        user: `Original topic: "${topic}"\n\nPrevious analysis:\n${prev}\n\nNow find the COLLISION POINTS:\n1. What contradictions exist within this analysis?\n2. What do all perspectives secretly AGREE on without stating it?\n3. What hidden assumption is everyone trapped in?`,
      };
    }

    case 'reframe': {
      const lens = originalInput.lens || '';
      if (prevOutputs.length === 0 && lens) {
        // Reframe is first step with lens
        return {
          system: 'You see problems through completely different lenses, revealing what was invisible before.',
          user: `PROBLEM: "${topic}"\nNEW LENS: "${lens}"\n\nReframe this problem through this lens:\n1. What looks completely different when viewed this way?\n2. What was invisible before that's now obvious?\n3. What new solutions become available?\n4. Why do people get stuck on this problem?`,
        };
      }
      // Reframe after previous steps
      return {
        system: 'You break frames. You see what everyone else misses — the invisible assumptions that constrain thinking.',
        user: `Original topic: "${topic}"\n\nAnalysis so far:\n${prev}\n\nBased on what's been discovered, REFRAME the original question:\n1. What hidden assumption makes the original framing misleading?\n2. What question SHOULD we be asking instead?\n3. Why does the original framing make this assumption invisible?`,
      };
    }

    case 'synthesize': {
      if (prevOutputs.length === 0) {
        // Synthesize is first step — user provided perspectives
        return {
          system: 'You combine perspectives into a coherent whole that is MORE than the sum of parts — not compromise, but elevation.',
          user: `Synthesize these perspectives:\n\n${originalInput.input || originalInput.problem}\n\nCreate a synthesis that:\n1. Honors the core truth in each perspective\n2. Resolves contradictions by finding a higher-level frame\n3. Produces an insight none of the individual perspectives could reach alone\n4. Is concrete and actionable`,
        };
      }
      return {
        system: 'You synthesize insights into clear, actionable answers. Combine without losing depth.',
        user: `Original topic: "${topic}"\n\nAll analysis:\n${allPrev}\n\nProvide a final synthesis:\n1. **Hidden Assumption**: Name it explicitly in one sentence.\n2. **Alternative Approach**: What should we do instead? Be specific and actionable.\n3. **Why It Was Invisible**: Why do people naturally miss this? (1-2 sentences)`,
      };
    }

    case 'validate': {
      const target = prev || originalInput.input || originalInput.problem;
      return {
        system: 'You are an adversarial evaluator. Find weaknesses. Be genuinely critical.',
        user: `Evaluate this with ADVERSARIAL skepticism:\n\n"${target}"\n\n1. **Genuine or Artificial?** Score 1-5 (1=platitude, 5=genuinely novel)\n2. **Hidden Weaknesses**: What flaws does the author probably not see?\n3. **Counter-evidence**: What would DISPROVE this?\n4. **Circular Reasoning Check**: Does it assume what it claims to prove?\n5. **Verdict**: GENUINE, PARTIALLY GENUINE, or ARTIFICIAL — one sentence.`,
      };
    }

    default:
      throw new Error(`Unknown primitive: ${step}`);
  }
}

// ═══════════════════════════════════════════════════════════
// MAIN HANDLER — Dynamic pipeline execution
// ═══════════════════════════════════════════════════════════

async function handleCompute(request) {
  const body = await request.json();
  const { pipeline, keys } = body;

  if (!pipeline || pipeline.length === 0) return new Response('Empty pipeline', { status: 400 });
  const providers = Object.entries(keys || {}).filter(([, v]) => v);
  if (providers.length === 0) return new Response('No API keys', { status: 400 });

  const primaryProvider = providers.map(([k]) => k).find(k => keys[k]) || providers[0][0];
  const modelInfo = MODEL_TYPES[primaryProvider] || {};
  const multiModel = providers.length > 1;

  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();
  const enc = new TextEncoder();
  const write = (event, data) => writer.write(enc.encode(sse(event, data)));

  const originalInput = { input: body.input, ideaA: body.ideaA, ideaB: body.ideaB, problem: body.problem, lens: body.lens };

  const run = async () => {
    try {
      await write('model_info', { ...modelInfo, multiModel });

      const stepOutputs = [];

      for (let i = 0; i < pipeline.length; i++) {
        const step = pipeline[i];
        const provider = multiModel ? routeStep(step, keys) : primaryProvider;
        const apiKey = keys[provider];

        await write('step', { index: i, step, status: 'running', model: provider });

        const { system, user } = buildPrompt(step, originalInput, stepOutputs);
        const result = await callLLM(provider, apiKey, system, user);

        stepOutputs.push({ step, content: result });
        await write('step', { index: i, step, status: 'done', content: result, model: provider });
      }

      await write('done', {
        success: true,
        routing: multiModel ? 'cross-model orchestrated' : 'single-model',
        steps: pipeline.length,
      });
    } catch (err) {
      await write('error', { message: err.message });
    } finally {
      writer.close();
    }
  };

  run();
  return new Response(readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

// ─── Router ───
export default {
  async fetch(request) {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }

    if (request.method === 'GET' && url.pathname === '/') {
      return new Response('Semantic Computer API v2.0 — Dynamic Pipeline', {
        headers: { 'Access-Control-Allow-Origin': '*' },
      });
    }

    if (request.method === 'POST' && url.pathname === '/api/compute') {
      return handleCompute(request);
    }

    return new Response('Not found', { status: 404, headers: { 'Access-Control-Allow-Origin': '*' } });
  },
};
