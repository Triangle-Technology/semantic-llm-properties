# Semantic Computing — Project Map

> File này tồn tại để Claude (hoặc bất kỳ ai) có thể hiểu toàn bộ dự án
> trong vài phút, ngay cả khi chưa từng thấy repo trước đó.
>
> **CẬP NHẬT file này mỗi khi thêm/xóa/đổi tên file hoặc thư mục quan trọng.**

*Last updated: 2026-03-17 · 88 files · ~4.5 MB (không tính node_modules)*

---

## Tổng quan dự án

**Mục tiêu:** Chứng minh LLMs có các tính chất cấu trúc (superposition, interference, phase transitions) có thể đo lường và khai thác — đặt nền móng cho paradigm "Semantic Computing".

**Trạng thái:** Paper v1 hoàn tất (22 experiments, ~4,800 API calls, Claude + GPT-4o-mini). Sẵn sàng arXiv.

**Tech stack:** Node.js (CommonJS) · Anthropic SDK · OpenAI SDK · LaTeX (MiKTeX) · Cloudflare Workers (demo)

---

## Cấu trúc thư mục

```
Claude's languages/
│
├── 📄 PAPER & PUBLICATION
│   ├── paper.tex              # LaTeX source — bản chính cho arXiv submission
│   ├── paper.pdf              # Compiled PDF (22 trang, ~465KB)
│   ├── paper.{aux,bbl,blg,log,out}  # LaTeX build artifacts (có thể xóa)
│   ├── references.bib         # BibTeX — 20 citations
│   ├── BUILD_LATEX.md         # Hướng dẫn compile LaTeX (MiKTeX/TeX Live)
│   └── PAPER_DRAFT.md         # Markdown source gốc → đã convert sang .tex
│
├── 📊 FIGURES (cho paper)
│   ├── figures/
│   │   ├── fig1_phase_diagram.{svg,pdf}     # Phase diagram (Exp D, E)
│   │   ├── fig2_cas_ranking.{svg,pdf}       # CAS ranking across concepts (Exp J2)
│   │   ├── fig3_phase_condition.{svg,pdf}   # CAS < 0.4 ∧ CD > 0.5 condition (Exp J2)
│   │   ├── fig4_generalization.{svg,pdf}    # Generalization across concept types (Exp I)
│   │   └── fig5_meta_constructive.{svg,pdf} # Type-M vs Type-D (Exp H)
│   └── convert_figures.mjs    # SVG → PDF converter (Inkscape hoặc pdfkit)
│
├── 🧪 EXPERIMENTS (22 experiments, A → Q2)
│   ├── experiments/
│   │   ├── experiment_a_born_rule.mjs       # Exp A: Semantic "Born rule" — context → output distribution
│   │   ├── experiment_b_interference.mjs    # Exp B: Two-context interference patterns
│   │   ├── experiment_c_entanglement.mjs    # Exp C: Cross-concept correlation
│   │   ├── experiment_d_interference_characterization.mjs  # Exp D: Constructive/destructive classification
│   │   ├── experiment_e_phase_mapping.mjs   # Exp E: Phase diagram mapping (mixing ratios)
│   │   ├── experiment_f_destructive_interference.mjs       # Exp F: Pure destructive patterns
│   │   ├── experiment_g_semantic_circuit.mjs  # Exp G: First semantic circuit (multi-gate)
│   │   ├── experiment_h_cross_model.mjs     # Exp H: Claude vs GPT — Type-M vs Type-D discovery
│   │   ├── experiment_i_generalization.mjs  # Exp I: CAS across concept categories
│   │   ├── experiment_j_cas.mjs             # Exp J: CAS metric development
│   │   ├── experiment_j2_cas_expanded.mjs   # Exp J2: Expanded CAS — CAS = 1 - AvgShift
│   │   ├── experiment_k_practical.mjs       # Exp K: Practical application test
│   │   ├── experiment_k2_confound.mjs       # Exp K2: Confound analysis
│   │   ├── experiment_l_crossmodel_circuit.mjs  # Exp L: Cross-model circuit execution
│   │   ├── experiment_m_scaling_advantage.mjs   # Exp M: Circuit vs free-form comparison
│   │   ├── experiment_m2_emergence_test.mjs # Exp M2: Emergence as LLM property (not circuit property)
│   │   ├── experiment_n_dissolution.mjs     # Exp N: Dissolution problems (inexpressible in code)
│   │   ├── experiment_n2_actual_programs.mjs # Exp N2: Programming vs semantic computing comparison
│   │   ├── experiment_o_boundary.mjs        # Exp O: Boundary conditions of dissolution
│   │   ├── experiment_p_selfdetect.mjs      # Exp P: Self-detection of semantic operations
│   │   ├── experiment_q_production_evaluation.mjs  # Exp Q: Production-readiness evaluation
│   │   ├── experiment_q2_stance.mjs         # Exp Q2: Stance stability analysis
│   │   │
│   │   ├── results_*.json                   # Raw JSON results cho mỗi experiment (22 files)
│   │   │
│   │   ├── analyze_j.mjs                    # Analysis script cho Exp J
│   │   ├── analyze_n2.mjs                   # Analysis script cho Exp N2
│   │   ├── analyze_q.mjs                    # Analysis script cho Exp Q
│   │   ├── analyze_q2.mjs                   # Analysis script cho Exp Q2
│   │   │
│   │   ├── generate_figures.mjs             # Tạo 5 figures từ experiment data
│   │   └── run_all.mjs                      # Chạy tất cả experiments tuần tự
│
├── 🔧 SDK (Semantic Computing SDK v1.0)
│   ├── sdk/
│   │   ├── index.mjs          # Barrel export — import everything from one place (40 exports)
│   │   ├── semantic.mjs       # Core — SemanticState (v1.0: +cas, +phase, +trace),
│   │   │                      #   Gates, SemanticCircuit, Runner (v1.0: +router support)
│   │   ├── analysis.mjs       # Analysis functions — extractWords, wordFrequency,
│   │   │                      #   cosineSimilarity, shannonEntropy, normalizedEntropy,
│   │   │                      #   findEmergent, scoreWithMarkers, contradictionScore
│   │   ├── router.mjs         # Multi-model client — createClient("claude-*" | "gpt-*"),
│   │   │                      #   detectProvider, modelType (Type-M/D), bestModelFor
│   │   ├── profiler.mjs       # Semantic Profiler — measureCAS, detectPhaseTransitions,
│   │   │                      #   classifyInterference, profile (all-in-one)
│   │   │                      #   + KNOWN_CONCEPTS (8 pre-defined concept/context pairs)
│   │   ├── primitives.mjs     # 5 Semantic Primitives — superpose, interfere, reframe,
│   │   │                      #   synthesize, validate (returns enriched SemanticState)
│   │   └── demo_circuit.mjs   # "Hello World" — rebuild Exp G bằng SDK (~20 dòng)
│
├── 🖥️ CLI (Command-Line Interface)
│   ├── cli/
│   │   └── index.mjs          # CLI entry point — cas, phase, interfere, profile, list
│   │                          #   Usage: node cli/index.mjs profile "justice"
│
├── 🌐 DEMO (Live web demo)
│   ├── semantic-circuit-demo/
│   │   ├── README.md          # Hướng dẫn deploy
│   │   ├── frontend/
│   │   │   ├── index.html     # Single-page demo UI
│   │   │   ├── style.css      # Styles (5-column grid cho 5 primitives)
│   │   │   └── app.js         # Frontend logic
│   │   └── worker/
│   │       ├── index.js       # Cloudflare Worker backend (API proxy)
│   │       └── wrangler.toml  # Cloudflare config
│   │
│   ├── demo.mjs               # CLI demo — decision advisor circuit
│   │                          #   Usage: node demo.mjs "Should I quit my job?"
│   └── demo/
│       ├── demo-001.md        # Demo session transcript
│       ├── demo002.md         # Demo session transcript
│       ├── comparison-001.md  # Circuit vs free-form comparison
│       └── *.json             # Raw demo output data (4 files)
│
├── 📚 RESEARCH DOCUMENTS (Vietnamese)
│   ├── FOUNDATIONS_v2.md      # Tài liệu nền tảng chính — tích hợp 22 experiments
│   │                          #   Phiên bản tiếng Việt, cập nhật v2.11
│   ├── FOUNDATIONS.md         # Phiên bản cũ (v1) — giữ lại để tham khảo
│   ├── SEMANTIC_PRIMITIVES.md # 5 primitives chi tiết: SUPERPOSE, INTERFERE,
│   │                          #   REFRAME, SYNTHESIZE, VALIDATE
│   ├── SEMANTIC_GATES.md      # Formalism cho semantic gates — dựa trên Exp A-E
│   ├── FORMAL_PROOF.md        # Inexpressibility argument — tại sao programming không đủ
│   ├── FIRST_ALGORITHM.md     # Thuật toán đầu tiên (lịch sử)
│   └── SELF_EXPLORATION_001.md # Ghi chú khám phá ban đầu (lịch sử)
│
├── 🗺️ PROJECT META
│   ├── PROJECT_MAP.md         # ← FILE NÀY — bản đồ toàn bộ dự án
│   ├── ROADMAP.md             # Lộ trình 5 phases → tầm nhìn 10 năm
│   ├── package.json           # Node.js config (anthropic sdk, openai, pdfkit)
│   └── package-lock.json      # Dependency lock
│
└── ⚙️ CONFIG
    ├── .claude/settings.local.json  # Claude Code local settings
    └── .wrangler/tmp/               # Wrangler temp files
```

