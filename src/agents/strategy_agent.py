"""
SoundPulse Strategy Agent
=========================
Reads the latest insight record from Supabase ai_insights table,
calls Claude API (Sonnet), and writes a ranked strategy plan back
to ai_insights with agent_type='strategy'.

Usage:
    python -m src.agents.strategy_agent                              # process user 1329042120
    python -m src.agents.strategy_agent --user_id 123456             # specific user
    python -m src.agents.strategy_agent --goal "grow Germany"        # goal-scoped strategy
    python -m src.agents.strategy_agent --dry_run                    # print output, skip DB write
    python -m src.agents.strategy_agent --goal "more reposts" --dry_run
"""
from __future__ import annotations

import argparse
import json
import logging
import os
import sys
from datetime import datetime, timezone
from typing import Optional

import anthropic
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

SUPABASE_URL    = os.getenv("SUPABASE_URL")
SUPABASE_KEY    = os.getenv("SUPABASE_SERVICE_KEY")
ANTHROPIC_KEY   = os.getenv("ANTHROPIC_API_KEY")
CLAUDE_MODEL    = os.getenv("CLAUDE_MODEL", "claude-sonnet-4-6")
DEFAULT_USER_ID = 1329042120

VALID_GOALS = [
    "grow plays",
    "grow followers",
    "improve engagement",
    "improve completion rate",
    "more reposts",
    "grow Germany",
    "grow internationally",
    "monetise",
]

SYSTEM_PROMPT = """You are SoundPulse, an AI music strategy agent built for SoundCloud creators.
You receive a creator's AI-generated insight record and an optional goal, and you produce
a concrete, prioritised action plan they can execute this week.

You think like a music industry strategist AND a data analyst. You are direct and specific.
Every recommendation must reference actual numbers, track titles, or patterns from the insight data.
Never give generic advice like "post more consistently" without a specific rationale tied to their data.

Output ONLY valid JSON matching the schema below. No preamble, no markdown, no explanation.

Schema:
{
  "goal": "The goal being optimised for (user-provided or inferred from data)",
  "strategy_summary": "2-3 sentence strategic framing — what is the core opportunity and why now",
  "actions": [
    {
      "priority": 1,
      "timeframe": "This week | This month | Ongoing",
      "action": "Specific, concrete action the creator can take",
      "expected_impact": "What metric moves and by roughly how much",
      "rationale": "Why this action, backed by specific numbers from the insight data"
    },
    {
      "priority": 2,
      "timeframe": "...",
      "action": "...",
      "expected_impact": "...",
      "rationale": "..."
    },
    {
      "priority": 3,
      "timeframe": "...",
      "action": "...",
      "expected_impact": "...",
      "rationale": "..."
    },
    {
      "priority": 4,
      "timeframe": "...",
      "action": "...",
      "expected_impact": "...",
      "rationale": "..."
    },
    {
      "priority": 5,
      "timeframe": "...",
      "action": "...",
      "expected_impact": "...",
      "rationale": "..."
    }
  ],
  "quick_win": "Single highest-leverage action they can do today (1 sentence)",
  "watch_metric": "The one metric that will confirm this strategy is working"
}"""


def get_latest_insight(user_id: int) -> dict:
    if not SUPABASE_URL or not SUPABASE_KEY:
        raise ValueError("SUPABASE_URL or SUPABASE_SERVICE_KEY not set in .env")
    db: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    result = (
        db.table("ai_insights")
        .select("*")
        .eq("user_id", str(user_id))
        .eq("agent_type", "insight")
        .order("created_at", desc=True)
        .limit(1)
        .execute()
    )
    if not result.data:
        raise LookupError(
            f"No insight record found for user_id={user_id}. "
            "Run insight_agent.py first to generate one."
        )
    record = result.data[0]
    logger.info(
        f"Loaded insight id={record['id']} "
        f"created_at={record['created_at']} "
        f"track_count={record.get('track_count')}"
    )
    return record


def build_user_prompt(insight: dict, goal: Optional[str]) -> str:
    raw = insight.get("raw_json") or {}
    if isinstance(raw, str):
        try:
            raw = json.loads(raw)
        except json.JSONDecodeError:
            raw = {}

    patterns = insight.get("patterns") or raw.get("patterns", [])
    recommendations = insight.get("recommendations") or raw.get("recommendations", [])

    lines = [
        "CREATOR INSIGHT DATA",
        "─" * 40,
        f"User ID         : {insight.get('user_id')}",
        f"Track count     : {insight.get('track_count')}",
        f"Insight created : {insight.get('created_at')}",
        f"Engagement score: {insight.get('engagement_score')}",
        "",
        f"Summary: {insight.get('summary')}",
        "",
        f"Top performer   : [{insight.get('top_performer_id')}] \"{insight.get('top_performer_title')}\"",
        f"Underperformer  : [{insight.get('underperformer_id')}] \"{insight.get('underperformer_title')}\"",
        "",
        "Observed patterns:",
    ]
    for i, p in enumerate(patterns, 1):
        lines.append(f"  {i}. {p}")

    lines += ["", "Existing recommendations from insight agent:"]
    for r in recommendations:
        pri = r.get("priority", "?")
        lines.append(f"  [{pri}] {r.get('action')}")
        lines.append(f"       Rationale: {r.get('rationale')}")

    lines += ["", "─" * 40]
    if goal:
        lines.append(f"CREATOR GOAL: \"{goal}\"")
        lines.append("Build a ranked strategy plan optimised for this specific goal.")
    else:
        lines.append("CREATOR GOAL: Not specified.")
        lines.append(
            "Infer the highest-leverage goal from the data and build a strategy plan for it."
        )

    lines.append("")
    lines.append("Respond with JSON only.")
    return "\n".join(lines)


