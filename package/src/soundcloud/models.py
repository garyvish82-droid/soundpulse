"""
Data models for SoundCloud API responses and internal analytics.
All models use Pydantic v2 for validation and serialization.
"""
from __future__ import annotations
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


# ─── SoundCloud API Models ────────────────────────────────────────────────────

class SCUser(BaseModel):
    id: int
    username: str
    full_name: Optional[str] = None
    followers_count: int = 0
    followings_count: int = 0
    track_count: int = 0
    playlist_count: int = 0
    country: Optional[str] = None
    city: Optional[str] = None
    avatar_url: Optional[str] = None
    created_at: Optional[str] = None


class SCTrack(BaseModel):
    id: int
    title: str
    user: SCUser
    genre: Optional[str] = None
    tag_list: Optional[str] = None
    duration: int = 0                   # milliseconds
    playback_count: int = 0
    likes_count: int = 0
    reposts_count: int = 0
    comment_count: int = 0
    download_count: int = 0
    created_at: Optional[str] = None
    description: Optional[str] = None
    bpm: Optional[float] = None
    key_signature: Optional[str] = None
    sharing: str = "public"             # public | private


class SCComment(BaseModel):
    id: int
    track_id: int
    user: SCUser
    body: str
    timestamp: Optional[int] = None     # ms into track where comment was posted
    created_at: Optional[str] = None


# ─── Analytics & Insight Models ──────────────────────────────────────────────

class RetentionPoint(BaseModel):
    """A single point on a listener retention curve (0–100% through the track)."""
    position_pct: float = Field(..., ge=0, le=100, description="Position in track as percentage")
    listener_pct: float = Field(..., ge=0, le=100, description="% of listeners still listening")
    drop_rate: float = Field(0.0, description="Listener drop % at this point vs previous")
    is_critical_drop: bool = Field(False, description="True if drop > 2x average drop rate")


class RetentionAnalysis(BaseModel):
    track_id: int
    track_title: str
    genre: Optional[str]
    duration_ms: int
    avg_completion_pct: float
    critical_drop_points: list[RetentionPoint]
    retention_score: float              # 0-100: higher = better retention
    insight: str                        # Natural language UX insight
    recommendation: str


class DiscoveryGap(BaseModel):
    """A gap between what users search for and what they actually find/play."""
    search_term: str
    search_volume: int                  # Relative search frequency
    avg_results_played_pct: float       # % of search results that get played
    avg_listen_completion_pct: float    # % of track completed after discovery
    gap_score: float                    # 0–100: higher = bigger gap/opportunity
    insight: str
    recommendation: str


class CreatorFeedbackMetrics(BaseModel):
    creator_id: int
    creator_name: str
    track_count: int
    avg_like_rate: float                # likes / plays
    avg_comment_rate: float             # comments / plays
    avg_repost_rate: float              # reposts / plays
    engagement_score: float             # composite 0–100
    response_to_feedback: str           # "high" | "medium" | "low" — creator responsiveness
    top_performing_genre: Optional[str]
    insight: str
    recommendation: str


class SessionDepthMetrics(BaseModel):
    """How deep users go in a single session."""
    session_id: str
    user_segment: str                   # "casual" | "engaged" | "power"
    tracks_played: int
    avg_completion_pct: float
    genre_diversity: float              # 0–1: 1 = all different genres
    skip_rate: float                    # % of tracks skipped
    return_within_24h: bool
    session_duration_min: float


class UXInsightReport(BaseModel):
    """Full aggregated report for stakeholder presentation."""
    generated_at: datetime
    summary: str
    retention_highlights: list[str]
    discovery_highlights: list[str]
    feedback_highlights: list[str]
    top_3_recommendations: list[str]
    data_freshness: str                 # e.g. "Last 30 days"
    tracks_analyzed: int
    users_analyzed: int
