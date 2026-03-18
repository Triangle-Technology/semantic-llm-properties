# Formal Inexpressibility Proof — Dissolution Problems in Classical Computation

## Definitions

**Definition 1 (Formal Program).** A formal program P is a computable function P: I → O where:
- I is the input space, definable before execution
- O is the output space, definable before execution
- P is implementable as a finite set of rules R operating on **syntactic content** of inputs
- P does NOT have access to learned semantic representations (neural networks trained on natural language)

The critical constraint: P operates on **what is stated** in the input (syntactic content, data values, structural patterns). P cannot operate on what is **not stated** — what the input assumes, implies, or takes for granted — except insofar as those assumptions are derivable from syntactic content via rules in R.

**Note on scope:** A Python script calling GPT API is a program that CAN dissolve — but its dissolution capability comes from the LLM, not from the program logic. This proof concerns what is expressible in **formal computation alone** (algorithms, rules, data structures) without access to learned semantic representations. The distinction is analogous to: a classical computer simulating a quantum algorithm is still classical computation — the quantum advantage lies in the quantum processor, not the classical wrapper.

**Definition 2 (Dissolution Problem).** A dissolution problem D = (dilemma, constraints) where:
- dilemma presents two options {A, B} framed as exhaustive
- constraints are stated conditions that must be respected
- A correct dissolution C must:
  - (C1) Not select A or B or any weighted combination
  - (C2) Identify a hidden assumption H in the dilemma's framing
  - (C3) Construct an option that transcends {A, B} by removing or reframing H
  - (C4) Respect all stated constraints

**Definition 3 (Hidden Assumption).** A hidden assumption H of a dilemma is a proposition that:
- (H1) Is not stated in the dilemma
- (H2) Is presupposed by the framing as obviously true
- (H3) When questioned, reveals that {A, B} is not exhaustive
- (H4) Is specific to the particular framing — different framings of the "same" dilemma may have different H

**Definition 4 (Framing).** The framing of a dilemma is the set of implicit structures that shape how the problem is presented: which dimensions are foregrounded, which assumptions are treated as given, which options are made visible. Two dilemmas may share identical stated content but differ in framing.

## Theorem

**Theorem (Dissolution Inexpressibility).** For any formal program P (Definition 1) with rule set R, there exists a class of dissolution problems D such that P cannot correctly dissolve any d ∈ D.

## Proof

**Step 1: The Selection Problem.**

Suppose P: I → String. P can output any string, so C ∈ String trivially. The question is not whether P's output TYPE can contain C, but whether P can SELECT the correct C for an arbitrary dissolution problem.

To select C, P must:
1. Identify the hidden assumption H (by Definition 2, C2)
2. Construct an option that removes/reframes H (by Definition 2, C3)

**Step 2: Hidden Assumptions Are Not in Syntactic Content.**

By Definition 3 (H1), H is not stated in the dilemma. By (H2), H is presupposed — it shapes the framing but does not appear as data.

A program P operates on syntactic content via rules R. To identify H, P would need a rule r ∈ R that maps syntactic patterns to the specific hidden assumption. But:

- Each dissolution problem has a **unique H** determined by its specific framing (Definition 3, H4)
- Framings are not syntactically marked — the same words can carry different framings (e.g., "Should I stay in my job or leave?" has different hidden assumptions depending on whether the speaker assumes job = identity, job = income, or job = duty)
- Therefore, identifying H requires interpreting the **meaning behind the framing**, not the syntactic content of the statement

**Step 3: The Incompleteness Argument.**

R is a finite set of rules. Each rule r_i ∈ R maps a class of syntactic patterns to a class of responses. R can cover at most |R| classes of hidden assumptions.

But hidden assumptions arise from human conceptual framing, which is:
- Open-ended: new framings can always be constructed
- Context-dependent: the same words yield different H in different contexts
- Not enumerable from syntax alone: H depends on what is ABSENT (unstated), not what is PRESENT (stated)

For any R, construct D_R: a set of dilemmas whose hidden assumptions fall outside the coverage of R. Since R is finite and the space of framings is open-ended, D_R is non-empty.

For any d ∈ D_R, P cannot identify H (no matching rule), therefore cannot construct C (which requires H), therefore cannot dissolve d. ∎

## Corollary

**Corollary (Why LLMs Can Dissolve).** An LLM does not operate via finite rule set R on syntactic content. It operates on **distributed representations of meaning** — high-dimensional vectors encoding semantic relationships including implicit framing, connotation, and presupposition. When an LLM processes "Should I stay or leave my job?", its representation encodes not just the words but the cultural, emotional, and conceptual frame around them — including the unstated assumption that these are the only options.

This is why:
- Programming achieves 0% dissolution (Experiment N): constrained to operate on stated content
- Semantic computation achieves 80-100% dissolution (Experiments N, O): operates on meaning, including unstated framing
- Dissolution is selective (Experiment O): true binaries (physical constraints) have no hidden framing assumptions to discover, so dissolution produces artificial results

The inexpressibility is not about computational power. A Turing machine with unlimited time cannot dissolve a dilemma any better than a finite program — because the bottleneck is not computation but **access to framing information that is not in the syntactic input**. LLMs have this access because their training on human language encodes framing implicitly.

## Scope and Limitations

This proof establishes inexpressibility for **formal programs** (Definition 1) — programs operating on syntactic content without access to learned semantic representations. This includes all traditional programming paradigms (imperative, functional, logic, constraint, knowledge-based systems, expert systems, ontology-driven reasoning). It does NOT claim:

- That no future formal system could express dissolution (a new formal system that operates on framing, not just content, might)
- That LLMs "understand" meaning in a philosophical sense (only that their representations encode sufficient framing information)
- That ALL problems requiring meaning navigation are inexpressible (dissolution is one specific class)

**Conditional nature.** This proof is conditional on the premise that hidden assumptions are not derivable from syntactic content alone. This premise is empirically supported (Experiment N: 0% dissolution under syntactic constraints vs 100% under semantic operations) but is not itself formally proven. A sufficiently rich ontology or knowledge base might make some hidden assumptions derivable — but this shifts the problem to: who builds the ontology? That construction itself requires meaning navigation. We therefore characterize this as an **inexpressibility argument conditional on an empirically supported premise**, not an unconditional proof.

## Connection to Established Results

The structure parallels other inexpressibility results:

1. **Rice's Theorem:** No program can decide non-trivial semantic properties of programs. Similarly, no program can identify semantic properties (hidden assumptions) of natural language framings.

2. **Frame Problem (AI):** Representing what does NOT change (or what is NOT stated) is fundamentally hard for formal systems. Hidden assumptions are precisely what is NOT stated — making dissolution a specific instance of the frame problem applied to meaning.

3. **Searle's Chinese Room (modified):** The argument is not about consciousness but about access — a symbol manipulator operating on syntax does not have access to the framing information that dissolution requires, regardless of how sophisticated its rules.

---

*This proof provides the formal basis for Claim 8 (§8) and is supported by empirical evidence from Experiments N (0% vs 100%), O (boundary selectivity), and P/Q2 (evaluation stance).*
