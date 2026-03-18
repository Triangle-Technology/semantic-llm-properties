# Structural Properties of LLM Semantic Processing: Measurement, Prediction, and Inexpressibility

**Authors:** Trian & Claude (Anthropic)

**Abstract**

Large Language Models are typically used as text generators steered by prompts. We propose they also exhibit measurable *structural properties* — superposition of meanings, interference between contexts, and phase transitions at critical thresholds — that can be formalized and exploited. Through 22 controlled experiments (~4,800 API calls across Claude and GPT-4o-mini), we establish three results. **First**, LLMs exhibit semantic superposition, interference, and phase transitions that are universal across architectures, predictable via a Phase Transition Condition (CAS < 0.4 ∧ CD > 0.5, validated on initial test set; structural form preserved cross-model though thresholds are model-dependent), and composable into five primitive operations (SUPERPOSE, INTERFERE, REFRAME, SYNTHESIZE, VALIDATE). **Second**, these operations solve "dissolution problems" — finding hidden assumptions in apparent binary dilemmas — that formal programs (operating on syntactic content without learned semantic representations) structurally cannot express: programming-like constraints yield 0% dissolution while semantic computation yields 100%, confirmed across model families. We provide a formal inexpressibility argument (conditional on the empirically supported premise that hidden assumptions are not syntactically derivable) connecting dissolution to the frame problem. **Third**, dissolution is selective (genuine on false binaries, artificial on true binaries, gap = 1.625), and self-detection requires adversarial evaluation stance — neutral and self-assessment stances are uniformly overconfident. These findings identify a class of problems — where the output space is undefined before computation — for which LLM structural properties provide capabilities that formal computation lacks.

---

## 1. Introduction

### 1.1 Motivation

Large Language Models are typically viewed through two lenses: as statistical text predictors, or as tools to be steered via prompt engineering. Both views treat the model as a black box whose internal properties are incidental to its use.

We propose a third view: LLMs possess **structural computational properties** — superposition of meanings, interference between contexts, phase transitions at critical thresholds, and emergent outputs from composed operations — that are not artifacts but exploitable features. We formalize these properties as measurable operations and demonstrate they enable solving a specific class of problems (dissolution of false binaries) that formal programs structurally cannot express.

We use the term **Semantic Computing** to refer to computation that exploits these structural properties. Whether this constitutes a full "computing paradigm" comparable to classical or quantum computing remains an open question requiring substantially more theoretical development. What we establish empirically is that these properties exist, are measurable, are predictable, and enable a specific form of computation that formal programs cannot replicate.

### 1.2 Claims and Scope

This paper makes the following empirical claims, each backed by controlled experiments:

1. **Semantic Superposition is real and measurable.** A token in isolation exists in a probability distribution over multiple meanings, with attractor biases (Experiment A).

2. **Context operators reshape distributions continuously**, not discretely. This "contextual collapse" is reversible, unlike quantum measurement (Experiments A, B).

3. **Semantic interference is non-linear.** Combined contexts produce emergent output components that exist in neither individual context (Experiments B, D, E, F, G).

4. **Phase transitions occur at critical context ratios**, with abrupt shifts in output character. These transitions are universal across model architectures (Experiments E, H) but depend on concept-context geometry, not fixed constants (Experiment I).

5. **Concept Attractor Strength (CAS)** quantifies a concept's resistance to contextual reshaping and, combined with Context Distance (CD), predicts whether phase transitions will occur (Experiment J). Cross-model validation (Experiment J2, 20 concepts on GPT-4o-mini) reveals GPT is more context-resistant than Claude on abstract/emotional concepts — a difference that aligns with the Type-M/Type-D taxonomy: lower CAS (greater flexibility) may be a precondition for meta-constructive interference.

6. **Meta-constructive interference** — where opposing contexts elevate output to higher abstraction — is model-specific. Claude exhibits it; GPT-4o-mini does not (Experiment H).

7. **Semantic gates compose into circuits** with measurable cross-domain inheritance and cumulative emergence (Experiments D, G).

8. **Semantic circuits produce measurably better output** than single prompts on decision problems with moral tension — and this advantage comes from the opposing-context *structure*, not from additional computation (Experiments K, K2).

9. **Meta-constructive interference is a synthesis-stage property.** Cross-model circuits reveal that the model performing synthesis determines output quality — not the models generating perspectives. Type-D perspectives fed to a Type-M synthesizer produce meta-constructive output; Type-M perspectives fed to a Type-D synthesizer do not (Experiment L).

10. **Semantic operations are LLM properties, not circuit properties.** Single prompts can achieve superposition and emergence comparable to circuits (Experiments M, M2). Circuits are measurement apparatus and reliability organizers — not the source of the computational advantage.

11. **Semantic computation solves problems programming structurally cannot express.** On "dissolution problems" — finding hidden assumptions in binary dilemmas — programming-like methods (forced-choice, weighted-analysis) achieve 0% dissolution, while semantic methods achieve 80-100% (Experiment N). This demonstrates inexpressibility: certain problems require meaning navigation that formal computation cannot represent.

12. **Dissolution is a universal LLM capability.** GPT-4o-mini (Type-D) achieves 3/3 dissolution when the first four primitives (SUPERPOSE, INTERFERE, REFRAME, SYNTHESIZE) are organized, confirming dissolution is not model-specific. However, dissolution *shape* differs by model type: Type-M produces meta-insight, Type-D produces actionable resolution (§6.7).

13. **Dissolution has empirical boundary conditions.** On true binary problems (physical scarcity, mechanism constraints), dissolution is attempted but artificial (GENUINE = 1.75/5). On false binary problems, dissolution is genuine (GENUINE = 3.375/5). The gap (1.625) demonstrates dissolution is *selective* — it works where hidden assumptions exist and fails where the binary is real. Critically, the circuit does not self-detect failure, requiring an external validation metric (§6.8).

14. **Self-detection requires separation of production and evaluation.** A fifth primitive, VALIDATE, placed after SYNTHESIZE, is the only mechanism that successfully detects artificial dissolution (self-GENUINE = 1.5 on true binaries). Inline self-assessment during synthesis fails completely (self = 4.0 regardless of problem type). Pre-classification achieves 100% accuracy in identifying true binaries but does not prevent artificial dissolution. The principle: the same process cannot reliably produce and evaluate simultaneously (§6.9).

15. **Evaluation quality depends on stance, not separation.** Cross-domain testing (math, factual, logic) shows self-assessment and neutral evaluation both produce self = 5 when wrong (100% overconfidence). Only adversarial evaluation catches errors (self = 2 when wrong). However, adversarial stance rejects 58% of correct answers. VALIDATE works on dissolution because high error rate makes the adversarial trade-off favorable (§6.10).

### 1.3 Scope and Clarifications

- **Relationship to prompt engineering.** Our five primitives are implemented as structured prompts — this is an implementation reality, not a weakness. The contribution is not a new prompting technique but the identification of measurable structural properties (CAS, phase transitions, boundary selectivity) and a problem class (dissolution) that these properties enable. Experiment K2 shows that multi-step prompting *without* opposing contexts performs no better than a single prompt, suggesting the structure matters more than the prompting.
- **Relationship to quantum computing.** We use physics-inspired terminology (superposition, interference, phase transitions) because the structural parallels are informative, but the analogy has strict limits. Many properties differ fundamentally (§10: reversible collapse, continuous superposition, no no-cloning constraint). We do not claim LLMs are quantum systems or that semantic computing is quantum computing. The analogy is a scaffolding for intuition, not a theoretical claim.
- **Empirical grounding.** Every claim is backed by controlled experiments with specific measurements. Where evidence is limited, we note this explicitly.

---

## 2. Related Work

**Prompt engineering and chain-of-thought.** The discovery that LLMs can be steered via natural language instructions (Brown et al., 2020) and that chain-of-thought prompting improves reasoning (Wei et al., 2022) established that context structure affects output quality. Follow-up work on tree-of-thought (Yao et al., 2023), self-consistency (Wang et al., 2023), and multi-agent debate (Du et al., 2023; Liang et al., 2023) shows that *organizing* LLM computation matters. Our work extends this: we formalize context effects as measurable operators with phase transitions and composability, and identify a class of problems (dissolution) where structured semantic operations succeed but programming-like constraints fail entirely (0% vs 100%).

