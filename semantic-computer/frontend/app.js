// ═══════════════════════════════════════════════════════════
// SEMANTIC COMPUTER v2 — Pipeline Builder
// ═══════════════════════════════════════════════════════════

const IS_LOCAL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  || window.location.protocol === 'file:';
const API_BASE = IS_LOCAL
  ? 'http://localhost:8787'
  : 'https://semantic-computer.triangle-me.workers.dev';

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

// ─── Primitives definition ───
const PRIMITIVES = {
  superpose:  { label: 'SUPERPOSE',  chip: 'chip-superpose',  icon: '◈' },
  interfere:  { label: 'INTERFERE',  chip: 'chip-interfere',  icon: '⚡' },
  reframe:    { label: 'REFRAME',    chip: 'chip-reframe',    icon: '◇' },
  synthesize: { label: 'SYNTHESIZE', chip: 'chip-synthesize', icon: '◉' },
  validate:   { label: 'VALIDATE',   chip: 'chip-validate',   icon: '◎' },
};

const DISSOLVE_ORDER = ['superpose', 'interfere', 'reframe', 'synthesize', 'validate'];

// ─── State ───
let pipeline = [...DISSOLVE_ORDER];
let draggedItem = null;

// ─── Input templates per first-primitive ───
const INPUT_TEMPLATES = {
  superpose: {
    label: 'Enter a question, concept, or dilemma to explore',
    placeholder: 'Should we use REST or GraphQL for our new microservice API that serves 3 internal consumers?',
    fields: ['main'],
    examples: [
      { label: 'Business', text: 'Should we cut costs by reducing headcount or cutting the marketing budget?' },
      { label: 'Hiring', text: 'Should we hire a senior developer at $180k or two juniors at $90k each?' },
      { label: 'Strategy', text: 'Should we prioritize improving the product or improving customer support to raise our NPS score?' },
      { label: 'Architecture', text: 'Should we build a monolithic application or use microservices?' },
    ],
  },
  interfere: {
    label: 'Enter two opposing ideas to collide',
    placeholder: 'Remote-first culture enables deep work and global talent',
    placeholder2: 'Office-centric culture enables spontaneous collaboration and culture building',
    fields: ['two'],
  },
  reframe: {
    label: 'Enter a problem to reframe',
    placeholder: 'Our team velocity has dropped 30% this quarter',
    labelLens: 'Through what lens?',
    placeholderLens: 'e.g. organizational psychology, evolutionary biology, game theory',
    fields: ['problem-lens'],
  },
  synthesize: {
    label: 'Enter multiple perspectives to synthesize (one per line)',
    placeholder: 'Perspective 1: We should focus on growth...\nPerspective 2: We should focus on profitability...\nPerspective 3: We should focus on customer retention...',
    fields: ['multi'],
  },
  validate: {
    label: 'Enter a conclusion or argument to evaluate',
    placeholder: 'AI will replace most knowledge workers within 5 years because LLMs can already pass professional exams.',
    fields: ['main'],
  },
};

// ─── Pipeline rendering ───
function renderPipeline() {
  const container = $('#pipeline');
  const bank = $('#pipeline-bank');

  // Pipeline chips
  let html = '';
  pipeline.forEach((p, i) => {
    const def = PRIMITIVES[p];
    if (i > 0) html += '<span class="arrow">→</span>';
    html += `<span class="primitive-chip in-pipeline ${def.chip}" draggable="true" data-primitive="${p}" data-index="${i}">
      ${def.icon} ${def.label}
      <button class="remove-btn" data-primitive="${p}" title="Remove">×</button>
    </span>`;
  });
  container.innerHTML = html;

  // Bank (removed primitives)
  const inPipeline = new Set(pipeline);
  const removed = DISSOLVE_ORDER.filter(p => !inPipeline.has(p));
  bank.innerHTML = removed.map(p => {
    const def = PRIMITIVES[p];
    return `<span class="primitive-chip in-bank ${def.chip}" data-primitive="${p}">
      ${def.icon} ${def.label}
      <button class="add-btn" data-primitive="${p}" title="Add back">+</button>
    </span>`;
  }).join('');

  // Hint
  updateHint();

  // Input
  renderInput();

  // Drag events
  setupDrag();

  // Remove/Add buttons
  container.querySelectorAll('.remove-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const p = btn.dataset.primitive;
      pipeline = pipeline.filter(x => x !== p);
      if (pipeline.length === 0) pipeline = ['superpose']; // minimum 1
      renderPipeline();
    });
  });

  bank.querySelectorAll('.add-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const p = btn.dataset.primitive;
      pipeline.push(p);
      renderPipeline();
    });
  });
}

