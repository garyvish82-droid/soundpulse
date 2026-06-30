type Props = {
  suggestions: string[];
  onSelect: (text: string) => void;
  variant?: "card" | "pill";
};

export default function SuggestionChips({ suggestions, onSelect, variant = "card" }: Props) {
  if (variant === "pill") {
    return (
      <div className="flex flex-wrap gap-2 pt-1">
        {suggestions.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => onSelect(s)}
            className="min-h-[36px] rounded-full border border-border bg-transparent px-3 py-1.5 text-[0.7rem] text-text-faint transition-colors hover:border-brand hover:bg-brand/5 hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
          >
            {s}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      {suggestions.map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => onSelect(s)}
          className="min-h-[44px] rounded-lg border border-border border-l-2 border-l-brand/40 bg-surface px-3.5 py-2.5 text-left text-[0.75rem] text-text-faint transition-colors hover:border-brand hover:bg-brand/[0.06] hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
        >
          {s}
        </button>
      ))}
    </div>
  );
}
