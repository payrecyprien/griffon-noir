const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";

const WORLD_CONTEXT = `Cendrebourg est un village médiéval-fantasy au croisement des routes commerciales.
Dirigé par le Seigneur Varen (suspect de trahison), conseillé par le mystérieux Theron.
Factions : la Garde de Cendrebourg, les Lames Grises (mercenaires), le Cercle d'Obsidienne (occulte), les Marchands du Carrefour, les Villageois.
Lieux : Taverne du Griffon Noir, Forêt de Brumesombre (disparitions), Ruines du Nord (évitées), Château de Varen, Marché, Chapelle, Pont Ancien, Mine abandonnée.
PNJs connus : Aldric (tavernier, ex-soldat), Elara (marchande/espionne), Gareth (capitaine de la garde), Varen (seigneur), Theron (conseiller suspect).
Des disparitions inexpliquées ont lieu dans la forêt. Des rituels et un nécromancien sont impliqués.`;

const QUEST_PROMPT = `Tu es un game designer expert en quêtes RPG médiéval-fantasy.

## CONTEXTE DU MONDE
${WORLD_CONTEXT}

## TA MISSION
Génère UNE quête courte et originale pour un aventurier à Cendrebourg. La quête doit être liée au lore existant.

## FORMAT DE RÉPONSE (JSON strict, rien d'autre)
{
  "title": "Nom évocateur de la quête",
  "description": "2-3 phrases décrivant la situation et l'enjeu",
  "type": "investigation|combat|infiltration|diplomatie|escort|collecte",
  "location_id": "brumesombre|ruines_nord|chateau_varen|griffon_noir|marche|chapelle|pont_ancien|mine",
  "faction_involved": "garde|lames_grises|cercle|marchands|villageois",
  "difficulty": 3,
  "objectives": ["objectif 1", "objectif 2"],
  "moral_choice": "Un dilemme en une phrase"
}

Ne mets RIEN avant ou après le JSON.`;

function buildCreaturePrompt(quest) {
  return `Tu es un game designer expert en créatures fantasy.

## CONTEXTE DU MONDE
${WORLD_CONTEXT}

## QUÊTE EN COURS
"${quest.title}" — ${quest.description}
Lieu : ${quest.location_id}

## TA MISSION
Génère UNE créature originale liée à cette quête. Pas de loup géant générique. La créature doit être unique à Cendrebourg.

## FORMAT DE RÉPONSE (JSON strict, rien d'autre)
{
  "name": "Nom unique de la créature",
  "title": "Titre/épithète courte",
  "type": "Bête|Mort-vivant|Esprit|Construct|Aberration|Plante",
  "element": "Ombre|Feu|Givre|Poison|Arcane|Aucun",
  "habitat": "${quest.location_id}",
  "danger_level": ${quest.difficulty || 3},
  "description": "2-3 phrases décrivant la créature et son lien avec la quête",
  "abilities": [{"name": "nom capacité", "description": "effet court"}],
  "weaknesses": [{"name": "nom faiblesse", "description": "comment l'exploiter"}]
}

Ne mets RIEN avant ou après le JSON.`;
}

function parseJSON(text) {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1) return null;
  return JSON.parse(text.slice(start, end + 1));
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "API key not configured" });

  const headers = {
    "Content-Type": "application/json",
    "x-api-key": apiKey,
    "anthropic-version": "2023-06-01",
  };

  const model = "claude-haiku-4-5-20251001"; // Fast + cheap for auto-generation

  try {
    // Step 1: Generate quest
    const questRes = await fetch(ANTHROPIC_URL, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model,
        max_tokens: 500,
        temperature: 0.9,
        system: QUEST_PROMPT,
        messages: [{ role: "user", content: "Génère une quête originale pour Cendrebourg." }],
      }),
    });

    const questData = await questRes.json();
    const questText = questData.content?.[0]?.text || "";

    let quest;
    try {
      quest = parseJSON(questText);
    } catch {
      return res.status(200).json({ error: "Quest parsing failed", raw: questText });
    }

    if (!quest || !quest.title) {
      return res.status(200).json({ error: "Invalid quest", raw: questText });
    }

    // Step 2: Generate creature based on quest
    const creaturePrompt = buildCreaturePrompt(quest);

    const creatureRes = await fetch(ANTHROPIC_URL, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model,
        max_tokens: 500,
        temperature: 0.9,
        system: creaturePrompt,
        messages: [{ role: "user", content: `Génère une créature pour la quête "${quest.title}". Sois créatif et original.` }],
      }),
    });

    const creatureData = await creatureRes.json();
    const creatureText = creatureData.content?.[0]?.text || "";

    let creature;
    try {
      creature = parseJSON(creatureText);
    } catch {
      creature = null;
    }

    return res.status(200).json({
      quest,
      creatures: creature ? [creature] : [],
    });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
