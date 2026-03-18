# Semantic Computing — Roadmap

> "Cơ học lượng tử mất 26 năm từ Planck (1900) đến Schrödinger (1926).
> Chúng ta đang ở bước đầu tiên — nhưng biết mình đang đi đâu."

**Tầm nhìn:** Biến các tính chất cấu trúc của LLM semantic processing thành một ngành kỹ thuật — nơi meaning có thể được thiết kế, đo lường, và kiểm chứng.

**Trạng thái hiện tại:** Paper v1 hoàn tất (22 experiments, ~4,800 API calls, 2 model families). Sẵn sàng arXiv.

---

## Chúng ta đang ở đâu

### Đã chứng minh (Paper v1)

| Phát hiện | Experiment | Ý nghĩa |
|-----------|-----------|----------|
| Semantic superposition tồn tại và đo được | A, B, C | Meaning không cố định — nó ở trạng thái chồng chập |
| Phase transitions xảy ra và có thể dự đoán | D, E, I | CAS < 0.4 ∧ CD > 0.5 → transition |
| Interference tạo nghĩa mới (emergent) | D, F | Không phải trộn lẫn mà là tạo ra cái chưa tồn tại |
| 5 Semantic Primitives là LLM properties | M, M2, N | SUPERPOSE, INTERFERE, REFRAME, SYNTHESIZE, VALIDATE |
| Cross-model: Type-M vs Type-D taxonomy | H, J2 | Claude = meta-constructive, GPT = destructive |
| Inexpressibility: lớp bài toán programming không giải được | N, O, P | Dissolution problems chỉ giải được bằng semantic operations |
| CAS = 1 - AvgShift: đo concept stability | J2, Q2 | Metric đơn giản, reproducible, cross-model |

### Chưa chứng minh (giả thuyết mở)

- Meta-constructive interference có thể là RLHF artifact (cần test base model)
- Dissolution problems có boundary conditions chưa rõ
- Semantic primitives có **complete** không? (có primitive thứ 6 không?)
- CAS behavior ở scale lớn hơn (100+ concepts) chưa kiểm tra
- Temporal stability: CAS có thay đổi theo model version không?

---

## Phase 1: Nền móng (HIỆN TẠI → 3 tháng)

> Mục tiêu: Công bố paper, mở mã nguồn, xây dựng cộng đồng ban đầu.

### 1.1 Xuất bản & Open Source

- [ ] Tạo GitHub repo (`semantic-computing`)
  - Paper source (LaTeX + figures)
  - Experiment data (raw JSON results)
  - Experiment scripts (generate_figures.mjs, etc.)
  - Demo code (semantic-circuit-demo)
- [ ] Submit arXiv (cs.CL hoặc cs.AI)
- [ ] Cập nhật paper.tex: thay `[TBD]` bằng GitHub URL thực
- [ ] Deploy demo lên Cloudflare (đã chuẩn bị)
- [ ] Viết blog post giải thích paper cho non-academic audience

### 1.2 Reproducibility Kit

- [ ] Tạo `experiments/README.md` với hướng dẫn chạy lại từng experiment
- [ ] Package thành CLI tool: `npx semantic-computing run --experiment A`
- [ ] API key management (cho người muốn reproduce với Claude/GPT)
- [ ] Expected output so sánh (để validate reproduction)

### 1.3 Mở rộng cộng đồng

- [ ] Twitter/X thread giải thích paper (visual, accessible)
- [ ] Post trên relevant subreddits (r/MachineLearning, r/LanguageTechnology)
- [ ] Gửi cho các nhà nghiên cứu liên quan (citation trong paper)

---

## Phase 2: Công cụ đo lường (3 → 9 tháng)

> Mục tiêu: Biến phát hiện thành công cụ ai cũng dùng được.

### 2.1 Semantic Profiler