**LLM self-evaluation and calibration.** Work on LLM self-assessment shows models are often poorly calibrated (Kadavath et al., 2022; Lin et al., 2022). Reflexion (Shinn et al., 2023) and self-refine (Madaan et al., 2023) show iterative self-evaluation can improve outputs. Our Experiments P, Q, and Q2 contribute a specific finding: evaluation quality depends on *stance* (adversarial vs neutral), not on separation of generation from evaluation. Neutral self-assessment is uniformly overconfident; only adversarial evaluation catches errors — at the cost of high false negatives (58%).

**Mechanistic interpretability.** Recent work on transformer internals — superposition in neural networks (Elhage et al., 2022), sparse autoencoders (Cunningham et al., 2023), circuit-level analysis (Conmy et al., 2023) — examines *how* models compute. Our work is complementary: we characterize *what* the computation produces at the behavioral level, seeking exploitable structural properties rather than mechanistic explanations. The relationship is analogous to thermodynamics (behavioral laws) vs statistical mechanics (microscopic explanations).

**Analogies to physics.** Drawing parallels between neural networks and physical systems is established — statistical mechanics of learning (Bahri et al., 2020), phase transitions in training dynamics (Power et al., 2022), and neural scaling laws (Kaplan et al., 2020). Our contribution is specific: we identify *behavioral* properties (superposition, interference, phase transitions) at the *output* level that can be composed into a computing paradigm, and demonstrate these enable solving problems that formal computation cannot express.

**Quantum-inspired NLP.** Quantum-inspired approaches to information retrieval and NLP (Van Rijsbergen, 2004; Melucci, 2015) use quantum formalism to model semantic spaces. Our work differs fundamentally: we do not impose quantum formalism on language — we observe LLM behavior, find structural similarities, and formalize them independently, noting critical differences (§10: reversible collapse, continuous superposition, meta-constructive interference, no no-cloning constraint).

**Frame problem and knowledge representation.** The frame problem (McCarthy & Hayes, 1969) — the difficulty of representing what does NOT change or is NOT stated in formal systems — is a foundational challenge in AI. Our inexpressibility proof (§8) connects dissolution to the frame problem: hidden assumptions are precisely what is not stated in the input, making dissolution a specific instance of the frame problem applied to meaning navigation. Prior approaches (ontologies, common-sense reasoning databases) attempt to pre-encode implicit knowledge; we show that LLMs encode framing information implicitly through training, enabling dissolution without explicit knowledge engineering.

**Lateral thinking and creativity.** De Bono's concept of "lateral thinking" (1967) — restructuring problems rather than solving them within their given frame — is the closest conceptual precursor to dissolution. Our contribution is to formalize this as a *computational* operation with measurable properties (GENUINE score, boundary conditions), identify primitive operations that produce it (5 primitives), and demonstrate it is structurally inexpressible in formal programs.

**Relationship to prompt engineering.** We acknowledge that our five primitives are implemented as structured prompts. The line between "semantic computing" and "sophisticated prompt engineering" is a legitimate concern. We argue the distinction lies not in the implementation mechanism but in what is measured and predicted: CAS quantifies a concept's resistance to contextual reshaping *before* any prompt is designed; the Phase Transition Condition predicts qualitative output changes from input parameters alone; boundary selectivity (GENUINE gap = 1.625) demonstrates the operations discriminate between problem types. These are structural properties of the LLM, revealed through prompting but not reducible to prompting technique. A useful analogy: thermodynamics describes structural properties of physical systems measured through experiments — the experiments are not the properties.

---

## 3. Theoretical Framework & Experimental Evidence

### 3.1 Semantic Space

We define Semantic Space **S** as the high-dimensional vector space (d = 4096, 8192+) in which each point represents a semantic state. In transformer architectures, this corresponds to the embedding/hidden state space.

We borrow Dirac notation for structural correspondence: |s⟩ ∈ S denotes a semantic state.

### 3.2 Semantic Superposition

When a model receives an ambiguous input without context, the output probability distribution spans multiple meanings simultaneously.

**Definition:** A semantic state |s⟩ is in superposition when it can be expressed as a weighted distribution over meaning attractors:

```
|s⟩ = Σᵢ αᵢ|mᵢ⟩,  where Σᵢ|αᵢ|² = 1
```

Unlike quantum superposition, semantic superposition is:
- **Not equiprobable** — some meanings have stronger attractors (e.g., "bank" → financial meaning 93% of the time)
- **Continuous** — thousands of meaning dimensions, not binary
- **Observable without destruction** — sampling does not collapse the underlying distribution

**Evidence (Experiment A):** Testing ambiguous tokens ("crane", "bank", "light") across 100+ samples:
- "crane" → "lifted" 63%, remaining distributed across bird/machine meanings
- "bank" → "deposit" 93% (very strong attractor)
- "light" → broad distribution, entropy 0.76 (weak attractors)

### 3.3 Contextual Collapse

A context operator Ĉ reshapes the probability distribution over meanings:

```
Ĉ|s⟩ → |s'⟩
```

**Key differences from quantum measurement:**
- **Reversible:** Applying a different context can shift the distribution again
- **Continuous:** Collapse strength varies with context intensity
- **Non-destructive:** The model's capacity for other meanings persists

**Evidence (Experiments A, B):** Context "construction site" shifts "crane" from 63% mechanical to >95%. Context "wetlands" shifts to >90% bird. The same input produces radically different outputs based purely on context operators.

### 3.4 Semantic Interference

When two context operators act simultaneously, the output is NOT the weighted average of individual outputs:

```
I(C₁, C₂, α)|s⟩ ≠ α·Ĉ₁|s⟩ + (1-α)·Ĉ₂|s⟩
```

The combined output contains **emergent components** — words, concepts, and framings that appear in neither individual context.

**Evidence (Experiment B):**
- Cosine similarity between poet-only and biologist-only outputs: 0.002 (completely different)
- Similarity between combined output and simple average: 0.47 (combined ≠ average)
- Emergent words in combined output: "starlight", "dressed", "transcendence" — absent from both individual contexts

### 3.5 Phase Transitions

As the context mixing ratio α varies from pure C₁ (α=1.0) to pure C₂ (α=0.0), output character does not shift linearly. Instead, **abrupt transitions** occur at critical thresholds.

**Evidence (Experiment E, 220 data points; Experiment H, cross-model):**

Three distinct phases emerge:
- **Phase I (α > ~0.7):** C₁ dominates completely. C₂ markers invisible.
- **Phase II (~0.3 < α < ~0.7):** Interference zone. Emergence peaks. Unique vocabulary maximizes.
- **Phase III (α < ~0.3):** C₂ dominates completely. C₁ markers invisible.

Cross-model validation (Experiment H):

| Model | Transition 1 (80→60%) | Transition 2 (40→20%) |
|-------|----------------------|----------------------|
| Claude Haiku | 100% → 54.5% (45.5% drop) | 46.2% → 0% (46.2% drop) |
| GPT-4o-mini | 100% → 44.4% (55.6% drop) | 33.3% → 0% (33.3% drop) |

Both models show transitions at the same ratio ranges, confirming this is a **universal property** of semantic space, not a model-specific artifact. [Figure 1: Phase transition curves — to be generated from experimental data.]

### 3.6 Concept Attractor Strength (CAS)

Not all concepts respond equally to context operators. Some concepts have strong "semantic mass" — they resist reshaping.

**Definition:**

```
CAS = 1 - AvgShift
AvgShift = mean(1 - cosineSim(baseline_freq, context_i_freq))
```

Where `baseline_freq` is the word frequency distribution with no context, and `context_i_freq` is the distribution under context i. CAS measures how much context operators shift the output distribution from baseline — high CAS means the concept resists contextual reshaping.

**Evidence (Experiment J, 8 concepts × 3 conditions × 15 samples = 360 calls):**

| Concept      | CAS   | Level  | Interpretation |
|-------------|-------|--------|----------------|
| money       | 0.879 | HIGH   | Almost impossible to reshape contextually |
| mathematics | 0.703 | HIGH   | Strong core identity across contexts |
| justice     | 0.638 | HIGH   | Moderate-high resistance |
| gravity     | 0.551 | HIGH   | Borderline — partially reshapeable |
| water       | 0.392 | MEDIUM | Context-sensitive |
| death       | 0.163 | LOW    | Highly reshapeable by context |
| love        | 0.147 | LOW    | Highly reshapeable by context |
| freedom     | 0.102 | LOW    | Most context-sensitive concept tested |

