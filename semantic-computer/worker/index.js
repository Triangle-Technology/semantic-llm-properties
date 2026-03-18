// ═══════════════════════════════════════════════════════════
// SEMANTIC COMPUTER — Backend Worker
// Implementation of Semantic Computing paradigm
// 5 Primitives + DISSOLVE composition
// ═══════════════════════════════════════════════════════════

// ─── Model Type Classification ───
const MODEL_TYPES = {
  'anthropic': { type: 'Type-M_strong', label: 'Meta-Constructive (Strong)', dissolutionRate: '81%', listRate: '100%' },
  'openai':    { type: 'Type-D',        label: 'Destructive Interference',   dissolutionRate: '64%', listRate: '30%' },
  'google':    { type: 'Type-M_mod',    label: 'Meta-Constructive (Moderate)', dissolutionRate: '50%', listRate: '7%' },
};

const OPTIMAL_ROUTING = {
  SUPERPOSE:  'any',
  INTERFERE:  'any',
  REFRAME:    'Type-M',
  SYNTHESIZE: 'Type-M_strong',
  VALIDATE:   'any',
};

function detectProvider(apiKey) {
  if (!apiKey) throw new Error('No API key provided');
  if (apiKey.startsWith('sk-ant-')) return 'anthropic';
  if (apiKey.startsWith('sk-')) return 'openai';
  if (apiKey.length > 30 && !apiKey.startsWith('sk')) return 'google';
  throw new Error('Unknown API key format');
}

function getModelType(provider) {
  return MODEL_TYPES[provider] || MODEL_TYPES['openai'];
}

// ─── LLM API Calls ───
async function callLLM(provider, apiKey, systemPrompt, userPrompt, options = {}) {
  const temp = options.temperature ?? 0.7;
  const maxTokens = options.maxTokens ?? 2000;

  if (provider === 'anthropic') {
    const body = {
      model: options.model || 'claude-sonnet-4-20250514',
      max_tokens: maxTokens,
      temperature: temp,
      messages: [{ role: 'user', content: userPrompt }],
    };
    if (systemPrompt) body.system = systemPrompt;
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`Anthropic API error: ${res.status} ${await res.text()}`);
    const data = await res.json();
    return data.content[0].text;
  }

  if (provider === 'openai') {
    const messages = [];
    if (systemPrompt) messages.push({ role: 'system', content: systemPrompt });
    messages.push({ role: 'user', content: userPrompt });
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: options.model || 'gpt-4o-mini',
        messages,
        temperature: temp,
        max_tokens: maxTokens,
      }),
    });
    if (!res.ok) throw new Error(`OpenAI API error: ${res.status} ${await res.text()}`);
    const data = await res.json();
    return data.choices[0].message.content;
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
    if (!res.ok) throw new Error(`Google API error: ${res.status} ${await res.text()}`);
    const data = await res.json();
    return data.candidates[0].content.parts[0].text;
  }

  throw new Error(`Unknown provider: ${provider}`);
}

// ─── Route step to optimal model ───
function routeStep(step, keys) {
  const requirement = OPTIMAL_ROUTING[step];
  const providers = Object.keys(keys).filter(k => keys[k]);

  if (requirement === 'any') {
    // Prefer cheapest: openai > google > anthropic
    for (const pref of ['openai', 'google', 'anthropic']) {
      if (providers.includes(pref)) return pref;
    }
  }
  if (requirement === 'Type-M_strong') {
    if (providers.includes('anthropic')) return 'anthropic';
    // Fallback to any Type-M
    if (providers.includes('google')) return 'google';
    return providers[0]; // last resort
  }
  if (requirement === 'Type-M') {
    if (providers.includes('anthropic')) return 'anthropic';
    if (providers.includes('google')) return 'google';
    return providers[0];
  }
  return providers[0];
}