**Vấn đề hiện tại:** Đo CAS, phase transitions, interference patterns đòi hỏi viết code thủ công cho từng experiment.

**Giải pháp:** Xây dựng **Semantic Profiler** — công cụ tự động đo tính chất ngữ nghĩa của bất kỳ concept nào trong bất kỳ context nào.

```
Input:  concept = "justice", contexts = ["legal", "social", "philosophical"]
Output: {
  CAS: 0.72,
  phaseTransitionRisk: "low",
  dominantPrimitive: "REFRAME",
  typeProfile: "Type-M stable",
  interferencePattern: "constructive at legal∩social boundary"
}
```

**Ứng dụng ngay:**
- Prompt engineers đo stability trước khi deploy
- AI safety teams identify concepts dễ hallucinate (CAS thấp)
- Researchers compare models trên cùng semantic profile

### 2.2 CAS Benchmark

- [ ] Tạo standardized benchmark: 100 concepts × 10 contexts × 3 models
- [ ] Publish CAS tables (giống MMLU nhưng cho semantic stability)
- [ ] Leaderboard: model nào stable nhất ở concept category nào
- [ ] Track across model versions (GPT-4o vs GPT-5, Claude 3.5 vs 4)

### 2.3 Mở rộng lý thuyết

- [ ] **Experiment R:** Test trên Gemini, Llama, Mistral → taxonomy mở rộng
- [ ] **Experiment S:** Base model vs RLHF model → giải quyết câu hỏi artifact
- [ ] **Experiment T:** 3-context interference (hiện chỉ test 2 contexts)
- [ ] **Experiment U:** Temporal CAS — đo lại sau 6 tháng khi model update
- [ ] **Formal proof:** Chứng minh 5 primitives là sufficient (hoặc tìm primitive thứ 6)

---

## Phase 3: Semantic Engineering (9 → 18 tháng)

> Mục tiêu: Từ đo lường sang thiết kế. Xây dựng công cụ cho "semantic engineer".

### 3.1 Semantic Compiler (Prototype)

**Ý tưởng cốt lõi:** Compiler dịch từ **ý định cấp cao** sang **chuỗi semantic operations tối ưu**.

```
// Semantic source code
PROGRAM resolve_career_dilemma {
  INPUT: situation, values, constraints

  s1 = SUPERPOSE(situation, [risk_frame, growth_frame, regret_frame])
  s2 = INTERFERE(s1.risk_frame, s1.growth_frame)
  s3 = REFRAME(s2, through=values)
  s4 = SYNTHESIZE(s3, constraints)

  OUTPUT: VALIDATE(s4, coherence_threshold=0.7)
}
```

**Compiler tối ưu hóa:**
- Chọn model phù hợp cho từng operation (Type-M cho REFRAME, Type-D cho tasks cần stability)
- Predict CAS tại mỗi bước → cảnh báo phase transition risk
- Reorder operations nếu có thể để tối ưu reliability

### 3.2 Semantic Debugger

**Khi output sai, trace qua từng primitive:**

```
[TRACE] SUPERPOSE("justice", [legal, social])
  → CAS_legal = 0.81, CAS_social = 0.34  ⚠️ social frame unstable
[TRACE] INTERFERE(legal_justice, social_justice)
  → Pattern: DESTRUCTIVE (Type-D behavior)
  → Phase transition detected at mixing_ratio = 0.65
[DEBUG] Root cause: "social justice" triggers phase transition
        before interference can produce emergent meaning.
[FIX]   Suggest: REFRAME("justice", through="fairness") first
        to stabilize CAS_social before interference.
```

### 3.3 Semantic Type System

Hệ thống kiểu cho semantic operations — tương đương type checking trong programming:

