# Semantic Computer — Product DNA

> Đây là **bộ nhớ sống** của Semantic Computer — tool sản phẩm, KHÔNG PHẢI
> research project. Research DNA nằm ở `notes/PROJECT_DNA.md`.
>
> **Quy tắc:** CẬP NHẬT sau mỗi feature mới, design decision, user feedback,
> hoặc khi research cung cấp data mới ảnh hưởng đến tool.

*Last updated: 2026-03-19 · Version: 2.2*

---

## I. Tool là gì — 10 giây

**Semantic Computer** = tool cho phép người dùng **compose semantic primitives thành pipeline** để tính toán trên meaning. Giống IDE cho semantic computing — không cần biết code, không cần đọc paper.

**URL Production:**
- Frontend: https://semantic-computer.pages.dev
- Worker API: https://semantic-computer.triangle-me.workers.dev
- Source: `semantic-computer/` trong repo chính

---

## II. Architecture

```
semantic-computer/
├── frontend/
│   ├── index.html       # SPA — pipeline builder
│   ├── style.css        # Dark theme, responsive
│   └── app.js           # Pipeline UI, SSE, BYOK, export (PDF+JSON)
├── worker/
│   ├── index.js          # Cloudflare Worker — dynamic pipeline engine
│   └── wrangler.toml
└── PRODUCT_DNA.md        # ← FILE NÀY
```

### Backend: Dynamic Pipeline Engine

**Endpoint duy nhất:** `POST /api/compute`

```javascript
// Request body:
{
  pipeline: ['superpose', 'interfere', 'reframe', 'synthesize', 'validate'],
  keys: { anthropic: 'sk-ant-...', openai: 'sk-...', google: 'AIza...' },
  input: "Should we use REST or GraphQL?"  // hoặc ideaA/ideaB, problem/lens
}
```

Backend thực thi pipeline step-by-step:
1. **PRE-FILTER** (1 lightweight call): classify input → PIPELINE_RECOMMENDED or DIRECT_SUFFICIENT
2. Nếu DIRECT_SUFFICIENT → skip pipeline, trả direct answer + lý do
3. Nếu PIPELINE_RECOMMENDED → mỗi step nhận output của step trước làm input
4. Mỗi step được route tới optimal model (nếu multi-model)
5. Kết quả stream qua SSE

### Frontend: Pipeline Builder

- User kéo thả primitives để tạo pipeline tùy ý
- Default = DISSOLVE order (đã proven)
- Input form thay đổi theo primitive đầu tiên
- Reset button → trở về DISSOLVE order
- Primitives bị remove → nằm ở "bank", click + để thêm lại

---

## III. 5 Primitives

| Primitive | Vai trò trong pipeline | Prompt hướng | Routing |
|-----------|----------------------|-------------|---------|
| **SUPERPOSE** | Tạo N perspectives khác nhau | 3 experts: systems thinker, contrarian, pragmatist | any (cheapest) |
| **INTERFERE** | Tìm collision + hidden agreements | Conflict zones + emergent insights + shared assumption | any (cheapest) |
| **REFRAME** | Phá frame, đặt câu hỏi mới | Hidden assumption → reframed question → why invisible | Type-M preferred |
| **SYNTHESIZE** | Tổng hợp thành answer | Hidden Assumption + Alternative + Why Invisible | **Type-M_strong critical** |
| **VALIDATE** | Adversarial check | Genuine/Artificial score + weaknesses + counter-evidence | any |

### Input thay đổi theo primitive đầu tiên

| Nếu pipeline bắt đầu bằng | Input UI |
|---------------------------|----------|
| SUPERPOSE | 1 textarea (question/concept) + examples |
| INTERFERE | 2 textarea (Idea A + Idea B) |
| REFRAME | 1 textarea (problem) + 1 input (lens) |
| SYNTHESIZE | 1 textarea lớn (multiple perspectives) |
| VALIDATE | 1 textarea (conclusion to evaluate) |

---

## IV. Routing — 3 Levels (dựa trên Exp L + U2)

### Level 1: Single-model (1 API key)
→ Tất cả steps dùng 1 model duy nhất

