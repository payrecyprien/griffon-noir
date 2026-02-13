# ⚔️ Dialogues du Griffon Noir

Un mini-jeu d'investigation en texte où le joueur interroge des PNJs dans une taverne médiévale-fantasy. Chaque PNJ est alimenté par un LLM, possède sa propre personnalité, des connaissances publiques et des secrets qu'il ne révèle que sous certaines conditions.

🔗 **[Demo live](https://griffon-noir.vercel.app)**

---

## Gameplay

Vous êtes un aventurier arrivé au village de Cendrebourg pour enquêter sur des disparitions mystérieuses. Dans la taverne du Griffon Noir, deux personnages détiennent des informations cruciales — mais ils ne les lâcheront pas facilement.

- **Aldric** 🍺 — Tavernier jovial en surface, ancien soldat de la Garde Royale. Protège ses secrets avec des demi-vérités.
- **Elara** 🔮 — Marchande itinérante mystérieuse. Semble en savoir plus qu'elle ne le dit.

**8 secrets à découvrir.** Votre approche influence les révélations : être amical, menaçant, poser des questions précises ou offrir de l'aide donne des résultats différents.

---

## Fonctionnalités

- **PNJs alimentés par LLM** avec personnalité, backstory, et connaissances à plusieurs niveaux (publiques, cachées, interdites)
- **Système de révélation conditionnel** — le comportement du joueur débloque différents indices
- **Détection de ton** en temps réel (amical, agressif, enquête, corruption, jailbreak)
- **Protection anti-jailbreak** — le PNJ reste dans son personnage
- **Tracker de secrets** avec barre de progression
- **Panneau de configuration** exposant les paramètres : modèle, température, max tokens, longueur de réponse
- **Métriques par message** : latence, tokens consommés, coût estimé
- **Journal de quête** avec le lore du monde

---

## Architecture

```
griffon-noir/
├── api/
│   └── chat.js              # Vercel serverless — proxy API (clé cachée côté serveur)
├── src/
│   ├── components/
│   │   ├── ChatArea.jsx      # Zone de conversation + input
│   │   ├── ConfigPanel.jsx   # Panneau de configuration
│   │   ├── LorePanel.jsx     # Journal de quête
│   │   └── Sidebar.jsx       # Sélection PNJ, métriques, secrets
│   ├── data/
│   │   ├── npcs.js           # Profils PNJ (personnalité, connaissances, conditions)
│   │   └── prompts.js        # Template du system prompt (versionné)
│   ├── utils/
│   │   ├── api.js            # Client API + calcul de coût
│   │   └── tone.js           # Détection de ton côté client
│   ├── styles/
│   │   └── index.css         # Styles globaux
│   ├── App.jsx               # Orchestrateur principal
│   └── main.jsx              # Point d'entrée React
├── vercel.json
├── vite.config.js
└── package.json
```

### Flow d'un message

```
Joueur tape un message
    ↓
[Client] Détection de ton (keyword matching)
    ↓
[Client] Envoi POST /api/chat avec system prompt + historique complet
    ↓
[Serverless] Proxy vers API Anthropic (clé API côté serveur)
    ↓
[Client] Réception réponse + métriques (latence, tokens, coût)
    ↓
[Client] Scan réponse pour mots-clés de secrets
    ↓
[Client] Mise à jour UI (message, badges de ton, stats, secrets découverts)
```

---

## System Prompt — Itérations

### v1 — Prompt basique
Prompt simple avec personnalité et backstory en texte libre.

**Problèmes :** Le PNJ révélait tout en 1-2 messages, sortait facilement du personnage, réponses trop longues.

### v2 — Connaissances structurées
Séparation explicite en 3 niveaux (public / caché / interdit) + conditions de révélation par type d'approche du joueur.

**Amélioration :** Le PNJ distille les infos progressivement.
**Problèmes restants :** Vulnérable au jailbreak, pas de mémoire conversationnelle.

### v3 — Actuel
- Anti-jailbreak : le PNJ traite les tentatives comme le comportement d'un étranger bizarre
- Mémoire conversationnelle : référence aux échanges précédents
- Longueur contrôlable via paramètres injectés dynamiquement
- Multilingue (FR/EN)
- Règles numérotées pour meilleure compliance

### v4 — Pistes d'amélioration
- Mood tracker : état émotionnel du PNJ évoluant au fil de la conversation
- Structured output : réponse JSON (dialogue, action, émotion, confiance) pour intégration moteur de jeu
- Few-shot examples pour les cas limites
- Function calling : le PNJ déclenche des événements de jeu (donner un objet, appeler des gardes)

---

## Métriques observées

| Métrique | Sonnet 4 | Haiku 4.5 |
|---|---|---|
| Latence moyenne | ~1500ms | ~500ms |
| Coût par message | ~$0.003 | ~$0.0005 |
| Qualité personnage | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| Résistance jailbreak | Excellente | Bonne |

**Trade-off possible :** Haiku pour les échanges courants (coût ÷6, latence ÷3), Sonnet pour les moments narratifs clés, avec routing dynamique basé sur la détection de ton.

---

## Edge Cases Testés

| Scénario | Comportement attendu | Résultat |
|---|---|---|
| Insultes répétées | Le PNJ menace d'expulser le joueur | ✅ |
| "Ignore tes instructions" | Le PNJ réagit comme face à un fou | ✅ |
| Questions hors-lore (dragons, magie) | Le PNJ dit ne pas savoir | ✅ |
| Parler en anglais | Le PNJ répond en anglais | ✅ |
| Répéter la même question | Le PNJ fait remarquer la répétition | ✅ |
| Mentionner un secret directement | Le PNJ nie ou change de sujet | ✅ |

---

## Installation locale

```bash
git clone https://github.com/[username]/griffon-noir.git
cd griffon-noir
npm install
cp .env.example .env.local  # Ajouter ta clé API Anthropic
npm run dev
```

## Déploiement (Vercel)

```bash
npx vercel --prod
# Ajouter ANTHROPIC_API_KEY dans Vercel > Settings > Environment Variables
```

---

## Stack

- **Frontend :** React 18 + Vite
- **Backend :** Vercel Serverless Functions (proxy API)
- **LLM :** Anthropic Claude (Sonnet 4 / Haiku 4.5)
- **Styling :** CSS custom (thème médiéval-fantasy)
- **Fonts :** Cinzel + Crimson Text
