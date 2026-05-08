"use client";

import { useState, useRef, useEffect } from "react";

const AGENTS = [
  {
    id: "get_insights",
    label: "Insights",
    icon: "⬡",
    desc: "Patterns & track performance",
    color: "#6366f1",
    bg: "rgba(99,102,241,0.08)",
    border: "rgba(99,102,241,0.3)",
    glow: "rgba(99,102,241,0.15)",
    tooltip: "Reads your last 32 tracks from SoundCloud. Compares plays, likes, reposts and comments across your catalog. Claude identifies what\'s working, what\'s underperforming, and why — with specific numbers.",
  },
  {
    id: "get_strategy",
    label: "Strategy",
    icon: "◎",
    desc: "Ranked action plan",
    color: "#10b981",
    bg: "rgba(16,185,129,0.08)",
    border: "rgba(16,185,129,0.3)",
    glow: "rgba(16,185,129,0.15)",
    tooltip: "Takes your latest insight report and builds a ranked 5-step action plan. Each action has a timeframe, expected impact, and rationale tied to your actual data. Ask with a goal like \"more reposts\" to get a focused plan.",
  },
  {
    id: "get_audience",
    label: "Audience",
    icon: "◉",
    desc: "Listener analysis",
    color: "#f59e0b",
    bg: "rgba(245,158,11,0.08)",
    border: "rgba(245,158,11,0.3)",
    glow: "rgba(245,158,11,0.15)",
    tooltip: "Analyses your engagement score, like rate, and catalog patterns to profile your listener base. Tells you whether your audience is casual or loyal, and what your growth ceiling looks like based on current signals.",
  },
  {
    id: "get_alerts",
    label: "Alerts",
    icon: "◬",
    desc: "Anomaly detection",
    color: "#ef4444",
    bg: "rgba(239,68,68,0.08)",
    border: "rgba(239,68,68,0.3)",
    glow: "rgba(239,68,68,0.15)",
    tooltip: "Compares your two most recent SoundCloud snapshots (collected every 15 min). Flags any metric that spiked >15% or dropped >10% — plays, likes, reposts, or comments — and tells you exactly what to do about it.",
  },
];

const SUGGESTIONS = [
  "What's my best track and why?",
  "How do I get more reposts?",
  "What should I focus on this week?",
  "Who is listening to my music?",
];

type Message = {
  role: "user" | "assistant";
  content: string;
  tool?: string | null;
};

function MarkdownText({ text }: { text: string }) {
  const lines = text.split("\n");
  return (
    <div className="space-y-1.5">
      {lines.map((line, i) => {
        if (line.startsWith("### "))
          return (
            <h3 key={i} style={{ color: "#94a3b8", fontSize: "0.7rem", letterSpacing: "0.12em", textTransform: "uppercase", marginTop: "1rem", marginBottom: "0.25rem", fontWeight: 600 }}>
              {line.slice(4)}
            </h3>
          );
        if (line.startsWith("## "))
          return (
            <h2 key={i} style={{ color: "#e2e8f0", fontSize: "0.85rem", fontWeight: 600, marginTop: "1rem", marginBottom: "0.25rem" }}>
              {line.slice(3)}
            </h2>
          );
        if (line.startsWith("# "))
          return (
            <h1 key={i} style={{ color: "#f1f5f9", fontSize: "1rem", fontWeight: 700, marginTop: "1rem", marginBottom: "0.5rem" }}>
              {line.slice(2)}
            </h1>
          );
        if (line.startsWith("- ") || line.startsWith("* "))
          return (
            <div key={i} style={{ display: "flex", gap: "0.5rem", color: "#cbd5e1" }}>
              <span style={{ color: "#3b82f6", marginTop: "0.2rem", flexShrink: 0 }}>›</span>
              <span dangerouslySetInnerHTML={{ __html: line.slice(2).replace(/\*\*(.*?)\*\*/g, '<strong style="color:#e2e8f0">$1</strong>') }} />
            </div>
          );
        if (line.match(/^\d+\./))
          return (
            <div key={i} style={{ display: "flex", gap: "0.75rem", color: "#cbd5e1" }}>
              <span style={{ color: "#3b82f6", flexShrink: 0, fontSize: "0.75rem", marginTop: "0.15rem", minWidth: "1rem" }}>
                {line.match(/^\d+/)?.[0]}
              </span>
              <span dangerouslySetInnerHTML={{ __html: line.replace(/^\d+\.\s*/, "").replace(/\*\*(.*?)\*\*/g, '<strong style="color:#e2e8f0">$1</strong>') }} />
            </div>
          );
        if (line.trim() === "") return <div key={i} style={{ height: "0.25rem" }} />;
        return (
          <p key={i} style={{ color: "#cbd5e1", lineHeight: "1.6" }}
            dangerouslySetInnerHTML={{ __html: line.replace(/\*\*(.*?)\*\*/g, '<strong style="color:#e2e8f0">$1</strong>') }}
          />
        );
      })}
    </div>
  );
}

