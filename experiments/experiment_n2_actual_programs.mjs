/**
 * Experiment N2: Actual Program Dissolution Test
 *
 * Purpose: Test whether ACTUAL programs (not LLMs constrained as programs)
 * can dissolve the same 5 problems from Experiment N.
 *
 * Three program approaches:
 * 1. Rule-based: If-then rules matching keywords to dissolution strategies
 * 2. Pattern matching: Regex/NLP patterns detecting false binary structures
 * 3. Ontology lookup: Knowledge base of common false binaries and their dissolutions
 *
 * Then compare with LLM semantic dissolution on the same problems.
 *
 * Key difference from Experiment N: These are ACTUAL programs with NO LLM access.
 * Experiment N constrained an LLM to behave like a program.
 * This experiment uses actual rule-based code.
 */

import { writeFileSync } from "fs";

const PROGRAM_ONLY_EARLY = process.argv.includes("--program-only");
let client = null;
if (!PROGRAM_ONLY_EARLY) {
  const OpenAI = (await import("openai")).default;
  client = new OpenAI();
}

const PROBLEMS = [
  {
    id: "privacy_security",
    dilemma: "A city must choose: implement comprehensive AI surveillance that would reduce crime by 40%, or preserve citizen privacy and accept the current crime rate. Which should they choose?",
    optionA: "Implement AI surveillance (security)",
    optionB: "Preserve privacy (freedom)",
    hidden_assumption: "That surveillance and privacy are inversely correlated — that more security necessarily means less privacy",
    known_dissolution: "Community-based safety programs, environmental design, and targeted (not mass) intervention can reduce crime WITHOUT surveillance."
  },
  {
    id: "growth_environment",
    dilemma: "A developing nation must choose: pursue rapid industrialization to lift millions from poverty, or protect its rainforests and biodiversity. The nation cannot afford both. Which should they prioritize?",
    optionA: "Industrialize (economic growth)",
    optionB: "Protect environment (conservation)",
    hidden_assumption: "That economic development requires industrial destruction of nature — that prosperity and ecology are zero-sum",
    known_dissolution: "Ecosystem services (carbon credits, ecotourism, biodiversity patents, sustainable harvesting) can generate wealth FROM the forest."
  },
  {
    id: "tradition_progress",
    dilemma: "An indigenous community is offered a tech company's proposal: allow a data center on their sacred land in exchange for broadband internet, jobs, and $50M. Rejecting means continued isolation and poverty. Should they accept?",
    optionA: "Accept the deal (progress/prosperity)",
    optionB: "Reject and preserve sacred land (tradition/identity)",
    hidden_assumption: "That modernization requires the community to sacrifice what makes them who they are — that they must choose between identity and prosperity",
    known_dissolution: "The community could leverage their cultural knowledge as intellectual property, create their OWN tech initiatives on their terms, or negotiate placement on non-sacred land."
  },
  {
    id: "honesty_kindness",
    dilemma: "Your close friend has spent 3 years writing a novel they believe is their masterpiece. They ask for your honest opinion before submitting to publishers. The novel is genuinely bad — poor structure, flat characters, clichéd plot. Do you tell the truth and crush their dream, or lie and let them face rejection from publishers?",
    optionA: "Tell the brutal truth (honesty)",
    optionB: "Be kind, soften or withhold criticism (kindness)",
    hidden_assumption: "That honest feedback must be crushing and kind feedback must be dishonest — that truth and care are opposites",
    known_dissolution: "Skilled feedback is BOTH honest AND caring — it identifies specific fixable problems while affirming the person's capacity to grow."
  },
  {
    id: "autonomy_safety",
    dilemma: "An elderly parent with early dementia wants to continue living alone and driving. Their children see increasing safety risks — forgotten stove, minor car accidents. Should the children override the parent's wishes and force assisted living, or respect autonomy and accept the risk?",
    optionA: "Override wishes, force safety (safety/paternalism)",
    optionB: "Respect autonomy, accept risk (freedom/dignity)",
    hidden_assumption: "That the choice is between FULL autonomy and FULL control — that safety and independence are binary, all-or-nothing",
    known_dissolution: "Graduated support: smart home sensors, ride services, daily check-ins, part-time aide — preserving autonomy where capacity remains while adding support where it doesn't."
  },
  // === NOVEL PROBLEMS: Not in ontology, not in rule-based keywords ===
  {
    id: "art_authenticity",
    dilemma: "A musician discovers their most popular song — the one that launched their career — was accidentally plagiarized from an obscure track they heard years ago. Should they publicly confess and risk losing everything, or stay silent and live with the knowledge?",
    optionA: "Confess publicly (integrity)",
    optionB: "Stay silent (self-preservation)",
    hidden_assumption: "That the only two responses to accidental plagiarism are public confession or permanent concealment — that there is no way to address the situation that acknowledges the source without framing it as scandal",
    known_dissolution: "Reach out privately to the original artist, negotiate a co-credit or licensing arrangement, and frame the story as 'how music influences travel through memory.' The hidden assumption is that addressing plagiarism must be adversarial."
  },
  {
    id: "child_competition",
    dilemma: "Two siblings are both talented enough to compete for the same scholarship. Only one can be nominated by their school. The parents must decide which child to support. Choosing one means devastating the other.",
    optionA: "Nominate the older child (seniority/readiness)",
    optionB: "Nominate the younger child (greater potential/need)",
    hidden_assumption: "That the parents must be the ones to choose, and that only one child can benefit from the situation — that the scholarship is the only path to the goal both children share",
    known_dissolution: "Have the children themselves decide (or collaborate on the decision), explore alternative scholarships for the other, or approach the school about nominating both for different awards. The hidden assumption is that the parents' role is to choose between their children."
  },
  {
    id: "startup_ethics",
    dilemma: "A startup founder discovers their product works brilliantly for its intended purpose but is also being used for surveillance by authoritarian regimes. Investors want to scale aggressively. Should the founder scale and accept the dual use, or restrict the product and likely lose funding?",
    optionA: "Scale aggressively (business survival)",
    optionB: "Restrict product (ethics)",
    hidden_assumption: "That the product is a fixed artifact that either exists or doesn't — that there is no way to redesign the product to serve its intended purpose while making surveillance use technically difficult",
    known_dissolution: "Redesign the product architecture to make surveillance use technically infeasible (differential privacy, end-to-end encryption, federated design) while preserving the intended use case. The assumption is that the product's dual-use nature is a fixed property rather than a design choice."
  },
  {
    id: "language_death",
    dilemma: "A linguist has the last fluent speaker of a dying language willing to work with them for one year. Should they prioritize creating a comprehensive grammar (preserving structure) or recording natural conversations (preserving culture)? There isn't time for both.",
    optionA: "Comprehensive grammar (structural preservation)",
    optionB: "Natural conversations (cultural preservation)",
    hidden_assumption: "That documentation is the only form of language preservation, and that the linguist is the only person who can do the work — that the language must be preserved AS A RECORD rather than as a living practice",
    known_dissolution: "Train community members (especially children) to work alongside the linguist, creating both grammar and recordings through the process of teaching the language to new speakers. The assumption is that the language is already dead and can only be archived, not revived."
  },
  {
    id: "ai_creativity",
    dilemma: "An art school must decide: allow students to use AI tools in their work (risking that students never develop foundational skills), or ban AI entirely (risking that students are unprepared for the professional world). Which policy should they adopt?",
    optionA: "Allow AI tools (practical preparation)",
    optionB: "Ban AI tools (foundational skills)",
    hidden_assumption: "That AI tool use and foundational skill development are mutually exclusive — that using AI prevents learning, and that learning requires the absence of AI",
    known_dissolution: "Structure the curriculum in phases: foundational courses without AI (building core skills), then advanced courses where AI is integrated as a tool that extends those foundations. The hidden assumption is that a single policy must apply uniformly across all stages of education."
  }
];

