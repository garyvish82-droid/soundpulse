"use client";

import { useState, type CSSProperties } from "react";
import type { Agent } from "@/lib/agents";

type Props = {
  agent: Agent;
  isActive: boolean;
  disabled: boolean;
  onRun: (agent: Agent) => void;
};

export default function AgentCard({ agent, isActive, disabled, onRun }: Props) {
  const [isPressed, setIsPressed] = useState(false);
  const Icon = agent.icon;

  function handleClick() {
    if (disabled) return;
    setIsPressed(true);
    setTimeout(() => setIsPressed(false), 220);
    onRun(agent);
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      aria-pressed={isActive}
      aria-label={`Run ${agent.label} agent — ${agent.desc}`}
      className="group relative min-h-[44px] rounded-xl border p-3.5 text-left transition-all duration-150 ease-out
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-bg
        disabled:cursor-not-allowed disabled:opacity-50
        hover:-translate-y-0.5"
      style={{
        background: isActive ? `color-mix(in srgb, ${agent.color} 8%, var(--color-surface))` : "var(--color-surface)",
        borderColor: isActive ? `color-mix(in srgb, ${agent.color} 35%, transparent)` : "var(--color-border)",
        boxShadow: isActive ? `0 0 20px color-mix(in srgb, ${agent.color} 18%, transparent)` : "none",
        transform: isPressed ? "scale(0.97) translateY(1px)" : undefined,
        "--tw-ring-color": agent.color,
      } as CSSProperties}
    >
      <div className="mb-1.5" style={{ color: agent.color }}>
        <Icon size={20} />
      </div>
      <div className="mb-0.5 text-sm font-semibold text-text">{agent.label}</div>
      <div className="text-[0.68rem] leading-[1.3] text-text-faint">{agent.desc}</div>

      {/* Tooltip — hidden on touch devices via hover-only visibility, content is also
          reachable through the visible desc copy above so nothing is hover-only-critical. */}
      <div
        role="tooltip"
        className="agent-tooltip pointer-events-none absolute left-1/2 top-[calc(100%+8px)] z-50 hidden w-[220px] -translate-x-1/2 rounded-lg border p-2.5 text-left text-[0.7rem] leading-[1.55] shadow-2xl group-hover:block group-focus-visible:block"
        style={{
          background: "var(--color-surface-inset)",
          borderColor: `color-mix(in srgb, ${agent.color} 35%, transparent)`,
          color: "var(--color-text-muted)",
        }}
      >
        <div className="mb-1 text-[0.65rem] font-semibold uppercase tracking-wider" style={{ color: agent.color }}>
          {agent.label} agent
        </div>
        {agent.tooltip}
        <div
          className="absolute -top-[5px] left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 border-l border-t"
          style={{ background: "var(--color-surface-inset)", borderColor: `color-mix(in srgb, ${agent.color} 35%, transparent)` }}
        />
      </div>

      {isActive && (
        <div
          className="absolute inset-x-0 bottom-0 h-0.5 animate-pulse-dot"
          style={{ background: `linear-gradient(90deg, transparent, ${agent.color}, transparent)` }}
        />
      )}
    </button>
  );
}
