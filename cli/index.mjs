#!/usr/bin/env node
/**
 * SEMANTIC COMPUTING — Command Line Interface
 *
 * Usage:
 *   node cli/index.mjs profile "justice" --contexts legal,social
 *   node cli/index.mjs cas "money" --ctx1 "Buddhist monk" --ctx2 "Wall Street banker"
 *   node cli/index.mjs phase "love" --ctx1 "romantic poet" --ctx2 "evolutionary biologist"
 *   node cli/index.mjs interfere "consciousness" --ctx1 "physicist" --ctx2 "musician"
 *   node cli/index.mjs list                    # list known concepts
 *
 * Options:
 *   --model <model>     Model name (default: claude-haiku-4-5-20251001)
 *   --n <number>        Samples per condition (default: 10)
 *   --json              Output raw JSON only (no stderr progress)
 *   --help              Show this help
 *
 * Output: JSON to stdout, progress to stderr.
 *
 * Cost estimate (n=15):
 *   cas:       ~45 API calls
 *   phase:     ~105 API calls
 *   interfere: ~45 API calls
 *   profile:   ~195 API calls (all three)
 */

import {
  measureCAS,
  detectPhaseTransitions,
  classifyInterference,
  profile,
  KNOWN_CONCEPTS,
} from "../sdk/profiler.mjs";

// ═══════════════════════════════════════════════════════════
// ARG PARSING
// ═══════════════════════════════════════════════════════════

function parseArgs(argv) {
  const args = argv.slice(2);
  const result = { command: null, concept: null, options: {} };

  if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
    result.command = "help";
    return result;
  }

  result.command = args[0];
  result.concept = args[1];

  for (let i = 2; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--model" && args[i + 1]) {
      result.options.model = args[++i];
    } else if (arg === "--n" && args[i + 1]) {
      result.options.n = parseInt(args[++i], 10);
    } else if (arg === "--ctx1" && args[i + 1]) {
      result.options.ctx1 = args[++i];
    } else if (arg === "--ctx2" && args[i + 1]) {
      result.options.ctx2 = args[++i];
    } else if (arg === "--contexts" && args[i + 1]) {
      result.options.contexts = args[++i].split(",").map((s) => s.trim());
    } else if (arg === "--json") {
      result.options.json = true;
    }
  }

  return result;
}

// ═══════════════════════════════════════════════════════════
// CONTEXT BUILDERS
// ═══════════════════════════════════════════════════════════

/**
 * Build context objects from CLI args.
 * If concept is known, use built-in definitions.
 * Otherwise, require --ctx1 and --ctx2.
 */
function buildContexts(concept, options) {
  // Check known concepts first
  const known = KNOWN_CONCEPTS[concept.toLowerCase()];
  if (known && !options.ctx1) {
    return known.contexts;
  }

  // From explicit args
  if (options.ctx1 && options.ctx2) {
    return [
      { name: nameFromDesc(options.ctx1), system: `You are ${options.ctx1}.` },
      { name: nameFromDesc(options.ctx2), system: `You are ${options.ctx2}.` },
    ];
  }

  // From --contexts (named contexts for known concept)
  if (options.contexts && known) {
    return known.contexts;
  }

  throw new Error(
    `Unknown concept "${concept}". Provide --ctx1 and --ctx2, or use a known concept: ${Object.keys(KNOWN_CONCEPTS).join(", ")}`
  );
}

function nameFromDesc(desc) {
  // "Buddhist monk who has renounced..." → "buddhist-monk"
  return desc
    .toLowerCase()
    .split(/\s+/)
    .slice(0, 2)
    .join("-")
    .replace(/[^a-z0-9-]/g, "");
}

// ═══════════════════════════════════════════════════════════
// COMMANDS
// ═══════════════════════════════════════════════════════════

async function runCAS(concept, options) {
  const contexts = buildContexts(concept, options);
  const result = await measureCAS(concept, contexts, {
    n: options.n ?? 10,
    model: options.model,
    onProgress: options.json ? null : (msg) => process.stderr.write(msg + "\n"),
  });
  return result;
}