---

## Mối quan hệ giữa các thành phần

```
FOUNDATIONS_v2.md (lý thuyết tiếng Việt)
        │
        ▼
PAPER_DRAFT.md (bản nháp tiếng Anh)
        │
        ▼
paper.tex ──────► paper.pdf (arXiv submission)
   │                  │
   ├── references.bib │
   └── figures/*.pdf ─┘
           ▲
           │
experiments/*.mjs ──► experiments/results_*.json ──► generate_figures.mjs ──► figures/*.svg
                                                                                    │
                                                                          convert_figures.mjs
                                                                                    │
                                                                              figures/*.pdf

sdk/semantic.mjs ◄── Abstraction layer trên experiments
       │
       ├── sdk/demo_circuit.mjs (code demo)
       └── demo.mjs (CLI demo)
              │
              ▼
semantic-circuit-demo/ (web demo trên Cloudflare)
```

---

## Dữ liệu quan trọng cần bảo vệ

| File/Thư mục | Tại sao quan trọng | Có thể tái tạo? |
|---|---|---|
| `experiments/results_*.json` | Raw data từ ~4,800 API calls | Có, nhưng tốn ~$50+ API cost |
| `FOUNDATIONS_v2.md` | Tài liệu lý thuyết gốc bằng tiếng Việt | Không — original thinking |
| `paper.tex` | Bản LaTeX chính | Có thể tái convert từ PAPER_DRAFT.md |
| `PAPER_DRAFT.md` | Bản nháp gốc | Không — original writing |
| `sdk/semantic.mjs` | SDK core — nhiều design decisions | Khó tái tạo chính xác |
| `SEMANTIC_PRIMITIVES.md` | Formalization của 5 primitives | Không — original framework |

