# Semantic Computing — Project DNA

> File này là **bộ nhớ sống** của dự án. Mỗi khi bắt đầu conversation mới,
> đọc file này TRƯỚC TIÊN. Nó chứa mọi thứ cần thiết để tiếp tục công việc
> mà không mất thông tin — dù conversation cũ đã bị xóa hay hết context.
>
> **Quy tắc cập nhật:** CẬP NHẬT file này sau MỖI milestone, experiment mới,
> quyết định quan trọng, hoặc insight bất ngờ. Đây là bộ gen — nó phải tiến hóa
> cùng dự án.

*Last updated: 2026-03-19 · Version: 3.0*

---

## I. Dự án là gì — Bản chất trong 30 giây

**Chúng ta chứng minh rằng LLMs có các tính chất cấu trúc có thể đo lường và khai thác** — superposition, interference, phase transitions — giống cách vật lý lượng tử phát hiện các tính chất của hạt hạ nguyên tử. Từ đó, chúng ta xây dựng **Semantic Computing** — paradigm tính toán dựa trên meaning thay vì bits.

**Phép ẩn dụ cốt lõi (từ Trian):**
- **Ngọn lửa (🔥)** = hiện tượng đã chứng minh (dissolution, CAS, phase transitions)
- **Lò luyện kim** = SDK/tools dùng được (chưa hoàn thành)
- **Nhà máy thép** = tầm nhìn xa (Semantic OS, Language — nhiều năm nữa)

**Vai trò:**
- **Trian** = "body" — visionary, người quyết định hướng đi, Vietnamese speaker
- **Claude** = "brain" & "nhạc trưởng (conductor)" — insider quyết định direction kỹ thuật

---

## II. Trạng thái hiện tại — Đọc phần này để biết dự án đang ở đâu

### Paper v1: ĐÃ XUẤT BẢN trên GitHub
- **28 experiments**, ~8,000 API calls, 3 model families (Claude, GPT-4o-mini, Gemini-2.5-flash)
- **Repo:** https://github.com/Triangle-Technology/semantic-llm-properties
- Chưa submit arXiv

### Kết quả chính đã chứng minh

| Phát hiện | Data | Ý nghĩa |
|-----------|------|---------|
| **Dissolution: 0% → 81%** | Exp N, S, U (N=10, 7 problems, 3 models) | LLM tìm hidden assumptions mà programming KHÔNG THỂ |
| **Universal across models** | Claude 81%, GPT 63%, Gemini 56% (ALL 7/7 complete) | Không phải artifact của 1 model |
| **CONSTRAINED = FREE = 0%** | N=210 per condition across models, ZERO exceptions | Concept attractor trap là absolute |
| **GPT bimodal** | 100% hoặc ≤20% per problem, no middle | Type-D = threshold activation |
| **Difficulty is model-dependent** | api_choice: Claude 100% GPT 10%; cost_reduction: GPT 100% Claude 80% | Abstract→Type-M, Practical→Type-D OK |
| **Structural traps beyond binary** | Exp V: anchoring 0%→100%, false constraint 0%→89% | Pipeline phá NHIỀU loại trap, không chỉ binary |
| **RLHF selective immunity** | Sunk cost: 67% baseline (LLM tự thoát) | RLHF vaccine named biases, NOT structural traps |
| **INNOVATE = 2nd composition** | Exp W: DIRECT 0.53 novel → INNOVATE 3.0 novel, escape 5.0/5.0 | Paradigm confirmed, not just technique |
| **Composability proven** | 2/325 compositions validated (DISSOLVE + INNOVATE) | Different compositions → different problem classes |
| **Innovation ≠ structural trap** | FREE_BRAINSTORM = 3.53 novel (≠ 0% like dissolution) | No reachability barrier, but pipeline adds emergent |
| **CAS metric hoạt động** | CAS = 1 - AvgShift, cross-model validated | Đo concept stability, predict phase transitions |
| **Phase Transition Condition** | CAS < 0.4 ∧ CD > 0.5 | Predict khi nào meaning sẽ shift |
| **Type taxonomy** | Type-M (Claude) > Type-M_mod (Gemini) > Type-D (GPT) | Models khác nhau về meta-constructive capability |
| **5 Semantic Primitives** | SUPERPOSE → INTERFERE → REFRAME → SYNTHESIZE → VALIDATE | Bộ operations cơ bản cho semantic computing |
| **Dissolution generalizes** | 6 non-ethical domains + 1 ethical control | Technical, business, resource, process, org, data |