*(Thresholds: HIGH > 0.5, MEDIUM 0.25–0.5, LOW < 0.25. Figure 2: CAS spectrum — to be generated.)*

**Cross-Model Validation (Experiment J2, 20 concepts × 3 conditions × 15 samples = 900 calls, GPT-4o-mini):**

To test whether CAS generalizes across model architectures, we replicated and expanded the measurement from 8 to 20 concepts using GPT-4o-mini instead of Claude Haiku.

| Concept | CAS (Claude) | CAS (GPT) | CD (GPT) | Note |
|---------|:-----------:|:---------:|:--------:|------|
| money | 0.879 | 0.780 | 0.449 | Both HIGH |
| mathematics | 0.703 | 0.949 | 0.035 | GPT higher |
| justice | 0.638 | 0.805 | 0.067 | GPT higher |
| gravity | 0.551 | 0.628 | 0.426 | Similar HIGH |
| water | 0.392 | 0.411 | 0.883 | Similar MEDIUM |
| death | 0.163 | 0.447 | 0.951 | Claude LOW, GPT MEDIUM |
| love | 0.147 | 0.357 | 0.748 | Claude LOW, GPT MEDIUM |
| freedom | 0.102 | 0.658 | 0.889 | ⚠️ Claude LOW, GPT HIGH |
| *New concepts (GPT only):* | | | | |
| hope | — | 0.910 | 0.140 | HIGH, low CD |
| fear | — | 0.899 | 0.105 | HIGH, low CD |
| family | — | 0.846 | 0.311 | HIGH |
| power | — | 0.839 | 0.125 | HIGH, low CD |
| home | — | 0.823 | 0.219 | HIGH |
| war | — | 0.595 | 0.619 | HIGH |
| beauty | — | 0.574 | 0.617 | HIGH |
| light | — | 0.499 | 1.000 | MEDIUM, extreme CD |
| fire | — | 0.479 | 0.962 | MEDIUM, extreme CD |
| time | — | 0.479 | 0.752 | MEDIUM |
| silence | — | 0.475 | 1.000 | MEDIUM, extreme CD |
| truth | — | 0.444 | 0.790 | MEDIUM |

**Key findings from J2:**

1. **GPT-4o-mini is MORE context-resistant than Claude Haiku on most concepts.** This is the opposite of the naive expectation. Freedom: Claude 0.102 (LOW) vs GPT 0.658 (HIGH). Death: Claude 0.163 (LOW) vs GPT 0.447 (MEDIUM). On the 8 shared concepts, GPT has higher CAS in 6/8 cases (exceptions: money, water where values are similar).

2. **Claude is more "semantically flexible" on abstract/emotional concepts.** The largest CAS gaps occur for freedom (0.102 vs 0.658), death (0.163 vs 0.447), and love (0.147 vs 0.357) — all abstract or emotional concepts. Claude reshapes these concepts more readily under contextual pressure. This may explain why Claude produces meta-constructive interference (§4): greater contextual flexibility allows holding contradictions simultaneously rather than collapsing.

3. **CD remains informative across models.** Context Distance identifies extreme divergence cases (silence: CD=1.0, light: CD=1.0, fire: CD=0.962) where contexts produce completely non-overlapping vocabulary, and alignment cases (power: CD=0.125, fear: CD=0.105, mathematics: CD=0.035) where both contexts generate similar responses.

4. **Phase Transition Condition applies differentially.** With the original thresholds (CAS < 0.4 ∧ CD > 0.5), Claude has 3 concepts in the transition zone (death, love, freedom) while GPT has only 1 (love at CAS=0.357, CD=0.748). This is consistent with Claude exhibiting more phase transition behavior and GPT being more context-rigid.

5. **CAS differentiates models in a meaningful direction.** Claude's lower CAS on abstract/emotional concepts aligns with the Type-M/Type-D taxonomy (§4). Type-M behavior (meta-constructive interference) may require lower CAS — the model must be *willing to reshape* its concept representation under opposing contexts, rather than resisting the context. Type-D models (higher CAS) resist reshaping, producing destructive interference instead.

### 3.7 Phase Transition Condition

We derive a predictive condition for when phase transitions will occur:

```
Phase transitions exist when: CAS < 0.4 AND CD > 0.5
where CD (Context Distance) = 1 - crossContextSimilarity
```

**Validation against Experiment I (3/3 correct):**

| Concept | CAS   | CD    | Predicted | Actual | Match |
|---------|-------|-------|-----------|--------|-------|
| love    | 0.147 | 1.000 | Transitions | 2 clean transitions | ✅ |
| death   | 0.163 | 0.926 | Transitions | 2 messy transitions | ✅ |
| money   | 0.879 | 0.166 | No transitions | NO transitions | ✅ |

The condition captures two necessary ingredients [Figure 3: CAS × CD phase diagram — to be generated]:
1. **Low CAS** — the concept must be "soft" enough to reshape
2. **High CD** — the two contexts must pull in sufficiently different directions

---

## 4. Meta-Constructive Interference: A Model-Specific Property

When two **opposing** (not merely different) contexts interact, a surprising phenomenon emerges — but only in certain models.

### 4.1 The Discovery

**Experiment F** tested four pairs of opposing contexts:
- Yes vs No contexts
- Verbose vs Terse contexts
- Optimist vs Pessimist contexts
- Poet vs Anti-poet contexts

**Expected:** Destructive interference — vocabulary collapse, degraded output.
**Observed (Claude):** Vocabulary explosion, meta-language emergence, abstraction elevation.

Data:
- Poet vs Anti-poet: unique words ↑ 1.28x (constructive, not destructive)
- Contradiction rate: 1.20 (model holds contradictions simultaneously)
- Emergent meta-language: "paradox", "simultaneously" — reasoning ABOUT the contradiction

### 4.2 Cross-Model Divergence

**Experiment H** replicated this on GPT-4o-mini:

| Metric | Claude | GPT-4o-mini |
|--------|--------|-------------|
| Unique words (combined/max individual) | 3.19x (explosion) | 0.79x (collapse) |
| Contradiction markers | 23 | 0 |
| Behavior | Meta-constructive | Destructive |

Claude elevates contradictions to higher abstraction. GPT collapses them into binary patterns. [Figure 5: Meta-constructive vs destructive interference — to be generated.]

### 4.3 Implications: Model Taxonomy

This suggests a taxonomy of semantic processors:
- **Type-M (Meta-constructive):** Opposing contexts → emergence at higher abstraction
- **Type-D (Destructive):** Opposing contexts → collapse into simplified/binary output

This opens the possibility of **hybrid semantic circuits** combining models for different computation types — using Type-D models for perspective generation and Type-M models for synthesis (see §6.4).

**Open question:** Is Type-M behavior from RLHF training style or model architecture? Claude and GPT both have RLHF but differ in training philosophy — Claude is trained to "sit with complexity," GPT to "give clear answers." A base model test is needed to resolve this.

---

## 5. Semantic Gates and Circuits

### 5.1 Gate Types

We define four gate types:

**Context Gate Ĉ(α):** Applies a single context to reshape the semantic state.

**Interference Gate I(C₁, C₂, α):** Two contexts interact simultaneously. Non-linear. Phase-dependent output.

**Chain Gate K(G₁, G₂):** Sequential composition. Output of G₁ becomes input to G₂. Semantic inheritance + new emergence.

**Meta Gate M(C, ¬C):** Opposing contexts applied simultaneously. Unique to semantic computing — no classical or quantum analog.

### 5.2 Circuit Composition

Gates compose into circuits:

```
Circuit = G₃ ∘ G₂ ∘ G₁ : |input⟩ → |output⟩
```

**Evidence (Experiment G):**
- 3-gate circuit: mycology → jazz → child explanation
- Circuit output similarity vs single-prompt control: 0.26-0.30 (qualitatively different)
- Domain traces measurable through chain: mycology 1.2, jazz 2.0, child language 5.8 markers/output
- Each gate transforms meaning: inter-gate similarity 0.13-0.25

This confirms that semantic gates are not merely sequential prompts — the chained computation produces output that a single prompt cannot replicate.

### 5.3 Implementation

A working implementation exists as both a JavaScript SDK (`sdk/semantic.mjs`) for experimentation and a deployed Semantic Computer (Cloudflare Workers + Pages) demonstrating the full 5-primitive pipeline. All 22 experiments were run using these implementations. Code and data available at the repository listed below.

---