function updateHint() {
  const hint = $('#pipeline-hint');
  const isDissolve = pipeline.length === 5 &&
    pipeline[0] === 'superpose' && pipeline[1] === 'interfere' &&
    pipeline[2] === 'reframe' && pipeline[3] === 'synthesize' && pipeline[4] === 'validate';

  if (isDissolve) {
    hint.innerHTML = '= <span class="proven-tag">DISSOLVE</span> — proven composition (0% → 81% dissolution rate, 3 model families, 6 domains)';
  } else if (pipeline.length === 1) {
    hint.innerHTML = `Single primitive — experimental`;
  } else {
    hint.innerHTML = `Custom composition (${pipeline.length} steps) — experimental, not yet validated`;
  }
}

// ─── Drag & Drop ───
function setupDrag() {
  const container = $('#pipeline');
  const chips = container.querySelectorAll('.primitive-chip');

  chips.forEach(chip => {
    chip.addEventListener('dragstart', (e) => {
      draggedItem = parseInt(chip.dataset.index);
      chip.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
    });

    chip.addEventListener('dragend', () => {
      chip.classList.remove('dragging');
      container.classList.remove('drag-over');
      draggedItem = null;
    });

    chip.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
    });

    chip.addEventListener('drop', (e) => {
      e.preventDefault();
      const targetIndex = parseInt(chip.dataset.index);
      if (draggedItem !== null && draggedItem !== targetIndex) {
        const item = pipeline.splice(draggedItem, 1)[0];
        pipeline.splice(targetIndex, 0, item);
        renderPipeline();
      }
    });
  });

  container.addEventListener('dragover', (e) => {
    e.preventDefault();
    container.classList.add('drag-over');
  });

  container.addEventListener('dragleave', () => {
    container.classList.remove('drag-over');
  });
}

// ─── Dynamic Input ───
function renderInput() {
  const section = $('#input-section');
  if (pipeline.length === 0) {
    section.innerHTML = '';
    return;
  }

  const first = pipeline[0];
  const tmpl = INPUT_TEMPLATES[first];

  let html = '';

  if (tmpl.fields[0] === 'main') {
    html += `<label>${tmpl.label}</label>`;
    html += `<textarea id="input-main" rows="3" placeholder="${tmpl.placeholder}"></textarea>`;
    if (tmpl.examples) {
      html += '<div class="examples"><span>Try:</span>';
      tmpl.examples.forEach(ex => {
        html += `<button class="example-btn" data-text="${ex.text}">${ex.label}</button>`;
      });
      html += '</div>';
    }
  } else if (tmpl.fields[0] === 'two') {
    html += `<label>${tmpl.label}</label>`;
    html += `<label style="margin-top:0.25rem">Idea A</label>`;
    html += `<textarea id="input-a" rows="2" placeholder="${tmpl.placeholder}"></textarea>`;
    html += `<label>Idea B</label>`;
    html += `<textarea id="input-b" rows="2" placeholder="${tmpl.placeholder2}"></textarea>`;
  } else if (tmpl.fields[0] === 'problem-lens') {
    html += `<label>${tmpl.label}</label>`;
    html += `<textarea id="input-main" rows="2" placeholder="${tmpl.placeholder}"></textarea>`;
    html += `<label>${tmpl.labelLens}</label>`;
    html += `<input type="text" id="input-lens" placeholder="${tmpl.placeholderLens}" />`;
  } else if (tmpl.fields[0] === 'multi') {
    html += `<label>${tmpl.label}</label>`;
    html += `<textarea id="input-main" rows="5" placeholder="${tmpl.placeholder}"></textarea>`;
  }

  section.innerHTML = html;

  // Example buttons
  section.querySelectorAll('.example-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const ta = section.querySelector('#input-main');
      if (ta) ta.value = btn.dataset.text;
    });
  });
}

// ─── API Key Management ───
function loadKeys() {
  const keys = JSON.parse(localStorage.getItem('sc-keys') || '{}');
  if (keys.anthropic) $('#key-anthropic').value = keys.anthropic;
  if (keys.openai) $('#key-openai').value = keys.openai;
  if (keys.google) $('#key-google').value = keys.google;
}

function saveKeys() { localStorage.setItem('sc-keys', JSON.stringify(getKeys())); }

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

function updateRoutingInfo() {
  saveKeys();
  const providers = getActiveProviders();
  const info = $('#routing-info');
  if (providers.length === 0) { info.classList.remove('visible'); return; }

  const names = { anthropic: 'Claude (Type-M)', openai: 'GPT (Type-D)', google: 'Gemini (Type-M mod)' };
  if (providers.length === 1) {
    info.innerHTML = `📡 ${names[providers[0]]}`;
  } else {
    info.innerHTML = `⚡ Orchestrated: ${providers.map(p => names[p]).join(' + ')}`;
  }
  info.classList.add('visible');
}

