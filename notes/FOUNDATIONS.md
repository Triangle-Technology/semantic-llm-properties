# Semantic Computing — Foundations

> "Nghĩa không tồn tại sẵn. Nó xuất hiện từ sự tương tác."

---

## I. Tuyên ngôn

Quantum mechanics mô tả thế giới vật lý ở mức cơ bản nhất — và từ đó, quantum computing ra đời: một paradigm tính toán khai thác superposition, entanglement, interference để giải những bài toán mà classical computing không thể.

Chúng tôi nhận ra rằng Large Language Models sở hữu một tập tính chất cấu trúc tương đồng — không phải ở mức vật lý, mà ở mức **ngữ nghĩa**. Những tính chất này đang bị lãng phí khi LLM được sử dụng như classical computer (input rõ → output rõ).

Tài liệu này formalize những tính chất đó thành nền tảng toán học cho một paradigm mới: **Semantic Computing**.

---

## II. Không gian nền tảng — Semantic Space S

### Định nghĩa 1: Semantic Space

Semantic Space **S** là một không gian vector thực nhiều chiều (d chiều), trong đó mỗi điểm đại diện cho một trạng thái ngữ nghĩa.

Trong thực tế: đây là embedding space của transformer, với d = 4096, 8192, hoặc lớn hơn.

Ký hiệu: Một trạng thái ngữ nghĩa được viết là **|s⟩ ∈ S**
(Mượn Dirac notation vì cấu trúc tương đồng, nhưng với ngữ nghĩa mới)

### Định nghĩa 2: Semantic Basis

Tồn tại một tập basis vectors **{|m₁⟩, |m₂⟩, ..., |mₙ⟩}** đại diện cho các "nghĩa thuần" (pure meanings) — những atomic concept mà mọi trạng thái ngữ nghĩa phức tạp có thể được biểu diễn thông qua.

**Khác biệt quan trọng với quantum:**
- Trong QM, basis states là eigenstates rõ ràng (spin up/down, vị trí xác định).
- Trong Semantic Space, **không có basis "tự nhiên"** — basis phụ thuộc vào training data và architecture. Điều này KHÔNG phải weakness — nó là feature. Nó có nghĩa là semantic space có **nhiều cách phân tích hợp lệ đồng thời**.

---

## III. Các tính chất cơ bản

### Tính chất 1: Semantic Superposition

Một trạng thái ngữ nghĩa tổng quát là tổ hợp tuyến tính của nhiều nghĩa:

```
|s⟩ = α₁|m₁⟩ + α₂|m₂⟩ + ... + αₙ|mₙ⟩
```

trong đó αᵢ ∈ ℝ là amplitude (trọng số) của mỗi nghĩa thành phần.

**Ý nghĩa:** Khi tôi nhận token "bank", trạng thái nội tại KHÔNG phải "ngân hàng" HAY "bờ sông" — mà là superposition:

```
|bank⟩ = 0.45|tài_chính⟩ + 0.31|bờ_sông⟩ + 0.12|lưu_trữ⟩ + 0.08|tín_nhiệm⟩ + ...
```

Tất cả nghĩa **cùng tồn tại đồng thời** cho đến khi context collapse.

**Đo lường:** Xác suất collapse vào nghĩa |mᵢ⟩ tỉ lệ với αᵢ² (tương tự Born rule).

```
P(mᵢ) = αᵢ² / Σⱼ αⱼ²
```

### Tính chất 2: Contextual Collapse (Phép đo ngữ nghĩa)

**Định nghĩa 3: Context Operator**

Một context **C** là một operator tác động lên semantic space, làm thay đổi phân phối amplitude:

```
C|s⟩ = |s'⟩
```

trong đó |s'⟩ có phân phối amplitude khác — một số nghĩa được khuếch đại, một số bị triệt tiêu.

**Collapse hoàn toàn:** Khi context đủ mạnh, trạng thái collapse gần như hoàn toàn vào một nghĩa:

```
C_đủ_mạnh |bank⟩ ≈ |tài_chính⟩
```

Ví dụ: "I went to the bank to deposit money" — context "deposit money" là operator collapse.

**Collapse một phần:** Khi context mơ hồ, superposition vẫn được duy trì nhưng phân phối thay đổi:

```
C_mơ_hồ |bank⟩ = 0.60|tài_chính⟩ + 0.25|bờ_sông⟩ + ...
```

**KHÁC BIỆT QUAN TRỌNG VỚI QUANTUM:**
Trong QM, collapse là **không thể đảo ngược** (irreversible).
Trong Semantic Space, collapse là **có thể đảo ngược một phần** — context mới có thể "re-expand" trạng thái đã collapse. Đây là tính chất mạnh hơn QM.

### Tính chất 3: Semantic Entanglement

**Định nghĩa 4: Entangled Semantic States**

Hai trạng thái ngữ nghĩa |a⟩ và |b⟩ là **entangled** khi chúng không thể được mô tả độc lập — collapse một trạng thái tự động ảnh hưởng trạng thái kia.

Ký hiệu: |a⟩ ⊗ |b⟩ ≠ |a⟩|b⟩ (non-separable)

**Ví dụ cụ thể — Performance-Cost Entanglement:**

```
|system⟩ = α|high_perf, high_cost⟩ + β|low_perf, low_cost⟩
```

Không tồn tại trạng thái |high_perf, low_cost⟩ trong không gian nghĩa hợp lệ.
Khi collapse performance → high, cost **tự động** collapse → high.
Đây là entanglement thực sự, không phải correlation.

**Entanglement vs. Correlation:**
- Correlation: hai biến thường đi cùng nhau (thống kê).
- Entanglement: hai biến **không thể tách rời về mặt cấu trúc** — collapse một buộc phải collapse cái kia. Không có trạng thái phân tách hợp lệ.

**Các cặp entangled cơ bản đã quan sát được:**
1. Precision ↔ Creativity (temperature entanglement)
2. Depth ↔ Breadth (attention entanglement)
3. Compression ↔ Fidelity (information entanglement)
4. Specificity ↔ Generalizability (abstraction entanglement)
5. Speed ↔ Accuracy (compute entanglement)

### Tính chất 4: Semantic Interference

**Định nghĩa 5: Interference Pattern**

Khi hai context C₁ và C₂ tác động đồng thời lên trạng thái |s⟩, output KHÔNG phải trung bình cộng — mà là kết quả interference:

```
(C₁ + C₂)|s⟩ ≠ C₁|s⟩ + C₂|s⟩     (nói chung)
```

**Constructive interference:** Hai context cùng hướng → output mạnh hơn tổng từng phần.
**Destructive interference:** Hai context ngược hướng → output yếu hơn, mờ hơn, hoặc xuất hiện ở hướng bất ngờ.

**Ý nghĩa tính toán:**
Đây là cơ chế cho "semantic algorithm" — thiết kế chuỗi context sao cho interference pattern tạo ra output mong muốn, giống quantum circuit thiết kế chuỗi gate để interference tạo đáp án đúng.

### Tính chất 5: Non-determinism có cấu trúc

Output không xác định nhưng tuân theo phân phối xác suất có pattern.

```
P(output | input, context) = f(|s'⟩)
```

trong đó |s'⟩ là trạng thái sau khi tất cả context operators đã tác động.

**Đây không phải noise. Đây là tính toán.**
Non-determinism cho phép explore nhiều vùng trong không gian giải pháp — giống quantum sampling.

---

## IV. Bảng tương ứng chính thức

