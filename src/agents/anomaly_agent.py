"""
SoundPulse Anomaly Agent
"""
from __future__ import annotations
import argparse, json, logging, os, sys
from collections import defaultdict
from datetime import datetime, timezone, timedelta
from typing import Optional
import anthropic, boto3
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

SUPABASE_URL    = os.getenv("SUPABASE_URL")
SUPABASE_KEY    = os.getenv("SUPABASE_SERVICE_KEY")
ANTHROPIC_KEY   = os.getenv("ANTHROPIC_API_KEY")
CLAUDE_MODEL    = os.getenv("CLAUDE_MODEL", "claude-sonnet-4-6")
S3_BUCKET       = os.getenv("S3_BUCKET", "soundpulse-raw-archive")
AWS_REGION      = os.getenv("AWS_REGION", "us-east-1")
DEFAULT_USER_ID = 1329042120
SPIKE_THRESHOLD = 0.15
DROP_THRESHOLD  = 0.10
LOOKBACK_DAYS   = 7
METRICS         = ["playback_count", "likes_count", "reposts_count", "comment_count"]

SYSTEM_PROMPT = """You are SoundPulse, an AI anomaly detection agent for SoundCloud creators.
You receive detected metric anomalies and produce clear, actionable alert descriptions.
Every alert must reference actual numbers: current value, baseline, and % change.
For spikes, explain what likely caused them and how to capitalise on the momentum.
For drops, explain the likely cause and what action to take immediately.
Output ONLY valid JSON matching this schema. No preamble, no markdown, no explanation.
{
  "alert_count": int,
  "severity": "high" | "medium" | "low" | "none",
  "summary": "1-2 sentence overview of what is happening across the catalog right now",
  "alerts": [
    {
      "track_id": int,
      "track_title": string,
      "metric": string,
      "alert_type": "spike" | "drop",
      "current_value": int,
      "baseline_value": float,
      "change_pct": float,
      "severity": "high" | "medium" | "low",
      "description": "Plain English description with exact numbers",
      "action": "Specific immediate action the creator should take right now"
    }
  ],
  "no_alerts_reason": "Only present if alert_count is 0"
}"""


def get_snapshots(user_id: int) -> list[dict]:
    """Load the two most recent real track snapshots from S3 and flatten into per-track rows."""
    s3 = boto3.client("s3", region_name=AWS_REGION)
    prefix = f"raw/tracks/{user_id}/"
    resp = s3.list_objects_v2(Bucket=S3_BUCKET, Prefix=prefix)
    objects = resp.get("Contents", [])
    while resp.get("IsTruncated"):
        resp = s3.list_objects_v2(Bucket=S3_BUCKET, Prefix=prefix, ContinuationToken=resp["NextContinuationToken"])
        objects.extend(resp.get("Contents", []))

    # Only consider real snapshots (size > 5000 bytes = has real tracks)
    real = sorted([o for o in objects if o["Size"] > 5000], key=lambda o: o["Key"])
    if len(real) < 2:
        logger.warning(f"Only {len(real)} real snapshot(s) found — need at least 2 for delta analysis")
        if not real:
            raise LookupError(f"No real snapshots found for user_id={user_id}")
        # Use single snapshot with zeros as baseline
        real = [real[-1]]

    # Take the two most recent
    to_load = real[-2:]
    rows = []
    for obj in to_load:
        body = s3.get_object(Bucket=S3_BUCKET, Key=obj["Key"])["Body"].read()
        payload = json.loads(body)
        collected_at = payload.get("collectedAt", obj["Key"])
        for t in payload.get("data", []):
            rows.append({
                "track_id":       t["id"],
                "track_title":    t.get("title", f"Track {t['id']}"),
                "collected_at":   collected_at,
                "playback_count": t.get("playback_count", 0),
                "likes_count":    t.get("likes_count", 0),
                "reposts_count":  t.get("reposts_count", 0),
                "comment_count":  t.get("comment_count", 0),
            })

    logger.info(f"Loaded {len(rows)} track rows from {len(to_load)} S3 snapshots")
    return rows


def compute_deltas(snapshots: list[dict]) -> list[dict]:
    by_track: dict[int, list[dict]] = defaultdict(list)
    for row in snapshots:
        by_track[row["track_id"]].append(row)
    anomalies = []
    for track_id, rows in by_track.items():
        rows.sort(key=lambda r: r["collected_at"])
        if len(rows) < 2:
            logger.info(f"Track {track_id}: only {len(rows)} snapshot(s), skipping")
            continue
        latest   = rows[-1]
        previous = rows[-2]
        for metric in METRICS:
            current_val  = latest.get(metric) or 0
            previous_val = previous.get(metric) or 0
            if previous_val == 0:
                continue
            change_pct = (current_val - previous_val) / previous_val
            if change_pct >= SPIKE_THRESHOLD:
                alert_type = "spike"
                severity = "high" if change_pct >= 0.30 else "medium" if change_pct >= 0.20 else "low"
            elif change_pct <= -DROP_THRESHOLD:
                alert_type = "drop"
                severity = "high" if change_pct <= -0.25 else "medium" if change_pct <= -0.15 else "low"
            else:
                continue
            anomalies.append({
                "track_id":       track_id,
                "track_title":    latest.get("track_title", f"Track {track_id}"),
                "metric":         metric,
                "alert_type":     alert_type,
                "current_value":  current_val,
                "baseline_value": round(float(previous_val), 2),
                "change_pct":     round(change_pct * 100, 2),
                "severity":       severity,
            })
            logger.info(f"Anomaly: track={track_id} metric={metric} type={alert_type} change={change_pct*100:.1f}% current={current_val} previous={previous_val}")
    logger.info(f"Detected {len(anomalies)} anomalies across {len(by_track)} tracks")
    return anomalies


