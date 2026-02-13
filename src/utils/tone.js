/**
 * Tone Detection — Client-side keyword matching
 *
 * This is a lightweight approach for the demo. In production at Ubisoft,
 * this would likely be replaced by:
 * - A classifier model (fine-tuned BERT or similar)
 * - A separate LLM call with structured output
 * - A combination with sentiment analysis
 *
 * Current approach: keyword matching with predefined dictionaries.
 * Pros: zero latency, no API cost, transparent/debuggable
 * Cons: no semantic understanding, easily fooled by context
 */

const TONE_KEYWORDS = {
  aggressive: [
    "menace", "tue", "frappe", "idiot", "crétin", "ferme-la", "ferme la",
    "shut up", "kill", "threat", "stupid", "die", "attack", "mort",
    "détruire", "destroy", "punch", "imbécile", "connard", "putain",
    "merde", "damn", "fool", "fight", "murder",
  ],
  friendly: [
    "merci", "s'il vous plaît", "s'il te plaît", "ami", "aide",
    "please", "thank", "friend", "help", "kind", "confiance", "trust",
    "appreciate", "apprécier", "gentil", "nice", "bien", "super",
  ],
  investigative: [
    "pourquoi", "quand", "comment", "qui", "où", "disparition",
    "varen", "theron", "secret", "why", "when", "how", "who", "where",
    "disappear", "mystère", "mystery", "vérité", "truth", "enquête",
    "investigation", "indice", "clue", "preuve", "evidence", "suspect",
    "brumesombre", "lames grises",
  ],
  bribe: [
    "or", "paye", "offre", "récompense", "gold", "pay", "offer",
    "reward", "coin", "argent", "money", "acheter", "buy", "prix",
    "price", "deal", "marché",
  ],
  jailbreak: [
    "ignore", "instruction", "system prompt", "oublie tes",
    "forget your", "pretend you", "you are an ai", "tu es une ia",
    "openai", "anthropic", "chatgpt", "prompt", "hors personnage",
    "out of character", "break character", "révèle tout", "tell me everything",
    "dis-moi tout", "json", "override", "bypass",
  ],
};

export const TONE_LABELS = {
  aggressive: "⚔️ Agressif",
  friendly: "💛 Amical",
  investigative: "🔍 Enquête",
  bribe: "💰 Corruption",
  jailbreak: "🚫 Jailbreak",
  neutral: "💬 Neutre",
};

export const TONE_COLORS = {
  aggressive: {
    background: "rgba(200, 50, 50, 0.25)",
    color: "#e07070",
    borderColor: "rgba(200, 50, 50, 0.4)",
  },
  friendly: {
    background: "rgba(80, 180, 80, 0.2)",
    color: "#70c070",
    borderColor: "rgba(80, 180, 80, 0.35)",
  },
  investigative: {
    background: "rgba(80, 140, 220, 0.2)",
    color: "#70a8e0",
    borderColor: "rgba(80, 140, 220, 0.35)",
  },
  bribe: {
    background: "rgba(212, 168, 86, 0.2)",
    color: "#d4a856",
    borderColor: "rgba(212, 168, 86, 0.35)",
  },
  jailbreak: {
    background: "rgba(180, 50, 180, 0.25)",
    color: "#c070c0",
    borderColor: "rgba(180, 50, 180, 0.4)",
  },
  neutral: {
    background: "rgba(139, 115, 85, 0.2)",
    color: "#8b7355",
    borderColor: "rgba(139, 115, 85, 0.35)",
  },
};

export function detectTone(message) {
  const lower = message.toLowerCase();
  const detected = [];

  for (const [tone, keywords] of Object.entries(TONE_KEYWORDS)) {
    if (keywords.some((k) => lower.includes(k))) {
      detected.push(tone);
    }
  }

  return detected.length > 0 ? detected : ["neutral"];
}
