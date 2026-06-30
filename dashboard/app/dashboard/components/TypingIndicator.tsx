import { Logo } from "@/components/icons";

export default function TypingIndicator({ label }: { label: string }) {
  return (
    <div className="flex gap-3 animate-fade-in">
      <Logo size={28} />
      <div className="flex items-center gap-2 rounded-xl border border-border bg-surface px-4 py-3.5">
        <div className="flex items-center gap-1.5" role="status" aria-label={label}>
          {[0, 150, 300].map((delay) => (
            <span
              key={delay}
              className="h-[5px] w-[5px] rounded-full bg-brand animate-bounce-dot"
              style={{ animationDelay: `${delay}ms` }}
            />
          ))}
        </div>
        <span className="ml-1 font-mono text-[0.7rem] text-text-faint">{label}</span>
      </div>
    </div>
  );
}