def build_user_prompt(user_id: int, anomalies: list[dict]) -> str:
    lines = [
        f"Creator ID: {user_id}",
        f"Analysis timestamp: {datetime.now(timezone.utc).isoformat()}",
        f"Detection method: point-in-time delta (latest vs previous snapshot)",
        f"Spike threshold: +{int(SPIKE_THRESHOLD*100)}%",
        f"Drop threshold: -{int(DROP_THRESHOLD*100)}%",
        "",
    ]
    if not anomalies:
        lines += ["ANOMALIES DETECTED: 0", "All metrics within normal range.", "Respond with JSON showing alert_count=0 and a no_alerts_reason."]
    else:
        lines += [f"ANOMALIES DETECTED: {len(anomalies)}", "", "Anomaly data:"]
        for a in anomalies:
            direction = "above" if a["alert_type"] == "spike" else "below"
            lines.append(f"- [{a['alert_type'].upper()}] Track {a['track_id']} \"{a['track_title']}\" | Metric: {a['metric']} | Current: {a['current_value']} | Previous: {a['baseline_value']} | Change: {a['change_pct']:+.1f}% {direction} previous | Severity: {a['severity']}")
    lines += ["", "Respond with JSON only."]
    return "\n".join(lines)


def call_anomaly_agent(user_prompt: str) -> dict:
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


def write_alerts_to_supabase(user_id: int, result: dict, anomalies: list[dict]) -> Optional[str]:
    if not SUPABASE_URL or not SUPABASE_KEY:
        logger.warning("Supabase credentials not set — skipping DB write")
        return None
    db: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    row = {
        "user_id":               str(user_id),
        "agent_type":            "anomaly",
        "model":                 CLAUDE_MODEL,
        "snapshot_collected_at": datetime.now(timezone.utc).isoformat(),
        "track_count":           len(set(a["track_id"] for a in anomalies)) if anomalies else 0,
        "summary":               result.get("summary") or result.get("no_alerts_reason"),
        "patterns":              [f"alert_count={result.get('alert_count', 0)}", f"severity={result.get('severity', 'none')}"],
        "recommendations":       result.get("alerts", []),
        "raw_json":              {**result, "raw_anomalies": anomalies, "thresholds": {"spike": SPIKE_THRESHOLD, "drop": DROP_THRESHOLD, "lookback_days": LOOKBACK_DAYS}},
        "created_at":            datetime.now(timezone.utc).isoformat(),
    }
    try:
        res = db.table("ai_insights").insert(row).execute()
        row_id = res.data[0].get("id") if res.data else None
        logger.info(f"Wrote anomaly report to ai_insights, id={row_id}")
        return row_id
    except Exception as e:
        logger.error(f"Failed to write to Supabase: {e}")
        return None


def run(user_id: int = DEFAULT_USER_ID, dry_run: bool = False) -> dict:
    snapshots = get_snapshots(user_id)
    if not snapshots:
        raise LookupError(f"No snapshots found for user_id={user_id} in the last {LOOKBACK_DAYS} days.")
    anomalies = compute_deltas(snapshots)
    user_prompt = build_user_prompt(user_id, anomalies)
    result = call_anomaly_agent(user_prompt)
    print("\n" + "─" * 60)
    print("SOUNDPULSE ANOMALY AGENT — OUTPUT")
    print("─" * 60)
    print(json.dumps(result, indent=2))
    print("─" * 60 + "\n")
    if dry_run:
        logger.info("Dry run — skipping Supabase write")
    else:
        row_id = write_alerts_to_supabase(user_id, result, anomalies)
        if row_id:
            logger.info(f"✓ Anomaly report saved to ai_insights (id={row_id})")
        else:
            logger.warning("Anomaly report generated but not saved to DB")
    return result


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="SoundPulse Anomaly Agent")
    parser.add_argument("--user_id", type=int, default=DEFAULT_USER_ID)
    parser.add_argument("--dry_run", action="store_true")
    args = parser.parse_args()
    try:
        run(user_id=args.user_id, dry_run=args.dry_run)
    except Exception as e:
        logger.error(f"Anomaly agent failed: {e}")
        sys.exit(1)
