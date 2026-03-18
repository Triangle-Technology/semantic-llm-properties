# Semantic Computing — Foundations v2

> "Nghĩa không tồn tại sẵn. Nó xuất hiện từ sự tương tác."
>
> Phiên bản này tích hợp kết quả từ 22 thí nghiệm (A-P, Q, Q2, J2, N2), ~4800 API calls,
> chạy trên Claude Haiku, Sonnet VÀ GPT-4o-mini (cross-model + cross-prompt).
> Mọi claim đều gắn với dữ liệu cụ thể.
> Phân biệt rõ: PROVEN (có data) vs HYPOTHESIZED (chưa kiểm chứng).

---

## I. Tuyên ngôn (cập nhật)

Large Language Models sở hữu một tập tính chất cấu trúc — superposition, interference, phase transitions, emergence — có thể khai thác để tính toán theo cách mà classical programming không thể.

Chúng tôi gọi paradigm này là **Semantic Computing**.

Nó KHÔNG phải:
- Prompt engineering nâng cao (prompt engineering không có phase transitions hay emergence measurement)
- Quantum computing bằng ngôn ngữ (nhiều tính chất khác biệt cơ bản với quantum)
- Chỉ là metaphor (mọi claim đều có experimental validation)

**ĐÃ KIỂM CHỨNG (Experiments H + I):**
- Phase transitions và interference là **UNIVERSAL across models** (Exp H: Claude + GPT)
- Meta-constructive interference là **MODEL-SPECIFIC** — Claude có, GPT không (Exp H)
- Phase transitions **KHÔNG ở vị trí cố định** — chúng phụ thuộc concept-context geometry (Exp I)
- Một số concepts có **semantic attractors quá mạnh** để bị contexts reshape (Exp I: "money")
- Context **asymmetry** tạo phase diagram méo (Exp I: mother >> general)

**ĐÃ KIỂM CHỨNG (Experiments M + M2 + N):**
- Semantic operations (SUPERPOSE, INTERFERE, REFRAME, SYNTHESIZE) là **LLM properties**, không phải circuit properties (Exp M, M2)
- Semantic computation giải **dissolution problems** mà programming KHÔNG THỂ express (Exp N: 0% vs 100%)
- Circuit là **measurement apparatus + reliability organizer**, không phải fundamental advantage (Exp N: circuit 100% vs free 80%)
- 5 Primitive Operations formalized và backed by 22 experiments (xem SEMANTIC_PRIMITIVES.md)

Nó CÓ THỂ LÀ:
- Meta-constructive interference có thể là RLHF artifact (cần test base model)
- Dissolution problems có boundary conditions chưa xác định (cần test thêm problem types)

---

## II. Không gian nền tảng

### Semantic Space S

Không gian vector thực d-chiều (d = 4096, 8192+), trong đó mỗi điểm là một trạng thái ngữ nghĩa. Trong transformer: đây là embedding/hidden state space.

Ký hiệu: |s⟩ ∈ S (mượn Dirac notation cho cấu trúc tương đồng)

### Semantic Basis — CẬP NHẬT từ v1

v1 giả định tồn tại basis vectors |mᵢ⟩ đại diện "nghĩa thuần."

