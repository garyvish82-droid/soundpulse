import { InsightsIcon } from "@/components/icons";
import { SUGGESTIONS } from "@/lib/agents";
import SuggestionChips from "./SuggestionChips";

const STATS: [string, string][] = [
  ["6.8", "Engagement score"],
  ["32", "Tracks analysed"],
  ["3.75×", "Top repost gap"],
];

export default function EmptyState({ onSelectSuggestion }: { onSelectSuggestion: (text: string) => void }) {
  return (
    <div className="flex min-h-[300px] flex-col items-center justify-center gap-7">
      {/* Example output preview */}
      <div className="w-full max-w-[520px] rounded-xl border border-border bg-surface p-4">
        <div className="mb-3 flex items-center gap-1.5 border-b border-border pb-2.5">
          <InsightsIcon size={14} style={{ color: "var(--color-agent-insights)" }} />
          <span className="font-mono text-[0.65rem] tracking-wide text-text-faint">
            INSIGHTS AGENT · EXAMPLE OUTPUT
          </span>
        </div>
        <p className="mb-3 text-[0.78rem] leading-relaxed text-text-muted">
          Your top track has <strong className="font-semibold text-text">3.75× more reposts</strong> than your
          catalog average — and it&apos;s the only track with a description. Your like rate is a consistent{" "}
          <strong className="font-semibold text-text">6–7%</strong> across all tracks, which means your audience
          quality is strong. The bottleneck is <strong className="font-semibold text-text">reach, not quality.</strong>
        </p>
        <div className="flex gap-2">
          {STATS.map(([val, label]) => (
            <div key={label} className="flex-1 rounded-md bg-surface-inset px-2.5 py-2">
              <div className="text-[0.85rem] font-semibold text-text">{val}</div>
              <div className="mt-0.5 text-[0.62rem] text-text-faint">{label}</div>
            </div>
          ))}
        </div>
        <div className="mt-2.5 font-mono text-[0.65rem] text-text-faint/70">
          ↑ Click any agent above to run this on your real data
        </div>
      </div>

      {/* Suggestion chips */}
      <div className="w-full max-w-[520px]">
        <p className="mb-2.5 font-mono text-[0.65rem] uppercase tracking-wider text-text-faint">Or ask anything:</p>
        <SuggestionChips suggestions={SUGGESTIONS} onSelect={onSelectSuggestion} variant="card" />
      </div>
    </div>
  );
}