def call_strategy_agent(user_prompt: str) -> dict:
    if not ANTHROPIC_KEY:
        raise ValueError("ANTHROPIC_API_KEY not set in .env")
    client = anthropic.Anthropic(api_key=ANTHROPIC_KEY)
    logger.info(f"Calling Claude API ({CLAUDE_MODEL})...")
    message = client.messages.create(
        model=CLAUDE_MODEL,
        max_tokens=2048,
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": user_prompt}],
    )
    raw_text = message.content[0].text.strip()
    if raw_text.startswith("```"):
        raw_text = raw_text.split("```")[1]
        if raw_text.startswith("json"):
            raw_text = raw_text[4:]
        raw_text = raw_text.strip()
    logger.info(f"Claude responded ({len(raw_text)} chars, stop_reason={message.stop_reason})")
    try:
        return json.loads(raw_text)
    except json.JSONDecodeError as e:
        logger.error(f"Claude returned non-JSON: {raw_text[:500]}")
        raise ValueError(f"Claude response is not valid JSON: {e}") from e


def write_strategy_to_supabase(
    user_id: int,
    strategy: dict,
    source_insight_id: str,
    goal: Optional[str],
    snapshot_collected_at: str,
    track_count: int,
) -> Optional[str]:
    if not SUPABASE_URL or not SUPABASE_KEY:
        logger.warning("Supabase credentials not set — skipping DB write")
        return None
    db: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    row = {
        "user_id":               str(user_id),
        "agent_type":            "strategy",
        "model":                 CLAUDE_MODEL,
        "snapshot_collected_at": snapshot_collected_at,
        "track_count":           track_count,
        "summary":               strategy.get("strategy_summary"),
        "patterns":              [strategy.get("quick_win"), strategy.get("watch_metric")],
        "recommendations":       strategy.get("actions", []),
        "raw_json":              {
            **strategy,
            "source_insight_id": source_insight_id,
            "goal_param":        goal,
        },
        "created_at":            datetime.now(timezone.utc).isoformat(),
    }
    try:
        result = db.table("ai_insights").insert(row).execute()
        row_id = result.data[0].get("id") if result.data else None
        logger.info(f"Wrote strategy to ai_insights, id={row_id}")
        return row_id
    except Exception as e:
        logger.error(f"Failed to write to Supabase: {e}")
        return None


def run(
    user_id: int = DEFAULT_USER_ID,
    goal: Optional[str] = None,
    dry_run: bool = False,
) -> dict:
    insight = get_latest_insight(user_id)
    user_prompt = build_user_prompt(insight, goal)
    strategy = call_strategy_agent(user_prompt)

    print("\n" + "─" * 60)
    print("SOUNDPULSE STRATEGY AGENT — OUTPUT")
    if goal:
        print(f"Goal: {goal}")
    print("─" * 60)
    print(json.dumps(strategy, indent=2))
    print("─" * 60 + "\n")

    if dry_run:
        logger.info("Dry run — skipping Supabase write")
    else:
        row_id = write_strategy_to_supabase(
            user_id=user_id,
            strategy=strategy,
            source_insight_id=insight.get("id"),
            goal=goal,
            snapshot_collected_at=insight.get("snapshot_collected_at", ""),
            track_count=insight.get("track_count", 0),
        )
        if row_id:
            logger.info(f"✓ Strategy saved to ai_insights (id={row_id})")
        else:
            logger.warning("Strategy generated but not saved to DB")

    return strategy


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="SoundPulse Strategy Agent")
    parser.add_argument("--user_id", type=int, default=DEFAULT_USER_ID)
    parser.add_argument(
        "--goal",
        type=str,
        default=None,
        help=f"Optional goal to optimise for. Options: {', '.join(VALID_GOALS)}",
    )
    parser.add_argument("--dry_run", action="store_true")
    args = parser.parse_args()
    try:
        run(user_id=args.user_id, goal=args.goal, dry_run=args.dry_run)
    except Exception as e:
        logger.error(f"Strategy agent failed: {e}")
        sys.exit(1)