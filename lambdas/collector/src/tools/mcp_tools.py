"""
All MCP tool definitions for the SoundCloud UX Agent.

Tools registered here are exposed to any MCP-compatible AI client (Claude, etc).
Each tool is a self-contained async function with full type hints.

Tool naming convention: sc_<action>_<object>
"""
from __future__ import annotations

import logging
from typing import Optional

from fastmcp import FastMCP

from ..soundcloud.client import SoundCloudClient
from ..supabase.client import SupabaseRepo
from ..analysis.retention import analyze_retention_curve, compare_genre_retention
from ..analysis.discovery import analyze_discovery_gaps, get_top_opportunities
from ..analysis.feedback import analyze_creator_feedback, analyze_platform_feedback_health
from ..analysis.reports import generate_html_report, build_report_from_analyses

logger = logging.getLogger(__name__)

mcp = FastMCP("soundpulse")
_sc  = SoundCloudClient()
_db  = SupabaseRepo()


# ─── Tool 1: Track Analytics ──────────────────────────────────────────────────

@mcp.tool(
    description=(
        "Fetch real-time analytics for one or more SoundCloud tracks. "
        "Returns play counts, likes, reposts, comments, and BPM. "
        "Use track_ids (list of ints) OR a search_query string. "
        "Best for: understanding which tracks are performing and why."
    )
)
async def sc_get_track_analytics(
    track_ids: Optional[list[int]] = None,
    search_query: Optional[str] = None,
    genre: Optional[str] = None,
    limit: int = 10,
) -> dict:
    """
    Returns analytics for SoundCloud tracks.
    Provide either specific track_ids or a search_query (or both).
    """
    if not track_ids and not search_query:
        return {"error": "Provide at least one of: track_ids or search_query"}

    tracks = []

    if track_ids:
        tracks = await _sc.get_tracks_analytics_batch(track_ids)
    elif search_query:
        tracks = await _sc.search_tracks(search_query, limit=limit, genre=genre)

    if not tracks:
        return {"tracks": [], "message": "No tracks found"}

    return {
        "tracks": [
            {
                "id":             t.id,
                "title":          t.title,
                "creator":        t.user.username,
                "genre":          t.genre,
                "duration_sec":   round(t.duration / 1000),
                "playback_count": t.playback_count,
                "likes_count":    t.likes_count,
                "reposts_count":  t.reposts_count,
                "comment_count":  t.comment_count,
                "bpm":            t.bpm,
                "like_rate":      round(t.likes_count / max(t.playback_count, 1), 4),
                "comment_rate":   round(t.comment_count / max(t.playback_count, 1), 5),
            }
            for t in tracks[:limit]
        ],
        "total_returned": len(tracks[:limit]),
    }


# ─── Tool 2: Retention Analysis ───────────────────────────────────────────────

@mcp.tool(
    description=(
        "Analyze listener retention for a specific track. "
        "Returns the retention curve, critical drop-off points, retention score (0–100), "
        "and a specific UX insight with actionable recommendation. "
        "Best for: understanding WHERE listeners leave and WHY."
    )
)
async def sc_analyze_retention(
    track_id: int,
    compare_to_genre_avg: bool = True,
) -> dict:
    """
    Returns full retention analysis for a track using stored behavioral data.
    """
    # Get track metadata from SoundCloud
    try:
        track = await _sc.get_track(track_id)
    except Exception as e:
        return {"error": f"Could not fetch track {track_id}: {e}"}

    # Get retention curve from Supabase
    raw_curve = _db.get_retention_curve(track_id)
    if not raw_curve:
        return {
            "track_id":    track_id,
            "track_title": track.title,
            "message":     "No retention data yet. Run sc_store_snapshot to collect data.",
        }

    analysis = analyze_retention_curve(
        track_id=track_id,
        track_title=track.title,
        genre=track.genre,
        duration_ms=track.duration,
        raw_curve=raw_curve,
    )

    result = {
        "track_id":           analysis.track_id,
        "track_title":        analysis.track_title,
        "genre":              analysis.genre,
        "retention_score":    analysis.retention_score,
        "avg_completion_pct": analysis.avg_completion_pct,
        "critical_drop_points": [
            {
                "position_pct": p.position_pct,
                "listener_pct": p.listener_pct,
                "drop_rate":    p.drop_rate,
            }
            for p in analysis.critical_drop_points
        ],
        "insight":        analysis.insight,
        "recommendation": analysis.recommendation,
    }

    if compare_to_genre_avg and track.genre:
        genre_avg_curve = _db.get_avg_retention_by_genre(track.genre)
        if genre_avg_curve:
            genre_avg_completion = genre_avg_curve.get(80.0, 50.0)
            result["genre_comparison"] = compare_genre_retention(
                analysis.avg_completion_pct, track.genre, genre_avg_completion
            )

    return result