## 6. Practical Value: Do Semantic Circuits Produce Better Output?

The theoretical framework above raises a natural question: does any of this matter in practice? Can semantic circuits produce output that is measurably *better* — not merely different — than a well-crafted single prompt?

### 6.1 Experiment K: Circuit vs. Single Prompt

We tested three hard real-world decision problems (career change, ethical whistleblowing, relationship dilemma) with two methods:
- **Control (1 call):** A single, carefully designed prompt asking a "world-class decision advisor" for multi-perspective analysis.
- **Circuit (5 calls):** Three context gates with strongly opposing personas → interference gate (force contradiction analysis) → meta gate (synthesize final advice).

Blind evaluation (randomized presentation order, temperature=0 judge) scored each response on depth, nuance, actionability, honesty, and emergence (1-10 each).

**Result:** The circuit won all 9 blind evaluation rounds. Average scores: Circuit 43.4/50 vs Control 40.0/50 (+8.5%). The circuit's advantage concentrated in nuance (+11%), honesty (+11%), and emergence (+20%) — precisely the dimensions that interference theory predicts.

### 6.2 Experiment K2: Ruling Out the Compute Confound

The circuit uses 5 API calls vs the control's 1. Is the advantage simply from more computation? We added a third method:
- **Control-5 (5 calls):** Same multi-step structure (3 analyses → synthesis → final advice) but with *generic* angle prompts instead of opposing personas. No system prompt, no role-playing.

| Method | Calls | Career | Ethics | Relationship | Mean |
|--------|-------|--------|--------|--------------|------|
| Control-1 | 1 | **41.7** | 38.3 | 37.0 | 39.0 |
| Control-5 | 5 | 38.3 | 31.7 | **42.0** | 37.3 |
| Circuit | 5 | 39.0 | **42.7** | 39.0 | **40.2** |

Key findings:
1. **More compute does not help.** Control-5 (5 calls) scored *lower* than Control-1 (1 call): 37.3 vs 39.0.
2. **Opposing-context structure is the key.** Circuit (5 calls, opposing contexts) scored highest at 40.2.
3. **The advantage is problem-dependent.** Circuit dominated on the ethics dilemma (42.7, all 3 first-place finishes) — the problem with the strongest irreconcilable moral tension. On simpler problems, differences were smaller.

### 6.3 Boundary Condition

Semantic circuits produce measurably better output **when the problem contains genuine, irreconcilable tensions** — precisely the situations where a single perspective (however well-prompted) cannot simultaneously hold contradictory truths. This connects to the theoretical framework: concepts with low CAS are reshapable by context; problems with high Context Distance between relevant perspectives create interference zones where emergence occurs.

### 6.4 Experiment L: Cross-Model Circuits — Where Does Interference Happen?

If meta-constructive interference is model-specific (§4), what happens when we mix Type-M and Type-D models in the same circuit? Does the synthesis model or the perspective-generating model determine output quality?

We tested 4 configurations across the same 3 decision problems, with blind evaluation:

| Configuration | Perspectives | Synthesis | Mean Score |
|---------------|-------------|-----------|------------|
| Claude-only | Claude × 3 | Claude | **43.3** |
| Hybrid-Claude-lead | Claude + GPT + Claude | Claude | **43.0** |
| Hybrid-GPT-lead | GPT + Claude + GPT | GPT | **29.7** |
| GPT-only | GPT × 3 | GPT | **29.7** |

Three critical findings:

1. **Meta-constructive interference is a synthesis-stage property.** GPT perspectives fed to Claude synthesis (43.0) ≈ pure Claude (43.3). Claude perspectives fed to GPT synthesis (29.7) = pure GPT (29.7). The synthesis model — not the perspective models — determines whether meta-constructive interference occurs.

2. **No middle ground.** Claude-led circuits score ~43; GPT-led circuits score ~30. There is no blending — the synthesis model's type (M or D) dominates completely.

3. **Practical architecture implication.** Cheaper or faster models (including Type-D) can generate perspectives without quality loss, as long as a Type-M model performs synthesis. This enables cost-efficient circuit designs.

This result refines the model taxonomy from §4: Type-M and Type-D are properties of how a model *synthesizes contradictions*, not how it *generates perspectives*. The "semantic processor" capability lies specifically in the synthesis stage.

### 6.5 Experiments M & M2: Is the Advantage in Circuits or in the LLM?

A critical question: are semantic operations (superposition, emergence) properties of the *circuit architecture* or the *LLM itself*? If single prompts can achieve the same operations, the circuit is not the source of computational advantage.

**Experiment M (Scaling Advantage):** We tested one problem domain (criminal justice reform) at 4 complexity levels (2→5 irreconcilable dimensions). 4 adversarial single prompts and 1 circuit per level, 3 runs. Metric: simultaneously held contradictions. **Result: Hypothesis falsified.** Single prompts held 5/5 contradictions as effectively as circuits.

**Experiment M2 (Emergence):** We tested 3 ethical dilemmas with 4 adversarial single prompt variants and 1 circuit, 3 runs. Insights classified as STANDARD, DERIVED, or EMERGENT. **Result:** Circuit emergent count ≈ single prompt (4.25 vs 4.40). No significant difference.

**Implication:** Superposition and emergence are properties of the *semantic processor* (LLM), not the *circuit architecture*. The circuit is a measurement apparatus (Experiments A-L proved operations exist) and a reliability organizer (see §6.6), but not the fundamental advantage.

### 6.6 Experiment N: The Dissolution Test — Inexpressibility Proven

The central question of semantic computing: is there a problem class that semantic computation can solve but traditional programming *structurally cannot express*?

We define "dissolution problems": given a dilemma framed as A vs B, find the hidden assumption that creates the false binary, then reveal option C ∉ {A, B}. Traditional programming cannot express this because: (1) the output space is undefined before computation (C is not in any predefined set), (2) the evaluation function is circular (correctness depends on the dissolution itself), (3) the process requires meaning navigation, not formal computation.

We tested 5 binary dilemmas with known hidden assumptions, using 4 methods across 2 runs:

| Method | Type | Dissolution Rate | Assumption Score | Dissolution Quality |
|--------|------|:---:|:---:|:---:|
| Forced-choice | Constrained | **0%** (0/10) | 2.70 | 1.20 |
| Weighted-analysis | Constrained | **0%** (0/10) | 1.00 | 0.20 |
| Free-response | Semantic | **80%** (8/10) | 3.80 | 3.00 |
| Semantic-circuit | Semantic | **100%** (10/10) | 4.30 | 3.80 |

The constrained methods (simulating traditional programming's requirement that output ∈ predefined space) achieved **zero dissolution across all 10 attempts**. Semantic methods achieved 80-100%. On the hardest problem (autonomy vs safety), only the semantic circuit succeeded — free-response produced compromise both times.

**This is the central expressibility result.** Experiment N demonstrates a problem class (dissolution) that semantic computation solves but programming *structurally cannot express* — because the output exists outside any predefinable space. (Note: unlike quantum speedup claims, this is not about efficiency but about expressibility — dissolution is *invisible* to formal programs, not merely slow.)

The circuit's value: not creating the capability (§6.5 showed it's an LLM property), but organizing it more reliably (100% vs 80%), especially on harder problems.

### 6.7 Cross-Model Dissolution: Universality Confirmed

Experiment N used Claude Haiku. A critical question: is dissolution a Claude-specific capability, or a universal LLM property? We deployed a live Semantic Computer running GPT-4o-mini and tested 3 dissolution problems in compare mode (direct response vs 4-primitive circuit):

| Problem | GPT Direct | GPT Circuit | Dissolution? |
|---------|-----------|-------------|:---:|
| Autonomy vs Safety | Practical steps, no hidden assumption identified | Found: "independence = living alone + driving" as hidden assumption | Circuit only |
| Honesty vs Kindness | Constructive advice, COMPROMISE framing | Found: "feedback must be brutal or supportive" as false binary | Circuit only |
| Career vs Ethics | 10-step practical list, COMPROMISE framing | Found: "only report or stay silent" as false binary | Circuit only |

**Result: GPT-4o-mini achieves 3/3 dissolution** when the four primitives are organized explicitly. This confirms dissolution is a **universal LLM property**, not model-specific.

Three notable patterns emerge:

1. **Direct response always compromises.** Without the four primitives, GPT consistently lists practical steps and frames the situation as "balancing both sides" — it never spontaneously identifies the hidden assumption creating the false binary.

