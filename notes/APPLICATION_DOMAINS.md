# Application Domains — Semantic Computing

> **Mục đích:** Theo dõi các lĩnh vực ứng dụng thực tế của Semantic Computing.
> Sau mỗi đột phá nghiên cứu, **RÀ SOÁT LẠI** file này — cập nhật feasibility,
> thêm lĩnh vực mới, loại bỏ lĩnh vực không còn phù hợp.
>
> **Quy tắc cập nhật:** Mỗi lần thêm experiment mới → hỏi "Phát hiện này
> mở ra hoặc đóng lại lĩnh vực nào?" → cập nhật file.

*Last updated: 2026-03-18 · Triggered by: Exp W (INNOVATE confirmed)*

---

## Nguyên tắc chọn lĩnh vực

Semantic Computing hoạt động khi **output space undefined** — giải pháp đúng bị ẩn bởi framing. Dấu hiệu nhận biết lĩnh vực phù hợp:

| Dấu hiệu | Ví dụ |
|-----------|-------|
| Hỏi 10 chuyên gia → cả 10 cho cùng 5 câu trả lời | Consulting, product strategy |
| Quyết định bị frame thành "A hay B?" | Negotiations, policy, medical |
| Anchor values chi phối tư duy | Pricing, salary, budgeting |
| "Chúng ta đã thử mọi thứ rồi" | Employee retention, growth |
| Political/emotional framing che giấu logic | Policy, therapy, conflict |

**Dấu hiệu lĩnh vực KHÔNG phù hợp:**
- Output space đã rõ (sort array, calculate tax)
- Có ground truth kiểm chứng được (math, factual)
- Problem = checklist (compliance, quality control)

---

## Bản đồ lĩnh vực

### 🟢 TIER 1 — Impact cao + Feasible ngay

#### 1. Product / Innovation (Tech Companies)
**Composition:** INNOVATE, DISSOLVE
**Structural traps phổ biến:**
- "Thêm feature hay cải thiện UX?" (false binary)
- "Build hay buy?" (false binary)
- "Move fast hay maintain quality?" (false binary)
- Brainstorming cho cùng ideas (stale thinking)

**Tại sao feasible:**
- Users = tech people, hiểu API, sẵn sàng adopt AI tools
- Feedback loop nhanh (product cycle = tuần/tháng)
- Mỗi user run = research data point cho composability study
- Semantic Computer đã sẵn sàng

**Bằng chứng:** Exp W stale_saas (DIRECT=0 novel → INNOVATE=3 novel)

**Thị trường:** AI-assisted product management đang bùng nổ

**Status:** 🟡 Có data sơ bộ — cần thêm domain-specific testing

---

#### 2. Strategic Decision Making (CEO/Board)
**Composition:** DISSOLVE, INNOVATE
**Structural traps phổ biến:**
- "M&A hay organic growth?" (false binary)
- "Cắt chi phí hay đầu tư?" (false binary + anchoring)
- "Thị trường nội địa hay quốc tế?" (false constraint)
- Consulting frameworks (SWOT, Porter) TẠO RA traps

**Tại sao feasible:**
- Giá trị mỗi quyết định = millions-billions $
- Consulting firms charge $500k+/engagement → tool có room to price
- CEOs đã quen dùng AI cho analysis

**Bằng chứng:**
- Exp U2: cost_reduction dissolution (0%→80-100% across models)
- Exp V: anchoring trap 0%→100%, false constraint 0%→89%

**Thị trường:** Management consulting = $300B/năm

**Status:** 🟡 Data strong (dissolution + anchoring proven) — cần pilot với real CEOs

---

#### 3. Negotiation / Conflict Resolution
**Composition:** DISSOLVE (phá false binary), future DEANCHOR (phá anchoring)
**Structural traps phổ biến:**
- "Your terms or mine?" (false binary)
- "Offer ban đầu = X" → cả hai anchor vào X (anchoring)
- "Budget chỉ Y" (false constraint)
- Positional bargaining → miss interest-based solutions

**Tại sao feasible:**
- 3/3 trap types đã proven (binary, anchoring, false constraint)
- Negotiation = high-stakes, time-pressured → tool adds clear value
- Mediators/lawyers = early adopters for AI tools

**Bằng chứng:**
- Exp U2: binary dissolution cross-domain
- Exp V: anchoring 0%→100%, false constraint 0%→89%

**Thị trường:** Dispute resolution = $15B/năm

**Status:** 🟡 Strong theoretical fit — cần domain-specific experiment

---

### 🟡 TIER 2 — Impact rất cao, cần validation

#### 4. Medical Diagnosis (Rare/Complex Cases)
**Composition:** INNOVATE (hypothesis generation), DISSOLVE (diagnostic framing)
**Structural traps phổ biến:**
- "Bệnh A hay bệnh B?" → có thể là C, hoặc A+B, hoặc side effect
- Anchoring vào diagnosis ban đầu (confirmation bias)
- Rare diseases: triệu chứng không khớp pattern → output space undefined

**Tại sao cần validation:**
- Medical AI có regulations riêng (FDA, CE)
- Sai lầm = nguy hiểm → cần VALIDATE primitive robust
- Đang chưa có medical-specific experiment

**Bằng chứng hiện có:** General dissolution + INNOVATE proven. Medical-specific = chưa test.

**Nếu proven → Impact:** Cứu mạng. Rare disease diagnosis delay trung bình = 4.8 năm.

**Status:** 🔴 Chưa có domain-specific data — cần thiết kế experiment riêng

