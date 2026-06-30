import type { ComponentType, SVGProps } from "react";
import { AlertsIcon, AudienceIcon, InsightsIcon, StrategyIcon } from "@/components/icons";

export type AgentId = "get_insights" | "get_strategy" | "get_audience" | "get_alerts";

export type Agent = {
  id: AgentId;
  label: string;
  desc: string;
  tooltip: string;
  loading: string;
  /** Tailwind color tokens (see app/globals.css @theme) shared across dashboard + landing. */
  color: string;
  icon: ComponentType<SVGProps<SVGSVGElement> & { size?: number }>;
};

// Single source of truth for the four agents — previously duplicated (and
// drifting) between dashboard/page.tsx and landing.tsx.
export const AGENTS: Agent[] = [
  {
    id: "get_insights",
    label: "Insights",
    desc: "Find out what's actually working",
    color: "var(--color-agent-insights)",
    icon: InsightsIcon,
    tooltip:
      "Reads your last 32 tracks from SoundCloud. Compares plays, likes, reposts and comments across your catalog. Claude identifies what's working, what's underperforming, and why — with specific numbers.",
    loading: "Reading your tracks from SoundCloud...",
  },
  {
    id: "get_strategy",
    label: "Strategy",
    desc: "Get a ranked to-do list for this week",
    color: "var(--color-agent-strategy)",
    icon: StrategyIcon,
    tooltip:
      "Takes your latest insight report and builds a ranked 5-step action plan. Each action has a timeframe, expected impact, and rationale tied to your actual data. Ask with a goal like \"more reposts\" to get a focused plan.",
    loading: "Building your action plan from latest insights...",
  },
  {
    id: "get_audience",
    label: "Audience",
    desc: "Understand who's listening and why",
    color: "var(--color-agent-audience)",
    icon: AudienceIcon,
    tooltip:
      "Analyses your engagement score, like rate, and catalog patterns to profile your listener base. Tells you whether your audience is casual or loyal, and what your growth ceiling looks like based on current signals.",
    loading: "Analysing your listener patterns...",
  },
  {
    id: "get_alerts",
    label: "Alerts",
    desc: "See what changed since yesterday",
    color: "var(--color-agent-alerts)",
    icon: AlertsIcon,
    tooltip:
      "Compares your two most recent SoundCloud snapshots (collected every 15 min). Flags any metric that spiked >15% or dropped >10% — plays, likes, reposts, or comments — and tells you exactly what to do about it.",
    loading: "Scanning for spikes and drops across your tracks...",
  },
];

export const SUGGESTIONS = [
  "What's my best track and why?",
  "How do I get more reposts?",
  "What should I focus on this week?",
  "Who is listening to my music?",
];
