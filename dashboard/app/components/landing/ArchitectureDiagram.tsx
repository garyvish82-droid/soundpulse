export default function ArchitectureDiagram() {
  return (
    <section className="mx-auto max-w-[700px] px-5 py-16 sm:px-8">
      <p className="mb-2 text-center font-mono text-[0.7rem] tracking-[0.12em] text-text-faint">THE ARCHITECTURE</p>
      <p className="mb-8 text-center text-[0.8rem] text-text-faint">13 weeks. 8 integrated systems. Built solo.</p>
      <div className="rounded-xl border border-border bg-surface-inset p-6 font-mono">
        <svg viewBox="0 0 380 520" width="100%" role="img">
          <title>SoundPulse architecture</title>
          <defs>
            <marker id="arr2" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
              <path d="M2 1L8 5L2 9" fill="none" stroke="context-stroke" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </marker>
          </defs>
          <text x="22" y="58" fontSize="9" fill="#334155" fontFamily="ui-monospace, monospace" letterSpacing="0.08em">SOURCE</text>
          <text x="22" y="158" fontSize="9" fill="#334155" fontFamily="ui-monospace, monospace" letterSpacing="0.08em">COLLECT</text>
          <text x="22" y="258" fontSize="9" fill="#334155" fontFamily="ui-monospace, monospace" letterSpacing="0.08em">STORE</text>
          <text x="22" y="358" fontSize="9" fill="#334155" fontFamily="ui-monospace, monospace" letterSpacing="0.08em">AGENTS</text>
          <text x="22" y="458" fontSize="9" fill="#334155" fontFamily="ui-monospace, monospace" letterSpacing="0.08em">SERVE</text>
          <line x1="72" y1="30" x2="72" y2="490" stroke="#1e293b" strokeWidth="0.5" />

          <rect x="90" y="32" width="200" height="40" rx="6" fill="#0d1625" stroke="#1e3a5f" strokeWidth="0.5" />
          <text x="190" y="48" textAnchor="middle" fontSize="11" fill="#60a5fa" fontFamily="ui-monospace, monospace" fontWeight="500">SoundCloud API</text>
          <text x="190" y="62" textAnchor="middle" fontSize="9" fill="#334155" fontFamily="ui-monospace, monospace">/me/tracks · plays · likes · reposts</text>
          <line x1="190" y1="72" x2="190" y2="132" stroke="#1e3a5f" strokeWidth="1" strokeDasharray="8 4" markerEnd="url(#arr2)" className="arch-line" />
          <text x="200" y="107" fontSize="9" fill="#334155" fontFamily="ui-monospace, monospace">15 min cron</text>

          <rect x="90" y="132" width="90" height="40" rx="6" fill="#0d1625" stroke="#1e3a5f" strokeWidth="0.5" />
          <text x="135" y="148" textAnchor="middle" fontSize="10" fill="#a78bfa" fontFamily="ui-monospace, monospace" fontWeight="500">Lambda</text>
          <text x="135" y="162" textAnchor="middle" fontSize="9" fill="#334155" fontFamily="ui-monospace, monospace">collector</text>
          <rect x="200" y="132" width="90" height="40" rx="6" fill="#0d1625" stroke="#1e3a5f" strokeWidth="0.5" />
          <text x="245" y="148" textAnchor="middle" fontSize="10" fill="#a78bfa" fontFamily="ui-monospace, monospace" fontWeight="500">SQS</text>
          <text x="245" y="162" textAnchor="middle" fontSize="9" fill="#334155" fontFamily="ui-monospace, monospace">queue</text>
          <line x1="180" y1="152" x2="200" y2="152" stroke="#4f46e5" strokeWidth="1" strokeDasharray="8 4" markerEnd="url(#arr2)" className="arch-line" />
          <line x1="190" y1="172" x2="190" y2="232" stroke="#1e293b" strokeWidth="1" strokeDasharray="8 4" markerEnd="url(#arr2)" className="arch-line" />

          <rect x="90" y="232" width="90" height="40" rx="6" fill="#0d1625" stroke="#1e3a5f" strokeWidth="0.5" />
          <text x="135" y="248" textAnchor="middle" fontSize="10" fill="#34d399" fontFamily="ui-monospace, monospace" fontWeight="500">S3</text>
          <text x="135" y="262" textAnchor="middle" fontSize="9" fill="#334155" fontFamily="ui-monospace, monospace">raw archive</text>
          <rect x="200" y="232" width="90" height="40" rx="6" fill="#0d1625" stroke="#1e3a5f" strokeWidth="0.5" />
          <text x="245" y="248" textAnchor="middle" fontSize="10" fill="#34d399" fontFamily="ui-monospace, monospace" fontWeight="500">Supabase</text>
          <text x="245" y="262" textAnchor="middle" fontSize="9" fill="#334155" fontFamily="ui-monospace, monospace">ai_insights</text>
          <line x1="180" y1="252" x2="200" y2="252" stroke="#059669" strokeWidth="1" strokeDasharray="8 4" markerEnd="url(#arr2)" className="arch-line" />
          <line x1="190" y1="272" x2="190" y2="332" stroke="#1e293b" strokeWidth="1" strokeDasharray="8 4" markerEnd="url(#arr2)" className="arch-line" />

          <rect x="90" y="332" width="200" height="42" rx="6" fill="#0d1625" stroke="#d97706" strokeWidth="0.5" />
          <text x="190" y="348" textAnchor="middle" fontSize="10" fill="#fbbf24" fontFamily="ui-monospace, monospace" fontWeight="500">Claude API (Sonnet)</text>
          <text x="190" y="362" textAnchor="middle" fontSize="9" fill="#78716c" fontFamily="ui-monospace, monospace">Insight · Strategy · Anomaly</text>
          <line x1="190" y1="374" x2="190" y2="432" stroke="#d97706" strokeWidth="1" strokeDasharray="8 4" markerEnd="url(#arr2)" className="arch-line" />

          <rect x="90" y="432" width="90" height="40" rx="6" fill="#0d1625" stroke="#3b82f6" strokeWidth="0.5" />
          <text x="135" y="448" textAnchor="middle" fontSize="10" fill="#60a5fa" fontFamily="ui-monospace, monospace" fontWeight="500">MCP Server</text>
          <text x="135" y="462" textAnchor="middle" fontSize="9" fill="#334155" fontFamily="ui-monospace, monospace">Railway</text>
          <rect x="200" y="432" width="90" height="40" rx="6" fill="#0d1625" stroke="#3b82f6" strokeWidth="0.5" />
          <text x="245" y="448" textAnchor="middle" fontSize="10" fill="#60a5fa" fontFamily="ui-monospace, monospace" fontWeight="500">Dashboard</text>
          <text x="245" y="462" textAnchor="middle" fontSize="9" fill="#334155" fontFamily="ui-monospace, monospace">Vercel</text>
          <line x1="180" y1="452" x2="200" y2="452" stroke="#3b82f6" strokeWidth="1" strokeDasharray="8 4" markerEnd="url(#arr2)" className="arch-line" />
          <circle cx="350" cy="452" r="4" fill="#10b981" className="animate-pulse-dot" />
          <text x="344" y="448" textAnchor="end" fontSize="9" fill="#10b981" fontFamily="ui-monospace, monospace">live</text>
        </svg>
      </div>
    </section>
  );
}
