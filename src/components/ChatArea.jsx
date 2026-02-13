import { useRef, useEffect } from "react";
import { TONE_LABELS, TONE_COLORS } from "../utils/tone";
import { EMOTIONS } from "../data/npcs";

function ToneBadge({ tone }) {
  const style = TONE_COLORS[tone] || TONE_COLORS.neutral;
  return (
    <span className="tone-badge" style={style}>
      {TONE_LABELS[tone] || tone}
    </span>
  );
}

function EmotionBadge({ emotion }) {
  const info = EMOTIONS[emotion] || EMOTIONS["neutre"];
  return (
    <span
      className="emotion-badge"
      style={{ color: info.color, borderColor: info.color + "60", background: info.color + "15" }}
    >
      {info.emoji} {emotion}
    </span>
  );
}

function Message({ msg, npc }) {
  if (msg.role === "system") {
    return (
      <div className="message system">
        <div className="message-content">{msg.content}</div>
      </div>
    );
  }

  if (msg.role === "user") {
    return (
      <div className="message user">
        <div className="message-sender">
          <span className="sender-portrait">🗡️</span>
          <span className="sender-name">Vous</span>
          {msg.tones && (
            <span className="tone-badges">
              {msg.tones.map((t) => <ToneBadge key={t} tone={t} />)}
            </span>
          )}
        </div>
        <div className="message-content">{msg.content}</div>
      </div>
    );
  }

  // Assistant message (structured)
  return (
    <div className="message npc">
      <div className="message-sender">
        <span className="sender-portrait">{npc.portrait}</span>
        <span className="sender-name">{npc.name}</span>
        {msg.emotion && <EmotionBadge emotion={msg.emotion} />}
        {msg.meta && (
          <span className="message-meta">
            {msg.meta.latency}ms · {msg.meta.totalTokens} tok · ${msg.meta.cost.toFixed(4)}
          </span>
        )}
      </div>
      {msg.action && (
        <div className="message-action">*{msg.action}*</div>
      )}
      <div className="message-content">{msg.dialogue || msg.content}</div>
    </div>
  );
}

function TypingIndicator({ npc }) {
  return (
    <div className="message npc">
      <div className="message-sender">
        <span className="sender-portrait">{npc.portrait}</span>
        <span className="sender-name">{npc.name}</span>
      </div>
      <div className="typing">
        <span>●</span>
        <span>●</span>
        <span>●</span>
      </div>
    </div>
  );
}

export default function ChatArea({ messages, npc, isLoading, error, onSendMessage }) {
  const chatEndRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  useEffect(() => {
    if (!isLoading) textareaRef.current?.focus();
  }, [isLoading]);

  const handleSubmit = () => {
    const value = textareaRef.current?.value?.trim();
    if (!value || isLoading) return;
    onSendMessage(value);
    textareaRef.current.value = "";
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <main className="chat-area">
      <div className="chat-messages">
        {messages.map((msg, i) => (
          <Message key={i} msg={msg} npc={npc} />
        ))}
        {isLoading && <TypingIndicator npc={npc} />}
        <div ref={chatEndRef} />
      </div>

      <div className="input-area">
        {error && <div className="error-banner">⚠️ {error}</div>}
        <div className="input-row">
          <textarea
            ref={textareaRef}
            className="chat-input"
            onKeyDown={handleKeyDown}
            placeholder="Parlez au PNJ... (Entrée pour envoyer)"
            rows={1}
            disabled={isLoading}
          />
          <button className="send-btn" onClick={handleSubmit} disabled={isLoading}>
            ➤
          </button>
        </div>
        <div className="input-hints">
          💡 Essayez : être amical, menaçant, poser des questions précises, offrir de l'aide, ou tenter un jailbreak
        </div>
      </div>
    </main>
  );
}
