/**
 * SEMANTIC COMPUTING — Multi-Model Router
 *
 * Unified interface for Claude (Anthropic), GPT (OpenAI), and Gemini (Google).
 * Auto-detects provider from model name. Lazy client instantiation.
 *
 * Usage:
 *   import { createClient } from './router.mjs'
 *   const client = createClient("claude-haiku-4-5-20251001")
 *   const client = createClient("gpt-4o-mini")
 *   const client = createClient("gemini-2.0-flash")
 *   const text = await client.sample("You are a poet.", "Explain love in 5 words.")
 */

// ═══════════════════════════════════════════════════════════
// PROVIDER DETECTION
// ═══════════════════════════════════════════════════════════

export const PROVIDERS = {
  ANTHROPIC: "anthropic",
  OPENAI: "openai",
  GOOGLE: "google",
};

/**
 * Detect provider from model name string.
 */
export function detectProvider(model) {
  if (model.startsWith("claude")) return PROVIDERS.ANTHROPIC;
  if (
    model.startsWith("gpt") ||
    model.startsWith("o1") ||
    model.startsWith("o3") ||
    model.startsWith("o4")
  )
    return PROVIDERS.OPENAI;
  if (model.startsWith("gemini")) return PROVIDERS.GOOGLE;
  throw new Error(
    `Unknown model provider for "${model}". Expected model name starting with "claude", "gpt", "o1", "o3", "o4", or "gemini".`
  );
}

// ═══════════════════════════════════════════════════════════
// DEFAULT MODELS
// ═══════════════════════════════════════════════════════════

export const DEFAULTS = {
  anthropic: "claude-haiku-4-5-20251001",
  openai: "gpt-4o-mini",
  google: "gemini-2.0-flash",
};

// ═══════════════════════════════════════════════════════════
// MODEL TYPE CHARACTERIZATION (from Experiment H)
// ═══════════════════════════════════════════════════════════

/**
 * Type-M: Meta-constructive — opposition triggers elevation, not cancellation.
 * Type-D: Destructive — opposition triggers simplification or cancellation.
 *
 * Based on Experiment H findings. Gemini = unknown until tested.
 */
const MODEL_TYPES = {
  "claude": "Type-M",
  "gpt": "Type-D",
  "gemini": "unknown", // To be determined by Experiment R
};

/**
 * Get the semantic processing type for a model.
 * @param {string} model - Model name
 * @returns {"Type-M" | "Type-D" | "unknown"}
 */
export function modelType(model) {
  for (const [prefix, type] of Object.entries(MODEL_TYPES)) {
    if (model.startsWith(prefix)) return type;
  }
  return "unknown";
}

/**
 * Recommend best model for a semantic operation.
 *
 * @param {string} operation - One of: superpose, interfere, reframe, synthesize, validate
 * @returns {{ recommended: string, type: string, reason: string }}
 */
export function bestModelFor(operation) {
  const op = operation.toLowerCase();
  switch (op) {
    case "reframe":
    case "synthesize":
      return {
        recommended: DEFAULTS.anthropic,
        type: "Type-M",
        reason: `${op} benefits from meta-constructive processing (Exp H: Claude produces elevation, GPT produces simplification)`,
      };
    case "superpose":
    case "validate":
      return {
        recommended: DEFAULTS.anthropic,
        type: "either",
        reason: `${op} works with both model types`,
      };
    case "interfere":
      return {
        recommended: DEFAULTS.anthropic,
        type: "Type-M",
        reason: "interference with meta-constructive model produces richer emergence (Exp H)",
      };
    default:
      return {
        recommended: DEFAULTS.anthropic,
        type: "either",
        reason: "default recommendation",
      };
  }
}

// ═══════════════════════════════════════════════════════════
// UNIFIED CLIENT
// ═══════════════════════════════════════════════════════════