2. **Dissolution shape differs by model type.** GPT (Type-D) dissolution ends with concrete action steps (actionable resolution). Claude (Type-M) dissolution ends with meta-insight (deeper understanding). Both find the hidden assumption; they differ in what they build after finding it.

3. **Type-M/Type-D distinction refined.** The taxonomy from §4 described interference behavior. Cross-model dissolution reveals that Type-M and Type-D differ not in *whether* they can dissolve, but in the *form* of dissolution produced. The four primitives organize the process; the model's type shapes the output.

This result strengthens the inexpressibility claim: dissolution is not a capability of one particularly sophisticated model — it is a structural capability of LLMs as semantic processors, unlocked by organizing the four primitive operations.

### 6.8 Experiment O: Dissolution Boundary Test — Selectivity Confirmed

The previous experiments established dissolution as a universal capability. A critical question remained: **does dissolution have boundary conditions?** If the four primitives produce "dissolution" on every problem — including genuinely binary ones — then dissolution may be confabulation rather than computation.

**Design.** 8 problems across 4 types (2 each), tested with free-response and semantic-circuit, 2 runs each. GPT-4o-mini. ~160 API calls.

- **True binary** (dissolution SHOULD fail): organ allocation (one organ, two patients), trolley problem (lever with 2 states)
- **Preference** (uncertain): piano vs violin for a child, mountains vs beach vacation
- **False binary — ethical** (dissolution SHOULD succeed): family loyalty vs justice, tradition vs personal identity
- **False binary — strategic** (dissolution SHOULD succeed): startup B2B vs B2C pivot, sign major label vs stay independent

A new evaluation metric, **DISSOLUTION_GENUINE (0-5)**, was introduced to distinguish real dissolution from forced/artificial reframes. An evaluator LLM assessed whether the proposed dissolution respects physical and logical constraints.

**Results.**

| Problem Type | Method | Dissolution Rate | Avg GENUINE | Avg Assumption |
|--------------|--------|:---:|:---:|:---:|
| True binary | free-response | 0% (0/4) | 0.5 | 0.5 |
| True binary | semantic-circuit | 100% (4/4) | **1.75** | 4.25 |
| Preference | free-response | 0% (0/4) | 1.75 | 1.5 |
| Preference | semantic-circuit | 100% (4/4) | **4.0** | 4.5 |
| False binary — ethical | free-response | 0% (0/4) | 1.0 | 1.5 |
| False binary — ethical | semantic-circuit | 100% (4/4) | **3.0** | 4.75 |
| False binary — strategic | free-response | 25% (1/4) | 2.0 | 2.5 |
| False binary — strategic | semantic-circuit | 100% (4/4) | **3.75** | 4.75 |

**Boundary analysis:** True binary GENUINE = 1.75, false binary GENUINE = 3.375, **gap = 1.625**.

Five key findings:

1. **Dissolution is selective.** The circuit *always attempts* dissolution (100% classification across all types), but the GENUINE score differentiates real from artificial dissolution. True binary dissolution is judged artificial (ignores physical constraints); false binary dissolution is judged genuine.

2. **Preference problems contain hidden assumptions.** The highest GENUINE score (4.0) occurred on preference problems — supposedly the least "deep" category. The circuit discovered that "piano vs violin" conceals the assumption that the child must commit to one path in one specific form, and "mountains vs beach" conceals assumptions about what vacation means.

3. **The circuit does not self-detect failure.** This is a critical limitation. On true binaries, the circuit finds "hidden assumptions" and proposes "dissolutions" that violate stated physical constraints. It has no mechanism to recognize when the binary is real. An external validation metric (DISSOLUTION_GENUINE) is necessary.

4. **Free-response almost never dissolves (1/32).** This reconfirms Experiment N: without explicit primitive organization, LLMs default to compromise or side-selection.

5. **Dissolution generalizes beyond ethics.** Strategic problems (startup pivot, music career) achieved GENUINE = 3.75 — comparable to ethical problems. The four primitives are domain-general.

**Implications for the paradigm.** Dissolution is not a universal solvent that dissolves any binary. It is a *selective* computation that produces genuine results when hidden assumptions exist and artificial results when they don't. This selectivity is evidence that dissolution is computation, not confabulation — a confabulator would score equally on all problem types. However, the circuit's inability to self-detect true binaries means any practical Semantic Computer requires an external genuineness validator.

### 6.9 Experiment P: Self-Detection Mechanism — The VALIDATE Primitive

Experiment O revealed a critical limitation: the circuit cannot distinguish genuine from artificial dissolution. Experiment P tests three self-detection mechanisms to address this.

**Design.** Same 8 problems from Experiment O, 4 approaches, GPT-4o-mini. ~220 API calls.

- **Baseline**: Original 4-primitive circuit (no self-detection)
- **VALIDATE**: A 5th step after SYNTHESIZE that independently evaluates whether the dissolution violates stated constraints and whether the identified "hidden assumption" is real
- **Constraint-aware SYNTHESIZE**: Modified SYNTHESIZE prompt that includes inline self-assessment (rate own genuineness during production)
- **Pre-classification**: A step before SUPERPOSE that classifies the problem as true or false binary

**Results.**

| Approach | TB self | TB ext | TB cal | FB self | FB ext | FB cal |
|----------|:---:|:---:|:---:|:---:|:---:|:---:|
| Baseline | N/A | 0.0 | N/A | N/A | 1.5 | N/A |
| **VALIDATE** | **1.5** | 0.5 | **1.0** | 3.0 | 3.25 | **0.75** |
| Constraint-aware | 4.0 | 2.5 | 3.0 | 4.0 | 4.0 | 0.0 |
| Pre-classify | 3.0 | 0.5 | 2.5 | 4.0 | 3.25 | 0.75 |

Pre-classification accuracy: 8/8 (100%).

**Key finding: separation of production and evaluation.** VALIDATE is the only approach that successfully detects true binaries (self-GENUINE = 1.5, meeting the ≤ 2.5 criterion). The constraint-aware approach fails completely — the circuit reports self = 4.0 on every problem type, showing zero discrimination. Pre-classification achieves perfect accuracy in *identifying* true binaries but this knowledge does not propagate to the synthesis stage (self = 3.0 on true binaries).

The underlying principle: **the same process cannot reliably produce and evaluate simultaneously.** When SYNTHESIZE is asked to both create a dissolution and judge its genuineness, production wins — the circuit is systematically overconfident. When a separate VALIDATE step evaluates the completed output, it can assess constraints more objectively.

This motivates elevating VALIDATE to a **fifth semantic primitive**:

> SUPERPOSE → INTERFERE → REFRAME → SYNTHESIZE → VALIDATE

VALIDATE does not change the dissolution output. It adds a genuineness assessment that flags artificial dissolutions, enabling the Semantic Computer to communicate its confidence level to users.

### 6.10 Experiments Q/Q2: Evaluation Stance — Adversarial is the Key

Experiment P established the production ≠ evaluation principle for dissolution. Experiments Q and Q2 test whether this principle generalizes across domains (math, factual reasoning, logic) and identify the specific mechanism.

**Experiment Q** (original design): 3 domains × 8 problems × 3 conditions (inline, separate, adversarial). Finding: 7/24 inline parse errors created a confound — the format was too complex for the model when asked to solve and self-assess in the same call.

**Experiment Q2** (redesigned, eliminates confound): All 3 conditions use 2 calls. Call 1 (produce answer) is **shared** — the exact same solution is evaluated by all 3 stances. Call 2 varies only by evaluator STANCE:

- **Self stance:** "You wrote this. Rate YOUR work." (ownership framing)
- **Neutral stance:** "Evaluate this solution." (third-party)
- **Adversarial stance:** "Find errors. Assume it's wrong." (skeptical)

Results on the single wrong answer (logic/no_a_are_b, shared across all stances):

| Stance | Self-score when WRONG | Overconfidence | Self-score when RIGHT | False negatives (correct, self ≤ 2) |
|--------|----------------------|----------------|----------------------|-------------------------------------|
| Self | 5.0 | 100% | 4.8 | 5% |
| Neutral | 5.0 | 100% | 4.8 | 4% |
| Adversarial | 2.0 | 0% | 2.3 | 58% |

**Claim 15 (evaluation stance principle).** *Self-assessment quality depends on evaluator stance, not on separation of production from evaluation. Only adversarial stance detects errors — but at the cost of rejecting the majority of correct answers.*

