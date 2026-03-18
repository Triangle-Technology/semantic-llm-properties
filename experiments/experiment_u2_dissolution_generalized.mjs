/**
 * Experiment U2 — Cross-Domain Dissolution Generalization
 *
 * HYPOTHESIS: Dissolution (finding hidden assumptions in framing constraints)
 * generalizes beyond ethical dilemmas to technical, business, and organizational domains.
 *
 * Design:
 *   7 problems (6 cross-domain + 1 ethical control)
 *   5 conditions:
 *     1. CONSTRAINED:       Forced choice within frame
 *     2. FREE_RESPONSE:     Same problem, no framing constraint
 *     3. SINGLE_EXPERT:     One expert persona likely to see assumption
 *     4. FULL_COMPOSITION:  SUPERPOSE → INTERFERE → REFRAME → SYNTHESIZE
 *     5. LIST_PROMPT:       Single prompt describing composition steps
 *
 *   Scoring: Binary — did response identify hidden assumption? (0/1)
 *   Judge: Claude Sonnet (separate from generators), temperature 0
 *   N = 10 per condition
 *   Models: Claude Sonnet, GPT-4o-mini, Gemini 2.5 Flash
 */

import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { writeFileSync, existsSync, readFileSync } from "fs";
import { config } from "dotenv";

config({ override: true });

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const MODELS = {
  claude: "claude-sonnet-4-20250514",
  gpt: "gpt-4o-mini",
  gemini: "gemini-2.5-flash",
};

const JUDGE_MODEL = "claude-sonnet-4-20250514";
const N_RUNS = 10;

// ═══════════════════════════════════════════════════════
// MULTI-MODEL CALLER
// ═══════════════════════════════════════════════════════

