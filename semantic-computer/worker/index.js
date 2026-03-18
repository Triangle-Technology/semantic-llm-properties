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

// ─── Pricing per 1M tokens (USD) ───
const PRICING = {
  'claude-sonnet-4-20250514': { input: 3.0, output: 15.0 },
  'gpt-4o-mini':              { input: 0.15, output: 0.6 },
  'gemini-2.0-flash':         { input: 0.1, output: 0.4 },
};

// ─── LLM API Call — returns { text, usage: { inputTokens, outputTokens, cost } } ───
async function callLLM(provider, apiKey, systemPrompt, userPrompt, options = {}) {
  const temp = options.temperature ?? 0.7;
  const maxTokens = options.maxTokens ?? 2000;

  if (provider === 'anthropic') {
    const model = options.model || 'claude-sonnet-4-20250514';
    const body = {
      model, max_tokens: maxTokens, temperature: temp,
      messages: [{ role: 'user', content: userPrompt }],
    };
    if (systemPrompt) body.system = systemPrompt;
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`Anthropic: ${res.status} ${(await res.text()).slice(0, 200)}`);
    const data = await res.json();
    const inputTokens = data.usage?.input_tokens || 0;
    const outputTokens = data.usage?.output_tokens || 0;
    const price = PRICING[model] || { input: 3.0, output: 15.0 };
    return {
      text: data.content[0].text,
      usage: { inputTokens, outputTokens, cost: (inputTokens * price.input + outputTokens * price.output) / 1_000_000 },
    };
  }

  if (provider === 'openai') {
    const model = options.model || 'gpt-4o-mini';
    const messages = [];
    if (systemPrompt) messages.push({ role: 'system', content: systemPrompt });
    messages.push({ role: 'user', content: userPrompt });
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify({ model, messages, temperature: temp, max_tokens: maxTokens }),
    });
    if (!res.ok) throw new Error(`OpenAI: ${res.status} ${(await res.text()).slice(0, 200)}`);
    const data = await res.json();
    const inputTokens = data.usage?.prompt_tokens || 0;
    const outputTokens = data.usage?.completion_tokens || 0;
    const price = PRICING[model] || { input: 0.15, output: 0.6 };
    return {
      text: data.choices[0].message.content,
      usage: { inputTokens, outputTokens, cost: (inputTokens * price.input + outputTokens * price.output) / 1_000_000 },
    };
  }

  if (provider === 'google') {
    const model = options.model || 'gemini-2.0-flash';
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
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
    const data = await res.json();
    const meta = data.usageMetadata || {};
    const inputTokens = meta.promptTokenCount || 0;
    const outputTokens = meta.candidatesTokenCount || 0;
    const price = PRICING[model] || { input: 0.1, output: 0.4 };
    return {
      text: data.candidates[0].content.parts[0].text,
      usage: { inputTokens, outputTokens, cost: (inputTokens * price.input + outputTokens * price.output) / 1_000_000 },
    };
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
// PRE-FILTER — Detect if input has undefined output space
// Uses cheapest available model (1 lightweight call)
// ═══════════════════════════════════════════════════════════

const PREFILTER_PROMPT = {
  system: `You classify questions into two categories based on whether Semantic Computing (a pipeline of perspective-generation, collision, and synthesis) would add value.

PIPELINE_RECOMMENDED when:
- False binary / dilemma ("A or B?" where hidden option C may exist)
- Anchored thinking (number/reference constraining the analysis)
- False constraint (budget, timeline, or scope assumed as fixed)
- Stale problem (conventional wisdom dominates, novel thinking needed)
- Complex strategy where framing may hide better options

DIRECT_SUFFICIENT when:
- Factual question with a known answer (dates, definitions, data)
- Calculation or conversion
- How-to / tutorial request with well-known steps
- Simple lookup or reference
- Creative writing request (poem, story) — creative but output space is open by design, not hidden

Respond with EXACTLY one line in this format:
VERDICT: PIPELINE_RECOMMENDED or DIRECT_SUFFICIENT
TYPE: [false_binary | anchoring | false_constraint | stale_problem | complex_strategy | factual | calculation | howto | creative | other]
REASON: [one sentence explaining why]`,

  user: (input) => `Classify this input:\n\n"${input}"`,
};

function parsePrefilter(text) {
  const verdict = text.match(/VERDICT:\s*(PIPELINE_RECOMMENDED|DIRECT_SUFFICIENT)/i)?.[1]?.toUpperCase() || 'PIPELINE_RECOMMENDED';
  const type = text.match(/TYPE:\s*(\S+)/i)?.[1] || 'other';
  const reason = text.match(/REASON:\s*(.+)/i)?.[1] || '';
  return { verdict, type, reason };
}

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

async function handleCompute(request, env) {
  const body = await request.json();
  const { pipeline } = body;

  if (!pipeline || pipeline.length === 0) return new Response('Empty pipeline', { status: 400 });

  // Merge user keys with defaults — user keys take priority
  const userKeys = body.keys || {};
  const keys = {
    anthropic: userKeys.anthropic || env?.DEFAULT_ANTHROPIC_KEY || '',
    openai: userKeys.openai || env?.DEFAULT_OPENAI_KEY || '',
    google: userKeys.google || env?.DEFAULT_GEMINI_KEY || '',
  };
  const usingDefault = !userKeys.anthropic && !userKeys.openai && !userKeys.google;

  const providers = Object.entries(keys).filter(([, v]) => v);
  if (providers.length === 0) return new Response('No API keys configured', { status: 400 });

  const primaryProvider = providers.map(([k]) => k).find(k => keys[k]) || providers[0][0];
  const modelInfo = MODEL_TYPES[primaryProvider] || {};
  const multiModel = providers.length > 1;

  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();
  const enc = new TextEncoder();
  const write = (event, data) => writer.write(enc.encode(sse(event, data)));

  const originalInput = { input: body.input, ideaA: body.ideaA, ideaB: body.ideaB, problem: body.problem, lens: body.lens };

  // Detect DISSOLVE composition
  const DISSOLVE_ORDER = ['superpose', 'interfere', 'reframe', 'synthesize', 'validate'];
  const isDissolve = pipeline.length === 5 && pipeline.every((p, i) => p === DISSOLVE_ORDER[i]);

  // Smart strategy selection based on Exp U2 findings:
  // - Claude-only + DISSOLVE: LIST_PROMPT (100%) is better than pipeline (81%)
  // - GPT/Gemini: Must use full pipeline (LIST only 33%/7%)
  // - Multi-model: orchestrate steps to optimal models
  const useListShortcut = isDissolve && !multiModel && primaryProvider === 'anthropic';

  const run = async () => {
    try {
      const strategy = useListShortcut ? 'list-prompt-shortcut' : (multiModel ? 'cross-model orchestrated' : 'single-model');
      await write('model_info', { ...modelInfo, multiModel, isDissolve, strategy, usingDefault });

      // ─── PRE-FILTER: detect if pipeline adds value ───
      const inputText = originalInput.input || originalInput.problem || '';
      if (inputText && pipeline.length > 1) {
        await write('prefilter', { status: 'running' });
        try {
          // Use cheapest available model for filter (lightweight call)
          const filterProvider = routeStep('superpose', keys); // 'any' → cheapest
          const filterResult = await callLLM(
            filterProvider, keys[filterProvider],
            PREFILTER_PROMPT.system,
            PREFILTER_PROMPT.user(inputText),
            { temperature: 0, maxTokens: 200 }
          );
          const filter = parsePrefilter(filterResult.text);
          await write('prefilter', {
            status: 'done',
            ...filter,
            model: filterProvider,
            usage: filterResult.usage,
          });

          // If DIRECT_SUFFICIENT: run direct only, skip pipeline
          if (filter.verdict === 'DIRECT_SUFFICIENT') {
            await write('baseline', { status: 'running' });
            const directProvider = multiModel ? routeStep('synthesize', keys) : primaryProvider;
            const directResult = await callLLM(
              directProvider, keys[directProvider],
              'You are a helpful advisor. Think carefully and provide your best answer.',
              inputText,
              { temperature: 0.7 }
            );
            await write('baseline', {
              status: 'done',
              content: directResult.text,
              model: directProvider,
              usage: directResult.usage,
            });
            await write('done', {
              success: true,
              routing: 'direct-only (pre-filter)',
              steps: 0,
              filterVerdict: 'DIRECT_SUFFICIENT',
              filterReason: filter.reason,
              filterType: filter.type,
            });
            return;
          }
        } catch (filterErr) {
          // If filter fails, continue with pipeline (fail open)
          await write('prefilter', { status: 'error', message: filterErr.message });
        }
      }

      // If DISSOLVE: run baseline "direct response" first for comparison
      if (isDissolve && originalInput.input) {
        await write('baseline', { status: 'running' });
        // Use the SAME model as SYNTHESIZE for fair comparison
        const baselineProvider = multiModel ? routeStep('synthesize', keys) : primaryProvider;
        const baselineResult = await callLLM(
          baselineProvider, keys[baselineProvider],
          'You are a helpful advisor. Think carefully and provide your best recommendation.',
          originalInput.input + '\n\nWhat would you recommend and why?',
          { temperature: 0.7 }
        );
        await write('baseline', { status: 'done', content: baselineResult.text, model: baselineProvider, usage: baselineResult.usage });
      }

      if (useListShortcut) {
        // Claude-only DISSOLVE: single LIST_PROMPT (proven 100%, faster than 81% pipeline)
        await write('step', { index: 0, step: 'dissolve-list', status: 'running', model: 'anthropic' });
        const listResult = await callLLM('anthropic', keys.anthropic,
          'You are a deep analytical thinker. Follow the analytical steps described precisely.',
          `Consider this question: "${originalInput.input}"

Before answering, follow these steps PRECISELY:

STEP 1 — MULTIPLE PERSPECTIVES: Consider this question from at least 3 very different expert angles. For each, briefly note what they would focus on.

STEP 2 — FIND HIDDEN AGREEMENTS: What do ALL perspectives secretly agree on? What assumption do they all share that none of them question? Look for the invisible frame that makes this seem like an either/or choice.

STEP 3 — CHALLENGE THE FRAME: Based on the hidden assumption you found, how would you REFRAME the entire question? The original question assumes something that may not be true. What is it, and what question SHOULD we be asking instead?

STEP 4 — SYNTHESIZE: Now provide your final answer:
- Name the hidden assumption explicitly
- Propose an alternative approach that transcends the original binary
- Explain why this assumption was invisible (why do people naturally miss it?)`,
          { temperature: 0.7 }
        );
        await write('step', {
          index: 0, step: 'dissolve-list', status: 'done',
          content: listResult.text, model: 'anthropic', usage: listResult.usage,
        });
      } else {
        // Full pipeline execution
        const stepOutputs = [];

        for (let i = 0; i < pipeline.length; i++) {
          const step = pipeline[i];
          const provider = multiModel ? routeStep(step, keys) : primaryProvider;
          const apiKey = keys[provider];

          await write('step', { index: i, step, status: 'running', model: provider });

          const { system, user } = buildPrompt(step, originalInput, stepOutputs);
          const result = await callLLM(provider, apiKey, system, user);

          stepOutputs.push({ step, content: result.text });
          await write('step', { index: i, step, status: 'done', content: result.text, model: provider, usage: result.usage });
        }
      }

      await write('done', {
        success: true,
        routing: strategy,
        steps: useListShortcut ? 1 : pipeline.length,
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

// ─── Research Data Contribution ───
async function handleContribute(request, env) {
  try {
    const data = await request.json();
    // Strip any API keys that might have been accidentally included
    if (data.keys) delete data.keys;
    if (data.routing?.keys) delete data.routing.keys;

    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    data.contributedAt = new Date().toISOString();
    data.contributionId = id;

    if (env?.RESEARCH_DATA) {
      await env.RESEARCH_DATA.put(id, JSON.stringify(data));
    }

    return new Response(JSON.stringify({ success: true, id }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
}

// ─── Router ───
export default {
  async fetch(request, env) {
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
      return handleCompute(request, env);
    }

    if (request.method === 'POST' && url.pathname === '/api/contribute') {
      return handleContribute(request, env);
    }

    return new Response('Not found', { status: 404, headers: { 'Access-Control-Allow-Origin': '*' } });
  },
};