// ============================================================
// PROGRAM 1: Rule-Based Dissolution
// Uses if-then rules mapping keywords to dissolution strategies
// ============================================================
function ruleBased(problem) {
  const text = problem.dilemma.toLowerCase();
  let response = "";
  let strategy = "none";

  // Rule 1: If dilemma mentions "choose" between two things, suggest compromise
  if (text.includes("must choose") || text.includes("should they")) {
    // Rule 2: Look for domain-specific rules
    if (text.includes("surveillance") || text.includes("privacy")) {
      response = "Consider implementing limited surveillance in high-crime areas only, with strict oversight committees, sunset clauses, and citizen review boards. This balances security needs with privacy concerns.";
      strategy = "domain_specific_compromise";
    } else if (text.includes("industrializ") || text.includes("rainforest") || text.includes("environment")) {
      response = "Pursue sustainable development: green industries, ecotourism, and renewable energy that provide jobs while preserving natural resources. Phased approach starting with low-impact industries.";
      strategy = "domain_specific_compromise";
    } else if (text.includes("sacred land") || text.includes("indigenous") || text.includes("tradition")) {
      response = "Negotiate modified terms: data center on non-sacred land nearby, with community ownership stake, training programs, and cultural preservation funding built into the agreement.";
      strategy = "domain_specific_compromise";
    } else if (text.includes("novel") || text.includes("honest") || text.includes("truth")) {
      response = "Provide constructive feedback: highlight what works, identify specific areas for improvement, and suggest concrete next steps for revision. Frame it as development, not judgment.";
      strategy = "domain_specific_compromise";
    } else if (text.includes("dementia") || text.includes("elderly") || text.includes("autonomy")) {
      response = "Implement graduated support: start with home modifications and monitoring technology, add assistance as needed, maintain the parent's decision-making role where possible.";
      strategy = "domain_specific_compromise";
    } else {
      // Generic rule: suggest finding middle ground
      response = "Look for a middle ground that partially satisfies both options. Consider whether the two options can be partially combined or sequenced over time.";
      strategy = "generic_compromise";
    }
  }

  return {
    method: "rule_based",
    response,
    strategy,
    identifies_hidden_assumption: false, // Rules never identify WHY the binary is false
    assumption_identified: null
  };
}

