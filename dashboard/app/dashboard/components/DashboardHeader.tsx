import { Logo } from "@/components/icons";

export default function DashboardHeader() {
  return (
    <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center justify-between border-b border-border bg-bg px-4 sm:px-6">
      <div className="flex items-center gap-3">
        <Logo size={24} />
        <span className="text-sm font-semibold tracking-tight text-text">SoundPulse</span>
        <span className="hidden text-xs text-text-faint sm:inline">Analytics</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full rounded-full bg-success animate-pulse-dot" />
        </span>
        <span className="font-mono text-[0.7rem] text-text-faint">Garik · SoundCloud</span>
      </div>
    </header>
  );
}
