"""
SoundPulse Insight Agent
========================
Reads the latest track snapshot from S3, calls Claude API (Sonnet),
and writes structured AI insights to Supabase ai_insights table.

Usage:
    python -m src.agents.insight_agent                    # process user 1329042120
    python -m src.agents.insight_agent --user_id 123456   # process a specific user
    python -m src.agents.insight_agent --dry_run          # print insight, don't write to DB
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
import boto3
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

S3_BUCKET       = os.getenv("S3_BUCKET", "soundpulse-raw-archive")
AWS_REGION      = os.getenv("AWS_REGION", "us-east-1")
SUPABASE_URL    = os.getenv("SUPABASE_URL")
SUPABASE_KEY    = os.getenv("SUPABASE_SERVICE_KEY")
ANTHROPIC_KEY   = os.getenv("ANTHROPIC_API_KEY")
CLAUDE_MODEL    = os.getenv("CLAUDE_MODEL", "claude-sonnet-4-6")
DEFAULT_USER_ID = 1329042120


def get_latest_track_snapshot(user_id: int) -> dict:
    s3 = boto3.client("s3", region_name=AWS_REGION)
    prefix = f"raw/tracks/{user_id}/"
    resp = s3.list_objects_v2(Bucket=S3_BUCKET, Prefix=prefix)
    objects = resp.get("Contents", [])
    while resp.get("IsTruncated"):
        resp = s3.list_objects_v2(Bucket=S3_BUCKET, Prefix=prefix, ContinuationToken=resp["NextContinuationToken"])
        objects.extend(resp.get("Contents", []))
    if not objects:
        raise FileNotFoundError(f"No snapshots found in s3://{S3_BUCKET}/{prefix}")
    latest = max(objects, key=lambda o: o["Key"])
    key = latest["Key"]
    logger.info(f"Reading snapshot: s3://{S3_BUCKET}/{key}")
    obj = s3.get_object(Bucket=S3_BUCKET, Key=key)
    payload = json.loads(obj["Body"].read())
    logger.info(f"Loaded {len(payload.get('data', []))} tracks, collected_at={payload.get('collectedAt')}")
    return payload


SYSTEM_PROMPT = """You are SoundPulse, an AI music analytics agent built for SoundCloud creators.
Your job is to analyze a creator's track data and produce concise, actionable insights.

You think like a music producer AND a data analyst. You speak in plain English, not jargon.
You are direct, specific, and never generic. Every insight must reference actual numbers from the data.

Output ONLY valid JSON matching the schema below. No preamble, no markdown, no explanation.

