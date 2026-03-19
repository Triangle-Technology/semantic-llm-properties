// ═══════════════════════════════════════════════════════════
// SEMANTIC COMPUTER v3 — Composition Selector
// ═══════════════════════════════════════════════════════════

const IS_LOCAL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  || window.location.protocol === 'file:';
const API_BASE = IS_LOCAL
  ? 'http://localhost:8787'
  : 'https://semantic-computer.triangle-me.workers.dev';

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

let lastRun = null;

// ─── Primitives ───
const PRIMITIVES = {
  superpose:  { label: 'SUPERPOSE',  icon: '◈', color: '#8b5cf6' },
  interfere:  { label: 'INTERFERE',  icon: '⚡', color: '#ef4444' },
  reframe:    { label: 'REFRAME',    icon: '◇', color: '#f59e0b' },
  synthesize: { label: 'SYNTHESIZE', icon: '◉', color: '#10b981' },
  validate:   { label: 'VALIDATE',   icon: '◎', color: '#06b6d4' },
};

// ─── Compositions ───
const COMPOSITIONS = {
  dissolve: {
    name: 'DISSOLVE',
    icon: '⚡',
    tagline: 'Find hidden assumptions',
    description: 'Breaks binary dilemmas and structural traps by finding what everyone is missing',
    pipeline: ['superpose', 'interfere', 'reframe', 'synthesize', 'validate'],
    proven: '0% → 81%, 3 models, 6 domains',
    examples: [
      { label: 'Revenue Trap', text: 'Revenue dropped 20%. Should we lay off staff or cut the marketing budget?' },
      { label: 'Architecture Trap', text: 'Should we use REST or GraphQL for our new microservice API that serves 3 internal consumers?' },
      { label: 'Hiring Trap', text: 'Should we hire one senior developer at $180k or two juniors at $90k each?' },
      { label: 'Metric Trap', text: 'Should we improve the product or improve customer support to raise our NPS score?' },
    ],
    inputLabel: 'Enter a binary dilemma or decision with hidden assumptions',
    inputPlaceholder: 'Revenue dropped 20%. Should we lay off staff or cut the marketing budget?',
  },
  innovate: {
    name: 'INNOVATE',
    icon: '💡',
    tagline: 'Generate novel solutions',
    description: 'Escapes conventional thinking by colliding perspectives to create emergent ideas',
    pipeline: ['superpose', 'interfere', 'synthesize'],
    proven: '6× novelty, 5.0/5.0 escape, 5 domains',
    examples: [
      { label: 'Growth Stale', text: 'We are a B2B SaaS company with 50 employees, $5M ARR, and growth is slowing. How can we reignite growth?' },
      { label: 'Education Rethink', text: 'Traditional university education is becoming less relevant for tech careers. How should we rethink education?' },
      { label: 'Retention Crisis', text: 'Our best engineers keep leaving for competitors despite good salaries. How do we retain top talent?' },
      { label: 'Climate Action', text: 'Individual actions feel insignificant against climate change. What approaches could actually make a difference?' },
    ],
    inputLabel: 'Enter a problem where conventional thinking feels stuck',
    inputPlaceholder: 'We are a B2B SaaS company with 50 employees, $5M ARR, and growth is slowing. How can we reignite growth?',
  },
};

// ─── State ───
let selectedComposition = 'dissolve';

// ─── Render Composition Cards ───
function renderCompositions() {
  const container = $('#composition-selector');
  container.innerHTML = Object.entries(COMPOSITIONS).map(([id, comp]) => {
    const isSelected = id === selectedComposition;
    return `<div class="comp-card ${isSelected ? 'selected' : ''}" data-comp="${id}">
      <div class="comp-header">
        <span class="comp-icon">${comp.icon}</span>
        <span class="comp-name">${comp.name}</span>
      </div>
      <div class="comp-tagline">${comp.tagline}</div>
      <div class="comp-proven">✅ ${comp.proven}</div>
    </div>`;
  }).join('');

  container.querySelectorAll('.comp-card').forEach(card => {
    card.addEventListener('click', () => {
      selectedComposition = card.dataset.comp;
      renderCompositions();
      renderPipelinePreview();
      renderInput();
    });
  });
}