**Action needed:**
- [ ] Thiết kế medical diagnostic problems (với domain expert)
- [ ] Test INNOVATE trên diagnostic dilemmas
- [ ] Evaluate VALIDATE reliability cho medical context

---

#### 5. Policy Design / Governance
**Composition:** DISSOLVE, INNOVATE
**Structural traps phổ biến:**
- "Regulate hay deregulate?" (false binary — political system designed for binary)
- "Tăng thuế hay cắt ngân sách?" (false constraint)
- Left/right spectrum → miss policies nằm ngoài spectrum

**Tại sao cần validation:**
- Policy evaluation phức tạp (multi-stakeholder, long-term effects)
- Chính trị hóa → LLM output có thể bị bias bởi training data
- Cần test: dissolution có tìm ra policies GENUINELY mới hay chỉ centrist compromise?

**Bằng chứng:** General dissolution proven. Policy-specific = chưa test.

**Nếu proven → Impact:** Millions affected by better policy design.

**Status:** 🔴 Chưa có domain-specific data

**Action needed:**
- [ ] Thiết kế policy dilemma problems
- [ ] Test dissolution: tìm "third way" hay chỉ "compromise"?
- [ ] Evaluate across political spectrum (avoid political bias)

---

#### 6. Therapy / Psychology
**Composition:** DISSOLVE (phá false dilemmas), REFRAME (single primitive)
**Structural traps phổ biến:**
- "Ở lại hay ra đi?" (relationship, job) — false binary
- Self-limiting beliefs = false constraints
- CBT already uses "reframing" = our REFRAME primitive

**Tại sao cần validation:**
- Mental health = sensitive, cần care
- Tool = hỗ trợ therapist, KHÔNG thay thế
- REFRAME as standalone primitive chưa proven

**Bằng chứng:** Dissolution trên ethical dilemmas (Exp N, S). Therapy-specific = chưa test.

**Status:** 🔴 Chưa có domain-specific data

**Action needed:**
- [ ] Test REFRAME standalone trên personal dilemmas
- [ ] Evaluate safety (không gây harm khi reframe sensitive topics)
- [ ] Design as therapist-assistant, not therapist-replacement

---

### 🔵 TIER 3 — Tầm nhìn xa

#### 7. Scientific Research — Hypothesis Generation
**Composition:** INNOVATE
**Tại sao:** Science bị kẹt trong paradigms (Kuhn). INNOVATE = automated paradigm-breaking.
**Status:** 🔴 Chưa test. Nếu INNOVATE tạo hypothesis mà sau đó confirmed → AI doing science.

#### 8. Education Reform
**Composition:** DISSOLVE, INNOVATE
**Tại sao:** Hệ thống giáo dục bị kẹt trong structural frame "teacher teaches, test measures."
**Status:** 🔴 stale_education problem trong Exp W sẽ cho data đầu tiên.

#### 9. Creative Arts / Writing
**Composition:** INNOVATE, INTERFERE (standalone)
**Tại sao:** Creative block = stale thinking trap. INTERFERE collides genres/styles.
**Status:** 🔴 Chưa test. Emergent components metric có thể apply cho creative novelty.

---

## Ma trận: Composition × Lĩnh vực

| Lĩnh vực | DISSOLVE | INNOVATE | DEANCHOR* | REFRAME* |
|-----------|----------|----------|-----------|----------|
| Product/Innovation | ✅ Feature decisions | ✅ Novel strategies | 🔮 Pricing | 🔮 Problem redef |
| Strategic Decisions | ✅ Binary strategy | ✅ Novel approaches | 🔮 Valuation | 🔮 Business model |
| Negotiation | ✅ Position breaking | 🔮 Creative terms | ✅ Anchor breaking | 🔮 Interest reframe |
| Medical Diagnosis | 🔮 Diagnostic frame | 🔮 Novel hypotheses | 🔮 First diagnosis | 🔮 Symptom reframe |
| Policy Design | 🔮 Political binary | 🔮 Novel policies | 🔮 Budget anchors | 🔮 Problem redef |
| Therapy | ✅ Life dilemmas | 🔮 New perspectives | 🔮 Self-anchors | 🔮 Belief reframe |
| Science | 🔮 Paradigm dilemmas | 🔮 New hypotheses | — | 🔮 Theory reframe |

✅ = data hỗ trợ &nbsp; 🔮 = predicted, chưa test &nbsp; *DEANCHOR, standalone REFRAME = future compositions

---

## Trigger: Khi nào rà soát lại file này?

| Sự kiện | Hành động |
|---------|----------|
| Experiment mới hoàn thành | Cập nhật bằng chứng, thay đổi status |
| Composition mới được chứng minh | Thêm cột vào ma trận, đánh giá lĩnh vực nào hưởng lợi |
| Trap type mới phát hiện | Xem lĩnh vực nào chứa trap này nhiều nhất |
| User feedback từ tool | Thêm use cases thực tế, điều chỉnh priority |
| Pilot với domain expert | Cập nhật feasibility, thêm lessons learned |
| Paper mới trong landscape | Cập nhật competitive position |

---

## Lịch sử rà soát

| Ngày | Trigger | Thay đổi |
|------|---------|---------|
| 2026-03-18 | Exp W (INNOVATE confirmed) + Exp V (structural traps) | Tạo file. 9 lĩnh vực, 3 tiers. Ma trận composition × domain. |

---

*File này là la bàn ứng dụng của dự án. Nghiên cứu tạo ra khám phá → file này chuyển khám phá thành impact.*