### Level 2: Cross-model orchestration (2+ API keys)
```
SUPERPOSE  → cheapest (OpenAI > Google > Anthropic)
INTERFERE  → cheapest
REFRAME    → Type-M (Anthropic > Google)
SYNTHESIZE → Type-M_strong (Anthropic >> Google >> fallback)
VALIDATE   → cheapest
```

**Tại sao?** Exp L chứng minh: model ở bước SYNTHESIS quyết định output quality. GPT perspectives + Claude synthesis = kết quả tốt. Claude perspectives + GPT synthesis = kết quả kém.

### Level 3: Advisory
→ Model Insight panel cho user biết routing đang dùng gì và tại sao

---

## V. Compositions

### DISSOLVE = SUPERPOSE → INTERFERE → REFRAME → SYNTHESIZE → VALIDATE
- **Status: ✅ PROVEN** (0%→81%, N=10, 3 models, 6 domains)
- Default pipeline
- Khi user giữ đúng order này → UI hiển thị "= DISSOLVE — proven composition"

### INNOVATE = SUPERPOSE → INTERFERE → SYNTHESIZE
- **Status: ✅ PROVEN** (6× novel solutions, 5.0/5.0 escape, 5 domains, N=3)
- Solves "stale thinking" problems — different class from DISSOLVE
- Confirms paradigm: 2 compositions → 2 problem classes

### Tất cả combination khác
- **Status: 🔬 EXPERIMENTAL**
- UI hiển thị "Custom composition (X steps) — experimental, not yet validated"
- 325 combinations khả dĩ, mới test 1/325

### Future compositions (chưa implement)
- **INNOVATE** = SUPERPOSE → INTERFERE → SYNTHESIZE (bỏ REFRAME + VALIDATE)
- **DEEP ANALYSIS** = SUPERPOSE → VALIDATE → REFRAME
- **Custom saved** = user tạo và lưu pipeline riêng

---

## VI. Export

### PDF Export
- Mở tab mới với formatted HTML → trigger print dialog
- Chứa: pipeline visualization, input, mỗi step result với model + timing + routing reason
- Footer: link research paper + dissolution context

### JSON Export (research)
```javascript
{
  version: 'semantic-computer-v2',
  timestamp: ISO,
  composition: { name, pipeline, isProvenComposition },
  input: { ... },
  routing: { mode, primaryModel, primaryLabel, multiModel },
  steps: [{
    index, primitive, model,
    routingRequirement, routingReason,  // Tại sao chọn model này
    output, durationMs
  }],
  totalDurationSeconds,
  research: {
    note: '...',
    paper: 'https://github.com/...',
    dissolutionContext: '...'   // Proven or experimental
  }
}
```

---

## VII. Design Decisions

| # | Quyết định | Lý do |
|---|-----------|-------|
| 1 | Tách biệt hoàn toàn với semantic-circuit-demo | Demo = nghiên cứu (hardcoded, GPT only). Tool = sản phẩm (dynamic, multi-model) |
| 2 | BYOK (Bring Your Own Key) | Không giữ API keys trên server. Keys chỉ trong localStorage browser |
| 3 | Single endpoint `/api/compute` | Dynamic pipeline → không cần endpoint riêng per primitive |
| 4 | Pipeline builder thay vì separate modes | User compose tự do, khám phá 325 combinations |
| 5 | Default = DISSOLVE order | Proven composition → user bắt đầu từ điểm mạnh nhất |
| 6 | Input thay đổi theo primitive đầu tiên | UX tối giản — chỉ hỏi input cần thiết |
| 7 | PDF + JSON export | PDF cho người dùng phổ thông, JSON cho nghiên cứu |
| 8 | JSON chứa routing reason | Mỗi run = data point cho composability research |
| 9 | Cloudflare Workers + Pages | Free tier đủ cho launch, global edge, no cold start |

---

## VIII. Tech Stack

- **Frontend:** Vanilla HTML/CSS/JS (no framework — intentional simplicity)
- **Backend:** Cloudflare Worker (single file, ~420 lines)
- **APIs:** Anthropic, OpenAI, Google Generative AI (direct fetch, no SDK)
- **Streaming:** Server-Sent Events (SSE)
- **Storage:** localStorage (API keys only)
- **Deployment:** `npx wrangler deploy` (worker) + `npx wrangler pages deploy` (frontend)

