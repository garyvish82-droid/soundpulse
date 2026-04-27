"""
Supabase client wrapper for SoundCloud UX MCP.
Handles all database reads/writes with typed queries.
"""
from __future__ import annotations

import os
import logging
from datetime import datetime, timedelta
from typing import Any, Optional

from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger(__name__)


def get_supabase() -> Client:
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_KEY")
    if not url or not key:
        raise ValueError(
            "SUPABASE_URL and SUPABASE_SERVICE_KEY must be set in .env. "
            "Get them from: https://app.supabase.com → Project Settings → API"
        )
    return create_client(url, key)


class SupabaseRepo:
    """Repository layer for all Supabase operations."""

    def __init__(self):
        self.db = get_supabase()

    # ─── Write ────────────────────────────────────────────────────────────────

    def store_track_snapshot(self, track_data: dict) -> dict:
        result = self.db.table("track_snapshots").insert(track_data).execute()
        return result.data[0] if result.data else {}

    def store_retention_events(self, events: list[dict]) -> int:
        result = self.db.table("retention_events").insert(events).execute()
        return len(result.data or [])

    def store_ux_report(self, report: dict) -> str:
        result = self.db.table("ux_reports").insert(report).execute()
        return result.data[0]["id"] if result.data else ""

    # ─── Read — Track Analytics ───────────────────────────────────────────────

    def get_top_tracks_by_plays(self, limit: int = 20, genre: Optional[str] = None) -> list[dict]:
        q = (
            self.db.table("track_snapshots")
            .select("track_id, title, creator_name, genre, playback_count, likes_count, comment_count, reposts_count, duration_ms")
            .order("playback_count", desc=True)
            .limit(limit)
        )
        if genre:
            q = q.eq("genre", genre)
        return q.execute().data or []

    def get_track_trend(self, track_id: int, days: int = 30) -> list[dict]:
        """Get play count trend for a track over N days."""
        since = (datetime.utcnow() - timedelta(days=days)).isoformat()
        return (
            self.db.table("track_snapshots")
            .select("snapshot_at, playback_count, likes_count, comment_count")
            .eq("track_id", track_id)
            .gte("snapshot_at", since)
            .order("snapshot_at")
            .execute()
            .data or []
        )

    # ─── Read — Retention ─────────────────────────────────────────────────────

    def get_retention_curve(self, track_id: int) -> list[dict]:
        """Get full retention curve for a track."""
        return (
            self.db.table("retention_events")
            .select("position_pct, listener_count, session_type")
            .eq("track_id", track_id)
            .order("position_pct")
            .execute()
            .data or []
        )

    def get_avg_retention_by_genre(self, genre: str) -> dict:
        """Get average retention metrics for a genre."""
        data = (
            self.db.table("retention_events")
            .select("position_pct, listener_count")
            .eq("genre", genre)
            .order("position_pct")
            .execute()
            .data or []
        )
        if not data:
            return {}
        by_pos: dict[float, list[int]] = {}
        for row in data:
            p = round(row["position_pct"] / 10) * 10  # bucket to nearest 10%
            by_pos.setdefault(p, []).append(row["listener_count"])
        return {p: sum(v) / len(v) for p, v in sorted(by_pos.items())}

    # ─── Read — Discovery ─────────────────────────────────────────────────────

    def get_discovery_gaps(self, min_gap_score: float = 40.0) -> list[dict]:
        """Get search terms with low play-through (discovery gaps)."""
        data = (
            self.db.table("search_sessions")
            .select("search_term, results_shown, results_clicked, tracks_played, avg_completion_pct, genre_expected, genre_found")
            .execute()
            .data or []
        )
        gaps = []
        for row in data:
            clicked = row.get("results_clicked") or 1
            played = row.get("tracks_played") or 0
            shown = row.get("results_shown") or 1
            click_rate = clicked / shown
            play_rate  = played / shown
            completion = row.get("avg_completion_pct", 0)
            # Gap score: low play + low completion = high gap
            gap_score = (1 - play_rate) * 50 + (1 - completion / 100) * 50
            if gap_score >= min_gap_score:
                row["gap_score"] = round(gap_score, 1)
                row["click_rate"] = round(click_rate, 3)
                row["play_rate"] = round(play_rate, 3)
                gaps.append(row)
        return sorted(gaps, key=lambda x: x["gap_score"], reverse=True)

    def get_genre_mismatch_rate(self) -> list[dict]:
        """Return search terms where genre_expected != genre_found."""
        data = (
            self.db.table("search_sessions")
            .select("search_term, genre_expected, genre_found, avg_completion_pct")
            .execute()
            .data or []
        )
        return [r for r in data if r.get("genre_expected") != r.get("genre_found")]

    # ─── Read — Creator Feedback ──────────────────────────────────────────────

    def get_top_creators_by_engagement(self, limit: int = 10) -> list[dict]:
        return (
            self.db.table("creator_engagement")
            .select("*")
            .order("engagement_score", desc=True)
            .limit(limit)
            .execute()
            .data or []
        )

    def get_creator_metrics(self, creator_id: int) -> Optional[dict]:
        data = (
            self.db.table("creator_engagement")
            .select("*")
            .eq("creator_id", creator_id)
            .order("snapshot_at", desc=True)
            .limit(1)
            .execute()
            .data
        )
        return data[0] if data else None

    # ─── Read — Session Depth ─────────────────────────────────────────────────

    def get_session_depth_by_segment(self) -> list[dict]:
        """Aggregate session metrics grouped by user segment."""
        data = (
            self.db.table("user_sessions")
            .select("user_segment, tracks_played, tracks_completed, tracks_skipped, session_duration_min, genre_diversity, source, returned_within_24h")
            .execute()
            .data or []
        )
        agg: dict[str, Any] = {}
        for row in data:
            seg = row["user_segment"]
            if seg not in agg:
                agg[seg] = {"sessions": 0, "total_tracks": 0, "total_completed": 0,
                            "total_skipped": 0, "total_duration": 0, "returns": 0}
            a = agg[seg]
            a["sessions"] += 1
            a["total_tracks"]    += row.get("tracks_played", 0)
            a["total_completed"] += row.get("tracks_completed", 0)
            a["total_skipped"]   += row.get("tracks_skipped", 0)
            a["total_duration"]  += row.get("session_duration_min", 0)
            a["returns"]         += 1 if row.get("returned_within_24h") else 0
        result = []
        for seg, a in agg.items():
            s = a["sessions"] or 1
            result.append({
                "user_segment":          seg,
                "avg_tracks_per_session": round(a["total_tracks"] / s, 1),
                "avg_completion_rate":   round(a["total_completed"] / max(a["total_tracks"], 1), 2),
                "avg_skip_rate":         round(a["total_skipped"] / max(a["total_tracks"], 1), 2),
                "avg_session_min":       round(a["total_duration"] / s, 1),
                "return_rate_24h":       round(a["returns"] / s, 2),
            })
        return sorted(result, key=lambda x: x["avg_session_min"], reverse=True)
