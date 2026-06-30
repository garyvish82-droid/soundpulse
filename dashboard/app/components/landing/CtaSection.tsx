export default function CtaSection() {
  return (
    <section className="relative overflow-hidden border-t border-[#0d1625] px-5 py-24 text-center sm:px-8">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{ background: "radial-gradient(circle, rgba(59,130,246,0.09) 0%, transparent 70%)" }}
      />
      <p className="mb-5 font-mono text-[0.7rem] tracking-[0.12em] text-brand">READY TO TRY IT</p>
      <h2 className="mb-4 font-display text-[2.25rem] font-bold leading-[1.2] text-text">Ask your first question.</h2>
      <p className="mx-auto mb-10 max-w-[400px] text-[0.9rem] text-text-muted">
        No setup. No account. Just open the app and start asking.
      </p>
      <a
        href="/dashboard"
        className="inline-flex items-center gap-2 rounded-xl bg-brand px-9 py-4 text-[0.95rem] font-medium text-white transition-all hover:-translate-y-px hover:bg-brand-strong hover:shadow-[0_8px_30px_rgba(59,130,246,0.3)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
      >
        Open SoundPulse <span aria-hidden="true">→</span>
      </a>
      <div className="mt-12 font-mono text-[0.72rem] text-text-faint/60">
        soundpulse.me · Built by Garik Vishnevski · 2026
      </div>
    </section>
  );
}
