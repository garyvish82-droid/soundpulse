import { AGENTS } from "@/lib/agents";

export default function HowItWorks() {
  return (
    <section id="how" className="mx-auto max-w-[900px] px-5 py-20 sm:px-8">
      <p className="mb-4 text-center font-mono text-[0.7rem] tracking-[0.12em] text-brand">HOW IT WORKS</p>
      <h2 className="mb-3 text-center font-display text-[2rem] font-bold text-text">
        Four agents. One question away.
      </h2>
      <p className="mx-auto mb-12 max-w-[480px] text-center text-[0.9rem] text-text-muted">
        Ask anything. Claude routes your question to the right agent, pulls real data, and responds in plain
        English.
      </p>

      <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        {AGENTS.map((agent) => {
          const Icon = agent.icon;
          return (
            <div
              key={agent.id}
              className="rounded-xl border border-border bg-surface-inset p-6 transition-all duration-200 hover:-translate-y-0.5"
              style={{ borderTopColor: `color-mix(in srgb, ${agent.color} 45%, transparent)`, borderTopWidth: 2 }}
            >
              <div className="mb-3" style={{ color: agent.color }}>
                <Icon size={22} />
              </div>
              <div className="mb-2 text-sm font-semibold text-text">{agent.label}</div>
              <div className="text-[0.78rem] leading-[1.65] text-text-faint">{agent.tooltip}</div>
            </div>
          );
        })}
      </div>

      <div className="mt-8 flex items-center gap-4 rounded-xl border border-border bg-surface-inset px-6 py-5">
        <span className="whitespace-nowrap rounded border border-brand/30 px-2 py-0.5 font-mono text-[0.7rem] text-brand">
          MCP
        </span>
        <p className="text-[0.8rem] leading-relaxed text-text-faint">
          Built as a <strong className="text-text-muted">Model Context Protocol server</strong> — meaning any AI
          agent (Claude, GPT, Cursor) can call SoundPulse directly. It&apos;s not just a product. It&apos;s an
          intelligence layer.
        </p>
      </div>
    </section>
  );
}