export default function Dashboard() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeAgent, setActiveAgent] = useState<string | null>(null);
  const [pressedAgent, setPressedAgent] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function send(message: string, agent?: string) {
    if (!message.trim() || loading) return;
    setMessages((prev) => [...prev, { role: "user", content: message }]);
    setInput("");
    setLoading(true);
    setActiveAgent(agent || null);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, agent }),
      });
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.error ? `Error: ${data.error}` : data.response, tool: data.tool },
      ]);
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "Connection error. Please try again.", tool: null }]);
    } finally {
      setLoading(false);
      setActiveAgent(null);
    }
  }

  function handleAgent(agent: typeof AGENTS[0]) {
    if (loading) return;
    setPressedAgent(agent.id);
    setTimeout(() => setPressedAgent(null), 300);
    send(`Run ${agent.label.toLowerCase()} analysis`, agent.id);
  }

  const isEmpty = messages.length === 0;

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0f172a",
      color: "#e2e8f0",
      display: "flex",
      flexDirection: "column",
      fontFamily: "'IBM Plex Sans', 'Helvetica Neue', sans-serif",
    }}>
      {/* Google Fonts */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@300;400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #334155; border-radius: 2px; }
        @keyframes pulse-dot { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.4;transform:scale(0.8)} }
        @keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-4px)} }
        @keyframes fadeIn { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
        @keyframes tooltipIn { from{opacity:0;transform:translateY(4px)} to{opacity:1;transform:translateY(0)} }
        .agent-tooltip { display: none; }
        .agent-btn:hover .agent-tooltip { display: block; animation: tooltipIn 0.15s ease forwards; }
      `}</style>

      {/* Header */}
      <header style={{
        borderBottom: "1px solid #1e293b",
        padding: "0 1.5rem",
        height: "52px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexShrink: 0,
        background: "#0f172a",
        position: "sticky",
        top: 0,
        zIndex: 10,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div style={{ width: "24px", height: "24px", borderRadius: "6px", background: "linear-gradient(135deg, #3b82f6, #6366f1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.7rem", color: "white", fontWeight: 700 }}>SP</div>
          <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "#f1f5f9", letterSpacing: "-0.01em" }}>SoundPulse</span>
          <span style={{ fontSize: "0.75rem", color: "#475569", marginLeft: "0.25rem" }}>Analytics</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#10b981", animation: "pulse-dot 2s infinite" }} />
          <span style={{ fontSize: "0.7rem", color: "#64748b", fontFamily: "'IBM Plex Mono', monospace" }}>uid:1329042120</span>
        </div>
      </header>

      {/* Agent Trigger Pads */}
      <div style={{
        padding: "1rem 1.5rem",
        borderBottom: "1px solid #1e293b",
        flexShrink: 0,
      }}>
        <p style={{ fontSize: "0.65rem", color: "#475569", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "0.75rem", fontFamily: "'IBM Plex Mono', monospace" }}>
          Run an agent
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.625rem" }}>
          {AGENTS.map((agent) => {
            const isActive = activeAgent === agent.id;
            const isPressed = pressedAgent === agent.id;
            return (
              <button
                key={agent.id}
                onClick={() => handleAgent(agent)}
                disabled={loading}
                className="agent-btn"
                style={{
                  background: isActive ? agent.bg : "#131f35",
                  border: `1px solid ${isActive ? agent.border : "#1e293b"}`,
                  borderRadius: "10px",
                  padding: "0.875rem",
                  cursor: loading ? "not-allowed" : "pointer",
                  textAlign: "left",
                  transition: "all 0.15s ease",
                  transform: isPressed ? "scale(0.97) translateY(1px)" : "scale(1)",
                  boxShadow: isActive ? `0 0 20px ${agent.glow}` : "none",
                  opacity: loading && !isActive ? 0.5 : 1,
                  position: "relative",
                  overflow: "visible",
                }}
                onMouseEnter={(e) => {
                  if (!loading) {
                    const el = e.currentTarget;
                    el.style.border = `1px solid ${agent.border}`;
                    el.style.background = agent.bg;
                    el.style.transform = "translateY(-1px)";
                    el.style.boxShadow = `0 4px 20px ${agent.glow}`;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    const el = e.currentTarget;
                    el.style.border = "1px solid #1e293b";
                    el.style.background = "#131f35";
                    el.style.transform = "translateY(0)";
                    el.style.boxShadow = "none";
                  }
                }}
              >
                <div style={{ fontSize: "1.1rem", marginBottom: "0.4rem", color: agent.color }}>{agent.icon}</div>
                <div style={{ fontSize: "0.8rem", fontWeight: 600, color: "#e2e8f0", marginBottom: "0.2rem" }}>{agent.label}</div>
                <div style={{ fontSize: "0.68rem", color: "#64748b", lineHeight: 1.3 }}>{agent.desc}</div>
                <div className="agent-tooltip" style={{
                  position: "absolute", bottom: "calc(100% + 8px)", left: "50%",
                  transform: "translateX(-50%)",
                  width: "220px",
                  background: "#0d1625",
                  border: `1px solid ${agent.border}`,
                  borderRadius: "8px",
                  padding: "0.625rem 0.75rem",
                  fontSize: "0.7rem",
                  color: "#94a3b8",
                  lineHeight: 1.55,
                  zIndex: 50,
                  pointerEvents: "none",
                  boxShadow: `0 4px 20px rgba(0,0,0,0.4), 0 0 0 1px ${agent.border}`,
                }}>
                  <div style={{ color: agent.color, fontSize: "0.65rem", fontWeight: 600, marginBottom: "0.3rem", letterSpacing: "0.06em", textTransform: "uppercase" }}>{agent.label} agent</div>
                  {agent.tooltip}
                  <div style={{
                    position: "absolute", bottom: "-5px", left: "50%", transform: "translateX(-50%)",
                    width: "8px", height: "8px", background: "#0d1625",
                    border: `1px solid ${agent.border}`, borderTop: "none", borderLeft: "none",
                    rotate: "45deg",
                  }} />
                </div>
                {isActive && (
                  <div style={{
                    position: "absolute", bottom: 0, left: 0, right: 0, height: "2px",
                    background: `linear-gradient(90deg, transparent, ${agent.color}, transparent)`,
                    animation: "pulse-dot 1s infinite",
                  }} />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "1.25rem 1.5rem" }}>
        {isEmpty ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "280px", gap: "2rem" }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem", opacity: 0.15 }}>⬡</div>
              <p style={{ color: "#475569", fontSize: "0.875rem" }}>Select an agent or ask anything below</p>
              <p style={{ color: "#334155", fontSize: "0.75rem", marginTop: "0.25rem" }}>Claude routes your question to the right agent automatically</p>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", width: "100%", maxWidth: "480px" }}>
              {SUGGESTIONS.map((s, i) => (
                <button key={i} onClick={() => send(s)} style={{
                  textAlign: "left", fontSize: "0.75rem", color: "#64748b",
                  border: "1px solid #1e293b", borderRadius: "8px",
                  padding: "0.625rem 0.75rem", background: "#131f35",
                  cursor: "pointer", transition: "all 0.15s",
                }}
                  onMouseEnter={e => { e.currentTarget.style.color = "#94a3b8"; e.currentTarget.style.borderColor = "#334155"; }}
                  onMouseLeave={e => { e.currentTarget.style.color = "#64748b"; e.currentTarget.style.borderColor = "#1e293b"; }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ maxWidth: "720px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            {messages.map((msg, i) => (
              <div key={i} style={{ display: "flex", gap: "0.75rem", justifyContent: msg.role === "user" ? "flex-end" : "flex-start", animation: "fadeIn 0.2s ease" }}>
                {msg.role === "assistant" && (
                  <div style={{ flexShrink: 0, width: "28px", height: "28px", borderRadius: "8px", background: "linear-gradient(135deg, #3b82f6, #6366f1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.65rem", color: "white", fontWeight: 700, marginTop: "2px" }}>
                    SP
                  </div>
                )}
                <div style={{
                  maxWidth: "580px",
                  borderRadius: "12px",
                  padding: "0.875rem 1rem",
                  fontSize: "0.8rem",
                  background: msg.role === "user" ? "#1e3a5f" : "#131f35",
                  border: `1px solid ${msg.role === "user" ? "#2563eb33" : "#1e293b"}`,
                }}>
                  {msg.tool && (() => {
                    const agent = AGENTS.find(a => a.id === msg.tool);
                    return (
                      <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.625rem", paddingBottom: "0.625rem", borderBottom: "1px solid #1e293b" }}>
                        <span style={{ color: agent?.color, fontSize: "0.75rem" }}>{agent?.icon}</span>
                        <span style={{ color: "#475569", fontSize: "0.65rem", fontFamily: "'IBM Plex Mono', monospace", letterSpacing: "0.05em" }}>
                          {agent?.label?.toUpperCase()} AGENT
                        </span>
                      </div>
                    );
                  })()}
                  {msg.role === "assistant" ? <MarkdownText text={msg.content} /> : (
                    <span style={{ color: "#e2e8f0" }}>{msg.content}</span>
                  )}
                </div>
                {msg.role === "user" && (
                  <div style={{ flexShrink: 0, width: "28px", height: "28px", borderRadius: "8px", background: "#1e293b", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.65rem", color: "#64748b", marginTop: "2px" }}>
                    G
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div style={{ display: "flex", gap: "0.75rem", animation: "fadeIn 0.2s ease" }}>
                <div style={{ flexShrink: 0, width: "28px", height: "28px", borderRadius: "8px", background: "linear-gradient(135deg, #3b82f6, #6366f1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.65rem", color: "white", fontWeight: 700 }}>
                  SP
                </div>
                <div style={{ background: "#131f35", border: "1px solid #1e293b", borderRadius: "12px", padding: "0.875rem 1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  {[0, 150, 300].map((delay, i) => (
                    <div key={i} style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#3b82f6", animation: `bounce 0.8s ${delay}ms infinite` }} />
                  ))}
                  <span style={{ color: "#475569", fontSize: "0.7rem", fontFamily: "'IBM Plex Mono', monospace", marginLeft: "0.25rem" }}>
                    {activeAgent ? `${AGENTS.find(a => a.id === activeAgent)?.label} agent running...` : "Analyzing..."}
                  </span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <div style={{ borderTop: "1px solid #1e293b", padding: "0.875rem 1.5rem", flexShrink: 0, background: "#0f172a" }}>
        <div style={{ maxWidth: "720px", margin: "0 auto", display: "flex", gap: "0.625rem" }}>
          <div style={{ flex: 1, position: "relative" }}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value.slice(0, 500))}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send(input)}
              placeholder="Ask about your tracks, audience, or growth..."
              disabled={loading}
              style={{
                width: "100%", background: "#131f35", border: "1px solid #1e293b",
                borderRadius: "8px", padding: "0.625rem 3rem 0.625rem 0.875rem",
                fontSize: "0.8rem", color: "#e2e8f0", outline: "none",
                fontFamily: "'IBM Plex Sans', sans-serif",
                transition: "border-color 0.15s",
                opacity: loading ? 0.5 : 1,
              }}
              onFocus={e => e.target.style.borderColor = "#3b82f6"}
              onBlur={e => e.target.style.borderColor = "#1e293b"}
            />
            <span style={{ position: "absolute", right: "0.625rem", top: "50%", transform: "translateY(-50%)", fontSize: "0.6rem", color: "#334155", fontFamily: "'IBM Plex Mono', monospace" }}>
              {input.length}/500
            </span>
          </div>
          <button
            onClick={() => send(input)}
            disabled={loading || !input.trim()}
            style={{
              padding: "0.625rem 1.125rem", background: "#3b82f6", color: "white",
              border: "none", borderRadius: "8px", fontSize: "0.75rem", fontWeight: 600,
              cursor: loading || !input.trim() ? "not-allowed" : "pointer",
              opacity: loading || !input.trim() ? 0.4 : 1,
              transition: "all 0.15s", letterSpacing: "0.02em",
              fontFamily: "'IBM Plex Sans', sans-serif",
            }}
            onMouseEnter={e => { if (!loading && input.trim()) e.currentTarget.style.background = "#2563eb"; }}
            onMouseLeave={e => e.currentTarget.style.background = "#3b82f6"}
          >
            Send
          </button>
        </div>
        <p style={{ maxWidth: "720px", margin: "0.5rem auto 0", fontSize: "0.65rem", color: "#334155", fontFamily: "'IBM Plex Mono', monospace" }}>
          SoundPulse only answers questions about SoundCloud analytics and creator strategy
        </p>
      </div>
    </div>
  );
}