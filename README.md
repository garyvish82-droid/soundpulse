# SoundPulse — UX Intelligence for SoundCloud

> **An agentic analytics platform that gives AI agents real-time access to SoundCloud usage data and generates actionable UX insights.**
>
> 🌐 **soundpulse.me**

Built by a PM with 15 years of experience to demonstrate product thinking, agentic AI fluency, and the ability to ship in the music-tech space.

---

## What It Does

This MCP server exposes **8 analytical tools** to any MCP-compatible AI client (Claude, etc). Stakeholders interact with the agent in natural language and receive data-backed UX recommendations across three dimensions:

| Dimension | What It Answers |
|-----------|----------------|
| 🎵 **Retention** | Where do listeners drop off? Which tracks have intro problems? |
| 🔍 **Discovery** | What are users searching for that they can't find? |
| 💬 **Creator Feedback** | Which creators have strong communities vs. passive audiences? |

Plus session depth analysis, trend queries, and full stakeholder report export.

---

## Quick Start (5 minutes)

### 1. Clone & Install
```bash
git clone https://github.com/your-username/soundpulse
cd soundcloud-ux-mcp
pip install -r requirements.txt
```

### 2. Configure Environment
```bash
cp .env.example .env
# Fill in: SOUNDCLOUD_CLIENT_ID, SUPABASE_URL, SUPABASE_SERVICE_KEY
```

**SoundCloud API:** Register at https://developers.soundcloud.com/
**Supabase:** Create project at https://app.supabase.com

### 3. Set Up Database
In Supabase → SQL Editor, run:
```sql
-- 1. Schema
\i src/supabase/schema.sql
-- 2. Demo data (for immediate demos without API data)
\i demo/seed_data.sql
```

### 4. Start MCP Server
```bash
# Local (stdio — for Claude Desktop)
python main.py --transport stdio

# Remote (HTTP — for web clients)
python main.py --transport http --port 8080
```

### 5. Open Demo Interface
Open `demo/index.html` in your browser. Works in demo mode immediately.

---

## Available MCP Tools

| Tool | Description |
|------|-------------|
| `sc_get_track_analytics` | Fetch play counts, likes, reposts for any track(s) |
| `sc_analyze_retention` | Full retention curve + critical drop-off analysis |
| `sc_find_discovery_gaps` | Ranked list of search → listen mismatch gaps |
| `sc_get_creator_feedback` | Creator engagement scores vs. platform benchmarks |
| `sc_analyze_session_depth` | Session depth by user segment (casual/engaged/power) |
| `sc_query_trends` | Query historical trend data from Supabase |
| `sc_store_snapshot` | Ingest fresh SoundCloud data into Supabase |
| `sc_generate_ux_report` | Full stakeholder HTML report export |

---

## Architecture

```
Stakeholder (Browser) ──► demo/index.html
                              │
                         FastAPI proxy
                              │
                         MCP Server (FastMCP / Python)
                         /    |    \
                        /     |     \
              SoundCloud   Supabase  Analysis
               API v1       (DB)     Engine
```

**Stack:** Python · FastMCP · Supabase (PostgreSQL) · SoundCloud API v1 · AWS Fargate

---

## Deployment (AWS)

```bash
# Set env vars
export AWS_REGION=us-east-1
export AWS_ECR_REPO=soundcloud-ux-mcp

# Deploy
bash deploy/aws/deploy.sh
```

Or with Docker Compose locally:
```bash
docker-compose -f deploy/docker-compose.yml up
```

---

## Sprint Plan

See [sprints/SPRINT_PLAN.md](sprints/SPRINT_PLAN.md) for the full 3-week build plan (4h × 3 sessions/week).

---

## The Pitch

> *"I built an MCP server that connects to SoundCloud's API, stores behavioral snapshots in Supabase, and exposes 8 analytical tools to an AI agent. Stakeholders can ask natural language questions like 'Where are we losing listeners on hip-hop tracks?' and get instant, data-backed UX recommendations — plus export a full insight report. I built this in 3 weeks to prove I can ship product in the music-tech space."*

---

*SoundPulse · Built with FastMCP · SoundCloud API · Supabase · AWS · soundpulse.me*
## Current status
Currently on Week 7 — Phase: MCP Server — Last completed: All 4 MCP tools live and tested (get_insights, get_strategy, get_audience, get_alerts). Next: connect to Claude.ai for natural language queries.