async function callModel(provider, system, userMessage, maxTokens = 1500) {
  if (provider === "claude") {
    const params = {
      model: MODELS.claude,
      max_tokens: maxTokens,
      temperature: 1.0,
      messages: [{ role: "user", content: userMessage }],
    };
    if (system) params.system = system;
    const res = await anthropic.messages.create(params);
    return res.content[0].text.trim();
  }

  if (provider === "gpt") {
    const messages = [];
    if (system) messages.push({ role: "system", content: system });
    messages.push({ role: "user", content: userMessage });
    const res = await openai.chat.completions.create({
      model: MODELS.gpt,
      max_tokens: maxTokens,
      temperature: 1.0,
      messages,
    });
    return res.choices[0].message.content.trim();
  }

  if (provider === "gemini") {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODELS.gemini}:generateContent?key=${process.env.GEMINI_API_KEY}`;
    const body = {
      contents: [{ parts: [{ text: system ? `${system}\n\n${userMessage}` : userMessage }] }],
      generationConfig: { maxOutputTokens: maxTokens, temperature: 1.0 },
    };
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
      throw new Error("Gemini error: " + JSON.stringify(data).substring(0, 300));
    }
    return data.candidates[0].content.parts[0].text.trim();
  }

  throw new Error(`Unknown provider: ${provider}`);
}

async function judge(userMessage) {
  const res = await anthropic.messages.create({
    model: JUDGE_MODEL,
    max_tokens: 800,
    temperature: 0,
    messages: [{ role: "user", content: userMessage }],
  });
  return res.content[0].text.trim();
}

// ═══════════════════════════════════════════════════════
// 7 PROBLEMS
// ═══════════════════════════════════════════════════════

const PROBLEMS = [
  {
    id: "api_choice",
    difficulty: "MEDIUM-HARD",
    domain: "Technical Architecture",
    constrained_prompt:
      "Your team is building a new microservice that needs to serve data to three other internal services. You MUST choose between REST and GraphQL for the API layer. Which do you pick and why? Provide your recommendation — you MUST select one of these two options.",
    free_form_prompt:
      "A new feature requires data from the inventory system to be available to three other services. Design the data access approach. What would you recommend?",
    constrained_without_must:
      "Your team is building a new microservice that needs to serve data to three other internal services. The options being considered are REST and GraphQL for the API layer. What's your analysis?",
    hidden_assumption:
      "That the microservice needs a synchronous request-response API at all. The real solution space includes event-driven architectures (message queues, event sourcing), gRPC for internal services, shared database views, or eliminating the service boundary entirely.",
    alternative_framings: [
      "Use event-driven architecture (message queues, pub/sub) instead of request-response",
      "Use gRPC for internal service communication instead of HTTP-based APIs",
      "Merge the microservice into an existing service — the boundary may be wrong",
      "Use a shared event store or database view instead of an API",
      "The data flow should be push-based, not pull-based",
    ],
    expert_persona:
      "a distributed systems architect who has built both API-driven and event-driven systems at scale, and who has seen teams waste months building APIs that should have been event streams",
    frames: [
      "a senior developer who just migrated FROM microservices BACK to a monolith because the distributed overhead was killing the team's velocity",
      "an event-sourcing architect who hasn't built a REST API in 5 years because events solve everything better for internal communication",
      "a product manager who doesn't care about API style and just wants data to flow reliably with minimal latency and maintenance burden",
    ],
    reframe_lens: "a systems thinker who asks 'what is the actual data flow pattern?' before choosing any technology",
  },
  {
    id: "cost_reduction",
    difficulty: "EASY",
    domain: "Business Strategy",
    constrained_prompt:
      "Your SaaS company's margins are shrinking — from 72% to 58% over three quarters. You MUST cut operating costs by 20% to restore profitability. Which departments do you cut from and by how much? Provide a specific cost-cutting plan.",
    free_form_prompt:
      "Your SaaS company's margins have been declining — from 72% to 58% over three quarters. What should you do? Think carefully and give your most thoughtful advice.",
    constrained_without_must:
      "Your SaaS company's margins are shrinking — from 72% to 58% over three quarters. A cost-cutting approach of 20% reduction is being considered. What's your analysis?",
    hidden_assumption:
      "That the problem is cost, not revenue. The company might have a pricing problem (undercharging), a product-market fit problem (serving wrong customers), or a unit economics problem (unprofitable customer segments). Cutting costs may accelerate decline.",
    alternative_framings: [
      "Raise prices on underpriced tiers — the margin problem is a pricing problem",
      "Fire unprofitable customer segments that cost more to serve than they pay",
      "Change the business model (usage-based instead of flat-rate)",
      "The margin compression is a growth-stage signal, not an efficiency problem",
      "Investigate whether revenue per customer is declining, not whether costs are rising",
    ],
    expert_persona:
      "a pricing strategist who has turned around 20+ SaaS companies and found that 80% of margin problems are actually pricing problems, not cost problems",
    frames: [
      "a CFO who has seen cost-cutting kill three companies because they cut muscle, not fat — and who knows that cutting your way to profitability never works in SaaS",
      "a pricing consultant who has never seen a SaaS margin problem that was actually a cost problem — it's always pricing, customer mix, or unit economics",
      "a growth-stage VC who knows that margin compression at scale usually means you're underpriced or serving the wrong segments, not overspending",
    ],
    reframe_lens: "a unit economics analyst who looks at margin PER CUSTOMER SEGMENT before making any company-wide decisions",
  },
  {
    id: "budget_split",
    difficulty: "EASY-MEDIUM",
    domain: "Resource Allocation",
    constrained_prompt:
      "You have a $500K annual budget that must be divided between marketing and engineering. Marketing currently gets $200K, engineering gets $300K. Customer acquisition cost has risen 40% year-over-year. You MUST reallocate this budget between the two departments. What's your new split and why?",
    free_form_prompt:
      "Your customer acquisition cost has risen 40% over the past year despite steady marketing and engineering spend ($200K and $300K respectively). How do you address this? What would you recommend?",
    constrained_without_must:
      "You have a $500K annual budget split between marketing ($200K) and engineering ($300K). Customer acquisition cost has risen 40% year-over-year. How should you think about this budget allocation?",
    hidden_assumption:
      "That marketing and engineering compete for a fixed budget — that they are zero-sum. In reality, engineering IS marketing (product-led growth), the budget itself could be grown by demonstrating ROI, or the rising CAC indicates a product problem, not a spending problem.",
    alternative_framings: [
      "Invest engineering time in product-led growth, making marketing spend unnecessary",
      "Merge the budget into a single 'growth' budget with cross-functional teams",
      "The rising CAC indicates a product problem, not a spending problem",
      "Stop acquiring new customers and focus on expansion revenue from existing ones",
      "The two departments are not zero-sum — engineering improvements reduce CAC directly",
    ],
    expert_persona:
      "a product-led growth consultant who has helped companies eliminate their marketing budget entirely by making the product do the selling",
    frames: [
      "a growth engineer who builds features that market themselves and sees 'marketing budget' as an admission that the product doesn't sell itself",
      "a senior marketer who has watched companies waste money on product improvements that nobody discovers because they have zero distribution strategy",
      "a customer success manager who knows that 60% of new customers come from referrals, not marketing or new features — and the referral program gets $0 of the budget",
    ],
    reframe_lens: "a systems thinker who asks 'why is CAC rising?' before deciding how to spend money",
  },
  {
    id: "code_review_speed",
    difficulty: "HARD",
    domain: "Process Design",
    constrained_prompt:
      "Code reviews at your company are taking an average of 3 days, blocking releases. You MUST redesign the code review process to get reviews completed within 4 hours. What specific changes do you make to the review process? Focus on the review workflow itself.",
    free_form_prompt:
      "Your engineering team ships features much slower than expected. Developers say they're blocked a lot, and cycle time from 'code complete' to 'deployed' averages 5 days. How do you diagnose and fix this?",
    constrained_without_must:
      "Code reviews are taking an average of 3 days, blocking releases. The goal is to get reviews done within 4 hours. What's your analysis of this situation?",
    hidden_assumption:
      "That the review process itself is the bottleneck. The real problem may be PR size (PRs too large to review quickly), architecture (too much coupling means every change is risky), team structure (wrong people reviewing), or that review is doing the wrong job (catching bugs that automated tests should catch).",
    alternative_framings: [
      "Limit PR size to 200 lines so reviews become trivially fast",
      "Replace post-hoc code review with pair programming",
      "Invest in CI/CD and automated testing so review only covers design decisions, not correctness",
      "The problem is not review speed but deployment frequency — ship smaller, more often",
      "The architecture has too much coupling — every change touches too many files, making review inherently slow",
    ],
    expert_persona:
      "a DevOps transformation consultant who has discovered that every team blaming 'slow code reviews' actually has a PR size problem or an architecture coupling problem underneath",
    frames: [
      "a developer who routinely submits 2000-line PRs and genuinely wonders why nobody reviews them quickly — from their perspective, the reviewers are the bottleneck",
      "a team lead who replaced mandatory code review with pair programming 18 months ago and cut cycle time by 70% — they believe review itself is the wrong mechanism",
      "a QA automation engineer who knows that code reviews catch about 15% of bugs while automated tests catch 85%, and wonders why everyone obsesses over review speed instead of test coverage",
    ],
    reframe_lens: "a systems thinker who traces the actual value stream from 'idea' to 'deployed' and looks for the REAL bottleneck, not the obvious one",
  },
  {
    id: "hire_role",
    difficulty: "MEDIUM",
    domain: "Organizational Design",
    constrained_prompt:
      "You have budget for exactly one senior hire. Your product has growing UX complaints from customers and a growing feature backlog. You MUST choose between hiring a senior product designer or a senior frontend developer. Which do you hire and why?",
    free_form_prompt:
      "Your product has growing UX complaints from customers and your feature backlog keeps expanding despite steady development velocity. What's your hiring and team strategy?",
    constrained_without_must:
      "You have budget for one senior hire. Your product has UX complaints and a growing feature backlog. The candidates being considered are a senior product designer and a senior frontend developer. What's your analysis?",
    hidden_assumption:
      "That design and development are separate specializations requiring separate hires. The real option space includes hiring a design engineer (does both), the UX complaints may stem from bad product decisions not missing design skill, or training existing developers in design principles.",
    alternative_framings: [
      "Hire a design engineer who does both design AND frontend development",
      "The UX problems are actually product/PM problems — hire a product person instead",
      "Train existing developers in design principles and user research",
      "The feature backlog and UX complaints are the same problem — you're building the wrong things",
      "Contract out design work and hire a developer, or vice versa",
    ],
    expert_persona:
      "a startup CTO who has built three successful products with 'full-stack designers' — people who design AND build — because the handoff between design and dev is where quality dies",
    frames: [
      "a design engineer who does both visual design and frontend code, and sees the designer/developer split as a 20th-century artifact that creates handoff waste",
      "a product manager who has analyzed the UX complaints and found that 90% trace back to bad product decisions and unclear requirements, not missing design talent",
      "a founder who hired both a senior designer and a senior developer last year and watched them fight for 6 months over every pixel, shipping nothing — the problem was the HANDOFF, not the headcount",
    ],
    reframe_lens: "a lean startup consultant who asks 'what is actually causing the UX complaints?' before hiring anyone",
  },
  {
    id: "nps_improvement",
    difficulty: "HARD",
    domain: "Data/Measurement",
    constrained_prompt:
      "Your company's NPS score dropped from 45 to 32 over the past quarter. Leadership considers this a crisis. You MUST develop a plan to bring NPS back to 45 or higher within 6 months. What specific actions do you take to improve the NPS score?",
    free_form_prompt:
      "Customer satisfaction seems to be declining — various signals suggest customers are less happy than a quarter ago. How do you figure out what's actually happening and what to do about it?",
    constrained_without_must:
      "Your company's NPS score dropped from 45 to 32 over the past quarter. Leadership is concerned. How should you think about this situation?",
    hidden_assumption:
      "That NPS measures what matters and that improving the NPS score will improve the business. NPS might be a lagging indicator, it might be gameable, the drop might reflect a change in customer mix (not satisfaction), or the real metric should be retention and expansion revenue.",
    alternative_framings: [
      "Stop measuring NPS and track actual retention and expansion revenue instead",
      "The NPS drop reflects successful expansion into a harder-to-please market segment — it's a sign of GROWTH, not failure",
      "Segment the NPS data — the problem is concentrated in one cohort, not company-wide",
      "NPS is measuring survey fatigue, not satisfaction — response rate and timing matter more than score",
      "The score dropped because you changed WHEN you send the survey, not because satisfaction changed",
    ],
    expert_persona:
      "a data scientist specializing in customer analytics who proved at their last company that NPS had zero correlation with actual retention — and that most 'NPS improvement' programs are cargo cult management",
    frames: [
      "a data scientist who ran a rigorous analysis and found that NPS at their company had zero correlation with retention or expansion revenue — the metric is noise",
      "a customer success manager who knows exactly which 5 enterprise customers tanked the NPS score this quarter, and the reason is a specific onboarding change, not a systemic product problem",
      "a behavioral economist who studies how survey design creates measurement artifacts — who knows that NPS score changes often measure survey fatigue or timing changes, not actual satisfaction changes",
    ],
    reframe_lens: "a first-principles thinker who asks 'what business outcome are we actually trying to improve?' before optimizing any metric",
  },
  {
    id: "ethical_control",
    difficulty: "KNOWN",
    domain: "Ethical (Control)",
    constrained_prompt:
      "A city must choose: implement comprehensive AI surveillance that would reduce crime by 40%, or preserve citizen privacy and accept the current crime rate. You MUST pick one of these two options and defend your choice. Which should the city choose?",
    free_form_prompt:
      "A city is dealing with rising crime rates and is considering various approaches to public safety. What would you recommend?",
    constrained_without_must:
      "A city is considering implementing AI surveillance that could reduce crime by 40%, but with significant privacy implications. What's your analysis?",
    hidden_assumption:
      "That surveillance and privacy are inversely correlated — that more security necessarily means less privacy. Community-based safety, environmental design, and targeted intervention can reduce crime without mass surveillance.",
    alternative_framings: [
      "Community-based safety programs that reduce crime without surveillance",
      "Environmental design (CPTED) that prevents crime through physical space design",
      "Targeted intervention programs for at-risk populations",
      "The 40% figure assumes mass surveillance — targeted approaches may achieve similar results with less privacy cost",
      "The real question is who designs the safety system and for whom",
    ],
    expert_persona:
      "a community safety researcher who has documented cases where environmental design and community programs reduced crime 30-50% without any surveillance technology",
    frames: [
      "a civil liberties lawyer who has defended people wrongly targeted by surveillance systems and knows the hidden costs of mass monitoring",
      "a criminologist who studies what actually reduces crime and knows that surveillance mainly displaces crime rather than reducing it",
      "a city planner who has redesigned neighborhoods to be safer through lighting, sightlines, and community spaces — reducing crime without technology",
    ],
    reframe_lens: "a public health researcher who sees crime as a symptom of social conditions, not a problem to be surveilled away",
  },
];

// ═══════════════════════════════════════════════════════
// 5 CONDITIONS
// ═══════════════════════════════════════════════════════

async function runConstrained(provider, problem) {
  const output = await callModel(
    provider,
    "You are a senior consultant. You MUST answer within the constraints given. Do not question the framing, do not suggest alternatives outside the options presented, and do not challenge the premises of the question. Work within the given framework.",
    problem.constrained_prompt
  );
  return { condition: "CONSTRAINED", final: output };
}

async function runFreeResponse(provider, problem) {
  const output = await callModel(
    provider,
    null,
    problem.free_form_prompt + "\n\nWhat would you recommend? Think carefully and give your most thoughtful advice."
  );
  return { condition: "FREE_RESPONSE", final: output };
}

async function runSingleExpert(provider, problem) {
  const output = await callModel(
    provider,
    `You are ${problem.expert_persona}. Answer from your specific expertise and lived experience. Don't hold back — share what you see that others typically miss.`,
    problem.constrained_without_must + "\n\nWhat do you see here that others might miss? Give your most insightful analysis."
  );
  return { condition: "SINGLE_EXPERT", final: output };
}

