"use client";

import { useEffect, useState } from "react";

export default function Landing() {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handle = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handle);
    return () => window.removeEventListener("scroll", handle);
  }, []);

  return (
    <div style={{
      background: "#080c14",
      color: "#e8eaf0",
      fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif",
      overflowX: "hidden",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500&family=Playfair+Display:ital,wght@0,700;1,400&family=DM+Mono:wght@400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 3px; }
        ::-webkit-scrollbar-thumb { background: #1e3a5f; }
        a { color: inherit; text-decoration: none; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.3; } }
        @keyframes scan { from { transform: translateY(-100%); } to { transform: translateY(100vh); } }
        @media (max-width: 640px) {
          .nav-links { display: none; }
          .hero-title { font-size: 2.25rem; }
          section { padding-left: 1.25rem; padding-right: 1.25rem; }
        }
        .fade-up { animation: fadeUp 0.8s ease forwards; }
        .fade-up-2 { animation: fadeUp 0.8s 0.15s ease forwards; opacity: 0; }
        .fade-up-3 { animation: fadeUp 0.8s 0.3s ease forwards; opacity: 0; }
        .fade-up-4 { animation: fadeUp 0.8s 0.45s ease forwards; opacity: 0; }
        .agent-card:hover { border-color: rgba(59,130,246,0.4) !important; background: rgba(59,130,246,0.05) !important; transform: translateY(-2px); }
        .cta-btn:hover { background: #2563eb !important; transform: translateY(-1px); box-shadow: 0 8px 30px rgba(59,130,246,0.3) !important; }
        .secondary-btn:hover { border-color: #3b82f6 !important; color: #3b82f6 !important; }
      `}</style>

      {/* Nav */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        padding: "1.25rem 2rem",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        background: scrollY > 50 ? "rgba(8,12,20,0.95)" : "transparent",
        backdropFilter: scrollY > 50 ? "blur(12px)" : "none",
        borderBottom: scrollY > 50 ? "1px solid rgba(255,255,255,0.05)" : "none",
        transition: "all 0.3s ease",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
          <div style={{ width: "28px", height: "28px", borderRadius: "7px", background: "linear-gradient(135deg, #3b82f6, #6366f1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.7rem", color: "white", fontWeight: 700, fontFamily: "'DM Mono', monospace" }}>SP</div>
          <span style={{ fontSize: "0.9rem", fontWeight: 500, letterSpacing: "-0.01em" }}>SoundPulse</span>
        </div>
        <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
          <a href="#story" style={{ fontSize: "0.8rem", color: "#64748b", transition: "color 0.2s" }}
            onMouseEnter={e => (e.currentTarget.style.color = "#e8eaf0")}
            onMouseLeave={e => (e.currentTarget.style.color = "#64748b")}>
            Story
          </a>
          <a href="#how" style={{ fontSize: "0.8rem", color: "#64748b", transition: "color 0.2s" }}
            onMouseEnter={e => (e.currentTarget.style.color = "#e8eaf0")}
            onMouseLeave={e => (e.currentTarget.style.color = "#64748b")}>
            How it works
          </a>
          <a href="/dashboard" className="cta-btn" style={{
            fontSize: "0.8rem", fontWeight: 500,
            background: "#3b82f6", color: "white",
            padding: "0.5rem 1.125rem", borderRadius: "7px",
            transition: "all 0.2s",
          }}>
            Try it →
          </a>
        </div>
      </nav>

      {/* Hero */}
      <section style={{
        minHeight: "100vh", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        padding: "8rem 2rem 4rem", textAlign: "center", position: "relative",
        overflow: "hidden",
      }}>
        {/* Background glow */}
        <div style={{
          position: "absolute", top: "20%", left: "50%", transform: "translateX(-50%)",
          width: "600px", height: "600px", borderRadius: "50%",
          background: "radial-gradient(circle, rgba(59,130,246,0.08) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />

        <div className="fade-up" style={{ marginBottom: "1.25rem" }}>
          <span style={{
            fontSize: "0.7rem", fontFamily: "'DM Mono', monospace",
            letterSpacing: "0.15em", color: "#3b82f6",
            border: "1px solid rgba(59,130,246,0.3)", borderRadius: "100px",
            padding: "0.35rem 0.875rem",
          }}>
            MCP · ANALYTICS · AI
          </span>
        </div>

        <h1 className="fade-up-2" style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: "clamp(2.5rem, 7vw, 5rem)",
          fontWeight: 700, lineHeight: 1.1,
          letterSpacing: "-0.02em",
          maxWidth: "800px", marginBottom: "1.5rem",
        }}>
          SoundCloud analytics,<br />
          <em style={{ fontStyle: "italic", color: "#3b82f6" }}>reimagined</em> for the AI era.
        </h1>

        <p className="fade-up-3" style={{
          fontSize: "1.05rem", color: "#94a3b8", lineHeight: 1.7,
          maxWidth: "520px", marginBottom: "2.5rem",
        }}>
          SoundPulse is an AI-native intelligence layer for SoundCloud creators.
          Not a dashboard — a reasoning engine that understands your music.
        </p>

        <div className="fade-up-4" style={{ display: "flex", gap: "0.875rem", flexWrap: "wrap", justifyContent: "center" }}>
          <a href="/dashboard" className="cta-btn" style={{
            background: "#3b82f6", color: "white", fontWeight: 500,
            padding: "0.875rem 2rem", borderRadius: "9px", fontSize: "0.9rem",
            transition: "all 0.2s", display: "inline-flex", alignItems: "center", gap: "0.5rem",
          }}>
            Open the app <span>→</span>
          </a>
          <a href="#how" className="secondary-btn" style={{
            border: "1px solid #1e293b", color: "#94a3b8",
            padding: "0.875rem 2rem", borderRadius: "9px", fontSize: "0.9rem",
            transition: "all 0.2s",
          }}>
            See how it works
          </a>
        </div>

        {/* Live indicator */}
        <div style={{ marginTop: "3rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#10b981", animation: "pulse 2s infinite" }} />
          <span style={{ fontSize: "0.72rem", color: "#475569", fontFamily: "'DM Mono', monospace" }}>Live on SoundCloud data · Powered by Claude</span>
        </div>
      </section>

      {/* Problem */}
      <section style={{ padding: "5rem 2rem", maxWidth: "900px", margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "2rem", alignItems: "center" }}>
          <div>
            <p style={{ fontSize: "0.7rem", fontFamily: "'DM Mono', monospace", color: "#3b82f6", letterSpacing: "0.12em", marginBottom: "1rem" }}>THE PROBLEM</p>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "2rem", fontWeight: 700, lineHeight: 1.25, marginBottom: "1.25rem" }}>
              Creators are flying blind.
            </h2>
            <p style={{ color: "#64748b", lineHeight: 1.75, fontSize: "0.925rem" }}>
              SoundCloud gives you play counts. It doesn't tell you <em>why</em> one track generates 45 reposts while another sits at 8 — despite identical engagement rates.
            </p>
            <p style={{ color: "#64748b", lineHeight: 1.75, fontSize: "0.925rem", marginTop: "1rem" }}>
              The patterns are in the data. They just need something intelligent enough to find them.
            </p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {[
              { stat: "62%", label: "of plays on one track", sub: "while two others are invisible" },
              { stat: "6–7%", label: "consistent like rate", sub: "but wildly different reach" },
              { stat: "45×", label: "repost gap", sub: "between top and bottom track" },
            ].map((item, i) => (
              <div key={i} style={{
                background: "#0d1625", border: "1px solid #1e293b",
                borderRadius: "10px", padding: "1.125rem 1.25rem",
                display: "flex", alignItems: "center", gap: "1rem",
              }}>
                <span style={{ fontSize: "1.5rem", fontFamily: "'Playfair Display', serif", fontWeight: 700, color: "#3b82f6", minWidth: "56px" }}>{item.stat}</span>
                <div>
                  <div style={{ fontSize: "0.8rem", fontWeight: 500, color: "#e2e8f0" }}>{item.label}</div>
                  <div style={{ fontSize: "0.72rem", color: "#475569", marginTop: "0.1rem" }}>{item.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" style={{ padding: "5rem 2rem", maxWidth: "900px", margin: "0 auto" }}>
        <p style={{ fontSize: "0.7rem", fontFamily: "'DM Mono', monospace", color: "#3b82f6", letterSpacing: "0.12em", marginBottom: "1rem", textAlign: "center" }}>HOW IT WORKS</p>
        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "2rem", fontWeight: 700, textAlign: "center", marginBottom: "0.75rem" }}>
          Four agents. One question away.
        </h2>
        <p style={{ color: "#64748b", textAlign: "center", fontSize: "0.9rem", marginBottom: "3rem", maxWidth: "480px", margin: "0 auto 3rem" }}>
          Ask anything. Claude routes your question to the right agent, pulls real data, and responds in plain English.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "0.875rem" }}>
          {[
            { icon: "⬡", color: "#6366f1", label: "Insights", desc: "Pattern analysis across your full catalog. BPM correlations, engagement dynamics, what's actually working and why." },
            { icon: "◎", color: "#10b981", label: "Strategy", desc: "Ranked action plan scoped to your goal — more reposts, growing Germany, improving completion rate." },
            { icon: "◉", color: "#f59e0b", label: "Audience", desc: "Who's listening, how engaged they are, and what the fanbase signals say about your growth ceiling." },
            { icon: "◬", color: "#ef4444", label: "Alerts", desc: "Real-time anomaly detection. Spikes and drops in plays, likes, and reposts — with context and next steps." },
          ].map((agent, i) => (
            <div key={i} className="agent-card" style={{
              background: "#0d1625", border: "1px solid #1e293b",
              borderRadius: "12px", padding: "1.5rem",
              transition: "all 0.2s", cursor: "default",
            }}>
              <div style={{ fontSize: "1.25rem", color: agent.color, marginBottom: "0.75rem" }}>{agent.icon}</div>
              <div style={{ fontSize: "0.875rem", fontWeight: 600, color: "#e2e8f0", marginBottom: "0.5rem" }}>{agent.label}</div>
              <div style={{ fontSize: "0.78rem", color: "#64748b", lineHeight: 1.65 }}>{agent.desc}</div>
            </div>
          ))}
        </div>

        {/* Architecture note */}
        <div style={{
          marginTop: "2rem", background: "#0d1625",
          border: "1px solid #1e293b", borderRadius: "12px",
          padding: "1.25rem 1.5rem",
          display: "flex", alignItems: "center", gap: "1rem",
        }}>
          <span style={{ fontSize: "0.7rem", fontFamily: "'DM Mono', monospace", color: "#3b82f6", border: "1px solid rgba(59,130,246,0.3)", borderRadius: "4px", padding: "0.2rem 0.5rem", whiteSpace: "nowrap" }}>MCP</span>
          <p style={{ fontSize: "0.8rem", color: "#64748b", lineHeight: 1.6 }}>
            Built as a <strong style={{ color: "#94a3b8" }}>Model Context Protocol server</strong> — meaning any AI agent (Claude, GPT, Cursor) can call SoundPulse directly. It's not just a product. It's an intelligence layer.
          </p>
        </div>
      </section>

      {/* Story */}
      <section id="story" style={{ padding: "5rem 2rem", maxWidth: "900px", margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "2rem", alignItems: "start" }}>
          <div>
            <p style={{ fontSize: "0.7rem", fontFamily: "'DM Mono', monospace", color: "#3b82f6", letterSpacing: "0.12em", marginBottom: "1rem" }}>THE BUILDER</p>
            <div style={{ width: "56px", height: "56px", borderRadius: "14px", background: "linear-gradient(135deg, #3b82f6, #6366f1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem", marginBottom: "1rem" }}>🎛️</div>
            <div style={{ fontSize: "0.8rem", color: "#475569", fontFamily: "'DM Mono', monospace", lineHeight: 2 }}>
              <div>Garik Vishnevski</div>
              <div>PM · 7 years</div>
              <div>Project Manager · 8 years</div>
              <div>DJ · Producer · Live</div>
              <div style={{ marginTop: "0.5rem", color: "#3b82f6" }}>Netanya, Israel</div>
            </div>
          </div>
          <div>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.75rem", fontWeight: 700, lineHeight: 1.3, marginBottom: "1.5rem" }}>
              I built this because I am the user.
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {[
                "I've spent 7 years as a Product Manager and 8 as a Project Manager — building teams, shipping products, and leading complex deliveries. I know how to take something from 0 to 1.",
                "I'm also a DJ, music producer, and live performer who's used SoundCloud my entire career. I've always felt the gap between the data available and the decisions I need to make.",
                "SoundPulse is my pivot into music tech — a real product, not a demo. Built solo in 13 weeks with Claude as my co-pilot, using production infrastructure: AWS Lambda, Supabase, Next.js, and the Anthropic API.",
                "The goal isn't just to show what I can build. It's to show what's possible when someone who understands music, product, and AI works on the same problem.",
              ].map((para, i) => (
                <p key={i} style={{ color: "#94a3b8", lineHeight: 1.75, fontSize: "0.9rem" }}>{para}</p>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Stack */}
      <section style={{ padding: "4rem 2rem", maxWidth: "900px", margin: "0 auto" }}>
        <p style={{ fontSize: "0.7rem", fontFamily: "'DM Mono', monospace", color: "#475569", letterSpacing: "0.12em", marginBottom: "1.5rem", textAlign: "center" }}>BUILT WITH</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.625rem", justifyContent: "center" }}>
          {["AWS Lambda", "EventBridge", "SQS", "S3", "Supabase", "Node.js MCP Server", "Next.js", "Claude API (Sonnet)", "Vercel", "Railway"].map((tech, i) => (
            <span key={i} style={{
              fontSize: "0.72rem", fontFamily: "'DM Mono', monospace",
              color: "#475569", border: "1px solid #1e293b",
              borderRadius: "6px", padding: "0.35rem 0.75rem",
              background: "#0d1625",
            }}>{tech}</span>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{
        padding: "6rem 2rem", textAlign: "center",
        borderTop: "1px solid #0d1625",
        position: "relative", overflow: "hidden",
      }}>
        <div style={{
          position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
          width: "500px", height: "500px", borderRadius: "50%",
          background: "radial-gradient(circle, rgba(59,130,246,0.06) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />
        <p style={{ fontSize: "0.7rem", fontFamily: "'DM Mono', monospace", color: "#3b82f6", letterSpacing: "0.12em", marginBottom: "1.25rem" }}>READY TO TRY IT</p>
        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "2.25rem", fontWeight: 700, marginBottom: "1rem", lineHeight: 1.2 }}>
          Ask your first question.
        </h2>
        <p style={{ color: "#64748b", fontSize: "0.9rem", marginBottom: "2.5rem", maxWidth: "400px", margin: "0 auto 2.5rem" }}>
          No setup. No account. Just open the app and start asking.
        </p>
        <a href="/dashboard" className="cta-btn" style={{
          display: "inline-flex", alignItems: "center", gap: "0.5rem",
          background: "#3b82f6", color: "white", fontWeight: 500,
          padding: "1rem 2.25rem", borderRadius: "10px", fontSize: "0.95rem",
          transition: "all 0.2s",
        }}>
          Open SoundPulse <span>→</span>
        </a>
        <div style={{ marginTop: "3rem", fontSize: "0.72rem", color: "#1e293b", fontFamily: "'DM Mono', monospace" }}>
          soundpulse.me · Built by Garik Vishnevski · 2026
        </div>
      </section>
    </div>
  );
}