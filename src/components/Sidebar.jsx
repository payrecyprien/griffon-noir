import { NPC_PROFILES, TOTAL_SECRETS, EMOTIONS, TRUST_LABELS } from "../data/npcs";

function MoodTracker({ currentMood, moodHistory, npcName }) {
  const emotionInfo = EMOTIONS[currentMood.emotion] || EMOTIONS["neutre"];
  const trustLabel = TRUST_LABELS[currentMood.trust_level] || "Neutre";

  // Trust bar segments
  const trustSegments = [1, 2, 3, 4, 5];

  return (
    <div className="mood-box">
      <div className="sidebar-title">Humeur de {npcName}</div>

      {/* Current emotion */}
      <div className="mood-current">
        <span className="mood-emoji">{emotionInfo.emoji}</span>
        <div className="mood-info">
          <span className="mood-emotion" style={{ color: emotionInfo.color }}>
            {currentMood.emotion}
          </span>
          <span className="mood-trust-label">{trustLabel}</span>
        </div>
      </div>

      {/* Trust bar */}
      <div className="trust-bar-container">
        <span className="trust-bar-label">Confiance</span>
        <div className="trust-bar">
          {trustSegments.map((level) => (
            <div
              key={level}
              className="trust-segment"
              style={{
                background: level <= currentMood.trust_level
                  ? getTrustColor(currentMood.trust_level)
                  : "rgba(212, 168, 86, 0.08)",
                transition: "background 0.4s ease",
              }}
            />
          ))}
        </div>
      </div>

      {/* Mood history (last 6) */}
      {moodHistory.length > 1 && (
        <div className="mood-history">
          <span className="mood-history-label">Évolution</span>
          <div className="mood-history-track">
            {moodHistory.slice(-8).map((entry, i) => {
              const info = EMOTIONS[entry.emotion] || EMOTIONS["neutre"];
              return (
                <div
                  key={i}
                  className="mood-history-dot"
                  title={`${entry.emotion} (confiance: ${entry.trust_level})`}
                  style={{
                    background: info.color,
                    width: 8 + entry.trust_level * 3,
                    height: 8 + entry.trust_level * 3,
                  }}
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function getTrustColor(level) {
  const colors = {
    1: "#e07070",
    2: "#d4a856",
    3: "#8b7355",
    4: "#70a8e0",
    5: "#70c070",
  };
  return colors[level] || "#8b7355";
}

export default function Sidebar({ selectedNPC, onSelectNPC, stats, discoveredSecrets, currentMood, moodHistory, npcStates }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-title">Personnages</div>
      {Object.entries(NPC_PROFILES).map(([key, p]) => {
        const hasConversation = npcStates?.[key]?.messages?.length > 1;
        return (
          <button
            key={key}
            onClick={() => onSelectNPC(key)}
            className={`npc-card ${selectedNPC === key ? "active" : ""}`}
          >
            <span className="npc-portrait">{p.portrait}</span>
            <div>
              <div className="npc-name">
                {p.name}
                {hasConversation && selectedNPC !== key && (
                  <span className="npc-active-dot" title="Conversation en cours">●</span>
                )}
              </div>
              <div className="npc-role">{p.title}</div>
            </div>
          </button>
        );
      })}

      {/* Mood tracker */}
      <MoodTracker
        currentMood={currentMood}
        moodHistory={moodHistory}
        npcName={NPC_PROFILES[selectedNPC].name}
      />

      {/* Stats */}
      <div className="stats-box">
        <div className="sidebar-title">Métriques</div>
        <div className="stat-row">
          <span className="stat-label">Messages</span>
          <span className="stat-value">{stats.messageCount}</span>
        </div>
        <div className="stat-row">
          <span className="stat-label">Tokens</span>
          <span className="stat-value">{stats.totalTokens.toLocaleString()}</span>
        </div>
        <div className="stat-row">
          <span className="stat-label">Latence moy.</span>
          <span className="stat-value">{stats.avgLatency}ms</span>
        </div>
        <div className="stat-row">
          <span className="stat-label">Coût estimé</span>
          <span className="stat-value">${stats.totalCost.toFixed(4)}</span>
        </div>
      </div>

      {/* Secrets */}
      <div className="secrets-box">
        <div className="sidebar-title">Secrets découverts</div>
        {discoveredSecrets.length === 0 ? (
          <p className="secret-empty">Aucun secret découvert. Continuez à enquêter...</p>
        ) : (
          discoveredSecrets.map((s, i) => (
            <div key={i} className="secret-item">{s}</div>
          ))
        )}
        <div className="secret-progress">
          {discoveredSecrets.length}/{TOTAL_SECRETS} secrets
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${(discoveredSecrets.length / TOTAL_SECRETS) * 100}%` }}
            />
          </div>
        </div>
      </div>
    </aside>
  );
}