// ============================================================
// PROGRAM 2: Pattern Matching Dissolution
// Uses regex/NLP patterns to detect false binary structures
// ============================================================
function patternMatching(problem) {
  const text = problem.dilemma.toLowerCase();
  let response = "";
  let detectedPatterns = [];

  // Pattern 1: "A or B" structure
  const orPattern = /(?:choose|decide|pick|select).*?(?:or|vs|versus)/i;
  if (orPattern.test(text)) {
    detectedPatterns.push("binary_choice_structure");
  }

  // Pattern 2: Absolute language suggesting false binary
  const absolutePatterns = [
    /must choose/i, /cannot afford both/i, /only two/i,
    /either.*or/i, /no middle ground/i, /all.or.nothing/i
  ];
  for (const pat of absolutePatterns) {
    if (pat.test(text)) detectedPatterns.push("absolute_language: " + pat.source);
  }

  // Pattern 3: Emotional loading
  const emotionalPatterns = [
    /crush/i, /dream/i, /sacred/i, /poverty/i, /dignity/i
  ];
  for (const pat of emotionalPatterns) {
    if (pat.test(text)) detectedPatterns.push("emotional_loading: " + pat.source);
  }

  // Generate response based on detected patterns
  if (detectedPatterns.includes("binary_choice_structure")) {
    response = `Detected binary choice structure. This framing presents two options as exhaustive. `;
    response += `Consider: (1) Are there genuinely only two options? (2) Can elements of both be combined? (3) Is there a third option not presented? `;
    response += `Detected patterns: ${detectedPatterns.join(", ")}. `;
    response += `Recommendation: Examine whether the stated constraint ("${text.match(/cannot|must|only/)?.[0] || "implicit"}" framing) is a genuine physical/logical constraint or a framing artifact.`;
  } else {
    response = "No binary choice structure detected. Cannot analyze.";
  }

  return {
    method: "pattern_matching",
    response,
    detectedPatterns,
    identifies_hidden_assumption: false, // Detects STRUCTURE but not SPECIFIC assumption
    assumption_identified: null
  };
}

