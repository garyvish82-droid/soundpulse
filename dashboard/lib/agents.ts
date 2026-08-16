import type { ComponentType, SVGProps } from "react";
import { AlertsIcon, AudienceIcon, InsightsIcon, StrategyIcon } from "@/components/icons";

export type AgentId = "get_insights" | "get_strategy" | "get_audience" | "get_alerts";

export type Agent = {
  id: AgentId;
  label: string;
  desc: string;
  tooltip: string;
  loading: string;
  provenance: string;
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
    provenance: "LIVE DATA",
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
    provenance: "BUILT ON INSIGHTS",
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
    provenance: "DEMO DATA",
    color: "var(--color-agent-audience)",
    icon: AudienceIcon,
    tooltip:
      "Profiles your listener base — casual vs. loyal, and where your growth ceiling sits based on retention and session depth. SoundCloud's public API doesn't expose these behavioral signals, so this view runs on clearly-labeled demo data.",
    loading: "Analysing your listener patterns...",
  },
  {
    id: "get_alerts",
    label: "Alerts",
    desc: "See what changed since yesterday",
    provenance: "LIVE DATA · SCHEDULED",
    color: "var(--color-agent-alerts)",
    icon: AlertsIcon,
    tooltip:
      "A scheduled job that compares your two most recent snapshots and flags any metric that moved sharply — up >15% or down >10% — then tells you what to do about it.",
    loading: "Scanning for spikes and drops across your tracks...",
  },
];

export const SUGGESTIONS = [
  "What's my best track and why?",
  "How do I get more reposts?",
  "What should I focus on this week?",
  "Who is listening to my music?",
];
