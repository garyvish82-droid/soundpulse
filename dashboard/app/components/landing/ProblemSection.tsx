const STATS: { stat: string; label: string; sub: string }[] = [
  { stat: "62%", label: "of plays on one track", sub: "while two others are invisible" },
  { stat: "6–7%", label: "consistent like rate", sub: "but wildly different reach" },
  { stat: "45×", label: "repost gap", sub: "between top and bottom track" },
];

export default function ProblemSection() {
  return (
    <section className="border-y border-[#0f1e30] bg-[#0d1625]/70 px-5 py-20 sm:px-8">
      <div className="mx-auto grid max-w-[900px] items-center gap-8 sm:grid-cols-2">
        <div>
          <p className="mb-4 font-mono text-[0.7rem] tracking-[0.12em] text-brand">THE PROBLEM</p>
          <h2 className="mb-5 font-display text-[2rem] font-bold leading-[1.25] text-text">
            Creators are flying blind.
          </h2>
          <p className="text-[0.925rem] leading-[1.75] text-text-muted">
            SoundCloud gives you play counts. It doesn&apos;t tell you <em>why</em> one track generates 45 reposts
            while another sits at 8 — despite identical engagement rates.
          </p>
          <p className="mt-4 text-[0.925rem] leading-[1.75] text-text-muted">
            The patterns are in the data. They just need something intelligent enough to find them.
          </p>
        </div>
        <div className="flex flex-col gap-3">
          {STATS.map((item) => (
            <div
              key={item.label}
              className="flex items-center gap-4 rounded-xl border border-border border-l-2 border-l-brand/50 bg-surface-inset px-5 py-[1.125rem]"
            >
              <span className="min-w-[56px] font-display text-2xl font-bold text-brand">{item.stat}</span>
              <div>
                <div className="text-[0.8rem] font-medium text-text">{item.label}</div>
                <div className="mt-0.5 text-[0.72rem] text-text-faint">{item.sub}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