---

## Experiment Quick Reference

| ID | File | Mục đích | Kết quả chính |
|----|------|----------|---------------|
| A | experiment_a_born_rule.mjs | Context → output distribution | Semantic "Born rule" analog confirmed |
| B | experiment_b_interference.mjs | Two-context interaction | Interference patterns exist |
| C | experiment_c_entanglement.mjs | Cross-concept correlation | Correlation exists but ≠ quantum entanglement |
| D | experiment_d_interference_characterization.mjs | Classify interference types | Constructive > destructive > null |
| E | experiment_e_phase_mapping.mjs | Phase diagram | Phase transitions at specific mixing ratios |
| F | experiment_f_destructive_interference.mjs | Pure destruction | Confirmed destructive patterns |
| G | experiment_g_semantic_circuit.mjs | Multi-gate circuit | Circuit produces emergent output |
| H | experiment_h_cross_model.mjs | Claude vs GPT | Type-M (meta-constructive) vs Type-D (destructive) |
| I | experiment_i_generalization.mjs | Multiple concept types | CAS varies by concept category |
| J | experiment_j_cas.mjs | CAS metric v1 | Initial CAS metric |
| J2 | experiment_j2_cas_expanded.mjs | CAS metric v2 | CAS = 1 - AvgShift (final formula) |
| K | experiment_k_practical.mjs | Real-world application | Practical viability confirmed |
| K2 | experiment_k2_confound.mjs | Confound check | Results not artifacts of prompt design |
| L | experiment_l_crossmodel_circuit.mjs | Cross-model circuits | Circuits work across models |
| M | experiment_m_scaling_advantage.mjs | Circuit vs free-form | Circuit: reliability; free-form: creativity |
| M2 | experiment_m2_emergence_test.mjs | Emergence source | Emergence = LLM property, not circuit property |
| N | experiment_n_dissolution.mjs | Dissolution problems | 100% semantic vs 0% classical |
| N2 | experiment_n2_actual_programs.mjs | Code vs semantic | Programming literally cannot express these |
| O | experiment_o_boundary.mjs | Boundary conditions | Where dissolution advantage breaks down |
| P | experiment_p_selfdetect.mjs | Self-detection | LLM can detect own semantic operations |
| Q | experiment_q_production_evaluation.mjs | Production readiness | Reliability assessment |
| Q2 | experiment_q2_stance.mjs | Stance stability | CAS predicts stance stability |

