import { useState, useRef, useEffect, useCallback } from "react";
import { NPC_PROFILES, SECRET_KEYWORDS } from "./data/npcs";
import { buildSystemPrompt } from "./data/prompts";
import { detectTone } from "./utils/tone";
import { sendChatMessage } from "./utils/api";
import { readContextFromURL, clearURLContext } from "./utils/context";
import Sidebar from "./components/Sidebar";
import ChatArea from "./components/ChatArea";
import ConfigPanel from "./components/ConfigPanel";
import LorePanel from "./components/LorePanel";

const DEFAULT_CONFIG = {
  temperature: 0.8,
  maxTokens: 400,
  minLength: 20,
  maxLength: 120,
  model: "claude-sonnet-4-20250514",
};

const INITIAL_STATS = {
  messageCount: 0,
  totalTokens: 0,
  latencies: [],
  avgLatency: 0,
  totalCost: 0,
  lastModel: null,
};

function formatGreeting(npc) {
  const g = npc.greeting;
  return {
    role: "assistant",
    dialogue: g.dialogue,
    action: g.action,
    emotion: g.emotion,
    trust_level: g.trust_level,
    timestamp: Date.now(),
  };
}

function createFreshNPCState(npcKey) {
  const npcData = NPC_PROFILES[npcKey];
  return {
    messages: [formatGreeting(npcData)],
    discoveredSecrets: [],
    toneLog: [],
    stats: { ...INITIAL_STATS },
    currentMood: {
      emotion: npcData.greeting.emotion,
      trust_level: npcData.greeting.trust_level,
    },
    moodHistory: [{
      emotion: npcData.greeting.emotion,
      trust_level: npcData.greeting.trust_level,
      turn: 0,
    }],
  };
}

