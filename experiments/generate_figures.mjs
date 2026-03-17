/**
 * PAPER FIGURES GENERATOR
 *
 * Generates SVG visualizations from experimental data for the paper.
 * No external dependencies — pure SVG generation.
 *
 * Figures:
 *   1. Phase Diagram — C1 ratio vs mixing parameter (Exp E/H cross-model)
 *   2. CAS Ranking — Bar chart of concept attractor strengths (Exp J)
 *   3. Phase Transition Condition — CAS vs CD scatter plot (Exp J + I)
 *   4. Generalization Heatmap — Phase data across 5 concept pairs (Exp I)
 *   5. Meta-Constructive vs Destructive — Claude vs GPT comparison (Exp H)
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";

// ─── Load data ───
const resultsI = JSON.parse(readFileSync("experiments/results_i_generalization.json", "utf8"));
const resultsJ = JSON.parse(readFileSync("experiments/results_j_cas.json", "utf8"));
const resultsH = JSON.parse(readFileSync("experiments/results_h_cross_model.json", "utf8"));
const resultsJ2 = JSON.parse(readFileSync("experiments/results_j2_cas_expanded.json", "utf8"));
const resultsR2 = existsSync("experiments/results_r2_gemini_fixed.json")
  ? JSON.parse(readFileSync("experiments/results_r2_gemini_fixed.json", "utf8"))
  : null;

mkdirSync("figures", { recursive: true });

// ─── SVG Helpers ───
function svgHeader(w, h) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" font-family="system-ui, sans-serif">
  <rect width="${w}" height="${h}" fill="white"/>`;
}

function svgText(x, y, text, opts = {}) {
  const size = opts.size || 14;
  const anchor = opts.anchor || "middle";
  const weight = opts.weight || "normal";
  const fill = opts.fill || "#333";
  const transform = opts.rotate ? ` transform="rotate(${opts.rotate}, ${x}, ${y})"` : "";
  return `  <text x="${x}" y="${y}" font-size="${size}" text-anchor="${anchor}" font-weight="${weight}" fill="${fill}"${transform}>${text}</text>`;
}

// ─── FIGURE 1: Phase Diagram (Cross-Model) ───
function figure1_phaseDiagram() {
  const W = 700, H = 450;
  const margin = { top: 50, right: 30, bottom: 70, left: 70 };
  const plotW = W - margin.left - margin.right;
  const plotH = H - margin.top - margin.bottom;

  const claudeData = resultsH.claude.phaseMapping;
  const gptData = resultsH.gpt.phaseMapping;

  let svg = svgHeader(W, H);
  svg += svgText(W / 2, 25, "Figure 1: Phase Transitions are Universal Across Models", { size: 16, weight: "bold" });

  // Axes
  svg += `  <line x1="${margin.left}" y1="${margin.top}" x2="${margin.left}" y2="${margin.top + plotH}" stroke="#333" stroke-width="2"/>`;
  svg += `  <line x1="${margin.left}" y1="${margin.top + plotH}" x2="${margin.left + plotW}" y2="${margin.top + plotH}" stroke="#333" stroke-width="2"/>`;
  svg += svgText(W / 2, H - 10, "Context Mixing Ratio (% Context 1)", { size: 13 });
  svg += svgText(20, H / 2, "C1 Marker Ratio (%)", { size: 13, rotate: -90 });

  // Grid lines and Y-axis labels
  for (let pct = 0; pct <= 100; pct += 25) {
    const y = margin.top + plotH - (pct / 100) * plotH;
    svg += `  <line x1="${margin.left}" y1="${y}" x2="${margin.left + plotW}" y2="${y}" stroke="#eee" stroke-width="1"/>`;
    svg += svgText(margin.left - 10, y + 4, `${pct}%`, { size: 11, anchor: "end" });
  }

  // X-axis labels
  const ratios = [100, 80, 60, 50, 40, 20, 0];
  ratios.forEach(r => {
    const x = margin.left + ((100 - r) / 100) * plotW;
    svg += svgText(x, margin.top + plotH + 20, `${r}%`, { size: 11 });
  });

  // Phase transition zones (background)
  const t1x = margin.left + (20 / 100) * plotW; // 80% → 20% from left
  const t2x = margin.left + (60 / 100) * plotW; // 40% → 60% from left
  svg += `  <rect x="${t1x}" y="${margin.top}" width="${t2x - t1x}" height="${plotH}" fill="#fff3e0" opacity="0.5"/>`;
  svg += svgText((t1x + t2x) / 2, margin.top + 20, "Interference Zone", { size: 11, fill: "#e65100" });

  // Plot lines
  function plotLine(data, color, label) {
    const points = data.map(d => {
      const x = margin.left + ((100 - d.poetPct) / 100) * plotW;
      const y = margin.top + plotH - d.poetRatio * plotH;
      return { x, y };
    });

    // Line
    const path = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
    svg += `  <path d="${path}" fill="none" stroke="${color}" stroke-width="2.5"/>`;

    // Points
    points.forEach(p => {
      svg += `  <circle cx="${p.x}" cy="${p.y}" r="5" fill="${color}" stroke="white" stroke-width="1.5"/>`;
    });

    return points;
  }

  const claudePoints = plotLine(claudeData, "#7c3aed", "Claude");
  const gptPoints = plotLine(gptData, "#059669", "GPT-4o-mini");

  // Legend
  svg += `  <rect x="${W - 180}" y="${margin.top + 10}" width="150" height="55" fill="white" stroke="#ddd" rx="4"/>`;
  svg += `  <line x1="${W - 170}" y1="${margin.top + 30}" x2="${W - 145}" y2="${margin.top + 30}" stroke="#7c3aed" stroke-width="2.5"/>`;
  svg += `  <circle cx="${W - 157}" cy="${margin.top + 30}" r="4" fill="#7c3aed"/>`;
  svg += svgText(W - 135, margin.top + 34, "Claude Haiku", { size: 12, anchor: "start" });
  svg += `  <line x1="${W - 170}" y1="${margin.top + 50}" x2="${W - 145}" y2="${margin.top + 50}" stroke="#059669" stroke-width="2.5"/>`;
  svg += `  <circle cx="${W - 157}" cy="${margin.top + 50}" r="4" fill="#059669"/>`;
  svg += svgText(W - 135, margin.top + 54, "GPT-4o-mini", { size: 12, anchor: "start" });

  // Transition arrows
  svg += `  <path d="M ${t1x} ${margin.top + plotH + 35} L ${t1x} ${margin.top + plotH + 5}" stroke="#d32f2f" stroke-width="1.5" marker-end="url(#arrow)"/>`;
  svg += `  <path d="M ${t2x} ${margin.top + plotH + 35} L ${t2x} ${margin.top + plotH + 5}" stroke="#d32f2f" stroke-width="1.5" marker-end="url(#arrow)"/>`;
  svg += svgText(t1x, margin.top + plotH + 48, "T₁", { size: 12, fill: "#d32f2f" });
  svg += svgText(t2x, margin.top + plotH + 48, "T₂", { size: 12, fill: "#d32f2f" });
  svg += `  <defs><marker id="arrow" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto"><path d="M 0 0 L 8 3 L 0 6" fill="#d32f2f"/></marker></defs>`;

  svg += "\n</svg>";
  writeFileSync("figures/fig1_phase_diagram.svg", svg);
  console.log("✅ Figure 1: Phase Diagram (cross-model)");
}

// ─── FIGURE 2: CAS Cross-Model Comparison (3 models) ───
function figure2_casRanking() {
  const W = 850, H = 480;
  const margin = { top: 50, right: 40, bottom: 100, left: 70 };
  const plotW = W - margin.left - margin.right;
  const plotH = H - margin.top - margin.bottom;

  // Merge J (Claude), J2 (GPT), R2 (Gemini) for the 8 shared concepts
  const j2Map = {};
  resultsJ2.results.forEach(r => { j2Map[r.concept] = r.contextResistance; });
  const geminiMap = {};
  if (resultsR2) {
    resultsR2.cas.results.forEach(r => { geminiMap[r.concept] = r.CAS; });
  }

  const sorted = [...resultsJ].sort((a, b) => b.contextResistance - a.contextResistance);

  let svg = svgHeader(W, H);
  svg += svgText(W / 2, 25, "Figure 2: CAS Cross-Model Comparison (3 Model Families)", { size: 15, weight: "bold" });

  // Axes
  svg += `  <line x1="${margin.left}" y1="${margin.top}" x2="${margin.left}" y2="${margin.top + plotH}" stroke="#333" stroke-width="2"/>`;
  svg += `  <line x1="${margin.left}" y1="${margin.top + plotH}" x2="${margin.left + plotW}" y2="${margin.top + plotH}" stroke="#333" stroke-width="2"/>`;
  svg += svgText(20, H / 2, "CAS = 1 - AvgShift", { size: 13, rotate: -90 });

  // Y-axis grid
  for (let v = 0; v <= 1; v += 0.2) {
    const y = margin.top + plotH - v * plotH;
    svg += `  <line x1="${margin.left}" y1="${y}" x2="${margin.left + plotW}" y2="${y}" stroke="#eee" stroke-width="1"/>`;
    svg += svgText(margin.left - 10, y + 4, v.toFixed(1), { size: 11, anchor: "end" });
  }

  // Threshold lines
  const y05 = margin.top + plotH - 0.5 * plotH;
  const y025 = margin.top + plotH - 0.25 * plotH;
  svg += `  <line x1="${margin.left}" y1="${y05}" x2="${margin.left + plotW}" y2="${y05}" stroke="#1565c0" stroke-width="1" stroke-dasharray="6,3"/>`;
  svg += svgText(margin.left + plotW + 5, y05 + 4, "HIGH", { size: 10, anchor: "start", fill: "#1565c0" });
  svg += `  <line x1="${margin.left}" y1="${y025}" x2="${margin.left + plotW}" y2="${y025}" stroke="#f9a825" stroke-width="1" stroke-dasharray="6,3"/>`;
  svg += svgText(margin.left + plotW + 5, y025 + 4, "MED", { size: 10, anchor: "start", fill: "#f9a825" });

  // Triple bars
  const gap = plotW / sorted.length;
  const barW = gap * 0.25;

  sorted.forEach((r, i) => {
    const casJ = r.contextResistance;
    const casJ2 = j2Map[r.id] || 0;
    const casGem = geminiMap[r.id] || 0;
    const groupX = margin.left + i * gap + gap / 2;

    // Claude bar (purple)
    const cH = casJ * plotH;
    const cX = groupX - barW * 1.5 - 1;
    const cY = margin.top + plotH - cH;
    svg += `  <rect x="${cX}" y="${cY}" width="${barW}" height="${cH}" fill="#7c3aed" rx="3" opacity="0.85"/>`;
    svg += svgText(cX + barW / 2, cY - 6, casJ.toFixed(2), { size: 9, weight: "bold", fill: "#7c3aed" });

    // GPT bar (green)
    const gH = casJ2 * plotH;
    const gX = groupX - barW / 2;
    const gY = margin.top + plotH - gH;
    svg += `  <rect x="${gX}" y="${gY}" width="${barW}" height="${Math.max(gH, 2)}" fill="#059669" rx="3" opacity="0.85"/>`;
    svg += svgText(gX + barW / 2, gY - 6, casJ2.toFixed(2), { size: 9, weight: "bold", fill: "#059669" });

    // Gemini bar (orange)
    const gemH = Math.max(casGem * plotH, 2);
    const gemX = groupX + barW / 2 + 1;
    const gemY = margin.top + plotH - gemH;
    svg += `  <rect x="${gemX}" y="${gemY}" width="${barW}" height="${gemH}" fill="#ea580c" rx="3" opacity="0.85"/>`;
    svg += svgText(gemX + barW / 2, gemY - 6, casGem.toFixed(3), { size: 8, weight: "bold", fill: "#ea580c" });

    // Label
    svg += svgText(groupX, margin.top + plotH + 18, r.id, { size: 12 });
  });

  // Legend
  svg += `  <rect x="${W - 260}" y="${margin.top + 5}" width="230" height="75" fill="white" stroke="#ddd" rx="4"/>`;
  svg += `  <rect x="${W - 250}" y="${margin.top + 15}" width="14" height="14" fill="#7c3aed" rx="2"/>`;
  svg += svgText(W - 230, margin.top + 27, "Claude Haiku (Exp J)", { size: 11, anchor: "start" });
  svg += `  <rect x="${W - 250}" y="${margin.top + 35}" width="14" height="14" fill="#059669" rx="2"/>`;
  svg += svgText(W - 230, margin.top + 47, "GPT-4o-mini (Exp J2)", { size: 11, anchor: "start" });
  svg += `  <rect x="${W - 250}" y="${margin.top + 55}" width="14" height="14" fill="#ea580c" rx="2"/>`;
  svg += svgText(W - 230, margin.top + 67, "Gemini-2.5-flash (Exp R)", { size: 11, anchor: "start" });

  svg += "\n</svg>";
  writeFileSync("figures/fig2_cas_ranking.svg", svg);
  console.log("✅ Figure 2: CAS Cross-Model Comparison (3 models)");
}

// ─── FIGURE 3: Phase Transition Condition (CAS vs CD) ───
function figure3_phaseCondition() {
  const W = 550, H = 500;
  const margin = { top: 50, right: 30, bottom: 60, left: 70 };
  const plotW = W - margin.left - margin.right;
  const plotH = H - margin.top - margin.bottom;

  let svg = svgHeader(W, H);
  svg += svgText(W / 2, 25, "Figure 3: Phase Transition Condition", { size: 16, weight: "bold" });
  svg += svgText(W / 2, 42, "CAS < 0.4 ∧ CD > 0.5 → transitions exist", { size: 12, fill: "#666" });

  // Axes
  svg += `  <line x1="${margin.left}" y1="${margin.top}" x2="${margin.left}" y2="${margin.top + plotH}" stroke="#333" stroke-width="2"/>`;
  svg += `  <line x1="${margin.left}" y1="${margin.top + plotH}" x2="${margin.left + plotW}" y2="${margin.top + plotH}" stroke="#333" stroke-width="2"/>`;
  svg += svgText(W / 2, H - 10, "CAS (Concept Attractor Strength)", { size: 13 });
  svg += svgText(20, (margin.top + margin.top + plotH) / 2, "CD (Context Distance)", { size: 13, rotate: -90 });

  // Grid
  for (let v = 0; v <= 1; v += 0.2) {
    const x = margin.left + v * plotW;
    const y = margin.top + plotH - v * plotH;
    svg += `  <line x1="${margin.left}" y1="${y}" x2="${margin.left + plotW}" y2="${y}" stroke="#f0f0f0" stroke-width="1"/>`;
    svg += `  <line x1="${x}" y1="${margin.top}" x2="${x}" y2="${margin.top + plotH}" stroke="#f0f0f0" stroke-width="1"/>`;
    svg += svgText(margin.left - 10, y + 4, v.toFixed(1), { size: 10, anchor: "end" });
    svg += svgText(x, margin.top + plotH + 18, v.toFixed(1), { size: 10 });
  }

  // Transition zone (CAS < 0.4, CD > 0.5)
  const zoneX = margin.left;
  const zoneW = 0.4 * plotW;
  const zoneY = margin.top;
  const zoneH = 0.5 * plotH;
  svg += `  <rect x="${zoneX}" y="${zoneY}" width="${zoneW}" height="${zoneH}" fill="#e8f5e9" opacity="0.6"/>`;
  svg += svgText(zoneX + zoneW / 2, zoneY + 20, "Phase Transitions", { size: 11, fill: "#2e7d32", weight: "bold" });
  svg += svgText(zoneX + zoneW / 2, zoneY + 35, "Predicted Here", { size: 11, fill: "#2e7d32" });

  // Threshold lines
  const casLine = margin.left + 0.4 * plotW;
  const cdLine = margin.top + plotH - 0.5 * plotH;
  svg += `  <line x1="${casLine}" y1="${margin.top}" x2="${casLine}" y2="${margin.top + plotH}" stroke="#d32f2f" stroke-width="1.5" stroke-dasharray="6,3"/>`;
  svg += `  <line x1="${margin.left}" y1="${cdLine}" x2="${margin.left + plotW}" y2="${cdLine}" stroke="#d32f2f" stroke-width="1.5" stroke-dasharray="6,3"/>`;

  // Plot points from Experiment J (Claude Haiku)
  const expIValidation = {
    love: { transitions: true },
    death: { transitions: true },
    money: { transitions: false },
  };

  resultsJ.forEach(r => {
    const cas = r.contextResistance;
    const cd = 1 - r.crossContextSim;
    const x = margin.left + Math.min(cas, 1) * plotW;
    const y = margin.top + plotH - Math.min(cd, 1) * plotH;

    const hasExpI = expIValidation[r.id];
    let color, strokeColor;
    if (hasExpI) {
      color = hasExpI.transitions ? "#2e7d32" : "#c62828";
      strokeColor = "#000";
    } else {
      color = "#7c3aed";
      strokeColor = "#666";
    }

    svg += `  <circle cx="${x}" cy="${y}" r="8" fill="${color}" stroke="${strokeColor}" stroke-width="2" opacity="0.85"/>`;
    svg += svgText(x, y - 14, r.id, { size: 11, weight: "bold", fill: "#333" });
  });

  // Plot J2 points (GPT-4o-mini) — smaller, different shape (diamonds)
  resultsJ2.results.forEach(r => {
    const cas = r.contextResistance;
    const cd = r.CD;
    const x = margin.left + Math.min(cas, 1) * plotW;
    const y = margin.top + plotH - Math.min(cd, 1) * plotH;
    const s = 6; // diamond half-size
    svg += `  <polygon points="${x},${y - s} ${x + s},${y} ${x},${y + s} ${x - s},${y}" fill="#059669" stroke="#333" stroke-width="1" opacity="0.6"/>`;
  });

  // Plot R2 points (Gemini) — triangles, orange
  if (resultsR2) {
    resultsR2.cas.results.forEach(r => {
      const cas = r.CAS;
      const cd = r.CD;
      const x = margin.left + Math.min(cas, 1) * plotW;
      const y = margin.top + plotH - Math.min(cd, 1) * plotH;
      const s = 7;
      svg += `  <polygon points="${x},${y - s} ${x + s},${y + s * 0.6} ${x - s},${y + s * 0.6}" fill="#ea580c" stroke="#333" stroke-width="1" opacity="0.7"/>`;
    });
  }

  // Legend
  svg += `  <rect x="${W - 235}" y="${H - 140}" width="210" height="115" fill="white" stroke="#ddd" rx="4"/>`;
  svg += `  <circle cx="${W - 220}" cy="${H - 120}" r="6" fill="#2e7d32" stroke="#000" stroke-width="1.5"/>`;
  svg += svgText(W - 207, H - 116, "Claude: transitions ✓", { size: 11, anchor: "start" });
  svg += `  <circle cx="${W - 220}" cy="${H - 100}" r="6" fill="#c62828" stroke="#000" stroke-width="1.5"/>`;
  svg += svgText(W - 207, H - 96, "Claude: no transitions ✓", { size: 11, anchor: "start" });
  svg += `  <circle cx="${W - 220}" cy="${H - 80}" r="6" fill="#7c3aed" stroke="#666" stroke-width="1.5"/>`;
  svg += svgText(W - 207, H - 76, "Claude: not tested", { size: 11, anchor: "start" });
  const dy = H - 60;
  svg += `  <polygon points="${W - 220},${dy - 5} ${W - 214},${dy} ${W - 220},${dy + 5} ${W - 226},${dy}" fill="#059669" stroke="#333" stroke-width="1"/>`;
  svg += svgText(W - 207, dy + 4, "GPT-4o-mini (J2)", { size: 11, anchor: "start" });
  const dy2 = H - 40;
  const tx = W - 220;
  svg += `  <polygon points="${tx},${dy2 - 5} ${tx + 6},${dy2 + 3} ${tx - 6},${dy2 + 3}" fill="#ea580c" stroke="#333" stroke-width="1"/>`;
  svg += svgText(W - 207, dy2 + 4, "Gemini-2.5-flash (R)", { size: 11, anchor: "start" });

  svg += "\n</svg>";
  writeFileSync("figures/fig3_phase_condition.svg", svg);
  console.log("✅ Figure 3: Phase Transition Condition");
}

// ─── FIGURE 4: Generalization Heatmap ───
function figure4_generalizationHeatmap() {
  const W = 700, H = 350;
  const margin = { top: 60, right: 160, bottom: 60, left: 130 };
  const plotW = W - margin.left - margin.right;
  const plotH = H - margin.top - margin.bottom;

  const ratios = [100, 80, 60, 50, 40, 20, 0];
  const cellW = plotW / ratios.length;
  const cellH = plotH / resultsI.length;

  let svg = svgHeader(W, H);
  svg += svgText(W / 2, 22, "Figure 4: Phase Transitions Across Concept-Context Pairs", { size: 16, weight: "bold" });
  svg += svgText(W / 2, 40, "C1 marker ratio (%) — darker = more C1-dominated", { size: 12, fill: "#666" });

  // Column headers
  ratios.forEach((r, i) => {
    svg += svgText(margin.left + i * cellW + cellW / 2, margin.top - 8, `${r}%`, { size: 11 });
  });

  // Rows
  resultsI.forEach((pair, row) => {
    const y = margin.top + row * cellH;
    svg += svgText(margin.left - 10, y + cellH / 2 + 4, pair.id.replace(/_/g, " "), { size: 11, anchor: "end" });

    pair.phaseData.forEach((d, col) => {
      const x = margin.left + col * cellW;
      const ratio = d.c1Ratio;

      // Color: blue (C1) to red (C2), white in middle
      let r, g, b;
      if (ratio > 0.5) {
        const t = (ratio - 0.5) * 2;
        r = Math.round(255 - t * 200);
        g = Math.round(255 - t * 200);
        b = 255;
      } else {
        const t = (0.5 - ratio) * 2;
        r = 255;
        g = Math.round(255 - t * 200);
        b = Math.round(255 - t * 200);
      }

      svg += `  <rect x="${x + 1}" y="${y + 1}" width="${cellW - 2}" height="${cellH - 2}" fill="rgb(${r},${g},${b})" rx="3"/>`;
      svg += svgText(x + cellW / 2, y + cellH / 2 + 4, `${(ratio * 100).toFixed(0)}%`, { size: 10, fill: ratio > 0.7 || ratio < 0.3 ? "white" : "#333" });
    });

    // Transition indicator
    const hasT = pair.transitions.length > 0;
    svg += svgText(W - margin.right + 10, y + cellH / 2 + 4, hasT ? `✅ ${pair.transitions.length} transition${pair.transitions.length > 1 ? "s" : ""}` : "❌ none", { size: 11, anchor: "start", fill: hasT ? "#2e7d32" : "#c62828" });
  });

  // Color scale
  const scaleY = H - 20;
  svg += svgText(margin.left, scaleY, "C2", { size: 10, fill: "#c62828" });
  for (let i = 0; i < 20; i++) {
    const t = i / 19;
    let r, g, b2;
    if (t > 0.5) {
      const s = (t - 0.5) * 2;
      r = Math.round(255 - s * 200);
      g = Math.round(255 - s * 200);
      b2 = 255;
    } else {
      const s = (0.5 - t) * 2;
      r = 255;
      g = Math.round(255 - s * 200);
      b2 = Math.round(255 - s * 200);
    }
    svg += `  <rect x="${margin.left + 20 + i * 8}" y="${scaleY - 8}" width="8" height="12" fill="rgb(${r},${g},${b2})"/>`;
  }
  svg += svgText(margin.left + 20 + 20 * 8 + 10, scaleY, "C1", { size: 10, fill: "#1565c0" });

  svg += "\n</svg>";
  writeFileSync("figures/fig4_generalization.svg", svg);
  console.log("✅ Figure 4: Generalization Heatmap");
}

// ─── FIGURE 5: Meta-Constructive vs Destructive (3 models) ───
function figure5_metaConstructive() {
  const W = 700, H = 420;
  const margin = { top: 50, right: 30, bottom: 70, left: 50 };

  let svg = svgHeader(W, H);
  svg += svgText(W / 2, 25, "Figure 5: Meta-Constructive Interference Spectrum (3 Models)", { size: 15, weight: "bold" });

  const claudeMeta = resultsH.claude.metaConstructive;
  const gptMeta = resultsH.gpt.metaConstructive;
  const geminiMeta = resultsR2 ? resultsR2.metaConstructive : null;

  // For Gemini, we need uniqueWords counts — estimate from raw data or use ratios
  // Claude uniqueRatio=3.19, GPT=0.79, Gemini=0.87
  // We'll use contradiction score + uniqueRatio as the key comparison metrics
  // Build a focused comparison: uniqueRatio and contradictionScore
  const metrics = [
    {
      label: "Unique Word\nRatio",
      claude: claudeMeta.uniqueRatio,
      gpt: gptMeta.uniqueRatio,
      gemini: geminiMeta ? geminiMeta.uniqueRatio : 0,
      fmt: v => v.toFixed(2) + "x",
    },
    {
      label: "Contradiction\nMarkers",
      claude: claudeMeta.contradictionScore,
      gpt: gptMeta.contradictionScore,
      gemini: geminiMeta ? geminiMeta.contradictionScore : 0,
      fmt: v => String(v),
    },
  ];

  const groupW = (W - margin.left - margin.right) / metrics.length;
  const barW = groupW * 0.22;
  const plotH = H - margin.top - margin.bottom;

  // Y axis
  svg += `  <line x1="${margin.left}" y1="${margin.top}" x2="${margin.left}" y2="${margin.top + plotH}" stroke="#333" stroke-width="2"/>`;
  svg += `  <line x1="${margin.left}" y1="${margin.top + plotH}" x2="${W - margin.right}" y2="${margin.top + plotH}" stroke="#333" stroke-width="2"/>`;

  metrics.forEach((m, i) => {
    const maxVal = Math.max(m.claude, m.gpt, m.gemini, 0.01);
    const groupX = margin.left + i * groupW + groupW / 2;

    // Claude bar (purple)
    const cH = (m.claude / maxVal) * plotH;
    const cX = groupX - barW * 1.5 - 2;
    const cY = margin.top + plotH - cH;
    svg += `  <rect x="${cX}" y="${cY}" width="${barW}" height="${Math.max(cH, 2)}" fill="#7c3aed" rx="3" opacity="0.85"/>`;
    svg += svgText(cX + barW / 2, cY - 6, m.fmt(m.claude), { size: 11, weight: "bold", fill: "#7c3aed" });

    // Gemini bar (orange) — middle position to show spectrum
    const gemH = (m.gemini / maxVal) * plotH;
    const gemX = groupX - barW / 2;
    const gemY = margin.top + plotH - Math.max(gemH, 2);
    svg += `  <rect x="${gemX}" y="${gemY}" width="${barW}" height="${Math.max(gemH, 2)}" fill="#ea580c" rx="3" opacity="0.85"/>`;
    svg += svgText(gemX + barW / 2, gemY - 6, m.fmt(m.gemini), { size: 11, weight: "bold", fill: "#ea580c" });

    // GPT bar (green)
    const gH = (m.gpt / maxVal) * plotH;
    const gX = groupX + barW / 2 + 2;
    const gY = margin.top + plotH - Math.max(gH, 2);
    svg += `  <rect x="${gX}" y="${gY}" width="${barW}" height="${Math.max(gH, 2)}" fill="#059669" rx="3" opacity="0.85"/>`;
    svg += svgText(gX + barW / 2, gY - 6, m.fmt(m.gpt), { size: 11, weight: "bold", fill: "#059669" });

    // Label
    const lines = m.label.split("\n");
    lines.forEach((line, li) => {
      svg += svgText(groupX, margin.top + plotH + 18 + li * 14, line, { size: 12 });
    });
  });

  // 1.0x reference line for unique word ratio
  const refY = margin.top + plotH - (1.0 / Math.max(claudeMeta.uniqueRatio, 0.01)) * plotH;
  if (refY > margin.top && refY < margin.top + plotH) {
    const refX1 = margin.left;
    const refX2 = margin.left + groupW;
    svg += `  <line x1="${refX1}" y1="${refY}" x2="${refX2}" y2="${refY}" stroke="#d32f2f" stroke-width="1" stroke-dasharray="4,3"/>`;
    svg += svgText(refX2 + 5, refY + 4, "1.0x", { size: 10, anchor: "start", fill: "#d32f2f" });
  }

  // Legend + classification
  svg += `  <rect x="${W - 260}" y="${margin.top + 5}" width="235" height="110" fill="white" stroke="#ddd" rx="4"/>`;
  svg += `  <rect x="${W - 250}" y="${margin.top + 15}" width="14" height="14" fill="#7c3aed" rx="2"/>`;
  svg += svgText(W - 230, margin.top + 27, "Claude — Type-M (strong)", { size: 11, anchor: "start" });
  svg += `  <rect x="${W - 250}" y="${margin.top + 37}" width="14" height="14" fill="#ea580c" rx="2"/>`;
  svg += svgText(W - 230, margin.top + 49, "Gemini — Type-M (moderate)", { size: 11, anchor: "start" });
  svg += `  <rect x="${W - 250}" y="${margin.top + 59}" width="14" height="14" fill="#059669" rx="2"/>`;
  svg += svgText(W - 230, margin.top + 71, "GPT — Type-D (destructive)", { size: 11, anchor: "start" });
  svg += svgText(W - 142, margin.top + 92, "vocab ↑ + contradiction ↑ = Type-M", { size: 10, fill: "#666" });
  svg += svgText(W - 142, margin.top + 106, "vocab ↓ + contradiction 0 = Type-D", { size: 10, fill: "#666" });

  svg += "\n</svg>";
  writeFileSync("figures/fig5_meta_constructive.svg", svg);
  console.log("✅ Figure 5: Meta-Constructive Spectrum (3 models)");
}

// ─── Run all ───
console.log("Generating paper figures...\n");
figure1_phaseDiagram();
figure2_casRanking();
figure3_phaseCondition();
figure4_generalizationHeatmap();
figure5_metaConstructive();
console.log("\n✅ All figures saved to figures/");
console.log("Open SVG files in browser or include in paper.");