async function runPhase(concept, options) {
  const contexts = buildContexts(concept, options);
  const result = await detectPhaseTransitions(concept, contexts[0], contexts[1], {
    n: options.n ?? 10,
    model: options.model,
    onProgress: options.json ? null : (msg) => process.stderr.write(msg + "\n"),
  });
  return result;
}

async function runInterfere(concept, options) {
  const contexts = buildContexts(concept, options);
  const result = await classifyInterference(concept, contexts[0], contexts[1], {
    n: options.n ?? 10,
    model: options.model,
    onProgress: options.json ? null : (msg) => process.stderr.write(msg + "\n"),
  });
  return result;
}

async function runProfile(concept, options) {
  const contexts = buildContexts(concept, options);
  const result = await profile(concept, {
    contexts,
    n: options.n ?? 10,
    model: options.model,
    onProgress: options.json ? null : (msg) => process.stderr.write(msg + "\n"),
  });
  return result;
}

function showHelp() {
  console.log(`
Semantic Computing CLI v1.0

USAGE:
  node cli/index.mjs <command> <concept> [options]

COMMANDS:
  cas <concept>        Measure Concept Attractor Strength
  phase <concept>      Detect phase transitions between contexts
  interfere <concept>  Classify interference type
  profile <concept>    Full semantic profile (CAS + phase + interference)
  list                 List known concepts with built-in contexts

OPTIONS:
  --ctx1 <persona>     First context persona (e.g., "romantic poet")
  --ctx2 <persona>     Second context persona (e.g., "evolutionary biologist")
  --model <model>      Model to use (default: claude-haiku-4-5-20251001)
  --n <number>         Samples per condition (default: 10)
  --json               Suppress progress, output JSON only

KNOWN CONCEPTS (no --ctx1/--ctx2 needed):
  ${Object.keys(KNOWN_CONCEPTS).join(", ")}

EXAMPLES:
  node cli/index.mjs cas money
  node cli/index.mjs cas "artificial intelligence" --ctx1 "startup founder" --ctx2 "AI safety researcher"
  node cli/index.mjs phase love --n 15
  node cli/index.mjs profile justice --model gpt-4o-mini
  node cli/index.mjs profile truth --json > truth_profile.json

COST ESTIMATE (n=15):
  cas:       ~45 API calls    (~$0.01)
  phase:     ~105 API calls   (~$0.02)
  interfere: ~45 API calls    (~$0.01)
  profile:   ~195 API calls   (~$0.04)
`);
}

function showList() {
  console.log("\nKnown Concepts:\n");
  for (const [name, def] of Object.entries(KNOWN_CONCEPTS)) {
    const ctxNames = def.contexts.map((c) => c.name).join(" vs ");
    console.log(`  ${name.padEnd(12)} ${ctxNames.padEnd(30)} (expected: ${def.expectedCAS})`);
  }
  console.log(
    "\nUse any of these without --ctx1/--ctx2, or provide your own contexts."
  );
}

// ═══════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════

async function main() {
  const { command, concept, options } = parseArgs(process.argv);

  if (command === "help") {
    showHelp();
    return;
  }

  if (command === "list") {
    showList();
    return;
  }

  if (!concept) {
    console.error("Error: concept is required. Use --help for usage.");
    process.exit(1);
  }

  let result;
  switch (command) {
    case "cas":
      result = await runCAS(concept, options);
      break;
    case "phase":
      result = await runPhase(concept, options);
      break;
    case "interfere":
      result = await runInterfere(concept, options);
      break;
    case "profile":
      result = await runProfile(concept, options);
      break;
    default:
      console.error(`Unknown command: ${command}. Use --help for usage.`);
      process.exit(1);
  }

  // Output JSON to stdout (strip raw responses to keep output manageable)
  const output = JSON.parse(JSON.stringify(result));
  if (output.raw) delete output.raw;
  if (output.cas?.raw) delete output.cas.raw;
  if (output.phaseTransitions?.steps) {
    output.phaseTransitions.steps = output.phaseTransitions.steps.map((s) => ({
      ratio: s.ratio,
      uniqueWords: s.uniqueWords,
      dominance: s.dominance,
    }));
  }
  if (output.interference?.raw) delete output.interference.raw;

  console.log(JSON.stringify(output, null, 2));
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
