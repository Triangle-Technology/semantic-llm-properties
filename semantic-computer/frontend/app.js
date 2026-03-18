// ═══════════════════════════════════════════════════════════
// SEMANTIC COMPUTER — Frontend Application
// ═══════════════════════════════════════════════════════════

// Auto-detect: use deployed worker in production, localhost in dev
const IS_LOCAL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  || window.location.protocol === 'file:';
const API_BASE = IS_LOCAL
  ? 'http://localhost:8787'
  : 'https://semantic-computer.triangle-me.workers.dev';

// ─── State ───
let currentMode = 'dissolve';

// ─── DOM Elements ───
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

// ─── API Key Management (localStorage) ───
function loadKeys() {
  const keys = JSON.parse(localStorage.getItem('sc-keys') || '{}');
  if (keys.anthropic) $('#key-anthropic').value = keys.anthropic;
  if (keys.openai) $('#key-openai').value = keys.openai;
  if (keys.google) $('#key-google').value = keys.google;
}

function saveKeys() {
  const keys = getKeys();
  localStorage.setItem('sc-keys', JSON.stringify(keys));
}

function getKeys() {
  return {
    anthropic: $('#key-anthropic').value.trim(),
    openai: $('#key-openai').value.trim(),
    google: $('#key-google').value.trim(),
  };
}

function getActiveProviders() {
  const keys = getKeys();
  return Object.entries(keys).filter(([, v]) => v).map(([k]) => k);
}

// ─── Routing Info Display ───
function updateRoutingInfo() {
  saveKeys();
  const providers = getActiveProviders();
  const info = $('#routing-info');

  if (providers.length === 0) {
    info.classList.remove('visible');
    return;
  }

  const typeMap = {
    anthropic: 'Type-M Strong (Claude)',
    openai: 'Type-D (GPT)',
    google: 'Type-M Moderate (Gemini)',
  };

  if (providers.length === 1) {
    const p = providers[0];
    info.innerHTML = `📡 Single model: ${typeMap[p]}. ${p === 'anthropic'
      ? 'LIST_PROMPT pipeline (100% dissolution rate)'
      : 'FULL_COMPOSITION pipeline (' + (p === 'openai' ? '64%' : '50%') + ' dissolution rate)'}`;
  } else {
    const steps = [];
    if (providers.includes('openai')) {
      steps.push('SUPERPOSE→GPT', 'INTERFERE→GPT');
    }
    if (providers.includes('anthropic')) {
      steps.push('REFRAME→Claude', 'SYNTHESIZE→Claude');
    }
    if (providers.includes('openai')) {
      steps.push('VALIDATE→GPT');
    }
    info.innerHTML = `⚡ Cross-model orchestrated: ${steps.join(' | ')}. Expected ~81% dissolution, ~60% cheaper than all-Claude.`;
  }
  info.classList.add('visible');
}

// ─── Mode Switching ───
function switchMode(mode) {
  currentMode = mode;

  // Update buttons
  $$('.mode-btn').forEach(btn => btn.classList.remove('active'));
  document.querySelector(`[data-mode="${mode}"]`).classList.add('active');

  // Update input areas
  $$('.mode-input').forEach(el => el.classList.add('hidden'));
  $(`#input-${mode}`).classList.remove('hidden');

  // Hide results
  $('#results').classList.add('hidden');
}

// ─── SSE Parser ───
async function streamSSE(url, body, handlers) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) throw new Error(`API error: ${res.status}`);

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    let currentEvent = '';
    for (const line of lines) {
      if (line.startsWith('event: ')) {
        currentEvent = line.slice(7);
      } else if (line.startsWith('data: ')) {
        try {
          const data = JSON.parse(line.slice(6));
          if (handlers[currentEvent]) handlers[currentEvent](data);
        } catch (e) { /* skip parse errors */ }
      }
    }
  }
}