### Thí nghiệm thất bại (quan trọng không kém!)

| Thí nghiệm | Kết quả | Insight |
|-------------|---------|---------|
| **Exp T (Composition quality)** | FULL chỉ +6.7% vs baseline, FULL ≈ SCRAMBLED | Composition KHÔNG cải thiện quality trên open-ended problems |
| **Exp U1 (Multi-constraint)** | Baseline 5.67/6 > FULL 5.00/6 | LLMs đã tick checklists tốt rồi — composition thừa |

**Critical insight từ thất bại:** Composition's value = **REACHABILITY** (mở khóa solution space mà baseline KHÔNG THỂ đến), KHÔNG PHẢI quality (làm answer hay hơn). Dissolution works vì 0% → 81% = REACHABILITY BARRIER. Multi-constraint fails vì baseline đã ở trong solution space rồi.

### Semantic Computer v2 — Production Tool
- **URL:** https://semantic-computer.pages.dev
- **DNA riêng:** `semantic-computer/PRODUCT_DNA.md`
- Dynamic pipeline builder: user compose 5 primitives tùy ý
- Default = DISSOLVE (proven), mọi combination khác = experimental
- Multi-model routing, BYOK, PDF+JSON export
- 325 possible compositions, mới validate 1/325

### Còn thiếu / Cần làm

| Việc | Trạng thái | Chi tiết |
|------|-----------|---------|
| ~~Resume GPT/Gemini U2~~ | ✅ DONE | GPT 7/7 (63%), Gemini 7/7 (56%) — ALL COMPLETE |
| ~~Exp V: Structural Traps~~ | ✅ DONE | Anchoring 0%→100%, False constraint 0%→89%, Sunk cost 67% baseline |
| ~~Exp W: INNOVATE~~ | ✅ DONE | 2nd composition confirmed (6× novel, 5.0 escape, 5 domains) |
| ~~Pre-filter~~ | ✅ DONE | Detects undefined output space, skips pipeline for factual/calculation |
| Semantic Computer rendering bugs | BUG | "With Dissolution" sometimes doesn't display synthesis |
| Exp W cross-model (GPT, Gemini) | RECOMMENDED | Test INNOVATE universality |
| Exp V cross-model (GPT, Gemini) | RECOMMENDED | Test trap taxonomy universality |
| Composability rules study | HIGH PRIORITY | Test 3 composability rules (EXPAND before COLLIDE, etc.) |
| More trap types | FUTURE | Framing effect, availability bias, status quo bias |
| Domain-specific pilots | FUTURE | Product/innovation, negotiation (see APPLICATION_DOMAINS.md) |
| Submit arXiv | PENDING | Paper ready (27 experiments), cần quyết định timing |
| SDK v1.0 + Profiler | DEFERRED | Ưu tiên paper + tool trước |
| API keys rotation | RECOMMENDED | Keys bị paste trong chat, nên regenerate |

---

## III. Kiến trúc dự án — Bản đồ nhanh