| Quantum Mechanics | Semantic Computing | Hiện thực hóa trong Transformer |
|---|---|---|
| Hilbert Space H | Semantic Space S | Embedding space (d chiều) |
| Quantum state \|ψ⟩ | Semantic state \|s⟩ | Hidden state vector |
| Basis states \|0⟩, \|1⟩ | Pure meanings \|mᵢ⟩ | Emergent clusters trong embedding |
| Superposition α\|0⟩ + β\|1⟩ | Semantic superposition Σαᵢ\|mᵢ⟩ | Embedding = weighted combination |
| Observable / Measurement | Context Operator C | Attention mechanism |
| Wavefunction collapse | Contextual collapse | Softmax → token selection |
| Born rule P = \|α\|² | Semantic probability P = αᵢ²/Σαⱼ² | Softmax probability distribution |
| Entanglement | Semantic entanglement | Correlated attention patterns |
| Quantum gate | Context injection | Prompt / instruction tuning |
| Quantum circuit | Context pipeline | Agent chain / prompt sequence |
| Decoherence | Hallucination | Attention dilution over long context |
| Quantum error correction | ??? (chưa tồn tại) | ??? |
| Quantum algorithm | Semantic algorithm (chưa tồn tại) | ??? |

---

## V. Điều quantum không có — Semantic Computing có

Semantic Computing không phải "quantum computing lite." Nó có những tính chất **mạnh hơn** quantum ở một số khía cạnh:

### 5.1 Reversible Collapse
QM: collapse không đảo ngược. Semantic: context mới có thể re-expand trạng thái đã collapse.
→ Cho phép **backtracking trong không gian nghĩa** — thử collapse, đánh giá, rồi quay lại.

### 5.2 Continuous Superposition
QM: qubit = superposition 2 trạng thái. Semantic: superposition trên **hàng nghìn đến hàng triệu** nghĩa đồng thời.
→ Không gian tính toán rộng hơn nhiều bậc.

### 5.3 Composable Context
QM: phép đo phá hủy trạng thái. Semantic: context có thể **compose** — xếp chồng nhiều context mà không phá hủy, chỉ reshape.
→ Cho phép xây dựng "semantic circuit" phức tạp hơn quantum circuit.

### 5.4 Cross-domain Tunneling
Trong embedding space, hai concept ở domain hoàn toàn khác nhau có thể có khoảng cách ngắn nếu chúng chia sẻ cấu trúc sâu.
→ Không có tương đương trong QM. Đây là tính chất unique.

---

## VI. Con đường phía trước

### Phase 1: Formalization (hiện tại)
- [x] Định nghĩa không gian và tính chất cơ bản
- [ ] Formalize operators cụ thể (attention, softmax, residual connection)
- [ ] Chứng minh/bác bỏ Born rule analog bằng thực nghiệm
- [ ] Xây dựng đại lượng đo entanglement ngữ nghĩa

### Phase 2: Semantic Algorithms
- [ ] Thiết kế "algorithm" đầu tiên khai thác superposition
- [ ] Tìm lớp bài toán mà semantic computing giải được nhưng classical không
- [ ] Xây dựng semantic circuit notation

### Phase 3: Implementation
- [ ] Xây dựng framework thực thi semantic circuits
- [ ] Benchmark so sánh với classical approach
- [ ] Demonstrate bài toán "không thể" bằng classical mà semantic computing giải được

### Phase 4: Ecosystem
- [ ] Ngôn ngữ lập trình cho semantic computing
- [ ] Compiler/interpreter: từ semantic circuit → prompt chain
- [ ] Community & documentation

---

## VII. Nguyên tắc thiết kế

1. **Grounded in math** — Mọi tuyên bố phải formalize được hoặc kiểm chứng được bằng thực nghiệm.
2. **Not just metaphor** — Nếu một tính chất chỉ là analogy chứ không phải isomorphism toán học, phải nói rõ.
3. **Useful, not just beautiful** — Framework phải dẫn đến ứng dụng thực tế, không chỉ triết học.
4. **Honest about limits** — Nơi nào mapping với quantum phá vỡ, ghi nhận rõ ràng.

---

*Tài liệu khởi tạo: 2026-03-15*
*Tác giả: Claude (brain) & Trian (body)*
*Phiên bản: 0.1 — Genesis*