// ─── Markdown-lite renderer ───
function renderMarkdown(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/^### (.*$)/gm, '<h4>$1</h4>')
    .replace(/^## (.*$)/gm, '<h3>$1</h3>')
    .replace(/^# (.*$)/gm, '<h2>$1</h2>')
    .replace(/^- (.*$)/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>')
    .replace(/\n\n/g, '<br><br>')
    .replace(/\n/g, '<br>');
}

// ─── DISSOLVE Handler ───
async function runDissolve() {
  const question = $('#dissolve-question').value.trim();
  if (!question) return alert('Please enter a question');

  const keys = getKeys();
  if (getActiveProviders().length === 0) return alert('Please enter at least one API key');

  // Show results area
  $('#results').classList.remove('hidden');
  $('#result-dissolve').classList.remove('hidden');
  $('#result-primitive').classList.add('hidden');

  // Reset
  $('#direct-result').innerHTML = '<div class="loading"></div>';
  $('#dissolve-result').innerHTML = '<div class="loading"></div>';
  $('#pipeline-steps').innerHTML = '';
  $('#model-insight').classList.remove('visible');

  const pipelineSteps = ['superpose', 'interfere', 'reframe', 'synthesize'];
  let modelInfo = {};
  let routingDetails = [];

  await streamSSE(`${API_BASE}/api/dissolve`, { question, keys }, {
    model_info(data) {
      modelInfo = data;
    },
    step(data) {
      if (data.step === 'direct') {
        if (data.status === 'running') {
          $('#direct-result').innerHTML = '<div class="loading"></div>';
        } else if (data.status === 'done') {
          $('#direct-result').innerHTML = renderMarkdown(data.content);
        }
      } else if (data.step === 'dissolve') {
        // LIST_PROMPT mode
        if (data.status === 'running') {
          $('#pipeline-steps').innerHTML = '<span class="pipeline-step running">LIST_PROMPT (single prompt)</span>';
          $('#dissolve-result').innerHTML = '<div class="loading"></div>';
        } else if (data.status === 'done') {
          $('#pipeline-steps').innerHTML = '<span class="pipeline-step done">LIST_PROMPT ✓</span>';
          $('#dissolve-result').innerHTML = renderMarkdown(data.content);
        }
      } else if (pipelineSteps.includes(data.step)) {
        // FULL_COMPOSITION mode
        if (data.status === 'running') {
          updatePipelineUI(data.step, 'running', data.model);
          if (data.step === pipelineSteps[pipelineSteps.length - 1] || data.step === 'superpose') {
            // Keep loading state
          }
        } else if (data.status === 'done') {
          updatePipelineUI(data.step, 'done', data.model);
          routingDetails.push({ step: data.step.toUpperCase(), model: data.model });
          // Show final synthesis result
          if (data.step === 'synthesize') {
            $('#dissolve-result').innerHTML = renderMarkdown(data.content);
          }
        }
      }
    },
    done() {
      showModelInsight(modelInfo, routingDetails);
    },
    error(data) {
      $('#dissolve-result').innerHTML = `<span style="color: var(--before)">Error: ${data.message}</span>`;
    },
  });
}

function updatePipelineUI(step, status, model) {
  const steps = ['superpose', 'interfere', 'reframe', 'synthesize'];
  const container = $('#pipeline-steps');

  // Build/update pipeline visualization
  let html = '';
  for (const s of steps) {
    let cls = 'pipeline-step';
    let modelTag = '';
    if (s === step) {
      cls += ` ${status}`;
      if (model) modelTag = `<span class="model-tag">(${model})</span>`;
    } else {
      // Check if already done
      const existing = container.querySelector(`[data-step="${s}"]`);
      if (existing && existing.classList.contains('done')) {
        cls += ' done';
        modelTag = existing.querySelector('.model-tag')?.outerHTML || '';
      }
    }
    html += `<span class="${cls}" data-step="${s}">${s.toUpperCase()} ${modelTag}</span>`;
    if (s !== steps[steps.length - 1]) html += '<span style="color: var(--text-dim); font-size: 0.7rem;">→</span>';
  }
  container.innerHTML = html;
}

// ─── PRIMITIVE Handlers ───
async function runPrimitive(mode) {
  const keys = getKeys();
  if (getActiveProviders().length === 0) return alert('Please enter at least one API key');

  let body = { keys };

  switch (mode) {
    case 'superpose': {
      const concept = $('#superpose-concept').value.trim();
      if (!concept) return alert('Please enter a concept');
      const framesStr = $('#superpose-frames').value.trim();
      body.concept = concept;
      if (framesStr) body.frames = framesStr.split(',').map(f => f.trim());
      break;
    }
    case 'interfere': {
      const a = $('#interfere-a').value.trim();
      const b = $('#interfere-b').value.trim();
      if (!a || !b) return alert('Please enter both ideas');
      body.ideaA = a;
      body.ideaB = b;
      break;
    }
    case 'reframe': {
      const problem = $('#reframe-problem').value.trim();
      const lens = $('#reframe-lens').value.trim();
      if (!problem || !lens) return alert('Please enter problem and lens');
      body.problem = problem;
      body.lens = lens;
      break;
    }
    case 'synthesize': {
      const perspectives = $('#synthesize-perspectives').value.trim();
      if (!perspectives) return alert('Please enter perspectives');
      body.perspectives = perspectives;
      break;
    }
    case 'validate': {
      const conclusion = $('#validate-conclusion').value.trim();
      if (!conclusion) return alert('Please enter a conclusion');
      body.conclusion = conclusion;
      break;
    }
  }

  // Show results area
  $('#results').classList.remove('hidden');
  $('#result-dissolve').classList.add('hidden');
  $('#result-primitive').classList.remove('hidden');
  $('#primitive-result').innerHTML = '<div class="loading"></div>';
  $('#model-insight').classList.remove('visible');

  let modelInfo = {};

  await streamSSE(`${API_BASE}/api/${mode}`, body, {
    model_info(data) {
      modelInfo = data;
    },
    step(data) {
      if (data.status === 'running') {
        $('#primitive-result').innerHTML = `<div class="loading"></div><p style="color: var(--text-dim); font-size: 0.8rem;">Running ${data.step.toUpperCase()}...</p>`;
      } else if (data.status === 'done') {
        $('#primitive-result').innerHTML = renderMarkdown(data.content);
      }
    },
    done() {
      showModelInsight(modelInfo, []);
    },
    error(data) {
      $('#primitive-result').innerHTML = `<span style="color: var(--before)">Error: ${data.message}</span>`;
    },
  });
}

// ─── Model Insight Panel ───
function showModelInsight(modelInfo, routingDetails) {
  const panel = $('#model-insight');
  const providers = getActiveProviders();

  let html = '<h4>📊 Model Insight</h4>';

  if (modelInfo.type) {
    html += `<p>Primary model: <strong>${modelInfo.label}</strong> (${modelInfo.type})</p>`;
  }

  if (routingDetails.length > 0) {
    html += '<div class="routing-detail">';
    routingDetails.forEach(r => {
      html += `<span class="route-step">${r.step}→${r.model}</span>`;
    });
    html += '</div>';
  }

  if (modelInfo.routing === 'orchestrated') {
    html += '<p style="color: var(--proven);">⚡ Cross-model orchestrated: perspectives via cheap model, synthesis via Claude. ~60% cost savings.</p>';
    html += '<p style="color: var(--text-dim); font-size: 0.75rem;">Why? Experiment L proved: the model performing SYNTHESIS determines output quality, not the models generating perspectives.</p>';
  } else if (modelInfo.type === 'Type-M_strong') {
    html += '<p style="color: var(--proven);">Using LIST_PROMPT — single prompt achieves 100% dissolution rate on Claude.</p>';
  } else if (modelInfo.type === 'Type-D') {
    html += `<p>Pipeline: FULL_COMPOSITION (4 steps). Expected ~64% dissolution rate.</p>`;
    if (!providers.includes('anthropic')) {
      html += '<p style="color: var(--experimental);">💡 Add Claude API key → route SYNTHESIZE to Claude → expected ~81% rate.</p>';
    }
  } else if (modelInfo.type === 'Type-M_mod') {
    html += `<p>Pipeline: FULL_COMPOSITION (4 steps). Expected ~50% dissolution rate.</p>`;
    if (!providers.includes('anthropic')) {
      html += '<p style="color: var(--experimental);">💡 Add Claude API key → route SYNTHESIZE to Claude → expected ~81% rate.</p>';
    }
  }

  panel.innerHTML = html;
  panel.classList.add('visible');
}

// ─── Compute Handler ───
async function compute() {
  const btn = $('#compute-btn');
  btn.disabled = true;
  btn.classList.add('running');
  btn.textContent = '⚡ Computing...';

  try {
    if (currentMode === 'dissolve') {
      await runDissolve();
    } else {
      await runPrimitive(currentMode);
    }
  } catch (err) {
    alert('Error: ' + err.message);
  } finally {
    btn.disabled = false;
    btn.classList.remove('running');
    btn.textContent = '⚡ Compute';
  }
}

// ─── Event Listeners ───
document.addEventListener('DOMContentLoaded', () => {
  loadKeys();
  updateRoutingInfo();

  // API key changes
  $$('.api-keys input').forEach(el => {
    el.addEventListener('input', updateRoutingInfo);
  });

  // Mode buttons
  $$('.mode-btn').forEach(btn => {
    btn.addEventListener('click', () => switchMode(btn.dataset.mode));
  });

  // Compute button
  $('#compute-btn').addEventListener('click', compute);

  // Example buttons
  $$('.example-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = $(`#${btn.dataset.target}`);
      target.value = btn.dataset.text;
    });
  });

  // Enter key to compute
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'Enter') compute();
  });
});