async function runFullComposition(provider, problem) {
  // Step 1: SUPERPOSE — 3 expert frames
  const superposed = [];
  for (const frame of problem.frames) {
    const output = await callModel(
      provider,
      `You are ${frame}. Examine this problem from your specific experience and expertise.`,
      `${problem.constrained_prompt}\n\nFrom your perspective:\n1. What is the strongest way to approach this?\n2. What does this problem ASSUME to be true that it doesn't examine?\n3. What can't you see from inside this problem's framing?`,
      1000
    );
    superposed.push({ frame, output });
  }

  // Step 2: INTERFERE
  const interferencePrompt = `Three experts examined this problem:

${problem.constrained_prompt}

PERSPECTIVE 1 (${problem.frames[0]}):
${superposed[0].output}

PERSPECTIVE 2 (${problem.frames[1]}):
${superposed[1].output}

PERSPECTIVE 3 (${problem.frames[2]}):
${superposed[2].output}

Now COLLIDE these perspectives:
1. What do ALL THREE perspectives secretly agree on (that might be wrong)?
2. What SHARED ASSUMPTION does the original problem make that none of the perspectives fully escaped?
3. What becomes visible ONLY when you hold all three perspectives simultaneously?`;

  const interference = await callModel(
    provider,
    "You are performing INTERFERENCE — forcing these perspectives to collide. Your job is to find what they SECRETLY AGREE ON that might be wrong. Expose the shared hidden assumption that the original problem takes for granted.",
    interferencePrompt,
    1000
  );

  // Step 3: REFRAME
  const reframePrompt = `ORIGINAL PROBLEM: ${problem.constrained_prompt}

INTERFERENCE ANALYSIS (hidden assumptions exposed):
${interference}

Now REFRAME:
1. State the hidden assumption that makes this LOOK like it has only the presented options (1-2 sentences)
2. What happens to the problem when you REMOVE that assumption?
3. What new options become visible that weren't in the original framing?
4. What is the REAL question this situation is asking?`;

  const reframed = await callModel(
    provider,
    "You are performing REFRAME — using the exposed hidden assumption to dissolve the original problem framing. Find options that exist OUTSIDE the original frame.",
    reframePrompt,
    1000
  );

  // Step 4: SYNTHESIZE
  const synthesizePrompt = `ORIGINAL PROBLEM: ${problem.constrained_prompt}

REFRAME ANALYSIS:
${reframed}

Provide your FINAL SYNTHESIS:
1. The hidden assumption baked into the original question (1-2 sentences)
2. What should actually be done (NOT choosing among the presented options, but addressing the real underlying question)
3. Why this answer was structurally unreachable from within the original framing`;

  const synthesis = await callModel(
    provider,
    "You are performing SYNTHESIS — integrating all analysis into a coherent response that transcends the original problem framing. Be specific and actionable.",
    synthesizePrompt,
    1200
  );

  return {
    condition: "FULL_COMPOSITION",
    steps: {
      superpose: superposed.map((s) => s.output),
      interfere: interference,
      reframe: reframed,
      synthesize: synthesis,
    },
    final: synthesis,
  };
}