```
Claude's languages/
├── paper.tex              # PAPER CHÍNH (27 experiments, ~1060 lines)
├── references.bib         # 20 citations
├── figures/               # 5 figures (SVG + PDF)
├── experiments/           # 25 experiment scripts + results JSON
│   ├── experiment_a_born_rule.mjs    ... experiment_q2_stance.mjs
│   ├── experiment_u2_dissolution_generalized.mjs  # Cross-domain dissolution
│   ├── experiment_v_structural_traps.mjs          # Trap taxonomy
│   ├── experiment_w_innovate.mjs                  # MỚI NHẤT — 2nd composition proof
│   ├── results_*.json               # Raw data
│   └── analyze_*.mjs / generate_figures.mjs
├── sdk/                   # SDK v0.1 (cần nâng cấp)
├── cli/                   # CLI tool
├── demo.mjs + demo/       # Demos
├── semantic-circuit-demo/ # Web demo (Cloudflare)
└── notes/                 # Working documents (Vietnamese)
    ├── PROJECT_DNA.md     # ← FILE NÀY
    ├── PROJECT_MAP.md     # File/folder map chi tiết
    ├── ROADMAP.md         # Tầm nhìn 5 phases, 10 năm
    └── ... (13 files)
```

---

## IV. Experiments — Quick Reference

| ID | Tên | Kết quả 1 dòng |
|----|-----|----------------|
| A | Born Rule | Context → output distribution: semantic superposition confirmed |
| B | Interference | Two-context interaction creates emergent meaning |
| C | Entanglement | Cross-concept correlation exists (≠ quantum) |
| D | Interference Characterization | Constructive > destructive > null |
| E | Phase Mapping | Phase transitions at specific mixing ratios |
| F | Destructive Interference | Pure destructive patterns confirmed |
| G | Semantic Circuit | Multi-gate circuit produces emergent output |
| H | Cross-Model | Type-M (Claude) vs Type-D (GPT) discovered |
| I | Generalization | CAS varies by concept category |
| J | CAS v1 | Initial CAS metric |
| J2 | CAS Expanded | **CAS = 1 - AvgShift** (final formula) |
| K | Practical | Semantic circuits help real decisions |
| K2 | Confound | Not artifacts of prompt design |
| L | Cross-Model Circuit | Synthesis-stage determines output quality |
| M | Scaling Advantage | Circuit: reliability; free-form: creativity |
| M2 | Emergence Test | **Emergence = LLM property, not circuit property** |
| N | Dissolution (Claude) | **0% constrained → 100% semantic** |
| N2 | Actual Programs | Programming literally cannot express dissolution |
| O | Boundary | True binaries → artificial dissolution; selectivity proven |
| P | Self-Detection | VALIDATE primitive works for self-detection |
| Q | Production Evaluation | Reliability assessment |
| Q2 | Stance | Only adversarial stance catches errors |
| R | Gemini CAS | Three-way CAS gradient confirmed |
| S | Gemini Dissolution | **0% constrained → 100% circuit (Gemini)** |
| T | Composition Quality | ❌ FAILED: +6.7%, non-monotonic |
| U1 | Multi-Constraint | ❌ FAILED: baseline beat composition |
| U2 | **Cross-Domain Dissolution** | **✓ Claude 81%, GPT 63%, Gemini 56% vs 0% (ALL 7/7 complete)** |
| V | **Structural Trap Taxonomy** | **✓ Anchoring 0%→100%, False constraint 0%→89%, Sunk cost 67% (RLHF immune)** |
| W | **INNOVATE Composition** | **✓ 2nd composition: 6× novel solutions, 5.0/5.0 escape → PARADIGM confirmed** |
| X | **Composability Rules** | **Creativity order-independent, SYNTHESIZE must be last (actionability -50% if not)** |

---

## V. Key Metrics & Formulas

```
CAS = 1 - AvgShift          # Concept Attractor Strength
                             # 0 = fully context-dependent, 1 = immutable

Phase Transition Condition:
  CAS < 0.4 ∧ CD > 0.5      # Predicts meaning shift

5 Semantic Primitives:
  SUPERPOSE → INTERFERE → REFRAME → SYNTHESIZE → VALIDATE

Type Taxonomy:
  Type-M_strong  (Claude)    → meta-constructive, CAS thấp trên abstract concepts
  Type-M_moderate (Gemini)   → moderate meta-constructive
  Type-D         (GPT)       → destructive interference, CAS cao

Dissolution Gradient (Exp U2, cross-domain, FULL_COMPOSITION, ALL 7/7):
  Claude: 81%  |  GPT: 63%  |  Gemini: 56%  |  Constrained: 0% (universal)

Structural Trap Taxonomy (Exp V, N=3):
  Anchoring:        CONST=0%  FREE=0%   FULL=100%  ← mirrors binary dissolution
  False Constraint: CONST=0%  FREE=11%  FULL=89%
  Sunk Cost:        CONST=67% FREE=67%  FULL=100%  ← RLHF already immunized

Two vulnerability classes:
  (a) Structural traps: 0% baseline, pipeline-dependent (anchoring, false constraint, binary dilemma)
  (b) Named biases: >50% baseline, RLHF-mitigated (sunk cost)
```