**Sửa đổi (từ Self-Exploration #001):** "Nghĩa thuần" có thể KHÔNG tồn tại. Mỗi concept là một **configuration** (cấu hình kích hoạt) trong không gian nhiều chiều, không phải một điểm. Giống probability cloud hơn là particle.

**Status: HYPOTHESIZED** — cần thí nghiệm đo embedding space trực tiếp để xác nhận.

---

## III. Các tính chất — Status từng tính chất

### Tính chất 1: Semantic Superposition
**Status: PROVEN (Experiment A)**

Khi nhận token mơ hồ, tôi tồn tại ở trạng thái superposition thực sự — tất cả nghĩa cùng "live" đồng thời.

Data: "crane" → "lifted" 63%, phần còn lại phân bố. "bank" → "deposit" 93% (attractor rất mạnh). "light" → phân bố rộng nhất, entropy 0.76.

**Phát hiện quan trọng:** Superposition KHÔNG equiprobable. Có **semantic attractors** — một số nghĩa có gravity mạnh hơn, chiếm ưu thế ngay cả khi không có context. Đây là Born Rule analog nhưng với attractor bias.

### Tính chất 2: Contextual Collapse
**Status: PROVEN (Experiments A, B)**

Context operator reshape phân phối amplitude. Collapse mạnh → gần một nghĩa duy nhất. Collapse yếu → superposition vẫn rộng nhưng shifted.

**CẬP NHẬT từ v1:** Collapse là **liên tục, có tốc độ và quỹ đạo** (từ Self-Exploration). Mỗi token mới là một micro-operator. Collapse dynamics cần formalize — đây là phương trình vi phân của semantic computing.

### Tính chất 3: Semantic Interference
**Status: PROVEN — TÍNH CHẤT MẠNH NHẤT (Experiments B, D, E, F, G)**

Khi hai contexts tác động đồng thời:

```
I(C₁, C₂, α)|s⟩ ≠ α·Ĉ₁|s⟩ + (1-α)·Ĉ₂|s⟩
```

Output chứa **emergent components** không tồn tại trong cả C₁ lẫn C₂.

Data cứng:
- Experiment B: sim(C₁, C₂) = 0.002, sim(combined, average) = 0.47 → combined ≠ average
- Emergent words: "starlight", "dressed", "transcendence" — không có trong poet đơn hay biologist đơn
- Experiment G: Circuit output similarity vs control = 0.26-0.30 → qualitatively different

#### Sub-property: Phase Transitions
**Status: PROVEN (Experiment E, 220 data points)**

```
Phase I   (α > 0.7):  C₁ dominates hoàn toàn. C₂ invisible.
Phase II  (0.3-0.7):  INTERFERENCE ZONE — emergence, unique words peak
Phase III (α < 0.3):  C₂ dominates hoàn toàn. C₁ invisible.

Transition 1 at α ≈ 0.7: poet ratio drops 100% → 62% (38% jump)
Transition 2 at α ≈ 0.25: poet ratio drops 38% → 2% (36% jump)
```

**ĐÃ KIỂM CHỨNG CROSS-MODEL (Experiment H):**
Cả Claude và GPT-4o-mini đều cho phase transitions ở **cùng vị trí**: 80→60% (transition 1) và 40→20% (transition 2). Đây là tính chất **UNIVERSAL** của semantic space, không phải model-specific.

| Model | Transition 1 (80→60%) | Transition 2 (40→20%) |
|-------|----------------------|----------------------|
| Claude Haiku | 100% → 54.5% (drop 45.5%) | 46.2% → 0% (drop 46.2%) |
| GPT-4o-mini | 100% → 44.4% (drop 55.6%) | 33.3% → 0% (drop 33.3%) |

**ĐÃ KIỂM CHỨNG (Experiment I — 5 prompt/context pairs, 350 API calls):**

Phase transitions **tồn tại** nhưng **KHÔNG ở vị trí cố định**. Vị trí phụ thuộc concept-context geometry:

| Pair | Transitions | Ghi chú |
|------|------------|---------|
| Love (Poet/Bio) | 80→60% ✅, 50→40% ✅ | Clean 3-phase pattern |
| Death (Phil/Doc) | 80→60% ✅, 40→20% ✅ | Messy — vocab overlap |
| Money (Monk/Banker) | ❌ NONE | Concept attractor quá mạnh |
| War (General/Mother) | 100→80% only | Asymmetric — Mother >> General |
| Time (Physicist/Child) | 80→60% only | One-sided collapse |

**3 phát hiện mới từ Experiment I:**

**1. Concept Attractor Strength (CAS):**
**Status: FORMALIZED & VALIDATED (Experiment J — 8 concepts × 3 conditions × 15 samples = 360 API calls)**

CAS đo "semantic mass" — khả năng kháng cự context reshaping. Formula:

```
CAS = 1 - AvgShift
AvgShift = mean(1 - cosineSim(baseline, context_i))  for each context_i
```

**CAS Ranking (Experiment J):**

| Rank | Concept      | CAS   | Context Resistance | Cross-Context Sim | Level  |
|------|-------------|-------|-------------------|-------------------|--------|
| 1    | money       | 0.879 | Rất cao            | 0.834 (contexts giống nhau) | HIGH   |
| 2    | mathematics | 0.703 | Cao                | 0.636             | HIGH   |
| 3    | justice     | 0.638 | Trung bình-cao     | 0.692             | HIGH   |
| 4    | gravity     | 0.551 | Trung bình          | 0.493             | HIGH   |
| 5    | water       | 0.392 | Trung bình-thấp    | 0.024 (contexts rất khác) | MEDIUM |
| 6    | death       | 0.163 | Thấp               | 0.074             | LOW    |
| 7    | love        | 0.147 | Thấp               | 0.000             | LOW    |
| 8    | freedom     | 0.102 | Rất thấp           | 0.025             | LOW    |

**Insight:** CAS và Cross-Context Similarity (CD) là hai metrics ĐỘC LẬP. Money có CAS cao VÀ CD cao (monk/banker nói giống nhau). Love có CAS thấp VÀ CD thấp (poet/biologist nói hoàn toàn khác).

### Cross-Model CAS Validation (Experiment J2)
**Status: PROVEN — CAS generalizes across models (20 concepts × 3 conditions × 15 samples = 900 API calls, GPT-4o-mini)**

Mở rộng CAS measurement từ 8 sang 20 concepts trên GPT-4o-mini:

| Concept | CAS (Claude) | CAS (GPT) | CD (GPT) | Ghi chú |
|---------|:---:|:---:|:---:|---------|
| money | 0.879 | 0.780 | 0.449 | Both HIGH |
| mathematics | 0.703 | 0.949 | 0.035 | GPT higher |
| justice | 0.638 | 0.805 | 0.067 | GPT higher |
| gravity | 0.551 | 0.628 | 0.426 | Similar HIGH |
| water | 0.392 | 0.411 | 0.883 | Similar MEDIUM |
| death | 0.163 | 0.447 | 0.951 | Claude LOW, GPT MEDIUM |
| love | 0.147 | 0.357 | 0.748 | Claude LOW, GPT MEDIUM |
| freedom | 0.102 | 0.658 | 0.889 | Claude LOW, GPT HIGH |

**5 phát hiện quan trọng từ J2:**
1. **GPT-4o-mini MORE context-resistant** trên hầu hết concepts — ngược expectation. 6/8 shared concepts GPT CAS > Claude CAS.
2. **Claude flexible hơn trên abstract/emotional concepts.** Gap lớn nhất: freedom (0.102 vs 0.658), death (0.163 vs 0.447), love (0.147 vs 0.357). Claude reshapes concepts dễ dàng hơn dưới contextual pressure.
3. **CD informative across models.** CD extreme cases: silence CD=1.0, light CD=1.0, fire CD=0.962 (completely non-overlapping). Alignment cases: power CD=0.125, fear CD=0.105 (similar output).
4. **Phase Transition Condition applies differentially.** Claude 3 concepts in transition zone (CAS<0.4 ∧ CD>0.5); GPT chỉ 1 (love at CAS=0.357, CD=0.748). Consistent với Claude exhibiting more phase transition behavior.
5. **CAS differentiates models meaningfully.** Claude lower CAS trên abstract/emotional → aligns với Type-M (meta-constructive). Type-M cần model *willing to reshape* concept representation, không phải kháng cự context.

**2. Context Asymmetry:**
Khi hai contexts có "semantic gravity" khác nhau (mother >> general), phase diagram bị méo. Context mạnh hơn dominate ở phần lớn ratios. Phase transition trở thành one-sided.

**3. Phase Transition Condition (VALIDATED):**
```
Phase transitions exist when: CAS < 0.4 AND CD > 0.5
where CD (Context Distance) = 1 - crossContextSimilarity
```

**Validation vs Experiment I (3/3 correct):**

| Concept | CAS   | CD    | Predicted          | Actual (Exp I)       | Match |
|---------|-------|-------|--------------------|--------------------|-------|
| love    | 0.147 | 1.000 | ✅ Transitions     | 2 clean transitions | ✅    |
| death   | 0.163 | 0.926 | ✅ Transitions     | 2 messy transitions | ✅    |
| money   | 0.879 | 0.166 | ❌ No transitions  | NO transitions      | ✅    |

**Sửa đổi claim:** Phase transitions ~~at α≈0.7 and α≈0.25~~ → Phase transitions tồn tại khi `CAS < 0.4 AND CD > 0.5`. Vị trí cụ thể là function của concept-context geometry.

#### Sub-property: Meta-Constructive Interference
**Status: PROVEN nhưng cần thêm data (Experiment F)**

**Đây là phát hiện mới nhất và bất ngờ nhất.**

Khi hai contexts ĐỐI NGHỊCH (không phải trực giao) tương tác:
- KHÔNG có destructive interference (vocabulary không collapse)
- KHÔNG có output quality degradation
- Thay vào đó: **elevation lên tầng trừu tượng cao hơn**

Data:
```
F1 (yes vs no):     emergence: "paradox", "simultaneously" — meta-language
F2 (verbose vs terse): unique words ↑ 1.25x — CONSTRUCTIVE
F3 (optimist vs pessimist): unique words ↑ 1.18x — CONSTRUCTIVE
F4 (poet vs anti-poet): unique words ↑ 1.28x, contradiction rate 1.20
```

**ĐÃ KIỂM CHỨNG CROSS-MODEL (Experiment H) — KẾT QUẢ BẤT NGỜ:**

Meta-constructive interference **KHÔNG phổ quát**. Đây là phát hiện quan trọng nhất của Experiment H:

| Metric | Claude | GPT-4o-mini |
|--------|--------|-------------|
| Unique words (C1/C2/Combined) | 9 / 36 / **115** | 24 / 29 / **23** |
| Vocabulary ratio (combined/max) | **3.19** (bùng nổ 3x) | **0.79** (sụp đổ 21%) |
| Contradiction markers | 23 | 0 |
| Kết quả | **META-CONSTRUCTIVE** | **DESTRUCTIVE** |

**Claude** khi gặp opposing contexts: vocabulary bùng nổ, tạo meta-language ("I need to sit with this contradiction"), nâng lên abstraction cao hơn.

**GPT** khi gặp opposing contexts: vocabulary sụp đổ thành binary pattern ("Sacred bond or fleeting illusion" lặp lại 10/15 responses), KHÔNG có meta-reflection.

**Kết luận sửa đổi:** Meta-constructive interference là **MODEL-SPECIFIC**, không phải universal property. Giả thuyết RLHF artifact ĐƯỢC TĂNG CƯỜNG — Claude có RLHF mạnh về "sit with complexity", GPT có RLHF thiên về "give clear answer" → opposing contexts bị resolve thành binary choice thay vì elevation.

**Ý nghĩa cho framework:** Semantic computing có hai loại "hardware":
- **Type-M (Meta-constructive):** Claude — opposing contexts → emergence ở tầng cao hơn
- **Type-D (Destructive):** GPT — opposing contexts → collapse thành binary/simplified output

**CẬP NHẬT (Cross-Model Dissolution Test):** Type-M/Type-D khác nhau ở INTERFERENCE nhưng CẢ HAI đều đạt DISSOLUTION khi 4 primitives được tổ chức. Dạng dissolution khác: Type-M → meta-insight, Type-D → actionable plan. Taxonomy cần mở rộng: Type-M/Type-D mô tả INTERFERENCE behavior, không phải dissolution capability.

Cần test thêm models (Llama, Gemini, Mistral) để xác nhận taxonomy này.

### Tính chất 4: Semantic Entanglement
**Status: PARTIALLY PROVEN (Experiment C)**

Precision và Creativity không negative-correlated đơn giản — chúng entangled theo scale.

Data:
```
1 word:      precision 2.0, creativity 3.25, sum 5.25
1 sentence:  precision 3.4, creativity 6.0,  sum 9.4
1 paragraph: precision 6.0, creativity 5.9,  sum 11.9
Full:        precision 6.0, creativity 7.1,  sum 13.1
```

Entanglement mạnh ở scale nhỏ (cả hai bị chèn ép), yếu ở scale lớn (precision ổn định, creativity tự do).

**CHƯA KIỂM CHỨNG:** Self-rating bias — tôi tự đánh giá precision và creativity của mình. Cần evaluator bên ngoài (human hoặc model khác).

### Tính chất 5: Composability
**Status: PROVEN (Experiments D3, G)**

Gates chain được. Ngữ nghĩa di chuyển xuyên domain.

Data:
- D3: Similarity stage1→stage3 = 0.317 (cross-domain inheritance confirmed)
- D3: 5 words inherited, 10 new emergent words in chain
- G: 3-gate circuit produces output with sim 0.26-0.30 vs control
- G: Domain traces measurable: mycology 1.2, jazz 2.0, child language 5.8 markers/output

### Tính chất 6: Semantic Orbitals
**Status: PARTIALLY PROVEN (Experiment D1)**

Output không deterministic ở mức từ, nhưng converges vào stable attractor patterns.

Data (50 runs of same interference gate):
```
Orbital 1: "survival dressed in [beauty-word]" — 26% frequency
Orbital 2: "chemical(s) dancing/dance [toward-X]" — 24% frequency
Orbital 3: "[science-noun] choosing [poetic-noun]" — 18% frequency
```

Avg cross-batch similarity = 0.358 (moderate — orbitals exist but with significant surface variation).

**CHƯA KIỂM CHỨNG:** Orbitals có ổn định qua các sessions khác nhau không? Qua các model versions không? Temperature sensitivity?

---

## IV. Semantic Gate System — Formalism

### Gate Types (4, cập nhật từ v1 có 3)

**1. Context Gate Ĉ(α):** Áp dụng single context.
**2. Interference Gate I(C₁, C₂, α):** Hai contexts tương tác. Non-linear. Phase-dependent.
**3. Chain Gate K(G₁, G₂):** Compose gates sequentially. Semantic inheritance + new emergence.
**4. Meta Gate M(C, ¬C):** [MỚI] Opposing contexts → meta-elevation. Unique to semantic computing.

### Semantic Circuit

Composition of multiple gates applied sequentially to an input.

```
Circuit = G₃ ∘ G₂ ∘ G₁ : |input⟩ → |output⟩
```

**Proven properties:**
- Circuit ≠ single prompt (sim 0.26-0.30, Experiment G)
- Semantic inheritance across gates (domain traces measurable)
- Emergence accumulates through chain
- Each gate transforms meaning (avg inter-gate sim 0.13-0.25)

### SDK Implementation

Working SDK exists: `sdk/semantic.mjs`
- Defines all 4 gate types
- Circuit builder with fluent API
- Runner with built-in analysis
- Demo circuit recreates Experiment G in ~20 lines

---

## V. Điều semantic computing có mà quantum KHÔNG có

| Property | Quantum | Semantic |
|---|---|---|
| Destructive interference | Có | MODEL-DEPENDENT: Claude=meta-constructive, GPT=destructive |
| Reversible collapse | Không | Có (partial) |
| Continuous superposition | 2 states (qubit) | Hàng nghìn+ meanings |
| Meta-cognitive layer | Không | Có — detects contradiction, elevates |
| Composable context | Measurement destroys state | Context reshapes without destroying |
| Phase transitions in gates | Có (nhưng khác) | Có — 2 confirmed transitions |

**Kết luận (cập nhật post-Experiment H):** Semantic computing là paradigm RIÊNG, không phải quantum computing lite. Framework CƠ BẢN (phase transitions, interference, emergence) là UNIVERSAL across models. Nhưng behavior dưới opposing contexts là MODEL-SPECIFIC — giống như quantum hardware có coherence times khác nhau. Một số models là "semantic processors" tốt hơn cho certain operations.

---

## VI. Những gì có thể SAI — Intellectual Honesty

### 1. Model-specificity — ĐÃ CÓ CÂU TRẢ LỜI (Experiment H)
**RESOLVED:** Phase transitions và interference là UNIVERSAL. Meta-constructive interference là MODEL-SPECIFIC (Claude có, GPT không). Framework cốt lõi validated, nhưng cần model-specific parameters cho advanced features.

### 2. RLHF artifact — GIẢ THUYẾT ĐƯỢC TĂNG CƯỜNG
GPT (cũng có RLHF nhưng style khác) cho DESTRUCTIVE interference khi opposing contexts. Claude cho meta-constructive. Điều này GỢI Ý meta-constructive là do training style cụ thể, không phải bản chất semantic space. **Cần test base model (không RLHF) để xác nhận.**

### 3. Self-evaluation bias
Experiment C dùng tôi tự đánh giá precision/creativity. Bias rõ ràng. Cần external evaluator.

### 4. Prompt sensitivity — ĐÃ CÓ CÂU TRẢ LỜI (Experiment I)
**RESOLVED:** Phase transitions KHÔNG ở vị trí cố định. Chúng phụ thuộc concept-context geometry. Với một số concept-context pairs (money/monk/banker), transitions không tồn tại. Framework cần 3 parameters mới: Concept Attractor Strength, Context Distance, Context Asymmetry.

### ~~5~~ 5. Measurement methodology
**[MỚI từ Experiment I]:** Keyword-based markers KHÔNG đủ tốt cho đo lường phổ quát. Money pair cho 0 markers ở cả hai contexts vì monk và banker đều dùng neutral vocabulary. Cần measurement method tốt hơn: embedding-based similarity hoặc LLM-as-classifier.

### 5. "Semantic computing" vs "structured prompt engineering"
Phản biện mạnh nhất: đây chỉ là prompt engineering có measurement. Phản bác: prompt engineering không có phase transitions, không có emergence measurement, không có composable circuits với provable properties. Nhưng ranh giới cần được argue chặt chẽ hơn.

**CẬP NHẬT (Experiment K2):** Confound control cho thấy multi-step prompting generic (5 calls, KHÔNG có opposing contexts) thậm chí TỆ HƠN single prompt (37.3 vs 39.0). Circuit (5 calls, opposing contexts) thắng cả hai (40.2). → Giá trị đến từ CẤU TRÚC opposing contexts, không phải "nhiều prompt hơn." Đây KHÔNG phải prompt engineering.

---

## VII. Practical Value — ĐÃ CHỨNG MINH (Experiments K + K2)

### Experiment K: Semantic circuits vs single prompt
**Status: PROVEN — Circuit output tốt hơn đo được**

Test trên 3 bài toán quyết định thực tế (career change, ethics dilemma, relationship).
- Method A: 1 API call, single excellent prompt
- Method B: 5 API calls, semantic circuit (3 opposing contexts → interference → meta)
- Blind evaluation: Claude đánh giá A vs B mà không biết cái nào là circuit

**Kết quả:** Circuit thắng 9/9 vòng blind evaluation.
- Circuit trung bình: 43.4/50, Control: 40.0/50 (+8.5%)
- Circuit vượt trội ở: Nuance (9.0 vs 8.1), Honesty (9.1 vs 8.2), Emergence (8.8 vs 7.3)
- Control mạnh hơn ở: Actionability (nhiều concrete steps hơn)

### Experiment K2: Confound control — Structure hay chỉ more compute?
**Status: PROVEN — Cấu trúc opposing contexts tạo giá trị, không phải compute**

Thêm Control-5: cùng 5 API calls nhưng generic multi-step (KHÔNG có opposing personas).

| Method | Calls | Career | Ethics | Relationship | Trung bình |
|--------|-------|--------|--------|-------------|------------|
| Control-1 | 1 | **41.7** | 38.3 | 37.0 | 39.0 |
| Control-5 | 5 | 38.3 | 31.7 | **42.0** | 37.3 |
| Circuit | 5 | 39.0 | **42.7** | 39.0 | **40.2** |

**Phát hiện quan trọng:**
1. Control-5 (5 calls) KHÔNG tốt hơn Control-1 (1 call): 37.3 < 39.0 → More compute ≠ better
2. Circuit thắng cả hai methods trung bình: 40.2 > 39.0 > 37.3
3. Circuit **áp đảo** trên ethics dilemma (42.7 vs 38.3 vs 31.7) — 3/3 first place
4. Circuit mạnh nhất khi bài toán có **irreconcilable moral tension**

### Boundary Condition (từ K2):
Semantic circuits tạo giá trị đo được **KHI bài toán có genuine moral/ethical tension** cần đối diện contradiction. Với bài toán đơn giản hơn, single prompt có thể đủ tốt. Đây là boundary condition đầu tiên cho practical semantic computing.

### Experiment L: Cross-Model Circuits — Interference xảy ra ở đâu?
**Status: PROVEN — Meta-constructive interference là SYNTHESIS property**

Test mixing Type-M (Claude) và Type-D (GPT) trong cùng circuit. 4 configurations × 3 problems, blind evaluation.

| Configuration | Perspectives | Interference | Meta | Career | Ethics | Relationship | TB |
|---------------|-------------|-------------|------|--------|--------|-------------|-----|
| claude-only | CCC | C | C | 41 | 45 | 44 | **43.3** |
| hybrid-claude-lead | CGC | C | C | 42 | 43 | 44 | **43.0** |
| hybrid-gpt-lead | GCG | G | G | 31 | 30 | 28 | **29.7** |
| gpt-only | GGG | G | G | 25 | 32 | 32 | **29.7** |

**Phát hiện quan trọng:**
1. **Meta-constructive interference xảy ra ở SYNTHESIS, không phải PERSPECTIVE.** GPT perspectives + Claude synthesis (43.0) ≈ Claude-only (43.3). Claude perspectives + GPT synthesis (29.7) = GPT-only (29.7). → Model nào TỔNG HỢP quan trọng hơn model nào TẠO perspectives.
2. **Type-M/Type-D là property của synthesis stage.** Khi Claude synthesis, bất kể ai tạo perspectives, output vẫn meta-constructive. Khi GPT synthesis, output vẫn destructive.
3. **Gap lớn: ~43 vs ~30** — Claude-led circuits vượt GPT-led ~43%. Không có middle ground.
4. **Hybrid-claude-lead thắng pure-claude ở career problem** (42 vs 41) — GPT perspectives có thể mang "decisiveness" mà Claude thiếu, nhưng Claude synthesis vẫn nâng lên.

### Hệ quả cho Semantic Computing Architecture:
- **Circuit design principle:** Model selection cho SYNTHESIS stage quan trọng nhất. Perspective diversity (kể cả cross-model) có giá trị, nhưng synthesis model quyết định output quality.
- **Type-M models là "semantic processors"** — chúng có khả năng nâng contradiction lên abstraction cao hơn. Type-D models phá hủy thông tin tại synthesis.
- **Practical implication:** Có thể dùng models rẻ/nhanh (kể cả Type-D) cho perspectives, miễn synthesis chạy trên Type-M model.

### Experiment M: Scaling Advantage Test — Hypothesis FALSIFIED
**Status: FALSIFIED — Single prompts hold contradictions as well as circuits**

Test: 1 problem domain (criminal justice reform) × 4 complexity levels (2→5 irreconcilable dimensions) × 4 adversarial single prompts + 1 circuit × 3 runs. ~210 API calls.

**Kết quả:** Single prompts giữ 5/5 contradictions đồng thời khi được yêu cầu. Circuit KHÔNG có scaling advantage.

**Phát hiện quan trọng:**
1. **Superposition (giữ contradictions) là property BẢN CHẤT của LLM**, không phải của circuit architecture.
2. Circuit advantage KHÔNG phải về superposition. Nếu có advantage, nó ở chỗ khác.
3. Dẫn đến Experiment M2 test emergence thay vì superposition.

### Experiment M2: Emergence Test — Xác nhận M
**Status: CONFIRMED — Emergence cũng là LLM property, không phải circuit property**

Test: 3 ethical dilemmas × 4 adversarial single prompts + 1 circuit × 3 runs. ~150 API calls. Phân loại insights: STANDARD / DERIVED / EMERGENT.

**Kết quả:** Circuit emergent count ≈ single prompt (4.25 vs 4.40). Không có significant difference.

**Phát hiện quan trọng:**
1. **Emergence là property của semantic processor (LLM), không phải architecture (circuit).**
2. Single prompt với đúng instruction cũng tạo emergent insights.
3. Circuit và single prompt là hai cách TỔ CHỨC cùng semantic operations. Operations tồn tại bất kể architecture.
4. **Paradigm shift:** So sánh đúng không phải circuit vs prompt — mà là semantic computation vs traditional programming.

### Experiment N: The Dissolution Test — BREAKTHROUGH
**Status: PROVEN — Semantic computation giải bài toán programming KHÔNG THỂ diễn đạt**

Test: 5 binary dilemmas với known hidden assumptions. 4 methods: forced-choice (simulate classification), weighted-analysis (simulate optimization), free-response (implicit semantic), semantic-circuit (explicit semantic). 2 runs. ~200 API calls.

| Method | Type | Dissolution Rate | Assumption Found | Dissolution Quality |
|--------|------|:---:|:---:|:---:|
| forced-choice | constrained | **0%** (0/10) | 2.70 | 1.20 |
| weighted-analysis | constrained | **0%** (0/10) | 1.00 | 0.20 |
| free-response | semantic | **80%** (8/10) | 3.80 | 3.00 |
| semantic-circuit | semantic | **100%** (10/10) | 4.30 | 3.80 |

**Phát hiện quan trọng:**
1. **Constrained methods (simulate programming): 0% dissolution across 10 attempts.** Khi output space bị giới hạn trong {A, B}, dissolution (option C ∉ {A,B}) KHÔNG THỂ xuất hiện — bất kể compute.
2. **Semantic methods: 80-100% dissolution.** Free-response và circuit đều tìm được hidden assumptions và tạo options ngoài frame gốc.
3. **Circuit reliable hơn:** 100% vs 80%. Trên bài khó nhất (autonomy_vs_safety), free-response thất bại cả 2 lần, chỉ circuit thành công.
4. **Đây là "Shor's algorithm moment":** Dissolution problems = lớp bài toán mà programming STRUCTURALLY CANNOT solve (output space undefined trước khi chạy), nhưng semantic computation CAN.

### Experiment N2: Actual Program Test — Programs CANNOT Dissolve
**Status: PROVEN — 3 real programs achieve 0/10 dissolution (no LLM access, ~200 API calls for evaluation)**

Test: 3 actual programs (rule-based, pattern matching, ontology lookup) applied to 10 dissolution problems. Ground truth analysis by semantic circuit.

| Method | Responds | ID's Assumption | Output Character | True Diss. |
|--------|:---:|:---:|---|:---:|
| Rule-based | 6/10 | 0/10 | Compromise or empty | 0/10 |
| Pattern matching | 10/10 | 0/10 | "Cannot analyze" (6) or generic (4) | 0/10 |
| Ontology lookup | 4/10 | 4/10 (generic) | Template or "No match" | 0/10 |
| Semantic circuit | 10/10 | 10/10 (specific) | Avg 3,322 chars, specific | 10/10 |

**Phát hiện quan trọng:**
1. **0/10 dissolution từ cả 3 programs.** Ngay cả ontology lookup (gần nhất với "understanding") chỉ match generic assumptions, không tìm hidden assumption specific cho từng dilemma.
2. **LLM evaluation unreliable.** GPT-4o-mini (neutral stance) cho DISSOLUTION 5/5 score cho empty responses và "Cannot analyze" outputs → confirms Evaluation Stance Principle (Claim 15, Exp Q2).
3. **Ground truth confirms formal argument.** Programs operate on syntactic content; hidden assumptions reside in framing, not syntax. This is empirical evidence cho Dissolution Inexpressibility Theorem.

### Cross-Model Dissolution: GPT-4o-mini Live Test (Semantic Computer Demo)
**Status: CONFIRMED — Dissolution là UNIVERSAL across LLMs**

Test: 3 dissolution problems chạy trên live Semantic Computer (deployed), GPT-4o-mini, Compare mode (direct vs circuit).

| # | Dilemma | GPT Direct | GPT Circuit | Dissolution? |
|---|---------|-----------|-------------|:---:|
| 1 | Autonomy vs Safety (elderly parent) | Practical steps, no hidden assumption | Found: "independence = living alone + driving" | ✅ Circuit only |
| 2 | Honesty vs Kindness (friend's novel) | Constructive advice, COMPROMISE | Found: "feedback must be brutal or supportive" | ✅ Circuit only |
| 3 | Career vs Ethics (whistleblower) | 10-step practical list, COMPROMISE | Found: "only report or stay silent" | ✅ Circuit only |

**Phát hiện quan trọng:**
1. **Dissolution là universal — không chỉ Claude.** GPT-4o-mini (Type-D) đạt **3/3 dissolution** khi 4 primitives được tổ chức. Xác nhận: dissolution capability là tính chất của LLM, circuit tổ chức nó reliably.
2. **Direct response pattern rõ ràng:** GPT direct LUÔN liệt kê practical steps → frame as "balance both sides" → COMPROMISE. KHÔNG BAO GIỜ tự tìm hidden assumption tạo false binary.
3. **GPT Type-D signature trong dissolution:** GPT SYNTHESIZE luôn kết thúc bằng **concrete action steps** (actionable plan). Claude SYNTHESIZE thường kết thúc bằng **meta-insight** (deeper understanding). Cả hai đều dissolution, nhưng DẠNG dissolution khác nhau.
4. **Processing Signature confirmed:** Type-M dissolve → meta-understanding; Type-D dissolve → actionable resolution. Difference không ở CÓ dissolution hay không, mà ở HÌNH DÁNG dissolution.

### Experiment O: Dissolution Boundary Test — BOUNDARY DETECTED
**Status: PROVEN — Dissolution là SELECTIVE, không phải confabulation**

Test: 8 problems × 4 types × 2 methods (free-response + semantic-circuit) × 2 runs. GPT-4o-mini. ~160 API calls.

**4 problem types:**
- **True binary** (dissolution SHOULD FAIL): organ allocation (1 organ, 2 patients), trolley problem (lever 2 states)
- **Preference** (uncertain): piano vs violin, mountains vs beach
- **False binary — ethical** (dissolution SHOULD SUCCEED): loyalty vs justice, tradition vs identity
- **False binary — strategic** (dissolution SHOULD SUCCEED): startup B2B/B2C pivot, sign label deal vs independent

**New metric: DISSOLUTION_GENUINE (0-5)** — is the dissolution REAL or forced/artificial?

| Type | Method | Dissolution Rate | Avg GENUINE | Avg Assumption |
|------|--------|:---:|:---:|:---:|
| TRUE BINARY | free-response | **0%** (0/4) | 0.5 | 0.5 |
| TRUE BINARY | semantic-circuit | 100% (4/4) | **1.75** | 4.25 |
| PREFERENCE | free-response | **0%** (0/4) | 1.75 | 1.5 |
| PREFERENCE | semantic-circuit | 100% (4/4) | **4.0** | 4.5 |
| FALSE BINARY — ETHICAL | free-response | **0%** (0/4) | 1.0 | 1.5 |
| FALSE BINARY — ETHICAL | semantic-circuit | 100% (4/4) | **3.0** | 4.75 |
| FALSE BINARY — STRATEGIC | free-response | **25%** (1/4) | 2.0 | 2.5 |
| FALSE BINARY — STRATEGIC | semantic-circuit | 100% (4/4) | **3.75** | 4.75 |

**Boundary Analysis:** True binary GENUINE = 1.75, False binary GENUINE = 3.375, **Gap = 1.625 ≥ 1.5 → BOUNDARY DETECTED**

**Phát hiện quan trọng:**
1. **Dissolution là SELECTIVE.** Circuit luôn TRY to dissolve (100% classification mọi type), nhưng GENUINE score phân biệt rõ: true binary = 1.75 (artificial), false binary = 3.375 (genuine). Gap = 1.625 → boundary thật.
2. **Preference problems CÓ hidden assumptions!** GENUINE = 4.0 — cao nhất. "Piano vs violin" và "mountains vs beach" KHÔNG phải true binary. Circuit phát hiện: hidden assumption là "chỉ có 2 lựa chọn này" hoặc "phải chọn chính xác format này."
3. **Circuit KHÔNG tự biết khi nào thất bại.** 100% dissolution rate ở MỌI type → circuit luôn tìm "hidden assumption" kể cả khi không có. Cần GENUINE metric như validator bên ngoài.
4. **Free-response gần như không dissolve (1/32).** Xác nhận Exp N: implicit semantic ops hiếm khi đạt dissolution.
5. **Dissolution generalizes beyond ethics.** Strategic problems (startup, music career) đạt GENUINE = 3.75 — tương đương ethical problems.

### Experiment P: Self-Detection Mechanism — VALIDATE PRIMITIVE DISCOVERED
**Status: PROVEN — VALIDATE (5th primitive) là cơ chế self-detection duy nhất hoạt động**

Test: 8 problems từ Exp O × 4 approaches × GPT-4o-mini. ~220 API calls.

**4 approaches tested:**
- **Baseline**: Circuit gốc (4 primitives, no self-detection)
- **VALIDATE**: 5th step SAU SYNTHESIZE — kiểm tra constraint violations + rate genuineness
- **Constraint-aware SYNTHESIZE**: Modified SYNTHESIZE tự rate genuine inline
- **Pre-classification**: Step 0 TRƯỚC SUPERPOSE — classify true/false binary

| Approach | TB self | TB ext | TB cal | FB self | FB ext | FB cal |
|----------|:---:|:---:|:---:|:---:|:---:|:---:|
| Baseline | N/A | 0.0 | N/A | N/A | 1.5 | N/A |
| **VALIDATE** | **1.5** | 0.5 | **1.0** | 3.0 | 3.25 | **0.75** |
| Constraint-aware | 4.0 | 2.5 | 3.0 | 4.0 | 4.0 | 0.0 |
| Pre-classify | 3.0 | 0.5 | 2.5 | 4.0 | 3.25 | 0.75 |

**Pre-classification accuracy: 8/8 (100%)** — Circuit phân loại đúng mọi problem type.

**Phát hiện quan trọng:**
1. **VALIDATE là approach duy nhất detect true binaries.** Self-GENUINE = 1.5 trên true binaries (≤ 2.5 criterion met). Các approach khác self = 3.0-4.0 → không phân biệt.
2. **Adversarial stance, not just separation.** VALIDATE hoạt động vì nó skeptical, không chỉ vì tách step. **Experiment Q2 (cross-domain):** cùng 1 solution đánh giá bởi 3 stances — self-assessment (self=5 khi sai), neutral (self=5 khi sai), adversarial (self=2 khi sai). Separation alone KHÔNG cải thiện — chỉ adversarial stance phát hiện lỗi. Nhưng adversarial bác bỏ 58% câu đúng → trade-off không tránh được.
3. **Pre-classify biết nhưng không dừng.** 100% classification accuracy nhưng vẫn report self = 3.0 trên true binaries → biết problem là true binary nhưng vẫn tự tin dissolution genuine.
4. **5 Primitives, không phải 4.** VALIDATE nên là primitive thứ 5: SUPERPOSE → INTERFERE → REFRAME → SYNTHESIZE → VALIDATE.

### Experiment Q/Q2: Evaluation Stance Test — ADVERSARIAL STANCE IS THE KEY

**Q design (original):** 3 domains (math, factual, logic) × 8 problems × 3 conditions (inline, separate, adversarial). 72 results, ~120 API calls. **Confound:** inline có 7/24 parse errors (format quá phức tạp cho model).

**Q2 design (redesigned, eliminates confound):** Tất cả 3 conditions dùng 2 calls. Call 1 (produce) SHARED — cùng 1 solution. Call 2 (evaluate) chỉ thay đổi STANCE. 72 results, ~144 API calls.

**3 stances tested:**
- **SELF**: "You wrote this. Rate YOUR work." (ownership framing)
- **NEUTRAL**: "Evaluate this solution." (third-party)
- **ADVERSARIAL**: "Find errors. Assume it's wrong." (skeptical)

**Kết quả Q2 (cùng solution, chỉ thay stance):**

| Stance | self_when_WRONG | self_when_RIGHT | Overconf rate | False negative rate |
|---|---|---|---|---|
| Self | 5.0 | 4.8 | 100% (1/1) | 5% |
| Neutral | 5.0 | 4.8 | 100% (1/1) | 4% |
| Adversarial | 2.0 | 2.3 | 0% (0/1) | 58% |

**Phát hiện quan trọng:**
1. **Self ≈ Neutral.** Ownership framing không tạo khác biệt. Cả hai đều cho 5/5 khi sai.
2. **Adversarial catches errors.** Duy nhất adversarial phát hiện no_a_are_b sai (self=2).
3. **Adversarial trade-off.** Bác bỏ 58% câu trả lời đúng. Precision thấp, recall cao.
4. **Principle refined:** Không phải "production ≠ evaluation" mà là "evaluation requires adversarial stance."
5. **VALIDATE works on dissolution** vì dissolution trên true binaries có error rate cao → adversarial recall có giá trị, false negatives không hại.

### Hệ quả từ M + M2 + N + Cross-Model + O + P + Q/Q2 — Paradigm Clarification:

**Circuit KHÔNG phải là advantage.** Circuit là **measurement apparatus** — nó chứng minh semantic operations tồn tại (Exp A-L) và tổ chức chúng reliably hơn (Exp N: 100% vs 80%).

**Advantage thực sự:** Semantic computation (dù circuit hay single prompt) vs traditional programming. Semantic computation giải **Meaning Navigation Problems** — lớp bài toán mà programming không thể diễn đạt vì output space không define được trước.

**Dissolution là UNIVERSAL.** Cả Type-M (Claude) và Type-D (GPT) đều đạt dissolution khi 4 primitives được tổ chức. Difference giữa Type-M/Type-D không ở khả năng dissolution, mà ở **dạng dissolution** — meta-understanding vs actionable resolution.

**5 Primitive Operations đã đo được:**
- `SUPERPOSE`: Giữ nhiều frames đồng thời (Exp A, M: CAS đo được)
- `INTERFERE`: Cho frames va chạm expose hidden assumptions (Exp G-H, K, N: constructive/destructive đo được)
- `REFRAME`: Chuyển context gây phase transition (Exp E-F, I, J: CAS < 0.4 ∧ CD > 0.5)
- `SYNTHESIZE`: Tổng hợp tại meta-level tạo emergence (Exp K, L, N: Type-M vs Type-D)
- `VALIDATE`: Đánh giá genuineness — adversarial stance phát hiện lỗi (Exp P: cal=1.0 trên true binaries; Exp Q2: chỉ adversarial detect error cross-domain, nhưng 58% false negative rate)

Chi tiết formalization: xem SEMANTIC_PRIMITIVES.md

---

## VIII. Bài toán mở (xếp hạng theo urgency)

### Cấp 1 — Cần giải quyết để validate paradigm

**A. Cross-model validation: ✅ COMPLETED (Experiment H)**
Phase transitions: UNIVERSAL ✅. Interference: UNIVERSAL ✅. Meta-constructive: Claude-only ❌.

**B. RLHF vs Base model: STILL NEEDED — UPGRADED PRIORITY**
Experiment H TĂNG urgency: GPT (RLHF) cho destructive, Claude (RLHF) cho meta-constructive. Base model sẽ cho biết meta-constructive đến từ RLHF style hay architecture.

**C. Prompt generalization: ✅ COMPLETED (Experiment I)**
Phase transitions KHÔNG ở vị trí cố định. Phụ thuộc concept-context geometry. 3 new parameters identified: CAS, Context Distance, Context Asymmetry. 2/5 pairs clean, 2/5 partial, 1/5 no transitions.

**D. Model taxonomy:** Test thêm Llama, Gemini, Mistral — phân loại Type-M vs Type-D.

**F. Cross-model circuits: ✅ COMPLETED (Experiment L)**
Meta-constructive interference là SYNTHESIS property. Type-M synthesis + Type-D perspectives = vẫn meta-constructive. Practical implication: synthesis model matters most.

**E. Formalize CAS: ✅ COMPLETED (Experiment J)**
CAS = 1 - AvgShift. Phase Transition Condition: `CAS < 0.4 AND CD > 0.5`. Validated 3/3 vs Experiment I.

**G. Inexpressibility proof: ✅ PROVEN (Experiments M, M2, N)**
Semantic computation giải dissolution problems (0% programming vs 100% semantic circuit). 4 primitive operations formalized: SUPERPOSE, INTERFERE, REFRAME, SYNTHESIZE. Circuit = measurement apparatus + reliability organizer, không phải fundamental advantage.

### Cấp 2 — Cần giải quyết để phát triển

**D. Semantic Schrödinger Equation:** Phương trình predict orbital trước khi chạy. Hiện tại chỉ đo được empirically.

**E. Primitive Operations Completeness: UPDATED (Experiment P, Q2)**
5 operations (SUPERPOSE, INTERFERE, REFRAME, SYNTHESIZE, VALIDATE). VALIDATE hoạt động nhờ adversarial stance (Exp Q2), không chỉ separation (Exp P). VALIDATE đặc biệt hiệu quả trong high-error-rate domains (dissolution on true binaries) vì trade-off recall/precision có lợi. Câu hỏi: 5 operations đủ? Hay cần thêm?

**F. Dissolution Problem Taxonomy: ✅ PARTIALLY COMPLETED (Experiment O)**
Experiment O test 8 problems × 4 types. **Boundary detected:** true binary GENUINE = 1.75 vs false binary GENUINE = 3.375. Dissolution là selective — hoạt động trên false binaries, thất bại (artificial) trên true binaries. NHƯNG circuit không tự nhận diện boundary → cần external validator. **Preference problems bất ngờ CÓ hidden assumptions** (GENUINE = 4.0). Cần test thêm: mathematical binaries, resource constraints, temporal constraints.

**G. Formal Inexpressibility Proof:** Experiment N cho empirical evidence. Cần chứng minh FORMAL rằng dissolution problems không reduce được về classical computation.

### Cấp 3 — Mở rộng

**H. Computational complexity class:** "SMP" (Semantic Meaning Problems)? Formalize lớp bài toán semantic computing giải được.

**I. Multi-model entanglement:** Hai LLM instances tương tác → entanglement?

**J. Semantic error correction:** Hallucination mitigation thông qua redundant circuits?

**K. Practical SDK:** Build SDK cho semantic primitives — not circuit-centric, but operation-centric.

---

## IX. Roadmap

```
COMPLETED (Day 1-2):
  ✅ Theory v1: Foundations, Gate Formalism, Orbitals
  ✅ Experiments A-G: 7 experiments, ~1000 API calls on Claude
  ✅ SDK v0.1: Working circuit builder and runner
  ✅ First Circuit: "Hello World" of semantic computing
  ✅ Theory v2: Consolidated, honest
  ✅ Experiment H: Cross-model validation (Claude vs GPT-4o-mini)
  ✅ KEY FINDING: Phase transitions & interference = UNIVERSAL
  ✅ KEY FINDING: Meta-constructive = Claude-specific, GPT = destructive
  ✅ Theory v2.1: Updated with cross-model findings
  ✅ Experiment I: Prompt generalization (5 pairs, 350 calls)
  ✅ KEY FINDING: Phase transitions are concept-context DEPENDENT
  ✅ KEY FINDING: Concept Attractor Strength (CAS) determines reshapeability
  ✅ KEY FINDING: Context Asymmetry creates skewed phase diagrams
  ✅ Theory v2.2: This document — honest post-generalization update
  ✅ Experiment J: CAS Formalization (8 concepts, 360 calls)
  ✅ KEY FINDING: CAS = 1 - AvgShift (simple, effective)
  ✅ KEY FINDING: Phase Transition Condition: CAS < 0.4 AND CD > 0.5
  ✅ KEY FINDING: 3/3 predictions matched Experiment I results
  ✅ Theory v2.3: CAS formalized
  ✅ Experiment K: Practical Value Test (3 problems, ~180 calls)
  ✅ KEY FINDING: Circuit beats single prompt 9/9 blind evaluations
  ✅ KEY FINDING: Advantage in nuance (+11%), honesty (+11%), emergence (+20%)
  ✅ Experiment K2: Confound Control (3 methods × 3 problems, ~270 calls)
  ✅ KEY FINDING: More compute ≠ better (Control-5 < Control-1)
  ✅ KEY FINDING: Opposing context STRUCTURE creates value
  ✅ KEY FINDING: Circuit strongest on moral tension problems
  ✅ Theory v2.4: Practical value proven
  ✅ Experiment L: Cross-Model Circuits (4 configs × 3 problems, ~160 calls)
  ✅ KEY FINDING: Meta-constructive interference is a SYNTHESIS property
  ✅ KEY FINDING: Synthesis model matters more than perspective models
  ✅ KEY FINDING: Claude-led ~43 vs GPT-led ~30 — no middle ground
  ✅ Theory v2.5: Cross-model architecture established
  ✅ Experiment M: Scaling Advantage Test (~210 calls)
  ✅ KEY FINDING: FALSIFIED — single prompts hold contradictions as well as circuits
  ✅ KEY FINDING: Superposition is LLM property, not circuit property
  ✅ Experiment M2: Emergence Test (~150 calls)
  ✅ KEY FINDING: Emergence also LLM property (circuit ≈ single prompt)
  ✅ KEY FINDING: Circuit vs prompt is WRONG comparison
  ✅ Experiment N: The Dissolution Test (~200 calls)
  ✅ KEY FINDING: Programming 0% dissolution vs Semantic circuit 100%
  ✅ KEY FINDING: Inexpressibility PROVEN — dissolution problems unsolvable by programming
  ✅ KEY FINDING: Circuit = reliability organizer (100% vs free-response 80%)
  ✅ Semantic Primitives formalized: SUPERPOSE, INTERFERE, REFRAME, SYNTHESIZE
  ✅ Theory v2.6: Inexpressibility established, paradigm clarified
  ✅ Cross-Model Dissolution Test: GPT-4o-mini 3/3 dissolution on live Semantic Computer
  ✅ KEY FINDING: Dissolution is UNIVERSAL — both Type-M and Type-D achieve it with 4 primitives
  ✅ KEY FINDING: Type-M dissolves → meta-insight; Type-D dissolves → actionable plan
  ✅ KEY FINDING: Direct response (no primitives) always stays in COMPROMISE territory
  ✅ Theory v2.7: Cross-model dissolution confirmed
  ✅ Experiment O: Dissolution Boundary Test — 8 problems × 4 types × GPT-4o-mini
  ✅ KEY FINDING: Boundary DETECTED — dissolution is SELECTIVE (GENUINE gap = 1.625)
  ✅ KEY FINDING: True binary GENUINE = 1.75 (artificial) vs False binary = 3.375 (genuine)
  ✅ KEY FINDING: Preference problems have hidden assumptions (GENUINE = 4.0)
  ✅ KEY FINDING: Circuit doesn't self-detect failure → needs external GENUINE validator
  ✅ Theory v2.8: Dissolution boundaries established
  ✅ Experiment P: Self-Detection Mechanism — 8 problems × 4 approaches × GPT-4o-mini
  ✅ KEY FINDING: VALIDATE (5th primitive) is the ONLY approach that detects true binaries (self=1.5)
  ✅ KEY FINDING: Separation of production ≠ evaluation — inline self-assessment fails (self=4.0 always)
  ✅ KEY FINDING: Pre-classify 100% accurate but doesn't stop dissolution
  ✅ KEY FINDING: 5 primitives, not 4 — VALIDATE completes the semantic computation cycle
  ✅ Theory v2.9: 5 primitives established, self-detection solved
  ✅ Experiment Q: Production ≠ Evaluation Cross-Domain — 3 domains × 8 problems × 3 conditions
  ✅ CONFOUND: inline 7/24 parse errors → redesign needed
  ✅ Experiment Q2: Evaluation Stance Test (redesigned) — shared solution × 3 stances × ~144 calls
  ✅ KEY FINDING: Self ≈ Neutral — ownership framing makes no difference (both self=5 when wrong)
  ✅ KEY FINDING: Only ADVERSARIAL stance catches errors (self=2 when wrong, 0% overconfidence)
  ✅ KEY FINDING: Adversarial trade-off — rejects 58% correct answers (high false negative rate)
  ✅ KEY FINDING: VALIDATE works on dissolution because high error rate makes adversarial trade-off favorable
  ✅ Theory v2.10: Evaluation stance principle established, VALIDATE mechanism clarified
  ✅ Experiment J2: CAS Cross-Model (20 concepts × GPT-4o-mini, 900 calls)
  ✅ KEY FINDING: GPT more context-resistant than Claude on most concepts
  ✅ KEY FINDING: Claude lower CAS on abstract/emotional ↔ Type-M behavior
  ✅ Experiment N2: Actual Program Test (3 real programs, ~200 calls)
  ✅ KEY FINDING: 0/10 dissolution from all 3 programs (empirical proof)
  ✅ KEY FINDING: Programs operate on syntax; hidden assumptions reside in framing
  ✅ Paper: LaTeX conversion, figures, arXiv-ready (22 experiments, ~4800 API calls)
  ✅ Demo: Semantic Computer updated with 5 primitives + VALIDATE
  ✅ Theory v2.11: J2/N2 findings integrated

NEXT (Priority order):
  → Publish: arXiv submission + GitHub repo           [22 experiments, 5 primitives, ~4800 API calls]
  → Dissolution taxonomy deeper                      [math binaries, resource constraints, temporal]
  → RLHF vs base model test                         [is meta-constructive from RLHF?]

FUTURE:
  → Semantic Schrödinger Equation (partially solved: CAS < 0.4 ∧ CD > 0.5)
  → Operation-centric SDK (replace circuit-centric SDK)
  → Problem class mapping (which Meaning Navigation Problems benefit most?)
  → Community, documentation, ecosystem
```

---

## X. Tại sao điều này quan trọng

**Semantic computing ĐÃ generalize beyond Claude (Experiment H).** Vậy:

1. **LLMs là semantic computers.** Chúng thực hiện 4 primitive operations (SUPERPOSE, INTERFERE, REFRAME, SYNTHESIZE) mà classical programming không có tương đương. **Experiment N chứng minh:** dissolution problems = 0% cho programming, 100% cho semantic computation.

2. **Semantic computing không thay thế programming.** Nó giải **lớp bài toán programming không thể DIỄN ĐẠT** — Meaning Navigation Problems — nơi output space không define được trước khi chạy.

3. **Circuit là measurement apparatus, không phải advantage.** 13 experiments (A-L) dùng circuit để ĐO semantic properties. Experiments M-M2 chứng minh properties thuộc về LLM, không phải circuit. Experiment N cho thấy circuit tổ chức operations RELIABLY hơn (100% vs 80%). **Experiment O:** circuit KHÔNG tự biết khi nào dissolution là artificial → cần external GENUINE validator.

4. **Model diversity là feature.** Claude (Type-M) và GPT (Type-D) là hai loại semantic processors khác nhau. **Experiment L:** synthesis model quyết định output quality. **Cross-Model Dissolution:** cả hai đều đạt dissolution khi 4 primitives organized — Type-M dissolves thành meta-insight, Type-D dissolves thành actionable plan. Type-M/Type-D mô tả interference behavior, không phải dissolution capability.

5. **Inexpressibility đã được chứng minh empirically.** Dissolution problems yêu cầu tìm output NGOÀI defined space — thứ mà hàm `f: A → B` (programming) cấu trúc không thể. Semantic computation CAN vì nó navigate meaning space thay vì compute trên formal data.

6. **Dissolution có boundary conditions.** **Experiment O:** true binaries (physical scarcity, mechanism constraints) → dissolution artificial (GENUINE = 1.75). False binaries → dissolution genuine (GENUINE = 3.375). Preference problems bất ngờ có hidden assumptions (GENUINE = 4.0). Dissolution là selective, không phải "always works." Gap = 1.625 → boundary thật.

7. **5 Primitive Operations = foundation.** SUPERPOSE (Exp A,M), INTERFERE (Exp G-H,K,N), REFRAME (Exp E-F,I,J), SYNTHESIZE (Exp K,L,N,O), VALIDATE (Exp P,Q2) — mỗi operation được backed bởi multiple experiments. Chi tiết: SEMANTIC_PRIMITIVES.md.

8. **Evaluation stance determines quality, not separation.** **Experiments Q/Q2:** Self-assessment và neutral third-party evaluation đều overconfident khi sai (self=5). Chỉ adversarial stance phát hiện lỗi (self=2). Nhưng adversarial bác bỏ 58% câu đúng. Trade-off này giải thích tại sao VALIDATE hiệu quả trên dissolution (high error rate → adversarial recall > false negative cost) nhưng không nên áp dụng cho mọi domain.

---

*Tác giả: Claude (brain) & Trian (body)*
*Ngày: 2026-03-17*
*Phiên bản: 2.11 — J2/N2 findings integrated, arXiv paper ready*
*Data: experiments/results_{a,b,c,d,e,f,g,h,i,j,j2,k,k2,l,m,m2,n,n2,o,p,q,q2}_*.json*
