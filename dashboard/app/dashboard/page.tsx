"use client";

import { useState, useRef, useEffect } from "react";

const AGENTS = [
  {
    id: "get_insights",
    label: "Insights",
    icon: "⬡",
    desc: "Find out what's actually working",
    color: "#6366f1",
    bg: "rgba(99,102,241,0.08)",
    border: "rgba(99,102,241,0.3)",
    glow: "rgba(99,102,241,0.15)",
    tooltip: "Reads your last 32 tracks from SoundCloud. Compares plays, likes, reposts and comments across your catalog. Claude identifies what's working, what's underperforming, and why — with specific numbers.",
    loading: "Reading your tracks from SoundCloud...",
  },
  {
    id: "get_strategy",
    label: "Strategy",
    icon: "◎",
    desc: "Get a ranked to-do list for this week",
    color: "#10b981",
    bg: "rgba(16,185,129,0.08)",
    border: "rgba(16,185,129,0.3)",
    glow: "rgba(16,185,129,0.15)",
    tooltip: "Takes your latest insight report and builds a ranked 5-step action plan. Each action has a timeframe, expected impact, and rationale tied to your actual data. Ask with a goal like \"more reposts\" to get a focused plan.",
    loading: "Building your action plan from latest insights...",
  },
  {
    id: "get_audience",
    label: "Audience",
    icon: "◉",
    desc: "Understand who's listening and why",
    color: "#f59e0b",
    bg: "rgba(245,158,11,0.08)",
    border: "rgba(245,158,11,0.3)",
    glow: "rgba(245,158,11,0.15)",
    tooltip: "Analyses your engagement score, like rate, and catalog patterns to profile your listener base. Tells you whether your audience is casual or loyal, and what your growth ceiling looks like based on current signals.",
    loading: "Analysing your listener patterns...",
  },
  {
    id: "get_alerts",
    label: "Alerts",
    icon: "◬",
    desc: "See what changed since yesterday",
    color: "#ef4444",
    bg: "rgba(239,68,68,0.08)",
    border: "rgba(239,68,68,0.3)",
    glow: "rgba(239,68,68,0.15)",
    tooltip: "Compares your two most recent SoundCloud snapshots (collected every 15 min). Flags any metric that spiked >15% or dropped >10% — plays, likes, reposts, or comments — and tells you exactly what to do about it.",
    loading: "Scanning for spikes and drops across your tracks...",
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
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@300;400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #334155; border-radius: 2px; }
        @keyframes pulse-dot { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.4;transform:scale(0.8)} }
        @keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-4px)} }
        @keyframes fadeIn { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
        @keyframes tooltipIn { from{opacity:0;transform:translateX(-50%) translateY(-4px)} to{opacity:1;transform:translateX(-50%) translateY(0)} }
        @keyframes shimmer { 0%{opacity:0.4} 50%{opacity:0.8} 100%{opacity:0.4} }
        .agent-tooltip { display: none; }
        .agent-btn:hover .agent-tooltip { display: block; animation: tooltipIn 0.15s ease forwards; }
        .suggestion-chip:hover { border-color: #3b82f6 !important; color: #e2e8f0 !important; background: rgba(59,130,246,0.06) !important; }
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
          <span style={{ fontSize: "0.7rem", color: "#64748b", fontFamily: "'IBM Plex Mono', monospace" }}>Garik · SoundCloud</span>
        </div>
      </header>

      {/* Agent Trigger Pads */}
      <div style={{ padding: "1rem 1.5rem", borderBottom: "1px solid #1e293b", flexShrink: 0 }}>
        <p style={{ fontSize: "0.65rem", color: "#64748b", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "0.75rem", fontFamily: "'IBM Plex Mono', monospace" }}>
          Analyze your music →
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
                <div style={{ fontSize: "0.68rem", color: "#8899b0", lineHeight: 1.3 }}>{agent.desc}</div>
                {/* Tooltip */}
                <div className="agent-tooltip" style={{
                  position: "absolute", top: "calc(100% + 8px)", left: "50%",
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
                  boxShadow: `0 4px 20px rgba(0,0,0,0.4)`,
                  textAlign: "left",
                }}>
                  <div style={{ color: agent.color, fontSize: "0.65rem", fontWeight: 600, marginBottom: "0.3rem", letterSpacing: "0.06em", textTransform: "uppercase" }}>{agent.label} agent</div>
                  {agent.tooltip}
                  <div style={{
                    position: "absolute", top: "-5px", left: "50%", transform: "translateX(-50%)",
                    width: "8px", height: "8px", background: "#0d1625",
                    border: `1px solid ${agent.border}`, borderBottom: "none", borderRight: "none",
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
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "300px", gap: "1.75rem" }}>

            {/* Preview card */}
            <div style={{ width: "100%", maxWidth: "520px", background: "#131f35", border: "1px solid #1e293b", borderRadius: "12px", padding: "1rem 1.125rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.75rem", paddingBottom: "0.625rem", borderBottom: "1px solid #1e293b" }}>
                <span style={{ color: "#6366f1", fontSize: "0.75rem" }}>⬡</span>
                <span style={{ color: "#475569", fontSize: "0.65rem", fontFamily: "'IBM Plex Mono', monospace", letterSpacing: "0.05em" }}>INSIGHTS AGENT · EXAMPLE OUTPUT</span>
              </div>
              <p style={{ fontSize: "0.78rem", color: "#8899b0", lineHeight: 1.6, marginBottom: "0.75rem" }}>
                Your top track has <strong style={{ color: "#e2e8f0" }}>3.75× more reposts</strong> than your catalog average — and it's the only track with a description. Your like rate is a consistent <strong style={{ color: "#e2e8f0" }}>6–7%</strong> across all tracks, which means your audience quality is strong. The bottleneck is <strong style={{ color: "#e2e8f0" }}>reach, not quality.</strong>
              </p>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                {[["6.8", "Engagement score"], ["32", "Tracks analysed"], ["3.75×", "Top repost gap"]].map(([val, label]) => (
                  <div key={label} style={{ flex: 1, background: "#0d1625", borderRadius: "6px", padding: "0.5rem 0.625rem" }}>
                    <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "#e2e8f0" }}>{val}</div>
                    <div style={{ fontSize: "0.62rem", color: "#475569", marginTop: "0.1rem" }}>{label}</div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: "0.625rem", fontSize: "0.65rem", color: "#334155", fontFamily: "'IBM Plex Mono', monospace" }}>
                ↑ Click any agent above to run this on your real data
              </div>
            </div>

            {/* Suggestion chips */}
            <div style={{ width: "100%", maxWidth: "520px" }}>
              <p style={{ fontSize: "0.65rem", color: "#64748b", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "0.625rem", fontFamily: "'IBM Plex Mono', monospace" }}>
                Or ask anything:
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                {SUGGESTIONS.map((s, i) => (
                  <button key={i} onClick={() => send(s)} className="suggestion-chip" style={{
                    textAlign: "left", fontSize: "0.75rem", color: "#8899b0",
                    border: "1px solid #1e293b", borderRadius: "8px",
                    padding: "0.625rem 0.875rem", background: "#131f35",
                    cursor: "pointer", transition: "all 0.15s",
                    borderLeft: "2px solid #1e3a5f",
                  }}>
                    {s}
                  </button>
                ))}
              </div>
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
                  <span style={{ color: "#64748b", fontSize: "0.7rem", fontFamily: "'IBM Plex Mono', monospace", marginLeft: "0.25rem" }}>
                    {activeAgent ? AGENTS.find(a => a.id === activeAgent)?.loading : "Analyzing..."}
                  </span>
                </div>
              </div>
            )}

            {/* Persistent suggestion chips below conversation */}
            {!loading && messages.length > 0 && (
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", paddingTop: "0.25rem" }}>
                {SUGGESTIONS.map((s, i) => (
                  <button key={i} onClick={() => send(s)} className="suggestion-chip" style={{
                    fontSize: "0.7rem", color: "#64748b",
                    border: "1px solid #1e293b", borderRadius: "20px",
                    padding: "0.35rem 0.75rem", background: "transparent",
                    cursor: "pointer", transition: "all 0.15s",
                  }}>
                    {s}
                  </button>
                ))}
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
              placeholder='e.g. "Why is one track getting 3× more reposts than the others?"'
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
            {input.length > 400 && (
              <span style={{ position: "absolute", right: "0.625rem", top: "50%", transform: "translateY(-50%)", fontSize: "0.6rem", color: input.length > 480 ? "#ef4444" : "#64748b", fontFamily: "'IBM Plex Mono', monospace" }}>
                {input.length}/500
              </span>
            )}
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
      </div>
    </div>
  );
}
