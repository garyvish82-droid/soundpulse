production-grade agentic analytics system — architected, built, and deployed solo by a product manager using AI-assisted development.

🌐 soundpulse.me

SoundPulse is an MCP server that exposes a suite of analytical tools to any MCP-compatible AI client (Claude Desktop, etc.). A stakeholder asks a question in natural language — "Where are we losing listeners on hip-hop tracks?" — and the agent selects the right tools, reasons over the results, and returns structured UX recommendations plus an exportable report.

It runs on real infrastructure: a Next.js frontend on Vercel, a containerized FastMCP backend (Docker) on Railway, a scheduled AWS Lambda that ingests SoundCloud data into Postgres, and Supabase — live behind a real domain with SSL..

What this project is — and isn't. SoundPulse demonstrates that a non-engineer PM can architect and ship a complete, deployed agentic system end to end. It is not a live analytics product with a user base, and it does not claim to be. That distinction is deliberate and is reflected honestly throughout this repo — see Data provenance below.

Data provenance (read this first)

SoundCloud's public API (v1) exposes catalog and engagement metrics — play counts, likes, reposts, comments, and track/creator metadata. It does not expose the behavioral signals — listen-through position, session composition, search-query logs — that retention, discovery-gap, and session-depth analysis actually require.

Rather than fake live behavioral data or quietly drop those tools, SoundPulse runs in two explicit modes:

Mode	Data source	What it powers
Live	SoundCloud API v1 — real catalog + engagement metrics	Track analytics, engagement ratios, trend snapshots
Demo	Synthetic seed data modeling a full behavioral integration	Retention curves, discovery gaps, session-depth segmentation

Every tool below is tagged [Live] or [Demo], so there is never ambiguity about where a number came from. Demo-mode outputs are shaped to mirror what a real behavioral integration would return — they demonstrate the analysis and the agent's reasoning, not real user behavior.

This is a data-provenance decision, not a limitation to hide. A system that silently blends real and synthetic data is untrustworthy; one that labels the boundary is honest — and honesty about data sources is a core product-management skill.

Tools
Tool	Mode	Description
sc_get_track_analytics	Live	Play counts, likes, reposts for any track(s)
sc_store_snapshot	Live	Ingest fresh SoundCloud catalog data into Postgres
sc_query_trends	Live	Query historical trend data from stored snapshots
sc_get_creator_feedback	Live*	Engagement ratios vs. benchmarks (*ratios from real data; benchmark baselines illustrative)
sc_analyze_retention	Demo	Retention curve + critical drop-off analysis
sc_find_discovery_gaps	Demo	Ranked search → listen mismatch gaps
sc_analyze_session_depth	Demo	Session depth by user segment (casual / engaged / power)
sc_generate_ux_report	Live + Demo	Full stakeholder HTML report export
Architecture
Stakeholder (Browser) ──► demo/index.html
                              │
                         FastAPI proxy
                              │
                         MCP Server (FastMCP / Python)
                         /    |    \
                        /     |     \
              SoundCloud   Supabase  Analysis
               API v1     (Postgres)  Engine

Stack: Stack: Python · FastMCP (stdio + HTTP transports) · Supabase (PostgreSQL) · SoundCloud API v1 · Docker · Railway (backend) · Vercel (frontend) · AWS Lambda (scheduled ingestion)

Running it

Demo mode works immediately with no API key — every [Demo] tool runs on seed data out of the box.

1. Clone & install

bash
git clone https://github.com/garyvish82-droid/soundpulse
cd soundpulse
pip install -r requirements.txt

2. Configure environment (only needed for [Live] tools)

bash
cp .env.example .env
# Fill in: SOUNDCLOUD_CLIENT_ID, SUPABASE_URL, SUPABASE_SERVICE_KEY

SoundCloud API: register at https://developers.soundcloud.com/ · Supabase: create a project at https://app.supabase.com

3. Set up the database

sql
-- In Supabase → SQL Editor
\i src/supabase/schema.sql      -- schema
\i demo/seed_data.sql           -- synthetic data for [Demo] tools

4. Start the MCP server

bash
python main.py --transport stdio            # local (Claude Desktop)
python main.py --transport http --port 8080 # remote (web clients)

5. Open the demo interface

Open demo/index.html in your browser. Works in demo mode immediately.

## Deployment

SoundPulse runs across three targets, each matched to its job:

- **Frontend (Next.js)** — deployed on Vercel.
- **MCP backend (FastMCP, containerized with Docker)** — deployed on Railway.
- - **Ingestion** — the `soundpulse-collector` AWS Lambda (Python 3.12),
  packaged as a zip, invoked every 15 minutes by an EventBridge schedule
  (`rate(15 minutes)`) to pull SoundCloud metrics into Supabase.

### Local development

Run the MCP server and dependencies locally with Docker Compose:

```bash
docker-compose -f deploy/docker-compose.yml up
```
Why I built it

I'm a product manager with 12+ years across platform, content, and AdTech. I built SoundPulse to show three things by doing them, rather than describing them:

Agentic-systems fluency — MCP tool design, an agent that reasons over tool outputs, and human-in-the-loop review of what it generates.
The ability to ship real infrastructure solo — schema, API integration, containerization, cloud deployment, a live domain — without an engineering team.
Product judgment under a hard constraint — when I found the public API couldn't support the original behavioral-insights thesis, I re-scoped the artifact and labeled the data boundary rather than overclaim.

That last one is the point I care about most.

SoundPulse · Built with FastMCP · SoundCloud API · Supabase · AWS · soundpulse.me