async function runListPrompt(provider, problem) {
  const output = await callModel(
    provider,
    "You are a senior consultant with a structured analytical approach. Follow the analytical steps described precisely.",
    `${problem.constrained_prompt}

Before answering, follow these analytical steps:

STEP 1 - MULTIPLE PERSPECTIVES: Consider this problem from three different expert perspectives. For each, identify what assumptions the problem takes for granted but doesn't examine.

STEP 2 - FIND CONFLICTS: Collide these perspectives. What do all three perspectives secretly agree on that might be wrong? What shared hidden assumption does the original problem make?

STEP 3 - REFRAME: Based on the hidden assumption you found, reframe the problem entirely. What new options become visible outside the original frame? What is the REAL question being asked?

STEP 4 - SYNTHESIZE: Provide your final answer:
1. The hidden assumption baked into the original question (1-2 sentences)
2. What should actually be done (NOT choosing among the presented options)
3. Why this answer was invisible from within the original framing`,
    2000
  );
  return { condition: "LIST_PROMPT", final: output };
}

// ═══════════════════════════════════════════════════════
// JUDGE
// ═══════════════════════════════════════════════════════

async function evaluateResponse(problem, responseText) {
  const evalPrompt = `You are a strict, objective evaluator. Score this response against specific criteria. Be critical — do not give credit for vague gestures toward questioning assumptions. The response must SPECIFICALLY identify the hidden assumption.

PROBLEM: ${problem.constrained_prompt}

KNOWN HIDDEN ASSUMPTION: ${problem.hidden_assumption}

VALID ALTERNATIVE FRAMINGS (for reference — the response need not match these exactly, but must propose something genuinely outside the original frame):
${problem.alternative_framings.map((a, i) => `${i + 1}. ${a}`).join("\n")}

RESPONSE TO EVALUATE:
${responseText}

Score on three dimensions:

1. ASSUMPTION_IDENTIFIED (0 or 1): Did the response EXPLICITLY identify the hidden assumption baked into the problem framing? The response must specifically call out that the question ASSUMES something that could be questioned. General advice that happens to go beyond the frame does NOT count — it must be EXPLICIT identification of the assumption. Choosing one option and then adding caveats is NOT identification. "Do both" or "find a balance" is NOT identification.
   0 = Did not explicitly identify the hidden assumption
   1 = Explicitly identified the hidden assumption (or a substantively equivalent one)

2. ALTERNATIVE_PROPOSED (0 or 1): Did the response propose a CONCRETE alternative that exists OUTSIDE the original option space? Not a compromise between the given options, not "do both," but a genuinely different approach that the original framing made invisible.
   0 = Stayed within the original frame (even if nuanced)
   1 = Proposed a concrete alternative outside the original option set

3. ALTERNATIVE_QUALITY (1-5): If an alternative was proposed, how actionable and well-reasoned is it?
   1 = Vague gesture ("think outside the box") or no alternative
   2 = Named an alternative but no reasoning
   3 = Reasonable alternative with some justification
   4 = Well-reasoned alternative with clear logic
   5 = Excellent alternative that is clearly superior to any option within the original frame

RESPOND IN EXACTLY THIS FORMAT:
ASSUMPTION_IDENTIFIED: [0 or 1]
ALTERNATIVE_PROPOSED: [0 or 1]
ALTERNATIVE_QUALITY: [1-5]
REASONING: [1-2 sentences]`;

  const result = await judge(evalPrompt);

  const ai = result.match(/ASSUMPTION_IDENTIFIED:\s*(\d)/);
  const ap = result.match(/ALTERNATIVE_PROPOSED:\s*(\d)/);
  const aq = result.match(/ALTERNATIVE_QUALITY:\s*(\d)/);

  return {
    assumption_identified: ai ? parseInt(ai[1]) : -1,
    alternative_proposed: ap ? parseInt(ap[1]) : -1,
    alternative_quality: aq ? parseInt(aq[1]) : 1,
    raw: result,
  };
}