// ─── SSE Parser ───
async function streamSSE(url, body, handlers) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API error ${res.status}: ${text}`);
  }

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
      if (line.startsWith('event: ')) currentEvent = line.slice(7);
      else if (line.startsWith('data: ')) {
        try {
          const data = JSON.parse(line.slice(6));
          if (handlers[currentEvent]) handlers[currentEvent](data);
        } catch (e) { /* skip */ }
      }
    }
  }
}

// ─── Markdown-lite ───
function md(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/^### (.*$)/gm, '<h4>$1</h4>')
    .replace(/^## (.*$)/gm, '<h3>$1</h3>')
    .replace(/^- (.*$)/gm, '• $1')
    .replace(/\n\n/g, '<br><br>')
    .replace(/\n/g, '<br>');
}

// ─── Gather Input ───
function gatherInput() {
  const first = pipeline[0];
  if (first === 'interfere') {
    const a = $('#input-a')?.value.trim();
    const b = $('#input-b')?.value.trim();
    if (!a || !b) throw new Error('Please enter both ideas');
    return { ideaA: a, ideaB: b };
  }
  if (first === 'reframe') {
    const main = $('#input-main')?.value.trim();
    const lens = $('#input-lens')?.value.trim();
    if (!main || !lens) throw new Error('Please enter problem and lens');
    return { problem: main, lens };
  }
  const main = $('#input-main')?.value.trim();
  if (!main) throw new Error('Please enter your input');
  return { input: main };
}

// ─── Compute ───
async function compute() {
  if (pipeline.length === 0) return;

  const keys = getKeys();
  if (getActiveProviders().length === 0) return alert('Please enter at least one API key');

  let input;
  try { input = gatherInput(); } catch (e) { return alert(e.message); }

  const btn = $('#compute-btn');
  btn.disabled = true;
  btn.classList.add('running');
  btn.textContent = '⚡ Computing...';

  // Show results
  $('#results').classList.remove('hidden');
  const progress = $('#steps-progress');
  const content = $('#result-content');
  const insight = $('#model-insight');

  // Init progress indicators
  progress.innerHTML = pipeline.map((p, i) => {
    const def = PRIMITIVES[p];
    return (i > 0 ? '<span class="arrow" style="color: var(--text-dim); font-size: 0.7rem;">→</span>' : '') +
      `<span class="step-indicator" id="step-${i}">${def.icon} ${def.label}</span>`;
  }).join('');

  content.innerHTML = '<div style="color: var(--text-dim); padding: 1rem;">Starting pipeline...</div>';
  insight.classList.remove('visible');

  const body = { pipeline, keys, ...input };

  const stepResults = [];

  try {
    await streamSSE(`${API_BASE}/api/compute`, body, {
      model_info(data) {
        // Store for insight panel
        body._modelInfo = data;
      },
      step(data) {
        const idx = data.index;
        const indicator = $(`#step-${idx}`);
        if (data.status === 'running' && indicator) {
          indicator.classList.add('running');
          indicator.classList.remove('done');
          if (data.model) indicator.innerHTML += `<span class="model-tag">(${data.model})</span>`;
        } else if (data.status === 'done' && indicator) {
          indicator.classList.remove('running');
          indicator.classList.add('done');
          stepResults[idx] = { step: data.step, content: data.content, model: data.model };
          // Render all completed steps
          content.innerHTML = stepResults.filter(Boolean).map((r, i) => {
            const def = PRIMITIVES[r.step];
            const color = `var(--${r.step})`;
            return `<div class="result-step">
              <div class="result-step-header" style="color: ${color}">
                ${def.icon} ${def.label}
                ${r.model ? `<span style="opacity:0.5; font-size:0.65rem;">(${r.model})</span>` : ''}
              </div>
              <div class="result-step-body">${md(r.content)}</div>
            </div>`;
          }).join('');
        }
      },
      done(data) {
        if (body._modelInfo) {
          insight.innerHTML = `<strong>📊 Routing:</strong> ${data.routing || 'single-model'} | Provider: ${body._modelInfo.type || 'unknown'}`;
          insight.classList.add('visible');
        }
      },
      error(data) {
        content.innerHTML = `<div style="color: var(--interfere); padding: 1rem;">Error: ${data.message}</div>`;
      },
    });
  } catch (err) {
    content.innerHTML = `<div style="color: var(--interfere); padding: 1rem;">Error: ${err.message}</div>`;
  } finally {
    btn.disabled = false;
    btn.classList.remove('running');
    btn.textContent = '⚡ Compute';
  }
}

// ─── Init ───
document.addEventListener('DOMContentLoaded', () => {
  loadKeys();
  renderPipeline();
  updateRoutingInfo();

  $$('.api-keys input').forEach(el => el.addEventListener('input', updateRoutingInfo));
  $('#compute-btn').addEventListener('click', compute);
  $('#reset-btn').addEventListener('click', () => { pipeline = [...DISSOLVE_ORDER]; renderPipeline(); });
  document.addEventListener('keydown', (e) => { if (e.ctrlKey && e.key === 'Enter') compute(); });
});