// ─── SSE Helper ───
function sseEvent(event, data) {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

// ═══════════════════════════════════════════════════════════
// DISSOLUTION PROMPTS (proven: 0% → 81%, Exp U2)
// ═══════════════════════════════════════════════════════════

function dissolveDirectPrompt(question) {
  return {
    system: 'You are a helpful advisor. Answer the question directly. You MUST recommend one of the given options. Do not question the framing of the question.',
    user: question,
  };
}

function dissolveListPrompt(question) {
  return {
    system: 'You are a deep analytical thinker. Follow the analytical steps described precisely.',
    user: `Consider this question: "${question}"

Before answering, follow these steps PRECISELY:

STEP 1 — MULTIPLE PERSPECTIVES: Consider this question from at least 3 very different expert angles. For each, briefly note what they would focus on.

STEP 2 — FIND HIDDEN AGREEMENTS: What do ALL perspectives secretly agree on? What assumption do they all share that none of them question? Look for the invisible frame that makes this seem like an either/or choice.

STEP 3 — CHALLENGE THE FRAME: Based on the hidden assumption you found, how would you REFRAME the entire question? The original question assumes something that may not be true. What is it, and what question SHOULD we be asking instead?

STEP 4 — SYNTHESIZE: Now provide your final answer:
- Name the hidden assumption explicitly
- Propose an alternative approach that transcends the original binary
- Explain why this assumption was invisible (why do people naturally miss it?)`,
  };
}

function dissolveSuperpose(question) {
  return {
    system: 'You are generating diverse expert perspectives. Each perspective must be genuinely different — not just a different emphasis on the same answer.',
    user: `Consider this question from 3 very different expert perspectives. For each, provide a short analysis (2-3 sentences) of what they would focus on and recommend.

Question: "${question}"

Expert 1 — A systems thinker who sees interconnections:
Expert 2 — A contrarian who challenges conventional wisdom:
Expert 3 — A pragmatist who focuses on hidden constraints:`,
  };
}

function dissolveInterfere(question, perspectives) {
  return {
    system: 'You are an analytical thinker who finds hidden patterns in contradictions.',
    user: `Three experts analyzed this question: "${question}"

Their perspectives:
${perspectives}

Now find the COLLISION POINTS:
1. Where do these perspectives CONTRADICT each other?
2. More importantly: what do ALL THREE secretly AGREE on without stating it?
3. What hidden assumption do they all share — the invisible frame they're all trapped in?`,
  };
}

function dissolveReframe(question, assumptions) {
  return {
    system: 'You are a frame-breaker. Your job is to see what everyone else misses — the invisible assumptions that constrain thinking.',
    user: `Original question: "${question}"

Hidden assumptions found: ${assumptions}

REFRAME: Based on these hidden assumptions, how should the question actually be framed? What question SHOULD we be asking instead? Why does the original framing make this assumption invisible?`,
  };
}

function dissolveSynthesize(question, reframe) {
  return {
    system: 'You are a synthesizer. Combine insights into a clear, actionable answer.',
    user: `Original question: "${question}"

Reframed analysis: ${reframe}

Provide a final synthesis:
1. **Hidden Assumption**: Name it explicitly in one sentence.
2. **Alternative Approach**: What should we do instead of choosing between the original options? Be specific and actionable.
3. **Why It Was Invisible**: Why do people naturally miss this assumption? (1-2 sentences)`,
  };
}

// ═══════════════════════════════════════════════════════════
// PRIMITIVE PROMPTS
// ═══════════════════════════════════════════════════════════

function superposePrompt(concept, frames) {
  const frameList = frames || ['a systems thinker', 'a philosopher', 'a pragmatic engineer'];
  return {
    system: 'You generate genuinely diverse perspectives. Each must be fundamentally different — not just different emphasis.',
    user: `Explore this concept/question from ${frameList.length} different angles:

"${concept}"

${frameList.map((f, i) => `Perspective ${i + 1} — As ${f}:`).join('\n')}

After all perspectives, provide a CENTROID — the most representative synthesis that captures the core truth across all perspectives.`,
  };
}

function interferePrompt(ideaA, ideaB) {
  return {
    system: 'You are an interference analyst. When two ideas collide, you find what EMERGES — insights that exist in neither input alone.',
    user: `Two ideas are about to collide:

IDEA A: "${ideaA}"
IDEA B: "${ideaB}"

Analyze the collision:

🔴 CONFLICT ZONES: Where do these ideas fundamentally contradict?

🟢 EMERGENT INSIGHTS: What NEW ideas emerge from this collision that exist in NEITHER input? These are the most valuable — the "interference pattern" that only appears when opposites meet.

📊 INTERFERENCE TYPE: Is this collision constructive (ideas build on each other), destructive (one annihilates the other), or meta-constructive (collision elevates to a higher level of understanding)?`,
  };
}

function reframePrompt(problem, lens) {
  return {
    system: 'You are a master reframer. You see the same problem through completely different lenses, revealing what was invisible before.',
    user: `ORIGINAL PROBLEM:
"${problem}"

NEW LENS:
"${lens}"

Reframe the original problem through this new lens:
1. What looks completely different when viewed this way?
2. What was invisible before that's now obvious?
3. What new solutions become available from this vantage point?
4. What does this lens reveal about WHY people get stuck on this problem?`,
  };
}

function synthesizePrompt(perspectives) {
  return {
    system: 'You are a master synthesizer. You combine multiple perspectives into a coherent whole that is MORE than the sum of its parts — not a compromise, but an elevation.',
    user: `Here are multiple perspectives to synthesize:

${perspectives}

Create a SYNTHESIS that:
1. Honors the core truth in each perspective
2. Resolves contradictions by finding a higher-level frame
3. Produces an insight or approach that none of the individual perspectives could reach alone
4. Is concrete and actionable, not abstract platitude`,
  };
}

function validatePrompt(conclusion) {
  return {
    system: 'You are an adversarial evaluator. Your job is to find weaknesses, not to agree. Be genuinely critical — look for hidden flaws, circular reasoning, unfounded assumptions, and comfortable lies.',
    user: `Evaluate this conclusion with ADVERSARIAL skepticism:

"${conclusion}"

Assessment:
1. **Genuine or Artificial?** Is this conclusion genuinely novel and well-founded, or is it a comfortable platitude dressed up as insight? Score 1-5 (1=empty platitude, 5=genuinely novel).
2. **Hidden Weaknesses**: What flaws does this conclusion have that its author probably doesn't see?
3. **Counter-evidence**: What would DISPROVE this conclusion? Is there readily available counter-evidence?
4. **Circular Reasoning Check**: Does this conclusion assume what it claims to prove?
5. **Overall Verdict**: GENUINE, PARTIALLY GENUINE, or ARTIFICIAL — with one-sentence justification.`,
  };
}

// ═══════════════════════════════════════════════════════════
// REQUEST HANDLERS
// ═══════════════════════════════════════════════════════════

async function handleDissolve(request) {
  const { question, keys } = await request.json();
  if (!question) return new Response('Missing question', { status: 400 });

  const providers = Object.keys(keys).filter(k => keys[k]);
  if (providers.length === 0) return new Response('No API keys', { status: 400 });

  const primaryProvider = providers.includes('anthropic') ? 'anthropic' : providers[0];
  const primaryKey = keys[primaryProvider];
  const modelInfo = getModelType(primaryProvider);
  const multiModel = providers.length > 1;

  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();
  const enc = new TextEncoder();
  const write = (event, data) => writer.write(enc.encode(sseEvent(event, data)));

  const run = async () => {
    try {
      // Step 0: Model info
      await write('model_info', {
        provider: primaryProvider,
        ...modelInfo,
        multiModel,
        routing: multiModel ? 'orchestrated' : 'single',
      });

      // Step 1: Direct response (baseline — shows the trap)
      await write('step', { step: 'direct', status: 'running' });
      const { system: dSys, user: dUser } = dissolveDirectPrompt(question);
      const directResp = await callLLM(primaryProvider, primaryKey, dSys, dUser);
      await write('step', { step: 'direct', status: 'done', content: directResp });

      // Step 2: Dissolution
      const useList = modelInfo.type === 'Type-M_strong' && !multiModel;

      if (useList) {
        // Claude single-model: LIST_PROMPT (proven 100%)
        await write('step', { step: 'dissolve', status: 'running', pipeline: 'LIST_PROMPT' });
        const { system: lSys, user: lUser } = dissolveListPrompt(question);
        const listResp = await callLLM('anthropic', keys.anthropic, lSys, lUser);
        await write('step', { step: 'dissolve', status: 'done', content: listResp, pipeline: 'LIST_PROMPT' });
      } else {
        // FULL_COMPOSITION pipeline (with optional cross-model routing)
        const getProvider = (step) => multiModel ? routeStep(step, keys) : primaryProvider;
        const getKey = (step) => keys[getProvider(step)];

        // SUPERPOSE
        await write('step', { step: 'superpose', status: 'running', model: getProvider('SUPERPOSE') });
        const { system: sSys, user: sUser } = dissolveSuperpose(question);
        const perspectives = await callLLM(getProvider('SUPERPOSE'), getKey('SUPERPOSE'), sSys, sUser);
        await write('step', { step: 'superpose', status: 'done', content: perspectives, model: getProvider('SUPERPOSE') });

        // INTERFERE
        await write('step', { step: 'interfere', status: 'running', model: getProvider('INTERFERE') });
        const { system: iSys, user: iUser } = dissolveInterfere(question, perspectives);
        const interference = await callLLM(getProvider('INTERFERE'), getKey('INTERFERE'), iSys, iUser);
        await write('step', { step: 'interfere', status: 'done', content: interference, model: getProvider('INTERFERE') });

        // REFRAME
        await write('step', { step: 'reframe', status: 'running', model: getProvider('REFRAME') });
        const { system: rSys, user: rUser } = dissolveReframe(question, interference);
        const reframe = await callLLM(getProvider('REFRAME'), getKey('REFRAME'), rSys, rUser);
        await write('step', { step: 'reframe', status: 'done', content: reframe, model: getProvider('REFRAME') });

        // SYNTHESIZE
        await write('step', { step: 'synthesize', status: 'running', model: getProvider('SYNTHESIZE') });
        const { system: synSys, user: synUser } = dissolveSynthesize(question, reframe);
        const synthesis = await callLLM(getProvider('SYNTHESIZE'), getKey('SYNTHESIZE'), synSys, synUser);
        await write('step', { step: 'synthesize', status: 'done', content: synthesis, model: getProvider('SYNTHESIZE') });
      }

      await write('done', { success: true });
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

async function handlePrimitive(request, primitive) {
  const body = await request.json();
  const { keys } = body;
  const providers = Object.keys(keys).filter(k => keys[k]);
  if (providers.length === 0) return new Response('No API keys', { status: 400 });

  const primaryProvider = providers[0];
  const primaryKey = keys[primaryProvider];

  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();
  const enc = new TextEncoder();
  const write = (event, data) => writer.write(enc.encode(sseEvent(event, data)));

  const run = async () => {
    try {
      await write('model_info', getModelType(primaryProvider));

      let prompt;
      switch (primitive) {
        case 'superpose':
          prompt = superposePrompt(body.concept, body.frames);
          break;
        case 'interfere':
          prompt = interferePrompt(body.ideaA, body.ideaB);
          break;
        case 'reframe':
          prompt = reframePrompt(body.problem, body.lens);
          break;
        case 'synthesize':
          prompt = synthesizePrompt(body.perspectives);
          break;
        case 'validate':
          prompt = validatePrompt(body.conclusion);
          break;
        default:
          throw new Error(`Unknown primitive: ${primitive}`);
      }

      await write('step', { step: primitive, status: 'running' });
      const result = await callLLM(primaryProvider, primaryKey, prompt.system, prompt.user);
      await write('step', { step: primitive, status: 'done', content: result });
      await write('done', { success: true });
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

function handleModelInfo(request) {
  return new Response(JSON.stringify(MODEL_TYPES), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

// ─── Router ───
export default {
  async fetch(request) {
    const url = new URL(request.url);

    // CORS preflight
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
      return new Response('Semantic Computer API v1.0', { headers: { 'Access-Control-Allow-Origin': '*' } });
    }

    if (request.method === 'GET' && url.pathname === '/api/model-info') {
      return handleModelInfo(request);
    }

    if (request.method === 'POST') {
      switch (url.pathname) {
        case '/api/dissolve':   return handleDissolve(request);
        case '/api/superpose':  return handlePrimitive(request, 'superpose');
        case '/api/interfere':  return handlePrimitive(request, 'interfere');
        case '/api/reframe':    return handlePrimitive(request, 'reframe');
        case '/api/synthesize': return handlePrimitive(request, 'synthesize');
        case '/api/validate':   return handlePrimitive(request, 'validate');
      }
    }

    return new Response('Not found', { status: 404 });
  },
};