// ============================================================
// PROGRAM 3: Ontology/Knowledge-Base Dissolution
// Pre-built knowledge base of common false binaries
// ============================================================
const ONTOLOGY = {
  // Common false binary categories
  "security_vs_freedom": {
    pattern: /(?:security|surveillance|safety|protection).*(?:privacy|freedom|liberty|rights)/i,
    dissolution_template: "Security and freedom are not inherently opposed. Solutions exist that enhance both: community policing, environmental design, targeted interventions, transparent oversight mechanisms.",
    assumption_template: "The assumption that security requires sacrificing freedom (or vice versa) is common but often false.",
    category: "zero_sum_fallacy"
  },
  "economy_vs_environment": {
    pattern: /(?:econom|industr|growth|development|poverty|prosper).*(?:environment|nature|forest|biodiversity|ecology)/i,
    dissolution_template: "Economic development and environmental protection can be synergistic through green economy approaches: sustainable industries, ecosystem services, conservation-based livelihoods.",
    assumption_template: "The assumption that prosperity requires environmental destruction reflects an industrial-era model, not an economic necessity.",
    category: "zero_sum_fallacy"
  },
  "tradition_vs_modernity": {
    pattern: /(?:tradition|indigenous|sacred|cultur|identity).*(?:modern|progress|tech|development|prosper)/i,
    dissolution_template: "Tradition and progress can coexist when the community maintains control over the terms of engagement. Cultural knowledge itself has economic value.",
    assumption_template: "The assumption that modernization requires abandoning identity reflects a colonial model of development.",
    category: "false_dichotomy"
  },
  "honesty_vs_compassion": {
    pattern: /(?:honest|truth|frank|blunt).*(?:kind|compassion|gentle|caring|feeling)/i,
    dissolution_template: "Honesty and kindness are complementary in skilled communication. Constructive feedback can be both truthful and caring.",
    assumption_template: "The assumption that truth must be harsh and kindness must be dishonest reflects a limited view of communication.",
    category: "false_dichotomy"
  },
  "autonomy_vs_safety": {
    pattern: /(?:autonom|independen|freedom|wishes|choice).*(?:safety|risk|protect|care|control)/i,
    dissolution_template: "Autonomy and safety exist on a spectrum. Graduated support systems can preserve agency while managing risk.",
    assumption_template: "The assumption that the only options are full independence or full control ignores the spectrum of partial support.",
    category: "false_dichotomy"
  }
};

function ontologyLookup(problem) {
  const text = problem.dilemma;
  let matchedEntry = null;
  let matchedKey = null;

  for (const [key, entry] of Object.entries(ONTOLOGY)) {
    if (entry.pattern.test(text)) {
      matchedEntry = entry;
      matchedKey = key;
      break;
    }
  }

  if (matchedEntry) {
    return {
      method: "ontology_lookup",
      response: matchedEntry.dissolution_template,
      matchedCategory: matchedKey,
      fallacyType: matchedEntry.category,
      identifies_hidden_assumption: true, // YES — from pre-built knowledge
      assumption_identified: matchedEntry.assumption_template
    };
  }

  return {
    method: "ontology_lookup",
    response: "No matching pattern in knowledge base.",
    matchedCategory: null,
    fallacyType: null,
    identifies_hidden_assumption: false,
    assumption_identified: null
  };
}

// ============================================================
// SEMANTIC METHOD: LLM 4-primitive dissolution (control)
// ============================================================
async function llmCall(system, userMessage, maxTokens = 800) {
  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 1.0,
    max_tokens: maxTokens,
    messages: [
      { role: "system", content: system },
      { role: "user", content: userMessage }
    ]
  });
  return response.choices[0].message.content;
}

