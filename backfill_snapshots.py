"""
Backfill analytics_snapshots from S3 JSON files.
Reads all snapshots for a user, writes one row per track per snapshot.
Only processes files >= 1000 bytes (real data, not mock 519-byte files).
"""
import json, os, boto3
from datetime import timezone
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

S3_BUCKET    = os.getenv("S3_BUCKET", "soundpulse-raw-archive")
AWS_REGION   = os.getenv("AWS_REGION", "us-east-1")
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY")
USER_ID      = "1329042120"

s3 = boto3.client("s3", region_name=AWS_REGION)
db = create_client(SUPABASE_URL, SUPABASE_KEY)

prefix = f"raw/tracks/{USER_ID}/"
paginator = s3.get_paginator("list_objects_v2")
all_objects = []
for page in paginator.paginate(Bucket=S3_BUCKET, Prefix=prefix):
    all_objects.extend(page.get("Contents", []))

# Only real data files (519 bytes = mock, 1221 bytes = real)
real_files = [o for o in all_objects if o["Size"] >= 1000]
print(f"Found {len(all_objects)} total files, {len(real_files)} real data files")

rows = []
for obj in real_files:
    key = obj["Key"]
    raw = s3.get_object(Bucket=S3_BUCKET, Key=key)
    payload = json.loads(raw["Body"].read())
    collected_at = payload.get("collectedAt")
    tracks = payload.get("data", [])
    for t in tracks:
        rows.append({
            "user_id":        USER_ID,
            "track_id":       t["id"],
            "track_title":    t.get("title"),
            "collected_at":   collected_at,
            "playback_count": t.get("playback_count", 0),
            "likes_count":    t.get("likes_count", 0),
            "reposts_count":  t.get("reposts_count", 0),
            "comment_count":  t.get("comment_count", 0),
        })

print(f"Inserting {len(rows)} rows ({len(real_files)} snapshots x 3 tracks)...")

# Batch insert in chunks of 500
for i in range(0, len(rows), 500):
    chunk = rows[i:i+500]
    db.table("analytics_snapshots").insert(chunk).execute()
    print(f"  Inserted rows {i}–{i+len(chunk)}")

print("✓ Backfill complete")