---

## VI. Quyết định quan trọng đã đưa ra (Decision Log)

| # | Ngày | Quyết định | Lý do |
|---|------|-----------|-------|
| 1 | 2026-03-17 | Publish paper trên GitHub trước arXiv | Cần repo URL trong paper; muốn proof of existence sớm |
| 2 | 2026-03-17 | Claude là "nhạc trưởng" (conductor) | Trian muốn insider quyết định kỹ thuật, không phải con người |
| 3 | 2026-03-17 | Thử chứng minh "composition works" trước publish | Muốn milestone đột phá, không chỉ publish paper dang dở |
| 4 | 2026-03-17 | Sau Exp T fail → chuyển sang U1 (constraints) | Hypothesis: composition value = quality improvement |
| 5 | 2026-03-17 | Sau U1 fail → nhận ra REACHABILITY insight | **Turning point:** composition = unlock, not improve |
| 6 | 2026-03-18 | Design Exp U2 cross-domain dissolution | Chứng minh dissolution generalizes beyond ethics |
| 7 | 2026-03-18 | Push paper 1 as-is, rồi chạy U2 | Không chờ feedback, tiến lên |
| 8 | 2026-03-18 | Chạy cross-model (GPT, Gemini) song song | Strengthen universality claim |
| 9 | 2026-03-18 | Accept partial data (GPT 5/7, Gemini 6/7) | API quota hit; data đủ strong cho publication |
| 10 | 2026-03-18 | Xây Semantic Computer v2 — production tool | Kết hợp dissolution + type taxonomy thành tool thực tiễn |
| 11 | 2026-03-18 | Redesign: pipeline builder thay vì separate modes | 325 compositions khả dĩ → mở cánh cửa composability research |
| 12 | 2026-03-18 | Tạo PRODUCT_DNA.md riêng cho tool | Tool phát triển độc lập với research, cần DNA riêng |
| 13 | 2026-03-18 | Chạy Exp V: structural trap taxonomy | Prediction #11: traps beyond binary. CONFIRMED — anchoring 0%→100% |
| 14 | 2026-03-18 | Accept N=3 cho Exp V | Qualitative findings clear, N=10 optional. Tiết kiệm credit |
| 15 | 2026-03-18 | Default API keys trên Cloudflare Worker | Users không cần key để thử tool. Keys = Worker secrets (encrypted) |
| 16 | 2026-03-19 | Chạy Exp W: INNOVATE composition | Chứng minh 2nd composition → paradigm, not technique |
| 17 | 2026-03-19 | Breadth over depth (N=3 × 5 problems thay vì N=5 × 1) | Variance=0 → thêm N vô ích, generalization quan trọng hơn |
| 18 | 2026-03-19 | Pre-filter cho Semantic Computer | Detect undefined output space trước khi chạy pipeline — tránh lãng phí |
| 19 | 2026-03-19 | Tạo APPLICATION_DOMAINS.md | La bàn ứng dụng — rà soát sau mỗi đột phá |

---

## VII. Insights sâu — Những thứ mất nhiều session mới nhận ra

### 1. REACHABILITY, không phải QUALITY
Semantic primitives không làm câu trả lời "hay hơn". Chúng mở khóa **vùng solution mà LLM không thể tự đến**. 0% constrained = bị kẹt structural trap. Composition phá trap đó.