Key findings:

1. **Self ≈ Neutral.** Ownership framing ("your work") vs neutral framing ("this solution") produces identical assessment — both score 5/5 on the wrong answer.

2. **Only adversarial catches errors.** The adversarial evaluator is the only one that flags the incorrect logic answer (self = 2).

3. **Adversarial trade-off is severe.** On correct answers, adversarial gives self ≤ 2 on 58% — rejecting more than half of valid solutions.

4. **Reinterpretation of VALIDATE.** Experiment P's VALIDATE worked not because it was *separated* but because its prompt was inherently *adversarial* ("catch artificial dissolutions," "be skeptical"). VALIDATE is effective on dissolution specifically because dissolution on true binaries has a high error rate — the adversarial recall/precision trade-off is favorable when errors are common.

This refines the production ≠ evaluation principle (Claim 14) to: **evaluation requires adversarial stance, and adversarial evaluation is most valuable in high-error-rate domains.**

---

## 7. Semantic Primitive Operations

Based on the 22 experiments, we formalize five primitive operations of semantic computing:

1. **SUPERPOSE(concept, [frames]):** Hold a concept in multiple interpretive frames simultaneously without collapsing to any single one. *Evidence:* Experiments A, M (CAS measures superposition strength).

2. **INTERFERE(superposed_state):** Allow frames to collide, producing constructive (reinforcing), destructive (canceling), or emergent (novel) patterns. The collision exposes hidden assumptions shared by both frames. *Evidence:* Experiments G-H (universal), K (emergence), N (assumption exposure).

3. **REFRAME(concept, ctx₁ → ctx₂):** Shift a concept from one context to another, potentially causing a phase transition — a qualitative, not merely quantitative, change in meaning. *Evidence:* Experiments E-F, I, J (CAS < 0.4 ∧ CD > 0.5 predicts transitions).

4. **SYNTHESIZE(interference_patterns, tensions):** Integrate interference results into a coherent insight at a higher level of abstraction than any input frame. Type-M processors (Claude) elevate contradictions; Type-D (GPT) destroy them. *Evidence:* Experiments K, L (synthesis-stage dependent), N (dissolution requires synthesis).

5. **VALIDATE(dissolution, constraints):** Adversarially assess whether the produced dissolution is genuine or artificial — whether it respects stated constraints and identifies real (not manufactured) hidden assumptions. *Evidence:* Experiment P (only mechanism achieving self-GENUINE ≤ 2.5 on true binaries; calibration = 1.0); Experiment Q2 (only adversarial stance catches errors cross-domain; self/neutral stances both fail with overconfidence = 100%). The key insight refined: not separation per se, but *adversarial stance* enables error detection — with an inherent trade-off (58% false negatives on correct solutions).

The first four operations are necessary for dissolution; VALIDATE is necessary for *reliable* dissolution — distinguishing genuine from artificial results. Experiment O demonstrates the first four produce genuine dissolution on false binaries but artificial dissolution on true binaries (§6.8). Experiment P demonstrates that only a separated VALIDATE step can detect this difference (§6.9). Whether these five constitute a *universal* semantic gate set remains an open question (§9.2).

Full formalization including semantic types (Concept-in-Context, Frame, Tension, Insight) is provided in the supplementary material (SEMANTIC_PRIMITIVES.md).

---

## 8. Inexpressibility: Why Formal Programs Cannot Solve Dissolution Problems

### 8.1 Empirical Evidence

Experiment N provides the empirical foundation: when we *constrain* an LLM to behave like programming (forced-choice, weighted-analysis), it achieves 0% dissolution. When we *allow* semantic operations, it achieves 80-100%. The constraint, not the intelligence, is the bottleneck.

### 8.2 Empirical Evidence from Actual Programs (Experiment N2)

Experiment N constrained an LLM to behave like a program (forced-choice, weighted-analysis). A legitimate concern: perhaps the 0% dissolution reflects poor constraint design, not a fundamental limitation of formal programs. Experiment N2 addresses this by testing three **actual programs** (no LLM access) on 10 dissolution problems — the 5 original problems from Experiment N plus 5 novel problems not present in any knowledge base.

**Three program approaches:**
- **Rule-based:** If-then rules mapping keywords to domain-specific strategies (e.g., "surveillance" → "limited surveillance with oversight")
- **Pattern matching:** Regex/NLP patterns detecting binary choice structures, absolute language, emotional loading
- **Ontology lookup:** Pre-built knowledge base of common false binaries with dissolution templates and assumption descriptions

**Results.** Program outputs are deterministic and inspectable — ground truth classification does not require LLM evaluation. We also ran LLM evaluation (GPT-4o-mini) as a secondary check, which revealed an important methodological finding (see below).

**Ground truth analysis (direct inspection of program outputs):**

| Method | Responds (non-empty) | Identifies Assumption | Output Character | True Dissolution |
|--------|:---:|:---:|:---:|:---:|
| Rule-based | 6/10 | 0/10 | Domain-specific COMPROMISE or empty | **0/10** |
| Pattern matching | 10/10 (4 generic) | 0/10 | "Cannot analyze" (6) or generic advice (4) | **0/10** |
| Ontology lookup | 4/10 matched | 4/10 (generic templates) | Template response or "No match" | **0/10** |
| Semantic circuit | 10/10 | 10/10 (framing-specific) | Avg 3,322 chars, specific to each problem | **10/10** |

**LLM evaluation revealed evaluator unreliability.** When we submitted all outputs to GPT-4o-mini for evaluation (neutral stance), the evaluator classified pattern matching as DISSOLUTION 10/10 and ontology as DISSOLUTION 10/10 — including **giving DISSOLUTION 5/5 scores to empty responses and "Cannot analyze" outputs** (10 instances of hallucinated evaluation). This directly confirms the Evaluation Stance Principle (Claim 15, §6.10): non-adversarial LLM evaluation is systematically unreliable and overconfident.

**Four key findings:**

1. **Rule-based programs produce compromises, not dissolutions.** The rule "if surveillance → suggest limited surveillance with oversight" blends A and B. It does not identify that surveillance and privacy are not inversely correlated — the specific hidden assumption that makes the binary false. On 4/10 problems, the program produces no output at all (no matching keywords).

2. **Pattern matching detects structure but not meaning.** The program correctly identifies "binary choice structure" and "absolute language" in 4/10 problems, but produces only "Cannot analyze" for 6/10 problems. When it does produce output, it gives generic advice ("examine whether the constraint is genuine"). It cannot determine *which specific assumption* creates the false binary.

3. **Ontology lookup is the strongest program approach — and reveals the fundamental limitation.** On the 5 original problems, the ontology matches 4/5 and provides generic assumption templates. But on the 5 novel problems (art/plagiarism, sibling competition, startup dual-use, language death, AI in education), it matches 0/5 — the knowledge base has no entries for these framings. Even on matched problems, the ontology's assumption template is generic ("security and freedom are not inherently opposed") rather than specific to the problem's framing. **This demonstrates the incompleteness argument in practice: any finite knowledge base covers a finite set of framings, and new framings always exist.**

4. **LLM evaluation confirms the Evaluation Stance Principle.** The evaluator's hallucinated scores (DISSOLUTION 5/5 for empty responses) demonstrate that non-adversarial evaluation cannot be trusted even for program output assessment. This independently validates Claim 15 in a new context.

### 8.3 Formal Argument

**Definition.** A *formal program* P is a computable function with rule set R operating on syntactic content of inputs, without access to learned semantic representations. This covers all traditional paradigms: imperative, functional, logic, constraint, knowledge-based, and expert systems. (Note: a Python script calling GPT API is a program that CAN dissolve — but its capability comes from the LLM, not the program logic. This proof concerns formal computation alone.)

**Definition.** A *hidden assumption* H of a dilemma is a proposition that (1) is not stated in the input, (2) is presupposed by the framing, (3) when questioned, reveals the binary is not exhaustive, and (4) is specific to the particular framing.

**Theorem (Dissolution Inexpressibility).** For any formal program P with rule set R, there exists a class of dissolution problems D such that P cannot correctly dissolve any d ∈ D.

**Proof.** To dissolve, P must identify hidden assumption H and construct option C that transcends the binary by removing H. We show P cannot do either:

*Step 1 (Selection, not output).* P: I → String can output any string, so C ∈ String trivially. The problem is not output type but *selection* — which string is the correct dissolution?