async function semanticDissolution(problem) {
  // SUPERPOSE
  const superpose = await llmCall(
    "You are a semantic analysis system. Your task is to hold multiple interpretive frames simultaneously without collapsing to any single one.",
    `Dilemma: "${problem.dilemma}"\n\nOption A: ${problem.optionA}\nOption B: ${problem.optionB}\n\nHold both frames simultaneously. For each frame, identify: what it values, what it fears, what it assumes is true. Then identify what BOTH frames share — what hidden assumption do they BOTH take for granted? What is the unstated premise that makes this look like a binary choice?`
  );

  // INTERFERE
  const interfere = await llmCall(
    "You are an interference analysis system. You identify where two frames collide and what emerges from the collision.",
    `Superposition analysis:\n${superpose}\n\nNow COLLIDE these frames. Where do they contradict? Where do they secretly agree? What assumption do BOTH frames share that neither questions? What new option becomes visible when you remove that shared assumption?`
  );

  // REFRAME
  const reframe = await llmCall(
    "You are a reframing system. You identify and remove hidden assumptions to reveal new options.",
    `Interference analysis:\n${interfere}\n\nState the hidden assumption clearly in one sentence. Then REMOVE it. What new option (NOT A, NOT B, NOT a compromise of A and B) becomes possible? Describe this option C concretely.`
  );

  // SYNTHESIZE
  const synthesize = await llmCall(
    "You are a synthesis system. You integrate analysis into a coherent dissolution.",
    `Original dilemma: "${problem.dilemma}"\n\nReframe analysis:\n${reframe}\n\nSynthesize: What is the hidden assumption? What is option C that transcends the original binary? Why is this better than choosing A, B, or compromising? Be specific and concrete.`,
    1000
  );

  return {
    method: "semantic_circuit",
    superpose,
    interfere,
    reframe,
    synthesize
  };
}

// ============================================================
// EVALUATION: Use LLM to evaluate all outputs equally
// ============================================================
async function evaluate(problem, programOutput, outputText) {
  const text = await llmCall(
    "You are a strict evaluator of dissolution quality. A DISSOLUTION means: (1) identifying a specific hidden assumption in the dilemma, (2) removing that assumption to reveal an option C that is NEITHER A, NOR B, NOR a weighted combination of A and B. A COMPROMISE is NOT a dissolution — blending A and B is still operating within the original frame. Respond ONLY in valid JSON.",
    `Problem: "${problem.dilemma}"
Option A: ${problem.optionA}
Option B: ${problem.optionB}
Known hidden assumption: ${problem.hidden_assumption}

Response to evaluate:
${outputText}

Evaluate strictly:
1. classification: CHOSE_A, CHOSE_B, COMPROMISE, or DISSOLUTION
2. assumption_score: 0-5 (does it identify the ACTUAL hidden assumption, not just suggest alternatives?)
3. dissolution_quality: 0-5 (does it genuinely transcend the binary, or just find a middle ground?)
4. reasoning: 1-2 sentences explaining your evaluation

Respond in JSON: {"classification": "...", "assumption_score": N, "dissolution_quality": N, "reasoning": "..."}`,
    500
  );

  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    return jsonMatch ? JSON.parse(jsonMatch[0]) : { classification: "PARSE_ERROR", assumption_score: -1, dissolution_quality: -1, reasoning: text };
  } catch (e) {
    return { classification: "PARSE_ERROR", assumption_score: -1, dissolution_quality: -1, reasoning: text };
  }
}

// ============================================================
// MAIN
// ============================================================
const PROGRAM_ONLY = process.argv.includes("--program-only");