// ─── Pipeline Preview (read-only) ───
function renderPipelinePreview() {
  const comp = COMPOSITIONS[selectedComposition];
  const preview = $('#pipeline-preview');
  preview.innerHTML = comp.pipeline.map((p, i) => {
    const def = PRIMITIVES[p];
    return (i > 0 ? '<span class="arrow">→</span>' : '') +
      `<span class="preview-chip" style="color: ${def.color}; border-color: ${def.color}30; background: ${def.color}15">${def.icon} ${def.label}</span>`;
  }).join('');
}

// ─── Input ───
function renderInput() {
  const comp = COMPOSITIONS[selectedComposition];
  const section = $('#input-section');

  let html = `<label>${comp.inputLabel}</label>`;
  html += `<textarea id="input-main" rows="3" placeholder="${comp.inputPlaceholder}"></textarea>`;
  html += '<div class="examples"><span>Try:</span>';
  comp.examples.forEach(ex => {
    html += `<button class="example-btn" data-text="${ex.text}">${ex.label}</button>`;
  });
  html += '</div>';

  section.innerHTML = html;

  section.querySelectorAll('.example-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      $('#input-main').value = btn.dataset.text;
    });
  });
}

// ─── API Keys ───
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

function updateRoutingInfo() {
  saveKeys();
  const providers = Object.entries(getKeys()).filter(([, v]) => v).map(([k]) => k);
  const info = $('#routing-info');
  if (providers.length === 0) { info.classList.remove('visible'); return; }
  const names = { anthropic: 'Claude (Type-M)', openai: 'GPT (Type-D)', google: 'Gemini (Type-M mod)' };
  info.innerHTML = providers.length === 1
    ? `📡 ${names[providers[0]]}`
    : `⚡ Orchestrated: ${providers.map(p => names[p]).join(' + ')}`;
  info.classList.add('visible');
}

// ─── SSE ───
async function streamSSE(url, body, handlers) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`API error ${res.status}: ${await res.text()}`);

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