Schema:
{
  "summary": "2-3 sentence overview of the creator's catalog performance",
  "top_performer": {
    "track_id": int,
    "title": string,
    "reason": "Why this track leads — specific metric(s)"
  },
  "underperformer": {
    "track_id": int,
    "title": string,
    "reason": "Why this track lags — specific metric(s) and likely cause"
  },
  "patterns": [
    "Pattern 1 observed across tracks (e.g. BPM range, genre, engagement rate)",
    "Pattern 2",
    "Pattern 3"
  ],
  "recommendations": [
    {
      "priority": 1,
      "action": "Specific action to take",
      "rationale": "Why, backed by data"
    },
    {
      "priority": 2,
      "action": "...",
      "rationale": "..."
    },
    {
      "priority": 3,
      "action": "...",
      "rationale": "..."
    }
  ],
  "engagement_score": float
}"""


def build_user_prompt(payload: dict) -> str:
    tracks = payload.get("data", [])
    collected_at = payload.get("collectedAt", "unknown")
    user_id = payload.get("userId")
    mode = "MOCK DATA" if payload.get("mock") else "LIVE DATA"
    lines = [
        f"Creator ID: {user_id}",
        f"Data collected: {collected_at} ({mode})",
        f"Total tracks: {len(tracks)}",
        "",
        "Track data:",
    ]
    for t in tracks:
        plays = t.get("playback_count", 0)
        likes = t.get("likes_count", 0)
        reposts = t.get("reposts_count", 0)
        comments = t.get("comment_count", 0)
        duration_min = round(t.get("duration", 0) / 60000, 1)
        like_rate = round(likes / max(plays, 1) * 100, 2)
        repost_rate = round(reposts / max(plays, 1) * 100, 2)
        comment_rate = round(comments / max(plays, 1) * 100, 3)
        lines.append(
            f"- [{t['id']}] \"{t['title']}\""
            f" | Genre: {t.get('genre', 'Unknown')}"
            f" | BPM: {t.get('bpm', 'N/A')}"
            f" | Key: {t.get('key_signature', 'N/A')}"
            f" | Duration: {duration_min}min"
            f" | Plays: {plays:,}"
            f" | Likes: {likes} ({like_rate}%)"
            f" | Reposts: {reposts} ({repost_rate}%)"
            f" | Comments: {comments} ({comment_rate}%)"
            f" | Tags: {t.get('tag_list', 'none')}"
        )
        if t.get("description"):
            lines.append(f"  Description: {t['description']}")
    lines.append("")
    lines.append("Analyze this creator's track performance and respond with JSON only.")
    return "\n".join(lines)


def call_insight_agent(user_prompt: str) -> dict:
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
    # Strip markdown fences if Claude wrapped the JSON
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


def write_insight_to_supabase(user_id: int, insight: dict, snapshot_collected_at: str, track_count: int) -> Optional[str]:
    if not SUPABASE_URL or not SUPABASE_KEY:
        logger.warning("Supabase credentials not set — skipping DB write")
        return None
    db: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    row = {
        "user_id":               str(user_id),
        "agent_type":            "insight",
        "model":                 CLAUDE_MODEL,
        "snapshot_collected_at": snapshot_collected_at,
        "track_count":           track_count,
        "summary":               insight.get("summary"),
        "top_performer_id":      None,
        "top_performer_title":   insight.get("top_performer", {}).get("title"),
        "underperformer_id":     None,
        "underperformer_title":  insight.get("underperformer", {}).get("title"),
        "engagement_score":      insight.get("engagement_score"),
        "patterns":              insight.get("patterns", []),
        "recommendations":       insight.get("recommendations", []),
        "raw_json":              insight,
        "created_at":            datetime.now(timezone.utc).isoformat(),
    }
    try:
        result = db.table("ai_insights").insert(row).execute()
        row_id = result.data[0].get("id") if result.data else None
        logger.info(f"Wrote insight to ai_insights, id={row_id}")
        return row_id
    except Exception as e:
        logger.error(f"Failed to write to Supabase: {e}")
        return None


def run(user_id: int = DEFAULT_USER_ID, dry_run: bool = False) -> dict:
    payload = get_latest_track_snapshot(user_id)
    user_prompt = build_user_prompt(payload)
    insight = call_insight_agent(user_prompt)
    print("\n" + "─" * 60)
    print("SOUNDPULSE INSIGHT AGENT — OUTPUT")
    print("─" * 60)
    print(json.dumps(insight, indent=2))
    print("─" * 60 + "\n")
    if dry_run:
        logger.info("Dry run — skipping Supabase write")
    else:
        row_id = write_insight_to_supabase(
            user_id=user_id,
            insight=insight,
            snapshot_collected_at=payload.get("collectedAt", ""),
            track_count=len(payload.get("data", [])),
        )
        if row_id:
            logger.info(f"✓ Insight saved to ai_insights (id={row_id})")
        else:
            logger.warning("Insight generated but not saved to DB")
    return insight


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="SoundPulse Insight Agent")
    parser.add_argument("--user_id", type=int, default=DEFAULT_USER_ID)
    parser.add_argument("--dry_run", action="store_true")
    args = parser.parse_args()
    try:
        run(user_id=args.user_id, dry_run=args.dry_run)
    except Exception as e:
        logger.error(f"Insight agent failed: {e}")
        sys.exit(1)