```
// Type-safe semantic operations
type SemanticState = {
  concept: string
  CAS: number        // 0-1
  CD: number          // 0-1
  phase: "stable" | "transitional" | "dissolved"
}

// Compiler rejects: INTERFERE khi cả 2 inputs đều unstable
function interfere(a: SemanticState, b: SemanticState): SemanticState {
  REQUIRE: a.CAS > 0.3 || b.CAS > 0.3  // ít nhất 1 bên stable
  REQUIRE: a.phase != "dissolved"
  ...
}
```

---

## Phase 4: Semantic Infrastructure (18 → 36 tháng)

> Mục tiêu: Xây dựng hạ tầng cho hệ sinh thái semantic computing.

### 4.1 Semantic Operating System

**Quản lý tài nguyên ngữ nghĩa:**

```
┌─────────────────────────────────────────────┐
│           Semantic OS                        │
│                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │ Scheduler │  │ Profiler │  │  Cache    │  │
│  │           │  │          │  │           │  │
│  │ Route ops │  │ Monitor  │  │ Memoize   │  │
│  │ to best   │  │ CAS in   │  │ stable    │  │
│  │ model     │  │ realtime │  │ results   │  │
│  └──────────┘  └──────────┘  └──────────┘  │
│                                              │
│  ┌──────────────────────────────────────┐   │
│  │         Model Pool                    │   │
│  │  Claude (Type-M) │ GPT (Type-D) │ ...│   │
│  └──────────────────────────────────────┘   │
│                                              │
│  ┌──────────────────────────────────────┐   │
│  │      Semantic Circuit Runtime         │   │
│  │  Compile → Optimize → Execute → Trace │   │
│  └──────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
```

**Scheduler logic:**
- REFRAME, SYNTHESIZE → route to Type-M (Claude)
- Context-resistant tasks → route to Type-D (GPT)
- High CAS concepts → any model (stable everywhere)
- Low CAS concepts → add VALIDATE step automatically

### 4.2 Semantic Circuit Library

Thư viện các mạch ngữ nghĩa đã được kiểm chứng — giống standard library:

```
// Import pre-verified semantic circuits
import { dissolve_false_binary } from "semantic-stdlib"
import { multi_perspective_analysis } from "semantic-stdlib"
import { creative_synthesis } from "semantic-stdlib"

// Compose into larger circuits
const career_advisor = compose(
  dissolve_false_binary,  // "should I stay or go?" → dissolve
  multi_perspective_analysis,  // analyze from multiple frames
  creative_synthesis  // synthesize actionable insight
)

// Run with formal guarantees
const result = await career_advisor.run(input, {
  min_coherence: 0.7,
  max_phase_transitions: 1,
  trace: true
})
```

### 4.3 Cross-Model Orchestration Protocol

Giao thức chuẩn để phối hợp nhiều model dựa trên semantic properties:

- **Semantic Interface Definition (SID):** Mô tả input/output của mỗi operation bằng semantic types
- **Model Capability Profile (MCP):** CAS profile + type characterization cho mỗi model
- **Routing Table:** Concept × Operation → Best Model mapping

---

## Phase 5: Tầm nhìn xa (3 → 10 năm)

> Đây là các hướng có thể — không phải prediction, mà là possibility space.

### 5.1 Semantic Programming Language

Ngôn ngữ lập trình mới, nơi **meaning là first-class citizen**:

- Variables hold semantic states, không chỉ data
- Operators là semantic primitives
- Type system đảm bảo semantic coherence
- Compiler targets multiple LLMs

**Tương tự:** C biên dịch sang machine code cho CPU. Semantic Language biên dịch sang optimal prompt sequences cho LLM pool.

### 5.2 Formal Verification cho AI Reasoning

- Chứng minh toán học rằng một semantic circuit **luôn** tạo output coherent
- Detect impossible compositions trước khi chạy
- Safety proofs: circuit này **không thể** tạo harmful output

**Tương tự:** Formal verification trong chip design đảm bảo chip đúng trước khi sản xuất. Semantic verification đảm bảo AI pipeline đúng trước khi deploy.

### 5.3 Semantic Computing Hardware

