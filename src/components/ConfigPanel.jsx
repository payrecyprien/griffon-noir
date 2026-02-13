import { TONE_LABELS, TONE_COLORS } from "../utils/tone";
import { buildSystemPrompt } from "../data/prompts";

export default function ConfigPanel({ config, onConfigChange, toneLog, npc, onClose }) {
  const systemPrompt = buildSystemPrompt(npc, config);
  const wordCount = systemPrompt.split(/\s+/).length;

  return (
    <aside className="right-panel">
      <div className="panel-header">
        <h3 className="panel-title">⚙️ Configuration Prompt</h3>
        <button className="close-btn" onClick={onClose}>✕</button>
      </div>

      {/* Model selection */}
      <div className="config-section">
        <label className="config-label">Modèle</label>
        <select
          className="config-select"
          value={config.model}
          onChange={(e) => onConfigChange({ ...config, model: e.target.value })}
        >
          <option value="claude-sonnet-4-20250514">Claude Sonnet 4 (meilleur, +cher)</option>
          <option value="claude-haiku-4-5-20251001">Claude Haiku 4.5 (rapide, -cher)</option>
        </select>
      </div>

      {/* Temperature */}
      <div className="config-section">
        <label className="config-label">Température : {config.temperature}</label>
        <input
          type="range"
          min="0" max="1" step="0.1"
          className="config-range"
          value={config.temperature}
          onChange={(e) => onConfigChange({ ...config, temperature: parseFloat(e.target.value) })}
        />
        <div className="range-labels">
          <span>Déterministe</span>
          <span>Créatif</span>
        </div>
      </div>

      {/* Max tokens */}
      <div className="config-section">
        <label className="config-label">Max tokens : {config.maxTokens}</label>
        <input
          type="range"
          min="100" max="800" step="50"
          className="config-range"
          value={config.maxTokens}
          onChange={(e) => onConfigChange({ ...config, maxTokens: parseInt(e.target.value) })}
        />
        <div className="range-labels">
          <span>Court (rapide)</span>
          <span>Long (détaillé)</span>
        </div>
      </div>

      {/* Response length */}
      <div className="config-section">
        <label className="config-label">
          Longueur réponse : {config.minLength}–{config.maxLength} mots
        </label>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input
            type="number"
            min="10" max="80"
            className="config-number"
            value={config.minLength}
            onChange={(e) => onConfigChange({ ...config, minLength: parseInt(e.target.value) })}
          />
          <span style={{ color: "#8b7355" }}>—</span>
          <input
            type="number"
            min="40" max="250"
            className="config-number"
            value={config.maxLength}
            onChange={(e) => onConfigChange({ ...config, maxLength: parseInt(e.target.value) })}
          />
        </div>
      </div>

      {/* System prompt preview */}
      <div className="config-section">
        <label className="config-label">System Prompt (aperçu)</label>
        <pre className="prompt-preview">
          {systemPrompt.slice(0, 800)}...
        </pre>
        <div className="prompt-length">~{wordCount} mots · ~{Math.round(wordCount * 1.3)} tokens estimés</div>
      </div>

      {/* Tone analysis log */}
      <div className="config-section">
        <label className="config-label">📊 Log des tons détectés</label>
        <div className="tone-log-box">
          {toneLog.length === 0 ? (
            <span className="secret-empty">Aucun message analysé</span>
          ) : (
            toneLog.slice(-10).map((entry, i) => (
              <div key={i} className="tone-log-entry">
                <span className="tone-log-msg">"{entry.message}..."</span>
                <span className="tone-badges">
                  {entry.tones.map((tone) => (
                    <span
                      key={tone}
                      className="tone-badge-small"
                      style={TONE_COLORS[tone] || TONE_COLORS.neutral}
                    >
                      {TONE_LABELS[tone] || tone}
                    </span>
                  ))}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </aside>
  );
}