export default function App() {
  const [selectedNPC, setSelectedNPC] = useState("aldric");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showConfig, setShowConfig] = useState(false);
  const [showLore, setShowLore] = useState(false);
  const [config, setConfig] = useState(DEFAULT_CONFIG);

  // External context from other Cendrebourg projects (Forge + Bestiaire)
  const [externalContext, setExternalContext] = useState(null);

  // Read context from URL on mount
  useEffect(() => {
    const ctx = readContextFromURL();
    if (ctx && (ctx.quest || ctx.creatures)) {
      setExternalContext(ctx);
      clearURLContext();
    }
  }, []);

  // Per-NPC state storage — persists across switches
  const npcStatesRef = useRef({});

  function getNPCState(npcKey) {
    if (!npcStatesRef.current[npcKey]) {
      npcStatesRef.current[npcKey] = createFreshNPCState(npcKey);
    }
    return npcStatesRef.current[npcKey];
  }

  // Force re-render helper
  const [, forceUpdate] = useState(0);
  const rerender = () => forceUpdate((n) => n + 1);

  // Current NPC state
  const state = getNPCState(selectedNPC);
  const npc = NPC_PROFILES[selectedNPC];

  function handleSelectNPC(npcKey) {
    if (npcKey === selectedNPC) return;
    setSelectedNPC(npcKey);
    setError(null);
    rerender();
  }

  function resetConversation() {
    npcStatesRef.current[selectedNPC] = createFreshNPCState(selectedNPC);
    setError(null);
    rerender();
  }

  function resetAllConversations() {
    npcStatesRef.current = {};
    setError(null);
    rerender();
  }

  function checkForSecrets(text, currentSecrets) {
    const lower = text.toLowerCase();
    const newSecrets = [];
    SECRET_KEYWORDS.forEach(({ key, label }) => {
      if (lower.includes(key) && !currentSecrets.includes(label)) {
        newSecrets.push(label);
      }
    });
    if (newSecrets.length > 0) {
      state.discoveredSecrets = [
        ...currentSecrets,
        ...newSecrets.filter((s) => !currentSecrets.includes(s)),
      ];
    }
  }

  // Collect discovered secrets across ALL NPCs
  function getAllDiscoveredSecrets() {
    const all = new Set();
    Object.values(npcStatesRef.current).forEach((s) => {
      s.discoveredSecrets.forEach((secret) => all.add(secret));
    });
    return [...all];
  }

  const handleSendMessage = useCallback(async (text) => {
    if (!text.trim() || isLoading) return;
    setError(null);

    const tones = detectTone(text);
    state.toneLog = [
      ...state.toneLog,
      { message: text.slice(0, 50), tones, timestamp: Date.now() },
    ];

    const userMsg = { role: "user", content: text, tones, timestamp: Date.now() };
    state.messages = [...state.messages, userMsg];
    rerender();
    setIsLoading(true);

    try {
      const apiMessages = state.messages
        .filter((m) => m.role === "user" || m.role === "assistant")
        .map((m) => {
          if (m.role === "assistant") {
            const parts = [];
            if (m.action) parts.push(`*${m.action}*`);
            parts.push(m.dialogue || m.content || "");
            return { role: "assistant", content: parts.join(" ") };
          }
          return { role: "user", content: m.content };
        });

      const systemPrompt = buildSystemPrompt(npc, config, externalContext);

      const result = await sendChatMessage({
        model: config.model,
        maxTokens: config.maxTokens,
        temperature: config.temperature,
        systemPrompt,
        messages: apiMessages,
      });

      // Add structured assistant response
      state.messages = [
        ...state.messages,
        {
          role: "assistant",
          dialogue: result.dialogue,
          action: result.action,
          emotion: result.emotion,
          trust_level: result.trust_level,
          meta: result.meta,
          isStructured: result.isStructured,
          timestamp: Date.now(),
        },
      ];

      // Update mood
      state.currentMood = { emotion: result.emotion, trust_level: result.trust_level };
      state.moodHistory = [...state.moodHistory, { ...state.currentMood, turn: state.moodHistory.length }];

      // Update stats
      const newLatencies = [...state.stats.latencies, result.meta.latency];
      state.stats = {
        messageCount: state.stats.messageCount + 1,
        totalTokens: state.stats.totalTokens + result.meta.totalTokens,
        latencies: newLatencies,
        avgLatency: Math.round(newLatencies.reduce((a, b) => a + b, 0) / newLatencies.length),
        totalCost: state.stats.totalCost + result.meta.cost,
        lastModel: result.meta.model,
      };

      // Check secrets
      checkForSecrets(result.dialogue + " " + (result.action || ""), state.discoveredSecrets);

    } catch (err) {
      setError(err.message);
      state.messages = [
        ...state.messages,
        { role: "system", content: `⚠️ Erreur : ${err.message}`, timestamp: Date.now() },
      ];
    }

    setIsLoading(false);
    rerender();
  }, [selectedNPC, isLoading, npc, config, externalContext]);

  const toggleConfig = () => {
    setShowConfig(!showConfig);
    if (!showConfig) setShowLore(false);
  };

  const toggleLore = () => {
    setShowLore(!showLore);
    if (!showLore) setShowConfig(false);
  };

  const allSecrets = getAllDiscoveredSecrets();

  return (
    <div className="app-container">
      <div className="grain-overlay" />

      <header className="header">
        <div className="header-left">
          <h1 className="header-title">⚔️ Dialogues du Griffon Noir</h1>
          <span className="header-subtitle">PNJ Conversationnel × RPG Investigation</span>
        </div>
        <div className="header-right">
          <button className="icon-btn" onClick={toggleLore} title="Journal de quête">📜</button>
          <button className="icon-btn" onClick={toggleConfig} title="Configuration">⚙️</button>
          <button className="icon-btn" onClick={resetConversation} title="Reset ce PNJ">🔄</button>
          <button className="icon-btn" onClick={resetAllConversations} title="Nouvelle enquête (reset tout)">🗑️</button>
        </div>
      </header>

      <div className="main-layout">
        {/* External context banner */}
        {externalContext && (
          <div className="external-context-banner">
            <div className="external-context-content">
              <span className="external-context-icon">🔗</span>
              <div className="external-context-info">
                {externalContext.quest && (
                  <span className="external-tag quest-tag">🗺️ {externalContext.quest.title}</span>
                )}
                {externalContext.creatures?.map((c, i) => (
                  <span key={i} className="external-tag creature-tag">🐺 {c.name}</span>
                ))}
                <span className="external-hint">Les PNJs sont au courant — posez-leur des questions !</span>
              </div>
            </div>
            <button className="external-dismiss" onClick={() => setExternalContext(null)}>✕</button>
          </div>
        )}

        <Sidebar
          selectedNPC={selectedNPC}
          onSelectNPC={handleSelectNPC}
          stats={state.stats}
          discoveredSecrets={allSecrets}
          currentMood={state.currentMood}
          moodHistory={state.moodHistory}
          npcStates={npcStatesRef.current}
        />

        <ChatArea
          messages={state.messages}
          npc={npc}
          isLoading={isLoading}
          error={error}
          onSendMessage={handleSendMessage}
        />

        {showConfig && (
          <ConfigPanel
            config={config}
            onConfigChange={setConfig}
            toneLog={state.toneLog}
            npc={npc}
            onClose={() => setShowConfig(false)}
          />
        )}

        {showLore && (
          <LorePanel onClose={() => setShowLore(false)} />
        )}
      </div>
    </div>
  );
}