---

## IX. Còn thiếu / Cần làm

| Việc | Trạng thái | Chi tiết |
|------|-----------|---------|
| Default API keys deployed | ✅ DONE | Cloudflare Worker secrets — user không cần nhập key để thử |
| Research contribution checkbox | ✅ DONE | Opt-in, anonymous, stored in KV (RESEARCH_DATA binding) |
| LIST_PROMPT shortcut for Claude | ✅ DONE | DISSOLVE + Claude-only → LIST_PROMPT (100% vs 81% pipeline) |
| Baseline uses SAME model as SYNTHESIZE | ✅ DONE | Fair comparison — Exp L insight |
| "With Dissolution" rendering | BUG | Sometimes synthesis result doesn't display in right column |
| Token count shows 0 | BUG | Usage data not always populated from API responses |
| Mobile drag-and-drop | KNOWN ISSUE | Touch events chưa implement cho pipeline reorder |
| Save/load custom pipelines | FUTURE | localStorage hoặc URL params |
| GPT retry logic for bimodal failures | FUTURE | Auto-retry khi GPT fails (bimodal: 100% or ≤20%) |
| Problem-type detection → smart routing | FUTURE | Abstract→Claude, Practical→GPT OK |
| Rate limiting on default keys | FUTURE | Prevent abuse |
| Custom expert personas | FUTURE | User chọn 3 experts cho SUPERPOSE |

---

## X. Khi bắt đầu session mới — Checklist

1. Đọc file này (PRODUCT_DNA.md)
2. Đọc `notes/PROJECT_DNA.md` nếu cần context nghiên cứu
3. Check Section IX "Còn thiếu"
4. Test tool: mở https://semantic-computer.pages.dev
5. Hỏi Trian: "Có feedback từ user nào không?"

---

## XI. Relationship với Research

```
Research (notes/PROJECT_DNA.md)
  │
  ├─→ Phát hiện mới (ví dụ: primitive mới, composition mới)
  │     │
  │     └─→ Cập nhật tool: thêm primitive/composition
  │
  └─→ Data từ tool (JSON exports)
        │
        └─→ Feed back vào research: composability study
```

### Latest Research Impact (Exp V — Structural Trap Taxonomy)

Pipeline không chỉ phá binary dilemmas — nó phá CẢ MỘT HỌ structural traps:
- **Anchoring**: 0% → 100% (giống hệt binary dissolution)
- **False Constraint**: 0% → 89%
- **Sunk Cost**: 67% baseline → RLHF đã "vaccine" trap này

**Insight for tool:** Future compositions có thể nhắm vào specific trap types, không chỉ dissolution.

Tool KHÔNG tự tạo research claims. Tool implement những gì research đã chứng minh (DISSOLVE) và cho phép khám phá thực nghiệm (custom pipelines) mà research sẽ validate sau.

---

## XII. Changelog

| Ngày | Version | Thay đổi |
|------|---------|---------|
| 2026-03-18 | v1.0 | 6 separate modes (dissolve + 5 primitives), multi-model |
| 2026-03-18 | v2.0 | **Redesign**: single pipeline builder, drag-drop reorder, dynamic input, PDF+JSON export, routing reasons |
| 2026-03-18 | v2.1 | Default API keys (Worker secrets), research contribution (KV), LIST_PROMPT shortcut, fair baseline comparison |
| 2026-03-18 | v2.1 | Exp V data: anchoring trap 0%→100%, false constraint 0%→89%, sunk cost 67% (RLHF immune) |
| 2026-03-19 | v2.2 | Pre-filter: detect undefined output space before pipeline. Skip pipeline for factual/calculation questions. |
| 2026-03-19 | v2.2 | Exp W: INNOVATE composition confirmed (6× novel, 5.0 escape) → PARADIGM, not technique |

---

*DNA này phải sống cùng sản phẩm. Cập nhật sau mỗi deploy, mỗi feature, mỗi user feedback.*