// ─── Compute ───
async function compute() {
  const input = $('#input-main')?.value.trim();
  if (!input) return alert('Please enter your input');

  const comp = COMPOSITIONS[selectedComposition];
  const pipeline = comp.pipeline;
  const keys = getKeys();

  const btn = $('#compute-btn');
  btn.disabled = true;
  btn.classList.add('running');
  btn.textContent = 'Computing...';

  $('#results').classList.remove('hidden');
  const progress = $('#steps-progress');
  const content = $('#result-content');
  const insight = $('#model-insight');

  // Init progress
  progress.innerHTML = pipeline.map((p, i) => {
    const def = PRIMITIVES[p];
    return (i > 0 ? '<span class="arrow" style="color: var(--text-dim); font-size: 0.7rem;">→</span>' : '') +
      `<span class="step-indicator" id="step-${i}">${def.icon} ${def.label}</span>`;
  }).join('');

  content.innerHTML = '<div class="loading-dots">Starting...</div>';
  insight.classList.remove('visible');

  const stepResultsList = [];
  const stepTimings = {};
  const runStartTime = Date.now();
  let modelInfo = null;
  let baselineResult = null;
  let baselineUsage = null;
  let pipelineUsage = { totalTokens: 0, totalCost: 0, steps: [] };

  try {
    await streamSSE(`${API_BASE}/api/compute`, { pipeline, keys, input }, {
      model_info(data) {
        modelInfo = data;
        if (data.isDissolve) {
          const demoNote = data.usingDefault
            ? '<div class="demo-note">Demo mode — enter your own API keys for unlimited use</div>'
            : '';
          const strategyNote = data.strategy === 'list-prompt-shortcut'
            ? '<div class="strategy-note">Claude detected — using LIST_PROMPT (proven 100%, faster than pipeline)</div>'
            : '';
          content.innerHTML = `${demoNote}<div class="dissolve-comparison">
            <div class="dissolve-col dissolve-before">
              <h3>Direct Response</h3>
              <div id="baseline-content"><div class="loading-dots">Asking AI directly...</div></div>
            </div>
            <div class="dissolve-col dissolve-after">
              <h3>With ${comp.name}</h3>
              ${strategyNote}
              <div id="dissolve-content"><div class="loading-dots">Running pipeline...</div></div>
            </div>
          </div>`;
        }
      },
      prefilter(data) {
        if (data.status === 'done' && data.verdict === 'DIRECT_SUFFICIENT') {
          content.innerHTML = `<div class="prefilter-result direct-sufficient">
            <div class="prefilter-verdict">Direct answer sufficient</div>
            <div class="prefilter-reason">${data.reason}</div>
            <div class="prefilter-note">Pipeline skipped — this question has a defined output space.</div>
            <hr style="border-color: var(--border); margin: 1rem 0;">
            <div id="baseline-content"><div class="loading-dots">Getting answer...</div></div>
          </div>`;
        } else if (data.status === 'done' && data.verdict === 'PIPELINE_RECOMMENDED') {
          const existing = content.innerHTML;
          if (existing.includes('loading-dots') && !existing.includes('dissolve-comparison')) {
            content.innerHTML = `<div class="prefilter-result pipeline-recommended">
              <span class="prefilter-badge">✓ ${data.type.replace(/_/g, ' ')}</span> — pipeline recommended
            </div>`;
          }
        }
      },
      baseline(data) {
        const el = $('#baseline-content');
        if (!el) return;
        if (data.status === 'done') {
          baselineResult = { content: data.content, model: data.model };
          baselineUsage = data.usage || { inputTokens: 0, outputTokens: 0, cost: 0 };
          const bTokens = (baselineUsage.inputTokens || 0) + (baselineUsage.outputTokens || 0);
          const bCost = baselineUsage.cost?.toFixed(4) || '0';
          el.innerHTML = `<div class="baseline-answer">${md(data.content)}</div>
            <div class="baseline-meta">Model: ${data.model} | ${bTokens.toLocaleString()} tokens | $${bCost}</div>`;
        }
      },
      step(data) {
        const idx = data.index;
        const indicator = $(`#step-${idx}`);

        if (data.status === 'running' && indicator) {
          indicator.classList.add('running');
          if (data.model) indicator.innerHTML += `<span class="model-tag">(${data.model})</span>`;
          stepTimings[idx] = { start: Date.now(), step: data.step };

          const dissolveEl = $('#dissolve-content');
          if (dissolveEl && modelInfo?.isDissolve) {
            const def = PRIMITIVES[data.step];
            dissolveEl.innerHTML = `<div class="loading-dots">Running ${def?.label || data.step}...</div>`;
          }
        } else if (data.status === 'done') {
          if (indicator) {
            indicator.classList.remove('running');
            indicator.classList.add('done');
          }
          if (stepTimings[idx]) stepTimings[idx].end = Date.now();

          const stepData = { step: data.step, content: data.content, model: data.model, usage: data.usage };
          stepResultsList.push(stepData);

          if (data.usage) {
            pipelineUsage.totalTokens += (data.usage.inputTokens || 0) + (data.usage.outputTokens || 0);
            pipelineUsage.totalCost += data.usage.cost || 0;
            pipelineUsage.steps.push({ step: data.step, model: data.model, ...data.usage });
          }

          if (modelInfo?.isDissolve) {
            const dissolveEl = $('#dissolve-content');
            if (dissolveEl) {
              // Show synthesis/final result
              if (data.step === 'dissolve-list' || data.step === 'synthesize' || data.step === pipeline[pipeline.length - 1]) {
                dissolveEl.innerHTML = `<div class="dissolve-answer">${md(data.content)}</div>`;
              }
            }
          } else {
            // Non-DISSOLVE: show steps sequentially
            content.innerHTML = stepResultsList.map(r => {
              const def = PRIMITIVES[r.step];
              return `<div class="result-step">
                <div class="result-step-header" style="color: ${def?.color || '#888'}">
                  ${def?.icon || ''} ${def?.label || r.step}
                  ${r.model ? `<span style="opacity:0.5; font-size:0.65rem;">(${r.model})</span>` : ''}
                </div>
                <div class="result-step-body">${md(r.content)}</div>
              </div>`;
            }).join('');
          }
        }
      },
      done(data) {
        const totalTime = ((Date.now() - runStartTime) / 1000).toFixed(1);

        // DISSOLVE: ensure final synthesis is shown
        if (modelInfo?.isDissolve) {
          const dissolveEl = $('#dissolve-content');
          if (dissolveEl) {
            const synthResult = stepResultsList.find(r => r.step === 'synthesize');
            const validateResult = stepResultsList.find(r => r.step === 'validate');
            const mainResult = synthResult || stepResultsList[stepResultsList.length - 1];

            let html = '';
            if (mainResult) {
              html += `<div class="dissolve-answer">${md(mainResult.content)}</div>`;
            }
            if (validateResult && validateResult !== mainResult) {
              html += `<div class="validate-badge">${md(validateResult.content)}</div>`;
            }
            const pCost = pipelineUsage.totalCost.toFixed(4);
            html += `<div class="usage-summary">Pipeline: ${pipelineUsage.totalTokens.toLocaleString()} tokens | $${pCost}</div>`;
            html += `<details class="pipeline-details"><summary>View all ${stepResultsList.length} pipeline steps</summary>`;
            html += stepResultsList.map(r => {
              const def = PRIMITIVES[r.step];
              return `<div class="result-step">
                <div class="result-step-header" style="color: ${def?.color || '#888'}">
                  ${def?.icon || ''} ${def?.label || r.step}
                  ${r.model ? `<span style="opacity:0.5; font-size:0.65rem;">(${r.model})</span>` : ''}
                </div>
                <div class="result-step-body">${md(r.content)}</div>
              </div>`;
            }).join('');
            html += `</details>`;
            dissolveEl.innerHTML = html;
          }
        }

        // Insight + export
        let insightHTML = `<strong>Routing:</strong> ${data.routing || 'single-model'}`;
        if (modelInfo) insightHTML += ` | Primary: ${modelInfo.type || 'unknown'}`;
        insightHTML += ` | ${totalTime}s`;
        insightHTML += `<div class="export-buttons">`;
        insightHTML += `<button class="export-btn" id="export-pdf">Export PDF</button>`;
        insightHTML += `<button class="export-btn" id="export-json">Export JSON</button>`;
        insightHTML += `</div>`;
        insight.innerHTML = insightHTML;
        insight.classList.add('visible');

        // Save for export
        try {
          lastRun = buildRunRecord(input, stepResultsList, stepTimings, modelInfo, data, totalTime);
          if (baselineResult) lastRun.baseline = { ...baselineResult, usage: baselineUsage };
        } catch (e) { console.error('buildRunRecord error:', e); }

        $('#export-pdf')?.addEventListener('click', () => { if (lastRun) exportPDF(lastRun); });
        $('#export-json')?.addEventListener('click', () => { if (lastRun) exportJSON(lastRun); });

        // Research contribution
        if ($('#contribute-check')?.checked && lastRun) {
          fetch(`${API_BASE}/api/contribute`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(lastRun),
          }).catch(() => {});
        }
      },
      error(data) {
        content.innerHTML = `<div style="color: #ef4444; padding: 1rem;">Error: ${data.message}</div>`;
      },
    });
  } catch (err) {
    content.innerHTML = `<div style="color: #ef4444; padding: 1rem;">Error: ${err.message}</div>`;
  } finally {
    btn.disabled = false;
    btn.classList.remove('running');
    btn.textContent = 'Compute';
  }
}

