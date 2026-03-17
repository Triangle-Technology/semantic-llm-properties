/**
 * SEMANTIC COMPUTING SDK v1.0
 *
 * Barrel export — import everything from one place.
 *
 * Usage:
 *   import { profile, measureCAS, superpose, interfere, createClient } from './sdk/index.mjs'
 */

// Core circuit framework (v0.1 compat)
export {
  SemanticState,
  SemanticCircuit,
  ContextGate,
  InterferenceGate,
  ChainGate,
  MetaGate,
  Runner,
  // Convenience functions
  circuit,
  context,
  interfere as interferenceGate,
  meta,
  runner,
} from "./semantic.mjs";

// Analysis (consolidated from experiments)
export {
  Analysis,
  extractWords,
  wordFrequency,
  wordFrequencyMap,
  cosineSimilarity,
  shannonEntropy,
  normalizedEntropy,
  findEmergent,
  scoreWithMarkers,
  domainTrace,
  detectOrbitals,
  contradictionScore,
} from "./analysis.mjs";

// Multi-model router
export {
  createClient,
  detectProvider,
  modelType,
  bestModelFor,
  PROVIDERS,
  DEFAULTS as MODEL_DEFAULTS,
} from "./router.mjs";

// Semantic Profiler
export {
  measureCAS,
  detectPhaseTransitions,
  classifyInterference,
  profile,
  KNOWN_CONCEPTS,
} from "./profiler.mjs";

// 5 Semantic Primitives
export {
  superpose,
  interfere,
  reframe,
  synthesize,
  validate,
} from "./primitives.mjs";