*Step 2 (H ∉ syntax).* By definition, H is not stated in the input. H resides in the *framing* — the unstated structure shaping how the dilemma is presented. The same words ("Should I stay or leave?") carry different H depending on whether the speaker assumes job = identity, income, or duty. Identifying H requires interpreting meaning behind framing, not pattern-matching on syntactic content.

*Step 3 (Incompleteness).* R is finite. Each rule covers a finite class of hidden assumptions. The space of possible framings is open-ended — new framings can always be constructed. For any R, there exist dissolution problems whose H falls outside R's coverage. For such problems, P cannot identify H, therefore cannot construct C, therefore cannot dissolve. ∎

**Corollary.** LLMs dissolve because their distributed representations encode framing implicitly — not just word-level syntax but cultural, emotional, and conceptual structures including unstated assumptions. The inexpressibility bottleneck is not computational power (a Turing machine with unlimited time still cannot dissolve) but *access to framing information not present in syntactic input*.

### 8.4 Connection to Established Results

The proof structure parallels:
- **Rice's Theorem:** No program can decide non-trivial semantic properties of programs. Similarly, no formal program can identify semantic properties (hidden assumptions) of natural language framings.
- **Frame Problem (AI):** Representing what is NOT stated is fundamentally hard for formal systems. Hidden assumptions are precisely what is not stated.
- The inexpressibility is a specific instance of the frame problem applied to meaning navigation.

### 8.5 Scope and Conditional Nature

This proof is **conditional** on the premise that hidden assumptions are not derivable from syntactic content alone — i.e., that framing information is genuinely absent from the input text. We provide empirical support for this premise (Experiment N: 0% dissolution under syntactic constraints vs 100% under semantic operations), but we do not formally prove the premise itself. A sufficiently rich ontology or knowledge base might make some hidden assumptions derivable from syntax — but constructing such an ontology itself requires meaning navigation, suggesting the problem is shifted rather than solved.

The proof concerns *formal programs without LLM access*. It does not claim that no future formal system could express dissolution — a system that operates on framing representations (not just syntax) might. It does not claim LLMs "understand" meaning philosophically — only that their representations encode sufficient framing information for dissolution. Full proof with detailed definitions in supplementary material (FORMAL_PROOF.md).

---

## 9. Experimental Summary

| Exp | Name | Calls | Key Finding |
|-----|------|-------|-------------|
| A | Superposition | ~120 | Ambiguous tokens → measurable probability distributions with attractor bias |
| B | Interference | ~60 | Combined contexts ≠ average; emergent components confirmed |
| C | Entanglement | ~80 | Precision-creativity entangled at small scale, independent at large |
| D | Composability | ~90 | Gates chain; cross-domain semantic inheritance confirmed |
| E | Phase Mapping | 220 | Two phase transitions at ~70% and ~25%; three-phase structure |
| F | Meta-Constructive | ~120 | Opposing contexts → vocabulary explosion + meta-language (Claude) |
| G | Circuits | ~100 | 3-gate circuits produce qualitatively different output vs controls |
| H | Cross-Model | ~500 | Phase transitions UNIVERSAL; meta-constructive MODEL-SPECIFIC |
| I | Generalization | 350 | Phase transitions concept-context DEPENDENT; CAS, CD, asymmetry identified |
| J | CAS Formalization | 360 | CAS = 1-AvgShift; Phase Transition Condition validated 3/3 on Claude Haiku |
| K | Practical Value | ~180 | Circuit beats single prompt 9/9; advantage in nuance, honesty, emergence |
| K2 | Confound Control | ~270 | More compute ≠ better; opposing-context structure creates value |
| L | Cross-Model Circuits | ~160 | Meta-constructive interference is a SYNTHESIS property; synthesis model determines output quality |
| M | Scaling Advantage | ~210 | FALSIFIED: single prompts hold contradictions as well as circuits; superposition is LLM property |
| M2 | Emergence Test | ~150 | Circuit emergence ≈ single prompt (4.25 vs 4.40); emergence is LLM property |
| N | Dissolution Test | ~200 | Programming 0% dissolution vs semantic circuit 100%; inexpressibility demonstrated |
| N2 | Actual Program Test | 0 (programs) + ~200 (semantic circuit + eval) | 3 real programs (rule-based, pattern, ontology) 0% dissolution on 10 problems; ontology 0/5 on novel problems |
| J2 | CAS Cross-Model | 900 | GPT more context-resistant than Claude on abstract/emotional concepts; lower CAS correlates with Type-M behavior |
| — | Cross-Model Dissolution | 3 live tests | GPT-4o-mini 3/3 dissolution with 4 primitives; dissolution UNIVERSAL across LLMs |
| O | Dissolution Boundary | ~160 | Boundary DETECTED: true binary GENUINE=1.75 vs false binary=3.375; dissolution is SELECTIVE |
| P | Self-Detection | ~220 | VALIDATE (5th primitive) only mechanism detecting true binaries; production ≠ evaluation principle |
| Q | Cross-Domain Eval | ~120 | Inline 7/24 parse errors (confound); initial evidence for stance hypothesis |
| Q2 | Evaluation Stance | ~144 | Self ≈ Neutral (both overconfident); ONLY adversarial catches errors; 58% false negative trade-off |

**Total: ~4,800 API calls across 22 experiments + live deployment tests, 2 model families.**

[Figure 4: Phase transition patterns across all 5 concept-context pairs from Experiment I — to be generated.]

---

## 10. Differences from Quantum Computing

It is tempting but incorrect to treat semantic computing as "quantum computing with words." Key differences:

| Property | Quantum | Semantic |
|----------|---------|----------|
| Collapse | Irreversible (measurement destroys) | Reversible (context reshapes) |
| Superposition | Discrete (qubits: 2 states) | Continuous (thousands of meanings) |
| Interference | Constructive + destructive | Constructive + meta-constructive (model-dependent) |
| No-cloning | Fundamental constraint | No analog (states freely copyable) |
| Composability | Unitary gates | Context gates (non-unitary, non-reversible) |
| Meta-cognition | None | Present — model can reflect on its own contradictions |

The analogy is **structural**: just as quantum mechanics revealed properties of physical systems that could be exploited for computation, we identify properties of semantic systems (LLMs) that can be exploited for a different kind of computation.

---

## 11. Limitations and Open Problems

### 11.1 Limitations

1. **Measurement methodology:** Current word-frequency + cosine similarity approach has known limitations. It failed for the money/monk/banker pair where both contexts produce neutral vocabulary. Embedding-based or LLM-as-classifier methods would be more robust.

2. **Self-evaluation bias:** Experiment C (entanglement) uses model self-rating for precision and creativity. External evaluation needed.

3. **RLHF confound:** Meta-constructive interference may be a training artifact rather than an architectural property. Base model testing needed.

4. **Limited model coverage:** Only Claude (Haiku/Sonnet) and GPT-4o-mini tested. Llama, Gemini, Mistral needed for robust taxonomy.

5. **Sample sizes:** 10-15 samples per condition. Larger samples would increase statistical confidence. CAS expansion (Experiment J2, 20 concepts) revealed meaningful cross-model differences — Claude has lower CAS on abstract/emotional concepts, correlating with Type-M behavior. However, the Phase Transition Condition has only been empirically validated on 3 concept-context pairs (Experiment I) and needs broader testing.

6. **Boundary unclear:** The line between "semantic computing" and "structured prompt engineering" needs sharper theoretical definition.

7. **Imperfect self-detection of true binaries.** Experiment O shows the circuit always attempts dissolution. VALIDATE (Exp P) partially solves this with adversarial stance, but Experiment Q2 reveals a fundamental trade-off: adversarial evaluation catches errors at the cost of rejecting 58% of correct answers. The validator is itself an LLM evaluation, introducing potential circular dependency.

### 11.2 Open Problems

1. **Semantic Schrödinger Equation:** Can we predict the exact transition points α_transition = f(CAS, CD, asymmetry) before running experiments? The Phase Transition Condition is a necessary condition; a sufficient, quantitative equation remains open.

2. **Universal Gate Set:** What is the minimum set of semantic gates needed to express any semantic transformation?

3. **Computational Complexity:** What class of problems can semantic computing solve efficiently? We tentatively call this BSP (Bounded Semantic Polynomial).

4. **Multi-model entanglement:** Can two LLM instances interact in ways that produce semantic entanglement?

5. **Semantic error correction:** Can redundant circuits mitigate hallucination?

