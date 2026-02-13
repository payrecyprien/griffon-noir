import { useState, useEffect, useCallback } from "react";
import { NPC_PROFILES, SECRET_KEYWORDS } from "./data/npcs";
import { buildSystemPrompt } from "./data/prompts";
import { detectTone } from "./utils/tone";
import { sendChatMessage } from "./utils/api";
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

export default function App() {
  const [selectedNPC, setSelectedNPC] = useState("aldric");
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showConfig, setShowConfig] = useState(false);
  const [showLore, setShowLore] = useState(false);
  const [discoveredSecrets, setDiscoveredSecrets] = useState([]);
  const [toneLog, setToneLog] = useState([]);
  const [stats, setStats] = useState(INITIAL_STATS);
  const [config, setConfig] = useState(DEFAULT_CONFIG);

  // Mood tracking
  const [currentMood, setCurrentMood] = useState({ emotion: "neutre", trust_level: 3 });
  const [moodHistory, setMoodHistory] = useState([]);

  const npc = NPC_PROFILES[selectedNPC];

  // Reset when switching NPC
  useEffect(() => {
    resetConversation();
  }, [selectedNPC]);

  function resetConversation() {
    const npcData = NPC_PROFILES[selectedNPC];
    const greeting = formatGreeting(npcData);
    setMessages([greeting]);
    setDiscoveredSecrets([]);
    setToneLog([]);
    setStats(INITIAL_STATS);
    setError(null);
    setCurrentMood({
      emotion: npcData.greeting.emotion,
      trust_level: npcData.greeting.trust_level,
    });
    setMoodHistory([{
      emotion: npcData.greeting.emotion,
      trust_level: npcData.greeting.trust_level,
      turn: 0,
    }]);
  }

  function checkForSecrets(text) {
    const lower = text.toLowerCase();
    const newSecrets = [];
    SECRET_KEYWORDS.forEach(({ key, label }) => {
      if (lower.includes(key) && !discoveredSecrets.includes(label)) {
        newSecrets.push(label);
      }
    });
    if (newSecrets.length > 0) {
      setDiscoveredSecrets((prev) => [...prev, ...newSecrets.filter((s) => !prev.includes(s))]);
    }
  }

  const handleSendMessage = useCallback(async (text) => {
    if (!text.trim() || isLoading) return;
    setError(null);

    const tones = detectTone(text);
    setToneLog((prev) => [
      ...prev,
      { message: text.slice(0, 50), tones, timestamp: Date.now() },
    ]);

    const userMsg = { role: "user", content: text, tones, timestamp: Date.now() };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setIsLoading(true);

    try {
      // Build API messages — for assistant messages, send the dialogue as content
      // so the LLM sees its own previous responses as plain text
      const apiMessages = updatedMessages
        .filter((m) => m.role === "user" || m.role === "assistant")
        .map((m) => {
          if (m.role === "assistant") {
            // Reconstruct a natural text version for context
            const parts = [];
            if (m.action) parts.push(`*${m.action}*`);
            parts.push(m.dialogue || m.content || "");
            return { role: "assistant", content: parts.join(" ") };
          }
          return { role: "user", content: m.content };
        });

      const systemPrompt = buildSystemPrompt(npc, config);

      const result = await sendChatMessage({
        model: config.model,
        maxTokens: config.maxTokens,
        temperature: config.temperature,
        systemPrompt,
        messages: apiMessages,
      });

      // Add structured assistant response
      setMessages((prev) => [
        ...prev,
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
      ]);

      // Update mood
      const newMood = { emotion: result.emotion, trust_level: result.trust_level };
      setCurrentMood(newMood);
      setMoodHistory((prev) => [...prev, { ...newMood, turn: prev.length }]);

      // Update stats
      setStats((prev) => {
        const newLatencies = [...prev.latencies, result.meta.latency];
        return {
          messageCount: prev.messageCount + 1,
          totalTokens: prev.totalTokens + result.meta.totalTokens,
          latencies: newLatencies,
          avgLatency: Math.round(
            newLatencies.reduce((a, b) => a + b, 0) / newLatencies.length
          ),
          totalCost: prev.totalCost + result.meta.cost,
          lastModel: result.meta.model,
        };
      });

      // Check secrets in dialogue
      checkForSecrets(result.dialogue + " " + (result.action || ""));

    } catch (err) {
      setError(err.message);
      setMessages((prev) => [
        ...prev,
        { role: "system", content: `⚠️ Erreur : ${err.message}`, timestamp: Date.now() },
      ]);
    }

    setIsLoading(false);
  }, [messages, isLoading, npc, config, discoveredSecrets]);

  const toggleConfig = () => {
    setShowConfig(!showConfig);
    if (!showConfig) setShowLore(false);
  };

  const toggleLore = () => {
    setShowLore(!showLore);
    if (!showLore) setShowConfig(false);
  };

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
          <button className="icon-btn" onClick={resetConversation} title="Nouvelle conversation">🔄</button>
        </div>
      </header>

      <div className="main-layout">
        <Sidebar
          selectedNPC={selectedNPC}
          onSelectNPC={setSelectedNPC}
          stats={stats}
          discoveredSecrets={discoveredSecrets}
          currentMood={currentMood}
          moodHistory={moodHistory}
        />

        <ChatArea
          messages={messages}
          npc={npc}
          isLoading={isLoading}
          error={error}
          onSendMessage={handleSendMessage}
        />

        {showConfig && (
          <ConfigPanel
            config={config}
            onConfigChange={setConfig}
            toneLog={toneLog}
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
