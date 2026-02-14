# ⚔️ Dialogues du Griffon Noir

**PNJ conversationnel alimenté par LLM pour un jeu d'investigation RPG**

🔗 [**Démo live**](https://griffon-noir.vercel.app) · 🏰 [**Écosystème Cendrebourg**](https://cendrebourg-landing.vercel.app)

---

## Concept

Un mini-jeu d'investigation où le joueur interroge les habitants d'une taverne médiévale-fantasy pour découvrir la vérité sur des disparitions mystérieuses. Chaque PNJ a sa personnalité, ses secrets, et réagit différemment selon l'approche du joueur.

Le projet démontre comment le **prompt engineering** peut créer des personnages crédibles et cohérents avec des mécaniques de jeu (secrets à débloquer, confiance à gagner, protection anti-jailbreak).

## Fonctionnalités

- **3 PNJs distincts** — Aldric (tavernier jovial), Elara (marchande mystérieuse), Gareth (capitaine tiraillé)
- **11 secrets** à découvrir par l'investigation, répartis entre les PNJs
- **Mood tracker temps réel** — émotion + barre de confiance (1-5) + historique visuel
- **Structured JSON output** — le LLM retourne dialogue, action, émotion et confiance dans un format parsable
- **Détection de ton** — analyse côté client du message du joueur (amical, menaçant, curieux...)
- **Anti-jailbreak** — les PNJs ignorent les tentatives de sortie de rôle
- **Persistance par PNJ** — switcher de personnage conserve chaque conversation
- **Secrets agrégés** — un secret découvert avec Aldric reste visible chez Gareth
- **Pipeline cross-projet** — reçoit le contexte de quêtes et créatures via URL
- **Panneau de configuration** — température, modèle, longueur, aperçu du system prompt

## Techniques de prompt engineering

| Technique | Implémentation |
|---|---|
| Persona structuré | Personnalité, backstory, ton, connaissances séparées en public / caché / interdit |
| Conditions de révélation | 4 modes (amical, menaçant, malin, corruption) avec comportements différents |
| Structured output | JSON obligatoire à 4 champs (dialogue, action, emotion, trust_level) |
| Anti-jailbreak | Instruction de rester dans le personnage face aux tentatives meta |
| Mémoire conversationnelle | Historique complet envoyé, le PNJ doit y faire référence |
| Contexte externe | Quêtes et créatures d'autres projets injectées dans le system prompt |
| Ton adaptatif | Longueur et style contrôlables via paramètres exposés |

## Architecture

```
griffon-noir/
├── api/chat.js              → Proxy serverless → Anthropic API
├── src/
│   ├── data/
│   │   ├── npcs.js          → Profils des 3 PNJs (personnalité, secrets, conditions)
│   │   └── prompts.js       → System prompt v5 (structured output + contexte externe)
│   ├── utils/
│   │   ├── api.js           → Appel API + parsing JSON structuré
│   │   ├── tone.js          → Détection de ton côté client
│   │   └── context.js       → Encodage/décodage contexte cross-projet (base64 URL)
│   ├── components/
│   │   ├── ChatArea.jsx     → Zone de dialogue + badges émotion
│   │   ├── Sidebar.jsx      → PNJs + mood tracker + secrets + métriques
│   │   ├── ConfigPanel.jsx  → Configuration du prompt (exposée volontairement)
│   │   └── LorePanel.jsx    → Journal de quête
│   └── App.jsx              → State management par PNJ via useRef
```

## Stack

React 18 · Vite · Vercel Serverless · Claude Sonnet 4 / Haiku 4.5

## Lancer en local

```bash
git clone https://github.com/payrecyprien/griffon-noir.git
cd griffon-noir
npm install
echo "ANTHROPIC_API_KEY=sk-ant-xxxxx" > .env
npm run dev
```

## Coût

~$0.003/message (Sonnet 4). Une session de 20 messages ≈ $0.06.

## Écosystème Cendrebourg

Pipeline interconnecté : 🗺️ [Forge](https://forge-cendrebourg.vercel.app) → 📖 [Bestiaire](https://bestiaire-cendrebourg.vercel.app) → ⚔️ **Griffon Noir**

---

*[Cyprien Payré](https://github.com/payrecyprien) — Prompt Engineering × Game Design*
