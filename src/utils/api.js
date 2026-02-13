const API_ENDPOINT = "/api/chat";

const MODEL_PRICING = {
  "claude-sonnet-4-20250514": { input: 3.0, output: 15.0 },
  "claude-haiku-4-5-20251001": { input: 0.8, output: 4.0 },
};

export function estimateCost(model, inputTokens, outputTokens) {
  const pricing = MODEL_PRICING[model] || MODEL_PRICING["claude-sonnet-4-20250514"];
  return (inputTokens * pricing.input + outputTokens * pricing.output) / 1_000_000;
}

/**
 * Parse the structured JSON response from the LLM.
 * Falls back gracefully if the model doesn't return valid JSON.
 */
function parseStructuredResponse(raw) {
  try {
    // Strip markdown fences if present
    const cleaned = raw.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
    const parsed = JSON.parse(cleaned);

    return {
      dialogue: parsed.dialogue || raw,
      action: parsed.action || null,
      emotion: parsed.emotion || "neutre",
      trust_level: Math.max(1, Math.min(5, parsed.trust_level || 3)),
      isStructured: true,
    };
  } catch {
    // Fallback: treat the whole response as dialogue (model didn't return JSON)
    return {
      dialogue: raw,
      action: null,
      emotion: "neutre",
      trust_level: 3,
      isStructured: false,
    };
  }
}

export async function sendChatMessage({ model, maxTokens, temperature, systemPrompt, messages }) {
  const startTime = performance.now();

  const response = await fetch(API_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      temperature,
      system: systemPrompt,
      messages,
    }),
  });

  const data = await response.json();
  const latency = Math.round(performance.now() - startTime);

  if (data.error) {
    throw new Error(data.error);
  }

  const rawContent = data.content?.map((b) => b.text || "").join("") || "...";
  const inputTokens = data.usage?.input_tokens || 0;
  const outputTokens = data.usage?.output_tokens || 0;
  const cost = estimateCost(model, inputTokens, outputTokens);

  const structured = parseStructuredResponse(rawContent);

  return {
    ...structured,
    rawContent,
    meta: {
      latency,
      inputTokens,
      outputTokens,
      totalTokens: inputTokens + outputTokens,
      cost,
      model,
    },
  };
}
