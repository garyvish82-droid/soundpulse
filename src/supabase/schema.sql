-- ============================================================
--  SoundCloud UX MCP — Supabase Schema
--  Run this in: Supabase → SQL Editor → New Query → Run
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── Track Snapshots ─────────────────────────────────────────────────────────
-- Stores point-in-time snapshots of track analytics.
-- Multiple rows per track_id (one per snapshot).
CREATE TABLE IF NOT EXISTS track_snapshots (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    snapshot_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    track_id            BIGINT NOT NULL,
    title               TEXT NOT NULL,
    user_id             BIGINT NOT NULL,
    creator_name        TEXT,
    genre               TEXT,
    duration_ms         INT,
    playback_count      INT DEFAULT 0,
    likes_count         INT DEFAULT 0,
    reposts_count       INT DEFAULT 0,
    comment_count       INT DEFAULT 0,
    download_count      INT DEFAULT 0,
    bpm                 FLOAT,
    key_signature       TEXT,
    created_at          TIMESTAMPTZ      -- when track was originally published
);

CREATE INDEX IF NOT EXISTS idx_track_snapshots_track_id ON track_snapshots(track_id);
CREATE INDEX IF NOT EXISTS idx_track_snapshots_snapshot_at ON track_snapshots(snapshot_at DESC);
CREATE INDEX IF NOT EXISTS idx_track_snapshots_genre ON track_snapshots(genre);


-- ─── Retention Events ────────────────────────────────────────────────────────
-- Simulated/synthetic listener drop-off events (no direct SC API for this —
-- we model from comment timestamps and skip rate proxies).
CREATE TABLE IF NOT EXISTS retention_events (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recorded_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    track_id            BIGINT NOT NULL,
    position_pct        FLOAT NOT NULL,     -- 0–100: where in track
    listener_count      INT NOT NULL,       -- listeners still listening at this point
    session_type        TEXT DEFAULT 'organic',  -- organic | playlist | autoplay | search
    genre               TEXT
);

CREATE INDEX IF NOT EXISTS idx_retention_track_id ON retention_events(track_id);
CREATE INDEX IF NOT EXISTS idx_retention_position ON retention_events(track_id, position_pct);


-- ─── Search Sessions ─────────────────────────────────────────────────────────
-- Tracks what users searched for and what they actually listened to.
-- Key table for discovery gap analysis.
CREATE TABLE IF NOT EXISTS search_sessions (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    search_term         TEXT NOT NULL,
    results_shown       INT DEFAULT 0,
    results_clicked     INT DEFAULT 0,
    tracks_played       INT DEFAULT 0,
    avg_completion_pct  FLOAT DEFAULT 0,    -- avg % listened from search result
    user_segment        TEXT DEFAULT 'unknown', -- casual | engaged | power
    genre_expected      TEXT,               -- inferred genre intent
    genre_found         TEXT                -- actual genre of played tracks
);

CREATE INDEX IF NOT EXISTS idx_search_term ON search_sessions(search_term);
CREATE INDEX IF NOT EXISTS idx_search_at ON search_sessions(session_at DESC);


-- ─── User Sessions ───────────────────────────────────────────────────────────
-- Session-level engagement data. Aggregated per listening session.
CREATE TABLE IF NOT EXISTS user_sessions (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    user_segment        TEXT NOT NULL,      -- casual | engaged | power
    tracks_played       INT DEFAULT 0,
    tracks_completed    INT DEFAULT 0,      -- listened > 80%
    tracks_skipped      INT DEFAULT 0,      -- skipped < 20%
    session_duration_min FLOAT DEFAULT 0,
    genre_diversity     FLOAT DEFAULT 0,    -- 0–1 (1 = all different genres)
    source              TEXT DEFAULT 'direct', -- direct | search | recommendation | playlist
    returned_within_24h BOOLEAN DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_user_sessions_segment ON user_sessions(user_segment);
CREATE INDEX IF NOT EXISTS idx_user_sessions_at ON user_sessions(session_at DESC);


-- ─── Creator Engagement ──────────────────────────────────────────────────────
-- Aggregated creator-level engagement metrics over time.
CREATE TABLE IF NOT EXISTS creator_engagement (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    snapshot_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    creator_id          BIGINT NOT NULL,
    creator_name        TEXT,
    track_count         INT DEFAULT 0,
    total_plays         BIGINT DEFAULT 0,
    total_likes         BIGINT DEFAULT 0,
    total_comments      BIGINT DEFAULT 0,
    total_reposts       BIGINT DEFAULT 0,
    avg_like_rate       FLOAT DEFAULT 0,    -- likes / plays
    avg_comment_rate    FLOAT DEFAULT 0,    -- comments / plays
    avg_repost_rate     FLOAT DEFAULT 0,    -- reposts / plays
    top_genre           TEXT,
    follower_count      INT DEFAULT 0,
    engagement_score    FLOAT DEFAULT 0     -- composite 0–100
);

CREATE INDEX IF NOT EXISTS idx_creator_engagement_creator_id ON creator_engagement(creator_id);
CREATE INDEX IF NOT EXISTS idx_creator_engagement_score ON creator_engagement(engagement_score DESC);


-- ─── UX Insight Reports ──────────────────────────────────────────────────────
-- Stores generated reports for retrieval and comparison over time.
CREATE TABLE IF NOT EXISTS ux_reports (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    generated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    report_type         TEXT NOT NULL DEFAULT 'full', -- full | retention | discovery | feedback
    summary             TEXT,
    insights_json       JSONB,              -- structured insights data
    recommendations     TEXT[],             -- top recommendations array
    tracks_analyzed     INT DEFAULT 0,
    users_analyzed      INT DEFAULT 0,
    html_content        TEXT,               -- full HTML report (for export)
    data_window_days    INT DEFAULT 30
);

CREATE INDEX IF NOT EXISTS idx_ux_reports_generated_at ON ux_reports(generated_at DESC);
CREATE INDEX IF NOT EXISTS idx_ux_reports_type ON ux_reports(report_type);
