"""
SoundPulse — Collector Lambda Handler
Triggered by EventBridge every 15 minutes.
Fetches SC track + user data, pushes to SQS, archives to S3.

Mode is auto-detected:
  - REAL mode: SC_OAUTH_TOKEN present in SSM → calls SoundCloud API
  - MOCK mode: token missing → uses realistic mock data (dev/unblocked state)
"""
from __future__ import annotations

import asyncio
import json
import logging
import os
import sys
from datetime import datetime

import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "package"))
import boto3

# Allow importing from src/ when running inside Lambda package
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../../"))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../../package"))

from src.soundcloud.client import SoundCloudClient

logger = logging.getLogger()
logger.setLevel(logging.INFO)

sqs = boto3.client("sqs", region_name="us-east-1")
s3  = boto3.client("s3",  region_name="us-east-1")
ssm = boto3.client("ssm", region_name="us-east-1")

_secrets: dict = {}


def _get_ssm_params() -> dict:
    global _secrets
    if _secrets:
        return _secrets

    response = ssm.get_parameters_by_path(
        Path="/soundpulse/",
        WithDecryption=True,
    )

    _secrets = {
        p["Name"].split("/")[-1]: p["Value"]
        for p in response["Parameters"]
    }

    required = {"sc_client_id", "monitored_user_ids"}
    missing = required - set(_secrets.keys())
    if missing:
        raise RuntimeError(f"Missing SSM params: {missing}")

    return _secrets


# ─── Payload builders ─────────────────────────────────────────────────────────

def _build_tracks_payload(user_id: int, collected_at: str, tracks: list[dict], mock: bool) -> dict:
    return {
        "type": "tracks",
        "userId": user_id,
        "collectedAt": collected_at,
        "mock": mock,
        "data": tracks,
    }


def _build_stats_payload(user_id: int, collected_at: str, user: dict, mock: bool) -> dict:
    return {
        "type": "user_stats",
        "userId": user_id,
        "collectedAt": collected_at,
        "mock": mock,
        "data": user,
    }


# ─── Real SC collector ────────────────────────────────────────────────────────

async def _fetch_real_data(client_id: str, access_token: str, user_id: int) -> tuple[list[dict], dict]:
    """
    Calls SoundCloud API and returns (tracks_list, user_dict)
    shaped identically to the mock payloads so downstream SQS
    consumers need zero changes.
    """
    client = SoundCloudClient(
        client_id=client_id,
        access_token=access_token,
    )

    try:
        sc_user   = await client.get_user(user_id)
        sc_tracks = await client.get_user_tracks(user_id, limit=50)

        tracks = [
            {
                "id":             t.id,
                "title":          t.title,
                "playback_count": t.playback_count,
                "likes_count":    t.likes_count,
                "reposts_count":  t.reposts_count,
                "comment_count":  t.comment_count,
                "download_count": t.download_count,
                "genre":          t.genre,
                "tag_list":       t.tag_list,
                "bpm":            t.bpm,
                "key_signature":  t.key_signature,
                "duration":       t.duration,
                "sharing":        t.sharing,
                "created_at":     t.created_at,
                "description":    t.description,
            }
            for t in sc_tracks
        ]

        user = {
            "id":                sc_user.id,
            "username":          sc_user.username,
            "full_name":         sc_user.full_name,
            "followers_count":   sc_user.followers_count,
            "followings_count":  sc_user.followings_count,
            "track_count":       sc_user.track_count,
            "playlist_count":    sc_user.playlist_count,
            "country":           sc_user.country,
            "city":              sc_user.city,
        }

        return tracks, user

    finally:
        await client.close()


def _collect_user_real(
    user_id: int,
    client_id: str,
    access_token: str,
    queue_url: str,
    s3_bucket: str,
    collected_at: str,
) -> dict:
    tracks, user = asyncio.run(_fetch_real_data(client_id, access_token, user_id))

    track_payload = _build_tracks_payload(user_id, collected_at, tracks, mock=False)
    stats_payload = _build_stats_payload(user_id, collected_at, user, mock=False)

    track_key = _archive_to_s3(s3_bucket, track_payload)
    stats_key = _archive_to_s3(s3_bucket, stats_payload)

    _push_to_sqs(queue_url, track_payload)
    _push_to_sqs(queue_url, stats_payload)

    logger.info(f"✓ Real collected user {user_id} — {len(tracks)} tracks")
    return {
        "userId":    user_id,
        "status":    "ok",
        "mock":      False,
        "tracks":    len(tracks),
        "trackKey":  track_key,
        "statsKey":  stats_key,
    }