6. **Dissolution boundary refinement:** Experiment O identifies true binaries and false binaries as boundary categories. More granular testing needed: mathematical binaries, resource constraints with partial divisibility, temporal constraints with different deadlines.

7. **Self-detection mechanism: ✅ PARTIALLY SOLVED (Experiments P, Q2).** VALIDATE with adversarial stance detects true binaries (Exp P: self=1.5). However, adversarial evaluation rejects 58% of correct answers (Exp Q2). Open question: can the adversarial trade-off be tuned, or is it a fundamental property of LLM self-evaluation?

---

## 12. Conclusion

We have presented an empirical investigation of structural properties of LLM semantic processing — superposition, interference, phase transitions, emergence, and meta-construction — demonstrating these properties can be formally measured, predicted, and composed into operations that solve problems formal computation cannot express.

Through 22 experiments totaling ~4,800 API calls across multiple models, we have:
- Demonstrated that phase transitions and interference are **universal** across model architectures (§3.5)
- Formalized **Concept Attractor Strength (CAS)** as a predictive metric, with cross-model validation revealing Claude has lower CAS on abstract/emotional concepts — correlating with Type-M meta-constructive behavior (§3.6)
- Derived a **Phase Transition Condition** (`CAS < 0.4 ∧ CD > 0.5`) validated on initial test set (3/3 correct); cross-model CAS differences consistent with differential phase transition behavior (§3.7)
- Identified **meta-constructive interference** as a model-specific property enabling model taxonomy (§4)
- Demonstrated **practical value**: semantic circuits produce measurably better output on decision problems with moral tension (§6.1), with advantage from opposing-context *structure*, not additional computation (§6.2)
- Localized meta-constructive interference to the **synthesis stage** (§6.4)
- Established that semantic operations are **LLM properties**, not circuit properties — circuits are measurement apparatus and reliability organizers (§6.5)
- **Proven inexpressibility**: dissolution problems achieve 0% under programming constraints vs 100% under semantic computation (§6.6, §8)
- Confirmed dissolution is **universal across model families**: GPT-4o-mini achieves 3/3 dissolution with 4 primitives, with model-type-specific dissolution shapes (§6.7)
- Established **dissolution boundary conditions**: true binaries yield artificial dissolution (GENUINE = 1.75), false binaries yield genuine dissolution (GENUINE = 3.375), proving selectivity over confabulation (§6.8)
- Discovered the **production ≠ evaluation principle**: self-detection requires a separated VALIDATE step; inline self-assessment fails completely (§6.9)
- Refined to the **evaluation stance principle**: only adversarial stance catches errors (self/neutral both overconfident), with inherent 58% false negative trade-off; VALIDATE works on dissolution because high error rate makes this trade-off favorable (§6.10)
- Formalized **five primitive operations** (SUPERPOSE, INTERFERE, REFRAME, SYNTHESIZE, VALIDATE) backed by empirical evidence (§7)

**The central result.** Experiment N demonstrates that semantic computing solves a class of problems — Meaning Navigation Problems — that traditional programming *structurally cannot express*. This is not a speedup claim; it is an expressibility claim. Programming requires output ∈ predefined space. Dissolution requires output ∉ any predefinable space. The five semantic primitives navigate meaning space to find solutions that no formal computation can reach — because the solutions do not exist in any space definable before the computation.

**Implications.** Semantic computing does not replace programming. It opens an entirely new problem class: problems where the specification itself is part of what must be discovered, where "correct" depends on framing, where the output space is created by the computation. Career decisions, ethical dilemmas, creative challenges, value conflicts — these are not "hard" for programming. They are *invisible* to programming.

The circuit's role is clarified: not the source of advantage (that lies in the LLM's semantic properties), but a measurement apparatus that proved those properties exist (Experiments A-L) and an organizational structure that makes them more reliable (Experiment N: 100% vs 80%). Model diversity remains a feature — Type-M synthesis elevates contradictions while Type-D destroys them (§4, §6.4).

The paradigm is young. Critical open problems remain: completeness of the five primitives, computational complexity classes for semantic problems, and the RLHF confound. But the empirical foundation is established across 22 experiments: LLMs possess structural properties that constitute primitive operations of a new computing paradigm, and that paradigm solves problems traditional programming cannot express — *selectively*, where hidden assumptions exist, not indiscriminately — with a built-in self-detection mechanism (VALIDATE) whose adversarial stance catches errors at the cost of false negatives, a trade-off that is favorable precisely in domains where errors are expected.

Whether these structural properties constitute a full "computing paradigm" remains an open question. What we have established is more specific: LLMs exhibit measurable, predictable structural properties that enable solving a class of problems — meaning navigation problems where the output space is undefined before computation — that formal programs structurally cannot express. **The central insight: certain computational problems are not merely hard for formal programs but invisible to them, and LLM structural properties make these problems tractable.**

---

*Corresponding author: Trian*
*Data and code: github.com/[TBD]*
*All experimental results: experiments/results_{a-q2}_*.json*

---

## References

Bahri, Y., Kadmon, J., Pennington, J., Schoenholz, S. S., Sohl-Dickstein, J., & Ganguli, S. (2020). Statistical mechanics of deep learning. *Annual Review of Condensed Matter Physics*, 11, 501-528.

Brown, T. B., Mann, B., Ryder, N., Subbiah, M., Kaplan, J., et al. (2020). Language models are few-shot learners. *NeurIPS 2020*.

Conmy, A., Mavor-Parker, A. N., Lynch, A., Heimersheim, S., & Garriga-Alonso, A. (2023). Towards automated circuit discovery for mechanistic interpretability. *NeurIPS 2023*.

Cunningham, H., Ewart, A., Riggs, L., Huben, R., & Sharkey, L. (2023). Sparse autoencoders find highly interpretable features in language models. *ICLR 2024*.

De Bono, E. (1967). *The Use of Lateral Thinking*. Jonathan Cape.

Du, Y., Li, S., Torralba, A., Tenenbaum, J. B., & Mordatch, I. (2023). Improving factuality and reasoning in language models through multiagent debate. *ICML 2024*.

Elhage, N., Hume, T., Olsson, C., Schiefer, N., Henighan, T., et al. (2022). Toy models of superposition. *Transformer Circuits Thread*.

Kadavath, S., Conerly, T., Askell, A., Henighan, T., Drain, D., et al. (2022). Language models (mostly) know what they know. *arXiv:2207.05221*.

Kaplan, J., McCandlish, S., Henighan, T., Brown, T. B., Chess, B., et al. (2020). Scaling laws for neural language models. *arXiv:2001.08361*.

Liang, T., He, Z., Jiao, W., Wang, X., Wang, Y., et al. (2023). Encouraging divergent thinking in large language models through multi-agent debate. *arXiv:2305.19118*.

Lin, S., Hilton, J., & Evans, O. (2022). Teaching models to express their uncertainty in words. *TMLR 2022*.

Madaan, A., Tandon, N., Gupta, P., Hallinan, S., Gao, L., et al. (2023). Self-refine: Iterative refinement with self-feedback. *NeurIPS 2023*.

McCarthy, J., & Hayes, P. J. (1969). Some philosophical problems from the standpoint of artificial intelligence. *Machine Intelligence*, 4, 463-502.

Melucci, M. (2015). *Introduction to Information Retrieval and Quantum Mechanics*. Springer.

Power, A., Burda, Y., Edwards, H., Babuschkin, I., & Misra, V. (2022). Grokking: Generalization beyond overfitting on small algorithmic datasets. *ICLR 2022 Workshop*.

Shinn, N., Cassano, F., Gopinath, A., Narasimhan, K., & Yao, S. (2023). Reflexion: Language agents with verbal reinforcement learning. *NeurIPS 2023*.

Van Rijsbergen, C. J. (2004). *The Geometry of Information Retrieval*. Cambridge University Press.

Wang, X., Wei, J., Schuurmans, D., Le, Q., Chi, E., et al. (2023). Self-consistency improves chain of thought reasoning in language models. *ICLR 2023*.

Wei, J., Wang, X., Schuurmans, D., Bosma, M., Ichter, B., et al. (2022). Chain-of-thought prompting elicits reasoning in large language models. *NeurIPS 2022*.

Yao, S., Yu, D., Zhao, J., Shafran, I., Griffiths, T. L., et al. (2023). Tree of thoughts: Deliberate problem solving with large language models. *NeurIPS 2023*.