// ─── Routing explanations ───
const ROUTING_REASONS = {
  superpose:  { requirement: 'any',           reason: 'Perspective generation — using cheapest model' },
  interfere:  { requirement: 'any',           reason: 'Collision analysis — using cheapest model' },
  reframe:    { requirement: 'Type-M',        reason: 'Frame-breaking requires meta-constructive ability' },
  synthesize: { requirement: 'Type-M_strong', reason: 'Exp L: synthesis model determines output quality' },
  validate:   { requirement: 'any',           reason: 'Adversarial evaluation — using cheapest model' },
};

// ─── Build run record ───
function buildRunRecord(input, results, timings, modelInfo, meta, totalTime) {
  const comp = COMPOSITIONS[selectedComposition];
  return {
    version: 'semantic-computer-v3',
    timestamp: new Date().toISOString(),
    composition: {
      name: comp.name,
      pipeline: [...comp.pipeline],
      isProvenComposition: true,
    },
    input: { input },
    routing: {
      mode: meta?.routing || 'single-model',
      primaryModel: modelInfo?.type || 'unknown',
      primaryLabel: modelInfo?.label || 'unknown',
      multiModel: modelInfo?.multiModel || false,
    },
    steps: results.map((r, i) => ({
      index: i,
      primitive: (r.step || '').toUpperCase(),
      model: r.model,
      usage: r.usage || null,
      routingRequirement: ROUTING_REASONS[r.step]?.requirement,
      routingReason: ROUTING_REASONS[r.step]?.reason,
      output: r.content,
      durationMs: timings[i]?.end ? timings[i].end - timings[i].start : null,
    })),
    totalDurationSeconds: parseFloat(totalTime),
    research: {
      paper: 'https://github.com/Triangle-Technology/semantic-llm-properties',
      context: `${comp.name} composition (${comp.proven})`,
    },
  };
}

