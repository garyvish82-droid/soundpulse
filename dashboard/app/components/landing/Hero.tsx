export default function Hero() {
  return (
    <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-5 pt-32 pb-16 text-center sm:px-8">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-[20%] h-[600px] w-[600px] -translate-x-1/2 rounded-full"
        style={{
          background:
            "radial-gradient(ellipse 700px 500px at 50% 30%, rgba(59,130,246,0.13) 0%, rgba(99,102,241,0.06) 50%, transparent 70%)",
        }}
      />

      <div className="animate-fade-up mb-5">
        <span className="rounded-full border border-brand/30 px-3.5 py-1.5 font-mono text-[0.7rem] tracking-[0.15em] text-brand">
          MCP · ANALYTICS · AI
        </span>
      </div>

      <h1
        className="animate-fade-up mb-6 max-w-3xl font-display text-[clamp(2.5rem,7vw,5rem)] font-bold leading-[1.1] tracking-tight text-text"
        style={{ animationDelay: "0.15s" }}
      >
        I built a deployed agentic system —
        <br />
        <em className="text-brand">end to end, solo, with AI.</em>
      </h1>

      <p
        className="animate-fade-up mb-10 max-w-[560px] text-[1.05rem] leading-[1.7] text-text-muted"
        style={{ animationDelay: "0.3s" }}
      >
        SoundPulse is an MCP server on live AWS infrastructure that lets an AI agent answer product questions
        about SoundCloud data in natural language. Built by a product manager to show agentic-systems fluency
        and the ability to ship real infrastructure without an engineering team.
      </p>

      <div
        className="animate-fade-up flex flex-wrap justify-center gap-3.5"
        style={{ animationDelay: "0.45s" }}
      >
        <a
          href="/dashboard"
          className="inline-flex items-center gap-2 rounded-lg bg-brand px-8 py-3.5 text-[0.9rem] font-medium text-white transition-all hover:-translate-y-px hover:bg-brand-strong hover:shadow-[0_8px_30px_rgba(59,130,246,0.3)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
        >
          Open the app <span aria-hidden="true">→</span>
        </a>
        <a
          href="#how"
          className="rounded-lg border border-border-strong px-8 py-3.5 text-[0.9rem] text-text-muted transition-colors hover:border-brand hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
        >
          See how it works
        </a>
      </div>

      <div className="mt-12 flex items-center gap-2">
        <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse-dot" />
        <span className="font-mono text-[0.72rem] text-text-faint">Live on SoundCloud data · Powered by Claude</span>
      </div>

      <p
        className="animate-fade-up mt-6 max-w-[480px] text-center text-[0.78rem] leading-[1.6] text-text-faint"
        style={{ animationDelay: "0.6s" }}
      >
        Live mode uses real SoundCloud engagement metrics. Behavioral analyses — retention, discovery, session
        depth — run on clearly-labeled synthetic data, because the public API doesn&apos;t expose those signals.
      </p>
    </section>
  );
}