# ─── Tool 3: Discovery Gaps ───────────────────────────────────────────────────

@mcp.tool(
    description=(
        "Find discovery gaps — search terms where users can't find satisfying content. "
        "Returns ranked gaps with gap score (0–100), insight, and recommendation. "
        "Higher gap score = bigger UX problem and product opportunity. "
        "Best for: improving search, surfacing content strategy gaps."
    )
)
async def sc_find_discovery_gaps(
    min_gap_score: float = 40.0,
    top_n: int = 10,
    genre_filter: Optional[str] = None,
) -> dict:
    """
    Returns the top N discovery gaps ranked by impact.
    """
    raw_gaps = _db.get_discovery_gaps(min_gap_score=min_gap_score)
    mismatches = _db.get_genre_mismatch_rate()

    gaps = analyze_discovery_gaps(raw_gaps)
    if genre_filter:
        gaps = [g for g in gaps if genre_filter.lower() in g.search_term.lower()]

    top = get_top_opportunities(gaps, n=top_n)

    return {
        "total_gaps_found": len(gaps),
        "genre_mismatches": len(mismatches),
        "top_discovery_gaps": [
            {
                "search_term":              g.search_term,
                "gap_score":                g.gap_score,
                "avg_results_played_pct":   g.avg_results_played_pct,
                "avg_listen_completion_pct": g.avg_listen_completion_pct,
                "insight":                  g.insight,
                "recommendation":           g.recommendation,
            }
            for g in top
        ],
        "summary": (
            f"Found {len(gaps)} discovery gaps above score {min_gap_score}. "
            f"Top opportunity: '{top[0].search_term}' (gap score: {top[0].gap_score})."
            if top else "No significant gaps found."
        ),
    }


# ─── Tool 4: Creator Feedback Loop ────────────────────────────────────────────

@mcp.tool(
    description=(
        "Analyze the feedback loop health between creators and listeners. "
        "Returns engagement scores, like/comment/repost rates vs. benchmarks, "
        "and creator-specific recommendations. "
        "Best for: understanding which creators have strong communities vs. passive audiences."
    )
)
async def sc_get_creator_feedback(
    creator_id: Optional[int] = None,
    top_n: int = 5,
    min_engagement_score: float = 0.0,
) -> dict:
    """
    Returns creator feedback loop analysis.
    Provide creator_id for a specific creator, or omit for platform-wide top creators.
    """
    if creator_id:
        creator_data = _db.get_creator_metrics(creator_id)
        if not creator_data:
            return {"error": f"Creator {creator_id} not found. Run sc_store_snapshot first."}
        metrics = analyze_creator_feedback(creator_data)
        return {
            "creator_id":        metrics.creator_id,
            "creator_name":      metrics.creator_name,
            "engagement_score":  metrics.engagement_score,
            "like_rate":         metrics.avg_like_rate,
            "comment_rate":      metrics.avg_comment_rate,
            "repost_rate":       metrics.avg_repost_rate,
            "feedback_health":   metrics.response_to_feedback,
            "top_genre":         metrics.top_performing_genre,
            "insight":           metrics.insight,
            "recommendation":    metrics.recommendation,
        }
    else:
        top_creators = _db.get_top_creators_by_engagement(limit=top_n * 2)
        all_metrics  = [analyze_creator_feedback(c) for c in top_creators]
        filtered = [m for m in all_metrics if m.engagement_score >= min_engagement_score][:top_n]
        platform_health = analyze_platform_feedback_health(top_creators)

        return {
            "platform_health": platform_health,
            "top_creators": [
                {
                    "creator_name":      m.creator_name,
                    "engagement_score":  m.engagement_score,
                    "feedback_health":   m.response_to_feedback,
                    "top_genre":         m.top_performing_genre,
                    "insight":           m.insight,
                    "recommendation":    m.recommendation,
                }
                for m in filtered
            ],
        }


# ─── Tool 5: Session Depth & Retention ───────────────────────────────────────

