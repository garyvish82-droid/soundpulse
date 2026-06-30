/**
 * Tiny, dependency-free renderer for the lightweight markdown subset Claude's
 * agent responses use (headings, bullets, numbered lists, bold). Kept
 * intentionally small rather than pulling in a full markdown library.
 */
function boldToHtml(line: string) {
  return line.replace(/\*\*(.*?)\*\*/g, '<strong class="text-text font-semibold">$1</strong>');
}

export default function MarkdownText({ text }: { text: string }) {
  const lines = text.split("\n");
  return (
    <div className="space-y-1.5">
      {lines.map((line, i) => {
        if (line.startsWith("### "))
          return (
            <h3 key={i} className="mt-4 mb-1 text-[0.7rem] font-semibold uppercase tracking-wider text-text-faint">
              {line.slice(4)}
            </h3>
          );
        if (line.startsWith("## "))
          return (
            <h2 key={i} className="mt-4 mb-1 text-[0.85rem] font-semibold text-text">
              {line.slice(3)}
            </h2>
          );
        if (line.startsWith("# "))
          return (
            <h1 key={i} className="mt-4 mb-2 text-base font-bold text-text">
              {line.slice(2)}
            </h1>
          );
        if (line.startsWith("- ") || line.startsWith("* "))
          return (
            <div key={i} className="flex gap-2 text-text-muted">
              <span className="mt-[0.2rem] shrink-0 text-brand" aria-hidden="true">›</span>
              <span dangerouslySetInnerHTML={{ __html: boldToHtml(line.slice(2)) }} />
            </div>
          );
        if (line.match(/^\d+\./))
          return (
            <div key={i} className="flex gap-3 text-text-muted">
              <span className="mt-[0.15rem] min-w-[1rem] shrink-0 text-[0.75rem] text-brand">
                {line.match(/^\d+/)?.[0]}
              </span>
              <span dangerouslySetInnerHTML={{ __html: boldToHtml(line.replace(/^\d+\.\s*/, "")) }} />
            </div>
          );
        if (line.trim() === "") return <div key={i} className="h-1" />;
        return (
          <p key={i} className="leading-relaxed text-text-muted" dangerouslySetInnerHTML={{ __html: boldToHtml(line) }} />
        );
      })}
    </div>
  );
}