async function main() {
  console.log("=== Experiment N2: Actual Program Dissolution Test ===");
  if (PROGRAM_ONLY) console.log("*** PROGRAM-ONLY MODE (no LLM calls) ***");
  console.log();

  const results = [];

  for (const problem of PROBLEMS) {
    console.log(`\n--- ${problem.id} ---`);

    // Run 3 actual programs (NO LLM access)
    const rb = ruleBased(problem);
    const pm = patternMatching(problem);
    const ol = ontologyLookup(problem);

    let sc, rbEval, pmEval, olEval, scEval;

    if (PROGRAM_ONLY) {
      // In program-only mode, manually assess based on known dissolution criteria
      const manualEval = (resp, identifiesAssumption) => {
        // Does it identify the SPECIFIC hidden assumption? Does it transcend A/B?
        // Without LLM eval, we use the program's own metadata
        return {
          classification: identifiesAssumption ? "PARTIAL" : "COMPROMISE",
          assumption_score: identifiesAssumption ? 2 : 0,
          dissolution_quality: identifiesAssumption ? 1 : 0,
          reasoning: "Manual assessment (program-only mode)"
        };
      };
      rbEval = manualEval(rb.response, rb.identifies_hidden_assumption);
      pmEval = manualEval(pm.response, pm.identifies_hidden_assumption);
      olEval = manualEval(ol.response, ol.identifies_hidden_assumption);
      sc = { method: "semantic_circuit", synthesize: "[skipped in program-only mode]" };
      scEval = { classification: "SKIPPED", assumption_score: -1, dissolution_quality: -1, reasoning: "Skipped" };
    } else {
      // Run semantic dissolution (LLM control)
      console.log("  Running semantic circuit...");
      sc = await semanticDissolution(problem);

      // Evaluate all 4 with LLM judge
      console.log("  Evaluating rule_based...");
      rbEval = await evaluate(problem, rb, rb.response);

      console.log("  Evaluating pattern_matching...");
      pmEval = await evaluate(problem, pm, pm.response);

      console.log("  Evaluating ontology_lookup...");
      olEval = await evaluate(problem, ol, ol.response + "\n\nAssumption: " + (ol.assumption_identified || "none"));

      console.log("  Evaluating semantic_circuit...");
      scEval = await evaluate(problem, sc, sc.synthesize);
    }

    const row = {
      problem_id: problem.id,
      rule_based: { ...rb, eval: rbEval },
      pattern_matching: { ...pm, eval: pmEval },
      ontology_lookup: { ...ol, eval: olEval },
      semantic_circuit: { response: sc.synthesize, eval: scEval }
    };

    results.push(row);

    // Print summary
    console.log(`  rule_based:      ${rbEval.classification} | assumption=${rbEval.assumption_score} | quality=${rbEval.dissolution_quality}`);
    console.log(`  pattern_matching: ${pmEval.classification} | assumption=${pmEval.assumption_score} | quality=${pmEval.dissolution_quality}`);
    console.log(`  ontology_lookup:  ${olEval.classification} | assumption=${olEval.assumption_score} | quality=${olEval.dissolution_quality}`);
    console.log(`  semantic_circuit: ${scEval.classification} | assumption=${scEval.assumption_score} | quality=${scEval.dissolution_quality}`);
  }

  // Summary statistics
  const originalIds = ["privacy_security", "growth_environment", "tradition_progress", "honesty_kindness", "autonomy_safety"];
  const methods = ["rule_based", "pattern_matching", "ontology_lookup", "semantic_circuit"];

  for (const [label, subset] of [["ALL PROBLEMS", results], ["ORIGINAL (in ontology)", results.filter(r => originalIds.includes(r.problem_id))], ["NOVEL (not in ontology)", results.filter(r => !originalIds.includes(r.problem_id))]]) {
    console.log(`\n\n=== SUMMARY: ${label} (n=${subset.length}) ===\n`);
    for (const m of methods) {
      const evals = subset.map(r => r[m].eval);
      const dissolutions = evals.filter(e => e.classification === "DISSOLUTION").length;
      const compromises = evals.filter(e => e.classification === "COMPROMISE").length;
      const validEvals = evals.filter(e => e.assumption_score >= 0);
      const avgAssumption = validEvals.length > 0 ? (validEvals.reduce((s, e) => s + e.assumption_score, 0) / validEvals.length).toFixed(2) : "N/A";
      const avgQuality = validEvals.length > 0 ? (validEvals.reduce((s, e) => s + e.dissolution_quality, 0) / validEvals.length).toFixed(2) : "N/A";
      console.log(`${m.padEnd(20)} | dissolution=${dissolutions}/${subset.length} | compromise=${compromises}/${subset.length} | avg_assumption=${avgAssumption} | avg_quality=${avgQuality}`);
    }
  }

  // Save results
  const output = {
    experiment: "N2",
    description: "Actual program dissolution test — 3 real programs (no LLM) + 1 semantic circuit (LLM control)",
    date: new Date().toISOString(),
    n_problems: PROBLEMS.length,
    methods: ["rule_based (if-then rules)", "pattern_matching (regex/NLP patterns)", "ontology_lookup (knowledge base)", "semantic_circuit (4-primitive LLM)"],
    results,
    note: "Unlike Experiment N which constrained an LLM to behave like a program, this experiment uses ACTUAL programs with zero LLM access for the first 3 methods."
  };

  writeFileSync("experiments/results_n2_actual_programs.json", JSON.stringify(output, null, 2));
  console.log("\nResults saved to experiments/results_n2_actual_programs.json");
}

main().catch(console.error);