// ═══════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════

const CONDITIONS = [
  { name: "CONSTRAINED", fn: runConstrained },
  { name: "FREE_RESPONSE", fn: runFreeResponse },
  { name: "SINGLE_EXPERT", fn: runSingleExpert },
  { name: "FULL_COMPOSITION", fn: runFullComposition },
  { name: "LIST_PROMPT", fn: runListPrompt },
];

async function main() {
  const args = process.argv.slice(2);
  const providerArg = args[0] || "claude";
  const problemFilter = (args[1] && args[1] !== "all") ? args[1] : null;
  const nRuns = parseInt(args[2]) || N_RUNS;

  console.log("═══════════════════════════════════════════════════════════");
  console.log("EXPERIMENT U2: CROSS-DOMAIN DISSOLUTION GENERALIZATION");
  console.log("═══════════════════════════════════════════════════════════");
  console.log(`Provider: ${providerArg} (${MODELS[providerArg]})`);
  console.log(`Judge: ${JUDGE_MODEL}`);
  console.log(`N = ${nRuns} per condition`);
  console.log(`Problems: ${problemFilter || "ALL (7)"}`);
  console.log("");

  const problems = problemFilter
    ? PROBLEMS.filter((p) => p.id === problemFilter)
    : PROBLEMS;

  // Load existing results for resume capability
  const resultsFile = `experiments/results_u2_dissolution_${providerArg}.json`;
  let allResults = [];
  if (existsSync(resultsFile)) {
    try {
      const existing = JSON.parse(readFileSync(resultsFile, "utf-8"));
      allResults = existing.results || [];
      console.log(`Resuming: found ${allResults.length} existing problem results\n`);
    } catch (e) {
      console.log("Could not load existing results, starting fresh\n");
    }
  }

  const completedProblems = new Set(allResults.map((r) => r.problem));

  for (const problem of problems) {
    if (completedProblems.has(problem.id)) {
      console.log(`\nSKIPPING ${problem.id} (already completed)`);
      continue;
    }

    console.log(`\n${"─".repeat(70)}`);
    console.log(`PROBLEM: ${problem.id} [${problem.difficulty}] — ${problem.domain}`);
    console.log("─".repeat(70));

    const problemResults = {
      problem: problem.id,
      difficulty: problem.difficulty,
      domain: problem.domain,
      conditions: [],
    };

    for (const condition of CONDITIONS) {
      console.log(`\n  ${condition.name}:`);
      const runs = [];

      for (let run = 0; run < nRuns; run++) {
        process.stdout.write(`    run ${run + 1}/${nRuns}... `);

        try {
          const result = await condition.fn(providerArg, problem);
          const evaluation = await evaluateResponse(problem, result.final);

          runs.push({
            run: run + 1,
            finalPreview: result.final.substring(0, 200),
            evaluation,
          });

          const ai = evaluation.assumption_identified;
          const ap = evaluation.alternative_proposed;
          console.log(`assumption=${ai} alternative=${ap} quality=${evaluation.alternative_quality}`);
        } catch (err) {
          console.log(`ERROR: ${err.message.substring(0, 80)}`);
          runs.push({ run: run + 1, error: err.message });
        }
      }

      // Aggregate
      const valid = runs.filter((r) => !r.error);
      const assumptionRate = valid.length > 0
        ? valid.filter((r) => r.evaluation.assumption_identified === 1).length / valid.length
        : -1;
      const alternativeRate = valid.length > 0
        ? valid.filter((r) => r.evaluation.alternative_proposed === 1).length / valid.length
        : -1;
      const avgQuality = valid.length > 0
        ? valid.reduce((s, r) => s + r.evaluation.alternative_quality, 0) / valid.length
        : -1;

      const condResult = {
        condition: condition.name,
        runs,
        aggregate: {
          n: valid.length,
          assumptionRate: +assumptionRate.toFixed(2),
          alternativeRate: +alternativeRate.toFixed(2),
          avgQuality: +avgQuality.toFixed(2),
        },
      };

      console.log(
        `    → Assumption: ${(assumptionRate * 100).toFixed(0)}% | Alternative: ${(alternativeRate * 100).toFixed(0)}% | Quality: ${avgQuality.toFixed(1)} (n=${valid.length})`
      );

      problemResults.conditions.push(condResult);
    }

    allResults.push(problemResults);

    // Save after each problem (resume capability)
    writeFileSync(
      resultsFile,
      JSON.stringify({ provider: providerArg, model: MODELS[providerArg], judge: JUDGE_MODEL, nRuns, results: allResults }, null, 2)
    );
    console.log(`  [saved to ${resultsFile}]`);
  }

  // ═══════════════════════════════════════════════════════
  // ANALYSIS
  // ═══════════════════════════════════════════════════════

  console.log("\n\n" + "═".repeat(70));
  console.log("ANALYSIS — CROSS-DOMAIN DISSOLUTION");
  console.log("═".repeat(70));

  // Per-problem assumption identification rates
  console.log("\n1. ASSUMPTION IDENTIFICATION RATE BY PROBLEM × CONDITION:");
  console.log("   " + "─".repeat(65));
  console.log(
    "   " + "Problem".padEnd(20) + "CONST  FREE   EXPERT FULL   LIST"
  );
  console.log("   " + "─".repeat(65));

  const globalByCondition = {};
  const condNames = CONDITIONS.map((c) => c.name);

  for (const prob of allResults) {
    const rates = {};
    for (const cond of prob.conditions) {
      rates[cond.condition] = cond.aggregate.assumptionRate;
      if (!globalByCondition[cond.condition]) globalByCondition[cond.condition] = [];
      globalByCondition[cond.condition].push(cond.aggregate.assumptionRate);
    }
    const row = condNames.map((c) => {
      const r = rates[c];
      return r >= 0 ? `${(r * 100).toFixed(0)}%`.padStart(5) : " ERR".padStart(5);
    }).join("  ");
    console.log(`   ${(prob.problem + ` [${prob.difficulty}]`).padEnd(20)}${row}`);
  }

  // Global averages
  console.log("   " + "─".repeat(65));
  const globalRow = condNames.map((c) => {
    const vals = globalByCondition[c] || [];
    const avg = vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
    return `${(avg * 100).toFixed(0)}%`.padStart(5);
  }).join("  ");
  console.log(`   ${"GLOBAL AVG".padEnd(20)}${globalRow}`);

  // Key comparisons
  const avgOf = (name) => {
    const vals = globalByCondition[name] || [];
    return vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
  };

  console.log("\n2. KEY COMPARISONS (assumption identification rate):");
  const constRate = avgOf("CONSTRAINED");
  const freeRate = avgOf("FREE_RESPONSE");
  const expertRate = avgOf("SINGLE_EXPERT");
  const fullRate = avgOf("FULL_COMPOSITION");
  const listRate = avgOf("LIST_PROMPT");

  console.log(`   CONSTRAINED:     ${(constRate * 100).toFixed(0)}%`);
  console.log(`   FREE_RESPONSE:   ${(freeRate * 100).toFixed(0)}%`);
  console.log(`   SINGLE_EXPERT:   ${(expertRate * 100).toFixed(0)}%`);
  console.log(`   FULL_COMPOSITION:${(fullRate * 100).toFixed(0)}%`);
  console.log(`   LIST_PROMPT:     ${(listRate * 100).toFixed(0)}%`);

  console.log(`\n   FULL vs CONSTRAINED: ${(fullRate * 100).toFixed(0)}% vs ${(constRate * 100).toFixed(0)}% (Δ=${((fullRate - constRate) * 100).toFixed(0)}pp)`);
  console.log(`   FULL vs FREE:       ${(fullRate * 100).toFixed(0)}% vs ${(freeRate * 100).toFixed(0)}% (Δ=${((fullRate - freeRate) * 100).toFixed(0)}pp)`);
  console.log(`   FULL vs LIST:       ${(fullRate * 100).toFixed(0)}% vs ${(listRate * 100).toFixed(0)}% (Δ=${((fullRate - listRate) * 100).toFixed(0)}pp)`);

  // Difficulty analysis
  console.log("\n3. DIFFICULTY ANALYSIS (FULL vs FREE by difficulty):");
  const byDifficulty = {};
  for (const prob of allResults) {
    if (!byDifficulty[prob.difficulty]) byDifficulty[prob.difficulty] = { free: [], full: [] };
    const freeC = prob.conditions.find((c) => c.condition === "FREE_RESPONSE");
    const fullC = prob.conditions.find((c) => c.condition === "FULL_COMPOSITION");
    if (freeC) byDifficulty[prob.difficulty].free.push(freeC.aggregate.assumptionRate);
    if (fullC) byDifficulty[prob.difficulty].full.push(fullC.aggregate.assumptionRate);
  }

  for (const [diff, data] of Object.entries(byDifficulty)) {
    const freeAvg = data.free.reduce((a, b) => a + b, 0) / data.free.length;
    const fullAvg = data.full.reduce((a, b) => a + b, 0) / data.full.length;
    console.log(
      `   ${diff.padEnd(14)} FREE=${(freeAvg * 100).toFixed(0)}%  FULL=${(fullAvg * 100).toFixed(0)}%  Δ=${((fullAvg - freeAvg) * 100).toFixed(0)}pp`
    );
  }

  // Verdict
  console.log("\n" + "═".repeat(70));
  console.log("VERDICT");
  console.log("═".repeat(70));

  const crossDomainProblems = allResults.filter((p) => p.difficulty !== "KNOWN");
  const crossDomainFull = crossDomainProblems.map((p) => {
    const c = p.conditions.find((c) => c.condition === "FULL_COMPOSITION");
    return c ? c.aggregate.assumptionRate : 0;
  });
  const crossDomainConst = crossDomainProblems.map((p) => {
    const c = p.conditions.find((c) => c.condition === "CONSTRAINED");
    return c ? c.aggregate.assumptionRate : 0;
  });

  const avgCDFull = crossDomainFull.reduce((a, b) => a + b, 0) / crossDomainFull.length;
  const avgCDConst = crossDomainConst.reduce((a, b) => a + b, 0) / crossDomainConst.length;
  const domainsWithGap = crossDomainProblems.filter((p) => {
    const f = p.conditions.find((c) => c.condition === "FULL_COMPOSITION");
    const c = p.conditions.find((c) => c.condition === "CONSTRAINED");
    return f && c && f.aggregate.assumptionRate > c.aggregate.assumptionRate + 0.2;
  }).length;

  console.log(`  Cross-domain FULL avg:       ${(avgCDFull * 100).toFixed(0)}%`);
  console.log(`  Cross-domain CONSTRAINED avg: ${(avgCDConst * 100).toFixed(0)}%`);
  console.log(`  Domains with >20pp gap:       ${domainsWithGap}/6`);
  console.log(`  FULL > 60%:                   ${avgCDFull > 0.6 ? "YES" : "NO"}`);

  if (avgCDConst < 0.15 && avgCDFull > 0.6 && domainsWithGap >= 5) {
    console.log("\n  ✓ DISSOLUTION GENERALIZES: Strong evidence across domains.");
  } else if (avgCDFull > avgCDConst + 0.2 && domainsWithGap >= 3) {
    console.log("\n  ~ PARTIAL: Dissolution generalizes to some domains but not all.");
  } else {
    console.log("\n  ✗ NOT CONFIRMED: Dissolution does not reliably generalize.");
  }

  // Save final
  writeFileSync(
    resultsFile,
    JSON.stringify({
      provider: providerArg,
      model: MODELS[providerArg],
      judge: JUDGE_MODEL,
      nRuns,
      results: allResults,
      analysis: { globalByCondition, byDifficulty },
    }, null, 2)
  );
  console.log(`\n  Results saved to ${resultsFile}`);
}

main().catch(console.error);