---

## Key Metrics & Formulas

```
CAS = 1 - AvgShift          # Concept Attractor Strength (Exp J2)
                              # Đo concept resistance to contextual reshaping
                              # Range: 0 (fully context-dependent) → 1 (fully stable)

Phase Transition Condition:   # Predicts when concept meaning will shift
  CAS < 0.4 ∧ CD > 0.5      # CD = Context Dominance

5 Semantic Primitives:
  SUPERPOSE → INTERFERE → REFRAME → SYNTHESIZE → VALIDATE
```

---

## Conventions

- **Tên file experiment:** `experiment_{letter}_{short_name}.mjs`
- **Tên file kết quả:** `results_{letter}_{short_name}.json`
- **Analysis scripts:** `analyze_{letter}.mjs` (chỉ cho experiments cần post-processing phức tạp)
- **Figures:** `fig{N}_{descriptive_name}.{svg,pdf}`
- **Tài liệu tiếng Việt:** UPPER_CASE.md (FOUNDATIONS, SEMANTIC_PRIMITIVES, ...)
- **Tài liệu tiếng Anh:** paper.tex, BUILD_LATEX.md
- **Module system:** CommonJS (`"type": "commonjs"` trong package.json), nhưng experiments dùng `.mjs` (ES modules)

---

## Khi thêm file mới

1. Thêm vào đúng thư mục theo cấu trúc trên
2. **CẬP NHẬT FILE NÀY** — thêm mô tả ngắn vào cây thư mục
3. Nếu là experiment mới: thêm vào bảng Experiment Quick Reference
4. Nếu là figure mới: cập nhật cả SVG và PDF
5. Nếu là tài liệu lý thuyết: ghi rõ language (Vietnamese/English) và version

---

*Tài liệu này là bộ nhớ dài hạn của dự án. Giữ nó chính xác.*