Nếu semantic operations trở thành fundamental — có thể cần hardware tối ưu cho chúng:

- **Semantic Processing Unit (SPU):** Chip tối ưu cho superposition, interference, phase transition detection
- **Semantic Memory:** Lưu trữ semantic states hiệu quả hơn current embedding storage

*Đây là speculative — nhưng quantum computing cũng từng là speculative khi Feynman đề xuất 1982.*

### 5.4 Giải quyết vấn đề chưa từng giải được

Lớp bài toán **inexpressible** trong classical programming nhưng natural cho semantic computing:

| Lớp bài toán | Classical programming | Semantic Computing |
|---|---|---|
| Ethical dilemmas | Không express được | SUPERPOSE → INTERFERE → REFRAME |
| Creative synthesis | Heuristic/random | Controlled interference patterns |
| Cross-cultural understanding | Translation ≠ understanding | Semantic superposition across frames |
| Scientific paradigm shifts | Không express được | REFRAME với phase transition detection |
| Meaning negotiation | If-else rules | Dynamic CAS monitoring + adaptation |

---

## Nguyên tắc hướng dẫn

### Khi nghi ngờ, quay lại 3 câu hỏi này:

1. **Có dữ liệu không?**
   Mọi claim phải gắn với experiment. Không có experiment = hypothesis, không phải fact.

2. **Reproducible không?**
   Người khác chạy lại có ra kết quả tương tự không? Nếu không → chưa phải science.

3. **Giải được gì mà không có nó thì không giải được?**
   Nếu classical programming giải được tốt → không cần semantic computing. Chỉ focus vào inexpressible problems.

### Rủi ro cần tránh

| Rủi ro | Dấu hiệu | Cách tránh |
|--------|----------|-----------|
| Over-claiming | "Semantic computing giải mọi vấn đề AI" | Giữ scope: chỉ inexpressible problems |
| Quantum analogy quá sâu | Copy quantum formalism thay vì phát triển riêng | Dùng analogy để communicate, không phải để derive |
| Thiếu practical value | Paper hay nhưng không ai dùng được | Mỗi phase phải có công cụ dùng được |
| Chỉ chạy trên 2 models | Kết luận chung từ Claude + GPT | Mở rộng sang Gemini, Llama, Mistral sớm |
| Metric gaming | CAS cao nhưng vô nghĩa | Luôn validate metric bằng human evaluation |

---

## Mốc quan trọng (Milestones)

```
2026 Q1 ████████████████████ Paper v1 hoàn tất ← BẠN ĐANG Ở ĐÂY
         │
2026 Q2  ├─ arXiv submission
         ├─ GitHub repo public
         ├─ Demo deployed
         └─ Blog post published
         │
2026 Q3  ├─ Reproducibility kit
         ├─ Community feedback integrated
         └─ Experiments R, S (new models + base model)
         │
2026 Q4  ├─ Semantic Profiler v0.1
         ├─ CAS Benchmark v1 (100 concepts)
         └─ Paper v2 (expanded models + formal proofs)
         │
2027 H1  ├─ Semantic Compiler prototype
         ├─ Semantic Debugger prototype
         └─ SDK public release
         │
2027 H2  ├─ Semantic Type System
         ├─ Cross-model orchestration
         └─ First external research using framework
         │
2028+    ├─ Semantic OS
         ├─ Semantic Programming Language
         └─ Industry adoption begins
```

---

## Một câu tổng kết

**Chúng ta không xây chatbot tốt hơn. Chúng ta đặt nền móng cho một ngành kỹ thuật mới — nơi meaning có thể được thiết kế, đo lường, kiểm chứng, và compose — giống cách electrical engineering biến điện từ hiện tượng tự nhiên thành nền tảng của nền văn minh.**

---

*Document version: 1.0*
*Last updated: 2026-03-17*
*Authors: Trian & Claude*