@mcp.tool(
    description=(
        "Analyze user session depth — how deeply different user segments engage per session. "
        "Returns avg tracks per session, skip rates, completion rates, and 24h return rates "
        "broken down by user segment (casual / engaged / power). "
        "Best for: understanding stickiness and identifying which segment needs attention."
    )
)
async def sc_analyze_session_depth(
    user_segment: Optional[str] = None,
) -> dict:
    """
    Returns session depth metrics by user segment.
    user_segment: 'casual' | 'engaged' | 'power' | None (all segments)
    """
    all_segments = _db.get_session_depth_by_segment()

    if user_segment:
        filtered = [s for s in all_segments if s["user_segment"] == user_segment]
        if not filtered:
            return {"error": f"No data for segment '{user_segment}'. Valid: casual, engaged, power"}
        data = filtered
    else:
        data = all_segments

    insights = []
    for seg in data:
        skip = seg.get("avg_skip_rate", 0)
        comp = seg.get("avg_completion_rate", 0)
        ret  = seg.get("return_rate_24h", 0)
        name = seg["user_segment"]

        if skip > 0.4:
            insights.append(f"{name.capitalize()} users have a high skip rate ({skip:.0%}) — content relevance or playlist quality needs work.")
        if comp < 0.5:
            insights.append(f"{name.capitalize()} users complete less than half of tracks they start ({comp:.0%}) — intro quality may be the issue.")
        if ret < 0.3:
            insights.append(f"Only {ret:.0%} of {name} users return within 24h — notification strategy or habit loop needs strengthening.")
        if comp > 0.7 and ret > 0.6:
            insights.append(f"{name.capitalize()} users are highly engaged: {comp:.0%} completion and {ret:.0%} 24h return — protect this segment!")

    return {
        "segments": data,
        "insights": insights,
        "summary": (
            f"Analyzed {len(data)} user segment(s). "
            + (f"Key concern: {insights[0]}" if insights else "All segments show healthy engagement.")
        ),
    }


# ─── Tool 6: Query Trends ─────────────────────────────────────────────────────

@mcp.tool(
    description=(
        "Query historical trends from Supabase. "
        "Get top tracks by plays, genre performance, or track growth over time. "
        "Best for: understanding what's trending, which genres are growing, historical context."
    )
)
async def sc_query_trends(
    query_type: str = "top_tracks",
    genre: Optional[str] = None,
    limit: int = 10,
    track_id: Optional[int] = None,
    days: int = 30,
) -> dict:
    """
    Query trend data from the Supabase historical store.
    query_type: 'top_tracks' | 'track_history' | 'genre_summary'
    """
    if query_type == "top_tracks":
        tracks = _db.get_top_tracks_by_plays(limit=limit, genre=genre)
        return {
            "query": "top_tracks",
            "genre_filter": genre,
            "results": tracks,
            "count":   len(tracks),
        }

    elif query_type == "track_history":
        if not track_id:
            return {"error": "track_id is required for query_type='track_history'"}
        history = _db.get_track_trend(track_id, days=days)
        return {
            "query":    "track_history",
            "track_id": track_id,
            "days":     days,
            "data_points": history,
            "count":    len(history),
        }

    elif query_type == "genre_summary":
        all_tracks = _db.get_top_tracks_by_plays(limit=200)
        genres: dict = {}
        for t in all_tracks:
            g = t.get("genre", "Unknown") or "Unknown"
            if g not in genres:
                genres[g] = {"tracks": 0, "total_plays": 0, "total_likes": 0}
            genres[g]["tracks"]      += 1
            genres[g]["total_plays"] += t.get("playback_count", 0)
            genres[g]["total_likes"] += t.get("likes_count", 0)
        sorted_genres = sorted(genres.items(), key=lambda x: x[1]["total_plays"], reverse=True)
        return {
            "query": "genre_summary",
            "genres": [
                {"genre": g, **stats, "avg_likes_per_track": round(stats["total_likes"] / max(stats["tracks"], 1))}
                for g, stats in sorted_genres[:limit]
            ],
        }

    return {"error": f"Unknown query_type: {query_type}. Use: top_tracks, track_history, genre_summary"}


# ─── Tool 7: Store Snapshot ───────────────────────────────────────────────────

