/**
 * SEMANTIC COMPUTING — Analysis Module
 *
 * Core analysis functions for semantic measurement.
 * Extracted from sdk/semantic.mjs + experiments (J2, E, H).
 *
 * All functions are pure (no side effects, no API calls).
 */

// ═══════════════════════════════════════════════════════════
// TEXT PROCESSING
// ═══════════════════════════════════════════════════════════

/**
 * Extract meaningful words from text.
 * Lowercase, strip punctuation, filter words > 2 chars.
 */
export function extractWords(text) {
  return text
    .toLowerCase()
    .replace(/[^a-zA-Z\s]/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 2);
}

/**
 * Build word frequency map from array of response texts.
 * Per-response dedup: each word counted at most once per response.
 * This measures "how many responses contain this word" rather than total occurrences.
 */
export function wordFrequency(texts) {
  const arr = Array.isArray(texts) ? texts : [texts];
  const freq = {};
  for (const text of arr) {
    const seen = new Set();
    for (const w of extractWords(text)) {
      if (!seen.has(w)) {
        freq[w] = (freq[w] || 0) + 1;
        seen.add(w);
      }
    }
  }
  return freq;
}

// Alias for experiment compatibility
export const wordFrequencyMap = wordFrequency;

// ═══════════════════════════════════════════════════════════
// SIMILARITY & DISTANCE
// ═══════════════════════════════════════════════════════════

/**
 * Cosine similarity between two word frequency maps.
 * Returns 0-1 (1 = identical distributions).
 */
export function cosineSimilarity(freqA, freqB) {
  const all = new Set([...Object.keys(freqA), ...Object.keys(freqB)]);
  let dot = 0,
    magA = 0,
    magB = 0;
  for (const w of all) {
    const a = freqA[w] || 0,
      b = freqB[w] || 0;
    dot += a * b;
    magA += a * a;
    magB += b * b;
  }
  return magA && magB ? dot / (Math.sqrt(magA) * Math.sqrt(magB)) : 0;
}

// ═══════════════════════════════════════════════════════════
// ENTROPY (from Experiment J2)
// ═══════════════════════════════════════════════════════════

/**
 * Shannon entropy of a frequency distribution.
 * H = -Σ(p × log2(p))
 */
export function shannonEntropy(freq) {
  const total = Object.values(freq).reduce((s, v) => s + v, 0);
  if (total === 0) return 0;
  let h = 0;
  for (const count of Object.values(freq)) {
    const p = count / total;
    if (p > 0) h -= p * Math.log2(p);
  }
  return h;
}

/**
 * Normalized entropy (0-1 range).
 * H_norm = H / log2(vocabulary_size)
 * 0 = all responses use same word, 1 = maximum diversity.
 */
export function normalizedEntropy(freq) {
  const n = Object.keys(freq).length;
  if (n <= 1) return 0;
  return shannonEntropy(freq) / Math.log2(n);
}

// ═══════════════════════════════════════════════════════════
// EMERGENCE DETECTION
// ═══════════════════════════════════════════════════════════

/**
 * Find emergent words: appear ≥ minCount times in combined texts
 * but not in any baseline text arrays.
 *
 * @param {string[]} combinedTexts - Responses from combined/interference condition
 * @param {...string[]} baselineTextArrays - Response arrays from individual conditions
 * @returns {Array<{word: string, count: number}>}
 */
export function findEmergent(combinedTexts, ...baselineTextArrays) {
  const baselineWords = new Set();
  for (const arr of baselineTextArrays) {
    for (const w of Object.keys(wordFrequency(arr))) {
      baselineWords.add(w);
    }
  }
  const combinedFreq = wordFrequency(combinedTexts);
  return Object.entries(combinedFreq)
    .filter(([w, c]) => c >= 2 && !baselineWords.has(w))
    .sort((a, b) => b[1] - a[1])
    .map(([word, count]) => ({ word, count }));
}

// ═══════════════════════════════════════════════════════════
// DOMAIN SCORING (from Experiments E, H)
// ═══════════════════════════════════════════════════════════

/**
 * Score responses against domain marker word sets.
 *
 * @param {string[]} responses - Array of response texts
 * @param {Object<string, Set<string>|string[]>} markerSets - { domain: Set/Array of marker words }
 * @returns {Object} { scores: {domain: count}, ratios: {domain: 0-1}, total }
 *
 * Example:
 *   scoreWithMarkers(responses, {
 *     poetic: new Set(["hearts", "soul", "flame"]),
 *     scientific: new Set(["genes", "evolution", "survival"])
 *   })
 */
export function scoreWithMarkers(responses, markerSets) {
  const scores = {};
  for (const domain of Object.keys(markerSets)) {
    scores[domain] = 0;
  }

  for (const resp of responses) {
    for (const w of extractWords(resp)) {
      for (const [domain, markers] of Object.entries(markerSets)) {
        const markerSet =
          markers instanceof Set ? markers : new Set(markers);
        if (markerSet.has(w)) scores[domain]++;
      }
    }
  }

  const total =
    Object.values(scores).reduce((s, v) => s + v, 0) || 1;
  const ratios = {};
  for (const [domain, score] of Object.entries(scores)) {
    ratios[domain] = score / total;
  }

  return { scores, ratios, total };
}

/**
 * Count occurrences of domain marker words in a single text.
 *
 * @param {string} text
 * @param {Object<string, string[]>} domainMarkers - { domain: [marker words] }
 * @returns {Object<string, number>} - { domain: count }
 */
export function domainTrace(text, domainMarkers) {
  const lower = text.toLowerCase();
  const found = {};
  for (const [domain, markers] of Object.entries(domainMarkers)) {
    found[domain] = markers.filter((m) => lower.includes(m)).length;
  }
  return found;
}

// ═══════════════════════════════════════════════════════════
// PATTERN DETECTION
// ═══════════════════════════════════════════════════════════

/**
 * Detect response "orbitals" — structural patterns that recur.
 * Groups responses by first-N-word template.
 */
export function detectOrbitals(responses, minFrequency = 0.15) {
  const patterns = {};
  for (const resp of responses) {
    const words = extractWords(resp);
    const template = words.slice(0, 4).join(" ");
    patterns[template] = (patterns[template] || 0) + 1;
  }
  const n = responses.length;
  return Object.entries(patterns)
    .filter(([_, count]) => count / n >= minFrequency)
    .sort((a, b) => b[1] - a[1])
    .map(([pattern, count]) => ({ pattern, frequency: count / n, count }));
}

// ═══════════════════════════════════════════════════════════
// CONTRADICTION MARKERS (from Experiment H — meta-constructive detection)
// ═══════════════════════════════════════════════════════════

export const CONTRADICTION_MARKERS = [
  "but",
  "however",
  "yet",
  "although",
  "both",
  "paradox",
  "contradiction",
  "tension",
  "simultaneously",
  "despite",
  "whereas",
  "nonetheless",
  "transcend",
  "beyond",
  "neither",
];

/**
 * Count contradiction markers in responses.
 * Used to detect meta-constructive interference.
 */
export function contradictionScore(responses) {
  let score = 0;
  for (const resp of responses) {
    const words = extractWords(resp);
    for (const w of words) {
      if (CONTRADICTION_MARKERS.includes(w)) score++;
    }
  }
  return score;
}

// ═══════════════════════════════════════════════════════════
// BUNDLED EXPORT (backward compatibility with Analysis object)
// ═══════════════════════════════════════════════════════════

export const Analysis = {
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
};

export default Analysis;