# ─── Mock collector ───────────────────────────────────────────────────────────

def _mock_tracks(user_id: int, collected_at: str) -> dict:
    return _build_tracks_payload(
        user_id,
        collected_at,
        mock=True,
        tracks=[
            {
                "id":             1001,
                "title":          "Neon Drift",
                "playback_count": 1240,
                "likes_count":    87,
                "reposts_count":  12,
                "comment_count":  5,
                "download_count": 3,
                "genre":          "Electronic",
                "tag_list":       "techno dark melodic",
                "bpm":            128.0,
                "key_signature":  "A minor",
                "duration":       210000,
                "sharing":        "public",
                "created_at":     "2024-01-15T10:00:00Z",
                "description":    "Late night drive through the city.",
            },
            {
                "id":             1002,
                "title":          "Velvet Underground (Original Mix)",
                "playback_count": 3450,
                "likes_count":    210,
                "reposts_count":  45,
                "comment_count":  18,
                "download_count": 22,
                "genre":          "Electronic",
                "tag_list":       "deep house underground",
                "bpm":            124.0,
                "key_signature":  "F major",
                "duration":       385000,
                "sharing":        "public",
                "created_at":     "2024-02-20T14:00:00Z",
                "description":    "Studio session Feb 2024.",
            },
            {
                "id":             1003,
                "title":          "Fade Protocol",
                "playback_count": 890,
                "likes_count":    54,
                "reposts_count":  8,
                "comment_count":  2,
                "download_count": 1,
                "genre":          "Ambient",
                "tag_list":       "ambient chill atmospheric",
                "bpm":            90.0,
                "key_signature":  "C major",
                "duration":       480000,
                "sharing":        "public",
                "created_at":     "2024-03-10T09:00:00Z",
                "description":    None,
            },
        ],
    )


def _mock_user_stats(user_id: int, collected_at: str) -> dict:
    return _build_stats_payload(
        user_id,
        collected_at,
        mock=True,
        user={
            "id":               user_id,
            "username":         "garik_dj",
            "full_name":        "Garik V",
            "followers_count":  320,
            "followings_count": 180,
            "track_count":      12,
            "playlist_count":   3,
            "country":          "IL",
            "city":             "Tel Aviv",
        },
    )


def _collect_user_mock(user_id: int, queue_url: str, s3_bucket: str, collected_at: str) -> dict:
    track_payload = _mock_tracks(user_id, collected_at)
    stats_payload = _mock_user_stats(user_id, collected_at)

    track_key = _archive_to_s3(s3_bucket, track_payload)
    stats_key = _archive_to_s3(s3_bucket, stats_payload)

    _push_to_sqs(queue_url, track_payload)
    _push_to_sqs(queue_url, stats_payload)

    logger.info(f"✓ Mock collected user {user_id}")
    return {"userId": user_id, "status": "ok", "mock": True, "trackKey": track_key, "statsKey": stats_key}


# ─── SQS / S3 helpers ────────────────────────────────────────────────────────

def _push_to_sqs(queue_url: str, payload: dict) -> None:
    sqs.send_message(
        QueueUrl=queue_url,
        MessageBody=json.dumps(payload),
        MessageAttributes={
            "type":   {"DataType": "String", "StringValue": payload["type"]},
            "userId": {"DataType": "String", "StringValue": str(payload["userId"])},
            "mock":   {"DataType": "String", "StringValue": str(payload["mock"])},
        },
    )


def _archive_to_s3(bucket: str, payload: dict) -> str:
    timestamp = datetime.utcnow().isoformat()
    key = f"raw/{payload['type']}/{payload['userId']}/{timestamp}.json"
    s3.put_object(
        Bucket=bucket,
        Key=key,
        Body=json.dumps(payload),
        ContentType="application/json",
    )
    return key