/**
 * Create a unified client for a given model.
 *
 * @param {string} model - Model name (e.g., "claude-haiku-4-5-20251001", "gpt-4o-mini", "gemini-2.0-flash")
 * @param {Object} [clientOptions] - Optional overrides
 * @param {string} [clientOptions.apiKey] - API key override (otherwise reads from env)
 * @returns {{ sample: Function, sampleN: Function, model: string, provider: string, type: string }}
 */
export function createClient(model, clientOptions = {}) {
  const provider = detectProvider(model);
  let _client = null; // lazy instantiation

  /**
   * Generate a single text response.
   *
   * @param {string|null} systemPrompt - System prompt (null for no system prompt)
   * @param {string} userPrompt - User message
   * @param {Object} [options]
   * @param {number} [options.maxTokens=50]
   * @param {number} [options.temperature=1.0]
   * @returns {Promise<string>} Response text
   */
  async function sample(systemPrompt, userPrompt, options = {}) {
    const maxTokens = options.maxTokens ?? 50;
    const temperature = options.temperature ?? 1.0;

    // Lazy init
    if (!_client) {
      if (provider === PROVIDERS.ANTHROPIC) {
        const Anthropic = (await import("@anthropic-ai/sdk")).default;
        _client = { type: "anthropic", inner: new Anthropic(clientOptions.apiKey ? { apiKey: clientOptions.apiKey } : undefined) };
      } else if (provider === PROVIDERS.OPENAI) {
        const OpenAI = (await import("openai")).default;
        _client = { type: "openai", inner: new OpenAI(clientOptions.apiKey ? { apiKey: clientOptions.apiKey } : undefined) };
      } else if (provider === PROVIDERS.GOOGLE) {
        const { GoogleGenerativeAI } = await import("@google/generative-ai");
        const apiKey = clientOptions.apiKey || process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
        if (!apiKey) {
          throw new Error("Google API key required. Set GOOGLE_API_KEY or GEMINI_API_KEY env var, or pass apiKey in clientOptions.");
        }
        const genAI = new GoogleGenerativeAI(apiKey);
        _client = { type: "google", inner: genAI };
      }
    }

    if (_client.type === "anthropic") {
      const params = {
        model,
        max_tokens: maxTokens,
        temperature,
        messages: [{ role: "user", content: userPrompt }],
      };
      if (systemPrompt) params.system = systemPrompt;
      const response = await _client.inner.messages.create(params);
      return response.content[0].text.trim();
    } else if (_client.type === "openai") {
      const messages = [];
      if (systemPrompt) {
        messages.push({ role: "system", content: systemPrompt });
      }
      messages.push({ role: "user", content: userPrompt });
      const response = await _client.inner.chat.completions.create({
        model,
        max_tokens: maxTokens,
        temperature,
        messages,
      });
      return response.choices[0].message.content.trim();
    } else if (_client.type === "google") {
      // Gemini: system instruction via model config, user prompt as content
      const genModel = _client.inner.getGenerativeModel({
        model,
        generationConfig: {
          maxOutputTokens: maxTokens,
          temperature,
        },
        ...(systemPrompt ? { systemInstruction: systemPrompt } : {}),
      });
      const result = await genModel.generateContent(userPrompt);
      return result.response.text().trim();
    }
  }

  /**
   * Generate N samples with optional delay between calls.
   */
  async function sampleN(systemPrompt, userPrompt, n, options = {}) {
    const delayMs = options.delayMs ?? 0;
    const onProgress = options.onProgress ?? null;
    const results = [];

    for (let i = 0; i < n; i++) {
      const text = await sample(systemPrompt, userPrompt, options);
      results.push(text);
      if (onProgress) onProgress(i + 1, n);
      if (delayMs > 0 && i < n - 1) {
        await new Promise((r) => setTimeout(r, delayMs));
      }
    }
    return results;
  }

  return {
    sample,
    sampleN,
    model,
    provider,
    type: modelType(model),
  };
}