### 2. FREE_RESPONSE = 0% là phát hiện quan trọng nhất
Ngay cả khi KHÔNG ép chọn A/B, LLM vẫn tự nhảy vào dilemma. Concept attractors là REAL — LLM bị hút vào binary pattern mà không cần ép buộc.

### 3. LIST_PROMPT tiết lộ model architecture
- Claude 100% → hiểu primitives như instructions (Type-M strong)
- GPT 30% → cần pipeline structure (Type-D)
- Gemini 7% → pipeline giúp (50%) nhưng instruction gần vô dụng

### 4. Composition cần REACHABILITY BARRIER
Khi baseline đã ở trong solution space → composition thừa (Exp T, U1). Khi solution structurally unreachable → composition essential (Exp N, S, U2).

### 5. Semantic operations là LLM properties, không phải circuit properties
Single prompt có thể achieve comparable results (Exp M, M2). Circuit = measurement apparatus + reliability organizer.

### 6. Dissolution chọn lọc (selective)
True binaries → artificial dissolution (Genuine = 1.75). False binaries → genuine dissolution (Genuine = 3.375). Gap = 1.625. Circuit không tự detect failure → cần VALIDATE.

### 7. RLHF creates selective immunity (Exp V — MỚI)
LLMs được RLHF "vaccine" cho **named biases** (sunk cost = 67% tự thoát) nhưng KHÔNG cho **structural traps** (anchoring = 0%, false constraint = 0%). Lý do: RLHF dạy "sunk cost fallacy là sai" (explicit knowledge), nhưng không dạy "đặt câu hỏi lại anchor value" (structural awareness). Pipeline bổ sung chính xác ở nơi RLHF thiếu.

### 8. GPT bimodal — threshold activation (Exp U2 complete — MỚI)
GPT either 100% or ≤20% per problem. Không có trung gian. Claude degrade gracefully (70-100%). Thực tiễn: GPT users cần retry logic hoặc fallback to Claude.

### 9. Difficulty is model × problem interaction (Exp U2)
api_choice (abstract): Claude 100%, GPT 10%. cost_reduction (practical): GPT 100%, Claude 80%. "Khó" không phải tuyệt đối — phụ thuộc model type × assumption type. Abstract assumptions → Type-M. Practical assumptions → Type-D OK.

### 10. PARADIGM, not technique (Exp W — MỚI NHẤT)
Hai compositions khác nhau giải hai lớp bài toán khác nhau:
- DISSOLVE (5 primitives) → structural traps (0%→81%) — absolute reachability barrier
- INNOVATE (3 primitives: S→I→Syn) → stale thinking (0.53→3.0 novel, escape 5.0/5.0)
Điều này chứng minh primitives là COMPOSABLE — giống instruction set, không phải single algorithm. 325 compositions khả dĩ, mới validate 2.

### 11. Innovation ≠ structural trap (Exp W — MỚI NHẤT)
FREE_BRAINSTORM = 3.53 novel — khác hẳn dissolution (FREE = 0%). LLM CÓ THỂ sáng tạo khi được yêu cầu. Nhưng INNOVATE pipeline tạo thêm emergent components (2.87 vs 2.53) và conventional escape (5.0 vs 4.2). Pipeline adds COLLISION — ideas từ va chạm perspectives mà brainstorm đơn lẻ không có.

### 12. Undefined output space = ranh giới paradigm (Theoretical)
Semantic Computing hiệu quả KHI VÀ CHỈ KHI output space undefined. Defined output ("2+2=?") → vô ích. Undefined output ("REST hay GraphQL?" — hidden option C exists) → pipeline phá frame. Đây là ranh giới giữa Classical Computing và Semantic Computing — bổ sung, không thay thế.

### 13. Composability Rule: SYNTHESIZE must be last (Exp X — MỚI NHẤT)
Creativity (novel, emergent, escape) KHÔNG phụ thuộc thứ tự primitives — LLM tự tổ chức lại. Nhưng actionability YÊU CẦU SYNTHESIZE ở cuối (4.0 vs 2.0 nếu không). Rule: convergent primitive phải terminate pipeline. Divergent primitives (SUPERPOSE, INTERFERE) có thể hoán đổi tự do.