# ─── Token refresh ────────────────────────────────────────────────────────────

import urllib.request
import urllib.parse
import base64

def _token_expired(access_token: str) -> bool:
    """Decode JWT exp claim and check if expired (with 5 min buffer)."""
    try:
        from datetime import timezone
        payload = access_token.split(".")[1]
        payload += "=" * (4 - len(payload) % 4)
        claims = json.loads(base64.b64decode(payload))
        exp = claims.get("exp", 0)
        now = datetime.now(timezone.utc).timestamp()
        return now >= (exp - 300)  # refresh 5 min before expiry
    except Exception:
        return True  # if we can't decode, assume expired


def _refresh_access_token(client_id: str, client_secret: str, refresh_token: str) -> str:
    """Exchange refresh token for a new access token and update SSM."""
    data = urllib.parse.urlencode({
        "grant_type":    "refresh_token",
        "client_id":     client_id,
        "client_secret": client_secret,
        "refresh_token": refresh_token,
    }).encode()

    req = urllib.request.Request(
        "https://api.soundcloud.com/oauth2/token",
        data=data,
        headers={"Content-Type": "application/x-www-form-urlencoded", "Accept": "application/json"},
        method="POST",
    )

    with urllib.request.urlopen(req) as resp:
        tokens = json.loads(resp.read())

    new_access_token  = tokens["access_token"]
    new_refresh_token = tokens.get("refresh_token", refresh_token)

    ssm.put_parameter(Name="/soundpulse/sc_oauth_token",   Value=new_access_token,  Type="SecureString", Overwrite=True)
    ssm.put_parameter(Name="/soundpulse/sc_refresh_token", Value=new_refresh_token, Type="SecureString", Overwrite=True)

    logger.info("✓ Token refreshed and saved to SSM")
    return new_access_token


# ─── Lambda entry point ───────────────────────────────────────────────────────

def handler(event: dict, context) -> dict:
    collected_at = datetime.utcnow().isoformat()
    errors: list[dict] = []
    results: list[dict] = []

    secrets   = _get_ssm_params()
    queue_url = os.environ["SQS_QUEUE_URL"]
    s3_bucket = os.environ["S3_BUCKET"]

    client_id     = secrets.get("sc_client_id")
    client_secret = secrets.get("sc_client_secret", "")
    access_token  = os.environ.get("SC_OAUTH_TOKEN") or secrets.get("sc_oauth_token", "").strip()
    refresh_token = secrets.get("sc_refresh_token", "").strip()

    # Auto-refresh if expired
    if access_token and _token_expired(access_token):
        if refresh_token and client_secret:
            logger.info("Token expired — refreshing...")
            try:
                access_token = _refresh_access_token(client_id, client_secret, refresh_token)
                global _secrets
                _secrets["sc_oauth_token"] = access_token
            except Exception as e:
                logger.error(f"Token refresh failed: {e}")
                access_token = ""
        else:
            logger.warning("Token expired but no refresh_token or client_secret in SSM — falling back to MOCK")
            access_token = ""

    use_real = bool(access_token)

    user_ids = [
        int(uid.strip())
        for uid in secrets["monitored_user_ids"].split(",")
        if uid.strip()
    ]

    mode = "REAL" if use_real else "MOCK"
    if not use_real:
        logger.warning("⚠️  No valid token — running in MOCK mode.")
    logger.info(f"Collector starting — mode={mode}, users={user_ids}")

    for user_id in user_ids:
        try:
            if use_real:
                result = _collect_user_real(
                    user_id, client_id, access_token,
                    queue_url, s3_bucket, collected_at,
                )
            else:
                result = _collect_user_mock(user_id, queue_url, s3_bucket, collected_at)

            results.append(result)

        except Exception as e:
            logger.error(f"✗ Failed user {user_id}: {e}")
            errors.append({"userId": user_id, "error": str(e)})

    summary = {
        "collectedAt": collected_at,
        "mode":        mode,
        "total":       len(user_ids),
        "success":     len(results),
        "failed":      len(errors),
        "errors":      errors,
    }

    logger.info(f"Run summary: {json.dumps(summary)}")
    return {"statusCode": 200, "body": json.dumps(summary)}