// ─── JSON Export ───
function exportJSON(run) {
  const blob = new Blob([JSON.stringify(run, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `semantic-computer-${run.composition.name.toLowerCase()}-${Date.now()}.json`;
  a.click();
}

// ─── PDF Export ───
function exportPDF(run) {
  let html = `<!DOCTYPE html><html><head><meta charset="UTF-8">
<title>Semantic Computer — ${run.composition.name} Results</title>
<style>
  body { font-family: Georgia, serif; max-width: 700px; margin: 2rem auto; color: #222; line-height: 1.7; padding: 0 1rem; }
  h1 { font-size: 1.5rem; border-bottom: 2px solid #333; padding-bottom: 0.5rem; }
  h2 { font-size: 1.1rem; color: #555; margin-top: 2rem; }
  .meta { color: #777; font-size: 0.85rem; margin-bottom: 2rem; }
  .step { margin: 1.5rem 0; padding: 1rem; border-left: 3px solid #6366f1; background: #f8f8fc; }
  .step-header { font-weight: bold; font-size: 0.9rem; color: #6366f1; margin-bottom: 0.5rem; }
  .step-model { color: #999; font-size: 0.8rem; }
  .step-body { font-size: 0.9rem; white-space: pre-wrap; }
  .input-box { background: #f0f0f5; padding: 1rem; border-radius: 6px; margin: 1rem 0; font-style: italic; }
  .pipeline-vis { display: flex; gap: 0.3rem; flex-wrap: wrap; margin: 0.5rem 0; }
  .pipeline-vis span { padding: 2px 8px; background: #e8e8f0; border-radius: 4px; font-size: 0.8rem; font-weight: 600; }
  .footer { margin-top: 3rem; padding-top: 1rem; border-top: 1px solid #ddd; color: #999; font-size: 0.75rem; }
</style></head><body>`;

  html += `<h1>Semantic Computer — ${run.composition.name}</h1>`;
  html += `<div class="meta">${new Date(run.timestamp).toLocaleString()}<br>`;
  html += `Routing: ${run.routing.mode} | ${run.routing.primaryLabel}<br>`;
  html += `Duration: ${run.totalDurationSeconds}s</div>`;

  html += `<div class="pipeline-vis">`;
  run.composition.pipeline.forEach((p, i) => {
    if (i > 0) html += `<span style="background:none;color:#999">→</span>`;
    html += `<span>${p.toUpperCase()}</span>`;
  });
  html += `</div>`;

  html += `<h2>Input</h2><div class="input-box">${run.input.input}</div>`;

  if (run.baseline) {
    html += `<h2>Direct Response (no pipeline)</h2>`;
    html += `<div class="step" style="border-left-color:#e55;">`;
    html += `<div class="step-header" style="color:#e55;">DIRECT — ${run.baseline.model}</div>`;
    html += `<div class="step-body">${run.baseline.content}</div></div>`;
  }

  html += `<h2>Pipeline Results</h2>`;
  run.steps.forEach(s => {
    html += `<div class="step">`;
    html += `<div class="step-header">${s.primitive}</div>`;
    html += `<div class="step-model">Model: ${s.model} | ${s.durationMs ? (s.durationMs/1000).toFixed(1)+'s' : 'n/a'} | ${s.routingReason || ''}</div>`;
    html += `<div class="step-body">${s.output}</div></div>`;
  });

  html += `<div class="footer">Semantic Computer — <a href="${run.research.paper}">Research</a><br>${run.research.context}</div>`;
  html += `</body></html>`;

  const win = window.open('', '_blank');
  win.document.write(html);
  win.document.close();
  setTimeout(() => win.print(), 500);
}

// ─── Init ───
document.addEventListener('DOMContentLoaded', () => {
  loadKeys();
  renderCompositions();
  renderPipelinePreview();
  renderInput();
  updateRoutingInfo();

  $$('.api-keys input').forEach(el => el.addEventListener('input', updateRoutingInfo));
  $('#compute-btn').addEventListener('click', compute);
  document.addEventListener('keydown', (e) => { if (e.ctrlKey && e.key === 'Enter') compute(); });
});