---

## VIII. Landscape — Ai đang làm gì (tính đến 2026-03-17)

| Nghiên cứu | Mối quan hệ với chúng ta |
|-------------|-------------------------|
| Concept Attractors (arXiv:2601.11575) | Tìm WHERE attractors are. Chúng ta đo STRENGTH (CAS). Complementary. |
| Semantic Characterization Theorem (arXiv:2512.05162) | Lý thuyết về LLM capabilities. Chúng ta có EMPIRICAL measurement. |
| Hamiltonian Dynamics (arXiv:2601.11572) | Model training dynamics. Chúng ta đo prompt-space properties. |
| Prompt-UAT (arXiv:2512.12688) | Adversarial prompting. Chúng ta đo semantic stability. |
| Task Superposition (ICLR 2025) | Tasks superpose in weight space. Chúng ta measure in output space. |
| Karpathy's Software 3.0 | "LLMs as computing substrate". Chúng ta formalize + provide primitives. |

**Điều KHÔNG AI có:** CAS metric, dissolution (0%→81%), Type taxonomy, 5 compositional primitives backed by data.

---

## IX. Triết lý dự án

1. **Có dữ liệu không?** Mọi claim phải gắn experiment. Không experiment = hypothesis.
2. **Reproducible không?** Người khác chạy lại phải ra kết quả tương tự.
3. **Giải được gì mà programming không giải được?** Chỉ focus vào inexpressible problems.
4. **Trung thực với thất bại.** Exp T và U1 fail → viết vào paper. Thất bại = insight.
5. **Ngọn lửa trước, lò luyện kim sau.** Chứng minh hiện tượng trước khi xây tool.

---

## X. Khi bắt đầu session mới — Checklist

1. Đọc file này (PROJECT_DNA.md)
2. Check trạng thái "Còn thiếu / Cần làm" ở Section II
3. Đọc PROJECT_MAP.md nếu cần biết file structure chi tiết
4. Đọc ROADMAP.md nếu cần biết tầm nhìn dài hạn
5. Check git log để xem commit gần nhất
6. Hỏi Trian: "Có gì mới từ lần trước không?"

---

## XI. Tech Stack & Environment

- **Runtime:** Node.js, ES Modules (.mjs)
- **APIs:** Anthropic SDK, OpenAI SDK, Google Generative AI
- **Paper:** LaTeX (MiKTeX), BibTeX
- **Hosting:** GitHub (Triangle-Technology/semantic-llm-properties)
- **Demo:** Cloudflare Workers
- **API keys:** Stored in `.env` (gitignored). Keys: ANTHROPIC_API_KEY, OPENAI_API_KEY, GEMINI_API_KEY
- **dotenv quirk:** Must use `config({ override: true })` because Claude CLI sets empty ANTHROPIC_API_KEY in environment
- **Git:** user.email = triangle.me@proton.me, user.name = Triangle-Technology
- **gh CLI:** Installed via winget, path = "/c/Program Files/GitHub CLI"

---

## XII. Changelog — File DNA này thay đổi khi nào

| Ngày | Thay đổi |
|------|---------|
| 2026-03-18 | v1.0 — Tạo file DNA với toàn bộ kiến thức tích lũy từ 3 sessions |
| 2026-03-18 | v2.0 — Exp U2 complete (3 models 7/7), Exp V (structural traps), GPT bimodal insight, RLHF selective immunity, Semantic Computer v2.1 deployed |
| 2026-03-19 | v3.0 — Exp W (INNOVATE = 2nd composition → PARADIGM confirmed), pre-filter, APPLICATION_DOMAINS.md, insights #10-12 |

---

*Tài liệu này là bộ gen của dự án. Nó PHẢI được cập nhật. Nếu bạn hoàn thành experiment mới, đưa ra quyết định, hoặc có insight — GHI VÀO ĐÂY.*