@mcp.tool(
    description=(
        "Ingest fresh SoundCloud data into Supabase for trend tracking. "
        "Fetches current analytics for specified tracks (or trending tracks) and stores them. "
        "Run this periodically (e.g. daily) to build historical data. "
        "Best for: populating the data store before running analysis."
    )
)
async def sc_store_snapshot(
    track_ids: Optional[list[int]] = None,
    genre: Optional[str] = None,
    trending: bool = False,
    limit: int = 50,
) -> dict:
    """
    Fetches current analytics and stores a snapshot in Supabase.
    """
    tracks = []
    if trending or (not track_ids):
        tracks = await _sc.get_trending_tracks(genre=genre or "all-music", limit=limit)
    elif track_ids:
        tracks = await _sc.get_tracks_analytics_batch(track_ids)

    stored = 0
    for t in tracks:
        try:
            _db.store_track_snapshot({
                "track_id":       t.id,
                "title":          t.title,
                "user_id":        t.user.id,
                "creator_name":   t.user.username,
                "genre":          t.genre,
                "duration_ms":    t.duration,
                "playback_count": t.playback_count,
                "likes_count":    t.likes_count,
                "reposts_count":  t.reposts_count,
                "comment_count":  t.comment_count,
                "download_count": t.download_count,
                "bpm":            t.bpm,
                "created_at":     t.created_at,
            })
            stored += 1
        except Exception as e:
            logger.warning(f"Failed to store track {t.id}: {e}")

    return {
        "stored":  stored,
        "skipped": len(tracks) - stored,
        "message": f"Stored {stored} track snapshots. Run sc_query_trends to analyze.",
    }


# ─── Tool 8: Generate UX Report ───────────────────────────────────────────────

@mcp.tool(
    description=(
        "Generate a full UX Insight Report combining retention, discovery, and feedback analysis. "
        "Returns an HTML report ready to share with stakeholders. "
        "Best for: stakeholder presentations, weekly product reviews, executive summaries. "
        "The report is saved to Supabase for retrieval."
    )
)
async def sc_generate_ux_report(
    data_window_days: int = 30,
    top_tracks_limit: int = 20,
) -> dict:
    """
    Generates and stores a comprehensive UX insight report.
    Returns HTML content and a Supabase report ID.
    """
    # Gather data
    top_tracks  = _db.get_top_tracks_by_plays(limit=top_tracks_limit)
    raw_gaps    = _db.get_discovery_gaps(min_gap_score=40.0)
    all_creators = _db.get_top_creators_by_engagement(limit=10)
    sessions    = _db.get_session_depth_by_segment()

    # Run analyses
    retention_analyses = []
    for t in top_tracks[:5]:  # analyze top 5 tracks for depth
        curve = _db.get_retention_curve(t["track_id"])
        if curve:
            ra = analyze_retention_curve(
                track_id=t["track_id"],
                track_title=t["title"],
                genre=t.get("genre"),
                duration_ms=t.get("duration_ms", 0),
                raw_curve=curve,
            )
            retention_analyses.append(ra)

    discovery_gaps = analyze_discovery_gaps(raw_gaps)
    creator_metrics = [analyze_creator_feedback(c) for c in all_creators]

    # Build report
    report = build_report_from_analyses(
        retention_analyses=retention_analyses,
        discovery_gaps=discovery_gaps[:10],
        creator_metrics=creator_metrics,
        tracks_analyzed=len(top_tracks),
        users_analyzed=sum(s.get("avg_tracks_per_session", 0) for s in sessions),
        data_window_days=data_window_days,
    )

    html = generate_html_report(report, extra_context={
        "retention_score": round(
            sum(r.retention_score for r in retention_analyses) / max(len(retention_analyses), 1), 1
        ),
        "discovery_gap_count": len(discovery_gaps),
    })

    # Persist to Supabase
    report_id = _db.store_ux_report({
        "report_type":    "full",
        "summary":        report.summary,
        "insights_json":  {
            "retention":  [r.model_dump() for r in retention_analyses],
            "discovery":  [g.model_dump() for g in discovery_gaps[:10]],
            "feedback":   [m.model_dump() for m in creator_metrics],
        },
        "recommendations": report.top_3_recommendations,
        "tracks_analyzed":  report.tracks_analyzed,
        "users_analyzed":   int(report.users_analyzed),
        "html_content":     html,
        "data_window_days": data_window_days,
    })

    return {
        "report_id":   report_id,
        "summary":     report.summary,
        "recommendations": report.top_3_recommendations,
        "html_length": len(html),
        "message":     "Full report generated. HTML content in 'html_preview' (first 2000 chars).",
        "html_preview": html[:2000],
    }
